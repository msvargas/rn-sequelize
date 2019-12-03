'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * Thrown when an include statement is improperly constructed (see message for details)
 */


let EagerLoadingError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(EagerLoadingError, _BaseError);

  function EagerLoadingError(message) {
    var _this;

    _classCallCheck(this, EagerLoadingError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(EagerLoadingError).call(this, message));
    _this.name = 'SequelizeEagerLoadingError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return EagerLoadingError;
}(BaseError);

module.exports = EagerLoadingError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvZWFnZXItbG9hZGluZy1lcnJvci5qcyJdLCJuYW1lcyI6WyJCYXNlRXJyb3IiLCJyZXF1aXJlIiwiRWFnZXJMb2FkaW5nRXJyb3IiLCJtZXNzYWdlIiwibmFtZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLFNBQVMsR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBekI7QUFFQTs7Ozs7SUFHTUMsaUI7Ozs7O0FBQ0osNkJBQVlDLE9BQVosRUFBcUI7QUFBQTs7QUFBQTs7QUFDbkIsMkZBQU1BLE9BQU47QUFDQSxVQUFLQyxJQUFMLEdBQVksNEJBQVo7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFIbUI7QUFJcEI7OztFQUw2QlAsUzs7QUFRaENRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsaUJBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgQmFzZUVycm9yID0gcmVxdWlyZSgnLi9iYXNlLWVycm9yJyk7XHJcblxyXG4vKipcclxuICogVGhyb3duIHdoZW4gYW4gaW5jbHVkZSBzdGF0ZW1lbnQgaXMgaW1wcm9wZXJseSBjb25zdHJ1Y3RlZCAoc2VlIG1lc3NhZ2UgZm9yIGRldGFpbHMpXHJcbiAqL1xyXG5jbGFzcyBFYWdlckxvYWRpbmdFcnJvciBleHRlbmRzIEJhc2VFcnJvciB7XHJcbiAgY29uc3RydWN0b3IobWVzc2FnZSkge1xyXG4gICAgc3VwZXIobWVzc2FnZSk7XHJcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplRWFnZXJMb2FkaW5nRXJyb3InO1xyXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVhZ2VyTG9hZGluZ0Vycm9yO1xyXG4iXX0=