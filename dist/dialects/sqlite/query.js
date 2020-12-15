"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

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

let Query = /*#__PURE__*/function (_AbstractQuery) {
  _inherits(Query, _AbstractQuery);

  var _super = _createSuper(Query);

  function Query() {
    _classCallCheck(this, Query);

    return _super.apply(this, arguments);
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
              var successCallback = function (results) {
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


              var errorCallback = function (err) {
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

              conn.executeSql(self.sql, parameters, successCallback, errorCallback);
              /*conn.transaction(function(t) {
                // cannot use arrow function here because the function is bound to the statement
                // eslint-disable-next-line
                var successCallback = function(_, results) {
                  try {
                    complete();
                    // `self` is passed from sqlite, we have no control over this.
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
                    resolve(
                      query._handleQueryResponse(
                        self,
                        columnTypes,
                        undefined,
                        results
                      )
                    );
                    return;
                  } catch (error) {
                    debug(error);
                    reject(error);
                  }
                };
                // eslint-disable-next-line
                var errorCallback = function(_, err) {
                  try {
                    complete();
                    // `self` is passed from sqlite, we have no control over this.
                    // eslint-disable-next-line no-invalid-this
                    resolve(query._handleQueryResponse(self, columnTypes, err));
                  } catch (error) {
                    reject(error);
                  }
                };
                if (typeof conn.exec === "function") {
                  parameters = parameters || [];
                } else parameters = [];
                t.executeSql(
                  self.sql,
                  parameters,
                  successCallback,
                  errorCallback
                );
              });*/
            }
          }));
          return null;
        };

        if (method === "all") {
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
              tableNames.forEach((tableName, index) => {
                conn.executeSql(`SELECT sql FROM sqlite_master WHERE tbl_name='${tableName}' and type='table'`, [], function (result) {
                  const table = result.rows.item(0);

                  if (typeof table === "object" && "sql" in table && typeof table.sql === "string") {
                    columnTypes[tableName] = {}; //match column name with data types

                    const columns = table.sql.match(/(`\w+`)((\s([A-Z]+)((\(\d+\)))?))/g); // split column names with data type

                    for (const col of columns) {
                      const [colName, colType] = col.trim().replace(/\s+/g, " ").replace(/`/g, "").split(" ");
                      columnTypes[tableName][colName] = colType.trim();
                    }
                  } //console.log(columnTypes)


                  if (index === tableNames.length - 1) resolve();
                }, function (error) {
                  if (index === tableNames.length - 1) resolve();
                });
              });
              /*conn.transaction(function(t) {
                tableNames.forEach((tableName, index) => {
                  t.executeSql(
                    `SELECT sql FROM sqlite_master WHERE tbl_name='${tableName}' and type='table'`,
                    [],
                    function(_, result) {
                      const table = result.rows.item(0);
                      if (
                        typeof table === "object" &&
                        "sql" in table &&
                        typeof table.sql === "string"
                      ) {
                        columnTypes[tableName] = {};
                        //match column name with data types
                        const columns = table.sql.match(
                          /(`\w+`)((\s([A-Z]+)((\(\d+\)))?))/g
                        );
                        // split column names with data type
                        for (const col of columns) {
                          const [colName, colType] = col
                            .trim()
                            .replace(/\s+/g, " ")
                            .replace(/`/g, "")
                            .split(" ");
                          columnTypes[tableName][colName] = colType.trim();
                        }
                      }
                      //console.log(columnTypes)
                      if (index === tableNames.length - 1) resolve();
                    },
                    function(_, error) {
                      if (index === tableNames.length - 1) resolve();
                    }
                  );
                });
              });*/
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvcXVlcnkuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJVdGlscyIsIlByb21pc2UiLCJBYnN0cmFjdFF1ZXJ5IiwiUXVlcnlUeXBlcyIsInNlcXVlbGl6ZUVycm9ycyIsInBhcnNlclN0b3JlIiwibG9nZ2VyIiwiZGVidWciLCJkZWJ1Z0NvbnRleHQiLCJnZXRNZXRob2RzIiwib2JqIiwicHJvcGVydGllcyIsIlNldCIsImN1cnJlbnRPYmoiLCJPYmplY3QiLCJnZXRPd25Qcm9wZXJ0eU5hbWVzIiwibWFwIiwiaXRlbSIsImFkZCIsImdldFByb3RvdHlwZU9mIiwia2V5cyIsImZpbHRlciIsIlF1ZXJ5IiwiaW5jbHVkZSIsInByZWZpeCIsInJldCIsIl9pbmNsdWRlIiwia2V5IiwiYXMiLCJtb2RlbCIsIm1lcmdlIiwiX2NvbGxlY3RNb2RlbHMiLCJtZXRhRGF0YSIsImNvbHVtblR5cGVzIiwiZXJyIiwicmVzdWx0cyIsInNxbCIsImZvcm1hdEVycm9yIiwicmVzdWx0IiwiaW5zdGFuY2UiLCJpc0luc2VydFF1ZXJ5IiwiaGFuZGxlSW5zZXJ0UXVlcnkiLCJhdXRvSW5jcmVtZW50QXR0cmlidXRlIiwicHJpbWFyeUtleUF0dHJpYnV0ZSIsInJhd0F0dHJpYnV0ZXMiLCJzdGFydElkIiwiZ2V0SW5zZXJ0SWRGaWVsZCIsImNoYW5nZXMiLCJpIiwicHVzaCIsImZpZWxkIiwiaXNTaG93VGFibGVzUXVlcnkiLCJyb3ciLCJuYW1lIiwiaXNTaG93Q29uc3RyYWludHNRdWVyeSIsInBhcnNlQ29uc3RyYWludHNGcm9tU3FsIiwiaXNTZWxlY3RRdWVyeSIsIm9wdGlvbnMiLCJyYXciLCJoYW5kbGVTZWxlY3RRdWVyeSIsInByZWZpeGVzIiwibWFwVmFsdWVzIiwidmFsdWUiLCJpbmNsdWRlcyIsImxhc3RpbmQiLCJsYXN0SW5kZXhPZiIsInN1YnN0ciIsInRhYmxlTmFtZSIsImdldFRhYmxlTmFtZSIsInRvU3RyaW5nIiwicmVwbGFjZSIsInRhYmxlVHlwZXMiLCJmb3JPd24iLCJhdHRyaWJ1dGUiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJhcHBseVBhcnNlcnMiLCJpc1Nob3dPckRlc2NyaWJlUXVlcnkiLCJoYW5kbGVTaG93SW5kZXhlc1F1ZXJ5IiwiQXJyYXkiLCJpc0FycmF5IiwiZGVmYXVsdFZhbHVlIiwiX3Jlc3VsdCIsImRmbHRfdmFsdWUiLCJ1bmRlZmluZWQiLCJ0eXBlIiwiYWxsb3dOdWxsIiwibm90bnVsbCIsInByaW1hcnlLZXkiLCJwayIsIkJVTEtVUERBVEUiLCJCVUxLREVMRVRFIiwiVVBTRVJUIiwiVkVSU0lPTiIsInZlcnNpb24iLCJSQVciLCJpc1VwZGF0ZVF1ZXJ5IiwicGFyYW1ldGVycyIsImZvcm1hdEJpbmRQYXJhbWV0ZXJzIiwiYmluZCIsImRpYWxlY3QiLCJza2lwVW5lc2NhcGUiLCJtZXRob2QiLCJnZXREYXRhYmFzZU1ldGhvZCIsImNvbXBsZXRlIiwiX2xvZ1F1ZXJ5IiwicXVlcnkiLCJzZWxmIiwiY29ubiIsImNvbm5lY3Rpb24iLCJyZXNvbHZlIiwiZXhlY3V0ZVNxbCIsInN0YXJ0c1dpdGgiLCJyZWplY3QiLCJleGVjIiwiYXJncyIsImV4ZWN1dGlvbkVycm9yIiwiY29udmVydFRvQXJyYXkiLCJfaGFuZGxlUXVlcnlSZXNwb25zZSIsImVycm9yIiwic3VjY2Vzc0NhbGxiYWNrIiwicm93c0FmZmVjdGVkIiwiaW5zZXJ0SWQiLCJlIiwiZXJyb3JDYWxsYmFjayIsInRhYmxlTmFtZXMiLCJsZW5ndGgiLCJzcWxDb21tYW5kcyIsInNxbENtZCIsInJvd3MiLCJmb3JFYWNoIiwiaW5kZXgiLCJ0YWJsZSIsImNvbHVtbnMiLCJtYXRjaCIsImNvbCIsImNvbE5hbWUiLCJjb2xUeXBlIiwidHJpbSIsInNwbGl0IiwidGhlbiIsImNvbnN0cmFpbnRzIiwicmVmZXJlbmNlVGFibGVOYW1lIiwicmVmZXJlbmNlVGFibGVLZXlzIiwidXBkYXRlQWN0aW9uIiwiZGVsZXRlQWN0aW9uIiwic3BsaWNlIiwiY29uc3RyYWludFNxbCIsInJlZmVyZW5jZXNSZWdleCIsInJlZmVyZW5jZUNvbmRpdGlvbnMiLCJyZW1vdmVUaWNrcyIsImNvbHVtbk5hbWVzIiwiY29sdW1uIiwiY29uc3RyYWludENvbmRpdGlvbiIsImNvbnN0cmFpbnQiLCJjb25zdHJhaW50TmFtZSIsImNvbnN0cmFpbnRUeXBlIiwiaW5kZXhPZiIsInRvVXBwZXJDYXNlIiwicGFyc2UiLCJnZXQiLCJ0aW1lem9uZSIsInNlcXVlbGl6ZSIsImNvZGUiLCJtZXNzYWdlIiwiRm9yZWlnbktleUNvbnN0cmFpbnRFcnJvciIsInBhcmVudCIsImZpZWxkcyIsImNvbHVtbldpdGhUYWJsZSIsImVycm9ycyIsIlZhbGlkYXRpb25FcnJvckl0ZW0iLCJnZXRVbmlxdWVDb25zdHJhaW50RXJyb3JNZXNzYWdlIiwidW5pcXVlS2V5cyIsImlzRXF1YWwiLCJtc2ciLCJVbmlxdWVDb25zdHJhaW50RXJyb3IiLCJUaW1lb3V0RXJyb3IiLCJEYXRhYmFzZUVycm9yIiwiZGF0YSIsInJldmVyc2UiLCJwcmltYXJ5IiwidW5pcXVlIiwicnVuIiwic2Vxbm8iLCJvcmRlciIsImlzQnVsa1VwZGF0ZVF1ZXJ5IiwidG9Mb3dlckNhc2UiLCJhcnJheSIsIl9hcnJheSIsInZhbHVlcyIsImJpbmRQYXJhbSIsInYiLCJza2lwVmFsdWVSZXBsYWNlIiwiayIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLENBQUMsR0FBR0MsT0FBTyxDQUFDLFFBQUQsQ0FBakI7O0FBQ0EsTUFBTUMsS0FBSyxHQUFHRCxPQUFPLENBQUMsYUFBRCxDQUFyQjs7QUFDQSxNQUFNRSxPQUFPLEdBQUdGLE9BQU8sQ0FBQyxlQUFELENBQXZCOztBQUNBLE1BQU1HLGFBQWEsR0FBR0gsT0FBTyxDQUFDLG1CQUFELENBQTdCOztBQUNBLE1BQU1JLFVBQVUsR0FB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RyxDQUFFLEVBQVAsQ0FBVCxHQUFxQkosTUFBTSxDQUFDSSxDQUFELENBQTNCO0FBQ0Q7QUFDRjs7QUFDRDlKLFFBQUFBLEdBQUcsR0FBR2xDLGFBQWEsQ0FBQ2lHLG9CQUFkLENBQW1DL0QsR0FBbkMsRUFBd0MwSixNQUF4QyxFQUFnRHpGLE9BQWhELEVBQXlEO0FBQzdENEYsVUFBQUEsZ0JBQWdCLEVBQUU7QUFEMkMsU0FBekQsRUFFSCxDQUZHLENBQU47QUFHRDs7QUFDRCxhQUFPLENBQUM3SixHQUFELEVBQU0ySixTQUFOLENBQVA7QUFDRDs7OztFQW5DaUI3TCxhOztBQXlyQnBCaU0sTUFBTSxDQUFDQyxPQUFQLEdBQWlCOUssS0FBakI7QUFDQTZLLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlOUssS0FBZixHQUF1QkEsS0FBdkI7QUFDQTZLLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxPQUFmLEdBQXlCL0ssS0FBekIiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi8uLi91dGlsc1wiKTtcbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKFwiLi4vLi4vcHJvbWlzZVwiKTtcbmNvbnN0IEFic3RyYWN0UXVlcnkgPSByZXF1aXJlKFwiLi4vYWJzdHJhY3QvcXVlcnlcIik7XG5jb25zdCBRdWVyeVR5cGVzID0gcmVxdWlyZShcIi4uLy4uL3F1ZXJ5LXR5cGVzXCIpO1xuY29uc3Qgc2VxdWVsaXplRXJyb3JzID0gcmVxdWlyZShcIi4uLy4uL2Vycm9yc1wiKTtcbmNvbnN0IHBhcnNlclN0b3JlID0gcmVxdWlyZShcIi4uL3BhcnNlclN0b3JlXCIpKFwic3FsaXRlXCIpO1xuY29uc3QgeyBsb2dnZXIgfSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9sb2dnZXJcIik7XG5cbmNvbnN0IGRlYnVnID0gbG9nZ2VyLmRlYnVnQ29udGV4dChcInNxbDpzcWxpdGVcIik7XG5jb25zdCBnZXRNZXRob2RzID0gb2JqID0+IHtcbiAgbGV0IHByb3BlcnRpZXMgPSBuZXcgU2V0KCk7XG4gIGxldCBjdXJyZW50T2JqID0gb2JqO1xuICBkbyB7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoY3VycmVudE9iaikubWFwKGl0ZW0gPT4gcHJvcGVydGllcy5hZGQoaXRlbSkpO1xuICB9IHdoaWxlICgoY3VycmVudE9iaiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihjdXJyZW50T2JqKSkpO1xuICByZXR1cm4gWy4uLnByb3BlcnRpZXMua2V5cygpXS5maWx0ZXIoaXRlbSA9PiB0eXBlb2Ygb2JqW2l0ZW1dID09PSBcImZ1bmN0aW9uXCIpO1xufTtcbmNsYXNzIFF1ZXJ5IGV4dGVuZHMgQWJzdHJhY3RRdWVyeSB7XG4gIGdldEluc2VydElkRmllbGQoKSB7XG4gICAgcmV0dXJuIFwibGFzdElEXCI7XG4gIH1cblxuICAvKipcbiAgICogcmV3cml0ZSBxdWVyeSB3aXRoIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcbiAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHZhbHVlc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gZGlhbGVjdFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgc3RhdGljIGZvcm1hdEJpbmRQYXJhbWV0ZXJzKHNxbCwgdmFsdWVzLCBkaWFsZWN0KSB7XG4gICAgbGV0IGJpbmRQYXJhbTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZXMpKSB7XG4gICAgICBiaW5kUGFyYW0gPSB7fTtcbiAgICAgIHZhbHVlcy5mb3JFYWNoKCh2LCBpKSA9PiB7XG4gICAgICAgIGJpbmRQYXJhbVtgJCR7aSArIDF9YF0gPSB2O1xuICAgICAgfSk7XG4gICAgICBzcWwgPSBBYnN0cmFjdFF1ZXJ5LmZvcm1hdEJpbmRQYXJhbWV0ZXJzKHNxbCwgdmFsdWVzLCBkaWFsZWN0LCB7XG4gICAgICAgIHNraXBWYWx1ZVJlcGxhY2U6IHRydWVcbiAgICAgIH0pWzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICBiaW5kUGFyYW0gPSB7fTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWVzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGZvciAoY29uc3QgayBvZiBPYmplY3Qua2V5cyh2YWx1ZXMpKSB7XG4gICAgICAgICAgYmluZFBhcmFtW2AkJHtrfWBdID0gdmFsdWVzW2tdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzcWwgPSBBYnN0cmFjdFF1ZXJ5LmZvcm1hdEJpbmRQYXJhbWV0ZXJzKHNxbCwgdmFsdWVzLCBkaWFsZWN0LCB7XG4gICAgICAgIHNraXBWYWx1ZVJlcGxhY2U6IHRydWVcbiAgICAgIH0pWzBdO1xuICAgIH1cbiAgICByZXR1cm4gW3NxbCwgYmluZFBhcmFtXTtcbiAgfVxuXG4gIF9jb2xsZWN0TW9kZWxzKGluY2x1ZGUsIHByZWZpeCkge1xuICAgIGNvbnN0IHJldCA9IHt9O1xuXG4gICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgIGZvciAoY29uc3QgX2luY2x1ZGUgb2YgaW5jbHVkZSkge1xuICAgICAgICBsZXQga2V5O1xuICAgICAgICBpZiAoIXByZWZpeCkge1xuICAgICAgICAgIGtleSA9IF9pbmNsdWRlLmFzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGtleSA9IGAke3ByZWZpeH0uJHtfaW5jbHVkZS5hc31gO1xuICAgICAgICB9XG4gICAgICAgIHJldFtrZXldID0gX2luY2x1ZGUubW9kZWw7XG5cbiAgICAgICAgaWYgKF9pbmNsdWRlLmluY2x1ZGUpIHtcbiAgICAgICAgICBfLm1lcmdlKHJldCwgdGhpcy5fY29sbGVjdE1vZGVscyhfaW5jbHVkZS5pbmNsdWRlLCBrZXkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBfaGFuZGxlUXVlcnlSZXNwb25zZShtZXRhRGF0YSwgY29sdW1uVHlwZXMsIGVyciwgcmVzdWx0cykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGVyci5zcWwgPSB0aGlzLnNxbDtcbiAgICAgIHRocm93IHRoaXMuZm9ybWF0RXJyb3IoZXJyKTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMuaW5zdGFuY2U7XG4gICAgLy8gYWRkIHRoZSBpbnNlcnRlZCByb3cgaWQgdG8gdGhlIGluc3RhbmNlXG4gICAgaWYgKHRoaXMuaXNJbnNlcnRRdWVyeShyZXN1bHRzLCBtZXRhRGF0YSkpIHtcbiAgICAgIHRoaXMuaGFuZGxlSW5zZXJ0UXVlcnkocmVzdWx0cywgbWV0YURhdGEpO1xuICAgICAgaWYgKCF0aGlzLmluc3RhbmNlKSB7XG4gICAgICAgIC8vIGhhbmRsZSBidWxrQ3JlYXRlIEFJIHByaW1hcnkga2V5XG4gICAgICAgIGlmIChcbiAgICAgICAgICAvKiAgbWV0YURhdGEuY29uc3RydWN0b3IubmFtZSA9PT0gXCJTdGF0ZW1lbnRcIiAmJiAqL1xuICAgICAgICAgIHRoaXMubW9kZWwgJiZcbiAgICAgICAgICB0aGlzLm1vZGVsLmF1dG9JbmNyZW1lbnRBdHRyaWJ1dGUgJiZcbiAgICAgICAgICB0aGlzLm1vZGVsLmF1dG9JbmNyZW1lbnRBdHRyaWJ1dGUgPT09XG4gICAgICAgICAgICB0aGlzLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGUgJiZcbiAgICAgICAgICB0aGlzLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5tb2RlbC5wcmltYXJ5S2V5QXR0cmlidXRlXVxuICAgICAgICApIHtcbiAgICAgICAgICBjb25zdCBzdGFydElkID1cbiAgICAgICAgICAgIG1ldGFEYXRhW3RoaXMuZ2V0SW5zZXJ0SWRGaWVsZCgpXSAtIG1ldGFEYXRhLmNoYW5nZXMgKyAxO1xuXG4gICAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0SWQ7IGkgPCBzdGFydElkICsgbWV0YURhdGEuY2hhbmdlczsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgIFt0aGlzLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5tb2RlbC5wcmltYXJ5S2V5QXR0cmlidXRlXVxuICAgICAgICAgICAgICAgIC5maWVsZF06IGlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgPSBtZXRhRGF0YVt0aGlzLmdldEluc2VydElkRmllbGQoKV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc1Nob3dUYWJsZXNRdWVyeSgpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0cy5tYXAocm93ID0+IHJvdy5uYW1lKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNTaG93Q29uc3RyYWludHNRdWVyeSgpKSB7XG4gICAgICByZXN1bHQgPSByZXN1bHRzO1xuICAgICAgaWYgKHJlc3VsdHMgJiYgcmVzdWx0c1swXSAmJiByZXN1bHRzWzBdLnNxbCkge1xuICAgICAgICByZXN1bHQgPSB0aGlzLnBhcnNlQ29uc3RyYWludHNGcm9tU3FsKHJlc3VsdHNbMF0uc3FsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGlmICh0aGlzLmlzU2VsZWN0UXVlcnkoKSkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYXcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2VsZWN0UXVlcnkocmVzdWx0cyk7XG4gICAgICB9XG4gICAgICAvLyBUaGlzIGlzIGEgbWFwIG9mIHByZWZpeCBzdHJpbmdzIHRvIG1vZGVscywgZS5nLiB1c2VyLnByb2plY3RzIC0+IFByb2plY3QgbW9kZWxcbiAgICAgIGNvbnN0IHByZWZpeGVzID0gdGhpcy5fY29sbGVjdE1vZGVscyh0aGlzLm9wdGlvbnMuaW5jbHVkZSk7XG5cbiAgICAgIHJlc3VsdHMgPSByZXN1bHRzLm1hcChyZXN1bHQgPT4ge1xuICAgICAgICByZXR1cm4gXy5tYXBWYWx1ZXMocmVzdWx0LCAodmFsdWUsIG5hbWUpID0+IHtcbiAgICAgICAgICBsZXQgbW9kZWw7XG4gICAgICAgICAgaWYgKG5hbWUuaW5jbHVkZXMoXCIuXCIpKSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0aW5kID0gbmFtZS5sYXN0SW5kZXhPZihcIi5cIik7XG5cbiAgICAgICAgICAgIG1vZGVsID0gcHJlZml4ZXNbbmFtZS5zdWJzdHIoMCwgbGFzdGluZCldO1xuXG4gICAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIobGFzdGluZCArIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2RlbCA9IHRoaXMub3B0aW9ucy5tb2RlbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB0YWJsZU5hbWUgPSBtb2RlbFxuICAgICAgICAgICAgLmdldFRhYmxlTmFtZSgpXG4gICAgICAgICAgICAudG9TdHJpbmcoKVxuICAgICAgICAgICAgLnJlcGxhY2UoL2AvZywgXCJcIik7XG4gICAgICAgICAgY29uc3QgdGFibGVUeXBlcyA9IGNvbHVtblR5cGVzW3RhYmxlTmFtZV0gfHwge307XG5cbiAgICAgICAgICBpZiAodGFibGVUeXBlcyAmJiAhKG5hbWUgaW4gdGFibGVUeXBlcykpIHtcbiAgICAgICAgICAgIC8vIFRoZSBjb2x1bW4gaXMgYWxpYXNlZFxuICAgICAgICAgICAgXy5mb3JPd24obW9kZWwucmF3QXR0cmlidXRlcywgKGF0dHJpYnV0ZSwga2V5KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChuYW1lID09PSBrZXkgJiYgYXR0cmlidXRlLmZpZWxkKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IGF0dHJpYnV0ZS5maWVsZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGFibGVUeXBlcywgbmFtZSlcbiAgICAgICAgICAgID8gdGhpcy5hcHBseVBhcnNlcnModGFibGVUeXBlc1tuYW1lXSwgdmFsdWUpXG4gICAgICAgICAgICA6IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdGhpcy5oYW5kbGVTZWxlY3RRdWVyeShyZXN1bHRzKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNTaG93T3JEZXNjcmliZVF1ZXJ5KCkpIHtcbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbiAgICBpZiAodGhpcy5zcWwuaW5jbHVkZXMoXCJQUkFHTUEgSU5ERVhfTElTVFwiKSkge1xuICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU2hvd0luZGV4ZXNRdWVyeShyZXN1bHRzKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3FsLmluY2x1ZGVzKFwiUFJBR01BIElOREVYX0lORk9cIikpIHtcbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbiAgICBpZiAodGhpcy5zcWwuaW5jbHVkZXMoXCJQUkFHTUEgVEFCTEVfSU5GT1wiKSkge1xuICAgICAgLy8gdGhpcyBpcyB0aGUgc3FsaXRlIHdheSBvZiBnZXR0aW5nIHRoZSBtZXRhZGF0YSBvZiBhIHRhYmxlXG4gICAgICByZXN1bHQgPSB7fTtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0cykpIHtcbiAgICAgICAgbGV0IGRlZmF1bHRWYWx1ZTtcbiAgICAgICAgZm9yIChjb25zdCBfcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgICBpZiAoX3Jlc3VsdC5kZmx0X3ZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBDb2x1bW4gc2NoZW1hIG9taXRzIGFueSBcIkRFRkFVTFQgLi4uXCJcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9IGVsc2UgaWYgKF9yZXN1bHQuZGZsdF92YWx1ZSA9PT0gXCJOVUxMXCIpIHtcbiAgICAgICAgICAgIC8vIENvbHVtbiBzY2hlbWEgaXMgYSBcIkRFRkFVTFQgTlVMTFwiXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBudWxsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBfcmVzdWx0LmRmbHRfdmFsdWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzdWx0W19yZXN1bHQubmFtZV0gPSB7XG4gICAgICAgICAgICB0eXBlOiBfcmVzdWx0LnR5cGUsXG4gICAgICAgICAgICBhbGxvd051bGw6IF9yZXN1bHQubm90bnVsbCA9PT0gMCxcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSxcbiAgICAgICAgICAgIHByaW1hcnlLZXk6IF9yZXN1bHQucGsgIT09IDBcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKHJlc3VsdFtfcmVzdWx0Lm5hbWVdLnR5cGUgPT09IFwiVElOWUlOVCgxKVwiKSB7XG4gICAgICAgICAgICByZXN1bHRbX3Jlc3VsdC5uYW1lXS5kZWZhdWx0VmFsdWUgPSB7IFwiMFwiOiBmYWxzZSwgXCIxXCI6IHRydWUgfVtcbiAgICAgICAgICAgICAgcmVzdWx0W19yZXN1bHQubmFtZV0uZGVmYXVsdFZhbHVlXG4gICAgICAgICAgICBdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0W19yZXN1bHQubmFtZV0uZGVmYXVsdFZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXN1bHRbX3Jlc3VsdC5uYW1lXS5kZWZhdWx0VmFsdWUgPSByZXN1bHRbXG4gICAgICAgICAgICAgIF9yZXN1bHQubmFtZVxuICAgICAgICAgICAgXS5kZWZhdWx0VmFsdWUucmVwbGFjZSgvJy9nLCBcIlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3FsLmluY2x1ZGVzKFwiUFJBR01BIGZvcmVpZ25fa2V5cztcIikpIHtcbiAgICAgIHJldHVybiByZXN1bHRzWzBdO1xuICAgIH1cbiAgICBpZiAodGhpcy5zcWwuaW5jbHVkZXMoXCJQUkFHTUEgZm9yZWlnbl9rZXlzXCIpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG4gICAgaWYgKHRoaXMuc3FsLmluY2x1ZGVzKFwiUFJBR01BIGZvcmVpZ25fa2V5X2xpc3RcIikpIHtcbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBbUXVlcnlUeXBlcy5CVUxLVVBEQVRFLCBRdWVyeVR5cGVzLkJVTEtERUxFVEVdLmluY2x1ZGVzKHRoaXMub3B0aW9ucy50eXBlKVxuICAgICkge1xuICAgICAgcmV0dXJuIG1ldGFEYXRhLmNoYW5nZXM7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5VUFNFUlQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5WRVJTSU9OKSB7XG4gICAgICByZXR1cm4gcmVzdWx0c1swXS52ZXJzaW9uO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuUkFXKSB7XG4gICAgICByZXR1cm4gW3Jlc3VsdHMsIG1ldGFEYXRhXTtcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNVcGRhdGVRdWVyeSgpIHx8IHRoaXMuaXNJbnNlcnRRdWVyeSgpKSB7XG4gICAgICByZXR1cm4gW3Jlc3VsdCwgbWV0YURhdGEuY2hhbmdlc107XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgLy8gd2Vic3FsIDogcG9seWZpbGwgZm9yZWlnbiBrZXkgaHR0cHM6Ly9qdXN0YXRoZW9yeS5jb20vMjAwNC8xMS9zcWxpdGUtZm9yZWlnbi1rZXktdHJpZ2dlcnMvXG4gIHJ1bihzcWwsIHBhcmFtZXRlcnMpIHtcbiAgICAvLyBleGVjIGRvZXMgbm90IHN1cHBvcnQgYmluZCBwYXJhbWV0ZXJcbiAgICB0aGlzLnNxbCA9IEFic3RyYWN0UXVlcnkuZm9ybWF0QmluZFBhcmFtZXRlcnMoXG4gICAgICBzcWwsXG4gICAgICB0aGlzLm9wdGlvbnMuYmluZCxcbiAgICAgIHRoaXMub3B0aW9ucy5kaWFsZWN0IHx8IFwic3FsaXRlXCIsXG4gICAgICB7IHNraXBVbmVzY2FwZTogZmFsc2UgfVxuICAgIClbMF07XG4gICAgY29uc3QgbWV0aG9kID0gdGhpcy5nZXREYXRhYmFzZU1ldGhvZCgpO1xuICAgIGNvbnN0IGNvbXBsZXRlID0gdGhpcy5fbG9nUXVlcnkodGhpcy5zcWwsIGRlYnVnLCBwYXJhbWV0ZXJzKTtcbiAgICBjb25zdCBxdWVyeSA9IHRoaXM7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgY29uc3QgY29ubiA9IHRoaXMuY29ubmVjdGlvbjtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGNvbnN0IGNvbHVtblR5cGVzID0ge307XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICAgIGNvbnN0IGV4ZWN1dGVTcWwgPSAoKSA9PiB7XG4gICAgICAgIGlmIChzcWwuc3RhcnRzV2l0aChcIi0tIFwiKSkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShcbiAgICAgICAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpZiAobWV0aG9kID09PSBcImV4ZWNcIikge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbm4uZXhlYyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgY29ubi5leGVjKFxuICAgICAgICAgICAgICAgICAgW3sgc3FsOiBzZWxmLnNxbCwgYXJnczogW10gfV0sXG4gICAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIChleGVjdXRpb25FcnJvciwgcmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogQ2hlY2sgcmV0dXJuIFBSQUdNQSBJTkRFWF9MSVNUIGFuZCBJTkRFWF9JTkZPXG4gICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmNvbnZlcnRUb0FycmF5KHJlc3VsdHNbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgIC8vIGB0aGlzYCBpcyBwYXNzZWQgZnJvbSBzcWxpdGUsIHdlIGhhdmUgbm8gY29udHJvbCBvdmVyIHRoaXMuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWludmFsaWQtdGhpc1xuICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeS5faGFuZGxlUXVlcnlSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uVHlwZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGlvbkVycm9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgc3VjY2Vzc0NhbGxiYWNrID0gZnVuY3Rpb24ocmVzdWx0cykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgLy8gYHNlbGZgIGlzIHBhc3NlZCBmcm9tIHNxbGl0ZSwgd2UgaGF2ZSBubyBjb250cm9sIG92ZXIgdGhpcy5cbiAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbnZhbGlkLXRoaXNcbiAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzLnJvd3NBZmZlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIHNlbGZbc2VsZi5nZXRJbnNlcnRJZEZpZWxkKCldID0gcmVzdWx0cy5pbnNlcnRJZDtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzZWxmW3NlbGYuZ2V0SW5zZXJ0SWRGaWVsZCgpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgc2VsZi5jaGFuZ2VzID0gcmVzdWx0cy5yb3dzQWZmZWN0ZWQ7XG4gICAgICAgICAgICAgICAgICByZXN1bHRzID0gcXVlcnkuY29udmVydFRvQXJyYXkocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgICAgICAgICBxdWVyeS5faGFuZGxlUXVlcnlSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgICBzZWxmLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbHVtblR5cGVzLFxuICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIGRlYnVnKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICAgICAgICAgICAgdmFyIGVycm9yQ2FsbGJhY2sgPSBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgIC8vIGBzZWxmYCBpcyBwYXNzZWQgZnJvbSBzcWxpdGUsIHdlIGhhdmUgbm8gY29udHJvbCBvdmVyIHRoaXMuXG4gICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8taW52YWxpZC10aGlzXG4gICAgICAgICAgICAgICAgICByZXNvbHZlKHF1ZXJ5Ll9oYW5kbGVRdWVyeVJlc3BvbnNlKHNlbGYsIGNvbHVtblR5cGVzLCBlcnIpKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgY29ubi5leGVjID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzID0gcGFyYW1ldGVycyB8fCBbXTtcbiAgICAgICAgICAgICAgfSBlbHNlIHBhcmFtZXRlcnMgPSBbXTtcbiAgICAgICAgICAgICAgY29ubi5leGVjdXRlU3FsKFxuICAgICAgICAgICAgICAgIHNlbGYuc3FsLFxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrLFxuICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2tcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgLypjb25uLnRyYW5zYWN0aW9uKGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgICAgICAgICAvLyBjYW5ub3QgdXNlIGFycm93IGZ1bmN0aW9uIGhlcmUgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgYm91bmQgdG8gdGhlIHN0YXRlbWVudFxuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICAgICAgICAgIHZhciBzdWNjZXNzQ2FsbGJhY2sgPSBmdW5jdGlvbihfLCByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBgc2VsZmAgaXMgcGFzc2VkIGZyb20gc3FsaXRlLCB3ZSBoYXZlIG5vIGNvbnRyb2wgb3ZlciB0aGlzLlxuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8taW52YWxpZC10aGlzXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzLnJvd3NBZmZlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmW3NlbGYuZ2V0SW5zZXJ0SWRGaWVsZCgpXSA9IHJlc3VsdHMuaW5zZXJ0SWQ7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNlbGZbc2VsZi5nZXRJbnNlcnRJZEZpZWxkKCldO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLmNoYW5nZXMgPSByZXN1bHRzLnJvd3NBZmZlY3RlZDtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmNvbnZlcnRUb0FycmF5KHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5Ll9oYW5kbGVRdWVyeVJlc3BvbnNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtblR5cGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgICAgICAgICAgdmFyIGVycm9yQ2FsbGJhY2sgPSBmdW5jdGlvbihfLCBlcnIpIHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGBzZWxmYCBpcyBwYXNzZWQgZnJvbSBzcWxpdGUsIHdlIGhhdmUgbm8gY29udHJvbCBvdmVyIHRoaXMuXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbnZhbGlkLXRoaXNcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShxdWVyeS5faGFuZGxlUXVlcnlSZXNwb25zZShzZWxmLCBjb2x1bW5UeXBlcywgZXJyKSk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25uLmV4ZWMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgcGFyYW1ldGVycyA9IHBhcmFtZXRlcnMgfHwgW107XG4gICAgICAgICAgICAgICAgfSBlbHNlIHBhcmFtZXRlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICB0LmV4ZWN1dGVTcWwoXG4gICAgICAgICAgICAgICAgICBzZWxmLnNxbCxcbiAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSk7Ki9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH07XG5cbiAgICAgIGlmIChtZXRob2QgPT09IFwiYWxsXCIpIHtcbiAgICAgICAgbGV0IHRhYmxlTmFtZXMgPSBbXTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMudGFibGVOYW1lcykge1xuICAgICAgICAgIHRhYmxlTmFtZXMgPSB0aGlzLm9wdGlvbnMudGFibGVOYW1lcztcbiAgICAgICAgfSBlbHNlIGlmICgvRlJPTSBgKC4qPylgL2kuZXhlYyh0aGlzLnNxbCkpIHtcbiAgICAgICAgICB0YWJsZU5hbWVzLnB1c2goL0ZST00gYCguKj8pYC9pLmV4ZWModGhpcy5zcWwpWzFdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGFscmVhZHkgaGF2ZSB0aGUgbWV0YWRhdGEgZm9yIHRoZSB0YWJsZSwgdGhlcmUncyBubyBuZWVkIHRvIGFzayBmb3IgaXQgYWdhaW5cbiAgICAgICAgdGFibGVOYW1lcyA9IHRhYmxlTmFtZXMuZmlsdGVyKFxuICAgICAgICAgIHRhYmxlTmFtZSA9PlxuICAgICAgICAgICAgISh0YWJsZU5hbWUgaW4gY29sdW1uVHlwZXMpICYmIHRhYmxlTmFtZSAhPT0gXCJzcWxpdGVfbWFzdGVyXCJcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCF0YWJsZU5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBleGVjdXRlU3FsKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY29ubi5leGVjID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHNxbENvbW1hbmRzID0gdGFibGVOYW1lcy5tYXAodGFibGVOYW1lID0+IHtcbiAgICAgICAgICAgICAgdGFibGVOYW1lID0gdGFibGVOYW1lLnJlcGxhY2UoL2AvZywgXCJcIik7XG4gICAgICAgICAgICAgIGNvbHVtblR5cGVzW3RhYmxlTmFtZV0gPSB7fTtcbiAgICAgICAgICAgICAgcmV0dXJuIFtgUFJBR01BIHRhYmxlX2luZm8oXFxgJHt0YWJsZU5hbWV9XFxgKWAsIHRhYmxlTmFtZV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbm4uZXhlYyhcbiAgICAgICAgICAgICAgc3FsQ29tbWFuZHMubWFwKHNxbENtZCA9PiAoe1xuICAgICAgICAgICAgICAgIHNxbDogc3FsQ21kWzBdLFxuICAgICAgICAgICAgICAgIGFyZ3M6IFtdXG4gICAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgIChlcnIsIHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcWxDb21tYW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWJsZU5hbWUgPSBzcWxDb21tYW5kc1tpXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0c1tpXS5yb3dzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29sdW1uVHlwZXNbdGFibGVOYW1lXVtyZXN1bHQubmFtZV0gPSByZXN1bHQudHlwZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhYmxlTmFtZXMuZm9yRWFjaCgodGFibGVOYW1lLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICBjb25uLmV4ZWN1dGVTcWwoXG4gICAgICAgICAgICAgICAgYFNFTEVDVCBzcWwgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHRibF9uYW1lPScke3RhYmxlTmFtZX0nIGFuZCB0eXBlPSd0YWJsZSdgLFxuICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgdGFibGUgPSByZXN1bHQucm93cy5pdGVtKDApO1xuICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdGFibGUgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgICAgICAgICAgICAgXCJzcWxcIiBpbiB0YWJsZSAmJlxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdGFibGUuc3FsID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY29sdW1uVHlwZXNbdGFibGVOYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAvL21hdGNoIGNvbHVtbiBuYW1lIHdpdGggZGF0YSB0eXBlc1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW5zID0gdGFibGUuc3FsLm1hdGNoKFxuICAgICAgICAgICAgICAgICAgICAgIC8oYFxcdytgKSgoXFxzKFtBLVpdKykoKFxcKFxcZCtcXCkpKT8pKS9nXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNwbGl0IGNvbHVtbiBuYW1lcyB3aXRoIGRhdGEgdHlwZVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbCBvZiBjb2x1bW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgW2NvbE5hbWUsIGNvbFR5cGVdID0gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9gL2csIFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgIGNvbHVtblR5cGVzW3RhYmxlTmFtZV1bY29sTmFtZV0gPSBjb2xUeXBlLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhjb2x1bW5UeXBlcylcbiAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gdGFibGVOYW1lcy5sZW5ndGggLSAxKSByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSB0YWJsZU5hbWVzLmxlbmd0aCAtIDEpIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8qY29ubi50cmFuc2FjdGlvbihmdW5jdGlvbih0KSB7XG4gICAgICAgICAgICAgIHRhYmxlTmFtZXMuZm9yRWFjaCgodGFibGVOYW1lLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIHQuZXhlY3V0ZVNxbChcbiAgICAgICAgICAgICAgICAgIGBTRUxFQ1Qgc3FsIEZST00gc3FsaXRlX21hc3RlciBXSEVSRSB0YmxfbmFtZT0nJHt0YWJsZU5hbWV9JyBhbmQgdHlwZT0ndGFibGUnYCxcbiAgICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oXywgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhYmxlID0gcmVzdWx0LnJvd3MuaXRlbSgwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0YWJsZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICAgICAgICAgICAgICAgIFwic3FsXCIgaW4gdGFibGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdGFibGUuc3FsID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbHVtblR5cGVzW3RhYmxlTmFtZV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAvL21hdGNoIGNvbHVtbiBuYW1lIHdpdGggZGF0YSB0eXBlc1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbnMgPSB0YWJsZS5zcWwubWF0Y2goXG4gICAgICAgICAgICAgICAgICAgICAgICAvKGBcXHcrYCkoKFxccyhbQS1aXSspKChcXChcXGQrXFwpKSk/KSkvZ1xuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gc3BsaXQgY29sdW1uIG5hbWVzIHdpdGggZGF0YSB0eXBlXG4gICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb2wgb2YgY29sdW1ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgW2NvbE5hbWUsIGNvbFR5cGVdID0gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9gL2csIFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5zcGxpdChcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW5UeXBlc1t0YWJsZU5hbWVdW2NvbE5hbWVdID0gY29sVHlwZS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coY29sdW1uVHlwZXMpXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gdGFibGVOYW1lcy5sZW5ndGggLSAxKSByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oXywgZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSB0YWJsZU5hbWVzLmxlbmd0aCAtIDEpIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pOyovXG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGV4ZWN1dGVTcWwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGV4ZWN1dGVTcWwoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHBhcnNlQ29uc3RyYWludHNGcm9tU3FsKHNxbCkge1xuICAgIGxldCBjb25zdHJhaW50cyA9IHNxbC5zcGxpdChcIkNPTlNUUkFJTlQgXCIpO1xuICAgIGxldCByZWZlcmVuY2VUYWJsZU5hbWUsIHJlZmVyZW5jZVRhYmxlS2V5cywgdXBkYXRlQWN0aW9uLCBkZWxldGVBY3Rpb247XG4gICAgY29uc3RyYWludHMuc3BsaWNlKDAsIDEpO1xuICAgIGNvbnN0cmFpbnRzID0gY29uc3RyYWludHMubWFwKGNvbnN0cmFpbnRTcWwgPT4ge1xuICAgICAgLy9QYXJzZSBmb3JlaWduIGtleSBzbmlwcGV0c1xuICAgICAgaWYgKGNvbnN0cmFpbnRTcWwuaW5jbHVkZXMoXCJSRUZFUkVOQ0VTXCIpKSB7XG4gICAgICAgIC8vUGFyc2Ugb3V0IHRoZSBjb25zdHJhaW50IGNvbmRpdGlvbiBmb3JtIHNxbCBzdHJpbmdcbiAgICAgICAgdXBkYXRlQWN0aW9uID0gY29uc3RyYWludFNxbC5tYXRjaChcbiAgICAgICAgICAvT04gVVBEQVRFIChDQVNDQURFfFNFVCBOVUxMfFJFU1RSSUNUfE5PIEFDVElPTnxTRVQgREVGQVVMVCl7MX0vXG4gICAgICAgICk7XG4gICAgICAgIGRlbGV0ZUFjdGlvbiA9IGNvbnN0cmFpbnRTcWwubWF0Y2goXG4gICAgICAgICAgL09OIERFTEVURSAoQ0FTQ0FERXxTRVQgTlVMTHxSRVNUUklDVHxOTyBBQ1RJT058U0VUIERFRkFVTFQpezF9L1xuICAgICAgICApO1xuXG4gICAgICAgIGlmICh1cGRhdGVBY3Rpb24pIHtcbiAgICAgICAgICB1cGRhdGVBY3Rpb24gPSB1cGRhdGVBY3Rpb25bMV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVsZXRlQWN0aW9uKSB7XG4gICAgICAgICAgZGVsZXRlQWN0aW9uID0gZGVsZXRlQWN0aW9uWzFdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVmZXJlbmNlc1JlZ2V4ID0gL1JFRkVSRU5DRVMuK1xcKCg/OlteKShdK3xcXCgoPzpbXikoXSt8XFwoW14pKF0qXFwpKSpcXCkpKlxcKS87XG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZUNvbmRpdGlvbnMgPSBjb25zdHJhaW50U3FsXG4gICAgICAgICAgLm1hdGNoKHJlZmVyZW5jZXNSZWdleClbMF1cbiAgICAgICAgICAuc3BsaXQoXCIgXCIpO1xuICAgICAgICByZWZlcmVuY2VUYWJsZU5hbWUgPSBVdGlscy5yZW1vdmVUaWNrcyhyZWZlcmVuY2VDb25kaXRpb25zWzFdKTtcbiAgICAgICAgbGV0IGNvbHVtbk5hbWVzID0gcmVmZXJlbmNlQ29uZGl0aW9uc1syXTtcbiAgICAgICAgY29sdW1uTmFtZXMgPSBjb2x1bW5OYW1lcy5yZXBsYWNlKC9cXCh8XFwpL2csIFwiXCIpLnNwbGl0KFwiLCBcIik7XG4gICAgICAgIHJlZmVyZW5jZVRhYmxlS2V5cyA9IGNvbHVtbk5hbWVzLm1hcChjb2x1bW4gPT5cbiAgICAgICAgICBVdGlscy5yZW1vdmVUaWNrcyhjb2x1bW4pXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnN0cmFpbnRDb25kaXRpb24gPSBjb25zdHJhaW50U3FsLm1hdGNoKFxuICAgICAgICAvXFwoKD86W14pKF0rfFxcKCg/OlteKShdK3xcXChbXikoXSpcXCkpKlxcKSkqXFwpL1xuICAgICAgKVswXTtcbiAgICAgIGNvbnN0cmFpbnRTcWwgPSBjb25zdHJhaW50U3FsLnJlcGxhY2UoL1xcKC4rXFwpLywgXCJcIik7XG4gICAgICBjb25zdCBjb25zdHJhaW50ID0gY29uc3RyYWludFNxbC5zcGxpdChcIiBcIik7XG5cbiAgICAgIGlmIChjb25zdHJhaW50WzFdID09PSBcIlBSSU1BUllcIiB8fCBjb25zdHJhaW50WzFdID09PSBcIkZPUkVJR05cIikge1xuICAgICAgICBjb25zdHJhaW50WzFdICs9IFwiIEtFWVwiO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25zdHJhaW50TmFtZTogVXRpbHMucmVtb3ZlVGlja3MoY29uc3RyYWludFswXSksXG4gICAgICAgIGNvbnN0cmFpbnRUeXBlOiBjb25zdHJhaW50WzFdLFxuICAgICAgICB1cGRhdGVBY3Rpb24sXG4gICAgICAgIGRlbGV0ZUFjdGlvbixcbiAgICAgICAgc3FsOiBzcWwucmVwbGFjZSgvXCIvZywgXCJgXCIpLCAvL1NxbGl0ZSByZXR1cm5zIGRvdWJsZSBxdW90ZXMgZm9yIHRhYmxlIG5hbWVcbiAgICAgICAgY29uc3RyYWludENvbmRpdGlvbixcbiAgICAgICAgcmVmZXJlbmNlVGFibGVOYW1lLFxuICAgICAgICByZWZlcmVuY2VUYWJsZUtleXNcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY29uc3RyYWludHM7XG4gIH1cblxuICBhcHBseVBhcnNlcnModHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZS5pbmNsdWRlcyhcIihcIikpIHtcbiAgICAgIC8vIFJlbW92ZSB0aGUgbGVuZ3RoIHBhcnRcbiAgICAgIHR5cGUgPSB0eXBlLnN1YnN0cigwLCB0eXBlLmluZGV4T2YoXCIoXCIpKTtcbiAgICB9XG4gICAgdHlwZSA9IHR5cGUucmVwbGFjZShcIlVOU0lHTkVEXCIsIFwiXCIpLnJlcGxhY2UoXCJaRVJPRklMTFwiLCBcIlwiKTtcbiAgICB0eXBlID0gdHlwZS50cmltKCkudG9VcHBlckNhc2UoKTtcbiAgICBjb25zdCBwYXJzZSA9IHBhcnNlclN0b3JlLmdldCh0eXBlKTtcbiAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgcGFyc2UpIHtcbiAgICAgIHJldHVybiBwYXJzZSh2YWx1ZSwgeyB0aW1lem9uZTogdGhpcy5zZXF1ZWxpemUub3B0aW9ucy50aW1lem9uZSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgZm9ybWF0RXJyb3IoZXJyKSB7XG4gICAgc3dpdGNoIChlcnIuY29kZSkge1xuICAgICAgY2FzZSBcIlNRTElURV9DT05TVFJBSU5UXCI6IHtcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluY2x1ZGVzKFwiRk9SRUlHTiBLRVkgY29uc3RyYWludCBmYWlsZWRcIikpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IHNlcXVlbGl6ZUVycm9ycy5Gb3JlaWduS2V5Q29uc3RyYWludEVycm9yKHtcbiAgICAgICAgICAgIHBhcmVudDogZXJyXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZmllbGRzID0gW107XG5cbiAgICAgICAgLy8gU3FsaXRlIHByZSAyLjIgYmVoYXZpb3IgLSBFcnJvcjogU1FMSVRFX0NPTlNUUkFJTlQ6IGNvbHVtbnMgeCwgeSBhcmUgbm90IHVuaXF1ZVxuICAgICAgICBsZXQgbWF0Y2ggPSBlcnIubWVzc2FnZS5tYXRjaCgvY29sdW1ucyAoLio/KSBhcmUvKTtcbiAgICAgICAgaWYgKG1hdGNoICE9PSBudWxsICYmIG1hdGNoLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgZmllbGRzID0gbWF0Y2hbMV0uc3BsaXQoXCIsIFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTcWxpdGUgcG9zdCAyLjIgYmVoYXZpb3IgLSBFcnJvcjogU1FMSVRFX0NPTlNUUkFJTlQ6IFVOSVFVRSBjb25zdHJhaW50IGZhaWxlZDogdGFibGUueCwgdGFibGUueVxuICAgICAgICAgIG1hdGNoID0gZXJyLm1lc3NhZ2UubWF0Y2goL1VOSVFVRSBjb25zdHJhaW50IGZhaWxlZDogKC4qKS8pO1xuICAgICAgICAgIGlmIChtYXRjaCAhPT0gbnVsbCAmJiBtYXRjaC5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgZmllbGRzID0gbWF0Y2hbMV1cbiAgICAgICAgICAgICAgLnNwbGl0KFwiLCBcIilcbiAgICAgICAgICAgICAgLm1hcChjb2x1bW5XaXRoVGFibGUgPT4gY29sdW1uV2l0aFRhYmxlLnNwbGl0KFwiLlwiKVsxXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG4gICAgICAgIGxldCBtZXNzYWdlID0gXCJWYWxpZGF0aW9uIGVycm9yXCI7XG5cbiAgICAgICAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICAgIG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9ySXRlbShcbiAgICAgICAgICAgICAgdGhpcy5nZXRVbmlxdWVDb25zdHJhaW50RXJyb3JNZXNzYWdlKGZpZWxkKSxcbiAgICAgICAgICAgICAgXCJ1bmlxdWUgdmlvbGF0aW9uXCIsIC8vIHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3JJdGVtLk9yaWdpbnMuREIsXG4gICAgICAgICAgICAgIGZpZWxkLFxuICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlICYmIHRoaXMuaW5zdGFuY2VbZmllbGRdLFxuICAgICAgICAgICAgICB0aGlzLmluc3RhbmNlLFxuICAgICAgICAgICAgICBcIm5vdF91bmlxdWVcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5tb2RlbCkge1xuICAgICAgICAgIF8uZm9yT3duKHRoaXMubW9kZWwudW5pcXVlS2V5cywgY29uc3RyYWludCA9PiB7XG4gICAgICAgICAgICBpZiAoXy5pc0VxdWFsKGNvbnN0cmFpbnQuZmllbGRzLCBmaWVsZHMpICYmICEhY29uc3RyYWludC5tc2cpIHtcbiAgICAgICAgICAgICAgbWVzc2FnZSA9IGNvbnN0cmFpbnQubXNnO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IHNlcXVlbGl6ZUVycm9ycy5VbmlxdWVDb25zdHJhaW50RXJyb3Ioe1xuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgIHBhcmVudDogZXJyLFxuICAgICAgICAgIGZpZWxkc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJTUUxJVEVfQlVTWVwiOlxuICAgICAgICByZXR1cm4gbmV3IHNlcXVlbGl6ZUVycm9ycy5UaW1lb3V0RXJyb3IoZXJyKTtcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG5ldyBzZXF1ZWxpemVFcnJvcnMuRGF0YWJhc2VFcnJvcihlcnIpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZVNob3dJbmRleGVzUXVlcnkoZGF0YSkge1xuICAgIC8vIFNxbGl0ZSByZXR1cm5zIGluZGV4ZXMgc28gdGhlIG9uZSB0aGF0IHdhcyBkZWZpbmVkIGxhc3QgaXMgcmV0dXJuZWQgZmlyc3QuIExldHMgcmV2ZXJzZSB0aGF0IVxuICAgIHJldHVybiBQcm9taXNlLm1hcChkYXRhLnJldmVyc2UoKSwgaXRlbSA9PiB7XG4gICAgICBpdGVtLmZpZWxkcyA9IFtdO1xuICAgICAgaXRlbS5wcmltYXJ5ID0gZmFsc2U7XG4gICAgICBpdGVtLnVuaXF1ZSA9ICEhaXRlbS51bmlxdWU7XG4gICAgICBpdGVtLmNvbnN0cmFpbnROYW1lID0gaXRlbS5uYW1lO1xuICAgICAgcmV0dXJuIHRoaXMucnVuKGBQUkFHTUEgSU5ERVhfSU5GTyhcXGAke2l0ZW0ubmFtZX1cXGApYCkudGhlbihjb2x1bW5zID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBjb2x1bW4gb2YgY29sdW1ucykge1xuICAgICAgICAgIGl0ZW0uZmllbGRzW2NvbHVtbi5zZXFub10gPSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGU6IGNvbHVtbi5uYW1lLFxuICAgICAgICAgICAgbGVuZ3RoOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBvcmRlcjogdW5kZWZpbmVkXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBnZXREYXRhYmFzZU1ldGhvZCgpIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnNxbC5pbmNsdWRlcyhcIlBSQUdNQVwiKSB8fFxuICAgICAgdGhpcy5zcWwuaW5jbHVkZXMoXCJDT01NSVRcIikgfHxcbiAgICAgIHRoaXMuc3FsLmluY2x1ZGVzKFwiUk9MTEJBQ0tcIikgfHxcbiAgICAgIHRoaXMuc3FsLmluY2x1ZGVzKFwiVFJBTlNBQ1RJT05cIilcbiAgICApIHtcbiAgICAgIHJldHVybiBcImV4ZWNcIjsgLy8gTmVlZGVkIHRvIHJ1biBuby1vcCB0cmFuc2FjdGlvblxuICAgIH1cbiAgICBpZiAoXG4gICAgICB0aGlzLmlzSW5zZXJ0UXVlcnkoKSB8fFxuICAgICAgdGhpcy5pc1VwZGF0ZVF1ZXJ5KCkgfHxcbiAgICAgIHRoaXMuaXNCdWxrVXBkYXRlUXVlcnkoKSB8fFxuICAgICAgdGhpcy5zcWwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcIkNSRUFURSBURU1QT1JBUlkgVEFCTEVcIi50b0xvd2VyQ2FzZSgpKSB8fFxuICAgICAgdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuQlVMS0RFTEVURVxuICAgICkge1xuICAgICAgcmV0dXJuIFwicnVuXCI7XG4gICAgfVxuICAgIHJldHVybiBcImFsbFwiO1xuICB9XG4gIGNvbnZlcnRUb0FycmF5KHJlc3VsdHMpIHtcbiAgICBpZiAoIXJlc3VsdHMucm93cykgcmV0dXJuIFtdO1xuICAgIGlmIChcImFycmF5XCIgaW4gcmVzdWx0cyB8fCBcIl9hcnJheVwiIGluIHJlc3VsdHMucm93cylcbiAgICAgIHJldHVybiByZXN1bHRzLmFycmF5IHx8IHJlc3VsdHMucm93cy5fYXJyYXk7XG4gICAgaWYgKCFyZXN1bHRzLnJvd3MuaXRlbSkgcmV0dXJuIHJlc3VsdHMucm93cztcbiAgICBjb25zdCBkYXRhID0gbmV3IEFycmF5KHJlc3VsdHMucm93cy5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0cy5yb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkYXRhW2ldID0gcmVzdWx0cy5yb3dzLml0ZW0oaSk7XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlcnk7XG5tb2R1bGUuZXhwb3J0cy5RdWVyeSA9IFF1ZXJ5O1xubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IFF1ZXJ5O1xuIl19