'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const DatabaseError = require('./../database-error');
/**
 * Thrown when constraint name is not found in the database
 */


let UnknownConstraintError =
/*#__PURE__*/
function (_DatabaseError) {
  _inherits(UnknownConstraintError, _DatabaseError);

  function UnknownConstraintError(options) {
    var _this;

    _classCallCheck(this, UnknownConstraintError);

    options = options || {};
    options.parent = options.parent || {
      sql: ''
    };
    _this = _possibleConstructorReturn(this, _getPrototypeOf(UnknownConstraintError).call(this, options.parent));
    _this.name = 'SequelizeUnknownConstraintError';
    _this.message = options.message || 'The specified constraint does not exist';
    _this.constraint = options.constraint;
    _this.fields = options.fields;
    _this.table = options.table;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return UnknownConstraintError;
}(DatabaseError);

module.exports = UnknownConstraintError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UvdW5rbm93bi1jb25zdHJhaW50LWVycm9yLmpzIl0sIm5hbWVzIjpbIkRhdGFiYXNlRXJyb3IiLCJyZXF1aXJlIiwiVW5rbm93bkNvbnN0cmFpbnRFcnJvciIsIm9wdGlvbnMiLCJwYXJlbnQiLCJzcWwiLCJuYW1lIiwibWVzc2FnZSIsImNvbnN0cmFpbnQiLCJmaWVsZHMiLCJ0YWJsZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLGFBQWEsR0FBR0MsT0FBTyxDQUFDLHFCQUFELENBQTdCO0FBRUE7Ozs7O0lBR01DLHNCOzs7OztBQUNKLGtDQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBQUE7O0FBQ25CQSxJQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjtBQUNBQSxJQUFBQSxPQUFPLENBQUNDLE1BQVIsR0FBaUJELE9BQU8sQ0FBQ0MsTUFBUixJQUFrQjtBQUFFQyxNQUFBQSxHQUFHLEVBQUU7QUFBUCxLQUFuQztBQUVBLGdHQUFNRixPQUFPLENBQUNDLE1BQWQ7QUFDQSxVQUFLRSxJQUFMLEdBQVksaUNBQVo7QUFFQSxVQUFLQyxPQUFMLEdBQWVKLE9BQU8sQ0FBQ0ksT0FBUixJQUFtQix5Q0FBbEM7QUFDQSxVQUFLQyxVQUFMLEdBQWtCTCxPQUFPLENBQUNLLFVBQTFCO0FBQ0EsVUFBS0MsTUFBTCxHQUFjTixPQUFPLENBQUNNLE1BQXRCO0FBQ0EsVUFBS0MsS0FBTCxHQUFhUCxPQUFPLENBQUNPLEtBQXJCO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBWG1CO0FBWXBCOzs7RUFia0NiLGE7O0FBZ0JyQ2MsTUFBTSxDQUFDQyxPQUFQLEdBQWlCYixzQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBEYXRhYmFzZUVycm9yID0gcmVxdWlyZSgnLi8uLi9kYXRhYmFzZS1lcnJvcicpO1xyXG5cclxuLyoqXHJcbiAqIFRocm93biB3aGVuIGNvbnN0cmFpbnQgbmFtZSBpcyBub3QgZm91bmQgaW4gdGhlIGRhdGFiYXNlXHJcbiAqL1xyXG5jbGFzcyBVbmtub3duQ29uc3RyYWludEVycm9yIGV4dGVuZHMgRGF0YWJhc2VFcnJvciB7XHJcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBvcHRpb25zLnBhcmVudCA9IG9wdGlvbnMucGFyZW50IHx8IHsgc3FsOiAnJyB9O1xyXG5cclxuICAgIHN1cGVyKG9wdGlvbnMucGFyZW50KTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVVbmtub3duQ29uc3RyYWludEVycm9yJztcclxuXHJcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgJ1RoZSBzcGVjaWZpZWQgY29uc3RyYWludCBkb2VzIG5vdCBleGlzdCc7XHJcbiAgICB0aGlzLmNvbnN0cmFpbnQgPSBvcHRpb25zLmNvbnN0cmFpbnQ7XHJcbiAgICB0aGlzLmZpZWxkcyA9IG9wdGlvbnMuZmllbGRzO1xyXG4gICAgdGhpcy50YWJsZSA9IG9wdGlvbnMudGFibGU7XHJcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVW5rbm93bkNvbnN0cmFpbnRFcnJvcjtcclxuIl19