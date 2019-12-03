'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * Thrown when a record was not found, Usually used with rejectOnEmpty mode (see message for details)
 */


let EmptyResultError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(EmptyResultError, _BaseError);

  function EmptyResultError(message) {
    var _this;

    _classCallCheck(this, EmptyResultError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(EmptyResultError).call(this, message));
    _this.name = 'SequelizeEmptyResultError';
    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }

  return EmptyResultError;
}(BaseError);

module.exports = EmptyResultError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvZW1wdHktcmVzdWx0LWVycm9yLmpzIl0sIm5hbWVzIjpbIkJhc2VFcnJvciIsInJlcXVpcmUiLCJFbXB0eVJlc3VsdEVycm9yIiwibWVzc2FnZSIsIm5hbWUiLCJFcnJvciIsImNhcHR1cmVTdGFja1RyYWNlIiwiY29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQXpCO0FBRUE7Ozs7O0lBR01DLGdCOzs7OztBQUNKLDRCQUFZQyxPQUFaLEVBQXFCO0FBQUE7O0FBQUE7O0FBQ25CLDBGQUFNQSxPQUFOO0FBQ0EsVUFBS0MsSUFBTCxHQUFZLDJCQUFaO0FBQ0FDLElBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sZ0NBQThCLE1BQUtDLFdBQW5DO0FBSG1CO0FBSXBCOzs7RUFMNEJQLFM7O0FBUS9CUSxNQUFNLENBQUNDLE9BQVAsR0FBaUJQLGdCQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IEJhc2VFcnJvciA9IHJlcXVpcmUoJy4vYmFzZS1lcnJvcicpO1xyXG5cclxuLyoqXHJcbiAqIFRocm93biB3aGVuIGEgcmVjb3JkIHdhcyBub3QgZm91bmQsIFVzdWFsbHkgdXNlZCB3aXRoIHJlamVjdE9uRW1wdHkgbW9kZSAoc2VlIG1lc3NhZ2UgZm9yIGRldGFpbHMpXHJcbiAqL1xyXG5jbGFzcyBFbXB0eVJlc3VsdEVycm9yIGV4dGVuZHMgQmFzZUVycm9yIHtcclxuICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XHJcbiAgICBzdXBlcihtZXNzYWdlKTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVFbXB0eVJlc3VsdEVycm9yJztcclxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFbXB0eVJlc3VsdEVycm9yO1xyXG4iXX0=