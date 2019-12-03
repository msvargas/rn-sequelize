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

    this.connections = {};
    const { openDatabase } = this._loadDialectModule();
    this.openDatabase = () =>
      openDatabase(
        this.sequelize.options.database,
        this.sequelize.options.dialectOptions.version || "1.0",
        this.sequelize.options.dialectOptions.description ||
          this.sequelize.options.database,
        this.sequelize.options.dialectOptions.size || 4 * 1024 * 1024
      );
    this.conn = this.openDatabase();
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

    return Promise.all(promises).then(super._onProcessExit.bind(this));
  }

  // Expose this as a method so that the parsing may be updated when the user has added additional, custom types
  _refreshTypeParser(dataType) {
    parserStore.refresh(dataType);
  }

  _clearTypeParser() {
    parserStore.clear();
  }

  getConnection(options) {
    options = options || {};
    options.uuid = options.uuid || "default";

    if (this.connections[options.uuid]) {
      return Promise.resolve(this.connections[options.uuid]);
    }

    return new Promise((resolve, reject) => {
      this.connections[options.uuid] = !this.conn
        ? this.openDatabase()
        : this.conn;
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
        if (connection && connection.exec) {
          connection.exec(
            [
              {
                sql: `PRAGMA KEY=${this.sequelize.escape(
                  this.sequelize.config.password
                )};`,
                args: []
              }
            ],
            false,
            () => {}
          );
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
        }
      }
    });
  }

  releaseConnection(connection, force) {
    if (force !== true) return;

    if (connection.uuid) {
      connection.close && connection.close();
      this.conn = undefined;
      debug(`connection released ${connection.uuid}`);
      delete this.connections[connection.uuid];
    }
  }
}

module.exports = ConnectionManager;
module.exports.ConnectionManager = ConnectionManager;
module.exports.default = ConnectionManager;
