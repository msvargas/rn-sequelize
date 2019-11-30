'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const BaseError = require('./base-error');
/**
 * Validation Error. Thrown when the sequelize validation has failed. The error contains an `errors` property,
 * which is an array with 1 or more ValidationErrorItems, one for each validation that failed.
 *
 * @param {string} message Error message
 * @param {Array} [errors] Array of ValidationErrorItem objects describing the validation errors
 *
 * @property errors {ValidationErrorItems[]}
 */


let ValidationError =
/*#__PURE__*/
function (_BaseError) {
  _inherits(ValidationError, _BaseError);

  function ValidationError(message, errors) {
    var _this;

    _classCallCheck(this, ValidationError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ValidationError).call(this, message));
    _this.name = 'SequelizeValidationError';
    _this.message = 'Validation Error';
    /**
     *
     * @type {ValidationErrorItem[]}
     */

    _this.errors = errors || []; // Use provided error message if available...

    if (message) {
      _this.message = message; // ... otherwise create a concatenated message out of existing errors.
    } else if (_this.errors.length > 0 && _this.errors[0].message) {
      _this.message = _this.errors.map(err => `${err.type || err.origin}: ${err.message}`).join(',\n');
    }

    Error.captureStackTrace(_assertThisInitialized(_this), _this.constructor);
    return _this;
  }
  /**
   * Gets all validation error items for the path / field specified.
   *
   * @param {string} path The path to be checked for error items
   *
   * @returns {Array<ValidationErrorItem>} Validation error items for the specified path
   */


  _createClass(ValidationError, [{
    key: "get",
    value: function get(path) {
      return this.errors.reduce((reduced, error) => {
        if (error.path === path) {
          reduced.push(error);
        }

        return reduced;
      }, []);
    }
  }]);

  return ValidationError;
}(BaseError);
/**
 * Validation Error Item
 * Instances of this class are included in the `ValidationError.errors` property.
 */


let ValidationErrorItem =
/*#__PURE__*/
function () {
  /**
   * Creates new validation error item
   *
   * @param {string} message An error message
   * @param {string} type The type/origin of the validation error
   * @param {string} path The field that triggered the validation error
   * @param {string} value The value that generated the error
   * @param {Object} [inst] the DAO instance that caused the validation error
   * @param {Object} [validatorKey] a validation "key", used for identification
   * @param {string} [fnName] property name of the BUILT-IN validator function that caused the validation error (e.g. "in" or "len"), if applicable
   * @param {string} [fnArgs] parameters used with the BUILT-IN validator function, if applicable
   */
  function ValidationErrorItem(message, type, path, value, inst, validatorKey, fnName, fnArgs) {
    _classCallCheck(this, ValidationErrorItem);

    /**
     * An error message
     *
     * @type {string} message
     */
    this.message = message || '';
    /**
     * The type/origin of the validation error
     *
     * @type {string}
     */

    this.type = null;
    /**
     * The field that triggered the validation error
     *
     * @type {string}
     */

    this.path = path || null;
    /**
     * The value that generated the error
     *
     * @type {string}
     */

    this.value = value !== undefined ? value : null;
    this.origin = null;
    /**
     * The DAO instance that caused the validation error
     *
     * @type {Model}
     */

    this.instance = inst || null;
    /**
     * A validation "key", used for identification
     *
     * @type {string}
     */

    this.validatorKey = validatorKey || null;
    /**
     * Property name of the BUILT-IN validator function that caused the validation error (e.g. "in" or "len"), if applicable
     *
     * @type {string}
     */

    this.validatorName = fnName || null;
    /**
     * Parameters used with the BUILT-IN validator function, if applicable
     *
     * @type {string}
     */

    this.validatorArgs = fnArgs || [];

    if (type) {
      if (ValidationErrorItem.Origins[type]) {
        this.origin = type;
      } else {
        const lowercaseType = `${type}`.toLowerCase().trim();
        const realType = ValidationErrorItem.TypeStringMap[lowercaseType];

        if (realType && ValidationErrorItem.Origins[realType]) {
          this.origin = realType;
          this.type = type;
        }
      }
    } // This doesn't need captureStackTrace because it's not a subclass of Error

  }
  /**
   * return a lowercase, trimmed string "key" that identifies the validator.
   *
   * Note: the string will be empty if the instance has neither a valid `validatorKey` property nor a valid `validatorName` property
   *
   * @param   {boolean} [useTypeAsNS=true]      controls whether the returned value is "namespace",
   *                                            this parameter is ignored if the validator's `type` is not one of ValidationErrorItem.Origins
   * @param   {string}  [NSSeparator='.']       a separator string for concatenating the namespace, must be not be empty,
   *                                            defaults to "." (fullstop). only used and validated if useTypeAsNS is TRUE.
   * @throws  {Error}                           thrown if NSSeparator is found to be invalid.
   * @returns  {string}
   *
   * @private
   */


  _createClass(ValidationErrorItem, [{
    key: "getValidatorKey",
    value: function getValidatorKey(useTypeAsNS, NSSeparator) {
      const useTANS = useTypeAsNS === undefined || !!useTypeAsNS;
      const NSSep = NSSeparator === undefined ? '.' : NSSeparator;
      const type = this.origin;
      const key = this.validatorKey || this.validatorName;
      const useNS = useTANS && type && ValidationErrorItem.Origins[type];

      if (useNS && (typeof NSSep !== 'string' || !NSSep.length)) {
        throw new Error('Invalid namespace separator given, must be a non-empty string');
      }

      if (!(typeof key === 'string' && key.length)) {
        return '';
      }

      return (useNS ? [type, key].join(NSSep) : key).toLowerCase().trim();
    }
  }]);

  return ValidationErrorItem;
}();
/**
 * An enum that defines valid ValidationErrorItem `origin` values
 *
 * @type {Object}
 * @property CORE       {string}  specifies errors that originate from the sequelize "core"
 * @property DB         {string}  specifies validation errors that originate from the storage engine
 * @property FUNCTION   {string}  specifies validation errors that originate from validator functions (both built-in and custom) defined for a given attribute
 */


ValidationErrorItem.Origins = {
  CORE: 'CORE',
  DB: 'DB',
  FUNCTION: 'FUNCTION'
};
/**
 * An object that is used internally by the `ValidationErrorItem` class
 * that maps current `type` strings (as given to ValidationErrorItem.constructor()) to
 * our new `origin` values.
 *
 * @type {Object}
 */

ValidationErrorItem.TypeStringMap = {
  'notnull violation': 'CORE',
  'string violation': 'CORE',
  'unique violation': 'DB',
  'validation error': 'FUNCTION'
};
module.exports = ValidationError;
module.exports.ValidationErrorItem = ValidationErrorItem;