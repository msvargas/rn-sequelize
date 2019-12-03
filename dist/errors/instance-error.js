'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * Thrown when a some problem occurred with Instance methods (see message for details)
 */


let InstanceError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(InstanceError, _BaseError);

  function InstanceError(message) {
    var _this;

    _classCallCheck(this, InstanceError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InstanceError).call(this, message));
    _this.name = 'SequelizeInstanceError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return InstanceError;
}(BaseError);

module.exports = InstanceError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvaW5zdGFuY2UtZXJyb3IuanMiXSwibmFtZXMiOlsiQmFzZUVycm9yIiwicmVxdWlyZSIsIkluc3RhbmNlRXJyb3IiLCJtZXNzYWdlIiwibmFtZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLFNBQVMsR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBekI7QUFFQTs7Ozs7SUFHTUMsYTs7Ozs7QUFDSix5QkFBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFBOztBQUNuQix1RkFBTUEsT0FBTjtBQUNBLFVBQUtDLElBQUwsR0FBWSx3QkFBWjtBQUNBQyxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQUhtQjtBQUlwQjs7O0VBTHlCUCxTOztBQVE1QlEsTUFBTSxDQUFDQyxPQUFQLEdBQWlCUCxhQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IEJhc2VFcnJvciA9IHJlcXVpcmUoJy4vYmFzZS1lcnJvcicpO1xyXG5cclxuLyoqXHJcbiAqIFRocm93biB3aGVuIGEgc29tZSBwcm9ibGVtIG9jY3VycmVkIHdpdGggSW5zdGFuY2UgbWV0aG9kcyAoc2VlIG1lc3NhZ2UgZm9yIGRldGFpbHMpXHJcbiAqL1xyXG5jbGFzcyBJbnN0YW5jZUVycm9yIGV4dGVuZHMgQmFzZUVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XHJcbiAgICBzdXBlcihtZXNzYWdlKTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVJbnN0YW5jZUVycm9yJztcclxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbnN0YW5jZUVycm9yO1xyXG4iXX0=