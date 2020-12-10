"use strict";

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

const AbstractConnectionManager = require("../abstract/connection-manager");

const Promise = require("../../promise");

const {
  logger
} = require("../../utils/logger");

const debug = logger.debugContext("connection:sqlite");

const dataTypes = require("../../data-types").sqlite;

const sequelizeErrors = require("../../errors");

const parserStore = require("../parserStore")("sqlite");

let ConnectionManager = /*#__PURE__*/function (_AbstractConnectionMa) {
  _inherits(ConnectionManager, _AbstractConnectionMa);

  var _super = _createSuper(ConnectionManager);

  function ConnectionManager(dialect, sequelize) {
    var _this;

    _classCallCheck(this, ConnectionManager);

    _this = _super.call(this, dialect, sequelize);
    _this.connections = {};

    const {
      openDatabase
    } = _this._loadDialectModule();

    _this.openDatabase = () => openDatabase(_this.sequelize.options.database, _this.sequelize.options.dialectOptions.version || "1.0", _this.sequelize.options.dialectOptions.description || _this.sequelize.options.database, _this.sequelize.options.dialectOptions.size || 4 * 1024 * 1024);

    _this.conn = _this.openDatabase();

    _this.refreshTypeParser(dataTypes);

    return _this;
  }

  _createClass(ConnectionManager, [{
    key: "_onProcessExit",
    value: function _onProcessExit() {
      const promises = Object.getOwnPropertyNames(this.connections).map(connection => Promise.fromCallback(callback => this.connections[connection].close(callback)));
      return Promise.all(promises).then(_get(_getPrototypeOf(ConnectionManager.prototype), "_onProcessExit", this).bind(this));
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
      options = options || {};
      options.uuid = options.uuid || "default";

      if (this.connections[options.uuid]) {
        return Promise.resolve(this.connections[options.uuid]);
      }

      return new Promise((resolve, reject) => {
        this.connections[options.uuid] = !this.conn ? this.openDatabase() : this.conn;
        debug(`connection acquired ${options.uuid}`);
        if (!this.connections[options.uuid]) return reject(new sequelizeErrors.ConnectionError(new Error("Database reference no found!")));
        resolve(this.connections[options.uuid]);
      }).tap(connection => {
        if (this.sequelize.config.password) {
          // Make it possible to define and use password for sqlite encryption plugin like sqlcipher
          if (connection && connection.exec) {
            connection.exec([{
              sql: `PRAGMA KEY=${this.sequelize.escape(this.sequelize.config.password)};`,
              args: []
            }], false, () => {});
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
          }
        }
      });
    }
  }, {
    key: "releaseConnection",
    value: function releaseConnection(connection, force) {
      if (force !== true) return;

      if (connection.uuid) {
        connection.close && connection.close();
        this.conn = undefined;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvY29ubmVjdGlvbi1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbIkFic3RyYWN0Q29ubmVjdGlvbk1hbmFnZXIiLCJyZXF1aXJlIiwiUHJvbWlzZSIsImxvZ2dlciIsImRlYnVnIiwiZGVidWdDb250ZXh0IiwiZGF0YVR5cGVzIiwic3FsaXRlIiwic2VxdWVsaXplRXJyb3JzIiwicGFyc2VyU3RvcmUiLCJDb25uZWN0aW9uTWFuYWdlciIsImRpYWxlY3QiLCJzZXF1ZWxpemUiLCJjb25uZWN0aW9ucyIsIm9wZW5EYXRhYmFzZSIsIl9sb2FkRGlhbGVjdE1vZHVsZSIsIm9wdGlvbnMiLCJkYXRhYmFzZSIsImRpYWxlY3RPcHRpb25zIiwidmVyc2lvbiIsImRlc2NyaXB0aW9uIiwic2l6ZSIsImNvbm4iLCJyZWZyZXNoVHlwZVBhcnNlciIsInByb21pc2VzIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsIm1hcCIsImNvbm5lY3Rpb24iLCJmcm9tQ2FsbGJhY2siLCJjYWxsYmFjayIsImNsb3NlIiwiYWxsIiwidGhlbiIsImJpbmQiLCJkYXRhVHlwZSIsInJlZnJlc2giLCJjbGVhciIsInV1aWQiLCJyZXNvbHZlIiwicmVqZWN0IiwiQ29ubmVjdGlvbkVycm9yIiwiRXJyb3IiLCJ0YXAiLCJjb25maWciLCJwYXNzd29yZCIsImV4ZWMiLCJzcWwiLCJlc2NhcGUiLCJhcmdzIiwiZm9yZWlnbktleXMiLCJmb3JjZSIsInVuZGVmaW5lZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSx5QkFBeUIsR0FBR0MsT0FBTyxDQUFDLGdDQUFELENBQXpDOztBQUNBLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFDLGVBQUQsQ0FBdkI7O0FBQ0EsTUFBTTtBQUFFRSxFQUFBQTtBQUFGLElBQWFGLE9BQU8sQ0FBQyxv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QUNHLEtBQVgsSUFBb0JILFVBQVUsQ0FBQ0csS0FBWCxFQUFwQjtBQUNBLGFBQUtULElBQUwsR0FBWThCLFNBQVo7QUFDQWhELFFBQUFBLEtBQUssQ0FBRSx1QkFBc0J3QixVQUFVLENBQUNVLElBQUssRUFBeEMsQ0FBTDtBQUNBLGVBQU8sS0FBS3pCLFdBQUwsQ0FBaUJlLFVBQVUsQ0FBQ1UsSUFBNUIsQ0FBUDtBQUNEO0FBQ0Y7Ozs7RUFwRzZCdEMseUI7O0FBdUdoQ3FELE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjVDLGlCQUFqQjtBQUNBMkMsTUFBTSxDQUFDQyxPQUFQLENBQWU1QyxpQkFBZixHQUFtQ0EsaUJBQW5DO0FBQ0EyQyxNQUFNLENBQUNDLE9BQVAsQ0FBZUMsT0FBZixHQUF5QjdDLGlCQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBBYnN0cmFjdENvbm5lY3Rpb25NYW5hZ2VyID0gcmVxdWlyZShcIi4uL2Fic3RyYWN0L2Nvbm5lY3Rpb24tbWFuYWdlclwiKTtcbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKFwiLi4vLi4vcHJvbWlzZVwiKTtcbmNvbnN0IHsgbG9nZ2VyIH0gPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvbG9nZ2VyXCIpO1xuY29uc3QgZGVidWcgPSBsb2dnZXIuZGVidWdDb250ZXh0KFwiY29ubmVjdGlvbjpzcWxpdGVcIik7XG5jb25zdCBkYXRhVHlwZXMgPSByZXF1aXJlKFwiLi4vLi4vZGF0YS10eXBlc1wiKS5zcWxpdGU7XG5jb25zdCBzZXF1ZWxpemVFcnJvcnMgPSByZXF1aXJlKFwiLi4vLi4vZXJyb3JzXCIpO1xuY29uc3QgcGFyc2VyU3RvcmUgPSByZXF1aXJlKFwiLi4vcGFyc2VyU3RvcmVcIikoXCJzcWxpdGVcIik7XG5cbmNsYXNzIENvbm5lY3Rpb25NYW5hZ2VyIGV4dGVuZHMgQWJzdHJhY3RDb25uZWN0aW9uTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKGRpYWxlY3QsIHNlcXVlbGl6ZSkge1xuICAgIHN1cGVyKGRpYWxlY3QsIHNlcXVlbGl6ZSk7XG5cbiAgICB0aGlzLmNvbm5lY3Rpb25zID0ge307XG4gICAgY29uc3QgeyBvcGVuRGF0YWJhc2UgfSA9IHRoaXMuX2xvYWREaWFsZWN0TW9kdWxlKCk7XG4gICAgdGhpcy5vcGVuRGF0YWJhc2UgPSAoKSA9PlxuICAgICAgb3BlbkRhdGFiYXNlKFxuICAgICAgICB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRhdGFiYXNlLFxuICAgICAgICB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3RPcHRpb25zLnZlcnNpb24gfHwgXCIxLjBcIixcbiAgICAgICAgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0T3B0aW9ucy5kZXNjcmlwdGlvbiB8fFxuICAgICAgICAgIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGF0YWJhc2UsXG4gICAgICAgIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdE9wdGlvbnMuc2l6ZSB8fCA0ICogMTAyNCAqIDEwMjRcbiAgICAgICk7XG4gICAgdGhpcy5jb25uID0gdGhpcy5vcGVuRGF0YWJhc2UoKTtcbiAgICB0aGlzLnJlZnJlc2hUeXBlUGFyc2VyKGRhdGFUeXBlcyk7XG4gIH1cblxuICBfb25Qcm9jZXNzRXhpdCgpIHtcbiAgICBjb25zdCBwcm9taXNlcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKFxuICAgICAgdGhpcy5jb25uZWN0aW9uc1xuICAgICkubWFwKGNvbm5lY3Rpb24gPT5cbiAgICAgIFByb21pc2UuZnJvbUNhbGxiYWNrKGNhbGxiYWNrID0+XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbnNbY29ubmVjdGlvbl0uY2xvc2UoY2FsbGJhY2spXG4gICAgICApXG4gICAgKTtcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihzdXBlci5fb25Qcm9jZXNzRXhpdC5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8vIEV4cG9zZSB0aGlzIGFzIGEgbWV0aG9kIHNvIHRoYXQgdGhlIHBhcnNpbmcgbWF5IGJlIHVwZGF0ZWQgd2hlbiB0aGUgdXNlciBoYXMgYWRkZWQgYWRkaXRpb25hbCwgY3VzdG9tIHR5cGVzXG4gIF9yZWZyZXNoVHlwZVBhcnNlcihkYXRhVHlwZSkge1xuICAgIHBhcnNlclN0b3JlLnJlZnJlc2goZGF0YVR5cGUpO1xuICB9XG5cbiAgX2NsZWFyVHlwZVBhcnNlcigpIHtcbiAgICBwYXJzZXJTdG9yZS5jbGVhcigpO1xuICB9XG5cbiAgZ2V0Q29ubmVjdGlvbihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy51dWlkID0gb3B0aW9ucy51dWlkIHx8IFwiZGVmYXVsdFwiO1xuXG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbnNbb3B0aW9ucy51dWlkXSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmNvbm5lY3Rpb25zW29wdGlvbnMudXVpZF0pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLmNvbm5lY3Rpb25zW29wdGlvbnMudXVpZF0gPSAhdGhpcy5jb25uXG4gICAgICAgID8gdGhpcy5vcGVuRGF0YWJhc2UoKVxuICAgICAgICA6IHRoaXMuY29ubjtcbiAgICAgIGRlYnVnKGBjb25uZWN0aW9uIGFjcXVpcmVkICR7b3B0aW9ucy51dWlkfWApO1xuICAgICAgaWYgKCF0aGlzLmNvbm5lY3Rpb25zW29wdGlvbnMudXVpZF0pXG4gICAgICAgIHJldHVybiByZWplY3QoXG4gICAgICAgICAgbmV3IHNlcXVlbGl6ZUVycm9ycy5Db25uZWN0aW9uRXJyb3IoXG4gICAgICAgICAgICBuZXcgRXJyb3IoXCJEYXRhYmFzZSByZWZlcmVuY2Ugbm8gZm91bmQhXCIpXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgcmVzb2x2ZSh0aGlzLmNvbm5lY3Rpb25zW29wdGlvbnMudXVpZF0pO1xuICAgIH0pLnRhcChjb25uZWN0aW9uID0+IHtcbiAgICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5jb25maWcucGFzc3dvcmQpIHtcbiAgICAgICAgLy8gTWFrZSBpdCBwb3NzaWJsZSB0byBkZWZpbmUgYW5kIHVzZSBwYXNzd29yZCBmb3Igc3FsaXRlIGVuY3J5cHRpb24gcGx1Z2luIGxpa2Ugc3FsY2lwaGVyXG4gICAgICAgIGlmIChjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZXhlYykge1xuICAgICAgICAgIGNvbm5lY3Rpb24uZXhlYyhcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNxbDogYFBSQUdNQSBLRVk9JHt0aGlzLnNlcXVlbGl6ZS5lc2NhcGUoXG4gICAgICAgICAgICAgICAgICB0aGlzLnNlcXVlbGl6ZS5jb25maWcucGFzc3dvcmRcbiAgICAgICAgICAgICAgICApfTtgLFxuICAgICAgICAgICAgICAgIGFyZ3M6IFtdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICgpID0+IHt9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZm9yZWlnbktleXMgIT09IGZhbHNlKSB7XG4gICAgICAgIC8vIE1ha2UgaXQgcG9zc2libGUgdG8gZGVmaW5lIGFuZCB1c2UgZm9yZWlnbiBrZXkgY29uc3RyYWludHMgdW5sZXNzXG4gICAgICAgIC8vIGV4cGxpY2l0bHkgZGlzYWxsb3dlZC4gSXQncyBzdGlsbCBvcHQtaW4gcGVyIHJlbGF0aW9uXG4gICAgICAgIGlmIChjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZXhlYykge1xuICAgICAgICAgIGNvbm5lY3Rpb24uZXhlYyhcbiAgICAgICAgICAgIFt7IHNxbDogXCJQUkFHTUEgRk9SRUlHTl9LRVlTPU9OXCIsIGFyZ3M6IFtdIH1dLFxuICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAoKSA9PiB7fVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJlbGVhc2VDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGZvcmNlKSB7XG4gICAgaWYgKGZvcmNlICE9PSB0cnVlKSByZXR1cm47XG5cbiAgICBpZiAoY29ubmVjdGlvbi51dWlkKSB7XG4gICAgICBjb25uZWN0aW9uLmNsb3NlICYmIGNvbm5lY3Rpb24uY2xvc2UoKTtcbiAgICAgIHRoaXMuY29ubiA9IHVuZGVmaW5lZDtcbiAgICAgIGRlYnVnKGBjb25uZWN0aW9uIHJlbGVhc2VkICR7Y29ubmVjdGlvbi51dWlkfWApO1xuICAgICAgZGVsZXRlIHRoaXMuY29ubmVjdGlvbnNbY29ubmVjdGlvbi51dWlkXTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0aW9uTWFuYWdlcjtcbm1vZHVsZS5leHBvcnRzLkNvbm5lY3Rpb25NYW5hZ2VyID0gQ29ubmVjdGlvbk1hbmFnZXI7XG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gQ29ubmVjdGlvbk1hbmFnZXI7XG4iXX0=