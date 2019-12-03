'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * A base class for all connection related errors.
 */


let ConnectionError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(ConnectionError, _BaseError);

  function ConnectionError(parent) {
    var _this;

    _classCallCheck(this, ConnectionError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ConnectionError).call(this, parent ? parent.message : ''));
    _this.name = 'SequelizeConnectionError';
    /**
     * The connection specific error which triggered this one
     * @type {Error}
     */

    _this.parent = parent;
    _this.original = parent;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return ConnectionError;
}(BaseError);

module.exports = ConnectionError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi1lcnJvci5qcyJdLCJuYW1lcyI6WyJCYXNlRXJyb3IiLCJyZXF1aXJlIiwiQ29ubmVjdGlvbkVycm9yIiwicGFyZW50IiwibWVzc2FnZSIsIm5hbWUiLCJvcmlnaW5hbCIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLFNBQVMsR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBekI7QUFFQTs7Ozs7SUFHTUMsZTs7Ozs7QUFDSiwyQkFBWUMsTUFBWixFQUFvQjtBQUFBOztBQUFBOztBQUNsQix5RkFBTUEsTUFBTSxHQUFHQSxNQUFNLENBQUNDLE9BQVYsR0FBb0IsRUFBaEM7QUFDQSxVQUFLQyxJQUFMLEdBQVksMEJBQVo7QUFDQTs7Ozs7QUFJQSxVQUFLRixNQUFMLEdBQWNBLE1BQWQ7QUFDQSxVQUFLRyxRQUFMLEdBQWdCSCxNQUFoQjtBQUNBSSxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQVRrQjtBQVVuQjs7O0VBWDJCVCxTOztBQWM5QlUsTUFBTSxDQUFDQyxPQUFQLEdBQWlCVCxlQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IEJhc2VFcnJvciA9IHJlcXVpcmUoJy4vYmFzZS1lcnJvcicpO1xyXG5cclxuLyoqXHJcbiAqIEEgYmFzZSBjbGFzcyBmb3IgYWxsIGNvbm5lY3Rpb24gcmVsYXRlZCBlcnJvcnMuXHJcbiAqL1xyXG5jbGFzcyBDb25uZWN0aW9uRXJyb3IgZXh0ZW5kcyBCYXNlRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKHBhcmVudCkge1xyXG4gICAgc3VwZXIocGFyZW50ID8gcGFyZW50Lm1lc3NhZ2UgOiAnJyk7XHJcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplQ29ubmVjdGlvbkVycm9yJztcclxuICAgIC8qKlxyXG4gICAgICogVGhlIGNvbm5lY3Rpb24gc3BlY2lmaWMgZXJyb3Igd2hpY2ggdHJpZ2dlcmVkIHRoaXMgb25lXHJcbiAgICAgKiBAdHlwZSB7RXJyb3J9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gICAgdGhpcy5vcmlnaW5hbCA9IHBhcmVudDtcclxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0aW9uRXJyb3I7XHJcbiJdfQ==