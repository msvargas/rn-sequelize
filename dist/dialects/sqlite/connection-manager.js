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
      const promises = Object.getOwnPropertyNames(this.connections).map(connection => {
        return Promise.fromCallback(callback => {
          return this.connections[connection].then(db => {
            db.close(callback);
          });
        });
      });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvY29ubmVjdGlvbi1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbIkFic3RyYWN0Q29ubmVjdGlvbk1hbmFnZXIiLCJyZXF1aXJlIiwiUHJvbWlzZSIsImxvZ2dlciIsImRlYnVnIiwiZGVidWdDb250ZXh0IiwiZGF0YVR5cGVzIiwic3FsaXRlIiwic2VxdWVsaXplRXJyb3JzIiwicGFyc2VyU3RvcmUiLCJDb25uZWN0aW9uTWFuYWdlciIsImRpYWxlY3QiLCJzZXF1ZWxpemUiLCJjb25uZWN0aW9ucyIsIm9wZW5EYXRhYmFzZSIsIl9sb2FkRGlhbGVjdE1vZHVsZSIsIm9wdGlvbnMiLCJkYXRhYmFzZSIsImRpYWxlY3RPcHRpb25zIiwidmVyc2lvbiIsImRlc2NyaXB0aW9uIiwic2l6ZSIsImNvbm4iLCJyZWZyZXNoVHlwZVBhcnNlciIsInByb21pc2VzIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsIm1hcCIsImNvbm5lY3Rpb24iLCJmcm9tQ2FsbGJhY2siLCJjYWxsYmFjayIsInRoZW4iLCJkYiIsImNsb3NlIiwiYWxsIiwiYmluZCIsImRhdGFUeXBlIiwicmVmcmVzaCIsImNsZWFyIiwidXVpZCIsInJlc29sdmUiLCJyZWplY3QiLCJDb25uZWN0aW9uRXJyb3IiLCJFcnJvciIsInRhcCIsImNvbmZpZyIsInBhc3N3b3JkIiwiZXhlYyIsInNxbCIsImVzY2FwZSIsImFyZ3MiLCJmb3JlaWduS2V5cyIsImZvcmNlIiwidW5kZWZpbmVkIiwibW9kdWxlIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLHlCQUF5QixHQUFHQyxPQUFPLENBQUMsZ0NBQUQsQ0FBekM7O0FBQ0EsTUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUMsZUFBRCxDQUF2Qjs7QUFDQSxNQUFNO0FBQUVFLEVBQUFBO0FBQUYsSUFBYUYsT0FBTyxD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RUFBWXdCLEssRUFBTztBQUNuQyxVQUFJQSxLQUFLLEtBQUssSUFBZCxFQUFvQjs7QUFFcEIsVUFBSXhCLFVBQVUsQ0FBQ1csSUFBZixFQUFxQjtBQUNuQlgsUUFBQUEsVUFBVSxDQUFDSyxLQUFYLElBQW9CTCxVQUFVLENBQUNLLEtBQVgsRUFBcEI7QUFDQSxhQUFLWCxJQUFMLEdBQVkrQixTQUFaO0FBQ0FqRCxRQUFBQSxLQUFLLENBQUUsdUJBQXNCd0IsVUFBVSxDQUFDVyxJQUFLLEVBQXhDLENBQUw7QUFDQSxlQUFPLEtBQUsxQixXQUFMLENBQWlCZSxVQUFVLENBQUNXLElBQTVCLENBQVA7QUFDRDtBQUNGOzs7O0VBdEc2QnZDLHlCOztBQXlHaENzRCxNQUFNLENBQUNDLE9BQVAsR0FBaUI3QyxpQkFBakI7QUFDQTRDLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlN0MsaUJBQWYsR0FBbUNBLGlCQUFuQztBQUNBNEMsTUFBTSxDQUFDQyxPQUFQLENBQWVDLE9BQWYsR0FBeUI5QyxpQkFBekIiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgQWJzdHJhY3RDb25uZWN0aW9uTWFuYWdlciA9IHJlcXVpcmUoXCIuLi9hYnN0cmFjdC9jb25uZWN0aW9uLW1hbmFnZXJcIik7XG5jb25zdCBQcm9taXNlID0gcmVxdWlyZShcIi4uLy4uL3Byb21pc2VcIik7XG5jb25zdCB7IGxvZ2dlciB9ID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL2xvZ2dlclwiKTtcbmNvbnN0IGRlYnVnID0gbG9nZ2VyLmRlYnVnQ29udGV4dChcImNvbm5lY3Rpb246c3FsaXRlXCIpO1xuY29uc3QgZGF0YVR5cGVzID0gcmVxdWlyZShcIi4uLy4uL2RhdGEtdHlwZXNcIikuc3FsaXRlO1xuY29uc3Qgc2VxdWVsaXplRXJyb3JzID0gcmVxdWlyZShcIi4uLy4uL2Vycm9yc1wiKTtcbmNvbnN0IHBhcnNlclN0b3JlID0gcmVxdWlyZShcIi4uL3BhcnNlclN0b3JlXCIpKFwic3FsaXRlXCIpO1xuXG5jbGFzcyBDb25uZWN0aW9uTWFuYWdlciBleHRlbmRzIEFic3RyYWN0Q29ubmVjdGlvbk1hbmFnZXIge1xuICBjb25zdHJ1Y3RvcihkaWFsZWN0LCBzZXF1ZWxpemUpIHtcbiAgICBzdXBlcihkaWFsZWN0LCBzZXF1ZWxpemUpO1xuXG4gICAgdGhpcy5jb25uZWN0aW9ucyA9IHt9O1xuICAgIGNvbnN0IHsgb3BlbkRhdGFiYXNlIH0gPSB0aGlzLl9sb2FkRGlhbGVjdE1vZHVsZSgpO1xuICAgIHRoaXMub3BlbkRhdGFiYXNlID0gKCkgPT5cbiAgICAgIG9wZW5EYXRhYmFzZShcbiAgICAgICAgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kYXRhYmFzZSxcbiAgICAgICAgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0T3B0aW9ucy52ZXJzaW9uIHx8IFwiMS4wXCIsXG4gICAgICAgIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdE9wdGlvbnMuZGVzY3JpcHRpb24gfHxcbiAgICAgICAgICB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRhdGFiYXNlLFxuICAgICAgICB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3RPcHRpb25zLnNpemUgfHwgNCAqIDEwMjQgKiAxMDI0XG4gICAgICApO1xuICAgIHRoaXMuY29ubiA9IHRoaXMub3BlbkRhdGFiYXNlKCk7XG4gICAgdGhpcy5yZWZyZXNoVHlwZVBhcnNlcihkYXRhVHlwZXMpO1xuICB9XG5cbiAgX29uUHJvY2Vzc0V4aXQoKSB7XG4gICAgY29uc3QgcHJvbWlzZXMgPSBPYmplY3RcbiAgICAgIC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMuY29ubmVjdGlvbnMpXG4gICAgICAubWFwKGNvbm5lY3Rpb24gPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5mcm9tQ2FsbGJhY2soY2FsbGJhY2sgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb25zW2Nvbm5lY3Rpb25dLnRoZW4oZGIgPT4ge1xuICAgICAgICAgICAgZGIuY2xvc2UoY2FsbGJhY2spO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHN1cGVyLl9vblByb2Nlc3NFeGl0LmJpbmQodGhpcykpO1xuICB9XG5cbiAgLy8gRXhwb3NlIHRoaXMgYXMgYSBtZXRob2Qgc28gdGhhdCB0aGUgcGFyc2luZyBtYXkgYmUgdXBkYXRlZCB3aGVuIHRoZSB1c2VyIGhhcyBhZGRlZCBhZGRpdGlvbmFsLCBjdXN0b20gdHlwZXNcbiAgX3JlZnJlc2hUeXBlUGFyc2VyKGRhdGFUeXBlKSB7XG4gICAgcGFyc2VyU3RvcmUucmVmcmVzaChkYXRhVHlwZSk7XG4gIH1cblxuICBfY2xlYXJUeXBlUGFyc2VyKCkge1xuICAgIHBhcnNlclN0b3JlLmNsZWFyKCk7XG4gIH1cblxuICBnZXRDb25uZWN0aW9uKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLnV1aWQgPSBvcHRpb25zLnV1aWQgfHwgXCJkZWZhdWx0XCI7XG5cbiAgICBpZiAodGhpcy5jb25uZWN0aW9uc1tvcHRpb25zLnV1aWRdKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuY29ubmVjdGlvbnNbb3B0aW9ucy51dWlkXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuY29ubmVjdGlvbnNbb3B0aW9ucy51dWlkXSA9ICF0aGlzLmNvbm5cbiAgICAgICAgPyB0aGlzLm9wZW5EYXRhYmFzZSgpXG4gICAgICAgIDogdGhpcy5jb25uO1xuICAgICAgZGVidWcoYGNvbm5lY3Rpb24gYWNxdWlyZWQgJHtvcHRpb25zLnV1aWR9YCk7XG4gICAgICBpZiAoIXRoaXMuY29ubmVjdGlvbnNbb3B0aW9ucy51dWlkXSlcbiAgICAgICAgcmV0dXJuIHJlamVjdChcbiAgICAgICAgICBuZXcgc2VxdWVsaXplRXJyb3JzLkNvbm5lY3Rpb25FcnJvcihcbiAgICAgICAgICAgIG5ldyBFcnJvcihcIkRhdGFiYXNlIHJlZmVyZW5jZSBubyBmb3VuZCFcIilcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICByZXNvbHZlKHRoaXMuY29ubmVjdGlvbnNbb3B0aW9ucy51dWlkXSk7XG4gICAgfSkudGFwKGNvbm5lY3Rpb24gPT4ge1xuICAgICAgaWYgKHRoaXMuc2VxdWVsaXplLmNvbmZpZy5wYXNzd29yZCkge1xuICAgICAgICAvLyBNYWtlIGl0IHBvc3NpYmxlIHRvIGRlZmluZSBhbmQgdXNlIHBhc3N3b3JkIGZvciBzcWxpdGUgZW5jcnlwdGlvbiBwbHVnaW4gbGlrZSBzcWxjaXBoZXJcbiAgICAgICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5leGVjKSB7XG4gICAgICAgICAgY29ubmVjdGlvbi5leGVjKFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3FsOiBgUFJBR01BIEtFWT0ke3RoaXMuc2VxdWVsaXplLmVzY2FwZShcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2VxdWVsaXplLmNvbmZpZy5wYXNzd29yZFxuICAgICAgICAgICAgICAgICl9O2AsXG4gICAgICAgICAgICAgICAgYXJnczogW11cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgKCkgPT4ge31cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zZXF1ZWxpemUub3B0aW9ucy5mb3JlaWduS2V5cyAhPT0gZmFsc2UpIHtcbiAgICAgICAgLy8gTWFrZSBpdCBwb3NzaWJsZSB0byBkZWZpbmUgYW5kIHVzZSBmb3JlaWduIGtleSBjb25zdHJhaW50cyB1bmxlc3NcbiAgICAgICAgLy8gZXhwbGljaXRseSBkaXNhbGxvd2VkLiBJdCdzIHN0aWxsIG9wdC1pbiBwZXIgcmVsYXRpb25cbiAgICAgICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5leGVjKSB7XG4gICAgICAgICAgY29ubmVjdGlvbi5leGVjKFxuICAgICAgICAgICAgW3sgc3FsOiBcIlBSQUdNQSBGT1JFSUdOX0tFWVM9T05cIiwgYXJnczogW10gfV0sXG4gICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICgpID0+IHt9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVsZWFzZUNvbm5lY3Rpb24oY29ubmVjdGlvbiwgZm9yY2UpIHtcbiAgICBpZiAoZm9yY2UgIT09IHRydWUpIHJldHVybjtcblxuICAgIGlmIChjb25uZWN0aW9uLnV1aWQpIHtcbiAgICAgIGNvbm5lY3Rpb24uY2xvc2UgJiYgY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgICAgdGhpcy5jb25uID0gdW5kZWZpbmVkO1xuICAgICAgZGVidWcoYGNvbm5lY3Rpb24gcmVsZWFzZWQgJHtjb25uZWN0aW9uLnV1aWR9YCk7XG4gICAgICBkZWxldGUgdGhpcy5jb25uZWN0aW9uc1tjb25uZWN0aW9uLnV1aWRdO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3Rpb25NYW5hZ2VyO1xubW9kdWxlLmV4cG9ydHMuQ29ubmVjdGlvbk1hbmFnZXIgPSBDb25uZWN0aW9uTWFuYWdlcjtcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBDb25uZWN0aW9uTWFuYWdlcjtcbiJdfQ==