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