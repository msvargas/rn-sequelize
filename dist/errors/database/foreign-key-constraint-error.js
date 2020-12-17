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
 * Thrown when a foreign key constraint is violated in the database
 */


let ForeignKeyConstraintError = /*#__PURE__*/function (_DatabaseError) {
  _inherits(ForeignKeyConstraintError, _DatabaseError);

  var _super = _createSuper(ForeignKeyConstraintError);

  function ForeignKeyConstraintError(options) {
    var _this;

    _classCallCheck(this, ForeignKeyConstraintError);

    options = options || {};
    options.parent = options.parent || {
      sql: ''
    };
    _this = _super.call(this, options.parent);
    _this.name = 'SequelizeForeignKeyConstraintError';
    _this.message = options.message || options.parent.message || 'Database Error';
    _this.fields = options.fields;
    _this.table = options.table;
    _this.value = options.value;
    _this.index = options.index;
    _this.reltype = options.reltype;
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return ForeignKeyConstraintError;
}(DatabaseError);

module.exports = ForeignKeyConstraintError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UvZm9yZWlnbi1rZXktY29uc3RyYWludC1lcnJvci5qcyJdLCJuYW1lcyI6WyJEYXRhYmFzZUVycm9yIiwicmVxdWlyZSIsIkZvcmVpZ25LZXlDb25zdHJhaW50RXJyb3IiLCJvcHRpb25zIiwicGFyZW50Iiwic3FsIiwibmFtZSIsIm1lc3NhZ2UiLCJmaWVsZHMiLCJ0YWJsZSIsInZhbHVlIiwiaW5kZXgiLCJyZWx0eXBlIiwiRXJyb3IiLCJjYXB0dXJlU3RhY2tUcmFjZSIsImNvbnN0cnVjdG9yIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLGFBQWEsR0FBR0MsT0FBTyxDQUFDLHFCQUFELENBQTdCO0FBRUE7QUFDQTtBQUNBOzs7SUFDTUMseUI7Ozs7O0FBQ0oscUNBQVlDLE9BQVosRUFBcUI7QUFBQTs7QUFBQTs7QUFDbkJBLElBQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCO0FBQ0FBLElBQUFBLE9BQU8sQ0FBQ0MsTUFBUixHQUFpQkQsT0FBTyxDQUFDQyxNQUFSLElBQWtCO0FBQUVDLE1BQUFBLEdBQUcsRUFBRTtBQUFQLEtBQW5DO0FBRUEsOEJBQU1GLE9BQU8sQ0FBQ0MsTUFBZDtBQUNBLFVBQUtFLElBQUwsR0FBWSxvQ0FBWjtBQUVBLFVBQUtDLE9BQUwsR0FBZUosT0FBTyxDQUFDSSxPQUFSLElBQW1CSixPQUFPLENBQUNDLE1BQVIsQ0FBZUcsT0FBbEMsSUFBNkMsZ0JBQTVEO0FBQ0EsVUFBS0MsTUFBTCxHQUFjTCxPQUFPLENBQUNLLE1BQXRCO0FBQ0EsVUFBS0MsS0FBTCxHQUFhTixPQUFPLENBQUNNLEtBQXJCO0FBQ0EsVUFBS0MsS0FBTCxHQUFhUCxPQUFPLENBQUNPLEtBQXJCO0FBQ0EsVUFBS0MsS0FBTCxHQUFhUixPQUFPLENBQUNRLEtBQXJCO0FBQ0EsVUFBS0MsT0FBTCxHQUFlVCxPQUFPLENBQUNTLE9BQXZCO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBYm1CO0FBY3BCOzs7RUFmcUNmLGE7O0FBa0J4Q2dCLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQmYseUJBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBEYXRhYmFzZUVycm9yID0gcmVxdWlyZSgnLi8uLi9kYXRhYmFzZS1lcnJvcicpO1xuXG4vKipcbiAqIFRocm93biB3aGVuIGEgZm9yZWlnbiBrZXkgY29uc3RyYWludCBpcyB2aW9sYXRlZCBpbiB0aGUgZGF0YWJhc2VcbiAqL1xuY2xhc3MgRm9yZWlnbktleUNvbnN0cmFpbnRFcnJvciBleHRlbmRzIERhdGFiYXNlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5wYXJlbnQgPSBvcHRpb25zLnBhcmVudCB8fCB7IHNxbDogJycgfTtcblxuICAgIHN1cGVyKG9wdGlvbnMucGFyZW50KTtcbiAgICB0aGlzLm5hbWUgPSAnU2VxdWVsaXplRm9yZWlnbktleUNvbnN0cmFpbnRFcnJvcic7XG5cbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgb3B0aW9ucy5wYXJlbnQubWVzc2FnZSB8fCAnRGF0YWJhc2UgRXJyb3InO1xuICAgIHRoaXMuZmllbGRzID0gb3B0aW9ucy5maWVsZHM7XG4gICAgdGhpcy50YWJsZSA9IG9wdGlvbnMudGFibGU7XG4gICAgdGhpcy52YWx1ZSA9IG9wdGlvbnMudmFsdWU7XG4gICAgdGhpcy5pbmRleCA9IG9wdGlvbnMuaW5kZXg7XG4gICAgdGhpcy5yZWx0eXBlID0gb3B0aW9ucy5yZWx0eXBlO1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRm9yZWlnbktleUNvbnN0cmFpbnRFcnJvcjtcbiJdfQ==