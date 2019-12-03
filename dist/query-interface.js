'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const _ = require('lodash');

const Utils = require('./utils');

const DataTypes = require('./data-types');

const SQLiteQueryInterface = require('./dialects/sqlite/query-interface');

const Transaction = require('./transaction');

const Promise = require('./promise');

const QueryTypes = require('./query-types');

const Op = require('./operators');
/**
 * The interface that Sequelize uses to talk to all databases
 *
 * @class QueryInterface
 */


let QueryInterface =
/*#__PURE__*/
function () {
  function QueryInterface(sequelize) {
    _classCallCheck(this, QueryInterface);

    this.sequelize = sequelize;
    this.QueryGenerator = this.sequelize.dialect.QueryGenerator;
  }
  /**
   * Create a database
   *
   * @param {string} database  Database name to create
   * @param {Object} [options] Query options
   * @param {string} [options.charset] Database default character set, MYSQL only
   * @param {string} [options.collate] Database default collation
   * @param {string} [options.encoding] Database default character set, PostgreSQL only
   * @param {string} [options.ctype] Database character classification, PostgreSQL only
   * @param {string} [options.template] The name of the template from which to create the new database, PostgreSQL only
   *
   * @returns {Promise}
   */


  _createClass(QueryInterface, [{
    key: "createDatabase",
    value: function createDatabase(database, options) {
      options = options || {};
      const sql = this.QueryGenerator.createDatabaseQuery(database, options);
      return this.sequelize.query(sql, options);
    }
    /**
     * Drop a database
     *
     * @param {string} database  Database name to drop
     * @param {Object} [options] Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "dropDatabase",
    value: function dropDatabase(database, options) {
      options = options || {};
      const sql = this.QueryGenerator.dropDatabaseQuery(database);
      return this.sequelize.query(sql, options);
    }
    /**
     * Create a schema
     *
     * @param {string} schema    Schema name to create
     * @param {Object} [options] Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "createSchema",
    value: function createSchema(schema, options) {
      options = options || {};
      const sql = this.QueryGenerator.createSchema(schema);
      return this.sequelize.query(sql, options);
    }
    /**
     * Drop a schema
     *
     * @param {string} schema    Schema name to drop
     * @param {Object} [options] Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "dropSchema",
    value: function dropSchema(schema, options) {
      options = options || {};
      const sql = this.QueryGenerator.dropSchema(schema);
      return this.sequelize.query(sql, options);
    }
    /**
     * Drop all schemas
     *
     * @param {Object} [options] Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "dropAllSchemas",
    value: function dropAllSchemas(options) {
      options = options || {};

      if (!this.QueryGenerator._dialect.supports.schemas) {
        return this.sequelize.drop(options);
      }

      return this.showAllSchemas(options).map(schemaName => this.dropSchema(schemaName, options));
    }
    /**
     * Show all schemas
     *
     * @param {Object} [options] Query options
     *
     * @returns {Promise<Array>}
     */

  }, {
    key: "showAllSchemas",
    value: function showAllSchemas(options) {
      options = Object.assign({}, options, {
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });
      const showSchemasSql = this.QueryGenerator.showSchemasQuery(options);
      return this.sequelize.query(showSchemasSql, options).then(schemaNames => _.flatten(schemaNames.map(value => value.schema_name ? value.schema_name : value)));
    }
    /**
     * Return database version
     *
     * @param {Object}    [options]      Query options
     * @param {QueryType} [options.type] Query type
     *
     * @returns {Promise}
     * @private
     */

  }, {
    key: "databaseVersion",
    value: function databaseVersion(options) {
      return this.sequelize.query(this.QueryGenerator.versionQuery(), Object.assign({}, options, {
        type: QueryTypes.VERSION
      }));
    }
    /**
     * Create a table with given set of attributes
     *
     * ```js
     * queryInterface.createTable(
     *   'nameOfTheNewTable',
     *   {
     *     id: {
     *       type: Sequelize.INTEGER,
     *       primaryKey: true,
     *       autoIncrement: true
     *     },
     *     createdAt: {
     *       type: Sequelize.DATE
     *     },
     *     updatedAt: {
     *       type: Sequelize.DATE
     *     },
     *     attr1: Sequelize.STRING,
     *     attr2: Sequelize.INTEGER,
     *     attr3: {
     *       type: Sequelize.BOOLEAN,
     *       defaultValue: false,
     *       allowNull: false
     *     },
     *     //foreign key usage
     *     attr4: {
     *       type: Sequelize.INTEGER,
     *       references: {
     *         model: 'another_table_name',
     *         key: 'id'
     *       },
     *       onUpdate: 'cascade',
     *       onDelete: 'cascade'
     *     }
     *   },
     *   {
     *     engine: 'MYISAM',    // default: 'InnoDB'
     *     charset: 'latin1',   // default: null
     *     schema: 'public',    // default: public, PostgreSQL only.
     *     comment: 'my table', // comment for table
     *     collate: 'latin1_danish_ci' // collation, MYSQL only
     *   }
     * )
     * ```
     *
     * @param {string} tableName  Name of table to create
     * @param {Object} attributes Object representing a list of table attributes to create
     * @param {Object} [options] create table and query options
     * @param {Model}  [model] model class
     *
     * @returns {Promise}
     */

  }, {
    key: "createTable",
    value: function createTable(tableName, attributes, options, model) {
      let sql = '';
      let promise;
      options = _.clone(options) || {};

      if (options && options.uniqueKeys) {
        _.forOwn(options.uniqueKeys, uniqueKey => {
          if (uniqueKey.customIndex === undefined) {
            uniqueKey.customIndex = true;
          }
        });
      }

      if (model) {
        options.uniqueKeys = options.uniqueKeys || model.uniqueKeys;
      }

      attributes = _.mapValues(attributes, attribute => this.sequelize.normalizeAttribute(attribute)); // Postgres requires special SQL commands for ENUM/ENUM[]

      if (this.sequelize.options.dialect === 'postgres') {
        promise = PostgresQueryInterface.ensureEnums(this, tableName, attributes, options, model);
      } else {
        promise = Promise.resolve();
      }

      if (!tableName.schema && (options.schema || !!model && model._schema)) {
        tableName = this.QueryGenerator.addSchema({
          tableName,
          _schema: !!model && model._schema || options.schema
        });
      }

      attributes = this.QueryGenerator.attributesToSQL(attributes, {
        table: tableName,
        context: 'createTable'
      });
      sql = this.QueryGenerator.createTableQuery(tableName, attributes, options);
      return promise.then(() => this.sequelize.query(sql, options));
    }
    /**
     * Drop a table from database
     *
     * @param {string} tableName Table name to drop
     * @param {Object} options   Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "dropTable",
    value: function dropTable(tableName, options) {
      // if we're forcing we should be cascading unless explicitly stated otherwise
      options = _.clone(options) || {};
      options.cascade = options.cascade || options.force || false;
      let sql = this.QueryGenerator.dropTableQuery(tableName, options);
      return this.sequelize.query(sql, options).then(() => {
        const promises = []; // Since postgres has a special case for enums, we should drop the related
        // enum type within the table and attribute

        if (this.sequelize.options.dialect === 'postgres') {
          const instanceTable = this.sequelize.modelManager.getModel(tableName, {
            attribute: 'tableName'
          });

          if (instanceTable) {
            const getTableName = (!options || !options.schema || options.schema === 'public' ? '' : `${options.schema}_`) + tableName;
            const keys = Object.keys(instanceTable.rawAttributes);
            const keyLen = keys.length;

            for (let i = 0; i < keyLen; i++) {
              if (instanceTable.rawAttributes[keys[i]].type instanceof DataTypes.ENUM) {
                sql = this.QueryGenerator.pgEnumDrop(getTableName, keys[i]);
                options.supportsSearchPath = false;
                promises.push(this.sequelize.query(sql, Object.assign({}, options, {
                  raw: true
                })));
              }
            }
          }
        }

        return Promise.all(promises).get(0);
      });
    }
    /**
     * Drop all tables from database
     *
     * @param {Object} [options] query options
     * @param {Array}  [options.skip] List of table to skip
     *
     * @returns {Promise}
     */

  }, {
    key: "dropAllTables",
    value: function dropAllTables(options) {
      options = options || {};
      const skip = options.skip || [];

      const dropAllTables = tableNames => Promise.each(tableNames, tableName => {
        // if tableName is not in the Array of tables names then don't drop it
        if (!skip.includes(tableName.tableName || tableName)) {
          return this.dropTable(tableName, Object.assign({}, options, {
            cascade: true
          }));
        }
      });

      return this.showAllTables(options).then(tableNames => {
        if (this.sequelize.options.dialect === 'sqlite') {
          return this.sequelize.query('PRAGMA foreign_keys;', options).then(result => {
            const foreignKeysAreEnabled = result.foreign_keys === 1;

            if (foreignKeysAreEnabled) {
              return this.sequelize.query('PRAGMA foreign_keys = OFF', options).then(() => dropAllTables(tableNames)).then(() => this.sequelize.query('PRAGMA foreign_keys = ON', options));
            }

            return dropAllTables(tableNames);
          });
        }

        return this.getForeignKeysForTables(tableNames, options).then(foreignKeys => {
          const queries = [];
          tableNames.forEach(tableName => {
            let normalizedTableName = tableName;

            if (_.isObject(tableName)) {
              normalizedTableName = `${tableName.schema}.${tableName.tableName}`;
            }

            foreignKeys[normalizedTableName].forEach(foreignKey => {
              queries.push(this.QueryGenerator.dropForeignKeyQuery(tableName, foreignKey));
            });
          });
          return Promise.each(queries, q => this.sequelize.query(q, options)).then(() => dropAllTables(tableNames));
        });
      });
    }
    /**
     * Drop specified enum from database (Postgres only)
     *
     * @param {string} [enumName]  Enum name to drop
     * @param {Object} options Query options
     *
     * @returns {Promise}
     * @private
     */

  }, {
    key: "dropEnum",
    value: function dropEnum(enumName, options) {
      if (this.sequelize.getDialect() !== 'postgres') {
        return Promise.resolve();
      }

      options = options || {};
      return this.sequelize.query(this.QueryGenerator.pgEnumDrop(null, null, this.QueryGenerator.pgEscapeAndQuote(enumName)), Object.assign({}, options, {
        raw: true
      }));
    }
    /**
     * Drop all enums from database (Postgres only)
     *
     * @param {Object} options Query options
     *
     * @returns {Promise}
     * @private
     */

  }, {
    key: "dropAllEnums",
    value: function dropAllEnums(options) {
      if (this.sequelize.getDialect() !== 'postgres') {
        return Promise.resolve();
      }

      options = options || {};
      return this.pgListEnums(null, options).map(result => this.sequelize.query(this.QueryGenerator.pgEnumDrop(null, null, this.QueryGenerator.pgEscapeAndQuote(result.enum_name)), Object.assign({}, options, {
        raw: true
      })));
    }
    /**
     * List all enums (Postgres only)
     *
     * @param {string} [tableName]  Table whose enum to list
     * @param {Object} [options]    Query options
     *
     * @returns {Promise}
     * @private
     */

  }, {
    key: "pgListEnums",
    value: function pgListEnums(tableName, options) {
      options = options || {};
      const sql = this.QueryGenerator.pgListEnums(tableName);
      return this.sequelize.query(sql, Object.assign({}, options, {
        plain: false,
        raw: true,
        type: QueryTypes.SELECT
      }));
    }
    /**
     * Rename a table
     *
     * @param {string} before    Current name of table
     * @param {string} after     New name from table
     * @param {Object} [options] Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "renameTable",
    value: function renameTable(before, after, options) {
      options = options || {};
      const sql = this.QueryGenerator.renameTableQuery(before, after);
      return this.sequelize.query(sql, options);
    }
    /**
     * Get all tables in current database
     *
     * @param {Object}    [options] Query options
     * @param {boolean}   [options.raw=true] Run query in raw mode
     * @param {QueryType} [options.type=QueryType.SHOWTABLE] query type
     *
     * @returns {Promise<Array>}
     * @private
     */

  }, {
    key: "showAllTables",
    value: function showAllTables(options) {
      options = Object.assign({}, options, {
        raw: true,
        type: QueryTypes.SHOWTABLES
      });
      const showTablesSql = this.QueryGenerator.showTablesQuery(this.sequelize.config.database);
      return this.sequelize.query(showTablesSql, options).then(tableNames => _.flatten(tableNames));
    }
    /**
     * Describe a table structure
     *
     * This method returns an array of hashes containing information about all attributes in the table.
     *
     * ```js
     * {
     *    name: {
     *      type:         'VARCHAR(255)', // this will be 'CHARACTER VARYING' for pg!
     *      allowNull:    true,
     *      defaultValue: null
     *    },
     *    isBetaMember: {
     *      type:         'TINYINT(1)', // this will be 'BOOLEAN' for pg!
     *      allowNull:    false,
     *      defaultValue: false
     *    }
     * }
     * ```
     *
     * @param {string} tableName table name
     * @param {Object} [options] Query options
     *
     * @returns {Promise<Object>}
     */

  }, {
    key: "describeTable",
    value: function describeTable(tableName, options) {
      let schema = null;
      let schemaDelimiter = null;

      if (typeof options === 'string') {
        schema = options;
      } else if (typeof options === 'object' && options !== null) {
        schema = options.schema || null;
        schemaDelimiter = options.schemaDelimiter || null;
      }

      if (typeof tableName === 'object' && tableName !== null) {
        schema = tableName.schema;
        tableName = tableName.tableName;
      }

      const sql = this.QueryGenerator.describeTableQuery(tableName, schema, schemaDelimiter);
      options = Object.assign({}, options, {
        type: QueryTypes.DESCRIBE
      });
      return this.sequelize.query(sql, options).then(data => {
        /*
         * If no data is returned from the query, then the table name may be wrong.
         * Query generators that use information_schema for retrieving table info will just return an empty result set,
         * it will not throw an error like built-ins do (e.g. DESCRIBE on MySql).
         */
        if (_.isEmpty(data)) {
          throw new Error(`No description found for "${tableName}" table. Check the table name and schema; remember, they _are_ case sensitive.`);
        }

        return data;
      }).catch(e => {
        if (e.original && e.original.code === 'ER_NO_SUCH_TABLE') {
          throw Error(`No description found for "${tableName}" table. Check the table name and schema; remember, they _are_ case sensitive.`);
        }

        throw e;
      });
    }
    /**
     * Add a new column to a table
     *
     * ```js
     * queryInterface.addColumn('tableA', 'columnC', Sequelize.STRING, {
     *    after: 'columnB' // after option is only supported by MySQL
     * });
     * ```
     *
     * @param {string} table     Table to add column to
     * @param {string} key       Column name
     * @param {Object} attribute Attribute definition
     * @param {Object} [options] Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "addColumn",
    value: function addColumn(table, key, attribute, options) {
      if (!table || !key || !attribute) {
        throw new Error('addColumn takes at least 3 arguments (table, attribute name, attribute definition)');
      }

      options = options || {};
      attribute = this.sequelize.normalizeAttribute(attribute);
      return this.sequelize.query(this.QueryGenerator.addColumnQuery(table, key, attribute), options);
    }
    /**
     * Remove a column from a table
     *
     * @param {string} tableName      Table to remove column from
     * @param {string} attributeName  Column name to remove
     * @param {Object} [options]      Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "removeColumn",
    value: function removeColumn(tableName, attributeName, options) {
      options = options || {};

      switch (this.sequelize.options.dialect) {
        case 'sqlite':
          // sqlite needs some special treatment as it cannot drop a column
          return SQLiteQueryInterface.removeColumn(this, tableName, attributeName, options);

        default:
          return this.sequelize.query(this.QueryGenerator.removeColumnQuery(tableName, attributeName), options);
      }
    }
    /**
     * Change a column definition
     *
     * @param {string} tableName          Table name to change from
     * @param {string} attributeName      Column name
     * @param {Object} dataTypeOrOptions  Attribute definition for new column
     * @param {Object} [options]          Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "changeColumn",
    value: function changeColumn(tableName, attributeName, dataTypeOrOptions, options) {
      const attributes = {};
      options = options || {};

      if (_.values(DataTypes).includes(dataTypeOrOptions)) {
        attributes[attributeName] = {
          type: dataTypeOrOptions,
          allowNull: true
        };
      } else {
        attributes[attributeName] = dataTypeOrOptions;
      }

      attributes[attributeName] = this.sequelize.normalizeAttribute(attributes[attributeName]);

      if (this.sequelize.options.dialect === 'sqlite') {
        // sqlite needs some special treatment as it cannot change a column
        return SQLiteQueryInterface.changeColumn(this, tableName, attributes, options);
      }

      const query = this.QueryGenerator.attributesToSQL(attributes, {
        context: 'changeColumn',
        table: tableName
      });
      const sql = this.QueryGenerator.changeColumnQuery(tableName, query);
      return this.sequelize.query(sql, options);
    }
    /**
     * Rename a column
     *
     * @param {string} tableName        Table name whose column to rename
     * @param {string} attrNameBefore   Current column name
     * @param {string} attrNameAfter    New column name
     * @param {Object} [options]        Query option
     *
     * @returns {Promise}
     */

  }, {
    key: "renameColumn",
    value: function renameColumn(tableName, attrNameBefore, attrNameAfter, options) {
      options = options || {};
      return this.describeTable(tableName, options).then(data => {
        if (!data[attrNameBefore]) {
          throw new Error(`Table ${tableName} doesn't have the column ${attrNameBefore}`);
        }

        data = data[attrNameBefore] || {};
        const _options = {};
        _options[attrNameAfter] = {
          attribute: attrNameAfter,
          type: data.type,
          allowNull: data.allowNull,
          defaultValue: data.defaultValue
        }; // fix: a not-null column cannot have null as default value

        if (data.defaultValue === null && !data.allowNull) {
          delete _options[attrNameAfter].defaultValue;
        }

        if (this.sequelize.options.dialect === 'sqlite') {
          // sqlite needs some special treatment as it cannot rename a column
          return SQLiteQueryInterface.renameColumn(this, tableName, attrNameBefore, attrNameAfter, options);
        }

        const sql = this.QueryGenerator.renameColumnQuery(tableName, attrNameBefore, this.QueryGenerator.attributesToSQL(_options));
        return this.sequelize.query(sql, options);
      });
    }
    /**
     * Add an index to a column
     *
     * @param {string|Object}  tableName Table name to add index on, can be a object with schema
     * @param {Array}   [attributes]     Use options.fields instead, List of attributes to add index on
     * @param {Object}  options          indexes options
     * @param {Array}   options.fields   List of attributes to add index on
     * @param {boolean} [options.concurrently] Pass CONCURRENT so other operations run while the index is created
     * @param {boolean} [options.unique] Create a unique index
     * @param {string}  [options.using]  Useful for GIN indexes
     * @param {string}  [options.operator] Index operator
     * @param {string}  [options.type]   Type of index, available options are UNIQUE|FULLTEXT|SPATIAL
     * @param {string}  [options.name]   Name of the index. Default is <table>_<attr1>_<attr2>
     * @param {Object}  [options.where]  Where condition on index, for partial indexes
     * @param {string}  [rawTablename]   table name, this is just for backward compatibiity
     *
     * @returns {Promise}
     */

  }, {
    key: "addIndex",
    value: function addIndex(tableName, attributes, options, rawTablename) {
      // Support for passing tableName, attributes, options or tableName, options (with a fields param which is the attributes)
      if (!Array.isArray(attributes)) {
        rawTablename = options;
        options = attributes;
        attributes = options.fields;
      }

      if (!rawTablename) {
        // Map for backwards compat
        rawTablename = tableName;
      }

      options = Utils.cloneDeep(options);
      options.fields = attributes;
      const sql = this.QueryGenerator.addIndexQuery(tableName, options, rawTablename);
      return this.sequelize.query(sql, Object.assign({}, options, {
        supportsSearchPath: false
      }));
    }
    /**
     * Show indexes on a table
     *
     * @param {string} tableName table name
     * @param {Object} [options]   Query options
     *
     * @returns {Promise<Array>}
     * @private
     */

  }, {
    key: "showIndex",
    value: function showIndex(tableName, options) {
      const sql = this.QueryGenerator.showIndexesQuery(tableName, options);
      return this.sequelize.query(sql, Object.assign({}, options, {
        type: QueryTypes.SHOWINDEXES
      }));
    }
  }, {
    key: "getForeignKeysForTables",
    value: function getForeignKeysForTables(tableNames, options) {
      if (tableNames.length === 0) {
        return Promise.resolve({});
      }

      options = Object.assign({}, options || {}, {
        type: QueryTypes.FOREIGNKEYS
      });
      return Promise.map(tableNames, tableName => this.sequelize.query(this.QueryGenerator.getForeignKeysQuery(tableName, this.sequelize.config.database), options)).then(results => {
        const result = {};
        tableNames.forEach((tableName, i) => {
          if (_.isObject(tableName)) {
            tableName = `${tableName.schema}.${tableName.tableName}`;
          }

          result[tableName] = Array.isArray(results[i]) ? results[i].map(r => r.constraint_name) : [results[i] && results[i].constraint_name];
          result[tableName] = result[tableName].filter(_.identity);
        });
        return result;
      });
    }
    /**
     * Get foreign key references details for the table
     *
     * Those details contains constraintSchema, constraintName, constraintCatalog
     * tableCatalog, tableSchema, tableName, columnName,
     * referencedTableCatalog, referencedTableCatalog, referencedTableSchema, referencedTableName, referencedColumnName.
     * Remind: constraint informations won't return if it's sqlite.
     *
     * @param {string} tableName table name
     * @param {Object} [options]  Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "getForeignKeyReferencesForTable",
    value: function getForeignKeyReferencesForTable(tableName, options) {
      const queryOptions = Object.assign({}, options, {
        type: QueryTypes.FOREIGNKEYS
      });
      const catalogName = this.sequelize.config.database;

      switch (this.sequelize.options.dialect) {
        case 'sqlite':
          // sqlite needs some special treatment.
          return SQLiteQueryInterface.getForeignKeyReferencesForTable(this, tableName, queryOptions);

        default:
          {
            const query = this.QueryGenerator.getForeignKeysQuery(tableName, catalogName);
            return this.sequelize.query(query, queryOptions);
          }
      }
    }
    /**
     * Remove an already existing index from a table
     *
     * @param {string} tableName             Table name to drop index from
     * @param {string} indexNameOrAttributes Index name
     * @param {Object} [options]             Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "removeIndex",
    value: function removeIndex(tableName, indexNameOrAttributes, options) {
      options = options || {};
      const sql = this.QueryGenerator.removeIndexQuery(tableName, indexNameOrAttributes);
      return this.sequelize.query(sql, options);
    }
    /**
     * Add a constraint to a table
     *
     * Available constraints:
     * - UNIQUE
     * - DEFAULT (MSSQL only)
     * - CHECK (MySQL - Ignored by the database engine )
     * - FOREIGN KEY
     * - PRIMARY KEY
     *
     * @example <caption>UNIQUE</caption>
     * queryInterface.addConstraint('Users', ['email'], {
     *   type: 'unique',
     *   name: 'custom_unique_constraint_name'
     * });
     *
     * @example <caption>CHECK</caption>
     * queryInterface.addConstraint('Users', ['roles'], {
     *   type: 'check',
     *   where: {
     *      roles: ['user', 'admin', 'moderator', 'guest']
     *   }
     * });
     *
     * @example <caption>Default - MSSQL only</caption>
     * queryInterface.addConstraint('Users', ['roles'], {
     *    type: 'default',
     *    defaultValue: 'guest'
     * });
     *
     * @example <caption>Primary Key</caption>
     * queryInterface.addConstraint('Users', ['username'], {
     *    type: 'primary key',
     *    name: 'custom_primary_constraint_name'
     * });
     *
     * @example <caption>Foreign Key</caption>
     * queryInterface.addConstraint('Posts', ['username'], {
     *   type: 'foreign key',
     *   name: 'custom_fkey_constraint_name',
     *   references: { //Required field
     *     table: 'target_table_name',
     *     field: 'target_column_name'
     *   },
     *   onDelete: 'cascade',
     *   onUpdate: 'cascade'
     * });
     *
     * @param {string} tableName                  Table name where you want to add a constraint
     * @param {Array}  attributes                 Array of column names to apply the constraint over
     * @param {Object} options                    An object to define the constraint name, type etc
     * @param {string} options.type               Type of constraint. One of the values in available constraints(case insensitive)
     * @param {string} [options.name]             Name of the constraint. If not specified, sequelize automatically creates a named constraint based on constraint type, table & column names
     * @param {string} [options.defaultValue]     The value for the default constraint
     * @param {Object} [options.where]            Where clause/expression for the CHECK constraint
     * @param {Object} [options.references]       Object specifying target table, column name to create foreign key constraint
     * @param {string} [options.references.table] Target table name
     * @param {string} [options.references.field] Target column name
     * @param {string} [rawTablename]             Table name, for backward compatibility
     *
     * @returns {Promise}
     */

  }, {
    key: "addConstraint",
    value: function addConstraint(tableName, attributes, options, rawTablename) {
      if (!Array.isArray(attributes)) {
        rawTablename = options;
        options = attributes;
        attributes = options.fields;
      }

      if (!options.type) {
        throw new Error('Constraint type must be specified through options.type');
      }

      if (!rawTablename) {
        // Map for backwards compat
        rawTablename = tableName;
      }

      options = Utils.cloneDeep(options);
      options.fields = attributes;

      if (this.sequelize.dialect.name === 'sqlite') {
        return SQLiteQueryInterface.addConstraint(this, tableName, options, rawTablename);
      }

      const sql = this.QueryGenerator.addConstraintQuery(tableName, options, rawTablename);
      return this.sequelize.query(sql, options);
    }
  }, {
    key: "showConstraint",
    value: function showConstraint(tableName, constraintName, options) {
      const sql = this.QueryGenerator.showConstraintsQuery(tableName, constraintName);
      return this.sequelize.query(sql, Object.assign({}, options, {
        type: QueryTypes.SHOWCONSTRAINTS
      }));
    }
    /**
     * Remove a constraint from a table
     *
     * @param {string} tableName       Table name to drop constraint from
     * @param {string} constraintName  Constraint name
     * @param {Object} options         Query options
     *
     * @returns {Promise}
     */

  }, {
    key: "removeConstraint",
    value: function removeConstraint(tableName, constraintName, options) {
      options = options || {};

      switch (this.sequelize.options.dialect) {
        case 'sqlite':
          return SQLiteQueryInterface.removeConstraint(this, tableName, constraintName, options);

        default:
          const sql = this.QueryGenerator.removeConstraintQuery(tableName, constraintName);
          return this.sequelize.query(sql, options);
      }
    }
  }, {
    key: "insert",
    value: function insert(instance, tableName, values, options) {
      options = Utils.cloneDeep(options);
      options.hasTrigger = instance && instance.constructor.options.hasTrigger;
      const sql = this.QueryGenerator.insertQuery(tableName, values, instance && instance.constructor.rawAttributes, options);
      options.type = QueryTypes.INSERT;
      options.instance = instance;
      return this.sequelize.query(sql, options).then(results => {
        if (instance) results[0].isNewRecord = false;
        return results;
      });
    }
    /**
     * Upsert
     *
     * @param {string} tableName    table to upsert on
     * @param {Object} insertValues values to be inserted, mapped to field name
     * @param {Object} updateValues values to be updated, mapped to field name
     * @param {Object} where        various conditions
     * @param {Model}  model        Model to upsert on
     * @param {Object} options      query options
     *
     * @returns {Promise<boolean,?number>} Resolves an array with <created, primaryKey>
     */

  }, {
    key: "upsert",
    value: function upsert(tableName, insertValues, updateValues, where, model, options) {
      const wheres = [];
      const attributes = Object.keys(insertValues);
      let indexes = [];
      let indexFields;
      options = _.clone(options);

      if (!Utils.isWhereEmpty(where)) {
        wheres.push(where);
      } // Lets combine unique keys and indexes into one


      indexes = _.map(model.uniqueKeys, value => {
        return value.fields;
      });

      model._indexes.forEach(value => {
        if (value.unique) {
          // fields in the index may both the strings or objects with an attribute property - lets sanitize that
          indexFields = value.fields.map(field => {
            if (_.isPlainObject(field)) {
              return field.attribute;
            }

            return field;
          });
          indexes.push(indexFields);
        }
      });

      for (const index of indexes) {
        if (_.intersection(attributes, index).length === index.length) {
          where = {};

          for (const field of index) {
            where[field] = insertValues[field];
          }

          wheres.push(where);
        }
      }

      where = {
        [Op.or]: wheres
      };
      options.type = QueryTypes.UPSERT;
      options.raw = true;
      const sql = this.QueryGenerator.upsertQuery(tableName, insertValues, updateValues, where, model, options);
      return this.sequelize.query(sql, options).then(result => {
        switch (this.sequelize.options.dialect) {
          default:
            return [result, undefined];
        }
      });
    }
    /**
     * Insert multiple records into a table
     *
     * @example
     * queryInterface.bulkInsert('roles', [{
     *    label: 'user',
     *    createdAt: new Date(),
     *    updatedAt: new Date()
     *  }, {
     *    label: 'admin',
     *    createdAt: new Date(),
     *    updatedAt: new Date()
     *  }]);
     *
     * @param {string} tableName   Table name to insert record to
     * @param {Array}  records     List of records to insert
     * @param {Object} options     Various options, please see Model.bulkCreate options
     * @param {Object} attributes  Various attributes mapped by field name
     *
     * @returns {Promise}
     */

  }, {
    key: "bulkInsert",
    value: function bulkInsert(tableName, records, options, attributes) {
      options = _.clone(options) || {};
      options.type = QueryTypes.INSERT;
      return this.sequelize.query(this.QueryGenerator.bulkInsertQuery(tableName, records, options, attributes), options).then(results => results[0]);
    }
  }, {
    key: "update",
    value: function update(instance, tableName, values, identifier, options) {
      options = _.clone(options || {});
      options.hasTrigger = !!(instance && instance._modelOptions && instance._modelOptions.hasTrigger);
      const sql = this.QueryGenerator.updateQuery(tableName, values, identifier, options, instance.constructor.rawAttributes);
      options.type = QueryTypes.UPDATE;
      options.instance = instance;
      return this.sequelize.query(sql, options);
    }
    /**
     * Update multiple records of a table
     *
     * @example
     * queryInterface.bulkUpdate('roles', {
     *     label: 'admin',
     *   }, {
     *     userType: 3,
     *   },
     * );
     *
     * @param {string} tableName     Table name to update
     * @param {Object} values        Values to be inserted, mapped to field name
     * @param {Object} identifier    A hash with conditions OR an ID as integer OR a string with conditions
     * @param {Object} [options]     Various options, please see Model.bulkCreate options
     * @param {Object} [attributes]  Attributes on return objects if supported by SQL dialect
     *
     * @returns {Promise}
     */

  }, {
    key: "bulkUpdate",
    value: function bulkUpdate(tableName, values, identifier, options, attributes) {
      options = Utils.cloneDeep(options);
      if (typeof identifier === 'object') identifier = Utils.cloneDeep(identifier);
      const sql = this.QueryGenerator.updateQuery(tableName, values, identifier, options, attributes);
      const table = _.isObject(tableName) ? tableName : {
        tableName
      };

      const model = _.find(this.sequelize.modelManager.models, {
        tableName: table.tableName
      });

      options.type = QueryTypes.BULKUPDATE;
      options.model = model;
      return this.sequelize.query(sql, options);
    }
  }, {
    key: "delete",
    value: function _delete(instance, tableName, identifier, options) {
      const cascades = [];
      const sql = this.QueryGenerator.deleteQuery(tableName, identifier, {}, instance.constructor);
      options = _.clone(options) || {}; // Check for a restrict field

      if (!!instance.constructor && !!instance.constructor.associations) {
        const keys = Object.keys(instance.constructor.associations);
        const length = keys.length;
        let association;

        for (let i = 0; i < length; i++) {
          association = instance.constructor.associations[keys[i]];

          if (association.options && association.options.onDelete && association.options.onDelete.toLowerCase() === 'cascade' && association.options.useHooks === true) {
            cascades.push(association.accessors.get);
          }
        }
      }

      return Promise.each(cascades, cascade => {
        return instance[cascade](options).then(instances => {
          // Check for hasOne relationship with non-existing associate ("has zero")
          if (!instances) {
            return Promise.resolve();
          }

          if (!Array.isArray(instances)) instances = [instances];
          return Promise.each(instances, instance => instance.destroy(options));
        });
      }).then(() => {
        options.instance = instance;
        return this.sequelize.query(sql, options);
      });
    }
    /**
     * Delete multiple records from a table
     *
     * @param {string}  tableName            table name from where to delete records
     * @param {Object}  where                where conditions to find records to delete
     * @param {Object}  [options]            options
     * @param {boolean} [options.truncate]   Use truncate table command   
     * @param {boolean} [options.cascade=false]         Only used in conjunction with TRUNCATE. Truncates  all tables that have foreign-key references to the named table, or to any tables added to the group due to CASCADE.
     * @param {boolean} [options.restartIdentity=false] Only used in conjunction with TRUNCATE. Automatically restart sequences owned by columns of the truncated table.
     * @param {Model}   [model]              Model
     *
     * @returns {Promise}
     */

  }, {
    key: "bulkDelete",
    value: function bulkDelete(tableName, where, options, model) {
      options = Utils.cloneDeep(options);
      options = _.defaults(options, {
        limit: null
      });

      if (options.truncate === true) {
        return this.sequelize.query(this.QueryGenerator.truncateTableQuery(tableName, options), options);
      }

      if (typeof identifier === 'object') where = Utils.cloneDeep(where);
      return this.sequelize.query(this.QueryGenerator.deleteQuery(tableName, where, options, model), options);
    }
  }, {
    key: "select",
    value: function select(model, tableName, optionsArg) {
      const options = Object.assign({}, optionsArg, {
        type: QueryTypes.SELECT,
        model
      });
      return this.sequelize.query(this.QueryGenerator.selectQuery(tableName, options, model), options);
    }
  }, {
    key: "increment",
    value: function increment(model, tableName, values, identifier, options) {
      options = Utils.cloneDeep(options);
      const sql = this.QueryGenerator.arithmeticQuery('+', tableName, values, identifier, options, options.attributes);
      options.type = QueryTypes.UPDATE;
      options.model = model;
      return this.sequelize.query(sql, options);
    }
  }, {
    key: "decrement",
    value: function decrement(model, tableName, values, identifier, options) {
      options = Utils.cloneDeep(options);
      const sql = this.QueryGenerator.arithmeticQuery('-', tableName, values, identifier, options, options.attributes);
      options.type = QueryTypes.UPDATE;
      options.model = model;
      return this.sequelize.query(sql, options);
    }
  }, {
    key: "rawSelect",
    value: function rawSelect(tableName, options, attributeSelector, Model) {
      options = Utils.cloneDeep(options);
      options = _.defaults(options, {
        raw: true,
        plain: true,
        type: QueryTypes.SELECT
      });
      const sql = this.QueryGenerator.selectQuery(tableName, options, Model);

      if (attributeSelector === undefined) {
        throw new Error('Please pass an attribute selector!');
      }

      return this.sequelize.query(sql, options).then(data => {
        if (!options.plain) {
          return data;
        }

        const result = data ? data[attributeSelector] : null;

        if (!options || !options.dataType) {
          return result;
        }

        const dataType = options.dataType;

        if (dataType instanceof DataTypes.DECIMAL || dataType instanceof DataTypes.FLOAT) {
          if (result !== null) {
            return parseFloat(result);
          }
        }

        if (dataType instanceof DataTypes.INTEGER || dataType instanceof DataTypes.BIGINT) {
          return parseInt(result, 10);
        }

        if (dataType instanceof DataTypes.DATE) {
          if (result !== null && !(result instanceof Date)) {
            return new Date(result);
          }
        }

        return result;
      });
    }
  }, {
    key: "createTrigger",
    value: function createTrigger(tableName, triggerName, timingType, fireOnArray, functionName, functionParams, optionsArray, options) {
      const sql = this.QueryGenerator.createTrigger(tableName, triggerName, timingType, fireOnArray, functionName, functionParams, optionsArray);
      options = options || {};

      if (sql) {
        return this.sequelize.query(sql, options);
      }

      return Promise.resolve();
    }
  }, {
    key: "dropTrigger",
    value: function dropTrigger(tableName, triggerName, options) {
      const sql = this.QueryGenerator.dropTrigger(tableName, triggerName);
      options = options || {};

      if (sql) {
        return this.sequelize.query(sql, options);
      }

      return Promise.resolve();
    }
  }, {
    key: "renameTrigger",
    value: function renameTrigger(tableName, oldTriggerName, newTriggerName, options) {
      const sql = this.QueryGenerator.renameTrigger(tableName, oldTriggerName, newTriggerName);
      options = options || {};

      if (sql) {
        return this.sequelize.query(sql, options);
      }

      return Promise.resolve();
    }
    /**
     * Create an SQL function
     *
     * @example
     * queryInterface.createFunction(
     *   'someFunction',
     *   [
     *     {type: 'integer', name: 'param', direction: 'IN'}
     *   ],
     *   'integer',
     *   'plpgsql',
     *   'RETURN param + 1;',
     *   [
     *     'IMMUTABLE',
     *     'LEAKPROOF'
     *   ],
     *   {
     *    variables:
     *      [
     *        {type: 'integer', name: 'myVar', default: 100}
     *      ],
     *      force: true
     *   };
     * );
     *
     * @param {string}  functionName  Name of SQL function to create
     * @param {Array}   params        List of parameters declared for SQL function
     * @param {string}  returnType    SQL type of function returned value
     * @param {string}  language      The name of the language that the function is implemented in
     * @param {string}  body          Source code of function
     * @param {Array}   optionsArray  Extra-options for creation
     * @param {Object}  [options]     query options
     * @param {boolean} options.force If force is true, any existing functions with the same parameters will be replaced. For postgres, this means using `CREATE OR REPLACE FUNCTION` instead of `CREATE FUNCTION`. Default is false
     * @param {Array<Object>}   options.variables List of declared variables. Each variable should be an object with string fields `type` and `name`, and optionally having a `default` field as well.
     *
     * @returns {Promise}
     */

  }, {
    key: "createFunction",
    value: function createFunction(functionName, params, returnType, language, body, optionsArray, options) {
      const sql = this.QueryGenerator.createFunction(functionName, params, returnType, language, body, optionsArray, options);
      options = options || {};

      if (sql) {
        return this.sequelize.query(sql, options);
      }

      return Promise.resolve();
    }
    /**
     * Drop an SQL function
     *
     * @example
     * queryInterface.dropFunction(
     *   'someFunction',
     *   [
     *     {type: 'varchar', name: 'param1', direction: 'IN'},
     *     {type: 'integer', name: 'param2', direction: 'INOUT'}
     *   ]
     * );
     *
     * @param {string} functionName Name of SQL function to drop
     * @param {Array}  params       List of parameters declared for SQL function
     * @param {Object} [options]    query options
     *
     * @returns {Promise}
     */

  }, {
    key: "dropFunction",
    value: function dropFunction(functionName, params, options) {
      const sql = this.QueryGenerator.dropFunction(functionName, params);
      options = options || {};

      if (sql) {
        return this.sequelize.query(sql, options);
      }

      return Promise.resolve();
    }
    /**
     * Rename an SQL function
     *
     * @example
     * queryInterface.renameFunction(
     *   'fooFunction',
     *   [
     *     {type: 'varchar', name: 'param1', direction: 'IN'},
     *     {type: 'integer', name: 'param2', direction: 'INOUT'}
     *   ],
     *   'barFunction'
     * );
     *
     * @param {string} oldFunctionName  Current name of function
     * @param {Array}  params           List of parameters declared for SQL function
     * @param {string} newFunctionName  New name of function
     * @param {Object} [options]        query options
     *
     * @returns {Promise}
     */

  }, {
    key: "renameFunction",
    value: function renameFunction(oldFunctionName, params, newFunctionName, options) {
      const sql = this.QueryGenerator.renameFunction(oldFunctionName, params, newFunctionName);
      options = options || {};

      if (sql) {
        return this.sequelize.query(sql, options);
      }

      return Promise.resolve();
    } // Helper methods useful for querying

    /**
     * Escape an identifier (e.g. a table or attribute name)
     *
     * @param {string} identifier identifier to quote
     * @param {boolean} [force]   If force is true,the identifier will be quoted even if the `quoteIdentifiers` option is false.
     *
     * @private
     */

  }, {
    key: "quoteIdentifier",
    value: function quoteIdentifier(identifier, force) {
      return this.QueryGenerator.quoteIdentifier(identifier, force);
    }
  }, {
    key: "quoteTable",
    value: function quoteTable(identifier) {
      return this.QueryGenerator.quoteTable(identifier);
    }
    /**
     * Quote array of identifiers at once
     *
     * @param {string[]} identifiers array of identifiers to quote
     * @param {boolean} [force]   If force is true,the identifier will be quoted even if the `quoteIdentifiers` option is false.
     *
     * @private
     */

  }, {
    key: "quoteIdentifiers",
    value: function quoteIdentifiers(identifiers, force) {
      return this.QueryGenerator.quoteIdentifiers(identifiers, force);
    }
    /**
     * Escape a value (e.g. a string, number or date)
     *
     * @param {string} value string to escape
     *
     * @private
     */

  }, {
    key: "escape",
    value: function escape(value) {
      return this.QueryGenerator.escape(value);
    }
  }, {
    key: "setIsolationLevel",
    value: function setIsolationLevel(transaction, value, options) {
      if (!transaction || !(transaction instanceof Transaction)) {
        throw new Error('Unable to set isolation level for a transaction without transaction object!');
      }

      if (transaction.parent || !value) {
        // Not possible to set a separate isolation level for savepoints
        return Promise.resolve();
      }

      options = Object.assign({}, options, {
        transaction: transaction.parent || transaction
      });
      const sql = this.QueryGenerator.setIsolationLevelQuery(value, {
        parent: transaction.parent
      });
      if (!sql) return Promise.resolve();
      return this.sequelize.query(sql, options);
    }
  }, {
    key: "startTransaction",
    value: function startTransaction(transaction, options) {
      if (!transaction || !(transaction instanceof Transaction)) {
        throw new Error('Unable to start a transaction without transaction object!');
      }

      options = Object.assign({}, options, {
        transaction: transaction.parent || transaction
      });
      options.transaction.name = transaction.parent ? transaction.name : undefined;
      const sql = this.QueryGenerator.startTransactionQuery(transaction);
      return this.sequelize.query(sql, options);
    }
  }, {
    key: "deferConstraints",
    value: function deferConstraints(transaction, options) {
      options = Object.assign({}, options, {
        transaction: transaction.parent || transaction
      });
      const sql = this.QueryGenerator.deferConstraintsQuery(options);

      if (sql) {
        return this.sequelize.query(sql, options);
      }

      return Promise.resolve();
    }
  }, {
    key: "commitTransaction",
    value: function commitTransaction(transaction, options) {
      if (!transaction || !(transaction instanceof Transaction)) {
        throw new Error('Unable to commit a transaction without transaction object!');
      }

      if (transaction.parent) {
        // Savepoints cannot be committed
        return Promise.resolve();
      }

      options = Object.assign({}, options, {
        transaction: transaction.parent || transaction,
        supportsSearchPath: false,
        completesTransaction: true
      });
      const sql = this.QueryGenerator.commitTransactionQuery(transaction);
      const promise = this.sequelize.query(sql, options);
      transaction.finished = 'commit';
      return promise;
    }
  }, {
    key: "rollbackTransaction",
    value: function rollbackTransaction(transaction, options) {
      if (!transaction || !(transaction instanceof Transaction)) {
        throw new Error('Unable to rollback a transaction without transaction object!');
      }

      options = Object.assign({}, options, {
        transaction: transaction.parent || transaction,
        supportsSearchPath: false,
        completesTransaction: true
      });
      options.transaction.name = transaction.parent ? transaction.name : undefined;
      const sql = this.QueryGenerator.rollbackTransactionQuery(transaction);
      const promise = this.sequelize.query(sql, options);
      transaction.finished = 'rollback';
      return promise;
    }
  }]);

  return QueryInterface;
}();

module.exports = QueryInterface;
module.exports.QueryInterface = QueryInterface;
module.exports.default = QueryInterface;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9xdWVyeS1pbnRlcmZhY2UuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJVdGlscyIsIkRhdGFUeXBlcyIsIlNRTGl0ZVF1ZXJ5SW50ZXJmYWNlIiwiVHJhbnNhY3Rpb24iLCJQcm9taXNlIiwiUXVlcnlUeXBlcyIsIk9wIiwiUXVlcnlJbnRlcmZhY2UiLCJzZXF1ZWxpemUiLCJRdWVyeUdlbmVyYXRvciIsImRpYWxlY3QiLCJkYXRhYmFzZSIsIm9wdGlvbnMiLCJzcWwiLCJjcmVhdGVEYXRhYmFzZVF1ZXJ5IiwicXVlcnkiLCJkcm9wRGF0YWJhc2VRdWVyeSIsInNjaGVtYSIsImNyZWF0ZVNjaGVtYSIsImRyb3BTY2hlbWEiLCJfZGlhbGVjdCIsInN1cHBvcnRzIiwic2NoZW1hcyIsImRyb3AiLCJzaG93QWxsU2NoZW1hcyIsIm1hcCIsInNjaGVtYU5hbWUiLCJPYmplY3QiLCJhc3NpZ24iLCJyYXciLCJ0eXBlIiwiU0VMRUNUIiwic2hvd1NjaGVtYXNTcWwiLCJzaG93U2NoZW1hc1F1ZXJ5IiwidGhlbiIsInNjaGVtYU5hbWVzIiwiZmxhdHRlbiIsInZhbHVlIiwic2NoZW1hX25hbWUiLCJ2ZXJzaW9uUXVlcnkiLCJWRVJTSU9OIiwidGFibGVOYW1lIiwiYXR0cmlidXRlcyIsIm1vZGVsIiwicHJvbWlzZSIsImNsb25lIiwidW5pcXVlS2V5cyIsImZvck93biIsInVuaXF1ZUtleSIsImN1c3RvbUluZGV4IiwidW5kZWZpbmVkIiwibWFwVmFsdWVzIiwiYXR0cmlidXRlIiwibm9ybWFsaXplQXR0cmlidXRlIiwiUG9zdGdyZXNRdWVyeUludGVyZmFjZSIsImVuc3VyZUVudW1zIiwicmVzb2x2ZSIsIl9zY2hlbWEiLCJhZGRTY2hlbWEiLCJhdHRyaWJ1dGVzVG9TUUwiLCJ0YWJsZSIsImNvbnRleHQiLCJjcmVhdGVUYWJsZVF1ZXJ5IiwiY2FzY2FkZSIsImZvcmNlIiwiZHJvcFRhYmxlUXVlcnkiLCJwcm9taXNlcyIsImluc3RhbmNlVGFibGUiLCJtb2RlbE1hbmFnZXIiLCJnZXRNb2RlbCIsImdldFRhYmxlTmFtZSIsImtleXMiLCJyYXdBdHRyaWJ1dGVzIiwia2V5TGVuIiwibGVuZ3RoIiwiaSIsIkVOVU0iLCJwZ0VudW1Ecm9wIiwic3VwcG9ydHNTZWFyY2hQYXRoIiwicHVzaCIsImFsbCIsImdldCIsInNraXAiLCJkcm9wQWxsVGFibGVzIiwidGFibGVOYW1lcyIsImVhY2giLCJpbmNsdWRlcyIsImRyb3BUYWJsZSIsInNob3dBbGxUYWJsZXMiLCJyZXN1bHQiLCJmb3JlaWduS2V5c0FyZUVuYWJsZWQiLCJmb3JlaWduX2tleXMiLCJnZXRGb3JlaWduS2V5c0ZvclRhYmxlcyIsImZvcmVpZ25LZXlzIiwicXVlcmllcyIsImZvckVhY2giLCJub3JtYWxpemVkVGFibGVOYW1lIiwiaXNPYmplY3QiLCJmb3JlaWduS2V5IiwiZHJvcEZvcmVpZ25LZXlRdWVyeSIsInEiLCJlbnVtTmFtZSIsImdldERpYWxlY3QiLCJwZ0VzY2FwZUFuZFF1b3RlIiwicGdMaXN0RW51bXMiLCJlbnVtX25hbWUiLCJwbGFpbiIsImJlZm9yZSIsImFmdGVyIiwicmVuYW1lVGFibGVRdWVyeSIsIlNIT1dUQUJMRVMiLCJzaG93VGFibGVzU3FsIiwic2hvd1RhYmxlc1F1ZXJ5IiwiY29uZmlnIiwic2NoZW1hRGVsaW1pdGVyIiwiZGVzY3JpYmVUYWJsZVF1ZXJ5IiwiREVTQ1JJQkUiLCJkYXRhIiwiaXNFbXB0eSIsIkVycm9yIiwiY2F0Y2giLCJlIiwib3JpZ2luYWwiLCJjb2RlIiwia2V5IiwiYWRkQ29sdW1uUXVlcnkiLCJhdHRyaWJ1dGVOYW1lIiwicmVtb3ZlQ29sdW1uIiwicmVtb3ZlQ29sdW1uUXVlcnkiLCJkYXRhVHlwZU9yT3B0aW9ucyIsInZhbHVlcyIsImFsbG93TnVsbCIsImNoYW5nZUNvbHVtbiIsImNoYW5nZUNvbHVtblF1ZXJ5IiwiYXR0ck5hbWVCZWZvcmUiLCJhdHRyTmFtZUFmdGVyIiwiZGVzY3JpYmVUYWJsZSIsIl9vcHRpb25zIiwiZGVmYXVsdFZhbHVlIiwicmVuYW1lQ29sdW1uIiwicmVuYW1lQ29sdW1uUXVlcnkiLCJyYXdUYWJsZW5hbWUiLCJBcnJheSIsImlzQXJyYXkiLCJmaWVsZHMiLCJjbG9uZURlZXAiLCJhZGRJbmRleFF1ZXJ5Iiwic2hvd0luZGV4ZXNRdWVyeSIsIlNIT1dJTkRFWEVTIiwiRk9SRUlHTktFWVMiLCJnZXRGb3JlaWduS2V5c1F1ZXJ5IiwicmVzdWx0cyIsInIiLCJjb25zdHJhaW50X25hbWUiLCJmaWx0ZXIiLCJpZGVudGl0eSIsInF1ZXJ5T3B0aW9ucyIsImNhdGFsb2dOYW1lIiwiZ2V0Rm9yZWlnbktleVJlZmVyZW5jZXNGb3JUYWJsZSIsImluZGV4TmFtZU9yQXR0cmlidXRlcyIsInJlbW92ZUluZGV4UXVlcnkiLCJuYW1lIiwiYWRkQ29uc3RyYWludCIsImFkZENvbnN0cmFpbnRRdWVyeSIsImNvbnN0cmFpbnROYW1lIiwic2hvd0NvbnN0cmFpbnRzUXVlcnkiLCJTSE9XQ09OU1RSQUlOVFMiLCJyZW1vdmVDb25zdHJhaW50IiwicmVtb3ZlQ29uc3RyYWludFF1ZXJ5IiwiaW5zdGFuY2UiLCJoYXNUcmlnZ2VyIiwiY29uc3RydWN0b3IiLCJpbnNlcnRRdWVyeSIsIklOU0VSVCIsImlzTmV3UmVjb3JkIiwiaW5zZXJ0VmFsdWVzIiwidXBkYXRlVmFsdWVzIiwid2hlcmUiLCJ3aGVyZXMiLCJpbmRleGVzIiwiaW5kZXhGaWVsZHMiLCJpc1doZXJlRW1wdHkiLCJfaW5kZXhlcyIsInVuaXF1ZSIsImZpZWxkIiwiaXNQbGFpbk9iamVjdCIsImluZGV4IiwiaW50ZXJzZWN0aW9uIiwib3IiLCJVUFNFUlQiLCJ1cHNlcnRRdWVyeSIsInJlY29yZHMiLCJidWxrSW5zZXJ0UXVlcnkiLCJpZGVudGlmaWVyIiwiX21vZGVsT3B0aW9ucyIsInVwZGF0ZVF1ZXJ5IiwiVVBEQVRFIiwiZmluZCIsIm1vZGVscyIsIkJVTEtVUERBVEUiLCJjYXNjYWRlcyIsImRlbGV0ZVF1ZXJ5IiwiYXNzb2NpYXRpb25zIiwiYXNzb2NpYXRpb24iLCJvbkRlbGV0ZSIsInRvTG93ZXJDYXNlIiwidXNlSG9va3MiLCJhY2Nlc3NvcnMiLCJpbnN0YW5jZXMiLCJkZXN0cm95IiwiZGVmYXVsdHMiLCJsaW1pdCIsInRydW5jYXRlIiwidHJ1bmNhdGVUYWJsZVF1ZXJ5Iiwib3B0aW9uc0FyZyIsInNlbGVjdFF1ZXJ5IiwiYXJpdGhtZXRpY1F1ZXJ5IiwiYXR0cmlidXRlU2VsZWN0b3IiLCJNb2RlbCIsImRhdGFUeXBlIiwiREVDSU1BTCIsIkZMT0FUIiwicGFyc2VGbG9hdCIsIklOVEVHRVIiLCJCSUdJTlQiLCJwYXJzZUludCIsIkRBVEUiLCJEYXRlIiwidHJpZ2dlck5hbWUiLCJ0aW1pbmdUeXBlIiwiZmlyZU9uQXJyYXkiLCJmdW5jdGlvbk5hbWUiLCJmdW5jdGlvblBhcmFtcyIsIm9wdGlvbnNBcnJheSIsImNyZWF0ZVRyaWdnZXIiLCJkcm9wVHJpZ2dlciIsIm9sZFRyaWdnZXJOYW1lIiwibmV3VHJpZ2dlck5hbWUiLCJyZW5hbWVUcmlnZ2VyIiwicGFyYW1zIiwicmV0dXJuVHlwZSIsImxhbmd1YWdlIiwiYm9keSIsImNyZWF0ZUZ1bmN0aW9uIiwiZHJvcEZ1bmN0aW9uIiwib2xkRnVuY3Rpb25OYW1lIiwibmV3RnVuY3Rpb25OYW1lIiwicmVuYW1lRnVuY3Rpb24iLCJxdW90ZUlkZW50aWZpZXIiLCJxdW90ZVRhYmxlIiwiaWRlbnRpZmllcnMiLCJxdW90ZUlkZW50aWZpZXJzIiwiZXNjYXBlIiwidHJhbnNhY3Rpb24iLCJwYXJlbnQiLCJzZXRJc29sYXRpb25MZXZlbFF1ZXJ5Iiwic3RhcnRUcmFuc2FjdGlvblF1ZXJ5IiwiZGVmZXJDb25zdHJhaW50c1F1ZXJ5IiwiY29tcGxldGVzVHJhbnNhY3Rpb24iLCJjb21taXRUcmFuc2FjdGlvblF1ZXJ5IiwiZmluaXNoZWQiLCJyb2xsYmFja1RyYW5zYWN0aW9uUXVlcnkiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBRUEsTUFBTUEs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OlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5cclxuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcbmNvbnN0IERhdGFUeXBlcyA9IHJlcXVpcmUoJy4vZGF0YS10eXBlcycpO1xyXG5jb25zdCBTUUxpdGVRdWVyeUludGVyZmFjZSA9IHJlcXVpcmUoJy4vZGlhbGVjdHMvc3FsaXRlL3F1ZXJ5LWludGVyZmFjZScpO1xyXG5jb25zdCBUcmFuc2FjdGlvbiA9IHJlcXVpcmUoJy4vdHJhbnNhY3Rpb24nKTtcclxuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpO1xyXG5jb25zdCBRdWVyeVR5cGVzID0gcmVxdWlyZSgnLi9xdWVyeS10eXBlcycpO1xyXG5jb25zdCBPcCA9IHJlcXVpcmUoJy4vb3BlcmF0b3JzJyk7XHJcblxyXG4vKipcclxuICogVGhlIGludGVyZmFjZSB0aGF0IFNlcXVlbGl6ZSB1c2VzIHRvIHRhbGsgdG8gYWxsIGRhdGFiYXNlc1xyXG4gKlxyXG4gKiBAY2xhc3MgUXVlcnlJbnRlcmZhY2VcclxuICovXHJcbmNsYXNzIFF1ZXJ5SW50ZXJmYWNlIHtcclxuICBjb25zdHJ1Y3RvcihzZXF1ZWxpemUpIHtcclxuICAgIHRoaXMuc2VxdWVsaXplID0gc2VxdWVsaXplO1xyXG4gICAgdGhpcy5RdWVyeUdlbmVyYXRvciA9IHRoaXMuc2VxdWVsaXplLmRpYWxlY3QuUXVlcnlHZW5lcmF0b3I7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBkYXRhYmFzZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFiYXNlICBEYXRhYmFzZSBuYW1lIHRvIGNyZWF0ZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jaGFyc2V0XSBEYXRhYmFzZSBkZWZhdWx0IGNoYXJhY3RlciBzZXQsIE1ZU1FMIG9ubHlcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY29sbGF0ZV0gRGF0YWJhc2UgZGVmYXVsdCBjb2xsYXRpb25cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZW5jb2RpbmddIERhdGFiYXNlIGRlZmF1bHQgY2hhcmFjdGVyIHNldCwgUG9zdGdyZVNRTCBvbmx5XHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmN0eXBlXSBEYXRhYmFzZSBjaGFyYWN0ZXIgY2xhc3NpZmljYXRpb24sIFBvc3RncmVTUUwgb25seVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZV0gVGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIGZyb20gd2hpY2ggdG8gY3JlYXRlIHRoZSBuZXcgZGF0YWJhc2UsIFBvc3RncmVTUUwgb25seVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgY3JlYXRlRGF0YWJhc2UoZGF0YWJhc2UsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGRhdGFiYXNlLCBvcHRpb25zKTtcclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHJvcCBhIGRhdGFiYXNlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YWJhc2UgIERhdGFiYXNlIG5hbWUgdG8gZHJvcFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgZHJvcERhdGFiYXNlKGRhdGFiYXNlLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuZHJvcERhdGFiYXNlUXVlcnkoZGF0YWJhc2UpO1xyXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBzY2hlbWFcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWEgICAgU2NoZW1hIG5hbWUgdG8gY3JlYXRlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBjcmVhdGVTY2hlbWEoc2NoZW1hLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuY3JlYXRlU2NoZW1hKHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERyb3AgYSBzY2hlbWFcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWEgICAgU2NoZW1hIG5hbWUgdG8gZHJvcFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgZHJvcFNjaGVtYShzY2hlbWEsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5kcm9wU2NoZW1hKHNjaGVtYSk7XHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERyb3AgYWxsIHNjaGVtYXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgZHJvcEFsbFNjaGVtYXMob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgaWYgKCF0aGlzLlF1ZXJ5R2VuZXJhdG9yLl9kaWFsZWN0LnN1cHBvcnRzLnNjaGVtYXMpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLmRyb3Aob3B0aW9ucyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5zaG93QWxsU2NoZW1hcyhvcHRpb25zKS5tYXAoc2NoZW1hTmFtZSA9PiB0aGlzLmRyb3BTY2hlbWEoc2NoZW1hTmFtZSwgb3B0aW9ucykpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2hvdyBhbGwgc2NoZW1hc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBcnJheT59XHJcbiAgICovXHJcbiAgc2hvd0FsbFNjaGVtYXMob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcclxuICAgICAgcmF3OiB0cnVlLFxyXG4gICAgICB0eXBlOiB0aGlzLnNlcXVlbGl6ZS5RdWVyeVR5cGVzLlNFTEVDVFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc2hvd1NjaGVtYXNTcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnNob3dTY2hlbWFzUXVlcnkob3B0aW9ucyk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNob3dTY2hlbWFzU3FsLCBvcHRpb25zKS50aGVuKHNjaGVtYU5hbWVzID0+IF8uZmxhdHRlbihcclxuICAgICAgc2NoZW1hTmFtZXMubWFwKHZhbHVlID0+IHZhbHVlLnNjaGVtYV9uYW1lID8gdmFsdWUuc2NoZW1hX25hbWUgOiB2YWx1ZSlcclxuICAgICkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJuIGRhdGFiYXNlIHZlcnNpb25cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICBbb3B0aW9uc10gICAgICBRdWVyeSBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtRdWVyeVR5cGV9IFtvcHRpb25zLnR5cGVdIFF1ZXJ5IHR5cGVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZGF0YWJhc2VWZXJzaW9uKG9wdGlvbnMpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShcclxuICAgICAgdGhpcy5RdWVyeUdlbmVyYXRvci52ZXJzaW9uUXVlcnkoKSxcclxuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyB0eXBlOiBRdWVyeVR5cGVzLlZFUlNJT04gfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSB0YWJsZSB3aXRoIGdpdmVuIHNldCBvZiBhdHRyaWJ1dGVzXHJcbiAgICpcclxuICAgKiBgYGBqc1xyXG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmNyZWF0ZVRhYmxlKFxyXG4gICAqICAgJ25hbWVPZlRoZU5ld1RhYmxlJyxcclxuICAgKiAgIHtcclxuICAgKiAgICAgaWQ6IHtcclxuICAgKiAgICAgICB0eXBlOiBTZXF1ZWxpemUuSU5URUdFUixcclxuICAgKiAgICAgICBwcmltYXJ5S2V5OiB0cnVlLFxyXG4gICAqICAgICAgIGF1dG9JbmNyZW1lbnQ6IHRydWVcclxuICAgKiAgICAgfSxcclxuICAgKiAgICAgY3JlYXRlZEF0OiB7XHJcbiAgICogICAgICAgdHlwZTogU2VxdWVsaXplLkRBVEVcclxuICAgKiAgICAgfSxcclxuICAgKiAgICAgdXBkYXRlZEF0OiB7XHJcbiAgICogICAgICAgdHlwZTogU2VxdWVsaXplLkRBVEVcclxuICAgKiAgICAgfSxcclxuICAgKiAgICAgYXR0cjE6IFNlcXVlbGl6ZS5TVFJJTkcsXHJcbiAgICogICAgIGF0dHIyOiBTZXF1ZWxpemUuSU5URUdFUixcclxuICAgKiAgICAgYXR0cjM6IHtcclxuICAgKiAgICAgICB0eXBlOiBTZXF1ZWxpemUuQk9PTEVBTixcclxuICAgKiAgICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxyXG4gICAqICAgICAgIGFsbG93TnVsbDogZmFsc2VcclxuICAgKiAgICAgfSxcclxuICAgKiAgICAgLy9mb3JlaWduIGtleSB1c2FnZVxyXG4gICAqICAgICBhdHRyNDoge1xyXG4gICAqICAgICAgIHR5cGU6IFNlcXVlbGl6ZS5JTlRFR0VSLFxyXG4gICAqICAgICAgIHJlZmVyZW5jZXM6IHtcclxuICAgKiAgICAgICAgIG1vZGVsOiAnYW5vdGhlcl90YWJsZV9uYW1lJyxcclxuICAgKiAgICAgICAgIGtleTogJ2lkJ1xyXG4gICAqICAgICAgIH0sXHJcbiAgICogICAgICAgb25VcGRhdGU6ICdjYXNjYWRlJyxcclxuICAgKiAgICAgICBvbkRlbGV0ZTogJ2Nhc2NhZGUnXHJcbiAgICogICAgIH1cclxuICAgKiAgIH0sXHJcbiAgICogICB7XHJcbiAgICogICAgIGVuZ2luZTogJ01ZSVNBTScsICAgIC8vIGRlZmF1bHQ6ICdJbm5vREInXHJcbiAgICogICAgIGNoYXJzZXQ6ICdsYXRpbjEnLCAgIC8vIGRlZmF1bHQ6IG51bGxcclxuICAgKiAgICAgc2NoZW1hOiAncHVibGljJywgICAgLy8gZGVmYXVsdDogcHVibGljLCBQb3N0Z3JlU1FMIG9ubHkuXHJcbiAgICogICAgIGNvbW1lbnQ6ICdteSB0YWJsZScsIC8vIGNvbW1lbnQgZm9yIHRhYmxlXHJcbiAgICogICAgIGNvbGxhdGU6ICdsYXRpbjFfZGFuaXNoX2NpJyAvLyBjb2xsYXRpb24sIE1ZU1FMIG9ubHlcclxuICAgKiAgIH1cclxuICAgKiApXHJcbiAgICogYGBgXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lICBOYW1lIG9mIHRhYmxlIHRvIGNyZWF0ZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzIE9iamVjdCByZXByZXNlbnRpbmcgYSBsaXN0IG9mIHRhYmxlIGF0dHJpYnV0ZXMgdG8gY3JlYXRlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBjcmVhdGUgdGFibGUgYW5kIHF1ZXJ5IG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge01vZGVsfSAgW21vZGVsXSBtb2RlbCBjbGFzc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgY3JlYXRlVGFibGUodGFibGVOYW1lLCBhdHRyaWJ1dGVzLCBvcHRpb25zLCBtb2RlbCkge1xyXG4gICAgbGV0IHNxbCA9ICcnO1xyXG4gICAgbGV0IHByb21pc2U7XHJcblxyXG4gICAgb3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucykgfHwge307XHJcblxyXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy51bmlxdWVLZXlzKSB7XHJcbiAgICAgIF8uZm9yT3duKG9wdGlvbnMudW5pcXVlS2V5cywgdW5pcXVlS2V5ID0+IHtcclxuICAgICAgICBpZiAodW5pcXVlS2V5LmN1c3RvbUluZGV4ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHVuaXF1ZUtleS5jdXN0b21JbmRleCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobW9kZWwpIHtcclxuICAgICAgb3B0aW9ucy51bmlxdWVLZXlzID0gb3B0aW9ucy51bmlxdWVLZXlzIHx8IG1vZGVsLnVuaXF1ZUtleXM7XHJcbiAgICB9XHJcblxyXG4gICAgYXR0cmlidXRlcyA9IF8ubWFwVmFsdWVzKFxyXG4gICAgICBhdHRyaWJ1dGVzLFxyXG4gICAgICBhdHRyaWJ1dGUgPT4gdGhpcy5zZXF1ZWxpemUubm9ybWFsaXplQXR0cmlidXRlKGF0dHJpYnV0ZSlcclxuICAgICk7XHJcblxyXG4gICAgLy8gUG9zdGdyZXMgcmVxdWlyZXMgc3BlY2lhbCBTUUwgY29tbWFuZHMgZm9yIEVOVU0vRU5VTVtdXHJcbiAgICBpZiAodGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0ID09PSAncG9zdGdyZXMnKSB7XHJcbiAgICAgIHByb21pc2UgPSBQb3N0Z3Jlc1F1ZXJ5SW50ZXJmYWNlLmVuc3VyZUVudW1zKHRoaXMsIHRhYmxlTmFtZSwgYXR0cmlidXRlcywgb3B0aW9ucywgbW9kZWwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChcclxuICAgICAgIXRhYmxlTmFtZS5zY2hlbWEgJiZcclxuICAgICAgKG9wdGlvbnMuc2NoZW1hIHx8ICEhbW9kZWwgJiYgbW9kZWwuX3NjaGVtYSlcclxuICAgICkge1xyXG4gICAgICB0YWJsZU5hbWUgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmFkZFNjaGVtYSh7XHJcbiAgICAgICAgdGFibGVOYW1lLFxyXG4gICAgICAgIF9zY2hlbWE6ICEhbW9kZWwgJiYgbW9kZWwuX3NjaGVtYSB8fCBvcHRpb25zLnNjaGVtYVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhdHRyaWJ1dGVzID0gdGhpcy5RdWVyeUdlbmVyYXRvci5hdHRyaWJ1dGVzVG9TUUwoYXR0cmlidXRlcywgeyB0YWJsZTogdGFibGVOYW1lLCBjb250ZXh0OiAnY3JlYXRlVGFibGUnIH0pO1xyXG4gICAgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5jcmVhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcywgb3B0aW9ucyk7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2UudGhlbigoKSA9PiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERyb3AgYSB0YWJsZSBmcm9tIGRhdGFiYXNlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lIFRhYmxlIG5hbWUgdG8gZHJvcFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zICAgUXVlcnkgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgZHJvcFRhYmxlKHRhYmxlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgLy8gaWYgd2UncmUgZm9yY2luZyB3ZSBzaG91bGQgYmUgY2FzY2FkaW5nIHVubGVzcyBleHBsaWNpdGx5IHN0YXRlZCBvdGhlcndpc2VcclxuICAgIG9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpIHx8IHt9O1xyXG4gICAgb3B0aW9ucy5jYXNjYWRlID0gb3B0aW9ucy5jYXNjYWRlIHx8IG9wdGlvbnMuZm9yY2UgfHwgZmFsc2U7XHJcblxyXG4gICAgbGV0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuZHJvcFRhYmxlUXVlcnkodGFibGVOYW1lLCBvcHRpb25zKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKS50aGVuKCgpID0+IHtcclxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcclxuXHJcbiAgICAgIC8vIFNpbmNlIHBvc3RncmVzIGhhcyBhIHNwZWNpYWwgY2FzZSBmb3IgZW51bXMsIHdlIHNob3VsZCBkcm9wIHRoZSByZWxhdGVkXHJcbiAgICAgIC8vIGVudW0gdHlwZSB3aXRoaW4gdGhlIHRhYmxlIGFuZCBhdHRyaWJ1dGVcclxuICAgICAgaWYgKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCA9PT0gJ3Bvc3RncmVzJykge1xyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlVGFibGUgPSB0aGlzLnNlcXVlbGl6ZS5tb2RlbE1hbmFnZXIuZ2V0TW9kZWwodGFibGVOYW1lLCB7IGF0dHJpYnV0ZTogJ3RhYmxlTmFtZScgfSk7XHJcblxyXG4gICAgICAgIGlmIChpbnN0YW5jZVRhYmxlKSB7XHJcbiAgICAgICAgICBjb25zdCBnZXRUYWJsZU5hbWUgPSAoIW9wdGlvbnMgfHwgIW9wdGlvbnMuc2NoZW1hIHx8IG9wdGlvbnMuc2NoZW1hID09PSAncHVibGljJyA/ICcnIDogYCR7b3B0aW9ucy5zY2hlbWF9X2ApICsgdGFibGVOYW1lO1xyXG5cclxuICAgICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhpbnN0YW5jZVRhYmxlLnJhd0F0dHJpYnV0ZXMpO1xyXG4gICAgICAgICAgY29uc3Qga2V5TGVuID0ga2V5cy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlMZW47IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoaW5zdGFuY2VUYWJsZS5yYXdBdHRyaWJ1dGVzW2tleXNbaV1dLnR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuRU5VTSkge1xyXG4gICAgICAgICAgICAgIHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IucGdFbnVtRHJvcChnZXRUYWJsZU5hbWUsIGtleXNbaV0pO1xyXG4gICAgICAgICAgICAgIG9wdGlvbnMuc3VwcG9ydHNTZWFyY2hQYXRoID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgcmF3OiB0cnVlIH0pKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykuZ2V0KDApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcm9wIGFsbCB0YWJsZXMgZnJvbSBkYXRhYmFzZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBxdWVyeSBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtBcnJheX0gIFtvcHRpb25zLnNraXBdIExpc3Qgb2YgdGFibGUgdG8gc2tpcFxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgZHJvcEFsbFRhYmxlcyhvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIGNvbnN0IHNraXAgPSBvcHRpb25zLnNraXAgfHwgW107XHJcblxyXG4gICAgY29uc3QgZHJvcEFsbFRhYmxlcyA9IHRhYmxlTmFtZXMgPT4gUHJvbWlzZS5lYWNoKHRhYmxlTmFtZXMsIHRhYmxlTmFtZSA9PiB7XHJcbiAgICAgIC8vIGlmIHRhYmxlTmFtZSBpcyBub3QgaW4gdGhlIEFycmF5IG9mIHRhYmxlcyBuYW1lcyB0aGVuIGRvbid0IGRyb3AgaXRcclxuICAgICAgaWYgKCFza2lwLmluY2x1ZGVzKHRhYmxlTmFtZS50YWJsZU5hbWUgfHwgdGFibGVOYW1lKSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRyb3BUYWJsZSh0YWJsZU5hbWUsIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgY2FzY2FkZTogdHJ1ZSB9KSApO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5zaG93QWxsVGFibGVzKG9wdGlvbnMpLnRoZW4odGFibGVOYW1lcyA9PiB7XHJcbiAgICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QgPT09ICdzcWxpdGUnKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KCdQUkFHTUEgZm9yZWlnbl9rZXlzOycsIG9wdGlvbnMpLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgICAgICAgIGNvbnN0IGZvcmVpZ25LZXlzQXJlRW5hYmxlZCA9IHJlc3VsdC5mb3JlaWduX2tleXMgPT09IDE7XHJcblxyXG4gICAgICAgICAgaWYgKGZvcmVpZ25LZXlzQXJlRW5hYmxlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoJ1BSQUdNQSBmb3JlaWduX2tleXMgPSBPRkYnLCBvcHRpb25zKVxyXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IGRyb3BBbGxUYWJsZXModGFibGVOYW1lcykpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZXF1ZWxpemUucXVlcnkoJ1BSQUdNQSBmb3JlaWduX2tleXMgPSBPTicsIG9wdGlvbnMpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBkcm9wQWxsVGFibGVzKHRhYmxlTmFtZXMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLmdldEZvcmVpZ25LZXlzRm9yVGFibGVzKHRhYmxlTmFtZXMsIG9wdGlvbnMpLnRoZW4oZm9yZWlnbktleXMgPT4ge1xyXG4gICAgICAgIGNvbnN0IHF1ZXJpZXMgPSBbXTtcclxuXHJcbiAgICAgICAgdGFibGVOYW1lcy5mb3JFYWNoKHRhYmxlTmFtZSA9PiB7XHJcbiAgICAgICAgICBsZXQgbm9ybWFsaXplZFRhYmxlTmFtZSA9IHRhYmxlTmFtZTtcclxuICAgICAgICAgIGlmIChfLmlzT2JqZWN0KHRhYmxlTmFtZSkpIHtcclxuICAgICAgICAgICAgbm9ybWFsaXplZFRhYmxlTmFtZSA9IGAke3RhYmxlTmFtZS5zY2hlbWF9LiR7dGFibGVOYW1lLnRhYmxlTmFtZX1gO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGZvcmVpZ25LZXlzW25vcm1hbGl6ZWRUYWJsZU5hbWVdLmZvckVhY2goZm9yZWlnbktleSA9PiB7XHJcbiAgICAgICAgICAgIHF1ZXJpZXMucHVzaCh0aGlzLlF1ZXJ5R2VuZXJhdG9yLmRyb3BGb3JlaWduS2V5UXVlcnkodGFibGVOYW1lLCBmb3JlaWduS2V5KSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UuZWFjaChxdWVyaWVzLCBxID0+IHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHEsIG9wdGlvbnMpKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gZHJvcEFsbFRhYmxlcyh0YWJsZU5hbWVzKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcm9wIHNwZWNpZmllZCBlbnVtIGZyb20gZGF0YWJhc2UgKFBvc3RncmVzIG9ubHkpXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2VudW1OYW1lXSAgRW51bSBuYW1lIHRvIGRyb3BcclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBRdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGRyb3BFbnVtKGVudW1OYW1lLCBvcHRpb25zKSB7XHJcbiAgICBpZiAodGhpcy5zZXF1ZWxpemUuZ2V0RGlhbGVjdCgpICE9PSAncG9zdGdyZXMnKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoXHJcbiAgICAgIHRoaXMuUXVlcnlHZW5lcmF0b3IucGdFbnVtRHJvcChudWxsLCBudWxsLCB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnBnRXNjYXBlQW5kUXVvdGUoZW51bU5hbWUpKSxcclxuICAgICAgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyByYXc6IHRydWUgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEcm9wIGFsbCBlbnVtcyBmcm9tIGRhdGFiYXNlIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgUXVlcnkgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBkcm9wQWxsRW51bXMob3B0aW9ucykge1xyXG4gICAgaWYgKHRoaXMuc2VxdWVsaXplLmdldERpYWxlY3QoKSAhPT0gJ3Bvc3RncmVzJykge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgcmV0dXJuIHRoaXMucGdMaXN0RW51bXMobnVsbCwgb3B0aW9ucykubWFwKHJlc3VsdCA9PiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShcclxuICAgICAgdGhpcy5RdWVyeUdlbmVyYXRvci5wZ0VudW1Ecm9wKG51bGwsIG51bGwsIHRoaXMuUXVlcnlHZW5lcmF0b3IucGdFc2NhcGVBbmRRdW90ZShyZXN1bHQuZW51bV9uYW1lKSksXHJcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgcmF3OiB0cnVlIH0pXHJcbiAgICApKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExpc3QgYWxsIGVudW1zIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFt0YWJsZU5hbWVdICBUYWJsZSB3aG9zZSBlbnVtIHRvIGxpc3RcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdICAgIFF1ZXJ5IG9wdGlvbnNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgcGdMaXN0RW51bXModGFibGVOYW1lLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IucGdMaXN0RW51bXModGFibGVOYW1lKTtcclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgcGxhaW46IGZhbHNlLCByYXc6IHRydWUsIHR5cGU6IFF1ZXJ5VHlwZXMuU0VMRUNUIH0pKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbmFtZSBhIHRhYmxlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gYmVmb3JlICAgIEN1cnJlbnQgbmFtZSBvZiB0YWJsZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZnRlciAgICAgTmV3IG5hbWUgZnJvbSB0YWJsZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgcmVuYW1lVGFibGUoYmVmb3JlLCBhZnRlciwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnJlbmFtZVRhYmxlUXVlcnkoYmVmb3JlLCBhZnRlcik7XHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhbGwgdGFibGVzIGluIGN1cnJlbnQgZGF0YWJhc2VcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICBbb3B0aW9ucy5yYXc9dHJ1ZV0gUnVuIHF1ZXJ5IGluIHJhdyBtb2RlXHJcbiAgICogQHBhcmFtIHtRdWVyeVR5cGV9IFtvcHRpb25zLnR5cGU9UXVlcnlUeXBlLlNIT1dUQUJMRV0gcXVlcnkgdHlwZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8QXJyYXk+fVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgc2hvd0FsbFRhYmxlcyhvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xyXG4gICAgICByYXc6IHRydWUsXHJcbiAgICAgIHR5cGU6IFF1ZXJ5VHlwZXMuU0hPV1RBQkxFU1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc2hvd1RhYmxlc1NxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3Iuc2hvd1RhYmxlc1F1ZXJ5KHRoaXMuc2VxdWVsaXplLmNvbmZpZy5kYXRhYmFzZSk7XHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc2hvd1RhYmxlc1NxbCwgb3B0aW9ucykudGhlbih0YWJsZU5hbWVzID0+IF8uZmxhdHRlbih0YWJsZU5hbWVzKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZXNjcmliZSBhIHRhYmxlIHN0cnVjdHVyZVxyXG4gICAqXHJcbiAgICogVGhpcyBtZXRob2QgcmV0dXJucyBhbiBhcnJheSBvZiBoYXNoZXMgY29udGFpbmluZyBpbmZvcm1hdGlvbiBhYm91dCBhbGwgYXR0cmlidXRlcyBpbiB0aGUgdGFibGUuXHJcbiAgICpcclxuICAgKiBgYGBqc1xyXG4gICAqIHtcclxuICAgKiAgICBuYW1lOiB7XHJcbiAgICogICAgICB0eXBlOiAgICAgICAgICdWQVJDSEFSKDI1NSknLCAvLyB0aGlzIHdpbGwgYmUgJ0NIQVJBQ1RFUiBWQVJZSU5HJyBmb3IgcGchXHJcbiAgICogICAgICBhbGxvd051bGw6ICAgIHRydWUsXHJcbiAgICogICAgICBkZWZhdWx0VmFsdWU6IG51bGxcclxuICAgKiAgICB9LFxyXG4gICAqICAgIGlzQmV0YU1lbWJlcjoge1xyXG4gICAqICAgICAgdHlwZTogICAgICAgICAnVElOWUlOVCgxKScsIC8vIHRoaXMgd2lsbCBiZSAnQk9PTEVBTicgZm9yIHBnIVxyXG4gICAqICAgICAgYWxsb3dOdWxsOiAgICBmYWxzZSxcclxuICAgKiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2VcclxuICAgKiAgICB9XHJcbiAgICogfVxyXG4gICAqIGBgYFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlTmFtZSB0YWJsZSBuYW1lXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3Q+fVxyXG4gICAqL1xyXG4gIGRlc2NyaWJlVGFibGUodGFibGVOYW1lLCBvcHRpb25zKSB7XHJcbiAgICBsZXQgc2NoZW1hID0gbnVsbDtcclxuICAgIGxldCBzY2hlbWFEZWxpbWl0ZXIgPSBudWxsO1xyXG5cclxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgc2NoZW1hID0gb3B0aW9ucztcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnICYmIG9wdGlvbnMgIT09IG51bGwpIHtcclxuICAgICAgc2NoZW1hID0gb3B0aW9ucy5zY2hlbWEgfHwgbnVsbDtcclxuICAgICAgc2NoZW1hRGVsaW1pdGVyID0gb3B0aW9ucy5zY2hlbWFEZWxpbWl0ZXIgfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIHRhYmxlTmFtZSA9PT0gJ29iamVjdCcgJiYgdGFibGVOYW1lICE9PSBudWxsKSB7XHJcbiAgICAgIHNjaGVtYSA9IHRhYmxlTmFtZS5zY2hlbWE7XHJcbiAgICAgIHRhYmxlTmFtZSA9IHRhYmxlTmFtZS50YWJsZU5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5kZXNjcmliZVRhYmxlUXVlcnkodGFibGVOYW1lLCBzY2hlbWEsIHNjaGVtYURlbGltaXRlcik7XHJcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyB0eXBlOiBRdWVyeVR5cGVzLkRFU0NSSUJFIH0pO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgIC8qXHJcbiAgICAgICAqIElmIG5vIGRhdGEgaXMgcmV0dXJuZWQgZnJvbSB0aGUgcXVlcnksIHRoZW4gdGhlIHRhYmxlIG5hbWUgbWF5IGJlIHdyb25nLlxyXG4gICAgICAgKiBRdWVyeSBnZW5lcmF0b3JzIHRoYXQgdXNlIGluZm9ybWF0aW9uX3NjaGVtYSBmb3IgcmV0cmlldmluZyB0YWJsZSBpbmZvIHdpbGwganVzdCByZXR1cm4gYW4gZW1wdHkgcmVzdWx0IHNldCxcclxuICAgICAgICogaXQgd2lsbCBub3QgdGhyb3cgYW4gZXJyb3IgbGlrZSBidWlsdC1pbnMgZG8gKGUuZy4gREVTQ1JJQkUgb24gTXlTcWwpLlxyXG4gICAgICAgKi9cclxuICAgICAgaWYgKF8uaXNFbXB0eShkYXRhKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gZGVzY3JpcHRpb24gZm91bmQgZm9yIFwiJHt0YWJsZU5hbWV9XCIgdGFibGUuIENoZWNrIHRoZSB0YWJsZSBuYW1lIGFuZCBzY2hlbWE7IHJlbWVtYmVyLCB0aGV5IF9hcmVfIGNhc2Ugc2Vuc2l0aXZlLmApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZGF0YTtcclxuICAgIH0pLmNhdGNoKGUgPT4ge1xyXG4gICAgICBpZiAoZS5vcmlnaW5hbCAmJiBlLm9yaWdpbmFsLmNvZGUgPT09ICdFUl9OT19TVUNIX1RBQkxFJykge1xyXG4gICAgICAgIHRocm93IEVycm9yKGBObyBkZXNjcmlwdGlvbiBmb3VuZCBmb3IgXCIke3RhYmxlTmFtZX1cIiB0YWJsZS4gQ2hlY2sgdGhlIHRhYmxlIG5hbWUgYW5kIHNjaGVtYTsgcmVtZW1iZXIsIHRoZXkgX2FyZV8gY2FzZSBzZW5zaXRpdmUuYCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRocm93IGU7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBhIG5ldyBjb2x1bW4gdG8gYSB0YWJsZVxyXG4gICAqXHJcbiAgICogYGBganNcclxuICAgKiBxdWVyeUludGVyZmFjZS5hZGRDb2x1bW4oJ3RhYmxlQScsICdjb2x1bW5DJywgU2VxdWVsaXplLlNUUklORywge1xyXG4gICAqICAgIGFmdGVyOiAnY29sdW1uQicgLy8gYWZ0ZXIgb3B0aW9uIGlzIG9ubHkgc3VwcG9ydGVkIGJ5IE15U1FMXHJcbiAgICogfSk7XHJcbiAgICogYGBgXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGUgICAgIFRhYmxlIHRvIGFkZCBjb2x1bW4gdG9cclxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5ICAgICAgIENvbHVtbiBuYW1lXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZSBBdHRyaWJ1dGUgZGVmaW5pdGlvblxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgYWRkQ29sdW1uKHRhYmxlLCBrZXksIGF0dHJpYnV0ZSwgb3B0aW9ucykge1xyXG4gICAgaWYgKCF0YWJsZSB8fCAha2V5IHx8ICFhdHRyaWJ1dGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdhZGRDb2x1bW4gdGFrZXMgYXQgbGVhc3QgMyBhcmd1bWVudHMgKHRhYmxlLCBhdHRyaWJ1dGUgbmFtZSwgYXR0cmlidXRlIGRlZmluaXRpb24pJyk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBhdHRyaWJ1dGUgPSB0aGlzLnNlcXVlbGl6ZS5ub3JtYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeSh0aGlzLlF1ZXJ5R2VuZXJhdG9yLmFkZENvbHVtblF1ZXJ5KHRhYmxlLCBrZXksIGF0dHJpYnV0ZSksIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGEgY29sdW1uIGZyb20gYSB0YWJsZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlTmFtZSAgICAgIFRhYmxlIHRvIHJlbW92ZSBjb2x1bW4gZnJvbVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyaWJ1dGVOYW1lICBDb2x1bW4gbmFtZSB0byByZW1vdmVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdICAgICAgUXVlcnkgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgcmVtb3ZlQ29sdW1uKHRhYmxlTmFtZSwgYXR0cmlidXRlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBzd2l0Y2ggKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCkge1xyXG4gICAgICBjYXNlICdzcWxpdGUnOlxyXG4gICAgICAgIC8vIHNxbGl0ZSBuZWVkcyBzb21lIHNwZWNpYWwgdHJlYXRtZW50IGFzIGl0IGNhbm5vdCBkcm9wIGEgY29sdW1uXHJcbiAgICAgICAgcmV0dXJuIFNRTGl0ZVF1ZXJ5SW50ZXJmYWNlLnJlbW92ZUNvbHVtbih0aGlzLCB0YWJsZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIG9wdGlvbnMpO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeSh0aGlzLlF1ZXJ5R2VuZXJhdG9yLnJlbW92ZUNvbHVtblF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlTmFtZSksIG9wdGlvbnMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hhbmdlIGEgY29sdW1uIGRlZmluaXRpb25cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgICAgICAgVGFibGUgbmFtZSB0byBjaGFuZ2UgZnJvbVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyaWJ1dGVOYW1lICAgICAgQ29sdW1uIG5hbWVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVR5cGVPck9wdGlvbnMgIEF0dHJpYnV0ZSBkZWZpbml0aW9uIGZvciBuZXcgY29sdW1uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAgICAgICAgICBRdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBjaGFuZ2VDb2x1bW4odGFibGVOYW1lLCBhdHRyaWJ1dGVOYW1lLCBkYXRhVHlwZU9yT3B0aW9ucywgb3B0aW9ucykge1xyXG4gICAgY29uc3QgYXR0cmlidXRlcyA9IHt9O1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgaWYgKF8udmFsdWVzKERhdGFUeXBlcykuaW5jbHVkZXMoZGF0YVR5cGVPck9wdGlvbnMpKSB7XHJcbiAgICAgIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSB7IHR5cGU6IGRhdGFUeXBlT3JPcHRpb25zLCBhbGxvd051bGw6IHRydWUgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSBkYXRhVHlwZU9yT3B0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdID0gdGhpcy5zZXF1ZWxpemUubm9ybWFsaXplQXR0cmlidXRlKGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0pO1xyXG5cclxuICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QgPT09ICdzcWxpdGUnKSB7XHJcbiAgICAgIC8vIHNxbGl0ZSBuZWVkcyBzb21lIHNwZWNpYWwgdHJlYXRtZW50IGFzIGl0IGNhbm5vdCBjaGFuZ2UgYSBjb2x1bW5cclxuICAgICAgcmV0dXJuIFNRTGl0ZVF1ZXJ5SW50ZXJmYWNlLmNoYW5nZUNvbHVtbih0aGlzLCB0YWJsZU5hbWUsIGF0dHJpYnV0ZXMsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcXVlcnkgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmF0dHJpYnV0ZXNUb1NRTChhdHRyaWJ1dGVzLCB7XHJcbiAgICAgIGNvbnRleHQ6ICdjaGFuZ2VDb2x1bW4nLFxyXG4gICAgICB0YWJsZTogdGFibGVOYW1lXHJcbiAgICB9KTtcclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuY2hhbmdlQ29sdW1uUXVlcnkodGFibGVOYW1lLCBxdWVyeSk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW5hbWUgYSBjb2x1bW5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgICAgIFRhYmxlIG5hbWUgd2hvc2UgY29sdW1uIHRvIHJlbmFtZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyTmFtZUJlZm9yZSAgIEN1cnJlbnQgY29sdW1uIG5hbWVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXR0ck5hbWVBZnRlciAgICBOZXcgY29sdW1uIG5hbWVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdICAgICAgICBRdWVyeSBvcHRpb25cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIHJlbmFtZUNvbHVtbih0YWJsZU5hbWUsIGF0dHJOYW1lQmVmb3JlLCBhdHRyTmFtZUFmdGVyLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHJldHVybiB0aGlzLmRlc2NyaWJlVGFibGUodGFibGVOYW1lLCBvcHRpb25zKS50aGVuKGRhdGEgPT4ge1xyXG4gICAgICBpZiAoIWRhdGFbYXR0ck5hbWVCZWZvcmVdKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUYWJsZSAke3RhYmxlTmFtZX0gZG9lc24ndCBoYXZlIHRoZSBjb2x1bW4gJHthdHRyTmFtZUJlZm9yZX1gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZGF0YSA9IGRhdGFbYXR0ck5hbWVCZWZvcmVdIHx8IHt9O1xyXG5cclxuICAgICAgY29uc3QgX29wdGlvbnMgPSB7fTtcclxuXHJcbiAgICAgIF9vcHRpb25zW2F0dHJOYW1lQWZ0ZXJdID0ge1xyXG4gICAgICAgIGF0dHJpYnV0ZTogYXR0ck5hbWVBZnRlcixcclxuICAgICAgICB0eXBlOiBkYXRhLnR5cGUsXHJcbiAgICAgICAgYWxsb3dOdWxsOiBkYXRhLmFsbG93TnVsbCxcclxuICAgICAgICBkZWZhdWx0VmFsdWU6IGRhdGEuZGVmYXVsdFZhbHVlXHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBmaXg6IGEgbm90LW51bGwgY29sdW1uIGNhbm5vdCBoYXZlIG51bGwgYXMgZGVmYXVsdCB2YWx1ZVxyXG4gICAgICBpZiAoZGF0YS5kZWZhdWx0VmFsdWUgPT09IG51bGwgJiYgIWRhdGEuYWxsb3dOdWxsKSB7XHJcbiAgICAgICAgZGVsZXRlIF9vcHRpb25zW2F0dHJOYW1lQWZ0ZXJdLmRlZmF1bHRWYWx1ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCA9PT0gJ3NxbGl0ZScpIHtcclxuICAgICAgICAvLyBzcWxpdGUgbmVlZHMgc29tZSBzcGVjaWFsIHRyZWF0bWVudCBhcyBpdCBjYW5ub3QgcmVuYW1lIGEgY29sdW1uXHJcbiAgICAgICAgcmV0dXJuIFNRTGl0ZVF1ZXJ5SW50ZXJmYWNlLnJlbmFtZUNvbHVtbih0aGlzLCB0YWJsZU5hbWUsIGF0dHJOYW1lQmVmb3JlLCBhdHRyTmFtZUFmdGVyLCBvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnJlbmFtZUNvbHVtblF1ZXJ5KFxyXG4gICAgICAgIHRhYmxlTmFtZSxcclxuICAgICAgICBhdHRyTmFtZUJlZm9yZSxcclxuICAgICAgICB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmF0dHJpYnV0ZXNUb1NRTChfb3B0aW9ucylcclxuICAgICAgKTtcclxuICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBhbiBpbmRleCB0byBhIGNvbHVtblxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSAgdGFibGVOYW1lIFRhYmxlIG5hbWUgdG8gYWRkIGluZGV4IG9uLCBjYW4gYmUgYSBvYmplY3Qgd2l0aCBzY2hlbWFcclxuICAgKiBAcGFyYW0ge0FycmF5fSAgIFthdHRyaWJ1dGVzXSAgICAgVXNlIG9wdGlvbnMuZmllbGRzIGluc3RlYWQsIExpc3Qgb2YgYXR0cmlidXRlcyB0byBhZGQgaW5kZXggb25cclxuICAgKiBAcGFyYW0ge09iamVjdH0gIG9wdGlvbnMgICAgICAgICAgaW5kZXhlcyBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtBcnJheX0gICBvcHRpb25zLmZpZWxkcyAgIExpc3Qgb2YgYXR0cmlidXRlcyB0byBhZGQgaW5kZXggb25cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNvbmN1cnJlbnRseV0gUGFzcyBDT05DVVJSRU5UIHNvIG90aGVyIG9wZXJhdGlvbnMgcnVuIHdoaWxlIHRoZSBpbmRleCBpcyBjcmVhdGVkXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51bmlxdWVdIENyZWF0ZSBhIHVuaXF1ZSBpbmRleFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgW29wdGlvbnMudXNpbmddICBVc2VmdWwgZm9yIEdJTiBpbmRleGVzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBbb3B0aW9ucy5vcGVyYXRvcl0gSW5kZXggb3BlcmF0b3JcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gIFtvcHRpb25zLnR5cGVdICAgVHlwZSBvZiBpbmRleCwgYXZhaWxhYmxlIG9wdGlvbnMgYXJlIFVOSVFVRXxGVUxMVEVYVHxTUEFUSUFMXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBbb3B0aW9ucy5uYW1lXSAgIE5hbWUgb2YgdGhlIGluZGV4LiBEZWZhdWx0IGlzIDx0YWJsZT5fPGF0dHIxPl88YXR0cjI+XHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICBbb3B0aW9ucy53aGVyZV0gIFdoZXJlIGNvbmRpdGlvbiBvbiBpbmRleCwgZm9yIHBhcnRpYWwgaW5kZXhlc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgW3Jhd1RhYmxlbmFtZV0gICB0YWJsZSBuYW1lLCB0aGlzIGlzIGp1c3QgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWl0eVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgYWRkSW5kZXgodGFibGVOYW1lLCBhdHRyaWJ1dGVzLCBvcHRpb25zLCByYXdUYWJsZW5hbWUpIHtcclxuICAgIC8vIFN1cHBvcnQgZm9yIHBhc3NpbmcgdGFibGVOYW1lLCBhdHRyaWJ1dGVzLCBvcHRpb25zIG9yIHRhYmxlTmFtZSwgb3B0aW9ucyAod2l0aCBhIGZpZWxkcyBwYXJhbSB3aGljaCBpcyB0aGUgYXR0cmlidXRlcylcclxuICAgIGlmICghQXJyYXkuaXNBcnJheShhdHRyaWJ1dGVzKSkge1xyXG4gICAgICByYXdUYWJsZW5hbWUgPSBvcHRpb25zO1xyXG4gICAgICBvcHRpb25zID0gYXR0cmlidXRlcztcclxuICAgICAgYXR0cmlidXRlcyA9IG9wdGlvbnMuZmllbGRzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcmF3VGFibGVuYW1lKSB7XHJcbiAgICAgIC8vIE1hcCBmb3IgYmFja3dhcmRzIGNvbXBhdFxyXG4gICAgICByYXdUYWJsZW5hbWUgPSB0YWJsZU5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcclxuICAgIG9wdGlvbnMuZmllbGRzID0gYXR0cmlidXRlcztcclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuYWRkSW5kZXhRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMsIHJhd1RhYmxlbmFtZSk7XHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7IHN1cHBvcnRzU2VhcmNoUGF0aDogZmFsc2UgfSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2hvdyBpbmRleGVzIG9uIGEgdGFibGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgdGFibGUgbmFtZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gICBRdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBcnJheT59XHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBzaG93SW5kZXgodGFibGVOYW1lLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnNob3dJbmRleGVzUXVlcnkodGFibGVOYW1lLCBvcHRpb25zKTtcclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgdHlwZTogUXVlcnlUeXBlcy5TSE9XSU5ERVhFUyB9KSk7XHJcbiAgfVxyXG5cclxuICBnZXRGb3JlaWduS2V5c0ZvclRhYmxlcyh0YWJsZU5hbWVzLCBvcHRpb25zKSB7XHJcbiAgICBpZiAodGFibGVOYW1lcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMgfHwge30sIHsgdHlwZTogUXVlcnlUeXBlcy5GT1JFSUdOS0VZUyB9KTtcclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5tYXAodGFibGVOYW1lcywgdGFibGVOYW1lID0+XHJcbiAgICAgIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHRoaXMuUXVlcnlHZW5lcmF0b3IuZ2V0Rm9yZWlnbktleXNRdWVyeSh0YWJsZU5hbWUsIHRoaXMuc2VxdWVsaXplLmNvbmZpZy5kYXRhYmFzZSksIG9wdGlvbnMpXHJcbiAgICApLnRoZW4ocmVzdWx0cyA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xyXG5cclxuICAgICAgdGFibGVOYW1lcy5mb3JFYWNoKCh0YWJsZU5hbWUsIGkpID0+IHtcclxuICAgICAgICBpZiAoXy5pc09iamVjdCh0YWJsZU5hbWUpKSB7XHJcbiAgICAgICAgICB0YWJsZU5hbWUgPSBgJHt0YWJsZU5hbWUuc2NoZW1hfS4ke3RhYmxlTmFtZS50YWJsZU5hbWV9YDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc3VsdFt0YWJsZU5hbWVdID0gQXJyYXkuaXNBcnJheShyZXN1bHRzW2ldKVxyXG4gICAgICAgICAgPyByZXN1bHRzW2ldLm1hcChyID0+IHIuY29uc3RyYWludF9uYW1lKVxyXG4gICAgICAgICAgOiBbcmVzdWx0c1tpXSAmJiByZXN1bHRzW2ldLmNvbnN0cmFpbnRfbmFtZV07XHJcblxyXG4gICAgICAgIHJlc3VsdFt0YWJsZU5hbWVdID0gcmVzdWx0W3RhYmxlTmFtZV0uZmlsdGVyKF8uaWRlbnRpdHkpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBmb3JlaWduIGtleSByZWZlcmVuY2VzIGRldGFpbHMgZm9yIHRoZSB0YWJsZVxyXG4gICAqXHJcbiAgICogVGhvc2UgZGV0YWlscyBjb250YWlucyBjb25zdHJhaW50U2NoZW1hLCBjb25zdHJhaW50TmFtZSwgY29uc3RyYWludENhdGFsb2dcclxuICAgKiB0YWJsZUNhdGFsb2csIHRhYmxlU2NoZW1hLCB0YWJsZU5hbWUsIGNvbHVtbk5hbWUsXHJcbiAgICogcmVmZXJlbmNlZFRhYmxlQ2F0YWxvZywgcmVmZXJlbmNlZFRhYmxlQ2F0YWxvZywgcmVmZXJlbmNlZFRhYmxlU2NoZW1hLCByZWZlcmVuY2VkVGFibGVOYW1lLCByZWZlcmVuY2VkQ29sdW1uTmFtZS5cclxuICAgKiBSZW1pbmQ6IGNvbnN0cmFpbnQgaW5mb3JtYXRpb25zIHdvbid0IHJldHVybiBpZiBpdCdzIHNxbGl0ZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgdGFibGUgbmFtZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gIFF1ZXJ5IG9wdGlvbnNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGdldEZvcmVpZ25LZXlSZWZlcmVuY2VzRm9yVGFibGUodGFibGVOYW1lLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCBxdWVyeU9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XHJcbiAgICAgIHR5cGU6IFF1ZXJ5VHlwZXMuRk9SRUlHTktFWVNcclxuICAgIH0pO1xyXG4gICAgY29uc3QgY2F0YWxvZ05hbWUgPSB0aGlzLnNlcXVlbGl6ZS5jb25maWcuZGF0YWJhc2U7XHJcbiAgICBzd2l0Y2ggKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCkge1xyXG4gICAgICBjYXNlICdzcWxpdGUnOlxyXG4gICAgICAgIC8vIHNxbGl0ZSBuZWVkcyBzb21lIHNwZWNpYWwgdHJlYXRtZW50LlxyXG4gICAgICAgIHJldHVybiBTUUxpdGVRdWVyeUludGVyZmFjZS5nZXRGb3JlaWduS2V5UmVmZXJlbmNlc0ZvclRhYmxlKHRoaXMsIHRhYmxlTmFtZSwgcXVlcnlPcHRpb25zKTtcclxuICAgICAgZGVmYXVsdDoge1xyXG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5RdWVyeUdlbmVyYXRvci5nZXRGb3JlaWduS2V5c1F1ZXJ5KHRhYmxlTmFtZSwgY2F0YWxvZ05hbWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShxdWVyeSwgcXVlcnlPcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGFuIGFscmVhZHkgZXhpc3RpbmcgaW5kZXggZnJvbSBhIHRhYmxlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lICAgICAgICAgICAgIFRhYmxlIG5hbWUgdG8gZHJvcCBpbmRleCBmcm9tXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGluZGV4TmFtZU9yQXR0cmlidXRlcyBJbmRleCBuYW1lXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAgICAgICAgICAgICBRdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICByZW1vdmVJbmRleCh0YWJsZU5hbWUsIGluZGV4TmFtZU9yQXR0cmlidXRlcywgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnJlbW92ZUluZGV4UXVlcnkodGFibGVOYW1lLCBpbmRleE5hbWVPckF0dHJpYnV0ZXMpO1xyXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYSBjb25zdHJhaW50IHRvIGEgdGFibGVcclxuICAgKlxyXG4gICAqIEF2YWlsYWJsZSBjb25zdHJhaW50czpcclxuICAgKiAtIFVOSVFVRVxyXG4gICAqIC0gREVGQVVMVCAoTVNTUUwgb25seSlcclxuICAgKiAtIENIRUNLIChNeVNRTCAtIElnbm9yZWQgYnkgdGhlIGRhdGFiYXNlIGVuZ2luZSApXHJcbiAgICogLSBGT1JFSUdOIEtFWVxyXG4gICAqIC0gUFJJTUFSWSBLRVlcclxuICAgKlxyXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPlVOSVFVRTwvY2FwdGlvbj5cclxuICAgKiBxdWVyeUludGVyZmFjZS5hZGRDb25zdHJhaW50KCdVc2VycycsIFsnZW1haWwnXSwge1xyXG4gICAqICAgdHlwZTogJ3VuaXF1ZScsXHJcbiAgICogICBuYW1lOiAnY3VzdG9tX3VuaXF1ZV9jb25zdHJhaW50X25hbWUnXHJcbiAgICogfSk7XHJcbiAgICpcclxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5DSEVDSzwvY2FwdGlvbj5cclxuICAgKiBxdWVyeUludGVyZmFjZS5hZGRDb25zdHJhaW50KCdVc2VycycsIFsncm9sZXMnXSwge1xyXG4gICAqICAgdHlwZTogJ2NoZWNrJyxcclxuICAgKiAgIHdoZXJlOiB7XHJcbiAgICogICAgICByb2xlczogWyd1c2VyJywgJ2FkbWluJywgJ21vZGVyYXRvcicsICdndWVzdCddXHJcbiAgICogICB9XHJcbiAgICogfSk7XHJcbiAgICpcclxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5EZWZhdWx0IC0gTVNTUUwgb25seTwvY2FwdGlvbj5cclxuICAgKiBxdWVyeUludGVyZmFjZS5hZGRDb25zdHJhaW50KCdVc2VycycsIFsncm9sZXMnXSwge1xyXG4gICAqICAgIHR5cGU6ICdkZWZhdWx0JyxcclxuICAgKiAgICBkZWZhdWx0VmFsdWU6ICdndWVzdCdcclxuICAgKiB9KTtcclxuICAgKlxyXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPlByaW1hcnkgS2V5PC9jYXB0aW9uPlxyXG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmFkZENvbnN0cmFpbnQoJ1VzZXJzJywgWyd1c2VybmFtZSddLCB7XHJcbiAgICogICAgdHlwZTogJ3ByaW1hcnkga2V5JyxcclxuICAgKiAgICBuYW1lOiAnY3VzdG9tX3ByaW1hcnlfY29uc3RyYWludF9uYW1lJ1xyXG4gICAqIH0pO1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+Rm9yZWlnbiBLZXk8L2NhcHRpb24+XHJcbiAgICogcXVlcnlJbnRlcmZhY2UuYWRkQ29uc3RyYWludCgnUG9zdHMnLCBbJ3VzZXJuYW1lJ10sIHtcclxuICAgKiAgIHR5cGU6ICdmb3JlaWduIGtleScsXHJcbiAgICogICBuYW1lOiAnY3VzdG9tX2ZrZXlfY29uc3RyYWludF9uYW1lJyxcclxuICAgKiAgIHJlZmVyZW5jZXM6IHsgLy9SZXF1aXJlZCBmaWVsZFxyXG4gICAqICAgICB0YWJsZTogJ3RhcmdldF90YWJsZV9uYW1lJyxcclxuICAgKiAgICAgZmllbGQ6ICd0YXJnZXRfY29sdW1uX25hbWUnXHJcbiAgICogICB9LFxyXG4gICAqICAgb25EZWxldGU6ICdjYXNjYWRlJyxcclxuICAgKiAgIG9uVXBkYXRlOiAnY2FzY2FkZSdcclxuICAgKiB9KTtcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgICAgICAgICAgICAgICBUYWJsZSBuYW1lIHdoZXJlIHlvdSB3YW50IHRvIGFkZCBhIGNvbnN0cmFpbnRcclxuICAgKiBAcGFyYW0ge0FycmF5fSAgYXR0cmlidXRlcyAgICAgICAgICAgICAgICAgQXJyYXkgb2YgY29sdW1uIG5hbWVzIHRvIGFwcGx5IHRoZSBjb25zdHJhaW50IG92ZXJcclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAgICAgICAgICAgICAgICAgICAgQW4gb2JqZWN0IHRvIGRlZmluZSB0aGUgY29uc3RyYWludCBuYW1lLCB0eXBlIGV0Y1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnR5cGUgICAgICAgICAgICAgICBUeXBlIG9mIGNvbnN0cmFpbnQuIE9uZSBvZiB0aGUgdmFsdWVzIGluIGF2YWlsYWJsZSBjb25zdHJhaW50cyhjYXNlIGluc2Vuc2l0aXZlKVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5uYW1lXSAgICAgICAgICAgICBOYW1lIG9mIHRoZSBjb25zdHJhaW50LiBJZiBub3Qgc3BlY2lmaWVkLCBzZXF1ZWxpemUgYXV0b21hdGljYWxseSBjcmVhdGVzIGEgbmFtZWQgY29uc3RyYWludCBiYXNlZCBvbiBjb25zdHJhaW50IHR5cGUsIHRhYmxlICYgY29sdW1uIG5hbWVzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRlZmF1bHRWYWx1ZV0gICAgIFRoZSB2YWx1ZSBmb3IgdGhlIGRlZmF1bHQgY29uc3RyYWludFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy53aGVyZV0gICAgICAgICAgICBXaGVyZSBjbGF1c2UvZXhwcmVzc2lvbiBmb3IgdGhlIENIRUNLIGNvbnN0cmFpbnRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMucmVmZXJlbmNlc10gICAgICAgT2JqZWN0IHNwZWNpZnlpbmcgdGFyZ2V0IHRhYmxlLCBjb2x1bW4gbmFtZSB0byBjcmVhdGUgZm9yZWlnbiBrZXkgY29uc3RyYWludFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5yZWZlcmVuY2VzLnRhYmxlXSBUYXJnZXQgdGFibGUgbmFtZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5yZWZlcmVuY2VzLmZpZWxkXSBUYXJnZXQgY29sdW1uIG5hbWVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3Jhd1RhYmxlbmFtZV0gICAgICAgICAgICAgVGFibGUgbmFtZSwgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGFkZENvbnN0cmFpbnQodGFibGVOYW1lLCBhdHRyaWJ1dGVzLCBvcHRpb25zLCByYXdUYWJsZW5hbWUpIHtcclxuICAgIGlmICghQXJyYXkuaXNBcnJheShhdHRyaWJ1dGVzKSkge1xyXG4gICAgICByYXdUYWJsZW5hbWUgPSBvcHRpb25zO1xyXG4gICAgICBvcHRpb25zID0gYXR0cmlidXRlcztcclxuICAgICAgYXR0cmlidXRlcyA9IG9wdGlvbnMuZmllbGRzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghb3B0aW9ucy50eXBlKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ29uc3RyYWludCB0eXBlIG11c3QgYmUgc3BlY2lmaWVkIHRocm91Z2ggb3B0aW9ucy50eXBlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFyYXdUYWJsZW5hbWUpIHtcclxuICAgICAgLy8gTWFwIGZvciBiYWNrd2FyZHMgY29tcGF0XHJcbiAgICAgIHJhd1RhYmxlbmFtZSA9IHRhYmxlTmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xyXG4gICAgb3B0aW9ucy5maWVsZHMgPSBhdHRyaWJ1dGVzO1xyXG5cclxuICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5kaWFsZWN0Lm5hbWUgPT09ICdzcWxpdGUnKSB7XHJcbiAgICAgIHJldHVybiBTUUxpdGVRdWVyeUludGVyZmFjZS5hZGRDb25zdHJhaW50KHRoaXMsIHRhYmxlTmFtZSwgb3B0aW9ucywgcmF3VGFibGVuYW1lKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuYWRkQ29uc3RyYWludFF1ZXJ5KHRhYmxlTmFtZSwgb3B0aW9ucywgcmF3VGFibGVuYW1lKTtcclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgc2hvd0NvbnN0cmFpbnQodGFibGVOYW1lLCBjb25zdHJhaW50TmFtZSwgb3B0aW9ucykge1xyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5zaG93Q29uc3RyYWludHNRdWVyeSh0YWJsZU5hbWUsIGNvbnN0cmFpbnROYW1lKTtcclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgdHlwZTogUXVlcnlUeXBlcy5TSE9XQ09OU1RSQUlOVFMgfSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGEgY29uc3RyYWludCBmcm9tIGEgdGFibGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgICAgVGFibGUgbmFtZSB0byBkcm9wIGNvbnN0cmFpbnQgZnJvbVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25zdHJhaW50TmFtZSAgQ29uc3RyYWludCBuYW1lXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgICAgICAgICBRdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICByZW1vdmVDb25zdHJhaW50KHRhYmxlTmFtZSwgY29uc3RyYWludE5hbWUsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIHN3aXRjaCAodGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KSB7XHJcbiAgICAgIGNhc2UgJ3NxbGl0ZSc6XHJcbiAgICAgICAgcmV0dXJuIFNRTGl0ZVF1ZXJ5SW50ZXJmYWNlLnJlbW92ZUNvbnN0cmFpbnQodGhpcywgdGFibGVOYW1lLCBjb25zdHJhaW50TmFtZSwgb3B0aW9ucyk7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5yZW1vdmVDb25zdHJhaW50UXVlcnkodGFibGVOYW1lLCBjb25zdHJhaW50TmFtZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpbnNlcnQoaW5zdGFuY2UsIHRhYmxlTmFtZSwgdmFsdWVzLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xyXG4gICAgb3B0aW9ucy5oYXNUcmlnZ2VyID0gaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3Iub3B0aW9ucy5oYXNUcmlnZ2VyO1xyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5pbnNlcnRRdWVyeSh0YWJsZU5hbWUsIHZhbHVlcywgaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IucmF3QXR0cmlidXRlcywgb3B0aW9ucyk7XHJcblxyXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5JTlNFUlQ7XHJcbiAgICBvcHRpb25zLmluc3RhbmNlID0gaW5zdGFuY2U7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucykudGhlbihyZXN1bHRzID0+IHtcclxuICAgICAgaWYgKGluc3RhbmNlKSByZXN1bHRzWzBdLmlzTmV3UmVjb3JkID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcHNlcnRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgdGFibGUgdG8gdXBzZXJ0IG9uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGluc2VydFZhbHVlcyB2YWx1ZXMgdG8gYmUgaW5zZXJ0ZWQsIG1hcHBlZCB0byBmaWVsZCBuYW1lXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IHVwZGF0ZVZhbHVlcyB2YWx1ZXMgdG8gYmUgdXBkYXRlZCwgbWFwcGVkIHRvIGZpZWxkIG5hbWVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gd2hlcmUgICAgICAgIHZhcmlvdXMgY29uZGl0aW9uc1xyXG4gICAqIEBwYXJhbSB7TW9kZWx9ICBtb2RlbCAgICAgICAgTW9kZWwgdG8gdXBzZXJ0IG9uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgICAgICBxdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuLD9udW1iZXI+fSBSZXNvbHZlcyBhbiBhcnJheSB3aXRoIDxjcmVhdGVkLCBwcmltYXJ5S2V5PlxyXG4gICAqL1xyXG4gIHVwc2VydCh0YWJsZU5hbWUsIGluc2VydFZhbHVlcywgdXBkYXRlVmFsdWVzLCB3aGVyZSwgbW9kZWwsIG9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHdoZXJlcyA9IFtdO1xyXG4gICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5rZXlzKGluc2VydFZhbHVlcyk7XHJcbiAgICBsZXQgaW5kZXhlcyA9IFtdO1xyXG4gICAgbGV0IGluZGV4RmllbGRzO1xyXG5cclxuICAgIG9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpO1xyXG5cclxuICAgIGlmICghVXRpbHMuaXNXaGVyZUVtcHR5KHdoZXJlKSkge1xyXG4gICAgICB3aGVyZXMucHVzaCh3aGVyZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTGV0cyBjb21iaW5lIHVuaXF1ZSBrZXlzIGFuZCBpbmRleGVzIGludG8gb25lXHJcbiAgICBpbmRleGVzID0gXy5tYXAobW9kZWwudW5pcXVlS2V5cywgdmFsdWUgPT4ge1xyXG4gICAgICByZXR1cm4gdmFsdWUuZmllbGRzO1xyXG4gICAgfSk7XHJcblxyXG4gICAgbW9kZWwuX2luZGV4ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XHJcbiAgICAgIGlmICh2YWx1ZS51bmlxdWUpIHtcclxuICAgICAgICAvLyBmaWVsZHMgaW4gdGhlIGluZGV4IG1heSBib3RoIHRoZSBzdHJpbmdzIG9yIG9iamVjdHMgd2l0aCBhbiBhdHRyaWJ1dGUgcHJvcGVydHkgLSBsZXRzIHNhbml0aXplIHRoYXRcclxuICAgICAgICBpbmRleEZpZWxkcyA9IHZhbHVlLmZpZWxkcy5tYXAoZmllbGQgPT4ge1xyXG4gICAgICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdChmaWVsZCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpZWxkLmF0dHJpYnV0ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBmaWVsZDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpbmRleGVzLnB1c2goaW5kZXhGaWVsZHMpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGluZGV4IG9mIGluZGV4ZXMpIHtcclxuICAgICAgaWYgKF8uaW50ZXJzZWN0aW9uKGF0dHJpYnV0ZXMsIGluZGV4KS5sZW5ndGggPT09IGluZGV4Lmxlbmd0aCkge1xyXG4gICAgICAgIHdoZXJlID0ge307XHJcbiAgICAgICAgZm9yIChjb25zdCBmaWVsZCBvZiBpbmRleCkge1xyXG4gICAgICAgICAgd2hlcmVbZmllbGRdID0gaW5zZXJ0VmFsdWVzW2ZpZWxkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hlcmVzLnB1c2god2hlcmUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgd2hlcmUgPSB7IFtPcC5vcl06IHdoZXJlcyB9O1xyXG5cclxuICAgIG9wdGlvbnMudHlwZSA9IFF1ZXJ5VHlwZXMuVVBTRVJUO1xyXG4gICAgb3B0aW9ucy5yYXcgPSB0cnVlO1xyXG5cclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IudXBzZXJ0UXVlcnkodGFibGVOYW1lLCBpbnNlcnRWYWx1ZXMsIHVwZGF0ZVZhbHVlcywgd2hlcmUsIG1vZGVsLCBvcHRpb25zKTtcclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgICAgc3dpdGNoICh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QpIHtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgcmV0dXJuIFtyZXN1bHQsIHVuZGVmaW5lZF07XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5zZXJ0IG11bHRpcGxlIHJlY29yZHMgaW50byBhIHRhYmxlXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmJ1bGtJbnNlcnQoJ3JvbGVzJywgW3tcclxuICAgKiAgICBsYWJlbDogJ3VzZXInLFxyXG4gICAqICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcclxuICAgKiAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKClcclxuICAgKiAgfSwge1xyXG4gICAqICAgIGxhYmVsOiAnYWRtaW4nLFxyXG4gICAqICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcclxuICAgKiAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKClcclxuICAgKiAgfV0pO1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlTmFtZSAgIFRhYmxlIG5hbWUgdG8gaW5zZXJ0IHJlY29yZCB0b1xyXG4gICAqIEBwYXJhbSB7QXJyYXl9ICByZWNvcmRzICAgICBMaXN0IG9mIHJlY29yZHMgdG8gaW5zZXJ0XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgICAgIFZhcmlvdXMgb3B0aW9ucywgcGxlYXNlIHNlZSBNb2RlbC5idWxrQ3JlYXRlIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlcyAgVmFyaW91cyBhdHRyaWJ1dGVzIG1hcHBlZCBieSBmaWVsZCBuYW1lXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBidWxrSW5zZXJ0KHRhYmxlTmFtZSwgcmVjb3Jkcywgb3B0aW9ucywgYXR0cmlidXRlcykge1xyXG4gICAgb3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucykgfHwge307XHJcbiAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLklOU0VSVDtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoXHJcbiAgICAgIHRoaXMuUXVlcnlHZW5lcmF0b3IuYnVsa0luc2VydFF1ZXJ5KHRhYmxlTmFtZSwgcmVjb3Jkcywgb3B0aW9ucywgYXR0cmlidXRlcyksXHJcbiAgICAgIG9wdGlvbnNcclxuICAgICkudGhlbihyZXN1bHRzID0+IHJlc3VsdHNbMF0pO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlKGluc3RhbmNlLCB0YWJsZU5hbWUsIHZhbHVlcywgaWRlbnRpZmllciwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucyB8fCB7fSk7XHJcbiAgICBvcHRpb25zLmhhc1RyaWdnZXIgPSAhIShpbnN0YW5jZSAmJiBpbnN0YW5jZS5fbW9kZWxPcHRpb25zICYmIGluc3RhbmNlLl9tb2RlbE9wdGlvbnMuaGFzVHJpZ2dlcik7XHJcblxyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci51cGRhdGVRdWVyeSh0YWJsZU5hbWUsIHZhbHVlcywgaWRlbnRpZmllciwgb3B0aW9ucywgaW5zdGFuY2UuY29uc3RydWN0b3IucmF3QXR0cmlidXRlcyk7XHJcblxyXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5VUERBVEU7XHJcblxyXG4gICAgb3B0aW9ucy5pbnN0YW5jZSA9IGluc3RhbmNlO1xyXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVcGRhdGUgbXVsdGlwbGUgcmVjb3JkcyBvZiBhIHRhYmxlXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmJ1bGtVcGRhdGUoJ3JvbGVzJywge1xyXG4gICAqICAgICBsYWJlbDogJ2FkbWluJyxcclxuICAgKiAgIH0sIHtcclxuICAgKiAgICAgdXNlclR5cGU6IDMsXHJcbiAgICogICB9LFxyXG4gICAqICk7XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lICAgICBUYWJsZSBuYW1lIHRvIHVwZGF0ZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXMgICAgICAgIFZhbHVlcyB0byBiZSBpbnNlcnRlZCwgbWFwcGVkIHRvIGZpZWxkIG5hbWVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gaWRlbnRpZmllciAgICBBIGhhc2ggd2l0aCBjb25kaXRpb25zIE9SIGFuIElEIGFzIGludGVnZXIgT1IgYSBzdHJpbmcgd2l0aCBjb25kaXRpb25zXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAgICAgVmFyaW91cyBvcHRpb25zLCBwbGVhc2Ugc2VlIE1vZGVsLmJ1bGtDcmVhdGUgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbYXR0cmlidXRlc10gIEF0dHJpYnV0ZXMgb24gcmV0dXJuIG9iamVjdHMgaWYgc3VwcG9ydGVkIGJ5IFNRTCBkaWFsZWN0XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBidWxrVXBkYXRlKHRhYmxlTmFtZSwgdmFsdWVzLCBpZGVudGlmaWVyLCBvcHRpb25zLCBhdHRyaWJ1dGVzKSB7XHJcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xyXG4gICAgaWYgKHR5cGVvZiBpZGVudGlmaWVyID09PSAnb2JqZWN0JykgaWRlbnRpZmllciA9IFV0aWxzLmNsb25lRGVlcChpZGVudGlmaWVyKTtcclxuXHJcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnVwZGF0ZVF1ZXJ5KHRhYmxlTmFtZSwgdmFsdWVzLCBpZGVudGlmaWVyLCBvcHRpb25zLCBhdHRyaWJ1dGVzKTtcclxuICAgIGNvbnN0IHRhYmxlID0gXy5pc09iamVjdCh0YWJsZU5hbWUpID8gdGFibGVOYW1lIDogeyB0YWJsZU5hbWUgfTtcclxuICAgIGNvbnN0IG1vZGVsID0gXy5maW5kKHRoaXMuc2VxdWVsaXplLm1vZGVsTWFuYWdlci5tb2RlbHMsIHsgdGFibGVOYW1lOiB0YWJsZS50YWJsZU5hbWUgfSk7XHJcblxyXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5CVUxLVVBEQVRFO1xyXG4gICAgb3B0aW9ucy5tb2RlbCA9IG1vZGVsO1xyXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBkZWxldGUoaW5zdGFuY2UsIHRhYmxlTmFtZSwgaWRlbnRpZmllciwgb3B0aW9ucykge1xyXG4gICAgY29uc3QgY2FzY2FkZXMgPSBbXTtcclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuZGVsZXRlUXVlcnkodGFibGVOYW1lLCBpZGVudGlmaWVyLCB7fSwgaW5zdGFuY2UuY29uc3RydWN0b3IpO1xyXG5cclxuICAgIG9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpIHx8IHt9O1xyXG5cclxuICAgIC8vIENoZWNrIGZvciBhIHJlc3RyaWN0IGZpZWxkXHJcbiAgICBpZiAoISFpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiAhIWluc3RhbmNlLmNvbnN0cnVjdG9yLmFzc29jaWF0aW9ucykge1xyXG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UuY29uc3RydWN0b3IuYXNzb2NpYXRpb25zKTtcclxuICAgICAgY29uc3QgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XHJcbiAgICAgIGxldCBhc3NvY2lhdGlvbjtcclxuXHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBhc3NvY2lhdGlvbiA9IGluc3RhbmNlLmNvbnN0cnVjdG9yLmFzc29jaWF0aW9uc1trZXlzW2ldXTtcclxuICAgICAgICBpZiAoYXNzb2NpYXRpb24ub3B0aW9ucyAmJiBhc3NvY2lhdGlvbi5vcHRpb25zLm9uRGVsZXRlICYmXHJcbiAgICAgICAgICBhc3NvY2lhdGlvbi5vcHRpb25zLm9uRGVsZXRlLnRvTG93ZXJDYXNlKCkgPT09ICdjYXNjYWRlJyAmJlxyXG4gICAgICAgICAgYXNzb2NpYXRpb24ub3B0aW9ucy51c2VIb29rcyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgY2FzY2FkZXMucHVzaChhc3NvY2lhdGlvbi5hY2Nlc3NvcnMuZ2V0KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5lYWNoKGNhc2NhZGVzLCBjYXNjYWRlID0+IHtcclxuICAgICAgcmV0dXJuIGluc3RhbmNlW2Nhc2NhZGVdKG9wdGlvbnMpLnRoZW4oaW5zdGFuY2VzID0+IHtcclxuICAgICAgICAvLyBDaGVjayBmb3IgaGFzT25lIHJlbGF0aW9uc2hpcCB3aXRoIG5vbi1leGlzdGluZyBhc3NvY2lhdGUgKFwiaGFzIHplcm9cIilcclxuICAgICAgICBpZiAoIWluc3RhbmNlcykge1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGluc3RhbmNlcykpIGluc3RhbmNlcyA9IFtpbnN0YW5jZXNdO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5lYWNoKGluc3RhbmNlcywgaW5zdGFuY2UgPT4gaW5zdGFuY2UuZGVzdHJveShvcHRpb25zKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgIG9wdGlvbnMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcclxuICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlbGV0ZSBtdWx0aXBsZSByZWNvcmRzIGZyb20gYSB0YWJsZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICB0YWJsZU5hbWUgICAgICAgICAgICB0YWJsZSBuYW1lIGZyb20gd2hlcmUgdG8gZGVsZXRlIHJlY29yZHNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gIHdoZXJlICAgICAgICAgICAgICAgIHdoZXJlIGNvbmRpdGlvbnMgdG8gZmluZCByZWNvcmRzIHRvIGRlbGV0ZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgW29wdGlvbnNdICAgICAgICAgICAgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJ1bmNhdGVdICAgVXNlIHRydW5jYXRlIHRhYmxlIGNvbW1hbmQgICBcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhc2NhZGU9ZmFsc2VdICAgICAgICAgT25seSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggVFJVTkNBVEUuIFRydW5jYXRlcyAgYWxsIHRhYmxlcyB0aGF0IGhhdmUgZm9yZWlnbi1rZXkgcmVmZXJlbmNlcyB0byB0aGUgbmFtZWQgdGFibGUsIG9yIHRvIGFueSB0YWJsZXMgYWRkZWQgdG8gdGhlIGdyb3VwIGR1ZSB0byBDQVNDQURFLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmVzdGFydElkZW50aXR5PWZhbHNlXSBPbmx5IHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCBUUlVOQ0FURS4gQXV0b21hdGljYWxseSByZXN0YXJ0IHNlcXVlbmNlcyBvd25lZCBieSBjb2x1bW5zIG9mIHRoZSB0cnVuY2F0ZWQgdGFibGUuXHJcbiAgICogQHBhcmFtIHtNb2RlbH0gICBbbW9kZWxdICAgICAgICAgICAgICBNb2RlbFxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgYnVsa0RlbGV0ZSh0YWJsZU5hbWUsIHdoZXJlLCBvcHRpb25zLCBtb2RlbCkge1xyXG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcclxuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKG9wdGlvbnMsIHsgbGltaXQ6IG51bGwgfSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMudHJ1bmNhdGUgPT09IHRydWUpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KFxyXG4gICAgICAgIHRoaXMuUXVlcnlHZW5lcmF0b3IudHJ1bmNhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgb3B0aW9ucyksXHJcbiAgICAgICAgb3B0aW9uc1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgaWRlbnRpZmllciA9PT0gJ29iamVjdCcpIHdoZXJlID0gVXRpbHMuY2xvbmVEZWVwKHdoZXJlKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoXHJcbiAgICAgIHRoaXMuUXVlcnlHZW5lcmF0b3IuZGVsZXRlUXVlcnkodGFibGVOYW1lLCB3aGVyZSwgb3B0aW9ucywgbW9kZWwpLFxyXG4gICAgICBvcHRpb25zXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgc2VsZWN0KG1vZGVsLCB0YWJsZU5hbWUsIG9wdGlvbnNBcmcpIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zQXJnLCB7IHR5cGU6IFF1ZXJ5VHlwZXMuU0VMRUNULCBtb2RlbCB9KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoXHJcbiAgICAgIHRoaXMuUXVlcnlHZW5lcmF0b3Iuc2VsZWN0UXVlcnkodGFibGVOYW1lLCBvcHRpb25zLCBtb2RlbCksXHJcbiAgICAgIG9wdGlvbnNcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBpbmNyZW1lbnQobW9kZWwsIHRhYmxlTmFtZSwgdmFsdWVzLCBpZGVudGlmaWVyLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuYXJpdGhtZXRpY1F1ZXJ5KCcrJywgdGFibGVOYW1lLCB2YWx1ZXMsIGlkZW50aWZpZXIsIG9wdGlvbnMsIG9wdGlvbnMuYXR0cmlidXRlcyk7XHJcblxyXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5VUERBVEU7XHJcbiAgICBvcHRpb25zLm1vZGVsID0gbW9kZWw7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBkZWNyZW1lbnQobW9kZWwsIHRhYmxlTmFtZSwgdmFsdWVzLCBpZGVudGlmaWVyLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuYXJpdGhtZXRpY1F1ZXJ5KCctJywgdGFibGVOYW1lLCB2YWx1ZXMsIGlkZW50aWZpZXIsIG9wdGlvbnMsIG9wdGlvbnMuYXR0cmlidXRlcyk7XHJcblxyXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5VUERBVEU7XHJcbiAgICBvcHRpb25zLm1vZGVsID0gbW9kZWw7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICByYXdTZWxlY3QodGFibGVOYW1lLCBvcHRpb25zLCBhdHRyaWJ1dGVTZWxlY3RvciwgTW9kZWwpIHtcclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcbiAgICBvcHRpb25zID0gXy5kZWZhdWx0cyhvcHRpb25zLCB7XHJcbiAgICAgIHJhdzogdHJ1ZSxcclxuICAgICAgcGxhaW46IHRydWUsXHJcbiAgICAgIHR5cGU6IFF1ZXJ5VHlwZXMuU0VMRUNUXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnNlbGVjdFF1ZXJ5KHRhYmxlTmFtZSwgb3B0aW9ucywgTW9kZWwpO1xyXG5cclxuICAgIGlmIChhdHRyaWJ1dGVTZWxlY3RvciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHBhc3MgYW4gYXR0cmlidXRlIHNlbGVjdG9yIScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgIGlmICghb3B0aW9ucy5wbGFpbikge1xyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCByZXN1bHQgPSBkYXRhID8gZGF0YVthdHRyaWJ1dGVTZWxlY3Rvcl0gOiBudWxsO1xyXG5cclxuICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLmRhdGFUeXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgZGF0YVR5cGUgPSBvcHRpb25zLmRhdGFUeXBlO1xyXG5cclxuICAgICAgaWYgKGRhdGFUeXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkRFQ0lNQUwgfHwgZGF0YVR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuRkxPQVQpIHtcclxuICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAoZGF0YVR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuSU5URUdFUiB8fCBkYXRhVHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5CSUdJTlQpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VJbnQocmVzdWx0LCAxMCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGRhdGFUeXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkRBVEUpIHtcclxuICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsICYmICEocmVzdWx0IGluc3RhbmNlb2YgRGF0ZSkpIHtcclxuICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBjcmVhdGVUcmlnZ2VyKHRhYmxlTmFtZSwgdHJpZ2dlck5hbWUsIHRpbWluZ1R5cGUsIGZpcmVPbkFycmF5LCBmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uUGFyYW1zLCBvcHRpb25zQXJyYXksIG9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuY3JlYXRlVHJpZ2dlcih0YWJsZU5hbWUsIHRyaWdnZXJOYW1lLCB0aW1pbmdUeXBlLCBmaXJlT25BcnJheSwgZnVuY3Rpb25OYW1lLCBmdW5jdGlvblBhcmFtcywgb3B0aW9uc0FycmF5KTtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgaWYgKHNxbCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGRyb3BUcmlnZ2VyKHRhYmxlTmFtZSwgdHJpZ2dlck5hbWUsIG9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuZHJvcFRyaWdnZXIodGFibGVOYW1lLCB0cmlnZ2VyTmFtZSk7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICBpZiAoc3FsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgcmVuYW1lVHJpZ2dlcih0YWJsZU5hbWUsIG9sZFRyaWdnZXJOYW1lLCBuZXdUcmlnZ2VyTmFtZSwgb3B0aW9ucykge1xyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5yZW5hbWVUcmlnZ2VyKHRhYmxlTmFtZSwgb2xkVHJpZ2dlck5hbWUsIG5ld1RyaWdnZXJOYW1lKTtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIGlmIChzcWwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYW4gU1FMIGZ1bmN0aW9uXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmNyZWF0ZUZ1bmN0aW9uKFxyXG4gICAqICAgJ3NvbWVGdW5jdGlvbicsXHJcbiAgICogICBbXHJcbiAgICogICAgIHt0eXBlOiAnaW50ZWdlcicsIG5hbWU6ICdwYXJhbScsIGRpcmVjdGlvbjogJ0lOJ31cclxuICAgKiAgIF0sXHJcbiAgICogICAnaW50ZWdlcicsXHJcbiAgICogICAncGxwZ3NxbCcsXHJcbiAgICogICAnUkVUVVJOIHBhcmFtICsgMTsnLFxyXG4gICAqICAgW1xyXG4gICAqICAgICAnSU1NVVRBQkxFJyxcclxuICAgKiAgICAgJ0xFQUtQUk9PRidcclxuICAgKiAgIF0sXHJcbiAgICogICB7XHJcbiAgICogICAgdmFyaWFibGVzOlxyXG4gICAqICAgICAgW1xyXG4gICAqICAgICAgICB7dHlwZTogJ2ludGVnZXInLCBuYW1lOiAnbXlWYXInLCBkZWZhdWx0OiAxMDB9XHJcbiAgICogICAgICBdLFxyXG4gICAqICAgICAgZm9yY2U6IHRydWVcclxuICAgKiAgIH07XHJcbiAgICogKTtcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgZnVuY3Rpb25OYW1lICBOYW1lIG9mIFNRTCBmdW5jdGlvbiB0byBjcmVhdGVcclxuICAgKiBAcGFyYW0ge0FycmF5fSAgIHBhcmFtcyAgICAgICAgTGlzdCBvZiBwYXJhbWV0ZXJzIGRlY2xhcmVkIGZvciBTUUwgZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gIHJldHVyblR5cGUgICAgU1FMIHR5cGUgb2YgZnVuY3Rpb24gcmV0dXJuZWQgdmFsdWVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gIGxhbmd1YWdlICAgICAgVGhlIG5hbWUgb2YgdGhlIGxhbmd1YWdlIHRoYXQgdGhlIGZ1bmN0aW9uIGlzIGltcGxlbWVudGVkIGluXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBib2R5ICAgICAgICAgIFNvdXJjZSBjb2RlIG9mIGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtBcnJheX0gICBvcHRpb25zQXJyYXkgIEV4dHJhLW9wdGlvbnMgZm9yIGNyZWF0aW9uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICBbb3B0aW9uc10gICAgIHF1ZXJ5IG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuZm9yY2UgSWYgZm9yY2UgaXMgdHJ1ZSwgYW55IGV4aXN0aW5nIGZ1bmN0aW9ucyB3aXRoIHRoZSBzYW1lIHBhcmFtZXRlcnMgd2lsbCBiZSByZXBsYWNlZC4gRm9yIHBvc3RncmVzLCB0aGlzIG1lYW5zIHVzaW5nIGBDUkVBVEUgT1IgUkVQTEFDRSBGVU5DVElPTmAgaW5zdGVhZCBvZiBgQ1JFQVRFIEZVTkNUSU9OYC4gRGVmYXVsdCBpcyBmYWxzZVxyXG4gICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gICBvcHRpb25zLnZhcmlhYmxlcyBMaXN0IG9mIGRlY2xhcmVkIHZhcmlhYmxlcy4gRWFjaCB2YXJpYWJsZSBzaG91bGQgYmUgYW4gb2JqZWN0IHdpdGggc3RyaW5nIGZpZWxkcyBgdHlwZWAgYW5kIGBuYW1lYCwgYW5kIG9wdGlvbmFsbHkgaGF2aW5nIGEgYGRlZmF1bHRgIGZpZWxkIGFzIHdlbGwuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBjcmVhdGVGdW5jdGlvbihmdW5jdGlvbk5hbWUsIHBhcmFtcywgcmV0dXJuVHlwZSwgbGFuZ3VhZ2UsIGJvZHksIG9wdGlvbnNBcnJheSwgb3B0aW9ucykge1xyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5jcmVhdGVGdW5jdGlvbihmdW5jdGlvbk5hbWUsIHBhcmFtcywgcmV0dXJuVHlwZSwgbGFuZ3VhZ2UsIGJvZHksIG9wdGlvbnNBcnJheSwgb3B0aW9ucyk7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICBpZiAoc3FsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHJvcCBhbiBTUUwgZnVuY3Rpb25cclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogcXVlcnlJbnRlcmZhY2UuZHJvcEZ1bmN0aW9uKFxyXG4gICAqICAgJ3NvbWVGdW5jdGlvbicsXHJcbiAgICogICBbXHJcbiAgICogICAgIHt0eXBlOiAndmFyY2hhcicsIG5hbWU6ICdwYXJhbTEnLCBkaXJlY3Rpb246ICdJTid9LFxyXG4gICAqICAgICB7dHlwZTogJ2ludGVnZXInLCBuYW1lOiAncGFyYW0yJywgZGlyZWN0aW9uOiAnSU5PVVQnfVxyXG4gICAqICAgXVxyXG4gICAqICk7XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZnVuY3Rpb25OYW1lIE5hbWUgb2YgU1FMIGZ1bmN0aW9uIHRvIGRyb3BcclxuICAgKiBAcGFyYW0ge0FycmF5fSAgcGFyYW1zICAgICAgIExpc3Qgb2YgcGFyYW1ldGVycyBkZWNsYXJlZCBmb3IgU1FMIGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAgICBxdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBkcm9wRnVuY3Rpb24oZnVuY3Rpb25OYW1lLCBwYXJhbXMsIG9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuZHJvcEZ1bmN0aW9uKGZ1bmN0aW9uTmFtZSwgcGFyYW1zKTtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIGlmIChzcWwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZW5hbWUgYW4gU1FMIGZ1bmN0aW9uXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIHF1ZXJ5SW50ZXJmYWNlLnJlbmFtZUZ1bmN0aW9uKFxyXG4gICAqICAgJ2Zvb0Z1bmN0aW9uJyxcclxuICAgKiAgIFtcclxuICAgKiAgICAge3R5cGU6ICd2YXJjaGFyJywgbmFtZTogJ3BhcmFtMScsIGRpcmVjdGlvbjogJ0lOJ30sXHJcbiAgICogICAgIHt0eXBlOiAnaW50ZWdlcicsIG5hbWU6ICdwYXJhbTInLCBkaXJlY3Rpb246ICdJTk9VVCd9XHJcbiAgICogICBdLFxyXG4gICAqICAgJ2JhckZ1bmN0aW9uJ1xyXG4gICAqICk7XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2xkRnVuY3Rpb25OYW1lICBDdXJyZW50IG5hbWUgb2YgZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge0FycmF5fSAgcGFyYW1zICAgICAgICAgICBMaXN0IG9mIHBhcmFtZXRlcnMgZGVjbGFyZWQgZm9yIFNRTCBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdGdW5jdGlvbk5hbWUgIE5ldyBuYW1lIG9mIGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAgICAgICAgcXVlcnkgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgcmVuYW1lRnVuY3Rpb24ob2xkRnVuY3Rpb25OYW1lLCBwYXJhbXMsIG5ld0Z1bmN0aW9uTmFtZSwgb3B0aW9ucykge1xyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5yZW5hbWVGdW5jdGlvbihvbGRGdW5jdGlvbk5hbWUsIHBhcmFtcywgbmV3RnVuY3Rpb25OYW1lKTtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIGlmIChzcWwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBIZWxwZXIgbWV0aG9kcyB1c2VmdWwgZm9yIHF1ZXJ5aW5nXHJcblxyXG4gIC8qKlxyXG4gICAqIEVzY2FwZSBhbiBpZGVudGlmaWVyIChlLmcuIGEgdGFibGUgb3IgYXR0cmlidXRlIG5hbWUpXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWRlbnRpZmllciBpZGVudGlmaWVyIHRvIHF1b3RlXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdICAgSWYgZm9yY2UgaXMgdHJ1ZSx0aGUgaWRlbnRpZmllciB3aWxsIGJlIHF1b3RlZCBldmVuIGlmIHRoZSBgcXVvdGVJZGVudGlmaWVyc2Agb3B0aW9uIGlzIGZhbHNlLlxyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBxdW90ZUlkZW50aWZpZXIoaWRlbnRpZmllciwgZm9yY2UpIHtcclxuICAgIHJldHVybiB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnF1b3RlSWRlbnRpZmllcihpZGVudGlmaWVyLCBmb3JjZSk7XHJcbiAgfVxyXG5cclxuICBxdW90ZVRhYmxlKGlkZW50aWZpZXIpIHtcclxuICAgIHJldHVybiB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnF1b3RlVGFibGUoaWRlbnRpZmllcik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBRdW90ZSBhcnJheSBvZiBpZGVudGlmaWVycyBhdCBvbmNlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBpZGVudGlmaWVycyBhcnJheSBvZiBpZGVudGlmaWVycyB0byBxdW90ZVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSAgIElmIGZvcmNlIGlzIHRydWUsdGhlIGlkZW50aWZpZXIgd2lsbCBiZSBxdW90ZWQgZXZlbiBpZiB0aGUgYHF1b3RlSWRlbnRpZmllcnNgIG9wdGlvbiBpcyBmYWxzZS5cclxuICAgKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgcXVvdGVJZGVudGlmaWVycyhpZGVudGlmaWVycywgZm9yY2UpIHtcclxuICAgIHJldHVybiB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnF1b3RlSWRlbnRpZmllcnMoaWRlbnRpZmllcnMsIGZvcmNlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVzY2FwZSBhIHZhbHVlIChlLmcuIGEgc3RyaW5nLCBudW1iZXIgb3IgZGF0ZSlcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBzdHJpbmcgdG8gZXNjYXBlXHJcbiAgICpcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGVzY2FwZSh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuUXVlcnlHZW5lcmF0b3IuZXNjYXBlKHZhbHVlKTtcclxuICB9XHJcblxyXG4gIHNldElzb2xhdGlvbkxldmVsKHRyYW5zYWN0aW9uLCB2YWx1ZSwgb3B0aW9ucykge1xyXG4gICAgaWYgKCF0cmFuc2FjdGlvbiB8fCAhKHRyYW5zYWN0aW9uIGluc3RhbmNlb2YgVHJhbnNhY3Rpb24pKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIHNldCBpc29sYXRpb24gbGV2ZWwgZm9yIGEgdHJhbnNhY3Rpb24gd2l0aG91dCB0cmFuc2FjdGlvbiBvYmplY3QhJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRyYW5zYWN0aW9uLnBhcmVudCB8fCAhdmFsdWUpIHtcclxuICAgICAgLy8gTm90IHBvc3NpYmxlIHRvIHNldCBhIHNlcGFyYXRlIGlzb2xhdGlvbiBsZXZlbCBmb3Igc2F2ZXBvaW50c1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcclxuICAgICAgdHJhbnNhY3Rpb246IHRyYW5zYWN0aW9uLnBhcmVudCB8fCB0cmFuc2FjdGlvblxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5zZXRJc29sYXRpb25MZXZlbFF1ZXJ5KHZhbHVlLCB7XHJcbiAgICAgIHBhcmVudDogdHJhbnNhY3Rpb24ucGFyZW50XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIXNxbCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgc3RhcnRUcmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgb3B0aW9ucykge1xyXG4gICAgaWYgKCF0cmFuc2FjdGlvbiB8fCAhKHRyYW5zYWN0aW9uIGluc3RhbmNlb2YgVHJhbnNhY3Rpb24pKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIHN0YXJ0IGEgdHJhbnNhY3Rpb24gd2l0aG91dCB0cmFuc2FjdGlvbiBvYmplY3QhJyk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcclxuICAgICAgdHJhbnNhY3Rpb246IHRyYW5zYWN0aW9uLnBhcmVudCB8fCB0cmFuc2FjdGlvblxyXG4gICAgfSk7XHJcbiAgICBvcHRpb25zLnRyYW5zYWN0aW9uLm5hbWUgPSB0cmFuc2FjdGlvbi5wYXJlbnQgPyB0cmFuc2FjdGlvbi5uYW1lIDogdW5kZWZpbmVkO1xyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5zdGFydFRyYW5zYWN0aW9uUXVlcnkodHJhbnNhY3Rpb24pO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgZGVmZXJDb25zdHJhaW50cyh0cmFuc2FjdGlvbiwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcclxuICAgICAgdHJhbnNhY3Rpb246IHRyYW5zYWN0aW9uLnBhcmVudCB8fCB0cmFuc2FjdGlvblxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5kZWZlckNvbnN0cmFpbnRzUXVlcnkob3B0aW9ucyk7XHJcblxyXG4gICAgaWYgKHNxbCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb21taXRUcmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgb3B0aW9ucykge1xyXG4gICAgaWYgKCF0cmFuc2FjdGlvbiB8fCAhKHRyYW5zYWN0aW9uIGluc3RhbmNlb2YgVHJhbnNhY3Rpb24pKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNvbW1pdCBhIHRyYW5zYWN0aW9uIHdpdGhvdXQgdHJhbnNhY3Rpb24gb2JqZWN0IScpO1xyXG4gICAgfVxyXG4gICAgaWYgKHRyYW5zYWN0aW9uLnBhcmVudCkge1xyXG4gICAgICAvLyBTYXZlcG9pbnRzIGNhbm5vdCBiZSBjb21taXR0ZWRcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XHJcbiAgICAgIHRyYW5zYWN0aW9uOiB0cmFuc2FjdGlvbi5wYXJlbnQgfHwgdHJhbnNhY3Rpb24sXHJcbiAgICAgIHN1cHBvcnRzU2VhcmNoUGF0aDogZmFsc2UsXHJcbiAgICAgIGNvbXBsZXRlc1RyYW5zYWN0aW9uOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmNvbW1pdFRyYW5zYWN0aW9uUXVlcnkodHJhbnNhY3Rpb24pO1xyXG4gICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XHJcblxyXG4gICAgdHJhbnNhY3Rpb24uZmluaXNoZWQgPSAnY29tbWl0JztcclxuXHJcbiAgICByZXR1cm4gcHJvbWlzZTtcclxuICB9XHJcblxyXG4gIHJvbGxiYWNrVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIG9wdGlvbnMpIHtcclxuICAgIGlmICghdHJhbnNhY3Rpb24gfHwgISh0cmFuc2FjdGlvbiBpbnN0YW5jZW9mIFRyYW5zYWN0aW9uKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byByb2xsYmFjayBhIHRyYW5zYWN0aW9uIHdpdGhvdXQgdHJhbnNhY3Rpb24gb2JqZWN0IScpO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XHJcbiAgICAgIHRyYW5zYWN0aW9uOiB0cmFuc2FjdGlvbi5wYXJlbnQgfHwgdHJhbnNhY3Rpb24sXHJcbiAgICAgIHN1cHBvcnRzU2VhcmNoUGF0aDogZmFsc2UsXHJcbiAgICAgIGNvbXBsZXRlc1RyYW5zYWN0aW9uOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIG9wdGlvbnMudHJhbnNhY3Rpb24ubmFtZSA9IHRyYW5zYWN0aW9uLnBhcmVudCA/IHRyYW5zYWN0aW9uLm5hbWUgOiB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnJvbGxiYWNrVHJhbnNhY3Rpb25RdWVyeSh0cmFuc2FjdGlvbik7XHJcbiAgICBjb25zdCBwcm9taXNlID0gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcclxuXHJcbiAgICB0cmFuc2FjdGlvbi5maW5pc2hlZCA9ICdyb2xsYmFjayc7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5SW50ZXJmYWNlO1xyXG5tb2R1bGUuZXhwb3J0cy5RdWVyeUludGVyZmFjZSA9IFF1ZXJ5SW50ZXJmYWNlO1xyXG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gUXVlcnlJbnRlcmZhY2U7XHJcbiJdfQ==