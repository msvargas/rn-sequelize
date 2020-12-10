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
 * Thrown when constraint name is not found in the database
 */


let UnknownConstraintError = /*#__PURE__*/function (_DatabaseError) {
  _inherits(UnknownConstraintError, _DatabaseError);

  var _super = _createSuper(UnknownConstraintError);

  function UnknownConstraintError(options) {
    var _this;

    _classCallCheck(this, UnknownConstraintError);

    options = options || {};
    options.parent = options.parent || {
      sql: ''
    };
    _this = _super.call(this, options.parent);
    _this.name = 'SequelizeUnknownConstraintError';
    _this.message = options.message || 'The specified constraint does not exist';
    _this.constraint = options.constraint;
    _this.fields = options.fields;
    _this.table = options.table;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return UnknownConstraintError;
}(DatabaseError);

module.exports = UnknownConstraintError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UvdW5rbm93bi1jb25zdHJhaW50LWVycm9yLmpzIl0sIm5hbWVzIjpbIkRhdGFiYXNlRXJyb3IiLCJyZXF1aXJlIiwiVW5rbm93bkNvbnN0cmFpbnRFcnJvciIsIm9wdGlvbnMiLCJwYXJlbnQiLCJzcWwiLCJuYW1lIiwibWVzc2FnZSIsImNvbnN0cmFpbnQiLCJmaWVsZHMiLCJ0YWJsZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxhQUFhLEdBQUdDLE9BQU8sQ0FBQyxxQkFBRCxDQUE3QjtBQUVBO0FBQ0E7QUFDQTs7O0lBQ01DLHNCOzs7OztBQUNKLGtDQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBQUE7O0FBQ25CQSxJQUFBQSxPQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjtBQUNBQSxJQUFBQSxPQUFPLENBQUNDLE1BQVIsR0FBaUJELE9BQU8sQ0FBQ0MsTUFBUixJQUFrQjtBQUFFQyxNQUFBQSxHQUFHLEVBQUU7QUFBUCxLQUFuQztBQUVBLDhCQUFNRixPQUFPLENBQUNDLE1BQWQ7QUFDQSxVQUFLRSxJQUFMLEdBQVksaUNBQVo7QUFFQSxVQUFLQyxPQUFMLEdBQWVKLE9BQU8sQ0FBQ0ksT0FBUixJQUFtQix5Q0FBbEM7QUFDQSxVQUFLQyxVQUFMLEdBQWtCTCxPQUFPLENBQUNLLFVBQTFCO0FBQ0EsVUFBS0MsTUFBTCxHQUFjTixPQUFPLENBQUNNLE1BQXRCO0FBQ0EsVUFBS0MsS0FBTCxHQUFhUCxPQUFPLENBQUNPLEtBQXJCO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBWG1CO0FBWXBCOzs7RUFia0NiLGE7O0FBZ0JyQ2MsTUFBTSxDQUFDQyxPQUFQLEdBQWlCYixzQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IERhdGFiYXNlRXJyb3IgPSByZXF1aXJlKCcuLy4uL2RhdGFiYXNlLWVycm9yJyk7XG5cbi8qKlxuICogVGhyb3duIHdoZW4gY29uc3RyYWludCBuYW1lIGlzIG5vdCBmb3VuZCBpbiB0aGUgZGF0YWJhc2VcbiAqL1xuY2xhc3MgVW5rbm93bkNvbnN0cmFpbnRFcnJvciBleHRlbmRzIERhdGFiYXNlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5wYXJlbnQgPSBvcHRpb25zLnBhcmVudCB8fCB7IHNxbDogJycgfTtcblxuICAgIHN1cGVyKG9wdGlvbnMucGFyZW50KTtcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplVW5rbm93bkNvbnN0cmFpbnRFcnJvcic7XG5cbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgJ1RoZSBzcGVjaWZpZWQgY29uc3RyYWludCBkb2VzIG5vdCBleGlzdCc7XG4gICAgdGhpcy5jb25zdHJhaW50ID0gb3B0aW9ucy5jb25zdHJhaW50O1xuICAgIHRoaXMuZmllbGRzID0gb3B0aW9ucy5maWVsZHM7XG4gICAgdGhpcy50YWJsZSA9IG9wdGlvbnMudGFibGU7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVbmtub3duQ29uc3RyYWludEVycm9yO1xuIl19