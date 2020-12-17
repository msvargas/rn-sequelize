'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

const ConnectionError = require('./../connection-error');
/**
 * Thrown when a connection to a database has a hostname that was not found
 */


let HostNotFoundError = /*#__PURE__*/function (_ConnectionError) {
  _inherits(HostNotFoundError, _ConnectionError);

  var _super = _createSuper(HostNotFoundError);

  function HostNotFoundError(parent) {
    var _this;

    _classCallCheck(this, HostNotFoundError);

    _this = _super.call(this, parent);
    _this.name = 'SequelizeHostNotFoundError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return HostNotFoundError;
}(ConnectionError);

module.exports = HostNotFoundError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi9ob3N0LW5vdC1mb3VuZC1lcnJvci5qcyJdLCJuYW1lcyI6WyJDb25uZWN0aW9uRXJyb3IiLCJyZXF1aXJlIiwiSG9zdE5vdEZvdW5kRXJyb3IiLCJwYXJlbnQiLCJuYW1lIiwiRXJyb3IiLCJjYXB0dXJlU3RhY2tUcmFjZSIsImNvbnN0cnVjdG9yIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLGVBQWUsR0FBR0MsT0FBTyxDQUFDLHVCQUFELENBQS9CO0FBRUE7QUFDQTtBQUNBOzs7SUFDTUMsaUI7Ozs7O0FBQ0osNkJBQVlDLE1BQVosRUFBb0I7QUFBQTs7QUFBQTs7QUFDbEIsOEJBQU1BLE1BQU47QUFDQSxVQUFLQyxJQUFMLEdBQVksNEJBQVo7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFIa0I7QUFJbkI7OztFQUw2QlAsZTs7QUFRaENRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsaUJBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBDb25uZWN0aW9uRXJyb3IgPSByZXF1aXJlKCcuLy4uL2Nvbm5lY3Rpb24tZXJyb3InKTtcblxuLyoqXG4gKiBUaHJvd24gd2hlbiBhIGNvbm5lY3Rpb24gdG8gYSBkYXRhYmFzZSBoYXMgYSBob3N0bmFtZSB0aGF0IHdhcyBub3QgZm91bmRcbiAqL1xuY2xhc3MgSG9zdE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBDb25uZWN0aW9uRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihwYXJlbnQpIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVIb3N0Tm90Rm91bmRFcnJvcic7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIb3N0Tm90Rm91bmRFcnJvcjtcbiJdfQ==