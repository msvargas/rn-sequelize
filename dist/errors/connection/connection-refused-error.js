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
 * Thrown when a connection to a database is refused
 */


let ConnectionRefusedError = /*#__PURE__*/function (_ConnectionError) {
  _inherits(ConnectionRefusedError, _ConnectionError);

  var _super = _createSuper(ConnectionRefusedError);

  function ConnectionRefusedError(parent) {
    var _this;

    _classCallCheck(this, ConnectionRefusedError);

    _this = _super.call(this, parent);
    _this.name = 'SequelizeConnectionRefusedError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return ConnectionRefusedError;
}(ConnectionError);

module.exports = ConnectionRefusedError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi9jb25uZWN0aW9uLXJlZnVzZWQtZXJyb3IuanMiXSwibmFtZXMiOlsiQ29ubmVjdGlvbkVycm9yIiwicmVxdWlyZSIsIkNvbm5lY3Rpb25SZWZ1c2VkRXJyb3IiLCJwYXJlbnQiLCJuYW1lIiwiRXJyb3IiLCJjYXB0dXJlU3RhY2tUcmFjZSIsImNvbnN0cnVjdG9yIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLGVBQWUsR0FBR0MsT0FBTyxDQUFDLHVCQUFELENBQS9CO0FBRUE7QUFDQTtBQUNBOzs7SUFDTUMsc0I7Ozs7O0FBQ0osa0NBQVlDLE1BQVosRUFBb0I7QUFBQTs7QUFBQTs7QUFDbEIsOEJBQU1BLE1BQU47QUFDQSxVQUFLQyxJQUFMLEdBQVksaUNBQVo7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFIa0I7QUFJbkI7OztFQUxrQ1AsZTs7QUFRckNRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsc0JBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBDb25uZWN0aW9uRXJyb3IgPSByZXF1aXJlKCcuLy4uL2Nvbm5lY3Rpb24tZXJyb3InKTtcblxuLyoqXG4gKiBUaHJvd24gd2hlbiBhIGNvbm5lY3Rpb24gdG8gYSBkYXRhYmFzZSBpcyByZWZ1c2VkXG4gKi9cbmNsYXNzIENvbm5lY3Rpb25SZWZ1c2VkRXJyb3IgZXh0ZW5kcyBDb25uZWN0aW9uRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihwYXJlbnQpIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVDb25uZWN0aW9uUmVmdXNlZEVycm9yJztcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3Rpb25SZWZ1c2VkRXJyb3I7XG4iXX0=