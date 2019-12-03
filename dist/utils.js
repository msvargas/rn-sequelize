'use strict';

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

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

let Fn =
/*#__PURE__*/
function (_SequelizeMethod) {
  _inherits(Fn, _SequelizeMethod);

  function Fn(fn, args) {
    var _this;

    _classCallCheck(this, Fn);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Fn).call(this));
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

let Col =
/*#__PURE__*/
function (_SequelizeMethod2) {
  _inherits(Col, _SequelizeMethod2);

  function Col(col, ...args) {
    var _this2;

    _classCallCheck(this, Col);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(Col).call(this));

    if (args.length > 0) {
      col = args;
    }

    _this2.col = col;
    return _this2;
  }

  return Col;
}(SequelizeMethod);

exports.Col = Col;

let Cast =
/*#__PURE__*/
function (_SequelizeMethod3) {
  _inherits(Cast, _SequelizeMethod3);

  function Cast(val, type, json) {
    var _this3;

    _classCallCheck(this, Cast);

    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(Cast).call(this));
    _this3.val = val;
    _this3.type = (type || '').trim();
    _this3.json = json || false;
    return _this3;
  }

  return Cast;
}(SequelizeMethod);

exports.Cast = Cast;

let Literal =
/*#__PURE__*/
function (_SequelizeMethod4) {
  _inherits(Literal, _SequelizeMethod4);

  function Literal(val) {
    var _this4;

    _classCallCheck(this, Literal);

    _this4 = _possibleConstructorReturn(this, _getPrototypeOf(Literal).call(this));
    _this4.val = val;
    return _this4;
  }

  return Literal;
}(SequelizeMethod);

exports.Literal = Literal;

let Json =
/*#__PURE__*/
function (_SequelizeMethod5) {
  _inherits(Json, _SequelizeMethod5);

  function Json(conditionsOrPath, value) {
    var _this5;

    _classCallCheck(this, Json);

    _this5 = _possibleConstructorReturn(this, _getPrototypeOf(Json).call(this));

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

let Where =
/*#__PURE__*/
function (_SequelizeMethod6) {
  _inherits(Where, _SequelizeMethod6);

  function Where(attribute, comparator, logic) {
    var _this6;

    _classCallCheck(this, Where);

    _this6 = _possibleConstructorReturn(this, _getPrototypeOf(Where).call(this));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi91dGlscy5qcyJdLCJuYW1lcyI6WyJEYXRhVHlwZXMiLCJyZXF1aXJlIiwiU3FsU3RyaW5nIiwiXyIsInV1aWR2MSIsInV1aWR2NCIsIlByb21pc2UiLCJvcGVyYXRvcnMiLCJvcGVyYXRvcnNTZXQiLCJTZXQiLCJ2YWx1ZXMiLCJpbmZsZWN0aW9uIiwiZXhwb3J0cyIsImNsYXNzVG9JbnZva2FibGUiLCJ1c2VJbmZsZWN0aW9uIiwiX2luZmxlY3Rpb24iLCJjYW1lbGl6ZUlmIiwic3RyIiwiY29uZGl0aW9uIiwicmVzdWx0IiwiY2FtZWxpemUiLCJ1bmRlcnNjb3JlZElmIiwidW5kZXJzY29yZSIsImlzUHJpbWl0aXZlIiwidmFsIiwidHlwZSIsIm1lcmdlRGVmYXVsdHMiLCJhIiwiYiIsIm1lcmdlV2l0aCIsIm9iamVjdFZhbHVlIiwiaXNQbGFpbk9iamVjdCIsInVuZGVmaW5lZCIsIm1lcmdlIiwib2JqIiwiYXJndW1lbnRzIiwiZm9yT3duIiwidmFsdWUiLCJrZXkiLCJBcnJheSIsImlzQXJyYXkiLCJjb25jYXQiLCJzcGxpY2VTdHIiLCJpbmRleCIsImNvdW50IiwiYWRkIiwic2xpY2UiLCJ0cmltIiwicmVwbGFjZSIsIm1hdGNoIiwiYyIsInRvVXBwZXJDYXNlIiwic2luZ3VsYXJpemUiLCJwbHVyYWxpemUiLCJmb3JtYXQiLCJhcnIiLCJkaWFsZWN0IiwidGltZVpvbmUiLCJmb3JtYXROYW1lZFBhcmFtZXRlcnMiLCJzcWwiLCJwYXJhbWV0ZXJzIiwiY2xvbmVEZWVwIiwib25seVBsYWluIiwiY2xvbmVEZWVwV2l0aCIsImVsZW0iLCJjbG9uZSIsIm1hcEZpbmRlck9wdGlvbnMiLCJvcHRpb25zIiwiTW9kZWwiLCJhdHRyaWJ1dGVzIiwiX2luamVjdERlcGVuZGVudFZpcnR1YWxBdHRyaWJ1dGVzIiwiZmlsdGVyIiwidiIsIl92aXJ0dWFsQXR0cmlidXRlcyIsImhhcyIsIm1hcE9wdGlvbkZpZWxkTmFtZXMiLCJtYXAiLCJhdHRyIiwicmF3QXR0cmlidXRlcyIsImZpZWxkIiwid2hlcmUiLCJtYXBXaGVyZUZpZWxkTmFtZXMiLCJnZXRDb21wbGV4S2V5cyIsImZvckVhY2giLCJhdHRyaWJ1dGUiLCJyYXdBdHRyaWJ1dGUiLCJmaWVsZE5hbWUiLCJIU1RPUkUiLCJKU09OIiwibWFwVmFsdWVGaWVsZE5hbWVzIiwiZGF0YVZhbHVlcyIsImZpZWxkcyIsImlzQ29sU3RyaW5nIiwibGVuZ3RoIiwiY2FuVHJlYXRBcnJheUFzQW5kIiwic29tZSIsImFyZyIsIldoZXJlIiwiY29tYmluZVRhYmxlTmFtZXMiLCJ0YWJsZU5hbWUxIiwidGFibGVOYW1lMiIsInRvTG93ZXJDYXNlIiwidG9EZWZhdWx0VmFsdWUiLCJ0bXAiLCJBQlNUUkFDVCIsInRvU3FsIiwiVVVJRFYxIiwiVVVJRFY0IiwiTk9XIiwibm93IiwiZGVmYXVsdFZhbHVlU2NoZW1hYmxlIiwicmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoIiwiaGFzaCIsIm9taXROdWxsIiwiYWxsb3dOdWxsIiwiX2hhc2giLCJmb3JJbiIsImluY2x1ZGVzIiwiZW5kc1dpdGgiLCJzdGFjayIsIm9yaWciLCJFcnJvciIsInByZXBhcmVTdGFja1RyYWNlIiwiZXJyIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJlcnJTdGFjayIsImRpYWxlY3RzIiwiZCIsIkRhdGUiLCJzZXRNaWxsaXNlY29uZHMiLCJUSUNLX0NIQVIiLCJhZGRUaWNrcyIsInMiLCJ0aWNrQ2hhciIsInJlbW92ZVRpY2tzIiwiUmVnRXhwIiwiZmxhdHRlbk9iamVjdERlZXAiLCJmbGF0dGVuZWRPYmoiLCJmbGF0dGVuT2JqZWN0Iiwic3ViUGF0aCIsIk9iamVjdCIsImtleXMiLCJwYXRoVG9Qcm9wZXJ0eSIsImdldCIsIlNlcXVlbGl6ZU1ldGhvZCIsIkZuIiwiZm4iLCJhcmdzIiwiQ29sIiwiY29sIiwiQ2FzdCIsImpzb24iLCJMaXRlcmFsIiwiSnNvbiIsImNvbmRpdGlvbnNPclBhdGgiLCJpc09iamVjdCIsImNvbmRpdGlvbnMiLCJwYXRoIiwiY29tcGFyYXRvciIsImxvZ2ljIiwiZ2V0T3BlcmF0b3JzIiwiZ2V0T3duUHJvcGVydHlTeW1ib2xzIiwiZ2V0Q29tcGxleFNpemUiLCJpc1doZXJlRW1wdHkiLCJpc0VtcHR5IiwiZ2VuZXJhdGVFbnVtTmFtZSIsInRhYmxlTmFtZSIsImNvbHVtbk5hbWUiLCJjYW1lbGl6ZU9iamVjdEtleXMiLCJuZXdPYmoiLCJkZWZhdWx0cyIsIm9iamVjdCIsInNvdXJjZXMiLCJzb3VyY2UiLCJlcSIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsIm5hbWVJbmRleCIsIm5hbWUiLCJqb2luIiwiaW50ZXJzZWN0cyIsImFycjEiLCJhcnIyIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsU0FBUyxHQUFHQyxPQUFPLENBQUMsY0FBRCxDQUF6Qjs7QUFDQSxNQUFNQyxTQUFTLEdBQUdELE9BQU8sQ0FBQyxjQUFELENBQXpCOztBQUNBLE1BQU1FLENBQUMsR0FBR0YsT0FBTyxDQUFDLFFBQUQsQ0FBakI7O0FBQ0EsTUFBTUcsTUFBTSxHQUFHSCxPQUFPLENBQUMsU0FBRCxDQUF0Qjs7QUFDQSxNQUFNSSxNQUFNLEdBQUdKLE9BQU8sQ0FBQyxTQUFELENBQXRCOztBQUNBLE1BQU1LLE9BQU8sR0FBR0wsT0FBTyxDQUFDLFdBQUQsQ0FBdkI7O0FBQ0EsTUFBTU0sU0FBUyxHQUFHTixPQUFPLENBQUMsYUFBRCxDQUF6Qjs7QUFDQSxNQUFNTyxZQUFZLEdBQUcsSUFBSUMsR0FBSixDQUFRTixDQUFDLENBQUNPLE1BQUYsQ0FBU0gsU0FBVCxDQUFSLENBQXJCOztBQUVBLElBQUlJLFVBQVUsR0FBR1YsT0FBTyxDQUFDLFlBQUQsQ0FBeEI7O0FBRUFXLE9BQU8sQ0FBQ0MsZ0JBQVIsR0FBMkJaLE9BQU8sQ0FBQywwQkFBRCxDQUFQLENBQW9DWSxnQkFBL0Q7QUFFQUQsT0FBTyxDQUFDTixPQUFSLEdBQWtCQSxPQUFsQjs7QUFFQSxTQUFTUSxhQUFULENBQXVCQyxX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ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IERhdGFUeXBlcyA9IHJlcXVpcmUoJy4vZGF0YS10eXBlcycpO1xyXG5jb25zdCBTcWxTdHJpbmcgPSByZXF1aXJlKCcuL3NxbC1zdHJpbmcnKTtcclxuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5jb25zdCB1dWlkdjEgPSByZXF1aXJlKCd1dWlkL3YxJyk7XHJcbmNvbnN0IHV1aWR2NCA9IHJlcXVpcmUoJ3V1aWQvdjQnKTtcclxuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpO1xyXG5jb25zdCBvcGVyYXRvcnMgPSByZXF1aXJlKCcuL29wZXJhdG9ycycpO1xyXG5jb25zdCBvcGVyYXRvcnNTZXQgPSBuZXcgU2V0KF8udmFsdWVzKG9wZXJhdG9ycykpO1xyXG5cclxubGV0IGluZmxlY3Rpb24gPSByZXF1aXJlKCdpbmZsZWN0aW9uJyk7XHJcblxyXG5leHBvcnRzLmNsYXNzVG9JbnZva2FibGUgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzVG9JbnZva2FibGUnKS5jbGFzc1RvSW52b2thYmxlO1xyXG5cclxuZXhwb3J0cy5Qcm9taXNlID0gUHJvbWlzZTtcclxuXHJcbmZ1bmN0aW9uIHVzZUluZmxlY3Rpb24oX2luZmxlY3Rpb24pIHtcclxuICBpbmZsZWN0aW9uID0gX2luZmxlY3Rpb247XHJcbn1cclxuZXhwb3J0cy51c2VJbmZsZWN0aW9uID0gdXNlSW5mbGVjdGlvbjtcclxuXHJcbmZ1bmN0aW9uIGNhbWVsaXplSWYoc3RyLCBjb25kaXRpb24pIHtcclxuICBsZXQgcmVzdWx0ID0gc3RyO1xyXG5cclxuICBpZiAoY29uZGl0aW9uKSB7XHJcbiAgICByZXN1bHQgPSBjYW1lbGl6ZShzdHIpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5leHBvcnRzLmNhbWVsaXplSWYgPSBjYW1lbGl6ZUlmO1xyXG5cclxuZnVuY3Rpb24gdW5kZXJzY29yZWRJZihzdHIsIGNvbmRpdGlvbikge1xyXG4gIGxldCByZXN1bHQgPSBzdHI7XHJcblxyXG4gIGlmIChjb25kaXRpb24pIHtcclxuICAgIHJlc3VsdCA9IHVuZGVyc2NvcmUoc3RyKTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuZXhwb3J0cy51bmRlcnNjb3JlZElmID0gdW5kZXJzY29yZWRJZjtcclxuXHJcbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKHZhbCkge1xyXG4gIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsO1xyXG4gIHJldHVybiB0eXBlID09PSAnc3RyaW5nJyB8fCB0eXBlID09PSAnbnVtYmVyJyB8fCB0eXBlID09PSAnYm9vbGVhbic7XHJcbn1cclxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xyXG5cclxuLy8gU2FtZSBjb25jZXB0IGFzIF8ubWVyZ2UsIGJ1dCBkb24ndCBvdmVyd3JpdGUgcHJvcGVydGllcyB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFzc2lnbmVkXHJcbmZ1bmN0aW9uIG1lcmdlRGVmYXVsdHMoYSwgYikge1xyXG4gIHJldHVybiBfLm1lcmdlV2l0aChhLCBiLCBvYmplY3RWYWx1ZSA9PiB7XHJcbiAgICAvLyBJZiBpdCdzIGFuIG9iamVjdCwgbGV0IF8gaGFuZGxlIGl0IHRoaXMgdGltZSwgd2Ugd2lsbCBiZSBjYWxsZWQgYWdhaW4gZm9yIGVhY2ggcHJvcGVydHlcclxuICAgIGlmICghXy5pc1BsYWluT2JqZWN0KG9iamVjdFZhbHVlKSAmJiBvYmplY3RWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBvYmplY3RWYWx1ZTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5leHBvcnRzLm1lcmdlRGVmYXVsdHMgPSBtZXJnZURlZmF1bHRzO1xyXG5cclxuLy8gQW4gYWx0ZXJuYXRpdmUgdG8gXy5tZXJnZSwgd2hpY2ggZG9lc24ndCBjbG9uZSBpdHMgYXJndW1lbnRzXHJcbi8vIENsb25pbmcgaXMgYSBiYWQgaWRlYSBiZWNhdXNlIG9wdGlvbnMgYXJndW1lbnRzIG1heSBjb250YWluIHJlZmVyZW5jZXMgdG8gc2VxdWVsaXplXHJcbi8vIG1vZGVscyAtIHdoaWNoIGFnYWluIHJlZmVyZW5jZSBkYXRhYmFzZSBsaWJzIHdoaWNoIGRvbid0IGxpa2UgdG8gYmUgY2xvbmVkIChpbiBwYXJ0aWN1bGFyIHBnLW5hdGl2ZSlcclxuZnVuY3Rpb24gbWVyZ2UoKSB7XHJcbiAgY29uc3QgcmVzdWx0ID0ge307XHJcblxyXG4gIGZvciAoY29uc3Qgb2JqIG9mIGFyZ3VtZW50cykge1xyXG4gICAgXy5mb3JPd24ob2JqLCAodmFsdWUsIGtleSkgPT4ge1xyXG4gICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmICghcmVzdWx0W2tleV0pIHtcclxuICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChfLmlzUGxhaW5PYmplY3QodmFsdWUpICYmIF8uaXNQbGFpbk9iamVjdChyZXN1bHRba2V5XSkpIHtcclxuICAgICAgICAgIHJlc3VsdFtrZXldID0gbWVyZ2UocmVzdWx0W2tleV0sIHZhbHVlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIEFycmF5LmlzQXJyYXkocmVzdWx0W2tleV0pKSB7XHJcbiAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlLmNvbmNhdChyZXN1bHRba2V5XSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuZXhwb3J0cy5tZXJnZSA9IG1lcmdlO1xyXG5cclxuZnVuY3Rpb24gc3BsaWNlU3RyKHN0ciwgaW5kZXgsIGNvdW50LCBhZGQpIHtcclxuICByZXR1cm4gc3RyLnNsaWNlKDAsIGluZGV4KSArIGFkZCArIHN0ci5zbGljZShpbmRleCArIGNvdW50KTtcclxufVxyXG5leHBvcnRzLnNwbGljZVN0ciA9IHNwbGljZVN0cjtcclxuXHJcbmZ1bmN0aW9uIGNhbWVsaXplKHN0cikge1xyXG4gIHJldHVybiBzdHIudHJpbSgpLnJlcGxhY2UoL1stX1xcc10rKC4pPy9nLCAobWF0Y2gsIGMpID0+IGMudG9VcHBlckNhc2UoKSk7XHJcbn1cclxuZXhwb3J0cy5jYW1lbGl6ZSA9IGNhbWVsaXplO1xyXG5cclxuZnVuY3Rpb24gdW5kZXJzY29yZShzdHIpIHtcclxuICByZXR1cm4gaW5mbGVjdGlvbi51bmRlcnNjb3JlKHN0cik7XHJcbn1cclxuZXhwb3J0cy51bmRlcnNjb3JlID0gdW5kZXJzY29yZTtcclxuXHJcbmZ1bmN0aW9uIHNpbmd1bGFyaXplKHN0cikge1xyXG4gIHJldHVybiBpbmZsZWN0aW9uLnNpbmd1bGFyaXplKHN0cik7XHJcbn1cclxuZXhwb3J0cy5zaW5ndWxhcml6ZSA9IHNpbmd1bGFyaXplO1xyXG5cclxuZnVuY3Rpb24gcGx1cmFsaXplKHN0cikge1xyXG4gIHJldHVybiBpbmZsZWN0aW9uLnBsdXJhbGl6ZShzdHIpO1xyXG59XHJcbmV4cG9ydHMucGx1cmFsaXplID0gcGx1cmFsaXplO1xyXG5cclxuZnVuY3Rpb24gZm9ybWF0KGFyciwgZGlhbGVjdCkge1xyXG4gIGNvbnN0IHRpbWVab25lID0gbnVsbDtcclxuICAvLyBNYWtlIGEgY2xvbmUgb2YgdGhlIGFycmF5IGJlYWN1c2UgZm9ybWF0IG1vZGlmaWVzIHRoZSBwYXNzZWQgYXJnc1xyXG4gIHJldHVybiBTcWxTdHJpbmcuZm9ybWF0KGFyclswXSwgYXJyLnNsaWNlKDEpLCB0aW1lWm9uZSwgZGlhbGVjdCk7XHJcbn1cclxuZXhwb3J0cy5mb3JtYXQgPSBmb3JtYXQ7XHJcblxyXG5mdW5jdGlvbiBmb3JtYXROYW1lZFBhcmFtZXRlcnMoc3FsLCBwYXJhbWV0ZXJzLCBkaWFsZWN0KSB7XHJcbiAgY29uc3QgdGltZVpvbmUgPSBudWxsO1xyXG4gIHJldHVybiBTcWxTdHJpbmcuZm9ybWF0TmFtZWRQYXJhbWV0ZXJzKHNxbCwgcGFyYW1ldGVycywgdGltZVpvbmUsIGRpYWxlY3QpO1xyXG59XHJcbmV4cG9ydHMuZm9ybWF0TmFtZWRQYXJhbWV0ZXJzID0gZm9ybWF0TmFtZWRQYXJhbWV0ZXJzO1xyXG5cclxuZnVuY3Rpb24gY2xvbmVEZWVwKG9iaiwgb25seVBsYWluKSB7XHJcbiAgb2JqID0gb2JqIHx8IHt9O1xyXG4gIHJldHVybiBfLmNsb25lRGVlcFdpdGgob2JqLCBlbGVtID0+IHtcclxuICAgIC8vIERvIG5vdCB0cnkgdG8gY3VzdG9taXplIGNsb25pbmcgb2YgYXJyYXlzIG9yIFBPSk9zXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShlbGVtKSB8fCBfLmlzUGxhaW5PYmplY3QoZWxlbSkpIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB3ZSBzcGVjaWZpZWQgdG8gY2xvbmUgb25seSBwbGFpbiBvYmplY3RzICYgYXJyYXlzLCB3ZSBpZ25vcmUgZXZlcnloaW5nIGVsc2VcclxuICAgIC8vIEluIGFueSBjYXNlLCBkb24ndCBjbG9uZSBzdHVmZiB0aGF0J3MgYW4gb2JqZWN0LCBidXQgbm90IGEgcGxhaW4gb25lIC0gZnggZXhhbXBsZSBzZXF1ZWxpemUgbW9kZWxzIGFuZCBpbnN0YW5jZXNcclxuICAgIGlmIChvbmx5UGxhaW4gfHwgdHlwZW9mIGVsZW0gPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIHJldHVybiBlbGVtO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFByZXNlcnZlIHNwZWNpYWwgZGF0YS10eXBlcyBsaWtlIGBmbmAgYWNyb3NzIGNsb25lcy4gXy5nZXQoKSBpcyB1c2VkIGZvciBjaGVja2luZyB1cCB0aGUgcHJvdG90eXBlIGNoYWluXHJcbiAgICBpZiAoZWxlbSAmJiB0eXBlb2YgZWxlbS5jbG9uZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICByZXR1cm4gZWxlbS5jbG9uZSgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbmV4cG9ydHMuY2xvbmVEZWVwID0gY2xvbmVEZWVwO1xyXG5cclxuLyogRXhwYW5kIGFuZCBub3JtYWxpemUgZmluZGVyIG9wdGlvbnMgKi9cclxuZnVuY3Rpb24gbWFwRmluZGVyT3B0aW9ucyhvcHRpb25zLCBNb2RlbCkge1xyXG4gIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLmF0dHJpYnV0ZXMpKSB7XHJcbiAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBNb2RlbC5faW5qZWN0RGVwZW5kZW50VmlydHVhbEF0dHJpYnV0ZXMob3B0aW9ucy5hdHRyaWJ1dGVzKTtcclxuICAgIG9wdGlvbnMuYXR0cmlidXRlcyA9IG9wdGlvbnMuYXR0cmlidXRlcy5maWx0ZXIodiA9PiAhTW9kZWwuX3ZpcnR1YWxBdHRyaWJ1dGVzLmhhcyh2KSk7XHJcbiAgfVxyXG5cclxuICBtYXBPcHRpb25GaWVsZE5hbWVzKG9wdGlvbnMsIE1vZGVsKTtcclxuXHJcbiAgcmV0dXJuIG9wdGlvbnM7XHJcbn1cclxuZXhwb3J0cy5tYXBGaW5kZXJPcHRpb25zID0gbWFwRmluZGVyT3B0aW9ucztcclxuXHJcbi8qIFVzZWQgdG8gbWFwIGZpZWxkIG5hbWVzIGluIGF0dHJpYnV0ZXMgYW5kIHdoZXJlIGNvbmRpdGlvbnMgKi9cclxuZnVuY3Rpb24gbWFwT3B0aW9uRmllbGROYW1lcyhvcHRpb25zLCBNb2RlbCkge1xyXG4gIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMuYXR0cmlidXRlcykpIHtcclxuICAgIG9wdGlvbnMuYXR0cmlidXRlcyA9IG9wdGlvbnMuYXR0cmlidXRlcy5tYXAoYXR0ciA9PiB7XHJcbiAgICAgIC8vIE9iamVjdCBsb29rdXBzIHdpbGwgZm9yY2UgYW55IHZhcmlhYmxlIHRvIHN0cmluZ3MsIHdlIGRvbid0IHdhbnQgdGhhdCBmb3Igc3BlY2lhbCBvYmplY3RzIGV0Y1xyXG4gICAgICBpZiAodHlwZW9mIGF0dHIgIT09ICdzdHJpbmcnKSByZXR1cm4gYXR0cjtcclxuICAgICAgLy8gTWFwIGF0dHJpYnV0ZXMgdG8gYWxpYXNlZCBzeW50YXggYXR0cmlidXRlc1xyXG4gICAgICBpZiAoTW9kZWwucmF3QXR0cmlidXRlc1thdHRyXSAmJiBhdHRyICE9PSBNb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkKSB7XHJcbiAgICAgICAgcmV0dXJuIFtNb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkLCBhdHRyXTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYXR0cjtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgaWYgKG9wdGlvbnMud2hlcmUgJiYgXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMud2hlcmUpKSB7XHJcbiAgICBvcHRpb25zLndoZXJlID0gbWFwV2hlcmVGaWVsZE5hbWVzKG9wdGlvbnMud2hlcmUsIE1vZGVsKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBvcHRpb25zO1xyXG59XHJcbmV4cG9ydHMubWFwT3B0aW9uRmllbGROYW1lcyA9IG1hcE9wdGlvbkZpZWxkTmFtZXM7XHJcblxyXG5mdW5jdGlvbiBtYXBXaGVyZUZpZWxkTmFtZXMoYXR0cmlidXRlcywgTW9kZWwpIHtcclxuICBpZiAoYXR0cmlidXRlcykge1xyXG4gICAgZ2V0Q29tcGxleEtleXMoYXR0cmlidXRlcykuZm9yRWFjaChhdHRyaWJ1dGUgPT4ge1xyXG4gICAgICBjb25zdCByYXdBdHRyaWJ1dGUgPSBNb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJpYnV0ZV07XHJcblxyXG4gICAgICBpZiAocmF3QXR0cmlidXRlICYmIHJhd0F0dHJpYnV0ZS5maWVsZCAhPT0gcmF3QXR0cmlidXRlLmZpZWxkTmFtZSkge1xyXG4gICAgICAgIGF0dHJpYnV0ZXNbcmF3QXR0cmlidXRlLmZpZWxkXSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlXTtcclxuICAgICAgICBkZWxldGUgYXR0cmlidXRlc1thdHRyaWJ1dGVdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGF0dHJpYnV0ZXNbYXR0cmlidXRlXSlcclxuICAgICAgICAmJiAhKHJhd0F0dHJpYnV0ZSAmJiAoXHJcbiAgICAgICAgICByYXdBdHRyaWJ1dGUudHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5IU1RPUkVcclxuICAgICAgICAgIHx8IHJhd0F0dHJpYnV0ZS50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkpTT04pKSkgeyAvLyBQcmV2ZW50IHJlbmFtaW5nIG9mIEhTVE9SRSAmIEpTT04gZmllbGRzXHJcbiAgICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVdID0gbWFwT3B0aW9uRmllbGROYW1lcyh7XHJcbiAgICAgICAgICB3aGVyZTogYXR0cmlidXRlc1thdHRyaWJ1dGVdXHJcbiAgICAgICAgfSwgTW9kZWwpLndoZXJlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0pKSB7XHJcbiAgICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVdLmZvckVhY2goKHdoZXJlLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdCh3aGVyZSkpIHtcclxuICAgICAgICAgICAgYXR0cmlidXRlc1thdHRyaWJ1dGVdW2luZGV4XSA9IG1hcFdoZXJlRmllbGROYW1lcyh3aGVyZSwgTW9kZWwpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYXR0cmlidXRlcztcclxufVxyXG5leHBvcnRzLm1hcFdoZXJlRmllbGROYW1lcyA9IG1hcFdoZXJlRmllbGROYW1lcztcclxuXHJcbi8qIFVzZWQgdG8gbWFwIGZpZWxkIG5hbWVzIGluIHZhbHVlcyAqL1xyXG5mdW5jdGlvbiBtYXBWYWx1ZUZpZWxkTmFtZXMoZGF0YVZhbHVlcywgZmllbGRzLCBNb2RlbCkge1xyXG4gIGNvbnN0IHZhbHVlcyA9IHt9O1xyXG5cclxuICBmb3IgKGNvbnN0IGF0dHIgb2YgZmllbGRzKSB7XHJcbiAgICBpZiAoZGF0YVZhbHVlc1thdHRyXSAhPT0gdW5kZWZpbmVkICYmICFNb2RlbC5fdmlydHVhbEF0dHJpYnV0ZXMuaGFzKGF0dHIpKSB7XHJcbiAgICAgIC8vIEZpZWxkIG5hbWUgbWFwcGluZ1xyXG4gICAgICBpZiAoTW9kZWwucmF3QXR0cmlidXRlc1thdHRyXSAmJiBNb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkICYmIE1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGQgIT09IGF0dHIpIHtcclxuICAgICAgICB2YWx1ZXNbTW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZF0gPSBkYXRhVmFsdWVzW2F0dHJdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhbHVlc1thdHRyXSA9IGRhdGFWYWx1ZXNbYXR0cl07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB2YWx1ZXM7XHJcbn1cclxuZXhwb3J0cy5tYXBWYWx1ZUZpZWxkTmFtZXMgPSBtYXBWYWx1ZUZpZWxkTmFtZXM7XHJcblxyXG5mdW5jdGlvbiBpc0NvbFN0cmluZyh2YWx1ZSkge1xyXG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlWzBdID09PSAnJCcgJiYgdmFsdWVbdmFsdWUubGVuZ3RoIC0gMV0gPT09ICckJztcclxufVxyXG5leHBvcnRzLmlzQ29sU3RyaW5nID0gaXNDb2xTdHJpbmc7XHJcblxyXG5mdW5jdGlvbiBjYW5UcmVhdEFycmF5QXNBbmQoYXJyKSB7XHJcbiAgcmV0dXJuIGFyci5zb21lKGFyZyA9PiBfLmlzUGxhaW5PYmplY3QoYXJnKSB8fCBhcmcgaW5zdGFuY2VvZiBXaGVyZSk7XHJcbn1cclxuZXhwb3J0cy5jYW5UcmVhdEFycmF5QXNBbmQgPSBjYW5UcmVhdEFycmF5QXNBbmQ7XHJcblxyXG5mdW5jdGlvbiBjb21iaW5lVGFibGVOYW1lcyh0YWJsZU5hbWUxLCB0YWJsZU5hbWUyKSB7XHJcbiAgcmV0dXJuIHRhYmxlTmFtZTEudG9Mb3dlckNhc2UoKSA8IHRhYmxlTmFtZTIudG9Mb3dlckNhc2UoKSA/IHRhYmxlTmFtZTEgKyB0YWJsZU5hbWUyIDogdGFibGVOYW1lMiArIHRhYmxlTmFtZTE7XHJcbn1cclxuZXhwb3J0cy5jb21iaW5lVGFibGVOYW1lcyA9IGNvbWJpbmVUYWJsZU5hbWVzO1xyXG5cclxuZnVuY3Rpb24gdG9EZWZhdWx0VmFsdWUodmFsdWUsIGRpYWxlY3QpIHtcclxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBjb25zdCB0bXAgPSB2YWx1ZSgpO1xyXG4gICAgaWYgKHRtcCBpbnN0YW5jZW9mIERhdGFUeXBlcy5BQlNUUkFDVCkge1xyXG4gICAgICByZXR1cm4gdG1wLnRvU3FsKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdG1wO1xyXG4gIH1cclxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuVVVJRFYxKSB7XHJcbiAgICByZXR1cm4gdXVpZHYxKCk7XHJcbiAgfVxyXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5VVUlEVjQpIHtcclxuICAgIHJldHVybiB1dWlkdjQoKTtcclxuICB9XHJcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YVR5cGVzLk5PVykge1xyXG4gICAgcmV0dXJuIG5vdyhkaWFsZWN0KTtcclxuICB9XHJcbiAgaWYgKF8uaXNQbGFpbk9iamVjdCh2YWx1ZSkgfHwgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgIHJldHVybiBfLmNsb25lKHZhbHVlKTtcclxuICB9XHJcbiAgcmV0dXJuIHZhbHVlO1xyXG59XHJcbmV4cG9ydHMudG9EZWZhdWx0VmFsdWUgPSB0b0RlZmF1bHRWYWx1ZTtcclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmUgaWYgdGhlIGRlZmF1bHQgdmFsdWUgcHJvdmlkZWQgZXhpc3RzIGFuZCBjYW4gYmUgZGVzY3JpYmVkXHJcbiAqIGluIGEgZGIgc2NoZW1hIHVzaW5nIHRoZSBERUZBVUxUIGRpcmVjdGl2ZS5cclxuICpcclxuICogQHBhcmFtICB7Kn0gdmFsdWUgQW55IGRlZmF1bHQgdmFsdWUuXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSB5ZXMgLyBuby5cclxuICogQHByaXZhdGVcclxuICovXHJcbmZ1bmN0aW9uIGRlZmF1bHRWYWx1ZVNjaGVtYWJsZSh2YWx1ZSkge1xyXG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAvLyBUT0RPIHRoaXMgd2lsbCBiZSBzY2hlbWFibGUgd2hlbiBhbGwgc3VwcG9ydGVkIGRiXHJcbiAgLy8gaGF2ZSBiZWVuIG5vcm1hbGl6ZWQgZm9yIHRoaXMgY2FzZVxyXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5OT1cpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5VVUlEVjEgfHwgdmFsdWUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuVVVJRFY0KSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICByZXR1cm4gdHlwZW9mIHZhbHVlICE9PSAnZnVuY3Rpb24nO1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdFZhbHVlU2NoZW1hYmxlID0gZGVmYXVsdFZhbHVlU2NoZW1hYmxlO1xyXG5cclxuZnVuY3Rpb24gcmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoKGhhc2gsIG9taXROdWxsLCBvcHRpb25zKSB7XHJcbiAgbGV0IHJlc3VsdCA9IGhhc2g7XHJcblxyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gIG9wdGlvbnMuYWxsb3dOdWxsID0gb3B0aW9ucy5hbGxvd051bGwgfHwgW107XHJcblxyXG4gIGlmIChvbWl0TnVsbCkge1xyXG4gICAgY29uc3QgX2hhc2ggPSB7fTtcclxuXHJcbiAgICBfLmZvckluKGhhc2gsICh2YWwsIGtleSkgPT4ge1xyXG4gICAgICBpZiAob3B0aW9ucy5hbGxvd051bGwuaW5jbHVkZXMoa2V5KSB8fCBrZXkuZW5kc1dpdGgoJ0lkJykgfHwgdmFsICE9PSBudWxsICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgX2hhc2hba2V5XSA9IHZhbDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmVzdWx0ID0gX2hhc2g7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMucmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoID0gcmVtb3ZlTnVsbFZhbHVlc0Zyb21IYXNoO1xyXG5cclxuZnVuY3Rpb24gc3RhY2soKSB7XHJcbiAgY29uc3Qgb3JpZyA9IEVycm9yLnByZXBhcmVTdGFja1RyYWNlO1xyXG4gIEVycm9yLnByZXBhcmVTdGFja1RyYWNlID0gKF8sIHN0YWNrKSA9PiBzdGFjaztcclxuICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoKTtcclxuICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnIsIHN0YWNrKTtcclxuICBjb25zdCBlcnJTdGFjayA9IGVyci5zdGFjaztcclxuICBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IG9yaWc7XHJcbiAgcmV0dXJuIGVyclN0YWNrO1xyXG59XHJcbmV4cG9ydHMuc3RhY2sgPSBzdGFjaztcclxuXHJcbmNvbnN0IGRpYWxlY3RzID0gbmV3IFNldChbJ21hcmlhZGInLCAnbXlzcWwnLCAncG9zdGdyZXMnLCAnc3FsaXRlJywgJ21zc3FsJ10pO1xyXG5cclxuZnVuY3Rpb24gbm93KGRpYWxlY3QpIHtcclxuICBjb25zdCBkID0gbmV3IERhdGUoKTtcclxuICBpZiAoIWRpYWxlY3RzLmhhcyhkaWFsZWN0KSkge1xyXG4gICAgZC5zZXRNaWxsaXNlY29uZHMoMCk7XHJcbiAgfVxyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMubm93ID0gbm93O1xyXG5cclxuLy8gTm90ZTogVXNlIHRoZSBgcXVvdGVJZGVudGlmaWVyKClgIGFuZCBgZXNjYXBlKClgIG1ldGhvZHMgb24gdGhlXHJcbi8vIGBRdWVyeUludGVyZmFjZWAgaW5zdGVhZCBmb3IgbW9yZSBwb3J0YWJsZSBjb2RlLlxyXG5cclxuY29uc3QgVElDS19DSEFSID0gJ2AnO1xyXG5leHBvcnRzLlRJQ0tfQ0hBUiA9IFRJQ0tfQ0hBUjtcclxuXHJcbmZ1bmN0aW9uIGFkZFRpY2tzKHMsIHRpY2tDaGFyKSB7XHJcbiAgdGlja0NoYXIgPSB0aWNrQ2hhciB8fCBUSUNLX0NIQVI7XHJcbiAgcmV0dXJuIHRpY2tDaGFyICsgcmVtb3ZlVGlja3MocywgdGlja0NoYXIpICsgdGlja0NoYXI7XHJcbn1cclxuZXhwb3J0cy5hZGRUaWNrcyA9IGFkZFRpY2tzO1xyXG5cclxuZnVuY3Rpb24gcmVtb3ZlVGlja3MocywgdGlja0NoYXIpIHtcclxuICB0aWNrQ2hhciA9IHRpY2tDaGFyIHx8IFRJQ0tfQ0hBUjtcclxuICByZXR1cm4gcy5yZXBsYWNlKG5ldyBSZWdFeHAodGlja0NoYXIsICdnJyksICcnKTtcclxufVxyXG5leHBvcnRzLnJlbW92ZVRpY2tzID0gcmVtb3ZlVGlja3M7XHJcblxyXG4vKipcclxuICogUmVjZWl2ZXMgYSB0cmVlLWxpa2Ugb2JqZWN0IGFuZCByZXR1cm5zIGEgcGxhaW4gb2JqZWN0IHdoaWNoIGRlcHRoIGlzIDEuXHJcbiAqXHJcbiAqIC0gSW5wdXQ6XHJcbiAqXHJcbiAqICB7XHJcbiAqICAgIG5hbWU6ICdKb2huJyxcclxuICogICAgYWRkcmVzczoge1xyXG4gKiAgICAgIHN0cmVldDogJ0Zha2UgU3QuIDEyMycsXHJcbiAqICAgICAgY29vcmRpbmF0ZXM6IHtcclxuICogICAgICAgIGxvbmdpdHVkZTogNTUuNjc3OTYyNyxcclxuICogICAgICAgIGxhdGl0dWRlOiAxMi41OTY0MzEzXHJcbiAqICAgICAgfVxyXG4gKiAgICB9XHJcbiAqICB9XHJcbiAqXHJcbiAqIC0gT3V0cHV0OlxyXG4gKlxyXG4gKiAge1xyXG4gKiAgICBuYW1lOiAnSm9obicsXHJcbiAqICAgIGFkZHJlc3Muc3RyZWV0OiAnRmFrZSBTdC4gMTIzJyxcclxuICogICAgYWRkcmVzcy5jb29yZGluYXRlcy5sYXRpdHVkZTogNTUuNjc3OTYyNyxcclxuICogICAgYWRkcmVzcy5jb29yZGluYXRlcy5sb25naXR1ZGU6IDEyLjU5NjQzMTNcclxuICogIH1cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIGFuIE9iamVjdFxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBhIGZsYXR0ZW5lZCBvYmplY3RcclxuICogQHByaXZhdGVcclxuICovXHJcbmZ1bmN0aW9uIGZsYXR0ZW5PYmplY3REZWVwKHZhbHVlKSB7XHJcbiAgaWYgKCFfLmlzUGxhaW5PYmplY3QodmFsdWUpKSByZXR1cm4gdmFsdWU7XHJcbiAgY29uc3QgZmxhdHRlbmVkT2JqID0ge307XHJcblxyXG4gIGZ1bmN0aW9uIGZsYXR0ZW5PYmplY3Qob2JqLCBzdWJQYXRoKSB7XHJcbiAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgY29uc3QgcGF0aFRvUHJvcGVydHkgPSBzdWJQYXRoID8gYCR7c3ViUGF0aH0uJHtrZXl9YCA6IGtleTtcclxuICAgICAgaWYgKHR5cGVvZiBvYmpba2V5XSA9PT0gJ29iamVjdCcgJiYgb2JqW2tleV0gIT09IG51bGwpIHtcclxuICAgICAgICBmbGF0dGVuT2JqZWN0KG9ialtrZXldLCBwYXRoVG9Qcm9wZXJ0eSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZmxhdHRlbmVkT2JqW3BhdGhUb1Byb3BlcnR5XSA9IF8uZ2V0KG9iaiwga2V5KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZmxhdHRlbmVkT2JqO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZsYXR0ZW5PYmplY3QodmFsdWUsIHVuZGVmaW5lZCk7XHJcbn1cclxuZXhwb3J0cy5mbGF0dGVuT2JqZWN0RGVlcCA9IGZsYXR0ZW5PYmplY3REZWVwO1xyXG5cclxuLyoqXHJcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIGZvciByZXByZXNlbnRpbmcgU1FMIGZ1bmN0aW9ucywgYW5kIGNvbHVtbnMgdGhhdCBzaG91bGQgYmUgZXNjYXBlZC5cclxuICogUGxlYXNlIGRvIG5vdCB1c2UgdGhlc2UgZnVuY3Rpb25zIGRpcmVjdGx5LCB1c2UgU2VxdWVsaXplLmZuIGFuZCBTZXF1ZWxpemUuY29sIGluc3RlYWQuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5jbGFzcyBTZXF1ZWxpemVNZXRob2Qge31cclxuZXhwb3J0cy5TZXF1ZWxpemVNZXRob2QgPSBTZXF1ZWxpemVNZXRob2Q7XHJcblxyXG5jbGFzcyBGbiBleHRlbmRzIFNlcXVlbGl6ZU1ldGhvZCB7XHJcbiAgY29uc3RydWN0b3IoZm4sIGFyZ3MpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICB0aGlzLmZuID0gZm47XHJcbiAgICB0aGlzLmFyZ3MgPSBhcmdzO1xyXG4gIH1cclxuICBjbG9uZSgpIHtcclxuICAgIHJldHVybiBuZXcgRm4odGhpcy5mbiwgdGhpcy5hcmdzKTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy5GbiA9IEZuO1xyXG5cclxuY2xhc3MgQ29sIGV4dGVuZHMgU2VxdWVsaXplTWV0aG9kIHtcclxuICBjb25zdHJ1Y3Rvcihjb2wsIC4uLmFyZ3MpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBpZiAoYXJncy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGNvbCA9IGFyZ3M7XHJcbiAgICB9XHJcbiAgICB0aGlzLmNvbCA9IGNvbDtcclxuICB9XHJcbn1cclxuZXhwb3J0cy5Db2wgPSBDb2w7XHJcblxyXG5jbGFzcyBDYXN0IGV4dGVuZHMgU2VxdWVsaXplTWV0aG9kIHtcclxuICBjb25zdHJ1Y3Rvcih2YWwsIHR5cGUsIGpzb24pIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICB0aGlzLnZhbCA9IHZhbDtcclxuICAgIHRoaXMudHlwZSA9ICh0eXBlIHx8ICcnKS50cmltKCk7XHJcbiAgICB0aGlzLmpzb24gPSBqc29uIHx8IGZhbHNlO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLkNhc3QgPSBDYXN0O1xyXG5cclxuY2xhc3MgTGl0ZXJhbCBleHRlbmRzIFNlcXVlbGl6ZU1ldGhvZCB7XHJcbiAgY29uc3RydWN0b3IodmFsKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgdGhpcy52YWwgPSB2YWw7XHJcbiAgfVxyXG59XHJcbmV4cG9ydHMuTGl0ZXJhbCA9IExpdGVyYWw7XHJcblxyXG5jbGFzcyBKc29uIGV4dGVuZHMgU2VxdWVsaXplTWV0aG9kIHtcclxuICBjb25zdHJ1Y3Rvcihjb25kaXRpb25zT3JQYXRoLCB2YWx1ZSkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIGlmIChfLmlzT2JqZWN0KGNvbmRpdGlvbnNPclBhdGgpKSB7XHJcbiAgICAgIHRoaXMuY29uZGl0aW9ucyA9IGNvbmRpdGlvbnNPclBhdGg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnBhdGggPSBjb25kaXRpb25zT3JQYXRoO1xyXG4gICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuZXhwb3J0cy5Kc29uID0gSnNvbjtcclxuXHJcbmNsYXNzIFdoZXJlIGV4dGVuZHMgU2VxdWVsaXplTWV0aG9kIHtcclxuICBjb25zdHJ1Y3RvcihhdHRyaWJ1dGUsIGNvbXBhcmF0b3IsIGxvZ2ljKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgaWYgKGxvZ2ljID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgbG9naWMgPSBjb21wYXJhdG9yO1xyXG4gICAgICBjb21wYXJhdG9yID0gJz0nO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYXR0cmlidXRlID0gYXR0cmlidXRlO1xyXG4gICAgdGhpcy5jb21wYXJhdG9yID0gY29tcGFyYXRvcjtcclxuICAgIHRoaXMubG9naWMgPSBsb2dpYztcclxuICB9XHJcbn1cclxuZXhwb3J0cy5XaGVyZSA9IFdoZXJlO1xyXG5cclxuLy9Db2xsZWN0aW9uIG9mIGhlbHBlciBtZXRob2RzIHRvIG1ha2UgaXQgZWFzaWVyIHRvIHdvcmsgd2l0aCBzeW1ib2wgb3BlcmF0b3JzXHJcblxyXG4vKipcclxuICogZ2V0T3BlcmF0b3JzXHJcbiAqXHJcbiAqIEBwYXJhbSAge09iamVjdH0gb2JqXHJcbiAqIEByZXR1cm5zIHtBcnJheTxTeW1ib2w+fSBBbGwgb3BlcmF0b3JzIHByb3BlcnRpZXMgb2Ygb2JqXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPcGVyYXRvcnMob2JqKSB7XHJcbiAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqKS5maWx0ZXIocyA9PiBvcGVyYXRvcnNTZXQuaGFzKHMpKTtcclxufVxyXG5leHBvcnRzLmdldE9wZXJhdG9ycyA9IGdldE9wZXJhdG9ycztcclxuXHJcbi8qKlxyXG4gKiBnZXRDb21wbGV4S2V5c1xyXG4gKlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9ialxyXG4gKiBAcmV0dXJucyB7QXJyYXk8c3RyaW5nfFN5bWJvbD59IEFsbCBrZXlzIGluY2x1ZGluZyBvcGVyYXRvcnNcclxuICogQHByaXZhdGVcclxuICovXHJcbmZ1bmN0aW9uIGdldENvbXBsZXhLZXlzKG9iaikge1xyXG4gIHJldHVybiBnZXRPcGVyYXRvcnMob2JqKS5jb25jYXQoT2JqZWN0LmtleXMob2JqKSk7XHJcbn1cclxuZXhwb3J0cy5nZXRDb21wbGV4S2V5cyA9IGdldENvbXBsZXhLZXlzO1xyXG5cclxuLyoqXHJcbiAqIGdldENvbXBsZXhTaXplXHJcbiAqXHJcbiAqIEBwYXJhbSAge09iamVjdHxBcnJheX0gb2JqXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9ICAgICAgTGVuZ3RoIG9mIG9iamVjdCBwcm9wZXJ0aWVzIGluY2x1ZGluZyBvcGVyYXRvcnMgaWYgb2JqIGlzIGFycmF5IHJldHVybnMgaXRzIGxlbmd0aFxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0Q29tcGxleFNpemUob2JqKSB7XHJcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkob2JqKSA/IG9iai5sZW5ndGggOiBnZXRDb21wbGV4S2V5cyhvYmopLmxlbmd0aDtcclxufVxyXG5leHBvcnRzLmdldENvbXBsZXhTaXplID0gZ2V0Q29tcGxleFNpemU7XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0cnVlIGlmIGEgd2hlcmUgY2xhdXNlIGlzIGVtcHR5LCBldmVuIHdpdGggU3ltYm9sc1xyXG4gKlxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9ialxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICogQHByaXZhdGVcclxuICovXHJcbmZ1bmN0aW9uIGlzV2hlcmVFbXB0eShvYmopIHtcclxuICByZXR1cm4gISFvYmogJiYgXy5pc0VtcHR5KG9iaikgJiYgZ2V0T3BlcmF0b3JzKG9iaikubGVuZ3RoID09PSAwO1xyXG59XHJcbmV4cG9ydHMuaXNXaGVyZUVtcHR5ID0gaXNXaGVyZUVtcHR5O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgRU5VTSBuYW1lIGJ5IGpvaW5pbmcgdGFibGUgYW5kIGNvbHVtbiBuYW1lXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWJsZU5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbHVtbk5hbWVcclxuICogQHJldHVybnMge3N0cmluZ31cclxuICogQHByaXZhdGVcclxuICovXHJcbmZ1bmN0aW9uIGdlbmVyYXRlRW51bU5hbWUodGFibGVOYW1lLCBjb2x1bW5OYW1lKSB7XHJcbiAgcmV0dXJuIGBlbnVtXyR7dGFibGVOYW1lfV8ke2NvbHVtbk5hbWV9YDtcclxufVxyXG5leHBvcnRzLmdlbmVyYXRlRW51bU5hbWUgPSBnZW5lcmF0ZUVudW1OYW1lO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYW4gbmV3IE9iamVjdCB3aGljaCBrZXlzIGFyZSBjYW1lbGl6ZWRcclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IG9ialxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gY2FtZWxpemVPYmplY3RLZXlzKG9iaikge1xyXG4gIGNvbnN0IG5ld09iaiA9IG5ldyBPYmplY3QoKTtcclxuICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goa2V5ID0+IHtcclxuICAgIG5ld09ialtjYW1lbGl6ZShrZXkpXSA9IG9ialtrZXldO1xyXG4gIH0pO1xyXG4gIHJldHVybiBuZXdPYmo7XHJcbn1cclxuZXhwb3J0cy5jYW1lbGl6ZU9iamVjdEtleXMgPSBjYW1lbGl6ZU9iamVjdEtleXM7XHJcblxyXG4vKipcclxuICogQXNzaWducyBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHN0cmluZyBhbmQgc3ltYm9sIGtleWVkIHByb3BlcnRpZXMgb2Ygc291cmNlXHJcbiAqIG9iamVjdHMgdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cclxuICpcclxuICogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MvNC4xNy40I2RlZmF1bHRzXHJcbiAqXHJcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBtdXRhdGVzIGBvYmplY3RgLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXHJcbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBbc291cmNlc10gVGhlIHNvdXJjZSBvYmplY3RzLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gZGVmYXVsdHMob2JqZWN0LCAuLi5zb3VyY2VzKSB7XHJcbiAgb2JqZWN0ID0gT2JqZWN0KG9iamVjdCk7XHJcblxyXG4gIHNvdXJjZXMuZm9yRWFjaChzb3VyY2UgPT4ge1xyXG4gICAgaWYgKHNvdXJjZSkge1xyXG4gICAgICBzb3VyY2UgPSBPYmplY3Qoc291cmNlKTtcclxuXHJcbiAgICAgIGdldENvbXBsZXhLZXlzKHNvdXJjZSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gb2JqZWN0W2tleV07XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgdmFsdWUgPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICAgICAgICBfLmVxKHZhbHVlLCBPYmplY3QucHJvdG90eXBlW2tleV0pICYmXHJcbiAgICAgICAgICAgICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpXHJcblxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgb2JqZWN0W2tleV0gPSBzb3VyY2Vba2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gb2JqZWN0O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdHMgPSBkZWZhdWx0cztcclxuXHJcbi8qKlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gaW5kZXhcclxuICogQHBhcmFtIHtBcnJheX0gIGluZGV4LmZpZWxkc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2luZGV4Lm5hbWVdXHJcbiAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gdGFibGVOYW1lXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5mdW5jdGlvbiBuYW1lSW5kZXgoaW5kZXgsIHRhYmxlTmFtZSkge1xyXG4gIGlmICh0YWJsZU5hbWUudGFibGVOYW1lKSB0YWJsZU5hbWUgPSB0YWJsZU5hbWUudGFibGVOYW1lO1xyXG5cclxuICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChpbmRleCwgJ25hbWUnKSkge1xyXG4gICAgY29uc3QgZmllbGRzID0gaW5kZXguZmllbGRzLm1hcChcclxuICAgICAgZmllbGQgPT4gdHlwZW9mIGZpZWxkID09PSAnc3RyaW5nJyA/IGZpZWxkIDogZmllbGQubmFtZSB8fCBmaWVsZC5hdHRyaWJ1dGVcclxuICAgICk7XHJcbiAgICBpbmRleC5uYW1lID0gdW5kZXJzY29yZShgJHt0YWJsZU5hbWV9XyR7ZmllbGRzLmpvaW4oJ18nKX1gKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBpbmRleDtcclxufVxyXG5leHBvcnRzLm5hbWVJbmRleCA9IG5hbWVJbmRleDtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgMiBhcnJheXMgaW50ZXJzZWN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0FycmF5fSBhcnIxXHJcbiAqIEBwYXJhbSB7QXJyYXl9IGFycjJcclxuICogQHByaXZhdGVcclxuICovXHJcbmZ1bmN0aW9uIGludGVyc2VjdHMoYXJyMSwgYXJyMikge1xyXG4gIHJldHVybiBhcnIxLnNvbWUodiA9PiBhcnIyLmluY2x1ZGVzKHYpKTtcclxufVxyXG5leHBvcnRzLmludGVyc2VjdHMgPSBpbnRlcnNlY3RzO1xyXG4iXX0=