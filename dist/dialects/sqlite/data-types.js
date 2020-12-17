"use strict";

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

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
  BaseTypes.JSON.types.sqlite = ["JSON", "JSONB"];

  let JSONTYPE = /*#__PURE__*/function (_BaseTypes$JSON) {
    _inherits(JSONTYPE, _BaseTypes$JSON);

    var _super = _createSuper(JSONTYPE);

    function JSONTYPE() {
      _classCallCheck(this, JSONTYPE);

      return _super.apply(this, arguments);
    }

    _createClass(JSONTYPE, null, [{
      key: "parse",
      value: function parse(data) {
        return JSON.parse(data);
      }
    }]);

    return JSONTYPE;
  }(BaseTypes.JSON);

  let DATE = /*#__PURE__*/function (_BaseTypes$DATE) {
    _inherits(DATE, _BaseTypes$DATE);

    var _super2 = _createSuper(DATE);

    function DATE() {
      _classCallCheck(this, DATE);

      return _super2.apply(this, arguments);
    }

    _createClass(DATE, null, [{
      key: "parse",
      value: function parse(date, options) {
        return new Date(date.replace(' ', 'T').replace(' +00:00', 'Z')); // We already have a timezone stored in the string
      }
    }]);

    return DATE;
  }(BaseTypes.DATE);

  let DATEONLY = /*#__PURE__*/function (_BaseTypes$DATEONLY) {
    _inherits(DATEONLY, _BaseTypes$DATEONLY);

    var _super3 = _createSuper(DATEONLY);

    function DATEONLY() {
      _classCallCheck(this, DATEONLY);

      return _super3.apply(this, arguments);
    }

    _createClass(DATEONLY, null, [{
      key: "parse",
      value: function parse(date) {
        return date;
      }
    }]);

    return DATEONLY;
  }(BaseTypes.DATEONLY);

  let STRING = /*#__PURE__*/function (_BaseTypes$STRING) {
    _inherits(STRING, _BaseTypes$STRING);

    var _super4 = _createSuper(STRING);

    function STRING() {
      _classCallCheck(this, STRING);

      return _super4.apply(this, arguments);
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

  let TEXT = /*#__PURE__*/function (_BaseTypes$TEXT) {
    _inherits(TEXT, _BaseTypes$TEXT);

    var _super5 = _createSuper(TEXT);

    function TEXT() {
      _classCallCheck(this, TEXT);

      return _super5.apply(this, arguments);
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

  let CITEXT = /*#__PURE__*/function (_BaseTypes$CITEXT) {
    _inherits(CITEXT, _BaseTypes$CITEXT);

    var _super6 = _createSuper(CITEXT);

    function CITEXT() {
      _classCallCheck(this, CITEXT);

      return _super6.apply(this, arguments);
    }

    _createClass(CITEXT, [{
      key: "toSql",
      value: function toSql() {
        return "TEXT COLLATE NOCASE";
      }
    }]);

    return CITEXT;
  }(BaseTypes.CITEXT);

  let CHAR = /*#__PURE__*/function (_BaseTypes$CHAR) {
    _inherits(CHAR, _BaseTypes$CHAR);

    var _super7 = _createSuper(CHAR);

    function CHAR() {
      _classCallCheck(this, CHAR);

      return _super7.apply(this, arguments);
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

  let NUMBER = /*#__PURE__*/function (_BaseTypes$NUMBER) {
    _inherits(NUMBER, _BaseTypes$NUMBER);

    var _super8 = _createSuper(NUMBER);

    function NUMBER() {
      _classCallCheck(this, NUMBER);

      return _super8.apply(this, arguments);
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

  let TINYINT = /*#__PURE__*/function (_BaseTypes$TINYINT) {
    _inherits(TINYINT, _BaseTypes$TINYINT);

    var _super9 = _createSuper(TINYINT);

    function TINYINT(length) {
      var _this;

      _classCallCheck(this, TINYINT);

      _this = _super9.call(this, length);
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this));
      return _this;
    }

    return TINYINT;
  }(BaseTypes.TINYINT);

  let SMALLINT = /*#__PURE__*/function (_BaseTypes$SMALLINT) {
    _inherits(SMALLINT, _BaseTypes$SMALLINT);

    var _super10 = _createSuper(SMALLINT);

    function SMALLINT(length) {
      var _this2;

      _classCallCheck(this, SMALLINT);

      _this2 = _super10.call(this, length);
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this2));
      return _this2;
    }

    return SMALLINT;
  }(BaseTypes.SMALLINT);

  let MEDIUMINT = /*#__PURE__*/function (_BaseTypes$MEDIUMINT) {
    _inherits(MEDIUMINT, _BaseTypes$MEDIUMINT);

    var _super11 = _createSuper(MEDIUMINT);

    function MEDIUMINT(length) {
      var _this3;

      _classCallCheck(this, MEDIUMINT);

      _this3 = _super11.call(this, length);
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this3));
      return _this3;
    }

    return MEDIUMINT;
  }(BaseTypes.MEDIUMINT);

  let INTEGER = /*#__PURE__*/function (_BaseTypes$INTEGER) {
    _inherits(INTEGER, _BaseTypes$INTEGER);

    var _super12 = _createSuper(INTEGER);

    function INTEGER(length) {
      var _this4;

      _classCallCheck(this, INTEGER);

      _this4 = _super12.call(this, length);
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this4));
      return _this4;
    }

    return INTEGER;
  }(BaseTypes.INTEGER);

  let BIGINT = /*#__PURE__*/function (_BaseTypes$BIGINT) {
    _inherits(BIGINT, _BaseTypes$BIGINT);

    var _super13 = _createSuper(BIGINT);

    function BIGINT(length) {
      var _this5;

      _classCallCheck(this, BIGINT);

      _this5 = _super13.call(this, length);
      removeUnsupportedIntegerOptions(_assertThisInitialized(_this5));
      return _this5;
    }

    return BIGINT;
  }(BaseTypes.BIGINT);

  let FLOAT = /*#__PURE__*/function (_BaseTypes$FLOAT) {
    _inherits(FLOAT, _BaseTypes$FLOAT);

    var _super14 = _createSuper(FLOAT);

    function FLOAT() {
      _classCallCheck(this, FLOAT);

      return _super14.apply(this, arguments);
    }

    return FLOAT;
  }(BaseTypes.FLOAT);

  let DOUBLE = /*#__PURE__*/function (_BaseTypes$DOUBLE) {
    _inherits(DOUBLE, _BaseTypes$DOUBLE);

    var _super15 = _createSuper(DOUBLE);

    function DOUBLE() {
      _classCallCheck(this, DOUBLE);

      return _super15.apply(this, arguments);
    }

    return DOUBLE;
  }(BaseTypes.DOUBLE);

  let REAL = /*#__PURE__*/function (_BaseTypes$REAL) {
    _inherits(REAL, _BaseTypes$REAL);

    var _super16 = _createSuper(REAL);

    function REAL() {
      _classCallCheck(this, REAL);

      return _super16.apply(this, arguments);
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

  let ENUM = /*#__PURE__*/function (_BaseTypes$ENUM) {
    _inherits(ENUM, _BaseTypes$ENUM);

    var _super17 = _createSuper(ENUM);

    function ENUM() {
      _classCallCheck(this, ENUM);

      return _super17.apply(this, arguments);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvZGF0YS10eXBlcy5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiQmFzZVR5cGVzIiwid2FybiIsIkFCU1RSQUNUIiwiYmluZCIsInVuZGVmaW5lZCIsInJlbW92ZVVuc3VwcG9ydGVkSW50ZWdlck9wdGlvbnMiLCJkYXRhVHlwZSIsIl96ZXJvZmlsbCIsIl91bnNpZ25lZCIsImtleSIsIkRBVEUiLCJ0eXBlcyIsInNxbGl0ZSIsIlNUUklORyIsIkNIQVIiLCJURVhUIiwiVElOWUlOVCIsIlNNQUxMSU5UIiwiTUVESVVNSU5UIiwiSU5URUdFUiIsIkJJR0lOVCIsIkZMT0FUIiwiVElNRSIsIkRBVEVPTkxZIiwiQk9PTEVBTiIsIkJMT0IiLCJERUNJTUFMIiwiVVVJRCIsIkVOVU0iLCJSRUFMIiwiRE9VQkxFIiwiSlNPTiIsIkpTT05UWVBFIiwiZGF0YSIsInBhcnNlIiwiZGF0ZSIsIm9wdGlvbnMiLCJEYXRlIiwicmVwbGFjZSIsIl9iaW5hcnkiLCJfbGVuZ3RoIiwiQ0lURVhUIiwiTlVNQkVSIiwicmVzdWx0IiwiX2RlY2ltYWxzIiwibGVuZ3RoIiwicGFyc2VGbG9hdGluZyIsInZhbHVlIiwiTmFOIiwiSW5maW5pdHkiLCJmbG9hdGluZyIsIm51bSIsInByb3RvdHlwZSIsInRvU3FsIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQUEsTUFBTSxDQUFDQyxPQUFQLEdBQWlCQyxTQUFTLElBQUk7QUFDNUIsUUFBTUMsSUFBSSxHQUFHRCxTQUFTLENBQUNFLFFBQVYsQ0FBbUJELElBQW5CLENBQXdCRSxJQUF4QixDQUNYQyxTQURXLEVBRVgsdUNBRlcsQ0FBYjtBQUtBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDRSxXQUFTQywrQkFBVCxDQUF5Q0MsUUFBekMsRUFBbUQ7QUFDakQsUUFBSUEsUUFBUSxDQUFDQyxTQUFULElBQXNCRCxRQUFRLENB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QUNVLFNBQVAsQ0FBaUJDLEtBQXZDO0FBQ0Q7O0FBL0wyQixNQWlNdEJ6QixJQWpNc0I7QUFBQTs7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBLDhCQWtNbEI7QUFDTixlQUFPLE1BQVA7QUFDRDtBQXBNeUI7O0FBQUE7QUFBQSxJQWlNVDVCLFNBQVMsQ0FBQzRCLElBak1EOztBQXVNNUIsU0FBTztBQUNMbEIsSUFBQUEsSUFESztBQUVMYSxJQUFBQSxRQUZLO0FBR0xWLElBQUFBLE1BSEs7QUFJTEMsSUFBQUEsSUFKSztBQUtMNEIsSUFBQUEsTUFMSztBQU1MckIsSUFBQUEsS0FOSztBQU9MUSxJQUFBQSxJQVBLO0FBUUwsd0JBQW9CQyxNQVJmO0FBU0xkLElBQUFBLE9BVEs7QUFVTEMsSUFBQUEsUUFWSztBQVdMQyxJQUFBQSxTQVhLO0FBWUxDLElBQUFBLE9BWks7QUFhTEMsSUFBQUEsTUFiSztBQWNMTCxJQUFBQSxJQWRLO0FBZUxhLElBQUFBLElBZks7QUFnQkxHLElBQUFBLElBQUksRUFBRUMsUUFoQkQ7QUFpQkxTLElBQUFBO0FBakJLLEdBQVA7QUFtQkQsQ0ExTkQiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlVHlwZXMgPT4ge1xuICBjb25zdCB3YXJuID0gQmFzZVR5cGVzLkFCU1RSQUNULndhcm4uYmluZChcbiAgICB1bmRlZmluZWQsXG4gICAgXCJodHRwczovL3d3dy5zcWxpdGUub3JnL2RhdGF0eXBlMy5odG1sXCJcbiAgKTtcblxuICAvKipcbiAgICogUmVtb3ZlcyB1bnN1cHBvcnRlZCBTUUxpdGUgb3B0aW9ucywgaS5lLiwgVU5TSUdORUQgYW5kIFpFUk9GSUxMLCBmb3IgdGhlIGludGVnZXIgZGF0YSB0eXBlcy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFUeXBlIFRoZSBiYXNlIGludGVnZXIgZGF0YSB0eXBlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gcmVtb3ZlVW5zdXBwb3J0ZWRJbnRlZ2VyT3B0aW9ucyhkYXRhVHlwZSkge1xuICAgIGlmIChkYXRhVHlwZS5femVyb2ZpbGwgfHwgZGF0YVR5cGUuX3Vuc2lnbmVkKSB7XG4gICAgICB3YXJuKFxuICAgICAgICBgU1FMaXRlIGRvZXMgbm90IHN1cHBvcnQgJyR7ZGF0YVR5cGUua2V5fScgd2l0aCBVTlNJR05FRCBvciBaRVJPRklMTC4gUGxhaW4gJyR7ZGF0YVR5cGUua2V5fScgd2lsbCBiZSB1c2VkIGluc3RlYWQuYFxuICAgICAgKTtcbiAgICAgIGRhdGFUeXBlLl91bnNpZ25lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGRhdGFUeXBlLl96ZXJvZmlsbCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHNlZSBodHRwczovL3NxbGl0ZS5vcmcvZGF0YXR5cGUzLmh0bWxcbiAgICovXG5cbiAgQmFzZVR5cGVzLkRBVEUudHlwZXMuc3FsaXRlID0gW1wiREFURVRJTUVcIl07XG4gIEJhc2VUeXBlcy5TVFJJTkcudHlwZXMuc3FsaXRlID0gW1wiVkFSQ0hBUlwiLCBcIlZBUkNIQVIgQklOQVJZXCJdO1xuICBCYXNlVHlwZXMuQ0hBUi50eXBlcy5zcWxpdGUgPSBbXCJDSEFSXCIsIFwiQ0hBUiBCSU5BUllcIl07XG4gIEJhc2VUeXBlcy5URVhULnR5cGVzLnNxbGl0ZSA9IFtcIlRFWFRcIl07XG4gIEJhc2VUeXBlcy5USU5ZSU5ULnR5cGVzLnNxbGl0ZSA9IFtcIlRJTllJTlRcIl07XG4gIEJhc2VUeXBlcy5TTUFMTElOVC50eXBlcy5zcWxpdGUgPSBbXCJTTUFMTElOVFwiXTtcbiAgQmFzZVR5cGVzLk1FRElVTUlOVC50eXBlcy5zcWxpdGUgPSBbXCJNRURJVU1JTlRcIl07XG4gIEJhc2VUeXBlcy5JTlRFR0VSLnR5cGVzLnNxbGl0ZSA9IFtcIklOVEVHRVJcIl07XG4gIEJhc2VUeXBlcy5CSUdJTlQudHlwZXMuc3FsaXRlID0gW1wiQklHSU5UXCJdO1xuICBCYXNlVHlwZXMuRkxPQVQudHlwZXMuc3FsaXRlID0gW1wiRkxPQVRcIl07XG4gIEJhc2VUeXBlcy5USU1FLnR5cGVzLnNxbGl0ZSA9IFtcIlRJTUVcIl07XG4gIEJhc2VUeXBlcy5EQVRFT05MWS50eXBlcy5zcWxpdGUgPSBbXCJEQVRFXCJdO1xuICBCYXNlVHlwZXMuQk9PTEVBTi50eXBlcy5zcWxpdGUgPSBbXCJUSU5ZSU5UXCJdO1xuICBCYXNlVHlwZXMuQkxPQi50eXBlcy5zcWxpdGUgPSBbXCJUSU5ZQkxPQlwiLCBcIkJMT0JcIiwgXCJMT05HQkxPQlwiXTtcbiAgQmFzZVR5cGVzLkRFQ0lNQUwudHlwZXMuc3FsaXRlID0gW1wiREVDSU1BTFwiXTtcbiAgQmFzZVR5cGVzLlVVSUQudHlwZXMuc3FsaXRlID0gW1wiVVVJRFwiXTtcbiAgQmFzZVR5cGVzLkVOVU0udHlwZXMuc3FsaXRlID0gZmFsc2U7XG4gIEJhc2VUeXBlcy5SRUFMLnR5cGVzLnNxbGl0ZSA9IFtcIlJFQUxcIl07XG4gIEJhc2VUeXBlcy5ET1VCTEUudHlwZXMuc3FsaXRlID0gW1wiRE9VQkxFIFBSRUNJU0lPTlwiXTtcbiAgQmFzZVR5cGVzLkpTT04udHlwZXMuc3FsaXRlID0gW1wiSlNPTlwiLCBcIkpTT05CXCJdO1xuXG4gIGNsYXNzIEpTT05UWVBFIGV4dGVuZHMgQmFzZVR5cGVzLkpTT04ge1xuICAgIHN0YXRpYyBwYXJzZShkYXRhKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9XG4gIH1cblxuICBjbGFzcyBEQVRFIGV4dGVuZHMgQmFzZVR5cGVzLkRBVEUge1xuICAgIHN0YXRpYyBwYXJzZShkYXRlLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUoZGF0ZS5yZXBsYWNlKCcgJywnVCcpLnJlcGxhY2UoJyArMDA6MDAnLCdaJykpOyAvLyBXZSBhbHJlYWR5IGhhdmUgYSB0aW1lem9uZSBzdG9yZWQgaW4gdGhlIHN0cmluZ1xuICAgIH1cbiAgfVxuXG4gIGNsYXNzIERBVEVPTkxZIGV4dGVuZHMgQmFzZVR5cGVzLkRBVEVPTkxZIHtcbiAgICBzdGF0aWMgcGFyc2UoZGF0ZSkge1xuICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuICB9XG5cbiAgY2xhc3MgU1RSSU5HIGV4dGVuZHMgQmFzZVR5cGVzLlNUUklORyB7XG4gICAgdG9TcWwoKSB7XG4gICAgICBpZiAodGhpcy5fYmluYXJ5KSB7XG4gICAgICAgIHJldHVybiBgVkFSQ0hBUiBCSU5BUlkoJHt0aGlzLl9sZW5ndGh9KWA7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3VwZXIudG9TcWwodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgY2xhc3MgVEVYVCBleHRlbmRzIEJhc2VUeXBlcy5URVhUIHtcbiAgICB0b1NxbCgpIHtcbiAgICAgIGlmICh0aGlzLl9sZW5ndGgpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICBcIlNRTGl0ZSBkb2VzIG5vdCBzdXBwb3J0IFRFWFQgd2l0aCBvcHRpb25zLiBQbGFpbiBgVEVYVGAgd2lsbCBiZSB1c2VkIGluc3RlYWQuXCJcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5fbGVuZ3RoID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFwiVEVYVFwiO1xuICAgIH1cbiAgfVxuXG4gIGNsYXNzIENJVEVYVCBleHRlbmRzIEJhc2VUeXBlcy5DSVRFWFQge1xuICAgIHRvU3FsKCkge1xuICAgICAgcmV0dXJuIFwiVEVYVCBDT0xMQVRFIE5PQ0FTRVwiO1xuICAgIH1cbiAgfVxuXG4gIGNsYXNzIENIQVIgZXh0ZW5kcyBCYXNlVHlwZXMuQ0hBUiB7XG4gICAgdG9TcWwoKSB7XG4gICAgICBpZiAodGhpcy5fYmluYXJ5KSB7XG4gICAgICAgIHJldHVybiBgQ0hBUiBCSU5BUlkoJHt0aGlzLl9sZW5ndGh9KWA7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3VwZXIudG9TcWwoKTtcbiAgICB9XG4gIH1cblxuICBjbGFzcyBOVU1CRVIgZXh0ZW5kcyBCYXNlVHlwZXMuTlVNQkVSIHtcbiAgICB0b1NxbCgpIHtcbiAgICAgIGxldCByZXN1bHQgPSB0aGlzLmtleTtcbiAgICAgIGlmICh0aGlzLl91bnNpZ25lZCkge1xuICAgICAgICByZXN1bHQgKz0gXCIgVU5TSUdORURcIjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl96ZXJvZmlsbCkge1xuICAgICAgICByZXN1bHQgKz0gXCIgWkVST0ZJTExcIjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9sZW5ndGgpIHtcbiAgICAgICAgcmVzdWx0ICs9IGAoJHt0aGlzLl9sZW5ndGh9YDtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9kZWNpbWFscyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgIHJlc3VsdCArPSBgLCR7dGhpcy5fZGVjaW1hbHN9YDtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gXCIpXCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIGNsYXNzIFRJTllJTlQgZXh0ZW5kcyBCYXNlVHlwZXMuVElOWUlOVCB7XG4gICAgY29uc3RydWN0b3IobGVuZ3RoKSB7XG4gICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgcmVtb3ZlVW5zdXBwb3J0ZWRJbnRlZ2VyT3B0aW9ucyh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBjbGFzcyBTTUFMTElOVCBleHRlbmRzIEJhc2VUeXBlcy5TTUFMTElOVCB7XG4gICAgY29uc3RydWN0b3IobGVuZ3RoKSB7XG4gICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgcmVtb3ZlVW5zdXBwb3J0ZWRJbnRlZ2VyT3B0aW9ucyh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBjbGFzcyBNRURJVU1JTlQgZXh0ZW5kcyBCYXNlVHlwZXMuTUVESVVNSU5UIHtcbiAgICBjb25zdHJ1Y3RvcihsZW5ndGgpIHtcbiAgICAgIHN1cGVyKGxlbmd0aCk7XG4gICAgICByZW1vdmVVbnN1cHBvcnRlZEludGVnZXJPcHRpb25zKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGNsYXNzIElOVEVHRVIgZXh0ZW5kcyBCYXNlVHlwZXMuSU5URUdFUiB7XG4gICAgY29uc3RydWN0b3IobGVuZ3RoKSB7XG4gICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgcmVtb3ZlVW5zdXBwb3J0ZWRJbnRlZ2VyT3B0aW9ucyh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBjbGFzcyBCSUdJTlQgZXh0ZW5kcyBCYXNlVHlwZXMuQklHSU5UIHtcbiAgICBjb25zdHJ1Y3RvcihsZW5ndGgpIHtcbiAgICAgIHN1cGVyKGxlbmd0aCk7XG4gICAgICByZW1vdmVVbnN1cHBvcnRlZEludGVnZXJPcHRpb25zKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGNsYXNzIEZMT0FUIGV4dGVuZHMgQmFzZVR5cGVzLkZMT0FUIHt9XG5cbiAgY2xhc3MgRE9VQkxFIGV4dGVuZHMgQmFzZVR5cGVzLkRPVUJMRSB7fVxuXG4gIGNsYXNzIFJFQUwgZXh0ZW5kcyBCYXNlVHlwZXMuUkVBTCB7fVxuXG4gIGZ1bmN0aW9uIHBhcnNlRmxvYXRpbmcodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGlmICh2YWx1ZSA9PT0gXCJOYU5cIikge1xuICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG4gICAgaWYgKHZhbHVlID09PSBcIkluZmluaXR5XCIpIHtcbiAgICAgIHJldHVybiBJbmZpbml0eTtcbiAgICB9XG4gICAgaWYgKHZhbHVlID09PSBcIi1JbmZpbml0eVwiKSB7XG4gICAgICByZXR1cm4gLUluZmluaXR5O1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGZsb2F0aW5nIG9mIFtGTE9BVCwgRE9VQkxFLCBSRUFMXSkge1xuICAgIGZsb2F0aW5nLnBhcnNlID0gcGFyc2VGbG9hdGluZztcbiAgfVxuXG4gIGZvciAoY29uc3QgbnVtIG9mIFtcbiAgICBGTE9BVCxcbiAgICBET1VCTEUsXG4gICAgUkVBTCxcbiAgICBUSU5ZSU5ULFxuICAgIFNNQUxMSU5ULFxuICAgIE1FRElVTUlOVCxcbiAgICBJTlRFR0VSLFxuICAgIEJJR0lOVFxuICBdKSB7XG4gICAgbnVtLnByb3RvdHlwZS50b1NxbCA9IE5VTUJFUi5wcm90b3R5cGUudG9TcWw7XG4gIH1cblxuICBjbGFzcyBFTlVNIGV4dGVuZHMgQmFzZVR5cGVzLkVOVU0ge1xuICAgIHRvU3FsKCkge1xuICAgICAgcmV0dXJuIFwiVEVYVFwiO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgREFURSxcbiAgICBEQVRFT05MWSxcbiAgICBTVFJJTkcsXG4gICAgQ0hBUixcbiAgICBOVU1CRVIsXG4gICAgRkxPQVQsXG4gICAgUkVBTCxcbiAgICBcIkRPVUJMRSBQUkVDSVNJT05cIjogRE9VQkxFLFxuICAgIFRJTllJTlQsXG4gICAgU01BTExJTlQsXG4gICAgTUVESVVNSU5ULFxuICAgIElOVEVHRVIsXG4gICAgQklHSU5ULFxuICAgIFRFWFQsXG4gICAgRU5VTSxcbiAgICBKU09OOiBKU09OVFlQRSxcbiAgICBDSVRFWFRcbiAgfTtcbn07XG4iXX0=