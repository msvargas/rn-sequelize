"use strict";

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

const AbstractConnectionManager = require("../abstract/connection-manager");

const Promise = require("../../promise");

const {
  logger
} = require("../../utils/logger");

const debug = logger.debugContext("connection:sqlite");

const dataTypes = require("../../data-types").sqlite;

const sequelizeErrors = require("../../errors");

const parserStore = require("../parserStore")("sqlite");

let ConnectionManager =
/*#__PURE__*/
function (_AbstractConnectionMa) {
  _inherits(ConnectionManager, _AbstractConnectionMa);

  function ConnectionManager(dialect, sequelize) {
    var _this;

    _classCallCheck(this, ConnectionManager);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ConnectionManager).call(this, dialect, sequelize)); // We attempt to parse file location from a connection uri
    // but we shouldn't match sequelize default host.

    if (_this.sequelize.options.host === "localhost") {
      delete _this.sequelize.options.host;
    }

    const dialectOptions = Object.assign({
      version: "1.0"
    }, _this.sequelize.options.dialectOptions);
    _this.connections = {};
    _this.lib = _this._loadDialectModule().openDatabase(_this.sequelize.options.database, dialectOptions.version, dialectOptions.description, dialectOptions.size);
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

    _this.refreshTypeParser(dataTypes);

    return _this;
  }

  _createClass(ConnectionManager, [{
    key: "_onProcessExit",
    value: function _onProcessExit() {
      const promises = Object.getOwnPropertyNames(this.connections).map(connection => Promise.fromCallback(callback => this.connections[connection].close(callback)));
      return Promise.all(promises).then(() => _get(_getPrototypeOf(ConnectionManager.prototype), "_onProcessExit", this).call(this));
    } // Expose this as a method so that the parsing may be updated when the user has added additional, custom types

  }, {
    key: "_refreshTypeParser",
    value: function _refreshTypeParser(dataType) {
      parserStore.refresh(dataType);
    }
  }, {
    key: "_clearTypeParser",
    value: function _clearTypeParser() {
      parserStore.clear();
    }
  }, {
    key: "getConnection",
    value: function getConnection(options) {
      //return Promise.resolve(this.lib);
      options = options || {};
      options.uuid = options.uuid || "default";

      if (this.connections[options.uuid]) {
        return Promise.resolve(this.connections[options.uuid]);
      }

      return new Promise((resolve, reject) => {
        this.connections[options.uuid] = this.lib;
        debug(`connection acquired ${options.uuid}`);
        if (!this.connections[options.uuid]) return reject(new sequelizeErrors.ConnectionError(new Error("Database reference no found!")));
        resolve(this.connections[options.uuid]);
      }).tap(connection => {
        if (this.sequelize.config.password) {
          // Make it possible to define and use password for sqlite encryption plugin like sqlcipher
          const sql = `PRAGMA KEY=${this.sequelize.escape(this.sequelize.config.password)};`;

          if (connection && connection.exec) {
            connection.exec([{
              sql,
              args: []
            }], false, () => {});
          } else {
            connection.transaction(function (t) {
              t.executeSql(sql);
            });
          }
        }

        if (this.sequelize.options.foreignKeys !== false) {
          // Make it possible to define and use foreign key constraints unless
          // explicitly disallowed. It's still opt-in per relation
          if (connection && connection.exec) {
            connection.exec([{
              sql: "PRAGMA FOREIGN_KEYS=ON",
              args: []
            }], false, () => {});
          } else {
            connection.transaction(function (t) {
              t.executeSql("PRAGMA FOREIGN_KEYS=ON");
            });
          }
        }
      });
    }
  }, {
    key: "releaseConnection",
    value: function releaseConnection(connection, force) {
      if (force !== true) return;

      if (connection.uuid) {
        connection.close();
        debug(`connection released ${connection.uuid}`);
        delete this.connections[connection.uuid];
      }
    }
  }]);

  return ConnectionManager;
}(AbstractConnectionManager);

module.exports = ConnectionManager;
module.exports.ConnectionManager = ConnectionManager;
module.exports.default = ConnectionManager;