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
 * Thrown when attempting to update a stale model instance
 */


let OptimisticLockError = /*#__PURE__*/function (_BaseError) {
  _inherits(OptimisticLockError, _BaseError);

  var _super = _createSuper(OptimisticLockError);

  function OptimisticLockError(options) {
    var _this;

    _classCallCheck(this, OptimisticLockError);

    options = options || {};
    options.message = options.message || `Attempting to update a stale model instance: ${options.modelName}`;
    _this = _super.call(this, options.message);
    _this.name = 'SequelizeOptimisticLockError';
    /**
     * The name of the model on which the update was attempted
     * @type {string}
     */

    _this.modelName = options.modelName;
    /**
     * The values of the attempted update
     * @type {object}
     */

    _this.values = options.values;
    /**
     *
     * @type {object}
     */

    _this.where = options.where;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return OptimisticLockError;
}(BaseError);

module.exports = OptimisticLockError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvb3B0aW1pc3RpYy1sb2NrLWVycm9yLmpzIl0sIm5hbWVzIjpbIkJhc2VFcnJvciIsInJlcXVpcmUiLCJPcHRpbWlzdGljTG9ja0Vycm9yIiwib3B0aW9ucyIsIm1lc3NhZ2UiLCJtb2RlbE5hbWUiLCJuYW1lIiwidmFsdWVzIiwid2hlcmUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsU0FBUyxHQUFHQyxPQUFPLENBQUMsY0FBRCxDQUF6QjtBQUVBO0FBQ0E7QUFDQTs7O0lBQ01DLG1COzs7OztBQUNKLCtCQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBQUE7O0FBQ25CQSxJQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjtBQUNBQSxJQUFBQSxPQUFPLENBQUNDLE9BQVIsR0FBa0JELE9BQU8sQ0FBQ0MsT0FBUixJQUFvQixnREFBK0NELE9BQU8sQ0FBQ0UsU0FBVSxFQUF2RztBQUNBLDhCQUFNRixPQUFPLENBQUNDLE9BQWQ7QUFDQSxVQUFLRSxJQUFMLEdBQVksOEJBQVo7QUFDQTtBQUNKO0FBQ0E7QUFDQTs7QUFDSSxVQUFLRCxTQUFMLEdBQWlCRixPQUFPLENBQUNFLFNBQXpCO0FBQ0E7QUFDSjtBQUNBO0FBQ0E7O0FBQ0ksVUFBS0UsTUFBTCxHQUFjSixPQUFPLENBQUNJLE1BQXRCO0FBQ0E7QUFDSjtBQUNBO0FBQ0E7O0FBQ0ksVUFBS0MsS0FBTCxHQUFhTCxPQUFPLENBQUNLLEtBQXJCO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBcEJtQjtBQXFCcEI7OztFQXRCK0JYLFM7O0FBeUJsQ1ksTUFBTSxDQUFDQyxPQUFQLEdBQWlCWCxtQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IEJhc2VFcnJvciA9IHJlcXVpcmUoJy4vYmFzZS1lcnJvcicpO1xuXG4vKipcbiAqIFRocm93biB3aGVuIGF0dGVtcHRpbmcgdG8gdXBkYXRlIGEgc3RhbGUgbW9kZWwgaW5zdGFuY2VcbiAqL1xuY2xhc3MgT3B0aW1pc3RpY0xvY2tFcnJvciBleHRlbmRzIEJhc2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgYEF0dGVtcHRpbmcgdG8gdXBkYXRlIGEgc3RhbGUgbW9kZWwgaW5zdGFuY2U6ICR7b3B0aW9ucy5tb2RlbE5hbWV9YDtcbiAgICBzdXBlcihvcHRpb25zLm1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVPcHRpbWlzdGljTG9ja0Vycm9yJztcbiAgICAvKipcbiAgICAgKiBUaGUgbmFtZSBvZiB0aGUgbW9kZWwgb24gd2hpY2ggdGhlIHVwZGF0ZSB3YXMgYXR0ZW1wdGVkXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLm1vZGVsTmFtZSA9IG9wdGlvbnMubW9kZWxOYW1lO1xuICAgIC8qKlxuICAgICAqIFRoZSB2YWx1ZXMgb2YgdGhlIGF0dGVtcHRlZCB1cGRhdGVcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqL1xuICAgIHRoaXMudmFsdWVzID0gb3B0aW9ucy52YWx1ZXM7XG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqL1xuICAgIHRoaXMud2hlcmUgPSBvcHRpb25zLndoZXJlO1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT3B0aW1pc3RpY0xvY2tFcnJvcjtcbiJdfQ==