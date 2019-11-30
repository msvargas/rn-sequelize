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