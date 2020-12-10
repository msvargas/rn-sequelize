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

const _ = require('lodash');

const Utils = require('../../utils');

const AbstractQueryGenerator = require('../abstract/query-generator');

const util = require('util');

const Op = require('../../operators');

const jsonFunctionRegex = /^\s*((?:[a-z]+_){0,2}jsonb?(?:_[a-z]+){0,2})\([^)]*\)/i;
const jsonOperatorRegex = /^\s*(->>?|@>|<@|\?[|&]?|\|{2}|#-)/i;
const tokenCaptureRegex = /^\s*((?:([`"'])(?:(?!\2).|\2{2})*\2)|[\w\d\s]+|[().,;+-])/i;
const foreignKeyFields = 'CONSTRAINT_NAME as constraint_name,' + 'CONSTRAINT_NAME as constraintName,' + 'CONSTRAINT_SCHEMA as constraintSchema,' + 'CONSTRAINT_SCHEMA as constraintCatalog,' + 'TABLE_NAME as tableName,' + 'TABLE_SCHEMA as tableSchema,' + 'TABLE_SCHEMA as tableCatalog,' + 'COLUMN_NAME as columnName,' + 'REFERENCED_TABLE_SCHEMA as referencedTableSchema,' + 'REFERENCED_TABLE_SCHEMA as referencedTableCatalog,' + 'REFERENCED_TABLE_NAME as referencedTableName,' + 'REFERENCED_COLUMN_NAME as referencedColumnName';
const typeWithoutDefault = new Set(['BLOB', 'TEXT', 'GEOMETRY', 'JSON']);

let MySQLQueryGenerator = /*#__PURE__*/function (_AbstractQueryGenerat) {
  _inherits(MySQLQueryGenerator, _AbstractQueryGenerat);

  var _super = _createSuper(MySQLQueryGenerator);

  function MySQLQueryGenerator(options) {
    var _this;

    _classCallCheck(this, MySQLQueryGenerator);

    _this = _super.call(this, options);
    _this.OperatorMap = Object.assign({}, _this.OperatorMap, {
      [Op.regexp]: 'REGEXP',
      [Op.notRegexp]: 'NOT REGEXP'
    });
    return _this;
  }

  _createClass(MySQLQueryGenerator, [{
    key: "createDatabaseQuery",
    value: function createDatabaseQuery(databaseName, options) {
      options = Object.assign({
        charset: null,
        collate: null
      }, options || {});
      const database = this.quoteIdentifier(databaseName);
      const charset = options.charset ? ` DEFAULT CHARACTER SET ${this.escape(options.charset)}` : '';
      const collate = options.collate ? ` DEFAULT COLLATE ${this.escape(options.collate)}` : '';
      return `${`CREATE DATABASE IF NOT EXISTS ${database}${charset}${collate}`.trim()};`;
    }
  }, {
    key: "dropDatabaseQuery",
    value: function dropDatabaseQuery(databaseName) {
      return `DROP DATABASE IF EXISTS ${this.quoteIdentifier(databaseName).trim()};`;
    }
  }, {
    key: "createSchema",
    value: function createSchema() {
      return 'SHOW TABLES';
    }
  }, {
    key: "showSchemasQuery",
    value: function showSchemasQuery() {
      return 'SHOW TABLES';
    }
  }, {
    key: "versionQuery",
    value: function versionQuery() {
      return 'SELECT VERSION() as `version`';
    }
  }, {
    key: "createTableQuery",
    value: function createTableQuery(tableName, attributes, options) {
      options = Object.assign({
        engine: 'InnoDB',
        charset: null,
        rowFormat: null
      }, options || {});
      const primaryKeys = [];
      const foreignKeys = {};
      const attrStr = [];

      for (const attr in attributes) {
        if (!Object.prototype.hasOwnProperty.call(attributes, attr)) continue;
        const dataType = attributes[attr];
        let match;

        if (dataType.includes('PRIMARY KEY')) {
          primaryKeys.push(attr);

          if (dataType.includes('REFERENCES')) {
            // MySQL doesn't support inline REFERENCES declarations: move to the end
            match = dataType.match(/^(.+) (REFERENCES.*)$/);
            attrStr.push(`${this.quoteIdentifier(attr)} ${match[1].replace('PRIMARY KEY', '')}`);
            foreignKeys[attr] = match[2];
          } else {
            attrStr.push(`${this.quoteIdentifier(attr)} ${dataType.replace('PRIMARY KEY', '')}`);
          }
        } else if (dataType.includes('REFERENCES')) {
          // MySQL doesn't support inline REFERENCES declarations: move to the end
          match = dataType.match(/^(.+) (REFERENCES.*)$/);
          attrStr.push(`${this.quoteIdentifier(attr)} ${match[1]}`);
          foreignKeys[attr] = match[2];
        } else {
          attrStr.push(`${this.quoteIdentifier(attr)} ${dataType}`);
        }
      }

      const table = this.quoteTable(tableName);
      let attributesClause = attrStr.join(', ');
      const comment = options.comment && typeof options.comment === 'string' ? ` COMMENT ${this.escape(options.comment)}` : '';
      const engine = options.engine;
      const charset = options.charset ? ` DEFAULT CHARSET=${options.charset}` : '';
      const collation = options.collate ? ` COLLATE ${options.collate}` : '';
      const rowFormat = options.rowFormat ? ` ROW_FORMAT=${options.rowFormat}` : '';
      const initialAutoIncrement = options.initialAutoIncrement ? ` AUTO_INCREMENT=${options.initialAutoIncrement}` : '';
      const pkString = primaryKeys.map(pk => this.quoteIdentifier(pk)).join(', ');

      if (options.uniqueKeys) {
        _.each(options.uniqueKeys, (columns, indexName) => {
          if (columns.customIndex) {
            if (typeof indexName !== 'string') {
              indexName = `uniq_${tableName}_${columns.fields.join('_')}`;
            }

            attributesClause += `, UNIQUE ${this.quoteIdentifier(indexName)} (${columns.fields.map(field => this.quoteIdentifier(field)).join(', ')})`;
          }
        });
      }

      if (pkString.length > 0) {
        attributesClause += `, PRIMARY KEY (${pkString})`;
      }

      for (const fkey in foreignKeys) {
        if (Object.prototype.hasOwnProperty.call(foreignKeys, fkey)) {
          attributesClause += `, FOREIGN KEY (${this.quoteIdentifier(fkey)}) ${foreignKeys[fkey]}`;
        }
      }

      return `CREATE TABLE IF NOT EXISTS ${table} (${attributesClause}) ENGINE=${engine}${comment}${charset}${collation}${initialAutoIncrement}${rowFormat};`;
    }
  }, {
    key: "describeTableQuery",
    value: function describeTableQuery(tableName, schema, schemaDelimiter) {
      const table = this.quoteTable(this.addSchema({
        tableName,
        _schema: schema,
        _schemaDelimiter: schemaDelimiter
      }));
      return `SHOW FULL COLUMNS FROM ${table};`;
    }
  }, {
    key: "showTablesQuery",
    value: function showTablesQuery(database) {
      let query = 'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'';

      if (database) {
        query += ` AND TABLE_SCHEMA = ${this.escape(database)}`;
      } else {
        query += ' AND TABLE_SCHEMA NOT IN (\'MYSQL\', \'INFORMATION_SCHEMA\', \'PERFORMANCE_SCHEMA\', \'SYS\')';
      }

      return `${query};`;
    }
  }, {
    key: "addColumnQuery",
    value: function addColumnQuery(table, key, dataType) {
      const definition = this.attributeToSQL(dataType, {
        context: 'addColumn',
        tableName: table,
        foreignKey: key
      });
      return `ALTER TABLE ${this.quoteTable(table)} ADD ${this.quoteIdentifier(key)} ${definition};`;
    }
  }, {
    key: "removeColumnQuery",
    value: function removeColumnQuery(tableName, attributeName) {
      return `ALTER TABLE ${this.quoteTable(tableName)} DROP ${this.quoteIdentifier(attributeName)};`;
    }
  }, {
    key: "changeColumnQuery",
    value: function changeColumnQuery(tableName, attributes) {
      const attrString = [];
      const constraintString = [];

      for (const attributeName in attributes) {
        let definition = attributes[attributeName];

        if (definition.includes('REFERENCES')) {
          const attrName = this.quoteIdentifier(attributeName);
          definition = definition.replace(/.+?(?=REFERENCES)/, '');
          constraintString.push(`FOREIGN KEY (${attrName}) ${definition}`);
        } else {
          attrString.push(`\`${attributeName}\` \`${attributeName}\` ${definition}`);
        }
      }

      let finalQuery = '';

      if (attrString.length) {
        finalQuery += `CHANGE ${attrString.join(', ')}`;
        finalQuery += constraintString.length ? ' ' : '';
      }

      if (constraintString.length) {
        finalQuery += `ADD ${constraintString.join(', ')}`;
      }

      return `ALTER TABLE ${this.quoteTable(tableName)} ${finalQuery};`;
    }
  }, {
    key: "renameColumnQuery",
    value: function renameColumnQuery(tableName, attrBefore, attributes) {
      const attrString = [];

      for (const attrName in attributes) {
        const definition = attributes[attrName];
        attrString.push(`\`${attrBefore}\` \`${attrName}\` ${definition}`);
      }

      return `ALTER TABLE ${this.quoteTable(tableName)} CHANGE ${attrString.join(', ')};`;
    }
  }, {
    key: "handleSequelizeMethod",
    value: function handleSequelizeMethod(smth, tableName, factory, options, prepend) {
      if (smth instanceof Utils.Json) {
        // Parse nested object
        if (smth.conditions) {
          const conditions = this.parseConditionObject(smth.conditions).map(condition => `${this.jsonPathExtractionQuery(condition.path[0], _.tail(condition.path))} = '${condition.value}'`);
          return conditions.join(' AND ');
        }

        if (smth.path) {
          let str; // Allow specifying conditions using the sqlite json functions

          if (this._checkValidJsonStatement(smth.path)) {
            str = smth.path;
          } else {
            // Also support json property accessors
            const paths = _.toPath(smth.path);

            const column = paths.shift();
            str = this.jsonPathExtractionQuery(column, paths);
          }

          if (smth.value) {
            str += util.format(' = %s', this.escape(smth.value));
          }

          return str;
        }
      } else if (smth instanceof Utils.Cast) {
        if (/timestamp/i.test(smth.type)) {
          smth.type = 'datetime';
        } else if (smth.json && /boolean/i.test(smth.type)) {
          // true or false cannot be casted as booleans within a JSON structure
          smth.type = 'char';
        } else if (/double precision/i.test(smth.type) || /boolean/i.test(smth.type) || /integer/i.test(smth.type)) {
          smth.type = 'decimal';
        } else if (/text/i.test(smth.type)) {
          smth.type = 'char';
        }
      }

      return _get(_getPrototypeOf(MySQLQueryGenerator.prototype), "handleSequelizeMethod", this).call(this, smth, tableName, factory, options, prepend);
    }
  }, {
    key: "_toJSONValue",
    value: function _toJSONValue(value) {
      // true/false are stored as strings in mysql
      if (typeof value === 'boolean') {
        return value.toString();
      } // null is stored as a string in mysql


      if (value === null) {
        return 'null';
      }

      return value;
    }
  }, {
    key: "upsertQuery",
    value: function upsertQuery(tableName, insertValues, updateValues, where, model, options) {
      options.onDuplicate = 'UPDATE ';
      options.onDuplicate += Object.keys(updateValues).map(key => {
        key = this.quoteIdentifier(key);
        return `${key}=VALUES(${key})`;
      }).join(', ');
      return this.insertQuery(tableName, insertValues, model.rawAttributes, options);
    }
  }, {
    key: "truncateTableQuery",
    value: function truncateTableQuery(tableName) {
      return `TRUNCATE ${this.quoteTable(tableName)}`;
    }
  }, {
    key: "deleteQuery",
    value: function deleteQuery(tableName, where, options = {}, model) {
      let limit = '';
      let query = `DELETE FROM ${this.quoteTable(tableName)}`;

      if (options.limit) {
        limit = ` LIMIT ${this.escape(options.limit)}`;
      }

      where = this.getWhereConditions(where, null, model, options);

      if (where) {
        query += ` WHERE ${where}`;
      }

      return query + limit;
    }
  }, {
    key: "showIndexesQuery",
    value: function showIndexesQuery(tableName, options) {
      return `SHOW INDEX FROM ${this.quoteTable(tableName)}${(options || {}).database ? ` FROM \`${options.database}\`` : ''}`;
    }
  }, {
    key: "showConstraintsQuery",
    value: function showConstraintsQuery(table, constraintName) {
      const tableName = table.tableName || table;
      const schemaName = table.schema;
      let sql = ['SELECT CONSTRAINT_CATALOG AS constraintCatalog,', 'CONSTRAINT_NAME AS constraintName,', 'CONSTRAINT_SCHEMA AS constraintSchema,', 'CONSTRAINT_TYPE AS constraintType,', 'TABLE_NAME AS tableName,', 'TABLE_SCHEMA AS tableSchema', 'from INFORMATION_SCHEMA.TABLE_CONSTRAINTS', `WHERE table_name='${tableName}'`].join(' ');

      if (constraintName) {
        sql += ` AND constraint_name = '${constraintName}'`;
      }

      if (schemaName) {
        sql += ` AND TABLE_SCHEMA = '${schemaName}'`;
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

      return `DROP INDEX ${this.quoteIdentifier(indexName)} ON ${this.quoteTable(tableName)}`;
    }
  }, {
    key: "attributeToSQL",
    value: function attributeToSQL(attribute, options) {
      if (!_.isPlainObject(attribute)) {
        attribute = {
          type: attribute
        };
      }

      const attributeString = attribute.type.toString({
        escape: this.escape.bind(this)
      });
      let template = attributeString;

      if (attribute.allowNull === false) {
        template += ' NOT NULL';
      }

      if (attribute.autoIncrement) {
        template += ' auto_increment';
      } // BLOB/TEXT/GEOMETRY/JSON cannot have a default value


      if (!typeWithoutDefault.has(attributeString) && attribute.type._binary !== true && Utils.defaultValueSchemable(attribute.defaultValue)) {
        template += ` DEFAULT ${this.escape(attribute.defaultValue)}`;
      }

      if (attribute.unique === true) {
        template += ' UNIQUE';
      }

      if (attribute.primaryKey) {
        template += ' PRIMARY KEY';
      }

      if (attribute.comment) {
        template += ` COMMENT ${this.escape(attribute.comment)}`;
      }

      if (attribute.first) {
        template += ' FIRST';
      }

      if (attribute.after) {
        template += ` AFTER ${this.quoteIdentifier(attribute.after)}`;
      }

      if (attribute.references) {
        if (options && options.context === 'addColumn' && options.foreignKey) {
          const attrName = this.quoteIdentifier(options.foreignKey);
          const fkName = this.quoteIdentifier(`${options.tableName}_${attrName}_foreign_idx`);
          template += `, ADD CONSTRAINT ${fkName} FOREIGN KEY (${attrName})`;
        }

        template += ` REFERENCES ${this.quoteTable(attribute.references.model)}`;

        if (attribute.references.key) {
          template += ` (${this.quoteIdentifier(attribute.references.key)})`;
        } else {
          template += ` (${this.quoteIdentifier('id')})`;
        }

        if (attribute.onDelete) {
          template += ` ON DELETE ${attribute.onDelete.toUpperCase()}`;
        }

        if (attribute.onUpdate) {
          template += ` ON UPDATE ${attribute.onUpdate.toUpperCase()}`;
        }
      }

      return template;
    }
  }, {
    key: "attributesToSQL",
    value: function attributesToSQL(attributes, options) {
      const result = {};

      for (const key in attributes) {
        const attribute = attributes[key];
        result[attribute.field || key] = this.attributeToSQL(attribute, options);
      }

      return result;
    }
    /**
     * Check whether the statmement is json function or simple path
     *
     * @param   {string}  stmt  The statement to validate
     * @returns {boolean}       true if the given statement is json function
     * @throws  {Error}         throw if the statement looks like json function but has invalid token
     * @private
     */

  }, {
    key: "_checkValidJsonStatement",
    value: function _checkValidJsonStatement(stmt) {
      if (typeof stmt !== 'string') {
        return false;
      }

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

        const operatorMatches = jsonOperatorRegex.exec(string);

        if (operatorMatches) {
          currentIndex += operatorMatches[0].length;
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


      if (hasJsonFunction && (hasInvalidToken || openingBrackets !== closingBrackets)) {
        throw new Error(`Invalid json statement: ${stmt}`);
      } // return true if the statement has valid json function


      return hasJsonFunction;
    }
    /**
     * Generates an SQL query that returns all foreign keys of a table.
     *
     * @param  {Object} table  The table.
     * @param  {string} schemaName The name of the schema.
     * @returns {string}            The generated sql query.
     * @private
     */

  }, {
    key: "getForeignKeysQuery",
    value: function getForeignKeysQuery(table, schemaName) {
      const tableName = table.tableName || table;
      return `SELECT ${foreignKeyFields} FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE where TABLE_NAME = '${tableName}' AND CONSTRAINT_NAME!='PRIMARY' AND CONSTRAINT_SCHEMA='${schemaName}' AND REFERENCED_TABLE_NAME IS NOT NULL;`;
    }
    /**
     * Generates an SQL query that returns the foreign key constraint of a given column.
     *
     * @param  {Object} table  The table.
     * @param  {string} columnName The name of the column.
     * @returns {string}            The generated sql query.
     * @private
     */

  }, {
    key: "getForeignKeyQuery",
    value: function getForeignKeyQuery(table, columnName) {
      const quotedSchemaName = table.schema ? wrapSingleQuote(table.schema) : '';
      const quotedTableName = wrapSingleQuote(table.tableName || table);
      const quotedColumnName = wrapSingleQuote(columnName);
      return `SELECT ${foreignKeyFields} FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE` + ` WHERE (REFERENCED_TABLE_NAME = ${quotedTableName}${table.schema ? ` AND REFERENCED_TABLE_SCHEMA = ${quotedSchemaName}` : ''} AND REFERENCED_COLUMN_NAME = ${quotedColumnName})` + ` OR (TABLE_NAME = ${quotedTableName}${table.schema ? ` AND TABLE_SCHEMA = ${quotedSchemaName}` : ''} AND COLUMN_NAME = ${quotedColumnName} AND REFERENCED_TABLE_NAME IS NOT NULL)`;
    }
    /**
     * Generates an SQL query that removes a foreign key from a table.
     *
     * @param  {string} tableName  The name of the table.
     * @param  {string} foreignKey The name of the foreign key constraint.
     * @returns {string}            The generated sql query.
     * @private
     */

  }, {
    key: "dropForeignKeyQuery",
    value: function dropForeignKeyQuery(tableName, foreignKey) {
      return `ALTER TABLE ${this.quoteTable(tableName)}
      DROP FOREIGN KEY ${this.quoteIdentifier(foreignKey)};`;
    }
  }]);

  return MySQLQueryGenerator;
}(AbstractQueryGenerator); // private methods


function wrapSingleQuote(identifier) {
  return Utils.addTicks(identifier, '\'');
}

module.exports = MySQLQueryGenerator;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9teXNxbC9xdWVyeS1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJVdGlscyIsIkFic3RyYWN0UXVlcnlHZW5lcmF0b3IiLCJ1dGlsIiwiT3AiLCJqc29uRnVuY3Rpb25SZWdleCIsImpzb25PcGVyYXRvclJlZ2V4IiwidG9rZW5DYXB0dXJlUmVnZXgiLCJmb3JlaWduS2V5RmllbGRzIiwidHlwZVdpdGhvdXREZWZhdWx0IiwiU2V0IiwiTXlTUUxRdWVyeUdlbmVyYXRvciIsIm9wdGlvbnMiLCJPcGVyYXRvck1hcCIsIk9iamVjdCIsImFzc2lnbiIsInJlZ2V4cCIsIm5vdFJlZ2V4cCIsImRhdGFiYXNlTmFtZSIsImNoYXJzZXQiLCJjb2xsYXRlIiwiZGF0YWJhc2UiLCJxdW90ZUlkZW50aWZpZXIiLCJlc2NhcGUiLCJ0cmltIiwidGFibGVOYW1lIiwiYXR0cmlidXRlcyIsImVuZ2luZSIsInJvd0Zvcm1hdCIsInByaW1hcnlLZXlzIiwiZm9yZWlnbktleXMiLCJhdHRyU3RyIiwiYXR0ciIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImRhdGFUeXBlIiwibWF0Y2giLCJpbmNsdWRlcyIsInB1c2giLCJyZXBsYWNlIiwidGFibGUiLCJxdW90ZVRhYmxlIiwiYXR0cmlidXRlc0NsYXVzZSIsImpvaW4iLCJjb21tZW50IiwiY29sbGF0aW9uIiwiaW5pdGlhbEF1dG9JbmNyZW1lbnQiLCJwa1N0cmluZyIsIm1hcCIsInBrIiwidW5pcXVlS2V5cyIsImVhY2giLCJjb2x1bW5zIiwiaW5kZXhOYW1lIiwiY3VzdG9tSW5kZXgiLCJmaWVsZHMiLCJmaWVsZCIsImxlbmd0aCIsImZrZXkiLCJzY2hlbWEiLCJzY2hlbWFEZWxpbWl0ZXIiLCJhZGRTY2hlbWEiLCJfc2NoZW1hIiwiX3NjaGVtYURlbGltaXRlciIsInF1ZXJ5Iiwia2V5IiwiZGVmaW5pdGlvbiIsImF0dHJpYnV0ZVRvU1FMIiwiY29udGV4dCIsImZvcmVpZ25LZXkiLCJhdHRyaWJ1dGVOYW1lIiwiYXR0clN0cmluZyIsImNvbnN0cmFpbnRTdHJpbmciLCJhdHRyTmFtZSIsImZpbmFsUXVlcnkiLCJhdHRyQmVmb3JlIiwic210aCIsImZhY3RvcnkiLCJwcmVwZW5kIiwiSnNvbiIsImNvbmRpdGlvbnMiLCJwYXJzZUNvbmRpdGlvbk9iamVjdCIsImNvbmRpdGlvbiIsImpzb25QYXRoRXh0cmFjdGlvblF1ZXJ5IiwicGF0aCIsInRhaWwiLCJ2YWx1ZSIsInN0ciIsIl9jaGVja1ZhbGlkSnNvblN0YXRlbWVudCIsInBhdGhzIiwidG9QYXRoIiwiY29sdW1uIiwic2hpZnQiLCJmb3JtYXQiLCJDYXN0IiwidGVzdCIsInR5cGUiLCJqc29uIiwidG9TdHJpbmciLCJpbnNlcnRWYWx1ZXMiLCJ1cGRhdGVWYWx1ZXMiLCJ3aGVyZSIsIm1vZGVsIiwib25EdXBsaWNhdGUiLCJrZXlzIiwiaW5zZXJ0UXVlcnkiLCJyYXdBdHRyaWJ1dGVzIiwibGltaXQiLCJnZXRXaGVyZUNvbmRpdGlvbnMiLCJjb25zdHJhaW50TmFtZSIsInNjaGVtYU5hbWUiLCJzcWwiLCJpbmRleE5hbWVPckF0dHJpYnV0ZXMiLCJ1bmRlcnNjb3JlIiwiYXR0cmlidXRlIiwiaXNQbGFpbk9iamVjdCIsImF0dHJpYnV0ZVN0cmluZyIsImJpbmQiLCJ0ZW1wbGF0ZSIsImFsbG93TnVsbCIsImF1dG9JbmNyZW1lbnQiLCJoYXMiLCJfYmluYXJ5IiwiZGVmYXVsdFZhbHVlU2NoZW1hYmxlIiwiZGVmYXVsdFZhbHVlIiwidW5pcXVlIiwicHJpbWFyeUtleSIsImZpcnN0IiwiYWZ0ZXIiLCJyZWZlcmVuY2VzIiwiZmtOYW1lIiwib25EZWxldGUiLCJ0b1VwcGVyQ2FzZSIsIm9uVXBkYXRlIiwicmVzdWx0Iiwic3RtdCIsImN1cnJlbnRJbmRleCIsIm9wZW5pbmdCcmFja2V0cyIsImNsb3NpbmdCcmFja2V0cyIsImhhc0pzb25GdW5jdGlvbiIsImhhc0ludmFsaWRUb2tlbiIsInN0cmluZyIsInN1YnN0ciIsImZ1bmN0aW9uTWF0Y2hlcyIsImV4ZWMiLCJpbmRleE9mIiwib3BlcmF0b3JNYXRjaGVzIiwidG9rZW5NYXRjaGVzIiwiY2FwdHVyZWRUb2tlbiIsIkVycm9yIiwiY29sdW1uTmFtZSIsInF1b3RlZFNjaGVtYU5hbWUiLCJ3cmFwU2luZ2xlUXVvdGUiLCJxdW90ZWRUYWJsZU5hbWUiLCJxdW90ZWRDb2x1bW5OYW1lIiwiaWRlbnRpZmllciIsImFkZFRpY2tzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsQ0FBQyxHQUFHQyxPQUFPLENBQUMsUUFBRCxDQUFqQjs7QUFDQSxNQUFNQyxLQUFLLEdBQUdELE9BQU8sQ0FBQyxhQUFELENBQXJCOztBQUNBLE1BQU1FLHNCQUFzQixHQUFHRixPQUFPLENBQUMsNkJBQUQsQ0FBdEM7O0FBQ0EsTUFBTUcsSUFBSSxHQUFHSCxPQUFPLENBQUMsTUFBRCxDQUFwQjs7QUFDQSxNQUFNSSxFQUFFLEdBQUdKLE9BQU8sQ0FBQyxpQkFBRCxDQUFsQjs7QUFHQSxNQUFNSyxpQkFBaUIsR0FBRyx3REFBMUI7QUFDQSxNQUFNQyxpQkFBaUIsR0FBRyxvQ0FBMUI7QUFDQSxNQUFNQyxpQkFBaUIsR0FBRyw0REFBMUI7QUFDQSxNQUFNQyxnQkFBZ0IsR0FBRyx3Q0FDckIsb0NBRHFCLEdBRXJCLHdDQUZxQixHQUdyQix5Q0FIcUIsR0FJckIsMEJBSnFCLEdBS3JCLDhCQUxxQixHQU1yQiwrQkFOcUIsR0FPckIsNEJBUHFCLEdBUXJCLG1EQVJxQixHQVNyQixvREFUcUIsR0FVckIsK0NBVnFCLEdBV3JCLGdEQVhKO0FBYUEsTUFBTUMsa0JBQWtCLEdBQUcsSUFBSUMsR0FBSixDQUFRLENBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsVUFBakIsRUFBNkIsTUFBN0IsQ0FBUixDQUEzQjs7SUFFTUMsbUI7Ozs7O0FBQ0osK0JBQVlDLE9BQVosRUFBcUI7QUFBQTs7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RCx5QkFBeUIsS0FBS0gsZUFBTCxDQUFxQmdELFVBQXJCLENBQWlDLEdBRHREO0FBRUQ7Ozs7RUF6ZitCcEUsc0IsR0E0ZmxDOzs7QUFDQSxTQUFTdUosZUFBVCxDQUF5QkcsVUFBekIsRUFBcUM7QUFDbkMsU0FBTzNKLEtBQUssQ0FBQzRKLFFBQU4sQ0FBZUQsVUFBZixFQUEyQixJQUEzQixDQUFQO0FBQ0Q7O0FBRURFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQnBKLG1CQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuLi8uLi91dGlscycpO1xuY29uc3QgQWJzdHJhY3RRdWVyeUdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2Fic3RyYWN0L3F1ZXJ5LWdlbmVyYXRvcicpO1xuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbmNvbnN0IE9wID0gcmVxdWlyZSgnLi4vLi4vb3BlcmF0b3JzJyk7XG5cblxuY29uc3QganNvbkZ1bmN0aW9uUmVnZXggPSAvXlxccyooKD86W2Etel0rXyl7MCwyfWpzb25iPyg/Ol9bYS16XSspezAsMn0pXFwoW14pXSpcXCkvaTtcbmNvbnN0IGpzb25PcGVyYXRvclJlZ2V4ID0gL15cXHMqKC0+Pj98QD58PEB8XFw/W3wmXT98XFx8ezJ9fCMtKS9pO1xuY29uc3QgdG9rZW5DYXB0dXJlUmVnZXggPSAvXlxccyooKD86KFtgXCInXSkoPzooPyFcXDIpLnxcXDJ7Mn0pKlxcMil8W1xcd1xcZFxcc10rfFsoKS4sOystXSkvaTtcbmNvbnN0IGZvcmVpZ25LZXlGaWVsZHMgPSAnQ09OU1RSQUlOVF9OQU1FIGFzIGNvbnN0cmFpbnRfbmFtZSwnXG4gICsgJ0NPTlNUUkFJTlRfTkFNRSBhcyBjb25zdHJhaW50TmFtZSwnXG4gICsgJ0NPTlNUUkFJTlRfU0NIRU1BIGFzIGNvbnN0cmFpbnRTY2hlbWEsJ1xuICArICdDT05TVFJBSU5UX1NDSEVNQSBhcyBjb25zdHJhaW50Q2F0YWxvZywnXG4gICsgJ1RBQkxFX05BTUUgYXMgdGFibGVOYW1lLCdcbiAgKyAnVEFCTEVfU0NIRU1BIGFzIHRhYmxlU2NoZW1hLCdcbiAgKyAnVEFCTEVfU0NIRU1BIGFzIHRhYmxlQ2F0YWxvZywnXG4gICsgJ0NPTFVNTl9OQU1FIGFzIGNvbHVtbk5hbWUsJ1xuICArICdSRUZFUkVOQ0VEX1RBQkxFX1NDSEVNQSBhcyByZWZlcmVuY2VkVGFibGVTY2hlbWEsJ1xuICArICdSRUZFUkVOQ0VEX1RBQkxFX1NDSEVNQSBhcyByZWZlcmVuY2VkVGFibGVDYXRhbG9nLCdcbiAgKyAnUkVGRVJFTkNFRF9UQUJMRV9OQU1FIGFzIHJlZmVyZW5jZWRUYWJsZU5hbWUsJ1xuICArICdSRUZFUkVOQ0VEX0NPTFVNTl9OQU1FIGFzIHJlZmVyZW5jZWRDb2x1bW5OYW1lJztcblxuY29uc3QgdHlwZVdpdGhvdXREZWZhdWx0ID0gbmV3IFNldChbJ0JMT0InLCAnVEVYVCcsICdHRU9NRVRSWScsICdKU09OJ10pO1xuXG5jbGFzcyBNeVNRTFF1ZXJ5R2VuZXJhdG9yIGV4dGVuZHMgQWJzdHJhY3RRdWVyeUdlbmVyYXRvciB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBzdXBlcihvcHRpb25zKTtcblxuICAgIHRoaXMuT3BlcmF0b3JNYXAgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLk9wZXJhdG9yTWFwLCB7XG4gICAgICBbT3AucmVnZXhwXTogJ1JFR0VYUCcsXG4gICAgICBbT3Aubm90UmVnZXhwXTogJ05PVCBSRUdFWFAnXG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KGRhdGFiYXNlTmFtZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGNoYXJzZXQ6IG51bGwsXG4gICAgICBjb2xsYXRlOiBudWxsXG4gICAgfSwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICBjb25zdCBkYXRhYmFzZSA9IHRoaXMucXVvdGVJZGVudGlmaWVyKGRhdGFiYXNlTmFtZSk7XG4gICAgY29uc3QgY2hhcnNldCA9IG9wdGlvbnMuY2hhcnNldCA/IGAgREVGQVVMVCBDSEFSQUNURVIgU0VUICR7dGhpcy5lc2NhcGUob3B0aW9ucy5jaGFyc2V0KX1gIDogJyc7XG4gICAgY29uc3QgY29sbGF0ZSA9IG9wdGlvbnMuY29sbGF0ZSA/IGAgREVGQVVMVCBDT0xMQVRFICR7dGhpcy5lc2NhcGUob3B0aW9ucy5jb2xsYXRlKX1gIDogJyc7XG5cbiAgICByZXR1cm4gYCR7YENSRUFURSBEQVRBQkFTRSBJRiBOT1QgRVhJU1RTICR7ZGF0YWJhc2V9JHtjaGFyc2V0fSR7Y29sbGF0ZX1gLnRyaW0oKX07YDtcbiAgfVxuXG4gIGRyb3BEYXRhYmFzZVF1ZXJ5KGRhdGFiYXNlTmFtZSkge1xuICAgIHJldHVybiBgRFJPUCBEQVRBQkFTRSBJRiBFWElTVFMgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihkYXRhYmFzZU5hbWUpLnRyaW0oKX07YDtcbiAgfVxuXG4gIGNyZWF0ZVNjaGVtYSgpIHtcbiAgICByZXR1cm4gJ1NIT1cgVEFCTEVTJztcbiAgfVxuXG4gIHNob3dTY2hlbWFzUXVlcnkoKSB7XG4gICAgcmV0dXJuICdTSE9XIFRBQkxFUyc7XG4gIH1cblxuICB2ZXJzaW9uUXVlcnkoKSB7XG4gICAgcmV0dXJuICdTRUxFQ1QgVkVSU0lPTigpIGFzIGB2ZXJzaW9uYCc7XG4gIH1cblxuICBjcmVhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgYXR0cmlidXRlcywgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGVuZ2luZTogJ0lubm9EQicsXG4gICAgICBjaGFyc2V0OiBudWxsLFxuICAgICAgcm93Rm9ybWF0OiBudWxsXG4gICAgfSwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICBjb25zdCBwcmltYXJ5S2V5cyA9IFtdO1xuICAgIGNvbnN0IGZvcmVpZ25LZXlzID0ge307XG4gICAgY29uc3QgYXR0clN0ciA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBhdHRyIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGF0dHJpYnV0ZXMsIGF0dHIpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGRhdGFUeXBlID0gYXR0cmlidXRlc1thdHRyXTtcbiAgICAgIGxldCBtYXRjaDtcblxuICAgICAgaWYgKGRhdGFUeXBlLmluY2x1ZGVzKCdQUklNQVJZIEtFWScpKSB7XG4gICAgICAgIHByaW1hcnlLZXlzLnB1c2goYXR0cik7XG5cbiAgICAgICAgaWYgKGRhdGFUeXBlLmluY2x1ZGVzKCdSRUZFUkVOQ0VTJykpIHtcbiAgICAgICAgICAvLyBNeVNRTCBkb2Vzbid0IHN1cHBvcnQgaW5saW5lIFJFRkVSRU5DRVMgZGVjbGFyYXRpb25zOiBtb3ZlIHRvIHRoZSBlbmRcbiAgICAgICAgICBtYXRjaCA9IGRhdGFUeXBlLm1hdGNoKC9eKC4rKSAoUkVGRVJFTkNFUy4qKSQvKTtcbiAgICAgICAgICBhdHRyU3RyLnB1c2goYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cil9ICR7bWF0Y2hbMV0ucmVwbGFjZSgnUFJJTUFSWSBLRVknLCAnJyl9YCk7XG4gICAgICAgICAgZm9yZWlnbktleXNbYXR0cl0gPSBtYXRjaFsyXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhdHRyU3RyLnB1c2goYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cil9ICR7ZGF0YVR5cGUucmVwbGFjZSgnUFJJTUFSWSBLRVknLCAnJyl9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YVR5cGUuaW5jbHVkZXMoJ1JFRkVSRU5DRVMnKSkge1xuICAgICAgICAvLyBNeVNRTCBkb2Vzbid0IHN1cHBvcnQgaW5saW5lIFJFRkVSRU5DRVMgZGVjbGFyYXRpb25zOiBtb3ZlIHRvIHRoZSBlbmRcbiAgICAgICAgbWF0Y2ggPSBkYXRhVHlwZS5tYXRjaCgvXiguKykgKFJFRkVSRU5DRVMuKikkLyk7XG4gICAgICAgIGF0dHJTdHIucHVzaChgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKX0gJHttYXRjaFsxXX1gKTtcbiAgICAgICAgZm9yZWlnbktleXNbYXR0cl0gPSBtYXRjaFsyXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJTdHIucHVzaChgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyKX0gJHtkYXRhVHlwZX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0YWJsZSA9IHRoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpO1xuICAgIGxldCBhdHRyaWJ1dGVzQ2xhdXNlID0gYXR0clN0ci5qb2luKCcsICcpO1xuICAgIGNvbnN0IGNvbW1lbnQgPSBvcHRpb25zLmNvbW1lbnQgJiYgdHlwZW9mIG9wdGlvbnMuY29tbWVudCA9PT0gJ3N0cmluZycgPyBgIENPTU1FTlQgJHt0aGlzLmVzY2FwZShvcHRpb25zLmNvbW1lbnQpfWAgOiAnJztcbiAgICBjb25zdCBlbmdpbmUgPSBvcHRpb25zLmVuZ2luZTtcbiAgICBjb25zdCBjaGFyc2V0ID0gb3B0aW9ucy5jaGFyc2V0ID8gYCBERUZBVUxUIENIQVJTRVQ9JHtvcHRpb25zLmNoYXJzZXR9YCA6ICcnO1xuICAgIGNvbnN0IGNvbGxhdGlvbiA9IG9wdGlvbnMuY29sbGF0ZSA/IGAgQ09MTEFURSAke29wdGlvbnMuY29sbGF0ZX1gIDogJyc7XG4gICAgY29uc3Qgcm93Rm9ybWF0ID0gb3B0aW9ucy5yb3dGb3JtYXQgPyBgIFJPV19GT1JNQVQ9JHtvcHRpb25zLnJvd0Zvcm1hdH1gIDogJyc7XG4gICAgY29uc3QgaW5pdGlhbEF1dG9JbmNyZW1lbnQgPSBvcHRpb25zLmluaXRpYWxBdXRvSW5jcmVtZW50ID8gYCBBVVRPX0lOQ1JFTUVOVD0ke29wdGlvbnMuaW5pdGlhbEF1dG9JbmNyZW1lbnR9YCA6ICcnO1xuICAgIGNvbnN0IHBrU3RyaW5nID0gcHJpbWFyeUtleXMubWFwKHBrID0+IHRoaXMucXVvdGVJZGVudGlmaWVyKHBrKSkuam9pbignLCAnKTtcblxuICAgIGlmIChvcHRpb25zLnVuaXF1ZUtleXMpIHtcbiAgICAgIF8uZWFjaChvcHRpb25zLnVuaXF1ZUtleXMsIChjb2x1bW5zLCBpbmRleE5hbWUpID0+IHtcbiAgICAgICAgaWYgKGNvbHVtbnMuY3VzdG9tSW5kZXgpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGluZGV4TmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGluZGV4TmFtZSA9IGB1bmlxXyR7dGFibGVOYW1lfV8ke2NvbHVtbnMuZmllbGRzLmpvaW4oJ18nKX1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhdHRyaWJ1dGVzQ2xhdXNlICs9IGAsIFVOSVFVRSAke3RoaXMucXVvdGVJZGVudGlmaWVyKGluZGV4TmFtZSl9ICgke2NvbHVtbnMuZmllbGRzLm1hcChmaWVsZCA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihmaWVsZCkpLmpvaW4oJywgJyl9KWA7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChwa1N0cmluZy5sZW5ndGggPiAwKSB7XG4gICAgICBhdHRyaWJ1dGVzQ2xhdXNlICs9IGAsIFBSSU1BUlkgS0VZICgke3BrU3RyaW5nfSlgO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgZmtleSBpbiBmb3JlaWduS2V5cykge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChmb3JlaWduS2V5cywgZmtleSkpIHtcbiAgICAgICAgYXR0cmlidXRlc0NsYXVzZSArPSBgLCBGT1JFSUdOIEtFWSAoJHt0aGlzLnF1b3RlSWRlbnRpZmllcihma2V5KX0pICR7Zm9yZWlnbktleXNbZmtleV19YDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYENSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTICR7dGFibGV9ICgke2F0dHJpYnV0ZXNDbGF1c2V9KSBFTkdJTkU9JHtlbmdpbmV9JHtjb21tZW50fSR7Y2hhcnNldH0ke2NvbGxhdGlvbn0ke2luaXRpYWxBdXRvSW5jcmVtZW50fSR7cm93Rm9ybWF0fTtgO1xuICB9XG5cblxuICBkZXNjcmliZVRhYmxlUXVlcnkodGFibGVOYW1lLCBzY2hlbWEsIHNjaGVtYURlbGltaXRlcikge1xuICAgIGNvbnN0IHRhYmxlID0gdGhpcy5xdW90ZVRhYmxlKFxuICAgICAgdGhpcy5hZGRTY2hlbWEoe1xuICAgICAgICB0YWJsZU5hbWUsXG4gICAgICAgIF9zY2hlbWE6IHNjaGVtYSxcbiAgICAgICAgX3NjaGVtYURlbGltaXRlcjogc2NoZW1hRGVsaW1pdGVyXG4gICAgICB9KVxuICAgICk7XG5cbiAgICByZXR1cm4gYFNIT1cgRlVMTCBDT0xVTU5TIEZST00gJHt0YWJsZX07YDtcbiAgfVxuXG4gIHNob3dUYWJsZXNRdWVyeShkYXRhYmFzZSkge1xuICAgIGxldCBxdWVyeSA9ICdTRUxFQ1QgVEFCTEVfTkFNRSBGUk9NIElORk9STUFUSU9OX1NDSEVNQS5UQUJMRVMgV0hFUkUgVEFCTEVfVFlQRSA9IFxcJ0JBU0UgVEFCTEVcXCcnO1xuICAgIGlmIChkYXRhYmFzZSkge1xuICAgICAgcXVlcnkgKz0gYCBBTkQgVEFCTEVfU0NIRU1BID0gJHt0aGlzLmVzY2FwZShkYXRhYmFzZSl9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgcXVlcnkgKz0gJyBBTkQgVEFCTEVfU0NIRU1BIE5PVCBJTiAoXFwnTVlTUUxcXCcsIFxcJ0lORk9STUFUSU9OX1NDSEVNQVxcJywgXFwnUEVSRk9STUFOQ0VfU0NIRU1BXFwnLCBcXCdTWVNcXCcpJztcbiAgICB9XG4gICAgcmV0dXJuIGAke3F1ZXJ5fTtgO1xuICB9XG5cbiAgYWRkQ29sdW1uUXVlcnkodGFibGUsIGtleSwgZGF0YVR5cGUpIHtcbiAgICBjb25zdCBkZWZpbml0aW9uID0gdGhpcy5hdHRyaWJ1dGVUb1NRTChkYXRhVHlwZSwge1xuICAgICAgY29udGV4dDogJ2FkZENvbHVtbicsXG4gICAgICB0YWJsZU5hbWU6IHRhYmxlLFxuICAgICAgZm9yZWlnbktleToga2V5XG4gICAgfSk7XG5cbiAgICByZXR1cm4gYEFMVEVSIFRBQkxFICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlKX0gQUREICR7dGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KX0gJHtkZWZpbml0aW9ufTtgO1xuICB9XG5cbiAgcmVtb3ZlQ29sdW1uUXVlcnkodGFibGVOYW1lLCBhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIGBBTFRFUiBUQUJMRSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfSBEUk9QICR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cmlidXRlTmFtZSl9O2A7XG4gIH1cblxuICBjaGFuZ2VDb2x1bW5RdWVyeSh0YWJsZU5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCBhdHRyU3RyaW5nID0gW107XG4gICAgY29uc3QgY29uc3RyYWludFN0cmluZyA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGxldCBkZWZpbml0aW9uID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGlmIChkZWZpbml0aW9uLmluY2x1ZGVzKCdSRUZFUkVOQ0VTJykpIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgZGVmaW5pdGlvbiA9IGRlZmluaXRpb24ucmVwbGFjZSgvLis/KD89UkVGRVJFTkNFUykvLCAnJyk7XG4gICAgICAgIGNvbnN0cmFpbnRTdHJpbmcucHVzaChgRk9SRUlHTiBLRVkgKCR7YXR0ck5hbWV9KSAke2RlZmluaXRpb259YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdHRyU3RyaW5nLnB1c2goYFxcYCR7YXR0cmlidXRlTmFtZX1cXGAgXFxgJHthdHRyaWJ1dGVOYW1lfVxcYCAke2RlZmluaXRpb259YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGZpbmFsUXVlcnkgPSAnJztcbiAgICBpZiAoYXR0clN0cmluZy5sZW5ndGgpIHtcbiAgICAgIGZpbmFsUXVlcnkgKz0gYENIQU5HRSAke2F0dHJTdHJpbmcuam9pbignLCAnKX1gO1xuICAgICAgZmluYWxRdWVyeSArPSBjb25zdHJhaW50U3RyaW5nLmxlbmd0aCA/ICcgJyA6ICcnO1xuICAgIH1cbiAgICBpZiAoY29uc3RyYWludFN0cmluZy5sZW5ndGgpIHtcbiAgICAgIGZpbmFsUXVlcnkgKz0gYEFERCAke2NvbnN0cmFpbnRTdHJpbmcuam9pbignLCAnKX1gO1xuICAgIH1cblxuICAgIHJldHVybiBgQUxURVIgVEFCTEUgJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX0gJHtmaW5hbFF1ZXJ5fTtgO1xuICB9XG5cbiAgcmVuYW1lQ29sdW1uUXVlcnkodGFibGVOYW1lLCBhdHRyQmVmb3JlLCBhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgYXR0clN0cmluZyA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBhdHRyTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBkZWZpbml0aW9uID0gYXR0cmlidXRlc1thdHRyTmFtZV07XG4gICAgICBhdHRyU3RyaW5nLnB1c2goYFxcYCR7YXR0ckJlZm9yZX1cXGAgXFxgJHthdHRyTmFtZX1cXGAgJHtkZWZpbml0aW9ufWApO1xuICAgIH1cblxuICAgIHJldHVybiBgQUxURVIgVEFCTEUgJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX0gQ0hBTkdFICR7YXR0clN0cmluZy5qb2luKCcsICcpfTtgO1xuICB9XG5cbiAgaGFuZGxlU2VxdWVsaXplTWV0aG9kKHNtdGgsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCkge1xuICAgIGlmIChzbXRoIGluc3RhbmNlb2YgVXRpbHMuSnNvbikge1xuICAgICAgLy8gUGFyc2UgbmVzdGVkIG9iamVjdFxuICAgICAgaWYgKHNtdGguY29uZGl0aW9ucykge1xuICAgICAgICBjb25zdCBjb25kaXRpb25zID0gdGhpcy5wYXJzZUNvbmRpdGlvbk9iamVjdChzbXRoLmNvbmRpdGlvbnMpLm1hcChjb25kaXRpb24gPT5cbiAgICAgICAgICBgJHt0aGlzLmpzb25QYXRoRXh0cmFjdGlvblF1ZXJ5KGNvbmRpdGlvbi5wYXRoWzBdLCBfLnRhaWwoY29uZGl0aW9uLnBhdGgpKX0gPSAnJHtjb25kaXRpb24udmFsdWV9J2BcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gY29uZGl0aW9ucy5qb2luKCcgQU5EICcpO1xuICAgICAgfVxuICAgICAgaWYgKHNtdGgucGF0aCkge1xuICAgICAgICBsZXQgc3RyO1xuXG4gICAgICAgIC8vIEFsbG93IHNwZWNpZnlpbmcgY29uZGl0aW9ucyB1c2luZyB0aGUgc3FsaXRlIGpzb24gZnVuY3Rpb25zXG4gICAgICAgIGlmICh0aGlzLl9jaGVja1ZhbGlkSnNvblN0YXRlbWVudChzbXRoLnBhdGgpKSB7XG4gICAgICAgICAgc3RyID0gc210aC5wYXRoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEFsc28gc3VwcG9ydCBqc29uIHByb3BlcnR5IGFjY2Vzc29yc1xuICAgICAgICAgIGNvbnN0IHBhdGhzID0gXy50b1BhdGgoc210aC5wYXRoKTtcbiAgICAgICAgICBjb25zdCBjb2x1bW4gPSBwYXRocy5zaGlmdCgpO1xuICAgICAgICAgIHN0ciA9IHRoaXMuanNvblBhdGhFeHRyYWN0aW9uUXVlcnkoY29sdW1uLCBwYXRocyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc210aC52YWx1ZSkge1xuICAgICAgICAgIHN0ciArPSB1dGlsLmZvcm1hdCgnID0gJXMnLCB0aGlzLmVzY2FwZShzbXRoLnZhbHVlKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoc210aCBpbnN0YW5jZW9mIFV0aWxzLkNhc3QpIHtcbiAgICAgIGlmICgvdGltZXN0YW1wL2kudGVzdChzbXRoLnR5cGUpKSB7XG4gICAgICAgIHNtdGgudHlwZSA9ICdkYXRldGltZSc7XG4gICAgICB9IGVsc2UgaWYgKHNtdGguanNvbiAmJiAvYm9vbGVhbi9pLnRlc3Qoc210aC50eXBlKSkge1xuICAgICAgICAvLyB0cnVlIG9yIGZhbHNlIGNhbm5vdCBiZSBjYXN0ZWQgYXMgYm9vbGVhbnMgd2l0aGluIGEgSlNPTiBzdHJ1Y3R1cmVcbiAgICAgICAgc210aC50eXBlID0gJ2NoYXInO1xuICAgICAgfSBlbHNlIGlmICgvZG91YmxlIHByZWNpc2lvbi9pLnRlc3Qoc210aC50eXBlKSB8fCAvYm9vbGVhbi9pLnRlc3Qoc210aC50eXBlKSB8fCAvaW50ZWdlci9pLnRlc3Qoc210aC50eXBlKSkge1xuICAgICAgICBzbXRoLnR5cGUgPSAnZGVjaW1hbCc7XG4gICAgICB9IGVsc2UgaWYgKC90ZXh0L2kudGVzdChzbXRoLnR5cGUpKSB7XG4gICAgICAgIHNtdGgudHlwZSA9ICdjaGFyJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3VwZXIuaGFuZGxlU2VxdWVsaXplTWV0aG9kKHNtdGgsIHRhYmxlTmFtZSwgZmFjdG9yeSwgb3B0aW9ucywgcHJlcGVuZCk7XG4gIH1cblxuICBfdG9KU09OVmFsdWUodmFsdWUpIHtcbiAgICAvLyB0cnVlL2ZhbHNlIGFyZSBzdG9yZWQgYXMgc3RyaW5ncyBpbiBteXNxbFxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIC8vIG51bGwgaXMgc3RvcmVkIGFzIGEgc3RyaW5nIGluIG15c3FsXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gJ251bGwnO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICB1cHNlcnRRdWVyeSh0YWJsZU5hbWUsIGluc2VydFZhbHVlcywgdXBkYXRlVmFsdWVzLCB3aGVyZSwgbW9kZWwsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zLm9uRHVwbGljYXRlID0gJ1VQREFURSAnO1xuXG4gICAgb3B0aW9ucy5vbkR1cGxpY2F0ZSArPSBPYmplY3Qua2V5cyh1cGRhdGVWYWx1ZXMpLm1hcChrZXkgPT4ge1xuICAgICAga2V5ID0gdGhpcy5xdW90ZUlkZW50aWZpZXIoa2V5KTtcbiAgICAgIHJldHVybiBgJHtrZXl9PVZBTFVFUygke2tleX0pYDtcbiAgICB9KS5qb2luKCcsICcpO1xuXG4gICAgcmV0dXJuIHRoaXMuaW5zZXJ0UXVlcnkodGFibGVOYW1lLCBpbnNlcnRWYWx1ZXMsIG1vZGVsLnJhd0F0dHJpYnV0ZXMsIG9wdGlvbnMpO1xuICB9XG5cbiAgdHJ1bmNhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSkge1xuICAgIHJldHVybiBgVFJVTkNBVEUgJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX1gO1xuICB9XG5cbiAgZGVsZXRlUXVlcnkodGFibGVOYW1lLCB3aGVyZSwgb3B0aW9ucyA9IHt9LCBtb2RlbCkge1xuICAgIGxldCBsaW1pdCA9ICcnO1xuICAgIGxldCBxdWVyeSA9IGBERUxFVEUgRlJPTSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfWA7XG5cbiAgICBpZiAob3B0aW9ucy5saW1pdCkge1xuICAgICAgbGltaXQgPSBgIExJTUlUICR7dGhpcy5lc2NhcGUob3B0aW9ucy5saW1pdCl9YDtcbiAgICB9XG5cbiAgICB3aGVyZSA9IHRoaXMuZ2V0V2hlcmVDb25kaXRpb25zKHdoZXJlLCBudWxsLCBtb2RlbCwgb3B0aW9ucyk7XG5cbiAgICBpZiAod2hlcmUpIHtcbiAgICAgIHF1ZXJ5ICs9IGAgV0hFUkUgJHt3aGVyZX1gO1xuICAgIH1cblxuICAgIHJldHVybiBxdWVyeSArIGxpbWl0O1xuICB9XG5cbiAgc2hvd0luZGV4ZXNRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gYFNIT1cgSU5ERVggRlJPTSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfSR7KG9wdGlvbnMgfHwge30pLmRhdGFiYXNlID8gYCBGUk9NIFxcYCR7b3B0aW9ucy5kYXRhYmFzZX1cXGBgIDogJyd9YDtcbiAgfVxuXG4gIHNob3dDb25zdHJhaW50c1F1ZXJ5KHRhYmxlLCBjb25zdHJhaW50TmFtZSkge1xuICAgIGNvbnN0IHRhYmxlTmFtZSA9IHRhYmxlLnRhYmxlTmFtZSB8fCB0YWJsZTtcbiAgICBjb25zdCBzY2hlbWFOYW1lID0gdGFibGUuc2NoZW1hO1xuXG4gICAgbGV0IHNxbCA9IFtcbiAgICAgICdTRUxFQ1QgQ09OU1RSQUlOVF9DQVRBTE9HIEFTIGNvbnN0cmFpbnRDYXRhbG9nLCcsXG4gICAgICAnQ09OU1RSQUlOVF9OQU1FIEFTIGNvbnN0cmFpbnROYW1lLCcsXG4gICAgICAnQ09OU1RSQUlOVF9TQ0hFTUEgQVMgY29uc3RyYWludFNjaGVtYSwnLFxuICAgICAgJ0NPTlNUUkFJTlRfVFlQRSBBUyBjb25zdHJhaW50VHlwZSwnLFxuICAgICAgJ1RBQkxFX05BTUUgQVMgdGFibGVOYW1lLCcsXG4gICAgICAnVEFCTEVfU0NIRU1BIEFTIHRhYmxlU2NoZW1hJyxcbiAgICAgICdmcm9tIElORk9STUFUSU9OX1NDSEVNQS5UQUJMRV9DT05TVFJBSU5UUycsXG4gICAgICBgV0hFUkUgdGFibGVfbmFtZT0nJHt0YWJsZU5hbWV9J2BcbiAgICBdLmpvaW4oJyAnKTtcblxuICAgIGlmIChjb25zdHJhaW50TmFtZSkge1xuICAgICAgc3FsICs9IGAgQU5EIGNvbnN0cmFpbnRfbmFtZSA9ICcke2NvbnN0cmFpbnROYW1lfSdgO1xuICAgIH1cblxuICAgIGlmIChzY2hlbWFOYW1lKSB7XG4gICAgICBzcWwgKz0gYCBBTkQgVEFCTEVfU0NIRU1BID0gJyR7c2NoZW1hTmFtZX0nYDtcbiAgICB9XG5cbiAgICByZXR1cm4gYCR7c3FsfTtgO1xuICB9XG5cbiAgcmVtb3ZlSW5kZXhRdWVyeSh0YWJsZU5hbWUsIGluZGV4TmFtZU9yQXR0cmlidXRlcykge1xuICAgIGxldCBpbmRleE5hbWUgPSBpbmRleE5hbWVPckF0dHJpYnV0ZXM7XG5cbiAgICBpZiAodHlwZW9mIGluZGV4TmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGluZGV4TmFtZSA9IFV0aWxzLnVuZGVyc2NvcmUoYCR7dGFibGVOYW1lfV8ke2luZGV4TmFtZU9yQXR0cmlidXRlcy5qb2luKCdfJyl9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGBEUk9QIElOREVYICR7dGhpcy5xdW90ZUlkZW50aWZpZXIoaW5kZXhOYW1lKX0gT04gJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX1gO1xuICB9XG5cbiAgYXR0cmlidXRlVG9TUUwoYXR0cmlidXRlLCBvcHRpb25zKSB7XG4gICAgaWYgKCFfLmlzUGxhaW5PYmplY3QoYXR0cmlidXRlKSkge1xuICAgICAgYXR0cmlidXRlID0ge1xuICAgICAgICB0eXBlOiBhdHRyaWJ1dGVcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgYXR0cmlidXRlU3RyaW5nID0gYXR0cmlidXRlLnR5cGUudG9TdHJpbmcoeyBlc2NhcGU6IHRoaXMuZXNjYXBlLmJpbmQodGhpcykgfSk7XG4gICAgbGV0IHRlbXBsYXRlID0gYXR0cmlidXRlU3RyaW5nO1xuXG4gICAgaWYgKGF0dHJpYnV0ZS5hbGxvd051bGwgPT09IGZhbHNlKSB7XG4gICAgICB0ZW1wbGF0ZSArPSAnIE5PVCBOVUxMJztcbiAgICB9XG5cbiAgICBpZiAoYXR0cmlidXRlLmF1dG9JbmNyZW1lbnQpIHtcbiAgICAgIHRlbXBsYXRlICs9ICcgYXV0b19pbmNyZW1lbnQnO1xuICAgIH1cblxuICAgIC8vIEJMT0IvVEVYVC9HRU9NRVRSWS9KU09OIGNhbm5vdCBoYXZlIGEgZGVmYXVsdCB2YWx1ZVxuICAgIGlmICghdHlwZVdpdGhvdXREZWZhdWx0LmhhcyhhdHRyaWJ1dGVTdHJpbmcpXG4gICAgICAmJiBhdHRyaWJ1dGUudHlwZS5fYmluYXJ5ICE9PSB0cnVlXG4gICAgICAmJiBVdGlscy5kZWZhdWx0VmFsdWVTY2hlbWFibGUoYXR0cmlidXRlLmRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgIHRlbXBsYXRlICs9IGAgREVGQVVMVCAke3RoaXMuZXNjYXBlKGF0dHJpYnV0ZS5kZWZhdWx0VmFsdWUpfWA7XG4gICAgfVxuXG4gICAgaWYgKGF0dHJpYnV0ZS51bmlxdWUgPT09IHRydWUpIHtcbiAgICAgIHRlbXBsYXRlICs9ICcgVU5JUVVFJztcbiAgICB9XG5cbiAgICBpZiAoYXR0cmlidXRlLnByaW1hcnlLZXkpIHtcbiAgICAgIHRlbXBsYXRlICs9ICcgUFJJTUFSWSBLRVknO1xuICAgIH1cblxuICAgIGlmIChhdHRyaWJ1dGUuY29tbWVudCkge1xuICAgICAgdGVtcGxhdGUgKz0gYCBDT01NRU5UICR7dGhpcy5lc2NhcGUoYXR0cmlidXRlLmNvbW1lbnQpfWA7XG4gICAgfVxuXG4gICAgaWYgKGF0dHJpYnV0ZS5maXJzdCkge1xuICAgICAgdGVtcGxhdGUgKz0gJyBGSVJTVCc7XG4gICAgfVxuICAgIGlmIChhdHRyaWJ1dGUuYWZ0ZXIpIHtcbiAgICAgIHRlbXBsYXRlICs9IGAgQUZURVIgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyaWJ1dGUuYWZ0ZXIpfWA7XG4gICAgfVxuXG4gICAgaWYgKGF0dHJpYnV0ZS5yZWZlcmVuY2VzKSB7XG5cbiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuY29udGV4dCA9PT0gJ2FkZENvbHVtbicgJiYgb3B0aW9ucy5mb3JlaWduS2V5KSB7XG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXIob3B0aW9ucy5mb3JlaWduS2V5KTtcbiAgICAgICAgY29uc3QgZmtOYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXIoYCR7b3B0aW9ucy50YWJsZU5hbWV9XyR7YXR0ck5hbWV9X2ZvcmVpZ25faWR4YCk7XG5cbiAgICAgICAgdGVtcGxhdGUgKz0gYCwgQUREIENPTlNUUkFJTlQgJHtma05hbWV9IEZPUkVJR04gS0VZICgke2F0dHJOYW1lfSlgO1xuICAgICAgfVxuXG4gICAgICB0ZW1wbGF0ZSArPSBgIFJFRkVSRU5DRVMgJHt0aGlzLnF1b3RlVGFibGUoYXR0cmlidXRlLnJlZmVyZW5jZXMubW9kZWwpfWA7XG5cbiAgICAgIGlmIChhdHRyaWJ1dGUucmVmZXJlbmNlcy5rZXkpIHtcbiAgICAgICAgdGVtcGxhdGUgKz0gYCAoJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyaWJ1dGUucmVmZXJlbmNlcy5rZXkpfSlgO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGVtcGxhdGUgKz0gYCAoJHt0aGlzLnF1b3RlSWRlbnRpZmllcignaWQnKX0pYDtcbiAgICAgIH1cblxuICAgICAgaWYgKGF0dHJpYnV0ZS5vbkRlbGV0ZSkge1xuICAgICAgICB0ZW1wbGF0ZSArPSBgIE9OIERFTEVURSAke2F0dHJpYnV0ZS5vbkRlbGV0ZS50b1VwcGVyQ2FzZSgpfWA7XG4gICAgICB9XG5cbiAgICAgIGlmIChhdHRyaWJ1dGUub25VcGRhdGUpIHtcbiAgICAgICAgdGVtcGxhdGUgKz0gYCBPTiBVUERBVEUgJHthdHRyaWJ1dGUub25VcGRhdGUudG9VcHBlckNhc2UoKX1gO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfVxuXG4gIGF0dHJpYnV0ZXNUb1NRTChhdHRyaWJ1dGVzLCBvcHRpb25zKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICByZXN1bHRbYXR0cmlidXRlLmZpZWxkIHx8IGtleV0gPSB0aGlzLmF0dHJpYnV0ZVRvU1FMKGF0dHJpYnV0ZSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBzdGF0bWVtZW50IGlzIGpzb24gZnVuY3Rpb24gb3Igc2ltcGxlIHBhdGhcbiAgICpcbiAgICogQHBhcmFtICAge3N0cmluZ30gIHN0bXQgIFRoZSBzdGF0ZW1lbnQgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybnMge2Jvb2xlYW59ICAgICAgIHRydWUgaWYgdGhlIGdpdmVuIHN0YXRlbWVudCBpcyBqc29uIGZ1bmN0aW9uXG4gICAqIEB0aHJvd3MgIHtFcnJvcn0gICAgICAgICB0aHJvdyBpZiB0aGUgc3RhdGVtZW50IGxvb2tzIGxpa2UganNvbiBmdW5jdGlvbiBidXQgaGFzIGludmFsaWQgdG9rZW5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jaGVja1ZhbGlkSnNvblN0YXRlbWVudChzdG10KSB7XG4gICAgaWYgKHR5cGVvZiBzdG10ICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBjdXJyZW50SW5kZXggPSAwO1xuICAgIGxldCBvcGVuaW5nQnJhY2tldHMgPSAwO1xuICAgIGxldCBjbG9zaW5nQnJhY2tldHMgPSAwO1xuICAgIGxldCBoYXNKc29uRnVuY3Rpb24gPSBmYWxzZTtcbiAgICBsZXQgaGFzSW52YWxpZFRva2VuID0gZmFsc2U7XG5cbiAgICB3aGlsZSAoY3VycmVudEluZGV4IDwgc3RtdC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHN0cmluZyA9IHN0bXQuc3Vic3RyKGN1cnJlbnRJbmRleCk7XG4gICAgICBjb25zdCBmdW5jdGlvbk1hdGNoZXMgPSBqc29uRnVuY3Rpb25SZWdleC5leGVjKHN0cmluZyk7XG4gICAgICBpZiAoZnVuY3Rpb25NYXRjaGVzKSB7XG4gICAgICAgIGN1cnJlbnRJbmRleCArPSBmdW5jdGlvbk1hdGNoZXNbMF0uaW5kZXhPZignKCcpO1xuICAgICAgICBoYXNKc29uRnVuY3Rpb24gPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3BlcmF0b3JNYXRjaGVzID0ganNvbk9wZXJhdG9yUmVnZXguZXhlYyhzdHJpbmcpO1xuICAgICAgaWYgKG9wZXJhdG9yTWF0Y2hlcykge1xuICAgICAgICBjdXJyZW50SW5kZXggKz0gb3BlcmF0b3JNYXRjaGVzWzBdLmxlbmd0aDtcbiAgICAgICAgaGFzSnNvbkZ1bmN0aW9uID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRva2VuTWF0Y2hlcyA9IHRva2VuQ2FwdHVyZVJlZ2V4LmV4ZWMoc3RyaW5nKTtcbiAgICAgIGlmICh0b2tlbk1hdGNoZXMpIHtcbiAgICAgICAgY29uc3QgY2FwdHVyZWRUb2tlbiA9IHRva2VuTWF0Y2hlc1sxXTtcbiAgICAgICAgaWYgKGNhcHR1cmVkVG9rZW4gPT09ICcoJykge1xuICAgICAgICAgIG9wZW5pbmdCcmFja2V0cysrO1xuICAgICAgICB9IGVsc2UgaWYgKGNhcHR1cmVkVG9rZW4gPT09ICcpJykge1xuICAgICAgICAgIGNsb3NpbmdCcmFja2V0cysrO1xuICAgICAgICB9IGVsc2UgaWYgKGNhcHR1cmVkVG9rZW4gPT09ICc7Jykge1xuICAgICAgICAgIGhhc0ludmFsaWRUb2tlbiA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudEluZGV4ICs9IHRva2VuTWF0Y2hlc1swXS5sZW5ndGg7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpbnZhbGlkIGpzb24gc3RhdGVtZW50XG4gICAgaWYgKGhhc0pzb25GdW5jdGlvbiAmJiAoaGFzSW52YWxpZFRva2VuIHx8IG9wZW5pbmdCcmFja2V0cyAhPT0gY2xvc2luZ0JyYWNrZXRzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGpzb24gc3RhdGVtZW50OiAke3N0bXR9YCk7XG4gICAgfVxuXG4gICAgLy8gcmV0dXJuIHRydWUgaWYgdGhlIHN0YXRlbWVudCBoYXMgdmFsaWQganNvbiBmdW5jdGlvblxuICAgIHJldHVybiBoYXNKc29uRnVuY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGFuIFNRTCBxdWVyeSB0aGF0IHJldHVybnMgYWxsIGZvcmVpZ24ga2V5cyBvZiBhIHRhYmxlLlxuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IHRhYmxlICBUaGUgdGFibGUuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc2NoZW1hTmFtZSBUaGUgbmFtZSBvZiB0aGUgc2NoZW1hLlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAgICAgICAgICAgIFRoZSBnZW5lcmF0ZWQgc3FsIHF1ZXJ5LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZ2V0Rm9yZWlnbktleXNRdWVyeSh0YWJsZSwgc2NoZW1hTmFtZSkge1xuICAgIGNvbnN0IHRhYmxlTmFtZSA9IHRhYmxlLnRhYmxlTmFtZSB8fCB0YWJsZTtcbiAgICByZXR1cm4gYFNFTEVDVCAke2ZvcmVpZ25LZXlGaWVsZHN9IEZST00gSU5GT1JNQVRJT05fU0NIRU1BLktFWV9DT0xVTU5fVVNBR0Ugd2hlcmUgVEFCTEVfTkFNRSA9ICcke3RhYmxlTmFtZX0nIEFORCBDT05TVFJBSU5UX05BTUUhPSdQUklNQVJZJyBBTkQgQ09OU1RSQUlOVF9TQ0hFTUE9JyR7c2NoZW1hTmFtZX0nIEFORCBSRUZFUkVOQ0VEX1RBQkxFX05BTUUgSVMgTk9UIE5VTEw7YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYW4gU1FMIHF1ZXJ5IHRoYXQgcmV0dXJucyB0aGUgZm9yZWlnbiBrZXkgY29uc3RyYWludCBvZiBhIGdpdmVuIGNvbHVtbi5cbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSB0YWJsZSAgVGhlIHRhYmxlLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGNvbHVtbk5hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbHVtbi5cbiAgICogQHJldHVybnMge3N0cmluZ30gICAgICAgICAgICBUaGUgZ2VuZXJhdGVkIHNxbCBxdWVyeS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGdldEZvcmVpZ25LZXlRdWVyeSh0YWJsZSwgY29sdW1uTmFtZSkge1xuICAgIGNvbnN0IHF1b3RlZFNjaGVtYU5hbWUgPSB0YWJsZS5zY2hlbWEgPyB3cmFwU2luZ2xlUXVvdGUodGFibGUuc2NoZW1hKSA6ICcnO1xuICAgIGNvbnN0IHF1b3RlZFRhYmxlTmFtZSA9IHdyYXBTaW5nbGVRdW90ZSh0YWJsZS50YWJsZU5hbWUgfHwgdGFibGUpO1xuICAgIGNvbnN0IHF1b3RlZENvbHVtbk5hbWUgPSB3cmFwU2luZ2xlUXVvdGUoY29sdW1uTmFtZSk7XG5cbiAgICByZXR1cm4gYFNFTEVDVCAke2ZvcmVpZ25LZXlGaWVsZHN9IEZST00gSU5GT1JNQVRJT05fU0NIRU1BLktFWV9DT0xVTU5fVVNBR0VgXG4gICAgICArIGAgV0hFUkUgKFJFRkVSRU5DRURfVEFCTEVfTkFNRSA9ICR7cXVvdGVkVGFibGVOYW1lfSR7dGFibGUuc2NoZW1hXG4gICAgICAgID8gYCBBTkQgUkVGRVJFTkNFRF9UQUJMRV9TQ0hFTUEgPSAke3F1b3RlZFNjaGVtYU5hbWV9YFxuICAgICAgICA6ICcnfSBBTkQgUkVGRVJFTkNFRF9DT0xVTU5fTkFNRSA9ICR7cXVvdGVkQ29sdW1uTmFtZX0pYFxuICAgICAgKyBgIE9SIChUQUJMRV9OQU1FID0gJHtxdW90ZWRUYWJsZU5hbWV9JHt0YWJsZS5zY2hlbWEgP1xuICAgICAgICBgIEFORCBUQUJMRV9TQ0hFTUEgPSAke3F1b3RlZFNjaGVtYU5hbWV9YCA6ICcnfSBBTkQgQ09MVU1OX05BTUUgPSAke3F1b3RlZENvbHVtbk5hbWV9IEFORCBSRUZFUkVOQ0VEX1RBQkxFX05BTUUgSVMgTk9UIE5VTEwpYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYW4gU1FMIHF1ZXJ5IHRoYXQgcmVtb3ZlcyBhIGZvcmVpZ24ga2V5IGZyb20gYSB0YWJsZS5cbiAgICpcbiAgICogQHBhcmFtICB7c3RyaW5nfSB0YWJsZU5hbWUgIFRoZSBuYW1lIG9mIHRoZSB0YWJsZS5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBmb3JlaWduS2V5IFRoZSBuYW1lIG9mIHRoZSBmb3JlaWduIGtleSBjb25zdHJhaW50LlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAgICAgICAgICAgIFRoZSBnZW5lcmF0ZWQgc3FsIHF1ZXJ5LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZHJvcEZvcmVpZ25LZXlRdWVyeSh0YWJsZU5hbWUsIGZvcmVpZ25LZXkpIHtcbiAgICByZXR1cm4gYEFMVEVSIFRBQkxFICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9XG4gICAgICBEUk9QIEZPUkVJR04gS0VZICR7dGhpcy5xdW90ZUlkZW50aWZpZXIoZm9yZWlnbktleSl9O2A7XG4gIH1cbn1cblxuLy8gcHJpdmF0ZSBtZXRob2RzXG5mdW5jdGlvbiB3cmFwU2luZ2xlUXVvdGUoaWRlbnRpZmllcikge1xuICByZXR1cm4gVXRpbHMuYWRkVGlja3MoaWRlbnRpZmllciwgJ1xcJycpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE15U1FMUXVlcnlHZW5lcmF0b3I7Il19