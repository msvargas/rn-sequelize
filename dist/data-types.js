'use strict';

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const util = require('util');

const _ = require('lodash');

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

let ABSTRACT = /*#__PURE__*/function () {
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

let STRING = /*#__PURE__*/function (_ABSTRACT) {
  _inherits(STRING, _ABSTRACT);

  var _super = _createSuper(STRING);

  /**
   * @param {number} [length=255] length of string
   * @param {boolean} [binary=false] Is this binary?
   */
  function STRING(length, binary) {
    var _this;

    _classCallCheck(this, STRING);

    _this = _super.call(this);
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


let CHAR = /*#__PURE__*/function (_STRING) {
  _inherits(CHAR, _STRING);

  var _super2 = _createSuper(CHAR);

  /**
   * @param {number} [length=255] length of string
   * @param {boolean} [binary=false] Is this binary?
   */
  function CHAR(length, binary) {
    _classCallCheck(this, CHAR);

    return _super2.call(this, typeof length === 'object' && length || {
      length,
      binary
    });
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


let TEXT = /*#__PURE__*/function (_ABSTRACT2) {
  _inherits(TEXT, _ABSTRACT2);

  var _super3 = _createSuper(TEXT);

  /**
   * @param {string} [length=''] could be tiny, medium, long.
   */
  function TEXT(length) {
    var _this2;

    _classCallCheck(this, TEXT);

    _this2 = _super3.call(this);
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


let CITEXT = /*#__PURE__*/function (_ABSTRACT3) {
  _inherits(CITEXT, _ABSTRACT3);

  var _super4 = _createSuper(CITEXT);

  function CITEXT() {
    _classCallCheck(this, CITEXT);

    return _super4.apply(this, arguments);
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


let NUMBER = /*#__PURE__*/function (_ABSTRACT4) {
  _inherits(NUMBER, _ABSTRACT4);

  var _super5 = _createSuper(NUMBER);

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

    _this3 = _super5.call(this);

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


let INTEGER = /*#__PURE__*/function (_NUMBER) {
  _inherits(INTEGER, _NUMBER);

  var _super6 = _createSuper(INTEGER);

  function INTEGER() {
    _classCallCheck(this, INTEGER);

    return _super6.apply(this, arguments);
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


let TINYINT = /*#__PURE__*/function (_INTEGER) {
  _inherits(TINYINT, _INTEGER);

  var _super7 = _createSuper(TINYINT);

  function TINYINT() {
    _classCallCheck(this, TINYINT);

    return _super7.apply(this, arguments);
  }

  return TINYINT;
}(INTEGER);
/**
 * A 16 bit integer
 */


let SMALLINT = /*#__PURE__*/function (_INTEGER2) {
  _inherits(SMALLINT, _INTEGER2);

  var _super8 = _createSuper(SMALLINT);

  function SMALLINT() {
    _classCallCheck(this, SMALLINT);

    return _super8.apply(this, arguments);
  }

  return SMALLINT;
}(INTEGER);
/**
 * A 24 bit integer
 */


let MEDIUMINT = /*#__PURE__*/function (_INTEGER3) {
  _inherits(MEDIUMINT, _INTEGER3);

  var _super9 = _createSuper(MEDIUMINT);

  function MEDIUMINT() {
    _classCallCheck(this, MEDIUMINT);

    return _super9.apply(this, arguments);
  }

  return MEDIUMINT;
}(INTEGER);
/**
 * A 64 bit integer
 */


let BIGINT = /*#__PURE__*/function (_INTEGER4) {
  _inherits(BIGINT, _INTEGER4);

  var _super10 = _createSuper(BIGINT);

  function BIGINT() {
    _classCallCheck(this, BIGINT);

    return _super10.apply(this, arguments);
  }

  return BIGINT;
}(INTEGER);
/**
 * Floating point number (4-byte precision).
 */


let FLOAT = /*#__PURE__*/function (_NUMBER2) {
  _inherits(FLOAT, _NUMBER2);

  var _super11 = _createSuper(FLOAT);

  /**
   * @param {string|number} [length] length of type, like `FLOAT(4)`
   * @param {string|number} [decimals] number of decimal points, used with length `FLOAT(5, 4)`
   */
  function FLOAT(length, decimals) {
    _classCallCheck(this, FLOAT);

    return _super11.call(this, typeof length === 'object' && length || {
      length,
      decimals
    });
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


let REAL = /*#__PURE__*/function (_NUMBER3) {
  _inherits(REAL, _NUMBER3);

  var _super12 = _createSuper(REAL);

  /**
   * @param {string|number} [length] length of type, like `REAL(4)`
   * @param {string|number} [decimals] number of decimal points, used with length `REAL(5, 4)`
   */
  function REAL(length, decimals) {
    _classCallCheck(this, REAL);

    return _super12.call(this, typeof length === 'object' && length || {
      length,
      decimals
    });
  }

  return REAL;
}(NUMBER);
/**
 * Floating point number (8-byte precision).
 */


let DOUBLE = /*#__PURE__*/function (_NUMBER4) {
  _inherits(DOUBLE, _NUMBER4);

  var _super13 = _createSuper(DOUBLE);

  /**
   * @param {string|number} [length] length of type, like `DOUBLE PRECISION(25)`
   * @param {string|number} [decimals] number of decimal points, used with length `DOUBLE PRECISION(25, 10)`
   */
  function DOUBLE(length, decimals) {
    _classCallCheck(this, DOUBLE);

    return _super13.call(this, typeof length === 'object' && length || {
      length,
      decimals
    });
  }

  return DOUBLE;
}(NUMBER);
/**
 * Decimal type, variable precision, take length as specified by user
 */


let DECIMAL = /*#__PURE__*/function (_NUMBER5) {
  _inherits(DECIMAL, _NUMBER5);

  var _super14 = _createSuper(DECIMAL);

  /**
   * @param {string|number} [precision] defines precision
   * @param {string|number} [scale] defines scale
   */
  function DECIMAL(precision, scale) {
    _classCallCheck(this, DECIMAL);

    return _super14.call(this, typeof precision === 'object' && precision || {
      precision,
      scale
    });
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


let BOOLEAN = /*#__PURE__*/function (_ABSTRACT5) {
  _inherits(BOOLEAN, _ABSTRACT5);

  var _super15 = _createSuper(BOOLEAN);

  function BOOLEAN() {
    _classCallCheck(this, BOOLEAN);

    return _super15.apply(this, arguments);
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

let TIME = /*#__PURE__*/function (_ABSTRACT6) {
  _inherits(TIME, _ABSTRACT6);

  var _super16 = _createSuper(TIME);

  function TIME() {
    _classCallCheck(this, TIME);

    return _super16.apply(this, arguments);
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


let DATE = /*#__PURE__*/function (_ABSTRACT7) {
  _inherits(DATE, _ABSTRACT7);

  var _super17 = _createSuper(DATE);

  /**
   * @param {string|number} [length] precision to allow storing milliseconds
   */
  function DATE(length) {
    var _this4;

    _classCallCheck(this, DATE);

    _this4 = _super17.call(this);
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


let DATEONLY = /*#__PURE__*/function (_ABSTRACT8) {
  _inherits(DATEONLY, _ABSTRACT8);

  var _super18 = _createSuper(DATEONLY);

  function DATEONLY() {
    _classCallCheck(this, DATEONLY);

    return _super18.apply(this, arguments);
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


let HSTORE = /*#__PURE__*/function (_ABSTRACT9) {
  _inherits(HSTORE, _ABSTRACT9);

  var _super19 = _createSuper(HSTORE);

  function HSTORE() {
    _classCallCheck(this, HSTORE);

    return _super19.apply(this, arguments);
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


let JSONTYPE = /*#__PURE__*/function (_ABSTRACT10) {
  _inherits(JSONTYPE, _ABSTRACT10);

  var _super20 = _createSuper(JSONTYPE);

  function JSONTYPE() {
    _classCallCheck(this, JSONTYPE);

    return _super20.apply(this, arguments);
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


let JSONB = /*#__PURE__*/function (_JSONTYPE) {
  _inherits(JSONB, _JSONTYPE);

  var _super21 = _createSuper(JSONB);

  function JSONB() {
    _classCallCheck(this, JSONB);

    return _super21.apply(this, arguments);
  }

  return JSONB;
}(JSONTYPE);
/**
 * A default value of the current timestamp
 */


let NOW = /*#__PURE__*/function (_ABSTRACT11) {
  _inherits(NOW, _ABSTRACT11);

  var _super22 = _createSuper(NOW);

  function NOW() {
    _classCallCheck(this, NOW);

    return _super22.apply(this, arguments);
  }

  return NOW;
}(ABSTRACT);
/**
 * Binary storage
 */


let BLOB = /*#__PURE__*/function (_ABSTRACT12) {
  _inherits(BLOB, _ABSTRACT12);

  var _super23 = _createSuper(BLOB);

  /**
   * @param {string} [length=''] could be tiny, medium, long.
   */
  function BLOB(length) {
    var _this5;

    _classCallCheck(this, BLOB);

    _this5 = _super23.call(this);
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

let RANGE = /*#__PURE__*/function (_ABSTRACT13) {
  _inherits(RANGE, _ABSTRACT13);

  var _super24 = _createSuper(RANGE);

  /**
   * @param {ABSTRACT} subtype A subtype for range, like RANGE(DATE)
   */
  function RANGE(subtype) {
    var _this6;

    _classCallCheck(this, RANGE);

    _this6 = _super24.call(this);
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


let UUID = /*#__PURE__*/function (_ABSTRACT14) {
  _inherits(UUID, _ABSTRACT14);

  var _super25 = _createSuper(UUID);

  function UUID() {
    _classCallCheck(this, UUID);

    return _super25.apply(this, arguments);
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


let UUIDV1 = /*#__PURE__*/function (_ABSTRACT15) {
  _inherits(UUIDV1, _ABSTRACT15);

  var _super26 = _createSuper(UUIDV1);

  function UUIDV1() {
    _classCallCheck(this, UUIDV1);

    return _super26.apply(this, arguments);
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


let UUIDV4 = /*#__PURE__*/function (_ABSTRACT16) {
  _inherits(UUIDV4, _ABSTRACT16);

  var _super27 = _createSuper(UUIDV4);

  function UUIDV4() {
    _classCallCheck(this, UUIDV4);

    return _super27.apply(this, arguments);
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


let VIRTUAL = /*#__PURE__*/function (_ABSTRACT17) {
  _inherits(VIRTUAL, _ABSTRACT17);

  var _super28 = _createSuper(VIRTUAL);

  /**
   * @param {ABSTRACT} [ReturnType] return type for virtual type
   * @param {Array} [fields] array of fields this virtual type is dependent on
   */
  function VIRTUAL(ReturnType, fields) {
    var _this7;

    _classCallCheck(this, VIRTUAL);

    _this7 = _super28.call(this);
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


let ENUM = /*#__PURE__*/function (_ABSTRACT18) {
  _inherits(ENUM, _ABSTRACT18);

  var _super29 = _createSuper(ENUM);

  /**
   * @param {...any|{ values: any[] }|any[]} args either array of values or options object with values array. It also supports variadic values
   */
  function ENUM(...args) {
    var _this8;

    _classCallCheck(this, ENUM);

    _this8 = _super29.call(this);
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


let ARRAY = /*#__PURE__*/function (_ABSTRACT19) {
  _inherits(ARRAY, _ABSTRACT19);

  var _super30 = _createSuper(ARRAY);

  /**
   * @param {ABSTRACT} type type of array values
   */
  function ARRAY(type) {
    var _this9;

    _classCallCheck(this, ARRAY);

    _this9 = _super30.call(this);
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
 * The cidr type holds an IPv4 or IPv6 network specification. Takes 7 or 19 bytes.
 *
 * Only available for Postgres
 */


let CIDR = /*#__PURE__*/function (_ABSTRACT20) {
  _inherits(CIDR, _ABSTRACT20);

  var _super31 = _createSuper(CIDR);

  function CIDR() {
    _classCallCheck(this, CIDR);

    return _super31.apply(this, arguments);
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


let INET = /*#__PURE__*/function (_ABSTRACT21) {
  _inherits(INET, _ABSTRACT21);

  var _super32 = _createSuper(INET);

  function INET() {
    _classCallCheck(this, INET);

    return _super32.apply(this, arguments);
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


let MACADDR = /*#__PURE__*/function (_ABSTRACT22) {
  _inherits(MACADDR, _ABSTRACT22);

  var _super33 = _createSuper(MACADDR);

  function MACADDR() {
    _classCallCheck(this, MACADDR);

    return _super33.apply(this, arguments);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9kYXRhLXR5cGVzLmpzIl0sIm5hbWVzIjpbInV0aWwiLCJyZXF1aXJlIiwiXyIsInNlcXVlbGl6ZUVycm9ycyIsIlZhbGlkYXRvciIsInZhbGlkYXRvciIsIm1vbWVudFR6IiwibW9tZW50IiwibG9nZ2VyIiwid2FybmluZ3MiLCJjbGFzc1RvSW52b2thYmxlIiwiQUJTVFJBQ1QiLCJvcHRpb25zIiwidG9TcWwiLCJrZXkiLCJ2YWx1ZSIsIl9zdHJpbmdpZnkiLCJfYmluZFBhcmFtIiwiYmluZFBhcmFtIiwic3RyaW5naWZ5IiwibmFtZSIsImxpbmsiLCJ0ZXh0Iiwid2FybiIsIm9sZFR5cGUiLCJwcm90b3R5cGUiLCJkaWFsZWN0VHlwZXMiLCJTVFJJTkciLCJsZW5ndGgiLCJiaW5hcnkiLCJfYmluYXJ5IiwiX2xlbmd0aCIsIk9iamVjdCIsInRvU3RyaW5nIiwiY2FsbCIsIkJ1ZmZlciIsImlzQnVmZmVyIiwiVmFsaWRhdGlvbkVycm9yIiwiZm9ybWF0IiwiQklOQVJZIiwiQ0hBUiIsIlRFWFQiLCJ0b0xvd2VyQ2FzZSIsIkNJVEVYVCIsIk5VTUJFUiIsIl96ZXJvZmlsbCIsInplcm9maWxsIiwiX2RlY2ltYWxzIiwiZGVjaW1hbHMiLCJfcHJlY2lzaW9uIiwicHJlY2lzaW9uIiwiX3NjYWxlIiwic2NhbGUiLCJfdW5zaWduZWQiLCJ1bnNpZ25lZCIsInJlc3VsdCIsImlzRmxvYXQiLCJTdHJpbmciLCJudW1iZXIiLCJ1bmRlZmluZWQiLCJVTlNJR05FRCIsIlpFUk9GSUxMIiwiSU5URUdFUiIsImlzSW50IiwiVElOWUlOVCIsIlNNQUxMSU5UIiwiTUVESVVNSU5UIiwiQklHSU5UIiwiRkxPQVQiLCJSRUFMIiwiRE9VQkxFIiwiREVDSU1BTCIsImZpbHRlciIsImlkZW50aXR5Iiwiam9pbiIsImlzRGVjaW1hbCIsInByb3RvRXh0ZW5zaW9ucyIsImVzY2FwZSIsIl92YWx1ZSIsImlzTmFOIiwiaXNGaW5pdGUiLCJzaWduIiwiZmxvYXRpbmciLCJhc3NpZ24iLCJCT09MRUFOIiwiaXNCb29sZWFuIiwidHlwZSIsInBhcnNlIiwiX3Nhbml0aXplIiwiVElNRSIsIkRBVEUiLCJpc0RhdGUiLCJyYXciLCJEYXRlIiwib3JpZ2luYWxWYWx1ZSIsImdldFRpbWUiLCJkYXRlIiwidGltZXpvbmUiLCJ0eiIsInpvbmUiLCJ1dGNPZmZzZXQiLCJfYXBwbHlUaW1lem9uZSIsIkRBVEVPTkxZIiwiSFNUT1JFIiwiaXNQbGFpbk9iamVjdCIsIkpTT05UWVBFIiwiSlNPTiIsIkpTT05CIiwiTk9XIiwiQkxPQiIsIkFycmF5IiwiaXNBcnJheSIsImZyb20iLCJoZXgiLCJfaGV4aWZ5IiwiUkFOR0UiLCJzdWJ0eXBlIiwiX3N1YnR5cGUiLCJVVUlEIiwiaXNVVUlEIiwiYWNjZXB0U3RyaW5ncyIsIlVVSURWMSIsIlVVSURWNCIsIlZJUlRVQUwiLCJSZXR1cm5UeXBlIiwiZmllbGRzIiwicmV0dXJuVHlwZSIsIkVOVU0iLCJhcmdzIiwidmFsdWVzIiwicmVkdWNlIiwiZWxlbWVudCIsImNvbmNhdCIsImluY2x1ZGVzIiwiQVJSQVkiLCJvYmoiLCJDSURSIiwiaXNJUFJhbmdlIiwiSU5FVCIsImlzSVAiLCJNQUNBRERSIiwiaXNNQUNBZGRyZXNzIiwiRGF0YVR5cGVzIiwibW9kdWxlIiwiZXhwb3J0cyIsIk5VTUVSSUMiLCJlYWNoIiwiZGF0YVR5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsInR5cGVzIiwiZGlhbGVjdE1hcCIsInNxbGl0ZSIsImRpYWxlY3RMaXN0IiwiZGF0YVR5cGVzIiwiRGF0YVR5cGUiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsSUFBSSxHQUFHQyxPQUFPLENBQUMsTUFBRCxDQUFwQjs7QUFDQSxNQUFNQyxDQUFDLEdBQUdELE9BQU8sQ0FBQyxRQUFELENBQWpCOztBQUNBLE1BQU1FLGVBQWUsR0FBR0YsT0FBTyxDQUFDLFVBQUQsQ0FBL0I7O0FBQ0EsTUFBTUcsU0FBUyxHQUFHSCxPQUFPLENBQUMs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QUF4QyxDQUFwQjtBQUNBOztBQUVBLE1BQU1VLFdBQVcsR0FBR3RKLENBQUMsQ0FBQytILE1BQUYsQ0FBU3FCLFVBQVQsQ0FBcEI7O0FBRUEsS0FBSyxNQUFNRyxTQUFYLElBQXdCRCxXQUF4QixFQUFxQztBQUNuQ3RKLEVBQUFBLENBQUMsQ0FBQ2dKLElBQUYsQ0FBT08sU0FBUCxFQUFrQixDQUFDQyxRQUFELEVBQVc1SSxHQUFYLEtBQW1CO0FBQ25DLFFBQUksQ0FBQzRJLFFBQVEsQ0FBQzVJLEdBQWQsRUFBbUI7QUFDakI0SSxNQUFBQSxRQUFRLENBQUM1SSxHQUFULEdBQWU0SSxRQUFRLENBQUNqSSxTQUFULENBQW1CWCxHQUFuQixHQUF5QkEsR0FBeEM7QUFDRDtBQUNGLEdBSkQ7QUFLRCxDLENBRUQ7OztBQUNBLEtBQUssTUFBTTJJLFNBQVgsSUFBd0IsQ0FBQ1gsU0FBRCxFQUFZLEdBQUdVLFdBQWYsQ0FBeEIsRUFBcUQ7QUFDbkR0SixFQUFBQSxDQUFDLENBQUNnSixJQUFGLENBQU9PLFNBQVAsRUFBa0IsQ0FBQ0MsUUFBRCxFQUFXNUksR0FBWCxLQUFtQjtBQUNuQzJJLElBQUFBLFNBQVMsQ0FBQzNJLEdBQUQsQ0FBVCxHQUFpQkosZ0JBQWdCLENBQUNnSixRQUFELENBQWpDO0FBQ0QsR0FGRDtBQUdEOztBQUVEMUgsTUFBTSxDQUFDbUQsTUFBUCxDQUFjMkQsU0FBZCxFQUF5QlEsVUFBekIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBzZXF1ZWxpemVFcnJvcnMgPSByZXF1aXJlKCcuL2Vycm9ycycpO1xuY29uc3QgVmFsaWRhdG9yID0gcmVxdWlyZSgnLi91dGlscy92YWxpZGF0b3ItZXh0cmFzJykudmFsaWRhdG9yO1xuY29uc3QgbW9tZW50VHogPSByZXF1aXJlKCdtb21lbnQtdGltZXpvbmUnKTtcbmNvbnN0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuY29uc3QgeyBsb2dnZXIgfSA9IHJlcXVpcmUoJy4vdXRpbHMvbG9nZ2VyJyk7XG5jb25zdCB3YXJuaW5ncyA9IHt9O1xuY29uc3QgeyBjbGFzc1RvSW52b2thYmxlIH0gPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzVG9JbnZva2FibGUnKTtcblxuY2xhc3MgQUJTVFJBQ1Qge1xuICB0b1N0cmluZyhvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMudG9TcWwob3B0aW9ucyk7XG4gIH1cbiAgdG9TcWwoKSB7XG4gICAgcmV0dXJuIHRoaXMua2V5O1xuICB9XG4gIHN0cmluZ2lmeSh2YWx1ZSwgb3B0aW9ucykge1xuICAgIGlmICh0aGlzLl9zdHJpbmdpZnkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdHJpbmdpZnkodmFsdWUsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgYmluZFBhcmFtKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgaWYgKHRoaXMuX2JpbmRQYXJhbSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2JpbmRQYXJhbSh2YWx1ZSwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zLmJpbmRQYXJhbSh0aGlzLnN0cmluZ2lmeSh2YWx1ZSwgb3B0aW9ucykpO1xuICB9XG4gIHN0YXRpYyB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lO1xuICB9XG4gIHN0YXRpYyB3YXJuKGxpbmssIHRleHQpIHtcbiAgICBpZiAoIXdhcm5pbmdzW3RleHRdKSB7XG4gICAgICB3YXJuaW5nc1t0ZXh0XSA9IHRydWU7XG4gICAgICBsb2dnZXIud2FybihgJHt0ZXh0fSBcXG4+PiBDaGVjazogJHtsaW5rfWApO1xuICAgIH1cbiAgfVxuICBzdGF0aWMgZXh0ZW5kKG9sZFR5cGUpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMob2xkVHlwZS5vcHRpb25zKTtcbiAgfVxufVxuXG5BQlNUUkFDVC5wcm90b3R5cGUuZGlhbGVjdFR5cGVzID0gJyc7XG5cbi8qKlxuICogU1RSSU5HIEEgdmFyaWFibGUgbGVuZ3RoIHN0cmluZ1xuICovXG5jbGFzcyBTVFJJTkcgZXh0ZW5kcyBBQlNUUkFDVCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD0yNTVdIGxlbmd0aCBvZiBzdHJpbmdcbiAgICogQHBhcmFtIHtib29sZWFufSBbYmluYXJ5PWZhbHNlXSBJcyB0aGlzIGJpbmFyeT9cbiAgICovXG4gIGNvbnN0cnVjdG9yKGxlbmd0aCwgYmluYXJ5KSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zdCBvcHRpb25zID0gdHlwZW9mIGxlbmd0aCA9PT0gJ29iamVjdCcgJiYgbGVuZ3RoIHx8IHsgbGVuZ3RoLCBiaW5hcnkgfTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuX2JpbmFyeSA9IG9wdGlvbnMuYmluYXJ5O1xuICAgIHRoaXMuX2xlbmd0aCA9IG9wdGlvbnMubGVuZ3RoIHx8IDI1NTtcbiAgfVxuICB0b1NxbCgpIHtcbiAgICByZXR1cm4gYFZBUkNIQVIoJHt0aGlzLl9sZW5ndGh9KSR7dGhpcy5fYmluYXJ5ID8gJyBCSU5BUlknIDogJyd9YDtcbiAgfVxuICB2YWxpZGF0ZSh2YWx1ZSkge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICE9PSAnW29iamVjdCBTdHJpbmddJykge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5iaW5hcnkgJiYgQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIHN0cmluZycsIHZhbHVlKSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZ2V0IEJJTkFSWSgpIHtcbiAgICB0aGlzLl9iaW5hcnkgPSB0cnVlO1xuICAgIHRoaXMub3B0aW9ucy5iaW5hcnkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc3RhdGljIGdldCBCSU5BUlkoKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKCkuQklOQVJZO1xuICB9XG59XG5cbi8qKlxuICogQ0hBUiBBIGZpeGVkIGxlbmd0aCBzdHJpbmdcbiAqL1xuY2xhc3MgQ0hBUiBleHRlbmRzIFNUUklORyB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD0yNTVdIGxlbmd0aCBvZiBzdHJpbmdcbiAgICogQHBhcmFtIHtib29sZWFufSBbYmluYXJ5PWZhbHNlXSBJcyB0aGlzIGJpbmFyeT9cbiAgICovXG4gIGNvbnN0cnVjdG9yKGxlbmd0aCwgYmluYXJ5KSB7XG4gICAgc3VwZXIodHlwZW9mIGxlbmd0aCA9PT0gJ29iamVjdCcgJiYgbGVuZ3RoIHx8IHsgbGVuZ3RoLCBiaW5hcnkgfSk7XG4gIH1cbiAgdG9TcWwoKSB7XG4gICAgcmV0dXJuIGBDSEFSKCR7dGhpcy5fbGVuZ3RofSkke3RoaXMuX2JpbmFyeSA/ICcgQklOQVJZJyA6ICcnfWA7XG4gIH1cbn1cblxuLyoqXG4gKiBVbmxpbWl0ZWQgbGVuZ3RoIFRFWFQgY29sdW1uXG4gKi9cbmNsYXNzIFRFWFQgZXh0ZW5kcyBBQlNUUkFDVCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xlbmd0aD0nJ10gY291bGQgYmUgdGlueSwgbWVkaXVtLCBsb25nLlxuICAgKi9cbiAgY29uc3RydWN0b3IobGVuZ3RoKSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zdCBvcHRpb25zID0gdHlwZW9mIGxlbmd0aCA9PT0gJ29iamVjdCcgJiYgbGVuZ3RoIHx8IHsgbGVuZ3RoIH07XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLl9sZW5ndGggPSBvcHRpb25zLmxlbmd0aCB8fCAnJztcbiAgfVxuICB0b1NxbCgpIHtcbiAgICBzd2l0Y2ggKHRoaXMuX2xlbmd0aC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICBjYXNlICd0aW55JzpcbiAgICAgICAgcmV0dXJuICdUSU5ZVEVYVCc7XG4gICAgICBjYXNlICdtZWRpdW0nOlxuICAgICAgICByZXR1cm4gJ01FRElVTVRFWFQnO1xuICAgICAgY2FzZSAnbG9uZyc6XG4gICAgICAgIHJldHVybiAnTE9OR1RFWFQnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5O1xuICAgIH1cbiAgfVxuICB2YWxpZGF0ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgc3RyaW5nJywgdmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiB1bmxpbWl0ZWQgbGVuZ3RoIGNhc2UtaW5zZW5zaXRpdmUgdGV4dCBjb2x1bW4uXG4gKiBPcmlnaW5hbCBjYXNlIGlzIHByZXNlcnZlZCBidXQgYWN0cyBjYXNlLWluc2Vuc2l0aXZlIHdoZW4gY29tcGFyaW5nIHZhbHVlcyAoc3VjaCBhcyB3aGVuIGZpbmRpbmcgb3IgdW5pcXVlIGNvbnN0cmFpbnRzKS5cbiAqIE9ubHkgYXZhaWxhYmxlIGluIFBvc3RncmVzIGFuZCBTUUxpdGUuXG4gKlxuICovXG5jbGFzcyBDSVRFWFQgZXh0ZW5kcyBBQlNUUkFDVCB7XG4gIHRvU3FsKCkge1xuICAgIHJldHVybiAnQ0lURVhUJztcbiAgfVxuICB2YWxpZGF0ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgc3RyaW5nJywgdmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBCYXNlIG51bWJlciB0eXBlIHdoaWNoIGlzIHVzZWQgdG8gYnVpbGQgb3RoZXIgdHlwZXNcbiAqL1xuY2xhc3MgTlVNQkVSIGV4dGVuZHMgQUJTVFJBQ1Qge1xuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgdHlwZSBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW29wdGlvbnMubGVuZ3RoXSBsZW5ndGggb2YgdHlwZSwgbGlrZSBgSU5UKDQpYFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnplcm9maWxsXSBJcyB6ZXJvIGZpbGxlZD9cbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy51bnNpZ25lZF0gSXMgdW5zaWduZWQ/XG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW29wdGlvbnMuZGVjaW1hbHNdIG51bWJlciBvZiBkZWNpbWFsIHBvaW50cywgdXNlZCB3aXRoIGxlbmd0aCBgRkxPQVQoNSwgNClgXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW29wdGlvbnMucHJlY2lzaW9uXSBkZWZpbmVzIHByZWNpc2lvbiBmb3IgZGVjaW1hbCB0eXBlXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW29wdGlvbnMuc2NhbGVdIGRlZmluZXMgc2NhbGUgZm9yIGRlY2ltYWwgdHlwZVxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdudW1iZXInKSB7XG4gICAgICBvcHRpb25zID0ge1xuICAgICAgICBsZW5ndGg6IG9wdGlvbnNcbiAgICAgIH07XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5fbGVuZ3RoID0gb3B0aW9ucy5sZW5ndGg7XG4gICAgdGhpcy5femVyb2ZpbGwgPSBvcHRpb25zLnplcm9maWxsO1xuICAgIHRoaXMuX2RlY2ltYWxzID0gb3B0aW9ucy5kZWNpbWFscztcbiAgICB0aGlzLl9wcmVjaXNpb24gPSBvcHRpb25zLnByZWNpc2lvbjtcbiAgICB0aGlzLl9zY2FsZSA9IG9wdGlvbnMuc2NhbGU7XG4gICAgdGhpcy5fdW5zaWduZWQgPSBvcHRpb25zLnVuc2lnbmVkO1xuICB9XG4gIHRvU3FsKCkge1xuICAgIGxldCByZXN1bHQgPSB0aGlzLmtleTtcbiAgICBpZiAodGhpcy5fbGVuZ3RoKSB7XG4gICAgICByZXN1bHQgKz0gYCgke3RoaXMuX2xlbmd0aH1gO1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9kZWNpbWFscyA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmVzdWx0ICs9IGAsJHt0aGlzLl9kZWNpbWFsc31gO1xuICAgICAgfVxuICAgICAgcmVzdWx0ICs9ICcpJztcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Vuc2lnbmVkKSB7XG4gICAgICByZXN1bHQgKz0gJyBVTlNJR05FRCc7XG4gICAgfVxuICAgIGlmICh0aGlzLl96ZXJvZmlsbCkge1xuICAgICAgcmVzdWx0ICs9ICcgWkVST0ZJTEwnO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIHZhbGlkYXRlKHZhbHVlKSB7XG4gICAgaWYgKCFWYWxpZGF0b3IuaXNGbG9hdChTdHJpbmcodmFsdWUpKSkge1xuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoYCVqIGlzIG5vdCBhIHZhbGlkICR7dGhpcy5rZXkudG9Mb3dlckNhc2UoKX1gLCB2YWx1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBfc3RyaW5naWZ5KG51bWJlcikge1xuICAgIGlmICh0eXBlb2YgbnVtYmVyID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgbnVtYmVyID09PSAnYm9vbGVhbicgfHwgbnVtYmVyID09PSBudWxsIHx8IG51bWJlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbnVtYmVyO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG51bWJlci50b1N0cmluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIG51bWJlci50b1N0cmluZygpO1xuICAgIH1cbiAgICByZXR1cm4gbnVtYmVyO1xuICB9XG5cbiAgZ2V0IFVOU0lHTkVEKCkge1xuICAgIHRoaXMuX3Vuc2lnbmVkID0gdHJ1ZTtcbiAgICB0aGlzLm9wdGlvbnMudW5zaWduZWQgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0IFpFUk9GSUxMKCkge1xuICAgIHRoaXMuX3plcm9maWxsID0gdHJ1ZTtcbiAgICB0aGlzLm9wdGlvbnMuemVyb2ZpbGwgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc3RhdGljIGdldCBVTlNJR05FRCgpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMoKS5VTlNJR05FRDtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgWkVST0ZJTEwoKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKCkuWkVST0ZJTEw7XG4gIH1cbn1cblxuLyoqXG4gKiBBIDMyIGJpdCBpbnRlZ2VyXG4gKi9cbmNsYXNzIElOVEVHRVIgZXh0ZW5kcyBOVU1CRVIge1xuICB2YWxpZGF0ZSh2YWx1ZSkge1xuICAgIGlmICghVmFsaWRhdG9yLmlzSW50KFN0cmluZyh2YWx1ZSkpKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdChgJWogaXMgbm90IGEgdmFsaWQgJHt0aGlzLmtleS50b0xvd2VyQ2FzZSgpfWAsIHZhbHVlKSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQSA4IGJpdCBpbnRlZ2VyXG4gKi9cbmNsYXNzIFRJTllJTlQgZXh0ZW5kcyBJTlRFR0VSIHtcbn1cblxuLyoqXG4gKiBBIDE2IGJpdCBpbnRlZ2VyXG4gKi9cbmNsYXNzIFNNQUxMSU5UIGV4dGVuZHMgSU5URUdFUiB7XG59XG5cbi8qKlxuICogQSAyNCBiaXQgaW50ZWdlclxuICovXG5jbGFzcyBNRURJVU1JTlQgZXh0ZW5kcyBJTlRFR0VSIHtcbn1cblxuLyoqXG4gKiBBIDY0IGJpdCBpbnRlZ2VyXG4gKi9cbmNsYXNzIEJJR0lOVCBleHRlbmRzIElOVEVHRVIge1xufVxuXG4vKipcbiAqIEZsb2F0aW5nIHBvaW50IG51bWJlciAoNC1ieXRlIHByZWNpc2lvbikuXG4gKi9cbmNsYXNzIEZMT0FUIGV4dGVuZHMgTlVNQkVSIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW2xlbmd0aF0gbGVuZ3RoIG9mIHR5cGUsIGxpa2UgYEZMT0FUKDQpYFxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtkZWNpbWFsc10gbnVtYmVyIG9mIGRlY2ltYWwgcG9pbnRzLCB1c2VkIHdpdGggbGVuZ3RoIGBGTE9BVCg1LCA0KWBcbiAgICovXG4gIGNvbnN0cnVjdG9yKGxlbmd0aCwgZGVjaW1hbHMpIHtcbiAgICBzdXBlcih0eXBlb2YgbGVuZ3RoID09PSAnb2JqZWN0JyAmJiBsZW5ndGggfHwgeyBsZW5ndGgsIGRlY2ltYWxzIH0pO1xuICB9XG4gIHZhbGlkYXRlKHZhbHVlKSB7XG4gICAgaWYgKCFWYWxpZGF0b3IuaXNGbG9hdChTdHJpbmcodmFsdWUpKSkge1xuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIGZsb2F0JywgdmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBGbG9hdGluZyBwb2ludCBudW1iZXIgKDQtYnl0ZSBwcmVjaXNpb24pLlxuICovXG5jbGFzcyBSRUFMIGV4dGVuZHMgTlVNQkVSIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW2xlbmd0aF0gbGVuZ3RoIG9mIHR5cGUsIGxpa2UgYFJFQUwoNClgXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW2RlY2ltYWxzXSBudW1iZXIgb2YgZGVjaW1hbCBwb2ludHMsIHVzZWQgd2l0aCBsZW5ndGggYFJFQUwoNSwgNClgXG4gICAqL1xuICBjb25zdHJ1Y3RvcihsZW5ndGgsIGRlY2ltYWxzKSB7XG4gICAgc3VwZXIodHlwZW9mIGxlbmd0aCA9PT0gJ29iamVjdCcgJiYgbGVuZ3RoIHx8IHsgbGVuZ3RoLCBkZWNpbWFscyB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEZsb2F0aW5nIHBvaW50IG51bWJlciAoOC1ieXRlIHByZWNpc2lvbikuXG4gKi9cbmNsYXNzIERPVUJMRSBleHRlbmRzIE5VTUJFUiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtsZW5ndGhdIGxlbmd0aCBvZiB0eXBlLCBsaWtlIGBET1VCTEUgUFJFQ0lTSU9OKDI1KWBcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbZGVjaW1hbHNdIG51bWJlciBvZiBkZWNpbWFsIHBvaW50cywgdXNlZCB3aXRoIGxlbmd0aCBgRE9VQkxFIFBSRUNJU0lPTigyNSwgMTApYFxuICAgKi9cbiAgY29uc3RydWN0b3IobGVuZ3RoLCBkZWNpbWFscykge1xuICAgIHN1cGVyKHR5cGVvZiBsZW5ndGggPT09ICdvYmplY3QnICYmIGxlbmd0aCB8fCB7IGxlbmd0aCwgZGVjaW1hbHMgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWNpbWFsIHR5cGUsIHZhcmlhYmxlIHByZWNpc2lvbiwgdGFrZSBsZW5ndGggYXMgc3BlY2lmaWVkIGJ5IHVzZXJcbiAqL1xuY2xhc3MgREVDSU1BTCBleHRlbmRzIE5VTUJFUiB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtwcmVjaXNpb25dIGRlZmluZXMgcHJlY2lzaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW3NjYWxlXSBkZWZpbmVzIHNjYWxlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihwcmVjaXNpb24sIHNjYWxlKSB7XG4gICAgc3VwZXIodHlwZW9mIHByZWNpc2lvbiA9PT0gJ29iamVjdCcgJiYgcHJlY2lzaW9uIHx8IHsgcHJlY2lzaW9uLCBzY2FsZSB9KTtcbiAgfVxuICB0b1NxbCgpIHtcbiAgICBpZiAodGhpcy5fcHJlY2lzaW9uIHx8IHRoaXMuX3NjYWxlKSB7XG4gICAgICByZXR1cm4gYERFQ0lNQUwoJHtbdGhpcy5fcHJlY2lzaW9uLCB0aGlzLl9zY2FsZV0uZmlsdGVyKF8uaWRlbnRpdHkpLmpvaW4oJywnKX0pYDtcbiAgICB9XG4gICAgcmV0dXJuICdERUNJTUFMJztcbiAgfVxuICB2YWxpZGF0ZSh2YWx1ZSkge1xuICAgIGlmICghVmFsaWRhdG9yLmlzRGVjaW1hbChTdHJpbmcodmFsdWUpKSkge1xuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIGRlY2ltYWwnLCB2YWx1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG4vLyBUT0RPOiBDcmVhdGUgaW50ZXJtZWRpYXRlIGNsYXNzXG5jb25zdCBwcm90b0V4dGVuc2lvbnMgPSB7XG4gIGVzY2FwZTogZmFsc2UsXG4gIF92YWx1ZSh2YWx1ZSkge1xuICAgIGlmIChpc05hTih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiAnTmFOJztcbiAgICB9XG4gICAgaWYgKCFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICAgIGNvbnN0IHNpZ24gPSB2YWx1ZSA8IDAgPyAnLScgOiAnJztcbiAgICAgIHJldHVybiBgJHtzaWdufUluZmluaXR5YDtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sXG4gIF9zdHJpbmdpZnkodmFsdWUpIHtcbiAgICByZXR1cm4gYCcke3RoaXMuX3ZhbHVlKHZhbHVlKX0nYDtcbiAgfSxcbiAgX2JpbmRQYXJhbSh2YWx1ZSwgb3B0aW9ucykge1xuICAgIHJldHVybiBvcHRpb25zLmJpbmRQYXJhbSh0aGlzLl92YWx1ZSh2YWx1ZSkpO1xuICB9XG59O1xuXG5mb3IgKGNvbnN0IGZsb2F0aW5nIG9mIFtGTE9BVCwgRE9VQkxFLCBSRUFMXSkge1xuICBPYmplY3QuYXNzaWduKGZsb2F0aW5nLnByb3RvdHlwZSwgcHJvdG9FeHRlbnNpb25zKTtcbn1cblxuLyoqXG4gKiBBIGJvb2xlYW4gLyB0aW55aW50IGNvbHVtbiwgZGVwZW5kaW5nIG9uIGRpYWxlY3RcbiAqL1xuY2xhc3MgQk9PTEVBTiBleHRlbmRzIEFCU1RSQUNUIHtcbiAgdG9TcWwoKSB7XG4gICAgcmV0dXJuICdUSU5ZSU5UKDEpJztcbiAgfVxuICB2YWxpZGF0ZSh2YWx1ZSkge1xuICAgIGlmICghVmFsaWRhdG9yLmlzQm9vbGVhbihTdHJpbmcodmFsdWUpKSkge1xuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIGJvb2xlYW4nLCB2YWx1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBfc2FuaXRpemUodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIC8vIEJpdCBmaWVsZHMgYXJlIHJldHVybmVkIGFzIGJ1ZmZlcnNcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVswXTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gICAgICBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gT25seSB0YWtlIGFjdGlvbiBvbiB2YWxpZCBib29sZWFuIHN0cmluZ3MuXG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gJ3RydWUnID8gdHJ1ZSA6IHZhbHVlID09PSAnZmFsc2UnID8gZmFsc2UgOiB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBPbmx5IHRha2UgYWN0aW9uIG9uIHZhbGlkIGJvb2xlYW4gaW50ZWdlcnMuXG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gMSA/IHRydWUgOiB2YWx1ZSA9PT0gMCA/IGZhbHNlIDogdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuXG5cbkJPT0xFQU4ucGFyc2UgPSBCT09MRUFOLnByb3RvdHlwZS5fc2FuaXRpemU7XG5cbi8qKlxuICogQSB0aW1lIGNvbHVtblxuICpcbiAqL1xuY2xhc3MgVElNRSBleHRlbmRzIEFCU1RSQUNUIHtcbiAgdG9TcWwoKSB7XG4gICAgcmV0dXJuICdUSU1FJztcbiAgfVxufVxuXG4vKipcbiAqIERhdGUgY29sdW1uIHdpdGggdGltZXpvbmUsIGRlZmF1bHQgaXMgVVRDXG4gKi9cbmNsYXNzIERBVEUgZXh0ZW5kcyBBQlNUUkFDVCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtsZW5ndGhdIHByZWNpc2lvbiB0byBhbGxvdyBzdG9yaW5nIG1pbGxpc2Vjb25kc1xuICAgKi9cbiAgY29uc3RydWN0b3IobGVuZ3RoKSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zdCBvcHRpb25zID0gdHlwZW9mIGxlbmd0aCA9PT0gJ29iamVjdCcgJiYgbGVuZ3RoIHx8IHsgbGVuZ3RoIH07XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLl9sZW5ndGggPSBvcHRpb25zLmxlbmd0aCB8fCAnJztcbiAgfVxuICB0b1NxbCgpIHtcbiAgICByZXR1cm4gJ0RBVEVUSU1FJztcbiAgfVxuICB2YWxpZGF0ZSh2YWx1ZSkge1xuICAgIGlmICghVmFsaWRhdG9yLmlzRGF0ZShTdHJpbmcodmFsdWUpKSkge1xuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIGRhdGUnLCB2YWx1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBfc2FuaXRpemUodmFsdWUsIG9wdGlvbnMpIHtcbiAgICBpZiAoKCFvcHRpb25zIHx8IG9wdGlvbnMgJiYgIW9wdGlvbnMucmF3KSAmJiAhKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkgJiYgISF2YWx1ZSkge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIF9pc0NoYW5nZWQodmFsdWUsIG9yaWdpbmFsVmFsdWUpIHtcbiAgICBpZiAob3JpZ2luYWxWYWx1ZSAmJiAhIXZhbHVlICYmXG4gICAgICAodmFsdWUgPT09IG9yaWdpbmFsVmFsdWUgfHxcbiAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiBEYXRlICYmIG9yaWdpbmFsVmFsdWUgaW5zdGFuY2VvZiBEYXRlICYmIHZhbHVlLmdldFRpbWUoKSA9PT0gb3JpZ2luYWxWYWx1ZS5nZXRUaW1lKCkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIG5vdCBjaGFuZ2VkIHdoZW4gc2V0IHRvIHNhbWUgZW1wdHkgdmFsdWVcbiAgICBpZiAoIW9yaWdpbmFsVmFsdWUgJiYgIXZhbHVlICYmIG9yaWdpbmFsVmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIF9hcHBseVRpbWV6b25lKGRhdGUsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy50aW1lem9uZSkge1xuICAgICAgaWYgKG1vbWVudFR6LnR6LnpvbmUob3B0aW9ucy50aW1lem9uZSkpIHtcbiAgICAgICAgcmV0dXJuIG1vbWVudFR6KGRhdGUpLnR6KG9wdGlvbnMudGltZXpvbmUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRhdGUgPSBtb21lbnQoZGF0ZSkudXRjT2Zmc2V0KG9wdGlvbnMudGltZXpvbmUpO1xuICAgIH1cbiAgICByZXR1cm4gbW9tZW50VHooZGF0ZSk7XG4gIH1cbiAgX3N0cmluZ2lmeShkYXRlLCBvcHRpb25zKSB7XG4gICAgZGF0ZSA9IHRoaXMuX2FwcGx5VGltZXpvbmUoZGF0ZSwgb3B0aW9ucyk7XG4gICAgLy8gWiBoZXJlIG1lYW5zIGN1cnJlbnQgdGltZXpvbmUsIF9ub3RfIFVUQ1xuICAgIHJldHVybiBkYXRlLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcy5TU1MgWicpO1xuICB9XG59XG5cbi8qKlxuICogQSBkYXRlIG9ubHkgY29sdW1uIChubyB0aW1lc3RhbXApXG4gKi9cbmNsYXNzIERBVEVPTkxZIGV4dGVuZHMgQUJTVFJBQ1Qge1xuICB0b1NxbCgpIHtcbiAgICByZXR1cm4gJ0RBVEUnO1xuICB9XG4gIF9zdHJpbmdpZnkoZGF0ZSkge1xuICAgIHJldHVybiBtb21lbnQoZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gIH1cbiAgX3Nhbml0aXplKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgaWYgKCghb3B0aW9ucyB8fCBvcHRpb25zICYmICFvcHRpb25zLnJhdykgJiYgISF2YWx1ZSkge1xuICAgICAgcmV0dXJuIG1vbWVudCh2YWx1ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBfaXNDaGFuZ2VkKHZhbHVlLCBvcmlnaW5hbFZhbHVlKSB7XG4gICAgaWYgKG9yaWdpbmFsVmFsdWUgJiYgISF2YWx1ZSAmJiBvcmlnaW5hbFZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBub3QgY2hhbmdlZCB3aGVuIHNldCB0byBzYW1lIGVtcHR5IHZhbHVlXG4gICAgaWYgKCFvcmlnaW5hbFZhbHVlICYmICF2YWx1ZSAmJiBvcmlnaW5hbFZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG4vKipcbiAqIEEga2V5IC8gdmFsdWUgc3RvcmUgY29sdW1uLiBPbmx5IGF2YWlsYWJsZSBpbiBQb3N0Z3Jlcy5cbiAqL1xuY2xhc3MgSFNUT1JFIGV4dGVuZHMgQUJTVFJBQ1Qge1xuICB2YWxpZGF0ZSh2YWx1ZSkge1xuICAgIGlmICghXy5pc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5WYWxpZGF0aW9uRXJyb3IodXRpbC5mb3JtYXQoJyVqIGlzIG5vdCBhIHZhbGlkIGhzdG9yZScsIHZhbHVlKSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQSBKU09OIHN0cmluZyBjb2x1bW4uIEF2YWlsYWJsZSBpbiBNeVNRTCwgUG9zdGdyZXMgYW5kIFNRTGl0ZVxuICovXG5jbGFzcyBKU09OVFlQRSBleHRlbmRzIEFCU1RSQUNUIHtcbiAgdmFsaWRhdGUoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgX3N0cmluZ2lmeSh2YWx1ZSkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGJpbmFyeSBzdG9yYWdlIEpTT04gY29sdW1uLiBPbmx5IGF2YWlsYWJsZSBpbiBQb3N0Z3Jlcy5cbiAqL1xuY2xhc3MgSlNPTkIgZXh0ZW5kcyBKU09OVFlQRSB7XG59XG5cbi8qKlxuICogQSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBjdXJyZW50IHRpbWVzdGFtcFxuICovXG5jbGFzcyBOT1cgZXh0ZW5kcyBBQlNUUkFDVCB7XG59XG5cbi8qKlxuICogQmluYXJ5IHN0b3JhZ2VcbiAqL1xuY2xhc3MgQkxPQiBleHRlbmRzIEFCU1RSQUNUIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGVuZ3RoPScnXSBjb3VsZCBiZSB0aW55LCBtZWRpdW0sIGxvbmcuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihsZW5ndGgpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSB0eXBlb2YgbGVuZ3RoID09PSAnb2JqZWN0JyAmJiBsZW5ndGggfHwgeyBsZW5ndGggfTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuX2xlbmd0aCA9IG9wdGlvbnMubGVuZ3RoIHx8ICcnO1xuICB9XG4gIHRvU3FsKCkge1xuICAgIHN3aXRjaCAodGhpcy5fbGVuZ3RoLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgIGNhc2UgJ3RpbnknOlxuICAgICAgICByZXR1cm4gJ1RJTllCTE9CJztcbiAgICAgIGNhc2UgJ21lZGl1bSc6XG4gICAgICAgIHJldHVybiAnTUVESVVNQkxPQic7XG4gICAgICBjYXNlICdsb25nJzpcbiAgICAgICAgcmV0dXJuICdMT05HQkxPQic7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5rZXk7XG4gICAgfVxuICB9XG4gIHZhbGlkYXRlKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0J1ZmZlcih2YWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KCclaiBpcyBub3QgYSB2YWxpZCBibG9iJywgdmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgX3N0cmluZ2lmeSh2YWx1ZSkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gQnVmZmVyLmZyb20odmFsdWUpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHZhbHVlID0gQnVmZmVyLmZyb20odmFsdWUudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGhleCA9IHZhbHVlLnRvU3RyaW5nKCdoZXgnKTtcbiAgICByZXR1cm4gdGhpcy5faGV4aWZ5KGhleCk7XG4gIH1cbiAgX2hleGlmeShoZXgpIHtcbiAgICByZXR1cm4gYFgnJHtoZXh9J2A7XG4gIH1cbiAgX2JpbmRQYXJhbSh2YWx1ZSwgb3B0aW9ucykge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gQnVmZmVyLmZyb20odmFsdWUpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHZhbHVlID0gQnVmZmVyLmZyb20odmFsdWUudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zLmJpbmRQYXJhbSh2YWx1ZSk7XG4gIH1cbn1cblxuXG5CTE9CLnByb3RvdHlwZS5lc2NhcGUgPSBmYWxzZTtcblxuLyoqXG4gKiBSYW5nZSB0eXBlcyBhcmUgZGF0YSB0eXBlcyByZXByZXNlbnRpbmcgYSByYW5nZSBvZiB2YWx1ZXMgb2Ygc29tZSBlbGVtZW50IHR5cGUgKGNhbGxlZCB0aGUgcmFuZ2UncyBzdWJ0eXBlKS5cbiAqIE9ubHkgYXZhaWxhYmxlIGluIFBvc3RncmVzLiBTZWUgW3RoZSBQb3N0Z3JlcyBkb2N1bWVudGF0aW9uXShodHRwOi8vd3d3LnBvc3RncmVzcWwub3JnL2RvY3MvOS40L3N0YXRpYy9yYW5nZXR5cGVzLmh0bWwpIGZvciBtb3JlIGRldGFpbHNcbiAqL1xuY2xhc3MgUkFOR0UgZXh0ZW5kcyBBQlNUUkFDVCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0FCU1RSQUNUfSBzdWJ0eXBlIEEgc3VidHlwZSBmb3IgcmFuZ2UsIGxpa2UgUkFOR0UoREFURSlcbiAgICovXG4gIGNvbnN0cnVjdG9yKHN1YnR5cGUpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBfLmlzUGxhaW5PYmplY3Qoc3VidHlwZSkgPyBzdWJ0eXBlIDogeyBzdWJ0eXBlIH07XG4gICAgaWYgKCFvcHRpb25zLnN1YnR5cGUpXG4gICAgICBvcHRpb25zLnN1YnR5cGUgPSBuZXcgSU5URUdFUigpO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zdWJ0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zLnN1YnR5cGUgPSBuZXcgb3B0aW9ucy5zdWJ0eXBlKCk7XG4gICAgfVxuICAgIHRoaXMuX3N1YnR5cGUgPSBvcHRpb25zLnN1YnR5cGUua2V5O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gIH1cbiAgdmFsaWRhdGUodmFsdWUpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgcmFuZ2UnLCB2YWx1ZSkpO1xuICAgIH1cbiAgICBpZiAodmFsdWUubGVuZ3RoICE9PSAyKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcignQSByYW5nZSBtdXN0IGJlIGFuIGFycmF5IHdpdGggdHdvIGVsZW1lbnRzJyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQSBjb2x1bW4gc3RvcmluZyBhIHVuaXF1ZSB1bml2ZXJzYWwgaWRlbnRpZmllci5cbiAqIFVzZSB3aXRoIGBVVUlEVjFgIG9yIGBVVUlEVjRgIGZvciBkZWZhdWx0IHZhbHVlcy5cbiAqL1xuY2xhc3MgVVVJRCBleHRlbmRzIEFCU1RSQUNUIHtcbiAgdmFsaWRhdGUodmFsdWUsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhVmFsaWRhdG9yLmlzVVVJRCh2YWx1ZSkgJiYgKCFvcHRpb25zIHx8ICFvcHRpb25zLmFjY2VwdFN0cmluZ3MpKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgdXVpZCcsIHZhbHVlKSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQSBkZWZhdWx0IHVuaXF1ZSB1bml2ZXJzYWwgaWRlbnRpZmllciBnZW5lcmF0ZWQgZm9sbG93aW5nIHRoZSBVVUlEIHYxIHN0YW5kYXJkXG4gKi9cbmNsYXNzIFVVSURWMSBleHRlbmRzIEFCU1RSQUNUIHtcbiAgdmFsaWRhdGUodmFsdWUsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhVmFsaWRhdG9yLmlzVVVJRCh2YWx1ZSkgJiYgKCFvcHRpb25zIHx8ICFvcHRpb25zLmFjY2VwdFN0cmluZ3MpKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgdXVpZCcsIHZhbHVlKSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQSBkZWZhdWx0IHVuaXF1ZSB1bml2ZXJzYWwgaWRlbnRpZmllciBnZW5lcmF0ZWQgZm9sbG93aW5nIHRoZSBVVUlEIHY0IHN0YW5kYXJkXG4gKi9cbmNsYXNzIFVVSURWNCBleHRlbmRzIEFCU1RSQUNUIHtcbiAgdmFsaWRhdGUodmFsdWUsIG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhVmFsaWRhdG9yLmlzVVVJRCh2YWx1ZSwgNCkgJiYgKCFvcHRpb25zIHx8ICFvcHRpb25zLmFjY2VwdFN0cmluZ3MpKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgdXVpZHY0JywgdmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHZpcnR1YWwgdmFsdWUgdGhhdCBpcyBub3Qgc3RvcmVkIGluIHRoZSBEQi4gVGhpcyBjb3VsZCBmb3IgZXhhbXBsZSBiZSB1c2VmdWwgaWYgeW91IHdhbnQgdG8gcHJvdmlkZSBhIGRlZmF1bHQgdmFsdWUgaW4geW91ciBtb2RlbCB0aGF0IGlzIHJldHVybmVkIHRvIHRoZSB1c2VyIGJ1dCBub3Qgc3RvcmVkIGluIHRoZSBEQi5cbiAqXG4gKiBZb3UgY291bGQgYWxzbyB1c2UgaXQgdG8gdmFsaWRhdGUgYSB2YWx1ZSBiZWZvcmUgcGVybXV0aW5nIGFuZCBzdG9yaW5nIGl0LiBWSVJUVUFMIGFsc28gdGFrZXMgYSByZXR1cm4gdHlwZSBhbmQgZGVwZW5kZW5jeSBmaWVsZHMgYXMgYXJndW1lbnRzXG4gKiBJZiBhIHZpcnR1YWwgYXR0cmlidXRlIGlzIHByZXNlbnQgaW4gYGF0dHJpYnV0ZXNgIGl0IHdpbGwgYXV0b21hdGljYWxseSBwdWxsIGluIHRoZSBleHRyYSBmaWVsZHMgYXMgd2VsbC5cbiAqIFJldHVybiB0eXBlIGlzIG1vc3RseSB1c2VmdWwgZm9yIHNldHVwcyB0aGF0IHJlbHkgb24gdHlwZXMgbGlrZSBHcmFwaFFMLlxuICpcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNoZWNraW5nIHBhc3N3b3JkIGxlbmd0aCBiZWZvcmUgaGFzaGluZyBpdDwvY2FwdGlvbj5cbiAqIHNlcXVlbGl6ZS5kZWZpbmUoJ3VzZXInLCB7XG4gKiAgIHBhc3N3b3JkX2hhc2g6IERhdGFUeXBlcy5TVFJJTkcsXG4gKiAgIHBhc3N3b3JkOiB7XG4gKiAgICAgdHlwZTogRGF0YVR5cGVzLlZJUlRVQUwsXG4gKiAgICAgc2V0OiBmdW5jdGlvbiAodmFsKSB7XG4gKiAgICAgICAgLy8gUmVtZW1iZXIgdG8gc2V0IHRoZSBkYXRhIHZhbHVlLCBvdGhlcndpc2UgaXQgd29uJ3QgYmUgdmFsaWRhdGVkXG4gKiAgICAgICAgdGhpcy5zZXREYXRhVmFsdWUoJ3Bhc3N3b3JkJywgdmFsKTtcbiAqICAgICAgICB0aGlzLnNldERhdGFWYWx1ZSgncGFzc3dvcmRfaGFzaCcsIHRoaXMuc2FsdCArIHZhbCk7XG4gKiAgICAgIH0sXG4gKiAgICAgIHZhbGlkYXRlOiB7XG4gKiAgICAgICAgIGlzTG9uZ0Vub3VnaDogZnVuY3Rpb24gKHZhbCkge1xuICogICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgNykge1xuICogICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGxlYXNlIGNob29zZSBhIGxvbmdlciBwYXNzd29yZFwiKVxuICogICAgICAgICAgfVxuICogICAgICAgfVxuICogICAgIH1cbiAqICAgfVxuICogfSlcbiAqXG4gKiAjIEluIHRoZSBhYm92ZSBjb2RlIHRoZSBwYXNzd29yZCBpcyBzdG9yZWQgcGxhaW5seSBpbiB0aGUgcGFzc3dvcmQgZmllbGQgc28gaXQgY2FuIGJlIHZhbGlkYXRlZCwgYnV0IGlzIG5ldmVyIHN0b3JlZCBpbiB0aGUgREIuXG4gKlxuICogQGV4YW1wbGUgPGNhcHRpb24+VmlydHVhbCB3aXRoIGRlcGVuZGVuY3kgZmllbGRzPC9jYXB0aW9uPlxuICoge1xuICogICBhY3RpdmU6IHtcbiAqICAgICB0eXBlOiBuZXcgRGF0YVR5cGVzLlZJUlRVQUwoRGF0YVR5cGVzLkJPT0xFQU4sIFsnY3JlYXRlZEF0J10pLFxuICogICAgIGdldDogZnVuY3Rpb24oKSB7XG4gKiAgICAgICByZXR1cm4gdGhpcy5nZXQoJ2NyZWF0ZWRBdCcpID4gRGF0ZS5ub3coKSAtICg3ICogMjQgKiA2MCAqIDYwICogMTAwMClcbiAqICAgICB9XG4gKiAgIH1cbiAqIH1cbiAqXG4gKi9cbmNsYXNzIFZJUlRVQUwgZXh0ZW5kcyBBQlNUUkFDVCB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0FCU1RSQUNUfSBbUmV0dXJuVHlwZV0gcmV0dXJuIHR5cGUgZm9yIHZpcnR1YWwgdHlwZVxuICAgKiBAcGFyYW0ge0FycmF5fSBbZmllbGRzXSBhcnJheSBvZiBmaWVsZHMgdGhpcyB2aXJ0dWFsIHR5cGUgaXMgZGVwZW5kZW50IG9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihSZXR1cm5UeXBlLCBmaWVsZHMpIHtcbiAgICBzdXBlcigpO1xuICAgIGlmICh0eXBlb2YgUmV0dXJuVHlwZSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIFJldHVyblR5cGUgPSBuZXcgUmV0dXJuVHlwZSgpO1xuICAgIHRoaXMucmV0dXJuVHlwZSA9IFJldHVyblR5cGU7XG4gICAgdGhpcy5maWVsZHMgPSBmaWVsZHM7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBlbnVtZXJhdGlvbiwgUG9zdGdyZXMgT25seVxuICpcbiAqIEBleGFtcGxlXG4gKiBEYXRhVHlwZXMuRU5VTSgndmFsdWUnLCAnYW5vdGhlciB2YWx1ZScpXG4gKiBEYXRhVHlwZXMuRU5VTShbJ3ZhbHVlJywgJ2Fub3RoZXIgdmFsdWUnXSlcbiAqIERhdGFUeXBlcy5FTlVNKHtcbiAqICAgdmFsdWVzOiBbJ3ZhbHVlJywgJ2Fub3RoZXIgdmFsdWUnXVxuICogfSlcbiAqL1xuY2xhc3MgRU5VTSBleHRlbmRzIEFCU1RSQUNUIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7Li4uYW55fHsgdmFsdWVzOiBhbnlbXSB9fGFueVtdfSBhcmdzIGVpdGhlciBhcnJheSBvZiB2YWx1ZXMgb3Igb3B0aW9ucyBvYmplY3Qgd2l0aCB2YWx1ZXMgYXJyYXkuIEl0IGFsc28gc3VwcG9ydHMgdmFyaWFkaWMgdmFsdWVzXG4gICAqL1xuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zdCB2YWx1ZSA9IGFyZ3NbMF07XG4gICAgY29uc3Qgb3B0aW9ucyA9IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlIHx8IHtcbiAgICAgIHZhbHVlczogYXJncy5yZWR1Y2UoKHJlc3VsdCwgZWxlbWVudCkgPT4ge1xuICAgICAgICByZXR1cm4gcmVzdWx0LmNvbmNhdChBcnJheS5pc0FycmF5KGVsZW1lbnQpID8gZWxlbWVudCA6IFtlbGVtZW50XSk7XG4gICAgICB9LCBbXSlcbiAgICB9O1xuICAgIHRoaXMudmFsdWVzID0gb3B0aW9ucy52YWx1ZXM7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgfVxuICB2YWxpZGF0ZSh2YWx1ZSkge1xuICAgIGlmICghdGhpcy52YWx1ZXMuaW5jbHVkZXModmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgY2hvaWNlIGluICVqJywgdmFsdWUsIHRoaXMudmFsdWVzKSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQW4gYXJyYXkgb2YgYHR5cGVgLiBPbmx5IGF2YWlsYWJsZSBpbiBQb3N0Z3Jlcy5cbiAqXG4gKiBAZXhhbXBsZVxuICogRGF0YVR5cGVzLkFSUkFZKERhdGFUeXBlcy5ERUNJTUFMKVxuICovXG5jbGFzcyBBUlJBWSBleHRlbmRzIEFCU1RSQUNUIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7QUJTVFJBQ1R9IHR5cGUgdHlwZSBvZiBhcnJheSB2YWx1ZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHR5cGUpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBfLmlzUGxhaW5PYmplY3QodHlwZSkgPyB0eXBlIDogeyB0eXBlIH07XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnR5cGUgPSB0eXBlb2Ygb3B0aW9ucy50eXBlID09PSAnZnVuY3Rpb24nID8gbmV3IG9wdGlvbnMudHlwZSgpIDogb3B0aW9ucy50eXBlO1xuICB9XG4gIHRvU3FsKCkge1xuICAgIHJldHVybiBgJHt0aGlzLnR5cGUudG9TcWwoKX1bXWA7XG4gIH1cbiAgdmFsaWRhdGUodmFsdWUpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgYXJyYXknLCB2YWx1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBzdGF0aWMgaXMob2JqLCB0eXBlKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIEFSUkFZICYmIG9iai50eXBlIGluc3RhbmNlb2YgdHlwZTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSBjaWRyIHR5cGUgaG9sZHMgYW4gSVB2NCBvciBJUHY2IG5ldHdvcmsgc3BlY2lmaWNhdGlvbi4gVGFrZXMgNyBvciAxOSBieXRlcy5cbiAqXG4gKiBPbmx5IGF2YWlsYWJsZSBmb3IgUG9zdGdyZXNcbiAqL1xuY2xhc3MgQ0lEUiBleHRlbmRzIEFCU1RSQUNUIHtcbiAgdmFsaWRhdGUodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhVmFsaWRhdG9yLmlzSVBSYW5nZSh2YWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KCclaiBpcyBub3QgYSB2YWxpZCBDSURSJywgdmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgSU5FVCB0eXBlIGhvbGRzIGFuIElQdjQgb3IgSVB2NiBob3N0IGFkZHJlc3MsIGFuZCBvcHRpb25hbGx5IGl0cyBzdWJuZXQuIFRha2VzIDcgb3IgMTkgYnl0ZXNcbiAqXG4gKiBPbmx5IGF2YWlsYWJsZSBmb3IgUG9zdGdyZXNcbiAqL1xuY2xhc3MgSU5FVCBleHRlbmRzIEFCU1RSQUNUIHtcbiAgdmFsaWRhdGUodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhVmFsaWRhdG9yLmlzSVAodmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlZhbGlkYXRpb25FcnJvcih1dGlsLmZvcm1hdCgnJWogaXMgbm90IGEgdmFsaWQgSU5FVCcsIHZhbHVlKSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogVGhlIE1BQ0FERFIgdHlwZSBzdG9yZXMgTUFDIGFkZHJlc3Nlcy4gVGFrZXMgNiBieXRlc1xuICpcbiAqIE9ubHkgYXZhaWxhYmxlIGZvciBQb3N0Z3Jlc1xuICpcbiAqL1xuY2xhc3MgTUFDQUREUiBleHRlbmRzIEFCU1RSQUNUIHtcbiAgdmFsaWRhdGUodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCAhVmFsaWRhdG9yLmlzTUFDQWRkcmVzcyh2YWx1ZSkpIHtcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuVmFsaWRhdGlvbkVycm9yKHV0aWwuZm9ybWF0KCclaiBpcyBub3QgYSB2YWxpZCBNQUNBRERSJywgdmFsdWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNvbnZlbmllbmNlIGNsYXNzIGhvbGRpbmcgY29tbW9ubHkgdXNlZCBkYXRhIHR5cGVzLiBUaGUgZGF0YSB0eXBlcyBhcmUgdXNlZCB3aGVuIGRlZmluaW5nIGEgbmV3IG1vZGVsIHVzaW5nIGBTZXF1ZWxpemUuZGVmaW5lYCwgbGlrZSB0aGlzOlxuICogYGBganNcbiAqIHNlcXVlbGl6ZS5kZWZpbmUoJ21vZGVsJywge1xuICogICBjb2x1bW46IERhdGFUeXBlcy5JTlRFR0VSXG4gKiB9KVxuICogYGBgXG4gKiBXaGVuIGRlZmluaW5nIGEgbW9kZWwgeW91IGNhbiBqdXN0IGFzIGVhc2lseSBwYXNzIGEgc3RyaW5nIGFzIHR5cGUsIGJ1dCBvZnRlbiB1c2luZyB0aGUgdHlwZXMgZGVmaW5lZCBoZXJlIGlzIGJlbmVmaWNpYWwuIEZvciBleGFtcGxlLCB1c2luZyBgRGF0YVR5cGVzLkJMT0JgLCBtZWFuXG4gKiB0aGF0IHRoYXQgY29sdW1uIHdpbGwgYmUgcmV0dXJuZWQgYXMgYW4gaW5zdGFuY2Ugb2YgYEJ1ZmZlcmAgd2hlbiBiZWluZyBmZXRjaGVkIGJ5IHNlcXVlbGl6ZS5cbiAqXG4gKiBUbyBwcm92aWRlIGEgbGVuZ3RoIGZvciB0aGUgZGF0YSB0eXBlLCB5b3UgY2FuIGludm9rZSBpdCBsaWtlIGEgZnVuY3Rpb246IGBJTlRFR0VSKDIpYFxuICpcbiAqIFNvbWUgZGF0YSB0eXBlcyBoYXZlIHNwZWNpYWwgcHJvcGVydGllcyB0aGF0IGNhbiBiZSBhY2Nlc3NlZCBpbiBvcmRlciB0byBjaGFuZ2UgdGhlIGRhdGEgdHlwZS5cbiAqIEZvciBleGFtcGxlLCB0byBnZXQgYW4gdW5zaWduZWQgaW50ZWdlciB3aXRoIHplcm9maWxsIHlvdSBjYW4gZG8gYERhdGFUeXBlcy5JTlRFR0VSLlVOU0lHTkVELlpFUk9GSUxMYC5cbiAqIFRoZSBvcmRlciB5b3UgYWNjZXNzIHRoZSBwcm9wZXJ0aWVzIGluIGRvIG5vdCBtYXR0ZXIsIHNvIGBEYXRhVHlwZXMuSU5URUdFUi5aRVJPRklMTC5VTlNJR05FRGAgaXMgZmluZSBhcyB3ZWxsLlxuICpcbiAqICogQWxsIG51bWJlciB0eXBlcyAoYElOVEVHRVJgLCBgQklHSU5UYCwgYEZMT0FUYCwgYERPVUJMRWAsIGBSRUFMYCwgYERFQ0lNQUxgKSBleHBvc2UgdGhlIHByb3BlcnRpZXMgYFVOU0lHTkVEYCBhbmQgYFpFUk9GSUxMYFxuICogKiBUaGUgYENIQVJgIGFuZCBgU1RSSU5HYCB0eXBlcyBleHBvc2UgdGhlIGBCSU5BUllgIHByb3BlcnR5XG4gKlxuICogVGhyZWUgb2YgdGhlIHZhbHVlcyBwcm92aWRlZCBoZXJlIChgTk9XYCwgYFVVSURWMWAgYW5kIGBVVUlEVjRgKSBhcmUgc3BlY2lhbCBkZWZhdWx0IHZhbHVlcywgdGhhdCBzaG91bGQgbm90IGJlIHVzZWQgdG8gZGVmaW5lIHR5cGVzLiBJbnN0ZWFkIHRoZXkgYXJlIHVzZWQgYXMgc2hvcnRoYW5kcyBmb3JcbiAqIGRlZmluaW5nIGRlZmF1bHQgdmFsdWVzLiBGb3IgZXhhbXBsZSwgdG8gZ2V0IGEgdXVpZCBmaWVsZCB3aXRoIGEgZGVmYXVsdCB2YWx1ZSBnZW5lcmF0ZWQgZm9sbG93aW5nIHYxIG9mIHRoZSBVVUlEIHN0YW5kYXJkOlxuICogYGBganNcbiAqIHNlcXVlbGl6ZS5kZWZpbmUoJ21vZGVsJywge1xuICogICB1dWlkOiB7XG4gKiAgICAgdHlwZTogRGF0YVR5cGVzLlVVSUQsXG4gKiAgICAgZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFYxLFxuICogICAgIHByaW1hcnlLZXk6IHRydWVcbiAqICAgfVxuICogfSlcbiAqIGBgYFxuICogVGhlcmUgbWF5IGJlIHRpbWVzIHdoZW4geW91IHdhbnQgdG8gZ2VuZXJhdGUgeW91ciBvd24gVVVJRCBjb25mb3JtaW5nIHRvIHNvbWUgb3RoZXIgYWxnb3JpdGhtLiBUaGlzIGlzIGFjY29tcGxpc2hlZFxuICogdXNpbmcgdGhlIGRlZmF1bHRWYWx1ZSBwcm9wZXJ0eSBhcyB3ZWxsLCBidXQgaW5zdGVhZCBvZiBzcGVjaWZ5aW5nIG9uZSBvZiB0aGUgc3VwcGxpZWQgVVVJRCB0eXBlcywgeW91IHJldHVybiBhIHZhbHVlXG4gKiBmcm9tIGEgZnVuY3Rpb24uXG4gKiBgYGBqc1xuICogc2VxdWVsaXplLmRlZmluZSgnbW9kZWwnLCB7XG4gKiAgIHV1aWQ6IHtcbiAqICAgICB0eXBlOiBEYXRhVHlwZXMuVVVJRCxcbiAqICAgICBkZWZhdWx0VmFsdWU6IGZ1bmN0aW9uKCkge1xuICogICAgICAgcmV0dXJuIGdlbmVyYXRlTXlJZCgpXG4gKiAgICAgfSxcbiAqICAgICBwcmltYXJ5S2V5OiB0cnVlXG4gKiAgIH1cbiAqIH0pXG4gKiBgYGBcbiAqL1xuY29uc3QgRGF0YVR5cGVzID0gbW9kdWxlLmV4cG9ydHMgPSB7XG4gIEFCU1RSQUNULFxuICBTVFJJTkcsXG4gIENIQVIsXG4gIFRFWFQsXG4gIE5VTUJFUixcbiAgVElOWUlOVCxcbiAgU01BTExJTlQsXG4gIE1FRElVTUlOVCxcbiAgSU5URUdFUixcbiAgQklHSU5ULFxuICBGTE9BVCxcbiAgVElNRSxcbiAgREFURSxcbiAgREFURU9OTFksXG4gIEJPT0xFQU4sXG4gIE5PVyxcbiAgQkxPQixcbiAgREVDSU1BTCxcbiAgTlVNRVJJQzogREVDSU1BTCxcbiAgVVVJRCxcbiAgVVVJRFYxLFxuICBVVUlEVjQsXG4gIEhTVE9SRSxcbiAgSlNPTjogSlNPTlRZUEUsXG4gIEpTT05CLFxuICBWSVJUVUFMLFxuICBBUlJBWSxcbiAgRU5VTSxcbiAgUkFOR0UsXG4gIFJFQUwsXG4gICdET1VCTEUgUFJFQ0lTSU9OJzogRE9VQkxFLFxuICBET1VCTEUsXG4gIENJRFIsXG4gIElORVQsXG4gIE1BQ0FERFIsXG4gIENJVEVYVFxufTtcblxuXy5lYWNoKERhdGFUeXBlcywgKGRhdGFUeXBlLCBuYW1lKSA9PiB7XG4gIC8vIGd1YXJkIGZvciBhbGlhc2VzXG4gIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGFUeXBlLCAna2V5JykpIHtcbiAgICBkYXRhVHlwZS50eXBlcyA9IHt9O1xuICAgIGRhdGFUeXBlLmtleSA9IGRhdGFUeXBlLnByb3RvdHlwZS5rZXkgPSBuYW1lO1xuICB9XG59KTtcblxuY29uc3QgZGlhbGVjdE1hcCA9IHt9O1xuLyogZGlhbGVjdE1hcC5wb3N0Z3JlcyA9IHJlcXVpcmUoJy4vZGlhbGVjdHMvcG9zdGdyZXMvZGF0YS10eXBlcycpKERhdGFUeXBlcyk7XG5kaWFsZWN0TWFwLm15c3FsID0gcmVxdWlyZSgnLi9kaWFsZWN0cy9teXNxbC9kYXRhLXR5cGVzJykoRGF0YVR5cGVzKTtcbmRpYWxlY3RNYXAubWFyaWFkYiA9IHJlcXVpcmUoJy4vZGlhbGVjdHMvbWFyaWFkYi9kYXRhLXR5cGVzJykoRGF0YVR5cGVzKTsgKi9cbmRpYWxlY3RNYXAuc3FsaXRlID0gcmVxdWlyZSgnLi9kaWFsZWN0cy9zcWxpdGUvZGF0YS10eXBlcycpKERhdGFUeXBlcyk7XG4vKiBkaWFsZWN0TWFwLm1zc3FsID0gcmVxdWlyZSgnLi9kaWFsZWN0cy9tc3NxbC9kYXRhLXR5cGVzJykoRGF0YVR5cGVzKTsgKi9cblxuY29uc3QgZGlhbGVjdExpc3QgPSBfLnZhbHVlcyhkaWFsZWN0TWFwKTtcblxuZm9yIChjb25zdCBkYXRhVHlwZXMgb2YgZGlhbGVjdExpc3QpIHtcbiAgXy5lYWNoKGRhdGFUeXBlcywgKERhdGFUeXBlLCBrZXkpID0+IHtcbiAgICBpZiAoIURhdGFUeXBlLmtleSkge1xuICAgICAgRGF0YVR5cGUua2V5ID0gRGF0YVR5cGUucHJvdG90eXBlLmtleSA9IGtleTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBXcmFwIGFsbCBkYXRhIHR5cGVzIHRvIG5vdCByZXF1aXJlIGBuZXdgXG5mb3IgKGNvbnN0IGRhdGFUeXBlcyBvZiBbRGF0YVR5cGVzLCAuLi5kaWFsZWN0TGlzdF0pIHtcbiAgXy5lYWNoKGRhdGFUeXBlcywgKERhdGFUeXBlLCBrZXkpID0+IHtcbiAgICBkYXRhVHlwZXNba2V5XSA9IGNsYXNzVG9JbnZva2FibGUoRGF0YVR5cGUpO1xuICB9KTtcbn1cblxuT2JqZWN0LmFzc2lnbihEYXRhVHlwZXMsIGRpYWxlY3RNYXApO1xuIl19