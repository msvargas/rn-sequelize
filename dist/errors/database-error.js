'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * A base class for all database related errors.
 */


let DatabaseError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(DatabaseError, _BaseError);

  function DatabaseError(parent) {
    var _this;

    _classCallCheck(this, DatabaseError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(DatabaseError).call(this, parent.message));
    _this.name = 'SequelizeDatabaseError';
    /**
     * @type {Error}
     */

    _this.parent = parent;
    /**
     * @type {Error}
     */

    _this.original = parent;
    /**
     * The SQL that triggered the error
     * @type {string}
     */

    _this.sql = parent.sql;
    /**
     * The parameters for the sql that triggered the error
     * @type {Array<any>}
     */

    _this.parameters = parent.parameters;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return DatabaseError;
}(BaseError);

module.exports = DatabaseError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UtZXJyb3IuanMiXSwibmFtZXMiOlsiQmFzZUVycm9yIiwicmVxdWlyZSIsIkRhdGFiYXNlRXJyb3IiLCJwYXJlbnQiLCJtZXNzYWdlIiwibmFtZSIsIm9yaWdpbmFsIiwic3FsIiwicGFyYW1ldGVycyIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLFNBQVMsR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBekI7QUFFQTs7Ozs7SUFHTUMsYTs7Ozs7QUFDSix5QkFBWUMsTUFBWixFQUFvQjtBQUFBOztBQUFBOztBQUNsQix1RkFBTUEsTUFBTSxDQUFDQyxPQUFiO0FBQ0EsVUFBS0MsSUFBTCxHQUFZLHdCQUFaO0FBQ0E7Ozs7QUFHQSxVQUFLRixNQUFMLEdBQWNBLE1BQWQ7QUFDQTs7OztBQUdBLFVBQUtHLFFBQUwsR0FBZ0JILE1BQWhCO0FBQ0E7Ozs7O0FBSUEsVUFBS0ksR0FBTCxHQUFXSixNQUFNLENBQUNJLEdBQWxCO0FBQ0E7Ozs7O0FBSUEsVUFBS0MsVUFBTCxHQUFrQkwsTUFBTSxDQUFDSyxVQUF6QjtBQUNBQyxJQUFBQSxLQUFLLENBQUNDLGlCQUFOLGdDQUE4QixNQUFLQyxXQUFuQztBQXJCa0I7QUFzQm5COzs7RUF2QnlCWCxTOztBQTBCNUJZLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlgsYUFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBCYXNlRXJyb3IgPSByZXF1aXJlKCcuL2Jhc2UtZXJyb3InKTtcclxuXHJcbi8qKlxyXG4gKiBBIGJhc2UgY2xhc3MgZm9yIGFsbCBkYXRhYmFzZSByZWxhdGVkIGVycm9ycy5cclxuICovXHJcbmNsYXNzIERhdGFiYXNlRXJyb3IgZXh0ZW5kcyBCYXNlRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKHBhcmVudCkge1xyXG4gICAgc3VwZXIocGFyZW50Lm1lc3NhZ2UpO1xyXG4gICAgdGhpcy5uYW1lID0gJ1NlcXVlbGl6ZURhdGFiYXNlRXJyb3InO1xyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7RXJyb3J9XHJcbiAgICAgKi9cclxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7RXJyb3J9XHJcbiAgICAgKi9cclxuICAgIHRoaXMub3JpZ2luYWwgPSBwYXJlbnQ7XHJcbiAgICAvKipcclxuICAgICAqIFRoZSBTUUwgdGhhdCB0cmlnZ2VyZWQgdGhlIGVycm9yXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnNxbCA9IHBhcmVudC5zcWw7XHJcbiAgICAvKipcclxuICAgICAqIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgc3FsIHRoYXQgdHJpZ2dlcmVkIHRoZSBlcnJvclxyXG4gICAgICogQHR5cGUge0FycmF5PGFueT59XHJcbiAgICAgKi9cclxuICAgIHRoaXMucGFyYW1ldGVycyA9IHBhcmVudC5wYXJhbWV0ZXJzO1xyXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFiYXNlRXJyb3I7XHJcbiJdfQ==