'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

const Utils = require('../../utils');

const Transaction = require('../../transaction');

const _ = require('lodash');

const MySqlQueryGenerator = require('../mysql/query-generator');

const AbstractQueryGenerator = require('../abstract/query-generator');

let SQLiteQueryGenerator = /*#__PURE__*/function (_MySqlQueryGenerator) {
  _inherits(SQLiteQueryGenerator, _MySqlQueryGenerator);

  var _super = _createSuper(SQLiteQueryGenerator);

  function SQLiteQueryGenerator() {
    _classCallCheck(this, SQLiteQueryGenerator);

    return _super.apply(this, arguments);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvcXVlcnktZ2VuZXJhdG9yLmpzIl0sIm5hbWVzIjpbIlV0aWxzIiwicmVxdWlyZSIsIlRyYW5zYWN0aW9uIiwiXyIsIk15U3FsUXVlcnlHZW5lcmF0b3IiLCJBYnN0cmFjdFF1ZXJ5R2VuZXJhdG9yIiwiU1FMaXRlUXVlcnlHZW5lcmF0b3IiLCJ0YWJsZU5hbWUiLCJhdHRyaWJ1dGVzIiwib3B0aW9ucyIsInByaW1hcnlLZXlzIiwibmVlZHNNdWx0aXBsZVByaW1hcnlLZXlzIiwidmFsdWVzIiwiZmlsdGVyIiwiZGVmaW5pdGlvbiIsImluY2x1ZGVzIiwibGVuZ3RoIiwiYXR0ckFycmF5IiwiYXR0ciIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImRhdGFUeXBlIiwiY29udGFpbnNBdXRvSW5jcmVtZW50IiwiZGF0YVR5cGVTdHJpbmciLCJzdWJzdHIiLCJpbmRleE9mIiwicHVzaCIsInJlcGxhY2UiLCJxdW90ZUlkZW50aWZpZXIiLCJ0YWJsZSIsInF1b3RlVGFibGUiLCJhdHRyU3RyIiwiam9pbiIsInBrU3RyaW5nIiwibWFwIiwicGsiLCJ1bmlxdWVLZXlzIiwiZWFjaCIsImNvbHVtbnMiLCJjdXN0b21JbmRleCIsImZpZWxkcyIsImZpZWxkIiwic3FsIiwicmVwbGFjZUJvb2xlYW5EZWZhdWx0cyIsInZhbHVlIiwic3RtdCIsImpzb25GdW5jdGlvblJlZ2V4IiwidG9rZW5DYXB0dXJlUmVnZXgiLCJjdXJyZW50SW5kZXgiLCJvcGVuaW5nQnJhY2tldHMiLCJjbG9zaW5nQnJhY2tldHMiLCJoYXNKc29uRnVuY3Rpb24iLCJoYXNJbnZhbGlkVG9rZW4iLCJzdHJpbmciLCJmdW5jdGlvbk1hdGNoZXMiLCJleGVjIiwidG9rZW5NYXRjaGVzIiwiY2FwdHVyZWRUb2tlbiIsIkVycm9yIiwiRGF0ZSIsInRvSVNPU3RyaW5nIiwiQXJyYXkiLCJpc0FycmF5IiwidmFsIiwic210aCIsImZhY3RvcnkiLCJwcmVwZW5kIiwiSnNvbiIsIkNhc3QiLCJ0ZXN0IiwidHlwZSIsImhhbmRsZVNlcXVlbGl6ZU1ldGhvZCIsImtleSIsImF0dHJpYnV0ZXNUb1NRTCIsImNvbnRleHQiLCJhdHRyaWJ1dGUiLCJpbnNlcnRWYWx1ZXMiLCJ1cGRhdGVWYWx1ZXMiLCJ3aGVyZSIsIm1vZGVsIiwiaWdub3JlRHVwbGljYXRlcyIsImJpbmQiLCJiaW5kUGFyYW0iLCJ1cHNlcnRPcHRpb25zIiwiZGVmYXVsdHMiLCJpbnNlcnQiLCJpbnNlcnRRdWVyeSIsInJhd0F0dHJpYnV0ZXMiLCJ1cGRhdGUiLCJ1cGRhdGVRdWVyeSIsInF1ZXJ5IiwiYXR0clZhbHVlSGFzaCIsInJlbW92ZU51bGxWYWx1ZXNGcm9tSGFzaCIsIm9taXROdWxsIiwibW9kZWxBdHRyaWJ1dGVNYXAiLCJTZXF1ZWxpemVNZXRob2QiLCJlc2NhcGUiLCJ1bmRlZmluZWQiLCJmb3JtYXQiLCJ3aGVyZU9wdGlvbnMiLCJsaW1pdCIsIndoZXJlUXVlcnkiLCJyZXN0YXJ0SWRlbnRpdHkiLCJhZGRUaWNrcyIsInJlbW92ZVRpY2tzIiwid2hlcmVDbGF1c2UiLCJnZXRXaGVyZUNvbmRpdGlvbnMiLCJyZXN1bHQiLCJuYW1lIiwiZmllbGROYW1lIiwiaXNPYmplY3QiLCJ0b1N0cmluZyIsImFsbG93TnVsbCIsImRlZmF1bHRWYWx1ZVNjaGVtYWJsZSIsImRlZmF1bHRWYWx1ZSIsInVuaXF1ZSIsInByaW1hcnlLZXkiLCJhdXRvSW5jcmVtZW50IiwicmVmZXJlbmNlcyIsInJlZmVyZW5jZXNUYWJsZSIsInJlZmVyZW5jZXNLZXkiLCJvbkRlbGV0ZSIsInRvVXBwZXJDYXNlIiwib25VcGRhdGUiLCJjb25zdHJhaW50TmFtZSIsImluZGV4TmFtZU9yQXR0cmlidXRlcyIsImluZGV4TmFtZSIsInVuZGVyc2NvcmUiLCJzY2hlbWEiLCJzY2hlbWFEZWxpbWl0ZXIiLCJfc2NoZW1hIiwiX3NjaGVtYURlbGltaXRlciIsImFkZFNjaGVtYSIsImJhY2t1cFRhYmxlTmFtZSIsInF1b3RlZFRhYmxlTmFtZSIsInF1b3RlZEJhY2t1cFRhYmxlTmFtZSIsImF0dHJpYnV0ZU5hbWVzIiwia2V5cyIsImNyZWF0ZVRhYmxlUXVlcnkiLCJjcmVhdGVUYWJsZVNxbCIsImF0dHJOYW1lQmVmb3JlIiwiYXR0ck5hbWVBZnRlciIsImF0dHJpYnV0ZU5hbWVzSW1wb3J0IiwiYXR0cmlidXRlTmFtZXNFeHBvcnQiLCJ0cmFuc2FjdGlvbiIsInBhcmVudCIsIklTT0xBVElPTl9MRVZFTFMiLCJSRVBFQVRBQkxFX1JFQUQiLCJSRUFEX1VOQ09NTUlUVEVEIiwiUkVBRF9DT01NSVRURUQiLCJTRVJJQUxJWkFCTEUiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxhQUFELENBQXJCOztBQUNBLE1BQU1DLFdBQVcsR0FBR0QsT0FBTyxDQUFDLG1CQUFELENBQTNCOztBQUNBLE1BQU1FLENBQUMsR0FBR0YsT0FBTyxDQUFDLFFBQUQsQ0FBakI7O0FBQ0EsTUFBTUcsbUJBQW1CLEdBQUdILE9BQU8sQ0FBQywwQkFBRCxDQUFuQzs7QUFDQSxNQUFNSSxzQkFBc0IsR0FBR0osT0FBTyxDQUFDLDZCQUFELENBQXRDOztJQUVNSyxvQjs7Ozs7Ozs7Ozs7OzttQ0FDVztBQUNiLGFBQU8sa0ZBQVA7QUFDRDs7O3VDQUVrQjtBQUNqQixhQUFPLGtGQUFQO0FBQ0Q7OzttQ0FFYztBQUNiLGFBQU8sc0NBQVA7QUFDRDs7O3FDQUVnQkMsUyxFQUFXQyxVLEVBQVlDLE8sRUFBUztBQUMvQ0EsTUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7QUFFQSxZQUFNQyxXQUFXLEdBQUcsRUFBcEI7QUFDQSxZQUFNQyx3QkFBd0IsR0FBR1IsQ0FBQyxDQUFDUyxNQUFGLENBQVNKLFVBQVQsRUFBcUJLLE1BQXJCLENBQTRCQyxVQUFVLElBQUlBLFVBQVUsQ0FBQ0MsUUFB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Q0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O3dDQUNzQnRCLFMsRUFBVztBQUM3QixhQUFRLDJCQUEwQkEsU0FBVSxHQUE1QztBQUNEOzs7O0VBcGRnQ0gsbUI7O0FBdWRuQ3FKLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQnBKLG9CQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscycpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSByZXF1aXJlKCcuLi8uLi90cmFuc2FjdGlvbicpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgTXlTcWxRdWVyeUdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL215c3FsL3F1ZXJ5LWdlbmVyYXRvcicpO1xuY29uc3QgQWJzdHJhY3RRdWVyeUdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2Fic3RyYWN0L3F1ZXJ5LWdlbmVyYXRvcicpO1xuXG5jbGFzcyBTUUxpdGVRdWVyeUdlbmVyYXRvciBleHRlbmRzIE15U3FsUXVlcnlHZW5lcmF0b3Ige1xuICBjcmVhdGVTY2hlbWEoKSB7XG4gICAgcmV0dXJuIFwiU0VMRUNUIG5hbWUgRlJPTSBgc3FsaXRlX21hc3RlcmAgV0hFUkUgdHlwZT0ndGFibGUnIGFuZCBuYW1lIT0nc3FsaXRlX3NlcXVlbmNlJztcIjtcbiAgfVxuXG4gIHNob3dTY2hlbWFzUXVlcnkoKSB7XG4gICAgcmV0dXJuIFwiU0VMRUNUIG5hbWUgRlJPTSBgc3FsaXRlX21hc3RlcmAgV0hFUkUgdHlwZT0ndGFibGUnIGFuZCBuYW1lIT0nc3FsaXRlX3NlcXVlbmNlJztcIjtcbiAgfVxuXG4gIHZlcnNpb25RdWVyeSgpIHtcbiAgICByZXR1cm4gJ1NFTEVDVCBzcWxpdGVfdmVyc2lvbigpIGFzIGB2ZXJzaW9uYCc7XG4gIH1cblxuICBjcmVhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcywgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgY29uc3QgcHJpbWFyeUtleXMgPSBbXTtcbiAgICBjb25zdCBuZWVkc011bHRpcGxlUHJpbWFyeUtleXMgPSBfLnZhbHVlcyhhdHRyaWJ1dGVzKS5maWx0ZXIoZGVmaW5pdGlvbiA9PiBkZWZpbml0aW9uLmluY2x1ZGVzKCdQUklNQVJZIEtFWScpKS5sZW5ndGggPiAxO1xuICAgIGNvbnN0IGF0dHJBcnJheSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBhdHRyIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXR0cmlidXRlcywgYXR0cikpIHtcbiAgICAgICAgY29uc3QgZGF0YVR5cGUgPSBhdHRyaWJ1dGVzW2F0dHJdO1xuICAgICAgICBjb25zdCBjb250YWluc0F1dG9JbmNyZW1lbnQgPSBkYXRhVHlwZS5pbmNsdWRlcygnQVVUT0lOQ1JFTUVOVCcpO1xuXG4gICAgICAgIGxldCBkYXRhVHlwZVN0cmluZyA9IGRhdGFUeXBlO1xuICAgICAgICBpZiAoZGF0YVR5cGUuaW5jbHVkZXMoJ1BSSU1BUlkgS0VZJykpIHtcbiAgICAgICAgICBpZiAoZGF0YVR5cGUuaW5jbHVkZXMoJ0lOVCcpKSB7XG4gICAgICAgICAgICAvLyBPbmx5IElOVEVHRVIgaXMgYWxsb3dlZCBmb3IgcHJpbWFyeSBrZXksIHNlZSBodHRwczovL2dpdGh1Yi5jb20vc2VxdWVsaXplL3NlcXVlbGl6ZS9pc3N1ZXMvOTY5IChubyBsZW5naHQsIHVuc2lnbmVkIGV0YylcbiAgICAgICAgICAgIGRhdGFUeXBlU3RyaW5nID0gY29udGFpbnNBdXRvSW5jcmVtZW50ID8gJ0lOVEVHRVIgUFJJTUFSWSBLRVkgQVVUT0lOQ1JFTUVOVCcgOiAnSU5URUdFUiBQUklNQVJZIEtFWSc7XG5cbiAgICAgICAgICAgIGlmIChkYXRhVHlwZS5pbmNsdWRlcygnIFJFRkVSRU5DRVMnKSkge1xuICAgICAgICAgICAgICBkYXRhVHlwZVN0cmluZyArPSBkYXRhVHlwZS5zdWJzdHIoZGF0YVR5cGUuaW5kZXhPZignIFJFRkVSRU5DRVMnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG5lZWRzTXVsdGlwbGVQcmltYXJ5S2V5cykge1xuICAgICAgICAgICAgcHJpbWFyeUtleXMucHVzaChhdHRyKTtcbiAgICAgICAgICAgIGRhdGFUeXBlU3RyaW5nID0gZGF0YVR5cGUucmVwbGFjZSgnUFJJTUFSWSBLRVknLCAnTk9UIE5VTEwnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0ckFycmF5LnB1c2goYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cil9ICR7ZGF0YVR5cGVTdHJpbmd9YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdGFibGUgPSB0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKTtcbiAgICBsZXQgYXR0clN0ciA9IGF0dHJBcnJheS5qb2luKCcsICcpO1xuICAgIGNvbnN0IHBrU3RyaW5nID0gcHJpbWFyeUtleXMubWFwKHBrID0+IHRoaXMucXVvdGVJZGVudGlmaWVyKHBrKSkuam9pbignLCAnKTtcblxuICAgIGlmIChvcHRpb25zLnVuaXF1ZUtleXMpIHtcbiAgICAgIF8uZWFjaChvcHRpb25zLnVuaXF1ZUtleXMsIGNvbHVtbnMgPT4ge1xuICAgICAgICBpZiAoY29sdW1ucy5jdXN0b21JbmRleCkge1xuICAgICAgICAgIGF0dHJTdHIgKz0gYCwgVU5JUVVFICgke2NvbHVtbnMuZmllbGRzLm1hcChmaWVsZCA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihmaWVsZCkpLmpvaW4oJywgJyl9KWA7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChwa1N0cmluZy5sZW5ndGggPiAwKSB7XG4gICAgICBhdHRyU3RyICs9IGAsIFBSSU1BUlkgS0VZICgke3BrU3RyaW5nfSlgO1xuICAgIH1cblxuICAgIGNvbnN0IHNxbCA9IGBDUkVBVEUgVEFCTEUgSUYgTk9UIEVYSVNUUyAke3RhYmxlfSAoJHthdHRyU3RyfSk7YDtcbiAgICByZXR1cm4gdGhpcy5yZXBsYWNlQm9vbGVhbkRlZmF1bHRzKHNxbCk7XG4gIH1cblxuICBib29sZWFuVmFsdWUodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPyAxIDogMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBzdGF0bWVtZW50IGlzIGpzb24gZnVuY3Rpb24gb3Igc2ltcGxlIHBhdGhcbiAgICpcbiAgICogQHBhcmFtICAge3N0cmluZ30gIHN0bXQgIFRoZSBzdGF0ZW1lbnQgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybnMge2Jvb2xlYW59ICAgICAgIHRydWUgaWYgdGhlIGdpdmVuIHN0YXRlbWVudCBpcyBqc29uIGZ1bmN0aW9uXG4gICAqIEB0aHJvd3MgIHtFcnJvcn0gICAgICAgICB0aHJvdyBpZiB0aGUgc3RhdGVtZW50IGxvb2tzIGxpa2UganNvbiBmdW5jdGlvbiBidXQgaGFzIGludmFsaWQgdG9rZW5cbiAgICovXG4gIF9jaGVja1ZhbGlkSnNvblN0YXRlbWVudChzdG10KSB7XG4gICAgaWYgKHR5cGVvZiBzdG10ICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGh0dHBzOi8vc3FsaXRlLm9yZy9qc29uMS5odG1sXG4gICAgY29uc3QganNvbkZ1bmN0aW9uUmVnZXggPSAvXlxccyooanNvbig/Ol9bYS16XSspezAsMn0pXFwoW14pXSpcXCkvaTtcbiAgICBjb25zdCB0b2tlbkNhcHR1cmVSZWdleCA9IC9eXFxzKigoPzooW2BcIiddKSg/Oig/IVxcMikufFxcMnsyfSkqXFwyKXxbXFx3XFxkXFxzXSt8WygpLiw7Ky1dKS9pO1xuXG4gICAgbGV0IGN1cnJlbnRJbmRleCA9IDA7XG4gICAgbGV0IG9wZW5pbmdCcmFja2V0cyA9IDA7XG4gICAgbGV0IGNsb3NpbmdCcmFja2V0cyA9IDA7XG4gICAgbGV0IGhhc0pzb25GdW5jdGlvbiA9IGZhbHNlO1xuICAgIGxldCBoYXNJbnZhbGlkVG9rZW4gPSBmYWxzZTtcblxuICAgIHdoaWxlIChjdXJyZW50SW5kZXggPCBzdG10Lmxlbmd0aCkge1xuICAgICAgY29uc3Qgc3RyaW5nID0gc3RtdC5zdWJzdHIoY3VycmVudEluZGV4KTtcbiAgICAgIGNvbnN0IGZ1bmN0aW9uTWF0Y2hlcyA9IGpzb25GdW5jdGlvblJlZ2V4LmV4ZWMoc3RyaW5nKTtcbiAgICAgIGlmIChmdW5jdGlvbk1hdGNoZXMpIHtcbiAgICAgICAgY3VycmVudEluZGV4ICs9IGZ1bmN0aW9uTWF0Y2hlc1swXS5pbmRleE9mKCcoJyk7XG4gICAgICAgIGhhc0pzb25GdW5jdGlvbiA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0b2tlbk1hdGNoZXMgPSB0b2tlbkNhcHR1cmVSZWdleC5leGVjKHN0cmluZyk7XG4gICAgICBpZiAodG9rZW5NYXRjaGVzKSB7XG4gICAgICAgIGNvbnN0IGNhcHR1cmVkVG9rZW4gPSB0b2tlbk1hdGNoZXNbMV07XG4gICAgICAgIGlmIChjYXB0dXJlZFRva2VuID09PSAnKCcpIHtcbiAgICAgICAgICBvcGVuaW5nQnJhY2tldHMrKztcbiAgICAgICAgfSBlbHNlIGlmIChjYXB0dXJlZFRva2VuID09PSAnKScpIHtcbiAgICAgICAgICBjbG9zaW5nQnJhY2tldHMrKztcbiAgICAgICAgfSBlbHNlIGlmIChjYXB0dXJlZFRva2VuID09PSAnOycpIHtcbiAgICAgICAgICBoYXNJbnZhbGlkVG9rZW4gPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRJbmRleCArPSB0b2tlbk1hdGNoZXNbMF0ubGVuZ3RoO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaW52YWxpZCBqc29uIHN0YXRlbWVudFxuICAgIGhhc0ludmFsaWRUb2tlbiB8PSBvcGVuaW5nQnJhY2tldHMgIT09IGNsb3NpbmdCcmFja2V0cztcbiAgICBpZiAoaGFzSnNvbkZ1bmN0aW9uICYmIGhhc0ludmFsaWRUb2tlbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGpzb24gc3RhdGVtZW50OiAke3N0bXR9YCk7XG4gICAgfVxuXG4gICAgLy8gcmV0dXJuIHRydWUgaWYgdGhlIHN0YXRlbWVudCBoYXMgdmFsaWQganNvbiBmdW5jdGlvblxuICAgIHJldHVybiBoYXNKc29uRnVuY3Rpb247XG4gIH1cblxuICAvL3NxbGl0ZSBjYW4ndCBjYXN0IHRvIGRhdGV0aW1lIHNvIHdlIG5lZWQgdG8gY29udmVydCBkYXRlIHZhbHVlcyB0byB0aGVpciBJU08gc3RyaW5nc1xuICBfdG9KU09OVmFsdWUodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG9JU09TdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlWzBdIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlLm1hcCh2YWwgPT4gdmFsLnRvSVNPU3RyaW5nKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuXG4gIGhhbmRsZVNlcXVlbGl6ZU1ldGhvZChzbXRoLCB0YWJsZU5hbWUsIGZhY3RvcnksIG9wdGlvbnMsIHByZXBlbmQpIHtcbiAgICBpZiAoc210aCBpbnN0YW5jZW9mIFV0aWxzLkpzb24pIHtcbiAgICAgIHJldHVybiBzdXBlci5oYW5kbGVTZXF1ZWxpemVNZXRob2Qoc210aCwgdGFibGVOYW1lLCBmYWN0b3J5LCBvcHRpb25zLCBwcmVwZW5kKTtcbiAgICB9XG5cbiAgICBpZiAoc210aCBpbnN0YW5jZW9mIFV0aWxzLkNhc3QpIHtcbiAgICAgIGlmICgvdGltZXN0YW1wL2kudGVzdChzbXRoLnR5cGUpKSB7XG4gICAgICAgIHNtdGgudHlwZSA9ICdkYXRldGltZSc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFic3RyYWN0UXVlcnlHZW5lcmF0b3IucHJvdG90eXBlLmhhbmRsZVNlcXVlbGl6ZU1ldGhvZC5jYWxsKHRoaXMsIHNtdGgsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCk7XG4gIH1cblxuICBhZGRDb2x1bW5RdWVyeSh0YWJsZSwga2V5LCBkYXRhVHlwZSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fTtcbiAgICBhdHRyaWJ1dGVzW2tleV0gPSBkYXRhVHlwZTtcbiAgICBjb25zdCBmaWVsZHMgPSB0aGlzLmF0dHJpYnV0ZXNUb1NRTChhdHRyaWJ1dGVzLCB7IGNvbnRleHQ6ICdhZGRDb2x1bW4nIH0pO1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGtleSl9ICR7ZmllbGRzW2tleV19YDtcblxuICAgIGNvbnN0IHNxbCA9IGBBTFRFUiBUQUJMRSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZSl9IEFERCAke2F0dHJpYnV0ZX07YDtcblxuICAgIHJldHVybiB0aGlzLnJlcGxhY2VCb29sZWFuRGVmYXVsdHMoc3FsKTtcbiAgfVxuXG4gIHNob3dUYWJsZXNRdWVyeSgpIHtcbiAgICByZXR1cm4gJ1NFTEVDVCBuYW1lIEZST00gYHNxbGl0ZV9tYXN0ZXJgIFdIRVJFIHR5cGU9XFwndGFibGVcXCcgYW5kIG5hbWUhPVxcJ3NxbGl0ZV9zZXF1ZW5jZVxcJzsnO1xuICB9XG5cbiAgdXBzZXJ0UXVlcnkodGFibGVOYW1lLCBpbnNlcnRWYWx1ZXMsIHVwZGF0ZVZhbHVlcywgd2hlcmUsIG1vZGVsLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucy5pZ25vcmVEdXBsaWNhdGVzID0gdHJ1ZTtcblxuICAgIGNvbnN0IGJpbmQgPSBbXTtcbiAgICBjb25zdCBiaW5kUGFyYW0gPSB0aGlzLmJpbmRQYXJhbShiaW5kKTtcblxuICAgIGNvbnN0IHVwc2VydE9wdGlvbnMgPSBfLmRlZmF1bHRzKHsgYmluZFBhcmFtIH0sIG9wdGlvbnMpO1xuICAgIGNvbnN0IGluc2VydCA9IHRoaXMuaW5zZXJ0UXVlcnkodGFibGVOYW1lLCBpbnNlcnRWYWx1ZXMsIG1vZGVsLnJhd0F0dHJpYnV0ZXMsIHVwc2VydE9wdGlvbnMpO1xuICAgIGNvbnN0IHVwZGF0ZSA9IHRoaXMudXBkYXRlUXVlcnkodGFibGVOYW1lLCB1cGRhdGVWYWx1ZXMsIHdoZXJlLCB1cHNlcnRPcHRpb25zLCBtb2RlbC5yYXdBdHRyaWJ1dGVzKTtcblxuICAgIGNvbnN0IHF1ZXJ5ID0gYCR7aW5zZXJ0LnF1ZXJ5fSAke3VwZGF0ZS5xdWVyeX1gO1xuXG4gICAgcmV0dXJuIHsgcXVlcnksIGJpbmQgfTtcbiAgfVxuXG4gIHVwZGF0ZVF1ZXJ5KHRhYmxlTmFtZSwgYXR0clZhbHVlSGFzaCwgd2hlcmUsIG9wdGlvbnMsIGF0dHJpYnV0ZXMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBfLmRlZmF1bHRzKG9wdGlvbnMsIHRoaXMub3B0aW9ucyk7XG5cbiAgICBhdHRyVmFsdWVIYXNoID0gVXRpbHMucmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoKGF0dHJWYWx1ZUhhc2gsIG9wdGlvbnMub21pdE51bGwsIG9wdGlvbnMpO1xuXG4gICAgY29uc3QgbW9kZWxBdHRyaWJ1dGVNYXAgPSB7fTtcbiAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICBjb25zdCBiaW5kID0gW107XG4gICAgY29uc3QgYmluZFBhcmFtID0gb3B0aW9ucy5iaW5kUGFyYW0gfHwgdGhpcy5iaW5kUGFyYW0oYmluZCk7XG5cbiAgICBpZiAoYXR0cmlidXRlcykge1xuICAgICAgXy5lYWNoKGF0dHJpYnV0ZXMsIChhdHRyaWJ1dGUsIGtleSkgPT4ge1xuICAgICAgICBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldID0gYXR0cmlidXRlO1xuICAgICAgICBpZiAoYXR0cmlidXRlLmZpZWxkKSB7XG4gICAgICAgICAgbW9kZWxBdHRyaWJ1dGVNYXBbYXR0cmlidXRlLmZpZWxkXSA9IGF0dHJpYnV0ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0clZhbHVlSGFzaCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyVmFsdWVIYXNoW2tleV07XG5cbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCB8fCBvcHRpb25zLmJpbmRQYXJhbSA9PT0gZmFsc2UpIHtcbiAgICAgICAgdmFsdWVzLnB1c2goYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KX09JHt0aGlzLmVzY2FwZSh2YWx1ZSwgbW9kZWxBdHRyaWJ1dGVNYXAgJiYgbW9kZWxBdHRyaWJ1dGVNYXBba2V5XSB8fCB1bmRlZmluZWQsIHsgY29udGV4dDogJ1VQREFURScgfSl9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZXMucHVzaChgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihrZXkpfT0ke3RoaXMuZm9ybWF0KHZhbHVlLCBtb2RlbEF0dHJpYnV0ZU1hcCAmJiBtb2RlbEF0dHJpYnV0ZU1hcFtrZXldIHx8IHVuZGVmaW5lZCwgeyBjb250ZXh0OiAnVVBEQVRFJyB9LCBiaW5kUGFyYW0pfWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBxdWVyeTtcbiAgICBjb25zdCB3aGVyZU9wdGlvbnMgPSBfLmRlZmF1bHRzKHsgYmluZFBhcmFtIH0sIG9wdGlvbnMpO1xuXG4gICAgaWYgKG9wdGlvbnMubGltaXQpIHtcbiAgICAgIHF1ZXJ5ID0gYFVQREFURSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfSBTRVQgJHt2YWx1ZXMuam9pbignLCcpfSBXSEVSRSByb3dpZCBJTiAoU0VMRUNUIHJvd2lkIEZST00gJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX0gJHt0aGlzLndoZXJlUXVlcnkod2hlcmUsIHdoZXJlT3B0aW9ucyl9IExJTUlUICR7dGhpcy5lc2NhcGUob3B0aW9ucy5saW1pdCl9KWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHF1ZXJ5ID0gYFVQREFURSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfSBTRVQgJHt2YWx1ZXMuam9pbignLCcpfSAke3RoaXMud2hlcmVRdWVyeSh3aGVyZSwgd2hlcmVPcHRpb25zKX1gO1xuICAgIH1cblxuICAgIHJldHVybiB7IHF1ZXJ5LCBiaW5kIH07XG4gIH1cblxuICB0cnVuY2F0ZVRhYmxlUXVlcnkodGFibGVOYW1lLCBvcHRpb25zID0ge30pIHtcbiAgICByZXR1cm4gW1xuICAgICAgYERFTEVURSBGUk9NICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9YCxcbiAgICAgIG9wdGlvbnMucmVzdGFydElkZW50aXR5ID8gYDsgREVMRVRFIEZST00gJHt0aGlzLnF1b3RlVGFibGUoJ3NxbGl0ZV9zZXF1ZW5jZScpfSBXSEVSRSAke3RoaXMucXVvdGVJZGVudGlmaWVyKCduYW1lJyl9ID0gJHtVdGlscy5hZGRUaWNrcyhVdGlscy5yZW1vdmVUaWNrcyh0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKSwgJ2AnKSwgXCInXCIpfTtgIDogJydcbiAgICBdLmpvaW4oJycpO1xuICB9XG5cbiAgZGVsZXRlUXVlcnkodGFibGVOYW1lLCB3aGVyZSwgb3B0aW9ucyA9IHt9LCBtb2RlbCkge1xuICAgIF8uZGVmYXVsdHMob3B0aW9ucywgdGhpcy5vcHRpb25zKTtcblxuICAgIGxldCB3aGVyZUNsYXVzZSA9IHRoaXMuZ2V0V2hlcmVDb25kaXRpb25zKHdoZXJlLCBudWxsLCBtb2RlbCwgb3B0aW9ucyk7XG5cbiAgICBpZiAod2hlcmVDbGF1c2UpIHtcbiAgICAgIHdoZXJlQ2xhdXNlID0gYFdIRVJFICR7d2hlcmVDbGF1c2V9YDtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5saW1pdCkge1xuICAgICAgd2hlcmVDbGF1c2UgPSBgV0hFUkUgcm93aWQgSU4gKFNFTEVDVCByb3dpZCBGUk9NICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9ICR7d2hlcmVDbGF1c2V9IExJTUlUICR7dGhpcy5lc2NhcGUob3B0aW9ucy5saW1pdCl9KWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGBERUxFVEUgRlJPTSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfSAke3doZXJlQ2xhdXNlfWA7XG4gIH1cblxuICBhdHRyaWJ1dGVzVG9TUUwoYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBuYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGRhdGFUeXBlID0gYXR0cmlidXRlc1tuYW1lXTtcbiAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGRhdGFUeXBlLmZpZWxkIHx8IG5hbWU7XG5cbiAgICAgIGlmIChfLmlzT2JqZWN0KGRhdGFUeXBlKSkge1xuICAgICAgICBsZXQgc3FsID0gZGF0YVR5cGUudHlwZS50b1N0cmluZygpO1xuXG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGF0YVR5cGUsICdhbGxvd051bGwnKSAmJiAhZGF0YVR5cGUuYWxsb3dOdWxsKSB7XG4gICAgICAgICAgc3FsICs9ICcgTk9UIE5VTEwnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFV0aWxzLmRlZmF1bHRWYWx1ZVNjaGVtYWJsZShkYXRhVHlwZS5kZWZhdWx0VmFsdWUpKSB7XG4gICAgICAgICAgLy8gVE9ETyB0aG9yb3VnaGx5IGNoZWNrIHRoYXQgRGF0YVR5cGVzLk5PVyB3aWxsIHByb3Blcmx5XG4gICAgICAgICAgLy8gZ2V0IHBvcHVsYXRlZCBvbiBhbGwgZGF0YWJhc2VzIGFzIERFRkFVTFQgdmFsdWVcbiAgICAgICAgICAvLyBpLmUuIG15c3FsIHJlcXVpcmVzOiBERUZBVUxUIENVUlJFTlRfVElNRVNUQU1QXG4gICAgICAgICAgc3FsICs9IGAgREVGQVVMVCAke3RoaXMuZXNjYXBlKGRhdGFUeXBlLmRlZmF1bHRWYWx1ZSwgZGF0YVR5cGUpfWA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YVR5cGUudW5pcXVlID09PSB0cnVlKSB7XG4gICAgICAgICAgc3FsICs9ICcgVU5JUVVFJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhVHlwZS5wcmltYXJ5S2V5KSB7XG4gICAgICAgICAgc3FsICs9ICcgUFJJTUFSWSBLRVknO1xuXG4gICAgICAgICAgaWYgKGRhdGFUeXBlLmF1dG9JbmNyZW1lbnQpIHtcbiAgICAgICAgICAgIHNxbCArPSAnIEFVVE9JTkNSRU1FTlQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhVHlwZS5yZWZlcmVuY2VzKSB7XG4gICAgICAgICAgY29uc3QgcmVmZXJlbmNlc1RhYmxlID0gdGhpcy5xdW90ZVRhYmxlKGRhdGFUeXBlLnJlZmVyZW5jZXMubW9kZWwpO1xuXG4gICAgICAgICAgbGV0IHJlZmVyZW5jZXNLZXk7XG4gICAgICAgICAgaWYgKGRhdGFUeXBlLnJlZmVyZW5jZXMua2V5KSB7XG4gICAgICAgICAgICByZWZlcmVuY2VzS2V5ID0gdGhpcy5xdW90ZUlkZW50aWZpZXIoZGF0YVR5cGUucmVmZXJlbmNlcy5rZXkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWZlcmVuY2VzS2V5ID0gdGhpcy5xdW90ZUlkZW50aWZpZXIoJ2lkJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc3FsICs9IGAgUkVGRVJFTkNFUyAke3JlZmVyZW5jZXNUYWJsZX0gKCR7cmVmZXJlbmNlc0tleX0pYDtcblxuICAgICAgICAgIGlmIChkYXRhVHlwZS5vbkRlbGV0ZSkge1xuICAgICAgICAgICAgc3FsICs9IGAgT04gREVMRVRFICR7ZGF0YVR5cGUub25EZWxldGUudG9VcHBlckNhc2UoKX1gO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChkYXRhVHlwZS5vblVwZGF0ZSkge1xuICAgICAgICAgICAgc3FsICs9IGAgT04gVVBEQVRFICR7ZGF0YVR5cGUub25VcGRhdGUudG9VcHBlckNhc2UoKX1gO1xuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0W2ZpZWxkTmFtZV0gPSBzcWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbZmllbGROYW1lXSA9IGRhdGFUeXBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBzaG93SW5kZXhlc1F1ZXJ5KHRhYmxlTmFtZSkge1xuICAgIHJldHVybiBgUFJBR01BIElOREVYX0xJU1QoJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX0pYDtcbiAgfVxuXG4gIHNob3dDb25zdHJhaW50c1F1ZXJ5KHRhYmxlTmFtZSwgY29uc3RyYWludE5hbWUpIHtcbiAgICBsZXQgc3FsID0gYFNFTEVDVCBzcWwgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHRibF9uYW1lPScke3RhYmxlTmFtZX0nYDtcblxuICAgIGlmIChjb25zdHJhaW50TmFtZSkge1xuICAgICAgc3FsICs9IGAgQU5EIHNxbCBMSUtFICclJHtjb25zdHJhaW50TmFtZX0lJ2A7XG4gICAgfVxuXG4gICAgcmV0dXJuIGAke3NxbH07YDtcbiAgfVxuXG4gIHJlbW92ZUluZGV4UXVlcnkodGFibGVOYW1lLCBpbmRleE5hbWVPckF0dHJpYnV0ZXMpIHtcbiAgICBsZXQgaW5kZXhOYW1lID0gaW5kZXhOYW1lT3JBdHRyaWJ1dGVzO1xuXG4gICAgaWYgKHR5cGVvZiBpbmRleE5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpbmRleE5hbWUgPSBVdGlscy51bmRlcnNjb3JlKGAke3RhYmxlTmFtZX1fJHtpbmRleE5hbWVPckF0dHJpYnV0ZXMuam9pbignXycpfWApO1xuICAgIH1cblxuICAgIHJldHVybiBgRFJPUCBJTkRFWCBJRiBFWElTVFMgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihpbmRleE5hbWUpfWA7XG4gIH1cblxuICBkZXNjcmliZVRhYmxlUXVlcnkodGFibGVOYW1lLCBzY2hlbWEsIHNjaGVtYURlbGltaXRlcikge1xuICAgIGNvbnN0IHRhYmxlID0ge1xuICAgICAgX3NjaGVtYTogc2NoZW1hLFxuICAgICAgX3NjaGVtYURlbGltaXRlcjogc2NoZW1hRGVsaW1pdGVyLFxuICAgICAgdGFibGVOYW1lXG4gICAgfTtcbiAgICByZXR1cm4gYFBSQUdNQSBUQUJMRV9JTkZPKCR7dGhpcy5xdW90ZVRhYmxlKHRoaXMuYWRkU2NoZW1hKHRhYmxlKSl9KTtgO1xuICB9XG5cbiAgZGVzY3JpYmVDcmVhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSkge1xuICAgIHJldHVybiBgU0VMRUNUIHNxbCBGUk9NIHNxbGl0ZV9tYXN0ZXIgV0hFUkUgdGJsX25hbWU9JyR7dGFibGVOYW1lfSc7YDtcbiAgfVxuXG4gIHJlbW92ZUNvbHVtblF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcykge1xuXG4gICAgYXR0cmlidXRlcyA9IHRoaXMuYXR0cmlidXRlc1RvU1FMKGF0dHJpYnV0ZXMpO1xuXG4gICAgbGV0IGJhY2t1cFRhYmxlTmFtZTtcbiAgICBpZiAodHlwZW9mIHRhYmxlTmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGJhY2t1cFRhYmxlTmFtZSA9IHtcbiAgICAgICAgdGFibGVOYW1lOiBgJHt0YWJsZU5hbWUudGFibGVOYW1lfV9iYWNrdXBgLFxuICAgICAgICBzY2hlbWE6IHRhYmxlTmFtZS5zY2hlbWFcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhY2t1cFRhYmxlTmFtZSA9IGAke3RhYmxlTmFtZX1fYmFja3VwYDtcbiAgICB9XG5cbiAgICBjb25zdCBxdW90ZWRUYWJsZU5hbWUgPSB0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKTtcbiAgICBjb25zdCBxdW90ZWRCYWNrdXBUYWJsZU5hbWUgPSB0aGlzLnF1b3RlVGFibGUoYmFja3VwVGFibGVOYW1lKTtcbiAgICBjb25zdCBhdHRyaWJ1dGVOYW1lcyA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLm1hcChhdHRyID0+IHRoaXMucXVvdGVJZGVudGlmaWVyKGF0dHIpKS5qb2luKCcsICcpO1xuXG4gICAgLy8gVGVtcG9yYXJ5IHRhYmxlIGNhbm5vdCB3b3JrIGZvciBmb3JlaWduIGtleXMuXG4gICAgcmV0dXJuIGAke3RoaXMuY3JlYXRlVGFibGVRdWVyeShiYWNrdXBUYWJsZU5hbWUsIGF0dHJpYnV0ZXMpXG4gICAgfUlOU0VSVCBJTlRPICR7cXVvdGVkQmFja3VwVGFibGVOYW1lfSBTRUxFQ1QgJHthdHRyaWJ1dGVOYW1lc30gRlJPTSAke3F1b3RlZFRhYmxlTmFtZX07YFxuICAgICAgKyBgRFJPUCBUQUJMRSAke3F1b3RlZFRhYmxlTmFtZX07JHtcbiAgICAgICAgdGhpcy5jcmVhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcylcbiAgICAgIH1JTlNFUlQgSU5UTyAke3F1b3RlZFRhYmxlTmFtZX0gU0VMRUNUICR7YXR0cmlidXRlTmFtZXN9IEZST00gJHtxdW90ZWRCYWNrdXBUYWJsZU5hbWV9O2BcbiAgICAgICsgYERST1AgVEFCTEUgJHtxdW90ZWRCYWNrdXBUYWJsZU5hbWV9O2A7XG4gIH1cblxuICBfYWx0ZXJDb25zdHJhaW50UXVlcnkodGFibGVOYW1lLCBhdHRyaWJ1dGVzLCBjcmVhdGVUYWJsZVNxbCkge1xuICAgIGxldCBiYWNrdXBUYWJsZU5hbWU7XG5cbiAgICBhdHRyaWJ1dGVzID0gdGhpcy5hdHRyaWJ1dGVzVG9TUUwoYXR0cmlidXRlcyk7XG5cbiAgICBpZiAodHlwZW9mIHRhYmxlTmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGJhY2t1cFRhYmxlTmFtZSA9IHtcbiAgICAgICAgdGFibGVOYW1lOiBgJHt0YWJsZU5hbWUudGFibGVOYW1lfV9iYWNrdXBgLFxuICAgICAgICBzY2hlbWE6IHRhYmxlTmFtZS5zY2hlbWFcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhY2t1cFRhYmxlTmFtZSA9IGAke3RhYmxlTmFtZX1fYmFja3VwYDtcbiAgICB9XG4gICAgY29uc3QgcXVvdGVkVGFibGVOYW1lID0gdGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSk7XG4gICAgY29uc3QgcXVvdGVkQmFja3VwVGFibGVOYW1lID0gdGhpcy5xdW90ZVRhYmxlKGJhY2t1cFRhYmxlTmFtZSk7XG4gICAgY29uc3QgYXR0cmlidXRlTmFtZXMgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5tYXAoYXR0ciA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKSkuam9pbignLCAnKTtcblxuICAgIHJldHVybiBgJHtjcmVhdGVUYWJsZVNxbFxuICAgICAgLnJlcGxhY2UoYENSRUFURSBUQUJMRSAke3F1b3RlZFRhYmxlTmFtZX1gLCBgQ1JFQVRFIFRBQkxFICR7cXVvdGVkQmFja3VwVGFibGVOYW1lfWApXG4gICAgICAucmVwbGFjZShgQ1JFQVRFIFRBQkxFICR7cXVvdGVkVGFibGVOYW1lLnJlcGxhY2UoL2AvZywgJ1wiJyl9YCwgYENSRUFURSBUQUJMRSAke3F1b3RlZEJhY2t1cFRhYmxlTmFtZX1gKVxuICAgIH1JTlNFUlQgSU5UTyAke3F1b3RlZEJhY2t1cFRhYmxlTmFtZX0gU0VMRUNUICR7YXR0cmlidXRlTmFtZXN9IEZST00gJHtxdW90ZWRUYWJsZU5hbWV9O2BcbiAgICAgICsgYERST1AgVEFCTEUgJHtxdW90ZWRUYWJsZU5hbWV9O2BcbiAgICAgICsgYEFMVEVSIFRBQkxFICR7cXVvdGVkQmFja3VwVGFibGVOYW1lfSBSRU5BTUUgVE8gJHtxdW90ZWRUYWJsZU5hbWV9O2A7XG4gIH1cblxuICByZW5hbWVDb2x1bW5RdWVyeSh0YWJsZU5hbWUsIGF0dHJOYW1lQmVmb3JlLCBhdHRyTmFtZUFmdGVyLCBhdHRyaWJ1dGVzKSB7XG5cbiAgICBsZXQgYmFja3VwVGFibGVOYW1lO1xuXG4gICAgYXR0cmlidXRlcyA9IHRoaXMuYXR0cmlidXRlc1RvU1FMKGF0dHJpYnV0ZXMpO1xuXG4gICAgaWYgKHR5cGVvZiB0YWJsZU5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBiYWNrdXBUYWJsZU5hbWUgPSB7XG4gICAgICAgIHRhYmxlTmFtZTogYCR7dGFibGVOYW1lLnRhYmxlTmFtZX1fYmFja3VwYCxcbiAgICAgICAgc2NoZW1hOiB0YWJsZU5hbWUuc2NoZW1hXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBiYWNrdXBUYWJsZU5hbWUgPSBgJHt0YWJsZU5hbWV9X2JhY2t1cGA7XG4gICAgfVxuXG4gICAgY29uc3QgcXVvdGVkVGFibGVOYW1lID0gdGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSk7XG4gICAgY29uc3QgcXVvdGVkQmFja3VwVGFibGVOYW1lID0gdGhpcy5xdW90ZVRhYmxlKGJhY2t1cFRhYmxlTmFtZSk7XG4gICAgY29uc3QgYXR0cmlidXRlTmFtZXNJbXBvcnQgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5tYXAoYXR0ciA9PlxuICAgICAgYXR0ck5hbWVBZnRlciA9PT0gYXR0ciA/IGAke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHJOYW1lQmVmb3JlKX0gQVMgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKX1gIDogdGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cilcbiAgICApLmpvaW4oJywgJyk7XG4gICAgY29uc3QgYXR0cmlidXRlTmFtZXNFeHBvcnQgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5tYXAoYXR0ciA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKSkuam9pbignLCAnKTtcblxuICAgIHJldHVybiBgJHt0aGlzLmNyZWF0ZVRhYmxlUXVlcnkoYmFja3VwVGFibGVOYW1lLCBhdHRyaWJ1dGVzKS5yZXBsYWNlKCdDUkVBVEUgVEFCTEUnLCAnQ1JFQVRFIFRFTVBPUkFSWSBUQUJMRScpXG4gICAgfUlOU0VSVCBJTlRPICR7cXVvdGVkQmFja3VwVGFibGVOYW1lfSBTRUxFQ1QgJHthdHRyaWJ1dGVOYW1lc0ltcG9ydH0gRlJPTSAke3F1b3RlZFRhYmxlTmFtZX07YFxuICAgICAgKyBgRFJPUCBUQUJMRSAke3F1b3RlZFRhYmxlTmFtZX07JHtcbiAgICAgICAgdGhpcy5jcmVhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcylcbiAgICAgIH1JTlNFUlQgSU5UTyAke3F1b3RlZFRhYmxlTmFtZX0gU0VMRUNUICR7YXR0cmlidXRlTmFtZXNFeHBvcnR9IEZST00gJHtxdW90ZWRCYWNrdXBUYWJsZU5hbWV9O2BcbiAgICAgICsgYERST1AgVEFCTEUgJHtxdW90ZWRCYWNrdXBUYWJsZU5hbWV9O2A7XG4gIH1cblxuICBzdGFydFRyYW5zYWN0aW9uUXVlcnkodHJhbnNhY3Rpb24pIHtcbiAgICBpZiAodHJhbnNhY3Rpb24ucGFyZW50KSB7XG4gICAgICByZXR1cm4gYFNBVkVQT0lOVCAke3RoaXMucXVvdGVJZGVudGlmaWVyKHRyYW5zYWN0aW9uLm5hbWUpfTtgO1xuICAgIH1cblxuICAgIHJldHVybiBgQkVHSU4gJHt0cmFuc2FjdGlvbi5vcHRpb25zLnR5cGV9IFRSQU5TQUNUSU9OO2A7XG4gIH1cblxuICBzZXRJc29sYXRpb25MZXZlbFF1ZXJ5KHZhbHVlKSB7XG4gICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgY2FzZSBUcmFuc2FjdGlvbi5JU09MQVRJT05fTEVWRUxTLlJFUEVBVEFCTEVfUkVBRDpcbiAgICAgICAgcmV0dXJuICctLSBTUUxpdGUgaXMgbm90IGFibGUgdG8gY2hvb3NlIHRoZSBpc29sYXRpb24gbGV2ZWwgUkVQRUFUQUJMRSBSRUFELic7XG4gICAgICBjYXNlIFRyYW5zYWN0aW9uLklTT0xBVElPTl9MRVZFTFMuUkVBRF9VTkNPTU1JVFRFRDpcbiAgICAgICAgcmV0dXJuICdQUkFHTUEgcmVhZF91bmNvbW1pdHRlZCA9IE9OOyc7XG4gICAgICBjYXNlIFRyYW5zYWN0aW9uLklTT0xBVElPTl9MRVZFTFMuUkVBRF9DT01NSVRURUQ6XG4gICAgICAgIHJldHVybiAnUFJBR01BIHJlYWRfdW5jb21taXR0ZWQgPSBPRkY7JztcbiAgICAgIGNhc2UgVHJhbnNhY3Rpb24uSVNPTEFUSU9OX0xFVkVMUy5TRVJJQUxJWkFCTEU6XG4gICAgICAgIHJldHVybiAnLS0gU1FMaXRlXFwncyBkZWZhdWx0IGlzb2xhdGlvbiBsZXZlbCBpcyBTRVJJQUxJWkFCTEUuIE5vdGhpbmcgdG8gZG8uJztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBpc29sYXRpb24gbGV2ZWw6ICR7dmFsdWV9YCk7XG4gICAgfVxuICB9XG5cbiAgcmVwbGFjZUJvb2xlYW5EZWZhdWx0cyhzcWwpIHtcbiAgICByZXR1cm4gc3FsLnJlcGxhY2UoL0RFRkFVTFQgJz9mYWxzZSc/L2csICdERUZBVUxUIDAnKS5yZXBsYWNlKC9ERUZBVUxUICc/dHJ1ZSc/L2csICdERUZBVUxUIDEnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYW4gU1FMIHF1ZXJ5IHRoYXQgcmV0dXJucyBhbGwgZm9yZWlnbiBrZXlzIG9mIGEgdGFibGUuXG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ30gdGFibGVOYW1lICBUaGUgbmFtZSBvZiB0aGUgdGFibGUuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9ICAgICAgICAgICAgVGhlIGdlbmVyYXRlZCBzcWwgcXVlcnkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBnZXRGb3JlaWduS2V5c1F1ZXJ5KHRhYmxlTmFtZSkge1xuICAgIHJldHVybiBgUFJBR01BIGZvcmVpZ25fa2V5X2xpc3QoJHt0YWJsZU5hbWV9KWA7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTUUxpdGVRdWVyeUdlbmVyYXRvcjtcbiJdfQ==