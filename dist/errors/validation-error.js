'use strict';

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


let ValidationError = /*#__PURE__*/function (_BaseError) {
  _inherits(ValidationError, _BaseError);

  var _super = _createSuper(ValidationError);

  function ValidationError(message, errors) {
    var _this;

    _classCallCheck(this, ValidationError);

    _this = _super.call(this, message);
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


let ValidationErrorItem = /*#__PURE__*/function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9lcnJvcnMvdmFsaWRhdGlvbi1lcnJvci5qcyJdLCJuYW1lcyI6WyJCYXNlRXJyb3IiLCJyZXF1aXJlIiwiVmFsaWRhdGlvbkVycm9yIiwibWVzc2FnZSIsImVycm9ycyIsIm5hbWUiLCJsZW5ndGgiLCJtYXAiLCJlcnIiLCJ0eXBlIiwib3JpZ2luIiwiam9pbiIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJjb25zdHJ1Y3RvciIsInBhdGgiLCJyZWR1Y2UiLCJyZWR1Y2VkIiwiZXJyb3IiLCJwdXNoIiwiVmFsaWRhdGlvbkVycm9ySXRlbSIsInZhbHVlIiwiaW5zdCIsInZhbGlkYXRvcktleSIsImZuTmFtZSIsImZuQXJncyIsInVuZGVmaW5lZCIsImluc3RhbmNlIiwidmFsaWRhdG9yTmFtZSIsInZhbGlkYXRvckFyZ3MiLCJPcmlnaW5zIiwibG93ZXJjYXNlVHlwZSIsInRvTG93ZXJDYXNlIiwidHJpbSIsInJlYWxUeXBlIiwiVHlwZVN0cmluZ01hcCIsInVzZVR5cGVBc05TIiwiTlNTZXBhcmF0b3IiLCJ1c2VUQU5TIiwiTlNTZXAiLCJrZXkiLCJ1c2VOUyIsIkNPUkUiLCJEQiIsIkZVTkNUSU9OIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxTQUFTLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQXpCO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7SUFDTUMsZTs7Ozs7QUFDSiwyQkFBWUMsT0FBWixFQUFxQkMsTUFBckIsRUFBNkI7QUFBQTs7QUFBQTs7QUFDM0IsOEJBQU1ELE9BQU47QUFDQSxVQUFLRSxJQUFMLEdBQVksMEJBQVo7QUFDQSxVQUFLRixPQUFMLEdBQWUsa0JBQWY7QUFDQTtBQUNKO0FBQ0E7QUFDQTs7QUFDSSxVQUFLQyxNQUFMLEdBQWNBLE1BQU0sSUFBSSxFQUF4QixDQVIyQixDQVUzQjs7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O0FBRTVCQyxFQUFBQSxFQUFFLEVBQUUsSUFGd0I7QUFHNUJDLEVBQUFBLFFBQVEsRUFBRTtBQUhrQixDQUE5QjtBQU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBeEIsbUJBQW1CLENBQUNlLGFBQXBCLEdBQW9DO0FBQ2xDLHVCQUFxQixNQURhO0FBRWxDLHNCQUFvQixNQUZjO0FBR2xDLHNCQUFvQixJQUhjO0FBSWxDLHNCQUFvQjtBQUpjLENBQXBDO0FBT0FVLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjVDLGVBQWpCO0FBQ0EyQyxNQUFNLENBQUNDLE9BQVAsQ0FBZTFCLG1CQUFmLEdBQXFDQSxtQkFBckMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IEJhc2VFcnJvciA9IHJlcXVpcmUoJy4vYmFzZS1lcnJvcicpO1xuXG4vKipcbiAqIFZhbGlkYXRpb24gRXJyb3IuIFRocm93biB3aGVuIHRoZSBzZXF1ZWxpemUgdmFsaWRhdGlvbiBoYXMgZmFpbGVkLiBUaGUgZXJyb3IgY29udGFpbnMgYW4gYGVycm9yc2AgcHJvcGVydHksXG4gKiB3aGljaCBpcyBhbiBhcnJheSB3aXRoIDEgb3IgbW9yZSBWYWxpZGF0aW9uRXJyb3JJdGVtcywgb25lIGZvciBlYWNoIHZhbGlkYXRpb24gdGhhdCBmYWlsZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgRXJyb3IgbWVzc2FnZVxuICogQHBhcmFtIHtBcnJheX0gW2Vycm9yc10gQXJyYXkgb2YgVmFsaWRhdGlvbkVycm9ySXRlbSBvYmplY3RzIGRlc2NyaWJpbmcgdGhlIHZhbGlkYXRpb24gZXJyb3JzXG4gKlxuICogQHByb3BlcnR5IGVycm9ycyB7VmFsaWRhdGlvbkVycm9ySXRlbXNbXX1cbiAqL1xuY2xhc3MgVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgQmFzZUVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZSwgZXJyb3JzKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ1NlcXVlbGl6ZVZhbGlkYXRpb25FcnJvcic7XG4gICAgdGhpcy5tZXNzYWdlID0gJ1ZhbGlkYXRpb24gRXJyb3InO1xuICAgIC8qKlxuICAgICAqXG4gICAgICogQHR5cGUge1ZhbGlkYXRpb25FcnJvckl0ZW1bXX1cbiAgICAgKi9cbiAgICB0aGlzLmVycm9ycyA9IGVycm9ycyB8fCBbXTtcblxuICAgIC8vIFVzZSBwcm92aWRlZCBlcnJvciBtZXNzYWdlIGlmIGF2YWlsYWJsZS4uLlxuICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXG4gICAgICAvLyAuLi4gb3RoZXJ3aXNlIGNyZWF0ZSBhIGNvbmNhdGVuYXRlZCBtZXNzYWdlIG91dCBvZiBleGlzdGluZyBlcnJvcnMuXG4gICAgfSBlbHNlIGlmICh0aGlzLmVycm9ycy5sZW5ndGggPiAwICYmIHRoaXMuZXJyb3JzWzBdLm1lc3NhZ2UpIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9IHRoaXMuZXJyb3JzLm1hcChlcnIgPT4gYCR7ZXJyLnR5cGUgfHwgZXJyLm9yaWdpbn06ICR7ZXJyLm1lc3NhZ2V9YCkuam9pbignLFxcbicpO1xuICAgIH1cbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCB2YWxpZGF0aW9uIGVycm9yIGl0ZW1zIGZvciB0aGUgcGF0aCAvIGZpZWxkIHNwZWNpZmllZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggVGhlIHBhdGggdG8gYmUgY2hlY2tlZCBmb3IgZXJyb3IgaXRlbXNcbiAgICpcbiAgICogQHJldHVybnMge0FycmF5PFZhbGlkYXRpb25FcnJvckl0ZW0+fSBWYWxpZGF0aW9uIGVycm9yIGl0ZW1zIGZvciB0aGUgc3BlY2lmaWVkIHBhdGhcbiAgICovXG4gIGdldChwYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuZXJyb3JzLnJlZHVjZSgocmVkdWNlZCwgZXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvci5wYXRoID09PSBwYXRoKSB7XG4gICAgICAgIHJlZHVjZWQucHVzaChlcnJvcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVkdWNlZDtcbiAgICB9LCBbXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0aW9uIEVycm9yIEl0ZW1cbiAqIEluc3RhbmNlcyBvZiB0aGlzIGNsYXNzIGFyZSBpbmNsdWRlZCBpbiB0aGUgYFZhbGlkYXRpb25FcnJvci5lcnJvcnNgIHByb3BlcnR5LlxuICovXG5jbGFzcyBWYWxpZGF0aW9uRXJyb3JJdGVtIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgbmV3IHZhbGlkYXRpb24gZXJyb3IgaXRlbVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBBbiBlcnJvciBtZXNzYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIFRoZSB0eXBlL29yaWdpbiBvZiB0aGUgdmFsaWRhdGlvbiBlcnJvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZmllbGQgdGhhdCB0cmlnZ2VyZWQgdGhlIHZhbGlkYXRpb24gZXJyb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFRoZSB2YWx1ZSB0aGF0IGdlbmVyYXRlZCB0aGUgZXJyb3JcbiAgICogQHBhcmFtIHtPYmplY3R9IFtpbnN0XSB0aGUgREFPIGluc3RhbmNlIHRoYXQgY2F1c2VkIHRoZSB2YWxpZGF0aW9uIGVycm9yXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbdmFsaWRhdG9yS2V5XSBhIHZhbGlkYXRpb24gXCJrZXlcIiwgdXNlZCBmb3IgaWRlbnRpZmljYXRpb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtmbk5hbWVdIHByb3BlcnR5IG5hbWUgb2YgdGhlIEJVSUxULUlOIHZhbGlkYXRvciBmdW5jdGlvbiB0aGF0IGNhdXNlZCB0aGUgdmFsaWRhdGlvbiBlcnJvciAoZS5nLiBcImluXCIgb3IgXCJsZW5cIiksIGlmIGFwcGxpY2FibGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtmbkFyZ3NdIHBhcmFtZXRlcnMgdXNlZCB3aXRoIHRoZSBCVUlMVC1JTiB2YWxpZGF0b3IgZnVuY3Rpb24sIGlmIGFwcGxpY2FibGVcbiAgICovXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIHR5cGUsIHBhdGgsIHZhbHVlLCBpbnN0LCB2YWxpZGF0b3JLZXksIGZuTmFtZSwgZm5BcmdzKSB7XG4gICAgLyoqXG4gICAgICogQW4gZXJyb3IgbWVzc2FnZVxuICAgICAqXG4gICAgICogQHR5cGUge3N0cmluZ30gbWVzc2FnZVxuICAgICAqL1xuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgfHwgJyc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdHlwZS9vcmlnaW4gb2YgdGhlIHZhbGlkYXRpb24gZXJyb3JcbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy50eXBlID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBmaWVsZCB0aGF0IHRyaWdnZXJlZCB0aGUgdmFsaWRhdGlvbiBlcnJvclxuICAgICAqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLnBhdGggPSBwYXRoIHx8IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmFsdWUgdGhhdCBnZW5lcmF0ZWQgdGhlIGVycm9yXG4gICAgICpcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZSAhPT0gdW5kZWZpbmVkID8gdmFsdWUgOiBudWxsO1xuXG4gICAgdGhpcy5vcmlnaW4gPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogVGhlIERBTyBpbnN0YW5jZSB0aGF0IGNhdXNlZCB0aGUgdmFsaWRhdGlvbiBlcnJvclxuICAgICAqXG4gICAgICogQHR5cGUge01vZGVsfVxuICAgICAqL1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0IHx8IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBBIHZhbGlkYXRpb24gXCJrZXlcIiwgdXNlZCBmb3IgaWRlbnRpZmljYXRpb25cbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy52YWxpZGF0b3JLZXkgPSB2YWxpZGF0b3JLZXkgfHwgbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFByb3BlcnR5IG5hbWUgb2YgdGhlIEJVSUxULUlOIHZhbGlkYXRvciBmdW5jdGlvbiB0aGF0IGNhdXNlZCB0aGUgdmFsaWRhdGlvbiBlcnJvciAoZS5nLiBcImluXCIgb3IgXCJsZW5cIiksIGlmIGFwcGxpY2FibGVcbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy52YWxpZGF0b3JOYW1lID0gZm5OYW1lIHx8IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBQYXJhbWV0ZXJzIHVzZWQgd2l0aCB0aGUgQlVJTFQtSU4gdmFsaWRhdG9yIGZ1bmN0aW9uLCBpZiBhcHBsaWNhYmxlXG4gICAgICpcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMudmFsaWRhdG9yQXJncyA9IGZuQXJncyB8fCBbXTtcblxuICAgIGlmICh0eXBlKSB7XG4gICAgICBpZiAoVmFsaWRhdGlvbkVycm9ySXRlbS5PcmlnaW5zWyB0eXBlIF0pIHtcbiAgICAgICAgdGhpcy5vcmlnaW4gPSB0eXBlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbG93ZXJjYXNlVHlwZSA9IGAke3R5cGV9YC50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgICAgY29uc3QgcmVhbFR5cGUgPSBWYWxpZGF0aW9uRXJyb3JJdGVtLlR5cGVTdHJpbmdNYXBbIGxvd2VyY2FzZVR5cGUgXTtcblxuICAgICAgICBpZiAocmVhbFR5cGUgJiYgVmFsaWRhdGlvbkVycm9ySXRlbS5PcmlnaW5zWyByZWFsVHlwZSBdKSB7XG4gICAgICAgICAgdGhpcy5vcmlnaW4gPSByZWFsVHlwZTtcbiAgICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhpcyBkb2Vzbid0IG5lZWQgY2FwdHVyZVN0YWNrVHJhY2UgYmVjYXVzZSBpdCdzIG5vdCBhIHN1YmNsYXNzIG9mIEVycm9yXG4gIH1cblxuICAvKipcbiAgICogcmV0dXJuIGEgbG93ZXJjYXNlLCB0cmltbWVkIHN0cmluZyBcImtleVwiIHRoYXQgaWRlbnRpZmllcyB0aGUgdmFsaWRhdG9yLlxuICAgKlxuICAgKiBOb3RlOiB0aGUgc3RyaW5nIHdpbGwgYmUgZW1wdHkgaWYgdGhlIGluc3RhbmNlIGhhcyBuZWl0aGVyIGEgdmFsaWQgYHZhbGlkYXRvcktleWAgcHJvcGVydHkgbm9yIGEgdmFsaWQgYHZhbGlkYXRvck5hbWVgIHByb3BlcnR5XG4gICAqXG4gICAqIEBwYXJhbSAgIHtib29sZWFufSBbdXNlVHlwZUFzTlM9dHJ1ZV0gICAgICBjb250cm9scyB3aGV0aGVyIHRoZSByZXR1cm5lZCB2YWx1ZSBpcyBcIm5hbWVzcGFjZVwiLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcyBwYXJhbWV0ZXIgaXMgaWdub3JlZCBpZiB0aGUgdmFsaWRhdG9yJ3MgYHR5cGVgIGlzIG5vdCBvbmUgb2YgVmFsaWRhdGlvbkVycm9ySXRlbS5PcmlnaW5zXG4gICAqIEBwYXJhbSAgIHtzdHJpbmd9ICBbTlNTZXBhcmF0b3I9Jy4nXSAgICAgICBhIHNlcGFyYXRvciBzdHJpbmcgZm9yIGNvbmNhdGVuYXRpbmcgdGhlIG5hbWVzcGFjZSwgbXVzdCBiZSBub3QgYmUgZW1wdHksXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0cyB0byBcIi5cIiAoZnVsbHN0b3ApLiBvbmx5IHVzZWQgYW5kIHZhbGlkYXRlZCBpZiB1c2VUeXBlQXNOUyBpcyBUUlVFLlxuICAgKiBAdGhyb3dzICB7RXJyb3J9ICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3duIGlmIE5TU2VwYXJhdG9yIGlzIGZvdW5kIHRvIGJlIGludmFsaWQuXG4gICAqIEByZXR1cm5zICB7c3RyaW5nfVxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZ2V0VmFsaWRhdG9yS2V5KHVzZVR5cGVBc05TLCBOU1NlcGFyYXRvcikge1xuICAgIGNvbnN0IHVzZVRBTlMgPSB1c2VUeXBlQXNOUyA9PT0gdW5kZWZpbmVkIHx8ICEhdXNlVHlwZUFzTlM7XG4gICAgY29uc3QgTlNTZXAgPSBOU1NlcGFyYXRvciA9PT0gdW5kZWZpbmVkID8gJy4nIDogTlNTZXBhcmF0b3I7XG5cbiAgICBjb25zdCB0eXBlID0gdGhpcy5vcmlnaW47XG4gICAgY29uc3Qga2V5ID0gdGhpcy52YWxpZGF0b3JLZXkgfHwgdGhpcy52YWxpZGF0b3JOYW1lO1xuICAgIGNvbnN0IHVzZU5TID0gdXNlVEFOUyAmJiB0eXBlICYmIFZhbGlkYXRpb25FcnJvckl0ZW0uT3JpZ2luc1sgdHlwZSBdO1xuXG4gICAgaWYgKHVzZU5TICYmICh0eXBlb2YgTlNTZXAgIT09ICdzdHJpbmcnIHx8ICFOU1NlcC5sZW5ndGgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbmFtZXNwYWNlIHNlcGFyYXRvciBnaXZlbiwgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnKTtcbiAgICB9XG5cbiAgICBpZiAoISh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyAmJiBrZXkubGVuZ3RoKSkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIHJldHVybiAodXNlTlMgPyBbdHlwZSwga2V5XS5qb2luKE5TU2VwKSA6IGtleSkudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBlbnVtIHRoYXQgZGVmaW5lcyB2YWxpZCBWYWxpZGF0aW9uRXJyb3JJdGVtIGBvcmlnaW5gIHZhbHVlc1xuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJvcGVydHkgQ09SRSAgICAgICB7c3RyaW5nfSAgc3BlY2lmaWVzIGVycm9ycyB0aGF0IG9yaWdpbmF0ZSBmcm9tIHRoZSBzZXF1ZWxpemUgXCJjb3JlXCJcbiAqIEBwcm9wZXJ0eSBEQiAgICAgICAgIHtzdHJpbmd9ICBzcGVjaWZpZXMgdmFsaWRhdGlvbiBlcnJvcnMgdGhhdCBvcmlnaW5hdGUgZnJvbSB0aGUgc3RvcmFnZSBlbmdpbmVcbiAqIEBwcm9wZXJ0eSBGVU5DVElPTiAgIHtzdHJpbmd9ICBzcGVjaWZpZXMgdmFsaWRhdGlvbiBlcnJvcnMgdGhhdCBvcmlnaW5hdGUgZnJvbSB2YWxpZGF0b3IgZnVuY3Rpb25zIChib3RoIGJ1aWx0LWluIGFuZCBjdXN0b20pIGRlZmluZWQgZm9yIGEgZ2l2ZW4gYXR0cmlidXRlXG4gKi9cblZhbGlkYXRpb25FcnJvckl0ZW0uT3JpZ2lucyA9IHtcbiAgQ09SRTogJ0NPUkUnLFxuICBEQjogJ0RCJyxcbiAgRlVOQ1RJT046ICdGVU5DVElPTidcbn07XG5cbi8qKlxuICogQW4gb2JqZWN0IHRoYXQgaXMgdXNlZCBpbnRlcm5hbGx5IGJ5IHRoZSBgVmFsaWRhdGlvbkVycm9ySXRlbWAgY2xhc3NcbiAqIHRoYXQgbWFwcyBjdXJyZW50IGB0eXBlYCBzdHJpbmdzIChhcyBnaXZlbiB0byBWYWxpZGF0aW9uRXJyb3JJdGVtLmNvbnN0cnVjdG9yKCkpIHRvXG4gKiBvdXIgbmV3IGBvcmlnaW5gIHZhbHVlcy5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5WYWxpZGF0aW9uRXJyb3JJdGVtLlR5cGVTdHJpbmdNYXAgPSB7XG4gICdub3RudWxsIHZpb2xhdGlvbic6ICdDT1JFJyxcbiAgJ3N0cmluZyB2aW9sYXRpb24nOiAnQ09SRScsXG4gICd1bmlxdWUgdmlvbGF0aW9uJzogJ0RCJyxcbiAgJ3ZhbGlkYXRpb24gZXJyb3InOiAnRlVOQ1RJT04nXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZhbGlkYXRpb25FcnJvcjtcbm1vZHVsZS5leHBvcnRzLlZhbGlkYXRpb25FcnJvckl0ZW0gPSBWYWxpZGF0aW9uRXJyb3JJdGVtO1xuIl19