'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const ConnectionError = require('./../connection-error');
/**
 * Thrown when connection is not acquired due to timeout
 */


let ConnectionAcquireTimeoutError =
/*#__PURE__*/
function (_ConnectionError) {
  _inherits(ConnectionAcquireTimeoutError, _ConnectionError);

  function ConnectionAcquireTimeoutError(parent) {
    var _this;

    _classCallCheck(this, ConnectionAcquireTimeoutError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ConnectionAcquireTimeoutError).call(this, parent));
    _this.name = 'SequelizeConnectionAcquireTimeoutError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return ConnectionAcquireTimeoutError;
}(ConnectionError);

module.exports = ConnectionAcquireTimeoutError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi9jb25uZWN0aW9uLWFjcXVpcmUtdGltZW91dC1lcnJvci5qcyJdLCJuYW1lcyI6WyJDb25uZWN0aW9uRXJyb3IiLCJyZXF1aXJlIiwiQ29ubmVjdGlvbkFjcXVpcmVUaW1lb3V0RXJyb3IiLCJwYXJlbnQiLCJuYW1lIiwiRXJyb3IiLCJjYXB0dXJlU3RhY2tUcmFjZSIsImNvbnN0cnVjdG9yIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsZUFBZSxHQUFHQyxPQUFPLENBQUMsdUJBQUQsQ0FBL0I7QUFFQTs7Ozs7SUFHTUMsNkI7Ozs7O0FBQ0oseUNBQVlDLE1BQVosRUFBb0I7QUFBQTs7QUFBQTs7QUFDbEIsdUdBQU1BLE1BQU47QUFDQSxVQUFLQyxJQUFMLEdBQVksd0NBQVo7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFIa0I7QUFJbkI7OztFQUx5Q1AsZTs7QUFRNUNRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsNkJBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgQ29ubmVjdGlvbkVycm9yID0gcmVxdWlyZSgnLi8uLi9jb25uZWN0aW9uLWVycm9yJyk7XHJcblxyXG4vKipcclxuICogVGhyb3duIHdoZW4gY29ubmVjdGlvbiBpcyBub3QgYWNxdWlyZWQgZHVlIHRvIHRpbWVvdXRcclxuICovXHJcbmNsYXNzIENvbm5lY3Rpb25BY3F1aXJlVGltZW91dEVycm9yIGV4dGVuZHMgQ29ubmVjdGlvbkVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihwYXJlbnQpIHtcclxuICAgIHN1cGVyKHBhcmVudCk7XHJcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplQ29ubmVjdGlvbkFjcXVpcmVUaW1lb3V0RXJyb3InO1xyXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3Rpb25BY3F1aXJlVGltZW91dEVycm9yO1xyXG4iXX0=