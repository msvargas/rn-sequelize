"use strict";

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

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


let Sequelize = /*#__PURE__*/function () {
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

      const model = /*#__PURE__*/function (_Model) {
        _inherits(model, _Model);

        var _super = _createSuper(model);

        function model() {
          _classCallCheck(this, model);

          return _super.apply(this, arguments);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9zZXF1ZWxpemUuanMiXSwibmFtZXMiOlsicmV0cnkiLCJyZXF1aXJlIiwiY2xzQmx1ZWJpcmQiLCJfIiwiVXRpbHMiLCJNb2RlbCIsIkRhdGFUeXBlcyIsIkRlZmVycmFibGUiLCJNb2RlbE1hbmFnZXIiLCJRdWVyeUludGVyZmFjZSIsIlRyYW5zYWN0aW9uIiwiUXVlcnlUeXBlcyIsIlRhYmxlSGludHMiLCJJbmRleEhpbnRzIiwic2VxdWVsaXplRXJyb3JzIiwiUHJvbWlzZSIsIkhvb2tzIiwiQXNzb2NpYXRpb24iLCJWYWxpZGF0b3IiLCJ2YWxpZGF0b3IiLCJPcCIsImRlcHJlY2F0aW9ucyIsIlNlcXVlbGl6ZSIsImRhdGFiYXNlIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm9wdGlvbnMiLCJjb25maWciLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJwaWNrIiwicnVuSG9va3MiLCJPYmplY3QiLCJhc3NpZ24iLCJkaWFsZWN0IiwiZGlhbGVjdE1vZHVsZSIsImRpYWxlY3RNb2R1bGVQYXRoIiwiaG9zdCIsInByb3RvY29sIiwiZGVmaW5lIiwicXVlcnkiLCJzeW5jIiwidGltZXpvbmUiLCJjbGllbnRNaW5NZXNzYWdlcyIsInN0YW5kYXJkQ29uZm9ybWluZ1N0cmluZ3MiLCJsb2dnaW5nIiwiY29uc29sZSIsImxvZyIsIm9taXROdWxsIiwibmF0aXZlIiwicmVwbGljYXRpb24iLCJzc2wiLCJ1bmRlZmluZWQiLCJwb29sIiwicXVvdGVJZGVudGlmaWVycyIsImhvb2tzIiwibWF4IiwibWF0Y2giLCJ0cmFuc2FjdGlvblR5cGUiLCJUWVBFUyIsIkRFRkVSUkVEIiwiaXNvbGF0aW9uTGV2ZWwiLCJkYXRhYmFzZVZlcnNpb24iLCJ0eXBlVmFsaWRhdGlvbiIsImJlbmNobWFyayIsIm1pbmlmeUFsaWFzZXMiLCJsb2dRdWVyeVBhcmFtZXRlcnMiLCJFcnJvciIsIm5vVHJ1ZUxvZ2dpbmciLCJfc2V0dXBIb29rcyIsInBvcnQiLCJrZWVwRGVmYXVsdFRpbWV6b25lIiwiZGlhbGVjdE9wdGlvbnMiLCJEaWFsZWN0IiwiZ2V0RGlhbGVjdCIsIlF1ZXJ5R2VuZXJhdG9yIiwiaXNQbGFpbk9iamVjdCIsIm9wZXJhdG9yc0FsaWFzZXMiLCJub1N0cmluZ09wZXJhdG9ycyIsInNldE9wZXJhdG9yc0FsaWFzZXMiLCJub0Jvb2xPcGVyYXRvckFsaWFzZXMiLCJxdWVyeUludGVyZmFjZSIsIm1vZGVscyIsIm1vZGVsTWFuYWdlciIsImNvbm5lY3Rpb25NYW5hZ2VyIiwiaW1wb3J0Q2FjaGUiLCJyZWZyZXNoVHlwZVBhcnNlciIsIm1vZGVsTmFtZSIsImF0dHJpYnV0ZXMiLCJzZXF1ZWxpemUiLCJtb2RlbCIsImluaXQiLCJpc0RlZmluZWQiLCJnZXRNb2RlbCIsImZpbmQiLCJuYW1lIiwiaW1wb3J0UGF0aCIsInNxbCIsImluc3RhbmNlIiwiY29uc3RydWN0b3IiLCJyYXciLCJtYXBUb01vZGVsIiwiZmllbGRNYXAiLCJnZXQiLCJkZWZhdWx0cyIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsInNlYXJjaFBhdGgiLCJ0eXBlIiwibmVzdCIsInBsYWluIiwiU0VMRUNUIiwiUkFXIiwic3VwcG9ydHMiLCJwcmVwZW5kU2VhcmNoUGF0aCIsInN1cHBvcnRzU2VhcmNoUGF0aCIsInRyeSIsInZhbHVlcyIsInJlcGxhY2VtZW50cyIsImJpbmQiLCJ0cmltIiwiQXJyYXkiLCJpc0FycmF5IiwiZm9ybWF0IiwiY29uY2F0IiwiZm9ybWF0TmFtZWRQYXJhbWV0ZXJzIiwiYmluZFBhcmFtZXRlcnMiLCJRdWVyeSIsImZvcm1hdEJpbmRQYXJhbWV0ZXJzIiwiY2hlY2tUcmFuc2FjdGlvbiIsInRyYW5zYWN0aW9uIiwiZmluaXNoZWQiLCJjb21wbGV0ZXNUcmFuc2FjdGlvbiIsImVycm9yIiwiaWQiLCJyZXRyeU9wdGlvbnMiLCJyZXNvbHZlIiwiX2NscyIsImNvbm5lY3Rpb24iLCJnZXRDb25uZWN0aW9uIiwidGhlbiIsInJ1biIsImZpbmFsbHkiLCJyZWxlYXNlQ29ubmVjdGlvbiIsInZhcmlhYmxlcyIsInNldCIsIlR5cGVFcnJvciIsIm1hcCIsInYiLCJrIiwiam9pbiIsInZhbHVlIiwiZ2V0UXVlcnlJbnRlcmZhY2UiLCJlc2NhcGUiLCJzY2hlbWEiLCJjcmVhdGVTY2hlbWEiLCJzaG93QWxsU2NoZW1hcyIsImRyb3BTY2hlbWEiLCJkcm9wQWxsU2NoZW1hcyIsImNsb25lIiwidGVzdCIsInJlamVjdCIsImZvcmNlIiwiZHJvcCIsImZvckVhY2hNb2RlbCIsInB1c2giLCJhdXRoZW50aWNhdGUiLCJlYWNoIiwicmV0dXJuIiwicmV2ZXJzZSIsInRydW5jYXRlTW9kZWwiLCJ0cnVuY2F0ZSIsImNhc2NhZGUiLCJkaWEiLCJmbiIsImF1dG9DYWxsYmFjayIsInByZXBhcmVFbnZpcm9ubWVudCIsIl9jbHNSdW4iLCJ0YXAiLCJjb21taXQiLCJjYXRjaCIsImVyciIsInJvbGxiYWNrIiwidGhyb3ciLCJhcmdzIiwibGFzdCIsInNwbGljZSIsImNsb3NlIiwiVHlwZSIsImRpYWxlY3RUeXBlcyIsImtleSIsImV4dGVuZCIsIkFSUkFZIiwiYXR0cmlidXRlIiwibm9ybWFsaXplRGF0YVR5cGUiLCJkZWZhdWx0VmFsdWUiLCJOT1ciLCJVVUlEVjEiLCJVVUlEVjQiLCJFTlVNIiwiRm4iLCJjb2wiLCJDb2wiLCJ2YWwiLCJDYXN0IiwiTGl0ZXJhbCIsImFuZCIsIm9yIiwiY29uZGl0aW9uc09yUGF0aCIsIkpzb24iLCJhdHRyIiwiY29tcGFyYXRvciIsImxvZ2ljIiwiV2hlcmUiLCJucyIsInJlcyIsImNvbnRleHQiLCJjYXN0IiwibGl0ZXJhbCIsImpzb24iLCJ3aGVyZSIsInZhbGlkYXRlIiwidmVyc2lvbiIsImRhdGFUeXBlIiwidXNlSW5mbGVjdGlvbiIsImFwcGx5VG8iLCJCYXNlRXJyb3IiLCJrZXlzIiwibW9kdWxlIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsTUFBTUEsS0FBSyxHQUFHQyxPQUFPLENBQUMsbUJBQUQsQ0FBckI7O0FBQ0EsTUFBTUMsV0FBVyxHQUFHRCxPQUFPLENBQUMsY0FBRCxDQUEzQjs7QUFDQSxNQUFNRSxDQUFDLEdBQUdGLE9BQU8sQ0FBQyxRQUFELENBQWpCOztBQUVBLE1BQU1HLEtBQUssR0FBR0gsT0FBTyxDQUFDLFNBQUQsQ0FBckI7O0FBQ0EsTUFBTUksS0FBSyxHQUFHSixPQUFPLENBQUMsU0FBRCxDQUFyQjs7QUFDQSxNQUFNSyxTQUFTLEdBQUdMLE9BQU8sQ0FBQyxjQUFELENBQXpCOztBQUNBLE1BQU1NLFVBQVUsR0FBR04sT0FBTyxDQUFDLGNBQUQsQ0FBMUI7O0FBQ0EsTUFBTU8sWUFBWSxHQUFHUCxPQUFPLENBQUMsaUJBQUQsQ0FBNUI7O0FBQ0EsTUFBTVEsY0FBYyxHQUFHUixPQUFPLENBQUMsbUJBQUQsQ0FBOUI7O0FBQ0EsTUFBTVMsV0FBVyxHQUFHVCxPQUFPLENBQUMsZUFBRCxDQUEzQjs7QUFDQSxNQUFNVSxVQUFVLEdBQUdWLE9BQU8sQ0FBQyxlQUFELENBQTFCOztBQUNBLE1BQU1XLFVBQVUsR0FBR1gsT0FBTyxDQUFDLGVBQUQsQ0FBMUI7O0FBQ0EsTUFBTVksVUFBVSxHQUFHWixPQUFPLENBQUMsZUFBRCxDQUExQjs7QUFDQSxNQUFNYSxlQUFlLEdBQUdiLE9BQU8sQ0FBQyxVQUFELENBQS9COztBQUNBLE1BQU1jLE9BQU8sR0FBR2QsT0FBTyxDQUFDLFdBQUQsQ0FBdkI7O0FBQ0EsTUFBTWUsS0FBSyxHQUFHZixPQUFPLENBQUMsU0FBRCxDQUFyQjs7QUFDQSxNQUFNZ0IsV0FBVyxHQUFHaEIsT0FBTyxDQUFDLHNCQUFELENBQTNCOztBQUNBLE1BQU1pQixTQUFTLEdBQUdqQixPQUFPLENBQUMsMEJBQUQsQ0FBUCxDQUFvQ2tCLFNBQXREOztBQUNBLE1BQU1DLEVBQUUsR0FBR25CLE9BQU8sQ0FBQyxhQUFELENBQWxCOztBQUNBLE1BQU1vQixZQUFZLEdBQUdwQixPQUFPLENBQUMsc0JBQUQsQ0FBNUI7QUFFQTtBQUNBO0FBQ0E7OztJQUNNcUIsUztBQUNKO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRSxxQkFBWUMsUUFBWixFQUFzQkMsUUFBdEIsRUFBZ0NDLFFBQWhDLEVBQTBDQyxPQUExQyxFQUFtRDtBQUFBOztBQUNqRCxRQUFJQyxNQUFKOztBQUVBLFFBQUlDLFNBQVMsQ0FBQ0MsTUFBVixLQUFxQixDQUFyQixJQUEwQixPQUFPTixRQUFQLEtBQW9CLFFBQWxELEVBQTREO0FBQzFEO0FB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RUFBQUEsU0FBUyxDQUFDZ0gsS0FBRCxDQUFULEdBQW1CeEgsZUFBZSxDQUFDd0gsS0FBRCxDQUFsQztBQUNEOztBQUVEK0YsTUFBTSxDQUFDQyxPQUFQLEdBQWlCaE4sU0FBakI7QUFDQStNLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlaE4sU0FBZixHQUEyQkEsU0FBM0I7QUFDQStNLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxPQUFmLEdBQXlCak4sU0FBekIiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbmNvbnN0IHJldHJ5ID0gcmVxdWlyZShcInJldHJ5LWFzLXByb21pc2VkXCIpO1xuY29uc3QgY2xzQmx1ZWJpcmQgPSByZXF1aXJlKFwiY2xzLWJsdWViaXJkXCIpO1xuY29uc3QgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG5cbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5jb25zdCBNb2RlbCA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xuY29uc3QgRGF0YVR5cGVzID0gcmVxdWlyZShcIi4vZGF0YS10eXBlc1wiKTtcbmNvbnN0IERlZmVycmFibGUgPSByZXF1aXJlKFwiLi9kZWZlcnJhYmxlXCIpO1xuY29uc3QgTW9kZWxNYW5hZ2VyID0gcmVxdWlyZShcIi4vbW9kZWwtbWFuYWdlclwiKTtcbmNvbnN0IFF1ZXJ5SW50ZXJmYWNlID0gcmVxdWlyZShcIi4vcXVlcnktaW50ZXJmYWNlXCIpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSByZXF1aXJlKFwiLi90cmFuc2FjdGlvblwiKTtcbmNvbnN0IFF1ZXJ5VHlwZXMgPSByZXF1aXJlKFwiLi9xdWVyeS10eXBlc1wiKTtcbmNvbnN0IFRhYmxlSGludHMgPSByZXF1aXJlKFwiLi90YWJsZS1oaW50c1wiKTtcbmNvbnN0IEluZGV4SGludHMgPSByZXF1aXJlKFwiLi9pbmRleC1oaW50c1wiKTtcbmNvbnN0IHNlcXVlbGl6ZUVycm9ycyA9IHJlcXVpcmUoXCIuL2Vycm9yc1wiKTtcbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKFwiLi9wcm9taXNlXCIpO1xuY29uc3QgSG9va3MgPSByZXF1aXJlKFwiLi9ob29rc1wiKTtcbmNvbnN0IEFzc29jaWF0aW9uID0gcmVxdWlyZShcIi4vYXNzb2NpYXRpb25zL2luZGV4XCIpO1xuY29uc3QgVmFsaWRhdG9yID0gcmVxdWlyZShcIi4vdXRpbHMvdmFsaWRhdG9yLWV4dHJhc1wiKS52YWxpZGF0b3I7XG5jb25zdCBPcCA9IHJlcXVpcmUoXCIuL29wZXJhdG9yc1wiKTtcbmNvbnN0IGRlcHJlY2F0aW9ucyA9IHJlcXVpcmUoXCIuL3V0aWxzL2RlcHJlY2F0aW9uc1wiKTtcblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBtYWluIGNsYXNzLCB0aGUgZW50cnkgcG9pbnQgdG8gc2VxdWVsaXplLlxuICovXG5jbGFzcyBTZXF1ZWxpemUge1xuICAvKipcbiAgICogSW5zdGFudGlhdGUgc2VxdWVsaXplIHdpdGggbmFtZSBvZiBkYXRhYmFzZSwgdXNlcm5hbWUgYW5kIHBhc3N3b3JkLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyB3aXRob3V0IHBhc3N3b3JkIC8gd2l0aCBibGFuayBwYXNzd29yZFxuICAgKiBjb25zdCBzZXF1ZWxpemUgPSBuZXcgU2VxdWVsaXplKCdkYXRhYmFzZScsICd1c2VybmFtZScsIG51bGwsIHtcbiAgICogICBkaWFsZWN0OiAnbXlzcWwnXG4gICAqIH0pXG4gICAqXG4gICAqIC8vIHdpdGggcGFzc3dvcmQgYW5kIG9wdGlvbnNcbiAgICogY29uc3Qgc2VxdWVsaXplID0gbmV3IFNlcXVlbGl6ZSgnbXlfZGF0YWJhc2UnLCAnam9obicsICdkb2UnLCB7XG4gICAqICAgZGlhbGVjdDogJ3Bvc3RncmVzJ1xuICAgKiB9KVxuICAgKlxuICAgKiAvLyB3aXRoIGRhdGFiYXNlLCB1c2VybmFtZSwgYW5kIHBhc3N3b3JkIGluIHRoZSBvcHRpb25zIG9iamVjdFxuICAgKiBjb25zdCBzZXF1ZWxpemUgPSBuZXcgU2VxdWVsaXplKHsgZGF0YWJhc2UsIHVzZXJuYW1lLCBwYXNzd29yZCwgZGlhbGVjdDogJ21zc3FsJyB9KTtcbiAgICpcbiAgICogLy8gd2l0aCB1cmlcbiAgICogY29uc3Qgc2VxdWVsaXplID0gbmV3IFNlcXVlbGl6ZSgnbXlzcWw6Ly9sb2NhbGhvc3Q6MzMwNi9kYXRhYmFzZScsIHt9KVxuICAgKlxuICAgKiAvLyBvcHRpb24gZXhhbXBsZXNcbiAgICogY29uc3Qgc2VxdWVsaXplID0gbmV3IFNlcXVlbGl6ZSgnZGF0YWJhc2UnLCAndXNlcm5hbWUnLCAncGFzc3dvcmQnLCB7XG4gICAqICAgLy8gdGhlIHNxbCBkaWFsZWN0IG9mIHRoZSBkYXRhYmFzZVxuICAgKiAgIC8vIGN1cnJlbnRseSBzdXBwb3J0ZWQ6ICdteXNxbCcsICdzcWxpdGUnLCAncG9zdGdyZXMnLCAnbXNzcWwnXG4gICAqICAgZGlhbGVjdDogJ215c3FsJyxcbiAgICpcbiAgICogICAvLyBjdXN0b20gaG9zdDsgZGVmYXVsdDogbG9jYWxob3N0XG4gICAqICAgaG9zdDogJ215LnNlcnZlci50bGQnLFxuICAgKiAgIC8vIGZvciBwb3N0Z3JlcywgeW91IGNhbiBhbHNvIHNwZWNpZnkgYW4gYWJzb2x1dGUgcGF0aCB0byBhIGRpcmVjdG9yeVxuICAgKiAgIC8vIGNvbnRhaW5pbmcgYSBVTklYIHNvY2tldCB0byBjb25uZWN0IG92ZXJcbiAgICogICAvLyBob3N0OiAnL3NvY2tldHMvcHNxbF9zb2NrZXRzJy5cbiAgICpcbiAgICogICAvLyBjdXN0b20gcG9ydDsgZGVmYXVsdDogZGlhbGVjdCBkZWZhdWx0XG4gICAqICAgcG9ydDogMTIzNDUsXG4gICAqXG4gICAqICAgLy8gY3VzdG9tIHByb3RvY29sOyBkZWZhdWx0OiAndGNwJ1xuICAgKiAgIC8vIHBvc3RncmVzIG9ubHksIHVzZWZ1bCBmb3IgSGVyb2t1XG4gICAqICAgcHJvdG9jb2w6IG51bGwsXG4gICAqXG4gICAqICAgLy8gZGlzYWJsZSBsb2dnaW5nIG9yIHByb3ZpZGUgYSBjdXN0b20gbG9nZ2luZyBmdW5jdGlvbjsgZGVmYXVsdDogY29uc29sZS5sb2dcbiAgICogICBsb2dnaW5nOiBmYWxzZSxcbiAgICpcbiAgICogICAvLyB5b3UgY2FuIGFsc28gcGFzcyBhbnkgZGlhbGVjdCBvcHRpb25zIHRvIHRoZSB1bmRlcmx5aW5nIGRpYWxlY3QgbGlicmFyeVxuICAgKiAgIC8vIC0gZGVmYXVsdCBpcyBlbXB0eVxuICAgKiAgIC8vIC0gY3VycmVudGx5IHN1cHBvcnRlZDogJ215c3FsJywgJ3Bvc3RncmVzJywgJ21zc3FsJ1xuICAgKiAgIGRpYWxlY3RPcHRpb25zOiB7XG4gICAqICAgICBzb2NrZXRQYXRoOiAnL0FwcGxpY2F0aW9ucy9NQU1QL3RtcC9teXNxbC9teXNxbC5zb2NrJyxcbiAgICogICAgIHN1cHBvcnRCaWdOdW1iZXJzOiB0cnVlLFxuICAgKiAgICAgYmlnTnVtYmVyU3RyaW5nczogdHJ1ZVxuICAgKiAgIH0sXG4gICAqXG4gICAqICAgLy8gdGhlIHN0b3JhZ2UgZW5naW5lIGZvciBzcWxpdGVcbiAgICogICAvLyAtIGRlZmF1bHQgJzptZW1vcnk6J1xuICAgKiAgIHN0b3JhZ2U6ICdwYXRoL3RvL2RhdGFiYXNlLnNxbGl0ZScsXG4gICAqXG4gICAqICAgLy8gZGlzYWJsZSBpbnNlcnRpbmcgdW5kZWZpbmVkIHZhbHVlcyBhcyBOVUxMXG4gICAqICAgLy8gLSBkZWZhdWx0OiBmYWxzZVxuICAgKiAgIG9taXROdWxsOiB0cnVlLFxuICAgKlxuICAgKiAgIC8vIGEgZmxhZyBmb3IgdXNpbmcgYSBuYXRpdmUgbGlicmFyeSBvciBub3QuXG4gICAqICAgLy8gaW4gdGhlIGNhc2Ugb2YgJ3BnJyAtLSBzZXQgdGhpcyB0byB0cnVlIHdpbGwgYWxsb3cgU1NMIHN1cHBvcnRcbiAgICogICAvLyAtIGRlZmF1bHQ6IGZhbHNlXG4gICAqICAgbmF0aXZlOiB0cnVlLFxuICAgKlxuICAgKiAgIC8vIFNwZWNpZnkgb3B0aW9ucywgd2hpY2ggYXJlIHVzZWQgd2hlbiBzZXF1ZWxpemUuZGVmaW5lIGlzIGNhbGxlZC5cbiAgICogICAvLyBUaGUgZm9sbG93aW5nIGV4YW1wbGU6XG4gICAqICAgLy8gICBkZWZpbmU6IHsgdGltZXN0YW1wczogZmFsc2UgfVxuICAgKiAgIC8vIGlzIGJhc2ljYWxseSB0aGUgc2FtZSBhczpcbiAgICogICAvLyAgIE1vZGVsLmluaXQoYXR0cmlidXRlcywgeyB0aW1lc3RhbXBzOiBmYWxzZSB9KTtcbiAgICogICAvLyAgIHNlcXVlbGl6ZS5kZWZpbmUobmFtZSwgYXR0cmlidXRlcywgeyB0aW1lc3RhbXBzOiBmYWxzZSB9KTtcbiAgICogICAvLyBzbyBkZWZpbmluZyB0aGUgdGltZXN0YW1wcyBmb3IgZWFjaCBtb2RlbCB3aWxsIGJlIG5vdCBuZWNlc3NhcnlcbiAgICogICBkZWZpbmU6IHtcbiAgICogICAgIHVuZGVyc2NvcmVkOiBmYWxzZSxcbiAgICogICAgIGZyZWV6ZVRhYmxlTmFtZTogZmFsc2UsXG4gICAqICAgICBjaGFyc2V0OiAndXRmOCcsXG4gICAqICAgICBkaWFsZWN0T3B0aW9uczoge1xuICAgKiAgICAgICBjb2xsYXRlOiAndXRmOF9nZW5lcmFsX2NpJ1xuICAgKiAgICAgfSxcbiAgICogICAgIHRpbWVzdGFtcHM6IHRydWVcbiAgICogICB9LFxuICAgKlxuICAgKiAgIC8vIHNpbWlsYXIgZm9yIHN5bmM6IHlvdSBjYW4gZGVmaW5lIHRoaXMgdG8gYWx3YXlzIGZvcmNlIHN5bmMgZm9yIG1vZGVsc1xuICAgKiAgIHN5bmM6IHsgZm9yY2U6IHRydWUgfSxcbiAgICpcbiAgICogICAvLyBwb29sIGNvbmZpZ3VyYXRpb24gdXNlZCB0byBwb29sIGRhdGFiYXNlIGNvbm5lY3Rpb25zXG4gICAqICAgcG9vbDoge1xuICAgKiAgICAgbWF4OiA1LFxuICAgKiAgICAgaWRsZTogMzAwMDAsXG4gICAqICAgICBhY3F1aXJlOiA2MDAwMCxcbiAgICogICB9LFxuICAgKlxuICAgKiAgIC8vIGlzb2xhdGlvbiBsZXZlbCBvZiBlYWNoIHRyYW5zYWN0aW9uXG4gICAqICAgLy8gZGVmYXVsdHMgdG8gZGlhbGVjdCBkZWZhdWx0XG4gICAqICAgaXNvbGF0aW9uTGV2ZWw6IFRyYW5zYWN0aW9uLklTT0xBVElPTl9MRVZFTFMuUkVQRUFUQUJMRV9SRUFEXG4gICAqIH0pXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtkYXRhYmFzZV0gVGhlIG5hbWUgb2YgdGhlIGRhdGFiYXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFt1c2VybmFtZT1udWxsXSBUaGUgdXNlcm5hbWUgd2hpY2ggaXMgdXNlZCB0byBhdXRoZW50aWNhdGUgYWdhaW5zdCB0aGUgZGF0YWJhc2UuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtwYXNzd29yZD1udWxsXSBUaGUgcGFzc3dvcmQgd2hpY2ggaXMgdXNlZCB0byBhdXRoZW50aWNhdGUgYWdhaW5zdCB0aGUgZGF0YWJhc2UuIFN1cHBvcnRzIFNRTENpcGhlciBlbmNyeXB0aW9uIGZvciBTUUxpdGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIFtvcHRpb25zPXt9XSBBbiBvYmplY3Qgd2l0aCBvcHRpb25zLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5ob3N0PSdsb2NhbGhvc3QnXSBUaGUgaG9zdCBvZiB0aGUgcmVsYXRpb25hbCBkYXRhYmFzZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgW29wdGlvbnMucG9ydD1dIFRoZSBwb3J0IG9mIHRoZSByZWxhdGlvbmFsIGRhdGFiYXNlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy51c2VybmFtZT1udWxsXSBUaGUgdXNlcm5hbWUgd2hpY2ggaXMgdXNlZCB0byBhdXRoZW50aWNhdGUgYWdhaW5zdCB0aGUgZGF0YWJhc2UuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLnBhc3N3b3JkPW51bGxdIFRoZSBwYXNzd29yZCB3aGljaCBpcyB1c2VkIHRvIGF1dGhlbnRpY2F0ZSBhZ2FpbnN0IHRoZSBkYXRhYmFzZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW29wdGlvbnMuZGF0YWJhc2U9bnVsbF0gVGhlIG5hbWUgb2YgdGhlIGRhdGFiYXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLmRpYWxlY3RdIFRoZSBkaWFsZWN0IG9mIHRoZSBkYXRhYmFzZSB5b3UgYXJlIGNvbm5lY3RpbmcgdG8uIE9uZSBvZiBteXNxbCwgcG9zdGdyZXMsIHNxbGl0ZSBhbmQgbXNzcWwuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLmRpYWxlY3RNb2R1bGU9bnVsbF0gSWYgc3BlY2lmaWVkLCB1c2UgdGhpcyBkaWFsZWN0IGxpYnJhcnkuIEZvciBleGFtcGxlLCBpZiB5b3Ugd2FudCB0byB1c2UgcGcuanMgaW5zdGVhZCBvZiBwZyB3aGVuIGNvbm5lY3RpbmcgdG8gYSBwZyBkYXRhYmFzZSwgeW91IHNob3VsZCBzcGVjaWZ5ICdyZXF1aXJlKFwicGcuanNcIiknIGhlcmVcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW29wdGlvbnMuZGlhbGVjdE1vZHVsZVBhdGg9bnVsbF0gSWYgc3BlY2lmaWVkLCBsb2FkIHRoZSBkaWFsZWN0IGxpYnJhcnkgZnJvbSB0aGlzIHBhdGguIEZvciBleGFtcGxlLCBpZiB5b3Ugd2FudCB0byB1c2UgcGcuanMgaW5zdGVhZCBvZiBwZyB3aGVuIGNvbm5lY3RpbmcgdG8gYSBwZyBkYXRhYmFzZSwgeW91IHNob3VsZCBzcGVjaWZ5ICcvcGF0aC90by9wZy5qcycgaGVyZVxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5kaWFsZWN0T3B0aW9uc10gQW4gb2JqZWN0IG9mIGFkZGl0aW9uYWwgb3B0aW9ucywgd2hpY2ggYXJlIHBhc3NlZCBkaXJlY3RseSB0byB0aGUgY29ubmVjdGlvbiBsaWJyYXJ5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLnN0b3JhZ2VdIE9ubHkgdXNlZCBieSBzcWxpdGUuIERlZmF1bHRzIHRvICc6bWVtb3J5OidcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW29wdGlvbnMucHJvdG9jb2w9J3RjcCddIFRoZSBwcm90b2NvbCBvZiB0aGUgcmVsYXRpb25hbCBkYXRhYmFzZS5cbiAgICogQHBhcmFtIHtPYmplY3R9ICAgW29wdGlvbnMuZGVmaW5lPXt9XSBEZWZhdWx0IG9wdGlvbnMgZm9yIG1vZGVsIGRlZmluaXRpb25zLiBTZWUge0BsaW5rIE1vZGVsLmluaXR9LlxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5xdWVyeT17fV0gRGVmYXVsdCBvcHRpb25zIGZvciBzZXF1ZWxpemUucXVlcnlcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgW29wdGlvbnMuc2NoZW1hPW51bGxdIEEgc2NoZW1hIHRvIHVzZVxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5zZXQ9e31dIERlZmF1bHQgb3B0aW9ucyBmb3Igc2VxdWVsaXplLnNldFxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5zeW5jPXt9XSBEZWZhdWx0IG9wdGlvbnMgZm9yIHNlcXVlbGl6ZS5zeW5jXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLnRpbWV6b25lPScrMDA6MDAnXSBUaGUgdGltZXpvbmUgdXNlZCB3aGVuIGNvbnZlcnRpbmcgYSBkYXRlIGZyb20gdGhlIGRhdGFiYXNlIGludG8gYSBKYXZhU2NyaXB0IGRhdGUuIFRoZSB0aW1lem9uZSBpcyBhbHNvIHVzZWQgdG8gU0VUIFRJTUVaT05FIHdoZW4gY29ubmVjdGluZyB0byB0aGUgc2VydmVyLCB0byBlbnN1cmUgdGhhdCB0aGUgcmVzdWx0IG9mIE5PVywgQ1VSUkVOVF9USU1FU1RBTVAgYW5kIG90aGVyIHRpbWUgcmVsYXRlZCBmdW5jdGlvbnMgaGF2ZSBpbiB0aGUgcmlnaHQgdGltZXpvbmUuIEZvciBiZXN0IGNyb3NzIHBsYXRmb3JtIHBlcmZvcm1hbmNlIHVzZSB0aGUgZm9ybWF0ICsvLUhIOk1NLiBXaWxsIGFsc28gYWNjZXB0IHN0cmluZyB2ZXJzaW9ucyBvZiB0aW1lem9uZXMgdXNlZCBieSBtb21lbnQuanMgKGUuZy4gJ0FtZXJpY2EvTG9zX0FuZ2VsZXMnKTsgdGhpcyBpcyB1c2VmdWwgdG8gY2FwdHVyZSBkYXlsaWdodCBzYXZpbmdzIHRpbWUgY2hhbmdlcy5cbiAgICogQHBhcmFtIHtzdHJpbmd8Ym9vbGVhbn0gW29wdGlvbnMuY2xpZW50TWluTWVzc2FnZXM9J3dhcm5pbmcnXSBUaGUgUG9zdGdyZVNRTCBgY2xpZW50X21pbl9tZXNzYWdlc2Agc2Vzc2lvbiBwYXJhbWV0ZXIuIFNldCB0byBgZmFsc2VgIHRvIG5vdCBvdmVycmlkZSB0aGUgZGF0YWJhc2UncyBkZWZhdWx0LlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5zdGFuZGFyZENvbmZvcm1pbmdTdHJpbmdzPXRydWVdIFRoZSBQb3N0Z3JlU1FMIGBzdGFuZGFyZF9jb25mb3JtaW5nX3N0cmluZ3NgIHNlc3Npb24gcGFyYW1ldGVyLiBTZXQgdG8gYGZhbHNlYCB0byBub3Qgc2V0IHRoZSBvcHRpb24uIFdBUk5JTkc6IFNldHRpbmcgdGhpcyB0byBmYWxzZSBtYXkgZXhwb3NlIHZ1bG5lcmFiaWxpdGllcyBhbmQgaXMgbm90IHJlY29tbWVuZGVkIVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nPWNvbnNvbGUubG9nXSBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCBldmVyeSB0aW1lIFNlcXVlbGl6ZSB3b3VsZCBsb2cgc29tZXRoaW5nLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5vbWl0TnVsbD1mYWxzZV0gQSBmbGFnIHRoYXQgZGVmaW5lcyBpZiBudWxsIHZhbHVlcyBzaG91bGQgYmUgcGFzc2VkIHRvIFNRTCBxdWVyaWVzIG9yIG5vdC5cbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMubmF0aXZlPWZhbHNlXSBBIGZsYWcgdGhhdCBkZWZpbmVzIGlmIG5hdGl2ZSBsaWJyYXJ5IHNoYWxsIGJlIHVzZWQgb3Igbm90LiBDdXJyZW50bHkgb25seSBoYXMgYW4gZWZmZWN0IGZvciBwb3N0Z3Jlc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5yZXBsaWNhdGlvbj1mYWxzZV0gVXNlIHJlYWQgLyB3cml0ZSByZXBsaWNhdGlvbi4gVG8gZW5hYmxlIHJlcGxpY2F0aW9uLCBwYXNzIGFuIG9iamVjdCwgd2l0aCB0d28gcHJvcGVydGllcywgcmVhZCBhbmQgd3JpdGUuIFdyaXRlIHNob3VsZCBiZSBhbiBvYmplY3QgKGEgc2luZ2xlIHNlcnZlciBmb3IgaGFuZGxpbmcgd3JpdGVzKSwgYW5kIHJlYWQgYW4gYXJyYXkgb2Ygb2JqZWN0IChzZXZlcmFsIHNlcnZlcnMgdG8gaGFuZGxlIHJlYWRzKS4gRWFjaCByZWFkL3dyaXRlIHNlcnZlciBjYW4gaGF2ZSB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6IGBob3N0YCwgYHBvcnRgLCBgdXNlcm5hbWVgLCBgcGFzc3dvcmRgLCBgZGF0YWJhc2VgXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIFtvcHRpb25zLnBvb2xdIHNlcXVlbGl6ZSBjb25uZWN0aW9uIHBvb2wgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0ge251bWJlcn0gICBbb3B0aW9ucy5wb29sLm1heD01XSBNYXhpbXVtIG51bWJlciBvZiBjb25uZWN0aW9uIGluIHBvb2xcbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgW29wdGlvbnMucG9vbC5taW49MF0gTWluaW11bSBudW1iZXIgb2YgY29ubmVjdGlvbiBpbiBwb29sXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgIFtvcHRpb25zLnBvb2wuaWRsZT0xMDAwMF0gVGhlIG1heGltdW0gdGltZSwgaW4gbWlsbGlzZWNvbmRzLCB0aGF0IGEgY29ubmVjdGlvbiBjYW4gYmUgaWRsZSBiZWZvcmUgYmVpbmcgcmVsZWFzZWQuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgIFtvcHRpb25zLnBvb2wuYWNxdWlyZT02MDAwMF0gVGhlIG1heGltdW0gdGltZSwgaW4gbWlsbGlzZWNvbmRzLCB0aGF0IHBvb2wgd2lsbCB0cnkgdG8gZ2V0IGNvbm5lY3Rpb24gYmVmb3JlIHRocm93aW5nIGVycm9yXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgIFtvcHRpb25zLnBvb2wuZXZpY3Q9MTAwMF0gVGhlIHRpbWUgaW50ZXJ2YWwsIGluIG1pbGxpc2Vjb25kcywgYWZ0ZXIgd2hpY2ggc2VxdWVsaXplLXBvb2wgd2lsbCByZW1vdmUgaWRsZSBjb25uZWN0aW9ucy5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMucG9vbC52YWxpZGF0ZV0gQSBmdW5jdGlvbiB0aGF0IHZhbGlkYXRlcyBhIGNvbm5lY3Rpb24uIENhbGxlZCB3aXRoIGNsaWVudC4gVGhlIGRlZmF1bHQgZnVuY3Rpb24gY2hlY2tzIHRoYXQgY2xpZW50IGlzIGFuIG9iamVjdCwgYW5kIHRoYXQgaXRzIHN0YXRlIGlzIG5vdCBkaXNjb25uZWN0ZWRcbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMucXVvdGVJZGVudGlmaWVycz10cnVlXSBTZXQgdG8gYGZhbHNlYCB0byBtYWtlIHRhYmxlIG5hbWVzIGFuZCBhdHRyaWJ1dGVzIGNhc2UtaW5zZW5zaXRpdmUgb24gUG9zdGdyZXMgYW5kIHNraXAgZG91YmxlIHF1b3Rpbmcgb2YgdGhlbS4gIFdBUk5JTkc6IFNldHRpbmcgdGhpcyB0byBmYWxzZSBtYXkgZXhwb3NlIHZ1bG5lcmFiaWxpdGllcyBhbmQgaXMgbm90IHJlY29tbWVuZGVkIVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy50cmFuc2FjdGlvblR5cGU9J0RFRkVSUkVEJ10gU2V0IHRoZSBkZWZhdWx0IHRyYW5zYWN0aW9uIHR5cGUuIFNlZSBgU2VxdWVsaXplLlRyYW5zYWN0aW9uLlRZUEVTYCBmb3IgcG9zc2libGUgb3B0aW9ucy4gU3FsaXRlIG9ubHkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLmlzb2xhdGlvbkxldmVsXSBTZXQgdGhlIGRlZmF1bHQgdHJhbnNhY3Rpb24gaXNvbGF0aW9uIGxldmVsLiBTZWUgYFNlcXVlbGl6ZS5UcmFuc2FjdGlvbi5JU09MQVRJT05fTEVWRUxTYCBmb3IgcG9zc2libGUgb3B0aW9ucy5cbiAgICogQHBhcmFtIHtPYmplY3R9ICAgW29wdGlvbnMucmV0cnldIFNldCBvZiBmbGFncyB0aGF0IGNvbnRyb2wgd2hlbiBhIHF1ZXJ5IGlzIGF1dG9tYXRpY2FsbHkgcmV0cmllZC5cbiAgICogQHBhcmFtIHtBcnJheX0gICAgW29wdGlvbnMucmV0cnkubWF0Y2hdIE9ubHkgcmV0cnkgYSBxdWVyeSBpZiB0aGUgZXJyb3IgbWF0Y2hlcyBvbmUgb2YgdGhlc2Ugc3RyaW5ncy5cbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgW29wdGlvbnMucmV0cnkubWF4XSBIb3cgbWFueSB0aW1lcyBhIGZhaWxpbmcgcXVlcnkgaXMgYXV0b21hdGljYWxseSByZXRyaWVkLiAgU2V0IHRvIDAgdG8gZGlzYWJsZSByZXRyeWluZyBvbiBTUUxfQlVTWSBlcnJvci5cbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMudHlwZVZhbGlkYXRpb249ZmFsc2VdIFJ1biBidWlsdC1pbiB0eXBlIHZhbGlkYXRvcnMgb24gaW5zZXJ0IGFuZCB1cGRhdGUsIGFuZCBzZWxlY3Qgd2l0aCB3aGVyZSBjbGF1c2UsIGUuZy4gdmFsaWRhdGUgdGhhdCBhcmd1bWVudHMgcGFzc2VkIHRvIGludGVnZXIgZmllbGRzIGFyZSBpbnRlZ2VyLWxpa2UuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIFtvcHRpb25zLm9wZXJhdG9yc0FsaWFzZXNdIFN0cmluZyBiYXNlZCBvcGVyYXRvciBhbGlhcy4gUGFzcyBvYmplY3QgdG8gbGltaXQgc2V0IG9mIGFsaWFzZWQgb3BlcmF0b3JzLlxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy5ob29rc10gQW4gb2JqZWN0IG9mIGdsb2JhbCBob29rIGZ1bmN0aW9ucyB0aGF0IGFyZSBjYWxsZWQgYmVmb3JlIGFuZCBhZnRlciBjZXJ0YWluIGxpZmVjeWNsZSBldmVudHMuIEdsb2JhbCBob29rcyB3aWxsIHJ1biBhZnRlciBhbnkgbW9kZWwtc3BlY2lmaWMgaG9va3MgZGVmaW5lZCBmb3IgdGhlIHNhbWUgZXZlbnQgKFNlZSBgU2VxdWVsaXplLk1vZGVsLmluaXQoKWAgZm9yIGEgbGlzdCkuICBBZGRpdGlvbmFsbHksIGBiZWZvcmVDb25uZWN0KClgLCBgYWZ0ZXJDb25uZWN0KClgLCBgYmVmb3JlRGlzY29ubmVjdCgpYCwgYW5kIGBhZnRlckRpc2Nvbm5lY3QoKWAgaG9va3MgbWF5IGJlIGRlZmluZWQgaGVyZS5cbiAgICogQHBhcmFtIHtib29sZWFufSAgW29wdGlvbnMubWluaWZ5QWxpYXNlcz1mYWxzZV0gQSBmbGFnIHRoYXQgZGVmaW5lcyBpZiBhbGlhc2VzIHNob3VsZCBiZSBtaW5pZmllZCAobW9zdGx5IHVzZWZ1bCB0byBhdm9pZCBQb3N0Z3JlcyBhbGlhcyBjaGFyYWN0ZXIgbGltaXQgb2YgNjQpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gIFtvcHRpb25zLmxvZ1F1ZXJ5UGFyYW1ldGVycz1mYWxzZV0gQSBmbGFnIHRoYXQgZGVmaW5lcyBpZiBzaG93IGJpbmQgcGF0YW1ldGVycyBpbiBsb2cuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihkYXRhYmFzZSwgdXNlcm5hbWUsIHBhc3N3b3JkLCBvcHRpb25zKSB7XG4gICAgbGV0IGNvbmZpZztcblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHR5cGVvZiBkYXRhYmFzZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgLy8gbmV3IFNlcXVlbGl6ZSh7IC4uLiBvcHRpb25zIH0pXG4gICAgICBvcHRpb25zID0gZGF0YWJhc2U7XG4gICAgICBjb25maWcgPSBfLnBpY2soXG4gICAgICAgIG9wdGlvbnMsXG4gICAgICAgIFwiaG9zdFwiLFxuICAgICAgICBcInBvcnRcIixcbiAgICAgICAgXCJkYXRhYmFzZVwiLFxuICAgICAgICBcInVzZXJuYW1lXCIsXG4gICAgICAgIFwicGFzc3dvcmRcIlxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdHlwZW9mIGRhdGFiYXNlID09PSBcInN0cmluZ1wiKSB8fFxuICAgICAgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIgJiYgdHlwZW9mIHVzZXJuYW1lID09PSBcIm9iamVjdFwiKVxuICAgICkge1xuICAgICAgLy8gbmV3IFNlcXVlbGl6ZShVUkksIHsgLi4uIG9wdGlvbnMgfSlcblxuICAgICAgY29uZmlnID0ge307XG4gICAgICBvcHRpb25zID0gdXNlcm5hbWUgfHwge307XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG5ldyBTZXF1ZWxpemUoZGF0YWJhc2UsIHVzZXJuYW1lLCBwYXNzd29yZCwgeyAuLi4gb3B0aW9ucyB9KVxuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICBjb25maWcgPSB7IGRhdGFiYXNlLCB1c2VybmFtZSwgcGFzc3dvcmQgfTtcbiAgICB9XG5cbiAgICBTZXF1ZWxpemUucnVuSG9va3MoXCJiZWZvcmVJbml0XCIsIGNvbmZpZywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge1xuICAgICAgICBkaWFsZWN0OiBcInNxbGl0ZVwiLFxuICAgICAgICBkaWFsZWN0TW9kdWxlOiBudWxsLFxuICAgICAgICBkaWFsZWN0TW9kdWxlUGF0aDogbnVsbCxcbiAgICAgICAgaG9zdDogXCJsb2NhbGhvc3RcIixcbiAgICAgICAgcHJvdG9jb2w6IFwidGNwXCIsXG4gICAgICAgIGRlZmluZToge30sXG4gICAgICAgIHF1ZXJ5OiB7fSxcbiAgICAgICAgc3luYzoge30sXG4gICAgICAgIHRpbWV6b25lOiBcIiswMDowMFwiLFxuICAgICAgICBjbGllbnRNaW5NZXNzYWdlczogXCJ3YXJuaW5nXCIsXG4gICAgICAgIHN0YW5kYXJkQ29uZm9ybWluZ1N0cmluZ3M6IHRydWUsXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgIGxvZ2dpbmc6IGNvbnNvbGUubG9nLFxuICAgICAgICBvbWl0TnVsbDogZmFsc2UsXG4gICAgICAgIG5hdGl2ZTogZmFsc2UsXG4gICAgICAgIHJlcGxpY2F0aW9uOiBmYWxzZSxcbiAgICAgICAgc3NsOiB1bmRlZmluZWQsXG4gICAgICAgIHBvb2w6IHt9LFxuICAgICAgICBxdW90ZUlkZW50aWZpZXJzOiB0cnVlLFxuICAgICAgICBob29rczoge30sXG4gICAgICAgIHJldHJ5OiB7XG4gICAgICAgICAgbWF4OiA1LFxuICAgICAgICAgIG1hdGNoOiBbXCJTUUxJVEVfQlVTWTogZGF0YWJhc2UgaXMgbG9ja2VkXCJdXG4gICAgICAgIH0sXG4gICAgICAgIHRyYW5zYWN0aW9uVHlwZTogVHJhbnNhY3Rpb24uVFlQRVMuREVGRVJSRUQsXG4gICAgICAgIGlzb2xhdGlvbkxldmVsOiBudWxsLFxuICAgICAgICBkYXRhYmFzZVZlcnNpb246IDAsXG4gICAgICAgIHR5cGVWYWxpZGF0aW9uOiBmYWxzZSxcbiAgICAgICAgYmVuY2htYXJrOiBmYWxzZSxcbiAgICAgICAgbWluaWZ5QWxpYXNlczogZmFsc2UsXG4gICAgICAgIGxvZ1F1ZXJ5UGFyYW1ldGVyczogZmFsc2VcbiAgICAgIH0sXG4gICAgICBvcHRpb25zIHx8IHt9XG4gICAgKTtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLmRpYWxlY3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpYWxlY3QgbmVlZHMgdG8gYmUgZXhwbGljaXRseSBzdXBwbGllZCBhcyBvZiB2NC4wLjBcIik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kaWFsZWN0ID09PSBcInBvc3RncmVzcWxcIikge1xuICAgICAgdGhpcy5vcHRpb25zLmRpYWxlY3QgPSBcInBvc3RncmVzXCI7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5vcHRpb25zLmRpYWxlY3QgPT09IFwic3FsaXRlXCIgJiZcbiAgICAgIHRoaXMub3B0aW9ucy50aW1lem9uZSAhPT0gXCIrMDA6MDBcIlxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIlNldHRpbmcgYSBjdXN0b20gdGltZXpvbmUgaXMgbm90IHN1cHBvcnRlZCBieSBTUUxpdGUsIGRhdGVzIGFyZSBhbHdheXMgcmV0dXJuZWQgYXMgVVRDLiBQbGVhc2UgcmVtb3ZlIHRoZSBjdXN0b20gdGltZXpvbmUgcGFyYW1ldGVyLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMubG9nZ2luZyA9PT0gdHJ1ZSkge1xuICAgICAgZGVwcmVjYXRpb25zLm5vVHJ1ZUxvZ2dpbmcoKTtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICB0aGlzLm9wdGlvbnMubG9nZ2luZyA9IGNvbnNvbGUubG9nO1xuICAgIH1cblxuICAgIHRoaXMuX3NldHVwSG9va3Mob3B0aW9ucy5ob29rcyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIGRhdGFiYXNlOiBjb25maWcuZGF0YWJhc2UgfHwgdGhpcy5vcHRpb25zLmRhdGFiYXNlLFxuICAgICAgdXNlcm5hbWU6IGNvbmZpZy51c2VybmFtZSB8fCB0aGlzLm9wdGlvbnMudXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogY29uZmlnLnBhc3N3b3JkIHx8IHRoaXMub3B0aW9ucy5wYXNzd29yZCB8fCBudWxsLFxuICAgICAgaG9zdDogY29uZmlnLmhvc3QgfHwgdGhpcy5vcHRpb25zLmhvc3QsXG4gICAgICBwb3J0OiBjb25maWcucG9ydCB8fCB0aGlzLm9wdGlvbnMucG9ydCxcbiAgICAgIHBvb2w6IHRoaXMub3B0aW9ucy5wb29sLFxuICAgICAgcHJvdG9jb2w6IHRoaXMub3B0aW9ucy5wcm90b2NvbCxcbiAgICAgIG5hdGl2ZTogdGhpcy5vcHRpb25zLm5hdGl2ZSxcbiAgICAgIHNzbDogdGhpcy5vcHRpb25zLnNzbCxcbiAgICAgIHJlcGxpY2F0aW9uOiB0aGlzLm9wdGlvbnMucmVwbGljYXRpb24sXG4gICAgICBkaWFsZWN0TW9kdWxlOiB0aGlzLm9wdGlvbnMuZGlhbGVjdE1vZHVsZSxcbiAgICAgIGRpYWxlY3RNb2R1bGVQYXRoOiB0aGlzLm9wdGlvbnMuZGlhbGVjdE1vZHVsZVBhdGgsXG4gICAgICBrZWVwRGVmYXVsdFRpbWV6b25lOiB0aGlzLm9wdGlvbnMua2VlcERlZmF1bHRUaW1lem9uZSxcbiAgICAgIGRpYWxlY3RPcHRpb25zOiB0aGlzLm9wdGlvbnMuZGlhbGVjdE9wdGlvbnNcbiAgICB9O1xuXG4gICAgbGV0IERpYWxlY3Q7XG4gICAgLy8gUmVxdWlyaW5nIHRoZSBkaWFsZWN0IGluIGEgc3dpdGNoLWNhc2UgdG8ga2VlcCB0aGVcbiAgICAvLyByZXF1aXJlIGNhbGxzIHN0YXRpYy4gKEJyb3dzZXJpZnkgZml4KVxuICAgIHN3aXRjaCAodGhpcy5nZXREaWFsZWN0KCkpIHtcbiAgICAgIGNhc2UgXCJzcWxpdGVcIjpcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgIERpYWxlY3QgPSByZXF1aXJlKFwiLi9kaWFsZWN0cy9zcWxpdGVcIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBUaGUgZGlhbGVjdCAke3RoaXMuZ2V0RGlhbGVjdCgpfSBpcyBub3Qgc3VwcG9ydGVkLiBTdXBwb3J0ZWQgZGlhbGVjdHM6IHNxbGl0ZS5gXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5kaWFsZWN0ID0gbmV3IERpYWxlY3QodGhpcyk7XG4gICAgdGhpcy5kaWFsZWN0LlF1ZXJ5R2VuZXJhdG9yLnR5cGVWYWxpZGF0aW9uID0gb3B0aW9ucy50eXBlVmFsaWRhdGlvbjtcblxuICAgIGlmIChfLmlzUGxhaW5PYmplY3QodGhpcy5vcHRpb25zLm9wZXJhdG9yc0FsaWFzZXMpKSB7XG4gICAgICBkZXByZWNhdGlvbnMubm9TdHJpbmdPcGVyYXRvcnMoKTtcbiAgICAgIHRoaXMuZGlhbGVjdC5RdWVyeUdlbmVyYXRvci5zZXRPcGVyYXRvcnNBbGlhc2VzKFxuICAgICAgICB0aGlzLm9wdGlvbnMub3BlcmF0b3JzQWxpYXNlc1xuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub3BlcmF0b3JzQWxpYXNlcyA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgIGRlcHJlY2F0aW9ucy5ub0Jvb2xPcGVyYXRvckFsaWFzZXMoKTtcbiAgICB9XG5cbiAgICB0aGlzLnF1ZXJ5SW50ZXJmYWNlID0gbmV3IFF1ZXJ5SW50ZXJmYWNlKHRoaXMpO1xuXG4gICAgLyoqXG4gICAgICogTW9kZWxzIGFyZSBzdG9yZWQgaGVyZSB1bmRlciB0aGUgbmFtZSBnaXZlbiB0byBgc2VxdWVsaXplLmRlZmluZWBcbiAgICAgKi9cbiAgICB0aGlzLm1vZGVscyA9IHt9O1xuICAgIHRoaXMubW9kZWxNYW5hZ2VyID0gbmV3IE1vZGVsTWFuYWdlcih0aGlzKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyID0gdGhpcy5kaWFsZWN0LmNvbm5lY3Rpb25NYW5hZ2VyO1xuXG4gICAgdGhpcy5pbXBvcnRDYWNoZSA9IHt9O1xuXG4gICAgU2VxdWVsaXplLnJ1bkhvb2tzKFwiYWZ0ZXJJbml0XCIsIHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggZGF0YSB0eXBlcyBhbmQgcGFyc2Vycy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHJlZnJlc2hUeXBlcygpIHtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLnJlZnJlc2hUeXBlUGFyc2VyKERhdGFUeXBlcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3BlY2lmaWVkIGRpYWxlY3QuXG4gICAqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBzcGVjaWZpZWQgZGlhbGVjdC5cbiAgICovXG4gIGdldERpYWxlY3QoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5kaWFsZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGRhdGFiYXNlIG5hbWUuXG4gICAqXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBkYXRhYmFzZSBuYW1lLlxuICAgKi9cbiAgZ2V0RGF0YWJhc2VOYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5kYXRhYmFzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIFF1ZXJ5SW50ZXJmYWNlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UXVlcnlJbnRlcmZhY2V9IEFuIGluc3RhbmNlIChzaW5nbGV0b24pIG9mIFF1ZXJ5SW50ZXJmYWNlLlxuICAgKi9cbiAgZ2V0UXVlcnlJbnRlcmZhY2UoKSB7XG4gICAgdGhpcy5xdWVyeUludGVyZmFjZSA9IHRoaXMucXVlcnlJbnRlcmZhY2UgfHwgbmV3IFF1ZXJ5SW50ZXJmYWNlKHRoaXMpO1xuICAgIHJldHVybiB0aGlzLnF1ZXJ5SW50ZXJmYWNlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlZmluZSBhIG5ldyBtb2RlbCwgcmVwcmVzZW50aW5nIGEgdGFibGUgaW4gdGhlIGRhdGFiYXNlLlxuICAgKlxuICAgKiBUaGUgdGFibGUgY29sdW1ucyBhcmUgZGVmaW5lZCBieSB0aGUgb2JqZWN0IHRoYXQgaXMgZ2l2ZW4gYXMgdGhlIHNlY29uZCBhcmd1bWVudC4gRWFjaCBrZXkgb2YgdGhlIG9iamVjdCByZXByZXNlbnRzIGEgY29sdW1uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlbE5hbWUgVGhlIG5hbWUgb2YgdGhlIG1vZGVsLiBUaGUgbW9kZWwgd2lsbCBiZSBzdG9yZWQgaW4gYHNlcXVlbGl6ZS5tb2RlbHNgIHVuZGVyIHRoaXMgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlcyBBbiBvYmplY3QsIHdoZXJlIGVhY2ggYXR0cmlidXRlIGlzIGEgY29sdW1uIG9mIHRoZSB0YWJsZS4gU2VlIHtAbGluayBNb2RlbC5pbml0fVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZXNlIG9wdGlvbnMgYXJlIG1lcmdlZCB3aXRoIHRoZSBkZWZhdWx0IGRlZmluZSBvcHRpb25zIHByb3ZpZGVkIHRvIHRoZSBTZXF1ZWxpemUgY29uc3RydWN0b3IgYW5kIHBhc3NlZCB0byBNb2RlbC5pbml0KClcbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuaW5pdH0gZm9yIGEgbW9yZSBjb21wcmVoZW5zaXZlIHNwZWNpZmljYXRpb24gb2YgdGhlIGBvcHRpb25zYCBhbmQgYGF0dHJpYnV0ZXNgIG9iamVjdHMuXG4gICAqIEBzZWUgPGEgaHJlZj1cIi9tYW51YWwvdHV0b3JpYWwvbW9kZWxzLWRlZmluaXRpb24uaHRtbFwiPk1vZGVsIGRlZmluaXRpb248L2E+IE1hbnVhbCByZWxhdGVkIHRvIG1vZGVsIGRlZmluaXRpb25cbiAgICogQHNlZVxuICAgKiB7QGxpbmsgRGF0YVR5cGVzfSBGb3IgYSBsaXN0IG9mIHBvc3NpYmxlIGRhdGEgdHlwZXNcbiAgICpcbiAgICogQHJldHVybnMge01vZGVsfSBOZXdseSBkZWZpbmVkIG1vZGVsXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHNlcXVlbGl6ZS5kZWZpbmUoJ21vZGVsTmFtZScsIHtcbiAgICogICBjb2x1bW5BOiB7XG4gICAqICAgICAgIHR5cGU6IFNlcXVlbGl6ZS5CT09MRUFOLFxuICAgKiAgICAgICB2YWxpZGF0ZToge1xuICAgKiAgICAgICAgIGlzOiBbXCJbYS16XVwiLCdpJ10sICAgICAgICAvLyB3aWxsIG9ubHkgYWxsb3cgbGV0dGVyc1xuICAgKiAgICAgICAgIG1heDogMjMsICAgICAgICAgICAgICAgICAgLy8gb25seSBhbGxvdyB2YWx1ZXMgPD0gMjNcbiAgICogICAgICAgICBpc0luOiB7XG4gICAqICAgICAgICAgICBhcmdzOiBbWydlbicsICd6aCddXSxcbiAgICogICAgICAgICAgIG1zZzogXCJNdXN0IGJlIEVuZ2xpc2ggb3IgQ2hpbmVzZVwiXG4gICAqICAgICAgICAgfVxuICAgKiAgICAgICB9LFxuICAgKiAgICAgICBmaWVsZDogJ2NvbHVtbl9hJ1xuICAgKiAgIH0sXG4gICAqICAgY29sdW1uQjogU2VxdWVsaXplLlNUUklORyxcbiAgICogICBjb2x1bW5DOiAnTVkgVkVSWSBPV04gQ09MVU1OIFRZUEUnXG4gICAqIH0pO1xuICAgKlxuICAgKiBzZXF1ZWxpemUubW9kZWxzLm1vZGVsTmFtZSAvLyBUaGUgbW9kZWwgd2lsbCBub3cgYmUgYXZhaWxhYmxlIGluIG1vZGVscyB1bmRlciB0aGUgbmFtZSBnaXZlbiB0byBkZWZpbmVcbiAgICovXG4gIGRlZmluZShtb2RlbE5hbWUsIGF0dHJpYnV0ZXMsIG9wdGlvbnMgPSB7fSkge1xuICAgIG9wdGlvbnMubW9kZWxOYW1lID0gbW9kZWxOYW1lO1xuICAgIG9wdGlvbnMuc2VxdWVsaXplID0gdGhpcztcblxuICAgIGNvbnN0IG1vZGVsID0gY2xhc3MgZXh0ZW5kcyBNb2RlbCB7fTtcblxuICAgIG1vZGVsLmluaXQoYXR0cmlidXRlcywgb3B0aW9ucyk7XG5cbiAgICByZXR1cm4gbW9kZWw7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYSBNb2RlbCB3aGljaCBpcyBhbHJlYWR5IGRlZmluZWRcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1vZGVsTmFtZSBUaGUgbmFtZSBvZiBhIG1vZGVsIGRlZmluZWQgd2l0aCBTZXF1ZWxpemUuZGVmaW5lXG4gICAqXG4gICAqIEB0aHJvd3MgV2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgbW9kZWwgaXMgbm90IGRlZmluZWQgKHRoYXQgaXMsIGlmIHNlcXVlbGl6ZSNpc0RlZmluZWQgcmV0dXJucyBmYWxzZSlcbiAgICogQHJldHVybnMge01vZGVsfSBTcGVjaWZpZWQgbW9kZWxcbiAgICovXG4gIG1vZGVsKG1vZGVsTmFtZSkge1xuICAgIGlmICghdGhpcy5pc0RlZmluZWQobW9kZWxOYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke21vZGVsTmFtZX0gaGFzIG5vdCBiZWVuIGRlZmluZWRgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tb2RlbE1hbmFnZXIuZ2V0TW9kZWwobW9kZWxOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciBhIG1vZGVsIHdpdGggdGhlIGdpdmVuIG5hbWUgaXMgZGVmaW5lZFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW9kZWxOYW1lIFRoZSBuYW1lIG9mIGEgbW9kZWwgZGVmaW5lZCB3aXRoIFNlcXVlbGl6ZS5kZWZpbmVcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiBtb2RlbCBpcyBhbHJlYWR5IGRlZmluZWQsIG90aGVyd2lzZSBmYWxzZVxuICAgKi9cbiAgaXNEZWZpbmVkKG1vZGVsTmFtZSkge1xuICAgIHJldHVybiAhIXRoaXMubW9kZWxNYW5hZ2VyLm1vZGVscy5maW5kKG1vZGVsID0+IG1vZGVsLm5hbWUgPT09IG1vZGVsTmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0cyBhIG1vZGVsIGRlZmluZWQgaW4gYW5vdGhlciBmaWxlLiBJbXBvcnRlZCBtb2RlbHMgYXJlIGNhY2hlZCwgc28gbXVsdGlwbGVcbiAgICogY2FsbHMgdG8gaW1wb3J0IHdpdGggdGhlIHNhbWUgcGF0aCB3aWxsIG5vdCBsb2FkIHRoZSBmaWxlIG11bHRpcGxlIHRpbWVzLlxuICAgKlxuICAgKiBAdHV0b3JpYWwgaHR0cHM6Ly9naXRodWIuY29tL3NlcXVlbGl6ZS9leHByZXNzLWV4YW1wbGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGltcG9ydFBhdGggVGhlIHBhdGggdG8gdGhlIGZpbGUgdGhhdCBob2xkcyB0aGUgbW9kZWwgeW91IHdhbnQgdG8gaW1wb3J0LiBJZiB0aGUgcGFydCBpcyByZWxhdGl2ZSwgaXQgd2lsbCBiZSByZXNvbHZlZCByZWxhdGl2ZWx5IHRvIHRoZSBjYWxsaW5nIGZpbGVcbiAgICpcbiAgICogQHJldHVybnMge01vZGVsfSBJbXBvcnRlZCBtb2RlbCwgcmV0dXJuZWQgZnJvbSBjYWNoZSBpZiB3YXMgYWxyZWFkeSBpbXBvcnRlZFxuICAgKi9cbiAgaW1wb3J0KGltcG9ydFBhdGgpIHt9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgYSBxdWVyeSBvbiB0aGUgREIsIG9wdGlvbmFsbHkgYnlwYXNzaW5nIGFsbCB0aGUgU2VxdWVsaXplIGdvb2RuZXNzLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB0aGUgZnVuY3Rpb24gd2lsbCByZXR1cm4gdHdvIGFyZ3VtZW50czogYW4gYXJyYXkgb2YgcmVzdWx0cywgYW5kIGEgbWV0YWRhdGEgb2JqZWN0LCBjb250YWluaW5nIG51bWJlciBvZiBhZmZlY3RlZCByb3dzIGV0Yy5cbiAgICpcbiAgICogSWYgeW91IGFyZSBydW5uaW5nIGEgdHlwZSBvZiBxdWVyeSB3aGVyZSB5b3UgZG9uJ3QgbmVlZCB0aGUgbWV0YWRhdGEsIGZvciBleGFtcGxlIGEgYFNFTEVDVGAgcXVlcnksIHlvdSBjYW4gcGFzcyBpbiBhIHF1ZXJ5IHR5cGUgdG8gbWFrZSBzZXF1ZWxpemUgZm9ybWF0IHRoZSByZXN1bHRzOlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBzZXF1ZWxpemUucXVlcnkoJ1NFTEVDVC4uLicpLnRoZW4oKFtyZXN1bHRzLCBtZXRhZGF0YV0pID0+IHtcbiAgICogICAvLyBSYXcgcXVlcnkgLSB1c2UgdGhlbiBwbHVzIGFycmF5IHNwcmVhZFxuICAgKiB9KTtcbiAgICpcbiAgICogc2VxdWVsaXplLnF1ZXJ5KCdTRUxFQ1QuLi4nLCB7IHR5cGU6IHNlcXVlbGl6ZS5RdWVyeVR5cGVzLlNFTEVDVCB9KS50aGVuKHJlc3VsdHMgPT4ge1xuICAgKiAgIC8vIFNFTEVDVCBxdWVyeSAtIHVzZSB0aGVuXG4gICAqIH0pXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgc3FsXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICBbb3B0aW9ucz17fV0gUXVlcnkgb3B0aW9ucy5cbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgIFtvcHRpb25zLnJhd10gSWYgdHJ1ZSwgc2VxdWVsaXplIHdpbGwgbm90IHRyeSB0byBmb3JtYXQgdGhlIHJlc3VsdHMgb2YgdGhlIHF1ZXJ5LCBvciBidWlsZCBhbiBpbnN0YW5jZSBvZiBhIG1vZGVsIGZyb20gdGhlIHJlc3VsdFxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSAgICAgW29wdGlvbnMudHJhbnNhY3Rpb249bnVsbF0gVGhlIHRyYW5zYWN0aW9uIHRoYXQgdGhlIHF1ZXJ5IHNob3VsZCBiZSBleGVjdXRlZCB1bmRlclxuICAgKiBAcGFyYW0ge1F1ZXJ5VHlwZXN9ICAgICAgW29wdGlvbnMudHlwZT0nUkFXJ10gVGhlIHR5cGUgb2YgcXVlcnkgeW91IGFyZSBleGVjdXRpbmcuIFRoZSBxdWVyeSB0eXBlIGFmZmVjdHMgaG93IHJlc3VsdHMgYXJlIGZvcm1hdHRlZCBiZWZvcmUgdGhleSBhcmUgcGFzc2VkIGJhY2suIFRoZSB0eXBlIGlzIGEgc3RyaW5nLCBidXQgYFNlcXVlbGl6ZS5RdWVyeVR5cGVzYCBpcyBwcm92aWRlZCBhcyBjb252ZW5pZW5jZSBzaG9ydGN1dHMuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICBbb3B0aW9ucy5uZXN0PWZhbHNlXSBJZiB0cnVlLCB0cmFuc2Zvcm1zIG9iamVjdHMgd2l0aCBgLmAgc2VwYXJhdGVkIHByb3BlcnR5IG5hbWVzIGludG8gbmVzdGVkIG9iamVjdHMgdXNpbmcgW2RvdHRpZS5qc10oaHR0cHM6Ly9naXRodWIuY29tL21pY2toYW5zZW4vZG90dGllLmpzKS4gRm9yIGV4YW1wbGUgeyAndXNlci51c2VybmFtZSc6ICdqb2huJyB9IGJlY29tZXMgeyB1c2VyOiB7IHVzZXJuYW1lOiAnam9obicgfX0uIFdoZW4gYG5lc3RgIGlzIHRydWUsIHRoZSBxdWVyeSB0eXBlIGlzIGFzc3VtZWQgdG8gYmUgYCdTRUxFQ1QnYCwgdW5sZXNzIG90aGVyd2lzZSBzcGVjaWZpZWRcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgIFtvcHRpb25zLnBsYWluPWZhbHNlXSBTZXRzIHRoZSBxdWVyeSB0eXBlIHRvIGBTRUxFQ1RgIGFuZCByZXR1cm4gYSBzaW5nbGUgcm93XG4gICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSAgICBbb3B0aW9ucy5yZXBsYWNlbWVudHNdIEVpdGhlciBhbiBvYmplY3Qgb2YgbmFtZWQgcGFyYW1ldGVyIHJlcGxhY2VtZW50cyBpbiB0aGUgZm9ybWF0IGA6cGFyYW1gIG9yIGFuIGFycmF5IG9mIHVubmFtZWQgcmVwbGFjZW1lbnRzIHRvIHJlcGxhY2UgYD9gIGluIHlvdXIgU1FMLlxuICAgKiBAcGFyYW0ge09iamVjdHxBcnJheX0gICAgW29wdGlvbnMuYmluZF0gRWl0aGVyIGFuIG9iamVjdCBvZiBuYW1lZCBiaW5kIHBhcmFtZXRlciBpbiB0aGUgZm9ybWF0IGBfcGFyYW1gIG9yIGFuIGFycmF5IG9mIHVubmFtZWQgYmluZCBwYXJhbWV0ZXIgdG8gcmVwbGFjZSBgJDEsICQyLCAuLi5gIGluIHlvdXIgU1FMLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMudXNlTWFzdGVyPWZhbHNlXSBGb3JjZSB0aGUgcXVlcnkgdG8gdXNlIHRoZSB3cml0ZSBwb29sLCByZWdhcmRsZXNzIG9mIHRoZSBxdWVyeSB0eXBlLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXG4gICAqIEBwYXJhbSB7bmV3IE1vZGVsKCl9ICAgICBbb3B0aW9ucy5pbnN0YW5jZV0gQSBzZXF1ZWxpemUgaW5zdGFuY2UgdXNlZCB0byBidWlsZCB0aGUgcmV0dXJuIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TW9kZWx9ICAgICAgICAgICBbb3B0aW9ucy5tb2RlbF0gQSBzZXF1ZWxpemUgbW9kZWwgdXNlZCB0byBidWlsZCB0aGUgcmV0dXJuZWQgbW9kZWwgaW5zdGFuY2VzICh1c2VkIHRvIGJlIGNhbGxlZCBjYWxsZWUpXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICBbb3B0aW9ucy5yZXRyeV0gU2V0IG9mIGZsYWdzIHRoYXQgY29udHJvbCB3aGVuIGEgcXVlcnkgaXMgYXV0b21hdGljYWxseSByZXRyaWVkLlxuICAgKiBAcGFyYW0ge0FycmF5fSAgICAgICAgICAgW29wdGlvbnMucmV0cnkubWF0Y2hdIE9ubHkgcmV0cnkgYSBxdWVyeSBpZiB0aGUgZXJyb3IgbWF0Y2hlcyBvbmUgb2YgdGhlc2Ugc3RyaW5ncy5cbiAgICogQHBhcmFtIHtJbnRlZ2VyfSAgICAgICAgIFtvcHRpb25zLnJldHJ5Lm1heF0gSG93IG1hbnkgdGltZXMgYSBmYWlsaW5nIHF1ZXJ5IGlzIGF1dG9tYXRpY2FsbHkgcmV0cmllZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIFtvcHRpb25zLnNlYXJjaFBhdGg9REVGQVVMVF0gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgIFtvcHRpb25zLnN1cHBvcnRzU2VhcmNoUGF0aF0gSWYgZmFsc2UgZG8gbm90IHByZXBlbmQgdGhlIHF1ZXJ5IHdpdGggdGhlIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMubWFwVG9Nb2RlbD1mYWxzZV0gTWFwIHJldHVybmVkIGZpZWxkcyB0byBtb2RlbCdzIGZpZWxkcyBpZiBgb3B0aW9ucy5tb2RlbGAgb3IgYG9wdGlvbnMuaW5zdGFuY2VgIGlzIHByZXNlbnQuIE1hcHBpbmcgd2lsbCBvY2N1ciBiZWZvcmUgYnVpbGRpbmcgdGhlIG1vZGVsIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgW29wdGlvbnMuZmllbGRNYXBdIE1hcCByZXR1cm5lZCBmaWVsZHMgdG8gYXJiaXRyYXJ5IG5hbWVzIGZvciBgU0VMRUNUYCBxdWVyeSB0eXBlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgTW9kZWwuYnVpbGR9IGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IGluc3RhbmNlIG9wdGlvbi5cbiAgICovXG5cbiAgcXVlcnkoc3FsLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMub3B0aW9ucy5xdWVyeSwgb3B0aW9ucyk7XG5cbiAgICBpZiAob3B0aW9ucy5pbnN0YW5jZSAmJiAhb3B0aW9ucy5tb2RlbCkge1xuICAgICAgb3B0aW9ucy5tb2RlbCA9IG9wdGlvbnMuaW5zdGFuY2UuY29uc3RydWN0b3I7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLmluc3RhbmNlICYmICFvcHRpb25zLm1vZGVsKSB7XG4gICAgICBvcHRpb25zLnJhdyA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gbWFwIHJhdyBmaWVsZHMgdG8gbW9kZWwgYXR0cmlidXRlc1xuICAgIGlmIChvcHRpb25zLm1hcFRvTW9kZWwpIHtcbiAgICAgIG9wdGlvbnMuZmllbGRNYXAgPSBfLmdldChvcHRpb25zLCBcIm1vZGVsLmZpZWxkQXR0cmlidXRlTWFwXCIsIHt9KTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gXy5kZWZhdWx0cyhvcHRpb25zLCB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgbG9nZ2luZzogT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMub3B0aW9ucywgXCJsb2dnaW5nXCIpXG4gICAgICAgID8gdGhpcy5vcHRpb25zLmxvZ2dpbmdcbiAgICAgICAgOiBjb25zb2xlLmxvZyxcbiAgICAgIHNlYXJjaFBhdGg6IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChcbiAgICAgICAgdGhpcy5vcHRpb25zLFxuICAgICAgICBcInNlYXJjaFBhdGhcIlxuICAgICAgKVxuICAgICAgICA/IHRoaXMub3B0aW9ucy5zZWFyY2hQYXRoXG4gICAgICAgIDogXCJERUZBVUxUXCJcbiAgICB9KTtcblxuICAgIGlmICghb3B0aW9ucy50eXBlKSB7XG4gICAgICBpZiAob3B0aW9ucy5tb2RlbCB8fCBvcHRpb25zLm5lc3QgfHwgb3B0aW9ucy5wbGFpbikge1xuICAgICAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLlNFTEVDVDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdGlvbnMudHlwZSA9IFF1ZXJ5VHlwZXMuUkFXO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vaWYgZGlhbGVjdCBkb2Vzbid0IHN1cHBvcnQgc2VhcmNoX3BhdGggb3IgZGlhbGVjdCBvcHRpb25cbiAgICAvL3RvIHByZXBlbmQgc2VhcmNoUGF0aCBpcyBub3QgdHJ1ZSBkZWxldGUgdGhlIHNlYXJjaFBhdGggb3B0aW9uXG4gICAgaWYgKFxuICAgICAgIXRoaXMuZGlhbGVjdC5zdXBwb3J0cy5zZWFyY2hQYXRoIHx8XG4gICAgICAhdGhpcy5vcHRpb25zLmRpYWxlY3RPcHRpb25zIHx8XG4gICAgICAhdGhpcy5vcHRpb25zLmRpYWxlY3RPcHRpb25zLnByZXBlbmRTZWFyY2hQYXRoIHx8XG4gICAgICBvcHRpb25zLnN1cHBvcnRzU2VhcmNoUGF0aCA9PT0gZmFsc2VcbiAgICApIHtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLnNlYXJjaFBhdGg7XG4gICAgfSBlbHNlIGlmICghb3B0aW9ucy5zZWFyY2hQYXRoKSB7XG4gICAgICAvL2lmIHVzZXIgd2FudHMgdG8gYWx3YXlzIHByZXBlbmQgc2VhcmNoUGF0aCAoZGlhbGVjdE9wdGlvbnMucHJlcHJlbmRTZWFyY2hQYXRoID0gdHJ1ZSlcbiAgICAgIC8vdGhlbiBzZXQgdG8gREVGQVVMVCBpZiBub25lIGlzIHByb3ZpZGVkXG4gICAgICBvcHRpb25zLnNlYXJjaFBhdGggPSBcIkRFRkFVTFRcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBzcWwgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgaWYgKHNxbC52YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmIChvcHRpb25zLnJlcGxhY2VtZW50cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIFwiQm90aCBgc3FsLnZhbHVlc2AgYW5kIGBvcHRpb25zLnJlcGxhY2VtZW50c2AgY2Fubm90IGJlIHNldCBhdCB0aGUgc2FtZSB0aW1lXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG9wdGlvbnMucmVwbGFjZW1lbnRzID0gc3FsLnZhbHVlcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzcWwuYmluZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuYmluZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIFwiQm90aCBgc3FsLmJpbmRgIGFuZCBgb3B0aW9ucy5iaW5kYCBjYW5ub3QgYmUgc2V0IGF0IHRoZSBzYW1lIHRpbWVcIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgb3B0aW9ucy5iaW5kID0gc3FsLmJpbmQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3FsLnF1ZXJ5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBzcWwgPSBzcWwucXVlcnk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc3FsID0gc3FsLnRyaW0oKTtcblxuICAgICAgaWYgKG9wdGlvbnMucmVwbGFjZW1lbnRzICYmIG9wdGlvbnMuYmluZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJCb3RoIGByZXBsYWNlbWVudHNgIGFuZCBgYmluZGAgY2Fubm90IGJlIHNldCBhdCB0aGUgc2FtZSB0aW1lXCJcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMucmVwbGFjZW1lbnRzKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucmVwbGFjZW1lbnRzKSkge1xuICAgICAgICAgIHNxbCA9IFV0aWxzLmZvcm1hdChcbiAgICAgICAgICAgIFtzcWxdLmNvbmNhdChvcHRpb25zLnJlcGxhY2VtZW50cyksXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZGlhbGVjdFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3FsID0gVXRpbHMuZm9ybWF0TmFtZWRQYXJhbWV0ZXJzKFxuICAgICAgICAgICAgc3FsLFxuICAgICAgICAgICAgb3B0aW9ucy5yZXBsYWNlbWVudHMsXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZGlhbGVjdFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGV0IGJpbmRQYXJhbWV0ZXJzO1xuXG4gICAgICBpZiAob3B0aW9ucy5iaW5kKSB7XG4gICAgICAgIFtzcWwsIGJpbmRQYXJhbWV0ZXJzXSA9IHRoaXMuZGlhbGVjdC5RdWVyeS5mb3JtYXRCaW5kUGFyYW1ldGVycyhcbiAgICAgICAgICBzcWwsXG4gICAgICAgICAgb3B0aW9ucy5iaW5kLFxuICAgICAgICAgIHRoaXMub3B0aW9ucy5kaWFsZWN0XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNoZWNrVHJhbnNhY3Rpb24gPSAoKSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBvcHRpb25zLnRyYW5zYWN0aW9uICYmXG4gICAgICAgICAgb3B0aW9ucy50cmFuc2FjdGlvbi5maW5pc2hlZCAmJlxuICAgICAgICAgICFvcHRpb25zLmNvbXBsZXRlc1RyYW5zYWN0aW9uXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICAgICAgYCR7b3B0aW9ucy50cmFuc2FjdGlvbi5maW5pc2hlZH0gaGFzIGJlZW4gY2FsbGVkIG9uIHRoaXMgdHJhbnNhY3Rpb24oJHtvcHRpb25zLnRyYW5zYWN0aW9uLmlkfSksIHlvdSBjYW4gbm8gbG9uZ2VyIHVzZSBpdC4gKFRoZSByZWplY3RlZCBxdWVyeSBpcyBhdHRhY2hlZCBhcyB0aGUgJ3NxbCcgcHJvcGVydHkgb2YgdGhpcyBlcnJvcilgXG4gICAgICAgICAgKTtcbiAgICAgICAgICBlcnJvci5zcWwgPSBzcWw7XG4gICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJldHJ5T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICAgIHt9LFxuICAgICAgICB0aGlzLm9wdGlvbnMucmV0cnksXG4gICAgICAgIG9wdGlvbnMucmV0cnkgfHwge31cbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoXG4gICAgICAgIHJldHJ5KFxuICAgICAgICAgICgpID0+XG4gICAgICAgICAgICBQcm9taXNlLnRyeSgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChvcHRpb25zLnRyYW5zYWN0aW9uID09PSB1bmRlZmluZWQgJiYgU2VxdWVsaXplLl9jbHMpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRyYW5zYWN0aW9uID0gU2VxdWVsaXplLl9jbHMuZ2V0KFwidHJhbnNhY3Rpb25cIik7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjaGVja1RyYW5zYWN0aW9uKCk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMudHJhbnNhY3Rpb25cbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMudHJhbnNhY3Rpb24uY29ubmVjdGlvblxuICAgICAgICAgICAgICAgIDogdGhpcy5jb25uZWN0aW9uTWFuYWdlci5nZXRDb25uZWN0aW9uKG9wdGlvbnMpO1xuICAgICAgICAgICAgfSkudGhlbihjb25uZWN0aW9uID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBuZXcgdGhpcy5kaWFsZWN0LlF1ZXJ5KGNvbm5lY3Rpb24sIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcyhcImJlZm9yZVF1ZXJ5XCIsIG9wdGlvbnMsIHF1ZXJ5KVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGNoZWNrVHJhbnNhY3Rpb24oKSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBxdWVyeS5ydW4oc3FsLCBiaW5kUGFyYW1ldGVycykpXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4gdGhpcy5ydW5Ib29rcyhcImFmdGVyUXVlcnlcIiwgb3B0aW9ucywgcXVlcnkpKVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy50cmFuc2FjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uTWFuYWdlci5yZWxlYXNlQ29ubmVjdGlvbihjb25uZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIHJldHJ5T3B0aW9uc1xuICAgICAgICApXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgYSBxdWVyeSB3aGljaCB3b3VsZCBzZXQgYW4gZW52aXJvbm1lbnQgb3IgdXNlciB2YXJpYWJsZS4gVGhlIHZhcmlhYmxlcyBhcmUgc2V0IHBlciBjb25uZWN0aW9uLCBzbyB0aGlzIGZ1bmN0aW9uIG5lZWRzIGEgdHJhbnNhY3Rpb24uXG4gICAqIE9ubHkgd29ya3MgZm9yIE15U1FMLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgIHZhcmlhYmxlcyBPYmplY3Qgd2l0aCBtdWx0aXBsZSB2YXJpYWJsZXMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgW29wdGlvbnNdIHF1ZXJ5IG9wdGlvbnMuXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259ICAgW29wdGlvbnMudHJhbnNhY3Rpb25dIFRoZSB0cmFuc2FjdGlvbiB0aGF0IHRoZSBxdWVyeSBzaG91bGQgYmUgZXhlY3V0ZWQgdW5kZXJcbiAgICpcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHNldCh2YXJpYWJsZXMsIG9wdGlvbnMpIHtcbiAgICAvLyBQcmVwYXJlIG9wdGlvbnNcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgdGhpcy5vcHRpb25zLnNldCxcbiAgICAgIHR5cGVvZiBvcHRpb25zID09PSBcIm9iamVjdFwiICYmIG9wdGlvbnNcbiAgICApO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kaWFsZWN0ICE9PSBcIm15c3FsXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInNlcXVlbGl6ZS5zZXQgaXMgb25seSBzdXBwb3J0ZWQgZm9yIG15c3FsXCIpO1xuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMudHJhbnNhY3Rpb24gfHwgIShvcHRpb25zLnRyYW5zYWN0aW9uIGluc3RhbmNlb2YgVHJhbnNhY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwib3B0aW9ucy50cmFuc2FjdGlvbiBpcyByZXF1aXJlZFwiKTtcbiAgICB9XG5cbiAgICAvLyBPdmVycmlkZSBzb21lIG9wdGlvbnMsIHNpbmNlIHRoaXMgaXNuJ3QgYSBTRUxFQ1RcbiAgICBvcHRpb25zLnJhdyA9IHRydWU7XG4gICAgb3B0aW9ucy5wbGFpbiA9IHRydWU7XG4gICAgb3B0aW9ucy50eXBlID0gXCJTRVRcIjtcblxuICAgIC8vIEdlbmVyYXRlIFNRTCBRdWVyeVxuICAgIGNvbnN0IHF1ZXJ5ID0gYFNFVCAke18ubWFwKFxuICAgICAgdmFyaWFibGVzLFxuICAgICAgKHYsIGspID0+IGBAJHtrfSA6PSAke3R5cGVvZiB2ID09PSBcInN0cmluZ1wiID8gYFwiJHt2fVwiYCA6IHZ9YFxuICAgICkuam9pbihcIiwgXCIpfWA7XG5cbiAgICByZXR1cm4gdGhpcy5xdWVyeShxdWVyeSwgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogRXNjYXBlIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgc3RyaW5nIHZhbHVlIHRvIGVzY2FwZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgKi9cbiAgZXNjYXBlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UXVlcnlJbnRlcmZhY2UoKS5lc2NhcGUodmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBkYXRhYmFzZSBzY2hlbWEuXG4gICAqXG4gICAqICoqTm90ZToqKiB0aGlzIGlzIGEgc2NoZW1hIGluIHRoZSBbcG9zdGdyZXMgc2Vuc2Ugb2YgdGhlIHdvcmRdKGh0dHA6Ly93d3cucG9zdGdyZXNxbC5vcmcvZG9jcy85LjEvc3RhdGljL2RkbC1zY2hlbWFzLmh0bWwpLFxuICAgKiBub3QgYSBkYXRhYmFzZSB0YWJsZS4gSW4gbXlzcWwgYW5kIHNxbGl0ZSwgdGhpcyBjb21tYW5kIHdpbGwgZG8gbm90aGluZy5cbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuc2NoZW1hfVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NoZW1hIE5hbWUgb2YgdGhlIHNjaGVtYVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIHF1ZXJ5IG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nXSBBIGZ1bmN0aW9uIHRoYXQgbG9ncyBzcWwgcXVlcmllcywgb3IgZmFsc2UgZm9yIG5vIGxvZ2dpbmdcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBjcmVhdGVTY2hlbWEoc2NoZW1hLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UXVlcnlJbnRlcmZhY2UoKS5jcmVhdGVTY2hlbWEoc2NoZW1hLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaG93IGFsbCBkZWZpbmVkIHNjaGVtYXNcbiAgICpcbiAgICogKipOb3RlOioqIHRoaXMgaXMgYSBzY2hlbWEgaW4gdGhlIFtwb3N0Z3JlcyBzZW5zZSBvZiB0aGUgd29yZF0oaHR0cDovL3d3dy5wb3N0Z3Jlc3FsLm9yZy9kb2NzLzkuMS9zdGF0aWMvZGRsLXNjaGVtYXMuaHRtbCksXG4gICAqIG5vdCBhIGRhdGFiYXNlIHRhYmxlLiBJbiBteXNxbCBhbmQgc3FsaXRlLCB0aGlzIHdpbGwgc2hvdyBhbGwgdGFibGVzLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIHF1ZXJ5IG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nXSBBIGZ1bmN0aW9uIHRoYXQgbG9ncyBzcWwgcXVlcmllcywgb3IgZmFsc2UgZm9yIG5vIGxvZ2dpbmdcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBzaG93QWxsU2NoZW1hcyhvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UXVlcnlJbnRlcmZhY2UoKS5zaG93QWxsU2NoZW1hcyhvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wIGEgc2luZ2xlIHNjaGVtYVxuICAgKlxuICAgKiAqKk5vdGU6KiogdGhpcyBpcyBhIHNjaGVtYSBpbiB0aGUgW3Bvc3RncmVzIHNlbnNlIG9mIHRoZSB3b3JkXShodHRwOi8vd3d3LnBvc3RncmVzcWwub3JnL2RvY3MvOS4xL3N0YXRpYy9kZGwtc2NoZW1hcy5odG1sKSxcbiAgICogbm90IGEgZGF0YWJhc2UgdGFibGUuIEluIG15c3FsIGFuZCBzcWxpdGUsIHRoaXMgZHJvcCBhIHRhYmxlIG1hdGNoaW5nIHRoZSBzY2hlbWEgbmFtZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NoZW1hIE5hbWUgb2YgdGhlIHNjaGVtYVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIHF1ZXJ5IG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nXSBBIGZ1bmN0aW9uIHRoYXQgbG9ncyBzcWwgcXVlcmllcywgb3IgZmFsc2UgZm9yIG5vIGxvZ2dpbmdcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBkcm9wU2NoZW1hKHNjaGVtYSwgb3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLmdldFF1ZXJ5SW50ZXJmYWNlKCkuZHJvcFNjaGVtYShzY2hlbWEsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3AgYWxsIHNjaGVtYXMuXG4gICAqXG4gICAqICoqTm90ZToqKiB0aGlzIGlzIGEgc2NoZW1hIGluIHRoZSBbcG9zdGdyZXMgc2Vuc2Ugb2YgdGhlIHdvcmRdKGh0dHA6Ly93d3cucG9zdGdyZXNxbC5vcmcvZG9jcy85LjEvc3RhdGljL2RkbC1zY2hlbWFzLmh0bWwpLFxuICAgKiBub3QgYSBkYXRhYmFzZSB0YWJsZS4gSW4gbXlzcWwgYW5kIHNxbGl0ZSwgdGhpcyBpcyB0aGUgZXF1aXZhbGVudCBvZiBkcm9wIGFsbCB0YWJsZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gcXVlcnkgb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW58RnVuY3Rpb259IFtvcHRpb25zLmxvZ2dpbmddIEEgZnVuY3Rpb24gdGhhdCBsb2dzIHNxbCBxdWVyaWVzLCBvciBmYWxzZSBmb3Igbm8gbG9nZ2luZ1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGRyb3BBbGxTY2hlbWFzKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRRdWVyeUludGVyZmFjZSgpLmRyb3BBbGxTY2hlbWFzKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN5bmMgYWxsIGRlZmluZWQgbW9kZWxzIHRvIHRoZSBEQi5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBzeW5jIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5mb3JjZT1mYWxzZV0gSWYgZm9yY2UgaXMgdHJ1ZSwgZWFjaCBNb2RlbCB3aWxsIHJ1biBgRFJPUCBUQUJMRSBJRiBFWElTVFNgLCBiZWZvcmUgaXQgdHJpZXMgdG8gY3JlYXRlIGl0cyBvd24gdGFibGVcbiAgICogQHBhcmFtIHtSZWdFeHB9IFtvcHRpb25zLm1hdGNoXSBNYXRjaCBhIHJlZ2V4IGFnYWluc3QgdGhlIGRhdGFiYXNlIG5hbWUgYmVmb3JlIHN5bmNpbmcsIGEgc2FmZXR5IGNoZWNrIGZvciBjYXNlcyB3aGVyZSBmb3JjZTogdHJ1ZSBpcyB1c2VkIGluIHRlc3RzIGJ1dCBub3QgbGl2ZSBjb2RlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbnxGdW5jdGlvbn0gW29wdGlvbnMubG9nZ2luZz1jb25zb2xlLmxvZ10gQSBmdW5jdGlvbiB0aGF0IGxvZ3Mgc3FsIHF1ZXJpZXMsIG9yIGZhbHNlIGZvciBubyBsb2dnaW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2hlbWE9J3B1YmxpYyddIFRoZSBzY2hlbWEgdGhhdCB0aGUgdGFibGVzIHNob3VsZCBiZSBjcmVhdGVkIGluLiBUaGlzIGNhbiBiZSBvdmVycmlkZGVuIGZvciBlYWNoIHRhYmxlIGluIHNlcXVlbGl6ZS5kZWZpbmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNlYXJjaFBhdGg9REVGQVVMVF0gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5ob29rcz10cnVlXSBJZiBob29rcyBpcyB0cnVlIHRoZW4gYmVmb3JlU3luYywgYWZ0ZXJTeW5jLCBiZWZvcmVCdWxrU3luYywgYWZ0ZXJCdWxrU3luYyBob29rcyB3aWxsIGJlIGNhbGxlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmFsdGVyPWZhbHNlXSBBbHRlcnMgdGFibGVzIHRvIGZpdCBtb2RlbHMuIE5vdCByZWNvbW1lbmRlZCBmb3IgcHJvZHVjdGlvbiB1c2UuIERlbGV0ZXMgZGF0YSBpbiBjb2x1bW5zIHRoYXQgd2VyZSByZW1vdmVkIG9yIGhhZCB0aGVpciB0eXBlIGNoYW5nZWQgaW4gdGhlIG1vZGVsLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHN5bmMob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpIHx8IHt9O1xuICAgIG9wdGlvbnMuaG9va3MgPSBvcHRpb25zLmhvb2tzID09PSB1bmRlZmluZWQgPyB0cnVlIDogISFvcHRpb25zLmhvb2tzO1xuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKG9wdGlvbnMsIHRoaXMub3B0aW9ucy5zeW5jLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgaWYgKG9wdGlvbnMubWF0Y2gpIHtcbiAgICAgIGlmICghb3B0aW9ucy5tYXRjaC50ZXN0KHRoaXMuY29uZmlnLmRhdGFiYXNlKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgICAgYERhdGFiYXNlIFwiJHt0aGlzLmNvbmZpZy5kYXRhYmFzZX1cIiBkb2VzIG5vdCBtYXRjaCBzeW5jIG1hdGNoIHBhcmFtZXRlciBcIiR7b3B0aW9ucy5tYXRjaH1cImBcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKFwiYmVmb3JlQnVsa1N5bmNcIiwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMuZm9yY2UpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5kcm9wKG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBtb2RlbHMgPSBbXTtcblxuICAgICAgICAvLyBUb3BvbG9naWNhbGx5IHNvcnQgYnkgZm9yZWlnbiBrZXkgY29uc3RyYWludHMgdG8gZ2l2ZSB1cyBhbiBhcHByb3ByaWF0ZVxuICAgICAgICAvLyBjcmVhdGlvbiBvcmRlclxuICAgICAgICB0aGlzLm1vZGVsTWFuYWdlci5mb3JFYWNoTW9kZWwobW9kZWwgPT4ge1xuICAgICAgICAgIGlmIChtb2RlbCkge1xuICAgICAgICAgICAgbW9kZWxzLnB1c2gobW9kZWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBEQiBzaG91bGQgdGhyb3cgYW4gU1FMIGVycm9yIGlmIHJlZmVyZW5jaW5nIG5vbi1leGlzdGVudCB0YWJsZVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbm8gbW9kZWxzIGRlZmluZWQsIGp1c3QgYXV0aGVudGljYXRlXG4gICAgICAgIGlmICghbW9kZWxzLmxlbmd0aCkgcmV0dXJuIHRoaXMuYXV0aGVudGljYXRlKG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmVhY2gobW9kZWxzLCBtb2RlbCA9PiBtb2RlbC5zeW5jKG9wdGlvbnMpKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoXCJhZnRlckJ1bGtTeW5jXCIsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnJldHVybih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcnVuY2F0ZSBhbGwgdGFibGVzIGRlZmluZWQgdGhyb3VnaCB0aGUgc2VxdWVsaXplIG1vZGVscy5cbiAgICogVGhpcyBpcyBkb25lIGJ5IGNhbGxpbmcgYE1vZGVsLnRydW5jYXRlKClgIG9uIGVhY2ggbW9kZWwuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgcGFzc2VkIHRvIE1vZGVsLmRlc3Ryb3kgaW4gYWRkaXRpb24gdG8gdHJ1bmNhdGVcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nXSBBIGZ1bmN0aW9uIHRoYXQgbG9ncyBzcWwgcXVlcmllcywgb3IgZmFsc2UgZm9yIG5vIGxvZ2dpbmdcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLnRydW5jYXRlfSBmb3IgbW9yZSBpbmZvcm1hdGlvblxuICAgKi9cbiAgdHJ1bmNhdGUob3B0aW9ucykge1xuICAgIGNvbnN0IG1vZGVscyA9IFtdO1xuXG4gICAgdGhpcy5tb2RlbE1hbmFnZXIuZm9yRWFjaE1vZGVsKFxuICAgICAgbW9kZWwgPT4ge1xuICAgICAgICBpZiAobW9kZWwpIHtcbiAgICAgICAgICBtb2RlbHMucHVzaChtb2RlbCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7IHJldmVyc2U6IGZhbHNlIH1cbiAgICApO1xuXG4gICAgY29uc3QgdHJ1bmNhdGVNb2RlbCA9IG1vZGVsID0+IG1vZGVsLnRydW5jYXRlKG9wdGlvbnMpO1xuXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5jYXNjYWRlKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5lYWNoKG1vZGVscywgdHJ1bmNhdGVNb2RlbCk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLm1hcChtb2RlbHMsIHRydW5jYXRlTW9kZWwpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3AgYWxsIHRhYmxlcyBkZWZpbmVkIHRocm91Z2ggdGhpcyBzZXF1ZWxpemUgaW5zdGFuY2UuXG4gICAqIFRoaXMgaXMgZG9uZSBieSBjYWxsaW5nIE1vZGVsLmRyb3Agb24gZWFjaCBtb2RlbC5cbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuZHJvcH0gZm9yIG9wdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBwYXNzZWQgdG8gZWFjaCBjYWxsIHRvIE1vZGVsLmRyb3BcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nXSBBIGZ1bmN0aW9uIHRoYXQgbG9ncyBzcWwgcXVlcmllcywgb3IgZmFsc2UgZm9yIG5vIGxvZ2dpbmdcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBkcm9wKG9wdGlvbnMpIHtcbiAgICBjb25zdCBtb2RlbHMgPSBbXTtcblxuICAgIHRoaXMubW9kZWxNYW5hZ2VyLmZvckVhY2hNb2RlbChcbiAgICAgIG1vZGVsID0+IHtcbiAgICAgICAgaWYgKG1vZGVsKSB7XG4gICAgICAgICAgbW9kZWxzLnB1c2gobW9kZWwpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgeyByZXZlcnNlOiBmYWxzZSB9XG4gICAgKTtcblxuICAgIHJldHVybiBQcm9taXNlLmVhY2gobW9kZWxzLCBtb2RlbCA9PiBtb2RlbC5kcm9wKG9wdGlvbnMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUZXN0IHRoZSBjb25uZWN0aW9uIGJ5IHRyeWluZyB0byBhdXRoZW50aWNhdGUuIEl0IHJ1bnMgYFNFTEVDVCAxKzEgQVMgcmVzdWx0YCBxdWVyeS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBxdWVyeSBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYXV0aGVudGljYXRlKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHtcbiAgICAgICAgcmF3OiB0cnVlLFxuICAgICAgICBwbGFpbjogdHJ1ZSxcbiAgICAgICAgdHlwZTogUXVlcnlUeXBlcy5TRUxFQ1RcbiAgICAgIH0sXG4gICAgICBvcHRpb25zXG4gICAgKTtcblxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KFwiU0VMRUNUIDErMSBBUyByZXN1bHRcIiwgb3B0aW9ucykucmV0dXJuKCk7XG4gIH1cblxuICBkYXRhYmFzZVZlcnNpb24ob3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLmdldFF1ZXJ5SW50ZXJmYWNlKCkuZGF0YWJhc2VWZXJzaW9uKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZm4gZm9yIHJhbmRvbSBiYXNlZCBvbiB0aGUgZGlhbGVjdFxuICAgKlxuICAgKiBAcmV0dXJucyB7U2VxdWVsaXplLmZufVxuICAgKi9cbiAgcmFuZG9tKCkge1xuICAgIGNvbnN0IGRpYSA9IHRoaXMuZ2V0RGlhbGVjdCgpO1xuICAgIGlmIChkaWEgPT09IFwicG9zdGdyZXNcIiB8fCBkaWEgPT09IFwic3FsaXRlXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLmZuKFwiUkFORE9NXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5mbihcIlJBTkRcIik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvYmplY3QgcmVwcmVzZW50aW5nIGEgZGF0YWJhc2UgZnVuY3Rpb24uIFRoaXMgY2FuIGJlIHVzZWQgaW4gc2VhcmNoIHF1ZXJpZXMsIGJvdGggaW4gd2hlcmUgYW5kIG9yZGVyIHBhcnRzLCBhbmQgYXMgZGVmYXVsdCB2YWx1ZXMgaW4gY29sdW1uIGRlZmluaXRpb25zLlxuICAgKiBJZiB5b3Ugd2FudCB0byByZWZlciB0byBjb2x1bW5zIGluIHlvdXIgZnVuY3Rpb24sIHlvdSBzaG91bGQgdXNlIGBzZXF1ZWxpemUuY29sYCwgc28gdGhhdCB0aGUgY29sdW1ucyBhcmUgcHJvcGVybHkgaW50ZXJwcmV0ZWQgYXMgY29sdW1ucyBhbmQgbm90IGEgc3RyaW5ncy5cbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuZmluZEFsbH1cbiAgICogQHNlZVxuICAgKiB7QGxpbmsgU2VxdWVsaXplLmRlZmluZX1cbiAgICogQHNlZVxuICAgKiB7QGxpbmsgU2VxdWVsaXplLmNvbH1cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZuIFRoZSBmdW5jdGlvbiB5b3Ugd2FudCB0byBjYWxsXG4gICAqIEBwYXJhbSB7YW55fSBhcmdzIEFsbCBmdXJ0aGVyIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCBhcyBhcmd1bWVudHMgdG8gdGhlIGZ1bmN0aW9uXG4gICAqXG4gICAqIEBzaW5jZSB2Mi4wLjAtZGV2M1xuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXG4gICAqIEByZXR1cm5zIHtTZXF1ZWxpemUuZm59XG4gICAqXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPkNvbnZlcnQgYSB1c2VyJ3MgdXNlcm5hbWUgdG8gdXBwZXIgY2FzZTwvY2FwdGlvbj5cbiAgICogaW5zdGFuY2UudXBkYXRlKHtcbiAgICogICB1c2VybmFtZTogc2VxdWVsaXplLmZuKCd1cHBlcicsIHNlcXVlbGl6ZS5jb2woJ3VzZXJuYW1lJykpXG4gICAqIH0pO1xuICAgKi9cbiAgc3RhdGljIGZuKGZuLCAuLi5hcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBVdGlscy5GbihmbiwgYXJncyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhIGNvbHVtbiBpbiB0aGUgREIsIHRoaXMgYWxsb3dzIHJlZmVyZW5jaW5nIGFub3RoZXIgY29sdW1uIGluIHlvdXIgcXVlcnkuIFRoaXMgaXMgb2Z0ZW4gdXNlZnVsIGluIGNvbmp1bmN0aW9uIHdpdGggYHNlcXVlbGl6ZS5mbmAsIHNpbmNlIHJhdyBzdHJpbmcgYXJndW1lbnRzIHRvIGZuIHdpbGwgYmUgZXNjYXBlZC5cbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgU2VxdWVsaXplI2ZufVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29sIFRoZSBuYW1lIG9mIHRoZSBjb2x1bW5cbiAgICogQHNpbmNlIHYyLjAuMC1kZXYzXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcbiAgICpcbiAgICogQHJldHVybnMge1NlcXVlbGl6ZS5jb2x9XG4gICAqL1xuICBzdGF0aWMgY29sKGNvbCkge1xuICAgIHJldHVybiBuZXcgVXRpbHMuQ29sKGNvbCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvYmplY3QgcmVwcmVzZW50aW5nIGEgY2FsbCB0byB0aGUgY2FzdCBmdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHthbnl9IHZhbCBUaGUgdmFsdWUgdG8gY2FzdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBUaGUgdHlwZSB0byBjYXN0IGl0IHRvXG4gICAqIEBzaW5jZSB2Mi4wLjAtZGV2M1xuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXG4gICAqXG4gICAqIEByZXR1cm5zIHtTZXF1ZWxpemUuY2FzdH1cbiAgICovXG4gIHN0YXRpYyBjYXN0KHZhbCwgdHlwZSkge1xuICAgIHJldHVybiBuZXcgVXRpbHMuQ2FzdCh2YWwsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb2JqZWN0IHJlcHJlc2VudGluZyBhIGxpdGVyYWwsIGkuZS4gc29tZXRoaW5nIHRoYXQgd2lsbCBub3QgYmUgZXNjYXBlZC5cbiAgICpcbiAgICogQHBhcmFtIHthbnl9IHZhbCBsaXRlcmFsIHZhbHVlXG4gICAqIEBzaW5jZSB2Mi4wLjAtZGV2M1xuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXG4gICAqXG4gICAqIEByZXR1cm5zIHtTZXF1ZWxpemUubGl0ZXJhbH1cbiAgICovXG4gIHN0YXRpYyBsaXRlcmFsKHZhbCkge1xuICAgIHJldHVybiBuZXcgVXRpbHMuTGl0ZXJhbCh2YWwpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFORCBxdWVyeVxuICAgKlxuICAgKiBAc2VlXG4gICAqIHtAbGluayBNb2RlbC5maW5kQWxsfVxuICAgKlxuICAgKiBAcGFyYW0gey4uLnN0cmluZ3xPYmplY3R9IGFyZ3MgRWFjaCBhcmd1bWVudCB3aWxsIGJlIGpvaW5lZCBieSBBTkRcbiAgICogQHNpbmNlIHYyLjAuMC1kZXYzXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcbiAgICpcbiAgICogQHJldHVybnMge1NlcXVlbGl6ZS5hbmR9XG4gICAqL1xuICBzdGF0aWMgYW5kKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4geyBbT3AuYW5kXTogYXJncyB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIE9SIHF1ZXJ5XG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9XG4gICAqXG4gICAqIEBwYXJhbSB7Li4uc3RyaW5nfE9iamVjdH0gYXJncyBFYWNoIGFyZ3VtZW50IHdpbGwgYmUgam9pbmVkIGJ5IE9SXG4gICAqIEBzaW5jZSB2Mi4wLjAtZGV2M1xuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXG4gICAqXG4gICAqIEByZXR1cm5zIHtTZXF1ZWxpemUub3J9XG4gICAqL1xuICBzdGF0aWMgb3IoLi4uYXJncykge1xuICAgIHJldHVybiB7IFtPcC5vcl06IGFyZ3MgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIG9iamVjdCByZXByZXNlbnRpbmcgbmVzdGVkIHdoZXJlIGNvbmRpdGlvbnMgZm9yIHBvc3RncmVzL3NxbGl0ZS9teXNxbCBqc29uIGRhdGEtdHlwZS5cbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuZmluZEFsbH1cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSBjb25kaXRpb25zT3JQYXRoIEEgaGFzaCBjb250YWluaW5nIHN0cmluZ3MvbnVtYmVycyBvciBvdGhlciBuZXN0ZWQgaGFzaCwgYSBzdHJpbmcgdXNpbmcgZG90IG5vdGF0aW9uIG9yIGEgc3RyaW5nIHVzaW5nIHBvc3RncmVzL3NxbGl0ZS9teXNxbCBqc29uIHN5bnRheC5cbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfGJvb2xlYW59IFt2YWx1ZV0gQW4gb3B0aW9uYWwgdmFsdWUgdG8gY29tcGFyZSBhZ2FpbnN0LiBQcm9kdWNlcyBhIHN0cmluZyBvZiB0aGUgZm9ybSBcIjxqc29uIHBhdGg+ID0gJzx2YWx1ZT4nXCIuXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcbiAgICpcbiAgICogQHJldHVybnMge1NlcXVlbGl6ZS5qc29ufVxuICAgKi9cbiAgc3RhdGljIGpzb24oY29uZGl0aW9uc09yUGF0aCwgdmFsdWUpIHtcbiAgICByZXR1cm4gbmV3IFV0aWxzLkpzb24oY29uZGl0aW9uc09yUGF0aCwgdmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgd2F5IG9mIHNwZWNpZnlpbmcgYXR0ciA9IGNvbmRpdGlvbi5cbiAgICpcbiAgICogVGhlIGF0dHIgY2FuIGVpdGhlciBiZSBhbiBvYmplY3QgdGFrZW4gZnJvbSBgTW9kZWwucmF3QXR0cmlidXRlc2AgKGZvciBleGFtcGxlIGBNb2RlbC5yYXdBdHRyaWJ1dGVzLmlkYCBvciBgTW9kZWwucmF3QXR0cmlidXRlcy5uYW1lYCkuIFRoZVxuICAgKiBhdHRyaWJ1dGUgc2hvdWxkIGJlIGRlZmluZWQgaW4geW91ciBtb2RlbCBkZWZpbml0aW9uLiBUaGUgYXR0cmlidXRlIGNhbiBhbHNvIGJlIGFuIG9iamVjdCBmcm9tIG9uZSBvZiB0aGUgc2VxdWVsaXplIHV0aWxpdHkgZnVuY3Rpb25zIChgc2VxdWVsaXplLmZuYCwgYHNlcXVlbGl6ZS5jb2xgIGV0Yy4pXG4gICAqXG4gICAqIEZvciBzdHJpbmcgYXR0cmlidXRlcywgdXNlIHRoZSByZWd1bGFyIGB7IHdoZXJlOiB7IGF0dHI6IHNvbWV0aGluZyB9fWAgc3ludGF4LiBJZiB5b3UgZG9uJ3Qgd2FudCB5b3VyIHN0cmluZyB0byBiZSBlc2NhcGVkLCB1c2UgYHNlcXVlbGl6ZS5saXRlcmFsYC5cbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuZmluZEFsbH1cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGF0dHIgVGhlIGF0dHJpYnV0ZSwgd2hpY2ggY2FuIGJlIGVpdGhlciBhbiBhdHRyaWJ1dGUgb2JqZWN0IGZyb20gYE1vZGVsLnJhd0F0dHJpYnV0ZXNgIG9yIGEgc2VxdWVsaXplIG9iamVjdCwgZm9yIGV4YW1wbGUgYW4gaW5zdGFuY2Ugb2YgYHNlcXVlbGl6ZS5mbmAuIEZvciBzaW1wbGUgc3RyaW5nIGF0dHJpYnV0ZXMsIHVzZSB0aGUgUE9KTyBzeW50YXhcbiAgICogQHBhcmFtIHtTeW1ib2x9IFtjb21wYXJhdG9yPSdPcC5lcSddIG9wZXJhdG9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gbG9naWMgVGhlIGNvbmRpdGlvbi4gQ2FuIGJlIGJvdGggYSBzaW1wbHkgdHlwZSwgb3IgYSBmdXJ0aGVyIGNvbmRpdGlvbiAoYG9yYCwgYGFuZGAsIGAubGl0ZXJhbGAgZXRjLilcbiAgICogQHNpbmNlIHYyLjAuMC1kZXYzXG4gICAqL1xuICBzdGF0aWMgd2hlcmUoYXR0ciwgY29tcGFyYXRvciwgbG9naWMpIHtcbiAgICByZXR1cm4gbmV3IFV0aWxzLldoZXJlKGF0dHIsIGNvbXBhcmF0b3IsIGxvZ2ljKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCBhIHRyYW5zYWN0aW9uLiBXaGVuIHVzaW5nIHRyYW5zYWN0aW9ucywgeW91IHNob3VsZCBwYXNzIHRoZSB0cmFuc2FjdGlvbiBpbiB0aGUgb3B0aW9ucyBhcmd1bWVudCBpbiBvcmRlciBmb3IgdGhlIHF1ZXJ5IHRvIGhhcHBlbiB1bmRlciB0aGF0IHRyYW5zYWN0aW9uIEBzZWUge0BsaW5rIFRyYW5zYWN0aW9ufVxuICAgKlxuICAgKiBJZiB5b3UgaGF2ZSBbQ0xTXShodHRwczovL2dpdGh1Yi5jb20vb3RoaXltMjMvbm9kZS1jb250aW51YXRpb24tbG9jYWwtc3RvcmFnZSkgZW5hYmxlZCwgdGhlIHRyYW5zYWN0aW9uIHdpbGwgYXV0b21hdGljYWxseSBiZSBwYXNzZWQgdG8gYW55IHF1ZXJ5IHRoYXQgcnVucyB3aXRoaW4gdGhlIGNhbGxiYWNrXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHNlcXVlbGl6ZS50cmFuc2FjdGlvbigpLnRoZW4odHJhbnNhY3Rpb24gPT4ge1xuICAgKiAgIHJldHVybiBVc2VyLmZpbmRPbmUoLi4uLCB7dHJhbnNhY3Rpb259KVxuICAgKiAgICAgLnRoZW4odXNlciA9PiB1c2VyLnVwZGF0ZSguLi4sIHt0cmFuc2FjdGlvbn0pKVxuICAgKiAgICAgLnRoZW4oKCkgPT4gdHJhbnNhY3Rpb24uY29tbWl0KCkpXG4gICAqICAgICAuY2F0Y2goKCkgPT4gdHJhbnNhY3Rpb24ucm9sbGJhY2soKSk7XG4gICAqIH0pXG4gICAqXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPkEgc3ludGF4IGZvciBhdXRvbWF0aWNhbGx5IGNvbW1pdHRpbmcgb3Igcm9sbGluZyBiYWNrIGJhc2VkIG9uIHRoZSBwcm9taXNlIGNoYWluIHJlc29sdXRpb24gaXMgYWxzbyBzdXBwb3J0ZWQ8L2NhcHRpb24+XG4gICAqXG4gICAqIHNlcXVlbGl6ZS50cmFuc2FjdGlvbih0cmFuc2FjdGlvbiA9PiB7IC8vIE5vdGUgdGhhdCB3ZSB1c2UgYSBjYWxsYmFjayByYXRoZXIgdGhhbiBhIHByb21pc2UudGhlbigpXG4gICAqICAgcmV0dXJuIFVzZXIuZmluZE9uZSguLi4sIHt0cmFuc2FjdGlvbn0pXG4gICAqICAgICAudGhlbih1c2VyID0+IHVzZXIudXBkYXRlKC4uLiwge3RyYW5zYWN0aW9ufSkpXG4gICAqIH0pLnRoZW4oKCkgPT4ge1xuICAgKiAgIC8vIENvbW1pdHRlZFxuICAgKiB9KS5jYXRjaChlcnIgPT4ge1xuICAgKiAgIC8vIFJvbGxlZCBiYWNrXG4gICAqICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgKiB9KTtcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+VG8gZW5hYmxlIENMUywgYWRkIGl0IGRvIHlvdXIgcHJvamVjdCwgY3JlYXRlIGEgbmFtZXNwYWNlIGFuZCBzZXQgaXQgb24gdGhlIHNlcXVlbGl6ZSBjb25zdHJ1Y3Rvcjo8L2NhcHRpb24+XG4gICAqXG4gICAqIGNvbnN0IGNscyA9IHJlcXVpcmUoJ2NvbnRpbnVhdGlvbi1sb2NhbC1zdG9yYWdlJyk7XG4gICAqIGNvbnN0IG5zID0gY2xzLmNyZWF0ZU5hbWVzcGFjZSgnLi4uLicpO1xuICAgKiBjb25zdCBTZXF1ZWxpemUgPSByZXF1aXJlKCdzZXF1ZWxpemUnKTtcbiAgICogU2VxdWVsaXplLnVzZUNMUyhucyk7XG4gICAqXG4gICAqIC8vIE5vdGUsIHRoYXQgQ0xTIGlzIGVuYWJsZWQgZm9yIGFsbCBzZXF1ZWxpemUgaW5zdGFuY2VzLCBhbmQgYWxsIGluc3RhbmNlcyB3aWxsIHNoYXJlIHRoZSBzYW1lIG5hbWVzcGFjZVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9uc10gVHJhbnNhY3Rpb24gb3B0aW9uc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy50eXBlPSdERUZFUlJFRCddIFNlZSBgU2VxdWVsaXplLlRyYW5zYWN0aW9uLlRZUEVTYCBmb3IgcG9zc2libGUgb3B0aW9ucy4gU3FsaXRlIG9ubHkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLmlzb2xhdGlvbkxldmVsXSBTZWUgYFNlcXVlbGl6ZS5UcmFuc2FjdGlvbi5JU09MQVRJT05fTEVWRUxTYCBmb3IgcG9zc2libGUgb3B0aW9uc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gICBbb3B0aW9ucy5kZWZlcnJhYmxlXSBTZXRzIHRoZSBjb25zdHJhaW50cyB0byBiZSBkZWZlcnJlZCBvciBpbW1lZGlhdGVseSBjaGVja2VkLiBTZWUgYFNlcXVlbGl6ZS5EZWZlcnJhYmxlYC4gUG9zdGdyZVNRTCBPbmx5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbYXV0b0NhbGxiYWNrXSBUaGUgY2FsbGJhY2sgaXMgY2FsbGVkIHdpdGggdGhlIHRyYW5zYWN0aW9uIG9iamVjdCwgYW5kIHNob3VsZCByZXR1cm4gYSBwcm9taXNlLiBJZiB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZCwgdGhlIHRyYW5zYWN0aW9uIGNvbW1pdHM7IGlmIHRoZSBwcm9taXNlIHJlamVjdHMsIHRoZSB0cmFuc2FjdGlvbiByb2xscyBiYWNrXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgdHJhbnNhY3Rpb24ob3B0aW9ucywgYXV0b0NhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGF1dG9DYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgaWYgKCFhdXRvQ2FsbGJhY2spXG4gICAgICByZXR1cm4gdHJhbnNhY3Rpb24ucHJlcGFyZUVudmlyb25tZW50KGZhbHNlKS5yZXR1cm4odHJhbnNhY3Rpb24pO1xuXG4gICAgLy8gYXV0b0NhbGxiYWNrIHByb3ZpZGVkXG4gICAgcmV0dXJuIFNlcXVlbGl6ZS5fY2xzUnVuKCgpID0+IHtcbiAgICAgIHJldHVybiB0cmFuc2FjdGlvblxuICAgICAgICAucHJlcGFyZUVudmlyb25tZW50KClcbiAgICAgICAgLnRoZW4oKCkgPT4gYXV0b0NhbGxiYWNrKHRyYW5zYWN0aW9uKSlcbiAgICAgICAgLnRhcCgoKSA9PiB0cmFuc2FjdGlvbi5jb21taXQoKSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgLy8gUm9sbGJhY2sgdHJhbnNhY3Rpb24gaWYgbm90IGFscmVhZHkgZmluaXNoZWQgKGNvbW1pdCwgcm9sbGJhY2ssIGV0YylcbiAgICAgICAgICAvLyBhbmQgcmVqZWN0IHdpdGggb3JpZ2luYWwgZXJyb3IgKGlnbm9yZSBhbnkgZXJyb3IgaW4gcm9sbGJhY2spXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcbiAgICAgICAgICAgIGlmICghdHJhbnNhY3Rpb24uZmluaXNoZWQpXG4gICAgICAgICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5yb2xsYmFjaygpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICB9KS50aHJvdyhlcnIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgQ0xTIHdpdGggU2VxdWVsaXplLlxuICAgKiBDTFMgbmFtZXNwYWNlIHByb3ZpZGVkIGlzIHN0b3JlZCBhcyBgU2VxdWVsaXplLl9jbHNgXG4gICAqIGFuZCBibHVlYmlyZCBQcm9taXNlIGlzIHBhdGNoZWQgdG8gdXNlIHRoZSBuYW1lc3BhY2UsIHVzaW5nIGBjbHMtYmx1ZWJpcmRgIG1vZHVsZS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG5zIENMUyBuYW1lc3BhY2VcbiAgICogQHJldHVybnMge09iamVjdH0gU2VxdWVsaXplIGNvbnN0cnVjdG9yXG4gICAqL1xuICBzdGF0aWMgdXNlQ0xTKG5zKSB7XG4gICAgLy8gY2hlY2sgYG5zYCBpcyB2YWxpZCBDTFMgbmFtZXNwYWNlXG4gICAgaWYgKFxuICAgICAgIW5zIHx8XG4gICAgICB0eXBlb2YgbnMgIT09IFwib2JqZWN0XCIgfHxcbiAgICAgIHR5cGVvZiBucy5iaW5kICE9PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAgIHR5cGVvZiBucy5ydW4gIT09IFwiZnVuY3Rpb25cIlxuICAgIClcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBDTFMgbmFtZXNwYWNlXCIpO1xuXG4gICAgLy8gc2F2ZSBuYW1lc3BhY2UgYXMgYFNlcXVlbGl6ZS5fY2xzYFxuICAgIHRoaXMuX2NscyA9IG5zO1xuXG4gICAgLy8gcGF0Y2ggYmx1ZWJpcmQgdG8gYmluZCBhbGwgcHJvbWlzZSBjYWxsYmFja3MgdG8gQ0xTIG5hbWVzcGFjZVxuICAgIGNsc0JsdWViaXJkKG5zLCBQcm9taXNlKTtcblxuICAgIC8vIHJldHVybiBTZXF1ZWxpemUgZm9yIGNoYWluaW5nXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUnVuIGZ1bmN0aW9uIGluIENMUyBjb250ZXh0LlxuICAgKiBJZiBubyBDTFMgY29udGV4dCBpbiB1c2UsIGp1c3QgcnVucyB0aGUgZnVuY3Rpb24gbm9ybWFsbHlcbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gcnVuXG4gICAqIEByZXR1cm5zIHsqfSBSZXR1cm4gdmFsdWUgb2YgZnVuY3Rpb25cbiAgICovXG4gIHN0YXRpYyBfY2xzUnVuKGZuKSB7XG4gICAgY29uc3QgbnMgPSBTZXF1ZWxpemUuX2NscztcbiAgICBpZiAoIW5zKSByZXR1cm4gZm4oKTtcblxuICAgIGxldCByZXM7XG4gICAgbnMucnVuKGNvbnRleHQgPT4gKHJlcyA9IGZuKGNvbnRleHQpKSk7XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIGxvZyguLi5hcmdzKSB7XG4gICAgbGV0IG9wdGlvbnM7XG5cbiAgICBjb25zdCBsYXN0ID0gXy5sYXN0KGFyZ3MpO1xuXG4gICAgaWYgKFxuICAgICAgbGFzdCAmJlxuICAgICAgXy5pc1BsYWluT2JqZWN0KGxhc3QpICYmXG4gICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobGFzdCwgXCJsb2dnaW5nXCIpXG4gICAgKSB7XG4gICAgICBvcHRpb25zID0gbGFzdDtcblxuICAgICAgLy8gcmVtb3ZlIG9wdGlvbnMgZnJvbSBzZXQgb2YgbG9nZ2VkIGFyZ3VtZW50cyBpZiBvcHRpb25zLmxvZ2dpbmcgaXMgZXF1YWwgdG8gY29uc29sZS5sb2dcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBpZiAob3B0aW9ucy5sb2dnaW5nID09PSBjb25zb2xlLmxvZykge1xuICAgICAgICBhcmdzLnNwbGljZShhcmdzLmxlbmd0aCAtIDEsIDEpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmxvZ2dpbmcpIHtcbiAgICAgIGlmIChvcHRpb25zLmxvZ2dpbmcgPT09IHRydWUpIHtcbiAgICAgICAgZGVwcmVjYXRpb25zLm5vVHJ1ZUxvZ2dpbmcoKTtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgb3B0aW9ucy5sb2dnaW5nID0gY29uc29sZS5sb2c7XG4gICAgICB9XG5cbiAgICAgIC8vIHNlY29uZCBhcmd1bWVudCBpcyBzcWwtdGltaW5ncywgd2hlbiBiZW5jaG1hcmtpbmcgb3B0aW9uIGVuYWJsZWRcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBpZiAoXG4gICAgICAgICh0aGlzLm9wdGlvbnMuYmVuY2htYXJrIHx8IG9wdGlvbnMuYmVuY2htYXJrKSAmJlxuICAgICAgICBvcHRpb25zLmxvZ2dpbmcgPT09IGNvbnNvbGUubG9nXG4gICAgICApIHtcbiAgICAgICAgYXJncyA9IFtgJHthcmdzWzBdfSBFbGFwc2VkIHRpbWU6ICR7YXJnc1sxXX1tc2BdO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zLmxvZ2dpbmcoLi4uYXJncyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlIGFsbCBjb25uZWN0aW9ucyB1c2VkIGJ5IHRoaXMgc2VxdWVsaXplIGluc3RhbmNlLCBhbmQgZnJlZSBhbGwgcmVmZXJlbmNlcyBzbyB0aGUgaW5zdGFuY2UgY2FuIGJlIGdhcmJhZ2UgY29sbGVjdGVkLlxuICAgKlxuICAgKiBOb3JtYWxseSB0aGlzIGlzIGRvbmUgb24gcHJvY2VzcyBleGl0LCBzbyB5b3Ugb25seSBuZWVkIHRvIGNhbGwgdGhpcyBtZXRob2QgaWYgeW91IGFyZSBjcmVhdGluZyBtdWx0aXBsZSBpbnN0YW5jZXMsIGFuZCB3YW50XG4gICAqIHRvIGdhcmJhZ2UgY29sbGVjdCBzb21lIG9mIHRoZW0uXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgY2xvc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIuY2xvc2UoKTtcbiAgfVxuXG4gIG5vcm1hbGl6ZURhdGFUeXBlKFR5cGUpIHtcbiAgICBsZXQgdHlwZSA9IHR5cGVvZiBUeXBlID09PSBcImZ1bmN0aW9uXCIgPyBuZXcgVHlwZSgpIDogVHlwZTtcbiAgICBjb25zdCBkaWFsZWN0VHlwZXMgPSB0aGlzLmRpYWxlY3QuRGF0YVR5cGVzIHx8IHt9O1xuXG4gICAgaWYgKGRpYWxlY3RUeXBlc1t0eXBlLmtleV0pIHtcbiAgICAgIHR5cGUgPSBkaWFsZWN0VHlwZXNbdHlwZS5rZXldLmV4dGVuZCh0eXBlKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5BUlJBWSkge1xuICAgICAgaWYgKCF0eXBlLnR5cGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQVJSQVkgaXMgbWlzc2luZyB0eXBlIGRlZmluaXRpb24gZm9yIGl0cyB2YWx1ZXMuXCIpO1xuICAgICAgfVxuICAgICAgaWYgKGRpYWxlY3RUeXBlc1t0eXBlLnR5cGUua2V5XSkge1xuICAgICAgICB0eXBlLnR5cGUgPSBkaWFsZWN0VHlwZXNbdHlwZS50eXBlLmtleV0uZXh0ZW5kKHR5cGUudHlwZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cblxuICBub3JtYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlKSB7XG4gICAgaWYgKCFfLmlzUGxhaW5PYmplY3QoYXR0cmlidXRlKSkge1xuICAgICAgYXR0cmlidXRlID0geyB0eXBlOiBhdHRyaWJ1dGUgfTtcbiAgICB9XG5cbiAgICBpZiAoIWF0dHJpYnV0ZS50eXBlKSByZXR1cm4gYXR0cmlidXRlO1xuXG4gICAgYXR0cmlidXRlLnR5cGUgPSB0aGlzLm5vcm1hbGl6ZURhdGFUeXBlKGF0dHJpYnV0ZS50eXBlKTtcblxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXR0cmlidXRlLCBcImRlZmF1bHRWYWx1ZVwiKSkge1xuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgYXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgIChhdHRyaWJ1dGUuZGVmYXVsdFZhbHVlID09PSBEYXRhVHlwZXMuTk9XIHx8XG4gICAgICAgICAgYXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA9PT0gRGF0YVR5cGVzLlVVSURWMSB8fFxuICAgICAgICAgIGF0dHJpYnV0ZS5kZWZhdWx0VmFsdWUgPT09IERhdGFUeXBlcy5VVUlEVjQpXG4gICAgICApIHtcbiAgICAgICAgYXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA9IG5ldyBhdHRyaWJ1dGUuZGVmYXVsdFZhbHVlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGF0dHJpYnV0ZS50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkVOVU0pIHtcbiAgICAgIC8vIFRoZSBFTlVNIGlzIGEgc3BlY2lhbCBjYXNlIHdoZXJlIHRoZSB0eXBlIGlzIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSB2YWx1ZXNcbiAgICAgIGlmIChhdHRyaWJ1dGUudmFsdWVzKSB7XG4gICAgICAgIGF0dHJpYnV0ZS50eXBlLnZhbHVlcyA9IGF0dHJpYnV0ZS50eXBlLm9wdGlvbnMudmFsdWVzID1cbiAgICAgICAgICBhdHRyaWJ1dGUudmFsdWVzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlcyA9IGF0dHJpYnV0ZS50eXBlLnZhbHVlcztcbiAgICAgIH1cblxuICAgICAgaWYgKCFhdHRyaWJ1dGUudmFsdWVzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWx1ZXMgZm9yIEVOVU0gaGF2ZSBub3QgYmVlbiBkZWZpbmVkLlwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXR0cmlidXRlO1xuICB9XG59XG5cbi8vIEFsaWFzZXNcblNlcXVlbGl6ZS5wcm90b3R5cGUuZm4gPSBTZXF1ZWxpemUuZm47XG5TZXF1ZWxpemUucHJvdG90eXBlLmNvbCA9IFNlcXVlbGl6ZS5jb2w7XG5TZXF1ZWxpemUucHJvdG90eXBlLmNhc3QgPSBTZXF1ZWxpemUuY2FzdDtcblNlcXVlbGl6ZS5wcm90b3R5cGUubGl0ZXJhbCA9IFNlcXVlbGl6ZS5saXRlcmFsO1xuU2VxdWVsaXplLnByb3RvdHlwZS5hbmQgPSBTZXF1ZWxpemUuYW5kO1xuU2VxdWVsaXplLnByb3RvdHlwZS5vciA9IFNlcXVlbGl6ZS5vcjtcblNlcXVlbGl6ZS5wcm90b3R5cGUuanNvbiA9IFNlcXVlbGl6ZS5qc29uO1xuU2VxdWVsaXplLnByb3RvdHlwZS53aGVyZSA9IFNlcXVlbGl6ZS53aGVyZTtcblNlcXVlbGl6ZS5wcm90b3R5cGUudmFsaWRhdGUgPSBTZXF1ZWxpemUucHJvdG90eXBlLmF1dGhlbnRpY2F0ZTtcblxuLyoqXG4gKiBTZXF1ZWxpemUgdmVyc2lvbiBudW1iZXIuXG4gKi9cblNlcXVlbGl6ZS52ZXJzaW9uID0gcmVxdWlyZShcIi4uL3BhY2thZ2UuanNvblwiKS52ZXJzaW9uO1xuXG5TZXF1ZWxpemUub3B0aW9ucyA9IHsgaG9va3M6IHt9IH07XG5cbi8qKlxuICogQHByaXZhdGVcbiAqL1xuU2VxdWVsaXplLlV0aWxzID0gVXRpbHM7XG5cbi8qKlxuICogT3BlcmF0b3JzIHN5bWJvbHMgdG8gYmUgdXNlZCBmb3IgcXVlcnlpbmcgZGF0YVxuICogQHNlZSAge0BsaW5rIE9wZXJhdG9yc31cbiAqL1xuU2VxdWVsaXplLk9wID0gT3A7XG5cbi8qKlxuICogQSBoYW5keSByZWZlcmVuY2UgdG8gdGhlIGJsdWViaXJkIFByb21pc2UgY2xhc3NcbiAqL1xuU2VxdWVsaXplLlByb21pc2UgPSBQcm9taXNlO1xuXG4vKipcbiAqIEF2YWlsYWJsZSB0YWJsZSBoaW50cyB0byBiZSB1c2VkIGZvciBxdWVyeWluZyBkYXRhIGluIG1zc3FsIGZvciB0YWJsZSBoaW50c1xuICogQHNlZSB7QGxpbmsgVGFibGVIaW50c31cbiAqL1xuU2VxdWVsaXplLlRhYmxlSGludHMgPSBUYWJsZUhpbnRzO1xuXG4vKipcbiAqIEF2YWlsYWJsZSBpbmRleCBoaW50cyB0byBiZSB1c2VkIGZvciBxdWVyeWluZyBkYXRhIGluIG15c3FsIGZvciBpbmRleCBoaW50c1xuICogQHNlZSB7QGxpbmsgSW5kZXhIaW50c31cbiAqL1xuU2VxdWVsaXplLkluZGV4SGludHMgPSBJbmRleEhpbnRzO1xuXG4vKipcbiAqIEEgcmVmZXJlbmNlIHRvIHRoZSBzZXF1ZWxpemUgdHJhbnNhY3Rpb24gY2xhc3MuIFVzZSB0aGlzIHRvIGFjY2VzcyBpc29sYXRpb25MZXZlbHMgYW5kIHR5cGVzIHdoZW4gY3JlYXRpbmcgYSB0cmFuc2FjdGlvblxuICogQHNlZSB7QGxpbmsgVHJhbnNhY3Rpb259XG4gKiBAc2VlIHtAbGluayBTZXF1ZWxpemUudHJhbnNhY3Rpb259XG4gKi9cblNlcXVlbGl6ZS5UcmFuc2FjdGlvbiA9IFRyYW5zYWN0aW9uO1xuXG4vKipcbiAqIEEgcmVmZXJlbmNlIHRvIFNlcXVlbGl6ZSBjb25zdHJ1Y3RvciBmcm9tIHNlcXVlbGl6ZS4gVXNlZnVsIGZvciBhY2Nlc3NpbmcgRGF0YVR5cGVzLCBFcnJvcnMgZXRjLlxuICogQHNlZSB7QGxpbmsgU2VxdWVsaXplfVxuICovXG5TZXF1ZWxpemUucHJvdG90eXBlLlNlcXVlbGl6ZSA9IFNlcXVlbGl6ZTtcblxuLyoqXG4gKiBBdmFpbGFibGUgcXVlcnkgdHlwZXMgZm9yIHVzZSB3aXRoIGBzZXF1ZWxpemUucXVlcnlgXG4gKiBAc2VlIHtAbGluayBRdWVyeVR5cGVzfVxuICovXG5TZXF1ZWxpemUucHJvdG90eXBlLlF1ZXJ5VHlwZXMgPSBTZXF1ZWxpemUuUXVlcnlUeXBlcyA9IFF1ZXJ5VHlwZXM7XG5cbi8qKlxuICogRXhwb3NlcyB0aGUgdmFsaWRhdG9yLmpzIG9iamVjdCwgc28geW91IGNhbiBleHRlbmQgaXQgd2l0aCBjdXN0b20gdmFsaWRhdGlvbiBmdW5jdGlvbnMuIFRoZSB2YWxpZGF0b3IgaXMgZXhwb3NlZCBib3RoIG9uIHRoZSBpbnN0YW5jZSwgYW5kIG9uIHRoZSBjb25zdHJ1Y3Rvci5cbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2Nocmlzby92YWxpZGF0b3IuanNcbiAqL1xuU2VxdWVsaXplLnByb3RvdHlwZS5WYWxpZGF0b3IgPSBTZXF1ZWxpemUuVmFsaWRhdG9yID0gVmFsaWRhdG9yO1xuXG5TZXF1ZWxpemUuTW9kZWwgPSBNb2RlbDtcblxuU2VxdWVsaXplLkRhdGFUeXBlcyA9IERhdGFUeXBlcztcbmZvciAoY29uc3QgZGF0YVR5cGUgaW4gRGF0YVR5cGVzKSB7XG4gIFNlcXVlbGl6ZVtkYXRhVHlwZV0gPSBEYXRhVHlwZXNbZGF0YVR5cGVdO1xufVxuXG4vKipcbiAqIEEgcmVmZXJlbmNlIHRvIHRoZSBkZWZlcnJhYmxlIGNvbGxlY3Rpb24uIFVzZSB0aGlzIHRvIGFjY2VzcyB0aGUgZGlmZmVyZW50IGRlZmVycmFibGUgb3B0aW9ucy5cbiAqIEBzZWUge0BsaW5rIFRyYW5zYWN0aW9uLkRlZmVycmFibGV9XG4gKiBAc2VlIHtAbGluayBTZXF1ZWxpemUjdHJhbnNhY3Rpb259XG4gKi9cblNlcXVlbGl6ZS5EZWZlcnJhYmxlID0gRGVmZXJyYWJsZTtcblxuLyoqXG4gKiBBIHJlZmVyZW5jZSB0byB0aGUgc2VxdWVsaXplIGFzc29jaWF0aW9uIGNsYXNzLlxuICogQHNlZSB7QGxpbmsgQXNzb2NpYXRpb259XG4gKi9cblNlcXVlbGl6ZS5wcm90b3R5cGUuQXNzb2NpYXRpb24gPSBTZXF1ZWxpemUuQXNzb2NpYXRpb24gPSBBc3NvY2lhdGlvbjtcblxuLyoqXG4gKiBQcm92aWRlIGFsdGVybmF0aXZlIHZlcnNpb24gb2YgYGluZmxlY3Rpb25gIG1vZHVsZSB0byBiZSB1c2VkIGJ5IGBVdGlscy5wbHVyYWxpemVgIGV0Yy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBfaW5mbGVjdGlvbiAtIGBpbmZsZWN0aW9uYCBtb2R1bGVcbiAqL1xuU2VxdWVsaXplLnVzZUluZmxlY3Rpb24gPSBVdGlscy51c2VJbmZsZWN0aW9uO1xuXG4vKipcbiAqIEFsbG93IGhvb2tzIHRvIGJlIGRlZmluZWQgb24gU2VxdWVsaXplICsgb24gc2VxdWVsaXplIGluc3RhbmNlIGFzIHVuaXZlcnNhbCBob29rcyB0byBydW4gb24gYWxsIG1vZGVsc1xuICogYW5kIG9uIFNlcXVlbGl6ZS9zZXF1ZWxpemUgbWV0aG9kcyBlLmcuIFNlcXVlbGl6ZSgpLCBTZXF1ZWxpemUjZGVmaW5lKClcbiAqL1xuSG9va3MuYXBwbHlUbyhTZXF1ZWxpemUpO1xuSG9va3MuYXBwbHlUbyhTZXF1ZWxpemUucHJvdG90eXBlKTtcblxuLyoqXG4gKiBFeHBvc2UgdmFyaW91cyBlcnJvcnMgYXZhaWxhYmxlXG4gKi9cblxuLy8gZXhwb3NlIGFsaWFzIHRvIEJhc2VFcnJvclxuU2VxdWVsaXplLkVycm9yID0gc2VxdWVsaXplRXJyb3JzLkJhc2VFcnJvcjtcblxuZm9yIChjb25zdCBlcnJvciBvZiBPYmplY3Qua2V5cyhzZXF1ZWxpemVFcnJvcnMpKSB7XG4gIFNlcXVlbGl6ZVtlcnJvcl0gPSBzZXF1ZWxpemVFcnJvcnNbZXJyb3JdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlcXVlbGl6ZTtcbm1vZHVsZS5leHBvcnRzLlNlcXVlbGl6ZSA9IFNlcXVlbGl6ZTtcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBTZXF1ZWxpemU7XG4iXX0=