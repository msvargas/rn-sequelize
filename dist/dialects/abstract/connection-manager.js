"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const {
  Pool,
  TimeoutError
} = require("sequelize-pool");

const _ = require("lodash");

const semver = require("semver");

const Promise = require("../../promise");

const errors = require("../../errors");

const {
  logger
} = require("../../utils/logger");

const debug = logger.debugContext("pool");
/**
 * Abstract Connection Manager
 *
 * Connection manager which handles pooling & replication.
 * Uses sequelize-pool for pooling
 *
 * @private
 */

let ConnectionManager =
/*#__PURE__*/
function () {
  function ConnectionManager(dialect, sequelize) {
    _classCallCheck(this, ConnectionManager);

    const config = _.cloneDeep(sequelize.config);

    this.sequelize = sequelize;
    this.config = config;
    this.dialect = dialect;
    this.versionPromise = null;
    this.dialectName = this.sequelize.options.dialect;

    if (config.pool === false) {
      throw new Error("Support for pool:false was removed in v4.0");
    }

    config.pool = _.defaults(config.pool || {}, {
      max: 5,
      min: 0,
      idle: 10000,
      acquire: 60000,
      evict: 1000,
      validate: this._validate.bind(this)
    });
    this.initPools();
  }

  _createClass(ConnectionManager, [{
    key: "refreshTypeParser",
    value: function refreshTypeParser(dataTypes) {
      _.each(dataTypes, dataType => {
        if (Object.prototype.hasOwnProperty.call(dataType, "parse")) {
          if (dataType.types[this.dialectName]) {
            this._refreshTypeParser(dataType);
          } else {
            throw new Error(`Parse function not supported for type ${dataType.key} in dialect ${this.dialectName}`);
          }
        }
      });
    }
    /**
     * Try to load dialect module from various configured options.
     * Priority goes like dialectModulePath > dialectModule > require(default)
     *
     *
     * @private
     * @returns {Object}
     */

  }, {
    key: "_loadDialectModule",
    value: function _loadDialectModule() {
      const dialectModule = this.sequelize.config.dialectModule || window;

      if (!dialectModule) {
        if (this.sequelize.config.dialectModulePath) {
          throw new Error(`Unable to load dialectModule at ${this.sequelize.config.dialectModule}`);
        }

        throw new Error(`Please add parameter dialectModule in config manually`);
      }

      return dialectModule;
    }
    /**
     * Handler which executes on process exit or connection manager shutdown
     *
     * @private
     * @returns {Promise}
     */

  }, {
    key: "_onProcessExit",
    value: function _onProcessExit() {
      if (!this.pool) {
        return Promise.resolve();
      }

      return this.pool.drain().then(() => {
        debug("connection drain due to process exit");
        return this.pool.destroyAllNow();
      });
    }
    /**
     * Drain the pool and close it permanently
     *
     * @returns {Promise}
     */

  }, {
    key: "close",
    value: function close() {
      // Mark close of pool
      this.getConnection = function getConnection() {
        return Promise.reject(new Error("ConnectionManager.getConnection was called after the connection manager was closed!"));
      };

      return this._onProcessExit();
    }
    /**
     * Initialize connection pool. By default pool autostart is set to false, so no connection will be
     * be created unless `pool.acquire` is called.
     */

  }, {
    key: "initPools",
    value: function initPools() {
      const config = this.config;

      if (!config.replication) {
        this.pool = new Pool({
          name: "sequelize",
          create: () => this._connect(config),
          destroy: connection => {
            return this._disconnect(connection).tap(() => {
              debug("connection destroy");
            });
          },
          validate: config.pool.validate,
          max: config.pool.max,
          min: config.pool.min,
          acquireTimeoutMillis: config.pool.acquire,
          idleTimeoutMillis: config.pool.idle,
          reapIntervalMillis: config.pool.evict
        });
        debug(`pool created with max/min: ${config.pool.max}/${config.pool.min}, no replication`);
        return;
      }

      if (!Array.isArray(config.replication.read)) {
        config.replication.read = [config.replication.read];
      } // Map main connection config


      config.replication.write = _.defaults(config.replication.write, _.omit(config, "replication")); // Apply defaults to each read config

      config.replication.read = config.replication.read.map(readConfig => _.defaults(readConfig, _.omit(this.config, "replication"))); // custom pooling for replication (original author @janmeier)

      let reads = 0;
      this.pool = {
        release: client => {
          if (client.queryType === "read") {
            this.pool.read.release(client);
          } else {
            this.pool.write.release(client);
          }
        },
        acquire: (queryType, useMaster) => {
          useMaster = useMaster === undefined ? false : useMaster;

          if (queryType === "SELECT" && !useMaster) {
            return this.pool.read.acquire();
          }

          return this.pool.write.acquire();
        },
        destroy: connection => {
          this.pool[connection.queryType].destroy(connection);
          debug("connection destroy");
        },
        destroyAllNow: () => {
          return Promise.join(this.pool.read.destroyAllNow(), this.pool.write.destroyAllNow()).tap(() => {
            debug("all connections destroyed");
          });
        },
        drain: () => {
          return Promise.join(this.pool.write.drain(), this.pool.read.drain());
        },
        read: new Pool({
          name: "sequelize:read",
          create: () => {
            // round robin config
            const nextRead = reads++ % config.replication.read.length;
            return this._connect(config.replication.read[nextRead]).tap(connection => {
              connection.queryType = "read";
            });
          },
          destroy: connection => this._disconnect(connection),
          validate: config.pool.validate,
          max: config.pool.max,
          min: config.pool.min,
          acquireTimeoutMillis: config.pool.acquire,
          idleTimeoutMillis: config.pool.idle,
          reapIntervalMillis: config.pool.evict
        }),
        write: new Pool({
          name: "sequelize:write",
          create: () => {
            return this._connect(config.replication.write).tap(connection => {
              connection.queryType = "write";
            });
          },
          destroy: connection => this._disconnect(connection),
          validate: config.pool.validate,
          max: config.pool.max,
          min: config.pool.min,
          acquireTimeoutMillis: config.pool.acquire,
          idleTimeoutMillis: config.pool.idle,
          reapIntervalMillis: config.pool.evict
        })
      };
      debug(`pool created with max/min: ${config.pool.max}/${config.pool.min}, with replication`);
    }
    /**
     * Get connection from pool. It sets database version if it's not already set.
     * Call pool.acquire to get a connection
     *
     * @param {Object}   [options]                 Pool options
     * @param {string}   [options.type]            Set which replica to use. Available options are `read` and `write`
     * @param {boolean}  [options.useMaster=false] Force master or write replica to get connection from
     *
     * @returns {Promise<Connection>}
     */

  }, {
    key: "getConnection",
    value: function getConnection(options) {
      options = options || {};
      let promise;

      if (this.sequelize.options.databaseVersion === 0) {
        if (this.versionPromise) {
          promise = this.versionPromise;
        } else {
          promise = this.versionPromise = this._connect(this.config.replication.write || this.config).then(connection => {
            const _options = {};
            _options.transaction = {
              connection
            }; // Cheat .query to use our private connection

            _options.logging = () => {};

            _options.logging.__testLoggingFn = true; //connection might have set databaseVersion value at initialization,
            //avoiding a useless round trip

            if (this.sequelize.options.databaseVersion === 0) {
              return this.sequelize.databaseVersion(_options).then(version => {
                const parsedVersion = _.get(semver.coerce(version), "version") || version;
                this.sequelize.options.databaseVersion = semver.valid(parsedVersion) ? parsedVersion : this.defaultVersion;
                this.versionPromise = null;
                return this._disconnect(connection);
              });
            }

            this.versionPromise = null;
            return this._disconnect(connection);
          }).catch(err => {
            this.versionPromise = null;
            throw err;
          });
        }
      } else {
        promise = Promise.resolve();
      }

      return promise.then(() => {
        return this.pool.acquire(options.type, options.useMaster).catch(error => {
          if (error instanceof TimeoutError) throw new errors.ConnectionAcquireTimeoutError(error);
          throw error;
        });
      }).tap(() => {
        debug("connection acquired");
      });
    }
    /**
     * Release a pooled connection so it can be utilized by other connection requests
     *
     * @param {Connection} connection
     *
     * @returns {Promise}
     */

  }, {
    key: "releaseConnection",
    value: function releaseConnection(connection) {
      return Promise.try(() => {
        this.pool.release(connection);
        debug("connection released");
      });
    }
    /**
     * Call dialect library to get connection
     *
     * @param {*} config Connection config
     * @private
     * @returns {Promise<Connection>}
     */

  }, {
    key: "_connect",
    value: function _connect(config) {
      return this.sequelize.runHooks("beforeConnect", config).then(() => this.dialect.connectionManager.connect(config)).then(connection => this.sequelize.runHooks("afterConnect", connection, config).return(connection));
    }
    /**
     * Call dialect library to disconnect a connection
     *
     * @param {Connection} connection
     * @private
     * @returns {Promise}
     */

  }, {
    key: "_disconnect",
    value: function _disconnect(connection) {
      return this.sequelize.runHooks("beforeDisconnect", connection).then(() => this.dialect.connectionManager.disconnect(connection)).then(() => this.sequelize.runHooks("afterDisconnect", connection));
    }
    /**
     * Determine if a connection is still valid or not
     *
     * @param {Connection} connection
     *
     * @returns {boolean}
     */

  }, {
    key: "_validate",
    value: function _validate(connection) {
      if (!this.dialect.connectionManager.validate) {
        return true;
      }

      return this.dialect.connectionManager.validate(connection);
    }
  }]);

  return ConnectionManager;
}();

module.exports = ConnectionManager;
module.exports.ConnectionManager = ConnectionManager;
module.exports.default = ConnectionManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9hYnN0cmFjdC9jb25uZWN0aW9uLW1hbmFnZXIuanMiXSwibmFtZXMiOlsiUG9vbCIsIlRpbWVvdXRFcnJvciIsInJlcXVpcmUiLCJfIiwic2VtdmVyIiwiUHJvbWlzZSIsImVycm9ycyIsImxvZ2dlciIsImRlYnVnIiwiZGVidWdDb250ZXh0IiwiQ29ubmVjdGlvbk1hbmFnZXIiLCJkaWFsZWN0Iiwic2VxdWVsaXplIiwiY29uZmlnIiwiY2xvbmVEZWVwIiwidmVyc2lvblByb21pc2UiLCJkaWFsZWN0TmFtZSIsIm9wdGlvbnMiLCJwb29sIiwiRXJyb3IiLCJkZWZhdWx0cyIsIm1heCIsIm1pbiIsImlkbGUiLCJhY3F1aXJlIiwiZXZpY3QiLCJ2YWxpZGF0ZSIsIl92YWxpZGF0ZSIsImJpbmQiLCJpbml0UG9vbHMiLCJkYXRhVHlwZXMiLCJlYWNoIiwiZGF0YVR5cGUiLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJ0eXBlcyIsIl9yZWZyZXNoVHlwZVBhcnNlciIsImtleSIsImRpYWxlY3RNb2R1bGUiLCJ3aW5kb3ciLCJkaWFsZWN0TW9kdWxlUGF0aCIsInJlc29sdmUiLCJkcmFpbiIsInRoZW4iLCJkZXN0cm95QWxsTm93IiwiZ2V0Q29ubmVjdGlvbiIsInJlamVjdCIsIl9vblByb2Nlc3NFeGl0IiwicmVwbGljYXRpb24iLCJuYW1lIiwiY3JlYXRlIiwiX2Nvbm5lY3QiLCJkZXN0cm95IiwiY29ubmVjdGlvbiIsIl9kaXNjb25uZWN0IiwidGFwIiwiYWNxdWlyZVRpbWVvdXRNaWxsaXMiLCJpZGxlVGltZW91dE1pbGxpcyIsInJlYXBJbnRlcnZhbE1pbGxpcyIsIkFycmF5IiwiaXNBcnJheSIsInJlYWQiLCJ3cml0ZSIsIm9taXQiLCJtYXAiLCJyZWFkQ29uZmlnIiwicmVhZHMiLCJyZWxlYXNlIiwiY2xpZW50IiwicXVlcnlUeXBlIiwidXNlTWFzdGVyIiwidW5kZWZpbmVkIiwiam9pbiIsIm5leHRSZWFkIiwibGVuZ3RoIiwicHJvbWlzZSIsImRhdGFiYXNlVmVyc2lvbiIsIl9vcHRpb25zIiwidHJhbnNhY3Rpb24iLCJsb2dnaW5nIiwiX190ZXN0TG9nZ2luZ0ZuIiwidmVyc2lvbiIsInBhcnNlZFZlcnNpb24iLCJnZXQiLCJjb2VyY2UiLCJ2YWxpZCIsImRlZmF1bHRWZXJzaW9uIiwiY2F0Y2giLCJlcnIiLCJ0eXBlIiwiZXJyb3IiLCJDb25uZWN0aW9uQWNxdWlyZVRpbWVvdXRFcnJvciIsInRyeSIsInJ1bkhvb2tzIiwiY29ubmVjdGlvbk1hbmFnZXIiLCJjb25uZWN0IiwicmV0dXJuIiwiZGlzY29ubmVjdCIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUFFQSxNQUFNO0FBQUVBLEVBQUFBLElBQUY7QUFBUUMsRUFBQUE7QUFBUixJQUF5QkMsT0FBTyxDQUFDLGdCQUFELENBQXRDOztBQUNBLE1BQU1DLENBQUMsR0FBR0QsT0FBTyxDQUFDLFFBQUQsQ0FBakI7O0FBQ0EsTUFBTUUsTUFBTSxHQUFHRixPQUFPLENBQUMsUUFBRCxDQUF0Qjs7QUFDQSxNQUFNRyxPQUFPLEdBQUdILE9BQU8sQ0FBQyxlQUFELENBQXZCOztBQUNBLE1BQU1JLE1BQU0sR0FBR0osT0FBTyxDQUFDLGNBQUQsQ0FBdEI7O0FBQ0EsTUFBTTtBQUFFSyxFQUFBQTtBQUFGLElBQWFMLE9BQU8sQ0FBQyxvQkFBRCxDQUExQjs7QUFDQSxNQUFNTSxLQUFLLEdBQUdELE1BQU0sQ0FBQ0UsWUFBUCxDQUFvQixNQUFwQixDQUFkO0FBRUE7Ozs7Ozs7OztJQVFNQyxpQjs7O0FBQ0osNkJBQVlDLE9BQVosRUFBcUJDLFNBQXJCLEVBQWdDO0FBQUE7O0FBQzlCLFVBQU1DLE1BQU0sR0FBR1YsQ0FBQyxDQUFDVyxTQUFGLENBQVlGLFNBQVMsQ0FBQ0MsTUFBdEIsQ0FBZjs7QUFFQSxTQUFLRCxTQUFMLEdBQWlCQSxTQUFqQjtBQUNBLFNBQUtDLE1BQUws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QSxVLEVBQVk7QUFDcEIsVUFBSSxDQUFDLEtBQUs1QyxPQUFMLENBQWFxRixpQkFBYixDQUErQnRFLFFBQXBDLEVBQThDO0FBQzVDLGVBQU8sSUFBUDtBQUNEOztBQUVELGFBQU8sS0FBS2YsT0FBTCxDQUFhcUYsaUJBQWIsQ0FBK0J0RSxRQUEvQixDQUF3QzZCLFVBQXhDLENBQVA7QUFDRDs7Ozs7O0FBR0g2QyxNQUFNLENBQUNDLE9BQVAsR0FBaUIzRixpQkFBakI7QUFDQTBGLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlM0YsaUJBQWYsR0FBbUNBLGlCQUFuQztBQUNBMEYsTUFBTSxDQUFDQyxPQUFQLENBQWVDLE9BQWYsR0FBeUI1RixpQkFBekIiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmNvbnN0IHsgUG9vbCwgVGltZW91dEVycm9yIH0gPSByZXF1aXJlKFwic2VxdWVsaXplLXBvb2xcIik7XHJcbmNvbnN0IF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xyXG5jb25zdCBzZW12ZXIgPSByZXF1aXJlKFwic2VtdmVyXCIpO1xyXG5jb25zdCBQcm9taXNlID0gcmVxdWlyZShcIi4uLy4uL3Byb21pc2VcIik7XHJcbmNvbnN0IGVycm9ycyA9IHJlcXVpcmUoXCIuLi8uLi9lcnJvcnNcIik7XHJcbmNvbnN0IHsgbG9nZ2VyIH0gPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvbG9nZ2VyXCIpO1xyXG5jb25zdCBkZWJ1ZyA9IGxvZ2dlci5kZWJ1Z0NvbnRleHQoXCJwb29sXCIpO1xyXG5cclxuLyoqXHJcbiAqIEFic3RyYWN0IENvbm5lY3Rpb24gTWFuYWdlclxyXG4gKlxyXG4gKiBDb25uZWN0aW9uIG1hbmFnZXIgd2hpY2ggaGFuZGxlcyBwb29saW5nICYgcmVwbGljYXRpb24uXHJcbiAqIFVzZXMgc2VxdWVsaXplLXBvb2wgZm9yIHBvb2xpbmdcclxuICpcclxuICogQHByaXZhdGVcclxuICovXHJcbmNsYXNzIENvbm5lY3Rpb25NYW5hZ2VyIHtcclxuICBjb25zdHJ1Y3RvcihkaWFsZWN0LCBzZXF1ZWxpemUpIHtcclxuICAgIGNvbnN0IGNvbmZpZyA9IF8uY2xvbmVEZWVwKHNlcXVlbGl6ZS5jb25maWcpO1xyXG5cclxuICAgIHRoaXMuc2VxdWVsaXplID0gc2VxdWVsaXplO1xyXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XHJcbiAgICB0aGlzLmRpYWxlY3QgPSBkaWFsZWN0O1xyXG4gICAgdGhpcy52ZXJzaW9uUHJvbWlzZSA9IG51bGw7XHJcbiAgICB0aGlzLmRpYWxlY3ROYW1lID0gdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0O1xyXG5cclxuICAgIGlmIChjb25maWcucG9vbCA9PT0gZmFsc2UpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3VwcG9ydCBmb3IgcG9vbDpmYWxzZSB3YXMgcmVtb3ZlZCBpbiB2NC4wXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbmZpZy5wb29sID0gXy5kZWZhdWx0cyhjb25maWcucG9vbCB8fCB7fSwge1xyXG4gICAgICBtYXg6IDUsXHJcbiAgICAgIG1pbjogMCxcclxuICAgICAgaWRsZTogMTAwMDAsXHJcbiAgICAgIGFjcXVpcmU6IDYwMDAwLFxyXG4gICAgICBldmljdDogMTAwMCxcclxuICAgICAgdmFsaWRhdGU6IHRoaXMuX3ZhbGlkYXRlLmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuaW5pdFBvb2xzKCk7XHJcbiAgfVxyXG5cclxuICByZWZyZXNoVHlwZVBhcnNlcihkYXRhVHlwZXMpIHtcclxuICAgIF8uZWFjaChkYXRhVHlwZXMsIGRhdGFUeXBlID0+IHtcclxuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhVHlwZSwgXCJwYXJzZVwiKSkge1xyXG4gICAgICAgIGlmIChkYXRhVHlwZS50eXBlc1t0aGlzLmRpYWxlY3ROYW1lXSkge1xyXG4gICAgICAgICAgdGhpcy5fcmVmcmVzaFR5cGVQYXJzZXIoZGF0YVR5cGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgIGBQYXJzZSBmdW5jdGlvbiBub3Qgc3VwcG9ydGVkIGZvciB0eXBlICR7ZGF0YVR5cGUua2V5fSBpbiBkaWFsZWN0ICR7dGhpcy5kaWFsZWN0TmFtZX1gXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcnkgdG8gbG9hZCBkaWFsZWN0IG1vZHVsZSBmcm9tIHZhcmlvdXMgY29uZmlndXJlZCBvcHRpb25zLlxyXG4gICAqIFByaW9yaXR5IGdvZXMgbGlrZSBkaWFsZWN0TW9kdWxlUGF0aCA+IGRpYWxlY3RNb2R1bGUgPiByZXF1aXJlKGRlZmF1bHQpXHJcbiAgICpcclxuICAgKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHJldHVybnMge09iamVjdH1cclxuICAgKi9cclxuICBfbG9hZERpYWxlY3RNb2R1bGUoKSB7XHJcbiAgICBjb25zdCBkaWFsZWN0TW9kdWxlID0gdGhpcy5zZXF1ZWxpemUuY29uZmlnLmRpYWxlY3RNb2R1bGUgfHwgd2luZG93O1xyXG4gICAgaWYgKCFkaWFsZWN0TW9kdWxlKSB7XHJcbiAgICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5jb25maWcuZGlhbGVjdE1vZHVsZVBhdGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICBgVW5hYmxlIHRvIGxvYWQgZGlhbGVjdE1vZHVsZSBhdCAke3RoaXMuc2VxdWVsaXplLmNvbmZpZy5kaWFsZWN0TW9kdWxlfWBcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGxlYXNlIGFkZCBwYXJhbWV0ZXIgZGlhbGVjdE1vZHVsZSBpbiBjb25maWcgbWFudWFsbHlgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBkaWFsZWN0TW9kdWxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlciB3aGljaCBleGVjdXRlcyBvbiBwcm9jZXNzIGV4aXQgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIHNodXRkb3duXHJcbiAgICpcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIF9vblByb2Nlc3NFeGl0KCkge1xyXG4gICAgaWYgKCF0aGlzLnBvb2wpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLnBvb2wuZHJhaW4oKS50aGVuKCgpID0+IHtcclxuICAgICAgZGVidWcoXCJjb25uZWN0aW9uIGRyYWluIGR1ZSB0byBwcm9jZXNzIGV4aXRcIik7XHJcbiAgICAgIHJldHVybiB0aGlzLnBvb2wuZGVzdHJveUFsbE5vdygpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcmFpbiB0aGUgcG9vbCBhbmQgY2xvc2UgaXQgcGVybWFuZW50bHlcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGNsb3NlKCkge1xyXG4gICAgLy8gTWFyayBjbG9zZSBvZiBwb29sXHJcbiAgICB0aGlzLmdldENvbm5lY3Rpb24gPSBmdW5jdGlvbiBnZXRDb25uZWN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXHJcbiAgICAgICAgbmV3IEVycm9yKFxyXG4gICAgICAgICAgXCJDb25uZWN0aW9uTWFuYWdlci5nZXRDb25uZWN0aW9uIHdhcyBjYWxsZWQgYWZ0ZXIgdGhlIGNvbm5lY3Rpb24gbWFuYWdlciB3YXMgY2xvc2VkIVwiXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5fb25Qcm9jZXNzRXhpdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZSBjb25uZWN0aW9uIHBvb2wuIEJ5IGRlZmF1bHQgcG9vbCBhdXRvc3RhcnQgaXMgc2V0IHRvIGZhbHNlLCBzbyBubyBjb25uZWN0aW9uIHdpbGwgYmVcclxuICAgKiBiZSBjcmVhdGVkIHVubGVzcyBgcG9vbC5hY3F1aXJlYCBpcyBjYWxsZWQuXHJcbiAgICovXHJcbiAgaW5pdFBvb2xzKCkge1xyXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWc7XHJcblxyXG4gICAgaWYgKCFjb25maWcucmVwbGljYXRpb24pIHtcclxuICAgICAgdGhpcy5wb29sID0gbmV3IFBvb2woe1xyXG4gICAgICAgIG5hbWU6IFwic2VxdWVsaXplXCIsXHJcbiAgICAgICAgY3JlYXRlOiAoKSA9PiB0aGlzLl9jb25uZWN0KGNvbmZpZyksXHJcbiAgICAgICAgZGVzdHJveTogY29ubmVjdGlvbiA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZGlzY29ubmVjdChjb25uZWN0aW9uKS50YXAoKCkgPT4ge1xyXG4gICAgICAgICAgICBkZWJ1ZyhcImNvbm5lY3Rpb24gZGVzdHJveVwiKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdmFsaWRhdGU6IGNvbmZpZy5wb29sLnZhbGlkYXRlLFxyXG4gICAgICAgIG1heDogY29uZmlnLnBvb2wubWF4LFxyXG4gICAgICAgIG1pbjogY29uZmlnLnBvb2wubWluLFxyXG4gICAgICAgIGFjcXVpcmVUaW1lb3V0TWlsbGlzOiBjb25maWcucG9vbC5hY3F1aXJlLFxyXG4gICAgICAgIGlkbGVUaW1lb3V0TWlsbGlzOiBjb25maWcucG9vbC5pZGxlLFxyXG4gICAgICAgIHJlYXBJbnRlcnZhbE1pbGxpczogY29uZmlnLnBvb2wuZXZpY3RcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBkZWJ1ZyhcclxuICAgICAgICBgcG9vbCBjcmVhdGVkIHdpdGggbWF4L21pbjogJHtjb25maWcucG9vbC5tYXh9LyR7Y29uZmlnLnBvb2wubWlufSwgbm8gcmVwbGljYXRpb25gXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGNvbmZpZy5yZXBsaWNhdGlvbi5yZWFkKSkge1xyXG4gICAgICBjb25maWcucmVwbGljYXRpb24ucmVhZCA9IFtjb25maWcucmVwbGljYXRpb24ucmVhZF07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTWFwIG1haW4gY29ubmVjdGlvbiBjb25maWdcclxuICAgIGNvbmZpZy5yZXBsaWNhdGlvbi53cml0ZSA9IF8uZGVmYXVsdHMoXHJcbiAgICAgIGNvbmZpZy5yZXBsaWNhdGlvbi53cml0ZSxcclxuICAgICAgXy5vbWl0KGNvbmZpZywgXCJyZXBsaWNhdGlvblwiKVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBBcHBseSBkZWZhdWx0cyB0byBlYWNoIHJlYWQgY29uZmlnXHJcbiAgICBjb25maWcucmVwbGljYXRpb24ucmVhZCA9IGNvbmZpZy5yZXBsaWNhdGlvbi5yZWFkLm1hcChyZWFkQ29uZmlnID0+XHJcbiAgICAgIF8uZGVmYXVsdHMocmVhZENvbmZpZywgXy5vbWl0KHRoaXMuY29uZmlnLCBcInJlcGxpY2F0aW9uXCIpKVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBjdXN0b20gcG9vbGluZyBmb3IgcmVwbGljYXRpb24gKG9yaWdpbmFsIGF1dGhvciBAamFubWVpZXIpXHJcbiAgICBsZXQgcmVhZHMgPSAwO1xyXG4gICAgdGhpcy5wb29sID0ge1xyXG4gICAgICByZWxlYXNlOiBjbGllbnQgPT4ge1xyXG4gICAgICAgIGlmIChjbGllbnQucXVlcnlUeXBlID09PSBcInJlYWRcIikge1xyXG4gICAgICAgICAgdGhpcy5wb29sLnJlYWQucmVsZWFzZShjbGllbnQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLnBvb2wud3JpdGUucmVsZWFzZShjbGllbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgYWNxdWlyZTogKHF1ZXJ5VHlwZSwgdXNlTWFzdGVyKSA9PiB7XHJcbiAgICAgICAgdXNlTWFzdGVyID0gdXNlTWFzdGVyID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IHVzZU1hc3RlcjtcclxuICAgICAgICBpZiAocXVlcnlUeXBlID09PSBcIlNFTEVDVFwiICYmICF1c2VNYXN0ZXIpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnBvb2wucmVhZC5hY3F1aXJlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnBvb2wud3JpdGUuYWNxdWlyZSgpO1xyXG4gICAgICB9LFxyXG4gICAgICBkZXN0cm95OiBjb25uZWN0aW9uID0+IHtcclxuICAgICAgICB0aGlzLnBvb2xbY29ubmVjdGlvbi5xdWVyeVR5cGVdLmRlc3Ryb3koY29ubmVjdGlvbik7XHJcbiAgICAgICAgZGVidWcoXCJjb25uZWN0aW9uIGRlc3Ryb3lcIik7XHJcbiAgICAgIH0sXHJcbiAgICAgIGRlc3Ryb3lBbGxOb3c6ICgpID0+IHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5qb2luKFxyXG4gICAgICAgICAgdGhpcy5wb29sLnJlYWQuZGVzdHJveUFsbE5vdygpLFxyXG4gICAgICAgICAgdGhpcy5wb29sLndyaXRlLmRlc3Ryb3lBbGxOb3coKVxyXG4gICAgICAgICkudGFwKCgpID0+IHtcclxuICAgICAgICAgIGRlYnVnKFwiYWxsIGNvbm5lY3Rpb25zIGRlc3Ryb3llZFwiKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgICAgZHJhaW46ICgpID0+IHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5qb2luKHRoaXMucG9vbC53cml0ZS5kcmFpbigpLCB0aGlzLnBvb2wucmVhZC5kcmFpbigpKTtcclxuICAgICAgfSxcclxuICAgICAgcmVhZDogbmV3IFBvb2woe1xyXG4gICAgICAgIG5hbWU6IFwic2VxdWVsaXplOnJlYWRcIixcclxuICAgICAgICBjcmVhdGU6ICgpID0+IHtcclxuICAgICAgICAgIC8vIHJvdW5kIHJvYmluIGNvbmZpZ1xyXG4gICAgICAgICAgY29uc3QgbmV4dFJlYWQgPSByZWFkcysrICUgY29uZmlnLnJlcGxpY2F0aW9uLnJlYWQubGVuZ3RoO1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3QoY29uZmlnLnJlcGxpY2F0aW9uLnJlYWRbbmV4dFJlYWRdKS50YXAoXHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24gPT4ge1xyXG4gICAgICAgICAgICAgIGNvbm5lY3Rpb24ucXVlcnlUeXBlID0gXCJyZWFkXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZXN0cm95OiBjb25uZWN0aW9uID0+IHRoaXMuX2Rpc2Nvbm5lY3QoY29ubmVjdGlvbiksXHJcbiAgICAgICAgdmFsaWRhdGU6IGNvbmZpZy5wb29sLnZhbGlkYXRlLFxyXG4gICAgICAgIG1heDogY29uZmlnLnBvb2wubWF4LFxyXG4gICAgICAgIG1pbjogY29uZmlnLnBvb2wubWluLFxyXG4gICAgICAgIGFjcXVpcmVUaW1lb3V0TWlsbGlzOiBjb25maWcucG9vbC5hY3F1aXJlLFxyXG4gICAgICAgIGlkbGVUaW1lb3V0TWlsbGlzOiBjb25maWcucG9vbC5pZGxlLFxyXG4gICAgICAgIHJlYXBJbnRlcnZhbE1pbGxpczogY29uZmlnLnBvb2wuZXZpY3RcclxuICAgICAgfSksXHJcbiAgICAgIHdyaXRlOiBuZXcgUG9vbCh7XHJcbiAgICAgICAgbmFtZTogXCJzZXF1ZWxpemU6d3JpdGVcIixcclxuICAgICAgICBjcmVhdGU6ICgpID0+IHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9jb25uZWN0KGNvbmZpZy5yZXBsaWNhdGlvbi53cml0ZSkudGFwKGNvbm5lY3Rpb24gPT4ge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5VHlwZSA9IFwid3JpdGVcIjtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGVzdHJveTogY29ubmVjdGlvbiA9PiB0aGlzLl9kaXNjb25uZWN0KGNvbm5lY3Rpb24pLFxyXG4gICAgICAgIHZhbGlkYXRlOiBjb25maWcucG9vbC52YWxpZGF0ZSxcclxuICAgICAgICBtYXg6IGNvbmZpZy5wb29sLm1heCxcclxuICAgICAgICBtaW46IGNvbmZpZy5wb29sLm1pbixcclxuICAgICAgICBhY3F1aXJlVGltZW91dE1pbGxpczogY29uZmlnLnBvb2wuYWNxdWlyZSxcclxuICAgICAgICBpZGxlVGltZW91dE1pbGxpczogY29uZmlnLnBvb2wuaWRsZSxcclxuICAgICAgICByZWFwSW50ZXJ2YWxNaWxsaXM6IGNvbmZpZy5wb29sLmV2aWN0XHJcbiAgICAgIH0pXHJcbiAgICB9O1xyXG5cclxuICAgIGRlYnVnKFxyXG4gICAgICBgcG9vbCBjcmVhdGVkIHdpdGggbWF4L21pbjogJHtjb25maWcucG9vbC5tYXh9LyR7Y29uZmlnLnBvb2wubWlufSwgd2l0aCByZXBsaWNhdGlvbmBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgY29ubmVjdGlvbiBmcm9tIHBvb2wuIEl0IHNldHMgZGF0YWJhc2UgdmVyc2lvbiBpZiBpdCdzIG5vdCBhbHJlYWR5IHNldC5cclxuICAgKiBDYWxsIHBvb2wuYWNxdWlyZSB0byBnZXQgYSBjb25uZWN0aW9uXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9uc10gICAgICAgICAgICAgICAgIFBvb2wgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLnR5cGVdICAgICAgICAgICAgU2V0IHdoaWNoIHJlcGxpY2EgdG8gdXNlLiBBdmFpbGFibGUgb3B0aW9ucyBhcmUgYHJlYWRgIGFuZCBgd3JpdGVgXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMudXNlTWFzdGVyPWZhbHNlXSBGb3JjZSBtYXN0ZXIgb3Igd3JpdGUgcmVwbGljYSB0byBnZXQgY29ubmVjdGlvbiBmcm9tXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxDb25uZWN0aW9uPn1cclxuICAgKi9cclxuICBnZXRDb25uZWN0aW9uKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIGxldCBwcm9taXNlO1xyXG4gICAgaWYgKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGF0YWJhc2VWZXJzaW9uID09PSAwKSB7XHJcbiAgICAgIGlmICh0aGlzLnZlcnNpb25Qcm9taXNlKSB7XHJcbiAgICAgICAgcHJvbWlzZSA9IHRoaXMudmVyc2lvblByb21pc2U7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJvbWlzZSA9IHRoaXMudmVyc2lvblByb21pc2UgPSB0aGlzLl9jb25uZWN0KFxyXG4gICAgICAgICAgdGhpcy5jb25maWcucmVwbGljYXRpb24ud3JpdGUgfHwgdGhpcy5jb25maWdcclxuICAgICAgICApXHJcbiAgICAgICAgICAudGhlbihjb25uZWN0aW9uID0+IHtcclxuICAgICAgICAgICAgY29uc3QgX29wdGlvbnMgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIF9vcHRpb25zLnRyYW5zYWN0aW9uID0geyBjb25uZWN0aW9uIH07IC8vIENoZWF0IC5xdWVyeSB0byB1c2Ugb3VyIHByaXZhdGUgY29ubmVjdGlvblxyXG4gICAgICAgICAgICBfb3B0aW9ucy5sb2dnaW5nID0gKCkgPT4ge307XHJcbiAgICAgICAgICAgIF9vcHRpb25zLmxvZ2dpbmcuX190ZXN0TG9nZ2luZ0ZuID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIC8vY29ubmVjdGlvbiBtaWdodCBoYXZlIHNldCBkYXRhYmFzZVZlcnNpb24gdmFsdWUgYXQgaW5pdGlhbGl6YXRpb24sXHJcbiAgICAgICAgICAgIC8vYXZvaWRpbmcgYSB1c2VsZXNzIHJvdW5kIHRyaXBcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGF0YWJhc2VWZXJzaW9uID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLmRhdGFiYXNlVmVyc2lvbihfb3B0aW9ucykudGhlbih2ZXJzaW9uID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZFZlcnNpb24gPVxyXG4gICAgICAgICAgICAgICAgICBfLmdldChzZW12ZXIuY29lcmNlKHZlcnNpb24pLCBcInZlcnNpb25cIikgfHwgdmVyc2lvbjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGF0YWJhc2VWZXJzaW9uID0gc2VtdmVyLnZhbGlkKFxyXG4gICAgICAgICAgICAgICAgICBwYXJzZWRWZXJzaW9uXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgID8gcGFyc2VkVmVyc2lvblxyXG4gICAgICAgICAgICAgICAgICA6IHRoaXMuZGVmYXVsdFZlcnNpb247XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcnNpb25Qcm9taXNlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kaXNjb25uZWN0KGNvbm5lY3Rpb24pO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZlcnNpb25Qcm9taXNlID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc2Nvbm5lY3QoY29ubmVjdGlvbik7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyc2lvblByb21pc2UgPSBudWxsO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwcm9taXNlXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wb29sXHJcbiAgICAgICAgICAuYWNxdWlyZShvcHRpb25zLnR5cGUsIG9wdGlvbnMudXNlTWFzdGVyKVxyXG4gICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgVGltZW91dEVycm9yKVxyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMuQ29ubmVjdGlvbkFjcXVpcmVUaW1lb3V0RXJyb3IoZXJyb3IpO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9KVxyXG4gICAgICAudGFwKCgpID0+IHtcclxuICAgICAgICBkZWJ1ZyhcImNvbm5lY3Rpb24gYWNxdWlyZWRcIik7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVsZWFzZSBhIHBvb2xlZCBjb25uZWN0aW9uIHNvIGl0IGNhbiBiZSB1dGlsaXplZCBieSBvdGhlciBjb25uZWN0aW9uIHJlcXVlc3RzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0Nvbm5lY3Rpb259IGNvbm5lY3Rpb25cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIHJlbGVhc2VDb25uZWN0aW9uKGNvbm5lY3Rpb24pIHtcclxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XHJcbiAgICAgIHRoaXMucG9vbC5yZWxlYXNlKGNvbm5lY3Rpb24pO1xyXG4gICAgICBkZWJ1ZyhcImNvbm5lY3Rpb24gcmVsZWFzZWRcIik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGwgZGlhbGVjdCBsaWJyYXJ5IHRvIGdldCBjb25uZWN0aW9uXHJcbiAgICpcclxuICAgKiBAcGFyYW0geyp9IGNvbmZpZyBDb25uZWN0aW9uIGNvbmZpZ1xyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8Q29ubmVjdGlvbj59XHJcbiAgICovXHJcbiAgX2Nvbm5lY3QoY29uZmlnKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemVcclxuICAgICAgLnJ1bkhvb2tzKFwiYmVmb3JlQ29ubmVjdFwiLCBjb25maWcpXHJcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuZGlhbGVjdC5jb25uZWN0aW9uTWFuYWdlci5jb25uZWN0KGNvbmZpZykpXHJcbiAgICAgIC50aGVuKGNvbm5lY3Rpb24gPT5cclxuICAgICAgICB0aGlzLnNlcXVlbGl6ZVxyXG4gICAgICAgICAgLnJ1bkhvb2tzKFwiYWZ0ZXJDb25uZWN0XCIsIGNvbm5lY3Rpb24sIGNvbmZpZylcclxuICAgICAgICAgIC5yZXR1cm4oY29ubmVjdGlvbilcclxuICAgICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGwgZGlhbGVjdCBsaWJyYXJ5IHRvIGRpc2Nvbm5lY3QgYSBjb25uZWN0aW9uXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0Nvbm5lY3Rpb259IGNvbm5lY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIF9kaXNjb25uZWN0KGNvbm5lY3Rpb24pIHtcclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZVxyXG4gICAgICAucnVuSG9va3MoXCJiZWZvcmVEaXNjb25uZWN0XCIsIGNvbm5lY3Rpb24pXHJcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuZGlhbGVjdC5jb25uZWN0aW9uTWFuYWdlci5kaXNjb25uZWN0KGNvbm5lY3Rpb24pKVxyXG4gICAgICAudGhlbigoKSA9PiB0aGlzLnNlcXVlbGl6ZS5ydW5Ib29rcyhcImFmdGVyRGlzY29ubmVjdFwiLCBjb25uZWN0aW9uKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmUgaWYgYSBjb25uZWN0aW9uIGlzIHN0aWxsIHZhbGlkIG9yIG5vdFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtDb25uZWN0aW9ufSBjb25uZWN0aW9uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBfdmFsaWRhdGUoY29ubmVjdGlvbikge1xyXG4gICAgaWYgKCF0aGlzLmRpYWxlY3QuY29ubmVjdGlvbk1hbmFnZXIudmFsaWRhdGUpIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuZGlhbGVjdC5jb25uZWN0aW9uTWFuYWdlci52YWxpZGF0ZShjb25uZWN0aW9uKTtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29ubmVjdGlvbk1hbmFnZXI7XHJcbm1vZHVsZS5leHBvcnRzLkNvbm5lY3Rpb25NYW5hZ2VyID0gQ29ubmVjdGlvbk1hbmFnZXI7XHJcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBDb25uZWN0aW9uTWFuYWdlcjtcclxuIl19