'use strict';
/**
 * Sequelize provides a host of custom error classes, to allow you to do easier debugging. All of these errors are exposed on the sequelize object and the sequelize constructor.
 * All sequelize errors inherit from the base JS error object.
 *
 * This means that errors can be accessed using `Sequelize.ValidationError`
 * The Base Error all Sequelize Errors inherit from.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

let BaseError =
/*#__PURE__*/
function (_Error) {
  _inherits(BaseError, _Error);

  function BaseError(message) {
    var _this;

    _classCallCheck(this, BaseError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BaseError).call(this, message));
    _this.name = 'SequelizeBaseError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return BaseError;
}(_wrapNativeSuper(Error));

module.exports = BaseError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvYmFzZS1lcnJvci5qcyJdLCJuYW1lcyI6WyJCYXNlRXJyb3IiLCJtZXNzYWdlIiwibmFtZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFPTUEsUzs7Ozs7QUFDSixxQkFBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFBOztBQUNuQixtRkFBTUEsT0FBTjtBQUNBLFVBQUtDLElBQUwsR0FBWSxvQkFBWjtBQUNBQyxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQUhtQjtBQUlwQjs7O21CQUxxQkYsSzs7QUFReEJHLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsU0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogU2VxdWVsaXplIHByb3ZpZGVzIGEgaG9zdCBvZiBjdXN0b20gZXJyb3IgY2xhc3NlcywgdG8gYWxsb3cgeW91IHRvIGRvIGVhc2llciBkZWJ1Z2dpbmcuIEFsbCBvZiB0aGVzZSBlcnJvcnMgYXJlIGV4cG9zZWQgb24gdGhlIHNlcXVlbGl6ZSBvYmplY3QgYW5kIHRoZSBzZXF1ZWxpemUgY29uc3RydWN0b3IuXHJcbiAqIEFsbCBzZXF1ZWxpemUgZXJyb3JzIGluaGVyaXQgZnJvbSB0aGUgYmFzZSBKUyBlcnJvciBvYmplY3QuXHJcbiAqXHJcbiAqIFRoaXMgbWVhbnMgdGhhdCBlcnJvcnMgY2FuIGJlIGFjY2Vzc2VkIHVzaW5nIGBTZXF1ZWxpemUuVmFsaWRhdGlvbkVycm9yYFxyXG4gKiBUaGUgQmFzZSBFcnJvciBhbGwgU2VxdWVsaXplIEVycm9ycyBpbmhlcml0IGZyb20uXHJcbiAqL1xyXG5jbGFzcyBCYXNlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IobWVzc2FnZSkge1xyXG4gICAgc3VwZXIobWVzc2FnZSk7XHJcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplQmFzZUVycm9yJztcclxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYXNlRXJyb3I7XHJcbiJdfQ==