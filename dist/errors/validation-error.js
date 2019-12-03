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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvdmFsaWRhdGlvbi1lcnJvci5qcyJdLCJuYW1lcyI6WyJCYXNlRXJyb3IiLCJyZXF1aXJlIiwiVmFsaWRhdGlvbkVycm9yIiwibWVzc2FnZSIsImVycm9ycyIsIm5hbWUiLCJsZW5ndGgiLCJtYXAiLCJlcnIiLCJ0eXBlIiwib3JpZ2luIiwiam9pbiIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsInBhdGgiLCJyZWR1Y2UiLCJyZWR1Y2VkIiwiZXJyb3IiLCJwdXNoIiwiVmFsaWRhdGlvbkVycm9ySXRlbSIsInZhbHVlIiwiaW5zdCIsInZhbGlkYXRvcktleSIsImZuTmFtZSIsImZuQXJncyIsInVuZGVmaW5lZCIsImluc3RhbmNlIiwidmFsaWRhdG9yTmFtZSIsInZhbGlkYXRvckFyZ3MiLCJPcmlnaW5zIiwibG93ZXJjYXNlVHlwZSIsInRvTG93ZXJDYXNlIiwidHJpbSIsInJlYWxUeXBlIiwiVHlwZVN0cmluZ01hcCIsInVzZVR5cGVBc05TIiwiTlNTZXBhcmF0b3IiLCJ1c2VUQU5TIiwiTlNTZXAiLCJrZXkiLCJ1c2VOUyIsIkNPUkUiLCJEQiIsIkZVTkNUSU9OIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLFNBQVMsR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBekI7QUFFQTs7Ozs7Ozs7Ozs7SUFTTUMsZTs7Ozs7QUFDSiwyQkFBWUMsT0FBWixFQUFxQkMsTUFBckIsRUFBNkI7QUFBQTs7QUFBQTs7QUFDM0IseUZBQU1ELE9BQU47QUFDQSxVQUFLRSxJQUFMLEdBQVksMEJBQVo7QUFDQSxVQUFLRixPQUFMLEdBQWUsa0JBQWY7QUFDQTs7Ozs7QUFJQSxVQUFLQyxNQUFMLEdBQWNBLE1BQU0sSUFBSSxFQUF4QixDQVIyQixDQVUzQjs7QUFDQSxRQUFJRCxPQUFKLEVBQWE7QUFDWCxZQUFLQSxPQUFMLEdBQWVBLE9BQWYs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cXVpcmUoJy4vYmFzZS1lcnJvcicpO1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRpb24gRXJyb3IuIFRocm93biB3aGVuIHRoZSBzZXF1ZWxpemUgdmFsaWRhdGlvbiBoYXMgZmFpbGVkLiBUaGUgZXJyb3IgY29udGFpbnMgYW4gYGVycm9yc2AgcHJvcGVydHksXHJcbiAqIHdoaWNoIGlzIGFuIGFycmF5IHdpdGggMSBvciBtb3JlIFZhbGlkYXRpb25FcnJvckl0ZW1zLCBvbmUgZm9yIGVhY2ggdmFsaWRhdGlvbiB0aGF0IGZhaWxlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgRXJyb3IgbWVzc2FnZVxyXG4gKiBAcGFyYW0ge0FycmF5fSBbZXJyb3JzXSBBcnJheSBvZiBWYWxpZGF0aW9uRXJyb3JJdGVtIG9iamVjdHMgZGVzY3JpYmluZyB0aGUgdmFsaWRhdGlvbiBlcnJvcnNcclxuICpcclxuICogQHByb3BlcnR5IGVycm9ycyB7VmFsaWRhdGlvbkVycm9ySXRlbXNbXX1cclxuICovXHJcbmNsYXNzIFZhbGlkYXRpb25FcnJvciBleHRlbmRzIEJhc2VFcnJvciB7XHJcbiAgY29uc3RydWN0b3IobWVzc2FnZSwgZXJyb3JzKSB7XHJcbiAgICBzdXBlcihtZXNzYWdlKTtcclxuICAgIHRoaXMubmFtZSA9ICdTZXF1ZWxpemVWYWxpZGF0aW9uRXJyb3InO1xyXG4gICAgdGhpcy5tZXNzYWdlID0gJ1ZhbGlkYXRpb24gRXJyb3InO1xyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge1ZhbGlkYXRpb25FcnJvckl0ZW1bXX1cclxuICAgICAqL1xyXG4gICAgdGhpcy5lcnJvcnMgPSBlcnJvcnMgfHwgW107XHJcblxyXG4gICAgLy8gVXNlIHByb3ZpZGVkIGVycm9yIG1lc3NhZ2UgaWYgYXZhaWxhYmxlLi4uXHJcbiAgICBpZiAobWVzc2FnZSkge1xyXG4gICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xyXG5cclxuICAgICAgLy8gLi4uIG90aGVyd2lzZSBjcmVhdGUgYSBjb25jYXRlbmF0ZWQgbWVzc2FnZSBvdXQgb2YgZXhpc3RpbmcgZXJyb3JzLlxyXG4gICAgfSBlbHNlIGlmICh0aGlzLmVycm9ycy5sZW5ndGggPiAwICYmIHRoaXMuZXJyb3JzWzBdLm1lc3NhZ2UpIHtcclxuICAgICAgdGhpcy5tZXNzYWdlID0gdGhpcy5lcnJvcnMubWFwKGVyciA9PiBgJHtlcnIudHlwZSB8fCBlcnIub3JpZ2lufTogJHtlcnIubWVzc2FnZX1gKS5qb2luKCcsXFxuJyk7XHJcbiAgICB9XHJcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgYWxsIHZhbGlkYXRpb24gZXJyb3IgaXRlbXMgZm9yIHRoZSBwYXRoIC8gZmllbGQgc3BlY2lmaWVkLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggVGhlIHBhdGggdG8gYmUgY2hlY2tlZCBmb3IgZXJyb3IgaXRlbXNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtBcnJheTxWYWxpZGF0aW9uRXJyb3JJdGVtPn0gVmFsaWRhdGlvbiBlcnJvciBpdGVtcyBmb3IgdGhlIHNwZWNpZmllZCBwYXRoXHJcbiAgICovXHJcbiAgZ2V0KHBhdGgpIHtcclxuICAgIHJldHVybiB0aGlzLmVycm9ycy5yZWR1Y2UoKHJlZHVjZWQsIGVycm9yKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvci5wYXRoID09PSBwYXRoKSB7XHJcbiAgICAgICAgcmVkdWNlZC5wdXNoKGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVkdWNlZDtcclxuICAgIH0sIFtdKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0aW9uIEVycm9yIEl0ZW1cclxuICogSW5zdGFuY2VzIG9mIHRoaXMgY2xhc3MgYXJlIGluY2x1ZGVkIGluIHRoZSBgVmFsaWRhdGlvbkVycm9yLmVycm9yc2AgcHJvcGVydHkuXHJcbiAqL1xyXG5jbGFzcyBWYWxpZGF0aW9uRXJyb3JJdGVtIHtcclxuICAvKipcclxuICAgKiBDcmVhdGVzIG5ldyB2YWxpZGF0aW9uIGVycm9yIGl0ZW1cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIEFuIGVycm9yIG1lc3NhZ2VcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBUaGUgdHlwZS9vcmlnaW4gb2YgdGhlIHZhbGlkYXRpb24gZXJyb3JcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZmllbGQgdGhhdCB0cmlnZ2VyZWQgdGhlIHZhbGlkYXRpb24gZXJyb3JcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIHZhbHVlIHRoYXQgZ2VuZXJhdGVkIHRoZSBlcnJvclxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbaW5zdF0gdGhlIERBTyBpbnN0YW5jZSB0aGF0IGNhdXNlZCB0aGUgdmFsaWRhdGlvbiBlcnJvclxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbdmFsaWRhdG9yS2V5XSBhIHZhbGlkYXRpb24gXCJrZXlcIiwgdXNlZCBmb3IgaWRlbnRpZmljYXRpb25cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2ZuTmFtZV0gcHJvcGVydHkgbmFtZSBvZiB0aGUgQlVJTFQtSU4gdmFsaWRhdG9yIGZ1bmN0aW9uIHRoYXQgY2F1c2VkIHRoZSB2YWxpZGF0aW9uIGVycm9yIChlLmcuIFwiaW5cIiBvciBcImxlblwiKSwgaWYgYXBwbGljYWJsZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbZm5BcmdzXSBwYXJhbWV0ZXJzIHVzZWQgd2l0aCB0aGUgQlVJTFQtSU4gdmFsaWRhdG9yIGZ1bmN0aW9uLCBpZiBhcHBsaWNhYmxlXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IobWVzc2FnZSwgdHlwZSwgcGF0aCwgdmFsdWUsIGluc3QsIHZhbGlkYXRvcktleSwgZm5OYW1lLCBmbkFyZ3MpIHtcclxuICAgIC8qKlxyXG4gICAgICogQW4gZXJyb3IgbWVzc2FnZVxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9IG1lc3NhZ2VcclxuICAgICAqL1xyXG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCAnJztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB0eXBlL29yaWdpbiBvZiB0aGUgdmFsaWRhdGlvbiBlcnJvclxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHRoaXMudHlwZSA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZmllbGQgdGhhdCB0cmlnZ2VyZWQgdGhlIHZhbGlkYXRpb24gZXJyb3JcclxuICAgICAqXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB0aGlzLnBhdGggPSBwYXRoIHx8IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgdmFsdWUgdGhhdCBnZW5lcmF0ZWQgdGhlIGVycm9yXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlICE9PSB1bmRlZmluZWQgPyB2YWx1ZSA6IG51bGw7XHJcblxyXG4gICAgdGhpcy5vcmlnaW4gPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIERBTyBpbnN0YW5jZSB0aGF0IGNhdXNlZCB0aGUgdmFsaWRhdGlvbiBlcnJvclxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtNb2RlbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5pbnN0YW5jZSA9IGluc3QgfHwgbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEEgdmFsaWRhdGlvbiBcImtleVwiLCB1c2VkIGZvciBpZGVudGlmaWNhdGlvblxyXG4gICAgICpcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHRoaXMudmFsaWRhdG9yS2V5ID0gdmFsaWRhdG9yS2V5IHx8IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQcm9wZXJ0eSBuYW1lIG9mIHRoZSBCVUlMVC1JTiB2YWxpZGF0b3IgZnVuY3Rpb24gdGhhdCBjYXVzZWQgdGhlIHZhbGlkYXRpb24gZXJyb3IgKGUuZy4gXCJpblwiIG9yIFwibGVuXCIpLCBpZiBhcHBsaWNhYmxlXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgdGhpcy52YWxpZGF0b3JOYW1lID0gZm5OYW1lIHx8IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJhbWV0ZXJzIHVzZWQgd2l0aCB0aGUgQlVJTFQtSU4gdmFsaWRhdG9yIGZ1bmN0aW9uLCBpZiBhcHBsaWNhYmxlXHJcbiAgICAgKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgdGhpcy52YWxpZGF0b3JBcmdzID0gZm5BcmdzIHx8IFtdO1xyXG5cclxuICAgIGlmICh0eXBlKSB7XHJcbiAgICAgIGlmIChWYWxpZGF0aW9uRXJyb3JJdGVtLk9yaWdpbnNbIHR5cGUgXSkge1xyXG4gICAgICAgIHRoaXMub3JpZ2luID0gdHlwZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zdCBsb3dlcmNhc2VUeXBlID0gYCR7dHlwZX1gLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xyXG4gICAgICAgIGNvbnN0IHJlYWxUeXBlID0gVmFsaWRhdGlvbkVycm9ySXRlbS5UeXBlU3RyaW5nTWFwWyBsb3dlcmNhc2VUeXBlIF07XHJcblxyXG4gICAgICAgIGlmIChyZWFsVHlwZSAmJiBWYWxpZGF0aW9uRXJyb3JJdGVtLk9yaWdpbnNbIHJlYWxUeXBlIF0pIHtcclxuICAgICAgICAgIHRoaXMub3JpZ2luID0gcmVhbFR5cGU7XHJcbiAgICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFRoaXMgZG9lc24ndCBuZWVkIGNhcHR1cmVTdGFja1RyYWNlIGJlY2F1c2UgaXQncyBub3QgYSBzdWJjbGFzcyBvZiBFcnJvclxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogcmV0dXJuIGEgbG93ZXJjYXNlLCB0cmltbWVkIHN0cmluZyBcImtleVwiIHRoYXQgaWRlbnRpZmllcyB0aGUgdmFsaWRhdG9yLlxyXG4gICAqXHJcbiAgICogTm90ZTogdGhlIHN0cmluZyB3aWxsIGJlIGVtcHR5IGlmIHRoZSBpbnN0YW5jZSBoYXMgbmVpdGhlciBhIHZhbGlkIGB2YWxpZGF0b3JLZXlgIHByb3BlcnR5IG5vciBhIHZhbGlkIGB2YWxpZGF0b3JOYW1lYCBwcm9wZXJ0eVxyXG4gICAqXHJcbiAgICogQHBhcmFtICAge2Jvb2xlYW59IFt1c2VUeXBlQXNOUz10cnVlXSAgICAgIGNvbnRyb2xzIHdoZXRoZXIgdGhlIHJldHVybmVkIHZhbHVlIGlzIFwibmFtZXNwYWNlXCIsXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaWYgdGhlIHZhbGlkYXRvcidzIGB0eXBlYCBpcyBub3Qgb25lIG9mIFZhbGlkYXRpb25FcnJvckl0ZW0uT3JpZ2luc1xyXG4gICAqIEBwYXJhbSAgIHtzdHJpbmd9ICBbTlNTZXBhcmF0b3I9Jy4nXSAgICAgICBhIHNlcGFyYXRvciBzdHJpbmcgZm9yIGNvbmNhdGVuYXRpbmcgdGhlIG5hbWVzcGFjZSwgbXVzdCBiZSBub3QgYmUgZW1wdHksXHJcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRzIHRvIFwiLlwiIChmdWxsc3RvcCkuIG9ubHkgdXNlZCBhbmQgdmFsaWRhdGVkIGlmIHVzZVR5cGVBc05TIGlzIFRSVUUuXHJcbiAgICogQHRocm93cyAge0Vycm9yfSAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93biBpZiBOU1NlcGFyYXRvciBpcyBmb3VuZCB0byBiZSBpbnZhbGlkLlxyXG4gICAqIEByZXR1cm5zICB7c3RyaW5nfVxyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBnZXRWYWxpZGF0b3JLZXkodXNlVHlwZUFzTlMsIE5TU2VwYXJhdG9yKSB7XHJcbiAgICBjb25zdCB1c2VUQU5TID0gdXNlVHlwZUFzTlMgPT09IHVuZGVmaW5lZCB8fCAhIXVzZVR5cGVBc05TO1xyXG4gICAgY29uc3QgTlNTZXAgPSBOU1NlcGFyYXRvciA9PT0gdW5kZWZpbmVkID8gJy4nIDogTlNTZXBhcmF0b3I7XHJcblxyXG4gICAgY29uc3QgdHlwZSA9IHRoaXMub3JpZ2luO1xyXG4gICAgY29uc3Qga2V5ID0gdGhpcy52YWxpZGF0b3JLZXkgfHwgdGhpcy52YWxpZGF0b3JOYW1lO1xyXG4gICAgY29uc3QgdXNlTlMgPSB1c2VUQU5TICYmIHR5cGUgJiYgVmFsaWRhdGlvbkVycm9ySXRlbS5PcmlnaW5zWyB0eXBlIF07XHJcblxyXG4gICAgaWYgKHVzZU5TICYmICh0eXBlb2YgTlNTZXAgIT09ICdzdHJpbmcnIHx8ICFOU1NlcC5sZW5ndGgpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBuYW1lc3BhY2Ugc2VwYXJhdG9yIGdpdmVuLCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZycpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIGtleS5sZW5ndGgpKSB7XHJcbiAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKHVzZU5TID8gW3R5cGUsIGtleV0uam9pbihOU1NlcCkgOiBrZXkpLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEFuIGVudW0gdGhhdCBkZWZpbmVzIHZhbGlkIFZhbGlkYXRpb25FcnJvckl0ZW0gYG9yaWdpbmAgdmFsdWVzXHJcbiAqXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqIEBwcm9wZXJ0eSBDT1JFICAgICAgIHtzdHJpbmd9ICBzcGVjaWZpZXMgZXJyb3JzIHRoYXQgb3JpZ2luYXRlIGZyb20gdGhlIHNlcXVlbGl6ZSBcImNvcmVcIlxyXG4gKiBAcHJvcGVydHkgREIgICAgICAgICB7c3RyaW5nfSAgc3BlY2lmaWVzIHZhbGlkYXRpb24gZXJyb3JzIHRoYXQgb3JpZ2luYXRlIGZyb20gdGhlIHN0b3JhZ2UgZW5naW5lXHJcbiAqIEBwcm9wZXJ0eSBGVU5DVElPTiAgIHtzdHJpbmd9ICBzcGVjaWZpZXMgdmFsaWRhdGlvbiBlcnJvcnMgdGhhdCBvcmlnaW5hdGUgZnJvbSB2YWxpZGF0b3IgZnVuY3Rpb25zIChib3RoIGJ1aWx0LWluIGFuZCBjdXN0b20pIGRlZmluZWQgZm9yIGEgZ2l2ZW4gYXR0cmlidXRlXHJcbiAqL1xyXG5WYWxpZGF0aW9uRXJyb3JJdGVtLk9yaWdpbnMgPSB7XHJcbiAgQ09SRTogJ0NPUkUnLFxyXG4gIERCOiAnREInLFxyXG4gIEZVTkNUSU9OOiAnRlVOQ1RJT04nXHJcbn07XHJcblxyXG4vKipcclxuICogQW4gb2JqZWN0IHRoYXQgaXMgdXNlZCBpbnRlcm5hbGx5IGJ5IHRoZSBgVmFsaWRhdGlvbkVycm9ySXRlbWAgY2xhc3NcclxuICogdGhhdCBtYXBzIGN1cnJlbnQgYHR5cGVgIHN0cmluZ3MgKGFzIGdpdmVuIHRvIFZhbGlkYXRpb25FcnJvckl0ZW0uY29uc3RydWN0b3IoKSkgdG9cclxuICogb3VyIG5ldyBgb3JpZ2luYCB2YWx1ZXMuXHJcbiAqXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqL1xyXG5WYWxpZGF0aW9uRXJyb3JJdGVtLlR5cGVTdHJpbmdNYXAgPSB7XHJcbiAgJ25vdG51bGwgdmlvbGF0aW9uJzogJ0NPUkUnLFxyXG4gICdzdHJpbmcgdmlvbGF0aW9uJzogJ0NPUkUnLFxyXG4gICd1bmlxdWUgdmlvbGF0aW9uJzogJ0RCJyxcclxuICAndmFsaWRhdGlvbiBlcnJvcic6ICdGVU5DVElPTidcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVmFsaWRhdGlvbkVycm9yO1xyXG5tb2R1bGUuZXhwb3J0cy5WYWxpZGF0aW9uRXJyb3JJdGVtID0gVmFsaWRhdGlvbkVycm9ySXRlbTtcclxuIl19