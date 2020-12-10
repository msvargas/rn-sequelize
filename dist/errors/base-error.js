'use strict';
/**
 * Sequelize provides a host of custom error classes, to allow you to do easier debugging. All of these errors are exposed on the sequelize object and the sequelize constructor.
 * All sequelize errors inherit from the base JS error object.
 *
 * This means that errors can be accessed using `Sequelize.ValidationError`
 * The Base Error all Sequelize Errors inherit from.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

let BaseError = /*#__PURE__*/function (_Error) {
  _inherits(BaseError, _Error);

  var _super = _createSuper(BaseError);

  function BaseError(message) {
    var _this;

    _classCallCheck(this, BaseError);

    _this = _super.call(this, message);
    _this.name = 'SequelizeBaseError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return BaseError;
}( /*#__PURE__*/_wrapNativeSuper(Error));

module.exports = BaseError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvYmFzZS1lcnJvci5qcyJdLCJuYW1lcyI6WyJCYXNlRXJyb3IiLCJtZXNzYWdlIiwibmFtZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUNNQSxTOzs7OztBQUNKLHFCQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBQUE7O0FBQ25CLDhCQUFNQSxPQUFOO0FBQ0EsVUFBS0MsSUFBTCxHQUFZLG9CQUFaO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBSG1CO0FBSXBCOzs7aUNBTHFCRixLOztBQVF4QkcsTUFBTSxDQUFDQyxPQUFQLEdBQWlCUCxTQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBTZXF1ZWxpemUgcHJvdmlkZXMgYSBob3N0IG9mIGN1c3RvbSBlcnJvciBjbGFzc2VzLCB0byBhbGxvdyB5b3UgdG8gZG8gZWFzaWVyIGRlYnVnZ2luZy4gQWxsIG9mIHRoZXNlIGVycm9ycyBhcmUgZXhwb3NlZCBvbiB0aGUgc2VxdWVsaXplIG9iamVjdCBhbmQgdGhlIHNlcXVlbGl6ZSBjb25zdHJ1Y3Rvci5cbiAqIEFsbCBzZXF1ZWxpemUgZXJyb3JzIGluaGVyaXQgZnJvbSB0aGUgYmFzZSBKUyBlcnJvciBvYmplY3QuXG4gKlxuICogVGhpcyBtZWFucyB0aGF0IGVycm9ycyBjYW4gYmUgYWNjZXNzZWQgdXNpbmcgYFNlcXVlbGl6ZS5WYWxpZGF0aW9uRXJyb3JgXG4gKiBUaGUgQmFzZSBFcnJvciBhbGwgU2VxdWVsaXplIEVycm9ycyBpbmhlcml0IGZyb20uXG4gKi9cbmNsYXNzIEJhc2VFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVCYXNlRXJyb3InO1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZUVycm9yO1xuIl19