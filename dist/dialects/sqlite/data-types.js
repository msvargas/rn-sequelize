'use strict';

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

module.exports = BaseTypes => {
  const warn = BaseTypes.ABSTRACT.warn.bind(undefined, 'https://www.sqlite.org/datatype3.html');
  /**
   * Removes unsupported SQLite options, i.e., UNSIGNED and ZEROFILL, for the integer data types.
   *
   * @param {Object} dataType The base integer data type.
   * @private
   */

  function removeUnsupportedIntegerOptions(dataType) {
    if (dataType._zerofill || dataType._unsigned) {
      warn(`SQLite does not support '${dataType.key}' with UNSIGNED or ZEROFILL. Plain '${dataType.key}' will be used instead.`);
      dataType._unsigned = undefined;
      dataType._zerofill = undefined;
    }
  }
  /**
   * @see https://sqlite.org/datatype3.html
   */


  BaseTypes.DATE.types.sqlite = ['DATETIME'];
  BaseTypes.STRING.types.sqlite = ['VARCHAR', 'VARCHAR BINARY'];
  BaseTypes.CHAR.types.sqlite = ['CHAR', 'CHAR BINARY'];
  BaseTypes.TEXT.types.sqlite = ['TEXT'];
  BaseTypes.TINYINT.types.sqlite = ['TINYINT'];
  BaseTypes.SMALLINT.types.sqlite = ['SMALLINT'];
  BaseTypes.MEDIUMINT.types.sqlite = ['MEDIUMINT'];
  BaseTypes.INTEGER.types.sqlite = ['INTEGER'];
  BaseTypes.BIGINT.types.sqlite = ['BIGINT'];
  BaseTypes.FLOAT.types.sqlite = ['FLOAT'];
  BaseTypes.TIME.types.sqlite = ['TIME'];
  BaseTypes.DATEONLY.types.sqlite = ['DATE'];
  BaseTypes.BOOLEAN.types.sqlite = ['TINYINT'];
  BaseTypes.BLOB.types.sqlite = ['TINYBLOB', 'BLOB', 'LONGBLOB'];
  BaseTypes.DECIMAL.types.sqlite = ['DECIMAL'];
  BaseTypes.UUID.types.sqlite = ['UUID'];
  BaseTypes.ENUM.types.sqlite = false;
  BaseTypes.REAL.types.sqlite = ['REAL'];
  BaseTypes.DOUBLE.types.sqlite = ['DOUBLE PRECISION'];
  BaseTypes.GEOMETRY.types.sqlite = false;
  BaseTypes.JSON.types.sqlite = ['JSON', 'JSONB'];

  let JSONTYPE =
  /*#__PURE__*/
  function (_BaseTypes$JSON) {
    _inherits(JSONTYPE, _BaseTypes$JSON);

    function JSONTYPE() {
      _classCallCheck(this, JSONTYPE);

      return _possibleConstructorReturn(this, _getPrototypeOf(JSONTYPE).apply(this, arguments));
    }

    _createClass(JSONTYPE, null, [{
      key: "parse",
      value: function parse(data) {
        return JSON.parse(data);
      }
    }]);

    return JSONTYPE;
  }(BaseTypes.JSON);

  let DATE =
  /*#__PURE__*/
  function (_BaseTypes$DATE) {
    _inherits(DATE, _BaseTypes$DATE);

    function DATE() {
      _classCallCheck(this, DATE);

      return _possibleConstructorReturn(this, _getPrototypeOf(DATE).apply(this, arguments));
    }

    _createClass(DATE, null, [{
      key: "parse",
      value: function parse(date, options) {
        // Fix date parse react native - expo:!!
        console.log(date);
        return new Date(date.replace(' ', 'T').replace(' +', ':')); // We already have a timezone stored in the string
      }
    }]);

    return DATE;
  }(BaseTypes.DATE);

  let DATEONLY =
  /*#__PURE__*/
  function (_BaseTypes$DATEONLY) {
    _inherits(DATEONLY, _BaseTypes$DATEONLY);

    function DATEONLY() {
      _classCallCheck(this, DATEONLY);

      return _possibleConstructorReturn(this, _getPrototypeOf(DATEONLY).apply(this, arguments));
    }

    _createClass(DATEONLY, null, [{
      key: "parse",
      value: function parse(date) {
        return date;
      }
    }]);

    return DATEONLY;
  }(BaseTypes.DATEONLY);

  let STRING =
  /*#__PURE__*/
  function (_BaseTypes$STRING) {
    _inherits(STRING, _BaseTypes$STRING);

    function STRING() {
      _classCallCheck(this, STRING);

      return _possibleConstructorReturn(this, _getPrototypeOf(STRING).apply(this, arguments));
    }

    _createClass(STRING, [{
      key: "toSql",
      value: function toSql() {
        if (this._binary) {
          return `VARCHAR BINARY(${this._length})`;
        }

        return _get(_getPrototypeOf(STRING.prototype), "toSql", this).call(this, this);
      }
    }]);

    return STRING;
  }(BaseTypes.STRING);

  let TEXT =
  /*#__PURE__*/
  function (_BaseTypes$TEXT) {
    _inherits(TEXT, _BaseTypes$TEXT);

    function TEXT() {
      _classCallCheck(this, TEXT);

      return _possibleConstructorReturn(this, _getPrototypeOf(TEXT).apply(this, arguments));
    }

    _createClass(TEXT, [{
      key: "toSql",
      value: function toSql() {
        if (this._length) {
          warn('SQLite does not support TEXT with options. Plain `TEXT` will be used instead.');
          this._length = undefined;
        }

        return 'TEXT';
      }
    }]);

    return TEXT;
  }(BaseTypes.TEXT);

  let CITEXT =
  /*#__PURE__*/
  function (_BaseTypes$CITEXT) {
    _inherits(CITEXT, _BaseTypes$CITEXT);

    function CITEXT() {
      _classCallCheck(this, CITEXT);

      return _possibleConstructorReturn(this, _getPrototypeOf(CITEXT).apply(this, arguments));
    }

    _createClass(CITEXT, [{
      key: "toSql",
      value: function toSql() {
        return 'TEXT COLLATE NOCASE';
      }
    }]);

    return CITEXT;
  }(BaseTypes.CITEXT);

  let CHAR =
  /*#__PURE__*/
  function (_BaseTypes$CHAR) {
    _inherits(CHAR, _BaseTypes$CHAR);

    function CHAR() {
      _classCallCheck(this, CHAR);

      return _possibleConstructorReturn(this, _getPrototypeOf(CHAR).apply(this, arguments));
    }

    _createClass(CHAR, [{
      key: "toSql",
      value: function toSql() {
        if (this._binary) {
          return `CHAR BINARY(${this._length})`;
        }

        return _get(_getPrototypeOf(CHAR.prototype), "toSql", this).call(this);
      }
    }]);

    return CHAR;
  }(BaseTypes.CHAR);

  let NUMBER =
  /*#__PURE__*/
  function (_BaseTypes$NUMBER) {
    _inherits(NUMBER, _BaseTypes$NUMBER);

    function NUMBER() {
      _classCallCheck(this, NUMBER);

      return _possibleConstructorReturn(this, _getPrototypeOf(NUMBER).apply(this, arguments));
    }

    _createClass(NUMBER, [{
      key: "toSql",
      value: function toSql() {
        let result = this.key;

        if (this._unsigned) {
          result += ' UNSIGNED';
        }

        if (this._zerofill) {
          result += ' ZEROFILL';
        }

        if (this._length) {
          result += `(${this._length}`;

          if (typeof this._decimals === 'number') {
            result += `,${this._decimals}`;
          }

          result += ')';
        }

        return result;
      }
    }]);

    return NUMBER;
  }(BaseTypes.NUMBER);

  let TINYINT =
  /*#__PURE__*/
  function (_BaseTypes$TINYINT) {
    _inherits(TINYINT, _BaseTypes$TINYINT);

    function TINYINT(length) {
      var _this;

      _classCallCheck(this, TINYINT);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(TINYINT).call(this, length));
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this));
      return _this;
    }

    return TINYINT;
  }(BaseTypes.TINYINT);

  let SMALLINT =
  /*#__PURE__*/
  function (_BaseTypes$SMALLINT) {
    _inherits(SMALLINT, _BaseTypes$SMALLINT);

    function SMALLINT(length) {
      var _this2;

      _classCallCheck(this, SMALLINT);

      _this2 = _possibleConstructorReturn(this, _getPrototypeOf(SMALLINT).call(this, length));
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this2));
      return _this2;
    }

    return SMALLINT;
  }(BaseTypes.SMALLINT);

  let MEDIUMINT =
  /*#__PURE__*/
  function (_BaseTypes$MEDIUMINT) {
    _inherits(MEDIUMINT, _BaseTypes$MEDIUMINT);

    function MEDIUMINT(length) {
      var _this3;

      _classCallCheck(this, MEDIUMINT);

      _this3 = _possibleConstructorReturn(this, _getPrototypeOf(MEDIUMINT).call(this, length));
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this3));
      return _this3;
    }

    return MEDIUMINT;
  }(BaseTypes.MEDIUMINT);

  let INTEGER =
  /*#__PURE__*/
  function (_BaseTypes$INTEGER) {
    _inherits(INTEGER, _BaseTypes$INTEGER);

    function INTEGER(length) {
      var _this4;

      _classCallCheck(this, INTEGER);

      _this4 = _possibleConstructorReturn(this, _getPrototypeOf(INTEGER).call(this, length));
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this4));
      return _this4;
    }

    return INTEGER;
  }(BaseTypes.INTEGER);

  let BIGINT =
  /*#__PURE__*/
  function (_BaseTypes$BIGINT) {
    _inherits(BIGINT, _BaseTypes$BIGINT);

    function BIGINT(length) {
      var _this5;

      _classCallCheck(this, BIGINT);

      _this5 = _possibleConstructorReturn(this, _getPrototypeOf(BIGINT).call(this, length));
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this5));
      return _this5;
    }

    return BIGINT;
  }(BaseTypes.BIGINT);

  let FLOAT =
  /*#__PURE__*/
  function (_BaseTypes$FLOAT) {
    _inherits(FLOAT, _BaseTypes$FLOAT);

    function FLOAT() {
      _classCallCheck(this, FLOAT);

      return _possibleConstructorReturn(this, _getPrototypeOf(FLOAT).apply(this, arguments));
    }

    return FLOAT;
  }(BaseTypes.FLOAT);

  let DOUBLE =
  /*#__PURE__*/
  function (_BaseTypes$DOUBLE) {
    _inherits(DOUBLE, _BaseTypes$DOUBLE);

    function DOUBLE() {
      _classCallCheck(this, DOUBLE);

      return _possibleConstructorReturn(this, _getPrototypeOf(DOUBLE).apply(this, arguments));
    }

    return DOUBLE;
  }(BaseTypes.DOUBLE);

  let REAL =
  /*#__PURE__*/
  function (_BaseTypes$REAL) {
    _inherits(REAL, _BaseTypes$REAL);

    function REAL() {
      _classCallCheck(this, REAL);

      return _possibleConstructorReturn(this, _getPrototypeOf(REAL).apply(this, arguments));
    }

    return REAL;
  }(BaseTypes.REAL);

  function parseFloating(value) {
    if (typeof value !== 'string') {
      return value;
    }

    if (value === 'NaN') {
      return NaN;
    }

    if (value === 'Infinity') {
      return Infinity;
    }

    if (value === '-Infinity') {
      return -Infinity;
    }
  }

  for (const floating of [FLOAT, DOUBLE, REAL]) {
    floating.parse = parseFloating;
  }

  for (const num of [FLOAT, DOUBLE, REAL, TINYINT, SMALLINT, MEDIUMINT, INTEGER, BIGINT]) {
    num.prototype.toSql = NUMBER.prototype.toSql;
  }

  let ENUM =
  /*#__PURE__*/
  function (_BaseTypes$ENUM) {
    _inherits(ENUM, _BaseTypes$ENUM);

    function ENUM() {
      _classCallCheck(this, ENUM);

      return _possibleConstructorReturn(this, _getPrototypeOf(ENUM).apply(this, arguments));
    }

    _createClass(ENUM, [{
      key: "toSql",
      value: function toSql() {
        return 'TEXT';
      }
    }]);

    return ENUM;
  }(BaseTypes.ENUM);

  return {
    DATE,
    DATEONLY,
    STRING,
    CHAR,
    NUMBER,
    FLOAT,
    REAL,
    'DOUBLE PRECISION': DOUBLE,
    TINYINT,
    SMALLINT,
    MEDIUMINT,
    INTEGER,
    BIGINT,
    TEXT,
    ENUM,
    JSON: JSONTYPE,
    CITEXT
  };
};