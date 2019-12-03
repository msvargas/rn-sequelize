"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const _ = require("lodash");

const Utils = require("../../utils");

const Promise = require("../../promise");

const AbstractQuery = require("../abstract/query");

const QueryTypes = require("../../query-types");

const sequelizeErrors = require("../../errors");

const parserStore = require("../parserStore")("sqlite");

const {
  logger
} = require("../../utils/logger");

const debug = logger.debugContext("sql:sqlite");

const getMethods = obj => {
  let properties = new Set();
  let currentObj = obj;

  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
  } while (currentObj = Object.getPrototypeOf(currentObj));

  return [...properties.keys()].filter(item => typeof obj[item] === "function");
};

let Query =
/*#__PURE__*/
function (_AbstractQuery) {
  _inherits(Query, _AbstractQuery);

  function Query() {
    _classCallCheck(this, Query);

    return _possibleConstructorReturn(this, _getPrototypeOf(Query).apply(this, arguments));
  }

  _createClass(Query, [{
    key: "getInsertIdField",
    value: function getInsertIdField() {
      return "lastID";
    }
    /**
     * rewrite query with parameters.
     *
     * @param {string} sql
     * @param {Array|Object} values
     * @param {string} dialect
     * @private
     */

  }, {
    key: "_collectModels",
    value: function _collectModels(include, prefix) {
      const ret = {};

      if (include) {
        for (const _include of include) {
          let key;

          if (!prefix) {
            key = _include.as;
          } else {
            key = `${prefix}.${_include.as}`;
          }

          ret[key] = _include.model;

          if (_include.include) {
            _.merge(ret, this._collectModels(_include.include, key));
          }
        }
      }

      return ret;
    }
  }, {
    key: "_handleQueryResponse",
    value: function _handleQueryResponse(metaData, columnTypes, err, results) {
      if (err) {
        err.sql = this.sql;
        throw this.formatError(err);
      }

      let result = this.instance; // add the inserted row id to the instance

      if (this.isInsertQuery(results, metaData)) {
        this.handleInsertQuery(results, metaData);

        if (!this.instance) {
          // handle bulkCreate AI primary key
          if (
          /*  metaData.constructor.name === "Statement" && */
          this.model && this.model.autoIncrementAttribute && this.model.autoIncrementAttribute === this.model.primaryKeyAttribute && this.model.rawAttributes[this.model.primaryKeyAttribute]) {
            const startId = metaData[this.getInsertIdField()] - metaData.changes + 1;
            result = [];

            for (let i = startId; i < startId + metaData.changes; i++) {
              result.push({
                [this.model.rawAttributes[this.model.primaryKeyAttribute].field]: i
              });
            }
          } else {
            result = metaData[this.getInsertIdField()];
          }
        }
      }

      if (this.isShowTablesQuery()) {
        return results.map(row => row.name);
      }

      if (this.isShowConstraintsQuery()) {
        result = results;

        if (results && results[0] && results[0].sql) {
          result = this.parseConstraintsFromSql(results[0].sql);
        }

        return result;
      }

      if (this.isSelectQuery()) {
        if (this.options.raw) {
          return this.handleSelectQuery(results);
        } // This is a map of prefix strings to models, e.g. user.projects -> Project model


        const prefixes = this._collectModels(this.options.include);

        results = results.map(result => {
          return _.mapValues(result, (value, name) => {
            let model;

            if (name.includes(".")) {
              const lastind = name.lastIndexOf(".");
              model = prefixes[name.substr(0, lastind)];
              name = name.substr(lastind + 1);
            } else {
              model = this.options.model;
            }

            const tableName = model.getTableName().toString().replace(/`/g, "");
            const tableTypes = columnTypes[tableName] || {};

            if (tableTypes && !(name in tableTypes)) {
              // The column is aliased
              _.forOwn(model.rawAttributes, (attribute, key) => {
                if (name === key && attribute.field) {
                  name = attribute.field;
                  return false;
                }
              });
            }

            return Object.prototype.hasOwnProperty.call(tableTypes, name) ? this.applyParsers(tableTypes[name], value) : value;
          });
        });
        return this.handleSelectQuery(results);
      }

      if (this.isShowOrDescribeQuery()) {
        return results;
      }

      if (this.sql.includes("PRAGMA INDEX_LIST")) {
        return this.handleShowIndexesQuery(results);
      }

      if (this.sql.includes("PRAGMA INDEX_INFO")) {
        return results;
      }

      if (this.sql.includes("PRAGMA TABLE_INFO")) {
        // this is the sqlite way of getting the metadata of a table
        result = {};

        if (Array.isArray(results)) {
          let defaultValue;

          for (const _result of results) {
            if (_result.dflt_value === null) {
              // Column schema omits any "DEFAULT ..."
              defaultValue = undefined;
            } else if (_result.dflt_value === "NULL") {
              // Column schema is a "DEFAULT NULL"
              defaultValue = null;
            } else {
              defaultValue = _result.dflt_value;
            }

            result[_result.name] = {
              type: _result.type,
              allowNull: _result.notnull === 0,
              defaultValue,
              primaryKey: _result.pk !== 0
            };

            if (result[_result.name].type === "TINYINT(1)") {
              result[_result.name].defaultValue = {
                "0": false,
                "1": true
              }[result[_result.name].defaultValue];
            }

            if (typeof result[_result.name].defaultValue === "string") {
              result[_result.name].defaultValue = result[_result.name].defaultValue.replace(/'/g, "");
            }
          }
        }

        return result;
      }

      if (this.sql.includes("PRAGMA foreign_keys;")) {
        return results[0];
      }

      if (this.sql.includes("PRAGMA foreign_keys")) {
        return results;
      }

      if (this.sql.includes("PRAGMA foreign_key_list")) {
        return results;
      }

      if ([QueryTypes.BULKUPDATE, QueryTypes.BULKDELETE].includes(this.options.type)) {
        return metaData.changes;
      }

      if (this.options.type === QueryTypes.UPSERT) {
        return undefined;
      }

      if (this.options.type === QueryTypes.VERSION) {
        return results[0].version;
      }

      if (this.options.type === QueryTypes.RAW) {
        return [results, metaData];
      }

      if (this.isUpdateQuery() || this.isInsertQuery()) {
        return [result, metaData.changes];
      }

      return result;
    } // websql : polyfill foreign key https://justatheory.com/2004/11/sqlite-foreign-key-triggers/

  }, {
    key: "run",
    value: function run(sql, parameters) {
      // exec does not support bind parameter
      this.sql = AbstractQuery.formatBindParameters(sql, this.options.bind, this.options.dialect || "sqlite", {
        skipUnescape: false
      })[0];
      const method = this.getDatabaseMethod();

      const complete = this._logQuery(this.sql, debug, parameters);

      const query = this;
      const self = this;
      const conn = this.connection;
      return new Promise(resolve => {
        const columnTypes = {}; // eslint-disable-next-line

        const executeSql = () => {
          if (sql.startsWith("-- ")) {
            return resolve();
          }

          resolve(new Promise((resolve, reject) => {
            if (method === "exec") {
              if (typeof conn.exec === "function") {
                conn.exec([{
                  sql: self.sql,
                  args: []
                }], false, (executionError, results) => {
                  try {
                    complete(); // TODO: Check return PRAGMA INDEX_LIST and INDEX_INFO

                    results = query.convertToArray(results[0]); // `this` is passed from sqlite, we have no control over this.
                    // eslint-disable-next-line no-invalid-this

                    resolve(query._handleQueryResponse(self, columnTypes, executionError, results));
                    return;
                  } catch (error) {
                    reject(error);
                  }
                });
              } else {
                resolve();
              }
            } else {
              conn.transaction(function (t) {
                // cannot use arrow function here because the function is bound to the statement
                // eslint-disable-next-line
                var successCallback = function (_, results) {
                  try {
                    complete(); // `self` is passed from sqlite, we have no control over this.
                    // eslint-disable-next-line no-invalid-this

                    if (results.rowsAffected) {
                      try {
                        self[self.getInsertIdField()] = results.insertId;
                      } catch (e) {
                        delete self[self.getInsertIdField()];
                      }
                    }

                    self.changes = results.rowsAffected;
                    results = query.convertToArray(results);
                    resolve(query._handleQueryResponse(self, columnTypes, undefined, results));
                    return;
                  } catch (error) {
                    debug(error);
                    reject(error);
                  }
                }; // eslint-disable-next-line


                var errorCallback = function (_, err) {
                  try {
                    complete(); // `self` is passed from sqlite, we have no control over this.
                    // eslint-disable-next-line no-invalid-this

                    resolve(query._handleQueryResponse(self, columnTypes, err));
                  } catch (error) {
                    reject(error);
                  }
                };

                if (typeof conn.exec === "function") {
                  parameters = parameters || [];
                } else parameters = [];

                t.executeSql(self.sql, parameters, successCallback, errorCallback);
              });
            }
          }));
          return null;
        };

        if (method === "all" && typeof conn.exec === "function") {
          let tableNames = [];

          if (this.options && this.options.tableNames) {
            tableNames = this.options.tableNames;
          } else if (/FROM `(.*?)`/i.exec(this.sql)) {
            tableNames.push(/FROM `(.*?)`/i.exec(this.sql)[1]);
          } // If we already have the metadata for the table, there's no need to ask for it again


          tableNames = tableNames.filter(tableName => !(tableName in columnTypes) && tableName !== "sqlite_master");

          if (!tableNames.length) {
            return executeSql();
          }

          return new Promise(resolve => {
            if (typeof conn.exec === "function") {
              const sqlCommands = tableNames.map(tableName => {
                tableName = tableName.replace(/`/g, "");
                columnTypes[tableName] = {};
                return [`PRAGMA table_info(\`${tableName}\`)`, tableName];
              });
              conn.exec(sqlCommands.map(sqlCmd => ({
                sql: sqlCmd[0],
                args: []
              })), false, (err, results) => {
                if (!err) {
                  for (let i = 0; i < sqlCommands.length; i++) {
                    const tableName = sqlCommands[i][1];

                    for (const result of results[i].rows) {
                      columnTypes[tableName][result.name] = result.type;
                    }
                  }
                }

                resolve();
              });
            } else {
              conn.transaction(function (t) {
                tableNames.forEach((tableName, index) => {
                  t.executeSql(`SELECT sql FROM sqlite_master WHERE tbl_name='${tableName}' and type='table'`, [], function (_, result) {
                    const table = result.rows.item(0);

                    if (typeof table === "object" && "sql" in table && typeof table.sql === "string") {
                      columnTypes[tableName] = {}; //match column name with data types

                      const columns = table.sql.match(/(`\w+`)((\s([A-Z]+)((\(\d+\)))?))/g); // split column names with data type

                      for (const col of columns) {
                        const [colName, colType] = col.trim().replace(/\s+/g, " ").replace(/`/g, "").split(" ");
                        columnTypes[tableName][colName] = colType.trim();
                      }
                    } //console.log(columnTypes)

                  });
                  if (index === tableNames.length - 1) resolve();
                });
              });
            }
          }).then(executeSql);
        }

        return executeSql();
      });
    }
  }, {
    key: "parseConstraintsFromSql",
    value: function parseConstraintsFromSql(sql) {
      let constraints = sql.split("CONSTRAINT ");
      let referenceTableName, referenceTableKeys, updateAction, deleteAction;
      constraints.splice(0, 1);
      constraints = constraints.map(constraintSql => {
        //Parse foreign key snippets
        if (constraintSql.includes("REFERENCES")) {
          //Parse out the constraint condition form sql string
          updateAction = constraintSql.match(/ON UPDATE (CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT){1}/);
          deleteAction = constraintSql.match(/ON DELETE (CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT){1}/);

          if (updateAction) {
            updateAction = updateAction[1];
          }

          if (deleteAction) {
            deleteAction = deleteAction[1];
          }

          const referencesRegex = /REFERENCES.+\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/;
          const referenceConditions = constraintSql.match(referencesRegex)[0].split(" ");
          referenceTableName = Utils.removeTicks(referenceConditions[1]);
          let columnNames = referenceConditions[2];
          columnNames = columnNames.replace(/\(|\)/g, "").split(", ");
          referenceTableKeys = columnNames.map(column => Utils.removeTicks(column));
        }

        const constraintCondition = constraintSql.match(/\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/)[0];
        constraintSql = constraintSql.replace(/\(.+\)/, "");
        const constraint = constraintSql.split(" ");

        if (constraint[1] === "PRIMARY" || constraint[1] === "FOREIGN") {
          constraint[1] += " KEY";
        }

        return {
          constraintName: Utils.removeTicks(constraint[0]),
          constraintType: constraint[1],
          updateAction,
          deleteAction,
          sql: sql.replace(/"/g, "`"),
          //Sqlite returns double quotes for table name
          constraintCondition,
          referenceTableName,
          referenceTableKeys
        };
      });
      return constraints;
    }
  }, {
    key: "applyParsers",
    value: function applyParsers(type, value) {
      if (type.includes("(")) {
        // Remove the length part
        type = type.substr(0, type.indexOf("("));
      }

      type = type.replace("UNSIGNED", "").replace("ZEROFILL", "");
      type = type.trim().toUpperCase();
      const parse = parserStore.get(type);

      if (value !== null && parse) {
        return parse(value, {
          timezone: this.sequelize.options.timezone
        });
      }

      return value;
    }
  }, {
    key: "formatError",
    value: function formatError(err) {
      switch (err.code) {
        case "SQLITE_CONSTRAINT":
          {
            if (err.message.includes("FOREIGN KEY constraint failed")) {
              return new sequelizeErrors.ForeignKeyConstraintError({
                parent: err
              });
            }

            let fields = []; // Sqlite pre 2.2 behavior - Error: SQLITE_CONSTRAINT: columns x, y are not unique

            let match = err.message.match(/columns (.*?) are/);

            if (match !== null && match.length >= 2) {
              fields = match[1].split(", ");
            } else {
              // Sqlite post 2.2 behavior - Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: table.x, table.y
              match = err.message.match(/UNIQUE constraint failed: (.*)/);

              if (match !== null && match.length >= 2) {
                fields = match[1].split(", ").map(columnWithTable => columnWithTable.split(".")[1]);
              }
            }

            const errors = [];
            let message = "Validation error";

            for (const field of fields) {
              errors.push(new sequelizeErrors.ValidationErrorItem(this.getUniqueConstraintErrorMessage(field), "unique violation", // sequelizeErrors.ValidationErrorItem.Origins.DB,
              field, this.instance && this.instance[field], this.instance, "not_unique"));
            }

            if (this.model) {
              _.forOwn(this.model.uniqueKeys, constraint => {
                if (_.isEqual(constraint.fields, fields) && !!constraint.msg) {
                  message = constraint.msg;
                  return false;
                }
              });
            }

            return new sequelizeErrors.UniqueConstraintError({
              message,
              errors,
              parent: err,
              fields
            });
          }

        case "SQLITE_BUSY":
          return new sequelizeErrors.TimeoutError(err);

        default:
          return new sequelizeErrors.DatabaseError(err);
      }
    }
  }, {
    key: "handleShowIndexesQuery",
    value: function handleShowIndexesQuery(data) {
      // Sqlite returns indexes so the one that was defined last is returned first. Lets reverse that!
      return Promise.map(data.reverse(), item => {
        item.fields = [];
        item.primary = false;
        item.unique = !!item.unique;
        item.constraintName = item.name;
        return this.run(`PRAGMA INDEX_INFO(\`${item.name}\`)`).then(columns => {
          for (const column of columns) {
            item.fields[column.seqno] = {
              attribute: column.name,
              length: undefined,
              order: undefined
            };
          }

          return item;
        });
      });
    }
  }, {
    key: "getDatabaseMethod",
    value: function getDatabaseMethod() {
      if (this.sql.includes("PRAGMA") || this.sql.includes("COMMIT") || this.sql.includes("ROLLBACK") || this.sql.includes("TRANSACTION")) {
        return "exec"; // Needed to run no-op transaction
      }

      if (this.isInsertQuery() || this.isUpdateQuery() || this.isBulkUpdateQuery() || this.sql.toLowerCase().includes("CREATE TEMPORARY TABLE".toLowerCase()) || this.options.type === QueryTypes.BULKDELETE) {
        return "run";
      }

      return "all";
    }
  }, {
    key: "convertToArray",
    value: function convertToArray(results) {
      if (!results.rows) return [];
      if ("array" in results || "_array" in results.rows) return results.array || results.rows._array;
      if (!results.rows.item) return results.rows;
      const data = new Array(results.rows.length);

      for (let i = 0; i < results.rows.length; i++) {
        data[i] = results.rows.item(i);
      }

      return data;
    }
  }], [{
    key: "formatBindParameters",
    value: function formatBindParameters(sql, values, dialect) {
      let bindParam;

      if (Array.isArray(values)) {
        bindParam = {};
        values.forEach((v, i) => {
          bindParam[`$${i + 1}`] = v;
        });
        sql = AbstractQuery.formatBindParameters(sql, values, dialect, {
          skipValueReplace: true
        })[0];
      } else {
        bindParam = {};

        if (typeof values === "object") {
          for (const k of Object.keys(values)) {
            bindParam[`$${k}`] = values[k];
          }
        }

        sql = AbstractQuery.formatBindParameters(sql, values, dialect, {
          skipValueReplace: true
        })[0];
      }

      return [sql, bindParam];
    }
  }]);

  return Query;
}(AbstractQuery);

module.exports = Query;
module.exports.Query = Query;
module.exports.default = Query;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvcXVlcnkuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJVdGlscyIsIlByb21pc2UiLCJBYnN0cmFjdFF1ZXJ5IiwiUXVlcnlUeXBlcyIsInNlcXVlbGl6ZUVycm9ycyIsInBhcnNlclN0b3JlIiwibG9nZ2VyIiwiZGVidWciLCJkZWJ1Z0NvbnRleHQiLCJnZXRNZXRob2RzIiwib2JqIiwicHJvcGVydGllcyIsIlNldCIsImN1cnJlbnRPYmoiLCJPYmplY3QiLCJnZXRPd25Qcm9wZXJ0eU5hbWVzIiwibWFwIiwiaXRlbSIsImFkZCIsImdldFByb3RvdHlwZU9mIiwia2V5cyIsImZpbHRlciIsIlF1ZXJ5IiwiaW5jbHVkZSIsInByZWZpeCIsInJldCIsIl9pbmNsdWRlIiwia2V5IiwiYXMiLCJtb2RlbCIsIm1lcmdlIiwiX2NvbGxlY3RNb2RlbHMiLCJtZXRhRGF0YSIsImNvbHVtblR5cGVzIiwiZXJyIiwicmVzdWx0cyIsInNxbCIsImZvcm1hdEVycm9yIiwicmVzdWx0IiwiaW5zdGFuY2UiLCJpc0luc2VydFF1ZXJ5IiwiaGFuZGxlSW5zZXJ0UXVlcnkiLCJhdXRvSW5jcmVtZW50QXR0cmlidXRlIiwicHJpbWFyeUtleUF0dHJpYnV0ZSIsInJhd0F0dHJpYnV0ZXMiLCJzdGFydElkIiwiZ2V0SW5zZXJ0SWRGaWVsZCIsImNoYW5nZXMiLCJpIiwicHVzaCIsImZpZWxkIiwiaXNTaG93VGFibGVzUXVlcnkiLCJyb3ciLCJuYW1lIiwiaXNTaG93Q29uc3RyYWludHNRdWVyeSIsInBhcnNlQ29uc3RyYWludHNGcm9tU3FsIiwiaXNTZWxlY3RRdWVyeSIsIm9wdGlvbnMiLCJyYXciLCJoYW5kbGVTZWxlY3RRdWVyeSIsInByZWZpeGVzIiwibWFwVmFsdWVzIiwidmFsdWUiLCJpbmNsdWRlcyIsImxhc3RpbmQiLCJsYXN0SW5kZXhPZiIsInN1YnN0ciIsInRhYmxlTmFtZSIsImdldFRhYmxlTmFtZSIsInRvU3RyaW5nIiwicmVwbGFjZSIsInRhYmxlVHlwZXMiLCJmb3JPd24iLCJhdHRyaWJ1dGUiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJhcHBseVBhcnNlcnMiLCJpc1Nob3dPckRlc2NyaWJlUXVlcnkiLCJoYW5kbGVTaG93SW5kZXhlc1F1ZXJ5IiwiQXJyYXkiLCJpc0FycmF5IiwiZGVmYXVsdFZhbHVlIiwiX3Jlc3VsdCIsImRmbHRfdmFsdWUiLCJ1bmRlZmluZWQiLCJ0eXBlIiwiYWxsb3dOdWxsIiwibm90bnVsbCIsInByaW1hcnlLZXkiLCJwayIsIkJVTEtVUERBVEUiLCJCVUxLREVMRVRFIiwiVVBTRVJUIiwiVkVSU0lPTiIsInZlcnNpb24iLCJSQVciLCJpc1VwZGF0ZVF1ZXJ5IiwicGFyYW1ldGVycyIsImZvcm1hdEJpbmRQYXJhbWV0ZXJzIiwiYmluZCIsImRpYWxlY3QiLCJza2lwVW5lc2NhcGUiLCJtZXRob2QiLCJnZXREYXRhYmFzZU1ldGhvZCIsImNvbXBsZXRlIiwiX2xvZ1F1ZXJ5IiwicXVlcnkiLCJzZWxmIiwiY29ubiIsImNvbm5lY3Rpb24iLCJyZXNvbHZlIiwiZXhlY3V0ZVNxbCIsInN0YXJ0c1dpdGgiLCJyZWplY3QiLCJleGVjIiwiYXJncyIsImV4ZWN1dGlvbkVycm9yIiwiY29udmVydFRvQXJyYXkiLCJfaGFuZGxlUXVlcnlSZXNwb25zZSIsImVycm9yIiwidHJhbnNhY3Rpb24iLCJ0Iiwic3VjY2Vzc0NhbGxiYWNrIiwicm93c0FmZmVjdGVkIiwiaW5zZXJ0SWQiLCJlIiwiZXJyb3JDYWxsYmFjayIsInRhYmxlTmFtZXMiLCJsZW5ndGgiLCJzcWxDb21tYW5kcyIsInNxbENtZCIsInJvd3MiLCJmb3JFYWNoIiwiaW5kZXgiLCJ0YWJsZSIsImNvbHVtbnMiLCJtYXRjaCIsImNvbCIsImNvbE5hbWUiLCJjb2xUeXBlIiwidHJpbSIsInNwbGl0IiwidGhlbiIsImNvbnN0cmFpbnRzIiwicmVmZXJlbmNlVGFibGVOYW1lIiwicmVmZXJlbmNlVGFibGVLZXlzIiwidXBkYXRlQWN0aW9uIiwiZGVsZXRlQWN0aW9uIiwic3BsaWNlIiwiY29uc3RyYWludFNxbCIsInJlZmVyZW5jZXNSZWdleCIsInJlZmVyZW5jZUNvbmRpdGlvbnMiLCJyZW1vdmVUaWNrcyIsImNvbHVtbk5hbWVzIiwiY29sdW1uIiwiY29uc3RyYWludENvbmRpdGlvbiIsImNvbnN0cmFpbnQiLCJjb25zdHJhaW50TmFtZSIsImNvbnN0cmFpbnRUeXBlIiwiaW5kZXhPZiIsInRvVXBwZXJDYXNlIiwicGFyc2UiLCJnZXQiLCJ0aW1lem9uZSIsInNlcXVlbGl6ZSIsImNvZGUiLCJtZXNzYWdlIiwiRm9yZWlnbktleUNvbnN0cmFpbnRFcnJvciIsInBhcmVudCIsImZpZWxkcyIsImNvbHVtbldpdGhUYWJsZSIsImVycm9ycyIsIlZhbGlkYXRpb25FcnJvckl0ZW0iLCJnZXRVbmlxdWVDb25zdHJhaW50RXJyb3JNZXNzYWdlIiwidW5pcXVlS2V5cyIsImlzRXF1YWwiLCJtc2ciLCJVbmlxdWVDb25zdHJhaW50RXJyb3IiLCJUaW1lb3V0RXJyb3IiLCJEYXRhYmFzZUVycm9yIiwiZGF0YSIsInJldmVyc2UiLCJwcmltYXJ5IiwidW5pcXVlIiwicnVuIiwic2Vxbm8iLCJvcmRlciIsImlzQnVsa1VwZGF0ZVF1ZXJ5IiwidG9Mb3dlckNhc2UiLCJhcnJheSIsIl9hcnJheSIsInZhbHVlcyIsImJpbmRQYXJhbSIsInYiLCJza2lwVmFsdWVSZXBsYWNlIiwiayIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsQ0FBQyxHQUFHQyxPQUFPLENBQUMsUUFBRCxDQUFqQjs7QUFDQSxNQUFNQyxLQUFLLEdBQUdELE9BQU8sQ0FBQyxhQUFELENBQXJCOztBQUNBLE1BQU1FLE9BQU8sR0FBR0YsT0FBTyxDQUFDLGVBQUQsQ0FBdkI7O0FBQ0EsTUFBTUcsYUFBYSxHQUFHSCxPQUFPLENBQUMsbUJBQUQsQ0FBN0I7O0FBQ0Es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QWVoTCxLQUFmLEdBQXVCQSxLQUF2QjtBQUNBK0ssTUFBTSxDQUFDQyxPQUFQLENBQWVDLE9BQWYsR0FBeUJqTCxLQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxuY29uc3QgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XHJcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzXCIpO1xyXG5jb25zdCBQcm9taXNlID0gcmVxdWlyZShcIi4uLy4uL3Byb21pc2VcIik7XHJcbmNvbnN0IEFic3RyYWN0UXVlcnkgPSByZXF1aXJlKFwiLi4vYWJzdHJhY3QvcXVlcnlcIik7XHJcbmNvbnN0IFF1ZXJ5VHlwZXMgPSByZXF1aXJlKFwiLi4vLi4vcXVlcnktdHlwZXNcIik7XHJcbmNvbnN0IHNlcXVlbGl6ZUVycm9ycyA9IHJlcXVpcmUoXCIuLi8uLi9lcnJvcnNcIik7XHJcbmNvbnN0IHBhcnNlclN0b3JlID0gcmVxdWlyZShcIi4uL3BhcnNlclN0b3JlXCIpKFwic3FsaXRlXCIpO1xyXG5jb25zdCB7IGxvZ2dlciB9ID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL2xvZ2dlclwiKTtcclxuXHJcbmNvbnN0IGRlYnVnID0gbG9nZ2VyLmRlYnVnQ29udGV4dChcInNxbDpzcWxpdGVcIik7XHJcbmNvbnN0IGdldE1ldGhvZHMgPSBvYmogPT4ge1xyXG4gIGxldCBwcm9wZXJ0aWVzID0gbmV3IFNldCgpO1xyXG4gIGxldCBjdXJyZW50T2JqID0gb2JqO1xyXG4gIGRvIHtcclxuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGN1cnJlbnRPYmopLm1hcChpdGVtID0+IHByb3BlcnRpZXMuYWRkKGl0ZW0pKTtcclxuICB9IHdoaWxlICgoY3VycmVudE9iaiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihjdXJyZW50T2JqKSkpO1xyXG4gIHJldHVybiBbLi4ucHJvcGVydGllcy5rZXlzKCldLmZpbHRlcihpdGVtID0+IHR5cGVvZiBvYmpbaXRlbV0gPT09IFwiZnVuY3Rpb25cIik7XHJcbn07XHJcbmNsYXNzIFF1ZXJ5IGV4dGVuZHMgQWJzdHJhY3RRdWVyeSB7XHJcbiAgZ2V0SW5zZXJ0SWRGaWVsZCgpIHtcclxuICAgIHJldHVybiBcImxhc3RJRFwiO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogcmV3cml0ZSBxdWVyeSB3aXRoIHBhcmFtZXRlcnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3FsXHJcbiAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHZhbHVlc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkaWFsZWN0XHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBzdGF0aWMgZm9ybWF0QmluZFBhcmFtZXRlcnMoc3FsLCB2YWx1ZXMsIGRpYWxlY3QpIHtcclxuICAgIGxldCBiaW5kUGFyYW07XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZXMpKSB7XHJcbiAgICAgIGJpbmRQYXJhbSA9IHt9O1xyXG4gICAgICB2YWx1ZXMuZm9yRWFjaCgodiwgaSkgPT4ge1xyXG4gICAgICAgIGJpbmRQYXJhbVtgJCR7aSArIDF9YF0gPSB2O1xyXG4gICAgICB9KTtcclxuICAgICAgc3FsID0gQWJzdHJhY3RRdWVyeS5mb3JtYXRCaW5kUGFyYW1ldGVycyhzcWwsIHZhbHVlcywgZGlhbGVjdCwge1xyXG4gICAgICAgIHNraXBWYWx1ZVJlcGxhY2U6IHRydWVcclxuICAgICAgfSlbMF07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBiaW5kUGFyYW0gPSB7fTtcclxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZXMgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGsgb2YgT2JqZWN0LmtleXModmFsdWVzKSkge1xyXG4gICAgICAgICAgYmluZFBhcmFtW2AkJHtrfWBdID0gdmFsdWVzW2tdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBzcWwgPSBBYnN0cmFjdFF1ZXJ5LmZvcm1hdEJpbmRQYXJhbWV0ZXJzKHNxbCwgdmFsdWVzLCBkaWFsZWN0LCB7XHJcbiAgICAgICAgc2tpcFZhbHVlUmVwbGFjZTogdHJ1ZVxyXG4gICAgICB9KVswXTtcclxuICAgIH1cclxuICAgIHJldHVybiBbc3FsLCBiaW5kUGFyYW1dO1xyXG4gIH1cclxuXHJcbiAgX2NvbGxlY3RNb2RlbHMoaW5jbHVkZSwgcHJlZml4KSB7XHJcbiAgICBjb25zdCByZXQgPSB7fTtcclxuXHJcbiAgICBpZiAoaW5jbHVkZSkge1xyXG4gICAgICBmb3IgKGNvbnN0IF9pbmNsdWRlIG9mIGluY2x1ZGUpIHtcclxuICAgICAgICBsZXQga2V5O1xyXG4gICAgICAgIGlmICghcHJlZml4KSB7XHJcbiAgICAgICAgICBrZXkgPSBfaW5jbHVkZS5hcztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAga2V5ID0gYCR7cHJlZml4fS4ke19pbmNsdWRlLmFzfWA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldFtrZXldID0gX2luY2x1ZGUubW9kZWw7XHJcblxyXG4gICAgICAgIGlmIChfaW5jbHVkZS5pbmNsdWRlKSB7XHJcbiAgICAgICAgICBfLm1lcmdlKHJldCwgdGhpcy5fY29sbGVjdE1vZGVscyhfaW5jbHVkZS5pbmNsdWRlLCBrZXkpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmV0O1xyXG4gIH1cclxuXHJcbiAgX2hhbmRsZVF1ZXJ5UmVzcG9uc2UobWV0YURhdGEsIGNvbHVtblR5cGVzLCBlcnIsIHJlc3VsdHMpIHtcclxuICAgIGlmIChlcnIpIHtcclxuICAgICAgZXJyLnNxbCA9IHRoaXMuc3FsO1xyXG4gICAgICB0aHJvdyB0aGlzLmZvcm1hdEVycm9yKGVycik7XHJcbiAgICB9XHJcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5pbnN0YW5jZTtcclxuICAgIC8vIGFkZCB0aGUgaW5zZXJ0ZWQgcm93IGlkIHRvIHRoZSBpbnN0YW5jZVxyXG4gICAgaWYgKHRoaXMuaXNJbnNlcnRRdWVyeShyZXN1bHRzLCBtZXRhRGF0YSkpIHtcclxuICAgICAgdGhpcy5oYW5kbGVJbnNlcnRRdWVyeShyZXN1bHRzLCBtZXRhRGF0YSk7XHJcbiAgICAgIGlmICghdGhpcy5pbnN0YW5jZSkge1xyXG4gICAgICAgIC8vIGhhbmRsZSBidWxrQ3JlYXRlIEFJIHByaW1hcnkga2V5XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgLyogIG1ldGFEYXRhLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiU3RhdGVtZW50XCIgJiYgKi9cclxuICAgICAgICAgIHRoaXMubW9kZWwgJiZcclxuICAgICAgICAgIHRoaXMubW9kZWwuYXV0b0luY3JlbWVudEF0dHJpYnV0ZSAmJlxyXG4gICAgICAgICAgdGhpcy5tb2RlbC5hdXRvSW5jcmVtZW50QXR0cmlidXRlID09PVxyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGUgJiZcclxuICAgICAgICAgIHRoaXMubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGVdXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBjb25zdCBzdGFydElkID1cclxuICAgICAgICAgICAgbWV0YURhdGFbdGhpcy5nZXRJbnNlcnRJZEZpZWxkKCldIC0gbWV0YURhdGEuY2hhbmdlcyArIDE7XHJcblxyXG4gICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gc3RhcnRJZDsgaSA8IHN0YXJ0SWQgKyBtZXRhRGF0YS5jaGFuZ2VzOyBpKyspIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xyXG4gICAgICAgICAgICAgIFt0aGlzLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5tb2RlbC5wcmltYXJ5S2V5QXR0cmlidXRlXVxyXG4gICAgICAgICAgICAgICAgLmZpZWxkXTogaVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmVzdWx0ID0gbWV0YURhdGFbdGhpcy5nZXRJbnNlcnRJZEZpZWxkKCldO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmlzU2hvd1RhYmxlc1F1ZXJ5KCkpIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdHMubWFwKHJvdyA9PiByb3cubmFtZSk7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5pc1Nob3dDb25zdHJhaW50c1F1ZXJ5KCkpIHtcclxuICAgICAgcmVzdWx0ID0gcmVzdWx0cztcclxuICAgICAgaWYgKHJlc3VsdHMgJiYgcmVzdWx0c1swXSAmJiByZXN1bHRzWzBdLnNxbCkge1xyXG4gICAgICAgIHJlc3VsdCA9IHRoaXMucGFyc2VDb25zdHJhaW50c0Zyb21TcWwocmVzdWx0c1swXS5zcWwpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5pc1NlbGVjdFF1ZXJ5KCkpIHtcclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYXcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVTZWxlY3RRdWVyeShyZXN1bHRzKTtcclxuICAgICAgfVxyXG4gICAgICAvLyBUaGlzIGlzIGEgbWFwIG9mIHByZWZpeCBzdHJpbmdzIHRvIG1vZGVscywgZS5nLiB1c2VyLnByb2plY3RzIC0+IFByb2plY3QgbW9kZWxcclxuICAgICAgY29uc3QgcHJlZml4ZXMgPSB0aGlzLl9jb2xsZWN0TW9kZWxzKHRoaXMub3B0aW9ucy5pbmNsdWRlKTtcclxuXHJcbiAgICAgIHJlc3VsdHMgPSByZXN1bHRzLm1hcChyZXN1bHQgPT4ge1xyXG4gICAgICAgIHJldHVybiBfLm1hcFZhbHVlcyhyZXN1bHQsICh2YWx1ZSwgbmFtZSkgPT4ge1xyXG4gICAgICAgICAgbGV0IG1vZGVsO1xyXG4gICAgICAgICAgaWYgKG5hbWUuaW5jbHVkZXMoXCIuXCIpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxhc3RpbmQgPSBuYW1lLmxhc3RJbmRleE9mKFwiLlwiKTtcclxuXHJcbiAgICAgICAgICAgIG1vZGVsID0gcHJlZml4ZXNbbmFtZS5zdWJzdHIoMCwgbGFzdGluZCldO1xyXG5cclxuICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKGxhc3RpbmQgKyAxKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG1vZGVsID0gdGhpcy5vcHRpb25zLm1vZGVsO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnN0IHRhYmxlTmFtZSA9IG1vZGVsXHJcbiAgICAgICAgICAgIC5nZXRUYWJsZU5hbWUoKVxyXG4gICAgICAgICAgICAudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvYC9nLCBcIlwiKTtcclxuICAgICAgICAgIGNvbnN0IHRhYmxlVHlwZXMgPSBjb2x1bW5UeXBlc1t0YWJsZU5hbWVdIHx8IHt9O1xyXG5cclxuICAgICAgICAgIGlmICh0YWJsZVR5cGVzICYmICEobmFtZSBpbiB0YWJsZVR5cGVzKSkge1xyXG4gICAgICAgICAgICAvLyBUaGUgY29sdW1uIGlzIGFsaWFzZWRcclxuICAgICAgICAgICAgXy5mb3JPd24obW9kZWwucmF3QXR0cmlidXRlcywgKGF0dHJpYnV0ZSwga2V5KSA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKG5hbWUgPT09IGtleSAmJiBhdHRyaWJ1dGUuZmllbGQpIHtcclxuICAgICAgICAgICAgICAgIG5hbWUgPSBhdHRyaWJ1dGUuZmllbGQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRhYmxlVHlwZXMsIG5hbWUpXHJcbiAgICAgICAgICAgID8gdGhpcy5hcHBseVBhcnNlcnModGFibGVUeXBlc1tuYW1lXSwgdmFsdWUpXHJcbiAgICAgICAgICAgIDogdmFsdWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2VsZWN0UXVlcnkocmVzdWx0cyk7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5pc1Nob3dPckRlc2NyaWJlUXVlcnkoKSkge1xyXG4gICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH1cclxuICAgIGlmICh0aGlzLnNxbC5pbmNsdWRlcyhcIlBSQUdNQSBJTkRFWF9MSVNUXCIpKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmhhbmRsZVNob3dJbmRleGVzUXVlcnkocmVzdWx0cyk7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5zcWwuaW5jbHVkZXMoXCJQUkFHTUEgSU5ERVhfSU5GT1wiKSkge1xyXG4gICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH1cclxuICAgIGlmICh0aGlzLnNxbC5pbmNsdWRlcyhcIlBSQUdNQSBUQUJMRV9JTkZPXCIpKSB7XHJcbiAgICAgIC8vIHRoaXMgaXMgdGhlIHNxbGl0ZSB3YXkgb2YgZ2V0dGluZyB0aGUgbWV0YWRhdGEgb2YgYSB0YWJsZVxyXG4gICAgICByZXN1bHQgPSB7fTtcclxuXHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdHMpKSB7XHJcbiAgICAgICAgbGV0IGRlZmF1bHRWYWx1ZTtcclxuICAgICAgICBmb3IgKGNvbnN0IF9yZXN1bHQgb2YgcmVzdWx0cykge1xyXG4gICAgICAgICAgaWYgKF9yZXN1bHQuZGZsdF92YWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBDb2x1bW4gc2NoZW1hIG9taXRzIGFueSBcIkRFRkFVTFQgLi4uXCJcclxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChfcmVzdWx0LmRmbHRfdmFsdWUgPT09IFwiTlVMTFwiKSB7XHJcbiAgICAgICAgICAgIC8vIENvbHVtbiBzY2hlbWEgaXMgYSBcIkRFRkFVTFQgTlVMTFwiXHJcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IG51bGw7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBfcmVzdWx0LmRmbHRfdmFsdWU7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmVzdWx0W19yZXN1bHQubmFtZV0gPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IF9yZXN1bHQudHlwZSxcclxuICAgICAgICAgICAgYWxsb3dOdWxsOiBfcmVzdWx0Lm5vdG51bGwgPT09IDAsXHJcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSxcclxuICAgICAgICAgICAgcHJpbWFyeUtleTogX3Jlc3VsdC5wayAhPT0gMFxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBpZiAocmVzdWx0W19yZXN1bHQubmFtZV0udHlwZSA9PT0gXCJUSU5ZSU5UKDEpXCIpIHtcclxuICAgICAgICAgICAgcmVzdWx0W19yZXN1bHQubmFtZV0uZGVmYXVsdFZhbHVlID0geyBcIjBcIjogZmFsc2UsIFwiMVwiOiB0cnVlIH1bXHJcbiAgICAgICAgICAgICAgcmVzdWx0W19yZXN1bHQubmFtZV0uZGVmYXVsdFZhbHVlXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHRbX3Jlc3VsdC5uYW1lXS5kZWZhdWx0VmFsdWUgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgcmVzdWx0W19yZXN1bHQubmFtZV0uZGVmYXVsdFZhbHVlID0gcmVzdWx0W1xyXG4gICAgICAgICAgICAgIF9yZXN1bHQubmFtZVxyXG4gICAgICAgICAgICBdLmRlZmF1bHRWYWx1ZS5yZXBsYWNlKC8nL2csIFwiXCIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLnNxbC5pbmNsdWRlcyhcIlBSQUdNQSBmb3JlaWduX2tleXM7XCIpKSB7XHJcbiAgICAgIHJldHVybiByZXN1bHRzWzBdO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuc3FsLmluY2x1ZGVzKFwiUFJBR01BIGZvcmVpZ25fa2V5c1wiKSkge1xyXG4gICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH1cclxuICAgIGlmICh0aGlzLnNxbC5pbmNsdWRlcyhcIlBSQUdNQSBmb3JlaWduX2tleV9saXN0XCIpKSB7XHJcbiAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfVxyXG4gICAgaWYgKFxyXG4gICAgICBbUXVlcnlUeXBlcy5CVUxLVVBEQVRFLCBRdWVyeVR5cGVzLkJVTEtERUxFVEVdLmluY2x1ZGVzKHRoaXMub3B0aW9ucy50eXBlKVxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiBtZXRhRGF0YS5jaGFuZ2VzO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy50eXBlID09PSBRdWVyeVR5cGVzLlVQU0VSVCkge1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy50eXBlID09PSBRdWVyeVR5cGVzLlZFUlNJT04pIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdHNbMF0udmVyc2lvbjtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5SQVcpIHtcclxuICAgICAgcmV0dXJuIFtyZXN1bHRzLCBtZXRhRGF0YV07XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5pc1VwZGF0ZVF1ZXJ5KCkgfHwgdGhpcy5pc0luc2VydFF1ZXJ5KCkpIHtcclxuICAgICAgcmV0dXJuIFtyZXN1bHQsIG1ldGFEYXRhLmNoYW5nZXNdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcbiAgLy8gd2Vic3FsIDogcG9seWZpbGwgZm9yZWlnbiBrZXkgaHR0cHM6Ly9qdXN0YXRoZW9yeS5jb20vMjAwNC8xMS9zcWxpdGUtZm9yZWlnbi1rZXktdHJpZ2dlcnMvXHJcbiAgcnVuKHNxbCwgcGFyYW1ldGVycykge1xyXG4gICAgLy8gZXhlYyBkb2VzIG5vdCBzdXBwb3J0IGJpbmQgcGFyYW1ldGVyXHJcbiAgICB0aGlzLnNxbCA9IEFic3RyYWN0UXVlcnkuZm9ybWF0QmluZFBhcmFtZXRlcnMoXHJcbiAgICAgIHNxbCxcclxuICAgICAgdGhpcy5vcHRpb25zLmJpbmQsXHJcbiAgICAgIHRoaXMub3B0aW9ucy5kaWFsZWN0IHx8IFwic3FsaXRlXCIsXHJcbiAgICAgIHsgc2tpcFVuZXNjYXBlOiBmYWxzZSB9XHJcbiAgICApWzBdO1xyXG4gICAgY29uc3QgbWV0aG9kID0gdGhpcy5nZXREYXRhYmFzZU1ldGhvZCgpO1xyXG4gICAgY29uc3QgY29tcGxldGUgPSB0aGlzLl9sb2dRdWVyeSh0aGlzLnNxbCwgZGVidWcsIHBhcmFtZXRlcnMpO1xyXG4gICAgY29uc3QgcXVlcnkgPSB0aGlzO1xyXG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICBjb25zdCBjb25uID0gdGhpcy5jb25uZWN0aW9uO1xyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgY29uc3QgY29sdW1uVHlwZXMgPSB7fTtcclxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXHJcbiAgICAgIGNvbnN0IGV4ZWN1dGVTcWwgPSAoKSA9PiB7XHJcbiAgICAgICAgaWYgKHNxbC5zdGFydHNXaXRoKFwiLS0gXCIpKSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXNvbHZlKFxyXG4gICAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobWV0aG9kID09PSBcImV4ZWNcIikge1xyXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgY29ubi5leGVjID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbm4uZXhlYyhcclxuICAgICAgICAgICAgICAgICAgW3sgc3FsOiBzZWxmLnNxbCwgYXJnczogW10gfV0sXHJcbiAgICAgICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAoZXhlY3V0aW9uRXJyb3IsIHJlc3VsdHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IENoZWNrIHJldHVybiBQUkFHTUEgSU5ERVhfTElTVCBhbmQgSU5ERVhfSU5GT1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmNvbnZlcnRUb0FycmF5KHJlc3VsdHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gYHRoaXNgIGlzIHBhc3NlZCBmcm9tIHNxbGl0ZSwgd2UgaGF2ZSBubyBjb250cm9sIG92ZXIgdGhpcy5cclxuICAgICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbnZhbGlkLXRoaXNcclxuICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5Ll9oYW5kbGVRdWVyeVJlc3BvbnNlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uVHlwZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0aW9uRXJyb3IsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjb25uLnRyYW5zYWN0aW9uKGZ1bmN0aW9uKHQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNhbm5vdCB1c2UgYXJyb3cgZnVuY3Rpb24gaGVyZSBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBib3VuZCB0byB0aGUgc3RhdGVtZW50XHJcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcclxuICAgICAgICAgICAgICAgIHZhciBzdWNjZXNzQ2FsbGJhY2sgPSBmdW5jdGlvbihfLCByZXN1bHRzKSB7XHJcbiAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBgc2VsZmAgaXMgcGFzc2VkIGZyb20gc3FsaXRlLCB3ZSBoYXZlIG5vIGNvbnRyb2wgb3ZlciB0aGlzLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbnZhbGlkLXRoaXNcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0cy5yb3dzQWZmZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGZbc2VsZi5nZXRJbnNlcnRJZEZpZWxkKCldID0gcmVzdWx0cy5pbnNlcnRJZFxyXG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2VsZltzZWxmLmdldEluc2VydElkRmllbGQoKV07XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlcyA9IHJlc3VsdHMucm93c0FmZmVjdGVkO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSBxdWVyeS5jb252ZXJ0VG9BcnJheShyZXN1bHRzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgcXVlcnkuX2hhbmRsZVF1ZXJ5UmVzcG9uc2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtblR5cGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHNcclxuICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxyXG4gICAgICAgICAgICAgICAgdmFyIGVycm9yQ2FsbGJhY2sgPSBmdW5jdGlvbihfLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGBzZWxmYCBpcyBwYXNzZWQgZnJvbSBzcWxpdGUsIHdlIGhhdmUgbm8gY29udHJvbCBvdmVyIHRoaXMuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWludmFsaWQtdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocXVlcnkuX2hhbmRsZVF1ZXJ5UmVzcG9uc2Uoc2VsZiwgY29sdW1uVHlwZXMsIGVycikpO1xyXG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbm4uZXhlYyA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHBhcmFtZXRlcnMgPSBbXTtcclxuICAgICAgICAgICAgICAgIHQuZXhlY3V0ZVNxbChcclxuICAgICAgICAgICAgICAgICAgc2VsZi5zcWwsXHJcbiAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnMsXHJcbiAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayxcclxuICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFja1xyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKG1ldGhvZCA9PT0gXCJhbGxcIiAmJiB0eXBlb2YgY29ubi5leGVjID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICBsZXQgdGFibGVOYW1lcyA9IFtdO1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMgJiYgdGhpcy5vcHRpb25zLnRhYmxlTmFtZXMpIHtcclxuICAgICAgICAgIHRhYmxlTmFtZXMgPSB0aGlzLm9wdGlvbnMudGFibGVOYW1lcztcclxuICAgICAgICB9IGVsc2UgaWYgKC9GUk9NIGAoLio/KWAvaS5leGVjKHRoaXMuc3FsKSkge1xyXG4gICAgICAgICAgdGFibGVOYW1lcy5wdXNoKC9GUk9NIGAoLio/KWAvaS5leGVjKHRoaXMuc3FsKVsxXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgdGhlIG1ldGFkYXRhIGZvciB0aGUgdGFibGUsIHRoZXJlJ3Mgbm8gbmVlZCB0byBhc2sgZm9yIGl0IGFnYWluXHJcbiAgICAgICAgdGFibGVOYW1lcyA9IHRhYmxlTmFtZXMuZmlsdGVyKFxyXG4gICAgICAgICAgdGFibGVOYW1lID0+XHJcbiAgICAgICAgICAgICEodGFibGVOYW1lIGluIGNvbHVtblR5cGVzKSAmJiB0YWJsZU5hbWUgIT09IFwic3FsaXRlX21hc3RlclwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICBpZiAoIXRhYmxlTmFtZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNxbCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgICBpZiAodHlwZW9mIGNvbm4uZXhlYyA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNxbENvbW1hbmRzID0gdGFibGVOYW1lcy5tYXAodGFibGVOYW1lID0+IHtcclxuICAgICAgICAgICAgICB0YWJsZU5hbWUgPSB0YWJsZU5hbWUucmVwbGFjZSgvYC9nLCBcIlwiKTtcclxuICAgICAgICAgICAgICBjb2x1bW5UeXBlc1t0YWJsZU5hbWVdID0ge307XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFtgUFJBR01BIHRhYmxlX2luZm8oXFxgJHt0YWJsZU5hbWV9XFxgKWAsIHRhYmxlTmFtZV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25uLmV4ZWMoXHJcbiAgICAgICAgICAgICAgc3FsQ29tbWFuZHMubWFwKHNxbENtZCA9PiAoe1xyXG4gICAgICAgICAgICAgICAgc3FsOiBzcWxDbWRbMF0sXHJcbiAgICAgICAgICAgICAgICBhcmdzOiBbXVxyXG4gICAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgICAgICBmYWxzZSxcclxuICAgICAgICAgICAgICAoZXJyLCByZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVycikge1xyXG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNxbENvbW1hbmRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFibGVOYW1lID0gc3FsQ29tbWFuZHNbaV1bMV07XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0c1tpXS5yb3dzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb2x1bW5UeXBlc1t0YWJsZU5hbWVdW3Jlc3VsdC5uYW1lXSA9IHJlc3VsdC50eXBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbm4udHJhbnNhY3Rpb24oZnVuY3Rpb24odCkge1xyXG4gICAgICAgICAgICAgIHRhYmxlTmFtZXMuZm9yRWFjaCgodGFibGVOYW1lLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdC5leGVjdXRlU3FsKFxyXG4gICAgICAgICAgICAgICAgICBgU0VMRUNUIHNxbCBGUk9NIHNxbGl0ZV9tYXN0ZXIgV0hFUkUgdGJsX25hbWU9JyR7dGFibGVOYW1lfScgYW5kIHR5cGU9J3RhYmxlJ2AsXHJcbiAgICAgICAgICAgICAgICAgIFtdLFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbihfLCByZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWJsZSA9IHJlc3VsdC5yb3dzLml0ZW0oMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHRhYmxlID09PSBcIm9iamVjdFwiICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICBcInNxbFwiIGluIHRhYmxlICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdGFibGUuc3FsID09PSBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb2x1bW5UeXBlc1t0YWJsZU5hbWVdID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAvL21hdGNoIGNvbHVtbiBuYW1lIHdpdGggZGF0YSB0eXBlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sdW1ucyA9IHRhYmxlLnNxbC5tYXRjaChcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyhgXFx3K2ApKChcXHMoW0EtWl0rKSgoXFwoXFxkK1xcKSkpPykpL2dcclxuICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzcGxpdCBjb2x1bW4gbmFtZXMgd2l0aCBkYXRhIHR5cGVcclxuICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY29sIG9mIGNvbHVtbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgW2NvbE5hbWUsIGNvbFR5cGVdID0gY29sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLnRyaW0oKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9gL2csIFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLnNwbGl0KFwiIFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uVHlwZXNbdGFibGVOYW1lXVtjb2xOYW1lXSA9IGNvbFR5cGUudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGNvbHVtblR5cGVzKVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSB0YWJsZU5hbWVzLmxlbmd0aCAtIDEpIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSkudGhlbihleGVjdXRlU3FsKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZXhlY3V0ZVNxbCgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwYXJzZUNvbnN0cmFpbnRzRnJvbVNxbChzcWwpIHtcclxuICAgIGxldCBjb25zdHJhaW50cyA9IHNxbC5zcGxpdChcIkNPTlNUUkFJTlQgXCIpO1xyXG4gICAgbGV0IHJlZmVyZW5jZVRhYmxlTmFtZSwgcmVmZXJlbmNlVGFibGVLZXlzLCB1cGRhdGVBY3Rpb24sIGRlbGV0ZUFjdGlvbjtcclxuICAgIGNvbnN0cmFpbnRzLnNwbGljZSgwLCAxKTtcclxuICAgIGNvbnN0cmFpbnRzID0gY29uc3RyYWludHMubWFwKGNvbnN0cmFpbnRTcWwgPT4ge1xyXG4gICAgICAvL1BhcnNlIGZvcmVpZ24ga2V5IHNuaXBwZXRzXHJcbiAgICAgIGlmIChjb25zdHJhaW50U3FsLmluY2x1ZGVzKFwiUkVGRVJFTkNFU1wiKSkge1xyXG4gICAgICAgIC8vUGFyc2Ugb3V0IHRoZSBjb25zdHJhaW50IGNvbmRpdGlvbiBmb3JtIHNxbCBzdHJpbmdcclxuICAgICAgICB1cGRhdGVBY3Rpb24gPSBjb25zdHJhaW50U3FsLm1hdGNoKFxyXG4gICAgICAgICAgL09OIFVQREFURSAoQ0FTQ0FERXxTRVQgTlVMTHxSRVNUUklDVHxOTyBBQ1RJT058U0VUIERFRkFVTFQpezF9L1xyXG4gICAgICAgICk7XHJcbiAgICAgICAgZGVsZXRlQWN0aW9uID0gY29uc3RyYWludFNxbC5tYXRjaChcclxuICAgICAgICAgIC9PTiBERUxFVEUgKENBU0NBREV8U0VUIE5VTEx8UkVTVFJJQ1R8Tk8gQUNUSU9OfFNFVCBERUZBVUxUKXsxfS9cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAodXBkYXRlQWN0aW9uKSB7XHJcbiAgICAgICAgICB1cGRhdGVBY3Rpb24gPSB1cGRhdGVBY3Rpb25bMV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGVsZXRlQWN0aW9uKSB7XHJcbiAgICAgICAgICBkZWxldGVBY3Rpb24gPSBkZWxldGVBY3Rpb25bMV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZWZlcmVuY2VzUmVnZXggPSAvUkVGRVJFTkNFUy4rXFwoKD86W14pKF0rfFxcKCg/OlteKShdK3xcXChbXikoXSpcXCkpKlxcKSkqXFwpLztcclxuICAgICAgICBjb25zdCByZWZlcmVuY2VDb25kaXRpb25zID0gY29uc3RyYWludFNxbFxyXG4gICAgICAgICAgLm1hdGNoKHJlZmVyZW5jZXNSZWdleClbMF1cclxuICAgICAgICAgIC5zcGxpdChcIiBcIik7XHJcbiAgICAgICAgcmVmZXJlbmNlVGFibGVOYW1lID0gVXRpbHMucmVtb3ZlVGlja3MocmVmZXJlbmNlQ29uZGl0aW9uc1sxXSk7XHJcbiAgICAgICAgbGV0IGNvbHVtbk5hbWVzID0gcmVmZXJlbmNlQ29uZGl0aW9uc1syXTtcclxuICAgICAgICBjb2x1bW5OYW1lcyA9IGNvbHVtbk5hbWVzLnJlcGxhY2UoL1xcKHxcXCkvZywgXCJcIikuc3BsaXQoXCIsIFwiKTtcclxuICAgICAgICByZWZlcmVuY2VUYWJsZUtleXMgPSBjb2x1bW5OYW1lcy5tYXAoY29sdW1uID0+XHJcbiAgICAgICAgICBVdGlscy5yZW1vdmVUaWNrcyhjb2x1bW4pXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgY29uc3RyYWludENvbmRpdGlvbiA9IGNvbnN0cmFpbnRTcWwubWF0Y2goXHJcbiAgICAgICAgL1xcKCg/OlteKShdK3xcXCgoPzpbXikoXSt8XFwoW14pKF0qXFwpKSpcXCkpKlxcKS9cclxuICAgICAgKVswXTtcclxuICAgICAgY29uc3RyYWludFNxbCA9IGNvbnN0cmFpbnRTcWwucmVwbGFjZSgvXFwoLitcXCkvLCBcIlwiKTtcclxuICAgICAgY29uc3QgY29uc3RyYWludCA9IGNvbnN0cmFpbnRTcWwuc3BsaXQoXCIgXCIpO1xyXG5cclxuICAgICAgaWYgKGNvbnN0cmFpbnRbMV0gPT09IFwiUFJJTUFSWVwiIHx8IGNvbnN0cmFpbnRbMV0gPT09IFwiRk9SRUlHTlwiKSB7XHJcbiAgICAgICAgY29uc3RyYWludFsxXSArPSBcIiBLRVlcIjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBjb25zdHJhaW50TmFtZTogVXRpbHMucmVtb3ZlVGlja3MoY29uc3RyYWludFswXSksXHJcbiAgICAgICAgY29uc3RyYWludFR5cGU6IGNvbnN0cmFpbnRbMV0sXHJcbiAgICAgICAgdXBkYXRlQWN0aW9uLFxyXG4gICAgICAgIGRlbGV0ZUFjdGlvbixcclxuICAgICAgICBzcWw6IHNxbC5yZXBsYWNlKC9cIi9nLCBcImBcIiksIC8vU3FsaXRlIHJldHVybnMgZG91YmxlIHF1b3RlcyBmb3IgdGFibGUgbmFtZVxyXG4gICAgICAgIGNvbnN0cmFpbnRDb25kaXRpb24sXHJcbiAgICAgICAgcmVmZXJlbmNlVGFibGVOYW1lLFxyXG4gICAgICAgIHJlZmVyZW5jZVRhYmxlS2V5c1xyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGNvbnN0cmFpbnRzO1xyXG4gIH1cclxuXHJcbiAgYXBwbHlQYXJzZXJzKHR5cGUsIHZhbHVlKSB7XHJcbiAgICBpZiAodHlwZS5pbmNsdWRlcyhcIihcIikpIHtcclxuICAgICAgLy8gUmVtb3ZlIHRoZSBsZW5ndGggcGFydFxyXG4gICAgICB0eXBlID0gdHlwZS5zdWJzdHIoMCwgdHlwZS5pbmRleE9mKFwiKFwiKSk7XHJcbiAgICB9XHJcbiAgICB0eXBlID0gdHlwZS5yZXBsYWNlKFwiVU5TSUdORURcIiwgXCJcIikucmVwbGFjZShcIlpFUk9GSUxMXCIsIFwiXCIpO1xyXG4gICAgdHlwZSA9IHR5cGUudHJpbSgpLnRvVXBwZXJDYXNlKCk7XHJcbiAgICBjb25zdCBwYXJzZSA9IHBhcnNlclN0b3JlLmdldCh0eXBlKTtcclxuICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiBwYXJzZSkge1xyXG4gICAgICByZXR1cm4gcGFyc2UodmFsdWUsIHsgdGltZXpvbmU6IHRoaXMuc2VxdWVsaXplLm9wdGlvbnMudGltZXpvbmUgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbiAgfVxyXG5cclxuICBmb3JtYXRFcnJvcihlcnIpIHtcclxuICAgIHN3aXRjaCAoZXJyLmNvZGUpIHtcclxuICAgICAgY2FzZSBcIlNRTElURV9DT05TVFJBSU5UXCI6IHtcclxuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoXCJGT1JFSUdOIEtFWSBjb25zdHJhaW50IGZhaWxlZFwiKSkge1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBzZXF1ZWxpemVFcnJvcnMuRm9yZWlnbktleUNvbnN0cmFpbnRFcnJvcih7XHJcbiAgICAgICAgICAgIHBhcmVudDogZXJyXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBmaWVsZHMgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gU3FsaXRlIHByZSAyLjIgYmVoYXZpb3IgLSBFcnJvcjogU1FMSVRFX0NPTlNUUkFJTlQ6IGNvbHVtbnMgeCwgeSBhcmUgbm90IHVuaXF1ZVxyXG4gICAgICAgIGxldCBtYXRjaCA9IGVyci5tZXNzYWdlLm1hdGNoKC9jb2x1bW5zICguKj8pIGFyZS8pO1xyXG4gICAgICAgIGlmIChtYXRjaCAhPT0gbnVsbCAmJiBtYXRjaC5sZW5ndGggPj0gMikge1xyXG4gICAgICAgICAgZmllbGRzID0gbWF0Y2hbMV0uc3BsaXQoXCIsIFwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gU3FsaXRlIHBvc3QgMi4yIGJlaGF2aW9yIC0gRXJyb3I6IFNRTElURV9DT05TVFJBSU5UOiBVTklRVUUgY29uc3RyYWludCBmYWlsZWQ6IHRhYmxlLngsIHRhYmxlLnlcclxuICAgICAgICAgIG1hdGNoID0gZXJyLm1lc3NhZ2UubWF0Y2goL1VOSVFVRSBjb25zdHJhaW50IGZhaWxlZDogKC4qKS8pO1xyXG4gICAgICAgICAgaWYgKG1hdGNoICE9PSBudWxsICYmIG1hdGNoLmxlbmd0aCA+PSAyKSB7XHJcbiAgICAgICAgICAgIGZpZWxkcyA9IG1hdGNoWzFdXHJcbiAgICAgICAgICAgICAgLnNwbGl0KFwiLCBcIilcclxuICAgICAgICAgICAgICAubWFwKGNvbHVtbldpdGhUYWJsZSA9PiBjb2x1bW5XaXRoVGFibGUuc3BsaXQoXCIuXCIpWzFdKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGVycm9ycyA9IFtdO1xyXG4gICAgICAgIGxldCBtZXNzYWdlID0gXCJWYWxpZGF0aW9uIGVycm9yXCI7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgZmllbGQgb2YgZmllbGRzKSB7XHJcbiAgICAgICAgICBlcnJvcnMucHVzaChcclxuICAgICAgICAgICAgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3JJdGVtKFxyXG4gICAgICAgICAgICAgIHRoaXMuZ2V0VW5pcXVlQ29uc3RyYWludEVycm9yTWVzc2FnZShmaWVsZCksXHJcbiAgICAgICAgICAgICAgXCJ1bmlxdWUgdmlvbGF0aW9uXCIsIC8vIHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3JJdGVtLk9yaWdpbnMuREIsXHJcbiAgICAgICAgICAgICAgZmllbGQsXHJcbiAgICAgICAgICAgICAgdGhpcy5pbnN0YW5jZSAmJiB0aGlzLmluc3RhbmNlW2ZpZWxkXSxcclxuICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlLFxyXG4gICAgICAgICAgICAgIFwibm90X3VuaXF1ZVwiXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5tb2RlbCkge1xyXG4gICAgICAgICAgXy5mb3JPd24odGhpcy5tb2RlbC51bmlxdWVLZXlzLCBjb25zdHJhaW50ID0+IHtcclxuICAgICAgICAgICAgaWYgKF8uaXNFcXVhbChjb25zdHJhaW50LmZpZWxkcywgZmllbGRzKSAmJiAhIWNvbnN0cmFpbnQubXNnKSB7XHJcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IGNvbnN0cmFpbnQubXNnO1xyXG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IHNlcXVlbGl6ZUVycm9ycy5VbmlxdWVDb25zdHJhaW50RXJyb3Ioe1xyXG4gICAgICAgICAgbWVzc2FnZSxcclxuICAgICAgICAgIGVycm9ycyxcclxuICAgICAgICAgIHBhcmVudDogZXJyLFxyXG4gICAgICAgICAgZmllbGRzXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSBcIlNRTElURV9CVVNZXCI6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBzZXF1ZWxpemVFcnJvcnMuVGltZW91dEVycm9yKGVycik7XHJcblxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiBuZXcgc2VxdWVsaXplRXJyb3JzLkRhdGFiYXNlRXJyb3IoZXJyKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGhhbmRsZVNob3dJbmRleGVzUXVlcnkoZGF0YSkge1xyXG4gICAgLy8gU3FsaXRlIHJldHVybnMgaW5kZXhlcyBzbyB0aGUgb25lIHRoYXQgd2FzIGRlZmluZWQgbGFzdCBpcyByZXR1cm5lZCBmaXJzdC4gTGV0cyByZXZlcnNlIHRoYXQhXHJcbiAgICByZXR1cm4gUHJvbWlzZS5tYXAoZGF0YS5yZXZlcnNlKCksIGl0ZW0gPT4ge1xyXG4gICAgICBpdGVtLmZpZWxkcyA9IFtdO1xyXG4gICAgICBpdGVtLnByaW1hcnkgPSBmYWxzZTtcclxuICAgICAgaXRlbS51bmlxdWUgPSAhIWl0ZW0udW5pcXVlO1xyXG4gICAgICBpdGVtLmNvbnN0cmFpbnROYW1lID0gaXRlbS5uYW1lO1xyXG4gICAgICByZXR1cm4gdGhpcy5ydW4oYFBSQUdNQSBJTkRFWF9JTkZPKFxcYCR7aXRlbS5uYW1lfVxcYClgKS50aGVuKGNvbHVtbnMgPT4ge1xyXG4gICAgICAgIGZvciAoY29uc3QgY29sdW1uIG9mIGNvbHVtbnMpIHtcclxuICAgICAgICAgIGl0ZW0uZmllbGRzW2NvbHVtbi5zZXFub10gPSB7XHJcbiAgICAgICAgICAgIGF0dHJpYnV0ZTogY29sdW1uLm5hbWUsXHJcbiAgICAgICAgICAgIGxlbmd0aDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBvcmRlcjogdW5kZWZpbmVkXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhYmFzZU1ldGhvZCgpIHtcclxuICAgIGlmIChcclxuICAgICAgdGhpcy5zcWwuaW5jbHVkZXMoXCJQUkFHTUFcIikgfHxcclxuICAgICAgdGhpcy5zcWwuaW5jbHVkZXMoXCJDT01NSVRcIikgfHxcclxuICAgICAgdGhpcy5zcWwuaW5jbHVkZXMoXCJST0xMQkFDS1wiKSB8fFxyXG4gICAgICB0aGlzLnNxbC5pbmNsdWRlcyhcIlRSQU5TQUNUSU9OXCIpXHJcbiAgICApIHtcclxuICAgICAgcmV0dXJuIFwiZXhlY1wiOyAvLyBOZWVkZWQgdG8gcnVuIG5vLW9wIHRyYW5zYWN0aW9uXHJcbiAgICB9XHJcbiAgICBpZiAoXHJcbiAgICAgIHRoaXMuaXNJbnNlcnRRdWVyeSgpIHx8XHJcbiAgICAgIHRoaXMuaXNVcGRhdGVRdWVyeSgpIHx8XHJcbiAgICAgIHRoaXMuaXNCdWxrVXBkYXRlUXVlcnkoKSB8fFxyXG4gICAgICB0aGlzLnNxbC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiQ1JFQVRFIFRFTVBPUkFSWSBUQUJMRVwiLnRvTG93ZXJDYXNlKCkpIHx8XHJcbiAgICAgIHRoaXMub3B0aW9ucy50eXBlID09PSBRdWVyeVR5cGVzLkJVTEtERUxFVEVcclxuICAgICkge1xyXG4gICAgICByZXR1cm4gXCJydW5cIjtcclxuICAgIH1cclxuICAgIHJldHVybiBcImFsbFwiO1xyXG4gIH1cclxuICBjb252ZXJ0VG9BcnJheShyZXN1bHRzKSB7XHJcbiAgICBpZiAoIXJlc3VsdHMucm93cykgcmV0dXJuIFtdO1xyXG4gICAgaWYgKFwiYXJyYXlcIiBpbiByZXN1bHRzIHx8IFwiX2FycmF5XCIgaW4gcmVzdWx0cy5yb3dzKVxyXG4gICAgICByZXR1cm4gcmVzdWx0cy5hcnJheSB8fCByZXN1bHRzLnJvd3MuX2FycmF5O1xyXG4gICAgaWYgKCFyZXN1bHRzLnJvd3MuaXRlbSkgcmV0dXJuIHJlc3VsdHMucm93cztcclxuICAgIGNvbnN0IGRhdGEgPSBuZXcgQXJyYXkocmVzdWx0cy5yb3dzLmxlbmd0aCk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdHMucm93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBkYXRhW2ldID0gcmVzdWx0cy5yb3dzLml0ZW0oaSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUXVlcnk7XHJcbm1vZHVsZS5leHBvcnRzLlF1ZXJ5ID0gUXVlcnk7XHJcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBRdWVyeTtcclxuIl19