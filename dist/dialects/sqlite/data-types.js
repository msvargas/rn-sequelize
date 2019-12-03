"use strict";

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
  const warn = BaseTypes.ABSTRACT.warn.bind(undefined, "https://www.sqlite.org/datatype3.html");
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


  BaseTypes.DATE.types.sqlite = ["DATETIME"];
  BaseTypes.STRING.types.sqlite = ["VARCHAR", "VARCHAR BINARY"];
  BaseTypes.CHAR.types.sqlite = ["CHAR", "CHAR BINARY"];
  BaseTypes.TEXT.types.sqlite = ["TEXT"];
  BaseTypes.TINYINT.types.sqlite = ["TINYINT"];
  BaseTypes.SMALLINT.types.sqlite = ["SMALLINT"];
  BaseTypes.MEDIUMINT.types.sqlite = ["MEDIUMINT"];
  BaseTypes.INTEGER.types.sqlite = ["INTEGER"];
  BaseTypes.BIGINT.types.sqlite = ["BIGINT"];
  BaseTypes.FLOAT.types.sqlite = ["FLOAT"];
  BaseTypes.TIME.types.sqlite = ["TIME"];
  BaseTypes.DATEONLY.types.sqlite = ["DATE"];
  BaseTypes.BOOLEAN.types.sqlite = ["TINYINT"];
  BaseTypes.BLOB.types.sqlite = ["TINYBLOB", "BLOB", "LONGBLOB"];
  BaseTypes.DECIMAL.types.sqlite = ["DECIMAL"];
  BaseTypes.UUID.types.sqlite = ["UUID"];
  BaseTypes.ENUM.types.sqlite = false;
  BaseTypes.REAL.types.sqlite = ["REAL"];
  BaseTypes.DOUBLE.types.sqlite = ["DOUBLE PRECISION"];
  BaseTypes.GEOMETRY.types.sqlite = false;
  BaseTypes.JSON.types.sqlite = ["JSON", "JSONB"];

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
        return new Date(date.replace(" ", "T").replace(" " + options.timezone, "+0000")); // We already have a timezone stored in the string
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
          warn("SQLite does not support TEXT with options. Plain `TEXT` will be used instead.");
          this._length = undefined;
        }

        return "TEXT";
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
        return "TEXT COLLATE NOCASE";
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
          result += " UNSIGNED";
        }

        if (this._zerofill) {
          result += " ZEROFILL";
        }

        if (this._length) {
          result += `(${this._length}`;

          if (typeof this._decimals === "number") {
            result += `,${this._decimals}`;
          }

          result += ")";
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
    if (typeof value !== "string") {
      return value;
    }

    if (value === "NaN") {
      return NaN;
    }

    if (value === "Infinity") {
      return Infinity;
    }

    if (value === "-Infinity") {
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
        return "TEXT";
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
    "DOUBLE PRECISION": DOUBLE,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvZGF0YS10eXBlcy5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiQmFzZVR5cGVzIiwid2FybiIsIkFCU1RSQUNUIiwiYmluZCIsInVuZGVmaW5lZCIsInJlbW92ZVVuc3VwcG9ydGVkSW50ZWdlck9wdGlvbnMiLCJkYXRhVHlwZSIsIl96ZXJvZmlsbCIsIl91bnNpZ25lZCIsImtleSIsIkRBVEUiLCJ0eXBlcyIsInNxbGl0ZSIsIlNUUklORyIsIkNIQVIiLCJURVhUIiwiVElOWUlOVCIsIlNNQUxMSU5UIiwiTUVESVVNSU5UIiwiSU5URUdFUiIsIkJJR0lOVCIsIkZMT0FUIiwiVElNRSIsIkRBVEVPTkxZIiwiQk9PTEVBTiIsIkJMT0IiLCJERUNJTUFMIiwiVVVJRCIsIkVOVU0iLCJSRUFMIiwiRE9VQkxFIiwiR0VPTUVUUlkiLCJKU09OIiwiSlNPTlRZUEUiLCJkYXRhIiwicGFyc2UiLCJkYXRlIiwib3B0aW9ucyIsIkRhdGUiLCJyZXBsYWNlIiwidGltZXpvbmUiLCJfYmluYXJ5IiwiX2xlbmd0aCIsIkNJVEVYVCIsIk5VTUJFUiIsInJlc3VsdCIsIl9kZWNpbWFscyIsImxlbmd0aCIsInBhcnNlRmxvYXRpbmciLCJ2YWx1ZSIsIk5hTiIsIkluZmluaXR5IiwiZmxvYXRpbmciLCJudW0iLCJwcm90b3R5cGUiLCJ0b1NxbCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQUEsTUFBTSxDQUFDQyxPQUFQLEdBQWlCQyxTQUFTLElBQUk7QUFDNUIsUUFBTUMsSUFBSSxHQUFHRCxTQUFTLENBQUNFLFFBQVYsQ0FBbUJELElBQW5CLENBQXdCRSxJQUF4QixDQUNYQyxTQURXLEVBRVgsdUNBRlcsQ0FBYjtBQUtBOzs7Ozs7O0FBTUEsV0FBU0MsK0JBQVQsQ0FBeUNDLFFBQXpDLEVBQW1EO0FBQ2pELFFBQUlBLFFBQVEsQ0FBQ0MsU0FBVCxJQUFzQkQsUUFBUSxDQUFD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RCxJQUhnQixFQUloQmIsT0FKZ0IsRUFLaEJDLFFBTGdCLEVBTWhCQyxTQU5nQixFQU9oQkMsT0FQZ0IsRUFRaEJDLE1BUmdCLENBQWxCLEVBU0c7QUFDRGlDLElBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjQyxLQUFkLEdBQXNCWCxNQUFNLENBQUNVLFNBQVAsQ0FBaUJDLEtBQXZDO0FBQ0Q7O0FBbE0yQixNQW9NdEIzQixJQXBNc0I7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQSw4QkFxTWxCO0FBQ04sZUFBTyxNQUFQO0FBQ0Q7QUF2TXlCOztBQUFBO0FBQUEsSUFvTVQ1QixTQUFTLENBQUM0QixJQXBNRDs7QUEwTTVCLFNBQU87QUFDTGxCLElBQUFBLElBREs7QUFFTGEsSUFBQUEsUUFGSztBQUdMVixJQUFBQSxNQUhLO0FBSUxDLElBQUFBLElBSks7QUFLTDhCLElBQUFBLE1BTEs7QUFNTHZCLElBQUFBLEtBTks7QUFPTFEsSUFBQUEsSUFQSztBQVFMLHdCQUFvQkMsTUFSZjtBQVNMZCxJQUFBQSxPQVRLO0FBVUxDLElBQUFBLFFBVks7QUFXTEMsSUFBQUEsU0FYSztBQVlMQyxJQUFBQSxPQVpLO0FBYUxDLElBQUFBLE1BYks7QUFjTEwsSUFBQUEsSUFkSztBQWVMYSxJQUFBQSxJQWZLO0FBZ0JMSSxJQUFBQSxJQUFJLEVBQUVDLFFBaEJEO0FBaUJMVSxJQUFBQTtBQWpCSyxHQUFQO0FBbUJELENBN05EIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VUeXBlcyA9PiB7XHJcbiAgY29uc3Qgd2FybiA9IEJhc2VUeXBlcy5BQlNUUkFDVC53YXJuLmJpbmQoXHJcbiAgICB1bmRlZmluZWQsXHJcbiAgICBcImh0dHBzOi8vd3d3LnNxbGl0ZS5vcmcvZGF0YXR5cGUzLmh0bWxcIlxyXG4gICk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlbW92ZXMgdW5zdXBwb3J0ZWQgU1FMaXRlIG9wdGlvbnMsIGkuZS4sIFVOU0lHTkVEIGFuZCBaRVJPRklMTCwgZm9yIHRoZSBpbnRlZ2VyIGRhdGEgdHlwZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVR5cGUgVGhlIGJhc2UgaW50ZWdlciBkYXRhIHR5cGUuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBmdW5jdGlvbiByZW1vdmVVbnN1cHBvcnRlZEludGVnZXJPcHRpb25zKGRhdGFUeXBlKSB7XHJcbiAgICBpZiAoZGF0YVR5cGUuX3plcm9maWxsIHx8IGRhdGFUeXBlLl91bnNpZ25lZCkge1xyXG4gICAgICB3YXJuKFxyXG4gICAgICAgIGBTUUxpdGUgZG9lcyBub3Qgc3VwcG9ydCAnJHtkYXRhVHlwZS5rZXl9JyB3aXRoIFVOU0lHTkVEIG9yIFpFUk9GSUxMLiBQbGFpbiAnJHtkYXRhVHlwZS5rZXl9JyB3aWxsIGJlIHVzZWQgaW5zdGVhZC5gXHJcbiAgICAgICk7XHJcbiAgICAgIGRhdGFUeXBlLl91bnNpZ25lZCA9IHVuZGVmaW5lZDtcclxuICAgICAgZGF0YVR5cGUuX3plcm9maWxsID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHNlZSBodHRwczovL3NxbGl0ZS5vcmcvZGF0YXR5cGUzLmh0bWxcclxuICAgKi9cclxuXHJcbiAgQmFzZVR5cGVzLkRBVEUudHlwZXMuc3FsaXRlID0gW1wiREFURVRJTUVcIl07XHJcbiAgQmFzZVR5cGVzLlNUUklORy50eXBlcy5zcWxpdGUgPSBbXCJWQVJDSEFSXCIsIFwiVkFSQ0hBUiBCSU5BUllcIl07XHJcbiAgQmFzZVR5cGVzLkNIQVIudHlwZXMuc3FsaXRlID0gW1wiQ0hBUlwiLCBcIkNIQVIgQklOQVJZXCJdO1xyXG4gIEJhc2VUeXBlcy5URVhULnR5cGVzLnNxbGl0ZSA9IFtcIlRFWFRcIl07XHJcbiAgQmFzZVR5cGVzLlRJTllJTlQudHlwZXMuc3FsaXRlID0gW1wiVElOWUlOVFwiXTtcclxuICBCYXNlVHlwZXMuU01BTExJTlQudHlwZXMuc3FsaXRlID0gW1wiU01BTExJTlRcIl07XHJcbiAgQmFzZVR5cGVzLk1FRElVTUlOVC50eXBlcy5zcWxpdGUgPSBbXCJNRURJVU1JTlRcIl07XHJcbiAgQmFzZVR5cGVzLklOVEVHRVIudHlwZXMuc3FsaXRlID0gW1wiSU5URUdFUlwiXTtcclxuICBCYXNlVHlwZXMuQklHSU5ULnR5cGVzLnNxbGl0ZSA9IFtcIkJJR0lOVFwiXTtcclxuICBCYXNlVHlwZXMuRkxPQVQudHlwZXMuc3FsaXRlID0gW1wiRkxPQVRcIl07XHJcbiAgQmFzZVR5cGVzLlRJTUUudHlwZXMuc3FsaXRlID0gW1wiVElNRVwiXTtcclxuICBCYXNlVHlwZXMuREFURU9OTFkudHlwZXMuc3FsaXRlID0gW1wiREFURVwiXTtcclxuICBCYXNlVHlwZXMuQk9PTEVBTi50eXBlcy5zcWxpdGUgPSBbXCJUSU5ZSU5UXCJdO1xyXG4gIEJhc2VUeXBlcy5CTE9CLnR5cGVzLnNxbGl0ZSA9IFtcIlRJTllCTE9CXCIsIFwiQkxPQlwiLCBcIkxPTkdCTE9CXCJdO1xyXG4gIEJhc2VUeXBlcy5ERUNJTUFMLnR5cGVzLnNxbGl0ZSA9IFtcIkRFQ0lNQUxcIl07XHJcbiAgQmFzZVR5cGVzLlVVSUQudHlwZXMuc3FsaXRlID0gW1wiVVVJRFwiXTtcclxuICBCYXNlVHlwZXMuRU5VTS50eXBlcy5zcWxpdGUgPSBmYWxzZTtcclxuICBCYXNlVHlwZXMuUkVBTC50eXBlcy5zcWxpdGUgPSBbXCJSRUFMXCJdO1xyXG4gIEJhc2VUeXBlcy5ET1VCTEUudHlwZXMuc3FsaXRlID0gW1wiRE9VQkxFIFBSRUNJU0lPTlwiXTtcclxuICBCYXNlVHlwZXMuR0VPTUVUUlkudHlwZXMuc3FsaXRlID0gZmFsc2U7XHJcbiAgQmFzZVR5cGVzLkpTT04udHlwZXMuc3FsaXRlID0gW1wiSlNPTlwiLCBcIkpTT05CXCJdO1xyXG5cclxuICBjbGFzcyBKU09OVFlQRSBleHRlbmRzIEJhc2VUeXBlcy5KU09OIHtcclxuICAgIHN0YXRpYyBwYXJzZShkYXRhKSB7XHJcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY2xhc3MgREFURSBleHRlbmRzIEJhc2VUeXBlcy5EQVRFIHtcclxuICAgIHN0YXRpYyBwYXJzZShkYXRlLCBvcHRpb25zKSB7XHJcbiAgICAgIHJldHVybiBuZXcgRGF0ZShcclxuICAgICAgICBkYXRlLnJlcGxhY2UoXCIgXCIsIFwiVFwiKS5yZXBsYWNlKFwiIFwiICsgb3B0aW9ucy50aW1lem9uZSwgXCIrMDAwMFwiKVxyXG4gICAgICApOyAvLyBXZSBhbHJlYWR5IGhhdmUgYSB0aW1lem9uZSBzdG9yZWQgaW4gdGhlIHN0cmluZ1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY2xhc3MgREFURU9OTFkgZXh0ZW5kcyBCYXNlVHlwZXMuREFURU9OTFkge1xyXG4gICAgc3RhdGljIHBhcnNlKGRhdGUpIHtcclxuICAgICAgcmV0dXJuIGRhdGU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjbGFzcyBTVFJJTkcgZXh0ZW5kcyBCYXNlVHlwZXMuU1RSSU5HIHtcclxuICAgIHRvU3FsKCkge1xyXG4gICAgICBpZiAodGhpcy5fYmluYXJ5KSB7XHJcbiAgICAgICAgcmV0dXJuIGBWQVJDSEFSIEJJTkFSWSgke3RoaXMuX2xlbmd0aH0pYDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3VwZXIudG9TcWwodGhpcyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjbGFzcyBURVhUIGV4dGVuZHMgQmFzZVR5cGVzLlRFWFQge1xyXG4gICAgdG9TcWwoKSB7XHJcbiAgICAgIGlmICh0aGlzLl9sZW5ndGgpIHtcclxuICAgICAgICB3YXJuKFxyXG4gICAgICAgICAgXCJTUUxpdGUgZG9lcyBub3Qgc3VwcG9ydCBURVhUIHdpdGggb3B0aW9ucy4gUGxhaW4gYFRFWFRgIHdpbGwgYmUgdXNlZCBpbnN0ZWFkLlwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLl9sZW5ndGggPSB1bmRlZmluZWQ7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFwiVEVYVFwiO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY2xhc3MgQ0lURVhUIGV4dGVuZHMgQmFzZVR5cGVzLkNJVEVYVCB7XHJcbiAgICB0b1NxbCgpIHtcclxuICAgICAgcmV0dXJuIFwiVEVYVCBDT0xMQVRFIE5PQ0FTRVwiO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY2xhc3MgQ0hBUiBleHRlbmRzIEJhc2VUeXBlcy5DSEFSIHtcclxuICAgIHRvU3FsKCkge1xyXG4gICAgICBpZiAodGhpcy5fYmluYXJ5KSB7XHJcbiAgICAgICAgcmV0dXJuIGBDSEFSIEJJTkFSWSgke3RoaXMuX2xlbmd0aH0pYDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3VwZXIudG9TcWwoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNsYXNzIE5VTUJFUiBleHRlbmRzIEJhc2VUeXBlcy5OVU1CRVIge1xyXG4gICAgdG9TcWwoKSB7XHJcbiAgICAgIGxldCByZXN1bHQgPSB0aGlzLmtleTtcclxuICAgICAgaWYgKHRoaXMuX3Vuc2lnbmVkKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9IFwiIFVOU0lHTkVEXCI7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMuX3plcm9maWxsKSB7XHJcbiAgICAgICAgcmVzdWx0ICs9IFwiIFpFUk9GSUxMXCI7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMuX2xlbmd0aCkge1xyXG4gICAgICAgIHJlc3VsdCArPSBgKCR7dGhpcy5fbGVuZ3RofWA7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9kZWNpbWFscyA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgcmVzdWx0ICs9IGAsJHt0aGlzLl9kZWNpbWFsc31gO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQgKz0gXCIpXCI7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNsYXNzIFRJTllJTlQgZXh0ZW5kcyBCYXNlVHlwZXMuVElOWUlOVCB7XHJcbiAgICBjb25zdHJ1Y3RvcihsZW5ndGgpIHtcclxuICAgICAgc3VwZXIobGVuZ3RoKTtcclxuICAgICAgcmVtb3ZlVW5zdXBwb3J0ZWRJbnRlZ2VyT3B0aW9ucyh0aGlzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNsYXNzIFNNQUxMSU5UIGV4dGVuZHMgQmFzZVR5cGVzLlNNQUxMSU5UIHtcclxuICAgIGNvbnN0cnVjdG9yKGxlbmd0aCkge1xyXG4gICAgICBzdXBlcihsZW5ndGgpO1xyXG4gICAgICByZW1vdmVVbnN1cHBvcnRlZEludGVnZXJPcHRpb25zKHRoaXMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY2xhc3MgTUVESVVNSU5UIGV4dGVuZHMgQmFzZVR5cGVzLk1FRElVTUlOVCB7XHJcbiAgICBjb25zdHJ1Y3RvcihsZW5ndGgpIHtcclxuICAgICAgc3VwZXIobGVuZ3RoKTtcclxuICAgICAgcmVtb3ZlVW5zdXBwb3J0ZWRJbnRlZ2VyT3B0aW9ucyh0aGlzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNsYXNzIElOVEVHRVIgZXh0ZW5kcyBCYXNlVHlwZXMuSU5URUdFUiB7XHJcbiAgICBjb25zdHJ1Y3RvcihsZW5ndGgpIHtcclxuICAgICAgc3VwZXIobGVuZ3RoKTtcclxuICAgICAgcmVtb3ZlVW5zdXBwb3J0ZWRJbnRlZ2VyT3B0aW9ucyh0aGlzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNsYXNzIEJJR0lOVCBleHRlbmRzIEJhc2VUeXBlcy5CSUdJTlQge1xyXG4gICAgY29uc3RydWN0b3IobGVuZ3RoKSB7XHJcbiAgICAgIHN1cGVyKGxlbmd0aCk7XHJcbiAgICAgIHJlbW92ZVVuc3VwcG9ydGVkSW50ZWdlck9wdGlvbnModGhpcyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjbGFzcyBGTE9BVCBleHRlbmRzIEJhc2VUeXBlcy5GTE9BVCB7fVxyXG5cclxuICBjbGFzcyBET1VCTEUgZXh0ZW5kcyBCYXNlVHlwZXMuRE9VQkxFIHt9XHJcblxyXG4gIGNsYXNzIFJFQUwgZXh0ZW5kcyBCYXNlVHlwZXMuUkVBTCB7fVxyXG5cclxuICBmdW5jdGlvbiBwYXJzZUZsb2F0aW5nKHZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuICAgIGlmICh2YWx1ZSA9PT0gXCJOYU5cIikge1xyXG4gICAgICByZXR1cm4gTmFOO1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlID09PSBcIkluZmluaXR5XCIpIHtcclxuICAgICAgcmV0dXJuIEluZmluaXR5O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlID09PSBcIi1JbmZpbml0eVwiKSB7XHJcbiAgICAgIHJldHVybiAtSW5maW5pdHk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGZvciAoY29uc3QgZmxvYXRpbmcgb2YgW0ZMT0FULCBET1VCTEUsIFJFQUxdKSB7XHJcbiAgICBmbG9hdGluZy5wYXJzZSA9IHBhcnNlRmxvYXRpbmc7XHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IG51bSBvZiBbXHJcbiAgICBGTE9BVCxcclxuICAgIERPVUJMRSxcclxuICAgIFJFQUwsXHJcbiAgICBUSU5ZSU5ULFxyXG4gICAgU01BTExJTlQsXHJcbiAgICBNRURJVU1JTlQsXHJcbiAgICBJTlRFR0VSLFxyXG4gICAgQklHSU5UXHJcbiAgXSkge1xyXG4gICAgbnVtLnByb3RvdHlwZS50b1NxbCA9IE5VTUJFUi5wcm90b3R5cGUudG9TcWw7XHJcbiAgfVxyXG5cclxuICBjbGFzcyBFTlVNIGV4dGVuZHMgQmFzZVR5cGVzLkVOVU0ge1xyXG4gICAgdG9TcWwoKSB7XHJcbiAgICAgIHJldHVybiBcIlRFWFRcIjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBEQVRFLFxyXG4gICAgREFURU9OTFksXHJcbiAgICBTVFJJTkcsXHJcbiAgICBDSEFSLFxyXG4gICAgTlVNQkVSLFxyXG4gICAgRkxPQVQsXHJcbiAgICBSRUFMLFxyXG4gICAgXCJET1VCTEUgUFJFQ0lTSU9OXCI6IERPVUJMRSxcclxuICAgIFRJTllJTlQsXHJcbiAgICBTTUFMTElOVCxcclxuICAgIE1FRElVTUlOVCxcclxuICAgIElOVEVHRVIsXHJcbiAgICBCSUdJTlQsXHJcbiAgICBURVhULFxyXG4gICAgRU5VTSxcclxuICAgIEpTT046IEpTT05UWVBFLFxyXG4gICAgQ0lURVhUXHJcbiAgfTtcclxufTtcclxuIl19