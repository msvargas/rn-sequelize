'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const DatabaseError = require('./../database-error');
/**
 * Thrown when an exclusion constraint is violated in the database
 */


let ExclusionConstraintError =
/*#__PURE__*/
function (_DatabaseError) {
  _inherits(ExclusionConstraintError, _DatabaseError);

  function ExclusionConstraintError(options) {
    var _this;

    _classCallCheck(this, ExclusionConstraintError);

    options = options || {};
    options.parent = options.parent || {
      sql: ''
    };
    _this = _possibleConstructorReturn(this, _getPrototypeOf(ExclusionConstraintError).call(this, options.parent));
    _this.name = 'SequelizeExclusionConstraintError';
    _this.message = options.message || options.parent.message || '';
    _this.constraint = options.constraint;
    _this.fields = options.fields;
    _this.table = options.table;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return ExclusionConstraintError;
}(DatabaseError);

module.exports = ExclusionConstraintError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UvZXhjbHVzaW9uLWNvbnN0cmFpbnQtZXJyb3IuanMiXSwibmFtZXMiOlsiRGF0YWJhc2VFcnJvciIsInJlcXVpcmUiLCJFeGNsdXNpb25Db25zdHJhaW50RXJyb3IiLCJvcHRpb25zIiwicGFyZW50Iiwic3FsIiwibmFtZSIsIm1lc3NhZ2UiLCJjb25zdHJhaW50IiwiZmllbGRzIiwidGFibGUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxhQUFhLEdBQUdDLE9BQU8sQ0FBQyxxQkFBRCxDQUE3QjtBQUVBOzs7OztJQUdNQyx3Qjs7Ozs7QUFDSixvQ0FBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFBOztBQUNuQkEsSUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7QUFDQUEsSUFBQUEsT0FBTyxDQUFDQyxNQUFSLEdBQWlCRCxPQUFPLENBQUNDLE1BQVIsSUFBa0I7QUFBRUMsTUFBQUEsR0FBRyxFQUFFO0FBQVAsS0FBbkM7QUFFQSxrR0FBTUYsT0FBTyxDQUFDQyxNQUFkO0FBQ0EsVUFBS0UsSUFBTCxHQUFZLG1DQUFaO0FBRUEsVUFBS0MsT0FBTCxHQUFlSixPQUFPLENBQUNJLE9BQVIsSUFBbUJKLE9BQU8sQ0FBQ0MsTUFBUixDQUFlRyxPQUFsQyxJQUE2QyxFQUE1RDtBQUNBLFVBQUtDLFVBQUwsR0FBa0JMLE9BQU8sQ0FBQ0ssVUFBMUI7QUFDQSxVQUFLQyxNQUFMLEdBQWNOLE9BQU8sQ0FBQ00sTUFBdEI7QUFDQSxVQUFLQyxLQUFMLEdBQWFQLE9BQU8sQ0FBQ08sS0FBckI7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFYbUI7QUFZcEI7OztFQWJvQ2IsYTs7QUFnQnZDYyxNQUFNLENBQUNDLE9BQVAsR0FBaUJiLHdCQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IERhdGFiYXNlRXJyb3IgPSByZXF1aXJlKCcuLy4uL2RhdGFiYXNlLWVycm9yJyk7XHJcblxyXG4vKipcclxuICogVGhyb3duIHdoZW4gYW4gZXhjbHVzaW9uIGNvbnN0cmFpbnQgaXMgdmlvbGF0ZWQgaW4gdGhlIGRhdGFiYXNlXHJcbiAqL1xyXG5jbGFzcyBFeGNsdXNpb25Db25zdHJhaW50RXJyb3IgZXh0ZW5kcyBEYXRhYmFzZUVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIG9wdGlvbnMucGFyZW50ID0gb3B0aW9ucy5wYXJlbnQgfHwgeyBzcWw6ICcnIH07XHJcblxyXG4gICAgc3VwZXIob3B0aW9ucy5wYXJlbnQpO1xyXG4gICAgdGhpcy5uYW1lID0gJ1NlcXVlbGl6ZUV4Y2x1c2lvbkNvbnN0cmFpbnRFcnJvcic7XHJcblxyXG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlIHx8IG9wdGlvbnMucGFyZW50Lm1lc3NhZ2UgfHwgJyc7XHJcbiAgICB0aGlzLmNvbnN0cmFpbnQgPSBvcHRpb25zLmNvbnN0cmFpbnQ7XHJcbiAgICB0aGlzLmZpZWxkcyA9IG9wdGlvbnMuZmllbGRzO1xyXG4gICAgdGhpcy50YWJsZSA9IG9wdGlvbnMudGFibGU7XHJcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRXhjbHVzaW9uQ29uc3RyYWludEVycm9yO1xyXG4iXX0=