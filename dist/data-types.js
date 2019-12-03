'use strict';

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const util = require('util');

const _ = require('lodash');

const wkx = require('wkx');

const sequelizeErrors = require('./errors');

const Validator = require('./utils/validator-extras').validator;

const momentTz = require('moment-timezone');

const moment = require('moment');

const {
  logger
} = require('./utils/logger');

const warnings = {};

const {
  classToInvokable
} = require('./utils/classToInvokable');

let ABSTRACT =
/*#__PURE__*/
function () {
  function ABSTRACT() {
    _classCallCheck(this, ABSTRACT);
  }

  _createClass(ABSTRACT, [{
    key: "toString",
    value: function toString(options) {
      return this.toSql(options);
    }
  }, {
    key: "toSql",
    value: function toSql() {
      return this.key;
    }
  }, {
    key: "stringify",
    value: function stringify(value, options) {
      if (this._stringify) {
        return this._stringify(value, options);
      }

      return value;
    }
  }, {
    key: "bindParam",
    value: function bindParam(value, options) {
      if (this._bindParam) {
        return this._bindParam(value, options);
      }

      return options.bindParam(this.stringify(value, options));
    }
  }], [{
    key: "toString",
    value: function toString() {
      return this.name;
    }
  }, {
    key: "warn",
    value: function warn(link, text) {
      if (!warnings[text]) {
        warnings[text] = true;
        logger.warn(`${text} \n>> Check: ${link}`);
      }
    }
  }, {
    key: "extend",
    value: function extend(oldType) {
      return new this(oldType.options);
    }
  }]);

  return ABSTRACT;
}();

ABSTRACT.prototype.dialectTypes = '';
/**
 * STRING A variable length string
 */

let STRING =
/*#__PURE__*/
function (_ABSTRACT) {
  _inherits(STRING, _ABSTRACT);

  /**
   * @param {number} [length=255] length of string
   * @param {boolean} [binary=false] Is this binary?
   */
  function STRING(length, binary) {
    var _this;

    _classCallCheck(this, STRING);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(STRING).call(this));
    const options = typeof length === 'object' && length || {
      length,
      binary
    };
    _this.options = options;
    _this._binary = options.binary;
    _this._length = options.length || 255;
    return _this;
  }

  _createClass(STRING, [{
    key: "toSql",
    value: function toSql() {
      return `VARCHAR(${this._length})${this._binary ? ' BINARY' : ''}`;
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (Object.prototype.toString.call(value) !== '[object String]') {
        if (this.options.binary && Buffer.isBuffer(value) || typeof value === 'number') {
          return true;
        }

        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid string', value));
      }

      return true;
    }
  }, {
    key: "BINARY",
    get: function () {
      this._binary = true;
      this.options.binary = true;
      return this;
    }
  }], [{
    key: "BINARY",
    get: function () {
      return new this().BINARY;
    }
  }]);

  return STRING;
}(ABSTRACT);
/**
 * CHAR A fixed length string
 */


let CHAR =
/*#__PURE__*/
function (_STRING) {
  _inherits(CHAR, _STRING);

  /**
   * @param {number} [length=255] length of string
   * @param {boolean} [binary=false] Is this binary?
   */
  function CHAR(length, binary) {
    _classCallCheck(this, CHAR);

    return _possibleConstructorReturn(this, _getPrototypeOf(CHAR).call(this, typeof length === 'object' && length || {
      length,
      binary
    }));
  }

  _createClass(CHAR, [{
    key: "toSql",
    value: function toSql() {
      return `CHAR(${this._length})${this._binary ? ' BINARY' : ''}`;
    }
  }]);

  return CHAR;
}(STRING);
/**
 * Unlimited length TEXT column
 */


let TEXT =
/*#__PURE__*/
function (_ABSTRACT2) {
  _inherits(TEXT, _ABSTRACT2);

  /**
   * @param {string} [length=''] could be tiny, medium, long.
   */
  function TEXT(length) {
    var _this2;

    _classCallCheck(this, TEXT);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(TEXT).call(this));
    const options = typeof length === 'object' && length || {
      length
    };
    _this2.options = options;
    _this2._length = options.length || '';
    return _this2;
  }

  _createClass(TEXT, [{
    key: "toSql",
    value: function toSql() {
      switch (this._length.toLowerCase()) {
        case 'tiny':
          return 'TINYTEXT';

        case 'medium':
          return 'MEDIUMTEXT';

        case 'long':
          return 'LONGTEXT';

        default:
          return this.key;
      }
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (typeof value !== 'string') {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid string', value));
      }

      return true;
    }
  }]);

  return TEXT;
}(ABSTRACT);
/**
 * An unlimited length case-insensitive text column.
 * Original case is preserved but acts case-insensitive when comparing values (such as when finding or unique constraints).
 * Only available in Postgres and SQLite.
 *
 */


let CITEXT =
/*#__PURE__*/
function (_ABSTRACT3) {
  _inherits(CITEXT, _ABSTRACT3);

  function CITEXT() {
    _classCallCheck(this, CITEXT);

    return _possibleConstructorReturn(this, _getPrototypeOf(CITEXT).apply(this, arguments));
  }

  _createClass(CITEXT, [{
    key: "toSql",
    value: function toSql() {
      return 'CITEXT';
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (typeof value !== 'string') {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid string', value));
      }

      return true;
    }
  }]);

  return CITEXT;
}(ABSTRACT);
/**
 * Base number type which is used to build other types
 */


let NUMBER =
/*#__PURE__*/
function (_ABSTRACT4) {
  _inherits(NUMBER, _ABSTRACT4);

  /**
   * @param {Object} options type options
   * @param {string|number} [options.length] length of type, like `INT(4)`
   * @param {boolean} [options.zerofill] Is zero filled?
   * @param {boolean} [options.unsigned] Is unsigned?
   * @param {string|number} [options.decimals] number of decimal points, used with length `FLOAT(5, 4)`
   * @param {string|number} [options.precision] defines precision for decimal type
   * @param {string|number} [options.scale] defines scale for decimal type
   */
  function NUMBER(options = {}) {
    var _this3;

    _classCallCheck(this, NUMBER);

    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(NUMBER).call(this));

    if (typeof options === 'number') {
      options = {
        length: options
      };
    }

    _this3.options = options;
    _this3._length = options.length;
    _this3._zerofill = options.zerofill;
    _this3._decimals = options.decimals;
    _this3._precision = options.precision;
    _this3._scale = options.scale;
    _this3._unsigned = options.unsigned;
    return _this3;
  }

  _createClass(NUMBER, [{
    key: "toSql",
    value: function toSql() {
      let result = this.key;

      if (this._length) {
        result += `(${this._length}`;

        if (typeof this._decimals === 'number') {
          result += `,${this._decimals}`;
        }

        result += ')';
      }

      if (this._unsigned) {
        result += ' UNSIGNED';
      }

      if (this._zerofill) {
        result += ' ZEROFILL';
      }

      return result;
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (!Validator.isFloat(String(value))) {
        throw new sequelizeErrors.ValidationError(util.format(`%j is not a valid ${this.key.toLowerCase()}`, value));
      }

      return true;
    }
  }, {
    key: "_stringify",
    value: function _stringify(number) {
      if (typeof number === 'number' || typeof number === 'boolean' || number === null || number === undefined) {
        return number;
      }

      if (typeof number.toString === 'function') {
        return number.toString();
      }

      return number;
    }
  }, {
    key: "UNSIGNED",
    get: function () {
      this._unsigned = true;
      this.options.unsigned = true;
      return this;
    }
  }, {
    key: "ZEROFILL",
    get: function () {
      this._zerofill = true;
      this.options.zerofill = true;
      return this;
    }
  }], [{
    key: "UNSIGNED",
    get: function () {
      return new this().UNSIGNED;
    }
  }, {
    key: "ZEROFILL",
    get: function () {
      return new this().ZEROFILL;
    }
  }]);

  return NUMBER;
}(ABSTRACT);
/**
 * A 32 bit integer
 */


let INTEGER =
/*#__PURE__*/
function (_NUMBER) {
  _inherits(INTEGER, _NUMBER);

  function INTEGER() {
    _classCallCheck(this, INTEGER);

    return _possibleConstructorReturn(this, _getPrototypeOf(INTEGER).apply(this, arguments));
  }

  _createClass(INTEGER, [{
    key: "validate",
    value: function validate(value) {
      if (!Validator.isInt(String(value))) {
        throw new sequelizeErrors.ValidationError(util.format(`%j is not a valid ${this.key.toLowerCase()}`, value));
      }

      return true;
    }
  }]);

  return INTEGER;
}(NUMBER);
/**
 * A 8 bit integer
 */


let TINYINT =
/*#__PURE__*/
function (_INTEGER) {
  _inherits(TINYINT, _INTEGER);

  function TINYINT() {
    _classCallCheck(this, TINYINT);

    return _possibleConstructorReturn(this, _getPrototypeOf(TINYINT).apply(this, arguments));
  }

  return TINYINT;
}(INTEGER);
/**
 * A 16 bit integer
 */


let SMALLINT =
/*#__PURE__*/
function (_INTEGER2) {
  _inherits(SMALLINT, _INTEGER2);

  function SMALLINT() {
    _classCallCheck(this, SMALLINT);

    return _possibleConstructorReturn(this, _getPrototypeOf(SMALLINT).apply(this, arguments));
  }

  return SMALLINT;
}(INTEGER);
/**
 * A 24 bit integer
 */


let MEDIUMINT =
/*#__PURE__*/
function (_INTEGER3) {
  _inherits(MEDIUMINT, _INTEGER3);

  function MEDIUMINT() {
    _classCallCheck(this, MEDIUMINT);

    return _possibleConstructorReturn(this, _getPrototypeOf(MEDIUMINT).apply(this, arguments));
  }

  return MEDIUMINT;
}(INTEGER);
/**
 * A 64 bit integer
 */


let BIGINT =
/*#__PURE__*/
function (_INTEGER4) {
  _inherits(BIGINT, _INTEGER4);

  function BIGINT() {
    _classCallCheck(this, BIGINT);

    return _possibleConstructorReturn(this, _getPrototypeOf(BIGINT).apply(this, arguments));
  }

  return BIGINT;
}(INTEGER);
/**
 * Floating point number (4-byte precision).
 */


let FLOAT =
/*#__PURE__*/
function (_NUMBER2) {
  _inherits(FLOAT, _NUMBER2);

  /**
   * @param {string|number} [length] length of type, like `FLOAT(4)`
   * @param {string|number} [decimals] number of decimal points, used with length `FLOAT(5, 4)`
   */
  function FLOAT(length, decimals) {
    _classCallCheck(this, FLOAT);

    return _possibleConstructorReturn(this, _getPrototypeOf(FLOAT).call(this, typeof length === 'object' && length || {
      length,
      decimals
    }));
  }

  _createClass(FLOAT, [{
    key: "validate",
    value: function validate(value) {
      if (!Validator.isFloat(String(value))) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid float', value));
      }

      return true;
    }
  }]);

  return FLOAT;
}(NUMBER);
/**
 * Floating point number (4-byte precision).
 */


let REAL =
/*#__PURE__*/
function (_NUMBER3) {
  _inherits(REAL, _NUMBER3);

  /**
   * @param {string|number} [length] length of type, like `REAL(4)`
   * @param {string|number} [decimals] number of decimal points, used with length `REAL(5, 4)`
   */
  function REAL(length, decimals) {
    _classCallCheck(this, REAL);

    return _possibleConstructorReturn(this, _getPrototypeOf(REAL).call(this, typeof length === 'object' && length || {
      length,
      decimals
    }));
  }

  return REAL;
}(NUMBER);
/**
 * Floating point number (8-byte precision).
 */


let DOUBLE =
/*#__PURE__*/
function (_NUMBER4) {
  _inherits(DOUBLE, _NUMBER4);

  /**
   * @param {string|number} [length] length of type, like `DOUBLE PRECISION(25)`
   * @param {string|number} [decimals] number of decimal points, used with length `DOUBLE PRECISION(25, 10)`
   */
  function DOUBLE(length, decimals) {
    _classCallCheck(this, DOUBLE);

    return _possibleConstructorReturn(this, _getPrototypeOf(DOUBLE).call(this, typeof length === 'object' && length || {
      length,
      decimals
    }));
  }

  return DOUBLE;
}(NUMBER);
/**
 * Decimal type, variable precision, take length as specified by user
 */


let DECIMAL =
/*#__PURE__*/
function (_NUMBER5) {
  _inherits(DECIMAL, _NUMBER5);

  /**
   * @param {string|number} [precision] defines precision
   * @param {string|number} [scale] defines scale
   */
  function DECIMAL(precision, scale) {
    _classCallCheck(this, DECIMAL);

    return _possibleConstructorReturn(this, _getPrototypeOf(DECIMAL).call(this, typeof precision === 'object' && precision || {
      precision,
      scale
    }));
  }

  _createClass(DECIMAL, [{
    key: "toSql",
    value: function toSql() {
      if (this._precision || this._scale) {
        return `DECIMAL(${[this._precision, this._scale].filter(_.identity).join(',')})`;
      }

      return 'DECIMAL';
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (!Validator.isDecimal(String(value))) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid decimal', value));
      }

      return true;
    }
  }]);

  return DECIMAL;
}(NUMBER); // TODO: Create intermediate class


const protoExtensions = {
  escape: false,

  _value(value) {
    if (isNaN(value)) {
      return 'NaN';
    }

    if (!isFinite(value)) {
      const sign = value < 0 ? '-' : '';
      return `${sign}Infinity`;
    }

    return value;
  },

  _stringify(value) {
    return `'${this._value(value)}'`;
  },

  _bindParam(value, options) {
    return options.bindParam(this._value(value));
  }

};

for (const floating of [FLOAT, DOUBLE, REAL]) {
  Object.assign(floating.prototype, protoExtensions);
}
/**
 * A boolean / tinyint column, depending on dialect
 */


let BOOLEAN =
/*#__PURE__*/
function (_ABSTRACT5) {
  _inherits(BOOLEAN, _ABSTRACT5);

  function BOOLEAN() {
    _classCallCheck(this, BOOLEAN);

    return _possibleConstructorReturn(this, _getPrototypeOf(BOOLEAN).apply(this, arguments));
  }

  _createClass(BOOLEAN, [{
    key: "toSql",
    value: function toSql() {
      return 'TINYINT(1)';
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (!Validator.isBoolean(String(value))) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid boolean', value));
      }

      return true;
    }
  }, {
    key: "_sanitize",
    value: function _sanitize(value) {
      if (value !== null && value !== undefined) {
        if (Buffer.isBuffer(value) && value.length === 1) {
          // Bit fields are returned as buffers
          value = value[0];
        }

        const type = typeof value;

        if (type === 'string') {
          // Only take action on valid boolean strings.
          return value === 'true' ? true : value === 'false' ? false : value;
        }

        if (type === 'number') {
          // Only take action on valid boolean integers.
          return value === 1 ? true : value === 0 ? false : value;
        }
      }

      return value;
    }
  }]);

  return BOOLEAN;
}(ABSTRACT);

BOOLEAN.parse = BOOLEAN.prototype._sanitize;
/**
 * A time column
 *
 */

let TIME =
/*#__PURE__*/
function (_ABSTRACT6) {
  _inherits(TIME, _ABSTRACT6);

  function TIME() {
    _classCallCheck(this, TIME);

    return _possibleConstructorReturn(this, _getPrototypeOf(TIME).apply(this, arguments));
  }

  _createClass(TIME, [{
    key: "toSql",
    value: function toSql() {
      return 'TIME';
    }
  }]);

  return TIME;
}(ABSTRACT);
/**
 * Date column with timezone, default is UTC
 */


let DATE =
/*#__PURE__*/
function (_ABSTRACT7) {
  _inherits(DATE, _ABSTRACT7);

  /**
   * @param {string|number} [length] precision to allow storing milliseconds
   */
  function DATE(length) {
    var _this4;

    _classCallCheck(this, DATE);

    _this4 = _possibleConstructorReturn(this, _getPrototypeOf(DATE).call(this));
    const options = typeof length === 'object' && length || {
      length
    };
    _this4.options = options;
    _this4._length = options.length || '';
    return _this4;
  }

  _createClass(DATE, [{
    key: "toSql",
    value: function toSql() {
      return 'DATETIME';
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (!Validator.isDate(String(value))) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid date', value));
      }

      return true;
    }
  }, {
    key: "_sanitize",
    value: function _sanitize(value, options) {
      if ((!options || options && !options.raw) && !(value instanceof Date) && !!value) {
        return new Date(value);
      }

      return value;
    }
  }, {
    key: "_isChanged",
    value: function _isChanged(value, originalValue) {
      if (originalValue && !!value && (value === originalValue || value instanceof Date && originalValue instanceof Date && value.getTime() === originalValue.getTime())) {
        return false;
      } // not changed when set to same empty value


      if (!originalValue && !value && originalValue === value) {
        return false;
      }

      return true;
    }
  }, {
    key: "_applyTimezone",
    value: function _applyTimezone(date, options) {
      if (options.timezone) {
        if (momentTz.tz.zone(options.timezone)) {
          return momentTz(date).tz(options.timezone);
        }

        return date = moment(date).utcOffset(options.timezone);
      }

      return momentTz(date);
    }
  }, {
    key: "_stringify",
    value: function _stringify(date, options) {
      date = this._applyTimezone(date, options); // Z here means current timezone, _not_ UTC

      return date.format('YYYY-MM-DD HH:mm:ss.SSS Z');
    }
  }]);

  return DATE;
}(ABSTRACT);
/**
 * A date only column (no timestamp)
 */


let DATEONLY =
/*#__PURE__*/
function (_ABSTRACT8) {
  _inherits(DATEONLY, _ABSTRACT8);

  function DATEONLY() {
    _classCallCheck(this, DATEONLY);

    return _possibleConstructorReturn(this, _getPrototypeOf(DATEONLY).apply(this, arguments));
  }

  _createClass(DATEONLY, [{
    key: "toSql",
    value: function toSql() {
      return 'DATE';
    }
  }, {
    key: "_stringify",
    value: function _stringify(date) {
      return moment(date).format('YYYY-MM-DD');
    }
  }, {
    key: "_sanitize",
    value: function _sanitize(value, options) {
      if ((!options || options && !options.raw) && !!value) {
        return moment(value).format('YYYY-MM-DD');
      }

      return value;
    }
  }, {
    key: "_isChanged",
    value: function _isChanged(value, originalValue) {
      if (originalValue && !!value && originalValue === value) {
        return false;
      } // not changed when set to same empty value


      if (!originalValue && !value && originalValue === value) {
        return false;
      }

      return true;
    }
  }]);

  return DATEONLY;
}(ABSTRACT);
/**
 * A key / value store column. Only available in Postgres.
 */


let HSTORE =
/*#__PURE__*/
function (_ABSTRACT9) {
  _inherits(HSTORE, _ABSTRACT9);

  function HSTORE() {
    _classCallCheck(this, HSTORE);

    return _possibleConstructorReturn(this, _getPrototypeOf(HSTORE).apply(this, arguments));
  }

  _createClass(HSTORE, [{
    key: "validate",
    value: function validate(value) {
      if (!_.isPlainObject(value)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid hstore', value));
      }

      return true;
    }
  }]);

  return HSTORE;
}(ABSTRACT);
/**
 * A JSON string column. Available in MySQL, Postgres and SQLite
 */


let JSONTYPE =
/*#__PURE__*/
function (_ABSTRACT10) {
  _inherits(JSONTYPE, _ABSTRACT10);

  function JSONTYPE() {
    _classCallCheck(this, JSONTYPE);

    return _possibleConstructorReturn(this, _getPrototypeOf(JSONTYPE).apply(this, arguments));
  }

  _createClass(JSONTYPE, [{
    key: "validate",
    value: function validate() {
      return true;
    }
  }, {
    key: "_stringify",
    value: function _stringify(value) {
      return JSON.stringify(value);
    }
  }]);

  return JSONTYPE;
}(ABSTRACT);
/**
 * A binary storage JSON column. Only available in Postgres.
 */


let JSONB =
/*#__PURE__*/
function (_JSONTYPE) {
  _inherits(JSONB, _JSONTYPE);

  function JSONB() {
    _classCallCheck(this, JSONB);

    return _possibleConstructorReturn(this, _getPrototypeOf(JSONB).apply(this, arguments));
  }

  return JSONB;
}(JSONTYPE);
/**
 * A default value of the current timestamp
 */


let NOW =
/*#__PURE__*/
function (_ABSTRACT11) {
  _inherits(NOW, _ABSTRACT11);

  function NOW() {
    _classCallCheck(this, NOW);

    return _possibleConstructorReturn(this, _getPrototypeOf(NOW).apply(this, arguments));
  }

  return NOW;
}(ABSTRACT);
/**
 * Binary storage
 */


let BLOB =
/*#__PURE__*/
function (_ABSTRACT12) {
  _inherits(BLOB, _ABSTRACT12);

  /**
   * @param {string} [length=''] could be tiny, medium, long.
   */
  function BLOB(length) {
    var _this5;

    _classCallCheck(this, BLOB);

    _this5 = _possibleConstructorReturn(this, _getPrototypeOf(BLOB).call(this));
    const options = typeof length === 'object' && length || {
      length
    };
    _this5.options = options;
    _this5._length = options.length || '';
    return _this5;
  }

  _createClass(BLOB, [{
    key: "toSql",
    value: function toSql() {
      switch (this._length.toLowerCase()) {
        case 'tiny':
          return 'TINYBLOB';

        case 'medium':
          return 'MEDIUMBLOB';

        case 'long':
          return 'LONGBLOB';

        default:
          return this.key;
      }
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (typeof value !== 'string' && !Buffer.isBuffer(value)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid blob', value));
      }

      return true;
    }
  }, {
    key: "_stringify",
    value: function _stringify(value) {
      if (!Buffer.isBuffer(value)) {
        if (Array.isArray(value)) {
          value = Buffer.from(value);
        } else {
          value = Buffer.from(value.toString());
        }
      }

      const hex = value.toString('hex');
      return this._hexify(hex);
    }
  }, {
    key: "_hexify",
    value: function _hexify(hex) {
      return `X'${hex}'`;
    }
  }, {
    key: "_bindParam",
    value: function _bindParam(value, options) {
      if (!Buffer.isBuffer(value)) {
        if (Array.isArray(value)) {
          value = Buffer.from(value);
        } else {
          value = Buffer.from(value.toString());
        }
      }

      return options.bindParam(value);
    }
  }]);

  return BLOB;
}(ABSTRACT);

BLOB.prototype.escape = false;
/**
 * Range types are data types representing a range of values of some element type (called the range's subtype).
 * Only available in Postgres. See [the Postgres documentation](http://www.postgresql.org/docs/9.4/static/rangetypes.html) for more details
 */

let RANGE =
/*#__PURE__*/
function (_ABSTRACT13) {
  _inherits(RANGE, _ABSTRACT13);

  /**
   * @param {ABSTRACT} subtype A subtype for range, like RANGE(DATE)
   */
  function RANGE(subtype) {
    var _this6;

    _classCallCheck(this, RANGE);

    _this6 = _possibleConstructorReturn(this, _getPrototypeOf(RANGE).call(this));
    const options = _.isPlainObject(subtype) ? subtype : {
      subtype
    };
    if (!options.subtype) options.subtype = new INTEGER();

    if (typeof options.subtype === 'function') {
      options.subtype = new options.subtype();
    }

    _this6._subtype = options.subtype.key;
    _this6.options = options;
    return _this6;
  }

  _createClass(RANGE, [{
    key: "validate",
    value: function validate(value) {
      if (!Array.isArray(value)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid range', value));
      }

      if (value.length !== 2) {
        throw new sequelizeErrors.ValidationError('A range must be an array with two elements');
      }

      return true;
    }
  }]);

  return RANGE;
}(ABSTRACT);
/**
 * A column storing a unique universal identifier.
 * Use with `UUIDV1` or `UUIDV4` for default values.
 */


let UUID =
/*#__PURE__*/
function (_ABSTRACT14) {
  _inherits(UUID, _ABSTRACT14);

  function UUID() {
    _classCallCheck(this, UUID);

    return _possibleConstructorReturn(this, _getPrototypeOf(UUID).apply(this, arguments));
  }

  _createClass(UUID, [{
    key: "validate",
    value: function validate(value, options) {
      if (typeof value !== 'string' || !Validator.isUUID(value) && (!options || !options.acceptStrings)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid uuid', value));
      }

      return true;
    }
  }]);

  return UUID;
}(ABSTRACT);
/**
 * A default unique universal identifier generated following the UUID v1 standard
 */


let UUIDV1 =
/*#__PURE__*/
function (_ABSTRACT15) {
  _inherits(UUIDV1, _ABSTRACT15);

  function UUIDV1() {
    _classCallCheck(this, UUIDV1);

    return _possibleConstructorReturn(this, _getPrototypeOf(UUIDV1).apply(this, arguments));
  }

  _createClass(UUIDV1, [{
    key: "validate",
    value: function validate(value, options) {
      if (typeof value !== 'string' || !Validator.isUUID(value) && (!options || !options.acceptStrings)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid uuid', value));
      }

      return true;
    }
  }]);

  return UUIDV1;
}(ABSTRACT);
/**
 * A default unique universal identifier generated following the UUID v4 standard
 */


let UUIDV4 =
/*#__PURE__*/
function (_ABSTRACT16) {
  _inherits(UUIDV4, _ABSTRACT16);

  function UUIDV4() {
    _classCallCheck(this, UUIDV4);

    return _possibleConstructorReturn(this, _getPrototypeOf(UUIDV4).apply(this, arguments));
  }

  _createClass(UUIDV4, [{
    key: "validate",
    value: function validate(value, options) {
      if (typeof value !== 'string' || !Validator.isUUID(value, 4) && (!options || !options.acceptStrings)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid uuidv4', value));
      }

      return true;
    }
  }]);

  return UUIDV4;
}(ABSTRACT);
/**
 * A virtual value that is not stored in the DB. This could for example be useful if you want to provide a default value in your model that is returned to the user but not stored in the DB.
 *
 * You could also use it to validate a value before permuting and storing it. VIRTUAL also takes a return type and dependency fields as arguments
 * If a virtual attribute is present in `attributes` it will automatically pull in the extra fields as well.
 * Return type is mostly useful for setups that rely on types like GraphQL.
 *
 * @example <caption>Checking password length before hashing it</caption>
 * sequelize.define('user', {
 *   password_hash: DataTypes.STRING,
 *   password: {
 *     type: DataTypes.VIRTUAL,
 *     set: function (val) {
 *        // Remember to set the data value, otherwise it won't be validated
 *        this.setDataValue('password', val);
 *        this.setDataValue('password_hash', this.salt + val);
 *      },
 *      validate: {
 *         isLongEnough: function (val) {
 *           if (val.length < 7) {
 *             throw new Error("Please choose a longer password")
 *          }
 *       }
 *     }
 *   }
 * })
 *
 * # In the above code the password is stored plainly in the password field so it can be validated, but is never stored in the DB.
 *
 * @example <caption>Virtual with dependency fields</caption>
 * {
 *   active: {
 *     type: new DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['createdAt']),
 *     get: function() {
 *       return this.get('createdAt') > Date.now() - (7 * 24 * 60 * 60 * 1000)
 *     }
 *   }
 * }
 *
 */


let VIRTUAL =
/*#__PURE__*/
function (_ABSTRACT17) {
  _inherits(VIRTUAL, _ABSTRACT17);

  /**
   * @param {ABSTRACT} [ReturnType] return type for virtual type
   * @param {Array} [fields] array of fields this virtual type is dependent on
   */
  function VIRTUAL(ReturnType, fields) {
    var _this7;

    _classCallCheck(this, VIRTUAL);

    _this7 = _possibleConstructorReturn(this, _getPrototypeOf(VIRTUAL).call(this));
    if (typeof ReturnType === 'function') ReturnType = new ReturnType();
    _this7.returnType = ReturnType;
    _this7.fields = fields;
    return _this7;
  }

  return VIRTUAL;
}(ABSTRACT);
/**
 * An enumeration, Postgres Only
 *
 * @example
 * DataTypes.ENUM('value', 'another value')
 * DataTypes.ENUM(['value', 'another value'])
 * DataTypes.ENUM({
 *   values: ['value', 'another value']
 * })
 */


let ENUM =
/*#__PURE__*/
function (_ABSTRACT18) {
  _inherits(ENUM, _ABSTRACT18);

  /**
   * @param {...any|{ values: any[] }|any[]} args either array of values or options object with values array. It also supports variadic values
   */
  function ENUM(...args) {
    var _this8;

    _classCallCheck(this, ENUM);

    _this8 = _possibleConstructorReturn(this, _getPrototypeOf(ENUM).call(this));
    const value = args[0];
    const options = typeof value === 'object' && !Array.isArray(value) && value || {
      values: args.reduce((result, element) => {
        return result.concat(Array.isArray(element) ? element : [element]);
      }, [])
    };
    _this8.values = options.values;
    _this8.options = options;
    return _this8;
  }

  _createClass(ENUM, [{
    key: "validate",
    value: function validate(value) {
      if (!this.values.includes(value)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid choice in %j', value, this.values));
      }

      return true;
    }
  }]);

  return ENUM;
}(ABSTRACT);
/**
 * An array of `type`. Only available in Postgres.
 *
 * @example
 * DataTypes.ARRAY(DataTypes.DECIMAL)
 */


let ARRAY =
/*#__PURE__*/
function (_ABSTRACT19) {
  _inherits(ARRAY, _ABSTRACT19);

  /**
   * @param {ABSTRACT} type type of array values
   */
  function ARRAY(type) {
    var _this9;

    _classCallCheck(this, ARRAY);

    _this9 = _possibleConstructorReturn(this, _getPrototypeOf(ARRAY).call(this));
    const options = _.isPlainObject(type) ? type : {
      type
    };
    _this9.options = options;
    _this9.type = typeof options.type === 'function' ? new options.type() : options.type;
    return _this9;
  }

  _createClass(ARRAY, [{
    key: "toSql",
    value: function toSql() {
      return `${this.type.toSql()}[]`;
    }
  }, {
    key: "validate",
    value: function validate(value) {
      if (!Array.isArray(value)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid array', value));
      }

      return true;
    }
  }], [{
    key: "is",
    value: function is(obj, type) {
      return obj instanceof ARRAY && obj.type instanceof type;
    }
  }]);

  return ARRAY;
}(ABSTRACT);
/**
 * A column storing Geometry information.
 * It is only available in PostgreSQL (with PostGIS), MariaDB or MySQL.
 *
 * GeoJSON is accepted as input and returned as output.
 *
 * In PostGIS, the GeoJSON is parsed using the PostGIS function `ST_GeomFromGeoJSON`.
 * In MySQL it is parsed using the function `GeomFromText`.
 *
 * Therefore, one can just follow the [GeoJSON spec](http://geojson.org/geojson-spec.html) for handling geometry objects.  See the following examples:
 *
 * @example <caption>Defining a Geometry type attribute</caption>
 * DataTypes.GEOMETRY
 * DataTypes.GEOMETRY('POINT')
 * DataTypes.GEOMETRY('POINT', 4326)
 *
 * @example <caption>Create a new point</caption>
 * const point = { type: 'Point', coordinates: [39.807222,-76.984722]};
 *
 * User.create({username: 'username', geometry: point });
 *
 * @example <caption>Create a new linestring</caption>
 * const line = { type: 'LineString', 'coordinates': [ [100.0, 0.0], [101.0, 1.0] ] };
 *
 * User.create({username: 'username', geometry: line });
 *
 * @example <caption>Create a new polygon</caption>
 * const polygon = { type: 'Polygon', coordinates: [
 *                 [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
 *                   [100.0, 1.0], [100.0, 0.0] ]
 *                 ]};
 *
 * User.create({username: 'username', geometry: polygon });
 *
 * @example <caption>Create a new point with a custom SRID</caption>
 * const point = {
 *   type: 'Point',
 *   coordinates: [39.807222,-76.984722],
 *   crs: { type: 'name', properties: { name: 'EPSG:4326'} }
 * };
 *
 * User.create({username: 'username', geometry: point })
 *
 *
 * @see {@link DataTypes.GEOGRAPHY}
 */


let GEOMETRY =
/*#__PURE__*/
function (_ABSTRACT20) {
  _inherits(GEOMETRY, _ABSTRACT20);

  /**
   * @param {string} [type] Type of geometry data
   * @param {string} [srid] SRID of type
   */
  function GEOMETRY(type, srid) {
    var _this10;

    _classCallCheck(this, GEOMETRY);

    _this10 = _possibleConstructorReturn(this, _getPrototypeOf(GEOMETRY).call(this));
    const options = _.isPlainObject(type) ? type : {
      type,
      srid
    };
    _this10.options = options;
    _this10.type = options.type;
    _this10.srid = options.srid;
    return _this10;
  }

  _createClass(GEOMETRY, [{
    key: "_stringify",
    value: function _stringify(value, options) {
      return `GeomFromText(${options.escape(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
    }
  }, {
    key: "_bindParam",
    value: function _bindParam(value, options) {
      return `GeomFromText(${options.bindParam(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
    }
  }]);

  return GEOMETRY;
}(ABSTRACT);

GEOMETRY.prototype.escape = false;
/**
 * A geography datatype represents two dimensional spacial objects in an elliptic coord system.
 *
 * __The difference from geometry and geography type:__
 *
 * PostGIS 1.5 introduced a new spatial type called geography, which uses geodetic measurement instead of Cartesian measurement.
 * Coordinate points in the geography type are always represented in WGS 84 lon lat degrees (SRID 4326),
 * but measurement functions and relationships ST_Distance, ST_DWithin, ST_Length, and ST_Area always return answers in meters or assume inputs in meters.
 *
 * __What is best to use? It depends:__
 *
 * When choosing between the geometry and geography type for data storage, you should consider what you’ll be using it for.
 * If all you do are simple measurements and relationship checks on your data, and your data covers a fairly large area, then most likely you’ll be better off storing your data using the new geography type.
 * Although the new geography data type can cover the globe, the geometry type is far from obsolete.
 * The geometry type has a much richer set of functions than geography, relationship checks are generally faster, and it has wider support currently across desktop and web-mapping tools
 *
 * @example <caption>Defining a Geography type attribute</caption>
 * DataTypes.GEOGRAPHY
 * DataTypes.GEOGRAPHY('POINT')
 * DataTypes.GEOGRAPHY('POINT', 4326)
 */

let GEOGRAPHY =
/*#__PURE__*/
function (_ABSTRACT21) {
  _inherits(GEOGRAPHY, _ABSTRACT21);

  /**
   * @param {string} [type] Type of geography data
   * @param {string} [srid] SRID of type
   */
  function GEOGRAPHY(type, srid) {
    var _this11;

    _classCallCheck(this, GEOGRAPHY);

    _this11 = _possibleConstructorReturn(this, _getPrototypeOf(GEOGRAPHY).call(this));
    const options = _.isPlainObject(type) ? type : {
      type,
      srid
    };
    _this11.options = options;
    _this11.type = options.type;
    _this11.srid = options.srid;
    return _this11;
  }

  _createClass(GEOGRAPHY, [{
    key: "_stringify",
    value: function _stringify(value, options) {
      return `GeomFromText(${options.escape(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
    }
  }, {
    key: "_bindParam",
    value: function _bindParam(value, options) {
      return `GeomFromText(${options.bindParam(wkx.Geometry.parseGeoJSON(value).toWkt())})`;
    }
  }]);

  return GEOGRAPHY;
}(ABSTRACT);

GEOGRAPHY.prototype.escape = false;
/**
 * The cidr type holds an IPv4 or IPv6 network specification. Takes 7 or 19 bytes.
 *
 * Only available for Postgres
 */

let CIDR =
/*#__PURE__*/
function (_ABSTRACT22) {
  _inherits(CIDR, _ABSTRACT22);

  function CIDR() {
    _classCallCheck(this, CIDR);

    return _possibleConstructorReturn(this, _getPrototypeOf(CIDR).apply(this, arguments));
  }

  _createClass(CIDR, [{
    key: "validate",
    value: function validate(value) {
      if (typeof value !== 'string' || !Validator.isIPRange(value)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid CIDR', value));
      }

      return true;
    }
  }]);

  return CIDR;
}(ABSTRACT);
/**
 * The INET type holds an IPv4 or IPv6 host address, and optionally its subnet. Takes 7 or 19 bytes
 *
 * Only available for Postgres
 */


let INET =
/*#__PURE__*/
function (_ABSTRACT23) {
  _inherits(INET, _ABSTRACT23);

  function INET() {
    _classCallCheck(this, INET);

    return _possibleConstructorReturn(this, _getPrototypeOf(INET).apply(this, arguments));
  }

  _createClass(INET, [{
    key: "validate",
    value: function validate(value) {
      if (typeof value !== 'string' || !Validator.isIP(value)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid INET', value));
      }

      return true;
    }
  }]);

  return INET;
}(ABSTRACT);
/**
 * The MACADDR type stores MAC addresses. Takes 6 bytes
 *
 * Only available for Postgres
 *
 */


let MACADDR =
/*#__PURE__*/
function (_ABSTRACT24) {
  _inherits(MACADDR, _ABSTRACT24);

  function MACADDR() {
    _classCallCheck(this, MACADDR);

    return _possibleConstructorReturn(this, _getPrototypeOf(MACADDR).apply(this, arguments));
  }

  _createClass(MACADDR, [{
    key: "validate",
    value: function validate(value) {
      if (typeof value !== 'string' || !Validator.isMACAddress(value)) {
        throw new sequelizeErrors.ValidationError(util.format('%j is not a valid MACADDR', value));
      }

      return true;
    }
  }]);

  return MACADDR;
}(ABSTRACT);
/**
 * A convenience class holding commonly used data types. The data types are used when defining a new model using `Sequelize.define`, like this:
 * ```js
 * sequelize.define('model', {
 *   column: DataTypes.INTEGER
 * })
 * ```
 * When defining a model you can just as easily pass a string as type, but often using the types defined here is beneficial. For example, using `DataTypes.BLOB`, mean
 * that that column will be returned as an instance of `Buffer` when being fetched by sequelize.
 *
 * To provide a length for the data type, you can invoke it like a function: `INTEGER(2)`
 *
 * Some data types have special properties that can be accessed in order to change the data type.
 * For example, to get an unsigned integer with zerofill you can do `DataTypes.INTEGER.UNSIGNED.ZEROFILL`.
 * The order you access the properties in do not matter, so `DataTypes.INTEGER.ZEROFILL.UNSIGNED` is fine as well.
 *
 * * All number types (`INTEGER`, `BIGINT`, `FLOAT`, `DOUBLE`, `REAL`, `DECIMAL`) expose the properties `UNSIGNED` and `ZEROFILL`
 * * The `CHAR` and `STRING` types expose the `BINARY` property
 *
 * Three of the values provided here (`NOW`, `UUIDV1` and `UUIDV4`) are special default values, that should not be used to define types. Instead they are used as shorthands for
 * defining default values. For example, to get a uuid field with a default value generated following v1 of the UUID standard:
 * ```js
 * sequelize.define('model', {
 *   uuid: {
 *     type: DataTypes.UUID,
 *     defaultValue: DataTypes.UUIDV1,
 *     primaryKey: true
 *   }
 * })
 * ```
 * There may be times when you want to generate your own UUID conforming to some other algorithm. This is accomplished
 * using the defaultValue property as well, but instead of specifying one of the supplied UUID types, you return a value
 * from a function.
 * ```js
 * sequelize.define('model', {
 *   uuid: {
 *     type: DataTypes.UUID,
 *     defaultValue: function() {
 *       return generateMyId()
 *     },
 *     primaryKey: true
 *   }
 * })
 * ```
 */


const DataTypes = module.exports = {
  ABSTRACT,
  STRING,
  CHAR,
  TEXT,
  NUMBER,
  TINYINT,
  SMALLINT,
  MEDIUMINT,
  INTEGER,
  BIGINT,
  FLOAT,
  TIME,
  DATE,
  DATEONLY,
  BOOLEAN,
  NOW,
  BLOB,
  DECIMAL,
  NUMERIC: DECIMAL,
  UUID,
  UUIDV1,
  UUIDV4,
  HSTORE,
  JSON: JSONTYPE,
  JSONB,
  VIRTUAL,
  ARRAY,
  ENUM,
  RANGE,
  REAL,
  'DOUBLE PRECISION': DOUBLE,
  DOUBLE,
  GEOMETRY,
  GEOGRAPHY,
  CIDR,
  INET,
  MACADDR,
  CITEXT
};

_.each(DataTypes, (dataType, name) => {
  // guard for aliases
  if (!Object.prototype.hasOwnProperty.call(dataType, 'key')) {
    dataType.types = {};
    dataType.key = dataType.prototype.key = name;
  }
});

const dialectMap = {};
/* dialectMap.postgres = require('./dialects/postgres/data-types')(DataTypes);
dialectMap.mysql = require('./dialects/mysql/data-types')(DataTypes);
dialectMap.mariadb = require('./dialects/mariadb/data-types')(DataTypes); */

dialectMap.sqlite = require('./dialects/sqlite/data-types')(DataTypes);
/* dialectMap.mssql = require('./dialects/mssql/data-types')(DataTypes); */

const dialectList = _.values(dialectMap);

for (const dataTypes of dialectList) {
  _.each(dataTypes, (DataType, key) => {
    if (!DataType.key) {
      DataType.key = DataType.prototype.key = key;
    }
  });
} // Wrap all data types to not require `new`


for (const dataTypes of [DataTypes, ...dialectList]) {
  _.each(dataTypes, (DataType, key) => {
    dataTypes[key] = classToInvokable(DataType);
  });
}

Object.assign(DataTypes, dialectMap);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9kYXRhLXR5cGVzLmpzIl0sIm5hbWVzIjpbInV0aWwiLCJyZXF1aXJlIiwiXyIsIndreCIsInNlcXVlbGl6ZUVycm9ycyIsIlZhbGlkYXRvciIsInZhbGlkYXRvciIsIm1vbWVudFR6IiwibW9tZW50IiwibG9nZ2VyIiwid2FybmluZ3MiLCJjbGFzc1RvSW52b2thYmxlIiwiQUJTVFJBQ1QiLCJvcHRpb25zIiwidG9TcWwiLCJrZXkiLCJ2YWx1ZSIsIl9zdHJpbmdpZnkiLCJfYmluZFBhcmFtIiwiYmluZFBhcmFtIiwic3RyaW5naWZ5IiwibmFtZSIsImxpbmsiLCJ0ZXh0Iiwid2FybiIsIm9sZFR5cGUiLCJwcm90b3R5cGUiLCJkaWFsZWN0VHlwZXMiLCJTVFJJTkciLCJsZW5ndGgiLCJiaW5hcnkiLCJfYmluYXJ5IiwiX2xlbmd0aCIsIk9iamVjdCIsInRvU3RyaW5nIiwiY2FsbCIsIkJ1ZmZlciIsImlzQnVmZmVyIiwiVmFsaWRhdGlvbkVycm9yIiwiZm9ybWF0IiwiQklOQVJZIiwiQ0hBUiIsIlRFWFQiLCJ0b0xvd2VyQ2FzZSIsIkNJVEVYVCIsIk5VTUJFUiIsIl96ZXJvZmlsbCIsInplcm9maWxsIiwiX2RlY2ltYWxzIiwiZGVjaW1hbHMiLCJfcHJlY2lzaW9uIiwicHJlY2lzaW9uIiwiX3NjYWxlIiwic2NhbGUiLCJfdW5zaWduZWQiLCJ1bnNpZ25lZCIsInJlc3VsdCIsImlzRmxvYXQiLCJTdHJpbmciLCJudW1iZXIiLCJ1bmRlZmluZWQiLCJVTlNJR05FRCIsIlpFUk9GSUxMIiwiSU5URUdFUiIsImlzSW50IiwiVElOWUlOVCIsIlNNQUxMSU5UIiwiTUVESVVNSU5UIiwiQklHSU5UIiwiRkxPQVQiLCJSRUFMIiwiRE9VQkxFIiwiREVDSU1BTCIsImZpbHRlciIsImlkZW50aXR5Iiwiam9pbiIsImlzRGVjaW1hbCIsInByb3RvRXh0ZW5zaW9ucyIsImVzY2FwZSIsIl92YWx1ZSIsImlzTmFOIiwiaXNGaW5pdGUiLCJzaWduIiwiZmxvYXRpbmciLCJhc3NpZ24iLCJCT09MRUFOIiwiaXNCb29sZWFuIiwidHlwZSIsInBhcnNlIiwiX3Nhbml0aXplIiwiVElNRSIsIkRBVEUiLCJpc0RhdGUiLCJyYXciLCJEYXRlIiwib3JpZ2luYWxWYWx1ZSIsImdldFRpbWUiLCJkYXRlIiwidGltZXpvbmUiLCJ0eiIsInpvbmUiLCJ1dGNPZmZzZXQiLCJfYXBwbHlUaW1lem9uZSIsIkRBVEVPTkxZIiwiSFNUT1JFIiwiaXNQbGFpbk9iamVjdCIsIkpTT05UWVBFIiwiSlNPTiIsIkpTT05CIiwiTk9XIiwiQkxPQiIsIkFycmF5IiwiaXNBcnJheSIsImZyb20iLCJoZXgiLCJfaGV4aWZ5IiwiUkFOR0UiLCJzdWJ0eXBlIiwiX3N1YnR5cGUiLCJVVUlEIiwiaXNVVUlEIiwiYWNjZXB0U3RyaW5ncyIsIlVVSURWMSIsIlVVSURWNCIsIlZJUlRVQUwiLCJSZXR1cm5UeXBlIiwiZmllbGRzIiwicmV0dXJuVHlwZSIsIkVOVU0iLCJhcmdzIiwidmFsdWVzIiwicmVkdWNlIiwiZWxlbWVudCIsImNvbmNhdCIsImluY2x1ZGVzIiwiQVJSQVkiLCJvYmoiLCJHRU9NRVRSWSIsInNyaWQiLCJHZW9tZXRyeSIsInBhcnNlR2VvSlNPTiIsInRvV2t0IiwiR0VPR1JBUEhZIiwiQ0lEUiIsImlzSVBSYW5nZSIsIklORVQiLCJpc0lQIiwiTUFDQUREUiIsImlzTUFDQWRkcmVzcyIsIkRhdGFUeXBlcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJOVU1FUklDIiwiZWFjaCIsImRhdGFUeXBlIiwiaGFzT3duUHJvcGVydHkiLCJ0eXBlcyIsImRpYWxlY3RNYXAiLCJzcWxpdGUiLCJkaWFsZWN0TGlzdCIsImRhdGFUeXBlcyIsIkRhdGFUeXBlIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsSUFBSSxHQUFHQyxPQUFPLENBQUMsTUFBRCxDQUFwQjs7QUFDQSxNQUFNQyxDQUFDLEdBQUdELE9BQU8sQ0FBQyxRQUFELENBQWpCOztBQUNBLE1BQU1F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LFFBQUQsRUFBV2xKLEdBQVgsS0FBbUI7QUFDbkMsUUFBSSxDQUFDa0osUUFBUSxDQUFDbEosR0FBZCxFQUFtQjtBQUNqQmtKLE1BQUFBLFFBQVEsQ0FBQ2xKLEdBQVQsR0FBZWtKLFFBQVEsQ0FBQ3ZJLFNBQVQsQ0FBbUJYLEdBQW5CLEdBQXlCQSxHQUF4QztBQUNEO0FBQ0YsR0FKRDtBQUtELEMsQ0FFRDs7O0FBQ0EsS0FBSyxNQUFNaUosU0FBWCxJQUF3QixDQUFDWCxTQUFELEVBQVksR0FBR1UsV0FBZixDQUF4QixFQUFxRDtBQUNuRDdKLEVBQUFBLENBQUMsQ0FBQ3VKLElBQUYsQ0FBT08sU0FBUCxFQUFrQixDQUFDQyxRQUFELEVBQVdsSixHQUFYLEtBQW1CO0FBQ25DaUosSUFBQUEsU0FBUyxDQUFDakosR0FBRCxDQUFULEdBQWlCSixnQkFBZ0IsQ0FBQ3NKLFFBQUQsQ0FBakM7QUFDRCxHQUZEO0FBR0Q7O0FBRURoSSxNQUFNLENBQUNtRCxNQUFQLENBQWNpRSxTQUFkLEVBQXlCUSxVQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuY29uc3Qgd2t4ID0gcmVxdWlyZSgnd2t4Jyk7XHJcbmNvbnN0IHNlcXVlbGl6ZUVycm9ycyA9IHJlcXVpcmUoJy4vZXJyb3JzJyk7XHJcbmNvbnN0IFZhbGlkYXRvciA9IHJlcXVpcmUoJy4vdXRpbHMvdmFsaWRhdG9yLWV4dHJhcycpLnZhbGlkYXRvcjtcclxuY29uc3QgbW9tZW50VHogPSByZXF1aXJlKCdtb21lbnQtdGltZXpvbmUnKTtcclxuY29uc3QgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbmNvbnN0IHsgbG9nZ2VyIH0gPSByZXF1aXJlKCcuL3V0aWxzL2xvZ2dlcicpO1xyXG5jb25zdCB3YXJuaW5ncyA9IHt9O1xyXG5jb25zdCB7IGNsYXNzVG9JbnZva2FibGUgfSA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NUb0ludm9rYWJsZScpO1xyXG5cclxuY2xhc3MgQUJTVFJBQ1Qge1xyXG4gIHRvU3RyaW5nKG9wdGlvbnMpIHtcclxuICAgIHJldHVybiB0aGlzLnRvU3FsKG9wdGlvbnMpO1xyXG4gIH1cclxuICB0b1NxbCgpIHtcclxuICAgIHJldHVybiB0aGlzLmtleTtcclxuICB9XHJcbiAgc3RyaW5naWZ5KHZhbHVlLCBvcHRpb25zKSB7XHJcbiAgICBpZiAodGhpcy5fc3RyaW5naWZ5KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9zdHJpbmdpZnkodmFsdWUsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG4gIH1cclxuICBiaW5kUGFyYW0odmFsdWUsIG9wdGlvbnMpIHtcclxuICAgIGlmICh0aGlzLl9iaW5kUGFyYW0pIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2JpbmRQYXJhbSh2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb3B0aW9ucy5iaW5kUGFyYW0odGhpcy5zdHJpbmdpZnkodmFsdWUsIG9wdGlvbnMpKTtcclxuICB9XHJcbiAgc3RhdGljIHRvU3RyaW5nKCkge1xyXG4gICAgcmV0dXJuIHRoaXMubmFtZTtcclxuICB9XHJcbiAgc3RhdGljIHdhcm4obGluaywgdGV4dCkge1xyXG4gICAgaWYgKCF3YXJuaW5nc1t0ZXh0XSkge1xyXG4gICAgICB3YXJuaW5nc1t0ZXh0XSA9IHRydWU7XHJcbiAgICAgIGxvZ2dlci53YXJuKGAke3RleHR9IFxcbj4+IENoZWNrOiAke2xpbmt9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHN0YXRpYyBleHRlbmQob2xkVHlwZSkge1xyXG4gICAgcmV0dXJuIG5ldyB0aGlzKG9sZFR5cGUub3B0aW9ucyk7XHJcbiAgfVxyXG59XHJcblxyXG5BQlNUUkFDVC5wcm90b3R5cGUuZGlhbGVjdFR5cGVzID0gJyc7XHJcblxyXG4vKipcclxuICogU1RSSU5HIEEgdmFyaWFibGUgbGVuZ3RoIHN0cmluZ1xyXG4gKi9cclxuY2xhc3MgU1RSSU5HIGV4dGVuZHMgQUJTVFJBQ1Qge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbGVuZ3RoPTI1NV0gbGVuZ3RoIG9mIHN0cmluZ1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2JpbmFyeT1mYWxzZV0gSXMgdGhpcyBiaW5hcnk/XHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IobGVuZ3RoLCBiaW5hcnkpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBjb25zdCBvcHRpb25zID0gdHlwZW9mIGxlbmd0aCA9PT0gJ29iamVjdCcgJiYgbGVuZ3RoIHx8IHsgbGVuZ3RoLCBiaW5hcnkgfTtcclxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICB0aGlzLl9iaW5hcnkgPSBvcHRpb25zLmJpbmFyeTtcclxuICAgIHRoaXMuX2xlbmd0aCA9IG9wdGlvbnMubGVuZ3RoIHx8IDI1NTtcclxuICB9XHJcbiAgdG9TcWwoKSB7XHJcbiAgICByZXR1cm4gYFZBUkNIQVIoJHt0aGlzLl9sZW5ndGh9KSR7dGhpcy5fYmluYXJ5ID8gJyBCSU5BUlknIDogJyd9YDtcclxuICB9XHJcbiAgdmFsaWRhdGUodmFsdWUpIHtcclxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICE9PSAnW29iamVjdCBTdHJpbmddJykge1xyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmJpbmFyeSAmJiBCdWZmZXIuaXNCdWZmZXIodmFsdWUpIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgc3RyaW5nJywgdmFsdWUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgZ2V0IEJJTkFSWSgpIHtcclxuICAgIHRoaXMuX2JpbmFyeSA9IHRydWU7XHJcbiAgICB0aGlzLm9wdGlvbnMuYmluYXJ5ID0gdHJ1ZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldCBCSU5BUlkoKSB7XHJcbiAgICByZXR1cm4gbmV3IHRoaXMoKS5CSU5BUlk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ0hBUiBBIGZpeGVkIGxlbmd0aCBzdHJpbmdcclxuICovXHJcbmNsYXNzIENIQVIgZXh0ZW5kcyBTVFJJTkcge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbGVuZ3RoPTI1NV0gbGVuZ3RoIG9mIHN0cmluZ1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2JpbmFyeT1mYWxzZV0gSXMgdGhpcyBiaW5hcnk/XHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IobGVuZ3RoLCBiaW5hcnkpIHtcclxuICAgIHN1cGVyKHR5cGVvZiBsZW5ndGggPT09ICdvYmplY3QnICYmIGxlbmd0aCB8fCB7IGxlbmd0aCwgYmluYXJ5IH0pO1xyXG4gIH1cclxuICB0b1NxbCgpIHtcclxuICAgIHJldHVybiBgQ0hBUigke3RoaXMuX2xlbmd0aH0pJHt0aGlzLl9iaW5hcnkgPyAnIEJJTkFSWScgOiAnJ31gO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFVubGltaXRlZCBsZW5ndGggVEVYVCBjb2x1bW5cclxuICovXHJcbmNsYXNzIFRFWFQgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsZW5ndGg9JyddIGNvdWxkIGJlIHRpbnksIG1lZGl1bSwgbG9uZy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihsZW5ndGgpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBjb25zdCBvcHRpb25zID0gdHlwZW9mIGxlbmd0aCA9PT0gJ29iamVjdCcgJiYgbGVuZ3RoIHx8IHsgbGVuZ3RoIH07XHJcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgdGhpcy5fbGVuZ3RoID0gb3B0aW9ucy5sZW5ndGggfHwgJyc7XHJcbiAgfVxyXG4gIHRvU3FsKCkge1xyXG4gICAgc3dpdGNoICh0aGlzLl9sZW5ndGgudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICBjYXNlICd0aW55JzpcclxuICAgICAgICByZXR1cm4gJ1RJTllURVhUJztcclxuICAgICAgY2FzZSAnbWVkaXVtJzpcclxuICAgICAgICByZXR1cm4gJ01FRElVTVRFWFQnO1xyXG4gICAgICBjYXNlICdsb25nJzpcclxuICAgICAgICByZXR1cm4gJ0xPTkdURVhUJztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gdGhpcy5rZXk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHZhbGlkYXRlKHZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xyXG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgc3RyaW5nJywgdmFsdWUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIHVubGltaXRlZCBsZW5ndGggY2FzZS1pbnNlbnNpdGl2ZSB0ZXh0IGNvbHVtbi5cclxuICogT3JpZ2luYWwgY2FzZSBpcyBwcmVzZXJ2ZWQgYnV0IGFjdHMgY2FzZS1pbnNlbnNpdGl2ZSB3aGVuIGNvbXBhcmluZyB2YWx1ZXMgKHN1Y2ggYXMgd2hlbiBmaW5kaW5nIG9yIHVuaXF1ZSBjb25zdHJhaW50cykuXHJcbiAqIE9ubHkgYXZhaWxhYmxlIGluIFBvc3RncmVzIGFuZCBTUUxpdGUuXHJcbiAqXHJcbiAqL1xyXG5jbGFzcyBDSVRFWFQgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgdG9TcWwoKSB7XHJcbiAgICByZXR1cm4gJ0NJVEVYVCc7XHJcbiAgfVxyXG4gIHZhbGlkYXRlKHZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xyXG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgc3RyaW5nJywgdmFsdWUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEJhc2UgbnVtYmVyIHR5cGUgd2hpY2ggaXMgdXNlZCB0byBidWlsZCBvdGhlciB0eXBlc1xyXG4gKi9cclxuY2xhc3MgTlVNQkVSIGV4dGVuZHMgQUJTVFJBQ1Qge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIHR5cGUgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW29wdGlvbnMubGVuZ3RoXSBsZW5ndGggb2YgdHlwZSwgbGlrZSBgSU5UKDQpYFxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuemVyb2ZpbGxdIElzIHplcm8gZmlsbGVkP1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudW5zaWduZWRdIElzIHVuc2lnbmVkP1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW29wdGlvbnMuZGVjaW1hbHNdIG51bWJlciBvZiBkZWNpbWFsIHBvaW50cywgdXNlZCB3aXRoIGxlbmd0aCBgRkxPQVQoNSwgNClgXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbb3B0aW9ucy5wcmVjaXNpb25dIGRlZmluZXMgcHJlY2lzaW9uIGZvciBkZWNpbWFsIHR5cGVcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtvcHRpb25zLnNjYWxlXSBkZWZpbmVzIHNjYWxlIGZvciBkZWNpbWFsIHR5cGVcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdudW1iZXInKSB7XHJcbiAgICAgIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgbGVuZ3RoOiBvcHRpb25zXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgdGhpcy5fbGVuZ3RoID0gb3B0aW9ucy5sZW5ndGg7XHJcbiAgICB0aGlzLl96ZXJvZmlsbCA9IG9wdGlvbnMuemVyb2ZpbGw7XHJcbiAgICB0aGlzLl9kZWNpbWFscyA9IG9wdGlvbnMuZGVjaW1hbHM7XHJcbiAgICB0aGlzLl9wcmVjaXNpb24gPSBvcHRpb25zLnByZWNpc2lvbjtcclxuICAgIHRoaXMuX3NjYWxlID0gb3B0aW9ucy5zY2FsZTtcclxuICAgIHRoaXMuX3Vuc2lnbmVkID0gb3B0aW9ucy51bnNpZ25lZDtcclxuICB9XHJcbiAgdG9TcWwoKSB7XHJcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5rZXk7XHJcbiAgICBpZiAodGhpcy5fbGVuZ3RoKSB7XHJcbiAgICAgIHJlc3VsdCArPSBgKCR7dGhpcy5fbGVuZ3RofWA7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fZGVjaW1hbHMgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9IGAsJHt0aGlzLl9kZWNpbWFsc31gO1xyXG4gICAgICB9XHJcbiAgICAgIHJlc3VsdCArPSAnKSc7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5fdW5zaWduZWQpIHtcclxuICAgICAgcmVzdWx0ICs9ICcgVU5TSUdORUQnO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuX3plcm9maWxsKSB7XHJcbiAgICAgIHJlc3VsdCArPSAnIFpFUk9GSUxMJztcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG4gIHZhbGlkYXRlKHZhbHVlKSB7XHJcbiAgICBpZiAoIVZhbGlkYXRvci5pc0Zsb2F0KFN0cmluZyh2YWx1ZSkpKSB7XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KGAlaiBpcyBub3QgYSB2YWxpZCAke3RoaXMua2V5LnRvTG93ZXJDYXNlKCl9YCwgdmFsdWUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuICBfc3RyaW5naWZ5KG51bWJlcikge1xyXG4gICAgaWYgKHR5cGVvZiBudW1iZXIgPT09ICdudW1iZXInIHx8IHR5cGVvZiBudW1iZXIgPT09ICdib29sZWFuJyB8fCBudW1iZXIgPT09IG51bGwgfHwgbnVtYmVyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIG51bWJlcjtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgbnVtYmVyLnRvU3RyaW5nID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHJldHVybiBudW1iZXIudG9TdHJpbmcoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBudW1iZXI7XHJcbiAgfVxyXG5cclxuICBnZXQgVU5TSUdORUQoKSB7XHJcbiAgICB0aGlzLl91bnNpZ25lZCA9IHRydWU7XHJcbiAgICB0aGlzLm9wdGlvbnMudW5zaWduZWQgPSB0cnVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBnZXQgWkVST0ZJTEwoKSB7XHJcbiAgICB0aGlzLl96ZXJvZmlsbCA9IHRydWU7XHJcbiAgICB0aGlzLm9wdGlvbnMuemVyb2ZpbGwgPSB0cnVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZ2V0IFVOU0lHTkVEKCkge1xyXG4gICAgcmV0dXJuIG5ldyB0aGlzKCkuVU5TSUdORUQ7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZ2V0IFpFUk9GSUxMKCkge1xyXG4gICAgcmV0dXJuIG5ldyB0aGlzKCkuWkVST0ZJTEw7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQSAzMiBiaXQgaW50ZWdlclxyXG4gKi9cclxuY2xhc3MgSU5URUdFUiBleHRlbmRzIE5VTUJFUiB7XHJcbiAgdmFsaWRhdGUodmFsdWUpIHtcclxuICAgIGlmICghVmFsaWRhdG9yLmlzSW50KFN0cmluZyh2YWx1ZSkpKSB7XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KGAlaiBpcyBub3QgYSB2YWxpZCAke3RoaXMua2V5LnRvTG93ZXJDYXNlKCl9YCwgdmFsdWUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEEgOCBiaXQgaW50ZWdlclxyXG4gKi9cclxuY2xhc3MgVElOWUlOVCBleHRlbmRzIElOVEVHRVIge1xyXG59XHJcblxyXG4vKipcclxuICogQSAxNiBiaXQgaW50ZWdlclxyXG4gKi9cclxuY2xhc3MgU01BTExJTlQgZXh0ZW5kcyBJTlRFR0VSIHtcclxufVxyXG5cclxuLyoqXHJcbiAqIEEgMjQgYml0IGludGVnZXJcclxuICovXHJcbmNsYXNzIE1FRElVTUlOVCBleHRlbmRzIElOVEVHRVIge1xyXG59XHJcblxyXG4vKipcclxuICogQSA2NCBiaXQgaW50ZWdlclxyXG4gKi9cclxuY2xhc3MgQklHSU5UIGV4dGVuZHMgSU5URUdFUiB7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGbG9hdGluZyBwb2ludCBudW1iZXIgKDQtYnl0ZSBwcmVjaXNpb24pLlxyXG4gKi9cclxuY2xhc3MgRkxPQVQgZXh0ZW5kcyBOVU1CRVIge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW2xlbmd0aF0gbGVuZ3RoIG9mIHR5cGUsIGxpa2UgYEZMT0FUKDQpYFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW2RlY2ltYWxzXSBudW1iZXIgb2YgZGVjaW1hbCBwb2ludHMsIHVzZWQgd2l0aCBsZW5ndGggYEZMT0FUKDUsIDQpYFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGxlbmd0aCwgZGVjaW1hbHMpIHtcclxuICAgIHN1cGVyKHR5cGVvZiBsZW5ndGggPT09ICdvYmplY3QnICYmIGxlbmd0aCB8fCB7IGxlbmd0aCwgZGVjaW1hbHMgfSk7XHJcbiAgfVxyXG4gIHZhbGlkYXRlKHZhbHVlKSB7XHJcbiAgICBpZiAoIVZhbGlkYXRvci5pc0Zsb2F0KFN0cmluZyh2YWx1ZSkpKSB7XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KCclaiBpcyBub3QgYSB2YWxpZCBmbG9hdCcsIHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGbG9hdGluZyBwb2ludCBudW1iZXIgKDQtYnl0ZSBwcmVjaXNpb24pLlxyXG4gKi9cclxuY2xhc3MgUkVBTCBleHRlbmRzIE5VTUJFUiB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbbGVuZ3RoXSBsZW5ndGggb2YgdHlwZSwgbGlrZSBgUkVBTCg0KWBcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtkZWNpbWFsc10gbnVtYmVyIG9mIGRlY2ltYWwgcG9pbnRzLCB1c2VkIHdpdGggbGVuZ3RoIGBSRUFMKDUsIDQpYFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGxlbmd0aCwgZGVjaW1hbHMpIHtcclxuICAgIHN1cGVyKHR5cGVvZiBsZW5ndGggPT09ICdvYmplY3QnICYmIGxlbmd0aCB8fCB7IGxlbmd0aCwgZGVjaW1hbHMgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogRmxvYXRpbmcgcG9pbnQgbnVtYmVyICg4LWJ5dGUgcHJlY2lzaW9uKS5cclxuICovXHJcbmNsYXNzIERPVUJMRSBleHRlbmRzIE5VTUJFUiB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbbGVuZ3RoXSBsZW5ndGggb2YgdHlwZSwgbGlrZSBgRE9VQkxFIFBSRUNJU0lPTigyNSlgXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbZGVjaW1hbHNdIG51bWJlciBvZiBkZWNpbWFsIHBvaW50cywgdXNlZCB3aXRoIGxlbmd0aCBgRE9VQkxFIFBSRUNJU0lPTigyNSwgMTApYFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGxlbmd0aCwgZGVjaW1hbHMpIHtcclxuICAgIHN1cGVyKHR5cGVvZiBsZW5ndGggPT09ICdvYmplY3QnICYmIGxlbmd0aCB8fCB7IGxlbmd0aCwgZGVjaW1hbHMgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogRGVjaW1hbCB0eXBlLCB2YXJpYWJsZSBwcmVjaXNpb24sIHRha2UgbGVuZ3RoIGFzIHNwZWNpZmllZCBieSB1c2VyXHJcbiAqL1xyXG5jbGFzcyBERUNJTUFMIGV4dGVuZHMgTlVNQkVSIHtcclxuICAvKipcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtwcmVjaXNpb25dIGRlZmluZXMgcHJlY2lzaW9uXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbc2NhbGVdIGRlZmluZXMgc2NhbGVcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihwcmVjaXNpb24sIHNjYWxlKSB7XHJcbiAgICBzdXBlcih0eXBlb2YgcHJlY2lzaW9uID09PSAnb2JqZWN0JyAmJiBwcmVjaXNpb24gfHwgeyBwcmVjaXNpb24sIHNjYWxlIH0pO1xyXG4gIH1cclxuICB0b1NxbCgpIHtcclxuICAgIGlmICh0aGlzLl9wcmVjaXNpb24gfHwgdGhpcy5fc2NhbGUpIHtcclxuICAgICAgcmV0dXJuIGBERUNJTUFMKCR7W3RoaXMuX3ByZWNpc2lvbiwgdGhpcy5fc2NhbGVdLmZpbHRlcihfLmlkZW50aXR5KS5qb2luKCcsJyl9KWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJ0RFQ0lNQUwnO1xyXG4gIH1cclxuICB2YWxpZGF0ZSh2YWx1ZSkge1xyXG4gICAgaWYgKCFWYWxpZGF0b3IuaXNEZWNpbWFsKFN0cmluZyh2YWx1ZSkpKSB7XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KCclaiBpcyBub3QgYSB2YWxpZCBkZWNpbWFsJywgdmFsdWUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuLy8gVE9ETzogQ3JlYXRlIGludGVybWVkaWF0ZSBjbGFzc1xyXG5jb25zdCBwcm90b0V4dGVuc2lvbnMgPSB7XHJcbiAgZXNjYXBlOiBmYWxzZSxcclxuICBfdmFsdWUodmFsdWUpIHtcclxuICAgIGlmIChpc05hTih2YWx1ZSkpIHtcclxuICAgICAgcmV0dXJuICdOYU4nO1xyXG4gICAgfVxyXG4gICAgaWYgKCFpc0Zpbml0ZSh2YWx1ZSkpIHtcclxuICAgICAgY29uc3Qgc2lnbiA9IHZhbHVlIDwgMCA/ICctJyA6ICcnO1xyXG4gICAgICByZXR1cm4gYCR7c2lnbn1JbmZpbml0eWA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG4gIH0sXHJcbiAgX3N0cmluZ2lmeSh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIGAnJHt0aGlzLl92YWx1ZSh2YWx1ZSl9J2A7XHJcbiAgfSxcclxuICBfYmluZFBhcmFtKHZhbHVlLCBvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gb3B0aW9ucy5iaW5kUGFyYW0odGhpcy5fdmFsdWUodmFsdWUpKTtcclxuICB9XHJcbn07XHJcblxyXG5mb3IgKGNvbnN0IGZsb2F0aW5nIG9mIFtGTE9BVCwgRE9VQkxFLCBSRUFMXSkge1xyXG4gIE9iamVjdC5hc3NpZ24oZmxvYXRpbmcucHJvdG90eXBlLCBwcm90b0V4dGVuc2lvbnMpO1xyXG59XHJcblxyXG4vKipcclxuICogQSBib29sZWFuIC8gdGlueWludCBjb2x1bW4sIGRlcGVuZGluZyBvbiBkaWFsZWN0XHJcbiAqL1xyXG5jbGFzcyBCT09MRUFOIGV4dGVuZHMgQUJTVFJBQ1Qge1xyXG4gIHRvU3FsKCkge1xyXG4gICAgcmV0dXJuICdUSU5ZSU5UKDEpJztcclxuICB9XHJcbiAgdmFsaWRhdGUodmFsdWUpIHtcclxuICAgIGlmICghVmFsaWRhdG9yLmlzQm9vbGVhbihTdHJpbmcodmFsdWUpKSkge1xyXG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgYm9vbGVhbicsIHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbiAgX3Nhbml0aXplKHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAvLyBCaXQgZmllbGRzIGFyZSByZXR1cm5lZCBhcyBidWZmZXJzXHJcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVswXTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgICBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAvLyBPbmx5IHRha2UgYWN0aW9uIG9uIHZhbGlkIGJvb2xlYW4gc3RyaW5ncy5cclxuICAgICAgICByZXR1cm4gdmFsdWUgPT09ICd0cnVlJyA/IHRydWUgOiB2YWx1ZSA9PT0gJ2ZhbHNlJyA/IGZhbHNlIDogdmFsdWU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHR5cGUgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgLy8gT25seSB0YWtlIGFjdGlvbiBvbiB2YWxpZCBib29sZWFuIGludGVnZXJzLlxyXG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gMSA/IHRydWUgOiB2YWx1ZSA9PT0gMCA/IGZhbHNlIDogdmFsdWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxuICB9XHJcbn1cclxuXHJcblxyXG5CT09MRUFOLnBhcnNlID0gQk9PTEVBTi5wcm90b3R5cGUuX3Nhbml0aXplO1xyXG5cclxuLyoqXHJcbiAqIEEgdGltZSBjb2x1bW5cclxuICpcclxuICovXHJcbmNsYXNzIFRJTUUgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgdG9TcWwoKSB7XHJcbiAgICByZXR1cm4gJ1RJTUUnO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIERhdGUgY29sdW1uIHdpdGggdGltZXpvbmUsIGRlZmF1bHQgaXMgVVRDXHJcbiAqL1xyXG5jbGFzcyBEQVRFIGV4dGVuZHMgQUJTVFJBQ1Qge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW2xlbmd0aF0gcHJlY2lzaW9uIHRvIGFsbG93IHN0b3JpbmcgbWlsbGlzZWNvbmRzXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IobGVuZ3RoKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHR5cGVvZiBsZW5ndGggPT09ICdvYmplY3QnICYmIGxlbmd0aCB8fCB7IGxlbmd0aCB9O1xyXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcclxuICAgIHRoaXMuX2xlbmd0aCA9IG9wdGlvbnMubGVuZ3RoIHx8ICcnO1xyXG4gIH1cclxuICB0b1NxbCgpIHtcclxuICAgIHJldHVybiAnREFURVRJTUUnO1xyXG4gIH1cclxuICB2YWxpZGF0ZSh2YWx1ZSkge1xyXG4gICAgaWYgKCFWYWxpZGF0b3IuaXNEYXRlKFN0cmluZyh2YWx1ZSkpKSB7XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KCclaiBpcyBub3QgYSB2YWxpZCBkYXRlJywgdmFsdWUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuICBfc2FuaXRpemUodmFsdWUsIG9wdGlvbnMpIHtcclxuICAgIGlmICgoIW9wdGlvbnMgfHwgb3B0aW9ucyAmJiAhb3B0aW9ucy5yYXcpICYmICEodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSAmJiAhIXZhbHVlKSB7XHJcbiAgICAgIHJldHVybiBuZXcgRGF0ZSh2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbiAgfVxyXG4gIF9pc0NoYW5nZWQodmFsdWUsIG9yaWdpbmFsVmFsdWUpIHtcclxuICAgIGlmIChvcmlnaW5hbFZhbHVlICYmICEhdmFsdWUgJiZcclxuICAgICAgKHZhbHVlID09PSBvcmlnaW5hbFZhbHVlIHx8XHJcbiAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiBEYXRlICYmIG9yaWdpbmFsVmFsdWUgaW5zdGFuY2VvZiBEYXRlICYmIHZhbHVlLmdldFRpbWUoKSA9PT0gb3JpZ2luYWxWYWx1ZS5nZXRUaW1lKCkpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIG5vdCBjaGFuZ2VkIHdoZW4gc2V0IHRvIHNhbWUgZW1wdHkgdmFsdWVcclxuICAgIGlmICghb3JpZ2luYWxWYWx1ZSAmJiAhdmFsdWUgJiYgb3JpZ2luYWxWYWx1ZSA9PT0gdmFsdWUpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIF9hcHBseVRpbWV6b25lKGRhdGUsIG9wdGlvbnMpIHtcclxuICAgIGlmIChvcHRpb25zLnRpbWV6b25lKSB7XHJcbiAgICAgIGlmIChtb21lbnRUei50ei56b25lKG9wdGlvbnMudGltZXpvbmUpKSB7XHJcbiAgICAgICAgcmV0dXJuIG1vbWVudFR6KGRhdGUpLnR6KG9wdGlvbnMudGltZXpvbmUpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBkYXRlID0gbW9tZW50KGRhdGUpLnV0Y09mZnNldChvcHRpb25zLnRpbWV6b25lKTtcclxuICAgIH1cclxuICAgIHJldHVybiBtb21lbnRUeihkYXRlKTtcclxuICB9XHJcbiAgX3N0cmluZ2lmeShkYXRlLCBvcHRpb25zKSB7XHJcbiAgICBkYXRlID0gdGhpcy5fYXBwbHlUaW1lem9uZShkYXRlLCBvcHRpb25zKTtcclxuICAgIC8vIFogaGVyZSBtZWFucyBjdXJyZW50IHRpbWV6b25lLCBfbm90XyBVVENcclxuICAgIHJldHVybiBkYXRlLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcy5TU1MgWicpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEEgZGF0ZSBvbmx5IGNvbHVtbiAobm8gdGltZXN0YW1wKVxyXG4gKi9cclxuY2xhc3MgREFURU9OTFkgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgdG9TcWwoKSB7XHJcbiAgICByZXR1cm4gJ0RBVEUnO1xyXG4gIH1cclxuICBfc3RyaW5naWZ5KGRhdGUpIHtcclxuICAgIHJldHVybiBtb21lbnQoZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XHJcbiAgfVxyXG4gIF9zYW5pdGl6ZSh2YWx1ZSwgb3B0aW9ucykge1xyXG4gICAgaWYgKCghb3B0aW9ucyB8fCBvcHRpb25zICYmICFvcHRpb25zLnJhdykgJiYgISF2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gbW9tZW50KHZhbHVlKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxuICB9XHJcbiAgX2lzQ2hhbmdlZCh2YWx1ZSwgb3JpZ2luYWxWYWx1ZSkge1xyXG4gICAgaWYgKG9yaWdpbmFsVmFsdWUgJiYgISF2YWx1ZSAmJiBvcmlnaW5hbFZhbHVlID09PSB2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvLyBub3QgY2hhbmdlZCB3aGVuIHNldCB0byBzYW1lIGVtcHR5IHZhbHVlXHJcbiAgICBpZiAoIW9yaWdpbmFsVmFsdWUgJiYgIXZhbHVlICYmIG9yaWdpbmFsVmFsdWUgPT09IHZhbHVlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEEga2V5IC8gdmFsdWUgc3RvcmUgY29sdW1uLiBPbmx5IGF2YWlsYWJsZSBpbiBQb3N0Z3Jlcy5cclxuICovXHJcbmNsYXNzIEhTVE9SRSBleHRlbmRzIEFCU1RSQUNUIHtcclxuICB2YWxpZGF0ZSh2YWx1ZSkge1xyXG4gICAgaWYgKCFfLmlzUGxhaW5PYmplY3QodmFsdWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KCclaiBpcyBub3QgYSB2YWxpZCBoc3RvcmUnLCB2YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQSBKU09OIHN0cmluZyBjb2x1bW4uIEF2YWlsYWJsZSBpbiBNeVNRTCwgUG9zdGdyZXMgYW5kIFNRTGl0ZVxyXG4gKi9cclxuY2xhc3MgSlNPTlRZUEUgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgdmFsaWRhdGUoKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbiAgX3N0cmluZ2lmeSh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIGJpbmFyeSBzdG9yYWdlIEpTT04gY29sdW1uLiBPbmx5IGF2YWlsYWJsZSBpbiBQb3N0Z3Jlcy5cclxuICovXHJcbmNsYXNzIEpTT05CIGV4dGVuZHMgSlNPTlRZUEUge1xyXG59XHJcblxyXG4vKipcclxuICogQSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBjdXJyZW50IHRpbWVzdGFtcFxyXG4gKi9cclxuY2xhc3MgTk9XIGV4dGVuZHMgQUJTVFJBQ1Qge1xyXG59XHJcblxyXG4vKipcclxuICogQmluYXJ5IHN0b3JhZ2VcclxuICovXHJcbmNsYXNzIEJMT0IgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsZW5ndGg9JyddIGNvdWxkIGJlIHRpbnksIG1lZGl1bSwgbG9uZy5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihsZW5ndGgpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBjb25zdCBvcHRpb25zID0gdHlwZW9mIGxlbmd0aCA9PT0gJ29iamVjdCcgJiYgbGVuZ3RoIHx8IHsgbGVuZ3RoIH07XHJcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgdGhpcy5fbGVuZ3RoID0gb3B0aW9ucy5sZW5ndGggfHwgJyc7XHJcbiAgfVxyXG4gIHRvU3FsKCkge1xyXG4gICAgc3dpdGNoICh0aGlzLl9sZW5ndGgudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICBjYXNlICd0aW55JzpcclxuICAgICAgICByZXR1cm4gJ1RJTllCTE9CJztcclxuICAgICAgY2FzZSAnbWVkaXVtJzpcclxuICAgICAgICByZXR1cm4gJ01FRElVTUJMT0InO1xyXG4gICAgICBjYXNlICdsb25nJzpcclxuICAgICAgICByZXR1cm4gJ0xPTkdCTE9CJztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gdGhpcy5rZXk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHZhbGlkYXRlKHZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSkge1xyXG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgYmxvYicsIHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbiAgX3N0cmluZ2lmeSh2YWx1ZSkge1xyXG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodmFsdWUpKSB7XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIHZhbHVlID0gQnVmZmVyLmZyb20odmFsdWUpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHZhbHVlID0gQnVmZmVyLmZyb20odmFsdWUudG9TdHJpbmcoKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnN0IGhleCA9IHZhbHVlLnRvU3RyaW5nKCdoZXgnKTtcclxuICAgIHJldHVybiB0aGlzLl9oZXhpZnkoaGV4KTtcclxuICB9XHJcbiAgX2hleGlmeShoZXgpIHtcclxuICAgIHJldHVybiBgWCcke2hleH0nYDtcclxuICB9XHJcbiAgX2JpbmRQYXJhbSh2YWx1ZSwgb3B0aW9ucykge1xyXG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodmFsdWUpKSB7XHJcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIHZhbHVlID0gQnVmZmVyLmZyb20odmFsdWUpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHZhbHVlID0gQnVmZmVyLmZyb20odmFsdWUudG9TdHJpbmcoKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvcHRpb25zLmJpbmRQYXJhbSh2YWx1ZSk7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuQkxPQi5wcm90b3R5cGUuZXNjYXBlID0gZmFsc2U7XHJcblxyXG4vKipcclxuICogUmFuZ2UgdHlwZXMgYXJlIGRhdGEgdHlwZXMgcmVwcmVzZW50aW5nIGEgcmFuZ2Ugb2YgdmFsdWVzIG9mIHNvbWUgZWxlbWVudCB0eXBlIChjYWxsZWQgdGhlIHJhbmdlJ3Mgc3VidHlwZSkuXHJcbiAqIE9ubHkgYXZhaWxhYmxlIGluIFBvc3RncmVzLiBTZWUgW3RoZSBQb3N0Z3JlcyBkb2N1bWVudGF0aW9uXShodHRwOi8vd3d3LnBvc3RncmVzcWwub3JnL2RvY3MvOS40L3N0YXRpYy9yYW5nZXR5cGVzLmh0bWwpIGZvciBtb3JlIGRldGFpbHNcclxuICovXHJcbmNsYXNzIFJBTkdFIGV4dGVuZHMgQUJTVFJBQ1Qge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7QUJTVFJBQ1R9IHN1YnR5cGUgQSBzdWJ0eXBlIGZvciByYW5nZSwgbGlrZSBSQU5HRShEQVRFKVxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKHN1YnR5cGUpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBjb25zdCBvcHRpb25zID0gXy5pc1BsYWluT2JqZWN0KHN1YnR5cGUpID8gc3VidHlwZSA6IHsgc3VidHlwZSB9O1xyXG4gICAgaWYgKCFvcHRpb25zLnN1YnR5cGUpXHJcbiAgICAgIG9wdGlvbnMuc3VidHlwZSA9IG5ldyBJTlRFR0VSKCk7XHJcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuc3VidHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBvcHRpb25zLnN1YnR5cGUgPSBuZXcgb3B0aW9ucy5zdWJ0eXBlKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9zdWJ0eXBlID0gb3B0aW9ucy5zdWJ0eXBlLmtleTtcclxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgfVxyXG4gIHZhbGlkYXRlKHZhbHVlKSB7XHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KCclaiBpcyBub3QgYSB2YWxpZCByYW5nZScsIHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUubGVuZ3RoICE9PSAyKSB7XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKCdBIHJhbmdlIG11c3QgYmUgYW4gYXJyYXkgd2l0aCB0d28gZWxlbWVudHMnKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEEgY29sdW1uIHN0b3JpbmcgYSB1bmlxdWUgdW5pdmVyc2FsIGlkZW50aWZpZXIuXHJcbiAqIFVzZSB3aXRoIGBVVUlEVjFgIG9yIGBVVUlEVjRgIGZvciBkZWZhdWx0IHZhbHVlcy5cclxuICovXHJcbmNsYXNzIFVVSUQgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgdmFsaWRhdGUodmFsdWUsIG9wdGlvbnMpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8ICFWYWxpZGF0b3IuaXNVVUlEKHZhbHVlKSAmJiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMuYWNjZXB0U3RyaW5ncykpIHtcclxuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIHV1aWQnLCB2YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQSBkZWZhdWx0IHVuaXF1ZSB1bml2ZXJzYWwgaWRlbnRpZmllciBnZW5lcmF0ZWQgZm9sbG93aW5nIHRoZSBVVUlEIHYxIHN0YW5kYXJkXHJcbiAqL1xyXG5jbGFzcyBVVUlEVjEgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgdmFsaWRhdGUodmFsdWUsIG9wdGlvbnMpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8ICFWYWxpZGF0b3IuaXNVVUlEKHZhbHVlKSAmJiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMuYWNjZXB0U3RyaW5ncykpIHtcclxuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIHV1aWQnLCB2YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQSBkZWZhdWx0IHVuaXF1ZSB1bml2ZXJzYWwgaWRlbnRpZmllciBnZW5lcmF0ZWQgZm9sbG93aW5nIHRoZSBVVUlEIHY0IHN0YW5kYXJkXHJcbiAqL1xyXG5jbGFzcyBVVUlEVjQgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgdmFsaWRhdGUodmFsdWUsIG9wdGlvbnMpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8ICFWYWxpZGF0b3IuaXNVVUlEKHZhbHVlLCA0KSAmJiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMuYWNjZXB0U3RyaW5ncykpIHtcclxuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIHV1aWR2NCcsIHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIHZpcnR1YWwgdmFsdWUgdGhhdCBpcyBub3Qgc3RvcmVkIGluIHRoZSBEQi4gVGhpcyBjb3VsZCBmb3IgZXhhbXBsZSBiZSB1c2VmdWwgaWYgeW91IHdhbnQgdG8gcHJvdmlkZSBhIGRlZmF1bHQgdmFsdWUgaW4geW91ciBtb2RlbCB0aGF0IGlzIHJldHVybmVkIHRvIHRoZSB1c2VyIGJ1dCBub3Qgc3RvcmVkIGluIHRoZSBEQi5cclxuICpcclxuICogWW91IGNvdWxkIGFsc28gdXNlIGl0IHRvIHZhbGlkYXRlIGEgdmFsdWUgYmVmb3JlIHBlcm11dGluZyBhbmQgc3RvcmluZyBpdC4gVklSVFVBTCBhbHNvIHRha2VzIGEgcmV0dXJuIHR5cGUgYW5kIGRlcGVuZGVuY3kgZmllbGRzIGFzIGFyZ3VtZW50c1xyXG4gKiBJZiBhIHZpcnR1YWwgYXR0cmlidXRlIGlzIHByZXNlbnQgaW4gYGF0dHJpYnV0ZXNgIGl0IHdpbGwgYXV0b21hdGljYWxseSBwdWxsIGluIHRoZSBleHRyYSBmaWVsZHMgYXMgd2VsbC5cclxuICogUmV0dXJuIHR5cGUgaXMgbW9zdGx5IHVzZWZ1bCBmb3Igc2V0dXBzIHRoYXQgcmVseSBvbiB0eXBlcyBsaWtlIEdyYXBoUUwuXHJcbiAqXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNoZWNraW5nIHBhc3N3b3JkIGxlbmd0aCBiZWZvcmUgaGFzaGluZyBpdDwvY2FwdGlvbj5cclxuICogc2VxdWVsaXplLmRlZmluZSgndXNlcicsIHtcclxuICogICBwYXNzd29yZF9oYXNoOiBEYXRhVHlwZXMuU1RSSU5HLFxyXG4gKiAgIHBhc3N3b3JkOiB7XHJcbiAqICAgICB0eXBlOiBEYXRhVHlwZXMuVklSVFVBTCxcclxuICogICAgIHNldDogZnVuY3Rpb24gKHZhbCkge1xyXG4gKiAgICAgICAgLy8gUmVtZW1iZXIgdG8gc2V0IHRoZSBkYXRhIHZhbHVlLCBvdGhlcndpc2UgaXQgd29uJ3QgYmUgdmFsaWRhdGVkXHJcbiAqICAgICAgICB0aGlzLnNldERhdGFWYWx1ZSgncGFzc3dvcmQnLCB2YWwpO1xyXG4gKiAgICAgICAgdGhpcy5zZXREYXRhVmFsdWUoJ3Bhc3N3b3JkX2hhc2gnLCB0aGlzLnNhbHQgKyB2YWwpO1xyXG4gKiAgICAgIH0sXHJcbiAqICAgICAgdmFsaWRhdGU6IHtcclxuICogICAgICAgICBpc0xvbmdFbm91Z2g6IGZ1bmN0aW9uICh2YWwpIHtcclxuICogICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgNykge1xyXG4gKiAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbGVhc2UgY2hvb3NlIGEgbG9uZ2VyIHBhc3N3b3JkXCIpXHJcbiAqICAgICAgICAgIH1cclxuICogICAgICAgfVxyXG4gKiAgICAgfVxyXG4gKiAgIH1cclxuICogfSlcclxuICpcclxuICogIyBJbiB0aGUgYWJvdmUgY29kZSB0aGUgcGFzc3dvcmQgaXMgc3RvcmVkIHBsYWlubHkgaW4gdGhlIHBhc3N3b3JkIGZpZWxkIHNvIGl0IGNhbiBiZSB2YWxpZGF0ZWQsIGJ1dCBpcyBuZXZlciBzdG9yZWQgaW4gdGhlIERCLlxyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5WaXJ0dWFsIHdpdGggZGVwZW5kZW5jeSBmaWVsZHM8L2NhcHRpb24+XHJcbiAqIHtcclxuICogICBhY3RpdmU6IHtcclxuICogICAgIHR5cGU6IG5ldyBEYXRhVHlwZXMuVklSVFVBTChEYXRhVHlwZXMuQk9PTEVBTiwgWydjcmVhdGVkQXQnXSksXHJcbiAqICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICByZXR1cm4gdGhpcy5nZXQoJ2NyZWF0ZWRBdCcpID4gRGF0ZS5ub3coKSAtICg3ICogMjQgKiA2MCAqIDYwICogMTAwMClcclxuICogICAgIH1cclxuICogICB9XHJcbiAqIH1cclxuICpcclxuICovXHJcbmNsYXNzIFZJUlRVQUwgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtBQlNUUkFDVH0gW1JldHVyblR5cGVdIHJldHVybiB0eXBlIGZvciB2aXJ0dWFsIHR5cGVcclxuICAgKiBAcGFyYW0ge0FycmF5fSBbZmllbGRzXSBhcnJheSBvZiBmaWVsZHMgdGhpcyB2aXJ0dWFsIHR5cGUgaXMgZGVwZW5kZW50IG9uXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoUmV0dXJuVHlwZSwgZmllbGRzKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgaWYgKHR5cGVvZiBSZXR1cm5UeXBlID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICBSZXR1cm5UeXBlID0gbmV3IFJldHVyblR5cGUoKTtcclxuICAgIHRoaXMucmV0dXJuVHlwZSA9IFJldHVyblR5cGU7XHJcbiAgICB0aGlzLmZpZWxkcyA9IGZpZWxkcztcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBbiBlbnVtZXJhdGlvbiwgUG9zdGdyZXMgT25seVxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBEYXRhVHlwZXMuRU5VTSgndmFsdWUnLCAnYW5vdGhlciB2YWx1ZScpXHJcbiAqIERhdGFUeXBlcy5FTlVNKFsndmFsdWUnLCAnYW5vdGhlciB2YWx1ZSddKVxyXG4gKiBEYXRhVHlwZXMuRU5VTSh7XHJcbiAqICAgdmFsdWVzOiBbJ3ZhbHVlJywgJ2Fub3RoZXIgdmFsdWUnXVxyXG4gKiB9KVxyXG4gKi9cclxuY2xhc3MgRU5VTSBleHRlbmRzIEFCU1RSQUNUIHtcclxuICAvKipcclxuICAgKiBAcGFyYW0gey4uLmFueXx7IHZhbHVlczogYW55W10gfXxhbnlbXX0gYXJncyBlaXRoZXIgYXJyYXkgb2YgdmFsdWVzIG9yIG9wdGlvbnMgb2JqZWN0IHdpdGggdmFsdWVzIGFycmF5LiBJdCBhbHNvIHN1cHBvcnRzIHZhcmlhZGljIHZhbHVlc1xyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBjb25zdCB2YWx1ZSA9IGFyZ3NbMF07XHJcbiAgICBjb25zdCBvcHRpb25zID0gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUgfHwge1xyXG4gICAgICB2YWx1ZXM6IGFyZ3MucmVkdWNlKChyZXN1bHQsIGVsZW1lbnQpID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzdWx0LmNvbmNhdChBcnJheS5pc0FycmF5KGVsZW1lbnQpID8gZWxlbWVudCA6IFtlbGVtZW50XSk7XHJcbiAgICAgIH0sIFtdKVxyXG4gICAgfTtcclxuICAgIHRoaXMudmFsdWVzID0gb3B0aW9ucy52YWx1ZXM7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gIH1cclxuICB2YWxpZGF0ZSh2YWx1ZSkge1xyXG4gICAgaWYgKCF0aGlzLnZhbHVlcy5pbmNsdWRlcyh2YWx1ZSkpIHtcclxuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIGNob2ljZSBpbiAlaicsIHZhbHVlLCB0aGlzLnZhbHVlcykpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQW4gYXJyYXkgb2YgYHR5cGVgLiBPbmx5IGF2YWlsYWJsZSBpbiBQb3N0Z3Jlcy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogRGF0YVR5cGVzLkFSUkFZKERhdGFUeXBlcy5ERUNJTUFMKVxyXG4gKi9cclxuY2xhc3MgQVJSQVkgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtBQlNUUkFDVH0gdHlwZSB0eXBlIG9mIGFycmF5IHZhbHVlc1xyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKHR5cGUpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBjb25zdCBvcHRpb25zID0gXy5pc1BsYWluT2JqZWN0KHR5cGUpID8gdHlwZSA6IHsgdHlwZSB9O1xyXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcclxuICAgIHRoaXMudHlwZSA9IHR5cGVvZiBvcHRpb25zLnR5cGUgPT09ICdmdW5jdGlvbicgPyBuZXcgb3B0aW9ucy50eXBlKCkgOiBvcHRpb25zLnR5cGU7XHJcbiAgfVxyXG4gIHRvU3FsKCkge1xyXG4gICAgcmV0dXJuIGAke3RoaXMudHlwZS50b1NxbCgpfVtdYDtcclxuICB9XHJcbiAgdmFsaWRhdGUodmFsdWUpIHtcclxuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIGFycmF5JywgdmFsdWUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuICBzdGF0aWMgaXMob2JqLCB0eXBlKSB7XHJcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgQVJSQVkgJiYgb2JqLnR5cGUgaW5zdGFuY2VvZiB0eXBlO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEEgY29sdW1uIHN0b3JpbmcgR2VvbWV0cnkgaW5mb3JtYXRpb24uXHJcbiAqIEl0IGlzIG9ubHkgYXZhaWxhYmxlIGluIFBvc3RncmVTUUwgKHdpdGggUG9zdEdJUyksIE1hcmlhREIgb3IgTXlTUUwuXHJcbiAqXHJcbiAqIEdlb0pTT04gaXMgYWNjZXB0ZWQgYXMgaW5wdXQgYW5kIHJldHVybmVkIGFzIG91dHB1dC5cclxuICpcclxuICogSW4gUG9zdEdJUywgdGhlIEdlb0pTT04gaXMgcGFyc2VkIHVzaW5nIHRoZSBQb3N0R0lTIGZ1bmN0aW9uIGBTVF9HZW9tRnJvbUdlb0pTT05gLlxyXG4gKiBJbiBNeVNRTCBpdCBpcyBwYXJzZWQgdXNpbmcgdGhlIGZ1bmN0aW9uIGBHZW9tRnJvbVRleHRgLlxyXG4gKlxyXG4gKiBUaGVyZWZvcmUsIG9uZSBjYW4ganVzdCBmb2xsb3cgdGhlIFtHZW9KU09OIHNwZWNdKGh0dHA6Ly9nZW9qc29uLm9yZy9nZW9qc29uLXNwZWMuaHRtbCkgZm9yIGhhbmRsaW5nIGdlb21ldHJ5IG9iamVjdHMuICBTZWUgdGhlIGZvbGxvd2luZyBleGFtcGxlczpcclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+RGVmaW5pbmcgYSBHZW9tZXRyeSB0eXBlIGF0dHJpYnV0ZTwvY2FwdGlvbj5cclxuICogRGF0YVR5cGVzLkdFT01FVFJZXHJcbiAqIERhdGFUeXBlcy5HRU9NRVRSWSgnUE9JTlQnKVxyXG4gKiBEYXRhVHlwZXMuR0VPTUVUUlkoJ1BPSU5UJywgNDMyNilcclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGEgbmV3IHBvaW50PC9jYXB0aW9uPlxyXG4gKiBjb25zdCBwb2ludCA9IHsgdHlwZTogJ1BvaW50JywgY29vcmRpbmF0ZXM6IFszOS44MDcyMjIsLTc2Ljk4NDcyMl19O1xyXG4gKlxyXG4gKiBVc2VyLmNyZWF0ZSh7dXNlcm5hbWU6ICd1c2VybmFtZScsIGdlb21ldHJ5OiBwb2ludCB9KTtcclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+Q3JlYXRlIGEgbmV3IGxpbmVzdHJpbmc8L2NhcHRpb24+XHJcbiAqIGNvbnN0IGxpbmUgPSB7IHR5cGU6ICdMaW5lU3RyaW5nJywgJ2Nvb3JkaW5hdGVzJzogWyBbMTAwLjAsIDAuMF0sIFsxMDEuMCwgMS4wXSBdIH07XHJcbiAqXHJcbiAqIFVzZXIuY3JlYXRlKHt1c2VybmFtZTogJ3VzZXJuYW1lJywgZ2VvbWV0cnk6IGxpbmUgfSk7XHJcbiAqXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhIG5ldyBwb2x5Z29uPC9jYXB0aW9uPlxyXG4gKiBjb25zdCBwb2x5Z29uID0geyB0eXBlOiAnUG9seWdvbicsIGNvb3JkaW5hdGVzOiBbXHJcbiAqICAgICAgICAgICAgICAgICBbIFsxMDAuMCwgMC4wXSwgWzEwMS4wLCAwLjBdLCBbMTAxLjAsIDEuMF0sXHJcbiAqICAgICAgICAgICAgICAgICAgIFsxMDAuMCwgMS4wXSwgWzEwMC4wLCAwLjBdIF1cclxuICogICAgICAgICAgICAgICAgIF19O1xyXG4gKlxyXG4gKiBVc2VyLmNyZWF0ZSh7dXNlcm5hbWU6ICd1c2VybmFtZScsIGdlb21ldHJ5OiBwb2x5Z29uIH0pO1xyXG4gKlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5DcmVhdGUgYSBuZXcgcG9pbnQgd2l0aCBhIGN1c3RvbSBTUklEPC9jYXB0aW9uPlxyXG4gKiBjb25zdCBwb2ludCA9IHtcclxuICogICB0eXBlOiAnUG9pbnQnLFxyXG4gKiAgIGNvb3JkaW5hdGVzOiBbMzkuODA3MjIyLC03Ni45ODQ3MjJdLFxyXG4gKiAgIGNyczogeyB0eXBlOiAnbmFtZScsIHByb3BlcnRpZXM6IHsgbmFtZTogJ0VQU0c6NDMyNid9IH1cclxuICogfTtcclxuICpcclxuICogVXNlci5jcmVhdGUoe3VzZXJuYW1lOiAndXNlcm5hbWUnLCBnZW9tZXRyeTogcG9pbnQgfSlcclxuICpcclxuICpcclxuICogQHNlZSB7QGxpbmsgRGF0YVR5cGVzLkdFT0dSQVBIWX1cclxuICovXHJcbmNsYXNzIEdFT01FVFJZIGV4dGVuZHMgQUJTVFJBQ1Qge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdHlwZV0gVHlwZSBvZiBnZW9tZXRyeSBkYXRhXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtzcmlkXSBTUklEIG9mIHR5cGVcclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvcih0eXBlLCBzcmlkKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IF8uaXNQbGFpbk9iamVjdCh0eXBlKSA/IHR5cGUgOiB7IHR5cGUsIHNyaWQgfTtcclxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICB0aGlzLnR5cGUgPSBvcHRpb25zLnR5cGU7XHJcbiAgICB0aGlzLnNyaWQgPSBvcHRpb25zLnNyaWQ7XHJcbiAgfVxyXG4gIF9zdHJpbmdpZnkodmFsdWUsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiBgR2VvbUZyb21UZXh0KCR7b3B0aW9ucy5lc2NhcGUod2t4Lkdlb21ldHJ5LnBhcnNlR2VvSlNPTih2YWx1ZSkudG9Xa3QoKSl9KWA7XHJcbiAgfVxyXG4gIF9iaW5kUGFyYW0odmFsdWUsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiBgR2VvbUZyb21UZXh0KCR7b3B0aW9ucy5iaW5kUGFyYW0od2t4Lkdlb21ldHJ5LnBhcnNlR2VvSlNPTih2YWx1ZSkudG9Xa3QoKSl9KWA7XHJcbiAgfVxyXG59XHJcblxyXG5HRU9NRVRSWS5wcm90b3R5cGUuZXNjYXBlID0gZmFsc2U7XHJcblxyXG4vKipcclxuICogQSBnZW9ncmFwaHkgZGF0YXR5cGUgcmVwcmVzZW50cyB0d28gZGltZW5zaW9uYWwgc3BhY2lhbCBvYmplY3RzIGluIGFuIGVsbGlwdGljIGNvb3JkIHN5c3RlbS5cclxuICpcclxuICogX19UaGUgZGlmZmVyZW5jZSBmcm9tIGdlb21ldHJ5IGFuZCBnZW9ncmFwaHkgdHlwZTpfX1xyXG4gKlxyXG4gKiBQb3N0R0lTIDEuNSBpbnRyb2R1Y2VkIGEgbmV3IHNwYXRpYWwgdHlwZSBjYWxsZWQgZ2VvZ3JhcGh5LCB3aGljaCB1c2VzIGdlb2RldGljIG1lYXN1cmVtZW50IGluc3RlYWQgb2YgQ2FydGVzaWFuIG1lYXN1cmVtZW50LlxyXG4gKiBDb29yZGluYXRlIHBvaW50cyBpbiB0aGUgZ2VvZ3JhcGh5IHR5cGUgYXJlIGFsd2F5cyByZXByZXNlbnRlZCBpbiBXR1MgODQgbG9uIGxhdCBkZWdyZWVzIChTUklEIDQzMjYpLFxyXG4gKiBidXQgbWVhc3VyZW1lbnQgZnVuY3Rpb25zIGFuZCByZWxhdGlvbnNoaXBzIFNUX0Rpc3RhbmNlLCBTVF9EV2l0aGluLCBTVF9MZW5ndGgsIGFuZCBTVF9BcmVhIGFsd2F5cyByZXR1cm4gYW5zd2VycyBpbiBtZXRlcnMgb3IgYXNzdW1lIGlucHV0cyBpbiBtZXRlcnMuXHJcbiAqXHJcbiAqIF9fV2hhdCBpcyBiZXN0IHRvIHVzZT8gSXQgZGVwZW5kczpfX1xyXG4gKlxyXG4gKiBXaGVuIGNob29zaW5nIGJldHdlZW4gdGhlIGdlb21ldHJ5IGFuZCBnZW9ncmFwaHkgdHlwZSBmb3IgZGF0YSBzdG9yYWdlLCB5b3Ugc2hvdWxkIGNvbnNpZGVyIHdoYXQgeW914oCZbGwgYmUgdXNpbmcgaXQgZm9yLlxyXG4gKiBJZiBhbGwgeW91IGRvIGFyZSBzaW1wbGUgbWVhc3VyZW1lbnRzIGFuZCByZWxhdGlvbnNoaXAgY2hlY2tzIG9uIHlvdXIgZGF0YSwgYW5kIHlvdXIgZGF0YSBjb3ZlcnMgYSBmYWlybHkgbGFyZ2UgYXJlYSwgdGhlbiBtb3N0IGxpa2VseSB5b3XigJlsbCBiZSBiZXR0ZXIgb2ZmIHN0b3JpbmcgeW91ciBkYXRhIHVzaW5nIHRoZSBuZXcgZ2VvZ3JhcGh5IHR5cGUuXHJcbiAqIEFsdGhvdWdoIHRoZSBuZXcgZ2VvZ3JhcGh5IGRhdGEgdHlwZSBjYW4gY292ZXIgdGhlIGdsb2JlLCB0aGUgZ2VvbWV0cnkgdHlwZSBpcyBmYXIgZnJvbSBvYnNvbGV0ZS5cclxuICogVGhlIGdlb21ldHJ5IHR5cGUgaGFzIGEgbXVjaCByaWNoZXIgc2V0IG9mIGZ1bmN0aW9ucyB0aGFuIGdlb2dyYXBoeSwgcmVsYXRpb25zaGlwIGNoZWNrcyBhcmUgZ2VuZXJhbGx5IGZhc3RlciwgYW5kIGl0IGhhcyB3aWRlciBzdXBwb3J0IGN1cnJlbnRseSBhY3Jvc3MgZGVza3RvcCBhbmQgd2ViLW1hcHBpbmcgdG9vbHNcclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+RGVmaW5pbmcgYSBHZW9ncmFwaHkgdHlwZSBhdHRyaWJ1dGU8L2NhcHRpb24+XHJcbiAqIERhdGFUeXBlcy5HRU9HUkFQSFlcclxuICogRGF0YVR5cGVzLkdFT0dSQVBIWSgnUE9JTlQnKVxyXG4gKiBEYXRhVHlwZXMuR0VPR1JBUEhZKCdQT0lOVCcsIDQzMjYpXHJcbiAqL1xyXG5jbGFzcyBHRU9HUkFQSFkgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFt0eXBlXSBUeXBlIG9mIGdlb2dyYXBoeSBkYXRhXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtzcmlkXSBTUklEIG9mIHR5cGVcclxuICAgKi9cclxuICBjb25zdHJ1Y3Rvcih0eXBlLCBzcmlkKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IF8uaXNQbGFpbk9iamVjdCh0eXBlKSA/IHR5cGUgOiB7IHR5cGUsIHNyaWQgfTtcclxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICB0aGlzLnR5cGUgPSBvcHRpb25zLnR5cGU7XHJcbiAgICB0aGlzLnNyaWQgPSBvcHRpb25zLnNyaWQ7XHJcbiAgfVxyXG4gIF9zdHJpbmdpZnkodmFsdWUsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiBgR2VvbUZyb21UZXh0KCR7b3B0aW9ucy5lc2NhcGUod2t4Lkdlb21ldHJ5LnBhcnNlR2VvSlNPTih2YWx1ZSkudG9Xa3QoKSl9KWA7XHJcbiAgfVxyXG4gIF9iaW5kUGFyYW0odmFsdWUsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiBgR2VvbUZyb21UZXh0KCR7b3B0aW9ucy5iaW5kUGFyYW0od2t4Lkdlb21ldHJ5LnBhcnNlR2VvSlNPTih2YWx1ZSkudG9Xa3QoKSl9KWA7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuR0VPR1JBUEhZLnByb3RvdHlwZS5lc2NhcGUgPSBmYWxzZTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgY2lkciB0eXBlIGhvbGRzIGFuIElQdjQgb3IgSVB2NiBuZXR3b3JrIHNwZWNpZmljYXRpb24uIFRha2VzIDcgb3IgMTkgYnl0ZXMuXHJcbiAqXHJcbiAqIE9ubHkgYXZhaWxhYmxlIGZvciBQb3N0Z3Jlc1xyXG4gKi9cclxuY2xhc3MgQ0lEUiBleHRlbmRzIEFCU1RSQUNUIHtcclxuICB2YWxpZGF0ZSh2YWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgfHwgIVZhbGlkYXRvci5pc0lQUmFuZ2UodmFsdWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KCclaiBpcyBub3QgYSB2YWxpZCBDSURSJywgdmFsdWUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFRoZSBJTkVUIHR5cGUgaG9sZHMgYW4gSVB2NCBvciBJUHY2IGhvc3QgYWRkcmVzcywgYW5kIG9wdGlvbmFsbHkgaXRzIHN1Ym5ldC4gVGFrZXMgNyBvciAxOSBieXRlc1xyXG4gKlxyXG4gKiBPbmx5IGF2YWlsYWJsZSBmb3IgUG9zdGdyZXNcclxuICovXHJcbmNsYXNzIElORVQgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgdmFsaWRhdGUodmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8ICFWYWxpZGF0b3IuaXNJUCh2YWx1ZSkpIHtcclxuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIElORVQnLCB2YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogVGhlIE1BQ0FERFIgdHlwZSBzdG9yZXMgTUFDIGFkZHJlc3Nlcy4gVGFrZXMgNiBieXRlc1xyXG4gKlxyXG4gKiBPbmx5IGF2YWlsYWJsZSBmb3IgUG9zdGdyZXNcclxuICpcclxuICovXHJcbmNsYXNzIE1BQ0FERFIgZXh0ZW5kcyBBQlNUUkFDVCB7XHJcbiAgdmFsaWRhdGUodmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8ICFWYWxpZGF0b3IuaXNNQUNBZGRyZXNzKHZhbHVlKSkge1xyXG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgTUFDQUREUicsIHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBIGNvbnZlbmllbmNlIGNsYXNzIGhvbGRpbmcgY29tbW9ubHkgdXNlZCBkYXRhIHR5cGVzLiBUaGUgZGF0YSB0eXBlcyBhcmUgdXNlZCB3aGVuIGRlZmluaW5nIGEgbmV3IG1vZGVsIHVzaW5nIGBTZXF1ZWxpemUuZGVmaW5lYCwgbGlrZSB0aGlzOlxyXG4gKiBgYGBqc1xyXG4gKiBzZXF1ZWxpemUuZGVmaW5lKCdtb2RlbCcsIHtcclxuICogICBjb2x1bW46IERhdGFUeXBlcy5JTlRFR0VSXHJcbiAqIH0pXHJcbiAqIGBgYFxyXG4gKiBXaGVuIGRlZmluaW5nIGEgbW9kZWwgeW91IGNhbiBqdXN0IGFzIGVhc2lseSBwYXNzIGEgc3RyaW5nIGFzIHR5cGUsIGJ1dCBvZnRlbiB1c2luZyB0aGUgdHlwZXMgZGVmaW5lZCBoZXJlIGlzIGJlbmVmaWNpYWwuIEZvciBleGFtcGxlLCB1c2luZyBgRGF0YVR5cGVzLkJMT0JgLCBtZWFuXHJcbiAqIHRoYXQgdGhhdCBjb2x1bW4gd2lsbCBiZSByZXR1cm5lZCBhcyBhbiBpbnN0YW5jZSBvZiBgQnVmZmVyYCB3aGVuIGJlaW5nIGZldGNoZWQgYnkgc2VxdWVsaXplLlxyXG4gKlxyXG4gKiBUbyBwcm92aWRlIGEgbGVuZ3RoIGZvciB0aGUgZGF0YSB0eXBlLCB5b3UgY2FuIGludm9rZSBpdCBsaWtlIGEgZnVuY3Rpb246IGBJTlRFR0VSKDIpYFxyXG4gKlxyXG4gKiBTb21lIGRhdGEgdHlwZXMgaGF2ZSBzcGVjaWFsIHByb3BlcnRpZXMgdGhhdCBjYW4gYmUgYWNjZXNzZWQgaW4gb3JkZXIgdG8gY2hhbmdlIHRoZSBkYXRhIHR5cGUuXHJcbiAqIEZvciBleGFtcGxlLCB0byBnZXQgYW4gdW5zaWduZWQgaW50ZWdlciB3aXRoIHplcm9maWxsIHlvdSBjYW4gZG8gYERhdGFUeXBlcy5JTlRFR0VSLlVOU0lHTkVELlpFUk9GSUxMYC5cclxuICogVGhlIG9yZGVyIHlvdSBhY2Nlc3MgdGhlIHByb3BlcnRpZXMgaW4gZG8gbm90IG1hdHRlciwgc28gYERhdGFUeXBlcy5JTlRFR0VSLlpFUk9GSUxMLlVOU0lHTkVEYCBpcyBmaW5lIGFzIHdlbGwuXHJcbiAqXHJcbiAqICogQWxsIG51bWJlciB0eXBlcyAoYElOVEVHRVJgLCBgQklHSU5UYCwgYEZMT0FUYCwgYERPVUJMRWAsIGBSRUFMYCwgYERFQ0lNQUxgKSBleHBvc2UgdGhlIHByb3BlcnRpZXMgYFVOU0lHTkVEYCBhbmQgYFpFUk9GSUxMYFxyXG4gKiAqIFRoZSBgQ0hBUmAgYW5kIGBTVFJJTkdgIHR5cGVzIGV4cG9zZSB0aGUgYEJJTkFSWWAgcHJvcGVydHlcclxuICpcclxuICogVGhyZWUgb2YgdGhlIHZhbHVlcyBwcm92aWRlZCBoZXJlIChgTk9XYCwgYFVVSURWMWAgYW5kIGBVVUlEVjRgKSBhcmUgc3BlY2lhbCBkZWZhdWx0IHZhbHVlcywgdGhhdCBzaG91bGQgbm90IGJlIHVzZWQgdG8gZGVmaW5lIHR5cGVzLiBJbnN0ZWFkIHRoZXkgYXJlIHVzZWQgYXMgc2hvcnRoYW5kcyBmb3JcclxuICogZGVmaW5pbmcgZGVmYXVsdCB2YWx1ZXMuIEZvciBleGFtcGxlLCB0byBnZXQgYSB1dWlkIGZpZWxkIHdpdGggYSBkZWZhdWx0IHZhbHVlIGdlbmVyYXRlZCBmb2xsb3dpbmcgdjEgb2YgdGhlIFVVSUQgc3RhbmRhcmQ6XHJcbiAqIGBgYGpzXHJcbiAqIHNlcXVlbGl6ZS5kZWZpbmUoJ21vZGVsJywge1xyXG4gKiAgIHV1aWQ6IHtcclxuICogICAgIHR5cGU6IERhdGFUeXBlcy5VVUlELFxyXG4gKiAgICAgZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFYxLFxyXG4gKiAgICAgcHJpbWFyeUtleTogdHJ1ZVxyXG4gKiAgIH1cclxuICogfSlcclxuICogYGBgXHJcbiAqIFRoZXJlIG1heSBiZSB0aW1lcyB3aGVuIHlvdSB3YW50IHRvIGdlbmVyYXRlIHlvdXIgb3duIFVVSUQgY29uZm9ybWluZyB0byBzb21lIG90aGVyIGFsZ29yaXRobS4gVGhpcyBpcyBhY2NvbXBsaXNoZWRcclxuICogdXNpbmcgdGhlIGRlZmF1bHRWYWx1ZSBwcm9wZXJ0eSBhcyB3ZWxsLCBidXQgaW5zdGVhZCBvZiBzcGVjaWZ5aW5nIG9uZSBvZiB0aGUgc3VwcGxpZWQgVVVJRCB0eXBlcywgeW91IHJldHVybiBhIHZhbHVlXHJcbiAqIGZyb20gYSBmdW5jdGlvbi5cclxuICogYGBganNcclxuICogc2VxdWVsaXplLmRlZmluZSgnbW9kZWwnLCB7XHJcbiAqICAgdXVpZDoge1xyXG4gKiAgICAgdHlwZTogRGF0YVR5cGVzLlVVSUQsXHJcbiAqICAgICBkZWZhdWx0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICByZXR1cm4gZ2VuZXJhdGVNeUlkKClcclxuICogICAgIH0sXHJcbiAqICAgICBwcmltYXJ5S2V5OiB0cnVlXHJcbiAqICAgfVxyXG4gKiB9KVxyXG4gKiBgYGBcclxuICovXHJcbmNvbnN0IERhdGFUeXBlcyA9IG1vZHVsZS5leHBvcnRzID0ge1xyXG4gIEFCU1RSQUNULFxyXG4gIFNUUklORyxcclxuICBDSEFSLFxyXG4gIFRFWFQsXHJcbiAgTlVNQkVSLFxyXG4gIFRJTllJTlQsXHJcbiAgU01BTExJTlQsXHJcbiAgTUVESVVNSU5ULFxyXG4gIElOVEVHRVIsXHJcbiAgQklHSU5ULFxyXG4gIEZMT0FULFxyXG4gIFRJTUUsXHJcbiAgREFURSxcclxuICBEQVRFT05MWSxcclxuICBCT09MRUFOLFxyXG4gIE5PVyxcclxuICBCTE9CLFxyXG4gIERFQ0lNQUwsXHJcbiAgTlVNRVJJQzogREVDSU1BTCxcclxuICBVVUlELFxyXG4gIFVVSURWMSxcclxuICBVVUlEVjQsXHJcbiAgSFNUT1JFLFxyXG4gIEpTT046IEpTT05UWVBFLFxyXG4gIEpTT05CLFxyXG4gIFZJUlRVQUwsXHJcbiAgQVJSQVksXHJcbiAgRU5VTSxcclxuICBSQU5HRSxcclxuICBSRUFMLFxyXG4gICdET1VCTEUgUFJFQ0lTSU9OJzogRE9VQkxFLFxyXG4gIERPVUJMRSxcclxuICBHRU9NRVRSWSxcclxuICBHRU9HUkFQSFksXHJcbiAgQ0lEUixcclxuICBJTkVULFxyXG4gIE1BQ0FERFIsXHJcbiAgQ0lURVhUXHJcbn07XHJcblxyXG5fLmVhY2goRGF0YVR5cGVzLCAoZGF0YVR5cGUsIG5hbWUpID0+IHtcclxuICAvLyBndWFyZCBmb3IgYWxpYXNlc1xyXG4gIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGFUeXBlLCAna2V5JykpIHtcclxuICAgIGRhdGFUeXBlLnR5cGVzID0ge307XHJcbiAgICBkYXRhVHlwZS5rZXkgPSBkYXRhVHlwZS5wcm90b3R5cGUua2V5ID0gbmFtZTtcclxuICB9XHJcbn0pO1xyXG5cclxuY29uc3QgZGlhbGVjdE1hcCA9IHt9O1xyXG4vKiBkaWFsZWN0TWFwLnBvc3RncmVzID0gcmVxdWlyZSgnLi9kaWFsZWN0cy9wb3N0Z3Jlcy9kYXRhLXR5cGVzJykoRGF0YVR5cGVzKTtcclxuZGlhbGVjdE1hcC5teXNxbCA9IHJlcXVpcmUoJy4vZGlhbGVjdHMvbXlzcWwvZGF0YS10eXBlcycpKERhdGFUeXBlcyk7XHJcbmRpYWxlY3RNYXAubWFyaWFkYiA9IHJlcXVpcmUoJy4vZGlhbGVjdHMvbWFyaWFkYi9kYXRhLXR5cGVzJykoRGF0YVR5cGVzKTsgKi9cclxuZGlhbGVjdE1hcC5zcWxpdGUgPSByZXF1aXJlKCcuL2RpYWxlY3RzL3NxbGl0ZS9kYXRhLXR5cGVzJykoRGF0YVR5cGVzKTtcclxuLyogZGlhbGVjdE1hcC5tc3NxbCA9IHJlcXVpcmUoJy4vZGlhbGVjdHMvbXNzcWwvZGF0YS10eXBlcycpKERhdGFUeXBlcyk7ICovXHJcblxyXG5jb25zdCBkaWFsZWN0TGlzdCA9IF8udmFsdWVzKGRpYWxlY3RNYXApO1xyXG5cclxuZm9yIChjb25zdCBkYXRhVHlwZXMgb2YgZGlhbGVjdExpc3QpIHtcclxuICBfLmVhY2goZGF0YVR5cGVzLCAoRGF0YVR5cGUsIGtleSkgPT4ge1xyXG4gICAgaWYgKCFEYXRhVHlwZS5rZXkpIHtcclxuICAgICAgRGF0YVR5cGUua2V5ID0gRGF0YVR5cGUucHJvdG90eXBlLmtleSA9IGtleTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuLy8gV3JhcCBhbGwgZGF0YSB0eXBlcyB0byBub3QgcmVxdWlyZSBgbmV3YFxyXG5mb3IgKGNvbnN0IGRhdGFUeXBlcyBvZiBbRGF0YVR5cGVzLCAuLi5kaWFsZWN0TGlzdF0pIHtcclxuICBfLmVhY2goZGF0YVR5cGVzLCAoRGF0YVR5cGUsIGtleSkgPT4ge1xyXG4gICAgZGF0YVR5cGVzW2tleV0gPSBjbGFzc1RvSW52b2thYmxlKERhdGFUeXBlKTtcclxuICB9KTtcclxufVxyXG5cclxuT2JqZWN0LmFzc2lnbihEYXRhVHlwZXMsIGRpYWxlY3RNYXApO1xyXG4iXX0=