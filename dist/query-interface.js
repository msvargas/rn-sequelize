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


let QueryInterface = /*#__PURE__*/function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9xdWVyeS1pbnRlcmZhY2UuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJVdGlscyIsIkRhdGFUeXBlcyIsIlNRTGl0ZVF1ZXJ5SW50ZXJmYWNlIiwiVHJhbnNhY3Rpb24iLCJQcm9taXNlIiwiUXVlcnlUeXBlcyIsIk9wIiwiUXVlcnlJbnRlcmZhY2UiLCJzZXF1ZWxpemUiLCJRdWVyeUdlbmVyYXRvciIsImRpYWxlY3QiLCJkYXRhYmFzZSIsIm9wdGlvbnMiLCJzcWwiLCJjcmVhdGVEYXRhYmFzZVF1ZXJ5IiwicXVlcnkiLCJkcm9wRGF0YWJhc2VRdWVyeSIsInNjaGVtYSIsImNyZWF0ZVNjaGVtYSIsImRyb3BTY2hlbWEiLCJfZGlhbGVjdCIsInN1cHBvcnRzIiwic2NoZW1hcyIsImRyb3AiLCJzaG93QWxsU2NoZW1hcyIsIm1hcCIsInNjaGVtYU5hbWUiLCJPYmplY3QiLCJhc3NpZ24iLCJyYXciLCJ0eXBlIiwiU0VMRUNUIiwic2hvd1NjaGVtYXNTcWwiLCJzaG93U2NoZW1hc1F1ZXJ5IiwidGhlbiIsInNjaGVtYU5hbWVzIiwiZmxhdHRlbiIsInZhbHVlIiwic2NoZW1hX25hbWUiLCJ2ZXJzaW9uUXVlcnkiLCJWRVJTSU9OIiwidGFibGVOYW1lIiwiYXR0cmlidXRlcyIsIm1vZGVsIiwicHJvbWlzZSIsImNsb25lIiwidW5pcXVlS2V5cyIsImZvck93biIsInVuaXF1ZUtleSIsImN1c3RvbUluZGV4IiwidW5kZWZpbmVkIiwibWFwVmFsdWVzIiwiYXR0cmlidXRlIiwibm9ybWFsaXplQXR0cmlidXRlIiwiUG9zdGdyZXNRdWVyeUludGVyZmFjZSIsImVuc3VyZUVudW1zIiwicmVzb2x2ZSIsIl9zY2hlbWEiLCJhZGRTY2hlbWEiLCJhdHRyaWJ1dGVzVG9TUUwiLCJ0YWJsZSIsImNvbnRleHQiLCJjcmVhdGVUYWJsZVF1ZXJ5IiwiY2FzY2FkZSIsImZvcmNlIiwiZHJvcFRhYmxlUXVlcnkiLCJwcm9taXNlcyIsImluc3RhbmNlVGFibGUiLCJtb2RlbE1hbmFnZXIiLCJnZXRNb2RlbCIsImdldFRhYmxlTmFtZSIsImtleXMiLCJyYXdBdHRyaWJ1dGVzIiwia2V5TGVuIiwibGVuZ3RoIiwiaSIsIkVOVU0iLCJwZ0VudW1Ecm9wIiwic3VwcG9ydHNTZWFyY2hQYXRoIiwicHVzaCIsImFsbCIsImdldCIsInNraXAiLCJkcm9wQWxsVGFibGVzIiwidGFibGVOYW1lcyIsImVhY2giLCJpbmNsdWRlcyIsImRyb3BUYWJsZSIsInNob3dBbGxUYWJsZXMiLCJyZXN1bHQiLCJmb3JlaWduS2V5c0FyZUVuYWJsZWQiLCJmb3JlaWduX2tleXMiLCJnZXRGb3JlaWduS2V5c0ZvclRhYmxlcyIsImZvcmVpZ25LZXlzIiwicXVlcmllcyIsImZvckVhY2giLCJub3JtYWxpemVkVGFibGVOYW1lIiwiaXNPYmplY3QiLCJmb3JlaWduS2V5IiwiZHJvcEZvcmVpZ25LZXlRdWVyeSIsInEiLCJlbnVtTmFtZSIsImdldERpYWxlY3QiLCJwZ0VzY2FwZUFuZFF1b3RlIiwicGdMaXN0RW51bXMiLCJlbnVtX25hbWUiLCJwbGFpbiIsImJlZm9yZSIsImFmdGVyIiwicmVuYW1lVGFibGVRdWVyeSIsIlNIT1dUQUJMRVMiLCJzaG93VGFibGVzU3FsIiwic2hvd1RhYmxlc1F1ZXJ5IiwiY29uZmlnIiwic2NoZW1hRGVsaW1pdGVyIiwiZGVzY3JpYmVUYWJsZVF1ZXJ5IiwiREVTQ1JJQkUiLCJkYXRhIiwiaXNFbXB0eSIsIkVycm9yIiwiY2F0Y2giLCJlIiwib3JpZ2luYWwiLCJjb2RlIiwia2V5IiwiYWRkQ29sdW1uUXVlcnkiLCJhdHRyaWJ1dGVOYW1lIiwicmVtb3ZlQ29sdW1uIiwicmVtb3ZlQ29sdW1uUXVlcnkiLCJkYXRhVHlwZU9yT3B0aW9ucyIsInZhbHVlcyIsImFsbG93TnVsbCIsImNoYW5nZUNvbHVtbiIsImNoYW5nZUNvbHVtblF1ZXJ5IiwiYXR0ck5hbWVCZWZvcmUiLCJhdHRyTmFtZUFmdGVyIiwiZGVzY3JpYmVUYWJsZSIsIl9vcHRpb25zIiwiZGVmYXVsdFZhbHVlIiwicmVuYW1lQ29sdW1uIiwicmVuYW1lQ29sdW1uUXVlcnkiLCJyYXdUYWJsZW5hbWUiLCJBcnJheSIsImlzQXJyYXkiLCJmaWVsZHMiLCJjbG9uZURlZXAiLCJhZGRJbmRleFF1ZXJ5Iiwic2hvd0luZGV4ZXNRdWVyeSIsIlNIT1dJTkRFWEVTIiwiRk9SRUlHTktFWVMiLCJnZXRGb3JlaWduS2V5c1F1ZXJ5IiwicmVzdWx0cyIsInIiLCJjb25zdHJhaW50X25hbWUiLCJmaWx0ZXIiLCJpZGVudGl0eSIsInF1ZXJ5T3B0aW9ucyIsImNhdGFsb2dOYW1lIiwiZ2V0Rm9yZWlnbktleVJlZmVyZW5jZXNGb3JUYWJsZSIsImluZGV4TmFtZU9yQXR0cmlidXRlcyIsInJlbW92ZUluZGV4UXVlcnkiLCJuYW1lIiwiYWRkQ29uc3RyYWludCIsImFkZENvbnN0cmFpbnRRdWVyeSIsImNvbnN0cmFpbnROYW1lIiwic2hvd0NvbnN0cmFpbnRzUXVlcnkiLCJTSE9XQ09OU1RSQUlOVFMiLCJyZW1vdmVDb25zdHJhaW50IiwicmVtb3ZlQ29uc3RyYWludFF1ZXJ5IiwiaW5zdGFuY2UiLCJoYXNUcmlnZ2VyIiwiY29uc3RydWN0b3IiLCJpbnNlcnRRdWVyeSIsIklOU0VSVCIsImlzTmV3UmVjb3JkIiwiaW5zZXJ0VmFsdWVzIiwidXBkYXRlVmFsdWVzIiwid2hlcmUiLCJ3aGVyZXMiLCJpbmRleGVzIiwiaW5kZXhGaWVsZHMiLCJpc1doZXJlRW1wdHkiLCJfaW5kZXhlcyIsInVuaXF1ZSIsImZpZWxkIiwiaXNQbGFpbk9iamVjdCIsImluZGV4IiwiaW50ZXJzZWN0aW9uIiwib3IiLCJVUFNFUlQiLCJ1cHNlcnRRdWVyeSIsInJlY29yZHMiLCJidWxrSW5zZXJ0UXVlcnkiLCJpZGVudGlmaWVyIiwiX21vZGVsT3B0aW9ucyIsInVwZGF0ZVF1ZXJ5IiwiVVBEQVRFIiwiZmluZCIsIm1vZGVscyIsIkJVTEtVUERBVEUiLCJjYXNjYWRlcyIsImRlbGV0ZVF1ZXJ5IiwiYXNzb2NpYXRpb25zIiwiYXNzb2NpYXRpb24iLCJvbkRlbGV0ZSIsInRvTG93ZXJDYXNlIiwidXNlSG9va3MiLCJhY2Nlc3NvcnMiLCJpbnN0YW5jZXMiLCJkZXN0cm95IiwiZGVmYXVsdHMiLCJsaW1pdCIsInRydW5jYXRlIiwidHJ1bmNhdGVUYWJsZVF1ZXJ5Iiwib3B0aW9uc0FyZyIsInNlbGVjdFF1ZXJ5IiwiYXJpdGhtZXRpY1F1ZXJ5IiwiYXR0cmlidXRlU2VsZWN0b3IiLCJNb2RlbCIsImRhdGFUeXBlIiwiREVDSU1BTCIsIkZMT0FUIiwicGFyc2VGbG9hdCIsIklOVEVHRVIiLCJCSUdJTlQiLCJwYXJzZUludCIsIkRBVEUiLCJEYXRlIiwidHJpZ2dlck5hbWUiLCJ0aW1pbmdUeXBlIiwiZmlyZU9uQXJyYXkiLCJmdW5jdGlvbk5hbWUiLCJmdW5jdGlvblBhcmFtcyIsIm9wdGlvbnNBcnJheSIsImNyZWF0ZVRyaWdnZXIiLCJkcm9wVHJpZ2dlciIsIm9sZFRyaWdnZXJOYW1lIiwibmV3VHJpZ2dlck5hbWUiLCJyZW5hbWVUcmlnZ2VyIiwicGFyYW1zIiwicmV0dXJuVHlwZSIsImxhbmd1YWdlIiwiYm9keSIsImNyZWF0ZUZ1bmN0aW9uIiwiZHJvcEZ1bmN0aW9uIiwib2xkRnVuY3Rpb25OYW1lIiwibmV3RnVuY3Rpb25OYW1lIiwicmVuYW1lRnVuY3Rpb24iLCJxdW90ZUlkZW50aWZpZXIiLCJxdW90ZVRhYmxlIiwiaWRlbnRpZmllcnMiLCJxdW90ZUlkZW50aWZpZXJzIiwiZXNjYXBlIiwidHJhbnNhY3Rpb24iLCJwYXJlbnQiLCJzZXRJc29sYXRpb25MZXZlbFF1ZXJ5Iiwic3RhcnRUcmFuc2FjdGlvblF1ZXJ5IiwiZGVmZXJDb25zdHJhaW50c1F1ZXJ5IiwiY29tcGxldGVzVHJhbnNhY3Rpb24iLCJjb21taXRUcmFuc2FjdGlvblF1ZXJ5IiwiZmluaXNoZWQiLCJyb2xsYmFja1RyYW5zYWN0aW9uUXVlcnkiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBRUEsTUFBTUEs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QUFaLEdBQXVCLFVBQXZCO0FBRUEsYUFBT3hOLE9BQVA7QUFDRDs7Ozs7O0FBR0gwTixNQUFNLENBQUNDLE9BQVAsR0FBaUJoUSxjQUFqQjtBQUNBK1AsTUFBTSxDQUFDQyxPQUFQLENBQWVoUSxjQUFmLEdBQWdDQSxjQUFoQztBQUNBK1AsTUFBTSxDQUFDQyxPQUFQLENBQWVDLE9BQWYsR0FBeUJqUSxjQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmNvbnN0IERhdGFUeXBlcyA9IHJlcXVpcmUoJy4vZGF0YS10eXBlcycpO1xuY29uc3QgU1FMaXRlUXVlcnlJbnRlcmZhY2UgPSByZXF1aXJlKCcuL2RpYWxlY3RzL3NxbGl0ZS9xdWVyeS1pbnRlcmZhY2UnKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gcmVxdWlyZSgnLi90cmFuc2FjdGlvbicpO1xuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpO1xuY29uc3QgUXVlcnlUeXBlcyA9IHJlcXVpcmUoJy4vcXVlcnktdHlwZXMnKTtcbmNvbnN0IE9wID0gcmVxdWlyZSgnLi9vcGVyYXRvcnMnKTtcblxuLyoqXG4gKiBUaGUgaW50ZXJmYWNlIHRoYXQgU2VxdWVsaXplIHVzZXMgdG8gdGFsayB0byBhbGwgZGF0YWJhc2VzXG4gKlxuICogQGNsYXNzIFF1ZXJ5SW50ZXJmYWNlXG4gKi9cbmNsYXNzIFF1ZXJ5SW50ZXJmYWNlIHtcbiAgY29uc3RydWN0b3Ioc2VxdWVsaXplKSB7XG4gICAgdGhpcy5zZXF1ZWxpemUgPSBzZXF1ZWxpemU7XG4gICAgdGhpcy5RdWVyeUdlbmVyYXRvciA9IHRoaXMuc2VxdWVsaXplLmRpYWxlY3QuUXVlcnlHZW5lcmF0b3I7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgZGF0YWJhc2VcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFiYXNlICBEYXRhYmFzZSBuYW1lIHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG9wdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNoYXJzZXRdIERhdGFiYXNlIGRlZmF1bHQgY2hhcmFjdGVyIHNldCwgTVlTUUwgb25seVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY29sbGF0ZV0gRGF0YWJhc2UgZGVmYXVsdCBjb2xsYXRpb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmVuY29kaW5nXSBEYXRhYmFzZSBkZWZhdWx0IGNoYXJhY3RlciBzZXQsIFBvc3RncmVTUUwgb25seVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY3R5cGVdIERhdGFiYXNlIGNoYXJhY3RlciBjbGFzc2lmaWNhdGlvbiwgUG9zdGdyZVNRTCBvbmx5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50ZW1wbGF0ZV0gVGhlIG5hbWUgb2YgdGhlIHRlbXBsYXRlIGZyb20gd2hpY2ggdG8gY3JlYXRlIHRoZSBuZXcgZGF0YWJhc2UsIFBvc3RncmVTUUwgb25seVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGNyZWF0ZURhdGFiYXNlKGRhdGFiYXNlLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGRhdGFiYXNlLCBvcHRpb25zKTtcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wIGEgZGF0YWJhc2VcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFiYXNlICBEYXRhYmFzZSBuYW1lIHRvIGRyb3BcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgZHJvcERhdGFiYXNlKGRhdGFiYXNlLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5kcm9wRGF0YWJhc2VRdWVyeShkYXRhYmFzZSk7XG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgc2NoZW1hXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWEgICAgU2NoZW1hIG5hbWUgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGNyZWF0ZVNjaGVtYShzY2hlbWEsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmNyZWF0ZVNjaGVtYShzY2hlbWEpO1xuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3AgYSBzY2hlbWFcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNjaGVtYSAgICBTY2hlbWEgbmFtZSB0byBkcm9wXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGRyb3BTY2hlbWEoc2NoZW1hLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5kcm9wU2NoZW1hKHNjaGVtYSk7XG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogRHJvcCBhbGwgc2NoZW1hc1xuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBkcm9wQWxsU2NoZW1hcyhvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAoIXRoaXMuUXVlcnlHZW5lcmF0b3IuX2RpYWxlY3Quc3VwcG9ydHMuc2NoZW1hcykge1xuICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLmRyb3Aob3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNob3dBbGxTY2hlbWFzKG9wdGlvbnMpLm1hcChzY2hlbWFOYW1lID0+IHRoaXMuZHJvcFNjaGVtYShzY2hlbWFOYW1lLCBvcHRpb25zKSk7XG4gIH1cblxuICAvKipcbiAgICogU2hvdyBhbGwgc2NoZW1hc1xuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8QXJyYXk+fVxuICAgKi9cbiAgc2hvd0FsbFNjaGVtYXMob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICByYXc6IHRydWUsXG4gICAgICB0eXBlOiB0aGlzLnNlcXVlbGl6ZS5RdWVyeVR5cGVzLlNFTEVDVFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2hvd1NjaGVtYXNTcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnNob3dTY2hlbWFzUXVlcnkob3B0aW9ucyk7XG5cbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc2hvd1NjaGVtYXNTcWwsIG9wdGlvbnMpLnRoZW4oc2NoZW1hTmFtZXMgPT4gXy5mbGF0dGVuKFxuICAgICAgc2NoZW1hTmFtZXMubWFwKHZhbHVlID0+IHZhbHVlLnNjaGVtYV9uYW1lID8gdmFsdWUuc2NoZW1hX25hbWUgOiB2YWx1ZSlcbiAgICApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gZGF0YWJhc2UgdmVyc2lvblxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgW29wdGlvbnNdICAgICAgUXVlcnkgb3B0aW9uc1xuICAgKiBAcGFyYW0ge1F1ZXJ5VHlwZX0gW29wdGlvbnMudHlwZV0gUXVlcnkgdHlwZVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGRhdGFiYXNlVmVyc2lvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KFxuICAgICAgdGhpcy5RdWVyeUdlbmVyYXRvci52ZXJzaW9uUXVlcnkoKSxcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgdHlwZTogUXVlcnlUeXBlcy5WRVJTSU9OIH0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSB0YWJsZSB3aXRoIGdpdmVuIHNldCBvZiBhdHRyaWJ1dGVzXG4gICAqXG4gICAqIGBgYGpzXG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmNyZWF0ZVRhYmxlKFxuICAgKiAgICduYW1lT2ZUaGVOZXdUYWJsZScsXG4gICAqICAge1xuICAgKiAgICAgaWQ6IHtcbiAgICogICAgICAgdHlwZTogU2VxdWVsaXplLklOVEVHRVIsXG4gICAqICAgICAgIHByaW1hcnlLZXk6IHRydWUsXG4gICAqICAgICAgIGF1dG9JbmNyZW1lbnQ6IHRydWVcbiAgICogICAgIH0sXG4gICAqICAgICBjcmVhdGVkQXQ6IHtcbiAgICogICAgICAgdHlwZTogU2VxdWVsaXplLkRBVEVcbiAgICogICAgIH0sXG4gICAqICAgICB1cGRhdGVkQXQ6IHtcbiAgICogICAgICAgdHlwZTogU2VxdWVsaXplLkRBVEVcbiAgICogICAgIH0sXG4gICAqICAgICBhdHRyMTogU2VxdWVsaXplLlNUUklORyxcbiAgICogICAgIGF0dHIyOiBTZXF1ZWxpemUuSU5URUdFUixcbiAgICogICAgIGF0dHIzOiB7XG4gICAqICAgICAgIHR5cGU6IFNlcXVlbGl6ZS5CT09MRUFOLFxuICAgKiAgICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgKiAgICAgICBhbGxvd051bGw6IGZhbHNlXG4gICAqICAgICB9LFxuICAgKiAgICAgLy9mb3JlaWduIGtleSB1c2FnZVxuICAgKiAgICAgYXR0cjQ6IHtcbiAgICogICAgICAgdHlwZTogU2VxdWVsaXplLklOVEVHRVIsXG4gICAqICAgICAgIHJlZmVyZW5jZXM6IHtcbiAgICogICAgICAgICBtb2RlbDogJ2Fub3RoZXJfdGFibGVfbmFtZScsXG4gICAqICAgICAgICAga2V5OiAnaWQnXG4gICAqICAgICAgIH0sXG4gICAqICAgICAgIG9uVXBkYXRlOiAnY2FzY2FkZScsXG4gICAqICAgICAgIG9uRGVsZXRlOiAnY2FzY2FkZSdcbiAgICogICAgIH1cbiAgICogICB9LFxuICAgKiAgIHtcbiAgICogICAgIGVuZ2luZTogJ01ZSVNBTScsICAgIC8vIGRlZmF1bHQ6ICdJbm5vREInXG4gICAqICAgICBjaGFyc2V0OiAnbGF0aW4xJywgICAvLyBkZWZhdWx0OiBudWxsXG4gICAqICAgICBzY2hlbWE6ICdwdWJsaWMnLCAgICAvLyBkZWZhdWx0OiBwdWJsaWMsIFBvc3RncmVTUUwgb25seS5cbiAgICogICAgIGNvbW1lbnQ6ICdteSB0YWJsZScsIC8vIGNvbW1lbnQgZm9yIHRhYmxlXG4gICAqICAgICBjb2xsYXRlOiAnbGF0aW4xX2RhbmlzaF9jaScgLy8gY29sbGF0aW9uLCBNWVNRTCBvbmx5XG4gICAqICAgfVxuICAgKiApXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lICBOYW1lIG9mIHRhYmxlIHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlcyBPYmplY3QgcmVwcmVzZW50aW5nIGEgbGlzdCBvZiB0YWJsZSBhdHRyaWJ1dGVzIHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIGNyZWF0ZSB0YWJsZSBhbmQgcXVlcnkgb3B0aW9uc1xuICAgKiBAcGFyYW0ge01vZGVsfSAgW21vZGVsXSBtb2RlbCBjbGFzc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGNyZWF0ZVRhYmxlKHRhYmxlTmFtZSwgYXR0cmlidXRlcywgb3B0aW9ucywgbW9kZWwpIHtcbiAgICBsZXQgc3FsID0gJyc7XG4gICAgbGV0IHByb21pc2U7XG5cbiAgICBvcHRpb25zID0gXy5jbG9uZShvcHRpb25zKSB8fCB7fTtcblxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMudW5pcXVlS2V5cykge1xuICAgICAgXy5mb3JPd24ob3B0aW9ucy51bmlxdWVLZXlzLCB1bmlxdWVLZXkgPT4ge1xuICAgICAgICBpZiAodW5pcXVlS2V5LmN1c3RvbUluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB1bmlxdWVLZXkuY3VzdG9tSW5kZXggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobW9kZWwpIHtcbiAgICAgIG9wdGlvbnMudW5pcXVlS2V5cyA9IG9wdGlvbnMudW5pcXVlS2V5cyB8fCBtb2RlbC51bmlxdWVLZXlzO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZXMgPSBfLm1hcFZhbHVlcyhcbiAgICAgIGF0dHJpYnV0ZXMsXG4gICAgICBhdHRyaWJ1dGUgPT4gdGhpcy5zZXF1ZWxpemUubm9ybWFsaXplQXR0cmlidXRlKGF0dHJpYnV0ZSlcbiAgICApO1xuXG4gICAgLy8gUG9zdGdyZXMgcmVxdWlyZXMgc3BlY2lhbCBTUUwgY29tbWFuZHMgZm9yIEVOVU0vRU5VTVtdXG4gICAgaWYgKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCA9PT0gJ3Bvc3RncmVzJykge1xuICAgICAgcHJvbWlzZSA9IFBvc3RncmVzUXVlcnlJbnRlcmZhY2UuZW5zdXJlRW51bXModGhpcywgdGFibGVOYW1lLCBhdHRyaWJ1dGVzLCBvcHRpb25zLCBtb2RlbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhdGFibGVOYW1lLnNjaGVtYSAmJlxuICAgICAgKG9wdGlvbnMuc2NoZW1hIHx8ICEhbW9kZWwgJiYgbW9kZWwuX3NjaGVtYSlcbiAgICApIHtcbiAgICAgIHRhYmxlTmFtZSA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuYWRkU2NoZW1hKHtcbiAgICAgICAgdGFibGVOYW1lLFxuICAgICAgICBfc2NoZW1hOiAhIW1vZGVsICYmIG1vZGVsLl9zY2hlbWEgfHwgb3B0aW9ucy5zY2hlbWFcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZXMgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmF0dHJpYnV0ZXNUb1NRTChhdHRyaWJ1dGVzLCB7IHRhYmxlOiB0YWJsZU5hbWUsIGNvbnRleHQ6ICdjcmVhdGVUYWJsZScgfSk7XG4gICAgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5jcmVhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcywgb3B0aW9ucyk7XG5cbiAgICByZXR1cm4gcHJvbWlzZS50aGVuKCgpID0+IHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucykpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3AgYSB0YWJsZSBmcm9tIGRhdGFiYXNlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgVGFibGUgbmFtZSB0byBkcm9wXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zICAgUXVlcnkgb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGRyb3BUYWJsZSh0YWJsZU5hbWUsIG9wdGlvbnMpIHtcbiAgICAvLyBpZiB3ZSdyZSBmb3JjaW5nIHdlIHNob3VsZCBiZSBjYXNjYWRpbmcgdW5sZXNzIGV4cGxpY2l0bHkgc3RhdGVkIG90aGVyd2lzZVxuICAgIG9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpIHx8IHt9O1xuICAgIG9wdGlvbnMuY2FzY2FkZSA9IG9wdGlvbnMuY2FzY2FkZSB8fCBvcHRpb25zLmZvcmNlIHx8IGZhbHNlO1xuXG4gICAgbGV0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuZHJvcFRhYmxlUXVlcnkodGFibGVOYW1lLCBvcHRpb25zKTtcblxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcblxuICAgICAgLy8gU2luY2UgcG9zdGdyZXMgaGFzIGEgc3BlY2lhbCBjYXNlIGZvciBlbnVtcywgd2Ugc2hvdWxkIGRyb3AgdGhlIHJlbGF0ZWRcbiAgICAgIC8vIGVudW0gdHlwZSB3aXRoaW4gdGhlIHRhYmxlIGFuZCBhdHRyaWJ1dGVcbiAgICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QgPT09ICdwb3N0Z3JlcycpIHtcbiAgICAgICAgY29uc3QgaW5zdGFuY2VUYWJsZSA9IHRoaXMuc2VxdWVsaXplLm1vZGVsTWFuYWdlci5nZXRNb2RlbCh0YWJsZU5hbWUsIHsgYXR0cmlidXRlOiAndGFibGVOYW1lJyB9KTtcblxuICAgICAgICBpZiAoaW5zdGFuY2VUYWJsZSkge1xuICAgICAgICAgIGNvbnN0IGdldFRhYmxlTmFtZSA9ICghb3B0aW9ucyB8fCAhb3B0aW9ucy5zY2hlbWEgfHwgb3B0aW9ucy5zY2hlbWEgPT09ICdwdWJsaWMnID8gJycgOiBgJHtvcHRpb25zLnNjaGVtYX1fYCkgKyB0YWJsZU5hbWU7XG5cbiAgICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoaW5zdGFuY2VUYWJsZS5yYXdBdHRyaWJ1dGVzKTtcbiAgICAgICAgICBjb25zdCBrZXlMZW4gPSBrZXlzLmxlbmd0aDtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5TGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpbnN0YW5jZVRhYmxlLnJhd0F0dHJpYnV0ZXNba2V5c1tpXV0udHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5FTlVNKSB7XG4gICAgICAgICAgICAgIHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IucGdFbnVtRHJvcChnZXRUYWJsZU5hbWUsIGtleXNbaV0pO1xuICAgICAgICAgICAgICBvcHRpb25zLnN1cHBvcnRzU2VhcmNoUGF0aCA9IGZhbHNlO1xuICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyByYXc6IHRydWUgfSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS5nZXQoMCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRHJvcCBhbGwgdGFibGVzIGZyb20gZGF0YWJhc2VcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBxdWVyeSBvcHRpb25zXG4gICAqIEBwYXJhbSB7QXJyYXl9ICBbb3B0aW9ucy5za2lwXSBMaXN0IG9mIHRhYmxlIHRvIHNraXBcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBkcm9wQWxsVGFibGVzKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBjb25zdCBza2lwID0gb3B0aW9ucy5za2lwIHx8IFtdO1xuXG4gICAgY29uc3QgZHJvcEFsbFRhYmxlcyA9IHRhYmxlTmFtZXMgPT4gUHJvbWlzZS5lYWNoKHRhYmxlTmFtZXMsIHRhYmxlTmFtZSA9PiB7XG4gICAgICAvLyBpZiB0YWJsZU5hbWUgaXMgbm90IGluIHRoZSBBcnJheSBvZiB0YWJsZXMgbmFtZXMgdGhlbiBkb24ndCBkcm9wIGl0XG4gICAgICBpZiAoIXNraXAuaW5jbHVkZXModGFibGVOYW1lLnRhYmxlTmFtZSB8fCB0YWJsZU5hbWUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRyb3BUYWJsZSh0YWJsZU5hbWUsIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgY2FzY2FkZTogdHJ1ZSB9KSApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMuc2hvd0FsbFRhYmxlcyhvcHRpb25zKS50aGVuKHRhYmxlTmFtZXMgPT4ge1xuICAgICAgaWYgKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCA9PT0gJ3NxbGl0ZScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KCdQUkFHTUEgZm9yZWlnbl9rZXlzOycsIG9wdGlvbnMpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICBjb25zdCBmb3JlaWduS2V5c0FyZUVuYWJsZWQgPSByZXN1bHQuZm9yZWlnbl9rZXlzID09PSAxO1xuXG4gICAgICAgICAgaWYgKGZvcmVpZ25LZXlzQXJlRW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KCdQUkFHTUEgZm9yZWlnbl9rZXlzID0gT0ZGJywgb3B0aW9ucylcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gZHJvcEFsbFRhYmxlcyh0YWJsZU5hbWVzKSlcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZXF1ZWxpemUucXVlcnkoJ1BSQUdNQSBmb3JlaWduX2tleXMgPSBPTicsIG9wdGlvbnMpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGRyb3BBbGxUYWJsZXModGFibGVOYW1lcyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZ2V0Rm9yZWlnbktleXNGb3JUYWJsZXModGFibGVOYW1lcywgb3B0aW9ucykudGhlbihmb3JlaWduS2V5cyA9PiB7XG4gICAgICAgIGNvbnN0IHF1ZXJpZXMgPSBbXTtcblxuICAgICAgICB0YWJsZU5hbWVzLmZvckVhY2godGFibGVOYW1lID0+IHtcbiAgICAgICAgICBsZXQgbm9ybWFsaXplZFRhYmxlTmFtZSA9IHRhYmxlTmFtZTtcbiAgICAgICAgICBpZiAoXy5pc09iamVjdCh0YWJsZU5hbWUpKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkVGFibGVOYW1lID0gYCR7dGFibGVOYW1lLnNjaGVtYX0uJHt0YWJsZU5hbWUudGFibGVOYW1lfWA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZm9yZWlnbktleXNbbm9ybWFsaXplZFRhYmxlTmFtZV0uZm9yRWFjaChmb3JlaWduS2V5ID0+IHtcbiAgICAgICAgICAgIHF1ZXJpZXMucHVzaCh0aGlzLlF1ZXJ5R2VuZXJhdG9yLmRyb3BGb3JlaWduS2V5UXVlcnkodGFibGVOYW1lLCBmb3JlaWduS2V5KSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmVhY2gocXVlcmllcywgcSA9PiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShxLCBvcHRpb25zKSlcbiAgICAgICAgICAudGhlbigoKSA9PiBkcm9wQWxsVGFibGVzKHRhYmxlTmFtZXMpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3Agc3BlY2lmaWVkIGVudW0gZnJvbSBkYXRhYmFzZSAoUG9zdGdyZXMgb25seSlcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtlbnVtTmFtZV0gIEVudW0gbmFtZSB0byBkcm9wXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFF1ZXJ5IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBkcm9wRW51bShlbnVtTmFtZSwgb3B0aW9ucykge1xuICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5nZXREaWFsZWN0KCkgIT09ICdwb3N0Z3JlcycpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShcbiAgICAgIHRoaXMuUXVlcnlHZW5lcmF0b3IucGdFbnVtRHJvcChudWxsLCBudWxsLCB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnBnRXNjYXBlQW5kUXVvdGUoZW51bU5hbWUpKSxcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgcmF3OiB0cnVlIH0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcm9wIGFsbCBlbnVtcyBmcm9tIGRhdGFiYXNlIChQb3N0Z3JlcyBvbmx5KVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBRdWVyeSBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZHJvcEFsbEVudW1zKG9wdGlvbnMpIHtcbiAgICBpZiAodGhpcy5zZXF1ZWxpemUuZ2V0RGlhbGVjdCgpICE9PSAncG9zdGdyZXMnKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICByZXR1cm4gdGhpcy5wZ0xpc3RFbnVtcyhudWxsLCBvcHRpb25zKS5tYXAocmVzdWx0ID0+IHRoaXMuc2VxdWVsaXplLnF1ZXJ5KFxuICAgICAgdGhpcy5RdWVyeUdlbmVyYXRvci5wZ0VudW1Ecm9wKG51bGwsIG51bGwsIHRoaXMuUXVlcnlHZW5lcmF0b3IucGdFc2NhcGVBbmRRdW90ZShyZXN1bHQuZW51bV9uYW1lKSksXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7IHJhdzogdHJ1ZSB9KVxuICAgICkpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIGVudW1zIChQb3N0Z3JlcyBvbmx5KVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3RhYmxlTmFtZV0gIFRhYmxlIHdob3NlIGVudW0gdG8gbGlzdFxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdICAgIFF1ZXJ5IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwZ0xpc3RFbnVtcyh0YWJsZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnBnTGlzdEVudW1zKHRhYmxlTmFtZSk7XG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyBwbGFpbjogZmFsc2UsIHJhdzogdHJ1ZSwgdHlwZTogUXVlcnlUeXBlcy5TRUxFQ1QgfSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmFtZSBhIHRhYmxlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBiZWZvcmUgICAgQ3VycmVudCBuYW1lIG9mIHRhYmxlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZnRlciAgICAgTmV3IG5hbWUgZnJvbSB0YWJsZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICByZW5hbWVUYWJsZShiZWZvcmUsIGFmdGVyLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5yZW5hbWVUYWJsZVF1ZXJ5KGJlZm9yZSwgYWZ0ZXIpO1xuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgdGFibGVzIGluIGN1cnJlbnQgZGF0YWJhc2VcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgIFtvcHRpb25zXSBRdWVyeSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICBbb3B0aW9ucy5yYXc9dHJ1ZV0gUnVuIHF1ZXJ5IGluIHJhdyBtb2RlXG4gICAqIEBwYXJhbSB7UXVlcnlUeXBlfSBbb3B0aW9ucy50eXBlPVF1ZXJ5VHlwZS5TSE9XVEFCTEVdIHF1ZXJ5IHR5cGVcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8QXJyYXk+fVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgc2hvd0FsbFRhYmxlcyhvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgIHJhdzogdHJ1ZSxcbiAgICAgIHR5cGU6IFF1ZXJ5VHlwZXMuU0hPV1RBQkxFU1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc2hvd1RhYmxlc1NxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3Iuc2hvd1RhYmxlc1F1ZXJ5KHRoaXMuc2VxdWVsaXplLmNvbmZpZy5kYXRhYmFzZSk7XG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNob3dUYWJsZXNTcWwsIG9wdGlvbnMpLnRoZW4odGFibGVOYW1lcyA9PiBfLmZsYXR0ZW4odGFibGVOYW1lcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2NyaWJlIGEgdGFibGUgc3RydWN0dXJlXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgYW4gYXJyYXkgb2YgaGFzaGVzIGNvbnRhaW5pbmcgaW5mb3JtYXRpb24gYWJvdXQgYWxsIGF0dHJpYnV0ZXMgaW4gdGhlIHRhYmxlLlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiB7XG4gICAqICAgIG5hbWU6IHtcbiAgICogICAgICB0eXBlOiAgICAgICAgICdWQVJDSEFSKDI1NSknLCAvLyB0aGlzIHdpbGwgYmUgJ0NIQVJBQ1RFUiBWQVJZSU5HJyBmb3IgcGchXG4gICAqICAgICAgYWxsb3dOdWxsOiAgICB0cnVlLFxuICAgKiAgICAgIGRlZmF1bHRWYWx1ZTogbnVsbFxuICAgKiAgICB9LFxuICAgKiAgICBpc0JldGFNZW1iZXI6IHtcbiAgICogICAgICB0eXBlOiAgICAgICAgICdUSU5ZSU5UKDEpJywgLy8gdGhpcyB3aWxsIGJlICdCT09MRUFOJyBmb3IgcGchXG4gICAqICAgICAgYWxsb3dOdWxsOiAgICBmYWxzZSxcbiAgICogICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlXG4gICAqICAgIH1cbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlTmFtZSB0YWJsZSBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3Q+fVxuICAgKi9cbiAgZGVzY3JpYmVUYWJsZSh0YWJsZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBsZXQgc2NoZW1hID0gbnVsbDtcbiAgICBsZXQgc2NoZW1hRGVsaW1pdGVyID0gbnVsbDtcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHNjaGVtYSA9IG9wdGlvbnM7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcgJiYgb3B0aW9ucyAhPT0gbnVsbCkge1xuICAgICAgc2NoZW1hID0gb3B0aW9ucy5zY2hlbWEgfHwgbnVsbDtcbiAgICAgIHNjaGVtYURlbGltaXRlciA9IG9wdGlvbnMuc2NoZW1hRGVsaW1pdGVyIHx8IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0YWJsZU5hbWUgPT09ICdvYmplY3QnICYmIHRhYmxlTmFtZSAhPT0gbnVsbCkge1xuICAgICAgc2NoZW1hID0gdGFibGVOYW1lLnNjaGVtYTtcbiAgICAgIHRhYmxlTmFtZSA9IHRhYmxlTmFtZS50YWJsZU5hbWU7XG4gICAgfVxuXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5kZXNjcmliZVRhYmxlUXVlcnkodGFibGVOYW1lLCBzY2hlbWEsIHNjaGVtYURlbGltaXRlcik7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgdHlwZTogUXVlcnlUeXBlcy5ERVNDUklCRSB9KTtcblxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpLnRoZW4oZGF0YSA9PiB7XG4gICAgICAvKlxuICAgICAgICogSWYgbm8gZGF0YSBpcyByZXR1cm5lZCBmcm9tIHRoZSBxdWVyeSwgdGhlbiB0aGUgdGFibGUgbmFtZSBtYXkgYmUgd3JvbmcuXG4gICAgICAgKiBRdWVyeSBnZW5lcmF0b3JzIHRoYXQgdXNlIGluZm9ybWF0aW9uX3NjaGVtYSBmb3IgcmV0cmlldmluZyB0YWJsZSBpbmZvIHdpbGwganVzdCByZXR1cm4gYW4gZW1wdHkgcmVzdWx0IHNldCxcbiAgICAgICAqIGl0IHdpbGwgbm90IHRocm93IGFuIGVycm9yIGxpa2UgYnVpbHQtaW5zIGRvIChlLmcuIERFU0NSSUJFIG9uIE15U3FsKS5cbiAgICAgICAqL1xuICAgICAgaWYgKF8uaXNFbXB0eShkYXRhKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGRlc2NyaXB0aW9uIGZvdW5kIGZvciBcIiR7dGFibGVOYW1lfVwiIHRhYmxlLiBDaGVjayB0aGUgdGFibGUgbmFtZSBhbmQgc2NoZW1hOyByZW1lbWJlciwgdGhleSBfYXJlXyBjYXNlIHNlbnNpdGl2ZS5gKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSkuY2F0Y2goZSA9PiB7XG4gICAgICBpZiAoZS5vcmlnaW5hbCAmJiBlLm9yaWdpbmFsLmNvZGUgPT09ICdFUl9OT19TVUNIX1RBQkxFJykge1xuICAgICAgICB0aHJvdyBFcnJvcihgTm8gZGVzY3JpcHRpb24gZm91bmQgZm9yIFwiJHt0YWJsZU5hbWV9XCIgdGFibGUuIENoZWNrIHRoZSB0YWJsZSBuYW1lIGFuZCBzY2hlbWE7IHJlbWVtYmVyLCB0aGV5IF9hcmVfIGNhc2Ugc2Vuc2l0aXZlLmApO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBjb2x1bW4gdG8gYSB0YWJsZVxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBxdWVyeUludGVyZmFjZS5hZGRDb2x1bW4oJ3RhYmxlQScsICdjb2x1bW5DJywgU2VxdWVsaXplLlNUUklORywge1xuICAgKiAgICBhZnRlcjogJ2NvbHVtbkInIC8vIGFmdGVyIG9wdGlvbiBpcyBvbmx5IHN1cHBvcnRlZCBieSBNeVNRTFxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZSAgICAgVGFibGUgdG8gYWRkIGNvbHVtbiB0b1xuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5ICAgICAgIENvbHVtbiBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGUgQXR0cmlidXRlIGRlZmluaXRpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYWRkQ29sdW1uKHRhYmxlLCBrZXksIGF0dHJpYnV0ZSwgb3B0aW9ucykge1xuICAgIGlmICghdGFibGUgfHwgIWtleSB8fCAhYXR0cmlidXRlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZENvbHVtbiB0YWtlcyBhdCBsZWFzdCAzIGFyZ3VtZW50cyAodGFibGUsIGF0dHJpYnV0ZSBuYW1lLCBhdHRyaWJ1dGUgZGVmaW5pdGlvbiknKTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBhdHRyaWJ1dGUgPSB0aGlzLnNlcXVlbGl6ZS5ub3JtYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkodGhpcy5RdWVyeUdlbmVyYXRvci5hZGRDb2x1bW5RdWVyeSh0YWJsZSwga2V5LCBhdHRyaWJ1dGUpLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBjb2x1bW4gZnJvbSBhIHRhYmxlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgICBUYWJsZSB0byByZW1vdmUgY29sdW1uIGZyb21cbiAgICogQHBhcmFtIHtzdHJpbmd9IGF0dHJpYnV0ZU5hbWUgIENvbHVtbiBuYW1lIHRvIHJlbW92ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdICAgICAgUXVlcnkgb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHJlbW92ZUNvbHVtbih0YWJsZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBzd2l0Y2ggKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCkge1xuICAgICAgY2FzZSAnc3FsaXRlJzpcbiAgICAgICAgLy8gc3FsaXRlIG5lZWRzIHNvbWUgc3BlY2lhbCB0cmVhdG1lbnQgYXMgaXQgY2Fubm90IGRyb3AgYSBjb2x1bW5cbiAgICAgICAgcmV0dXJuIFNRTGl0ZVF1ZXJ5SW50ZXJmYWNlLnJlbW92ZUNvbHVtbih0aGlzLCB0YWJsZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIG9wdGlvbnMpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHRoaXMuUXVlcnlHZW5lcmF0b3IucmVtb3ZlQ29sdW1uUXVlcnkodGFibGVOYW1lLCBhdHRyaWJ1dGVOYW1lKSwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSBhIGNvbHVtbiBkZWZpbml0aW9uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgICAgICAgVGFibGUgbmFtZSB0byBjaGFuZ2UgZnJvbVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXR0cmlidXRlTmFtZSAgICAgIENvbHVtbiBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhVHlwZU9yT3B0aW9ucyAgQXR0cmlidXRlIGRlZmluaXRpb24gZm9yIG5ldyBjb2x1bW5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAgICAgICAgICBRdWVyeSBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgY2hhbmdlQ29sdW1uKHRhYmxlTmFtZSwgYXR0cmlidXRlTmFtZSwgZGF0YVR5cGVPck9wdGlvbnMsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0ge307XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAoXy52YWx1ZXMoRGF0YVR5cGVzKS5pbmNsdWRlcyhkYXRhVHlwZU9yT3B0aW9ucykpIHtcbiAgICAgIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSB7IHR5cGU6IGRhdGFUeXBlT3JPcHRpb25zLCBhbGxvd051bGw6IHRydWUgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9IGRhdGFUeXBlT3JPcHRpb25zO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSB0aGlzLnNlcXVlbGl6ZS5ub3JtYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSk7XG5cbiAgICBpZiAodGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0ID09PSAnc3FsaXRlJykge1xuICAgICAgLy8gc3FsaXRlIG5lZWRzIHNvbWUgc3BlY2lhbCB0cmVhdG1lbnQgYXMgaXQgY2Fubm90IGNoYW5nZSBhIGNvbHVtblxuICAgICAgcmV0dXJuIFNRTGl0ZVF1ZXJ5SW50ZXJmYWNlLmNoYW5nZUNvbHVtbih0aGlzLCB0YWJsZU5hbWUsIGF0dHJpYnV0ZXMsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBjb25zdCBxdWVyeSA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuYXR0cmlidXRlc1RvU1FMKGF0dHJpYnV0ZXMsIHtcbiAgICAgIGNvbnRleHQ6ICdjaGFuZ2VDb2x1bW4nLFxuICAgICAgdGFibGU6IHRhYmxlTmFtZVxuICAgIH0pO1xuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuY2hhbmdlQ29sdW1uUXVlcnkodGFibGVOYW1lLCBxdWVyeSk7XG5cbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5hbWUgYSBjb2x1bW5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlTmFtZSAgICAgICAgVGFibGUgbmFtZSB3aG9zZSBjb2x1bW4gdG8gcmVuYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyTmFtZUJlZm9yZSAgIEN1cnJlbnQgY29sdW1uIG5hbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGF0dHJOYW1lQWZ0ZXIgICAgTmV3IGNvbHVtbiBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gICAgICAgIFF1ZXJ5IG9wdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHJlbmFtZUNvbHVtbih0YWJsZU5hbWUsIGF0dHJOYW1lQmVmb3JlLCBhdHRyTmFtZUFmdGVyLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpYmVUYWJsZSh0YWJsZU5hbWUsIG9wdGlvbnMpLnRoZW4oZGF0YSA9PiB7XG4gICAgICBpZiAoIWRhdGFbYXR0ck5hbWVCZWZvcmVdKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVGFibGUgJHt0YWJsZU5hbWV9IGRvZXNuJ3QgaGF2ZSB0aGUgY29sdW1uICR7YXR0ck5hbWVCZWZvcmV9YCk7XG4gICAgICB9XG5cbiAgICAgIGRhdGEgPSBkYXRhW2F0dHJOYW1lQmVmb3JlXSB8fCB7fTtcblxuICAgICAgY29uc3QgX29wdGlvbnMgPSB7fTtcblxuICAgICAgX29wdGlvbnNbYXR0ck5hbWVBZnRlcl0gPSB7XG4gICAgICAgIGF0dHJpYnV0ZTogYXR0ck5hbWVBZnRlcixcbiAgICAgICAgdHlwZTogZGF0YS50eXBlLFxuICAgICAgICBhbGxvd051bGw6IGRhdGEuYWxsb3dOdWxsLFxuICAgICAgICBkZWZhdWx0VmFsdWU6IGRhdGEuZGVmYXVsdFZhbHVlXG4gICAgICB9O1xuXG4gICAgICAvLyBmaXg6IGEgbm90LW51bGwgY29sdW1uIGNhbm5vdCBoYXZlIG51bGwgYXMgZGVmYXVsdCB2YWx1ZVxuICAgICAgaWYgKGRhdGEuZGVmYXVsdFZhbHVlID09PSBudWxsICYmICFkYXRhLmFsbG93TnVsbCkge1xuICAgICAgICBkZWxldGUgX29wdGlvbnNbYXR0ck5hbWVBZnRlcl0uZGVmYXVsdFZhbHVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0ID09PSAnc3FsaXRlJykge1xuICAgICAgICAvLyBzcWxpdGUgbmVlZHMgc29tZSBzcGVjaWFsIHRyZWF0bWVudCBhcyBpdCBjYW5ub3QgcmVuYW1lIGEgY29sdW1uXG4gICAgICAgIHJldHVybiBTUUxpdGVRdWVyeUludGVyZmFjZS5yZW5hbWVDb2x1bW4odGhpcywgdGFibGVOYW1lLCBhdHRyTmFtZUJlZm9yZSwgYXR0ck5hbWVBZnRlciwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnJlbmFtZUNvbHVtblF1ZXJ5KFxuICAgICAgICB0YWJsZU5hbWUsXG4gICAgICAgIGF0dHJOYW1lQmVmb3JlLFxuICAgICAgICB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmF0dHJpYnV0ZXNUb1NRTChfb3B0aW9ucylcbiAgICAgICk7XG4gICAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gaW5kZXggdG8gYSBjb2x1bW5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSAgdGFibGVOYW1lIFRhYmxlIG5hbWUgdG8gYWRkIGluZGV4IG9uLCBjYW4gYmUgYSBvYmplY3Qgd2l0aCBzY2hlbWFcbiAgICogQHBhcmFtIHtBcnJheX0gICBbYXR0cmlidXRlc10gICAgIFVzZSBvcHRpb25zLmZpZWxkcyBpbnN0ZWFkLCBMaXN0IG9mIGF0dHJpYnV0ZXMgdG8gYWRkIGluZGV4IG9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgb3B0aW9ucyAgICAgICAgICBpbmRleGVzIG9wdGlvbnNcbiAgICogQHBhcmFtIHtBcnJheX0gICBvcHRpb25zLmZpZWxkcyAgIExpc3Qgb2YgYXR0cmlidXRlcyB0byBhZGQgaW5kZXggb25cbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jb25jdXJyZW50bHldIFBhc3MgQ09OQ1VSUkVOVCBzbyBvdGhlciBvcGVyYXRpb25zIHJ1biB3aGlsZSB0aGUgaW5kZXggaXMgY3JlYXRlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnVuaXF1ZV0gQ3JlYXRlIGEgdW5pcXVlIGluZGV4XG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgW29wdGlvbnMudXNpbmddICBVc2VmdWwgZm9yIEdJTiBpbmRleGVzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgW29wdGlvbnMub3BlcmF0b3JdIEluZGV4IG9wZXJhdG9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgW29wdGlvbnMudHlwZV0gICBUeXBlIG9mIGluZGV4LCBhdmFpbGFibGUgb3B0aW9ucyBhcmUgVU5JUVVFfEZVTExURVhUfFNQQVRJQUxcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBbb3B0aW9ucy5uYW1lXSAgIE5hbWUgb2YgdGhlIGluZGV4LiBEZWZhdWx0IGlzIDx0YWJsZT5fPGF0dHIxPl88YXR0cjI+XG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgW29wdGlvbnMud2hlcmVdICBXaGVyZSBjb25kaXRpb24gb24gaW5kZXgsIGZvciBwYXJ0aWFsIGluZGV4ZXNcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBbcmF3VGFibGVuYW1lXSAgIHRhYmxlIG5hbWUsIHRoaXMgaXMganVzdCBmb3IgYmFja3dhcmQgY29tcGF0aWJpaXR5XG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYWRkSW5kZXgodGFibGVOYW1lLCBhdHRyaWJ1dGVzLCBvcHRpb25zLCByYXdUYWJsZW5hbWUpIHtcbiAgICAvLyBTdXBwb3J0IGZvciBwYXNzaW5nIHRhYmxlTmFtZSwgYXR0cmlidXRlcywgb3B0aW9ucyBvciB0YWJsZU5hbWUsIG9wdGlvbnMgKHdpdGggYSBmaWVsZHMgcGFyYW0gd2hpY2ggaXMgdGhlIGF0dHJpYnV0ZXMpXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGF0dHJpYnV0ZXMpKSB7XG4gICAgICByYXdUYWJsZW5hbWUgPSBvcHRpb25zO1xuICAgICAgb3B0aW9ucyA9IGF0dHJpYnV0ZXM7XG4gICAgICBhdHRyaWJ1dGVzID0gb3B0aW9ucy5maWVsZHM7XG4gICAgfVxuXG4gICAgaWYgKCFyYXdUYWJsZW5hbWUpIHtcbiAgICAgIC8vIE1hcCBmb3IgYmFja3dhcmRzIGNvbXBhdFxuICAgICAgcmF3VGFibGVuYW1lID0gdGFibGVOYW1lO1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XG4gICAgb3B0aW9ucy5maWVsZHMgPSBhdHRyaWJ1dGVzO1xuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuYWRkSW5kZXhRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMsIHJhd1RhYmxlbmFtZSk7XG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyBzdXBwb3J0c1NlYXJjaFBhdGg6IGZhbHNlIH0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaG93IGluZGV4ZXMgb24gYSB0YWJsZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lIHRhYmxlIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAgIFF1ZXJ5IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8QXJyYXk+fVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgc2hvd0luZGV4KHRhYmxlTmFtZSwgb3B0aW9ucykge1xuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3Iuc2hvd0luZGV4ZXNRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMpO1xuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgdHlwZTogUXVlcnlUeXBlcy5TSE9XSU5ERVhFUyB9KSk7XG4gIH1cblxuICBnZXRGb3JlaWduS2V5c0ZvclRhYmxlcyh0YWJsZU5hbWVzLCBvcHRpb25zKSB7XG4gICAgaWYgKHRhYmxlTmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyB8fCB7fSwgeyB0eXBlOiBRdWVyeVR5cGVzLkZPUkVJR05LRVlTIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UubWFwKHRhYmxlTmFtZXMsIHRhYmxlTmFtZSA9PlxuICAgICAgdGhpcy5zZXF1ZWxpemUucXVlcnkodGhpcy5RdWVyeUdlbmVyYXRvci5nZXRGb3JlaWduS2V5c1F1ZXJ5KHRhYmxlTmFtZSwgdGhpcy5zZXF1ZWxpemUuY29uZmlnLmRhdGFiYXNlKSwgb3B0aW9ucylcbiAgICApLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSB7fTtcblxuICAgICAgdGFibGVOYW1lcy5mb3JFYWNoKCh0YWJsZU5hbWUsIGkpID0+IHtcbiAgICAgICAgaWYgKF8uaXNPYmplY3QodGFibGVOYW1lKSkge1xuICAgICAgICAgIHRhYmxlTmFtZSA9IGAke3RhYmxlTmFtZS5zY2hlbWF9LiR7dGFibGVOYW1lLnRhYmxlTmFtZX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0W3RhYmxlTmFtZV0gPSBBcnJheS5pc0FycmF5KHJlc3VsdHNbaV0pXG4gICAgICAgICAgPyByZXN1bHRzW2ldLm1hcChyID0+IHIuY29uc3RyYWludF9uYW1lKVxuICAgICAgICAgIDogW3Jlc3VsdHNbaV0gJiYgcmVzdWx0c1tpXS5jb25zdHJhaW50X25hbWVdO1xuXG4gICAgICAgIHJlc3VsdFt0YWJsZU5hbWVdID0gcmVzdWx0W3RhYmxlTmFtZV0uZmlsdGVyKF8uaWRlbnRpdHkpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGZvcmVpZ24ga2V5IHJlZmVyZW5jZXMgZGV0YWlscyBmb3IgdGhlIHRhYmxlXG4gICAqXG4gICAqIFRob3NlIGRldGFpbHMgY29udGFpbnMgY29uc3RyYWludFNjaGVtYSwgY29uc3RyYWludE5hbWUsIGNvbnN0cmFpbnRDYXRhbG9nXG4gICAqIHRhYmxlQ2F0YWxvZywgdGFibGVTY2hlbWEsIHRhYmxlTmFtZSwgY29sdW1uTmFtZSxcbiAgICogcmVmZXJlbmNlZFRhYmxlQ2F0YWxvZywgcmVmZXJlbmNlZFRhYmxlQ2F0YWxvZywgcmVmZXJlbmNlZFRhYmxlU2NoZW1hLCByZWZlcmVuY2VkVGFibGVOYW1lLCByZWZlcmVuY2VkQ29sdW1uTmFtZS5cbiAgICogUmVtaW5kOiBjb25zdHJhaW50IGluZm9ybWF0aW9ucyB3b24ndCByZXR1cm4gaWYgaXQncyBzcWxpdGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgdGFibGUgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdICBRdWVyeSBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgZ2V0Rm9yZWlnbktleVJlZmVyZW5jZXNGb3JUYWJsZSh0YWJsZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBxdWVyeU9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICB0eXBlOiBRdWVyeVR5cGVzLkZPUkVJR05LRVlTXG4gICAgfSk7XG4gICAgY29uc3QgY2F0YWxvZ05hbWUgPSB0aGlzLnNlcXVlbGl6ZS5jb25maWcuZGF0YWJhc2U7XG4gICAgc3dpdGNoICh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QpIHtcbiAgICAgIGNhc2UgJ3NxbGl0ZSc6XG4gICAgICAgIC8vIHNxbGl0ZSBuZWVkcyBzb21lIHNwZWNpYWwgdHJlYXRtZW50LlxuICAgICAgICByZXR1cm4gU1FMaXRlUXVlcnlJbnRlcmZhY2UuZ2V0Rm9yZWlnbktleVJlZmVyZW5jZXNGb3JUYWJsZSh0aGlzLCB0YWJsZU5hbWUsIHF1ZXJ5T3B0aW9ucyk7XG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5RdWVyeUdlbmVyYXRvci5nZXRGb3JlaWduS2V5c1F1ZXJ5KHRhYmxlTmFtZSwgY2F0YWxvZ05hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkocXVlcnksIHF1ZXJ5T3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBhbHJlYWR5IGV4aXN0aW5nIGluZGV4IGZyb20gYSB0YWJsZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lICAgICAgICAgICAgIFRhYmxlIG5hbWUgdG8gZHJvcCBpbmRleCBmcm9tXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpbmRleE5hbWVPckF0dHJpYnV0ZXMgSW5kZXggbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdICAgICAgICAgICAgIFF1ZXJ5IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICByZW1vdmVJbmRleCh0YWJsZU5hbWUsIGluZGV4TmFtZU9yQXR0cmlidXRlcywgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IucmVtb3ZlSW5kZXhRdWVyeSh0YWJsZU5hbWUsIGluZGV4TmFtZU9yQXR0cmlidXRlcyk7XG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgY29uc3RyYWludCB0byBhIHRhYmxlXG4gICAqXG4gICAqIEF2YWlsYWJsZSBjb25zdHJhaW50czpcbiAgICogLSBVTklRVUVcbiAgICogLSBERUZBVUxUIChNU1NRTCBvbmx5KVxuICAgKiAtIENIRUNLIChNeVNRTCAtIElnbm9yZWQgYnkgdGhlIGRhdGFiYXNlIGVuZ2luZSApXG4gICAqIC0gRk9SRUlHTiBLRVlcbiAgICogLSBQUklNQVJZIEtFWVxuICAgKlxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5VTklRVUU8L2NhcHRpb24+XG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmFkZENvbnN0cmFpbnQoJ1VzZXJzJywgWydlbWFpbCddLCB7XG4gICAqICAgdHlwZTogJ3VuaXF1ZScsXG4gICAqICAgbmFtZTogJ2N1c3RvbV91bmlxdWVfY29uc3RyYWludF9uYW1lJ1xuICAgKiB9KTtcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+Q0hFQ0s8L2NhcHRpb24+XG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmFkZENvbnN0cmFpbnQoJ1VzZXJzJywgWydyb2xlcyddLCB7XG4gICAqICAgdHlwZTogJ2NoZWNrJyxcbiAgICogICB3aGVyZToge1xuICAgKiAgICAgIHJvbGVzOiBbJ3VzZXInLCAnYWRtaW4nLCAnbW9kZXJhdG9yJywgJ2d1ZXN0J11cbiAgICogICB9XG4gICAqIH0pO1xuICAgKlxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5EZWZhdWx0IC0gTVNTUUwgb25seTwvY2FwdGlvbj5cbiAgICogcXVlcnlJbnRlcmZhY2UuYWRkQ29uc3RyYWludCgnVXNlcnMnLCBbJ3JvbGVzJ10sIHtcbiAgICogICAgdHlwZTogJ2RlZmF1bHQnLFxuICAgKiAgICBkZWZhdWx0VmFsdWU6ICdndWVzdCdcbiAgICogfSk7XG4gICAqXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPlByaW1hcnkgS2V5PC9jYXB0aW9uPlxuICAgKiBxdWVyeUludGVyZmFjZS5hZGRDb25zdHJhaW50KCdVc2VycycsIFsndXNlcm5hbWUnXSwge1xuICAgKiAgICB0eXBlOiAncHJpbWFyeSBrZXknLFxuICAgKiAgICBuYW1lOiAnY3VzdG9tX3ByaW1hcnlfY29uc3RyYWludF9uYW1lJ1xuICAgKiB9KTtcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+Rm9yZWlnbiBLZXk8L2NhcHRpb24+XG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmFkZENvbnN0cmFpbnQoJ1Bvc3RzJywgWyd1c2VybmFtZSddLCB7XG4gICAqICAgdHlwZTogJ2ZvcmVpZ24ga2V5JyxcbiAgICogICBuYW1lOiAnY3VzdG9tX2ZrZXlfY29uc3RyYWludF9uYW1lJyxcbiAgICogICByZWZlcmVuY2VzOiB7IC8vUmVxdWlyZWQgZmllbGRcbiAgICogICAgIHRhYmxlOiAndGFyZ2V0X3RhYmxlX25hbWUnLFxuICAgKiAgICAgZmllbGQ6ICd0YXJnZXRfY29sdW1uX25hbWUnXG4gICAqICAgfSxcbiAgICogICBvbkRlbGV0ZTogJ2Nhc2NhZGUnLFxuICAgKiAgIG9uVXBkYXRlOiAnY2FzY2FkZSdcbiAgICogfSk7XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgICAgICAgICAgICAgICBUYWJsZSBuYW1lIHdoZXJlIHlvdSB3YW50IHRvIGFkZCBhIGNvbnN0cmFpbnRcbiAgICogQHBhcmFtIHtBcnJheX0gIGF0dHJpYnV0ZXMgICAgICAgICAgICAgICAgIEFycmF5IG9mIGNvbHVtbiBuYW1lcyB0byBhcHBseSB0aGUgY29uc3RyYWludCBvdmVyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zICAgICAgICAgICAgICAgICAgICBBbiBvYmplY3QgdG8gZGVmaW5lIHRoZSBjb25zdHJhaW50IG5hbWUsIHR5cGUgZXRjXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnR5cGUgICAgICAgICAgICAgICBUeXBlIG9mIGNvbnN0cmFpbnQuIE9uZSBvZiB0aGUgdmFsdWVzIGluIGF2YWlsYWJsZSBjb25zdHJhaW50cyhjYXNlIGluc2Vuc2l0aXZlKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubmFtZV0gICAgICAgICAgICAgTmFtZSBvZiB0aGUgY29uc3RyYWludC4gSWYgbm90IHNwZWNpZmllZCwgc2VxdWVsaXplIGF1dG9tYXRpY2FsbHkgY3JlYXRlcyBhIG5hbWVkIGNvbnN0cmFpbnQgYmFzZWQgb24gY29uc3RyYWludCB0eXBlLCB0YWJsZSAmIGNvbHVtbiBuYW1lc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVmYXVsdFZhbHVlXSAgICAgVGhlIHZhbHVlIGZvciB0aGUgZGVmYXVsdCBjb25zdHJhaW50XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy53aGVyZV0gICAgICAgICAgICBXaGVyZSBjbGF1c2UvZXhwcmVzc2lvbiBmb3IgdGhlIENIRUNLIGNvbnN0cmFpbnRcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnJlZmVyZW5jZXNdICAgICAgIE9iamVjdCBzcGVjaWZ5aW5nIHRhcmdldCB0YWJsZSwgY29sdW1uIG5hbWUgdG8gY3JlYXRlIGZvcmVpZ24ga2V5IGNvbnN0cmFpbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnJlZmVyZW5jZXMudGFibGVdIFRhcmdldCB0YWJsZSBuYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5yZWZlcmVuY2VzLmZpZWxkXSBUYXJnZXQgY29sdW1uIG5hbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyYXdUYWJsZW5hbWVdICAgICAgICAgICAgIFRhYmxlIG5hbWUsIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYWRkQ29uc3RyYWludCh0YWJsZU5hbWUsIGF0dHJpYnV0ZXMsIG9wdGlvbnMsIHJhd1RhYmxlbmFtZSkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShhdHRyaWJ1dGVzKSkge1xuICAgICAgcmF3VGFibGVuYW1lID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSBhdHRyaWJ1dGVzO1xuICAgICAgYXR0cmlidXRlcyA9IG9wdGlvbnMuZmllbGRzO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy50eXBlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbnN0cmFpbnQgdHlwZSBtdXN0IGJlIHNwZWNpZmllZCB0aHJvdWdoIG9wdGlvbnMudHlwZScpO1xuICAgIH1cblxuICAgIGlmICghcmF3VGFibGVuYW1lKSB7XG4gICAgICAvLyBNYXAgZm9yIGJhY2t3YXJkcyBjb21wYXRcbiAgICAgIHJhd1RhYmxlbmFtZSA9IHRhYmxlTmFtZTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xuICAgIG9wdGlvbnMuZmllbGRzID0gYXR0cmlidXRlcztcblxuICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5kaWFsZWN0Lm5hbWUgPT09ICdzcWxpdGUnKSB7XG4gICAgICByZXR1cm4gU1FMaXRlUXVlcnlJbnRlcmZhY2UuYWRkQ29uc3RyYWludCh0aGlzLCB0YWJsZU5hbWUsIG9wdGlvbnMsIHJhd1RhYmxlbmFtZSk7XG4gICAgfVxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuYWRkQ29uc3RyYWludFF1ZXJ5KHRhYmxlTmFtZSwgb3B0aW9ucywgcmF3VGFibGVuYW1lKTtcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcbiAgfVxuXG4gIHNob3dDb25zdHJhaW50KHRhYmxlTmFtZSwgY29uc3RyYWludE5hbWUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnNob3dDb25zdHJhaW50c1F1ZXJ5KHRhYmxlTmFtZSwgY29uc3RyYWludE5hbWUpO1xuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgdHlwZTogUXVlcnlUeXBlcy5TSE9XQ09OU1RSQUlOVFMgfSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIGNvbnN0cmFpbnQgZnJvbSBhIHRhYmxlXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgICAgVGFibGUgbmFtZSB0byBkcm9wIGNvbnN0cmFpbnQgZnJvbVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uc3RyYWludE5hbWUgIENvbnN0cmFpbnQgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAgICAgICAgIFF1ZXJ5IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICByZW1vdmVDb25zdHJhaW50KHRhYmxlTmFtZSwgY29uc3RyYWludE5hbWUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHN3aXRjaCAodGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KSB7XG4gICAgICBjYXNlICdzcWxpdGUnOlxuICAgICAgICByZXR1cm4gU1FMaXRlUXVlcnlJbnRlcmZhY2UucmVtb3ZlQ29uc3RyYWludCh0aGlzLCB0YWJsZU5hbWUsIGNvbnN0cmFpbnROYW1lLCBvcHRpb25zKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IucmVtb3ZlQ29uc3RyYWludFF1ZXJ5KHRhYmxlTmFtZSwgY29uc3RyYWludE5hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnQoaW5zdGFuY2UsIHRhYmxlTmFtZSwgdmFsdWVzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcbiAgICBvcHRpb25zLmhhc1RyaWdnZXIgPSBpbnN0YW5jZSAmJiBpbnN0YW5jZS5jb25zdHJ1Y3Rvci5vcHRpb25zLmhhc1RyaWdnZXI7XG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5pbnNlcnRRdWVyeSh0YWJsZU5hbWUsIHZhbHVlcywgaW5zdGFuY2UgJiYgaW5zdGFuY2UuY29uc3RydWN0b3IucmF3QXR0cmlidXRlcywgb3B0aW9ucyk7XG5cbiAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLklOU0VSVDtcbiAgICBvcHRpb25zLmluc3RhbmNlID0gaW5zdGFuY2U7XG5cbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgaWYgKGluc3RhbmNlKSByZXN1bHRzWzBdLmlzTmV3UmVjb3JkID0gZmFsc2U7XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcHNlcnRcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlTmFtZSAgICB0YWJsZSB0byB1cHNlcnQgb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGluc2VydFZhbHVlcyB2YWx1ZXMgdG8gYmUgaW5zZXJ0ZWQsIG1hcHBlZCB0byBmaWVsZCBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB1cGRhdGVWYWx1ZXMgdmFsdWVzIHRvIGJlIHVwZGF0ZWQsIG1hcHBlZCB0byBmaWVsZCBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB3aGVyZSAgICAgICAgdmFyaW91cyBjb25kaXRpb25zXG4gICAqIEBwYXJhbSB7TW9kZWx9ICBtb2RlbCAgICAgICAgTW9kZWwgdG8gdXBzZXJ0IG9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zICAgICAgcXVlcnkgb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuLD9udW1iZXI+fSBSZXNvbHZlcyBhbiBhcnJheSB3aXRoIDxjcmVhdGVkLCBwcmltYXJ5S2V5PlxuICAgKi9cbiAgdXBzZXJ0KHRhYmxlTmFtZSwgaW5zZXJ0VmFsdWVzLCB1cGRhdGVWYWx1ZXMsIHdoZXJlLCBtb2RlbCwgb3B0aW9ucykge1xuICAgIGNvbnN0IHdoZXJlcyA9IFtdO1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3Qua2V5cyhpbnNlcnRWYWx1ZXMpO1xuICAgIGxldCBpbmRleGVzID0gW107XG4gICAgbGV0IGluZGV4RmllbGRzO1xuXG4gICAgb3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucyk7XG5cbiAgICBpZiAoIVV0aWxzLmlzV2hlcmVFbXB0eSh3aGVyZSkpIHtcbiAgICAgIHdoZXJlcy5wdXNoKHdoZXJlKTtcbiAgICB9XG5cbiAgICAvLyBMZXRzIGNvbWJpbmUgdW5pcXVlIGtleXMgYW5kIGluZGV4ZXMgaW50byBvbmVcbiAgICBpbmRleGVzID0gXy5tYXAobW9kZWwudW5pcXVlS2V5cywgdmFsdWUgPT4ge1xuICAgICAgcmV0dXJuIHZhbHVlLmZpZWxkcztcbiAgICB9KTtcblxuICAgIG1vZGVsLl9pbmRleGVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgaWYgKHZhbHVlLnVuaXF1ZSkge1xuICAgICAgICAvLyBmaWVsZHMgaW4gdGhlIGluZGV4IG1heSBib3RoIHRoZSBzdHJpbmdzIG9yIG9iamVjdHMgd2l0aCBhbiBhdHRyaWJ1dGUgcHJvcGVydHkgLSBsZXRzIHNhbml0aXplIHRoYXRcbiAgICAgICAgaW5kZXhGaWVsZHMgPSB2YWx1ZS5maWVsZHMubWFwKGZpZWxkID0+IHtcbiAgICAgICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGZpZWxkKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkLmF0dHJpYnV0ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9KTtcbiAgICAgICAgaW5kZXhlcy5wdXNoKGluZGV4RmllbGRzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGZvciAoY29uc3QgaW5kZXggb2YgaW5kZXhlcykge1xuICAgICAgaWYgKF8uaW50ZXJzZWN0aW9uKGF0dHJpYnV0ZXMsIGluZGV4KS5sZW5ndGggPT09IGluZGV4Lmxlbmd0aCkge1xuICAgICAgICB3aGVyZSA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGZpZWxkIG9mIGluZGV4KSB7XG4gICAgICAgICAgd2hlcmVbZmllbGRdID0gaW5zZXJ0VmFsdWVzW2ZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgICB3aGVyZXMucHVzaCh3aGVyZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgd2hlcmUgPSB7IFtPcC5vcl06IHdoZXJlcyB9O1xuXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5VUFNFUlQ7XG4gICAgb3B0aW9ucy5yYXcgPSB0cnVlO1xuXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci51cHNlcnRRdWVyeSh0YWJsZU5hbWUsIGluc2VydFZhbHVlcywgdXBkYXRlVmFsdWVzLCB3aGVyZSwgbW9kZWwsIG9wdGlvbnMpO1xuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgIHN3aXRjaCAodGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KSB7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIFtyZXN1bHQsIHVuZGVmaW5lZF07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0IG11bHRpcGxlIHJlY29yZHMgaW50byBhIHRhYmxlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHF1ZXJ5SW50ZXJmYWNlLmJ1bGtJbnNlcnQoJ3JvbGVzJywgW3tcbiAgICogICAgbGFiZWw6ICd1c2VyJyxcbiAgICogICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgKiAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKClcbiAgICogIH0sIHtcbiAgICogICAgbGFiZWw6ICdhZG1pbicsXG4gICAqICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICogICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpXG4gICAqICB9XSk7XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICBUYWJsZSBuYW1lIHRvIGluc2VydCByZWNvcmQgdG9cbiAgICogQHBhcmFtIHtBcnJheX0gIHJlY29yZHMgICAgIExpc3Qgb2YgcmVjb3JkcyB0byBpbnNlcnRcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgICAgIFZhcmlvdXMgb3B0aW9ucywgcGxlYXNlIHNlZSBNb2RlbC5idWxrQ3JlYXRlIG9wdGlvbnNcbiAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMgIFZhcmlvdXMgYXR0cmlidXRlcyBtYXBwZWQgYnkgZmllbGQgbmFtZVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGJ1bGtJbnNlcnQodGFibGVOYW1lLCByZWNvcmRzLCBvcHRpb25zLCBhdHRyaWJ1dGVzKSB7XG4gICAgb3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucykgfHwge307XG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5JTlNFUlQ7XG5cbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoXG4gICAgICB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmJ1bGtJbnNlcnRRdWVyeSh0YWJsZU5hbWUsIHJlY29yZHMsIG9wdGlvbnMsIGF0dHJpYnV0ZXMpLFxuICAgICAgb3B0aW9uc1xuICAgICkudGhlbihyZXN1bHRzID0+IHJlc3VsdHNbMF0pO1xuICB9XG5cbiAgdXBkYXRlKGluc3RhbmNlLCB0YWJsZU5hbWUsIHZhbHVlcywgaWRlbnRpZmllciwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMgfHwge30pO1xuICAgIG9wdGlvbnMuaGFzVHJpZ2dlciA9ICEhKGluc3RhbmNlICYmIGluc3RhbmNlLl9tb2RlbE9wdGlvbnMgJiYgaW5zdGFuY2UuX21vZGVsT3B0aW9ucy5oYXNUcmlnZ2VyKTtcblxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IudXBkYXRlUXVlcnkodGFibGVOYW1lLCB2YWx1ZXMsIGlkZW50aWZpZXIsIG9wdGlvbnMsIGluc3RhbmNlLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXMpO1xuXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5VUERBVEU7XG5cbiAgICBvcHRpb25zLmluc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIG11bHRpcGxlIHJlY29yZHMgb2YgYSB0YWJsZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBxdWVyeUludGVyZmFjZS5idWxrVXBkYXRlKCdyb2xlcycsIHtcbiAgICogICAgIGxhYmVsOiAnYWRtaW4nLFxuICAgKiAgIH0sIHtcbiAgICogICAgIHVzZXJUeXBlOiAzLFxuICAgKiAgIH0sXG4gICAqICk7XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWUgICAgIFRhYmxlIG5hbWUgdG8gdXBkYXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXMgICAgICAgIFZhbHVlcyB0byBiZSBpbnNlcnRlZCwgbWFwcGVkIHRvIGZpZWxkIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGlkZW50aWZpZXIgICAgQSBoYXNoIHdpdGggY29uZGl0aW9ucyBPUiBhbiBJRCBhcyBpbnRlZ2VyIE9SIGEgc3RyaW5nIHdpdGggY29uZGl0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdICAgICBWYXJpb3VzIG9wdGlvbnMsIHBsZWFzZSBzZWUgTW9kZWwuYnVsa0NyZWF0ZSBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbYXR0cmlidXRlc10gIEF0dHJpYnV0ZXMgb24gcmV0dXJuIG9iamVjdHMgaWYgc3VwcG9ydGVkIGJ5IFNRTCBkaWFsZWN0XG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYnVsa1VwZGF0ZSh0YWJsZU5hbWUsIHZhbHVlcywgaWRlbnRpZmllciwgb3B0aW9ucywgYXR0cmlidXRlcykge1xuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XG4gICAgaWYgKHR5cGVvZiBpZGVudGlmaWVyID09PSAnb2JqZWN0JykgaWRlbnRpZmllciA9IFV0aWxzLmNsb25lRGVlcChpZGVudGlmaWVyKTtcblxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IudXBkYXRlUXVlcnkodGFibGVOYW1lLCB2YWx1ZXMsIGlkZW50aWZpZXIsIG9wdGlvbnMsIGF0dHJpYnV0ZXMpO1xuICAgIGNvbnN0IHRhYmxlID0gXy5pc09iamVjdCh0YWJsZU5hbWUpID8gdGFibGVOYW1lIDogeyB0YWJsZU5hbWUgfTtcbiAgICBjb25zdCBtb2RlbCA9IF8uZmluZCh0aGlzLnNlcXVlbGl6ZS5tb2RlbE1hbmFnZXIubW9kZWxzLCB7IHRhYmxlTmFtZTogdGFibGUudGFibGVOYW1lIH0pO1xuXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5CVUxLVVBEQVRFO1xuICAgIG9wdGlvbnMubW9kZWwgPSBtb2RlbDtcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcbiAgfVxuXG4gIGRlbGV0ZShpbnN0YW5jZSwgdGFibGVOYW1lLCBpZGVudGlmaWVyLCBvcHRpb25zKSB7XG4gICAgY29uc3QgY2FzY2FkZXMgPSBbXTtcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmRlbGV0ZVF1ZXJ5KHRhYmxlTmFtZSwgaWRlbnRpZmllciwge30sIGluc3RhbmNlLmNvbnN0cnVjdG9yKTtcblxuICAgIG9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpIHx8IHt9O1xuXG4gICAgLy8gQ2hlY2sgZm9yIGEgcmVzdHJpY3QgZmllbGRcbiAgICBpZiAoISFpbnN0YW5jZS5jb25zdHJ1Y3RvciAmJiAhIWluc3RhbmNlLmNvbnN0cnVjdG9yLmFzc29jaWF0aW9ucykge1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGluc3RhbmNlLmNvbnN0cnVjdG9yLmFzc29jaWF0aW9ucyk7XG4gICAgICBjb25zdCBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICAgIGxldCBhc3NvY2lhdGlvbjtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBhc3NvY2lhdGlvbiA9IGluc3RhbmNlLmNvbnN0cnVjdG9yLmFzc29jaWF0aW9uc1trZXlzW2ldXTtcbiAgICAgICAgaWYgKGFzc29jaWF0aW9uLm9wdGlvbnMgJiYgYXNzb2NpYXRpb24ub3B0aW9ucy5vbkRlbGV0ZSAmJlxuICAgICAgICAgIGFzc29jaWF0aW9uLm9wdGlvbnMub25EZWxldGUudG9Mb3dlckNhc2UoKSA9PT0gJ2Nhc2NhZGUnICYmXG4gICAgICAgICAgYXNzb2NpYXRpb24ub3B0aW9ucy51c2VIb29rcyA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGNhc2NhZGVzLnB1c2goYXNzb2NpYXRpb24uYWNjZXNzb3JzLmdldCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5lYWNoKGNhc2NhZGVzLCBjYXNjYWRlID0+IHtcbiAgICAgIHJldHVybiBpbnN0YW5jZVtjYXNjYWRlXShvcHRpb25zKS50aGVuKGluc3RhbmNlcyA9PiB7XG4gICAgICAgIC8vIENoZWNrIGZvciBoYXNPbmUgcmVsYXRpb25zaGlwIHdpdGggbm9uLWV4aXN0aW5nIGFzc29jaWF0ZSAoXCJoYXMgemVyb1wiKVxuICAgICAgICBpZiAoIWluc3RhbmNlcykge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShpbnN0YW5jZXMpKSBpbnN0YW5jZXMgPSBbaW5zdGFuY2VzXTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5lYWNoKGluc3RhbmNlcywgaW5zdGFuY2UgPT4gaW5zdGFuY2UuZGVzdHJveShvcHRpb25zKSk7XG4gICAgICB9KTtcbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIG9wdGlvbnMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBtdWx0aXBsZSByZWNvcmRzIGZyb20gYSB0YWJsZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gIHRhYmxlTmFtZSAgICAgICAgICAgIHRhYmxlIG5hbWUgZnJvbSB3aGVyZSB0byBkZWxldGUgcmVjb3Jkc1xuICAgKiBAcGFyYW0ge09iamVjdH0gIHdoZXJlICAgICAgICAgICAgICAgIHdoZXJlIGNvbmRpdGlvbnMgdG8gZmluZCByZWNvcmRzIHRvIGRlbGV0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gIFtvcHRpb25zXSAgICAgICAgICAgIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cnVuY2F0ZV0gICBVc2UgdHJ1bmNhdGUgdGFibGUgY29tbWFuZCAgIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhc2NhZGU9ZmFsc2VdICAgICAgICAgT25seSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggVFJVTkNBVEUuIFRydW5jYXRlcyAgYWxsIHRhYmxlcyB0aGF0IGhhdmUgZm9yZWlnbi1rZXkgcmVmZXJlbmNlcyB0byB0aGUgbmFtZWQgdGFibGUsIG9yIHRvIGFueSB0YWJsZXMgYWRkZWQgdG8gdGhlIGdyb3VwIGR1ZSB0byBDQVNDQURFLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlc3RhcnRJZGVudGl0eT1mYWxzZV0gT25seSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggVFJVTkNBVEUuIEF1dG9tYXRpY2FsbHkgcmVzdGFydCBzZXF1ZW5jZXMgb3duZWQgYnkgY29sdW1ucyBvZiB0aGUgdHJ1bmNhdGVkIHRhYmxlLlxuICAgKiBAcGFyYW0ge01vZGVsfSAgIFttb2RlbF0gICAgICAgICAgICAgIE1vZGVsXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYnVsa0RlbGV0ZSh0YWJsZU5hbWUsIHdoZXJlLCBvcHRpb25zLCBtb2RlbCkge1xuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XG4gICAgb3B0aW9ucyA9IF8uZGVmYXVsdHMob3B0aW9ucywgeyBsaW1pdDogbnVsbCB9KTtcblxuICAgIGlmIChvcHRpb25zLnRydW5jYXRlID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoXG4gICAgICAgIHRoaXMuUXVlcnlHZW5lcmF0b3IudHJ1bmNhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgb3B0aW9ucyksXG4gICAgICAgIG9wdGlvbnNcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBpZGVudGlmaWVyID09PSAnb2JqZWN0Jykgd2hlcmUgPSBVdGlscy5jbG9uZURlZXAod2hlcmUpO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KFxuICAgICAgdGhpcy5RdWVyeUdlbmVyYXRvci5kZWxldGVRdWVyeSh0YWJsZU5hbWUsIHdoZXJlLCBvcHRpb25zLCBtb2RlbCksXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgfVxuXG4gIHNlbGVjdChtb2RlbCwgdGFibGVOYW1lLCBvcHRpb25zQXJnKSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnNBcmcsIHsgdHlwZTogUXVlcnlUeXBlcy5TRUxFQ1QsIG1vZGVsIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KFxuICAgICAgdGhpcy5RdWVyeUdlbmVyYXRvci5zZWxlY3RRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMsIG1vZGVsKSxcbiAgICAgIG9wdGlvbnNcbiAgICApO1xuICB9XG5cbiAgaW5jcmVtZW50KG1vZGVsLCB0YWJsZU5hbWUsIHZhbHVlcywgaWRlbnRpZmllciwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XG5cbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmFyaXRobWV0aWNRdWVyeSgnKycsIHRhYmxlTmFtZSwgdmFsdWVzLCBpZGVudGlmaWVyLCBvcHRpb25zLCBvcHRpb25zLmF0dHJpYnV0ZXMpO1xuXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5VUERBVEU7XG4gICAgb3B0aW9ucy5tb2RlbCA9IG1vZGVsO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XG4gIH1cblxuICBkZWNyZW1lbnQobW9kZWwsIHRhYmxlTmFtZSwgdmFsdWVzLCBpZGVudGlmaWVyLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcblxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuYXJpdGhtZXRpY1F1ZXJ5KCctJywgdGFibGVOYW1lLCB2YWx1ZXMsIGlkZW50aWZpZXIsIG9wdGlvbnMsIG9wdGlvbnMuYXR0cmlidXRlcyk7XG5cbiAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLlVQREFURTtcbiAgICBvcHRpb25zLm1vZGVsID0gbW9kZWw7XG5cbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcbiAgfVxuXG4gIHJhd1NlbGVjdCh0YWJsZU5hbWUsIG9wdGlvbnMsIGF0dHJpYnV0ZVNlbGVjdG9yLCBNb2RlbCkge1xuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XG4gICAgb3B0aW9ucyA9IF8uZGVmYXVsdHMob3B0aW9ucywge1xuICAgICAgcmF3OiB0cnVlLFxuICAgICAgcGxhaW46IHRydWUsXG4gICAgICB0eXBlOiBRdWVyeVR5cGVzLlNFTEVDVFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5zZWxlY3RRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMsIE1vZGVsKTtcblxuICAgIGlmIChhdHRyaWJ1dGVTZWxlY3RvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBwYXNzIGFuIGF0dHJpYnV0ZSBzZWxlY3RvciEnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKS50aGVuKGRhdGEgPT4ge1xuICAgICAgaWYgKCFvcHRpb25zLnBsYWluKSB7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBkYXRhID8gZGF0YVthdHRyaWJ1dGVTZWxlY3Rvcl0gOiBudWxsO1xuXG4gICAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMuZGF0YVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGF0YVR5cGUgPSBvcHRpb25zLmRhdGFUeXBlO1xuXG4gICAgICBpZiAoZGF0YVR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuREVDSU1BTCB8fCBkYXRhVHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5GTE9BVCkge1xuICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGRhdGFUeXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLklOVEVHRVIgfHwgZGF0YVR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuQklHSU5UKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChyZXN1bHQsIDEwKTtcbiAgICAgIH1cbiAgICAgIGlmIChkYXRhVHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5EQVRFKSB7XG4gICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwgJiYgIShyZXN1bHQgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlVHJpZ2dlcih0YWJsZU5hbWUsIHRyaWdnZXJOYW1lLCB0aW1pbmdUeXBlLCBmaXJlT25BcnJheSwgZnVuY3Rpb25OYW1lLCBmdW5jdGlvblBhcmFtcywgb3B0aW9uc0FycmF5LCBvcHRpb25zKSB7XG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5jcmVhdGVUcmlnZ2VyKHRhYmxlTmFtZSwgdHJpZ2dlck5hbWUsIHRpbWluZ1R5cGUsIGZpcmVPbkFycmF5LCBmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uUGFyYW1zLCBvcHRpb25zQXJyYXkpO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGlmIChzcWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBkcm9wVHJpZ2dlcih0YWJsZU5hbWUsIHRyaWdnZXJOYW1lLCBvcHRpb25zKSB7XG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5kcm9wVHJpZ2dlcih0YWJsZU5hbWUsIHRyaWdnZXJOYW1lKTtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGlmIChzcWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICByZW5hbWVUcmlnZ2VyKHRhYmxlTmFtZSwgb2xkVHJpZ2dlck5hbWUsIG5ld1RyaWdnZXJOYW1lLCBvcHRpb25zKSB7XG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5yZW5hbWVUcmlnZ2VyKHRhYmxlTmFtZSwgb2xkVHJpZ2dlck5hbWUsIG5ld1RyaWdnZXJOYW1lKTtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGlmIChzcWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuIFNRTCBmdW5jdGlvblxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBxdWVyeUludGVyZmFjZS5jcmVhdGVGdW5jdGlvbihcbiAgICogICAnc29tZUZ1bmN0aW9uJyxcbiAgICogICBbXG4gICAqICAgICB7dHlwZTogJ2ludGVnZXInLCBuYW1lOiAncGFyYW0nLCBkaXJlY3Rpb246ICdJTid9XG4gICAqICAgXSxcbiAgICogICAnaW50ZWdlcicsXG4gICAqICAgJ3BscGdzcWwnLFxuICAgKiAgICdSRVRVUk4gcGFyYW0gKyAxOycsXG4gICAqICAgW1xuICAgKiAgICAgJ0lNTVVUQUJMRScsXG4gICAqICAgICAnTEVBS1BST09GJ1xuICAgKiAgIF0sXG4gICAqICAge1xuICAgKiAgICB2YXJpYWJsZXM6XG4gICAqICAgICAgW1xuICAgKiAgICAgICAge3R5cGU6ICdpbnRlZ2VyJywgbmFtZTogJ215VmFyJywgZGVmYXVsdDogMTAwfVxuICAgKiAgICAgIF0sXG4gICAqICAgICAgZm9yY2U6IHRydWVcbiAgICogICB9O1xuICAgKiApO1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gIGZ1bmN0aW9uTmFtZSAgTmFtZSBvZiBTUUwgZnVuY3Rpb24gdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7QXJyYXl9ICAgcGFyYW1zICAgICAgICBMaXN0IG9mIHBhcmFtZXRlcnMgZGVjbGFyZWQgZm9yIFNRTCBmdW5jdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gIHJldHVyblR5cGUgICAgU1FMIHR5cGUgb2YgZnVuY3Rpb24gcmV0dXJuZWQgdmFsdWVcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBsYW5ndWFnZSAgICAgIFRoZSBuYW1lIG9mIHRoZSBsYW5ndWFnZSB0aGF0IHRoZSBmdW5jdGlvbiBpcyBpbXBsZW1lbnRlZCBpblxuICAgKiBAcGFyYW0ge3N0cmluZ30gIGJvZHkgICAgICAgICAgU291cmNlIGNvZGUgb2YgZnVuY3Rpb25cbiAgICogQHBhcmFtIHtBcnJheX0gICBvcHRpb25zQXJyYXkgIEV4dHJhLW9wdGlvbnMgZm9yIGNyZWF0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgW29wdGlvbnNdICAgICBxdWVyeSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5mb3JjZSBJZiBmb3JjZSBpcyB0cnVlLCBhbnkgZXhpc3RpbmcgZnVuY3Rpb25zIHdpdGggdGhlIHNhbWUgcGFyYW1ldGVycyB3aWxsIGJlIHJlcGxhY2VkLiBGb3IgcG9zdGdyZXMsIHRoaXMgbWVhbnMgdXNpbmcgYENSRUFURSBPUiBSRVBMQUNFIEZVTkNUSU9OYCBpbnN0ZWFkIG9mIGBDUkVBVEUgRlVOQ1RJT05gLiBEZWZhdWx0IGlzIGZhbHNlXG4gICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gICBvcHRpb25zLnZhcmlhYmxlcyBMaXN0IG9mIGRlY2xhcmVkIHZhcmlhYmxlcy4gRWFjaCB2YXJpYWJsZSBzaG91bGQgYmUgYW4gb2JqZWN0IHdpdGggc3RyaW5nIGZpZWxkcyBgdHlwZWAgYW5kIGBuYW1lYCwgYW5kIG9wdGlvbmFsbHkgaGF2aW5nIGEgYGRlZmF1bHRgIGZpZWxkIGFzIHdlbGwuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgY3JlYXRlRnVuY3Rpb24oZnVuY3Rpb25OYW1lLCBwYXJhbXMsIHJldHVyblR5cGUsIGxhbmd1YWdlLCBib2R5LCBvcHRpb25zQXJyYXksIG9wdGlvbnMpIHtcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmNyZWF0ZUZ1bmN0aW9uKGZ1bmN0aW9uTmFtZSwgcGFyYW1zLCByZXR1cm5UeXBlLCBsYW5ndWFnZSwgYm9keSwgb3B0aW9uc0FycmF5LCBvcHRpb25zKTtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGlmIChzcWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICAvKipcbiAgICogRHJvcCBhbiBTUUwgZnVuY3Rpb25cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogcXVlcnlJbnRlcmZhY2UuZHJvcEZ1bmN0aW9uKFxuICAgKiAgICdzb21lRnVuY3Rpb24nLFxuICAgKiAgIFtcbiAgICogICAgIHt0eXBlOiAndmFyY2hhcicsIG5hbWU6ICdwYXJhbTEnLCBkaXJlY3Rpb246ICdJTid9LFxuICAgKiAgICAge3R5cGU6ICdpbnRlZ2VyJywgbmFtZTogJ3BhcmFtMicsIGRpcmVjdGlvbjogJ0lOT1VUJ31cbiAgICogICBdXG4gICAqICk7XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmdW5jdGlvbk5hbWUgTmFtZSBvZiBTUUwgZnVuY3Rpb24gdG8gZHJvcFxuICAgKiBAcGFyYW0ge0FycmF5fSAgcGFyYW1zICAgICAgIExpc3Qgb2YgcGFyYW1ldGVycyBkZWNsYXJlZCBmb3IgU1FMIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gICAgcXVlcnkgb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGRyb3BGdW5jdGlvbihmdW5jdGlvbk5hbWUsIHBhcmFtcywgb3B0aW9ucykge1xuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuZHJvcEZ1bmN0aW9uKGZ1bmN0aW9uTmFtZSwgcGFyYW1zKTtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGlmIChzcWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVuYW1lIGFuIFNRTCBmdW5jdGlvblxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBxdWVyeUludGVyZmFjZS5yZW5hbWVGdW5jdGlvbihcbiAgICogICAnZm9vRnVuY3Rpb24nLFxuICAgKiAgIFtcbiAgICogICAgIHt0eXBlOiAndmFyY2hhcicsIG5hbWU6ICdwYXJhbTEnLCBkaXJlY3Rpb246ICdJTid9LFxuICAgKiAgICAge3R5cGU6ICdpbnRlZ2VyJywgbmFtZTogJ3BhcmFtMicsIGRpcmVjdGlvbjogJ0lOT1VUJ31cbiAgICogICBdLFxuICAgKiAgICdiYXJGdW5jdGlvbidcbiAgICogKTtcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9sZEZ1bmN0aW9uTmFtZSAgQ3VycmVudCBuYW1lIG9mIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7QXJyYXl9ICBwYXJhbXMgICAgICAgICAgIExpc3Qgb2YgcGFyYW1ldGVycyBkZWNsYXJlZCBmb3IgU1FMIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdGdW5jdGlvbk5hbWUgIE5ldyBuYW1lIG9mIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gICAgICAgIHF1ZXJ5IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICByZW5hbWVGdW5jdGlvbihvbGRGdW5jdGlvbk5hbWUsIHBhcmFtcywgbmV3RnVuY3Rpb25OYW1lLCBvcHRpb25zKSB7XG4gICAgY29uc3Qgc3FsID0gdGhpcy5RdWVyeUdlbmVyYXRvci5yZW5hbWVGdW5jdGlvbihvbGRGdW5jdGlvbk5hbWUsIHBhcmFtcywgbmV3RnVuY3Rpb25OYW1lKTtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGlmIChzcWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kcyB1c2VmdWwgZm9yIHF1ZXJ5aW5nXG5cbiAgLyoqXG4gICAqIEVzY2FwZSBhbiBpZGVudGlmaWVyIChlLmcuIGEgdGFibGUgb3IgYXR0cmlidXRlIG5hbWUpXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpZGVudGlmaWVyIGlkZW50aWZpZXIgdG8gcXVvdGVcbiAgICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdICAgSWYgZm9yY2UgaXMgdHJ1ZSx0aGUgaWRlbnRpZmllciB3aWxsIGJlIHF1b3RlZCBldmVuIGlmIHRoZSBgcXVvdGVJZGVudGlmaWVyc2Agb3B0aW9uIGlzIGZhbHNlLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcXVvdGVJZGVudGlmaWVyKGlkZW50aWZpZXIsIGZvcmNlKSB7XG4gICAgcmV0dXJuIHRoaXMuUXVlcnlHZW5lcmF0b3IucXVvdGVJZGVudGlmaWVyKGlkZW50aWZpZXIsIGZvcmNlKTtcbiAgfVxuXG4gIHF1b3RlVGFibGUoaWRlbnRpZmllcikge1xuICAgIHJldHVybiB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnF1b3RlVGFibGUoaWRlbnRpZmllcik7XG4gIH1cblxuICAvKipcbiAgICogUXVvdGUgYXJyYXkgb2YgaWRlbnRpZmllcnMgYXQgb25jZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBpZGVudGlmaWVycyBhcnJheSBvZiBpZGVudGlmaWVycyB0byBxdW90ZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZV0gICBJZiBmb3JjZSBpcyB0cnVlLHRoZSBpZGVudGlmaWVyIHdpbGwgYmUgcXVvdGVkIGV2ZW4gaWYgdGhlIGBxdW90ZUlkZW50aWZpZXJzYCBvcHRpb24gaXMgZmFsc2UuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBxdW90ZUlkZW50aWZpZXJzKGlkZW50aWZpZXJzLCBmb3JjZSkge1xuICAgIHJldHVybiB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnF1b3RlSWRlbnRpZmllcnMoaWRlbnRpZmllcnMsIGZvcmNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFc2NhcGUgYSB2YWx1ZSAoZS5nLiBhIHN0cmluZywgbnVtYmVyIG9yIGRhdGUpXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBzdHJpbmcgdG8gZXNjYXBlXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBlc2NhcGUodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5RdWVyeUdlbmVyYXRvci5lc2NhcGUodmFsdWUpO1xuICB9XG5cbiAgc2V0SXNvbGF0aW9uTGV2ZWwodHJhbnNhY3Rpb24sIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgaWYgKCF0cmFuc2FjdGlvbiB8fCAhKHRyYW5zYWN0aW9uIGluc3RhbmNlb2YgVHJhbnNhY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBzZXQgaXNvbGF0aW9uIGxldmVsIGZvciBhIHRyYW5zYWN0aW9uIHdpdGhvdXQgdHJhbnNhY3Rpb24gb2JqZWN0IScpO1xuICAgIH1cblxuICAgIGlmICh0cmFuc2FjdGlvbi5wYXJlbnQgfHwgIXZhbHVlKSB7XG4gICAgICAvLyBOb3QgcG9zc2libGUgdG8gc2V0IGEgc2VwYXJhdGUgaXNvbGF0aW9uIGxldmVsIGZvciBzYXZlcG9pbnRzXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgIHRyYW5zYWN0aW9uOiB0cmFuc2FjdGlvbi5wYXJlbnQgfHwgdHJhbnNhY3Rpb25cbiAgICB9KTtcblxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3Iuc2V0SXNvbGF0aW9uTGV2ZWxRdWVyeSh2YWx1ZSwge1xuICAgICAgcGFyZW50OiB0cmFuc2FjdGlvbi5wYXJlbnRcbiAgICB9KTtcblxuICAgIGlmICghc3FsKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUucXVlcnkoc3FsLCBvcHRpb25zKTtcbiAgfVxuXG4gIHN0YXJ0VHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIG9wdGlvbnMpIHtcbiAgICBpZiAoIXRyYW5zYWN0aW9uIHx8ICEodHJhbnNhY3Rpb24gaW5zdGFuY2VvZiBUcmFuc2FjdGlvbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIHN0YXJ0IGEgdHJhbnNhY3Rpb24gd2l0aG91dCB0cmFuc2FjdGlvbiBvYmplY3QhJyk7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgIHRyYW5zYWN0aW9uOiB0cmFuc2FjdGlvbi5wYXJlbnQgfHwgdHJhbnNhY3Rpb25cbiAgICB9KTtcbiAgICBvcHRpb25zLnRyYW5zYWN0aW9uLm5hbWUgPSB0cmFuc2FjdGlvbi5wYXJlbnQgPyB0cmFuc2FjdGlvbi5uYW1lIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3Iuc3RhcnRUcmFuc2FjdGlvblF1ZXJ5KHRyYW5zYWN0aW9uKTtcblxuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICB9XG5cbiAgZGVmZXJDb25zdHJhaW50cyh0cmFuc2FjdGlvbiwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICB0cmFuc2FjdGlvbjogdHJhbnNhY3Rpb24ucGFyZW50IHx8IHRyYW5zYWN0aW9uXG4gICAgfSk7XG5cbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmRlZmVyQ29uc3RyYWludHNRdWVyeShvcHRpb25zKTtcblxuICAgIGlmIChzcWwpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5xdWVyeShzcWwsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbW1pdFRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLCBvcHRpb25zKSB7XG4gICAgaWYgKCF0cmFuc2FjdGlvbiB8fCAhKHRyYW5zYWN0aW9uIGluc3RhbmNlb2YgVHJhbnNhY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjb21taXQgYSB0cmFuc2FjdGlvbiB3aXRob3V0IHRyYW5zYWN0aW9uIG9iamVjdCEnKTtcbiAgICB9XG4gICAgaWYgKHRyYW5zYWN0aW9uLnBhcmVudCkge1xuICAgICAgLy8gU2F2ZXBvaW50cyBjYW5ub3QgYmUgY29tbWl0dGVkXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgIHRyYW5zYWN0aW9uOiB0cmFuc2FjdGlvbi5wYXJlbnQgfHwgdHJhbnNhY3Rpb24sXG4gICAgICBzdXBwb3J0c1NlYXJjaFBhdGg6IGZhbHNlLFxuICAgICAgY29tcGxldGVzVHJhbnNhY3Rpb246IHRydWVcbiAgICB9KTtcblxuICAgIGNvbnN0IHNxbCA9IHRoaXMuUXVlcnlHZW5lcmF0b3IuY29tbWl0VHJhbnNhY3Rpb25RdWVyeSh0cmFuc2FjdGlvbik7XG4gICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XG5cbiAgICB0cmFuc2FjdGlvbi5maW5pc2hlZCA9ICdjb21taXQnO1xuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICByb2xsYmFja1RyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLCBvcHRpb25zKSB7XG4gICAgaWYgKCF0cmFuc2FjdGlvbiB8fCAhKHRyYW5zYWN0aW9uIGluc3RhbmNlb2YgVHJhbnNhY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byByb2xsYmFjayBhIHRyYW5zYWN0aW9uIHdpdGhvdXQgdHJhbnNhY3Rpb24gb2JqZWN0IScpO1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICB0cmFuc2FjdGlvbjogdHJhbnNhY3Rpb24ucGFyZW50IHx8IHRyYW5zYWN0aW9uLFxuICAgICAgc3VwcG9ydHNTZWFyY2hQYXRoOiBmYWxzZSxcbiAgICAgIGNvbXBsZXRlc1RyYW5zYWN0aW9uOiB0cnVlXG4gICAgfSk7XG4gICAgb3B0aW9ucy50cmFuc2FjdGlvbi5uYW1lID0gdHJhbnNhY3Rpb24ucGFyZW50ID8gdHJhbnNhY3Rpb24ubmFtZSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBzcWwgPSB0aGlzLlF1ZXJ5R2VuZXJhdG9yLnJvbGxiYWNrVHJhbnNhY3Rpb25RdWVyeSh0cmFuc2FjdGlvbik7XG4gICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuc2VxdWVsaXplLnF1ZXJ5KHNxbCwgb3B0aW9ucyk7XG5cbiAgICB0cmFuc2FjdGlvbi5maW5pc2hlZCA9ICdyb2xsYmFjayc7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5SW50ZXJmYWNlO1xubW9kdWxlLmV4cG9ydHMuUXVlcnlJbnRlcmZhY2UgPSBRdWVyeUludGVyZmFjZTtcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBRdWVyeUludGVyZmFjZTtcbiJdfQ==