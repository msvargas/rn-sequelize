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
 * A base class for all connection related errors.
 */


let ConnectionError = /*#__PURE__*/function (_BaseError) {
  _inherits(ConnectionError, _BaseError);

  var _super = _createSuper(ConnectionError);

  function ConnectionError(parent) {
    var _this;

    _classCallCheck(this, ConnectionError);

    _this = _super.call(this, parent ? parent.message : '');
    _this.name = 'SequelizeConnectionError';
    /**
     * The connection specific error which triggered this one
     * @type {Error}
     */

    _this.parent = parent;
    _this.original = parent;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return ConnectionError;
}(BaseError);

module.exports = ConnectionError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvY29ubmVjdGlvbi1lcnJvci5qcyJdLCJuYW1lcyI6WyJCYXNlRXJyb3IiLCJyZXF1aXJlIiwiQ29ubmVjdGlvbkVycm9yIiwicGFyZW50IiwibWVzc2FnZSIsIm5hbWUiLCJvcmlnaW5hbCIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQXpCO0FBRUE7QUFDQTtBQUNBOzs7SUFDTUMsZTs7Ozs7QUFDSiwyQkFBWUMsTUFBWixFQUFvQjtBQUFBOztBQUFBOztBQUNsQiw4QkFBTUEsTUFBTSxHQUFHQSxNQUFNLENBQUNDLE9BQVYsR0FBb0IsRUFBaEM7QUFDQSxVQUFLQyxJQUFMLEdBQVksMEJBQVo7QUFDQTtBQUNKO0FBQ0E7QUFDQTs7QUFDSSxVQUFLRixNQUFMLEdBQWNBLE1BQWQ7QUFDQSxVQUFLRyxRQUFMLEdBQWdCSCxNQUFoQjtBQUNBSSxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQVRrQjtBQVVuQjs7O0VBWDJCVCxTOztBQWM5QlUsTUFBTSxDQUFDQyxPQUFQLEdBQWlCVCxlQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgQmFzZUVycm9yID0gcmVxdWlyZSgnLi9iYXNlLWVycm9yJyk7XG5cbi8qKlxuICogQSBiYXNlIGNsYXNzIGZvciBhbGwgY29ubmVjdGlvbiByZWxhdGVkIGVycm9ycy5cbiAqL1xuY2xhc3MgQ29ubmVjdGlvbkVycm9yIGV4dGVuZHMgQmFzZUVycm9yIHtcbiAgY29uc3RydWN0b3IocGFyZW50KSB7XG4gICAgc3VwZXIocGFyZW50ID8gcGFyZW50Lm1lc3NhZ2UgOiAnJyk7XG4gICAgdGhpcy5uYW1lID0gJ1NlcXVlbGl6ZUNvbm5lY3Rpb25FcnJvcic7XG4gICAgLyoqXG4gICAgICogVGhlIGNvbm5lY3Rpb24gc3BlY2lmaWMgZXJyb3Igd2hpY2ggdHJpZ2dlcmVkIHRoaXMgb25lXG4gICAgICogQHR5cGUge0Vycm9yfVxuICAgICAqL1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMub3JpZ2luYWwgPSBwYXJlbnQ7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0aW9uRXJyb3I7XG4iXX0=