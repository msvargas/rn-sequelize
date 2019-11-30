"use strict";

const AbstractConnectionManager = require("../abstract/connection-manager");
const Promise = require("../../promise");
const { logger } = require("../../utils/logger");
const debug = logger.debugContext("connection:sqlite");
const dataTypes = require("../../data-types").sqlite;
const sequelizeErrors = require("../../errors");
const parserStore = require("../parserStore")("sqlite");

class ConnectionManager extends AbstractConnectionManager {
  constructor(dialect, sequelize) {
    super(dialect, sequelize);

    // We attempt to parse file location from a connection uri
    // but we shouldn't match sequelize default host.
    if (this.sequelize.options.host === "localhost") {
      delete this.sequelize.options.host;
    }
    const dialectOptions = Object.assign(
      {
        version: "1.0"
      },
      this.sequelize.options.dialectOptions
    );
    this.connections = {};
    this.lib = this._loadDialectModule().openDatabase(
      this.sequelize.options.database,
      dialectOptions.version,
      dialectOptions.description,
      dialectOptions.size
    );

    /*  this.lib = {
      run: function(sql, parameters, errorCallback, successCallback) {
        db.transaction(function(t) {
          t.executeSql(
            sql,
            parameters || [],
            function(_, error) {
              errorCallback && errorCallback(error);
            },
            function(_, results) {
              successCallback && successCallback(results);
            }
          );
        });
      },
      exec: function() {
        console.log("exec:", arguments);
      },
      all: function() {
        console.log("all:", arguments);
      },
      close: function() {
        console.log("close", arguments);
      },
      serialize: function(cb) {
        console.log("serialize", arguments);
        cb && cb();
      }
    }; */
    this.refreshTypeParser(dataTypes);
  }

  _onProcessExit() {
    const promises = Object.getOwnPropertyNames(
      this.connections
    ).map(connection =>
      Promise.fromCallback(callback =>
        this.connections[connection].close(callback)
      )
    );

    return Promise.all(promises).then(() => super._onProcessExit.call(this));
  }

  // Expose this as a method so that the parsing may be updated when the user has added additional, custom types
  _refreshTypeParser(dataType) {
    parserStore.refresh(dataType);
  }

  _clearTypeParser() {
    parserStore.clear();
  }

  getConnection(options) {
    //return Promise.resolve(this.lib);
    options = options || {};
    options.uuid = options.uuid || "default";

    if (this.connections[options.uuid]) {
      return Promise.resolve(this.connections[options.uuid]);
    }

    return new Promise((resolve, reject) => {
      this.connections[options.uuid] = this.lib;
      debug(`connection acquired ${options.uuid}`);
      if (!this.connections[options.uuid])
        return reject(
          new sequelizeErrors.ConnectionError(
            new Error("Database reference no found!")
          )
        );
      resolve(this.connections[options.uuid]);
    }).tap(connection => {
      if (this.sequelize.config.password) {
        // Make it possible to define and use password for sqlite encryption plugin like sqlcipher
        const sql = `PRAGMA KEY=${this.sequelize.escape(
          this.sequelize.config.password
        )};`;
        if (connection && connection.exec) {
          connection.exec([{ sql, args: [] }], false, () => {});
        } else {
          connection.transaction(function(t) {
            t.executeSql(sql);
          });
        }
      }
      if (this.sequelize.options.foreignKeys !== false) {
        // Make it possible to define and use foreign key constraints unless
        // explicitly disallowed. It's still opt-in per relation
        if (connection && connection.exec) {
          connection.exec(
            [{ sql: "PRAGMA FOREIGN_KEYS=ON", args: [] }],
            false,
            () => {}
          );
        } else {
          connection.transaction(function(t) {
            t.executeSql("PRAGMA FOREIGN_KEYS=ON");
          });
        }
      }
    });
  }

  releaseConnection(connection, force) {
    if (force !== true) return;

    if (connection.uuid) {
      connection.close();
      debug(`connection released ${connection.uuid}`);
      delete this.connections[connection.uuid];
    }
  }
}

module.exports = ConnectionManager;
module.exports.ConnectionManager = ConnectionManager;
module.exports.default = ConnectionManager;
