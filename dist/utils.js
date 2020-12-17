'use strict';

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

const DataTypes = require('./data-types');

const SqlString = require('./sql-string');

const _ = require('lodash');

const uuidv1 = require('uuid/v1');

const uuidv4 = require('uuid/v4');

const Promise = require('./promise');

const operators = require('./operators');

const operatorsSet = new Set(_.values(operators));

let inflection = require('inflection');

exports.classToInvokable = require('./utils/classToInvokable').classToInvokable;
exports.Promise = Promise;

function useInflection(_inflection) {
  inflection = _inflection;
}

exports.useInflection = useInflection;

function camelizeIf(str, condition) {
  let result = str;

  if (condition) {
    result = camelize(str);
  }

  return result;
}

exports.camelizeIf = camelizeIf;

function underscoredIf(str, condition) {
  let result = str;

  if (condition) {
    result = underscore(str);
  }

  return result;
}

exports.underscoredIf = underscoredIf;

function isPrimitive(val) {
  const type = typeof val;
  return type === 'string' || type === 'number' || type === 'boolean';
}

exports.isPrimitive = isPrimitive; // Same concept as _.merge, but don't overwrite properties that have already been assigned

function mergeDefaults(a, b) {
  return _.mergeWith(a, b, objectValue => {
    // If it's an object, let _ handle it this time, we will be called again for each property
    if (!_.isPlainObject(objectValue) && objectValue !== undefined) {
      return objectValue;
    }
  });
}

exports.mergeDefaults = mergeDefaults; // An alternative to _.merge, which doesn't clone its arguments
// Cloning is a bad idea because options arguments may contain references to sequelize
// models - which again reference database libs which don't like to be cloned (in particular pg-native)

function merge() {
  const result = {};

  for (const obj of arguments) {
    _.forOwn(obj, (value, key) => {
      if (value !== undefined) {
        if (!result[key]) {
          result[key] = value;
        } else if (_.isPlainObject(value) && _.isPlainObject(result[key])) {
          result[key] = merge(result[key], value);
        } else if (Array.isArray(value) && Array.isArray(result[key])) {
          result[key] = value.concat(result[key]);
        } else {
          result[key] = value;
        }
      }
    });
  }

  return result;
}

exports.merge = merge;

function spliceStr(str, index, count, add) {
  return str.slice(0, index) + add + str.slice(index + count);
}

exports.spliceStr = spliceStr;

function camelize(str) {
  return str.trim().replace(/[-_\s]+(.)?/g, (match, c) => c.toUpperCase());
}

exports.camelize = camelize;

function underscore(str) {
  return inflection.underscore(str);
}

exports.underscore = underscore;

function singularize(str) {
  return inflection.singularize(str);
}

exports.singularize = singularize;

function pluralize(str) {
  return inflection.pluralize(str);
}

exports.pluralize = pluralize;

function format(arr, dialect) {
  const timeZone = null; // Make a clone of the array beacuse format modifies the passed args

  return SqlString.format(arr[0], arr.slice(1), timeZone, dialect);
}

exports.format = format;

function formatNamedParameters(sql, parameters, dialect) {
  const timeZone = null;
  return SqlString.formatNamedParameters(sql, parameters, timeZone, dialect);
}

exports.formatNamedParameters = formatNamedParameters;

function cloneDeep(obj, onlyPlain) {
  obj = obj || {};
  return _.cloneDeepWith(obj, elem => {
    // Do not try to customize cloning of arrays or POJOs
    if (Array.isArray(elem) || _.isPlainObject(elem)) {
      return undefined;
    } // If we specified to clone only plain objects & arrays, we ignore everyhing else
    // In any case, don't clone stuff that's an object, but not a plain one - fx example sequelize models and instances


    if (onlyPlain || typeof elem === 'object') {
      return elem;
    } // Preserve special data-types like `fn` across clones. _.get() is used for checking up the prototype chain


    if (elem && typeof elem.clone === 'function') {
      return elem.clone();
    }
  });
}

exports.cloneDeep = cloneDeep;
/* Expand and normalize finder options */

function mapFinderOptions(options, Model) {
  if (options.attributes && Array.isArray(options.attributes)) {
    options.attributes = Model._injectDependentVirtualAttributes(options.attributes);
    options.attributes = options.attributes.filter(v => !Model._virtualAttributes.has(v));
  }

  mapOptionFieldNames(options, Model);
  return options;
}

exports.mapFinderOptions = mapFinderOptions;
/* Used to map field names in attributes and where conditions */

function mapOptionFieldNames(options, Model) {
  if (Array.isArray(options.attributes)) {
    options.attributes = options.attributes.map(attr => {
      // Object lookups will force any variable to strings, we don't want that for special objects etc
      if (typeof attr !== 'string') return attr; // Map attributes to aliased syntax attributes

      if (Model.rawAttributes[attr] && attr !== Model.rawAttributes[attr].field) {
        return [Model.rawAttributes[attr].field, attr];
      }

      return attr;
    });
  }

  if (options.where && _.isPlainObject(options.where)) {
    options.where = mapWhereFieldNames(options.where, Model);
  }

  return options;
}

exports.mapOptionFieldNames = mapOptionFieldNames;

function mapWhereFieldNames(attributes, Model) {
  if (attributes) {
    getComplexKeys(attributes).forEach(attribute => {
      const rawAttribute = Model.rawAttributes[attribute];

      if (rawAttribute && rawAttribute.field !== rawAttribute.fieldName) {
        attributes[rawAttribute.field] = attributes[attribute];
        delete attributes[attribute];
      }

      if (_.isPlainObject(attributes[attribute]) && !(rawAttribute && (rawAttribute.type instanceof DataTypes.HSTORE || rawAttribute.type instanceof DataTypes.JSON))) {
        // Prevent renaming of HSTORE & JSON fields
        attributes[attribute] = mapOptionFieldNames({
          where: attributes[attribute]
        }, Model).where;
      }

      if (Array.isArray(attributes[attribute])) {
        attributes[attribute].forEach((where, index) => {
          if (_.isPlainObject(where)) {
            attributes[attribute][index] = mapWhereFieldNames(where, Model);
          }
        });
      }
    });
  }

  return attributes;
}

exports.mapWhereFieldNames = mapWhereFieldNames;
/* Used to map field names in values */

function mapValueFieldNames(dataValues, fields, Model) {
  const values = {};

  for (const attr of fields) {
    if (dataValues[attr] !== undefined && !Model._virtualAttributes.has(attr)) {
      // Field name mapping
      if (Model.rawAttributes[attr] && Model.rawAttributes[attr].field && Model.rawAttributes[attr].field !== attr) {
        values[Model.rawAttributes[attr].field] = dataValues[attr];
      } else {
        values[attr] = dataValues[attr];
      }
    }
  }

  return values;
}

exports.mapValueFieldNames = mapValueFieldNames;

function isColString(value) {
  return typeof value === 'string' && value[0] === '$' && value[value.length - 1] === '$';
}

exports.isColString = isColString;

function canTreatArrayAsAnd(arr) {
  return arr.some(arg => _.isPlainObject(arg) || arg instanceof Where);
}

exports.canTreatArrayAsAnd = canTreatArrayAsAnd;

function combineTableNames(tableName1, tableName2) {
  return tableName1.toLowerCase() < tableName2.toLowerCase() ? tableName1 + tableName2 : tableName2 + tableName1;
}

exports.combineTableNames = combineTableNames;

function toDefaultValue(value, dialect) {
  if (typeof value === 'function') {
    const tmp = value();

    if (tmp instanceof DataTypes.ABSTRACT) {
      return tmp.toSql();
    }

    return tmp;
  }

  if (value instanceof DataTypes.UUIDV1) {
    return uuidv1();
  }

  if (value instanceof DataTypes.UUIDV4) {
    return uuidv4();
  }

  if (value instanceof DataTypes.NOW) {
    return now(dialect);
  }

  if (_.isPlainObject(value) || Array.isArray(value)) {
    return _.clone(value);
  }

  return value;
}

exports.toDefaultValue = toDefaultValue;
/**
 * Determine if the default value provided exists and can be described
 * in a db schema using the DEFAULT directive.
 *
 * @param  {*} value Any default value.
 * @returns {boolean} yes / no.
 * @private
 */

function defaultValueSchemable(value) {
  if (value === undefined) {
    return false;
  } // TODO this will be schemable when all supported db
  // have been normalized for this case


  if (value instanceof DataTypes.NOW) {
    return false;
  }

  if (value instanceof DataTypes.UUIDV1 || value instanceof DataTypes.UUIDV4) {
    return false;
  }

  return typeof value !== 'function';
}

exports.defaultValueSchemable = defaultValueSchemable;

function removeNullValuesFromHash(hash, omitNull, options) {
  let result = hash;
  options = options || {};
  options.allowNull = options.allowNull || [];

  if (omitNull) {
    const _hash = {};

    _.forIn(hash, (val, key) => {
      if (options.allowNull.includes(key) || key.endsWith('Id') || val !== null && val !== undefined) {
        _hash[key] = val;
      }
    });

    result = _hash;
  }

  return result;
}

exports.removeNullValuesFromHash = removeNullValuesFromHash;

function stack() {
  const orig = Error.prepareStackTrace;

  Error.prepareStackTrace = (_, stack) => stack;

  const err = new Error();
  Error.captureStackTrace(err, stack);
  const errStack = err.stack;
  Error.prepareStackTrace = orig;
  return errStack;
}

exports.stack = stack;
const dialects = new Set(['mariadb', 'mysql', 'postgres', 'sqlite', 'mssql']);

function now(dialect) {
  const d = new Date();

  if (!dialects.has(dialect)) {
    d.setMilliseconds(0);
  }

  return d;
}

exports.now = now; // Note: Use the `quoteIdentifier()` and `escape()` methods on the
// `QueryInterface` instead for more portable code.

const TICK_CHAR = '`';
exports.TICK_CHAR = TICK_CHAR;

function addTicks(s, tickChar) {
  tickChar = tickChar || TICK_CHAR;
  return tickChar + removeTicks(s, tickChar) + tickChar;
}

exports.addTicks = addTicks;

function removeTicks(s, tickChar) {
  tickChar = tickChar || TICK_CHAR;
  return s.replace(new RegExp(tickChar, 'g'), '');
}

exports.removeTicks = removeTicks;
/**
 * Receives a tree-like object and returns a plain object which depth is 1.
 *
 * - Input:
 *
 *  {
 *    name: 'John',
 *    address: {
 *      street: 'Fake St. 123',
 *      coordinates: {
 *        longitude: 55.6779627,
 *        latitude: 12.5964313
 *      }
 *    }
 *  }
 *
 * - Output:
 *
 *  {
 *    name: 'John',
 *    address.street: 'Fake St. 123',
 *    address.coordinates.latitude: 55.6779627,
 *    address.coordinates.longitude: 12.5964313
 *  }
 *
 * @param {Object} value an Object
 * @returns {Object} a flattened object
 * @private
 */

function flattenObjectDeep(value) {
  if (!_.isPlainObject(value)) return value;
  const flattenedObj = {};

  function flattenObject(obj, subPath) {
    Object.keys(obj).forEach(key => {
      const pathToProperty = subPath ? `${subPath}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        flattenObject(obj[key], pathToProperty);
      } else {
        flattenedObj[pathToProperty] = _.get(obj, key);
      }
    });
    return flattenedObj;
  }

  return flattenObject(value, undefined);
}

exports.flattenObjectDeep = flattenObjectDeep;
/**
 * Utility functions for representing SQL functions, and columns that should be escaped.
 * Please do not use these functions directly, use Sequelize.fn and Sequelize.col instead.
 * @private
 */

let SequelizeMethod = function SequelizeMethod() {
  _classCallCheck(this, SequelizeMethod);
};

exports.SequelizeMethod = SequelizeMethod;

let Fn = /*#__PURE__*/function (_SequelizeMethod) {
  _inherits(Fn, _SequelizeMethod);

  var _super = _createSuper(Fn);

  function Fn(fn, args) {
    var _this;

    _classCallCheck(this, Fn);

    _this = _super.call(this);
    _this.fn = fn;
    _this.args = args;
    return _this;
  }

  _createClass(Fn, [{
    key: "clone",
    value: function clone() {
      return new Fn(this.fn, this.args);
    }
  }]);

  return Fn;
}(SequelizeMethod);

exports.Fn = Fn;

let Col = /*#__PURE__*/function (_SequelizeMethod2) {
  _inherits(Col, _SequelizeMethod2);

  var _super2 = _createSuper(Col);

  function Col(col, ...args) {
    var _this2;

    _classCallCheck(this, Col);

    _this2 = _super2.call(this);

    if (args.length > 0) {
      col = args;
    }

    _this2.col = col;
    return _this2;
  }

  return Col;
}(SequelizeMethod);

exports.Col = Col;

let Cast = /*#__PURE__*/function (_SequelizeMethod3) {
  _inherits(Cast, _SequelizeMethod3);

  var _super3 = _createSuper(Cast);

  function Cast(val, type, json) {
    var _this3;

    _classCallCheck(this, Cast);

    _this3 = _super3.call(this);
    _this3.val = val;
    _this3.type = (type || '').trim();
    _this3.json = json || false;
    return _this3;
  }

  return Cast;
}(SequelizeMethod);

exports.Cast = Cast;

let Literal = /*#__PURE__*/function (_SequelizeMethod4) {
  _inherits(Literal, _SequelizeMethod4);

  var _super4 = _createSuper(Literal);

  function Literal(val) {
    var _this4;

    _classCallCheck(this, Literal);

    _this4 = _super4.call(this);
    _this4.val = val;
    return _this4;
  }

  return Literal;
}(SequelizeMethod);

exports.Literal = Literal;

let Json = /*#__PURE__*/function (_SequelizeMethod5) {
  _inherits(Json, _SequelizeMethod5);

  var _super5 = _createSuper(Json);

  function Json(conditionsOrPath, value) {
    var _this5;

    _classCallCheck(this, Json);

    _this5 = _super5.call(this);

    if (_.isObject(conditionsOrPath)) {
      _this5.conditions = conditionsOrPath;
    } else {
      _this5.path = conditionsOrPath;

      if (value) {
        _this5.value = value;
      }
    }

    return _this5;
  }

  return Json;
}(SequelizeMethod);

exports.Json = Json;

let Where = /*#__PURE__*/function (_SequelizeMethod6) {
  _inherits(Where, _SequelizeMethod6);

  var _super6 = _createSuper(Where);

  function Where(attribute, comparator, logic) {
    var _this6;

    _classCallCheck(this, Where);

    _this6 = _super6.call(this);

    if (logic === undefined) {
      logic = comparator;
      comparator = '=';
    }

    _this6.attribute = attribute;
    _this6.comparator = comparator;
    _this6.logic = logic;
    return _this6;
  }

  return Where;
}(SequelizeMethod);

exports.Where = Where; //Collection of helper methods to make it easier to work with symbol operators

/**
 * getOperators
 *
 * @param  {Object} obj
 * @returns {Array<Symbol>} All operators properties of obj
 * @private
 */

function getOperators(obj) {
  return Object.getOwnPropertySymbols(obj).filter(s => operatorsSet.has(s));
}

exports.getOperators = getOperators;
/**
 * getComplexKeys
 *
 * @param  {Object} obj
 * @returns {Array<string|Symbol>} All keys including operators
 * @private
 */

function getComplexKeys(obj) {
  return getOperators(obj).concat(Object.keys(obj));
}

exports.getComplexKeys = getComplexKeys;
/**
 * getComplexSize
 *
 * @param  {Object|Array} obj
 * @returns {number}      Length of object properties including operators if obj is array returns its length
 * @private
 */

function getComplexSize(obj) {
  return Array.isArray(obj) ? obj.length : getComplexKeys(obj).length;
}

exports.getComplexSize = getComplexSize;
/**
 * Returns true if a where clause is empty, even with Symbols
 *
 * @param  {Object} obj
 * @returns {boolean}
 * @private
 */

function isWhereEmpty(obj) {
  return !!obj && _.isEmpty(obj) && getOperators(obj).length === 0;
}

exports.isWhereEmpty = isWhereEmpty;
/**
 * Returns ENUM name by joining table and column name
 *
 * @param {string} tableName
 * @param {string} columnName
 * @returns {string}
 * @private
 */

function generateEnumName(tableName, columnName) {
  return `enum_${tableName}_${columnName}`;
}

exports.generateEnumName = generateEnumName;
/**
 * Returns an new Object which keys are camelized
 *
 * @param {Object} obj
 * @returns {string}
 * @private
 */

function camelizeObjectKeys(obj) {
  const newObj = new Object();
  Object.keys(obj).forEach(key => {
    newObj[camelize(key)] = obj[key];
  });
  return newObj;
}

exports.camelizeObjectKeys = camelizeObjectKeys;
/**
 * Assigns own and inherited enumerable string and symbol keyed properties of source
 * objects to the destination object.
 *
 * https://lodash.com/docs/4.17.4#defaults
 *
 * **Note:** This method mutates `object`.
 *
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @private
 */

function defaults(object, ...sources) {
  object = Object(object);
  sources.forEach(source => {
    if (source) {
      source = Object(source);
      getComplexKeys(source).forEach(key => {
        const value = object[key];

        if (value === undefined || _.eq(value, Object.prototype[key]) && !Object.prototype.hasOwnProperty.call(object, key)) {
          object[key] = source[key];
        }
      });
    }
  });
  return object;
}

exports.defaults = defaults;
/**
 *
 * @param {Object} index
 * @param {Array}  index.fields
 * @param {string} [index.name]
 * @param {string|Object} tableName
 *
 * @returns {Object}
 * @private
 */

function nameIndex(index, tableName) {
  if (tableName.tableName) tableName = tableName.tableName;

  if (!Object.prototype.hasOwnProperty.call(index, 'name')) {
    const fields = index.fields.map(field => typeof field === 'string' ? field : field.name || field.attribute);
    index.name = underscore(`${tableName}_${fields.join('_')}`);
  }

  return index;
}

exports.nameIndex = nameIndex;
/**
 * Checks if 2 arrays intersect.
 *
 * @param {Array} arr1
 * @param {Array} arr2
 * @private
 */

function intersects(arr1, arr2) {
  return arr1.some(v => arr2.includes(v));
}

exports.intersects = intersects;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi91dGlscy5qcyJdLCJuYW1lcyI6WyJEYXRhVHlwZXMiLCJyZXF1aXJlIiwiU3FsU3RyaW5nIiwiXyIsInV1aWR2MSIsInV1aWR2NCIsIlByb21pc2UiLCJvcGVyYXRvcnMiLCJvcGVyYXRvcnNTZXQiLCJTZXQiLCJ2YWx1ZXMiLCJpbmZsZWN0aW9uIiwiZXhwb3J0cyIsImNsYXNzVG9JbnZva2FibGUiLCJ1c2VJbmZsZWN0aW9uIiwiX2luZmxlY3Rpb24iLCJjYW1lbGl6ZUlmIiwic3RyIiwiY29uZGl0aW9uIiwicmVzdWx0IiwiY2FtZWxpemUiLCJ1bmRlcnNjb3JlZElmIiwidW5kZXJzY29yZSIsImlzUHJpbWl0aXZlIiwidmFsIiwidHlwZSIsIm1lcmdlRGVmYXVsdHMiLCJhIiwiYiIsIm1lcmdlV2l0aCIsIm9iamVjdFZhbHVlIiwiaXNQbGFpbk9iamVjdCIsInVuZGVmaW5lZCIsIm1lcmdlIiwib2JqIiwiYXJndW1lbnRzIiwiZm9yT3duIiwidmFsdWUiLCJrZXkiLCJBcnJheSIsImlzQXJyYXkiLCJjb25jYXQiLCJzcGxpY2VTdHIiLCJpbmRleCIsImNvdW50IiwiYWRkIiwic2xpY2UiLCJ0cmltIiwicmVwbGFjZSIsIm1hdGNoIiwiYyIsInRvVXBwZXJDYXNlIiwic2luZ3VsYXJpemUiLCJwbHVyYWxpemUiLCJmb3JtYXQiLCJhcnIiLCJkaWFsZWN0IiwidGltZVpvbmUiLCJmb3JtYXROYW1lZFBhcmFtZXRlcnMiLCJzcWwiLCJwYXJhbWV0ZXJzIiwiY2xvbmVEZWVwIiwib25seVBsYWluIiwiY2xvbmVEZWVwV2l0aCIsImVsZW0iLCJjbG9uZSIsIm1hcEZpbmRlck9wdGlvbnMiLCJvcHRpb25zIiwiTW9kZWwiLCJhdHRyaWJ1dGVzIiwiX2luamVjdERlcGVuZGVudFZpcnR1YWxBdHRyaWJ1dGVzIiwiZmlsdGVyIiwidiIsIl92aXJ0dWFsQXR0cmlidXRlcyIsImhhcyIsIm1hcE9wdGlvbkZpZWxkTmFtZXMiLCJtYXAiLCJhdHRyIiwicmF3QXR0cmlidXRlcyIsImZpZWxkIiwid2hlcmUiLCJtYXBXaGVyZUZpZWxkTmFtZXMiLCJnZXRDb21wbGV4S2V5cyIsImZvckVhY2giLCJhdHRyaWJ1dGUiLCJyYXdBdHRyaWJ1dGUiLCJmaWVsZE5hbWUiLCJIU1RPUkUiLCJKU09OIiwibWFwVmFsdWVGaWVsZE5hbWVzIiwiZGF0YVZhbHVlcyIsImZpZWxkcyIsImlzQ29sU3RyaW5nIiwibGVuZ3RoIiwiY2FuVHJlYXRBcnJheUFzQW5kIiwic29tZSIsImFyZyIsIldoZXJlIiwiY29tYmluZVRhYmxlTmFtZXMiLCJ0YWJsZU5hbWUxIiwidGFibGVOYW1lMiIsInRvTG93ZXJDYXNlIiwidG9EZWZhdWx0VmFsdWUiLCJ0bXAiLCJBQlNUUkFDVCIsInRvU3FsIiwiVVVJRFYxIiwiVVVJRFY0IiwiTk9XIiwibm93IiwiZGVmYXVsdFZhbHVlU2NoZW1hYmxlIiwicmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoIiwiaGFzaCIsIm9taXROdWxsIiwiYWxsb3dOdWxsIiwiX2hhc2giLCJmb3JJbiIsImluY2x1ZGVzIiwiZW5kc1dpdGgiLCJzdGFjayIsIm9yaWciLCJFcnJvciIsInByZXBhcmVTdGFja1RyYWNlIiwiZXJyIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJlcnJTdGFjayIsImRpYWxlY3RzIiwiZCIsIkRhdGUiLCJzZXRNaWxsaXNlY29uZHMiLCJUSUNLX0NIQVIiLCJhZGRUaWNrcyIsInMiLCJ0aWNrQ2hhciIsInJlbW92ZVRpY2tzIiwiUmVnRXhwIiwiZmxhdHRlbk9iamVjdERlZXAiLCJmbGF0dGVuZWRPYmoiLCJmbGF0dGVuT2JqZWN0Iiwic3ViUGF0aCIsIk9iamVjdCIsImtleXMiLCJwYXRoVG9Qcm9wZXJ0eSIsImdldCIsIlNlcXVlbGl6ZU1ldGhvZCIsIkZuIiwiZm4iLCJhcmdzIiwiQ29sIiwiY29sIiwiQ2FzdCIsImpzb24iLCJMaXRlcmFsIiwiSnNvbiIsImNvbmRpdGlvbnNPclBhdGgiLCJpc09iamVjdCIsImNvbmRpdGlvbnMiLCJwYXRoIiwiY29tcGFyYXRvciIsImxvZ2ljIiwiZ2V0T3BlcmF0b3JzIiwiZ2V0T3duUHJvcGVydHlTeW1ib2xzIiwiZ2V0Q29tcGxleFNpemUiLCJpc1doZXJlRW1wdHkiLCJpc0VtcHR5IiwiZ2VuZXJhdGVFbnVtTmFtZSIsInRhYmxlTmFtZSIsImNvbHVtbk5hbWUiLCJjYW1lbGl6ZU9iamVjdEtleXMiLCJuZXdPYmoiLCJkZWZhdWx0cyIsIm9iamVjdCIsInNvdXJjZXMiLCJzb3VyY2UiLCJlcSIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsIm5hbWVJbmRleCIsIm5hbWUiLCJqb2luIiwiaW50ZXJzZWN0cyIsImFycjEiLCJhcnIyIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLFNBQVMsR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBekI7O0FBQ0EsTUFBTUMsU0FBUyxHQUFHRCxPQUFPLENBQUMsY0FBRCxDQUF6Qjs7QUFDQSxNQUFNRSxDQUFDLEdBQUdGLE9BQU8sQ0FBQyxRQUFELENBQWpCOztBQUNBLE1BQU1HLE1BQU0sR0FBR0gsT0FBTyxDQUFDLFNBQUQsQ0FBdEI7O0FBQ0EsTUFBTUksTUFBTSxHQUFHSixPQUFPLENBQUMsU0FBRCxDQUF0Qjs7QUFDQSxNQUFNSyxPQUFPLEdBQUdMLE9BQU8sQ0FBQyxXQUFELENBQXZCOztBQUNBLE1BQU1NLFNBQVMsR0FBR04sT0FBTyxDQUFDLGFBQUQsQ0FBekI7O0FBQ0EsTUFBTU8sWUFBWSxHQUFHLElBQUlDLEdBQUosQ0FBUU4sQ0FBQyxDQUFDTyxNQUFGLENBQVNILFNBQVQsQ0FBUixDQUFyQjs7QUFFQSxJQUFJSSxVQUFVLEdBQUdWLE9BQU8sQ0FBQyxZQUFELENBQXhCOztBQUVBVyxPQUFPLENBQUNDLGdCQUFSLEdBQTJCWixPQUFPLENBQUMsMEJBQUQsQ0FBUCxDQUFvQ1ksZ0JBQS9EO0FBRUFELE9BQU8sQ0FBQ04sT0FBUixHQUFrQkEsT0FBbEI7O0FBRUEsU0FBU1EsYUFBVCxDQUF1QkMsV0FBdkIsRUFBb0M7QUFDbENKLEVBQUFBLFVBQVUsR0FBR0ksV0FBYjtBQUNEOztBQUNESCxPQUFPLENBQUNFLGFBQVIsR0FBd0JBLGFBQXhCOztBQUVBLFNBQVNFLFVBQVQsQ0FBb0JDLEdBQXBCLEVBQXlCQyxTQUF6QixFQUFvQztBQUNsQyxNQUFJQyxNQUFNLEdBQUdGLEdBQWI7O0FBRUEsTUFBSUMsU0FBSixFQUFlO0FBQ2JDLElBQUFBLE1BQU0sR0FBR0MsUUFBUSxDQUFDSCxHQUFELENBQWpCO0FBQ0Q7O0FBRUQsU0FBT0UsTUFBUDtBQUNEOztBQUNEUCxPQUFPLENBQUNJLFVBQVIsR0FBcUJBLFVBQXJCOztBQUVBLFNBQVNLLGFBQVQsQ0FBdUJKLEdBQXZCLEVBQTRCQyxTQUE1QixFQUF1QztBQUNyQyxNQUFJQyxNQUFNLEdBQUdGLEdBQWI7O0FBRUEsTUFBSUMsU0FBSixFQUFlO0FBQ2JDLElBQUFBLE1BQU0sR0FBR0csVUFBVSxDQUFDTCxHQUFELENBQW5CO0FBQ0Q7O0FBRUQsU0FBT0UsTUFBUDtBQUNEOztBQUNEUCxPQUFPLENBQUNTLGFBQVIsR0FBd0JBLGFBQXhCOztBQUVBLFNBQVNFLFdBQVQsQ0FBcUJDLEdBQXJCLEVBQTBCO0FBQ3hCLFFBQU1DLElBQUksR0FBRyxPQUFPRCxHQUFwQjtBQUNBLFNBQU9DLElBQUksS0FBSyxRQUFULElBQXFCQSxJQUFJLEtBQUssUUFBOUIsSUFBMENBLElBQUksS0FBSyxTQUExRDtBQUNEOztBQUNEYixPQUFPLENBQUNXLFdBQVIsR0FBc0JBLFdBQXRCLEMsQ0FFQTs7QUFDQSxTQUFTRyxhQUFULENBQXVCQyxDQUF2QixFQUEwQkMsQ0FBMUIsRUFBNkI7QUFDM0IsU0FBT3pCLENBQUMsQ0FBQzBCLFNBQUYsQ0FBWUYsQ0FBWixFQUFlQyxDQUFmLEVBQWtCRSxXQUFXLElBQUk7QUFDdEM7QUFDQSxRQUFJLENBQUMzQixDQUFDLENBQUM0QixhQUFGLENBQWdCRCxXQUFoQixDQUFELElBQWlDQSxXQUFXLEtBQUtFLFNBQXJELEVBQWdFO0FBQzlELGFBQU9GLFdBQVA7QUFDRDtBQUNGLEdBTE0sQ0FBUDtBQU1EOztBQUNEbEIsT0FBTyxDQUFDYyxhQUFSLEdBQXdCQSxhQUF4QixDLENBRUE7QUFDQTtBQUNBOztBQUNBLFNBQVNPLEtBQVQsR0FBaUI7QUFDZixRQUFNZCxNQUFNLEdBQUcsRUFBZjs7QUFFQSxPQUFLLE1BQU1lLEdBQVgsSUFBa0JDLFNBQWxCLEVBQTZCO0FBQzNCaEMsSUFBQUEsQ0FBQyxDQUFDaUMsTUFBRixDQUFTRixHQUFULEVBQWMsQ0FBQ0csS0FBRCxFQUFRQyxHQUFSLEtBQWdCO0FBQzVCLFVBQUlELEtBQUssS0FBS0wsU0FBZCxFQUF5QjtBQUN2QixZQUFJLENBQUNiLE1BQU0sQ0FBQ21CLEdBQUQsQ0FBWCxFQUFrQjtBQUNoQm5CLFVBQUFBLE1BQU0sQ0FBQ21CLEdBQUQsQ0FBTixHQUFjRCxLQUFkO0FBQ0QsU0FGRCxNQUVPLElBQUlsQyxDQUFDLENBQUM0QixhQUFGLENBQWdCTSxLQUFoQixLQUEwQmxDLENBQUMsQ0FBQzRCLGFBQUYsQ0FBZ0JaLE1BQU0sQ0FBQ21CLEdBQUQsQ0FBdEIsQ0FBOUIsRUFBNEQ7QUFDakVuQixVQUFBQSxNQUFNLENBQUNtQixHQUFELENBQU4sR0FBY0wsS0FBSyxDQUFDZCxNQUFNLENBQUNtQixHQUFELENBQVAsRUFBY0QsS0FBZCxDQUFuQjtBQUNELFNBRk0sTUFFQSxJQUFJRSxLQUFLLENBQUNDLE9BQU4sQ0FBY0gsS0FBZCxLQUF3QkUsS0FBSyxDQUFDQyxPQUFOLENBQWNyQixNQUFNLENBQUNtQixHQUFELENBQXBCLENBQTVCLEVBQXdEO0FBQzdEbkIsVUFBQUEsTUFBTSxDQUFDbUIsR0FBRCxDQUFOLEdBQWNELEtBQUssQ0FBQ0ksTUFBTixDQUFhdEIsTUFBTSxDQUFDbUIsR0FBRCxDQUFuQixDQUFkO0FBQ0QsU0FGTSxNQUVBO0FBQ0xuQixVQUFBQSxNQUFNLENBQUNtQixHQUFELENBQU4sR0FBY0QsS0FBZDtBQUNEO0FBQ0Y7QUFDRixLQVpEO0FBYUQ7O0FBRUQsU0FBT2xCLE1BQVA7QUFDRDs7QUFDRFAsT0FBTyxDQUFDcUIsS0FBUixHQUFnQkEsS0FBaEI7O0FBRUEsU0FBU1MsU0FBVCxDQUFtQnpCLEdBQW5CLEVBQXdCMEIsS0FBeEIsRUFBK0JDLEtBQS9CLEVBQXNDQyxHQUF0QyxFQUEyQztBQUN6QyxTQUFPNUIsR0FBRyxDQUFDNkIsS0FBSixDQUFVLENBQVYsRUFBYUgsS0FBYixJQUFzQkUsR0FBdEIsR0FBNEI1QixHQUFHLENBQUM2QixLQUFKLENBQVVILEtBQUssR0FBR0MsS0FBbEIsQ0FBbkM7QUFDRDs7QUFDRGhDLE9BQU8sQ0FBQzhCLFNBQVIsR0FBb0JBLFNBQXBCOztBQUVBLFNBQVN0QixRQUFULENBQWtCSCxHQUFsQixFQUF1QjtBQUNyQixTQUFPQSxHQUFHLENBQUM4QixJQUFKLEdBQVdDLE9BQVgsQ0FBbUIsY0FBbkIsRUFBbUMsQ0FBQ0MsS0FBRCxFQUFRQyxDQUFSLEtBQWNBLENBQUMsQ0FBQ0MsV0FBRixFQUFqRCxDQUFQO0FBQ0Q7O0FBQ0R2QyxPQUFPLENBQUNRLFFBQVIsR0FBbUJBLFFBQW5COztBQUVBLFNBQVNFLFVBQVQsQ0FBb0JMLEdBQXBCLEVBQXlCO0FBQ3ZCLFNBQU9OLFVBQVUsQ0FBQ1csVUFBWCxDQUFzQkwsR0FBdEIsQ0FBUDtBQUNEOztBQUNETCxPQUFPLENBQUNVLFVBQVIsR0FBcUJBLFVBQXJCOztBQUVBLFNBQVM4QixXQUFULENBQXFCbkMsR0FBckIsRUFBMEI7QUFDeEIsU0FBT04sVUFBVSxDQUFDeUMsV0FBWCxDQUF1Qm5DLEdBQXZCLENBQVA7QUFDRDs7QUFDREwsT0FBTyxDQUFDd0MsV0FBUixHQUFzQkEsV0FBdEI7O0FBRUEsU0FBU0MsU0FBVCxDQUFtQnBDLEdBQW5CLEVBQXdCO0FBQ3RCLFNBQU9OLFVBQVUsQ0FBQzBDLFNBQVgsQ0FBcUJwQyxHQUFyQixDQUFQO0FBQ0Q7O0FBQ0RMLE9BQU8sQ0FBQ3lDLFNBQVIsR0FBb0JBLFNBQXBCOztBQUVBLFNBQVNDLE1BQVQsQ0FBZ0JDLEdBQWhCLEVBQXFCQyxPQUFyQixFQUE4QjtBQUM1QixRQUFNQyxRQUFRLEdBQUcsSUFBakIsQ0FENEIsQ0FFNUI7O0FBQ0EsU0FBT3ZELFNBQVMsQ0FBQ29ELE1BQVYsQ0FBaUJDLEdBQUcsQ0FBQyxDQUFELENBQXBCLEVBQXlCQSxHQUFHLENBQUNULEtBQUosQ0FBVSxDQUFWLENBQXpCLEVBQXVDVyxRQUF2QyxFQUFpREQsT0FBakQsQ0FBUDtBQUNEOztBQUNENUMsT0FBTyxDQUFDMEMsTUFBUixHQUFpQkEsTUFBakI7O0FBRUEsU0FBU0kscUJBQVQsQ0FBK0JDLEdBQS9CLEVBQW9DQyxVQUFwQyxFQUFnREosT0FBaEQsRUFBeUQ7QUFDdkQsUUFBTUMsUUFBUSxHQUFHLElBQWpCO0FBQ0EsU0FBT3ZELFNBQVMsQ0FBQ3dELHFCQUFWLENBQWdDQyxHQUFoQyxFQUFxQ0MsVUFBckMsRUFBaURILFFBQWpELEVBQTJERCxPQUEzRCxDQUFQO0FBQ0Q7O0FBQ0Q1QyxPQUFPLENBQUM4QyxxQkFBUixHQUFnQ0EscUJBQWhDOztBQUVBLFNBQVNHLFNBQVQsQ0FBbUIzQixHQUFuQixFQUF3QjRCLFNBQXhCLEVBQW1DO0FBQ2pDNUIsRUFBQUEsR0FBRyxHQUFHQSxHQUFHLElBQUksRUFBYjtBQUNBLFNBQU8vQixDQUFDLENBQUM0RCxhQUFGLENBQWdCN0IsR0FBaEIsRUFBcUI4QixJQUFJLElBQUk7QUFDbEM7QUFDQSxRQUFJekIsS0FBSyxDQUFDQyxPQUFOLENBQWN3QixJQUFkLEtBQXVCN0QsQ0FBQyxDQUFDNEIsYUFBRixDQUFnQmlDLElBQWhCLENBQTNCLEVBQWtEO0FBQ2hELGFBQU9oQyxTQUFQO0FBQ0QsS0FKaUMsQ0FNbEM7QUFDQTs7O0FBQ0EsUUFBSThCLFNBQVMsSUFBSSxPQUFPRSxJQUFQLEtBQWdCLFFBQWpDLEVBQTJDO0FBQ3pDLGFBQU9BLElBQVA7QUFDRCxLQVZpQyxDQVlsQzs7O0FBQ0EsUUFBSUEsSUFBSSxJQUFJLE9BQU9BLElBQUksQ0FBQ0MsS0FBWixLQUFzQixVQUFsQyxFQUE4QztBQUM1QyxhQUFPRCxJQUFJLENBQUNDLEtBQUwsRUFBUDtBQUNEO0FBQ0YsR0FoQk0sQ0FBUDtBQWlCRDs7QUFDRHJELE9BQU8sQ0FBQ2lELFNBQVIsR0FBb0JBLFNBQXBCO0FBRUE7O0FBQ0EsU0FBU0ssZ0JBQVQsQ0FBMEJDLE9BQTFCLEVBQW1DQyxLQUFuQyxFQUEwQztBQUN4QyxNQUFJRCxPQUFPLENBQUNFLFVBQVIsSUFBc0I5QixLQUFLLENBQUNDLE9BQU4sQ0FBYzJCLE9BQU8sQ0FBQ0UsVUFBdEIsQ0FBMUIsRUFBNkQ7QUFDM0RGLElBQUFBLE9BQU8sQ0FBQ0UsVUFBUixHQUFxQkQsS0FBSyxDQUFDRSxpQ0FBTixDQUF3Q0gsT0FBTyxDQUFDRSxVQUFoRCxDQUFyQjtBQUNBRixJQUFBQSxPQUFPLENBQUNFLFVBQVIsR0FBcUJGLE9BQU8sQ0FBQ0UsVUFBUixDQUFtQkUsTUFBbkIsQ0FBMEJDLENBQUMsSUFBSSxDQUFDSixLQUFLLENBQUNLLGtCQUFOLENBQXlCQyxHQUF6QixDQUE2QkYsQ0FBN0IsQ0FBaEMsQ0FBckI7QUFDRDs7QUFFREcsRUFBQUEsbUJBQW1CLENBQUNSLE9BQUQsRUFBVUMsS0FBVixDQUFuQjtBQUVBLFNBQU9ELE9BQVA7QUFDRDs7QUFDRHZELE9BQU8sQ0FBQ3NELGdCQUFSLEdBQTJCQSxnQkFBM0I7QUFFQTs7QUFDQSxTQUFTUyxtQkFBVCxDQUE2QlIsT0FBN0IsRUFBc0NDLEtBQXRDLEVBQTZDO0FBQzNDLE1BQUk3QixLQUFLLENBQUNDLE9BQU4sQ0FBYzJCLE9BQU8sQ0FBQ0UsVUFBdEIsQ0FBSixFQUF1QztBQUNyQ0YsSUFBQUEsT0FBTyxDQUFDRSxVQUFSLEdBQXFCRixPQUFPLENBQUNFLFVBQVIsQ0FBbUJPLEdBQW5CLENBQXVCQyxJQUFJLElBQUk7QUFDbEQ7QUFDQSxVQUFJLE9BQU9BLElBQVAsS0FBZ0IsUUFBcEIsRUFBOEIsT0FBT0EsSUFBUCxDQUZvQixDQUdsRDs7QUFDQSxVQUFJVCxLQUFLLENBQUNVLGFBQU4sQ0FBb0JELElBQXBCLEtBQTZCQSxJQUFJLEtBQUtULEtBQUssQ0FBQ1UsYUFBTixDQUFvQkQsSUFBcEIsRUFBMEJFLEtBQXBFLEVBQTJFO0FBQ3pFLGVBQU8sQ0FBQ1gsS0FBSyxDQUFDVSxhQUFOLENBQW9CRCxJQUFwQixFQUEwQkUsS0FBM0IsRUFBa0NGLElBQWxDLENBQVA7QUFDRDs7QUFDRCxhQUFPQSxJQUFQO0FBQ0QsS0FSb0IsQ0FBckI7QUFTRDs7QUFFRCxNQUFJVixPQUFPLENBQUNhLEtBQVIsSUFBaUI3RSxDQUFDLENBQUM0QixhQUFGLENBQWdCb0MsT0FBTyxDQUFDYSxLQUF4QixDQUFyQixFQUFxRDtBQUNuRGIsSUFBQUEsT0FBTyxDQUFDYSxLQUFSLEdBQWdCQyxrQkFBa0IsQ0FBQ2QsT0FBTyxDQUFDYSxLQUFULEVBQWdCWixLQUFoQixDQUFsQztBQUNEOztBQUVELFNBQU9ELE9BQVA7QUFDRDs7QUFDRHZELE9BQU8sQ0FBQytELG1CQUFSLEdBQThCQSxtQkFBOUI7O0FBRUEsU0FBU00sa0JBQVQsQ0FBNEJaLFVBQTVCLEVBQXdDRCxLQUF4QyxFQUErQztBQUM3QyxNQUFJQyxVQUFKLEVBQWdCO0FBQ2RhLElBQUFBLGNBQWMsQ0FBQ2IsVUFBRCxDQUFkLENBQTJCYyxPQUEzQixDQUFtQ0MsU0FBUyxJQUFJO0FBQzlDLFlBQU1DLFlBQVksR0FBR2pCLEtBQUssQ0FBQ1UsYUFBTixDQUFvQk0sU0FBcEIsQ0FBckI7O0FBRUEsVUFBSUMsWUFBWSxJQUFJQSxZQUFZLENBQUNOLEtBQWIsS0FBdUJNLFlBQVksQ0FBQ0MsU0FBeEQsRUFBbUU7QUFDakVqQixRQUFBQSxVQUFVLENBQUNnQixZQUFZLENBQUNOLEtBQWQsQ0FBVixHQUFpQ1YsVUFBVSxDQUFDZSxTQUFELENBQTNDO0FBQ0EsZUFBT2YsVUFBVSxDQUFDZSxTQUFELENBQWpCO0FBQ0Q7O0FBRUQsVUFBSWpGLENBQUMsQ0FBQzRCLGFBQUYsQ0FBZ0JzQyxVQUFVLENBQUNlLFNBQUQsQ0FBMUIsS0FDQyxFQUFFQyxZQUFZLEtBQ2ZBLFlBQVksQ0FBQzVELElBQWIsWUFBNkJ6QixTQUFTLENBQUN1RixNQUF2QyxJQUNHRixZQUFZLENBQUM1RCxJQUFiLFlBQTZCekIsU0FBUyxDQUFDd0YsSUFGM0IsQ0FBZCxDQURMLEVBR3NEO0FBQUU7QUFDdERuQixRQUFBQSxVQUFVLENBQUNlLFNBQUQsQ0FBVixHQUF3QlQsbUJBQW1CLENBQUM7QUFDMUNLLFVBQUFBLEtBQUssRUFBRVgsVUFBVSxDQUFDZSxTQUFEO0FBRHlCLFNBQUQsRUFFeENoQixLQUZ3QyxDQUFuQixDQUVkWSxLQUZWO0FBR0Q7O0FBRUQsVUFBSXpDLEtBQUssQ0FBQ0MsT0FBTixDQUFjNkIsVUFBVSxDQUFDZSxTQUFELENBQXhCLENBQUosRUFBMEM7QUFDeENmLFFBQUFBLFVBQVUsQ0FBQ2UsU0FBRCxDQUFWLENBQXNCRCxPQUF0QixDQUE4QixDQUFDSCxLQUFELEVBQVFyQyxLQUFSLEtBQWtCO0FBQzlDLGNBQUl4QyxDQUFDLENBQUM0QixhQUFGLENBQWdCaUQsS0FBaEIsQ0FBSixFQUE0QjtBQUMxQlgsWUFBQUEsVUFBVSxDQUFDZSxTQUFELENBQVYsQ0FBc0J6QyxLQUF0QixJQUErQnNDLGtCQUFrQixDQUFDRCxLQUFELEVBQVFaLEtBQVIsQ0FBakQ7QUFDRDtBQUNGLFNBSkQ7QUFLRDtBQUVGLEtBekJEO0FBMEJEOztBQUVELFNBQU9DLFVBQVA7QUFDRDs7QUFDRHpELE9BQU8sQ0FBQ3FFLGtCQUFSLEdBQTZCQSxrQkFBN0I7QUFFQTs7QUFDQSxTQUFTUSxrQkFBVCxDQUE0QkMsVUFBNUIsRUFBd0NDLE1BQXhDLEVBQWdEdkIsS0FBaEQsRUFBdUQ7QUFDckQsUUFBTTFELE1BQU0sR0FBRyxFQUFmOztBQUVBLE9BQUssTUFBTW1FLElBQVgsSUFBbUJjLE1BQW5CLEVBQTJCO0FBQ3pCLFFBQUlELFVBQVUsQ0FBQ2IsSUFBRCxDQUFWLEtBQXFCN0MsU0FBckIsSUFBa0MsQ0FBQ29DLEtBQUssQ0FBQ0ssa0JBQU4sQ0FBeUJDLEdBQXpCLENBQTZCRyxJQUE3QixDQUF2QyxFQUEyRTtBQUN6RTtBQUNBLFVBQUlULEtBQUssQ0FBQ1UsYUFBTixDQUFvQkQsSUFBcEIsS0FBNkJULEtBQUssQ0FBQ1UsYUFBTixDQUFvQkQsSUFBcEIsRUFBMEJFLEtBQXZELElBQWdFWCxLQUFLLENBQUNVLGFBQU4sQ0FBb0JELElBQXBCLEVBQTBCRSxLQUExQixLQUFvQ0YsSUFBeEcsRUFBOEc7QUFDNUduRSxRQUFBQSxNQUFNLENBQUMwRCxLQUFLLENBQUNVLGFBQU4sQ0FBb0JELElBQXBCLEVBQTBCRSxLQUEzQixDQUFOLEdBQTBDVyxVQUFVLENBQUNiLElBQUQsQ0FBcEQ7QUFDRCxPQUZELE1BRU87QUFDTG5FLFFBQUFBLE1BQU0sQ0FBQ21FLElBQUQsQ0FBTixHQUFlYSxVQUFVLENBQUNiLElBQUQsQ0FBekI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQsU0FBT25FLE1BQVA7QUFDRDs7QUFDREUsT0FBTyxDQUFDNkUsa0JBQVIsR0FBNkJBLGtCQUE3Qjs7QUFFQSxTQUFTRyxXQUFULENBQXFCdkQsS0FBckIsRUFBNEI7QUFDMUIsU0FBTyxPQUFPQSxLQUFQLEtBQWlCLFFBQWpCLElBQTZCQSxLQUFLLENBQUMsQ0FBRCxDQUFMLEtBQWEsR0FBMUMsSUFBaURBLEtBQUssQ0FBQ0EsS0FBSyxDQUFDd0QsTUFBTixHQUFlLENBQWhCLENBQUwsS0FBNEIsR0FBcEY7QUFDRDs7QUFDRGpGLE9BQU8sQ0FBQ2dGLFdBQVIsR0FBc0JBLFdBQXRCOztBQUVBLFNBQVNFLGtCQUFULENBQTRCdkMsR0FBNUIsRUFBaUM7QUFDL0IsU0FBT0EsR0FBRyxDQUFDd0MsSUFBSixDQUFTQyxHQUFHLElBQUk3RixDQUFDLENBQUM0QixhQUFGLENBQWdCaUUsR0FBaEIsS0FBd0JBLEdBQUcsWUFBWUMsS0FBdkQsQ0FBUDtBQUNEOztBQUNEckYsT0FBTyxDQUFDa0Ysa0JBQVIsR0FBNkJBLGtCQUE3Qjs7QUFFQSxTQUFTSSxpQkFBVCxDQUEyQkMsVUFBM0IsRUFBdUNDLFVBQXZDLEVBQW1EO0FBQ2pELFNBQU9ELFVBQVUsQ0FBQ0UsV0FBWCxLQUEyQkQsVUFBVSxDQUFDQyxXQUFYLEVBQTNCLEdBQXNERixVQUFVLEdBQUdDLFVBQW5FLEdBQWdGQSxVQUFVLEdBQUdELFVBQXBHO0FBQ0Q7O0FBQ0R2RixPQUFPLENBQUNzRixpQkFBUixHQUE0QkEsaUJBQTVCOztBQUVBLFNBQVNJLGNBQVQsQ0FBd0JqRSxLQUF4QixFQUErQm1CLE9BQS9CLEVBQXdDO0FBQ3RDLE1BQUksT0FBT25CLEtBQVAsS0FBaUIsVUFBckIsRUFBaUM7QUFDL0IsVUFBTWtFLEdBQUcsR0FBR2xFLEtBQUssRUFBakI7O0FBQ0EsUUFBSWtFLEdBQUcsWUFBWXZHLFNBQVMsQ0FBQ3dHLFFBQTdCLEVBQXVDO0FBQ3JDLGFBQU9ELEdBQUcsQ0FBQ0UsS0FBSixFQUFQO0FBQ0Q7O0FBQ0QsV0FBT0YsR0FBUDtBQUNEOztBQUNELE1BQUlsRSxLQUFLLFlBQVlyQyxTQUFTLENBQUMwRyxNQUEvQixFQUF1QztBQUNyQyxXQUFPdEcsTUFBTSxFQUFiO0FBQ0Q7O0FBQ0QsTUFBSWlDLEtBQUssWUFBWXJDLFNBQVMsQ0FBQzJHLE1BQS9CLEVBQXVDO0FBQ3JDLFdBQU90RyxNQUFNLEVBQWI7QUFDRDs7QUFDRCxNQUFJZ0MsS0FBSyxZQUFZckMsU0FBUyxDQUFDNEcsR0FBL0IsRUFBb0M7QUFDbEMsV0FBT0MsR0FBRyxDQUFDckQsT0FBRCxDQUFWO0FBQ0Q7O0FBQ0QsTUFBSXJELENBQUMsQ0FBQzRCLGFBQUYsQ0FBZ0JNLEtBQWhCLEtBQTBCRSxLQUFLLENBQUNDLE9BQU4sQ0FBY0gsS0FBZCxDQUE5QixFQUFvRDtBQUNsRCxXQUFPbEMsQ0FBQyxDQUFDOEQsS0FBRixDQUFRNUIsS0FBUixDQUFQO0FBQ0Q7O0FBQ0QsU0FBT0EsS0FBUDtBQUNEOztBQUNEekIsT0FBTyxDQUFDMEYsY0FBUixHQUF5QkEsY0FBekI7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFNBQVNRLHFCQUFULENBQStCekUsS0FBL0IsRUFBc0M7QUFDcEMsTUFBSUEsS0FBSyxLQUFLTCxTQUFkLEVBQXlCO0FBQUUsV0FBTyxLQUFQO0FBQWUsR0FETixDQUdwQztBQUNBOzs7QUFDQSxNQUFJSyxLQUFLLFlBQVlyQyxTQUFTLENBQUM0RyxHQUEvQixFQUFvQztBQUFFLFdBQU8sS0FBUDtBQUFlOztBQUVyRCxNQUFJdkUsS0FBSyxZQUFZckMsU0FBUyxDQUFDMEcsTUFBM0IsSUFBcUNyRSxLQUFLLFlBQVlyQyxTQUFTLENBQUMyRyxNQUFwRSxFQUE0RTtBQUFFLFdBQU8sS0FBUDtBQUFlOztBQUU3RixTQUFPLE9BQU90RSxLQUFQLEtBQWlCLFVBQXhCO0FBQ0Q7O0FBQ0R6QixPQUFPLENBQUNrRyxxQkFBUixHQUFnQ0EscUJBQWhDOztBQUVBLFNBQVNDLHdCQUFULENBQWtDQyxJQUFsQyxFQUF3Q0MsUUFBeEMsRUFBa0Q5QyxPQUFsRCxFQUEyRDtBQUN6RCxNQUFJaEQsTUFBTSxHQUFHNkYsSUFBYjtBQUVBN0MsRUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7QUFDQUEsRUFBQUEsT0FBTyxDQUFDK0MsU0FBUixHQUFvQi9DLE9BQU8sQ0FBQytDLFNBQVIsSUFBcUIsRUFBekM7O0FBRUEsTUFBSUQsUUFBSixFQUFjO0FBQ1osVUFBTUUsS0FBSyxHQUFHLEVBQWQ7O0FBRUFoSCxJQUFBQSxDQUFDLENBQUNpSCxLQUFGLENBQVFKLElBQVIsRUFBYyxDQUFDeEYsR0FBRCxFQUFNYyxHQUFOLEtBQWM7QUFDMUIsVUFBSTZCLE9BQU8sQ0FBQytDLFNBQVIsQ0FBa0JHLFFBQWxCLENBQTJCL0UsR0FBM0IsS0FBbUNBLEdBQUcsQ0FBQ2dGLFFBQUosQ0FBYSxJQUFiLENBQW5DLElBQXlEOUYsR0FBRyxLQUFLLElBQVIsSUFBZ0JBLEdBQUcsS0FBS1EsU0FBckYsRUFBZ0c7QUFDOUZtRixRQUFBQSxLQUFLLENBQUM3RSxHQUFELENBQUwsR0FBYWQsR0FBYjtBQUNEO0FBQ0YsS0FKRDs7QUFNQUwsSUFBQUEsTUFBTSxHQUFHZ0csS0FBVDtBQUNEOztBQUVELFNBQU9oRyxNQUFQO0FBQ0Q7O0FBQ0RQLE9BQU8sQ0FBQ21HLHdCQUFSLEdBQW1DQSx3QkFBbkM7O0FBRUEsU0FBU1EsS0FBVCxHQUFpQjtBQUNmLFFBQU1DLElBQUksR0FBR0MsS0FBSyxDQUFDQyxpQkFBbkI7O0FBQ0FELEVBQUFBLEtBQUssQ0FBQ0MsaUJBQU4sR0FBMEIsQ0FBQ3ZILENBQUQsRUFBSW9ILEtBQUosS0FBY0EsS0FBeEM7O0FBQ0EsUUFBTUksR0FBRyxHQUFHLElBQUlGLEtBQUosRUFBWjtBQUNBQSxFQUFBQSxLQUFLLENBQUNHLGlCQUFOLENBQXdCRCxHQUF4QixFQUE2QkosS0FBN0I7QUFDQSxRQUFNTSxRQUFRLEdBQUdGLEdBQUcsQ0FBQ0osS0FBckI7QUFDQUUsRUFBQUEsS0FBSyxDQUFDQyxpQkFBTixHQUEwQkYsSUFBMUI7QUFDQSxTQUFPSyxRQUFQO0FBQ0Q7O0FBQ0RqSCxPQUFPLENBQUMyRyxLQUFSLEdBQWdCQSxLQUFoQjtBQUVBLE1BQU1PLFFBQVEsR0FBRyxJQUFJckgsR0FBSixDQUFRLENBQUMsU0FBRCxFQUFZLE9BQVosRUFBcUIsVUFBckIsRUFBaUMsUUFBakMsRUFBMkMsT0FBM0MsQ0FBUixDQUFqQjs7QUFFQSxTQUFTb0csR0FBVCxDQUFhckQsT0FBYixFQUFzQjtBQUNwQixRQUFNdUUsQ0FBQyxHQUFHLElBQUlDLElBQUosRUFBVjs7QUFDQSxNQUFJLENBQUNGLFFBQVEsQ0FBQ3BELEdBQVQsQ0FBYWxCLE9BQWIsQ0FBTCxFQUE0QjtBQUMxQnVFLElBQUFBLENBQUMsQ0FBQ0UsZUFBRixDQUFrQixDQUFsQjtBQUNEOztBQUNELFNBQU9GLENBQVA7QUFDRDs7QUFDRG5ILE9BQU8sQ0FBQ2lHLEdBQVIsR0FBY0EsR0FBZCxDLENBRUE7QUFDQTs7QUFFQSxNQUFNcUIsU0FBUyxHQUFHLEdBQWxCO0FBQ0F0SCxPQUFPLENBQUNzSCxTQUFSLEdBQW9CQSxTQUFwQjs7QUFFQSxTQUFTQyxRQUFULENBQWtCQyxDQUFsQixFQUFxQkMsUUFBckIsRUFBK0I7QUFDN0JBLEVBQUFBLFFBQVEsR0FBR0EsUUFBUSxJQUFJSCxTQUF2QjtBQUNBLFNBQU9HLFFBQVEsR0FBR0MsV0FBVyxDQUFDRixDQUFELEVBQUlDLFFBQUosQ0FBdEIsR0FBc0NBLFFBQTdDO0FBQ0Q7O0FBQ0R6SCxPQUFPLENBQUN1SCxRQUFSLEdBQW1CQSxRQUFuQjs7QUFFQSxTQUFTRyxXQUFULENBQXFCRixDQUFyQixFQUF3QkMsUUFBeEIsRUFBa0M7QUFDaENBLEVBQUFBLFFBQVEsR0FBR0EsUUFBUSxJQUFJSCxTQUF2QjtBQUNBLFNBQU9FLENBQUMsQ0FBQ3BGLE9BQUYsQ0FBVSxJQUFJdUYsTUFBSixDQUFXRixRQUFYLEVBQXFCLEdBQXJCLENBQVYsRUFBcUMsRUFBckMsQ0FBUDtBQUNEOztBQUNEekgsT0FBTyxDQUFDMEgsV0FBUixHQUFzQkEsV0FBdEI7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFNBQVNFLGlCQUFULENBQTJCbkcsS0FBM0IsRUFBa0M7QUFDaEMsTUFBSSxDQUFDbEMsQ0FBQyxDQUFDNEIsYUFBRixDQUFnQk0sS0FBaEIsQ0FBTCxFQUE2QixPQUFPQSxLQUFQO0FBQzdCLFFBQU1vRyxZQUFZLEdBQUcsRUFBckI7O0FBRUEsV0FBU0MsYUFBVCxDQUF1QnhHLEdBQXZCLEVBQTRCeUcsT0FBNUIsRUFBcUM7QUFDbkNDLElBQUFBLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZM0csR0FBWixFQUFpQmlELE9BQWpCLENBQXlCN0MsR0FBRyxJQUFJO0FBQzlCLFlBQU13RyxjQUFjLEdBQUdILE9BQU8sR0FBSSxHQUFFQSxPQUFRLElBQUdyRyxHQUFJLEVBQXJCLEdBQXlCQSxHQUF2RDs7QUFDQSxVQUFJLE9BQU9KLEdBQUcsQ0FBQ0ksR0FBRCxDQUFWLEtBQW9CLFFBQXBCLElBQWdDSixHQUFHLENBQUNJLEdBQUQsQ0FBSCxLQUFhLElBQWpELEVBQXVEO0FBQ3JEb0csUUFBQUEsYUFBYSxDQUFDeEcsR0FBRyxDQUFDSSxHQUFELENBQUosRUFBV3dHLGNBQVgsQ0FBYjtBQUNELE9BRkQsTUFFTztBQUNMTCxRQUFBQSxZQUFZLENBQUNLLGNBQUQsQ0FBWixHQUErQjNJLENBQUMsQ0FBQzRJLEdBQUYsQ0FBTTdHLEdBQU4sRUFBV0ksR0FBWCxDQUEvQjtBQUNEO0FBQ0YsS0FQRDtBQVFBLFdBQU9tRyxZQUFQO0FBQ0Q7O0FBRUQsU0FBT0MsYUFBYSxDQUFDckcsS0FBRCxFQUFRTCxTQUFSLENBQXBCO0FBQ0Q7O0FBQ0RwQixPQUFPLENBQUM0SCxpQkFBUixHQUE0QkEsaUJBQTVCO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFDTVEsZTs7OztBQUNOcEksT0FBTyxDQUFDb0ksZUFBUixHQUEwQkEsZUFBMUI7O0lBRU1DLEU7Ozs7O0FBQ0osY0FBWUMsRUFBWixFQUFnQkMsSUFBaEIsRUFBc0I7QUFBQTs7QUFBQTs7QUFDcEI7QUFDQSxVQUFLRCxFQUFMLEdBQVVBLEVBQVY7QUFDQSxVQUFLQyxJQUFMLEdBQVlBLElBQVo7QUFIb0I7QUFJckI7Ozs7NEJBQ087QUFDTixhQUFPLElBQUlGLEVBQUosQ0FBTyxLQUFLQyxFQUFaLEVBQWdCLEtBQUtDLElBQXJCLENBQVA7QUFDRDs7OztFQVJjSCxlOztBQVVqQnBJLE9BQU8sQ0FBQ3FJLEVBQVIsR0FBYUEsRUFBYjs7SUFFTUcsRzs7Ozs7QUFDSixlQUFZQyxHQUFaLEVBQWlCLEdBQUdGLElBQXBCLEVBQTBCO0FBQUE7O0FBQUE7O0FBQ3hCOztBQUNBLFFBQUlBLElBQUksQ0FBQ3RELE1BQUwsR0FBYyxDQUFsQixFQUFxQjtBQUNuQndELE1BQUFBLEdBQUcsR0FBR0YsSUFBTjtBQUNEOztBQUNELFdBQUtFLEdBQUwsR0FBV0EsR0FBWDtBQUx3QjtBQU16Qjs7O0VBUGVMLGU7O0FBU2xCcEksT0FBTyxDQUFDd0ksR0FBUixHQUFjQSxHQUFkOztJQUVNRSxJOzs7OztBQUNKLGdCQUFZOUgsR0FBWixFQUFpQkMsSUFBakIsRUFBdUI4SCxJQUF2QixFQUE2QjtBQUFBOztBQUFBOztBQUMzQjtBQUNBLFdBQUsvSCxHQUFMLEdBQVdBLEdBQVg7QUFDQSxXQUFLQyxJQUFMLEdBQVksQ0FBQ0EsSUFBSSxJQUFJLEVBQVQsRUFBYXNCLElBQWIsRUFBWjtBQUNBLFdBQUt3RyxJQUFMLEdBQVlBLElBQUksSUFBSSxLQUFwQjtBQUoyQjtBQUs1Qjs7O0VBTmdCUCxlOztBQVFuQnBJLE9BQU8sQ0FBQzBJLElBQVIsR0FBZUEsSUFBZjs7SUFFTUUsTzs7Ozs7QUFDSixtQkFBWWhJLEdBQVosRUFBaUI7QUFBQTs7QUFBQTs7QUFDZjtBQUNBLFdBQUtBLEdBQUwsR0FBV0EsR0FBWDtBQUZlO0FBR2hCOzs7RUFKbUJ3SCxlOztBQU10QnBJLE9BQU8sQ0FBQzRJLE9BQVIsR0FBa0JBLE9BQWxCOztJQUVNQyxJOzs7OztBQUNKLGdCQUFZQyxnQkFBWixFQUE4QnJILEtBQTlCLEVBQXFDO0FBQUE7O0FBQUE7O0FBQ25DOztBQUNBLFFBQUlsQyxDQUFDLENBQUN3SixRQUFGLENBQVdELGdCQUFYLENBQUosRUFBa0M7QUFDaEMsYUFBS0UsVUFBTCxHQUFrQkYsZ0JBQWxCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsYUFBS0csSUFBTCxHQUFZSCxnQkFBWjs7QUFDQSxVQUFJckgsS0FBSixFQUFXO0FBQ1QsZUFBS0EsS0FBTCxHQUFhQSxLQUFiO0FBQ0Q7QUFDRjs7QUFUa0M7QUFVcEM7OztFQVhnQjJHLGU7O0FBYW5CcEksT0FBTyxDQUFDNkksSUFBUixHQUFlQSxJQUFmOztJQUVNeEQsSzs7Ozs7QUFDSixpQkFBWWIsU0FBWixFQUF1QjBFLFVBQXZCLEVBQW1DQyxLQUFuQyxFQUEwQztBQUFBOztBQUFBOztBQUN4Qzs7QUFDQSxRQUFJQSxLQUFLLEtBQUsvSCxTQUFkLEVBQXlCO0FBQ3ZCK0gsTUFBQUEsS0FBSyxHQUFHRCxVQUFSO0FBQ0FBLE1BQUFBLFVBQVUsR0FBRyxHQUFiO0FBQ0Q7O0FBRUQsV0FBSzFFLFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0EsV0FBSzBFLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0EsV0FBS0MsS0FBTCxHQUFhQSxLQUFiO0FBVHdDO0FBVXpDOzs7RUFYaUJmLGU7O0FBYXBCcEksT0FBTyxDQUFDcUYsS0FBUixHQUFnQkEsS0FBaEIsQyxDQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFNBQVMrRCxZQUFULENBQXNCOUgsR0FBdEIsRUFBMkI7QUFDekIsU0FBTzBHLE1BQU0sQ0FBQ3FCLHFCQUFQLENBQTZCL0gsR0FBN0IsRUFBa0NxQyxNQUFsQyxDQUF5QzZELENBQUMsSUFBSTVILFlBQVksQ0FBQ2tFLEdBQWIsQ0FBaUIwRCxDQUFqQixDQUE5QyxDQUFQO0FBQ0Q7O0FBQ0R4SCxPQUFPLENBQUNvSixZQUFSLEdBQXVCQSxZQUF2QjtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFNBQVM5RSxjQUFULENBQXdCaEQsR0FBeEIsRUFBNkI7QUFDM0IsU0FBTzhILFlBQVksQ0FBQzlILEdBQUQsQ0FBWixDQUFrQk8sTUFBbEIsQ0FBeUJtRyxNQUFNLENBQUNDLElBQVAsQ0FBWTNHLEdBQVosQ0FBekIsQ0FBUDtBQUNEOztBQUNEdEIsT0FBTyxDQUFDc0UsY0FBUixHQUF5QkEsY0FBekI7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxTQUFTZ0YsY0FBVCxDQUF3QmhJLEdBQXhCLEVBQTZCO0FBQzNCLFNBQU9LLEtBQUssQ0FBQ0MsT0FBTixDQUFjTixHQUFkLElBQXFCQSxHQUFHLENBQUMyRCxNQUF6QixHQUFrQ1gsY0FBYyxDQUFDaEQsR0FBRCxDQUFkLENBQW9CMkQsTUFBN0Q7QUFDRDs7QUFDRGpGLE9BQU8sQ0FBQ3NKLGNBQVIsR0FBeUJBLGNBQXpCO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsU0FBU0MsWUFBVCxDQUFzQmpJLEdBQXRCLEVBQTJCO0FBQ3pCLFNBQU8sQ0FBQyxDQUFDQSxHQUFGLElBQVMvQixDQUFDLENBQUNpSyxPQUFGLENBQVVsSSxHQUFWLENBQVQsSUFBMkI4SCxZQUFZLENBQUM5SCxHQUFELENBQVosQ0FBa0IyRCxNQUFsQixLQUE2QixDQUEvRDtBQUNEOztBQUNEakYsT0FBTyxDQUFDdUosWUFBUixHQUF1QkEsWUFBdkI7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFNBQVNFLGdCQUFULENBQTBCQyxTQUExQixFQUFxQ0MsVUFBckMsRUFBaUQ7QUFDL0MsU0FBUSxRQUFPRCxTQUFVLElBQUdDLFVBQVcsRUFBdkM7QUFDRDs7QUFDRDNKLE9BQU8sQ0FBQ3lKLGdCQUFSLEdBQTJCQSxnQkFBM0I7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxTQUFTRyxrQkFBVCxDQUE0QnRJLEdBQTVCLEVBQWlDO0FBQy9CLFFBQU11SSxNQUFNLEdBQUcsSUFBSTdCLE1BQUosRUFBZjtBQUNBQSxFQUFBQSxNQUFNLENBQUNDLElBQVAsQ0FBWTNHLEdBQVosRUFBaUJpRCxPQUFqQixDQUF5QjdDLEdBQUcsSUFBSTtBQUM5Qm1JLElBQUFBLE1BQU0sQ0FBQ3JKLFFBQVEsQ0FBQ2tCLEdBQUQsQ0FBVCxDQUFOLEdBQXdCSixHQUFHLENBQUNJLEdBQUQsQ0FBM0I7QUFDRCxHQUZEO0FBR0EsU0FBT21JLE1BQVA7QUFDRDs7QUFDRDdKLE9BQU8sQ0FBQzRKLGtCQUFSLEdBQTZCQSxrQkFBN0I7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxTQUFTRSxRQUFULENBQWtCQyxNQUFsQixFQUEwQixHQUFHQyxPQUE3QixFQUFzQztBQUNwQ0QsRUFBQUEsTUFBTSxHQUFHL0IsTUFBTSxDQUFDK0IsTUFBRCxDQUFmO0FBRUFDLEVBQUFBLE9BQU8sQ0FBQ3pGLE9BQVIsQ0FBZ0IwRixNQUFNLElBQUk7QUFDeEIsUUFBSUEsTUFBSixFQUFZO0FBQ1ZBLE1BQUFBLE1BQU0sR0FBR2pDLE1BQU0sQ0FBQ2lDLE1BQUQsQ0FBZjtBQUVBM0YsTUFBQUEsY0FBYyxDQUFDMkYsTUFBRCxDQUFkLENBQXVCMUYsT0FBdkIsQ0FBK0I3QyxHQUFHLElBQUk7QUFDcEMsY0FBTUQsS0FBSyxHQUFHc0ksTUFBTSxDQUFDckksR0FBRCxDQUFwQjs7QUFDQSxZQUNFRCxLQUFLLEtBQUtMLFNBQVYsSUFDRTdCLENBQUMsQ0FBQzJLLEVBQUYsQ0FBS3pJLEtBQUwsRUFBWXVHLE1BQU0sQ0FBQ21DLFNBQVAsQ0FBaUJ6SSxHQUFqQixDQUFaLEtBQ0EsQ0FBQ3NHLE1BQU0sQ0FBQ21DLFNBQVAsQ0FBaUJDLGNBQWpCLENBQWdDQyxJQUFoQyxDQUFxQ04sTUFBckMsRUFBNkNySSxHQUE3QyxDQUhMLEVBS0U7QUFDQXFJLFVBQUFBLE1BQU0sQ0FBQ3JJLEdBQUQsQ0FBTixHQUFjdUksTUFBTSxDQUFDdkksR0FBRCxDQUFwQjtBQUNEO0FBQ0YsT0FWRDtBQVdEO0FBQ0YsR0FoQkQ7QUFrQkEsU0FBT3FJLE1BQVA7QUFDRDs7QUFDRC9KLE9BQU8sQ0FBQzhKLFFBQVIsR0FBbUJBLFFBQW5CO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsU0FBU1EsU0FBVCxDQUFtQnZJLEtBQW5CLEVBQTBCMkgsU0FBMUIsRUFBcUM7QUFDbkMsTUFBSUEsU0FBUyxDQUFDQSxTQUFkLEVBQXlCQSxTQUFTLEdBQUdBLFNBQVMsQ0FBQ0EsU0FBdEI7O0FBRXpCLE1BQUksQ0FBQzFCLE1BQU0sQ0FBQ21DLFNBQVAsQ0FBaUJDLGNBQWpCLENBQWdDQyxJQUFoQyxDQUFxQ3RJLEtBQXJDLEVBQTRDLE1BQTVDLENBQUwsRUFBMEQ7QUFDeEQsVUFBTWdELE1BQU0sR0FBR2hELEtBQUssQ0FBQ2dELE1BQU4sQ0FBYWYsR0FBYixDQUNiRyxLQUFLLElBQUksT0FBT0EsS0FBUCxLQUFpQixRQUFqQixHQUE0QkEsS0FBNUIsR0FBb0NBLEtBQUssQ0FBQ29HLElBQU4sSUFBY3BHLEtBQUssQ0FBQ0ssU0FEcEQsQ0FBZjtBQUdBekMsSUFBQUEsS0FBSyxDQUFDd0ksSUFBTixHQUFhN0osVUFBVSxDQUFFLEdBQUVnSixTQUFVLElBQUczRSxNQUFNLENBQUN5RixJQUFQLENBQVksR0FBWixDQUFpQixFQUFsQyxDQUF2QjtBQUNEOztBQUVELFNBQU96SSxLQUFQO0FBQ0Q7O0FBQ0QvQixPQUFPLENBQUNzSyxTQUFSLEdBQW9CQSxTQUFwQjtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFNBQVNHLFVBQVQsQ0FBb0JDLElBQXBCLEVBQTBCQyxJQUExQixFQUFnQztBQUM5QixTQUFPRCxJQUFJLENBQUN2RixJQUFMLENBQVV2QixDQUFDLElBQUkrRyxJQUFJLENBQUNsRSxRQUFMLENBQWM3QyxDQUFkLENBQWYsQ0FBUDtBQUNEOztBQUNENUQsT0FBTyxDQUFDeUssVUFBUixHQUFxQkEsVUFBckIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IERhdGFUeXBlcyA9IHJlcXVpcmUoJy4vZGF0YS10eXBlcycpO1xuY29uc3QgU3FsU3RyaW5nID0gcmVxdWlyZSgnLi9zcWwtc3RyaW5nJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCB1dWlkdjEgPSByZXF1aXJlKCd1dWlkL3YxJyk7XG5jb25zdCB1dWlkdjQgPSByZXF1aXJlKCd1dWlkL3Y0Jyk7XG5jb25zdCBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJyk7XG5jb25zdCBvcGVyYXRvcnMgPSByZXF1aXJlKCcuL29wZXJhdG9ycycpO1xuY29uc3Qgb3BlcmF0b3JzU2V0ID0gbmV3IFNldChfLnZhbHVlcyhvcGVyYXRvcnMpKTtcblxubGV0IGluZmxlY3Rpb24gPSByZXF1aXJlKCdpbmZsZWN0aW9uJyk7XG5cbmV4cG9ydHMuY2xhc3NUb0ludm9rYWJsZSA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NUb0ludm9rYWJsZScpLmNsYXNzVG9JbnZva2FibGU7XG5cbmV4cG9ydHMuUHJvbWlzZSA9IFByb21pc2U7XG5cbmZ1bmN0aW9uIHVzZUluZmxlY3Rpb24oX2luZmxlY3Rpb24pIHtcbiAgaW5mbGVjdGlvbiA9IF9pbmZsZWN0aW9uO1xufVxuZXhwb3J0cy51c2VJbmZsZWN0aW9uID0gdXNlSW5mbGVjdGlvbjtcblxuZnVuY3Rpb24gY2FtZWxpemVJZihzdHIsIGNvbmRpdGlvbikge1xuICBsZXQgcmVzdWx0ID0gc3RyO1xuXG4gIGlmIChjb25kaXRpb24pIHtcbiAgICByZXN1bHQgPSBjYW1lbGl6ZShzdHIpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmV4cG9ydHMuY2FtZWxpemVJZiA9IGNhbWVsaXplSWY7XG5cbmZ1bmN0aW9uIHVuZGVyc2NvcmVkSWYoc3RyLCBjb25kaXRpb24pIHtcbiAgbGV0IHJlc3VsdCA9IHN0cjtcblxuICBpZiAoY29uZGl0aW9uKSB7XG4gICAgcmVzdWx0ID0gdW5kZXJzY29yZShzdHIpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmV4cG9ydHMudW5kZXJzY29yZWRJZiA9IHVuZGVyc2NvcmVkSWY7XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKHZhbCkge1xuICBjb25zdCB0eXBlID0gdHlwZW9mIHZhbDtcbiAgcmV0dXJuIHR5cGUgPT09ICdzdHJpbmcnIHx8IHR5cGUgPT09ICdudW1iZXInIHx8IHR5cGUgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuLy8gU2FtZSBjb25jZXB0IGFzIF8ubWVyZ2UsIGJ1dCBkb24ndCBvdmVyd3JpdGUgcHJvcGVydGllcyB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFzc2lnbmVkXG5mdW5jdGlvbiBtZXJnZURlZmF1bHRzKGEsIGIpIHtcbiAgcmV0dXJuIF8ubWVyZ2VXaXRoKGEsIGIsIG9iamVjdFZhbHVlID0+IHtcbiAgICAvLyBJZiBpdCdzIGFuIG9iamVjdCwgbGV0IF8gaGFuZGxlIGl0IHRoaXMgdGltZSwgd2Ugd2lsbCBiZSBjYWxsZWQgYWdhaW4gZm9yIGVhY2ggcHJvcGVydHlcbiAgICBpZiAoIV8uaXNQbGFpbk9iamVjdChvYmplY3RWYWx1ZSkgJiYgb2JqZWN0VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG9iamVjdFZhbHVlO1xuICAgIH1cbiAgfSk7XG59XG5leHBvcnRzLm1lcmdlRGVmYXVsdHMgPSBtZXJnZURlZmF1bHRzO1xuXG4vLyBBbiBhbHRlcm5hdGl2ZSB0byBfLm1lcmdlLCB3aGljaCBkb2Vzbid0IGNsb25lIGl0cyBhcmd1bWVudHNcbi8vIENsb25pbmcgaXMgYSBiYWQgaWRlYSBiZWNhdXNlIG9wdGlvbnMgYXJndW1lbnRzIG1heSBjb250YWluIHJlZmVyZW5jZXMgdG8gc2VxdWVsaXplXG4vLyBtb2RlbHMgLSB3aGljaCBhZ2FpbiByZWZlcmVuY2UgZGF0YWJhc2UgbGlicyB3aGljaCBkb24ndCBsaWtlIHRvIGJlIGNsb25lZCAoaW4gcGFydGljdWxhciBwZy1uYXRpdmUpXG5mdW5jdGlvbiBtZXJnZSgpIHtcbiAgY29uc3QgcmVzdWx0ID0ge307XG5cbiAgZm9yIChjb25zdCBvYmogb2YgYXJndW1lbnRzKSB7XG4gICAgXy5mb3JPd24ob2JqLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKCFyZXN1bHRba2V5XSkge1xuICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoXy5pc1BsYWluT2JqZWN0KHZhbHVlKSAmJiBfLmlzUGxhaW5PYmplY3QocmVzdWx0W2tleV0pKSB7XG4gICAgICAgICAgcmVzdWx0W2tleV0gPSBtZXJnZShyZXN1bHRba2V5XSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIEFycmF5LmlzQXJyYXkocmVzdWx0W2tleV0pKSB7XG4gICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZS5jb25jYXQocmVzdWx0W2tleV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5leHBvcnRzLm1lcmdlID0gbWVyZ2U7XG5cbmZ1bmN0aW9uIHNwbGljZVN0cihzdHIsIGluZGV4LCBjb3VudCwgYWRkKSB7XG4gIHJldHVybiBzdHIuc2xpY2UoMCwgaW5kZXgpICsgYWRkICsgc3RyLnNsaWNlKGluZGV4ICsgY291bnQpO1xufVxuZXhwb3J0cy5zcGxpY2VTdHIgPSBzcGxpY2VTdHI7XG5cbmZ1bmN0aW9uIGNhbWVsaXplKHN0cikge1xuICByZXR1cm4gc3RyLnRyaW0oKS5yZXBsYWNlKC9bLV9cXHNdKyguKT8vZywgKG1hdGNoLCBjKSA9PiBjLnRvVXBwZXJDYXNlKCkpO1xufVxuZXhwb3J0cy5jYW1lbGl6ZSA9IGNhbWVsaXplO1xuXG5mdW5jdGlvbiB1bmRlcnNjb3JlKHN0cikge1xuICByZXR1cm4gaW5mbGVjdGlvbi51bmRlcnNjb3JlKHN0cik7XG59XG5leHBvcnRzLnVuZGVyc2NvcmUgPSB1bmRlcnNjb3JlO1xuXG5mdW5jdGlvbiBzaW5ndWxhcml6ZShzdHIpIHtcbiAgcmV0dXJuIGluZmxlY3Rpb24uc2luZ3VsYXJpemUoc3RyKTtcbn1cbmV4cG9ydHMuc2luZ3VsYXJpemUgPSBzaW5ndWxhcml6ZTtcblxuZnVuY3Rpb24gcGx1cmFsaXplKHN0cikge1xuICByZXR1cm4gaW5mbGVjdGlvbi5wbHVyYWxpemUoc3RyKTtcbn1cbmV4cG9ydHMucGx1cmFsaXplID0gcGx1cmFsaXplO1xuXG5mdW5jdGlvbiBmb3JtYXQoYXJyLCBkaWFsZWN0KSB7XG4gIGNvbnN0IHRpbWVab25lID0gbnVsbDtcbiAgLy8gTWFrZSBhIGNsb25lIG9mIHRoZSBhcnJheSBiZWFjdXNlIGZvcm1hdCBtb2RpZmllcyB0aGUgcGFzc2VkIGFyZ3NcbiAgcmV0dXJuIFNxbFN0cmluZy5mb3JtYXQoYXJyWzBdLCBhcnIuc2xpY2UoMSksIHRpbWVab25lLCBkaWFsZWN0KTtcbn1cbmV4cG9ydHMuZm9ybWF0ID0gZm9ybWF0O1xuXG5mdW5jdGlvbiBmb3JtYXROYW1lZFBhcmFtZXRlcnMoc3FsLCBwYXJhbWV0ZXJzLCBkaWFsZWN0KSB7XG4gIGNvbnN0IHRpbWVab25lID0gbnVsbDtcbiAgcmV0dXJuIFNxbFN0cmluZy5mb3JtYXROYW1lZFBhcmFtZXRlcnMoc3FsLCBwYXJhbWV0ZXJzLCB0aW1lWm9uZSwgZGlhbGVjdCk7XG59XG5leHBvcnRzLmZvcm1hdE5hbWVkUGFyYW1ldGVycyA9IGZvcm1hdE5hbWVkUGFyYW1ldGVycztcblxuZnVuY3Rpb24gY2xvbmVEZWVwKG9iaiwgb25seVBsYWluKSB7XG4gIG9iaiA9IG9iaiB8fCB7fTtcbiAgcmV0dXJuIF8uY2xvbmVEZWVwV2l0aChvYmosIGVsZW0gPT4ge1xuICAgIC8vIERvIG5vdCB0cnkgdG8gY3VzdG9taXplIGNsb25pbmcgb2YgYXJyYXlzIG9yIFBPSk9zXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZWxlbSkgfHwgXy5pc1BsYWluT2JqZWN0KGVsZW0pKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIElmIHdlIHNwZWNpZmllZCB0byBjbG9uZSBvbmx5IHBsYWluIG9iamVjdHMgJiBhcnJheXMsIHdlIGlnbm9yZSBldmVyeWhpbmcgZWxzZVxuICAgIC8vIEluIGFueSBjYXNlLCBkb24ndCBjbG9uZSBzdHVmZiB0aGF0J3MgYW4gb2JqZWN0LCBidXQgbm90IGEgcGxhaW4gb25lIC0gZnggZXhhbXBsZSBzZXF1ZWxpemUgbW9kZWxzIGFuZCBpbnN0YW5jZXNcbiAgICBpZiAob25seVBsYWluIHx8IHR5cGVvZiBlbGVtID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIGVsZW07XG4gICAgfVxuXG4gICAgLy8gUHJlc2VydmUgc3BlY2lhbCBkYXRhLXR5cGVzIGxpa2UgYGZuYCBhY3Jvc3MgY2xvbmVzLiBfLmdldCgpIGlzIHVzZWQgZm9yIGNoZWNraW5nIHVwIHRoZSBwcm90b3R5cGUgY2hhaW5cbiAgICBpZiAoZWxlbSAmJiB0eXBlb2YgZWxlbS5jbG9uZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIGVsZW0uY2xvbmUoKTtcbiAgICB9XG4gIH0pO1xufVxuZXhwb3J0cy5jbG9uZURlZXAgPSBjbG9uZURlZXA7XG5cbi8qIEV4cGFuZCBhbmQgbm9ybWFsaXplIGZpbmRlciBvcHRpb25zICovXG5mdW5jdGlvbiBtYXBGaW5kZXJPcHRpb25zKG9wdGlvbnMsIE1vZGVsKSB7XG4gIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLmF0dHJpYnV0ZXMpKSB7XG4gICAgb3B0aW9ucy5hdHRyaWJ1dGVzID0gTW9kZWwuX2luamVjdERlcGVuZGVudFZpcnR1YWxBdHRyaWJ1dGVzKG9wdGlvbnMuYXR0cmlidXRlcyk7XG4gICAgb3B0aW9ucy5hdHRyaWJ1dGVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzLmZpbHRlcih2ID0+ICFNb2RlbC5fdmlydHVhbEF0dHJpYnV0ZXMuaGFzKHYpKTtcbiAgfVxuXG4gIG1hcE9wdGlvbkZpZWxkTmFtZXMob3B0aW9ucywgTW9kZWwpO1xuXG4gIHJldHVybiBvcHRpb25zO1xufVxuZXhwb3J0cy5tYXBGaW5kZXJPcHRpb25zID0gbWFwRmluZGVyT3B0aW9ucztcblxuLyogVXNlZCB0byBtYXAgZmllbGQgbmFtZXMgaW4gYXR0cmlidXRlcyBhbmQgd2hlcmUgY29uZGl0aW9ucyAqL1xuZnVuY3Rpb24gbWFwT3B0aW9uRmllbGROYW1lcyhvcHRpb25zLCBNb2RlbCkge1xuICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmF0dHJpYnV0ZXMpKSB7XG4gICAgb3B0aW9ucy5hdHRyaWJ1dGVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzLm1hcChhdHRyID0+IHtcbiAgICAgIC8vIE9iamVjdCBsb29rdXBzIHdpbGwgZm9yY2UgYW55IHZhcmlhYmxlIHRvIHN0cmluZ3MsIHdlIGRvbid0IHdhbnQgdGhhdCBmb3Igc3BlY2lhbCBvYmplY3RzIGV0Y1xuICAgICAgaWYgKHR5cGVvZiBhdHRyICE9PSAnc3RyaW5nJykgcmV0dXJuIGF0dHI7XG4gICAgICAvLyBNYXAgYXR0cmlidXRlcyB0byBhbGlhc2VkIHN5bnRheCBhdHRyaWJ1dGVzXG4gICAgICBpZiAoTW9kZWwucmF3QXR0cmlidXRlc1thdHRyXSAmJiBhdHRyICE9PSBNb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkKSB7XG4gICAgICAgIHJldHVybiBbTW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCwgYXR0cl07XG4gICAgICB9XG4gICAgICByZXR1cm4gYXR0cjtcbiAgICB9KTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLndoZXJlICYmIF8uaXNQbGFpbk9iamVjdChvcHRpb25zLndoZXJlKSkge1xuICAgIG9wdGlvbnMud2hlcmUgPSBtYXBXaGVyZUZpZWxkTmFtZXMob3B0aW9ucy53aGVyZSwgTW9kZWwpO1xuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnM7XG59XG5leHBvcnRzLm1hcE9wdGlvbkZpZWxkTmFtZXMgPSBtYXBPcHRpb25GaWVsZE5hbWVzO1xuXG5mdW5jdGlvbiBtYXBXaGVyZUZpZWxkTmFtZXMoYXR0cmlidXRlcywgTW9kZWwpIHtcbiAgaWYgKGF0dHJpYnV0ZXMpIHtcbiAgICBnZXRDb21wbGV4S2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKGF0dHJpYnV0ZSA9PiB7XG4gICAgICBjb25zdCByYXdBdHRyaWJ1dGUgPSBNb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJpYnV0ZV07XG5cbiAgICAgIGlmIChyYXdBdHRyaWJ1dGUgJiYgcmF3QXR0cmlidXRlLmZpZWxkICE9PSByYXdBdHRyaWJ1dGUuZmllbGROYW1lKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNbcmF3QXR0cmlidXRlLmZpZWxkXSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlXTtcbiAgICAgICAgZGVsZXRlIGF0dHJpYnV0ZXNbYXR0cmlidXRlXTtcbiAgICAgIH1cblxuICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdChhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0pXG4gICAgICAgICYmICEocmF3QXR0cmlidXRlICYmIChcbiAgICAgICAgICByYXdBdHRyaWJ1dGUudHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5IU1RPUkVcbiAgICAgICAgICB8fCByYXdBdHRyaWJ1dGUudHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5KU09OKSkpIHsgLy8gUHJldmVudCByZW5hbWluZyBvZiBIU1RPUkUgJiBKU09OIGZpZWxkc1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gPSBtYXBPcHRpb25GaWVsZE5hbWVzKHtcbiAgICAgICAgICB3aGVyZTogYXR0cmlidXRlc1thdHRyaWJ1dGVdXG4gICAgICAgIH0sIE1vZGVsKS53aGVyZTtcbiAgICAgIH1cblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXR0cmlidXRlc1thdHRyaWJ1dGVdKSkge1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0uZm9yRWFjaCgod2hlcmUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdCh3aGVyZSkpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXNbYXR0cmlidXRlXVtpbmRleF0gPSBtYXBXaGVyZUZpZWxkTmFtZXMod2hlcmUsIE1vZGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlcztcbn1cbmV4cG9ydHMubWFwV2hlcmVGaWVsZE5hbWVzID0gbWFwV2hlcmVGaWVsZE5hbWVzO1xuXG4vKiBVc2VkIHRvIG1hcCBmaWVsZCBuYW1lcyBpbiB2YWx1ZXMgKi9cbmZ1bmN0aW9uIG1hcFZhbHVlRmllbGROYW1lcyhkYXRhVmFsdWVzLCBmaWVsZHMsIE1vZGVsKSB7XG4gIGNvbnN0IHZhbHVlcyA9IHt9O1xuXG4gIGZvciAoY29uc3QgYXR0ciBvZiBmaWVsZHMpIHtcbiAgICBpZiAoZGF0YVZhbHVlc1thdHRyXSAhPT0gdW5kZWZpbmVkICYmICFNb2RlbC5fdmlydHVhbEF0dHJpYnV0ZXMuaGFzKGF0dHIpKSB7XG4gICAgICAvLyBGaWVsZCBuYW1lIG1hcHBpbmdcbiAgICAgIGlmIChNb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdICYmIE1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGQgJiYgTW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCAhPT0gYXR0cikge1xuICAgICAgICB2YWx1ZXNbTW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZF0gPSBkYXRhVmFsdWVzW2F0dHJdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWVzW2F0dHJdID0gZGF0YVZhbHVlc1thdHRyXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdmFsdWVzO1xufVxuZXhwb3J0cy5tYXBWYWx1ZUZpZWxkTmFtZXMgPSBtYXBWYWx1ZUZpZWxkTmFtZXM7XG5cbmZ1bmN0aW9uIGlzQ29sU3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlWzBdID09PSAnJCcgJiYgdmFsdWVbdmFsdWUubGVuZ3RoIC0gMV0gPT09ICckJztcbn1cbmV4cG9ydHMuaXNDb2xTdHJpbmcgPSBpc0NvbFN0cmluZztcblxuZnVuY3Rpb24gY2FuVHJlYXRBcnJheUFzQW5kKGFycikge1xuICByZXR1cm4gYXJyLnNvbWUoYXJnID0+IF8uaXNQbGFpbk9iamVjdChhcmcpIHx8IGFyZyBpbnN0YW5jZW9mIFdoZXJlKTtcbn1cbmV4cG9ydHMuY2FuVHJlYXRBcnJheUFzQW5kID0gY2FuVHJlYXRBcnJheUFzQW5kO1xuXG5mdW5jdGlvbiBjb21iaW5lVGFibGVOYW1lcyh0YWJsZU5hbWUxLCB0YWJsZU5hbWUyKSB7XG4gIHJldHVybiB0YWJsZU5hbWUxLnRvTG93ZXJDYXNlKCkgPCB0YWJsZU5hbWUyLnRvTG93ZXJDYXNlKCkgPyB0YWJsZU5hbWUxICsgdGFibGVOYW1lMiA6IHRhYmxlTmFtZTIgKyB0YWJsZU5hbWUxO1xufVxuZXhwb3J0cy5jb21iaW5lVGFibGVOYW1lcyA9IGNvbWJpbmVUYWJsZU5hbWVzO1xuXG5mdW5jdGlvbiB0b0RlZmF1bHRWYWx1ZSh2YWx1ZSwgZGlhbGVjdCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgdG1wID0gdmFsdWUoKTtcbiAgICBpZiAodG1wIGluc3RhbmNlb2YgRGF0YVR5cGVzLkFCU1RSQUNUKSB7XG4gICAgICByZXR1cm4gdG1wLnRvU3FsKCk7XG4gICAgfVxuICAgIHJldHVybiB0bXA7XG4gIH1cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YVR5cGVzLlVVSURWMSkge1xuICAgIHJldHVybiB1dWlkdjEoKTtcbiAgfVxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuVVVJRFY0KSB7XG4gICAgcmV0dXJuIHV1aWR2NCgpO1xuICB9XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5OT1cpIHtcbiAgICByZXR1cm4gbm93KGRpYWxlY3QpO1xuICB9XG4gIGlmIChfLmlzUGxhaW5PYmplY3QodmFsdWUpIHx8IEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIF8uY2xvbmUodmFsdWUpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cbmV4cG9ydHMudG9EZWZhdWx0VmFsdWUgPSB0b0RlZmF1bHRWYWx1ZTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgdGhlIGRlZmF1bHQgdmFsdWUgcHJvdmlkZWQgZXhpc3RzIGFuZCBjYW4gYmUgZGVzY3JpYmVkXG4gKiBpbiBhIGRiIHNjaGVtYSB1c2luZyB0aGUgREVGQVVMVCBkaXJlY3RpdmUuXG4gKlxuICogQHBhcmFtICB7Kn0gdmFsdWUgQW55IGRlZmF1bHQgdmFsdWUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0geWVzIC8gbm8uXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBkZWZhdWx0VmFsdWVTY2hlbWFibGUodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gVE9ETyB0aGlzIHdpbGwgYmUgc2NoZW1hYmxlIHdoZW4gYWxsIHN1cHBvcnRlZCBkYlxuICAvLyBoYXZlIGJlZW4gbm9ybWFsaXplZCBmb3IgdGhpcyBjYXNlXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5OT1cpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YVR5cGVzLlVVSURWMSB8fCB2YWx1ZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5VVUlEVjQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuZGVmYXVsdFZhbHVlU2NoZW1hYmxlID0gZGVmYXVsdFZhbHVlU2NoZW1hYmxlO1xuXG5mdW5jdGlvbiByZW1vdmVOdWxsVmFsdWVzRnJvbUhhc2goaGFzaCwgb21pdE51bGwsIG9wdGlvbnMpIHtcbiAgbGV0IHJlc3VsdCA9IGhhc2g7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuYWxsb3dOdWxsID0gb3B0aW9ucy5hbGxvd051bGwgfHwgW107XG5cbiAgaWYgKG9taXROdWxsKSB7XG4gICAgY29uc3QgX2hhc2ggPSB7fTtcblxuICAgIF8uZm9ySW4oaGFzaCwgKHZhbCwga2V5KSA9PiB7XG4gICAgICBpZiAob3B0aW9ucy5hbGxvd051bGwuaW5jbHVkZXMoa2V5KSB8fCBrZXkuZW5kc1dpdGgoJ0lkJykgfHwgdmFsICE9PSBudWxsICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIF9oYXNoW2tleV0gPSB2YWw7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXN1bHQgPSBfaGFzaDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5leHBvcnRzLnJlbW92ZU51bGxWYWx1ZXNGcm9tSGFzaCA9IHJlbW92ZU51bGxWYWx1ZXNGcm9tSGFzaDtcblxuZnVuY3Rpb24gc3RhY2soKSB7XG4gIGNvbnN0IG9yaWcgPSBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZTtcbiAgRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSAoXywgc3RhY2spID0+IHN0YWNrO1xuICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoZXJyLCBzdGFjayk7XG4gIGNvbnN0IGVyclN0YWNrID0gZXJyLnN0YWNrO1xuICBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IG9yaWc7XG4gIHJldHVybiBlcnJTdGFjaztcbn1cbmV4cG9ydHMuc3RhY2sgPSBzdGFjaztcblxuY29uc3QgZGlhbGVjdHMgPSBuZXcgU2V0KFsnbWFyaWFkYicsICdteXNxbCcsICdwb3N0Z3JlcycsICdzcWxpdGUnLCAnbXNzcWwnXSk7XG5cbmZ1bmN0aW9uIG5vdyhkaWFsZWN0KSB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xuICBpZiAoIWRpYWxlY3RzLmhhcyhkaWFsZWN0KSkge1xuICAgIGQuc2V0TWlsbGlzZWNvbmRzKDApO1xuICB9XG4gIHJldHVybiBkO1xufVxuZXhwb3J0cy5ub3cgPSBub3c7XG5cbi8vIE5vdGU6IFVzZSB0aGUgYHF1b3RlSWRlbnRpZmllcigpYCBhbmQgYGVzY2FwZSgpYCBtZXRob2RzIG9uIHRoZVxuLy8gYFF1ZXJ5SW50ZXJmYWNlYCBpbnN0ZWFkIGZvciBtb3JlIHBvcnRhYmxlIGNvZGUuXG5cbmNvbnN0IFRJQ0tfQ0hBUiA9ICdgJztcbmV4cG9ydHMuVElDS19DSEFSID0gVElDS19DSEFSO1xuXG5mdW5jdGlvbiBhZGRUaWNrcyhzLCB0aWNrQ2hhcikge1xuICB0aWNrQ2hhciA9IHRpY2tDaGFyIHx8IFRJQ0tfQ0hBUjtcbiAgcmV0dXJuIHRpY2tDaGFyICsgcmVtb3ZlVGlja3MocywgdGlja0NoYXIpICsgdGlja0NoYXI7XG59XG5leHBvcnRzLmFkZFRpY2tzID0gYWRkVGlja3M7XG5cbmZ1bmN0aW9uIHJlbW92ZVRpY2tzKHMsIHRpY2tDaGFyKSB7XG4gIHRpY2tDaGFyID0gdGlja0NoYXIgfHwgVElDS19DSEFSO1xuICByZXR1cm4gcy5yZXBsYWNlKG5ldyBSZWdFeHAodGlja0NoYXIsICdnJyksICcnKTtcbn1cbmV4cG9ydHMucmVtb3ZlVGlja3MgPSByZW1vdmVUaWNrcztcblxuLyoqXG4gKiBSZWNlaXZlcyBhIHRyZWUtbGlrZSBvYmplY3QgYW5kIHJldHVybnMgYSBwbGFpbiBvYmplY3Qgd2hpY2ggZGVwdGggaXMgMS5cbiAqXG4gKiAtIElucHV0OlxuICpcbiAqICB7XG4gKiAgICBuYW1lOiAnSm9obicsXG4gKiAgICBhZGRyZXNzOiB7XG4gKiAgICAgIHN0cmVldDogJ0Zha2UgU3QuIDEyMycsXG4gKiAgICAgIGNvb3JkaW5hdGVzOiB7XG4gKiAgICAgICAgbG9uZ2l0dWRlOiA1NS42Nzc5NjI3LFxuICogICAgICAgIGxhdGl0dWRlOiAxMi41OTY0MzEzXG4gKiAgICAgIH1cbiAqICAgIH1cbiAqICB9XG4gKlxuICogLSBPdXRwdXQ6XG4gKlxuICogIHtcbiAqICAgIG5hbWU6ICdKb2huJyxcbiAqICAgIGFkZHJlc3Muc3RyZWV0OiAnRmFrZSBTdC4gMTIzJyxcbiAqICAgIGFkZHJlc3MuY29vcmRpbmF0ZXMubGF0aXR1ZGU6IDU1LjY3Nzk2MjcsXG4gKiAgICBhZGRyZXNzLmNvb3JkaW5hdGVzLmxvbmdpdHVkZTogMTIuNTk2NDMxM1xuICogIH1cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgYW4gT2JqZWN0XG4gKiBAcmV0dXJucyB7T2JqZWN0fSBhIGZsYXR0ZW5lZCBvYmplY3RcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGZsYXR0ZW5PYmplY3REZWVwKHZhbHVlKSB7XG4gIGlmICghXy5pc1BsYWluT2JqZWN0KHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuICBjb25zdCBmbGF0dGVuZWRPYmogPSB7fTtcblxuICBmdW5jdGlvbiBmbGF0dGVuT2JqZWN0KG9iaiwgc3ViUGF0aCkge1xuICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgY29uc3QgcGF0aFRvUHJvcGVydHkgPSBzdWJQYXRoID8gYCR7c3ViUGF0aH0uJHtrZXl9YCA6IGtleTtcbiAgICAgIGlmICh0eXBlb2Ygb2JqW2tleV0gPT09ICdvYmplY3QnICYmIG9ialtrZXldICE9PSBudWxsKSB7XG4gICAgICAgIGZsYXR0ZW5PYmplY3Qob2JqW2tleV0sIHBhdGhUb1Byb3BlcnR5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZsYXR0ZW5lZE9ialtwYXRoVG9Qcm9wZXJ0eV0gPSBfLmdldChvYmosIGtleSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZsYXR0ZW5lZE9iajtcbiAgfVxuXG4gIHJldHVybiBmbGF0dGVuT2JqZWN0KHZhbHVlLCB1bmRlZmluZWQpO1xufVxuZXhwb3J0cy5mbGF0dGVuT2JqZWN0RGVlcCA9IGZsYXR0ZW5PYmplY3REZWVwO1xuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIGZvciByZXByZXNlbnRpbmcgU1FMIGZ1bmN0aW9ucywgYW5kIGNvbHVtbnMgdGhhdCBzaG91bGQgYmUgZXNjYXBlZC5cbiAqIFBsZWFzZSBkbyBub3QgdXNlIHRoZXNlIGZ1bmN0aW9ucyBkaXJlY3RseSwgdXNlIFNlcXVlbGl6ZS5mbiBhbmQgU2VxdWVsaXplLmNvbCBpbnN0ZWFkLlxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgU2VxdWVsaXplTWV0aG9kIHt9XG5leHBvcnRzLlNlcXVlbGl6ZU1ldGhvZCA9IFNlcXVlbGl6ZU1ldGhvZDtcblxuY2xhc3MgRm4gZXh0ZW5kcyBTZXF1ZWxpemVNZXRob2Qge1xuICBjb25zdHJ1Y3RvcihmbiwgYXJncykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5mbiA9IGZuO1xuICAgIHRoaXMuYXJncyA9IGFyZ3M7XG4gIH1cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuIG5ldyBGbih0aGlzLmZuLCB0aGlzLmFyZ3MpO1xuICB9XG59XG5leHBvcnRzLkZuID0gRm47XG5cbmNsYXNzIENvbCBleHRlbmRzIFNlcXVlbGl6ZU1ldGhvZCB7XG4gIGNvbnN0cnVjdG9yKGNvbCwgLi4uYXJncykge1xuICAgIHN1cGVyKCk7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID4gMCkge1xuICAgICAgY29sID0gYXJncztcbiAgICB9XG4gICAgdGhpcy5jb2wgPSBjb2w7XG4gIH1cbn1cbmV4cG9ydHMuQ29sID0gQ29sO1xuXG5jbGFzcyBDYXN0IGV4dGVuZHMgU2VxdWVsaXplTWV0aG9kIHtcbiAgY29uc3RydWN0b3IodmFsLCB0eXBlLCBqc29uKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnZhbCA9IHZhbDtcbiAgICB0aGlzLnR5cGUgPSAodHlwZSB8fCAnJykudHJpbSgpO1xuICAgIHRoaXMuanNvbiA9IGpzb24gfHwgZmFsc2U7XG4gIH1cbn1cbmV4cG9ydHMuQ2FzdCA9IENhc3Q7XG5cbmNsYXNzIExpdGVyYWwgZXh0ZW5kcyBTZXF1ZWxpemVNZXRob2Qge1xuICBjb25zdHJ1Y3Rvcih2YWwpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMudmFsID0gdmFsO1xuICB9XG59XG5leHBvcnRzLkxpdGVyYWwgPSBMaXRlcmFsO1xuXG5jbGFzcyBKc29uIGV4dGVuZHMgU2VxdWVsaXplTWV0aG9kIHtcbiAgY29uc3RydWN0b3IoY29uZGl0aW9uc09yUGF0aCwgdmFsdWUpIHtcbiAgICBzdXBlcigpO1xuICAgIGlmIChfLmlzT2JqZWN0KGNvbmRpdGlvbnNPclBhdGgpKSB7XG4gICAgICB0aGlzLmNvbmRpdGlvbnMgPSBjb25kaXRpb25zT3JQYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBhdGggPSBjb25kaXRpb25zT3JQYXRoO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmV4cG9ydHMuSnNvbiA9IEpzb247XG5cbmNsYXNzIFdoZXJlIGV4dGVuZHMgU2VxdWVsaXplTWV0aG9kIHtcbiAgY29uc3RydWN0b3IoYXR0cmlidXRlLCBjb21wYXJhdG9yLCBsb2dpYykge1xuICAgIHN1cGVyKCk7XG4gICAgaWYgKGxvZ2ljID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxvZ2ljID0gY29tcGFyYXRvcjtcbiAgICAgIGNvbXBhcmF0b3IgPSAnPSc7XG4gICAgfVxuXG4gICAgdGhpcy5hdHRyaWJ1dGUgPSBhdHRyaWJ1dGU7XG4gICAgdGhpcy5jb21wYXJhdG9yID0gY29tcGFyYXRvcjtcbiAgICB0aGlzLmxvZ2ljID0gbG9naWM7XG4gIH1cbn1cbmV4cG9ydHMuV2hlcmUgPSBXaGVyZTtcblxuLy9Db2xsZWN0aW9uIG9mIGhlbHBlciBtZXRob2RzIHRvIG1ha2UgaXQgZWFzaWVyIHRvIHdvcmsgd2l0aCBzeW1ib2wgb3BlcmF0b3JzXG5cbi8qKlxuICogZ2V0T3BlcmF0b3JzXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm5zIHtBcnJheTxTeW1ib2w+fSBBbGwgb3BlcmF0b3JzIHByb3BlcnRpZXMgb2Ygb2JqXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBnZXRPcGVyYXRvcnMob2JqKSB7XG4gIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iaikuZmlsdGVyKHMgPT4gb3BlcmF0b3JzU2V0LmhhcyhzKSk7XG59XG5leHBvcnRzLmdldE9wZXJhdG9ycyA9IGdldE9wZXJhdG9ycztcblxuLyoqXG4gKiBnZXRDb21wbGV4S2V5c1xuICpcbiAqIEBwYXJhbSAge09iamVjdH0gb2JqXG4gKiBAcmV0dXJucyB7QXJyYXk8c3RyaW5nfFN5bWJvbD59IEFsbCBrZXlzIGluY2x1ZGluZyBvcGVyYXRvcnNcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGdldENvbXBsZXhLZXlzKG9iaikge1xuICByZXR1cm4gZ2V0T3BlcmF0b3JzKG9iaikuY29uY2F0KE9iamVjdC5rZXlzKG9iaikpO1xufVxuZXhwb3J0cy5nZXRDb21wbGV4S2V5cyA9IGdldENvbXBsZXhLZXlzO1xuXG4vKipcbiAqIGdldENvbXBsZXhTaXplXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fEFycmF5fSBvYmpcbiAqIEByZXR1cm5zIHtudW1iZXJ9ICAgICAgTGVuZ3RoIG9mIG9iamVjdCBwcm9wZXJ0aWVzIGluY2x1ZGluZyBvcGVyYXRvcnMgaWYgb2JqIGlzIGFycmF5IHJldHVybnMgaXRzIGxlbmd0aFxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZ2V0Q29tcGxleFNpemUob2JqKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KG9iaikgPyBvYmoubGVuZ3RoIDogZ2V0Q29tcGxleEtleXMob2JqKS5sZW5ndGg7XG59XG5leHBvcnRzLmdldENvbXBsZXhTaXplID0gZ2V0Q29tcGxleFNpemU7XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIGEgd2hlcmUgY2xhdXNlIGlzIGVtcHR5LCBldmVuIHdpdGggU3ltYm9sc1xuICpcbiAqIEBwYXJhbSAge09iamVjdH0gb2JqXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGlzV2hlcmVFbXB0eShvYmopIHtcbiAgcmV0dXJuICEhb2JqICYmIF8uaXNFbXB0eShvYmopICYmIGdldE9wZXJhdG9ycyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmV4cG9ydHMuaXNXaGVyZUVtcHR5ID0gaXNXaGVyZUVtcHR5O1xuXG4vKipcbiAqIFJldHVybnMgRU5VTSBuYW1lIGJ5IGpvaW5pbmcgdGFibGUgYW5kIGNvbHVtbiBuYW1lXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlTmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IGNvbHVtbk5hbWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUVudW1OYW1lKHRhYmxlTmFtZSwgY29sdW1uTmFtZSkge1xuICByZXR1cm4gYGVudW1fJHt0YWJsZU5hbWV9XyR7Y29sdW1uTmFtZX1gO1xufVxuZXhwb3J0cy5nZW5lcmF0ZUVudW1OYW1lID0gZ2VuZXJhdGVFbnVtTmFtZTtcblxuLyoqXG4gKiBSZXR1cm5zIGFuIG5ldyBPYmplY3Qgd2hpY2gga2V5cyBhcmUgY2FtZWxpemVkXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybnMge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNhbWVsaXplT2JqZWN0S2V5cyhvYmopIHtcbiAgY29uc3QgbmV3T2JqID0gbmV3IE9iamVjdCgpO1xuICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goa2V5ID0+IHtcbiAgICBuZXdPYmpbY2FtZWxpemUoa2V5KV0gPSBvYmpba2V5XTtcbiAgfSk7XG4gIHJldHVybiBuZXdPYmo7XG59XG5leHBvcnRzLmNhbWVsaXplT2JqZWN0S2V5cyA9IGNhbWVsaXplT2JqZWN0S2V5cztcblxuLyoqXG4gKiBBc3NpZ25zIG93biBhbmQgaW5oZXJpdGVkIGVudW1lcmFibGUgc3RyaW5nIGFuZCBzeW1ib2wga2V5ZWQgcHJvcGVydGllcyBvZiBzb3VyY2VcbiAqIG9iamVjdHMgdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAqXG4gKiBodHRwczovL2xvZGFzaC5jb20vZG9jcy80LjE3LjQjZGVmYXVsdHNcbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgbXV0YXRlcyBgb2JqZWN0YC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0gey4uLk9iamVjdH0gW3NvdXJjZXNdIFRoZSBzb3VyY2Ugb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBkZWZhdWx0cyhvYmplY3QsIC4uLnNvdXJjZXMpIHtcbiAgb2JqZWN0ID0gT2JqZWN0KG9iamVjdCk7XG5cbiAgc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiB7XG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgc291cmNlID0gT2JqZWN0KHNvdXJjZSk7XG5cbiAgICAgIGdldENvbXBsZXhLZXlzKHNvdXJjZSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IG9iamVjdFtrZXldO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdmFsdWUgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICAgXy5lcSh2YWx1ZSwgT2JqZWN0LnByb3RvdHlwZVtrZXldKSAmJlxuICAgICAgICAgICAgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSlcblxuICAgICAgICApIHtcbiAgICAgICAgICBvYmplY3Rba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvYmplY3Q7XG59XG5leHBvcnRzLmRlZmF1bHRzID0gZGVmYXVsdHM7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbmRleFxuICogQHBhcmFtIHtBcnJheX0gIGluZGV4LmZpZWxkc1xuICogQHBhcmFtIHtzdHJpbmd9IFtpbmRleC5uYW1lXVxuICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSB0YWJsZU5hbWVcbiAqXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gbmFtZUluZGV4KGluZGV4LCB0YWJsZU5hbWUpIHtcbiAgaWYgKHRhYmxlTmFtZS50YWJsZU5hbWUpIHRhYmxlTmFtZSA9IHRhYmxlTmFtZS50YWJsZU5hbWU7XG5cbiAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5kZXgsICduYW1lJykpIHtcbiAgICBjb25zdCBmaWVsZHMgPSBpbmRleC5maWVsZHMubWFwKFxuICAgICAgZmllbGQgPT4gdHlwZW9mIGZpZWxkID09PSAnc3RyaW5nJyA/IGZpZWxkIDogZmllbGQubmFtZSB8fCBmaWVsZC5hdHRyaWJ1dGVcbiAgICApO1xuICAgIGluZGV4Lm5hbWUgPSB1bmRlcnNjb3JlKGAke3RhYmxlTmFtZX1fJHtmaWVsZHMuam9pbignXycpfWApO1xuICB9XG5cbiAgcmV0dXJuIGluZGV4O1xufVxuZXhwb3J0cy5uYW1lSW5kZXggPSBuYW1lSW5kZXg7XG5cbi8qKlxuICogQ2hlY2tzIGlmIDIgYXJyYXlzIGludGVyc2VjdC5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnIxXG4gKiBAcGFyYW0ge0FycmF5fSBhcnIyXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBpbnRlcnNlY3RzKGFycjEsIGFycjIpIHtcbiAgcmV0dXJuIGFycjEuc29tZSh2ID0+IGFycjIuaW5jbHVkZXModikpO1xufVxuZXhwb3J0cy5pbnRlcnNlY3RzID0gaW50ZXJzZWN0cztcbiJdfQ==