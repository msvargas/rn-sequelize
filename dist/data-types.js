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