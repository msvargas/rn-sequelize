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


let QueryGenerator = /*#__PURE__*/function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9hYnN0cmFjdC9xdWVyeS1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsidXRpbCIsInJlcXVpcmUiLCJfIiwidXVpZHY0Iiwic2VtdmVyIiwiVXRpbHMiLCJkZXByZWNhdGlvbnMiLCJTcWxTdHJpbmciLCJEYXRhVHlwZXMiLCJNb2RlbCIsIkFzc29jaWF0aW9uIiwiQmVsb25nc1RvIiwiQmVsb25nc1RvTWFueSIsIkhhc01hbnkiLCJPcCIsInNlcXVlbGl6ZUVycm9yIiwiSW5kZXhIaW50cyIsIlF1b3RlSGVscGVyIiwiUXVlcnlHZW5lcmF0b3IiLCJvcHRpb25zIiwic2VxdWVsaXplIiwiRXJyb3IiLCJfZGlhbGVjdCIsImRpYWxlY3QiLCJuYW1lIiwidGFibGVOYW1lIiwic2NoZW1hIiwiaXNQbGFpbk9iamVjdCIsImRlbGltaXRlciIsInBhcmFtIiwiX3NjaGVtYSIsInNlbGYiLCJ0YWJsZSIsIl9zY2hlbWFEZWxpbWl0ZXIiLCJ0b1N0cmluZyIsInF1b3RlVGFibGUiLCJkcm9wVGFibGVRdWVyeSIsInNjaGVtYURlbGltaXRlciIsImFkZFNjaGVtYSIsImJlZm9yZSIsImFmdGVyIiwidmFsdWVIYXNoIiwibW9kZWxBdHRyaWJ1dGVzIiwiZGVmYXVsdHMiLCJtb2RlbEF0dHJpYnV0ZU1hcCIsImZpZWxkcyIsInZhbHVlcyIsImJpbmQiLCJxdW90ZWRUYWJsZSIsImJpbmRQYXJhbSIsInVuZGVmaW5lZCIsInF1ZXJ5IiwidmFsdWVRdWVyeSIsImVtcHR5UXVlcnkiLCJvdXRwdXRGcmFnbWVudCIsImlkZW50aXR5V3JhcHBlclJlcXVpcmVkIiwidG1wVGFibGUiLCJlYWNoIiwiYXR0cmlidXRlIiwia2V5IiwiZmllbGQiLCJzdXBwb3J0cyIsInJldHVyblZhbHVlcyIsInJldHVybmluZyIsIm91dHB1dCIsImhhc1RyaWdnZXIiLCJ0bXBUYWJsZVRyaWdnZXIiLCJ0bXBDb2x1bW5zIiwib3V0cHV0Q29sdW1ucyIsIm1vZGVsS2V5IiwidHlwZSIsIlZJUlRVQUwiLCJsZW5ndGgiLCJxdW90ZUlkZW50aWZpZXIiLCJ0b1NxbCIsInNlbGVjdEZyb21UbXAiLCJnZXQiLCJzZWFyY2hQYXRoIiwiRVhDRVBUSU9OIiwiZXhjZXB0aW9uIiwicmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoIiwib21pdE51bGwiLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJ2YWx1ZSIsInB1c2giLCJhdXRvSW5jcmVtZW50IiwiZGVmYXVsdFZhbHVlIiwic3BsaWNlIiwiREVGQVVMVCIsImVzY2FwZSIsIlNlcXVlbGl6ZU1ldGhvZCIsImNvbnRleHQiLCJmb3JtYXQiLCJyZXBsYWNlbWVudHMiLCJpZ25vcmVEdXBsaWNhdGVzIiwiaW5zZXJ0cyIsIm9uQ29uZmxpY3REb05vdGhpbmciLCJhdHRyaWJ1dGVzIiwiam9pbiIsImd0ZSIsImRhdGFiYXNlVmVyc2lvbiIsInJlcGxhY2UiLCJvbkR1cGxpY2F0ZSIsImlkZW50aXR5SW5zZXJ0IiwicmVzdWx0IiwiZmllbGRWYWx1ZUhhc2hlcyIsImZpZWxkTWFwcGVkQXR0cmlidXRlcyIsInR1cGxlcyIsInNlcmlhbHMiLCJhbGxBdHRyaWJ1dGVzIiwib25EdXBsaWNhdGVLZXlVcGRhdGUiLCJmaWVsZFZhbHVlSGFzaCIsImZvck93biIsImluY2x1ZGVzIiwibWFwIiwiYnVsa0RlZmF1bHQiLCJ1cGRhdGVPbkR1cGxpY2F0ZSIsImNvbmZsaWN0S2V5cyIsInVwc2VydEtleXMiLCJhdHRyIiwidXBkYXRlS2V5cyIsInZhbHVlS2V5cyIsIkFycmF5IiwiaXNBcnJheSIsImF0dHJWYWx1ZUhhc2giLCJ3aGVyZSIsInN1ZmZpeCIsImxpbWl0IiwibWFwVG9Nb2RlbCIsInVwZGF0ZSIsIndoZXJlT3B0aW9ucyIsIndoZXJlUXVlcnkiLCJ0cmltIiwib3BlcmF0b3IiLCJyZXR1cm5pbmdGcmFnbWVudCIsInJhd1RhYmxlbmFtZSIsInByZWZpeCIsImZpZWxkc1NxbCIsImhhbmRsZVNlcXVlbGl6ZU1ldGhvZCIsImluc3BlY3QiLCJpbmRleCIsImNvbGxhdGUiLCJvcmRlciIsIm5hbWVJbmRleCIsIl9jb25mb3JtSW5kZXgiLCJxdW90ZUlkZW50aWZpZXJzIiwiY29uY3VycmVudGx5IiwiaW5kIiwiaW5kZXhWaWFBbHRlciIsImNvbmNhdCIsInVuaXF1ZSIsInVzaW5nIiwicGFyc2VyIiwiY29tcGFjdCIsImNvbnN0cmFpbnRTbmlwcGV0IiwiZ2V0Q29uc3RyYWludFNuaXBwZXQiLCJjb25zdHJhaW50TmFtZSIsImZpZWxkc1NxbFF1b3RlZFN0cmluZyIsImZpZWxkc1NxbFN0cmluZyIsInRvVXBwZXJDYXNlIiwid2hlcmVJdGVtc1F1ZXJ5IiwicmVmZXJlbmNlcyIsInJlZmVyZW5jZXNTbmlwcGV0Iiwib25VcGRhdGUiLCJvbkRlbGV0ZSIsImNvbGxlY3Rpb24iLCJwYXJlbnQiLCJjb25uZWN0b3IiLCJ2YWxpZE9yZGVyT3B0aW9ucyIsImZvckVhY2giLCJpdGVtIiwicHJldmlvdXMiLCJwcmV2aW91c0Fzc29jaWF0aW9uIiwicHJldmlvdXNNb2RlbCIsInRhcmdldCIsIm1vZGVsIiwiYXMiLCJ0aHJvdWdoIiwiZ2V0QXNzb2NpYXRpb25Gb3JBbGlhcyIsIm9yZGVySW5kZXgiLCJpbmRleE9mIiwibGl0ZXJhbCIsImFzc29jaWF0aW9ucyIsInJhd0F0dHJpYnV0ZXMiLCJpdGVtU3BsaXQiLCJzcGxpdCIsIkpTT04iLCJpZGVudGlmaWVyIiwicGF0aCIsInNsaWNlIiwianNvblBhdGhFeHRyYWN0aW9uUXVlcnkiLCJjb2xsZWN0aW9uTGVuZ3RoIiwidGFibGVOYW1lcyIsImkiLCJfbW9kZWxBdHRyaWJ1dGUiLCJzcWwiLCJjb2xsZWN0aW9uSXRlbSIsInF1b3RlIiwiZmllbGROYW1lIiwicmF3IiwiZm9yY2UiLCJpZGVudGlmaWVycyIsImhlYWQiLCJ0YWlsIiwiYWxpYXMiLCJpc09iamVjdCIsInNjaGVtYXMiLCJ2YWxpZGF0ZSIsInN0cmluZ2lmeSIsInNpbXBsZUVzY2FwZSIsImVzY1ZhbCIsInRpbWV6b25lIiwib3BlcmF0aW9uIiwiaWRlbnRpdHkiLCJ0eXBlVmFsaWRhdGlvbiIsImlzTGlzdCIsImVycm9yIiwiVmFsaWRhdGlvbkVycm9yIiwiZXJyb3JzIiwiVmFsaWRhdGlvbkVycm9ySXRlbSIsIm1lc3NhZ2UiLCJpc0lkZW50aWZpZXJRdW90ZWQiLCJjb2x1bW4iLCJwYXRocyIsInRvUGF0aCIsInBhdGhTdHIiLCJxdW90ZWRDb2x1bW4iLCJzdWJQYXRoIiwidGVzdCIsImFkZFRpY2tzIiwiX18iLCJkaWdpdCIsIm1haW5RdWVyeUl0ZW1zIiwic3ViUXVlcnlJdGVtcyIsInN1YlF1ZXJ5IiwiaGFzTXVsdGlBc3NvY2lhdGlvbiIsIm1haW4iLCJtYWluVGFibGUiLCJxdW90ZWROYW1lIiwidG9wTGV2ZWxJbmZvIiwibmFtZXMiLCJtYWluSm9pblF1ZXJpZXMiLCJzdWJKb2luUXVlcmllcyIsIm1pbmlmeUFsaWFzZXMiLCJhbGlhc2VzTWFwcGluZyIsIk1hcCIsImFsaWFzZXNCeVRhYmxlIiwidGFibGVBcyIsInQiLCJrZXlBdHQiLCJwcmltYXJ5S2V5QXR0cmlidXRlcyIsInNvbWUiLCJlc2NhcGVBdHRyaWJ1dGVzIiwiaW5jbHVkZSIsImdyb3VwZWRMaW1pdCIsInNlcGFyYXRlIiwiam9pblF1ZXJpZXMiLCJnZW5lcmF0ZUluY2x1ZGUiLCJleHRlcm5hbEFzIiwiaW50ZXJuYWxBcyIsIm1haW5RdWVyeSIsInVuaXEiLCJzZWxlY3RGcm9tVGFibGVGcmFnbWVudCIsImFzc2lnbiIsImdyb3VwZWRMaW1pdE9yZGVyIiwid2hlcmVLZXkiLCJncm91cGVkVGFibGVOYW1lIiwib24iLCJmb3JlaWduS2V5RmllbGQiLCJtYW55RnJvbVNvdXJjZSIsImdyb3VwZWRMaW1pdE9wdGlvbnMiLCJfdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzIiwiYXNzb2NpYXRpb24iLCJkdXBsaWNhdGluZyIsInJlcXVpcmVkIiwicGxhY2Vob2xkZXIiLCJoYXNKb2luIiwiaW5jbHVkZU1hcCIsImluY2x1ZGVOYW1lcyIsImJhc2VRdWVyeSIsInNlbGVjdFF1ZXJ5Iiwib2Zmc2V0IiwicGxhY2VIb2xkZXIiLCJ3aGVyZUl0ZW1RdWVyeSIsInNwbGljZVBvcyIsImdyb3VwV2hlcmUiLCJmb3JlaWduSWRlbnRpZmllckZpZWxkIiwic3BsaWNlU3RyIiwiZ2V0V2hlcmVDb25kaXRpb25zIiwic3RhcnRzV2l0aCIsImdyb3VwIiwiYWxpYXNHcm91cGluZyIsImhhdmluZyIsIm9yZGVycyIsImdldFF1ZXJ5T3JkZXJzIiwibWFpblF1ZXJ5T3JkZXIiLCJzdWJRdWVyeU9yZGVyIiwibGltaXRPcmRlciIsImFkZExpbWl0QW5kT2Zmc2V0IiwibG9jayIsImxldmVsIiwibG9ja0tleSIsImZvclNoYXJlIiwibG9ja09mIiwib2YiLCJza2lwTG9ja2VkIiwic3JjIiwiX2dldEFsaWFzRm9yRmllbGQiLCJtYWluVGFibGVBcyIsImFkZFRhYmxlIiwibm9SYXdBdHRyaWJ1dGVzIiwiX2dldE1pbmlmaWVkQWxpYXMiLCJUSUNLX0NIQVIiLCJxdW90ZUF0dHJpYnV0ZSIsImlzRW1wdHkiLCJwYXJlbnRUYWJsZU5hbWUiLCJtYWluQ2hpbGRJbmNsdWRlcyIsInN1YkNoaWxkSW5jbHVkZXMiLCJyZXF1aXJlZE1pc21hdGNoIiwiaW5jbHVkZUFzIiwiam9pblF1ZXJ5Iiwia2V5c0VzY2FwZWQiLCJpbmNsdWRlSWdub3JlQXR0cmlidXRlcyIsIl9leHBhbmRBdHRyaWJ1dGVzIiwibWFwRmluZGVyT3B0aW9ucyIsImluY2x1ZGVBdHRyaWJ1dGVzIiwiYXR0ckFzIiwidmVyYmF0aW0iLCJMaXRlcmFsIiwiQ2FzdCIsIkZuIiwidmFsIiwiZ2VuZXJhdGVUaHJvdWdoSm9pbiIsIl9nZW5lcmF0ZVN1YlF1ZXJ5RmlsdGVyIiwiZ2VuZXJhdGVKb2luIiwiY2hpbGRJbmNsdWRlIiwiX3BzZXVkbyIsImNoaWxkSm9pblF1ZXJpZXMiLCJib2R5IiwiY29uZGl0aW9uIiwibWF0Y2giLCJtaW5pZmllZEFsaWFzIiwic2l6ZSIsInNldCIsInBhcmVudElzVG9wIiwiJHBhcmVudCIsImpvaW5XaGVyZSIsImxlZnQiLCJzb3VyY2UiLCJhdHRyTGVmdCIsInNvdXJjZUtleUF0dHJpYnV0ZSIsInByaW1hcnlLZXlBdHRyaWJ1dGUiLCJmaWVsZExlZnQiLCJpZGVudGlmaWVyRmllbGQiLCJhc0xlZnQiLCJyaWdodCIsInRhYmxlUmlnaHQiLCJnZXRUYWJsZU5hbWUiLCJmaWVsZFJpZ2h0IiwidGFyZ2V0SWRlbnRpZmllciIsImFzUmlnaHQiLCJqb2luT24iLCJzdWJxdWVyeUF0dHJpYnV0ZXMiLCJqb2luU291cmNlIiwib3IiLCJ0aHJvdWdoVGFibGUiLCJ0aHJvdWdoQXMiLCJleHRlcm5hbFRocm91Z2hBcyIsInRocm91Z2hBdHRyaWJ1dGVzIiwidGFibGVTb3VyY2UiLCJpZGVudFNvdXJjZSIsInRhYmxlVGFyZ2V0IiwiaWRlbnRUYXJnZXQiLCJhdHRyVGFyZ2V0IiwidGFyZ2V0S2V5RmllbGQiLCJqb2luVHlwZSIsImpvaW5Cb2R5Iiwiam9pbkNvbmRpdGlvbiIsImF0dHJTb3VyY2UiLCJzb3VyY2VLZXkiLCJzb3VyY2VKb2luT24iLCJ0YXJnZXRKb2luT24iLCJ0aHJvdWdoV2hlcmUiLCJ0YXJnZXRXaGVyZSIsInNvdXJjZUtleUZpZWxkIiwibWFpbk1vZGVsIiwiYWxpYXNlZFNvdXJjZSIsImpvaW5UYWJsZURlcGVuZGVudCIsInN1YlF1ZXJ5RmlsdGVyIiwiY2hpbGQiLCJuZXN0ZWRJbmNsdWRlcyIsIl9nZXRSZXF1aXJlZENsb3N1cmUiLCJ0b3BJbmNsdWRlIiwidG9wUGFyZW50IiwidG9wQXNzb2NpYXRpb24iLCJwcmltYXJ5S2V5RmllbGQiLCJ0b1RhcmdldCIsImFuZCIsImlzQmVsb25nc1RvIiwiYXNzb2NpYXRpb25UeXBlIiwic291cmNlRmllbGQiLCJ0YXJnZXRGaWVsZCIsImNvcHkiLCJmaWx0ZXIiLCJpbmMiLCJzdWJRdWVyeUF0dHJpYnV0ZSIsImZpbmQiLCJhIiwibW9kZWxOYW1lIiwiQ29sIiwidGFibGVzIiwiZnJhZ21lbnQiLCJpbmRleEhpbnRzIiwiaGludCIsImluZGV4TmFtZSIsInNtdGgiLCJmYWN0b3J5IiwicHJlcGVuZCIsIk9wZXJhdG9yTWFwIiwiY29tcGFyYXRvciIsIldoZXJlIiwibG9naWMiLCJib29sZWFuVmFsdWUiLCJmbiIsImFyZ3MiLCJhcmciLCJjb2wiLCJiaW5kaW5nIiwiZ2V0Q29tcGxleFNpemUiLCJpdGVtcyIsImdldENvbXBsZXhLZXlzIiwicHJvcCIsImtleVBhcnRzIiwidG1wIiwiX2ZpbmRGaWVsZCIsImZpZWxkVHlwZSIsIk9wZXJhdG9yc0FsaWFzTWFwIiwiX3JlcGxhY2VBbGlhc2VzIiwib3BWYWx1ZSIsIl9qb2luS2V5VmFsdWUiLCJpcyIsImVxIiwiY2FuVHJlYXRBcnJheUFzQW5kIiwibm90IiwiX3doZXJlR3JvdXBCaW5kIiwiX3doZXJlQmluZCIsIkFSUkFZIiwianNvbiIsIl93aGVyZUpTT04iLCJfd2hlcmVQYXJzZVNpbmdsZVZhbHVlT2JqZWN0IiwiaW4iLCJmaWVsZFJhd0F0dHJpYnV0ZXNNYXAiLCJvdXRlckJpbmRpbmciLCJpdGVtUXVlcnkiLCJiYXNlS2V5IiwiZ2V0T3BlcmF0b3JzIiwib3AiLCJfdHJhdmVyc2VKU09OIiwiY2FzdCIsInBhdGhLZXkiLCJfdG9KU09OVmFsdWUiLCJfY2FzdEtleSIsIml0ZW1Qcm9wIiwiX2dldEpzb25DYXN0IiwiRGF0ZSIsIl9nZXRTYWZlS2V5IiwiX3ByZWZpeEtleSIsImlzQ29sU3RyaW5nIiwic3Vic3RyIiwibm90SW4iLCJuZSIsImFueSIsImFsbCIsImJldHdlZW4iLCJub3RCZXR3ZWVuIiwibGlrZSIsImVuZHNXaXRoIiwic3Vic3RyaW5nIiwiZXNjYXBlT3B0aW9ucyIsImFjY2VwdFN0cmluZ3MiLCJwcmltYXJ5S2V5cyIsImtleXMiLCJCdWZmZXIiLCJpc0J1ZmZlciIsIl9zbXRoIiwiY29uZGl0aW9ucyIsInJlZHVjZSIsInBhcnNlQ29uZGl0aW9uT2JqZWN0IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBRUEsTUFBTUEsSUFBSSxHQUFHQyxPQUFPLENBQUMsTUFBRCxDQUFwQjs7QUFDQSxNQUFNQyxDQUFDLEdBQUdELE9BQU8sQ0FBQyxRQUFELENBQWpCOztBQUNBLE1BQU1FLE1BQU0sR0FBR0YsT0FBTyxDQUFDLFNBQUQsQ0FBdEI7O0FBQ0EsTUFBTUcsTUFBTSxHQUFHSCxPQUFPLENBQUMsUUFBRCxDQUF0Qjs7QUFFQSxNQUFNSSxLQUFLLEdBQUdKLE9BQU8sQ0FBQyxhQUFELENBQXJCOztBQUNBLE1BQU1LLFlBQVksR0FBR0wsT0FBTyxDQUFDLDBCQUFELENBQTVCOztBQUNBLE1BQU1NLFNBQVMsR0FBR04sT0FBTyxDQUFDLGtCQUFELENBQXpCOztBQUNBLE1BQU1PLFNBQVMsR0FBR1AsT0FBTyxDQUFDLGtCQUFELENBQXpCOztBQUNBLE1BQU1RLEtBQUssR0FBR1IsT0FBTyxDQUFDLGFBQUQsQ0FBckI7O0FBQ0EsTUFBTVMsV0FBVyxHQUFHVCxPQUFPLENBQUMseUJBQUQsQ0FBM0I7O0FBQ0EsTUFBTVUsU0FBUyxHQUFHVixPQUFPLENBQUMsK0JBQUQsQ0FBekI7O0FBQ0EsTUFBTVcsYUFBYSxHQUFHWCxPQUFPLENBQUMsb0NBQUQsQ0FBN0I7O0FBQ0EsTUFBTVksT0FBTyxHQUFHWixPQUFPLENBQUMsNkJBQUQsQ0FBdkI7O0FBQ0EsTUFBTWEsRUFBRSxHQUFHYixPQUFPLENBQUMsaUJBQUQsQ0FBbEI7O0FBQ0EsTUFBTWMsY0FBYyxHQUFHZCxPQUFPLENBQUMsY0FBRCxDQUE5Qjs7QUFDQSxNQUFNZSxVQUFVLEdBQUdmLE9BQU8sQ0FBQyxtQkFBRCxDQUExQjs7QUFFQSxNQUFNZ0IsV0FBVyxHQUFHaEIsT0FBTyxDQUFDLGlDQUFELENBQTNCO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0lBQ01pQixjO0FBQ0osMEJBQVlDLE9BQVosRUFBcUI7QUFBQTs7QUFDbkIsUUFBSSxDQUFDQSxPQUFPLENBQUNDLFNBQWIsRUFBd0IsTUFBTSxJQUFJQyxLQUFKLENBQVUsc0RBQVYsQ0FBTjtBQUN4QixRQUFJLENBQUNGLE9BQU8sQ0FBQ0csUUFBYixFQUF1QixNQUFNLElBQUlELEtBQUosQ0FBVSxxREFBVixDQUFOO0FBRXZCLFNBQUtELFNBQUwsR0FBaUJELE9BQU8sQ0FBQ0MsU0FBekI7QUFDQSxTQUFLRCxPQUFMLEdBQWVBLE9BQU8sQ0FBQ0MsU0FBUixDQUFrQkQsT0FBakMsQ0FMbUIsQ0FPbkI7O0FBQ0EsU0FBS0ksT0FBTCxHQUFlSixPQUFPLENBQUNHLFFBQVIsQ0FBaUJFLElBQWhDO0FBQ0EsU0FBS0YsUUFBTCxHQUFnQkgsT0FBTyxDQUFDRyxRQUF4QjtBQUNEOzs7O3dDQUVtQkcsUyxFQUFXTixPLEVBQVM7QUFDdENBLE1BQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCO0FBQ0FNLE1BQUFBLFNBQVMsR0FBR0EsU0FBUyxJQUFJLEVBQXpCO0FBQ0EsYUFBTztBQUNMQyxRQUFBQSxNQUFNLEVBQUVELFNBQVMsQ0FBQ0MsTUFBVixJQUFvQlAsT0FBTyxDQUFDTyxNQUE1QixJQUFzQyxRQUR6QztBQUVMRCxRQUFBQSxTQUFTLEVBQUV2QixDQUFDLENBQUN5QixhQUFGLENBQWdCRixTQUFoQixJQUE2QkEsU0FBUyxDQUFDQSxTQUF2QyxHQUFtREEsU0FGekQ7QUFHTEcsUUFBQUEsU0FBUyxFQUFFSCxTQUFTLENBQUNHLFNBQVYsSUFBdUJULE9BQU8sQ0FBQ1MsU0FBL0IsSUFBNEM7QUFIbEQsT0FBUDtBQUtEOzs7OEJBRVNDLEssRUFBTztBQUNmLFVBQUksQ0FBQ0EsS0FBSyxDQUFDQyxPQUFYLEVBQW9CLE9BQU9ELEtBQUssQ0FBQ0osU0FBTixJQUFtQkksS0FBMUI7QUFDcEIsWUFBTUUsSUFBSSxHQUFHLElBQWI7QUFDQSxhQUFPO0FBQ0xOLFFBQUFBLFNBQVMsRUFBRUksS0FBSyxDQUFDSixTQUFOLElBQW1CSSxLQUR6QjtBQUVMRyxRQUFBQSxLQUFLLEVBQUVILEtBQUssQ0FBQ0osU0FBTixJQUFtQkksS0FGckI7QUFHTEwsUUFBQUEsSUFBSSxFQUFFSyxLQUFLLENBQUNMLElBQU4sSUFBY0ssS0FIZjtBQUlMSCxRQUFBQSxNQUFNLEVBQUVHLEtBQUssQ0FBQ0MsT0FKVDtBQUtMRixRQUFBQSxTQUFTLEVBQUVDLEtBQUssQ0FBQ0ksZ0JBQU4sSUFBMEIsR0FMaEM7O0FBTUxDLFFBQUFBLFFBQVEsR0FBRztBQUNULGlCQUFPSCxJQUFJLENBQUNJLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBUDtBQUNEOztBQVJJLE9BQVA7QUFVRDs7OytCQUVVVixTLEVBQVdOLE8sRUFBUztBQUM3QixhQUFPLEtBQUtpQixjQUFMLENBQW9CWCxTQUFwQixFQUErQk4sT0FBL0IsQ0FBUDtBQUNEOzs7dUNBRWtCTSxTLEVBQVdDLE0sRUFBUVcsZSxFQUFpQjtBQUNyRCxZQUFNTCxLQUFLLEdBQUcsS0FBS0csVUFBTCxDQUNaLEtBQUtHLFNBQUwsQ0FBZTtBQUNiYixRQUFBQSxTQURhO0FBRWJLLFFBQUFBLE9BQU8sRUFBRUosTUFGSTtBQUdiTyxRQUFBQSxnQkFBZ0IsRUFBRUk7QUFITCxPQUFmLENBRFksQ0FBZDtBQVFBLGFBQVEsWUFBV0wsS0FBTSxHQUF6QjtBQUNEOzs7bUNBRWNQLFMsRUFBVztBQUN4QixhQUFRLHdCQUF1QixLQUFLVSxVQUFMLENBQWdCVixTQUFoQixDQUEyQixHQUExRDtBQUNEOzs7cUNBRWdCYyxNLEVBQVFDLEssRUFBTztBQUM5QixhQUFRLGVBQWMsS0FBS0wsVUFBTCxDQUFnQkksTUFBaEIsQ0FBd0IsY0FBYSxLQUFLSixVQUFMLENBQWdCSyxLQUFoQixDQUF1QixHQUFsRjtBQUNEO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Z0NBQ2NSLEssRUFBT1MsUyxFQUFXQyxlLEVBQWlCdkIsTyxFQUFTO0FBQ3REQSxNQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjs7QUFDQWpCLE1BQUFBLENBQUMsQ0FBQ3lDLFFBQUYsQ0FBV3hCLE9BQVgsRUFBb0IsS0FBS0EsT0FBekI7O0FBRUEsWUFBTXlCLGlCQUFpQixHQUFHLEVBQTFCO0FBQ0EsWUFBTUMsTUFBTSxHQUFHLEVBQWY7QUFDQSxZQUFNQyxNQUFNLEdBQUcsRUFBZjtBQUNBLFlBQU1DLElBQUksR0FBRyxFQUFiO0FBQ0EsWUFBTUMsV0FBVyxHQUFHLEtBQUtiLFVBQUwsQ0FBZ0JILEtBQWhCLENBQXBCO0FBQ0EsWUFBTWlCLFNBQVMsR0FBRzlCLE9BQU8sQ0FBQzhCLFNBQVIsS0FBc0JDLFNBQXRCLEdBQWtDLEtBQUtELFNBQUwsQ0FBZUYsSUFBZixDQUFsQyxHQUF5RDVCLE9BQU8sQ0FBQzhCLFNBQW5GO0FBQ0EsVUFBSUUsS0FBSjtBQUNBLFVBQUlDLFVBQVUsR0FBRyxFQUFqQjtBQUNBLFVBQUlDLFVBQVUsR0FBRyxFQUFqQjtBQUNBLFVBQUlDLGNBQWMsR0FBRyxFQUFyQjtBQUNBLFVBQUlDLHVCQUF1QixHQUFHLEtBQTlCO0FBQ0EsVUFBSUMsUUFBUSxHQUFHLEVBQWYsQ0Fmc0QsQ0FlbkM7O0FBRW5CLFVBQUlkLGVBQUosRUFBcUI7QUFDbkJ4QyxRQUFBQSxDQUFDLENBQUN1RCxJQUFGLENBQU9mLGVBQVAsRUFBd0IsQ0FBQ2dCLFNBQUQsRUFBWUMsR0FBWixLQUFvQjtBQUMxQ2YsVUFBQUEsaUJBQWlCLENBQUNlLEdBQUQsQ0FBakIsR0FBeUJELFNBQXpCOztBQUNBLGNBQUlBLFNBQVMsQ0FBQ0UsS0FBZCxFQUFxQjtBQUNuQmhCLFlBQUFBLGlCQUFpQixDQUFDYyxTQUFTLENBQUNFLEtBQVgsQ0FBakIsR0FBcUNGLFNBQXJDO0FBQ0Q7QUFDRixTQUxEO0FBTUQ7O0FBRUQsVUFBSSxLQUFLcEMsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QixnQkFBdkIsQ0FBSixFQUE4QztBQUM1Q1IsUUFBQUEsVUFBVSxJQUFJLGlCQUFkO0FBQ0QsT0FGRCxNQUVPLElBQUksS0FBSy9CLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUIsV0FBdkIsQ0FBSixFQUF5QztBQUM5Q1IsUUFBQUEsVUFBVSxJQUFJLFlBQWQ7QUFDRDs7QUFFRCxVQUFJLEtBQUsvQixRQUFMLENBQWN1QyxRQUFkLENBQXVCQyxZQUF2QixJQUF1QzNDLE9BQU8sQ0FBQzRDLFNBQW5ELEVBQThEO0FBQzVELFlBQUksS0FBS3pDLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJDLFlBQXZCLENBQW9DQyxTQUF4QyxFQUFtRDtBQUNqRFgsVUFBQUEsVUFBVSxJQUFJLGNBQWQ7QUFDQUMsVUFBQUEsVUFBVSxJQUFJLGNBQWQ7QUFDRCxTQUhELE1BR08sSUFBSSxLQUFLL0IsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QkMsWUFBdkIsQ0FBb0NFLE1BQXhDLEVBQWdEO0FBQ3JEVixVQUFBQSxjQUFjLEdBQUcsb0JBQWpCLENBRHFELENBR3JEOztBQUNBLGNBQUlaLGVBQWUsSUFBSXZCLE9BQU8sQ0FBQzhDLFVBQTNCLElBQXlDLEtBQUszQyxRQUFMLENBQWN1QyxRQUFkLENBQXVCSyxlQUFwRSxFQUFxRjtBQUVuRixnQkFBSUMsVUFBVSxHQUFHLEVBQWpCO0FBQ0EsZ0JBQUlDLGFBQWEsR0FBRyxFQUFwQjs7QUFFQSxpQkFBSyxNQUFNQyxRQUFYLElBQXVCM0IsZUFBdkIsRUFBd0M7QUFDdEMsb0JBQU1nQixTQUFTLEdBQUdoQixlQUFlLENBQUMyQixRQUFELENBQWpDOztBQUNBLGtCQUFJLEVBQUVYLFNBQVMsQ0FBQ1ksSUFBVixZQUEwQjlELFNBQVMsQ0FBQytELE9BQXRDLENBQUosRUFBb0Q7QUFDbEQsb0JBQUlKLFVBQVUsQ0FBQ0ssTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUN6Qkwsa0JBQUFBLFVBQVUsSUFBSSxHQUFkO0FBQ0FDLGtCQUFBQSxhQUFhLElBQUksR0FBakI7QUFDRDs7QUFFREQsZ0JBQUFBLFVBQVUsSUFBSyxHQUFFLEtBQUtNLGVBQUwsQ0FBcUJmLFNBQVMsQ0FBQ0UsS0FBL0IsQ0FBc0MsSUFBR0YsU0FBUyxDQUFDWSxJQUFWLENBQWVJLEtBQWYsRUFBdUIsRUFBakY7QUFDQU4sZ0JBQUFBLGFBQWEsSUFBSyxZQUFXLEtBQUtLLGVBQUwsQ0FBcUJmLFNBQVMsQ0FBQ0UsS0FBL0IsQ0FBc0MsRUFBbkU7QUFDRDtBQUNGOztBQUVESixZQUFBQSxRQUFRLEdBQUksdUJBQXNCVyxVQUFXLElBQTdDO0FBQ0FiLFlBQUFBLGNBQWMsR0FBSSxXQUFVYyxhQUFjLFlBQTFDO0FBQ0Esa0JBQU1PLGFBQWEsR0FBRyxxQkFBdEI7QUFFQXZCLFlBQUFBLFVBQVUsSUFBSXVCLGFBQWQ7QUFDQXRCLFlBQUFBLFVBQVUsSUFBSXNCLGFBQWQ7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQsVUFBSXpFLENBQUMsQ0FBQzBFLEdBQUYsQ0FBTSxJQUFOLEVBQVksQ0FBQyxXQUFELEVBQWMsU0FBZCxFQUF5QixnQkFBekIsRUFBMkMsbUJBQTNDLENBQVosS0FBZ0Z6RCxPQUFPLENBQUMwRCxVQUE1RixFQUF3RztBQUN0RztBQUNBMUQsUUFBQUEsT0FBTyxDQUFDOEIsU0FBUixHQUFvQixLQUFwQjtBQUNEOztBQUVELFVBQUksS0FBSzNCLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJpQixTQUF2QixJQUFvQzNELE9BQU8sQ0FBQzRELFNBQWhELEVBQTJEO0FBQ3pEO0FBQ0E1RCxRQUFBQSxPQUFPLENBQUM4QixTQUFSLEdBQW9CLEtBQXBCO0FBQ0Q7O0FBRURSLE1BQUFBLFNBQVMsR0FBR3BDLEtBQUssQ0FBQzJFLHdCQUFOLENBQStCdkMsU0FBL0IsRUFBMEMsS0FBS3RCLE9BQUwsQ0FBYThELFFBQXZELENBQVo7O0FBQ0EsV0FBSyxNQUFNdEIsR0FBWCxJQUFrQmxCLFNBQWxCLEVBQTZCO0FBQzNCLFlBQUl5QyxNQUFNLENBQUNDLFNBQVAsQ0FBaUJDLGNBQWpCLENBQWdDQyxJQUFoQyxDQUFxQzVDLFNBQXJDLEVBQWdEa0IsR0FBaEQsQ0FBSixFQUEwRDtBQUN4RCxnQkFBTTJCLEtBQUssR0FBRzdDLFNBQVMsQ0FBQ2tCLEdBQUQsQ0FBdkI7QUFDQWQsVUFBQUEsTUFBTSxDQUFDMEMsSUFBUCxDQUFZLEtBQUtkLGVBQUwsQ0FBcUJkLEdBQXJCLENBQVosRUFGd0QsQ0FJeEQ7O0FBQ0EsY0FBSWYsaUJBQWlCLElBQUlBLGlCQUFpQixDQUFDZSxHQUFELENBQXRDLElBQStDZixpQkFBaUIsQ0FBQ2UsR0FBRCxDQUFqQixDQUF1QjZCLGFBQXZCLEtBQXlDLElBQXhGLElBQWdHLENBQUNGLEtBQXJHLEVBQTRHO0FBQzFHLGdCQUFJLENBQUMsS0FBS2hFLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUIyQixhQUF2QixDQUFxQ0MsWUFBMUMsRUFBd0Q7QUFDdEQ1QyxjQUFBQSxNQUFNLENBQUM2QyxNQUFQLENBQWMsQ0FBQyxDQUFmLEVBQWtCLENBQWxCO0FBQ0QsYUFGRCxNQUVPLElBQUksS0FBS3BFLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUI4QixPQUEzQixFQUFvQztBQUN6QzdDLGNBQUFBLE1BQU0sQ0FBQ3lDLElBQVAsQ0FBWSxTQUFaO0FBQ0QsYUFGTSxNQUVBO0FBQ0x6QyxjQUFBQSxNQUFNLENBQUN5QyxJQUFQLENBQVksS0FBS0ssTUFBTCxDQUFZLElBQVosQ0FBWjtBQUNEO0FBQ0YsV0FSRCxNQVFPO0FBQ0wsZ0JBQUloRCxpQkFBaUIsSUFBSUEsaUJBQWlCLENBQUNlLEdBQUQsQ0FBdEMsSUFBK0NmLGlCQUFpQixDQUFDZSxHQUFELENBQWpCLENBQXVCNkIsYUFBdkIsS0FBeUMsSUFBNUYsRUFBa0c7QUFDaEdqQyxjQUFBQSx1QkFBdUIsR0FBRyxJQUExQjtBQUNEOztBQUVELGdCQUFJK0IsS0FBSyxZQUFZakYsS0FBSyxDQUFDd0YsZUFBdkIsSUFBMEMxRSxPQUFPLENBQUM4QixTQUFSLEtBQXNCLEtBQXBFLEVBQTJFO0FBQ3pFSCxjQUFBQSxNQUFNLENBQUN5QyxJQUFQLENBQVksS0FBS0ssTUFBTCxDQUFZTixLQUFaLEVBQW1CMUMsaUJBQWlCLElBQUlBLGlCQUFpQixDQUFDZSxHQUFELENBQXRDLElBQStDVCxTQUFsRSxFQUE2RTtBQUFFNEMsZ0JBQUFBLE9BQU8sRUFBRTtBQUFYLGVBQTdFLENBQVo7QUFDRCxhQUZELE1BRU87QUFDTGhELGNBQUFBLE1BQU0sQ0FBQ3lDLElBQVAsQ0FBWSxLQUFLUSxNQUFMLENBQVlULEtBQVosRUFBbUIxQyxpQkFBaUIsSUFBSUEsaUJBQWlCLENBQUNlLEdBQUQsQ0FBdEMsSUFBK0NULFNBQWxFLEVBQTZFO0FBQUU0QyxnQkFBQUEsT0FBTyxFQUFFO0FBQVgsZUFBN0UsRUFBb0c3QyxTQUFwRyxDQUFaO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Y7O0FBRUQsWUFBTStDLFlBQVksR0FBRztBQUNuQkMsUUFBQUEsZ0JBQWdCLEVBQUU5RSxPQUFPLENBQUM4RSxnQkFBUixHQUEyQixLQUFLM0UsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QnFDLE9BQXZCLENBQStCRCxnQkFBMUQsR0FBNkUsRUFENUU7QUFFbkJFLFFBQUFBLG1CQUFtQixFQUFFaEYsT0FBTyxDQUFDOEUsZ0JBQVIsR0FBMkIsS0FBSzNFLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJxQyxPQUF2QixDQUErQkMsbUJBQTFELEdBQWdGLEVBRmxGO0FBR25CQyxRQUFBQSxVQUFVLEVBQUV2RCxNQUFNLENBQUN3RCxJQUFQLENBQVksR0FBWixDQUhPO0FBSW5CckMsUUFBQUEsTUFBTSxFQUFFVixjQUpXO0FBS25CUixRQUFBQSxNQUFNLEVBQUVBLE1BQU0sQ0FBQ3VELElBQVAsQ0FBWSxHQUFaLENBTFc7QUFNbkI3QyxRQUFBQTtBQU5tQixPQUFyQjtBQVNBSixNQUFBQSxVQUFVLEdBQUksR0FBRUksUUFBUyxTQUFRd0MsWUFBWSxDQUFDQyxnQkFBaUIsU0FBUWpELFdBQVksS0FBSWdELFlBQVksQ0FBQ0ksVUFBVyxJQUFHSixZQUFZLENBQUNoQyxNQUFPLFlBQVdnQyxZQUFZLENBQUNsRCxNQUFPLElBQUdrRCxZQUFZLENBQUNHLG1CQUFvQixHQUFFL0MsVUFBVyxFQUF0TjtBQUNBQyxNQUFBQSxVQUFVLEdBQUksR0FBRUcsUUFBUyxTQUFRd0MsWUFBWSxDQUFDQyxnQkFBaUIsU0FBUWpELFdBQVksR0FBRWdELFlBQVksQ0FBQ2hDLE1BQU8sR0FBRWdDLFlBQVksQ0FBQ0csbUJBQW9CLEdBQUU5QyxVQUFXLEVBQXpKOztBQUVBLFVBQUksS0FBSy9CLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJpQixTQUF2QixJQUFvQzNELE9BQU8sQ0FBQzRELFNBQWhELEVBQTJEO0FBQ3pEO0FBQ0E7QUFDQSxZQUFJM0UsTUFBTSxDQUFDa0csR0FBUCxDQUFXLEtBQUtsRixTQUFMLENBQWVELE9BQWYsQ0FBdUJvRixlQUFsQyxFQUFtRCxPQUFuRCxDQUFKLEVBQWlFO0FBQy9EO0FBQ0EsZ0JBQU0zRSxTQUFTLEdBQUksU0FBUXpCLE1BQU0sR0FBR3FHLE9BQVQsQ0FBaUIsSUFBakIsRUFBdUIsRUFBdkIsQ0FBMkIsR0FBdEQ7QUFFQXJGLFVBQUFBLE9BQU8sQ0FBQzRELFNBQVIsR0FBb0Isc0dBQXBCO0FBQ0EzQixVQUFBQSxVQUFVLEdBQUksR0FBRyw0REFBMkRKLFdBQVksNERBQTJEcEIsU0FBVSxFQUE3SSxHQUNkLFNBQVUsR0FBRXdCLFVBQVcsNkJBQTRCakMsT0FBTyxDQUFDNEQsU0FBVSxRQUFPbkQsU0FDN0UsMEpBRkQ7QUFHRCxTQVJELE1BUU87QUFDTFQsVUFBQUEsT0FBTyxDQUFDNEQsU0FBUixHQUFvQixrQ0FBcEI7QUFDQTNCLFVBQUFBLFVBQVUsR0FBSSwrREFBOERKLFdBQVksaUNBQWdDSSxVQUFXLGVBQWNqQyxPQUFPLENBQUM0RCxTQUFVLDhHQUFuSztBQUNEO0FBQ0Y7O0FBRUQsVUFBSSxLQUFLekQsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QixrQkFBdkIsS0FBOEMxQyxPQUFPLENBQUNzRixXQUExRCxFQUF1RTtBQUNyRXJELFFBQUFBLFVBQVUsSUFBSyxxQkFBb0JqQyxPQUFPLENBQUNzRixXQUFZLEVBQXZEO0FBQ0FwRCxRQUFBQSxVQUFVLElBQUsscUJBQW9CbEMsT0FBTyxDQUFDc0YsV0FBWSxFQUF2RDtBQUNEOztBQUVEdEQsTUFBQUEsS0FBSyxHQUFJLEdBQUU2QyxZQUFZLENBQUNJLFVBQWIsQ0FBd0I1QixNQUF4QixHQUFpQ3BCLFVBQWpDLEdBQThDQyxVQUFXLEdBQXBFOztBQUNBLFVBQUlFLHVCQUF1QixJQUFJLEtBQUtqQyxRQUFMLENBQWN1QyxRQUFkLENBQXVCMkIsYUFBdkIsQ0FBcUNrQixjQUFwRSxFQUFvRjtBQUNsRnZELFFBQUFBLEtBQUssR0FBSSx1QkFBc0JILFdBQVksUUFBT0csS0FBTSx3QkFBdUJILFdBQVksT0FBM0Y7QUFDRCxPQWhKcUQsQ0FrSnREOzs7QUFDQSxZQUFNMkQsTUFBTSxHQUFHO0FBQUV4RCxRQUFBQTtBQUFGLE9BQWY7O0FBQ0EsVUFBSWhDLE9BQU8sQ0FBQzhCLFNBQVIsS0FBc0IsS0FBMUIsRUFBaUM7QUFDL0IwRCxRQUFBQSxNQUFNLENBQUM1RCxJQUFQLEdBQWNBLElBQWQ7QUFDRDs7QUFDRCxhQUFPNEQsTUFBUDtBQUNEO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7b0NBQ2tCbEYsUyxFQUFXbUYsZ0IsRUFBa0J6RixPLEVBQVMwRixxQixFQUF1QjtBQUMzRTFGLE1BQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCO0FBQ0EwRixNQUFBQSxxQkFBcUIsR0FBR0EscUJBQXFCLElBQUksRUFBakQ7QUFFQSxZQUFNQyxNQUFNLEdBQUcsRUFBZjtBQUNBLFlBQU1DLE9BQU8sR0FBRyxFQUFoQjtBQUNBLFlBQU1DLGFBQWEsR0FBRyxFQUF0QjtBQUNBLFVBQUlDLG9CQUFvQixHQUFHLEVBQTNCOztBQUVBLFdBQUssTUFBTUMsY0FBWCxJQUE2Qk4sZ0JBQTdCLEVBQStDO0FBQzdDMUcsUUFBQUEsQ0FBQyxDQUFDaUgsTUFBRixDQUFTRCxjQUFULEVBQXlCLENBQUM1QixLQUFELEVBQVEzQixHQUFSLEtBQWdCO0FBQ3ZDLGNBQUksQ0FBQ3FELGFBQWEsQ0FBQ0ksUUFBZCxDQUF1QnpELEdBQXZCLENBQUwsRUFBa0M7QUFDaENxRCxZQUFBQSxhQUFhLENBQUN6QixJQUFkLENBQW1CNUIsR0FBbkI7QUFDRDs7QUFDRCxjQUNFa0QscUJBQXFCLENBQUNsRCxHQUFELENBQXJCLElBQ0drRCxxQkFBcUIsQ0FBQ2xELEdBQUQsQ0FBckIsQ0FBMkI2QixhQUEzQixLQUE2QyxJQUZsRCxFQUdFO0FBQ0F1QixZQUFBQSxPQUFPLENBQUNwRCxHQUFELENBQVAsR0FBZSxJQUFmO0FBQ0Q7QUFDRixTQVZEO0FBV0Q7O0FBRUQsV0FBSyxNQUFNdUQsY0FBWCxJQUE2Qk4sZ0JBQTdCLEVBQStDO0FBQzdDLGNBQU05RCxNQUFNLEdBQUdrRSxhQUFhLENBQUNLLEdBQWQsQ0FBa0IxRCxHQUFHLElBQUk7QUFDdEMsY0FDRSxLQUFLckMsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QnlELFdBQXZCLElBQ0dQLE9BQU8sQ0FBQ3BELEdBQUQsQ0FBUCxLQUFpQixJQUZ0QixFQUdFO0FBQ0EsbUJBQU91RCxjQUFjLENBQUN2RCxHQUFELENBQWQsSUFBdUIsU0FBOUI7QUFDRDs7QUFFRCxpQkFBTyxLQUFLaUMsTUFBTCxDQUFZc0IsY0FBYyxDQUFDdkQsR0FBRCxDQUExQixFQUFpQ2tELHFCQUFxQixDQUFDbEQsR0FBRCxDQUF0RCxFQUE2RDtBQUFFbUMsWUFBQUEsT0FBTyxFQUFFO0FBQVgsV0FBN0QsQ0FBUDtBQUNELFNBVGMsQ0FBZjtBQVdBZ0IsUUFBQUEsTUFBTSxDQUFDdkIsSUFBUCxDQUFhLElBQUd6QyxNQUFNLENBQUN1RCxJQUFQLENBQVksR0FBWixDQUFpQixHQUFqQztBQUNEOztBQUVELFVBQUksS0FBSy9FLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJxQyxPQUF2QixDQUErQnFCLGlCQUEvQixJQUFvRHBHLE9BQU8sQ0FBQ29HLGlCQUFoRSxFQUFtRjtBQUNqRixZQUFJLEtBQUtqRyxRQUFMLENBQWN1QyxRQUFkLENBQXVCcUMsT0FBdkIsQ0FBK0JxQixpQkFBL0IsSUFBb0QsNEJBQXhELEVBQXNGO0FBQUU7QUFDdEY7QUFDQSxnQkFBTUMsWUFBWSxHQUFHckcsT0FBTyxDQUFDc0csVUFBUixDQUFtQkosR0FBbkIsQ0FBdUJLLElBQUksSUFBSSxLQUFLakQsZUFBTCxDQUFxQmlELElBQXJCLENBQS9CLENBQXJCO0FBQ0EsZ0JBQU1DLFVBQVUsR0FBR3hHLE9BQU8sQ0FBQ29HLGlCQUFSLENBQTBCRixHQUExQixDQUE4QkssSUFBSSxJQUFLLEdBQUUsS0FBS2pELGVBQUwsQ0FBcUJpRCxJQUFyQixDQUEyQixhQUFZLEtBQUtqRCxlQUFMLENBQXFCaUQsSUFBckIsQ0FBMkIsRUFBM0csQ0FBbkI7QUFDQVQsVUFBQUEsb0JBQW9CLEdBQUksaUJBQWdCTyxZQUFZLENBQUNuQixJQUFiLENBQWtCLEdBQWxCLENBQXVCLG1CQUFrQnNCLFVBQVUsQ0FBQ3RCLElBQVgsQ0FBZ0IsR0FBaEIsQ0FBcUIsRUFBdEc7QUFDRCxTQUxELE1BS087QUFBRTtBQUNQLGdCQUFNdUIsU0FBUyxHQUFHekcsT0FBTyxDQUFDb0csaUJBQVIsQ0FBMEJGLEdBQTFCLENBQThCSyxJQUFJLElBQUssR0FBRSxLQUFLakQsZUFBTCxDQUFxQmlELElBQXJCLENBQTJCLFdBQVUsS0FBS2pELGVBQUwsQ0FBcUJpRCxJQUFyQixDQUEyQixHQUF6RyxDQUFsQjtBQUNBVCxVQUFBQSxvQkFBb0IsR0FBSSxHQUFFLEtBQUszRixRQUFMLENBQWN1QyxRQUFkLENBQXVCcUMsT0FBdkIsQ0FBK0JxQixpQkFBa0IsSUFBR0ssU0FBUyxDQUFDdkIsSUFBVixDQUFlLEdBQWYsQ0FBb0IsRUFBbEc7QUFDRDtBQUNGOztBQUVELFlBQU1KLGdCQUFnQixHQUFHOUUsT0FBTyxDQUFDOEUsZ0JBQVIsR0FBMkIsS0FBSzNFLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJxQyxPQUF2QixDQUErQkQsZ0JBQTFELEdBQTZFLEVBQXRHO0FBQ0EsWUFBTUcsVUFBVSxHQUFHWSxhQUFhLENBQUNLLEdBQWQsQ0FBa0JLLElBQUksSUFBSSxLQUFLakQsZUFBTCxDQUFxQmlELElBQXJCLENBQTFCLEVBQXNEckIsSUFBdEQsQ0FBMkQsR0FBM0QsQ0FBbkI7QUFDQSxZQUFNRixtQkFBbUIsR0FBR2hGLE9BQU8sQ0FBQzhFLGdCQUFSLEdBQTJCLEtBQUszRSxRQUFMLENBQWN1QyxRQUFkLENBQXVCcUMsT0FBdkIsQ0FBK0JDLG1CQUExRCxHQUFnRixFQUE1RztBQUNBLFVBQUlwQyxTQUFTLEdBQUcsRUFBaEI7O0FBRUEsVUFBSSxLQUFLekMsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QkMsWUFBdkIsSUFBdUMrRCxLQUFLLENBQUNDLE9BQU4sQ0FBYzNHLE9BQU8sQ0FBQzRDLFNBQXRCLENBQTNDLEVBQTZFO0FBQzNFLGNBQU1sQixNQUFNLEdBQUcxQixPQUFPLENBQUM0QyxTQUFSLENBQWtCc0QsR0FBbEIsQ0FBc0J6RCxLQUFLLElBQUksS0FBS2EsZUFBTCxDQUFxQmIsS0FBckIsQ0FBL0IsRUFBNER5QyxJQUE1RCxDQUFpRSxHQUFqRSxDQUFmO0FBQ0F0QyxRQUFBQSxTQUFTLElBQUssY0FBYWxCLE1BQU8sRUFBbEM7QUFDRCxPQUhELE1BR087QUFDTGtCLFFBQUFBLFNBQVMsSUFBSSxLQUFLekMsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QkMsWUFBdkIsSUFBdUMzQyxPQUFPLENBQUM0QyxTQUEvQyxHQUEyRCxjQUEzRCxHQUE0RSxFQUF6RjtBQUNEOztBQUVELGFBQVEsU0FBUWtDLGdCQUFpQixTQUFRLEtBQUs5RCxVQUFMLENBQWdCVixTQUFoQixDQUEyQixLQUFJMkUsVUFBVyxZQUFXVSxNQUFNLENBQUNULElBQVAsQ0FBWSxHQUFaLENBQWlCLEdBQUVZLG9CQUFxQixHQUFFZCxtQkFBb0IsR0FBRXBDLFNBQVUsR0FBeEs7QUFDRDtBQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Z0NBQ2N0QyxTLEVBQVdzRyxhLEVBQWVDLEssRUFBTzdHLE8sRUFBU2lGLFUsRUFBWTtBQUNoRWpGLE1BQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCOztBQUNBakIsTUFBQUEsQ0FBQyxDQUFDeUMsUUFBRixDQUFXeEIsT0FBWCxFQUFvQixLQUFLQSxPQUF6Qjs7QUFFQTRHLE1BQUFBLGFBQWEsR0FBRzFILEtBQUssQ0FBQzJFLHdCQUFOLENBQStCK0MsYUFBL0IsRUFBOEM1RyxPQUFPLENBQUM4RCxRQUF0RCxFQUFnRTlELE9BQWhFLENBQWhCO0FBRUEsWUFBTTJCLE1BQU0sR0FBRyxFQUFmO0FBQ0EsWUFBTUMsSUFBSSxHQUFHLEVBQWI7QUFDQSxZQUFNSCxpQkFBaUIsR0FBRyxFQUExQjtBQUNBLFVBQUlVLGNBQWMsR0FBRyxFQUFyQjtBQUNBLFVBQUlFLFFBQVEsR0FBRyxFQUFmLENBVmdFLENBVTdDOztBQUNuQixVQUFJbUIsYUFBYSxHQUFHLEVBQXBCLENBWGdFLENBV3hDOztBQUN4QixVQUFJc0QsTUFBTSxHQUFHLEVBQWI7O0FBRUEsVUFBSS9ILENBQUMsQ0FBQzBFLEdBQUYsQ0FBTSxJQUFOLEVBQVksQ0FBQyxXQUFELEVBQWMsU0FBZCxFQUF5QixnQkFBekIsRUFBMkMsbUJBQTNDLENBQVosS0FBZ0Z6RCxPQUFPLENBQUMwRCxVQUE1RixFQUF3RztBQUN0RztBQUNBMUQsUUFBQUEsT0FBTyxDQUFDOEIsU0FBUixHQUFvQixLQUFwQjtBQUNEOztBQUVELFlBQU1BLFNBQVMsR0FBRzlCLE9BQU8sQ0FBQzhCLFNBQVIsS0FBc0JDLFNBQXRCLEdBQWtDLEtBQUtELFNBQUwsQ0FBZUYsSUFBZixDQUFsQyxHQUF5RDVCLE9BQU8sQ0FBQzhCLFNBQW5GOztBQUVBLFVBQUksS0FBSzNCLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUIsaUJBQXZCLEtBQTZDMUMsT0FBTyxDQUFDK0csS0FBekQsRUFBZ0U7QUFDOUQsWUFBSSxLQUFLM0csT0FBTCxLQUFpQixPQUFyQixFQUE4QjtBQUM1QjBHLFVBQUFBLE1BQU0sR0FBSSxVQUFTLEtBQUtyQyxNQUFMLENBQVl6RSxPQUFPLENBQUMrRyxLQUFwQixDQUEyQixHQUE5QztBQUNEO0FBQ0Y7O0FBRUQsVUFBSSxLQUFLNUcsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QkMsWUFBM0IsRUFBeUM7QUFDdkMsWUFBSSxLQUFLeEMsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QkMsWUFBdkIsQ0FBb0NFLE1BQXhDLEVBQWdEO0FBQzlDO0FBQ0FWLFVBQUFBLGNBQWMsR0FBRyxvQkFBakIsQ0FGOEMsQ0FJOUM7O0FBQ0EsY0FBSThDLFVBQVUsSUFBSWpGLE9BQU8sQ0FBQzhDLFVBQXRCLElBQW9DLEtBQUszQyxRQUFMLENBQWN1QyxRQUFkLENBQXVCSyxlQUEvRCxFQUFnRjtBQUM5RSxnQkFBSUMsVUFBVSxHQUFHLEVBQWpCO0FBQ0EsZ0JBQUlDLGFBQWEsR0FBRyxFQUFwQjs7QUFFQSxpQkFBSyxNQUFNQyxRQUFYLElBQXVCK0IsVUFBdkIsRUFBbUM7QUFDakMsb0JBQU0xQyxTQUFTLEdBQUcwQyxVQUFVLENBQUMvQixRQUFELENBQTVCOztBQUNBLGtCQUFJLEVBQUVYLFNBQVMsQ0FBQ1ksSUFBVixZQUEwQjlELFNBQVMsQ0FBQytELE9BQXRDLENBQUosRUFBb0Q7QUFDbEQsb0JBQUlKLFVBQVUsQ0FBQ0ssTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUN6Qkwsa0JBQUFBLFVBQVUsSUFBSSxHQUFkO0FBQ0FDLGtCQUFBQSxhQUFhLElBQUksR0FBakI7QUFDRDs7QUFFREQsZ0JBQUFBLFVBQVUsSUFBSyxHQUFFLEtBQUtNLGVBQUwsQ0FBcUJmLFNBQVMsQ0FBQ0UsS0FBL0IsQ0FBc0MsSUFBR0YsU0FBUyxDQUFDWSxJQUFWLENBQWVJLEtBQWYsRUFBdUIsRUFBakY7QUFDQU4sZ0JBQUFBLGFBQWEsSUFBSyxZQUFXLEtBQUtLLGVBQUwsQ0FBcUJmLFNBQVMsQ0FBQ0UsS0FBL0IsQ0FBc0MsRUFBbkU7QUFDRDtBQUNGOztBQUVESixZQUFBQSxRQUFRLEdBQUksdUJBQXNCVyxVQUFXLEtBQTdDO0FBQ0FiLFlBQUFBLGNBQWMsR0FBSSxXQUFVYyxhQUFjLFlBQTFDO0FBQ0FPLFlBQUFBLGFBQWEsR0FBRyxxQkFBaEI7QUFFQXNELFlBQUFBLE1BQU0sSUFBSXRELGFBQVY7QUFDRDtBQUNGLFNBNUJELE1BNEJPLElBQUksS0FBS3JELFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJDLFlBQXZCLElBQXVDM0MsT0FBTyxDQUFDNEMsU0FBbkQsRUFBOEQ7QUFDbkU7QUFDQTVDLFVBQUFBLE9BQU8sQ0FBQ2dILFVBQVIsR0FBcUIsSUFBckI7QUFDQUYsVUFBQUEsTUFBTSxJQUFJLGNBQVY7QUFDRDtBQUNGOztBQUVELFVBQUk3QixVQUFKLEVBQWdCO0FBQ2RsRyxRQUFBQSxDQUFDLENBQUN1RCxJQUFGLENBQU8yQyxVQUFQLEVBQW1CLENBQUMxQyxTQUFELEVBQVlDLEdBQVosS0FBb0I7QUFDckNmLFVBQUFBLGlCQUFpQixDQUFDZSxHQUFELENBQWpCLEdBQXlCRCxTQUF6Qjs7QUFDQSxjQUFJQSxTQUFTLENBQUNFLEtBQWQsRUFBcUI7QUFDbkJoQixZQUFBQSxpQkFBaUIsQ0FBQ2MsU0FBUyxDQUFDRSxLQUFYLENBQWpCLEdBQXFDRixTQUFyQztBQUNEO0FBQ0YsU0FMRDtBQU1EOztBQUVELFdBQUssTUFBTUMsR0FBWCxJQUFrQm9FLGFBQWxCLEVBQWlDO0FBQy9CLFlBQUluRixpQkFBaUIsSUFBSUEsaUJBQWlCLENBQUNlLEdBQUQsQ0FBdEMsSUFDRmYsaUJBQWlCLENBQUNlLEdBQUQsQ0FBakIsQ0FBdUI2QixhQUF2QixLQUF5QyxJQUR2QyxJQUVGLENBQUMsS0FBS2xFLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUIyQixhQUF2QixDQUFxQzRDLE1BRnhDLEVBRWdEO0FBQzlDO0FBQ0E7QUFDRDs7QUFFRCxjQUFNOUMsS0FBSyxHQUFHeUMsYUFBYSxDQUFDcEUsR0FBRCxDQUEzQjs7QUFFQSxZQUFJMkIsS0FBSyxZQUFZakYsS0FBSyxDQUFDd0YsZUFBdkIsSUFBMEMxRSxPQUFPLENBQUM4QixTQUFSLEtBQXNCLEtBQXBFLEVBQTJFO0FBQ3pFSCxVQUFBQSxNQUFNLENBQUN5QyxJQUFQLENBQWEsR0FBRSxLQUFLZCxlQUFMLENBQXFCZCxHQUFyQixDQUEwQixJQUFHLEtBQUtpQyxNQUFMLENBQVlOLEtBQVosRUFBbUIxQyxpQkFBaUIsSUFBSUEsaUJBQWlCLENBQUNlLEdBQUQsQ0FBdEMsSUFBK0NULFNBQWxFLEVBQTZFO0FBQUU0QyxZQUFBQSxPQUFPLEVBQUU7QUFBWCxXQUE3RSxDQUFvRyxFQUFoSjtBQUNELFNBRkQsTUFFTztBQUNMaEQsVUFBQUEsTUFBTSxDQUFDeUMsSUFBUCxDQUFhLEdBQUUsS0FBS2QsZUFBTCxDQUFxQmQsR0FBckIsQ0FBMEIsSUFBRyxLQUFLb0MsTUFBTCxDQUFZVCxLQUFaLEVBQW1CMUMsaUJBQWlCLElBQUlBLGlCQUFpQixDQUFDZSxHQUFELENBQXRDLElBQStDVCxTQUFsRSxFQUE2RTtBQUFFNEMsWUFBQUEsT0FBTyxFQUFFO0FBQVgsV0FBN0UsRUFBb0c3QyxTQUFwRyxDQUErRyxFQUEzSjtBQUNEO0FBQ0Y7O0FBRUQsWUFBTW9GLFlBQVksR0FBR25JLENBQUMsQ0FBQ3lDLFFBQUYsQ0FBVztBQUFFTSxRQUFBQTtBQUFGLE9BQVgsRUFBMEI5QixPQUExQixDQUFyQjs7QUFFQSxVQUFJMkIsTUFBTSxDQUFDMEIsTUFBUCxLQUFrQixDQUF0QixFQUF5QjtBQUN2QixlQUFPLEVBQVA7QUFDRDs7QUFFRCxZQUFNckIsS0FBSyxHQUFJLEdBQUVLLFFBQVMsVUFBUyxLQUFLckIsVUFBTCxDQUFnQlYsU0FBaEIsQ0FBMkIsUUFBT3FCLE1BQU0sQ0FBQ3VELElBQVAsQ0FBWSxHQUFaLENBQWlCLEdBQUUvQyxjQUFlLElBQUcsS0FBS2dGLFVBQUwsQ0FBZ0JOLEtBQWhCLEVBQXVCSyxZQUF2QixDQUFxQyxHQUFFSixNQUFPLEVBQTFJLENBQTRJTSxJQUE1SSxFQUFkLENBL0ZnRSxDQWdHaEU7O0FBQ0EsWUFBTTVCLE1BQU0sR0FBRztBQUFFeEQsUUFBQUE7QUFBRixPQUFmOztBQUNBLFVBQUloQyxPQUFPLENBQUM4QixTQUFSLEtBQXNCLEtBQTFCLEVBQWlDO0FBQy9CMEQsUUFBQUEsTUFBTSxDQUFDNUQsSUFBUCxHQUFjQSxJQUFkO0FBQ0Q7O0FBQ0QsYUFBTzRELE1BQVA7QUFDRDtBQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O29DQUNrQjZCLFEsRUFBVS9HLFMsRUFBV3NHLGEsRUFBZUMsSyxFQUFPN0csTyxFQUFTaUYsVSxFQUFZO0FBQzlFakYsTUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7O0FBQ0FqQixNQUFBQSxDQUFDLENBQUN5QyxRQUFGLENBQVd4QixPQUFYLEVBQW9CO0FBQUU0QyxRQUFBQSxTQUFTLEVBQUU7QUFBYixPQUFwQjs7QUFFQWdFLE1BQUFBLGFBQWEsR0FBRzFILEtBQUssQ0FBQzJFLHdCQUFOLENBQStCK0MsYUFBL0IsRUFBOEMsS0FBSzVHLE9BQUwsQ0FBYThELFFBQTNELENBQWhCO0FBRUEsWUFBTW5DLE1BQU0sR0FBRyxFQUFmO0FBQ0EsVUFBSVEsY0FBYyxHQUFHLEVBQXJCO0FBQ0EsVUFBSW1GLGlCQUFpQixHQUFHLEVBQXhCOztBQUVBLFVBQUksS0FBS25ILFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJDLFlBQXZCLElBQXVDM0MsT0FBTyxDQUFDNEMsU0FBbkQsRUFBOEQ7QUFDNUQsWUFBSSxLQUFLekMsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QkMsWUFBdkIsQ0FBb0NDLFNBQXhDLEVBQW1EO0FBQ2pENUMsVUFBQUEsT0FBTyxDQUFDZ0gsVUFBUixHQUFxQixJQUFyQjtBQUNBTSxVQUFBQSxpQkFBaUIsR0FBRyxhQUFwQjtBQUNELFNBSEQsTUFHTyxJQUFJLEtBQUtuSCxRQUFMLENBQWN1QyxRQUFkLENBQXVCQyxZQUF2QixDQUFvQ0UsTUFBeEMsRUFBZ0Q7QUFDckRWLFVBQUFBLGNBQWMsR0FBRyxvQkFBakI7QUFDRDtBQUNGOztBQUVELFdBQUssTUFBTUssR0FBWCxJQUFrQm9FLGFBQWxCLEVBQWlDO0FBQy9CLGNBQU16QyxLQUFLLEdBQUd5QyxhQUFhLENBQUNwRSxHQUFELENBQTNCO0FBQ0FiLFFBQUFBLE1BQU0sQ0FBQ3lDLElBQVAsQ0FBYSxHQUFFLEtBQUtkLGVBQUwsQ0FBcUJkLEdBQXJCLENBQTBCLElBQUcsS0FBS2MsZUFBTCxDQUFxQmQsR0FBckIsQ0FBMEIsR0FBRTZFLFFBQVMsSUFBRyxLQUFLNUMsTUFBTCxDQUFZTixLQUFaLENBQW1CLEVBQXZHO0FBQ0Q7O0FBRURjLE1BQUFBLFVBQVUsR0FBR0EsVUFBVSxJQUFJLEVBQTNCOztBQUNBLFdBQUssTUFBTXpDLEdBQVgsSUFBa0J5QyxVQUFsQixFQUE4QjtBQUM1QixjQUFNZCxLQUFLLEdBQUdjLFVBQVUsQ0FBQ3pDLEdBQUQsQ0FBeEI7QUFDQWIsUUFBQUEsTUFBTSxDQUFDeUMsSUFBUCxDQUFhLEdBQUUsS0FBS2QsZUFBTCxDQUFxQmQsR0FBckIsQ0FBMEIsSUFBRyxLQUFLaUMsTUFBTCxDQUFZTixLQUFaLENBQW1CLEVBQS9EO0FBQ0Q7O0FBRUQsYUFBUSxVQUFTLEtBQUtuRCxVQUFMLENBQWdCVixTQUFoQixDQUEyQixRQUFPcUIsTUFBTSxDQUFDdUQsSUFBUCxDQUFZLEdBQVosQ0FBaUIsR0FBRS9DLGNBQWUsSUFBRyxLQUFLZ0YsVUFBTCxDQUFnQk4sS0FBaEIsQ0FBdUIsSUFBR1MsaUJBQWtCLEVBQTdILENBQStIRixJQUEvSCxFQUFQO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztrQ0FDZ0I5RyxTLEVBQVcyRSxVLEVBQVlqRixPLEVBQVN1SCxZLEVBQWM7QUFDMUR2SCxNQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjs7QUFFQSxVQUFJLENBQUMwRyxLQUFLLENBQUNDLE9BQU4sQ0FBYzFCLFVBQWQsQ0FBTCxFQUFnQztBQUM5QmpGLFFBQUFBLE9BQU8sR0FBR2lGLFVBQVY7QUFDQUEsUUFBQUEsVUFBVSxHQUFHbEQsU0FBYjtBQUNELE9BSEQsTUFHTztBQUNML0IsUUFBQUEsT0FBTyxDQUFDMEIsTUFBUixHQUFpQnVELFVBQWpCO0FBQ0Q7O0FBRURqRixNQUFBQSxPQUFPLENBQUN3SCxNQUFSLEdBQWlCeEgsT0FBTyxDQUFDd0gsTUFBUixJQUFrQkQsWUFBbEIsSUFBa0NqSCxTQUFuRDs7QUFDQSxVQUFJTixPQUFPLENBQUN3SCxNQUFSLElBQWtCLE9BQU94SCxPQUFPLENBQUN3SCxNQUFmLEtBQTBCLFFBQWhELEVBQTBEO0FBQ3hEeEgsUUFBQUEsT0FBTyxDQUFDd0gsTUFBUixHQUFpQnhILE9BQU8sQ0FBQ3dILE1BQVIsQ0FBZW5DLE9BQWYsQ0FBdUIsS0FBdkIsRUFBOEIsR0FBOUIsQ0FBakI7QUFDQXJGLFFBQUFBLE9BQU8sQ0FBQ3dILE1BQVIsR0FBaUJ4SCxPQUFPLENBQUN3SCxNQUFSLENBQWVuQyxPQUFmLENBQXVCLFFBQXZCLEVBQWlDLEVBQWpDLENBQWpCO0FBQ0Q7O0FBRUQsWUFBTW9DLFNBQVMsR0FBR3pILE9BQU8sQ0FBQzBCLE1BQVIsQ0FBZXdFLEdBQWYsQ0FBbUJ6RCxLQUFLLElBQUk7QUFDNUMsWUFBSSxPQUFPQSxLQUFQLEtBQWlCLFFBQXJCLEVBQStCO0FBQzdCLGlCQUFPLEtBQUthLGVBQUwsQ0FBcUJiLEtBQXJCLENBQVA7QUFDRDs7QUFDRCxZQUFJQSxLQUFLLFlBQVl2RCxLQUFLLENBQUN3RixlQUEzQixFQUE0QztBQUMxQyxpQkFBTyxLQUFLZ0QscUJBQUwsQ0FBMkJqRixLQUEzQixDQUFQO0FBQ0Q7O0FBQ0QsWUFBSStDLE1BQU0sR0FBRyxFQUFiOztBQUVBLFlBQUkvQyxLQUFLLENBQUNGLFNBQVYsRUFBcUI7QUFDbkJFLFVBQUFBLEtBQUssQ0FBQ3BDLElBQU4sR0FBYW9DLEtBQUssQ0FBQ0YsU0FBbkI7QUFDRDs7QUFFRCxZQUFJLENBQUNFLEtBQUssQ0FBQ3BDLElBQVgsRUFBaUI7QUFDZixnQkFBTSxJQUFJSCxLQUFKLENBQVcsMENBQXlDckIsSUFBSSxDQUFDOEksT0FBTCxDQUFhbEYsS0FBYixDQUFvQixFQUF4RSxDQUFOO0FBQ0Q7O0FBRUQrQyxRQUFBQSxNQUFNLElBQUksS0FBS2xDLGVBQUwsQ0FBcUJiLEtBQUssQ0FBQ3BDLElBQTNCLENBQVY7O0FBRUEsWUFBSSxLQUFLRixRQUFMLENBQWN1QyxRQUFkLENBQXVCa0YsS0FBdkIsQ0FBNkJDLE9BQTdCLElBQXdDcEYsS0FBSyxDQUFDb0YsT0FBbEQsRUFBMkQ7QUFDekRyQyxVQUFBQSxNQUFNLElBQUssWUFBVyxLQUFLbEMsZUFBTCxDQUFxQmIsS0FBSyxDQUFDb0YsT0FBM0IsQ0FBb0MsRUFBMUQ7QUFDRDs7QUFFRCxZQUFJLEtBQUsxSCxRQUFMLENBQWN1QyxRQUFkLENBQXVCa0YsS0FBdkIsQ0FBNkJ2RSxNQUE3QixJQUF1Q1osS0FBSyxDQUFDWSxNQUFqRCxFQUF5RDtBQUN2RG1DLFVBQUFBLE1BQU0sSUFBSyxJQUFHL0MsS0FBSyxDQUFDWSxNQUFPLEdBQTNCO0FBQ0Q7O0FBRUQsWUFBSVosS0FBSyxDQUFDcUYsS0FBVixFQUFpQjtBQUNmdEMsVUFBQUEsTUFBTSxJQUFLLElBQUcvQyxLQUFLLENBQUNxRixLQUFNLEVBQTFCO0FBQ0Q7O0FBRUQsZUFBT3RDLE1BQVA7QUFDRCxPQWhDaUIsQ0FBbEI7O0FBa0NBLFVBQUksQ0FBQ3hGLE9BQU8sQ0FBQ0ssSUFBYixFQUFtQjtBQUNqQjtBQUNBO0FBQ0FMLFFBQUFBLE9BQU8sR0FBR2QsS0FBSyxDQUFDNkksU0FBTixDQUFnQi9ILE9BQWhCLEVBQXlCQSxPQUFPLENBQUN3SCxNQUFqQyxDQUFWO0FBQ0Q7O0FBRUR4SCxNQUFBQSxPQUFPLEdBQUdWLEtBQUssQ0FBQzBJLGFBQU4sQ0FBb0JoSSxPQUFwQixDQUFWOztBQUVBLFVBQUksQ0FBQyxLQUFLRyxRQUFMLENBQWN1QyxRQUFkLENBQXVCa0YsS0FBdkIsQ0FBNkJ6RSxJQUFsQyxFQUF3QztBQUN0QyxlQUFPbkQsT0FBTyxDQUFDbUQsSUFBZjtBQUNEOztBQUVELFVBQUluRCxPQUFPLENBQUM2RyxLQUFaLEVBQW1CO0FBQ2pCN0csUUFBQUEsT0FBTyxDQUFDNkcsS0FBUixHQUFnQixLQUFLTSxVQUFMLENBQWdCbkgsT0FBTyxDQUFDNkcsS0FBeEIsQ0FBaEI7QUFDRDs7QUFFRCxVQUFJLE9BQU92RyxTQUFQLEtBQXFCLFFBQXpCLEVBQW1DO0FBQ2pDQSxRQUFBQSxTQUFTLEdBQUcsS0FBSzJILGdCQUFMLENBQXNCM0gsU0FBdEIsQ0FBWjtBQUNELE9BRkQsTUFFTztBQUNMQSxRQUFBQSxTQUFTLEdBQUcsS0FBS1UsVUFBTCxDQUFnQlYsU0FBaEIsQ0FBWjtBQUNEOztBQUVELFlBQU00SCxZQUFZLEdBQUcsS0FBSy9ILFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJrRixLQUF2QixDQUE2Qk0sWUFBN0IsSUFBNkNsSSxPQUFPLENBQUNrSSxZQUFyRCxHQUFvRSxjQUFwRSxHQUFxRm5HLFNBQTFHO0FBQ0EsVUFBSW9HLEdBQUo7O0FBQ0EsVUFBSSxLQUFLaEksUUFBTCxDQUFjdUMsUUFBZCxDQUF1QjBGLGFBQTNCLEVBQTBDO0FBQ3hDRCxRQUFBQSxHQUFHLEdBQUcsQ0FDSixhQURJLEVBRUo3SCxTQUZJLEVBR0o0SCxZQUhJLEVBSUosS0FKSSxDQUFOO0FBTUQsT0FQRCxNQU9PO0FBQ0xDLFFBQUFBLEdBQUcsR0FBRyxDQUFDLFFBQUQsQ0FBTjtBQUNEOztBQUVEQSxNQUFBQSxHQUFHLEdBQUdBLEdBQUcsQ0FBQ0UsTUFBSixDQUNKckksT0FBTyxDQUFDc0ksTUFBUixHQUFpQixRQUFqQixHQUE0QixFQUR4QixFQUVKdEksT0FBTyxDQUFDbUQsSUFGSixFQUVVLE9BRlYsRUFHSixDQUFDLEtBQUtoRCxRQUFMLENBQWN1QyxRQUFkLENBQXVCMEYsYUFBeEIsR0FBd0NGLFlBQXhDLEdBQXVEbkcsU0FIbkQsRUFJSixLQUFLa0csZ0JBQUwsQ0FBc0JqSSxPQUFPLENBQUNLLElBQTlCLENBSkksRUFLSixLQUFLRixRQUFMLENBQWN1QyxRQUFkLENBQXVCa0YsS0FBdkIsQ0FBNkJXLEtBQTdCLEtBQXVDLENBQXZDLElBQTRDdkksT0FBTyxDQUFDdUksS0FBcEQsR0FBNkQsU0FBUXZJLE9BQU8sQ0FBQ3VJLEtBQU0sRUFBbkYsR0FBdUYsRUFMbkYsRUFNSixDQUFDLEtBQUtwSSxRQUFMLENBQWN1QyxRQUFkLENBQXVCMEYsYUFBeEIsR0FBeUMsTUFBSzlILFNBQVUsRUFBeEQsR0FBNER5QixTQU54RCxFQU9KLEtBQUs1QixRQUFMLENBQWN1QyxRQUFkLENBQXVCa0YsS0FBdkIsQ0FBNkJXLEtBQTdCLEtBQXVDLENBQXZDLElBQTRDdkksT0FBTyxDQUFDdUksS0FBcEQsR0FBNkQsU0FBUXZJLE9BQU8sQ0FBQ3VJLEtBQU0sRUFBbkYsR0FBdUYsRUFQbkYsRUFRSCxJQUFHZCxTQUFTLENBQUN2QyxJQUFWLENBQWUsSUFBZixDQUFxQixHQUFFbEYsT0FBTyxDQUFDcUgsUUFBUixHQUFvQixJQUFHckgsT0FBTyxDQUFDcUgsUUFBUyxFQUF4QyxHQUE0QyxFQUFHLEdBUnRFLEVBU0osS0FBS2xILFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJrRixLQUF2QixDQUE2QlksTUFBN0IsSUFBdUN4SSxPQUFPLENBQUN3SSxNQUEvQyxHQUF5RCxlQUFjeEksT0FBTyxDQUFDd0ksTUFBTyxFQUF0RixHQUEwRnpHLFNBVHRGLEVBVUosS0FBSzVCLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJrRixLQUF2QixDQUE2QmYsS0FBN0IsSUFBc0M3RyxPQUFPLENBQUM2RyxLQUE5QyxHQUFzRDdHLE9BQU8sQ0FBQzZHLEtBQTlELEdBQXNFOUUsU0FWbEUsQ0FBTjtBQWFBLGFBQU9oRCxDQUFDLENBQUMwSixPQUFGLENBQVVOLEdBQVYsRUFBZWpELElBQWYsQ0FBb0IsR0FBcEIsQ0FBUDtBQUNEOzs7dUNBRWtCNUUsUyxFQUFXTixPLEVBQVM7QUFDckNBLE1BQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCO0FBQ0EsWUFBTTBJLGlCQUFpQixHQUFHLEtBQUtDLG9CQUFMLENBQTBCckksU0FBMUIsRUFBcUNOLE9BQXJDLENBQTFCOztBQUVBLFVBQUksT0FBT00sU0FBUCxLQUFxQixRQUF6QixFQUFtQztBQUNqQ0EsUUFBQUEsU0FBUyxHQUFHLEtBQUsySCxnQkFBTCxDQUFzQjNILFNBQXRCLENBQVo7QUFDRCxPQUZELE1BRU87QUFDTEEsUUFBQUEsU0FBUyxHQUFHLEtBQUtVLFVBQUwsQ0FBZ0JWLFNBQWhCLENBQVo7QUFDRDs7QUFFRCxhQUFRLGVBQWNBLFNBQVUsUUFBT29JLGlCQUFrQixHQUF6RDtBQUNEOzs7eUNBRW9CcEksUyxFQUFXTixPLEVBQVM7QUFDdkMsVUFBSTBJLGlCQUFKLEVBQXVCRSxjQUF2QjtBQUVBLFlBQU1uQixTQUFTLEdBQUd6SCxPQUFPLENBQUMwQixNQUFSLENBQWV3RSxHQUFmLENBQW1CekQsS0FBSyxJQUFJO0FBQzVDLFlBQUksT0FBT0EsS0FBUCxLQUFpQixRQUFyQixFQUErQjtBQUM3QixpQkFBTyxLQUFLYSxlQUFMLENBQXFCYixLQUFyQixDQUFQO0FBQ0Q7O0FBQ0QsWUFBSUEsS0FBSyxZQUFZdkQsS0FBSyxDQUFDd0YsZUFBM0IsRUFBNEM7QUFDMUMsaUJBQU8sS0FBS2dELHFCQUFMLENBQTJCakYsS0FBM0IsQ0FBUDtBQUNEOztBQUNELFlBQUlBLEtBQUssQ0FBQ0YsU0FBVixFQUFxQjtBQUNuQkUsVUFBQUEsS0FBSyxDQUFDcEMsSUFBTixHQUFhb0MsS0FBSyxDQUFDRixTQUFuQjtBQUNEOztBQUVELFlBQUksQ0FBQ0UsS0FBSyxDQUFDcEMsSUFBWCxFQUFpQjtBQUNmLGdCQUFNLElBQUlILEtBQUosQ0FBVywwQ0FBeUN1QyxLQUFNLEVBQTFELENBQU47QUFDRDs7QUFFRCxlQUFPLEtBQUthLGVBQUwsQ0FBcUJiLEtBQUssQ0FBQ3BDLElBQTNCLENBQVA7QUFDRCxPQWhCaUIsQ0FBbEI7QUFrQkEsWUFBTXdJLHFCQUFxQixHQUFHcEIsU0FBUyxDQUFDdkMsSUFBVixDQUFlLElBQWYsQ0FBOUI7QUFDQSxZQUFNNEQsZUFBZSxHQUFHckIsU0FBUyxDQUFDdkMsSUFBVixDQUFlLEdBQWYsQ0FBeEI7O0FBRUEsY0FBUWxGLE9BQU8sQ0FBQ21ELElBQVIsQ0FBYTRGLFdBQWIsRUFBUjtBQUNFLGFBQUssUUFBTDtBQUNFSCxVQUFBQSxjQUFjLEdBQUcsS0FBS3RGLGVBQUwsQ0FBcUJ0RCxPQUFPLENBQUNLLElBQVIsSUFBaUIsR0FBRUMsU0FBVSxJQUFHd0ksZUFBZ0IsS0FBckUsQ0FBakI7QUFDQUosVUFBQUEsaUJBQWlCLEdBQUksY0FBYUUsY0FBZSxZQUFXQyxxQkFBc0IsR0FBbEY7QUFDQTs7QUFDRixhQUFLLE9BQUw7QUFDRTdJLFVBQUFBLE9BQU8sQ0FBQzZHLEtBQVIsR0FBZ0IsS0FBS21DLGVBQUwsQ0FBcUJoSixPQUFPLENBQUM2RyxLQUE3QixDQUFoQjtBQUNBK0IsVUFBQUEsY0FBYyxHQUFHLEtBQUt0RixlQUFMLENBQXFCdEQsT0FBTyxDQUFDSyxJQUFSLElBQWlCLEdBQUVDLFNBQVUsSUFBR3dJLGVBQWdCLEtBQXJFLENBQWpCO0FBQ0FKLFVBQUFBLGlCQUFpQixHQUFJLGNBQWFFLGNBQWUsV0FBVTVJLE9BQU8sQ0FBQzZHLEtBQU0sR0FBekU7QUFDQTs7QUFDRixhQUFLLFNBQUw7QUFDRSxjQUFJN0csT0FBTyxDQUFDc0UsWUFBUixLQUF5QnZDLFNBQTdCLEVBQXdDO0FBQ3RDLGtCQUFNLElBQUk3QixLQUFKLENBQVUsdURBQVYsQ0FBTjtBQUNEOztBQUVELGNBQUksS0FBS0MsUUFBTCxDQUFjRSxJQUFkLEtBQXVCLE9BQTNCLEVBQW9DO0FBQ2xDLGtCQUFNLElBQUlILEtBQUosQ0FBVSwyREFBVixDQUFOO0FBQ0Q7O0FBRUQwSSxVQUFBQSxjQUFjLEdBQUcsS0FBS3RGLGVBQUwsQ0FBcUJ0RCxPQUFPLENBQUNLLElBQVIsSUFBaUIsR0FBRUMsU0FBVSxJQUFHd0ksZUFBZ0IsS0FBckUsQ0FBakI7QUFDQUosVUFBQUEsaUJBQWlCLEdBQUksY0FBYUUsY0FBZSxhQUFZLEtBQUtuRSxNQUFMLENBQVl6RSxPQUFPLENBQUNzRSxZQUFwQixDQUFrQyxTQUFRbUQsU0FBUyxDQUFDLENBQUQsQ0FBSSxFQUFwSDtBQUNBOztBQUNGLGFBQUssYUFBTDtBQUNFbUIsVUFBQUEsY0FBYyxHQUFHLEtBQUt0RixlQUFMLENBQXFCdEQsT0FBTyxDQUFDSyxJQUFSLElBQWlCLEdBQUVDLFNBQVUsSUFBR3dJLGVBQWdCLEtBQXJFLENBQWpCO0FBQ0FKLFVBQUFBLGlCQUFpQixHQUFJLGNBQWFFLGNBQWUsaUJBQWdCQyxxQkFBc0IsR0FBdkY7QUFDQTs7QUFDRixhQUFLLGFBQUw7QUFDRSxnQkFBTUksVUFBVSxHQUFHakosT0FBTyxDQUFDaUosVUFBM0I7O0FBQ0EsY0FBSSxDQUFDQSxVQUFELElBQWUsQ0FBQ0EsVUFBVSxDQUFDcEksS0FBM0IsSUFBb0MsQ0FBQ29JLFVBQVUsQ0FBQ3hHLEtBQXBELEVBQTJEO0FBQ3pELGtCQUFNLElBQUl2QyxLQUFKLENBQVUsMERBQVYsQ0FBTjtBQUNEOztBQUNEMEksVUFBQUEsY0FBYyxHQUFHLEtBQUt0RixlQUFMLENBQXFCdEQsT0FBTyxDQUFDSyxJQUFSLElBQWlCLEdBQUVDLFNBQVUsSUFBR3dJLGVBQWdCLElBQUdHLFVBQVUsQ0FBQ3BJLEtBQU0sS0FBekYsQ0FBakI7QUFDQSxnQkFBTXFJLGlCQUFpQixHQUFJLEdBQUUsS0FBS2xJLFVBQUwsQ0FBZ0JpSSxVQUFVLENBQUNwSSxLQUEzQixDQUFrQyxLQUFJLEtBQUt5QyxlQUFMLENBQXFCMkYsVUFBVSxDQUFDeEcsS0FBaEMsQ0FBdUMsR0FBMUc7QUFDQWlHLFVBQUFBLGlCQUFpQixHQUFJLGNBQWFFLGNBQWUsR0FBakQ7QUFDQUYsVUFBQUEsaUJBQWlCLElBQUssZ0JBQWVHLHFCQUFzQixnQkFBZUssaUJBQWtCLEVBQTVGOztBQUNBLGNBQUlsSixPQUFPLENBQUNtSixRQUFaLEVBQXNCO0FBQ3BCVCxZQUFBQSxpQkFBaUIsSUFBSyxjQUFhMUksT0FBTyxDQUFDbUosUUFBUixDQUFpQkosV0FBakIsRUFBK0IsRUFBbEU7QUFDRDs7QUFDRCxjQUFJL0ksT0FBTyxDQUFDb0osUUFBWixFQUFzQjtBQUNwQlYsWUFBQUEsaUJBQWlCLElBQUssY0FBYTFJLE9BQU8sQ0FBQ29KLFFBQVIsQ0FBaUJMLFdBQWpCLEVBQStCLEVBQWxFO0FBQ0Q7O0FBQ0Q7O0FBQ0Y7QUFBUyxnQkFBTSxJQUFJN0ksS0FBSixDQUFXLEdBQUVGLE9BQU8sQ0FBQ21ELElBQUssY0FBMUIsQ0FBTjtBQTFDWDs7QUE0Q0EsYUFBT3VGLGlCQUFQO0FBQ0Q7OzswQ0FFcUJwSSxTLEVBQVdzSSxjLEVBQWdCO0FBQy9DLFVBQUksT0FBT3RJLFNBQVAsS0FBcUIsUUFBekIsRUFBbUM7QUFDakNBLFFBQUFBLFNBQVMsR0FBRyxLQUFLMkgsZ0JBQUwsQ0FBc0IzSCxTQUF0QixDQUFaO0FBQ0QsT0FGRCxNQUVPO0FBQ0xBLFFBQUFBLFNBQVMsR0FBRyxLQUFLVSxVQUFMLENBQWdCVixTQUFoQixDQUFaO0FBQ0Q7O0FBRUQsYUFBUSxlQUFjQSxTQUFVLG9CQUFtQixLQUFLMkgsZ0JBQUwsQ0FBc0JXLGNBQXRCLENBQXNDLEVBQXpGO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OzswQkFFUVMsVSxFQUFZQyxNLEVBQVFDLFMsRUFBVztBQUNuQztBQUNBLFlBQU1DLGlCQUFpQixHQUFHLENBQ3hCLEtBRHdCLEVBRXhCLE1BRndCLEVBR3hCLGdCQUh3QixFQUl4QixpQkFKd0IsRUFLeEIsaUJBTHdCLEVBTXhCLGtCQU53QixFQU94QixhQVB3QixFQVF4QixZQVJ3QixDQUExQixDQUZtQyxDQWFuQzs7QUFDQUQsTUFBQUEsU0FBUyxHQUFHQSxTQUFTLElBQUksR0FBekIsQ0FkbUMsQ0FnQm5DOztBQUNBLFVBQUksT0FBT0YsVUFBUCxLQUFzQixRQUExQixFQUFvQztBQUNsQyxlQUFPLEtBQUtwQixnQkFBTCxDQUFzQm9CLFVBQXRCLENBQVA7QUFDRDs7QUFDRCxVQUFJM0MsS0FBSyxDQUFDQyxPQUFOLENBQWMwQyxVQUFkLENBQUosRUFBK0I7QUFDN0I7QUFDQUEsUUFBQUEsVUFBVSxDQUFDSSxPQUFYLENBQW1CLENBQUNDLElBQUQsRUFBTzlCLEtBQVAsS0FBaUI7QUFDbEMsZ0JBQU0rQixRQUFRLEdBQUdOLFVBQVUsQ0FBQ3pCLEtBQUssR0FBRyxDQUFULENBQTNCO0FBQ0EsY0FBSWdDLG1CQUFKO0FBQ0EsY0FBSUMsYUFBSixDQUhrQyxDQUtsQzs7QUFDQSxjQUFJLENBQUNGLFFBQUQsSUFBYUwsTUFBTSxLQUFLdkgsU0FBNUIsRUFBdUM7QUFDckM4SCxZQUFBQSxhQUFhLEdBQUdQLE1BQWhCO0FBQ0QsV0FGRCxNQUVPLElBQUlLLFFBQVEsSUFBSUEsUUFBUSxZQUFZcEssV0FBcEMsRUFBaUQ7QUFDdERxSyxZQUFBQSxtQkFBbUIsR0FBR0QsUUFBdEI7QUFDQUUsWUFBQUEsYUFBYSxHQUFHRixRQUFRLENBQUNHLE1BQXpCO0FBQ0QsV0FYaUMsQ0FhbEM7OztBQUNBLGNBQUlELGFBQWEsSUFBSUEsYUFBYSxDQUFDN0YsU0FBZCxZQUFtQzFFLEtBQXhELEVBQStEO0FBQzdELGdCQUFJeUssS0FBSjtBQUNBLGdCQUFJQyxFQUFKOztBQUVBLGdCQUFJLE9BQU9OLElBQVAsS0FBZ0IsVUFBaEIsSUFBOEJBLElBQUksQ0FBQzFGLFNBQUwsWUFBMEIxRSxLQUE1RCxFQUFtRTtBQUNqRTtBQUNBeUssY0FBQUEsS0FBSyxHQUFHTCxJQUFSO0FBQ0QsYUFIRCxNQUdPLElBQUkzSyxDQUFDLENBQUN5QixhQUFGLENBQWdCa0osSUFBaEIsS0FBeUJBLElBQUksQ0FBQ0ssS0FBOUIsSUFBdUNMLElBQUksQ0FBQ0ssS0FBTCxDQUFXL0YsU0FBWCxZQUFnQzFFLEtBQTNFLEVBQWtGO0FBQ3ZGO0FBQ0F5SyxjQUFBQSxLQUFLLEdBQUdMLElBQUksQ0FBQ0ssS0FBYjtBQUNBQyxjQUFBQSxFQUFFLEdBQUdOLElBQUksQ0FBQ00sRUFBVjtBQUNEOztBQUVELGdCQUFJRCxLQUFKLEVBQVc7QUFDVDtBQUNBLGtCQUFJLENBQUNDLEVBQUQsSUFBT0osbUJBQVAsSUFBOEJBLG1CQUFtQixZQUFZckssV0FBN0QsSUFBNEVxSyxtQkFBbUIsQ0FBQ0ssT0FBaEcsSUFBMkdMLG1CQUFtQixDQUFDSyxPQUFwQixDQUE0QkYsS0FBNUIsS0FBc0NBLEtBQXJKLEVBQTRKO0FBQzFKO0FBQ0FMLGdCQUFBQSxJQUFJLEdBQUcsSUFBSW5LLFdBQUosQ0FBZ0JzSyxhQUFoQixFQUErQkUsS0FBL0IsRUFBc0M7QUFDM0NDLGtCQUFBQSxFQUFFLEVBQUVELEtBQUssQ0FBQzFKO0FBRGlDLGlCQUF0QyxDQUFQO0FBR0QsZUFMRCxNQUtPO0FBQ0w7QUFDQXFKLGdCQUFBQSxJQUFJLEdBQUdHLGFBQWEsQ0FBQ0ssc0JBQWQsQ0FBcUNILEtBQXJDLEVBQTRDQyxFQUE1QyxDQUFQLENBRkssQ0FJTDs7QUFDQSxvQkFBSSxDQUFDTixJQUFMLEVBQVc7QUFDVEEsa0JBQUFBLElBQUksR0FBR0csYUFBYSxDQUFDSyxzQkFBZCxDQUFxQ0gsS0FBckMsRUFBNENBLEtBQUssQ0FBQzFKLElBQWxELENBQVA7QUFDRDtBQUNGLGVBZlEsQ0FpQlQ7OztBQUNBLGtCQUFJLEVBQUVxSixJQUFJLFlBQVluSyxXQUFsQixDQUFKLEVBQW9DO0FBQ2xDLHNCQUFNLElBQUlXLEtBQUosQ0FBVXJCLElBQUksQ0FBQytGLE1BQUwsQ0FBWSxzREFBWixFQUFvRW1GLEtBQUssQ0FBQzFKLElBQTFFLENBQVYsQ0FBTjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxjQUFJLE9BQU9xSixJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCO0FBQ0Esa0JBQU1TLFVBQVUsR0FBR1gsaUJBQWlCLENBQUNZLE9BQWxCLENBQTBCVixJQUFJLENBQUNYLFdBQUwsRUFBMUIsQ0FBbkIsQ0FGNEIsQ0FJNUI7O0FBQ0EsZ0JBQUluQixLQUFLLEdBQUcsQ0FBUixJQUFhdUMsVUFBVSxLQUFLLENBQUMsQ0FBakMsRUFBb0M7QUFDbENULGNBQUFBLElBQUksR0FBRyxLQUFLekosU0FBTCxDQUFlb0ssT0FBZixDQUF3QixJQUFHYixpQkFBaUIsQ0FBQ1csVUFBRCxDQUFhLEVBQXpELENBQVA7QUFDRCxhQUZELE1BRU8sSUFBSU4sYUFBYSxJQUFJQSxhQUFhLENBQUM3RixTQUFkLFlBQW1DMUUsS0FBeEQsRUFBK0Q7QUFDcEU7QUFDQSxrQkFBSXVLLGFBQWEsQ0FBQ1MsWUFBZCxLQUErQnZJLFNBQS9CLElBQTRDOEgsYUFBYSxDQUFDUyxZQUFkLENBQTJCWixJQUEzQixDQUFoRCxFQUFrRjtBQUNoRjtBQUNBQSxnQkFBQUEsSUFBSSxHQUFHRyxhQUFhLENBQUNTLFlBQWQsQ0FBMkJaLElBQTNCLENBQVA7QUFDRCxlQUhELE1BR08sSUFBSUcsYUFBYSxDQUFDVSxhQUFkLEtBQWdDeEksU0FBaEMsSUFBNkM4SCxhQUFhLENBQUNVLGFBQWQsQ0FBNEJiLElBQTVCLENBQTdDLElBQWtGQSxJQUFJLEtBQUtHLGFBQWEsQ0FBQ1UsYUFBZCxDQUE0QmIsSUFBNUIsRUFBa0NqSCxLQUFqSSxFQUF3STtBQUM3STtBQUNBaUgsZ0JBQUFBLElBQUksR0FBR0csYUFBYSxDQUFDVSxhQUFkLENBQTRCYixJQUE1QixFQUFrQ2pILEtBQXpDO0FBQ0QsZUFITSxNQUdBLElBQ0xpSCxJQUFJLENBQUN6RCxRQUFMLENBQWMsR0FBZCxLQUNHNEQsYUFBYSxDQUFDVSxhQUFkLEtBQWdDeEksU0FGOUIsRUFHTDtBQUNBLHNCQUFNeUksU0FBUyxHQUFHZCxJQUFJLENBQUNlLEtBQUwsQ0FBVyxHQUFYLENBQWxCOztBQUVBLG9CQUFJWixhQUFhLENBQUNVLGFBQWQsQ0FBNEJDLFNBQVMsQ0FBQyxDQUFELENBQXJDLEVBQTBDckgsSUFBMUMsWUFBMEQ5RCxTQUFTLENBQUNxTCxJQUF4RSxFQUE4RTtBQUM1RTtBQUNBLHdCQUFNQyxVQUFVLEdBQUcsS0FBSzFDLGdCQUFMLENBQXVCLEdBQUU0QixhQUFhLENBQUN4SixJQUFLLElBQUd3SixhQUFhLENBQUNVLGFBQWQsQ0FBNEJDLFNBQVMsQ0FBQyxDQUFELENBQXJDLEVBQTBDL0gsS0FBTSxFQUEvRixDQUFuQixDQUY0RSxDQUk1RTs7QUFDQSx3QkFBTW1JLElBQUksR0FBR0osU0FBUyxDQUFDSyxLQUFWLENBQWdCLENBQWhCLENBQWIsQ0FMNEUsQ0FPNUU7O0FBQ0FuQixrQkFBQUEsSUFBSSxHQUFHLEtBQUtvQix1QkFBTCxDQUE2QkgsVUFBN0IsRUFBeUNDLElBQXpDLENBQVAsQ0FSNEUsQ0FVNUU7O0FBQ0FsQixrQkFBQUEsSUFBSSxHQUFHLEtBQUt6SixTQUFMLENBQWVvSyxPQUFmLENBQXVCWCxJQUF2QixDQUFQO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Y7O0FBRURMLFVBQUFBLFVBQVUsQ0FBQ3pCLEtBQUQsQ0FBVixHQUFvQjhCLElBQXBCO0FBQ0QsU0ExRkQsRUEwRkcsSUExRkgsRUFGNkIsQ0E4RjdCOztBQUNBLGNBQU1xQixnQkFBZ0IsR0FBRzFCLFVBQVUsQ0FBQ2hHLE1BQXBDO0FBQ0EsY0FBTTJILFVBQVUsR0FBRyxFQUFuQjtBQUNBLFlBQUl0QixJQUFKO0FBQ0EsWUFBSXVCLENBQUMsR0FBRyxDQUFSOztBQUVBLGFBQUtBLENBQUMsR0FBRyxDQUFULEVBQVlBLENBQUMsR0FBR0YsZ0JBQWdCLEdBQUcsQ0FBbkMsRUFBc0NFLENBQUMsRUFBdkMsRUFBMkM7QUFDekN2QixVQUFBQSxJQUFJLEdBQUdMLFVBQVUsQ0FBQzRCLENBQUQsQ0FBakI7O0FBQ0EsY0FBSSxPQUFPdkIsSUFBUCxLQUFnQixRQUFoQixJQUE0QkEsSUFBSSxDQUFDd0IsZUFBakMsSUFBb0R4QixJQUFJLFlBQVl4SyxLQUFLLENBQUN3RixlQUE5RSxFQUErRjtBQUM3RjtBQUNELFdBRkQsTUFFTyxJQUFJZ0YsSUFBSSxZQUFZbkssV0FBcEIsRUFBaUM7QUFDdEN5TCxZQUFBQSxVQUFVLENBQUNDLENBQUQsQ0FBVixHQUFnQnZCLElBQUksQ0FBQ00sRUFBckI7QUFDRDtBQUNGLFNBM0c0QixDQTZHN0I7OztBQUNBLFlBQUltQixHQUFHLEdBQUcsRUFBVjs7QUFFQSxZQUFJRixDQUFDLEdBQUcsQ0FBUixFQUFXO0FBQ1RFLFVBQUFBLEdBQUcsSUFBSyxHQUFFLEtBQUs3SCxlQUFMLENBQXFCMEgsVUFBVSxDQUFDOUYsSUFBWCxDQUFnQnFFLFNBQWhCLENBQXJCLENBQWlELEdBQTNEO0FBQ0QsU0FGRCxNQUVPLElBQUksT0FBT0YsVUFBVSxDQUFDLENBQUQsQ0FBakIsS0FBeUIsUUFBekIsSUFBcUNDLE1BQXpDLEVBQWlEO0FBQ3RENkIsVUFBQUEsR0FBRyxJQUFLLEdBQUUsS0FBSzdILGVBQUwsQ0FBcUJnRyxNQUFNLENBQUNqSixJQUE1QixDQUFrQyxHQUE1QztBQUNELFNBcEg0QixDQXNIN0I7OztBQUNBZ0osUUFBQUEsVUFBVSxDQUFDd0IsS0FBWCxDQUFpQkksQ0FBakIsRUFBb0J4QixPQUFwQixDQUE0QjJCLGNBQWMsSUFBSTtBQUM1Q0QsVUFBQUEsR0FBRyxJQUFJLEtBQUtFLEtBQUwsQ0FBV0QsY0FBWCxFQUEyQjlCLE1BQTNCLEVBQW1DQyxTQUFuQyxDQUFQO0FBQ0QsU0FGRCxFQUVHLElBRkg7QUFJQSxlQUFPNEIsR0FBUDtBQUNEOztBQUNELFVBQUk5QixVQUFVLENBQUM2QixlQUFmLEVBQWdDO0FBQzlCLGVBQVEsR0FBRSxLQUFLbEssVUFBTCxDQUFnQnFJLFVBQVUsQ0FBQy9KLEtBQVgsQ0FBaUJlLElBQWpDLENBQXVDLElBQUcsS0FBS2lELGVBQUwsQ0FBcUIrRixVQUFVLENBQUNpQyxTQUFoQyxDQUEyQyxFQUEvRjtBQUNEOztBQUNELFVBQUlqQyxVQUFVLFlBQVluSyxLQUFLLENBQUN3RixlQUFoQyxFQUFpRDtBQUMvQyxlQUFPLEtBQUtnRCxxQkFBTCxDQUEyQjJCLFVBQTNCLENBQVA7QUFDRDs7QUFDRCxVQUFJdEssQ0FBQyxDQUFDeUIsYUFBRixDQUFnQjZJLFVBQWhCLEtBQStCQSxVQUFVLENBQUNrQyxHQUE5QyxFQUFtRDtBQUNqRDtBQUNBLGNBQU0sSUFBSXJMLEtBQUosQ0FBVSxxRkFBVixDQUFOO0FBQ0Q7O0FBQ0QsWUFBTSxJQUFJQSxLQUFKLENBQVcsOENBQTZDckIsSUFBSSxDQUFDOEksT0FBTCxDQUFhMEIsVUFBYixDQUF5QixFQUFqRixDQUFOO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O29DQUNrQnNCLFUsRUFBWWEsSyxFQUFPO0FBQ2pDLGFBQU8xTCxXQUFXLENBQUN3RCxlQUFaLENBQTRCLEtBQUtsRCxPQUFqQyxFQUEwQ3VLLFVBQTFDLEVBQXNEO0FBQzNEYSxRQUFBQSxLQUQyRDtBQUUzRHZELFFBQUFBLGdCQUFnQixFQUFFLEtBQUtqSSxPQUFMLENBQWFpSTtBQUY0QixPQUF0RCxDQUFQO0FBSUQ7OztxQ0FFZ0J3RCxXLEVBQWE7QUFDNUIsVUFBSUEsV0FBVyxDQUFDeEYsUUFBWixDQUFxQixHQUFyQixDQUFKLEVBQStCO0FBQzdCd0YsUUFBQUEsV0FBVyxHQUFHQSxXQUFXLENBQUNoQixLQUFaLENBQWtCLEdBQWxCLENBQWQ7QUFFQSxjQUFNaUIsSUFBSSxHQUFHRCxXQUFXLENBQUNaLEtBQVosQ0FBa0IsQ0FBbEIsRUFBcUJZLFdBQVcsQ0FBQ3BJLE1BQVosR0FBcUIsQ0FBMUMsRUFBNkM2QixJQUE3QyxDQUFrRCxJQUFsRCxDQUFiO0FBQ0EsY0FBTXlHLElBQUksR0FBR0YsV0FBVyxDQUFDQSxXQUFXLENBQUNwSSxNQUFaLEdBQXFCLENBQXRCLENBQXhCO0FBRUEsZUFBUSxHQUFFLEtBQUtDLGVBQUwsQ0FBcUJvSSxJQUFyQixDQUEyQixJQUFHLEtBQUtwSSxlQUFMLENBQXFCcUksSUFBckIsQ0FBMkIsRUFBbkU7QUFDRDs7QUFFRCxhQUFPLEtBQUtySSxlQUFMLENBQXFCbUksV0FBckIsQ0FBUDtBQUNEOzs7bUNBRWNsSixTLEVBQVd3SCxLLEVBQU87QUFDL0IsVUFBSUEsS0FBSyxJQUFJeEgsU0FBUyxJQUFJd0gsS0FBSyxDQUFDUSxhQUFoQyxFQUErQztBQUM3QyxlQUFPLEtBQUtqSCxlQUFMLENBQXFCZixTQUFyQixDQUFQO0FBQ0Q7O0FBQ0QsYUFBTyxLQUFLMEYsZ0JBQUwsQ0FBc0IxRixTQUF0QixDQUFQO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OytCQUNhN0IsSyxFQUFPa0wsSyxFQUFPO0FBQ3ZCLFVBQUkvSyxLQUFLLEdBQUcsRUFBWjs7QUFFQSxVQUFJK0ssS0FBSyxLQUFLLElBQWQsRUFBb0I7QUFDbEJBLFFBQUFBLEtBQUssR0FBR2xMLEtBQUssQ0FBQ3NKLEVBQU4sSUFBWXRKLEtBQUssQ0FBQ0wsSUFBbEIsSUFBMEJLLEtBQWxDO0FBQ0Q7O0FBRUQsVUFBSTNCLENBQUMsQ0FBQzhNLFFBQUYsQ0FBV25MLEtBQVgsQ0FBSixFQUF1QjtBQUNyQixZQUFJLEtBQUtQLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJvSixPQUEzQixFQUFvQztBQUNsQyxjQUFJcEwsS0FBSyxDQUFDSCxNQUFWLEVBQWtCO0FBQ2hCTSxZQUFBQSxLQUFLLElBQUssR0FBRSxLQUFLeUMsZUFBTCxDQUFxQjVDLEtBQUssQ0FBQ0gsTUFBM0IsQ0FBbUMsR0FBL0M7QUFDRDs7QUFFRE0sVUFBQUEsS0FBSyxJQUFJLEtBQUt5QyxlQUFMLENBQXFCNUMsS0FBSyxDQUFDSixTQUEzQixDQUFUO0FBQ0QsU0FORCxNQU1PO0FBQ0wsY0FBSUksS0FBSyxDQUFDSCxNQUFWLEVBQWtCO0FBQ2hCTSxZQUFBQSxLQUFLLElBQUlILEtBQUssQ0FBQ0gsTUFBTixJQUFnQkcsS0FBSyxDQUFDRCxTQUFOLElBQW1CLEdBQW5DLENBQVQ7QUFDRDs7QUFFREksVUFBQUEsS0FBSyxJQUFJSCxLQUFLLENBQUNKLFNBQWY7QUFDQU8sVUFBQUEsS0FBSyxHQUFHLEtBQUt5QyxlQUFMLENBQXFCekMsS0FBckIsQ0FBUjtBQUNEO0FBQ0YsT0FmRCxNQWVPO0FBQ0xBLFFBQUFBLEtBQUssR0FBRyxLQUFLeUMsZUFBTCxDQUFxQjVDLEtBQXJCLENBQVI7QUFDRDs7QUFFRCxVQUFJa0wsS0FBSixFQUFXO0FBQ1QvSyxRQUFBQSxLQUFLLElBQUssT0FBTSxLQUFLeUMsZUFBTCxDQUFxQnNJLEtBQXJCLENBQTRCLEVBQTVDO0FBQ0Q7O0FBRUQsYUFBTy9LLEtBQVA7QUFDRDtBQUVEO0FBQ0Y7QUFDQTtBQUNBOzs7OzJCQUNTc0QsSyxFQUFPMUIsSyxFQUFPekMsTyxFQUFTO0FBQzVCQSxNQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjs7QUFFQSxVQUFJbUUsS0FBSyxLQUFLLElBQVYsSUFBa0JBLEtBQUssS0FBS3BDLFNBQWhDLEVBQTJDO0FBQ3pDLFlBQUlvQyxLQUFLLFlBQVlqRixLQUFLLENBQUN3RixlQUEzQixFQUE0QztBQUMxQyxpQkFBTyxLQUFLZ0QscUJBQUwsQ0FBMkJ2RCxLQUEzQixDQUFQO0FBQ0Q7O0FBQ0QsWUFBSTFCLEtBQUssSUFBSUEsS0FBSyxDQUFDVSxJQUFuQixFQUF5QjtBQUN2QixlQUFLNEksUUFBTCxDQUFjNUgsS0FBZCxFQUFxQjFCLEtBQXJCLEVBQTRCekMsT0FBNUI7O0FBRUEsY0FBSXlDLEtBQUssQ0FBQ1UsSUFBTixDQUFXNkksU0FBZixFQUEwQjtBQUN4QjtBQUNBLGtCQUFNQyxZQUFZLEdBQUdDLE1BQU0sSUFBSTlNLFNBQVMsQ0FBQ3FGLE1BQVYsQ0FBaUJ5SCxNQUFqQixFQUF5QixLQUFLbE0sT0FBTCxDQUFhbU0sUUFBdEMsRUFBZ0QsS0FBSy9MLE9BQXJELENBQS9COztBQUVBK0QsWUFBQUEsS0FBSyxHQUFHMUIsS0FBSyxDQUFDVSxJQUFOLENBQVc2SSxTQUFYLENBQXFCN0gsS0FBckIsRUFBNEI7QUFBRU0sY0FBQUEsTUFBTSxFQUFFd0gsWUFBVjtBQUF3QnhKLGNBQUFBLEtBQXhCO0FBQStCMEosY0FBQUEsUUFBUSxFQUFFLEtBQUtuTSxPQUFMLENBQWFtTSxRQUF0RDtBQUFnRUMsY0FBQUEsU0FBUyxFQUFFcE0sT0FBTyxDQUFDb007QUFBbkYsYUFBNUIsQ0FBUjs7QUFFQSxnQkFBSTNKLEtBQUssQ0FBQ1UsSUFBTixDQUFXc0IsTUFBWCxLQUFzQixLQUExQixFQUFpQztBQUMvQjtBQUNBLHFCQUFPTixLQUFQO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Y7O0FBRUQsYUFBTy9FLFNBQVMsQ0FBQ3FGLE1BQVYsQ0FBaUJOLEtBQWpCLEVBQXdCLEtBQUtuRSxPQUFMLENBQWFtTSxRQUFyQyxFQUErQyxLQUFLL0wsT0FBcEQsQ0FBUDtBQUNEOzs7OEJBRVN3QixJLEVBQU07QUFDZCxhQUFPdUMsS0FBSyxJQUFJO0FBQ2R2QyxRQUFBQSxJQUFJLENBQUN3QyxJQUFMLENBQVVELEtBQVY7QUFDQSxlQUFRLElBQUd2QyxJQUFJLENBQUN5QixNQUFPLEVBQXZCO0FBQ0QsT0FIRDtBQUlEO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7Ozs7MkJBQ1NjLEssRUFBTzFCLEssRUFBT3pDLE8sRUFBUzhCLFMsRUFBVztBQUN2QzlCLE1BQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCOztBQUVBLFVBQUltRSxLQUFLLEtBQUssSUFBVixJQUFrQkEsS0FBSyxLQUFLcEMsU0FBaEMsRUFBMkM7QUFDekMsWUFBSW9DLEtBQUssWUFBWWpGLEtBQUssQ0FBQ3dGLGVBQTNCLEVBQTRDO0FBQzFDLGdCQUFNLElBQUl4RSxLQUFKLENBQVUsc0VBQVYsQ0FBTjtBQUNEOztBQUNELFlBQUl1QyxLQUFLLElBQUlBLEtBQUssQ0FBQ1UsSUFBbkIsRUFBeUI7QUFDdkIsZUFBSzRJLFFBQUwsQ0FBYzVILEtBQWQsRUFBcUIxQixLQUFyQixFQUE0QnpDLE9BQTVCOztBQUVBLGNBQUl5QyxLQUFLLENBQUNVLElBQU4sQ0FBV3JCLFNBQWYsRUFBMEI7QUFDeEIsbUJBQU9XLEtBQUssQ0FBQ1UsSUFBTixDQUFXckIsU0FBWCxDQUFxQnFDLEtBQXJCLEVBQTRCO0FBQUVNLGNBQUFBLE1BQU0sRUFBRTFGLENBQUMsQ0FBQ3NOLFFBQVo7QUFBc0I1SixjQUFBQSxLQUF0QjtBQUE2QjBKLGNBQUFBLFFBQVEsRUFBRSxLQUFLbk0sT0FBTCxDQUFhbU0sUUFBcEQ7QUFBOERDLGNBQUFBLFNBQVMsRUFBRXBNLE9BQU8sQ0FBQ29NLFNBQWpGO0FBQTRGdEssY0FBQUE7QUFBNUYsYUFBNUIsQ0FBUDtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxhQUFPQSxTQUFTLENBQUNxQyxLQUFELENBQWhCO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTs7Ozs2QkFDV0EsSyxFQUFPMUIsSyxFQUFPekMsTyxFQUFTO0FBQzlCLFVBQUksS0FBS3NNLGNBQUwsSUFBdUI3SixLQUFLLENBQUNVLElBQU4sQ0FBVzRJLFFBQWxDLElBQThDNUgsS0FBbEQsRUFBeUQ7QUFDdkQsWUFBSTtBQUNGLGNBQUluRSxPQUFPLENBQUN1TSxNQUFSLElBQWtCN0YsS0FBSyxDQUFDQyxPQUFOLENBQWN4QyxLQUFkLENBQXRCLEVBQTRDO0FBQzFDLGlCQUFLLE1BQU11RixJQUFYLElBQW1CdkYsS0FBbkIsRUFBMEI7QUFDeEIxQixjQUFBQSxLQUFLLENBQUNVLElBQU4sQ0FBVzRJLFFBQVgsQ0FBb0JyQyxJQUFwQixFQUEwQjFKLE9BQTFCO0FBQ0Q7QUFDRixXQUpELE1BSU87QUFDTHlDLFlBQUFBLEtBQUssQ0FBQ1UsSUFBTixDQUFXNEksUUFBWCxDQUFvQjVILEtBQXBCLEVBQTJCbkUsT0FBM0I7QUFDRDtBQUNGLFNBUkQsQ0FRRSxPQUFPd00sS0FBUCxFQUFjO0FBQ2QsY0FBSUEsS0FBSyxZQUFZNU0sY0FBYyxDQUFDNk0sZUFBcEMsRUFBcUQ7QUFDbkRELFlBQUFBLEtBQUssQ0FBQ0UsTUFBTixDQUFhdEksSUFBYixDQUFrQixJQUFJeEUsY0FBYyxDQUFDK00sbUJBQW5CLENBQ2hCSCxLQUFLLENBQUNJLE9BRFUsRUFFaEIsa0JBRmdCLEVBR2hCbkssS0FBSyxDQUFDNkksU0FIVSxFQUloQm5ILEtBSmdCLEVBS2hCLElBTGdCLEVBTWYsR0FBRTFCLEtBQUssQ0FBQ1UsSUFBTixDQUFXWCxHQUFJLFlBTkYsQ0FBbEI7QUFRRDs7QUFFRCxnQkFBTWdLLEtBQU47QUFDRDtBQUNGO0FBQ0Y7Ozt1Q0FFa0I3QixVLEVBQVk7QUFDN0IsYUFBTzdLLFdBQVcsQ0FBQytNLGtCQUFaLENBQStCbEMsVUFBL0IsQ0FBUDtBQUNEO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs0Q0FDMEJtQyxNLEVBQVFsQyxJLEVBQU07QUFDcEMsVUFBSW1DLEtBQUssR0FBR2hPLENBQUMsQ0FBQ2lPLE1BQUYsQ0FBU3BDLElBQVQsQ0FBWjs7QUFDQSxVQUFJcUMsT0FBSjtBQUNBLFlBQU1DLFlBQVksR0FBRyxLQUFLTCxrQkFBTCxDQUF3QkMsTUFBeEIsSUFDakJBLE1BRGlCLEdBRWpCLEtBQUt4SixlQUFMLENBQXFCd0osTUFBckIsQ0FGSjs7QUFJQSxjQUFRLEtBQUsxTSxPQUFiO0FBQ0UsYUFBSyxPQUFMO0FBQ0EsYUFBSyxTQUFMO0FBQ0EsYUFBSyxRQUFMO0FBQ0U7QUFDUjtBQUNBO0FBQ0E7QUFDUSxjQUFJLEtBQUtBLE9BQUwsS0FBaUIsT0FBckIsRUFBOEI7QUFDNUIyTSxZQUFBQSxLQUFLLEdBQUdBLEtBQUssQ0FBQzdHLEdBQU4sQ0FBVWlILE9BQU8sSUFBSTtBQUMzQixxQkFBTyxLQUFLQyxJQUFMLENBQVVELE9BQVYsSUFDSGpPLEtBQUssQ0FBQ21PLFFBQU4sQ0FBZUYsT0FBZixFQUF3QixHQUF4QixDQURHLEdBRUhBLE9BRko7QUFHRCxhQUpPLENBQVI7QUFLRDs7QUFFREYsVUFBQUEsT0FBTyxHQUFHLEtBQUt4SSxNQUFMLENBQVksQ0FBQyxHQUFELEVBQ25CNEQsTUFEbUIsQ0FDWjBFLEtBRFksRUFFbkI3SCxJQUZtQixDQUVkLEdBRmMsRUFHbkJHLE9BSG1CLENBR1gsc0JBSFcsRUFHYSxDQUFDaUksRUFBRCxFQUFLQyxLQUFMLEtBQWdCLElBQUdBLEtBQU0sR0FIdEMsQ0FBWixDQUFWOztBQUtBLGNBQUksS0FBS25OLE9BQUwsS0FBaUIsUUFBckIsRUFBK0I7QUFDN0IsbUJBQVEsZ0JBQWU4TSxZQUFhLElBQUdELE9BQVEsR0FBL0M7QUFDRDs7QUFFRCxpQkFBUSw2QkFBNEJDLFlBQWEsSUFBR0QsT0FBUSxJQUE1RDs7QUFFRixhQUFLLFVBQUw7QUFDRUEsVUFBQUEsT0FBTyxHQUFHLEtBQUt4SSxNQUFMLENBQWEsSUFBR3NJLEtBQUssQ0FBQzdILElBQU4sQ0FBVyxHQUFYLENBQWdCLEdBQWhDLENBQVY7QUFDQSxpQkFBUSxJQUFHZ0ksWUFBYSxNQUFLRCxPQUFRLEdBQXJDOztBQUVGO0FBQ0UsZ0JBQU0sSUFBSS9NLEtBQUosQ0FBVyxlQUFjLEtBQUtFLE9BQVEsc0JBQXRDLENBQU47QUFoQ0o7QUFrQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Z0NBQ2NFLFMsRUFBV04sTyxFQUFTK0osSyxFQUFPO0FBQ3JDL0osTUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7QUFDQSxZQUFNK0csS0FBSyxHQUFHL0csT0FBTyxDQUFDK0csS0FBdEI7QUFDQSxZQUFNeUcsY0FBYyxHQUFHLEVBQXZCO0FBQ0EsWUFBTUMsYUFBYSxHQUFHLEVBQXRCO0FBQ0EsWUFBTUMsUUFBUSxHQUFHMU4sT0FBTyxDQUFDME4sUUFBUixLQUFxQjNMLFNBQXJCLEdBQWlDZ0YsS0FBSyxJQUFJL0csT0FBTyxDQUFDMk4sbUJBQWxELEdBQXdFM04sT0FBTyxDQUFDME4sUUFBakc7QUFDQSxZQUFNekksVUFBVSxHQUFHO0FBQ2pCMkksUUFBQUEsSUFBSSxFQUFFNU4sT0FBTyxDQUFDaUYsVUFBUixJQUFzQmpGLE9BQU8sQ0FBQ2lGLFVBQVIsQ0FBbUI0RixLQUFuQixFQURYO0FBRWpCNkMsUUFBQUEsUUFBUSxFQUFFO0FBRk8sT0FBbkI7QUFJQSxZQUFNRyxTQUFTLEdBQUc7QUFDaEJ4TixRQUFBQSxJQUFJLEVBQUVDLFNBRFU7QUFFaEJ3TixRQUFBQSxVQUFVLEVBQUUsSUFGSTtBQUdoQjlELFFBQUFBLEVBQUUsRUFBRSxJQUhZO0FBSWhCRCxRQUFBQTtBQUpnQixPQUFsQjtBQU1BLFlBQU1nRSxZQUFZLEdBQUc7QUFDbkJDLFFBQUFBLEtBQUssRUFBRUgsU0FEWTtBQUVuQjdOLFFBQUFBLE9BRm1CO0FBR25CME4sUUFBQUE7QUFIbUIsT0FBckI7QUFLQSxVQUFJTyxlQUFlLEdBQUcsRUFBdEI7QUFDQSxVQUFJQyxjQUFjLEdBQUcsRUFBckI7QUFDQSxVQUFJbE0sS0FBSixDQXZCcUMsQ0F5QnJDOztBQUNBLFVBQUksS0FBS2hDLE9BQUwsQ0FBYW1PLGFBQWIsSUFBOEIsQ0FBQ25PLE9BQU8sQ0FBQ29PLGNBQTNDLEVBQTJEO0FBQ3pEcE8sUUFBQUEsT0FBTyxDQUFDb08sY0FBUixHQUF5QixJQUFJQyxHQUFKLEVBQXpCO0FBQ0FyTyxRQUFBQSxPQUFPLENBQUNzTyxjQUFSLEdBQXlCLEVBQXpCO0FBQ0QsT0E3Qm9DLENBK0JyQzs7O0FBQ0EsVUFBSXRPLE9BQU8sQ0FBQ3VPLE9BQVosRUFBcUI7QUFDbkJWLFFBQUFBLFNBQVMsQ0FBQzdELEVBQVYsR0FBZSxLQUFLMUcsZUFBTCxDQUFxQnRELE9BQU8sQ0FBQ3VPLE9BQTdCLENBQWY7QUFDRCxPQUZELE1BRU8sSUFBSSxDQUFDN0gsS0FBSyxDQUFDQyxPQUFOLENBQWNrSCxTQUFTLENBQUN4TixJQUF4QixDQUFELElBQWtDd04sU0FBUyxDQUFDOUQsS0FBaEQsRUFBdUQ7QUFDNUQ4RCxRQUFBQSxTQUFTLENBQUM3RCxFQUFWLEdBQWUsS0FBSzFHLGVBQUwsQ0FBcUJ1SyxTQUFTLENBQUM5RCxLQUFWLENBQWdCMUosSUFBckMsQ0FBZjtBQUNEOztBQUVEd04sTUFBQUEsU0FBUyxDQUFDQyxVQUFWLEdBQXVCLENBQUNwSCxLQUFLLENBQUNDLE9BQU4sQ0FBY2tILFNBQVMsQ0FBQ3hOLElBQXhCLENBQUQsR0FBaUMsS0FBS1csVUFBTCxDQUFnQjZNLFNBQVMsQ0FBQ3hOLElBQTFCLENBQWpDLEdBQW1FQyxTQUFTLENBQUM0RixHQUFWLENBQWNzSSxDQUFDLElBQUk7QUFDM0csZUFBTzlILEtBQUssQ0FBQ0MsT0FBTixDQUFjNkgsQ0FBZCxJQUFtQixLQUFLeE4sVUFBTCxDQUFnQndOLENBQUMsQ0FBQyxDQUFELENBQWpCLEVBQXNCQSxDQUFDLENBQUMsQ0FBRCxDQUF2QixDQUFuQixHQUFpRCxLQUFLeE4sVUFBTCxDQUFnQndOLENBQWhCLEVBQW1CLElBQW5CLENBQXhEO0FBQ0QsT0FGeUYsRUFFdkZ0SixJQUZ1RixDQUVsRixJQUZrRixDQUExRjs7QUFJQSxVQUFJd0ksUUFBUSxJQUFJekksVUFBVSxDQUFDMkksSUFBM0IsRUFBaUM7QUFDL0IsYUFBSyxNQUFNYSxNQUFYLElBQXFCWixTQUFTLENBQUM5RCxLQUFWLENBQWdCMkUsb0JBQXJDLEVBQTJEO0FBQ3pEO0FBQ0EsY0FBSSxDQUFDekosVUFBVSxDQUFDMkksSUFBWCxDQUFnQmUsSUFBaEIsQ0FBcUJwSSxJQUFJLElBQUlrSSxNQUFNLEtBQUtsSSxJQUFYLElBQW1Ca0ksTUFBTSxLQUFLbEksSUFBSSxDQUFDLENBQUQsQ0FBbEMsSUFBeUNrSSxNQUFNLEtBQUtsSSxJQUFJLENBQUMsQ0FBRCxDQUFyRixDQUFMLEVBQWdHO0FBQzlGdEIsWUFBQUEsVUFBVSxDQUFDMkksSUFBWCxDQUFnQnhKLElBQWhCLENBQXFCeUosU0FBUyxDQUFDOUQsS0FBVixDQUFnQlEsYUFBaEIsQ0FBOEJrRSxNQUE5QixFQUFzQ2hNLEtBQXRDLEdBQThDLENBQUNnTSxNQUFELEVBQVNaLFNBQVMsQ0FBQzlELEtBQVYsQ0FBZ0JRLGFBQWhCLENBQThCa0UsTUFBOUIsRUFBc0NoTSxLQUEvQyxDQUE5QyxHQUFzR2dNLE1BQTNIO0FBQ0Q7QUFDRjtBQUNGOztBQUVEeEosTUFBQUEsVUFBVSxDQUFDMkksSUFBWCxHQUFrQixLQUFLZ0IsZ0JBQUwsQ0FBc0IzSixVQUFVLENBQUMySSxJQUFqQyxFQUF1QzVOLE9BQXZDLEVBQWdENk4sU0FBUyxDQUFDN0QsRUFBMUQsQ0FBbEI7QUFDQS9FLE1BQUFBLFVBQVUsQ0FBQzJJLElBQVgsR0FBa0IzSSxVQUFVLENBQUMySSxJQUFYLEtBQW9CNU4sT0FBTyxDQUFDNk8sT0FBUixHQUFrQixDQUFFLEdBQUVoQixTQUFTLENBQUM3RCxFQUFHLElBQWpCLENBQWxCLEdBQTBDLENBQUMsR0FBRCxDQUE5RCxDQUFsQixDQXBEcUMsQ0FzRHJDOztBQUNBLFVBQUkwRCxRQUFRLElBQUkxTixPQUFPLENBQUM4TyxZQUF4QixFQUFzQztBQUNwQztBQUNBN0osUUFBQUEsVUFBVSxDQUFDeUksUUFBWCxHQUFzQnpJLFVBQVUsQ0FBQzJJLElBQWpDO0FBQ0EzSSxRQUFBQSxVQUFVLENBQUMySSxJQUFYLEdBQWtCLENBQUUsR0FBRUMsU0FBUyxDQUFDN0QsRUFBVixJQUFnQjZELFNBQVMsQ0FBQ0MsVUFBVyxJQUF6QyxDQUFsQjtBQUNEOztBQUVELFVBQUk5TixPQUFPLENBQUM2TyxPQUFaLEVBQXFCO0FBQ25CLGFBQUssTUFBTUEsT0FBWCxJQUFzQjdPLE9BQU8sQ0FBQzZPLE9BQTlCLEVBQXVDO0FBQ3JDLGNBQUlBLE9BQU8sQ0FBQ0UsUUFBWixFQUFzQjtBQUNwQjtBQUNEOztBQUNELGdCQUFNQyxXQUFXLEdBQUcsS0FBS0MsZUFBTCxDQUFxQkosT0FBckIsRUFBOEI7QUFBRUssWUFBQUEsVUFBVSxFQUFFckIsU0FBUyxDQUFDN0QsRUFBeEI7QUFBNEJtRixZQUFBQSxVQUFVLEVBQUV0QixTQUFTLENBQUM3RDtBQUFsRCxXQUE5QixFQUFzRitELFlBQXRGLENBQXBCO0FBRUFHLFVBQUFBLGNBQWMsR0FBR0EsY0FBYyxDQUFDN0YsTUFBZixDQUFzQjJHLFdBQVcsQ0FBQ3RCLFFBQWxDLENBQWpCO0FBQ0FPLFVBQUFBLGVBQWUsR0FBR0EsZUFBZSxDQUFDNUYsTUFBaEIsQ0FBdUIyRyxXQUFXLENBQUNJLFNBQW5DLENBQWxCOztBQUVBLGNBQUlKLFdBQVcsQ0FBQy9KLFVBQVosQ0FBdUIySSxJQUF2QixDQUE0QnZLLE1BQTVCLEdBQXFDLENBQXpDLEVBQTRDO0FBQzFDNEIsWUFBQUEsVUFBVSxDQUFDMkksSUFBWCxHQUFrQjdPLENBQUMsQ0FBQ3NRLElBQUYsQ0FBT3BLLFVBQVUsQ0FBQzJJLElBQVgsQ0FBZ0J2RixNQUFoQixDQUF1QjJHLFdBQVcsQ0FBQy9KLFVBQVosQ0FBdUIySSxJQUE5QyxDQUFQLENBQWxCO0FBQ0Q7O0FBQ0QsY0FBSW9CLFdBQVcsQ0FBQy9KLFVBQVosQ0FBdUJ5SSxRQUF2QixDQUFnQ3JLLE1BQWhDLEdBQXlDLENBQTdDLEVBQWdEO0FBQzlDNEIsWUFBQUEsVUFBVSxDQUFDeUksUUFBWCxHQUFzQjNPLENBQUMsQ0FBQ3NRLElBQUYsQ0FBT3BLLFVBQVUsQ0FBQ3lJLFFBQVgsQ0FBb0JyRixNQUFwQixDQUEyQjJHLFdBQVcsQ0FBQy9KLFVBQVosQ0FBdUJ5SSxRQUFsRCxDQUFQLENBQXRCO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFVBQUlBLFFBQUosRUFBYztBQUNaRCxRQUFBQSxhQUFhLENBQUNySixJQUFkLENBQW1CLEtBQUtrTCx1QkFBTCxDQUE2QnRQLE9BQTdCLEVBQXNDNk4sU0FBUyxDQUFDOUQsS0FBaEQsRUFBdUQ5RSxVQUFVLENBQUN5SSxRQUFsRSxFQUE0RUcsU0FBUyxDQUFDQyxVQUF0RixFQUFrR0QsU0FBUyxDQUFDN0QsRUFBNUcsQ0FBbkI7QUFDQXlELFFBQUFBLGFBQWEsQ0FBQ3JKLElBQWQsQ0FBbUI4SixjQUFjLENBQUNoSixJQUFmLENBQW9CLEVBQXBCLENBQW5CO0FBQ0QsT0FIRCxNQUdPO0FBQ0wsWUFBSWxGLE9BQU8sQ0FBQzhPLFlBQVosRUFBMEI7QUFDeEIsY0FBSSxDQUFDakIsU0FBUyxDQUFDN0QsRUFBZixFQUFtQjtBQUNqQjZELFlBQUFBLFNBQVMsQ0FBQzdELEVBQVYsR0FBZTZELFNBQVMsQ0FBQ0MsVUFBekI7QUFDRDs7QUFDRCxnQkFBTWpILEtBQUssR0FBRzlDLE1BQU0sQ0FBQ3dMLE1BQVAsQ0FBYyxFQUFkLEVBQWtCdlAsT0FBTyxDQUFDNkcsS0FBMUIsQ0FBZDtBQUNBLGNBQUkySSxpQkFBSjtBQUFBLGNBQ0VDLFFBREY7QUFBQSxjQUVFWixPQUZGO0FBQUEsY0FHRWEsZ0JBQWdCLEdBQUc3QixTQUFTLENBQUM3RCxFQUgvQjs7QUFLQSxjQUFJLE9BQU9oSyxPQUFPLENBQUM4TyxZQUFSLENBQXFCYSxFQUE1QixLQUFtQyxRQUF2QyxFQUFpRDtBQUMvQ0YsWUFBQUEsUUFBUSxHQUFHelAsT0FBTyxDQUFDOE8sWUFBUixDQUFxQmEsRUFBaEM7QUFDRCxXQUZELE1BRU8sSUFBSTNQLE9BQU8sQ0FBQzhPLFlBQVIsQ0FBcUJhLEVBQXJCLFlBQW1DalEsT0FBdkMsRUFBZ0Q7QUFDckQrUCxZQUFBQSxRQUFRLEdBQUd6UCxPQUFPLENBQUM4TyxZQUFSLENBQXFCYSxFQUFyQixDQUF3QkMsZUFBbkM7QUFDRDs7QUFFRCxjQUFJNVAsT0FBTyxDQUFDOE8sWUFBUixDQUFxQmEsRUFBckIsWUFBbUNsUSxhQUF2QyxFQUFzRDtBQUNwRDtBQUNBaVEsWUFBQUEsZ0JBQWdCLEdBQUcxUCxPQUFPLENBQUM4TyxZQUFSLENBQXFCYSxFQUFyQixDQUF3QkUsY0FBeEIsQ0FBdUM3RixFQUExRDs7QUFDQSxrQkFBTThGLG1CQUFtQixHQUFHeFEsS0FBSyxDQUFDeVEseUJBQU4sQ0FBZ0M7QUFDMURsQixjQUFBQSxPQUFPLEVBQUUsQ0FBQztBQUNSbUIsZ0JBQUFBLFdBQVcsRUFBRWhRLE9BQU8sQ0FBQzhPLFlBQVIsQ0FBcUJhLEVBQXJCLENBQXdCRSxjQUQ3QjtBQUVSSSxnQkFBQUEsV0FBVyxFQUFFLEtBRkw7QUFFWTtBQUNwQkMsZ0JBQUFBLFFBQVEsRUFBRSxJQUhGO0FBSVJySixnQkFBQUEsS0FBSyxFQUFFOUMsTUFBTSxDQUFDd0wsTUFBUCxDQUFjO0FBQ25CLG1CQUFDNVAsRUFBRSxDQUFDd1EsV0FBSixHQUFrQjtBQURDLGlCQUFkLEVBRUpuUSxPQUFPLENBQUM4TyxZQUFSLENBQXFCN0UsT0FBckIsSUFBZ0NqSyxPQUFPLENBQUM4TyxZQUFSLENBQXFCN0UsT0FBckIsQ0FBNkJwRCxLQUZ6RDtBQUpDLGVBQUQsQ0FEaUQ7QUFTMURrRCxjQUFBQTtBQVQwRCxhQUFoQyxDQUE1QixDQUhvRCxDQWVwRDs7O0FBQ0EvSixZQUFBQSxPQUFPLENBQUNvUSxPQUFSLEdBQWtCLElBQWxCO0FBQ0FwUSxZQUFBQSxPQUFPLENBQUMyTixtQkFBUixHQUE4QixJQUE5QjtBQUNBM04sWUFBQUEsT0FBTyxDQUFDcVEsVUFBUixHQUFxQnRNLE1BQU0sQ0FBQ3dMLE1BQVAsQ0FBY08sbUJBQW1CLENBQUNPLFVBQWxDLEVBQThDclEsT0FBTyxDQUFDcVEsVUFBdEQsQ0FBckI7QUFDQXJRLFlBQUFBLE9BQU8sQ0FBQ3NRLFlBQVIsR0FBdUJSLG1CQUFtQixDQUFDUSxZQUFwQixDQUFpQ2pJLE1BQWpDLENBQXdDckksT0FBTyxDQUFDc1EsWUFBUixJQUF3QixFQUFoRSxDQUF2QjtBQUNBekIsWUFBQUEsT0FBTyxHQUFHaUIsbUJBQW1CLENBQUNqQixPQUE5Qjs7QUFFQSxnQkFBSW5JLEtBQUssQ0FBQ0MsT0FBTixDQUFjM0csT0FBTyxDQUFDOEgsS0FBdEIsQ0FBSixFQUFrQztBQUNoQztBQUNBOUgsY0FBQUEsT0FBTyxDQUFDOEgsS0FBUixDQUFjMkIsT0FBZCxDQUFzQixDQUFDM0IsS0FBRCxFQUFRbUQsQ0FBUixLQUFjO0FBQ2xDLG9CQUFJdkUsS0FBSyxDQUFDQyxPQUFOLENBQWNtQixLQUFkLENBQUosRUFBMEI7QUFDeEJBLGtCQUFBQSxLQUFLLEdBQUdBLEtBQUssQ0FBQyxDQUFELENBQWI7QUFDRDs7QUFFRCxvQkFBSThELEtBQUssR0FBSSxrQkFBaUJYLENBQUUsRUFBaEM7QUFDQWpMLGdCQUFBQSxPQUFPLENBQUNpRixVQUFSLENBQW1CYixJQUFuQixDQUF3QixDQUFDMEQsS0FBRCxFQUFROEQsS0FBUixDQUF4QixFQU5rQyxDQVFsQzs7QUFDQUEsZ0JBQUFBLEtBQUssR0FBRyxLQUFLM0wsU0FBTCxDQUFlb0ssT0FBZixDQUF1QixLQUFLZ0IsS0FBTCxDQUFXTyxLQUFYLENBQXZCLENBQVI7O0FBRUEsb0JBQUlsRixLQUFLLENBQUNDLE9BQU4sQ0FBYzNHLE9BQU8sQ0FBQzhILEtBQVIsQ0FBY21ELENBQWQsQ0FBZCxDQUFKLEVBQXFDO0FBQ25Dakwsa0JBQUFBLE9BQU8sQ0FBQzhILEtBQVIsQ0FBY21ELENBQWQsRUFBaUIsQ0FBakIsSUFBc0JXLEtBQXRCO0FBQ0QsaUJBRkQsTUFFTztBQUNMNUwsa0JBQUFBLE9BQU8sQ0FBQzhILEtBQVIsQ0FBY21ELENBQWQsSUFBbUJXLEtBQW5CO0FBQ0Q7QUFDRixlQWhCRDtBQWlCQTRELGNBQUFBLGlCQUFpQixHQUFHeFAsT0FBTyxDQUFDOEgsS0FBNUI7QUFDRDtBQUNGLFdBM0NELE1BMkNPO0FBQ0w7QUFDQTBILFlBQUFBLGlCQUFpQixHQUFHeFAsT0FBTyxDQUFDOEgsS0FBNUI7QUFDQSxtQkFBTzlILE9BQU8sQ0FBQzhILEtBQWY7QUFDQWpCLFlBQUFBLEtBQUssQ0FBQ2xILEVBQUUsQ0FBQ3dRLFdBQUosQ0FBTCxHQUF3QixJQUF4QjtBQUNELFdBaEV1QixDQWtFeEI7QUFDQTs7O0FBQ0EsZ0JBQU1JLFNBQVMsR0FBSSxrQkFBaUIsS0FBS0MsV0FBTCxDQUNsQ2xRLFNBRGtDLEVBRWxDO0FBQ0UyRSxZQUFBQSxVQUFVLEVBQUVqRixPQUFPLENBQUNpRixVQUR0QjtBQUVFd0wsWUFBQUEsTUFBTSxFQUFFelEsT0FBTyxDQUFDeVEsTUFGbEI7QUFHRTFKLFlBQUFBLEtBQUssRUFBRS9HLE9BQU8sQ0FBQzhPLFlBQVIsQ0FBcUIvSCxLQUg5QjtBQUlFZSxZQUFBQSxLQUFLLEVBQUUwSCxpQkFKVDtBQUtFcEIsWUFBQUEsY0FBYyxFQUFFcE8sT0FBTyxDQUFDb08sY0FMMUI7QUFNRUUsWUFBQUEsY0FBYyxFQUFFdE8sT0FBTyxDQUFDc08sY0FOMUI7QUFPRXpILFlBQUFBLEtBUEY7QUFRRWdJLFlBQUFBLE9BUkY7QUFTRTlFLFlBQUFBO0FBVEYsV0FGa0MsRUFhbENBLEtBYmtDLEVBY2xDMUUsT0Fka0MsQ0FjMUIsSUFkMEIsRUFjcEIsRUFkb0IsQ0FjaEIsVUFkcEIsQ0FwRXdCLENBa0ZPOztBQUMvQixnQkFBTXFMLFdBQVcsR0FBRyxLQUFLQyxjQUFMLENBQW9CaFIsRUFBRSxDQUFDd1EsV0FBdkIsRUFBb0MsSUFBcEMsRUFBMEM7QUFBRXBHLFlBQUFBO0FBQUYsV0FBMUMsQ0FBcEI7QUFDQSxnQkFBTTZHLFNBQVMsR0FBR0wsU0FBUyxDQUFDbkcsT0FBVixDQUFrQnNHLFdBQWxCLENBQWxCO0FBRUFsRCxVQUFBQSxjQUFjLENBQUNwSixJQUFmLENBQW9CLEtBQUtrTCx1QkFBTCxDQUE2QnRQLE9BQTdCLEVBQXNDNk4sU0FBUyxDQUFDOUQsS0FBaEQsRUFBdUQ5RSxVQUFVLENBQUMySSxJQUFsRSxFQUF5RSxJQUMzRjVOLE9BQU8sQ0FBQzhPLFlBQVIsQ0FBcUJuTixNQUFyQixDQUE0QnVFLEdBQTVCLENBQWdDL0IsS0FBSyxJQUFJO0FBQ3ZDLGdCQUFJME0sVUFBSjs7QUFDQSxnQkFBSXBCLFFBQUosRUFBYztBQUNab0IsY0FBQUEsVUFBVSxHQUFHO0FBQ1gsaUJBQUNwQixRQUFELEdBQVl0TDtBQURELGVBQWI7QUFHRDs7QUFDRCxnQkFBSTBLLE9BQUosRUFBYTtBQUNYZ0MsY0FBQUEsVUFBVSxHQUFHO0FBQ1gsaUJBQUM3USxPQUFPLENBQUM4TyxZQUFSLENBQXFCYSxFQUFyQixDQUF3Qm1CLHNCQUF6QixHQUFrRDNNO0FBRHZDLGVBQWI7QUFHRDs7QUFFRCxtQkFBT2pGLEtBQUssQ0FBQzZSLFNBQU4sQ0FBZ0JSLFNBQWhCLEVBQTJCSyxTQUEzQixFQUFzQ0YsV0FBVyxDQUFDck4sTUFBbEQsRUFBMEQsS0FBSzJOLGtCQUFMLENBQXdCSCxVQUF4QixFQUFvQ25CLGdCQUFwQyxDQUExRCxDQUFQO0FBQ0QsV0FkRCxFQWNHeEssSUFkSCxDQWVFLEtBQUsvRSxRQUFMLENBQWN1QyxRQUFkLENBQXVCLFdBQXZCLElBQXNDLGFBQXRDLEdBQXNELFNBZnhELENBaUJELEdBbEJtQixFQWtCZm1MLFNBQVMsQ0FBQzdELEVBbEJLLENBQXBCO0FBbUJELFNBekdELE1BeUdPO0FBQ0x3RCxVQUFBQSxjQUFjLENBQUNwSixJQUFmLENBQW9CLEtBQUtrTCx1QkFBTCxDQUE2QnRQLE9BQTdCLEVBQXNDNk4sU0FBUyxDQUFDOUQsS0FBaEQsRUFBdUQ5RSxVQUFVLENBQUMySSxJQUFsRSxFQUF3RUMsU0FBUyxDQUFDQyxVQUFsRixFQUE4RkQsU0FBUyxDQUFDN0QsRUFBeEcsQ0FBcEI7QUFDRDs7QUFFRHdELFFBQUFBLGNBQWMsQ0FBQ3BKLElBQWYsQ0FBb0I2SixlQUFlLENBQUMvSSxJQUFoQixDQUFxQixFQUFyQixDQUFwQjtBQUNELE9BbE1vQyxDQW9NckM7OztBQUNBLFVBQUluQixNQUFNLENBQUNDLFNBQVAsQ0FBaUJDLGNBQWpCLENBQWdDQyxJQUFoQyxDQUFxQ2xFLE9BQXJDLEVBQThDLE9BQTlDLEtBQTBELENBQUNBLE9BQU8sQ0FBQzhPLFlBQXZFLEVBQXFGO0FBQ25GOU8sUUFBQUEsT0FBTyxDQUFDNkcsS0FBUixHQUFnQixLQUFLbUssa0JBQUwsQ0FBd0JoUixPQUFPLENBQUM2RyxLQUFoQyxFQUF1Q2dILFNBQVMsQ0FBQzdELEVBQVYsSUFBZ0IxSixTQUF2RCxFQUFrRXlKLEtBQWxFLEVBQXlFL0osT0FBekUsQ0FBaEI7O0FBQ0EsWUFBSUEsT0FBTyxDQUFDNkcsS0FBWixFQUFtQjtBQUNqQixjQUFJNkcsUUFBSixFQUFjO0FBQ1pELFlBQUFBLGFBQWEsQ0FBQ3JKLElBQWQsQ0FBb0IsVUFBU3BFLE9BQU8sQ0FBQzZHLEtBQU0sRUFBM0M7QUFDRCxXQUZELE1BRU87QUFDTDJHLFlBQUFBLGNBQWMsQ0FBQ3BKLElBQWYsQ0FBcUIsVUFBU3BFLE9BQU8sQ0FBQzZHLEtBQU0sRUFBNUMsRUFESyxDQUVMOztBQUNBMkcsWUFBQUEsY0FBYyxDQUFDL0QsT0FBZixDQUF1QixDQUFDdEYsS0FBRCxFQUFRM0IsR0FBUixLQUFnQjtBQUNyQyxrQkFBSTJCLEtBQUssQ0FBQzhNLFVBQU4sQ0FBaUIsUUFBakIsQ0FBSixFQUFnQztBQUM5QnpELGdCQUFBQSxjQUFjLENBQUNoTCxHQUFELENBQWQsR0FBc0IsS0FBSzhNLHVCQUFMLENBQTZCdFAsT0FBN0IsRUFBc0MrSixLQUF0QyxFQUE2QzlFLFVBQVUsQ0FBQzJJLElBQXhELEVBQThEQyxTQUFTLENBQUNDLFVBQXhFLEVBQW9GRCxTQUFTLENBQUM3RCxFQUE5RixFQUFrR2hLLE9BQU8sQ0FBQzZHLEtBQTFHLENBQXRCO0FBQ0Q7QUFDRixhQUpEO0FBS0Q7QUFDRjtBQUNGLE9BcE5vQyxDQXNOckM7OztBQUNBLFVBQUk3RyxPQUFPLENBQUNrUixLQUFaLEVBQW1CO0FBQ2pCbFIsUUFBQUEsT0FBTyxDQUFDa1IsS0FBUixHQUFnQnhLLEtBQUssQ0FBQ0MsT0FBTixDQUFjM0csT0FBTyxDQUFDa1IsS0FBdEIsSUFBK0JsUixPQUFPLENBQUNrUixLQUFSLENBQWNoTCxHQUFkLENBQWtCc0ksQ0FBQyxJQUFJLEtBQUsyQyxhQUFMLENBQW1CM0MsQ0FBbkIsRUFBc0J6RSxLQUF0QixFQUE2QjhELFNBQVMsQ0FBQzdELEVBQXZDLEVBQTJDaEssT0FBM0MsQ0FBdkIsRUFBNEVrRixJQUE1RSxDQUFpRixJQUFqRixDQUEvQixHQUF3SCxLQUFLaU0sYUFBTCxDQUFtQm5SLE9BQU8sQ0FBQ2tSLEtBQTNCLEVBQWtDbkgsS0FBbEMsRUFBeUM4RCxTQUFTLENBQUM3RCxFQUFuRCxFQUF1RGhLLE9BQXZELENBQXhJOztBQUVBLFlBQUkwTixRQUFKLEVBQWM7QUFDWkQsVUFBQUEsYUFBYSxDQUFDckosSUFBZCxDQUFvQixhQUFZcEUsT0FBTyxDQUFDa1IsS0FBTSxFQUE5QztBQUNELFNBRkQsTUFFTztBQUNMMUQsVUFBQUEsY0FBYyxDQUFDcEosSUFBZixDQUFxQixhQUFZcEUsT0FBTyxDQUFDa1IsS0FBTSxFQUEvQztBQUNEO0FBQ0YsT0EvTm9DLENBaU9yQzs7O0FBQ0EsVUFBSW5OLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsY0FBakIsQ0FBZ0NDLElBQWhDLENBQXFDbEUsT0FBckMsRUFBOEMsUUFBOUMsQ0FBSixFQUE2RDtBQUMzREEsUUFBQUEsT0FBTyxDQUFDb1IsTUFBUixHQUFpQixLQUFLSixrQkFBTCxDQUF3QmhSLE9BQU8sQ0FBQ29SLE1BQWhDLEVBQXdDOVEsU0FBeEMsRUFBbUR5SixLQUFuRCxFQUEwRC9KLE9BQTFELEVBQW1FLEtBQW5FLENBQWpCOztBQUNBLFlBQUlBLE9BQU8sQ0FBQ29SLE1BQVosRUFBb0I7QUFDbEIsY0FBSTFELFFBQUosRUFBYztBQUNaRCxZQUFBQSxhQUFhLENBQUNySixJQUFkLENBQW9CLFdBQVVwRSxPQUFPLENBQUNvUixNQUFPLEVBQTdDO0FBQ0QsV0FGRCxNQUVPO0FBQ0w1RCxZQUFBQSxjQUFjLENBQUNwSixJQUFmLENBQXFCLFdBQVVwRSxPQUFPLENBQUNvUixNQUFPLEVBQTlDO0FBQ0Q7QUFDRjtBQUNGLE9BM09vQyxDQTZPckM7OztBQUNBLFVBQUlwUixPQUFPLENBQUM4SCxLQUFaLEVBQW1CO0FBQ2pCLGNBQU11SixNQUFNLEdBQUcsS0FBS0MsY0FBTCxDQUFvQnRSLE9BQXBCLEVBQTZCK0osS0FBN0IsRUFBb0MyRCxRQUFwQyxDQUFmOztBQUNBLFlBQUkyRCxNQUFNLENBQUNFLGNBQVAsQ0FBc0JsTyxNQUExQixFQUFrQztBQUNoQ21LLFVBQUFBLGNBQWMsQ0FBQ3BKLElBQWYsQ0FBcUIsYUFBWWlOLE1BQU0sQ0FBQ0UsY0FBUCxDQUFzQnJNLElBQXRCLENBQTJCLElBQTNCLENBQWlDLEVBQWxFO0FBQ0Q7O0FBQ0QsWUFBSW1NLE1BQU0sQ0FBQ0csYUFBUCxDQUFxQm5PLE1BQXpCLEVBQWlDO0FBQy9Cb0ssVUFBQUEsYUFBYSxDQUFDckosSUFBZCxDQUFvQixhQUFZaU4sTUFBTSxDQUFDRyxhQUFQLENBQXFCdE0sSUFBckIsQ0FBMEIsSUFBMUIsQ0FBZ0MsRUFBaEU7QUFDRDtBQUNGLE9BdFBvQyxDQXdQckM7OztBQUNBLFlBQU11TSxVQUFVLEdBQUcsS0FBS0MsaUJBQUwsQ0FBdUIxUixPQUF2QixFQUFnQzZOLFNBQVMsQ0FBQzlELEtBQTFDLENBQW5COztBQUNBLFVBQUkwSCxVQUFVLElBQUksQ0FBQ3pSLE9BQU8sQ0FBQzhPLFlBQTNCLEVBQXlDO0FBQ3ZDLFlBQUlwQixRQUFKLEVBQWM7QUFDWkQsVUFBQUEsYUFBYSxDQUFDckosSUFBZCxDQUFtQnFOLFVBQW5CO0FBQ0QsU0FGRCxNQUVPO0FBQ0xqRSxVQUFBQSxjQUFjLENBQUNwSixJQUFmLENBQW9CcU4sVUFBcEI7QUFDRDtBQUNGOztBQUVELFVBQUkvRCxRQUFKLEVBQWM7QUFDWjFMLFFBQUFBLEtBQUssR0FBSSxVQUFTaUQsVUFBVSxDQUFDMkksSUFBWCxDQUFnQjFJLElBQWhCLENBQXFCLElBQXJCLENBQTJCLFVBQVN1SSxhQUFhLENBQUN2SSxJQUFkLENBQW1CLEVBQW5CLENBQXVCLFFBQU8ySSxTQUFTLENBQUM3RCxFQUFHLEdBQUVpRSxlQUFlLENBQUMvSSxJQUFoQixDQUFxQixFQUFyQixDQUF5QixHQUFFc0ksY0FBYyxDQUFDdEksSUFBZixDQUFvQixFQUFwQixDQUF3QixFQUF0SjtBQUNELE9BRkQsTUFFTztBQUNMbEQsUUFBQUEsS0FBSyxHQUFHd0wsY0FBYyxDQUFDdEksSUFBZixDQUFvQixFQUFwQixDQUFSO0FBQ0Q7O0FBRUQsVUFBSWxGLE9BQU8sQ0FBQzJSLElBQVIsSUFBZ0IsS0FBS3hSLFFBQUwsQ0FBY3VDLFFBQWQsQ0FBdUJpUCxJQUEzQyxFQUFpRDtBQUMvQyxZQUFJQSxJQUFJLEdBQUczUixPQUFPLENBQUMyUixJQUFuQjs7QUFDQSxZQUFJLE9BQU8zUixPQUFPLENBQUMyUixJQUFmLEtBQXdCLFFBQTVCLEVBQXNDO0FBQ3BDQSxVQUFBQSxJQUFJLEdBQUczUixPQUFPLENBQUMyUixJQUFSLENBQWFDLEtBQXBCO0FBQ0Q7O0FBQ0QsWUFBSSxLQUFLelIsUUFBTCxDQUFjdUMsUUFBZCxDQUF1Qm1QLE9BQXZCLEtBQW1DRixJQUFJLEtBQUssV0FBVCxJQUF3QkEsSUFBSSxLQUFLLGVBQXBFLENBQUosRUFBMEY7QUFDeEYzUCxVQUFBQSxLQUFLLElBQUssUUFBTzJQLElBQUssRUFBdEI7QUFDRCxTQUZELE1BRU8sSUFBSUEsSUFBSSxLQUFLLE9BQWIsRUFBc0I7QUFDM0IzUCxVQUFBQSxLQUFLLElBQUssSUFBRyxLQUFLN0IsUUFBTCxDQUFjdUMsUUFBZCxDQUF1Qm9QLFFBQVMsRUFBN0M7QUFDRCxTQUZNLE1BRUE7QUFDTDlQLFVBQUFBLEtBQUssSUFBSSxhQUFUO0FBQ0Q7O0FBQ0QsWUFBSSxLQUFLN0IsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QnFQLE1BQXZCLElBQWlDL1IsT0FBTyxDQUFDMlIsSUFBUixDQUFhSyxFQUE5QyxJQUFvRGhTLE9BQU8sQ0FBQzJSLElBQVIsQ0FBYUssRUFBYixDQUFnQmhPLFNBQWhCLFlBQXFDMUUsS0FBN0YsRUFBb0c7QUFDbEcwQyxVQUFBQSxLQUFLLElBQUssT0FBTSxLQUFLaEIsVUFBTCxDQUFnQmhCLE9BQU8sQ0FBQzJSLElBQVIsQ0FBYUssRUFBYixDQUFnQjNSLElBQWhDLENBQXNDLEVBQXREO0FBQ0Q7O0FBQ0QsWUFBSSxLQUFLRixRQUFMLENBQWN1QyxRQUFkLENBQXVCdVAsVUFBdkIsSUFBcUNqUyxPQUFPLENBQUNpUyxVQUFqRCxFQUE2RDtBQUMzRGpRLFVBQUFBLEtBQUssSUFBSSxjQUFUO0FBQ0Q7QUFDRjs7QUFFRCxhQUFRLEdBQUVBLEtBQU0sR0FBaEI7QUFDRDs7O2tDQUVhUyxLLEVBQU9zSCxLLEVBQU96SixTLEVBQVdOLE8sRUFBUztBQUM5QyxZQUFNa1MsR0FBRyxHQUFHeEwsS0FBSyxDQUFDQyxPQUFOLENBQWNsRSxLQUFkLElBQXVCQSxLQUFLLENBQUMsQ0FBRCxDQUE1QixHQUFrQ0EsS0FBOUM7QUFFQSxhQUFPLEtBQUs0SSxLQUFMLENBQVcsS0FBSzhHLGlCQUFMLENBQXVCN1IsU0FBdkIsRUFBa0M0UixHQUFsQyxFQUF1Q2xTLE9BQXZDLEtBQW1Ea1MsR0FBOUQsRUFBbUVuSSxLQUFuRSxDQUFQO0FBQ0Q7OztxQ0FFZ0I5RSxVLEVBQVlqRixPLEVBQVNvUyxXLEVBQWE7QUFDakQsYUFBT25OLFVBQVUsSUFBSUEsVUFBVSxDQUFDaUIsR0FBWCxDQUFlSyxJQUFJLElBQUk7QUFDMUMsWUFBSThMLFFBQVEsR0FBRyxJQUFmOztBQUVBLFlBQUk5TCxJQUFJLFlBQVlySCxLQUFLLENBQUN3RixlQUExQixFQUEyQztBQUN6QyxpQkFBTyxLQUFLZ0QscUJBQUwsQ0FBMkJuQixJQUEzQixDQUFQO0FBQ0Q7O0FBQ0QsWUFBSUcsS0FBSyxDQUFDQyxPQUFOLENBQWNKLElBQWQsQ0FBSixFQUF5QjtBQUN2QixjQUFJQSxJQUFJLENBQUNsRCxNQUFMLEtBQWdCLENBQXBCLEVBQXVCO0FBQ3JCLGtCQUFNLElBQUluRCxLQUFKLENBQVcsR0FBRXdLLElBQUksQ0FBQ3NCLFNBQUwsQ0FBZXpGLElBQWYsQ0FBcUIsMEdBQWxDLENBQU47QUFDRDs7QUFDREEsVUFBQUEsSUFBSSxHQUFHQSxJQUFJLENBQUNzRSxLQUFMLEVBQVA7O0FBRUEsY0FBSXRFLElBQUksQ0FBQyxDQUFELENBQUosWUFBbUJySCxLQUFLLENBQUN3RixlQUE3QixFQUE4QztBQUM1QzZCLFlBQUFBLElBQUksQ0FBQyxDQUFELENBQUosR0FBVSxLQUFLbUIscUJBQUwsQ0FBMkJuQixJQUFJLENBQUMsQ0FBRCxDQUEvQixDQUFWO0FBQ0E4TCxZQUFBQSxRQUFRLEdBQUcsS0FBWDtBQUNELFdBSEQsTUFHTyxJQUFJLENBQUM5TCxJQUFJLENBQUMsQ0FBRCxDQUFKLENBQVFOLFFBQVIsQ0FBaUIsR0FBakIsQ0FBRCxJQUEwQixDQUFDTSxJQUFJLENBQUMsQ0FBRCxDQUFKLENBQVFOLFFBQVIsQ0FBaUIsR0FBakIsQ0FBL0IsRUFBc0Q7QUFDM0RNLFlBQUFBLElBQUksQ0FBQyxDQUFELENBQUosR0FBVSxLQUFLakQsZUFBTCxDQUFxQmlELElBQUksQ0FBQyxDQUFELENBQXpCLENBQVY7QUFDRCxXQUZNLE1BRUE7QUFDTHBILFlBQUFBLFlBQVksQ0FBQ21ULGVBQWI7QUFDRDs7QUFDRCxjQUFJMUcsS0FBSyxHQUFHckYsSUFBSSxDQUFDLENBQUQsQ0FBaEI7O0FBRUEsY0FBSSxLQUFLdkcsT0FBTCxDQUFhbU8sYUFBakIsRUFBZ0M7QUFDOUJ2QyxZQUFBQSxLQUFLLEdBQUcsS0FBSzJHLGlCQUFMLENBQXVCM0csS0FBdkIsRUFBOEJ3RyxXQUE5QixFQUEyQ3BTLE9BQTNDLENBQVI7QUFDRDs7QUFFRHVHLFVBQUFBLElBQUksR0FBRyxDQUFDQSxJQUFJLENBQUMsQ0FBRCxDQUFMLEVBQVUsS0FBS2pELGVBQUwsQ0FBcUJzSSxLQUFyQixDQUFWLEVBQXVDMUcsSUFBdkMsQ0FBNEMsTUFBNUMsQ0FBUDtBQUNELFNBckJELE1BcUJPO0FBQ0xxQixVQUFBQSxJQUFJLEdBQUcsQ0FBQ0EsSUFBSSxDQUFDTixRQUFMLENBQWMvRyxLQUFLLENBQUNzVCxTQUFwQixDQUFELElBQW1DLENBQUNqTSxJQUFJLENBQUNOLFFBQUwsQ0FBYyxHQUFkLENBQXBDLEdBQ0gsS0FBS3dNLGNBQUwsQ0FBb0JsTSxJQUFwQixFQUEwQnZHLE9BQU8sQ0FBQytKLEtBQWxDLENBREcsR0FFSCxLQUFLdEYsTUFBTCxDQUFZOEIsSUFBWixDQUZKO0FBR0Q7O0FBQ0QsWUFBSSxDQUFDeEgsQ0FBQyxDQUFDMlQsT0FBRixDQUFVMVMsT0FBTyxDQUFDNk8sT0FBbEIsQ0FBRCxJQUErQixDQUFDdEksSUFBSSxDQUFDTixRQUFMLENBQWMsR0FBZCxDQUFoQyxJQUFzRG9NLFFBQTFELEVBQW9FO0FBQ2xFOUwsVUFBQUEsSUFBSSxHQUFJLEdBQUU2TCxXQUFZLElBQUc3TCxJQUFLLEVBQTlCO0FBQ0Q7O0FBRUQsZUFBT0EsSUFBUDtBQUNELE9BckNvQixDQUFyQjtBQXNDRDs7O29DQUVlc0ksTyxFQUFTOEQsZSxFQUFpQjVFLFksRUFBYztBQUN0RCxZQUFNaUIsV0FBVyxHQUFHO0FBQ2xCSSxRQUFBQSxTQUFTLEVBQUUsRUFETztBQUVsQjFCLFFBQUFBLFFBQVEsRUFBRTtBQUZRLE9BQXBCO0FBSUEsWUFBTWtGLGlCQUFpQixHQUFHLEVBQTFCO0FBQ0EsWUFBTUMsZ0JBQWdCLEdBQUcsRUFBekI7QUFDQSxVQUFJQyxnQkFBZ0IsR0FBRyxLQUF2QjtBQUNBLFlBQU1DLFNBQVMsR0FBRztBQUNoQjVELFFBQUFBLFVBQVUsRUFBRU4sT0FBTyxDQUFDN0UsRUFESjtBQUVoQmtGLFFBQUFBLFVBQVUsRUFBRUwsT0FBTyxDQUFDN0U7QUFGSixPQUFsQjtBQUlBLFlBQU0vRSxVQUFVLEdBQUc7QUFDakIySSxRQUFBQSxJQUFJLEVBQUUsRUFEVztBQUVqQkYsUUFBQUEsUUFBUSxFQUFFO0FBRk8sT0FBbkI7QUFJQSxVQUFJc0YsU0FBSjtBQUVBakYsTUFBQUEsWUFBWSxDQUFDL04sT0FBYixDQUFxQmlULFdBQXJCLEdBQW1DLElBQW5DOztBQUVBLFVBQUlsRixZQUFZLENBQUNDLEtBQWIsQ0FBbUIzTixJQUFuQixLQUE0QnNTLGVBQWUsQ0FBQ3pELFVBQTVDLElBQTBEbkIsWUFBWSxDQUFDQyxLQUFiLENBQW1CaEUsRUFBbkIsS0FBMEIySSxlQUFlLENBQUN6RCxVQUF4RyxFQUFvSDtBQUNsSDZELFFBQUFBLFNBQVMsQ0FBQzVELFVBQVYsR0FBd0IsR0FBRXdELGVBQWUsQ0FBQ3hELFVBQVcsS0FBSU4sT0FBTyxDQUFDN0UsRUFBRyxFQUFwRTtBQUNBK0ksUUFBQUEsU0FBUyxDQUFDN0QsVUFBVixHQUF3QixHQUFFeUQsZUFBZSxDQUFDekQsVUFBVyxJQUFHTCxPQUFPLENBQUM3RSxFQUFHLEVBQW5FO0FBQ0QsT0F2QnFELENBeUJ0RDs7O0FBQ0EsVUFBSStELFlBQVksQ0FBQy9OLE9BQWIsQ0FBcUJrVCx1QkFBckIsS0FBaUQsS0FBckQsRUFBNEQ7QUFDMURyRSxRQUFBQSxPQUFPLENBQUM5RSxLQUFSLENBQWNvSixpQkFBZCxDQUFnQ3RFLE9BQWhDOztBQUNBM1AsUUFBQUEsS0FBSyxDQUFDa1UsZ0JBQU4sQ0FBdUJ2RSxPQUF2QixFQUFnQ0EsT0FBTyxDQUFDOUUsS0FBeEM7QUFFQSxjQUFNc0osaUJBQWlCLEdBQUd4RSxPQUFPLENBQUM1SixVQUFSLENBQW1CaUIsR0FBbkIsQ0FBdUJLLElBQUksSUFBSTtBQUN2RCxjQUFJK00sTUFBTSxHQUFHL00sSUFBYjtBQUNBLGNBQUlnTixRQUFRLEdBQUcsS0FBZjs7QUFFQSxjQUFJN00sS0FBSyxDQUFDQyxPQUFOLENBQWNKLElBQWQsS0FBdUJBLElBQUksQ0FBQ2xELE1BQUwsS0FBZ0IsQ0FBM0MsRUFBOEM7QUFDNUMsZ0JBQUlrRCxJQUFJLENBQUMsQ0FBRCxDQUFKLFlBQW1CckgsS0FBSyxDQUFDd0YsZUFBekIsS0FDRjZCLElBQUksQ0FBQyxDQUFELENBQUosWUFBbUJySCxLQUFLLENBQUNzVSxPQUF6QixJQUNBak4sSUFBSSxDQUFDLENBQUQsQ0FBSixZQUFtQnJILEtBQUssQ0FBQ3VVLElBRHpCLElBRUFsTixJQUFJLENBQUMsQ0FBRCxDQUFKLFlBQW1CckgsS0FBSyxDQUFDd1UsRUFIdkIsQ0FBSixFQUlHO0FBQ0RILGNBQUFBLFFBQVEsR0FBRyxJQUFYO0FBQ0Q7O0FBRURoTixZQUFBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ0wsR0FBTCxDQUFTSyxJQUFJLElBQUlBLElBQUksWUFBWXJILEtBQUssQ0FBQ3dGLGVBQXRCLEdBQXdDLEtBQUtnRCxxQkFBTCxDQUEyQm5CLElBQTNCLENBQXhDLEdBQTJFQSxJQUE1RixDQUFQO0FBRUErTSxZQUFBQSxNQUFNLEdBQUcvTSxJQUFJLENBQUMsQ0FBRCxDQUFiO0FBQ0FBLFlBQUFBLElBQUksR0FBR0EsSUFBSSxDQUFDLENBQUQsQ0FBWDtBQUNEOztBQUNELGNBQUlBLElBQUksWUFBWXJILEtBQUssQ0FBQ3NVLE9BQTFCLEVBQW1DO0FBQ2pDLG1CQUFPak4sSUFBSSxDQUFDb04sR0FBWixDQURpQyxDQUNoQjtBQUNsQjs7QUFDRCxjQUFJcE4sSUFBSSxZQUFZckgsS0FBSyxDQUFDdVUsSUFBdEIsSUFBOEJsTixJQUFJLFlBQVlySCxLQUFLLENBQUN3VSxFQUF4RCxFQUE0RDtBQUMxRCxrQkFBTSxJQUFJeFQsS0FBSixDQUNKLHVJQUNBLHFFQUZJLENBQU47QUFJRDs7QUFFRCxjQUFJc0gsTUFBSjs7QUFDQSxjQUFJK0wsUUFBUSxLQUFLLElBQWpCLEVBQXVCO0FBQ3JCL0wsWUFBQUEsTUFBTSxHQUFHakIsSUFBVDtBQUNELFdBRkQsTUFFTyxJQUFJLFVBQVU2RyxJQUFWLENBQWU3RyxJQUFmLENBQUosRUFBMEI7QUFDL0JpQixZQUFBQSxNQUFNLEdBQUksSUFBRyxLQUFLbEUsZUFBTCxDQUFxQnlQLFNBQVMsQ0FBQzVELFVBQS9CLENBQTJDLElBQUc1SSxJQUFJLENBQUNsQixPQUFMLENBQWEsUUFBYixFQUF1QixFQUF2QixDQUEyQixHQUF0RjtBQUNELFdBRk0sTUFFQSxJQUFJLGlCQUFpQitILElBQWpCLENBQXNCN0csSUFBdEIsQ0FBSixFQUFpQztBQUN0Q2lCLFlBQUFBLE1BQU0sR0FBR2pCLElBQUksQ0FBQ2xCLE9BQUwsQ0FBYSxpQkFBYixFQUFpQyxnQkFBZSxLQUFLL0IsZUFBTCxDQUFxQnlQLFNBQVMsQ0FBQzVELFVBQS9CLENBQTJDLEdBQTNGLENBQVQ7QUFDRCxXQUZNLE1BRUE7QUFDTDNILFlBQUFBLE1BQU0sR0FBSSxHQUFFLEtBQUtsRSxlQUFMLENBQXFCeVAsU0FBUyxDQUFDNUQsVUFBL0IsQ0FBMkMsSUFBRyxLQUFLN0wsZUFBTCxDQUFxQmlELElBQXJCLENBQTJCLEVBQXJGO0FBQ0Q7O0FBQ0QsY0FBSXFGLEtBQUssR0FBSSxHQUFFbUgsU0FBUyxDQUFDN0QsVUFBVyxJQUFHb0UsTUFBTyxFQUE5Qzs7QUFFQSxjQUFJLEtBQUt0VCxPQUFMLENBQWFtTyxhQUFqQixFQUFnQztBQUM5QnZDLFlBQUFBLEtBQUssR0FBRyxLQUFLMkcsaUJBQUwsQ0FBdUIzRyxLQUF2QixFQUE4Qm1ILFNBQVMsQ0FBQzVELFVBQXhDLEVBQW9EcEIsWUFBWSxDQUFDL04sT0FBakUsQ0FBUjtBQUNEOztBQUVELGlCQUFRLEdBQUV3SCxNQUFPLE9BQU0sS0FBS2xFLGVBQUwsQ0FBcUJzSSxLQUFyQixFQUE0QixJQUE1QixDQUFrQyxFQUF6RDtBQUNELFNBN0N5QixDQUExQjs7QUE4Q0EsWUFBSWlELE9BQU8sQ0FBQ25CLFFBQVIsSUFBb0JLLFlBQVksQ0FBQ0wsUUFBckMsRUFBK0M7QUFDN0MsZUFBSyxNQUFNbkgsSUFBWCxJQUFtQjhNLGlCQUFuQixFQUFzQztBQUNwQ3BPLFlBQUFBLFVBQVUsQ0FBQ3lJLFFBQVgsQ0FBb0J0SixJQUFwQixDQUF5Qm1DLElBQXpCO0FBQ0Q7QUFDRixTQUpELE1BSU87QUFDTCxlQUFLLE1BQU1BLElBQVgsSUFBbUI4TSxpQkFBbkIsRUFBc0M7QUFDcENwTyxZQUFBQSxVQUFVLENBQUMySSxJQUFYLENBQWdCeEosSUFBaEIsQ0FBcUJtQyxJQUFyQjtBQUNEO0FBQ0Y7QUFDRixPQXJGcUQsQ0F1RnREOzs7QUFDQSxVQUFJc0ksT0FBTyxDQUFDNUUsT0FBWixFQUFxQjtBQUNuQitJLFFBQUFBLFNBQVMsR0FBRyxLQUFLWSxtQkFBTCxDQUF5Qi9FLE9BQXpCLEVBQWtDa0UsU0FBbEMsRUFBNkNKLGVBQWUsQ0FBQ3hELFVBQTdELEVBQXlFcEIsWUFBekUsQ0FBWjtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUs4Rix1QkFBTCxDQUE2QmhGLE9BQTdCLEVBQXNDa0UsU0FBdEMsRUFBaURoRixZQUFqRDs7QUFDQWlGLFFBQUFBLFNBQVMsR0FBRyxLQUFLYyxZQUFMLENBQWtCakYsT0FBbEIsRUFBMkJkLFlBQTNCLENBQVo7QUFDRCxPQTdGcUQsQ0ErRnREOzs7QUFDQSxVQUFJaUYsU0FBUyxDQUFDL04sVUFBVixDQUFxQjJJLElBQXJCLENBQTBCdkssTUFBMUIsR0FBbUMsQ0FBdkMsRUFBMEM7QUFDeEM0QixRQUFBQSxVQUFVLENBQUMySSxJQUFYLEdBQWtCM0ksVUFBVSxDQUFDMkksSUFBWCxDQUFnQnZGLE1BQWhCLENBQXVCMkssU0FBUyxDQUFDL04sVUFBVixDQUFxQjJJLElBQTVDLENBQWxCO0FBQ0Q7O0FBRUQsVUFBSW9GLFNBQVMsQ0FBQy9OLFVBQVYsQ0FBcUJ5SSxRQUFyQixDQUE4QnJLLE1BQTlCLEdBQXVDLENBQTNDLEVBQThDO0FBQzVDNEIsUUFBQUEsVUFBVSxDQUFDeUksUUFBWCxHQUFzQnpJLFVBQVUsQ0FBQ3lJLFFBQVgsQ0FBb0JyRixNQUFwQixDQUEyQjJLLFNBQVMsQ0FBQy9OLFVBQVYsQ0FBcUJ5SSxRQUFoRCxDQUF0QjtBQUNEOztBQUVELFVBQUltQixPQUFPLENBQUNBLE9BQVosRUFBcUI7QUFDbkIsYUFBSyxNQUFNa0YsWUFBWCxJQUEyQmxGLE9BQU8sQ0FBQ0EsT0FBbkMsRUFBNEM7QUFDMUMsY0FBSWtGLFlBQVksQ0FBQ2hGLFFBQWIsSUFBeUJnRixZQUFZLENBQUNDLE9BQTFDLEVBQW1EO0FBQ2pEO0FBQ0Q7O0FBRUQsZ0JBQU1DLGdCQUFnQixHQUFHLEtBQUtoRixlQUFMLENBQXFCOEUsWUFBckIsRUFBbUNoQixTQUFuQyxFQUE4Q2hGLFlBQTlDLENBQXpCOztBQUVBLGNBQUljLE9BQU8sQ0FBQ3FCLFFBQVIsS0FBcUIsS0FBckIsSUFBOEI2RCxZQUFZLENBQUM3RCxRQUFiLEtBQTBCLElBQTVELEVBQWtFO0FBQ2hFNEMsWUFBQUEsZ0JBQWdCLEdBQUcsSUFBbkI7QUFDRCxXQVR5QyxDQVUxQzs7O0FBQ0EsY0FBSWlCLFlBQVksQ0FBQ3JHLFFBQWIsSUFBeUJLLFlBQVksQ0FBQ0wsUUFBMUMsRUFBb0Q7QUFDbERtRixZQUFBQSxnQkFBZ0IsQ0FBQ3pPLElBQWpCLENBQXNCNlAsZ0JBQWdCLENBQUN2RyxRQUF2QztBQUNEOztBQUNELGNBQUl1RyxnQkFBZ0IsQ0FBQzdFLFNBQXJCLEVBQWdDO0FBQzlCd0QsWUFBQUEsaUJBQWlCLENBQUN4TyxJQUFsQixDQUF1QjZQLGdCQUFnQixDQUFDN0UsU0FBeEM7QUFDRDs7QUFDRCxjQUFJNkUsZ0JBQWdCLENBQUNoUCxVQUFqQixDQUE0QjJJLElBQTVCLENBQWlDdkssTUFBakMsR0FBMEMsQ0FBOUMsRUFBaUQ7QUFDL0M0QixZQUFBQSxVQUFVLENBQUMySSxJQUFYLEdBQWtCM0ksVUFBVSxDQUFDMkksSUFBWCxDQUFnQnZGLE1BQWhCLENBQXVCNEwsZ0JBQWdCLENBQUNoUCxVQUFqQixDQUE0QjJJLElBQW5ELENBQWxCO0FBQ0Q7O0FBQ0QsY0FBSXFHLGdCQUFnQixDQUFDaFAsVUFBakIsQ0FBNEJ5SSxRQUE1QixDQUFxQ3JLLE1BQXJDLEdBQThDLENBQWxELEVBQXFEO0FBQ25ENEIsWUFBQUEsVUFBVSxDQUFDeUksUUFBWCxHQUFzQnpJLFVBQVUsQ0FBQ3lJLFFBQVgsQ0FBb0JyRixNQUFwQixDQUEyQjRMLGdCQUFnQixDQUFDaFAsVUFBakIsQ0FBNEJ5SSxRQUF2RCxDQUF0QjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxVQUFJbUIsT0FBTyxDQUFDbkIsUUFBUixJQUFvQkssWUFBWSxDQUFDTCxRQUFyQyxFQUErQztBQUM3QyxZQUFJb0YsZ0JBQWdCLElBQUlELGdCQUFnQixDQUFDeFAsTUFBakIsR0FBMEIsQ0FBbEQsRUFBcUQ7QUFDbkQyTCxVQUFBQSxXQUFXLENBQUN0QixRQUFaLENBQXFCdEosSUFBckIsQ0FBMkIsSUFBRzRPLFNBQVMsQ0FBQzlOLElBQUssTUFBSzhOLFNBQVMsQ0FBQ2tCLElBQUssR0FBRXJCLGdCQUFnQixDQUFDM04sSUFBakIsQ0FBc0IsRUFBdEIsQ0FBMEIsU0FBUThOLFNBQVMsQ0FBQ21CLFNBQVUsRUFBekg7QUFDRCxTQUZELE1BRU87QUFDTG5GLFVBQUFBLFdBQVcsQ0FBQ3RCLFFBQVosQ0FBcUJ0SixJQUFyQixDQUEyQixJQUFHNE8sU0FBUyxDQUFDOU4sSUFBSyxJQUFHOE4sU0FBUyxDQUFDa0IsSUFBSyxPQUFNbEIsU0FBUyxDQUFDbUIsU0FBVSxFQUF6Rjs7QUFDQSxjQUFJdEIsZ0JBQWdCLENBQUN4UCxNQUFqQixHQUEwQixDQUE5QixFQUFpQztBQUMvQjJMLFlBQUFBLFdBQVcsQ0FBQ3RCLFFBQVosQ0FBcUJ0SixJQUFyQixDQUEwQnlPLGdCQUFnQixDQUFDM04sSUFBakIsQ0FBc0IsRUFBdEIsQ0FBMUI7QUFDRDtBQUNGOztBQUNEOEosUUFBQUEsV0FBVyxDQUFDSSxTQUFaLENBQXNCaEwsSUFBdEIsQ0FBMkJ3TyxpQkFBaUIsQ0FBQzFOLElBQWxCLENBQXVCLEVBQXZCLENBQTNCO0FBQ0QsT0FWRCxNQVVPO0FBQ0wsWUFBSTROLGdCQUFnQixJQUFJRixpQkFBaUIsQ0FBQ3ZQLE1BQWxCLEdBQTJCLENBQW5ELEVBQXNEO0FBQ3BEMkwsVUFBQUEsV0FBVyxDQUFDSSxTQUFaLENBQXNCaEwsSUFBdEIsQ0FBNEIsSUFBRzRPLFNBQVMsQ0FBQzlOLElBQUssTUFBSzhOLFNBQVMsQ0FBQ2tCLElBQUssR0FBRXRCLGlCQUFpQixDQUFDMU4sSUFBbEIsQ0FBdUIsRUFBdkIsQ0FBMkIsU0FBUThOLFNBQVMsQ0FBQ21CLFNBQVUsRUFBM0g7QUFDRCxTQUZELE1BRU87QUFDTG5GLFVBQUFBLFdBQVcsQ0FBQ0ksU0FBWixDQUFzQmhMLElBQXRCLENBQTRCLElBQUc0TyxTQUFTLENBQUM5TixJQUFLLElBQUc4TixTQUFTLENBQUNrQixJQUFLLE9BQU1sQixTQUFTLENBQUNtQixTQUFVLEVBQTFGOztBQUNBLGNBQUl2QixpQkFBaUIsQ0FBQ3ZQLE1BQWxCLEdBQTJCLENBQS9CLEVBQWtDO0FBQ2hDMkwsWUFBQUEsV0FBVyxDQUFDSSxTQUFaLENBQXNCaEwsSUFBdEIsQ0FBMkJ3TyxpQkFBaUIsQ0FBQzFOLElBQWxCLENBQXVCLEVBQXZCLENBQTNCO0FBQ0Q7QUFDRjs7QUFDRDhKLFFBQUFBLFdBQVcsQ0FBQ3RCLFFBQVosQ0FBcUJ0SixJQUFyQixDQUEwQnlPLGdCQUFnQixDQUFDM04sSUFBakIsQ0FBc0IsRUFBdEIsQ0FBMUI7QUFDRDs7QUFFRCxhQUFPO0FBQ0xrSyxRQUFBQSxTQUFTLEVBQUVKLFdBQVcsQ0FBQ0ksU0FBWixDQUFzQmxLLElBQXRCLENBQTJCLEVBQTNCLENBRE47QUFFTHdJLFFBQUFBLFFBQVEsRUFBRXNCLFdBQVcsQ0FBQ3RCLFFBQVosQ0FBcUJ4SSxJQUFyQixDQUEwQixFQUExQixDQUZMO0FBR0xELFFBQUFBO0FBSEssT0FBUDtBQUtEOzs7c0NBRWlCMkcsSyxFQUFPdEwsUyxFQUFXTixPLEVBQVM7QUFDM0M7QUFDQSxVQUFJQSxPQUFPLENBQUNzTyxjQUFSLENBQXdCLEdBQUVoTyxTQUFVLEdBQUVzTCxLQUFNLEVBQTVDLENBQUosRUFBb0Q7QUFDbEQsZUFBTzVMLE9BQU8sQ0FBQ3NPLGNBQVIsQ0FBd0IsR0FBRWhPLFNBQVUsR0FBRXNMLEtBQU0sRUFBNUMsQ0FBUDtBQUNELE9BSjBDLENBTTNDOzs7QUFDQSxVQUFJQSxLQUFLLENBQUN3SSxLQUFOLENBQVksc0JBQVosQ0FBSixFQUF5QztBQUN2QyxlQUFPeEksS0FBUDtBQUNEOztBQUVELFlBQU15SSxhQUFhLEdBQUksSUFBR3JVLE9BQU8sQ0FBQ29PLGNBQVIsQ0FBdUJrRyxJQUFLLEVBQXREO0FBRUF0VSxNQUFBQSxPQUFPLENBQUNvTyxjQUFSLENBQXVCbUcsR0FBdkIsQ0FBMkJGLGFBQTNCLEVBQTBDekksS0FBMUM7QUFDQTVMLE1BQUFBLE9BQU8sQ0FBQ3NPLGNBQVIsQ0FBd0IsR0FBRWhPLFNBQVUsR0FBRXNMLEtBQU0sRUFBNUMsSUFBaUR5SSxhQUFqRDtBQUVBLGFBQU9BLGFBQVA7QUFDRDs7O3NDQUVpQi9ULFMsRUFBV21DLEssRUFBT3pDLE8sRUFBUztBQUMzQyxVQUFJLEtBQUtBLE9BQUwsQ0FBYW1PLGFBQWpCLEVBQWdDO0FBQzlCLFlBQUluTyxPQUFPLENBQUNzTyxjQUFSLENBQXdCLEdBQUVoTyxTQUFVLEdBQUVtQyxLQUFNLEVBQTVDLENBQUosRUFBb0Q7QUFDbEQsaUJBQU96QyxPQUFPLENBQUNzTyxjQUFSLENBQXdCLEdBQUVoTyxTQUFVLEdBQUVtQyxLQUFNLEVBQTVDLENBQVA7QUFDRDtBQUNGOztBQUNELGFBQU8sSUFBUDtBQUNEOzs7aUNBRVlvTSxPLEVBQVNkLFksRUFBYztBQUNsQyxZQUFNaUMsV0FBVyxHQUFHbkIsT0FBTyxDQUFDbUIsV0FBNUI7QUFDQSxZQUFNMUcsTUFBTSxHQUFHdUYsT0FBTyxDQUFDdkYsTUFBdkI7QUFDQSxZQUFNa0wsV0FBVyxHQUFHLENBQUMsQ0FBQ2xMLE1BQUYsSUFBWSxDQUFDdUYsT0FBTyxDQUFDdkYsTUFBUixDQUFlMEcsV0FBNUIsSUFBMkNuQixPQUFPLENBQUN2RixNQUFSLENBQWVTLEtBQWYsQ0FBcUIxSixJQUFyQixLQUE4QjBOLFlBQVksQ0FBQy9OLE9BQWIsQ0FBcUIrSixLQUFyQixDQUEyQjFKLElBQXhIO0FBQ0EsVUFBSW9VLE9BQUo7QUFDQSxVQUFJQyxTQUFKO0FBQ0E7O0FBQ0EsWUFBTUMsSUFBSSxHQUFHM0UsV0FBVyxDQUFDNEUsTUFBekI7QUFDQSxZQUFNQyxRQUFRLEdBQUc3RSxXQUFXLFlBQVl4USxTQUF2QixHQUNmd1EsV0FBVyxDQUFDckYsVUFERyxHQUVmcUYsV0FBVyxDQUFDOEUsa0JBQVosSUFBa0NILElBQUksQ0FBQ0ksbUJBRnpDO0FBR0EsWUFBTUMsU0FBUyxHQUFHaEYsV0FBVyxZQUFZeFEsU0FBdkIsR0FDaEJ3USxXQUFXLENBQUNpRixlQURJLEdBRWhCTixJQUFJLENBQUNwSyxhQUFMLENBQW1CeUYsV0FBVyxDQUFDOEUsa0JBQVosSUFBa0NILElBQUksQ0FBQ0ksbUJBQTFELEVBQStFdFMsS0FGakY7QUFHQSxVQUFJeVMsTUFBSjtBQUNBOztBQUNBLFlBQU1DLEtBQUssR0FBR3RHLE9BQU8sQ0FBQzlFLEtBQXRCO0FBQ0EsWUFBTXFMLFVBQVUsR0FBR0QsS0FBSyxDQUFDRSxZQUFOLEVBQW5CO0FBQ0EsWUFBTUMsVUFBVSxHQUFHdEYsV0FBVyxZQUFZeFEsU0FBdkIsR0FDakIyVixLQUFLLENBQUM1SyxhQUFOLENBQW9CeUYsV0FBVyxDQUFDdUYsZ0JBQVosSUFBZ0NKLEtBQUssQ0FBQ0osbUJBQTFELEVBQStFdFMsS0FEOUQsR0FFakJ1TixXQUFXLENBQUNpRixlQUZkO0FBR0EsVUFBSU8sT0FBTyxHQUFHM0csT0FBTyxDQUFDN0UsRUFBdEI7O0FBRUEsYUFBTyxDQUFDeUssT0FBTyxHQUFHQSxPQUFPLElBQUlBLE9BQU8sQ0FBQ25MLE1BQW5CLElBQTZCdUYsT0FBTyxDQUFDdkYsTUFBaEQsS0FBMkRtTCxPQUFPLENBQUN6RSxXQUExRSxFQUF1RjtBQUNyRixZQUFJa0YsTUFBSixFQUFZO0FBQ1ZBLFVBQUFBLE1BQU0sR0FBSSxHQUFFVCxPQUFPLENBQUN6SyxFQUFHLEtBQUlrTCxNQUFPLEVBQWxDO0FBQ0QsU0FGRCxNQUVPO0FBQ0xBLFVBQUFBLE1BQU0sR0FBR1QsT0FBTyxDQUFDekssRUFBakI7QUFDRDtBQUNGOztBQUVELFVBQUksQ0FBQ2tMLE1BQUwsRUFBYUEsTUFBTSxHQUFHNUwsTUFBTSxDQUFDVSxFQUFQLElBQWFWLE1BQU0sQ0FBQ1MsS0FBUCxDQUFhMUosSUFBbkMsQ0FBYixLQUNLbVYsT0FBTyxHQUFJLEdBQUVOLE1BQU8sS0FBSU0sT0FBUSxFQUFoQztBQUVMLFVBQUlDLE1BQU0sR0FBSSxHQUFFLEtBQUt6VSxVQUFMLENBQWdCa1UsTUFBaEIsQ0FBd0IsSUFBRyxLQUFLNVIsZUFBTCxDQUFxQjBSLFNBQXJCLENBQWdDLEVBQTNFO0FBQ0EsWUFBTVUsa0JBQWtCLEdBQUcsRUFBM0I7O0FBRUEsVUFBSTNILFlBQVksQ0FBQy9OLE9BQWIsQ0FBcUI4TyxZQUFyQixJQUFxQzBGLFdBQXJDLElBQW9EekcsWUFBWSxDQUFDTCxRQUFiLElBQXlCbUIsT0FBTyxDQUFDdkYsTUFBUixDQUFlb0UsUUFBeEMsSUFBb0QsQ0FBQ21CLE9BQU8sQ0FBQ25CLFFBQXJILEVBQStIO0FBQzdILFlBQUk4RyxXQUFKLEVBQWlCO0FBQ2Y7QUFDQSxnQkFBTWxVLFNBQVMsR0FBRyxLQUFLVSxVQUFMLENBQWdCc0ksTUFBTSxDQUFDVSxFQUFQLElBQWFWLE1BQU0sQ0FBQ1MsS0FBUCxDQUFhMUosSUFBMUMsQ0FBbEIsQ0FGZSxDQUlmOztBQUNBb1YsVUFBQUEsTUFBTSxHQUFHLEtBQUt0RCxpQkFBTCxDQUF1QjdSLFNBQXZCLEVBQWtDdVUsUUFBbEMsRUFBNEM5RyxZQUFZLENBQUMvTixPQUF6RCxLQUFzRSxHQUFFTSxTQUFVLElBQUcsS0FBS2dELGVBQUwsQ0FBcUJ1UixRQUFyQixDQUErQixFQUE3SDs7QUFFQSxjQUFJOUcsWUFBWSxDQUFDTCxRQUFqQixFQUEyQjtBQUN6QmdJLFlBQUFBLGtCQUFrQixDQUFDdFIsSUFBbkIsQ0FBeUIsR0FBRTlELFNBQVUsSUFBRyxLQUFLZ0QsZUFBTCxDQUFxQjBSLFNBQXJCLENBQWdDLEVBQXhFO0FBQ0Q7QUFDRixTQVZELE1BVU87QUFDTCxnQkFBTVcsVUFBVSxHQUFJLEdBQUVULE1BQU0sQ0FBQzdQLE9BQVAsQ0FBZSxLQUFmLEVBQXNCLEdBQXRCLENBQTJCLElBQUd3UCxRQUFTLEVBQTdELENBREssQ0FHTDs7QUFDQVksVUFBQUEsTUFBTSxHQUFHLEtBQUt0RCxpQkFBTCxDQUF1QitDLE1BQXZCLEVBQStCUyxVQUEvQixFQUEyQzVILFlBQVksQ0FBQy9OLE9BQXhELEtBQW9FLEtBQUtzRCxlQUFMLENBQXFCcVMsVUFBckIsQ0FBN0U7QUFDRDtBQUNGOztBQUVERixNQUFBQSxNQUFNLElBQUssTUFBSyxLQUFLblMsZUFBTCxDQUFxQmtTLE9BQXJCLENBQThCLElBQUcsS0FBS2xTLGVBQUwsQ0FBcUJnUyxVQUFyQixDQUFpQyxFQUFsRjs7QUFFQSxVQUFJekcsT0FBTyxDQUFDYyxFQUFaLEVBQWdCO0FBQ2Q4RixRQUFBQSxNQUFNLEdBQUcsS0FBS3pNLGVBQUwsQ0FBcUI2RixPQUFPLENBQUNjLEVBQTdCLEVBQWlDO0FBQ3hDbkksVUFBQUEsTUFBTSxFQUFFLEtBQUt2SCxTQUFMLENBQWVvSyxPQUFmLENBQXVCLEtBQUsvRyxlQUFMLENBQXFCa1MsT0FBckIsQ0FBdkIsQ0FEZ0M7QUFFeEN6TCxVQUFBQSxLQUFLLEVBQUU4RSxPQUFPLENBQUM5RTtBQUZ5QixTQUFqQyxDQUFUO0FBSUQ7O0FBRUQsVUFBSThFLE9BQU8sQ0FBQ2hJLEtBQVosRUFBbUI7QUFDakI2TixRQUFBQSxTQUFTLEdBQUcsS0FBSzFMLGVBQUwsQ0FBcUI2RixPQUFPLENBQUNoSSxLQUE3QixFQUFvQztBQUM5Q1csVUFBQUEsTUFBTSxFQUFFLEtBQUt2SCxTQUFMLENBQWVvSyxPQUFmLENBQXVCLEtBQUsvRyxlQUFMLENBQXFCa1MsT0FBckIsQ0FBdkIsQ0FEc0M7QUFFOUN6TCxVQUFBQSxLQUFLLEVBQUU4RSxPQUFPLENBQUM5RTtBQUYrQixTQUFwQyxDQUFaOztBQUlBLFlBQUkySyxTQUFKLEVBQWU7QUFDYixjQUFJN0YsT0FBTyxDQUFDK0csRUFBWixFQUFnQjtBQUNkSCxZQUFBQSxNQUFNLElBQUssT0FBTWYsU0FBVSxFQUEzQjtBQUNELFdBRkQsTUFFTztBQUNMZSxZQUFBQSxNQUFNLElBQUssUUFBT2YsU0FBVSxFQUE1QjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxhQUFPO0FBQ0x4UCxRQUFBQSxJQUFJLEVBQUUySixPQUFPLENBQUNxQixRQUFSLEdBQW1CLFlBQW5CLEdBQWtDckIsT0FBTyxDQUFDc0csS0FBUixJQUFpQixLQUFLaFYsUUFBTCxDQUFjdUMsUUFBZCxDQUF1QixZQUF2QixDQUFqQixHQUF3RCxrQkFBeEQsR0FBNkUsaUJBRGhIO0FBRUx3UixRQUFBQSxJQUFJLEVBQUUsS0FBS2xULFVBQUwsQ0FBZ0JvVSxVQUFoQixFQUE0QkksT0FBNUIsQ0FGRDtBQUdMckIsUUFBQUEsU0FBUyxFQUFFc0IsTUFITjtBQUlMeFEsUUFBQUEsVUFBVSxFQUFFO0FBQ1YySSxVQUFBQSxJQUFJLEVBQUUsRUFESTtBQUVWRixVQUFBQSxRQUFRLEVBQUVnSTtBQUZBO0FBSlAsT0FBUDtBQVNEOzs7d0NBRW1CN0csTyxFQUFTa0UsUyxFQUFXSixlLEVBQWlCNUUsWSxFQUFjO0FBQ3JFLFlBQU05RCxPQUFPLEdBQUc0RSxPQUFPLENBQUM1RSxPQUF4QjtBQUNBLFlBQU00TCxZQUFZLEdBQUc1TCxPQUFPLENBQUNGLEtBQVIsQ0FBY3NMLFlBQWQsRUFBckI7QUFDQSxZQUFNUyxTQUFTLEdBQUksR0FBRS9DLFNBQVMsQ0FBQzVELFVBQVcsS0FBSWxGLE9BQU8sQ0FBQ0QsRUFBRyxFQUF6RDtBQUNBLFlBQU0rTCxpQkFBaUIsR0FBSSxHQUFFaEQsU0FBUyxDQUFDN0QsVUFBVyxJQUFHakYsT0FBTyxDQUFDRCxFQUFHLEVBQWhFO0FBQ0EsWUFBTWdNLGlCQUFpQixHQUFHL0wsT0FBTyxDQUFDaEYsVUFBUixDQUFtQmlCLEdBQW5CLENBQXVCSyxJQUFJLElBQUk7QUFDdkQsWUFBSXFGLEtBQUssR0FBSSxHQUFFbUssaUJBQWtCLElBQUdyUCxLQUFLLENBQUNDLE9BQU4sQ0FBY0osSUFBZCxJQUFzQkEsSUFBSSxDQUFDLENBQUQsQ0FBMUIsR0FBZ0NBLElBQUssRUFBekU7O0FBRUEsWUFBSSxLQUFLdkcsT0FBTCxDQUFhbU8sYUFBakIsRUFBZ0M7QUFDOUJ2QyxVQUFBQSxLQUFLLEdBQUcsS0FBSzJHLGlCQUFMLENBQXVCM0csS0FBdkIsRUFBOEJrSyxTQUE5QixFQUF5Qy9ILFlBQVksQ0FBQy9OLE9BQXRELENBQVI7QUFDRDs7QUFFRCxlQUFRLEdBQUUsS0FBS3NELGVBQUwsQ0FBcUJ3UyxTQUFyQixDQUFnQyxJQUFHLEtBQUt4UyxlQUFMLENBQXFCb0QsS0FBSyxDQUFDQyxPQUFOLENBQWNKLElBQWQsSUFBc0JBLElBQUksQ0FBQyxDQUFELENBQTFCLEdBQWdDQSxJQUFyRCxDQUM1QyxPQUNDLEtBQUtqRCxlQUFMLENBQXFCc0ksS0FBckIsQ0FBNEIsRUFGOUI7QUFHRCxPQVZ5QixDQUExQjtBQVdBLFlBQU1vRSxXQUFXLEdBQUduQixPQUFPLENBQUNtQixXQUE1QjtBQUNBLFlBQU13RSxXQUFXLEdBQUcsQ0FBQzNGLE9BQU8sQ0FBQ3ZGLE1BQVIsQ0FBZTBHLFdBQWhCLElBQStCbkIsT0FBTyxDQUFDdkYsTUFBUixDQUFlUyxLQUFmLENBQXFCMUosSUFBckIsS0FBOEIwTixZQUFZLENBQUMvTixPQUFiLENBQXFCK0osS0FBckIsQ0FBMkIxSixJQUE1RztBQUNBLFlBQU00VixXQUFXLEdBQUd0RCxlQUFwQjtBQUNBLFlBQU11RCxXQUFXLEdBQUdsRyxXQUFXLENBQUNpRixlQUFoQztBQUNBLFlBQU1rQixXQUFXLEdBQUdwRCxTQUFTLENBQUM1RCxVQUE5QjtBQUNBLFlBQU1pSCxXQUFXLEdBQUdwRyxXQUFXLENBQUNjLHNCQUFoQztBQUNBLFlBQU11RixVQUFVLEdBQUdyRyxXQUFXLENBQUNzRyxjQUEvQjtBQUVBLFlBQU1DLFFBQVEsR0FBRzFILE9BQU8sQ0FBQ3FCLFFBQVIsR0FBbUIsWUFBbkIsR0FBa0NyQixPQUFPLENBQUNzRyxLQUFSLElBQWlCLEtBQUtoVixRQUFMLENBQWN1QyxRQUFkLENBQXVCLFlBQXZCLENBQWpCLEdBQXdELGtCQUF4RCxHQUE2RSxpQkFBaEk7QUFDQSxVQUFJOFQsUUFBSjtBQUNBLFVBQUlDLGFBQUo7QUFDQSxZQUFNeFIsVUFBVSxHQUFHO0FBQ2pCMkksUUFBQUEsSUFBSSxFQUFFLEVBRFc7QUFFakJGLFFBQUFBLFFBQVEsRUFBRTtBQUZPLE9BQW5CO0FBSUEsVUFBSWdKLFVBQVUsR0FBRzFHLFdBQVcsQ0FBQzJHLFNBQTdCO0FBQ0EsVUFBSUMsWUFBSjtBQUNBLFVBQUlDLFlBQUo7QUFDQSxVQUFJQyxZQUFKO0FBQ0EsVUFBSUMsV0FBSjs7QUFFQSxVQUFJaEosWUFBWSxDQUFDL04sT0FBYixDQUFxQmtULHVCQUFyQixLQUFpRCxLQUFyRCxFQUE0RDtBQUMxRDtBQUNBLGFBQUssTUFBTTNNLElBQVgsSUFBbUJ5UCxpQkFBbkIsRUFBc0M7QUFDcEMvUSxVQUFBQSxVQUFVLENBQUMySSxJQUFYLENBQWdCeEosSUFBaEIsQ0FBcUJtQyxJQUFyQjtBQUNEO0FBQ0YsT0ExQ29FLENBNENyRTs7O0FBQ0EsVUFBSSxDQUFDd0gsWUFBWSxDQUFDTCxRQUFsQixFQUE0QjtBQUMxQmdKLFFBQUFBLFVBQVUsR0FBRzFHLFdBQVcsQ0FBQ2dILGNBQXpCO0FBQ0Q7O0FBQ0QsVUFBSWpKLFlBQVksQ0FBQ0wsUUFBYixJQUF5QixDQUFDbUIsT0FBTyxDQUFDbkIsUUFBbEMsSUFBOEMsQ0FBQ21CLE9BQU8sQ0FBQ3ZGLE1BQVIsQ0FBZW9FLFFBQTlELElBQTBFbUIsT0FBTyxDQUFDdkYsTUFBUixDQUFlUyxLQUFmLEtBQXlCZ0UsWUFBWSxDQUFDL04sT0FBYixDQUFxQmlYLFNBQTVILEVBQXVJO0FBQ3JJUCxRQUFBQSxVQUFVLEdBQUcxRyxXQUFXLENBQUNnSCxjQUF6QjtBQUNELE9BbERvRSxDQW9EckU7QUFDQTtBQUNBOzs7QUFDQSxVQUFJakosWUFBWSxDQUFDTCxRQUFiLElBQXlCLENBQUNtQixPQUFPLENBQUNuQixRQUFsQyxJQUE4Q21CLE9BQU8sQ0FBQ3ZGLE1BQVIsQ0FBZW9FLFFBQTdELElBQXlFLENBQUM4RyxXQUE5RSxFQUEyRjtBQUN6RjtBQUNBLGNBQU1tQixVQUFVLEdBQUcsS0FBS3hELGlCQUFMLENBQXVCOEQsV0FBdkIsRUFBcUMsR0FBRUEsV0FBWSxJQUFHUyxVQUFXLEVBQWpFLEVBQW9FM0ksWUFBWSxDQUFDL04sT0FBakYsS0FBOEYsR0FBRWlXLFdBQVksSUFBR1MsVUFBVyxFQUE3STtBQUVBRSxRQUFBQSxZQUFZLEdBQUksR0FBRSxLQUFLdFQsZUFBTCxDQUFxQnFTLFVBQXJCLENBQWlDLEtBQW5EO0FBQ0QsT0FMRCxNQUtPO0FBQ0w7QUFDQSxjQUFNdUIsYUFBYSxHQUFHLEtBQUsvRSxpQkFBTCxDQUF1QjhELFdBQXZCLEVBQW9DUyxVQUFwQyxFQUFnRDNJLFlBQVksQ0FBQy9OLE9BQTdELEtBQXlFMFcsVUFBL0Y7QUFFQUUsUUFBQUEsWUFBWSxHQUFJLEdBQUUsS0FBSzVWLFVBQUwsQ0FBZ0JpVixXQUFoQixDQUE2QixJQUFHLEtBQUszUyxlQUFMLENBQXFCNFQsYUFBckIsQ0FBb0MsS0FBdEY7QUFDRDs7QUFDRE4sTUFBQUEsWUFBWSxJQUFLLEdBQUUsS0FBS3RULGVBQUwsQ0FBcUJ3UyxTQUFyQixDQUFnQyxJQUFHLEtBQUt4UyxlQUFMLENBQXFCNFMsV0FBckIsQ0FBa0MsRUFBeEYsQ0FsRXFFLENBb0VyRTtBQUNBOztBQUNBVyxNQUFBQSxZQUFZLEdBQUksR0FBRSxLQUFLdlQsZUFBTCxDQUFxQjZTLFdBQXJCLENBQWtDLElBQUcsS0FBSzdTLGVBQUwsQ0FBcUIrUyxVQUFyQixDQUFpQyxLQUF4RjtBQUNBUSxNQUFBQSxZQUFZLElBQUssR0FBRSxLQUFLdlQsZUFBTCxDQUFxQndTLFNBQXJCLENBQWdDLElBQUcsS0FBS3hTLGVBQUwsQ0FBcUI4UyxXQUFyQixDQUFrQyxFQUF4Rjs7QUFFQSxVQUFJbk0sT0FBTyxDQUFDcEQsS0FBWixFQUFtQjtBQUNqQmlRLFFBQUFBLFlBQVksR0FBRyxLQUFLOUYsa0JBQUwsQ0FBd0IvRyxPQUFPLENBQUNwRCxLQUFoQyxFQUF1QyxLQUFLNUcsU0FBTCxDQUFlb0ssT0FBZixDQUF1QixLQUFLL0csZUFBTCxDQUFxQndTLFNBQXJCLENBQXZCLENBQXZDLEVBQWdHN0wsT0FBTyxDQUFDRixLQUF4RyxDQUFmO0FBQ0Q7O0FBRUQsVUFBSSxLQUFLNUosUUFBTCxDQUFjdUMsUUFBZCxDQUF1QnlVLGtCQUEzQixFQUErQztBQUM3QztBQUNBWCxRQUFBQSxRQUFRLEdBQUksS0FBSSxLQUFLeFYsVUFBTCxDQUFnQjZVLFlBQWhCLEVBQThCQyxTQUE5QixDQUF5QyxlQUFjLEtBQUs5VSxVQUFMLENBQWdCNk4sT0FBTyxDQUFDOUUsS0FBUixDQUFjc0wsWUFBZCxFQUFoQixFQUE4Q3RDLFNBQVMsQ0FBQzVELFVBQXhELENBQW9FLE9BQU0wSCxZQUFhLEVBQTlKOztBQUNBLFlBQUlDLFlBQUosRUFBa0I7QUFDaEJOLFVBQUFBLFFBQVEsSUFBSyxRQUFPTSxZQUFhLEVBQWpDO0FBQ0Q7O0FBQ0ROLFFBQUFBLFFBQVEsSUFBSSxHQUFaO0FBQ0FDLFFBQUFBLGFBQWEsR0FBR0csWUFBaEI7QUFDRCxPQVJELE1BUU87QUFDTDtBQUNBSixRQUFBQSxRQUFRLEdBQUksR0FBRSxLQUFLeFYsVUFBTCxDQUFnQjZVLFlBQWhCLEVBQThCQyxTQUE5QixDQUF5QyxPQUFNYyxZQUFhLElBQUdMLFFBQVMsSUFBRyxLQUFLdlYsVUFBTCxDQUFnQjZOLE9BQU8sQ0FBQzlFLEtBQVIsQ0FBY3NMLFlBQWQsRUFBaEIsRUFBOEN0QyxTQUFTLENBQUM1RCxVQUF4RCxDQUFvRSxFQUE3SjtBQUNBc0gsUUFBQUEsYUFBYSxHQUFHSSxZQUFoQjs7QUFDQSxZQUFJQyxZQUFKLEVBQWtCO0FBQ2hCTCxVQUFBQSxhQUFhLElBQUssUUFBT0ssWUFBYSxFQUF0QztBQUNEO0FBQ0Y7O0FBRUQsVUFBSWpJLE9BQU8sQ0FBQ2hJLEtBQVIsSUFBaUJnSSxPQUFPLENBQUM1RSxPQUFSLENBQWdCcEQsS0FBckMsRUFBNEM7QUFDMUMsWUFBSWdJLE9BQU8sQ0FBQ2hJLEtBQVosRUFBbUI7QUFDakJrUSxVQUFBQSxXQUFXLEdBQUcsS0FBSy9GLGtCQUFMLENBQXdCbkMsT0FBTyxDQUFDaEksS0FBaEMsRUFBdUMsS0FBSzVHLFNBQUwsQ0FBZW9LLE9BQWYsQ0FBdUIsS0FBSy9HLGVBQUwsQ0FBcUJ5UCxTQUFTLENBQUM1RCxVQUEvQixDQUF2QixDQUF2QyxFQUEyR04sT0FBTyxDQUFDOUUsS0FBbkgsRUFBMEhnRSxZQUFZLENBQUMvTixPQUF2SSxDQUFkOztBQUNBLGNBQUkrVyxXQUFKLEVBQWlCO0FBQ2ZOLFlBQUFBLGFBQWEsSUFBSyxRQUFPTSxXQUFZLEVBQXJDO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFdBQUtsRCx1QkFBTCxDQUE2QmhGLE9BQTdCLEVBQXNDa0UsU0FBdEMsRUFBaURoRixZQUFqRDs7QUFFQSxhQUFPO0FBQ0w3SSxRQUFBQSxJQUFJLEVBQUVxUixRQUREO0FBRUxyQyxRQUFBQSxJQUFJLEVBQUVzQyxRQUZEO0FBR0xyQyxRQUFBQSxTQUFTLEVBQUVzQyxhQUhOO0FBSUx4UixRQUFBQTtBQUpLLE9BQVA7QUFNRDtBQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs0Q0FDMEI0SixPLEVBQVNrRSxTLEVBQVdoRixZLEVBQWM7QUFDeEQsVUFBSSxDQUFDQSxZQUFZLENBQUNMLFFBQWQsSUFBMEIsQ0FBQ21CLE9BQU8sQ0FBQ3VJLGNBQXZDLEVBQXVEO0FBQ3JEO0FBQ0Q7O0FBRUQsVUFBSSxDQUFDckosWUFBWSxDQUFDL04sT0FBYixDQUFxQjZHLEtBQTFCLEVBQWlDO0FBQy9Ca0gsUUFBQUEsWUFBWSxDQUFDL04sT0FBYixDQUFxQjZHLEtBQXJCLEdBQTZCLEVBQTdCO0FBQ0Q7O0FBQ0QsVUFBSXlDLE1BQU0sR0FBR3VGLE9BQWI7QUFDQSxVQUFJd0ksS0FBSyxHQUFHeEksT0FBWjs7QUFDQSxVQUFJeUksY0FBYyxHQUFHLEtBQUtDLG1CQUFMLENBQXlCMUksT0FBekIsRUFBa0NBLE9BQXZEOztBQUNBLFVBQUk3TSxLQUFKOztBQUVBLGFBQVFzSCxNQUFNLEdBQUdBLE1BQU0sQ0FBQ0EsTUFBeEIsRUFBaUM7QUFBRTtBQUNqQyxZQUFJQSxNQUFNLENBQUNBLE1BQVAsSUFBaUIsQ0FBQ0EsTUFBTSxDQUFDNEcsUUFBN0IsRUFBdUM7QUFDckMsaUJBRHFDLENBQzdCO0FBQ1Q7O0FBRUQsWUFBSTVHLE1BQU0sQ0FBQzhOLGNBQVgsRUFBMkI7QUFDekI7QUFDQTtBQUNBO0FBQ0Q7O0FBRURFLFFBQUFBLGNBQWMsR0FBRyxDQUFDdlQsTUFBTSxDQUFDd0wsTUFBUCxDQUFjLEVBQWQsRUFBa0I4SCxLQUFsQixFQUF5QjtBQUFFeEksVUFBQUEsT0FBTyxFQUFFeUksY0FBWDtBQUEyQnJTLFVBQUFBLFVBQVUsRUFBRTtBQUF2QyxTQUF6QixDQUFELENBQWpCO0FBQ0FvUyxRQUFBQSxLQUFLLEdBQUcvTixNQUFSO0FBQ0Q7O0FBRUQsWUFBTWtPLFVBQVUsR0FBR0YsY0FBYyxDQUFDLENBQUQsQ0FBakM7QUFDQSxZQUFNRyxTQUFTLEdBQUdELFVBQVUsQ0FBQ2xPLE1BQTdCO0FBQ0EsWUFBTW9PLGNBQWMsR0FBR0YsVUFBVSxDQUFDeEgsV0FBbEM7QUFDQXdILE1BQUFBLFVBQVUsQ0FBQ3hILFdBQVgsR0FBeUJqTyxTQUF6Qjs7QUFFQSxVQUFJeVYsVUFBVSxDQUFDdk4sT0FBWCxJQUFzQmxHLE1BQU0sQ0FBQ3lULFVBQVUsQ0FBQ3ZOLE9BQVgsQ0FBbUJGLEtBQXBCLENBQU4sS0FBcUN5TixVQUFVLENBQUN2TixPQUFYLENBQW1CRixLQUFsRixFQUF5RjtBQUN2Ri9ILFFBQUFBLEtBQUssR0FBRyxLQUFLd08sV0FBTCxDQUFpQmdILFVBQVUsQ0FBQ3ZOLE9BQVgsQ0FBbUJGLEtBQW5CLENBQXlCc0wsWUFBekIsRUFBakIsRUFBMEQ7QUFDaEVwUSxVQUFBQSxVQUFVLEVBQUUsQ0FBQ3VTLFVBQVUsQ0FBQ3ZOLE9BQVgsQ0FBbUJGLEtBQW5CLENBQXlCNE4sZUFBMUIsQ0FEb0Q7QUFFaEU5SSxVQUFBQSxPQUFPLEVBQUV2UCxLQUFLLENBQUN5USx5QkFBTixDQUFnQztBQUN2Q2hHLFlBQUFBLEtBQUssRUFBRXlOLFVBQVUsQ0FBQ3ZOLE9BQVgsQ0FBbUJGLEtBRGE7QUFFdkM4RSxZQUFBQSxPQUFPLEVBQUUsQ0FBQztBQUNSbUIsY0FBQUEsV0FBVyxFQUFFMEgsY0FBYyxDQUFDRSxRQURwQjtBQUVSMUgsY0FBQUEsUUFBUSxFQUFFLElBRkY7QUFHUnJKLGNBQUFBLEtBQUssRUFBRTJRLFVBQVUsQ0FBQzNRLEtBSFY7QUFJUmdJLGNBQUFBLE9BQU8sRUFBRTJJLFVBQVUsQ0FBQzNJO0FBSlosYUFBRDtBQUY4QixXQUFoQyxFQVFOQSxPQVY2RDtBQVdoRTlFLFVBQUFBLEtBQUssRUFBRXlOLFVBQVUsQ0FBQ3ZOLE9BQVgsQ0FBbUJGLEtBWHNDO0FBWWhFbEQsVUFBQUEsS0FBSyxFQUFFO0FBQ0wsYUFBQ2xILEVBQUUsQ0FBQ2tZLEdBQUosR0FBVSxDQUNSLEtBQUs1WCxTQUFMLENBQWVvSyxPQUFmLENBQXVCLENBQ3BCLEdBQUUsS0FBS3JKLFVBQUwsQ0FBZ0J5VyxTQUFTLENBQUMxTixLQUFWLENBQWdCMUosSUFBaEMsQ0FBc0MsSUFBRyxLQUFLaUQsZUFBTCxDQUFxQm1VLFNBQVMsQ0FBQzFOLEtBQVYsQ0FBZ0I0TixlQUFyQyxDQUFzRCxFQUQ3RSxFQUVwQixHQUFFLEtBQUtyVSxlQUFMLENBQXFCa1UsVUFBVSxDQUFDdk4sT0FBWCxDQUFtQkYsS0FBbkIsQ0FBeUIxSixJQUE5QyxDQUFvRCxJQUFHLEtBQUtpRCxlQUFMLENBQXFCb1UsY0FBYyxDQUFDekMsZUFBcEMsQ0FBcUQsRUFGMUYsRUFHckIvUCxJQUhxQixDQUdoQixLQUhnQixDQUF2QixDQURRLEVBS1JzUyxVQUFVLENBQUN2TixPQUFYLENBQW1CcEQsS0FMWDtBQURMLFdBWnlEO0FBcUJoRUUsVUFBQUEsS0FBSyxFQUFFLENBckJ5RDtBQXNCaEVtTSxVQUFBQSx1QkFBdUIsRUFBRTtBQXRCdUMsU0FBMUQsRUF1QkxzRSxVQUFVLENBQUN2TixPQUFYLENBQW1CRixLQXZCZCxDQUFSO0FBd0JELE9BekJELE1BeUJPO0FBQ0wsY0FBTStOLFdBQVcsR0FBR0osY0FBYyxDQUFDSyxlQUFmLEtBQW1DLFdBQXZEO0FBQ0EsY0FBTUMsV0FBVyxHQUFHRixXQUFXLEdBQUdKLGNBQWMsQ0FBQ3pDLGVBQWxCLEdBQW9DeUMsY0FBYyxDQUFDVixjQUFmLElBQWlDUyxTQUFTLENBQUMxTixLQUFWLENBQWdCNE4sZUFBcEg7QUFDQSxjQUFNTSxXQUFXLEdBQUdILFdBQVcsR0FBR0osY0FBYyxDQUFDVixjQUFmLElBQWlDUSxVQUFVLENBQUN6TixLQUFYLENBQWlCNE4sZUFBckQsR0FBdUVELGNBQWMsQ0FBQ3pDLGVBQXJIO0FBRUEsY0FBTS9QLElBQUksR0FBRyxDQUNWLEdBQUUsS0FBSzVCLGVBQUwsQ0FBcUJrVSxVQUFVLENBQUN4TixFQUFoQyxDQUFvQyxJQUFHLEtBQUsxRyxlQUFMLENBQXFCMlUsV0FBckIsQ0FBa0MsRUFEakUsRUFFVixHQUFFLEtBQUtqWCxVQUFMLENBQWdCeVcsU0FBUyxDQUFDek4sRUFBVixJQUFnQnlOLFNBQVMsQ0FBQzFOLEtBQVYsQ0FBZ0IxSixJQUFoRCxDQUFzRCxJQUFHLEtBQUtpRCxlQUFMLENBQXFCMFUsV0FBckIsQ0FBa0MsRUFGbkYsRUFHWDlTLElBSFcsQ0FHTixLQUhNLENBQWI7QUFLQWxELFFBQUFBLEtBQUssR0FBRyxLQUFLd08sV0FBTCxDQUFpQmdILFVBQVUsQ0FBQ3pOLEtBQVgsQ0FBaUJzTCxZQUFqQixFQUFqQixFQUFrRDtBQUN4RHBRLFVBQUFBLFVBQVUsRUFBRSxDQUFDZ1QsV0FBRCxDQUQ0QztBQUV4RHBKLFVBQUFBLE9BQU8sRUFBRXZQLEtBQUssQ0FBQ3lRLHlCQUFOLENBQWdDeUgsVUFBaEMsRUFBNEMzSSxPQUZHO0FBR3hEOUUsVUFBQUEsS0FBSyxFQUFFeU4sVUFBVSxDQUFDek4sS0FIc0M7QUFJeERsRCxVQUFBQSxLQUFLLEVBQUU7QUFDTCxhQUFDbEgsRUFBRSxDQUFDa1ksR0FBSixHQUFVLENBQ1JMLFVBQVUsQ0FBQzNRLEtBREgsRUFFUjtBQUFFLGVBQUNsSCxFQUFFLENBQUN1RixJQUFKLEdBQVcsS0FBS2pGLFNBQUwsQ0FBZW9LLE9BQWYsQ0FBdUJuRixJQUF2QjtBQUFiLGFBRlE7QUFETCxXQUppRDtBQVV4RDZCLFVBQUFBLEtBQUssRUFBRSxDQVZpRDtBQVd4RHdILFVBQUFBLE9BQU8sRUFBRWlKLFVBQVUsQ0FBQ3hOLEVBWG9DO0FBWXhEa0osVUFBQUEsdUJBQXVCLEVBQUU7QUFaK0IsU0FBbEQsRUFhTHNFLFVBQVUsQ0FBQ3pOLEtBYk4sQ0FBUjtBQWNEOztBQUVELFVBQUksQ0FBQ2dFLFlBQVksQ0FBQy9OLE9BQWIsQ0FBcUI2RyxLQUFyQixDQUEyQmxILEVBQUUsQ0FBQ2tZLEdBQTlCLENBQUwsRUFBeUM7QUFDdkM5SixRQUFBQSxZQUFZLENBQUMvTixPQUFiLENBQXFCNkcsS0FBckIsQ0FBMkJsSCxFQUFFLENBQUNrWSxHQUE5QixJQUFxQyxFQUFyQztBQUNEOztBQUVEOUosTUFBQUEsWUFBWSxDQUFDL04sT0FBYixDQUFxQjZHLEtBQXJCLENBQTRCLEtBQUlrTSxTQUFTLENBQUM1RCxVQUFXLEVBQXJELElBQTBELEtBQUtsUCxTQUFMLENBQWVvSyxPQUFmLENBQXVCLENBQy9FLEdBRCtFLEVBRS9FckksS0FBSyxDQUFDcUQsT0FBTixDQUFjLElBQWQsRUFBb0IsRUFBcEIsQ0FGK0UsRUFHL0UsR0FIK0UsRUFJL0UsYUFKK0UsRUFLL0VILElBTCtFLENBSzFFLEdBTDBFLENBQXZCLENBQTFEO0FBTUQ7QUFFRDtBQUNGO0FBQ0E7QUFDQTs7Ozt3Q0FDc0IySixPLEVBQVM7QUFDM0IsWUFBTXFKLElBQUksR0FBR25VLE1BQU0sQ0FBQ3dMLE1BQVAsQ0FBYyxFQUFkLEVBQWtCVixPQUFsQixFQUEyQjtBQUFFNUosUUFBQUEsVUFBVSxFQUFFLEVBQWQ7QUFBa0I0SixRQUFBQSxPQUFPLEVBQUU7QUFBM0IsT0FBM0IsQ0FBYjs7QUFFQSxVQUFJbkksS0FBSyxDQUFDQyxPQUFOLENBQWNrSSxPQUFPLENBQUNBLE9BQXRCLENBQUosRUFBb0M7QUFDbENxSixRQUFBQSxJQUFJLENBQUNySixPQUFMLEdBQWVBLE9BQU8sQ0FBQ0EsT0FBUixDQUNac0osTUFEWSxDQUNMbE4sQ0FBQyxJQUFJQSxDQUFDLENBQUNpRixRQURGLEVBRVpoSyxHQUZZLENBRVJrUyxHQUFHLElBQUksS0FBS2IsbUJBQUwsQ0FBeUJhLEdBQXpCLENBRkMsQ0FBZjtBQUdEOztBQUVELGFBQU9GLElBQVA7QUFDRDs7O21DQUVjbFksTyxFQUFTK0osSyxFQUFPMkQsUSxFQUFVO0FBQ3ZDLFlBQU02RCxjQUFjLEdBQUcsRUFBdkI7QUFDQSxZQUFNQyxhQUFhLEdBQUcsRUFBdEI7O0FBRUEsVUFBSTlLLEtBQUssQ0FBQ0MsT0FBTixDQUFjM0csT0FBTyxDQUFDOEgsS0FBdEIsQ0FBSixFQUFrQztBQUNoQyxhQUFLLElBQUlBLEtBQVQsSUFBa0I5SCxPQUFPLENBQUM4SCxLQUExQixFQUFpQztBQUUvQjtBQUNBLGNBQUksQ0FBQ3BCLEtBQUssQ0FBQ0MsT0FBTixDQUFjbUIsS0FBZCxDQUFMLEVBQTJCO0FBQ3pCQSxZQUFBQSxLQUFLLEdBQUcsQ0FBQ0EsS0FBRCxDQUFSO0FBQ0Q7O0FBRUQsY0FDRTRGLFFBQVEsSUFDTGhILEtBQUssQ0FBQ0MsT0FBTixDQUFjbUIsS0FBZCxDQURILElBRUdBLEtBQUssQ0FBQyxDQUFELENBRlIsSUFHRyxFQUFFQSxLQUFLLENBQUMsQ0FBRCxDQUFMLFlBQW9CdkksV0FBdEIsQ0FISCxJQUlHLEVBQUUsT0FBT3VJLEtBQUssQ0FBQyxDQUFELENBQVosS0FBb0IsVUFBcEIsSUFBa0NBLEtBQUssQ0FBQyxDQUFELENBQUwsQ0FBUzlELFNBQVQsWUFBOEIxRSxLQUFsRSxDQUpILElBS0csRUFBRSxPQUFPd0ksS0FBSyxDQUFDLENBQUQsQ0FBTCxDQUFTaUMsS0FBaEIsS0FBMEIsVUFBMUIsSUFBd0NqQyxLQUFLLENBQUMsQ0FBRCxDQUFMLENBQVNpQyxLQUFULENBQWUvRixTQUFmLFlBQW9DMUUsS0FBOUUsQ0FMSCxJQU1HLEVBQUUsT0FBT3dJLEtBQUssQ0FBQyxDQUFELENBQVosS0FBb0IsUUFBcEIsSUFBZ0NpQyxLQUFoQyxJQUF5Q0EsS0FBSyxDQUFDTyxZQUFOLEtBQXVCdkksU0FBaEUsSUFBNkVnSSxLQUFLLENBQUNPLFlBQU4sQ0FBbUJ4QyxLQUFLLENBQUMsQ0FBRCxDQUF4QixDQUEvRSxDQVBMLEVBUUU7QUFDQTBKLFlBQUFBLGFBQWEsQ0FBQ3BOLElBQWQsQ0FBbUIsS0FBS2lILEtBQUwsQ0FBV3ZELEtBQVgsRUFBa0JpQyxLQUFsQixFQUF5QixJQUF6QixDQUFuQjtBQUNEOztBQUVELGNBQUkyRCxRQUFKLEVBQWM7QUFDWjtBQUNBO0FBQ0Esa0JBQU0ySyxpQkFBaUIsR0FBR3JZLE9BQU8sQ0FBQ2lGLFVBQVIsQ0FBbUJxVCxJQUFuQixDQUF3QkMsQ0FBQyxJQUFJN1IsS0FBSyxDQUFDQyxPQUFOLENBQWM0UixDQUFkLEtBQW9CQSxDQUFDLENBQUMsQ0FBRCxDQUFELEtBQVN6USxLQUFLLENBQUMsQ0FBRCxDQUFsQyxJQUF5Q3lRLENBQUMsQ0FBQyxDQUFELENBQXZFLENBQTFCOztBQUNBLGdCQUFJRixpQkFBSixFQUF1QjtBQUNyQixvQkFBTUcsU0FBUyxHQUFHLEtBQUtsVixlQUFMLENBQXFCeUcsS0FBSyxDQUFDMUosSUFBM0IsQ0FBbEI7QUFFQXlILGNBQUFBLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBVyxJQUFJNUksS0FBSyxDQUFDdVosR0FBVixDQUFjLEtBQUt0RyxpQkFBTCxDQUF1QnFHLFNBQXZCLEVBQWtDSCxpQkFBaUIsQ0FBQyxDQUFELENBQW5ELEVBQXdEclksT0FBeEQsS0FBb0VxWSxpQkFBaUIsQ0FBQyxDQUFELENBQW5HLENBQVg7QUFDRDtBQUNGOztBQUVEOUcsVUFBQUEsY0FBYyxDQUFDbk4sSUFBZixDQUFvQixLQUFLaUgsS0FBTCxDQUFXdkQsS0FBWCxFQUFrQmlDLEtBQWxCLEVBQXlCLElBQXpCLENBQXBCO0FBQ0Q7QUFDRixPQWpDRCxNQWlDTyxJQUFJL0osT0FBTyxDQUFDOEgsS0FBUixZQUF5QjVJLEtBQUssQ0FBQ3dGLGVBQW5DLEVBQW9EO0FBQ3pELGNBQU15RyxHQUFHLEdBQUcsS0FBS0UsS0FBTCxDQUFXckwsT0FBTyxDQUFDOEgsS0FBbkIsRUFBMEJpQyxLQUExQixFQUFpQyxJQUFqQyxDQUFaOztBQUNBLFlBQUkyRCxRQUFKLEVBQWM7QUFDWjhELFVBQUFBLGFBQWEsQ0FBQ3BOLElBQWQsQ0FBbUIrRyxHQUFuQjtBQUNEOztBQUNEb0csUUFBQUEsY0FBYyxDQUFDbk4sSUFBZixDQUFvQitHLEdBQXBCO0FBQ0QsT0FOTSxNQU1BO0FBQ0wsY0FBTSxJQUFJakwsS0FBSixDQUFVLHNFQUFWLENBQU47QUFDRDs7QUFFRCxhQUFPO0FBQUVxUixRQUFBQSxjQUFGO0FBQWtCQyxRQUFBQTtBQUFsQixPQUFQO0FBQ0Q7Ozs0Q0FFdUJ4UixPLEVBQVMrSixLLEVBQU85RSxVLEVBQVl5VCxNLEVBQVF0RyxXLEVBQWE7QUFDdkUsVUFBSXVHLFFBQVEsR0FBSSxVQUFTMVQsVUFBVSxDQUFDQyxJQUFYLENBQWdCLElBQWhCLENBQXNCLFNBQVF3VCxNQUFPLEVBQTlEOztBQUVBLFVBQUl0RyxXQUFKLEVBQWlCO0FBQ2Z1RyxRQUFBQSxRQUFRLElBQUssT0FBTXZHLFdBQVksRUFBL0I7QUFDRDs7QUFFRCxVQUFJcFMsT0FBTyxDQUFDNFksVUFBUixJQUFzQixLQUFLelksUUFBTCxDQUFjdUMsUUFBZCxDQUF1QmtXLFVBQWpELEVBQTZEO0FBQzNELGFBQUssTUFBTUMsSUFBWCxJQUFtQjdZLE9BQU8sQ0FBQzRZLFVBQTNCLEVBQXVDO0FBQ3JDLGNBQUkvWSxVQUFVLENBQUNnWixJQUFJLENBQUMxVixJQUFOLENBQWQsRUFBMkI7QUFDekJ3VixZQUFBQSxRQUFRLElBQUssSUFBRzlZLFVBQVUsQ0FBQ2daLElBQUksQ0FBQzFWLElBQU4sQ0FBWSxXQUFVMFYsSUFBSSxDQUFDbFgsTUFBTCxDQUFZdUUsR0FBWixDQUFnQjRTLFNBQVMsSUFBSSxLQUFLN1EsZ0JBQUwsQ0FBc0I2USxTQUF0QixDQUE3QixFQUErRDVULElBQS9ELENBQW9FLEdBQXBFLENBQXlFLEdBQXpIO0FBQ0Q7QUFDRjtBQUNGOztBQUVELGFBQU95VCxRQUFQO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztzQ0FDb0IzWSxPLEVBQVM7QUFDekIsVUFBSTJZLFFBQVEsR0FBRyxFQUFmO0FBRUE7O0FBQ0EsVUFBSTNZLE9BQU8sQ0FBQ3lRLE1BQVIsSUFBa0IsSUFBbEIsSUFBMEJ6USxPQUFPLENBQUMrRyxLQUFSLElBQWlCLElBQS9DLEVBQXFEO0FBQ25ENFIsUUFBQUEsUUFBUSxJQUFJLFlBQVksS0FBS2xVLE1BQUwsQ0FBWXpFLE9BQU8sQ0FBQ3lRLE1BQXBCLENBQVosR0FBMEMsSUFBMUMsR0FBaUQsY0FBN0Q7QUFDRCxPQUZELE1BRU8sSUFBSXpRLE9BQU8sQ0FBQytHLEtBQVIsSUFBaUIsSUFBckIsRUFBMkI7QUFDaEMsWUFBSS9HLE9BQU8sQ0FBQ3lRLE1BQVIsSUFBa0IsSUFBdEIsRUFBNEI7QUFDMUJrSSxVQUFBQSxRQUFRLElBQUksWUFBWSxLQUFLbFUsTUFBTCxDQUFZekUsT0FBTyxDQUFDeVEsTUFBcEIsQ0FBWixHQUEwQyxJQUExQyxHQUFpRCxLQUFLaE0sTUFBTCxDQUFZekUsT0FBTyxDQUFDK0csS0FBcEIsQ0FBN0Q7QUFDRCxTQUZELE1BRU87QUFDTDRSLFVBQUFBLFFBQVEsSUFBSSxZQUFZLEtBQUtsVSxNQUFMLENBQVl6RSxPQUFPLENBQUMrRyxLQUFwQixDQUF4QjtBQUNEO0FBQ0Y7QUFDRDs7O0FBRUEsYUFBTzRSLFFBQVA7QUFDRDs7OzBDQUVxQkksSSxFQUFNelksUyxFQUFXMFksTyxFQUFTaFosTyxFQUFTaVosTyxFQUFTO0FBQ2hFLFVBQUl6VCxNQUFKOztBQUVBLFVBQUl6QixNQUFNLENBQUNDLFNBQVAsQ0FBaUJDLGNBQWpCLENBQWdDQyxJQUFoQyxDQUFxQyxLQUFLZ1YsV0FBMUMsRUFBdURILElBQUksQ0FBQ0ksVUFBNUQsQ0FBSixFQUE2RTtBQUMzRUosUUFBQUEsSUFBSSxDQUFDSSxVQUFMLEdBQWtCLEtBQUtELFdBQUwsQ0FBaUJILElBQUksQ0FBQ0ksVUFBdEIsQ0FBbEI7QUFDRDs7QUFFRCxVQUFJSixJQUFJLFlBQVk3WixLQUFLLENBQUNrYSxLQUExQixFQUFpQztBQUMvQixZQUFJalYsS0FBSyxHQUFHNFUsSUFBSSxDQUFDTSxLQUFqQjtBQUNBLFlBQUk3VyxHQUFKOztBQUVBLFlBQUl1VyxJQUFJLENBQUN4VyxTQUFMLFlBQTBCckQsS0FBSyxDQUFDd0YsZUFBcEMsRUFBcUQ7QUFDbkRsQyxVQUFBQSxHQUFHLEdBQUcsS0FBS3dPLGtCQUFMLENBQXdCK0gsSUFBSSxDQUFDeFcsU0FBN0IsRUFBd0NqQyxTQUF4QyxFQUFtRDBZLE9BQW5ELEVBQTREaFosT0FBNUQsRUFBcUVpWixPQUFyRSxDQUFOO0FBQ0QsU0FGRCxNQUVPO0FBQ0x6VyxVQUFBQSxHQUFHLEdBQUksR0FBRSxLQUFLeEIsVUFBTCxDQUFnQitYLElBQUksQ0FBQ3hXLFNBQUwsQ0FBZWpELEtBQWYsQ0FBcUJlLElBQXJDLENBQTJDLElBQUcsS0FBS2lELGVBQUwsQ0FBcUJ5VixJQUFJLENBQUN4VyxTQUFMLENBQWVFLEtBQWYsSUFBd0JzVyxJQUFJLENBQUN4VyxTQUFMLENBQWUrSSxTQUE1RCxDQUF1RSxFQUE5SDtBQUNEOztBQUVELFlBQUluSCxLQUFLLElBQUlBLEtBQUssWUFBWWpGLEtBQUssQ0FBQ3dGLGVBQXBDLEVBQXFEO0FBQ25EUCxVQUFBQSxLQUFLLEdBQUcsS0FBSzZNLGtCQUFMLENBQXdCN00sS0FBeEIsRUFBK0I3RCxTQUEvQixFQUEwQzBZLE9BQTFDLEVBQW1EaFosT0FBbkQsRUFBNERpWixPQUE1RCxDQUFSOztBQUVBLGNBQUk5VSxLQUFLLEtBQUssTUFBZCxFQUFzQjtBQUNwQixnQkFBSTRVLElBQUksQ0FBQ0ksVUFBTCxLQUFvQixHQUF4QixFQUE2QjtBQUMzQkosY0FBQUEsSUFBSSxDQUFDSSxVQUFMLEdBQWtCLElBQWxCO0FBQ0Q7O0FBQ0QsZ0JBQUlKLElBQUksQ0FBQ0ksVUFBTCxLQUFvQixJQUF4QixFQUE4QjtBQUM1QkosY0FBQUEsSUFBSSxDQUFDSSxVQUFMLEdBQWtCLFFBQWxCO0FBQ0Q7QUFDRjs7QUFFRCxpQkFBTyxDQUFDM1csR0FBRCxFQUFNMkIsS0FBTixFQUFhZSxJQUFiLENBQW1CLElBQUc2VCxJQUFJLENBQUNJLFVBQVcsR0FBdEMsQ0FBUDtBQUNEOztBQUNELFlBQUlwYSxDQUFDLENBQUN5QixhQUFGLENBQWdCMkQsS0FBaEIsQ0FBSixFQUE0QjtBQUMxQixpQkFBTyxLQUFLd00sY0FBTCxDQUFvQm9JLElBQUksQ0FBQ3hXLFNBQXpCLEVBQW9DNEIsS0FBcEMsRUFBMkM7QUFDaEQ0RixZQUFBQSxLQUFLLEVBQUVpUDtBQUR5QyxXQUEzQyxDQUFQO0FBR0Q7O0FBQ0QsWUFBSSxPQUFPN1UsS0FBUCxLQUFpQixTQUFyQixFQUFnQztBQUM5QkEsVUFBQUEsS0FBSyxHQUFHLEtBQUttVixZQUFMLENBQWtCblYsS0FBbEIsQ0FBUjtBQUNELFNBRkQsTUFFTztBQUNMQSxVQUFBQSxLQUFLLEdBQUcsS0FBS00sTUFBTCxDQUFZTixLQUFaLENBQVI7QUFDRDs7QUFFRCxZQUFJQSxLQUFLLEtBQUssTUFBZCxFQUFzQjtBQUNwQixjQUFJNFUsSUFBSSxDQUFDSSxVQUFMLEtBQW9CLEdBQXhCLEVBQTZCO0FBQzNCSixZQUFBQSxJQUFJLENBQUNJLFVBQUwsR0FBa0IsSUFBbEI7QUFDRDs7QUFDRCxjQUFJSixJQUFJLENBQUNJLFVBQUwsS0FBb0IsSUFBeEIsRUFBOEI7QUFDNUJKLFlBQUFBLElBQUksQ0FBQ0ksVUFBTCxHQUFrQixRQUFsQjtBQUNEO0FBQ0Y7O0FBRUQsZUFBTyxDQUFDM1csR0FBRCxFQUFNMkIsS0FBTixFQUFhZSxJQUFiLENBQW1CLElBQUc2VCxJQUFJLENBQUNJLFVBQVcsR0FBdEMsQ0FBUDtBQUNEOztBQUNELFVBQUlKLElBQUksWUFBWTdaLEtBQUssQ0FBQ3NVLE9BQTFCLEVBQW1DO0FBQ2pDLGVBQU91RixJQUFJLENBQUNwRixHQUFaO0FBQ0Q7O0FBQ0QsVUFBSW9GLElBQUksWUFBWTdaLEtBQUssQ0FBQ3VVLElBQTFCLEVBQWdDO0FBQzlCLFlBQUlzRixJQUFJLENBQUNwRixHQUFMLFlBQW9CelUsS0FBSyxDQUFDd0YsZUFBOUIsRUFBK0M7QUFDN0NjLFVBQUFBLE1BQU0sR0FBRyxLQUFLa0MscUJBQUwsQ0FBMkJxUixJQUFJLENBQUNwRixHQUFoQyxFQUFxQ3JULFNBQXJDLEVBQWdEMFksT0FBaEQsRUFBeURoWixPQUF6RCxFQUFrRWlaLE9BQWxFLENBQVQ7QUFDRCxTQUZELE1BRU8sSUFBSWxhLENBQUMsQ0FBQ3lCLGFBQUYsQ0FBZ0J1WSxJQUFJLENBQUNwRixHQUFyQixDQUFKLEVBQStCO0FBQ3BDbk8sVUFBQUEsTUFBTSxHQUFHLEtBQUt3RCxlQUFMLENBQXFCK1AsSUFBSSxDQUFDcEYsR0FBMUIsQ0FBVDtBQUNELFNBRk0sTUFFQTtBQUNMbk8sVUFBQUEsTUFBTSxHQUFHLEtBQUtmLE1BQUwsQ0FBWXNVLElBQUksQ0FBQ3BGLEdBQWpCLENBQVQ7QUFDRDs7QUFFRCxlQUFRLFFBQU9uTyxNQUFPLE9BQU11VCxJQUFJLENBQUM1VixJQUFMLENBQVU0RixXQUFWLEVBQXdCLEdBQXBEO0FBQ0Q7O0FBQ0QsVUFBSWdRLElBQUksWUFBWTdaLEtBQUssQ0FBQ3dVLEVBQTFCLEVBQThCO0FBQzVCLGVBQVEsR0FBRXFGLElBQUksQ0FBQ1EsRUFBRyxJQUFHUixJQUFJLENBQUNTLElBQUwsQ0FBVXRULEdBQVYsQ0FBY3VULEdBQUcsSUFBSTtBQUN4QyxjQUFJQSxHQUFHLFlBQVl2YSxLQUFLLENBQUN3RixlQUF6QixFQUEwQztBQUN4QyxtQkFBTyxLQUFLZ0QscUJBQUwsQ0FBMkIrUixHQUEzQixFQUFnQ25aLFNBQWhDLEVBQTJDMFksT0FBM0MsRUFBb0RoWixPQUFwRCxFQUE2RGlaLE9BQTdELENBQVA7QUFDRDs7QUFDRCxjQUFJbGEsQ0FBQyxDQUFDeUIsYUFBRixDQUFnQmlaLEdBQWhCLENBQUosRUFBMEI7QUFDeEIsbUJBQU8sS0FBS3pRLGVBQUwsQ0FBcUJ5USxHQUFyQixDQUFQO0FBQ0Q7O0FBQ0QsaUJBQU8sS0FBS2hWLE1BQUwsQ0FBWWdWLEdBQVosQ0FBUDtBQUNELFNBUm9CLEVBUWxCdlUsSUFSa0IsQ0FRYixJQVJhLENBUVAsR0FSZDtBQVNEOztBQUNELFVBQUk2VCxJQUFJLFlBQVk3WixLQUFLLENBQUN1WixHQUExQixFQUErQjtBQUM3QixZQUFJL1IsS0FBSyxDQUFDQyxPQUFOLENBQWNvUyxJQUFJLENBQUNXLEdBQW5CLEtBQTJCLENBQUNWLE9BQWhDLEVBQXlDO0FBQ3ZDLGdCQUFNLElBQUk5WSxLQUFKLENBQVUsd0VBQVYsQ0FBTjtBQUNEOztBQUNELFlBQUk2WSxJQUFJLENBQUNXLEdBQUwsQ0FBU3pJLFVBQVQsQ0FBb0IsR0FBcEIsQ0FBSixFQUE4QjtBQUM1QixpQkFBTyxHQUFQO0FBQ0Q7O0FBQ0QsZUFBTyxLQUFLNUYsS0FBTCxDQUFXME4sSUFBSSxDQUFDVyxHQUFoQixFQUFxQlYsT0FBckIsQ0FBUDtBQUNEOztBQUNELGFBQU9ELElBQUksQ0FBQ2hZLFFBQUwsQ0FBYyxJQUFkLEVBQW9CaVksT0FBcEIsQ0FBUDtBQUNEOzs7K0JBRVVuUyxLLEVBQU83RyxPLEVBQVM7QUFDekIsWUFBTWdDLEtBQUssR0FBRyxLQUFLZ0gsZUFBTCxDQUFxQm5DLEtBQXJCLEVBQTRCN0csT0FBNUIsQ0FBZDs7QUFDQSxVQUFJZ0MsS0FBSyxJQUFJQSxLQUFLLENBQUNxQixNQUFuQixFQUEyQjtBQUN6QixlQUFRLFNBQVFyQixLQUFNLEVBQXRCO0FBQ0Q7O0FBQ0QsYUFBTyxFQUFQO0FBQ0Q7OztvQ0FFZTZFLEssRUFBTzdHLE8sRUFBUzJaLE8sRUFBUztBQUN2QyxVQUNFOVMsS0FBSyxLQUFLLElBQVYsSUFDQUEsS0FBSyxLQUFLOUUsU0FEVixJQUVBN0MsS0FBSyxDQUFDMGEsY0FBTixDQUFxQi9TLEtBQXJCLE1BQWdDLENBSGxDLEVBSUU7QUFDQTtBQUNBLGVBQU8sRUFBUDtBQUNEOztBQUVELFVBQUksT0FBT0EsS0FBUCxLQUFpQixRQUFyQixFQUErQjtBQUM3QixjQUFNLElBQUkzRyxLQUFKLENBQVUsd0RBQVYsQ0FBTjtBQUNEOztBQUVELFlBQU0yWixLQUFLLEdBQUcsRUFBZDtBQUVBRixNQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxLQUFyQjtBQUNBLFVBQUlBLE9BQU8sQ0FBQyxDQUFELENBQVAsS0FBZSxHQUFuQixFQUF3QkEsT0FBTyxHQUFJLElBQUdBLE9BQVEsR0FBdEI7O0FBRXhCLFVBQUk1YSxDQUFDLENBQUN5QixhQUFGLENBQWdCcUcsS0FBaEIsQ0FBSixFQUE0QjtBQUMxQjNILFFBQUFBLEtBQUssQ0FBQzRhLGNBQU4sQ0FBcUJqVCxLQUFyQixFQUE0QjRDLE9BQTVCLENBQW9Dc1EsSUFBSSxJQUFJO0FBQzFDLGdCQUFNclEsSUFBSSxHQUFHN0MsS0FBSyxDQUFDa1QsSUFBRCxDQUFsQjtBQUNBRixVQUFBQSxLQUFLLENBQUN6VixJQUFOLENBQVcsS0FBS3VNLGNBQUwsQ0FBb0JvSixJQUFwQixFQUEwQnJRLElBQTFCLEVBQWdDMUosT0FBaEMsQ0FBWDtBQUNELFNBSEQ7QUFJRCxPQUxELE1BS087QUFDTDZaLFFBQUFBLEtBQUssQ0FBQ3pWLElBQU4sQ0FBVyxLQUFLdU0sY0FBTCxDQUFvQjVPLFNBQXBCLEVBQStCOEUsS0FBL0IsRUFBc0M3RyxPQUF0QyxDQUFYO0FBQ0Q7O0FBRUQsYUFBTzZaLEtBQUssQ0FBQ3hXLE1BQU4sSUFBZ0J3VyxLQUFLLENBQUMxQixNQUFOLENBQWF6TyxJQUFJLElBQUlBLElBQUksSUFBSUEsSUFBSSxDQUFDckcsTUFBbEMsRUFBMEM2QixJQUExQyxDQUErQ3lVLE9BQS9DLENBQWhCLElBQTJFLEVBQWxGO0FBQ0Q7OzttQ0FFY25YLEcsRUFBSzJCLEssRUFBT25FLE9BQU8sR0FBRyxFLEVBQUk7QUFDdkMsVUFBSW1FLEtBQUssS0FBS3BDLFNBQWQsRUFBeUI7QUFDdkIsY0FBTSxJQUFJN0IsS0FBSixDQUFXLG9CQUFtQnNDLEdBQUksaUNBQWxDLENBQU47QUFDRDs7QUFFRCxVQUFJLE9BQU9BLEdBQVAsS0FBZSxRQUFmLElBQTJCQSxHQUFHLENBQUN5RCxRQUFKLENBQWEsR0FBYixDQUEzQixJQUFnRGpHLE9BQU8sQ0FBQytKLEtBQTVELEVBQW1FO0FBQ2pFLGNBQU1pUSxRQUFRLEdBQUd4WCxHQUFHLENBQUNpSSxLQUFKLENBQVUsR0FBVixDQUFqQjs7QUFDQSxZQUFJekssT0FBTyxDQUFDK0osS0FBUixDQUFjUSxhQUFkLENBQTRCeVAsUUFBUSxDQUFDLENBQUQsQ0FBcEMsS0FBNENoYSxPQUFPLENBQUMrSixLQUFSLENBQWNRLGFBQWQsQ0FBNEJ5UCxRQUFRLENBQUMsQ0FBRCxDQUFwQyxFQUF5QzdXLElBQXpDLFlBQXlEOUQsU0FBUyxDQUFDcUwsSUFBbkgsRUFBeUg7QUFDdkgsZ0JBQU11UCxHQUFHLEdBQUcsRUFBWjtBQUNBLGdCQUFNeFgsS0FBSyxHQUFHekMsT0FBTyxDQUFDK0osS0FBUixDQUFjUSxhQUFkLENBQTRCeVAsUUFBUSxDQUFDLENBQUQsQ0FBcEMsQ0FBZDs7QUFDQWpiLFVBQUFBLENBQUMsQ0FBQ3dWLEdBQUYsQ0FBTTBGLEdBQU4sRUFBV0QsUUFBUSxDQUFDblAsS0FBVCxDQUFlLENBQWYsQ0FBWCxFQUE4QjFHLEtBQTlCOztBQUNBLGlCQUFPLEtBQUt3TSxjQUFMLENBQW9CbE8sS0FBSyxDQUFDQSxLQUFOLElBQWV1WCxRQUFRLENBQUMsQ0FBRCxDQUEzQyxFQUFnREMsR0FBaEQsRUFBcURsVyxNQUFNLENBQUN3TCxNQUFQLENBQWM7QUFBRTlNLFlBQUFBO0FBQUYsV0FBZCxFQUF5QnpDLE9BQXpCLENBQXJELENBQVA7QUFDRDtBQUNGOztBQUVELFlBQU15QyxLQUFLLEdBQUcsS0FBS3lYLFVBQUwsQ0FBZ0IxWCxHQUFoQixFQUFxQnhDLE9BQXJCLENBQWQ7O0FBQ0EsWUFBTW1hLFNBQVMsR0FBRzFYLEtBQUssSUFBSUEsS0FBSyxDQUFDVSxJQUFmLElBQXVCbkQsT0FBTyxDQUFDbUQsSUFBakQ7O0FBRUEsWUFBTTNDLGFBQWEsR0FBR3pCLENBQUMsQ0FBQ3lCLGFBQUYsQ0FBZ0IyRCxLQUFoQixDQUF0Qjs7QUFDQSxZQUFNd0MsT0FBTyxHQUFHLENBQUNuRyxhQUFELElBQWtCa0csS0FBSyxDQUFDQyxPQUFOLENBQWN4QyxLQUFkLENBQWxDO0FBQ0EzQixNQUFBQSxHQUFHLEdBQUcsS0FBSzRYLGlCQUFMLElBQTBCLEtBQUtBLGlCQUFMLENBQXVCNVgsR0FBdkIsQ0FBMUIsSUFBeURBLEdBQS9EOztBQUNBLFVBQUloQyxhQUFKLEVBQW1CO0FBQ2pCMkQsUUFBQUEsS0FBSyxHQUFHLEtBQUtrVyxlQUFMLENBQXFCbFcsS0FBckIsQ0FBUjtBQUNEOztBQUNELFlBQU1zQyxTQUFTLEdBQUdqRyxhQUFhLElBQUl0QixLQUFLLENBQUM0YSxjQUFOLENBQXFCM1YsS0FBckIsQ0FBbkM7O0FBRUEsVUFBSTNCLEdBQUcsS0FBS1QsU0FBWixFQUF1QjtBQUNyQixZQUFJLE9BQU9vQyxLQUFQLEtBQWlCLFFBQXJCLEVBQStCO0FBQzdCLGlCQUFPQSxLQUFQO0FBQ0Q7O0FBRUQsWUFBSTNELGFBQWEsSUFBSWlHLFNBQVMsQ0FBQ3BELE1BQVYsS0FBcUIsQ0FBMUMsRUFBNkM7QUFDM0MsaUJBQU8sS0FBS3NOLGNBQUwsQ0FBb0JsSyxTQUFTLENBQUMsQ0FBRCxDQUE3QixFQUFrQ3RDLEtBQUssQ0FBQ3NDLFNBQVMsQ0FBQyxDQUFELENBQVYsQ0FBdkMsRUFBdUR6RyxPQUF2RCxDQUFQO0FBQ0Q7QUFDRjs7QUFFRCxVQUFJbUUsS0FBSyxLQUFLLElBQWQsRUFBb0I7QUFDbEIsY0FBTW1XLE9BQU8sR0FBR3RhLE9BQU8sQ0FBQzhCLFNBQVIsR0FBb0IsTUFBcEIsR0FBNkIsS0FBSzJDLE1BQUwsQ0FBWU4sS0FBWixFQUFtQjFCLEtBQW5CLENBQTdDO0FBQ0EsZUFBTyxLQUFLOFgsYUFBTCxDQUFtQi9YLEdBQW5CLEVBQXdCOFgsT0FBeEIsRUFBaUMsS0FBS3BCLFdBQUwsQ0FBaUJ2WixFQUFFLENBQUM2YSxFQUFwQixDQUFqQyxFQUEwRHhhLE9BQU8sQ0FBQ3dILE1BQWxFLENBQVA7QUFDRDs7QUFFRCxVQUFJLENBQUNyRCxLQUFMLEVBQVk7QUFDVixjQUFNbVcsT0FBTyxHQUFHdGEsT0FBTyxDQUFDOEIsU0FBUixHQUFvQixLQUFLOEMsTUFBTCxDQUFZVCxLQUFaLEVBQW1CMUIsS0FBbkIsRUFBMEJ6QyxPQUExQixFQUFtQ0EsT0FBTyxDQUFDOEIsU0FBM0MsQ0FBcEIsR0FBNEUsS0FBSzJDLE1BQUwsQ0FBWU4sS0FBWixFQUFtQjFCLEtBQW5CLENBQTVGO0FBQ0EsZUFBTyxLQUFLOFgsYUFBTCxDQUFtQi9YLEdBQW5CLEVBQXdCOFgsT0FBeEIsRUFBaUMsS0FBS3BCLFdBQUwsQ0FBaUJ2WixFQUFFLENBQUM4YSxFQUFwQixDQUFqQyxFQUEwRHphLE9BQU8sQ0FBQ3dILE1BQWxFLENBQVA7QUFDRDs7QUFFRCxVQUFJckQsS0FBSyxZQUFZakYsS0FBSyxDQUFDd0YsZUFBdkIsSUFBMEMsRUFBRWxDLEdBQUcsS0FBS1QsU0FBUixJQUFxQm9DLEtBQUssWUFBWWpGLEtBQUssQ0FBQ3dVLEVBQTlDLENBQTlDLEVBQWlHO0FBQy9GLGVBQU8sS0FBS2hNLHFCQUFMLENBQTJCdkQsS0FBM0IsQ0FBUDtBQUNELE9BaERzQyxDQWtEdkM7OztBQUNBLFVBQUkzQixHQUFHLEtBQUtULFNBQVIsSUFBcUI0RSxPQUF6QixFQUFrQztBQUNoQyxZQUFJekgsS0FBSyxDQUFDd2Isa0JBQU4sQ0FBeUJ2VyxLQUF6QixDQUFKLEVBQXFDO0FBQ25DM0IsVUFBQUEsR0FBRyxHQUFHN0MsRUFBRSxDQUFDa1ksR0FBVDtBQUNELFNBRkQsTUFFTztBQUNMLGdCQUFNLElBQUkzWCxLQUFKLENBQVUsMEVBQVYsQ0FBTjtBQUNEO0FBQ0Y7O0FBRUQsVUFBSXNDLEdBQUcsS0FBSzdDLEVBQUUsQ0FBQ2lXLEVBQVgsSUFBaUJwVCxHQUFHLEtBQUs3QyxFQUFFLENBQUNrWSxHQUE1QixJQUFtQ3JWLEdBQUcsS0FBSzdDLEVBQUUsQ0FBQ2diLEdBQWxELEVBQXVEO0FBQ3JELGVBQU8sS0FBS0MsZUFBTCxDQUFxQnBZLEdBQXJCLEVBQTBCMkIsS0FBMUIsRUFBaUNuRSxPQUFqQyxDQUFQO0FBQ0Q7O0FBR0QsVUFBSW1FLEtBQUssQ0FBQ3hFLEVBQUUsQ0FBQ2lXLEVBQUosQ0FBVCxFQUFrQjtBQUNoQixlQUFPLEtBQUtpRixVQUFMLENBQWdCLEtBQUszQixXQUFMLENBQWlCdlosRUFBRSxDQUFDaVcsRUFBcEIsQ0FBaEIsRUFBeUNwVCxHQUF6QyxFQUE4QzJCLEtBQUssQ0FBQ3hFLEVBQUUsQ0FBQ2lXLEVBQUosQ0FBbkQsRUFBNEQ1VixPQUE1RCxDQUFQO0FBQ0Q7O0FBRUQsVUFBSW1FLEtBQUssQ0FBQ3hFLEVBQUUsQ0FBQ2tZLEdBQUosQ0FBVCxFQUFtQjtBQUNqQixlQUFPLEtBQUtnRCxVQUFMLENBQWdCLEtBQUszQixXQUFMLENBQWlCdlosRUFBRSxDQUFDa1ksR0FBcEIsQ0FBaEIsRUFBMENyVixHQUExQyxFQUErQzJCLEtBQUssQ0FBQ3hFLEVBQUUsQ0FBQ2tZLEdBQUosQ0FBcEQsRUFBOEQ3WCxPQUE5RCxDQUFQO0FBQ0Q7O0FBRUQsVUFBSTJHLE9BQU8sSUFBSXdULFNBQVMsWUFBWTlhLFNBQVMsQ0FBQ3liLEtBQTlDLEVBQXFEO0FBQ25ELGNBQU1SLE9BQU8sR0FBR3RhLE9BQU8sQ0FBQzhCLFNBQVIsR0FBb0IsS0FBSzhDLE1BQUwsQ0FBWVQsS0FBWixFQUFtQjFCLEtBQW5CLEVBQTBCekMsT0FBMUIsRUFBbUNBLE9BQU8sQ0FBQzhCLFNBQTNDLENBQXBCLEdBQTRFLEtBQUsyQyxNQUFMLENBQVlOLEtBQVosRUFBbUIxQixLQUFuQixDQUE1RjtBQUNBLGVBQU8sS0FBSzhYLGFBQUwsQ0FBbUIvWCxHQUFuQixFQUF3QjhYLE9BQXhCLEVBQWlDLEtBQUtwQixXQUFMLENBQWlCdlosRUFBRSxDQUFDOGEsRUFBcEIsQ0FBakMsRUFBMER6YSxPQUFPLENBQUN3SCxNQUFsRSxDQUFQO0FBQ0Q7O0FBRUQsVUFBSWhILGFBQWEsSUFBSTJaLFNBQVMsWUFBWTlhLFNBQVMsQ0FBQ3FMLElBQWhELElBQXdEMUssT0FBTyxDQUFDK2EsSUFBUixLQUFpQixLQUE3RSxFQUFvRjtBQUNsRixlQUFPLEtBQUtDLFVBQUwsQ0FBZ0J4WSxHQUFoQixFQUFxQjJCLEtBQXJCLEVBQTRCbkUsT0FBNUIsQ0FBUDtBQUNELE9BL0VzQyxDQWdGdkM7OztBQUNBLFVBQUlRLGFBQWEsSUFBSWlHLFNBQVMsQ0FBQ3BELE1BQVYsR0FBbUIsQ0FBeEMsRUFBMkM7QUFDekMsZUFBTyxLQUFLd1gsVUFBTCxDQUFnQixLQUFLM0IsV0FBTCxDQUFpQnZaLEVBQUUsQ0FBQ2tZLEdBQXBCLENBQWhCLEVBQTBDclYsR0FBMUMsRUFBK0MyQixLQUEvQyxFQUFzRG5FLE9BQXRELENBQVA7QUFDRDs7QUFFRCxVQUFJMkcsT0FBSixFQUFhO0FBQ1gsZUFBTyxLQUFLc1UsNEJBQUwsQ0FBa0N6WSxHQUFsQyxFQUF1Q0MsS0FBdkMsRUFBOEM5QyxFQUFFLENBQUN1YixFQUFqRCxFQUFxRC9XLEtBQXJELEVBQTREbkUsT0FBNUQsQ0FBUDtBQUNEOztBQUNELFVBQUlRLGFBQUosRUFBbUI7QUFDakIsWUFBSSxLQUFLMFksV0FBTCxDQUFpQnpTLFNBQVMsQ0FBQyxDQUFELENBQTFCLENBQUosRUFBb0M7QUFDbEMsaUJBQU8sS0FBS3dVLDRCQUFMLENBQWtDelksR0FBbEMsRUFBdUNDLEtBQXZDLEVBQThDZ0UsU0FBUyxDQUFDLENBQUQsQ0FBdkQsRUFBNER0QyxLQUFLLENBQUNzQyxTQUFTLENBQUMsQ0FBRCxDQUFWLENBQWpFLEVBQWlGekcsT0FBakYsQ0FBUDtBQUNEOztBQUNELGVBQU8sS0FBS2liLDRCQUFMLENBQWtDelksR0FBbEMsRUFBdUNDLEtBQXZDLEVBQThDLEtBQUt5VyxXQUFMLENBQWlCdlosRUFBRSxDQUFDOGEsRUFBcEIsQ0FBOUMsRUFBdUV0VyxLQUF2RSxFQUE4RW5FLE9BQTlFLENBQVA7QUFDRDs7QUFFRCxVQUFJd0MsR0FBRyxLQUFLN0MsRUFBRSxDQUFDd1EsV0FBZixFQUE0QjtBQUMxQixjQUFNbUssT0FBTyxHQUFHdGEsT0FBTyxDQUFDOEIsU0FBUixHQUFvQixLQUFLOEMsTUFBTCxDQUFZVCxLQUFaLEVBQW1CMUIsS0FBbkIsRUFBMEJ6QyxPQUExQixFQUFtQ0EsT0FBTyxDQUFDOEIsU0FBM0MsQ0FBcEIsR0FBNEUsS0FBSzJDLE1BQUwsQ0FBWU4sS0FBWixFQUFtQjFCLEtBQW5CLENBQTVGO0FBQ0EsZUFBTyxLQUFLOFgsYUFBTCxDQUFtQixLQUFLckIsV0FBTCxDQUFpQjFXLEdBQWpCLENBQW5CLEVBQTBDOFgsT0FBMUMsRUFBbUQsS0FBS3BCLFdBQUwsQ0FBaUJ2WixFQUFFLENBQUM4YSxFQUFwQixDQUFuRCxFQUE0RXphLE9BQU8sQ0FBQ3dILE1BQXBGLENBQVA7QUFDRDs7QUFFRCxZQUFNOFMsT0FBTyxHQUFHdGEsT0FBTyxDQUFDOEIsU0FBUixHQUFvQixLQUFLOEMsTUFBTCxDQUFZVCxLQUFaLEVBQW1CMUIsS0FBbkIsRUFBMEJ6QyxPQUExQixFQUFtQ0EsT0FBTyxDQUFDOEIsU0FBM0MsQ0FBcEIsR0FBNEUsS0FBSzJDLE1BQUwsQ0FBWU4sS0FBWixFQUFtQjFCLEtBQW5CLENBQTVGO0FBQ0EsYUFBTyxLQUFLOFgsYUFBTCxDQUFtQi9YLEdBQW5CLEVBQXdCOFgsT0FBeEIsRUFBaUMsS0FBS3BCLFdBQUwsQ0FBaUJ2WixFQUFFLENBQUM4YSxFQUFwQixDQUFqQyxFQUEwRHphLE9BQU8sQ0FBQ3dILE1BQWxFLENBQVA7QUFDRDs7OytCQUVVaEYsRyxFQUFLeEMsTyxFQUFTO0FBQ3ZCLFVBQUlBLE9BQU8sQ0FBQ3lDLEtBQVosRUFBbUI7QUFDakIsZUFBT3pDLE9BQU8sQ0FBQ3lDLEtBQWY7QUFDRDs7QUFFRCxVQUFJekMsT0FBTyxDQUFDK0osS0FBUixJQUFpQi9KLE9BQU8sQ0FBQytKLEtBQVIsQ0FBY1EsYUFBL0IsSUFBZ0R2SyxPQUFPLENBQUMrSixLQUFSLENBQWNRLGFBQWQsQ0FBNEIvSCxHQUE1QixDQUFwRCxFQUFzRjtBQUNwRixlQUFPeEMsT0FBTyxDQUFDK0osS0FBUixDQUFjUSxhQUFkLENBQTRCL0gsR0FBNUIsQ0FBUDtBQUNEOztBQUVELFVBQUl4QyxPQUFPLENBQUMrSixLQUFSLElBQWlCL0osT0FBTyxDQUFDK0osS0FBUixDQUFjb1IscUJBQS9CLElBQXdEbmIsT0FBTyxDQUFDK0osS0FBUixDQUFjb1IscUJBQWQsQ0FBb0MzWSxHQUFwQyxDQUE1RCxFQUFzRztBQUNwRyxlQUFPeEMsT0FBTyxDQUFDK0osS0FBUixDQUFjb1IscUJBQWQsQ0FBb0MzWSxHQUFwQyxDQUFQO0FBQ0Q7QUFDRixLLENBRUQ7Ozs7b0NBQ2dCQSxHLEVBQUsyQixLLEVBQU9uRSxPLEVBQVM7QUFDbkMsWUFBTTJaLE9BQU8sR0FBR25YLEdBQUcsS0FBSzdDLEVBQUUsQ0FBQ2lXLEVBQVgsR0FBZ0IsS0FBS3NELFdBQUwsQ0FBaUJ2WixFQUFFLENBQUNpVyxFQUFwQixDQUFoQixHQUEwQyxLQUFLc0QsV0FBTCxDQUFpQnZaLEVBQUUsQ0FBQ2tZLEdBQXBCLENBQTFEO0FBQ0EsWUFBTXVELFlBQVksR0FBRzVZLEdBQUcsS0FBSzdDLEVBQUUsQ0FBQ2diLEdBQVgsR0FBaUIsTUFBakIsR0FBMEIsRUFBL0M7O0FBRUEsVUFBSWpVLEtBQUssQ0FBQ0MsT0FBTixDQUFjeEMsS0FBZCxDQUFKLEVBQTBCO0FBQ3hCQSxRQUFBQSxLQUFLLEdBQUdBLEtBQUssQ0FBQytCLEdBQU4sQ0FBVXdELElBQUksSUFBSTtBQUN4QixjQUFJMlIsU0FBUyxHQUFHLEtBQUtyUyxlQUFMLENBQXFCVSxJQUFyQixFQUEyQjFKLE9BQTNCLEVBQW9DLEtBQUtrWixXQUFMLENBQWlCdlosRUFBRSxDQUFDa1ksR0FBcEIsQ0FBcEMsQ0FBaEI7O0FBQ0EsY0FBSXdELFNBQVMsSUFBSUEsU0FBUyxDQUFDaFksTUFBdkIsS0FBa0NxRCxLQUFLLENBQUNDLE9BQU4sQ0FBYytDLElBQWQsS0FBdUIzSyxDQUFDLENBQUN5QixhQUFGLENBQWdCa0osSUFBaEIsQ0FBekQsS0FBbUZ4SyxLQUFLLENBQUMwYSxjQUFOLENBQXFCbFEsSUFBckIsSUFBNkIsQ0FBcEgsRUFBdUg7QUFDckgyUixZQUFBQSxTQUFTLEdBQUksSUFBR0EsU0FBVSxHQUExQjtBQUNEOztBQUNELGlCQUFPQSxTQUFQO0FBQ0QsU0FOTyxFQU1MbEQsTUFOSyxDQU1Fek8sSUFBSSxJQUFJQSxJQUFJLElBQUlBLElBQUksQ0FBQ3JHLE1BTnZCLENBQVI7QUFRQWMsUUFBQUEsS0FBSyxHQUFHQSxLQUFLLENBQUNkLE1BQU4sSUFBZ0JjLEtBQUssQ0FBQ2UsSUFBTixDQUFXeVUsT0FBWCxDQUF4QjtBQUNELE9BVkQsTUFVTztBQUNMeFYsUUFBQUEsS0FBSyxHQUFHLEtBQUs2RSxlQUFMLENBQXFCN0UsS0FBckIsRUFBNEJuRSxPQUE1QixFQUFxQzJaLE9BQXJDLENBQVI7QUFDRCxPQWhCa0MsQ0FpQm5DO0FBQ0E7OztBQUNBLFVBQUksQ0FBQ25YLEdBQUcsS0FBSzdDLEVBQUUsQ0FBQ2lXLEVBQVgsSUFBaUJwVCxHQUFHLEtBQUs3QyxFQUFFLENBQUNnYixHQUE3QixLQUFxQyxDQUFDeFcsS0FBMUMsRUFBaUQ7QUFDL0MsZUFBTyxPQUFQO0FBQ0Q7O0FBRUQsYUFBT0EsS0FBSyxHQUFJLEdBQUVpWCxZQUFhLElBQUdqWCxLQUFNLEdBQTVCLEdBQWlDcEMsU0FBN0M7QUFDRDs7OytCQUVVNFgsTyxFQUFTblgsRyxFQUFLMkIsSyxFQUFPbkUsTyxFQUFTO0FBQ3ZDLFVBQUlqQixDQUFDLENBQUN5QixhQUFGLENBQWdCMkQsS0FBaEIsQ0FBSixFQUE0QjtBQUMxQkEsUUFBQUEsS0FBSyxHQUFHakYsS0FBSyxDQUFDNGEsY0FBTixDQUFxQjNWLEtBQXJCLEVBQTRCK0IsR0FBNUIsQ0FBZ0M2VCxJQUFJLElBQUk7QUFDOUMsZ0JBQU1yUSxJQUFJLEdBQUd2RixLQUFLLENBQUM0VixJQUFELENBQWxCO0FBQ0EsaUJBQU8sS0FBS3BKLGNBQUwsQ0FBb0JuTyxHQUFwQixFQUF5QjtBQUFFLGFBQUN1WCxJQUFELEdBQVFyUTtBQUFWLFdBQXpCLEVBQTJDMUosT0FBM0MsQ0FBUDtBQUNELFNBSE8sQ0FBUjtBQUlELE9BTEQsTUFLTztBQUNMbUUsUUFBQUEsS0FBSyxHQUFHQSxLQUFLLENBQUMrQixHQUFOLENBQVV3RCxJQUFJLElBQUksS0FBS2lILGNBQUwsQ0FBb0JuTyxHQUFwQixFQUF5QmtILElBQXpCLEVBQStCMUosT0FBL0IsQ0FBbEIsQ0FBUjtBQUNEOztBQUVEbUUsTUFBQUEsS0FBSyxHQUFHQSxLQUFLLENBQUNnVSxNQUFOLENBQWF6TyxJQUFJLElBQUlBLElBQUksSUFBSUEsSUFBSSxDQUFDckcsTUFBbEMsQ0FBUjtBQUVBLGFBQU9jLEtBQUssQ0FBQ2QsTUFBTixHQUFnQixJQUFHYyxLQUFLLENBQUNlLElBQU4sQ0FBV3lVLE9BQVgsQ0FBb0IsR0FBdkMsR0FBNEM1WCxTQUFuRDtBQUNEOzs7K0JBRVVTLEcsRUFBSzJCLEssRUFBT25FLE8sRUFBUztBQUM5QixZQUFNNlosS0FBSyxHQUFHLEVBQWQ7QUFDQSxVQUFJeUIsT0FBTyxHQUFHLEtBQUtoWSxlQUFMLENBQXFCZCxHQUFyQixDQUFkOztBQUNBLFVBQUl4QyxPQUFPLENBQUN3SCxNQUFaLEVBQW9CO0FBQ2xCLFlBQUl4SCxPQUFPLENBQUN3SCxNQUFSLFlBQTBCdEksS0FBSyxDQUFDc1UsT0FBcEMsRUFBNkM7QUFDM0M4SCxVQUFBQSxPQUFPLEdBQUksR0FBRSxLQUFLNVQscUJBQUwsQ0FBMkIxSCxPQUFPLENBQUN3SCxNQUFuQyxDQUEyQyxJQUFHOFQsT0FBUSxFQUFuRTtBQUNELFNBRkQsTUFFTztBQUNMQSxVQUFBQSxPQUFPLEdBQUksR0FBRSxLQUFLdGEsVUFBTCxDQUFnQmhCLE9BQU8sQ0FBQ3dILE1BQXhCLENBQWdDLElBQUc4VCxPQUFRLEVBQXhEO0FBQ0Q7QUFDRjs7QUFFRHBjLE1BQUFBLEtBQUssQ0FBQ3FjLFlBQU4sQ0FBbUJwWCxLQUFuQixFQUEwQnNGLE9BQTFCLENBQWtDK1IsRUFBRSxJQUFJO0FBQ3RDLGNBQU0zVSxLQUFLLEdBQUc7QUFDWixXQUFDMlUsRUFBRCxHQUFNclgsS0FBSyxDQUFDcVgsRUFBRDtBQURDLFNBQWQ7QUFHQTNCLFFBQUFBLEtBQUssQ0FBQ3pWLElBQU4sQ0FBVyxLQUFLdU0sY0FBTCxDQUFvQm5PLEdBQXBCLEVBQXlCcUUsS0FBekIsRUFBZ0M5QyxNQUFNLENBQUN3TCxNQUFQLENBQWMsRUFBZCxFQUFrQnZQLE9BQWxCLEVBQTJCO0FBQUUrYSxVQUFBQSxJQUFJLEVBQUU7QUFBUixTQUEzQixDQUFoQyxDQUFYO0FBQ0QsT0FMRDs7QUFPQWhjLE1BQUFBLENBQUMsQ0FBQ2lILE1BQUYsQ0FBUzdCLEtBQVQsRUFBZ0IsQ0FBQ3VGLElBQUQsRUFBT3FRLElBQVAsS0FBZ0I7QUFDOUIsYUFBSzBCLGFBQUwsQ0FBbUI1QixLQUFuQixFQUEwQnlCLE9BQTFCLEVBQW1DdkIsSUFBbkMsRUFBeUNyUSxJQUF6QyxFQUErQyxDQUFDcVEsSUFBRCxDQUEvQztBQUNELE9BRkQ7O0FBSUEsWUFBTXZVLE1BQU0sR0FBR3FVLEtBQUssQ0FBQzNVLElBQU4sQ0FBVyxLQUFLZ1UsV0FBTCxDQUFpQnZaLEVBQUUsQ0FBQ2tZLEdBQXBCLENBQVgsQ0FBZjtBQUNBLGFBQU9nQyxLQUFLLENBQUN4VyxNQUFOLEdBQWUsQ0FBZixHQUFvQixJQUFHbUMsTUFBTyxHQUE5QixHQUFtQ0EsTUFBMUM7QUFDRDs7O2tDQUVhcVUsSyxFQUFPeUIsTyxFQUFTdkIsSSxFQUFNclEsSSxFQUFNa0IsSSxFQUFNO0FBQzlDLFVBQUk4USxJQUFKOztBQUVBLFVBQUk5USxJQUFJLENBQUNBLElBQUksQ0FBQ3ZILE1BQUwsR0FBYyxDQUFmLENBQUosQ0FBc0I0QyxRQUF0QixDQUErQixJQUEvQixDQUFKLEVBQTBDO0FBQ3hDLGNBQU1nVSxHQUFHLEdBQUdyUCxJQUFJLENBQUNBLElBQUksQ0FBQ3ZILE1BQUwsR0FBYyxDQUFmLENBQUosQ0FBc0JvSCxLQUF0QixDQUE0QixJQUE1QixDQUFaO0FBQ0FpUixRQUFBQSxJQUFJLEdBQUd6QixHQUFHLENBQUMsQ0FBRCxDQUFWO0FBQ0FyUCxRQUFBQSxJQUFJLENBQUNBLElBQUksQ0FBQ3ZILE1BQUwsR0FBYyxDQUFmLENBQUosR0FBd0I0VyxHQUFHLENBQUMsQ0FBRCxDQUEzQjtBQUNEOztBQUVELFlBQU0wQixPQUFPLEdBQUcsS0FBSzdRLHVCQUFMLENBQTZCd1EsT0FBN0IsRUFBc0MxUSxJQUF0QyxDQUFoQjs7QUFFQSxVQUFJN0wsQ0FBQyxDQUFDeUIsYUFBRixDQUFnQmtKLElBQWhCLENBQUosRUFBMkI7QUFDekJ4SyxRQUFBQSxLQUFLLENBQUNxYyxZQUFOLENBQW1CN1IsSUFBbkIsRUFBeUJELE9BQXpCLENBQWlDK1IsRUFBRSxJQUFJO0FBQ3JDLGdCQUFNclgsS0FBSyxHQUFHLEtBQUt5WCxZQUFMLENBQWtCbFMsSUFBSSxDQUFDOFIsRUFBRCxDQUF0QixDQUFkOztBQUNBM0IsVUFBQUEsS0FBSyxDQUFDelYsSUFBTixDQUFXLEtBQUt1TSxjQUFMLENBQW9CLEtBQUtrTCxRQUFMLENBQWNGLE9BQWQsRUFBdUJ4WCxLQUF2QixFQUE4QnVYLElBQTlCLENBQXBCLEVBQXlEO0FBQUUsYUFBQ0YsRUFBRCxHQUFNclg7QUFBUixXQUF6RCxDQUFYO0FBQ0QsU0FIRDs7QUFJQXBGLFFBQUFBLENBQUMsQ0FBQ2lILE1BQUYsQ0FBUzBELElBQVQsRUFBZSxDQUFDdkYsS0FBRCxFQUFRMlgsUUFBUixLQUFxQjtBQUNsQyxlQUFLTCxhQUFMLENBQW1CNUIsS0FBbkIsRUFBMEJ5QixPQUExQixFQUFtQ1EsUUFBbkMsRUFBNkMzWCxLQUE3QyxFQUFvRHlHLElBQUksQ0FBQ3ZDLE1BQUwsQ0FBWSxDQUFDeVQsUUFBRCxDQUFaLENBQXBEO0FBQ0QsU0FGRDs7QUFJQTtBQUNEOztBQUVEcFMsTUFBQUEsSUFBSSxHQUFHLEtBQUtrUyxZQUFMLENBQWtCbFMsSUFBbEIsQ0FBUDtBQUNBbVEsTUFBQUEsS0FBSyxDQUFDelYsSUFBTixDQUFXLEtBQUt1TSxjQUFMLENBQW9CLEtBQUtrTCxRQUFMLENBQWNGLE9BQWQsRUFBdUJqUyxJQUF2QixFQUE2QmdTLElBQTdCLENBQXBCLEVBQXdEO0FBQUUsU0FBQy9iLEVBQUUsQ0FBQzhhLEVBQUosR0FBUy9RO0FBQVgsT0FBeEQsQ0FBWDtBQUNEOzs7aUNBRVl2RixLLEVBQU87QUFDbEIsYUFBT0EsS0FBUDtBQUNEOzs7NkJBRVEzQixHLEVBQUsyQixLLEVBQU91WCxJLEVBQU1YLEksRUFBTTtBQUMvQlcsTUFBQUEsSUFBSSxHQUFHQSxJQUFJLElBQUksS0FBS0ssWUFBTCxDQUFrQnJWLEtBQUssQ0FBQ0MsT0FBTixDQUFjeEMsS0FBZCxJQUF1QkEsS0FBSyxDQUFDLENBQUQsQ0FBNUIsR0FBa0NBLEtBQXBELENBQWY7O0FBQ0EsVUFBSXVYLElBQUosRUFBVTtBQUNSLGVBQU8sSUFBSXhjLEtBQUssQ0FBQ3NVLE9BQVYsQ0FBa0IsS0FBSzlMLHFCQUFMLENBQTJCLElBQUl4SSxLQUFLLENBQUN1VSxJQUFWLENBQWUsSUFBSXZVLEtBQUssQ0FBQ3NVLE9BQVYsQ0FBa0JoUixHQUFsQixDQUFmLEVBQXVDa1osSUFBdkMsRUFBNkNYLElBQTdDLENBQTNCLENBQWxCLENBQVA7QUFDRDs7QUFFRCxhQUFPLElBQUk3YixLQUFLLENBQUNzVSxPQUFWLENBQWtCaFIsR0FBbEIsQ0FBUDtBQUNEOzs7aUNBRVkyQixLLEVBQU87QUFDbEIsVUFBSSxPQUFPQSxLQUFQLEtBQWlCLFFBQXJCLEVBQStCO0FBQzdCLGVBQU8sa0JBQVA7QUFDRDs7QUFDRCxVQUFJQSxLQUFLLFlBQVk2WCxJQUFyQixFQUEyQjtBQUN6QixlQUFPLGFBQVA7QUFDRDs7QUFDRCxVQUFJLE9BQU83WCxLQUFQLEtBQWlCLFNBQXJCLEVBQWdDO0FBQzlCLGVBQU8sU0FBUDtBQUNEOztBQUNEO0FBQ0Q7OztrQ0FFYTNCLEcsRUFBSzJCLEssRUFBT2dWLFUsRUFBWTNSLE0sRUFBUTtBQUM1QyxVQUFJLENBQUNoRixHQUFMLEVBQVU7QUFDUixlQUFPMkIsS0FBUDtBQUNEOztBQUNELFVBQUlnVixVQUFVLEtBQUtwWCxTQUFuQixFQUE4QjtBQUM1QixjQUFNLElBQUk3QixLQUFKLENBQVcsR0FBRXNDLEdBQUksUUFBTzJCLEtBQU0sb0JBQTlCLENBQU47QUFDRDs7QUFDRDNCLE1BQUFBLEdBQUcsR0FBRyxLQUFLeVosV0FBTCxDQUFpQnpaLEdBQWpCLEVBQXNCZ0YsTUFBdEIsQ0FBTjtBQUNBLGFBQU8sQ0FBQ2hGLEdBQUQsRUFBTTJCLEtBQU4sRUFBYWUsSUFBYixDQUFtQixJQUFHaVUsVUFBVyxHQUFqQyxDQUFQO0FBQ0Q7OztnQ0FFVzNXLEcsRUFBS2dGLE0sRUFBUTtBQUN2QixVQUFJaEYsR0FBRyxZQUFZdEQsS0FBSyxDQUFDd0YsZUFBekIsRUFBMEM7QUFDeENsQyxRQUFBQSxHQUFHLEdBQUcsS0FBS2tGLHFCQUFMLENBQTJCbEYsR0FBM0IsQ0FBTjtBQUNBLGVBQU8sS0FBSzBaLFVBQUwsQ0FBZ0IsS0FBS3hVLHFCQUFMLENBQTJCbEYsR0FBM0IsQ0FBaEIsRUFBaURnRixNQUFqRCxDQUFQO0FBQ0Q7O0FBRUQsVUFBSXRJLEtBQUssQ0FBQ2lkLFdBQU4sQ0FBa0IzWixHQUFsQixDQUFKLEVBQTRCO0FBQzFCQSxRQUFBQSxHQUFHLEdBQUdBLEdBQUcsQ0FBQzRaLE1BQUosQ0FBVyxDQUFYLEVBQWM1WixHQUFHLENBQUNhLE1BQUosR0FBYSxDQUEzQixFQUE4Qm9ILEtBQTlCLENBQW9DLEdBQXBDLENBQU47O0FBRUEsWUFBSWpJLEdBQUcsQ0FBQ2EsTUFBSixHQUFhLENBQWpCLEVBQW9CO0FBQ2xCYixVQUFBQSxHQUFHLEdBQUcsQ0FDSjtBQUNBQSxVQUFBQSxHQUFHLENBQUNxSSxLQUFKLENBQVUsQ0FBVixFQUFhLENBQUMsQ0FBZCxFQUFpQjNGLElBQWpCLENBQXNCLElBQXRCLENBRkksRUFHSjFDLEdBQUcsQ0FBQ0EsR0FBRyxDQUFDYSxNQUFKLEdBQWEsQ0FBZCxDQUhDLENBQU47QUFLRDs7QUFFRCxlQUFPYixHQUFHLENBQUMwRCxHQUFKLENBQVF5RSxVQUFVLElBQUksS0FBS3JILGVBQUwsQ0FBcUJxSCxVQUFyQixDQUF0QixFQUF3RHpGLElBQXhELENBQTZELEdBQTdELENBQVA7QUFDRDs7QUFFRCxhQUFPLEtBQUtnWCxVQUFMLENBQWdCLEtBQUs1WSxlQUFMLENBQXFCZCxHQUFyQixDQUFoQixFQUEyQ2dGLE1BQTNDLENBQVA7QUFDRDs7OytCQUVVaEYsRyxFQUFLZ0YsTSxFQUFRO0FBQ3RCLFVBQUlBLE1BQUosRUFBWTtBQUNWLFlBQUlBLE1BQU0sWUFBWXRJLEtBQUssQ0FBQ3NVLE9BQTVCLEVBQXFDO0FBQ25DLGlCQUFPLENBQUMsS0FBSzlMLHFCQUFMLENBQTJCRixNQUEzQixDQUFELEVBQXFDaEYsR0FBckMsRUFBMEMwQyxJQUExQyxDQUErQyxHQUEvQyxDQUFQO0FBQ0Q7O0FBRUQsZUFBTyxDQUFDLEtBQUtsRSxVQUFMLENBQWdCd0csTUFBaEIsQ0FBRCxFQUEwQmhGLEdBQTFCLEVBQStCMEMsSUFBL0IsQ0FBb0MsR0FBcEMsQ0FBUDtBQUNEOztBQUVELGFBQU8xQyxHQUFQO0FBQ0Q7OztpREFFNEJBLEcsRUFBS0MsSyxFQUFPc1gsSSxFQUFNNVYsSyxFQUFPbkUsTyxFQUFTO0FBQzdELFVBQUkrWixJQUFJLEtBQUtwYSxFQUFFLENBQUNnYixHQUFoQixFQUFxQjtBQUNuQixZQUFJalUsS0FBSyxDQUFDQyxPQUFOLENBQWN4QyxLQUFkLENBQUosRUFBMEI7QUFDeEI0VixVQUFBQSxJQUFJLEdBQUdwYSxFQUFFLENBQUMwYyxLQUFWO0FBQ0QsU0FGRCxNQUVPLElBQUlsWSxLQUFLLEtBQUssSUFBVixJQUFrQkEsS0FBSyxLQUFLLElBQTVCLElBQW9DQSxLQUFLLEtBQUssS0FBbEQsRUFBeUQ7QUFDOUQ0VixVQUFBQSxJQUFJLEdBQUdwYSxFQUFFLENBQUMyYyxFQUFWO0FBQ0Q7QUFDRjs7QUFFRCxVQUFJbkQsVUFBVSxHQUFHLEtBQUtELFdBQUwsQ0FBaUJhLElBQWpCLEtBQTBCLEtBQUtiLFdBQUwsQ0FBaUJ2WixFQUFFLENBQUM4YSxFQUFwQixDQUEzQzs7QUFFQSxjQUFRVixJQUFSO0FBQ0UsYUFBS3BhLEVBQUUsQ0FBQ3ViLEVBQVI7QUFDQSxhQUFLdmIsRUFBRSxDQUFDMGMsS0FBUjtBQUNFLGNBQUlsWSxLQUFLLFlBQVlqRixLQUFLLENBQUNzVSxPQUEzQixFQUFvQztBQUNsQyxtQkFBTyxLQUFLK0csYUFBTCxDQUFtQi9YLEdBQW5CLEVBQXdCMkIsS0FBSyxDQUFDd1AsR0FBOUIsRUFBbUN3RixVQUFuQyxFQUErQ25aLE9BQU8sQ0FBQ3dILE1BQXZELENBQVA7QUFDRDs7QUFFRCxjQUFJckQsS0FBSyxDQUFDZCxNQUFWLEVBQWtCO0FBQ2hCLG1CQUFPLEtBQUtrWCxhQUFMLENBQW1CL1gsR0FBbkIsRUFBeUIsSUFBRzJCLEtBQUssQ0FBQytCLEdBQU4sQ0FBVXdELElBQUksSUFBSSxLQUFLakYsTUFBTCxDQUFZaUYsSUFBWixFQUFrQmpILEtBQWxCLENBQWxCLEVBQTRDeUMsSUFBNUMsQ0FBaUQsSUFBakQsQ0FBdUQsR0FBbkYsRUFBdUZpVSxVQUF2RixFQUFtR25aLE9BQU8sQ0FBQ3dILE1BQTNHLENBQVA7QUFDRDs7QUFFRCxjQUFJMlIsVUFBVSxLQUFLLEtBQUtELFdBQUwsQ0FBaUJ2WixFQUFFLENBQUN1YixFQUFwQixDQUFuQixFQUE0QztBQUMxQyxtQkFBTyxLQUFLWCxhQUFMLENBQW1CL1gsR0FBbkIsRUFBd0IsUUFBeEIsRUFBa0MyVyxVQUFsQyxFQUE4Q25aLE9BQU8sQ0FBQ3dILE1BQXRELENBQVA7QUFDRDs7QUFFRCxpQkFBTyxFQUFQOztBQUNGLGFBQUs3SCxFQUFFLENBQUM0YyxHQUFSO0FBQ0EsYUFBSzVjLEVBQUUsQ0FBQzZjLEdBQVI7QUFDRXJELFVBQUFBLFVBQVUsR0FBSSxHQUFFLEtBQUtELFdBQUwsQ0FBaUJ2WixFQUFFLENBQUM4YSxFQUFwQixDQUF3QixJQUFHdEIsVUFBVyxFQUF0RDs7QUFDQSxjQUFJaFYsS0FBSyxDQUFDeEUsRUFBRSxDQUFDZ0MsTUFBSixDQUFULEVBQXNCO0FBQ3BCLG1CQUFPLEtBQUs0WSxhQUFMLENBQW1CL1gsR0FBbkIsRUFBeUIsV0FBVTJCLEtBQUssQ0FBQ3hFLEVBQUUsQ0FBQ2dDLE1BQUosQ0FBTCxDQUFpQnVFLEdBQWpCLENBQXFCd0QsSUFBSSxJQUFLLElBQUcsS0FBS2pGLE1BQUwsQ0FBWWlGLElBQVosQ0FBa0IsR0FBbkQsRUFBdUR4RSxJQUF2RCxDQUE0RCxJQUE1RCxDQUFrRSxHQUFyRyxFQUF5R2lVLFVBQXpHLEVBQXFIblosT0FBTyxDQUFDd0gsTUFBN0gsQ0FBUDtBQUNEOztBQUVELGlCQUFPLEtBQUsrUyxhQUFMLENBQW1CL1gsR0FBbkIsRUFBeUIsSUFBRyxLQUFLaUMsTUFBTCxDQUFZTixLQUFaLEVBQW1CMUIsS0FBbkIsQ0FBMEIsR0FBdEQsRUFBMEQwVyxVQUExRCxFQUFzRW5aLE9BQU8sQ0FBQ3dILE1BQTlFLENBQVA7O0FBQ0YsYUFBSzdILEVBQUUsQ0FBQzhjLE9BQVI7QUFDQSxhQUFLOWMsRUFBRSxDQUFDK2MsVUFBUjtBQUNFLGlCQUFPLEtBQUtuQyxhQUFMLENBQW1CL1gsR0FBbkIsRUFBeUIsR0FBRSxLQUFLaUMsTUFBTCxDQUFZTixLQUFLLENBQUMsQ0FBRCxDQUFqQixFQUFzQjFCLEtBQXRCLENBQTZCLFFBQU8sS0FBS2dDLE1BQUwsQ0FBWU4sS0FBSyxDQUFDLENBQUQsQ0FBakIsRUFBc0IxQixLQUF0QixDQUE2QixFQUE1RixFQUErRjBXLFVBQS9GLEVBQTJHblosT0FBTyxDQUFDd0gsTUFBbkgsQ0FBUDs7QUFDRixhQUFLN0gsRUFBRSxDQUFDNEwsR0FBUjtBQUNFLGdCQUFNLElBQUlyTCxLQUFKLENBQVUscUZBQVYsQ0FBTjs7QUFDRixhQUFLUCxFQUFFLENBQUMrWixHQUFSO0FBQ0VQLFVBQUFBLFVBQVUsR0FBRyxLQUFLRCxXQUFMLENBQWlCdlosRUFBRSxDQUFDOGEsRUFBcEIsQ0FBYjtBQUNBdFcsVUFBQUEsS0FBSyxHQUFHQSxLQUFLLENBQUNzRyxLQUFOLENBQVksR0FBWixDQUFSOztBQUVBLGNBQUl0RyxLQUFLLENBQUNkLE1BQU4sR0FBZSxDQUFuQixFQUFzQjtBQUNwQmMsWUFBQUEsS0FBSyxHQUFHLENBQ047QUFDQUEsWUFBQUEsS0FBSyxDQUFDMEcsS0FBTixDQUFZLENBQVosRUFBZSxDQUFDLENBQWhCLEVBQW1CM0YsSUFBbkIsQ0FBd0IsSUFBeEIsQ0FGTSxFQUdOZixLQUFLLENBQUNBLEtBQUssQ0FBQ2QsTUFBTixHQUFlLENBQWhCLENBSEMsQ0FBUjtBQUtEOztBQUVELGlCQUFPLEtBQUtrWCxhQUFMLENBQW1CL1gsR0FBbkIsRUFBd0IyQixLQUFLLENBQUMrQixHQUFOLENBQVV5RSxVQUFVLElBQUksS0FBS3JILGVBQUwsQ0FBcUJxSCxVQUFyQixDQUF4QixFQUEwRHpGLElBQTFELENBQStELEdBQS9ELENBQXhCLEVBQTZGaVUsVUFBN0YsRUFBeUduWixPQUFPLENBQUN3SCxNQUFqSCxDQUFQOztBQUNGLGFBQUs3SCxFQUFFLENBQUNzUixVQUFSO0FBQ0VrSSxVQUFBQSxVQUFVLEdBQUcsS0FBS0QsV0FBTCxDQUFpQnZaLEVBQUUsQ0FBQ2dkLElBQXBCLENBQWI7QUFDQSxpQkFBTyxLQUFLcEMsYUFBTCxDQUFtQi9YLEdBQW5CLEVBQXdCLEtBQUtpQyxNQUFMLENBQWEsR0FBRU4sS0FBTSxHQUFyQixDQUF4QixFQUFrRGdWLFVBQWxELEVBQThEblosT0FBTyxDQUFDd0gsTUFBdEUsQ0FBUDs7QUFDRixhQUFLN0gsRUFBRSxDQUFDaWQsUUFBUjtBQUNFekQsVUFBQUEsVUFBVSxHQUFHLEtBQUtELFdBQUwsQ0FBaUJ2WixFQUFFLENBQUNnZCxJQUFwQixDQUFiO0FBQ0EsaUJBQU8sS0FBS3BDLGFBQUwsQ0FBbUIvWCxHQUFuQixFQUF3QixLQUFLaUMsTUFBTCxDQUFhLElBQUdOLEtBQU0sRUFBdEIsQ0FBeEIsRUFBa0RnVixVQUFsRCxFQUE4RG5aLE9BQU8sQ0FBQ3dILE1BQXRFLENBQVA7O0FBQ0YsYUFBSzdILEVBQUUsQ0FBQ2tkLFNBQVI7QUFDRTFELFVBQUFBLFVBQVUsR0FBRyxLQUFLRCxXQUFMLENBQWlCdlosRUFBRSxDQUFDZ2QsSUFBcEIsQ0FBYjtBQUNBLGlCQUFPLEtBQUtwQyxhQUFMLENBQW1CL1gsR0FBbkIsRUFBd0IsS0FBS2lDLE1BQUwsQ0FBYSxJQUFHTixLQUFNLEdBQXRCLENBQXhCLEVBQW1EZ1YsVUFBbkQsRUFBK0RuWixPQUFPLENBQUN3SCxNQUF2RSxDQUFQO0FBbERKOztBQXFEQSxZQUFNc1YsYUFBYSxHQUFHO0FBQ3BCQyxRQUFBQSxhQUFhLEVBQUU1RCxVQUFVLENBQUNsVCxRQUFYLENBQW9CLEtBQUtpVCxXQUFMLENBQWlCdlosRUFBRSxDQUFDZ2QsSUFBcEIsQ0FBcEI7QUFESyxPQUF0Qjs7QUFJQSxVQUFJNWQsQ0FBQyxDQUFDeUIsYUFBRixDQUFnQjJELEtBQWhCLENBQUosRUFBNEI7QUFDMUIsWUFBSUEsS0FBSyxDQUFDeEUsRUFBRSxDQUFDK1osR0FBSixDQUFULEVBQW1CO0FBQ2pCLGlCQUFPLEtBQUthLGFBQUwsQ0FBbUIvWCxHQUFuQixFQUF3QixLQUFLbU8sY0FBTCxDQUFvQixJQUFwQixFQUEwQnhNLEtBQTFCLENBQXhCLEVBQTBEZ1YsVUFBMUQsRUFBc0VuWixPQUFPLENBQUN3SCxNQUE5RSxDQUFQO0FBQ0Q7O0FBQ0QsWUFBSXJELEtBQUssQ0FBQ3hFLEVBQUUsQ0FBQzRjLEdBQUosQ0FBVCxFQUFtQjtBQUNqQk8sVUFBQUEsYUFBYSxDQUFDdlEsTUFBZCxHQUF1QixJQUF2QjtBQUNBLGlCQUFPLEtBQUtnTyxhQUFMLENBQW1CL1gsR0FBbkIsRUFBeUIsSUFBRyxLQUFLaUMsTUFBTCxDQUFZTixLQUFLLENBQUN4RSxFQUFFLENBQUM0YyxHQUFKLENBQWpCLEVBQTJCOVosS0FBM0IsRUFBa0NxYSxhQUFsQyxDQUFpRCxHQUE3RSxFQUFrRixHQUFFM0QsVUFBVyxJQUFHLEtBQUtELFdBQUwsQ0FBaUJ2WixFQUFFLENBQUM0YyxHQUFwQixDQUF5QixFQUEzSCxFQUE4SHZjLE9BQU8sQ0FBQ3dILE1BQXRJLENBQVA7QUFDRDs7QUFDRCxZQUFJckQsS0FBSyxDQUFDeEUsRUFBRSxDQUFDNmMsR0FBSixDQUFULEVBQW1CO0FBQ2pCTSxVQUFBQSxhQUFhLENBQUN2USxNQUFkLEdBQXVCLElBQXZCO0FBQ0EsaUJBQU8sS0FBS2dPLGFBQUwsQ0FBbUIvWCxHQUFuQixFQUF5QixJQUFHLEtBQUtpQyxNQUFMLENBQVlOLEtBQUssQ0FBQ3hFLEVBQUUsQ0FBQzZjLEdBQUosQ0FBakIsRUFBMkIvWixLQUEzQixFQUFrQ3FhLGFBQWxDLENBQWlELEdBQTdFLEVBQWtGLEdBQUUzRCxVQUFXLElBQUcsS0FBS0QsV0FBTCxDQUFpQnZaLEVBQUUsQ0FBQzZjLEdBQXBCLENBQXlCLEVBQTNILEVBQThIeGMsT0FBTyxDQUFDd0gsTUFBdEksQ0FBUDtBQUNEO0FBQ0Y7O0FBRUQsVUFBSXJELEtBQUssS0FBSyxJQUFWLElBQWtCZ1YsVUFBVSxLQUFLLEtBQUtELFdBQUwsQ0FBaUJ2WixFQUFFLENBQUM4YSxFQUFwQixDQUFyQyxFQUE4RDtBQUM1RCxlQUFPLEtBQUtGLGFBQUwsQ0FBbUIvWCxHQUFuQixFQUF3QixLQUFLaUMsTUFBTCxDQUFZTixLQUFaLEVBQW1CMUIsS0FBbkIsRUFBMEJxYSxhQUExQixDQUF4QixFQUFrRSxLQUFLNUQsV0FBTCxDQUFpQnZaLEVBQUUsQ0FBQzZhLEVBQXBCLENBQWxFLEVBQTJGeGEsT0FBTyxDQUFDd0gsTUFBbkcsQ0FBUDtBQUNEOztBQUNELFVBQUlyRCxLQUFLLEtBQUssSUFBVixJQUFrQmdWLFVBQVUsS0FBSyxLQUFLRCxXQUFMLENBQWlCdlosRUFBRSxDQUFDMmMsRUFBcEIsQ0FBckMsRUFBOEQ7QUFDNUQsZUFBTyxLQUFLL0IsYUFBTCxDQUFtQi9YLEdBQW5CLEVBQXdCLEtBQUtpQyxNQUFMLENBQVlOLEtBQVosRUFBbUIxQixLQUFuQixFQUEwQnFhLGFBQTFCLENBQXhCLEVBQWtFLEtBQUs1RCxXQUFMLENBQWlCdlosRUFBRSxDQUFDZ2IsR0FBcEIsQ0FBbEUsRUFBNEYzYSxPQUFPLENBQUN3SCxNQUFwRyxDQUFQO0FBQ0Q7O0FBRUQsYUFBTyxLQUFLK1MsYUFBTCxDQUFtQi9YLEdBQW5CLEVBQXdCLEtBQUtpQyxNQUFMLENBQVlOLEtBQVosRUFBbUIxQixLQUFuQixFQUEwQnFhLGFBQTFCLENBQXhCLEVBQWtFM0QsVUFBbEUsRUFBOEVuWixPQUFPLENBQUN3SCxNQUF0RixDQUFQO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTs7Ozt1Q0FDcUJ1UixJLEVBQU16WSxTLEVBQVcwWSxPLEVBQVNoWixPLEVBQVNpWixPLEVBQVM7QUFDN0QsWUFBTXBTLEtBQUssR0FBRyxFQUFkOztBQUVBLFVBQUlILEtBQUssQ0FBQ0MsT0FBTixDQUFjckcsU0FBZCxDQUFKLEVBQThCO0FBQzVCQSxRQUFBQSxTQUFTLEdBQUdBLFNBQVMsQ0FBQyxDQUFELENBQXJCOztBQUNBLFlBQUlvRyxLQUFLLENBQUNDLE9BQU4sQ0FBY3JHLFNBQWQsQ0FBSixFQUE4QjtBQUM1QkEsVUFBQUEsU0FBUyxHQUFHQSxTQUFTLENBQUMsQ0FBRCxDQUFyQjtBQUNEO0FBQ0Y7O0FBRUROLE1BQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCOztBQUVBLFVBQUlpWixPQUFPLEtBQUtsWCxTQUFoQixFQUEyQjtBQUN6QmtYLFFBQUFBLE9BQU8sR0FBRyxJQUFWO0FBQ0Q7O0FBRUQsVUFBSUYsSUFBSSxJQUFJQSxJQUFJLFlBQVk3WixLQUFLLENBQUN3RixlQUFsQyxFQUFtRDtBQUFFO0FBQ25ELGVBQU8sS0FBS2dELHFCQUFMLENBQTJCcVIsSUFBM0IsRUFBaUN6WSxTQUFqQyxFQUE0QzBZLE9BQTVDLEVBQXFEaFosT0FBckQsRUFBOERpWixPQUE5RCxDQUFQO0FBQ0Q7O0FBQ0QsVUFBSWxhLENBQUMsQ0FBQ3lCLGFBQUYsQ0FBZ0J1WSxJQUFoQixDQUFKLEVBQTJCO0FBQ3pCLGVBQU8sS0FBSy9QLGVBQUwsQ0FBcUIrUCxJQUFyQixFQUEyQjtBQUNoQ2hQLFVBQUFBLEtBQUssRUFBRWlQLE9BRHlCO0FBRWhDeFIsVUFBQUEsTUFBTSxFQUFFeVIsT0FBTyxJQUFJM1ksU0FGYTtBQUdoQzZDLFVBQUFBLElBQUksRUFBRW5ELE9BQU8sQ0FBQ21EO0FBSGtCLFNBQTNCLENBQVA7QUFLRDs7QUFDRCxVQUFJLE9BQU80VixJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCLFlBQUlpRSxXQUFXLEdBQUdoRSxPQUFPLEdBQUdqVixNQUFNLENBQUNrWixJQUFQLENBQVlqRSxPQUFPLENBQUNnRSxXQUFwQixDQUFILEdBQXNDLEVBQS9EOztBQUVBLFlBQUlBLFdBQVcsQ0FBQzNaLE1BQVosR0FBcUIsQ0FBekIsRUFBNEI7QUFDMUI7QUFDQTJaLFVBQUFBLFdBQVcsR0FBR0EsV0FBVyxDQUFDLENBQUQsQ0FBekI7QUFDRCxTQUhELE1BR087QUFDTEEsVUFBQUEsV0FBVyxHQUFHLElBQWQ7QUFDRDs7QUFFRG5XLFFBQUFBLEtBQUssQ0FBQ21XLFdBQUQsQ0FBTCxHQUFxQmpFLElBQXJCO0FBRUEsZUFBTyxLQUFLL1AsZUFBTCxDQUFxQm5DLEtBQXJCLEVBQTRCO0FBQ2pDa0QsVUFBQUEsS0FBSyxFQUFFaVAsT0FEMEI7QUFFakN4UixVQUFBQSxNQUFNLEVBQUV5UixPQUFPLElBQUkzWTtBQUZjLFNBQTVCLENBQVA7QUFJRDs7QUFDRCxVQUFJLE9BQU95WSxJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCLGVBQU8sS0FBSy9QLGVBQUwsQ0FBcUIrUCxJQUFyQixFQUEyQjtBQUNoQ2hQLFVBQUFBLEtBQUssRUFBRWlQLE9BRHlCO0FBRWhDeFIsVUFBQUEsTUFBTSxFQUFFeVIsT0FBTyxJQUFJM1k7QUFGYSxTQUEzQixDQUFQO0FBSUQ7O0FBQ0QsVUFBSTRjLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQnBFLElBQWhCLENBQUosRUFBMkI7QUFDekIsZUFBTyxLQUFLdFUsTUFBTCxDQUFZc1UsSUFBWixDQUFQO0FBQ0Q7O0FBQ0QsVUFBSXJTLEtBQUssQ0FBQ0MsT0FBTixDQUFjb1MsSUFBZCxDQUFKLEVBQXlCO0FBQ3ZCLFlBQUlBLElBQUksQ0FBQzFWLE1BQUwsS0FBZ0IsQ0FBaEIsSUFBcUIwVixJQUFJLENBQUMxVixNQUFMLEdBQWMsQ0FBZCxJQUFtQjBWLElBQUksQ0FBQyxDQUFELENBQUosQ0FBUTFWLE1BQVIsS0FBbUIsQ0FBL0QsRUFBa0UsT0FBTyxLQUFQOztBQUNsRSxZQUFJbkUsS0FBSyxDQUFDd2Isa0JBQU4sQ0FBeUIzQixJQUF6QixDQUFKLEVBQW9DO0FBQ2xDLGdCQUFNcUUsS0FBSyxHQUFHO0FBQUUsYUFBQ3pkLEVBQUUsQ0FBQ2tZLEdBQUosR0FBVWtCO0FBQVosV0FBZDtBQUNBLGlCQUFPLEtBQUsvSCxrQkFBTCxDQUF3Qm9NLEtBQXhCLEVBQStCOWMsU0FBL0IsRUFBMEMwWSxPQUExQyxFQUFtRGhaLE9BQW5ELEVBQTREaVosT0FBNUQsQ0FBUDtBQUNEOztBQUNELGNBQU0sSUFBSS9ZLEtBQUosQ0FBVSwwRUFBVixDQUFOO0FBQ0Q7O0FBQ0QsVUFBSTZZLElBQUksS0FBSyxJQUFiLEVBQW1CO0FBQ2pCLGVBQU8sS0FBSy9QLGVBQUwsQ0FBcUIrUCxJQUFyQixFQUEyQjtBQUNoQ2hQLFVBQUFBLEtBQUssRUFBRWlQLE9BRHlCO0FBRWhDeFIsVUFBQUEsTUFBTSxFQUFFeVIsT0FBTyxJQUFJM1k7QUFGYSxTQUEzQixDQUFQO0FBSUQ7O0FBRUQsYUFBTyxLQUFQO0FBQ0QsSyxDQUVEOzs7O3lDQUNxQitjLFUsRUFBWXpTLEksRUFBTTtBQUNyQ0EsTUFBQUEsSUFBSSxHQUFHQSxJQUFJLElBQUksRUFBZjtBQUNBLGFBQU83TCxDQUFDLENBQUN1ZSxNQUFGLENBQVNELFVBQVQsRUFBcUIsQ0FBQzdYLE1BQUQsRUFBU3JCLEtBQVQsRUFBZ0IzQixHQUFoQixLQUF3QjtBQUNsRCxZQUFJekQsQ0FBQyxDQUFDOE0sUUFBRixDQUFXMUgsS0FBWCxDQUFKLEVBQXVCO0FBQ3JCLGlCQUFPcUIsTUFBTSxDQUFDNkMsTUFBUCxDQUFjLEtBQUtrVixvQkFBTCxDQUEwQnBaLEtBQTFCLEVBQWlDeUcsSUFBSSxDQUFDdkMsTUFBTCxDQUFZN0YsR0FBWixDQUFqQyxDQUFkLENBQVAsQ0FEcUIsQ0FDcUQ7QUFDM0U7O0FBQ0RnRCxRQUFBQSxNQUFNLENBQUNwQixJQUFQLENBQVk7QUFBRXdHLFVBQUFBLElBQUksRUFBRUEsSUFBSSxDQUFDdkMsTUFBTCxDQUFZN0YsR0FBWixDQUFSO0FBQTBCMkIsVUFBQUE7QUFBMUIsU0FBWjtBQUNBLGVBQU9xQixNQUFQO0FBQ0QsT0FOTSxFQU1KLEVBTkksQ0FBUDtBQU9EOzs7aUNBRVlyQixLLEVBQU87QUFDbEIsYUFBT0EsS0FBUDtBQUNEOzs7Ozs7QUFHSEosTUFBTSxDQUFDd0wsTUFBUCxDQUFjeFAsY0FBYyxDQUFDaUUsU0FBN0IsRUFBd0NsRixPQUFPLENBQUMsNkJBQUQsQ0FBL0M7QUFDQWlGLE1BQU0sQ0FBQ3dMLE1BQVAsQ0FBY3hQLGNBQWMsQ0FBQ2lFLFNBQTdCLEVBQXdDbEYsT0FBTyxDQUFDLCtCQUFELENBQS9DO0FBRUEwZSxNQUFNLENBQUNDLE9BQVAsR0FBaUIxZCxjQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IHV1aWR2NCA9IHJlcXVpcmUoJ3V1aWQvdjQnKTtcbmNvbnN0IHNlbXZlciA9IHJlcXVpcmUoJ3NlbXZlcicpO1xuXG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzJyk7XG5jb25zdCBkZXByZWNhdGlvbnMgPSByZXF1aXJlKCcuLi8uLi91dGlscy9kZXByZWNhdGlvbnMnKTtcbmNvbnN0IFNxbFN0cmluZyA9IHJlcXVpcmUoJy4uLy4uL3NxbC1zdHJpbmcnKTtcbmNvbnN0IERhdGFUeXBlcyA9IHJlcXVpcmUoJy4uLy4uL2RhdGEtdHlwZXMnKTtcbmNvbnN0IE1vZGVsID0gcmVxdWlyZSgnLi4vLi4vbW9kZWwnKTtcbmNvbnN0IEFzc29jaWF0aW9uID0gcmVxdWlyZSgnLi4vLi4vYXNzb2NpYXRpb25zL2Jhc2UnKTtcbmNvbnN0IEJlbG9uZ3NUbyA9IHJlcXVpcmUoJy4uLy4uL2Fzc29jaWF0aW9ucy9iZWxvbmdzLXRvJyk7XG5jb25zdCBCZWxvbmdzVG9NYW55ID0gcmVxdWlyZSgnLi4vLi4vYXNzb2NpYXRpb25zL2JlbG9uZ3MtdG8tbWFueScpO1xuY29uc3QgSGFzTWFueSA9IHJlcXVpcmUoJy4uLy4uL2Fzc29jaWF0aW9ucy9oYXMtbWFueScpO1xuY29uc3QgT3AgPSByZXF1aXJlKCcuLi8uLi9vcGVyYXRvcnMnKTtcbmNvbnN0IHNlcXVlbGl6ZUVycm9yID0gcmVxdWlyZSgnLi4vLi4vZXJyb3JzJyk7XG5jb25zdCBJbmRleEhpbnRzID0gcmVxdWlyZSgnLi4vLi4vaW5kZXgtaGludHMnKTtcblxuY29uc3QgUXVvdGVIZWxwZXIgPSByZXF1aXJlKCcuL3F1ZXJ5LWdlbmVyYXRvci9oZWxwZXJzL3F1b3RlJyk7XG5cbi8qKlxuICogQWJzdHJhY3QgUXVlcnkgR2VuZXJhdG9yXG4gKlxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgUXVlcnlHZW5lcmF0b3Ige1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zLnNlcXVlbGl6ZSkgdGhyb3cgbmV3IEVycm9yKCdRdWVyeUdlbmVyYXRvciBpbml0aWFsaXplZCB3aXRob3V0IG9wdGlvbnMuc2VxdWVsaXplJyk7XG4gICAgaWYgKCFvcHRpb25zLl9kaWFsZWN0KSB0aHJvdyBuZXcgRXJyb3IoJ1F1ZXJ5R2VuZXJhdG9yIGluaXRpYWxpemVkIHdpdGhvdXQgb3B0aW9ucy5fZGlhbGVjdCcpO1xuXG4gICAgdGhpcy5zZXF1ZWxpemUgPSBvcHRpb25zLnNlcXVlbGl6ZTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zLnNlcXVlbGl6ZS5vcHRpb25zO1xuXG4gICAgLy8gZGlhbGVjdCBuYW1lXG4gICAgdGhpcy5kaWFsZWN0ID0gb3B0aW9ucy5fZGlhbGVjdC5uYW1lO1xuICAgIHRoaXMuX2RpYWxlY3QgPSBvcHRpb25zLl9kaWFsZWN0O1xuICB9XG5cbiAgZXh0cmFjdFRhYmxlRGV0YWlscyh0YWJsZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0YWJsZU5hbWUgPSB0YWJsZU5hbWUgfHwge307XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjaGVtYTogdGFibGVOYW1lLnNjaGVtYSB8fCBvcHRpb25zLnNjaGVtYSB8fCAncHVibGljJyxcbiAgICAgIHRhYmxlTmFtZTogXy5pc1BsYWluT2JqZWN0KHRhYmxlTmFtZSkgPyB0YWJsZU5hbWUudGFibGVOYW1lIDogdGFibGVOYW1lLFxuICAgICAgZGVsaW1pdGVyOiB0YWJsZU5hbWUuZGVsaW1pdGVyIHx8IG9wdGlvbnMuZGVsaW1pdGVyIHx8ICcuJ1xuICAgIH07XG4gIH1cblxuICBhZGRTY2hlbWEocGFyYW0pIHtcbiAgICBpZiAoIXBhcmFtLl9zY2hlbWEpIHJldHVybiBwYXJhbS50YWJsZU5hbWUgfHwgcGFyYW07XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRhYmxlTmFtZTogcGFyYW0udGFibGVOYW1lIHx8IHBhcmFtLFxuICAgICAgdGFibGU6IHBhcmFtLnRhYmxlTmFtZSB8fCBwYXJhbSxcbiAgICAgIG5hbWU6IHBhcmFtLm5hbWUgfHwgcGFyYW0sXG4gICAgICBzY2hlbWE6IHBhcmFtLl9zY2hlbWEsXG4gICAgICBkZWxpbWl0ZXI6IHBhcmFtLl9zY2hlbWFEZWxpbWl0ZXIgfHwgJy4nLFxuICAgICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnF1b3RlVGFibGUodGhpcyk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGRyb3BTY2hlbWEodGFibGVOYW1lLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuZHJvcFRhYmxlUXVlcnkodGFibGVOYW1lLCBvcHRpb25zKTtcbiAgfVxuXG4gIGRlc2NyaWJlVGFibGVRdWVyeSh0YWJsZU5hbWUsIHNjaGVtYSwgc2NoZW1hRGVsaW1pdGVyKSB7XG4gICAgY29uc3QgdGFibGUgPSB0aGlzLnF1b3RlVGFibGUoXG4gICAgICB0aGlzLmFkZFNjaGVtYSh7XG4gICAgICAgIHRhYmxlTmFtZSxcbiAgICAgICAgX3NjaGVtYTogc2NoZW1hLFxuICAgICAgICBfc2NoZW1hRGVsaW1pdGVyOiBzY2hlbWFEZWxpbWl0ZXJcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHJldHVybiBgREVTQ1JJQkUgJHt0YWJsZX07YDtcbiAgfVxuXG4gIGRyb3BUYWJsZVF1ZXJ5KHRhYmxlTmFtZSkge1xuICAgIHJldHVybiBgRFJPUCBUQUJMRSBJRiBFWElTVFMgJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX07YDtcbiAgfVxuXG4gIHJlbmFtZVRhYmxlUXVlcnkoYmVmb3JlLCBhZnRlcikge1xuICAgIHJldHVybiBgQUxURVIgVEFCTEUgJHt0aGlzLnF1b3RlVGFibGUoYmVmb3JlKX0gUkVOQU1FIFRPICR7dGhpcy5xdW90ZVRhYmxlKGFmdGVyKX07YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGluc2VydCBpbnRvIGNvbW1hbmRcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZUhhc2ggICAgICAgYXR0cmlidXRlIHZhbHVlIHBhaXJzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBtb2RlbEF0dHJpYnV0ZXNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgaW5zZXJ0UXVlcnkodGFibGUsIHZhbHVlSGFzaCwgbW9kZWxBdHRyaWJ1dGVzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgXy5kZWZhdWx0cyhvcHRpb25zLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgY29uc3QgbW9kZWxBdHRyaWJ1dGVNYXAgPSB7fTtcbiAgICBjb25zdCBmaWVsZHMgPSBbXTtcbiAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICBjb25zdCBiaW5kID0gW107XG4gICAgY29uc3QgcXVvdGVkVGFibGUgPSB0aGlzLnF1b3RlVGFibGUodGFibGUpO1xuICAgIGNvbnN0IGJpbmRQYXJhbSA9IG9wdGlvbnMuYmluZFBhcmFtID09PSB1bmRlZmluZWQgPyB0aGlzLmJpbmRQYXJhbShiaW5kKSA6IG9wdGlvbnMuYmluZFBhcmFtO1xuICAgIGxldCBxdWVyeTtcbiAgICBsZXQgdmFsdWVRdWVyeSA9ICcnO1xuICAgIGxldCBlbXB0eVF1ZXJ5ID0gJyc7XG4gICAgbGV0IG91dHB1dEZyYWdtZW50ID0gJyc7XG4gICAgbGV0IGlkZW50aXR5V3JhcHBlclJlcXVpcmVkID0gZmFsc2U7XG4gICAgbGV0IHRtcFRhYmxlID0gJyc7IC8vdG1wVGFibGUgZGVjbGFyYXRpb24gZm9yIHRyaWdnZXJcblxuICAgIGlmIChtb2RlbEF0dHJpYnV0ZXMpIHtcbiAgICAgIF8uZWFjaChtb2RlbEF0dHJpYnV0ZXMsIChhdHRyaWJ1dGUsIGtleSkgPT4ge1xuICAgICAgICBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldID0gYXR0cmlidXRlO1xuICAgICAgICBpZiAoYXR0cmlidXRlLmZpZWxkKSB7XG4gICAgICAgICAgbW9kZWxBdHRyaWJ1dGVNYXBbYXR0cmlidXRlLmZpZWxkXSA9IGF0dHJpYnV0ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHNbJ0RFRkFVTFQgVkFMVUVTJ10pIHtcbiAgICAgIGVtcHR5UXVlcnkgKz0gJyBERUZBVUxUIFZBTFVFUyc7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzWydWQUxVRVMgKCknXSkge1xuICAgICAgZW1wdHlRdWVyeSArPSAnIFZBTFVFUyAoKSc7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMucmV0dXJuVmFsdWVzICYmIG9wdGlvbnMucmV0dXJuaW5nKSB7XG4gICAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5yZXR1cm5WYWx1ZXMucmV0dXJuaW5nKSB7XG4gICAgICAgIHZhbHVlUXVlcnkgKz0gJyBSRVRVUk5JTkcgKic7XG4gICAgICAgIGVtcHR5UXVlcnkgKz0gJyBSRVRVUk5JTkcgKic7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMucmV0dXJuVmFsdWVzLm91dHB1dCkge1xuICAgICAgICBvdXRwdXRGcmFnbWVudCA9ICcgT1VUUFVUIElOU0VSVEVELionO1xuXG4gICAgICAgIC8vVG8gY2FwdHVyZSBvdXRwdXQgcm93cyB3aGVuIHRoZXJlIGlzIGEgdHJpZ2dlciBvbiBNU1NRTCBEQlxuICAgICAgICBpZiAobW9kZWxBdHRyaWJ1dGVzICYmIG9wdGlvbnMuaGFzVHJpZ2dlciAmJiB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnRtcFRhYmxlVHJpZ2dlcikge1xuXG4gICAgICAgICAgbGV0IHRtcENvbHVtbnMgPSAnJztcbiAgICAgICAgICBsZXQgb3V0cHV0Q29sdW1ucyA9ICcnO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBtb2RlbEtleSBpbiBtb2RlbEF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG1vZGVsQXR0cmlidXRlc1ttb2RlbEtleV07XG4gICAgICAgICAgICBpZiAoIShhdHRyaWJ1dGUudHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5WSVJUVUFMKSkge1xuICAgICAgICAgICAgICBpZiAodG1wQ29sdW1ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdG1wQ29sdW1ucyArPSAnLCc7XG4gICAgICAgICAgICAgICAgb3V0cHV0Q29sdW1ucyArPSAnLCc7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0bXBDb2x1bW5zICs9IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHJpYnV0ZS5maWVsZCl9ICR7YXR0cmlidXRlLnR5cGUudG9TcWwoKX1gO1xuICAgICAgICAgICAgICBvdXRwdXRDb2x1bW5zICs9IGBJTlNFUlRFRC4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHJpYnV0ZS5maWVsZCl9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0bXBUYWJsZSA9IGBkZWNsYXJlIEB0bXAgdGFibGUgKCR7dG1wQ29sdW1uc30pO2A7XG4gICAgICAgICAgb3V0cHV0RnJhZ21lbnQgPSBgIE9VVFBVVCAke291dHB1dENvbHVtbnN9IGludG8gQHRtcGA7XG4gICAgICAgICAgY29uc3Qgc2VsZWN0RnJvbVRtcCA9ICc7c2VsZWN0ICogZnJvbSBAdG1wJztcblxuICAgICAgICAgIHZhbHVlUXVlcnkgKz0gc2VsZWN0RnJvbVRtcDtcbiAgICAgICAgICBlbXB0eVF1ZXJ5ICs9IHNlbGVjdEZyb21UbXA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoXy5nZXQodGhpcywgWydzZXF1ZWxpemUnLCAnb3B0aW9ucycsICdkaWFsZWN0T3B0aW9ucycsICdwcmVwZW5kU2VhcmNoUGF0aCddKSB8fCBvcHRpb25zLnNlYXJjaFBhdGgpIHtcbiAgICAgIC8vIE5vdCBjdXJyZW50bHkgc3VwcG9ydGVkIHdpdGggc2VhcmNoIHBhdGggKHJlcXVpcmVzIG91dHB1dCBvZiBtdWx0aXBsZSBxdWVyaWVzKVxuICAgICAgb3B0aW9ucy5iaW5kUGFyYW0gPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5FWENFUFRJT04gJiYgb3B0aW9ucy5leGNlcHRpb24pIHtcbiAgICAgIC8vIE5vdCBjdXJyZW50bHkgc3VwcG9ydGVkIHdpdGggYmluZCBwYXJhbWV0ZXJzIChyZXF1aXJlcyBvdXRwdXQgb2YgbXVsdGlwbGUgcXVlcmllcylcbiAgICAgIG9wdGlvbnMuYmluZFBhcmFtID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFsdWVIYXNoID0gVXRpbHMucmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoKHZhbHVlSGFzaCwgdGhpcy5vcHRpb25zLm9taXROdWxsKTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB2YWx1ZUhhc2gpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWVIYXNoLCBrZXkpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVIYXNoW2tleV07XG4gICAgICAgIGZpZWxkcy5wdXNoKHRoaXMucXVvdGVJZGVudGlmaWVyKGtleSkpO1xuXG4gICAgICAgIC8vIFNFUklBTFMnIGNhbid0IGJlIE5VTEwgaW4gcG9zdGdyZXNxbCwgdXNlIERFRkFVTFQgd2hlcmUgc3VwcG9ydGVkXG4gICAgICAgIGlmIChtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldICYmIG1vZGVsQXR0cmlidXRlTWFwW2tleV0uYXV0b0luY3JlbWVudCA9PT0gdHJ1ZSAmJiAhdmFsdWUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuYXV0b0luY3JlbWVudC5kZWZhdWx0VmFsdWUpIHtcbiAgICAgICAgICAgIGZpZWxkcy5zcGxpY2UoLTEsIDEpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5ERUZBVUxUKSB7XG4gICAgICAgICAgICB2YWx1ZXMucHVzaCgnREVGQVVMVCcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZXMucHVzaCh0aGlzLmVzY2FwZShudWxsKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldICYmIG1vZGVsQXR0cmlidXRlTWFwW2tleV0uYXV0b0luY3JlbWVudCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgaWRlbnRpdHlXcmFwcGVyUmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCB8fCBvcHRpb25zLmJpbmRQYXJhbSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHRoaXMuZXNjYXBlKHZhbHVlLCBtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldIHx8IHVuZGVmaW5lZCwgeyBjb250ZXh0OiAnSU5TRVJUJyB9KSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHRoaXMuZm9ybWF0KHZhbHVlLCBtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldIHx8IHVuZGVmaW5lZCwgeyBjb250ZXh0OiAnSU5TRVJUJyB9LCBiaW5kUGFyYW0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZXBsYWNlbWVudHMgPSB7XG4gICAgICBpZ25vcmVEdXBsaWNhdGVzOiBvcHRpb25zLmlnbm9yZUR1cGxpY2F0ZXMgPyB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluc2VydHMuaWdub3JlRHVwbGljYXRlcyA6ICcnLFxuICAgICAgb25Db25mbGljdERvTm90aGluZzogb3B0aW9ucy5pZ25vcmVEdXBsaWNhdGVzID8gdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbnNlcnRzLm9uQ29uZmxpY3REb05vdGhpbmcgOiAnJyxcbiAgICAgIGF0dHJpYnV0ZXM6IGZpZWxkcy5qb2luKCcsJyksXG4gICAgICBvdXRwdXQ6IG91dHB1dEZyYWdtZW50LFxuICAgICAgdmFsdWVzOiB2YWx1ZXMuam9pbignLCcpLFxuICAgICAgdG1wVGFibGVcbiAgICB9O1xuXG4gICAgdmFsdWVRdWVyeSA9IGAke3RtcFRhYmxlfUlOU0VSVCR7cmVwbGFjZW1lbnRzLmlnbm9yZUR1cGxpY2F0ZXN9IElOVE8gJHtxdW90ZWRUYWJsZX0gKCR7cmVwbGFjZW1lbnRzLmF0dHJpYnV0ZXN9KSR7cmVwbGFjZW1lbnRzLm91dHB1dH0gVkFMVUVTICgke3JlcGxhY2VtZW50cy52YWx1ZXN9KSR7cmVwbGFjZW1lbnRzLm9uQ29uZmxpY3REb05vdGhpbmd9JHt2YWx1ZVF1ZXJ5fWA7XG4gICAgZW1wdHlRdWVyeSA9IGAke3RtcFRhYmxlfUlOU0VSVCR7cmVwbGFjZW1lbnRzLmlnbm9yZUR1cGxpY2F0ZXN9IElOVE8gJHtxdW90ZWRUYWJsZX0ke3JlcGxhY2VtZW50cy5vdXRwdXR9JHtyZXBsYWNlbWVudHMub25Db25mbGljdERvTm90aGluZ30ke2VtcHR5UXVlcnl9YDtcblxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLkVYQ0VQVElPTiAmJiBvcHRpb25zLmV4Y2VwdGlvbikge1xuICAgICAgLy8gTW9zdGx5IGZvciBpbnRlcm5hbCB1c2UsIHNvIHdlIGV4cGVjdCB0aGUgdXNlciB0byBrbm93IHdoYXQgaGUncyBkb2luZyFcbiAgICAgIC8vIHBnX3RlbXAgZnVuY3Rpb25zIGFyZSBwcml2YXRlIHBlciBjb25uZWN0aW9uLCBzbyB3ZSBuZXZlciByaXNrIHRoaXMgZnVuY3Rpb24gaW50ZXJmZXJpbmcgd2l0aCBhbm90aGVyIG9uZS5cbiAgICAgIGlmIChzZW12ZXIuZ3RlKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGF0YWJhc2VWZXJzaW9uLCAnOS4yLjAnKSkge1xuICAgICAgICAvLyA+PSA5LjIgLSBVc2UgYSBVVUlEIGJ1dCBwcmVmaXggd2l0aCAnZnVuY18nIChudW1iZXJzIGZpcnN0IG5vdCBhbGxvd2VkKVxuICAgICAgICBjb25zdCBkZWxpbWl0ZXIgPSBgJGZ1bmNfJHt1dWlkdjQoKS5yZXBsYWNlKC8tL2csICcnKX0kYDtcblxuICAgICAgICBvcHRpb25zLmV4Y2VwdGlvbiA9ICdXSEVOIHVuaXF1ZV92aW9sYXRpb24gVEhFTiBHRVQgU1RBQ0tFRCBESUFHTk9TVElDUyBzZXF1ZWxpemVfY2F1Z2h0X2V4Y2VwdGlvbiA9IFBHX0VYQ0VQVElPTl9ERVRBSUw7JztcbiAgICAgICAgdmFsdWVRdWVyeSA9IGAke2BDUkVBVEUgT1IgUkVQTEFDRSBGVU5DVElPTiBwZ190ZW1wLnRlc3RmdW5jKE9VVCByZXNwb25zZSAke3F1b3RlZFRhYmxlfSwgT1VUIHNlcXVlbGl6ZV9jYXVnaHRfZXhjZXB0aW9uIHRleHQpIFJFVFVSTlMgUkVDT1JEIEFTICR7ZGVsaW1pdGVyfWAgK1xuICAgICAgICAgICcgQkVHSU4gJ30ke3ZhbHVlUXVlcnl9IElOVE8gcmVzcG9uc2U7IEVYQ0VQVElPTiAke29wdGlvbnMuZXhjZXB0aW9ufSBFTkQgJHtkZWxpbWl0ZXJcbiAgICAgICAgfSBMQU5HVUFHRSBwbHBnc3FsOyBTRUxFQ1QgKHRlc3RmdW5jLnJlc3BvbnNlKS4qLCB0ZXN0ZnVuYy5zZXF1ZWxpemVfY2F1Z2h0X2V4Y2VwdGlvbiBGUk9NIHBnX3RlbXAudGVzdGZ1bmMoKTsgRFJPUCBGVU5DVElPTiBJRiBFWElTVFMgcGdfdGVtcC50ZXN0ZnVuYygpYDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdGlvbnMuZXhjZXB0aW9uID0gJ1dIRU4gdW5pcXVlX3Zpb2xhdGlvbiBUSEVOIE5VTEw7JztcbiAgICAgICAgdmFsdWVRdWVyeSA9IGBDUkVBVEUgT1IgUkVQTEFDRSBGVU5DVElPTiBwZ190ZW1wLnRlc3RmdW5jKCkgUkVUVVJOUyBTRVRPRiAke3F1b3RlZFRhYmxlfSBBUyAkYm9keSQgQkVHSU4gUkVUVVJOIFFVRVJZICR7dmFsdWVRdWVyeX07IEVYQ0VQVElPTiAke29wdGlvbnMuZXhjZXB0aW9ufSBFTkQ7ICRib2R5JCBMQU5HVUFHRSBwbHBnc3FsOyBTRUxFQ1QgKiBGUk9NIHBnX3RlbXAudGVzdGZ1bmMoKTsgRFJPUCBGVU5DVElPTiBJRiBFWElTVFMgcGdfdGVtcC50ZXN0ZnVuYygpO2A7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHNbJ09OIERVUExJQ0FURSBLRVknXSAmJiBvcHRpb25zLm9uRHVwbGljYXRlKSB7XG4gICAgICB2YWx1ZVF1ZXJ5ICs9IGAgT04gRFVQTElDQVRFIEtFWSAke29wdGlvbnMub25EdXBsaWNhdGV9YDtcbiAgICAgIGVtcHR5UXVlcnkgKz0gYCBPTiBEVVBMSUNBVEUgS0VZICR7b3B0aW9ucy5vbkR1cGxpY2F0ZX1gO1xuICAgIH1cblxuICAgIHF1ZXJ5ID0gYCR7cmVwbGFjZW1lbnRzLmF0dHJpYnV0ZXMubGVuZ3RoID8gdmFsdWVRdWVyeSA6IGVtcHR5UXVlcnl9O2A7XG4gICAgaWYgKGlkZW50aXR5V3JhcHBlclJlcXVpcmVkICYmIHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuYXV0b0luY3JlbWVudC5pZGVudGl0eUluc2VydCkge1xuICAgICAgcXVlcnkgPSBgU0VUIElERU5USVRZX0lOU0VSVCAke3F1b3RlZFRhYmxlfSBPTjsgJHtxdWVyeX0gU0VUIElERU5USVRZX0lOU0VSVCAke3F1b3RlZFRhYmxlfSBPRkY7YDtcbiAgICB9XG5cbiAgICAvLyBVc2VkIGJ5IFBvc3RncmVzIHVwc2VydFF1ZXJ5IGFuZCBjYWxscyB0byBoZXJlIHdpdGggb3B0aW9ucy5leGNlcHRpb24gc2V0IHRvIHRydWVcbiAgICBjb25zdCByZXN1bHQgPSB7IHF1ZXJ5IH07XG4gICAgaWYgKG9wdGlvbnMuYmluZFBhcmFtICE9PSBmYWxzZSkge1xuICAgICAgcmVzdWx0LmJpbmQgPSBiaW5kO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gaW5zZXJ0IGludG8gY29tbWFuZCBmb3IgbXVsdGlwbGUgdmFsdWVzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWVsZFZhbHVlSGFzaGVzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWVsZE1hcHBlZEF0dHJpYnV0ZXNcbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGJ1bGtJbnNlcnRRdWVyeSh0YWJsZU5hbWUsIGZpZWxkVmFsdWVIYXNoZXMsIG9wdGlvbnMsIGZpZWxkTWFwcGVkQXR0cmlidXRlcykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGZpZWxkTWFwcGVkQXR0cmlidXRlcyA9IGZpZWxkTWFwcGVkQXR0cmlidXRlcyB8fCB7fTtcblxuICAgIGNvbnN0IHR1cGxlcyA9IFtdO1xuICAgIGNvbnN0IHNlcmlhbHMgPSB7fTtcbiAgICBjb25zdCBhbGxBdHRyaWJ1dGVzID0gW107XG4gICAgbGV0IG9uRHVwbGljYXRlS2V5VXBkYXRlID0gJyc7XG5cbiAgICBmb3IgKGNvbnN0IGZpZWxkVmFsdWVIYXNoIG9mIGZpZWxkVmFsdWVIYXNoZXMpIHtcbiAgICAgIF8uZm9yT3duKGZpZWxkVmFsdWVIYXNoLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAoIWFsbEF0dHJpYnV0ZXMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICAgIGFsbEF0dHJpYnV0ZXMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcbiAgICAgICAgICBmaWVsZE1hcHBlZEF0dHJpYnV0ZXNba2V5XVxuICAgICAgICAgICYmIGZpZWxkTWFwcGVkQXR0cmlidXRlc1trZXldLmF1dG9JbmNyZW1lbnQgPT09IHRydWVcbiAgICAgICAgKSB7XG4gICAgICAgICAgc2VyaWFsc1trZXldID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBmaWVsZFZhbHVlSGFzaCBvZiBmaWVsZFZhbHVlSGFzaGVzKSB7XG4gICAgICBjb25zdCB2YWx1ZXMgPSBhbGxBdHRyaWJ1dGVzLm1hcChrZXkgPT4ge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5idWxrRGVmYXVsdFxuICAgICAgICAgICYmIHNlcmlhbHNba2V5XSA9PT0gdHJ1ZVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gZmllbGRWYWx1ZUhhc2hba2V5XSB8fCAnREVGQVVMVCc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5lc2NhcGUoZmllbGRWYWx1ZUhhc2hba2V5XSwgZmllbGRNYXBwZWRBdHRyaWJ1dGVzW2tleV0sIHsgY29udGV4dDogJ0lOU0VSVCcgfSk7XG4gICAgICB9KTtcblxuICAgICAgdHVwbGVzLnB1c2goYCgke3ZhbHVlcy5qb2luKCcsJyl9KWApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluc2VydHMudXBkYXRlT25EdXBsaWNhdGUgJiYgb3B0aW9ucy51cGRhdGVPbkR1cGxpY2F0ZSkge1xuICAgICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5zZXJ0cy51cGRhdGVPbkR1cGxpY2F0ZSA9PSAnIE9OIENPTkZMSUNUIERPIFVQREFURSBTRVQnKSB7IC8vIHBvc3RncmVzIC8gc3FsaXRlXG4gICAgICAgIC8vIElmIG5vIGNvbmZsaWN0IHRhcmdldCBjb2x1bW5zIHdlcmUgc3BlY2lmaWVkLCB1c2UgdGhlIHByaW1hcnkga2V5IG5hbWVzIGZyb20gb3B0aW9ucy51cHNlcnRLZXlzXG4gICAgICAgIGNvbnN0IGNvbmZsaWN0S2V5cyA9IG9wdGlvbnMudXBzZXJ0S2V5cy5tYXAoYXR0ciA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKSk7XG4gICAgICAgIGNvbnN0IHVwZGF0ZUtleXMgPSBvcHRpb25zLnVwZGF0ZU9uRHVwbGljYXRlLm1hcChhdHRyID0+IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHIpfT1FWENMVURFRC4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHIpfWApO1xuICAgICAgICBvbkR1cGxpY2F0ZUtleVVwZGF0ZSA9IGAgT04gQ09ORkxJQ1QgKCR7Y29uZmxpY3RLZXlzLmpvaW4oJywnKX0pIERPIFVQREFURSBTRVQgJHt1cGRhdGVLZXlzLmpvaW4oJywnKX1gO1xuICAgICAgfSBlbHNlIHsgLy8gbXlzcWwgLyBtYXJpYVxuICAgICAgICBjb25zdCB2YWx1ZUtleXMgPSBvcHRpb25zLnVwZGF0ZU9uRHVwbGljYXRlLm1hcChhdHRyID0+IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHIpfT1WQUxVRVMoJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKX0pYCk7XG4gICAgICAgIG9uRHVwbGljYXRlS2V5VXBkYXRlID0gYCR7dGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbnNlcnRzLnVwZGF0ZU9uRHVwbGljYXRlfSAke3ZhbHVlS2V5cy5qb2luKCcsJyl9YDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBpZ25vcmVEdXBsaWNhdGVzID0gb3B0aW9ucy5pZ25vcmVEdXBsaWNhdGVzID8gdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbnNlcnRzLmlnbm9yZUR1cGxpY2F0ZXMgOiAnJztcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gYWxsQXR0cmlidXRlcy5tYXAoYXR0ciA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKSkuam9pbignLCcpO1xuICAgIGNvbnN0IG9uQ29uZmxpY3REb05vdGhpbmcgPSBvcHRpb25zLmlnbm9yZUR1cGxpY2F0ZXMgPyB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluc2VydHMub25Db25mbGljdERvTm90aGluZyA6ICcnO1xuICAgIGxldCByZXR1cm5pbmcgPSAnJztcblxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnJldHVyblZhbHVlcyAmJiBBcnJheS5pc0FycmF5KG9wdGlvbnMucmV0dXJuaW5nKSkge1xuICAgICAgY29uc3QgZmllbGRzID0gb3B0aW9ucy5yZXR1cm5pbmcubWFwKGZpZWxkID0+IHRoaXMucXVvdGVJZGVudGlmaWVyKGZpZWxkKSkuam9pbignLCcpO1xuICAgICAgcmV0dXJuaW5nICs9IGAgUkVUVVJOSU5HICR7ZmllbGRzfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybmluZyArPSB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnJldHVyblZhbHVlcyAmJiBvcHRpb25zLnJldHVybmluZyA/ICcgUkVUVVJOSU5HIConIDogJyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGBJTlNFUlQke2lnbm9yZUR1cGxpY2F0ZXN9IElOVE8gJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX0gKCR7YXR0cmlidXRlc30pIFZBTFVFUyAke3R1cGxlcy5qb2luKCcsJyl9JHtvbkR1cGxpY2F0ZUtleVVwZGF0ZX0ke29uQ29uZmxpY3REb05vdGhpbmd9JHtyZXR1cm5pbmd9O2A7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiB1cGRhdGUgcXVlcnlcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlTmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gYXR0clZhbHVlSGFzaFxuICAgKiBAcGFyYW0ge09iamVjdH0gd2hlcmUgQSBoYXNoIHdpdGggY29uZGl0aW9ucyAoZS5nLiB7bmFtZTogJ2Zvbyd9KSBPUiBhbiBJRCBhcyBpbnRlZ2VyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICB1cGRhdGVRdWVyeSh0YWJsZU5hbWUsIGF0dHJWYWx1ZUhhc2gsIHdoZXJlLCBvcHRpb25zLCBhdHRyaWJ1dGVzKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgXy5kZWZhdWx0cyhvcHRpb25zLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgYXR0clZhbHVlSGFzaCA9IFV0aWxzLnJlbW92ZU51bGxWYWx1ZXNGcm9tSGFzaChhdHRyVmFsdWVIYXNoLCBvcHRpb25zLm9taXROdWxsLCBvcHRpb25zKTtcblxuICAgIGNvbnN0IHZhbHVlcyA9IFtdO1xuICAgIGNvbnN0IGJpbmQgPSBbXTtcbiAgICBjb25zdCBtb2RlbEF0dHJpYnV0ZU1hcCA9IHt9O1xuICAgIGxldCBvdXRwdXRGcmFnbWVudCA9ICcnO1xuICAgIGxldCB0bXBUYWJsZSA9ICcnOyAvLyB0bXBUYWJsZSBkZWNsYXJhdGlvbiBmb3IgdHJpZ2dlclxuICAgIGxldCBzZWxlY3RGcm9tVG1wID0gJyc7IC8vIFNlbGVjdCBzdGF0ZW1lbnQgZm9yIHRyaWdnZXJcbiAgICBsZXQgc3VmZml4ID0gJyc7XG5cbiAgICBpZiAoXy5nZXQodGhpcywgWydzZXF1ZWxpemUnLCAnb3B0aW9ucycsICdkaWFsZWN0T3B0aW9ucycsICdwcmVwZW5kU2VhcmNoUGF0aCddKSB8fCBvcHRpb25zLnNlYXJjaFBhdGgpIHtcbiAgICAgIC8vIE5vdCBjdXJyZW50bHkgc3VwcG9ydGVkIHdpdGggc2VhcmNoIHBhdGggKHJlcXVpcmVzIG91dHB1dCBvZiBtdWx0aXBsZSBxdWVyaWVzKVxuICAgICAgb3B0aW9ucy5iaW5kUGFyYW0gPSBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBiaW5kUGFyYW0gPSBvcHRpb25zLmJpbmRQYXJhbSA9PT0gdW5kZWZpbmVkID8gdGhpcy5iaW5kUGFyYW0oYmluZCkgOiBvcHRpb25zLmJpbmRQYXJhbTtcblxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzWydMSU1JVCBPTiBVUERBVEUnXSAmJiBvcHRpb25zLmxpbWl0KSB7XG4gICAgICBpZiAodGhpcy5kaWFsZWN0ICE9PSAnbXNzcWwnKSB7XG4gICAgICAgIHN1ZmZpeCA9IGAgTElNSVQgJHt0aGlzLmVzY2FwZShvcHRpb25zLmxpbWl0KX0gYDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5yZXR1cm5WYWx1ZXMpIHtcbiAgICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnJldHVyblZhbHVlcy5vdXRwdXQpIHtcbiAgICAgICAgLy8gd2UgYWx3YXlzIG5lZWQgdGhpcyBmb3IgbXNzcWxcbiAgICAgICAgb3V0cHV0RnJhZ21lbnQgPSAnIE9VVFBVVCBJTlNFUlRFRC4qJztcblxuICAgICAgICAvL1RvIGNhcHR1cmUgb3V0cHV0IHJvd3Mgd2hlbiB0aGVyZSBpcyBhIHRyaWdnZXIgb24gTVNTUUwgREJcbiAgICAgICAgaWYgKGF0dHJpYnV0ZXMgJiYgb3B0aW9ucy5oYXNUcmlnZ2VyICYmIHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMudG1wVGFibGVUcmlnZ2VyKSB7XG4gICAgICAgICAgbGV0IHRtcENvbHVtbnMgPSAnJztcbiAgICAgICAgICBsZXQgb3V0cHV0Q29sdW1ucyA9ICcnO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBtb2RlbEtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW21vZGVsS2V5XTtcbiAgICAgICAgICAgIGlmICghKGF0dHJpYnV0ZS50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLlZJUlRVQUwpKSB7XG4gICAgICAgICAgICAgIGlmICh0bXBDb2x1bW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0bXBDb2x1bW5zICs9ICcsJztcbiAgICAgICAgICAgICAgICBvdXRwdXRDb2x1bW5zICs9ICcsJztcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRtcENvbHVtbnMgKz0gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cmlidXRlLmZpZWxkKX0gJHthdHRyaWJ1dGUudHlwZS50b1NxbCgpfWA7XG4gICAgICAgICAgICAgIG91dHB1dENvbHVtbnMgKz0gYElOU0VSVEVELiR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cmlidXRlLmZpZWxkKX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRtcFRhYmxlID0gYGRlY2xhcmUgQHRtcCB0YWJsZSAoJHt0bXBDb2x1bW5zfSk7IGA7XG4gICAgICAgICAgb3V0cHV0RnJhZ21lbnQgPSBgIE9VVFBVVCAke291dHB1dENvbHVtbnN9IGludG8gQHRtcGA7XG4gICAgICAgICAgc2VsZWN0RnJvbVRtcCA9ICc7c2VsZWN0ICogZnJvbSBAdG1wJztcblxuICAgICAgICAgIHN1ZmZpeCArPSBzZWxlY3RGcm9tVG1wO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMucmV0dXJuVmFsdWVzICYmIG9wdGlvbnMucmV0dXJuaW5nKSB7XG4gICAgICAgIC8vIGVuc3VyZSB0aGF0IHRoZSByZXR1cm4gb3V0cHV0IGlzIHByb3Blcmx5IG1hcHBlZCB0byBtb2RlbCBmaWVsZHMuXG4gICAgICAgIG9wdGlvbnMubWFwVG9Nb2RlbCA9IHRydWU7XG4gICAgICAgIHN1ZmZpeCArPSAnIFJFVFVSTklORyAqJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYXR0cmlidXRlcykge1xuICAgICAgXy5lYWNoKGF0dHJpYnV0ZXMsIChhdHRyaWJ1dGUsIGtleSkgPT4ge1xuICAgICAgICBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldID0gYXR0cmlidXRlO1xuICAgICAgICBpZiAoYXR0cmlidXRlLmZpZWxkKSB7XG4gICAgICAgICAgbW9kZWxBdHRyaWJ1dGVNYXBbYXR0cmlidXRlLmZpZWxkXSA9IGF0dHJpYnV0ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0clZhbHVlSGFzaCkge1xuICAgICAgaWYgKG1vZGVsQXR0cmlidXRlTWFwICYmIG1vZGVsQXR0cmlidXRlTWFwW2tleV0gJiZcbiAgICAgICAgbW9kZWxBdHRyaWJ1dGVNYXBba2V5XS5hdXRvSW5jcmVtZW50ID09PSB0cnVlICYmXG4gICAgICAgICF0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmF1dG9JbmNyZW1lbnQudXBkYXRlKSB7XG4gICAgICAgIC8vIG5vdCBhbGxvd2VkIHRvIHVwZGF0ZSBpZGVudGl0eSBjb2x1bW5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZhbHVlID0gYXR0clZhbHVlSGFzaFtrZXldO1xuXG4gICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QgfHwgb3B0aW9ucy5iaW5kUGFyYW0gPT09IGZhbHNlKSB7XG4gICAgICAgIHZhbHVlcy5wdXNoKGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGtleSl9PSR7dGhpcy5lc2NhcGUodmFsdWUsIG1vZGVsQXR0cmlidXRlTWFwICYmIG1vZGVsQXR0cmlidXRlTWFwW2tleV0gfHwgdW5kZWZpbmVkLCB7IGNvbnRleHQ6ICdVUERBVEUnIH0pfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWVzLnB1c2goYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KX09JHt0aGlzLmZvcm1hdCh2YWx1ZSwgbW9kZWxBdHRyaWJ1dGVNYXAgJiYgbW9kZWxBdHRyaWJ1dGVNYXBba2V5XSB8fCB1bmRlZmluZWQsIHsgY29udGV4dDogJ1VQREFURScgfSwgYmluZFBhcmFtKX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB3aGVyZU9wdGlvbnMgPSBfLmRlZmF1bHRzKHsgYmluZFBhcmFtIH0sIG9wdGlvbnMpO1xuXG4gICAgaWYgKHZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBjb25zdCBxdWVyeSA9IGAke3RtcFRhYmxlfVVQREFURSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfSBTRVQgJHt2YWx1ZXMuam9pbignLCcpfSR7b3V0cHV0RnJhZ21lbnR9ICR7dGhpcy53aGVyZVF1ZXJ5KHdoZXJlLCB3aGVyZU9wdGlvbnMpfSR7c3VmZml4fWAudHJpbSgpO1xuICAgIC8vIFVzZWQgYnkgUG9zdGdyZXMgdXBzZXJ0UXVlcnkgYW5kIGNhbGxzIHRvIGhlcmUgd2l0aCBvcHRpb25zLmV4Y2VwdGlvbiBzZXQgdG8gdHJ1ZVxuICAgIGNvbnN0IHJlc3VsdCA9IHsgcXVlcnkgfTtcbiAgICBpZiAob3B0aW9ucy5iaW5kUGFyYW0gIT09IGZhbHNlKSB7XG4gICAgICByZXN1bHQuYmluZCA9IGJpbmQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiB1cGRhdGUgcXVlcnkgdXNpbmcgYXJpdGhtZXRpYyBvcGVyYXRvclxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3BlcmF0b3IgICAgICBTdHJpbmcgd2l0aCB0aGUgYXJpdGhtZXRpYyBvcGVyYXRvciAoZS5nLiAnKycgb3IgJy0nKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFibGVOYW1lICAgICBOYW1lIG9mIHRoZSB0YWJsZVxuICAgKiBAcGFyYW0ge09iamVjdH0gYXR0clZhbHVlSGFzaCBBIGhhc2ggd2l0aCBhdHRyaWJ1dGUtdmFsdWUtcGFpcnNcbiAgICogQHBhcmFtIHtPYmplY3R9IHdoZXJlICAgICAgICAgQSBoYXNoIHdpdGggY29uZGl0aW9ucyAoZS5nLiB7bmFtZTogJ2Zvbyd9KSBPUiBhbiBJRCBhcyBpbnRlZ2VyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzXG4gICAqL1xuICBhcml0aG1ldGljUXVlcnkob3BlcmF0b3IsIHRhYmxlTmFtZSwgYXR0clZhbHVlSGFzaCwgd2hlcmUsIG9wdGlvbnMsIGF0dHJpYnV0ZXMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBfLmRlZmF1bHRzKG9wdGlvbnMsIHsgcmV0dXJuaW5nOiB0cnVlIH0pO1xuXG4gICAgYXR0clZhbHVlSGFzaCA9IFV0aWxzLnJlbW92ZU51bGxWYWx1ZXNGcm9tSGFzaChhdHRyVmFsdWVIYXNoLCB0aGlzLm9wdGlvbnMub21pdE51bGwpO1xuXG4gICAgY29uc3QgdmFsdWVzID0gW107XG4gICAgbGV0IG91dHB1dEZyYWdtZW50ID0gJyc7XG4gICAgbGV0IHJldHVybmluZ0ZyYWdtZW50ID0gJyc7XG5cbiAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5yZXR1cm5WYWx1ZXMgJiYgb3B0aW9ucy5yZXR1cm5pbmcpIHtcbiAgICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnJldHVyblZhbHVlcy5yZXR1cm5pbmcpIHtcbiAgICAgICAgb3B0aW9ucy5tYXBUb01vZGVsID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuaW5nRnJhZ21lbnQgPSAnUkVUVVJOSU5HIConO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnJldHVyblZhbHVlcy5vdXRwdXQpIHtcbiAgICAgICAgb3V0cHV0RnJhZ21lbnQgPSAnIE9VVFBVVCBJTlNFUlRFRC4qJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyVmFsdWVIYXNoKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJWYWx1ZUhhc2hba2V5XTtcbiAgICAgIHZhbHVlcy5wdXNoKGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGtleSl9PSR7dGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KX0ke29wZXJhdG9yfSAke3RoaXMuZXNjYXBlKHZhbHVlKX1gKTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVzID0gYXR0cmlidXRlcyB8fCB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZXNba2V5XTtcbiAgICAgIHZhbHVlcy5wdXNoKGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGtleSl9PSR7dGhpcy5lc2NhcGUodmFsdWUpfWApO1xuICAgIH1cblxuICAgIHJldHVybiBgVVBEQVRFICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9IFNFVCAke3ZhbHVlcy5qb2luKCcsJyl9JHtvdXRwdXRGcmFnbWVudH0gJHt0aGlzLndoZXJlUXVlcnkod2hlcmUpfSAke3JldHVybmluZ0ZyYWdtZW50fWAudHJpbSgpO1xuICB9XG5cbiAgLypcbiAgICBSZXR1cm5zIGFuIGFkZCBpbmRleCBxdWVyeS5cbiAgICBQYXJhbWV0ZXJzOlxuICAgICAgLSB0YWJsZU5hbWUgLT4gTmFtZSBvZiBhbiBleGlzdGluZyB0YWJsZSwgcG9zc2libHkgd2l0aCBzY2hlbWEuXG4gICAgICAtIG9wdGlvbnM6XG4gICAgICAgIC0gdHlwZTogVU5JUVVFfEZVTExURVhUfFNQQVRJQUxcbiAgICAgICAgLSBuYW1lOiBUaGUgbmFtZSBvZiB0aGUgaW5kZXguIERlZmF1bHQgaXMgPHRhYmxlPl88YXR0cjE+XzxhdHRyMj5cbiAgICAgICAgLSBmaWVsZHM6IEFuIGFycmF5IG9mIGF0dHJpYnV0ZXMgYXMgc3RyaW5nIG9yIGFzIGhhc2guXG4gICAgICAgICAgICAgICAgICBJZiB0aGUgYXR0cmlidXRlIGlzIGEgaGFzaCwgaXQgbXVzdCBoYXZlIHRoZSBmb2xsb3dpbmcgY29udGVudDpcbiAgICAgICAgICAgICAgICAgIC0gbmFtZTogVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZS9jb2x1bW5cbiAgICAgICAgICAgICAgICAgIC0gbGVuZ3RoOiBBbiBpbnRlZ2VyLiBPcHRpb25hbFxuICAgICAgICAgICAgICAgICAgLSBvcmRlcjogJ0FTQycgb3IgJ0RFU0MnLiBPcHRpb25hbFxuICAgICAgICAtIHBhcnNlclxuICAgICAgICAtIHVzaW5nXG4gICAgICAgIC0gb3BlcmF0b3JcbiAgICAgICAgLSBjb25jdXJyZW50bHk6IFBhc3MgQ09OQ1VSUkVOVCBzbyBvdGhlciBvcGVyYXRpb25zIHJ1biB3aGlsZSB0aGUgaW5kZXggaXMgY3JlYXRlZFxuICAgICAgLSByYXdUYWJsZW5hbWUsIHRoZSBuYW1lIG9mIHRoZSB0YWJsZSwgd2l0aG91dCBzY2hlbWEuIFVzZWQgdG8gY3JlYXRlIHRoZSBuYW1lIG9mIHRoZSBpbmRleFxuICAgQHByaXZhdGVcbiAgKi9cbiAgYWRkSW5kZXhRdWVyeSh0YWJsZU5hbWUsIGF0dHJpYnV0ZXMsIG9wdGlvbnMsIHJhd1RhYmxlbmFtZSkge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGF0dHJpYnV0ZXMpKSB7XG4gICAgICBvcHRpb25zID0gYXR0cmlidXRlcztcbiAgICAgIGF0dHJpYnV0ZXMgPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdGlvbnMuZmllbGRzID0gYXR0cmlidXRlcztcbiAgICB9XG5cbiAgICBvcHRpb25zLnByZWZpeCA9IG9wdGlvbnMucHJlZml4IHx8IHJhd1RhYmxlbmFtZSB8fCB0YWJsZU5hbWU7XG4gICAgaWYgKG9wdGlvbnMucHJlZml4ICYmIHR5cGVvZiBvcHRpb25zLnByZWZpeCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIG9wdGlvbnMucHJlZml4ID0gb3B0aW9ucy5wcmVmaXgucmVwbGFjZSgvXFwuL2csICdfJyk7XG4gICAgICBvcHRpb25zLnByZWZpeCA9IG9wdGlvbnMucHJlZml4LnJlcGxhY2UoLyhcInwnKS9nLCAnJyk7XG4gICAgfVxuXG4gICAgY29uc3QgZmllbGRzU3FsID0gb3B0aW9ucy5maWVsZHMubWFwKGZpZWxkID0+IHtcbiAgICAgIGlmICh0eXBlb2YgZmllbGQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1b3RlSWRlbnRpZmllcihmaWVsZCk7XG4gICAgICB9XG4gICAgICBpZiAoZmllbGQgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKGZpZWxkKTtcbiAgICAgIH1cbiAgICAgIGxldCByZXN1bHQgPSAnJztcblxuICAgICAgaWYgKGZpZWxkLmF0dHJpYnV0ZSkge1xuICAgICAgICBmaWVsZC5uYW1lID0gZmllbGQuYXR0cmlidXRlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWZpZWxkLm5hbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgZm9sbG93aW5nIGluZGV4IGZpZWxkIGhhcyBubyBuYW1lOiAke3V0aWwuaW5zcGVjdChmaWVsZCl9YCk7XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdCArPSB0aGlzLnF1b3RlSWRlbnRpZmllcihmaWVsZC5uYW1lKTtcblxuICAgICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5kZXguY29sbGF0ZSAmJiBmaWVsZC5jb2xsYXRlKSB7XG4gICAgICAgIHJlc3VsdCArPSBgIENPTExBVEUgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihmaWVsZC5jb2xsYXRlKX1gO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbmRleC5sZW5ndGggJiYgZmllbGQubGVuZ3RoKSB7XG4gICAgICAgIHJlc3VsdCArPSBgKCR7ZmllbGQubGVuZ3RofSlgO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmllbGQub3JkZXIpIHtcbiAgICAgICAgcmVzdWx0ICs9IGAgJHtmaWVsZC5vcmRlcn1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuXG4gICAgaWYgKCFvcHRpb25zLm5hbWUpIHtcbiAgICAgIC8vIE1vc3RseSBmb3IgY2FzZXMgd2hlcmUgYWRkSW5kZXggaXMgY2FsbGVkIGRpcmVjdGx5IGJ5IHRoZSB1c2VyIHdpdGhvdXQgYW4gb3B0aW9ucyBvYmplY3QgKGZvciBleGFtcGxlIGluIG1pZ3JhdGlvbnMpXG4gICAgICAvLyBBbGwgY2FsbHMgdGhhdCBnbyB0aHJvdWdoIHNlcXVlbGl6ZSBzaG91bGQgYWxyZWFkeSBoYXZlIGEgbmFtZVxuICAgICAgb3B0aW9ucyA9IFV0aWxzLm5hbWVJbmRleChvcHRpb25zLCBvcHRpb25zLnByZWZpeCk7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IE1vZGVsLl9jb25mb3JtSW5kZXgob3B0aW9ucyk7XG5cbiAgICBpZiAoIXRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5kZXgudHlwZSkge1xuICAgICAgZGVsZXRlIG9wdGlvbnMudHlwZTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy53aGVyZSkge1xuICAgICAgb3B0aW9ucy53aGVyZSA9IHRoaXMud2hlcmVRdWVyeShvcHRpb25zLndoZXJlKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRhYmxlTmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRhYmxlTmFtZSA9IHRoaXMucXVvdGVJZGVudGlmaWVycyh0YWJsZU5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YWJsZU5hbWUgPSB0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb25jdXJyZW50bHkgPSB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluZGV4LmNvbmN1cnJlbnRseSAmJiBvcHRpb25zLmNvbmN1cnJlbnRseSA/ICdDT05DVVJSRU5UTFknIDogdW5kZWZpbmVkO1xuICAgIGxldCBpbmQ7XG4gICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5kZXhWaWFBbHRlcikge1xuICAgICAgaW5kID0gW1xuICAgICAgICAnQUxURVIgVEFCTEUnLFxuICAgICAgICB0YWJsZU5hbWUsXG4gICAgICAgIGNvbmN1cnJlbnRseSxcbiAgICAgICAgJ0FERCdcbiAgICAgIF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGluZCA9IFsnQ1JFQVRFJ107XG4gICAgfVxuXG4gICAgaW5kID0gaW5kLmNvbmNhdChcbiAgICAgIG9wdGlvbnMudW5pcXVlID8gJ1VOSVFVRScgOiAnJyxcbiAgICAgIG9wdGlvbnMudHlwZSwgJ0lOREVYJyxcbiAgICAgICF0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluZGV4VmlhQWx0ZXIgPyBjb25jdXJyZW50bHkgOiB1bmRlZmluZWQsXG4gICAgICB0aGlzLnF1b3RlSWRlbnRpZmllcnMob3B0aW9ucy5uYW1lKSxcbiAgICAgIHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5kZXgudXNpbmcgPT09IDEgJiYgb3B0aW9ucy51c2luZyA/IGBVU0lORyAke29wdGlvbnMudXNpbmd9YCA6ICcnLFxuICAgICAgIXRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuaW5kZXhWaWFBbHRlciA/IGBPTiAke3RhYmxlTmFtZX1gIDogdW5kZWZpbmVkLFxuICAgICAgdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbmRleC51c2luZyA9PT0gMiAmJiBvcHRpb25zLnVzaW5nID8gYFVTSU5HICR7b3B0aW9ucy51c2luZ31gIDogJycsXG4gICAgICBgKCR7ZmllbGRzU3FsLmpvaW4oJywgJyl9JHtvcHRpb25zLm9wZXJhdG9yID8gYCAke29wdGlvbnMub3BlcmF0b3J9YCA6ICcnfSlgLFxuICAgICAgdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbmRleC5wYXJzZXIgJiYgb3B0aW9ucy5wYXJzZXIgPyBgV0lUSCBQQVJTRVIgJHtvcHRpb25zLnBhcnNlcn1gIDogdW5kZWZpbmVkLFxuICAgICAgdGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5pbmRleC53aGVyZSAmJiBvcHRpb25zLndoZXJlID8gb3B0aW9ucy53aGVyZSA6IHVuZGVmaW5lZFxuICAgICk7XG5cbiAgICByZXR1cm4gXy5jb21wYWN0KGluZCkuam9pbignICcpO1xuICB9XG5cbiAgYWRkQ29uc3RyYWludFF1ZXJ5KHRhYmxlTmFtZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGNvbnN0IGNvbnN0cmFpbnRTbmlwcGV0ID0gdGhpcy5nZXRDb25zdHJhaW50U25pcHBldCh0YWJsZU5hbWUsIG9wdGlvbnMpO1xuXG4gICAgaWYgKHR5cGVvZiB0YWJsZU5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0YWJsZU5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcnModGFibGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFibGVOYW1lID0gdGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGBBTFRFUiBUQUJMRSAke3RhYmxlTmFtZX0gQUREICR7Y29uc3RyYWludFNuaXBwZXR9O2A7XG4gIH1cblxuICBnZXRDb25zdHJhaW50U25pcHBldCh0YWJsZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBsZXQgY29uc3RyYWludFNuaXBwZXQsIGNvbnN0cmFpbnROYW1lO1xuXG4gICAgY29uc3QgZmllbGRzU3FsID0gb3B0aW9ucy5maWVsZHMubWFwKGZpZWxkID0+IHtcbiAgICAgIGlmICh0eXBlb2YgZmllbGQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1b3RlSWRlbnRpZmllcihmaWVsZCk7XG4gICAgICB9XG4gICAgICBpZiAoZmllbGQgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKGZpZWxkKTtcbiAgICAgIH1cbiAgICAgIGlmIChmaWVsZC5hdHRyaWJ1dGUpIHtcbiAgICAgICAgZmllbGQubmFtZSA9IGZpZWxkLmF0dHJpYnV0ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFmaWVsZC5uYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIGZvbGxvd2luZyBpbmRleCBmaWVsZCBoYXMgbm8gbmFtZTogJHtmaWVsZH1gKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMucXVvdGVJZGVudGlmaWVyKGZpZWxkLm5hbWUpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZmllbGRzU3FsUXVvdGVkU3RyaW5nID0gZmllbGRzU3FsLmpvaW4oJywgJyk7XG4gICAgY29uc3QgZmllbGRzU3FsU3RyaW5nID0gZmllbGRzU3FsLmpvaW4oJ18nKTtcblxuICAgIHN3aXRjaCAob3B0aW9ucy50eXBlLnRvVXBwZXJDYXNlKCkpIHtcbiAgICAgIGNhc2UgJ1VOSVFVRSc6XG4gICAgICAgIGNvbnN0cmFpbnROYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXIob3B0aW9ucy5uYW1lIHx8IGAke3RhYmxlTmFtZX1fJHtmaWVsZHNTcWxTdHJpbmd9X3VrYCk7XG4gICAgICAgIGNvbnN0cmFpbnRTbmlwcGV0ID0gYENPTlNUUkFJTlQgJHtjb25zdHJhaW50TmFtZX0gVU5JUVVFICgke2ZpZWxkc1NxbFF1b3RlZFN0cmluZ30pYDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdDSEVDSyc6XG4gICAgICAgIG9wdGlvbnMud2hlcmUgPSB0aGlzLndoZXJlSXRlbXNRdWVyeShvcHRpb25zLndoZXJlKTtcbiAgICAgICAgY29uc3RyYWludE5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihvcHRpb25zLm5hbWUgfHwgYCR7dGFibGVOYW1lfV8ke2ZpZWxkc1NxbFN0cmluZ31fY2tgKTtcbiAgICAgICAgY29uc3RyYWludFNuaXBwZXQgPSBgQ09OU1RSQUlOVCAke2NvbnN0cmFpbnROYW1lfSBDSEVDSyAoJHtvcHRpb25zLndoZXJlfSlgO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0RFRkFVTFQnOlxuICAgICAgICBpZiAob3B0aW9ucy5kZWZhdWx0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGVmYXVsdCB2YWx1ZSBtdXN0IGJlIHNwZWNpZmVkIGZvciBERUZBVUxUIENPTlNUUkFJTlQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9kaWFsZWN0Lm5hbWUgIT09ICdtc3NxbCcpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RlZmF1bHQgY29uc3RyYWludHMgYXJlIHN1cHBvcnRlZCBvbmx5IGZvciBNU1NRTCBkaWFsZWN0LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3RyYWludE5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihvcHRpb25zLm5hbWUgfHwgYCR7dGFibGVOYW1lfV8ke2ZpZWxkc1NxbFN0cmluZ31fZGZgKTtcbiAgICAgICAgY29uc3RyYWludFNuaXBwZXQgPSBgQ09OU1RSQUlOVCAke2NvbnN0cmFpbnROYW1lfSBERUZBVUxUICgke3RoaXMuZXNjYXBlKG9wdGlvbnMuZGVmYXVsdFZhbHVlKX0pIEZPUiAke2ZpZWxkc1NxbFswXX1gO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1BSSU1BUlkgS0VZJzpcbiAgICAgICAgY29uc3RyYWludE5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihvcHRpb25zLm5hbWUgfHwgYCR7dGFibGVOYW1lfV8ke2ZpZWxkc1NxbFN0cmluZ31fcGtgKTtcbiAgICAgICAgY29uc3RyYWludFNuaXBwZXQgPSBgQ09OU1RSQUlOVCAke2NvbnN0cmFpbnROYW1lfSBQUklNQVJZIEtFWSAoJHtmaWVsZHNTcWxRdW90ZWRTdHJpbmd9KWA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnRk9SRUlHTiBLRVknOlxuICAgICAgICBjb25zdCByZWZlcmVuY2VzID0gb3B0aW9ucy5yZWZlcmVuY2VzO1xuICAgICAgICBpZiAoIXJlZmVyZW5jZXMgfHwgIXJlZmVyZW5jZXMudGFibGUgfHwgIXJlZmVyZW5jZXMuZmllbGQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlZmVyZW5jZXMgb2JqZWN0IHdpdGggdGFibGUgYW5kIGZpZWxkIG11c3QgYmUgc3BlY2lmaWVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RyYWludE5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihvcHRpb25zLm5hbWUgfHwgYCR7dGFibGVOYW1lfV8ke2ZpZWxkc1NxbFN0cmluZ31fJHtyZWZlcmVuY2VzLnRhYmxlfV9ma2ApO1xuICAgICAgICBjb25zdCByZWZlcmVuY2VzU25pcHBldCA9IGAke3RoaXMucXVvdGVUYWJsZShyZWZlcmVuY2VzLnRhYmxlKX0gKCR7dGhpcy5xdW90ZUlkZW50aWZpZXIocmVmZXJlbmNlcy5maWVsZCl9KWA7XG4gICAgICAgIGNvbnN0cmFpbnRTbmlwcGV0ID0gYENPTlNUUkFJTlQgJHtjb25zdHJhaW50TmFtZX0gYDtcbiAgICAgICAgY29uc3RyYWludFNuaXBwZXQgKz0gYEZPUkVJR04gS0VZICgke2ZpZWxkc1NxbFF1b3RlZFN0cmluZ30pIFJFRkVSRU5DRVMgJHtyZWZlcmVuY2VzU25pcHBldH1gO1xuICAgICAgICBpZiAob3B0aW9ucy5vblVwZGF0ZSkge1xuICAgICAgICAgIGNvbnN0cmFpbnRTbmlwcGV0ICs9IGAgT04gVVBEQVRFICR7b3B0aW9ucy5vblVwZGF0ZS50b1VwcGVyQ2FzZSgpfWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMub25EZWxldGUpIHtcbiAgICAgICAgICBjb25zdHJhaW50U25pcHBldCArPSBgIE9OIERFTEVURSAke29wdGlvbnMub25EZWxldGUudG9VcHBlckNhc2UoKX1gO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGAke29wdGlvbnMudHlwZX0gaXMgaW52YWxpZC5gKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnN0cmFpbnRTbmlwcGV0O1xuICB9XG5cbiAgcmVtb3ZlQ29uc3RyYWludFF1ZXJ5KHRhYmxlTmFtZSwgY29uc3RyYWludE5hbWUpIHtcbiAgICBpZiAodHlwZW9mIHRhYmxlTmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRhYmxlTmFtZSA9IHRoaXMucXVvdGVJZGVudGlmaWVycyh0YWJsZU5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YWJsZU5hbWUgPSB0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYEFMVEVSIFRBQkxFICR7dGFibGVOYW1lfSBEUk9QIENPTlNUUkFJTlQgJHt0aGlzLnF1b3RlSWRlbnRpZmllcnMoY29uc3RyYWludE5hbWUpfWA7XG4gIH1cblxuICAvKlxuICAgIFF1b3RlIGFuIG9iamVjdCBiYXNlZCBvbiBpdHMgdHlwZS4gVGhpcyBpcyBhIG1vcmUgZ2VuZXJhbCB2ZXJzaW9uIG9mIHF1b3RlSWRlbnRpZmllcnNcbiAgICBTdHJpbmdzOiBzaG91bGQgcHJveHkgdG8gcXVvdGVJZGVudGlmaWVyc1xuICAgIEFycmF5czpcbiAgICAgICogRXhwZWN0cyBhcnJheSBpbiB0aGUgZm9ybTogWzxtb2RlbD4gKG9wdGlvbmFsKSwgPG1vZGVsPiAob3B0aW9uYWwpLC4uLiBTdHJpbmcsIFN0cmluZyAob3B0aW9uYWwpXVxuICAgICAgICBFYWNoIDxtb2RlbD4gY2FuIGJlIGEgbW9kZWwsIG9yIGFuIG9iamVjdCB7bW9kZWw6IE1vZGVsLCBhczogU3RyaW5nfSwgbWF0Y2hpbmcgaW5jbHVkZSwgb3IgYW5cbiAgICAgICAgYXNzb2NpYXRpb24gb2JqZWN0LCBvciB0aGUgbmFtZSBvZiBhbiBhc3NvY2lhdGlvbi5cbiAgICAgICogWmVybyBvciBtb3JlIG1vZGVscyBjYW4gYmUgaW5jbHVkZWQgaW4gdGhlIGFycmF5IGFuZCBhcmUgdXNlZCB0byB0cmFjZSBhIHBhdGggdGhyb3VnaCB0aGUgdHJlZSBvZlxuICAgICAgICBpbmNsdWRlZCBuZXN0ZWQgYXNzb2NpYXRpb25zLiBUaGlzIHByb2R1Y2VzIHRoZSBjb3JyZWN0IHRhYmxlIG5hbWUgZm9yIHRoZSBPUkRFUiBCWS9HUk9VUCBCWSBTUUxcbiAgICAgICAgYW5kIHF1b3RlcyBpdC5cbiAgICAgICogSWYgYSBzaW5nbGUgc3RyaW5nIGlzIGFwcGVuZGVkIHRvIGVuZCBvZiBhcnJheSwgaXQgaXMgcXVvdGVkLlxuICAgICAgICBJZiB0d28gc3RyaW5ncyBhcHBlbmRlZCwgdGhlIDFzdCBzdHJpbmcgaXMgcXVvdGVkLCB0aGUgMm5kIHN0cmluZyB1bnF1b3RlZC5cbiAgICBPYmplY3RzOlxuICAgICAgKiBJZiByYXcgaXMgc2V0LCB0aGF0IHZhbHVlIHNob3VsZCBiZSByZXR1cm5lZCB2ZXJiYXRpbSwgd2l0aG91dCBxdW90aW5nXG4gICAgICAqIElmIGZuIGlzIHNldCwgdGhlIHN0cmluZyBzaG91bGQgc3RhcnQgd2l0aCB0aGUgdmFsdWUgb2YgZm4sIHN0YXJ0aW5nIHBhcmVuLCBmb2xsb3dlZCBieVxuICAgICAgICB0aGUgdmFsdWVzIG9mIGNvbHMgKHdoaWNoIGlzIGFzc3VtZWQgdG8gYmUgYW4gYXJyYXkpLCBxdW90ZWQgYW5kIGpvaW5lZCB3aXRoICcsICcsXG4gICAgICAgIHVubGVzcyB0aGV5IGFyZSB0aGVtc2VsdmVzIG9iamVjdHNcbiAgICAgICogSWYgZGlyZWN0aW9uIGlzIHNldCwgc2hvdWxkIGJlIHByZXBlbmRlZFxuXG4gICAgQ3VycmVudGx5IHRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIGZvciBvcmRlcmluZyAvIGdyb3VwaW5nIGNvbHVtbnMgYW5kIFNlcXVlbGl6ZS5jb2woKSwgYnV0IGl0IGNvdWxkXG4gICAgcG90ZW50aWFsbHkgYWxzbyBiZSB1c2VkIGZvciBvdGhlciBwbGFjZXMgd2hlcmUgd2Ugd2FudCB0byBiZSBhYmxlIHRvIGNhbGwgU1FMIGZ1bmN0aW9ucyAoZS5nLiBhcyBkZWZhdWx0IHZhbHVlcylcbiAgIEBwcml2YXRlXG4gICovXG4gIHF1b3RlKGNvbGxlY3Rpb24sIHBhcmVudCwgY29ubmVjdG9yKSB7XG4gICAgLy8gaW5pdFxuICAgIGNvbnN0IHZhbGlkT3JkZXJPcHRpb25zID0gW1xuICAgICAgJ0FTQycsXG4gICAgICAnREVTQycsXG4gICAgICAnQVNDIE5VTExTIExBU1QnLFxuICAgICAgJ0RFU0MgTlVMTFMgTEFTVCcsXG4gICAgICAnQVNDIE5VTExTIEZJUlNUJyxcbiAgICAgICdERVNDIE5VTExTIEZJUlNUJyxcbiAgICAgICdOVUxMUyBGSVJTVCcsXG4gICAgICAnTlVMTFMgTEFTVCdcbiAgICBdO1xuXG4gICAgLy8gZGVmYXVsdFxuICAgIGNvbm5lY3RvciA9IGNvbm5lY3RvciB8fCAnLic7XG5cbiAgICAvLyBqdXN0IHF1b3RlIGFzIGlkZW50aWZpZXJzIGlmIHN0cmluZ1xuICAgIGlmICh0eXBlb2YgY29sbGVjdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLnF1b3RlSWRlbnRpZmllcnMoY29sbGVjdGlvbik7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGNvbGxlY3Rpb24pKSB7XG4gICAgICAvLyBpdGVyYXRlIHRocm91Z2ggdGhlIGNvbGxlY3Rpb24gYW5kIG11dGF0ZSBvYmplY3RzIGludG8gYXNzb2NpYXRpb25zXG4gICAgICBjb2xsZWN0aW9uLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzID0gY29sbGVjdGlvbltpbmRleCAtIDFdO1xuICAgICAgICBsZXQgcHJldmlvdXNBc3NvY2lhdGlvbjtcbiAgICAgICAgbGV0IHByZXZpb3VzTW9kZWw7XG5cbiAgICAgICAgLy8gc2V0IHRoZSBwcmV2aW91cyBhcyB0aGUgcGFyZW50IHdoZW4gcHJldmlvdXMgaXMgdW5kZWZpbmVkIG9yIHRoZSB0YXJnZXQgb2YgdGhlIGFzc29jaWF0aW9uXG4gICAgICAgIGlmICghcHJldmlvdXMgJiYgcGFyZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBwcmV2aW91c01vZGVsID0gcGFyZW50O1xuICAgICAgICB9IGVsc2UgaWYgKHByZXZpb3VzICYmIHByZXZpb3VzIGluc3RhbmNlb2YgQXNzb2NpYXRpb24pIHtcbiAgICAgICAgICBwcmV2aW91c0Fzc29jaWF0aW9uID0gcHJldmlvdXM7XG4gICAgICAgICAgcHJldmlvdXNNb2RlbCA9IHByZXZpb3VzLnRhcmdldDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZSBwcmV2aW91cyBpdGVtIGlzIGEgbW9kZWwsIHRoZW4gYXR0ZW1wdCBnZXR0aW5nIGFuIGFzc29jaWF0aW9uXG4gICAgICAgIGlmIChwcmV2aW91c01vZGVsICYmIHByZXZpb3VzTW9kZWwucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpIHtcbiAgICAgICAgICBsZXQgbW9kZWw7XG4gICAgICAgICAgbGV0IGFzO1xuXG4gICAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnZnVuY3Rpb24nICYmIGl0ZW0ucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpIHtcbiAgICAgICAgICAgIC8vIHNldFxuICAgICAgICAgICAgbW9kZWwgPSBpdGVtO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXy5pc1BsYWluT2JqZWN0KGl0ZW0pICYmIGl0ZW0ubW9kZWwgJiYgaXRlbS5tb2RlbC5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCkge1xuICAgICAgICAgICAgLy8gc2V0XG4gICAgICAgICAgICBtb2RlbCA9IGl0ZW0ubW9kZWw7XG4gICAgICAgICAgICBhcyA9IGl0ZW0uYXM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG1vZGVsKSB7XG4gICAgICAgICAgICAvLyBzZXQgdGhlIGFzIHRvIGVpdGhlciB0aGUgdGhyb3VnaCBuYW1lIG9yIHRoZSBtb2RlbCBuYW1lXG4gICAgICAgICAgICBpZiAoIWFzICYmIHByZXZpb3VzQXNzb2NpYXRpb24gJiYgcHJldmlvdXNBc3NvY2lhdGlvbiBpbnN0YW5jZW9mIEFzc29jaWF0aW9uICYmIHByZXZpb3VzQXNzb2NpYXRpb24udGhyb3VnaCAmJiBwcmV2aW91c0Fzc29jaWF0aW9uLnRocm91Z2gubW9kZWwgPT09IG1vZGVsKSB7XG4gICAgICAgICAgICAgIC8vIGdldCBmcm9tIHByZXZpb3VzIGFzc29jaWF0aW9uXG4gICAgICAgICAgICAgIGl0ZW0gPSBuZXcgQXNzb2NpYXRpb24ocHJldmlvdXNNb2RlbCwgbW9kZWwsIHtcbiAgICAgICAgICAgICAgICBhczogbW9kZWwubmFtZVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIGdldCBhc3NvY2lhdGlvbiBmcm9tIHByZXZpb3VzIG1vZGVsXG4gICAgICAgICAgICAgIGl0ZW0gPSBwcmV2aW91c01vZGVsLmdldEFzc29jaWF0aW9uRm9yQWxpYXMobW9kZWwsIGFzKTtcblxuICAgICAgICAgICAgICAvLyBhdHRlbXB0IHRvIHVzZSB0aGUgbW9kZWwgbmFtZSBpZiB0aGUgaXRlbSBpcyBzdGlsbCBudWxsXG4gICAgICAgICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgICAgIGl0ZW0gPSBwcmV2aW91c01vZGVsLmdldEFzc29jaWF0aW9uRm9yQWxpYXMobW9kZWwsIG1vZGVsLm5hbWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBoYXZlIGFuIGFzc29jaWF0aW9uXG4gICAgICAgICAgICBpZiAoIShpdGVtIGluc3RhbmNlb2YgQXNzb2NpYXRpb24pKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcih1dGlsLmZvcm1hdCgnVW5hYmxlIHRvIGZpbmQgYSB2YWxpZCBhc3NvY2lhdGlvbiBmb3IgbW9kZWwsIFxcJyVzXFwnJywgbW9kZWwubmFtZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAvLyBnZXQgb3JkZXIgaW5kZXhcbiAgICAgICAgICBjb25zdCBvcmRlckluZGV4ID0gdmFsaWRPcmRlck9wdGlvbnMuaW5kZXhPZihpdGVtLnRvVXBwZXJDYXNlKCkpO1xuXG4gICAgICAgICAgLy8gc2VlIGlmIHRoaXMgaXMgYW4gb3JkZXJcbiAgICAgICAgICBpZiAoaW5kZXggPiAwICYmIG9yZGVySW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBpdGVtID0gdGhpcy5zZXF1ZWxpemUubGl0ZXJhbChgICR7dmFsaWRPcmRlck9wdGlvbnNbb3JkZXJJbmRleF19YCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwcmV2aW91c01vZGVsICYmIHByZXZpb3VzTW9kZWwucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpIHtcbiAgICAgICAgICAgIC8vIG9ubHkgZ28gZG93biB0aGlzIHBhdGggaWYgd2UgaGF2ZSBwcmVpdm91cyBtb2RlbCBhbmQgY2hlY2sgb25seSBvbmNlXG4gICAgICAgICAgICBpZiAocHJldmlvdXNNb2RlbC5hc3NvY2lhdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBwcmV2aW91c01vZGVsLmFzc29jaWF0aW9uc1tpdGVtXSkge1xuICAgICAgICAgICAgICAvLyBjb252ZXJ0IHRoZSBpdGVtIHRvIGFuIGFzc29jaWF0aW9uXG4gICAgICAgICAgICAgIGl0ZW0gPSBwcmV2aW91c01vZGVsLmFzc29jaWF0aW9uc1tpdGVtXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJldmlvdXNNb2RlbC5yYXdBdHRyaWJ1dGVzICE9PSB1bmRlZmluZWQgJiYgcHJldmlvdXNNb2RlbC5yYXdBdHRyaWJ1dGVzW2l0ZW1dICYmIGl0ZW0gIT09IHByZXZpb3VzTW9kZWwucmF3QXR0cmlidXRlc1tpdGVtXS5maWVsZCkge1xuICAgICAgICAgICAgICAvLyBjb252ZXJ0IHRoZSBpdGVtIGF0dHJpYnV0ZSBmcm9tIGl0cyBhbGlhc1xuICAgICAgICAgICAgICBpdGVtID0gcHJldmlvdXNNb2RlbC5yYXdBdHRyaWJ1dGVzW2l0ZW1dLmZpZWxkO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgaXRlbS5pbmNsdWRlcygnLicpXG4gICAgICAgICAgICAgICYmIHByZXZpb3VzTW9kZWwucmF3QXR0cmlidXRlcyAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29uc3QgaXRlbVNwbGl0ID0gaXRlbS5zcGxpdCgnLicpO1xuXG4gICAgICAgICAgICAgIGlmIChwcmV2aW91c01vZGVsLnJhd0F0dHJpYnV0ZXNbaXRlbVNwbGl0WzBdXS50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkpTT04pIHtcbiAgICAgICAgICAgICAgICAvLyBqdXN0IHF1b3RlIGlkZW50aWZpZXJzIGZvciBub3dcbiAgICAgICAgICAgICAgICBjb25zdCBpZGVudGlmaWVyID0gdGhpcy5xdW90ZUlkZW50aWZpZXJzKGAke3ByZXZpb3VzTW9kZWwubmFtZX0uJHtwcmV2aW91c01vZGVsLnJhd0F0dHJpYnV0ZXNbaXRlbVNwbGl0WzBdXS5maWVsZH1gKTtcblxuICAgICAgICAgICAgICAgIC8vIGdldCBwYXRoXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGl0ZW1TcGxpdC5zbGljZSgxKTtcblxuICAgICAgICAgICAgICAgIC8vIGV4dHJhY3QgcGF0aFxuICAgICAgICAgICAgICAgIGl0ZW0gPSB0aGlzLmpzb25QYXRoRXh0cmFjdGlvblF1ZXJ5KGlkZW50aWZpZXIsIHBhdGgpO1xuXG4gICAgICAgICAgICAgICAgLy8gbGl0ZXJhbCBiZWNhdXNlIHdlIGRvbid0IHdhbnQgdG8gYXBwZW5kIHRoZSBtb2RlbCBuYW1lIHdoZW4gc3RyaW5nXG4gICAgICAgICAgICAgICAgaXRlbSA9IHRoaXMuc2VxdWVsaXplLmxpdGVyYWwoaXRlbSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb2xsZWN0aW9uW2luZGV4XSA9IGl0ZW07XG4gICAgICB9LCB0aGlzKTtcblxuICAgICAgLy8gbG9vcCB0aHJvdWdoIGFycmF5LCBhZGRpbmcgdGFibGUgbmFtZXMgb2YgbW9kZWxzIHRvIHF1b3RlZFxuICAgICAgY29uc3QgY29sbGVjdGlvbkxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuICAgICAgY29uc3QgdGFibGVOYW1lcyA9IFtdO1xuICAgICAgbGV0IGl0ZW07XG4gICAgICBsZXQgaSA9IDA7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBjb2xsZWN0aW9uTGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBjb2xsZWN0aW9uW2ldO1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnIHx8IGl0ZW0uX21vZGVsQXR0cmlidXRlIHx8IGl0ZW0gaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtIGluc3RhbmNlb2YgQXNzb2NpYXRpb24pIHtcbiAgICAgICAgICB0YWJsZU5hbWVzW2ldID0gaXRlbS5hcztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBzdGFydCBidWlsZGluZyBzcWxcbiAgICAgIGxldCBzcWwgPSAnJztcblxuICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgIHNxbCArPSBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcih0YWJsZU5hbWVzLmpvaW4oY29ubmVjdG9yKSl9LmA7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb2xsZWN0aW9uWzBdID09PSAnc3RyaW5nJyAmJiBwYXJlbnQpIHtcbiAgICAgICAgc3FsICs9IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKHBhcmVudC5uYW1lKX0uYDtcbiAgICAgIH1cblxuICAgICAgLy8gbG9vcCB0aHJvdWdoIGV2ZXJ5dGhpbmcgcGFzdCBpIGFuZCBhcHBlbmQgdG8gdGhlIHNxbFxuICAgICAgY29sbGVjdGlvbi5zbGljZShpKS5mb3JFYWNoKGNvbGxlY3Rpb25JdGVtID0+IHtcbiAgICAgICAgc3FsICs9IHRoaXMucXVvdGUoY29sbGVjdGlvbkl0ZW0sIHBhcmVudCwgY29ubmVjdG9yKTtcbiAgICAgIH0sIHRoaXMpO1xuXG4gICAgICByZXR1cm4gc3FsO1xuICAgIH1cbiAgICBpZiAoY29sbGVjdGlvbi5fbW9kZWxBdHRyaWJ1dGUpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLnF1b3RlVGFibGUoY29sbGVjdGlvbi5Nb2RlbC5uYW1lKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihjb2xsZWN0aW9uLmZpZWxkTmFtZSl9YDtcbiAgICB9XG4gICAgaWYgKGNvbGxlY3Rpb24gaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhbmRsZVNlcXVlbGl6ZU1ldGhvZChjb2xsZWN0aW9uKTtcbiAgICB9XG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdChjb2xsZWN0aW9uKSAmJiBjb2xsZWN0aW9uLnJhdykge1xuICAgICAgLy8gc2ltcGxlIG9iamVjdHMgd2l0aCByYXcgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgYHtyYXc6IFwiLi4uXCJ9YCBzeW50YXggaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC4gIFVzZSBgc2VxdWVsaXplLmxpdGVyYWxgIGluc3RlYWQuJyk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBzdHJ1Y3R1cmUgcGFzc2VkIHRvIG9yZGVyIC8gZ3JvdXA6ICR7dXRpbC5pbnNwZWN0KGNvbGxlY3Rpb24pfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNwbGl0IGEgbGlzdCBvZiBpZGVudGlmaWVycyBieSBcIi5cIiBhbmQgcXVvdGUgZWFjaCBwYXJ0XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpZGVudGlmaWVyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2VcbiAgICpcbiAgICogQHJldHVybnMge3N0cmluZ31cbiAgICovXG4gIHF1b3RlSWRlbnRpZmllcihpZGVudGlmaWVyLCBmb3JjZSkge1xuICAgIHJldHVybiBRdW90ZUhlbHBlci5xdW90ZUlkZW50aWZpZXIodGhpcy5kaWFsZWN0LCBpZGVudGlmaWVyLCB7XG4gICAgICBmb3JjZSxcbiAgICAgIHF1b3RlSWRlbnRpZmllcnM6IHRoaXMub3B0aW9ucy5xdW90ZUlkZW50aWZpZXJzXG4gICAgfSk7XG4gIH1cblxuICBxdW90ZUlkZW50aWZpZXJzKGlkZW50aWZpZXJzKSB7XG4gICAgaWYgKGlkZW50aWZpZXJzLmluY2x1ZGVzKCcuJykpIHtcbiAgICAgIGlkZW50aWZpZXJzID0gaWRlbnRpZmllcnMuc3BsaXQoJy4nKTtcblxuICAgICAgY29uc3QgaGVhZCA9IGlkZW50aWZpZXJzLnNsaWNlKDAsIGlkZW50aWZpZXJzLmxlbmd0aCAtIDEpLmpvaW4oJy0+Jyk7XG4gICAgICBjb25zdCB0YWlsID0gaWRlbnRpZmllcnNbaWRlbnRpZmllcnMubGVuZ3RoIC0gMV07XG5cbiAgICAgIHJldHVybiBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihoZWFkKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcih0YWlsKX1gO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnF1b3RlSWRlbnRpZmllcihpZGVudGlmaWVycyk7XG4gIH1cblxuICBxdW90ZUF0dHJpYnV0ZShhdHRyaWJ1dGUsIG1vZGVsKSB7XG4gICAgaWYgKG1vZGVsICYmIGF0dHJpYnV0ZSBpbiBtb2RlbC5yYXdBdHRyaWJ1dGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cmlidXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucXVvdGVJZGVudGlmaWVycyhhdHRyaWJ1dGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1b3RlIHRhYmxlIG5hbWUgd2l0aCBvcHRpb25hbCBhbGlhcyBhbmQgc2NoZW1hIGF0dHJpYnV0aW9uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gIHBhcmFtIHRhYmxlIHN0cmluZyBvciBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd8Ym9vbGVhbn0gYWxpYXMgYWxpYXMgbmFtZVxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgKi9cbiAgcXVvdGVUYWJsZShwYXJhbSwgYWxpYXMpIHtcbiAgICBsZXQgdGFibGUgPSAnJztcblxuICAgIGlmIChhbGlhcyA9PT0gdHJ1ZSkge1xuICAgICAgYWxpYXMgPSBwYXJhbS5hcyB8fCBwYXJhbS5uYW1lIHx8IHBhcmFtO1xuICAgIH1cblxuICAgIGlmIChfLmlzT2JqZWN0KHBhcmFtKSkge1xuICAgICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMuc2NoZW1hcykge1xuICAgICAgICBpZiAocGFyYW0uc2NoZW1hKSB7XG4gICAgICAgICAgdGFibGUgKz0gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIocGFyYW0uc2NoZW1hKX0uYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhYmxlICs9IHRoaXMucXVvdGVJZGVudGlmaWVyKHBhcmFtLnRhYmxlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocGFyYW0uc2NoZW1hKSB7XG4gICAgICAgICAgdGFibGUgKz0gcGFyYW0uc2NoZW1hICsgKHBhcmFtLmRlbGltaXRlciB8fCAnLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGFibGUgKz0gcGFyYW0udGFibGVOYW1lO1xuICAgICAgICB0YWJsZSA9IHRoaXMucXVvdGVJZGVudGlmaWVyKHRhYmxlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGFibGUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihwYXJhbSk7XG4gICAgfVxuXG4gICAgaWYgKGFsaWFzKSB7XG4gICAgICB0YWJsZSArPSBgIEFTICR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYWxpYXMpfWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhYmxlO1xuICB9XG5cbiAgLypcbiAgICBFc2NhcGUgYSB2YWx1ZSAoZS5nLiBhIHN0cmluZywgbnVtYmVyIG9yIGRhdGUpXG4gICAgQHByaXZhdGVcbiAgKi9cbiAgZXNjYXBlKHZhbHVlLCBmaWVsZCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2QodmFsdWUpO1xuICAgICAgfVxuICAgICAgaWYgKGZpZWxkICYmIGZpZWxkLnR5cGUpIHtcbiAgICAgICAgdGhpcy52YWxpZGF0ZSh2YWx1ZSwgZmllbGQsIG9wdGlvbnMpO1xuXG4gICAgICAgIGlmIChmaWVsZC50eXBlLnN0cmluZ2lmeSkge1xuICAgICAgICAgIC8vIFVzZXJzIHNob3VsZG4ndCBoYXZlIHRvIHdvcnJ5IGFib3V0IHRoZXNlIGFyZ3MgLSBqdXN0IGdpdmUgdGhlbSBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBzaW5nbGUgYXJnXG4gICAgICAgICAgY29uc3Qgc2ltcGxlRXNjYXBlID0gZXNjVmFsID0+IFNxbFN0cmluZy5lc2NhcGUoZXNjVmFsLCB0aGlzLm9wdGlvbnMudGltZXpvbmUsIHRoaXMuZGlhbGVjdCk7XG5cbiAgICAgICAgICB2YWx1ZSA9IGZpZWxkLnR5cGUuc3RyaW5naWZ5KHZhbHVlLCB7IGVzY2FwZTogc2ltcGxlRXNjYXBlLCBmaWVsZCwgdGltZXpvbmU6IHRoaXMub3B0aW9ucy50aW1lem9uZSwgb3BlcmF0aW9uOiBvcHRpb25zLm9wZXJhdGlvbiB9KTtcblxuICAgICAgICAgIGlmIChmaWVsZC50eXBlLmVzY2FwZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkYXRhLXR5cGUgYWxyZWFkeSBkaWQgdGhlIHJlcXVpcmVkIGVzY2FwaW5nXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFNxbFN0cmluZy5lc2NhcGUodmFsdWUsIHRoaXMub3B0aW9ucy50aW1lem9uZSwgdGhpcy5kaWFsZWN0KTtcbiAgfVxuXG4gIGJpbmRQYXJhbShiaW5kKSB7XG4gICAgcmV0dXJuIHZhbHVlID0+IHtcbiAgICAgIGJpbmQucHVzaCh2YWx1ZSk7XG4gICAgICByZXR1cm4gYCQke2JpbmQubGVuZ3RofWA7XG4gICAgfTtcbiAgfVxuXG4gIC8qXG4gICAgUmV0dXJucyBhIGJpbmQgcGFyYW1ldGVyIHJlcHJlc2VudGF0aW9uIG9mIGEgdmFsdWUgKGUuZy4gYSBzdHJpbmcsIG51bWJlciBvciBkYXRlKVxuICAgIEBwcml2YXRlXG4gICovXG4gIGZvcm1hdCh2YWx1ZSwgZmllbGQsIG9wdGlvbnMsIGJpbmRQYXJhbSkge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwYXNzIFNlcXVlbGl6ZU1ldGhvZCBhcyBhIGJpbmQgcGFyYW1ldGVyIC0gdXNlIGVzY2FwZSBpbnN0ZWFkJyk7XG4gICAgICB9XG4gICAgICBpZiAoZmllbGQgJiYgZmllbGQudHlwZSkge1xuICAgICAgICB0aGlzLnZhbGlkYXRlKHZhbHVlLCBmaWVsZCwgb3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKGZpZWxkLnR5cGUuYmluZFBhcmFtKSB7XG4gICAgICAgICAgcmV0dXJuIGZpZWxkLnR5cGUuYmluZFBhcmFtKHZhbHVlLCB7IGVzY2FwZTogXy5pZGVudGl0eSwgZmllbGQsIHRpbWV6b25lOiB0aGlzLm9wdGlvbnMudGltZXpvbmUsIG9wZXJhdGlvbjogb3B0aW9ucy5vcGVyYXRpb24sIGJpbmRQYXJhbSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBiaW5kUGFyYW0odmFsdWUpO1xuICB9XG5cbiAgLypcbiAgICBWYWxpZGF0ZSBhIHZhbHVlIGFnYWluc3QgYSBmaWVsZCBzcGVjaWZpY2F0aW9uXG4gICAgQHByaXZhdGVcbiAgKi9cbiAgdmFsaWRhdGUodmFsdWUsIGZpZWxkLCBvcHRpb25zKSB7XG4gICAgaWYgKHRoaXMudHlwZVZhbGlkYXRpb24gJiYgZmllbGQudHlwZS52YWxpZGF0ZSAmJiB2YWx1ZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaXNMaXN0ICYmIEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHZhbHVlKSB7XG4gICAgICAgICAgICBmaWVsZC50eXBlLnZhbGlkYXRlKGl0ZW0sIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmaWVsZC50eXBlLnZhbGlkYXRlKHZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2Ygc2VxdWVsaXplRXJyb3IuVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICAgICAgZXJyb3IuZXJyb3JzLnB1c2gobmV3IHNlcXVlbGl6ZUVycm9yLlZhbGlkYXRpb25FcnJvckl0ZW0oXG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgICAgJ1ZhbGlkYXRpb24gZXJyb3InLFxuICAgICAgICAgICAgZmllbGQuZmllbGROYW1lLFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgYCR7ZmllbGQudHlwZS5rZXl9IHZhbGlkYXRvcmBcbiAgICAgICAgICApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlzSWRlbnRpZmllclF1b3RlZChpZGVudGlmaWVyKSB7XG4gICAgcmV0dXJuIFF1b3RlSGVscGVyLmlzSWRlbnRpZmllclF1b3RlZChpZGVudGlmaWVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYW4gU1FMIHF1ZXJ5IHRoYXQgZXh0cmFjdCBKU09OIHByb3BlcnR5IG9mIGdpdmVuIHBhdGguXG4gICAqXG4gICAqIEBwYXJhbSAgIHtzdHJpbmd9ICAgICAgICAgICAgICAgY29sdW1uICBUaGUgSlNPTiBjb2x1bW5cbiAgICogQHBhcmFtICAge3N0cmluZ3xBcnJheTxzdHJpbmc+fSBbcGF0aF0gIFRoZSBwYXRoIHRvIGV4dHJhY3QgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgVGhlIGdlbmVyYXRlZCBzcWwgcXVlcnlcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGpzb25QYXRoRXh0cmFjdGlvblF1ZXJ5KGNvbHVtbiwgcGF0aCkge1xuICAgIGxldCBwYXRocyA9IF8udG9QYXRoKHBhdGgpO1xuICAgIGxldCBwYXRoU3RyO1xuICAgIGNvbnN0IHF1b3RlZENvbHVtbiA9IHRoaXMuaXNJZGVudGlmaWVyUXVvdGVkKGNvbHVtbilcbiAgICAgID8gY29sdW1uXG4gICAgICA6IHRoaXMucXVvdGVJZGVudGlmaWVyKGNvbHVtbik7XG5cbiAgICBzd2l0Y2ggKHRoaXMuZGlhbGVjdCkge1xuICAgICAgY2FzZSAnbXlzcWwnOlxuICAgICAgY2FzZSAnbWFyaWFkYic6XG4gICAgICBjYXNlICdzcWxpdGUnOlxuICAgICAgICAvKipcbiAgICAgICAgICogTm9uIGRpZ2l0IHN1YiBwYXRocyBuZWVkIHRvIGJlIHF1b3RlZCBhcyBFQ01BU2NyaXB0IGlkZW50aWZpZXJzXG4gICAgICAgICAqIGh0dHBzOi8vYnVncy5teXNxbC5jb20vYnVnLnBocD9pZD04MTg5NlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHRoaXMuZGlhbGVjdCA9PT0gJ215c3FsJykge1xuICAgICAgICAgIHBhdGhzID0gcGF0aHMubWFwKHN1YlBhdGggPT4ge1xuICAgICAgICAgICAgcmV0dXJuIC9cXEQvLnRlc3Qoc3ViUGF0aClcbiAgICAgICAgICAgICAgPyBVdGlscy5hZGRUaWNrcyhzdWJQYXRoLCAnXCInKVxuICAgICAgICAgICAgICA6IHN1YlBhdGg7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwYXRoU3RyID0gdGhpcy5lc2NhcGUoWyckJ11cbiAgICAgICAgICAuY29uY2F0KHBhdGhzKVxuICAgICAgICAgIC5qb2luKCcuJylcbiAgICAgICAgICAucmVwbGFjZSgvXFwuKFxcZCspKD86KD89XFwuKXwkKS9nLCAoX18sIGRpZ2l0KSA9PiBgWyR7ZGlnaXR9XWApKTtcblxuICAgICAgICBpZiAodGhpcy5kaWFsZWN0ID09PSAnc3FsaXRlJykge1xuICAgICAgICAgIHJldHVybiBganNvbl9leHRyYWN0KCR7cXVvdGVkQ29sdW1ufSwke3BhdGhTdHJ9KWA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYGpzb25fdW5xdW90ZShqc29uX2V4dHJhY3QoJHtxdW90ZWRDb2x1bW59LCR7cGF0aFN0cn0pKWA7XG5cbiAgICAgIGNhc2UgJ3Bvc3RncmVzJzpcbiAgICAgICAgcGF0aFN0ciA9IHRoaXMuZXNjYXBlKGB7JHtwYXRocy5qb2luKCcsJyl9fWApO1xuICAgICAgICByZXR1cm4gYCgke3F1b3RlZENvbHVtbn0jPj4ke3BhdGhTdHJ9KWA7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgJHt0aGlzLmRpYWxlY3R9IGZvciBKU09OIG9wZXJhdGlvbnNgKTtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgIFJldHVybnMgYSBxdWVyeSBmb3Igc2VsZWN0aW5nIGVsZW1lbnRzIGluIHRoZSB0YWJsZSA8dGFibGVOYW1lPi5cbiAgICBPcHRpb25zOlxuICAgICAgLSBhdHRyaWJ1dGVzIC0+IEFuIGFycmF5IG9mIGF0dHJpYnV0ZXMgKGUuZy4gWyduYW1lJywgJ2JpcnRoZGF5J10pLiBEZWZhdWx0OiAqXG4gICAgICAtIHdoZXJlIC0+IEEgaGFzaCB3aXRoIGNvbmRpdGlvbnMgKGUuZy4ge25hbWU6ICdmb28nfSlcbiAgICAgICAgICAgICAgICAgT1IgYW4gSUQgYXMgaW50ZWdlclxuICAgICAgLSBvcmRlciAtPiBlLmcuICdpZCBERVNDJ1xuICAgICAgLSBncm91cFxuICAgICAgLSBsaW1pdCAtPiBUaGUgbWF4aW11bSBjb3VudCB5b3Ugd2FudCB0byBnZXQuXG4gICAgICAtIG9mZnNldCAtPiBBbiBvZmZzZXQgdmFsdWUgdG8gc3RhcnQgZnJvbS4gT25seSB1c2VhYmxlIHdpdGggbGltaXQhXG4gICBAcHJpdmF0ZVxuICAqL1xuICBzZWxlY3RRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMsIG1vZGVsKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgY29uc3QgbGltaXQgPSBvcHRpb25zLmxpbWl0O1xuICAgIGNvbnN0IG1haW5RdWVyeUl0ZW1zID0gW107XG4gICAgY29uc3Qgc3ViUXVlcnlJdGVtcyA9IFtdO1xuICAgIGNvbnN0IHN1YlF1ZXJ5ID0gb3B0aW9ucy5zdWJRdWVyeSA9PT0gdW5kZWZpbmVkID8gbGltaXQgJiYgb3B0aW9ucy5oYXNNdWx0aUFzc29jaWF0aW9uIDogb3B0aW9ucy5zdWJRdWVyeTtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0ge1xuICAgICAgbWFpbjogb3B0aW9ucy5hdHRyaWJ1dGVzICYmIG9wdGlvbnMuYXR0cmlidXRlcy5zbGljZSgpLFxuICAgICAgc3ViUXVlcnk6IG51bGxcbiAgICB9O1xuICAgIGNvbnN0IG1haW5UYWJsZSA9IHtcbiAgICAgIG5hbWU6IHRhYmxlTmFtZSxcbiAgICAgIHF1b3RlZE5hbWU6IG51bGwsXG4gICAgICBhczogbnVsbCxcbiAgICAgIG1vZGVsXG4gICAgfTtcbiAgICBjb25zdCB0b3BMZXZlbEluZm8gPSB7XG4gICAgICBuYW1lczogbWFpblRhYmxlLFxuICAgICAgb3B0aW9ucyxcbiAgICAgIHN1YlF1ZXJ5XG4gICAgfTtcbiAgICBsZXQgbWFpbkpvaW5RdWVyaWVzID0gW107XG4gICAgbGV0IHN1YkpvaW5RdWVyaWVzID0gW107XG4gICAgbGV0IHF1ZXJ5O1xuXG4gICAgLy8gQWxpYXNlcyBjYW4gYmUgcGFzc2VkIHRocm91Z2ggc3VicXVlcmllcyBhbmQgd2UgZG9uJ3Qgd2FudCB0byByZXNldCB0aGVtXG4gICAgaWYgKHRoaXMub3B0aW9ucy5taW5pZnlBbGlhc2VzICYmICFvcHRpb25zLmFsaWFzZXNNYXBwaW5nKSB7XG4gICAgICBvcHRpb25zLmFsaWFzZXNNYXBwaW5nID0gbmV3IE1hcCgpO1xuICAgICAgb3B0aW9ucy5hbGlhc2VzQnlUYWJsZSA9IHt9O1xuICAgIH1cblxuICAgIC8vIHJlc29sdmUgdGFibGUgbmFtZSBvcHRpb25zXG4gICAgaWYgKG9wdGlvbnMudGFibGVBcykge1xuICAgICAgbWFpblRhYmxlLmFzID0gdGhpcy5xdW90ZUlkZW50aWZpZXIob3B0aW9ucy50YWJsZUFzKTtcbiAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KG1haW5UYWJsZS5uYW1lKSAmJiBtYWluVGFibGUubW9kZWwpIHtcbiAgICAgIG1haW5UYWJsZS5hcyA9IHRoaXMucXVvdGVJZGVudGlmaWVyKG1haW5UYWJsZS5tb2RlbC5uYW1lKTtcbiAgICB9XG5cbiAgICBtYWluVGFibGUucXVvdGVkTmFtZSA9ICFBcnJheS5pc0FycmF5KG1haW5UYWJsZS5uYW1lKSA/IHRoaXMucXVvdGVUYWJsZShtYWluVGFibGUubmFtZSkgOiB0YWJsZU5hbWUubWFwKHQgPT4ge1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodCkgPyB0aGlzLnF1b3RlVGFibGUodFswXSwgdFsxXSkgOiB0aGlzLnF1b3RlVGFibGUodCwgdHJ1ZSk7XG4gICAgfSkuam9pbignLCAnKTtcblxuICAgIGlmIChzdWJRdWVyeSAmJiBhdHRyaWJ1dGVzLm1haW4pIHtcbiAgICAgIGZvciAoY29uc3Qga2V5QXR0IG9mIG1haW5UYWJsZS5tb2RlbC5wcmltYXJ5S2V5QXR0cmlidXRlcykge1xuICAgICAgICAvLyBDaGVjayBpZiBtYWluQXR0cmlidXRlcyBjb250YWluIHRoZSBwcmltYXJ5IGtleSBvZiB0aGUgbW9kZWwgZWl0aGVyIGFzIGEgZmllbGQgb3IgYW4gYWxpYXNlZCBmaWVsZFxuICAgICAgICBpZiAoIWF0dHJpYnV0ZXMubWFpbi5zb21lKGF0dHIgPT4ga2V5QXR0ID09PSBhdHRyIHx8IGtleUF0dCA9PT0gYXR0clswXSB8fCBrZXlBdHQgPT09IGF0dHJbMV0pKSB7XG4gICAgICAgICAgYXR0cmlidXRlcy5tYWluLnB1c2gobWFpblRhYmxlLm1vZGVsLnJhd0F0dHJpYnV0ZXNba2V5QXR0XS5maWVsZCA/IFtrZXlBdHQsIG1haW5UYWJsZS5tb2RlbC5yYXdBdHRyaWJ1dGVzW2tleUF0dF0uZmllbGRdIDoga2V5QXR0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGF0dHJpYnV0ZXMubWFpbiA9IHRoaXMuZXNjYXBlQXR0cmlidXRlcyhhdHRyaWJ1dGVzLm1haW4sIG9wdGlvbnMsIG1haW5UYWJsZS5hcyk7XG4gICAgYXR0cmlidXRlcy5tYWluID0gYXR0cmlidXRlcy5tYWluIHx8IChvcHRpb25zLmluY2x1ZGUgPyBbYCR7bWFpblRhYmxlLmFzfS4qYF0gOiBbJyonXSk7XG5cbiAgICAvLyBJZiBzdWJxdWVyeSwgd2UgYWRkIHRoZSBtYWluQXR0cmlidXRlcyB0byB0aGUgc3ViUXVlcnkgYW5kIHNldCB0aGUgbWFpbkF0dHJpYnV0ZXMgdG8gc2VsZWN0ICogZnJvbSBzdWJxdWVyeVxuICAgIGlmIChzdWJRdWVyeSB8fCBvcHRpb25zLmdyb3VwZWRMaW1pdCkge1xuICAgICAgLy8gV2UgbmVlZCBwcmltYXJ5IGtleXNcbiAgICAgIGF0dHJpYnV0ZXMuc3ViUXVlcnkgPSBhdHRyaWJ1dGVzLm1haW47XG4gICAgICBhdHRyaWJ1dGVzLm1haW4gPSBbYCR7bWFpblRhYmxlLmFzIHx8IG1haW5UYWJsZS5xdW90ZWROYW1lfS4qYF07XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuaW5jbHVkZSkge1xuICAgICAgZm9yIChjb25zdCBpbmNsdWRlIG9mIG9wdGlvbnMuaW5jbHVkZSkge1xuICAgICAgICBpZiAoaW5jbHVkZS5zZXBhcmF0ZSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGpvaW5RdWVyaWVzID0gdGhpcy5nZW5lcmF0ZUluY2x1ZGUoaW5jbHVkZSwgeyBleHRlcm5hbEFzOiBtYWluVGFibGUuYXMsIGludGVybmFsQXM6IG1haW5UYWJsZS5hcyB9LCB0b3BMZXZlbEluZm8pO1xuXG4gICAgICAgIHN1YkpvaW5RdWVyaWVzID0gc3ViSm9pblF1ZXJpZXMuY29uY2F0KGpvaW5RdWVyaWVzLnN1YlF1ZXJ5KTtcbiAgICAgICAgbWFpbkpvaW5RdWVyaWVzID0gbWFpbkpvaW5RdWVyaWVzLmNvbmNhdChqb2luUXVlcmllcy5tYWluUXVlcnkpO1xuXG4gICAgICAgIGlmIChqb2luUXVlcmllcy5hdHRyaWJ1dGVzLm1haW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGF0dHJpYnV0ZXMubWFpbiA9IF8udW5pcShhdHRyaWJ1dGVzLm1haW4uY29uY2F0KGpvaW5RdWVyaWVzLmF0dHJpYnV0ZXMubWFpbikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqb2luUXVlcmllcy5hdHRyaWJ1dGVzLnN1YlF1ZXJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBhdHRyaWJ1dGVzLnN1YlF1ZXJ5ID0gXy51bmlxKGF0dHJpYnV0ZXMuc3ViUXVlcnkuY29uY2F0KGpvaW5RdWVyaWVzLmF0dHJpYnV0ZXMuc3ViUXVlcnkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdWJRdWVyeSkge1xuICAgICAgc3ViUXVlcnlJdGVtcy5wdXNoKHRoaXMuc2VsZWN0RnJvbVRhYmxlRnJhZ21lbnQob3B0aW9ucywgbWFpblRhYmxlLm1vZGVsLCBhdHRyaWJ1dGVzLnN1YlF1ZXJ5LCBtYWluVGFibGUucXVvdGVkTmFtZSwgbWFpblRhYmxlLmFzKSk7XG4gICAgICBzdWJRdWVyeUl0ZW1zLnB1c2goc3ViSm9pblF1ZXJpZXMuam9pbignJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3B0aW9ucy5ncm91cGVkTGltaXQpIHtcbiAgICAgICAgaWYgKCFtYWluVGFibGUuYXMpIHtcbiAgICAgICAgICBtYWluVGFibGUuYXMgPSBtYWluVGFibGUucXVvdGVkTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3aGVyZSA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMud2hlcmUpO1xuICAgICAgICBsZXQgZ3JvdXBlZExpbWl0T3JkZXIsXG4gICAgICAgICAgd2hlcmVLZXksXG4gICAgICAgICAgaW5jbHVkZSxcbiAgICAgICAgICBncm91cGVkVGFibGVOYW1lID0gbWFpblRhYmxlLmFzO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5ncm91cGVkTGltaXQub24gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgd2hlcmVLZXkgPSBvcHRpb25zLmdyb3VwZWRMaW1pdC5vbjtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmdyb3VwZWRMaW1pdC5vbiBpbnN0YW5jZW9mIEhhc01hbnkpIHtcbiAgICAgICAgICB3aGVyZUtleSA9IG9wdGlvbnMuZ3JvdXBlZExpbWl0Lm9uLmZvcmVpZ25LZXlGaWVsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLmdyb3VwZWRMaW1pdC5vbiBpbnN0YW5jZW9mIEJlbG9uZ3NUb01hbnkpIHtcbiAgICAgICAgICAvLyBCVE0gaW5jbHVkZXMgbmVlZHMgdG8gam9pbiB0aGUgdGhyb3VnaCB0YWJsZSBvbiB0byBjaGVjayBJRFxuICAgICAgICAgIGdyb3VwZWRUYWJsZU5hbWUgPSBvcHRpb25zLmdyb3VwZWRMaW1pdC5vbi5tYW55RnJvbVNvdXJjZS5hcztcbiAgICAgICAgICBjb25zdCBncm91cGVkTGltaXRPcHRpb25zID0gTW9kZWwuX3ZhbGlkYXRlSW5jbHVkZWRFbGVtZW50cyh7XG4gICAgICAgICAgICBpbmNsdWRlOiBbe1xuICAgICAgICAgICAgICBhc3NvY2lhdGlvbjogb3B0aW9ucy5ncm91cGVkTGltaXQub24ubWFueUZyb21Tb3VyY2UsXG4gICAgICAgICAgICAgIGR1cGxpY2F0aW5nOiBmYWxzZSwgLy8gVGhlIFVOSU9OJ2VkIHF1ZXJ5IG1heSBjb250YWluIGR1cGxpY2F0ZXMsIGJ1dCBlYWNoIHN1Yi1xdWVyeSBjYW5ub3RcbiAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgIHdoZXJlOiBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgICAgICBbT3AucGxhY2Vob2xkZXJdOiB0cnVlXG4gICAgICAgICAgICAgIH0sIG9wdGlvbnMuZ3JvdXBlZExpbWl0LnRocm91Z2ggJiYgb3B0aW9ucy5ncm91cGVkTGltaXQudGhyb3VnaC53aGVyZSlcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgbW9kZWxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIE1ha2Ugc3VyZSBhdHRyaWJ1dGVzIGZyb20gdGhlIGpvaW4gdGFibGUgYXJlIG1hcHBlZCBiYWNrIHRvIG1vZGVsc1xuICAgICAgICAgIG9wdGlvbnMuaGFzSm9pbiA9IHRydWU7XG4gICAgICAgICAgb3B0aW9ucy5oYXNNdWx0aUFzc29jaWF0aW9uID0gdHJ1ZTtcbiAgICAgICAgICBvcHRpb25zLmluY2x1ZGVNYXAgPSBPYmplY3QuYXNzaWduKGdyb3VwZWRMaW1pdE9wdGlvbnMuaW5jbHVkZU1hcCwgb3B0aW9ucy5pbmNsdWRlTWFwKTtcbiAgICAgICAgICBvcHRpb25zLmluY2x1ZGVOYW1lcyA9IGdyb3VwZWRMaW1pdE9wdGlvbnMuaW5jbHVkZU5hbWVzLmNvbmNhdChvcHRpb25zLmluY2x1ZGVOYW1lcyB8fCBbXSk7XG4gICAgICAgICAgaW5jbHVkZSA9IGdyb3VwZWRMaW1pdE9wdGlvbnMuaW5jbHVkZTtcblxuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMub3JkZXIpKSB7XG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGUgb3JkZXIgYnkgYXR0cmlidXRlcyBhcmUgYXZhaWxhYmxlIHRvIHRoZSBwYXJlbnQgcXVlcnlcbiAgICAgICAgICAgIG9wdGlvbnMub3JkZXIuZm9yRWFjaCgob3JkZXIsIGkpID0+IHtcbiAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3JkZXIpKSB7XG4gICAgICAgICAgICAgICAgb3JkZXIgPSBvcmRlclswXTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGxldCBhbGlhcyA9IGBzdWJxdWVyeV9vcmRlcl8ke2l9YDtcbiAgICAgICAgICAgICAgb3B0aW9ucy5hdHRyaWJ1dGVzLnB1c2goW29yZGVyLCBhbGlhc10pO1xuXG4gICAgICAgICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gcHJlcGVuZCBtb2RlbCBuYW1lIHdoZW4gd2UgYWxpYXMgdGhlIGF0dHJpYnV0ZXMsIHNvIHF1b3RlIHRoZW0gaGVyZVxuICAgICAgICAgICAgICBhbGlhcyA9IHRoaXMuc2VxdWVsaXplLmxpdGVyYWwodGhpcy5xdW90ZShhbGlhcykpO1xuXG4gICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMub3JkZXJbaV0pKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5vcmRlcltpXVswXSA9IGFsaWFzO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMub3JkZXJbaV0gPSBhbGlhcztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBncm91cGVkTGltaXRPcmRlciA9IG9wdGlvbnMub3JkZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE9yZGVyaW5nIGlzIGhhbmRsZWQgYnkgdGhlIHN1YnF1ZXJpZXMsIHNvIG9yZGVyaW5nIHRoZSBVTklPTidlZCByZXN1bHQgaXMgbm90IG5lZWRlZFxuICAgICAgICAgIGdyb3VwZWRMaW1pdE9yZGVyID0gb3B0aW9ucy5vcmRlcjtcbiAgICAgICAgICBkZWxldGUgb3B0aW9ucy5vcmRlcjtcbiAgICAgICAgICB3aGVyZVtPcC5wbGFjZWhvbGRlcl0gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FjaGluZyB0aGUgYmFzZSBxdWVyeSBhbmQgc3BsaWNpbmcgdGhlIHdoZXJlIHBhcnQgaW50byBpdCBpcyBjb25zaXN0ZW50bHkgPiB0d2ljZVxuICAgICAgICAvLyBhcyBmYXN0IHRoYW4gZ2VuZXJhdGluZyBmcm9tIHNjcmF0Y2ggZWFjaCB0aW1lIGZvciB2YWx1ZXMubGVuZ3RoID49IDVcbiAgICAgICAgY29uc3QgYmFzZVF1ZXJ5ID0gYFNFTEVDVCAqIEZST00gKCR7dGhpcy5zZWxlY3RRdWVyeShcbiAgICAgICAgICB0YWJsZU5hbWUsXG4gICAgICAgICAge1xuICAgICAgICAgICAgYXR0cmlidXRlczogb3B0aW9ucy5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgb2Zmc2V0OiBvcHRpb25zLm9mZnNldCxcbiAgICAgICAgICAgIGxpbWl0OiBvcHRpb25zLmdyb3VwZWRMaW1pdC5saW1pdCxcbiAgICAgICAgICAgIG9yZGVyOiBncm91cGVkTGltaXRPcmRlcixcbiAgICAgICAgICAgIGFsaWFzZXNNYXBwaW5nOiBvcHRpb25zLmFsaWFzZXNNYXBwaW5nLFxuICAgICAgICAgICAgYWxpYXNlc0J5VGFibGU6IG9wdGlvbnMuYWxpYXNlc0J5VGFibGUsXG4gICAgICAgICAgICB3aGVyZSxcbiAgICAgICAgICAgIGluY2x1ZGUsXG4gICAgICAgICAgICBtb2RlbFxuICAgICAgICAgIH0sXG4gICAgICAgICAgbW9kZWxcbiAgICAgICAgKS5yZXBsYWNlKC87JC8sICcnKX0pIEFTIHN1YmA7IC8vIEV2ZXJ5IGRlcml2ZWQgdGFibGUgbXVzdCBoYXZlIGl0cyBvd24gYWxpYXNcbiAgICAgICAgY29uc3QgcGxhY2VIb2xkZXIgPSB0aGlzLndoZXJlSXRlbVF1ZXJ5KE9wLnBsYWNlaG9sZGVyLCB0cnVlLCB7IG1vZGVsIH0pO1xuICAgICAgICBjb25zdCBzcGxpY2VQb3MgPSBiYXNlUXVlcnkuaW5kZXhPZihwbGFjZUhvbGRlcik7XG5cbiAgICAgICAgbWFpblF1ZXJ5SXRlbXMucHVzaCh0aGlzLnNlbGVjdEZyb21UYWJsZUZyYWdtZW50KG9wdGlvbnMsIG1haW5UYWJsZS5tb2RlbCwgYXR0cmlidXRlcy5tYWluLCBgKCR7XG4gICAgICAgICAgb3B0aW9ucy5ncm91cGVkTGltaXQudmFsdWVzLm1hcCh2YWx1ZSA9PiB7XG4gICAgICAgICAgICBsZXQgZ3JvdXBXaGVyZTtcbiAgICAgICAgICAgIGlmICh3aGVyZUtleSkge1xuICAgICAgICAgICAgICBncm91cFdoZXJlID0ge1xuICAgICAgICAgICAgICAgIFt3aGVyZUtleV06IHZhbHVlXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaW5jbHVkZSkge1xuICAgICAgICAgICAgICBncm91cFdoZXJlID0ge1xuICAgICAgICAgICAgICAgIFtvcHRpb25zLmdyb3VwZWRMaW1pdC5vbi5mb3JlaWduSWRlbnRpZmllckZpZWxkXTogdmFsdWVcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFV0aWxzLnNwbGljZVN0cihiYXNlUXVlcnksIHNwbGljZVBvcywgcGxhY2VIb2xkZXIubGVuZ3RoLCB0aGlzLmdldFdoZXJlQ29uZGl0aW9ucyhncm91cFdoZXJlLCBncm91cGVkVGFibGVOYW1lKSk7XG4gICAgICAgICAgfSkuam9pbihcbiAgICAgICAgICAgIHRoaXMuX2RpYWxlY3Quc3VwcG9ydHNbJ1VOSU9OIEFMTCddID8gJyBVTklPTiBBTEwgJyA6ICcgVU5JT04gJ1xuICAgICAgICAgIClcbiAgICAgICAgfSlgLCBtYWluVGFibGUuYXMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1haW5RdWVyeUl0ZW1zLnB1c2godGhpcy5zZWxlY3RGcm9tVGFibGVGcmFnbWVudChvcHRpb25zLCBtYWluVGFibGUubW9kZWwsIGF0dHJpYnV0ZXMubWFpbiwgbWFpblRhYmxlLnF1b3RlZE5hbWUsIG1haW5UYWJsZS5hcykpO1xuICAgICAgfVxuXG4gICAgICBtYWluUXVlcnlJdGVtcy5wdXNoKG1haW5Kb2luUXVlcmllcy5qb2luKCcnKSk7XG4gICAgfVxuXG4gICAgLy8gQWRkIFdIRVJFIHRvIHN1YiBvciBtYWluIHF1ZXJ5XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAnd2hlcmUnKSAmJiAhb3B0aW9ucy5ncm91cGVkTGltaXQpIHtcbiAgICAgIG9wdGlvbnMud2hlcmUgPSB0aGlzLmdldFdoZXJlQ29uZGl0aW9ucyhvcHRpb25zLndoZXJlLCBtYWluVGFibGUuYXMgfHwgdGFibGVOYW1lLCBtb2RlbCwgb3B0aW9ucyk7XG4gICAgICBpZiAob3B0aW9ucy53aGVyZSkge1xuICAgICAgICBpZiAoc3ViUXVlcnkpIHtcbiAgICAgICAgICBzdWJRdWVyeUl0ZW1zLnB1c2goYCBXSEVSRSAke29wdGlvbnMud2hlcmV9YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWFpblF1ZXJ5SXRlbXMucHVzaChgIFdIRVJFICR7b3B0aW9ucy53aGVyZX1gKTtcbiAgICAgICAgICAvLyBXYWxrIHRoZSBtYWluIHF1ZXJ5IHRvIHVwZGF0ZSBhbGwgc2VsZWN0c1xuICAgICAgICAgIG1haW5RdWVyeUl0ZW1zLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCdTRUxFQ1QnKSkge1xuICAgICAgICAgICAgICBtYWluUXVlcnlJdGVtc1trZXldID0gdGhpcy5zZWxlY3RGcm9tVGFibGVGcmFnbWVudChvcHRpb25zLCBtb2RlbCwgYXR0cmlidXRlcy5tYWluLCBtYWluVGFibGUucXVvdGVkTmFtZSwgbWFpblRhYmxlLmFzLCBvcHRpb25zLndoZXJlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFkZCBHUk9VUCBCWSB0byBzdWIgb3IgbWFpbiBxdWVyeVxuICAgIGlmIChvcHRpb25zLmdyb3VwKSB7XG4gICAgICBvcHRpb25zLmdyb3VwID0gQXJyYXkuaXNBcnJheShvcHRpb25zLmdyb3VwKSA/IG9wdGlvbnMuZ3JvdXAubWFwKHQgPT4gdGhpcy5hbGlhc0dyb3VwaW5nKHQsIG1vZGVsLCBtYWluVGFibGUuYXMsIG9wdGlvbnMpKS5qb2luKCcsICcpIDogdGhpcy5hbGlhc0dyb3VwaW5nKG9wdGlvbnMuZ3JvdXAsIG1vZGVsLCBtYWluVGFibGUuYXMsIG9wdGlvbnMpO1xuXG4gICAgICBpZiAoc3ViUXVlcnkpIHtcbiAgICAgICAgc3ViUXVlcnlJdGVtcy5wdXNoKGAgR1JPVVAgQlkgJHtvcHRpb25zLmdyb3VwfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFpblF1ZXJ5SXRlbXMucHVzaChgIEdST1VQIEJZICR7b3B0aW9ucy5ncm91cH1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGQgSEFWSU5HIHRvIHN1YiBvciBtYWluIHF1ZXJ5XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAnaGF2aW5nJykpIHtcbiAgICAgIG9wdGlvbnMuaGF2aW5nID0gdGhpcy5nZXRXaGVyZUNvbmRpdGlvbnMob3B0aW9ucy5oYXZpbmcsIHRhYmxlTmFtZSwgbW9kZWwsIG9wdGlvbnMsIGZhbHNlKTtcbiAgICAgIGlmIChvcHRpb25zLmhhdmluZykge1xuICAgICAgICBpZiAoc3ViUXVlcnkpIHtcbiAgICAgICAgICBzdWJRdWVyeUl0ZW1zLnB1c2goYCBIQVZJTkcgJHtvcHRpb25zLmhhdmluZ31gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYWluUXVlcnlJdGVtcy5wdXNoKGAgSEFWSU5HICR7b3B0aW9ucy5oYXZpbmd9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGQgT1JERVIgdG8gc3ViIG9yIG1haW4gcXVlcnlcbiAgICBpZiAob3B0aW9ucy5vcmRlcikge1xuICAgICAgY29uc3Qgb3JkZXJzID0gdGhpcy5nZXRRdWVyeU9yZGVycyhvcHRpb25zLCBtb2RlbCwgc3ViUXVlcnkpO1xuICAgICAgaWYgKG9yZGVycy5tYWluUXVlcnlPcmRlci5sZW5ndGgpIHtcbiAgICAgICAgbWFpblF1ZXJ5SXRlbXMucHVzaChgIE9SREVSIEJZICR7b3JkZXJzLm1haW5RdWVyeU9yZGVyLmpvaW4oJywgJyl9YCk7XG4gICAgICB9XG4gICAgICBpZiAob3JkZXJzLnN1YlF1ZXJ5T3JkZXIubGVuZ3RoKSB7XG4gICAgICAgIHN1YlF1ZXJ5SXRlbXMucHVzaChgIE9SREVSIEJZICR7b3JkZXJzLnN1YlF1ZXJ5T3JkZXIuam9pbignLCAnKX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGQgTElNSVQsIE9GRlNFVCB0byBzdWIgb3IgbWFpbiBxdWVyeVxuICAgIGNvbnN0IGxpbWl0T3JkZXIgPSB0aGlzLmFkZExpbWl0QW5kT2Zmc2V0KG9wdGlvbnMsIG1haW5UYWJsZS5tb2RlbCk7XG4gICAgaWYgKGxpbWl0T3JkZXIgJiYgIW9wdGlvbnMuZ3JvdXBlZExpbWl0KSB7XG4gICAgICBpZiAoc3ViUXVlcnkpIHtcbiAgICAgICAgc3ViUXVlcnlJdGVtcy5wdXNoKGxpbWl0T3JkZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFpblF1ZXJ5SXRlbXMucHVzaChsaW1pdE9yZGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3ViUXVlcnkpIHtcbiAgICAgIHF1ZXJ5ID0gYFNFTEVDVCAke2F0dHJpYnV0ZXMubWFpbi5qb2luKCcsICcpfSBGUk9NICgke3N1YlF1ZXJ5SXRlbXMuam9pbignJyl9KSBBUyAke21haW5UYWJsZS5hc30ke21haW5Kb2luUXVlcmllcy5qb2luKCcnKX0ke21haW5RdWVyeUl0ZW1zLmpvaW4oJycpfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHF1ZXJ5ID0gbWFpblF1ZXJ5SXRlbXMuam9pbignJyk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMubG9jayAmJiB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmxvY2spIHtcbiAgICAgIGxldCBsb2NrID0gb3B0aW9ucy5sb2NrO1xuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxvY2sgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGxvY2sgPSBvcHRpb25zLmxvY2subGV2ZWw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fZGlhbGVjdC5zdXBwb3J0cy5sb2NrS2V5ICYmIChsb2NrID09PSAnS0VZIFNIQVJFJyB8fCBsb2NrID09PSAnTk8gS0VZIFVQREFURScpKSB7XG4gICAgICAgIHF1ZXJ5ICs9IGAgRk9SICR7bG9ja31gO1xuICAgICAgfSBlbHNlIGlmIChsb2NrID09PSAnU0hBUkUnKSB7XG4gICAgICAgIHF1ZXJ5ICs9IGAgJHt0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmZvclNoYXJlfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxdWVyeSArPSAnIEZPUiBVUERBVEUnO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2RpYWxlY3Quc3VwcG9ydHMubG9ja09mICYmIG9wdGlvbnMubG9jay5vZiAmJiBvcHRpb25zLmxvY2sub2YucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpIHtcbiAgICAgICAgcXVlcnkgKz0gYCBPRiAke3RoaXMucXVvdGVUYWJsZShvcHRpb25zLmxvY2sub2YubmFtZSl9YDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLnNraXBMb2NrZWQgJiYgb3B0aW9ucy5za2lwTG9ja2VkKSB7XG4gICAgICAgIHF1ZXJ5ICs9ICcgU0tJUCBMT0NLRUQnO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBgJHtxdWVyeX07YDtcbiAgfVxuXG4gIGFsaWFzR3JvdXBpbmcoZmllbGQsIG1vZGVsLCB0YWJsZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBzcmMgPSBBcnJheS5pc0FycmF5KGZpZWxkKSA/IGZpZWxkWzBdIDogZmllbGQ7XG5cbiAgICByZXR1cm4gdGhpcy5xdW90ZSh0aGlzLl9nZXRBbGlhc0ZvckZpZWxkKHRhYmxlTmFtZSwgc3JjLCBvcHRpb25zKSB8fCBzcmMsIG1vZGVsKTtcbiAgfVxuXG4gIGVzY2FwZUF0dHJpYnV0ZXMoYXR0cmlidXRlcywgb3B0aW9ucywgbWFpblRhYmxlQXMpIHtcbiAgICByZXR1cm4gYXR0cmlidXRlcyAmJiBhdHRyaWJ1dGVzLm1hcChhdHRyID0+IHtcbiAgICAgIGxldCBhZGRUYWJsZSA9IHRydWU7XG5cbiAgICAgIGlmIChhdHRyIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVNlcXVlbGl6ZU1ldGhvZChhdHRyKTtcbiAgICAgIH1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGF0dHIpKSB7XG4gICAgICAgIGlmIChhdHRyLmxlbmd0aCAhPT0gMikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtKU09OLnN0cmluZ2lmeShhdHRyKX0gaXMgbm90IGEgdmFsaWQgYXR0cmlidXRlIGRlZmluaXRpb24uIFBsZWFzZSB1c2UgdGhlIGZvbGxvd2luZyBmb3JtYXQ6IFsnYXR0cmlidXRlIGRlZmluaXRpb24nLCAnYWxpYXMnXWApO1xuICAgICAgICB9XG4gICAgICAgIGF0dHIgPSBhdHRyLnNsaWNlKCk7XG5cbiAgICAgICAgaWYgKGF0dHJbMF0gaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcbiAgICAgICAgICBhdHRyWzBdID0gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2QoYXR0clswXSk7XG4gICAgICAgICAgYWRkVGFibGUgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICghYXR0clswXS5pbmNsdWRlcygnKCcpICYmICFhdHRyWzBdLmluY2x1ZGVzKCcpJykpIHtcbiAgICAgICAgICBhdHRyWzBdID0gdGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0clswXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVwcmVjYXRpb25zLm5vUmF3QXR0cmlidXRlcygpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBhbGlhcyA9IGF0dHJbMV07XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5taW5pZnlBbGlhc2VzKSB7XG4gICAgICAgICAgYWxpYXMgPSB0aGlzLl9nZXRNaW5pZmllZEFsaWFzKGFsaWFzLCBtYWluVGFibGVBcywgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyID0gW2F0dHJbMF0sIHRoaXMucXVvdGVJZGVudGlmaWVyKGFsaWFzKV0uam9pbignIEFTICcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0ciA9ICFhdHRyLmluY2x1ZGVzKFV0aWxzLlRJQ0tfQ0hBUikgJiYgIWF0dHIuaW5jbHVkZXMoJ1wiJylcbiAgICAgICAgICA/IHRoaXMucXVvdGVBdHRyaWJ1dGUoYXR0ciwgb3B0aW9ucy5tb2RlbClcbiAgICAgICAgICA6IHRoaXMuZXNjYXBlKGF0dHIpO1xuICAgICAgfVxuICAgICAgaWYgKCFfLmlzRW1wdHkob3B0aW9ucy5pbmNsdWRlKSAmJiAhYXR0ci5pbmNsdWRlcygnLicpICYmIGFkZFRhYmxlKSB7XG4gICAgICAgIGF0dHIgPSBgJHttYWluVGFibGVBc30uJHthdHRyfWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhdHRyO1xuICAgIH0pO1xuICB9XG5cbiAgZ2VuZXJhdGVJbmNsdWRlKGluY2x1ZGUsIHBhcmVudFRhYmxlTmFtZSwgdG9wTGV2ZWxJbmZvKSB7XG4gICAgY29uc3Qgam9pblF1ZXJpZXMgPSB7XG4gICAgICBtYWluUXVlcnk6IFtdLFxuICAgICAgc3ViUXVlcnk6IFtdXG4gICAgfTtcbiAgICBjb25zdCBtYWluQ2hpbGRJbmNsdWRlcyA9IFtdO1xuICAgIGNvbnN0IHN1YkNoaWxkSW5jbHVkZXMgPSBbXTtcbiAgICBsZXQgcmVxdWlyZWRNaXNtYXRjaCA9IGZhbHNlO1xuICAgIGNvbnN0IGluY2x1ZGVBcyA9IHtcbiAgICAgIGludGVybmFsQXM6IGluY2x1ZGUuYXMsXG4gICAgICBleHRlcm5hbEFzOiBpbmNsdWRlLmFzXG4gICAgfTtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0ge1xuICAgICAgbWFpbjogW10sXG4gICAgICBzdWJRdWVyeTogW11cbiAgICB9O1xuICAgIGxldCBqb2luUXVlcnk7XG5cbiAgICB0b3BMZXZlbEluZm8ub3B0aW9ucy5rZXlzRXNjYXBlZCA9IHRydWU7XG5cbiAgICBpZiAodG9wTGV2ZWxJbmZvLm5hbWVzLm5hbWUgIT09IHBhcmVudFRhYmxlTmFtZS5leHRlcm5hbEFzICYmIHRvcExldmVsSW5mby5uYW1lcy5hcyAhPT0gcGFyZW50VGFibGVOYW1lLmV4dGVybmFsQXMpIHtcbiAgICAgIGluY2x1ZGVBcy5pbnRlcm5hbEFzID0gYCR7cGFyZW50VGFibGVOYW1lLmludGVybmFsQXN9LT4ke2luY2x1ZGUuYXN9YDtcbiAgICAgIGluY2x1ZGVBcy5leHRlcm5hbEFzID0gYCR7cGFyZW50VGFibGVOYW1lLmV4dGVybmFsQXN9LiR7aW5jbHVkZS5hc31gO1xuICAgIH1cblxuICAgIC8vIGluY2x1ZGVJZ25vcmVBdHRyaWJ1dGVzIGlzIHVzZWQgYnkgYWdncmVnYXRlIGZ1bmN0aW9uc1xuICAgIGlmICh0b3BMZXZlbEluZm8ub3B0aW9ucy5pbmNsdWRlSWdub3JlQXR0cmlidXRlcyAhPT0gZmFsc2UpIHtcbiAgICAgIGluY2x1ZGUubW9kZWwuX2V4cGFuZEF0dHJpYnV0ZXMoaW5jbHVkZSk7XG4gICAgICBVdGlscy5tYXBGaW5kZXJPcHRpb25zKGluY2x1ZGUsIGluY2x1ZGUubW9kZWwpO1xuXG4gICAgICBjb25zdCBpbmNsdWRlQXR0cmlidXRlcyA9IGluY2x1ZGUuYXR0cmlidXRlcy5tYXAoYXR0ciA9PiB7XG4gICAgICAgIGxldCBhdHRyQXMgPSBhdHRyO1xuICAgICAgICBsZXQgdmVyYmF0aW0gPSBmYWxzZTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhdHRyKSAmJiBhdHRyLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgIGlmIChhdHRyWzBdIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kICYmIChcbiAgICAgICAgICAgIGF0dHJbMF0gaW5zdGFuY2VvZiBVdGlscy5MaXRlcmFsIHx8XG4gICAgICAgICAgICBhdHRyWzBdIGluc3RhbmNlb2YgVXRpbHMuQ2FzdCB8fFxuICAgICAgICAgICAgYXR0clswXSBpbnN0YW5jZW9mIFV0aWxzLkZuXG4gICAgICAgICAgKSkge1xuICAgICAgICAgICAgdmVyYmF0aW0gPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGF0dHIgPSBhdHRyLm1hcChhdHRyID0+IGF0dHIgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QgPyB0aGlzLmhhbmRsZVNlcXVlbGl6ZU1ldGhvZChhdHRyKSA6IGF0dHIpO1xuXG4gICAgICAgICAgYXR0ckFzID0gYXR0clsxXTtcbiAgICAgICAgICBhdHRyID0gYXR0clswXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXR0ciBpbnN0YW5jZW9mIFV0aWxzLkxpdGVyYWwpIHtcbiAgICAgICAgICByZXR1cm4gYXR0ci52YWw7IC8vIFdlIHRydXN0IHRoZSB1c2VyIHRvIHJlbmFtZSB0aGUgZmllbGQgY29ycmVjdGx5XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF0dHIgaW5zdGFuY2VvZiBVdGlscy5DYXN0IHx8IGF0dHIgaW5zdGFuY2VvZiBVdGlscy5Gbikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdUcmllZCB0byBzZWxlY3QgYXR0cmlidXRlcyB1c2luZyBTZXF1ZWxpemUuY2FzdCBvciBTZXF1ZWxpemUuZm4gd2l0aG91dCBzcGVjaWZ5aW5nIGFuIGFsaWFzIGZvciB0aGUgcmVzdWx0LCBkdXJpbmcgZWFnZXIgbG9hZGluZy4gJyArXG4gICAgICAgICAgICAnVGhpcyBtZWFucyB0aGUgYXR0cmlidXRlIHdpbGwgbm90IGJlIGFkZGVkIHRvIHRoZSByZXR1cm5lZCBpbnN0YW5jZSdcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHByZWZpeDtcbiAgICAgICAgaWYgKHZlcmJhdGltID09PSB0cnVlKSB7XG4gICAgICAgICAgcHJlZml4ID0gYXR0cjtcbiAgICAgICAgfSBlbHNlIGlmICgvIz4+fC0+Pi8udGVzdChhdHRyKSkge1xuICAgICAgICAgIHByZWZpeCA9IGAoJHt0aGlzLnF1b3RlSWRlbnRpZmllcihpbmNsdWRlQXMuaW50ZXJuYWxBcyl9LiR7YXR0ci5yZXBsYWNlKC9cXCh8XFwpL2csICcnKX0pYDtcbiAgICAgICAgfSBlbHNlIGlmICgvanNvbl9leHRyYWN0XFwoLy50ZXN0KGF0dHIpKSB7XG4gICAgICAgICAgcHJlZml4ID0gYXR0ci5yZXBsYWNlKC9qc29uX2V4dHJhY3RcXCgvaSwgYGpzb25fZXh0cmFjdCgke3RoaXMucXVvdGVJZGVudGlmaWVyKGluY2x1ZGVBcy5pbnRlcm5hbEFzKX0uYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJlZml4ID0gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoaW5jbHVkZUFzLmludGVybmFsQXMpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHIpfWA7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGFsaWFzID0gYCR7aW5jbHVkZUFzLmV4dGVybmFsQXN9LiR7YXR0ckFzfWA7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5taW5pZnlBbGlhc2VzKSB7XG4gICAgICAgICAgYWxpYXMgPSB0aGlzLl9nZXRNaW5pZmllZEFsaWFzKGFsaWFzLCBpbmNsdWRlQXMuaW50ZXJuYWxBcywgdG9wTGV2ZWxJbmZvLm9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGAke3ByZWZpeH0gQVMgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhbGlhcywgdHJ1ZSl9YDtcbiAgICAgIH0pO1xuICAgICAgaWYgKGluY2x1ZGUuc3ViUXVlcnkgJiYgdG9wTGV2ZWxJbmZvLnN1YlF1ZXJ5KSB7XG4gICAgICAgIGZvciAoY29uc3QgYXR0ciBvZiBpbmNsdWRlQXR0cmlidXRlcykge1xuICAgICAgICAgIGF0dHJpYnV0ZXMuc3ViUXVlcnkucHVzaChhdHRyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChjb25zdCBhdHRyIG9mIGluY2x1ZGVBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgYXR0cmlidXRlcy5tYWluLnB1c2goYXR0cik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL3Rocm91Z2hcbiAgICBpZiAoaW5jbHVkZS50aHJvdWdoKSB7XG4gICAgICBqb2luUXVlcnkgPSB0aGlzLmdlbmVyYXRlVGhyb3VnaEpvaW4oaW5jbHVkZSwgaW5jbHVkZUFzLCBwYXJlbnRUYWJsZU5hbWUuaW50ZXJuYWxBcywgdG9wTGV2ZWxJbmZvKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZ2VuZXJhdGVTdWJRdWVyeUZpbHRlcihpbmNsdWRlLCBpbmNsdWRlQXMsIHRvcExldmVsSW5mbyk7XG4gICAgICBqb2luUXVlcnkgPSB0aGlzLmdlbmVyYXRlSm9pbihpbmNsdWRlLCB0b3BMZXZlbEluZm8pO1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBwb3NzaWJsZSBuZXcgYXR0cmlidXRlcyBjcmVhdGVkIGluIGpvaW5cbiAgICBpZiAoam9pblF1ZXJ5LmF0dHJpYnV0ZXMubWFpbi5sZW5ndGggPiAwKSB7XG4gICAgICBhdHRyaWJ1dGVzLm1haW4gPSBhdHRyaWJ1dGVzLm1haW4uY29uY2F0KGpvaW5RdWVyeS5hdHRyaWJ1dGVzLm1haW4pO1xuICAgIH1cblxuICAgIGlmIChqb2luUXVlcnkuYXR0cmlidXRlcy5zdWJRdWVyeS5sZW5ndGggPiAwKSB7XG4gICAgICBhdHRyaWJ1dGVzLnN1YlF1ZXJ5ID0gYXR0cmlidXRlcy5zdWJRdWVyeS5jb25jYXQoam9pblF1ZXJ5LmF0dHJpYnV0ZXMuc3ViUXVlcnkpO1xuICAgIH1cblxuICAgIGlmIChpbmNsdWRlLmluY2x1ZGUpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGRJbmNsdWRlIG9mIGluY2x1ZGUuaW5jbHVkZSkge1xuICAgICAgICBpZiAoY2hpbGRJbmNsdWRlLnNlcGFyYXRlIHx8IGNoaWxkSW5jbHVkZS5fcHNldWRvKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjaGlsZEpvaW5RdWVyaWVzID0gdGhpcy5nZW5lcmF0ZUluY2x1ZGUoY2hpbGRJbmNsdWRlLCBpbmNsdWRlQXMsIHRvcExldmVsSW5mbyk7XG5cbiAgICAgICAgaWYgKGluY2x1ZGUucmVxdWlyZWQgPT09IGZhbHNlICYmIGNoaWxkSW5jbHVkZS5yZXF1aXJlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJlcXVpcmVkTWlzbWF0Y2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIHRoZSBjaGlsZCBpcyBhIHN1YiBxdWVyeSB3ZSBqdXN0IGdpdmUgaXQgdG8gdGhlXG4gICAgICAgIGlmIChjaGlsZEluY2x1ZGUuc3ViUXVlcnkgJiYgdG9wTGV2ZWxJbmZvLnN1YlF1ZXJ5KSB7XG4gICAgICAgICAgc3ViQ2hpbGRJbmNsdWRlcy5wdXNoKGNoaWxkSm9pblF1ZXJpZXMuc3ViUXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGlsZEpvaW5RdWVyaWVzLm1haW5RdWVyeSkge1xuICAgICAgICAgIG1haW5DaGlsZEluY2x1ZGVzLnB1c2goY2hpbGRKb2luUXVlcmllcy5tYWluUXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGlsZEpvaW5RdWVyaWVzLmF0dHJpYnV0ZXMubWFpbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXR0cmlidXRlcy5tYWluID0gYXR0cmlidXRlcy5tYWluLmNvbmNhdChjaGlsZEpvaW5RdWVyaWVzLmF0dHJpYnV0ZXMubWFpbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoaWxkSm9pblF1ZXJpZXMuYXR0cmlidXRlcy5zdWJRdWVyeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXR0cmlidXRlcy5zdWJRdWVyeSA9IGF0dHJpYnV0ZXMuc3ViUXVlcnkuY29uY2F0KGNoaWxkSm9pblF1ZXJpZXMuYXR0cmlidXRlcy5zdWJRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5jbHVkZS5zdWJRdWVyeSAmJiB0b3BMZXZlbEluZm8uc3ViUXVlcnkpIHtcbiAgICAgIGlmIChyZXF1aXJlZE1pc21hdGNoICYmIHN1YkNoaWxkSW5jbHVkZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBqb2luUXVlcmllcy5zdWJRdWVyeS5wdXNoKGAgJHtqb2luUXVlcnkuam9pbn0gKCAke2pvaW5RdWVyeS5ib2R5fSR7c3ViQ2hpbGRJbmNsdWRlcy5qb2luKCcnKX0gKSBPTiAke2pvaW5RdWVyeS5jb25kaXRpb259YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBqb2luUXVlcmllcy5zdWJRdWVyeS5wdXNoKGAgJHtqb2luUXVlcnkuam9pbn0gJHtqb2luUXVlcnkuYm9keX0gT04gJHtqb2luUXVlcnkuY29uZGl0aW9ufWApO1xuICAgICAgICBpZiAoc3ViQ2hpbGRJbmNsdWRlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgam9pblF1ZXJpZXMuc3ViUXVlcnkucHVzaChzdWJDaGlsZEluY2x1ZGVzLmpvaW4oJycpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgam9pblF1ZXJpZXMubWFpblF1ZXJ5LnB1c2gobWFpbkNoaWxkSW5jbHVkZXMuam9pbignJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocmVxdWlyZWRNaXNtYXRjaCAmJiBtYWluQ2hpbGRJbmNsdWRlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGpvaW5RdWVyaWVzLm1haW5RdWVyeS5wdXNoKGAgJHtqb2luUXVlcnkuam9pbn0gKCAke2pvaW5RdWVyeS5ib2R5fSR7bWFpbkNoaWxkSW5jbHVkZXMuam9pbignJyl9ICkgT04gJHtqb2luUXVlcnkuY29uZGl0aW9ufWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgam9pblF1ZXJpZXMubWFpblF1ZXJ5LnB1c2goYCAke2pvaW5RdWVyeS5qb2lufSAke2pvaW5RdWVyeS5ib2R5fSBPTiAke2pvaW5RdWVyeS5jb25kaXRpb259YCk7XG4gICAgICAgIGlmIChtYWluQ2hpbGRJbmNsdWRlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgam9pblF1ZXJpZXMubWFpblF1ZXJ5LnB1c2gobWFpbkNoaWxkSW5jbHVkZXMuam9pbignJykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBqb2luUXVlcmllcy5zdWJRdWVyeS5wdXNoKHN1YkNoaWxkSW5jbHVkZXMuam9pbignJykpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtYWluUXVlcnk6IGpvaW5RdWVyaWVzLm1haW5RdWVyeS5qb2luKCcnKSxcbiAgICAgIHN1YlF1ZXJ5OiBqb2luUXVlcmllcy5zdWJRdWVyeS5qb2luKCcnKSxcbiAgICAgIGF0dHJpYnV0ZXNcbiAgICB9O1xuICB9XG5cbiAgX2dldE1pbmlmaWVkQWxpYXMoYWxpYXMsIHRhYmxlTmFtZSwgb3B0aW9ucykge1xuICAgIC8vIFdlIGRvIG5vdCB3YW50IHRvIHJlLWFsaWFzIGluIGNhc2Ugb2YgYSBzdWJxdWVyeVxuICAgIGlmIChvcHRpb25zLmFsaWFzZXNCeVRhYmxlW2Ake3RhYmxlTmFtZX0ke2FsaWFzfWBdKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5hbGlhc2VzQnlUYWJsZVtgJHt0YWJsZU5hbWV9JHthbGlhc31gXTtcbiAgICB9XG5cbiAgICAvLyBEbyBub3QgYWxpYXMgY3VzdG9tIHN1cXVlcnlfb3JkZXJzXG4gICAgaWYgKGFsaWFzLm1hdGNoKC9zdWJxdWVyeV9vcmRlcl9bMC05XS8pKSB7XG4gICAgICByZXR1cm4gYWxpYXM7XG4gICAgfVxuXG4gICAgY29uc3QgbWluaWZpZWRBbGlhcyA9IGBfJHtvcHRpb25zLmFsaWFzZXNNYXBwaW5nLnNpemV9YDtcblxuICAgIG9wdGlvbnMuYWxpYXNlc01hcHBpbmcuc2V0KG1pbmlmaWVkQWxpYXMsIGFsaWFzKTtcbiAgICBvcHRpb25zLmFsaWFzZXNCeVRhYmxlW2Ake3RhYmxlTmFtZX0ke2FsaWFzfWBdID0gbWluaWZpZWRBbGlhcztcblxuICAgIHJldHVybiBtaW5pZmllZEFsaWFzO1xuICB9XG5cbiAgX2dldEFsaWFzRm9yRmllbGQodGFibGVOYW1lLCBmaWVsZCwgb3B0aW9ucykge1xuICAgIGlmICh0aGlzLm9wdGlvbnMubWluaWZ5QWxpYXNlcykge1xuICAgICAgaWYgKG9wdGlvbnMuYWxpYXNlc0J5VGFibGVbYCR7dGFibGVOYW1lfSR7ZmllbGR9YF0pIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuYWxpYXNlc0J5VGFibGVbYCR7dGFibGVOYW1lfSR7ZmllbGR9YF07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZ2VuZXJhdGVKb2luKGluY2x1ZGUsIHRvcExldmVsSW5mbykge1xuICAgIGNvbnN0IGFzc29jaWF0aW9uID0gaW5jbHVkZS5hc3NvY2lhdGlvbjtcbiAgICBjb25zdCBwYXJlbnQgPSBpbmNsdWRlLnBhcmVudDtcbiAgICBjb25zdCBwYXJlbnRJc1RvcCA9ICEhcGFyZW50ICYmICFpbmNsdWRlLnBhcmVudC5hc3NvY2lhdGlvbiAmJiBpbmNsdWRlLnBhcmVudC5tb2RlbC5uYW1lID09PSB0b3BMZXZlbEluZm8ub3B0aW9ucy5tb2RlbC5uYW1lO1xuICAgIGxldCAkcGFyZW50O1xuICAgIGxldCBqb2luV2hlcmU7XG4gICAgLyogQXR0cmlidXRlcyBmb3IgdGhlIGxlZnQgc2lkZSAqL1xuICAgIGNvbnN0IGxlZnQgPSBhc3NvY2lhdGlvbi5zb3VyY2U7XG4gICAgY29uc3QgYXR0ckxlZnQgPSBhc3NvY2lhdGlvbiBpbnN0YW5jZW9mIEJlbG9uZ3NUbyA/XG4gICAgICBhc3NvY2lhdGlvbi5pZGVudGlmaWVyIDpcbiAgICAgIGFzc29jaWF0aW9uLnNvdXJjZUtleUF0dHJpYnV0ZSB8fCBsZWZ0LnByaW1hcnlLZXlBdHRyaWJ1dGU7XG4gICAgY29uc3QgZmllbGRMZWZ0ID0gYXNzb2NpYXRpb24gaW5zdGFuY2VvZiBCZWxvbmdzVG8gP1xuICAgICAgYXNzb2NpYXRpb24uaWRlbnRpZmllckZpZWxkIDpcbiAgICAgIGxlZnQucmF3QXR0cmlidXRlc1thc3NvY2lhdGlvbi5zb3VyY2VLZXlBdHRyaWJ1dGUgfHwgbGVmdC5wcmltYXJ5S2V5QXR0cmlidXRlXS5maWVsZDtcbiAgICBsZXQgYXNMZWZ0O1xuICAgIC8qIEF0dHJpYnV0ZXMgZm9yIHRoZSByaWdodCBzaWRlICovXG4gICAgY29uc3QgcmlnaHQgPSBpbmNsdWRlLm1vZGVsO1xuICAgIGNvbnN0IHRhYmxlUmlnaHQgPSByaWdodC5nZXRUYWJsZU5hbWUoKTtcbiAgICBjb25zdCBmaWVsZFJpZ2h0ID0gYXNzb2NpYXRpb24gaW5zdGFuY2VvZiBCZWxvbmdzVG8gP1xuICAgICAgcmlnaHQucmF3QXR0cmlidXRlc1thc3NvY2lhdGlvbi50YXJnZXRJZGVudGlmaWVyIHx8IHJpZ2h0LnByaW1hcnlLZXlBdHRyaWJ1dGVdLmZpZWxkIDpcbiAgICAgIGFzc29jaWF0aW9uLmlkZW50aWZpZXJGaWVsZDtcbiAgICBsZXQgYXNSaWdodCA9IGluY2x1ZGUuYXM7XG5cbiAgICB3aGlsZSAoKCRwYXJlbnQgPSAkcGFyZW50ICYmICRwYXJlbnQucGFyZW50IHx8IGluY2x1ZGUucGFyZW50KSAmJiAkcGFyZW50LmFzc29jaWF0aW9uKSB7XG4gICAgICBpZiAoYXNMZWZ0KSB7XG4gICAgICAgIGFzTGVmdCA9IGAkeyRwYXJlbnQuYXN9LT4ke2FzTGVmdH1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNMZWZ0ID0gJHBhcmVudC5hcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWFzTGVmdCkgYXNMZWZ0ID0gcGFyZW50LmFzIHx8IHBhcmVudC5tb2RlbC5uYW1lO1xuICAgIGVsc2UgYXNSaWdodCA9IGAke2FzTGVmdH0tPiR7YXNSaWdodH1gO1xuXG4gICAgbGV0IGpvaW5PbiA9IGAke3RoaXMucXVvdGVUYWJsZShhc0xlZnQpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGZpZWxkTGVmdCl9YDtcbiAgICBjb25zdCBzdWJxdWVyeUF0dHJpYnV0ZXMgPSBbXTtcblxuICAgIGlmICh0b3BMZXZlbEluZm8ub3B0aW9ucy5ncm91cGVkTGltaXQgJiYgcGFyZW50SXNUb3AgfHwgdG9wTGV2ZWxJbmZvLnN1YlF1ZXJ5ICYmIGluY2x1ZGUucGFyZW50LnN1YlF1ZXJ5ICYmICFpbmNsdWRlLnN1YlF1ZXJ5KSB7XG4gICAgICBpZiAocGFyZW50SXNUb3ApIHtcbiAgICAgICAgLy8gVGhlIG1haW4gbW9kZWwgYXR0cmlidXRlcyBpcyBub3QgYWxpYXNlZCB0byBhIHByZWZpeFxuICAgICAgICBjb25zdCB0YWJsZU5hbWUgPSB0aGlzLnF1b3RlVGFibGUocGFyZW50LmFzIHx8IHBhcmVudC5tb2RlbC5uYW1lKTtcblxuICAgICAgICAvLyBDaGVjayBmb3IgcG90ZW50aWFsIGFsaWFzZWQgSk9JTiBjb25kaXRpb25cbiAgICAgICAgam9pbk9uID0gdGhpcy5fZ2V0QWxpYXNGb3JGaWVsZCh0YWJsZU5hbWUsIGF0dHJMZWZ0LCB0b3BMZXZlbEluZm8ub3B0aW9ucykgfHwgYCR7dGFibGVOYW1lfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHJMZWZ0KX1gO1xuXG4gICAgICAgIGlmICh0b3BMZXZlbEluZm8uc3ViUXVlcnkpIHtcbiAgICAgICAgICBzdWJxdWVyeUF0dHJpYnV0ZXMucHVzaChgJHt0YWJsZU5hbWV9LiR7dGhpcy5xdW90ZUlkZW50aWZpZXIoZmllbGRMZWZ0KX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgam9pblNvdXJjZSA9IGAke2FzTGVmdC5yZXBsYWNlKC8tPi9nLCAnLicpfS4ke2F0dHJMZWZ0fWA7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIHBvdGVudGlhbCBhbGlhc2VkIEpPSU4gY29uZGl0aW9uXG4gICAgICAgIGpvaW5PbiA9IHRoaXMuX2dldEFsaWFzRm9yRmllbGQoYXNMZWZ0LCBqb2luU291cmNlLCB0b3BMZXZlbEluZm8ub3B0aW9ucykgfHwgdGhpcy5xdW90ZUlkZW50aWZpZXIoam9pblNvdXJjZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgam9pbk9uICs9IGAgPSAke3RoaXMucXVvdGVJZGVudGlmaWVyKGFzUmlnaHQpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGZpZWxkUmlnaHQpfWA7XG5cbiAgICBpZiAoaW5jbHVkZS5vbikge1xuICAgICAgam9pbk9uID0gdGhpcy53aGVyZUl0ZW1zUXVlcnkoaW5jbHVkZS5vbiwge1xuICAgICAgICBwcmVmaXg6IHRoaXMuc2VxdWVsaXplLmxpdGVyYWwodGhpcy5xdW90ZUlkZW50aWZpZXIoYXNSaWdodCkpLFxuICAgICAgICBtb2RlbDogaW5jbHVkZS5tb2RlbFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGluY2x1ZGUud2hlcmUpIHtcbiAgICAgIGpvaW5XaGVyZSA9IHRoaXMud2hlcmVJdGVtc1F1ZXJ5KGluY2x1ZGUud2hlcmUsIHtcbiAgICAgICAgcHJlZml4OiB0aGlzLnNlcXVlbGl6ZS5saXRlcmFsKHRoaXMucXVvdGVJZGVudGlmaWVyKGFzUmlnaHQpKSxcbiAgICAgICAgbW9kZWw6IGluY2x1ZGUubW9kZWxcbiAgICAgIH0pO1xuICAgICAgaWYgKGpvaW5XaGVyZSkge1xuICAgICAgICBpZiAoaW5jbHVkZS5vcikge1xuICAgICAgICAgIGpvaW5PbiArPSBgIE9SICR7am9pbldoZXJlfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgam9pbk9uICs9IGAgQU5EICR7am9pbldoZXJlfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgam9pbjogaW5jbHVkZS5yZXF1aXJlZCA/ICdJTk5FUiBKT0lOJyA6IGluY2x1ZGUucmlnaHQgJiYgdGhpcy5fZGlhbGVjdC5zdXBwb3J0c1snUklHSFQgSk9JTiddID8gJ1JJR0hUIE9VVEVSIEpPSU4nIDogJ0xFRlQgT1VURVIgSk9JTicsXG4gICAgICBib2R5OiB0aGlzLnF1b3RlVGFibGUodGFibGVSaWdodCwgYXNSaWdodCksXG4gICAgICBjb25kaXRpb246IGpvaW5PbixcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgbWFpbjogW10sXG4gICAgICAgIHN1YlF1ZXJ5OiBzdWJxdWVyeUF0dHJpYnV0ZXNcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZ2VuZXJhdGVUaHJvdWdoSm9pbihpbmNsdWRlLCBpbmNsdWRlQXMsIHBhcmVudFRhYmxlTmFtZSwgdG9wTGV2ZWxJbmZvKSB7XG4gICAgY29uc3QgdGhyb3VnaCA9IGluY2x1ZGUudGhyb3VnaDtcbiAgICBjb25zdCB0aHJvdWdoVGFibGUgPSB0aHJvdWdoLm1vZGVsLmdldFRhYmxlTmFtZSgpO1xuICAgIGNvbnN0IHRocm91Z2hBcyA9IGAke2luY2x1ZGVBcy5pbnRlcm5hbEFzfS0+JHt0aHJvdWdoLmFzfWA7XG4gICAgY29uc3QgZXh0ZXJuYWxUaHJvdWdoQXMgPSBgJHtpbmNsdWRlQXMuZXh0ZXJuYWxBc30uJHt0aHJvdWdoLmFzfWA7XG4gICAgY29uc3QgdGhyb3VnaEF0dHJpYnV0ZXMgPSB0aHJvdWdoLmF0dHJpYnV0ZXMubWFwKGF0dHIgPT4ge1xuICAgICAgbGV0IGFsaWFzID0gYCR7ZXh0ZXJuYWxUaHJvdWdoQXN9LiR7QXJyYXkuaXNBcnJheShhdHRyKSA/IGF0dHJbMV0gOiBhdHRyfWA7XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubWluaWZ5QWxpYXNlcykge1xuICAgICAgICBhbGlhcyA9IHRoaXMuX2dldE1pbmlmaWVkQWxpYXMoYWxpYXMsIHRocm91Z2hBcywgdG9wTGV2ZWxJbmZvLm9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIodGhyb3VnaEFzKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihBcnJheS5pc0FycmF5KGF0dHIpID8gYXR0clswXSA6IGF0dHIpXG4gICAgICB9IEFTICR7XG4gICAgICAgIHRoaXMucXVvdGVJZGVudGlmaWVyKGFsaWFzKX1gO1xuICAgIH0pO1xuICAgIGNvbnN0IGFzc29jaWF0aW9uID0gaW5jbHVkZS5hc3NvY2lhdGlvbjtcbiAgICBjb25zdCBwYXJlbnRJc1RvcCA9ICFpbmNsdWRlLnBhcmVudC5hc3NvY2lhdGlvbiAmJiBpbmNsdWRlLnBhcmVudC5tb2RlbC5uYW1lID09PSB0b3BMZXZlbEluZm8ub3B0aW9ucy5tb2RlbC5uYW1lO1xuICAgIGNvbnN0IHRhYmxlU291cmNlID0gcGFyZW50VGFibGVOYW1lO1xuICAgIGNvbnN0IGlkZW50U291cmNlID0gYXNzb2NpYXRpb24uaWRlbnRpZmllckZpZWxkO1xuICAgIGNvbnN0IHRhYmxlVGFyZ2V0ID0gaW5jbHVkZUFzLmludGVybmFsQXM7XG4gICAgY29uc3QgaWRlbnRUYXJnZXQgPSBhc3NvY2lhdGlvbi5mb3JlaWduSWRlbnRpZmllckZpZWxkO1xuICAgIGNvbnN0IGF0dHJUYXJnZXQgPSBhc3NvY2lhdGlvbi50YXJnZXRLZXlGaWVsZDtcblxuICAgIGNvbnN0IGpvaW5UeXBlID0gaW5jbHVkZS5yZXF1aXJlZCA/ICdJTk5FUiBKT0lOJyA6IGluY2x1ZGUucmlnaHQgJiYgdGhpcy5fZGlhbGVjdC5zdXBwb3J0c1snUklHSFQgSk9JTiddID8gJ1JJR0hUIE9VVEVSIEpPSU4nIDogJ0xFRlQgT1VURVIgSk9JTic7XG4gICAgbGV0IGpvaW5Cb2R5O1xuICAgIGxldCBqb2luQ29uZGl0aW9uO1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7XG4gICAgICBtYWluOiBbXSxcbiAgICAgIHN1YlF1ZXJ5OiBbXVxuICAgIH07XG4gICAgbGV0IGF0dHJTb3VyY2UgPSBhc3NvY2lhdGlvbi5zb3VyY2VLZXk7XG4gICAgbGV0IHNvdXJjZUpvaW5PbjtcbiAgICBsZXQgdGFyZ2V0Sm9pbk9uO1xuICAgIGxldCB0aHJvdWdoV2hlcmU7XG4gICAgbGV0IHRhcmdldFdoZXJlO1xuXG4gICAgaWYgKHRvcExldmVsSW5mby5vcHRpb25zLmluY2x1ZGVJZ25vcmVBdHRyaWJ1dGVzICE9PSBmYWxzZSkge1xuICAgICAgLy8gVGhyb3VnaCBpbmNsdWRlcyBhcmUgYWx3YXlzIGhhc01hbnksIHNvIHdlIG5lZWQgdG8gYWRkIHRoZSBhdHRyaWJ1dGVzIHRvIHRoZSBtYWluQXR0cmlidXRlcyBubyBtYXR0ZXIgd2hhdCAoUmVhbCBqb2luIHdpbGwgbmV2ZXIgYmUgZXhlY3V0ZWQgaW4gc3VicXVlcnkpXG4gICAgICBmb3IgKGNvbnN0IGF0dHIgb2YgdGhyb3VnaEF0dHJpYnV0ZXMpIHtcbiAgICAgICAgYXR0cmlidXRlcy5tYWluLnB1c2goYXR0cik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmlndXJlIG91dCBpZiB3ZSBuZWVkIHRvIHVzZSBmaWVsZCBvciBhdHRyaWJ1dGVcbiAgICBpZiAoIXRvcExldmVsSW5mby5zdWJRdWVyeSkge1xuICAgICAgYXR0clNvdXJjZSA9IGFzc29jaWF0aW9uLnNvdXJjZUtleUZpZWxkO1xuICAgIH1cbiAgICBpZiAodG9wTGV2ZWxJbmZvLnN1YlF1ZXJ5ICYmICFpbmNsdWRlLnN1YlF1ZXJ5ICYmICFpbmNsdWRlLnBhcmVudC5zdWJRdWVyeSAmJiBpbmNsdWRlLnBhcmVudC5tb2RlbCAhPT0gdG9wTGV2ZWxJbmZvLm9wdGlvbnMubWFpbk1vZGVsKSB7XG4gICAgICBhdHRyU291cmNlID0gYXNzb2NpYXRpb24uc291cmNlS2V5RmllbGQ7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVyIHN0YXRlbWVudCBmb3IgbGVmdCBzaWRlIG9mIHRocm91Z2hcbiAgICAvLyBVc2VkIGJ5IGJvdGggam9pbiBhbmQgc3VicXVlcnkgd2hlcmVcbiAgICAvLyBJZiBwYXJlbnQgaW5jbHVkZSB3YXMgaW4gYSBzdWJxdWVyeSBuZWVkIHRvIGpvaW4gb24gdGhlIGFsaWFzZWQgYXR0cmlidXRlXG4gICAgaWYgKHRvcExldmVsSW5mby5zdWJRdWVyeSAmJiAhaW5jbHVkZS5zdWJRdWVyeSAmJiBpbmNsdWRlLnBhcmVudC5zdWJRdWVyeSAmJiAhcGFyZW50SXNUb3ApIHtcbiAgICAgIC8vIElmIHdlIGFyZSBtaW5pZnlpbmcgYWxpYXNlcyBhbmQgb3VyIEpPSU4gdGFyZ2V0IGhhcyBiZWVuIG1pbmlmaWVkLCB3ZSBuZWVkIHRvIHVzZSB0aGUgYWxpYXMgaW5zdGVhZCBvZiB0aGUgb3JpZ2luYWwgY29sdW1uIG5hbWVcbiAgICAgIGNvbnN0IGpvaW5Tb3VyY2UgPSB0aGlzLl9nZXRBbGlhc0ZvckZpZWxkKHRhYmxlU291cmNlLCBgJHt0YWJsZVNvdXJjZX0uJHthdHRyU291cmNlfWAsIHRvcExldmVsSW5mby5vcHRpb25zKSB8fCBgJHt0YWJsZVNvdXJjZX0uJHthdHRyU291cmNlfWA7XG5cbiAgICAgIHNvdXJjZUpvaW5PbiA9IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGpvaW5Tb3VyY2UpfSA9IGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHdlIGFyZSBtaW5pZnlpbmcgYWxpYXNlcyBhbmQgb3VyIEpPSU4gdGFyZ2V0IGhhcyBiZWVuIG1pbmlmaWVkLCB3ZSBuZWVkIHRvIHVzZSB0aGUgYWxpYXMgaW5zdGVhZCBvZiB0aGUgb3JpZ2luYWwgY29sdW1uIG5hbWVcbiAgICAgIGNvbnN0IGFsaWFzZWRTb3VyY2UgPSB0aGlzLl9nZXRBbGlhc0ZvckZpZWxkKHRhYmxlU291cmNlLCBhdHRyU291cmNlLCB0b3BMZXZlbEluZm8ub3B0aW9ucykgfHwgYXR0clNvdXJjZTtcblxuICAgICAgc291cmNlSm9pbk9uID0gYCR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlU291cmNlKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhbGlhc2VkU291cmNlKX0gPSBgO1xuICAgIH1cbiAgICBzb3VyY2VKb2luT24gKz0gYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIodGhyb3VnaEFzKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihpZGVudFNvdXJjZSl9YDtcblxuICAgIC8vIEZpbHRlciBzdGF0ZW1lbnQgZm9yIHJpZ2h0IHNpZGUgb2YgdGhyb3VnaFxuICAgIC8vIFVzZWQgYnkgYm90aCBqb2luIGFuZCBzdWJxdWVyeSB3aGVyZVxuICAgIHRhcmdldEpvaW5PbiA9IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKHRhYmxlVGFyZ2V0KX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyVGFyZ2V0KX0gPSBgO1xuICAgIHRhcmdldEpvaW5PbiArPSBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcih0aHJvdWdoQXMpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKGlkZW50VGFyZ2V0KX1gO1xuXG4gICAgaWYgKHRocm91Z2gud2hlcmUpIHtcbiAgICAgIHRocm91Z2hXaGVyZSA9IHRoaXMuZ2V0V2hlcmVDb25kaXRpb25zKHRocm91Z2gud2hlcmUsIHRoaXMuc2VxdWVsaXplLmxpdGVyYWwodGhpcy5xdW90ZUlkZW50aWZpZXIodGhyb3VnaEFzKSksIHRocm91Z2gubW9kZWwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmpvaW5UYWJsZURlcGVuZGVudCkge1xuICAgICAgLy8gR2VuZXJhdGUgYSB3cmFwcGVkIGpvaW4gc28gdGhhdCB0aGUgdGhyb3VnaCB0YWJsZSBqb2luIGNhbiBiZSBkZXBlbmRlbnQgb24gdGhlIHRhcmdldCBqb2luXG4gICAgICBqb2luQm9keSA9IGAoICR7dGhpcy5xdW90ZVRhYmxlKHRocm91Z2hUYWJsZSwgdGhyb3VnaEFzKX0gSU5ORVIgSk9JTiAke3RoaXMucXVvdGVUYWJsZShpbmNsdWRlLm1vZGVsLmdldFRhYmxlTmFtZSgpLCBpbmNsdWRlQXMuaW50ZXJuYWxBcyl9IE9OICR7dGFyZ2V0Sm9pbk9ufWA7XG4gICAgICBpZiAodGhyb3VnaFdoZXJlKSB7XG4gICAgICAgIGpvaW5Cb2R5ICs9IGAgQU5EICR7dGhyb3VnaFdoZXJlfWA7XG4gICAgICB9XG4gICAgICBqb2luQm9keSArPSAnKSc7XG4gICAgICBqb2luQ29uZGl0aW9uID0gc291cmNlSm9pbk9uO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBHZW5lcmF0ZSBqb2luIFNRTCBmb3IgbGVmdCBzaWRlIG9mIHRocm91Z2hcbiAgICAgIGpvaW5Cb2R5ID0gYCR7dGhpcy5xdW90ZVRhYmxlKHRocm91Z2hUYWJsZSwgdGhyb3VnaEFzKX0gT04gJHtzb3VyY2VKb2luT259ICR7am9pblR5cGV9ICR7dGhpcy5xdW90ZVRhYmxlKGluY2x1ZGUubW9kZWwuZ2V0VGFibGVOYW1lKCksIGluY2x1ZGVBcy5pbnRlcm5hbEFzKX1gO1xuICAgICAgam9pbkNvbmRpdGlvbiA9IHRhcmdldEpvaW5PbjtcbiAgICAgIGlmICh0aHJvdWdoV2hlcmUpIHtcbiAgICAgICAgam9pbkNvbmRpdGlvbiArPSBgIEFORCAke3Rocm91Z2hXaGVyZX1gO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbmNsdWRlLndoZXJlIHx8IGluY2x1ZGUudGhyb3VnaC53aGVyZSkge1xuICAgICAgaWYgKGluY2x1ZGUud2hlcmUpIHtcbiAgICAgICAgdGFyZ2V0V2hlcmUgPSB0aGlzLmdldFdoZXJlQ29uZGl0aW9ucyhpbmNsdWRlLndoZXJlLCB0aGlzLnNlcXVlbGl6ZS5saXRlcmFsKHRoaXMucXVvdGVJZGVudGlmaWVyKGluY2x1ZGVBcy5pbnRlcm5hbEFzKSksIGluY2x1ZGUubW9kZWwsIHRvcExldmVsSW5mby5vcHRpb25zKTtcbiAgICAgICAgaWYgKHRhcmdldFdoZXJlKSB7XG4gICAgICAgICAgam9pbkNvbmRpdGlvbiArPSBgIEFORCAke3RhcmdldFdoZXJlfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9nZW5lcmF0ZVN1YlF1ZXJ5RmlsdGVyKGluY2x1ZGUsIGluY2x1ZGVBcywgdG9wTGV2ZWxJbmZvKTtcblxuICAgIHJldHVybiB7XG4gICAgICBqb2luOiBqb2luVHlwZSxcbiAgICAgIGJvZHk6IGpvaW5Cb2R5LFxuICAgICAgY29uZGl0aW9uOiBqb2luQ29uZGl0aW9uLFxuICAgICAgYXR0cmlidXRlc1xuICAgIH07XG4gIH1cblxuICAvKlxuICAgKiBHZW5lcmF0ZXMgc3ViUXVlcnlGaWx0ZXIgLSBhIHNlbGVjdCBuZXN0ZWQgaW4gdGhlIHdoZXJlIGNsYXVzZSBvZiB0aGUgc3ViUXVlcnkuXG4gICAqIEZvciBhIGdpdmVuIGluY2x1ZGUgYSBxdWVyeSBpcyBnZW5lcmF0ZWQgdGhhdCBjb250YWlucyBhbGwgdGhlIHdheSBmcm9tIHRoZSBzdWJRdWVyeVxuICAgKiB0YWJsZSB0byB0aGUgaW5jbHVkZSB0YWJsZSBwbHVzIGV2ZXJ5dGhpbmcgdGhhdCdzIGluIHJlcXVpcmVkIHRyYW5zaXRpdmUgY2xvc3VyZSBvZiB0aGVcbiAgICogZ2l2ZW4gaW5jbHVkZS5cbiAgICovXG4gIF9nZW5lcmF0ZVN1YlF1ZXJ5RmlsdGVyKGluY2x1ZGUsIGluY2x1ZGVBcywgdG9wTGV2ZWxJbmZvKSB7XG4gICAgaWYgKCF0b3BMZXZlbEluZm8uc3ViUXVlcnkgfHwgIWluY2x1ZGUuc3ViUXVlcnlGaWx0ZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRvcExldmVsSW5mby5vcHRpb25zLndoZXJlKSB7XG4gICAgICB0b3BMZXZlbEluZm8ub3B0aW9ucy53aGVyZSA9IHt9O1xuICAgIH1cbiAgICBsZXQgcGFyZW50ID0gaW5jbHVkZTtcbiAgICBsZXQgY2hpbGQgPSBpbmNsdWRlO1xuICAgIGxldCBuZXN0ZWRJbmNsdWRlcyA9IHRoaXMuX2dldFJlcXVpcmVkQ2xvc3VyZShpbmNsdWRlKS5pbmNsdWRlO1xuICAgIGxldCBxdWVyeTtcblxuICAgIHdoaWxlICgocGFyZW50ID0gcGFyZW50LnBhcmVudCkpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgaWYgKHBhcmVudC5wYXJlbnQgJiYgIXBhcmVudC5yZXF1aXJlZCkge1xuICAgICAgICByZXR1cm47IC8vIG9ubHkgZ2VuZXJhdGUgc3ViUXVlcnlGaWx0ZXIgaWYgYWxsIHRoZSBwYXJlbnRzIG9mIHRoaXMgaW5jbHVkZSBhcmUgcmVxdWlyZWRcbiAgICAgIH1cblxuICAgICAgaWYgKHBhcmVudC5zdWJRdWVyeUZpbHRlcikge1xuICAgICAgICAvLyB0aGUgaW5jbHVkZSBpcyBhbHJlYWR5IGhhbmRsZWQgYXMgdGhpcyBwYXJlbnQgaGFzIHRoZSBpbmNsdWRlIG9uIGl0cyByZXF1aXJlZCBjbG9zdXJlXG4gICAgICAgIC8vIHNraXAgdG8gcHJldmVudCBkdXBsaWNhdGUgc3ViUXVlcnlGaWx0ZXJcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBuZXN0ZWRJbmNsdWRlcyA9IFtPYmplY3QuYXNzaWduKHt9LCBjaGlsZCwgeyBpbmNsdWRlOiBuZXN0ZWRJbmNsdWRlcywgYXR0cmlidXRlczogW10gfSldO1xuICAgICAgY2hpbGQgPSBwYXJlbnQ7XG4gICAgfVxuXG4gICAgY29uc3QgdG9wSW5jbHVkZSA9IG5lc3RlZEluY2x1ZGVzWzBdO1xuICAgIGNvbnN0IHRvcFBhcmVudCA9IHRvcEluY2x1ZGUucGFyZW50O1xuICAgIGNvbnN0IHRvcEFzc29jaWF0aW9uID0gdG9wSW5jbHVkZS5hc3NvY2lhdGlvbjtcbiAgICB0b3BJbmNsdWRlLmFzc29jaWF0aW9uID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKHRvcEluY2x1ZGUudGhyb3VnaCAmJiBPYmplY3QodG9wSW5jbHVkZS50aHJvdWdoLm1vZGVsKSA9PT0gdG9wSW5jbHVkZS50aHJvdWdoLm1vZGVsKSB7XG4gICAgICBxdWVyeSA9IHRoaXMuc2VsZWN0UXVlcnkodG9wSW5jbHVkZS50aHJvdWdoLm1vZGVsLmdldFRhYmxlTmFtZSgpLCB7XG4gICAgICAgIGF0dHJpYnV0ZXM6IFt0b3BJbmNsdWRlLnRocm91Z2gubW9kZWwucHJpbWFyeUtleUZpZWxkXSxcbiAgICAgICAgaW5jbHVkZTogTW9kZWwuX3ZhbGlkYXRlSW5jbHVkZWRFbGVtZW50cyh7XG4gICAgICAgICAgbW9kZWw6IHRvcEluY2x1ZGUudGhyb3VnaC5tb2RlbCxcbiAgICAgICAgICBpbmNsdWRlOiBbe1xuICAgICAgICAgICAgYXNzb2NpYXRpb246IHRvcEFzc29jaWF0aW9uLnRvVGFyZ2V0LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICB3aGVyZTogdG9wSW5jbHVkZS53aGVyZSxcbiAgICAgICAgICAgIGluY2x1ZGU6IHRvcEluY2x1ZGUuaW5jbHVkZVxuICAgICAgICAgIH1dXG4gICAgICAgIH0pLmluY2x1ZGUsXG4gICAgICAgIG1vZGVsOiB0b3BJbmNsdWRlLnRocm91Z2gubW9kZWwsXG4gICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgW09wLmFuZF06IFtcbiAgICAgICAgICAgIHRoaXMuc2VxdWVsaXplLmxpdGVyYWwoW1xuICAgICAgICAgICAgICBgJHt0aGlzLnF1b3RlVGFibGUodG9wUGFyZW50Lm1vZGVsLm5hbWUpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKHRvcFBhcmVudC5tb2RlbC5wcmltYXJ5S2V5RmllbGQpfWAsXG4gICAgICAgICAgICAgIGAke3RoaXMucXVvdGVJZGVudGlmaWVyKHRvcEluY2x1ZGUudGhyb3VnaC5tb2RlbC5uYW1lKX0uJHt0aGlzLnF1b3RlSWRlbnRpZmllcih0b3BBc3NvY2lhdGlvbi5pZGVudGlmaWVyRmllbGQpfWBcbiAgICAgICAgICAgIF0uam9pbignID0gJykpLFxuICAgICAgICAgICAgdG9wSW5jbHVkZS50aHJvdWdoLndoZXJlXG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgaW5jbHVkZUlnbm9yZUF0dHJpYnV0ZXM6IGZhbHNlXG4gICAgICB9LCB0b3BJbmNsdWRlLnRocm91Z2gubW9kZWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpc0JlbG9uZ3NUbyA9IHRvcEFzc29jaWF0aW9uLmFzc29jaWF0aW9uVHlwZSA9PT0gJ0JlbG9uZ3NUbyc7XG4gICAgICBjb25zdCBzb3VyY2VGaWVsZCA9IGlzQmVsb25nc1RvID8gdG9wQXNzb2NpYXRpb24uaWRlbnRpZmllckZpZWxkIDogdG9wQXNzb2NpYXRpb24uc291cmNlS2V5RmllbGQgfHwgdG9wUGFyZW50Lm1vZGVsLnByaW1hcnlLZXlGaWVsZDtcbiAgICAgIGNvbnN0IHRhcmdldEZpZWxkID0gaXNCZWxvbmdzVG8gPyB0b3BBc3NvY2lhdGlvbi5zb3VyY2VLZXlGaWVsZCB8fCB0b3BJbmNsdWRlLm1vZGVsLnByaW1hcnlLZXlGaWVsZCA6IHRvcEFzc29jaWF0aW9uLmlkZW50aWZpZXJGaWVsZDtcblxuICAgICAgY29uc3Qgam9pbiA9IFtcbiAgICAgICAgYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIodG9wSW5jbHVkZS5hcyl9LiR7dGhpcy5xdW90ZUlkZW50aWZpZXIodGFyZ2V0RmllbGQpfWAsXG4gICAgICAgIGAke3RoaXMucXVvdGVUYWJsZSh0b3BQYXJlbnQuYXMgfHwgdG9wUGFyZW50Lm1vZGVsLm5hbWUpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKHNvdXJjZUZpZWxkKX1gXG4gICAgICBdLmpvaW4oJyA9ICcpO1xuXG4gICAgICBxdWVyeSA9IHRoaXMuc2VsZWN0UXVlcnkodG9wSW5jbHVkZS5tb2RlbC5nZXRUYWJsZU5hbWUoKSwge1xuICAgICAgICBhdHRyaWJ1dGVzOiBbdGFyZ2V0RmllbGRdLFxuICAgICAgICBpbmNsdWRlOiBNb2RlbC5fdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzKHRvcEluY2x1ZGUpLmluY2x1ZGUsXG4gICAgICAgIG1vZGVsOiB0b3BJbmNsdWRlLm1vZGVsLFxuICAgICAgICB3aGVyZToge1xuICAgICAgICAgIFtPcC5hbmRdOiBbXG4gICAgICAgICAgICB0b3BJbmNsdWRlLndoZXJlLFxuICAgICAgICAgICAgeyBbT3Auam9pbl06IHRoaXMuc2VxdWVsaXplLmxpdGVyYWwoam9pbikgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgbGltaXQ6IDEsXG4gICAgICAgIHRhYmxlQXM6IHRvcEluY2x1ZGUuYXMsXG4gICAgICAgIGluY2x1ZGVJZ25vcmVBdHRyaWJ1dGVzOiBmYWxzZVxuICAgICAgfSwgdG9wSW5jbHVkZS5tb2RlbCk7XG4gICAgfVxuXG4gICAgaWYgKCF0b3BMZXZlbEluZm8ub3B0aW9ucy53aGVyZVtPcC5hbmRdKSB7XG4gICAgICB0b3BMZXZlbEluZm8ub3B0aW9ucy53aGVyZVtPcC5hbmRdID0gW107XG4gICAgfVxuXG4gICAgdG9wTGV2ZWxJbmZvLm9wdGlvbnMud2hlcmVbYF9fJHtpbmNsdWRlQXMuaW50ZXJuYWxBc31gXSA9IHRoaXMuc2VxdWVsaXplLmxpdGVyYWwoW1xuICAgICAgJygnLFxuICAgICAgcXVlcnkucmVwbGFjZSgvOyQvLCAnJyksXG4gICAgICAnKScsXG4gICAgICAnSVMgTk9UIE5VTEwnXG4gICAgXS5qb2luKCcgJykpO1xuICB9XG5cbiAgLypcbiAgICogRm9yIGEgZ2l2ZW4gaW5jbHVkZSBoaWVyYXJjaHkgY3JlYXRlcyBhIGNvcHkgb2YgaXQgd2hlcmUgb25seSB0aGUgcmVxdWlyZWQgaW5jbHVkZXNcbiAgICogYXJlIHByZXNlcnZlZC5cbiAgICovXG4gIF9nZXRSZXF1aXJlZENsb3N1cmUoaW5jbHVkZSkge1xuICAgIGNvbnN0IGNvcHkgPSBPYmplY3QuYXNzaWduKHt9LCBpbmNsdWRlLCB7IGF0dHJpYnV0ZXM6IFtdLCBpbmNsdWRlOiBbXSB9KTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGluY2x1ZGUuaW5jbHVkZSkpIHtcbiAgICAgIGNvcHkuaW5jbHVkZSA9IGluY2x1ZGUuaW5jbHVkZVxuICAgICAgICAuZmlsdGVyKGkgPT4gaS5yZXF1aXJlZClcbiAgICAgICAgLm1hcChpbmMgPT4gdGhpcy5fZ2V0UmVxdWlyZWRDbG9zdXJlKGluYykpO1xuICAgIH1cblxuICAgIHJldHVybiBjb3B5O1xuICB9XG5cbiAgZ2V0UXVlcnlPcmRlcnMob3B0aW9ucywgbW9kZWwsIHN1YlF1ZXJ5KSB7XG4gICAgY29uc3QgbWFpblF1ZXJ5T3JkZXIgPSBbXTtcbiAgICBjb25zdCBzdWJRdWVyeU9yZGVyID0gW107XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLm9yZGVyKSkge1xuICAgICAgZm9yIChsZXQgb3JkZXIgb2Ygb3B0aW9ucy5vcmRlcikge1xuXG4gICAgICAgIC8vIHdyYXAgaWYgbm90IGFycmF5XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShvcmRlcikpIHtcbiAgICAgICAgICBvcmRlciA9IFtvcmRlcl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgc3ViUXVlcnlcbiAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KG9yZGVyKVxuICAgICAgICAgICYmIG9yZGVyWzBdXG4gICAgICAgICAgJiYgIShvcmRlclswXSBpbnN0YW5jZW9mIEFzc29jaWF0aW9uKVxuICAgICAgICAgICYmICEodHlwZW9mIG9yZGVyWzBdID09PSAnZnVuY3Rpb24nICYmIG9yZGVyWzBdLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKVxuICAgICAgICAgICYmICEodHlwZW9mIG9yZGVyWzBdLm1vZGVsID09PSAnZnVuY3Rpb24nICYmIG9yZGVyWzBdLm1vZGVsLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKVxuICAgICAgICAgICYmICEodHlwZW9mIG9yZGVyWzBdID09PSAnc3RyaW5nJyAmJiBtb2RlbCAmJiBtb2RlbC5hc3NvY2lhdGlvbnMgIT09IHVuZGVmaW5lZCAmJiBtb2RlbC5hc3NvY2lhdGlvbnNbb3JkZXJbMF1dKVxuICAgICAgICApIHtcbiAgICAgICAgICBzdWJRdWVyeU9yZGVyLnB1c2godGhpcy5xdW90ZShvcmRlciwgbW9kZWwsICctPicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdWJRdWVyeSkge1xuICAgICAgICAgIC8vIEhhbmRsZSBjYXNlIHdoZXJlIHN1Yi1xdWVyeSByZW5hbWVzIGF0dHJpYnV0ZSB3ZSB3YW50IHRvIG9yZGVyIGJ5LFxuICAgICAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vc2VxdWVsaXplL3NlcXVlbGl6ZS9pc3N1ZXMvODczOVxuICAgICAgICAgIGNvbnN0IHN1YlF1ZXJ5QXR0cmlidXRlID0gb3B0aW9ucy5hdHRyaWJ1dGVzLmZpbmQoYSA9PiBBcnJheS5pc0FycmF5KGEpICYmIGFbMF0gPT09IG9yZGVyWzBdICYmIGFbMV0pO1xuICAgICAgICAgIGlmIChzdWJRdWVyeUF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgY29uc3QgbW9kZWxOYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXIobW9kZWwubmFtZSk7XG5cbiAgICAgICAgICAgIG9yZGVyWzBdID0gbmV3IFV0aWxzLkNvbCh0aGlzLl9nZXRBbGlhc0ZvckZpZWxkKG1vZGVsTmFtZSwgc3ViUXVlcnlBdHRyaWJ1dGVbMV0sIG9wdGlvbnMpIHx8IHN1YlF1ZXJ5QXR0cmlidXRlWzFdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBtYWluUXVlcnlPcmRlci5wdXNoKHRoaXMucXVvdGUob3JkZXIsIG1vZGVsLCAnLT4nKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLm9yZGVyIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XG4gICAgICBjb25zdCBzcWwgPSB0aGlzLnF1b3RlKG9wdGlvbnMub3JkZXIsIG1vZGVsLCAnLT4nKTtcbiAgICAgIGlmIChzdWJRdWVyeSkge1xuICAgICAgICBzdWJRdWVyeU9yZGVyLnB1c2goc3FsKTtcbiAgICAgIH1cbiAgICAgIG1haW5RdWVyeU9yZGVyLnB1c2goc3FsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcmRlciBtdXN0IGJlIHR5cGUgb2YgYXJyYXkgb3IgaW5zdGFuY2Ugb2YgYSB2YWxpZCBzZXF1ZWxpemUgbWV0aG9kLicpO1xuICAgIH1cblxuICAgIHJldHVybiB7IG1haW5RdWVyeU9yZGVyLCBzdWJRdWVyeU9yZGVyIH07XG4gIH1cblxuICBzZWxlY3RGcm9tVGFibGVGcmFnbWVudChvcHRpb25zLCBtb2RlbCwgYXR0cmlidXRlcywgdGFibGVzLCBtYWluVGFibGVBcykge1xuICAgIGxldCBmcmFnbWVudCA9IGBTRUxFQ1QgJHthdHRyaWJ1dGVzLmpvaW4oJywgJyl9IEZST00gJHt0YWJsZXN9YDtcblxuICAgIGlmIChtYWluVGFibGVBcykge1xuICAgICAgZnJhZ21lbnQgKz0gYCBBUyAke21haW5UYWJsZUFzfWA7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuaW5kZXhIaW50cyAmJiB0aGlzLl9kaWFsZWN0LnN1cHBvcnRzLmluZGV4SGludHMpIHtcbiAgICAgIGZvciAoY29uc3QgaGludCBvZiBvcHRpb25zLmluZGV4SGludHMpIHtcbiAgICAgICAgaWYgKEluZGV4SGludHNbaGludC50eXBlXSkge1xuICAgICAgICAgIGZyYWdtZW50ICs9IGAgJHtJbmRleEhpbnRzW2hpbnQudHlwZV19IElOREVYICgke2hpbnQudmFsdWVzLm1hcChpbmRleE5hbWUgPT4gdGhpcy5xdW90ZUlkZW50aWZpZXJzKGluZGV4TmFtZSkpLmpvaW4oJywnKX0pYDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmcmFnbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIFNRTCBmcmFnbWVudCBmb3IgYWRkaW5nIHJlc3VsdCBjb25zdHJhaW50cy5cbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIEFuIG9iamVjdCB3aXRoIHNlbGVjdFF1ZXJ5IG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9ICAgICAgICAgVGhlIGdlbmVyYXRlZCBzcWwgcXVlcnkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBhZGRMaW1pdEFuZE9mZnNldChvcHRpb25zKSB7XG4gICAgbGV0IGZyYWdtZW50ID0gJyc7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSAqL1xuICAgIGlmIChvcHRpb25zLm9mZnNldCAhPSBudWxsICYmIG9wdGlvbnMubGltaXQgPT0gbnVsbCkge1xuICAgICAgZnJhZ21lbnQgKz0gJyBMSU1JVCAnICsgdGhpcy5lc2NhcGUob3B0aW9ucy5vZmZzZXQpICsgJywgJyArIDEwMDAwMDAwMDAwMDAwO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5saW1pdCAhPSBudWxsKSB7XG4gICAgICBpZiAob3B0aW9ucy5vZmZzZXQgIT0gbnVsbCkge1xuICAgICAgICBmcmFnbWVudCArPSAnIExJTUlUICcgKyB0aGlzLmVzY2FwZShvcHRpb25zLm9mZnNldCkgKyAnLCAnICsgdGhpcy5lc2NhcGUob3B0aW9ucy5saW1pdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmcmFnbWVudCArPSAnIExJTUlUICcgKyB0aGlzLmVzY2FwZShvcHRpb25zLmxpbWl0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogZXNsaW50LWVuYWJsZSAqL1xuXG4gICAgcmV0dXJuIGZyYWdtZW50O1xuICB9XG5cbiAgaGFuZGxlU2VxdWVsaXplTWV0aG9kKHNtdGgsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCkge1xuICAgIGxldCByZXN1bHQ7XG5cbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuT3BlcmF0b3JNYXAsIHNtdGguY29tcGFyYXRvcikpIHtcbiAgICAgIHNtdGguY29tcGFyYXRvciA9IHRoaXMuT3BlcmF0b3JNYXBbc210aC5jb21wYXJhdG9yXTtcbiAgICB9XG5cbiAgICBpZiAoc210aCBpbnN0YW5jZW9mIFV0aWxzLldoZXJlKSB7XG4gICAgICBsZXQgdmFsdWUgPSBzbXRoLmxvZ2ljO1xuICAgICAgbGV0IGtleTtcblxuICAgICAgaWYgKHNtdGguYXR0cmlidXRlIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XG4gICAgICAgIGtleSA9IHRoaXMuZ2V0V2hlcmVDb25kaXRpb25zKHNtdGguYXR0cmlidXRlLCB0YWJsZU5hbWUsIGZhY3RvcnksIG9wdGlvbnMsIHByZXBlbmQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2V5ID0gYCR7dGhpcy5xdW90ZVRhYmxlKHNtdGguYXR0cmlidXRlLk1vZGVsLm5hbWUpfS4ke3RoaXMucXVvdGVJZGVudGlmaWVyKHNtdGguYXR0cmlidXRlLmZpZWxkIHx8IHNtdGguYXR0cmlidXRlLmZpZWxkTmFtZSl9YDtcbiAgICAgIH1cblxuICAgICAgaWYgKHZhbHVlICYmIHZhbHVlIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XG4gICAgICAgIHZhbHVlID0gdGhpcy5nZXRXaGVyZUNvbmRpdGlvbnModmFsdWUsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCk7XG5cbiAgICAgICAgaWYgKHZhbHVlID09PSAnTlVMTCcpIHtcbiAgICAgICAgICBpZiAoc210aC5jb21wYXJhdG9yID09PSAnPScpIHtcbiAgICAgICAgICAgIHNtdGguY29tcGFyYXRvciA9ICdJUyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzbXRoLmNvbXBhcmF0b3IgPT09ICchPScpIHtcbiAgICAgICAgICAgIHNtdGguY29tcGFyYXRvciA9ICdJUyBOT1QnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBba2V5LCB2YWx1ZV0uam9pbihgICR7c210aC5jb21wYXJhdG9yfSBgKTtcbiAgICAgIH1cbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLndoZXJlSXRlbVF1ZXJ5KHNtdGguYXR0cmlidXRlLCB2YWx1ZSwge1xuICAgICAgICAgIG1vZGVsOiBmYWN0b3J5XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHZhbHVlID0gdGhpcy5ib29sZWFuVmFsdWUodmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSB0aGlzLmVzY2FwZSh2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh2YWx1ZSA9PT0gJ05VTEwnKSB7XG4gICAgICAgIGlmIChzbXRoLmNvbXBhcmF0b3IgPT09ICc9Jykge1xuICAgICAgICAgIHNtdGguY29tcGFyYXRvciA9ICdJUyc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNtdGguY29tcGFyYXRvciA9PT0gJyE9Jykge1xuICAgICAgICAgIHNtdGguY29tcGFyYXRvciA9ICdJUyBOT1QnO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBba2V5LCB2YWx1ZV0uam9pbihgICR7c210aC5jb21wYXJhdG9yfSBgKTtcbiAgICB9XG4gICAgaWYgKHNtdGggaW5zdGFuY2VvZiBVdGlscy5MaXRlcmFsKSB7XG4gICAgICByZXR1cm4gc210aC52YWw7XG4gICAgfVxuICAgIGlmIChzbXRoIGluc3RhbmNlb2YgVXRpbHMuQ2FzdCkge1xuICAgICAgaWYgKHNtdGgudmFsIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKHNtdGgudmFsLCB0YWJsZU5hbWUsIGZhY3RvcnksIG9wdGlvbnMsIHByZXBlbmQpO1xuICAgICAgfSBlbHNlIGlmIChfLmlzUGxhaW5PYmplY3Qoc210aC52YWwpKSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMud2hlcmVJdGVtc1F1ZXJ5KHNtdGgudmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuZXNjYXBlKHNtdGgudmFsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGBDQVNUKCR7cmVzdWx0fSBBUyAke3NtdGgudHlwZS50b1VwcGVyQ2FzZSgpfSlgO1xuICAgIH1cbiAgICBpZiAoc210aCBpbnN0YW5jZW9mIFV0aWxzLkZuKSB7XG4gICAgICByZXR1cm4gYCR7c210aC5mbn0oJHtzbXRoLmFyZ3MubWFwKGFyZyA9PiB7XG4gICAgICAgIGlmIChhcmcgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2QoYXJnLCB0YWJsZU5hbWUsIGZhY3RvcnksIG9wdGlvbnMsIHByZXBlbmQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QoYXJnKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLndoZXJlSXRlbXNRdWVyeShhcmcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVzY2FwZShhcmcpO1xuICAgICAgfSkuam9pbignLCAnKX0pYDtcbiAgICB9XG4gICAgaWYgKHNtdGggaW5zdGFuY2VvZiBVdGlscy5Db2wpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHNtdGguY29sKSAmJiAhZmFjdG9yeSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIFNlcXVlbGl6ZS5jb2woKSB3aXRoIGFycmF5IG91dHNpZGUgb2Ygb3JkZXIgLyBncm91cCBjbGF1c2UnKTtcbiAgICAgIH1cbiAgICAgIGlmIChzbXRoLmNvbC5zdGFydHNXaXRoKCcqJykpIHtcbiAgICAgICAgcmV0dXJuICcqJztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnF1b3RlKHNtdGguY29sLCBmYWN0b3J5KTtcbiAgICB9XG4gICAgcmV0dXJuIHNtdGgudG9TdHJpbmcodGhpcywgZmFjdG9yeSk7XG4gIH1cblxuICB3aGVyZVF1ZXJ5KHdoZXJlLCBvcHRpb25zKSB7XG4gICAgY29uc3QgcXVlcnkgPSB0aGlzLndoZXJlSXRlbXNRdWVyeSh3aGVyZSwgb3B0aW9ucyk7XG4gICAgaWYgKHF1ZXJ5ICYmIHF1ZXJ5Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGBXSEVSRSAke3F1ZXJ5fWA7XG4gICAgfVxuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIHdoZXJlSXRlbXNRdWVyeSh3aGVyZSwgb3B0aW9ucywgYmluZGluZykge1xuICAgIGlmIChcbiAgICAgIHdoZXJlID09PSBudWxsIHx8XG4gICAgICB3aGVyZSA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICBVdGlscy5nZXRDb21wbGV4U2l6ZSh3aGVyZSkgPT09IDBcbiAgICApIHtcbiAgICAgIC8vIE5PIE9QXG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB3aGVyZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU3VwcG9ydCBmb3IgYHt3aGVyZTogXFwncmF3IHF1ZXJ5XFwnfWAgaGFzIGJlZW4gcmVtb3ZlZC4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBpdGVtcyA9IFtdO1xuXG4gICAgYmluZGluZyA9IGJpbmRpbmcgfHwgJ0FORCc7XG4gICAgaWYgKGJpbmRpbmdbMF0gIT09ICcgJykgYmluZGluZyA9IGAgJHtiaW5kaW5nfSBgO1xuXG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdCh3aGVyZSkpIHtcbiAgICAgIFV0aWxzLmdldENvbXBsZXhLZXlzKHdoZXJlKS5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgICBjb25zdCBpdGVtID0gd2hlcmVbcHJvcF07XG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy53aGVyZUl0ZW1RdWVyeShwcm9wLCBpdGVtLCBvcHRpb25zKSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXRlbXMucHVzaCh0aGlzLndoZXJlSXRlbVF1ZXJ5KHVuZGVmaW5lZCwgd2hlcmUsIG9wdGlvbnMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbXMubGVuZ3RoICYmIGl0ZW1zLmZpbHRlcihpdGVtID0+IGl0ZW0gJiYgaXRlbS5sZW5ndGgpLmpvaW4oYmluZGluZykgfHwgJyc7XG4gIH1cblxuICB3aGVyZUl0ZW1RdWVyeShrZXksIHZhbHVlLCBvcHRpb25zID0ge30pIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBXSEVSRSBwYXJhbWV0ZXIgXCIke2tleX1cIiBoYXMgaW52YWxpZCBcInVuZGVmaW5lZFwiIHZhbHVlYCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIGtleS5pbmNsdWRlcygnLicpICYmIG9wdGlvbnMubW9kZWwpIHtcbiAgICAgIGNvbnN0IGtleVBhcnRzID0ga2V5LnNwbGl0KCcuJyk7XG4gICAgICBpZiAob3B0aW9ucy5tb2RlbC5yYXdBdHRyaWJ1dGVzW2tleVBhcnRzWzBdXSAmJiBvcHRpb25zLm1vZGVsLnJhd0F0dHJpYnV0ZXNba2V5UGFydHNbMF1dLnR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuSlNPTikge1xuICAgICAgICBjb25zdCB0bXAgPSB7fTtcbiAgICAgICAgY29uc3QgZmllbGQgPSBvcHRpb25zLm1vZGVsLnJhd0F0dHJpYnV0ZXNba2V5UGFydHNbMF1dO1xuICAgICAgICBfLnNldCh0bXAsIGtleVBhcnRzLnNsaWNlKDEpLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLndoZXJlSXRlbVF1ZXJ5KGZpZWxkLmZpZWxkIHx8IGtleVBhcnRzWzBdLCB0bXAsIE9iamVjdC5hc3NpZ24oeyBmaWVsZCB9LCBvcHRpb25zKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZmllbGQgPSB0aGlzLl9maW5kRmllbGQoa2V5LCBvcHRpb25zKTtcbiAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZCAmJiBmaWVsZC50eXBlIHx8IG9wdGlvbnMudHlwZTtcblxuICAgIGNvbnN0IGlzUGxhaW5PYmplY3QgPSBfLmlzUGxhaW5PYmplY3QodmFsdWUpO1xuICAgIGNvbnN0IGlzQXJyYXkgPSAhaXNQbGFpbk9iamVjdCAmJiBBcnJheS5pc0FycmF5KHZhbHVlKTtcbiAgICBrZXkgPSB0aGlzLk9wZXJhdG9yc0FsaWFzTWFwICYmIHRoaXMuT3BlcmF0b3JzQWxpYXNNYXBba2V5XSB8fCBrZXk7XG4gICAgaWYgKGlzUGxhaW5PYmplY3QpIHtcbiAgICAgIHZhbHVlID0gdGhpcy5fcmVwbGFjZUFsaWFzZXModmFsdWUpO1xuICAgIH1cbiAgICBjb25zdCB2YWx1ZUtleXMgPSBpc1BsYWluT2JqZWN0ICYmIFV0aWxzLmdldENvbXBsZXhLZXlzKHZhbHVlKTtcblxuICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNQbGFpbk9iamVjdCAmJiB2YWx1ZUtleXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiB0aGlzLndoZXJlSXRlbVF1ZXJ5KHZhbHVlS2V5c1swXSwgdmFsdWVbdmFsdWVLZXlzWzBdXSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICBjb25zdCBvcFZhbHVlID0gb3B0aW9ucy5iaW5kUGFyYW0gPyAnTlVMTCcgOiB0aGlzLmVzY2FwZSh2YWx1ZSwgZmllbGQpO1xuICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIG9wVmFsdWUsIHRoaXMuT3BlcmF0b3JNYXBbT3AuaXNdLCBvcHRpb25zLnByZWZpeCk7XG4gICAgfVxuXG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgY29uc3Qgb3BWYWx1ZSA9IG9wdGlvbnMuYmluZFBhcmFtID8gdGhpcy5mb3JtYXQodmFsdWUsIGZpZWxkLCBvcHRpb25zLCBvcHRpb25zLmJpbmRQYXJhbSkgOiB0aGlzLmVzY2FwZSh2YWx1ZSwgZmllbGQpO1xuICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIG9wVmFsdWUsIHRoaXMuT3BlcmF0b3JNYXBbT3AuZXFdLCBvcHRpb25zLnByZWZpeCk7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kICYmICEoa2V5ICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgaW5zdGFuY2VvZiBVdGlscy5GbikpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhbmRsZVNlcXVlbGl6ZU1ldGhvZCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCB3aGVyZTogW10gdG8gT3AuYW5kIGlmIHBvc3NpYmxlLCBlbHNlIHRyZWF0IGFzIGxpdGVyYWwvcmVwbGFjZW1lbnRzXG4gICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkICYmIGlzQXJyYXkpIHtcbiAgICAgIGlmIChVdGlscy5jYW5UcmVhdEFycmF5QXNBbmQodmFsdWUpKSB7XG4gICAgICAgIGtleSA9IE9wLmFuZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU3VwcG9ydCBmb3IgbGl0ZXJhbCByZXBsYWNlbWVudHMgaW4gdGhlIGB3aGVyZWAgb2JqZWN0IGhhcyBiZWVuIHJlbW92ZWQuJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGtleSA9PT0gT3Aub3IgfHwga2V5ID09PSBPcC5hbmQgfHwga2V5ID09PSBPcC5ub3QpIHtcbiAgICAgIHJldHVybiB0aGlzLl93aGVyZUdyb3VwQmluZChrZXksIHZhbHVlLCBvcHRpb25zKTtcbiAgICB9XG5cblxuICAgIGlmICh2YWx1ZVtPcC5vcl0pIHtcbiAgICAgIHJldHVybiB0aGlzLl93aGVyZUJpbmQodGhpcy5PcGVyYXRvck1hcFtPcC5vcl0sIGtleSwgdmFsdWVbT3Aub3JdLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBpZiAodmFsdWVbT3AuYW5kXSkge1xuICAgICAgcmV0dXJuIHRoaXMuX3doZXJlQmluZCh0aGlzLk9wZXJhdG9yTWFwW09wLmFuZF0sIGtleSwgdmFsdWVbT3AuYW5kXSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgaWYgKGlzQXJyYXkgJiYgZmllbGRUeXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkFSUkFZKSB7XG4gICAgICBjb25zdCBvcFZhbHVlID0gb3B0aW9ucy5iaW5kUGFyYW0gPyB0aGlzLmZvcm1hdCh2YWx1ZSwgZmllbGQsIG9wdGlvbnMsIG9wdGlvbnMuYmluZFBhcmFtKSA6IHRoaXMuZXNjYXBlKHZhbHVlLCBmaWVsZCk7XG4gICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgb3BWYWx1ZSwgdGhpcy5PcGVyYXRvck1hcFtPcC5lcV0sIG9wdGlvbnMucHJlZml4KTtcbiAgICB9XG5cbiAgICBpZiAoaXNQbGFpbk9iamVjdCAmJiBmaWVsZFR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuSlNPTiAmJiBvcHRpb25zLmpzb24gIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fd2hlcmVKU09OKGtleSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgIH1cbiAgICAvLyBJZiBtdWx0aXBsZSBrZXlzIHdlIGNvbWJpbmUgdGhlIGRpZmZlcmVudCBsb2dpYyBjb25kaXRpb25zXG4gICAgaWYgKGlzUGxhaW5PYmplY3QgJiYgdmFsdWVLZXlzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiB0aGlzLl93aGVyZUJpbmQodGhpcy5PcGVyYXRvck1hcFtPcC5hbmRdLCBrZXksIHZhbHVlLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBpZiAoaXNBcnJheSkge1xuICAgICAgcmV0dXJuIHRoaXMuX3doZXJlUGFyc2VTaW5nbGVWYWx1ZU9iamVjdChrZXksIGZpZWxkLCBPcC5pbiwgdmFsdWUsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAoaXNQbGFpbk9iamVjdCkge1xuICAgICAgaWYgKHRoaXMuT3BlcmF0b3JNYXBbdmFsdWVLZXlzWzBdXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fd2hlcmVQYXJzZVNpbmdsZVZhbHVlT2JqZWN0KGtleSwgZmllbGQsIHZhbHVlS2V5c1swXSwgdmFsdWVbdmFsdWVLZXlzWzBdXSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fd2hlcmVQYXJzZVNpbmdsZVZhbHVlT2JqZWN0KGtleSwgZmllbGQsIHRoaXMuT3BlcmF0b3JNYXBbT3AuZXFdLCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgaWYgKGtleSA9PT0gT3AucGxhY2Vob2xkZXIpIHtcbiAgICAgIGNvbnN0IG9wVmFsdWUgPSBvcHRpb25zLmJpbmRQYXJhbSA/IHRoaXMuZm9ybWF0KHZhbHVlLCBmaWVsZCwgb3B0aW9ucywgb3B0aW9ucy5iaW5kUGFyYW0pIDogdGhpcy5lc2NhcGUodmFsdWUsIGZpZWxkKTtcbiAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUodGhpcy5PcGVyYXRvck1hcFtrZXldLCBvcFZhbHVlLCB0aGlzLk9wZXJhdG9yTWFwW09wLmVxXSwgb3B0aW9ucy5wcmVmaXgpO1xuICAgIH1cblxuICAgIGNvbnN0IG9wVmFsdWUgPSBvcHRpb25zLmJpbmRQYXJhbSA/IHRoaXMuZm9ybWF0KHZhbHVlLCBmaWVsZCwgb3B0aW9ucywgb3B0aW9ucy5iaW5kUGFyYW0pIDogdGhpcy5lc2NhcGUodmFsdWUsIGZpZWxkKTtcbiAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgb3BWYWx1ZSwgdGhpcy5PcGVyYXRvck1hcFtPcC5lcV0sIG9wdGlvbnMucHJlZml4KTtcbiAgfVxuXG4gIF9maW5kRmllbGQoa2V5LCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuZmllbGQpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZpZWxkO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLm1vZGVsICYmIG9wdGlvbnMubW9kZWwucmF3QXR0cmlidXRlcyAmJiBvcHRpb25zLm1vZGVsLnJhd0F0dHJpYnV0ZXNba2V5XSkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMubW9kZWwucmF3QXR0cmlidXRlc1trZXldO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLm1vZGVsICYmIG9wdGlvbnMubW9kZWwuZmllbGRSYXdBdHRyaWJ1dGVzTWFwICYmIG9wdGlvbnMubW9kZWwuZmllbGRSYXdBdHRyaWJ1dGVzTWFwW2tleV0pIHtcbiAgICAgIHJldHVybiBvcHRpb25zLm1vZGVsLmZpZWxkUmF3QXR0cmlidXRlc01hcFtrZXldO1xuICAgIH1cbiAgfVxuXG4gIC8vIE9SL0FORC9OT1QgZ3JvdXBpbmcgbG9naWNcbiAgX3doZXJlR3JvdXBCaW5kKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBiaW5kaW5nID0ga2V5ID09PSBPcC5vciA/IHRoaXMuT3BlcmF0b3JNYXBbT3Aub3JdIDogdGhpcy5PcGVyYXRvck1hcFtPcC5hbmRdO1xuICAgIGNvbnN0IG91dGVyQmluZGluZyA9IGtleSA9PT0gT3Aubm90ID8gJ05PVCAnIDogJyc7XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUubWFwKGl0ZW0gPT4ge1xuICAgICAgICBsZXQgaXRlbVF1ZXJ5ID0gdGhpcy53aGVyZUl0ZW1zUXVlcnkoaXRlbSwgb3B0aW9ucywgdGhpcy5PcGVyYXRvck1hcFtPcC5hbmRdKTtcbiAgICAgICAgaWYgKGl0ZW1RdWVyeSAmJiBpdGVtUXVlcnkubGVuZ3RoICYmIChBcnJheS5pc0FycmF5KGl0ZW0pIHx8IF8uaXNQbGFpbk9iamVjdChpdGVtKSkgJiYgVXRpbHMuZ2V0Q29tcGxleFNpemUoaXRlbSkgPiAxKSB7XG4gICAgICAgICAgaXRlbVF1ZXJ5ID0gYCgke2l0ZW1RdWVyeX0pYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlbVF1ZXJ5O1xuICAgICAgfSkuZmlsdGVyKGl0ZW0gPT4gaXRlbSAmJiBpdGVtLmxlbmd0aCk7XG5cbiAgICAgIHZhbHVlID0gdmFsdWUubGVuZ3RoICYmIHZhbHVlLmpvaW4oYmluZGluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gdGhpcy53aGVyZUl0ZW1zUXVlcnkodmFsdWUsIG9wdGlvbnMsIGJpbmRpbmcpO1xuICAgIH1cbiAgICAvLyBPcC5vcjogW10gc2hvdWxkIHJldHVybiBubyBkYXRhLlxuICAgIC8vIE9wLm5vdCBvZiBubyByZXN0cmljdGlvbiBzaG91bGQgYWxzbyByZXR1cm4gbm8gZGF0YVxuICAgIGlmICgoa2V5ID09PSBPcC5vciB8fCBrZXkgPT09IE9wLm5vdCkgJiYgIXZhbHVlKSB7XG4gICAgICByZXR1cm4gJzAgPSAxJztcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWUgPyBgJHtvdXRlckJpbmRpbmd9KCR7dmFsdWV9KWAgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBfd2hlcmVCaW5kKGJpbmRpbmcsIGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICBpZiAoXy5pc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgICAgdmFsdWUgPSBVdGlscy5nZXRDb21wbGV4S2V5cyh2YWx1ZSkubWFwKHByb3AgPT4ge1xuICAgICAgICBjb25zdCBpdGVtID0gdmFsdWVbcHJvcF07XG4gICAgICAgIHJldHVybiB0aGlzLndoZXJlSXRlbVF1ZXJ5KGtleSwgeyBbcHJvcF06IGl0ZW0gfSwgb3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5tYXAoaXRlbSA9PiB0aGlzLndoZXJlSXRlbVF1ZXJ5KGtleSwgaXRlbSwgb3B0aW9ucykpO1xuICAgIH1cblxuICAgIHZhbHVlID0gdmFsdWUuZmlsdGVyKGl0ZW0gPT4gaXRlbSAmJiBpdGVtLmxlbmd0aCk7XG5cbiAgICByZXR1cm4gdmFsdWUubGVuZ3RoID8gYCgke3ZhbHVlLmpvaW4oYmluZGluZyl9KWAgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBfd2hlcmVKU09OKGtleSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBpdGVtcyA9IFtdO1xuICAgIGxldCBiYXNlS2V5ID0gdGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KTtcbiAgICBpZiAob3B0aW9ucy5wcmVmaXgpIHtcbiAgICAgIGlmIChvcHRpb25zLnByZWZpeCBpbnN0YW5jZW9mIFV0aWxzLkxpdGVyYWwpIHtcbiAgICAgICAgYmFzZUtleSA9IGAke3RoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKG9wdGlvbnMucHJlZml4KX0uJHtiYXNlS2V5fWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBiYXNlS2V5ID0gYCR7dGhpcy5xdW90ZVRhYmxlKG9wdGlvbnMucHJlZml4KX0uJHtiYXNlS2V5fWA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgVXRpbHMuZ2V0T3BlcmF0b3JzKHZhbHVlKS5mb3JFYWNoKG9wID0+IHtcbiAgICAgIGNvbnN0IHdoZXJlID0ge1xuICAgICAgICBbb3BdOiB2YWx1ZVtvcF1cbiAgICAgIH07XG4gICAgICBpdGVtcy5wdXNoKHRoaXMud2hlcmVJdGVtUXVlcnkoa2V5LCB3aGVyZSwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyBqc29uOiBmYWxzZSB9KSkpO1xuICAgIH0pO1xuXG4gICAgXy5mb3JPd24odmFsdWUsIChpdGVtLCBwcm9wKSA9PiB7XG4gICAgICB0aGlzLl90cmF2ZXJzZUpTT04oaXRlbXMsIGJhc2VLZXksIHByb3AsIGl0ZW0sIFtwcm9wXSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCByZXN1bHQgPSBpdGVtcy5qb2luKHRoaXMuT3BlcmF0b3JNYXBbT3AuYW5kXSk7XG4gICAgcmV0dXJuIGl0ZW1zLmxlbmd0aCA+IDEgPyBgKCR7cmVzdWx0fSlgIDogcmVzdWx0O1xuICB9XG5cbiAgX3RyYXZlcnNlSlNPTihpdGVtcywgYmFzZUtleSwgcHJvcCwgaXRlbSwgcGF0aCkge1xuICAgIGxldCBjYXN0O1xuXG4gICAgaWYgKHBhdGhbcGF0aC5sZW5ndGggLSAxXS5pbmNsdWRlcygnOjonKSkge1xuICAgICAgY29uc3QgdG1wID0gcGF0aFtwYXRoLmxlbmd0aCAtIDFdLnNwbGl0KCc6OicpO1xuICAgICAgY2FzdCA9IHRtcFsxXTtcbiAgICAgIHBhdGhbcGF0aC5sZW5ndGggLSAxXSA9IHRtcFswXTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXRoS2V5ID0gdGhpcy5qc29uUGF0aEV4dHJhY3Rpb25RdWVyeShiYXNlS2V5LCBwYXRoKTtcblxuICAgIGlmIChfLmlzUGxhaW5PYmplY3QoaXRlbSkpIHtcbiAgICAgIFV0aWxzLmdldE9wZXJhdG9ycyhpdGVtKS5mb3JFYWNoKG9wID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLl90b0pTT05WYWx1ZShpdGVtW29wXSk7XG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy53aGVyZUl0ZW1RdWVyeSh0aGlzLl9jYXN0S2V5KHBhdGhLZXksIHZhbHVlLCBjYXN0KSwgeyBbb3BdOiB2YWx1ZSB9KSk7XG4gICAgICB9KTtcbiAgICAgIF8uZm9yT3duKGl0ZW0sICh2YWx1ZSwgaXRlbVByb3ApID0+IHtcbiAgICAgICAgdGhpcy5fdHJhdmVyc2VKU09OKGl0ZW1zLCBiYXNlS2V5LCBpdGVtUHJvcCwgdmFsdWUsIHBhdGguY29uY2F0KFtpdGVtUHJvcF0pKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaXRlbSA9IHRoaXMuX3RvSlNPTlZhbHVlKGl0ZW0pO1xuICAgIGl0ZW1zLnB1c2godGhpcy53aGVyZUl0ZW1RdWVyeSh0aGlzLl9jYXN0S2V5KHBhdGhLZXksIGl0ZW0sIGNhc3QpLCB7IFtPcC5lcV06IGl0ZW0gfSkpO1xuICB9XG5cbiAgX3RvSlNPTlZhbHVlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgX2Nhc3RLZXkoa2V5LCB2YWx1ZSwgY2FzdCwganNvbikge1xuICAgIGNhc3QgPSBjYXN0IHx8IHRoaXMuX2dldEpzb25DYXN0KEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWVbMF0gOiB2YWx1ZSk7XG4gICAgaWYgKGNhc3QpIHtcbiAgICAgIHJldHVybiBuZXcgVXRpbHMuTGl0ZXJhbCh0aGlzLmhhbmRsZVNlcXVlbGl6ZU1ldGhvZChuZXcgVXRpbHMuQ2FzdChuZXcgVXRpbHMuTGl0ZXJhbChrZXkpLCBjYXN0LCBqc29uKSkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgVXRpbHMuTGl0ZXJhbChrZXkpO1xuICB9XG5cbiAgX2dldEpzb25DYXN0KHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiAnZG91YmxlIHByZWNpc2lvbic7XG4gICAgfVxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgIHJldHVybiAndGltZXN0YW1wdHonO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHJldHVybiAnYm9vbGVhbic7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIF9qb2luS2V5VmFsdWUoa2V5LCB2YWx1ZSwgY29tcGFyYXRvciwgcHJlZml4KSB7XG4gICAgaWYgKCFrZXkpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgaWYgKGNvbXBhcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2tleX0gYW5kICR7dmFsdWV9IGhhcyBubyBjb21wYXJhdG9yYCk7XG4gICAgfVxuICAgIGtleSA9IHRoaXMuX2dldFNhZmVLZXkoa2V5LCBwcmVmaXgpO1xuICAgIHJldHVybiBba2V5LCB2YWx1ZV0uam9pbihgICR7Y29tcGFyYXRvcn0gYCk7XG4gIH1cblxuICBfZ2V0U2FmZUtleShrZXksIHByZWZpeCkge1xuICAgIGlmIChrZXkgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcbiAgICAgIGtleSA9IHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKGtleSk7XG4gICAgICByZXR1cm4gdGhpcy5fcHJlZml4S2V5KHRoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKGtleSksIHByZWZpeCk7XG4gICAgfVxuXG4gICAgaWYgKFV0aWxzLmlzQ29sU3RyaW5nKGtleSkpIHtcbiAgICAgIGtleSA9IGtleS5zdWJzdHIoMSwga2V5Lmxlbmd0aCAtIDIpLnNwbGl0KCcuJyk7XG5cbiAgICAgIGlmIChrZXkubGVuZ3RoID4gMikge1xuICAgICAgICBrZXkgPSBbXG4gICAgICAgICAgLy8gam9pbiB0aGUgdGFibGVzIGJ5IC0+IHRvIG1hdGNoIG91dCBpbnRlcm5hbCBuYW1pbmdzXG4gICAgICAgICAga2V5LnNsaWNlKDAsIC0xKS5qb2luKCctPicpLFxuICAgICAgICAgIGtleVtrZXkubGVuZ3RoIC0gMV1cbiAgICAgICAgXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGtleS5tYXAoaWRlbnRpZmllciA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihpZGVudGlmaWVyKSkuam9pbignLicpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9wcmVmaXhLZXkodGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KSwgcHJlZml4KTtcbiAgfVxuXG4gIF9wcmVmaXhLZXkoa2V5LCBwcmVmaXgpIHtcbiAgICBpZiAocHJlZml4KSB7XG4gICAgICBpZiAocHJlZml4IGluc3RhbmNlb2YgVXRpbHMuTGl0ZXJhbCkge1xuICAgICAgICByZXR1cm4gW3RoaXMuaGFuZGxlU2VxdWVsaXplTWV0aG9kKHByZWZpeCksIGtleV0uam9pbignLicpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gW3RoaXMucXVvdGVUYWJsZShwcmVmaXgpLCBrZXldLmpvaW4oJy4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4ga2V5O1xuICB9XG5cbiAgX3doZXJlUGFyc2VTaW5nbGVWYWx1ZU9iamVjdChrZXksIGZpZWxkLCBwcm9wLCB2YWx1ZSwgb3B0aW9ucykge1xuICAgIGlmIChwcm9wID09PSBPcC5ub3QpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBwcm9wID0gT3Aubm90SW47XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB0cnVlICYmIHZhbHVlICE9PSBmYWxzZSkge1xuICAgICAgICBwcm9wID0gT3AubmU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGNvbXBhcmF0b3IgPSB0aGlzLk9wZXJhdG9yTWFwW3Byb3BdIHx8IHRoaXMuT3BlcmF0b3JNYXBbT3AuZXFdO1xuXG4gICAgc3dpdGNoIChwcm9wKSB7XG4gICAgICBjYXNlIE9wLmluOlxuICAgICAgY2FzZSBPcC5ub3RJbjpcbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgVXRpbHMuTGl0ZXJhbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCB2YWx1ZS52YWwsIGNvbXBhcmF0b3IsIG9wdGlvbnMucHJlZml4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgYCgke3ZhbHVlLm1hcChpdGVtID0+IHRoaXMuZXNjYXBlKGl0ZW0sIGZpZWxkKSkuam9pbignLCAnKX0pYCwgY29tcGFyYXRvciwgb3B0aW9ucy5wcmVmaXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBhcmF0b3IgPT09IHRoaXMuT3BlcmF0b3JNYXBbT3AuaW5dKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksICcoTlVMTCknLCBjb21wYXJhdG9yLCBvcHRpb25zLnByZWZpeCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICBjYXNlIE9wLmFueTpcbiAgICAgIGNhc2UgT3AuYWxsOlxuICAgICAgICBjb21wYXJhdG9yID0gYCR7dGhpcy5PcGVyYXRvck1hcFtPcC5lcV19ICR7Y29tcGFyYXRvcn1gO1xuICAgICAgICBpZiAodmFsdWVbT3AudmFsdWVzXSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCBgKFZBTFVFUyAke3ZhbHVlW09wLnZhbHVlc10ubWFwKGl0ZW0gPT4gYCgke3RoaXMuZXNjYXBlKGl0ZW0pfSlgKS5qb2luKCcsICcpfSlgLCBjb21wYXJhdG9yLCBvcHRpb25zLnByZWZpeCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgYCgke3RoaXMuZXNjYXBlKHZhbHVlLCBmaWVsZCl9KWAsIGNvbXBhcmF0b3IsIG9wdGlvbnMucHJlZml4KTtcbiAgICAgIGNhc2UgT3AuYmV0d2VlbjpcbiAgICAgIGNhc2UgT3Aubm90QmV0d2VlbjpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIGAke3RoaXMuZXNjYXBlKHZhbHVlWzBdLCBmaWVsZCl9IEFORCAke3RoaXMuZXNjYXBlKHZhbHVlWzFdLCBmaWVsZCl9YCwgY29tcGFyYXRvciwgb3B0aW9ucy5wcmVmaXgpO1xuICAgICAgY2FzZSBPcC5yYXc6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGAkcmF3YCB3aGVyZSBwcm9wZXJ0eSBpcyBubyBsb25nZXIgc3VwcG9ydGVkLiAgVXNlIGBzZXF1ZWxpemUubGl0ZXJhbGAgaW5zdGVhZC4nKTtcbiAgICAgIGNhc2UgT3AuY29sOlxuICAgICAgICBjb21wYXJhdG9yID0gdGhpcy5PcGVyYXRvck1hcFtPcC5lcV07XG4gICAgICAgIHZhbHVlID0gdmFsdWUuc3BsaXQoJy4nKTtcblxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID4gMikge1xuICAgICAgICAgIHZhbHVlID0gW1xuICAgICAgICAgICAgLy8gam9pbiB0aGUgdGFibGVzIGJ5IC0+IHRvIG1hdGNoIG91dCBpbnRlcm5hbCBuYW1pbmdzXG4gICAgICAgICAgICB2YWx1ZS5zbGljZSgwLCAtMSkuam9pbignLT4nKSxcbiAgICAgICAgICAgIHZhbHVlW3ZhbHVlLmxlbmd0aCAtIDFdXG4gICAgICAgICAgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCB2YWx1ZS5tYXAoaWRlbnRpZmllciA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihpZGVudGlmaWVyKSkuam9pbignLicpLCBjb21wYXJhdG9yLCBvcHRpb25zLnByZWZpeCk7XG4gICAgICBjYXNlIE9wLnN0YXJ0c1dpdGg6XG4gICAgICAgIGNvbXBhcmF0b3IgPSB0aGlzLk9wZXJhdG9yTWFwW09wLmxpa2VdO1xuICAgICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgdGhpcy5lc2NhcGUoYCR7dmFsdWV9JWApLCBjb21wYXJhdG9yLCBvcHRpb25zLnByZWZpeCk7XG4gICAgICBjYXNlIE9wLmVuZHNXaXRoOlxuICAgICAgICBjb21wYXJhdG9yID0gdGhpcy5PcGVyYXRvck1hcFtPcC5saWtlXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIHRoaXMuZXNjYXBlKGAlJHt2YWx1ZX1gKSwgY29tcGFyYXRvciwgb3B0aW9ucy5wcmVmaXgpO1xuICAgICAgY2FzZSBPcC5zdWJzdHJpbmc6XG4gICAgICAgIGNvbXBhcmF0b3IgPSB0aGlzLk9wZXJhdG9yTWFwW09wLmxpa2VdO1xuICAgICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgdGhpcy5lc2NhcGUoYCUke3ZhbHVlfSVgKSwgY29tcGFyYXRvciwgb3B0aW9ucy5wcmVmaXgpO1xuICAgIH1cblxuICAgIGNvbnN0IGVzY2FwZU9wdGlvbnMgPSB7XG4gICAgICBhY2NlcHRTdHJpbmdzOiBjb21wYXJhdG9yLmluY2x1ZGVzKHRoaXMuT3BlcmF0b3JNYXBbT3AubGlrZV0pXG4gICAgfTtcblxuICAgIGlmIChfLmlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgICBpZiAodmFsdWVbT3AuY29sXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgdGhpcy53aGVyZUl0ZW1RdWVyeShudWxsLCB2YWx1ZSksIGNvbXBhcmF0b3IsIG9wdGlvbnMucHJlZml4KTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZVtPcC5hbnldKSB7XG4gICAgICAgIGVzY2FwZU9wdGlvbnMuaXNMaXN0ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIGAoJHt0aGlzLmVzY2FwZSh2YWx1ZVtPcC5hbnldLCBmaWVsZCwgZXNjYXBlT3B0aW9ucyl9KWAsIGAke2NvbXBhcmF0b3J9ICR7dGhpcy5PcGVyYXRvck1hcFtPcC5hbnldfWAsIG9wdGlvbnMucHJlZml4KTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZVtPcC5hbGxdKSB7XG4gICAgICAgIGVzY2FwZU9wdGlvbnMuaXNMaXN0ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2pvaW5LZXlWYWx1ZShrZXksIGAoJHt0aGlzLmVzY2FwZSh2YWx1ZVtPcC5hbGxdLCBmaWVsZCwgZXNjYXBlT3B0aW9ucyl9KWAsIGAke2NvbXBhcmF0b3J9ICR7dGhpcy5PcGVyYXRvck1hcFtPcC5hbGxdfWAsIG9wdGlvbnMucHJlZml4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodmFsdWUgPT09IG51bGwgJiYgY29tcGFyYXRvciA9PT0gdGhpcy5PcGVyYXRvck1hcFtPcC5lcV0pIHtcbiAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCB0aGlzLmVzY2FwZSh2YWx1ZSwgZmllbGQsIGVzY2FwZU9wdGlvbnMpLCB0aGlzLk9wZXJhdG9yTWFwW09wLmlzXSwgb3B0aW9ucy5wcmVmaXgpO1xuICAgIH1cbiAgICBpZiAodmFsdWUgPT09IG51bGwgJiYgY29tcGFyYXRvciA9PT0gdGhpcy5PcGVyYXRvck1hcFtPcC5uZV0pIHtcbiAgICAgIHJldHVybiB0aGlzLl9qb2luS2V5VmFsdWUoa2V5LCB0aGlzLmVzY2FwZSh2YWx1ZSwgZmllbGQsIGVzY2FwZU9wdGlvbnMpLCB0aGlzLk9wZXJhdG9yTWFwW09wLm5vdF0sIG9wdGlvbnMucHJlZml4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fam9pbktleVZhbHVlKGtleSwgdGhpcy5lc2NhcGUodmFsdWUsIGZpZWxkLCBlc2NhcGVPcHRpb25zKSwgY29tcGFyYXRvciwgb3B0aW9ucy5wcmVmaXgpO1xuICB9XG5cbiAgLypcbiAgICBUYWtlcyBzb21ldGhpbmcgYW5kIHRyYW5zZm9ybXMgaXQgaW50byB2YWx1ZXMgb2YgYSB3aGVyZSBjb25kaXRpb24uXG4gICBAcHJpdmF0ZVxuICAqL1xuICBnZXRXaGVyZUNvbmRpdGlvbnMoc210aCwgdGFibGVOYW1lLCBmYWN0b3J5LCBvcHRpb25zLCBwcmVwZW5kKSB7XG4gICAgY29uc3Qgd2hlcmUgPSB7fTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KHRhYmxlTmFtZSkpIHtcbiAgICAgIHRhYmxlTmFtZSA9IHRhYmxlTmFtZVswXTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHRhYmxlTmFtZSkpIHtcbiAgICAgICAgdGFibGVOYW1lID0gdGFibGVOYW1lWzFdO1xuICAgICAgfVxuICAgIH1cblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKHByZXBlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJlcGVuZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHNtdGggJiYgc210aCBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCkgeyAvLyBDaGVja2luZyBhIHByb3BlcnR5IGlzIGNoZWFwZXIgdGhhbiBhIGxvdCBvZiBpbnN0YW5jZW9mIGNhbGxzXG4gICAgICByZXR1cm4gdGhpcy5oYW5kbGVTZXF1ZWxpemVNZXRob2Qoc210aCwgdGFibGVOYW1lLCBmYWN0b3J5LCBvcHRpb25zLCBwcmVwZW5kKTtcbiAgICB9XG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdChzbXRoKSkge1xuICAgICAgcmV0dXJuIHRoaXMud2hlcmVJdGVtc1F1ZXJ5KHNtdGgsIHtcbiAgICAgICAgbW9kZWw6IGZhY3RvcnksXG4gICAgICAgIHByZWZpeDogcHJlcGVuZCAmJiB0YWJsZU5hbWUsXG4gICAgICAgIHR5cGU6IG9wdGlvbnMudHlwZVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc210aCA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxldCBwcmltYXJ5S2V5cyA9IGZhY3RvcnkgPyBPYmplY3Qua2V5cyhmYWN0b3J5LnByaW1hcnlLZXlzKSA6IFtdO1xuXG4gICAgICBpZiAocHJpbWFyeUtleXMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBTaW5jZSB3ZSdyZSBqdXN0IGEgbnVtYmVyLCBhc3N1bWUgb25seSB0aGUgZmlyc3Qga2V5XG4gICAgICAgIHByaW1hcnlLZXlzID0gcHJpbWFyeUtleXNbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmltYXJ5S2V5cyA9ICdpZCc7XG4gICAgICB9XG5cbiAgICAgIHdoZXJlW3ByaW1hcnlLZXlzXSA9IHNtdGg7XG5cbiAgICAgIHJldHVybiB0aGlzLndoZXJlSXRlbXNRdWVyeSh3aGVyZSwge1xuICAgICAgICBtb2RlbDogZmFjdG9yeSxcbiAgICAgICAgcHJlZml4OiBwcmVwZW5kICYmIHRhYmxlTmFtZVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc210aCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLndoZXJlSXRlbXNRdWVyeShzbXRoLCB7XG4gICAgICAgIG1vZGVsOiBmYWN0b3J5LFxuICAgICAgICBwcmVmaXg6IHByZXBlbmQgJiYgdGFibGVOYW1lXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzbXRoKSkge1xuICAgICAgcmV0dXJuIHRoaXMuZXNjYXBlKHNtdGgpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShzbXRoKSkge1xuICAgICAgaWYgKHNtdGgubGVuZ3RoID09PSAwIHx8IHNtdGgubGVuZ3RoID4gMCAmJiBzbXRoWzBdLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcxPTEnO1xuICAgICAgaWYgKFV0aWxzLmNhblRyZWF0QXJyYXlBc0FuZChzbXRoKSkge1xuICAgICAgICBjb25zdCBfc210aCA9IHsgW09wLmFuZF06IHNtdGggfTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0V2hlcmVDb25kaXRpb25zKF9zbXRoLCB0YWJsZU5hbWUsIGZhY3RvcnksIG9wdGlvbnMsIHByZXBlbmQpO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdXBwb3J0IGZvciBsaXRlcmFsIHJlcGxhY2VtZW50cyBpbiB0aGUgYHdoZXJlYCBvYmplY3QgaGFzIGJlZW4gcmVtb3ZlZC4nKTtcbiAgICB9XG4gICAgaWYgKHNtdGggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLndoZXJlSXRlbXNRdWVyeShzbXRoLCB7XG4gICAgICAgIG1vZGVsOiBmYWN0b3J5LFxuICAgICAgICBwcmVmaXg6IHByZXBlbmQgJiYgdGFibGVOYW1lXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gJzE9MSc7XG4gIH1cblxuICAvLyBBIHJlY3Vyc2l2ZSBwYXJzZXIgZm9yIG5lc3RlZCB3aGVyZSBjb25kaXRpb25zXG4gIHBhcnNlQ29uZGl0aW9uT2JqZWN0KGNvbmRpdGlvbnMsIHBhdGgpIHtcbiAgICBwYXRoID0gcGF0aCB8fCBbXTtcbiAgICByZXR1cm4gXy5yZWR1Y2UoY29uZGl0aW9ucywgKHJlc3VsdCwgdmFsdWUsIGtleSkgPT4ge1xuICAgICAgaWYgKF8uaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQuY29uY2F0KHRoaXMucGFyc2VDb25kaXRpb25PYmplY3QodmFsdWUsIHBhdGguY29uY2F0KGtleSkpKTsgLy8gUmVjdXJzaXZlbHkgcGFyc2Ugb2JqZWN0c1xuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goeyBwYXRoOiBwYXRoLmNvbmNhdChrZXkpLCB2YWx1ZSB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSwgW10pO1xuICB9XG5cbiAgYm9vbGVhblZhbHVlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG5cbk9iamVjdC5hc3NpZ24oUXVlcnlHZW5lcmF0b3IucHJvdG90eXBlLCByZXF1aXJlKCcuL3F1ZXJ5LWdlbmVyYXRvci9vcGVyYXRvcnMnKSk7XG5PYmplY3QuYXNzaWduKFF1ZXJ5R2VuZXJhdG9yLnByb3RvdHlwZSwgcmVxdWlyZSgnLi9xdWVyeS1nZW5lcmF0b3IvdHJhbnNhY3Rpb24nKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlcnlHZW5lcmF0b3I7XG4iXX0=