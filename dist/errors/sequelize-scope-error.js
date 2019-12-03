'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * Scope Error. Thrown when the sequelize cannot query the specified scope.
 */


let SequelizeScopeError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(SequelizeScopeError, _BaseError);

  function SequelizeScopeError(parent) {
    var _this;

    _classCallCheck(this, SequelizeScopeError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SequelizeScopeError).call(this, parent));
    _this.name = 'SequelizeScopeError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return SequelizeScopeError;
}(BaseError);

module.exports = SequelizeScopeError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvc2VxdWVsaXplLXNjb3BlLWVycm9yLmpzIl0sIm5hbWVzIjpbIkJhc2VFcnJvciIsInJlcXVpcmUiLCJTZXF1ZWxpemVTY29wZUVycm9yIiwicGFyZW50IiwibmFtZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLFNBQVMsR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBekI7QUFFQTs7Ozs7SUFHTUMsbUI7Ozs7O0FBQ0osK0JBQVlDLE1BQVosRUFBb0I7QUFBQTs7QUFBQTs7QUFDbEIsNkZBQU1BLE1BQU47QUFDQSxVQUFLQyxJQUFMLEdBQVkscUJBQVo7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFIa0I7QUFJbkI7OztFQUwrQlAsUzs7QUFRbENRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsbUJBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgQmFzZUVycm9yID0gcmVxdWlyZSgnLi9iYXNlLWVycm9yJyk7XHJcblxyXG4vKipcclxuICogU2NvcGUgRXJyb3IuIFRocm93biB3aGVuIHRoZSBzZXF1ZWxpemUgY2Fubm90IHF1ZXJ5IHRoZSBzcGVjaWZpZWQgc2NvcGUuXHJcbiAqL1xyXG5jbGFzcyBTZXF1ZWxpemVTY29wZUVycm9yIGV4dGVuZHMgQmFzZUVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihwYXJlbnQpIHtcclxuICAgIHN1cGVyKHBhcmVudCk7XHJcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplU2NvcGVFcnJvcic7XHJcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VxdWVsaXplU2NvcGVFcnJvcjtcclxuIl19