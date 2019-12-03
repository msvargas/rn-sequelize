'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const DatabaseError = require('./../database-error');
/**
 * Thrown when a database query times out because of a deadlock
 */


let TimeoutError =
/*#__PURE__*/
function (_DatabaseError) {
  _inherits(TimeoutError, _DatabaseError);

  function TimeoutError(parent) {
    var _this;

    _classCallCheck(this, TimeoutError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(TimeoutError).call(this, parent));
    _this.name = 'SequelizeTimeoutError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return TimeoutError;
}(DatabaseError);

module.exports = TimeoutError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UvdGltZW91dC1lcnJvci5qcyJdLCJuYW1lcyI6WyJEYXRhYmFzZUVycm9yIiwicmVxdWlyZSIsIlRpbWVvdXRFcnJvciIsInBhcmVudCIsIm5hbWUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxhQUFhLEdBQUdDLE9BQU8sQ0FBQyxxQkFBRCxDQUE3QjtBQUVBOzs7OztJQUdNQyxZOzs7OztBQUNKLHdCQUFZQyxNQUFaLEVBQW9CO0FBQUE7O0FBQUE7O0FBQ2xCLHNGQUFNQSxNQUFOO0FBQ0EsVUFBS0MsSUFBTCxHQUFZLHVCQUFaO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBSGtCO0FBSW5COzs7RUFMd0JQLGE7O0FBUTNCUSxNQUFNLENBQUNDLE9BQVAsR0FBaUJQLFlBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgRGF0YWJhc2VFcnJvciA9IHJlcXVpcmUoJy4vLi4vZGF0YWJhc2UtZXJyb3InKTtcclxuXHJcbi8qKlxyXG4gKiBUaHJvd24gd2hlbiBhIGRhdGFiYXNlIHF1ZXJ5IHRpbWVzIG91dCBiZWNhdXNlIG9mIGEgZGVhZGxvY2tcclxuICovXHJcbmNsYXNzIFRpbWVvdXRFcnJvciBleHRlbmRzIERhdGFiYXNlRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKHBhcmVudCkge1xyXG4gICAgc3VwZXIocGFyZW50KTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVUaW1lb3V0RXJyb3InO1xyXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVvdXRFcnJvcjtcclxuIl19