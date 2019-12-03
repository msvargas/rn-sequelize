'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * Thrown when bulk operation fails, it represent per record level error.
 * Used with Promise.AggregateError
 *
 * @param {Error}  error   Error for a given record/instance
 * @param {Object} record  DAO instance that error belongs to
 */


let BulkRecordError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(BulkRecordError, _BaseError);

  function BulkRecordError(error, record) {
    var _this;

    _classCallCheck(this, BulkRecordError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BulkRecordError).call(this, error.message));
    _this.name = 'SequelizeBulkRecordError';
    _this.errors = error;
    _this.record = record;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return BulkRecordError;
}(BaseError);

module.exports = BulkRecordError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvYnVsay1yZWNvcmQtZXJyb3IuanMiXSwibmFtZXMiOlsiQmFzZUVycm9yIiwicmVxdWlyZSIsIkJ1bGtSZWNvcmRFcnJvciIsImVycm9yIiwicmVjb3JkIiwibWVzc2FnZSIsIm5hbWUiLCJlcnJvcnMiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQXpCO0FBRUE7Ozs7Ozs7OztJQU9NQyxlOzs7OztBQUNKLDJCQUFZQyxLQUFaLEVBQW1CQyxNQUFuQixFQUEyQjtBQUFBOztBQUFBOztBQUN6Qix5RkFBTUQsS0FBSyxDQUFDRSxPQUFaO0FBQ0EsVUFBS0MsSUFBTCxHQUFZLDBCQUFaO0FBQ0EsVUFBS0MsTUFBTCxHQUFjSixLQUFkO0FBQ0EsVUFBS0MsTUFBTCxHQUFjQSxNQUFkO0FBQ0FJLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBTHlCO0FBTTFCOzs7RUFQMkJWLFM7O0FBVTlCVyxNQUFNLENBQUNDLE9BQVAsR0FBaUJWLGVBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgQmFzZUVycm9yID0gcmVxdWlyZSgnLi9iYXNlLWVycm9yJyk7XHJcblxyXG4vKipcclxuICogVGhyb3duIHdoZW4gYnVsayBvcGVyYXRpb24gZmFpbHMsIGl0IHJlcHJlc2VudCBwZXIgcmVjb3JkIGxldmVsIGVycm9yLlxyXG4gKiBVc2VkIHdpdGggUHJvbWlzZS5BZ2dyZWdhdGVFcnJvclxyXG4gKlxyXG4gKiBAcGFyYW0ge0Vycm9yfSAgZXJyb3IgICBFcnJvciBmb3IgYSBnaXZlbiByZWNvcmQvaW5zdGFuY2VcclxuICogQHBhcmFtIHtPYmplY3R9IHJlY29yZCAgREFPIGluc3RhbmNlIHRoYXQgZXJyb3IgYmVsb25ncyB0b1xyXG4gKi9cclxuY2xhc3MgQnVsa1JlY29yZEVycm9yIGV4dGVuZHMgQmFzZUVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihlcnJvciwgcmVjb3JkKSB7XHJcbiAgICBzdXBlcihlcnJvci5tZXNzYWdlKTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVCdWxrUmVjb3JkRXJyb3InO1xyXG4gICAgdGhpcy5lcnJvcnMgPSBlcnJvcjtcclxuICAgIHRoaXMucmVjb3JkID0gcmVjb3JkO1xyXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJ1bGtSZWNvcmRFcnJvcjtcclxuIl19