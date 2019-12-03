'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const ConnectionError = require('./../connection-error');
/**
 * Thrown when a connection to a database is refused due to insufficient privileges
 */


let AccessDeniedError =
/*#__PURE__*/
function (_ConnectionError) {
  _inherits(AccessDeniedError, _ConnectionError);

  function AccessDeniedError(parent) {
    var _this;

    _classCallCheck(this, AccessDeniedError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(AccessDeniedError).call(this, parent));
    _this.name = 'SequelizeAccessDeniedError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return AccessDeniedError;
}(ConnectionError);

module.exports = AccessDeniedError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi9hY2Nlc3MtZGVuaWVkLWVycm9yLmpzIl0sIm5hbWVzIjpbIkNvbm5lY3Rpb25FcnJvciIsInJlcXVpcmUiLCJBY2Nlc3NEZW5pZWRFcnJvciIsInBhcmVudCIsIm5hbWUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxlQUFlLEdBQUdDLE9BQU8sQ0FBQyx1QkFBRCxDQUEvQjtBQUVBOzs7OztJQUdNQyxpQjs7Ozs7QUFDSiw2QkFBWUMsTUFBWixFQUFvQjtBQUFBOztBQUFBOztBQUNsQiwyRkFBTUEsTUFBTjtBQUNBLFVBQUtDLElBQUwsR0FBWSw0QkFBWjtBQUNBQyxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQUhrQjtBQUluQjs7O0VBTDZCUCxlOztBQVFoQ1EsTUFBTSxDQUFDQyxPQUFQLEdBQWlCUCxpQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBDb25uZWN0aW9uRXJyb3IgPSByZXF1aXJlKCcuLy4uL2Nvbm5lY3Rpb24tZXJyb3InKTtcclxuXHJcbi8qKlxyXG4gKiBUaHJvd24gd2hlbiBhIGNvbm5lY3Rpb24gdG8gYSBkYXRhYmFzZSBpcyByZWZ1c2VkIGR1ZSB0byBpbnN1ZmZpY2llbnQgcHJpdmlsZWdlc1xyXG4gKi9cclxuY2xhc3MgQWNjZXNzRGVuaWVkRXJyb3IgZXh0ZW5kcyBDb25uZWN0aW9uRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKHBhcmVudCkge1xyXG4gICAgc3VwZXIocGFyZW50KTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVBY2Nlc3NEZW5pZWRFcnJvcic7XHJcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWNjZXNzRGVuaWVkRXJyb3I7XHJcbiJdfQ==