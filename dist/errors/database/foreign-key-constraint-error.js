'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const DatabaseError = require('./../database-error');
/**
 * Thrown when a foreign key constraint is violated in the database
 */


let ForeignKeyConstraintError =
/*#__PURE__*/
function (_DatabaseError) {
  _inherits(ForeignKeyConstraintError, _DatabaseError);

  function ForeignKeyConstraintError(options) {
    var _this;

    _classCallCheck(this, ForeignKeyConstraintError);

    options = options || {};
    options.parent = options.parent || {
      sql: ''
    };
    _this = _possibleConstructorReturn(this, _getPrototypeOf(ForeignKeyConstraintError).call(this, options.parent));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9lcnJvcnMvZGF0YWJhc2UvZm9yZWlnbi1rZXktY29uc3RyYWludC1lcnJvci5qcyJdLCJuYW1lcyI6WyJEYXRhYmFzZUVycm9yIiwicmVxdWlyZSIsIkZvcmVpZ25LZXlDb25zdHJhaW50RXJyb3IiLCJvcHRpb25zIiwicGFyZW50Iiwic3FsIiwibmFtZSIsIm1lc3NhZ2UiLCJmaWVsZHMiLCJ0YWJsZSIsInZhbHVlIiwiaW5kZXgiLCJyZWx0eXBlIiwiRXJyb3IiLCJjYXB0dXJlU3RhY2tUcmFjZSIsImNvbnN0cnVjdG9yIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsYUFBYSxHQUFHQyxPQUFPLENBQUMscUJBQUQsQ0FBN0I7QUFFQTs7Ozs7SUFHTUMseUI7Ozs7O0FBQ0oscUNBQVlDLE9BQVosRUFBcUI7QUFBQTs7QUFBQTs7QUFDbkJBLElBQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCO0FBQ0FBLElBQUFBLE9BQU8sQ0FBQ0MsTUFBUixHQUFpQkQsT0FBTyxDQUFDQyxNQUFSLElBQWtCO0FBQUVDLE1BQUFBLEdBQUcsRUFBRTtBQUFQLEtBQW5DO0FBRUEsbUdBQU1GLE9BQU8sQ0FBQ0MsTUFBZDtBQUNBLFVBQUtFLElBQUwsR0FBWSxvQ0FBWjtBQUVBLFVBQUtDLE9BQUwsR0FBZUosT0FBTyxDQUFDSSxPQUFSLElBQW1CSixPQUFPLENBQUNDLE1BQVIsQ0FBZUcsT0FBbEMsSUFBNkMsZ0JBQTVEO0FBQ0EsVUFBS0MsTUFBTCxHQUFjTCxPQUFPLENBQUNLLE1BQXRCO0FBQ0EsVUFBS0MsS0FBTCxHQUFhTixPQUFPLENBQUNNLEtBQXJCO0FBQ0EsVUFBS0MsS0FBTCxHQUFhUCxPQUFPLENBQUNPLEtBQXJCO0FBQ0EsVUFBS0MsS0FBTCxHQUFhUixPQUFPLENBQUNRLEtBQXJCO0FBQ0EsVUFBS0MsT0FBTCxHQUFlVCxPQUFPLENBQUNTLE9BQXZCO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBYm1CO0FBY3BCOzs7RUFmcUNmLGE7O0FBa0J4Q2dCLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQmYseUJBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgRGF0YWJhc2VFcnJvciA9IHJlcXVpcmUoJy4vLi4vZGF0YWJhc2UtZXJyb3InKTtcclxuXHJcbi8qKlxyXG4gKiBUaHJvd24gd2hlbiBhIGZvcmVpZ24ga2V5IGNvbnN0cmFpbnQgaXMgdmlvbGF0ZWQgaW4gdGhlIGRhdGFiYXNlXHJcbiAqL1xyXG5jbGFzcyBGb3JlaWduS2V5Q29uc3RyYWludEVycm9yIGV4dGVuZHMgRGF0YWJhc2VFcnJvciB7XHJcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBvcHRpb25zLnBhcmVudCA9IG9wdGlvbnMucGFyZW50IHx8IHsgc3FsOiAnJyB9O1xyXG5cclxuICAgIHN1cGVyKG9wdGlvbnMucGFyZW50KTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVGb3JlaWduS2V5Q29uc3RyYWludEVycm9yJztcclxuXHJcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgb3B0aW9ucy5wYXJlbnQubWVzc2FnZSB8fCAnRGF0YWJhc2UgRXJyb3InO1xyXG4gICAgdGhpcy5maWVsZHMgPSBvcHRpb25zLmZpZWxkcztcclxuICAgIHRoaXMudGFibGUgPSBvcHRpb25zLnRhYmxlO1xyXG4gICAgdGhpcy52YWx1ZSA9IG9wdGlvbnMudmFsdWU7XHJcbiAgICB0aGlzLmluZGV4ID0gb3B0aW9ucy5pbmRleDtcclxuICAgIHRoaXMucmVsdHlwZSA9IG9wdGlvbnMucmVsdHlwZTtcclxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JlaWduS2V5Q29uc3RyYWludEVycm9yO1xyXG4iXX0=