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
 * A base class for all database related errors.
 */


let DatabaseError = /*#__PURE__*/function (_BaseError) {
  _inherits(DatabaseError, _BaseError);

  var _super = _createSuper(DatabaseError);

  function DatabaseError(parent) {
    var _this;

    _classCallCheck(this, DatabaseError);

    _this = _super.call(this, parent.message);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UtZXJyb3IuanMiXSwibmFtZXMiOlsiQmFzZUVycm9yIiwicmVxdWlyZSIsIkRhdGFiYXNlRXJyb3IiLCJwYXJlbnQiLCJtZXNzYWdlIiwibmFtZSIsIm9yaWdpbmFsIiwic3FsIiwicGFyYW1ldGVycyIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQXpCO0FBRUE7QUFDQTtBQUNBOzs7SUFDTUMsYTs7Ozs7QUFDSix5QkFBWUMsTUFBWixFQUFvQjtBQUFBOztBQUFBOztBQUNsQiw4QkFBTUEsTUFBTSxDQUFDQyxPQUFiO0FBQ0EsVUFBS0MsSUFBTCxHQUFZLHdCQUFaO0FBQ0E7QUFDSjtBQUNBOztBQUNJLFVBQUtGLE1BQUwsR0FBY0EsTUFBZDtBQUNBO0FBQ0o7QUFDQTs7QUFDSSxVQUFLRyxRQUFMLEdBQWdCSCxNQUFoQjtBQUNBO0FBQ0o7QUFDQTtBQUNBOztBQUNJLFVBQUtJLEdBQUwsR0FBV0osTUFBTSxDQUFDSSxHQUFsQjtBQUNBO0FBQ0o7QUFDQTtBQUNBOztBQUNJLFVBQUtDLFVBQUwsR0FBa0JMLE1BQU0sQ0FBQ0ssVUFBekI7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFyQmtCO0FBc0JuQjs7O0VBdkJ5QlgsUzs7QUEwQjVCWSxNQUFNLENBQUNDLE9BQVAsR0FBaUJYLGFBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBCYXNlRXJyb3IgPSByZXF1aXJlKCcuL2Jhc2UtZXJyb3InKTtcblxuLyoqXG4gKiBBIGJhc2UgY2xhc3MgZm9yIGFsbCBkYXRhYmFzZSByZWxhdGVkIGVycm9ycy5cbiAqL1xuY2xhc3MgRGF0YWJhc2VFcnJvciBleHRlbmRzIEJhc2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudCkge1xuICAgIHN1cGVyKHBhcmVudC5tZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplRGF0YWJhc2VFcnJvcic7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0Vycm9yfVxuICAgICAqL1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtFcnJvcn1cbiAgICAgKi9cbiAgICB0aGlzLm9yaWdpbmFsID0gcGFyZW50O1xuICAgIC8qKlxuICAgICAqIFRoZSBTUUwgdGhhdCB0cmlnZ2VyZWQgdGhlIGVycm9yXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLnNxbCA9IHBhcmVudC5zcWw7XG4gICAgLyoqXG4gICAgICogVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBzcWwgdGhhdCB0cmlnZ2VyZWQgdGhlIGVycm9yXG4gICAgICogQHR5cGUge0FycmF5PGFueT59XG4gICAgICovXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0gcGFyZW50LnBhcmFtZXRlcnM7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEYXRhYmFzZUVycm9yO1xuIl19