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

let MySQLQueryGenerator =
/*#__PURE__*/
function (_AbstractQueryGenerat) {
  _inherits(MySQLQueryGenerator, _AbstractQueryGenerat);

  function MySQLQueryGenerator(options) {
    var _this;

    _classCallCheck(this, MySQLQueryGenerator);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(MySQLQueryGenerator).call(this, options));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9teXNxbC9xdWVyeS1nZW5lcmF0b3IuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJVdGlscyIsIkFic3RyYWN0UXVlcnlHZW5lcmF0b3IiLCJ1dGlsIiwiT3AiLCJqc29uRnVuY3Rpb25SZWdleCIsImpzb25PcGVyYXRvclJlZ2V4IiwidG9rZW5DYXB0dXJlUmVnZXgiLCJmb3JlaWduS2V5RmllbGRzIiwidHlwZVdpdGhvdXREZWZhdWx0IiwiU2V0IiwiTXlTUUxRdWVyeUdlbmVyYXRvciIsIm9wdGlvbnMiLCJPcGVyYXRvck1hcCIsIk9iamVjdCIsImFzc2lnbiIsInJlZ2V4cCIsIm5vdFJlZ2V4cCIsImRhdGFiYXNlTmFtZSIsImNoYXJzZXQiLCJjb2xsYXRlIiwiZGF0YWJhc2UiLCJxdW90ZUlkZW50aWZpZXIiLCJlc2NhcGUiLCJ0cmltIiwidGFibGVOYW1lIiwiYXR0cmlidXRlcyIsImVuZ2luZSIsInJvd0Zvcm1hdCIsInByaW1hcnlLZXlzIiwiZm9yZWlnbktleXMiLCJhdHRyU3RyIiwiYXR0ciIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImRhdGFUeXBlIiwibWF0Y2giLCJpbmNsdWRlcyIsInB1c2giLCJyZXBsYWNlIiwidGFibGUiLCJxdW90ZVRhYmxlIiwiYXR0cmlidXRlc0NsYXVzZSIsImpvaW4iLCJjb21tZW50IiwiY29sbGF0aW9uIiwiaW5pdGlhbEF1dG9JbmNyZW1lbnQiLCJwa1N0cmluZyIsIm1hcCIsInBrIiwidW5pcXVlS2V5cyIsImVhY2giLCJjb2x1bW5zIiwiaW5kZXhOYW1lIiwiY3VzdG9tSW5kZXgiLCJmaWVsZHMiLCJmaWVsZCIsImxlbmd0aCIsImZrZXkiLCJzY2hlbWEiLCJzY2hlbWFEZWxpbWl0ZXIiLCJhZGRTY2hlbWEiLCJfc2NoZW1hIiwiX3NjaGVtYURlbGltaXRlciIsInF1ZXJ5Iiwia2V5IiwiZGVmaW5pdGlvbiIsImF0dHJpYnV0ZVRvU1FMIiwiY29udGV4dCIsImZvcmVpZ25LZXkiLCJhdHRyaWJ1dGVOYW1lIiwiYXR0clN0cmluZyIsImNvbnN0cmFpbnRTdHJpbmciLCJhdHRyTmFtZSIsImZpbmFsUXVlcnkiLCJhdHRyQmVmb3JlIiwic210aCIsImZhY3RvcnkiLCJwcmVwZW5kIiwiSnNvbiIsImNvbmRpdGlvbnMiLCJwYXJzZUNvbmRpdGlvbk9iamVjdCIsImNvbmRpdGlvbiIsImpzb25QYXRoRXh0cmFjdGlvblF1ZXJ5IiwicGF0aCIsInRhaWwiLCJ2YWx1ZSIsInN0ciIsIl9jaGVja1ZhbGlkSnNvblN0YXRlbWVudCIsInBhdGhzIiwidG9QYXRoIiwiY29sdW1uIiwic2hpZnQiLCJmb3JtYXQiLCJDYXN0IiwidGVzdCIsInR5cGUiLCJqc29uIiwidG9TdHJpbmciLCJpbnNlcnRWYWx1ZXMiLCJ1cGRhdGVWYWx1ZXMiLCJ3aGVyZSIsIm1vZGVsIiwib25EdXBsaWNhdGUiLCJrZXlzIiwiaW5zZXJ0UXVlcnkiLCJyYXdBdHRyaWJ1dGVzIiwibGltaXQiLCJnZXRXaGVyZUNvbmRpdGlvbnMiLCJjb25zdHJhaW50TmFtZSIsInNjaGVtYU5hbWUiLCJzcWwiLCJpbmRleE5hbWVPckF0dHJpYnV0ZXMiLCJ1bmRlcnNjb3JlIiwiYXR0cmlidXRlIiwiaXNQbGFpbk9iamVjdCIsImF0dHJpYnV0ZVN0cmluZyIsImJpbmQiLCJ0ZW1wbGF0ZSIsImFsbG93TnVsbCIsImF1dG9JbmNyZW1lbnQiLCJoYXMiLCJfYmluYXJ5IiwiZGVmYXVsdFZhbHVlU2NoZW1hYmxlIiwiZGVmYXVsdFZhbHVlIiwidW5pcXVlIiwicHJpbWFyeUtleSIsImZpcnN0IiwiYWZ0ZXIiLCJyZWZlcmVuY2VzIiwiZmtOYW1lIiwib25EZWxldGUiLCJ0b1VwcGVyQ2FzZSIsIm9uVXBkYXRlIiwicmVzdWx0Iiwic3RtdCIsImN1cnJlbnRJbmRleCIsIm9wZW5pbmdCcmFja2V0cyIsImNsb3NpbmdCcmFja2V0cyIsImhhc0pzb25GdW5jdGlvbiIsImhhc0ludmFsaWRUb2tlbiIsInN0cmluZyIsInN1YnN0ciIsImZ1bmN0aW9uTWF0Y2hlcyIsImV4ZWMiLCJpbmRleE9mIiwib3BlcmF0b3JNYXRjaGVzIiwidG9rZW5NYXRjaGVzIiwiY2FwdHVyZWRUb2tlbiIsIkVycm9yIiwiY29sdW1uTmFtZSIsInF1b3RlZFNjaGVtYU5hbWUiLCJ3cmFwU2luZ2xlUXVvdGUiLCJxdW90ZWRUYWJsZU5hbWUiLCJxdW90ZWRDb2x1bW5OYW1lIiwiaWRlbnRpZmllciIsImFkZFRpY2tzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxDQUFDLEdBQUdDLE9BQU8sQ0FBQyxRQUFELENBQWpCOztBQUNBLE1BQU1DLEtBQUssR0FBR0QsT0FBTyxDQUFDLGFBQUQsQ0FBckI7O0FBQ0EsTUFBTUUsc0JBQXNCLEdBQUdGLE9BQU8sQ0FBQyw2QkFBRCxDQUF0Qzs7QUFDQSxNQUFNRyxJQUFJLEdBQUdILE9BQU8sQ0FBQyxNQUFELENBQXBCOztBQUNBLE1BQU1JLEVBQUUsR0FBR0osT0FBTyxDQUFDLGlCQUFELENBQWxCOztBQUdBLE1BQU1LLGlCQUFpQixHQUFHLHdEQUExQjtBQUNBLE1BQU1DLGlCQUFpQixHQUFHLG9DQUExQjtBQUNBLE1BQU1DLGlCQUFpQixHQUFHLDREQUExQjtBQUNBLE1BQU1DLGdCQUFnQixHQUFHLHdDQUNyQixvQ0FEcUIsR0FFckIsd0NBRnFCLEdBR3JCLHlDQUhxQixHQUlyQiwwQkFKcUIsR0FLckIsOEJBTHFCLEdBTXJCLCtCQU5xQixHQU9yQiw0QkFQcUIsR0FRckIsbURBUnFCLEdBU3JCLG9EQVRxQixHQVVyQiwrQ0FWcUIsR0FXckIsZ0RBWEo7QUFhQSxNQUFNQyxrQkFBa0IsR0FBRyxJQUFJQyxHQUFKLENBQVEsQ0FBQyxNQUFELEVBQVMsTUFBVCxFQUFpQixVQUFqQixFQUE2QixNQUE3QixDQUFSLENBQTNCOztJQUVNQyxtQjs7Ozs7QUFDSiwrQkFBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFB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SixLQUFLLENBQUM0SixRQUFOLENBQWVELFVBQWYsRUFBMkIsSUFBM0IsQ0FBUDtBQUNEOztBQUVERSxNQUFNLENBQUNDLE9BQVAsR0FBaUJwSixtQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XHJcbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMnKTtcclxuY29uc3QgQWJzdHJhY3RRdWVyeUdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL2Fic3RyYWN0L3F1ZXJ5LWdlbmVyYXRvcicpO1xyXG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xyXG5jb25zdCBPcCA9IHJlcXVpcmUoJy4uLy4uL29wZXJhdG9ycycpO1xyXG5cclxuXHJcbmNvbnN0IGpzb25GdW5jdGlvblJlZ2V4ID0gL15cXHMqKCg/OlthLXpdK18pezAsMn1qc29uYj8oPzpfW2Etel0rKXswLDJ9KVxcKFteKV0qXFwpL2k7XHJcbmNvbnN0IGpzb25PcGVyYXRvclJlZ2V4ID0gL15cXHMqKC0+Pj98QD58PEB8XFw/W3wmXT98XFx8ezJ9fCMtKS9pO1xyXG5jb25zdCB0b2tlbkNhcHR1cmVSZWdleCA9IC9eXFxzKigoPzooW2BcIiddKSg/Oig/IVxcMikufFxcMnsyfSkqXFwyKXxbXFx3XFxkXFxzXSt8WygpLiw7Ky1dKS9pO1xyXG5jb25zdCBmb3JlaWduS2V5RmllbGRzID0gJ0NPTlNUUkFJTlRfTkFNRSBhcyBjb25zdHJhaW50X25hbWUsJ1xyXG4gICsgJ0NPTlNUUkFJTlRfTkFNRSBhcyBjb25zdHJhaW50TmFtZSwnXHJcbiAgKyAnQ09OU1RSQUlOVF9TQ0hFTUEgYXMgY29uc3RyYWludFNjaGVtYSwnXHJcbiAgKyAnQ09OU1RSQUlOVF9TQ0hFTUEgYXMgY29uc3RyYWludENhdGFsb2csJ1xyXG4gICsgJ1RBQkxFX05BTUUgYXMgdGFibGVOYW1lLCdcclxuICArICdUQUJMRV9TQ0hFTUEgYXMgdGFibGVTY2hlbWEsJ1xyXG4gICsgJ1RBQkxFX1NDSEVNQSBhcyB0YWJsZUNhdGFsb2csJ1xyXG4gICsgJ0NPTFVNTl9OQU1FIGFzIGNvbHVtbk5hbWUsJ1xyXG4gICsgJ1JFRkVSRU5DRURfVEFCTEVfU0NIRU1BIGFzIHJlZmVyZW5jZWRUYWJsZVNjaGVtYSwnXHJcbiAgKyAnUkVGRVJFTkNFRF9UQUJMRV9TQ0hFTUEgYXMgcmVmZXJlbmNlZFRhYmxlQ2F0YWxvZywnXHJcbiAgKyAnUkVGRVJFTkNFRF9UQUJMRV9OQU1FIGFzIHJlZmVyZW5jZWRUYWJsZU5hbWUsJ1xyXG4gICsgJ1JFRkVSRU5DRURfQ09MVU1OX05BTUUgYXMgcmVmZXJlbmNlZENvbHVtbk5hbWUnO1xyXG5cclxuY29uc3QgdHlwZVdpdGhvdXREZWZhdWx0ID0gbmV3IFNldChbJ0JMT0InLCAnVEVYVCcsICdHRU9NRVRSWScsICdKU09OJ10pO1xyXG5cclxuY2xhc3MgTXlTUUxRdWVyeUdlbmVyYXRvciBleHRlbmRzIEFic3RyYWN0UXVlcnlHZW5lcmF0b3Ige1xyXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcclxuICAgIHN1cGVyKG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuT3BlcmF0b3JNYXAgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLk9wZXJhdG9yTWFwLCB7XHJcbiAgICAgIFtPcC5yZWdleHBdOiAnUkVHRVhQJyxcclxuICAgICAgW09wLm5vdFJlZ2V4cF06ICdOT1QgUkVHRVhQJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KGRhdGFiYXNlTmFtZSwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICBjaGFyc2V0OiBudWxsLFxyXG4gICAgICBjb2xsYXRlOiBudWxsXHJcbiAgICB9LCBvcHRpb25zIHx8IHt9KTtcclxuXHJcbiAgICBjb25zdCBkYXRhYmFzZSA9IHRoaXMucXVvdGVJZGVudGlmaWVyKGRhdGFiYXNlTmFtZSk7XHJcbiAgICBjb25zdCBjaGFyc2V0ID0gb3B0aW9ucy5jaGFyc2V0ID8gYCBERUZBVUxUIENIQVJBQ1RFUiBTRVQgJHt0aGlzLmVzY2FwZShvcHRpb25zLmNoYXJzZXQpfWAgOiAnJztcclxuICAgIGNvbnN0IGNvbGxhdGUgPSBvcHRpb25zLmNvbGxhdGUgPyBgIERFRkFVTFQgQ09MTEFURSAke3RoaXMuZXNjYXBlKG9wdGlvbnMuY29sbGF0ZSl9YCA6ICcnO1xyXG5cclxuICAgIHJldHVybiBgJHtgQ1JFQVRFIERBVEFCQVNFIElGIE5PVCBFWElTVFMgJHtkYXRhYmFzZX0ke2NoYXJzZXR9JHtjb2xsYXRlfWAudHJpbSgpfTtgO1xyXG4gIH1cclxuXHJcbiAgZHJvcERhdGFiYXNlUXVlcnkoZGF0YWJhc2VOYW1lKSB7XHJcbiAgICByZXR1cm4gYERST1AgREFUQUJBU0UgSUYgRVhJU1RTICR7dGhpcy5xdW90ZUlkZW50aWZpZXIoZGF0YWJhc2VOYW1lKS50cmltKCl9O2A7XHJcbiAgfVxyXG5cclxuICBjcmVhdGVTY2hlbWEoKSB7XHJcbiAgICByZXR1cm4gJ1NIT1cgVEFCTEVTJztcclxuICB9XHJcblxyXG4gIHNob3dTY2hlbWFzUXVlcnkoKSB7XHJcbiAgICByZXR1cm4gJ1NIT1cgVEFCTEVTJztcclxuICB9XHJcblxyXG4gIHZlcnNpb25RdWVyeSgpIHtcclxuICAgIHJldHVybiAnU0VMRUNUIFZFUlNJT04oKSBhcyBgdmVyc2lvbmAnO1xyXG4gIH1cclxuXHJcbiAgY3JlYXRlVGFibGVRdWVyeSh0YWJsZU5hbWUsIGF0dHJpYnV0ZXMsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcclxuICAgICAgZW5naW5lOiAnSW5ub0RCJyxcclxuICAgICAgY2hhcnNldDogbnVsbCxcclxuICAgICAgcm93Rm9ybWF0OiBudWxsXHJcbiAgICB9LCBvcHRpb25zIHx8IHt9KTtcclxuXHJcbiAgICBjb25zdCBwcmltYXJ5S2V5cyA9IFtdO1xyXG4gICAgY29uc3QgZm9yZWlnbktleXMgPSB7fTtcclxuICAgIGNvbnN0IGF0dHJTdHIgPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGF0dHIgaW4gYXR0cmlidXRlcykge1xyXG4gICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhdHRyaWJ1dGVzLCBhdHRyKSkgY29udGludWU7XHJcbiAgICAgIGNvbnN0IGRhdGFUeXBlID0gYXR0cmlidXRlc1thdHRyXTtcclxuICAgICAgbGV0IG1hdGNoO1xyXG5cclxuICAgICAgaWYgKGRhdGFUeXBlLmluY2x1ZGVzKCdQUklNQVJZIEtFWScpKSB7XHJcbiAgICAgICAgcHJpbWFyeUtleXMucHVzaChhdHRyKTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGFUeXBlLmluY2x1ZGVzKCdSRUZFUkVOQ0VTJykpIHtcclxuICAgICAgICAgIC8vIE15U1FMIGRvZXNuJ3Qgc3VwcG9ydCBpbmxpbmUgUkVGRVJFTkNFUyBkZWNsYXJhdGlvbnM6IG1vdmUgdG8gdGhlIGVuZFxyXG4gICAgICAgICAgbWF0Y2ggPSBkYXRhVHlwZS5tYXRjaCgvXiguKykgKFJFRkVSRU5DRVMuKikkLyk7XHJcbiAgICAgICAgICBhdHRyU3RyLnB1c2goYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cil9ICR7bWF0Y2hbMV0ucmVwbGFjZSgnUFJJTUFSWSBLRVknLCAnJyl9YCk7XHJcbiAgICAgICAgICBmb3JlaWduS2V5c1thdHRyXSA9IG1hdGNoWzJdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhdHRyU3RyLnB1c2goYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cil9ICR7ZGF0YVR5cGUucmVwbGFjZSgnUFJJTUFSWSBLRVknLCAnJyl9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYgKGRhdGFUeXBlLmluY2x1ZGVzKCdSRUZFUkVOQ0VTJykpIHtcclxuICAgICAgICAvLyBNeVNRTCBkb2Vzbid0IHN1cHBvcnQgaW5saW5lIFJFRkVSRU5DRVMgZGVjbGFyYXRpb25zOiBtb3ZlIHRvIHRoZSBlbmRcclxuICAgICAgICBtYXRjaCA9IGRhdGFUeXBlLm1hdGNoKC9eKC4rKSAoUkVGRVJFTkNFUy4qKSQvKTtcclxuICAgICAgICBhdHRyU3RyLnB1c2goYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cil9ICR7bWF0Y2hbMV19YCk7XHJcbiAgICAgICAgZm9yZWlnbktleXNbYXR0cl0gPSBtYXRjaFsyXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBhdHRyU3RyLnB1c2goYCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoYXR0cil9ICR7ZGF0YVR5cGV9YCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpO1xyXG4gICAgbGV0IGF0dHJpYnV0ZXNDbGF1c2UgPSBhdHRyU3RyLmpvaW4oJywgJyk7XHJcbiAgICBjb25zdCBjb21tZW50ID0gb3B0aW9ucy5jb21tZW50ICYmIHR5cGVvZiBvcHRpb25zLmNvbW1lbnQgPT09ICdzdHJpbmcnID8gYCBDT01NRU5UICR7dGhpcy5lc2NhcGUob3B0aW9ucy5jb21tZW50KX1gIDogJyc7XHJcbiAgICBjb25zdCBlbmdpbmUgPSBvcHRpb25zLmVuZ2luZTtcclxuICAgIGNvbnN0IGNoYXJzZXQgPSBvcHRpb25zLmNoYXJzZXQgPyBgIERFRkFVTFQgQ0hBUlNFVD0ke29wdGlvbnMuY2hhcnNldH1gIDogJyc7XHJcbiAgICBjb25zdCBjb2xsYXRpb24gPSBvcHRpb25zLmNvbGxhdGUgPyBgIENPTExBVEUgJHtvcHRpb25zLmNvbGxhdGV9YCA6ICcnO1xyXG4gICAgY29uc3Qgcm93Rm9ybWF0ID0gb3B0aW9ucy5yb3dGb3JtYXQgPyBgIFJPV19GT1JNQVQ9JHtvcHRpb25zLnJvd0Zvcm1hdH1gIDogJyc7XHJcbiAgICBjb25zdCBpbml0aWFsQXV0b0luY3JlbWVudCA9IG9wdGlvbnMuaW5pdGlhbEF1dG9JbmNyZW1lbnQgPyBgIEFVVE9fSU5DUkVNRU5UPSR7b3B0aW9ucy5pbml0aWFsQXV0b0luY3JlbWVudH1gIDogJyc7XHJcbiAgICBjb25zdCBwa1N0cmluZyA9IHByaW1hcnlLZXlzLm1hcChwayA9PiB0aGlzLnF1b3RlSWRlbnRpZmllcihwaykpLmpvaW4oJywgJyk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMudW5pcXVlS2V5cykge1xyXG4gICAgICBfLmVhY2gob3B0aW9ucy51bmlxdWVLZXlzLCAoY29sdW1ucywgaW5kZXhOYW1lKSA9PiB7XHJcbiAgICAgICAgaWYgKGNvbHVtbnMuY3VzdG9tSW5kZXgpIHtcclxuICAgICAgICAgIGlmICh0eXBlb2YgaW5kZXhOYW1lICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBpbmRleE5hbWUgPSBgdW5pcV8ke3RhYmxlTmFtZX1fJHtjb2x1bW5zLmZpZWxkcy5qb2luKCdfJyl9YDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGF0dHJpYnV0ZXNDbGF1c2UgKz0gYCwgVU5JUVVFICR7dGhpcy5xdW90ZUlkZW50aWZpZXIoaW5kZXhOYW1lKX0gKCR7Y29sdW1ucy5maWVsZHMubWFwKGZpZWxkID0+IHRoaXMucXVvdGVJZGVudGlmaWVyKGZpZWxkKSkuam9pbignLCAnKX0pYDtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChwa1N0cmluZy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGF0dHJpYnV0ZXNDbGF1c2UgKz0gYCwgUFJJTUFSWSBLRVkgKCR7cGtTdHJpbmd9KWA7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCBma2V5IGluIGZvcmVpZ25LZXlzKSB7XHJcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZm9yZWlnbktleXMsIGZrZXkpKSB7XHJcbiAgICAgICAgYXR0cmlidXRlc0NsYXVzZSArPSBgLCBGT1JFSUdOIEtFWSAoJHt0aGlzLnF1b3RlSWRlbnRpZmllcihma2V5KX0pICR7Zm9yZWlnbktleXNbZmtleV19YDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBgQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgJHt0YWJsZX0gKCR7YXR0cmlidXRlc0NsYXVzZX0pIEVOR0lORT0ke2VuZ2luZX0ke2NvbW1lbnR9JHtjaGFyc2V0fSR7Y29sbGF0aW9ufSR7aW5pdGlhbEF1dG9JbmNyZW1lbnR9JHtyb3dGb3JtYXR9O2A7XHJcbiAgfVxyXG5cclxuXHJcbiAgZGVzY3JpYmVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSwgc2NoZW1hLCBzY2hlbWFEZWxpbWl0ZXIpIHtcclxuICAgIGNvbnN0IHRhYmxlID0gdGhpcy5xdW90ZVRhYmxlKFxyXG4gICAgICB0aGlzLmFkZFNjaGVtYSh7XHJcbiAgICAgICAgdGFibGVOYW1lLFxyXG4gICAgICAgIF9zY2hlbWE6IHNjaGVtYSxcclxuICAgICAgICBfc2NoZW1hRGVsaW1pdGVyOiBzY2hlbWFEZWxpbWl0ZXJcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIGBTSE9XIEZVTEwgQ09MVU1OUyBGUk9NICR7dGFibGV9O2A7XHJcbiAgfVxyXG5cclxuICBzaG93VGFibGVzUXVlcnkoZGF0YWJhc2UpIHtcclxuICAgIGxldCBxdWVyeSA9ICdTRUxFQ1QgVEFCTEVfTkFNRSBGUk9NIElORk9STUFUSU9OX1NDSEVNQS5UQUJMRVMgV0hFUkUgVEFCTEVfVFlQRSA9IFxcJ0JBU0UgVEFCTEVcXCcnO1xyXG4gICAgaWYgKGRhdGFiYXNlKSB7XHJcbiAgICAgIHF1ZXJ5ICs9IGAgQU5EIFRBQkxFX1NDSEVNQSA9ICR7dGhpcy5lc2NhcGUoZGF0YWJhc2UpfWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBxdWVyeSArPSAnIEFORCBUQUJMRV9TQ0hFTUEgTk9UIElOIChcXCdNWVNRTFxcJywgXFwnSU5GT1JNQVRJT05fU0NIRU1BXFwnLCBcXCdQRVJGT1JNQU5DRV9TQ0hFTUFcXCcsIFxcJ1NZU1xcJyknO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGAke3F1ZXJ5fTtgO1xyXG4gIH1cclxuXHJcbiAgYWRkQ29sdW1uUXVlcnkodGFibGUsIGtleSwgZGF0YVR5cGUpIHtcclxuICAgIGNvbnN0IGRlZmluaXRpb24gPSB0aGlzLmF0dHJpYnV0ZVRvU1FMKGRhdGFUeXBlLCB7XHJcbiAgICAgIGNvbnRleHQ6ICdhZGRDb2x1bW4nLFxyXG4gICAgICB0YWJsZU5hbWU6IHRhYmxlLFxyXG4gICAgICBmb3JlaWduS2V5OiBrZXlcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBgQUxURVIgVEFCTEUgJHt0aGlzLnF1b3RlVGFibGUodGFibGUpfSBBREQgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihrZXkpfSAke2RlZmluaXRpb259O2A7XHJcbiAgfVxyXG5cclxuICByZW1vdmVDb2x1bW5RdWVyeSh0YWJsZU5hbWUsIGF0dHJpYnV0ZU5hbWUpIHtcclxuICAgIHJldHVybiBgQUxURVIgVEFCTEUgJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX0gRFJPUCAke3RoaXMucXVvdGVJZGVudGlmaWVyKGF0dHJpYnV0ZU5hbWUpfTtgO1xyXG4gIH1cclxuXHJcbiAgY2hhbmdlQ29sdW1uUXVlcnkodGFibGVOYW1lLCBhdHRyaWJ1dGVzKSB7XHJcbiAgICBjb25zdCBhdHRyU3RyaW5nID0gW107XHJcbiAgICBjb25zdCBjb25zdHJhaW50U3RyaW5nID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcclxuICAgICAgbGV0IGRlZmluaXRpb24gPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xyXG4gICAgICBpZiAoZGVmaW5pdGlvbi5pbmNsdWRlcygnUkVGRVJFTkNFUycpKSB7XHJcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyaWJ1dGVOYW1lKTtcclxuICAgICAgICBkZWZpbml0aW9uID0gZGVmaW5pdGlvbi5yZXBsYWNlKC8uKz8oPz1SRUZFUkVOQ0VTKS8sICcnKTtcclxuICAgICAgICBjb25zdHJhaW50U3RyaW5nLnB1c2goYEZPUkVJR04gS0VZICgke2F0dHJOYW1lfSkgJHtkZWZpbml0aW9ufWApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGF0dHJTdHJpbmcucHVzaChgXFxgJHthdHRyaWJ1dGVOYW1lfVxcYCBcXGAke2F0dHJpYnV0ZU5hbWV9XFxgICR7ZGVmaW5pdGlvbn1gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBmaW5hbFF1ZXJ5ID0gJyc7XHJcbiAgICBpZiAoYXR0clN0cmluZy5sZW5ndGgpIHtcclxuICAgICAgZmluYWxRdWVyeSArPSBgQ0hBTkdFICR7YXR0clN0cmluZy5qb2luKCcsICcpfWA7XHJcbiAgICAgIGZpbmFsUXVlcnkgKz0gY29uc3RyYWludFN0cmluZy5sZW5ndGggPyAnICcgOiAnJztcclxuICAgIH1cclxuICAgIGlmIChjb25zdHJhaW50U3RyaW5nLmxlbmd0aCkge1xyXG4gICAgICBmaW5hbFF1ZXJ5ICs9IGBBREQgJHtjb25zdHJhaW50U3RyaW5nLmpvaW4oJywgJyl9YDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYEFMVEVSIFRBQkxFICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9ICR7ZmluYWxRdWVyeX07YDtcclxuICB9XHJcblxyXG4gIHJlbmFtZUNvbHVtblF1ZXJ5KHRhYmxlTmFtZSwgYXR0ckJlZm9yZSwgYXR0cmlidXRlcykge1xyXG4gICAgY29uc3QgYXR0clN0cmluZyA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3QgYXR0ck5hbWUgaW4gYXR0cmlidXRlcykge1xyXG4gICAgICBjb25zdCBkZWZpbml0aW9uID0gYXR0cmlidXRlc1thdHRyTmFtZV07XHJcbiAgICAgIGF0dHJTdHJpbmcucHVzaChgXFxgJHthdHRyQmVmb3JlfVxcYCBcXGAke2F0dHJOYW1lfVxcYCAke2RlZmluaXRpb259YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGBBTFRFUiBUQUJMRSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfSBDSEFOR0UgJHthdHRyU3RyaW5nLmpvaW4oJywgJyl9O2A7XHJcbiAgfVxyXG5cclxuICBoYW5kbGVTZXF1ZWxpemVNZXRob2Qoc210aCwgdGFibGVOYW1lLCBmYWN0b3J5LCBvcHRpb25zLCBwcmVwZW5kKSB7XHJcbiAgICBpZiAoc210aCBpbnN0YW5jZW9mIFV0aWxzLkpzb24pIHtcclxuICAgICAgLy8gUGFyc2UgbmVzdGVkIG9iamVjdFxyXG4gICAgICBpZiAoc210aC5jb25kaXRpb25zKSB7XHJcbiAgICAgICAgY29uc3QgY29uZGl0aW9ucyA9IHRoaXMucGFyc2VDb25kaXRpb25PYmplY3Qoc210aC5jb25kaXRpb25zKS5tYXAoY29uZGl0aW9uID0+XHJcbiAgICAgICAgICBgJHt0aGlzLmpzb25QYXRoRXh0cmFjdGlvblF1ZXJ5KGNvbmRpdGlvbi5wYXRoWzBdLCBfLnRhaWwoY29uZGl0aW9uLnBhdGgpKX0gPSAnJHtjb25kaXRpb24udmFsdWV9J2BcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gY29uZGl0aW9ucy5qb2luKCcgQU5EICcpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChzbXRoLnBhdGgpIHtcclxuICAgICAgICBsZXQgc3RyO1xyXG5cclxuICAgICAgICAvLyBBbGxvdyBzcGVjaWZ5aW5nIGNvbmRpdGlvbnMgdXNpbmcgdGhlIHNxbGl0ZSBqc29uIGZ1bmN0aW9uc1xyXG4gICAgICAgIGlmICh0aGlzLl9jaGVja1ZhbGlkSnNvblN0YXRlbWVudChzbXRoLnBhdGgpKSB7XHJcbiAgICAgICAgICBzdHIgPSBzbXRoLnBhdGg7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIEFsc28gc3VwcG9ydCBqc29uIHByb3BlcnR5IGFjY2Vzc29yc1xyXG4gICAgICAgICAgY29uc3QgcGF0aHMgPSBfLnRvUGF0aChzbXRoLnBhdGgpO1xyXG4gICAgICAgICAgY29uc3QgY29sdW1uID0gcGF0aHMuc2hpZnQoKTtcclxuICAgICAgICAgIHN0ciA9IHRoaXMuanNvblBhdGhFeHRyYWN0aW9uUXVlcnkoY29sdW1uLCBwYXRocyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc210aC52YWx1ZSkge1xyXG4gICAgICAgICAgc3RyICs9IHV0aWwuZm9ybWF0KCcgPSAlcycsIHRoaXMuZXNjYXBlKHNtdGgudmFsdWUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoc210aCBpbnN0YW5jZW9mIFV0aWxzLkNhc3QpIHtcclxuICAgICAgaWYgKC90aW1lc3RhbXAvaS50ZXN0KHNtdGgudHlwZSkpIHtcclxuICAgICAgICBzbXRoLnR5cGUgPSAnZGF0ZXRpbWUnO1xyXG4gICAgICB9IGVsc2UgaWYgKHNtdGguanNvbiAmJiAvYm9vbGVhbi9pLnRlc3Qoc210aC50eXBlKSkge1xyXG4gICAgICAgIC8vIHRydWUgb3IgZmFsc2UgY2Fubm90IGJlIGNhc3RlZCBhcyBib29sZWFucyB3aXRoaW4gYSBKU09OIHN0cnVjdHVyZVxyXG4gICAgICAgIHNtdGgudHlwZSA9ICdjaGFyJztcclxuICAgICAgfSBlbHNlIGlmICgvZG91YmxlIHByZWNpc2lvbi9pLnRlc3Qoc210aC50eXBlKSB8fCAvYm9vbGVhbi9pLnRlc3Qoc210aC50eXBlKSB8fCAvaW50ZWdlci9pLnRlc3Qoc210aC50eXBlKSkge1xyXG4gICAgICAgIHNtdGgudHlwZSA9ICdkZWNpbWFsJztcclxuICAgICAgfSBlbHNlIGlmICgvdGV4dC9pLnRlc3Qoc210aC50eXBlKSkge1xyXG4gICAgICAgIHNtdGgudHlwZSA9ICdjaGFyJztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzdXBlci5oYW5kbGVTZXF1ZWxpemVNZXRob2Qoc210aCwgdGFibGVOYW1lLCBmYWN0b3J5LCBvcHRpb25zLCBwcmVwZW5kKTtcclxuICB9XHJcblxyXG4gIF90b0pTT05WYWx1ZSh2YWx1ZSkge1xyXG4gICAgLy8gdHJ1ZS9mYWxzZSBhcmUgc3RvcmVkIGFzIHN0cmluZ3MgaW4gbXlzcWxcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xyXG4gICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcclxuICAgIH1cclxuICAgIC8vIG51bGwgaXMgc3RvcmVkIGFzIGEgc3RyaW5nIGluIG15c3FsXHJcbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgcmV0dXJuICdudWxsJztcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHVwc2VydFF1ZXJ5KHRhYmxlTmFtZSwgaW5zZXJ0VmFsdWVzLCB1cGRhdGVWYWx1ZXMsIHdoZXJlLCBtb2RlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucy5vbkR1cGxpY2F0ZSA9ICdVUERBVEUgJztcclxuXHJcbiAgICBvcHRpb25zLm9uRHVwbGljYXRlICs9IE9iamVjdC5rZXlzKHVwZGF0ZVZhbHVlcykubWFwKGtleSA9PiB7XHJcbiAgICAgIGtleSA9IHRoaXMucXVvdGVJZGVudGlmaWVyKGtleSk7XHJcbiAgICAgIHJldHVybiBgJHtrZXl9PVZBTFVFUygke2tleX0pYDtcclxuICAgIH0pLmpvaW4oJywgJyk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuaW5zZXJ0UXVlcnkodGFibGVOYW1lLCBpbnNlcnRWYWx1ZXMsIG1vZGVsLnJhd0F0dHJpYnV0ZXMsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgdHJ1bmNhdGVUYWJsZVF1ZXJ5KHRhYmxlTmFtZSkge1xyXG4gICAgcmV0dXJuIGBUUlVOQ0FURSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfWA7XHJcbiAgfVxyXG5cclxuICBkZWxldGVRdWVyeSh0YWJsZU5hbWUsIHdoZXJlLCBvcHRpb25zID0ge30sIG1vZGVsKSB7XHJcbiAgICBsZXQgbGltaXQgPSAnJztcclxuICAgIGxldCBxdWVyeSA9IGBERUxFVEUgRlJPTSAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfWA7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubGltaXQpIHtcclxuICAgICAgbGltaXQgPSBgIExJTUlUICR7dGhpcy5lc2NhcGUob3B0aW9ucy5saW1pdCl9YDtcclxuICAgIH1cclxuXHJcbiAgICB3aGVyZSA9IHRoaXMuZ2V0V2hlcmVDb25kaXRpb25zKHdoZXJlLCBudWxsLCBtb2RlbCwgb3B0aW9ucyk7XHJcblxyXG4gICAgaWYgKHdoZXJlKSB7XHJcbiAgICAgIHF1ZXJ5ICs9IGAgV0hFUkUgJHt3aGVyZX1gO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBxdWVyeSArIGxpbWl0O1xyXG4gIH1cclxuXHJcbiAgc2hvd0luZGV4ZXNRdWVyeSh0YWJsZU5hbWUsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiBgU0hPVyBJTkRFWCBGUk9NICR7dGhpcy5xdW90ZVRhYmxlKHRhYmxlTmFtZSl9JHsob3B0aW9ucyB8fCB7fSkuZGF0YWJhc2UgPyBgIEZST00gXFxgJHtvcHRpb25zLmRhdGFiYXNlfVxcYGAgOiAnJ31gO1xyXG4gIH1cclxuXHJcbiAgc2hvd0NvbnN0cmFpbnRzUXVlcnkodGFibGUsIGNvbnN0cmFpbnROYW1lKSB7XHJcbiAgICBjb25zdCB0YWJsZU5hbWUgPSB0YWJsZS50YWJsZU5hbWUgfHwgdGFibGU7XHJcbiAgICBjb25zdCBzY2hlbWFOYW1lID0gdGFibGUuc2NoZW1hO1xyXG5cclxuICAgIGxldCBzcWwgPSBbXHJcbiAgICAgICdTRUxFQ1QgQ09OU1RSQUlOVF9DQVRBTE9HIEFTIGNvbnN0cmFpbnRDYXRhbG9nLCcsXHJcbiAgICAgICdDT05TVFJBSU5UX05BTUUgQVMgY29uc3RyYWludE5hbWUsJyxcclxuICAgICAgJ0NPTlNUUkFJTlRfU0NIRU1BIEFTIGNvbnN0cmFpbnRTY2hlbWEsJyxcclxuICAgICAgJ0NPTlNUUkFJTlRfVFlQRSBBUyBjb25zdHJhaW50VHlwZSwnLFxyXG4gICAgICAnVEFCTEVfTkFNRSBBUyB0YWJsZU5hbWUsJyxcclxuICAgICAgJ1RBQkxFX1NDSEVNQSBBUyB0YWJsZVNjaGVtYScsXHJcbiAgICAgICdmcm9tIElORk9STUFUSU9OX1NDSEVNQS5UQUJMRV9DT05TVFJBSU5UUycsXHJcbiAgICAgIGBXSEVSRSB0YWJsZV9uYW1lPScke3RhYmxlTmFtZX0nYFxyXG4gICAgXS5qb2luKCcgJyk7XHJcblxyXG4gICAgaWYgKGNvbnN0cmFpbnROYW1lKSB7XHJcbiAgICAgIHNxbCArPSBgIEFORCBjb25zdHJhaW50X25hbWUgPSAnJHtjb25zdHJhaW50TmFtZX0nYDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2NoZW1hTmFtZSkge1xyXG4gICAgICBzcWwgKz0gYCBBTkQgVEFCTEVfU0NIRU1BID0gJyR7c2NoZW1hTmFtZX0nYDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYCR7c3FsfTtgO1xyXG4gIH1cclxuXHJcbiAgcmVtb3ZlSW5kZXhRdWVyeSh0YWJsZU5hbWUsIGluZGV4TmFtZU9yQXR0cmlidXRlcykge1xyXG4gICAgbGV0IGluZGV4TmFtZSA9IGluZGV4TmFtZU9yQXR0cmlidXRlcztcclxuXHJcbiAgICBpZiAodHlwZW9mIGluZGV4TmFtZSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgaW5kZXhOYW1lID0gVXRpbHMudW5kZXJzY29yZShgJHt0YWJsZU5hbWV9XyR7aW5kZXhOYW1lT3JBdHRyaWJ1dGVzLmpvaW4oJ18nKX1gKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYERST1AgSU5ERVggJHt0aGlzLnF1b3RlSWRlbnRpZmllcihpbmRleE5hbWUpfSBPTiAke3RoaXMucXVvdGVUYWJsZSh0YWJsZU5hbWUpfWA7XHJcbiAgfVxyXG5cclxuICBhdHRyaWJ1dGVUb1NRTChhdHRyaWJ1dGUsIG9wdGlvbnMpIHtcclxuICAgIGlmICghXy5pc1BsYWluT2JqZWN0KGF0dHJpYnV0ZSkpIHtcclxuICAgICAgYXR0cmlidXRlID0ge1xyXG4gICAgICAgIHR5cGU6IGF0dHJpYnV0ZVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGF0dHJpYnV0ZVN0cmluZyA9IGF0dHJpYnV0ZS50eXBlLnRvU3RyaW5nKHsgZXNjYXBlOiB0aGlzLmVzY2FwZS5iaW5kKHRoaXMpIH0pO1xyXG4gICAgbGV0IHRlbXBsYXRlID0gYXR0cmlidXRlU3RyaW5nO1xyXG5cclxuICAgIGlmIChhdHRyaWJ1dGUuYWxsb3dOdWxsID09PSBmYWxzZSkge1xyXG4gICAgICB0ZW1wbGF0ZSArPSAnIE5PVCBOVUxMJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXR0cmlidXRlLmF1dG9JbmNyZW1lbnQpIHtcclxuICAgICAgdGVtcGxhdGUgKz0gJyBhdXRvX2luY3JlbWVudCc7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQkxPQi9URVhUL0dFT01FVFJZL0pTT04gY2Fubm90IGhhdmUgYSBkZWZhdWx0IHZhbHVlXHJcbiAgICBpZiAoIXR5cGVXaXRob3V0RGVmYXVsdC5oYXMoYXR0cmlidXRlU3RyaW5nKVxyXG4gICAgICAmJiBhdHRyaWJ1dGUudHlwZS5fYmluYXJ5ICE9PSB0cnVlXHJcbiAgICAgICYmIFV0aWxzLmRlZmF1bHRWYWx1ZVNjaGVtYWJsZShhdHRyaWJ1dGUuZGVmYXVsdFZhbHVlKSkge1xyXG4gICAgICB0ZW1wbGF0ZSArPSBgIERFRkFVTFQgJHt0aGlzLmVzY2FwZShhdHRyaWJ1dGUuZGVmYXVsdFZhbHVlKX1gO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhdHRyaWJ1dGUudW5pcXVlID09PSB0cnVlKSB7XHJcbiAgICAgIHRlbXBsYXRlICs9ICcgVU5JUVVFJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXR0cmlidXRlLnByaW1hcnlLZXkpIHtcclxuICAgICAgdGVtcGxhdGUgKz0gJyBQUklNQVJZIEtFWSc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGF0dHJpYnV0ZS5jb21tZW50KSB7XHJcbiAgICAgIHRlbXBsYXRlICs9IGAgQ09NTUVOVCAke3RoaXMuZXNjYXBlKGF0dHJpYnV0ZS5jb21tZW50KX1gO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhdHRyaWJ1dGUuZmlyc3QpIHtcclxuICAgICAgdGVtcGxhdGUgKz0gJyBGSVJTVCc7XHJcbiAgICB9XHJcbiAgICBpZiAoYXR0cmlidXRlLmFmdGVyKSB7XHJcbiAgICAgIHRlbXBsYXRlICs9IGAgQUZURVIgJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyaWJ1dGUuYWZ0ZXIpfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGF0dHJpYnV0ZS5yZWZlcmVuY2VzKSB7XHJcblxyXG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmNvbnRleHQgPT09ICdhZGRDb2x1bW4nICYmIG9wdGlvbnMuZm9yZWlnbktleSkge1xyXG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gdGhpcy5xdW90ZUlkZW50aWZpZXIob3B0aW9ucy5mb3JlaWduS2V5KTtcclxuICAgICAgICBjb25zdCBma05hbWUgPSB0aGlzLnF1b3RlSWRlbnRpZmllcihgJHtvcHRpb25zLnRhYmxlTmFtZX1fJHthdHRyTmFtZX1fZm9yZWlnbl9pZHhgKTtcclxuXHJcbiAgICAgICAgdGVtcGxhdGUgKz0gYCwgQUREIENPTlNUUkFJTlQgJHtma05hbWV9IEZPUkVJR04gS0VZICgke2F0dHJOYW1lfSlgO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0ZW1wbGF0ZSArPSBgIFJFRkVSRU5DRVMgJHt0aGlzLnF1b3RlVGFibGUoYXR0cmlidXRlLnJlZmVyZW5jZXMubW9kZWwpfWA7XHJcblxyXG4gICAgICBpZiAoYXR0cmlidXRlLnJlZmVyZW5jZXMua2V5KSB7XHJcbiAgICAgICAgdGVtcGxhdGUgKz0gYCAoJHt0aGlzLnF1b3RlSWRlbnRpZmllcihhdHRyaWJ1dGUucmVmZXJlbmNlcy5rZXkpfSlgO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRlbXBsYXRlICs9IGAgKCR7dGhpcy5xdW90ZUlkZW50aWZpZXIoJ2lkJyl9KWA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChhdHRyaWJ1dGUub25EZWxldGUpIHtcclxuICAgICAgICB0ZW1wbGF0ZSArPSBgIE9OIERFTEVURSAke2F0dHJpYnV0ZS5vbkRlbGV0ZS50b1VwcGVyQ2FzZSgpfWA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChhdHRyaWJ1dGUub25VcGRhdGUpIHtcclxuICAgICAgICB0ZW1wbGF0ZSArPSBgIE9OIFVQREFURSAke2F0dHJpYnV0ZS5vblVwZGF0ZS50b1VwcGVyQ2FzZSgpfWA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGVtcGxhdGU7XHJcbiAgfVxyXG5cclxuICBhdHRyaWJ1dGVzVG9TUUwoYXR0cmlidXRlcywgb3B0aW9ucykge1xyXG4gICAgY29uc3QgcmVzdWx0ID0ge307XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xyXG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2tleV07XHJcbiAgICAgIHJlc3VsdFthdHRyaWJ1dGUuZmllbGQgfHwga2V5XSA9IHRoaXMuYXR0cmlidXRlVG9TUUwoYXR0cmlidXRlLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2sgd2hldGhlciB0aGUgc3RhdG1lbWVudCBpcyBqc29uIGZ1bmN0aW9uIG9yIHNpbXBsZSBwYXRoXHJcbiAgICpcclxuICAgKiBAcGFyYW0gICB7c3RyaW5nfSAgc3RtdCAgVGhlIHN0YXRlbWVudCB0byB2YWxpZGF0ZVxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufSAgICAgICB0cnVlIGlmIHRoZSBnaXZlbiBzdGF0ZW1lbnQgaXMganNvbiBmdW5jdGlvblxyXG4gICAqIEB0aHJvd3MgIHtFcnJvcn0gICAgICAgICB0aHJvdyBpZiB0aGUgc3RhdGVtZW50IGxvb2tzIGxpa2UganNvbiBmdW5jdGlvbiBidXQgaGFzIGludmFsaWQgdG9rZW5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9jaGVja1ZhbGlkSnNvblN0YXRlbWVudChzdG10KSB7XHJcbiAgICBpZiAodHlwZW9mIHN0bXQgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY3VycmVudEluZGV4ID0gMDtcclxuICAgIGxldCBvcGVuaW5nQnJhY2tldHMgPSAwO1xyXG4gICAgbGV0IGNsb3NpbmdCcmFja2V0cyA9IDA7XHJcbiAgICBsZXQgaGFzSnNvbkZ1bmN0aW9uID0gZmFsc2U7XHJcbiAgICBsZXQgaGFzSW52YWxpZFRva2VuID0gZmFsc2U7XHJcblxyXG4gICAgd2hpbGUgKGN1cnJlbnRJbmRleCA8IHN0bXQubGVuZ3RoKSB7XHJcbiAgICAgIGNvbnN0IHN0cmluZyA9IHN0bXQuc3Vic3RyKGN1cnJlbnRJbmRleCk7XHJcbiAgICAgIGNvbnN0IGZ1bmN0aW9uTWF0Y2hlcyA9IGpzb25GdW5jdGlvblJlZ2V4LmV4ZWMoc3RyaW5nKTtcclxuICAgICAgaWYgKGZ1bmN0aW9uTWF0Y2hlcykge1xyXG4gICAgICAgIGN1cnJlbnRJbmRleCArPSBmdW5jdGlvbk1hdGNoZXNbMF0uaW5kZXhPZignKCcpO1xyXG4gICAgICAgIGhhc0pzb25GdW5jdGlvbiA9IHRydWU7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG9wZXJhdG9yTWF0Y2hlcyA9IGpzb25PcGVyYXRvclJlZ2V4LmV4ZWMoc3RyaW5nKTtcclxuICAgICAgaWYgKG9wZXJhdG9yTWF0Y2hlcykge1xyXG4gICAgICAgIGN1cnJlbnRJbmRleCArPSBvcGVyYXRvck1hdGNoZXNbMF0ubGVuZ3RoO1xyXG4gICAgICAgIGhhc0pzb25GdW5jdGlvbiA9IHRydWU7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHRva2VuTWF0Y2hlcyA9IHRva2VuQ2FwdHVyZVJlZ2V4LmV4ZWMoc3RyaW5nKTtcclxuICAgICAgaWYgKHRva2VuTWF0Y2hlcykge1xyXG4gICAgICAgIGNvbnN0IGNhcHR1cmVkVG9rZW4gPSB0b2tlbk1hdGNoZXNbMV07XHJcbiAgICAgICAgaWYgKGNhcHR1cmVkVG9rZW4gPT09ICcoJykge1xyXG4gICAgICAgICAgb3BlbmluZ0JyYWNrZXRzKys7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjYXB0dXJlZFRva2VuID09PSAnKScpIHtcclxuICAgICAgICAgIGNsb3NpbmdCcmFja2V0cysrO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY2FwdHVyZWRUb2tlbiA9PT0gJzsnKSB7XHJcbiAgICAgICAgICBoYXNJbnZhbGlkVG9rZW4gPSB0cnVlO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN1cnJlbnRJbmRleCArPSB0b2tlbk1hdGNoZXNbMF0ubGVuZ3RoO1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBpbnZhbGlkIGpzb24gc3RhdGVtZW50XHJcbiAgICBpZiAoaGFzSnNvbkZ1bmN0aW9uICYmIChoYXNJbnZhbGlkVG9rZW4gfHwgb3BlbmluZ0JyYWNrZXRzICE9PSBjbG9zaW5nQnJhY2tldHMpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBqc29uIHN0YXRlbWVudDogJHtzdG10fWApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJldHVybiB0cnVlIGlmIHRoZSBzdGF0ZW1lbnQgaGFzIHZhbGlkIGpzb24gZnVuY3Rpb25cclxuICAgIHJldHVybiBoYXNKc29uRnVuY3Rpb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZW5lcmF0ZXMgYW4gU1FMIHF1ZXJ5IHRoYXQgcmV0dXJucyBhbGwgZm9yZWlnbiBrZXlzIG9mIGEgdGFibGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9IHRhYmxlICBUaGUgdGFibGUuXHJcbiAgICogQHBhcmFtICB7c3RyaW5nfSBzY2hlbWFOYW1lIFRoZSBuYW1lIG9mIHRoZSBzY2hlbWEuXHJcbiAgICogQHJldHVybnMge3N0cmluZ30gICAgICAgICAgICBUaGUgZ2VuZXJhdGVkIHNxbCBxdWVyeS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGdldEZvcmVpZ25LZXlzUXVlcnkodGFibGUsIHNjaGVtYU5hbWUpIHtcclxuICAgIGNvbnN0IHRhYmxlTmFtZSA9IHRhYmxlLnRhYmxlTmFtZSB8fCB0YWJsZTtcclxuICAgIHJldHVybiBgU0VMRUNUICR7Zm9yZWlnbktleUZpZWxkc30gRlJPTSBJTkZPUk1BVElPTl9TQ0hFTUEuS0VZX0NPTFVNTl9VU0FHRSB3aGVyZSBUQUJMRV9OQU1FID0gJyR7dGFibGVOYW1lfScgQU5EIENPTlNUUkFJTlRfTkFNRSE9J1BSSU1BUlknIEFORCBDT05TVFJBSU5UX1NDSEVNQT0nJHtzY2hlbWFOYW1lfScgQU5EIFJFRkVSRU5DRURfVEFCTEVfTkFNRSBJUyBOT1QgTlVMTDtgO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2VuZXJhdGVzIGFuIFNRTCBxdWVyeSB0aGF0IHJldHVybnMgdGhlIGZvcmVpZ24ga2V5IGNvbnN0cmFpbnQgb2YgYSBnaXZlbiBjb2x1bW4uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9IHRhYmxlICBUaGUgdGFibGUuXHJcbiAgICogQHBhcmFtICB7c3RyaW5nfSBjb2x1bW5OYW1lIFRoZSBuYW1lIG9mIHRoZSBjb2x1bW4uXHJcbiAgICogQHJldHVybnMge3N0cmluZ30gICAgICAgICAgICBUaGUgZ2VuZXJhdGVkIHNxbCBxdWVyeS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGdldEZvcmVpZ25LZXlRdWVyeSh0YWJsZSwgY29sdW1uTmFtZSkge1xyXG4gICAgY29uc3QgcXVvdGVkU2NoZW1hTmFtZSA9IHRhYmxlLnNjaGVtYSA/IHdyYXBTaW5nbGVRdW90ZSh0YWJsZS5zY2hlbWEpIDogJyc7XHJcbiAgICBjb25zdCBxdW90ZWRUYWJsZU5hbWUgPSB3cmFwU2luZ2xlUXVvdGUodGFibGUudGFibGVOYW1lIHx8IHRhYmxlKTtcclxuICAgIGNvbnN0IHF1b3RlZENvbHVtbk5hbWUgPSB3cmFwU2luZ2xlUXVvdGUoY29sdW1uTmFtZSk7XHJcblxyXG4gICAgcmV0dXJuIGBTRUxFQ1QgJHtmb3JlaWduS2V5RmllbGRzfSBGUk9NIElORk9STUFUSU9OX1NDSEVNQS5LRVlfQ09MVU1OX1VTQUdFYFxyXG4gICAgICArIGAgV0hFUkUgKFJFRkVSRU5DRURfVEFCTEVfTkFNRSA9ICR7cXVvdGVkVGFibGVOYW1lfSR7dGFibGUuc2NoZW1hXHJcbiAgICAgICAgPyBgIEFORCBSRUZFUkVOQ0VEX1RBQkxFX1NDSEVNQSA9ICR7cXVvdGVkU2NoZW1hTmFtZX1gXHJcbiAgICAgICAgOiAnJ30gQU5EIFJFRkVSRU5DRURfQ09MVU1OX05BTUUgPSAke3F1b3RlZENvbHVtbk5hbWV9KWBcclxuICAgICAgKyBgIE9SIChUQUJMRV9OQU1FID0gJHtxdW90ZWRUYWJsZU5hbWV9JHt0YWJsZS5zY2hlbWEgP1xyXG4gICAgICAgIGAgQU5EIFRBQkxFX1NDSEVNQSA9ICR7cXVvdGVkU2NoZW1hTmFtZX1gIDogJyd9IEFORCBDT0xVTU5fTkFNRSA9ICR7cXVvdGVkQ29sdW1uTmFtZX0gQU5EIFJFRkVSRU5DRURfVEFCTEVfTkFNRSBJUyBOT1QgTlVMTClgO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2VuZXJhdGVzIGFuIFNRTCBxdWVyeSB0aGF0IHJlbW92ZXMgYSBmb3JlaWduIGtleSBmcm9tIGEgdGFibGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHRhYmxlTmFtZSAgVGhlIG5hbWUgb2YgdGhlIHRhYmxlLlxyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gZm9yZWlnbktleSBUaGUgbmFtZSBvZiB0aGUgZm9yZWlnbiBrZXkgY29uc3RyYWludC5cclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAgICAgICAgICAgIFRoZSBnZW5lcmF0ZWQgc3FsIHF1ZXJ5LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZHJvcEZvcmVpZ25LZXlRdWVyeSh0YWJsZU5hbWUsIGZvcmVpZ25LZXkpIHtcclxuICAgIHJldHVybiBgQUxURVIgVEFCTEUgJHt0aGlzLnF1b3RlVGFibGUodGFibGVOYW1lKX1cclxuICAgICAgRFJPUCBGT1JFSUdOIEtFWSAke3RoaXMucXVvdGVJZGVudGlmaWVyKGZvcmVpZ25LZXkpfTtgO1xyXG4gIH1cclxufVxyXG5cclxuLy8gcHJpdmF0ZSBtZXRob2RzXHJcbmZ1bmN0aW9uIHdyYXBTaW5nbGVRdW90ZShpZGVudGlmaWVyKSB7XHJcbiAgcmV0dXJuIFV0aWxzLmFkZFRpY2tzKGlkZW50aWZpZXIsICdcXCcnKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNeVNRTFF1ZXJ5R2VuZXJhdG9yOyJdfQ==