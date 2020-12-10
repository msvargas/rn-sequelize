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
 * Thrown when connection is not acquired due to timeout
 */


let ConnectionAcquireTimeoutError = /*#__PURE__*/function (_ConnectionError) {
  _inherits(ConnectionAcquireTimeoutError, _ConnectionError);

  var _super = _createSuper(ConnectionAcquireTimeoutError);

  function ConnectionAcquireTimeoutError(parent) {
    var _this;

    _classCallCheck(this, ConnectionAcquireTimeoutError);

    _this = _super.call(this, parent);
    _this.name = 'SequelizeConnectionAcquireTimeoutError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return ConnectionAcquireTimeoutError;
}(ConnectionError);

module.exports = ConnectionAcquireTimeoutError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi9jb25uZWN0aW9uLWFjcXVpcmUtdGltZW91dC1lcnJvci5qcyJdLCJuYW1lcyI6WyJDb25uZWN0aW9uRXJyb3IiLCJyZXF1aXJlIiwiQ29ubmVjdGlvbkFjcXVpcmVUaW1lb3V0RXJyb3IiLCJwYXJlbnQiLCJuYW1lIiwiRXJyb3IiLCJjYXB0dXJlU3RhY2tUcmFjZSIsImNvbnN0cnVjdG9yIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLGVBQWUsR0FBR0MsT0FBTyxDQUFDLHVCQUFELENBQS9CO0FBRUE7QUFDQTtBQUNBOzs7SUFDTUMsNkI7Ozs7O0FBQ0oseUNBQVlDLE1BQVosRUFBb0I7QUFBQTs7QUFBQTs7QUFDbEIsOEJBQU1BLE1BQU47QUFDQSxVQUFLQyxJQUFMLEdBQVksd0NBQVo7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFIa0I7QUFJbkI7OztFQUx5Q1AsZTs7QUFRNUNRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsNkJBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBDb25uZWN0aW9uRXJyb3IgPSByZXF1aXJlKCcuLy4uL2Nvbm5lY3Rpb24tZXJyb3InKTtcblxuLyoqXG4gKiBUaHJvd24gd2hlbiBjb25uZWN0aW9uIGlzIG5vdCBhY3F1aXJlZCBkdWUgdG8gdGltZW91dFxuICovXG5jbGFzcyBDb25uZWN0aW9uQWNxdWlyZVRpbWVvdXRFcnJvciBleHRlbmRzIENvbm5lY3Rpb25FcnJvciB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudCkge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5uYW1lID0gJ1NlcXVlbGl6ZUNvbm5lY3Rpb25BY3F1aXJlVGltZW91dEVycm9yJztcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3Rpb25BY3F1aXJlVGltZW91dEVycm9yO1xuIl19