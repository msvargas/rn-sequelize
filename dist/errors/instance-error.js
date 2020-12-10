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
 * Thrown when a some problem occurred with Instance methods (see message for details)
 */


let InstanceError = /*#__PURE__*/function (_BaseError) {
  _inherits(InstanceError, _BaseError);

  var _super = _createSuper(InstanceError);

  function InstanceError(message) {
    var _this;

    _classCallCheck(this, InstanceError);

    _this = _super.call(this, message);
    _this.name = 'SequelizeInstanceError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return InstanceError;
}(BaseError);

module.exports = InstanceError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvaW5zdGFuY2UtZXJyb3IuanMiXSwibmFtZXMiOlsiQmFzZUVycm9yIiwicmVxdWlyZSIsIkluc3RhbmNlRXJyb3IiLCJtZXNzYWdlIiwibmFtZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQXpCO0FBRUE7QUFDQTtBQUNBOzs7SUFDTUMsYTs7Ozs7QUFDSix5QkFBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFBOztBQUNuQiw4QkFBTUEsT0FBTjtBQUNBLFVBQUtDLElBQUwsR0FBWSx3QkFBWjtBQUNBQyxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQUhtQjtBQUlwQjs7O0VBTHlCUCxTOztBQVE1QlEsTUFBTSxDQUFDQyxPQUFQLEdBQWlCUCxhQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgQmFzZUVycm9yID0gcmVxdWlyZSgnLi9iYXNlLWVycm9yJyk7XG5cbi8qKlxuICogVGhyb3duIHdoZW4gYSBzb21lIHByb2JsZW0gb2NjdXJyZWQgd2l0aCBJbnN0YW5jZSBtZXRob2RzIChzZWUgbWVzc2FnZSBmb3IgZGV0YWlscylcbiAqL1xuY2xhc3MgSW5zdGFuY2VFcnJvciBleHRlbmRzIEJhc2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplSW5zdGFuY2VFcnJvcic7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbnN0YW5jZUVycm9yO1xuIl19