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
 * Thrown when bulk operation fails, it represent per record level error.
 * Used with Promise.AggregateError
 *
 * @param {Error}  error   Error for a given record/instance
 * @param {Object} record  DAO instance that error belongs to
 */


let BulkRecordError = /*#__PURE__*/function (_BaseError) {
  _inherits(BulkRecordError, _BaseError);

  var _super = _createSuper(BulkRecordError);

  function BulkRecordError(error, record) {
    var _this;

    _classCallCheck(this, BulkRecordError);

    _this = _super.call(this, error.message);
    _this.name = 'SequelizeBulkRecordError';
    _this.errors = error;
    _this.record = record;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return BulkRecordError;
}(BaseError);

module.exports = BulkRecordError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvYnVsay1yZWNvcmQtZXJyb3IuanMiXSwibmFtZXMiOlsiQmFzZUVycm9yIiwicmVxdWlyZSIsIkJ1bGtSZWNvcmRFcnJvciIsImVycm9yIiwicmVjb3JkIiwibWVzc2FnZSIsIm5hbWUiLCJlcnJvcnMiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsU0FBUyxHQUFHQyxPQUFPLENBQUMsY0FBRCxDQUF6QjtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7SUFDTUMsZTs7Ozs7QUFDSiwyQkFBWUMsS0FBWixFQUFtQkMsTUFBbkIsRUFBMkI7QUFBQTs7QUFBQTs7QUFDekIsOEJBQU1ELEtBQUssQ0FBQ0UsT0FBWjtBQUNBLFVBQUtDLElBQUwsR0FBWSwwQkFBWjtBQUNBLFVBQUtDLE1BQUwsR0FBY0osS0FBZDtBQUNBLFVBQUtDLE1BQUwsR0FBY0EsTUFBZDtBQUNBSSxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQUx5QjtBQU0xQjs7O0VBUDJCVixTOztBQVU5QlcsTUFBTSxDQUFDQyxPQUFQLEdBQWlCVixlQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgQmFzZUVycm9yID0gcmVxdWlyZSgnLi9iYXNlLWVycm9yJyk7XG5cbi8qKlxuICogVGhyb3duIHdoZW4gYnVsayBvcGVyYXRpb24gZmFpbHMsIGl0IHJlcHJlc2VudCBwZXIgcmVjb3JkIGxldmVsIGVycm9yLlxuICogVXNlZCB3aXRoIFByb21pc2UuQWdncmVnYXRlRXJyb3JcbiAqXG4gKiBAcGFyYW0ge0Vycm9yfSAgZXJyb3IgICBFcnJvciBmb3IgYSBnaXZlbiByZWNvcmQvaW5zdGFuY2VcbiAqIEBwYXJhbSB7T2JqZWN0fSByZWNvcmQgIERBTyBpbnN0YW5jZSB0aGF0IGVycm9yIGJlbG9uZ3MgdG9cbiAqL1xuY2xhc3MgQnVsa1JlY29yZEVycm9yIGV4dGVuZHMgQmFzZUVycm9yIHtcbiAgY29uc3RydWN0b3IoZXJyb3IsIHJlY29yZCkge1xuICAgIHN1cGVyKGVycm9yLm1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVCdWxrUmVjb3JkRXJyb3InO1xuICAgIHRoaXMuZXJyb3JzID0gZXJyb3I7XG4gICAgdGhpcy5yZWNvcmQgPSByZWNvcmQ7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCdWxrUmVjb3JkRXJyb3I7XG4iXX0=