'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const ConnectionError = require('./../connection-error');
/**
 * Thrown when a connection to a database times out
 */


let ConnectionTimedOutError =
/*#__PURE__*/
function (_ConnectionError) {
  _inherits(ConnectionTimedOutError, _ConnectionError);

  function ConnectionTimedOutError(parent) {
    var _this;

    _classCallCheck(this, ConnectionTimedOutError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ConnectionTimedOutError).call(this, parent));
    _this.name = 'SequelizeConnectionTimedOutError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return ConnectionTimedOutError;
}(ConnectionError);

module.exports = ConnectionTimedOutError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi9jb25uZWN0aW9uLXRpbWVkLW91dC1lcnJvci5qcyJdLCJuYW1lcyI6WyJDb25uZWN0aW9uRXJyb3IiLCJyZXF1aXJlIiwiQ29ubmVjdGlvblRpbWVkT3V0RXJyb3IiLCJwYXJlbnQiLCJuYW1lIiwiRXJyb3IiLCJjYXB0dXJlU3RhY2tUcmFjZSIsImNvbnN0cnVjdG9yIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsZUFBZSxHQUFHQyxPQUFPLENBQUMsdUJBQUQsQ0FBL0I7QUFFQTs7Ozs7SUFHTUMsdUI7Ozs7O0FBQ0osbUNBQVlDLE1BQVosRUFBb0I7QUFBQTs7QUFBQTs7QUFDbEIsaUdBQU1BLE1BQU47QUFDQSxVQUFLQyxJQUFMLEdBQVksa0NBQVo7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFIa0I7QUFJbkI7OztFQUxtQ1AsZTs7QUFRdENRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsdUJBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgQ29ubmVjdGlvbkVycm9yID0gcmVxdWlyZSgnLi8uLi9jb25uZWN0aW9uLWVycm9yJyk7XHJcblxyXG4vKipcclxuICogVGhyb3duIHdoZW4gYSBjb25uZWN0aW9uIHRvIGEgZGF0YWJhc2UgdGltZXMgb3V0XHJcbiAqL1xyXG5jbGFzcyBDb25uZWN0aW9uVGltZWRPdXRFcnJvciBleHRlbmRzIENvbm5lY3Rpb25FcnJvciB7XHJcbiAgY29uc3RydWN0b3IocGFyZW50KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5uYW1lID0gJ1NlcXVlbGl6ZUNvbm5lY3Rpb25UaW1lZE91dEVycm9yJztcclxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0aW9uVGltZWRPdXRFcnJvcjtcclxuIl19