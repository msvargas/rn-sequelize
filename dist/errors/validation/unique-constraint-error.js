'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

const ValidationError = require('./../validation-error');
/**
 * Thrown when a unique constraint is violated in the database
 */


let UniqueConstraintError = /*#__PURE__*/function (_ValidationError) {
  _inherits(UniqueConstraintError, _ValidationError);

  var _super = _createSuper(UniqueConstraintError);

  function UniqueConstraintError(options) {
    var _this;

    _classCallCheck(this, UniqueConstraintError);

    options = options || {};
    options.parent = options.parent || {
      sql: ''
    };
    options.message = options.message || options.parent.message || 'Validation Error';
    options.errors = options.errors || {};
    _this = _super.call(this, options.message, options.errors);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvdmFsaWRhdGlvbi91bmlxdWUtY29uc3RyYWludC1lcnJvci5qcyJdLCJuYW1lcyI6WyJWYWxpZGF0aW9uRXJyb3IiLCJyZXF1aXJlIiwiVW5pcXVlQ29uc3RyYWludEVycm9yIiwib3B0aW9ucyIsInBhcmVudCIsInNxbCIsIm1lc3NhZ2UiLCJlcnJvcnMiLCJuYW1lIiwiZmllbGRzIiwib3JpZ2luYWwiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsZUFBZSxHQUFHQyxPQUFPLENBQUMsdUJBQUQsQ0FBL0I7QUFFQTtBQUNBO0FBQ0E7OztJQUNNQyxxQjs7Ozs7QUFDSixpQ0FBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFBOztBQUNuQkEsSUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7QUFDQUEsSUFBQUEsT0FBTyxDQUFDQyxNQUFSLEdBQWlCRCxPQUFPLENBQUNDLE1BQVIsSUFBa0I7QUFBRUMsTUFBQUEsR0FBRyxFQUFFO0FBQVAsS0FBbkM7QUFDQUYsSUFBQUEsT0FBTyxDQUFDRyxPQUFSLEdBQWtCSCxPQUFPLENBQUNHLE9BQVIsSUFBbUJILE9BQU8sQ0FBQ0MsTUFBUixDQUFlRSxPQUFsQyxJQUE2QyxrQkFBL0Q7QUFDQUgsSUFBQUEsT0FBTyxDQUFDSSxNQUFSLEdBQWlCSixPQUFPLENBQUNJLE1BQVIsSUFBa0IsRUFBbkM7QUFDQSw4QkFBTUosT0FBTyxDQUFDRyxPQUFkLEVBQXVCSCxPQUFPLENBQUNJLE1BQS9CO0FBRUEsVUFBS0MsSUFBTCxHQUFZLGdDQUFaO0FBQ0EsVUFBS0QsTUFBTCxHQUFjSixPQUFPLENBQUNJLE1BQXRCO0FBQ0EsVUFBS0UsTUFBTCxHQUFjTixPQUFPLENBQUNNLE1BQXRCO0FBQ0EsVUFBS0wsTUFBTCxHQUFjRCxPQUFPLENBQUNDLE1BQXRCO0FBQ0EsVUFBS00sUUFBTCxHQUFnQlAsT0FBTyxDQUFDQyxNQUF4QjtBQUNBLFVBQUtDLEdBQUwsR0FBV0YsT0FBTyxDQUFDQyxNQUFSLENBQWVDLEdBQTFCO0FBQ0FNLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBYm1CO0FBY3BCOzs7RUFmaUNiLGU7O0FBa0JwQ2MsTUFBTSxDQUFDQyxPQUFQLEdBQWlCYixxQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFZhbGlkYXRpb25FcnJvciA9IHJlcXVpcmUoJy4vLi4vdmFsaWRhdGlvbi1lcnJvcicpO1xuXG4vKipcbiAqIFRocm93biB3aGVuIGEgdW5pcXVlIGNvbnN0cmFpbnQgaXMgdmlvbGF0ZWQgaW4gdGhlIGRhdGFiYXNlXG4gKi9cbmNsYXNzIFVuaXF1ZUNvbnN0cmFpbnRFcnJvciBleHRlbmRzIFZhbGlkYXRpb25FcnJvciB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLnBhcmVudCA9IG9wdGlvbnMucGFyZW50IHx8IHsgc3FsOiAnJyB9O1xuICAgIG9wdGlvbnMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fCBvcHRpb25zLnBhcmVudC5tZXNzYWdlIHx8ICdWYWxpZGF0aW9uIEVycm9yJztcbiAgICBvcHRpb25zLmVycm9ycyA9IG9wdGlvbnMuZXJyb3JzIHx8IHt9O1xuICAgIHN1cGVyKG9wdGlvbnMubWVzc2FnZSwgb3B0aW9ucy5lcnJvcnMpO1xuXG4gICAgdGhpcy5uYW1lID0gJ1NlcXVlbGl6ZVVuaXF1ZUNvbnN0cmFpbnRFcnJvcic7XG4gICAgdGhpcy5lcnJvcnMgPSBvcHRpb25zLmVycm9ycztcbiAgICB0aGlzLmZpZWxkcyA9IG9wdGlvbnMuZmllbGRzO1xuICAgIHRoaXMucGFyZW50ID0gb3B0aW9ucy5wYXJlbnQ7XG4gICAgdGhpcy5vcmlnaW5hbCA9IG9wdGlvbnMucGFyZW50O1xuICAgIHRoaXMuc3FsID0gb3B0aW9ucy5wYXJlbnQuc3FsO1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVW5pcXVlQ29uc3RyYWludEVycm9yO1xuIl19