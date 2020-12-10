'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

const BaseError = require('./base-error');
/**
 * Scope Error. Thrown when the sequelize cannot query the specified scope.
 */


let SequelizeScopeError = /*#__PURE__*/function (_BaseError) {
  _inherits(SequelizeScopeError, _BaseError);

  var _super = _createSuper(SequelizeScopeError);

  function SequelizeScopeError(parent) {
    var _this;

    _classCallCheck(this, SequelizeScopeError);

    _this = _super.call(this, parent);
    _this.name = 'SequelizeScopeError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return SequelizeScopeError;
}(BaseError);

module.exports = SequelizeScopeError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvc2VxdWVsaXplLXNjb3BlLWVycm9yLmpzIl0sIm5hbWVzIjpbIkJhc2VFcnJvciIsInJlcXVpcmUiLCJTZXF1ZWxpemVTY29wZUVycm9yIiwicGFyZW50IiwibmFtZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQXpCO0FBRUE7QUFDQTtBQUNBOzs7SUFDTUMsbUI7Ozs7O0FBQ0osK0JBQVlDLE1BQVosRUFBb0I7QUFBQTs7QUFBQTs7QUFDbEIsOEJBQU1BLE1BQU47QUFDQSxVQUFLQyxJQUFMLEdBQVkscUJBQVo7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFIa0I7QUFJbkI7OztFQUwrQlAsUzs7QUFRbENRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsbUJBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBCYXNlRXJyb3IgPSByZXF1aXJlKCcuL2Jhc2UtZXJyb3InKTtcblxuLyoqXG4gKiBTY29wZSBFcnJvci4gVGhyb3duIHdoZW4gdGhlIHNlcXVlbGl6ZSBjYW5ub3QgcXVlcnkgdGhlIHNwZWNpZmllZCBzY29wZS5cbiAqL1xuY2xhc3MgU2VxdWVsaXplU2NvcGVFcnJvciBleHRlbmRzIEJhc2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudCkge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5uYW1lID0gJ1NlcXVlbGl6ZVNjb3BlRXJyb3InO1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2VxdWVsaXplU2NvcGVFcnJvcjtcbiJdfQ==