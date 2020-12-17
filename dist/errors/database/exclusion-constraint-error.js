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
 * Thrown when an exclusion constraint is violated in the database
 */


let ExclusionConstraintError = /*#__PURE__*/function (_DatabaseError) {
  _inherits(ExclusionConstraintError, _DatabaseError);

  var _super = _createSuper(ExclusionConstraintError);

  function ExclusionConstraintError(options) {
    var _this;

    _classCallCheck(this, ExclusionConstraintError);

    options = options || {};
    options.parent = options.parent || {
      sql: ''
    };
    _this = _super.call(this, options.parent);
    _this.name = 'SequelizeExclusionConstraintError';
    _this.message = options.message || options.parent.message || '';
    _this.constraint = options.constraint;
    _this.fields = options.fields;
    _this.table = options.table;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return ExclusionConstraintError;
}(DatabaseError);

module.exports = ExclusionConstraintError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UvZXhjbHVzaW9uLWNvbnN0cmFpbnQtZXJyb3IuanMiXSwibmFtZXMiOlsiRGF0YWJhc2VFcnJvciIsInJlcXVpcmUiLCJFeGNsdXNpb25Db25zdHJhaW50RXJyb3IiLCJvcHRpb25zIiwicGFyZW50Iiwic3FsIiwibmFtZSIsIm1lc3NhZ2UiLCJjb25zdHJhaW50IiwiZmllbGRzIiwidGFibGUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsYUFBYSxHQUFHQyxPQUFPLENBQUMscUJBQUQsQ0FBN0I7QUFFQTtBQUNBO0FBQ0E7OztJQUNNQyx3Qjs7Ozs7QUFDSixvQ0FBWUMsT0FBWixFQUFxQjtBQUFBOztBQUFBOztBQUNuQkEsSUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7QUFDQUEsSUFBQUEsT0FBTyxDQUFDQyxNQUFSLEdBQWlCRCxPQUFPLENBQUNDLE1BQVIsSUFBa0I7QUFBRUMsTUFBQUEsR0FBRyxFQUFFO0FBQVAsS0FBbkM7QUFFQSw4QkFBTUYsT0FBTyxDQUFDQyxNQUFkO0FBQ0EsVUFBS0UsSUFBTCxHQUFZLG1DQUFaO0FBRUEsVUFBS0MsT0FBTCxHQUFlSixPQUFPLENBQUNJLE9BQVIsSUFBbUJKLE9BQU8sQ0FBQ0MsTUFBUixDQUFlRyxPQUFsQyxJQUE2QyxFQUE1RDtBQUNBLFVBQUtDLFVBQUwsR0FBa0JMLE9BQU8sQ0FBQ0ssVUFBMUI7QUFDQSxVQUFLQyxNQUFMLEdBQWNOLE9BQU8sQ0FBQ00sTUFBdEI7QUFDQSxVQUFLQyxLQUFMLEdBQWFQLE9BQU8sQ0FBQ08sS0FBckI7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFYbUI7QUFZcEI7OztFQWJvQ2IsYTs7QUFnQnZDYyxNQUFNLENBQUNDLE9BQVAsR0FBaUJiLHdCQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgRGF0YWJhc2VFcnJvciA9IHJlcXVpcmUoJy4vLi4vZGF0YWJhc2UtZXJyb3InKTtcblxuLyoqXG4gKiBUaHJvd24gd2hlbiBhbiBleGNsdXNpb24gY29uc3RyYWludCBpcyB2aW9sYXRlZCBpbiB0aGUgZGF0YWJhc2VcbiAqL1xuY2xhc3MgRXhjbHVzaW9uQ29uc3RyYWludEVycm9yIGV4dGVuZHMgRGF0YWJhc2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLnBhcmVudCA9IG9wdGlvbnMucGFyZW50IHx8IHsgc3FsOiAnJyB9O1xuXG4gICAgc3VwZXIob3B0aW9ucy5wYXJlbnQpO1xuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVFeGNsdXNpb25Db25zdHJhaW50RXJyb3InO1xuXG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlIHx8IG9wdGlvbnMucGFyZW50Lm1lc3NhZ2UgfHwgJyc7XG4gICAgdGhpcy5jb25zdHJhaW50ID0gb3B0aW9ucy5jb25zdHJhaW50O1xuICAgIHRoaXMuZmllbGRzID0gb3B0aW9ucy5maWVsZHM7XG4gICAgdGhpcy50YWJsZSA9IG9wdGlvbnMudGFibGU7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFeGNsdXNpb25Db25zdHJhaW50RXJyb3I7XG4iXX0=