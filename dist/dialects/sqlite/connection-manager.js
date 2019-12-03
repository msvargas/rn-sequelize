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

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ConnectionManager).call(this, dialect, sequelize));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvY29ubmVjdGlvbi1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbIkFic3RyYWN0Q29ubmVjdGlvbk1hbmFnZXIiLCJyZXF1aXJlIiwiUHJvbWlzZSIsImxvZ2dlciIsImRlYnVnIiwiZGVidWdDb250ZXh0IiwiZGF0YVR5cGVzIiwic3FsaXRlIiwic2VxdWVsaXplRXJyb3JzIiwicGFyc2VyU3RvcmUiLCJDb25uZWN0aW9uTWFuYWdlciIsImRpYWxlY3QiLCJzZXF1ZWxpemUiLCJjb25uZWN0aW9ucyIsIm9wZW5EYXRhYmFzZSIsIl9sb2FkRGlhbGVjdE1vZHVsZSIsIm9wdGlvbnMiLCJkYXRhYmFzZSIsImRpYWxlY3RPcHRpb25zIiwidmVyc2lvbiIsImRlc2NyaXB0aW9uIiwic2l6ZSIsImNvbm4iLCJyZWZyZXNoVHlwZVBhcnNlciIsInByb21pc2VzIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsIm1hcCIsImNvbm5lY3Rpb24iLCJmcm9tQ2FsbGJhY2siLCJjYWxsYmFjayIsImNsb3NlIiwiYWxsIiwidGhlbiIsImJpbmQiLCJkYXRhVHlwZSIsInJlZnJlc2giLCJjbGVhciIsInV1aWQiLCJyZXNvbHZlIiwicmVqZWN0IiwiQ29ubmVjdGlvbkVycm9yIiwiRXJyb3IiLCJ0YXAiLCJjb25maWciLCJwYXNzd29yZCIsImV4ZWMiLCJzcWwiLCJlc2NhcGUiLCJhcmdzIiwiZm9yZWlnbktleXMiLCJmb3JjZSIsInVuZGVmaW5lZCIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLHlCQUF5QixHQUFHQyxPQUFPLENBQUMsZ0NBQUQsQ0FBekM7O0FBQ0EsTUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUMsZUFBRCxDQUF2Qjs7QUFDQSxNQUFNO0FBQUVFLEVBQUFBO0FBQUYsSUFBYUYsT0FBTyxDQUFDLG9CQUFELENBQTFCOztBQUNBLE1BQU1HLEtBQUssR0FBR0QsTUFBTSxDQUFDRSxZQUFQLENBQW9CLG1CQUFwQixDQUFkOztBQUNBLE1BQU1DLFNBQVMsR0FBR0wsT0FBTyxDQUFDLGtCQUFELENBQVAsQ0FBNEJNLE1BQTlDOztBQUNBLE1BQU1DLGVBQWUsR0FBR1AsT0FBTyxDQUFDLGNBQUQsQ0FBL0I7O0FBQ0EsTUFBTVEsV0FBVyxHQUFHUixPQUFPLENBQUMsZ0JBQUQsQ0FBUCxDQUEwQixRQUExQixDQUFwQjs7SUFFTVMsaUI7Ozs7O0FBQ0osNkJBQVlDLE9BQVosRUFBcUJDLFNBQXJCLEVBQWdDO0FBQUE7O0FBQUE7O0FBQzlCLDJGQUFNRCxPQUFOLEVBQWVDLFNBQWY7QUFFQSxVQUFLQyxXQUFMLEdBQW1CLEVBQW5COztBQUNBLFVBQU07QUFBRUMsTUFBQUE7QUFBRixRQUFtQixNQUFLQyxrQkFBTCxFQUF6Qjs7QUFDQSxVQUFLRCxZQUFMLEdBQW9CLE1BQ2xCQSxZQUFZLENBQ1YsTUFBS0YsU0FBTCxDQUFlSSxPQUFmLENBQXVCQyxRQURiLEVBRVYsTUFBS0wsU0FBTCxDQUFlSSxPQUFmLENBQXVCRSxjQUF2QixDQUFzQ0MsT0FBdEMsSUFBaUQsS0FGdkMsRUFHVixNQUFLUCxTQUFMLENBQWVJLE9BQWYsQ0FBdUJFLGNBQXZCLENBQXNDRSxXQUF0QyxJQUNFLE1BQUtSLFNBQUwsQ0FBZUksT0FBZixDQUF1QkMsUUFKZixFQUtWLE1BQUtMLFNBQUwsQ0FBZUksT0FBZixDQUF1QkUsY0FBdkIsQ0FBc0NHLElBQXRDLElBQThDLElBQUksSUFBSixHQUFXLElBTC9DLENBRGQ7O0FBUUEsVUFBS0MsSUFBTCxHQUFZLE1BQUtSLFlBQUwsRUFBWjs7QUFDQSxVQUFLUyxpQkFBTCxDQUF1QmpCLFNBQXZCOztBQWQ4QjtBQWUvQjs7OztxQ0FFZ0I7QUFDZixZQUFNa0IsUUFBUSxHQUFHQyxNQUFNLENBQUNDLG1CQUFQLENBQ2YsS0FBS2IsV0FEVSxFQUVmYyxHQUZlLENBRVhDLFVBQVUsSUFDZDFCLE9BQU8sQ0FBQzJCLFlBQVIsQ0FBcUJDLFFBQVEsSUFDM0IsS0FBS2pCLFdBQUwsQ0FBaUJlLFVBQWpCLEVBQTZCRyxLQUE3QixDQUFtQ0QsUUFBbkMsQ0FERixDQUhlLENBQWpCO0FBUUEsYUFBTzVCLE9BQU8sQ0FBQzhCLEdBQVIsQ0FBWVIsUUFBWixFQUFzQlMsSUFBdEIsQ0FBMkIsMkVBQXFCQyxJQUFyQixDQUEwQixJQUExQixDQUEzQixDQUFQO0FBQ0QsSyxDQUVEOzs7O3VDQUNtQkMsUSxFQUFVO0FBQzNCMUIsTUFBQUEsV0FBVyxDQUFDMkIsT0FBWixDQUFvQkQsUUFBcEI7QUFDRDs7O3VDQUVrQjtBQUNqQjFCLE1BQUFBLFdBQVcsQ0FBQzRCLEtBQVo7QUFDRDs7O2tDQUVhckIsTyxFQUFTO0FBQ3JCQSxNQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjtBQUNBQSxNQUFBQSxPQUFPLENBQUNzQixJQUFSLEdBQWV0QixPQUFPLENBQUNzQixJQUFSLElBQWdCLFNBQS9COztBQUVBLFVBQUksS0FBS3pCLFdBQUwsQ0FBaUJHLE9BQU8sQ0FBQ3NCLElBQXpCLENBQUosRUFBb0M7QUFDbEMsZUFBT3BDLE9BQU8sQ0FBQ3FDLE9BQVIsQ0FBZ0IsS0FBSzFCLFdBQUwsQ0FBaUJHLE9BQU8sQ0FBQ3NCLElBQXpCLENBQWhCLENBQVA7QUFDRDs7QUFFRCxhQUFPLElBQUlwQyxPQUFKLENBQVksQ0FBQ3FDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUN0QyxhQUFLM0IsV0FBTCxDQUFpQkcsT0FBTyxDQUFDc0IsSUFBekIsSUFBaUMsQ0FBQyxLQUFLaEIsSUFBTixHQUM3QixLQUFLUixZQUFMLEVBRDZCLEdBRTdCLEtBQUtRLElBRlQ7QUFHQWxCLFFBQUFBLEtBQUssQ0FBRSx1QkFBc0JZLE9BQU8sQ0FBQ3NCLElBQUssRUFBckMsQ0FBTDtBQUNBLFlBQUksQ0FBQyxLQUFLekIsV0FBTCxDQUFpQkcsT0FBTyxDQUFDc0IsSUFBekIsQ0FBTCxFQUNFLE9BQU9FLE1BQU0sQ0FDWCxJQUFJaEMsZUFBZSxDQUFDaUMsZUFBcEIsQ0FDRSxJQUFJQyxLQUFKLENBQVUsOEJBQVYsQ0FERixDQURXLENBQWI7QUFLRkgsUUFBQUEsT0FBTyxDQUFDLEtBQUsxQixXQUFMLENBQWlCRyxPQUFPLENBQUNzQixJQUF6QixDQUFELENBQVA7QUFDRCxPQVpNLEVBWUpLLEdBWkksQ0FZQWYsVUFBVSxJQUFJO0FBQ25CLFlBQUksS0FBS2hCLFNBQUwsQ0FBZWdDLE1BQWYsQ0FBc0JDLFFBQTFCLEVBQW9DO0FBQ2xDO0FBQ0EsY0FBSWpCLFVBQVUsSUFBSUEsVUFBVSxDQUFDa0IsSUFBN0IsRUFBbUM7QUFDakNsQixZQUFBQSxVQUFVLENBQUNrQixJQUFYLENBQ0UsQ0FDRTtBQUNFQyxjQUFBQSxHQUFHLEVBQUcsY0FBYSxLQUFLbkMsU0FBTCxDQUFlb0MsTUFBZixDQUNqQixLQUFLcEMsU0FBTCxDQUFlZ0MsTUFBZixDQUFzQkMsUUFETCxDQUVqQixHQUhKO0FBSUVJLGNBQUFBLElBQUksRUFBRTtBQUpSLGFBREYsQ0FERixFQVNFLEtBVEYsRUFVRSxNQUFNLENBQUUsQ0FWVjtBQVlEO0FBQ0Y7O0FBQ0QsWUFBSSxLQUFLckMsU0FBTCxDQUFlSSxPQUFmLENBQXVCa0MsV0FBdkIsS0FBdUMsS0FBM0MsRUFBa0Q7QUFDaEQ7QUFDQTtBQUNBLGNBQUl0QixVQUFVLElBQUlBLFVBQVUsQ0FBQ2tCLElBQTdCLEVBQW1DO0FBQ2pDbEIsWUFBQUEsVUFBVSxDQUFDa0IsSUFBWCxDQUNFLENBQUM7QUFBRUMsY0FBQUEsR0FBRyxFQUFFLHdCQUFQO0FBQWlDRSxjQUFBQSxJQUFJLEVBQUU7QUFBdkMsYUFBRCxDQURGLEVBRUUsS0FGRixFQUdFLE1BQU0sQ0FBRSxDQUhWO0FBS0Q7QUFDRjtBQUNGLE9BekNNLENBQVA7QUEwQ0Q7OztzQ0FFaUJyQixVLEVBQVl1QixLLEVBQU87QUFDbkMsVUFBSUEsS0FBSyxLQUFLLElBQWQsRUFBb0I7O0FBRXBCLFVBQUl2QixVQUFVLENBQUNVLElBQWYsRUFBcUI7QUFDbkJWLFFBQUFBLFVBQVUsQ0FBQ0csS0FBWCxJQUFvQkgsVUFBVSxDQUFDRyxLQUFYLEVBQXBCO0FBQ0EsYUFBS1QsSUFBTCxHQUFZOEIsU0FBWjtBQUNBaEQsUUFBQUEsS0FBSyxDQUFFLHVCQUFzQndCLFVBQVUsQ0FBQ1UsSUFBSyxFQUF4QyxDQUFMO0FBQ0EsZUFBTyxLQUFLekIsV0FBTCxDQUFpQmUsVUFBVSxDQUFDVSxJQUE1QixDQUFQO0FBQ0Q7QUFDRjs7OztFQXBHNkJ0Qyx5Qjs7QUF1R2hDcUQsTUFBTSxDQUFDQyxPQUFQLEdBQWlCNUMsaUJBQWpCO0FBQ0EyQyxNQUFNLENBQUNDLE9BQVAsQ0FBZTVDLGlCQUFmLEdBQW1DQSxpQkFBbkM7QUFDQTJDLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxPQUFmLEdBQXlCN0MsaUJBQXpCIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5jb25zdCBBYnN0cmFjdENvbm5lY3Rpb25NYW5hZ2VyID0gcmVxdWlyZShcIi4uL2Fic3RyYWN0L2Nvbm5lY3Rpb24tbWFuYWdlclwiKTtcclxuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoXCIuLi8uLi9wcm9taXNlXCIpO1xyXG5jb25zdCB7IGxvZ2dlciB9ID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL2xvZ2dlclwiKTtcclxuY29uc3QgZGVidWcgPSBsb2dnZXIuZGVidWdDb250ZXh0KFwiY29ubmVjdGlvbjpzcWxpdGVcIik7XHJcbmNvbnN0IGRhdGFUeXBlcyA9IHJlcXVpcmUoXCIuLi8uLi9kYXRhLXR5cGVzXCIpLnNxbGl0ZTtcclxuY29uc3Qgc2VxdWVsaXplRXJyb3JzID0gcmVxdWlyZShcIi4uLy4uL2Vycm9yc1wiKTtcclxuY29uc3QgcGFyc2VyU3RvcmUgPSByZXF1aXJlKFwiLi4vcGFyc2VyU3RvcmVcIikoXCJzcWxpdGVcIik7XHJcblxyXG5jbGFzcyBDb25uZWN0aW9uTWFuYWdlciBleHRlbmRzIEFic3RyYWN0Q29ubmVjdGlvbk1hbmFnZXIge1xyXG4gIGNvbnN0cnVjdG9yKGRpYWxlY3QsIHNlcXVlbGl6ZSkge1xyXG4gICAgc3VwZXIoZGlhbGVjdCwgc2VxdWVsaXplKTtcclxuXHJcbiAgICB0aGlzLmNvbm5lY3Rpb25zID0ge307XHJcbiAgICBjb25zdCB7IG9wZW5EYXRhYmFzZSB9ID0gdGhpcy5fbG9hZERpYWxlY3RNb2R1bGUoKTtcclxuICAgIHRoaXMub3BlbkRhdGFiYXNlID0gKCkgPT5cclxuICAgICAgb3BlbkRhdGFiYXNlKFxyXG4gICAgICAgIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGF0YWJhc2UsXHJcbiAgICAgICAgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0T3B0aW9ucy52ZXJzaW9uIHx8IFwiMS4wXCIsXHJcbiAgICAgICAgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0T3B0aW9ucy5kZXNjcmlwdGlvbiB8fFxyXG4gICAgICAgICAgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kYXRhYmFzZSxcclxuICAgICAgICB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3RPcHRpb25zLnNpemUgfHwgNCAqIDEwMjQgKiAxMDI0XHJcbiAgICAgICk7XHJcbiAgICB0aGlzLmNvbm4gPSB0aGlzLm9wZW5EYXRhYmFzZSgpO1xyXG4gICAgdGhpcy5yZWZyZXNoVHlwZVBhcnNlcihkYXRhVHlwZXMpO1xyXG4gIH1cclxuXHJcbiAgX29uUHJvY2Vzc0V4aXQoKSB7XHJcbiAgICBjb25zdCBwcm9taXNlcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKFxyXG4gICAgICB0aGlzLmNvbm5lY3Rpb25zXHJcbiAgICApLm1hcChjb25uZWN0aW9uID0+XHJcbiAgICAgIFByb21pc2UuZnJvbUNhbGxiYWNrKGNhbGxiYWNrID0+XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uc1tjb25uZWN0aW9uXS5jbG9zZShjYWxsYmFjaylcclxuICAgICAgKVxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oc3VwZXIuX29uUHJvY2Vzc0V4aXQuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG5cclxuICAvLyBFeHBvc2UgdGhpcyBhcyBhIG1ldGhvZCBzbyB0aGF0IHRoZSBwYXJzaW5nIG1heSBiZSB1cGRhdGVkIHdoZW4gdGhlIHVzZXIgaGFzIGFkZGVkIGFkZGl0aW9uYWwsIGN1c3RvbSB0eXBlc1xyXG4gIF9yZWZyZXNoVHlwZVBhcnNlcihkYXRhVHlwZSkge1xyXG4gICAgcGFyc2VyU3RvcmUucmVmcmVzaChkYXRhVHlwZSk7XHJcbiAgfVxyXG5cclxuICBfY2xlYXJUeXBlUGFyc2VyKCkge1xyXG4gICAgcGFyc2VyU3RvcmUuY2xlYXIoKTtcclxuICB9XHJcblxyXG4gIGdldENvbm5lY3Rpb24ob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBvcHRpb25zLnV1aWQgPSBvcHRpb25zLnV1aWQgfHwgXCJkZWZhdWx0XCI7XHJcblxyXG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbnNbb3B0aW9ucy51dWlkXSkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuY29ubmVjdGlvbnNbb3B0aW9ucy51dWlkXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5jb25uZWN0aW9uc1tvcHRpb25zLnV1aWRdID0gIXRoaXMuY29ublxyXG4gICAgICAgID8gdGhpcy5vcGVuRGF0YWJhc2UoKVxyXG4gICAgICAgIDogdGhpcy5jb25uO1xyXG4gICAgICBkZWJ1ZyhgY29ubmVjdGlvbiBhY3F1aXJlZCAke29wdGlvbnMudXVpZH1gKTtcclxuICAgICAgaWYgKCF0aGlzLmNvbm5lY3Rpb25zW29wdGlvbnMudXVpZF0pXHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChcclxuICAgICAgICAgIG5ldyBzZXF1ZWxpemVFcnJvcnMuQ29ubmVjdGlvbkVycm9yKFxyXG4gICAgICAgICAgICBuZXcgRXJyb3IoXCJEYXRhYmFzZSByZWZlcmVuY2Ugbm8gZm91bmQhXCIpXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgcmVzb2x2ZSh0aGlzLmNvbm5lY3Rpb25zW29wdGlvbnMudXVpZF0pO1xyXG4gICAgfSkudGFwKGNvbm5lY3Rpb24gPT4ge1xyXG4gICAgICBpZiAodGhpcy5zZXF1ZWxpemUuY29uZmlnLnBhc3N3b3JkKSB7XHJcbiAgICAgICAgLy8gTWFrZSBpdCBwb3NzaWJsZSB0byBkZWZpbmUgYW5kIHVzZSBwYXNzd29yZCBmb3Igc3FsaXRlIGVuY3J5cHRpb24gcGx1Z2luIGxpa2Ugc3FsY2lwaGVyXHJcbiAgICAgICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5leGVjKSB7XHJcbiAgICAgICAgICBjb25uZWN0aW9uLmV4ZWMoXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzcWw6IGBQUkFHTUEgS0VZPSR7dGhpcy5zZXF1ZWxpemUuZXNjYXBlKFxyXG4gICAgICAgICAgICAgICAgICB0aGlzLnNlcXVlbGl6ZS5jb25maWcucGFzc3dvcmRcclxuICAgICAgICAgICAgICAgICl9O2AsXHJcbiAgICAgICAgICAgICAgICBhcmdzOiBbXVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICgpID0+IHt9XHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5zZXF1ZWxpemUub3B0aW9ucy5mb3JlaWduS2V5cyAhPT0gZmFsc2UpIHtcclxuICAgICAgICAvLyBNYWtlIGl0IHBvc3NpYmxlIHRvIGRlZmluZSBhbmQgdXNlIGZvcmVpZ24ga2V5IGNvbnN0cmFpbnRzIHVubGVzc1xyXG4gICAgICAgIC8vIGV4cGxpY2l0bHkgZGlzYWxsb3dlZC4gSXQncyBzdGlsbCBvcHQtaW4gcGVyIHJlbGF0aW9uXHJcbiAgICAgICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5leGVjKSB7XHJcbiAgICAgICAgICBjb25uZWN0aW9uLmV4ZWMoXHJcbiAgICAgICAgICAgIFt7IHNxbDogXCJQUkFHTUEgRk9SRUlHTl9LRVlTPU9OXCIsIGFyZ3M6IFtdIH1dLFxyXG4gICAgICAgICAgICBmYWxzZSxcclxuICAgICAgICAgICAgKCkgPT4ge31cclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJlbGVhc2VDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGZvcmNlKSB7XHJcbiAgICBpZiAoZm9yY2UgIT09IHRydWUpIHJldHVybjtcclxuXHJcbiAgICBpZiAoY29ubmVjdGlvbi51dWlkKSB7XHJcbiAgICAgIGNvbm5lY3Rpb24uY2xvc2UgJiYgY29ubmVjdGlvbi5jbG9zZSgpO1xyXG4gICAgICB0aGlzLmNvbm4gPSB1bmRlZmluZWQ7XHJcbiAgICAgIGRlYnVnKGBjb25uZWN0aW9uIHJlbGVhc2VkICR7Y29ubmVjdGlvbi51dWlkfWApO1xyXG4gICAgICBkZWxldGUgdGhpcy5jb25uZWN0aW9uc1tjb25uZWN0aW9uLnV1aWRdO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0aW9uTWFuYWdlcjtcclxubW9kdWxlLmV4cG9ydHMuQ29ubmVjdGlvbk1hbmFnZXIgPSBDb25uZWN0aW9uTWFuYWdlcjtcclxubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IENvbm5lY3Rpb25NYW5hZ2VyO1xyXG4iXX0=