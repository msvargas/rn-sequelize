'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

const ConnectionError = require('./../connection-error');
/**
 * Thrown when a connection to a database is refused due to insufficient privileges
 */


let AccessDeniedError = /*#__PURE__*/function (_ConnectionError) {
  _inherits(AccessDeniedError, _ConnectionError);

  var _super = _createSuper(AccessDeniedError);

  function AccessDeniedError(parent) {
    var _this;

    _classCallCheck(this, AccessDeniedError);

    _this = _super.call(this, parent);
    _this.name = 'SequelizeAccessDeniedError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return AccessDeniedError;
}(ConnectionError);

module.exports = AccessDeniedError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi9hY2Nlc3MtZGVuaWVkLWVycm9yLmpzIl0sIm5hbWVzIjpbIkNvbm5lY3Rpb25FcnJvciIsInJlcXVpcmUiLCJBY2Nlc3NEZW5pZWRFcnJvciIsInBhcmVudCIsIm5hbWUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsZUFBZSxHQUFHQyxPQUFPLENBQUMsdUJBQUQsQ0FBL0I7QUFFQTtBQUNBO0FBQ0E7OztJQUNNQyxpQjs7Ozs7QUFDSiw2QkFBWUMsTUFBWixFQUFvQjtBQUFBOztBQUFBOztBQUNsQiw4QkFBTUEsTUFBTjtBQUNBLFVBQUtDLElBQUwsR0FBWSw0QkFBWjtBQUNBQyxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQUhrQjtBQUluQjs7O0VBTDZCUCxlOztBQVFoQ1EsTUFBTSxDQUFDQyxPQUFQLEdBQWlCUCxpQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IENvbm5lY3Rpb25FcnJvciA9IHJlcXVpcmUoJy4vLi4vY29ubmVjdGlvbi1lcnJvcicpO1xuXG4vKipcbiAqIFRocm93biB3aGVuIGEgY29ubmVjdGlvbiB0byBhIGRhdGFiYXNlIGlzIHJlZnVzZWQgZHVlIHRvIGluc3VmZmljaWVudCBwcml2aWxlZ2VzXG4gKi9cbmNsYXNzIEFjY2Vzc0RlbmllZEVycm9yIGV4dGVuZHMgQ29ubmVjdGlvbkVycm9yIHtcbiAgY29uc3RydWN0b3IocGFyZW50KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplQWNjZXNzRGVuaWVkRXJyb3InO1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQWNjZXNzRGVuaWVkRXJyb3I7XG4iXX0=