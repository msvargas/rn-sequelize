'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * Thrown when an association is improperly constructed (see message for details)
 */


let AssociationError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(AssociationError, _BaseError);

  function AssociationError(message) {
    var _this;

    _classCallCheck(this, AssociationError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(AssociationError).call(this, message));
    _this.name = 'SequelizeAssociationError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return AssociationError;
}(BaseError);

module.exports = AssociationError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvYXNzb2NpYXRpb24tZXJyb3IuanMiXSwibmFtZXMiOlsiQmFzZUVycm9yIiwicmVxdWlyZSIsIkFzc29jaWF0aW9uRXJyb3IiLCJtZXNzYWdlIiwibmFtZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLFNBQVMsR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBekI7QUFFQTs7Ozs7SUFHTUMsZ0I7Ozs7O0FBQ0osNEJBQVlDLE9BQVosRUFBcUI7QUFBQTs7QUFBQTs7QUFDbkIsMEZBQU1BLE9BQU47QUFDQSxVQUFLQyxJQUFMLEdBQVksMkJBQVo7QUFDQUMsSUFBQUEsS0FBSyxDQUFDQyxpQkFBTixnQ0FBOEIsTUFBS0MsV0FBbkM7QUFIbUI7QUFJcEI7OztFQUw0QlAsUzs7QUFRL0JRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQlAsZ0JBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgQmFzZUVycm9yID0gcmVxdWlyZSgnLi9iYXNlLWVycm9yJyk7XHJcblxyXG4vKipcclxuICogVGhyb3duIHdoZW4gYW4gYXNzb2NpYXRpb24gaXMgaW1wcm9wZXJseSBjb25zdHJ1Y3RlZCAoc2VlIG1lc3NhZ2UgZm9yIGRldGFpbHMpXHJcbiAqL1xyXG5jbGFzcyBBc3NvY2lhdGlvbkVycm9yIGV4dGVuZHMgQmFzZUVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XHJcbiAgICBzdXBlcihtZXNzYWdlKTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVBc3NvY2lhdGlvbkVycm9yJztcclxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBc3NvY2lhdGlvbkVycm9yO1xyXG4iXX0=