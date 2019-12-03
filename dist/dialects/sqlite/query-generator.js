'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const Utils = require('../../utils');

const Transaction = require('../../transaction');

const _ = require('lodash');

const MySqlQueryGenerator = require('../mysql/query-generator');

const AbstractQueryGenerator = require('../abstract/query-generator');

let SQLiteQueryGenerator =
/*#__PURE__*/
function (_MySqlQueryGenerator) {
  _inherits(SQLiteQueryGenerator, _MySqlQueryGenerator);

  function SQLiteQueryGenerator() {
    _classCallCheck(this, SQLiteQueryGenerator);

    return _possibleConstructorReturn(this, _getPrototypeOf(SQLiteQueryGenerator).apply(this, arguments));
  }

  _createClass(SQLiteQueryGenerator, [{
    key: "createSchema",
    value: function createSchema() {
      return "SELECT name FROM `sqlite_master` WHERE type='table' and name!='sqlite_sequence';";
    }
  }, {
    key: "showSchemasQuery",
    value: function showSchemasQuery() {
      return "SELECT name FROM `sqlite_master` WHERE type='table' and name!='sqlite_sequence';";
    }
  }, {
    key: "versionQuery",
    value: function versionQuery() {
      return 'SELECT sqlite_version() as `version`';
    }
  }, {
    key: "createTableQuery",
    value: function createTableQuery(tableName, attributes, options) {
      options = options || {};
      const primaryKeys = [];
      const needsMultiplePrimaryKeys = _.values(attributes).filter(definition => definition.includes('PRIMARY KEY')).length > 1;
      const attrArray = [];

      for (const attr in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, attr)) {
          const dataType = attributes[attr];
          const containsAutoIncrement = dataType.includes('AUTOINCREMENT');
          let dataTypeString = dataType;

          if (dataType.includes('PRIMARY KEY')) {
            if (dataType.includes('INT')) {
              // Only INTEGER is allowed for primary key, see https://github.com/sequelize/sequelize/issues/969 (no lenght, unsigned etc)
              dataTypeString = containsAutoIncrement ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INTEGER PRIMARY KEY';

              if (dataType.includes(' REFERENCES')) {
                dataTypeString += dataType.substr(dataType.indexOf(' REFERENCES'));
              }
            }

            if (needsMultiplePrimaryKeys) {
              primaryKeys.push(attr);
              dataTypeString = dataType.replace('PRIMARY KEY', 'NOT NULL');
            }
          }

          attrArray.push(`${this.quoteIdentifier(attr)} ${dataTypeString}`);
        }
      }

      const table = this.quoteTable(tableName);
      let attrStr = attrArray.join(', ');
      const pkString = primaryKeys.map(pk => this.quoteIdentifier(pk)).join(', ');

      if (options.uniqueKeys) {
        _.each(options.uniqueKeys, columns => {
          if (columns.customIndex) {
            attrStr += `, UNIQUE (${columns.fields.map(field => this.quoteIdentifier(field)).join(', ')})`;
          }
        });
      }

      if (pkString.length > 0) {
        attrStr += `, PRIMARY KEY (${pkString})`;
      }

      const sql = `CREATE TABLE IF NOT EXISTS ${table} (${attrStr});`;
      return this.replaceBooleanDefaults(sql);
    }
  }, {
    key: "booleanValue",
    value: function booleanValue(value) {
      return value ? 1 : 0;
    }
    /**
     * Check whether the statmement is json function or simple path
     *
     * @param   {string}  stmt  The statement to validate
     * @returns {boolean}       true if the given statement is json function
     * @throws  {Error}         throw if the statement looks like json function but has invalid token
     */

  }, {
    key: "_checkValidJsonStatement",
    value: function _checkValidJsonStatement(stmt) {
      if (typeof stmt !== 'string') {
        return false;
      } // https://sqlite.org/json1.html


      const jsonFunctionRegex = /^\s*(json(?:_[a-z]+){0,2})\([^)]*\)/i;
      const tokenCaptureRegex = /^\s*((?:([`"'])(?:(?!\2).|\2{2})*\2)|[\w\d\s]+|[().,;+-])/i;
      let currentIndex = 0;
      let openingBrackets = 0;
      let closingBrackets = 0;
      let hasJsonFunction = false;
      let hasInvalidToken = false;

      while (currentIndex < stmt.length) {
        const string = stmt.substr(currentIndex);
        const functionMatches = jsonFunctionRegex.exec(string);

        if (functionMatches) {
          currentIndex += functionMatches[0].indexOf('(');
          hasJsonFunction = true;
          continue;
        }

        const tokenMatches = tokenCaptureRegex.exec(string);

        if (tokenMatches) {
          const capturedToken = tokenMatches[1];

          if (capturedToken === '(') {
            openingBrackets++;
          } else if (capturedToken === ')') {
            closingBrackets++;
          } else if (capturedToken === ';') {
            hasInvalidToken = true;
            break;
          }

          currentIndex += tokenMatches[0].length;
          continue;
        }

        break;
      } // Check invalid json statement


      hasInvalidToken |= openingBrackets !== closingBrackets;

      if (hasJsonFunction && hasInvalidToken) {
        throw new Error(`Invalid json statement: ${stmt}`);
      } // return true if the statement has valid json function


      return hasJsonFunction;
    } //sqlite can't cast to datetime so we need to convert date values to their ISO strings

  }, {
    key: "_toJSONValue",
    value: function _toJSONValue(value) {
      if (value instanceof Date) {
        return value.toISOString();
      }

      if (Array.isArray(value) && value[0] instanceof Date) {
        return value.map(val => val.toISOString());
      }

      return value;
    }
  }, {
    key: "handleSequelizeMethod",
    value: function handleSequelizeMethod(smth, tableName, factory, options, prepend) {
      if (smth instanceof Utils.Json) {
        return _get(_getPrototypeOf(SQLiteQueryGenerator.prototype), "handleSequelizeMethod", this).call(this, smth, tableName, factory, options, prepend);
      }

      if (smth instanceof Utils.Cast) {
        if (/timestamp/i.test(smth.type)) {
          smth.type = 'datetime';
        }
      }

      return AbstractQueryGenerator.prototype.handleSequelizeMethod.call(this, smth, tableName, factory, options, prepend);
    }
  }, {
    key: "addColumnQuery",
    value: function addColumnQuery(table, key, dataType) {
      const attributes = {};
      attributes[key] = dataType;
      const fields = this.attributesToSQL(attributes, {
        context: 'addColumn'
      });
      const attribute = `${this.quoteIdentifier(key)} ${fields[key]}`;
      const sql = `ALTER TABLE ${this.quoteTable(table)} ADD ${attribute};`;
      return this.replaceBooleanDefaults(sql);
    }
  }, {
    key: "showTablesQuery",
    value: function showTablesQuery() {
      return 'SELECT name FROM `sqlite_master` WHERE type=\'table\' and name!=\'sqlite_sequence\';';
    }
  }, {
    key: "upsertQuery",
    value: function upsertQuery(tableName, insertValues, updateValues, where, model, options) {
      options.ignoreDuplicates = true;
      const bind = [];
      const bindParam = this.bindParam(bind);

      const upsertOptions = _.defaults({
        bindParam
      }, options);

      const insert = this.insertQuery(tableName, insertValues, model.rawAttributes, upsertOptions);
      const update = this.updateQuery(tableName, updateValues, where, upsertOptions, model.rawAttributes);
      const query = `${insert.query} ${update.query}`;
      return {
        query,
        bind
      };
    }
  }, {
    key: "updateQuery",
    value: function updateQuery(tableName, attrValueHash, where, options, attributes) {
      options = options || {};

      _.defaults(options, this.options);

      attrValueHash = Utils.removeNullValuesFromHash(attrValueHash, options.omitNull, options);
      const modelAttributeMap = {};
      const values = [];
      const bind = [];
      const bindParam = options.bindParam || this.bindParam(bind);

      if (attributes) {
        _.each(attributes, (attribute, key) => {
          modelAttributeMap[key] = attribute;

          if (attribute.field) {
            modelAttributeMap[attribute.field] = attribute;
          }
        });
      }

      for (const key in attrValueHash) {
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

      let query;

      const whereOptions = _.defaults({
        bindParam
      }, options);

      if (options.limit) {
        query = `UPDATE ${this.quoteTable(tableName)} SET ${values.join(',')} WHERE rowid IN (SELECT rowid FROM ${this.quoteTable(tableName)} ${this.whereQuery(where, whereOptions)} LIMIT ${this.escape(options.limit)})`;
      } else {
        query = `UPDATE ${this.quoteTable(tableName)} SET ${values.join(',')} ${this.whereQuery(where, whereOptions)}`;
      }

      return {
        query,
        bind
      };
    }
  }, {
    key: "truncateTableQuery",
    value: function truncateTableQuery(tableName, options = {}) {
      return [`DELETE FROM ${this.quoteTable(tableName)}`, options.restartIdentity ? `; DELETE FROM ${this.quoteTable('sqlite_sequence')} WHERE ${this.quoteIdentifier('name')} = ${Utils.addTicks(Utils.removeTicks(this.quoteTable(tableName), '`'), "'")};` : ''].join('');
    }
  }, {
    key: "deleteQuery",
    value: function deleteQuery(tableName, where, options = {}, model) {
      _.defaults(options, this.options);

      let whereClause = this.getWhereConditions(where, null, model, options);

      if (whereClause) {
        whereClause = `WHERE ${whereClause}`;
      }

      if (options.limit) {
        whereClause = `WHERE rowid IN (SELECT rowid FROM ${this.quoteTable(tableName)} ${whereClause} LIMIT ${this.escape(options.limit)})`;
      }

      return `DELETE FROM ${this.quoteTable(tableName)} ${whereClause}`;
    }
  }, {
    key: "attributesToSQL",
    value: function attributesToSQL(attributes) {
      const result = {};

      for (const name in attributes) {
        const dataType = attributes[name];
        const fieldName = dataType.field || name;

        if (_.isObject(dataType)) {
          let sql = dataType.type.toString();

          if (Object.prototype.hasOwnProperty.call(dataType, 'allowNull') && !dataType.allowNull) {
            sql += ' NOT NULL';
          }

          if (Utils.defaultValueSchemable(dataType.defaultValue)) {
            // TODO thoroughly check that DataTypes.NOW will properly
            // get populated on all databases as DEFAULT value
            // i.e. mysql requires: DEFAULT CURRENT_TIMESTAMP
            sql += ` DEFAULT ${this.escape(dataType.defaultValue, dataType)}`;
          }

          if (dataType.unique === true) {
            sql += ' UNIQUE';
          }

          if (dataType.primaryKey) {
            sql += ' PRIMARY KEY';

            if (dataType.autoIncrement) {
              sql += ' AUTOINCREMENT';
            }
          }

          if (dataType.references) {
            const referencesTable = this.quoteTable(dataType.references.model);
            let referencesKey;

            if (dataType.references.key) {
              referencesKey = this.quoteIdentifier(dataType.references.key);
            } else {
              referencesKey = this.quoteIdentifier('id');
            }

            sql += ` REFERENCES ${referencesTable} (${referencesKey})`;

            if (dataType.onDelete) {
              sql += ` ON DELETE ${dataType.onDelete.toUpperCase()}`;
            }

            if (dataType.onUpdate) {
              sql += ` ON UPDATE ${dataType.onUpdate.toUpperCase()}`;
            }
          }

          result[fieldName] = sql;
        } else {
          result[fieldName] = dataType;
        }
      }

      return result;
    }
  }, {
    key: "showIndexesQuery",
    value: function showIndexesQuery(tableName) {
      return `PRAGMA INDEX_LIST(${this.quoteTable(tableName)})`;
    }
  }, {
    key: "showConstraintsQuery",
    value: function showConstraintsQuery(tableName, constraintName) {
      let sql = `SELECT sql FROM sqlite_master WHERE tbl_name='${tableName}'`;

      if (constraintName) {
        sql += ` AND sql LIKE '%${constraintName}%'`;
      }

      return `${sql};`;
    }
  }, {
    key: "removeIndexQuery",
    value: function removeIndexQuery(tableName, indexNameOrAttributes) {
      let indexName = indexNameOrAttributes;

      if (typeof indexName !== 'string') {
        indexName = Utils.underscore(`${tableName}_${indexNameOrAttributes.join('_')}`);
      }

      return `DROP INDEX IF EXISTS ${this.quoteIdentifier(indexName)}`;
    }
  }, {
    key: "describeTableQuery",
    value: function describeTableQuery(tableName, schema, schemaDelimiter) {
      const table = {
        _schema: schema,
        _schemaDelimiter: schemaDelimiter,
        tableName
      };
      return `PRAGMA TABLE_INFO(${this.quoteTable(this.addSchema(table))});`;
    }
  }, {
    key: "describeCreateTableQuery",
    value: function describeCreateTableQuery(tableName) {
      return `SELECT sql FROM sqlite_master WHERE tbl_name='${tableName}';`;
    }
  }, {
    key: "removeColumnQuery",
    value: function removeColumnQuery(tableName, attributes) {
      attributes = this.attributesToSQL(attributes);
      let backupTableName;

      if (typeof tableName === 'object') {
        backupTableName = {
          tableName: `${tableName.tableName}_backup`,
          schema: tableName.schema
        };
      } else {
        backupTableName = `${tableName}_backup`;
      }

      const quotedTableName = this.quoteTable(tableName);
      const quotedBackupTableName = this.quoteTable(backupTableName);
      const attributeNames = Object.keys(attributes).map(attr => this.quoteIdentifier(attr)).join(', '); // Temporary table cannot work for foreign keys.

      return `${this.createTableQuery(backupTableName, attributes)}INSERT INTO ${quotedBackupTableName} SELECT ${attributeNames} FROM ${quotedTableName};` + `DROP TABLE ${quotedTableName};${this.createTableQuery(tableName, attributes)}INSERT INTO ${quotedTableName} SELECT ${attributeNames} FROM ${quotedBackupTableName};` + `DROP TABLE ${quotedBackupTableName};`;
    }
  }, {
    key: "_alterConstraintQuery",
    value: function _alterConstraintQuery(tableName, attributes, createTableSql) {
      let backupTableName;
      attributes = this.attributesToSQL(attributes);

      if (typeof tableName === 'object') {
        backupTableName = {
          tableName: `${tableName.tableName}_backup`,
          schema: tableName.schema
        };
      } else {
        backupTableName = `${tableName}_backup`;
      }

      const quotedTableName = this.quoteTable(tableName);
      const quotedBackupTableName = this.quoteTable(backupTableName);
      const attributeNames = Object.keys(attributes).map(attr => this.quoteIdentifier(attr)).join(', ');
      return `${createTableSql.replace(`CREATE TABLE ${quotedTableName}`, `CREATE TABLE ${quotedBackupTableName}`).replace(`CREATE TABLE ${quotedTableName.replace(/`/g, '"')}`, `CREATE TABLE ${quotedBackupTableName}`)}INSERT INTO ${quotedBackupTableName} SELECT ${attributeNames} FROM ${quotedTableName};` + `DROP TABLE ${quotedTableName};` + `ALTER TABLE ${quotedBackupTableName} RENAME TO ${quotedTableName};`;
    }
  }, {
    key: "renameColumnQuery",
    value: function renameColumnQuery(tableName, attrNameBefore, attrNameAfter, attributes) {
      let backupTableName;
      attributes = this.attributesToSQL(attributes);

      if (typeof tableName === 'object') {
        backupTableName = {
          tableName: `${tableName.tableName}_backup`,
          schema: tableName.schema
        };
      } else {
        backupTableName = `${tableName}_backup`;
      }

      const quotedTableName = this.quoteTable(tableName);
      const quotedBackupTableName = this.quoteTable(backupTableName);
      const attributeNamesImport = Object.keys(attributes).map(attr => attrNameAfter === attr ? `${this.quoteIdentifier(attrNameBefore)} AS ${this.quoteIdentifier(attr)}` : this.quoteIdentifier(attr)).join(', ');
      const attributeNamesExport = Object.keys(attributes).map(attr => this.quoteIdentifier(attr)).join(', ');
      return `${this.createTableQuery(backupTableName, attributes).replace('CREATE TABLE', 'CREATE TEMPORARY TABLE')}INSERT INTO ${quotedBackupTableName} SELECT ${attributeNamesImport} FROM ${quotedTableName};` + `DROP TABLE ${quotedTableName};${this.createTableQuery(tableName, attributes)}INSERT INTO ${quotedTableName} SELECT ${attributeNamesExport} FROM ${quotedBackupTableName};` + `DROP TABLE ${quotedBackupTableName};`;
    }
  }, {
    key: "startTransactionQuery",
    value: function startTransactionQuery(transaction) {
      if (transaction.parent) {
        return `SAVEPOINT ${this.quoteIdentifier(transaction.name)};`;
      }

      return `BEGIN ${transaction.options.type} TRANSACTION;`;
    }
  }, {
    key: "setIsolationLevelQuery",
    value: function setIsolationLevelQuery(value) {
      switch (value) {
        case Transaction.ISOLATION_LEVELS.REPEATABLE_READ:
          return '-- SQLite is not able to choose the isolation level REPEATABLE READ.';

        case Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED:
          return 'PRAGMA read_uncommitted = ON;';

        case Transaction.ISOLATION_LEVELS.READ_COMMITTED:
          return 'PRAGMA read_uncommitted = OFF;';

        case Transaction.ISOLATION_LEVELS.SERIALIZABLE:
          return '-- SQLite\'s default isolation level is SERIALIZABLE. Nothing to do.';

        default:
          throw new Error(`Unknown isolation level: ${value}`);
      }
    }
  }, {
    key: "replaceBooleanDefaults",
    value: function replaceBooleanDefaults(sql) {
      return sql.replace(/DEFAULT '?false'?/g, 'DEFAULT 0').replace(/DEFAULT '?true'?/g, 'DEFAULT 1');
    }
    /**
     * Generates an SQL query that returns all foreign keys of a table.
     *
     * @param  {string} tableName  The name of the table.
     * @returns {string}            The generated sql query.
     * @private
     */

  }, {
    key: "getForeignKeysQuery",
    value: function getForeignKeysQuery(tableName) {
      return `PRAGMA foreign_key_list(${tableName})`;
    }
  }]);

  return SQLiteQueryGenerator;
}(MySqlQueryGenerator);

module.exports = SQLiteQueryGenerator;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvcXVlcnktZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIlV0aWxzIiwicmVxdWlyZSIsIlRyYW5zYWN0aW9uIiwiXyIsIk15U3FsUXVlcnlHZW5lcmF0b3IiLCJBYnN0cmFjdFF1ZXJ5R2VuZXJhdG9yIiwiU1FMaXRlUXVlcnlHZW5lcmF0b3IiLCJ0YWJsZU5hbWUiLCJhdHRyaWJ1dGVzIiwib3B0aW9ucyIsInByaW1hcnlLZXlzIiwibmVlZHNNdWx0aXBsZVByaW1hcnlLZXlzIiwidmFsdWVzIiwiZmlsdGVyIiwiZGVmaW5pdGlvbiIsImluY2x1ZGVzIiwibGVuZ3RoIiwiYXR0ckFycmF5IiwiYXR0ciIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImRhdGFUeXBlIiwiY29udGFpbnNBdXRvSW5jcmVtZW50IiwiZGF0YVR5cGVTdHJpbmciLCJzdWJzdHIiLCJpbmRleE9mIiwicHVzaCIsInJlcGxhY2UiLCJxdW90ZUlkZW50aWZpZXIiLCJ0YWJsZSIsInF1b3RlVGFibGUiLCJhdHRyU3RyIiwiam9pbiIsInBrU3RyaW5nIiwibWFwIiwicGsiLCJ1bmlxdWVLZXlzIiwiZWFjaCIsImNvbHVtbnMiLCJjdXN0b21JbmRleCIsImZpZWxkcyIsImZpZWxkIiwic3FsIiwicmVwbGFjZUJvb2xlYW5EZWZhdWx0cyIsInZhbHVlIiwic3RtdCIsImpzb25GdW5jdGlvblJlZ2V4IiwidG9rZW5DYXB0dXJlUmVnZXgiLCJjdXJyZW50SW5kZXgiLCJvcGVuaW5nQnJhY2tldHMiLCJjbG9zaW5nQnJhY2tldHMiLCJoYXNKc29uRnVuY3Rpb24iLCJoYXNJbnZhbGlkVG9rZW4iLCJzdHJpbmciLCJmdW5jdGlvbk1hdGNoZXMiLCJleGVjIiwidG9rZW5NYXRjaGVzIiwiY2FwdHVyZWRUb2tlbiIsIkVycm9yIiwiRGF0ZSIsInRvSVNPU3RyaW5nIiwiQXJyYXkiLCJpc0FycmF5IiwidmFsIiwic210aCIsImZhY3RvcnkiLCJwcmVwZW5kIiwiSnNvbiIsIkNhc3QiLCJ0ZXN0IiwidHlwZSIsImhhbmRsZVNlcXVlbGl6ZU1ldGhvZCIsImtleSIsImF0dHJpYnV0ZXNUb1NRTCIsImNvbnRleHQiLCJhdHRyaWJ1dGUiLCJpbnNlcnRWYWx1ZXMiLCJ1cGRhdGVWYWx1ZXMiLCJ3aGVyZSIsIm1vZGVsIiwiaWdub3JlRHVwbGljYXRlcyIsImJpbmQiLCJiaW5kUGFyYW0iLCJ1cHNlcnRPcHRpb25zIiwiZGVmYXVsdHMiLCJpbnNlcnQiLCJpbnNlcnRRdWVyeSIsInJhd0F0dHJpYnV0ZXMiLCJ1cGRhdGUiLCJ1cGRhdGVRdWVyeSIsInF1ZXJ5IiwiYXR0clZhbHVlSGFzaCIsInJlbW92ZU51bGxWYWx1ZXNGcm9tSGFzaCIsIm9taXROdWxsIiwibW9kZWxBdHRyaWJ1dGVNYXAiLCJTZXF1ZWxpemVNZXRob2QiLCJlc2NhcGUiLCJ1bmRlZmluZWQiLCJmb3JtYXQiLCJ3aGVyZU9wdGlvbnMiLCJsaW1pdCIsIndoZXJlUXVlcnkiLCJyZXN0YXJ0SWRlbnRpdHkiLCJhZGRUaWNrcyIsInJlbW92ZVRpY2tzIiwid2hlcmVDbGF1c2UiLCJnZXRXaGVyZUNvbmRpdGlvbnMiLCJyZXN1bHQiLCJuYW1lIiwiZmllbGROYW1lIiwiaXNPYmplY3QiLCJ0b1N0cmluZyIsImFsbG93TnVsbCIsImRlZmF1bHRWYWx1ZVNjaGVtYWJsZSIsImRlZmF1bHRWYWx1ZSIsInVuaXF1ZSIsInByaW1hcnlLZXkiLCJhdXRvSW5jcmVtZW50IiwicmVmZXJlbmNlcyIsInJlZmVyZW5jZXNUYWJsZSIsInJlZmVyZW5jZXNLZXkiLCJvbkRlbGV0ZSIsInRvVXBwZXJDYXNlIiwib25VcGRhdGUiLCJjb25zdHJhaW50TmFtZSIsImluZGV4TmFtZU9yQXR0cmlidXRlcyIsImluZGV4TmFtZSIsInVuZGVyc2NvcmUiLCJzY2hlbWEiLCJzY2hlbWFEZWxpbWl0ZXIiLCJfc2NoZW1hIiwiX3NjaGVtYURlbGltaXRlciIsImFkZFNjaGVtYSIsImJhY2t1cFRhYmxlTmFtZSIsInF1b3RlZFRhYmxlTmFtZSIsInF1b3RlZEJhY2t1cFRhYmxlTmFtZSIsImF0dHJpYnV0ZU5hbWVzIiwia2V5cyIsImNyZWF0ZVRhYmxlUXVlcnkiLCJjcmVhdGVUYWJsZVNxbCIsImF0dHJOYW1lQmVmb3JlIiwiYXR0ck5hbWVBZnRlciIsImF0dHJpYnV0ZU5hbWVzSW1wb3J0IiwiYXR0cmlidXRlTmFtZXNFeHBvcnQiLCJ0cmFuc2FjdGlvbiIsInBhcmVudCIsIklTT0xBVElPTl9MRVZFTFMiLCJSRVBFQVRBQkxFX1JFQUQiLCJSRUFEX1VOQ09NTUlUVEVEIiwiUkVBRF9DT01NSVRURUQiLCJTRVJJQUxJWkFCTEUiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLEtBQUssR0FBR0MsT0FBTyxDQUFDLGFBQUQsQ0FBckI7O0FBQ0EsTUFBTUMsV0FBVyxHQUFHRCxPQUFPLENBQUMsbUJBQUQsQ0FBM0I7O0FBQ0EsTUFBTUUsQ0FBQyxHQUFHRixPQUFPLENBQUMsUUFBRCxDQUFqQjs7QUFDQSxNQUFNRyxtQkFBbUIsR0FBR0gsT0FBTyxDQUFDLDBCQUFELENBQW5DOztBQUNBLE1BQU1JLHNCQUFzQixHQUFHSixPQUFPLENBQUMsNkJBQUQsQ0FBdEM7O0lBRU1LLG9COzs7Ozs7Ozs7Ozs7O21DQUNXO0FBQ2IsYUFBTyxrRkFBUDtBQUNEOzs7dUNBRWtCO0FBQ2pCLGFBQU8sa0ZBQVA7QUFDRDs7O21DQUVjO0FBQ2IsYUFBTyxzQ0FBUDtBQUNEOzs7cUNBRWdCQyxTLEVBQVdDLFUsRUFBWUMsTyxFQUFTO0FBQy9DQSxNQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjtBQUVBLFlBQU1DLFdBQVcsR0FBRyxFQUFwQjtBQUNBLFlBQU1DLHdCQUF3QixHQUFHUixDQUFDLENBQUNTLE1BQUYsQ0FBU0osVUFBVCxFQUFxQkssTUFBckIsQ0FBNEJDLFVBQVUsSUFBSUEsVUFBVSxDQUFDQyxRQUFYLENB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LGFBQVEsMkJBQTBCQSxTQUFVLEdBQTVDO0FBQ0Q7Ozs7RUFwZGdDSCxtQjs7QUF1ZG5DcUosTUFBTSxDQUFDQyxPQUFQLEdBQWlCcEosb0JBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscycpO1xyXG5jb25zdCBUcmFuc2FjdGlvbiA9IHJlcXVpcmUoJy4uLy4uL3RyYW5zYWN0aW9uJyk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuY29uc3QgTXlTcWxRdWVyeUdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL215c3FsL3F1ZXJ5LWdlbmVyYXRvcicpO1xyXG5jb25zdCBBYnN0cmFjdFF1ZXJ5R2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vYWJzdHJhY3QvcXVlcnktZ2VuZXJhdG9yJyk7XHJcblxyXG5jbGFzcyBTUUxpdGVRdWVyeUdlbmVyYXRvciBleHRlbmRzIE15U3FsUXVlcnlHZW5lcmF0b3Ige1xyXG4gIGNyZWF0ZVNjaGVtYSgpIHtcclxuICAgIHJldHVybiBcIlNFTEVDVCBuYW1lIEZST00gYHNxbGl0ZV9tYXN0ZXJgIFdIRVJFIHR5cGU9J3RhYmxlJyBhbmQgbmFtZSE9J3NxbGl0ZV9zZXF1ZW5jZSc7XCI7XHJcbiAgfVxyXG5cclxuICBzaG93U2NoZW1hc1F1ZXJ5KCkge1xyXG4gICAgcmV0dXJuIFwiU0VMRUNUIG5hbWUgRlJPTSBgc3FsaXRlX21hc3RlcmAgV0hFUkUgdHlwZT0ndGFibGUnIGFuZCBuYW1lIT0nc3FsaXRlX3NlcXVlbmNlJztcIjtcclxuICB9XHJcblxyXG4gIHZlcnNpb25RdWVyeSgpIHtcclxuICAgIHJldHVybiAnU0VMRUNUIHNxbGl0ZV92ZXJzaW9uKCkgYXMgYHZlcnNpb25gJztcclxuICB9XHJcblxyXG4gIGNyZWF0ZVRhYmxlUXVlcnkodGFibGVOYW1lLCBhdHRyaWJ1dGVzLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICBjb25zdCBwcmltYXJ5S2V5cyA9IFtdO1xyXG4gICAgY29uc3QgbmVlZHNNdWx0aXBsZVByaW1hcnlLZXlzID0gXy52YWx1ZXMoYXR0cmlidXRlcykuZmlsdGVyKGRlZmluaXRpb24gPT4gZGVmaW5pdGlvbi5pbmNsdWRlcygnUFJJTUFSWSBLRVknKSkubGVuZ3RoID4gMTtcclxuICAgIGNvbnN0IGF0dHJBcnJheSA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3QgYXR0ciBpbiBhdHRyaWJ1dGVzKSB7XHJcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXR0cmlidXRlcywgYXR0cikpIHtcclxuICAgICAgICBjb25zdCBkYXRhVHlwZSA9IGF0dHJpYnV0ZXNbYXR0cl07XHJcbiAgICAgICAgY29uc3QgY29udGFpbnNBdXRvSW5jcmVtZW50ID0gZGF0YVR5cGUuaW5jbHVkZXMoJ0FVVE9JTkNSRU1FTlQnKTtcclxuXHJcbiAgICAgICAgbGV0IGRhdGFUeXBlU3RyaW5nID0gZGF0YVR5cGU7XHJcbiAgICAgICAgaWYgKGRhdGFUeXBlLmluY2x1ZGVzKCdQUklNQVJZIEtFWScpKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YVR5cGUuaW5jbHVkZXMoJ0lOVCcpKSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgSU5URUdFUiBpcyBhbGxvd2VkIGZvciBwcmltYXJ5IGtleSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zZXF1ZWxpemUvc2VxdWVsaXplL2lzc3Vlcy85NjkgKG5vIGxlbmdodCwgdW5zaWduZWQgZXRjKVxyXG4gICAgICAgICAgICBkYXRhVHlwZVN0cmluZyA9IGNvbnRhaW5zQXV0b0luY3JlbWVudCA/ICdJTlRFR0VSIFBSSU1BUlkgS0VZIEFVVE9JTkNSRU1FTlQnIDogJ0lOVEVHRVIgUFJJTUFSWSBLRVknO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGFUeXBlLmluY2x1ZGVzKCcgUkVGRVJFTkNFUycpKSB7XHJcbiAgICAgICAgICAgICAgZGF0YVR5cGVTdHJpbmcgKz0gZGF0YVR5cGUuc3Vic3RyKGRhdGFUeXBlLmluZGV4T2YoJyBSRUZFUkVOQ0VTJykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKG5lZWRzTXVsdGlwbGVQcmltYXJ5S2V5cykge1xyXG4gICAgICAgICAgICBwcmltYXJ5S2V5cy5wdXNoKGF0dHIpO1xyXG4gICAgICAgICAgICBkYXRhVHlwZVN0cmluZyA9IGRhdGFUeXBlLnJlcGxhY2UoJ1BSSU1BUlkgS0VZJywgJ05PVCBOVUxMJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF0dHJBcnJheS5wdXNoKGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHIpfSAke2RhdGFUeXBlU3RyaW5nfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdGFibGUgPSB0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKTtcclxuICAgIGxldCBhdHRyU3RyID0gYXR0ckFycmF5LmpvaW4oJywgJyk7XHJcbiAgICBjb25zdCBwa1N0cmluZyA9IHByaW1hcnlLZXlzLm1hcChwayA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihwaykpLmpvaW4oJywgJyk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMudW5pcXVlS2V5cykge1xyXG4gICAgICBfLmVhY2gob3B0aW9ucy51bmlxdWVLZXlzLCBjb2x1bW5zID0+IHtcclxuICAgICAgICBpZiAoY29sdW1ucy5jdXN0b21JbmRleCkge1xyXG4gICAgICAgICAgYXR0clN0ciArPSBgLCBVTklRVUUgKCR7Y29sdW1ucy5maWVsZHMubWFwKGZpZWxkID0+IHRoaXMucXVvdGVJZGVudGlmaWVyKGZpZWxkKSkuam9pbignLCAnKX0pYDtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChwa1N0cmluZy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGF0dHJTdHIgKz0gYCwgUFJJTUFSWSBLRVkgKCR7cGtTdHJpbmd9KWA7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3FsID0gYENSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTICR7dGFibGV9ICgke2F0dHJTdHJ9KTtgO1xyXG4gICAgcmV0dXJuIHRoaXMucmVwbGFjZUJvb2xlYW5EZWZhdWx0cyhzcWwpO1xyXG4gIH1cclxuXHJcbiAgYm9vbGVhblZhbHVlKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgPyAxIDogMDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIHN0YXRtZW1lbnQgaXMganNvbiBmdW5jdGlvbiBvciBzaW1wbGUgcGF0aFxyXG4gICAqXHJcbiAgICogQHBhcmFtICAge3N0cmluZ30gIHN0bXQgIFRoZSBzdGF0ZW1lbnQgdG8gdmFsaWRhdGVcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gICAgICAgdHJ1ZSBpZiB0aGUgZ2l2ZW4gc3RhdGVtZW50IGlzIGpzb24gZnVuY3Rpb25cclxuICAgKiBAdGhyb3dzICB7RXJyb3J9ICAgICAgICAgdGhyb3cgaWYgdGhlIHN0YXRlbWVudCBsb29rcyBsaWtlIGpzb24gZnVuY3Rpb24gYnV0IGhhcyBpbnZhbGlkIHRva2VuXHJcbiAgICovXHJcbiAgX2NoZWNrVmFsaWRKc29uU3RhdGVtZW50KHN0bXQpIHtcclxuICAgIGlmICh0eXBlb2Ygc3RtdCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGh0dHBzOi8vc3FsaXRlLm9yZy9qc29uMS5odG1sXHJcbiAgICBjb25zdCBqc29uRnVuY3Rpb25SZWdleCA9IC9eXFxzKihqc29uKD86X1thLXpdKyl7MCwyfSlcXChbXildKlxcKS9pO1xyXG4gICAgY29uc3QgdG9rZW5DYXB0dXJlUmVnZXggPSAvXlxccyooKD86KFtgXCInXSkoPzooPyFcXDIpLnxcXDJ7Mn0pKlxcMil8W1xcd1xcZFxcc10rfFsoKS4sOystXSkvaTtcclxuXHJcbiAgICBsZXQgY3VycmVudEluZGV4ID0gMDtcclxuICAgIGxldCBvcGVuaW5nQnJhY2tldHMgPSAwO1xyXG4gICAgbGV0IGNsb3NpbmdCcmFja2V0cyA9IDA7XHJcbiAgICBsZXQgaGFzSnNvbkZ1bmN0aW9uID0gZmFsc2U7XHJcbiAgICBsZXQgaGFzSW52YWxpZFRva2VuID0gZmFsc2U7XHJcblxyXG4gICAgd2hpbGUgKGN1cnJlbnRJbmRleCA8IHN0bXQubGVuZ3RoKSB7XHJcbiAgICAgIGNvbnN0IHN0cmluZyA9IHN0bXQuc3Vic3RyKGN1cnJlbnRJbmRleCk7XHJcbiAgICAgIGNvbnN0IGZ1bmN0aW9uTWF0Y2hlcyA9IGpzb25GdW5jdGlvblJlZ2V4LmV4ZWMoc3RyaW5nKTtcclxuICAgICAgaWYgKGZ1bmN0aW9uTWF0Y2hlcykge1xyXG4gICAgICAgIGN1cnJlbnRJbmRleCArPSBmdW5jdGlvbk1hdGNoZXNbMF0uaW5kZXhPZignKCcpO1xyXG4gICAgICAgIGhhc0pzb25GdW5jdGlvbiA9IHRydWU7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHRva2VuTWF0Y2hlcyA9IHRva2VuQ2FwdHVyZVJlZ2V4LmV4ZWMoc3RyaW5nKTtcclxuICAgICAgaWYgKHRva2VuTWF0Y2hlcykge1xyXG4gICAgICAgIGNvbnN0IGNhcHR1cmVkVG9rZW4gPSB0b2tlbk1hdGNoZXNbMV07XHJcbiAgICAgICAgaWYgKGNhcHR1cmVkVG9rZW4gPT09ICcoJykge1xyXG4gICAgICAgICAgb3BlbmluZ0JyYWNrZXRzKys7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjYXB0dXJlZFRva2VuID09PSAnKScpIHtcclxuICAgICAgICAgIGNsb3NpbmdCcmFja2V0cysrO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY2FwdHVyZWRUb2tlbiA9PT0gJzsnKSB7XHJcbiAgICAgICAgICBoYXNJbnZhbGlkVG9rZW4gPSB0cnVlO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN1cnJlbnRJbmRleCArPSB0b2tlbk1hdGNoZXNbMF0ubGVuZ3RoO1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBpbnZhbGlkIGpzb24gc3RhdGVtZW50XHJcbiAgICBoYXNJbnZhbGlkVG9rZW4gfD0gb3BlbmluZ0JyYWNrZXRzICE9PSBjbG9zaW5nQnJhY2tldHM7XHJcbiAgICBpZiAoaGFzSnNvbkZ1bmN0aW9uICYmIGhhc0ludmFsaWRUb2tlbikge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQganNvbiBzdGF0ZW1lbnQ6ICR7c3RtdH1gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyByZXR1cm4gdHJ1ZSBpZiB0aGUgc3RhdGVtZW50IGhhcyB2YWxpZCBqc29uIGZ1bmN0aW9uXHJcbiAgICByZXR1cm4gaGFzSnNvbkZ1bmN0aW9uO1xyXG4gIH1cclxuXHJcbiAgLy9zcWxpdGUgY2FuJ3QgY2FzdCB0byBkYXRldGltZSBzbyB3ZSBuZWVkIHRvIGNvbnZlcnQgZGF0ZSB2YWx1ZXMgdG8gdGhlaXIgSVNPIHN0cmluZ3NcclxuICBfdG9KU09OVmFsdWUodmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcclxuICAgICAgcmV0dXJuIHZhbHVlLnRvSVNPU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWVbMF0gaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgIHJldHVybiB2YWx1ZS5tYXAodmFsID0+IHZhbC50b0lTT1N0cmluZygpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxuICB9XHJcblxyXG5cclxuICBoYW5kbGVTZXF1ZWxpemVNZXRob2Qoc210aCwgdGFibGVOYW1lLCBmYWN0b3J5LCBvcHRpb25zLCBwcmVwZW5kKSB7XHJcbiAgICBpZiAoc210aCBpbnN0YW5jZW9mIFV0aWxzLkpzb24pIHtcclxuICAgICAgcmV0dXJuIHN1cGVyLmhhbmRsZVNlcXVlbGl6ZU1ldGhvZChzbXRoLCB0YWJsZU5hbWUsIGZhY3RvcnksIG9wdGlvbnMsIHByZXBlbmQpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzbXRoIGluc3RhbmNlb2YgVXRpbHMuQ2FzdCkge1xyXG4gICAgICBpZiAoL3RpbWVzdGFtcC9pLnRlc3Qoc210aC50eXBlKSkge1xyXG4gICAgICAgIHNtdGgudHlwZSA9ICdkYXRldGltZSc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gQWJzdHJhY3RRdWVyeUdlbmVyYXRvci5wcm90b3R5cGUuaGFuZGxlU2VxdWVsaXplTWV0aG9kLmNhbGwodGhpcywgc210aCwgdGFibGVOYW1lLCBmYWN0b3J5LCBvcHRpb25zLCBwcmVwZW5kKTtcclxuICB9XHJcblxyXG4gIGFkZENvbHVtblF1ZXJ5KHRhYmxlLCBrZXksIGRhdGFUeXBlKSB7XHJcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0ge307XHJcbiAgICBhdHRyaWJ1dGVzW2tleV0gPSBkYXRhVHlwZTtcclxuICAgIGNvbnN0IGZpZWxkcyA9IHRoaXMuYXR0cmlidXRlc1RvU1FMKGF0dHJpYnV0ZXMsIHsgY29udGV4dDogJ2FkZENvbHVtbicgfSk7XHJcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihrZXkpfSAke2ZpZWxkc1trZXldfWA7XHJcblxyXG4gICAgY29uc3Qgc3FsID0gYEFMVEVSIFRBQkxFICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlKX0gQUREICR7YXR0cmlidXRlfTtgO1xyXG5cclxuICAgIHJldHVybiB0aGlzLnJlcGxhY2VCb29sZWFuRGVmYXVsdHMoc3FsKTtcclxuICB9XHJcblxyXG4gIHNob3dUYWJsZXNRdWVyeSgpIHtcclxuICAgIHJldHVybiAnU0VMRUNUIG5hbWUgRlJPTSBgc3FsaXRlX21hc3RlcmAgV0hFUkUgdHlwZT1cXCd0YWJsZVxcJyBhbmQgbmFtZSE9XFwnc3FsaXRlX3NlcXVlbmNlXFwnOyc7XHJcbiAgfVxyXG5cclxuICB1cHNlcnRRdWVyeSh0YWJsZU5hbWUsIGluc2VydFZhbHVlcywgdXBkYXRlVmFsdWVzLCB3aGVyZSwgbW9kZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMuaWdub3JlRHVwbGljYXRlcyA9IHRydWU7XHJcblxyXG4gICAgY29uc3QgYmluZCA9IFtdO1xyXG4gICAgY29uc3QgYmluZFBhcmFtID0gdGhpcy5iaW5kUGFyYW0oYmluZCk7XHJcblxyXG4gICAgY29uc3QgdXBzZXJ0T3B0aW9ucyA9IF8uZGVmYXVsdHMoeyBiaW5kUGFyYW0gfSwgb3B0aW9ucyk7XHJcbiAgICBjb25zdCBpbnNlcnQgPSB0aGlzLmluc2VydFF1ZXJ5KHRhYmxlTmFtZSwgaW5zZXJ0VmFsdWVzLCBtb2RlbC5yYXdBdHRyaWJ1dGVzLCB1cHNlcnRPcHRpb25zKTtcclxuICAgIGNvbnN0IHVwZGF0ZSA9IHRoaXMudXBkYXRlUXVlcnkodGFibGVOYW1lLCB1cGRhdGVWYWx1ZXMsIHdoZXJlLCB1cHNlcnRPcHRpb25zLCBtb2RlbC5yYXdBdHRyaWJ1dGVzKTtcclxuXHJcbiAgICBjb25zdCBxdWVyeSA9IGAke2luc2VydC5xdWVyeX0gJHt1cGRhdGUucXVlcnl9YDtcclxuXHJcbiAgICByZXR1cm4geyBxdWVyeSwgYmluZCB9O1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlUXVlcnkodGFibGVOYW1lLCBhdHRyVmFsdWVIYXNoLCB3aGVyZSwgb3B0aW9ucywgYXR0cmlidXRlcykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBfLmRlZmF1bHRzKG9wdGlvbnMsIHRoaXMub3B0aW9ucyk7XHJcblxyXG4gICAgYXR0clZhbHVlSGFzaCA9IFV0aWxzLnJlbW92ZU51bGxWYWx1ZXNGcm9tSGFzaChhdHRyVmFsdWVIYXNoLCBvcHRpb25zLm9taXROdWxsLCBvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCBtb2RlbEF0dHJpYnV0ZU1hcCA9IHt9O1xyXG4gICAgY29uc3QgdmFsdWVzID0gW107XHJcbiAgICBjb25zdCBiaW5kID0gW107XHJcbiAgICBjb25zdCBiaW5kUGFyYW0gPSBvcHRpb25zLmJpbmRQYXJhbSB8fCB0aGlzLmJpbmRQYXJhbShiaW5kKTtcclxuXHJcbiAgICBpZiAoYXR0cmlidXRlcykge1xyXG4gICAgICBfLmVhY2goYXR0cmlidXRlcywgKGF0dHJpYnV0ZSwga2V5KSA9PiB7XHJcbiAgICAgICAgbW9kZWxBdHRyaWJ1dGVNYXBba2V5XSA9IGF0dHJpYnV0ZTtcclxuICAgICAgICBpZiAoYXR0cmlidXRlLmZpZWxkKSB7XHJcbiAgICAgICAgICBtb2RlbEF0dHJpYnV0ZU1hcFthdHRyaWJ1dGUuZmllbGRdID0gYXR0cmlidXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0clZhbHVlSGFzaCkge1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJWYWx1ZUhhc2hba2V5XTtcclxuXHJcbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCB8fCBvcHRpb25zLmJpbmRQYXJhbSA9PT0gZmFsc2UpIHtcclxuICAgICAgICB2YWx1ZXMucHVzaChgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihrZXkpfT0ke3RoaXMuZXNjYXBlKHZhbHVlLCBtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldIHx8IHVuZGVmaW5lZCwgeyBjb250ZXh0OiAnVVBEQVRFJyB9KX1gKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YWx1ZXMucHVzaChgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihrZXkpfT0ke3RoaXMuZm9ybWF0KHZhbHVlLCBtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldIHx8IHVuZGVmaW5lZCwgeyBjb250ZXh0OiAnVVBEQVRFJyB9LCBiaW5kUGFyYW0pfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHF1ZXJ5O1xyXG4gICAgY29uc3Qgd2hlcmVPcHRpb25zID0gXy5kZWZhdWx0cyh7IGJpbmRQYXJhbSB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5saW1pdCkge1xyXG4gICAgICBxdWVyeSA9IGBVUERBVEUgJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX0gU0VUICR7dmFsdWVzLmpvaW4oJywnKX0gV0hFUkUgcm93aWQgSU4gKFNFTEVDVCByb3dpZCBGUk9NICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9ICR7dGhpcy53aGVyZVF1ZXJ5KHdoZXJlLCB3aGVyZU9wdGlvbnMpfSBMSU1JVCAke3RoaXMuZXNjYXBlKG9wdGlvbnMubGltaXQpfSlgO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcXVlcnkgPSBgVVBEQVRFICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9IFNFVCAke3ZhbHVlcy5qb2luKCcsJyl9ICR7dGhpcy53aGVyZVF1ZXJ5KHdoZXJlLCB3aGVyZU9wdGlvbnMpfWA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHsgcXVlcnksIGJpbmQgfTtcclxuICB9XHJcblxyXG4gIHRydW5jYXRlVGFibGVRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMgPSB7fSkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgYERFTEVURSBGUk9NICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9YCxcclxuICAgICAgb3B0aW9ucy5yZXN0YXJ0SWRlbnRpdHkgPyBgOyBERUxFVEUgRlJPTSAke3RoaXMucXVvdGVUYWJsZSgnc3FsaXRlX3NlcXVlbmNlJyl9IFdIRVJFICR7dGhpcy5xdW90ZUlkZW50aWZpZXIoJ25hbWUnKX0gPSAke1V0aWxzLmFkZFRpY2tzKFV0aWxzLnJlbW92ZVRpY2tzKHRoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpLCAnYCcpLCBcIidcIil9O2AgOiAnJ1xyXG4gICAgXS5qb2luKCcnKTtcclxuICB9XHJcblxyXG4gIGRlbGV0ZVF1ZXJ5KHRhYmxlTmFtZSwgd2hlcmUsIG9wdGlvbnMgPSB7fSwgbW9kZWwpIHtcclxuICAgIF8uZGVmYXVsdHMob3B0aW9ucywgdGhpcy5vcHRpb25zKTtcclxuXHJcbiAgICBsZXQgd2hlcmVDbGF1c2UgPSB0aGlzLmdldFdoZXJlQ29uZGl0aW9ucyh3aGVyZSwgbnVsbCwgbW9kZWwsIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmICh3aGVyZUNsYXVzZSkge1xyXG4gICAgICB3aGVyZUNsYXVzZSA9IGBXSEVSRSAke3doZXJlQ2xhdXNlfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubGltaXQpIHtcclxuICAgICAgd2hlcmVDbGF1c2UgPSBgV0hFUkUgcm93aWQgSU4gKFNFTEVDVCByb3dpZCBGUk9NICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9ICR7d2hlcmVDbGF1c2V9IExJTUlUICR7dGhpcy5lc2NhcGUob3B0aW9ucy5saW1pdCl9KWA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGBERUxFVEUgRlJPTSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfSAke3doZXJlQ2xhdXNlfWA7XHJcbiAgfVxyXG5cclxuICBhdHRyaWJ1dGVzVG9TUUwoYXR0cmlidXRlcykge1xyXG4gICAgY29uc3QgcmVzdWx0ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBuYW1lIGluIGF0dHJpYnV0ZXMpIHtcclxuICAgICAgY29uc3QgZGF0YVR5cGUgPSBhdHRyaWJ1dGVzW25hbWVdO1xyXG4gICAgICBjb25zdCBmaWVsZE5hbWUgPSBkYXRhVHlwZS5maWVsZCB8fCBuYW1lO1xyXG5cclxuICAgICAgaWYgKF8uaXNPYmplY3QoZGF0YVR5cGUpKSB7XHJcbiAgICAgICAgbGV0IHNxbCA9IGRhdGFUeXBlLnR5cGUudG9TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhVHlwZSwgJ2FsbG93TnVsbCcpICYmICFkYXRhVHlwZS5hbGxvd051bGwpIHtcclxuICAgICAgICAgIHNxbCArPSAnIE5PVCBOVUxMJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChVdGlscy5kZWZhdWx0VmFsdWVTY2hlbWFibGUoZGF0YVR5cGUuZGVmYXVsdFZhbHVlKSkge1xyXG4gICAgICAgICAgLy8gVE9ETyB0aG9yb3VnaGx5IGNoZWNrIHRoYXQgRGF0YVR5cGVzLk5PVyB3aWxsIHByb3Blcmx5XHJcbiAgICAgICAgICAvLyBnZXQgcG9wdWxhdGVkIG9uIGFsbCBkYXRhYmFzZXMgYXMgREVGQVVMVCB2YWx1ZVxyXG4gICAgICAgICAgLy8gaS5lLiBteXNxbCByZXF1aXJlczogREVGQVVMVCBDVVJSRU5UX1RJTUVTVEFNUFxyXG4gICAgICAgICAgc3FsICs9IGAgREVGQVVMVCAke3RoaXMuZXNjYXBlKGRhdGFUeXBlLmRlZmF1bHRWYWx1ZSwgZGF0YVR5cGUpfWA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGF0YVR5cGUudW5pcXVlID09PSB0cnVlKSB7XHJcbiAgICAgICAgICBzcWwgKz0gJyBVTklRVUUnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRhdGFUeXBlLnByaW1hcnlLZXkpIHtcclxuICAgICAgICAgIHNxbCArPSAnIFBSSU1BUlkgS0VZJztcclxuXHJcbiAgICAgICAgICBpZiAoZGF0YVR5cGUuYXV0b0luY3JlbWVudCkge1xyXG4gICAgICAgICAgICBzcWwgKz0gJyBBVVRPSU5DUkVNRU5UJztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkYXRhVHlwZS5yZWZlcmVuY2VzKSB7XHJcbiAgICAgICAgICBjb25zdCByZWZlcmVuY2VzVGFibGUgPSB0aGlzLnF1b3RlVGFibGUoZGF0YVR5cGUucmVmZXJlbmNlcy5tb2RlbCk7XHJcblxyXG4gICAgICAgICAgbGV0IHJlZmVyZW5jZXNLZXk7XHJcbiAgICAgICAgICBpZiAoZGF0YVR5cGUucmVmZXJlbmNlcy5rZXkpIHtcclxuICAgICAgICAgICAgcmVmZXJlbmNlc0tleSA9IHRoaXMucXVvdGVJZGVudGlmaWVyKGRhdGFUeXBlLnJlZmVyZW5jZXMua2V5KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlZmVyZW5jZXNLZXkgPSB0aGlzLnF1b3RlSWRlbnRpZmllcignaWQnKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBzcWwgKz0gYCBSRUZFUkVOQ0VTICR7cmVmZXJlbmNlc1RhYmxlfSAoJHtyZWZlcmVuY2VzS2V5fSlgO1xyXG5cclxuICAgICAgICAgIGlmIChkYXRhVHlwZS5vbkRlbGV0ZSkge1xyXG4gICAgICAgICAgICBzcWwgKz0gYCBPTiBERUxFVEUgJHtkYXRhVHlwZS5vbkRlbGV0ZS50b1VwcGVyQ2FzZSgpfWA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKGRhdGFUeXBlLm9uVXBkYXRlKSB7XHJcbiAgICAgICAgICAgIHNxbCArPSBgIE9OIFVQREFURSAke2RhdGFUeXBlLm9uVXBkYXRlLnRvVXBwZXJDYXNlKCl9YDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bHRbZmllbGROYW1lXSA9IHNxbDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHRbZmllbGROYW1lXSA9IGRhdGFUeXBlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIHNob3dJbmRleGVzUXVlcnkodGFibGVOYW1lKSB7XHJcbiAgICByZXR1cm4gYFBSQUdNQSBJTkRFWF9MSVNUKCR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9KWA7XHJcbiAgfVxyXG5cclxuICBzaG93Q29uc3RyYWludHNRdWVyeSh0YWJsZU5hbWUsIGNvbnN0cmFpbnROYW1lKSB7XHJcbiAgICBsZXQgc3FsID0gYFNFTEVDVCBzcWwgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHRibF9uYW1lPScke3RhYmxlTmFtZX0nYDtcclxuXHJcbiAgICBpZiAoY29uc3RyYWludE5hbWUpIHtcclxuICAgICAgc3FsICs9IGAgQU5EIHNxbCBMSUtFICclJHtjb25zdHJhaW50TmFtZX0lJ2A7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGAke3NxbH07YDtcclxuICB9XHJcblxyXG4gIHJlbW92ZUluZGV4UXVlcnkodGFibGVOYW1lLCBpbmRleE5hbWVPckF0dHJpYnV0ZXMpIHtcclxuICAgIGxldCBpbmRleE5hbWUgPSBpbmRleE5hbWVPckF0dHJpYnV0ZXM7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBpbmRleE5hbWUgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGluZGV4TmFtZSA9IFV0aWxzLnVuZGVyc2NvcmUoYCR7dGFibGVOYW1lfV8ke2luZGV4TmFtZU9yQXR0cmlidXRlcy5qb2luKCdfJyl9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGBEUk9QIElOREVYIElGIEVYSVNUUyAke3RoaXMucXVvdGVJZGVudGlmaWVyKGluZGV4TmFtZSl9YDtcclxuICB9XHJcblxyXG4gIGRlc2NyaWJlVGFibGVRdWVyeSh0YWJsZU5hbWUsIHNjaGVtYSwgc2NoZW1hRGVsaW1pdGVyKSB7XHJcbiAgICBjb25zdCB0YWJsZSA9IHtcclxuICAgICAgX3NjaGVtYTogc2NoZW1hLFxyXG4gICAgICBfc2NoZW1hRGVsaW1pdGVyOiBzY2hlbWFEZWxpbWl0ZXIsXHJcbiAgICAgIHRhYmxlTmFtZVxyXG4gICAgfTtcclxuICAgIHJldHVybiBgUFJBR01BIFRBQkxFX0lORk8oJHt0aGlzLnF1b3RlVGFibGUodGhpcy5hZGRTY2hlbWEodGFibGUpKX0pO2A7XHJcbiAgfVxyXG5cclxuICBkZXNjcmliZUNyZWF0ZVRhYmxlUXVlcnkodGFibGVOYW1lKSB7XHJcbiAgICByZXR1cm4gYFNFTEVDVCBzcWwgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHRibF9uYW1lPScke3RhYmxlTmFtZX0nO2A7XHJcbiAgfVxyXG5cclxuICByZW1vdmVDb2x1bW5RdWVyeSh0YWJsZU5hbWUsIGF0dHJpYnV0ZXMpIHtcclxuXHJcbiAgICBhdHRyaWJ1dGVzID0gdGhpcy5hdHRyaWJ1dGVzVG9TUUwoYXR0cmlidXRlcyk7XHJcblxyXG4gICAgbGV0IGJhY2t1cFRhYmxlTmFtZTtcclxuICAgIGlmICh0eXBlb2YgdGFibGVOYW1lID09PSAnb2JqZWN0Jykge1xyXG4gICAgICBiYWNrdXBUYWJsZU5hbWUgPSB7XHJcbiAgICAgICAgdGFibGVOYW1lOiBgJHt0YWJsZU5hbWUudGFibGVOYW1lfV9iYWNrdXBgLFxyXG4gICAgICAgIHNjaGVtYTogdGFibGVOYW1lLnNjaGVtYVxyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYmFja3VwVGFibGVOYW1lID0gYCR7dGFibGVOYW1lfV9iYWNrdXBgO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHF1b3RlZFRhYmxlTmFtZSA9IHRoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpO1xyXG4gICAgY29uc3QgcXVvdGVkQmFja3VwVGFibGVOYW1lID0gdGhpcy5xdW90ZVRhYmxlKGJhY2t1cFRhYmxlTmFtZSk7XHJcbiAgICBjb25zdCBhdHRyaWJ1dGVOYW1lcyA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLm1hcChhdHRyID0+IHRoaXMucXVvdGVJZGVudGlmaWVyKGF0dHIpKS5qb2luKCcsICcpO1xyXG5cclxuICAgIC8vIFRlbXBvcmFyeSB0YWJsZSBjYW5ub3Qgd29yayBmb3IgZm9yZWlnbiBrZXlzLlxyXG4gICAgcmV0dXJuIGAke3RoaXMuY3JlYXRlVGFibGVRdWVyeShiYWNrdXBUYWJsZU5hbWUsIGF0dHJpYnV0ZXMpXHJcbiAgICB9SU5TRVJUIElOVE8gJHtxdW90ZWRCYWNrdXBUYWJsZU5hbWV9IFNFTEVDVCAke2F0dHJpYnV0ZU5hbWVzfSBGUk9NICR7cXVvdGVkVGFibGVOYW1lfTtgXHJcbiAgICAgICsgYERST1AgVEFCTEUgJHtxdW90ZWRUYWJsZU5hbWV9OyR7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcylcclxuICAgICAgfUlOU0VSVCBJTlRPICR7cXVvdGVkVGFibGVOYW1lfSBTRUxFQ1QgJHthdHRyaWJ1dGVOYW1lc30gRlJPTSAke3F1b3RlZEJhY2t1cFRhYmxlTmFtZX07YFxyXG4gICAgICArIGBEUk9QIFRBQkxFICR7cXVvdGVkQmFja3VwVGFibGVOYW1lfTtgO1xyXG4gIH1cclxuXHJcbiAgX2FsdGVyQ29uc3RyYWludFF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcywgY3JlYXRlVGFibGVTcWwpIHtcclxuICAgIGxldCBiYWNrdXBUYWJsZU5hbWU7XHJcblxyXG4gICAgYXR0cmlidXRlcyA9IHRoaXMuYXR0cmlidXRlc1RvU1FMKGF0dHJpYnV0ZXMpO1xyXG5cclxuICAgIGlmICh0eXBlb2YgdGFibGVOYW1lID09PSAnb2JqZWN0Jykge1xyXG4gICAgICBiYWNrdXBUYWJsZU5hbWUgPSB7XHJcbiAgICAgICAgdGFibGVOYW1lOiBgJHt0YWJsZU5hbWUudGFibGVOYW1lfV9iYWNrdXBgLFxyXG4gICAgICAgIHNjaGVtYTogdGFibGVOYW1lLnNjaGVtYVxyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYmFja3VwVGFibGVOYW1lID0gYCR7dGFibGVOYW1lfV9iYWNrdXBgO1xyXG4gICAgfVxyXG4gICAgY29uc3QgcXVvdGVkVGFibGVOYW1lID0gdGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSk7XHJcbiAgICBjb25zdCBxdW90ZWRCYWNrdXBUYWJsZU5hbWUgPSB0aGlzLnF1b3RlVGFibGUoYmFja3VwVGFibGVOYW1lKTtcclxuICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWVzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykubWFwKGF0dHIgPT4gdGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cikpLmpvaW4oJywgJyk7XHJcblxyXG4gICAgcmV0dXJuIGAke2NyZWF0ZVRhYmxlU3FsXHJcbiAgICAgIC5yZXBsYWNlKGBDUkVBVEUgVEFCTEUgJHtxdW90ZWRUYWJsZU5hbWV9YCwgYENSRUFURSBUQUJMRSAke3F1b3RlZEJhY2t1cFRhYmxlTmFtZX1gKVxyXG4gICAgICAucmVwbGFjZShgQ1JFQVRFIFRBQkxFICR7cXVvdGVkVGFibGVOYW1lLnJlcGxhY2UoL2AvZywgJ1wiJyl9YCwgYENSRUFURSBUQUJMRSAke3F1b3RlZEJhY2t1cFRhYmxlTmFtZX1gKVxyXG4gICAgfUlOU0VSVCBJTlRPICR7cXVvdGVkQmFja3VwVGFibGVOYW1lfSBTRUxFQ1QgJHthdHRyaWJ1dGVOYW1lc30gRlJPTSAke3F1b3RlZFRhYmxlTmFtZX07YFxyXG4gICAgICArIGBEUk9QIFRBQkxFICR7cXVvdGVkVGFibGVOYW1lfTtgXHJcbiAgICAgICsgYEFMVEVSIFRBQkxFICR7cXVvdGVkQmFja3VwVGFibGVOYW1lfSBSRU5BTUUgVE8gJHtxdW90ZWRUYWJsZU5hbWV9O2A7XHJcbiAgfVxyXG5cclxuICByZW5hbWVDb2x1bW5RdWVyeSh0YWJsZU5hbWUsIGF0dHJOYW1lQmVmb3JlLCBhdHRyTmFtZUFmdGVyLCBhdHRyaWJ1dGVzKSB7XHJcblxyXG4gICAgbGV0IGJhY2t1cFRhYmxlTmFtZTtcclxuXHJcbiAgICBhdHRyaWJ1dGVzID0gdGhpcy5hdHRyaWJ1dGVzVG9TUUwoYXR0cmlidXRlcyk7XHJcblxyXG4gICAgaWYgKHR5cGVvZiB0YWJsZU5hbWUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIGJhY2t1cFRhYmxlTmFtZSA9IHtcclxuICAgICAgICB0YWJsZU5hbWU6IGAke3RhYmxlTmFtZS50YWJsZU5hbWV9X2JhY2t1cGAsXHJcbiAgICAgICAgc2NoZW1hOiB0YWJsZU5hbWUuc2NoZW1hXHJcbiAgICAgIH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBiYWNrdXBUYWJsZU5hbWUgPSBgJHt0YWJsZU5hbWV9X2JhY2t1cGA7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcXVvdGVkVGFibGVOYW1lID0gdGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSk7XHJcbiAgICBjb25zdCBxdW90ZWRCYWNrdXBUYWJsZU5hbWUgPSB0aGlzLnF1b3RlVGFibGUoYmFja3VwVGFibGVOYW1lKTtcclxuICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWVzSW1wb3J0ID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykubWFwKGF0dHIgPT5cclxuICAgICAgYXR0ck5hbWVBZnRlciA9PT0gYXR0ciA/IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHJOYW1lQmVmb3JlKX0gQVMgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKX1gIDogdGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cilcclxuICAgICkuam9pbignLCAnKTtcclxuICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWVzRXhwb3J0ID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykubWFwKGF0dHIgPT4gdGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cikpLmpvaW4oJywgJyk7XHJcblxyXG4gICAgcmV0dXJuIGAke3RoaXMuY3JlYXRlVGFibGVRdWVyeShiYWNrdXBUYWJsZU5hbWUsIGF0dHJpYnV0ZXMpLnJlcGxhY2UoJ0NSRUFURSBUQUJMRScsICdDUkVBVEUgVEVNUE9SQVJZIFRBQkxFJylcclxuICAgIH1JTlNFUlQgSU5UTyAke3F1b3RlZEJhY2t1cFRhYmxlTmFtZX0gU0VMRUNUICR7YXR0cmlidXRlTmFtZXNJbXBvcnR9IEZST00gJHtxdW90ZWRUYWJsZU5hbWV9O2BcclxuICAgICAgKyBgRFJPUCBUQUJMRSAke3F1b3RlZFRhYmxlTmFtZX07JHtcclxuICAgICAgICB0aGlzLmNyZWF0ZVRhYmxlUXVlcnkodGFibGVOYW1lLCBhdHRyaWJ1dGVzKVxyXG4gICAgICB9SU5TRVJUIElOVE8gJHtxdW90ZWRUYWJsZU5hbWV9IFNFTEVDVCAke2F0dHJpYnV0ZU5hbWVzRXhwb3J0fSBGUk9NICR7cXVvdGVkQmFja3VwVGFibGVOYW1lfTtgXHJcbiAgICAgICsgYERST1AgVEFCTEUgJHtxdW90ZWRCYWNrdXBUYWJsZU5hbWV9O2A7XHJcbiAgfVxyXG5cclxuICBzdGFydFRyYW5zYWN0aW9uUXVlcnkodHJhbnNhY3Rpb24pIHtcclxuICAgIGlmICh0cmFuc2FjdGlvbi5wYXJlbnQpIHtcclxuICAgICAgcmV0dXJuIGBTQVZFUE9JTlQgJHt0aGlzLnF1b3RlSWRlbnRpZmllcih0cmFuc2FjdGlvbi5uYW1lKX07YDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYEJFR0lOICR7dHJhbnNhY3Rpb24ub3B0aW9ucy50eXBlfSBUUkFOU0FDVElPTjtgO1xyXG4gIH1cclxuXHJcbiAgc2V0SXNvbGF0aW9uTGV2ZWxRdWVyeSh2YWx1ZSkge1xyXG4gICAgc3dpdGNoICh2YWx1ZSkge1xyXG4gICAgICBjYXNlIFRyYW5zYWN0aW9uLklTT0xBVElPTl9MRVZFTFMuUkVQRUFUQUJMRV9SRUFEOlxyXG4gICAgICAgIHJldHVybiAnLS0gU1FMaXRlIGlzIG5vdCBhYmxlIHRvIGNob29zZSB0aGUgaXNvbGF0aW9uIGxldmVsIFJFUEVBVEFCTEUgUkVBRC4nO1xyXG4gICAgICBjYXNlIFRyYW5zYWN0aW9uLklTT0xBVElPTl9MRVZFTFMuUkVBRF9VTkNPTU1JVFRFRDpcclxuICAgICAgICByZXR1cm4gJ1BSQUdNQSByZWFkX3VuY29tbWl0dGVkID0gT047JztcclxuICAgICAgY2FzZSBUcmFuc2FjdGlvbi5JU09MQVRJT05fTEVWRUxTLlJFQURfQ09NTUlUVEVEOlxyXG4gICAgICAgIHJldHVybiAnUFJBR01BIHJlYWRfdW5jb21taXR0ZWQgPSBPRkY7JztcclxuICAgICAgY2FzZSBUcmFuc2FjdGlvbi5JU09MQVRJT05fTEVWRUxTLlNFUklBTElaQUJMRTpcclxuICAgICAgICByZXR1cm4gJy0tIFNRTGl0ZVxcJ3MgZGVmYXVsdCBpc29sYXRpb24gbGV2ZWwgaXMgU0VSSUFMSVpBQkxFLiBOb3RoaW5nIHRvIGRvLic7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGlzb2xhdGlvbiBsZXZlbDogJHt2YWx1ZX1gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJlcGxhY2VCb29sZWFuRGVmYXVsdHMoc3FsKSB7XHJcbiAgICByZXR1cm4gc3FsLnJlcGxhY2UoL0RFRkFVTFQgJz9mYWxzZSc/L2csICdERUZBVUxUIDAnKS5yZXBsYWNlKC9ERUZBVUxUICc/dHJ1ZSc/L2csICdERUZBVUxUIDEnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYXRlcyBhbiBTUUwgcXVlcnkgdGhhdCByZXR1cm5zIGFsbCBmb3JlaWduIGtleXMgb2YgYSB0YWJsZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdGFibGVOYW1lICBUaGUgbmFtZSBvZiB0aGUgdGFibGUuXHJcbiAgICogQHJldHVybnMge3N0cmluZ30gICAgICAgICAgICBUaGUgZ2VuZXJhdGVkIHNxbCBxdWVyeS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGdldEZvcmVpZ25LZXlzUXVlcnkodGFibGVOYW1lKSB7XHJcbiAgICByZXR1cm4gYFBSQUdNQSBmb3JlaWduX2tleV9saXN0KCR7dGFibGVOYW1lfSlgO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTUUxpdGVRdWVyeUdlbmVyYXRvcjtcclxuIl19