'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * Thrown when attempting to update a stale model instance
 */


let OptimisticLockError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(OptimisticLockError, _BaseError);

  function OptimisticLockError(options) {
    var _this;

    _classCallCheck(this, OptimisticLockError);

    options = options || {};
    options.message = options.message || `Attempting to update a stale model instance: ${options.modelName}`;
    _this = _possibleConstructorReturn(this, _getPrototypeOf(OptimisticLockError).call(this, options.message));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvb3B0aW1pc3RpYy1sb2NrLWVycm9yLmpzIl0sIm5hbWVzIjpbIkJhc2VFcnJvciIsInJlcXVpcmUiLCJPcHRpbWlzdGljTG9ja0Vycm9yIiwib3B0aW9ucyIsIm1lc3NhZ2UiLCJtb2RlbE5hbWUiLCJuYW1lIiwidmFsdWVzIiwid2hlcmUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQXpCO0FBRUE7Ozs7O0lBR01DLG1COzs7OztBQUNKLCtCQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBQUE7O0FBQ25CQSxJQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjtBQUNBQSxJQUFBQSxPQUFPLENBQUNDLE9BQVIsR0FBa0JELE9BQU8sQ0FBQ0MsT0FBUixJQUFvQixnREFBK0NELE9BQU8sQ0FBQ0UsU0FBVSxFQUF2RztBQUNBLDZGQUFNRixPQUFPLENBQUNDLE9BQWQ7QUFDQSxVQUFLRSxJQUFMLEdBQVksOEJBQVo7QUFDQTs7Ozs7QUFJQSxVQUFLRCxTQUFMLEdBQWlCRixPQUFPLENBQUNFLFNBQXpCO0FBQ0E7Ozs7O0FBSUEsVUFBS0UsTUFBTCxHQUFjSixPQUFPLENBQUNJLE1BQXRCO0FBQ0E7Ozs7O0FBSUEsVUFBS0MsS0FBTCxHQUFhTCxPQUFPLENBQUNLLEtBQXJCO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBcEJtQjtBQXFCcEI7OztFQXRCK0JYLFM7O0FBeUJsQ1ksTUFBTSxDQUFDQyxPQUFQLEdBQWlCWCxtQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBCYXNlRXJyb3IgPSByZXF1aXJlKCcuL2Jhc2UtZXJyb3InKTtcclxuXHJcbi8qKlxyXG4gKiBUaHJvd24gd2hlbiBhdHRlbXB0aW5nIHRvIHVwZGF0ZSBhIHN0YWxlIG1vZGVsIGluc3RhbmNlXHJcbiAqL1xyXG5jbGFzcyBPcHRpbWlzdGljTG9ja0Vycm9yIGV4dGVuZHMgQmFzZUVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIG9wdGlvbnMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fCBgQXR0ZW1wdGluZyB0byB1cGRhdGUgYSBzdGFsZSBtb2RlbCBpbnN0YW5jZTogJHtvcHRpb25zLm1vZGVsTmFtZX1gO1xyXG4gICAgc3VwZXIob3B0aW9ucy5tZXNzYWdlKTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVPcHRpbWlzdGljTG9ja0Vycm9yJztcclxuICAgIC8qKlxyXG4gICAgICogVGhlIG5hbWUgb2YgdGhlIG1vZGVsIG9uIHdoaWNoIHRoZSB1cGRhdGUgd2FzIGF0dGVtcHRlZFxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgdGhpcy5tb2RlbE5hbWUgPSBvcHRpb25zLm1vZGVsTmFtZTtcclxuICAgIC8qKlxyXG4gICAgICogVGhlIHZhbHVlcyBvZiB0aGUgYXR0ZW1wdGVkIHVwZGF0ZVxyXG4gICAgICogQHR5cGUge29iamVjdH1cclxuICAgICAqL1xyXG4gICAgdGhpcy52YWx1ZXMgPSBvcHRpb25zLnZhbHVlcztcclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtvYmplY3R9XHJcbiAgICAgKi9cclxuICAgIHRoaXMud2hlcmUgPSBvcHRpb25zLndoZXJlO1xyXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE9wdGltaXN0aWNMb2NrRXJyb3I7XHJcbiJdfQ==