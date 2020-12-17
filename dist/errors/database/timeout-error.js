'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

const DatabaseError = require('./../database-error');
/**
 * Thrown when a database query times out because of a deadlock
 */


let TimeoutError = /*#__PURE__*/function (_DatabaseError) {
  _inherits(TimeoutError, _DatabaseError);

  var _super = _createSuper(TimeoutError);

  function TimeoutError(parent) {
    var _this;

    _classCallCheck(this, TimeoutError);

    _this = _super.call(this, parent);
    _this.name = 'SequelizeTimeoutError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return TimeoutError;
}(DatabaseError);

module.exports = TimeoutError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UvdGltZW91dC1lcnJvci5qcyJdLCJuYW1lcyI6WyJEYXRhYmFzZUVycm9yIiwicmVxdWlyZSIsIlRpbWVvdXRFcnJvciIsInBhcmVudCIsIm5hbWUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsYUFBYSxHQUFHQyxPQUFPLENBQUMscUJBQUQsQ0FBN0I7QUFFQTtBQUNBO0FBQ0E7OztJQUNNQyxZOzs7OztBQUNKLHdCQUFZQyxNQUFaLEVBQW9CO0FBQUE7O0FBQUE7O0FBQ2xCLDhCQUFNQSxNQUFOO0FBQ0EsVUFBS0MsSUFBTCxHQUFZLHVCQUFaO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBSGtCO0FBSW5COzs7RUFMd0JQLGE7O0FBUTNCUSxNQUFNLENBQUNDLE9BQVAsR0FBaUJQLFlBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBEYXRhYmFzZUVycm9yID0gcmVxdWlyZSgnLi8uLi9kYXRhYmFzZS1lcnJvcicpO1xuXG4vKipcbiAqIFRocm93biB3aGVuIGEgZGF0YWJhc2UgcXVlcnkgdGltZXMgb3V0IGJlY2F1c2Ugb2YgYSBkZWFkbG9ja1xuICovXG5jbGFzcyBUaW1lb3V0RXJyb3IgZXh0ZW5kcyBEYXRhYmFzZUVycm9yIHtcbiAgY29uc3RydWN0b3IocGFyZW50KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplVGltZW91dEVycm9yJztcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVvdXRFcnJvcjtcbiJdfQ==