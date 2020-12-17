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

let ConnectionManager = /*#__PURE__*/function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9hYnN0cmFjdC9jb25uZWN0aW9uLW1hbmFnZXIuanMiXSwibmFtZXMiOlsiUG9vbCIsIlRpbWVvdXRFcnJvciIsInJlcXVpcmUiLCJfIiwic2VtdmVyIiwiUHJvbWlzZSIsImVycm9ycyIsImxvZ2dlciIsImRlYnVnIiwiZGVidWdDb250ZXh0IiwiQ29ubmVjdGlvbk1hbmFnZXIiLCJkaWFsZWN0Iiwic2VxdWVsaXplIiwiY29uZmlnIiwiY2xvbmVEZWVwIiwidmVyc2lvblByb21pc2UiLCJkaWFsZWN0TmFtZSIsIm9wdGlvbnMiLCJwb29sIiwiRXJyb3IiLCJkZWZhdWx0cyIsIm1heCIsIm1pbiIsImlkbGUiLCJhY3F1aXJlIiwiZXZpY3QiLCJ2YWxpZGF0ZSIsIl92YWxpZGF0ZSIsImJpbmQiLCJpbml0UG9vbHMiLCJkYXRhVHlwZXMiLCJlYWNoIiwiZGF0YVR5cGUiLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJ0eXBlcyIsIl9yZWZyZXNoVHlwZVBhcnNlciIsImtleSIsImRpYWxlY3RNb2R1bGUiLCJ3aW5kb3ciLCJkaWFsZWN0TW9kdWxlUGF0aCIsInJlc29sdmUiLCJkcmFpbiIsInRoZW4iLCJkZXN0cm95QWxsTm93IiwiZ2V0Q29ubmVjdGlvbiIsInJlamVjdCIsIl9vblByb2Nlc3NFeGl0IiwicmVwbGljYXRpb24iLCJuYW1lIiwiY3JlYXRlIiwiX2Nvbm5lY3QiLCJkZXN0cm95IiwiY29ubmVjdGlvbiIsIl9kaXNjb25uZWN0IiwidGFwIiwiYWNxdWlyZVRpbWVvdXRNaWxsaXMiLCJpZGxlVGltZW91dE1pbGxpcyIsInJlYXBJbnRlcnZhbE1pbGxpcyIsIkFycmF5IiwiaXNBcnJheSIsInJlYWQiLCJ3cml0ZSIsIm9taXQiLCJtYXAiLCJyZWFkQ29uZmlnIiwicmVhZHMiLCJyZWxlYXNlIiwiY2xpZW50IiwicXVlcnlUeXBlIiwidXNlTWFzdGVyIiwidW5kZWZpbmVkIiwiam9pbiIsIm5leHRSZWFkIiwibGVuZ3RoIiwicHJvbWlzZSIsImRhdGFiYXNlVmVyc2lvbiIsIl9vcHRpb25zIiwidHJhbnNhY3Rpb24iLCJsb2dnaW5nIiwiX190ZXN0TG9nZ2luZ0ZuIiwidmVyc2lvbiIsInBhcnNlZFZlcnNpb24iLCJnZXQiLCJjb2VyY2UiLCJ2YWxpZCIsImRlZmF1bHRWZXJzaW9uIiwiY2F0Y2giLCJlcnIiLCJ0eXBlIiwiZXJyb3IiLCJDb25uZWN0aW9uQWNxdWlyZVRpbWVvdXRFcnJvciIsInRyeSIsInJ1bkhvb2tzIiwiY29ubmVjdGlvbk1hbmFnZXIiLCJjb25uZWN0IiwicmV0dXJuIiwiZGlzY29ubmVjdCIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUFFQSxNQUFNO0FBQUVBLEVBQUFBLElBQUY7QUFBUUMsRUFBQUE7QUFBUixJQUF5QkMsT0FBTyxDQUFDLGdCQUFELENBQXRDOztBQUNBLE1BQU1DLENBQUMsR0FBR0QsT0FBTyxDQUFDLFFBQUQsQ0FBakI7O0FBQ0EsTUFBTUUsTUFBTSxHQUFHRixPQUFPLENBQUMsUUFBRCxDQUF0Qjs7QUFDQSxNQUFNRyxPQUFPLEdBQUdILE9BQU8sQ0FBQyxlQUFELENBQXZCOztBQUNBLE1BQU1JLE1BQU0sR0FBR0osT0FBTyxDQUFDLGNBQUQsQ0FBdEI7O0FBQ0EsTUFBTTtBQUFFSyxFQUFBQTtBQUFGLElBQWFMLE9BQU8sQ0FBQyxvQkFBRCxDQUExQjs7QUFDQSxNQUFNTSxLQUFLLEdBQUdELE1BQU0sQ0FBQ0UsWUFBUCxDQUFvQixNQUFwQixDQUFkO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFDTUMsaUI7QUFDSiw2QkFBWUMsT0FBWixFQUFxQkMsU0FBckIsRUFBZ0M7QUFBQTs7QUFDOUIsVUFBTUMsTUFBTSxHQUFHVixDQUFDLENBQUNXLFNBQUYsQ0FBWUYsU0FBUyxDQUFDQyxNQUF0QixDQUFmOztBQUVBLFNBQUtELFNBQUwsR0FB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SSxDQUNLLGtCQURMLEVBQ3lCeEMsVUFEekIsRUFFSlYsSUFGSSxDQUVDLE1BQU0sS0FBS2xDLE9BQUwsQ0FBYXFGLGlCQUFiLENBQStCRyxVQUEvQixDQUEwQzVDLFVBQTFDLENBRlAsRUFHSlYsSUFISSxDQUdDLE1BQU0sS0FBS2pDLFNBQUwsQ0FBZW1GLFFBQWYsQ0FBd0IsaUJBQXhCLEVBQTJDeEMsVUFBM0MsQ0FIUCxDQUFQO0FBSUQ7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs4QkFDWUEsVSxFQUFZO0FBQ3BCLFVBQUksQ0FBQyxLQUFLNUMsT0FBTCxDQUFhcUYsaUJBQWIsQ0FBK0J0RSxRQUFwQyxFQUE4QztBQUM1QyxlQUFPLElBQVA7QUFDRDs7QUFFRCxhQUFPLEtBQUtmLE9BQUwsQ0FBYXFGLGlCQUFiLENBQStCdEUsUUFBL0IsQ0FBd0M2QixVQUF4QyxDQUFQO0FBQ0Q7Ozs7OztBQUdINkMsTUFBTSxDQUFDQyxPQUFQLEdBQWlCM0YsaUJBQWpCO0FBQ0EwRixNQUFNLENBQUNDLE9BQVAsQ0FBZTNGLGlCQUFmLEdBQW1DQSxpQkFBbkM7QUFDQTBGLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxPQUFmLEdBQXlCNUYsaUJBQXpCIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IHsgUG9vbCwgVGltZW91dEVycm9yIH0gPSByZXF1aXJlKFwic2VxdWVsaXplLXBvb2xcIik7XG5jb25zdCBfID0gcmVxdWlyZShcImxvZGFzaFwiKTtcbmNvbnN0IHNlbXZlciA9IHJlcXVpcmUoXCJzZW12ZXJcIik7XG5jb25zdCBQcm9taXNlID0gcmVxdWlyZShcIi4uLy4uL3Byb21pc2VcIik7XG5jb25zdCBlcnJvcnMgPSByZXF1aXJlKFwiLi4vLi4vZXJyb3JzXCIpO1xuY29uc3QgeyBsb2dnZXIgfSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9sb2dnZXJcIik7XG5jb25zdCBkZWJ1ZyA9IGxvZ2dlci5kZWJ1Z0NvbnRleHQoXCJwb29sXCIpO1xuXG4vKipcbiAqIEFic3RyYWN0IENvbm5lY3Rpb24gTWFuYWdlclxuICpcbiAqIENvbm5lY3Rpb24gbWFuYWdlciB3aGljaCBoYW5kbGVzIHBvb2xpbmcgJiByZXBsaWNhdGlvbi5cbiAqIFVzZXMgc2VxdWVsaXplLXBvb2wgZm9yIHBvb2xpbmdcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBDb25uZWN0aW9uTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKGRpYWxlY3QsIHNlcXVlbGl6ZSkge1xuICAgIGNvbnN0IGNvbmZpZyA9IF8uY2xvbmVEZWVwKHNlcXVlbGl6ZS5jb25maWcpO1xuXG4gICAgdGhpcy5zZXF1ZWxpemUgPSBzZXF1ZWxpemU7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5kaWFsZWN0ID0gZGlhbGVjdDtcbiAgICB0aGlzLnZlcnNpb25Qcm9taXNlID0gbnVsbDtcbiAgICB0aGlzLmRpYWxlY3ROYW1lID0gdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0O1xuXG4gICAgaWYgKGNvbmZpZy5wb29sID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3VwcG9ydCBmb3IgcG9vbDpmYWxzZSB3YXMgcmVtb3ZlZCBpbiB2NC4wXCIpO1xuICAgIH1cblxuICAgIGNvbmZpZy5wb29sID0gXy5kZWZhdWx0cyhjb25maWcucG9vbCB8fCB7fSwge1xuICAgICAgbWF4OiA1LFxuICAgICAgbWluOiAwLFxuICAgICAgaWRsZTogMTAwMDAsXG4gICAgICBhY3F1aXJlOiA2MDAwMCxcbiAgICAgIGV2aWN0OiAxMDAwLFxuICAgICAgdmFsaWRhdGU6IHRoaXMuX3ZhbGlkYXRlLmJpbmQodGhpcylcbiAgICB9KTtcblxuICAgIHRoaXMuaW5pdFBvb2xzKCk7XG4gIH1cblxuICByZWZyZXNoVHlwZVBhcnNlcihkYXRhVHlwZXMpIHtcbiAgICBfLmVhY2goZGF0YVR5cGVzLCBkYXRhVHlwZSA9PiB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGFUeXBlLCBcInBhcnNlXCIpKSB7XG4gICAgICAgIGlmIChkYXRhVHlwZS50eXBlc1t0aGlzLmRpYWxlY3ROYW1lXSkge1xuICAgICAgICAgIHRoaXMuX3JlZnJlc2hUeXBlUGFyc2VyKGRhdGFUeXBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgUGFyc2UgZnVuY3Rpb24gbm90IHN1cHBvcnRlZCBmb3IgdHlwZSAke2RhdGFUeXBlLmtleX0gaW4gZGlhbGVjdCAke3RoaXMuZGlhbGVjdE5hbWV9YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcnkgdG8gbG9hZCBkaWFsZWN0IG1vZHVsZSBmcm9tIHZhcmlvdXMgY29uZmlndXJlZCBvcHRpb25zLlxuICAgKiBQcmlvcml0eSBnb2VzIGxpa2UgZGlhbGVjdE1vZHVsZVBhdGggPiBkaWFsZWN0TW9kdWxlID4gcmVxdWlyZShkZWZhdWx0KVxuICAgKlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgX2xvYWREaWFsZWN0TW9kdWxlKCkge1xuICAgIGNvbnN0IGRpYWxlY3RNb2R1bGUgPSB0aGlzLnNlcXVlbGl6ZS5jb25maWcuZGlhbGVjdE1vZHVsZSB8fCB3aW5kb3c7XG4gICAgaWYgKCFkaWFsZWN0TW9kdWxlKSB7XG4gICAgICBpZiAodGhpcy5zZXF1ZWxpemUuY29uZmlnLmRpYWxlY3RNb2R1bGVQYXRoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgVW5hYmxlIHRvIGxvYWQgZGlhbGVjdE1vZHVsZSBhdCAke3RoaXMuc2VxdWVsaXplLmNvbmZpZy5kaWFsZWN0TW9kdWxlfWBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGxlYXNlIGFkZCBwYXJhbWV0ZXIgZGlhbGVjdE1vZHVsZSBpbiBjb25maWcgbWFudWFsbHlgKTtcbiAgICB9XG4gICAgcmV0dXJuIGRpYWxlY3RNb2R1bGU7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlciB3aGljaCBleGVjdXRlcyBvbiBwcm9jZXNzIGV4aXQgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIHNodXRkb3duXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgX29uUHJvY2Vzc0V4aXQoKSB7XG4gICAgaWYgKCF0aGlzLnBvb2wpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5wb29sLmRyYWluKCkudGhlbigoKSA9PiB7XG4gICAgICBkZWJ1ZyhcImNvbm5lY3Rpb24gZHJhaW4gZHVlIHRvIHByb2Nlc3MgZXhpdFwiKTtcbiAgICAgIHJldHVybiB0aGlzLnBvb2wuZGVzdHJveUFsbE5vdygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERyYWluIHRoZSBwb29sIGFuZCBjbG9zZSBpdCBwZXJtYW5lbnRseVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGNsb3NlKCkge1xuICAgIC8vIE1hcmsgY2xvc2Ugb2YgcG9vbFxuICAgIHRoaXMuZ2V0Q29ubmVjdGlvbiA9IGZ1bmN0aW9uIGdldENvbm5lY3Rpb24oKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgIG5ldyBFcnJvcihcbiAgICAgICAgICBcIkNvbm5lY3Rpb25NYW5hZ2VyLmdldENvbm5lY3Rpb24gd2FzIGNhbGxlZCBhZnRlciB0aGUgY29ubmVjdGlvbiBtYW5hZ2VyIHdhcyBjbG9zZWQhXCJcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMuX29uUHJvY2Vzc0V4aXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGNvbm5lY3Rpb24gcG9vbC4gQnkgZGVmYXVsdCBwb29sIGF1dG9zdGFydCBpcyBzZXQgdG8gZmFsc2UsIHNvIG5vIGNvbm5lY3Rpb24gd2lsbCBiZVxuICAgKiBiZSBjcmVhdGVkIHVubGVzcyBgcG9vbC5hY3F1aXJlYCBpcyBjYWxsZWQuXG4gICAqL1xuICBpbml0UG9vbHMoKSB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWc7XG5cbiAgICBpZiAoIWNvbmZpZy5yZXBsaWNhdGlvbikge1xuICAgICAgdGhpcy5wb29sID0gbmV3IFBvb2woe1xuICAgICAgICBuYW1lOiBcInNlcXVlbGl6ZVwiLFxuICAgICAgICBjcmVhdGU6ICgpID0+IHRoaXMuX2Nvbm5lY3QoY29uZmlnKSxcbiAgICAgICAgZGVzdHJveTogY29ubmVjdGlvbiA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc2Nvbm5lY3QoY29ubmVjdGlvbikudGFwKCgpID0+IHtcbiAgICAgICAgICAgIGRlYnVnKFwiY29ubmVjdGlvbiBkZXN0cm95XCIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB2YWxpZGF0ZTogY29uZmlnLnBvb2wudmFsaWRhdGUsXG4gICAgICAgIG1heDogY29uZmlnLnBvb2wubWF4LFxuICAgICAgICBtaW46IGNvbmZpZy5wb29sLm1pbixcbiAgICAgICAgYWNxdWlyZVRpbWVvdXRNaWxsaXM6IGNvbmZpZy5wb29sLmFjcXVpcmUsXG4gICAgICAgIGlkbGVUaW1lb3V0TWlsbGlzOiBjb25maWcucG9vbC5pZGxlLFxuICAgICAgICByZWFwSW50ZXJ2YWxNaWxsaXM6IGNvbmZpZy5wb29sLmV2aWN0XG4gICAgICB9KTtcblxuICAgICAgZGVidWcoXG4gICAgICAgIGBwb29sIGNyZWF0ZWQgd2l0aCBtYXgvbWluOiAke2NvbmZpZy5wb29sLm1heH0vJHtjb25maWcucG9vbC5taW59LCBubyByZXBsaWNhdGlvbmBcbiAgICAgICk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29uZmlnLnJlcGxpY2F0aW9uLnJlYWQpKSB7XG4gICAgICBjb25maWcucmVwbGljYXRpb24ucmVhZCA9IFtjb25maWcucmVwbGljYXRpb24ucmVhZF07XG4gICAgfVxuXG4gICAgLy8gTWFwIG1haW4gY29ubmVjdGlvbiBjb25maWdcbiAgICBjb25maWcucmVwbGljYXRpb24ud3JpdGUgPSBfLmRlZmF1bHRzKFxuICAgICAgY29uZmlnLnJlcGxpY2F0aW9uLndyaXRlLFxuICAgICAgXy5vbWl0KGNvbmZpZywgXCJyZXBsaWNhdGlvblwiKVxuICAgICk7XG5cbiAgICAvLyBBcHBseSBkZWZhdWx0cyB0byBlYWNoIHJlYWQgY29uZmlnXG4gICAgY29uZmlnLnJlcGxpY2F0aW9uLnJlYWQgPSBjb25maWcucmVwbGljYXRpb24ucmVhZC5tYXAocmVhZENvbmZpZyA9PlxuICAgICAgXy5kZWZhdWx0cyhyZWFkQ29uZmlnLCBfLm9taXQodGhpcy5jb25maWcsIFwicmVwbGljYXRpb25cIikpXG4gICAgKTtcblxuICAgIC8vIGN1c3RvbSBwb29saW5nIGZvciByZXBsaWNhdGlvbiAob3JpZ2luYWwgYXV0aG9yIEBqYW5tZWllcilcbiAgICBsZXQgcmVhZHMgPSAwO1xuICAgIHRoaXMucG9vbCA9IHtcbiAgICAgIHJlbGVhc2U6IGNsaWVudCA9PiB7XG4gICAgICAgIGlmIChjbGllbnQucXVlcnlUeXBlID09PSBcInJlYWRcIikge1xuICAgICAgICAgIHRoaXMucG9vbC5yZWFkLnJlbGVhc2UoY2xpZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnBvb2wud3JpdGUucmVsZWFzZShjbGllbnQpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYWNxdWlyZTogKHF1ZXJ5VHlwZSwgdXNlTWFzdGVyKSA9PiB7XG4gICAgICAgIHVzZU1hc3RlciA9IHVzZU1hc3RlciA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiB1c2VNYXN0ZXI7XG4gICAgICAgIGlmIChxdWVyeVR5cGUgPT09IFwiU0VMRUNUXCIgJiYgIXVzZU1hc3Rlcikge1xuICAgICAgICAgIHJldHVybiB0aGlzLnBvb2wucmVhZC5hY3F1aXJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucG9vbC53cml0ZS5hY3F1aXJlKCk7XG4gICAgICB9LFxuICAgICAgZGVzdHJveTogY29ubmVjdGlvbiA9PiB7XG4gICAgICAgIHRoaXMucG9vbFtjb25uZWN0aW9uLnF1ZXJ5VHlwZV0uZGVzdHJveShjb25uZWN0aW9uKTtcbiAgICAgICAgZGVidWcoXCJjb25uZWN0aW9uIGRlc3Ryb3lcIik7XG4gICAgICB9LFxuICAgICAgZGVzdHJveUFsbE5vdzogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5qb2luKFxuICAgICAgICAgIHRoaXMucG9vbC5yZWFkLmRlc3Ryb3lBbGxOb3coKSxcbiAgICAgICAgICB0aGlzLnBvb2wud3JpdGUuZGVzdHJveUFsbE5vdygpXG4gICAgICAgICkudGFwKCgpID0+IHtcbiAgICAgICAgICBkZWJ1ZyhcImFsbCBjb25uZWN0aW9ucyBkZXN0cm95ZWRcIik7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIGRyYWluOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmpvaW4odGhpcy5wb29sLndyaXRlLmRyYWluKCksIHRoaXMucG9vbC5yZWFkLmRyYWluKCkpO1xuICAgICAgfSxcbiAgICAgIHJlYWQ6IG5ldyBQb29sKHtcbiAgICAgICAgbmFtZTogXCJzZXF1ZWxpemU6cmVhZFwiLFxuICAgICAgICBjcmVhdGU6ICgpID0+IHtcbiAgICAgICAgICAvLyByb3VuZCByb2JpbiBjb25maWdcbiAgICAgICAgICBjb25zdCBuZXh0UmVhZCA9IHJlYWRzKysgJSBjb25maWcucmVwbGljYXRpb24ucmVhZC5sZW5ndGg7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3QoY29uZmlnLnJlcGxpY2F0aW9uLnJlYWRbbmV4dFJlYWRdKS50YXAoXG4gICAgICAgICAgICBjb25uZWN0aW9uID0+IHtcbiAgICAgICAgICAgICAgY29ubmVjdGlvbi5xdWVyeVR5cGUgPSBcInJlYWRcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBkZXN0cm95OiBjb25uZWN0aW9uID0+IHRoaXMuX2Rpc2Nvbm5lY3QoY29ubmVjdGlvbiksXG4gICAgICAgIHZhbGlkYXRlOiBjb25maWcucG9vbC52YWxpZGF0ZSxcbiAgICAgICAgbWF4OiBjb25maWcucG9vbC5tYXgsXG4gICAgICAgIG1pbjogY29uZmlnLnBvb2wubWluLFxuICAgICAgICBhY3F1aXJlVGltZW91dE1pbGxpczogY29uZmlnLnBvb2wuYWNxdWlyZSxcbiAgICAgICAgaWRsZVRpbWVvdXRNaWxsaXM6IGNvbmZpZy5wb29sLmlkbGUsXG4gICAgICAgIHJlYXBJbnRlcnZhbE1pbGxpczogY29uZmlnLnBvb2wuZXZpY3RcbiAgICAgIH0pLFxuICAgICAgd3JpdGU6IG5ldyBQb29sKHtcbiAgICAgICAgbmFtZTogXCJzZXF1ZWxpemU6d3JpdGVcIixcbiAgICAgICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3QoY29uZmlnLnJlcGxpY2F0aW9uLndyaXRlKS50YXAoY29ubmVjdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5VHlwZSA9IFwid3JpdGVcIjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVzdHJveTogY29ubmVjdGlvbiA9PiB0aGlzLl9kaXNjb25uZWN0KGNvbm5lY3Rpb24pLFxuICAgICAgICB2YWxpZGF0ZTogY29uZmlnLnBvb2wudmFsaWRhdGUsXG4gICAgICAgIG1heDogY29uZmlnLnBvb2wubWF4LFxuICAgICAgICBtaW46IGNvbmZpZy5wb29sLm1pbixcbiAgICAgICAgYWNxdWlyZVRpbWVvdXRNaWxsaXM6IGNvbmZpZy5wb29sLmFjcXVpcmUsXG4gICAgICAgIGlkbGVUaW1lb3V0TWlsbGlzOiBjb25maWcucG9vbC5pZGxlLFxuICAgICAgICByZWFwSW50ZXJ2YWxNaWxsaXM6IGNvbmZpZy5wb29sLmV2aWN0XG4gICAgICB9KVxuICAgIH07XG5cbiAgICBkZWJ1ZyhcbiAgICAgIGBwb29sIGNyZWF0ZWQgd2l0aCBtYXgvbWluOiAke2NvbmZpZy5wb29sLm1heH0vJHtjb25maWcucG9vbC5taW59LCB3aXRoIHJlcGxpY2F0aW9uYFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNvbm5lY3Rpb24gZnJvbSBwb29sLiBJdCBzZXRzIGRhdGFiYXNlIHZlcnNpb24gaWYgaXQncyBub3QgYWxyZWFkeSBzZXQuXG4gICAqIENhbGwgcG9vbC5hY3F1aXJlIHRvIGdldCBhIGNvbm5lY3Rpb25cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgW29wdGlvbnNdICAgICAgICAgICAgICAgICBQb29sIG9wdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW29wdGlvbnMudHlwZV0gICAgICAgICAgICBTZXQgd2hpY2ggcmVwbGljYSB0byB1c2UuIEF2YWlsYWJsZSBvcHRpb25zIGFyZSBgcmVhZGAgYW5kIGB3cml0ZWBcbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMudXNlTWFzdGVyPWZhbHNlXSBGb3JjZSBtYXN0ZXIgb3Igd3JpdGUgcmVwbGljYSB0byBnZXQgY29ubmVjdGlvbiBmcm9tXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPENvbm5lY3Rpb24+fVxuICAgKi9cbiAgZ2V0Q29ubmVjdGlvbihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBsZXQgcHJvbWlzZTtcbiAgICBpZiAodGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kYXRhYmFzZVZlcnNpb24gPT09IDApIHtcbiAgICAgIGlmICh0aGlzLnZlcnNpb25Qcm9taXNlKSB7XG4gICAgICAgIHByb21pc2UgPSB0aGlzLnZlcnNpb25Qcm9taXNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvbWlzZSA9IHRoaXMudmVyc2lvblByb21pc2UgPSB0aGlzLl9jb25uZWN0KFxuICAgICAgICAgIHRoaXMuY29uZmlnLnJlcGxpY2F0aW9uLndyaXRlIHx8IHRoaXMuY29uZmlnXG4gICAgICAgIClcbiAgICAgICAgICAudGhlbihjb25uZWN0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9vcHRpb25zID0ge307XG5cbiAgICAgICAgICAgIF9vcHRpb25zLnRyYW5zYWN0aW9uID0geyBjb25uZWN0aW9uIH07IC8vIENoZWF0IC5xdWVyeSB0byB1c2Ugb3VyIHByaXZhdGUgY29ubmVjdGlvblxuICAgICAgICAgICAgX29wdGlvbnMubG9nZ2luZyA9ICgpID0+IHt9O1xuICAgICAgICAgICAgX29wdGlvbnMubG9nZ2luZy5fX3Rlc3RMb2dnaW5nRm4gPSB0cnVlO1xuXG4gICAgICAgICAgICAvL2Nvbm5lY3Rpb24gbWlnaHQgaGF2ZSBzZXQgZGF0YWJhc2VWZXJzaW9uIHZhbHVlIGF0IGluaXRpYWxpemF0aW9uLFxuICAgICAgICAgICAgLy9hdm9pZGluZyBhIHVzZWxlc3Mgcm91bmQgdHJpcFxuICAgICAgICAgICAgaWYgKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGF0YWJhc2VWZXJzaW9uID09PSAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5kYXRhYmFzZVZlcnNpb24oX29wdGlvbnMpLnRoZW4odmVyc2lvbiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkVmVyc2lvbiA9XG4gICAgICAgICAgICAgICAgICBfLmdldChzZW12ZXIuY29lcmNlKHZlcnNpb24pLCBcInZlcnNpb25cIikgfHwgdmVyc2lvbjtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRhdGFiYXNlVmVyc2lvbiA9IHNlbXZlci52YWxpZChcbiAgICAgICAgICAgICAgICAgIHBhcnNlZFZlcnNpb25cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICA/IHBhcnNlZFZlcnNpb25cbiAgICAgICAgICAgICAgICAgIDogdGhpcy5kZWZhdWx0VmVyc2lvbjtcbiAgICAgICAgICAgICAgICB0aGlzLnZlcnNpb25Qcm9taXNlID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGlzY29ubmVjdChjb25uZWN0aW9uKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudmVyc2lvblByb21pc2UgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc2Nvbm5lY3QoY29ubmVjdGlvbik7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIHRoaXMudmVyc2lvblByb21pc2UgPSBudWxsO1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG9vbFxuICAgICAgICAgIC5hY3F1aXJlKG9wdGlvbnMudHlwZSwgb3B0aW9ucy51c2VNYXN0ZXIpXG4gICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFRpbWVvdXRFcnJvcilcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IGVycm9ycy5Db25uZWN0aW9uQWNxdWlyZVRpbWVvdXRFcnJvcihlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGFwKCgpID0+IHtcbiAgICAgICAgZGVidWcoXCJjb25uZWN0aW9uIGFjcXVpcmVkXCIpO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVsZWFzZSBhIHBvb2xlZCBjb25uZWN0aW9uIHNvIGl0IGNhbiBiZSB1dGlsaXplZCBieSBvdGhlciBjb25uZWN0aW9uIHJlcXVlc3RzXG4gICAqXG4gICAqIEBwYXJhbSB7Q29ubmVjdGlvbn0gY29ubmVjdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHJlbGVhc2VDb25uZWN0aW9uKGNvbm5lY3Rpb24pIHtcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xuICAgICAgdGhpcy5wb29sLnJlbGVhc2UoY29ubmVjdGlvbik7XG4gICAgICBkZWJ1ZyhcImNvbm5lY3Rpb24gcmVsZWFzZWRcIik7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbCBkaWFsZWN0IGxpYnJhcnkgdG8gZ2V0IGNvbm5lY3Rpb25cbiAgICpcbiAgICogQHBhcmFtIHsqfSBjb25maWcgQ29ubmVjdGlvbiBjb25maWdcbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge1Byb21pc2U8Q29ubmVjdGlvbj59XG4gICAqL1xuICBfY29ubmVjdChjb25maWcpIHtcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemVcbiAgICAgIC5ydW5Ib29rcyhcImJlZm9yZUNvbm5lY3RcIiwgY29uZmlnKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kaWFsZWN0LmNvbm5lY3Rpb25NYW5hZ2VyLmNvbm5lY3QoY29uZmlnKSlcbiAgICAgIC50aGVuKGNvbm5lY3Rpb24gPT5cbiAgICAgICAgdGhpcy5zZXF1ZWxpemVcbiAgICAgICAgICAucnVuSG9va3MoXCJhZnRlckNvbm5lY3RcIiwgY29ubmVjdGlvbiwgY29uZmlnKVxuICAgICAgICAgIC5yZXR1cm4oY29ubmVjdGlvbilcbiAgICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbCBkaWFsZWN0IGxpYnJhcnkgdG8gZGlzY29ubmVjdCBhIGNvbm5lY3Rpb25cbiAgICpcbiAgICogQHBhcmFtIHtDb25uZWN0aW9ufSBjb25uZWN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgX2Rpc2Nvbm5lY3QoY29ubmVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZVxuICAgICAgLnJ1bkhvb2tzKFwiYmVmb3JlRGlzY29ubmVjdFwiLCBjb25uZWN0aW9uKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kaWFsZWN0LmNvbm5lY3Rpb25NYW5hZ2VyLmRpc2Nvbm5lY3QoY29ubmVjdGlvbikpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLnNlcXVlbGl6ZS5ydW5Ib29rcyhcImFmdGVyRGlzY29ubmVjdFwiLCBjb25uZWN0aW9uKSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIGEgY29ubmVjdGlvbiBpcyBzdGlsbCB2YWxpZCBvciBub3RcbiAgICpcbiAgICogQHBhcmFtIHtDb25uZWN0aW9ufSBjb25uZWN0aW9uXG4gICAqXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgX3ZhbGlkYXRlKGNvbm5lY3Rpb24pIHtcbiAgICBpZiAoIXRoaXMuZGlhbGVjdC5jb25uZWN0aW9uTWFuYWdlci52YWxpZGF0ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGlhbGVjdC5jb25uZWN0aW9uTWFuYWdlci52YWxpZGF0ZShjb25uZWN0aW9uKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3Rpb25NYW5hZ2VyO1xubW9kdWxlLmV4cG9ydHMuQ29ubmVjdGlvbk1hbmFnZXIgPSBDb25uZWN0aW9uTWFuYWdlcjtcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBDb25uZWN0aW9uTWFuYWdlcjtcbiJdfQ==