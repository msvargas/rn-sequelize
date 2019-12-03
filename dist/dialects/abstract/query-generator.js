'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const util = require('util');

const _ = require('lodash');

const uuidv4 = require('uuid/v4');

const semver = require('semver');

const Utils = require('../../utils');

const deprecations = require('../../utils/deprecations');

const SqlString = require('../../sql-string');

const DataTypes = require('../../data-types');

const Model = require('../../model');

const Association = require('../../associations/base');

const BelongsTo = require('../../associations/belongs-to');

const BelongsToMany = require('../../associations/belongs-to-many');

const HasMany = require('../../associations/has-many');

const Op = require('../../operators');

const sequelizeError = require('../../errors');

const IndexHints = require('../../index-hints');

const QuoteHelper = require('./query-generator/helpers/quote');
/**
 * Abstract Query Generator
 *
 * @private
 */


let QueryGenerator =
/*#__PURE__*/
function () {
  function QueryGenerator(options) {
    _classCallCheck(this, QueryGenerator);

    if (!options.sequelize) throw new Error('QueryGenerator initialized without options.sequelize');
    if (!options._dialect) throw new Error('QueryGenerator initialized without options._dialect');
    this.sequelize = options.sequelize;
    this.options = options.sequelize.options; // dialect name

    this.dialect = options._dialect.name;
    this._dialect = options._dialect;
  }

  _createClass(QueryGenerator, [{
    key: "extractTableDetails",
    value: function extractTableDetails(tableName, options) {
      options = options || {};
      tableName = tableName || {};
      return {
        schema: tableName.schema || options.schema || 'public',
        tableName: _.isPlainObject(tableName) ? tableName.tableName : tableName,
        delimiter: tableName.delimiter || options.delimiter || '.'
      };
    }
  }, {
    key: "addSchema",
    value: function addSchema(param) {
      if (!param._schema) return param.tableName || param;
      const self = this;
      return {
        tableName: param.tableName || param,
        table: param.tableName || param,
        name: param.name || param,
        schema: param._schema,
        delimiter: param._schemaDelimiter || '.',

        toString() {
          return self.quoteTable(this);
        }

      };
    }
  }, {
    key: "dropSchema",
    value: function dropSchema(tableName, options) {
      return this.dropTableQuery(tableName, options);
    }
  }, {
    key: "describeTableQuery",
    value: function describeTableQuery(tableName, schema, schemaDelimiter) {
      const table = this.quoteTable(this.addSchema({
        tableName,
        _schema: schema,
        _schemaDelimiter: schemaDelimiter
      }));
      return `DESCRIBE ${table};`;
    }
  }, {
    key: "dropTableQuery",
    value: function dropTableQuery(tableName) {
      return `DROP TABLE IF EXISTS ${this.quoteTable(tableName)};`;
    }
  }, {
    key: "renameTableQuery",
    value: function renameTableQuery(before, after) {
      return `ALTER TABLE ${this.quoteTable(before)} RENAME TO ${this.quoteTable(after)};`;
    }
    /**
     * Returns an insert into command
     *
     * @param {string} table
     * @param {Object} valueHash       attribute value pairs
     * @param {Object} modelAttributes
     * @param {Object} [options]
     *
     * @private
     */

  }, {
    key: "insertQuery",
    value: function insertQuery(table, valueHash, modelAttributes, options) {
      options = options || {};

      _.defaults(options, this.options);

      const modelAttributeMap = {};
      const fields = [];
      const values = [];
      const bind = [];
      const quotedTable = this.quoteTable(table);
      const bindParam = options.bindParam === undefined ? this.bindParam(bind) : options.bindParam;
      let query;
      let valueQuery = '';
      let emptyQuery = '';
      let outputFragment = '';
      let identityWrapperRequired = false;
      let tmpTable = ''; //tmpTable declaration for trigger

      if (modelAttributes) {
        _.each(modelAttributes, (attribute, key) => {
          modelAttributeMap[key] = attribute;

          if (attribute.field) {
            modelAttributeMap[attribute.field] = attribute;
          }
        });
      }

      if (this._dialect.supports['DEFAULT VALUES']) {
        emptyQuery += ' DEFAULT VALUES';
      } else if (this._dialect.supports['VALUES ()']) {
        emptyQuery += ' VALUES ()';
      }

      if (this._dialect.supports.returnValues && options.returning) {
        if (this._dialect.supports.returnValues.returning) {
          valueQuery += ' RETURNING *';
          emptyQuery += ' RETURNING *';
        } else if (this._dialect.supports.returnValues.output) {
          outputFragment = ' OUTPUT INSERTED.*'; //To capture output rows when there is a trigger on MSSQL DB

          if (modelAttributes && options.hasTrigger && this._dialect.supports.tmpTableTrigger) {
            let tmpColumns = '';
            let outputColumns = '';

            for (const modelKey in modelAttributes) {
              const attribute = modelAttributes[modelKey];

              if (!(attribute.type instanceof DataTypes.VIRTUAL)) {
                if (tmpColumns.length > 0) {
                  tmpColumns += ',';
                  outputColumns += ',';
                }

                tmpColumns += `${this.quoteIdentifier(attribute.field)} ${attribute.type.toSql()}`;
                outputColumns += `INSERTED.${this.quoteIdentifier(attribute.field)}`;
              }
            }

            tmpTable = `declare @tmp table (${tmpColumns});`;
            outputFragment = ` OUTPUT ${outputColumns} into @tmp`;
            const selectFromTmp = ';select * from @tmp';
            valueQuery += selectFromTmp;
            emptyQuery += selectFromTmp;
          }
        }
      }

      if (_.get(this, ['sequelize', 'options', 'dialectOptions', 'prependSearchPath']) || options.searchPath) {
        // Not currently supported with search path (requires output of multiple queries)
        options.bindParam = false;
      }

      if (this._dialect.supports.EXCEPTION && options.exception) {
        // Not currently supported with bind parameters (requires output of multiple queries)
        options.bindParam = false;
      }

      valueHash = Utils.removeNullValuesFromHash(valueHash, this.options.omitNull);

      for (const key in valueHash) {
        if (Object.prototype.hasOwnProperty.call(valueHash, key)) {
          const value = valueHash[key];
          fields.push(this.quoteIdentifier(key)); // SERIALS' can't be NULL in postgresql, use DEFAULT where supported

          if (modelAttributeMap && modelAttributeMap[key] && modelAttributeMap[key].autoIncrement === true && !value) {
            if (!this._dialect.supports.autoIncrement.defaultValue) {
              fields.splice(-1, 1);
            } else if (this._dialect.supports.DEFAULT) {
              values.push('DEFAULT');
            } else {
              values.push(this.escape(null));
            }
          } else {
            if (modelAttributeMap && modelAttributeMap[key] && modelAttributeMap[key].autoIncrement === true) {
              identityWrapperRequired = true;
            }

            if (value instanceof Utils.SequelizeMethod || options.bindParam === false) {
              values.push(this.escape(value, modelAttributeMap && modelAttributeMap[key] || undefined, {
                context: 'INSERT'
              }));
            } else {
              values.push(this.format(value, modelAttributeMap && modelAttributeMap[key] || undefined, {
                context: 'INSERT'
              }, bindParam));
            }
          }
        }
      }

      const replacements = {
        ignoreDuplicates: options.ignoreDuplicates ? this._dialect.supports.inserts.ignoreDuplicates : '',
        onConflictDoNothing: options.ignoreDuplicates ? this._dialect.supports.inserts.onConflictDoNothing : '',
        attributes: fields.join(','),
        output: outputFragment,
        values: values.join(','),
        tmpTable
      };
      valueQuery = `${tmpTable}INSERT${replacements.ignoreDuplicates} INTO ${quotedTable} (${replacements.attributes})${replacements.output} VALUES (${replacements.values})${replacements.onConflictDoNothing}${valueQuery}`;
      emptyQuery = `${tmpTable}INSERT${replacements.ignoreDuplicates} INTO ${quotedTable}${replacements.output}${replacements.onConflictDoNothing}${emptyQuery}`;

      if (this._dialect.supports.EXCEPTION && options.exception) {
        // Mostly for internal use, so we expect the user to know what he's doing!
        // pg_temp functions are private per connection, so we never risk this function interfering with another one.
        if (semver.gte(this.sequelize.options.databaseVersion, '9.2.0')) {
          // >= 9.2 - Use a UUID but prefix with 'func_' (numbers first not allowed)
          const delimiter = `$func_${uuidv4().replace(/-/g, '')}$`;
          options.exception = 'WHEN unique_violation THEN GET STACKED DIAGNOSTICS sequelize_caught_exception = PG_EXCEPTION_DETAIL;';
          valueQuery = `${`CREATE OR REPLACE FUNCTION pg_temp.testfunc(OUT response ${quotedTable}, OUT sequelize_caught_exception text) RETURNS RECORD AS ${delimiter}` + ' BEGIN '}${valueQuery} INTO response; EXCEPTION ${options.exception} END ${delimiter} LANGUAGE plpgsql; SELECT (testfunc.response).*, testfunc.sequelize_caught_exception FROM pg_temp.testfunc(); DROP FUNCTION IF EXISTS pg_temp.testfunc()`;
        } else {
          options.exception = 'WHEN unique_violation THEN NULL;';
          valueQuery = `CREATE OR REPLACE FUNCTION pg_temp.testfunc() RETURNS SETOF ${quotedTable} AS $body$ BEGIN RETURN QUERY ${valueQuery}; EXCEPTION ${options.exception} END; $body$ LANGUAGE plpgsql; SELECT * FROM pg_temp.testfunc(); DROP FUNCTION IF EXISTS pg_temp.testfunc();`;
        }
      }

      if (this._dialect.supports['ON DUPLICATE KEY'] && options.onDuplicate) {
        valueQuery += ` ON DUPLICATE KEY ${options.onDuplicate}`;
        emptyQuery += ` ON DUPLICATE KEY ${options.onDuplicate}`;
      }

      query = `${replacements.attributes.length ? valueQuery : emptyQuery};`;

      if (identityWrapperRequired && this._dialect.supports.autoIncrement.identityInsert) {
        query = `SET IDENTITY_INSERT ${quotedTable} ON; ${query} SET IDENTITY_INSERT ${quotedTable} OFF;`;
      } // Used by Postgres upsertQuery and calls to here with options.exception set to true


      const result = {
        query
      };

      if (options.bindParam !== false) {
        result.bind = bind;
      }

      return result;
    }
    /**
     * Returns an insert into command for multiple values.
     *
     * @param {string} tableName
     * @param {Object} fieldValueHashes
     * @param {Object} options
     * @param {Object} fieldMappedAttributes
     *
     * @private
     */

  }, {
    key: "bulkInsertQuery",
    value: function bulkInsertQuery(tableName, fieldValueHashes, options, fieldMappedAttributes) {
      options = options || {};
      fieldMappedAttributes = fieldMappedAttributes || {};
      const tuples = [];
      const serials = {};
      const allAttributes = [];
      let onDuplicateKeyUpdate = '';

      for (const fieldValueHash of fieldValueHashes) {
        _.forOwn(fieldValueHash, (value, key) => {
          if (!allAttributes.includes(key)) {
            allAttributes.push(key);
          }

          if (fieldMappedAttributes[key] && fieldMappedAttributes[key].autoIncrement === true) {
            serials[key] = true;
          }
        });
      }

      for (const fieldValueHash of fieldValueHashes) {
        const values = allAttributes.map(key => {
          if (this._dialect.supports.bulkDefault && serials[key] === true) {
            return fieldValueHash[key] || 'DEFAULT';
          }

          return this.escape(fieldValueHash[key], fieldMappedAttributes[key], {
            context: 'INSERT'
          });
        });
        tuples.push(`(${values.join(',')})`);
      }

      if (this._dialect.supports.inserts.updateOnDuplicate && options.updateOnDuplicate) {
        if (this._dialect.supports.inserts.updateOnDuplicate == ' ON CONFLICT DO UPDATE SET') {
          // postgres / sqlite
          // If no conflict target columns were specified, use the primary key names from options.upsertKeys
          const conflictKeys = options.upsertKeys.map(attr => this.quoteIdentifier(attr));
          const updateKeys = options.updateOnDuplicate.map(attr => `${this.quoteIdentifier(attr)}=EXCLUDED.${this.quoteIdentifier(attr)}`);
          onDuplicateKeyUpdate = ` ON CONFLICT (${conflictKeys.join(',')}) DO UPDATE SET ${updateKeys.join(',')}`;
        } else {
          // mysql / maria
          const valueKeys = options.updateOnDuplicate.map(attr => `${this.quoteIdentifier(attr)}=VALUES(${this.quoteIdentifier(attr)})`);
          onDuplicateKeyUpdate = `${this._dialect.supports.inserts.updateOnDuplicate} ${valueKeys.join(',')}`;
        }
      }

      const ignoreDuplicates = options.ignoreDuplicates ? this._dialect.supports.inserts.ignoreDuplicates : '';
      const attributes = allAttributes.map(attr => this.quoteIdentifier(attr)).join(',');
      const onConflictDoNothing = options.ignoreDuplicates ? this._dialect.supports.inserts.onConflictDoNothing : '';
      let returning = '';

      if (this._dialect.supports.returnValues && Array.isArray(options.returning)) {
        const fields = options.returning.map(field => this.quoteIdentifier(field)).join(',');
        returning += ` RETURNING ${fields}`;
      } else {
        returning += this._dialect.supports.returnValues && options.returning ? ' RETURNING *' : '';
      }

      return `INSERT${ignoreDuplicates} INTO ${this.quoteTable(tableName)} (${attributes}) VALUES ${tuples.join(',')}${onDuplicateKeyUpdate}${onConflictDoNothing}${returning};`;
    }
    /**
     * Returns an update query
     *
     * @param {string} tableName
     * @param {Object} attrValueHash
     * @param {Object} where A hash with conditions (e.g. {name: 'foo'}) OR an ID as integer
     * @param {Object} options
     * @param {Object} attributes
     *
     * @private
     */

  }, {
    key: "updateQuery",
    value: function updateQuery(tableName, attrValueHash, where, options, attributes) {
      options = options || {};

      _.defaults(options, this.options);

      attrValueHash = Utils.removeNullValuesFromHash(attrValueHash, options.omitNull, options);
      const values = [];
      const bind = [];
      const modelAttributeMap = {};
      let outputFragment = '';
      let tmpTable = ''; // tmpTable declaration for trigger

      let selectFromTmp = ''; // Select statement for trigger

      let suffix = '';

      if (_.get(this, ['sequelize', 'options', 'dialectOptions', 'prependSearchPath']) || options.searchPath) {
        // Not currently supported with search path (requires output of multiple queries)
        options.bindParam = false;
      }

      const bindParam = options.bindParam === undefined ? this.bindParam(bind) : options.bindParam;

      if (this._dialect.supports['LIMIT ON UPDATE'] && options.limit) {
        if (this.dialect !== 'mssql') {
          suffix = ` LIMIT ${this.escape(options.limit)} `;
        }
      }

      if (this._dialect.supports.returnValues) {
        if (this._dialect.supports.returnValues.output) {
          // we always need this for mssql
          outputFragment = ' OUTPUT INSERTED.*'; //To capture output rows when there is a trigger on MSSQL DB

          if (attributes && options.hasTrigger && this._dialect.supports.tmpTableTrigger) {
            let tmpColumns = '';
            let outputColumns = '';

            for (const modelKey in attributes) {
              const attribute = attributes[modelKey];

              if (!(attribute.type instanceof DataTypes.VIRTUAL)) {
                if (tmpColumns.length > 0) {
                  tmpColumns += ',';
                  outputColumns += ',';
                }

                tmpColumns += `${this.quoteIdentifier(attribute.field)} ${attribute.type.toSql()}`;
                outputColumns += `INSERTED.${this.quoteIdentifier(attribute.field)}`;
              }
            }

            tmpTable = `declare @tmp table (${tmpColumns}); `;
            outputFragment = ` OUTPUT ${outputColumns} into @tmp`;
            selectFromTmp = ';select * from @tmp';
            suffix += selectFromTmp;
          }
        } else if (this._dialect.supports.returnValues && options.returning) {
          // ensure that the return output is properly mapped to model fields.
          options.mapToModel = true;
          suffix += ' RETURNING *';
        }
      }

      if (attributes) {
        _.each(attributes, (attribute, key) => {
          modelAttributeMap[key] = attribute;

          if (attribute.field) {
            modelAttributeMap[attribute.field] = attribute;
          }
        });
      }

      for (const key in attrValueHash) {
        if (modelAttributeMap && modelAttributeMap[key] && modelAttributeMap[key].autoIncrement === true && !this._dialect.supports.autoIncrement.update) {
          // not allowed to update identity column
          continue;
        }

        const value = attrValueHash[key];

        if (value instanceof Utils.SequelizeMethod || options.bindParam === false) {
          values.push(`${this.quoteIdentifier(key)}=${this.escape(value, modelAttributeMap && modelAttributeMap[key] || undefined, {
            context: 'UPDATE'
          })}`);
        } else {
          values.push(`${this.quoteIdentifier(key)}=${this.format(value, modelAttributeMap && modelAttributeMap[key] || undefined, {
            context: 'UPDATE'
          }, bindParam)}`);
        }
      }

      const whereOptions = _.defaults({
        bindParam
      }, options);

      if (values.length === 0) {
        return '';
      }

      const query = `${tmpTable}UPDATE ${this.quoteTable(tableName)} SET ${values.join(',')}${outputFragment} ${this.whereQuery(where, whereOptions)}${suffix}`.trim(); // Used by Postgres upsertQuery and calls to here with options.exception set to true

      const result = {
        query
      };

      if (options.bindParam !== false) {
        result.bind = bind;
      }

      return result;
    }
    /**
     * Returns an update query using arithmetic operator
     *
     * @param {string} operator      String with the arithmetic operator (e.g. '+' or '-')
     * @param {string} tableName     Name of the table
     * @param {Object} attrValueHash A hash with attribute-value-pairs
     * @param {Object} where         A hash with conditions (e.g. {name: 'foo'}) OR an ID as integer
     * @param {Object} options
     * @param {Object} attributes
     */

  }, {
    key: "arithmeticQuery",
    value: function arithmeticQuery(operator, tableName, attrValueHash, where, options, attributes) {
      options = options || {};

      _.defaults(options, {
        returning: true
      });

      attrValueHash = Utils.removeNullValuesFromHash(attrValueHash, this.options.omitNull);
      const values = [];
      let outputFragment = '';
      let returningFragment = '';

      if (this._dialect.supports.returnValues && options.returning) {
        if (this._dialect.supports.returnValues.returning) {
          options.mapToModel = true;
          returningFragment = 'RETURNING *';
        } else if (this._dialect.supports.returnValues.output) {
          outputFragment = ' OUTPUT INSERTED.*';
        }
      }

      for (const key in attrValueHash) {
        const value = attrValueHash[key];
        values.push(`${this.quoteIdentifier(key)}=${this.quoteIdentifier(key)}${operator} ${this.escape(value)}`);
      }

      attributes = attributes || {};

      for (const key in attributes) {
        const value = attributes[key];
        values.push(`${this.quoteIdentifier(key)}=${this.escape(value)}`);
      }

      return `UPDATE ${this.quoteTable(tableName)} SET ${values.join(',')}${outputFragment} ${this.whereQuery(where)} ${returningFragment}`.trim();
    }
    /*
      Returns an add index query.
      Parameters:
        - tableName -> Name of an existing table, possibly with schema.
        - options:
          - type: UNIQUE|FULLTEXT|SPATIAL
          - name: The name of the index. Default is <table>_<attr1>_<attr2>
          - fields: An array of attributes as string or as hash.
                    If the attribute is a hash, it must have the following content:
                    - name: The name of the attribute/column
                    - length: An integer. Optional
                    - order: 'ASC' or 'DESC'. Optional
          - parser
          - using
          - operator
          - concurrently: Pass CONCURRENT so other operations run while the index is created
        - rawTablename, the name of the table, without schema. Used to create the name of the index
     @private
    */

  }, {
    key: "addIndexQuery",
    value: function addIndexQuery(tableName, attributes, options, rawTablename) {
      options = options || {};

      if (!Array.isArray(attributes)) {
        options = attributes;
        attributes = undefined;
      } else {
        options.fields = attributes;
      }

      options.prefix = options.prefix || rawTablename || tableName;

      if (options.prefix && typeof options.prefix === 'string') {
        options.prefix = options.prefix.replace(/\./g, '_');
        options.prefix = options.prefix.replace(/("|')/g, '');
      }

      const fieldsSql = options.fields.map(field => {
        if (typeof field === 'string') {
          return this.quoteIdentifier(field);
        }

        if (field instanceof Utils.SequelizeMethod) {
          return this.handleSequelizeMethod(field);
        }

        let result = '';

        if (field.attribute) {
          field.name = field.attribute;
        }

        if (!field.name) {
          throw new Error(`The following index field has no name: ${util.inspect(field)}`);
        }

        result += this.quoteIdentifier(field.name);

        if (this._dialect.supports.index.collate && field.collate) {
          result += ` COLLATE ${this.quoteIdentifier(field.collate)}`;
        }

        if (this._dialect.supports.index.length && field.length) {
          result += `(${field.length})`;
        }

        if (field.order) {
          result += ` ${field.order}`;
        }

        return result;
      });

      if (!options.name) {
        // Mostly for cases where addIndex is called directly by the user without an options object (for example in migrations)
        // All calls that go through sequelize should already have a name
        options = Utils.nameIndex(options, options.prefix);
      }

      options = Model._conformIndex(options);

      if (!this._dialect.supports.index.type) {
        delete options.type;
      }

      if (options.where) {
        options.where = this.whereQuery(options.where);
      }

      if (typeof tableName === 'string') {
        tableName = this.quoteIdentifiers(tableName);
      } else {
        tableName = this.quoteTable(tableName);
      }

      const concurrently = this._dialect.supports.index.concurrently && options.concurrently ? 'CONCURRENTLY' : undefined;
      let ind;

      if (this._dialect.supports.indexViaAlter) {
        ind = ['ALTER TABLE', tableName, concurrently, 'ADD'];
      } else {
        ind = ['CREATE'];
      }

      ind = ind.concat(options.unique ? 'UNIQUE' : '', options.type, 'INDEX', !this._dialect.supports.indexViaAlter ? concurrently : undefined, this.quoteIdentifiers(options.name), this._dialect.supports.index.using === 1 && options.using ? `USING ${options.using}` : '', !this._dialect.supports.indexViaAlter ? `ON ${tableName}` : undefined, this._dialect.supports.index.using === 2 && options.using ? `USING ${options.using}` : '', `(${fieldsSql.join(', ')}${options.operator ? ` ${options.operator}` : ''})`, this._dialect.supports.index.parser && options.parser ? `WITH PARSER ${options.parser}` : undefined, this._dialect.supports.index.where && options.where ? options.where : undefined);
      return _.compact(ind).join(' ');
    }
  }, {
    key: "addConstraintQuery",
    value: function addConstraintQuery(tableName, options) {
      options = options || {};
      const constraintSnippet = this.getConstraintSnippet(tableName, options);

      if (typeof tableName === 'string') {
        tableName = this.quoteIdentifiers(tableName);
      } else {
        tableName = this.quoteTable(tableName);
      }

      return `ALTER TABLE ${tableName} ADD ${constraintSnippet};`;
    }
  }, {
    key: "getConstraintSnippet",
    value: function getConstraintSnippet(tableName, options) {
      let constraintSnippet, constraintName;
      const fieldsSql = options.fields.map(field => {
        if (typeof field === 'string') {
          return this.quoteIdentifier(field);
        }

        if (field instanceof Utils.SequelizeMethod) {
          return this.handleSequelizeMethod(field);
        }

        if (field.attribute) {
          field.name = field.attribute;
        }

        if (!field.name) {
          throw new Error(`The following index field has no name: ${field}`);
        }

        return this.quoteIdentifier(field.name);
      });
      const fieldsSqlQuotedString = fieldsSql.join(', ');
      const fieldsSqlString = fieldsSql.join('_');

      switch (options.type.toUpperCase()) {
        case 'UNIQUE':
          constraintName = this.quoteIdentifier(options.name || `${tableName}_${fieldsSqlString}_uk`);
          constraintSnippet = `CONSTRAINT ${constraintName} UNIQUE (${fieldsSqlQuotedString})`;
          break;

        case 'CHECK':
          options.where = this.whereItemsQuery(options.where);
          constraintName = this.quoteIdentifier(options.name || `${tableName}_${fieldsSqlString}_ck`);
          constraintSnippet = `CONSTRAINT ${constraintName} CHECK (${options.where})`;
          break;

        case 'DEFAULT':
          if (options.defaultValue === undefined) {
            throw new Error('Default value must be specifed for DEFAULT CONSTRAINT');
          }

          if (this._dialect.name !== 'mssql') {
            throw new Error('Default constraints are supported only for MSSQL dialect.');
          }

          constraintName = this.quoteIdentifier(options.name || `${tableName}_${fieldsSqlString}_df`);
          constraintSnippet = `CONSTRAINT ${constraintName} DEFAULT (${this.escape(options.defaultValue)}) FOR ${fieldsSql[0]}`;
          break;

        case 'PRIMARY KEY':
          constraintName = this.quoteIdentifier(options.name || `${tableName}_${fieldsSqlString}_pk`);
          constraintSnippet = `CONSTRAINT ${constraintName} PRIMARY KEY (${fieldsSqlQuotedString})`;
          break;

        case 'FOREIGN KEY':
          const references = options.references;

          if (!references || !references.table || !references.field) {
            throw new Error('references object with table and field must be specified');
          }

          constraintName = this.quoteIdentifier(options.name || `${tableName}_${fieldsSqlString}_${references.table}_fk`);
          const referencesSnippet = `${this.quoteTable(references.table)} (${this.quoteIdentifier(references.field)})`;
          constraintSnippet = `CONSTRAINT ${constraintName} `;
          constraintSnippet += `FOREIGN KEY (${fieldsSqlQuotedString}) REFERENCES ${referencesSnippet}`;

          if (options.onUpdate) {
            constraintSnippet += ` ON UPDATE ${options.onUpdate.toUpperCase()}`;
          }

          if (options.onDelete) {
            constraintSnippet += ` ON DELETE ${options.onDelete.toUpperCase()}`;
          }

          break;

        default:
          throw new Error(`${options.type} is invalid.`);
      }

      return constraintSnippet;
    }
  }, {
    key: "removeConstraintQuery",
    value: function removeConstraintQuery(tableName, constraintName) {
      if (typeof tableName === 'string') {
        tableName = this.quoteIdentifiers(tableName);
      } else {
        tableName = this.quoteTable(tableName);
      }

      return `ALTER TABLE ${tableName} DROP CONSTRAINT ${this.quoteIdentifiers(constraintName)}`;
    }
    /*
      Quote an object based on its type. This is a more general version of quoteIdentifiers
      Strings: should proxy to quoteIdentifiers
      Arrays:
        * Expects array in the form: [<model> (optional), <model> (optional),... String, String (optional)]
          Each <model> can be a model, or an object {model: Model, as: String}, matching include, or an
          association object, or the name of an association.
        * Zero or more models can be included in the array and are used to trace a path through the tree of
          included nested associations. This produces the correct table name for the ORDER BY/GROUP BY SQL
          and quotes it.
        * If a single string is appended to end of array, it is quoted.
          If two strings appended, the 1st string is quoted, the 2nd string unquoted.
      Objects:
        * If raw is set, that value should be returned verbatim, without quoting
        * If fn is set, the string should start with the value of fn, starting paren, followed by
          the values of cols (which is assumed to be an array), quoted and joined with ', ',
          unless they are themselves objects
        * If direction is set, should be prepended
        Currently this function is only used for ordering / grouping columns and Sequelize.col(), but it could
      potentially also be used for other places where we want to be able to call SQL functions (e.g. as default values)
     @private
    */

  }, {
    key: "quote",
    value: function quote(collection, parent, connector) {
      // init
      const validOrderOptions = ['ASC', 'DESC', 'ASC NULLS LAST', 'DESC NULLS LAST', 'ASC NULLS FIRST', 'DESC NULLS FIRST', 'NULLS FIRST', 'NULLS LAST']; // default

      connector = connector || '.'; // just quote as identifiers if string

      if (typeof collection === 'string') {
        return this.quoteIdentifiers(collection);
      }

      if (Array.isArray(collection)) {
        // iterate through the collection and mutate objects into associations
        collection.forEach((item, index) => {
          const previous = collection[index - 1];
          let previousAssociation;
          let previousModel; // set the previous as the parent when previous is undefined or the target of the association

          if (!previous && parent !== undefined) {
            previousModel = parent;
          } else if (previous && previous instanceof Association) {
            previousAssociation = previous;
            previousModel = previous.target;
          } // if the previous item is a model, then attempt getting an association


          if (previousModel && previousModel.prototype instanceof Model) {
            let model;
            let as;

            if (typeof item === 'function' && item.prototype instanceof Model) {
              // set
              model = item;
            } else if (_.isPlainObject(item) && item.model && item.model.prototype instanceof Model) {
              // set
              model = item.model;
              as = item.as;
            }

            if (model) {
              // set the as to either the through name or the model name
              if (!as && previousAssociation && previousAssociation instanceof Association && previousAssociation.through && previousAssociation.through.model === model) {
                // get from previous association
                item = new Association(previousModel, model, {
                  as: model.name
                });
              } else {
                // get association from previous model
                item = previousModel.getAssociationForAlias(model, as); // attempt to use the model name if the item is still null

                if (!item) {
                  item = previousModel.getAssociationForAlias(model, model.name);
                }
              } // make sure we have an association


              if (!(item instanceof Association)) {
                throw new Error(util.format('Unable to find a valid association for model, \'%s\'', model.name));
              }
            }
          }

          if (typeof item === 'string') {
            // get order index
            const orderIndex = validOrderOptions.indexOf(item.toUpperCase()); // see if this is an order

            if (index > 0 && orderIndex !== -1) {
              item = this.sequelize.literal(` ${validOrderOptions[orderIndex]}`);
            } else if (previousModel && previousModel.prototype instanceof Model) {
              // only go down this path if we have preivous model and check only once
              if (previousModel.associations !== undefined && previousModel.associations[item]) {
                // convert the item to an association
                item = previousModel.associations[item];
              } else if (previousModel.rawAttributes !== undefined && previousModel.rawAttributes[item] && item !== previousModel.rawAttributes[item].field) {
                // convert the item attribute from its alias
                item = previousModel.rawAttributes[item].field;
              } else if (item.includes('.') && previousModel.rawAttributes !== undefined) {
                const itemSplit = item.split('.');

                if (previousModel.rawAttributes[itemSplit[0]].type instanceof DataTypes.JSON) {
                  // just quote identifiers for now
                  const identifier = this.quoteIdentifiers(`${previousModel.name}.${previousModel.rawAttributes[itemSplit[0]].field}`); // get path

                  const path = itemSplit.slice(1); // extract path

                  item = this.jsonPathExtractionQuery(identifier, path); // literal because we don't want to append the model name when string

                  item = this.sequelize.literal(item);
                }
              }
            }
          }

          collection[index] = item;
        }, this); // loop through array, adding table names of models to quoted

        const collectionLength = collection.length;
        const tableNames = [];
        let item;
        let i = 0;

        for (i = 0; i < collectionLength - 1; i++) {
          item = collection[i];

          if (typeof item === 'string' || item._modelAttribute || item instanceof Utils.SequelizeMethod) {
            break;
          } else if (item instanceof Association) {
            tableNames[i] = item.as;
          }
        } // start building sql


        let sql = '';

        if (i > 0) {
          sql += `${this.quoteIdentifier(tableNames.join(connector))}.`;
        } else if (typeof collection[0] === 'string' && parent) {
          sql += `${this.quoteIdentifier(parent.name)}.`;
        } // loop through everything past i and append to the sql


        collection.slice(i).forEach(collectionItem => {
          sql += this.quote(collectionItem, parent, connector);
        }, this);
        return sql;
      }

      if (collection._modelAttribute) {
        return `${this.quoteTable(collection.Model.name)}.${this.quoteIdentifier(collection.fieldName)}`;
      }

      if (collection instanceof Utils.SequelizeMethod) {
        return this.handleSequelizeMethod(collection);
      }

      if (_.isPlainObject(collection) && collection.raw) {
        // simple objects with raw is no longer supported
        throw new Error('The `{raw: "..."}` syntax is no longer supported.  Use `sequelize.literal` instead.');
      }

      throw new Error(`Unknown structure passed to order / group: ${util.inspect(collection)}`);
    }
    /**
     * Split a list of identifiers by "." and quote each part
     *
     * @param {string} identifier
     * @param {boolean} force
     *
     * @returns {string}
     */

  }, {
    key: "quoteIdentifier",
    value: function quoteIdentifier(identifier, force) {
      return QuoteHelper.quoteIdentifier(this.dialect, identifier, {
        force,
        quoteIdentifiers: this.options.quoteIdentifiers
      });
    }
  }, {
    key: "quoteIdentifiers",
    value: function quoteIdentifiers(identifiers) {
      if (identifiers.includes('.')) {
        identifiers = identifiers.split('.');
        const head = identifiers.slice(0, identifiers.length - 1).join('->');
        const tail = identifiers[identifiers.length - 1];
        return `${this.quoteIdentifier(head)}.${this.quoteIdentifier(tail)}`;
      }

      return this.quoteIdentifier(identifiers);
    }
  }, {
    key: "quoteAttribute",
    value: function quoteAttribute(attribute, model) {
      if (model && attribute in model.rawAttributes) {
        return this.quoteIdentifier(attribute);
      }

      return this.quoteIdentifiers(attribute);
    }
    /**
     * Quote table name with optional alias and schema attribution
     *
     * @param {string|Object}  param table string or object
     * @param {string|boolean} alias alias name
     *
     * @returns {string}
     */

  }, {
    key: "quoteTable",
    value: function quoteTable(param, alias) {
      let table = '';

      if (alias === true) {
        alias = param.as || param.name || param;
      }

      if (_.isObject(param)) {
        if (this._dialect.supports.schemas) {
          if (param.schema) {
            table += `${this.quoteIdentifier(param.schema)}.`;
          }

          table += this.quoteIdentifier(param.tableName);
        } else {
          if (param.schema) {
            table += param.schema + (param.delimiter || '.');
          }

          table += param.tableName;
          table = this.quoteIdentifier(table);
        }
      } else {
        table = this.quoteIdentifier(param);
      }

      if (alias) {
        table += ` AS ${this.quoteIdentifier(alias)}`;
      }

      return table;
    }
    /*
      Escape a value (e.g. a string, number or date)
      @private
    */

  }, {
    key: "escape",
    value: function escape(value, field, options) {
      options = options || {};

      if (value !== null && value !== undefined) {
        if (value instanceof Utils.SequelizeMethod) {
          return this.handleSequelizeMethod(value);
        }

        if (field && field.type) {
          this.validate(value, field, options);

          if (field.type.stringify) {
            // Users shouldn't have to worry about these args - just give them a function that takes a single arg
            const simpleEscape = escVal => SqlString.escape(escVal, this.options.timezone, this.dialect);

            value = field.type.stringify(value, {
              escape: simpleEscape,
              field,
              timezone: this.options.timezone,
              operation: options.operation
            });

            if (field.type.escape === false) {
              // The data-type already did the required escaping
              return value;
            }
          }
        }
      }

      return SqlString.escape(value, this.options.timezone, this.dialect);
    }
  }, {
    key: "bindParam",
    value: function bindParam(bind) {
      return value => {
        bind.push(value);
        return `$${bind.length}`;
      };
    }
    /*
      Returns a bind parameter representation of a value (e.g. a string, number or date)
      @private
    */

  }, {
    key: "format",
    value: function format(value, field, options, bindParam) {
      options = options || {};

      if (value !== null && value !== undefined) {
        if (value instanceof Utils.SequelizeMethod) {
          throw new Error('Cannot pass SequelizeMethod as a bind parameter - use escape instead');
        }

        if (field && field.type) {
          this.validate(value, field, options);

          if (field.type.bindParam) {
            return field.type.bindParam(value, {
              escape: _.identity,
              field,
              timezone: this.options.timezone,
              operation: options.operation,
              bindParam
            });
          }
        }
      }

      return bindParam(value);
    }
    /*
      Validate a value against a field specification
      @private
    */

  }, {
    key: "validate",
    value: function validate(value, field, options) {
      if (this.typeValidation && field.type.validate && value) {
        try {
          if (options.isList && Array.isArray(value)) {
            for (const item of value) {
              field.type.validate(item, options);
            }
          } else {
            field.type.validate(value, options);
          }
        } catch (error) {
          if (error instanceof sequelizeError.ValidationError) {
            error.errors.push(new sequelizeError.ValidationErrorItem(error.message, 'Validation error', field.fieldName, value, null, `${field.type.key} validator`));
          }

          throw error;
        }
      }
    }
  }, {
    key: "isIdentifierQuoted",
    value: function isIdentifierQuoted(identifier) {
      return QuoteHelper.isIdentifierQuoted(identifier);
    }
    /**
     * Generates an SQL query that extract JSON property of given path.
     *
     * @param   {string}               column  The JSON column
     * @param   {string|Array<string>} [path]  The path to extract (optional)
     * @returns {string}                       The generated sql query
     * @private
     */

  }, {
    key: "jsonPathExtractionQuery",
    value: function jsonPathExtractionQuery(column, path) {
      let paths = _.toPath(path);

      let pathStr;
      const quotedColumn = this.isIdentifierQuoted(column) ? column : this.quoteIdentifier(column);

      switch (this.dialect) {
        case 'mysql':
        case 'mariadb':
        case 'sqlite':
          /**
           * Non digit sub paths need to be quoted as ECMAScript identifiers
           * https://bugs.mysql.com/bug.php?id=81896
           */
          if (this.dialect === 'mysql') {
            paths = paths.map(subPath => {
              return /\D/.test(subPath) ? Utils.addTicks(subPath, '"') : subPath;
            });
          }

          pathStr = this.escape(['$'].concat(paths).join('.').replace(/\.(\d+)(?:(?=\.)|$)/g, (__, digit) => `[${digit}]`));

          if (this.dialect === 'sqlite') {
            return `json_extract(${quotedColumn},${pathStr})`;
          }

          return `json_unquote(json_extract(${quotedColumn},${pathStr}))`;

        case 'postgres':
          pathStr = this.escape(`{${paths.join(',')}}`);
          return `(${quotedColumn}#>>${pathStr})`;

        default:
          throw new Error(`Unsupported ${this.dialect} for JSON operations`);
      }
    }
    /*
      Returns a query for selecting elements in the table <tableName>.
      Options:
        - attributes -> An array of attributes (e.g. ['name', 'birthday']). Default: *
        - where -> A hash with conditions (e.g. {name: 'foo'})
                   OR an ID as integer
        - order -> e.g. 'id DESC'
        - group
        - limit -> The maximum count you want to get.
        - offset -> An offset value to start from. Only useable with limit!
     @private
    */

  }, {
    key: "selectQuery",
    value: function selectQuery(tableName, options, model) {
      options = options || {};
      const limit = options.limit;
      const mainQueryItems = [];
      const subQueryItems = [];
      const subQuery = options.subQuery === undefined ? limit && options.hasMultiAssociation : options.subQuery;
      const attributes = {
        main: options.attributes && options.attributes.slice(),
        subQuery: null
      };
      const mainTable = {
        name: tableName,
        quotedName: null,
        as: null,
        model
      };
      const topLevelInfo = {
        names: mainTable,
        options,
        subQuery
      };
      let mainJoinQueries = [];
      let subJoinQueries = [];
      let query; // Aliases can be passed through subqueries and we don't want to reset them

      if (this.options.minifyAliases && !options.aliasesMapping) {
        options.aliasesMapping = new Map();
        options.aliasesByTable = {};
      } // resolve table name options


      if (options.tableAs) {
        mainTable.as = this.quoteIdentifier(options.tableAs);
      } else if (!Array.isArray(mainTable.name) && mainTable.model) {
        mainTable.as = this.quoteIdentifier(mainTable.model.name);
      }

      mainTable.quotedName = !Array.isArray(mainTable.name) ? this.quoteTable(mainTable.name) : tableName.map(t => {
        return Array.isArray(t) ? this.quoteTable(t[0], t[1]) : this.quoteTable(t, true);
      }).join(', ');

      if (subQuery && attributes.main) {
        for (const keyAtt of mainTable.model.primaryKeyAttributes) {
          // Check if mainAttributes contain the primary key of the model either as a field or an aliased field
          if (!attributes.main.some(attr => keyAtt === attr || keyAtt === attr[0] || keyAtt === attr[1])) {
            attributes.main.push(mainTable.model.rawAttributes[keyAtt].field ? [keyAtt, mainTable.model.rawAttributes[keyAtt].field] : keyAtt);
          }
        }
      }

      attributes.main = this.escapeAttributes(attributes.main, options, mainTable.as);
      attributes.main = attributes.main || (options.include ? [`${mainTable.as}.*`] : ['*']); // If subquery, we add the mainAttributes to the subQuery and set the mainAttributes to select * from subquery

      if (subQuery || options.groupedLimit) {
        // We need primary keys
        attributes.subQuery = attributes.main;
        attributes.main = [`${mainTable.as || mainTable.quotedName}.*`];
      }

      if (options.include) {
        for (const include of options.include) {
          if (include.separate) {
            continue;
          }

          const joinQueries = this.generateInclude(include, {
            externalAs: mainTable.as,
            internalAs: mainTable.as
          }, topLevelInfo);
          subJoinQueries = subJoinQueries.concat(joinQueries.subQuery);
          mainJoinQueries = mainJoinQueries.concat(joinQueries.mainQuery);

          if (joinQueries.attributes.main.length > 0) {
            attributes.main = _.uniq(attributes.main.concat(joinQueries.attributes.main));
          }

          if (joinQueries.attributes.subQuery.length > 0) {
            attributes.subQuery = _.uniq(attributes.subQuery.concat(joinQueries.attributes.subQuery));
          }
        }
      }

      if (subQuery) {
        subQueryItems.push(this.selectFromTableFragment(options, mainTable.model, attributes.subQuery, mainTable.quotedName, mainTable.as));
        subQueryItems.push(subJoinQueries.join(''));
      } else {
        if (options.groupedLimit) {
          if (!mainTable.as) {
            mainTable.as = mainTable.quotedName;
          }

          const where = Object.assign({}, options.where);
          let groupedLimitOrder,
              whereKey,
              include,
              groupedTableName = mainTable.as;

          if (typeof options.groupedLimit.on === 'string') {
            whereKey = options.groupedLimit.on;
          } else if (options.groupedLimit.on instanceof HasMany) {
            whereKey = options.groupedLimit.on.foreignKeyField;
          }

          if (options.groupedLimit.on instanceof BelongsToMany) {
            // BTM includes needs to join the through table on to check ID
            groupedTableName = options.groupedLimit.on.manyFromSource.as;

            const groupedLimitOptions = Model._validateIncludedElements({
              include: [{
                association: options.groupedLimit.on.manyFromSource,
                duplicating: false,
                // The UNION'ed query may contain duplicates, but each sub-query cannot
                required: true,
                where: Object.assign({
                  [Op.placeholder]: true
                }, options.groupedLimit.through && options.groupedLimit.through.where)
              }],
              model
            }); // Make sure attributes from the join table are mapped back to models


            options.hasJoin = true;
            options.hasMultiAssociation = true;
            options.includeMap = Object.assign(groupedLimitOptions.includeMap, options.includeMap);
            options.includeNames = groupedLimitOptions.includeNames.concat(options.includeNames || []);
            include = groupedLimitOptions.include;

            if (Array.isArray(options.order)) {
              // We need to make sure the order by attributes are available to the parent query
              options.order.forEach((order, i) => {
                if (Array.isArray(order)) {
                  order = order[0];
                }

                let alias = `subquery_order_${i}`;
                options.attributes.push([order, alias]); // We don't want to prepend model name when we alias the attributes, so quote them here

                alias = this.sequelize.literal(this.quote(alias));

                if (Array.isArray(options.order[i])) {
                  options.order[i][0] = alias;
                } else {
                  options.order[i] = alias;
                }
              });
              groupedLimitOrder = options.order;
            }
          } else {
            // Ordering is handled by the subqueries, so ordering the UNION'ed result is not needed
            groupedLimitOrder = options.order;
            delete options.order;
            where[Op.placeholder] = true;
          } // Caching the base query and splicing the where part into it is consistently > twice
          // as fast than generating from scratch each time for values.length >= 5


          const baseQuery = `SELECT * FROM (${this.selectQuery(tableName, {
            attributes: options.attributes,
            offset: options.offset,
            limit: options.groupedLimit.limit,
            order: groupedLimitOrder,
            aliasesMapping: options.aliasesMapping,
            aliasesByTable: options.aliasesByTable,
            where,
            include,
            model
          }, model).replace(/;$/, '')}) AS sub`; // Every derived table must have its own alias

          const placeHolder = this.whereItemQuery(Op.placeholder, true, {
            model
          });
          const splicePos = baseQuery.indexOf(placeHolder);
          mainQueryItems.push(this.selectFromTableFragment(options, mainTable.model, attributes.main, `(${options.groupedLimit.values.map(value => {
            let groupWhere;

            if (whereKey) {
              groupWhere = {
                [whereKey]: value
              };
            }

            if (include) {
              groupWhere = {
                [options.groupedLimit.on.foreignIdentifierField]: value
              };
            }

            return Utils.spliceStr(baseQuery, splicePos, placeHolder.length, this.getWhereConditions(groupWhere, groupedTableName));
          }).join(this._dialect.supports['UNION ALL'] ? ' UNION ALL ' : ' UNION ')})`, mainTable.as));
        } else {
          mainQueryItems.push(this.selectFromTableFragment(options, mainTable.model, attributes.main, mainTable.quotedName, mainTable.as));
        }

        mainQueryItems.push(mainJoinQueries.join(''));
      } // Add WHERE to sub or main query


      if (Object.prototype.hasOwnProperty.call(options, 'where') && !options.groupedLimit) {
        options.where = this.getWhereConditions(options.where, mainTable.as || tableName, model, options);

        if (options.where) {
          if (subQuery) {
            subQueryItems.push(` WHERE ${options.where}`);
          } else {
            mainQueryItems.push(` WHERE ${options.where}`); // Walk the main query to update all selects

            mainQueryItems.forEach((value, key) => {
              if (value.startsWith('SELECT')) {
                mainQueryItems[key] = this.selectFromTableFragment(options, model, attributes.main, mainTable.quotedName, mainTable.as, options.where);
              }
            });
          }
        }
      } // Add GROUP BY to sub or main query


      if (options.group) {
        options.group = Array.isArray(options.group) ? options.group.map(t => this.aliasGrouping(t, model, mainTable.as, options)).join(', ') : this.aliasGrouping(options.group, model, mainTable.as, options);

        if (subQuery) {
          subQueryItems.push(` GROUP BY ${options.group}`);
        } else {
          mainQueryItems.push(` GROUP BY ${options.group}`);
        }
      } // Add HAVING to sub or main query


      if (Object.prototype.hasOwnProperty.call(options, 'having')) {
        options.having = this.getWhereConditions(options.having, tableName, model, options, false);

        if (options.having) {
          if (subQuery) {
            subQueryItems.push(` HAVING ${options.having}`);
          } else {
            mainQueryItems.push(` HAVING ${options.having}`);
          }
        }
      } // Add ORDER to sub or main query


      if (options.order) {
        const orders = this.getQueryOrders(options, model, subQuery);

        if (orders.mainQueryOrder.length) {
          mainQueryItems.push(` ORDER BY ${orders.mainQueryOrder.join(', ')}`);
        }

        if (orders.subQueryOrder.length) {
          subQueryItems.push(` ORDER BY ${orders.subQueryOrder.join(', ')}`);
        }
      } // Add LIMIT, OFFSET to sub or main query


      const limitOrder = this.addLimitAndOffset(options, mainTable.model);

      if (limitOrder && !options.groupedLimit) {
        if (subQuery) {
          subQueryItems.push(limitOrder);
        } else {
          mainQueryItems.push(limitOrder);
        }
      }

      if (subQuery) {
        query = `SELECT ${attributes.main.join(', ')} FROM (${subQueryItems.join('')}) AS ${mainTable.as}${mainJoinQueries.join('')}${mainQueryItems.join('')}`;
      } else {
        query = mainQueryItems.join('');
      }

      if (options.lock && this._dialect.supports.lock) {
        let lock = options.lock;

        if (typeof options.lock === 'object') {
          lock = options.lock.level;
        }

        if (this._dialect.supports.lockKey && (lock === 'KEY SHARE' || lock === 'NO KEY UPDATE')) {
          query += ` FOR ${lock}`;
        } else if (lock === 'SHARE') {
          query += ` ${this._dialect.supports.forShare}`;
        } else {
          query += ' FOR UPDATE';
        }

        if (this._dialect.supports.lockOf && options.lock.of && options.lock.of.prototype instanceof Model) {
          query += ` OF ${this.quoteTable(options.lock.of.name)}`;
        }

        if (this._dialect.supports.skipLocked && options.skipLocked) {
          query += ' SKIP LOCKED';
        }
      }

      return `${query};`;
    }
  }, {
    key: "aliasGrouping",
    value: function aliasGrouping(field, model, tableName, options) {
      const src = Array.isArray(field) ? field[0] : field;
      return this.quote(this._getAliasForField(tableName, src, options) || src, model);
    }
  }, {
    key: "escapeAttributes",
    value: function escapeAttributes(attributes, options, mainTableAs) {
      return attributes && attributes.map(attr => {
        let addTable = true;

        if (attr instanceof Utils.SequelizeMethod) {
          return this.handleSequelizeMethod(attr);
        }

        if (Array.isArray(attr)) {
          if (attr.length !== 2) {
            throw new Error(`${JSON.stringify(attr)} is not a valid attribute definition. Please use the following format: ['attribute definition', 'alias']`);
          }

          attr = attr.slice();

          if (attr[0] instanceof Utils.SequelizeMethod) {
            attr[0] = this.handleSequelizeMethod(attr[0]);
            addTable = false;
          } else if (!attr[0].includes('(') && !attr[0].includes(')')) {
            attr[0] = this.quoteIdentifier(attr[0]);
          } else {
            deprecations.noRawAttributes();
          }

          let alias = attr[1];

          if (this.options.minifyAliases) {
            alias = this._getMinifiedAlias(alias, mainTableAs, options);
          }

          attr = [attr[0], this.quoteIdentifier(alias)].join(' AS ');
        } else {
          attr = !attr.includes(Utils.TICK_CHAR) && !attr.includes('"') ? this.quoteAttribute(attr, options.model) : this.escape(attr);
        }

        if (!_.isEmpty(options.include) && !attr.includes('.') && addTable) {
          attr = `${mainTableAs}.${attr}`;
        }

        return attr;
      });
    }
  }, {
    key: "generateInclude",
    value: function generateInclude(include, parentTableName, topLevelInfo) {
      const joinQueries = {
        mainQuery: [],
        subQuery: []
      };
      const mainChildIncludes = [];
      const subChildIncludes = [];
      let requiredMismatch = false;
      const includeAs = {
        internalAs: include.as,
        externalAs: include.as
      };
      const attributes = {
        main: [],
        subQuery: []
      };
      let joinQuery;
      topLevelInfo.options.keysEscaped = true;

      if (topLevelInfo.names.name !== parentTableName.externalAs && topLevelInfo.names.as !== parentTableName.externalAs) {
        includeAs.internalAs = `${parentTableName.internalAs}->${include.as}`;
        includeAs.externalAs = `${parentTableName.externalAs}.${include.as}`;
      } // includeIgnoreAttributes is used by aggregate functions


      if (topLevelInfo.options.includeIgnoreAttributes !== false) {
        include.model._expandAttributes(include);

        Utils.mapFinderOptions(include, include.model);
        const includeAttributes = include.attributes.map(attr => {
          let attrAs = attr;
          let verbatim = false;

          if (Array.isArray(attr) && attr.length === 2) {
            if (attr[0] instanceof Utils.SequelizeMethod && (attr[0] instanceof Utils.Literal || attr[0] instanceof Utils.Cast || attr[0] instanceof Utils.Fn)) {
              verbatim = true;
            }

            attr = attr.map(attr => attr instanceof Utils.SequelizeMethod ? this.handleSequelizeMethod(attr) : attr);
            attrAs = attr[1];
            attr = attr[0];
          }

          if (attr instanceof Utils.Literal) {
            return attr.val; // We trust the user to rename the field correctly
          }

          if (attr instanceof Utils.Cast || attr instanceof Utils.Fn) {
            throw new Error('Tried to select attributes using Sequelize.cast or Sequelize.fn without specifying an alias for the result, during eager loading. ' + 'This means the attribute will not be added to the returned instance');
          }

          let prefix;

          if (verbatim === true) {
            prefix = attr;
          } else if (/#>>|->>/.test(attr)) {
            prefix = `(${this.quoteIdentifier(includeAs.internalAs)}.${attr.replace(/\(|\)/g, '')})`;
          } else if (/json_extract\(/.test(attr)) {
            prefix = attr.replace(/json_extract\(/i, `json_extract(${this.quoteIdentifier(includeAs.internalAs)}.`);
          } else {
            prefix = `${this.quoteIdentifier(includeAs.internalAs)}.${this.quoteIdentifier(attr)}`;
          }

          let alias = `${includeAs.externalAs}.${attrAs}`;

          if (this.options.minifyAliases) {
            alias = this._getMinifiedAlias(alias, includeAs.internalAs, topLevelInfo.options);
          }

          return `${prefix} AS ${this.quoteIdentifier(alias, true)}`;
        });

        if (include.subQuery && topLevelInfo.subQuery) {
          for (const attr of includeAttributes) {
            attributes.subQuery.push(attr);
          }
        } else {
          for (const attr of includeAttributes) {
            attributes.main.push(attr);
          }
        }
      } //through


      if (include.through) {
        joinQuery = this.generateThroughJoin(include, includeAs, parentTableName.internalAs, topLevelInfo);
      } else {
        this._generateSubQueryFilter(include, includeAs, topLevelInfo);

        joinQuery = this.generateJoin(include, topLevelInfo);
      } // handle possible new attributes created in join


      if (joinQuery.attributes.main.length > 0) {
        attributes.main = attributes.main.concat(joinQuery.attributes.main);
      }

      if (joinQuery.attributes.subQuery.length > 0) {
        attributes.subQuery = attributes.subQuery.concat(joinQuery.attributes.subQuery);
      }

      if (include.include) {
        for (const childInclude of include.include) {
          if (childInclude.separate || childInclude._pseudo) {
            continue;
          }

          const childJoinQueries = this.generateInclude(childInclude, includeAs, topLevelInfo);

          if (include.required === false && childInclude.required === true) {
            requiredMismatch = true;
          } // if the child is a sub query we just give it to the


          if (childInclude.subQuery && topLevelInfo.subQuery) {
            subChildIncludes.push(childJoinQueries.subQuery);
          }

          if (childJoinQueries.mainQuery) {
            mainChildIncludes.push(childJoinQueries.mainQuery);
          }

          if (childJoinQueries.attributes.main.length > 0) {
            attributes.main = attributes.main.concat(childJoinQueries.attributes.main);
          }

          if (childJoinQueries.attributes.subQuery.length > 0) {
            attributes.subQuery = attributes.subQuery.concat(childJoinQueries.attributes.subQuery);
          }
        }
      }

      if (include.subQuery && topLevelInfo.subQuery) {
        if (requiredMismatch && subChildIncludes.length > 0) {
          joinQueries.subQuery.push(` ${joinQuery.join} ( ${joinQuery.body}${subChildIncludes.join('')} ) ON ${joinQuery.condition}`);
        } else {
          joinQueries.subQuery.push(` ${joinQuery.join} ${joinQuery.body} ON ${joinQuery.condition}`);

          if (subChildIncludes.length > 0) {
            joinQueries.subQuery.push(subChildIncludes.join(''));
          }
        }

        joinQueries.mainQuery.push(mainChildIncludes.join(''));
      } else {
        if (requiredMismatch && mainChildIncludes.length > 0) {
          joinQueries.mainQuery.push(` ${joinQuery.join} ( ${joinQuery.body}${mainChildIncludes.join('')} ) ON ${joinQuery.condition}`);
        } else {
          joinQueries.mainQuery.push(` ${joinQuery.join} ${joinQuery.body} ON ${joinQuery.condition}`);

          if (mainChildIncludes.length > 0) {
            joinQueries.mainQuery.push(mainChildIncludes.join(''));
          }
        }

        joinQueries.subQuery.push(subChildIncludes.join(''));
      }

      return {
        mainQuery: joinQueries.mainQuery.join(''),
        subQuery: joinQueries.subQuery.join(''),
        attributes
      };
    }
  }, {
    key: "_getMinifiedAlias",
    value: function _getMinifiedAlias(alias, tableName, options) {
      // We do not want to re-alias in case of a subquery
      if (options.aliasesByTable[`${tableName}${alias}`]) {
        return options.aliasesByTable[`${tableName}${alias}`];
      } // Do not alias custom suquery_orders


      if (alias.match(/subquery_order_[0-9]/)) {
        return alias;
      }

      const minifiedAlias = `_${options.aliasesMapping.size}`;
      options.aliasesMapping.set(minifiedAlias, alias);
      options.aliasesByTable[`${tableName}${alias}`] = minifiedAlias;
      return minifiedAlias;
    }
  }, {
    key: "_getAliasForField",
    value: function _getAliasForField(tableName, field, options) {
      if (this.options.minifyAliases) {
        if (options.aliasesByTable[`${tableName}${field}`]) {
          return options.aliasesByTable[`${tableName}${field}`];
        }
      }

      return null;
    }
  }, {
    key: "generateJoin",
    value: function generateJoin(include, topLevelInfo) {
      const association = include.association;
      const parent = include.parent;
      const parentIsTop = !!parent && !include.parent.association && include.parent.model.name === topLevelInfo.options.model.name;
      let $parent;
      let joinWhere;
      /* Attributes for the left side */

      const left = association.source;
      const attrLeft = association instanceof BelongsTo ? association.identifier : association.sourceKeyAttribute || left.primaryKeyAttribute;
      const fieldLeft = association instanceof BelongsTo ? association.identifierField : left.rawAttributes[association.sourceKeyAttribute || left.primaryKeyAttribute].field;
      let asLeft;
      /* Attributes for the right side */

      const right = include.model;
      const tableRight = right.getTableName();
      const fieldRight = association instanceof BelongsTo ? right.rawAttributes[association.targetIdentifier || right.primaryKeyAttribute].field : association.identifierField;
      let asRight = include.as;

      while (($parent = $parent && $parent.parent || include.parent) && $parent.association) {
        if (asLeft) {
          asLeft = `${$parent.as}->${asLeft}`;
        } else {
          asLeft = $parent.as;
        }
      }

      if (!asLeft) asLeft = parent.as || parent.model.name;else asRight = `${asLeft}->${asRight}`;
      let joinOn = `${this.quoteTable(asLeft)}.${this.quoteIdentifier(fieldLeft)}`;
      const subqueryAttributes = [];

      if (topLevelInfo.options.groupedLimit && parentIsTop || topLevelInfo.subQuery && include.parent.subQuery && !include.subQuery) {
        if (parentIsTop) {
          // The main model attributes is not aliased to a prefix
          const tableName = this.quoteTable(parent.as || parent.model.name); // Check for potential aliased JOIN condition

          joinOn = this._getAliasForField(tableName, attrLeft, topLevelInfo.options) || `${tableName}.${this.quoteIdentifier(attrLeft)}`;

          if (topLevelInfo.subQuery) {
            subqueryAttributes.push(`${tableName}.${this.quoteIdentifier(fieldLeft)}`);
          }
        } else {
          const joinSource = `${asLeft.replace(/->/g, '.')}.${attrLeft}`; // Check for potential aliased JOIN condition

          joinOn = this._getAliasForField(asLeft, joinSource, topLevelInfo.options) || this.quoteIdentifier(joinSource);
        }
      }

      joinOn += ` = ${this.quoteIdentifier(asRight)}.${this.quoteIdentifier(fieldRight)}`;

      if (include.on) {
        joinOn = this.whereItemsQuery(include.on, {
          prefix: this.sequelize.literal(this.quoteIdentifier(asRight)),
          model: include.model
        });
      }

      if (include.where) {
        joinWhere = this.whereItemsQuery(include.where, {
          prefix: this.sequelize.literal(this.quoteIdentifier(asRight)),
          model: include.model
        });

        if (joinWhere) {
          if (include.or) {
            joinOn += ` OR ${joinWhere}`;
          } else {
            joinOn += ` AND ${joinWhere}`;
          }
        }
      }

      return {
        join: include.required ? 'INNER JOIN' : include.right && this._dialect.supports['RIGHT JOIN'] ? 'RIGHT OUTER JOIN' : 'LEFT OUTER JOIN',
        body: this.quoteTable(tableRight, asRight),
        condition: joinOn,
        attributes: {
          main: [],
          subQuery: subqueryAttributes
        }
      };
    }
  }, {
    key: "generateThroughJoin",
    value: function generateThroughJoin(include, includeAs, parentTableName, topLevelInfo) {
      const through = include.through;
      const throughTable = through.model.getTableName();
      const throughAs = `${includeAs.internalAs}->${through.as}`;
      const externalThroughAs = `${includeAs.externalAs}.${through.as}`;
      const throughAttributes = through.attributes.map(attr => {
        let alias = `${externalThroughAs}.${Array.isArray(attr) ? attr[1] : attr}`;

        if (this.options.minifyAliases) {
          alias = this._getMinifiedAlias(alias, throughAs, topLevelInfo.options);
        }

        return `${this.quoteIdentifier(throughAs)}.${this.quoteIdentifier(Array.isArray(attr) ? attr[0] : attr)} AS ${this.quoteIdentifier(alias)}`;
      });
      const association = include.association;
      const parentIsTop = !include.parent.association && include.parent.model.name === topLevelInfo.options.model.name;
      const tableSource = parentTableName;
      const identSource = association.identifierField;
      const tableTarget = includeAs.internalAs;
      const identTarget = association.foreignIdentifierField;
      const attrTarget = association.targetKeyField;
      const joinType = include.required ? 'INNER JOIN' : include.right && this._dialect.supports['RIGHT JOIN'] ? 'RIGHT OUTER JOIN' : 'LEFT OUTER JOIN';
      let joinBody;
      let joinCondition;
      const attributes = {
        main: [],
        subQuery: []
      };
      let attrSource = association.sourceKey;
      let sourceJoinOn;
      let targetJoinOn;
      let throughWhere;
      let targetWhere;

      if (topLevelInfo.options.includeIgnoreAttributes !== false) {
        // Through includes are always hasMany, so we need to add the attributes to the mainAttributes no matter what (Real join will never be executed in subquery)
        for (const attr of throughAttributes) {
          attributes.main.push(attr);
        }
      } // Figure out if we need to use field or attribute


      if (!topLevelInfo.subQuery) {
        attrSource = association.sourceKeyField;
      }

      if (topLevelInfo.subQuery && !include.subQuery && !include.parent.subQuery && include.parent.model !== topLevelInfo.options.mainModel) {
        attrSource = association.sourceKeyField;
      } // Filter statement for left side of through
      // Used by both join and subquery where
      // If parent include was in a subquery need to join on the aliased attribute


      if (topLevelInfo.subQuery && !include.subQuery && include.parent.subQuery && !parentIsTop) {
        // If we are minifying aliases and our JOIN target has been minified, we need to use the alias instead of the original column name
        const joinSource = this._getAliasForField(tableSource, `${tableSource}.${attrSource}`, topLevelInfo.options) || `${tableSource}.${attrSource}`;
        sourceJoinOn = `${this.quoteIdentifier(joinSource)} = `;
      } else {
        // If we are minifying aliases and our JOIN target has been minified, we need to use the alias instead of the original column name
        const aliasedSource = this._getAliasForField(tableSource, attrSource, topLevelInfo.options) || attrSource;
        sourceJoinOn = `${this.quoteTable(tableSource)}.${this.quoteIdentifier(aliasedSource)} = `;
      }

      sourceJoinOn += `${this.quoteIdentifier(throughAs)}.${this.quoteIdentifier(identSource)}`; // Filter statement for right side of through
      // Used by both join and subquery where

      targetJoinOn = `${this.quoteIdentifier(tableTarget)}.${this.quoteIdentifier(attrTarget)} = `;
      targetJoinOn += `${this.quoteIdentifier(throughAs)}.${this.quoteIdentifier(identTarget)}`;

      if (through.where) {
        throughWhere = this.getWhereConditions(through.where, this.sequelize.literal(this.quoteIdentifier(throughAs)), through.model);
      }

      if (this._dialect.supports.joinTableDependent) {
        // Generate a wrapped join so that the through table join can be dependent on the target join
        joinBody = `( ${this.quoteTable(throughTable, throughAs)} INNER JOIN ${this.quoteTable(include.model.getTableName(), includeAs.internalAs)} ON ${targetJoinOn}`;

        if (throughWhere) {
          joinBody += ` AND ${throughWhere}`;
        }

        joinBody += ')';
        joinCondition = sourceJoinOn;
      } else {
        // Generate join SQL for left side of through
        joinBody = `${this.quoteTable(throughTable, throughAs)} ON ${sourceJoinOn} ${joinType} ${this.quoteTable(include.model.getTableName(), includeAs.internalAs)}`;
        joinCondition = targetJoinOn;

        if (throughWhere) {
          joinCondition += ` AND ${throughWhere}`;
        }
      }

      if (include.where || include.through.where) {
        if (include.where) {
          targetWhere = this.getWhereConditions(include.where, this.sequelize.literal(this.quoteIdentifier(includeAs.internalAs)), include.model, topLevelInfo.options);

          if (targetWhere) {
            joinCondition += ` AND ${targetWhere}`;
          }
        }
      }

      this._generateSubQueryFilter(include, includeAs, topLevelInfo);

      return {
        join: joinType,
        body: joinBody,
        condition: joinCondition,
        attributes
      };
    }
    /*
     * Generates subQueryFilter - a select nested in the where clause of the subQuery.
     * For a given include a query is generated that contains all the way from the subQuery
     * table to the include table plus everything that's in required transitive closure of the
     * given include.
     */

  }, {
    key: "_generateSubQueryFilter",
    value: function _generateSubQueryFilter(include, includeAs, topLevelInfo) {
      if (!topLevelInfo.subQuery || !include.subQueryFilter) {
        return;
      }

      if (!topLevelInfo.options.where) {
        topLevelInfo.options.where = {};
      }

      let parent = include;
      let child = include;

      let nestedIncludes = this._getRequiredClosure(include).include;

      let query;

      while (parent = parent.parent) {
        // eslint-disable-line
        if (parent.parent && !parent.required) {
          return; // only generate subQueryFilter if all the parents of this include are required
        }

        if (parent.subQueryFilter) {
          // the include is already handled as this parent has the include on its required closure
          // skip to prevent duplicate subQueryFilter
          return;
        }

        nestedIncludes = [Object.assign({}, child, {
          include: nestedIncludes,
          attributes: []
        })];
        child = parent;
      }

      const topInclude = nestedIncludes[0];
      const topParent = topInclude.parent;
      const topAssociation = topInclude.association;
      topInclude.association = undefined;

      if (topInclude.through && Object(topInclude.through.model) === topInclude.through.model) {
        query = this.selectQuery(topInclude.through.model.getTableName(), {
          attributes: [topInclude.through.model.primaryKeyField],
          include: Model._validateIncludedElements({
            model: topInclude.through.model,
            include: [{
              association: topAssociation.toTarget,
              required: true,
              where: topInclude.where,
              include: topInclude.include
            }]
          }).include,
          model: topInclude.through.model,
          where: {
            [Op.and]: [this.sequelize.literal([`${this.quoteTable(topParent.model.name)}.${this.quoteIdentifier(topParent.model.primaryKeyField)}`, `${this.quoteIdentifier(topInclude.through.model.name)}.${this.quoteIdentifier(topAssociation.identifierField)}`].join(' = ')), topInclude.through.where]
          },
          limit: 1,
          includeIgnoreAttributes: false
        }, topInclude.through.model);
      } else {
        const isBelongsTo = topAssociation.associationType === 'BelongsTo';
        const sourceField = isBelongsTo ? topAssociation.identifierField : topAssociation.sourceKeyField || topParent.model.primaryKeyField;
        const targetField = isBelongsTo ? topAssociation.sourceKeyField || topInclude.model.primaryKeyField : topAssociation.identifierField;
        const join = [`${this.quoteIdentifier(topInclude.as)}.${this.quoteIdentifier(targetField)}`, `${this.quoteTable(topParent.as || topParent.model.name)}.${this.quoteIdentifier(sourceField)}`].join(' = ');
        query = this.selectQuery(topInclude.model.getTableName(), {
          attributes: [targetField],
          include: Model._validateIncludedElements(topInclude).include,
          model: topInclude.model,
          where: {
            [Op.and]: [topInclude.where, {
              [Op.join]: this.sequelize.literal(join)
            }]
          },
          limit: 1,
          tableAs: topInclude.as,
          includeIgnoreAttributes: false
        }, topInclude.model);
      }

      if (!topLevelInfo.options.where[Op.and]) {
        topLevelInfo.options.where[Op.and] = [];
      }

      topLevelInfo.options.where[`__${includeAs.internalAs}`] = this.sequelize.literal(['(', query.replace(/;$/, ''), ')', 'IS NOT NULL'].join(' '));
    }
    /*
     * For a given include hierarchy creates a copy of it where only the required includes
     * are preserved.
     */

  }, {
    key: "_getRequiredClosure",
    value: function _getRequiredClosure(include) {
      const copy = Object.assign({}, include, {
        attributes: [],
        include: []
      });

      if (Array.isArray(include.include)) {
        copy.include = include.include.filter(i => i.required).map(inc => this._getRequiredClosure(inc));
      }

      return copy;
    }
  }, {
    key: "getQueryOrders",
    value: function getQueryOrders(options, model, subQuery) {
      const mainQueryOrder = [];
      const subQueryOrder = [];

      if (Array.isArray(options.order)) {
        for (let order of options.order) {
          // wrap if not array
          if (!Array.isArray(order)) {
            order = [order];
          }

          if (subQuery && Array.isArray(order) && order[0] && !(order[0] instanceof Association) && !(typeof order[0] === 'function' && order[0].prototype instanceof Model) && !(typeof order[0].model === 'function' && order[0].model.prototype instanceof Model) && !(typeof order[0] === 'string' && model && model.associations !== undefined && model.associations[order[0]])) {
            subQueryOrder.push(this.quote(order, model, '->'));
          }

          if (subQuery) {
            // Handle case where sub-query renames attribute we want to order by,
            // see https://github.com/sequelize/sequelize/issues/8739
            const subQueryAttribute = options.attributes.find(a => Array.isArray(a) && a[0] === order[0] && a[1]);

            if (subQueryAttribute) {
              const modelName = this.quoteIdentifier(model.name);
              order[0] = new Utils.Col(this._getAliasForField(modelName, subQueryAttribute[1], options) || subQueryAttribute[1]);
            }
          }

          mainQueryOrder.push(this.quote(order, model, '->'));
        }
      } else if (options.order instanceof Utils.SequelizeMethod) {
        const sql = this.quote(options.order, model, '->');

        if (subQuery) {
          subQueryOrder.push(sql);
        }

        mainQueryOrder.push(sql);
      } else {
        throw new Error('Order must be type of array or instance of a valid sequelize method.');
      }

      return {
        mainQueryOrder,
        subQueryOrder
      };
    }
  }, {
    key: "selectFromTableFragment",
    value: function selectFromTableFragment(options, model, attributes, tables, mainTableAs) {
      let fragment = `SELECT ${attributes.join(', ')} FROM ${tables}`;

      if (mainTableAs) {
        fragment += ` AS ${mainTableAs}`;
      }

      if (options.indexHints && this._dialect.supports.indexHints) {
        for (const hint of options.indexHints) {
          if (IndexHints[hint.type]) {
            fragment += ` ${IndexHints[hint.type]} INDEX (${hint.values.map(indexName => this.quoteIdentifiers(indexName)).join(',')})`;
          }
        }
      }

      return fragment;
    }
    /**
     * Returns an SQL fragment for adding result constraints.
     *
     * @param  {Object} options An object with selectQuery options.
     * @returns {string}         The generated sql query.
     * @private
     */

  }, {
    key: "addLimitAndOffset",
    value: function addLimitAndOffset(options) {
      let fragment = '';
      /* eslint-disable */

      if (options.offset != null && options.limit == null) {
        fragment += ' LIMIT ' + this.escape(options.offset) + ', ' + 10000000000000;
      } else if (options.limit != null) {
        if (options.offset != null) {
          fragment += ' LIMIT ' + this.escape(options.offset) + ', ' + this.escape(options.limit);
        } else {
          fragment += ' LIMIT ' + this.escape(options.limit);
        }
      }
      /* eslint-enable */


      return fragment;
    }
  }, {
    key: "handleSequelizeMethod",
    value: function handleSequelizeMethod(smth, tableName, factory, options, prepend) {
      let result;

      if (Object.prototype.hasOwnProperty.call(this.OperatorMap, smth.comparator)) {
        smth.comparator = this.OperatorMap[smth.comparator];
      }

      if (smth instanceof Utils.Where) {
        let value = smth.logic;
        let key;

        if (smth.attribute instanceof Utils.SequelizeMethod) {
          key = this.getWhereConditions(smth.attribute, tableName, factory, options, prepend);
        } else {
          key = `${this.quoteTable(smth.attribute.Model.name)}.${this.quoteIdentifier(smth.attribute.field || smth.attribute.fieldName)}`;
        }

        if (value && value instanceof Utils.SequelizeMethod) {
          value = this.getWhereConditions(value, tableName, factory, options, prepend);

          if (value === 'NULL') {
            if (smth.comparator === '=') {
              smth.comparator = 'IS';
            }

            if (smth.comparator === '!=') {
              smth.comparator = 'IS NOT';
            }
          }

          return [key, value].join(` ${smth.comparator} `);
        }

        if (_.isPlainObject(value)) {
          return this.whereItemQuery(smth.attribute, value, {
            model: factory
          });
        }

        if (typeof value === 'boolean') {
          value = this.booleanValue(value);
        } else {
          value = this.escape(value);
        }

        if (value === 'NULL') {
          if (smth.comparator === '=') {
            smth.comparator = 'IS';
          }

          if (smth.comparator === '!=') {
            smth.comparator = 'IS NOT';
          }
        }

        return [key, value].join(` ${smth.comparator} `);
      }

      if (smth instanceof Utils.Literal) {
        return smth.val;
      }

      if (smth instanceof Utils.Cast) {
        if (smth.val instanceof Utils.SequelizeMethod) {
          result = this.handleSequelizeMethod(smth.val, tableName, factory, options, prepend);
        } else if (_.isPlainObject(smth.val)) {
          result = this.whereItemsQuery(smth.val);
        } else {
          result = this.escape(smth.val);
        }

        return `CAST(${result} AS ${smth.type.toUpperCase()})`;
      }

      if (smth instanceof Utils.Fn) {
        return `${smth.fn}(${smth.args.map(arg => {
          if (arg instanceof Utils.SequelizeMethod) {
            return this.handleSequelizeMethod(arg, tableName, factory, options, prepend);
          }

          if (_.isPlainObject(arg)) {
            return this.whereItemsQuery(arg);
          }

          return this.escape(arg);
        }).join(', ')})`;
      }

      if (smth instanceof Utils.Col) {
        if (Array.isArray(smth.col) && !factory) {
          throw new Error('Cannot call Sequelize.col() with array outside of order / group clause');
        }

        if (smth.col.startsWith('*')) {
          return '*';
        }

        return this.quote(smth.col, factory);
      }

      return smth.toString(this, factory);
    }
  }, {
    key: "whereQuery",
    value: function whereQuery(where, options) {
      const query = this.whereItemsQuery(where, options);

      if (query && query.length) {
        return `WHERE ${query}`;
      }

      return '';
    }
  }, {
    key: "whereItemsQuery",
    value: function whereItemsQuery(where, options, binding) {
      if (where === null || where === undefined || Utils.getComplexSize(where) === 0) {
        // NO OP
        return '';
      }

      if (typeof where === 'string') {
        throw new Error('Support for `{where: \'raw query\'}` has been removed.');
      }

      const items = [];
      binding = binding || 'AND';
      if (binding[0] !== ' ') binding = ` ${binding} `;

      if (_.isPlainObject(where)) {
        Utils.getComplexKeys(where).forEach(prop => {
          const item = where[prop];
          items.push(this.whereItemQuery(prop, item, options));
        });
      } else {
        items.push(this.whereItemQuery(undefined, where, options));
      }

      return items.length && items.filter(item => item && item.length).join(binding) || '';
    }
  }, {
    key: "whereItemQuery",
    value: function whereItemQuery(key, value, options = {}) {
      if (value === undefined) {
        throw new Error(`WHERE parameter "${key}" has invalid "undefined" value`);
      }

      if (typeof key === 'string' && key.includes('.') && options.model) {
        const keyParts = key.split('.');

        if (options.model.rawAttributes[keyParts[0]] && options.model.rawAttributes[keyParts[0]].type instanceof DataTypes.JSON) {
          const tmp = {};
          const field = options.model.rawAttributes[keyParts[0]];

          _.set(tmp, keyParts.slice(1), value);

          return this.whereItemQuery(field.field || keyParts[0], tmp, Object.assign({
            field
          }, options));
        }
      }

      const field = this._findField(key, options);

      const fieldType = field && field.type || options.type;

      const isPlainObject = _.isPlainObject(value);

      const isArray = !isPlainObject && Array.isArray(value);
      key = this.OperatorsAliasMap && this.OperatorsAliasMap[key] || key;

      if (isPlainObject) {
        value = this._replaceAliases(value);
      }

      const valueKeys = isPlainObject && Utils.getComplexKeys(value);

      if (key === undefined) {
        if (typeof value === 'string') {
          return value;
        }

        if (isPlainObject && valueKeys.length === 1) {
          return this.whereItemQuery(valueKeys[0], value[valueKeys[0]], options);
        }
      }

      if (value === null) {
        const opValue = options.bindParam ? 'NULL' : this.escape(value, field);
        return this._joinKeyValue(key, opValue, this.OperatorMap[Op.is], options.prefix);
      }

      if (!value) {
        const opValue = options.bindParam ? this.format(value, field, options, options.bindParam) : this.escape(value, field);
        return this._joinKeyValue(key, opValue, this.OperatorMap[Op.eq], options.prefix);
      }

      if (value instanceof Utils.SequelizeMethod && !(key !== undefined && value instanceof Utils.Fn)) {
        return this.handleSequelizeMethod(value);
      } // Convert where: [] to Op.and if possible, else treat as literal/replacements


      if (key === undefined && isArray) {
        if (Utils.canTreatArrayAsAnd(value)) {
          key = Op.and;
        } else {
          throw new Error('Support for literal replacements in the `where` object has been removed.');
        }
      }

      if (key === Op.or || key === Op.and || key === Op.not) {
        return this._whereGroupBind(key, value, options);
      }

      if (value[Op.or]) {
        return this._whereBind(this.OperatorMap[Op.or], key, value[Op.or], options);
      }

      if (value[Op.and]) {
        return this._whereBind(this.OperatorMap[Op.and], key, value[Op.and], options);
      }

      if (isArray && fieldType instanceof DataTypes.ARRAY) {
        const opValue = options.bindParam ? this.format(value, field, options, options.bindParam) : this.escape(value, field);
        return this._joinKeyValue(key, opValue, this.OperatorMap[Op.eq], options.prefix);
      }

      if (isPlainObject && fieldType instanceof DataTypes.JSON && options.json !== false) {
        return this._whereJSON(key, value, options);
      } // If multiple keys we combine the different logic conditions


      if (isPlainObject && valueKeys.length > 1) {
        return this._whereBind(this.OperatorMap[Op.and], key, value, options);
      }

      if (isArray) {
        return this._whereParseSingleValueObject(key, field, Op.in, value, options);
      }

      if (isPlainObject) {
        if (this.OperatorMap[valueKeys[0]]) {
          return this._whereParseSingleValueObject(key, field, valueKeys[0], value[valueKeys[0]], options);
        }

        return this._whereParseSingleValueObject(key, field, this.OperatorMap[Op.eq], value, options);
      }

      if (key === Op.placeholder) {
        const opValue = options.bindParam ? this.format(value, field, options, options.bindParam) : this.escape(value, field);
        return this._joinKeyValue(this.OperatorMap[key], opValue, this.OperatorMap[Op.eq], options.prefix);
      }

      const opValue = options.bindParam ? this.format(value, field, options, options.bindParam) : this.escape(value, field);
      return this._joinKeyValue(key, opValue, this.OperatorMap[Op.eq], options.prefix);
    }
  }, {
    key: "_findField",
    value: function _findField(key, options) {
      if (options.field) {
        return options.field;
      }

      if (options.model && options.model.rawAttributes && options.model.rawAttributes[key]) {
        return options.model.rawAttributes[key];
      }

      if (options.model && options.model.fieldRawAttributesMap && options.model.fieldRawAttributesMap[key]) {
        return options.model.fieldRawAttributesMap[key];
      }
    } // OR/AND/NOT grouping logic

  }, {
    key: "_whereGroupBind",
    value: function _whereGroupBind(key, value, options) {
      const binding = key === Op.or ? this.OperatorMap[Op.or] : this.OperatorMap[Op.and];
      const outerBinding = key === Op.not ? 'NOT ' : '';

      if (Array.isArray(value)) {
        value = value.map(item => {
          let itemQuery = this.whereItemsQuery(item, options, this.OperatorMap[Op.and]);

          if (itemQuery && itemQuery.length && (Array.isArray(item) || _.isPlainObject(item)) && Utils.getComplexSize(item) > 1) {
            itemQuery = `(${itemQuery})`;
          }

          return itemQuery;
        }).filter(item => item && item.length);
        value = value.length && value.join(binding);
      } else {
        value = this.whereItemsQuery(value, options, binding);
      } // Op.or: [] should return no data.
      // Op.not of no restriction should also return no data


      if ((key === Op.or || key === Op.not) && !value) {
        return '0 = 1';
      }

      return value ? `${outerBinding}(${value})` : undefined;
    }
  }, {
    key: "_whereBind",
    value: function _whereBind(binding, key, value, options) {
      if (_.isPlainObject(value)) {
        value = Utils.getComplexKeys(value).map(prop => {
          const item = value[prop];
          return this.whereItemQuery(key, {
            [prop]: item
          }, options);
        });
      } else {
        value = value.map(item => this.whereItemQuery(key, item, options));
      }

      value = value.filter(item => item && item.length);
      return value.length ? `(${value.join(binding)})` : undefined;
    }
  }, {
    key: "_whereJSON",
    value: function _whereJSON(key, value, options) {
      const items = [];
      let baseKey = this.quoteIdentifier(key);

      if (options.prefix) {
        if (options.prefix instanceof Utils.Literal) {
          baseKey = `${this.handleSequelizeMethod(options.prefix)}.${baseKey}`;
        } else {
          baseKey = `${this.quoteTable(options.prefix)}.${baseKey}`;
        }
      }

      Utils.getOperators(value).forEach(op => {
        const where = {
          [op]: value[op]
        };
        items.push(this.whereItemQuery(key, where, Object.assign({}, options, {
          json: false
        })));
      });

      _.forOwn(value, (item, prop) => {
        this._traverseJSON(items, baseKey, prop, item, [prop]);
      });

      const result = items.join(this.OperatorMap[Op.and]);
      return items.length > 1 ? `(${result})` : result;
    }
  }, {
    key: "_traverseJSON",
    value: function _traverseJSON(items, baseKey, prop, item, path) {
      let cast;

      if (path[path.length - 1].includes('::')) {
        const tmp = path[path.length - 1].split('::');
        cast = tmp[1];
        path[path.length - 1] = tmp[0];
      }

      const pathKey = this.jsonPathExtractionQuery(baseKey, path);

      if (_.isPlainObject(item)) {
        Utils.getOperators(item).forEach(op => {
          const value = this._toJSONValue(item[op]);

          items.push(this.whereItemQuery(this._castKey(pathKey, value, cast), {
            [op]: value
          }));
        });

        _.forOwn(item, (value, itemProp) => {
          this._traverseJSON(items, baseKey, itemProp, value, path.concat([itemProp]));
        });

        return;
      }

      item = this._toJSONValue(item);
      items.push(this.whereItemQuery(this._castKey(pathKey, item, cast), {
        [Op.eq]: item
      }));
    }
  }, {
    key: "_toJSONValue",
    value: function _toJSONValue(value) {
      return value;
    }
  }, {
    key: "_castKey",
    value: function _castKey(key, value, cast, json) {
      cast = cast || this._getJsonCast(Array.isArray(value) ? value[0] : value);

      if (cast) {
        return new Utils.Literal(this.handleSequelizeMethod(new Utils.Cast(new Utils.Literal(key), cast, json)));
      }

      return new Utils.Literal(key);
    }
  }, {
    key: "_getJsonCast",
    value: function _getJsonCast(value) {
      if (typeof value === 'number') {
        return 'double precision';
      }

      if (value instanceof Date) {
        return 'timestamptz';
      }

      if (typeof value === 'boolean') {
        return 'boolean';
      }

      return;
    }
  }, {
    key: "_joinKeyValue",
    value: function _joinKeyValue(key, value, comparator, prefix) {
      if (!key) {
        return value;
      }

      if (comparator === undefined) {
        throw new Error(`${key} and ${value} has no comparator`);
      }

      key = this._getSafeKey(key, prefix);
      return [key, value].join(` ${comparator} `);
    }
  }, {
    key: "_getSafeKey",
    value: function _getSafeKey(key, prefix) {
      if (key instanceof Utils.SequelizeMethod) {
        key = this.handleSequelizeMethod(key);
        return this._prefixKey(this.handleSequelizeMethod(key), prefix);
      }

      if (Utils.isColString(key)) {
        key = key.substr(1, key.length - 2).split('.');

        if (key.length > 2) {
          key = [// join the tables by -> to match out internal namings
          key.slice(0, -1).join('->'), key[key.length - 1]];
        }

        return key.map(identifier => this.quoteIdentifier(identifier)).join('.');
      }

      return this._prefixKey(this.quoteIdentifier(key), prefix);
    }
  }, {
    key: "_prefixKey",
    value: function _prefixKey(key, prefix) {
      if (prefix) {
        if (prefix instanceof Utils.Literal) {
          return [this.handleSequelizeMethod(prefix), key].join('.');
        }

        return [this.quoteTable(prefix), key].join('.');
      }

      return key;
    }
  }, {
    key: "_whereParseSingleValueObject",
    value: function _whereParseSingleValueObject(key, field, prop, value, options) {
      if (prop === Op.not) {
        if (Array.isArray(value)) {
          prop = Op.notIn;
        } else if (value !== null && value !== true && value !== false) {
          prop = Op.ne;
        }
      }

      let comparator = this.OperatorMap[prop] || this.OperatorMap[Op.eq];

      switch (prop) {
        case Op.in:
        case Op.notIn:
          if (value instanceof Utils.Literal) {
            return this._joinKeyValue(key, value.val, comparator, options.prefix);
          }

          if (value.length) {
            return this._joinKeyValue(key, `(${value.map(item => this.escape(item, field)).join(', ')})`, comparator, options.prefix);
          }

          if (comparator === this.OperatorMap[Op.in]) {
            return this._joinKeyValue(key, '(NULL)', comparator, options.prefix);
          }

          return '';

        case Op.any:
        case Op.all:
          comparator = `${this.OperatorMap[Op.eq]} ${comparator}`;

          if (value[Op.values]) {
            return this._joinKeyValue(key, `(VALUES ${value[Op.values].map(item => `(${this.escape(item)})`).join(', ')})`, comparator, options.prefix);
          }

          return this._joinKeyValue(key, `(${this.escape(value, field)})`, comparator, options.prefix);

        case Op.between:
        case Op.notBetween:
          return this._joinKeyValue(key, `${this.escape(value[0], field)} AND ${this.escape(value[1], field)}`, comparator, options.prefix);

        case Op.raw:
          throw new Error('The `$raw` where property is no longer supported.  Use `sequelize.literal` instead.');

        case Op.col:
          comparator = this.OperatorMap[Op.eq];
          value = value.split('.');

          if (value.length > 2) {
            value = [// join the tables by -> to match out internal namings
            value.slice(0, -1).join('->'), value[value.length - 1]];
          }

          return this._joinKeyValue(key, value.map(identifier => this.quoteIdentifier(identifier)).join('.'), comparator, options.prefix);

        case Op.startsWith:
          comparator = this.OperatorMap[Op.like];
          return this._joinKeyValue(key, this.escape(`${value}%`), comparator, options.prefix);

        case Op.endsWith:
          comparator = this.OperatorMap[Op.like];
          return this._joinKeyValue(key, this.escape(`%${value}`), comparator, options.prefix);

        case Op.substring:
          comparator = this.OperatorMap[Op.like];
          return this._joinKeyValue(key, this.escape(`%${value}%`), comparator, options.prefix);
      }

      const escapeOptions = {
        acceptStrings: comparator.includes(this.OperatorMap[Op.like])
      };

      if (_.isPlainObject(value)) {
        if (value[Op.col]) {
          return this._joinKeyValue(key, this.whereItemQuery(null, value), comparator, options.prefix);
        }

        if (value[Op.any]) {
          escapeOptions.isList = true;
          return this._joinKeyValue(key, `(${this.escape(value[Op.any], field, escapeOptions)})`, `${comparator} ${this.OperatorMap[Op.any]}`, options.prefix);
        }

        if (value[Op.all]) {
          escapeOptions.isList = true;
          return this._joinKeyValue(key, `(${this.escape(value[Op.all], field, escapeOptions)})`, `${comparator} ${this.OperatorMap[Op.all]}`, options.prefix);
        }
      }

      if (value === null && comparator === this.OperatorMap[Op.eq]) {
        return this._joinKeyValue(key, this.escape(value, field, escapeOptions), this.OperatorMap[Op.is], options.prefix);
      }

      if (value === null && comparator === this.OperatorMap[Op.ne]) {
        return this._joinKeyValue(key, this.escape(value, field, escapeOptions), this.OperatorMap[Op.not], options.prefix);
      }

      return this._joinKeyValue(key, this.escape(value, field, escapeOptions), comparator, options.prefix);
    }
    /*
      Takes something and transforms it into values of a where condition.
     @private
    */

  }, {
    key: "getWhereConditions",
    value: function getWhereConditions(smth, tableName, factory, options, prepend) {
      const where = {};

      if (Array.isArray(tableName)) {
        tableName = tableName[0];

        if (Array.isArray(tableName)) {
          tableName = tableName[1];
        }
      }

      options = options || {};

      if (prepend === undefined) {
        prepend = true;
      }

      if (smth && smth instanceof Utils.SequelizeMethod) {
        // Checking a property is cheaper than a lot of instanceof calls
        return this.handleSequelizeMethod(smth, tableName, factory, options, prepend);
      }

      if (_.isPlainObject(smth)) {
        return this.whereItemsQuery(smth, {
          model: factory,
          prefix: prepend && tableName,
          type: options.type
        });
      }

      if (typeof smth === 'number') {
        let primaryKeys = factory ? Object.keys(factory.primaryKeys) : [];

        if (primaryKeys.length > 0) {
          // Since we're just a number, assume only the first key
          primaryKeys = primaryKeys[0];
        } else {
          primaryKeys = 'id';
        }

        where[primaryKeys] = smth;
        return this.whereItemsQuery(where, {
          model: factory,
          prefix: prepend && tableName
        });
      }

      if (typeof smth === 'string') {
        return this.whereItemsQuery(smth, {
          model: factory,
          prefix: prepend && tableName
        });
      }

      if (Buffer.isBuffer(smth)) {
        return this.escape(smth);
      }

      if (Array.isArray(smth)) {
        if (smth.length === 0 || smth.length > 0 && smth[0].length === 0) return '1=1';

        if (Utils.canTreatArrayAsAnd(smth)) {
          const _smth = {
            [Op.and]: smth
          };
          return this.getWhereConditions(_smth, tableName, factory, options, prepend);
        }

        throw new Error('Support for literal replacements in the `where` object has been removed.');
      }

      if (smth === null) {
        return this.whereItemsQuery(smth, {
          model: factory,
          prefix: prepend && tableName
        });
      }

      return '1=1';
    } // A recursive parser for nested where conditions

  }, {
    key: "parseConditionObject",
    value: function parseConditionObject(conditions, path) {
      path = path || [];
      return _.reduce(conditions, (result, value, key) => {
        if (_.isObject(value)) {
          return result.concat(this.parseConditionObject(value, path.concat(key))); // Recursively parse objects
        }

        result.push({
          path: path.concat(key),
          value
        });
        return result;
      }, []);
    }
  }, {
    key: "booleanValue",
    value: function booleanValue(value) {
      return value;
    }
  }]);

  return QueryGenerator;
}();

Object.assign(QueryGenerator.prototype, require('./query-generator/operators'));
Object.assign(QueryGenerator.prototype, require('./query-generator/transaction'));
module.exports = QueryGenerator;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9hYnN0cmFjdC9xdWVyeS1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsidXRpbCIsInJlcXVpcmUiLCJfIiwidXVpZHY0Iiwic2VtdmVyIiwiVXRpbHMiLCJkZXByZWNhdGlvbnMiLCJTcWxTdHJpbmciLCJEYXRhVHlwZXMiLCJNb2RlbCIsIkFzc29jaWF0aW9uIiwiQmVsb25nc1RvIiwiQmVsb25nc1RvTWFueSIsIkhhc01hbnkiLCJPcCIsInNlcXVlbGl6ZUVycm9yIiwiSW5kZXhIaW50cyIsIlF1b3RlSGVscGVyIiwiUXVlcnlHZW5lcmF0b3IiLCJvcHRpb25zIiwic2VxdWVsaXplIiwiRXJyb3IiLCJfZGlhbGVjdCIsImRpYWxlY3QiLCJuYW1lIiwidGFibGVOYW1lIiwic2NoZW1hIiwiaXNQbGFpbk9iamVjdCIsImRlbGltaXRlciIsInBhcmFtIiwiX3NjaGVtYSIsInNlbGYiLCJ0YWJsZSIsIl9zY2hlbWFEZWxpbWl0ZXIiLCJ0b1N0cmluZyIsInF1b3RlVGFibGUiLCJkcm9wVGFibGVRdWVyeSIsInNjaGVtYURlbGltaXRlciIsImFkZFNjaGVtYSIsImJlZm9yZSIsImFmdGVyIiwidmFsdWVIYXNoIiwibW9kZWxBdHRyaWJ1dGVzIiwiZGVmYXVsdHMiLCJtb2RlbEF0dHJpYnV0ZU1hcCIsImZpZWxkcyIsInZhbHVlcyIsImJpbmQiLCJxdW90ZWRUYWJsZSIsImJpbmRQYXJhbSIsInVuZGVmaW5lZCIsInF1ZXJ5IiwidmFsdWVRdWVyeSIsImVtcHR5UXVlcnkiLCJvdXRwdXRGcmFnbWVudCIsImlkZW50aXR5V3JhcHBlclJlcXVpcmVkIiwidG1wVGFibGUiLCJlYWNoIiwiYXR0cmlidXRlIiwia2V5IiwiZmllbGQiLCJzdXBwb3J0cyIsInJldHVyblZhbHVlcyIsInJldHVybmluZyIsIm91dHB1dCIsImhhc1RyaWdnZXIiLCJ0bXBUYWJsZVRyaWdnZXIiLCJ0bXBDb2x1bW5zIiwib3V0cHV0Q29sdW1ucyIsIm1vZGVsS2V5IiwidHlwZSIsIlZJUlRVQUwiLCJsZW5ndGgiLCJxdW90ZUlkZW50aWZpZXIiLCJ0b1NxbCIsInNlbGVjdEZyb21UbXAiLCJnZXQiLCJzZWFyY2hQYXRoIiwiRVhDRVBUSU9OIiwiZXhjZXB0aW9uIiwicmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoIiwib21pdE51bGwiLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJ2YWx1ZSIsInB1c2giLCJhdXRvSW5jcmVtZW50IiwiZGVmYXVsdFZhbHVlIiwic3BsaWNlIiwiREVGQVVMVCIsImVzY2FwZSIsIlNlcXVlbGl6ZU1ldGhvZCIsImNvbnRleHQiLCJmb3JtYXQiLCJyZXBsYWNlbWVudHMiLCJpZ25vcmVEdXBsaWNhdGVzIiwiaW5zZXJ0cyIsIm9uQ29uZmxpY3REb05vdGhpbmciLCJhdHRyaWJ1dGVzIiwiam9pbiIsImd0ZSIsImRhdGFiYXNlVmVyc2lvbiIsInJlcGxhY2UiLCJvbkR1cGxpY2F0ZSIsImlkZW50aXR5SW5zZXJ0IiwicmVzdWx0IiwiZmllbGRWYWx1ZUhhc2hlcyIsImZpZWxkTWFwcGVkQXR0cmlidXRlcyIsInR1cGxlcyIsInNlcmlhbHMiLCJhbGxBdHRyaWJ1dGVzIiwib25EdXBsaWNhdGVLZXlVcGRhdGUiLCJmaWVsZFZhbHVlSGFzaCIsImZvck93biIsImluY2x1ZGVzIiwibWFwIiwiYnVsa0RlZmF1bHQiLCJ1cGRhdGVPbkR1cGxpY2F0ZSIsImNvbmZsaWN0S2V5cyIsInVwc2VydEtleXMiLCJhdHRyIiwidXBkYXRlS2V5cyIsInZhbHVlS2V5cyIsIkFycmF5IiwiaXNBcnJheSIsImF0dHJWYWx1ZUhhc2giLCJ3aGVyZSIsInN1ZmZpeCIsImxpbWl0IiwibWFwVG9Nb2RlbCIsInVwZGF0ZSIsIndoZXJlT3B0aW9ucyIsIndoZXJlUXVlcnkiLCJ0cmltIiwib3BlcmF0b3IiLCJyZXR1cm5pbmdGcmFnbWVudCIsInJhd1RhYmxlbmFtZSIsInByZWZpeCIsImZpZWxkc1NxbCIsImhhbmRsZVNlcXVlbGl6ZU1ldGhvZCIsImluc3BlY3QiLCJpbmRleCIsImNvbGxhdGUiLCJvcmRlciIsIm5hbWVJbmRleCIsIl9jb25mb3JtSW5kZXgiLCJxdW90ZUlkZW50aWZpZXJzIiwiY29uY3VycmVudGx5IiwiaW5kIiwiaW5kZXhWaWFBbHRlciIsImNvbmNhdCIsInVuaXF1ZSIsInVzaW5nIiwicGFyc2VyIiwiY29tcGFjdCIsImNvbnN0cmFpbnRTbmlwcGV0IiwiZ2V0Q29uc3RyYWludFNuaXBwZXQiLCJjb25zdHJhaW50TmFtZSIsImZpZWxkc1NxbFF1b3RlZFN0cmluZyIsImZpZWxkc1NxbFN0cmluZyIsInRvVXBwZXJDYXNlIiwid2hlcmVJdGVtc1F1ZXJ5IiwicmVmZXJlbmNlcyIsInJlZmVyZW5jZXNTbmlwcGV0Iiwib25VcGRhdGUiLCJvbkRlbGV0ZSIsImNvbGxlY3Rpb24iLCJwYXJlbnQiLCJjb25uZWN0b3IiLCJ2YWxpZE9yZGVyT3B0aW9ucyIsImZvckVhY2giLCJpdGVtIiwicHJldmlvdXMiLCJwcmV2aW91c0Fzc29jaWF0aW9uIiwicHJldmlvdXNNb2RlbCIsInRhcmdldCIsIm1vZGVsIiwiYXMiLCJ0aHJvdWdoIiwiZ2V0QXNzb2NpYXRpb25Gb3JBbGlhcyIsIm9yZGVySW5kZXgiLCJpbmRleE9mIiwibGl0ZXJhbCIsImFzc29jaWF0aW9ucyIsInJhd0F0dHJpYnV0ZXMiLCJpdGVtU3BsaXQiLCJzcGxpdCIsIkpTT04iLCJpZGVudGlmaWVyIiwicGF0aCIsInNsaWNlIiwianNvblBhdGhFeHRyYWN0aW9uUXVlcnkiLCJjb2xsZWN0aW9uTGVuZ3RoIiwidGFibGVOYW1lcyIsImkiLCJfbW9kZWxBdHRyaWJ1dGUiLCJzcWwiLCJjb2xsZWN0aW9uSXRlbSIsInF1b3RlIiwiZmllbGROYW1lIiwicmF3IiwiZm9yY2UiLCJpZGVudGlmaWVycyIsImhlYWQiLCJ0YWlsIiwiYWxpYXMiLCJpc09iamVjdCIsInNjaGVtYXMiLCJ2YWxpZGF0ZSIsInN0cmluZ2lmeSIsInNpbXBsZUVzY2FwZSIsImVzY1ZhbCIsInRpbWV6b25lIiwib3BlcmF0aW9uIiwiaWRlbnRpdHkiLCJ0eXBlVmFsaWRhdGlvbiIsImlzTGlzdCIsImVycm9yIiwiVmFsaWRhdGlvbkVycm9yIiwiZXJyb3JzIiwiVmFsaWRhdGlvbkVycm9ySXRlbSIsIm1lc3NhZ2UiLCJpc0lkZW50aWZpZXJRdW90ZWQiLCJjb2x1bW4iLCJwYXRocyIsInRvUGF0aCIsInBhdGhTdHIiLCJxdW90ZWRDb2x1bW4iLCJzdWJQYXRoIiwidGVzdCIsImFkZFRpY2tzIiwiX18iLCJkaWdpdCIsIm1haW5RdWVyeUl0ZW1zIiwic3ViUXVlcnlJdGVtcyIsInN1YlF1ZXJ5IiwiaGFzTXVsdGlBc3NvY2lhdGlvbiIsIm1haW4iLCJtYWluVGFibGUiLCJxdW90ZWROYW1lIiwidG9wTGV2ZWxJbmZvIiwibmFtZXMiLCJtYWluSm9pblF1ZXJpZXMiLCJzdWJKb2luUXVlcmllcyIsIm1pbmlmeUFsaWFzZXMiLCJhbGlhc2VzTWFwcGluZyIsIk1hcCIsImFsaWFzZXNCeVRhYmxlIiwidGFibGVBcyIsInQiLCJrZXlBdHQiLCJwcmltYXJ5S2V5QXR0cmlidXRlcyIsInNvbWUiLCJlc2NhcGVBdHRyaWJ1dGVzIiwiaW5jbHVkZSIsImdyb3VwZWRMaW1pdCIsInNlcGFyYXRlIiwiam9pblF1ZXJpZXMiLCJnZW5lcmF0ZUluY2x1ZGUiLCJleHRlcm5hbEFzIiwiaW50ZXJuYWxBcyIsIm1haW5RdWVyeSIsInVuaXEiLCJzZWxlY3RGcm9tVGFibGVGcmFnbWVudCIsImFzc2lnbiIsImdyb3VwZWRMaW1pdE9yZGVyIiwid2hlcmVLZXkiLCJncm91cGVkVGFibGVOYW1lIiwib24iLCJmb3JlaWduS2V5RmllbGQiLCJtYW55RnJvbVNvdXJjZSIsImdyb3VwZWRMaW1pdE9wdGlvbnMiLCJfdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzIiwiYXNzb2NpYXRpb24iLCJkdXBsaWNhdGluZyIsInJlcXVpcmVkIiwicGxhY2Vob2xkZXIiLCJoYXNKb2luIiwiaW5jbHVkZU1hcCIsImluY2x1ZGVOYW1lcyIsImJhc2VRdWVyeSIsInNlbGVjdFF1ZXJ5Iiwib2Zmc2V0IiwicGxhY2VIb2xkZXIiLCJ3aGVyZUl0ZW1RdWVyeSIsInNwbGljZVBvcyIsImdyb3VwV2hlcmUiLCJmb3JlaWduSWRlbnRpZmllckZpZWxkIiwic3BsaWNlU3RyIiwiZ2V0V2hlcmVDb25kaXRpb25zIiwic3RhcnRzV2l0aCIsImdyb3VwIiwiYWxpYXNHcm91cGluZyIsImhhdmluZyIsIm9yZGVycyIsImdldFF1ZXJ5T3JkZXJzIiwibWFpblF1ZXJ5T3JkZXIiLCJzdWJRdWVyeU9yZGVyIiwibGltaXRPcmRlciIsImFkZExpbWl0QW5kT2Zmc2V0IiwibG9jayIsImxldmVsIiwibG9ja0tleSIsImZvclNoYXJlIiwibG9ja09mIiwib2YiLCJza2lwTG9ja2VkIiwic3JjIiwiX2dldEFsaWFzRm9yRmllbGQiLCJtYWluVGFibGVBcyIsImFkZFRhYmxlIiwibm9SYXdBdHRyaWJ1dGVzIiwiX2dldE1pbmlmaWVkQWxpYXMiLCJUSUNLX0NIQVIiLCJxdW90ZUF0dHJpYnV0ZSIsImlzRW1wdHkiLCJwYXJlbnRUYWJsZU5hbWUiLCJtYWluQ2hpbGRJbmNsdWRlcyIsInN1YkNoaWxkSW5jbHVkZXMiLCJyZXF1aXJlZE1pc21hdGNoIiwiaW5jbHVkZUFzIiwiam9pblF1ZXJ5Iiwia2V5c0VzY2FwZWQiLCJpbmNsdWRlSWdub3JlQXR0cmlidXRlcyIsIl9leHBhbmRBdHRyaWJ1dGVzIiwibWFwRmluZGVyT3B0aW9ucyIsImluY2x1ZGVBdHRyaWJ1dGVzIiwiYXR0ckFzIiwidmVyYmF0aW0iLCJMaXRlcmFsIiwiQ2FzdCIsIkZuIiwidmFsIiwiZ2VuZXJhdGVUaHJvdWdoSm9pbiIsIl9nZW5lcmF0ZVN1YlF1ZXJ5RmlsdGVyIiwiZ2VuZXJhdGVKb2luIiwiY2hpbGRJbmNsdWRlIiwiX3BzZXVkbyIsImNoaWxkSm9pblF1ZXJpZXMiLCJib2R5IiwiY29uZGl0aW9uIiwibWF0Y2giLCJtaW5pZmllZEFsaWFzIiwic2l6ZSIsInNldCIsInBhcmVudElzVG9wIiwiJHBhcmVudCIsImpvaW5XaGVyZSIsImxlZnQiLCJzb3VyY2UiLCJhdHRyTGVmdCIsInNvdXJjZUtleUF0dHJpYnV0ZSIsInByaW1hcnlLZXlBdHRyaWJ1dGUiLCJmaWVsZExlZnQiLCJpZGVudGlmaWVyRmllbGQiLCJhc0xlZnQiLCJyaWdodCIsInRhYmxlUmlnaHQiLCJnZXRUYWJsZU5hbWUiLCJmaWVsZFJpZ2h0IiwidGFyZ2V0SWRlbnRpZmllciIsImFzUmlnaHQiLCJqb2luT24iLCJzdWJxdWVyeUF0dHJpYnV0ZXMiLCJqb2luU291cmNlIiwib3IiLCJ0aHJvdWdoVGFibGUiLCJ0aHJvdWdoQXMiLCJleHRlcm5hbFRocm91Z2hBcyIsInRocm91Z2hBdHRyaWJ1dGVzIiwidGFibGVTb3VyY2UiLCJpZGVudFNvdXJjZSIsInRhYmxlVGFyZ2V0IiwiaWRlbnRUYXJnZXQiLCJhdHRyVGFyZ2V0IiwidGFyZ2V0S2V5RmllbGQiLCJqb2luVHlwZSIsImpvaW5Cb2R5Iiwiam9pbkNvbmRpdGlvbiIsImF0dHJTb3VyY2UiLCJzb3VyY2VLZXkiLCJzb3VyY2VKb2luT24iLCJ0YXJnZXRKb2luT24iLCJ0aHJvdWdoV2hlcmUiLCJ0YXJnZXRXaGVyZSIsInNvdXJjZUtleUZpZWxkIiwibWFpbk1vZGVsIiwiYWxpYXNlZFNvdXJjZSIsImpvaW5UYWJsZURlcGVuZGVudCIsInN1YlF1ZXJ5RmlsdGVyIiwiY2hpbGQiLCJuZXN0ZWRJbmNsdWRlcyIsIl9nZXRSZXF1aXJlZENsb3N1cmUiLCJ0b3BJbmNsdWRlIiwidG9wUGFyZW50IiwidG9wQXNzb2NpYXRpb24iLCJwcmltYXJ5S2V5RmllbGQiLCJ0b1RhcmdldCIsImFuZCIsImlzQmVsb25nc1RvIiwiYXNzb2NpYXRpb25UeXBlIiwic291cmNlRmllbGQiLCJ0YXJnZXRGaWVsZCIsImNvcHkiLCJmaWx0ZXIiLCJpbmMiLCJzdWJRdWVyeUF0dHJpYnV0ZSIsImZpbmQiLCJhIiwibW9kZWxOYW1lIiwiQ29sIiwidGFibGVzIiwiZnJhZ21lbnQiLCJpbmRleEhpbnRzIiwiaGludCIsImluZGV4TmFtZSIsInNtdGgiLCJmYWN0b3J5IiwicHJlcGVuZCIsIk9wZXJhdG9yTWFwIiwiY29tcGFyYXRvciIsIldoZXJlIiwibG9naWMiLCJib29sZWFuVmFsdWUiLCJmbiIsImFyZ3MiLCJhcmciLCJjb2wiLCJiaW5kaW5nIiwiZ2V0Q29tcGxleFNpemUiLCJpdGVtcyIsImdldENvbXBsZXhLZXlzIiwicHJvcCIsImtleVBhcnRzIiwidG1wIiwiX2ZpbmRGaWVsZCIsImZpZWxkVHlwZSIsIk9wZXJhdG9yc0FsaWFzTWFwIiwiX3JlcGxhY2VBbGlhc2VzIiwib3BWYWx1ZSIsIl9qb2luS2V5VmFsdWUiLCJpcyIsImVxIiwiY2FuVHJlYXRBcnJheUFzQW5kIiwibm90IiwiX3doZXJlR3JvdXBCaW5kIiwiX3doZXJlQmluZCIsIkFSUkFZIiwianNvbiIsIl93aGVyZUpTT04iLCJfd2hlcmVQYXJzZVNpbmdsZVZhbHVlT2JqZWN0IiwiaW4iLCJmaWVsZFJhd0F0dHJpYnV0ZXNNYXAiLCJvdXRlckJpbmRpbmciLCJpdGVtUXVlcnkiLCJiYXNlS2V5IiwiZ2V0T3BlcmF0b3JzIiwib3AiLCJfdHJhdmVyc2VKU09OIiwiY2FzdCIsInBhdGhLZXkiLCJfdG9KU09OVmFsdWUiLCJfY2FzdEtleSIsIml0ZW1Qcm9wIiwiX2dldEpzb25DYXN0IiwiRGF0ZSIsIl9nZXRTYWZlS2V5IiwiX3ByZWZpeEtleSIsImlzQ29sU3RyaW5nIiwic3Vic3RyIiwibm90SW4iLCJuZSIsImFueSIsImFsbCIsImJldHdlZW4iLCJub3RCZXR3ZWVuIiwibGlrZSIsImVuZHNXaXRoIiwic3Vic3RyaW5nIiwiZXNjYXBlT3B0aW9ucyIsImFjY2VwdFN0cmluZ3MiLCJwcmltYXJ5S2V5cyIsImtleXMiLCJCdWZmZXIiLCJpc0J1ZmZlciIsIl9zbXRoIiwiY29uZGl0aW9ucyIsInJlZHVjZSIsInBhcnNlQ29uZGl0aW9uT2JqZWN0IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6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U0FBWjtBQUNBLGVBQU9xQixNQUFQO0FBQ0QsT0FOTSxFQU1KLEVBTkksQ0FBUDtBQU9EOzs7aUNBRVlyQixLLEVBQU87QUFDbEIsYUFBT0EsS0FBUDtBQUNEOzs7Ozs7QUFHSEosTUFBTSxDQUFDd0wsTUFBUCxDQUFjeFAsY0FBYyxDQUFDaUUsU0FBN0IsRUFBd0NsRixPQUFPLENBQUMsNkJBQUQsQ0FBL0M7QUFDQWlGLE1BQU0sQ0FBQ3dMLE1BQVAsQ0FBY3hQLGNBQWMsQ0FBQ2lFLFNBQTdCLEVBQXdDbEYsT0FBTyxDQUFDLCtCQUFELENBQS9DO0FBRUEwZSxNQUFNLENBQUNDLE9BQVAsR0FBaUIxZCxjQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuY29uc3QgdXVpZHY0ID0gcmVxdWlyZSgndXVpZC92NCcpO1xyXG5jb25zdCBzZW12ZXIgPSByZXF1aXJlKCdzZW12ZXInKTtcclxuXHJcbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMnKTtcclxuY29uc3QgZGVwcmVjYXRpb25zID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvZGVwcmVjYXRpb25zJyk7XHJcbmNvbnN0IFNxbFN0cmluZyA9IHJlcXVpcmUoJy4uLy4uL3NxbC1zdHJpbmcnKTtcclxuY29uc3QgRGF0YVR5cGVzID0gcmVxdWlyZSgnLi4vLi4vZGF0YS10eXBlcycpO1xyXG5jb25zdCBNb2RlbCA9IHJlcXVpcmUoJy4uLy4uL21vZGVsJyk7XHJcbmNvbnN0IEFzc29jaWF0aW9uID0gcmVxdWlyZSgnLi4vLi4vYXNzb2NpYXRpb25zL2Jhc2UnKTtcclxuY29uc3QgQmVsb25nc1RvID0gcmVxdWlyZSgnLi4vLi4vYXNzb2NpYXRpb25zL2JlbG9uZ3MtdG8nKTtcclxuY29uc3QgQmVsb25nc1RvTWFueSA9IHJlcXVpcmUoJy4uLy4uL2Fzc29jaWF0aW9ucy9iZWxvbmdzLXRvLW1hbnknKTtcclxuY29uc3QgSGFzTWFueSA9IHJlcXVpcmUoJy4uLy4uL2Fzc29jaWF0aW9ucy9oYXMtbWFueScpO1xyXG5jb25zdCBPcCA9IHJlcXVpcmUoJy4uLy4uL29wZXJhdG9ycycpO1xyXG5jb25zdCBzZXF1ZWxpemVFcnJvciA9IHJlcXVpcmUoJy4uLy4uL2Vycm9ycycpO1xyXG5jb25zdCBJbmRleEhpbnRzID0gcmVxdWlyZSgnLi4vLi4vaW5kZXgtaGludHMnKTtcclxuXHJcbmNvbnN0IFF1b3RlSGVscGVyID0gcmVxdWlyZSgnLi9xdWVyeS1nZW5lcmF0b3IvaGVscGVycy9xdW90ZScpO1xyXG5cclxuLyoqXHJcbiAqIEFic3RyYWN0IFF1ZXJ5IEdlbmVyYXRvclxyXG4gKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuY2xhc3MgUXVlcnlHZW5lcmF0b3Ige1xyXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcclxuICAgIGlmICghb3B0aW9ucy5zZXF1ZWxpemUpIHRocm93IG5ldyBFcnJvcignUXVlcnlHZW5lcmF0b3IgaW5pdGlhbGl6ZWQgd2l0aG91dCBvcHRpb25zLnNlcXVlbGl6ZScpO1xyXG4gICAgaWYgKCFvcHRpb25zLl9kaWFsZWN0KSB0aHJvdyBuZXcgRXJyb3IoJ1F1ZXJ5R2VuZXJhdG9yIGluaXRpYWxpemVkIHdpdGhvdXQgb3B0aW9ucy5fZGlhbGVjdCcpO1xyXG5cclxuICAgIHRoaXMuc2VxdWVsaXplID0gb3B0aW9ucy5zZXF1ZWxpemU7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zLnNlcXVlbGl6ZS5vcHRpb25zO1xyXG5cclxuICAgIC8vIGRpYWxlY3QgbmFtZVxyXG4gICAgdGhpcy5kaWFsZWN0ID0gb3B0aW9ucy5fZGlhbGVjdC5uYW1lO1xyXG4gICAgdGhpcy5fZGlhbGVjdCA9IG9wdGlvbnMuX2RpYWxlY3Q7XHJcbiAgfVxyXG5cclxuICBleHRyYWN0VGFibGVEZXRhaWxzKHRhYmxlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0YWJsZU5hbWUgPSB0YWJsZU5hbWUgfHwge307XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzY2hlbWE6IHRhYmxlTmFtZS5zY2hlbWEgfHwgb3B0aW9ucy5zY2hlbWEgfHwgJ3B1YmxpYycsXHJcbiAgICAgIHRhYmxlTmFtZTogXy5pc1BsYWluT2JqZWN0KHRhYmxlTmFtZSkgPyB0YWJsZU5hbWUudGFibGVOYW1lIDogdGFibGVOYW1lLFxyXG4gICAgICBkZWxpbWl0ZXI6IHRhYmxlTmFtZS5kZWxpbWl0ZXIgfHwgb3B0aW9ucy5kZWxpbWl0ZXIgfHwgJy4nXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgYWRkU2NoZW1hKHBhcmFtKSB7XHJcbiAgICBpZiAoIXBhcmFtLl9zY2hlbWEpIHJldHVybiBwYXJhbS50YWJsZU5hbWUgfHwgcGFyYW07XHJcbiAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRhYmxlTmFtZTogcGFyYW0udGFibGVOYW1lIHx8IHBhcmFtLFxyXG4gICAgICB0YWJsZTogcGFyYW0udGFibGVOYW1lIHx8IHBhcmFtLFxyXG4gICAgICBuYW1lOiBwYXJhbS5uYW1lIHx8IHBhcmFtLFxyXG4gICAgICBzY2hlbWE6IHBhcmFtLl9zY2hlbWEsXHJcbiAgICAgIGRlbGltaXRlcjogcGFyYW0uX3NjaGVtYURlbGltaXRlciB8fCAnLicsXHJcbiAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgIHJldHVybiBzZWxmLnF1b3RlVGFibGUodGhpcyk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBkcm9wU2NoZW1hKHRhYmxlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuIHRoaXMuZHJvcFRhYmxlUXVlcnkodGFibGVOYW1lLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIGRlc2NyaWJlVGFibGVRdWVyeSh0YWJsZU5hbWUsIHNjaGVtYSwgc2NoZW1hRGVsaW1pdGVyKSB7XHJcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMucXVvdGVUYWJsZShcclxuICAgICAgdGhpcy5hZGRTY2hlbWEoe1xyXG4gICAgICAgIHRhYmxlTmFtZSxcclxuICAgICAgICBfc2NoZW1hOiBzY2hlbWEsXHJcbiAgICAgICAgX3NjaGVtYURlbGltaXRlcjogc2NoZW1hRGVsaW1pdGVyXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiBgREVTQ1JJQkUgJHt0YWJsZX07YDtcclxuICB9XHJcblxyXG4gIGRyb3BUYWJsZVF1ZXJ5KHRhYmxlTmFtZSkge1xyXG4gICAgcmV0dXJuIGBEUk9QIFRBQkxFIElGIEVYSVNUUyAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfTtgO1xyXG4gIH1cclxuXHJcbiAgcmVuYW1lVGFibGVRdWVyeShiZWZvcmUsIGFmdGVyKSB7XHJcbiAgICByZXR1cm4gYEFMVEVSIFRBQkxFICR7dGhpcy5xdW90ZVRhYmxlKGJlZm9yZSl9IFJFTkFNRSBUTyAke3RoaXMucXVvdGVUYWJsZShhZnRlcil9O2A7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGluc2VydCBpbnRvIGNvbW1hbmRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZUhhc2ggICAgICAgYXR0cmlidXRlIHZhbHVlIHBhaXJzXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG1vZGVsQXR0cmlidXRlc1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgaW5zZXJ0UXVlcnkodGFibGUsIHZhbHVlSGFzaCwgbW9kZWxBdHRyaWJ1dGVzLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIF8uZGVmYXVsdHMob3B0aW9ucywgdGhpcy5vcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCBtb2RlbEF0dHJpYnV0ZU1hcCA9IHt9O1xyXG4gICAgY29uc3QgZmllbGRzID0gW107XHJcbiAgICBjb25zdCB2YWx1ZXMgPSBbXTtcclxuICAgIGNvbnN0IGJpbmQgPSBbXTtcclxuICAgIGNvbnN0IHF1b3RlZFRhYmxlID0gdGhpcy5xdW90ZVRhYmxlKHRhYmxlKTtcclxuICAgIGNvbnN0IGJpbmRQYXJhbSA9IG9wdGlvbnMuYmluZFBhcmFtID09PSB1bmRlZmluZWQgPyB0aGlzLmJpbmRQYXJhbShiaW5kKSA6IG9wdGlvbnMuYmluZFBhcmFtO1xyXG4gICAgbGV0IHF1ZXJ5O1xyXG4gICAgbGV0IHZhbHVlUXVlcnkgPSAnJztcclxuICAgIGxldCBlbXB0eVF1ZXJ5ID0gJyc7XHJcbiAgICBsZXQgb3V0cHV0RnJhZ21lbnQgPSAnJztcclxuICAgIGxldCBpZGVudGl0eVdyYXBwZXJSZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgbGV0IHRtcFRhYmxlID0gJyc7IC8vdG1wVGFibGUgZGVjbGFyYXRpb24gZm9yIHRyaWdnZXJcclxuXHJcbiAgICBpZiAobW9kZWxBdHRyaWJ1dGVzKSB7XHJcbiAgICAgIF8uZWFjaChtb2RlbEF0dHJpYnV0ZXMsIChhdHRyaWJ1dGUsIGtleSkgPT4ge1xyXG4gICAgICAgIG1vZGVsQXR0cmlidXRlTWFwW2tleV0gPSBhdHRyaWJ1dGU7XHJcbiAgICAgICAgaWYgKGF0dHJpYnV0ZS5maWVsZCkge1xyXG4gICAgICAgICAgbW9kZWxBdHRyaWJ1dGVNYXBbYXR0cmlidXRlLmZpZWxkXSA9IGF0dHJpYnV0ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzWydERUZBVUxUIFZBTFVFUyddKSB7XHJcbiAgICAgIGVtcHR5UXVlcnkgKz0gJyBERUZBVUxUIFZBTFVFUyc7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHNbJ1ZBTFVFUyAoKSddKSB7XHJcbiAgICAgIGVtcHR5UXVlcnkgKz0gJyBWQUxVRVMgKCknO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnJldHVyblZhbHVlcyAmJiBvcHRpb25zLnJldHVybmluZykge1xyXG4gICAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5yZXR1cm5WYWx1ZXMucmV0dXJuaW5nKSB7XHJcbiAgICAgICAgdmFsdWVRdWVyeSArPSAnIFJFVFVSTklORyAqJztcclxuICAgICAgICBlbXB0eVF1ZXJ5ICs9ICcgUkVUVVJOSU5HIConO1xyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMucmV0dXJuVmFsdWVzLm91dHB1dCkge1xyXG4gICAgICAgIG91dHB1dEZyYWdtZW50ID0gJyBPVVRQVVQgSU5TRVJURUQuKic7XHJcblxyXG4gICAgICAgIC8vVG8gY2FwdHVyZSBvdXRwdXQgcm93cyB3aGVuIHRoZXJlIGlzIGEgdHJpZ2dlciBvbiBNU1NRTCBEQlxyXG4gICAgICAgIGlmIChtb2RlbEF0dHJpYnV0ZXMgJiYgb3B0aW9ucy5oYXNUcmlnZ2VyICYmIHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMudG1wVGFibGVUcmlnZ2VyKSB7XHJcblxyXG4gICAgICAgICAgbGV0IHRtcENvbHVtbnMgPSAnJztcclxuICAgICAgICAgIGxldCBvdXRwdXRDb2x1bW5zID0gJyc7XHJcblxyXG4gICAgICAgICAgZm9yIChjb25zdCBtb2RlbEtleSBpbiBtb2RlbEF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbW9kZWxBdHRyaWJ1dGVzW21vZGVsS2V5XTtcclxuICAgICAgICAgICAgaWYgKCEoYXR0cmlidXRlLnR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuVklSVFVBTCkpIHtcclxuICAgICAgICAgICAgICBpZiAodG1wQ29sdW1ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0bXBDb2x1bW5zICs9ICcsJztcclxuICAgICAgICAgICAgICAgIG91dHB1dENvbHVtbnMgKz0gJywnO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgdG1wQ29sdW1ucyArPSBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyaWJ1dGUuZmllbGQpfSAke2F0dHJpYnV0ZS50eXBlLnRvU3FsKCl9YDtcclxuICAgICAgICAgICAgICBvdXRwdXRDb2x1bW5zICs9IGBJTlNFUlRFRC4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHJpYnV0ZS5maWVsZCl9YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRtcFRhYmxlID0gYGRlY2xhcmUgQHRtcCB0YWJsZSAoJHt0bXBDb2x1bW5zfSk7YDtcclxuICAgICAgICAgIG91dHB1dEZyYWdtZW50ID0gYCBPVVRQVVQgJHtvdXRwdXRDb2x1bW5zfSBpbnRvIEB0bXBgO1xyXG4gICAgICAgICAgY29uc3Qgc2VsZWN0RnJvbVRtcCA9ICc7c2VsZWN0ICogZnJvbSBAdG1wJztcclxuXHJcbiAgICAgICAgICB2YWx1ZVF1ZXJ5ICs9IHNlbGVjdEZyb21UbXA7XHJcbiAgICAgICAgICBlbXB0eVF1ZXJ5ICs9IHNlbGVjdEZyb21UbXA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKF8uZ2V0KHRoaXMsIFsnc2VxdWVsaXplJywgJ29wdGlvbnMnLCAnZGlhbGVjdE9wdGlvbnMnLCAncHJlcGVuZFNlYXJjaFBhdGgnXSkgfHwgb3B0aW9ucy5zZWFyY2hQYXRoKSB7XHJcbiAgICAgIC8vIE5vdCBjdXJyZW50bHkgc3VwcG9ydGVkIHdpdGggc2VhcmNoIHBhdGggKHJlcXVpcmVzIG91dHB1dCBvZiBtdWx0aXBsZSBxdWVyaWVzKVxyXG4gICAgICBvcHRpb25zLmJpbmRQYXJhbSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLkVYQ0VQVElPTiAmJiBvcHRpb25zLmV4Y2VwdGlvbikge1xyXG4gICAgICAvLyBOb3QgY3VycmVudGx5IHN1cHBvcnRlZCB3aXRoIGJpbmQgcGFyYW1ldGVycyAocmVxdWlyZXMgb3V0cHV0IG9mIG11bHRpcGxlIHF1ZXJpZXMpXHJcbiAgICAgIG9wdGlvbnMuYmluZFBhcmFtID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdmFsdWVIYXNoID0gVXRpbHMucmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoKHZhbHVlSGFzaCwgdGhpcy5vcHRpb25zLm9taXROdWxsKTtcclxuICAgIGZvciAoY29uc3Qga2V5IGluIHZhbHVlSGFzaCkge1xyXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlSGFzaCwga2V5KSkge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVIYXNoW2tleV07XHJcbiAgICAgICAgZmllbGRzLnB1c2godGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KSk7XHJcblxyXG4gICAgICAgIC8vIFNFUklBTFMnIGNhbid0IGJlIE5VTEwgaW4gcG9zdGdyZXNxbCwgdXNlIERFRkFVTFQgd2hlcmUgc3VwcG9ydGVkXHJcbiAgICAgICAgaWYgKG1vZGVsQXR0cmlidXRlTWFwICYmIG1vZGVsQXR0cmlidXRlTWFwW2tleV0gJiYgbW9kZWxBdHRyaWJ1dGVNYXBba2V5XS5hdXRvSW5jcmVtZW50ID09PSB0cnVlICYmICF2YWx1ZSkge1xyXG4gICAgICAgICAgaWYgKCF0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmF1dG9JbmNyZW1lbnQuZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgIGZpZWxkcy5zcGxpY2UoLTEsIDEpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLkRFRkFVTFQpIHtcclxuICAgICAgICAgICAgdmFsdWVzLnB1c2goJ0RFRkFVTFQnKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHRoaXMuZXNjYXBlKG51bGwpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKG1vZGVsQXR0cmlidXRlTWFwICYmIG1vZGVsQXR0cmlidXRlTWFwW2tleV0gJiYgbW9kZWxBdHRyaWJ1dGVNYXBba2V5XS5hdXRvSW5jcmVtZW50ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGlkZW50aXR5V3JhcHBlclJlcXVpcmVkID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QgfHwgb3B0aW9ucy5iaW5kUGFyYW0gPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHRoaXMuZXNjYXBlKHZhbHVlLCBtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldIHx8IHVuZGVmaW5lZCwgeyBjb250ZXh0OiAnSU5TRVJUJyB9KSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YWx1ZXMucHVzaCh0aGlzLmZvcm1hdCh2YWx1ZSwgbW9kZWxBdHRyaWJ1dGVNYXAgJiYgbW9kZWxBdHRyaWJ1dGVNYXBba2V5XSB8fCB1bmRlZmluZWQsIHsgY29udGV4dDogJ0lOU0VSVCcgfSwgYmluZFBhcmFtKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVwbGFjZW1lbnRzID0ge1xyXG4gICAgICBpZ25vcmVEdXBsaWNhdGVzOiBvcHRpb25zLmlnbm9yZUR1cGxpY2F0ZXMgPyB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluc2VydHMuaWdub3JlRHVwbGljYXRlcyA6ICcnLFxyXG4gICAgICBvbkNvbmZsaWN0RG9Ob3RoaW5nOiBvcHRpb25zLmlnbm9yZUR1cGxpY2F0ZXMgPyB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluc2VydHMub25Db25mbGljdERvTm90aGluZyA6ICcnLFxyXG4gICAgICBhdHRyaWJ1dGVzOiBmaWVsZHMuam9pbignLCcpLFxyXG4gICAgICBvdXRwdXQ6IG91dHB1dEZyYWdtZW50LFxyXG4gICAgICB2YWx1ZXM6IHZhbHVlcy5qb2luKCcsJyksXHJcbiAgICAgIHRtcFRhYmxlXHJcbiAgICB9O1xyXG5cclxuICAgIHZhbHVlUXVlcnkgPSBgJHt0bXBUYWJsZX1JTlNFUlQke3JlcGxhY2VtZW50cy5pZ25vcmVEdXBsaWNhdGVzfSBJTlRPICR7cXVvdGVkVGFibGV9ICgke3JlcGxhY2VtZW50cy5hdHRyaWJ1dGVzfSkke3JlcGxhY2VtZW50cy5vdXRwdXR9IFZBTFVFUyAoJHtyZXBsYWNlbWVudHMudmFsdWVzfSkke3JlcGxhY2VtZW50cy5vbkNvbmZsaWN0RG9Ob3RoaW5nfSR7dmFsdWVRdWVyeX1gO1xyXG4gICAgZW1wdHlRdWVyeSA9IGAke3RtcFRhYmxlfUlOU0VSVCR7cmVwbGFjZW1lbnRzLmlnbm9yZUR1cGxpY2F0ZXN9IElOVE8gJHtxdW90ZWRUYWJsZX0ke3JlcGxhY2VtZW50cy5vdXRwdXR9JHtyZXBsYWNlbWVudHMub25Db25mbGljdERvTm90aGluZ30ke2VtcHR5UXVlcnl9YDtcclxuXHJcbiAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5FWENFUFRJT04gJiYgb3B0aW9ucy5leGNlcHRpb24pIHtcclxuICAgICAgLy8gTW9zdGx5IGZvciBpbnRlcm5hbCB1c2UsIHNvIHdlIGV4cGVjdCB0aGUgdXNlciB0byBrbm93IHdoYXQgaGUncyBkb2luZyFcclxuICAgICAgLy8gcGdfdGVtcCBmdW5jdGlvbnMgYXJlIHByaXZhdGUgcGVyIGNvbm5lY3Rpb24sIHNvIHdlIG5ldmVyIHJpc2sgdGhpcyBmdW5jdGlvbiBpbnRlcmZlcmluZyB3aXRoIGFub3RoZXIgb25lLlxyXG4gICAgICBpZiAoc2VtdmVyLmd0ZSh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRhdGFiYXNlVmVyc2lvbiwgJzkuMi4wJykpIHtcclxuICAgICAgICAvLyA+PSA5LjIgLSBVc2UgYSBVVUlEIGJ1dCBwcmVmaXggd2l0aCAnZnVuY18nIChudW1iZXJzIGZpcnN0IG5vdCBhbGxvd2VkKVxyXG4gICAgICAgIGNvbnN0IGRlbGltaXRlciA9IGAkZnVuY18ke3V1aWR2NCgpLnJlcGxhY2UoLy0vZywgJycpfSRgO1xyXG5cclxuICAgICAgICBvcHRpb25zLmV4Y2VwdGlvbiA9ICdXSEVOIHVuaXF1ZV92aW9sYXRpb24gVEhFTiBHRVQgU1RBQ0tFRCBESUFHTk9TVElDUyBzZXF1ZWxpemVfY2F1Z2h0X2V4Y2VwdGlvbiA9IFBHX0VYQ0VQVElPTl9ERVRBSUw7JztcclxuICAgICAgICB2YWx1ZVF1ZXJ5ID0gYCR7YENSRUFURSBPUiBSRVBMQUNFIEZVTkNUSU9OIHBnX3RlbXAudGVzdGZ1bmMoT1VUIHJlc3BvbnNlICR7cXVvdGVkVGFibGV9LCBPVVQgc2VxdWVsaXplX2NhdWdodF9leGNlcHRpb24gdGV4dCkgUkVUVVJOUyBSRUNPUkQgQVMgJHtkZWxpbWl0ZXJ9YCArXHJcbiAgICAgICAgICAnIEJFR0lOICd9JHt2YWx1ZVF1ZXJ5fSBJTlRPIHJlc3BvbnNlOyBFWENFUFRJT04gJHtvcHRpb25zLmV4Y2VwdGlvbn0gRU5EICR7ZGVsaW1pdGVyXHJcbiAgICAgICAgfSBMQU5HVUFHRSBwbHBnc3FsOyBTRUxFQ1QgKHRlc3RmdW5jLnJlc3BvbnNlKS4qLCB0ZXN0ZnVuYy5zZXF1ZWxpemVfY2F1Z2h0X2V4Y2VwdGlvbiBGUk9NIHBnX3RlbXAudGVzdGZ1bmMoKTsgRFJPUCBGVU5DVElPTiBJRiBFWElTVFMgcGdfdGVtcC50ZXN0ZnVuYygpYDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBvcHRpb25zLmV4Y2VwdGlvbiA9ICdXSEVOIHVuaXF1ZV92aW9sYXRpb24gVEhFTiBOVUxMOyc7XHJcbiAgICAgICAgdmFsdWVRdWVyeSA9IGBDUkVBVEUgT1IgUkVQTEFDRSBGVU5DVElPTiBwZ190ZW1wLnRlc3RmdW5jKCkgUkVUVVJOUyBTRVRPRiAke3F1b3RlZFRhYmxlfSBBUyAkYm9keSQgQkVHSU4gUkVUVVJOIFFVRVJZICR7dmFsdWVRdWVyeX07IEVYQ0VQVElPTiAke29wdGlvbnMuZXhjZXB0aW9ufSBFTkQ7ICRib2R5JCBMQU5HVUFHRSBwbHBnc3FsOyBTRUxFQ1QgKiBGUk9NIHBnX3RlbXAudGVzdGZ1bmMoKTsgRFJPUCBGVU5DVElPTiBJRiBFWElTVFMgcGdfdGVtcC50ZXN0ZnVuYygpO2A7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0c1snT04gRFVQTElDQVRFIEtFWSddICYmIG9wdGlvbnMub25EdXBsaWNhdGUpIHtcclxuICAgICAgdmFsdWVRdWVyeSArPSBgIE9OIERVUExJQ0FURSBLRVkgJHtvcHRpb25zLm9uRHVwbGljYXRlfWA7XHJcbiAgICAgIGVtcHR5UXVlcnkgKz0gYCBPTiBEVVBMSUNBVEUgS0VZICR7b3B0aW9ucy5vbkR1cGxpY2F0ZX1gO1xyXG4gICAgfVxyXG5cclxuICAgIHF1ZXJ5ID0gYCR7cmVwbGFjZW1lbnRzLmF0dHJpYnV0ZXMubGVuZ3RoID8gdmFsdWVRdWVyeSA6IGVtcHR5UXVlcnl9O2A7XHJcbiAgICBpZiAoaWRlbnRpdHlXcmFwcGVyUmVxdWlyZWQgJiYgdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5hdXRvSW5jcmVtZW50LmlkZW50aXR5SW5zZXJ0KSB7XHJcbiAgICAgIHF1ZXJ5ID0gYFNFVCBJREVOVElUWV9JTlNFUlQgJHtxdW90ZWRUYWJsZX0gT047ICR7cXVlcnl9IFNFVCBJREVOVElUWV9JTlNFUlQgJHtxdW90ZWRUYWJsZX0gT0ZGO2A7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVXNlZCBieSBQb3N0Z3JlcyB1cHNlcnRRdWVyeSBhbmQgY2FsbHMgdG8gaGVyZSB3aXRoIG9wdGlvbnMuZXhjZXB0aW9uIHNldCB0byB0cnVlXHJcbiAgICBjb25zdCByZXN1bHQgPSB7IHF1ZXJ5IH07XHJcbiAgICBpZiAob3B0aW9ucy5iaW5kUGFyYW0gIT09IGZhbHNlKSB7XHJcbiAgICAgIHJlc3VsdC5iaW5kID0gYmluZDtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGluc2VydCBpbnRvIGNvbW1hbmQgZm9yIG11bHRpcGxlIHZhbHVlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZmllbGRWYWx1ZUhhc2hlc1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGZpZWxkTWFwcGVkQXR0cmlidXRlc1xyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBidWxrSW5zZXJ0UXVlcnkodGFibGVOYW1lLCBmaWVsZFZhbHVlSGFzaGVzLCBvcHRpb25zLCBmaWVsZE1hcHBlZEF0dHJpYnV0ZXMpIHtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgZmllbGRNYXBwZWRBdHRyaWJ1dGVzID0gZmllbGRNYXBwZWRBdHRyaWJ1dGVzIHx8IHt9O1xyXG5cclxuICAgIGNvbnN0IHR1cGxlcyA9IFtdO1xyXG4gICAgY29uc3Qgc2VyaWFscyA9IHt9O1xyXG4gICAgY29uc3QgYWxsQXR0cmlidXRlcyA9IFtdO1xyXG4gICAgbGV0IG9uRHVwbGljYXRlS2V5VXBkYXRlID0gJyc7XHJcblxyXG4gICAgZm9yIChjb25zdCBmaWVsZFZhbHVlSGFzaCBvZiBmaWVsZFZhbHVlSGFzaGVzKSB7XHJcbiAgICAgIF8uZm9yT3duKGZpZWxkVmFsdWVIYXNoLCAodmFsdWUsIGtleSkgPT4ge1xyXG4gICAgICAgIGlmICghYWxsQXR0cmlidXRlcy5pbmNsdWRlcyhrZXkpKSB7XHJcbiAgICAgICAgICBhbGxBdHRyaWJ1dGVzLnB1c2goa2V5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgZmllbGRNYXBwZWRBdHRyaWJ1dGVzW2tleV1cclxuICAgICAgICAgICYmIGZpZWxkTWFwcGVkQXR0cmlidXRlc1trZXldLmF1dG9JbmNyZW1lbnQgPT09IHRydWVcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHNlcmlhbHNba2V5XSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGNvbnN0IGZpZWxkVmFsdWVIYXNoIG9mIGZpZWxkVmFsdWVIYXNoZXMpIHtcclxuICAgICAgY29uc3QgdmFsdWVzID0gYWxsQXR0cmlidXRlcy5tYXAoa2V5ID0+IHtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmJ1bGtEZWZhdWx0XHJcbiAgICAgICAgICAmJiBzZXJpYWxzW2tleV0gPT09IHRydWVcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHJldHVybiBmaWVsZFZhbHVlSGFzaFtrZXldIHx8ICdERUZBVUxUJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmVzY2FwZShmaWVsZFZhbHVlSGFzaFtrZXldLCBmaWVsZE1hcHBlZEF0dHJpYnV0ZXNba2V5XSwgeyBjb250ZXh0OiAnSU5TRVJUJyB9KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0dXBsZXMucHVzaChgKCR7dmFsdWVzLmpvaW4oJywnKX0pYCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5zZXJ0cy51cGRhdGVPbkR1cGxpY2F0ZSAmJiBvcHRpb25zLnVwZGF0ZU9uRHVwbGljYXRlKSB7XHJcbiAgICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluc2VydHMudXBkYXRlT25EdXBsaWNhdGUgPT0gJyBPTiBDT05GTElDVCBETyBVUERBVEUgU0VUJykgeyAvLyBwb3N0Z3JlcyAvIHNxbGl0ZVxyXG4gICAgICAgIC8vIElmIG5vIGNvbmZsaWN0IHRhcmdldCBjb2x1bW5zIHdlcmUgc3BlY2lmaWVkLCB1c2UgdGhlIHByaW1hcnkga2V5IG5hbWVzIGZyb20gb3B0aW9ucy51cHNlcnRLZXlzXHJcbiAgICAgICAgY29uc3QgY29uZmxpY3RLZXlzID0gb3B0aW9ucy51cHNlcnRLZXlzLm1hcChhdHRyID0+IHRoaXMucXVvdGVJZGVudGlmaWVyKGF0dHIpKTtcclxuICAgICAgICBjb25zdCB1cGRhdGVLZXlzID0gb3B0aW9ucy51cGRhdGVPbkR1cGxpY2F0ZS5tYXAoYXR0ciA9PiBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKX09RVhDTFVERUQuJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKX1gKTtcclxuICAgICAgICBvbkR1cGxpY2F0ZUtleVVwZGF0ZSA9IGAgT04gQ09ORkxJQ1QgKCR7Y29uZmxpY3RLZXlzLmpvaW4oJywnKX0pIERPIFVQREFURSBTRVQgJHt1cGRhdGVLZXlzLmpvaW4oJywnKX1gO1xyXG4gICAgICB9IGVsc2UgeyAvLyBteXNxbCAvIG1hcmlhXHJcbiAgICAgICAgY29uc3QgdmFsdWVLZXlzID0gb3B0aW9ucy51cGRhdGVPbkR1cGxpY2F0ZS5tYXAoYXR0ciA9PiBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKX09VkFMVUVTKCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cil9KWApO1xyXG4gICAgICAgIG9uRHVwbGljYXRlS2V5VXBkYXRlID0gYCR7dGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbnNlcnRzLnVwZGF0ZU9uRHVwbGljYXRlfSAke3ZhbHVlS2V5cy5qb2luKCcsJyl9YDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGlnbm9yZUR1cGxpY2F0ZXMgPSBvcHRpb25zLmlnbm9yZUR1cGxpY2F0ZXMgPyB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluc2VydHMuaWdub3JlRHVwbGljYXRlcyA6ICcnO1xyXG4gICAgY29uc3QgYXR0cmlidXRlcyA9IGFsbEF0dHJpYnV0ZXMubWFwKGF0dHIgPT4gdGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cikpLmpvaW4oJywnKTtcclxuICAgIGNvbnN0IG9uQ29uZmxpY3REb05vdGhpbmcgPSBvcHRpb25zLmlnbm9yZUR1cGxpY2F0ZXMgPyB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluc2VydHMub25Db25mbGljdERvTm90aGluZyA6ICcnO1xyXG4gICAgbGV0IHJldHVybmluZyA9ICcnO1xyXG5cclxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnJldHVyblZhbHVlcyAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmV0dXJuaW5nKSkge1xyXG4gICAgICBjb25zdCBmaWVsZHMgPSBvcHRpb25zLnJldHVybmluZy5tYXAoZmllbGQgPT4gdGhpcy5xdW90ZUlkZW50aWZpZXIoZmllbGQpKS5qb2luKCcsJyk7XHJcbiAgICAgIHJldHVybmluZyArPSBgIFJFVFVSTklORyAke2ZpZWxkc31gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuaW5nICs9IHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMucmV0dXJuVmFsdWVzICYmIG9wdGlvbnMucmV0dXJuaW5nID8gJyBSRVRVUk5JTkcgKicgOiAnJztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYElOU0VSVCR7aWdub3JlRHVwbGljYXRlc30gSU5UTyAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfSAoJHthdHRyaWJ1dGVzfSkgVkFMVUVTICR7dHVwbGVzLmpvaW4oJywnKX0ke29uRHVwbGljYXRlS2V5VXBkYXRlfSR7b25Db25mbGljdERvTm90aGluZ30ke3JldHVybmluZ307YDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gdXBkYXRlIHF1ZXJ5XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJWYWx1ZUhhc2hcclxuICAgKiBAcGFyYW0ge09iamVjdH0gd2hlcmUgQSBoYXNoIHdpdGggY29uZGl0aW9ucyAoZS5nLiB7bmFtZTogJ2Zvbyd9KSBPUiBhbiBJRCBhcyBpbnRlZ2VyXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlc1xyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICB1cGRhdGVRdWVyeSh0YWJsZU5hbWUsIGF0dHJWYWx1ZUhhc2gsIHdoZXJlLCBvcHRpb25zLCBhdHRyaWJ1dGVzKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIF8uZGVmYXVsdHMob3B0aW9ucywgdGhpcy5vcHRpb25zKTtcclxuXHJcbiAgICBhdHRyVmFsdWVIYXNoID0gVXRpbHMucmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoKGF0dHJWYWx1ZUhhc2gsIG9wdGlvbnMub21pdE51bGwsIG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xyXG4gICAgY29uc3QgYmluZCA9IFtdO1xyXG4gICAgY29uc3QgbW9kZWxBdHRyaWJ1dGVNYXAgPSB7fTtcclxuICAgIGxldCBvdXRwdXRGcmFnbWVudCA9ICcnO1xyXG4gICAgbGV0IHRtcFRhYmxlID0gJyc7IC8vIHRtcFRhYmxlIGRlY2xhcmF0aW9uIGZvciB0cmlnZ2VyXHJcbiAgICBsZXQgc2VsZWN0RnJvbVRtcCA9ICcnOyAvLyBTZWxlY3Qgc3RhdGVtZW50IGZvciB0cmlnZ2VyXHJcbiAgICBsZXQgc3VmZml4ID0gJyc7XHJcblxyXG4gICAgaWYgKF8uZ2V0KHRoaXMsIFsnc2VxdWVsaXplJywgJ29wdGlvbnMnLCAnZGlhbGVjdE9wdGlvbnMnLCAncHJlcGVuZFNlYXJjaFBhdGgnXSkgfHwgb3B0aW9ucy5zZWFyY2hQYXRoKSB7XHJcbiAgICAgIC8vIE5vdCBjdXJyZW50bHkgc3VwcG9ydGVkIHdpdGggc2VhcmNoIHBhdGggKHJlcXVpcmVzIG91dHB1dCBvZiBtdWx0aXBsZSBxdWVyaWVzKVxyXG4gICAgICBvcHRpb25zLmJpbmRQYXJhbSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGJpbmRQYXJhbSA9IG9wdGlvbnMuYmluZFBhcmFtID09PSB1bmRlZmluZWQgPyB0aGlzLmJpbmRQYXJhbShiaW5kKSA6IG9wdGlvbnMuYmluZFBhcmFtO1xyXG5cclxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzWydMSU1JVCBPTiBVUERBVEUnXSAmJiBvcHRpb25zLmxpbWl0KSB7XHJcbiAgICAgIGlmICh0aGlzLmRpYWxlY3QgIT09ICdtc3NxbCcpIHtcclxuICAgICAgICBzdWZmaXggPSBgIExJTUlUICR7dGhpcy5lc2NhcGUob3B0aW9ucy5saW1pdCl9IGA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5yZXR1cm5WYWx1ZXMpIHtcclxuICAgICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMucmV0dXJuVmFsdWVzLm91dHB1dCkge1xyXG4gICAgICAgIC8vIHdlIGFsd2F5cyBuZWVkIHRoaXMgZm9yIG1zc3FsXHJcbiAgICAgICAgb3V0cHV0RnJhZ21lbnQgPSAnIE9VVFBVVCBJTlNFUlRFRC4qJztcclxuXHJcbiAgICAgICAgLy9UbyBjYXB0dXJlIG91dHB1dCByb3dzIHdoZW4gdGhlcmUgaXMgYSB0cmlnZ2VyIG9uIE1TU1FMIERCXHJcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMgJiYgb3B0aW9ucy5oYXNUcmlnZ2VyICYmIHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMudG1wVGFibGVUcmlnZ2VyKSB7XHJcbiAgICAgICAgICBsZXQgdG1wQ29sdW1ucyA9ICcnO1xyXG4gICAgICAgICAgbGV0IG91dHB1dENvbHVtbnMgPSAnJztcclxuXHJcbiAgICAgICAgICBmb3IgKGNvbnN0IG1vZGVsS2V5IGluIGF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1ttb2RlbEtleV07XHJcbiAgICAgICAgICAgIGlmICghKGF0dHJpYnV0ZS50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLlZJUlRVQUwpKSB7XHJcbiAgICAgICAgICAgICAgaWYgKHRtcENvbHVtbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdG1wQ29sdW1ucyArPSAnLCc7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXRDb2x1bW5zICs9ICcsJztcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIHRtcENvbHVtbnMgKz0gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cmlidXRlLmZpZWxkKX0gJHthdHRyaWJ1dGUudHlwZS50b1NxbCgpfWA7XHJcbiAgICAgICAgICAgICAgb3V0cHV0Q29sdW1ucyArPSBgSU5TRVJURUQuJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyaWJ1dGUuZmllbGQpfWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0bXBUYWJsZSA9IGBkZWNsYXJlIEB0bXAgdGFibGUgKCR7dG1wQ29sdW1uc30pOyBgO1xyXG4gICAgICAgICAgb3V0cHV0RnJhZ21lbnQgPSBgIE9VVFBVVCAke291dHB1dENvbHVtbnN9IGludG8gQHRtcGA7XHJcbiAgICAgICAgICBzZWxlY3RGcm9tVG1wID0gJztzZWxlY3QgKiBmcm9tIEB0bXAnO1xyXG5cclxuICAgICAgICAgIHN1ZmZpeCArPSBzZWxlY3RGcm9tVG1wO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnJldHVyblZhbHVlcyAmJiBvcHRpb25zLnJldHVybmluZykge1xyXG4gICAgICAgIC8vIGVuc3VyZSB0aGF0IHRoZSByZXR1cm4gb3V0cHV0IGlzIHByb3Blcmx5IG1hcHBlZCB0byBtb2RlbCBmaWVsZHMuXHJcbiAgICAgICAgb3B0aW9ucy5tYXBUb01vZGVsID0gdHJ1ZTtcclxuICAgICAgICBzdWZmaXggKz0gJyBSRVRVUk5JTkcgKic7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXR0cmlidXRlcykge1xyXG4gICAgICBfLmVhY2goYXR0cmlidXRlcywgKGF0dHJpYnV0ZSwga2V5KSA9PiB7XHJcbiAgICAgICAgbW9kZWxBdHRyaWJ1dGVNYXBba2V5XSA9IGF0dHJpYnV0ZTtcclxuICAgICAgICBpZiAoYXR0cmlidXRlLmZpZWxkKSB7XHJcbiAgICAgICAgICBtb2RlbEF0dHJpYnV0ZU1hcFthdHRyaWJ1dGUuZmllbGRdID0gYXR0cmlidXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0clZhbHVlSGFzaCkge1xyXG4gICAgICBpZiAobW9kZWxBdHRyaWJ1dGVNYXAgJiYgbW9kZWxBdHRyaWJ1dGVNYXBba2V5XSAmJlxyXG4gICAgICAgIG1vZGVsQXR0cmlidXRlTWFwW2tleV0uYXV0b0luY3JlbWVudCA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICF0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmF1dG9JbmNyZW1lbnQudXBkYXRlKSB7XHJcbiAgICAgICAgLy8gbm90IGFsbG93ZWQgdG8gdXBkYXRlIGlkZW50aXR5IGNvbHVtblxyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJWYWx1ZUhhc2hba2V5XTtcclxuXHJcbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCB8fCBvcHRpb25zLmJpbmRQYXJhbSA9PT0gZmFsc2UpIHtcclxuICAgICAgICB2YWx1ZXMucHVzaChgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihrZXkpfT0ke3RoaXMuZXNjYXBlKHZhbHVlLCBtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldIHx8IHVuZGVmaW5lZCwgeyBjb250ZXh0OiAnVVBEQVRFJyB9KX1gKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YWx1ZXMucHVzaChgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihrZXkpfT0ke3RoaXMuZm9ybWF0KHZhbHVlLCBtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldIHx8IHVuZGVmaW5lZCwgeyBjb250ZXh0OiAnVVBEQVRFJyB9LCBiaW5kUGFyYW0pfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgd2hlcmVPcHRpb25zID0gXy5kZWZhdWx0cyh7IGJpbmRQYXJhbSB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBpZiAodmFsdWVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcXVlcnkgPSBgJHt0bXBUYWJsZX1VUERBVEUgJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX0gU0VUICR7dmFsdWVzLmpvaW4oJywnKX0ke291dHB1dEZyYWdtZW50fSAke3RoaXMud2hlcmVRdWVyeSh3aGVyZSwgd2hlcmVPcHRpb25zKX0ke3N1ZmZpeH1gLnRyaW0oKTtcclxuICAgIC8vIFVzZWQgYnkgUG9zdGdyZXMgdXBzZXJ0UXVlcnkgYW5kIGNhbGxzIHRvIGhlcmUgd2l0aCBvcHRpb25zLmV4Y2VwdGlvbiBzZXQgdG8gdHJ1ZVxyXG4gICAgY29uc3QgcmVzdWx0ID0geyBxdWVyeSB9O1xyXG4gICAgaWYgKG9wdGlvbnMuYmluZFBhcmFtICE9PSBmYWxzZSkge1xyXG4gICAgICByZXN1bHQuYmluZCA9IGJpbmQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiB1cGRhdGUgcXVlcnkgdXNpbmcgYXJpdGhtZXRpYyBvcGVyYXRvclxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9wZXJhdG9yICAgICAgU3RyaW5nIHdpdGggdGhlIGFyaXRobWV0aWMgb3BlcmF0b3IgKGUuZy4gJysnIG9yICctJylcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lICAgICBOYW1lIG9mIHRoZSB0YWJsZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyVmFsdWVIYXNoIEEgaGFzaCB3aXRoIGF0dHJpYnV0ZS12YWx1ZS1wYWlyc1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB3aGVyZSAgICAgICAgIEEgaGFzaCB3aXRoIGNvbmRpdGlvbnMgKGUuZy4ge25hbWU6ICdmb28nfSkgT1IgYW4gSUQgYXMgaW50ZWdlclxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXNcclxuICAgKi9cclxuICBhcml0aG1ldGljUXVlcnkob3BlcmF0b3IsIHRhYmxlTmFtZSwgYXR0clZhbHVlSGFzaCwgd2hlcmUsIG9wdGlvbnMsIGF0dHJpYnV0ZXMpIHtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXy5kZWZhdWx0cyhvcHRpb25zLCB7IHJldHVybmluZzogdHJ1ZSB9KTtcclxuXHJcbiAgICBhdHRyVmFsdWVIYXNoID0gVXRpbHMucmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoKGF0dHJWYWx1ZUhhc2gsIHRoaXMub3B0aW9ucy5vbWl0TnVsbCk7XHJcblxyXG4gICAgY29uc3QgdmFsdWVzID0gW107XHJcbiAgICBsZXQgb3V0cHV0RnJhZ21lbnQgPSAnJztcclxuICAgIGxldCByZXR1cm5pbmdGcmFnbWVudCA9ICcnO1xyXG5cclxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnJldHVyblZhbHVlcyAmJiBvcHRpb25zLnJldHVybmluZykge1xyXG4gICAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5yZXR1cm5WYWx1ZXMucmV0dXJuaW5nKSB7XHJcbiAgICAgICAgb3B0aW9ucy5tYXBUb01vZGVsID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm5pbmdGcmFnbWVudCA9ICdSRVRVUk5JTkcgKic7XHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5yZXR1cm5WYWx1ZXMub3V0cHV0KSB7XHJcbiAgICAgICAgb3V0cHV0RnJhZ21lbnQgPSAnIE9VVFBVVCBJTlNFUlRFRC4qJztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJWYWx1ZUhhc2gpIHtcclxuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyVmFsdWVIYXNoW2tleV07XHJcbiAgICAgIHZhbHVlcy5wdXNoKGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGtleSl9PSR7dGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KX0ke29wZXJhdG9yfSAke3RoaXMuZXNjYXBlKHZhbHVlKX1gKTtcclxuICAgIH1cclxuXHJcbiAgICBhdHRyaWJ1dGVzID0gYXR0cmlidXRlcyB8fCB7fTtcclxuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcclxuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGVzW2tleV07XHJcbiAgICAgIHZhbHVlcy5wdXNoKGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGtleSl9PSR7dGhpcy5lc2NhcGUodmFsdWUpfWApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBgVVBEQVRFICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9IFNFVCAke3ZhbHVlcy5qb2luKCcsJyl9JHtvdXRwdXRGcmFnbWVudH0gJHt0aGlzLndoZXJlUXVlcnkod2hlcmUpfSAke3JldHVybmluZ0ZyYWdtZW50fWAudHJpbSgpO1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgIFJldHVybnMgYW4gYWRkIGluZGV4IHF1ZXJ5LlxyXG4gICAgUGFyYW1ldGVyczpcclxuICAgICAgLSB0YWJsZU5hbWUgLT4gTmFtZSBvZiBhbiBleGlzdGluZyB0YWJsZSwgcG9zc2libHkgd2l0aCBzY2hlbWEuXHJcbiAgICAgIC0gb3B0aW9uczpcclxuICAgICAgICAtIHR5cGU6IFVOSVFVRXxGVUxMVEVYVHxTUEFUSUFMXHJcbiAgICAgICAgLSBuYW1lOiBUaGUgbmFtZSBvZiB0aGUgaW5kZXguIERlZmF1bHQgaXMgPHRhYmxlPl88YXR0cjE+XzxhdHRyMj5cclxuICAgICAgICAtIGZpZWxkczogQW4gYXJyYXkgb2YgYXR0cmlidXRlcyBhcyBzdHJpbmcgb3IgYXMgaGFzaC5cclxuICAgICAgICAgICAgICAgICAgSWYgdGhlIGF0dHJpYnV0ZSBpcyBhIGhhc2gsIGl0IG11c3QgaGF2ZSB0aGUgZm9sbG93aW5nIGNvbnRlbnQ6XHJcbiAgICAgICAgICAgICAgICAgIC0gbmFtZTogVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZS9jb2x1bW5cclxuICAgICAgICAgICAgICAgICAgLSBsZW5ndGg6IEFuIGludGVnZXIuIE9wdGlvbmFsXHJcbiAgICAgICAgICAgICAgICAgIC0gb3JkZXI6ICdBU0MnIG9yICdERVNDJy4gT3B0aW9uYWxcclxuICAgICAgICAtIHBhcnNlclxyXG4gICAgICAgIC0gdXNpbmdcclxuICAgICAgICAtIG9wZXJhdG9yXHJcbiAgICAgICAgLSBjb25jdXJyZW50bHk6IFBhc3MgQ09OQ1VSUkVOVCBzbyBvdGhlciBvcGVyYXRpb25zIHJ1biB3aGlsZSB0aGUgaW5kZXggaXMgY3JlYXRlZFxyXG4gICAgICAtIHJhd1RhYmxlbmFtZSwgdGhlIG5hbWUgb2YgdGhlIHRhYmxlLCB3aXRob3V0IHNjaGVtYS4gVXNlZCB0byBjcmVhdGUgdGhlIG5hbWUgb2YgdGhlIGluZGV4XHJcbiAgIEBwcml2YXRlXHJcbiAgKi9cclxuICBhZGRJbmRleFF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcywgb3B0aW9ucywgcmF3VGFibGVuYW1lKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXR0cmlidXRlcykpIHtcclxuICAgICAgb3B0aW9ucyA9IGF0dHJpYnV0ZXM7XHJcbiAgICAgIGF0dHJpYnV0ZXMgPSB1bmRlZmluZWQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvcHRpb25zLmZpZWxkcyA9IGF0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucy5wcmVmaXggPSBvcHRpb25zLnByZWZpeCB8fCByYXdUYWJsZW5hbWUgfHwgdGFibGVOYW1lO1xyXG4gICAgaWYgKG9wdGlvbnMucHJlZml4ICYmIHR5cGVvZiBvcHRpb25zLnByZWZpeCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgb3B0aW9ucy5wcmVmaXggPSBvcHRpb25zLnByZWZpeC5yZXBsYWNlKC9cXC4vZywgJ18nKTtcclxuICAgICAgb3B0aW9ucy5wcmVmaXggPSBvcHRpb25zLnByZWZpeC5yZXBsYWNlKC8oXCJ8JykvZywgJycpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZpZWxkc1NxbCA9IG9wdGlvbnMuZmllbGRzLm1hcChmaWVsZCA9PiB7XHJcbiAgICAgIGlmICh0eXBlb2YgZmllbGQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucXVvdGVJZGVudGlmaWVyKGZpZWxkKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZmllbGQgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2QoZmllbGQpO1xyXG4gICAgICB9XHJcbiAgICAgIGxldCByZXN1bHQgPSAnJztcclxuXHJcbiAgICAgIGlmIChmaWVsZC5hdHRyaWJ1dGUpIHtcclxuICAgICAgICBmaWVsZC5uYW1lID0gZmllbGQuYXR0cmlidXRlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWZpZWxkLm5hbWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBmb2xsb3dpbmcgaW5kZXggZmllbGQgaGFzIG5vIG5hbWU6ICR7dXRpbC5pbnNwZWN0KGZpZWxkKX1gKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmVzdWx0ICs9IHRoaXMucXVvdGVJZGVudGlmaWVyKGZpZWxkLm5hbWUpO1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5kZXguY29sbGF0ZSAmJiBmaWVsZC5jb2xsYXRlKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9IGAgQ09MTEFURSAke3RoaXMucXVvdGVJZGVudGlmaWVyKGZpZWxkLmNvbGxhdGUpfWA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluZGV4Lmxlbmd0aCAmJiBmaWVsZC5sZW5ndGgpIHtcclxuICAgICAgICByZXN1bHQgKz0gYCgke2ZpZWxkLmxlbmd0aH0pYDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZpZWxkLm9yZGVyKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9IGAgJHtmaWVsZC5vcmRlcn1gO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCFvcHRpb25zLm5hbWUpIHtcclxuICAgICAgLy8gTW9zdGx5IGZvciBjYXNlcyB3aGVyZSBhZGRJbmRleCBpcyBjYWxsZWQgZGlyZWN0bHkgYnkgdGhlIHVzZXIgd2l0aG91dCBhbiBvcHRpb25zIG9iamVjdCAoZm9yIGV4YW1wbGUgaW4gbWlncmF0aW9ucylcclxuICAgICAgLy8gQWxsIGNhbGxzIHRoYXQgZ28gdGhyb3VnaCBzZXF1ZWxpemUgc2hvdWxkIGFscmVhZHkgaGF2ZSBhIG5hbWVcclxuICAgICAgb3B0aW9ucyA9IFV0aWxzLm5hbWVJbmRleChvcHRpb25zLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IE1vZGVsLl9jb25mb3JtSW5kZXgob3B0aW9ucyk7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluZGV4LnR5cGUpIHtcclxuICAgICAgZGVsZXRlIG9wdGlvbnMudHlwZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy53aGVyZSkge1xyXG4gICAgICBvcHRpb25zLndoZXJlID0gdGhpcy53aGVyZVF1ZXJ5KG9wdGlvbnMud2hlcmUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgdGFibGVOYW1lID09PSAnc3RyaW5nJykge1xyXG4gICAgICB0YWJsZU5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcnModGFibGVOYW1lKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRhYmxlTmFtZSA9IHRoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbmN1cnJlbnRseSA9IHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5kZXguY29uY3VycmVudGx5ICYmIG9wdGlvbnMuY29uY3VycmVudGx5ID8gJ0NPTkNVUlJFTlRMWScgOiB1bmRlZmluZWQ7XHJcbiAgICBsZXQgaW5kO1xyXG4gICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5kZXhWaWFBbHRlcikge1xyXG4gICAgICBpbmQgPSBbXHJcbiAgICAgICAgJ0FMVEVSIFRBQkxFJyxcclxuICAgICAgICB0YWJsZU5hbWUsXHJcbiAgICAgICAgY29uY3VycmVudGx5LFxyXG4gICAgICAgICdBREQnXHJcbiAgICAgIF07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpbmQgPSBbJ0NSRUFURSddO1xyXG4gICAgfVxyXG5cclxuICAgIGluZCA9IGluZC5jb25jYXQoXHJcbiAgICAgIG9wdGlvbnMudW5pcXVlID8gJ1VOSVFVRScgOiAnJyxcclxuICAgICAgb3B0aW9ucy50eXBlLCAnSU5ERVgnLFxyXG4gICAgICAhdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbmRleFZpYUFsdGVyID8gY29uY3VycmVudGx5IDogdW5kZWZpbmVkLFxyXG4gICAgICB0aGlzLnF1b3RlSWRlbnRpZmllcnMob3B0aW9ucy5uYW1lKSxcclxuICAgICAgdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbmRleC51c2luZyA9PT0gMSAmJiBvcHRpb25zLnVzaW5nID8gYFVTSU5HICR7b3B0aW9ucy51c2luZ31gIDogJycsXHJcbiAgICAgICF0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluZGV4VmlhQWx0ZXIgPyBgT04gJHt0YWJsZU5hbWV9YCA6IHVuZGVmaW5lZCxcclxuICAgICAgdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbmRleC51c2luZyA9PT0gMiAmJiBvcHRpb25zLnVzaW5nID8gYFVTSU5HICR7b3B0aW9ucy51c2luZ31gIDogJycsXHJcbiAgICAgIGAoJHtmaWVsZHNTcWwuam9pbignLCAnKX0ke29wdGlvbnMub3BlcmF0b3IgPyBgICR7b3B0aW9ucy5vcGVyYXRvcn1gIDogJyd9KWAsXHJcbiAgICAgIHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5kZXgucGFyc2VyICYmIG9wdGlvbnMucGFyc2VyID8gYFdJVEggUEFSU0VSICR7b3B0aW9ucy5wYXJzZXJ9YCA6IHVuZGVmaW5lZCxcclxuICAgICAgdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbmRleC53aGVyZSAmJiBvcHRpb25zLndoZXJlID8gb3B0aW9ucy53aGVyZSA6IHVuZGVmaW5lZFxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gXy5jb21wYWN0KGluZCkuam9pbignICcpO1xyXG4gIH1cclxuXHJcbiAgYWRkQ29uc3RyYWludFF1ZXJ5KHRhYmxlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBjb25zdCBjb25zdHJhaW50U25pcHBldCA9IHRoaXMuZ2V0Q29uc3RyYWludFNuaXBwZXQodGFibGVOYW1lLCBvcHRpb25zKTtcclxuXHJcbiAgICBpZiAodHlwZW9mIHRhYmxlTmFtZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgdGFibGVOYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXJzKHRhYmxlTmFtZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0YWJsZU5hbWUgPSB0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYEFMVEVSIFRBQkxFICR7dGFibGVOYW1lfSBBREQgJHtjb25zdHJhaW50U25pcHBldH07YDtcclxuICB9XHJcblxyXG4gIGdldENvbnN0cmFpbnRTbmlwcGV0KHRhYmxlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgbGV0IGNvbnN0cmFpbnRTbmlwcGV0LCBjb25zdHJhaW50TmFtZTtcclxuXHJcbiAgICBjb25zdCBmaWVsZHNTcWwgPSBvcHRpb25zLmZpZWxkcy5tYXAoZmllbGQgPT4ge1xyXG4gICAgICBpZiAodHlwZW9mIGZpZWxkID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnF1b3RlSWRlbnRpZmllcihmaWVsZCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGZpZWxkIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKGZpZWxkKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZmllbGQuYXR0cmlidXRlKSB7XHJcbiAgICAgICAgZmllbGQubmFtZSA9IGZpZWxkLmF0dHJpYnV0ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFmaWVsZC5uYW1lKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgZm9sbG93aW5nIGluZGV4IGZpZWxkIGhhcyBubyBuYW1lOiAke2ZpZWxkfWApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5xdW90ZUlkZW50aWZpZXIoZmllbGQubmFtZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBmaWVsZHNTcWxRdW90ZWRTdHJpbmcgPSBmaWVsZHNTcWwuam9pbignLCAnKTtcclxuICAgIGNvbnN0IGZpZWxkc1NxbFN0cmluZyA9IGZpZWxkc1NxbC5qb2luKCdfJyk7XHJcblxyXG4gICAgc3dpdGNoIChvcHRpb25zLnR5cGUudG9VcHBlckNhc2UoKSkge1xyXG4gICAgICBjYXNlICdVTklRVUUnOlxyXG4gICAgICAgIGNvbnN0cmFpbnROYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXIob3B0aW9ucy5uYW1lIHx8IGAke3RhYmxlTmFtZX1fJHtmaWVsZHNTcWxTdHJpbmd9X3VrYCk7XHJcbiAgICAgICAgY29uc3RyYWludFNuaXBwZXQgPSBgQ09OU1RSQUlOVCAke2NvbnN0cmFpbnROYW1lfSBVTklRVUUgKCR7ZmllbGRzU3FsUXVvdGVkU3RyaW5nfSlgO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdDSEVDSyc6XHJcbiAgICAgICAgb3B0aW9ucy53aGVyZSA9IHRoaXMud2hlcmVJdGVtc1F1ZXJ5KG9wdGlvbnMud2hlcmUpO1xyXG4gICAgICAgIGNvbnN0cmFpbnROYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXIob3B0aW9ucy5uYW1lIHx8IGAke3RhYmxlTmFtZX1fJHtmaWVsZHNTcWxTdHJpbmd9X2NrYCk7XHJcbiAgICAgICAgY29uc3RyYWludFNuaXBwZXQgPSBgQ09OU1RSQUlOVCAke2NvbnN0cmFpbnROYW1lfSBDSEVDSyAoJHtvcHRpb25zLndoZXJlfSlgO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdERUZBVUxUJzpcclxuICAgICAgICBpZiAob3B0aW9ucy5kZWZhdWx0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWZhdWx0IHZhbHVlIG11c3QgYmUgc3BlY2lmZWQgZm9yIERFRkFVTFQgQ09OU1RSQUlOVCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2RpYWxlY3QubmFtZSAhPT0gJ21zc3FsJykge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWZhdWx0IGNvbnN0cmFpbnRzIGFyZSBzdXBwb3J0ZWQgb25seSBmb3IgTVNTUUwgZGlhbGVjdC4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0cmFpbnROYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXIob3B0aW9ucy5uYW1lIHx8IGAke3RhYmxlTmFtZX1fJHtmaWVsZHNTcWxTdHJpbmd9X2RmYCk7XHJcbiAgICAgICAgY29uc3RyYWludFNuaXBwZXQgPSBgQ09OU1RSQUlOVCAke2NvbnN0cmFpbnROYW1lfSBERUZBVUxUICgke3RoaXMuZXNjYXBlKG9wdGlvbnMuZGVmYXVsdFZhbHVlKX0pIEZPUiAke2ZpZWxkc1NxbFswXX1gO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdQUklNQVJZIEtFWSc6XHJcbiAgICAgICAgY29uc3RyYWludE5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihvcHRpb25zLm5hbWUgfHwgYCR7dGFibGVOYW1lfV8ke2ZpZWxkc1NxbFN0cmluZ31fcGtgKTtcclxuICAgICAgICBjb25zdHJhaW50U25pcHBldCA9IGBDT05TVFJBSU5UICR7Y29uc3RyYWludE5hbWV9IFBSSU1BUlkgS0VZICgke2ZpZWxkc1NxbFF1b3RlZFN0cmluZ30pYDtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnRk9SRUlHTiBLRVknOlxyXG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZXMgPSBvcHRpb25zLnJlZmVyZW5jZXM7XHJcbiAgICAgICAgaWYgKCFyZWZlcmVuY2VzIHx8ICFyZWZlcmVuY2VzLnRhYmxlIHx8ICFyZWZlcmVuY2VzLmZpZWxkKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlZmVyZW5jZXMgb2JqZWN0IHdpdGggdGFibGUgYW5kIGZpZWxkIG11c3QgYmUgc3BlY2lmaWVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0cmFpbnROYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXIob3B0aW9ucy5uYW1lIHx8IGAke3RhYmxlTmFtZX1fJHtmaWVsZHNTcWxTdHJpbmd9XyR7cmVmZXJlbmNlcy50YWJsZX1fZmtgKTtcclxuICAgICAgICBjb25zdCByZWZlcmVuY2VzU25pcHBldCA9IGAke3RoaXMucXVvdGVUYWJsZShyZWZlcmVuY2VzLnRhYmxlKX0gKCR7dGhpcy5xdW90ZUlkZW50aWZpZXIocmVmZXJlbmNlcy5maWVsZCl9KWA7XHJcbiAgICAgICAgY29uc3RyYWludFNuaXBwZXQgPSBgQ09OU1RSQUlOVCAke2NvbnN0cmFpbnROYW1lfSBgO1xyXG4gICAgICAgIGNvbnN0cmFpbnRTbmlwcGV0ICs9IGBGT1JFSUdOIEtFWSAoJHtmaWVsZHNTcWxRdW90ZWRTdHJpbmd9KSBSRUZFUkVOQ0VTICR7cmVmZXJlbmNlc1NuaXBwZXR9YDtcclxuICAgICAgICBpZiAob3B0aW9ucy5vblVwZGF0ZSkge1xyXG4gICAgICAgICAgY29uc3RyYWludFNuaXBwZXQgKz0gYCBPTiBVUERBVEUgJHtvcHRpb25zLm9uVXBkYXRlLnRvVXBwZXJDYXNlKCl9YDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMub25EZWxldGUpIHtcclxuICAgICAgICAgIGNvbnN0cmFpbnRTbmlwcGV0ICs9IGAgT04gREVMRVRFICR7b3B0aW9ucy5vbkRlbGV0ZS50b1VwcGVyQ2FzZSgpfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYCR7b3B0aW9ucy50eXBlfSBpcyBpbnZhbGlkLmApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNvbnN0cmFpbnRTbmlwcGV0O1xyXG4gIH1cclxuXHJcbiAgcmVtb3ZlQ29uc3RyYWludFF1ZXJ5KHRhYmxlTmFtZSwgY29uc3RyYWludE5hbWUpIHtcclxuICAgIGlmICh0eXBlb2YgdGFibGVOYW1lID09PSAnc3RyaW5nJykge1xyXG4gICAgICB0YWJsZU5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcnModGFibGVOYW1lKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRhYmxlTmFtZSA9IHRoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBgQUxURVIgVEFCTEUgJHt0YWJsZU5hbWV9IERST1AgQ09OU1RSQUlOVCAke3RoaXMucXVvdGVJZGVudGlmaWVycyhjb25zdHJhaW50TmFtZSl9YDtcclxuICB9XHJcblxyXG4gIC8qXHJcbiAgICBRdW90ZSBhbiBvYmplY3QgYmFzZWQgb24gaXRzIHR5cGUuIFRoaXMgaXMgYSBtb3JlIGdlbmVyYWwgdmVyc2lvbiBvZiBxdW90ZUlkZW50aWZpZXJzXHJcbiAgICBTdHJpbmdzOiBzaG91bGQgcHJveHkgdG8gcXVvdGVJZGVudGlmaWVyc1xyXG4gICAgQXJyYXlzOlxyXG4gICAgICAqIEV4cGVjdHMgYXJyYXkgaW4gdGhlIGZvcm06IFs8bW9kZWw+IChvcHRpb25hbCksIDxtb2RlbD4gKG9wdGlvbmFsKSwuLi4gU3RyaW5nLCBTdHJpbmcgKG9wdGlvbmFsKV1cclxuICAgICAgICBFYWNoIDxtb2RlbD4gY2FuIGJlIGEgbW9kZWwsIG9yIGFuIG9iamVjdCB7bW9kZWw6IE1vZGVsLCBhczogU3RyaW5nfSwgbWF0Y2hpbmcgaW5jbHVkZSwgb3IgYW5cclxuICAgICAgICBhc3NvY2lhdGlvbiBvYmplY3QsIG9yIHRoZSBuYW1lIG9mIGFuIGFzc29jaWF0aW9uLlxyXG4gICAgICAqIFplcm8gb3IgbW9yZSBtb2RlbHMgY2FuIGJlIGluY2x1ZGVkIGluIHRoZSBhcnJheSBhbmQgYXJlIHVzZWQgdG8gdHJhY2UgYSBwYXRoIHRocm91Z2ggdGhlIHRyZWUgb2ZcclxuICAgICAgICBpbmNsdWRlZCBuZXN0ZWQgYXNzb2NpYXRpb25zLiBUaGlzIHByb2R1Y2VzIHRoZSBjb3JyZWN0IHRhYmxlIG5hbWUgZm9yIHRoZSBPUkRFUiBCWS9HUk9VUCBCWSBTUUxcclxuICAgICAgICBhbmQgcXVvdGVzIGl0LlxyXG4gICAgICAqIElmIGEgc2luZ2xlIHN0cmluZyBpcyBhcHBlbmRlZCB0byBlbmQgb2YgYXJyYXksIGl0IGlzIHF1b3RlZC5cclxuICAgICAgICBJZiB0d28gc3RyaW5ncyBhcHBlbmRlZCwgdGhlIDFzdCBzdHJpbmcgaXMgcXVvdGVkLCB0aGUgMm5kIHN0cmluZyB1bnF1b3RlZC5cclxuICAgIE9iamVjdHM6XHJcbiAgICAgICogSWYgcmF3IGlzIHNldCwgdGhhdCB2YWx1ZSBzaG91bGQgYmUgcmV0dXJuZWQgdmVyYmF0aW0sIHdpdGhvdXQgcXVvdGluZ1xyXG4gICAgICAqIElmIGZuIGlzIHNldCwgdGhlIHN0cmluZyBzaG91bGQgc3RhcnQgd2l0aCB0aGUgdmFsdWUgb2YgZm4sIHN0YXJ0aW5nIHBhcmVuLCBmb2xsb3dlZCBieVxyXG4gICAgICAgIHRoZSB2YWx1ZXMgb2YgY29scyAod2hpY2ggaXMgYXNzdW1lZCB0byBiZSBhbiBhcnJheSksIHF1b3RlZCBhbmQgam9pbmVkIHdpdGggJywgJyxcclxuICAgICAgICB1bmxlc3MgdGhleSBhcmUgdGhlbXNlbHZlcyBvYmplY3RzXHJcbiAgICAgICogSWYgZGlyZWN0aW9uIGlzIHNldCwgc2hvdWxkIGJlIHByZXBlbmRlZFxyXG5cclxuICAgIEN1cnJlbnRseSB0aGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCBmb3Igb3JkZXJpbmcgLyBncm91cGluZyBjb2x1bW5zIGFuZCBTZXF1ZWxpemUuY29sKCksIGJ1dCBpdCBjb3VsZFxyXG4gICAgcG90ZW50aWFsbHkgYWxzbyBiZSB1c2VkIGZvciBvdGhlciBwbGFjZXMgd2hlcmUgd2Ugd2FudCB0byBiZSBhYmxlIHRvIGNhbGwgU1FMIGZ1bmN0aW9ucyAoZS5nLiBhcyBkZWZhdWx0IHZhbHVlcylcclxuICAgQHByaXZhdGVcclxuICAqL1xyXG4gIHF1b3RlKGNvbGxlY3Rpb24sIHBhcmVudCwgY29ubmVjdG9yKSB7XHJcbiAgICAvLyBpbml0XHJcbiAgICBjb25zdCB2YWxpZE9yZGVyT3B0aW9ucyA9IFtcclxuICAgICAgJ0FTQycsXHJcbiAgICAgICdERVNDJyxcclxuICAgICAgJ0FTQyBOVUxMUyBMQVNUJyxcclxuICAgICAgJ0RFU0MgTlVMTFMgTEFTVCcsXHJcbiAgICAgICdBU0MgTlVMTFMgRklSU1QnLFxyXG4gICAgICAnREVTQyBOVUxMUyBGSVJTVCcsXHJcbiAgICAgICdOVUxMUyBGSVJTVCcsXHJcbiAgICAgICdOVUxMUyBMQVNUJ1xyXG4gICAgXTtcclxuXHJcbiAgICAvLyBkZWZhdWx0XHJcbiAgICBjb25uZWN0b3IgPSBjb25uZWN0b3IgfHwgJy4nO1xyXG5cclxuICAgIC8vIGp1c3QgcXVvdGUgYXMgaWRlbnRpZmllcnMgaWYgc3RyaW5nXHJcbiAgICBpZiAodHlwZW9mIGNvbGxlY3Rpb24gPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnF1b3RlSWRlbnRpZmllcnMoY29sbGVjdGlvbik7XHJcbiAgICB9XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjb2xsZWN0aW9uKSkge1xyXG4gICAgICAvLyBpdGVyYXRlIHRocm91Z2ggdGhlIGNvbGxlY3Rpb24gYW5kIG11dGF0ZSBvYmplY3RzIGludG8gYXNzb2NpYXRpb25zXHJcbiAgICAgIGNvbGxlY3Rpb24uZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHtcclxuICAgICAgICBjb25zdCBwcmV2aW91cyA9IGNvbGxlY3Rpb25baW5kZXggLSAxXTtcclxuICAgICAgICBsZXQgcHJldmlvdXNBc3NvY2lhdGlvbjtcclxuICAgICAgICBsZXQgcHJldmlvdXNNb2RlbDtcclxuXHJcbiAgICAgICAgLy8gc2V0IHRoZSBwcmV2aW91cyBhcyB0aGUgcGFyZW50IHdoZW4gcHJldmlvdXMgaXMgdW5kZWZpbmVkIG9yIHRoZSB0YXJnZXQgb2YgdGhlIGFzc29jaWF0aW9uXHJcbiAgICAgICAgaWYgKCFwcmV2aW91cyAmJiBwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcHJldmlvdXNNb2RlbCA9IHBhcmVudDtcclxuICAgICAgICB9IGVsc2UgaWYgKHByZXZpb3VzICYmIHByZXZpb3VzIGluc3RhbmNlb2YgQXNzb2NpYXRpb24pIHtcclxuICAgICAgICAgIHByZXZpb3VzQXNzb2NpYXRpb24gPSBwcmV2aW91cztcclxuICAgICAgICAgIHByZXZpb3VzTW9kZWwgPSBwcmV2aW91cy50YXJnZXQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpZiB0aGUgcHJldmlvdXMgaXRlbSBpcyBhIG1vZGVsLCB0aGVuIGF0dGVtcHQgZ2V0dGluZyBhbiBhc3NvY2lhdGlvblxyXG4gICAgICAgIGlmIChwcmV2aW91c01vZGVsICYmIHByZXZpb3VzTW9kZWwucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICAgIGxldCBtb2RlbDtcclxuICAgICAgICAgIGxldCBhcztcclxuXHJcbiAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdmdW5jdGlvbicgJiYgaXRlbS5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgICAgICAvLyBzZXRcclxuICAgICAgICAgICAgbW9kZWwgPSBpdGVtO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChfLmlzUGxhaW5PYmplY3QoaXRlbSkgJiYgaXRlbS5tb2RlbCAmJiBpdGVtLm1vZGVsLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcbiAgICAgICAgICAgIC8vIHNldFxyXG4gICAgICAgICAgICBtb2RlbCA9IGl0ZW0ubW9kZWw7XHJcbiAgICAgICAgICAgIGFzID0gaXRlbS5hcztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgLy8gc2V0IHRoZSBhcyB0byBlaXRoZXIgdGhlIHRocm91Z2ggbmFtZSBvciB0aGUgbW9kZWwgbmFtZVxyXG4gICAgICAgICAgICBpZiAoIWFzICYmIHByZXZpb3VzQXNzb2NpYXRpb24gJiYgcHJldmlvdXNBc3NvY2lhdGlvbiBpbnN0YW5jZW9mIEFzc29jaWF0aW9uICYmIHByZXZpb3VzQXNzb2NpYXRpb24udGhyb3VnaCAmJiBwcmV2aW91c0Fzc29jaWF0aW9uLnRocm91Z2gubW9kZWwgPT09IG1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgLy8gZ2V0IGZyb20gcHJldmlvdXMgYXNzb2NpYXRpb25cclxuICAgICAgICAgICAgICBpdGVtID0gbmV3IEFzc29jaWF0aW9uKHByZXZpb3VzTW9kZWwsIG1vZGVsLCB7XHJcbiAgICAgICAgICAgICAgICBhczogbW9kZWwubmFtZVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vIGdldCBhc3NvY2lhdGlvbiBmcm9tIHByZXZpb3VzIG1vZGVsXHJcbiAgICAgICAgICAgICAgaXRlbSA9IHByZXZpb3VzTW9kZWwuZ2V0QXNzb2NpYXRpb25Gb3JBbGlhcyhtb2RlbCwgYXMpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBhdHRlbXB0IHRvIHVzZSB0aGUgbW9kZWwgbmFtZSBpZiB0aGUgaXRlbSBpcyBzdGlsbCBudWxsXHJcbiAgICAgICAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtID0gcHJldmlvdXNNb2RlbC5nZXRBc3NvY2lhdGlvbkZvckFsaWFzKG1vZGVsLCBtb2RlbC5uYW1lKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBoYXZlIGFuIGFzc29jaWF0aW9uXHJcbiAgICAgICAgICAgIGlmICghKGl0ZW0gaW5zdGFuY2VvZiBBc3NvY2lhdGlvbikpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodXRpbC5mb3JtYXQoJ1VuYWJsZSB0byBmaW5kIGEgdmFsaWQgYXNzb2NpYXRpb24gZm9yIG1vZGVsLCBcXCclc1xcJycsIG1vZGVsLm5hbWUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgLy8gZ2V0IG9yZGVyIGluZGV4XHJcbiAgICAgICAgICBjb25zdCBvcmRlckluZGV4ID0gdmFsaWRPcmRlck9wdGlvbnMuaW5kZXhPZihpdGVtLnRvVXBwZXJDYXNlKCkpO1xyXG5cclxuICAgICAgICAgIC8vIHNlZSBpZiB0aGlzIGlzIGFuIG9yZGVyXHJcbiAgICAgICAgICBpZiAoaW5kZXggPiAwICYmIG9yZGVySW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgIGl0ZW0gPSB0aGlzLnNlcXVlbGl6ZS5saXRlcmFsKGAgJHt2YWxpZE9yZGVyT3B0aW9uc1tvcmRlckluZGV4XX1gKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAocHJldmlvdXNNb2RlbCAmJiBwcmV2aW91c01vZGVsLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcbiAgICAgICAgICAgIC8vIG9ubHkgZ28gZG93biB0aGlzIHBhdGggaWYgd2UgaGF2ZSBwcmVpdm91cyBtb2RlbCBhbmQgY2hlY2sgb25seSBvbmNlXHJcbiAgICAgICAgICAgIGlmIChwcmV2aW91c01vZGVsLmFzc29jaWF0aW9ucyAhPT0gdW5kZWZpbmVkICYmIHByZXZpb3VzTW9kZWwuYXNzb2NpYXRpb25zW2l0ZW1dKSB7XHJcbiAgICAgICAgICAgICAgLy8gY29udmVydCB0aGUgaXRlbSB0byBhbiBhc3NvY2lhdGlvblxyXG4gICAgICAgICAgICAgIGl0ZW0gPSBwcmV2aW91c01vZGVsLmFzc29jaWF0aW9uc1tpdGVtXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChwcmV2aW91c01vZGVsLnJhd0F0dHJpYnV0ZXMgIT09IHVuZGVmaW5lZCAmJiBwcmV2aW91c01vZGVsLnJhd0F0dHJpYnV0ZXNbaXRlbV0gJiYgaXRlbSAhPT0gcHJldmlvdXNNb2RlbC5yYXdBdHRyaWJ1dGVzW2l0ZW1dLmZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgLy8gY29udmVydCB0aGUgaXRlbSBhdHRyaWJ1dGUgZnJvbSBpdHMgYWxpYXNcclxuICAgICAgICAgICAgICBpdGVtID0gcHJldmlvdXNNb2RlbC5yYXdBdHRyaWJ1dGVzW2l0ZW1dLmZpZWxkO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgICAgIGl0ZW0uaW5jbHVkZXMoJy4nKVxyXG4gICAgICAgICAgICAgICYmIHByZXZpb3VzTW9kZWwucmF3QXR0cmlidXRlcyAhPT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGl0ZW1TcGxpdCA9IGl0ZW0uc3BsaXQoJy4nKTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKHByZXZpb3VzTW9kZWwucmF3QXR0cmlidXRlc1tpdGVtU3BsaXRbMF1dLnR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuSlNPTikge1xyXG4gICAgICAgICAgICAgICAgLy8ganVzdCBxdW90ZSBpZGVudGlmaWVycyBmb3Igbm93XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpZGVudGlmaWVyID0gdGhpcy5xdW90ZUlkZW50aWZpZXJzKGAke3ByZXZpb3VzTW9kZWwubmFtZX0uJHtwcmV2aW91c01vZGVsLnJhd0F0dHJpYnV0ZXNbaXRlbVNwbGl0WzBdXS5maWVsZH1gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgcGF0aFxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGl0ZW1TcGxpdC5zbGljZSgxKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBleHRyYWN0IHBhdGhcclxuICAgICAgICAgICAgICAgIGl0ZW0gPSB0aGlzLmpzb25QYXRoRXh0cmFjdGlvblF1ZXJ5KGlkZW50aWZpZXIsIHBhdGgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGxpdGVyYWwgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRvIGFwcGVuZCB0aGUgbW9kZWwgbmFtZSB3aGVuIHN0cmluZ1xyXG4gICAgICAgICAgICAgICAgaXRlbSA9IHRoaXMuc2VxdWVsaXplLmxpdGVyYWwoaXRlbSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb2xsZWN0aW9uW2luZGV4XSA9IGl0ZW07XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgLy8gbG9vcCB0aHJvdWdoIGFycmF5LCBhZGRpbmcgdGFibGUgbmFtZXMgb2YgbW9kZWxzIHRvIHF1b3RlZFxyXG4gICAgICBjb25zdCBjb2xsZWN0aW9uTGVuZ3RoID0gY29sbGVjdGlvbi5sZW5ndGg7XHJcbiAgICAgIGNvbnN0IHRhYmxlTmFtZXMgPSBbXTtcclxuICAgICAgbGV0IGl0ZW07XHJcbiAgICAgIGxldCBpID0gMDtcclxuXHJcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBjb2xsZWN0aW9uTGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgaXRlbSA9IGNvbGxlY3Rpb25baV07XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJyB8fCBpdGVtLl9tb2RlbEF0dHJpYnV0ZSB8fCBpdGVtIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0gaW5zdGFuY2VvZiBBc3NvY2lhdGlvbikge1xyXG4gICAgICAgICAgdGFibGVOYW1lc1tpXSA9IGl0ZW0uYXM7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzdGFydCBidWlsZGluZyBzcWxcclxuICAgICAgbGV0IHNxbCA9ICcnO1xyXG5cclxuICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgc3FsICs9IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKHRhYmxlTmFtZXMuam9pbihjb25uZWN0b3IpKX0uYDtcclxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY29sbGVjdGlvblswXSA9PT0gJ3N0cmluZycgJiYgcGFyZW50KSB7XHJcbiAgICAgICAgc3FsICs9IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKHBhcmVudC5uYW1lKX0uYDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gbG9vcCB0aHJvdWdoIGV2ZXJ5dGhpbmcgcGFzdCBpIGFuZCBhcHBlbmQgdG8gdGhlIHNxbFxyXG4gICAgICBjb2xsZWN0aW9uLnNsaWNlKGkpLmZvckVhY2goY29sbGVjdGlvbkl0ZW0gPT4ge1xyXG4gICAgICAgIHNxbCArPSB0aGlzLnF1b3RlKGNvbGxlY3Rpb25JdGVtLCBwYXJlbnQsIGNvbm5lY3Rvcik7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHNxbDtcclxuICAgIH1cclxuICAgIGlmIChjb2xsZWN0aW9uLl9tb2RlbEF0dHJpYnV0ZSkge1xyXG4gICAgICByZXR1cm4gYCR7dGhpcy5xdW90ZVRhYmxlKGNvbGxlY3Rpb24uTW9kZWwubmFtZSl9LiR7dGhpcy5xdW90ZUlkZW50aWZpZXIoY29sbGVjdGlvbi5maWVsZE5hbWUpfWA7XHJcbiAgICB9XHJcbiAgICBpZiAoY29sbGVjdGlvbiBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2QoY29sbGVjdGlvbik7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGNvbGxlY3Rpb24pICYmIGNvbGxlY3Rpb24ucmF3KSB7XHJcbiAgICAgIC8vIHNpbXBsZSBvYmplY3RzIHdpdGggcmF3IGlzIG5vIGxvbmdlciBzdXBwb3J0ZWRcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgYHtyYXc6IFwiLi4uXCJ9YCBzeW50YXggaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC4gIFVzZSBgc2VxdWVsaXplLmxpdGVyYWxgIGluc3RlYWQuJyk7XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gc3RydWN0dXJlIHBhc3NlZCB0byBvcmRlciAvIGdyb3VwOiAke3V0aWwuaW5zcGVjdChjb2xsZWN0aW9uKX1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNwbGl0IGEgbGlzdCBvZiBpZGVudGlmaWVycyBieSBcIi5cIiBhbmQgcXVvdGUgZWFjaCBwYXJ0XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWRlbnRpZmllclxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2VcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgcXVvdGVJZGVudGlmaWVyKGlkZW50aWZpZXIsIGZvcmNlKSB7XHJcbiAgICByZXR1cm4gUXVvdGVIZWxwZXIucXVvdGVJZGVudGlmaWVyKHRoaXMuZGlhbGVjdCwgaWRlbnRpZmllciwge1xyXG4gICAgICBmb3JjZSxcclxuICAgICAgcXVvdGVJZGVudGlmaWVyczogdGhpcy5vcHRpb25zLnF1b3RlSWRlbnRpZmllcnNcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcXVvdGVJZGVudGlmaWVycyhpZGVudGlmaWVycykge1xyXG4gICAgaWYgKGlkZW50aWZpZXJzLmluY2x1ZGVzKCcuJykpIHtcclxuICAgICAgaWRlbnRpZmllcnMgPSBpZGVudGlmaWVycy5zcGxpdCgnLicpO1xyXG5cclxuICAgICAgY29uc3QgaGVhZCA9IGlkZW50aWZpZXJzLnNsaWNlKDAsIGlkZW50aWZpZXJzLmxlbmd0aCAtIDEpLmpvaW4oJy0+Jyk7XHJcbiAgICAgIGNvbnN0IHRhaWwgPSBpZGVudGlmaWVyc1tpZGVudGlmaWVycy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgIHJldHVybiBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihoZWFkKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcih0YWlsKX1gO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLnF1b3RlSWRlbnRpZmllcihpZGVudGlmaWVycyk7XHJcbiAgfVxyXG5cclxuICBxdW90ZUF0dHJpYnV0ZShhdHRyaWJ1dGUsIG1vZGVsKSB7XHJcbiAgICBpZiAobW9kZWwgJiYgYXR0cmlidXRlIGluIG1vZGVsLnJhd0F0dHJpYnV0ZXMpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucXVvdGVJZGVudGlmaWVyKGF0dHJpYnV0ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5xdW90ZUlkZW50aWZpZXJzKGF0dHJpYnV0ZSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBRdW90ZSB0YWJsZSBuYW1lIHdpdGggb3B0aW9uYWwgYWxpYXMgYW5kIHNjaGVtYSBhdHRyaWJ1dGlvblxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSAgcGFyYW0gdGFibGUgc3RyaW5nIG9yIG9iamVjdFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IGFsaWFzIGFsaWFzIG5hbWVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgcXVvdGVUYWJsZShwYXJhbSwgYWxpYXMpIHtcclxuICAgIGxldCB0YWJsZSA9ICcnO1xyXG5cclxuICAgIGlmIChhbGlhcyA9PT0gdHJ1ZSkge1xyXG4gICAgICBhbGlhcyA9IHBhcmFtLmFzIHx8IHBhcmFtLm5hbWUgfHwgcGFyYW07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKF8uaXNPYmplY3QocGFyYW0pKSB7XHJcbiAgICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnNjaGVtYXMpIHtcclxuICAgICAgICBpZiAocGFyYW0uc2NoZW1hKSB7XHJcbiAgICAgICAgICB0YWJsZSArPSBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihwYXJhbS5zY2hlbWEpfS5gO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGFibGUgKz0gdGhpcy5xdW90ZUlkZW50aWZpZXIocGFyYW0udGFibGVOYW1lKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAocGFyYW0uc2NoZW1hKSB7XHJcbiAgICAgICAgICB0YWJsZSArPSBwYXJhbS5zY2hlbWEgKyAocGFyYW0uZGVsaW1pdGVyIHx8ICcuJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0YWJsZSArPSBwYXJhbS50YWJsZU5hbWU7XHJcbiAgICAgICAgdGFibGUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcih0YWJsZSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRhYmxlID0gdGhpcy5xdW90ZUlkZW50aWZpZXIocGFyYW0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhbGlhcykge1xyXG4gICAgICB0YWJsZSArPSBgIEFTICR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYWxpYXMpfWA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRhYmxlO1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgIEVzY2FwZSBhIHZhbHVlIChlLmcuIGEgc3RyaW5nLCBudW1iZXIgb3IgZGF0ZSlcclxuICAgIEBwcml2YXRlXHJcbiAgKi9cclxuICBlc2NhcGUodmFsdWUsIGZpZWxkLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2QodmFsdWUpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChmaWVsZCAmJiBmaWVsZC50eXBlKSB7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0ZSh2YWx1ZSwgZmllbGQsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBpZiAoZmllbGQudHlwZS5zdHJpbmdpZnkpIHtcclxuICAgICAgICAgIC8vIFVzZXJzIHNob3VsZG4ndCBoYXZlIHRvIHdvcnJ5IGFib3V0IHRoZXNlIGFyZ3MgLSBqdXN0IGdpdmUgdGhlbSBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBzaW5nbGUgYXJnXHJcbiAgICAgICAgICBjb25zdCBzaW1wbGVFc2NhcGUgPSBlc2NWYWwgPT4gU3FsU3RyaW5nLmVzY2FwZShlc2NWYWwsIHRoaXMub3B0aW9ucy50aW1lem9uZSwgdGhpcy5kaWFsZWN0KTtcclxuXHJcbiAgICAgICAgICB2YWx1ZSA9IGZpZWxkLnR5cGUuc3RyaW5naWZ5KHZhbHVlLCB7IGVzY2FwZTogc2ltcGxlRXNjYXBlLCBmaWVsZCwgdGltZXpvbmU6IHRoaXMub3B0aW9ucy50aW1lem9uZSwgb3BlcmF0aW9uOiBvcHRpb25zLm9wZXJhdGlvbiB9KTtcclxuXHJcbiAgICAgICAgICBpZiAoZmllbGQudHlwZS5lc2NhcGUgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSBkYXRhLXR5cGUgYWxyZWFkeSBkaWQgdGhlIHJlcXVpcmVkIGVzY2FwaW5nXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gU3FsU3RyaW5nLmVzY2FwZSh2YWx1ZSwgdGhpcy5vcHRpb25zLnRpbWV6b25lLCB0aGlzLmRpYWxlY3QpO1xyXG4gIH1cclxuXHJcbiAgYmluZFBhcmFtKGJpbmQpIHtcclxuICAgIHJldHVybiB2YWx1ZSA9PiB7XHJcbiAgICAgIGJpbmQucHVzaCh2YWx1ZSk7XHJcbiAgICAgIHJldHVybiBgJCR7YmluZC5sZW5ndGh9YDtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgUmV0dXJucyBhIGJpbmQgcGFyYW1ldGVyIHJlcHJlc2VudGF0aW9uIG9mIGEgdmFsdWUgKGUuZy4gYSBzdHJpbmcsIG51bWJlciBvciBkYXRlKVxyXG4gICAgQHByaXZhdGVcclxuICAqL1xyXG4gIGZvcm1hdCh2YWx1ZSwgZmllbGQsIG9wdGlvbnMsIGJpbmRQYXJhbSkge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcGFzcyBTZXF1ZWxpemVNZXRob2QgYXMgYSBiaW5kIHBhcmFtZXRlciAtIHVzZSBlc2NhcGUgaW5zdGVhZCcpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChmaWVsZCAmJiBmaWVsZC50eXBlKSB7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0ZSh2YWx1ZSwgZmllbGQsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBpZiAoZmllbGQudHlwZS5iaW5kUGFyYW0pIHtcclxuICAgICAgICAgIHJldHVybiBmaWVsZC50eXBlLmJpbmRQYXJhbSh2YWx1ZSwgeyBlc2NhcGU6IF8uaWRlbnRpdHksIGZpZWxkLCB0aW1lem9uZTogdGhpcy5vcHRpb25zLnRpbWV6b25lLCBvcGVyYXRpb246IG9wdGlvbnMub3BlcmF0aW9uLCBiaW5kUGFyYW0gfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJpbmRQYXJhbSh2YWx1ZSk7XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgVmFsaWRhdGUgYSB2YWx1ZSBhZ2FpbnN0IGEgZmllbGQgc3BlY2lmaWNhdGlvblxyXG4gICAgQHByaXZhdGVcclxuICAqL1xyXG4gIHZhbGlkYXRlKHZhbHVlLCBmaWVsZCwgb3B0aW9ucykge1xyXG4gICAgaWYgKHRoaXMudHlwZVZhbGlkYXRpb24gJiYgZmllbGQudHlwZS52YWxpZGF0ZSAmJiB2YWx1ZSkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmIChvcHRpb25zLmlzTGlzdCAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGZpZWxkLnR5cGUudmFsaWRhdGUoaXRlbSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGZpZWxkLnR5cGUudmFsaWRhdGUodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBzZXF1ZWxpemVFcnJvci5WYWxpZGF0aW9uRXJyb3IpIHtcclxuICAgICAgICAgIGVycm9yLmVycm9ycy5wdXNoKG5ldyBzZXF1ZWxpemVFcnJvci5WYWxpZGF0aW9uRXJyb3JJdGVtKFxyXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlLFxyXG4gICAgICAgICAgICAnVmFsaWRhdGlvbiBlcnJvcicsXHJcbiAgICAgICAgICAgIGZpZWxkLmZpZWxkTmFtZSxcclxuICAgICAgICAgICAgdmFsdWUsXHJcbiAgICAgICAgICAgIG51bGwsXHJcbiAgICAgICAgICAgIGAke2ZpZWxkLnR5cGUua2V5fSB2YWxpZGF0b3JgXHJcbiAgICAgICAgICApKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc0lkZW50aWZpZXJRdW90ZWQoaWRlbnRpZmllcikge1xyXG4gICAgcmV0dXJuIFF1b3RlSGVscGVyLmlzSWRlbnRpZmllclF1b3RlZChpZGVudGlmaWVyKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYXRlcyBhbiBTUUwgcXVlcnkgdGhhdCBleHRyYWN0IEpTT04gcHJvcGVydHkgb2YgZ2l2ZW4gcGF0aC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSAgIHtzdHJpbmd9ICAgICAgICAgICAgICAgY29sdW1uICBUaGUgSlNPTiBjb2x1bW5cclxuICAgKiBAcGFyYW0gICB7c3RyaW5nfEFycmF5PHN0cmluZz59IFtwYXRoXSAgVGhlIHBhdGggdG8gZXh0cmFjdCAob3B0aW9uYWwpXHJcbiAgICogQHJldHVybnMge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgIFRoZSBnZW5lcmF0ZWQgc3FsIHF1ZXJ5XHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBqc29uUGF0aEV4dHJhY3Rpb25RdWVyeShjb2x1bW4sIHBhdGgpIHtcclxuICAgIGxldCBwYXRocyA9IF8udG9QYXRoKHBhdGgpO1xyXG4gICAgbGV0IHBhdGhTdHI7XHJcbiAgICBjb25zdCBxdW90ZWRDb2x1bW4gPSB0aGlzLmlzSWRlbnRpZmllclF1b3RlZChjb2x1bW4pXHJcbiAgICAgID8gY29sdW1uXHJcbiAgICAgIDogdGhpcy5xdW90ZUlkZW50aWZpZXIoY29sdW1uKTtcclxuXHJcbiAgICBzd2l0Y2ggKHRoaXMuZGlhbGVjdCkge1xyXG4gICAgICBjYXNlICdteXNxbCc6XHJcbiAgICAgIGNhc2UgJ21hcmlhZGInOlxyXG4gICAgICBjYXNlICdzcWxpdGUnOlxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIE5vbiBkaWdpdCBzdWIgcGF0aHMgbmVlZCB0byBiZSBxdW90ZWQgYXMgRUNNQVNjcmlwdCBpZGVudGlmaWVyc1xyXG4gICAgICAgICAqIGh0dHBzOi8vYnVncy5teXNxbC5jb20vYnVnLnBocD9pZD04MTg5NlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlmICh0aGlzLmRpYWxlY3QgPT09ICdteXNxbCcpIHtcclxuICAgICAgICAgIHBhdGhzID0gcGF0aHMubWFwKHN1YlBhdGggPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gL1xcRC8udGVzdChzdWJQYXRoKVxyXG4gICAgICAgICAgICAgID8gVXRpbHMuYWRkVGlja3Moc3ViUGF0aCwgJ1wiJylcclxuICAgICAgICAgICAgICA6IHN1YlBhdGg7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhdGhTdHIgPSB0aGlzLmVzY2FwZShbJyQnXVxyXG4gICAgICAgICAgLmNvbmNhdChwYXRocylcclxuICAgICAgICAgIC5qb2luKCcuJylcclxuICAgICAgICAgIC5yZXBsYWNlKC9cXC4oXFxkKykoPzooPz1cXC4pfCQpL2csIChfXywgZGlnaXQpID0+IGBbJHtkaWdpdH1dYCkpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5kaWFsZWN0ID09PSAnc3FsaXRlJykge1xyXG4gICAgICAgICAgcmV0dXJuIGBqc29uX2V4dHJhY3QoJHtxdW90ZWRDb2x1bW59LCR7cGF0aFN0cn0pYDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBganNvbl91bnF1b3RlKGpzb25fZXh0cmFjdCgke3F1b3RlZENvbHVtbn0sJHtwYXRoU3RyfSkpYDtcclxuXHJcbiAgICAgIGNhc2UgJ3Bvc3RncmVzJzpcclxuICAgICAgICBwYXRoU3RyID0gdGhpcy5lc2NhcGUoYHske3BhdGhzLmpvaW4oJywnKX19YCk7XHJcbiAgICAgICAgcmV0dXJuIGAoJHtxdW90ZWRDb2x1bW59Iz4+JHtwYXRoU3RyfSlgO1xyXG5cclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkICR7dGhpcy5kaWFsZWN0fSBmb3IgSlNPTiBvcGVyYXRpb25zYCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgUmV0dXJucyBhIHF1ZXJ5IGZvciBzZWxlY3RpbmcgZWxlbWVudHMgaW4gdGhlIHRhYmxlIDx0YWJsZU5hbWU+LlxyXG4gICAgT3B0aW9uczpcclxuICAgICAgLSBhdHRyaWJ1dGVzIC0+IEFuIGFycmF5IG9mIGF0dHJpYnV0ZXMgKGUuZy4gWyduYW1lJywgJ2JpcnRoZGF5J10pLiBEZWZhdWx0OiAqXHJcbiAgICAgIC0gd2hlcmUgLT4gQSBoYXNoIHdpdGggY29uZGl0aW9ucyAoZS5nLiB7bmFtZTogJ2Zvbyd9KVxyXG4gICAgICAgICAgICAgICAgIE9SIGFuIElEIGFzIGludGVnZXJcclxuICAgICAgLSBvcmRlciAtPiBlLmcuICdpZCBERVNDJ1xyXG4gICAgICAtIGdyb3VwXHJcbiAgICAgIC0gbGltaXQgLT4gVGhlIG1heGltdW0gY291bnQgeW91IHdhbnQgdG8gZ2V0LlxyXG4gICAgICAtIG9mZnNldCAtPiBBbiBvZmZzZXQgdmFsdWUgdG8gc3RhcnQgZnJvbS4gT25seSB1c2VhYmxlIHdpdGggbGltaXQhXHJcbiAgIEBwcml2YXRlXHJcbiAgKi9cclxuICBzZWxlY3RRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMsIG1vZGVsKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIGNvbnN0IGxpbWl0ID0gb3B0aW9ucy5saW1pdDtcclxuICAgIGNvbnN0IG1haW5RdWVyeUl0ZW1zID0gW107XHJcbiAgICBjb25zdCBzdWJRdWVyeUl0ZW1zID0gW107XHJcbiAgICBjb25zdCBzdWJRdWVyeSA9IG9wdGlvbnMuc3ViUXVlcnkgPT09IHVuZGVmaW5lZCA/IGxpbWl0ICYmIG9wdGlvbnMuaGFzTXVsdGlBc3NvY2lhdGlvbiA6IG9wdGlvbnMuc3ViUXVlcnk7XHJcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0ge1xyXG4gICAgICBtYWluOiBvcHRpb25zLmF0dHJpYnV0ZXMgJiYgb3B0aW9ucy5hdHRyaWJ1dGVzLnNsaWNlKCksXHJcbiAgICAgIHN1YlF1ZXJ5OiBudWxsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgbWFpblRhYmxlID0ge1xyXG4gICAgICBuYW1lOiB0YWJsZU5hbWUsXHJcbiAgICAgIHF1b3RlZE5hbWU6IG51bGwsXHJcbiAgICAgIGFzOiBudWxsLFxyXG4gICAgICBtb2RlbFxyXG4gICAgfTtcclxuICAgIGNvbnN0IHRvcExldmVsSW5mbyA9IHtcclxuICAgICAgbmFtZXM6IG1haW5UYWJsZSxcclxuICAgICAgb3B0aW9ucyxcclxuICAgICAgc3ViUXVlcnlcclxuICAgIH07XHJcbiAgICBsZXQgbWFpbkpvaW5RdWVyaWVzID0gW107XHJcbiAgICBsZXQgc3ViSm9pblF1ZXJpZXMgPSBbXTtcclxuICAgIGxldCBxdWVyeTtcclxuXHJcbiAgICAvLyBBbGlhc2VzIGNhbiBiZSBwYXNzZWQgdGhyb3VnaCBzdWJxdWVyaWVzIGFuZCB3ZSBkb24ndCB3YW50IHRvIHJlc2V0IHRoZW1cclxuICAgIGlmICh0aGlzLm9wdGlvbnMubWluaWZ5QWxpYXNlcyAmJiAhb3B0aW9ucy5hbGlhc2VzTWFwcGluZykge1xyXG4gICAgICBvcHRpb25zLmFsaWFzZXNNYXBwaW5nID0gbmV3IE1hcCgpO1xyXG4gICAgICBvcHRpb25zLmFsaWFzZXNCeVRhYmxlID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmVzb2x2ZSB0YWJsZSBuYW1lIG9wdGlvbnNcclxuICAgIGlmIChvcHRpb25zLnRhYmxlQXMpIHtcclxuICAgICAgbWFpblRhYmxlLmFzID0gdGhpcy5xdW90ZUlkZW50aWZpZXIob3B0aW9ucy50YWJsZUFzKTtcclxuICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkobWFpblRhYmxlLm5hbWUpICYmIG1haW5UYWJsZS5tb2RlbCkge1xyXG4gICAgICBtYWluVGFibGUuYXMgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihtYWluVGFibGUubW9kZWwubmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgbWFpblRhYmxlLnF1b3RlZE5hbWUgPSAhQXJyYXkuaXNBcnJheShtYWluVGFibGUubmFtZSkgPyB0aGlzLnF1b3RlVGFibGUobWFpblRhYmxlLm5hbWUpIDogdGFibGVOYW1lLm1hcCh0ID0+IHtcclxuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodCkgPyB0aGlzLnF1b3RlVGFibGUodFswXSwgdFsxXSkgOiB0aGlzLnF1b3RlVGFibGUodCwgdHJ1ZSk7XHJcbiAgICB9KS5qb2luKCcsICcpO1xyXG5cclxuICAgIGlmIChzdWJRdWVyeSAmJiBhdHRyaWJ1dGVzLm1haW4pIHtcclxuICAgICAgZm9yIChjb25zdCBrZXlBdHQgb2YgbWFpblRhYmxlLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgbWFpbkF0dHJpYnV0ZXMgY29udGFpbiB0aGUgcHJpbWFyeSBrZXkgb2YgdGhlIG1vZGVsIGVpdGhlciBhcyBhIGZpZWxkIG9yIGFuIGFsaWFzZWQgZmllbGRcclxuICAgICAgICBpZiAoIWF0dHJpYnV0ZXMubWFpbi5zb21lKGF0dHIgPT4ga2V5QXR0ID09PSBhdHRyIHx8IGtleUF0dCA9PT0gYXR0clswXSB8fCBrZXlBdHQgPT09IGF0dHJbMV0pKSB7XHJcbiAgICAgICAgICBhdHRyaWJ1dGVzLm1haW4ucHVzaChtYWluVGFibGUubW9kZWwucmF3QXR0cmlidXRlc1trZXlBdHRdLmZpZWxkID8gW2tleUF0dCwgbWFpblRhYmxlLm1vZGVsLnJhd0F0dHJpYnV0ZXNba2V5QXR0XS5maWVsZF0gOiBrZXlBdHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGF0dHJpYnV0ZXMubWFpbiA9IHRoaXMuZXNjYXBlQXR0cmlidXRlcyhhdHRyaWJ1dGVzLm1haW4sIG9wdGlvbnMsIG1haW5UYWJsZS5hcyk7XHJcbiAgICBhdHRyaWJ1dGVzLm1haW4gPSBhdHRyaWJ1dGVzLm1haW4gfHwgKG9wdGlvbnMuaW5jbHVkZSA/IFtgJHttYWluVGFibGUuYXN9LipgXSA6IFsnKiddKTtcclxuXHJcbiAgICAvLyBJZiBzdWJxdWVyeSwgd2UgYWRkIHRoZSBtYWluQXR0cmlidXRlcyB0byB0aGUgc3ViUXVlcnkgYW5kIHNldCB0aGUgbWFpbkF0dHJpYnV0ZXMgdG8gc2VsZWN0ICogZnJvbSBzdWJxdWVyeVxyXG4gICAgaWYgKHN1YlF1ZXJ5IHx8IG9wdGlvbnMuZ3JvdXBlZExpbWl0KSB7XHJcbiAgICAgIC8vIFdlIG5lZWQgcHJpbWFyeSBrZXlzXHJcbiAgICAgIGF0dHJpYnV0ZXMuc3ViUXVlcnkgPSBhdHRyaWJ1dGVzLm1haW47XHJcbiAgICAgIGF0dHJpYnV0ZXMubWFpbiA9IFtgJHttYWluVGFibGUuYXMgfHwgbWFpblRhYmxlLnF1b3RlZE5hbWV9LipgXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5pbmNsdWRlKSB7XHJcbiAgICAgIGZvciAoY29uc3QgaW5jbHVkZSBvZiBvcHRpb25zLmluY2x1ZGUpIHtcclxuICAgICAgICBpZiAoaW5jbHVkZS5zZXBhcmF0ZSkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGpvaW5RdWVyaWVzID0gdGhpcy5nZW5lcmF0ZUluY2x1ZGUoaW5jbHVkZSwgeyBleHRlcm5hbEFzOiBtYWluVGFibGUuYXMsIGludGVybmFsQXM6IG1haW5UYWJsZS5hcyB9LCB0b3BMZXZlbEluZm8pO1xyXG5cclxuICAgICAgICBzdWJKb2luUXVlcmllcyA9IHN1YkpvaW5RdWVyaWVzLmNvbmNhdChqb2luUXVlcmllcy5zdWJRdWVyeSk7XHJcbiAgICAgICAgbWFpbkpvaW5RdWVyaWVzID0gbWFpbkpvaW5RdWVyaWVzLmNvbmNhdChqb2luUXVlcmllcy5tYWluUXVlcnkpO1xyXG5cclxuICAgICAgICBpZiAoam9pblF1ZXJpZXMuYXR0cmlidXRlcy5tYWluLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGF0dHJpYnV0ZXMubWFpbiA9IF8udW5pcShhdHRyaWJ1dGVzLm1haW4uY29uY2F0KGpvaW5RdWVyaWVzLmF0dHJpYnV0ZXMubWFpbikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoam9pblF1ZXJpZXMuYXR0cmlidXRlcy5zdWJRdWVyeS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBhdHRyaWJ1dGVzLnN1YlF1ZXJ5ID0gXy51bmlxKGF0dHJpYnV0ZXMuc3ViUXVlcnkuY29uY2F0KGpvaW5RdWVyaWVzLmF0dHJpYnV0ZXMuc3ViUXVlcnkpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoc3ViUXVlcnkpIHtcclxuICAgICAgc3ViUXVlcnlJdGVtcy5wdXNoKHRoaXMuc2VsZWN0RnJvbVRhYmxlRnJhZ21lbnQob3B0aW9ucywgbWFpblRhYmxlLm1vZGVsLCBhdHRyaWJ1dGVzLnN1YlF1ZXJ5LCBtYWluVGFibGUucXVvdGVkTmFtZSwgbWFpblRhYmxlLmFzKSk7XHJcbiAgICAgIHN1YlF1ZXJ5SXRlbXMucHVzaChzdWJKb2luUXVlcmllcy5qb2luKCcnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAob3B0aW9ucy5ncm91cGVkTGltaXQpIHtcclxuICAgICAgICBpZiAoIW1haW5UYWJsZS5hcykge1xyXG4gICAgICAgICAgbWFpblRhYmxlLmFzID0gbWFpblRhYmxlLnF1b3RlZE5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHdoZXJlID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucy53aGVyZSk7XHJcbiAgICAgICAgbGV0IGdyb3VwZWRMaW1pdE9yZGVyLFxyXG4gICAgICAgICAgd2hlcmVLZXksXHJcbiAgICAgICAgICBpbmNsdWRlLFxyXG4gICAgICAgICAgZ3JvdXBlZFRhYmxlTmFtZSA9IG1haW5UYWJsZS5hcztcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmdyb3VwZWRMaW1pdC5vbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgIHdoZXJlS2V5ID0gb3B0aW9ucy5ncm91cGVkTGltaXQub247XHJcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmdyb3VwZWRMaW1pdC5vbiBpbnN0YW5jZW9mIEhhc01hbnkpIHtcclxuICAgICAgICAgIHdoZXJlS2V5ID0gb3B0aW9ucy5ncm91cGVkTGltaXQub24uZm9yZWlnbktleUZpZWxkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ3JvdXBlZExpbWl0Lm9uIGluc3RhbmNlb2YgQmVsb25nc1RvTWFueSkge1xyXG4gICAgICAgICAgLy8gQlRNIGluY2x1ZGVzIG5lZWRzIHRvIGpvaW4gdGhlIHRocm91Z2ggdGFibGUgb24gdG8gY2hlY2sgSURcclxuICAgICAgICAgIGdyb3VwZWRUYWJsZU5hbWUgPSBvcHRpb25zLmdyb3VwZWRMaW1pdC5vbi5tYW55RnJvbVNvdXJjZS5hcztcclxuICAgICAgICAgIGNvbnN0IGdyb3VwZWRMaW1pdE9wdGlvbnMgPSBNb2RlbC5fdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzKHtcclxuICAgICAgICAgICAgaW5jbHVkZTogW3tcclxuICAgICAgICAgICAgICBhc3NvY2lhdGlvbjogb3B0aW9ucy5ncm91cGVkTGltaXQub24ubWFueUZyb21Tb3VyY2UsXHJcbiAgICAgICAgICAgICAgZHVwbGljYXRpbmc6IGZhbHNlLCAvLyBUaGUgVU5JT04nZWQgcXVlcnkgbWF5IGNvbnRhaW4gZHVwbGljYXRlcywgYnV0IGVhY2ggc3ViLXF1ZXJ5IGNhbm5vdFxyXG4gICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHdoZXJlOiBPYmplY3QuYXNzaWduKHtcclxuICAgICAgICAgICAgICAgIFtPcC5wbGFjZWhvbGRlcl06IHRydWVcclxuICAgICAgICAgICAgICB9LCBvcHRpb25zLmdyb3VwZWRMaW1pdC50aHJvdWdoICYmIG9wdGlvbnMuZ3JvdXBlZExpbWl0LnRocm91Z2gud2hlcmUpXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBtb2RlbFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLy8gTWFrZSBzdXJlIGF0dHJpYnV0ZXMgZnJvbSB0aGUgam9pbiB0YWJsZSBhcmUgbWFwcGVkIGJhY2sgdG8gbW9kZWxzXHJcbiAgICAgICAgICBvcHRpb25zLmhhc0pvaW4gPSB0cnVlO1xyXG4gICAgICAgICAgb3B0aW9ucy5oYXNNdWx0aUFzc29jaWF0aW9uID0gdHJ1ZTtcclxuICAgICAgICAgIG9wdGlvbnMuaW5jbHVkZU1hcCA9IE9iamVjdC5hc3NpZ24oZ3JvdXBlZExpbWl0T3B0aW9ucy5pbmNsdWRlTWFwLCBvcHRpb25zLmluY2x1ZGVNYXApO1xyXG4gICAgICAgICAgb3B0aW9ucy5pbmNsdWRlTmFtZXMgPSBncm91cGVkTGltaXRPcHRpb25zLmluY2x1ZGVOYW1lcy5jb25jYXQob3B0aW9ucy5pbmNsdWRlTmFtZXMgfHwgW10pO1xyXG4gICAgICAgICAgaW5jbHVkZSA9IGdyb3VwZWRMaW1pdE9wdGlvbnMuaW5jbHVkZTtcclxuXHJcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLm9yZGVyKSkge1xyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGUgb3JkZXIgYnkgYXR0cmlidXRlcyBhcmUgYXZhaWxhYmxlIHRvIHRoZSBwYXJlbnQgcXVlcnlcclxuICAgICAgICAgICAgb3B0aW9ucy5vcmRlci5mb3JFYWNoKChvcmRlciwgaSkgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9yZGVyKSkge1xyXG4gICAgICAgICAgICAgICAgb3JkZXIgPSBvcmRlclswXTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGxldCBhbGlhcyA9IGBzdWJxdWVyeV9vcmRlcl8ke2l9YDtcclxuICAgICAgICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZXMucHVzaChbb3JkZXIsIGFsaWFzXSk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gcHJlcGVuZCBtb2RlbCBuYW1lIHdoZW4gd2UgYWxpYXMgdGhlIGF0dHJpYnV0ZXMsIHNvIHF1b3RlIHRoZW0gaGVyZVxyXG4gICAgICAgICAgICAgIGFsaWFzID0gdGhpcy5zZXF1ZWxpemUubGl0ZXJhbCh0aGlzLnF1b3RlKGFsaWFzKSk7XHJcblxyXG4gICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMub3JkZXJbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLm9yZGVyW2ldWzBdID0gYWxpYXM7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMub3JkZXJbaV0gPSBhbGlhcztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBncm91cGVkTGltaXRPcmRlciA9IG9wdGlvbnMub3JkZXI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIE9yZGVyaW5nIGlzIGhhbmRsZWQgYnkgdGhlIHN1YnF1ZXJpZXMsIHNvIG9yZGVyaW5nIHRoZSBVTklPTidlZCByZXN1bHQgaXMgbm90IG5lZWRlZFxyXG4gICAgICAgICAgZ3JvdXBlZExpbWl0T3JkZXIgPSBvcHRpb25zLm9yZGVyO1xyXG4gICAgICAgICAgZGVsZXRlIG9wdGlvbnMub3JkZXI7XHJcbiAgICAgICAgICB3aGVyZVtPcC5wbGFjZWhvbGRlcl0gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2FjaGluZyB0aGUgYmFzZSBxdWVyeSBhbmQgc3BsaWNpbmcgdGhlIHdoZXJlIHBhcnQgaW50byBpdCBpcyBjb25zaXN0ZW50bHkgPiB0d2ljZVxyXG4gICAgICAgIC8vIGFzIGZhc3QgdGhhbiBnZW5lcmF0aW5nIGZyb20gc2NyYXRjaCBlYWNoIHRpbWUgZm9yIHZhbHVlcy5sZW5ndGggPj0gNVxyXG4gICAgICAgIGNvbnN0IGJhc2VRdWVyeSA9IGBTRUxFQ1QgKiBGUk9NICgke3RoaXMuc2VsZWN0UXVlcnkoXHJcbiAgICAgICAgICB0YWJsZU5hbWUsXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IG9wdGlvbnMuYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgb2Zmc2V0OiBvcHRpb25zLm9mZnNldCxcclxuICAgICAgICAgICAgbGltaXQ6IG9wdGlvbnMuZ3JvdXBlZExpbWl0LmxpbWl0LFxyXG4gICAgICAgICAgICBvcmRlcjogZ3JvdXBlZExpbWl0T3JkZXIsXHJcbiAgICAgICAgICAgIGFsaWFzZXNNYXBwaW5nOiBvcHRpb25zLmFsaWFzZXNNYXBwaW5nLFxyXG4gICAgICAgICAgICBhbGlhc2VzQnlUYWJsZTogb3B0aW9ucy5hbGlhc2VzQnlUYWJsZSxcclxuICAgICAgICAgICAgd2hlcmUsXHJcbiAgICAgICAgICAgIGluY2x1ZGUsXHJcbiAgICAgICAgICAgIG1vZGVsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgbW9kZWxcclxuICAgICAgICApLnJlcGxhY2UoLzskLywgJycpfSkgQVMgc3ViYDsgLy8gRXZlcnkgZGVyaXZlZCB0YWJsZSBtdXN0IGhhdmUgaXRzIG93biBhbGlhc1xyXG4gICAgICAgIGNvbnN0IHBsYWNlSG9sZGVyID0gdGhpcy53aGVyZUl0ZW1RdWVyeShPcC5wbGFjZWhvbGRlciwgdHJ1ZSwgeyBtb2RlbCB9KTtcclxuICAgICAgICBjb25zdCBzcGxpY2VQb3MgPSBiYXNlUXVlcnkuaW5kZXhPZihwbGFjZUhvbGRlcik7XHJcblxyXG4gICAgICAgIG1haW5RdWVyeUl0ZW1zLnB1c2godGhpcy5zZWxlY3RGcm9tVGFibGVGcmFnbWVudChvcHRpb25zLCBtYWluVGFibGUubW9kZWwsIGF0dHJpYnV0ZXMubWFpbiwgYCgke1xyXG4gICAgICAgICAgb3B0aW9ucy5ncm91cGVkTGltaXQudmFsdWVzLm1hcCh2YWx1ZSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBncm91cFdoZXJlO1xyXG4gICAgICAgICAgICBpZiAod2hlcmVLZXkpIHtcclxuICAgICAgICAgICAgICBncm91cFdoZXJlID0ge1xyXG4gICAgICAgICAgICAgICAgW3doZXJlS2V5XTogdmFsdWVcclxuICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpbmNsdWRlKSB7XHJcbiAgICAgICAgICAgICAgZ3JvdXBXaGVyZSA9IHtcclxuICAgICAgICAgICAgICAgIFtvcHRpb25zLmdyb3VwZWRMaW1pdC5vbi5mb3JlaWduSWRlbnRpZmllckZpZWxkXTogdmFsdWVcclxuICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gVXRpbHMuc3BsaWNlU3RyKGJhc2VRdWVyeSwgc3BsaWNlUG9zLCBwbGFjZUhvbGRlci5sZW5ndGgsIHRoaXMuZ2V0V2hlcmVDb25kaXRpb25zKGdyb3VwV2hlcmUsIGdyb3VwZWRUYWJsZU5hbWUpKTtcclxuICAgICAgICAgIH0pLmpvaW4oXHJcbiAgICAgICAgICAgIHRoaXMuX2RpYWxlY3Quc3VwcG9ydHNbJ1VOSU9OIEFMTCddID8gJyBVTklPTiBBTEwgJyA6ICcgVU5JT04gJ1xyXG4gICAgICAgICAgKVxyXG4gICAgICAgIH0pYCwgbWFpblRhYmxlLmFzKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbWFpblF1ZXJ5SXRlbXMucHVzaCh0aGlzLnNlbGVjdEZyb21UYWJsZUZyYWdtZW50KG9wdGlvbnMsIG1haW5UYWJsZS5tb2RlbCwgYXR0cmlidXRlcy5tYWluLCBtYWluVGFibGUucXVvdGVkTmFtZSwgbWFpblRhYmxlLmFzKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG1haW5RdWVyeUl0ZW1zLnB1c2gobWFpbkpvaW5RdWVyaWVzLmpvaW4oJycpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgV0hFUkUgdG8gc3ViIG9yIG1haW4gcXVlcnlcclxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgJ3doZXJlJykgJiYgIW9wdGlvbnMuZ3JvdXBlZExpbWl0KSB7XHJcbiAgICAgIG9wdGlvbnMud2hlcmUgPSB0aGlzLmdldFdoZXJlQ29uZGl0aW9ucyhvcHRpb25zLndoZXJlLCBtYWluVGFibGUuYXMgfHwgdGFibGVOYW1lLCBtb2RlbCwgb3B0aW9ucyk7XHJcbiAgICAgIGlmIChvcHRpb25zLndoZXJlKSB7XHJcbiAgICAgICAgaWYgKHN1YlF1ZXJ5KSB7XHJcbiAgICAgICAgICBzdWJRdWVyeUl0ZW1zLnB1c2goYCBXSEVSRSAke29wdGlvbnMud2hlcmV9YCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG1haW5RdWVyeUl0ZW1zLnB1c2goYCBXSEVSRSAke29wdGlvbnMud2hlcmV9YCk7XHJcbiAgICAgICAgICAvLyBXYWxrIHRoZSBtYWluIHF1ZXJ5IHRvIHVwZGF0ZSBhbGwgc2VsZWN0c1xyXG4gICAgICAgICAgbWFpblF1ZXJ5SXRlbXMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUuc3RhcnRzV2l0aCgnU0VMRUNUJykpIHtcclxuICAgICAgICAgICAgICBtYWluUXVlcnlJdGVtc1trZXldID0gdGhpcy5zZWxlY3RGcm9tVGFibGVGcmFnbWVudChvcHRpb25zLCBtb2RlbCwgYXR0cmlidXRlcy5tYWluLCBtYWluVGFibGUucXVvdGVkTmFtZSwgbWFpblRhYmxlLmFzLCBvcHRpb25zLndoZXJlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIEdST1VQIEJZIHRvIHN1YiBvciBtYWluIHF1ZXJ5XHJcbiAgICBpZiAob3B0aW9ucy5ncm91cCkge1xyXG4gICAgICBvcHRpb25zLmdyb3VwID0gQXJyYXkuaXNBcnJheShvcHRpb25zLmdyb3VwKSA/IG9wdGlvbnMuZ3JvdXAubWFwKHQgPT4gdGhpcy5hbGlhc0dyb3VwaW5nKHQsIG1vZGVsLCBtYWluVGFibGUuYXMsIG9wdGlvbnMpKS5qb2luKCcsICcpIDogdGhpcy5hbGlhc0dyb3VwaW5nKG9wdGlvbnMuZ3JvdXAsIG1vZGVsLCBtYWluVGFibGUuYXMsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgaWYgKHN1YlF1ZXJ5KSB7XHJcbiAgICAgICAgc3ViUXVlcnlJdGVtcy5wdXNoKGAgR1JPVVAgQlkgJHtvcHRpb25zLmdyb3VwfWApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1haW5RdWVyeUl0ZW1zLnB1c2goYCBHUk9VUCBCWSAke29wdGlvbnMuZ3JvdXB9YCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgSEFWSU5HIHRvIHN1YiBvciBtYWluIHF1ZXJ5XHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsICdoYXZpbmcnKSkge1xyXG4gICAgICBvcHRpb25zLmhhdmluZyA9IHRoaXMuZ2V0V2hlcmVDb25kaXRpb25zKG9wdGlvbnMuaGF2aW5nLCB0YWJsZU5hbWUsIG1vZGVsLCBvcHRpb25zLCBmYWxzZSk7XHJcbiAgICAgIGlmIChvcHRpb25zLmhhdmluZykge1xyXG4gICAgICAgIGlmIChzdWJRdWVyeSkge1xyXG4gICAgICAgICAgc3ViUXVlcnlJdGVtcy5wdXNoKGAgSEFWSU5HICR7b3B0aW9ucy5oYXZpbmd9YCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG1haW5RdWVyeUl0ZW1zLnB1c2goYCBIQVZJTkcgJHtvcHRpb25zLmhhdmluZ31gKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgT1JERVIgdG8gc3ViIG9yIG1haW4gcXVlcnlcclxuICAgIGlmIChvcHRpb25zLm9yZGVyKSB7XHJcbiAgICAgIGNvbnN0IG9yZGVycyA9IHRoaXMuZ2V0UXVlcnlPcmRlcnMob3B0aW9ucywgbW9kZWwsIHN1YlF1ZXJ5KTtcclxuICAgICAgaWYgKG9yZGVycy5tYWluUXVlcnlPcmRlci5sZW5ndGgpIHtcclxuICAgICAgICBtYWluUXVlcnlJdGVtcy5wdXNoKGAgT1JERVIgQlkgJHtvcmRlcnMubWFpblF1ZXJ5T3JkZXIuam9pbignLCAnKX1gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAob3JkZXJzLnN1YlF1ZXJ5T3JkZXIubGVuZ3RoKSB7XHJcbiAgICAgICAgc3ViUXVlcnlJdGVtcy5wdXNoKGAgT1JERVIgQlkgJHtvcmRlcnMuc3ViUXVlcnlPcmRlci5qb2luKCcsICcpfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIExJTUlULCBPRkZTRVQgdG8gc3ViIG9yIG1haW4gcXVlcnlcclxuICAgIGNvbnN0IGxpbWl0T3JkZXIgPSB0aGlzLmFkZExpbWl0QW5kT2Zmc2V0KG9wdGlvbnMsIG1haW5UYWJsZS5tb2RlbCk7XHJcbiAgICBpZiAobGltaXRPcmRlciAmJiAhb3B0aW9ucy5ncm91cGVkTGltaXQpIHtcclxuICAgICAgaWYgKHN1YlF1ZXJ5KSB7XHJcbiAgICAgICAgc3ViUXVlcnlJdGVtcy5wdXNoKGxpbWl0T3JkZXIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1haW5RdWVyeUl0ZW1zLnB1c2gobGltaXRPcmRlcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoc3ViUXVlcnkpIHtcclxuICAgICAgcXVlcnkgPSBgU0VMRUNUICR7YXR0cmlidXRlcy5tYWluLmpvaW4oJywgJyl9IEZST00gKCR7c3ViUXVlcnlJdGVtcy5qb2luKCcnKX0pIEFTICR7bWFpblRhYmxlLmFzfSR7bWFpbkpvaW5RdWVyaWVzLmpvaW4oJycpfSR7bWFpblF1ZXJ5SXRlbXMuam9pbignJyl9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHF1ZXJ5ID0gbWFpblF1ZXJ5SXRlbXMuam9pbignJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubG9jayAmJiB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmxvY2spIHtcclxuICAgICAgbGV0IGxvY2sgPSBvcHRpb25zLmxvY2s7XHJcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5sb2NrID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGxvY2sgPSBvcHRpb25zLmxvY2subGV2ZWw7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMubG9ja0tleSAmJiAobG9jayA9PT0gJ0tFWSBTSEFSRScgfHwgbG9jayA9PT0gJ05PIEtFWSBVUERBVEUnKSkge1xyXG4gICAgICAgIHF1ZXJ5ICs9IGAgRk9SICR7bG9ja31gO1xyXG4gICAgICB9IGVsc2UgaWYgKGxvY2sgPT09ICdTSEFSRScpIHtcclxuICAgICAgICBxdWVyeSArPSBgICR7dGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5mb3JTaGFyZX1gO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXJ5ICs9ICcgRk9SIFVQREFURSc7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMubG9ja09mICYmIG9wdGlvbnMubG9jay5vZiAmJiBvcHRpb25zLmxvY2sub2YucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICBxdWVyeSArPSBgIE9GICR7dGhpcy5xdW90ZVRhYmxlKG9wdGlvbnMubG9jay5vZi5uYW1lKX1gO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnNraXBMb2NrZWQgJiYgb3B0aW9ucy5za2lwTG9ja2VkKSB7XHJcbiAgICAgICAgcXVlcnkgKz0gJyBTS0lQIExPQ0tFRCc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYCR7cXVlcnl9O2A7XHJcbiAgfVxyXG5cclxuICBhbGlhc0dyb3VwaW5nKGZpZWxkLCBtb2RlbCwgdGFibGVOYW1lLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCBzcmMgPSBBcnJheS5pc0FycmF5KGZpZWxkKSA/IGZpZWxkWzBdIDogZmllbGQ7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMucXVvdGUodGhpcy5fZ2V0QWxpYXNGb3JGaWVsZCh0YWJsZU5hbWUsIHNyYywgb3B0aW9ucykgfHwgc3JjLCBtb2RlbCk7XHJcbiAgfVxyXG5cclxuICBlc2NhcGVBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMsIG9wdGlvbnMsIG1haW5UYWJsZUFzKSB7XHJcbiAgICByZXR1cm4gYXR0cmlidXRlcyAmJiBhdHRyaWJ1dGVzLm1hcChhdHRyID0+IHtcclxuICAgICAgbGV0IGFkZFRhYmxlID0gdHJ1ZTtcclxuXHJcbiAgICAgIGlmIChhdHRyIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKGF0dHIpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGF0dHIpKSB7XHJcbiAgICAgICAgaWYgKGF0dHIubGVuZ3RoICE9PSAyKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7SlNPTi5zdHJpbmdpZnkoYXR0cil9IGlzIG5vdCBhIHZhbGlkIGF0dHJpYnV0ZSBkZWZpbml0aW9uLiBQbGVhc2UgdXNlIHRoZSBmb2xsb3dpbmcgZm9ybWF0OiBbJ2F0dHJpYnV0ZSBkZWZpbml0aW9uJywgJ2FsaWFzJ11gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXR0ciA9IGF0dHIuc2xpY2UoKTtcclxuXHJcbiAgICAgICAgaWYgKGF0dHJbMF0gaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcclxuICAgICAgICAgIGF0dHJbMF0gPSB0aGlzLmhhbmRsZVNlcXVlbGl6ZU1ldGhvZChhdHRyWzBdKTtcclxuICAgICAgICAgIGFkZFRhYmxlID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIGlmICghYXR0clswXS5pbmNsdWRlcygnKCcpICYmICFhdHRyWzBdLmluY2x1ZGVzKCcpJykpIHtcclxuICAgICAgICAgIGF0dHJbMF0gPSB0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyWzBdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZGVwcmVjYXRpb25zLm5vUmF3QXR0cmlidXRlcygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgYWxpYXMgPSBhdHRyWzFdO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pbmlmeUFsaWFzZXMpIHtcclxuICAgICAgICAgIGFsaWFzID0gdGhpcy5fZ2V0TWluaWZpZWRBbGlhcyhhbGlhcywgbWFpblRhYmxlQXMsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXR0ciA9IFthdHRyWzBdLCB0aGlzLnF1b3RlSWRlbnRpZmllcihhbGlhcyldLmpvaW4oJyBBUyAnKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBhdHRyID0gIWF0dHIuaW5jbHVkZXMoVXRpbHMuVElDS19DSEFSKSAmJiAhYXR0ci5pbmNsdWRlcygnXCInKVxyXG4gICAgICAgICAgPyB0aGlzLnF1b3RlQXR0cmlidXRlKGF0dHIsIG9wdGlvbnMubW9kZWwpXHJcbiAgICAgICAgICA6IHRoaXMuZXNjYXBlKGF0dHIpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghXy5pc0VtcHR5KG9wdGlvbnMuaW5jbHVkZSkgJiYgIWF0dHIuaW5jbHVkZXMoJy4nKSAmJiBhZGRUYWJsZSkge1xyXG4gICAgICAgIGF0dHIgPSBgJHttYWluVGFibGVBc30uJHthdHRyfWA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBhdHRyO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBnZW5lcmF0ZUluY2x1ZGUoaW5jbHVkZSwgcGFyZW50VGFibGVOYW1lLCB0b3BMZXZlbEluZm8pIHtcclxuICAgIGNvbnN0IGpvaW5RdWVyaWVzID0ge1xyXG4gICAgICBtYWluUXVlcnk6IFtdLFxyXG4gICAgICBzdWJRdWVyeTogW11cclxuICAgIH07XHJcbiAgICBjb25zdCBtYWluQ2hpbGRJbmNsdWRlcyA9IFtdO1xyXG4gICAgY29uc3Qgc3ViQ2hpbGRJbmNsdWRlcyA9IFtdO1xyXG4gICAgbGV0IHJlcXVpcmVkTWlzbWF0Y2ggPSBmYWxzZTtcclxuICAgIGNvbnN0IGluY2x1ZGVBcyA9IHtcclxuICAgICAgaW50ZXJuYWxBczogaW5jbHVkZS5hcyxcclxuICAgICAgZXh0ZXJuYWxBczogaW5jbHVkZS5hc1xyXG4gICAgfTtcclxuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7XHJcbiAgICAgIG1haW46IFtdLFxyXG4gICAgICBzdWJRdWVyeTogW11cclxuICAgIH07XHJcbiAgICBsZXQgam9pblF1ZXJ5O1xyXG5cclxuICAgIHRvcExldmVsSW5mby5vcHRpb25zLmtleXNFc2NhcGVkID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAodG9wTGV2ZWxJbmZvLm5hbWVzLm5hbWUgIT09IHBhcmVudFRhYmxlTmFtZS5leHRlcm5hbEFzICYmIHRvcExldmVsSW5mby5uYW1lcy5hcyAhPT0gcGFyZW50VGFibGVOYW1lLmV4dGVybmFsQXMpIHtcclxuICAgICAgaW5jbHVkZUFzLmludGVybmFsQXMgPSBgJHtwYXJlbnRUYWJsZU5hbWUuaW50ZXJuYWxBc30tPiR7aW5jbHVkZS5hc31gO1xyXG4gICAgICBpbmNsdWRlQXMuZXh0ZXJuYWxBcyA9IGAke3BhcmVudFRhYmxlTmFtZS5leHRlcm5hbEFzfS4ke2luY2x1ZGUuYXN9YDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpbmNsdWRlSWdub3JlQXR0cmlidXRlcyBpcyB1c2VkIGJ5IGFnZ3JlZ2F0ZSBmdW5jdGlvbnNcclxuICAgIGlmICh0b3BMZXZlbEluZm8ub3B0aW9ucy5pbmNsdWRlSWdub3JlQXR0cmlidXRlcyAhPT0gZmFsc2UpIHtcclxuICAgICAgaW5jbHVkZS5tb2RlbC5fZXhwYW5kQXR0cmlidXRlcyhpbmNsdWRlKTtcclxuICAgICAgVXRpbHMubWFwRmluZGVyT3B0aW9ucyhpbmNsdWRlLCBpbmNsdWRlLm1vZGVsKTtcclxuXHJcbiAgICAgIGNvbnN0IGluY2x1ZGVBdHRyaWJ1dGVzID0gaW5jbHVkZS5hdHRyaWJ1dGVzLm1hcChhdHRyID0+IHtcclxuICAgICAgICBsZXQgYXR0ckFzID0gYXR0cjtcclxuICAgICAgICBsZXQgdmVyYmF0aW0gPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXR0cikgJiYgYXR0ci5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgIGlmIChhdHRyWzBdIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kICYmIChcclxuICAgICAgICAgICAgYXR0clswXSBpbnN0YW5jZW9mIFV0aWxzLkxpdGVyYWwgfHxcclxuICAgICAgICAgICAgYXR0clswXSBpbnN0YW5jZW9mIFV0aWxzLkNhc3QgfHxcclxuICAgICAgICAgICAgYXR0clswXSBpbnN0YW5jZW9mIFV0aWxzLkZuXHJcbiAgICAgICAgICApKSB7XHJcbiAgICAgICAgICAgIHZlcmJhdGltID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBhdHRyID0gYXR0ci5tYXAoYXR0ciA9PiBhdHRyIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kID8gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2QoYXR0cikgOiBhdHRyKTtcclxuXHJcbiAgICAgICAgICBhdHRyQXMgPSBhdHRyWzFdO1xyXG4gICAgICAgICAgYXR0ciA9IGF0dHJbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChhdHRyIGluc3RhbmNlb2YgVXRpbHMuTGl0ZXJhbCkge1xyXG4gICAgICAgICAgcmV0dXJuIGF0dHIudmFsOyAvLyBXZSB0cnVzdCB0aGUgdXNlciB0byByZW5hbWUgdGhlIGZpZWxkIGNvcnJlY3RseVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoYXR0ciBpbnN0YW5jZW9mIFV0aWxzLkNhc3QgfHwgYXR0ciBpbnN0YW5jZW9mIFV0aWxzLkZuKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgICdUcmllZCB0byBzZWxlY3QgYXR0cmlidXRlcyB1c2luZyBTZXF1ZWxpemUuY2FzdCBvciBTZXF1ZWxpemUuZm4gd2l0aG91dCBzcGVjaWZ5aW5nIGFuIGFsaWFzIGZvciB0aGUgcmVzdWx0LCBkdXJpbmcgZWFnZXIgbG9hZGluZy4gJyArXHJcbiAgICAgICAgICAgICdUaGlzIG1lYW5zIHRoZSBhdHRyaWJ1dGUgd2lsbCBub3QgYmUgYWRkZWQgdG8gdGhlIHJldHVybmVkIGluc3RhbmNlJ1xyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwcmVmaXg7XHJcbiAgICAgICAgaWYgKHZlcmJhdGltID09PSB0cnVlKSB7XHJcbiAgICAgICAgICBwcmVmaXggPSBhdHRyO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoLyM+PnwtPj4vLnRlc3QoYXR0cikpIHtcclxuICAgICAgICAgIHByZWZpeCA9IGAoJHt0aGlzLnF1b3RlSWRlbnRpZmllcihpbmNsdWRlQXMuaW50ZXJuYWxBcyl9LiR7YXR0ci5yZXBsYWNlKC9cXCh8XFwpL2csICcnKX0pYDtcclxuICAgICAgICB9IGVsc2UgaWYgKC9qc29uX2V4dHJhY3RcXCgvLnRlc3QoYXR0cikpIHtcclxuICAgICAgICAgIHByZWZpeCA9IGF0dHIucmVwbGFjZSgvanNvbl9leHRyYWN0XFwoL2ksIGBqc29uX2V4dHJhY3QoJHt0aGlzLnF1b3RlSWRlbnRpZmllcihpbmNsdWRlQXMuaW50ZXJuYWxBcyl9LmApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBwcmVmaXggPSBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihpbmNsdWRlQXMuaW50ZXJuYWxBcyl9LiR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cil9YDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGFsaWFzID0gYCR7aW5jbHVkZUFzLmV4dGVybmFsQXN9LiR7YXR0ckFzfWA7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubWluaWZ5QWxpYXNlcykge1xyXG4gICAgICAgICAgYWxpYXMgPSB0aGlzLl9nZXRNaW5pZmllZEFsaWFzKGFsaWFzLCBpbmNsdWRlQXMuaW50ZXJuYWxBcywgdG9wTGV2ZWxJbmZvLm9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGAke3ByZWZpeH0gQVMgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhbGlhcywgdHJ1ZSl9YDtcclxuICAgICAgfSk7XHJcbiAgICAgIGlmIChpbmNsdWRlLnN1YlF1ZXJ5ICYmIHRvcExldmVsSW5mby5zdWJRdWVyeSkge1xyXG4gICAgICAgIGZvciAoY29uc3QgYXR0ciBvZiBpbmNsdWRlQXR0cmlidXRlcykge1xyXG4gICAgICAgICAgYXR0cmlidXRlcy5zdWJRdWVyeS5wdXNoKGF0dHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGF0dHIgb2YgaW5jbHVkZUF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgIGF0dHJpYnV0ZXMubWFpbi5wdXNoKGF0dHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vdGhyb3VnaFxyXG4gICAgaWYgKGluY2x1ZGUudGhyb3VnaCkge1xyXG4gICAgICBqb2luUXVlcnkgPSB0aGlzLmdlbmVyYXRlVGhyb3VnaEpvaW4oaW5jbHVkZSwgaW5jbHVkZUFzLCBwYXJlbnRUYWJsZU5hbWUuaW50ZXJuYWxBcywgdG9wTGV2ZWxJbmZvKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX2dlbmVyYXRlU3ViUXVlcnlGaWx0ZXIoaW5jbHVkZSwgaW5jbHVkZUFzLCB0b3BMZXZlbEluZm8pO1xyXG4gICAgICBqb2luUXVlcnkgPSB0aGlzLmdlbmVyYXRlSm9pbihpbmNsdWRlLCB0b3BMZXZlbEluZm8pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGhhbmRsZSBwb3NzaWJsZSBuZXcgYXR0cmlidXRlcyBjcmVhdGVkIGluIGpvaW5cclxuICAgIGlmIChqb2luUXVlcnkuYXR0cmlidXRlcy5tYWluLmxlbmd0aCA+IDApIHtcclxuICAgICAgYXR0cmlidXRlcy5tYWluID0gYXR0cmlidXRlcy5tYWluLmNvbmNhdChqb2luUXVlcnkuYXR0cmlidXRlcy5tYWluKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoam9pblF1ZXJ5LmF0dHJpYnV0ZXMuc3ViUXVlcnkubGVuZ3RoID4gMCkge1xyXG4gICAgICBhdHRyaWJ1dGVzLnN1YlF1ZXJ5ID0gYXR0cmlidXRlcy5zdWJRdWVyeS5jb25jYXQoam9pblF1ZXJ5LmF0dHJpYnV0ZXMuc3ViUXVlcnkpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpbmNsdWRlLmluY2x1ZGUpIHtcclxuICAgICAgZm9yIChjb25zdCBjaGlsZEluY2x1ZGUgb2YgaW5jbHVkZS5pbmNsdWRlKSB7XHJcbiAgICAgICAgaWYgKGNoaWxkSW5jbHVkZS5zZXBhcmF0ZSB8fCBjaGlsZEluY2x1ZGUuX3BzZXVkbykge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjaGlsZEpvaW5RdWVyaWVzID0gdGhpcy5nZW5lcmF0ZUluY2x1ZGUoY2hpbGRJbmNsdWRlLCBpbmNsdWRlQXMsIHRvcExldmVsSW5mbyk7XHJcblxyXG4gICAgICAgIGlmIChpbmNsdWRlLnJlcXVpcmVkID09PSBmYWxzZSAmJiBjaGlsZEluY2x1ZGUucmVxdWlyZWQgPT09IHRydWUpIHtcclxuICAgICAgICAgIHJlcXVpcmVkTWlzbWF0Y2ggPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBpZiB0aGUgY2hpbGQgaXMgYSBzdWIgcXVlcnkgd2UganVzdCBnaXZlIGl0IHRvIHRoZVxyXG4gICAgICAgIGlmIChjaGlsZEluY2x1ZGUuc3ViUXVlcnkgJiYgdG9wTGV2ZWxJbmZvLnN1YlF1ZXJ5KSB7XHJcbiAgICAgICAgICBzdWJDaGlsZEluY2x1ZGVzLnB1c2goY2hpbGRKb2luUXVlcmllcy5zdWJRdWVyeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjaGlsZEpvaW5RdWVyaWVzLm1haW5RdWVyeSkge1xyXG4gICAgICAgICAgbWFpbkNoaWxkSW5jbHVkZXMucHVzaChjaGlsZEpvaW5RdWVyaWVzLm1haW5RdWVyeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjaGlsZEpvaW5RdWVyaWVzLmF0dHJpYnV0ZXMubWFpbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBhdHRyaWJ1dGVzLm1haW4gPSBhdHRyaWJ1dGVzLm1haW4uY29uY2F0KGNoaWxkSm9pblF1ZXJpZXMuYXR0cmlidXRlcy5tYWluKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNoaWxkSm9pblF1ZXJpZXMuYXR0cmlidXRlcy5zdWJRdWVyeS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBhdHRyaWJ1dGVzLnN1YlF1ZXJ5ID0gYXR0cmlidXRlcy5zdWJRdWVyeS5jb25jYXQoY2hpbGRKb2luUXVlcmllcy5hdHRyaWJ1dGVzLnN1YlF1ZXJ5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoaW5jbHVkZS5zdWJRdWVyeSAmJiB0b3BMZXZlbEluZm8uc3ViUXVlcnkpIHtcclxuICAgICAgaWYgKHJlcXVpcmVkTWlzbWF0Y2ggJiYgc3ViQ2hpbGRJbmNsdWRlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgam9pblF1ZXJpZXMuc3ViUXVlcnkucHVzaChgICR7am9pblF1ZXJ5LmpvaW59ICggJHtqb2luUXVlcnkuYm9keX0ke3N1YkNoaWxkSW5jbHVkZXMuam9pbignJyl9ICkgT04gJHtqb2luUXVlcnkuY29uZGl0aW9ufWApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGpvaW5RdWVyaWVzLnN1YlF1ZXJ5LnB1c2goYCAke2pvaW5RdWVyeS5qb2lufSAke2pvaW5RdWVyeS5ib2R5fSBPTiAke2pvaW5RdWVyeS5jb25kaXRpb259YCk7XHJcbiAgICAgICAgaWYgKHN1YkNoaWxkSW5jbHVkZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgam9pblF1ZXJpZXMuc3ViUXVlcnkucHVzaChzdWJDaGlsZEluY2x1ZGVzLmpvaW4oJycpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgam9pblF1ZXJpZXMubWFpblF1ZXJ5LnB1c2gobWFpbkNoaWxkSW5jbHVkZXMuam9pbignJykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHJlcXVpcmVkTWlzbWF0Y2ggJiYgbWFpbkNoaWxkSW5jbHVkZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGpvaW5RdWVyaWVzLm1haW5RdWVyeS5wdXNoKGAgJHtqb2luUXVlcnkuam9pbn0gKCAke2pvaW5RdWVyeS5ib2R5fSR7bWFpbkNoaWxkSW5jbHVkZXMuam9pbignJyl9ICkgT04gJHtqb2luUXVlcnkuY29uZGl0aW9ufWApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGpvaW5RdWVyaWVzLm1haW5RdWVyeS5wdXNoKGAgJHtqb2luUXVlcnkuam9pbn0gJHtqb2luUXVlcnkuYm9keX0gT04gJHtqb2luUXVlcnkuY29uZGl0aW9ufWApO1xyXG4gICAgICAgIGlmIChtYWluQ2hpbGRJbmNsdWRlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBqb2luUXVlcmllcy5tYWluUXVlcnkucHVzaChtYWluQ2hpbGRJbmNsdWRlcy5qb2luKCcnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGpvaW5RdWVyaWVzLnN1YlF1ZXJ5LnB1c2goc3ViQ2hpbGRJbmNsdWRlcy5qb2luKCcnKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbWFpblF1ZXJ5OiBqb2luUXVlcmllcy5tYWluUXVlcnkuam9pbignJyksXHJcbiAgICAgIHN1YlF1ZXJ5OiBqb2luUXVlcmllcy5zdWJRdWVyeS5qb2luKCcnKSxcclxuICAgICAgYXR0cmlidXRlc1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIF9nZXRNaW5pZmllZEFsaWFzKGFsaWFzLCB0YWJsZU5hbWUsIG9wdGlvbnMpIHtcclxuICAgIC8vIFdlIGRvIG5vdCB3YW50IHRvIHJlLWFsaWFzIGluIGNhc2Ugb2YgYSBzdWJxdWVyeVxyXG4gICAgaWYgKG9wdGlvbnMuYWxpYXNlc0J5VGFibGVbYCR7dGFibGVOYW1lfSR7YWxpYXN9YF0pIHtcclxuICAgICAgcmV0dXJuIG9wdGlvbnMuYWxpYXNlc0J5VGFibGVbYCR7dGFibGVOYW1lfSR7YWxpYXN9YF07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRG8gbm90IGFsaWFzIGN1c3RvbSBzdXF1ZXJ5X29yZGVyc1xyXG4gICAgaWYgKGFsaWFzLm1hdGNoKC9zdWJxdWVyeV9vcmRlcl9bMC05XS8pKSB7XHJcbiAgICAgIHJldHVybiBhbGlhcztcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtaW5pZmllZEFsaWFzID0gYF8ke29wdGlvbnMuYWxpYXNlc01hcHBpbmcuc2l6ZX1gO1xyXG5cclxuICAgIG9wdGlvbnMuYWxpYXNlc01hcHBpbmcuc2V0KG1pbmlmaWVkQWxpYXMsIGFsaWFzKTtcclxuICAgIG9wdGlvbnMuYWxpYXNlc0J5VGFibGVbYCR7dGFibGVOYW1lfSR7YWxpYXN9YF0gPSBtaW5pZmllZEFsaWFzO1xyXG5cclxuICAgIHJldHVybiBtaW5pZmllZEFsaWFzO1xyXG4gIH1cclxuXHJcbiAgX2dldEFsaWFzRm9yRmllbGQodGFibGVOYW1lLCBmaWVsZCwgb3B0aW9ucykge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5taW5pZnlBbGlhc2VzKSB7XHJcbiAgICAgIGlmIChvcHRpb25zLmFsaWFzZXNCeVRhYmxlW2Ake3RhYmxlTmFtZX0ke2ZpZWxkfWBdKSB7XHJcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuYWxpYXNlc0J5VGFibGVbYCR7dGFibGVOYW1lfSR7ZmllbGR9YF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgZ2VuZXJhdGVKb2luKGluY2x1ZGUsIHRvcExldmVsSW5mbykge1xyXG4gICAgY29uc3QgYXNzb2NpYXRpb24gPSBpbmNsdWRlLmFzc29jaWF0aW9uO1xyXG4gICAgY29uc3QgcGFyZW50ID0gaW5jbHVkZS5wYXJlbnQ7XHJcbiAgICBjb25zdCBwYXJlbnRJc1RvcCA9ICEhcGFyZW50ICYmICFpbmNsdWRlLnBhcmVudC5hc3NvY2lhdGlvbiAmJiBpbmNsdWRlLnBhcmVudC5tb2RlbC5uYW1lID09PSB0b3BMZXZlbEluZm8ub3B0aW9ucy5tb2RlbC5uYW1lO1xyXG4gICAgbGV0ICRwYXJlbnQ7XHJcbiAgICBsZXQgam9pbldoZXJlO1xyXG4gICAgLyogQXR0cmlidXRlcyBmb3IgdGhlIGxlZnQgc2lkZSAqL1xyXG4gICAgY29uc3QgbGVmdCA9IGFzc29jaWF0aW9uLnNvdXJjZTtcclxuICAgIGNvbnN0IGF0dHJMZWZ0ID0gYXNzb2NpYXRpb24gaW5zdGFuY2VvZiBCZWxvbmdzVG8gP1xyXG4gICAgICBhc3NvY2lhdGlvbi5pZGVudGlmaWVyIDpcclxuICAgICAgYXNzb2NpYXRpb24uc291cmNlS2V5QXR0cmlidXRlIHx8IGxlZnQucHJpbWFyeUtleUF0dHJpYnV0ZTtcclxuICAgIGNvbnN0IGZpZWxkTGVmdCA9IGFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvID9cclxuICAgICAgYXNzb2NpYXRpb24uaWRlbnRpZmllckZpZWxkIDpcclxuICAgICAgbGVmdC5yYXdBdHRyaWJ1dGVzW2Fzc29jaWF0aW9uLnNvdXJjZUtleUF0dHJpYnV0ZSB8fCBsZWZ0LnByaW1hcnlLZXlBdHRyaWJ1dGVdLmZpZWxkO1xyXG4gICAgbGV0IGFzTGVmdDtcclxuICAgIC8qIEF0dHJpYnV0ZXMgZm9yIHRoZSByaWdodCBzaWRlICovXHJcbiAgICBjb25zdCByaWdodCA9IGluY2x1ZGUubW9kZWw7XHJcbiAgICBjb25zdCB0YWJsZVJpZ2h0ID0gcmlnaHQuZ2V0VGFibGVOYW1lKCk7XHJcbiAgICBjb25zdCBmaWVsZFJpZ2h0ID0gYXNzb2NpYXRpb24gaW5zdGFuY2VvZiBCZWxvbmdzVG8gP1xyXG4gICAgICByaWdodC5yYXdBdHRyaWJ1dGVzW2Fzc29jaWF0aW9uLnRhcmdldElkZW50aWZpZXIgfHwgcmlnaHQucHJpbWFyeUtleUF0dHJpYnV0ZV0uZmllbGQgOlxyXG4gICAgICBhc3NvY2lhdGlvbi5pZGVudGlmaWVyRmllbGQ7XHJcbiAgICBsZXQgYXNSaWdodCA9IGluY2x1ZGUuYXM7XHJcblxyXG4gICAgd2hpbGUgKCgkcGFyZW50ID0gJHBhcmVudCAmJiAkcGFyZW50LnBhcmVudCB8fCBpbmNsdWRlLnBhcmVudCkgJiYgJHBhcmVudC5hc3NvY2lhdGlvbikge1xyXG4gICAgICBpZiAoYXNMZWZ0KSB7XHJcbiAgICAgICAgYXNMZWZ0ID0gYCR7JHBhcmVudC5hc30tPiR7YXNMZWZ0fWA7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYXNMZWZ0ID0gJHBhcmVudC5hcztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghYXNMZWZ0KSBhc0xlZnQgPSBwYXJlbnQuYXMgfHwgcGFyZW50Lm1vZGVsLm5hbWU7XHJcbiAgICBlbHNlIGFzUmlnaHQgPSBgJHthc0xlZnR9LT4ke2FzUmlnaHR9YDtcclxuXHJcbiAgICBsZXQgam9pbk9uID0gYCR7dGhpcy5xdW90ZVRhYmxlKGFzTGVmdCl9LiR7dGhpcy5xdW90ZUlkZW50aWZpZXIoZmllbGRMZWZ0KX1gO1xyXG4gICAgY29uc3Qgc3VicXVlcnlBdHRyaWJ1dGVzID0gW107XHJcblxyXG4gICAgaWYgKHRvcExldmVsSW5mby5vcHRpb25zLmdyb3VwZWRMaW1pdCAmJiBwYXJlbnRJc1RvcCB8fCB0b3BMZXZlbEluZm8uc3ViUXVlcnkgJiYgaW5jbHVkZS5wYXJlbnQuc3ViUXVlcnkgJiYgIWluY2x1ZGUuc3ViUXVlcnkpIHtcclxuICAgICAgaWYgKHBhcmVudElzVG9wKSB7XHJcbiAgICAgICAgLy8gVGhlIG1haW4gbW9kZWwgYXR0cmlidXRlcyBpcyBub3QgYWxpYXNlZCB0byBhIHByZWZpeFxyXG4gICAgICAgIGNvbnN0IHRhYmxlTmFtZSA9IHRoaXMucXVvdGVUYWJsZShwYXJlbnQuYXMgfHwgcGFyZW50Lm1vZGVsLm5hbWUpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBmb3IgcG90ZW50aWFsIGFsaWFzZWQgSk9JTiBjb25kaXRpb25cclxuICAgICAgICBqb2luT24gPSB0aGlzLl9nZXRBbGlhc0ZvckZpZWxkKHRhYmxlTmFtZSwgYXR0ckxlZnQsIHRvcExldmVsSW5mby5vcHRpb25zKSB8fCBgJHt0YWJsZU5hbWV9LiR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0ckxlZnQpfWA7XHJcblxyXG4gICAgICAgIGlmICh0b3BMZXZlbEluZm8uc3ViUXVlcnkpIHtcclxuICAgICAgICAgIHN1YnF1ZXJ5QXR0cmlidXRlcy5wdXNoKGAke3RhYmxlTmFtZX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihmaWVsZExlZnQpfWApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBqb2luU291cmNlID0gYCR7YXNMZWZ0LnJlcGxhY2UoLy0+L2csICcuJyl9LiR7YXR0ckxlZnR9YDtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgZm9yIHBvdGVudGlhbCBhbGlhc2VkIEpPSU4gY29uZGl0aW9uXHJcbiAgICAgICAgam9pbk9uID0gdGhpcy5fZ2V0QWxpYXNGb3JGaWVsZChhc0xlZnQsIGpvaW5Tb3VyY2UsIHRvcExldmVsSW5mby5vcHRpb25zKSB8fCB0aGlzLnF1b3RlSWRlbnRpZmllcihqb2luU291cmNlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGpvaW5PbiArPSBgID0gJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhc1JpZ2h0KX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihmaWVsZFJpZ2h0KX1gO1xyXG5cclxuICAgIGlmIChpbmNsdWRlLm9uKSB7XHJcbiAgICAgIGpvaW5PbiA9IHRoaXMud2hlcmVJdGVtc1F1ZXJ5KGluY2x1ZGUub24sIHtcclxuICAgICAgICBwcmVmaXg6IHRoaXMuc2VxdWVsaXplLmxpdGVyYWwodGhpcy5xdW90ZUlkZW50aWZpZXIoYXNSaWdodCkpLFxyXG4gICAgICAgIG1vZGVsOiBpbmNsdWRlLm1vZGVsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpbmNsdWRlLndoZXJlKSB7XHJcbiAgICAgIGpvaW5XaGVyZSA9IHRoaXMud2hlcmVJdGVtc1F1ZXJ5KGluY2x1ZGUud2hlcmUsIHtcclxuICAgICAgICBwcmVmaXg6IHRoaXMuc2VxdWVsaXplLmxpdGVyYWwodGhpcy5xdW90ZUlkZW50aWZpZXIoYXNSaWdodCkpLFxyXG4gICAgICAgIG1vZGVsOiBpbmNsdWRlLm1vZGVsXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAoam9pbldoZXJlKSB7XHJcbiAgICAgICAgaWYgKGluY2x1ZGUub3IpIHtcclxuICAgICAgICAgIGpvaW5PbiArPSBgIE9SICR7am9pbldoZXJlfWA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGpvaW5PbiArPSBgIEFORCAke2pvaW5XaGVyZX1gO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGpvaW46IGluY2x1ZGUucmVxdWlyZWQgPyAnSU5ORVIgSk9JTicgOiBpbmNsdWRlLnJpZ2h0ICYmIHRoaXMuX2RpYWxlY3Quc3VwcG9ydHNbJ1JJR0hUIEpPSU4nXSA/ICdSSUdIVCBPVVRFUiBKT0lOJyA6ICdMRUZUIE9VVEVSIEpPSU4nLFxyXG4gICAgICBib2R5OiB0aGlzLnF1b3RlVGFibGUodGFibGVSaWdodCwgYXNSaWdodCksXHJcbiAgICAgIGNvbmRpdGlvbjogam9pbk9uLFxyXG4gICAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgbWFpbjogW10sXHJcbiAgICAgICAgc3ViUXVlcnk6IHN1YnF1ZXJ5QXR0cmlidXRlc1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZ2VuZXJhdGVUaHJvdWdoSm9pbihpbmNsdWRlLCBpbmNsdWRlQXMsIHBhcmVudFRhYmxlTmFtZSwgdG9wTGV2ZWxJbmZvKSB7XHJcbiAgICBjb25zdCB0aHJvdWdoID0gaW5jbHVkZS50aHJvdWdoO1xyXG4gICAgY29uc3QgdGhyb3VnaFRhYmxlID0gdGhyb3VnaC5tb2RlbC5nZXRUYWJsZU5hbWUoKTtcclxuICAgIGNvbnN0IHRocm91Z2hBcyA9IGAke2luY2x1ZGVBcy5pbnRlcm5hbEFzfS0+JHt0aHJvdWdoLmFzfWA7XHJcbiAgICBjb25zdCBleHRlcm5hbFRocm91Z2hBcyA9IGAke2luY2x1ZGVBcy5leHRlcm5hbEFzfS4ke3Rocm91Z2guYXN9YDtcclxuICAgIGNvbnN0IHRocm91Z2hBdHRyaWJ1dGVzID0gdGhyb3VnaC5hdHRyaWJ1dGVzLm1hcChhdHRyID0+IHtcclxuICAgICAgbGV0IGFsaWFzID0gYCR7ZXh0ZXJuYWxUaHJvdWdoQXN9LiR7QXJyYXkuaXNBcnJheShhdHRyKSA/IGF0dHJbMV0gOiBhdHRyfWA7XHJcblxyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLm1pbmlmeUFsaWFzZXMpIHtcclxuICAgICAgICBhbGlhcyA9IHRoaXMuX2dldE1pbmlmaWVkQWxpYXMoYWxpYXMsIHRocm91Z2hBcywgdG9wTGV2ZWxJbmZvLm9wdGlvbnMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIodGhyb3VnaEFzKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihBcnJheS5pc0FycmF5KGF0dHIpID8gYXR0clswXSA6IGF0dHIpXHJcbiAgICAgIH0gQVMgJHtcclxuICAgICAgICB0aGlzLnF1b3RlSWRlbnRpZmllcihhbGlhcyl9YDtcclxuICAgIH0pO1xyXG4gICAgY29uc3QgYXNzb2NpYXRpb24gPSBpbmNsdWRlLmFzc29jaWF0aW9uO1xyXG4gICAgY29uc3QgcGFyZW50SXNUb3AgPSAhaW5jbHVkZS5wYXJlbnQuYXNzb2NpYXRpb24gJiYgaW5jbHVkZS5wYXJlbnQubW9kZWwubmFtZSA9PT0gdG9wTGV2ZWxJbmZvLm9wdGlvbnMubW9kZWwubmFtZTtcclxuICAgIGNvbnN0IHRhYmxlU291cmNlID0gcGFyZW50VGFibGVOYW1lO1xyXG4gICAgY29uc3QgaWRlbnRTb3VyY2UgPSBhc3NvY2lhdGlvbi5pZGVudGlmaWVyRmllbGQ7XHJcbiAgICBjb25zdCB0YWJsZVRhcmdldCA9IGluY2x1ZGVBcy5pbnRlcm5hbEFzO1xyXG4gICAgY29uc3QgaWRlbnRUYXJnZXQgPSBhc3NvY2lhdGlvbi5mb3JlaWduSWRlbnRpZmllckZpZWxkO1xyXG4gICAgY29uc3QgYXR0clRhcmdldCA9IGFzc29jaWF0aW9uLnRhcmdldEtleUZpZWxkO1xyXG5cclxuICAgIGNvbnN0IGpvaW5UeXBlID0gaW5jbHVkZS5yZXF1aXJlZCA/ICdJTk5FUiBKT0lOJyA6IGluY2x1ZGUucmlnaHQgJiYgdGhpcy5fZGlhbGVjdC5zdXBwb3J0c1snUklHSFQgSk9JTiddID8gJ1JJR0hUIE9VVEVSIEpPSU4nIDogJ0xFRlQgT1VURVIgSk9JTic7XHJcbiAgICBsZXQgam9pbkJvZHk7XHJcbiAgICBsZXQgam9pbkNvbmRpdGlvbjtcclxuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7XHJcbiAgICAgIG1haW46IFtdLFxyXG4gICAgICBzdWJRdWVyeTogW11cclxuICAgIH07XHJcbiAgICBsZXQgYXR0clNvdXJjZSA9IGFzc29jaWF0aW9uLnNvdXJjZUtleTtcclxuICAgIGxldCBzb3VyY2VKb2luT247XHJcbiAgICBsZXQgdGFyZ2V0Sm9pbk9uO1xyXG4gICAgbGV0IHRocm91Z2hXaGVyZTtcclxuICAgIGxldCB0YXJnZXRXaGVyZTtcclxuXHJcbiAgICBpZiAodG9wTGV2ZWxJbmZvLm9wdGlvbnMuaW5jbHVkZUlnbm9yZUF0dHJpYnV0ZXMgIT09IGZhbHNlKSB7XHJcbiAgICAgIC8vIFRocm91Z2ggaW5jbHVkZXMgYXJlIGFsd2F5cyBoYXNNYW55LCBzbyB3ZSBuZWVkIHRvIGFkZCB0aGUgYXR0cmlidXRlcyB0byB0aGUgbWFpbkF0dHJpYnV0ZXMgbm8gbWF0dGVyIHdoYXQgKFJlYWwgam9pbiB3aWxsIG5ldmVyIGJlIGV4ZWN1dGVkIGluIHN1YnF1ZXJ5KVxyXG4gICAgICBmb3IgKGNvbnN0IGF0dHIgb2YgdGhyb3VnaEF0dHJpYnV0ZXMpIHtcclxuICAgICAgICBhdHRyaWJ1dGVzLm1haW4ucHVzaChhdHRyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpZ3VyZSBvdXQgaWYgd2UgbmVlZCB0byB1c2UgZmllbGQgb3IgYXR0cmlidXRlXHJcbiAgICBpZiAoIXRvcExldmVsSW5mby5zdWJRdWVyeSkge1xyXG4gICAgICBhdHRyU291cmNlID0gYXNzb2NpYXRpb24uc291cmNlS2V5RmllbGQ7XHJcbiAgICB9XHJcbiAgICBpZiAodG9wTGV2ZWxJbmZvLnN1YlF1ZXJ5ICYmICFpbmNsdWRlLnN1YlF1ZXJ5ICYmICFpbmNsdWRlLnBhcmVudC5zdWJRdWVyeSAmJiBpbmNsdWRlLnBhcmVudC5tb2RlbCAhPT0gdG9wTGV2ZWxJbmZvLm9wdGlvbnMubWFpbk1vZGVsKSB7XHJcbiAgICAgIGF0dHJTb3VyY2UgPSBhc3NvY2lhdGlvbi5zb3VyY2VLZXlGaWVsZDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaWx0ZXIgc3RhdGVtZW50IGZvciBsZWZ0IHNpZGUgb2YgdGhyb3VnaFxyXG4gICAgLy8gVXNlZCBieSBib3RoIGpvaW4gYW5kIHN1YnF1ZXJ5IHdoZXJlXHJcbiAgICAvLyBJZiBwYXJlbnQgaW5jbHVkZSB3YXMgaW4gYSBzdWJxdWVyeSBuZWVkIHRvIGpvaW4gb24gdGhlIGFsaWFzZWQgYXR0cmlidXRlXHJcbiAgICBpZiAodG9wTGV2ZWxJbmZvLnN1YlF1ZXJ5ICYmICFpbmNsdWRlLnN1YlF1ZXJ5ICYmIGluY2x1ZGUucGFyZW50LnN1YlF1ZXJ5ICYmICFwYXJlbnRJc1RvcCkge1xyXG4gICAgICAvLyBJZiB3ZSBhcmUgbWluaWZ5aW5nIGFsaWFzZXMgYW5kIG91ciBKT0lOIHRhcmdldCBoYXMgYmVlbiBtaW5pZmllZCwgd2UgbmVlZCB0byB1c2UgdGhlIGFsaWFzIGluc3RlYWQgb2YgdGhlIG9yaWdpbmFsIGNvbHVtbiBuYW1lXHJcbiAgICAgIGNvbnN0IGpvaW5Tb3VyY2UgPSB0aGlzLl9nZXRBbGlhc0ZvckZpZWxkKHRhYmxlU291cmNlLCBgJHt0YWJsZVNvdXJjZX0uJHthdHRyU291cmNlfWAsIHRvcExldmVsSW5mby5vcHRpb25zKSB8fCBgJHt0YWJsZVNvdXJjZX0uJHthdHRyU291cmNlfWA7XHJcblxyXG4gICAgICBzb3VyY2VKb2luT24gPSBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihqb2luU291cmNlKX0gPSBgO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gSWYgd2UgYXJlIG1pbmlmeWluZyBhbGlhc2VzIGFuZCBvdXIgSk9JTiB0YXJnZXQgaGFzIGJlZW4gbWluaWZpZWQsIHdlIG5lZWQgdG8gdXNlIHRoZSBhbGlhcyBpbnN0ZWFkIG9mIHRoZSBvcmlnaW5hbCBjb2x1bW4gbmFtZVxyXG4gICAgICBjb25zdCBhbGlhc2VkU291cmNlID0gdGhpcy5fZ2V0QWxpYXNGb3JGaWVsZCh0YWJsZVNvdXJjZSwgYXR0clNvdXJjZSwgdG9wTGV2ZWxJbmZvLm9wdGlvbnMpIHx8IGF0dHJTb3VyY2U7XHJcblxyXG4gICAgICBzb3VyY2VKb2luT24gPSBgJHt0aGlzLnF1b3RlVGFibGUodGFibGVTb3VyY2UpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGFsaWFzZWRTb3VyY2UpfSA9IGA7XHJcbiAgICB9XHJcbiAgICBzb3VyY2VKb2luT24gKz0gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIodGhyb3VnaEFzKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihpZGVudFNvdXJjZSl9YDtcclxuXHJcbiAgICAvLyBGaWx0ZXIgc3RhdGVtZW50IGZvciByaWdodCBzaWRlIG9mIHRocm91Z2hcclxuICAgIC8vIFVzZWQgYnkgYm90aCBqb2luIGFuZCBzdWJxdWVyeSB3aGVyZVxyXG4gICAgdGFyZ2V0Sm9pbk9uID0gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIodGFibGVUYXJnZXQpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHJUYXJnZXQpfSA9IGA7XHJcbiAgICB0YXJnZXRKb2luT24gKz0gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIodGhyb3VnaEFzKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihpZGVudFRhcmdldCl9YDtcclxuXHJcbiAgICBpZiAodGhyb3VnaC53aGVyZSkge1xyXG4gICAgICB0aHJvdWdoV2hlcmUgPSB0aGlzLmdldFdoZXJlQ29uZGl0aW9ucyh0aHJvdWdoLndoZXJlLCB0aGlzLnNlcXVlbGl6ZS5saXRlcmFsKHRoaXMucXVvdGVJZGVudGlmaWVyKHRocm91Z2hBcykpLCB0aHJvdWdoLm1vZGVsKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5qb2luVGFibGVEZXBlbmRlbnQpIHtcclxuICAgICAgLy8gR2VuZXJhdGUgYSB3cmFwcGVkIGpvaW4gc28gdGhhdCB0aGUgdGhyb3VnaCB0YWJsZSBqb2luIGNhbiBiZSBkZXBlbmRlbnQgb24gdGhlIHRhcmdldCBqb2luXHJcbiAgICAgIGpvaW5Cb2R5ID0gYCggJHt0aGlzLnF1b3RlVGFibGUodGhyb3VnaFRhYmxlLCB0aHJvdWdoQXMpfSBJTk5FUiBKT0lOICR7dGhpcy5xdW90ZVRhYmxlKGluY2x1ZGUubW9kZWwuZ2V0VGFibGVOYW1lKCksIGluY2x1ZGVBcy5pbnRlcm5hbEFzKX0gT04gJHt0YXJnZXRKb2luT259YDtcclxuICAgICAgaWYgKHRocm91Z2hXaGVyZSkge1xyXG4gICAgICAgIGpvaW5Cb2R5ICs9IGAgQU5EICR7dGhyb3VnaFdoZXJlfWA7XHJcbiAgICAgIH1cclxuICAgICAgam9pbkJvZHkgKz0gJyknO1xyXG4gICAgICBqb2luQ29uZGl0aW9uID0gc291cmNlSm9pbk9uO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gR2VuZXJhdGUgam9pbiBTUUwgZm9yIGxlZnQgc2lkZSBvZiB0aHJvdWdoXHJcbiAgICAgIGpvaW5Cb2R5ID0gYCR7dGhpcy5xdW90ZVRhYmxlKHRocm91Z2hUYWJsZSwgdGhyb3VnaEFzKX0gT04gJHtzb3VyY2VKb2luT259ICR7am9pblR5cGV9ICR7dGhpcy5xdW90ZVRhYmxlKGluY2x1ZGUubW9kZWwuZ2V0VGFibGVOYW1lKCksIGluY2x1ZGVBcy5pbnRlcm5hbEFzKX1gO1xyXG4gICAgICBqb2luQ29uZGl0aW9uID0gdGFyZ2V0Sm9pbk9uO1xyXG4gICAgICBpZiAodGhyb3VnaFdoZXJlKSB7XHJcbiAgICAgICAgam9pbkNvbmRpdGlvbiArPSBgIEFORCAke3Rocm91Z2hXaGVyZX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGluY2x1ZGUud2hlcmUgfHwgaW5jbHVkZS50aHJvdWdoLndoZXJlKSB7XHJcbiAgICAgIGlmIChpbmNsdWRlLndoZXJlKSB7XHJcbiAgICAgICAgdGFyZ2V0V2hlcmUgPSB0aGlzLmdldFdoZXJlQ29uZGl0aW9ucyhpbmNsdWRlLndoZXJlLCB0aGlzLnNlcXVlbGl6ZS5saXRlcmFsKHRoaXMucXVvdGVJZGVudGlmaWVyKGluY2x1ZGVBcy5pbnRlcm5hbEFzKSksIGluY2x1ZGUubW9kZWwsIHRvcExldmVsSW5mby5vcHRpb25zKTtcclxuICAgICAgICBpZiAodGFyZ2V0V2hlcmUpIHtcclxuICAgICAgICAgIGpvaW5Db25kaXRpb24gKz0gYCBBTkQgJHt0YXJnZXRXaGVyZX1gO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2dlbmVyYXRlU3ViUXVlcnlGaWx0ZXIoaW5jbHVkZSwgaW5jbHVkZUFzLCB0b3BMZXZlbEluZm8pO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGpvaW46IGpvaW5UeXBlLFxyXG4gICAgICBib2R5OiBqb2luQm9keSxcclxuICAgICAgY29uZGl0aW9uOiBqb2luQ29uZGl0aW9uLFxyXG4gICAgICBhdHRyaWJ1dGVzXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiBHZW5lcmF0ZXMgc3ViUXVlcnlGaWx0ZXIgLSBhIHNlbGVjdCBuZXN0ZWQgaW4gdGhlIHdoZXJlIGNsYXVzZSBvZiB0aGUgc3ViUXVlcnkuXHJcbiAgICogRm9yIGEgZ2l2ZW4gaW5jbHVkZSBhIHF1ZXJ5IGlzIGdlbmVyYXRlZCB0aGF0IGNvbnRhaW5zIGFsbCB0aGUgd2F5IGZyb20gdGhlIHN1YlF1ZXJ5XHJcbiAgICogdGFibGUgdG8gdGhlIGluY2x1ZGUgdGFibGUgcGx1cyBldmVyeXRoaW5nIHRoYXQncyBpbiByZXF1aXJlZCB0cmFuc2l0aXZlIGNsb3N1cmUgb2YgdGhlXHJcbiAgICogZ2l2ZW4gaW5jbHVkZS5cclxuICAgKi9cclxuICBfZ2VuZXJhdGVTdWJRdWVyeUZpbHRlcihpbmNsdWRlLCBpbmNsdWRlQXMsIHRvcExldmVsSW5mbykge1xyXG4gICAgaWYgKCF0b3BMZXZlbEluZm8uc3ViUXVlcnkgfHwgIWluY2x1ZGUuc3ViUXVlcnlGaWx0ZXIpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdG9wTGV2ZWxJbmZvLm9wdGlvbnMud2hlcmUpIHtcclxuICAgICAgdG9wTGV2ZWxJbmZvLm9wdGlvbnMud2hlcmUgPSB7fTtcclxuICAgIH1cclxuICAgIGxldCBwYXJlbnQgPSBpbmNsdWRlO1xyXG4gICAgbGV0IGNoaWxkID0gaW5jbHVkZTtcclxuICAgIGxldCBuZXN0ZWRJbmNsdWRlcyA9IHRoaXMuX2dldFJlcXVpcmVkQ2xvc3VyZShpbmNsdWRlKS5pbmNsdWRlO1xyXG4gICAgbGV0IHF1ZXJ5O1xyXG5cclxuICAgIHdoaWxlICgocGFyZW50ID0gcGFyZW50LnBhcmVudCkpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG4gICAgICBpZiAocGFyZW50LnBhcmVudCAmJiAhcGFyZW50LnJlcXVpcmVkKSB7XHJcbiAgICAgICAgcmV0dXJuOyAvLyBvbmx5IGdlbmVyYXRlIHN1YlF1ZXJ5RmlsdGVyIGlmIGFsbCB0aGUgcGFyZW50cyBvZiB0aGlzIGluY2x1ZGUgYXJlIHJlcXVpcmVkXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChwYXJlbnQuc3ViUXVlcnlGaWx0ZXIpIHtcclxuICAgICAgICAvLyB0aGUgaW5jbHVkZSBpcyBhbHJlYWR5IGhhbmRsZWQgYXMgdGhpcyBwYXJlbnQgaGFzIHRoZSBpbmNsdWRlIG9uIGl0cyByZXF1aXJlZCBjbG9zdXJlXHJcbiAgICAgICAgLy8gc2tpcCB0byBwcmV2ZW50IGR1cGxpY2F0ZSBzdWJRdWVyeUZpbHRlclxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgbmVzdGVkSW5jbHVkZXMgPSBbT2JqZWN0LmFzc2lnbih7fSwgY2hpbGQsIHsgaW5jbHVkZTogbmVzdGVkSW5jbHVkZXMsIGF0dHJpYnV0ZXM6IFtdIH0pXTtcclxuICAgICAgY2hpbGQgPSBwYXJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdG9wSW5jbHVkZSA9IG5lc3RlZEluY2x1ZGVzWzBdO1xyXG4gICAgY29uc3QgdG9wUGFyZW50ID0gdG9wSW5jbHVkZS5wYXJlbnQ7XHJcbiAgICBjb25zdCB0b3BBc3NvY2lhdGlvbiA9IHRvcEluY2x1ZGUuYXNzb2NpYXRpb247XHJcbiAgICB0b3BJbmNsdWRlLmFzc29jaWF0aW9uID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGlmICh0b3BJbmNsdWRlLnRocm91Z2ggJiYgT2JqZWN0KHRvcEluY2x1ZGUudGhyb3VnaC5tb2RlbCkgPT09IHRvcEluY2x1ZGUudGhyb3VnaC5tb2RlbCkge1xyXG4gICAgICBxdWVyeSA9IHRoaXMuc2VsZWN0UXVlcnkodG9wSW5jbHVkZS50aHJvdWdoLm1vZGVsLmdldFRhYmxlTmFtZSgpLCB7XHJcbiAgICAgICAgYXR0cmlidXRlczogW3RvcEluY2x1ZGUudGhyb3VnaC5tb2RlbC5wcmltYXJ5S2V5RmllbGRdLFxyXG4gICAgICAgIGluY2x1ZGU6IE1vZGVsLl92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudHMoe1xyXG4gICAgICAgICAgbW9kZWw6IHRvcEluY2x1ZGUudGhyb3VnaC5tb2RlbCxcclxuICAgICAgICAgIGluY2x1ZGU6IFt7XHJcbiAgICAgICAgICAgIGFzc29jaWF0aW9uOiB0b3BBc3NvY2lhdGlvbi50b1RhcmdldCxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIHdoZXJlOiB0b3BJbmNsdWRlLndoZXJlLFxyXG4gICAgICAgICAgICBpbmNsdWRlOiB0b3BJbmNsdWRlLmluY2x1ZGVcclxuICAgICAgICAgIH1dXHJcbiAgICAgICAgfSkuaW5jbHVkZSxcclxuICAgICAgICBtb2RlbDogdG9wSW5jbHVkZS50aHJvdWdoLm1vZGVsLFxyXG4gICAgICAgIHdoZXJlOiB7XHJcbiAgICAgICAgICBbT3AuYW5kXTogW1xyXG4gICAgICAgICAgICB0aGlzLnNlcXVlbGl6ZS5saXRlcmFsKFtcclxuICAgICAgICAgICAgICBgJHt0aGlzLnF1b3RlVGFibGUodG9wUGFyZW50Lm1vZGVsLm5hbWUpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKHRvcFBhcmVudC5tb2RlbC5wcmltYXJ5S2V5RmllbGQpfWAsXHJcbiAgICAgICAgICAgICAgYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIodG9wSW5jbHVkZS50aHJvdWdoLm1vZGVsLm5hbWUpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKHRvcEFzc29jaWF0aW9uLmlkZW50aWZpZXJGaWVsZCl9YFxyXG4gICAgICAgICAgICBdLmpvaW4oJyA9ICcpKSxcclxuICAgICAgICAgICAgdG9wSW5jbHVkZS50aHJvdWdoLndoZXJlXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBsaW1pdDogMSxcclxuICAgICAgICBpbmNsdWRlSWdub3JlQXR0cmlidXRlczogZmFsc2VcclxuICAgICAgfSwgdG9wSW5jbHVkZS50aHJvdWdoLm1vZGVsKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGlzQmVsb25nc1RvID0gdG9wQXNzb2NpYXRpb24uYXNzb2NpYXRpb25UeXBlID09PSAnQmVsb25nc1RvJztcclxuICAgICAgY29uc3Qgc291cmNlRmllbGQgPSBpc0JlbG9uZ3NUbyA/IHRvcEFzc29jaWF0aW9uLmlkZW50aWZpZXJGaWVsZCA6IHRvcEFzc29jaWF0aW9uLnNvdXJjZUtleUZpZWxkIHx8IHRvcFBhcmVudC5tb2RlbC5wcmltYXJ5S2V5RmllbGQ7XHJcbiAgICAgIGNvbnN0IHRhcmdldEZpZWxkID0gaXNCZWxvbmdzVG8gPyB0b3BBc3NvY2lhdGlvbi5zb3VyY2VLZXlGaWVsZCB8fCB0b3BJbmNsdWRlLm1vZGVsLnByaW1hcnlLZXlGaWVsZCA6IHRvcEFzc29jaWF0aW9uLmlkZW50aWZpZXJGaWVsZDtcclxuXHJcbiAgICAgIGNvbnN0IGpvaW4gPSBbXHJcbiAgICAgICAgYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIodG9wSW5jbHVkZS5hcyl9LiR7dGhpcy5xdW90ZUlkZW50aWZpZXIodGFyZ2V0RmllbGQpfWAsXHJcbiAgICAgICAgYCR7dGhpcy5xdW90ZVRhYmxlKHRvcFBhcmVudC5hcyB8fCB0b3BQYXJlbnQubW9kZWwubmFtZSl9LiR7dGhpcy5xdW90ZUlkZW50aWZpZXIoc291cmNlRmllbGQpfWBcclxuICAgICAgXS5qb2luKCcgPSAnKTtcclxuXHJcbiAgICAgIHF1ZXJ5ID0gdGhpcy5zZWxlY3RRdWVyeSh0b3BJbmNsdWRlLm1vZGVsLmdldFRhYmxlTmFtZSgpLCB7XHJcbiAgICAgICAgYXR0cmlidXRlczogW3RhcmdldEZpZWxkXSxcclxuICAgICAgICBpbmNsdWRlOiBNb2RlbC5fdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzKHRvcEluY2x1ZGUpLmluY2x1ZGUsXHJcbiAgICAgICAgbW9kZWw6IHRvcEluY2x1ZGUubW9kZWwsXHJcbiAgICAgICAgd2hlcmU6IHtcclxuICAgICAgICAgIFtPcC5hbmRdOiBbXHJcbiAgICAgICAgICAgIHRvcEluY2x1ZGUud2hlcmUsXHJcbiAgICAgICAgICAgIHsgW09wLmpvaW5dOiB0aGlzLnNlcXVlbGl6ZS5saXRlcmFsKGpvaW4pIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGxpbWl0OiAxLFxyXG4gICAgICAgIHRhYmxlQXM6IHRvcEluY2x1ZGUuYXMsXHJcbiAgICAgICAgaW5jbHVkZUlnbm9yZUF0dHJpYnV0ZXM6IGZhbHNlXHJcbiAgICAgIH0sIHRvcEluY2x1ZGUubW9kZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdG9wTGV2ZWxJbmZvLm9wdGlvbnMud2hlcmVbT3AuYW5kXSkge1xyXG4gICAgICB0b3BMZXZlbEluZm8ub3B0aW9ucy53aGVyZVtPcC5hbmRdID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgdG9wTGV2ZWxJbmZvLm9wdGlvbnMud2hlcmVbYF9fJHtpbmNsdWRlQXMuaW50ZXJuYWxBc31gXSA9IHRoaXMuc2VxdWVsaXplLmxpdGVyYWwoW1xyXG4gICAgICAnKCcsXHJcbiAgICAgIHF1ZXJ5LnJlcGxhY2UoLzskLywgJycpLFxyXG4gICAgICAnKScsXHJcbiAgICAgICdJUyBOT1QgTlVMTCdcclxuICAgIF0uam9pbignICcpKTtcclxuICB9XHJcblxyXG4gIC8qXHJcbiAgICogRm9yIGEgZ2l2ZW4gaW5jbHVkZSBoaWVyYXJjaHkgY3JlYXRlcyBhIGNvcHkgb2YgaXQgd2hlcmUgb25seSB0aGUgcmVxdWlyZWQgaW5jbHVkZXNcclxuICAgKiBhcmUgcHJlc2VydmVkLlxyXG4gICAqL1xyXG4gIF9nZXRSZXF1aXJlZENsb3N1cmUoaW5jbHVkZSkge1xyXG4gICAgY29uc3QgY29weSA9IE9iamVjdC5hc3NpZ24oe30sIGluY2x1ZGUsIHsgYXR0cmlidXRlczogW10sIGluY2x1ZGU6IFtdIH0pO1xyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KGluY2x1ZGUuaW5jbHVkZSkpIHtcclxuICAgICAgY29weS5pbmNsdWRlID0gaW5jbHVkZS5pbmNsdWRlXHJcbiAgICAgICAgLmZpbHRlcihpID0+IGkucmVxdWlyZWQpXHJcbiAgICAgICAgLm1hcChpbmMgPT4gdGhpcy5fZ2V0UmVxdWlyZWRDbG9zdXJlKGluYykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjb3B5O1xyXG4gIH1cclxuXHJcbiAgZ2V0UXVlcnlPcmRlcnMob3B0aW9ucywgbW9kZWwsIHN1YlF1ZXJ5KSB7XHJcbiAgICBjb25zdCBtYWluUXVlcnlPcmRlciA9IFtdO1xyXG4gICAgY29uc3Qgc3ViUXVlcnlPcmRlciA9IFtdO1xyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMub3JkZXIpKSB7XHJcbiAgICAgIGZvciAobGV0IG9yZGVyIG9mIG9wdGlvbnMub3JkZXIpIHtcclxuXHJcbiAgICAgICAgLy8gd3JhcCBpZiBub3QgYXJyYXlcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkob3JkZXIpKSB7XHJcbiAgICAgICAgICBvcmRlciA9IFtvcmRlcl07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBzdWJRdWVyeVxyXG4gICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShvcmRlcilcclxuICAgICAgICAgICYmIG9yZGVyWzBdXHJcbiAgICAgICAgICAmJiAhKG9yZGVyWzBdIGluc3RhbmNlb2YgQXNzb2NpYXRpb24pXHJcbiAgICAgICAgICAmJiAhKHR5cGVvZiBvcmRlclswXSA9PT0gJ2Z1bmN0aW9uJyAmJiBvcmRlclswXS5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbClcclxuICAgICAgICAgICYmICEodHlwZW9mIG9yZGVyWzBdLm1vZGVsID09PSAnZnVuY3Rpb24nICYmIG9yZGVyWzBdLm1vZGVsLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKVxyXG4gICAgICAgICAgJiYgISh0eXBlb2Ygb3JkZXJbMF0gPT09ICdzdHJpbmcnICYmIG1vZGVsICYmIG1vZGVsLmFzc29jaWF0aW9ucyAhPT0gdW5kZWZpbmVkICYmIG1vZGVsLmFzc29jaWF0aW9uc1tvcmRlclswXV0pXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBzdWJRdWVyeU9yZGVyLnB1c2godGhpcy5xdW90ZShvcmRlciwgbW9kZWwsICctPicpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdWJRdWVyeSkge1xyXG4gICAgICAgICAgLy8gSGFuZGxlIGNhc2Ugd2hlcmUgc3ViLXF1ZXJ5IHJlbmFtZXMgYXR0cmlidXRlIHdlIHdhbnQgdG8gb3JkZXIgYnksXHJcbiAgICAgICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3NlcXVlbGl6ZS9zZXF1ZWxpemUvaXNzdWVzLzg3MzlcclxuICAgICAgICAgIGNvbnN0IHN1YlF1ZXJ5QXR0cmlidXRlID0gb3B0aW9ucy5hdHRyaWJ1dGVzLmZpbmQoYSA9PiBBcnJheS5pc0FycmF5KGEpICYmIGFbMF0gPT09IG9yZGVyWzBdICYmIGFbMV0pO1xyXG4gICAgICAgICAgaWYgKHN1YlF1ZXJ5QXR0cmlidXRlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1vZGVsTmFtZSA9IHRoaXMucXVvdGVJZGVudGlmaWVyKG1vZGVsLm5hbWUpO1xyXG5cclxuICAgICAgICAgICAgb3JkZXJbMF0gPSBuZXcgVXRpbHMuQ29sKHRoaXMuX2dldEFsaWFzRm9yRmllbGQobW9kZWxOYW1lLCBzdWJRdWVyeUF0dHJpYnV0ZVsxXSwgb3B0aW9ucykgfHwgc3ViUXVlcnlBdHRyaWJ1dGVbMV0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFpblF1ZXJ5T3JkZXIucHVzaCh0aGlzLnF1b3RlKG9yZGVyLCBtb2RlbCwgJy0+JykpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMub3JkZXIgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcclxuICAgICAgY29uc3Qgc3FsID0gdGhpcy5xdW90ZShvcHRpb25zLm9yZGVyLCBtb2RlbCwgJy0+Jyk7XHJcbiAgICAgIGlmIChzdWJRdWVyeSkge1xyXG4gICAgICAgIHN1YlF1ZXJ5T3JkZXIucHVzaChzcWwpO1xyXG4gICAgICB9XHJcbiAgICAgIG1haW5RdWVyeU9yZGVyLnB1c2goc3FsKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignT3JkZXIgbXVzdCBiZSB0eXBlIG9mIGFycmF5IG9yIGluc3RhbmNlIG9mIGEgdmFsaWQgc2VxdWVsaXplIG1ldGhvZC4nKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geyBtYWluUXVlcnlPcmRlciwgc3ViUXVlcnlPcmRlciB9O1xyXG4gIH1cclxuXHJcbiAgc2VsZWN0RnJvbVRhYmxlRnJhZ21lbnQob3B0aW9ucywgbW9kZWwsIGF0dHJpYnV0ZXMsIHRhYmxlcywgbWFpblRhYmxlQXMpIHtcclxuICAgIGxldCBmcmFnbWVudCA9IGBTRUxFQ1QgJHthdHRyaWJ1dGVzLmpvaW4oJywgJyl9IEZST00gJHt0YWJsZXN9YDtcclxuXHJcbiAgICBpZiAobWFpblRhYmxlQXMpIHtcclxuICAgICAgZnJhZ21lbnQgKz0gYCBBUyAke21haW5UYWJsZUFzfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuaW5kZXhIaW50cyAmJiB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluZGV4SGludHMpIHtcclxuICAgICAgZm9yIChjb25zdCBoaW50IG9mIG9wdGlvbnMuaW5kZXhIaW50cykge1xyXG4gICAgICAgIGlmIChJbmRleEhpbnRzW2hpbnQudHlwZV0pIHtcclxuICAgICAgICAgIGZyYWdtZW50ICs9IGAgJHtJbmRleEhpbnRzW2hpbnQudHlwZV19IElOREVYICgke2hpbnQudmFsdWVzLm1hcChpbmRleE5hbWUgPT4gdGhpcy5xdW90ZUlkZW50aWZpZXJzKGluZGV4TmFtZSkpLmpvaW4oJywnKX0pYDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZnJhZ21lbnQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIFNRTCBmcmFnbWVudCBmb3IgYWRkaW5nIHJlc3VsdCBjb25zdHJhaW50cy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBBbiBvYmplY3Qgd2l0aCBzZWxlY3RRdWVyeSBvcHRpb25zLlxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9ICAgICAgICAgVGhlIGdlbmVyYXRlZCBzcWwgcXVlcnkuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBhZGRMaW1pdEFuZE9mZnNldChvcHRpb25zKSB7XHJcbiAgICBsZXQgZnJhZ21lbnQgPSAnJztcclxuXHJcbiAgICAvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG4gICAgaWYgKG9wdGlvbnMub2Zmc2V0ICE9IG51bGwgJiYgb3B0aW9ucy5saW1pdCA9PSBudWxsKSB7XHJcbiAgICAgIGZyYWdtZW50ICs9ICcgTElNSVQgJyArIHRoaXMuZXNjYXBlKG9wdGlvbnMub2Zmc2V0KSArICcsICcgKyAxMDAwMDAwMDAwMDAwMDtcclxuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5saW1pdCAhPSBudWxsKSB7XHJcbiAgICAgIGlmIChvcHRpb25zLm9mZnNldCAhPSBudWxsKSB7XHJcbiAgICAgICAgZnJhZ21lbnQgKz0gJyBMSU1JVCAnICsgdGhpcy5lc2NhcGUob3B0aW9ucy5vZmZzZXQpICsgJywgJyArIHRoaXMuZXNjYXBlKG9wdGlvbnMubGltaXQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZyYWdtZW50ICs9ICcgTElNSVQgJyArIHRoaXMuZXNjYXBlKG9wdGlvbnMubGltaXQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvKiBlc2xpbnQtZW5hYmxlICovXHJcblxyXG4gICAgcmV0dXJuIGZyYWdtZW50O1xyXG4gIH1cclxuXHJcbiAgaGFuZGxlU2VxdWVsaXplTWV0aG9kKHNtdGgsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCkge1xyXG4gICAgbGV0IHJlc3VsdDtcclxuXHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuT3BlcmF0b3JNYXAsIHNtdGguY29tcGFyYXRvcikpIHtcclxuICAgICAgc210aC5jb21wYXJhdG9yID0gdGhpcy5PcGVyYXRvck1hcFtzbXRoLmNvbXBhcmF0b3JdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzbXRoIGluc3RhbmNlb2YgVXRpbHMuV2hlcmUpIHtcclxuICAgICAgbGV0IHZhbHVlID0gc210aC5sb2dpYztcclxuICAgICAgbGV0IGtleTtcclxuXHJcbiAgICAgIGlmIChzbXRoLmF0dHJpYnV0ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCkge1xyXG4gICAgICAgIGtleSA9IHRoaXMuZ2V0V2hlcmVDb25kaXRpb25zKHNtdGguYXR0cmlidXRlLCB0YWJsZU5hbWUsIGZhY3RvcnksIG9wdGlvbnMsIHByZXBlbmQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGtleSA9IGAke3RoaXMucXVvdGVUYWJsZShzbXRoLmF0dHJpYnV0ZS5Nb2RlbC5uYW1lKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihzbXRoLmF0dHJpYnV0ZS5maWVsZCB8fCBzbXRoLmF0dHJpYnV0ZS5maWVsZE5hbWUpfWA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCkge1xyXG4gICAgICAgIHZhbHVlID0gdGhpcy5nZXRXaGVyZUNvbmRpdGlvbnModmFsdWUsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCk7XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gJ05VTEwnKSB7XHJcbiAgICAgICAgICBpZiAoc210aC5jb21wYXJhdG9yID09PSAnPScpIHtcclxuICAgICAgICAgICAgc210aC5jb21wYXJhdG9yID0gJ0lTJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChzbXRoLmNvbXBhcmF0b3IgPT09ICchPScpIHtcclxuICAgICAgICAgICAgc210aC5jb21wYXJhdG9yID0gJ0lTIE5PVCc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gW2tleSwgdmFsdWVdLmpvaW4oYCAke3NtdGguY29tcGFyYXRvcn0gYCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdCh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy53aGVyZUl0ZW1RdWVyeShzbXRoLmF0dHJpYnV0ZSwgdmFsdWUsIHtcclxuICAgICAgICAgIG1vZGVsOiBmYWN0b3J5XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgdmFsdWUgPSB0aGlzLmJvb2xlYW5WYWx1ZSh2YWx1ZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFsdWUgPSB0aGlzLmVzY2FwZSh2YWx1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh2YWx1ZSA9PT0gJ05VTEwnKSB7XHJcbiAgICAgICAgaWYgKHNtdGguY29tcGFyYXRvciA9PT0gJz0nKSB7XHJcbiAgICAgICAgICBzbXRoLmNvbXBhcmF0b3IgPSAnSVMnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc210aC5jb21wYXJhdG9yID09PSAnIT0nKSB7XHJcbiAgICAgICAgICBzbXRoLmNvbXBhcmF0b3IgPSAnSVMgTk9UJztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBba2V5LCB2YWx1ZV0uam9pbihgICR7c210aC5jb21wYXJhdG9yfSBgKTtcclxuICAgIH1cclxuICAgIGlmIChzbXRoIGluc3RhbmNlb2YgVXRpbHMuTGl0ZXJhbCkge1xyXG4gICAgICByZXR1cm4gc210aC52YWw7XHJcbiAgICB9XHJcbiAgICBpZiAoc210aCBpbnN0YW5jZW9mIFV0aWxzLkNhc3QpIHtcclxuICAgICAgaWYgKHNtdGgudmFsIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2Qoc210aC52YWwsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoXy5pc1BsYWluT2JqZWN0KHNtdGgudmFsKSkge1xyXG4gICAgICAgIHJlc3VsdCA9IHRoaXMud2hlcmVJdGVtc1F1ZXJ5KHNtdGgudmFsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSB0aGlzLmVzY2FwZShzbXRoLnZhbCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBgQ0FTVCgke3Jlc3VsdH0gQVMgJHtzbXRoLnR5cGUudG9VcHBlckNhc2UoKX0pYDtcclxuICAgIH1cclxuICAgIGlmIChzbXRoIGluc3RhbmNlb2YgVXRpbHMuRm4pIHtcclxuICAgICAgcmV0dXJuIGAke3NtdGguZm59KCR7c210aC5hcmdzLm1hcChhcmcgPT4ge1xyXG4gICAgICAgIGlmIChhcmcgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVNlcXVlbGl6ZU1ldGhvZChhcmcsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QoYXJnKSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMud2hlcmVJdGVtc1F1ZXJ5KGFyZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmVzY2FwZShhcmcpO1xyXG4gICAgICB9KS5qb2luKCcsICcpfSlgO1xyXG4gICAgfVxyXG4gICAgaWYgKHNtdGggaW5zdGFuY2VvZiBVdGlscy5Db2wpIHtcclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc210aC5jb2wpICYmICFmYWN0b3J5KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2FsbCBTZXF1ZWxpemUuY29sKCkgd2l0aCBhcnJheSBvdXRzaWRlIG9mIG9yZGVyIC8gZ3JvdXAgY2xhdXNlJyk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHNtdGguY29sLnN0YXJ0c1dpdGgoJyonKSkge1xyXG4gICAgICAgIHJldHVybiAnKic7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMucXVvdGUoc210aC5jb2wsIGZhY3RvcnkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtdGgudG9TdHJpbmcodGhpcywgZmFjdG9yeSk7XHJcbiAgfVxyXG5cclxuICB3aGVyZVF1ZXJ5KHdoZXJlLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCBxdWVyeSA9IHRoaXMud2hlcmVJdGVtc1F1ZXJ5KHdoZXJlLCBvcHRpb25zKTtcclxuICAgIGlmIChxdWVyeSAmJiBxdWVyeS5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuIGBXSEVSRSAke3F1ZXJ5fWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJyc7XHJcbiAgfVxyXG5cclxuICB3aGVyZUl0ZW1zUXVlcnkod2hlcmUsIG9wdGlvbnMsIGJpbmRpbmcpIHtcclxuICAgIGlmIChcclxuICAgICAgd2hlcmUgPT09IG51bGwgfHxcclxuICAgICAgd2hlcmUgPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICBVdGlscy5nZXRDb21wbGV4U2l6ZSh3aGVyZSkgPT09IDBcclxuICAgICkge1xyXG4gICAgICAvLyBOTyBPUFxyXG4gICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiB3aGVyZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdXBwb3J0IGZvciBge3doZXJlOiBcXCdyYXcgcXVlcnlcXCd9YCBoYXMgYmVlbiByZW1vdmVkLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGl0ZW1zID0gW107XHJcblxyXG4gICAgYmluZGluZyA9IGJpbmRpbmcgfHwgJ0FORCc7XHJcbiAgICBpZiAoYmluZGluZ1swXSAhPT0gJyAnKSBiaW5kaW5nID0gYCAke2JpbmRpbmd9IGA7XHJcblxyXG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdCh3aGVyZSkpIHtcclxuICAgICAgVXRpbHMuZ2V0Q29tcGxleEtleXMod2hlcmUpLmZvckVhY2gocHJvcCA9PiB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHdoZXJlW3Byb3BdO1xyXG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy53aGVyZUl0ZW1RdWVyeShwcm9wLCBpdGVtLCBvcHRpb25zKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaXRlbXMucHVzaCh0aGlzLndoZXJlSXRlbVF1ZXJ5KHVuZGVmaW5lZCwgd2hlcmUsIG9wdGlvbnMpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXRlbXMubGVuZ3RoICYmIGl0ZW1zLmZpbHRlcihpdGVtID0+IGl0ZW0gJiYgaXRlbS5sZW5ndGgpLmpvaW4oYmluZGluZykgfHwgJyc7XHJcbiAgfVxyXG5cclxuICB3aGVyZUl0ZW1RdWVyeShrZXksIHZhbHVlLCBvcHRpb25zID0ge30pIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgV0hFUkUgcGFyYW1ldGVyIFwiJHtrZXl9XCIgaGFzIGludmFsaWQgXCJ1bmRlZmluZWRcIiB2YWx1ZWApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyAmJiBrZXkuaW5jbHVkZXMoJy4nKSAmJiBvcHRpb25zLm1vZGVsKSB7XHJcbiAgICAgIGNvbnN0IGtleVBhcnRzID0ga2V5LnNwbGl0KCcuJyk7XHJcbiAgICAgIGlmIChvcHRpb25zLm1vZGVsLnJhd0F0dHJpYnV0ZXNba2V5UGFydHNbMF1dICYmIG9wdGlvbnMubW9kZWwucmF3QXR0cmlidXRlc1trZXlQYXJ0c1swXV0udHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5KU09OKSB7XHJcbiAgICAgICAgY29uc3QgdG1wID0ge307XHJcbiAgICAgICAgY29uc3QgZmllbGQgPSBvcHRpb25zLm1vZGVsLnJhd0F0dHJpYnV0ZXNba2V5UGFydHNbMF1dO1xyXG4gICAgICAgIF8uc2V0KHRtcCwga2V5UGFydHMuc2xpY2UoMSksIHZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcy53aGVyZUl0ZW1RdWVyeShmaWVsZC5maWVsZCB8fCBrZXlQYXJ0c1swXSwgdG1wLCBPYmplY3QuYXNzaWduKHsgZmllbGQgfSwgb3B0aW9ucykpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZmllbGQgPSB0aGlzLl9maW5kRmllbGQoa2V5LCBvcHRpb25zKTtcclxuICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkICYmIGZpZWxkLnR5cGUgfHwgb3B0aW9ucy50eXBlO1xyXG5cclxuICAgIGNvbnN0IGlzUGxhaW5PYmplY3QgPSBfLmlzUGxhaW5PYmplY3QodmFsdWUpO1xyXG4gICAgY29uc3QgaXNBcnJheSA9ICFpc1BsYWluT2JqZWN0ICYmIEFycmF5LmlzQXJyYXkodmFsdWUpO1xyXG4gICAga2V5ID0gdGhpcy5PcGVyYXRvcnNBbGlhc01hcCAmJiB0aGlzLk9wZXJhdG9yc0FsaWFzTWFwW2tleV0gfHwga2V5O1xyXG4gICAgaWYgKGlzUGxhaW5PYmplY3QpIHtcclxuICAgICAgdmFsdWUgPSB0aGlzLl9yZXBsYWNlQWxpYXNlcyh2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCB2YWx1ZUtleXMgPSBpc1BsYWluT2JqZWN0ICYmIFV0aWxzLmdldENvbXBsZXhLZXlzKHZhbHVlKTtcclxuXHJcbiAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChpc1BsYWluT2JqZWN0ICYmIHZhbHVlS2V5cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy53aGVyZUl0ZW1RdWVyeSh2YWx1ZUtleXNbMF0sIHZhbHVlW3ZhbHVlS2V5c1swXV0sIG9wdGlvbnMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgIGNvbnN0IG9wVmFsdWUgPSBvcHRpb25zLmJpbmRQYXJhbSA/ICdOVUxMJyA6IHRoaXMuZXNjYXBlKHZhbHVlLCBmaWVsZCk7XHJcbiAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCBvcFZhbHVlLCB0aGlzLk9wZXJhdG9yTWFwW09wLmlzXSwgb3B0aW9ucy5wcmVmaXgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdmFsdWUpIHtcclxuICAgICAgY29uc3Qgb3BWYWx1ZSA9IG9wdGlvbnMuYmluZFBhcmFtID8gdGhpcy5mb3JtYXQodmFsdWUsIGZpZWxkLCBvcHRpb25zLCBvcHRpb25zLmJpbmRQYXJhbSkgOiB0aGlzLmVzY2FwZSh2YWx1ZSwgZmllbGQpO1xyXG4gICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgb3BWYWx1ZSwgdGhpcy5PcGVyYXRvck1hcFtPcC5lcV0sIG9wdGlvbnMucHJlZml4KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QgJiYgIShrZXkgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLkZuKSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2QodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbnZlcnQgd2hlcmU6IFtdIHRvIE9wLmFuZCBpZiBwb3NzaWJsZSwgZWxzZSB0cmVhdCBhcyBsaXRlcmFsL3JlcGxhY2VtZW50c1xyXG4gICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkICYmIGlzQXJyYXkpIHtcclxuICAgICAgaWYgKFV0aWxzLmNhblRyZWF0QXJyYXlBc0FuZCh2YWx1ZSkpIHtcclxuICAgICAgICBrZXkgPSBPcC5hbmQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdXBwb3J0IGZvciBsaXRlcmFsIHJlcGxhY2VtZW50cyBpbiB0aGUgYHdoZXJlYCBvYmplY3QgaGFzIGJlZW4gcmVtb3ZlZC4nKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChrZXkgPT09IE9wLm9yIHx8IGtleSA9PT0gT3AuYW5kIHx8IGtleSA9PT0gT3Aubm90KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl93aGVyZUdyb3VwQmluZChrZXksIHZhbHVlLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgaWYgKHZhbHVlW09wLm9yXSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fd2hlcmVCaW5kKHRoaXMuT3BlcmF0b3JNYXBbT3Aub3JdLCBrZXksIHZhbHVlW09wLm9yXSwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHZhbHVlW09wLmFuZF0pIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3doZXJlQmluZCh0aGlzLk9wZXJhdG9yTWFwW09wLmFuZF0sIGtleSwgdmFsdWVbT3AuYW5kXSwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzQXJyYXkgJiYgZmllbGRUeXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkFSUkFZKSB7XHJcbiAgICAgIGNvbnN0IG9wVmFsdWUgPSBvcHRpb25zLmJpbmRQYXJhbSA/IHRoaXMuZm9ybWF0KHZhbHVlLCBmaWVsZCwgb3B0aW9ucywgb3B0aW9ucy5iaW5kUGFyYW0pIDogdGhpcy5lc2NhcGUodmFsdWUsIGZpZWxkKTtcclxuICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIG9wVmFsdWUsIHRoaXMuT3BlcmF0b3JNYXBbT3AuZXFdLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzUGxhaW5PYmplY3QgJiYgZmllbGRUeXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkpTT04gJiYgb3B0aW9ucy5qc29uICE9PSBmYWxzZSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fd2hlcmVKU09OKGtleSwgdmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgbXVsdGlwbGUga2V5cyB3ZSBjb21iaW5lIHRoZSBkaWZmZXJlbnQgbG9naWMgY29uZGl0aW9uc1xyXG4gICAgaWYgKGlzUGxhaW5PYmplY3QgJiYgdmFsdWVLZXlzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3doZXJlQmluZCh0aGlzLk9wZXJhdG9yTWFwW09wLmFuZF0sIGtleSwgdmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc0FycmF5KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl93aGVyZVBhcnNlU2luZ2xlVmFsdWVPYmplY3Qoa2V5LCBmaWVsZCwgT3AuaW4sIHZhbHVlLCBvcHRpb25zKTtcclxuICAgIH1cclxuICAgIGlmIChpc1BsYWluT2JqZWN0KSB7XHJcbiAgICAgIGlmICh0aGlzLk9wZXJhdG9yTWFwW3ZhbHVlS2V5c1swXV0pIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fd2hlcmVQYXJzZVNpbmdsZVZhbHVlT2JqZWN0KGtleSwgZmllbGQsIHZhbHVlS2V5c1swXSwgdmFsdWVbdmFsdWVLZXlzWzBdXSwgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMuX3doZXJlUGFyc2VTaW5nbGVWYWx1ZU9iamVjdChrZXksIGZpZWxkLCB0aGlzLk9wZXJhdG9yTWFwW09wLmVxXSwgdmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChrZXkgPT09IE9wLnBsYWNlaG9sZGVyKSB7XHJcbiAgICAgIGNvbnN0IG9wVmFsdWUgPSBvcHRpb25zLmJpbmRQYXJhbSA/IHRoaXMuZm9ybWF0KHZhbHVlLCBmaWVsZCwgb3B0aW9ucywgb3B0aW9ucy5iaW5kUGFyYW0pIDogdGhpcy5lc2NhcGUodmFsdWUsIGZpZWxkKTtcclxuICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZSh0aGlzLk9wZXJhdG9yTWFwW2tleV0sIG9wVmFsdWUsIHRoaXMuT3BlcmF0b3JNYXBbT3AuZXFdLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgb3BWYWx1ZSA9IG9wdGlvbnMuYmluZFBhcmFtID8gdGhpcy5mb3JtYXQodmFsdWUsIGZpZWxkLCBvcHRpb25zLCBvcHRpb25zLmJpbmRQYXJhbSkgOiB0aGlzLmVzY2FwZSh2YWx1ZSwgZmllbGQpO1xyXG4gICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIG9wVmFsdWUsIHRoaXMuT3BlcmF0b3JNYXBbT3AuZXFdLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgfVxyXG5cclxuICBfZmluZEZpZWxkKGtleSwgb3B0aW9ucykge1xyXG4gICAgaWYgKG9wdGlvbnMuZmllbGQpIHtcclxuICAgICAgcmV0dXJuIG9wdGlvbnMuZmllbGQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubW9kZWwgJiYgb3B0aW9ucy5tb2RlbC5yYXdBdHRyaWJ1dGVzICYmIG9wdGlvbnMubW9kZWwucmF3QXR0cmlidXRlc1trZXldKSB7XHJcbiAgICAgIHJldHVybiBvcHRpb25zLm1vZGVsLnJhd0F0dHJpYnV0ZXNba2V5XTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5tb2RlbCAmJiBvcHRpb25zLm1vZGVsLmZpZWxkUmF3QXR0cmlidXRlc01hcCAmJiBvcHRpb25zLm1vZGVsLmZpZWxkUmF3QXR0cmlidXRlc01hcFtrZXldKSB7XHJcbiAgICAgIHJldHVybiBvcHRpb25zLm1vZGVsLmZpZWxkUmF3QXR0cmlidXRlc01hcFtrZXldO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gT1IvQU5EL05PVCBncm91cGluZyBsb2dpY1xyXG4gIF93aGVyZUdyb3VwQmluZChrZXksIHZhbHVlLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCBiaW5kaW5nID0ga2V5ID09PSBPcC5vciA/IHRoaXMuT3BlcmF0b3JNYXBbT3Aub3JdIDogdGhpcy5PcGVyYXRvck1hcFtPcC5hbmRdO1xyXG4gICAgY29uc3Qgb3V0ZXJCaW5kaW5nID0ga2V5ID09PSBPcC5ub3QgPyAnTk9UICcgOiAnJztcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgdmFsdWUgPSB2YWx1ZS5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgbGV0IGl0ZW1RdWVyeSA9IHRoaXMud2hlcmVJdGVtc1F1ZXJ5KGl0ZW0sIG9wdGlvbnMsIHRoaXMuT3BlcmF0b3JNYXBbT3AuYW5kXSk7XHJcbiAgICAgICAgaWYgKGl0ZW1RdWVyeSAmJiBpdGVtUXVlcnkubGVuZ3RoICYmIChBcnJheS5pc0FycmF5KGl0ZW0pIHx8IF8uaXNQbGFpbk9iamVjdChpdGVtKSkgJiYgVXRpbHMuZ2V0Q29tcGxleFNpemUoaXRlbSkgPiAxKSB7XHJcbiAgICAgICAgICBpdGVtUXVlcnkgPSBgKCR7aXRlbVF1ZXJ5fSlgO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaXRlbVF1ZXJ5O1xyXG4gICAgICB9KS5maWx0ZXIoaXRlbSA9PiBpdGVtICYmIGl0ZW0ubGVuZ3RoKTtcclxuXHJcbiAgICAgIHZhbHVlID0gdmFsdWUubGVuZ3RoICYmIHZhbHVlLmpvaW4oYmluZGluZyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YWx1ZSA9IHRoaXMud2hlcmVJdGVtc1F1ZXJ5KHZhbHVlLCBvcHRpb25zLCBiaW5kaW5nKTtcclxuICAgIH1cclxuICAgIC8vIE9wLm9yOiBbXSBzaG91bGQgcmV0dXJuIG5vIGRhdGEuXHJcbiAgICAvLyBPcC5ub3Qgb2Ygbm8gcmVzdHJpY3Rpb24gc2hvdWxkIGFsc28gcmV0dXJuIG5vIGRhdGFcclxuICAgIGlmICgoa2V5ID09PSBPcC5vciB8fCBrZXkgPT09IE9wLm5vdCkgJiYgIXZhbHVlKSB7XHJcbiAgICAgIHJldHVybiAnMCA9IDEnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB2YWx1ZSA/IGAke291dGVyQmluZGluZ30oJHt2YWx1ZX0pYCA6IHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIF93aGVyZUJpbmQoYmluZGluZywga2V5LCB2YWx1ZSwgb3B0aW9ucykge1xyXG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdCh2YWx1ZSkpIHtcclxuICAgICAgdmFsdWUgPSBVdGlscy5nZXRDb21wbGV4S2V5cyh2YWx1ZSkubWFwKHByb3AgPT4ge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB2YWx1ZVtwcm9wXTtcclxuICAgICAgICByZXR1cm4gdGhpcy53aGVyZUl0ZW1RdWVyeShrZXksIHsgW3Byb3BdOiBpdGVtIH0sIG9wdGlvbnMpO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhbHVlID0gdmFsdWUubWFwKGl0ZW0gPT4gdGhpcy53aGVyZUl0ZW1RdWVyeShrZXksIGl0ZW0sIG9wdGlvbnMpKTtcclxuICAgIH1cclxuXHJcbiAgICB2YWx1ZSA9IHZhbHVlLmZpbHRlcihpdGVtID0+IGl0ZW0gJiYgaXRlbS5sZW5ndGgpO1xyXG5cclxuICAgIHJldHVybiB2YWx1ZS5sZW5ndGggPyBgKCR7dmFsdWUuam9pbihiaW5kaW5nKX0pYCA6IHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIF93aGVyZUpTT04oa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xyXG4gICAgY29uc3QgaXRlbXMgPSBbXTtcclxuICAgIGxldCBiYXNlS2V5ID0gdGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KTtcclxuICAgIGlmIChvcHRpb25zLnByZWZpeCkge1xyXG4gICAgICBpZiAob3B0aW9ucy5wcmVmaXggaW5zdGFuY2VvZiBVdGlscy5MaXRlcmFsKSB7XHJcbiAgICAgICAgYmFzZUtleSA9IGAke3RoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKG9wdGlvbnMucHJlZml4KX0uJHtiYXNlS2V5fWA7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYmFzZUtleSA9IGAke3RoaXMucXVvdGVUYWJsZShvcHRpb25zLnByZWZpeCl9LiR7YmFzZUtleX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgVXRpbHMuZ2V0T3BlcmF0b3JzKHZhbHVlKS5mb3JFYWNoKG9wID0+IHtcclxuICAgICAgY29uc3Qgd2hlcmUgPSB7XHJcbiAgICAgICAgW29wXTogdmFsdWVbb3BdXHJcbiAgICAgIH07XHJcbiAgICAgIGl0ZW1zLnB1c2godGhpcy53aGVyZUl0ZW1RdWVyeShrZXksIHdoZXJlLCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7IGpzb246IGZhbHNlIH0pKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBfLmZvck93bih2YWx1ZSwgKGl0ZW0sIHByb3ApID0+IHtcclxuICAgICAgdGhpcy5fdHJhdmVyc2VKU09OKGl0ZW1zLCBiYXNlS2V5LCBwcm9wLCBpdGVtLCBbcHJvcF0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcmVzdWx0ID0gaXRlbXMuam9pbih0aGlzLk9wZXJhdG9yTWFwW09wLmFuZF0pO1xyXG4gICAgcmV0dXJuIGl0ZW1zLmxlbmd0aCA+IDEgPyBgKCR7cmVzdWx0fSlgIDogcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgX3RyYXZlcnNlSlNPTihpdGVtcywgYmFzZUtleSwgcHJvcCwgaXRlbSwgcGF0aCkge1xyXG4gICAgbGV0IGNhc3Q7XHJcblxyXG4gICAgaWYgKHBhdGhbcGF0aC5sZW5ndGggLSAxXS5pbmNsdWRlcygnOjonKSkge1xyXG4gICAgICBjb25zdCB0bXAgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV0uc3BsaXQoJzo6Jyk7XHJcbiAgICAgIGNhc3QgPSB0bXBbMV07XHJcbiAgICAgIHBhdGhbcGF0aC5sZW5ndGggLSAxXSA9IHRtcFswXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXRoS2V5ID0gdGhpcy5qc29uUGF0aEV4dHJhY3Rpb25RdWVyeShiYXNlS2V5LCBwYXRoKTtcclxuXHJcbiAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGl0ZW0pKSB7XHJcbiAgICAgIFV0aWxzLmdldE9wZXJhdG9ycyhpdGVtKS5mb3JFYWNoKG9wID0+IHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuX3RvSlNPTlZhbHVlKGl0ZW1bb3BdKTtcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMud2hlcmVJdGVtUXVlcnkodGhpcy5fY2FzdEtleShwYXRoS2V5LCB2YWx1ZSwgY2FzdCksIHsgW29wXTogdmFsdWUgfSkpO1xyXG4gICAgICB9KTtcclxuICAgICAgXy5mb3JPd24oaXRlbSwgKHZhbHVlLCBpdGVtUHJvcCkgPT4ge1xyXG4gICAgICAgIHRoaXMuX3RyYXZlcnNlSlNPTihpdGVtcywgYmFzZUtleSwgaXRlbVByb3AsIHZhbHVlLCBwYXRoLmNvbmNhdChbaXRlbVByb3BdKSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGl0ZW0gPSB0aGlzLl90b0pTT05WYWx1ZShpdGVtKTtcclxuICAgIGl0ZW1zLnB1c2godGhpcy53aGVyZUl0ZW1RdWVyeSh0aGlzLl9jYXN0S2V5KHBhdGhLZXksIGl0ZW0sIGNhc3QpLCB7IFtPcC5lcV06IGl0ZW0gfSkpO1xyXG4gIH1cclxuXHJcbiAgX3RvSlNPTlZhbHVlKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBfY2FzdEtleShrZXksIHZhbHVlLCBjYXN0LCBqc29uKSB7XHJcbiAgICBjYXN0ID0gY2FzdCB8fCB0aGlzLl9nZXRKc29uQ2FzdChBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlWzBdIDogdmFsdWUpO1xyXG4gICAgaWYgKGNhc3QpIHtcclxuICAgICAgcmV0dXJuIG5ldyBVdGlscy5MaXRlcmFsKHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKG5ldyBVdGlscy5DYXN0KG5ldyBVdGlscy5MaXRlcmFsKGtleSksIGNhc3QsIGpzb24pKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBVdGlscy5MaXRlcmFsKGtleSk7XHJcbiAgfVxyXG5cclxuICBfZ2V0SnNvbkNhc3QodmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XHJcbiAgICAgIHJldHVybiAnZG91YmxlIHByZWNpc2lvbic7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgIHJldHVybiAndGltZXN0YW1wdHonO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgIHJldHVybiAnYm9vbGVhbic7XHJcbiAgICB9XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBfam9pbktleVZhbHVlKGtleSwgdmFsdWUsIGNvbXBhcmF0b3IsIHByZWZpeCkge1xyXG4gICAgaWYgKCFrZXkpIHtcclxuICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG4gICAgaWYgKGNvbXBhcmF0b3IgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7a2V5fSBhbmQgJHt2YWx1ZX0gaGFzIG5vIGNvbXBhcmF0b3JgKTtcclxuICAgIH1cclxuICAgIGtleSA9IHRoaXMuX2dldFNhZmVLZXkoa2V5LCBwcmVmaXgpO1xyXG4gICAgcmV0dXJuIFtrZXksIHZhbHVlXS5qb2luKGAgJHtjb21wYXJhdG9yfSBgKTtcclxuICB9XHJcblxyXG4gIF9nZXRTYWZlS2V5KGtleSwgcHJlZml4KSB7XHJcbiAgICBpZiAoa2V5IGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XHJcbiAgICAgIGtleSA9IHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKGtleSk7XHJcbiAgICAgIHJldHVybiB0aGlzLl9wcmVmaXhLZXkodGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2Qoa2V5KSwgcHJlZml4KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoVXRpbHMuaXNDb2xTdHJpbmcoa2V5KSkge1xyXG4gICAgICBrZXkgPSBrZXkuc3Vic3RyKDEsIGtleS5sZW5ndGggLSAyKS5zcGxpdCgnLicpO1xyXG5cclxuICAgICAgaWYgKGtleS5sZW5ndGggPiAyKSB7XHJcbiAgICAgICAga2V5ID0gW1xyXG4gICAgICAgICAgLy8gam9pbiB0aGUgdGFibGVzIGJ5IC0+IHRvIG1hdGNoIG91dCBpbnRlcm5hbCBuYW1pbmdzXHJcbiAgICAgICAgICBrZXkuc2xpY2UoMCwgLTEpLmpvaW4oJy0+JyksXHJcbiAgICAgICAgICBrZXlba2V5Lmxlbmd0aCAtIDFdXHJcbiAgICAgICAgXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGtleS5tYXAoaWRlbnRpZmllciA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihpZGVudGlmaWVyKSkuam9pbignLicpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLl9wcmVmaXhLZXkodGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KSwgcHJlZml4KTtcclxuICB9XHJcblxyXG4gIF9wcmVmaXhLZXkoa2V5LCBwcmVmaXgpIHtcclxuICAgIGlmIChwcmVmaXgpIHtcclxuICAgICAgaWYgKHByZWZpeCBpbnN0YW5jZW9mIFV0aWxzLkxpdGVyYWwpIHtcclxuICAgICAgICByZXR1cm4gW3RoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKHByZWZpeCksIGtleV0uam9pbignLicpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gW3RoaXMucXVvdGVUYWJsZShwcmVmaXgpLCBrZXldLmpvaW4oJy4nKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ga2V5O1xyXG4gIH1cclxuXHJcbiAgX3doZXJlUGFyc2VTaW5nbGVWYWx1ZU9iamVjdChrZXksIGZpZWxkLCBwcm9wLCB2YWx1ZSwgb3B0aW9ucykge1xyXG4gICAgaWYgKHByb3AgPT09IE9wLm5vdCkge1xyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICBwcm9wID0gT3Aubm90SW47XHJcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHRydWUgJiYgdmFsdWUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgcHJvcCA9IE9wLm5lO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNvbXBhcmF0b3IgPSB0aGlzLk9wZXJhdG9yTWFwW3Byb3BdIHx8IHRoaXMuT3BlcmF0b3JNYXBbT3AuZXFdO1xyXG5cclxuICAgIHN3aXRjaCAocHJvcCkge1xyXG4gICAgICBjYXNlIE9wLmluOlxyXG4gICAgICBjYXNlIE9wLm5vdEluOlxyXG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLkxpdGVyYWwpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCB2YWx1ZS52YWwsIGNvbXBhcmF0b3IsIG9wdGlvbnMucHJlZml4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCBgKCR7dmFsdWUubWFwKGl0ZW0gPT4gdGhpcy5lc2NhcGUoaXRlbSwgZmllbGQpKS5qb2luKCcsICcpfSlgLCBjb21wYXJhdG9yLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY29tcGFyYXRvciA9PT0gdGhpcy5PcGVyYXRvck1hcFtPcC5pbl0pIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCAnKE5VTEwpJywgY29tcGFyYXRvciwgb3B0aW9ucy5wcmVmaXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICBjYXNlIE9wLmFueTpcclxuICAgICAgY2FzZSBPcC5hbGw6XHJcbiAgICAgICAgY29tcGFyYXRvciA9IGAke3RoaXMuT3BlcmF0b3JNYXBbT3AuZXFdfSAke2NvbXBhcmF0b3J9YDtcclxuICAgICAgICBpZiAodmFsdWVbT3AudmFsdWVzXSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIGAoVkFMVUVTICR7dmFsdWVbT3AudmFsdWVzXS5tYXAoaXRlbSA9PiBgKCR7dGhpcy5lc2NhcGUoaXRlbSl9KWApLmpvaW4oJywgJyl9KWAsIGNvbXBhcmF0b3IsIG9wdGlvbnMucHJlZml4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCBgKCR7dGhpcy5lc2NhcGUodmFsdWUsIGZpZWxkKX0pYCwgY29tcGFyYXRvciwgb3B0aW9ucy5wcmVmaXgpO1xyXG4gICAgICBjYXNlIE9wLmJldHdlZW46XHJcbiAgICAgIGNhc2UgT3Aubm90QmV0d2VlbjpcclxuICAgICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgYCR7dGhpcy5lc2NhcGUodmFsdWVbMF0sIGZpZWxkKX0gQU5EICR7dGhpcy5lc2NhcGUodmFsdWVbMV0sIGZpZWxkKX1gLCBjb21wYXJhdG9yLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgICAgIGNhc2UgT3AucmF3OlxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGAkcmF3YCB3aGVyZSBwcm9wZXJ0eSBpcyBubyBsb25nZXIgc3VwcG9ydGVkLiAgVXNlIGBzZXF1ZWxpemUubGl0ZXJhbGAgaW5zdGVhZC4nKTtcclxuICAgICAgY2FzZSBPcC5jb2w6XHJcbiAgICAgICAgY29tcGFyYXRvciA9IHRoaXMuT3BlcmF0b3JNYXBbT3AuZXFdO1xyXG4gICAgICAgIHZhbHVlID0gdmFsdWUuc3BsaXQoJy4nKTtcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICAgIHZhbHVlID0gW1xyXG4gICAgICAgICAgICAvLyBqb2luIHRoZSB0YWJsZXMgYnkgLT4gdG8gbWF0Y2ggb3V0IGludGVybmFsIG5hbWluZ3NcclxuICAgICAgICAgICAgdmFsdWUuc2xpY2UoMCwgLTEpLmpvaW4oJy0+JyksXHJcbiAgICAgICAgICAgIHZhbHVlW3ZhbHVlLmxlbmd0aCAtIDFdXHJcbiAgICAgICAgICBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIHZhbHVlLm1hcChpZGVudGlmaWVyID0+IHRoaXMucXVvdGVJZGVudGlmaWVyKGlkZW50aWZpZXIpKS5qb2luKCcuJyksIGNvbXBhcmF0b3IsIG9wdGlvbnMucHJlZml4KTtcclxuICAgICAgY2FzZSBPcC5zdGFydHNXaXRoOlxyXG4gICAgICAgIGNvbXBhcmF0b3IgPSB0aGlzLk9wZXJhdG9yTWFwW09wLmxpa2VdO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCB0aGlzLmVzY2FwZShgJHt2YWx1ZX0lYCksIGNvbXBhcmF0b3IsIG9wdGlvbnMucHJlZml4KTtcclxuICAgICAgY2FzZSBPcC5lbmRzV2l0aDpcclxuICAgICAgICBjb21wYXJhdG9yID0gdGhpcy5PcGVyYXRvck1hcFtPcC5saWtlXTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgdGhpcy5lc2NhcGUoYCUke3ZhbHVlfWApLCBjb21wYXJhdG9yLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgICAgIGNhc2UgT3Auc3Vic3RyaW5nOlxyXG4gICAgICAgIGNvbXBhcmF0b3IgPSB0aGlzLk9wZXJhdG9yTWFwW09wLmxpa2VdO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCB0aGlzLmVzY2FwZShgJSR7dmFsdWV9JWApLCBjb21wYXJhdG9yLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZXNjYXBlT3B0aW9ucyA9IHtcclxuICAgICAgYWNjZXB0U3RyaW5nczogY29tcGFyYXRvci5pbmNsdWRlcyh0aGlzLk9wZXJhdG9yTWFwW09wLmxpa2VdKVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoXy5pc1BsYWluT2JqZWN0KHZhbHVlKSkge1xyXG4gICAgICBpZiAodmFsdWVbT3AuY29sXSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCB0aGlzLndoZXJlSXRlbVF1ZXJ5KG51bGwsIHZhbHVlKSwgY29tcGFyYXRvciwgb3B0aW9ucy5wcmVmaXgpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh2YWx1ZVtPcC5hbnldKSB7XHJcbiAgICAgICAgZXNjYXBlT3B0aW9ucy5pc0xpc3QgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCBgKCR7dGhpcy5lc2NhcGUodmFsdWVbT3AuYW55XSwgZmllbGQsIGVzY2FwZU9wdGlvbnMpfSlgLCBgJHtjb21wYXJhdG9yfSAke3RoaXMuT3BlcmF0b3JNYXBbT3AuYW55XX1gLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHZhbHVlW09wLmFsbF0pIHtcclxuICAgICAgICBlc2NhcGVPcHRpb25zLmlzTGlzdCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIGAoJHt0aGlzLmVzY2FwZSh2YWx1ZVtPcC5hbGxdLCBmaWVsZCwgZXNjYXBlT3B0aW9ucyl9KWAsIGAke2NvbXBhcmF0b3J9ICR7dGhpcy5PcGVyYXRvck1hcFtPcC5hbGxdfWAsIG9wdGlvbnMucHJlZml4KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCAmJiBjb21wYXJhdG9yID09PSB0aGlzLk9wZXJhdG9yTWFwW09wLmVxXSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgdGhpcy5lc2NhcGUodmFsdWUsIGZpZWxkLCBlc2NhcGVPcHRpb25zKSwgdGhpcy5PcGVyYXRvck1hcFtPcC5pc10sIG9wdGlvbnMucHJlZml4KTtcclxuICAgIH1cclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCAmJiBjb21wYXJhdG9yID09PSB0aGlzLk9wZXJhdG9yTWFwW09wLm5lXSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgdGhpcy5lc2NhcGUodmFsdWUsIGZpZWxkLCBlc2NhcGVPcHRpb25zKSwgdGhpcy5PcGVyYXRvck1hcFtPcC5ub3RdLCBvcHRpb25zLnByZWZpeCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIHRoaXMuZXNjYXBlKHZhbHVlLCBmaWVsZCwgZXNjYXBlT3B0aW9ucyksIGNvbXBhcmF0b3IsIG9wdGlvbnMucHJlZml4KTtcclxuICB9XHJcblxyXG4gIC8qXHJcbiAgICBUYWtlcyBzb21ldGhpbmcgYW5kIHRyYW5zZm9ybXMgaXQgaW50byB2YWx1ZXMgb2YgYSB3aGVyZSBjb25kaXRpb24uXHJcbiAgIEBwcml2YXRlXHJcbiAgKi9cclxuICBnZXRXaGVyZUNvbmRpdGlvbnMoc210aCwgdGFibGVOYW1lLCBmYWN0b3J5LCBvcHRpb25zLCBwcmVwZW5kKSB7XHJcbiAgICBjb25zdCB3aGVyZSA9IHt9O1xyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KHRhYmxlTmFtZSkpIHtcclxuICAgICAgdGFibGVOYW1lID0gdGFibGVOYW1lWzBdO1xyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh0YWJsZU5hbWUpKSB7XHJcbiAgICAgICAgdGFibGVOYW1lID0gdGFibGVOYW1lWzFdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgaWYgKHByZXBlbmQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBwcmVwZW5kID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc210aCAmJiBzbXRoIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7IC8vIENoZWNraW5nIGEgcHJvcGVydHkgaXMgY2hlYXBlciB0aGFuIGEgbG90IG9mIGluc3RhbmNlb2YgY2FsbHNcclxuICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKHNtdGgsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCk7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc1BsYWluT2JqZWN0KHNtdGgpKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLndoZXJlSXRlbXNRdWVyeShzbXRoLCB7XHJcbiAgICAgICAgbW9kZWw6IGZhY3RvcnksXHJcbiAgICAgICAgcHJlZml4OiBwcmVwZW5kICYmIHRhYmxlTmFtZSxcclxuICAgICAgICB0eXBlOiBvcHRpb25zLnR5cGVcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHNtdGggPT09ICdudW1iZXInKSB7XHJcbiAgICAgIGxldCBwcmltYXJ5S2V5cyA9IGZhY3RvcnkgPyBPYmplY3Qua2V5cyhmYWN0b3J5LnByaW1hcnlLZXlzKSA6IFtdO1xyXG5cclxuICAgICAgaWYgKHByaW1hcnlLZXlzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAvLyBTaW5jZSB3ZSdyZSBqdXN0IGEgbnVtYmVyLCBhc3N1bWUgb25seSB0aGUgZmlyc3Qga2V5XHJcbiAgICAgICAgcHJpbWFyeUtleXMgPSBwcmltYXJ5S2V5c1swXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwcmltYXJ5S2V5cyA9ICdpZCc7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHdoZXJlW3ByaW1hcnlLZXlzXSA9IHNtdGg7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy53aGVyZUl0ZW1zUXVlcnkod2hlcmUsIHtcclxuICAgICAgICBtb2RlbDogZmFjdG9yeSxcclxuICAgICAgICBwcmVmaXg6IHByZXBlbmQgJiYgdGFibGVOYW1lXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiBzbXRoID09PSAnc3RyaW5nJykge1xyXG4gICAgICByZXR1cm4gdGhpcy53aGVyZUl0ZW1zUXVlcnkoc210aCwge1xyXG4gICAgICAgIG1vZGVsOiBmYWN0b3J5LFxyXG4gICAgICAgIHByZWZpeDogcHJlcGVuZCAmJiB0YWJsZU5hbWVcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHNtdGgpKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVzY2FwZShzbXRoKTtcclxuICAgIH1cclxuICAgIGlmIChBcnJheS5pc0FycmF5KHNtdGgpKSB7XHJcbiAgICAgIGlmIChzbXRoLmxlbmd0aCA9PT0gMCB8fCBzbXRoLmxlbmd0aCA+IDAgJiYgc210aFswXS5sZW5ndGggPT09IDApIHJldHVybiAnMT0xJztcclxuICAgICAgaWYgKFV0aWxzLmNhblRyZWF0QXJyYXlBc0FuZChzbXRoKSkge1xyXG4gICAgICAgIGNvbnN0IF9zbXRoID0geyBbT3AuYW5kXTogc210aCB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFdoZXJlQ29uZGl0aW9ucyhfc210aCwgdGFibGVOYW1lLCBmYWN0b3J5LCBvcHRpb25zLCBwcmVwZW5kKTtcclxuICAgICAgfVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N1cHBvcnQgZm9yIGxpdGVyYWwgcmVwbGFjZW1lbnRzIGluIHRoZSBgd2hlcmVgIG9iamVjdCBoYXMgYmVlbiByZW1vdmVkLicpO1xyXG4gICAgfVxyXG4gICAgaWYgKHNtdGggPT09IG51bGwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMud2hlcmVJdGVtc1F1ZXJ5KHNtdGgsIHtcclxuICAgICAgICBtb2RlbDogZmFjdG9yeSxcclxuICAgICAgICBwcmVmaXg6IHByZXBlbmQgJiYgdGFibGVOYW1lXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAnMT0xJztcclxuICB9XHJcblxyXG4gIC8vIEEgcmVjdXJzaXZlIHBhcnNlciBmb3IgbmVzdGVkIHdoZXJlIGNvbmRpdGlvbnNcclxuICBwYXJzZUNvbmRpdGlvbk9iamVjdChjb25kaXRpb25zLCBwYXRoKSB7XHJcbiAgICBwYXRoID0gcGF0aCB8fCBbXTtcclxuICAgIHJldHVybiBfLnJlZHVjZShjb25kaXRpb25zLCAocmVzdWx0LCB2YWx1ZSwga2V5KSA9PiB7XHJcbiAgICAgIGlmIChfLmlzT2JqZWN0KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiByZXN1bHQuY29uY2F0KHRoaXMucGFyc2VDb25kaXRpb25PYmplY3QodmFsdWUsIHBhdGguY29uY2F0KGtleSkpKTsgLy8gUmVjdXJzaXZlbHkgcGFyc2Ugb2JqZWN0c1xyXG4gICAgICB9XHJcbiAgICAgIHJlc3VsdC5wdXNoKHsgcGF0aDogcGF0aC5jb25jYXQoa2V5KSwgdmFsdWUgfSk7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LCBbXSk7XHJcbiAgfVxyXG5cclxuICBib29sZWFuVmFsdWUodmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZTtcclxuICB9XHJcbn1cclxuXHJcbk9iamVjdC5hc3NpZ24oUXVlcnlHZW5lcmF0b3IucHJvdG90eXBlLCByZXF1aXJlKCcuL3F1ZXJ5LWdlbmVyYXRvci9vcGVyYXRvcnMnKSk7XHJcbk9iamVjdC5hc3NpZ24oUXVlcnlHZW5lcmF0b3IucHJvdG90eXBlLCByZXF1aXJlKCcuL3F1ZXJ5LWdlbmVyYXRvci90cmFuc2FjdGlvbicpKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUXVlcnlHZW5lcmF0b3I7XHJcbiJdfQ==