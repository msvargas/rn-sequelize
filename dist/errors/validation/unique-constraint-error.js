'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const ValidationError = require('./../validation-error');
/**
 * Thrown when a unique constraint is violated in the database
 */


let UniqueConstraintError =
/*#__PURE__*/
function (_ValidationError) {
  _inherits(UniqueConstraintError, _ValidationError);

  function UniqueConstraintError(options) {
    var _this;

    _classCallCheck(this, UniqueConstraintError);

    options = options || {};
    options.parent = options.parent || {
      sql: ''
    };
    options.message = options.message || options.parent.message || 'Validation Error';
    options.errors = options.errors || {};
    _this = _possibleConstructorReturn(this, _getPrototypeOf(UniqueConstraintError).call(this, options.message, options.errors));
    _this.name = 'SequelizeUniqueConstraintError';
    _this.errors = options.errors;
    _this.fields = options.fields;
    _this.parent = options.parent;
    _this.original = options.parent;
    _this.sql = options.parent.sql;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return UniqueConstraintError;
}(ValidationError);

module.exports = UniqueConstraintError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvdmFsaWRhdGlvbi91bmlxdWUtY29uc3RyYWludC1lcnJvci5qcyJdLCJuYW1lcyI6WyJWYWxpZGF0aW9uRXJyb3IiLCJyZXF1aXJlIiwiVW5pcXVlQ29uc3RyYWludEVycm9yIiwib3B0aW9ucyIsInBhcmVudCIsInNxbCIsIm1lc3NhZ2UiLCJlcnJvcnMiLCJuYW1lIiwiZmllbGRzIiwib3JpZ2luYWwiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxlQUFlLEdBQUdDLE9BQU8sQ0FBQyx1QkFBRCxDQUEvQjtBQUVBOzs7OztJQUdNQyxxQjs7Ozs7QUFDSixpQ0FBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFBOztBQUNuQkEsSUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7QUFDQUEsSUFBQUEsT0FBTyxDQUFDQyxNQUFSLEdBQWlCRCxPQUFPLENBQUNDLE1BQVIsSUFBa0I7QUFBRUMsTUFBQUEsR0FBRyxFQUFFO0FBQVAsS0FBbkM7QUFDQUYsSUFBQUEsT0FBTyxDQUFDRyxPQUFSLEdBQWtCSCxPQUFPLENBQUNHLE9BQVIsSUFBbUJILE9BQU8sQ0FBQ0MsTUFBUixDQUFlRSxPQUFsQyxJQUE2QyxrQkFBL0Q7QUFDQUgsSUFBQUEsT0FBTyxDQUFDSSxNQUFSLEdBQWlCSixPQUFPLENBQUNJLE1BQVIsSUFBa0IsRUFBbkM7QUFDQSwrRkFBTUosT0FBTyxDQUFDRyxPQUFkLEVBQXVCSCxPQUFPLENBQUNJLE1BQS9CO0FBRUEsVUFBS0MsSUFBTCxHQUFZLGdDQUFaO0FBQ0EsVUFBS0QsTUFBTCxHQUFjSixPQUFPLENBQUNJLE1BQXRCO0FBQ0EsVUFBS0UsTUFBTCxHQUFjTixPQUFPLENBQUNNLE1BQXRCO0FBQ0EsVUFBS0wsTUFBTCxHQUFjRCxPQUFPLENBQUNDLE1BQXRCO0FBQ0EsVUFBS00sUUFBTCxHQUFnQlAsT0FBTyxDQUFDQyxNQUF4QjtBQUNBLFVBQUtDLEdBQUwsR0FBV0YsT0FBTyxDQUFDQyxNQUFSLENBQWVDLEdBQTFCO0FBQ0FNLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBYm1CO0FBY3BCOzs7RUFmaUNiLGU7O0FBa0JwQ2MsTUFBTSxDQUFDQyxPQUFQLEdBQWlCYixxQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBWYWxpZGF0aW9uRXJyb3IgPSByZXF1aXJlKCcuLy4uL3ZhbGlkYXRpb24tZXJyb3InKTtcclxuXHJcbi8qKlxyXG4gKiBUaHJvd24gd2hlbiBhIHVuaXF1ZSBjb25zdHJhaW50IGlzIHZpb2xhdGVkIGluIHRoZSBkYXRhYmFzZVxyXG4gKi9cclxuY2xhc3MgVW5pcXVlQ29uc3RyYWludEVycm9yIGV4dGVuZHMgVmFsaWRhdGlvbkVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIG9wdGlvbnMucGFyZW50ID0gb3B0aW9ucy5wYXJlbnQgfHwgeyBzcWw6ICcnIH07XHJcbiAgICBvcHRpb25zLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgb3B0aW9ucy5wYXJlbnQubWVzc2FnZSB8fCAnVmFsaWRhdGlvbiBFcnJvcic7XHJcbiAgICBvcHRpb25zLmVycm9ycyA9IG9wdGlvbnMuZXJyb3JzIHx8IHt9O1xyXG4gICAgc3VwZXIob3B0aW9ucy5tZXNzYWdlLCBvcHRpb25zLmVycm9ycyk7XHJcblxyXG4gICAgdGhpcy5uYW1lID0gJ1NlcXVlbGl6ZVVuaXF1ZUNvbnN0cmFpbnRFcnJvcic7XHJcbiAgICB0aGlzLmVycm9ycyA9IG9wdGlvbnMuZXJyb3JzO1xyXG4gICAgdGhpcy5maWVsZHMgPSBvcHRpb25zLmZpZWxkcztcclxuICAgIHRoaXMucGFyZW50ID0gb3B0aW9ucy5wYXJlbnQ7XHJcbiAgICB0aGlzLm9yaWdpbmFsID0gb3B0aW9ucy5wYXJlbnQ7XHJcbiAgICB0aGlzLnNxbCA9IG9wdGlvbnMucGFyZW50LnNxbDtcclxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBVbmlxdWVDb25zdHJhaW50RXJyb3I7XHJcbiJdfQ==