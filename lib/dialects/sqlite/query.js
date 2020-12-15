"use strict";

const _ = require("lodash");
const Utils = require("../../utils");
const Promise = require("../../promise");
const AbstractQuery = require("../abstract/query");
const QueryTypes = require("../../query-types");
const sequelizeErrors = require("../../errors");
const parserStore = require("../parserStore")("sqlite");
const { logger } = require("../../utils/logger");

const debug = logger.debugContext("sql:sqlite");
const getMethods = obj => {
  let properties = new Set();
  let currentObj = obj;
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
  } while ((currentObj = Object.getPrototypeOf(currentObj)));
  return [...properties.keys()].filter(item => typeof obj[item] === "function");
};
class Query extends AbstractQuery {
  getInsertIdField() {
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
  static formatBindParameters(sql, values, dialect) {
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

  _collectModels(include, prefix) {
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

  _handleQueryResponse(metaData, columnTypes, err, results) {
    if (err) {
      err.sql = this.sql;
      throw this.formatError(err);
    }
    let result = this.instance;
    // add the inserted row id to the instance
    if (this.isInsertQuery(results, metaData)) {
      this.handleInsertQuery(results, metaData);
      if (!this.instance) {
        // handle bulkCreate AI primary key
        if (
          /*  metaData.constructor.name === "Statement" && */
          this.model &&
          this.model.autoIncrementAttribute &&
          this.model.autoIncrementAttribute ===
            this.model.primaryKeyAttribute &&
          this.model.rawAttributes[this.model.primaryKeyAttribute]
        ) {
          const startId =
            metaData[this.getInsertIdField()] - metaData.changes + 1;

          result = [];
          for (let i = startId; i < startId + metaData.changes; i++) {
            result.push({
              [this.model.rawAttributes[this.model.primaryKeyAttribute]
                .field]: i
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
      }
      // This is a map of prefix strings to models, e.g. user.projects -> Project model
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

          const tableName = model
            .getTableName()
            .toString()
            .replace(/`/g, "");
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

          return Object.prototype.hasOwnProperty.call(tableTypes, name)
            ? this.applyParsers(tableTypes[name], value)
            : value;
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
            result[_result.name].defaultValue = { "0": false, "1": true }[
              result[_result.name].defaultValue
            ];
          }

          if (typeof result[_result.name].defaultValue === "string") {
            result[_result.name].defaultValue = result[
              _result.name
            ].defaultValue.replace(/'/g, "");
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
    if (
      [QueryTypes.BULKUPDATE, QueryTypes.BULKDELETE].includes(this.options.type)
    ) {
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
  }
  // websql : polyfill foreign key https://justatheory.com/2004/11/sqlite-foreign-key-triggers/
  run(sql, parameters) {
    // exec does not support bind parameter
    this.sql = AbstractQuery.formatBindParameters(
      sql,
      this.options.bind,
      this.options.dialect || "sqlite",
      { skipUnescape: false }
    )[0];
    const method = this.getDatabaseMethod();
    const complete = this._logQuery(this.sql, debug, parameters);
    const query = this;
    const self = this;
    const conn = this.connection;

    return new Promise(resolve => {
      const columnTypes = {};
      // eslint-disable-next-line
      const executeSql = () => {
        if (sql.startsWith("-- ")) {
          return resolve();
        }
        resolve(
          new Promise((resolve, reject) => {
            if (method === "exec") {
              if (typeof conn.exec === "function") {
                conn.exec(
                  [{ sql: self.sql, args: [] }],
                  false,
                  (executionError, results) => {
                    try {
                      complete();
                      // TODO: Check return PRAGMA INDEX_LIST and INDEX_INFO
                      results = query.convertToArray(results[0]);
                      // `this` is passed from sqlite, we have no control over this.
                      // eslint-disable-next-line no-invalid-this
                      resolve(
                        query._handleQueryResponse(
                          self,
                          columnTypes,
                          executionError,
                          results
                        )
                      );
                      return;
                    } catch (error) {
                      reject(error);
                    }
                  }
                );
              } else {
                resolve();
              }
            } else {
              var successCallback = function(results) {
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
              var errorCallback = function(err) {
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
              conn.executeSql(
                self.sql,
                parameters,
                successCallback,
                errorCallback
              );
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
          })
        );
        return null;
      };

      if (method === "all") {
        let tableNames = [];
        if (this.options && this.options.tableNames) {
          tableNames = this.options.tableNames;
        } else if (/FROM `(.*?)`/i.exec(this.sql)) {
          tableNames.push(/FROM `(.*?)`/i.exec(this.sql)[1]);
        }

        // If we already have the metadata for the table, there's no need to ask for it again
        tableNames = tableNames.filter(
          tableName =>
            !(tableName in columnTypes) && tableName !== "sqlite_master"
        );
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
            conn.exec(
              sqlCommands.map(sqlCmd => ({
                sql: sqlCmd[0],
                args: []
              })),
              false,
              (err, results) => {
                if (!err) {
                  for (let i = 0; i < sqlCommands.length; i++) {
                    const tableName = sqlCommands[i][1];
                    for (const result of results[i].rows) {
                      columnTypes[tableName][result.name] = result.type;
                    }
                  }
                }
                resolve();
              }
            );
          } else {
            tableNames.forEach((tableName, index) => {
              conn.executeSql(
                `SELECT sql FROM sqlite_master WHERE tbl_name='${tableName}' and type='table'`,
                [],
                function(result) {
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
                function(error) {
                  if (index === tableNames.length - 1) resolve();
                }
              );
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

  parseConstraintsFromSql(sql) {
    let constraints = sql.split("CONSTRAINT ");
    let referenceTableName, referenceTableKeys, updateAction, deleteAction;
    constraints.splice(0, 1);
    constraints = constraints.map(constraintSql => {
      //Parse foreign key snippets
      if (constraintSql.includes("REFERENCES")) {
        //Parse out the constraint condition form sql string
        updateAction = constraintSql.match(
          /ON UPDATE (CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT){1}/
        );
        deleteAction = constraintSql.match(
          /ON DELETE (CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT){1}/
        );

        if (updateAction) {
          updateAction = updateAction[1];
        }

        if (deleteAction) {
          deleteAction = deleteAction[1];
        }

        const referencesRegex = /REFERENCES.+\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/;
        const referenceConditions = constraintSql
          .match(referencesRegex)[0]
          .split(" ");
        referenceTableName = Utils.removeTicks(referenceConditions[1]);
        let columnNames = referenceConditions[2];
        columnNames = columnNames.replace(/\(|\)/g, "").split(", ");
        referenceTableKeys = columnNames.map(column =>
          Utils.removeTicks(column)
        );
      }

      const constraintCondition = constraintSql.match(
        /\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/
      )[0];
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
        sql: sql.replace(/"/g, "`"), //Sqlite returns double quotes for table name
        constraintCondition,
        referenceTableName,
        referenceTableKeys
      };
    });

    return constraints;
  }

  applyParsers(type, value) {
    if (type.includes("(")) {
      // Remove the length part
      type = type.substr(0, type.indexOf("("));
    }
    type = type.replace("UNSIGNED", "").replace("ZEROFILL", "");
    type = type.trim().toUpperCase();
    const parse = parserStore.get(type);
    if (value !== null && parse) {
      return parse(value, { timezone: this.sequelize.options.timezone });
    }
    return value;
  }

  formatError(err) {
    switch (err.code) {
      case "SQLITE_CONSTRAINT": {
        if (err.message.includes("FOREIGN KEY constraint failed")) {
          return new sequelizeErrors.ForeignKeyConstraintError({
            parent: err
          });
        }

        let fields = [];

        // Sqlite pre 2.2 behavior - Error: SQLITE_CONSTRAINT: columns x, y are not unique
        let match = err.message.match(/columns (.*?) are/);
        if (match !== null && match.length >= 2) {
          fields = match[1].split(", ");
        } else {
          // Sqlite post 2.2 behavior - Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: table.x, table.y
          match = err.message.match(/UNIQUE constraint failed: (.*)/);
          if (match !== null && match.length >= 2) {
            fields = match[1]
              .split(", ")
              .map(columnWithTable => columnWithTable.split(".")[1]);
          }
        }

        const errors = [];
        let message = "Validation error";

        for (const field of fields) {
          errors.push(
            new sequelizeErrors.ValidationErrorItem(
              this.getUniqueConstraintErrorMessage(field),
              "unique violation", // sequelizeErrors.ValidationErrorItem.Origins.DB,
              field,
              this.instance && this.instance[field],
              this.instance,
              "not_unique"
            )
          );
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

  handleShowIndexesQuery(data) {
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

  getDatabaseMethod() {
    if (
      this.sql.includes("PRAGMA") ||
      this.sql.includes("COMMIT") ||
      this.sql.includes("ROLLBACK") ||
      this.sql.includes("TRANSACTION")
    ) {
      return "exec"; // Needed to run no-op transaction
    }
    if (
      this.isInsertQuery() ||
      this.isUpdateQuery() ||
      this.isBulkUpdateQuery() ||
      this.sql.toLowerCase().includes("CREATE TEMPORARY TABLE".toLowerCase()) ||
      this.options.type === QueryTypes.BULKDELETE
    ) {
      return "run";
    }
    return "all";
  }
  convertToArray(results) {
    if (!results.rows) return [];
    if ("array" in results || "_array" in results.rows)
      return results.array || results.rows._array;
    if (!results.rows.item) return results.rows;
    const data = new Array(results.rows.length);
    for (let i = 0; i < results.rows.length; i++) {
      data[i] = results.rows.item(i);
    }
    return data;
  }
}

module.exports = Query;
module.exports.Query = Query;
module.exports.default = Query;
