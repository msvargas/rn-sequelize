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
      const promises = [Promise.fromCallback(callback => {
        return this.connections['default'].then(db => {
          db.close(callback, callback);
        });
      })];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvY29ubmVjdGlvbi1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbIkFic3RyYWN0Q29ubmVjdGlvbk1hbmFnZXIiLCJyZXF1aXJlIiwiUHJvbWlzZSIsImxvZ2dlciIsImRlYnVnIiwiZGVidWdDb250ZXh0IiwiZGF0YVR5cGVzIiwic3FsaXRlIiwic2VxdWVsaXplRXJyb3JzIiwicGFyc2VyU3RvcmUiLCJDb25uZWN0aW9uTWFuYWdlciIsImRpYWxlY3QiLCJzZXF1ZWxpemUiLCJjb25uZWN0aW9ucyIsIm9wZW5EYXRhYmFzZSIsIl9sb2FkRGlhbGVjdE1vZHVsZSIsIm9wdGlvbnMiLCJkYXRhYmFzZSIsImRpYWxlY3RPcHRpb25zIiwidmVyc2lvbiIsImRlc2NyaXB0aW9uIiwic2l6ZSIsImNvbm4iLCJyZWZyZXNoVHlwZVBhcnNlciIsInByb21pc2VzIiwiZnJvbUNhbGxiYWNrIiwiY2FsbGJhY2siLCJ0aGVuIiwiZGIiLCJjbG9zZSIsImFsbCIsImJpbmQiLCJkYXRhVHlwZSIsInJlZnJlc2giLCJjbGVhciIsInV1aWQiLCJyZXNvbHZlIiwicmVqZWN0IiwiQ29ubmVjdGlvbkVycm9yIiwiRXJyb3IiLCJ0YXAiLCJjb25uZWN0aW9uIiwiY29uZmlnIiwicGFzc3dvcmQiLCJleGVjIiwic3FsIiwiZXNjYXBlIiwiYXJncyIsImZvcmVpZ25LZXlzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEseUJBQXlCLEdBQUdDLE9BQU8sQ0FBQyxnQ0FBRCxDQUF6Qzs7QUFDQSxNQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBQyxlQUFELENBQXZCOztBQUNBLE1BQU07QUFBRUUsRUFBQUE7QUFBRixJQUFhRixPQUFPLENBQUMsb0JBQUQsQ0FBMUI7O0FBQ0EsTUFBTUcsS0FBSyxHQUFH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WSxVQUFVLENBQUNaLEtBQVgsRUFBcEI7QUFDQSxhQUFLUCxJQUFMLEdBQVk0QixTQUFaO0FBQ0E5QyxRQUFBQSxLQUFLLENBQUUsdUJBQXNCcUMsVUFBVSxDQUFDTixJQUFLLEVBQXhDLENBQUw7QUFDQSxlQUFPLEtBQUt0QixXQUFMLENBQWlCNEIsVUFBVSxDQUFDTixJQUE1QixDQUFQO0FBQ0Q7QUFDRjs7OztFQWxHNkJuQyx5Qjs7QUFxR2hDbUQsTUFBTSxDQUFDQyxPQUFQLEdBQWlCMUMsaUJBQWpCO0FBQ0F5QyxNQUFNLENBQUNDLE9BQVAsQ0FBZTFDLGlCQUFmLEdBQW1DQSxpQkFBbkM7QUFDQXlDLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxPQUFmLEdBQXlCM0MsaUJBQXpCIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IEFic3RyYWN0Q29ubmVjdGlvbk1hbmFnZXIgPSByZXF1aXJlKFwiLi4vYWJzdHJhY3QvY29ubmVjdGlvbi1tYW5hZ2VyXCIpO1xuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoXCIuLi8uLi9wcm9taXNlXCIpO1xuY29uc3QgeyBsb2dnZXIgfSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9sb2dnZXJcIik7XG5jb25zdCBkZWJ1ZyA9IGxvZ2dlci5kZWJ1Z0NvbnRleHQoXCJjb25uZWN0aW9uOnNxbGl0ZVwiKTtcbmNvbnN0IGRhdGFUeXBlcyA9IHJlcXVpcmUoXCIuLi8uLi9kYXRhLXR5cGVzXCIpLnNxbGl0ZTtcbmNvbnN0IHNlcXVlbGl6ZUVycm9ycyA9IHJlcXVpcmUoXCIuLi8uLi9lcnJvcnNcIik7XG5jb25zdCBwYXJzZXJTdG9yZSA9IHJlcXVpcmUoXCIuLi9wYXJzZXJTdG9yZVwiKShcInNxbGl0ZVwiKTtcblxuY2xhc3MgQ29ubmVjdGlvbk1hbmFnZXIgZXh0ZW5kcyBBYnN0cmFjdENvbm5lY3Rpb25NYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IoZGlhbGVjdCwgc2VxdWVsaXplKSB7XG4gICAgc3VwZXIoZGlhbGVjdCwgc2VxdWVsaXplKTtcblxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSB7fTtcbiAgICBjb25zdCB7IG9wZW5EYXRhYmFzZSB9ID0gdGhpcy5fbG9hZERpYWxlY3RNb2R1bGUoKTtcbiAgICB0aGlzLm9wZW5EYXRhYmFzZSA9ICgpID0+XG4gICAgICBvcGVuRGF0YWJhc2UoXG4gICAgICAgIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGF0YWJhc2UsXG4gICAgICAgIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdE9wdGlvbnMudmVyc2lvbiB8fCBcIjEuMFwiLFxuICAgICAgICB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3RPcHRpb25zLmRlc2NyaXB0aW9uIHx8XG4gICAgICAgICAgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kYXRhYmFzZSxcbiAgICAgICAgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0T3B0aW9ucy5zaXplIHx8IDQgKiAxMDI0ICogMTAyNFxuICAgICAgKTtcbiAgICB0aGlzLmNvbm4gPSB0aGlzLm9wZW5EYXRhYmFzZSgpO1xuICAgIHRoaXMucmVmcmVzaFR5cGVQYXJzZXIoZGF0YVR5cGVzKTtcbiAgfVxuXG4gIF9vblByb2Nlc3NFeGl0KCkge1xuICAgIGNvbnN0IHByb21pc2VzID0gW1Byb21pc2UuZnJvbUNhbGxiYWNrKGNhbGxiYWNrID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb25zWydkZWZhdWx0J10udGhlbihkYiA9PiB7XG4gICAgICAgIGRiLmNsb3NlKGNhbGxiYWNrLCBjYWxsYmFjayk7XG4gICAgICB9KTtcbiAgICB9KV07XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oc3VwZXIuX29uUHJvY2Vzc0V4aXQuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvLyBFeHBvc2UgdGhpcyBhcyBhIG1ldGhvZCBzbyB0aGF0IHRoZSBwYXJzaW5nIG1heSBiZSB1cGRhdGVkIHdoZW4gdGhlIHVzZXIgaGFzIGFkZGVkIGFkZGl0aW9uYWwsIGN1c3RvbSB0eXBlc1xuICBfcmVmcmVzaFR5cGVQYXJzZXIoZGF0YVR5cGUpIHtcbiAgICBwYXJzZXJTdG9yZS5yZWZyZXNoKGRhdGFUeXBlKTtcbiAgfVxuXG4gIF9jbGVhclR5cGVQYXJzZXIoKSB7XG4gICAgcGFyc2VyU3RvcmUuY2xlYXIoKTtcbiAgfVxuXG4gIGdldENvbm5lY3Rpb24ob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnMudXVpZCA9IG9wdGlvbnMudXVpZCB8fCBcImRlZmF1bHRcIjtcblxuICAgIGlmICh0aGlzLmNvbm5lY3Rpb25zW29wdGlvbnMudXVpZF0pIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5jb25uZWN0aW9uc1tvcHRpb25zLnV1aWRdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5jb25uZWN0aW9uc1tvcHRpb25zLnV1aWRdID0gIXRoaXMuY29ublxuICAgICAgICA/IHRoaXMub3BlbkRhdGFiYXNlKClcbiAgICAgICAgOiB0aGlzLmNvbm47XG4gICAgICBkZWJ1ZyhgY29ubmVjdGlvbiBhY3F1aXJlZCAke29wdGlvbnMudXVpZH1gKTtcbiAgICAgIGlmICghdGhpcy5jb25uZWN0aW9uc1tvcHRpb25zLnV1aWRdKVxuICAgICAgICByZXR1cm4gcmVqZWN0KFxuICAgICAgICAgIG5ldyBzZXF1ZWxpemVFcnJvcnMuQ29ubmVjdGlvbkVycm9yKFxuICAgICAgICAgICAgbmV3IEVycm9yKFwiRGF0YWJhc2UgcmVmZXJlbmNlIG5vIGZvdW5kIVwiKVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIHJlc29sdmUodGhpcy5jb25uZWN0aW9uc1tvcHRpb25zLnV1aWRdKTtcbiAgICB9KS50YXAoY29ubmVjdGlvbiA9PiB7XG4gICAgICBpZiAodGhpcy5zZXF1ZWxpemUuY29uZmlnLnBhc3N3b3JkKSB7XG4gICAgICAgIC8vIE1ha2UgaXQgcG9zc2libGUgdG8gZGVmaW5lIGFuZCB1c2UgcGFzc3dvcmQgZm9yIHNxbGl0ZSBlbmNyeXB0aW9uIHBsdWdpbiBsaWtlIHNxbGNpcGhlclxuICAgICAgICBpZiAoY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmV4ZWMpIHtcbiAgICAgICAgICBjb25uZWN0aW9uLmV4ZWMoXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzcWw6IGBQUkFHTUEgS0VZPSR7dGhpcy5zZXF1ZWxpemUuZXNjYXBlKFxuICAgICAgICAgICAgICAgICAgdGhpcy5zZXF1ZWxpemUuY29uZmlnLnBhc3N3b3JkXG4gICAgICAgICAgICAgICAgKX07YCxcbiAgICAgICAgICAgICAgICBhcmdzOiBbXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAoKSA9PiB7fVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmZvcmVpZ25LZXlzICE9PSBmYWxzZSkge1xuICAgICAgICAvLyBNYWtlIGl0IHBvc3NpYmxlIHRvIGRlZmluZSBhbmQgdXNlIGZvcmVpZ24ga2V5IGNvbnN0cmFpbnRzIHVubGVzc1xuICAgICAgICAvLyBleHBsaWNpdGx5IGRpc2FsbG93ZWQuIEl0J3Mgc3RpbGwgb3B0LWluIHBlciByZWxhdGlvblxuICAgICAgICBpZiAoY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmV4ZWMpIHtcbiAgICAgICAgICBjb25uZWN0aW9uLmV4ZWMoXG4gICAgICAgICAgICBbeyBzcWw6IFwiUFJBR01BIEZPUkVJR05fS0VZUz1PTlwiLCBhcmdzOiBbXSB9XSxcbiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgKCkgPT4ge31cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZWxlYXNlQ29ubmVjdGlvbihjb25uZWN0aW9uLCBmb3JjZSkge1xuICAgIGlmIChmb3JjZSAhPT0gdHJ1ZSkgcmV0dXJuO1xuXG4gICAgaWYgKGNvbm5lY3Rpb24udXVpZCkge1xuICAgICAgY29ubmVjdGlvbi5jbG9zZSAmJiBjb25uZWN0aW9uLmNsb3NlKCk7XG4gICAgICB0aGlzLmNvbm4gPSB1bmRlZmluZWQ7XG4gICAgICBkZWJ1ZyhgY29ubmVjdGlvbiByZWxlYXNlZCAke2Nvbm5lY3Rpb24udXVpZH1gKTtcbiAgICAgIGRlbGV0ZSB0aGlzLmNvbm5lY3Rpb25zW2Nvbm5lY3Rpb24udXVpZF07XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29ubmVjdGlvbk1hbmFnZXI7XG5tb2R1bGUuZXhwb3J0cy5Db25uZWN0aW9uTWFuYWdlciA9IENvbm5lY3Rpb25NYW5hZ2VyO1xubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IENvbm5lY3Rpb25NYW5hZ2VyO1xuIl19