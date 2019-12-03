'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const ConnectionError = require('./../connection-error');
/**
 * Thrown when a connection to a database has a hostname that was not reachable
 */


let HostNotReachableError =
/*#__PURE__*/
function (_ConnectionError) {
  _inherits(HostNotReachableError, _ConnectionError);

  function HostNotReachableError(parent) {
    var _this;

    _classCallCheck(this, HostNotReachableError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(HostNotReachableError).call(this, parent));
    _this.name = 'SequelizeHostNotReachableError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return HostNotReachableError;
}(ConnectionError);

module.exports = HostNotReachableError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi9ob3N0LW5vdC1yZWFjaGFibGUtZXJyb3IuanMiXSwibmFtZXMiOlsiQ29ubmVjdGlvbkVycm9yIiwicmVxdWlyZSIsIkhvc3ROb3RSZWFjaGFibGVFcnJvciIsInBhcmVudCIsIm5hbWUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxlQUFlLEdBQUdDLE9BQU8sQ0FBQyx1QkFBRCxDQUEvQjtBQUVBOzs7OztJQUdNQyxxQjs7Ozs7QUFDSixpQ0FBWUMsTUFBWixFQUFvQjtBQUFBOztBQUFBOztBQUNsQiwrRkFBTUEsTUFBTjtBQUNBLFVBQUtDLElBQUwsR0FBWSxnQ0FBWjtBQUNBQyxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQUhrQjtBQUluQjs7O0VBTGlDUCxlOztBQVFwQ1EsTUFBTSxDQUFDQyxPQUFQLEdBQWlCUCxxQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBDb25uZWN0aW9uRXJyb3IgPSByZXF1aXJlKCcuLy4uL2Nvbm5lY3Rpb24tZXJyb3InKTtcclxuXHJcbi8qKlxyXG4gKiBUaHJvd24gd2hlbiBhIGNvbm5lY3Rpb24gdG8gYSBkYXRhYmFzZSBoYXMgYSBob3N0bmFtZSB0aGF0IHdhcyBub3QgcmVhY2hhYmxlXHJcbiAqL1xyXG5jbGFzcyBIb3N0Tm90UmVhY2hhYmxlRXJyb3IgZXh0ZW5kcyBDb25uZWN0aW9uRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKHBhcmVudCkge1xyXG4gICAgc3VwZXIocGFyZW50KTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVIb3N0Tm90UmVhY2hhYmxlRXJyb3InO1xyXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEhvc3ROb3RSZWFjaGFibGVFcnJvcjtcclxuIl19