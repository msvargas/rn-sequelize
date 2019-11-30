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