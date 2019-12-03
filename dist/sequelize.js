"use strict";

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const retry = require("retry-as-promised");

const clsBluebird = require("cls-bluebird");

const _ = require("lodash");

const Utils = require("./utils");

const Model = require("./model");

const DataTypes = require("./data-types");

const Deferrable = require("./deferrable");

const ModelManager = require("./model-manager");

const QueryInterface = require("./query-interface");

const Transaction = require("./transaction");

const QueryTypes = require("./query-types");

const TableHints = require("./table-hints");

const IndexHints = require("./index-hints");

const sequelizeErrors = require("./errors");

const Promise = require("./promise");

const Hooks = require("./hooks");

const Association = require("./associations/index");

const Validator = require("./utils/validator-extras").validator;

const Op = require("./operators");

const deprecations = require("./utils/deprecations");
/**
 * This is the main class, the entry point to sequelize.
 */


let Sequelize =
/*#__PURE__*/
function () {
  /**
   * Instantiate sequelize with name of database, username and password.
   *
   * @example
   * // without password / with blank password
   * const sequelize = new Sequelize('database', 'username', null, {
   *   dialect: 'mysql'
   * })
   *
   * // with password and options
   * const sequelize = new Sequelize('my_database', 'john', 'doe', {
   *   dialect: 'postgres'
   * })
   *
   * // with database, username, and password in the options object
   * const sequelize = new Sequelize({ database, username, password, dialect: 'mssql' });
   *
   * // with uri
   * const sequelize = new Sequelize('mysql://localhost:3306/database', {})
   *
   * // option examples
   * const sequelize = new Sequelize('database', 'username', 'password', {
   *   // the sql dialect of the database
   *   // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
   *   dialect: 'mysql',
   *
   *   // custom host; default: localhost
   *   host: 'my.server.tld',
   *   // for postgres, you can also specify an absolute path to a directory
   *   // containing a UNIX socket to connect over
   *   // host: '/sockets/psql_sockets'.
   *
   *   // custom port; default: dialect default
   *   port: 12345,
   *
   *   // custom protocol; default: 'tcp'
   *   // postgres only, useful for Heroku
   *   protocol: null,
   *
   *   // disable logging or provide a custom logging function; default: console.log
   *   logging: false,
   *
   *   // you can also pass any dialect options to the underlying dialect library
   *   // - default is empty
   *   // - currently supported: 'mysql', 'postgres', 'mssql'
   *   dialectOptions: {
   *     socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock',
   *     supportBigNumbers: true,
   *     bigNumberStrings: true
   *   },
   *
   *   // the storage engine for sqlite
   *   // - default ':memory:'
   *   storage: 'path/to/database.sqlite',
   *
   *   // disable inserting undefined values as NULL
   *   // - default: false
   *   omitNull: true,
   *
   *   // a flag for using a native library or not.
   *   // in the case of 'pg' -- set this to true will allow SSL support
   *   // - default: false
   *   native: true,
   *
   *   // Specify options, which are used when sequelize.define is called.
   *   // The following example:
   *   //   define: { timestamps: false }
   *   // is basically the same as:
   *   //   Model.init(attributes, { timestamps: false });
   *   //   sequelize.define(name, attributes, { timestamps: false });
   *   // so defining the timestamps for each model will be not necessary
   *   define: {
   *     underscored: false,
   *     freezeTableName: false,
   *     charset: 'utf8',
   *     dialectOptions: {
   *       collate: 'utf8_general_ci'
   *     },
   *     timestamps: true
   *   },
   *
   *   // similar for sync: you can define this to always force sync for models
   *   sync: { force: true },
   *
   *   // pool configuration used to pool database connections
   *   pool: {
   *     max: 5,
   *     idle: 30000,
   *     acquire: 60000,
   *   },
   *
   *   // isolation level of each transaction
   *   // defaults to dialect default
   *   isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ
   * })
   *
   * @param {string}   [database] The name of the database
   * @param {string}   [username=null] The username which is used to authenticate against the database.
   * @param {string}   [password=null] The password which is used to authenticate against the database. Supports SQLCipher encryption for SQLite.
   * @param {Object}   [options={}] An object with options.
   * @param {string}   [options.host='localhost'] The host of the relational database.
   * @param {number}   [options.port=] The port of the relational database.
   * @param {string}   [options.username=null] The username which is used to authenticate against the database.
   * @param {string}   [options.password=null] The password which is used to authenticate against the database.
   * @param {string}   [options.database=null] The name of the database
   * @param {string}   [options.dialect] The dialect of the database you are connecting to. One of mysql, postgres, sqlite and mssql.
   * @param {string}   [options.dialectModule=null] If specified, use this dialect library. For example, if you want to use pg.js instead of pg when connecting to a pg database, you should specify 'require("pg.js")' here
   * @param {string}   [options.dialectModulePath=null] If specified, load the dialect library from this path. For example, if you want to use pg.js instead of pg when connecting to a pg database, you should specify '/path/to/pg.js' here
   * @param {Object}   [options.dialectOptions] An object of additional options, which are passed directly to the connection library
   * @param {string}   [options.storage] Only used by sqlite. Defaults to ':memory:'
   * @param {string}   [options.protocol='tcp'] The protocol of the relational database.
   * @param {Object}   [options.define={}] Default options for model definitions. See {@link Model.init}.
   * @param {Object}   [options.query={}] Default options for sequelize.query
   * @param {string}   [options.schema=null] A schema to use
   * @param {Object}   [options.set={}] Default options for sequelize.set
   * @param {Object}   [options.sync={}] Default options for sequelize.sync
   * @param {string}   [options.timezone='+00:00'] The timezone used when converting a date from the database into a JavaScript date. The timezone is also used to SET TIMEZONE when connecting to the server, to ensure that the result of NOW, CURRENT_TIMESTAMP and other time related functions have in the right timezone. For best cross platform performance use the format +/-HH:MM. Will also accept string versions of timezones used by moment.js (e.g. 'America/Los_Angeles'); this is useful to capture daylight savings time changes.
   * @param {string|boolean} [options.clientMinMessages='warning'] The PostgreSQL `client_min_messages` session parameter. Set to `false` to not override the database's default.
   * @param {boolean}  [options.standardConformingStrings=true] The PostgreSQL `standard_conforming_strings` session parameter. Set to `false` to not set the option. WARNING: Setting this to false may expose vulnerabilities and is not recommended!
   * @param {Function} [options.logging=console.log] A function that gets executed every time Sequelize would log something.
   * @param {boolean}  [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
   * @param {boolean}  [options.omitNull=false] A flag that defines if null values should be passed to SQL queries or not.
   * @param {boolean}  [options.native=false] A flag that defines if native library shall be used or not. Currently only has an effect for postgres
   * @param {boolean}  [options.replication=false] Use read / write replication. To enable replication, pass an object, with two properties, read and write. Write should be an object (a single server for handling writes), and read an array of object (several servers to handle reads). Each read/write server can have the following properties: `host`, `port`, `username`, `password`, `database`
   * @param {Object}   [options.pool] sequelize connection pool configuration
   * @param {number}   [options.pool.max=5] Maximum number of connection in pool
   * @param {number}   [options.pool.min=0] Minimum number of connection in pool
   * @param {number}   [options.pool.idle=10000] The maximum time, in milliseconds, that a connection can be idle before being released.
   * @param {number}   [options.pool.acquire=60000] The maximum time, in milliseconds, that pool will try to get connection before throwing error
   * @param {number}   [options.pool.evict=1000] The time interval, in milliseconds, after which sequelize-pool will remove idle connections.
   * @param {Function} [options.pool.validate] A function that validates a connection. Called with client. The default function checks that client is an object, and that its state is not disconnected
   * @param {boolean}  [options.quoteIdentifiers=true] Set to `false` to make table names and attributes case-insensitive on Postgres and skip double quoting of them.  WARNING: Setting this to false may expose vulnerabilities and is not recommended!
   * @param {string}   [options.transactionType='DEFERRED'] Set the default transaction type. See `Sequelize.Transaction.TYPES` for possible options. Sqlite only.
   * @param {string}   [options.isolationLevel] Set the default transaction isolation level. See `Sequelize.Transaction.ISOLATION_LEVELS` for possible options.
   * @param {Object}   [options.retry] Set of flags that control when a query is automatically retried.
   * @param {Array}    [options.retry.match] Only retry a query if the error matches one of these strings.
   * @param {number}   [options.retry.max] How many times a failing query is automatically retried.  Set to 0 to disable retrying on SQL_BUSY error.
   * @param {boolean}  [options.typeValidation=false] Run built-in type validators on insert and update, and select with where clause, e.g. validate that arguments passed to integer fields are integer-like.
   * @param {Object}   [options.operatorsAliases] String based operator alias. Pass object to limit set of aliased operators.
   * @param {Object}   [options.hooks] An object of global hook functions that are called before and after certain lifecycle events. Global hooks will run after any model-specific hooks defined for the same event (See `Sequelize.Model.init()` for a list).  Additionally, `beforeConnect()`, `afterConnect()`, `beforeDisconnect()`, and `afterDisconnect()` hooks may be defined here.
   * @param {boolean}  [options.minifyAliases=false] A flag that defines if aliases should be minified (mostly useful to avoid Postgres alias character limit of 64)
   * @param {boolean}  [options.logQueryParameters=false] A flag that defines if show bind patameters in log.
   */
  function Sequelize(database, username, password, options) {
    _classCallCheck(this, Sequelize);

    let config;

    if (arguments.length === 1 && typeof database === "object") {
      // new Sequelize({ ... options })
      options = database;
      config = _.pick(options, "host", "port", "database", "username", "password");
    } else if (arguments.length === 1 && typeof database === "string" || arguments.length === 2 && typeof username === "object") {
      // new Sequelize(URI, { ... options })
      config = {};
      options = username || {};
    } else {
      // new Sequelize(database, username, password, { ... options })
      options = options || {};
      config = {
        database,
        username,
        password
      };
    }

    Sequelize.runHooks("beforeInit", config, options);
    this.options = Object.assign({
      dialect: "sqlite",
      dialectModule: null,
      dialectModulePath: null,
      host: "localhost",
      protocol: "tcp",
      define: {},
      query: {},
      sync: {},
      timezone: "+00:00",
      clientMinMessages: "warning",
      standardConformingStrings: true,
      // eslint-disable-next-line no-console
      logging: console.log,
      omitNull: false,
      native: false,
      replication: false,
      ssl: undefined,
      pool: {},
      quoteIdentifiers: true,
      hooks: {},
      retry: {
        max: 5,
        match: ["SQLITE_BUSY: database is locked"]
      },
      transactionType: Transaction.TYPES.DEFERRED,
      isolationLevel: null,
      databaseVersion: 0,
      typeValidation: false,
      benchmark: false,
      minifyAliases: false,
      logQueryParameters: false
    }, options || {});

    if (!this.options.dialect) {
      throw new Error("Dialect needs to be explicitly supplied as of v4.0.0");
    }

    if (this.options.dialect === "postgresql") {
      this.options.dialect = "postgres";
    }

    if (this.options.dialect === "sqlite" && this.options.timezone !== "+00:00") {
      throw new Error("Setting a custom timezone is not supported by SQLite, dates are always returned as UTC. Please remove the custom timezone parameter.");
    }

    if (this.options.logging === true) {
      deprecations.noTrueLogging(); // eslint-disable-next-line no-console

      this.options.logging = console.log;
    }

    this._setupHooks(options.hooks);

    this.config = {
      database: config.database || this.options.database,
      username: config.username || this.options.username,
      password: config.password || this.options.password || null,
      host: config.host || this.options.host,
      port: config.port || this.options.port,
      pool: this.options.pool,
      protocol: this.options.protocol,
      native: this.options.native,
      ssl: this.options.ssl,
      replication: this.options.replication,
      dialectModule: this.options.dialectModule,
      dialectModulePath: this.options.dialectModulePath,
      keepDefaultTimezone: this.options.keepDefaultTimezone,
      dialectOptions: this.options.dialectOptions
    };
    let Dialect; // Requiring the dialect in a switch-case to keep the
    // require calls static. (Browserify fix)

    switch (this.getDialect()) {
      case "sqlite":
        // eslint-disable-next-line
        Dialect = require("./dialects/sqlite");
        break;

      default:
        throw new Error(`The dialect ${this.getDialect()} is not supported. Supported dialects: sqlite.`);
    }

    this.dialect = new Dialect(this);
    this.dialect.QueryGenerator.typeValidation = options.typeValidation;

    if (_.isPlainObject(this.options.operatorsAliases)) {
      deprecations.noStringOperators();
      this.dialect.QueryGenerator.setOperatorsAliases(this.options.operatorsAliases);
    } else if (typeof this.options.operatorsAliases === "boolean") {
      deprecations.noBoolOperatorAliases();
    }

    this.queryInterface = new QueryInterface(this);
    /**
     * Models are stored here under the name given to `sequelize.define`
     */

    this.models = {};
    this.modelManager = new ModelManager(this);
    this.connectionManager = this.dialect.connectionManager;
    this.importCache = {};
    Sequelize.runHooks("afterInit", this);
  }
  /**
   * Refresh data types and parsers.
   *
   * @private
   */


  _createClass(Sequelize, [{
    key: "refreshTypes",
    value: function refreshTypes() {
      this.connectionManager.refreshTypeParser(DataTypes);
    }
    /**
     * Returns the specified dialect.
     *
     * @returns {string} The specified dialect.
     */

  }, {
    key: "getDialect",
    value: function getDialect() {
      return this.options.dialect;
    }
    /**
     * Returns the database name.
     *
     * @returns {string} The database name.
     */

  }, {
    key: "getDatabaseName",
    value: function getDatabaseName() {
      return this.config.database;
    }
    /**
     * Returns an instance of QueryInterface.
     *
     * @returns {QueryInterface} An instance (singleton) of QueryInterface.
     */

  }, {
    key: "getQueryInterface",
    value: function getQueryInterface() {
      this.queryInterface = this.queryInterface || new QueryInterface(this);
      return this.queryInterface;
    }
    /**
     * Define a new model, representing a table in the database.
     *
     * The table columns are defined by the object that is given as the second argument. Each key of the object represents a column
     *
     * @param {string} modelName The name of the model. The model will be stored in `sequelize.models` under this name
     * @param {Object} attributes An object, where each attribute is a column of the table. See {@link Model.init}
     * @param {Object} [options] These options are merged with the default define options provided to the Sequelize constructor and passed to Model.init()
     *
     * @see
     * {@link Model.init} for a more comprehensive specification of the `options` and `attributes` objects.
     * @see <a href="/manual/tutorial/models-definition.html">Model definition</a> Manual related to model definition
     * @see
     * {@link DataTypes} For a list of possible data types
     *
     * @returns {Model} Newly defined model
     *
     * @example
     * sequelize.define('modelName', {
     *   columnA: {
     *       type: Sequelize.BOOLEAN,
     *       validate: {
     *         is: ["[a-z]",'i'],        // will only allow letters
     *         max: 23,                  // only allow values <= 23
     *         isIn: {
     *           args: [['en', 'zh']],
     *           msg: "Must be English or Chinese"
     *         }
     *       },
     *       field: 'column_a'
     *   },
     *   columnB: Sequelize.STRING,
     *   columnC: 'MY VERY OWN COLUMN TYPE'
     * });
     *
     * sequelize.models.modelName // The model will now be available in models under the name given to define
     */

  }, {
    key: "define",
    value: function define(modelName, attributes, options = {}) {
      options.modelName = modelName;
      options.sequelize = this;

      const model =
      /*#__PURE__*/
      function (_Model) {
        _inherits(model, _Model);

        function model() {
          _classCallCheck(this, model);

          return _possibleConstructorReturn(this, _getPrototypeOf(model).apply(this, arguments));
        }

        return model;
      }(Model);

      model.init(attributes, options);
      return model;
    }
    /**
     * Fetch a Model which is already defined
     *
     * @param {string} modelName The name of a model defined with Sequelize.define
     *
     * @throws Will throw an error if the model is not defined (that is, if sequelize#isDefined returns false)
     * @returns {Model} Specified model
     */

  }, {
    key: "model",
    value: function model(modelName) {
      if (!this.isDefined(modelName)) {
        throw new Error(`${modelName} has not been defined`);
      }

      return this.modelManager.getModel(modelName);
    }
    /**
     * Checks whether a model with the given name is defined
     *
     * @param {string} modelName The name of a model defined with Sequelize.define
     *
     * @returns {boolean} Returns true if model is already defined, otherwise false
     */

  }, {
    key: "isDefined",
    value: function isDefined(modelName) {
      return !!this.modelManager.models.find(model => model.name === modelName);
    }
    /**
     * Imports a model defined in another file. Imported models are cached, so multiple
     * calls to import with the same path will not load the file multiple times.
     *
     * @tutorial https://github.com/sequelize/express-example
     *
     * @param {string} importPath The path to the file that holds the model you want to import. If the part is relative, it will be resolved relatively to the calling file
     *
     * @returns {Model} Imported model, returned from cache if was already imported
     */

  }, {
    key: "import",
    value: function _import(importPath) {}
    /**
     * Execute a query on the DB, optionally bypassing all the Sequelize goodness.
     *
     * By default, the function will return two arguments: an array of results, and a metadata object, containing number of affected rows etc.
     *
     * If you are running a type of query where you don't need the metadata, for example a `SELECT` query, you can pass in a query type to make sequelize format the results:
     *
     * ```js
     * sequelize.query('SELECT...').then(([results, metadata]) => {
     *   // Raw query - use then plus array spread
     * });
     *
     * sequelize.query('SELECT...', { type: sequelize.QueryTypes.SELECT }).then(results => {
     *   // SELECT query - use then
     * })
     * ```
     *
     * @param {string}          sql
     * @param {Object}          [options={}] Query options.
     * @param {boolean}         [options.raw] If true, sequelize will not try to format the results of the query, or build an instance of a model from the result
     * @param {Transaction}     [options.transaction=null] The transaction that the query should be executed under
     * @param {QueryTypes}      [options.type='RAW'] The type of query you are executing. The query type affects how results are formatted before they are passed back. The type is a string, but `Sequelize.QueryTypes` is provided as convenience shortcuts.
     * @param {boolean}         [options.nest=false] If true, transforms objects with `.` separated property names into nested objects using [dottie.js](https://github.com/mickhansen/dottie.js). For example { 'user.username': 'john' } becomes { user: { username: 'john' }}. When `nest` is true, the query type is assumed to be `'SELECT'`, unless otherwise specified
     * @param {boolean}         [options.plain=false] Sets the query type to `SELECT` and return a single row
     * @param {Object|Array}    [options.replacements] Either an object of named parameter replacements in the format `:param` or an array of unnamed replacements to replace `?` in your SQL.
     * @param {Object|Array}    [options.bind] Either an object of named bind parameter in the format `_param` or an array of unnamed bind parameter to replace `$1, $2, ...` in your SQL.
     * @param {boolean}         [options.useMaster=false] Force the query to use the write pool, regardless of the query type.
     * @param {Function}        [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {new Model()}     [options.instance] A sequelize instance used to build the return instance
     * @param {Model}           [options.model] A sequelize model used to build the returned model instances (used to be called callee)
     * @param {Object}          [options.retry] Set of flags that control when a query is automatically retried.
     * @param {Array}           [options.retry.match] Only retry a query if the error matches one of these strings.
     * @param {Integer}         [options.retry.max] How many times a failing query is automatically retried.
     * @param {string}          [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     * @param {boolean}         [options.supportsSearchPath] If false do not prepend the query with the search_path (Postgres only)
     * @param {boolean}         [options.mapToModel=false] Map returned fields to model's fields if `options.model` or `options.instance` is present. Mapping will occur before building the model instance.
     * @param {Object}          [options.fieldMap] Map returned fields to arbitrary names for `SELECT` query type.
     *
     * @returns {Promise}
     *
     * @see {@link Model.build} for more information about instance option.
     */

  }, {
    key: "query",
    value: function query(sql, options) {
      options = Object.assign({}, this.options.query, options);

      if (options.instance && !options.model) {
        options.model = options.instance.constructor;
      }

      if (!options.instance && !options.model) {
        options.raw = true;
      } // map raw fields to model attributes


      if (options.mapToModel) {
        options.fieldMap = _.get(options, "model.fieldAttributeMap", {});
      }

      options = _.defaults(options, {
        // eslint-disable-next-line no-console
        logging: Object.prototype.hasOwnProperty.call(this.options, "logging") ? this.options.logging : console.log,
        searchPath: Object.prototype.hasOwnProperty.call(this.options, "searchPath") ? this.options.searchPath : "DEFAULT"
      });

      if (!options.type) {
        if (options.model || options.nest || options.plain) {
          options.type = QueryTypes.SELECT;
        } else {
          options.type = QueryTypes.RAW;
        }
      } //if dialect doesn't support search_path or dialect option
      //to prepend searchPath is not true delete the searchPath option


      if (!this.dialect.supports.searchPath || !this.options.dialectOptions || !this.options.dialectOptions.prependSearchPath || options.supportsSearchPath === false) {
        delete options.searchPath;
      } else if (!options.searchPath) {
        //if user wants to always prepend searchPath (dialectOptions.preprendSearchPath = true)
        //then set to DEFAULT if none is provided
        options.searchPath = "DEFAULT";
      }

      return Promise.try(() => {
        if (typeof sql === "object") {
          if (sql.values !== undefined) {
            if (options.replacements !== undefined) {
              throw new Error("Both `sql.values` and `options.replacements` cannot be set at the same time");
            }

            options.replacements = sql.values;
          }

          if (sql.bind !== undefined) {
            if (options.bind !== undefined) {
              throw new Error("Both `sql.bind` and `options.bind` cannot be set at the same time");
            }

            options.bind = sql.bind;
          }

          if (sql.query !== undefined) {
            sql = sql.query;
          }
        }

        sql = sql.trim();

        if (options.replacements && options.bind) {
          throw new Error("Both `replacements` and `bind` cannot be set at the same time");
        }

        if (options.replacements) {
          if (Array.isArray(options.replacements)) {
            sql = Utils.format([sql].concat(options.replacements), this.options.dialect);
          } else {
            sql = Utils.formatNamedParameters(sql, options.replacements, this.options.dialect);
          }
        }

        let bindParameters;

        if (options.bind) {
          [sql, bindParameters] = this.dialect.Query.formatBindParameters(sql, options.bind, this.options.dialect);
        }

        const checkTransaction = () => {
          if (options.transaction && options.transaction.finished && !options.completesTransaction) {
            const error = new Error(`${options.transaction.finished} has been called on this transaction(${options.transaction.id}), you can no longer use it. (The rejected query is attached as the 'sql' property of this error)`);
            error.sql = sql;
            throw error;
          }
        };

        const retryOptions = Object.assign({}, this.options.retry, options.retry || {});
        return Promise.resolve(retry(() => Promise.try(() => {
          if (options.transaction === undefined && Sequelize._cls) {
            options.transaction = Sequelize._cls.get("transaction");
          }

          checkTransaction();
          return options.transaction ? options.transaction.connection : this.connectionManager.getConnection(options);
        }).then(connection => {
          const query = new this.dialect.Query(connection, this, options);
          return this.runHooks("beforeQuery", options, query).then(() => checkTransaction()).then(() => query.run(sql, bindParameters)).finally(() => this.runHooks("afterQuery", options, query)).finally(() => {
            if (!options.transaction) {
              return this.connectionManager.releaseConnection(connection);
            }
          });
        }), retryOptions));
      });
    }
    /**
     * Execute a query which would set an environment or user variable. The variables are set per connection, so this function needs a transaction.
     * Only works for MySQL.
     *
     * @param {Object}        variables Object with multiple variables.
     * @param {Object}        [options] query options.
     * @param {Transaction}   [options.transaction] The transaction that the query should be executed under
     *
     * @memberof Sequelize
     *
     * @returns {Promise}
     */

  }, {
    key: "set",
    value: function set(variables, options) {
      // Prepare options
      options = Object.assign({}, this.options.set, typeof options === "object" && options);

      if (this.options.dialect !== "mysql") {
        throw new Error("sequelize.set is only supported for mysql");
      }

      if (!options.transaction || !(options.transaction instanceof Transaction)) {
        throw new TypeError("options.transaction is required");
      } // Override some options, since this isn't a SELECT


      options.raw = true;
      options.plain = true;
      options.type = "SET"; // Generate SQL Query

      const query = `SET ${_.map(variables, (v, k) => `@${k} := ${typeof v === "string" ? `"${v}"` : v}`).join(", ")}`;
      return this.query(query, options);
    }
    /**
     * Escape value.
     *
     * @param {string} value string value to escape
     *
     * @returns {string}
     */

  }, {
    key: "escape",
    value: function escape(value) {
      return this.getQueryInterface().escape(value);
    }
    /**
     * Create a new database schema.
     *
     * **Note:** this is a schema in the [postgres sense of the word](http://www.postgresql.org/docs/9.1/static/ddl-schemas.html),
     * not a database table. In mysql and sqlite, this command will do nothing.
     *
     * @see
     * {@link Model.schema}
     *
     * @param {string} schema Name of the schema
     * @param {Object} [options={}] query options
     * @param {boolean|Function} [options.logging] A function that logs sql queries, or false for no logging
     *
     * @returns {Promise}
     */

  }, {
    key: "createSchema",
    value: function createSchema(schema, options) {
      return this.getQueryInterface().createSchema(schema, options);
    }
    /**
     * Show all defined schemas
     *
     * **Note:** this is a schema in the [postgres sense of the word](http://www.postgresql.org/docs/9.1/static/ddl-schemas.html),
     * not a database table. In mysql and sqlite, this will show all tables.
     *
     * @param {Object} [options={}] query options
     * @param {boolean|Function} [options.logging] A function that logs sql queries, or false for no logging
     *
     * @returns {Promise}
     */

  }, {
    key: "showAllSchemas",
    value: function showAllSchemas(options) {
      return this.getQueryInterface().showAllSchemas(options);
    }
    /**
     * Drop a single schema
     *
     * **Note:** this is a schema in the [postgres sense of the word](http://www.postgresql.org/docs/9.1/static/ddl-schemas.html),
     * not a database table. In mysql and sqlite, this drop a table matching the schema name
     *
     * @param {string} schema Name of the schema
     * @param {Object} [options={}] query options
     * @param {boolean|Function} [options.logging] A function that logs sql queries, or false for no logging
     *
     * @returns {Promise}
     */

  }, {
    key: "dropSchema",
    value: function dropSchema(schema, options) {
      return this.getQueryInterface().dropSchema(schema, options);
    }
    /**
     * Drop all schemas.
     *
     * **Note:** this is a schema in the [postgres sense of the word](http://www.postgresql.org/docs/9.1/static/ddl-schemas.html),
     * not a database table. In mysql and sqlite, this is the equivalent of drop all tables.
     *
     * @param {Object} [options={}] query options
     * @param {boolean|Function} [options.logging] A function that logs sql queries, or false for no logging
     *
     * @returns {Promise}
     */

  }, {
    key: "dropAllSchemas",
    value: function dropAllSchemas(options) {
      return this.getQueryInterface().dropAllSchemas(options);
    }
    /**
     * Sync all defined models to the DB.
     *
     * @param {Object} [options={}] sync options
     * @param {boolean} [options.force=false] If force is true, each Model will run `DROP TABLE IF EXISTS`, before it tries to create its own table
     * @param {RegExp} [options.match] Match a regex against the database name before syncing, a safety check for cases where force: true is used in tests but not live code
     * @param {boolean|Function} [options.logging=console.log] A function that logs sql queries, or false for no logging
     * @param {string} [options.schema='public'] The schema that the tables should be created in. This can be overridden for each table in sequelize.define
     * @param {string} [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     * @param {boolean} [options.hooks=true] If hooks is true then beforeSync, afterSync, beforeBulkSync, afterBulkSync hooks will be called
     * @param {boolean} [options.alter=false] Alters tables to fit models. Not recommended for production use. Deletes data in columns that were removed or had their type changed in the model.
     *
     * @returns {Promise}
     */

  }, {
    key: "sync",
    value: function sync(options) {
      options = _.clone(options) || {};
      options.hooks = options.hooks === undefined ? true : !!options.hooks;
      options = _.defaults(options, this.options.sync, this.options);

      if (options.match) {
        if (!options.match.test(this.config.database)) {
          return Promise.reject(new Error(`Database "${this.config.database}" does not match sync match parameter "${options.match}"`));
        }
      }

      return Promise.try(() => {
        if (options.hooks) {
          return this.runHooks("beforeBulkSync", options);
        }
      }).then(() => {
        if (options.force) {
          return this.drop(options);
        }
      }).then(() => {
        const models = []; // Topologically sort by foreign key constraints to give us an appropriate
        // creation order

        this.modelManager.forEachModel(model => {
          if (model) {
            models.push(model);
          } else {// DB should throw an SQL error if referencing non-existent table
          }
        }); // no models defined, just authenticate

        if (!models.length) return this.authenticate(options);
        return Promise.each(models, model => model.sync(options));
      }).then(() => {
        if (options.hooks) {
          return this.runHooks("afterBulkSync", options);
        }
      }).return(this);
    }
    /**
     * Truncate all tables defined through the sequelize models.
     * This is done by calling `Model.truncate()` on each model.
     *
     * @param {Object} [options] The options passed to Model.destroy in addition to truncate
     * @param {boolean|Function} [options.logging] A function that logs sql queries, or false for no logging
     * @returns {Promise}
     *
     * @see
     * {@link Model.truncate} for more information
     */

  }, {
    key: "truncate",
    value: function truncate(options) {
      const models = [];
      this.modelManager.forEachModel(model => {
        if (model) {
          models.push(model);
        }
      }, {
        reverse: false
      });

      const truncateModel = model => model.truncate(options);

      if (options && options.cascade) {
        return Promise.each(models, truncateModel);
      }

      return Promise.map(models, truncateModel);
    }
    /**
     * Drop all tables defined through this sequelize instance.
     * This is done by calling Model.drop on each model.
     *
     * @see
     * {@link Model.drop} for options
     *
     * @param {Object} [options] The options passed to each call to Model.drop
     * @param {boolean|Function} [options.logging] A function that logs sql queries, or false for no logging
     *
     * @returns {Promise}
     */

  }, {
    key: "drop",
    value: function drop(options) {
      const models = [];
      this.modelManager.forEachModel(model => {
        if (model) {
          models.push(model);
        }
      }, {
        reverse: false
      });
      return Promise.each(models, model => model.drop(options));
    }
    /**
     * Test the connection by trying to authenticate. It runs `SELECT 1+1 AS result` query.
     *
     * @param {Object} [options={}] query options
     *
     * @returns {Promise}
     */

  }, {
    key: "authenticate",
    value: function authenticate(options) {
      options = Object.assign({
        raw: true,
        plain: true,
        type: QueryTypes.SELECT
      }, options);
      return this.query("SELECT 1+1 AS result", options).return();
    }
  }, {
    key: "databaseVersion",
    value: function databaseVersion(options) {
      return this.getQueryInterface().databaseVersion(options);
    }
    /**
     * Get the fn for random based on the dialect
     *
     * @returns {Sequelize.fn}
     */

  }, {
    key: "random",
    value: function random() {
      const dia = this.getDialect();

      if (dia === "postgres" || dia === "sqlite") {
        return this.fn("RANDOM");
      }

      return this.fn("RAND");
    }
    /**
     * Creates an object representing a database function. This can be used in search queries, both in where and order parts, and as default values in column definitions.
     * If you want to refer to columns in your function, you should use `sequelize.col`, so that the columns are properly interpreted as columns and not a strings.
     *
     * @see
     * {@link Model.findAll}
     * @see
     * {@link Sequelize.define}
     * @see
     * {@link Sequelize.col}
     *
     * @param {string} fn The function you want to call
     * @param {any} args All further arguments will be passed as arguments to the function
     *
     * @since v2.0.0-dev3
     * @memberof Sequelize
     * @returns {Sequelize.fn}
     *
     * @example <caption>Convert a user's username to upper case</caption>
     * instance.update({
     *   username: sequelize.fn('upper', sequelize.col('username'))
     * });
     */

  }, {
    key: "transaction",

    /**
     * Start a transaction. When using transactions, you should pass the transaction in the options argument in order for the query to happen under that transaction @see {@link Transaction}
     *
     * If you have [CLS](https://github.com/othiym23/node-continuation-local-storage) enabled, the transaction will automatically be passed to any query that runs within the callback
     *
     * @example
     * sequelize.transaction().then(transaction => {
     *   return User.findOne(..., {transaction})
     *     .then(user => user.update(..., {transaction}))
     *     .then(() => transaction.commit())
     *     .catch(() => transaction.rollback());
     * })
     *
     * @example <caption>A syntax for automatically committing or rolling back based on the promise chain resolution is also supported</caption>
     *
     * sequelize.transaction(transaction => { // Note that we use a callback rather than a promise.then()
     *   return User.findOne(..., {transaction})
     *     .then(user => user.update(..., {transaction}))
     * }).then(() => {
     *   // Committed
     * }).catch(err => {
     *   // Rolled back
     *   console.error(err);
     * });
     *
     * @example <caption>To enable CLS, add it do your project, create a namespace and set it on the sequelize constructor:</caption>
     *
     * const cls = require('continuation-local-storage');
     * const ns = cls.createNamespace('....');
     * const Sequelize = require('sequelize');
     * Sequelize.useCLS(ns);
     *
     * // Note, that CLS is enabled for all sequelize instances, and all instances will share the same namespace
     *
     * @param {Object}   [options] Transaction options
     * @param {string}   [options.type='DEFERRED'] See `Sequelize.Transaction.TYPES` for possible options. Sqlite only.
     * @param {string}   [options.isolationLevel] See `Sequelize.Transaction.ISOLATION_LEVELS` for possible options
     * @param {string}   [options.deferrable] Sets the constraints to be deferred or immediately checked. See `Sequelize.Deferrable`. PostgreSQL Only
     * @param {Function} [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {Function} [autoCallback] The callback is called with the transaction object, and should return a promise. If the promise is resolved, the transaction commits; if the promise rejects, the transaction rolls back
     *
     * @returns {Promise}
     */
    value: function transaction(options, autoCallback) {
      if (typeof options === "function") {
        autoCallback = options;
        options = undefined;
      }

      const transaction = new Transaction(this, options);
      if (!autoCallback) return transaction.prepareEnvironment(false).return(transaction); // autoCallback provided

      return Sequelize._clsRun(() => {
        return transaction.prepareEnvironment().then(() => autoCallback(transaction)).tap(() => transaction.commit()).catch(err => {
          // Rollback transaction if not already finished (commit, rollback, etc)
          // and reject with original error (ignore any error in rollback)
          return Promise.try(() => {
            if (!transaction.finished) return transaction.rollback().catch(() => {});
          }).throw(err);
        });
      });
    }
    /**
     * Use CLS with Sequelize.
     * CLS namespace provided is stored as `Sequelize._cls`
     * and bluebird Promise is patched to use the namespace, using `cls-bluebird` module.
     *
     * @param {Object} ns CLS namespace
     * @returns {Object} Sequelize constructor
     */

  }, {
    key: "log",
    value: function log(...args) {
      let options;

      const last = _.last(args);

      if (last && _.isPlainObject(last) && Object.prototype.hasOwnProperty.call(last, "logging")) {
        options = last; // remove options from set of logged arguments if options.logging is equal to console.log
        // eslint-disable-next-line no-console

        if (options.logging === console.log) {
          args.splice(args.length - 1, 1);
        }
      } else {
        options = this.options;
      }

      if (options.logging) {
        if (options.logging === true) {
          deprecations.noTrueLogging(); // eslint-disable-next-line no-console

          options.logging = console.log;
        } // second argument is sql-timings, when benchmarking option enabled
        // eslint-disable-next-line no-console


        if ((this.options.benchmark || options.benchmark) && options.logging === console.log) {
          args = [`${args[0]} Elapsed time: ${args[1]}ms`];
        }

        options.logging(...args);
      }
    }
    /**
     * Close all connections used by this sequelize instance, and free all references so the instance can be garbage collected.
     *
     * Normally this is done on process exit, so you only need to call this method if you are creating multiple instances, and want
     * to garbage collect some of them.
     *
     * @returns {Promise}
     */

  }, {
    key: "close",
    value: function close() {
      return this.connectionManager.close();
    }
  }, {
    key: "normalizeDataType",
    value: function normalizeDataType(Type) {
      let type = typeof Type === "function" ? new Type() : Type;
      const dialectTypes = this.dialect.DataTypes || {};

      if (dialectTypes[type.key]) {
        type = dialectTypes[type.key].extend(type);
      }

      if (type instanceof DataTypes.ARRAY) {
        if (!type.type) {
          throw new Error("ARRAY is missing type definition for its values.");
        }

        if (dialectTypes[type.type.key]) {
          type.type = dialectTypes[type.type.key].extend(type.type);
        }
      }

      return type;
    }
  }, {
    key: "normalizeAttribute",
    value: function normalizeAttribute(attribute) {
      if (!_.isPlainObject(attribute)) {
        attribute = {
          type: attribute
        };
      }

      if (!attribute.type) return attribute;
      attribute.type = this.normalizeDataType(attribute.type);

      if (Object.prototype.hasOwnProperty.call(attribute, "defaultValue")) {
        if (typeof attribute.defaultValue === "function" && (attribute.defaultValue === DataTypes.NOW || attribute.defaultValue === DataTypes.UUIDV1 || attribute.defaultValue === DataTypes.UUIDV4)) {
          attribute.defaultValue = new attribute.defaultValue();
        }
      }

      if (attribute.type instanceof DataTypes.ENUM) {
        // The ENUM is a special case where the type is an object containing the values
        if (attribute.values) {
          attribute.type.values = attribute.type.options.values = attribute.values;
        } else {
          attribute.values = attribute.type.values;
        }

        if (!attribute.values.length) {
          throw new Error("Values for ENUM have not been defined.");
        }
      }

      return attribute;
    }
  }], [{
    key: "fn",
    value: function fn(_fn, ...args) {
      return new Utils.Fn(_fn, args);
    }
    /**
     * Creates an object which represents a column in the DB, this allows referencing another column in your query. This is often useful in conjunction with `sequelize.fn`, since raw string arguments to fn will be escaped.
     *
     * @see
     * {@link Sequelize#fn}
     *
     * @param {string} col The name of the column
     * @since v2.0.0-dev3
     * @memberof Sequelize
     *
     * @returns {Sequelize.col}
     */

  }, {
    key: "col",
    value: function col(_col) {
      return new Utils.Col(_col);
    }
    /**
     * Creates an object representing a call to the cast function.
     *
     * @param {any} val The value to cast
     * @param {string} type The type to cast it to
     * @since v2.0.0-dev3
     * @memberof Sequelize
     *
     * @returns {Sequelize.cast}
     */

  }, {
    key: "cast",
    value: function cast(val, type) {
      return new Utils.Cast(val, type);
    }
    /**
     * Creates an object representing a literal, i.e. something that will not be escaped.
     *
     * @param {any} val literal value
     * @since v2.0.0-dev3
     * @memberof Sequelize
     *
     * @returns {Sequelize.literal}
     */

  }, {
    key: "literal",
    value: function literal(val) {
      return new Utils.Literal(val);
    }
    /**
     * An AND query
     *
     * @see
     * {@link Model.findAll}
     *
     * @param {...string|Object} args Each argument will be joined by AND
     * @since v2.0.0-dev3
     * @memberof Sequelize
     *
     * @returns {Sequelize.and}
     */

  }, {
    key: "and",
    value: function and(...args) {
      return {
        [Op.and]: args
      };
    }
    /**
     * An OR query
     *
     * @see
     * {@link Model.findAll}
     *
     * @param {...string|Object} args Each argument will be joined by OR
     * @since v2.0.0-dev3
     * @memberof Sequelize
     *
     * @returns {Sequelize.or}
     */

  }, {
    key: "or",
    value: function or(...args) {
      return {
        [Op.or]: args
      };
    }
    /**
     * Creates an object representing nested where conditions for postgres/sqlite/mysql json data-type.
     *
     * @see
     * {@link Model.findAll}
     *
     * @param {string|Object} conditionsOrPath A hash containing strings/numbers or other nested hash, a string using dot notation or a string using postgres/sqlite/mysql json syntax.
     * @param {string|number|boolean} [value] An optional value to compare against. Produces a string of the form "<json path> = '<value>'".
     * @memberof Sequelize
     *
     * @returns {Sequelize.json}
     */

  }, {
    key: "json",
    value: function json(conditionsOrPath, value) {
      return new Utils.Json(conditionsOrPath, value);
    }
    /**
     * A way of specifying attr = condition.
     *
     * The attr can either be an object taken from `Model.rawAttributes` (for example `Model.rawAttributes.id` or `Model.rawAttributes.name`). The
     * attribute should be defined in your model definition. The attribute can also be an object from one of the sequelize utility functions (`sequelize.fn`, `sequelize.col` etc.)
     *
     * For string attributes, use the regular `{ where: { attr: something }}` syntax. If you don't want your string to be escaped, use `sequelize.literal`.
     *
     * @see
     * {@link Model.findAll}
     *
     * @param {Object} attr The attribute, which can be either an attribute object from `Model.rawAttributes` or a sequelize object, for example an instance of `sequelize.fn`. For simple string attributes, use the POJO syntax
     * @param {Symbol} [comparator='Op.eq'] operator
     * @param {string|Object} logic The condition. Can be both a simply type, or a further condition (`or`, `and`, `.literal` etc.)
     * @since v2.0.0-dev3
     */

  }, {
    key: "where",
    value: function where(attr, comparator, logic) {
      return new Utils.Where(attr, comparator, logic);
    }
  }, {
    key: "useCLS",
    value: function useCLS(ns) {
      // check `ns` is valid CLS namespace
      if (!ns || typeof ns !== "object" || typeof ns.bind !== "function" || typeof ns.run !== "function") throw new Error("Must provide CLS namespace"); // save namespace as `Sequelize._cls`

      this._cls = ns; // patch bluebird to bind all promise callbacks to CLS namespace

      clsBluebird(ns, Promise); // return Sequelize for chaining

      return this;
    }
    /**
     * Run function in CLS context.
     * If no CLS context in use, just runs the function normally
     *
     * @private
     * @param {Function} fn Function to run
     * @returns {*} Return value of function
     */

  }, {
    key: "_clsRun",
    value: function _clsRun(fn) {
      const ns = Sequelize._cls;
      if (!ns) return fn();
      let res;
      ns.run(context => res = fn(context));
      return res;
    }
  }]);

  return Sequelize;
}(); // Aliases


Sequelize.prototype.fn = Sequelize.fn;
Sequelize.prototype.col = Sequelize.col;
Sequelize.prototype.cast = Sequelize.cast;
Sequelize.prototype.literal = Sequelize.literal;
Sequelize.prototype.and = Sequelize.and;
Sequelize.prototype.or = Sequelize.or;
Sequelize.prototype.json = Sequelize.json;
Sequelize.prototype.where = Sequelize.where;
Sequelize.prototype.validate = Sequelize.prototype.authenticate;
/**
 * Sequelize version number.
 */

Sequelize.version = require("../package.json").version;
Sequelize.options = {
  hooks: {}
};
/**
 * @private
 */

Sequelize.Utils = Utils;
/**
 * Operators symbols to be used for querying data
 * @see  {@link Operators}
 */

Sequelize.Op = Op;
/**
 * A handy reference to the bluebird Promise class
 */

Sequelize.Promise = Promise;
/**
 * Available table hints to be used for querying data in mssql for table hints
 * @see {@link TableHints}
 */

Sequelize.TableHints = TableHints;
/**
 * Available index hints to be used for querying data in mysql for index hints
 * @see {@link IndexHints}
 */

Sequelize.IndexHints = IndexHints;
/**
 * A reference to the sequelize transaction class. Use this to access isolationLevels and types when creating a transaction
 * @see {@link Transaction}
 * @see {@link Sequelize.transaction}
 */

Sequelize.Transaction = Transaction;
/**
 * A reference to Sequelize constructor from sequelize. Useful for accessing DataTypes, Errors etc.
 * @see {@link Sequelize}
 */

Sequelize.prototype.Sequelize = Sequelize;
/**
 * Available query types for use with `sequelize.query`
 * @see {@link QueryTypes}
 */

Sequelize.prototype.QueryTypes = Sequelize.QueryTypes = QueryTypes;
/**
 * Exposes the validator.js object, so you can extend it with custom validation functions. The validator is exposed both on the instance, and on the constructor.
 * @see https://github.com/chriso/validator.js
 */

Sequelize.prototype.Validator = Sequelize.Validator = Validator;
Sequelize.Model = Model;
Sequelize.DataTypes = DataTypes;

for (const dataType in DataTypes) {
  Sequelize[dataType] = DataTypes[dataType];
}
/**
 * A reference to the deferrable collection. Use this to access the different deferrable options.
 * @see {@link Transaction.Deferrable}
 * @see {@link Sequelize#transaction}
 */


Sequelize.Deferrable = Deferrable;
/**
 * A reference to the sequelize association class.
 * @see {@link Association}
 */

Sequelize.prototype.Association = Sequelize.Association = Association;
/**
 * Provide alternative version of `inflection` module to be used by `Utils.pluralize` etc.
 * @param {Object} _inflection - `inflection` module
 */

Sequelize.useInflection = Utils.useInflection;
/**
 * Allow hooks to be defined on Sequelize + on sequelize instance as universal hooks to run on all models
 * and on Sequelize/sequelize methods e.g. Sequelize(), Sequelize#define()
 */

Hooks.applyTo(Sequelize);
Hooks.applyTo(Sequelize.prototype);
/**
 * Expose various errors available
 */
// expose alias to BaseError

Sequelize.Error = sequelizeErrors.BaseError;

for (const error of Object.keys(sequelizeErrors)) {
  Sequelize[error] = sequelizeErrors[error];
}

module.exports = Sequelize;
module.exports.Sequelize = Sequelize;
module.exports.default = Sequelize;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9zZXF1ZWxpemUuanMiXSwibmFtZXMiOlsicmV0cnkiLCJyZXF1aXJlIiwiY2xzQmx1ZWJpcmQiLCJfIiwiVXRpbHMiLCJNb2RlbCIsIkRhdGFUeXBlcyIsIkRlZmVycmFibGUiLCJNb2RlbE1hbmFnZXIiLCJRdWVyeUludGVyZmFjZSIsIlRyYW5zYWN0aW9uIiwiUXVlcnlUeXBlcyIsIlRhYmxlSGludHMiLCJJbmRleEhpbnRzIiwic2VxdWVsaXplRXJyb3JzIiwiUHJvbWlzZSIsIkhvb2tzIiwiQXNzb2NpYXRpb24iLCJWYWxpZGF0b3IiLCJ2YWxpZGF0b3IiLCJPcCIsImRlcHJlY2F0aW9ucyIsIlNlcXVlbGl6ZSIsImRhdGFiYXNlIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm9wdGlvbnMiLCJjb25maWciLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJwaWNrIiwicnVuSG9va3MiLCJPYmplY3QiLCJhc3NpZ24iLCJkaWFsZWN0IiwiZGlhbGVjdE1vZHVsZSIsImRpYWxlY3RNb2R1bGVQYXRoIiwiaG9zdCIsInByb3RvY29sIiwiZGVmaW5lIiwicXVlcnkiLCJzeW5jIiwidGltZXpvbmUiLCJjbGllbnRNaW5NZXNzYWdlcyIsInN0YW5kYXJkQ29uZm9ybWluZ1N0cmluZ3MiLCJsb2dnaW5nIiwiY29uc29sZSIsImxvZyIsIm9taXROdWxsIiwibmF0aXZlIiwicmVwbGljYXRpb24iLCJzc2wiLCJ1bmRlZmluZWQiLCJwb29sIiwicXVvdGVJZGVudGlmaWVycyIsImhvb2tzIiwibWF4IiwibWF0Y2giLCJ0cmFuc2FjdGlvblR5cGUiLCJUWVBFUyIsIkRFRkVSUkVEIiwiaXNvbGF0aW9uTGV2ZWwiLCJkYXRhYmFzZVZlcnNpb24iLCJ0eXBlVmFsaWRhdGlvbiIsImJlbmNobWFyayIsIm1pbmlmeUFsaWFzZXMiLCJsb2dRdWVyeVBhcmFtZXRlcnMiLCJFcnJvciIsIm5vVHJ1ZUxvZ2dpbmciLCJfc2V0dXBIb29rcyIsInBvcnQiLCJrZWVwRGVmYXVsdFRpbWV6b25lIiwiZGlhbGVjdE9wdGlvbnMiLCJEaWFsZWN0IiwiZ2V0RGlhbGVjdCIsIlF1ZXJ5R2VuZXJhdG9yIiwiaXNQbGFpbk9iamVjdCIsIm9wZXJhdG9yc0FsaWFzZXMiLCJub1N0cmluZ09wZXJhdG9ycyIsInNldE9wZXJhdG9yc0FsaWFzZXMiLCJub0Jvb2xPcGVyYXRvckFsaWFzZXMiLCJxdWVyeUludGVyZmFjZSIsIm1vZGVscyIsIm1vZGVsTWFuYWdlciIsImNvbm5lY3Rpb25NYW5hZ2VyIiwiaW1wb3J0Q2FjaGUiLCJyZWZyZXNoVHlwZVBhcnNlciIsIm1vZGVsTmFtZSIsImF0dHJpYnV0ZXMiLCJzZXF1ZWxpemUiLCJtb2RlbCIsImluaXQiLCJpc0RlZmluZWQiLCJnZXRNb2RlbCIsImZpbmQiLCJuYW1lIiwiaW1wb3J0UGF0aCIsInNxbCIsImluc3RhbmNlIiwiY29uc3RydWN0b3IiLCJyYXciLCJtYXBUb01vZGVsIiwiZmllbGRNYXAiLCJnZXQiLCJkZWZhdWx0cyIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsInNlYXJjaFBhdGgiLCJ0eXBlIiwibmVzdCIsInBsYWluIiwiU0VMRUNUIiwiUkFXIiwic3VwcG9ydHMiLCJwcmVwZW5kU2VhcmNoUGF0aCIsInN1cHBvcnRzU2VhcmNoUGF0aCIsInRyeSIsInZhbHVlcyIsInJlcGxhY2VtZW50cyIsImJpbmQiLCJ0cmltIiwiQXJyYXkiLCJpc0FycmF5IiwiZm9ybWF0IiwiY29uY2F0IiwiZm9ybWF0TmFtZWRQYXJhbWV0ZXJzIiwiYmluZFBhcmFtZXRlcnMiLCJRdWVyeSIsImZvcm1hdEJpbmRQYXJhbWV0ZXJzIiwiY2hlY2tUcmFuc2FjdGlvbiIsInRyYW5zYWN0aW9uIiwiZmluaXNoZWQiLCJjb21wbGV0ZXNUcmFuc2FjdGlvbiIsImVycm9yIiwiaWQiLCJyZXRyeU9wdGlvbnMiLCJyZXNvbHZlIiwiX2NscyIsImNvbm5lY3Rpb24iLCJnZXRDb25uZWN0aW9uIiwidGhlbiIsInJ1biIsImZpbmFsbHkiLCJyZWxlYXNlQ29ubmVjdGlvbiIsInZhcmlhYmxlcyIsInNldCIsIlR5cGVFcnJvciIsIm1hcCIsInYiLCJrIiwiam9pbiIsInZhbHVlIiwiZ2V0UXVlcnlJbnRlcmZhY2UiLCJlc2NhcGUiLCJzY2hlbWEiLCJjcmVhdGVTY2hlbWEiLCJzaG93QWxsU2NoZW1hcyIsImRyb3BTY2hlbWEiLCJkcm9wQWxsU2NoZW1hcyIsImNsb25lIiwidGVzdCIsInJlamVjdCIsImZvcmNlIiwiZHJvcCIsImZvckVhY2hNb2RlbCIsInB1c2giLCJhdXRoZW50aWNhdGUiLCJlYWNoIiwicmV0dXJuIiwicmV2ZXJzZSIsInRydW5jYXRlTW9kZWwiLCJ0cnVuY2F0ZSIsImNhc2NhZGUiLCJkaWEiLCJmbiIsImF1dG9DYWxsYmFjayIsInByZXBhcmVFbnZpcm9ubWVudCIsIl9jbHNSdW4iLCJ0YXAiLCJjb21taXQiLCJjYXRjaCIsImVyciIsInJvbGxiYWNrIiwidGhyb3ciLCJhcmdzIiwibGFzdCIsInNwbGljZSIsImNsb3NlIiwiVHlwZSIsImRpYWxlY3RUeXBlcyIsImtleSIsImV4dGVuZCIsIkFSUkFZIiwiYXR0cmlidXRlIiwibm9ybWFsaXplRGF0YVR5cGUiLCJkZWZhdWx0VmFsdWUiLCJOT1ciLCJVVUlEVjEiLCJVVUlEVjQiLCJFTlVNIiwiRm4iLCJjb2wiLCJDb2wiLCJ2YWwiLCJDYXN0IiwiTGl0ZXJhbCIsImFuZCIsIm9yIiwiY29uZGl0aW9uc09yUGF0aCIsIkpzb24iLCJhdHRyIiwiY29tcGFyYXRvciIsImxvZ2ljIiwiV2hlcmUiLCJucyIsInJlcyIsImNvbnRleHQiLCJjYXN0IiwibGl0ZXJhbCIsImpzb24iLCJ3aGVyZSIsInZhbGlkYXRlIiwidmVyc2lvbiIsImRhdGFUeXBlIiwidXNlSW5mbGVjdGlvbiIsImFwcGx5VG8iLCJCYXNlRXJyb3IiLCJrZXlzIiwibW9kdWxlIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxNQUFNQSxLQUFLLEdB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Ozs7Ozs7O0FBS0ExTSxTQUFTLENBQUNmLFVBQVYsR0FBdUJBLFVBQXZCO0FBRUE7Ozs7O0FBSUFlLFNBQVMsQ0FBQ21GLFNBQVYsQ0FBb0J4RixXQUFwQixHQUFrQ0ssU0FBUyxDQUFDTCxXQUFWLEdBQXdCQSxXQUExRDtBQUVBOzs7OztBQUlBSyxTQUFTLENBQUMyTSxhQUFWLEdBQTBCN04sS0FBSyxDQUFDNk4sYUFBaEM7QUFFQTs7Ozs7QUFJQWpOLEtBQUssQ0FBQ2tOLE9BQU4sQ0FBYzVNLFNBQWQ7QUFDQU4sS0FBSyxDQUFDa04sT0FBTixDQUFjNU0sU0FBUyxDQUFDbUYsU0FBeEI7QUFFQTs7O0FBSUE7O0FBQ0FuRixTQUFTLENBQUM2QyxLQUFWLEdBQWtCckQsZUFBZSxDQUFDcU4sU0FBbEM7O0FBRUEsS0FBSyxNQUFNN0YsS0FBWCxJQUFvQnRHLE1BQU0sQ0FBQ29NLElBQVAsQ0FBWXROLGVBQVosQ0FBcEIsRUFBa0Q7QUFDaERRLEVBQUFBLFNBQVMsQ0FBQ2dILEtBQUQsQ0FBVCxHQUFtQnhILGVBQWUsQ0FBQ3dILEtBQUQsQ0FBbEM7QUFDRDs7QUFFRCtGLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQmhOLFNBQWpCO0FBQ0ErTSxNQUFNLENBQUNDLE9BQVAsQ0FBZWhOLFNBQWYsR0FBMkJBLFNBQTNCO0FBQ0ErTSxNQUFNLENBQUNDLE9BQVAsQ0FBZUMsT0FBZixHQUF5QmpOLFNBQXpCIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbmNvbnN0IHJldHJ5ID0gcmVxdWlyZShcInJldHJ5LWFzLXByb21pc2VkXCIpO1xyXG5jb25zdCBjbHNCbHVlYmlyZCA9IHJlcXVpcmUoXCJjbHMtYmx1ZWJpcmRcIik7XHJcbmNvbnN0IF8gPSByZXF1aXJlKFwibG9kYXNoXCIpO1xyXG5cclxuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcclxuY29uc3QgTW9kZWwgPSByZXF1aXJlKFwiLi9tb2RlbFwiKTtcclxuY29uc3QgRGF0YVR5cGVzID0gcmVxdWlyZShcIi4vZGF0YS10eXBlc1wiKTtcclxuY29uc3QgRGVmZXJyYWJsZSA9IHJlcXVpcmUoXCIuL2RlZmVycmFibGVcIik7XHJcbmNvbnN0IE1vZGVsTWFuYWdlciA9IHJlcXVpcmUoXCIuL21vZGVsLW1hbmFnZXJcIik7XHJcbmNvbnN0IFF1ZXJ5SW50ZXJmYWNlID0gcmVxdWlyZShcIi4vcXVlcnktaW50ZXJmYWNlXCIpO1xyXG5jb25zdCBUcmFuc2FjdGlvbiA9IHJlcXVpcmUoXCIuL3RyYW5zYWN0aW9uXCIpO1xyXG5jb25zdCBRdWVyeVR5cGVzID0gcmVxdWlyZShcIi4vcXVlcnktdHlwZXNcIik7XHJcbmNvbnN0IFRhYmxlSGludHMgPSByZXF1aXJlKFwiLi90YWJsZS1oaW50c1wiKTtcclxuY29uc3QgSW5kZXhIaW50cyA9IHJlcXVpcmUoXCIuL2luZGV4LWhpbnRzXCIpO1xyXG5jb25zdCBzZXF1ZWxpemVFcnJvcnMgPSByZXF1aXJlKFwiLi9lcnJvcnNcIik7XHJcbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKFwiLi9wcm9taXNlXCIpO1xyXG5jb25zdCBIb29rcyA9IHJlcXVpcmUoXCIuL2hvb2tzXCIpO1xyXG5jb25zdCBBc3NvY2lhdGlvbiA9IHJlcXVpcmUoXCIuL2Fzc29jaWF0aW9ucy9pbmRleFwiKTtcclxuY29uc3QgVmFsaWRhdG9yID0gcmVxdWlyZShcIi4vdXRpbHMvdmFsaWRhdG9yLWV4dHJhc1wiKS52YWxpZGF0b3I7XHJcbmNvbnN0IE9wID0gcmVxdWlyZShcIi4vb3BlcmF0b3JzXCIpO1xyXG5jb25zdCBkZXByZWNhdGlvbnMgPSByZXF1aXJlKFwiLi91dGlscy9kZXByZWNhdGlvbnNcIik7XHJcblxyXG4vKipcclxuICogVGhpcyBpcyB0aGUgbWFpbiBjbGFzcywgdGhlIGVudHJ5IHBvaW50IHRvIHNlcXVlbGl6ZS5cclxuICovXHJcbmNsYXNzIFNlcXVlbGl6ZSB7XHJcbiAgLyoqXHJcbiAgICogSW5zdGFudGlhdGUgc2VxdWVsaXplIHdpdGggbmFtZSBvZiBkYXRhYmFzZSwgdXNlcm5hbWUgYW5kIHBhc3N3b3JkLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiAvLyB3aXRob3V0IHBhc3N3b3JkIC8gd2l0aCBibGFuayBwYXNzd29yZFxyXG4gICAqIGNvbnN0IHNlcXVlbGl6ZSA9IG5ldyBTZXF1ZWxpemUoJ2RhdGFiYXNlJywgJ3VzZXJuYW1lJywgbnVsbCwge1xyXG4gICAqICAgZGlhbGVjdDogJ215c3FsJ1xyXG4gICAqIH0pXHJcbiAgICpcclxuICAgKiAvLyB3aXRoIHBhc3N3b3JkIGFuZCBvcHRpb25zXHJcbiAgICogY29uc3Qgc2VxdWVsaXplID0gbmV3IFNlcXVlbGl6ZSgnbXlfZGF0YWJhc2UnLCAnam9obicsICdkb2UnLCB7XHJcbiAgICogICBkaWFsZWN0OiAncG9zdGdyZXMnXHJcbiAgICogfSlcclxuICAgKlxyXG4gICAqIC8vIHdpdGggZGF0YWJhc2UsIHVzZXJuYW1lLCBhbmQgcGFzc3dvcmQgaW4gdGhlIG9wdGlvbnMgb2JqZWN0XHJcbiAgICogY29uc3Qgc2VxdWVsaXplID0gbmV3IFNlcXVlbGl6ZSh7IGRhdGFiYXNlLCB1c2VybmFtZSwgcGFzc3dvcmQsIGRpYWxlY3Q6ICdtc3NxbCcgfSk7XHJcbiAgICpcclxuICAgKiAvLyB3aXRoIHVyaVxyXG4gICAqIGNvbnN0IHNlcXVlbGl6ZSA9IG5ldyBTZXF1ZWxpemUoJ215c3FsOi8vbG9jYWxob3N0OjMzMDYvZGF0YWJhc2UnLCB7fSlcclxuICAgKlxyXG4gICAqIC8vIG9wdGlvbiBleGFtcGxlc1xyXG4gICAqIGNvbnN0IHNlcXVlbGl6ZSA9IG5ldyBTZXF1ZWxpemUoJ2RhdGFiYXNlJywgJ3VzZXJuYW1lJywgJ3Bhc3N3b3JkJywge1xyXG4gICAqICAgLy8gdGhlIHNxbCBkaWFsZWN0IG9mIHRoZSBkYXRhYmFzZVxyXG4gICAqICAgLy8gY3VycmVudGx5IHN1cHBvcnRlZDogJ215c3FsJywgJ3NxbGl0ZScsICdwb3N0Z3JlcycsICdtc3NxbCdcclxuICAgKiAgIGRpYWxlY3Q6ICdteXNxbCcsXHJcbiAgICpcclxuICAgKiAgIC8vIGN1c3RvbSBob3N0OyBkZWZhdWx0OiBsb2NhbGhvc3RcclxuICAgKiAgIGhvc3Q6ICdteS5zZXJ2ZXIudGxkJyxcclxuICAgKiAgIC8vIGZvciBwb3N0Z3JlcywgeW91IGNhbiBhbHNvIHNwZWNpZnkgYW4gYWJzb2x1dGUgcGF0aCB0byBhIGRpcmVjdG9yeVxyXG4gICAqICAgLy8gY29udGFpbmluZyBhIFVOSVggc29ja2V0IHRvIGNvbm5lY3Qgb3ZlclxyXG4gICAqICAgLy8gaG9zdDogJy9zb2NrZXRzL3BzcWxfc29ja2V0cycuXHJcbiAgICpcclxuICAgKiAgIC8vIGN1c3RvbSBwb3J0OyBkZWZhdWx0OiBkaWFsZWN0IGRlZmF1bHRcclxuICAgKiAgIHBvcnQ6IDEyMzQ1LFxyXG4gICAqXHJcbiAgICogICAvLyBjdXN0b20gcHJvdG9jb2w7IGRlZmF1bHQ6ICd0Y3AnXHJcbiAgICogICAvLyBwb3N0Z3JlcyBvbmx5LCB1c2VmdWwgZm9yIEhlcm9rdVxyXG4gICAqICAgcHJvdG9jb2w6IG51bGwsXHJcbiAgICpcclxuICAgKiAgIC8vIGRpc2FibGUgbG9nZ2luZyBvciBwcm92aWRlIGEgY3VzdG9tIGxvZ2dpbmcgZnVuY3Rpb247IGRlZmF1bHQ6IGNvbnNvbGUubG9nXHJcbiAgICogICBsb2dnaW5nOiBmYWxzZSxcclxuICAgKlxyXG4gICAqICAgLy8geW91IGNhbiBhbHNvIHBhc3MgYW55IGRpYWxlY3Qgb3B0aW9ucyB0byB0aGUgdW5kZXJseWluZyBkaWFsZWN0IGxpYnJhcnlcclxuICAgKiAgIC8vIC0gZGVmYXVsdCBpcyBlbXB0eVxyXG4gICAqICAgLy8gLSBjdXJyZW50bHkgc3VwcG9ydGVkOiAnbXlzcWwnLCAncG9zdGdyZXMnLCAnbXNzcWwnXHJcbiAgICogICBkaWFsZWN0T3B0aW9uczoge1xyXG4gICAqICAgICBzb2NrZXRQYXRoOiAnL0FwcGxpY2F0aW9ucy9NQU1QL3RtcC9teXNxbC9teXNxbC5zb2NrJyxcclxuICAgKiAgICAgc3VwcG9ydEJpZ051bWJlcnM6IHRydWUsXHJcbiAgICogICAgIGJpZ051bWJlclN0cmluZ3M6IHRydWVcclxuICAgKiAgIH0sXHJcbiAgICpcclxuICAgKiAgIC8vIHRoZSBzdG9yYWdlIGVuZ2luZSBmb3Igc3FsaXRlXHJcbiAgICogICAvLyAtIGRlZmF1bHQgJzptZW1vcnk6J1xyXG4gICAqICAgc3RvcmFnZTogJ3BhdGgvdG8vZGF0YWJhc2Uuc3FsaXRlJyxcclxuICAgKlxyXG4gICAqICAgLy8gZGlzYWJsZSBpbnNlcnRpbmcgdW5kZWZpbmVkIHZhbHVlcyBhcyBOVUxMXHJcbiAgICogICAvLyAtIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICogICBvbWl0TnVsbDogdHJ1ZSxcclxuICAgKlxyXG4gICAqICAgLy8gYSBmbGFnIGZvciB1c2luZyBhIG5hdGl2ZSBsaWJyYXJ5IG9yIG5vdC5cclxuICAgKiAgIC8vIGluIHRoZSBjYXNlIG9mICdwZycgLS0gc2V0IHRoaXMgdG8gdHJ1ZSB3aWxsIGFsbG93IFNTTCBzdXBwb3J0XHJcbiAgICogICAvLyAtIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICogICBuYXRpdmU6IHRydWUsXHJcbiAgICpcclxuICAgKiAgIC8vIFNwZWNpZnkgb3B0aW9ucywgd2hpY2ggYXJlIHVzZWQgd2hlbiBzZXF1ZWxpemUuZGVmaW5lIGlzIGNhbGxlZC5cclxuICAgKiAgIC8vIFRoZSBmb2xsb3dpbmcgZXhhbXBsZTpcclxuICAgKiAgIC8vICAgZGVmaW5lOiB7IHRpbWVzdGFtcHM6IGZhbHNlIH1cclxuICAgKiAgIC8vIGlzIGJhc2ljYWxseSB0aGUgc2FtZSBhczpcclxuICAgKiAgIC8vICAgTW9kZWwuaW5pdChhdHRyaWJ1dGVzLCB7IHRpbWVzdGFtcHM6IGZhbHNlIH0pO1xyXG4gICAqICAgLy8gICBzZXF1ZWxpemUuZGVmaW5lKG5hbWUsIGF0dHJpYnV0ZXMsIHsgdGltZXN0YW1wczogZmFsc2UgfSk7XHJcbiAgICogICAvLyBzbyBkZWZpbmluZyB0aGUgdGltZXN0YW1wcyBmb3IgZWFjaCBtb2RlbCB3aWxsIGJlIG5vdCBuZWNlc3NhcnlcclxuICAgKiAgIGRlZmluZToge1xyXG4gICAqICAgICB1bmRlcnNjb3JlZDogZmFsc2UsXHJcbiAgICogICAgIGZyZWV6ZVRhYmxlTmFtZTogZmFsc2UsXHJcbiAgICogICAgIGNoYXJzZXQ6ICd1dGY4JyxcclxuICAgKiAgICAgZGlhbGVjdE9wdGlvbnM6IHtcclxuICAgKiAgICAgICBjb2xsYXRlOiAndXRmOF9nZW5lcmFsX2NpJ1xyXG4gICAqICAgICB9LFxyXG4gICAqICAgICB0aW1lc3RhbXBzOiB0cnVlXHJcbiAgICogICB9LFxyXG4gICAqXHJcbiAgICogICAvLyBzaW1pbGFyIGZvciBzeW5jOiB5b3UgY2FuIGRlZmluZSB0aGlzIHRvIGFsd2F5cyBmb3JjZSBzeW5jIGZvciBtb2RlbHNcclxuICAgKiAgIHN5bmM6IHsgZm9yY2U6IHRydWUgfSxcclxuICAgKlxyXG4gICAqICAgLy8gcG9vbCBjb25maWd1cmF0aW9uIHVzZWQgdG8gcG9vbCBkYXRhYmFzZSBjb25uZWN0aW9uc1xyXG4gICAqICAgcG9vbDoge1xyXG4gICAqICAgICBtYXg6IDUsXHJcbiAgICogICAgIGlkbGU6IDMwMDAwLFxyXG4gICAqICAgICBhY3F1aXJlOiA2MDAwMCxcclxuICAgKiAgIH0sXHJcbiAgICpcclxuICAgKiAgIC8vIGlzb2xhdGlvbiBsZXZlbCBvZiBlYWNoIHRyYW5zYWN0aW9uXHJcbiAgICogICAvLyBkZWZhdWx0cyB0byBkaWFsZWN0IGRlZmF1bHRcclxuICAgKiAgIGlzb2xhdGlvbkxldmVsOiBUcmFuc2FjdGlvbi5JU09MQVRJT05fTEVWRUxTLlJFUEVBVEFCTEVfUkVBRFxyXG4gICAqIH0pXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbZGF0YWJhc2VdIFRoZSBuYW1lIG9mIHRoZSBkYXRhYmFzZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFt1c2VybmFtZT1udWxsXSBUaGUgdXNlcm5hbWUgd2hpY2ggaXMgdXNlZCB0byBhdXRoZW50aWNhdGUgYWdhaW5zdCB0aGUgZGF0YWJhc2UuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW3Bhc3N3b3JkPW51bGxdIFRoZSBwYXNzd29yZCB3aGljaCBpcyB1c2VkIHRvIGF1dGhlbnRpY2F0ZSBhZ2FpbnN0IHRoZSBkYXRhYmFzZS4gU3VwcG9ydHMgU1FMQ2lwaGVyIGVuY3J5cHRpb24gZm9yIFNRTGl0ZS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucz17fV0gQW4gb2JqZWN0IHdpdGggb3B0aW9ucy5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5ob3N0PSdsb2NhbGhvc3QnXSBUaGUgaG9zdCBvZiB0aGUgcmVsYXRpb25hbCBkYXRhYmFzZS5cclxuICAgKiBAcGFyYW0ge251bWJlcn0gICBbb3B0aW9ucy5wb3J0PV0gVGhlIHBvcnQgb2YgdGhlIHJlbGF0aW9uYWwgZGF0YWJhc2UuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW29wdGlvbnMudXNlcm5hbWU9bnVsbF0gVGhlIHVzZXJuYW1lIHdoaWNoIGlzIHVzZWQgdG8gYXV0aGVudGljYXRlIGFnYWluc3QgdGhlIGRhdGFiYXNlLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLnBhc3N3b3JkPW51bGxdIFRoZSBwYXNzd29yZCB3aGljaCBpcyB1c2VkIHRvIGF1dGhlbnRpY2F0ZSBhZ2FpbnN0IHRoZSBkYXRhYmFzZS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5kYXRhYmFzZT1udWxsXSBUaGUgbmFtZSBvZiB0aGUgZGF0YWJhc2VcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5kaWFsZWN0XSBUaGUgZGlhbGVjdCBvZiB0aGUgZGF0YWJhc2UgeW91IGFyZSBjb25uZWN0aW5nIHRvLiBPbmUgb2YgbXlzcWwsIHBvc3RncmVzLCBzcWxpdGUgYW5kIG1zc3FsLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLmRpYWxlY3RNb2R1bGU9bnVsbF0gSWYgc3BlY2lmaWVkLCB1c2UgdGhpcyBkaWFsZWN0IGxpYnJhcnkuIEZvciBleGFtcGxlLCBpZiB5b3Ugd2FudCB0byB1c2UgcGcuanMgaW5zdGVhZCBvZiBwZyB3aGVuIGNvbm5lY3RpbmcgdG8gYSBwZyBkYXRhYmFzZSwgeW91IHNob3VsZCBzcGVjaWZ5ICdyZXF1aXJlKFwicGcuanNcIiknIGhlcmVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5kaWFsZWN0TW9kdWxlUGF0aD1udWxsXSBJZiBzcGVjaWZpZWQsIGxvYWQgdGhlIGRpYWxlY3QgbGlicmFyeSBmcm9tIHRoaXMgcGF0aC4gRm9yIGV4YW1wbGUsIGlmIHlvdSB3YW50IHRvIHVzZSBwZy5qcyBpbnN0ZWFkIG9mIHBnIHdoZW4gY29ubmVjdGluZyB0byBhIHBnIGRhdGFiYXNlLCB5b3Ugc2hvdWxkIHNwZWNpZnkgJy9wYXRoL3RvL3BnLmpzJyBoZXJlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgW29wdGlvbnMuZGlhbGVjdE9wdGlvbnNdIEFuIG9iamVjdCBvZiBhZGRpdGlvbmFsIG9wdGlvbnMsIHdoaWNoIGFyZSBwYXNzZWQgZGlyZWN0bHkgdG8gdGhlIGNvbm5lY3Rpb24gbGlicmFyeVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLnN0b3JhZ2VdIE9ubHkgdXNlZCBieSBzcWxpdGUuIERlZmF1bHRzIHRvICc6bWVtb3J5OidcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5wcm90b2NvbD0ndGNwJ10gVGhlIHByb3RvY29sIG9mIHRoZSByZWxhdGlvbmFsIGRhdGFiYXNlLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIFtvcHRpb25zLmRlZmluZT17fV0gRGVmYXVsdCBvcHRpb25zIGZvciBtb2RlbCBkZWZpbml0aW9ucy4gU2VlIHtAbGluayBNb2RlbC5pbml0fS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5xdWVyeT17fV0gRGVmYXVsdCBvcHRpb25zIGZvciBzZXF1ZWxpemUucXVlcnlcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5zY2hlbWE9bnVsbF0gQSBzY2hlbWEgdG8gdXNlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgW29wdGlvbnMuc2V0PXt9XSBEZWZhdWx0IG9wdGlvbnMgZm9yIHNlcXVlbGl6ZS5zZXRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5zeW5jPXt9XSBEZWZhdWx0IG9wdGlvbnMgZm9yIHNlcXVlbGl6ZS5zeW5jXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW29wdGlvbnMudGltZXpvbmU9JyswMDowMCddIFRoZSB0aW1lem9uZSB1c2VkIHdoZW4gY29udmVydGluZyBhIGRhdGUgZnJvbSB0aGUgZGF0YWJhc2UgaW50byBhIEphdmFTY3JpcHQgZGF0ZS4gVGhlIHRpbWV6b25lIGlzIGFsc28gdXNlZCB0byBTRVQgVElNRVpPTkUgd2hlbiBjb25uZWN0aW5nIHRvIHRoZSBzZXJ2ZXIsIHRvIGVuc3VyZSB0aGF0IHRoZSByZXN1bHQgb2YgTk9XLCBDVVJSRU5UX1RJTUVTVEFNUCBhbmQgb3RoZXIgdGltZSByZWxhdGVkIGZ1bmN0aW9ucyBoYXZlIGluIHRoZSByaWdodCB0aW1lem9uZS4gRm9yIGJlc3QgY3Jvc3MgcGxhdGZvcm0gcGVyZm9ybWFuY2UgdXNlIHRoZSBmb3JtYXQgKy8tSEg6TU0uIFdpbGwgYWxzbyBhY2NlcHQgc3RyaW5nIHZlcnNpb25zIG9mIHRpbWV6b25lcyB1c2VkIGJ5IG1vbWVudC5qcyAoZS5nLiAnQW1lcmljYS9Mb3NfQW5nZWxlcycpOyB0aGlzIGlzIHVzZWZ1bCB0byBjYXB0dXJlIGRheWxpZ2h0IHNhdmluZ3MgdGltZSBjaGFuZ2VzLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLmNsaWVudE1pbk1lc3NhZ2VzPSd3YXJuaW5nJ10gVGhlIFBvc3RncmVTUUwgYGNsaWVudF9taW5fbWVzc2FnZXNgIHNlc3Npb24gcGFyYW1ldGVyLiBTZXQgdG8gYGZhbHNlYCB0byBub3Qgb3ZlcnJpZGUgdGhlIGRhdGFiYXNlJ3MgZGVmYXVsdC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5zdGFuZGFyZENvbmZvcm1pbmdTdHJpbmdzPXRydWVdIFRoZSBQb3N0Z3JlU1FMIGBzdGFuZGFyZF9jb25mb3JtaW5nX3N0cmluZ3NgIHNlc3Npb24gcGFyYW1ldGVyLiBTZXQgdG8gYGZhbHNlYCB0byBub3Qgc2V0IHRoZSBvcHRpb24uIFdBUk5JTkc6IFNldHRpbmcgdGhpcyB0byBmYWxzZSBtYXkgZXhwb3NlIHZ1bG5lcmFiaWxpdGllcyBhbmQgaXMgbm90IHJlY29tbWVuZGVkIVxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmxvZ2dpbmc9Y29uc29sZS5sb2ddIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIGV2ZXJ5IHRpbWUgU2VxdWVsaXplIHdvdWxkIGxvZyBzb21ldGhpbmcuXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMuYmVuY2htYXJrPWZhbHNlXSBQYXNzIHF1ZXJ5IGV4ZWN1dGlvbiB0aW1lIGluIG1pbGxpc2Vjb25kcyBhcyBzZWNvbmQgYXJndW1lbnQgdG8gbG9nZ2luZyBmdW5jdGlvbiAob3B0aW9ucy5sb2dnaW5nKS5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5vbWl0TnVsbD1mYWxzZV0gQSBmbGFnIHRoYXQgZGVmaW5lcyBpZiBudWxsIHZhbHVlcyBzaG91bGQgYmUgcGFzc2VkIHRvIFNRTCBxdWVyaWVzIG9yIG5vdC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5uYXRpdmU9ZmFsc2VdIEEgZmxhZyB0aGF0IGRlZmluZXMgaWYgbmF0aXZlIGxpYnJhcnkgc2hhbGwgYmUgdXNlZCBvciBub3QuIEN1cnJlbnRseSBvbmx5IGhhcyBhbiBlZmZlY3QgZm9yIHBvc3RncmVzXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMucmVwbGljYXRpb249ZmFsc2VdIFVzZSByZWFkIC8gd3JpdGUgcmVwbGljYXRpb24uIFRvIGVuYWJsZSByZXBsaWNhdGlvbiwgcGFzcyBhbiBvYmplY3QsIHdpdGggdHdvIHByb3BlcnRpZXMsIHJlYWQgYW5kIHdyaXRlLiBXcml0ZSBzaG91bGQgYmUgYW4gb2JqZWN0IChhIHNpbmdsZSBzZXJ2ZXIgZm9yIGhhbmRsaW5nIHdyaXRlcyksIGFuZCByZWFkIGFuIGFycmF5IG9mIG9iamVjdCAoc2V2ZXJhbCBzZXJ2ZXJzIHRvIGhhbmRsZSByZWFkcykuIEVhY2ggcmVhZC93cml0ZSBzZXJ2ZXIgY2FuIGhhdmUgdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOiBgaG9zdGAsIGBwb3J0YCwgYHVzZXJuYW1lYCwgYHBhc3N3b3JkYCwgYGRhdGFiYXNlYFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIFtvcHRpb25zLnBvb2xdIHNlcXVlbGl6ZSBjb25uZWN0aW9uIHBvb2wgY29uZmlndXJhdGlvblxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgIFtvcHRpb25zLnBvb2wubWF4PTVdIE1heGltdW0gbnVtYmVyIG9mIGNvbm5lY3Rpb24gaW4gcG9vbFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgIFtvcHRpb25zLnBvb2wubWluPTBdIE1pbmltdW0gbnVtYmVyIG9mIGNvbm5lY3Rpb24gaW4gcG9vbFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgIFtvcHRpb25zLnBvb2wuaWRsZT0xMDAwMF0gVGhlIG1heGltdW0gdGltZSwgaW4gbWlsbGlzZWNvbmRzLCB0aGF0IGEgY29ubmVjdGlvbiBjYW4gYmUgaWRsZSBiZWZvcmUgYmVpbmcgcmVsZWFzZWQuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgW29wdGlvbnMucG9vbC5hY3F1aXJlPTYwMDAwXSBUaGUgbWF4aW11bSB0aW1lLCBpbiBtaWxsaXNlY29uZHMsIHRoYXQgcG9vbCB3aWxsIHRyeSB0byBnZXQgY29ubmVjdGlvbiBiZWZvcmUgdGhyb3dpbmcgZXJyb3JcclxuICAgKiBAcGFyYW0ge251bWJlcn0gICBbb3B0aW9ucy5wb29sLmV2aWN0PTEwMDBdIFRoZSB0aW1lIGludGVydmFsLCBpbiBtaWxsaXNlY29uZHMsIGFmdGVyIHdoaWNoIHNlcXVlbGl6ZS1wb29sIHdpbGwgcmVtb3ZlIGlkbGUgY29ubmVjdGlvbnMuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMucG9vbC52YWxpZGF0ZV0gQSBmdW5jdGlvbiB0aGF0IHZhbGlkYXRlcyBhIGNvbm5lY3Rpb24uIENhbGxlZCB3aXRoIGNsaWVudC4gVGhlIGRlZmF1bHQgZnVuY3Rpb24gY2hlY2tzIHRoYXQgY2xpZW50IGlzIGFuIG9iamVjdCwgYW5kIHRoYXQgaXRzIHN0YXRlIGlzIG5vdCBkaXNjb25uZWN0ZWRcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5xdW90ZUlkZW50aWZpZXJzPXRydWVdIFNldCB0byBgZmFsc2VgIHRvIG1ha2UgdGFibGUgbmFtZXMgYW5kIGF0dHJpYnV0ZXMgY2FzZS1pbnNlbnNpdGl2ZSBvbiBQb3N0Z3JlcyBhbmQgc2tpcCBkb3VibGUgcXVvdGluZyBvZiB0aGVtLiAgV0FSTklORzogU2V0dGluZyB0aGlzIHRvIGZhbHNlIG1heSBleHBvc2UgdnVsbmVyYWJpbGl0aWVzIGFuZCBpcyBub3QgcmVjb21tZW5kZWQhXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW29wdGlvbnMudHJhbnNhY3Rpb25UeXBlPSdERUZFUlJFRCddIFNldCB0aGUgZGVmYXVsdCB0cmFuc2FjdGlvbiB0eXBlLiBTZWUgYFNlcXVlbGl6ZS5UcmFuc2FjdGlvbi5UWVBFU2AgZm9yIHBvc3NpYmxlIG9wdGlvbnMuIFNxbGl0ZSBvbmx5LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLmlzb2xhdGlvbkxldmVsXSBTZXQgdGhlIGRlZmF1bHQgdHJhbnNhY3Rpb24gaXNvbGF0aW9uIGxldmVsLiBTZWUgYFNlcXVlbGl6ZS5UcmFuc2FjdGlvbi5JU09MQVRJT05fTEVWRUxTYCBmb3IgcG9zc2libGUgb3B0aW9ucy5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5yZXRyeV0gU2V0IG9mIGZsYWdzIHRoYXQgY29udHJvbCB3aGVuIGEgcXVlcnkgaXMgYXV0b21hdGljYWxseSByZXRyaWVkLlxyXG4gICAqIEBwYXJhbSB7QXJyYXl9ICAgIFtvcHRpb25zLnJldHJ5Lm1hdGNoXSBPbmx5IHJldHJ5IGEgcXVlcnkgaWYgdGhlIGVycm9yIG1hdGNoZXMgb25lIG9mIHRoZXNlIHN0cmluZ3MuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgW29wdGlvbnMucmV0cnkubWF4XSBIb3cgbWFueSB0aW1lcyBhIGZhaWxpbmcgcXVlcnkgaXMgYXV0b21hdGljYWxseSByZXRyaWVkLiAgU2V0IHRvIDAgdG8gZGlzYWJsZSByZXRyeWluZyBvbiBTUUxfQlVTWSBlcnJvci5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy50eXBlVmFsaWRhdGlvbj1mYWxzZV0gUnVuIGJ1aWx0LWluIHR5cGUgdmFsaWRhdG9ycyBvbiBpbnNlcnQgYW5kIHVwZGF0ZSwgYW5kIHNlbGVjdCB3aXRoIHdoZXJlIGNsYXVzZSwgZS5nLiB2YWxpZGF0ZSB0aGF0IGFyZ3VtZW50cyBwYXNzZWQgdG8gaW50ZWdlciBmaWVsZHMgYXJlIGludGVnZXItbGlrZS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5vcGVyYXRvcnNBbGlhc2VzXSBTdHJpbmcgYmFzZWQgb3BlcmF0b3IgYWxpYXMuIFBhc3Mgb2JqZWN0IHRvIGxpbWl0IHNldCBvZiBhbGlhc2VkIG9wZXJhdG9ycy5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5ob29rc10gQW4gb2JqZWN0IG9mIGdsb2JhbCBob29rIGZ1bmN0aW9ucyB0aGF0IGFyZSBjYWxsZWQgYmVmb3JlIGFuZCBhZnRlciBjZXJ0YWluIGxpZmVjeWNsZSBldmVudHMuIEdsb2JhbCBob29rcyB3aWxsIHJ1biBhZnRlciBhbnkgbW9kZWwtc3BlY2lmaWMgaG9va3MgZGVmaW5lZCBmb3IgdGhlIHNhbWUgZXZlbnQgKFNlZSBgU2VxdWVsaXplLk1vZGVsLmluaXQoKWAgZm9yIGEgbGlzdCkuICBBZGRpdGlvbmFsbHksIGBiZWZvcmVDb25uZWN0KClgLCBgYWZ0ZXJDb25uZWN0KClgLCBgYmVmb3JlRGlzY29ubmVjdCgpYCwgYW5kIGBhZnRlckRpc2Nvbm5lY3QoKWAgaG9va3MgbWF5IGJlIGRlZmluZWQgaGVyZS5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5taW5pZnlBbGlhc2VzPWZhbHNlXSBBIGZsYWcgdGhhdCBkZWZpbmVzIGlmIGFsaWFzZXMgc2hvdWxkIGJlIG1pbmlmaWVkIChtb3N0bHkgdXNlZnVsIHRvIGF2b2lkIFBvc3RncmVzIGFsaWFzIGNoYXJhY3RlciBsaW1pdCBvZiA2NClcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5sb2dRdWVyeVBhcmFtZXRlcnM9ZmFsc2VdIEEgZmxhZyB0aGF0IGRlZmluZXMgaWYgc2hvdyBiaW5kIHBhdGFtZXRlcnMgaW4gbG9nLlxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGRhdGFiYXNlLCB1c2VybmFtZSwgcGFzc3dvcmQsIG9wdGlvbnMpIHtcclxuICAgIGxldCBjb25maWc7XHJcblxyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdHlwZW9mIGRhdGFiYXNlID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgIC8vIG5ldyBTZXF1ZWxpemUoeyAuLi4gb3B0aW9ucyB9KVxyXG4gICAgICBvcHRpb25zID0gZGF0YWJhc2U7XHJcbiAgICAgIGNvbmZpZyA9IF8ucGljayhcclxuICAgICAgICBvcHRpb25zLFxyXG4gICAgICAgIFwiaG9zdFwiLFxyXG4gICAgICAgIFwicG9ydFwiLFxyXG4gICAgICAgIFwiZGF0YWJhc2VcIixcclxuICAgICAgICBcInVzZXJuYW1lXCIsXHJcbiAgICAgICAgXCJwYXNzd29yZFwiXHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiB0eXBlb2YgZGF0YWJhc2UgPT09IFwic3RyaW5nXCIpIHx8XHJcbiAgICAgIChhcmd1bWVudHMubGVuZ3RoID09PSAyICYmIHR5cGVvZiB1c2VybmFtZSA9PT0gXCJvYmplY3RcIilcclxuICAgICkge1xyXG4gICAgICAvLyBuZXcgU2VxdWVsaXplKFVSSSwgeyAuLi4gb3B0aW9ucyB9KVxyXG5cclxuICAgICAgY29uZmlnID0ge307XHJcbiAgICAgIG9wdGlvbnMgPSB1c2VybmFtZSB8fCB7fTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIG5ldyBTZXF1ZWxpemUoZGF0YWJhc2UsIHVzZXJuYW1lLCBwYXNzd29yZCwgeyAuLi4gb3B0aW9ucyB9KVxyXG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgY29uZmlnID0geyBkYXRhYmFzZSwgdXNlcm5hbWUsIHBhc3N3b3JkIH07XHJcbiAgICB9XHJcblxyXG4gICAgU2VxdWVsaXplLnJ1bkhvb2tzKFwiYmVmb3JlSW5pdFwiLCBjb25maWcsIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXHJcbiAgICAgIHtcclxuICAgICAgICBkaWFsZWN0OiBcInNxbGl0ZVwiLFxyXG4gICAgICAgIGRpYWxlY3RNb2R1bGU6IG51bGwsXHJcbiAgICAgICAgZGlhbGVjdE1vZHVsZVBhdGg6IG51bGwsXHJcbiAgICAgICAgaG9zdDogXCJsb2NhbGhvc3RcIixcclxuICAgICAgICBwcm90b2NvbDogXCJ0Y3BcIixcclxuICAgICAgICBkZWZpbmU6IHt9LFxyXG4gICAgICAgIHF1ZXJ5OiB7fSxcclxuICAgICAgICBzeW5jOiB7fSxcclxuICAgICAgICB0aW1lem9uZTogXCIrMDA6MDBcIixcclxuICAgICAgICBjbGllbnRNaW5NZXNzYWdlczogXCJ3YXJuaW5nXCIsXHJcbiAgICAgICAgc3RhbmRhcmRDb25mb3JtaW5nU3RyaW5nczogdHJ1ZSxcclxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgICAgIGxvZ2dpbmc6IGNvbnNvbGUubG9nLFxyXG4gICAgICAgIG9taXROdWxsOiBmYWxzZSxcclxuICAgICAgICBuYXRpdmU6IGZhbHNlLFxyXG4gICAgICAgIHJlcGxpY2F0aW9uOiBmYWxzZSxcclxuICAgICAgICBzc2w6IHVuZGVmaW5lZCxcclxuICAgICAgICBwb29sOiB7fSxcclxuICAgICAgICBxdW90ZUlkZW50aWZpZXJzOiB0cnVlLFxyXG4gICAgICAgIGhvb2tzOiB7fSxcclxuICAgICAgICByZXRyeToge1xyXG4gICAgICAgICAgbWF4OiA1LFxyXG4gICAgICAgICAgbWF0Y2g6IFtcIlNRTElURV9CVVNZOiBkYXRhYmFzZSBpcyBsb2NrZWRcIl1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHRyYW5zYWN0aW9uVHlwZTogVHJhbnNhY3Rpb24uVFlQRVMuREVGRVJSRUQsXHJcbiAgICAgICAgaXNvbGF0aW9uTGV2ZWw6IG51bGwsXHJcbiAgICAgICAgZGF0YWJhc2VWZXJzaW9uOiAwLFxyXG4gICAgICAgIHR5cGVWYWxpZGF0aW9uOiBmYWxzZSxcclxuICAgICAgICBiZW5jaG1hcms6IGZhbHNlLFxyXG4gICAgICAgIG1pbmlmeUFsaWFzZXM6IGZhbHNlLFxyXG4gICAgICAgIGxvZ1F1ZXJ5UGFyYW1ldGVyczogZmFsc2VcclxuICAgICAgfSxcclxuICAgICAgb3B0aW9ucyB8fCB7fVxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaWFsZWN0KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpYWxlY3QgbmVlZHMgdG8gYmUgZXhwbGljaXRseSBzdXBwbGllZCBhcyBvZiB2NC4wLjBcIik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kaWFsZWN0ID09PSBcInBvc3RncmVzcWxcIikge1xyXG4gICAgICB0aGlzLm9wdGlvbnMuZGlhbGVjdCA9IFwicG9zdGdyZXNcIjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgIHRoaXMub3B0aW9ucy5kaWFsZWN0ID09PSBcInNxbGl0ZVwiICYmXHJcbiAgICAgIHRoaXMub3B0aW9ucy50aW1lem9uZSAhPT0gXCIrMDA6MDBcIlxyXG4gICAgKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBcIlNldHRpbmcgYSBjdXN0b20gdGltZXpvbmUgaXMgbm90IHN1cHBvcnRlZCBieSBTUUxpdGUsIGRhdGVzIGFyZSBhbHdheXMgcmV0dXJuZWQgYXMgVVRDLiBQbGVhc2UgcmVtb3ZlIHRoZSBjdXN0b20gdGltZXpvbmUgcGFyYW1ldGVyLlwiXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5sb2dnaW5nID09PSB0cnVlKSB7XHJcbiAgICAgIGRlcHJlY2F0aW9ucy5ub1RydWVMb2dnaW5nKCk7XHJcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgIHRoaXMub3B0aW9ucy5sb2dnaW5nID0gY29uc29sZS5sb2c7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fc2V0dXBIb29rcyhvcHRpb25zLmhvb2tzKTtcclxuXHJcbiAgICB0aGlzLmNvbmZpZyA9IHtcclxuICAgICAgZGF0YWJhc2U6IGNvbmZpZy5kYXRhYmFzZSB8fCB0aGlzLm9wdGlvbnMuZGF0YWJhc2UsXHJcbiAgICAgIHVzZXJuYW1lOiBjb25maWcudXNlcm5hbWUgfHwgdGhpcy5vcHRpb25zLnVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZDogY29uZmlnLnBhc3N3b3JkIHx8IHRoaXMub3B0aW9ucy5wYXNzd29yZCB8fCBudWxsLFxyXG4gICAgICBob3N0OiBjb25maWcuaG9zdCB8fCB0aGlzLm9wdGlvbnMuaG9zdCxcclxuICAgICAgcG9ydDogY29uZmlnLnBvcnQgfHwgdGhpcy5vcHRpb25zLnBvcnQsXHJcbiAgICAgIHBvb2w6IHRoaXMub3B0aW9ucy5wb29sLFxyXG4gICAgICBwcm90b2NvbDogdGhpcy5vcHRpb25zLnByb3RvY29sLFxyXG4gICAgICBuYXRpdmU6IHRoaXMub3B0aW9ucy5uYXRpdmUsXHJcbiAgICAgIHNzbDogdGhpcy5vcHRpb25zLnNzbCxcclxuICAgICAgcmVwbGljYXRpb246IHRoaXMub3B0aW9ucy5yZXBsaWNhdGlvbixcclxuICAgICAgZGlhbGVjdE1vZHVsZTogdGhpcy5vcHRpb25zLmRpYWxlY3RNb2R1bGUsXHJcbiAgICAgIGRpYWxlY3RNb2R1bGVQYXRoOiB0aGlzLm9wdGlvbnMuZGlhbGVjdE1vZHVsZVBhdGgsXHJcbiAgICAgIGtlZXBEZWZhdWx0VGltZXpvbmU6IHRoaXMub3B0aW9ucy5rZWVwRGVmYXVsdFRpbWV6b25lLFxyXG4gICAgICBkaWFsZWN0T3B0aW9uczogdGhpcy5vcHRpb25zLmRpYWxlY3RPcHRpb25zXHJcbiAgICB9O1xyXG5cclxuICAgIGxldCBEaWFsZWN0O1xyXG4gICAgLy8gUmVxdWlyaW5nIHRoZSBkaWFsZWN0IGluIGEgc3dpdGNoLWNhc2UgdG8ga2VlcCB0aGVcclxuICAgIC8vIHJlcXVpcmUgY2FsbHMgc3RhdGljLiAoQnJvd3NlcmlmeSBmaXgpXHJcbiAgICBzd2l0Y2ggKHRoaXMuZ2V0RGlhbGVjdCgpKSB7XHJcbiAgICAgIGNhc2UgXCJzcWxpdGVcIjpcclxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcclxuICAgICAgICBEaWFsZWN0ID0gcmVxdWlyZShcIi4vZGlhbGVjdHMvc3FsaXRlXCIpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgIGBUaGUgZGlhbGVjdCAke3RoaXMuZ2V0RGlhbGVjdCgpfSBpcyBub3Qgc3VwcG9ydGVkLiBTdXBwb3J0ZWQgZGlhbGVjdHM6IHNxbGl0ZS5gXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRpYWxlY3QgPSBuZXcgRGlhbGVjdCh0aGlzKTtcclxuICAgIHRoaXMuZGlhbGVjdC5RdWVyeUdlbmVyYXRvci50eXBlVmFsaWRhdGlvbiA9IG9wdGlvbnMudHlwZVZhbGlkYXRpb247XHJcblxyXG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdCh0aGlzLm9wdGlvbnMub3BlcmF0b3JzQWxpYXNlcykpIHtcclxuICAgICAgZGVwcmVjYXRpb25zLm5vU3RyaW5nT3BlcmF0b3JzKCk7XHJcbiAgICAgIHRoaXMuZGlhbGVjdC5RdWVyeUdlbmVyYXRvci5zZXRPcGVyYXRvcnNBbGlhc2VzKFxyXG4gICAgICAgIHRoaXMub3B0aW9ucy5vcGVyYXRvcnNBbGlhc2VzXHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub3BlcmF0b3JzQWxpYXNlcyA9PT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgZGVwcmVjYXRpb25zLm5vQm9vbE9wZXJhdG9yQWxpYXNlcygpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucXVlcnlJbnRlcmZhY2UgPSBuZXcgUXVlcnlJbnRlcmZhY2UodGhpcyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNb2RlbHMgYXJlIHN0b3JlZCBoZXJlIHVuZGVyIHRoZSBuYW1lIGdpdmVuIHRvIGBzZXF1ZWxpemUuZGVmaW5lYFxyXG4gICAgICovXHJcbiAgICB0aGlzLm1vZGVscyA9IHt9O1xyXG4gICAgdGhpcy5tb2RlbE1hbmFnZXIgPSBuZXcgTW9kZWxNYW5hZ2VyKHRoaXMpO1xyXG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlciA9IHRoaXMuZGlhbGVjdC5jb25uZWN0aW9uTWFuYWdlcjtcclxuXHJcbiAgICB0aGlzLmltcG9ydENhY2hlID0ge307XHJcblxyXG4gICAgU2VxdWVsaXplLnJ1bkhvb2tzKFwiYWZ0ZXJJbml0XCIsIHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVmcmVzaCBkYXRhIHR5cGVzIGFuZCBwYXJzZXJzLlxyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICByZWZyZXNoVHlwZXMoKSB7XHJcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLnJlZnJlc2hUeXBlUGFyc2VyKERhdGFUeXBlcyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzcGVjaWZpZWQgZGlhbGVjdC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBzcGVjaWZpZWQgZGlhbGVjdC5cclxuICAgKi9cclxuICBnZXREaWFsZWN0KCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5kaWFsZWN0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZGF0YWJhc2UgbmFtZS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBkYXRhYmFzZSBuYW1lLlxyXG4gICAqL1xyXG4gIGdldERhdGFiYXNlTmFtZSgpIHtcclxuICAgIHJldHVybiB0aGlzLmNvbmZpZy5kYXRhYmFzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgUXVlcnlJbnRlcmZhY2UuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UXVlcnlJbnRlcmZhY2V9IEFuIGluc3RhbmNlIChzaW5nbGV0b24pIG9mIFF1ZXJ5SW50ZXJmYWNlLlxyXG4gICAqL1xyXG4gIGdldFF1ZXJ5SW50ZXJmYWNlKCkge1xyXG4gICAgdGhpcy5xdWVyeUludGVyZmFjZSA9IHRoaXMucXVlcnlJbnRlcmZhY2UgfHwgbmV3IFF1ZXJ5SW50ZXJmYWNlKHRoaXMpO1xyXG4gICAgcmV0dXJuIHRoaXMucXVlcnlJbnRlcmZhY2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZpbmUgYSBuZXcgbW9kZWwsIHJlcHJlc2VudGluZyBhIHRhYmxlIGluIHRoZSBkYXRhYmFzZS5cclxuICAgKlxyXG4gICAqIFRoZSB0YWJsZSBjb2x1bW5zIGFyZSBkZWZpbmVkIGJ5IHRoZSBvYmplY3QgdGhhdCBpcyBnaXZlbiBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50LiBFYWNoIGtleSBvZiB0aGUgb2JqZWN0IHJlcHJlc2VudHMgYSBjb2x1bW5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlbE5hbWUgVGhlIG5hbWUgb2YgdGhlIG1vZGVsLiBUaGUgbW9kZWwgd2lsbCBiZSBzdG9yZWQgaW4gYHNlcXVlbGl6ZS5tb2RlbHNgIHVuZGVyIHRoaXMgbmFtZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzIEFuIG9iamVjdCwgd2hlcmUgZWFjaCBhdHRyaWJ1dGUgaXMgYSBjb2x1bW4gb2YgdGhlIHRhYmxlLiBTZWUge0BsaW5rIE1vZGVsLmluaXR9XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGVzZSBvcHRpb25zIGFyZSBtZXJnZWQgd2l0aCB0aGUgZGVmYXVsdCBkZWZpbmUgb3B0aW9ucyBwcm92aWRlZCB0byB0aGUgU2VxdWVsaXplIGNvbnN0cnVjdG9yIGFuZCBwYXNzZWQgdG8gTW9kZWwuaW5pdCgpXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLmluaXR9IGZvciBhIG1vcmUgY29tcHJlaGVuc2l2ZSBzcGVjaWZpY2F0aW9uIG9mIHRoZSBgb3B0aW9uc2AgYW5kIGBhdHRyaWJ1dGVzYCBvYmplY3RzLlxyXG4gICAqIEBzZWUgPGEgaHJlZj1cIi9tYW51YWwvdHV0b3JpYWwvbW9kZWxzLWRlZmluaXRpb24uaHRtbFwiPk1vZGVsIGRlZmluaXRpb248L2E+IE1hbnVhbCByZWxhdGVkIHRvIG1vZGVsIGRlZmluaXRpb25cclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIERhdGFUeXBlc30gRm9yIGEgbGlzdCBvZiBwb3NzaWJsZSBkYXRhIHR5cGVzXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7TW9kZWx9IE5ld2x5IGRlZmluZWQgbW9kZWxcclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogc2VxdWVsaXplLmRlZmluZSgnbW9kZWxOYW1lJywge1xyXG4gICAqICAgY29sdW1uQToge1xyXG4gICAqICAgICAgIHR5cGU6IFNlcXVlbGl6ZS5CT09MRUFOLFxyXG4gICAqICAgICAgIHZhbGlkYXRlOiB7XHJcbiAgICogICAgICAgICBpczogW1wiW2Etel1cIiwnaSddLCAgICAgICAgLy8gd2lsbCBvbmx5IGFsbG93IGxldHRlcnNcclxuICAgKiAgICAgICAgIG1heDogMjMsICAgICAgICAgICAgICAgICAgLy8gb25seSBhbGxvdyB2YWx1ZXMgPD0gMjNcclxuICAgKiAgICAgICAgIGlzSW46IHtcclxuICAgKiAgICAgICAgICAgYXJnczogW1snZW4nLCAnemgnXV0sXHJcbiAgICogICAgICAgICAgIG1zZzogXCJNdXN0IGJlIEVuZ2xpc2ggb3IgQ2hpbmVzZVwiXHJcbiAgICogICAgICAgICB9XHJcbiAgICogICAgICAgfSxcclxuICAgKiAgICAgICBmaWVsZDogJ2NvbHVtbl9hJ1xyXG4gICAqICAgfSxcclxuICAgKiAgIGNvbHVtbkI6IFNlcXVlbGl6ZS5TVFJJTkcsXHJcbiAgICogICBjb2x1bW5DOiAnTVkgVkVSWSBPV04gQ09MVU1OIFRZUEUnXHJcbiAgICogfSk7XHJcbiAgICpcclxuICAgKiBzZXF1ZWxpemUubW9kZWxzLm1vZGVsTmFtZSAvLyBUaGUgbW9kZWwgd2lsbCBub3cgYmUgYXZhaWxhYmxlIGluIG1vZGVscyB1bmRlciB0aGUgbmFtZSBnaXZlbiB0byBkZWZpbmVcclxuICAgKi9cclxuICBkZWZpbmUobW9kZWxOYW1lLCBhdHRyaWJ1dGVzLCBvcHRpb25zID0ge30pIHtcclxuICAgIG9wdGlvbnMubW9kZWxOYW1lID0gbW9kZWxOYW1lO1xyXG4gICAgb3B0aW9ucy5zZXF1ZWxpemUgPSB0aGlzO1xyXG5cclxuICAgIGNvbnN0IG1vZGVsID0gY2xhc3MgZXh0ZW5kcyBNb2RlbCB7fTtcclxuXHJcbiAgICBtb2RlbC5pbml0KGF0dHJpYnV0ZXMsIG9wdGlvbnMpO1xyXG5cclxuICAgIHJldHVybiBtb2RlbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGEgTW9kZWwgd2hpY2ggaXMgYWxyZWFkeSBkZWZpbmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW9kZWxOYW1lIFRoZSBuYW1lIG9mIGEgbW9kZWwgZGVmaW5lZCB3aXRoIFNlcXVlbGl6ZS5kZWZpbmVcclxuICAgKlxyXG4gICAqIEB0aHJvd3MgV2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgbW9kZWwgaXMgbm90IGRlZmluZWQgKHRoYXQgaXMsIGlmIHNlcXVlbGl6ZSNpc0RlZmluZWQgcmV0dXJucyBmYWxzZSlcclxuICAgKiBAcmV0dXJucyB7TW9kZWx9IFNwZWNpZmllZCBtb2RlbFxyXG4gICAqL1xyXG4gIG1vZGVsKG1vZGVsTmFtZSkge1xyXG4gICAgaWYgKCF0aGlzLmlzRGVmaW5lZChtb2RlbE5hbWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHttb2RlbE5hbWV9IGhhcyBub3QgYmVlbiBkZWZpbmVkYCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMubW9kZWxNYW5hZ2VyLmdldE1vZGVsKG1vZGVsTmFtZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVja3Mgd2hldGhlciBhIG1vZGVsIHdpdGggdGhlIGdpdmVuIG5hbWUgaXMgZGVmaW5lZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1vZGVsTmFtZSBUaGUgbmFtZSBvZiBhIG1vZGVsIGRlZmluZWQgd2l0aCBTZXF1ZWxpemUuZGVmaW5lXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIG1vZGVsIGlzIGFscmVhZHkgZGVmaW5lZCwgb3RoZXJ3aXNlIGZhbHNlXHJcbiAgICovXHJcbiAgaXNEZWZpbmVkKG1vZGVsTmFtZSkge1xyXG4gICAgcmV0dXJuICEhdGhpcy5tb2RlbE1hbmFnZXIubW9kZWxzLmZpbmQobW9kZWwgPT4gbW9kZWwubmFtZSA9PT0gbW9kZWxOYW1lKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEltcG9ydHMgYSBtb2RlbCBkZWZpbmVkIGluIGFub3RoZXIgZmlsZS4gSW1wb3J0ZWQgbW9kZWxzIGFyZSBjYWNoZWQsIHNvIG11bHRpcGxlXHJcbiAgICogY2FsbHMgdG8gaW1wb3J0IHdpdGggdGhlIHNhbWUgcGF0aCB3aWxsIG5vdCBsb2FkIHRoZSBmaWxlIG11bHRpcGxlIHRpbWVzLlxyXG4gICAqXHJcbiAgICogQHR1dG9yaWFsIGh0dHBzOi8vZ2l0aHViLmNvbS9zZXF1ZWxpemUvZXhwcmVzcy1leGFtcGxlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaW1wb3J0UGF0aCBUaGUgcGF0aCB0byB0aGUgZmlsZSB0aGF0IGhvbGRzIHRoZSBtb2RlbCB5b3Ugd2FudCB0byBpbXBvcnQuIElmIHRoZSBwYXJ0IGlzIHJlbGF0aXZlLCBpdCB3aWxsIGJlIHJlc29sdmVkIHJlbGF0aXZlbHkgdG8gdGhlIGNhbGxpbmcgZmlsZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge01vZGVsfSBJbXBvcnRlZCBtb2RlbCwgcmV0dXJuZWQgZnJvbSBjYWNoZSBpZiB3YXMgYWxyZWFkeSBpbXBvcnRlZFxyXG4gICAqL1xyXG4gIGltcG9ydChpbXBvcnRQYXRoKSB7fVxyXG5cclxuICAvKipcclxuICAgKiBFeGVjdXRlIGEgcXVlcnkgb24gdGhlIERCLCBvcHRpb25hbGx5IGJ5cGFzc2luZyBhbGwgdGhlIFNlcXVlbGl6ZSBnb29kbmVzcy5cclxuICAgKlxyXG4gICAqIEJ5IGRlZmF1bHQsIHRoZSBmdW5jdGlvbiB3aWxsIHJldHVybiB0d28gYXJndW1lbnRzOiBhbiBhcnJheSBvZiByZXN1bHRzLCBhbmQgYSBtZXRhZGF0YSBvYmplY3QsIGNvbnRhaW5pbmcgbnVtYmVyIG9mIGFmZmVjdGVkIHJvd3MgZXRjLlxyXG4gICAqXHJcbiAgICogSWYgeW91IGFyZSBydW5uaW5nIGEgdHlwZSBvZiBxdWVyeSB3aGVyZSB5b3UgZG9uJ3QgbmVlZCB0aGUgbWV0YWRhdGEsIGZvciBleGFtcGxlIGEgYFNFTEVDVGAgcXVlcnksIHlvdSBjYW4gcGFzcyBpbiBhIHF1ZXJ5IHR5cGUgdG8gbWFrZSBzZXF1ZWxpemUgZm9ybWF0IHRoZSByZXN1bHRzOlxyXG4gICAqXHJcbiAgICogYGBganNcclxuICAgKiBzZXF1ZWxpemUucXVlcnkoJ1NFTEVDVC4uLicpLnRoZW4oKFtyZXN1bHRzLCBtZXRhZGF0YV0pID0+IHtcclxuICAgKiAgIC8vIFJhdyBxdWVyeSAtIHVzZSB0aGVuIHBsdXMgYXJyYXkgc3ByZWFkXHJcbiAgICogfSk7XHJcbiAgICpcclxuICAgKiBzZXF1ZWxpemUucXVlcnkoJ1NFTEVDVC4uLicsIHsgdHlwZTogc2VxdWVsaXplLlF1ZXJ5VHlwZXMuU0VMRUNUIH0pLnRoZW4ocmVzdWx0cyA9PiB7XHJcbiAgICogICAvLyBTRUxFQ1QgcXVlcnkgLSB1c2UgdGhlblxyXG4gICAqIH0pXHJcbiAgICogYGBgXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgc3FsXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgIFtvcHRpb25zPXt9XSBRdWVyeSBvcHRpb25zLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICBbb3B0aW9ucy5yYXddIElmIHRydWUsIHNlcXVlbGl6ZSB3aWxsIG5vdCB0cnkgdG8gZm9ybWF0IHRoZSByZXN1bHRzIG9mIHRoZSBxdWVyeSwgb3IgYnVpbGQgYW4gaW5zdGFuY2Ugb2YgYSBtb2RlbCBmcm9tIHRoZSByZXN1bHRcclxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSAgICAgW29wdGlvbnMudHJhbnNhY3Rpb249bnVsbF0gVGhlIHRyYW5zYWN0aW9uIHRoYXQgdGhlIHF1ZXJ5IHNob3VsZCBiZSBleGVjdXRlZCB1bmRlclxyXG4gICAqIEBwYXJhbSB7UXVlcnlUeXBlc30gICAgICBbb3B0aW9ucy50eXBlPSdSQVcnXSBUaGUgdHlwZSBvZiBxdWVyeSB5b3UgYXJlIGV4ZWN1dGluZy4gVGhlIHF1ZXJ5IHR5cGUgYWZmZWN0cyBob3cgcmVzdWx0cyBhcmUgZm9ybWF0dGVkIGJlZm9yZSB0aGV5IGFyZSBwYXNzZWQgYmFjay4gVGhlIHR5cGUgaXMgYSBzdHJpbmcsIGJ1dCBgU2VxdWVsaXplLlF1ZXJ5VHlwZXNgIGlzIHByb3ZpZGVkIGFzIGNvbnZlbmllbmNlIHNob3J0Y3V0cy5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMubmVzdD1mYWxzZV0gSWYgdHJ1ZSwgdHJhbnNmb3JtcyBvYmplY3RzIHdpdGggYC5gIHNlcGFyYXRlZCBwcm9wZXJ0eSBuYW1lcyBpbnRvIG5lc3RlZCBvYmplY3RzIHVzaW5nIFtkb3R0aWUuanNdKGh0dHBzOi8vZ2l0aHViLmNvbS9taWNraGFuc2VuL2RvdHRpZS5qcykuIEZvciBleGFtcGxlIHsgJ3VzZXIudXNlcm5hbWUnOiAnam9obicgfSBiZWNvbWVzIHsgdXNlcjogeyB1c2VybmFtZTogJ2pvaG4nIH19LiBXaGVuIGBuZXN0YCBpcyB0cnVlLCB0aGUgcXVlcnkgdHlwZSBpcyBhc3N1bWVkIHRvIGJlIGAnU0VMRUNUJ2AsIHVubGVzcyBvdGhlcndpc2Ugc3BlY2lmaWVkXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgIFtvcHRpb25zLnBsYWluPWZhbHNlXSBTZXRzIHRoZSBxdWVyeSB0eXBlIHRvIGBTRUxFQ1RgIGFuZCByZXR1cm4gYSBzaW5nbGUgcm93XHJcbiAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9ICAgIFtvcHRpb25zLnJlcGxhY2VtZW50c10gRWl0aGVyIGFuIG9iamVjdCBvZiBuYW1lZCBwYXJhbWV0ZXIgcmVwbGFjZW1lbnRzIGluIHRoZSBmb3JtYXQgYDpwYXJhbWAgb3IgYW4gYXJyYXkgb2YgdW5uYW1lZCByZXBsYWNlbWVudHMgdG8gcmVwbGFjZSBgP2AgaW4geW91ciBTUUwuXHJcbiAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9ICAgIFtvcHRpb25zLmJpbmRdIEVpdGhlciBhbiBvYmplY3Qgb2YgbmFtZWQgYmluZCBwYXJhbWV0ZXIgaW4gdGhlIGZvcm1hdCBgX3BhcmFtYCBvciBhbiBhcnJheSBvZiB1bm5hbWVkIGJpbmQgcGFyYW1ldGVyIHRvIHJlcGxhY2UgYCQxLCAkMiwgLi4uYCBpbiB5b3VyIFNRTC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMudXNlTWFzdGVyPWZhbHNlXSBGb3JjZSB0aGUgcXVlcnkgdG8gdXNlIHRoZSB3cml0ZSBwb29sLCByZWdhcmRsZXNzIG9mIHRoZSBxdWVyeSB0eXBlLlxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259ICAgICAgICBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGlsZSBydW5uaW5nIHRoZSBxdWVyeSB0byBsb2cgdGhlIHNxbC5cclxuICAgKiBAcGFyYW0ge25ldyBNb2RlbCgpfSAgICAgW29wdGlvbnMuaW5zdGFuY2VdIEEgc2VxdWVsaXplIGluc3RhbmNlIHVzZWQgdG8gYnVpbGQgdGhlIHJldHVybiBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7TW9kZWx9ICAgICAgICAgICBbb3B0aW9ucy5tb2RlbF0gQSBzZXF1ZWxpemUgbW9kZWwgdXNlZCB0byBidWlsZCB0aGUgcmV0dXJuZWQgbW9kZWwgaW5zdGFuY2VzICh1c2VkIHRvIGJlIGNhbGxlZCBjYWxsZWUpXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgIFtvcHRpb25zLnJldHJ5XSBTZXQgb2YgZmxhZ3MgdGhhdCBjb250cm9sIHdoZW4gYSBxdWVyeSBpcyBhdXRvbWF0aWNhbGx5IHJldHJpZWQuXHJcbiAgICogQHBhcmFtIHtBcnJheX0gICAgICAgICAgIFtvcHRpb25zLnJldHJ5Lm1hdGNoXSBPbmx5IHJldHJ5IGEgcXVlcnkgaWYgdGhlIGVycm9yIG1hdGNoZXMgb25lIG9mIHRoZXNlIHN0cmluZ3MuXHJcbiAgICogQHBhcmFtIHtJbnRlZ2VyfSAgICAgICAgIFtvcHRpb25zLnJldHJ5Lm1heF0gSG93IG1hbnkgdGltZXMgYSBmYWlsaW5nIHF1ZXJ5IGlzIGF1dG9tYXRpY2FsbHkgcmV0cmllZC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICBbb3B0aW9ucy5zdXBwb3J0c1NlYXJjaFBhdGhdIElmIGZhbHNlIGRvIG5vdCBwcmVwZW5kIHRoZSBxdWVyeSB3aXRoIHRoZSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMubWFwVG9Nb2RlbD1mYWxzZV0gTWFwIHJldHVybmVkIGZpZWxkcyB0byBtb2RlbCdzIGZpZWxkcyBpZiBgb3B0aW9ucy5tb2RlbGAgb3IgYG9wdGlvbnMuaW5zdGFuY2VgIGlzIHByZXNlbnQuIE1hcHBpbmcgd2lsbCBvY2N1ciBiZWZvcmUgYnVpbGRpbmcgdGhlIG1vZGVsIGluc3RhbmNlLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICBbb3B0aW9ucy5maWVsZE1hcF0gTWFwIHJldHVybmVkIGZpZWxkcyB0byBhcmJpdHJhcnkgbmFtZXMgZm9yIGBTRUxFQ1RgIHF1ZXJ5IHR5cGUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKlxyXG4gICAqIEBzZWUge0BsaW5rIE1vZGVsLmJ1aWxkfSBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBpbnN0YW5jZSBvcHRpb24uXHJcbiAgICovXHJcblxyXG4gIHF1ZXJ5KHNxbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMub3B0aW9ucy5xdWVyeSwgb3B0aW9ucyk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuaW5zdGFuY2UgJiYgIW9wdGlvbnMubW9kZWwpIHtcclxuICAgICAgb3B0aW9ucy5tb2RlbCA9IG9wdGlvbnMuaW5zdGFuY2UuY29uc3RydWN0b3I7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFvcHRpb25zLmluc3RhbmNlICYmICFvcHRpb25zLm1vZGVsKSB7XHJcbiAgICAgIG9wdGlvbnMucmF3ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBtYXAgcmF3IGZpZWxkcyB0byBtb2RlbCBhdHRyaWJ1dGVzXHJcbiAgICBpZiAob3B0aW9ucy5tYXBUb01vZGVsKSB7XHJcbiAgICAgIG9wdGlvbnMuZmllbGRNYXAgPSBfLmdldChvcHRpb25zLCBcIm1vZGVsLmZpZWxkQXR0cmlidXRlTWFwXCIsIHt9KTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zID0gXy5kZWZhdWx0cyhvcHRpb25zLCB7XHJcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgIGxvZ2dpbmc6IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLm9wdGlvbnMsIFwibG9nZ2luZ1wiKVxyXG4gICAgICAgID8gdGhpcy5vcHRpb25zLmxvZ2dpbmdcclxuICAgICAgICA6IGNvbnNvbGUubG9nLFxyXG4gICAgICBzZWFyY2hQYXRoOiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoXHJcbiAgICAgICAgdGhpcy5vcHRpb25zLFxyXG4gICAgICAgIFwic2VhcmNoUGF0aFwiXHJcbiAgICAgIClcclxuICAgICAgICA/IHRoaXMub3B0aW9ucy5zZWFyY2hQYXRoXHJcbiAgICAgICAgOiBcIkRFRkFVTFRcIlxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCFvcHRpb25zLnR5cGUpIHtcclxuICAgICAgaWYgKG9wdGlvbnMubW9kZWwgfHwgb3B0aW9ucy5uZXN0IHx8IG9wdGlvbnMucGxhaW4pIHtcclxuICAgICAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLlNFTEVDVDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLlJBVztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vaWYgZGlhbGVjdCBkb2Vzbid0IHN1cHBvcnQgc2VhcmNoX3BhdGggb3IgZGlhbGVjdCBvcHRpb25cclxuICAgIC8vdG8gcHJlcGVuZCBzZWFyY2hQYXRoIGlzIG5vdCB0cnVlIGRlbGV0ZSB0aGUgc2VhcmNoUGF0aCBvcHRpb25cclxuICAgIGlmIChcclxuICAgICAgIXRoaXMuZGlhbGVjdC5zdXBwb3J0cy5zZWFyY2hQYXRoIHx8XHJcbiAgICAgICF0aGlzLm9wdGlvbnMuZGlhbGVjdE9wdGlvbnMgfHxcclxuICAgICAgIXRoaXMub3B0aW9ucy5kaWFsZWN0T3B0aW9ucy5wcmVwZW5kU2VhcmNoUGF0aCB8fFxyXG4gICAgICBvcHRpb25zLnN1cHBvcnRzU2VhcmNoUGF0aCA9PT0gZmFsc2VcclxuICAgICkge1xyXG4gICAgICBkZWxldGUgb3B0aW9ucy5zZWFyY2hQYXRoO1xyXG4gICAgfSBlbHNlIGlmICghb3B0aW9ucy5zZWFyY2hQYXRoKSB7XHJcbiAgICAgIC8vaWYgdXNlciB3YW50cyB0byBhbHdheXMgcHJlcGVuZCBzZWFyY2hQYXRoIChkaWFsZWN0T3B0aW9ucy5wcmVwcmVuZFNlYXJjaFBhdGggPSB0cnVlKVxyXG4gICAgICAvL3RoZW4gc2V0IHRvIERFRkFVTFQgaWYgbm9uZSBpcyBwcm92aWRlZFxyXG4gICAgICBvcHRpb25zLnNlYXJjaFBhdGggPSBcIkRFRkFVTFRcIjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xyXG4gICAgICBpZiAodHlwZW9mIHNxbCA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIGlmIChzcWwudmFsdWVzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGlmIChvcHRpb25zLnJlcGxhY2VtZW50cyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICBcIkJvdGggYHNxbC52YWx1ZXNgIGFuZCBgb3B0aW9ucy5yZXBsYWNlbWVudHNgIGNhbm5vdCBiZSBzZXQgYXQgdGhlIHNhbWUgdGltZVwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBvcHRpb25zLnJlcGxhY2VtZW50cyA9IHNxbC52YWx1ZXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3FsLmJpbmQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgaWYgKG9wdGlvbnMuYmluZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICBcIkJvdGggYHNxbC5iaW5kYCBhbmQgYG9wdGlvbnMuYmluZGAgY2Fubm90IGJlIHNldCBhdCB0aGUgc2FtZSB0aW1lXCJcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIG9wdGlvbnMuYmluZCA9IHNxbC5iaW5kO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNxbC5xdWVyeSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBzcWwgPSBzcWwucXVlcnk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBzcWwgPSBzcWwudHJpbSgpO1xyXG5cclxuICAgICAgaWYgKG9wdGlvbnMucmVwbGFjZW1lbnRzICYmIG9wdGlvbnMuYmluZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgIFwiQm90aCBgcmVwbGFjZW1lbnRzYCBhbmQgYGJpbmRgIGNhbm5vdCBiZSBzZXQgYXQgdGhlIHNhbWUgdGltZVwiXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG9wdGlvbnMucmVwbGFjZW1lbnRzKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5yZXBsYWNlbWVudHMpKSB7XHJcbiAgICAgICAgICBzcWwgPSBVdGlscy5mb3JtYXQoXHJcbiAgICAgICAgICAgIFtzcWxdLmNvbmNhdChvcHRpb25zLnJlcGxhY2VtZW50cyksXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kaWFsZWN0XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzcWwgPSBVdGlscy5mb3JtYXROYW1lZFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICAgIHNxbCxcclxuICAgICAgICAgICAgb3B0aW9ucy5yZXBsYWNlbWVudHMsXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kaWFsZWN0XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IGJpbmRQYXJhbWV0ZXJzO1xyXG5cclxuICAgICAgaWYgKG9wdGlvbnMuYmluZCkge1xyXG4gICAgICAgIFtzcWwsIGJpbmRQYXJhbWV0ZXJzXSA9IHRoaXMuZGlhbGVjdC5RdWVyeS5mb3JtYXRCaW5kUGFyYW1ldGVycyhcclxuICAgICAgICAgIHNxbCxcclxuICAgICAgICAgIG9wdGlvbnMuYmluZCxcclxuICAgICAgICAgIHRoaXMub3B0aW9ucy5kaWFsZWN0XHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgY2hlY2tUcmFuc2FjdGlvbiA9ICgpID0+IHtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBvcHRpb25zLnRyYW5zYWN0aW9uICYmXHJcbiAgICAgICAgICBvcHRpb25zLnRyYW5zYWN0aW9uLmZpbmlzaGVkICYmXHJcbiAgICAgICAgICAhb3B0aW9ucy5jb21wbGV0ZXNUcmFuc2FjdGlvblxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgIGAke29wdGlvbnMudHJhbnNhY3Rpb24uZmluaXNoZWR9IGhhcyBiZWVuIGNhbGxlZCBvbiB0aGlzIHRyYW5zYWN0aW9uKCR7b3B0aW9ucy50cmFuc2FjdGlvbi5pZH0pLCB5b3UgY2FuIG5vIGxvbmdlciB1c2UgaXQuIChUaGUgcmVqZWN0ZWQgcXVlcnkgaXMgYXR0YWNoZWQgYXMgdGhlICdzcWwnIHByb3BlcnR5IG9mIHRoaXMgZXJyb3IpYFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIGVycm9yLnNxbCA9IHNxbDtcclxuICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJldHJ5T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXHJcbiAgICAgICAge30sXHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnJldHJ5LFxyXG4gICAgICAgIG9wdGlvbnMucmV0cnkgfHwge31cclxuICAgICAgKTtcclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoXHJcbiAgICAgICAgcmV0cnkoXHJcbiAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICBQcm9taXNlLnRyeSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKG9wdGlvbnMudHJhbnNhY3Rpb24gPT09IHVuZGVmaW5lZCAmJiBTZXF1ZWxpemUuX2Nscykge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy50cmFuc2FjdGlvbiA9IFNlcXVlbGl6ZS5fY2xzLmdldChcInRyYW5zYWN0aW9uXCIpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY2hlY2tUcmFuc2FjdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy50cmFuc2FjdGlvblxyXG4gICAgICAgICAgICAgICAgPyBvcHRpb25zLnRyYW5zYWN0aW9uLmNvbm5lY3Rpb25cclxuICAgICAgICAgICAgICAgIDogdGhpcy5jb25uZWN0aW9uTWFuYWdlci5nZXRDb25uZWN0aW9uKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9KS50aGVuKGNvbm5lY3Rpb24gPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gbmV3IHRoaXMuZGlhbGVjdC5RdWVyeShjb25uZWN0aW9uLCB0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcyhcImJlZm9yZVF1ZXJ5XCIsIG9wdGlvbnMsIHF1ZXJ5KVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gY2hlY2tUcmFuc2FjdGlvbigpKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcXVlcnkucnVuKHNxbCwgYmluZFBhcmFtZXRlcnMpKVxyXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4gdGhpcy5ydW5Ib29rcyhcImFmdGVyUXVlcnlcIiwgb3B0aW9ucywgcXVlcnkpKVxyXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMudHJhbnNhY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uTWFuYWdlci5yZWxlYXNlQ29ubmVjdGlvbihjb25uZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgcmV0cnlPcHRpb25zXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeGVjdXRlIGEgcXVlcnkgd2hpY2ggd291bGQgc2V0IGFuIGVudmlyb25tZW50IG9yIHVzZXIgdmFyaWFibGUuIFRoZSB2YXJpYWJsZXMgYXJlIHNldCBwZXIgY29ubmVjdGlvbiwgc28gdGhpcyBmdW5jdGlvbiBuZWVkcyBhIHRyYW5zYWN0aW9uLlxyXG4gICAqIE9ubHkgd29ya3MgZm9yIE15U1FMLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICB2YXJpYWJsZXMgT2JqZWN0IHdpdGggbXVsdGlwbGUgdmFyaWFibGVzLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgW29wdGlvbnNdIHF1ZXJ5IG9wdGlvbnMuXHJcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVGhlIHRyYW5zYWN0aW9uIHRoYXQgdGhlIHF1ZXJ5IHNob3VsZCBiZSBleGVjdXRlZCB1bmRlclxyXG4gICAqXHJcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgc2V0KHZhcmlhYmxlcywgb3B0aW9ucykge1xyXG4gICAgLy8gUHJlcGFyZSBvcHRpb25zXHJcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcclxuICAgICAge30sXHJcbiAgICAgIHRoaXMub3B0aW9ucy5zZXQsXHJcbiAgICAgIHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiICYmIG9wdGlvbnNcclxuICAgICk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kaWFsZWN0ICE9PSBcIm15c3FsXCIpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwic2VxdWVsaXplLnNldCBpcyBvbmx5IHN1cHBvcnRlZCBmb3IgbXlzcWxcIik7XHJcbiAgICB9XHJcbiAgICBpZiAoIW9wdGlvbnMudHJhbnNhY3Rpb24gfHwgIShvcHRpb25zLnRyYW5zYWN0aW9uIGluc3RhbmNlb2YgVHJhbnNhY3Rpb24pKSB7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJvcHRpb25zLnRyYW5zYWN0aW9uIGlzIHJlcXVpcmVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE92ZXJyaWRlIHNvbWUgb3B0aW9ucywgc2luY2UgdGhpcyBpc24ndCBhIFNFTEVDVFxyXG4gICAgb3B0aW9ucy5yYXcgPSB0cnVlO1xyXG4gICAgb3B0aW9ucy5wbGFpbiA9IHRydWU7XHJcbiAgICBvcHRpb25zLnR5cGUgPSBcIlNFVFwiO1xyXG5cclxuICAgIC8vIEdlbmVyYXRlIFNRTCBRdWVyeVxyXG4gICAgY29uc3QgcXVlcnkgPSBgU0VUICR7Xy5tYXAoXHJcbiAgICAgIHZhcmlhYmxlcyxcclxuICAgICAgKHYsIGspID0+IGBAJHtrfSA6PSAke3R5cGVvZiB2ID09PSBcInN0cmluZ1wiID8gYFwiJHt2fVwiYCA6IHZ9YFxyXG4gICAgKS5qb2luKFwiLCBcIil9YDtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5xdWVyeShxdWVyeSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFc2NhcGUgdmFsdWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgc3RyaW5nIHZhbHVlIHRvIGVzY2FwZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICBlc2NhcGUodmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFF1ZXJ5SW50ZXJmYWNlKCkuZXNjYXBlKHZhbHVlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhIG5ldyBkYXRhYmFzZSBzY2hlbWEuXHJcbiAgICpcclxuICAgKiAqKk5vdGU6KiogdGhpcyBpcyBhIHNjaGVtYSBpbiB0aGUgW3Bvc3RncmVzIHNlbnNlIG9mIHRoZSB3b3JkXShodHRwOi8vd3d3LnBvc3RncmVzcWwub3JnL2RvY3MvOS4xL3N0YXRpYy9kZGwtc2NoZW1hcy5odG1sKSxcclxuICAgKiBub3QgYSBkYXRhYmFzZSB0YWJsZS4gSW4gbXlzcWwgYW5kIHNxbGl0ZSwgdGhpcyBjb21tYW5kIHdpbGwgZG8gbm90aGluZy5cclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgTW9kZWwuc2NoZW1hfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNjaGVtYSBOYW1lIG9mIHRoZSBzY2hlbWFcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIHF1ZXJ5IG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW58RnVuY3Rpb259IFtvcHRpb25zLmxvZ2dpbmddIEEgZnVuY3Rpb24gdGhhdCBsb2dzIHNxbCBxdWVyaWVzLCBvciBmYWxzZSBmb3Igbm8gbG9nZ2luZ1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgY3JlYXRlU2NoZW1hKHNjaGVtYSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UXVlcnlJbnRlcmZhY2UoKS5jcmVhdGVTY2hlbWEoc2NoZW1hLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNob3cgYWxsIGRlZmluZWQgc2NoZW1hc1xyXG4gICAqXHJcbiAgICogKipOb3RlOioqIHRoaXMgaXMgYSBzY2hlbWEgaW4gdGhlIFtwb3N0Z3JlcyBzZW5zZSBvZiB0aGUgd29yZF0oaHR0cDovL3d3dy5wb3N0Z3Jlc3FsLm9yZy9kb2NzLzkuMS9zdGF0aWMvZGRsLXNjaGVtYXMuaHRtbCksXHJcbiAgICogbm90IGEgZGF0YWJhc2UgdGFibGUuIEluIG15c3FsIGFuZCBzcWxpdGUsIHRoaXMgd2lsbCBzaG93IGFsbCB0YWJsZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIHF1ZXJ5IG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW58RnVuY3Rpb259IFtvcHRpb25zLmxvZ2dpbmddIEEgZnVuY3Rpb24gdGhhdCBsb2dzIHNxbCBxdWVyaWVzLCBvciBmYWxzZSBmb3Igbm8gbG9nZ2luZ1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgc2hvd0FsbFNjaGVtYXMob3B0aW9ucykge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UXVlcnlJbnRlcmZhY2UoKS5zaG93QWxsU2NoZW1hcyhvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERyb3AgYSBzaW5nbGUgc2NoZW1hXHJcbiAgICpcclxuICAgKiAqKk5vdGU6KiogdGhpcyBpcyBhIHNjaGVtYSBpbiB0aGUgW3Bvc3RncmVzIHNlbnNlIG9mIHRoZSB3b3JkXShodHRwOi8vd3d3LnBvc3RncmVzcWwub3JnL2RvY3MvOS4xL3N0YXRpYy9kZGwtc2NoZW1hcy5odG1sKSxcclxuICAgKiBub3QgYSBkYXRhYmFzZSB0YWJsZS4gSW4gbXlzcWwgYW5kIHNxbGl0ZSwgdGhpcyBkcm9wIGEgdGFibGUgbWF0Y2hpbmcgdGhlIHNjaGVtYSBuYW1lXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NoZW1hIE5hbWUgb2YgdGhlIHNjaGVtYVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gcXVlcnkgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbnxGdW5jdGlvbn0gW29wdGlvbnMubG9nZ2luZ10gQSBmdW5jdGlvbiB0aGF0IGxvZ3Mgc3FsIHF1ZXJpZXMsIG9yIGZhbHNlIGZvciBubyBsb2dnaW5nXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBkcm9wU2NoZW1hKHNjaGVtYSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UXVlcnlJbnRlcmZhY2UoKS5kcm9wU2NoZW1hKHNjaGVtYSwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcm9wIGFsbCBzY2hlbWFzLlxyXG4gICAqXHJcbiAgICogKipOb3RlOioqIHRoaXMgaXMgYSBzY2hlbWEgaW4gdGhlIFtwb3N0Z3JlcyBzZW5zZSBvZiB0aGUgd29yZF0oaHR0cDovL3d3dy5wb3N0Z3Jlc3FsLm9yZy9kb2NzLzkuMS9zdGF0aWMvZGRsLXNjaGVtYXMuaHRtbCksXHJcbiAgICogbm90IGEgZGF0YWJhc2UgdGFibGUuIEluIG15c3FsIGFuZCBzcWxpdGUsIHRoaXMgaXMgdGhlIGVxdWl2YWxlbnQgb2YgZHJvcCBhbGwgdGFibGVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBxdWVyeSBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nXSBBIGZ1bmN0aW9uIHRoYXQgbG9ncyBzcWwgcXVlcmllcywgb3IgZmFsc2UgZm9yIG5vIGxvZ2dpbmdcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGRyb3BBbGxTY2hlbWFzKG9wdGlvbnMpIHtcclxuICAgIHJldHVybiB0aGlzLmdldFF1ZXJ5SW50ZXJmYWNlKCkuZHJvcEFsbFNjaGVtYXMob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTeW5jIGFsbCBkZWZpbmVkIG1vZGVscyB0byB0aGUgREIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIHN5bmMgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuZm9yY2U9ZmFsc2VdIElmIGZvcmNlIGlzIHRydWUsIGVhY2ggTW9kZWwgd2lsbCBydW4gYERST1AgVEFCTEUgSUYgRVhJU1RTYCwgYmVmb3JlIGl0IHRyaWVzIHRvIGNyZWF0ZSBpdHMgb3duIHRhYmxlXHJcbiAgICogQHBhcmFtIHtSZWdFeHB9IFtvcHRpb25zLm1hdGNoXSBNYXRjaCBhIHJlZ2V4IGFnYWluc3QgdGhlIGRhdGFiYXNlIG5hbWUgYmVmb3JlIHN5bmNpbmcsIGEgc2FmZXR5IGNoZWNrIGZvciBjYXNlcyB3aGVyZSBmb3JjZTogdHJ1ZSBpcyB1c2VkIGluIHRlc3RzIGJ1dCBub3QgbGl2ZSBjb2RlXHJcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nPWNvbnNvbGUubG9nXSBBIGZ1bmN0aW9uIHRoYXQgbG9ncyBzcWwgcXVlcmllcywgb3IgZmFsc2UgZm9yIG5vIGxvZ2dpbmdcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2NoZW1hPSdwdWJsaWMnXSBUaGUgc2NoZW1hIHRoYXQgdGhlIHRhYmxlcyBzaG91bGQgYmUgY3JlYXRlZCBpbi4gVGhpcyBjYW4gYmUgb3ZlcnJpZGRlbiBmb3IgZWFjaCB0YWJsZSBpbiBzZXF1ZWxpemUuZGVmaW5lXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNlYXJjaFBhdGg9REVGQVVMVF0gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmhvb2tzPXRydWVdIElmIGhvb2tzIGlzIHRydWUgdGhlbiBiZWZvcmVTeW5jLCBhZnRlclN5bmMsIGJlZm9yZUJ1bGtTeW5jLCBhZnRlckJ1bGtTeW5jIGhvb2tzIHdpbGwgYmUgY2FsbGVkXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5hbHRlcj1mYWxzZV0gQWx0ZXJzIHRhYmxlcyB0byBmaXQgbW9kZWxzLiBOb3QgcmVjb21tZW5kZWQgZm9yIHByb2R1Y3Rpb24gdXNlLiBEZWxldGVzIGRhdGEgaW4gY29sdW1ucyB0aGF0IHdlcmUgcmVtb3ZlZCBvciBoYWQgdGhlaXIgdHlwZSBjaGFuZ2VkIGluIHRoZSBtb2RlbC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIHN5bmMob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucykgfHwge307XHJcbiAgICBvcHRpb25zLmhvb2tzID0gb3B0aW9ucy5ob29rcyA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6ICEhb3B0aW9ucy5ob29rcztcclxuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKG9wdGlvbnMsIHRoaXMub3B0aW9ucy5zeW5jLCB0aGlzLm9wdGlvbnMpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLm1hdGNoKSB7XHJcbiAgICAgIGlmICghb3B0aW9ucy5tYXRjaC50ZXN0KHRoaXMuY29uZmlnLmRhdGFiYXNlKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcclxuICAgICAgICAgIG5ldyBFcnJvcihcclxuICAgICAgICAgICAgYERhdGFiYXNlIFwiJHt0aGlzLmNvbmZpZy5kYXRhYmFzZX1cIiBkb2VzIG5vdCBtYXRjaCBzeW5jIG1hdGNoIHBhcmFtZXRlciBcIiR7b3B0aW9ucy5tYXRjaH1cImBcclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcclxuICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcyhcImJlZm9yZUJ1bGtTeW5jXCIsIG9wdGlvbnMpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZm9yY2UpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmRyb3Aob3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgbW9kZWxzID0gW107XHJcblxyXG4gICAgICAgIC8vIFRvcG9sb2dpY2FsbHkgc29ydCBieSBmb3JlaWduIGtleSBjb25zdHJhaW50cyB0byBnaXZlIHVzIGFuIGFwcHJvcHJpYXRlXHJcbiAgICAgICAgLy8gY3JlYXRpb24gb3JkZXJcclxuICAgICAgICB0aGlzLm1vZGVsTWFuYWdlci5mb3JFYWNoTW9kZWwobW9kZWwgPT4ge1xyXG4gICAgICAgICAgaWYgKG1vZGVsKSB7XHJcbiAgICAgICAgICAgIG1vZGVscy5wdXNoKG1vZGVsKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIERCIHNob3VsZCB0aHJvdyBhbiBTUUwgZXJyb3IgaWYgcmVmZXJlbmNpbmcgbm9uLWV4aXN0ZW50IHRhYmxlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIG5vIG1vZGVscyBkZWZpbmVkLCBqdXN0IGF1dGhlbnRpY2F0ZVxyXG4gICAgICAgIGlmICghbW9kZWxzLmxlbmd0aCkgcmV0dXJuIHRoaXMuYXV0aGVudGljYXRlKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5lYWNoKG1vZGVscywgbW9kZWwgPT4gbW9kZWwuc3luYyhvcHRpb25zKSk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBpZiAob3B0aW9ucy5ob29rcykge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoXCJhZnRlckJ1bGtTeW5jXCIsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLnJldHVybih0aGlzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRydW5jYXRlIGFsbCB0YWJsZXMgZGVmaW5lZCB0aHJvdWdoIHRoZSBzZXF1ZWxpemUgbW9kZWxzLlxyXG4gICAqIFRoaXMgaXMgZG9uZSBieSBjYWxsaW5nIGBNb2RlbC50cnVuY2F0ZSgpYCBvbiBlYWNoIG1vZGVsLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBwYXNzZWQgdG8gTW9kZWwuZGVzdHJveSBpbiBhZGRpdGlvbiB0byB0cnVuY2F0ZVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbnxGdW5jdGlvbn0gW29wdGlvbnMubG9nZ2luZ10gQSBmdW5jdGlvbiB0aGF0IGxvZ3Mgc3FsIHF1ZXJpZXMsIG9yIGZhbHNlIGZvciBubyBsb2dnaW5nXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLnRydW5jYXRlfSBmb3IgbW9yZSBpbmZvcm1hdGlvblxyXG4gICAqL1xyXG4gIHRydW5jYXRlKG9wdGlvbnMpIHtcclxuICAgIGNvbnN0IG1vZGVscyA9IFtdO1xyXG5cclxuICAgIHRoaXMubW9kZWxNYW5hZ2VyLmZvckVhY2hNb2RlbChcclxuICAgICAgbW9kZWwgPT4ge1xyXG4gICAgICAgIGlmIChtb2RlbCkge1xyXG4gICAgICAgICAgbW9kZWxzLnB1c2gobW9kZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgeyByZXZlcnNlOiBmYWxzZSB9XHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IHRydW5jYXRlTW9kZWwgPSBtb2RlbCA9PiBtb2RlbC50cnVuY2F0ZShvcHRpb25zKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmNhc2NhZGUpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UuZWFjaChtb2RlbHMsIHRydW5jYXRlTW9kZWwpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UubWFwKG1vZGVscywgdHJ1bmNhdGVNb2RlbCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcm9wIGFsbCB0YWJsZXMgZGVmaW5lZCB0aHJvdWdoIHRoaXMgc2VxdWVsaXplIGluc3RhbmNlLlxyXG4gICAqIFRoaXMgaXMgZG9uZSBieSBjYWxsaW5nIE1vZGVsLmRyb3Agb24gZWFjaCBtb2RlbC5cclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgTW9kZWwuZHJvcH0gZm9yIG9wdGlvbnNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgcGFzc2VkIHRvIGVhY2ggY2FsbCB0byBNb2RlbC5kcm9wXHJcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nXSBBIGZ1bmN0aW9uIHRoYXQgbG9ncyBzcWwgcXVlcmllcywgb3IgZmFsc2UgZm9yIG5vIGxvZ2dpbmdcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGRyb3Aob3B0aW9ucykge1xyXG4gICAgY29uc3QgbW9kZWxzID0gW107XHJcblxyXG4gICAgdGhpcy5tb2RlbE1hbmFnZXIuZm9yRWFjaE1vZGVsKFxyXG4gICAgICBtb2RlbCA9PiB7XHJcbiAgICAgICAgaWYgKG1vZGVsKSB7XHJcbiAgICAgICAgICBtb2RlbHMucHVzaChtb2RlbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB7IHJldmVyc2U6IGZhbHNlIH1cclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UuZWFjaChtb2RlbHMsIG1vZGVsID0+IG1vZGVsLmRyb3Aob3B0aW9ucykpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGVzdCB0aGUgY29ubmVjdGlvbiBieSB0cnlpbmcgdG8gYXV0aGVudGljYXRlLiBJdCBydW5zIGBTRUxFQ1QgMSsxIEFTIHJlc3VsdGAgcXVlcnkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIHF1ZXJ5IG9wdGlvbnNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGF1dGhlbnRpY2F0ZShvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcclxuICAgICAge1xyXG4gICAgICAgIHJhdzogdHJ1ZSxcclxuICAgICAgICBwbGFpbjogdHJ1ZSxcclxuICAgICAgICB0eXBlOiBRdWVyeVR5cGVzLlNFTEVDVFxyXG4gICAgICB9LFxyXG4gICAgICBvcHRpb25zXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KFwiU0VMRUNUIDErMSBBUyByZXN1bHRcIiwgb3B0aW9ucykucmV0dXJuKCk7XHJcbiAgfVxyXG5cclxuICBkYXRhYmFzZVZlcnNpb24ob3B0aW9ucykge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0UXVlcnlJbnRlcmZhY2UoKS5kYXRhYmFzZVZlcnNpb24ob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIGZuIGZvciByYW5kb20gYmFzZWQgb24gdGhlIGRpYWxlY3RcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtTZXF1ZWxpemUuZm59XHJcbiAgICovXHJcbiAgcmFuZG9tKCkge1xyXG4gICAgY29uc3QgZGlhID0gdGhpcy5nZXREaWFsZWN0KCk7XHJcbiAgICBpZiAoZGlhID09PSBcInBvc3RncmVzXCIgfHwgZGlhID09PSBcInNxbGl0ZVwiKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmZuKFwiUkFORE9NXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuZm4oXCJSQU5EXCIpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBvYmplY3QgcmVwcmVzZW50aW5nIGEgZGF0YWJhc2UgZnVuY3Rpb24uIFRoaXMgY2FuIGJlIHVzZWQgaW4gc2VhcmNoIHF1ZXJpZXMsIGJvdGggaW4gd2hlcmUgYW5kIG9yZGVyIHBhcnRzLCBhbmQgYXMgZGVmYXVsdCB2YWx1ZXMgaW4gY29sdW1uIGRlZmluaXRpb25zLlxyXG4gICAqIElmIHlvdSB3YW50IHRvIHJlZmVyIHRvIGNvbHVtbnMgaW4geW91ciBmdW5jdGlvbiwgeW91IHNob3VsZCB1c2UgYHNlcXVlbGl6ZS5jb2xgLCBzbyB0aGF0IHRoZSBjb2x1bW5zIGFyZSBwcm9wZXJseSBpbnRlcnByZXRlZCBhcyBjb2x1bW5zIGFuZCBub3QgYSBzdHJpbmdzLlxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbC5maW5kQWxsfVxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgU2VxdWVsaXplLmRlZmluZX1cclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIFNlcXVlbGl6ZS5jb2x9XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZm4gVGhlIGZ1bmN0aW9uIHlvdSB3YW50IHRvIGNhbGxcclxuICAgKiBAcGFyYW0ge2FueX0gYXJncyBBbGwgZnVydGhlciBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgYXMgYXJndW1lbnRzIHRvIHRoZSBmdW5jdGlvblxyXG4gICAqXHJcbiAgICogQHNpbmNlIHYyLjAuMC1kZXYzXHJcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxyXG4gICAqIEByZXR1cm5zIHtTZXF1ZWxpemUuZm59XHJcbiAgICpcclxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5Db252ZXJ0IGEgdXNlcidzIHVzZXJuYW1lIHRvIHVwcGVyIGNhc2U8L2NhcHRpb24+XHJcbiAgICogaW5zdGFuY2UudXBkYXRlKHtcclxuICAgKiAgIHVzZXJuYW1lOiBzZXF1ZWxpemUuZm4oJ3VwcGVyJywgc2VxdWVsaXplLmNvbCgndXNlcm5hbWUnKSlcclxuICAgKiB9KTtcclxuICAgKi9cclxuICBzdGF0aWMgZm4oZm4sIC4uLmFyZ3MpIHtcclxuICAgIHJldHVybiBuZXcgVXRpbHMuRm4oZm4sIGFyZ3MpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhbiBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhIGNvbHVtbiBpbiB0aGUgREIsIHRoaXMgYWxsb3dzIHJlZmVyZW5jaW5nIGFub3RoZXIgY29sdW1uIGluIHlvdXIgcXVlcnkuIFRoaXMgaXMgb2Z0ZW4gdXNlZnVsIGluIGNvbmp1bmN0aW9uIHdpdGggYHNlcXVlbGl6ZS5mbmAsIHNpbmNlIHJhdyBzdHJpbmcgYXJndW1lbnRzIHRvIGZuIHdpbGwgYmUgZXNjYXBlZC5cclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgU2VxdWVsaXplI2ZufVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbCBUaGUgbmFtZSBvZiB0aGUgY29sdW1uXHJcbiAgICogQHNpbmNlIHYyLjAuMC1kZXYzXHJcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1NlcXVlbGl6ZS5jb2x9XHJcbiAgICovXHJcbiAgc3RhdGljIGNvbChjb2wpIHtcclxuICAgIHJldHVybiBuZXcgVXRpbHMuQ29sKGNvbCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGFuIG9iamVjdCByZXByZXNlbnRpbmcgYSBjYWxsIHRvIHRoZSBjYXN0IGZ1bmN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHthbnl9IHZhbCBUaGUgdmFsdWUgdG8gY2FzdFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIFRoZSB0eXBlIHRvIGNhc3QgaXQgdG9cclxuICAgKiBAc2luY2UgdjIuMC4wLWRldjNcclxuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7U2VxdWVsaXplLmNhc3R9XHJcbiAgICovXHJcbiAgc3RhdGljIGNhc3QodmFsLCB0eXBlKSB7XHJcbiAgICByZXR1cm4gbmV3IFV0aWxzLkNhc3QodmFsLCB0eXBlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gb2JqZWN0IHJlcHJlc2VudGluZyBhIGxpdGVyYWwsIGkuZS4gc29tZXRoaW5nIHRoYXQgd2lsbCBub3QgYmUgZXNjYXBlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7YW55fSB2YWwgbGl0ZXJhbCB2YWx1ZVxyXG4gICAqIEBzaW5jZSB2Mi4wLjAtZGV2M1xyXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtTZXF1ZWxpemUubGl0ZXJhbH1cclxuICAgKi9cclxuICBzdGF0aWMgbGl0ZXJhbCh2YWwpIHtcclxuICAgIHJldHVybiBuZXcgVXRpbHMuTGl0ZXJhbCh2YWwpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQW4gQU5EIHF1ZXJ5XHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9XHJcbiAgICpcclxuICAgKiBAcGFyYW0gey4uLnN0cmluZ3xPYmplY3R9IGFyZ3MgRWFjaCBhcmd1bWVudCB3aWxsIGJlIGpvaW5lZCBieSBBTkRcclxuICAgKiBAc2luY2UgdjIuMC4wLWRldjNcclxuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7U2VxdWVsaXplLmFuZH1cclxuICAgKi9cclxuICBzdGF0aWMgYW5kKC4uLmFyZ3MpIHtcclxuICAgIHJldHVybiB7IFtPcC5hbmRdOiBhcmdzIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBbiBPUiBxdWVyeVxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbC5maW5kQWxsfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHsuLi5zdHJpbmd8T2JqZWN0fSBhcmdzIEVhY2ggYXJndW1lbnQgd2lsbCBiZSBqb2luZWQgYnkgT1JcclxuICAgKiBAc2luY2UgdjIuMC4wLWRldjNcclxuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7U2VxdWVsaXplLm9yfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBvciguLi5hcmdzKSB7XHJcbiAgICByZXR1cm4geyBbT3Aub3JdOiBhcmdzIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGFuIG9iamVjdCByZXByZXNlbnRpbmcgbmVzdGVkIHdoZXJlIGNvbmRpdGlvbnMgZm9yIHBvc3RncmVzL3NxbGl0ZS9teXNxbCBqc29uIGRhdGEtdHlwZS5cclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgTW9kZWwuZmluZEFsbH1cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gY29uZGl0aW9uc09yUGF0aCBBIGhhc2ggY29udGFpbmluZyBzdHJpbmdzL251bWJlcnMgb3Igb3RoZXIgbmVzdGVkIGhhc2gsIGEgc3RyaW5nIHVzaW5nIGRvdCBub3RhdGlvbiBvciBhIHN0cmluZyB1c2luZyBwb3N0Z3Jlcy9zcWxpdGUvbXlzcWwganNvbiBzeW50YXguXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfGJvb2xlYW59IFt2YWx1ZV0gQW4gb3B0aW9uYWwgdmFsdWUgdG8gY29tcGFyZSBhZ2FpbnN0LiBQcm9kdWNlcyBhIHN0cmluZyBvZiB0aGUgZm9ybSBcIjxqc29uIHBhdGg+ID0gJzx2YWx1ZT4nXCIuXHJcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1NlcXVlbGl6ZS5qc29ufVxyXG4gICAqL1xyXG4gIHN0YXRpYyBqc29uKGNvbmRpdGlvbnNPclBhdGgsIHZhbHVlKSB7XHJcbiAgICByZXR1cm4gbmV3IFV0aWxzLkpzb24oY29uZGl0aW9uc09yUGF0aCwgdmFsdWUpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQSB3YXkgb2Ygc3BlY2lmeWluZyBhdHRyID0gY29uZGl0aW9uLlxyXG4gICAqXHJcbiAgICogVGhlIGF0dHIgY2FuIGVpdGhlciBiZSBhbiBvYmplY3QgdGFrZW4gZnJvbSBgTW9kZWwucmF3QXR0cmlidXRlc2AgKGZvciBleGFtcGxlIGBNb2RlbC5yYXdBdHRyaWJ1dGVzLmlkYCBvciBgTW9kZWwucmF3QXR0cmlidXRlcy5uYW1lYCkuIFRoZVxyXG4gICAqIGF0dHJpYnV0ZSBzaG91bGQgYmUgZGVmaW5lZCBpbiB5b3VyIG1vZGVsIGRlZmluaXRpb24uIFRoZSBhdHRyaWJ1dGUgY2FuIGFsc28gYmUgYW4gb2JqZWN0IGZyb20gb25lIG9mIHRoZSBzZXF1ZWxpemUgdXRpbGl0eSBmdW5jdGlvbnMgKGBzZXF1ZWxpemUuZm5gLCBgc2VxdWVsaXplLmNvbGAgZXRjLilcclxuICAgKlxyXG4gICAqIEZvciBzdHJpbmcgYXR0cmlidXRlcywgdXNlIHRoZSByZWd1bGFyIGB7IHdoZXJlOiB7IGF0dHI6IHNvbWV0aGluZyB9fWAgc3ludGF4LiBJZiB5b3UgZG9uJ3Qgd2FudCB5b3VyIHN0cmluZyB0byBiZSBlc2NhcGVkLCB1c2UgYHNlcXVlbGl6ZS5saXRlcmFsYC5cclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgTW9kZWwuZmluZEFsbH1cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyIFRoZSBhdHRyaWJ1dGUsIHdoaWNoIGNhbiBiZSBlaXRoZXIgYW4gYXR0cmlidXRlIG9iamVjdCBmcm9tIGBNb2RlbC5yYXdBdHRyaWJ1dGVzYCBvciBhIHNlcXVlbGl6ZSBvYmplY3QsIGZvciBleGFtcGxlIGFuIGluc3RhbmNlIG9mIGBzZXF1ZWxpemUuZm5gLiBGb3Igc2ltcGxlIHN0cmluZyBhdHRyaWJ1dGVzLCB1c2UgdGhlIFBPSk8gc3ludGF4XHJcbiAgICogQHBhcmFtIHtTeW1ib2x9IFtjb21wYXJhdG9yPSdPcC5lcSddIG9wZXJhdG9yXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSBsb2dpYyBUaGUgY29uZGl0aW9uLiBDYW4gYmUgYm90aCBhIHNpbXBseSB0eXBlLCBvciBhIGZ1cnRoZXIgY29uZGl0aW9uIChgb3JgLCBgYW5kYCwgYC5saXRlcmFsYCBldGMuKVxyXG4gICAqIEBzaW5jZSB2Mi4wLjAtZGV2M1xyXG4gICAqL1xyXG4gIHN0YXRpYyB3aGVyZShhdHRyLCBjb21wYXJhdG9yLCBsb2dpYykge1xyXG4gICAgcmV0dXJuIG5ldyBVdGlscy5XaGVyZShhdHRyLCBjb21wYXJhdG9yLCBsb2dpYyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTdGFydCBhIHRyYW5zYWN0aW9uLiBXaGVuIHVzaW5nIHRyYW5zYWN0aW9ucywgeW91IHNob3VsZCBwYXNzIHRoZSB0cmFuc2FjdGlvbiBpbiB0aGUgb3B0aW9ucyBhcmd1bWVudCBpbiBvcmRlciBmb3IgdGhlIHF1ZXJ5IHRvIGhhcHBlbiB1bmRlciB0aGF0IHRyYW5zYWN0aW9uIEBzZWUge0BsaW5rIFRyYW5zYWN0aW9ufVxyXG4gICAqXHJcbiAgICogSWYgeW91IGhhdmUgW0NMU10oaHR0cHM6Ly9naXRodWIuY29tL290aGl5bTIzL25vZGUtY29udGludWF0aW9uLWxvY2FsLXN0b3JhZ2UpIGVuYWJsZWQsIHRoZSB0cmFuc2FjdGlvbiB3aWxsIGF1dG9tYXRpY2FsbHkgYmUgcGFzc2VkIHRvIGFueSBxdWVyeSB0aGF0IHJ1bnMgd2l0aGluIHRoZSBjYWxsYmFja1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiBzZXF1ZWxpemUudHJhbnNhY3Rpb24oKS50aGVuKHRyYW5zYWN0aW9uID0+IHtcclxuICAgKiAgIHJldHVybiBVc2VyLmZpbmRPbmUoLi4uLCB7dHJhbnNhY3Rpb259KVxyXG4gICAqICAgICAudGhlbih1c2VyID0+IHVzZXIudXBkYXRlKC4uLiwge3RyYW5zYWN0aW9ufSkpXHJcbiAgICogICAgIC50aGVuKCgpID0+IHRyYW5zYWN0aW9uLmNvbW1pdCgpKVxyXG4gICAqICAgICAuY2F0Y2goKCkgPT4gdHJhbnNhY3Rpb24ucm9sbGJhY2soKSk7XHJcbiAgICogfSlcclxuICAgKlxyXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPkEgc3ludGF4IGZvciBhdXRvbWF0aWNhbGx5IGNvbW1pdHRpbmcgb3Igcm9sbGluZyBiYWNrIGJhc2VkIG9uIHRoZSBwcm9taXNlIGNoYWluIHJlc29sdXRpb24gaXMgYWxzbyBzdXBwb3J0ZWQ8L2NhcHRpb24+XHJcbiAgICpcclxuICAgKiBzZXF1ZWxpemUudHJhbnNhY3Rpb24odHJhbnNhY3Rpb24gPT4geyAvLyBOb3RlIHRoYXQgd2UgdXNlIGEgY2FsbGJhY2sgcmF0aGVyIHRoYW4gYSBwcm9taXNlLnRoZW4oKVxyXG4gICAqICAgcmV0dXJuIFVzZXIuZmluZE9uZSguLi4sIHt0cmFuc2FjdGlvbn0pXHJcbiAgICogICAgIC50aGVuKHVzZXIgPT4gdXNlci51cGRhdGUoLi4uLCB7dHJhbnNhY3Rpb259KSlcclxuICAgKiB9KS50aGVuKCgpID0+IHtcclxuICAgKiAgIC8vIENvbW1pdHRlZFxyXG4gICAqIH0pLmNhdGNoKGVyciA9PiB7XHJcbiAgICogICAvLyBSb2xsZWQgYmFja1xyXG4gICAqICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gICAqIH0pO1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+VG8gZW5hYmxlIENMUywgYWRkIGl0IGRvIHlvdXIgcHJvamVjdCwgY3JlYXRlIGEgbmFtZXNwYWNlIGFuZCBzZXQgaXQgb24gdGhlIHNlcXVlbGl6ZSBjb25zdHJ1Y3Rvcjo8L2NhcHRpb24+XHJcbiAgICpcclxuICAgKiBjb25zdCBjbHMgPSByZXF1aXJlKCdjb250aW51YXRpb24tbG9jYWwtc3RvcmFnZScpO1xyXG4gICAqIGNvbnN0IG5zID0gY2xzLmNyZWF0ZU5hbWVzcGFjZSgnLi4uLicpO1xyXG4gICAqIGNvbnN0IFNlcXVlbGl6ZSA9IHJlcXVpcmUoJ3NlcXVlbGl6ZScpO1xyXG4gICAqIFNlcXVlbGl6ZS51c2VDTFMobnMpO1xyXG4gICAqXHJcbiAgICogLy8gTm90ZSwgdGhhdCBDTFMgaXMgZW5hYmxlZCBmb3IgYWxsIHNlcXVlbGl6ZSBpbnN0YW5jZXMsIGFuZCBhbGwgaW5zdGFuY2VzIHdpbGwgc2hhcmUgdGhlIHNhbWUgbmFtZXNwYWNlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9uc10gVHJhbnNhY3Rpb24gb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLnR5cGU9J0RFRkVSUkVEJ10gU2VlIGBTZXF1ZWxpemUuVHJhbnNhY3Rpb24uVFlQRVNgIGZvciBwb3NzaWJsZSBvcHRpb25zLiBTcWxpdGUgb25seS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5pc29sYXRpb25MZXZlbF0gU2VlIGBTZXF1ZWxpemUuVHJhbnNhY3Rpb24uSVNPTEFUSU9OX0xFVkVMU2AgZm9yIHBvc3NpYmxlIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5kZWZlcnJhYmxlXSBTZXRzIHRoZSBjb25zdHJhaW50cyB0byBiZSBkZWZlcnJlZCBvciBpbW1lZGlhdGVseSBjaGVja2VkLiBTZWUgYFNlcXVlbGl6ZS5EZWZlcnJhYmxlYC4gUG9zdGdyZVNRTCBPbmx5XHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2F1dG9DYWxsYmFja10gVGhlIGNhbGxiYWNrIGlzIGNhbGxlZCB3aXRoIHRoZSB0cmFuc2FjdGlvbiBvYmplY3QsIGFuZCBzaG91bGQgcmV0dXJuIGEgcHJvbWlzZS4gSWYgdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQsIHRoZSB0cmFuc2FjdGlvbiBjb21taXRzOyBpZiB0aGUgcHJvbWlzZSByZWplY3RzLCB0aGUgdHJhbnNhY3Rpb24gcm9sbHMgYmFja1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgdHJhbnNhY3Rpb24ob3B0aW9ucywgYXV0b0NhbGxiYWNrKSB7XHJcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICBhdXRvQ2FsbGJhY2sgPSBvcHRpb25zO1xyXG4gICAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKHRoaXMsIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmICghYXV0b0NhbGxiYWNrKVxyXG4gICAgICByZXR1cm4gdHJhbnNhY3Rpb24ucHJlcGFyZUVudmlyb25tZW50KGZhbHNlKS5yZXR1cm4odHJhbnNhY3Rpb24pO1xyXG5cclxuICAgIC8vIGF1dG9DYWxsYmFjayBwcm92aWRlZFxyXG4gICAgcmV0dXJuIFNlcXVlbGl6ZS5fY2xzUnVuKCgpID0+IHtcclxuICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uXHJcbiAgICAgICAgLnByZXBhcmVFbnZpcm9ubWVudCgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gYXV0b0NhbGxiYWNrKHRyYW5zYWN0aW9uKSlcclxuICAgICAgICAudGFwKCgpID0+IHRyYW5zYWN0aW9uLmNvbW1pdCgpKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgLy8gUm9sbGJhY2sgdHJhbnNhY3Rpb24gaWYgbm90IGFscmVhZHkgZmluaXNoZWQgKGNvbW1pdCwgcm9sbGJhY2ssIGV0YylcclxuICAgICAgICAgIC8vIGFuZCByZWplY3Qgd2l0aCBvcmlnaW5hbCBlcnJvciAoaWdub3JlIGFueSBlcnJvciBpbiByb2xsYmFjaylcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghdHJhbnNhY3Rpb24uZmluaXNoZWQpXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uLnJvbGxiYWNrKCkuY2F0Y2goKCkgPT4ge30pO1xyXG4gICAgICAgICAgfSkudGhyb3coZXJyKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlIENMUyB3aXRoIFNlcXVlbGl6ZS5cclxuICAgKiBDTFMgbmFtZXNwYWNlIHByb3ZpZGVkIGlzIHN0b3JlZCBhcyBgU2VxdWVsaXplLl9jbHNgXHJcbiAgICogYW5kIGJsdWViaXJkIFByb21pc2UgaXMgcGF0Y2hlZCB0byB1c2UgdGhlIG5hbWVzcGFjZSwgdXNpbmcgYGNscy1ibHVlYmlyZGAgbW9kdWxlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG5zIENMUyBuYW1lc3BhY2VcclxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBTZXF1ZWxpemUgY29uc3RydWN0b3JcclxuICAgKi9cclxuICBzdGF0aWMgdXNlQ0xTKG5zKSB7XHJcbiAgICAvLyBjaGVjayBgbnNgIGlzIHZhbGlkIENMUyBuYW1lc3BhY2VcclxuICAgIGlmIChcclxuICAgICAgIW5zIHx8XHJcbiAgICAgIHR5cGVvZiBucyAhPT0gXCJvYmplY3RcIiB8fFxyXG4gICAgICB0eXBlb2YgbnMuYmluZCAhPT0gXCJmdW5jdGlvblwiIHx8XHJcbiAgICAgIHR5cGVvZiBucy5ydW4gIT09IFwiZnVuY3Rpb25cIlxyXG4gICAgKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgQ0xTIG5hbWVzcGFjZVwiKTtcclxuXHJcbiAgICAvLyBzYXZlIG5hbWVzcGFjZSBhcyBgU2VxdWVsaXplLl9jbHNgXHJcbiAgICB0aGlzLl9jbHMgPSBucztcclxuXHJcbiAgICAvLyBwYXRjaCBibHVlYmlyZCB0byBiaW5kIGFsbCBwcm9taXNlIGNhbGxiYWNrcyB0byBDTFMgbmFtZXNwYWNlXHJcbiAgICBjbHNCbHVlYmlyZChucywgUHJvbWlzZSk7XHJcblxyXG4gICAgLy8gcmV0dXJuIFNlcXVlbGl6ZSBmb3IgY2hhaW5pbmdcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUnVuIGZ1bmN0aW9uIGluIENMUyBjb250ZXh0LlxyXG4gICAqIElmIG5vIENMUyBjb250ZXh0IGluIHVzZSwganVzdCBydW5zIHRoZSBmdW5jdGlvbiBub3JtYWxseVxyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBydW5cclxuICAgKiBAcmV0dXJucyB7Kn0gUmV0dXJuIHZhbHVlIG9mIGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgc3RhdGljIF9jbHNSdW4oZm4pIHtcclxuICAgIGNvbnN0IG5zID0gU2VxdWVsaXplLl9jbHM7XHJcbiAgICBpZiAoIW5zKSByZXR1cm4gZm4oKTtcclxuXHJcbiAgICBsZXQgcmVzO1xyXG4gICAgbnMucnVuKGNvbnRleHQgPT4gKHJlcyA9IGZuKGNvbnRleHQpKSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG4gIH1cclxuXHJcbiAgbG9nKC4uLmFyZ3MpIHtcclxuICAgIGxldCBvcHRpb25zO1xyXG5cclxuICAgIGNvbnN0IGxhc3QgPSBfLmxhc3QoYXJncyk7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBsYXN0ICYmXHJcbiAgICAgIF8uaXNQbGFpbk9iamVjdChsYXN0KSAmJlxyXG4gICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobGFzdCwgXCJsb2dnaW5nXCIpXHJcbiAgICApIHtcclxuICAgICAgb3B0aW9ucyA9IGxhc3Q7XHJcblxyXG4gICAgICAvLyByZW1vdmUgb3B0aW9ucyBmcm9tIHNldCBvZiBsb2dnZWQgYXJndW1lbnRzIGlmIG9wdGlvbnMubG9nZ2luZyBpcyBlcXVhbCB0byBjb25zb2xlLmxvZ1xyXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgICBpZiAob3B0aW9ucy5sb2dnaW5nID09PSBjb25zb2xlLmxvZykge1xyXG4gICAgICAgIGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSwgMSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubG9nZ2luZykge1xyXG4gICAgICBpZiAob3B0aW9ucy5sb2dnaW5nID09PSB0cnVlKSB7XHJcbiAgICAgICAgZGVwcmVjYXRpb25zLm5vVHJ1ZUxvZ2dpbmcoKTtcclxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgICAgIG9wdGlvbnMubG9nZ2luZyA9IGNvbnNvbGUubG9nO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzZWNvbmQgYXJndW1lbnQgaXMgc3FsLXRpbWluZ3MsIHdoZW4gYmVuY2htYXJraW5nIG9wdGlvbiBlbmFibGVkXHJcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgIGlmIChcclxuICAgICAgICAodGhpcy5vcHRpb25zLmJlbmNobWFyayB8fCBvcHRpb25zLmJlbmNobWFyaykgJiZcclxuICAgICAgICBvcHRpb25zLmxvZ2dpbmcgPT09IGNvbnNvbGUubG9nXHJcbiAgICAgICkge1xyXG4gICAgICAgIGFyZ3MgPSBbYCR7YXJnc1swXX0gRWxhcHNlZCB0aW1lOiAke2FyZ3NbMV19bXNgXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgb3B0aW9ucy5sb2dnaW5nKC4uLmFyZ3MpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xvc2UgYWxsIGNvbm5lY3Rpb25zIHVzZWQgYnkgdGhpcyBzZXF1ZWxpemUgaW5zdGFuY2UsIGFuZCBmcmVlIGFsbCByZWZlcmVuY2VzIHNvIHRoZSBpbnN0YW5jZSBjYW4gYmUgZ2FyYmFnZSBjb2xsZWN0ZWQuXHJcbiAgICpcclxuICAgKiBOb3JtYWxseSB0aGlzIGlzIGRvbmUgb24gcHJvY2VzcyBleGl0LCBzbyB5b3Ugb25seSBuZWVkIHRvIGNhbGwgdGhpcyBtZXRob2QgaWYgeW91IGFyZSBjcmVhdGluZyBtdWx0aXBsZSBpbnN0YW5jZXMsIGFuZCB3YW50XHJcbiAgICogdG8gZ2FyYmFnZSBjb2xsZWN0IHNvbWUgb2YgdGhlbS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGNsb3NlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIuY2xvc2UoKTtcclxuICB9XHJcblxyXG4gIG5vcm1hbGl6ZURhdGFUeXBlKFR5cGUpIHtcclxuICAgIGxldCB0eXBlID0gdHlwZW9mIFR5cGUgPT09IFwiZnVuY3Rpb25cIiA/IG5ldyBUeXBlKCkgOiBUeXBlO1xyXG4gICAgY29uc3QgZGlhbGVjdFR5cGVzID0gdGhpcy5kaWFsZWN0LkRhdGFUeXBlcyB8fCB7fTtcclxuXHJcbiAgICBpZiAoZGlhbGVjdFR5cGVzW3R5cGUua2V5XSkge1xyXG4gICAgICB0eXBlID0gZGlhbGVjdFR5cGVzW3R5cGUua2V5XS5leHRlbmQodHlwZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuQVJSQVkpIHtcclxuICAgICAgaWYgKCF0eXBlLnR5cGUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBUlJBWSBpcyBtaXNzaW5nIHR5cGUgZGVmaW5pdGlvbiBmb3IgaXRzIHZhbHVlcy5cIik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGRpYWxlY3RUeXBlc1t0eXBlLnR5cGUua2V5XSkge1xyXG4gICAgICAgIHR5cGUudHlwZSA9IGRpYWxlY3RUeXBlc1t0eXBlLnR5cGUua2V5XS5leHRlbmQodHlwZS50eXBlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0eXBlO1xyXG4gIH1cclxuXHJcbiAgbm9ybWFsaXplQXR0cmlidXRlKGF0dHJpYnV0ZSkge1xyXG4gICAgaWYgKCFfLmlzUGxhaW5PYmplY3QoYXR0cmlidXRlKSkge1xyXG4gICAgICBhdHRyaWJ1dGUgPSB7IHR5cGU6IGF0dHJpYnV0ZSB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghYXR0cmlidXRlLnR5cGUpIHJldHVybiBhdHRyaWJ1dGU7XHJcblxyXG4gICAgYXR0cmlidXRlLnR5cGUgPSB0aGlzLm5vcm1hbGl6ZURhdGFUeXBlKGF0dHJpYnV0ZS50eXBlKTtcclxuXHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGF0dHJpYnV0ZSwgXCJkZWZhdWx0VmFsdWVcIikpIHtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIHR5cGVvZiBhdHRyaWJ1dGUuZGVmYXVsdFZhbHVlID09PSBcImZ1bmN0aW9uXCIgJiZcclxuICAgICAgICAoYXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA9PT0gRGF0YVR5cGVzLk5PVyB8fFxyXG4gICAgICAgICAgYXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA9PT0gRGF0YVR5cGVzLlVVSURWMSB8fFxyXG4gICAgICAgICAgYXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA9PT0gRGF0YVR5cGVzLlVVSURWNClcclxuICAgICAgKSB7XHJcbiAgICAgICAgYXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA9IG5ldyBhdHRyaWJ1dGUuZGVmYXVsdFZhbHVlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXR0cmlidXRlLnR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuRU5VTSkge1xyXG4gICAgICAvLyBUaGUgRU5VTSBpcyBhIHNwZWNpYWwgY2FzZSB3aGVyZSB0aGUgdHlwZSBpcyBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgdmFsdWVzXHJcbiAgICAgIGlmIChhdHRyaWJ1dGUudmFsdWVzKSB7XHJcbiAgICAgICAgYXR0cmlidXRlLnR5cGUudmFsdWVzID0gYXR0cmlidXRlLnR5cGUub3B0aW9ucy52YWx1ZXMgPVxyXG4gICAgICAgICAgYXR0cmlidXRlLnZhbHVlcztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBhdHRyaWJ1dGUudmFsdWVzID0gYXR0cmlidXRlLnR5cGUudmFsdWVzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWF0dHJpYnV0ZS52YWx1ZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmFsdWVzIGZvciBFTlVNIGhhdmUgbm90IGJlZW4gZGVmaW5lZC5cIik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXR0cmlidXRlO1xyXG4gIH1cclxufVxyXG5cclxuLy8gQWxpYXNlc1xyXG5TZXF1ZWxpemUucHJvdG90eXBlLmZuID0gU2VxdWVsaXplLmZuO1xyXG5TZXF1ZWxpemUucHJvdG90eXBlLmNvbCA9IFNlcXVlbGl6ZS5jb2w7XHJcblNlcXVlbGl6ZS5wcm90b3R5cGUuY2FzdCA9IFNlcXVlbGl6ZS5jYXN0O1xyXG5TZXF1ZWxpemUucHJvdG90eXBlLmxpdGVyYWwgPSBTZXF1ZWxpemUubGl0ZXJhbDtcclxuU2VxdWVsaXplLnByb3RvdHlwZS5hbmQgPSBTZXF1ZWxpemUuYW5kO1xyXG5TZXF1ZWxpemUucHJvdG90eXBlLm9yID0gU2VxdWVsaXplLm9yO1xyXG5TZXF1ZWxpemUucHJvdG90eXBlLmpzb24gPSBTZXF1ZWxpemUuanNvbjtcclxuU2VxdWVsaXplLnByb3RvdHlwZS53aGVyZSA9IFNlcXVlbGl6ZS53aGVyZTtcclxuU2VxdWVsaXplLnByb3RvdHlwZS52YWxpZGF0ZSA9IFNlcXVlbGl6ZS5wcm90b3R5cGUuYXV0aGVudGljYXRlO1xyXG5cclxuLyoqXHJcbiAqIFNlcXVlbGl6ZSB2ZXJzaW9uIG51bWJlci5cclxuICovXHJcblNlcXVlbGl6ZS52ZXJzaW9uID0gcmVxdWlyZShcIi4uL3BhY2thZ2UuanNvblwiKS52ZXJzaW9uO1xyXG5cclxuU2VxdWVsaXplLm9wdGlvbnMgPSB7IGhvb2tzOiB7fSB9O1xyXG5cclxuLyoqXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5TZXF1ZWxpemUuVXRpbHMgPSBVdGlscztcclxuXHJcbi8qKlxyXG4gKiBPcGVyYXRvcnMgc3ltYm9scyB0byBiZSB1c2VkIGZvciBxdWVyeWluZyBkYXRhXHJcbiAqIEBzZWUgIHtAbGluayBPcGVyYXRvcnN9XHJcbiAqL1xyXG5TZXF1ZWxpemUuT3AgPSBPcDtcclxuXHJcbi8qKlxyXG4gKiBBIGhhbmR5IHJlZmVyZW5jZSB0byB0aGUgYmx1ZWJpcmQgUHJvbWlzZSBjbGFzc1xyXG4gKi9cclxuU2VxdWVsaXplLlByb21pc2UgPSBQcm9taXNlO1xyXG5cclxuLyoqXHJcbiAqIEF2YWlsYWJsZSB0YWJsZSBoaW50cyB0byBiZSB1c2VkIGZvciBxdWVyeWluZyBkYXRhIGluIG1zc3FsIGZvciB0YWJsZSBoaW50c1xyXG4gKiBAc2VlIHtAbGluayBUYWJsZUhpbnRzfVxyXG4gKi9cclxuU2VxdWVsaXplLlRhYmxlSGludHMgPSBUYWJsZUhpbnRzO1xyXG5cclxuLyoqXHJcbiAqIEF2YWlsYWJsZSBpbmRleCBoaW50cyB0byBiZSB1c2VkIGZvciBxdWVyeWluZyBkYXRhIGluIG15c3FsIGZvciBpbmRleCBoaW50c1xyXG4gKiBAc2VlIHtAbGluayBJbmRleEhpbnRzfVxyXG4gKi9cclxuU2VxdWVsaXplLkluZGV4SGludHMgPSBJbmRleEhpbnRzO1xyXG5cclxuLyoqXHJcbiAqIEEgcmVmZXJlbmNlIHRvIHRoZSBzZXF1ZWxpemUgdHJhbnNhY3Rpb24gY2xhc3MuIFVzZSB0aGlzIHRvIGFjY2VzcyBpc29sYXRpb25MZXZlbHMgYW5kIHR5cGVzIHdoZW4gY3JlYXRpbmcgYSB0cmFuc2FjdGlvblxyXG4gKiBAc2VlIHtAbGluayBUcmFuc2FjdGlvbn1cclxuICogQHNlZSB7QGxpbmsgU2VxdWVsaXplLnRyYW5zYWN0aW9ufVxyXG4gKi9cclxuU2VxdWVsaXplLlRyYW5zYWN0aW9uID0gVHJhbnNhY3Rpb247XHJcblxyXG4vKipcclxuICogQSByZWZlcmVuY2UgdG8gU2VxdWVsaXplIGNvbnN0cnVjdG9yIGZyb20gc2VxdWVsaXplLiBVc2VmdWwgZm9yIGFjY2Vzc2luZyBEYXRhVHlwZXMsIEVycm9ycyBldGMuXHJcbiAqIEBzZWUge0BsaW5rIFNlcXVlbGl6ZX1cclxuICovXHJcblNlcXVlbGl6ZS5wcm90b3R5cGUuU2VxdWVsaXplID0gU2VxdWVsaXplO1xyXG5cclxuLyoqXHJcbiAqIEF2YWlsYWJsZSBxdWVyeSB0eXBlcyBmb3IgdXNlIHdpdGggYHNlcXVlbGl6ZS5xdWVyeWBcclxuICogQHNlZSB7QGxpbmsgUXVlcnlUeXBlc31cclxuICovXHJcblNlcXVlbGl6ZS5wcm90b3R5cGUuUXVlcnlUeXBlcyA9IFNlcXVlbGl6ZS5RdWVyeVR5cGVzID0gUXVlcnlUeXBlcztcclxuXHJcbi8qKlxyXG4gKiBFeHBvc2VzIHRoZSB2YWxpZGF0b3IuanMgb2JqZWN0LCBzbyB5b3UgY2FuIGV4dGVuZCBpdCB3aXRoIGN1c3RvbSB2YWxpZGF0aW9uIGZ1bmN0aW9ucy4gVGhlIHZhbGlkYXRvciBpcyBleHBvc2VkIGJvdGggb24gdGhlIGluc3RhbmNlLCBhbmQgb24gdGhlIGNvbnN0cnVjdG9yLlxyXG4gKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jaHJpc28vdmFsaWRhdG9yLmpzXHJcbiAqL1xyXG5TZXF1ZWxpemUucHJvdG90eXBlLlZhbGlkYXRvciA9IFNlcXVlbGl6ZS5WYWxpZGF0b3IgPSBWYWxpZGF0b3I7XHJcblxyXG5TZXF1ZWxpemUuTW9kZWwgPSBNb2RlbDtcclxuXHJcblNlcXVlbGl6ZS5EYXRhVHlwZXMgPSBEYXRhVHlwZXM7XHJcbmZvciAoY29uc3QgZGF0YVR5cGUgaW4gRGF0YVR5cGVzKSB7XHJcbiAgU2VxdWVsaXplW2RhdGFUeXBlXSA9IERhdGFUeXBlc1tkYXRhVHlwZV07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIHJlZmVyZW5jZSB0byB0aGUgZGVmZXJyYWJsZSBjb2xsZWN0aW9uLiBVc2UgdGhpcyB0byBhY2Nlc3MgdGhlIGRpZmZlcmVudCBkZWZlcnJhYmxlIG9wdGlvbnMuXHJcbiAqIEBzZWUge0BsaW5rIFRyYW5zYWN0aW9uLkRlZmVycmFibGV9XHJcbiAqIEBzZWUge0BsaW5rIFNlcXVlbGl6ZSN0cmFuc2FjdGlvbn1cclxuICovXHJcblNlcXVlbGl6ZS5EZWZlcnJhYmxlID0gRGVmZXJyYWJsZTtcclxuXHJcbi8qKlxyXG4gKiBBIHJlZmVyZW5jZSB0byB0aGUgc2VxdWVsaXplIGFzc29jaWF0aW9uIGNsYXNzLlxyXG4gKiBAc2VlIHtAbGluayBBc3NvY2lhdGlvbn1cclxuICovXHJcblNlcXVlbGl6ZS5wcm90b3R5cGUuQXNzb2NpYXRpb24gPSBTZXF1ZWxpemUuQXNzb2NpYXRpb24gPSBBc3NvY2lhdGlvbjtcclxuXHJcbi8qKlxyXG4gKiBQcm92aWRlIGFsdGVybmF0aXZlIHZlcnNpb24gb2YgYGluZmxlY3Rpb25gIG1vZHVsZSB0byBiZSB1c2VkIGJ5IGBVdGlscy5wbHVyYWxpemVgIGV0Yy5cclxuICogQHBhcmFtIHtPYmplY3R9IF9pbmZsZWN0aW9uIC0gYGluZmxlY3Rpb25gIG1vZHVsZVxyXG4gKi9cclxuU2VxdWVsaXplLnVzZUluZmxlY3Rpb24gPSBVdGlscy51c2VJbmZsZWN0aW9uO1xyXG5cclxuLyoqXHJcbiAqIEFsbG93IGhvb2tzIHRvIGJlIGRlZmluZWQgb24gU2VxdWVsaXplICsgb24gc2VxdWVsaXplIGluc3RhbmNlIGFzIHVuaXZlcnNhbCBob29rcyB0byBydW4gb24gYWxsIG1vZGVsc1xyXG4gKiBhbmQgb24gU2VxdWVsaXplL3NlcXVlbGl6ZSBtZXRob2RzIGUuZy4gU2VxdWVsaXplKCksIFNlcXVlbGl6ZSNkZWZpbmUoKVxyXG4gKi9cclxuSG9va3MuYXBwbHlUbyhTZXF1ZWxpemUpO1xyXG5Ib29rcy5hcHBseVRvKFNlcXVlbGl6ZS5wcm90b3R5cGUpO1xyXG5cclxuLyoqXHJcbiAqIEV4cG9zZSB2YXJpb3VzIGVycm9ycyBhdmFpbGFibGVcclxuICovXHJcblxyXG4vLyBleHBvc2UgYWxpYXMgdG8gQmFzZUVycm9yXHJcblNlcXVlbGl6ZS5FcnJvciA9IHNlcXVlbGl6ZUVycm9ycy5CYXNlRXJyb3I7XHJcblxyXG5mb3IgKGNvbnN0IGVycm9yIG9mIE9iamVjdC5rZXlzKHNlcXVlbGl6ZUVycm9ycykpIHtcclxuICBTZXF1ZWxpemVbZXJyb3JdID0gc2VxdWVsaXplRXJyb3JzW2Vycm9yXTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXF1ZWxpemU7XHJcbm1vZHVsZS5leHBvcnRzLlNlcXVlbGl6ZSA9IFNlcXVlbGl6ZTtcclxubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IFNlcXVlbGl6ZTtcclxuIl19