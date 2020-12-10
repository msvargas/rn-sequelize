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

const assert = require('assert');

const _ = require('lodash');

const Dottie = require('dottie');

const Utils = require('./utils');

const {
  logger
} = require('./utils/logger');

const BelongsTo = require('./associations/belongs-to');

const BelongsToMany = require('./associations/belongs-to-many');

const InstanceValidator = require('./instance-validator');

const QueryTypes = require('./query-types');

const sequelizeErrors = require('./errors');

const Promise = require('./promise');

const Association = require('./associations/base');

const HasMany = require('./associations/has-many');

const DataTypes = require('./data-types');

const Hooks = require('./hooks');

const associationsMixin = require('./associations/mixin');

const Op = require('./operators');

const {
  noDoubleNestedGroup
} = require('./utils/deprecations'); // This list will quickly become dated, but failing to maintain this list just means
// we won't throw a warning when we should. At least most common cases will forever be covered
// so we stop throwing erroneous warnings when we shouldn't.


const validQueryKeywords = new Set(['where', 'attributes', 'paranoid', 'include', 'order', 'limit', 'offset', 'transaction', 'lock', 'raw', 'logging', 'benchmark', 'having', 'searchPath', 'rejectOnEmpty', 'plain', 'scope', 'group', 'through', 'defaults', 'distinct', 'primary', 'exception', 'type', 'hooks', 'force', 'name']); // List of attributes that should not be implicitly passed into subqueries/includes.

const nonCascadingOptions = ['include', 'attributes', 'originalAttributes', 'order', 'where', 'limit', 'offset', 'plain', 'group', 'having'];
/**
 * A Model represents a table in the database. Instances of this class represent a database row.
 *
 * Model instances operate with the concept of a `dataValues` property, which stores the actual values represented by the instance.
 * By default, the values from dataValues can also be accessed directly from the Instance, that is:
 * ```js
 * instance.field
 * // is the same as
 * instance.get('field')
 * // is the same as
 * instance.getDataValue('field')
 * ```
 * However, if getters and/or setters are defined for `field` they will be invoked, instead of returning the value from `dataValues`.
 * Accessing properties directly or using `get` is preferred for regular use, `getDataValue` should only be used for custom getters.
 *
 * @see
   * {@link Sequelize#define} for more information about getters and setters
 * @mixes Hooks
 */

let Model = /*#__PURE__*/function () {
  _createClass(Model, [{
    key: "sequelize",

    /**
     * A reference to the sequelize instance
     *
     * @see
     * {@link Sequelize}
     *
     * @property sequelize
     *
     * @returns {Sequelize}
     */
    get: function () {
      return this.constructor.sequelize;
    }
    /**
     * Builds a new model instance.
     *
     * @param {Object}  [values={}] an object of key value pairs
     * @param {Object}  [options] instance construction options
     * @param {boolean} [options.raw=false] If set to true, values will ignore field and virtual setters.
     * @param {boolean} [options.isNewRecord=true] Is this a new record
     * @param {Array}   [options.include] an array of include options - Used to build prefetched/included model instances. See `set`
     */

  }], [{
    key: "QueryInterface",
    get: function () {
      return this.sequelize.getQueryInterface();
    }
  }, {
    key: "QueryGenerator",
    get: function () {
      return this.QueryInterface.QueryGenerator;
    }
  }]);

  function Model(values = {}, options = {}) {
    _classCallCheck(this, Model);

    options = Object.assign({
      isNewRecord: true,
      _schema: this.constructor._schema,
      _schemaDelimiter: this.constructor._schemaDelimiter
    }, options || {});

    if (options.attributes) {
      options.attributes = options.attributes.map(attribute => Array.isArray(attribute) ? attribute[1] : attribute);
    }

    if (!options.includeValidated) {
      this.constructor._conformIncludes(options, this.constructor);

      if (options.include) {
        this.constructor._expandIncludeAll(options);

        this.constructor._validateIncludedElements(options);
      }
    }

    this.dataValues = {};
    this._previousDataValues = {};
    this._changed = {};
    this._modelOptions = this.constructor.options;
    this._options = options || {};
    /**
     * Returns true if this instance has not yet been persisted to the database
     * @property isNewRecord
     * @returns {boolean}
     */

    this.isNewRecord = options.isNewRecord;

    this._initValues(values, options);
  }

  _createClass(Model, [{
    key: "_initValues",
    value: function _initValues(values, options) {
      let defaults;
      let key;
      values = values && _.clone(values) || {};

      if (options.isNewRecord) {
        defaults = {};

        if (this.constructor._hasDefaultValues) {
          defaults = _.mapValues(this.constructor._defaultValues, valueFn => {
            const value = valueFn();
            return value && value instanceof Utils.SequelizeMethod ? value : _.cloneDeep(value);
          });
        } // set id to null if not passed as value, a newly created dao has no id
        // removing this breaks bulkCreate
        // do after default values since it might have UUID as a default value


        if (this.constructor.primaryKeyAttributes.length) {
          this.constructor.primaryKeyAttributes.forEach(primaryKeyAttribute => {
            if (!Object.prototype.hasOwnProperty.call(defaults, primaryKeyAttribute)) {
              defaults[primaryKeyAttribute] = null;
            }
          });
        }

        if (this.constructor._timestampAttributes.createdAt && defaults[this.constructor._timestampAttributes.createdAt]) {
          this.dataValues[this.constructor._timestampAttributes.createdAt] = Utils.toDefaultValue(defaults[this.constructor._timestampAttributes.createdAt], this.sequelize.options.dialect);
          delete defaults[this.constructor._timestampAttributes.createdAt];
        }

        if (this.constructor._timestampAttributes.updatedAt && defaults[this.constructor._timestampAttributes.updatedAt]) {
          this.dataValues[this.constructor._timestampAttributes.updatedAt] = Utils.toDefaultValue(defaults[this.constructor._timestampAttributes.updatedAt], this.sequelize.options.dialect);
          delete defaults[this.constructor._timestampAttributes.updatedAt];
        }

        if (this.constructor._timestampAttributes.deletedAt && defaults[this.constructor._timestampAttributes.deletedAt]) {
          this.dataValues[this.constructor._timestampAttributes.deletedAt] = Utils.toDefaultValue(defaults[this.constructor._timestampAttributes.deletedAt], this.sequelize.options.dialect);
          delete defaults[this.constructor._timestampAttributes.deletedAt];
        }

        if (Object.keys(defaults).length) {
          for (key in defaults) {
            if (values[key] === undefined) {
              this.set(key, Utils.toDefaultValue(defaults[key], this.sequelize.options.dialect), {
                raw: true
              });
              delete values[key];
            }
          }
        }
      }

      this.set(values, options);
    } // validateIncludedElements should have been called before this method

  }, {
    key: "where",

    /**
     * Get an object representing the query for this instance, use with `options.where`
     *
     * @param {boolean} [checkVersion=false] include version attribute in where hash
     *
     * @returns {Object}
     */
    value: function where(checkVersion) {
      const where = this.constructor.primaryKeyAttributes.reduce((result, attribute) => {
        result[attribute] = this.get(attribute, {
          raw: true
        });
        return result;
      }, {});

      if (_.size(where) === 0) {
        return this._modelOptions.whereCollection;
      }

      const versionAttr = this.constructor._versionAttribute;

      if (checkVersion && versionAttr) {
        where[versionAttr] = this.get(versionAttr, {
          raw: true
        });
      }

      return Utils.mapWhereFieldNames(where, this.constructor);
    }
  }, {
    key: "toString",
    value: function toString() {
      return `[object SequelizeInstance:${this.constructor.name}]`;
    }
    /**
     * Get the value of the underlying data value
     *
     * @param {string} key key to look in instance data store
     *
     * @returns {any}
     */

  }, {
    key: "getDataValue",
    value: function getDataValue(key) {
      return this.dataValues[key];
    }
    /**
     * Update the underlying data value
     *
     * @param {string} key key to set in instance data store
     * @param {any} value new value for given key
     *
     */

  }, {
    key: "setDataValue",
    value: function setDataValue(key, value) {
      const originalValue = this._previousDataValues[key];

      if (!Utils.isPrimitive(value) && value !== null || value !== originalValue) {
        this.changed(key, true);
      }

      this.dataValues[key] = value;
    }
    /**
     * If no key is given, returns all values of the instance, also invoking virtual getters.
     *
     * If key is given and a field or virtual getter is present for the key it will call that getter - else it will return the value for key.
     *
     * @param {string}  [key] key to get value of
     * @param {Object}  [options] get options
     * @param {boolean} [options.plain=false] If set to true, included instances will be returned as plain objects
     * @param {boolean} [options.raw=false] If set to true, field and virtual setters will be ignored
     *
     * @returns {Object|any}
     */

  }, {
    key: "get",
    value: function get(key, options) {
      if (options === undefined && typeof key === 'object') {
        options = key;
        key = undefined;
      }

      options = options || {};

      if (key) {
        if (Object.prototype.hasOwnProperty.call(this._customGetters, key) && !options.raw) {
          return this._customGetters[key].call(this, key, options);
        }

        if (options.plain && this._options.include && this._options.includeNames.includes(key)) {
          if (Array.isArray(this.dataValues[key])) {
            return this.dataValues[key].map(instance => instance.get(options));
          }

          if (this.dataValues[key] instanceof Model) {
            return this.dataValues[key].get(options);
          }

          return this.dataValues[key];
        }

        return this.dataValues[key];
      }

      if (this._hasCustomGetters || options.plain && this._options.include || options.clone) {
        const values = {};

        let _key;

        if (this._hasCustomGetters) {
          for (_key in this._customGetters) {
            if (this._options.attributes && !this._options.attributes.includes(_key)) {
              continue;
            }

            if (Object.prototype.hasOwnProperty.call(this._customGetters, _key)) {
              values[_key] = this.get(_key, options);
            }
          }
        }

        for (_key in this.dataValues) {
          if (!Object.prototype.hasOwnProperty.call(values, _key) && Object.prototype.hasOwnProperty.call(this.dataValues, _key)) {
            values[_key] = this.get(_key, options);
          }
        }

        return values;
      }

      return this.dataValues;
    }
    /**
     * Set is used to update values on the instance (the sequelize representation of the instance that is, remember that nothing will be persisted before you actually call `save`).
     * In its most basic form `set` will update a value stored in the underlying `dataValues` object. However, if a custom setter function is defined for the key, that function
     * will be called instead. To bypass the setter, you can pass `raw: true` in the options object.
     *
     * If set is called with an object, it will loop over the object, and call set recursively for each key, value pair. If you set raw to true, the underlying dataValues will either be
     * set directly to the object passed, or used to extend dataValues, if dataValues already contain values.
     *
     * When set is called, the previous value of the field is stored and sets a changed flag(see `changed`).
     *
     * Set can also be used to build instances for associations, if you have values for those.
     * When using set with associations you need to make sure the property key matches the alias of the association
     * while also making sure that the proper include options have been set (from .build() or .findOne())
     *
     * If called with a dot.separated key on a JSON/JSONB attribute it will set the value nested and flag the entire object as changed.
     *
     * @see
     * {@link Model.findAll} for more information about includes
     *
     * @param {string|Object} key key to set, it can be string or object. When string it will set that key, for object it will loop over all object properties nd set them.
     * @param {any} value value to set
     * @param {Object} [options] set options
     * @param {boolean} [options.raw=false] If set to true, field and virtual setters will be ignored
     * @param {boolean} [options.reset=false] Clear all previously set data values
     *
     * @returns {Model}
     */

  }, {
    key: "set",
    value: function set(key, value, options) {
      let values;
      let originalValue;

      if (typeof key === 'object' && key !== null) {
        values = key;
        options = value || {};

        if (options.reset) {
          this.dataValues = {};

          for (const key in values) {
            this.changed(key, false);
          }
        } // If raw, and we're not dealing with includes or special attributes, just set it straight on the dataValues object


        if (options.raw && !(this._options && this._options.include) && !(options && options.attributes) && !this.constructor._hasDateAttributes && !this.constructor._hasBooleanAttributes) {
          if (Object.keys(this.dataValues).length) {
            this.dataValues = Object.assign(this.dataValues, values);
          } else {
            this.dataValues = values;
          } // If raw, .changed() shouldn't be true


          this._previousDataValues = _.clone(this.dataValues);
        } else {
          // Loop and call set
          if (options.attributes) {
            const setKeys = data => {
              for (const k of data) {
                if (values[k] === undefined) {
                  continue;
                }

                this.set(k, values[k], options);
              }
            };

            setKeys(options.attributes);

            if (this.constructor._hasVirtualAttributes) {
              setKeys(this.constructor._virtualAttributes);
            }

            if (this._options.includeNames) {
              setKeys(this._options.includeNames);
            }
          } else {
            for (const key in values) {
              this.set(key, values[key], options);
            }
          }

          if (options.raw) {
            // If raw, .changed() shouldn't be true
            this._previousDataValues = _.clone(this.dataValues);
          }
        }

        return this;
      }

      if (!options) options = {};

      if (!options.raw) {
        originalValue = this.dataValues[key];
      } // If not raw, and there's a custom setter


      if (!options.raw && this._customSetters[key]) {
        this._customSetters[key].call(this, value, key); // custom setter should have changed value, get that changed value
        // TODO: v5 make setters return new value instead of changing internal store


        const newValue = this.dataValues[key];

        if (!Utils.isPrimitive(newValue) && newValue !== null || newValue !== originalValue) {
          this._previousDataValues[key] = originalValue;
          this.changed(key, true);
        }
      } else {
        // Check if we have included models, and if this key matches the include model names/aliases
        if (this._options && this._options.include && this._options.includeNames.includes(key)) {
          // Pass it on to the include handler
          this._setInclude(key, value, options);

          return this;
        } // Bunch of stuff we won't do when it's raw


        if (!options.raw) {
          // If attribute is not in model definition, return
          if (!this._isAttribute(key)) {
            if (key.includes('.') && this.constructor._jsonAttributes.has(key.split('.')[0])) {
              const previousNestedValue = Dottie.get(this.dataValues, key);

              if (!_.isEqual(previousNestedValue, value)) {
                Dottie.set(this.dataValues, key, value);
                this.changed(key.split('.')[0], true);
              }
            }

            return this;
          } // If attempting to set primary key and primary key is already defined, return


          if (this.constructor._hasPrimaryKeys && originalValue && this.constructor._isPrimaryKey(key)) {
            return this;
          } // If attempting to set read only attributes, return


          if (!this.isNewRecord && this.constructor._hasReadOnlyAttributes && this.constructor._readOnlyAttributes.has(key)) {
            return this;
          }
        } // If there's a data type sanitizer


        if (!(value instanceof Utils.SequelizeMethod) && Object.prototype.hasOwnProperty.call(this.constructor._dataTypeSanitizers, key)) {
          value = this.constructor._dataTypeSanitizers[key].call(this, value, options);
        } // Set when the value has changed and not raw


        if (!options.raw && ( // True when sequelize method
        value instanceof Utils.SequelizeMethod || // Check for data type type comparators
        !(value instanceof Utils.SequelizeMethod) && this.constructor._dataTypeChanges[key] && this.constructor._dataTypeChanges[key].call(this, value, originalValue, options) || // Check default
        !this.constructor._dataTypeChanges[key] && (!Utils.isPrimitive(value) && value !== null || value !== originalValue))) {
          this._previousDataValues[key] = originalValue;
          this.changed(key, true);
        } // set data value


        this.dataValues[key] = value;
      }

      return this;
    }
  }, {
    key: "setAttributes",
    value: function setAttributes(updates) {
      return this.set(updates);
    }
    /**
     * If changed is called with a string it will return a boolean indicating whether the value of that key in `dataValues` is different from the value in `_previousDataValues`.
     *
     * If changed is called without an argument, it will return an array of keys that have changed.
     *
     * If changed is called without an argument and no keys have changed, it will return `false`.
     *
     * @param {string} [key] key to check or change status of
     * @param {any} [value] value to set
     *
     * @returns {boolean|Array}
     */

  }, {
    key: "changed",
    value: function changed(key, value) {
      if (key) {
        if (value !== undefined) {
          this._changed[key] = value;
          return this;
        }

        return this._changed[key] || false;
      }

      const changed = Object.keys(this.dataValues).filter(key => this.changed(key));
      return changed.length ? changed : false;
    }
    /**
     * Returns the previous value for key from `_previousDataValues`.
     *
     * If called without a key, returns the previous values for all values which have changed
     *
     * @param {string} [key] key to get previous value of
     *
     * @returns {any|Array<any>}
     */

  }, {
    key: "previous",
    value: function previous(key) {
      if (key) {
        return this._previousDataValues[key];
      }

      return _.pickBy(this._previousDataValues, (value, key) => this.changed(key));
    }
  }, {
    key: "_setInclude",
    value: function _setInclude(key, value, options) {
      if (!Array.isArray(value)) value = [value];

      if (value[0] instanceof Model) {
        value = value.map(instance => instance.dataValues);
      }

      const include = this._options.includeMap[key];
      const association = include.association;
      const accessor = key;
      const primaryKeyAttribute = include.model.primaryKeyAttribute;
      const childOptions = {
        isNewRecord: this.isNewRecord,
        include: include.include,
        includeNames: include.includeNames,
        includeMap: include.includeMap,
        includeValidated: true,
        raw: options.raw,
        attributes: include.originalAttributes
      };
      let isEmpty;

      if (include.originalAttributes === undefined || include.originalAttributes.length) {
        if (association.isSingleAssociation) {
          if (Array.isArray(value)) {
            value = value[0];
          }

          isEmpty = value && value[primaryKeyAttribute] === null || value === null;
          this[accessor] = this.dataValues[accessor] = isEmpty ? null : include.model.build(value, childOptions);
        } else {
          isEmpty = value[0] && value[0][primaryKeyAttribute] === null;
          this[accessor] = this.dataValues[accessor] = isEmpty ? [] : include.model.bulkBuild(value, childOptions);
        }
      }
    }
    /**
     * Validate this instance, and if the validation passes, persist it to the database. It will only save changed fields, and do nothing if no fields have changed.
     *
     * On success, the callback will be called with this instance. On validation error, the callback will be called with an instance of `Sequelize.ValidationError`.
     * This error will have a property for each of the fields for which validation failed, with the error message for that field.
     *
     * @param {Object}      [options] save options
     * @param {string[]}    [options.fields] An optional array of strings, representing database columns. If fields is provided, only those columns will be validated and saved.
     * @param {boolean}     [options.silent=false] If true, the updatedAt timestamp will not be updated.
     * @param {boolean}     [options.validate=true] If false, validations won't be run.
     * @param {boolean}     [options.hooks=true] Run before and after create / update + validate hooks
     * @param {Function}    [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {Transaction} [options.transaction] Transaction to run query under
     * @param {string}      [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     * @param {boolean}     [options.returning] Append RETURNING * to get back auto generated values (Postgres only)
     *
     * @returns {Promise<Model>}
     */

  }, {
    key: "save",
    value: function save(options) {
      if (arguments.length > 1) {
        throw new Error('The second argument was removed in favor of the options object.');
      }

      options = Utils.cloneDeep(options);
      options = _.defaults(options, {
        hooks: true,
        validate: true
      });

      if (!options.fields) {
        if (this.isNewRecord) {
          options.fields = Object.keys(this.constructor.rawAttributes);
        } else {
          options.fields = _.intersection(this.changed(), Object.keys(this.constructor.rawAttributes));
        }

        options.defaultFields = options.fields;
      }

      if (options.returning === undefined) {
        if (options.association) {
          options.returning = false;
        } else if (this.isNewRecord) {
          options.returning = true;
        }
      }

      const primaryKeyName = this.constructor.primaryKeyAttribute;
      const primaryKeyAttribute = primaryKeyName && this.constructor.rawAttributes[primaryKeyName];
      const createdAtAttr = this.constructor._timestampAttributes.createdAt;
      const versionAttr = this.constructor._versionAttribute;
      const hook = this.isNewRecord ? 'Create' : 'Update';
      const wasNewRecord = this.isNewRecord;
      const now = Utils.now(this.sequelize.options.dialect);
      let updatedAtAttr = this.constructor._timestampAttributes.updatedAt;

      if (updatedAtAttr && options.fields.length >= 1 && !options.fields.includes(updatedAtAttr)) {
        options.fields.push(updatedAtAttr);
      }

      if (versionAttr && options.fields.length >= 1 && !options.fields.includes(versionAttr)) {
        options.fields.push(versionAttr);
      }

      if (options.silent === true && !(this.isNewRecord && this.get(updatedAtAttr, {
        raw: true
      }))) {
        // UpdateAtAttr might have been added as a result of Object.keys(Model.rawAttributes). In that case we have to remove it again
        _.remove(options.fields, val => val === updatedAtAttr);

        updatedAtAttr = false;
      }

      if (this.isNewRecord === true) {
        if (createdAtAttr && !options.fields.includes(createdAtAttr)) {
          options.fields.push(createdAtAttr);
        }

        if (primaryKeyAttribute && primaryKeyAttribute.defaultValue && !options.fields.includes(primaryKeyName)) {
          options.fields.unshift(primaryKeyName);
        }
      }

      if (this.isNewRecord === false) {
        if (primaryKeyName && this.get(primaryKeyName, {
          raw: true
        }) === undefined) {
          throw new Error('You attempted to save an instance with no primary key, this is not allowed since it would result in a global update');
        }
      }

      if (updatedAtAttr && !options.silent && options.fields.includes(updatedAtAttr)) {
        this.dataValues[updatedAtAttr] = this.constructor._getDefaultTimestamp(updatedAtAttr) || now;
      }

      if (this.isNewRecord && createdAtAttr && !this.dataValues[createdAtAttr]) {
        this.dataValues[createdAtAttr] = this.constructor._getDefaultTimestamp(createdAtAttr) || now;
      }

      return Promise.try(() => {
        // Validate
        if (options.validate) {
          return this.validate(options);
        }
      }).then(() => {
        // Run before hook
        if (options.hooks) {
          const beforeHookValues = _.pick(this.dataValues, options.fields);

          let ignoreChanged = _.difference(this.changed(), options.fields); // In case of update where it's only supposed to update the passed values and the hook values


          let hookChanged;
          let afterHookValues;

          if (updatedAtAttr && options.fields.includes(updatedAtAttr)) {
            ignoreChanged = _.without(ignoreChanged, updatedAtAttr);
          }

          return this.constructor.runHooks(`before${hook}`, this, options).then(() => {
            if (options.defaultFields && !this.isNewRecord) {
              afterHookValues = _.pick(this.dataValues, _.difference(this.changed(), ignoreChanged));
              hookChanged = [];

              for (const key of Object.keys(afterHookValues)) {
                if (afterHookValues[key] !== beforeHookValues[key]) {
                  hookChanged.push(key);
                }
              }

              options.fields = _.uniq(options.fields.concat(hookChanged));
            }

            if (hookChanged) {
              if (options.validate) {
                // Validate again
                options.skip = _.difference(Object.keys(this.constructor.rawAttributes), hookChanged);
                return this.validate(options).then(() => {
                  delete options.skip;
                });
              }
            }
          });
        }
      }).then(() => {
        if (!options.fields.length) return this;
        if (!this.isNewRecord) return this;
        if (!this._options.include || !this._options.include.length) return this; // Nested creation for BelongsTo relations

        return Promise.map(this._options.include.filter(include => include.association instanceof BelongsTo), include => {
          const instance = this.get(include.as);
          if (!instance) return Promise.resolve();

          const includeOptions = _(Utils.cloneDeep(include)).omit(['association']).defaults({
            transaction: options.transaction,
            logging: options.logging,
            parentRecord: this
          }).value();

          return instance.save(includeOptions).then(() => this[include.association.accessors.set](instance, {
            save: false,
            logging: options.logging
          }));
        });
      }).then(() => {
        const realFields = options.fields.filter(field => !this.constructor._virtualAttributes.has(field));
        if (!realFields.length) return this;
        if (!this.changed() && !this.isNewRecord) return this;
        const versionFieldName = _.get(this.constructor.rawAttributes[versionAttr], 'field') || versionAttr;
        let values = Utils.mapValueFieldNames(this.dataValues, options.fields, this.constructor);
        let query = null;
        let args = [];
        let where;

        if (this.isNewRecord) {
          query = 'insert';
          args = [this, this.constructor.getTableName(options), values, options];
        } else {
          where = this.where(true);

          if (versionAttr) {
            values[versionFieldName] = parseInt(values[versionFieldName], 10) + 1;
          }

          query = 'update';
          args = [this, this.constructor.getTableName(options), values, where, options];
        }

        return this.constructor.QueryInterface[query](...args).then(([result, rowsUpdated]) => {
          if (versionAttr) {
            // Check to see that a row was updated, otherwise it's an optimistic locking error.
            if (rowsUpdated < 1) {
              throw new sequelizeErrors.OptimisticLockError({
                modelName: this.constructor.name,
                values,
                where
              });
            } else {
              result.dataValues[versionAttr] = values[versionFieldName];
            }
          } // Transfer database generated values (defaults, autoincrement, etc)


          for (const attr of Object.keys(this.constructor.rawAttributes)) {
            if (this.constructor.rawAttributes[attr].field && values[this.constructor.rawAttributes[attr].field] !== undefined && this.constructor.rawAttributes[attr].field !== attr) {
              values[attr] = values[this.constructor.rawAttributes[attr].field];
              delete values[this.constructor.rawAttributes[attr].field];
            }
          }

          values = Object.assign(values, result.dataValues);
          result.dataValues = Object.assign(result.dataValues, values);
          return result;
        }).tap(() => {
          if (!wasNewRecord) return this;
          if (!this._options.include || !this._options.include.length) return this; // Nested creation for HasOne/HasMany/BelongsToMany relations

          return Promise.map(this._options.include.filter(include => !(include.association instanceof BelongsTo || include.parent && include.parent.association instanceof BelongsToMany)), include => {
            let instances = this.get(include.as);
            if (!instances) return Promise.resolve();
            if (!Array.isArray(instances)) instances = [instances];
            if (!instances.length) return Promise.resolve();

            const includeOptions = _(Utils.cloneDeep(include)).omit(['association']).defaults({
              transaction: options.transaction,
              logging: options.logging,
              parentRecord: this
            }).value(); // Instances will be updated in place so we can safely treat HasOne like a HasMany


            return Promise.map(instances, instance => {
              if (include.association instanceof BelongsToMany) {
                return instance.save(includeOptions).then(() => {
                  const values = {};
                  values[include.association.foreignKey] = this.get(this.constructor.primaryKeyAttribute, {
                    raw: true
                  });
                  values[include.association.otherKey] = instance.get(instance.constructor.primaryKeyAttribute, {
                    raw: true
                  }); // Include values defined in the association

                  Object.assign(values, include.association.through.scope);

                  if (instance[include.association.through.model.name]) {
                    for (const attr of Object.keys(include.association.through.model.rawAttributes)) {
                      if (include.association.through.model.rawAttributes[attr]._autoGenerated || attr === include.association.foreignKey || attr === include.association.otherKey || typeof instance[include.association.through.model.name][attr] === undefined) {
                        continue;
                      }

                      values[attr] = instance[include.association.through.model.name][attr];
                    }
                  }

                  return include.association.throughModel.create(values, includeOptions);
                });
              }

              instance.set(include.association.foreignKey, this.get(include.association.sourceKey || this.constructor.primaryKeyAttribute, {
                raw: true
              }), {
                raw: true
              });
              Object.assign(instance, include.association.scope);
              return instance.save(includeOptions);
            });
          });
        }).tap(result => {
          // Run after hook
          if (options.hooks) {
            return this.constructor.runHooks(`after${hook}`, result, options);
          }
        }).then(result => {
          for (const field of options.fields) {
            result._previousDataValues[field] = result.dataValues[field];
            this.changed(field, false);
          }

          this.isNewRecord = false;
          return result;
        });
      });
    }
    /**
     * Refresh the current instance in-place, i.e. update the object with current data from the DB and return the same object.
     * This is different from doing a `find(Instance.id)`, because that would create and return a new instance. With this method,
     * all references to the Instance are updated with the new data and no new objects are created.
     *
     * @see
     * {@link Model.findAll}
     *
     * @param {Object} [options] Options that are passed on to `Model.find`
     * @param {Function} [options.logging=false] A function that gets executed while running the query to log the sql.
     *
     * @returns {Promise<Model>}
     */

  }, {
    key: "reload",
    value: function reload(options) {
      options = Utils.defaults({}, options, {
        where: this.where(),
        include: this._options.include || null
      });
      return this.constructor.findOne(options).tap(reload => {
        if (!reload) {
          throw new sequelizeErrors.InstanceError('Instance could not be reloaded because it does not exist anymore (find call returned null)');
        }
      }).then(reload => {
        // update the internal options of the instance
        this._options = reload._options; // re-set instance values

        this.set(reload.dataValues, {
          raw: true,
          reset: true && !options.attributes
        });
        return this;
      });
    }
    /**
    * Validate the attributes of this instance according to validation rules set in the model definition.
    *
    * The promise fulfills if and only if validation successful; otherwise it rejects an Error instance containing { field name : [error msgs] } entries.
    *
    * @param {Object} [options] Options that are passed to the validator
    * @param {Array} [options.skip] An array of strings. All properties that are in this array will not be validated
    * @param {Array} [options.fields] An array of strings. Only the properties that are in this array will be validated
    * @param {boolean} [options.hooks=true] Run before and after validate hooks
    *
    * @returns {Promise}
    */

  }, {
    key: "validate",
    value: function validate(options) {
      return new InstanceValidator(this, options).validate();
    }
    /**
     * This is the same as calling `set` and then calling `save` but it only saves the
     * exact values passed to it, making it more atomic and safer.
     *
     * @see
     * {@link Model#set}
     * @see
     * {@link Model#save}
     *
     * @param {Object} values See `set`
     * @param {Object} options See `save`
     *
     * @returns {Promise<Model>}
     */

  }, {
    key: "update",
    value: function update(values, options) {
      // Clone values so it doesn't get modified for caller scope and ignore undefined values
      values = _.omitBy(values, value => value === undefined);
      const changedBefore = this.changed() || [];
      options = options || {};
      if (Array.isArray(options)) options = {
        fields: options
      };
      options = Utils.cloneDeep(options);
      const setOptions = Utils.cloneDeep(options);
      setOptions.attributes = options.fields;
      this.set(values, setOptions); // Now we need to figure out which fields were actually affected by the setter.

      const sideEffects = _.without(this.changed(), ...changedBefore);

      const fields = _.union(Object.keys(values), sideEffects);

      if (!options.fields) {
        options.fields = _.intersection(fields, this.changed());
        options.defaultFields = options.fields;
      }

      return this.save(options);
    }
    /**
     * Destroy the row corresponding to this instance. Depending on your setting for paranoid, the row will either be completely deleted, or have its deletedAt timestamp set to the current time.
     *
     * @param {Object}      [options={}] destroy options
     * @param {boolean}     [options.force=false] If set to true, paranoid models will actually be deleted
     * @param {Function}    [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {Transaction} [options.transaction] Transaction to run query under
     * @param {string}      [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     *
     * @returns {Promise}
     */

  }, {
    key: "destroy",
    value: function destroy(options) {
      options = Object.assign({
        hooks: true,
        force: false
      }, options);
      return Promise.try(() => {
        // Run before hook
        if (options.hooks) {
          return this.constructor.runHooks('beforeDestroy', this, options);
        }
      }).then(() => {
        const where = this.where(true);

        if (this.constructor._timestampAttributes.deletedAt && options.force === false) {
          const attributeName = this.constructor._timestampAttributes.deletedAt;
          const attribute = this.constructor.rawAttributes[attributeName];
          const defaultValue = Object.prototype.hasOwnProperty.call(attribute, 'defaultValue') ? attribute.defaultValue : null;
          const currentValue = this.getDataValue(attributeName);
          const undefinedOrNull = currentValue == null && defaultValue == null;

          if (undefinedOrNull || _.isEqual(currentValue, defaultValue)) {
            // only update timestamp if it wasn't already set
            this.setDataValue(attributeName, new Date());
          }

          return this.save(_.defaults({
            hooks: false
          }, options));
        }

        return this.constructor.QueryInterface.delete(this, this.constructor.getTableName(options), where, Object.assign({
          type: QueryTypes.DELETE,
          limit: null
        }, options));
      }).tap(() => {
        // Run after hook
        if (options.hooks) {
          return this.constructor.runHooks('afterDestroy', this, options);
        }
      });
    }
    /**
     * Helper method to determine if a instance is "soft deleted".  This is
     * particularly useful if the implementer renamed the `deletedAt` attribute
     * to something different.  This method requires `paranoid` to be enabled.
     *
     * @returns {boolean}
     */

  }, {
    key: "isSoftDeleted",
    value: function isSoftDeleted() {
      if (!this.constructor._timestampAttributes.deletedAt) {
        throw new Error('Model is not paranoid');
      }

      const deletedAtAttribute = this.constructor.rawAttributes[this.constructor._timestampAttributes.deletedAt];
      const defaultValue = Object.prototype.hasOwnProperty.call(deletedAtAttribute, 'defaultValue') ? deletedAtAttribute.defaultValue : null;
      const deletedAt = this.get(this.constructor._timestampAttributes.deletedAt) || null;
      const isSet = deletedAt !== defaultValue;
      return isSet;
    }
    /**
     * Restore the row corresponding to this instance. Only available for paranoid models.
     *
     * @param {Object}      [options={}] restore options
     * @param {Function}    [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {Transaction} [options.transaction] Transaction to run query under
     *
     * @returns {Promise}
     */

  }, {
    key: "restore",
    value: function restore(options) {
      if (!this.constructor._timestampAttributes.deletedAt) throw new Error('Model is not paranoid');
      options = Object.assign({
        hooks: true,
        force: false
      }, options);
      return Promise.try(() => {
        // Run before hook
        if (options.hooks) {
          return this.constructor.runHooks('beforeRestore', this, options);
        }
      }).then(() => {
        const deletedAtCol = this.constructor._timestampAttributes.deletedAt;
        const deletedAtAttribute = this.constructor.rawAttributes[deletedAtCol];
        const deletedAtDefaultValue = Object.prototype.hasOwnProperty.call(deletedAtAttribute, 'defaultValue') ? deletedAtAttribute.defaultValue : null;
        this.setDataValue(deletedAtCol, deletedAtDefaultValue);
        return this.save(Object.assign({}, options, {
          hooks: false,
          omitNull: false
        }));
      }).tap(() => {
        // Run after hook
        if (options.hooks) {
          return this.constructor.runHooks('afterRestore', this, options);
        }
      });
    }
    /**
     * Increment the value of one or more columns. This is done in the database, which means it does not use the values currently stored on the Instance. The increment is done using a
     * ```sql
     * SET column = column + X
     * ```
     * query. The updated instance will be returned by default in Postgres. However, in other dialects, you will need to do a reload to get the new values.
     *
     * @example
     * instance.increment('number') // increment number by 1
     *
     * instance.increment(['number', 'count'], { by: 2 }) // increment number and count by 2
     *
     * // increment answer by 42, and tries by 1.
     * // `by` is ignored, since each column has its own value
     * instance.increment({ answer: 42, tries: 1}, { by: 2 })
     *
     * @see
     * {@link Model#reload}
     *
     * @param {string|Array|Object} fields If a string is provided, that column is incremented by the value of `by` given in options. If an array is provided, the same is true for each column. If and object is provided, each column is incremented by the value given.
     * @param {Object} [options] options
     * @param {number} [options.by=1] The number to increment by
     * @param {boolean} [options.silent=false] If true, the updatedAt timestamp will not be updated.
     * @param {Function} [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {Transaction} [options.transaction] Transaction to run query under
     * @param {string} [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     * @param {boolean} [options.returning=true] Append RETURNING * to get back auto generated values (Postgres only)
     *
     * @returns {Promise<Model>}
     * @since 4.0.0
     */

  }, {
    key: "increment",
    value: function increment(fields, options) {
      const identifier = this.where();
      options = Utils.cloneDeep(options);
      options.where = Object.assign({}, options.where, identifier);
      options.instance = this;
      return this.constructor.increment(fields, options).return(this);
    }
    /**
     * Decrement the value of one or more columns. This is done in the database, which means it does not use the values currently stored on the Instance. The decrement is done using a
     * ```sql
     * SET column = column - X
     * ```
     * query. The updated instance will be returned by default in Postgres. However, in other dialects, you will need to do a reload to get the new values.
     *
     * @example
     * instance.decrement('number') // decrement number by 1
     *
     * instance.decrement(['number', 'count'], { by: 2 }) // decrement number and count by 2
     *
     * // decrement answer by 42, and tries by 1.
     * // `by` is ignored, since each column has its own value
     * instance.decrement({ answer: 42, tries: 1}, { by: 2 })
     *
     * @see
     * {@link Model#reload}
     * @param {string|Array|Object} fields If a string is provided, that column is decremented by the value of `by` given in options. If an array is provided, the same is true for each column. If and object is provided, each column is decremented by the value given
     * @param {Object}      [options] decrement options
     * @param {number}      [options.by=1] The number to decrement by
     * @param {boolean}     [options.silent=false] If true, the updatedAt timestamp will not be updated.
     * @param {Function}    [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {Transaction} [options.transaction] Transaction to run query under
     * @param {string}      [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     * @param {boolean}     [options.returning=true] Append RETURNING * to get back auto generated values (Postgres only)
     *
     * @returns {Promise}
     */

  }, {
    key: "decrement",
    value: function decrement(fields, options) {
      options = _.defaults({
        increment: false
      }, options, {
        by: 1
      });
      return this.increment(fields, options);
    }
    /**
     * Check whether this and `other` Instance refer to the same row
     *
     * @param {Model} other Other instance to compare against
     *
     * @returns {boolean}
     */

  }, {
    key: "equals",
    value: function equals(other) {
      if (!other || !other.constructor) {
        return false;
      }

      if (!(other instanceof this.constructor)) {
        return false;
      }

      return this.constructor.primaryKeyAttributes.every(attribute => this.get(attribute, {
        raw: true
      }) === other.get(attribute, {
        raw: true
      }));
    }
    /**
     * Check if this is equal to one of `others` by calling equals
     *
     * @param {Array<Model>} others An array of instances to check against
     *
     * @returns {boolean}
     */

  }, {
    key: "equalsOneOf",
    value: function equalsOneOf(others) {
      return others.some(other => this.equals(other));
    }
  }, {
    key: "setValidators",
    value: function setValidators(attribute, validators) {
      this.validators[attribute] = validators;
    }
    /**
     * Convert the instance to a JSON representation.
     * Proxies to calling `get` with no keys.
     * This means get all values gotten from the DB, and apply all custom getters.
     *
     * @see
     * {@link Model#get}
     *
     * @returns {Object}
     */

  }, {
    key: "toJSON",
    value: function toJSON() {
      return _.cloneDeep(this.get({
        plain: true
      }));
    }
    /**
     * Creates a 1:m association between this (the source) and the provided target.
     * The foreign key is added on the target.
     *
     * @param {Model}               target Target model
     * @param {Object}              [options] hasMany association options
     * @param {boolean}             [options.hooks=false] Set to true to run before-/afterDestroy hooks when an associated model is deleted because of a cascade. For example if `User.hasOne(Profile, {onDelete: 'cascade', hooks:true})`, the before-/afterDestroy hooks for profile will be called when a user is deleted. Otherwise the profile will be deleted without invoking any hooks
     * @param {string|Object}       [options.as] The alias of this model. If you provide a string, it should be plural, and will be singularized using node.inflection. If you want to control the singular version yourself, provide an object with `plural` and `singular` keys. See also the `name` option passed to `sequelize.define`. If you create multiple associations between the same tables, you should provide an alias to be able to distinguish between them. If you provide an alias when creating the association, you should provide the same alias when eager loading and when getting associated models. Defaults to the pluralized name of target
     * @param {string|Object}       [options.foreignKey] The name of the foreign key in the target table or an object representing the type definition for the foreign column (see `Sequelize.define` for syntax). When using an object, you can add a `name` property to set the name of the column. Defaults to the name of source + primary key of source
     * @param {string}              [options.sourceKey] The name of the field to use as the key for the association in the source table. Defaults to the primary key of the source table
     * @param {Object}              [options.scope] A key/value set that will be used for association create and find defaults on the target. (sqlite not supported for N:M)
     * @param {string}              [options.onDelete='SET&nbsp;NULL|CASCADE'] SET NULL if foreignKey allows nulls, CASCADE if otherwise
     * @param {string}              [options.onUpdate='CASCADE'] Set `ON UPDATE`
     * @param {boolean}             [options.constraints=true] Should on update and on delete constraints be enabled on the foreign key.
     *
     * @returns {HasMany}
     *
     * @example
     * User.hasMany(Profile) // This will add userId to the profile table
     */

  }], [{
    key: "_paranoidClause",
    value: function _paranoidClause(model, options = {}) {
      // Apply on each include
      // This should be handled before handling where conditions because of logic with returns
      // otherwise this code will never run on includes of a already conditionable where
      if (options.include) {
        for (const include of options.include) {
          this._paranoidClause(include.model, include);
        }
      } // apply paranoid when groupedLimit is used


      if (_.get(options, 'groupedLimit.on.options.paranoid')) {
        const throughModel = _.get(options, 'groupedLimit.on.through.model');

        if (throughModel) {
          options.groupedLimit.through = this._paranoidClause(throughModel, options.groupedLimit.through);
        }
      }

      if (!model.options.timestamps || !model.options.paranoid || options.paranoid === false) {
        // This model is not paranoid, nothing to do here;
        return options;
      }

      const deletedAtCol = model._timestampAttributes.deletedAt;
      const deletedAtAttribute = model.rawAttributes[deletedAtCol];
      const deletedAtObject = {};
      let deletedAtDefaultValue = Object.prototype.hasOwnProperty.call(deletedAtAttribute, 'defaultValue') ? deletedAtAttribute.defaultValue : null;
      deletedAtDefaultValue = deletedAtDefaultValue || {
        [Op.eq]: null
      };
      deletedAtObject[deletedAtAttribute.field || deletedAtCol] = deletedAtDefaultValue;

      if (Utils.isWhereEmpty(options.where)) {
        options.where = deletedAtObject;
      } else {
        options.where = {
          [Op.and]: [deletedAtObject, options.where]
        };
      }

      return options;
    }
  }, {
    key: "_addDefaultAttributes",
    value: function _addDefaultAttributes() {
      const tail = {};
      let head = {}; // Add id if no primary key was manually added to definition
      // Can't use this.primaryKeys here, since this function is called before PKs are identified

      if (!_.some(this.rawAttributes, 'primaryKey')) {
        if ('id' in this.rawAttributes) {
          // Something is fishy here!
          throw new Error(`A column called 'id' was added to the attributes of '${this.tableName}' but not marked with 'primaryKey: true'`);
        }

        head = {
          id: {
            type: new DataTypes.INTEGER(),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            _autoGenerated: true
          }
        };
      }

      if (this._timestampAttributes.createdAt) {
        tail[this._timestampAttributes.createdAt] = {
          type: DataTypes.DATE,
          allowNull: false,
          _autoGenerated: true
        };
      }

      if (this._timestampAttributes.updatedAt) {
        tail[this._timestampAttributes.updatedAt] = {
          type: DataTypes.DATE,
          allowNull: false,
          _autoGenerated: true
        };
      }

      if (this._timestampAttributes.deletedAt) {
        tail[this._timestampAttributes.deletedAt] = {
          type: DataTypes.DATE,
          _autoGenerated: true
        };
      }

      if (this._versionAttribute) {
        tail[this._versionAttribute] = {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          _autoGenerated: true
        };
      }

      const existingAttributes = _.clone(this.rawAttributes);

      this.rawAttributes = {};

      _.each(head, (value, attr) => {
        this.rawAttributes[attr] = value;
      });

      _.each(existingAttributes, (value, attr) => {
        this.rawAttributes[attr] = value;
      });

      _.each(tail, (value, attr) => {
        if (this.rawAttributes[attr] === undefined) {
          this.rawAttributes[attr] = value;
        }
      });

      if (!Object.keys(this.primaryKeys).length) {
        this.primaryKeys.id = this.rawAttributes.id;
      }
    }
  }, {
    key: "_findAutoIncrementAttribute",
    value: function _findAutoIncrementAttribute() {
      this.autoIncrementAttribute = null;

      for (const name in this.rawAttributes) {
        if (Object.prototype.hasOwnProperty.call(this.rawAttributes, name)) {
          const definition = this.rawAttributes[name];

          if (definition && definition.autoIncrement) {
            if (this.autoIncrementAttribute) {
              throw new Error('Invalid Instance definition. Only one autoincrement field allowed.');
            }

            this.autoIncrementAttribute = name;
          }
        }
      }
    }
  }, {
    key: "_conformIncludes",
    value: function _conformIncludes(options, self) {
      if (!options.include) return; // if include is not an array, wrap in an array

      if (!Array.isArray(options.include)) {
        options.include = [options.include];
      } else if (!options.include.length) {
        delete options.include;
        return;
      } // convert all included elements to { model: Model } form


      options.include = options.include.map(include => this._conformInclude(include, self));
    }
  }, {
    key: "_transformStringAssociation",
    value: function _transformStringAssociation(include, self) {
      if (self && typeof include === 'string') {
        if (!Object.prototype.hasOwnProperty.call(self.associations, include)) {
          throw new Error(`Association with alias "${include}" does not exist on ${self.name}`);
        }

        return self.associations[include];
      }

      return include;
    }
  }, {
    key: "_conformInclude",
    value: function _conformInclude(include, self) {
      if (include) {
        let model;
        if (include._pseudo) return include;
        include = this._transformStringAssociation(include, self);

        if (include instanceof Association) {
          if (self && include.target.name === self.name) {
            model = include.source;
          } else {
            model = include.target;
          }

          return {
            model,
            association: include,
            as: include.as
          };
        }

        if (include.prototype && include.prototype instanceof Model) {
          return {
            model: include
          };
        }

        if (_.isPlainObject(include)) {
          if (include.association) {
            include.association = this._transformStringAssociation(include.association, self);

            if (self && include.association.target.name === self.name) {
              model = include.association.source;
            } else {
              model = include.association.target;
            }

            if (!include.model) include.model = model;
            if (!include.as) include.as = include.association.as;

            this._conformIncludes(include, model);

            return include;
          }

          if (include.model) {
            this._conformIncludes(include, include.model);

            return include;
          }

          if (include.all) {
            this._conformIncludes(include);

            return include;
          }
        }
      }

      throw new Error('Include unexpected. Element has to be either a Model, an Association or an object.');
    }
  }, {
    key: "_expandIncludeAllElement",
    value: function _expandIncludeAllElement(includes, include) {
      // check 'all' attribute provided is valid
      let all = include.all;
      delete include.all;

      if (all !== true) {
        if (!Array.isArray(all)) {
          all = [all];
        }

        const validTypes = {
          BelongsTo: true,
          HasOne: true,
          HasMany: true,
          One: ['BelongsTo', 'HasOne'],
          Has: ['HasOne', 'HasMany'],
          Many: ['HasMany']
        };

        for (let i = 0; i < all.length; i++) {
          const type = all[i];

          if (type === 'All') {
            all = true;
            break;
          }

          const types = validTypes[type];

          if (!types) {
            throw new sequelizeErrors.EagerLoadingError(`include all '${type}' is not valid - must be BelongsTo, HasOne, HasMany, One, Has, Many or All`);
          }

          if (types !== true) {
            // replace type placeholder e.g. 'One' with its constituent types e.g. 'HasOne', 'BelongsTo'
            all.splice(i, 1);
            i--;

            for (let j = 0; j < types.length; j++) {
              if (!all.includes(types[j])) {
                all.unshift(types[j]);
                i++;
              }
            }
          }
        }
      } // add all associations of types specified to includes


      const nested = include.nested;

      if (nested) {
        delete include.nested;

        if (!include.include) {
          include.include = [];
        } else if (!Array.isArray(include.include)) {
          include.include = [include.include];
        }
      }

      const used = [];

      (function addAllIncludes(parent, includes) {
        _.forEach(parent.associations, association => {
          if (all !== true && !all.includes(association.associationType)) {
            return;
          } // check if model already included, and skip if so


          const model = association.target;
          const as = association.options.as;
          const predicate = {
            model
          };

          if (as) {
            // We only add 'as' to the predicate if it actually exists
            predicate.as = as;
          }

          if (_.some(includes, predicate)) {
            return;
          } // skip if recursing over a model already nested


          if (nested && used.includes(model)) {
            return;
          }

          used.push(parent); // include this model

          const thisInclude = Utils.cloneDeep(include);
          thisInclude.model = model;

          if (as) {
            thisInclude.as = as;
          }

          includes.push(thisInclude); // run recursively if nested

          if (nested) {
            addAllIncludes(model, thisInclude.include);
            if (thisInclude.include.length === 0) delete thisInclude.include;
          }
        });

        used.pop();
      })(this, includes);
    }
  }, {
    key: "_validateIncludedElements",
    value: function _validateIncludedElements(options, tableNames) {
      if (!options.model) options.model = this;
      tableNames = tableNames || {};
      options.includeNames = [];
      options.includeMap = {};
      /* Legacy */

      options.hasSingleAssociation = false;
      options.hasMultiAssociation = false;

      if (!options.parent) {
        options.topModel = options.model;
        options.topLimit = options.limit;
      }

      options.include = options.include.map(include => {
        include = this._conformInclude(include);
        include.parent = options;
        include.topLimit = options.topLimit;

        this._validateIncludedElement.call(options.model, include, tableNames, options);

        if (include.duplicating === undefined) {
          include.duplicating = include.association.isMultiAssociation;
        }

        include.hasDuplicating = include.hasDuplicating || include.duplicating;
        include.hasRequired = include.hasRequired || include.required;
        options.hasDuplicating = options.hasDuplicating || include.hasDuplicating;
        options.hasRequired = options.hasRequired || include.required;
        options.hasWhere = options.hasWhere || include.hasWhere || !!include.where;
        return include;
      });

      for (const include of options.include) {
        include.hasParentWhere = options.hasParentWhere || !!options.where;
        include.hasParentRequired = options.hasParentRequired || !!options.required;

        if (include.subQuery !== false && options.hasDuplicating && options.topLimit) {
          if (include.duplicating) {
            include.subQuery = false;
            include.subQueryFilter = include.hasRequired;
          } else {
            include.subQuery = include.hasRequired;
            include.subQueryFilter = false;
          }
        } else {
          include.subQuery = include.subQuery || false;

          if (include.duplicating) {
            include.subQueryFilter = include.subQuery;
            include.subQuery = false;
          } else {
            include.subQueryFilter = false;
            include.subQuery = include.subQuery || include.hasParentRequired && include.hasRequired;
          }
        }

        options.includeMap[include.as] = include;
        options.includeNames.push(include.as); // Set top level options

        if (options.topModel === options.model && options.subQuery === undefined && options.topLimit) {
          if (include.subQuery) {
            options.subQuery = include.subQuery;
          } else if (include.hasDuplicating) {
            options.subQuery = true;
          }
        }
        /* Legacy */


        options.hasIncludeWhere = options.hasIncludeWhere || include.hasIncludeWhere || !!include.where;
        options.hasIncludeRequired = options.hasIncludeRequired || include.hasIncludeRequired || !!include.required;

        if (include.association.isMultiAssociation || include.hasMultiAssociation) {
          options.hasMultiAssociation = true;
        }

        if (include.association.isSingleAssociation || include.hasSingleAssociation) {
          options.hasSingleAssociation = true;
        }
      }

      if (options.topModel === options.model && options.subQuery === undefined) {
        options.subQuery = false;
      }

      return options;
    }
  }, {
    key: "_validateIncludedElement",
    value: function _validateIncludedElement(include, tableNames, options) {
      tableNames[include.model.getTableName()] = true;

      if (include.attributes && !options.raw) {
        include.model._expandAttributes(include);

        include.originalAttributes = this._injectDependentVirtualAttributes(include.attributes);
        include = Utils.mapFinderOptions(include, include.model);

        if (include.attributes.length) {
          _.each(include.model.primaryKeys, (attr, key) => {
            // Include the primary key if it's not already included - take into account that the pk might be aliased (due to a .field prop)
            if (!include.attributes.some(includeAttr => {
              if (attr.field !== key) {
                return Array.isArray(includeAttr) && includeAttr[0] === attr.field && includeAttr[1] === key;
              }

              return includeAttr === key;
            })) {
              include.attributes.unshift(key);
            }
          });
        }
      } else {
        include = Utils.mapFinderOptions(include, include.model);
      } // pseudo include just needed the attribute logic, return


      if (include._pseudo) {
        include.attributes = Object.keys(include.model.tableAttributes);
        return Utils.mapFinderOptions(include, include.model);
      } // check if the current Model is actually associated with the passed Model - or it's a pseudo include


      const association = include.association || this._getIncludedAssociation(include.model, include.as);

      include.association = association;
      include.as = association.as; // If through, we create a pseudo child include, to ease our parsing later on

      if (include.association.through && Object(include.association.through.model) === include.association.through.model) {
        if (!include.include) include.include = [];
        const through = include.association.through;
        include.through = _.defaults(include.through || {}, {
          model: through.model,
          as: through.model.name,
          association: {
            isSingleAssociation: true
          },
          _pseudo: true,
          parent: include
        });

        if (through.scope) {
          include.through.where = include.through.where ? {
            [Op.and]: [include.through.where, through.scope]
          } : through.scope;
        }

        include.include.push(include.through);
        tableNames[through.tableName] = true;
      } // include.model may be the main model, while the association target may be scoped - thus we need to look at association.target/source


      let model;

      if (include.model.scoped === true) {
        // If the passed model is already scoped, keep that
        model = include.model;
      } else {
        // Otherwise use the model that was originally passed to the association
        model = include.association.target.name === include.model.name ? include.association.target : include.association.source;
      }

      model._injectScope(include); // This check should happen after injecting the scope, since the scope may contain a .attributes


      if (!include.attributes) {
        include.attributes = Object.keys(include.model.tableAttributes);
      }

      include = Utils.mapFinderOptions(include, include.model);

      if (include.required === undefined) {
        include.required = !!include.where;
      }

      if (include.association.scope) {
        include.where = include.where ? {
          [Op.and]: [include.where, include.association.scope]
        } : include.association.scope;
      }

      if (include.limit && include.separate === undefined) {
        include.separate = true;
      }

      if (include.separate === true) {
        if (!(include.association instanceof HasMany)) {
          throw new Error('Only HasMany associations support include.separate');
        }

        include.duplicating = false;

        if (options.attributes && options.attributes.length && !_.flattenDepth(options.attributes, 2).includes(association.sourceKey)) {
          options.attributes.push(association.sourceKey);
        }

        if (include.attributes && include.attributes.length && !_.flattenDepth(include.attributes, 2).includes(association.foreignKey)) {
          include.attributes.push(association.foreignKey);
        }
      } // Validate child includes


      if (Object.prototype.hasOwnProperty.call(include, 'include')) {
        this._validateIncludedElements.call(include.model, include, tableNames);
      }

      return include;
    }
  }, {
    key: "_getIncludedAssociation",
    value: function _getIncludedAssociation(targetModel, targetAlias) {
      const associations = this.getAssociations(targetModel);
      let association = null;

      if (associations.length === 0) {
        throw new sequelizeErrors.EagerLoadingError(`${targetModel.name} is not associated to ${this.name}!`);
      }

      if (associations.length === 1) {
        association = this.getAssociationForAlias(targetModel, targetAlias);

        if (association) {
          return association;
        }

        if (targetAlias) {
          const existingAliases = this.getAssociations(targetModel).map(association => association.as);
          throw new sequelizeErrors.EagerLoadingError(`${targetModel.name} is associated to ${this.name} using an alias. ` + `You've included an alias (${targetAlias}), but it does not match the alias(es) defined in your association (${existingAliases.join(', ')}).`);
        }

        throw new sequelizeErrors.EagerLoadingError(`${targetModel.name} is associated to ${this.name} using an alias. ` + 'You must use the \'as\' keyword to specify the alias within your include statement.');
      }

      association = this.getAssociationForAlias(targetModel, targetAlias);

      if (!association) {
        throw new sequelizeErrors.EagerLoadingError(`${targetModel.name} is associated to ${this.name} multiple times. ` + 'To identify the correct association, you must use the \'as\' keyword to specify the alias of the association you want to include.');
      }

      return association;
    }
  }, {
    key: "_expandIncludeAll",
    value: function _expandIncludeAll(options) {
      const includes = options.include;

      if (!includes) {
        return;
      }

      for (let index = 0; index < includes.length; index++) {
        const include = includes[index];

        if (include.all) {
          includes.splice(index, 1);
          index--;

          this._expandIncludeAllElement(includes, include);
        }
      }

      includes.forEach(include => {
        this._expandIncludeAll.call(include.model, include);
      });
    }
  }, {
    key: "_conformIndex",
    value: function _conformIndex(index) {
      if (!index.fields) {
        throw new Error('Missing "fields" property for index definition');
      }

      index = _.defaults(index, {
        type: '',
        parser: null
      });

      if (index.type && index.type.toLowerCase() === 'unique') {
        index.unique = true;
        delete index.type;
      }

      return index;
    }
  }, {
    key: "_uniqIncludes",
    value: function _uniqIncludes(options) {
      if (!options.include) return;
      options.include = _(options.include).groupBy(include => `${include.model && include.model.name}-${include.as}`).map(includes => this._assignOptions(...includes)).value();
    }
  }, {
    key: "_baseMerge",
    value: function _baseMerge(...args) {
      _.assignWith(...args);

      this._conformIncludes(args[0], this);

      this._uniqIncludes(args[0]);

      return args[0];
    }
  }, {
    key: "_mergeFunction",
    value: function _mergeFunction(objValue, srcValue, key) {
      if (Array.isArray(objValue) && Array.isArray(srcValue)) {
        return _.union(objValue, srcValue);
      }

      if (key === 'where' || key === 'having') {
        if (srcValue instanceof Utils.SequelizeMethod) {
          srcValue = {
            [Op.and]: srcValue
          };
        }

        if (_.isPlainObject(objValue) && _.isPlainObject(srcValue)) {
          return Object.assign(objValue, srcValue);
        }
      } else if (key === 'attributes' && _.isPlainObject(objValue) && _.isPlainObject(srcValue)) {
        return _.assignWith(objValue, srcValue, (objValue, srcValue) => {
          if (Array.isArray(objValue) && Array.isArray(srcValue)) {
            return _.union(objValue, srcValue);
          }
        });
      } // If we have a possible object/array to clone, we try it.
      // Otherwise, we return the original value when it's not undefined,
      // or the resulting object in that case.


      if (srcValue) {
        return Utils.cloneDeep(srcValue, true);
      }

      return srcValue === undefined ? objValue : srcValue;
    }
  }, {
    key: "_assignOptions",
    value: function _assignOptions(...args) {
      return this._baseMerge(...args, this._mergeFunction);
    }
  }, {
    key: "_defaultsOptions",
    value: function _defaultsOptions(target, opts) {
      return this._baseMerge(target, opts, (srcValue, objValue, key) => {
        return this._mergeFunction(objValue, srcValue, key);
      });
    }
    /**
     * Initialize a model, representing a table in the DB, with attributes and options.
     *
     * The table columns are defined by the hash that is given as the first argument.
     * Each attribute of the hash represents a column.
     *
     * For more about <a href="/manual/tutorial/models-definition.html#validations"/>Validations</a>
     *
     * More examples, <a href="/manual/tutorial/models-definition.html"/>Model Definition</a>
     *
     * @example
     * Project.init({
     *   columnA: {
     *     type: Sequelize.BOOLEAN,
     *     validate: {
     *       is: ['[a-z]','i'],        // will only allow letters
     *       max: 23,                  // only allow values <= 23
     *       isIn: {
     *         args: [['en', 'zh']],
     *         msg: "Must be English or Chinese"
     *       }
     *     },
     *     field: 'column_a'
     *     // Other attributes here
     *   },
     *   columnB: Sequelize.STRING,
     *   columnC: 'MY VERY OWN COLUMN TYPE'
     * }, {sequelize})
     *
     * sequelize.models.modelName // The model will now be available in models under the class name
     *
     * @see
     * {@link DataTypes}
     * @see
     * {@link Hooks}
     *
     * @param {Object}                  attributes An object, where each attribute is a column of the table. Each column can be either a DataType, a string or a type-description object, with the properties described below:
     * @param {string|DataTypes|Object} attributes.column The description of a database column
     * @param {string|DataTypes}        attributes.column.type A string or a data type
     * @param {boolean}                 [attributes.column.allowNull=true] If false, the column will have a NOT NULL constraint, and a not null validation will be run before an instance is saved.
     * @param {any}                     [attributes.column.defaultValue=null] A literal default value, a JavaScript function, or an SQL function (see `sequelize.fn`)
     * @param {string|boolean}          [attributes.column.unique=false] If true, the column will get a unique constraint. If a string is provided, the column will be part of a composite unique index. If multiple columns have the same string, they will be part of the same unique index
     * @param {boolean}                 [attributes.column.primaryKey=false] If true, this attribute will be marked as primary key
     * @param {string}                  [attributes.column.field=null] If set, sequelize will map the attribute name to a different name in the database
     * @param {boolean}                 [attributes.column.autoIncrement=false] If true, this column will be set to auto increment
     * @param {boolean}                 [attributes.column.autoIncrementIdentity=false] If true, combined with autoIncrement=true, will use Postgres `GENERATED BY DEFAULT AS IDENTITY` instead of `SERIAL`. Postgres 10+ only.
     * @param {string}                  [attributes.column.comment=null] Comment for this column
     * @param {string|Model}            [attributes.column.references=null] An object with reference configurations
     * @param {string|Model}            [attributes.column.references.model] If this column references another table, provide it here as a Model, or a string
     * @param {string}                  [attributes.column.references.key='id'] The column of the foreign table that this column references
     * @param {string}                  [attributes.column.onUpdate] What should happen when the referenced key is updated. One of CASCADE, RESTRICT, SET DEFAULT, SET NULL or NO ACTION
     * @param {string}                  [attributes.column.onDelete] What should happen when the referenced key is deleted. One of CASCADE, RESTRICT, SET DEFAULT, SET NULL or NO ACTION
     * @param {Function}                [attributes.column.get] Provide a custom getter for this column. Use `this.getDataValue(String)` to manipulate the underlying values.
     * @param {Function}                [attributes.column.set] Provide a custom setter for this column. Use `this.setDataValue(String, Value)` to manipulate the underlying values.
     * @param {Object}                  [attributes.column.validate] An object of validations to execute for this column every time the model is saved. Can be either the name of a validation provided by validator.js, a validation function provided by extending validator.js (see the `DAOValidator` property for more details), or a custom validation function. Custom validation functions are called with the value of the field and the instance itself as the `this` binding, and can possibly take a second callback argument, to signal that they are asynchronous. If the validator is sync, it should throw in the case of a failed validation; if it is async, the callback should be called with the error text.
     * @param {Object}                  options These options are merged with the default define options provided to the Sequelize constructor
     * @param {Object}                  options.sequelize Define the sequelize instance to attach to the new Model. Throw error if none is provided.
     * @param {string}                  [options.modelName] Set name of the model. By default its same as Class name.
     * @param {Object}                  [options.defaultScope={}] Define the default search scope to use for this model. Scopes have the same form as the options passed to find / findAll
     * @param {Object}                  [options.scopes] More scopes, defined in the same way as defaultScope above. See `Model.scope` for more information about how scopes are defined, and what you can do with them
     * @param {boolean}                 [options.omitNull] Don't persist null values. This means that all columns with null values will not be saved
     * @param {boolean}                 [options.timestamps=true] Adds createdAt and updatedAt timestamps to the model.
     * @param {boolean}                 [options.paranoid=false] Calling `destroy` will not delete the model, but instead set a `deletedAt` timestamp if this is true. Needs `timestamps=true` to work
     * @param {boolean}                 [options.underscored=false] Add underscored field to all attributes, this covers user defined attributes, timestamps and foreign keys. Will not affect attributes with explicitly set `field` option
     * @param {boolean}                 [options.freezeTableName=false] If freezeTableName is true, sequelize will not try to alter the model name to get the table name. Otherwise, the model name will be pluralized
     * @param {Object}                  [options.name] An object with two attributes, `singular` and `plural`, which are used when this model is associated to others.
     * @param {string}                  [options.name.singular=Utils.singularize(modelName)] Singular name for model
     * @param {string}                  [options.name.plural=Utils.pluralize(modelName)] Plural name for model
     * @param {Array<Object>}           [options.indexes] indexes definitions
     * @param {string}                  [options.indexes[].name] The name of the index. Defaults to model name + _ + fields concatenated
     * @param {string}                  [options.indexes[].type] Index type. Only used by mysql. One of `UNIQUE`, `FULLTEXT` and `SPATIAL`
     * @param {string}                  [options.indexes[].using] The method to create the index by (`USING` statement in SQL). BTREE and HASH are supported by mysql and postgres, and postgres additionally supports GIST and GIN.
     * @param {string}                  [options.indexes[].operator] Specify index operator.
     * @param {boolean}                 [options.indexes[].unique=false] Should the index by unique? Can also be triggered by setting type to `UNIQUE`
     * @param {boolean}                 [options.indexes[].concurrently=false] PostgresSQL will build the index without taking any write locks. Postgres only
     * @param {Array<string|Object>}    [options.indexes[].fields] An array of the fields to index. Each field can either be a string containing the name of the field, a sequelize object (e.g `sequelize.fn`), or an object with the following attributes: `attribute` (field name), `length` (create a prefix index of length chars), `order` (the direction the column should be sorted in), `collate` (the collation (sort order) for the column)
     * @param {string|boolean}          [options.createdAt] Override the name of the createdAt attribute if a string is provided, or disable it if false. Timestamps must be true. Underscored field will be set with underscored setting.
     * @param {string|boolean}          [options.updatedAt] Override the name of the updatedAt attribute if a string is provided, or disable it if false. Timestamps must be true. Underscored field will be set with underscored setting.
     * @param {string|boolean}          [options.deletedAt] Override the name of the deletedAt attribute if a string is provided, or disable it if false. Timestamps must be true. Underscored field will be set with underscored setting.
     * @param {string}                  [options.tableName] Defaults to pluralized model name, unless freezeTableName is true, in which case it uses model name verbatim
     * @param {string}                  [options.schema='public'] schema
     * @param {string}                  [options.engine] Specify engine for model's table
     * @param {string}                  [options.charset] Specify charset for model's table
     * @param {string}                  [options.comment] Specify comment for model's table
     * @param {string}                  [options.collate] Specify collation for model's table
     * @param {string}                  [options.initialAutoIncrement] Set the initial AUTO_INCREMENT value for the table in MySQL.
     * @param {Object}                  [options.hooks] An object of hook function that are called before and after certain lifecycle events. The possible hooks are: beforeValidate, afterValidate, validationFailed, beforeBulkCreate, beforeBulkDestroy, beforeBulkUpdate, beforeCreate, beforeDestroy, beforeUpdate, afterCreate, beforeSave, afterDestroy, afterUpdate, afterBulkCreate, afterSave, afterBulkDestroy and afterBulkUpdate. See Hooks for more information about hook functions and their signatures. Each property can either be a function, or an array of functions.
     * @param {Object}                  [options.validate] An object of model wide validations. Validations have access to all model values via `this`. If the validator function takes an argument, it is assumed to be async, and is called with a callback that accepts an optional error.
     *
     * @returns {Model}
     */

  }, {
    key: "init",
    value: function init(attributes, options = {}) {
      if (!options.sequelize) {
        throw new Error('No Sequelize instance passed');
      }

      this.sequelize = options.sequelize;
      const globalOptions = this.sequelize.options;
      options = Utils.merge(_.cloneDeep(globalOptions.define), options);

      if (!options.modelName) {
        options.modelName = this.name;
      }

      options = Utils.merge({
        name: {
          plural: Utils.pluralize(options.modelName),
          singular: Utils.singularize(options.modelName)
        },
        indexes: [],
        omitNull: globalOptions.omitNull,
        schema: globalOptions.schema
      }, options);
      this.sequelize.runHooks('beforeDefine', attributes, options);

      if (options.modelName !== this.name) {
        Object.defineProperty(this, 'name', {
          value: options.modelName
        });
      }

      delete options.modelName;
      this.options = Object.assign({
        timestamps: true,
        validate: {},
        freezeTableName: false,
        underscored: false,
        paranoid: false,
        rejectOnEmpty: false,
        whereCollection: null,
        schema: null,
        schemaDelimiter: '',
        defaultScope: {},
        scopes: {},
        indexes: []
      }, options); // if you call "define" multiple times for the same modelName, do not clutter the factory

      if (this.sequelize.isDefined(this.name)) {
        this.sequelize.modelManager.removeModel(this.sequelize.modelManager.getModel(this.name));
      }

      this.associations = {};

      this._setupHooks(options.hooks);

      this.underscored = this.options.underscored;

      if (!this.options.tableName) {
        this.tableName = this.options.freezeTableName ? this.name : Utils.underscoredIf(Utils.pluralize(this.name), this.underscored);
      } else {
        this.tableName = this.options.tableName;
      }

      this._schema = this.options.schema;
      this._schemaDelimiter = this.options.schemaDelimiter; // error check options

      _.each(options.validate, (validator, validatorType) => {
        if (Object.prototype.hasOwnProperty.call(attributes, validatorType)) {
          throw new Error(`A model validator function must not have the same name as a field. Model: ${this.name}, field/validation name: ${validatorType}`);
        }

        if (typeof validator !== 'function') {
          throw new Error(`Members of the validate option must be functions. Model: ${this.name}, error with validate member ${validatorType}`);
        }
      });

      this.rawAttributes = _.mapValues(attributes, (attribute, name) => {
        attribute = this.sequelize.normalizeAttribute(attribute);

        if (attribute.type === undefined) {
          throw new Error(`Unrecognized datatype for attribute "${this.name}.${name}"`);
        }

        if (attribute.allowNull !== false && _.get(attribute, 'validate.notNull')) {
          throw new Error(`Invalid definition for "${this.name}.${name}", "notNull" validator is only allowed with "allowNull:false"`);
        }

        if (_.get(attribute, 'references.model.prototype') instanceof Model) {
          attribute.references.model = attribute.references.model.getTableName();
        }

        return attribute;
      });
      const tableName = this.getTableName();
      this._indexes = this.options.indexes.map(index => Utils.nameIndex(this._conformIndex(index), tableName));
      this.primaryKeys = {};
      this._readOnlyAttributes = new Set();
      this._timestampAttributes = {}; // setup names of timestamp attributes

      if (this.options.timestamps) {
        if (this.options.createdAt !== false) {
          this._timestampAttributes.createdAt = this.options.createdAt || 'createdAt';

          this._readOnlyAttributes.add(this._timestampAttributes.createdAt);
        }

        if (this.options.updatedAt !== false) {
          this._timestampAttributes.updatedAt = this.options.updatedAt || 'updatedAt';

          this._readOnlyAttributes.add(this._timestampAttributes.updatedAt);
        }

        if (this.options.paranoid && this.options.deletedAt !== false) {
          this._timestampAttributes.deletedAt = this.options.deletedAt || 'deletedAt';

          this._readOnlyAttributes.add(this._timestampAttributes.deletedAt);
        }
      } // setup name for version attribute


      if (this.options.version) {
        this._versionAttribute = typeof this.options.version === 'string' ? this.options.version : 'version';

        this._readOnlyAttributes.add(this._versionAttribute);
      }

      this._hasReadOnlyAttributes = this._readOnlyAttributes.size > 0; // Add head and tail default attributes (id, timestamps)

      this._addDefaultAttributes();

      this.refreshAttributes();

      this._findAutoIncrementAttribute();

      this._scope = this.options.defaultScope;
      this._scopeNames = ['defaultScope'];
      this.sequelize.modelManager.addModel(this);
      this.sequelize.runHooks('afterDefine', this);
      return this;
    }
  }, {
    key: "refreshAttributes",
    value: function refreshAttributes() {
      const attributeManipulation = {};
      this.prototype._customGetters = {};
      this.prototype._customSetters = {};
      ['get', 'set'].forEach(type => {
        const opt = `${type}terMethods`;

        const funcs = _.clone(_.isObject(this.options[opt]) ? this.options[opt] : {});

        const _custom = type === 'get' ? this.prototype._customGetters : this.prototype._customSetters;

        _.each(funcs, (method, attribute) => {
          _custom[attribute] = method;

          if (type === 'get') {
            funcs[attribute] = function () {
              return this.get(attribute);
            };
          }

          if (type === 'set') {
            funcs[attribute] = function (value) {
              return this.set(attribute, value);
            };
          }
        });

        _.each(this.rawAttributes, (options, attribute) => {
          if (Object.prototype.hasOwnProperty.call(options, type)) {
            _custom[attribute] = options[type];
          }

          if (type === 'get') {
            funcs[attribute] = function () {
              return this.get(attribute);
            };
          }

          if (type === 'set') {
            funcs[attribute] = function (value) {
              return this.set(attribute, value);
            };
          }
        });

        _.each(funcs, (fct, name) => {
          if (!attributeManipulation[name]) {
            attributeManipulation[name] = {
              configurable: true
            };
          }

          attributeManipulation[name][type] = fct;
        });
      });
      this._dataTypeChanges = {};
      this._dataTypeSanitizers = {};
      this._hasBooleanAttributes = false;
      this._hasDateAttributes = false;
      this._jsonAttributes = new Set();
      this._virtualAttributes = new Set();
      this._defaultValues = {};
      this.prototype.validators = {};
      this.fieldRawAttributesMap = {};
      this.primaryKeys = {};
      this.uniqueKeys = {};

      _.each(this.rawAttributes, (definition, name) => {
        definition.type = this.sequelize.normalizeDataType(definition.type);
        definition.Model = this;
        definition.fieldName = name;
        definition._modelAttribute = true;

        if (definition.field === undefined) {
          definition.field = Utils.underscoredIf(name, this.underscored);
        }

        if (definition.primaryKey === true) {
          this.primaryKeys[name] = definition;
        }

        this.fieldRawAttributesMap[definition.field] = definition;

        if (definition.type._sanitize) {
          this._dataTypeSanitizers[name] = definition.type._sanitize;
        }

        if (definition.type._isChanged) {
          this._dataTypeChanges[name] = definition.type._isChanged;
        }

        if (definition.type instanceof DataTypes.BOOLEAN) {
          this._hasBooleanAttributes = true;
        } else if (definition.type instanceof DataTypes.DATE || definition.type instanceof DataTypes.DATEONLY) {
          this._hasDateAttributes = true;
        } else if (definition.type instanceof DataTypes.JSON) {
          this._jsonAttributes.add(name);
        } else if (definition.type instanceof DataTypes.VIRTUAL) {
          this._virtualAttributes.add(name);
        }

        if (Object.prototype.hasOwnProperty.call(definition, 'defaultValue')) {
          this._defaultValues[name] = () => Utils.toDefaultValue(definition.defaultValue, this.sequelize.options.dialect);
        }

        if (Object.prototype.hasOwnProperty.call(definition, 'unique') && definition.unique) {
          let idxName;

          if (typeof definition.unique === 'object' && Object.prototype.hasOwnProperty.call(definition.unique, 'name')) {
            idxName = definition.unique.name;
          } else if (typeof definition.unique === 'string') {
            idxName = definition.unique;
          } else {
            idxName = `${this.tableName}_${name}_unique`;
          }

          const idx = this.uniqueKeys[idxName] || {
            fields: []
          };
          idx.fields.push(definition.field);
          idx.msg = idx.msg || definition.unique.msg || null;
          idx.name = idxName || false;
          idx.column = name;
          idx.customIndex = definition.unique !== true;
          this.uniqueKeys[idxName] = idx;
        }

        if (Object.prototype.hasOwnProperty.call(definition, 'validate')) {
          this.prototype.validators[name] = definition.validate;
        }

        if (definition.index === true && definition.type instanceof DataTypes.JSONB) {
          this._indexes.push(Utils.nameIndex(this._conformIndex({
            fields: [definition.field || name],
            using: 'gin'
          }), this.getTableName()));

          delete definition.index;
        }
      }); // Create a map of field to attribute names


      this.fieldAttributeMap = _.reduce(this.fieldRawAttributesMap, (map, value, key) => {
        if (key !== value.fieldName) {
          map[key] = value.fieldName;
        }

        return map;
      }, {});
      this._hasJsonAttributes = !!this._jsonAttributes.size;
      this._hasVirtualAttributes = !!this._virtualAttributes.size;
      this._hasDefaultValues = !_.isEmpty(this._defaultValues);
      this.tableAttributes = _.omitBy(this.rawAttributes, (_a, key) => this._virtualAttributes.has(key));
      this.prototype._hasCustomGetters = Object.keys(this.prototype._customGetters).length;
      this.prototype._hasCustomSetters = Object.keys(this.prototype._customSetters).length;

      for (const key of Object.keys(attributeManipulation)) {
        if (Object.prototype.hasOwnProperty.call(Model.prototype, key)) {
          this.sequelize.log(`Not overriding built-in method from model attribute: ${key}`);
          continue;
        }

        Object.defineProperty(this.prototype, key, attributeManipulation[key]);
      }

      this.prototype.rawAttributes = this.rawAttributes;

      this.prototype._isAttribute = key => Object.prototype.hasOwnProperty.call(this.prototype.rawAttributes, key); // Primary key convenience constiables


      this.primaryKeyAttributes = Object.keys(this.primaryKeys);
      this.primaryKeyAttribute = this.primaryKeyAttributes[0];

      if (this.primaryKeyAttribute) {
        this.primaryKeyField = this.rawAttributes[this.primaryKeyAttribute].field || this.primaryKeyAttribute;
      }

      this._hasPrimaryKeys = this.primaryKeyAttributes.length > 0;

      this._isPrimaryKey = key => this.primaryKeyAttributes.includes(key);
    }
    /**
     * Remove attribute from model definition
     *
     * @param {string} attribute name of attribute to remove
     */

  }, {
    key: "removeAttribute",
    value: function removeAttribute(attribute) {
      delete this.rawAttributes[attribute];
      this.refreshAttributes();
    }
    /**
     * Sync this Model to the DB, that is create the table.
     *
     * @param {Object} [options] sync options
     *
     * @see
     * {@link Sequelize#sync} for options
     *
     * @returns {Promise<Model>}
     */

  }, {
    key: "sync",
    value: function sync(options) {
      options = Object.assign({}, this.options, options);
      options.hooks = options.hooks === undefined ? true : !!options.hooks;
      const attributes = this.tableAttributes;
      const rawAttributes = this.fieldRawAttributesMap;
      return Promise.try(() => {
        if (options.hooks) {
          return this.runHooks('beforeSync', options);
        }
      }).then(() => {
        if (options.force) {
          return this.drop(options);
        }
      }).then(() => this.QueryInterface.createTable(this.getTableName(options), attributes, options, this)).then(() => {
        if (!options.alter) {
          return;
        }

        return Promise.all([this.QueryInterface.describeTable(this.getTableName(options)), this.QueryInterface.getForeignKeyReferencesForTable(this.getTableName(options))]).then(tableInfos => {
          const columns = tableInfos[0]; // Use for alter foreign keys

          const foreignKeyReferences = tableInfos[1];
          const changes = []; // array of promises to run

          const removedConstraints = {};

          _.each(attributes, (columnDesc, columnName) => {
            if (!columns[columnName] && !columns[attributes[columnName].field]) {
              changes.push(() => this.QueryInterface.addColumn(this.getTableName(options), attributes[columnName].field || columnName, attributes[columnName]));
            }
          });

          _.each(columns, (columnDesc, columnName) => {
            const currentAttribute = rawAttributes[columnName];

            if (!currentAttribute) {
              changes.push(() => this.QueryInterface.removeColumn(this.getTableName(options), columnName, options));
            } else if (!currentAttribute.primaryKey) {
              // Check foreign keys. If it's a foreign key, it should remove constraint first.
              const references = currentAttribute.references;

              if (currentAttribute.references) {
                const database = this.sequelize.config.database;
                const schema = this.sequelize.config.schema; // Find existed foreign keys

                _.each(foreignKeyReferences, foreignKeyReference => {
                  const constraintName = foreignKeyReference.constraintName;

                  if (!!constraintName && foreignKeyReference.tableCatalog === database && (schema ? foreignKeyReference.tableSchema === schema : true) && foreignKeyReference.referencedTableName === references.model && foreignKeyReference.referencedColumnName === references.key && (schema ? foreignKeyReference.referencedTableSchema === schema : true) && !removedConstraints[constraintName]) {
                    // Remove constraint on foreign keys.
                    changes.push(() => this.QueryInterface.removeConstraint(this.getTableName(options), constraintName, options));
                    removedConstraints[constraintName] = true;
                  }
                });
              }

              changes.push(() => this.QueryInterface.changeColumn(this.getTableName(options), columnName, currentAttribute));
            }
          });

          return Promise.each(changes, f => f());
        });
      }).then(() => this.QueryInterface.showIndex(this.getTableName(options), options)).then(indexes => {
        indexes = this._indexes.filter(item1 => !indexes.some(item2 => item1.name === item2.name)).sort((index1, index2) => {
          if (this.sequelize.options.dialect === 'postgres') {
            // move concurrent indexes to the bottom to avoid weird deadlocks
            if (index1.concurrently === true) return 1;
            if (index2.concurrently === true) return -1;
          }

          return 0;
        });
        return Promise.each(indexes, index => this.QueryInterface.addIndex(this.getTableName(options), Object.assign({
          logging: options.logging,
          benchmark: options.benchmark,
          transaction: options.transaction,
          schema: options.schema
        }, index), this.tableName));
      }).then(() => {
        if (options.hooks) {
          return this.runHooks('afterSync', options);
        }
      }).return(this);
    }
    /**
     * Drop the table represented by this Model
     *
     * @param {Object}   [options] drop options
     * @param {boolean}  [options.cascade=false]   Also drop all objects depending on this table, such as views. Only works in postgres
     * @param {Function} [options.logging=false]   A function that gets executed while running the query to log the sql.
     * @param {boolean}  [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
     *
     * @returns {Promise}
     */

  }, {
    key: "drop",
    value: function drop(options) {
      return this.QueryInterface.dropTable(this.getTableName(options), options);
    }
  }, {
    key: "dropSchema",
    value: function dropSchema(schema) {
      return this.QueryInterface.dropSchema(schema);
    }
    /**
     * Apply a schema to this model. For postgres, this will actually place the schema in front of the table name - `"schema"."tableName"`,
     * while the schema will be prepended to the table name for mysql and sqlite - `'schema.tablename'`.
     *
     * This method is intended for use cases where the same model is needed in multiple schemas. In such a use case it is important
     * to call `model.schema(schema, [options]).sync()` for each model to ensure the models are created in the correct schema.
     *
     * If a single default schema per model is needed, set the `options.schema='schema'` parameter during the `define()` call
     * for the model.
     *
     * @param {string}   schema The name of the schema
     * @param {Object}   [options] schema options
     * @param {string}   [options.schemaDelimiter='.'] The character(s) that separates the schema name from the table name
     * @param {Function} [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {boolean}  [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
     *
     * @see
     * {@link Sequelize#define} for more information about setting a default schema.
     *
     * @returns {Model}
     */

  }, {
    key: "schema",
    value: function schema(_schema, options) {
      const clone = /*#__PURE__*/function (_this) {
        _inherits(clone, _this);

        var _super = _createSuper(clone);

        function clone() {
          _classCallCheck(this, clone);

          return _super.apply(this, arguments);
        }

        return clone;
      }(this);

      Object.defineProperty(clone, 'name', {
        value: this.name
      });
      clone._schema = _schema;

      if (options) {
        if (typeof options === 'string') {
          clone._schemaDelimiter = options;
        } else if (options.schemaDelimiter) {
          clone._schemaDelimiter = options.schemaDelimiter;
        }
      }

      return clone;
    }
    /**
     * Get the table name of the model, taking schema into account. The method will return The name as a string if the model has no schema,
     * or an object with `tableName`, `schema` and `delimiter` properties.
     *
     * @returns {string|Object}
     */

  }, {
    key: "getTableName",
    value: function getTableName() {
      return this.QueryGenerator.addSchema(this);
    }
    /**
     * Get un-scoped model
     *
     * @returns {Model}
     */

  }, {
    key: "unscoped",
    value: function unscoped() {
      return this.scope();
    }
    /**
     * Add a new scope to the model. This is especially useful for adding scopes with includes, when the model you want to include is not available at the time this model is defined.
     *
     * By default this will throw an error if a scope with that name already exists. Pass `override: true` in the options object to silence this error.
     *
     * @param {string}          name The name of the scope. Use `defaultScope` to override the default scope
     * @param {Object|Function} scope scope or options
     * @param {Object}          [options] scope options
     * @param {boolean}         [options.override=false] override old scope if already defined
     */

  }, {
    key: "addScope",
    value: function addScope(name, scope, options) {
      options = Object.assign({
        override: false
      }, options);

      if ((name === 'defaultScope' && Object.keys(this.options.defaultScope).length > 0 || name in this.options.scopes) && options.override === false) {
        throw new Error(`The scope ${name} already exists. Pass { override: true } as options to silence this error`);
      }

      if (name === 'defaultScope') {
        this.options.defaultScope = this._scope = scope;
      } else {
        this.options.scopes[name] = scope;
      }
    }
    /**
     * Apply a scope created in `define` to the model.
     *
     * @example <caption>how to create scopes</caption>
     * const Model = sequelize.define('model', attributes, {
     *   defaultScope: {
     *     where: {
     *       username: 'dan'
     *     },
     *     limit: 12
     *   },
     *   scopes: {
     *     isALie: {
     *       where: {
     *         stuff: 'cake'
     *       }
     *     },
     *     complexFunction: function(email, accessLevel) {
     *       return {
     *         where: {
     *           email: {
     *             [Op.like]: email
     *           },
     *           access_level {
     *             [Op.gte]: accessLevel
     *           }
     *         }
     *       }
     *     }
     *   }
     * })
     *
     * # As you have defined a default scope, every time you do Model.find, the default scope is appended to your query. Here's a couple of examples:
     *
     * Model.findAll() // WHERE username = 'dan'
     * Model.findAll({ where: { age: { [Op.gt]: 12 } } }) // WHERE age > 12 AND username = 'dan'
     *
     * @example <caption>To invoke scope functions you can do</caption>
     * Model.scope({ method: ['complexFunction', 'dan@sequelize.com', 42]}).findAll()
     * // WHERE email like 'dan@sequelize.com%' AND access_level >= 42
     *
     * @param {?Array|Object|string} [option] The scope(s) to apply. Scopes can either be passed as consecutive arguments, or as an array of arguments. To apply simple scopes and scope functions with no arguments, pass them as strings. For scope function, pass an object, with a `method` property. The value can either be a string, if the method does not take any arguments, or an array, where the first element is the name of the method, and consecutive elements are arguments to that method. Pass null to remove all scopes, including the default.
     *
     * @returns {Model} A reference to the model, with the scope(s) applied. Calling scope again on the returned model will clear the previous scope.
     */

  }, {
    key: "scope",
    value: function scope(option) {
      const self = /*#__PURE__*/function (_this2) {
        _inherits(self, _this2);

        var _super2 = _createSuper(self);

        function self() {
          _classCallCheck(this, self);

          return _super2.apply(this, arguments);
        }

        return self;
      }(this);

      let scope;
      let scopeName;
      Object.defineProperty(self, 'name', {
        value: this.name
      });
      self._scope = {};
      self._scopeNames = [];
      self.scoped = true;

      if (!option) {
        return self;
      }

      const options = _.flatten(arguments);

      for (const option of options) {
        scope = null;
        scopeName = null;

        if (_.isPlainObject(option)) {
          if (option.method) {
            if (Array.isArray(option.method) && !!self.options.scopes[option.method[0]]) {
              scopeName = option.method[0];
              scope = self.options.scopes[scopeName].apply(self, option.method.slice(1));
            } else if (self.options.scopes[option.method]) {
              scopeName = option.method;
              scope = self.options.scopes[scopeName].apply(self);
            }
          } else {
            scope = option;
          }
        } else if (option === 'defaultScope' && _.isPlainObject(self.options.defaultScope)) {
          scope = self.options.defaultScope;
        } else {
          scopeName = option;
          scope = self.options.scopes[scopeName];

          if (typeof scope === 'function') {
            scope = scope();
          }
        }

        if (scope) {
          this._conformIncludes(scope, this);

          this._assignOptions(self._scope, scope);

          self._scopeNames.push(scopeName ? scopeName : 'defaultScope');
        } else {
          throw new sequelizeErrors.SequelizeScopeError(`Invalid scope ${scopeName} called.`);
        }
      }

      return self;
    }
    /**
     * Search for multiple instances.
     *
     * @example <caption>Simple search using AND and =</caption>
     * Model.findAll({
     *   where: {
     *     attr1: 42,
     *     attr2: 'cake'
     *   }
     * })
     *
     * # WHERE attr1 = 42 AND attr2 = 'cake'
     *
     * @example <caption>Using greater than, less than etc.</caption>
     * const {gt, lte, ne, in: opIn} = Sequelize.Op;
     *
     * Model.findAll({
     *   where: {
     *     attr1: {
     *       [gt]: 50
     *     },
     *     attr2: {
     *       [lte]: 45
     *     },
     *     attr3: {
     *       [opIn]: [1,2,3]
     *     },
     *     attr4: {
     *       [ne]: 5
     *     }
     *   }
     * })
     *
     * # WHERE attr1 > 50 AND attr2 <= 45 AND attr3 IN (1,2,3) AND attr4 != 5
     *
     * @example <caption>Queries using OR</caption>
     * const {or, and, gt, lt} = Sequelize.Op;
     *
     * Model.findAll({
     *   where: {
     *     name: 'a project',
     *     [or]: [
     *       {id: [1, 2, 3]},
     *       {
     *         [and]: [
     *           {id: {[gt]: 10}},
     *           {id: {[lt]: 100}}
     *         ]
     *       }
     *     ]
     *   }
     * });
     *
     * # WHERE `Model`.`name` = 'a project' AND (`Model`.`id` IN (1, 2, 3) OR (`Model`.`id` > 10 AND `Model`.`id` < 100));
     *
     * @see
     * {@link Operators} for possible operators
     * __Alias__: _all_
     *
     * The promise is resolved with an array of Model instances if the query succeeds._
     *
     * @param  {Object}                                                    [options] A hash of options to describe the scope of the search
     * @param  {Object}                                                    [options.where] A hash of attributes to describe your search. See above for examples.
     * @param  {Array<string>|Object}                                      [options.attributes] A list of the attributes that you want to select, or an object with `include` and `exclude` keys. To rename an attribute, you can pass an array, with two elements - the first is the name of the attribute in the DB (or some kind of expression such as `Sequelize.literal`, `Sequelize.fn` and so on), and the second is the name you want the attribute to have in the returned instance
     * @param  {Array<string>}                                             [options.attributes.include] Select all the attributes of the model, plus some additional ones. Useful for aggregations, e.g. `{ attributes: { include: [[sequelize.fn('COUNT', sequelize.col('id')), 'total']] }`
     * @param  {Array<string>}                                             [options.attributes.exclude] Select all the attributes of the model, except some few. Useful for security purposes e.g. `{ attributes: { exclude: ['password'] } }`
     * @param  {boolean}                                                   [options.paranoid=true] If true, only non-deleted records will be returned. If false, both deleted and non-deleted records will be returned. Only applies if `options.paranoid` is true for the model.
     * @param  {Array<Object|Model|string>}                                [options.include] A list of associations to eagerly load using a left join. Supported is either `{ include: [ Model1, Model2, ...]}` or `{ include: [{ model: Model1, as: 'Alias' }]}` or `{ include: ['Alias']}`. If your association are set up with an `as` (eg. `X.hasMany(Y, { as: 'Z }`, you need to specify Z in the as attribute when eager loading Y).
     * @param  {Model}                                                     [options.include[].model] The model you want to eagerly load
     * @param  {string}                                                    [options.include[].as] The alias of the relation, in case the model you want to eagerly load is aliased. For `hasOne` / `belongsTo`, this should be the singular name, and for `hasMany`, it should be the plural
     * @param  {Association}                                               [options.include[].association] The association you want to eagerly load. (This can be used instead of providing a model/as pair)
     * @param  {Object}                                                    [options.include[].where] Where clauses to apply to the child models. Note that this converts the eager load to an inner join, unless you explicitly set `required: false`
     * @param  {boolean}                                                   [options.include[].or=false] Whether to bind the ON and WHERE clause together by OR instead of AND.
     * @param  {Object}                                                    [options.include[].on] Supply your own ON condition for the join.
     * @param  {Array<string>}                                             [options.include[].attributes] A list of attributes to select from the child model
     * @param  {boolean}                                                   [options.include[].required] If true, converts to an inner join, which means that the parent model will only be loaded if it has any matching children. True if `include.where` is set, false otherwise.
     * @param  {boolean}                                                   [options.include[].right] If true, converts to a right join if dialect support it. Ignored if `include.required` is true.
     * @param  {boolean}                                                   [options.include[].separate] If true, runs a separate query to fetch the associated instances, only supported for hasMany associations
     * @param  {number}                                                    [options.include[].limit] Limit the joined rows, only supported with include.separate=true
     * @param  {Object}                                                    [options.include[].through.where] Filter on the join model for belongsToMany relations
     * @param  {Array}                                                     [options.include[].through.attributes] A list of attributes to select from the join model for belongsToMany relations
     * @param  {Array<Object|Model|string>}                                [options.include[].include] Load further nested related models
     * @param  {boolean}                                                   [options.include[].duplicating] Mark the include as duplicating, will prevent a subquery from being used.
     * @param  {Array|Sequelize.fn|Sequelize.col|Sequelize.literal}        [options.order] Specifies an ordering. Using an array, you can provide several columns / functions to order by. Each element can be further wrapped in a two-element array. The first element is the column / function to order by, the second is the direction. For example: `order: [['name', 'DESC']]`. In this way the column will be escaped, but the direction will not.
     * @param  {number}                                                    [options.limit] Limit for result
     * @param  {number}                                                    [options.offset] Offset for result
     * @param  {Transaction}                                               [options.transaction] Transaction to run query under
     * @param  {string|Object}                                             [options.lock] Lock the selected rows. Possible options are transaction.LOCK.UPDATE and transaction.LOCK.SHARE. Postgres also supports transaction.LOCK.KEY_SHARE, transaction.LOCK.NO_KEY_UPDATE and specific model locks with joins. See [transaction.LOCK for an example](transaction#lock)
     * @param  {boolean}                                                   [options.skipLocked] Skip locked rows. Only supported in Postgres.
     * @param  {boolean}                                                   [options.raw] Return raw result. See sequelize.query for more information.
     * @param  {Function}                                                  [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param  {boolean}                                                   [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
     * @param  {Object}                                                    [options.having] Having options
     * @param  {string}                                                    [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     * @param  {boolean|Error}                                             [options.rejectOnEmpty=false] Throws an error when no records found
     *
     * @see
     * {@link Sequelize#query}
     *
     * @returns {Promise<Array<Model>>}
     */

  }, {
    key: "findAll",
    value: function findAll(options) {
      if (options !== undefined && !_.isPlainObject(options)) {
        throw new sequelizeErrors.QueryError('The argument passed to findAll must be an options object, use findByPk if you wish to pass a single primary key value');
      }

      if (options !== undefined && options.attributes) {
        if (!Array.isArray(options.attributes) && !_.isPlainObject(options.attributes)) {
          throw new sequelizeErrors.QueryError('The attributes option must be an array of column names or an object');
        }
      }

      this.warnOnInvalidOptions(options, Object.keys(this.rawAttributes));
      const tableNames = {};
      tableNames[this.getTableName(options)] = true;
      options = Utils.cloneDeep(options);

      _.defaults(options, {
        hooks: true
      }); // set rejectOnEmpty option, defaults to model options


      options.rejectOnEmpty = Object.prototype.hasOwnProperty.call(options, 'rejectOnEmpty') ? options.rejectOnEmpty : this.options.rejectOnEmpty;
      return Promise.try(() => {
        this._injectScope(options);

        if (options.hooks) {
          return this.runHooks('beforeFind', options);
        }
      }).then(() => {
        this._conformIncludes(options, this);

        this._expandAttributes(options);

        this._expandIncludeAll(options);

        if (options.hooks) {
          return this.runHooks('beforeFindAfterExpandIncludeAll', options);
        }
      }).then(() => {
        options.originalAttributes = this._injectDependentVirtualAttributes(options.attributes);

        if (options.include) {
          options.hasJoin = true;

          this._validateIncludedElements(options, tableNames); // If we're not raw, we have to make sure we include the primary key for de-duplication


          if (options.attributes && !options.raw && this.primaryKeyAttribute && !options.attributes.includes(this.primaryKeyAttribute) && (!options.group || !options.hasSingleAssociation || options.hasMultiAssociation)) {
            options.attributes = [this.primaryKeyAttribute].concat(options.attributes);
          }
        }

        if (!options.attributes) {
          options.attributes = Object.keys(this.rawAttributes);
          options.originalAttributes = this._injectDependentVirtualAttributes(options.attributes);
        } // whereCollection is used for non-primary key updates


        this.options.whereCollection = options.where || null;
        Utils.mapFinderOptions(options, this);
        options = this._paranoidClause(this, options);

        if (options.hooks) {
          return this.runHooks('beforeFindAfterOptions', options);
        }
      }).then(() => {
        const selectOptions = Object.assign({}, options, {
          tableNames: Object.keys(tableNames)
        });
        return this.QueryInterface.select(this, this.getTableName(selectOptions), selectOptions);
      }).tap(results => {
        if (options.hooks) {
          return this.runHooks('afterFind', results, options);
        }
      }).then(results => {
        //rejectOnEmpty mode
        if (_.isEmpty(results) && options.rejectOnEmpty) {
          if (typeof options.rejectOnEmpty === 'function') {
            throw new options.rejectOnEmpty();
          }

          if (typeof options.rejectOnEmpty === 'object') {
            throw options.rejectOnEmpty;
          }

          throw new sequelizeErrors.EmptyResultError();
        }

        return Model._findSeparate(results, options);
      });
    }
  }, {
    key: "warnOnInvalidOptions",
    value: function warnOnInvalidOptions(options, validColumnNames) {
      if (!_.isPlainObject(options)) {
        return;
      }

      const unrecognizedOptions = Object.keys(options).filter(k => !validQueryKeywords.has(k));

      const unexpectedModelAttributes = _.intersection(unrecognizedOptions, validColumnNames);

      if (!options.where && unexpectedModelAttributes.length > 0) {
        logger.warn(`Model attributes (${unexpectedModelAttributes.join(', ')}) passed into finder method options of model ${this.name}, but the options.where object is empty. Did you forget to use options.where?`);
      }
    }
  }, {
    key: "_injectDependentVirtualAttributes",
    value: function _injectDependentVirtualAttributes(attributes) {
      if (!this._hasVirtualAttributes) return attributes;
      if (!attributes || !Array.isArray(attributes)) return attributes;

      for (const attribute of attributes) {
        if (this._virtualAttributes.has(attribute) && this.rawAttributes[attribute].type.fields) {
          attributes = attributes.concat(this.rawAttributes[attribute].type.fields);
        }
      }

      attributes = _.uniq(attributes);
      return attributes;
    }
  }, {
    key: "_findSeparate",
    value: function _findSeparate(results, options) {
      if (!options.include || options.raw || !results) return Promise.resolve(results);
      const original = results;
      if (options.plain) results = [results];
      if (!results.length) return original;
      return Promise.map(options.include, include => {
        if (!include.separate) {
          return Model._findSeparate(results.reduce((memo, result) => {
            let associations = result.get(include.association.as); // Might be an empty belongsTo relation

            if (!associations) return memo; // Force array so we can concat no matter if it's 1:1 or :M

            if (!Array.isArray(associations)) associations = [associations];

            for (let i = 0, len = associations.length; i !== len; ++i) {
              memo.push(associations[i]);
            }

            return memo;
          }, []), Object.assign({}, _.omit(options, 'include', 'attributes', 'order', 'where', 'limit', 'offset', 'plain', 'scope'), {
            include: include.include || []
          }));
        }

        return include.association.get(results, Object.assign({}, _.omit(options, nonCascadingOptions), _.omit(include, ['parent', 'association', 'as', 'originalAttributes']))).then(map => {
          for (const result of results) {
            result.set(include.association.as, map[result.get(include.association.sourceKey)], {
              raw: true
            });
          }
        });
      }).return(original);
    }
    /**
     * Search for a single instance by its primary key._
     *
     * @param  {number|string|Buffer}      param The value of the desired instance's primary key.
     * @param  {Object}                    [options] find options
     * @param  {Transaction}               [options.transaction] Transaction to run query under
     * @param  {string}                    [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     *
     * @see
     * {@link Model.findAll}           for a full explanation of options, Note that options.where is not supported.
     *
     * @returns {Promise<Model>}
     */

  }, {
    key: "findByPk",
    value: function findByPk(param, options) {
      // return Promise resolved with null if no arguments are passed
      if ([null, undefined].includes(param)) {
        return Promise.resolve(null);
      }

      options = Utils.cloneDeep(options) || {};

      if (typeof param === 'number' || typeof param === 'string' || Buffer.isBuffer(param)) {
        options.where = {
          [this.primaryKeyAttribute]: param
        };
      } else {
        throw new Error(`Argument passed to findByPk is invalid: ${param}`);
      } // Bypass a possible overloaded findOne


      return this.findOne(options);
    }
    /**
     * Search for a single instance. This applies LIMIT 1, so the listener will always be called with a single instance.
     *
     * __Alias__: _find_
     *
     * @param  {Object}       [options] A hash of options to describe the scope of the search
     * @param  {Transaction}  [options.transaction] Transaction to run query under
     * @param  {string}       [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     *
     * @see
     * {@link Model.findAll} for an explanation of options
     *
     * @returns {Promise<Model>}
     */

  }, {
    key: "findOne",
    value: function findOne(options) {
      if (options !== undefined && !_.isPlainObject(options)) {
        throw new Error('The argument passed to findOne must be an options object, use findByPk if you wish to pass a single primary key value');
      }

      options = Utils.cloneDeep(options);

      if (options.limit === undefined) {
        const uniqueSingleColumns = _.chain(this.uniqueKeys).values().filter(c => c.fields.length === 1).map('column').value(); // Don't add limit if querying directly on the pk or a unique column


        if (!options.where || !_.some(options.where, (value, key) => (key === this.primaryKeyAttribute || uniqueSingleColumns.includes(key)) && (Utils.isPrimitive(value) || Buffer.isBuffer(value)))) {
          options.limit = 1;
        }
      } // Bypass a possible overloaded findAll.


      return this.findAll(_.defaults(options, {
        plain: true
      }));
    }
    /**
     * Run an aggregation method on the specified field
     *
     * @param {string}          attribute The attribute to aggregate over. Can be a field name or *
     * @param {string}          aggregateFunction The function to use for aggregation, e.g. sum, max etc.
     * @param {Object}          [options] Query options. See sequelize.query for full options
     * @param {Object}          [options.where] A hash of search attributes.
     * @param {Function}        [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {boolean}         [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
     * @param {DataTypes|string} [options.dataType] The type of the result. If `field` is a field in this Model, the default will be the type of that field, otherwise defaults to float.
     * @param {boolean}         [options.distinct] Applies DISTINCT to the field being aggregated over
     * @param {Transaction}     [options.transaction] Transaction to run query under
     * @param {boolean}         [options.plain] When `true`, the first returned value of `aggregateFunction` is cast to `dataType` and returned. If additional attributes are specified, along with `group` clauses, set `plain` to `false` to return all values of all returned rows.  Defaults to `true`
     *
     * @returns {Promise<DataTypes|Object>} Returns the aggregate result cast to `options.dataType`, unless `options.plain` is false, in which case the complete data result is returned.
     */

  }, {
    key: "aggregate",
    value: function aggregate(attribute, aggregateFunction, options) {
      options = Utils.cloneDeep(options); // We need to preserve attributes here as the `injectScope` call would inject non aggregate columns.

      const prevAttributes = options.attributes;

      this._injectScope(options);

      options.attributes = prevAttributes;

      this._conformIncludes(options, this);

      if (options.include) {
        this._expandIncludeAll(options);

        this._validateIncludedElements(options);
      }

      const attrOptions = this.rawAttributes[attribute];
      const field = attrOptions && attrOptions.field || attribute;
      let aggregateColumn = this.sequelize.col(field);

      if (options.distinct) {
        aggregateColumn = this.sequelize.fn('DISTINCT', aggregateColumn);
      }

      let {
        group
      } = options;

      if (Array.isArray(group) && Array.isArray(group[0])) {
        noDoubleNestedGroup();
        group = _.flatten(group);
      }

      options.attributes = _.unionBy(options.attributes, group, [[this.sequelize.fn(aggregateFunction, aggregateColumn), aggregateFunction]], a => Array.isArray(a) ? a[1] : a);

      if (!options.dataType) {
        if (attrOptions) {
          options.dataType = attrOptions.type;
        } else {
          // Use FLOAT as fallback
          options.dataType = new DataTypes.FLOAT();
        }
      } else {
        options.dataType = this.sequelize.normalizeDataType(options.dataType);
      }

      Utils.mapOptionFieldNames(options, this);
      options = this._paranoidClause(this, options);
      return this.QueryInterface.rawSelect(this.getTableName(options), options, aggregateFunction, this).then(value => {
        if (value === null) {
          return 0;
        }

        return value;
      });
    }
    /**
     * Count the number of records matching the provided where clause.
     *
     * If you provide an `include` option, the number of matching associations will be counted instead.
     *
     * @param {Object}        [options] options
     * @param {Object}        [options.where] A hash of search attributes.
     * @param {Object}        [options.include] Include options. See `find` for details
     * @param {boolean}       [options.paranoid=true] Set `true` to count only non-deleted records. Can be used on models with `paranoid` enabled
     * @param {boolean}       [options.distinct] Apply COUNT(DISTINCT(col)) on primary key or on options.col.
     * @param {string}        [options.col] Column on which COUNT() should be applied
     * @param {Array}         [options.attributes] Used in conjunction with `group`
     * @param {Array}         [options.group] For creating complex counts. Will return multiple rows as needed.
     * @param {Transaction}   [options.transaction] Transaction to run query under
     * @param {Function}      [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {boolean}       [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
     * @param {string}        [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     *
     * @returns {Promise<number>}
     */

  }, {
    key: "count",
    value: function count(options) {
      return Promise.try(() => {
        options = Utils.cloneDeep(options);
        options = _.defaults(options, {
          hooks: true
        });
        options.raw = true;

        if (options.hooks) {
          return this.runHooks('beforeCount', options);
        }
      }).then(() => {
        let col = options.col || '*';

        if (options.include) {
          col = `${this.name}.${options.col || this.primaryKeyField}`;
        }

        options.plain = !options.group;
        options.dataType = new DataTypes.INTEGER();
        options.includeIgnoreAttributes = false; // No limit, offset or order for the options max be given to count()
        // Set them to null to prevent scopes setting those values

        options.limit = null;
        options.offset = null;
        options.order = null;
        return this.aggregate(col, 'count', options);
      });
    }
    /**
     * Find all the rows matching your query, within a specified offset / limit, and get the total number of rows matching your query. This is very useful for paging
     *
     * @example
     * Model.findAndCountAll({
     *   where: ...,
     *   limit: 12,
     *   offset: 12
     * }).then(result => {
     *   ...
     * })
     *
     * # In the above example, `result.rows` will contain rows 13 through 24, while `result.count` will return the total number of rows that matched your query.
     *
     * # When you add includes, only those which are required (either because they have a where clause, or because `required` is explicitly set to true on the include) will be added to the count part.
     *
     * # Suppose you want to find all users who have a profile attached:
     *
     * User.findAndCountAll({
     *   include: [
     *      { model: Profile, required: true}
     *   ],
     *   limit 3
     * });
     *
     * # Because the include for `Profile` has `required` set it will result in an inner join, and only the users who have a profile will be counted. If we remove `required` from the include, both users with and without profiles will be counted
     *
     * @param {Object} [options] See findAll options
     *
     * @see
     * {@link Model.findAll} for a specification of find and query options
     * @see
     * {@link Model.count} for a specification of count options
     *
     * @returns {Promise<{count: number, rows: Model[]}>}
     */

  }, {
    key: "findAndCountAll",
    value: function findAndCountAll(options) {
      if (options !== undefined && !_.isPlainObject(options)) {
        throw new Error('The argument passed to findAndCountAll must be an options object, use findByPk if you wish to pass a single primary key value');
      }

      const countOptions = Utils.cloneDeep(options);

      if (countOptions.attributes) {
        countOptions.attributes = undefined;
      }

      return Promise.all([this.count(countOptions), this.findAll(options)]).then(([count, rows]) => ({
        count,
        rows: count === 0 ? [] : rows
      }));
    }
    /**
     * Find the maximum value of field
     *
     * @param {string} field attribute / field name
     * @param {Object} [options] See aggregate
     *
     * @see
     * {@link Model.aggregate} for options
     *
     * @returns {Promise<*>}
     */

  }, {
    key: "max",
    value: function max(field, options) {
      return this.aggregate(field, 'max', options);
    }
    /**
     * Find the minimum value of field
     *
     * @param {string} field attribute / field name
     * @param {Object} [options] See aggregate
     *
     * @see
     * {@link Model.aggregate} for options
     *
     * @returns {Promise<*>}
     */

  }, {
    key: "min",
    value: function min(field, options) {
      return this.aggregate(field, 'min', options);
    }
    /**
     * Find the sum of field
     *
     * @param {string} field attribute / field name
     * @param {Object} [options] See aggregate
     *
     * @see
     * {@link Model.aggregate} for options
     *
     * @returns {Promise<number>}
     */

  }, {
    key: "sum",
    value: function sum(field, options) {
      return this.aggregate(field, 'sum', options);
    }
    /**
     * Builds a new model instance.
     *
     * @param {Object|Array} values An object of key value pairs or an array of such. If an array, the function will return an array of instances.
     * @param {Object}  [options] Instance build options
     * @param {boolean} [options.raw=false] If set to true, values will ignore field and virtual setters.
     * @param {boolean} [options.isNewRecord=true] Is this new record
     * @param {Array}   [options.include] an array of include options - Used to build prefetched/included model instances. See `set`
     *
     * @returns {Model|Array<Model>}
     */

  }, {
    key: "build",
    value: function build(values, options) {
      if (Array.isArray(values)) {
        return this.bulkBuild(values, options);
      }

      return new this(values, options);
    }
  }, {
    key: "bulkBuild",
    value: function bulkBuild(valueSets, options) {
      options = Object.assign({
        isNewRecord: true
      }, options || {});

      if (!options.includeValidated) {
        this._conformIncludes(options, this);

        if (options.include) {
          this._expandIncludeAll(options);

          this._validateIncludedElements(options);
        }
      }

      if (options.attributes) {
        options.attributes = options.attributes.map(attribute => Array.isArray(attribute) ? attribute[1] : attribute);
      }

      return valueSets.map(values => this.build(values, options));
    }
    /**
     * Builds a new model instance and calls save on it.
      * @see
     * {@link Model.build}
     * @see
     * {@link Model.save}
     *
     * @param {Object}        values hash of data values to create new record with
     * @param {Object}        [options] build and query options
     * @param {boolean}       [options.raw=false] If set to true, values will ignore field and virtual setters.
     * @param {boolean}       [options.isNewRecord=true] Is this new record
     * @param {Array}         [options.include] an array of include options - Used to build prefetched/included model instances. See `set`
     * @param {Array}         [options.fields] If set, only columns matching those in fields will be saved
     * @param {string[]}      [options.fields] An optional array of strings, representing database columns. If fields is provided, only those columns will be validated and saved.
     * @param {boolean}       [options.silent=false] If true, the updatedAt timestamp will not be updated.
     * @param {boolean}       [options.validate=true] If false, validations won't be run.
     * @param {boolean}       [options.hooks=true] Run before and after create / update + validate hooks
     * @param {Function}      [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {boolean}       [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
     * @param {Transaction}   [options.transaction] Transaction to run query under
     * @param {string}        [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     * @param {boolean}       [options.returning=true] Return the affected rows (only for postgres)
     *
     * @returns {Promise<Model>}
     *
     */

  }, {
    key: "create",
    value: function create(values, options) {
      options = Utils.cloneDeep(options || {});
      return this.build(values, {
        isNewRecord: true,
        attributes: options.fields,
        include: options.include,
        raw: options.raw,
        silent: options.silent
      }).save(options);
    }
    /**
     * Find a row that matches the query, or build (but don't save) the row if none is found.
     * The successful result of the promise will be (instance, built)
     *
     * @param {Object}   options find options
     * @param {Object}   options.where A hash of search attributes. If `where` is a plain object it will be appended with defaults to build a new instance.
     * @param {Object}   [options.defaults] Default values to use if building a new instance
     * @param {Object}   [options.transaction] Transaction to run query under
     *
     * @returns {Promise<Model,boolean>}
     */

  }, {
    key: "findOrBuild",
    value: function findOrBuild(options) {
      if (!options || !options.where || arguments.length > 1) {
        throw new Error('Missing where attribute in the options parameter passed to findOrBuild. ' + 'Please note that the API has changed, and is now options only (an object with where, defaults keys, transaction etc.)');
      }

      let values;
      return this.findOne(options).then(instance => {
        if (instance === null) {
          values = _.clone(options.defaults) || {};

          if (_.isPlainObject(options.where)) {
            values = Utils.defaults(values, options.where);
          }

          instance = this.build(values, options);
          return Promise.resolve([instance, true]);
        }

        return Promise.resolve([instance, false]);
      });
    }
    /**
     * Find a row that matches the query, or build and save the row if none is found
     * The successful result of the promise will be (instance, created)
     *
     * If no transaction is passed in the `options` object, a new transaction will be created internally, to prevent the race condition where a matching row is created by another connection after the find but before the insert call.
     * However, it is not always possible to handle this case in SQLite, specifically if one transaction inserts and another tries to select before the first one has committed. In this case, an instance of sequelize. TimeoutError will be thrown instead.
     * If a transaction is created, a savepoint will be created instead, and any unique constraint violation will be handled internally.
     *
     * @see
     * {@link Model.findAll} for a full specification of find and options
     *
     * @param {Object}      options find and create options
     * @param {Object}      options.where where A hash of search attributes. If `where` is a plain object it will be appended with defaults to build a new instance.
     * @param {Object}      [options.defaults] Default values to use if creating a new instance
     * @param {Transaction} [options.transaction] Transaction to run query under
     *
     * @returns {Promise<Model,boolean>}
     */

  }, {
    key: "findOrCreate",
    value: function findOrCreate(options) {
      if (!options || !options.where || arguments.length > 1) {
        throw new Error('Missing where attribute in the options parameter passed to findOrCreate. ' + 'Please note that the API has changed, and is now options only (an object with where, defaults keys, transaction etc.)');
      }

      options = Object.assign({}, options);

      if (options.defaults) {
        const defaults = Object.keys(options.defaults);
        const unknownDefaults = defaults.filter(name => !this.rawAttributes[name]);

        if (unknownDefaults.length) {
          logger.warn(`Unknown attributes (${unknownDefaults}) passed to defaults option of findOrCreate`);
        }
      }

      if (options.transaction === undefined && this.sequelize.constructor._cls) {
        const t = this.sequelize.constructor._cls.get('transaction');

        if (t) {
          options.transaction = t;
        }
      }

      const internalTransaction = !options.transaction;
      let values;
      let transaction; // Create a transaction or a savepoint, depending on whether a transaction was passed in

      return this.sequelize.transaction(options).then(t => {
        transaction = t;
        options.transaction = t;
        return this.findOne(Utils.defaults({
          transaction
        }, options));
      }).then(instance => {
        if (instance !== null) {
          return [instance, false];
        }

        values = _.clone(options.defaults) || {};

        if (_.isPlainObject(options.where)) {
          values = Utils.defaults(values, options.where);
        }

        options.exception = true;
        return this.create(values, options).then(instance => {
          if (instance.get(this.primaryKeyAttribute, {
            raw: true
          }) === null) {
            // If the query returned an empty result for the primary key, we know that this was actually a unique constraint violation
            throw new sequelizeErrors.UniqueConstraintError();
          }

          return [instance, true];
        }).catch(sequelizeErrors.UniqueConstraintError, err => {
          const flattenedWhere = Utils.flattenObjectDeep(options.where);
          const flattenedWhereKeys = Object.keys(flattenedWhere).map(name => _.last(name.split('.')));
          const whereFields = flattenedWhereKeys.map(name => _.get(this.rawAttributes, `${name}.field`, name));
          const defaultFields = options.defaults && Object.keys(options.defaults).filter(name => this.rawAttributes[name]).map(name => this.rawAttributes[name].field || name);
          const errFieldKeys = Object.keys(err.fields);
          const errFieldsWhereIntersects = Utils.intersects(errFieldKeys, whereFields);

          if (defaultFields && !errFieldsWhereIntersects && Utils.intersects(errFieldKeys, defaultFields)) {
            throw err;
          }

          if (errFieldsWhereIntersects) {
            _.each(err.fields, (value, key) => {
              const name = this.fieldRawAttributesMap[key].fieldName;

              if (value.toString() !== options.where[name].toString()) {
                throw new Error(`${this.name}#findOrCreate: value used for ${name} was not equal for both the find and the create calls, '${options.where[name]}' vs '${value}'`);
              }
            });
          } // Someone must have created a matching instance inside the same transaction since we last did a find. Let's find it!


          return this.findOne(Utils.defaults({
            transaction: internalTransaction ? null : transaction
          }, options)).then(instance => {
            // Sanity check, ideally we caught this at the defaultFeilds/err.fields check
            // But if we didn't and instance is null, we will throw
            if (instance === null) throw err;
            return [instance, false];
          });
        });
      }).finally(() => {
        if (internalTransaction && transaction) {
          // If we created a transaction internally (and not just a savepoint), we should clean it up
          return transaction.commit();
        }
      });
    }
    /**
     * A more performant findOrCreate that will not work under a transaction (at least not in postgres)
     * Will execute a find call, if empty then attempt to create, if unique constraint then attempt to find again
     *
     * @see
     * {@link Model.findAll} for a full specification of find and options
     *
     * @param {Object} options find options
     * @param {Object} options.where A hash of search attributes. If `where` is a plain object it will be appended with defaults to build a new instance.
     * @param {Object} [options.defaults] Default values to use if creating a new instance
     *
     * @returns {Promise<Model,boolean>}
     */

  }, {
    key: "findCreateFind",
    value: function findCreateFind(options) {
      if (!options || !options.where) {
        throw new Error('Missing where attribute in the options parameter passed to findCreateFind.');
      }

      let values = _.clone(options.defaults) || {};

      if (_.isPlainObject(options.where)) {
        values = Utils.defaults(values, options.where);
      }

      return this.findOne(options).then(result => {
        if (result) return [result, false];
        return this.create(values, options).then(result => [result, true]).catch(sequelizeErrors.UniqueConstraintError, () => this.findOne(options).then(result => [result, false]));
      });
    }
    /**
     * Insert or update a single row. An update will be executed if a row which matches the supplied values on either the primary key or a unique key is found. Note that the unique index must be defined in your sequelize model and not just in the table. Otherwise you may experience a unique constraint violation, because sequelize fails to identify the row that should be updated.
     *
     * **Implementation details:**
     *
     * * MySQL - Implemented as a single query `INSERT values ON DUPLICATE KEY UPDATE values`
     * * PostgreSQL - Implemented as a temporary function with exception handling: INSERT EXCEPTION WHEN unique_constraint UPDATE
     * * SQLite - Implemented as two queries `INSERT; UPDATE`. This means that the update is executed regardless of whether the row already existed or not
     * * MSSQL - Implemented as a single query using `MERGE` and `WHEN (NOT) MATCHED THEN`
     * **Note** that SQLite returns undefined for created, no matter if the row was created or updated. This is because SQLite always runs INSERT OR IGNORE + UPDATE, in a single query, so there is no way to know whether the row was inserted or not.
     *
     * @param  {Object}       values hash of values to upsert
     * @param  {Object}       [options] upsert options
     * @param  {boolean}      [options.validate=true] Run validations before the row is inserted
     * @param  {Array}        [options.fields=Object.keys(this.attributes)] The fields to insert / update. Defaults to all changed fields
     * @param  {boolean}      [options.hooks=true]  Run before / after upsert hooks?
     * @param  {boolean}      [options.returning=false] Append RETURNING * to get back auto generated values (Postgres only)
     * @param  {Transaction}  [options.transaction] Transaction to run query under
     * @param  {Function}     [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param  {boolean}      [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
     * @param  {string}       [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     *
     * @returns {Promise<boolean>} Returns a boolean indicating whether the row was created or updated. For MySQL/MariaDB, it returns `true` when inserted and `false` when updated. For Postgres/MSSQL with (options.returning=true), it returns record and created boolean with signature `<Model, created>`.
     */

  }, {
    key: "upsert",
    value: function upsert(values, options) {
      options = Object.assign({
        hooks: true,
        returning: false,
        validate: true
      }, Utils.cloneDeep(options || {}));
      options.model = this;
      const createdAtAttr = this._timestampAttributes.createdAt;
      const updatedAtAttr = this._timestampAttributes.updatedAt;
      const hasPrimary = this.primaryKeyField in values || this.primaryKeyAttribute in values;
      const instance = this.build(values);

      if (!options.fields) {
        options.fields = Object.keys(instance._changed);
      }

      return Promise.try(() => {
        if (options.validate) {
          return instance.validate(options);
        }
      }).then(() => {
        // Map field names
        const updatedDataValues = _.pick(instance.dataValues, Object.keys(instance._changed));

        const insertValues = Utils.mapValueFieldNames(instance.dataValues, Object.keys(instance.rawAttributes), this);
        const updateValues = Utils.mapValueFieldNames(updatedDataValues, options.fields, this);
        const now = Utils.now(this.sequelize.options.dialect); // Attach createdAt

        if (createdAtAttr && !updateValues[createdAtAttr]) {
          const field = this.rawAttributes[createdAtAttr].field || createdAtAttr;
          insertValues[field] = this._getDefaultTimestamp(createdAtAttr) || now;
        }

        if (updatedAtAttr && !insertValues[updatedAtAttr]) {
          const field = this.rawAttributes[updatedAtAttr].field || updatedAtAttr;
          insertValues[field] = updateValues[field] = this._getDefaultTimestamp(updatedAtAttr) || now;
        } // Build adds a null value for the primary key, if none was given by the user.
        // We need to remove that because of some Postgres technicalities.


        if (!hasPrimary && this.primaryKeyAttribute && !this.rawAttributes[this.primaryKeyAttribute].defaultValue) {
          delete insertValues[this.primaryKeyField];
          delete updateValues[this.primaryKeyField];
        }

        return Promise.try(() => {
          if (options.hooks) {
            return this.runHooks('beforeUpsert', values, options);
          }
        }).then(() => {
          return this.QueryInterface.upsert(this.getTableName(options), insertValues, updateValues, instance.where(), this, options);
        }).then(([created, primaryKey]) => {
          if (options.returning === true && primaryKey) {
            return this.findByPk(primaryKey, options).then(record => [record, created]);
          }

          return created;
        }).tap(result => {
          if (options.hooks) {
            return this.runHooks('afterUpsert', result, options);
          }
        });
      });
    }
    /**
     * Create and insert multiple instances in bulk.
     *
     * The success handler is passed an array of instances, but please notice that these may not completely represent the state of the rows in the DB. This is because MySQL
     * and SQLite do not make it easy to obtain back automatically generated IDs and other default values in a way that can be mapped to multiple records.
     * To obtain Instances for the newly created values, you will need to query for them again.
     *
     * If validation fails, the promise is rejected with an array-like [AggregateError](http://bluebirdjs.com/docs/api/aggregateerror.html)
     *
     * @param  {Array}        records                          List of objects (key/value pairs) to create instances from
     * @param  {Object}       [options]                        Bulk create options
     * @param  {Array}        [options.fields]                 Fields to insert (defaults to all fields)
     * @param  {boolean}      [options.validate=false]         Should each row be subject to validation before it is inserted. The whole insert will fail if one row fails validation
     * @param  {boolean}      [options.hooks=true]             Run before / after bulk create hooks?
     * @param  {boolean}      [options.individualHooks=false]  Run before / after create hooks for each individual Instance? BulkCreate hooks will still be run if options.hooks is true.
     * @param  {boolean}      [options.ignoreDuplicates=false] Ignore duplicate values for primary keys? (not supported by MSSQL or Postgres < 9.5)
     * @param  {Array}        [options.updateOnDuplicate]      Fields to update if row key already exists (on duplicate key update)? (only supported by MySQL, MariaDB, SQLite >= 3.24.0 & Postgres >= 9.5). By default, all fields are updated.
     * @param  {Transaction}  [options.transaction]            Transaction to run query under
     * @param  {Function}     [options.logging=false]          A function that gets executed while running the query to log the sql.
     * @param  {boolean}      [options.benchmark=false]        Pass query execution time in milliseconds as second argument to logging function (options.logging).
     * @param  {boolean|Array} [options.returning=false]       If true, append RETURNING * to get back all values; if an array of column names, append RETURNING <columns> to get back specific columns (Postgres only)
     * @param  {string}       [options.searchPath=DEFAULT]     An optional parameter to specify the schema search_path (Postgres only)
     *
     * @returns {Promise<Array<Model>>}
     */

  }, {
    key: "bulkCreate",
    value: function bulkCreate(records, options = {}) {
      if (!records.length) {
        return Promise.resolve([]);
      }

      const dialect = this.sequelize.options.dialect;
      const now = Utils.now(this.sequelize.options.dialect);
      options.model = this;

      if (!options.includeValidated) {
        this._conformIncludes(options, this);

        if (options.include) {
          this._expandIncludeAll(options);

          this._validateIncludedElements(options);
        }
      }

      const instances = records.map(values => this.build(values, {
        isNewRecord: true,
        include: options.include
      }));

      const recursiveBulkCreate = (instances, options) => {
        options = Object.assign({
          validate: false,
          hooks: true,
          individualHooks: false,
          ignoreDuplicates: false
        }, options);

        if (options.returning === undefined) {
          if (options.association) {
            options.returning = false;
          } else {
            options.returning = true;
          }
        }

        if (options.ignoreDuplicates && ['mssql'].includes(dialect)) {
          return Promise.reject(new Error(`${dialect} does not support the ignoreDuplicates option.`));
        }

        if (options.updateOnDuplicate && dialect !== 'mysql' && dialect !== 'mariadb' && dialect !== 'sqlite' && dialect !== 'postgres') {
          return Promise.reject(new Error(`${dialect} does not support the updateOnDuplicate option.`));
        }

        const model = options.model;
        options.fields = options.fields || Object.keys(model.rawAttributes);
        const createdAtAttr = model._timestampAttributes.createdAt;
        const updatedAtAttr = model._timestampAttributes.updatedAt;

        if (options.updateOnDuplicate !== undefined) {
          if (Array.isArray(options.updateOnDuplicate) && options.updateOnDuplicate.length) {
            options.updateOnDuplicate = _.intersection(_.without(Object.keys(model.tableAttributes), createdAtAttr), options.updateOnDuplicate);
          } else {
            return Promise.reject(new Error('updateOnDuplicate option only supports non-empty array.'));
          }
        }

        return Promise.try(() => {
          // Run before hook
          if (options.hooks) {
            return model.runHooks('beforeBulkCreate', instances, options);
          }
        }).then(() => {
          // Validate
          if (options.validate) {
            const errors = new Promise.AggregateError();

            const validateOptions = _.clone(options);

            validateOptions.hooks = options.individualHooks;
            return Promise.map(instances, instance => instance.validate(validateOptions).catch(err => {
              errors.push(new sequelizeErrors.BulkRecordError(err, instance));
            })).then(() => {
              delete options.skip;

              if (errors.length) {
                throw errors;
              }
            });
          }
        }).then(() => {
          if (options.individualHooks) {
            // Create each instance individually
            return Promise.map(instances, instance => {
              const individualOptions = _.clone(options);

              delete individualOptions.fields;
              delete individualOptions.individualHooks;
              delete individualOptions.ignoreDuplicates;
              individualOptions.validate = false;
              individualOptions.hooks = true;
              return instance.save(individualOptions);
            });
          }

          return Promise.resolve().then(() => {
            if (!options.include || !options.include.length) return; // Nested creation for BelongsTo relations

            return Promise.map(options.include.filter(include => include.association instanceof BelongsTo), include => {
              const associationInstances = [];
              const associationInstanceIndexToInstanceMap = [];

              for (const instance of instances) {
                const associationInstance = instance.get(include.as);

                if (associationInstance) {
                  associationInstances.push(associationInstance);
                  associationInstanceIndexToInstanceMap.push(instance);
                }
              }

              if (!associationInstances.length) {
                return;
              }

              const includeOptions = _(Utils.cloneDeep(include)).omit(['association']).defaults({
                transaction: options.transaction,
                logging: options.logging
              }).value();

              return recursiveBulkCreate(associationInstances, includeOptions).then(associationInstances => {
                for (const idx in associationInstances) {
                  const associationInstance = associationInstances[idx];
                  const instance = associationInstanceIndexToInstanceMap[idx];
                  instance[include.association.accessors.set](associationInstance, {
                    save: false,
                    logging: options.logging
                  });
                }
              });
            });
          }).then(() => {
            // Create all in one query
            // Recreate records from instances to represent any changes made in hooks or validation
            records = instances.map(instance => {
              const values = instance.dataValues; // set createdAt/updatedAt attributes

              if (createdAtAttr && !values[createdAtAttr]) {
                values[createdAtAttr] = now;

                if (!options.fields.includes(createdAtAttr)) {
                  options.fields.push(createdAtAttr);
                }
              }

              if (updatedAtAttr && !values[updatedAtAttr]) {
                values[updatedAtAttr] = now;

                if (!options.fields.includes(updatedAtAttr)) {
                  options.fields.push(updatedAtAttr);
                }
              }

              const out = Object.assign({}, Utils.mapValueFieldNames(values, options.fields, model));

              for (const key of model._virtualAttributes) {
                delete out[key];
              }

              return out;
            }); // Map attributes to fields for serial identification

            const fieldMappedAttributes = {};

            for (const attr in model.tableAttributes) {
              fieldMappedAttributes[model.rawAttributes[attr].field || attr] = model.rawAttributes[attr];
            } // Map updateOnDuplicate attributes to fields


            if (options.updateOnDuplicate) {
              options.updateOnDuplicate = options.updateOnDuplicate.map(attr => model.rawAttributes[attr].field || attr); // Get primary keys for postgres to enable updateOnDuplicate

              options.upsertKeys = _.chain(model.primaryKeys).values().map('field').value();

              if (Object.keys(model.uniqueKeys).length > 0) {
                options.upsertKeys = _.chain(model.uniqueKeys).values().filter(c => c.fields.length === 1).map('column').value();
              }
            } // Map returning attributes to fields


            if (options.returning && Array.isArray(options.returning)) {
              options.returning = options.returning.map(attr => model.rawAttributes[attr].field || attr);
            }

            return model.QueryInterface.bulkInsert(model.getTableName(options), records, options, fieldMappedAttributes).then(results => {
              if (Array.isArray(results)) {
                results.forEach((result, i) => {
                  const instance = instances[i];

                  for (const key in result) {
                    if (!instance || key === model.primaryKeyAttribute && instance.get(model.primaryKeyAttribute) && ['mysql', 'mariadb', 'sqlite'].includes(dialect)) {
                      // The query.js for these DBs is blind, it autoincrements the
                      // primarykey value, even if it was set manually. Also, it can
                      // return more results than instances, bug?.
                      continue;
                    }

                    if (Object.prototype.hasOwnProperty.call(result, key)) {
                      const record = result[key];

                      const attr = _.find(model.rawAttributes, attribute => attribute.fieldName === key || attribute.field === key);

                      instance.dataValues[attr && attr.fieldName || key] = record;
                    }
                  }
                });
              }

              return results;
            });
          });
        }).then(() => {
          if (!options.include || !options.include.length) return; // Nested creation for HasOne/HasMany/BelongsToMany relations

          return Promise.map(options.include.filter(include => !(include.association instanceof BelongsTo || include.parent && include.parent.association instanceof BelongsToMany)), include => {
            const associationInstances = [];
            const associationInstanceIndexToInstanceMap = [];

            for (const instance of instances) {
              let associated = instance.get(include.as);
              if (!Array.isArray(associated)) associated = [associated];

              for (const associationInstance of associated) {
                if (associationInstance) {
                  if (!(include.association instanceof BelongsToMany)) {
                    associationInstance.set(include.association.foreignKey, instance.get(include.association.sourceKey || instance.constructor.primaryKeyAttribute, {
                      raw: true
                    }), {
                      raw: true
                    });
                    Object.assign(associationInstance, include.association.scope);
                  }

                  associationInstances.push(associationInstance);
                  associationInstanceIndexToInstanceMap.push(instance);
                }
              }
            }

            if (!associationInstances.length) {
              return;
            }

            const includeOptions = _(Utils.cloneDeep(include)).omit(['association']).defaults({
              transaction: options.transaction,
              logging: options.logging
            }).value();

            return recursiveBulkCreate(associationInstances, includeOptions).then(associationInstances => {
              if (include.association instanceof BelongsToMany) {
                const valueSets = [];

                for (const idx in associationInstances) {
                  const associationInstance = associationInstances[idx];
                  const instance = associationInstanceIndexToInstanceMap[idx];
                  const values = {};
                  values[include.association.foreignKey] = instance.get(instance.constructor.primaryKeyAttribute, {
                    raw: true
                  });
                  values[include.association.otherKey] = associationInstance.get(associationInstance.constructor.primaryKeyAttribute, {
                    raw: true
                  }); // Include values defined in the association

                  Object.assign(values, include.association.through.scope);

                  if (associationInstance[include.association.through.model.name]) {
                    for (const attr of Object.keys(include.association.through.model.rawAttributes)) {
                      if (include.association.through.model.rawAttributes[attr]._autoGenerated || attr === include.association.foreignKey || attr === include.association.otherKey || typeof associationInstance[include.association.through.model.name][attr] === undefined) {
                        continue;
                      }

                      values[attr] = associationInstance[include.association.through.model.name][attr];
                    }
                  }

                  valueSets.push(values);
                }

                const throughOptions = _(Utils.cloneDeep(include)).omit(['association', 'attributes']).defaults({
                  transaction: options.transaction,
                  logging: options.logging
                }).value();

                throughOptions.model = include.association.throughModel;
                const throughInstances = include.association.throughModel.bulkBuild(valueSets, throughOptions);
                return recursiveBulkCreate(throughInstances, throughOptions);
              }
            });
          });
        }).then(() => {
          // map fields back to attributes
          instances.forEach(instance => {
            for (const attr in model.rawAttributes) {
              if (model.rawAttributes[attr].field && instance.dataValues[model.rawAttributes[attr].field] !== undefined && model.rawAttributes[attr].field !== attr) {
                instance.dataValues[attr] = instance.dataValues[model.rawAttributes[attr].field];
                delete instance.dataValues[model.rawAttributes[attr].field];
              }

              instance._previousDataValues[attr] = instance.dataValues[attr];
              instance.changed(attr, false);
            }

            instance.isNewRecord = false;
          }); // Run after hook

          if (options.hooks) {
            return model.runHooks('afterBulkCreate', instances, options);
          }
        }).then(() => instances);
      };

      return recursiveBulkCreate(instances, options);
    }
    /**
     * Truncate all instances of the model. This is a convenient method for Model.destroy({ truncate: true }).
     *
     * @param {Object}           [options] The options passed to Model.destroy in addition to truncate
     * @param {boolean|Function} [options.cascade = false] Truncates all tables that have foreign-key references to the named table, or to any tables added to the group due to CASCADE.
     * @param {boolean}          [options.restartIdentity=false] Automatically restart sequences owned by columns of the truncated table.
     * @param {Transaction}      [options.transaction] Transaction to run query under
     * @param {boolean|Function} [options.logging] A function that logs sql queries, or false for no logging
     * @param {boolean}          [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
     * @param {string}           [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     *
     * @returns {Promise}
     *
     * @see
     * {@link Model.destroy} for more information
     */

  }, {
    key: "truncate",
    value: function truncate(options) {
      options = Utils.cloneDeep(options) || {};
      options.truncate = true;
      return this.destroy(options);
    }
    /**
     * Delete multiple instances, or set their deletedAt timestamp to the current time if `paranoid` is enabled.
     *
     * @param  {Object}       options                         destroy options
     * @param  {Object}       [options.where]                 Filter the destroy
     * @param  {boolean}      [options.hooks=true]            Run before / after bulk destroy hooks?
     * @param  {boolean}      [options.individualHooks=false] If set to true, destroy will SELECT all records matching the where parameter and will execute before / after destroy hooks on each row
     * @param  {number}       [options.limit]                 How many rows to delete
     * @param  {boolean}      [options.force=false]           Delete instead of setting deletedAt to current timestamp (only applicable if `paranoid` is enabled)
     * @param  {boolean}      [options.truncate=false]        If set to true, dialects that support it will use TRUNCATE instead of DELETE FROM. If a table is truncated the where and limit options are ignored
     * @param  {boolean}      [options.cascade=false]         Only used in conjunction with TRUNCATE. Truncates  all tables that have foreign-key references to the named table, or to any tables added to the group due to CASCADE.
     * @param  {boolean}      [options.restartIdentity=false] Only used in conjunction with TRUNCATE. Automatically restart sequences owned by columns of the truncated table.
     * @param  {Transaction}  [options.transaction] Transaction to run query under
     * @param  {Function}     [options.logging=false]         A function that gets executed while running the query to log the sql.
     * @param  {boolean}      [options.benchmark=false]       Pass query execution time in milliseconds as second argument to logging function (options.logging).
     *
     * @returns {Promise<number>} The number of destroyed rows
     */

  }, {
    key: "destroy",
    value: function destroy(options) {
      options = Utils.cloneDeep(options);

      this._injectScope(options);

      if (!options || !(options.where || options.truncate)) {
        throw new Error('Missing where or truncate attribute in the options parameter of model.destroy.');
      }

      if (!options.truncate && !_.isPlainObject(options.where) && !Array.isArray(options.where) && !(options.where instanceof Utils.SequelizeMethod)) {
        throw new Error('Expected plain object, array or sequelize method in the options.where parameter of model.destroy.');
      }

      options = _.defaults(options, {
        hooks: true,
        individualHooks: false,
        force: false,
        cascade: false,
        restartIdentity: false
      });
      options.type = QueryTypes.BULKDELETE;
      Utils.mapOptionFieldNames(options, this);
      options.model = this;
      let instances;
      return Promise.try(() => {
        // Run before hook
        if (options.hooks) {
          return this.runHooks('beforeBulkDestroy', options);
        }
      }).then(() => {
        // Get daos and run beforeDestroy hook on each record individually
        if (options.individualHooks) {
          return this.findAll({
            where: options.where,
            transaction: options.transaction,
            logging: options.logging,
            benchmark: options.benchmark
          }).map(instance => this.runHooks('beforeDestroy', instance, options).then(() => instance)).then(_instances => {
            instances = _instances;
          });
        }
      }).then(() => {
        // Run delete query (or update if paranoid)
        if (this._timestampAttributes.deletedAt && !options.force) {
          // Set query type appropriately when running soft delete
          options.type = QueryTypes.BULKUPDATE;
          const attrValueHash = {};
          const deletedAtAttribute = this.rawAttributes[this._timestampAttributes.deletedAt];
          const field = this.rawAttributes[this._timestampAttributes.deletedAt].field;
          const where = {
            [field]: Object.prototype.hasOwnProperty.call(deletedAtAttribute, 'defaultValue') ? deletedAtAttribute.defaultValue : null
          };
          attrValueHash[field] = Utils.now(this.sequelize.options.dialect);
          return this.QueryInterface.bulkUpdate(this.getTableName(options), attrValueHash, Object.assign(where, options.where), options, this.rawAttributes);
        }

        return this.QueryInterface.bulkDelete(this.getTableName(options), options.where, options, this);
      }).tap(() => {
        // Run afterDestroy hook on each record individually
        if (options.individualHooks) {
          return Promise.map(instances, instance => this.runHooks('afterDestroy', instance, options));
        }
      }).tap(() => {
        // Run after hook
        if (options.hooks) {
          return this.runHooks('afterBulkDestroy', options);
        }
      });
    }
    /**
     * Restore multiple instances if `paranoid` is enabled.
     *
     * @param  {Object}       options                         restore options
     * @param  {Object}       [options.where]                 Filter the restore
     * @param  {boolean}      [options.hooks=true]            Run before / after bulk restore hooks?
     * @param  {boolean}      [options.individualHooks=false] If set to true, restore will find all records within the where parameter and will execute before / after bulkRestore hooks on each row
     * @param  {number}       [options.limit]                 How many rows to undelete (only for mysql)
     * @param  {Function}     [options.logging=false]         A function that gets executed while running the query to log the sql.
     * @param  {boolean}      [options.benchmark=false]       Pass query execution time in milliseconds as second argument to logging function (options.logging).
     * @param  {Transaction}  [options.transaction]           Transaction to run query under
     *
     * @returns {Promise}
     */

  }, {
    key: "restore",
    value: function restore(options) {
      if (!this._timestampAttributes.deletedAt) throw new Error('Model is not paranoid');
      options = Object.assign({
        hooks: true,
        individualHooks: false
      }, options || {});
      options.type = QueryTypes.RAW;
      options.model = this;
      let instances;
      Utils.mapOptionFieldNames(options, this);
      return Promise.try(() => {
        // Run before hook
        if (options.hooks) {
          return this.runHooks('beforeBulkRestore', options);
        }
      }).then(() => {
        // Get daos and run beforeRestore hook on each record individually
        if (options.individualHooks) {
          return this.findAll({
            where: options.where,
            transaction: options.transaction,
            logging: options.logging,
            benchmark: options.benchmark,
            paranoid: false
          }).map(instance => this.runHooks('beforeRestore', instance, options).then(() => instance)).then(_instances => {
            instances = _instances;
          });
        }
      }).then(() => {
        // Run undelete query
        const attrValueHash = {};
        const deletedAtCol = this._timestampAttributes.deletedAt;
        const deletedAtAttribute = this.rawAttributes[deletedAtCol];
        const deletedAtDefaultValue = Object.prototype.hasOwnProperty.call(deletedAtAttribute, 'defaultValue') ? deletedAtAttribute.defaultValue : null;
        attrValueHash[deletedAtAttribute.field || deletedAtCol] = deletedAtDefaultValue;
        options.omitNull = false;
        return this.QueryInterface.bulkUpdate(this.getTableName(options), attrValueHash, options.where, options, this.rawAttributes);
      }).tap(() => {
        // Run afterDestroy hook on each record individually
        if (options.individualHooks) {
          return Promise.map(instances, instance => this.runHooks('afterRestore', instance, options));
        }
      }).tap(() => {
        // Run after hook
        if (options.hooks) {
          return this.runHooks('afterBulkRestore', options);
        }
      });
    }
    /**
     * Update multiple instances that match the where options.
     *
     * @param  {Object}       values                          hash of values to update
     * @param  {Object}       options                         update options
     * @param  {Object}       options.where                   Options to describe the scope of the search.
     * @param  {boolean}      [options.paranoid=true]         If true, only non-deleted records will be updated. If false, both deleted and non-deleted records will be updated. Only applies if `options.paranoid` is true for the model.
     * @param  {Array}        [options.fields]                Fields to update (defaults to all fields)
     * @param  {boolean}      [options.validate=true]         Should each row be subject to validation before it is inserted. The whole insert will fail if one row fails validation
     * @param  {boolean}      [options.hooks=true]            Run before / after bulk update hooks?
     * @param  {boolean}      [options.sideEffects=true]      Whether or not to update the side effects of any virtual setters.
     * @param  {boolean}      [options.individualHooks=false] Run before / after update hooks?. If true, this will execute a SELECT followed by individual UPDATEs. A select is needed, because the row data needs to be passed to the hooks
     * @param  {boolean}      [options.returning=false]       Return the affected rows (only for postgres)
     * @param  {number}       [options.limit]                 How many rows to update (only for mysql and mariadb, implemented as TOP(n) for MSSQL; for sqlite it is supported only when rowid is present)
     * @param  {Function}     [options.logging=false]         A function that gets executed while running the query to log the sql.
     * @param  {boolean}      [options.benchmark=false]       Pass query execution time in milliseconds as second argument to logging function (options.logging).
     * @param  {Transaction}  [options.transaction]           Transaction to run query under
     * @param  {boolean}      [options.silent=false]          If true, the updatedAt timestamp will not be updated.
     *
     * @returns {Promise<Array<number,number>>}  The promise returns an array with one or two elements. The first element is always the number
     * of affected rows, while the second element is the actual affected rows (only supported in postgres with `options.returning` true.)
     *
     */

  }, {
    key: "update",
    value: function update(values, options) {
      options = Utils.cloneDeep(options);

      this._injectScope(options);

      this._optionsMustContainWhere(options);

      options = this._paranoidClause(this, _.defaults(options, {
        validate: true,
        hooks: true,
        individualHooks: false,
        returning: false,
        force: false,
        sideEffects: true
      }));
      options.type = QueryTypes.BULKUPDATE; // Clone values so it doesn't get modified for caller scope and ignore undefined values

      values = _.omitBy(values, value => value === undefined); // Remove values that are not in the options.fields

      if (options.fields && options.fields instanceof Array) {
        for (const key of Object.keys(values)) {
          if (!options.fields.includes(key)) {
            delete values[key];
          }
        }
      } else {
        const updatedAtAttr = this._timestampAttributes.updatedAt;
        options.fields = _.intersection(Object.keys(values), Object.keys(this.tableAttributes));

        if (updatedAtAttr && !options.fields.includes(updatedAtAttr)) {
          options.fields.push(updatedAtAttr);
        }
      }

      if (this._timestampAttributes.updatedAt && !options.silent) {
        values[this._timestampAttributes.updatedAt] = this._getDefaultTimestamp(this._timestampAttributes.updatedAt) || Utils.now(this.sequelize.options.dialect);
      }

      options.model = this;
      let instances;
      let valuesUse;
      return Promise.try(() => {
        // Validate
        if (options.validate) {
          const build = this.build(values);
          build.set(this._timestampAttributes.updatedAt, values[this._timestampAttributes.updatedAt], {
            raw: true
          });

          if (options.sideEffects) {
            values = Object.assign(values, _.pick(build.get(), build.changed()));
            options.fields = _.union(options.fields, Object.keys(values));
          } // We want to skip validations for all other fields


          options.skip = _.difference(Object.keys(this.rawAttributes), Object.keys(values));
          return build.validate(options).then(attributes => {
            options.skip = undefined;

            if (attributes && attributes.dataValues) {
              values = _.pick(attributes.dataValues, Object.keys(values));
            }
          });
        }

        return null;
      }).then(() => {
        // Run before hook
        if (options.hooks) {
          options.attributes = values;
          return this.runHooks('beforeBulkUpdate', options).then(() => {
            values = options.attributes;
            delete options.attributes;
          });
        }

        return null;
      }).then(() => {
        valuesUse = values; // Get instances and run beforeUpdate hook on each record individually

        if (options.individualHooks) {
          return this.findAll({
            where: options.where,
            transaction: options.transaction,
            logging: options.logging,
            benchmark: options.benchmark,
            paranoid: options.paranoid
          }).then(_instances => {
            instances = _instances;

            if (!instances.length) {
              return [];
            } // Run beforeUpdate hooks on each record and check whether beforeUpdate hook changes values uniformly
            // i.e. whether they change values for each record in the same way


            let changedValues;
            let different = false;
            return Promise.map(instances, instance => {
              // Record updates in instances dataValues
              Object.assign(instance.dataValues, values); // Set the changed fields on the instance

              _.forIn(valuesUse, (newValue, attr) => {
                if (newValue !== instance._previousDataValues[attr]) {
                  instance.setDataValue(attr, newValue);
                }
              }); // Run beforeUpdate hook


              return this.runHooks('beforeUpdate', instance, options).then(() => {
                if (!different) {
                  const thisChangedValues = {};

                  _.forIn(instance.dataValues, (newValue, attr) => {
                    if (newValue !== instance._previousDataValues[attr]) {
                      thisChangedValues[attr] = newValue;
                    }
                  });

                  if (!changedValues) {
                    changedValues = thisChangedValues;
                  } else {
                    different = !_.isEqual(changedValues, thisChangedValues);
                  }
                }

                return instance;
              });
            }).then(_instances => {
              instances = _instances;

              if (!different) {
                const keys = Object.keys(changedValues); // Hooks do not change values or change them uniformly

                if (keys.length) {
                  // Hooks change values - record changes in valuesUse so they are executed
                  valuesUse = changedValues;
                  options.fields = _.union(options.fields, keys);
                }

                return;
              } // Hooks change values in a different way for each record
              // Do not run original query but save each record individually


              return Promise.map(instances, instance => {
                const individualOptions = _.clone(options);

                delete individualOptions.individualHooks;
                individualOptions.hooks = false;
                individualOptions.validate = false;
                return instance.save(individualOptions);
              }).tap(_instances => {
                instances = _instances;
              });
            });
          });
        }
      }).then(results => {
        // Update already done row-by-row - exit
        if (results) {
          return [results.length, results];
        } // only updatedAt is being passed, then skip update


        if (_.isEmpty(valuesUse) || Object.keys(valuesUse).length === 1 && valuesUse[this._timestampAttributes.updatedAt]) {
          return [0];
        }

        valuesUse = Utils.mapValueFieldNames(valuesUse, options.fields, this);
        options = Utils.mapOptionFieldNames(options, this);
        options.hasTrigger = this.options ? this.options.hasTrigger : false; // Run query to update all rows

        return this.QueryInterface.bulkUpdate(this.getTableName(options), valuesUse, options.where, options, this.tableAttributes).then(affectedRows => {
          if (options.returning) {
            instances = affectedRows;
            return [affectedRows.length, affectedRows];
          }

          return [affectedRows];
        });
      }).tap(result => {
        if (options.individualHooks) {
          return Promise.map(instances, instance => {
            return this.runHooks('afterUpdate', instance, options);
          }).then(() => {
            result[1] = instances;
          });
        }
      }).tap(() => {
        // Run after hook
        if (options.hooks) {
          options.attributes = values;
          return this.runHooks('afterBulkUpdate', options).then(() => {
            delete options.attributes;
          });
        }
      });
    }
    /**
     * Run a describe query on the table.
     *
     * @param {string} [schema] schema name to search table in
     * @param {Object} [options] query options
     *
     * @returns {Promise} hash of attributes and their types
     */

  }, {
    key: "describe",
    value: function describe(schema, options) {
      return this.QueryInterface.describeTable(this.tableName, Object.assign({
        schema: schema || this._schema || undefined
      }, options));
    }
  }, {
    key: "_getDefaultTimestamp",
    value: function _getDefaultTimestamp(attr) {
      if (!!this.rawAttributes[attr] && !!this.rawAttributes[attr].defaultValue) {
        return Utils.toDefaultValue(this.rawAttributes[attr].defaultValue, this.sequelize.options.dialect);
      }

      return undefined;
    }
  }, {
    key: "_expandAttributes",
    value: function _expandAttributes(options) {
      if (!_.isPlainObject(options.attributes)) {
        return;
      }

      let attributes = Object.keys(this.rawAttributes);

      if (options.attributes.exclude) {
        attributes = attributes.filter(elem => !options.attributes.exclude.includes(elem));
      }

      if (options.attributes.include) {
        attributes = attributes.concat(options.attributes.include);
      }

      options.attributes = attributes;
    } // Inject _scope into options.

  }, {
    key: "_injectScope",
    value: function _injectScope(options) {
      const scope = Utils.cloneDeep(this._scope);

      this._defaultsOptions(options, scope);
    }
  }, {
    key: Symbol.for('nodejs.util.inspect.custom'),
    value: function () {
      return this.name;
    }
  }, {
    key: "inspect",
    value: function inspect() {
      return this.name;
    }
  }, {
    key: "hasAlias",
    value: function hasAlias(alias) {
      return Object.prototype.hasOwnProperty.call(this.associations, alias);
    }
    /**
     * Increment the value of one or more columns. This is done in the database, which means it does not use the values currently stored on the Instance. The increment is done using a
     * ``` SET column = column + X WHERE foo = 'bar' ``` query. To get the correct value after an increment into the Instance you should do a reload.
     *
     * @example <caption>increment number by 1</caption>
     * Model.increment('number', { where: { foo: 'bar' });
     *
     * @example <caption>increment number and count by 2</caption>
     * Model.increment(['number', 'count'], { by: 2, where: { foo: 'bar' } });
     *
     * @example <caption>increment answer by 42, and decrement tries by 1</caption>
     * // `by` is ignored, as each column has its own value
     * Model.increment({ answer: 42, tries: -1}, { by: 2, where: { foo: 'bar' } });
     *
     * @see
     * {@link Model#reload}
     *
     * @param {string|Array|Object} fields If a string is provided, that column is incremented by the value of `by` given in options. If an array is provided, the same is true for each column. If and object is provided, each column is incremented by the value given.
     * @param {Object} options increment options
     * @param {Object} options.where conditions hash
     * @param {number} [options.by=1] The number to increment by
     * @param {boolean} [options.silent=false] If true, the updatedAt timestamp will not be updated.
     * @param {Function} [options.logging=false] A function that gets executed while running the query to log the sql.
     * @param {Transaction} [options.transaction] Transaction to run query under
     * @param {string} [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
     *
     * @returns {Promise<Model[],?number>} returns an array of affected rows and affected count with `options.returning: true`, whenever supported by dialect
     */

  }, {
    key: "increment",
    value: function increment(fields, options) {
      options = options || {};

      this._injectScope(options);

      this._optionsMustContainWhere(options);

      const updatedAtAttr = this._timestampAttributes.updatedAt;
      const versionAttr = this._versionAttribute;
      const updatedAtAttribute = this.rawAttributes[updatedAtAttr];
      options = Utils.defaults({}, options, {
        by: 1,
        attributes: {},
        where: {},
        increment: true
      });
      Utils.mapOptionFieldNames(options, this);
      const where = Object.assign({}, options.where);
      let values = {};

      if (typeof fields === 'string') {
        values[fields] = options.by;
      } else if (Array.isArray(fields)) {
        fields.forEach(field => {
          values[field] = options.by;
        });
      } else {
        // Assume fields is key-value pairs
        values = fields;
      }

      if (!options.silent && updatedAtAttr && !values[updatedAtAttr]) {
        options.attributes[updatedAtAttribute.field || updatedAtAttr] = this._getDefaultTimestamp(updatedAtAttr) || Utils.now(this.sequelize.options.dialect);
      }

      if (versionAttr) {
        values[versionAttr] = options.increment ? 1 : -1;
      }

      for (const attr of Object.keys(values)) {
        // Field name mapping
        if (this.rawAttributes[attr] && this.rawAttributes[attr].field && this.rawAttributes[attr].field !== attr) {
          values[this.rawAttributes[attr].field] = values[attr];
          delete values[attr];
        }
      }

      let promise;

      if (!options.increment) {
        promise = this.QueryInterface.decrement(this, this.getTableName(options), values, where, options);
      } else {
        promise = this.QueryInterface.increment(this, this.getTableName(options), values, where, options);
      }

      return promise.then(affectedRows => {
        if (options.returning) {
          return [affectedRows, affectedRows.length];
        }

        return [affectedRows];
      });
    }
    /**
     * Decrement the value of one or more columns. This is done in the database, which means it does not use the values currently stored on the Instance. The decrement is done using a
     * ```sql SET column = column - X WHERE foo = 'bar'``` query. To get the correct value after a decrement into the Instance you should do a reload.
     *
     * @example <caption>decrement number by 1</caption>
     * Model.decrement('number', { where: { foo: 'bar' });
     *
     * @example <caption>decrement number and count by 2</caption>
     * Model.decrement(['number', 'count'], { by: 2, where: { foo: 'bar' } });
     *
     * @example <caption>decrement answer by 42, and decrement tries by -1</caption>
     * // `by` is ignored, since each column has its own value
     * Model.decrement({ answer: 42, tries: -1}, { by: 2, where: { foo: 'bar' } });
     *
     * @param {string|Array|Object} fields If a string is provided, that column is incremented by the value of `by` given in options. If an array is provided, the same is true for each column. If and object is provided, each column is incremented by the value given.
     * @param {Object} options decrement options, similar to increment
     *
     * @see
     * {@link Model.increment}
     * @see
     * {@link Model#reload}
     * @since 4.36.0
      * @returns {Promise<Model[],?number>} returns an array of affected rows and affected count with `options.returning: true`, whenever supported by dialect
     */

  }, {
    key: "decrement",
    value: function decrement(fields, options) {
      options = _.defaults({
        increment: false
      }, options, {
        by: 1
      });
      return this.increment(fields, options);
    }
  }, {
    key: "_optionsMustContainWhere",
    value: function _optionsMustContainWhere(options) {
      assert(options && options.where, 'Missing where attribute in the options parameter');
      assert(_.isPlainObject(options.where) || Array.isArray(options.where) || options.where instanceof Utils.SequelizeMethod, 'Expected plain object, array or sequelize method in the options.where parameter');
    }
  }, {
    key: "hasMany",
    value: function hasMany(target, options) {} // eslint-disable-line

    /**
     * Create an N:M association with a join table. Defining `through` is required.
     *
     * @param {Model}               target Target model
     * @param {Object}              options belongsToMany association options
     * @param {boolean}             [options.hooks=false] Set to true to run before-/afterDestroy hooks when an associated model is deleted because of a cascade. For example if `User.hasOne(Profile, {onDelete: 'cascade', hooks:true})`, the before-/afterDestroy hooks for profile will be called when a user is deleted. Otherwise the profile will be deleted without invoking any hooks
     * @param {Model|string|Object} options.through The name of the table that is used to join source and target in n:m associations. Can also be a sequelize model if you want to define the junction table yourself and add extra attributes to it.
     * @param {Model}               [options.through.model] The model used to join both sides of the N:M association.
     * @param {Object}              [options.through.scope] A key/value set that will be used for association create and find defaults on the through model. (Remember to add the attributes to the through model)
     * @param {boolean}             [options.through.unique=true] If true a unique key will be generated from the foreign keys used (might want to turn this off and create specific unique keys when using scopes)
     * @param {string|Object}       [options.as] The alias of this association. If you provide a string, it should be plural, and will be singularized using node.inflection. If you want to control the singular version yourself, provide an object with `plural` and `singular` keys. See also the `name` option passed to `sequelize.define`. If you create multiple associations between the same tables, you should provide an alias to be able to distinguish between them. If you provide an alias when creating the association, you should provide the same alias when eager loading and when getting associated models. Defaults to the pluralized name of target
     * @param {string|Object}       [options.foreignKey] The name of the foreign key in the join table (representing the source model) or an object representing the type definition for the foreign column (see `Sequelize.define` for syntax). When using an object, you can add a `name` property to set the name of the column. Defaults to the name of source + primary key of source
     * @param {string|Object}       [options.otherKey] The name of the foreign key in the join table (representing the target model) or an object representing the type definition for the other column (see `Sequelize.define` for syntax). When using an object, you can add a `name` property to set the name of the column. Defaults to the name of target + primary key of target
     * @param {Object}              [options.scope] A key/value set that will be used for association create and find defaults on the target. (sqlite not supported for N:M)
     * @param {boolean}             [options.timestamps=sequelize.options.timestamps] Should the join model have timestamps
     * @param {string}              [options.onDelete='SET&nbsp;NULL|CASCADE'] Cascade if this is a n:m, and set null if it is a 1:m
     * @param {string}              [options.onUpdate='CASCADE'] Sets `ON UPDATE`
     * @param {boolean}             [options.constraints=true] Should on update and on delete constraints be enabled on the foreign key.
     *
     * @returns {BelongsToMany}
     *
     * @example
     * // Automagically generated join model
     * User.belongsToMany(Project, { through: 'UserProjects' })
     * Project.belongsToMany(User, { through: 'UserProjects' })
     *
     * // Join model with additional attributes
     * const UserProjects = sequelize.define('UserProjects', {
     *   started: Sequelize.BOOLEAN
     * })
     * User.belongsToMany(Project, { through: UserProjects })
     * Project.belongsToMany(User, { through: UserProjects })
     */

  }, {
    key: "belongsToMany",
    value: function belongsToMany(target, options) {} // eslint-disable-line

    /**
     * Creates an association between this (the source) and the provided target. The foreign key is added on the target.
     *
     * @param {Model}           target Target model
     * @param {Object}          [options] hasOne association options
     * @param {boolean}         [options.hooks=false] Set to true to run before-/afterDestroy hooks when an associated model is deleted because of a cascade. For example if `User.hasOne(Profile, {onDelete: 'cascade', hooks:true})`, the before-/afterDestroy hooks for profile will be called when a user is deleted. Otherwise the profile will be deleted without invoking any hooks
     * @param {string}          [options.as] The alias of this model, in singular form. See also the `name` option passed to `sequelize.define`. If you create multiple associations between the same tables, you should provide an alias to be able to distinguish between them. If you provide an alias when creating the association, you should provide the same alias when eager loading and when getting associated models. Defaults to the singularized name of target
     * @param {string|Object}   [options.foreignKey] The name of the foreign key attribute in the target model or an object representing the type definition for the foreign column (see `Sequelize.define` for syntax). When using an object, you can add a `name` property to set the name of the column. Defaults to the name of source + primary key of source
     * @param {string}          [options.sourceKey] The name of the attribute to use as the key for the association in the source table. Defaults to the primary key of the source table
     * @param {string}          [options.onDelete='SET&nbsp;NULL|CASCADE'] SET NULL if foreignKey allows nulls, CASCADE if otherwise
     * @param {string}          [options.onUpdate='CASCADE'] Sets 'ON UPDATE'
     * @param {boolean}         [options.constraints=true] Should on update and on delete constraints be enabled on the foreign key.
     * @param {string}          [options.uniqueKey] The custom name for unique constraint.
     *
     * @returns {HasOne}
     *
     * @example
     * User.hasOne(Profile) // This will add userId to the profile table
     */

  }, {
    key: "hasOne",
    value: function hasOne(target, options) {} // eslint-disable-line

    /**
     * Creates an association between this (the source) and the provided target. The foreign key is added on the source.
     *
     * @param {Model}           target The target model
     * @param {Object}          [options] belongsTo association options
     * @param {boolean}         [options.hooks=false] Set to true to run before-/afterDestroy hooks when an associated model is deleted because of a cascade. For example if `User.hasOne(Profile, {onDelete: 'cascade', hooks:true})`, the before-/afterDestroy hooks for profile will be called when a user is deleted. Otherwise the profile will be deleted without invoking any hooks
     * @param {string}          [options.as] The alias of this model, in singular form. See also the `name` option passed to `sequelize.define`. If you create multiple associations between the same tables, you should provide an alias to be able to distinguish between them. If you provide an alias when creating the association, you should provide the same alias when eager loading and when getting associated models. Defaults to the singularized name of target
     * @param {string|Object}   [options.foreignKey] The name of the foreign key attribute in the source table or an object representing the type definition for the foreign column (see `Sequelize.define` for syntax). When using an object, you can add a `name` property to set the name of the column. Defaults to the name of target + primary key of target
     * @param {string}          [options.targetKey] The name of the attribute to use as the key for the association in the target table. Defaults to the primary key of the target table
     * @param {string}          [options.onDelete='SET&nbsp;NULL|NO&nbsp;ACTION'] SET NULL if foreignKey allows nulls, NO ACTION if otherwise
     * @param {string}          [options.onUpdate='CASCADE'] Sets 'ON UPDATE'
     * @param {boolean}         [options.constraints=true] Should on update and on delete constraints be enabled on the foreign key.
     *
     * @returns {BelongsTo}
     *
     * @example
     * Profile.belongsTo(User) // This will add userId to the profile table
     */

  }, {
    key: "belongsTo",
    value: function belongsTo(target, options) {} // eslint-disable-line

  }]);

  return Model;
}();

Object.assign(Model, associationsMixin);
Hooks.applyTo(Model, true);
module.exports = Model;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9tb2RlbC5qcyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiXyIsIkRvdHRpZSIsIlV0aWxzIiwibG9nZ2VyIiwiQmVsb25nc1RvIiwiQmVsb25nc1RvTWFueSIsIkluc3RhbmNlVmFsaWRhdG9yIiwiUXVlcnlUeXBlcyIsInNlcXVlbGl6ZUVycm9ycyIsIlByb21pc2UiLCJBc3NvY2lhdGlvbiIsIkhhc01hbnkiLCJEYXRhVHlwZXMiLCJIb29rcyIsImFzc29jaWF0aW9uc01peGluIiwiT3AiLCJub0RvdWJsZU5lc3RlZEdyb3VwIiwidmFsaWRRdWVyeUtleXdvcmRzIiwiU2V0Iiwibm9uQ2FzY2FkaW5nT3B0aW9ucyIsIk1vZGVsIiwiY29uc3RydWN0b3IiLCJzZXF1ZWxpemUiLCJnZXRRdWVyeUludGVyZmFjZSIsIlF1ZXJ5SW50ZXJmYWNlIiwiUXVlcnlHZW5lcmF0b3IiLCJ2YWx1ZXMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiaXNOZXdSZWNvcmQiLCJfc2NoZW1hIiwiX3NjaGVtYURlbGltaXRlciIsImF0dHJpYnV0ZXMiLCJtYXAiLCJhdHRyaWJ1dGUiLCJBcnJheSIsImlzQXJyYXkiLCJpbmNsdWRlVmFsaWRhdGVkIiwiX2NvbmZvcm1JbmNsdWRlcyIsImluY2x1ZGUiLCJfZXhwYW5kSW5jbHVkZUFsbCIsIl92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudHMiLCJkYXRhVmFsdWVzIiwiX3ByZXZpb3VzRGF0YVZhbHVlcyIsIl9jaGFuZ2VkIiwiX21vZGVsT3B0aW9ucyIsIl9vcHRpb25zIiwiX2luaXRWYWx1ZXMiLCJkZWZhdWx0cyIsImtleSIsImNsb25lIiwiX2hhc0RlZmF1bHRWYWx1ZXMiLCJtYXBWYWx1ZXMiLCJfZGVmYXVsdFZhbHVlcyIsInZhbHVlRm4iLCJ2YWx1ZSIsIlNlcXVlbGl6ZU1ldGhvZCIsImNsb25lRGVlcCIsInByaW1hcnlLZXlBdHRyaWJ1dGVzIiwibGVuZ3RoIiwiZm9yRWFjaCIsInByaW1hcnlLZXlBdHRyaWJ1dGUiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJfdGltZXN0YW1wQXR0cmlidXRlcyIsImNyZWF0ZWRBdCIsInRvRGVmYXVsdFZhbHVlIiwiZGlhbGVjdCIsInVwZGF0ZWRBdCIsImRlbGV0ZWRBdCIsImtleXMiLCJ1bmRlZmluZWQiLCJzZXQiLCJyYXciLCJjaGVja1ZlcnNpb24iLCJ3aGVyZSIsInJlZHVjZSIsInJlc3VsdCIsImdldCIsInNpemUiLCJ3aGVyZUNvbGxlY3Rpb24iLCJ2ZXJzaW9uQXR0ciIsIl92ZXJzaW9uQXR0cmlidXRlIiwibWFwV2hlcmVGaWVsZE5hbWVzIiwibmFtZSIsIm9yaWdpbmFsVmFsdWUiLCJpc1ByaW1pdGl2ZSIsImNoYW5nZWQiLCJfY3VzdG9tR2V0dGVycyIsInBsYWluIiwiaW5jbHVkZU5hbWVzIiwiaW5jbHVkZXMiLCJpbnN0YW5jZSIsIl9oYXNDdXN0b21HZXR0ZXJzIiwiX2tleSIsInJlc2V0IiwiX2hhc0RhdGVBdHRyaWJ1dGVzIiwiX2hhc0Jvb2xlYW5BdHRyaWJ1dGVzIiwic2V0S2V5cyIsImRhdGEiLCJrIiwiX2hhc1ZpcnR1YWxBdHRyaWJ1dGVzIiwiX3ZpcnR1YWxBdHRyaWJ1dGVzIiwiX2N1c3RvbVNldHRlcnMiLCJuZXdWYWx1ZSIsIl9zZXRJbmNsdWRlIiwiX2lzQXR0cmlidXRlIiwiX2pzb25BdHRyaWJ1dGVzIiwiaGFzIiwic3BsaXQiLCJwcmV2aW91c05lc3RlZFZhbHVlIiwiaXNFcXVhbCIsIl9oYXNQcmltYXJ5S2V5cyIsIl9pc1ByaW1hcnlLZXkiLCJfaGFzUmVhZE9ubHlBdHRyaWJ1dGVzIiwiX3JlYWRPbmx5QXR0cmlidXRlcyIsIl9kYXRhVHlwZVNhbml0aXplcnMiLCJfZGF0YVR5cGVDaGFuZ2VzIiwidXBkYXRlcyIsImZpbHRlciIsInBpY2tCeSIsImluY2x1ZGVNYXAiLCJhc3NvY2lhdGlvbiIsImFjY2Vzc29yIiwibW9kZWwiLCJjaGlsZE9wdGlvbnMiLCJvcmlnaW5hbEF0dHJpYnV0ZXMiLCJpc0VtcHR5IiwiaXNTaW5nbGVBc3NvY2lhdGlvbiIsImJ1aWxkIiwiYnVsa0J1aWxkIiwiYXJndW1lbnRzIiwiRXJyb3IiLCJob29rcyIsInZhbGlkYXRlIiwiZmllbGRzIiwicmF3QXR0cmlidXRlcyIsImludGVyc2VjdGlvbiIsImRlZmF1bHRGaWVsZHMiLCJyZXR1cm5pbmciLCJwcmltYXJ5S2V5TmFtZSIsImNyZWF0ZWRBdEF0dHIiLCJob29rIiwid2FzTmV3UmVjb3JkIiwibm93IiwidXBkYXRlZEF0QXR0ciIsInB1c2giLCJzaWxlbnQiLCJyZW1vdmUiLCJ2YWwiLCJkZWZhdWx0VmFsdWUiLCJ1bnNoaWZ0IiwiX2dldERlZmF1bHRUaW1lc3RhbXAiLCJ0cnkiLCJ0aGVuIiwiYmVmb3JlSG9va1ZhbHVlcyIsInBpY2siLCJpZ25vcmVDaGFuZ2VkIiwiZGlmZmVyZW5jZSIsImhvb2tDaGFuZ2VkIiwiYWZ0ZXJIb29rVmFsdWVzIiwid2l0aG91dCIsInJ1bkhvb2tzIiwidW5pcSIsImNvbmNhdCIsInNraXAiLCJhcyIsInJlc29sdmUiLCJpbmNsdWRlT3B0aW9ucyIsIm9taXQiLCJ0cmFuc2FjdGlvbiIsImxvZ2dpbmciLCJwYXJlbnRSZWNvcmQiLCJzYXZlIiwiYWNjZXNzb3JzIiwicmVhbEZpZWxkcyIsImZpZWxkIiwidmVyc2lvbkZpZWxkTmFtZSIsIm1hcFZhbHVlRmllbGROYW1lcyIsInF1ZXJ5IiwiYXJncyIsImdldFRhYmxlTmFtZSIsInBhcnNlSW50Iiwicm93c1VwZGF0ZWQiLCJPcHRpbWlzdGljTG9ja0Vycm9yIiwibW9kZWxOYW1lIiwiYXR0ciIsInRhcCIsInBhcmVudCIsImluc3RhbmNlcyIsImZvcmVpZ25LZXkiLCJvdGhlcktleSIsInRocm91Z2giLCJzY29wZSIsIl9hdXRvR2VuZXJhdGVkIiwidGhyb3VnaE1vZGVsIiwiY3JlYXRlIiwic291cmNlS2V5IiwiZmluZE9uZSIsInJlbG9hZCIsIkluc3RhbmNlRXJyb3IiLCJvbWl0QnkiLCJjaGFuZ2VkQmVmb3JlIiwic2V0T3B0aW9ucyIsInNpZGVFZmZlY3RzIiwidW5pb24iLCJmb3JjZSIsImF0dHJpYnV0ZU5hbWUiLCJjdXJyZW50VmFsdWUiLCJnZXREYXRhVmFsdWUiLCJ1bmRlZmluZWRPck51bGwiLCJzZXREYXRhVmFsdWUiLCJEYXRlIiwiZGVsZXRlIiwidHlwZSIsIkRFTEVURSIsImxpbWl0IiwiZGVsZXRlZEF0QXR0cmlidXRlIiwiaXNTZXQiLCJkZWxldGVkQXRDb2wiLCJkZWxldGVkQXREZWZhdWx0VmFsdWUiLCJvbWl0TnVsbCIsImlkZW50aWZpZXIiLCJpbmNyZW1lbnQiLCJyZXR1cm4iLCJieSIsIm90aGVyIiwiZXZlcnkiLCJvdGhlcnMiLCJzb21lIiwiZXF1YWxzIiwidmFsaWRhdG9ycyIsIl9wYXJhbm9pZENsYXVzZSIsImdyb3VwZWRMaW1pdCIsInRpbWVzdGFtcHMiLCJwYXJhbm9pZCIsImRlbGV0ZWRBdE9iamVjdCIsImVxIiwiaXNXaGVyZUVtcHR5IiwiYW5kIiwidGFpbCIsImhlYWQiLCJ0YWJsZU5hbWUiLCJpZCIsIklOVEVHRVIiLCJhbGxvd051bGwiLCJwcmltYXJ5S2V5IiwiYXV0b0luY3JlbWVudCIsIkRBVEUiLCJleGlzdGluZ0F0dHJpYnV0ZXMiLCJlYWNoIiwicHJpbWFyeUtleXMiLCJhdXRvSW5jcmVtZW50QXR0cmlidXRlIiwiZGVmaW5pdGlvbiIsInNlbGYiLCJfY29uZm9ybUluY2x1ZGUiLCJhc3NvY2lhdGlvbnMiLCJfcHNldWRvIiwiX3RyYW5zZm9ybVN0cmluZ0Fzc29jaWF0aW9uIiwidGFyZ2V0Iiwic291cmNlIiwiaXNQbGFpbk9iamVjdCIsImFsbCIsInZhbGlkVHlwZXMiLCJIYXNPbmUiLCJPbmUiLCJIYXMiLCJNYW55IiwiaSIsInR5cGVzIiwiRWFnZXJMb2FkaW5nRXJyb3IiLCJzcGxpY2UiLCJqIiwibmVzdGVkIiwidXNlZCIsImFkZEFsbEluY2x1ZGVzIiwiYXNzb2NpYXRpb25UeXBlIiwicHJlZGljYXRlIiwidGhpc0luY2x1ZGUiLCJwb3AiLCJ0YWJsZU5hbWVzIiwiaGFzU2luZ2xlQXNzb2NpYXRpb24iLCJoYXNNdWx0aUFzc29jaWF0aW9uIiwidG9wTW9kZWwiLCJ0b3BMaW1pdCIsIl92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudCIsImR1cGxpY2F0aW5nIiwiaXNNdWx0aUFzc29jaWF0aW9uIiwiaGFzRHVwbGljYXRpbmciLCJoYXNSZXF1aXJlZCIsInJlcXVpcmVkIiwiaGFzV2hlcmUiLCJoYXNQYXJlbnRXaGVyZSIsImhhc1BhcmVudFJlcXVpcmVkIiwic3ViUXVlcnkiLCJzdWJRdWVyeUZpbHRlciIsImhhc0luY2x1ZGVXaGVyZSIsImhhc0luY2x1ZGVSZXF1aXJlZCIsIl9leHBhbmRBdHRyaWJ1dGVzIiwiX2luamVjdERlcGVuZGVudFZpcnR1YWxBdHRyaWJ1dGVzIiwibWFwRmluZGVyT3B0aW9ucyIsImluY2x1ZGVBdHRyIiwidGFibGVBdHRyaWJ1dGVzIiwiX2dldEluY2x1ZGVkQXNzb2NpYXRpb24iLCJzY29wZWQiLCJfaW5qZWN0U2NvcGUiLCJzZXBhcmF0ZSIsImZsYXR0ZW5EZXB0aCIsInRhcmdldE1vZGVsIiwidGFyZ2V0QWxpYXMiLCJnZXRBc3NvY2lhdGlvbnMiLCJnZXRBc3NvY2lhdGlvbkZvckFsaWFzIiwiZXhpc3RpbmdBbGlhc2VzIiwiam9pbiIsImluZGV4IiwiX2V4cGFuZEluY2x1ZGVBbGxFbGVtZW50IiwicGFyc2VyIiwidG9Mb3dlckNhc2UiLCJ1bmlxdWUiLCJncm91cEJ5IiwiX2Fzc2lnbk9wdGlvbnMiLCJhc3NpZ25XaXRoIiwiX3VuaXFJbmNsdWRlcyIsIm9ialZhbHVlIiwic3JjVmFsdWUiLCJfYmFzZU1lcmdlIiwiX21lcmdlRnVuY3Rpb24iLCJvcHRzIiwiZ2xvYmFsT3B0aW9ucyIsIm1lcmdlIiwiZGVmaW5lIiwicGx1cmFsIiwicGx1cmFsaXplIiwic2luZ3VsYXIiLCJzaW5ndWxhcml6ZSIsImluZGV4ZXMiLCJzY2hlbWEiLCJkZWZpbmVQcm9wZXJ0eSIsImZyZWV6ZVRhYmxlTmFtZSIsInVuZGVyc2NvcmVkIiwicmVqZWN0T25FbXB0eSIsInNjaGVtYURlbGltaXRlciIsImRlZmF1bHRTY29wZSIsInNjb3BlcyIsImlzRGVmaW5lZCIsIm1vZGVsTWFuYWdlciIsInJlbW92ZU1vZGVsIiwiZ2V0TW9kZWwiLCJfc2V0dXBIb29rcyIsInVuZGVyc2NvcmVkSWYiLCJ2YWxpZGF0b3IiLCJ2YWxpZGF0b3JUeXBlIiwibm9ybWFsaXplQXR0cmlidXRlIiwicmVmZXJlbmNlcyIsIl9pbmRleGVzIiwibmFtZUluZGV4IiwiX2NvbmZvcm1JbmRleCIsImFkZCIsInZlcnNpb24iLCJfYWRkRGVmYXVsdEF0dHJpYnV0ZXMiLCJyZWZyZXNoQXR0cmlidXRlcyIsIl9maW5kQXV0b0luY3JlbWVudEF0dHJpYnV0ZSIsIl9zY29wZSIsIl9zY29wZU5hbWVzIiwiYWRkTW9kZWwiLCJhdHRyaWJ1dGVNYW5pcHVsYXRpb24iLCJvcHQiLCJmdW5jcyIsImlzT2JqZWN0IiwiX2N1c3RvbSIsIm1ldGhvZCIsImZjdCIsImNvbmZpZ3VyYWJsZSIsImZpZWxkUmF3QXR0cmlidXRlc01hcCIsInVuaXF1ZUtleXMiLCJub3JtYWxpemVEYXRhVHlwZSIsImZpZWxkTmFtZSIsIl9tb2RlbEF0dHJpYnV0ZSIsIl9zYW5pdGl6ZSIsIl9pc0NoYW5nZWQiLCJCT09MRUFOIiwiREFURU9OTFkiLCJKU09OIiwiVklSVFVBTCIsImlkeE5hbWUiLCJpZHgiLCJtc2ciLCJjb2x1bW4iLCJjdXN0b21JbmRleCIsIkpTT05CIiwidXNpbmciLCJmaWVsZEF0dHJpYnV0ZU1hcCIsIl9oYXNKc29uQXR0cmlidXRlcyIsIl9hIiwiX2hhc0N1c3RvbVNldHRlcnMiLCJsb2ciLCJwcmltYXJ5S2V5RmllbGQiLCJkcm9wIiwiY3JlYXRlVGFibGUiLCJhbHRlciIsImRlc2NyaWJlVGFibGUiLCJnZXRGb3JlaWduS2V5UmVmZXJlbmNlc0ZvclRhYmxlIiwidGFibGVJbmZvcyIsImNvbHVtbnMiLCJmb3JlaWduS2V5UmVmZXJlbmNlcyIsImNoYW5nZXMiLCJyZW1vdmVkQ29uc3RyYWludHMiLCJjb2x1bW5EZXNjIiwiY29sdW1uTmFtZSIsImFkZENvbHVtbiIsImN1cnJlbnRBdHRyaWJ1dGUiLCJyZW1vdmVDb2x1bW4iLCJkYXRhYmFzZSIsImNvbmZpZyIsImZvcmVpZ25LZXlSZWZlcmVuY2UiLCJjb25zdHJhaW50TmFtZSIsInRhYmxlQ2F0YWxvZyIsInRhYmxlU2NoZW1hIiwicmVmZXJlbmNlZFRhYmxlTmFtZSIsInJlZmVyZW5jZWRDb2x1bW5OYW1lIiwicmVmZXJlbmNlZFRhYmxlU2NoZW1hIiwicmVtb3ZlQ29uc3RyYWludCIsImNoYW5nZUNvbHVtbiIsImYiLCJzaG93SW5kZXgiLCJpdGVtMSIsIml0ZW0yIiwic29ydCIsImluZGV4MSIsImluZGV4MiIsImNvbmN1cnJlbnRseSIsImFkZEluZGV4IiwiYmVuY2htYXJrIiwiZHJvcFRhYmxlIiwiZHJvcFNjaGVtYSIsImFkZFNjaGVtYSIsIm92ZXJyaWRlIiwib3B0aW9uIiwic2NvcGVOYW1lIiwiZmxhdHRlbiIsImFwcGx5Iiwic2xpY2UiLCJTZXF1ZWxpemVTY29wZUVycm9yIiwiUXVlcnlFcnJvciIsIndhcm5PbkludmFsaWRPcHRpb25zIiwiaGFzSm9pbiIsImdyb3VwIiwic2VsZWN0T3B0aW9ucyIsInNlbGVjdCIsInJlc3VsdHMiLCJFbXB0eVJlc3VsdEVycm9yIiwiX2ZpbmRTZXBhcmF0ZSIsInZhbGlkQ29sdW1uTmFtZXMiLCJ1bnJlY29nbml6ZWRPcHRpb25zIiwidW5leHBlY3RlZE1vZGVsQXR0cmlidXRlcyIsIndhcm4iLCJvcmlnaW5hbCIsIm1lbW8iLCJsZW4iLCJwYXJhbSIsIkJ1ZmZlciIsImlzQnVmZmVyIiwidW5pcXVlU2luZ2xlQ29sdW1ucyIsImNoYWluIiwiYyIsImZpbmRBbGwiLCJhZ2dyZWdhdGVGdW5jdGlvbiIsInByZXZBdHRyaWJ1dGVzIiwiYXR0ck9wdGlvbnMiLCJhZ2dyZWdhdGVDb2x1bW4iLCJjb2wiLCJkaXN0aW5jdCIsImZuIiwidW5pb25CeSIsImEiLCJkYXRhVHlwZSIsIkZMT0FUIiwibWFwT3B0aW9uRmllbGROYW1lcyIsInJhd1NlbGVjdCIsImluY2x1ZGVJZ25vcmVBdHRyaWJ1dGVzIiwib2Zmc2V0Iiwib3JkZXIiLCJhZ2dyZWdhdGUiLCJjb3VudE9wdGlvbnMiLCJjb3VudCIsInJvd3MiLCJ2YWx1ZVNldHMiLCJ1bmtub3duRGVmYXVsdHMiLCJfY2xzIiwidCIsImludGVybmFsVHJhbnNhY3Rpb24iLCJleGNlcHRpb24iLCJVbmlxdWVDb25zdHJhaW50RXJyb3IiLCJjYXRjaCIsImVyciIsImZsYXR0ZW5lZFdoZXJlIiwiZmxhdHRlbk9iamVjdERlZXAiLCJmbGF0dGVuZWRXaGVyZUtleXMiLCJsYXN0Iiwid2hlcmVGaWVsZHMiLCJlcnJGaWVsZEtleXMiLCJlcnJGaWVsZHNXaGVyZUludGVyc2VjdHMiLCJpbnRlcnNlY3RzIiwidG9TdHJpbmciLCJmaW5hbGx5IiwiY29tbWl0IiwiaGFzUHJpbWFyeSIsInVwZGF0ZWREYXRhVmFsdWVzIiwiaW5zZXJ0VmFsdWVzIiwidXBkYXRlVmFsdWVzIiwidXBzZXJ0IiwiY3JlYXRlZCIsImZpbmRCeVBrIiwicmVjb3JkIiwicmVjb3JkcyIsInJlY3Vyc2l2ZUJ1bGtDcmVhdGUiLCJpbmRpdmlkdWFsSG9va3MiLCJpZ25vcmVEdXBsaWNhdGVzIiwicmVqZWN0IiwidXBkYXRlT25EdXBsaWNhdGUiLCJlcnJvcnMiLCJBZ2dyZWdhdGVFcnJvciIsInZhbGlkYXRlT3B0aW9ucyIsIkJ1bGtSZWNvcmRFcnJvciIsImluZGl2aWR1YWxPcHRpb25zIiwiYXNzb2NpYXRpb25JbnN0YW5jZXMiLCJhc3NvY2lhdGlvbkluc3RhbmNlSW5kZXhUb0luc3RhbmNlTWFwIiwiYXNzb2NpYXRpb25JbnN0YW5jZSIsIm91dCIsImZpZWxkTWFwcGVkQXR0cmlidXRlcyIsInVwc2VydEtleXMiLCJidWxrSW5zZXJ0IiwiZmluZCIsImFzc29jaWF0ZWQiLCJ0aHJvdWdoT3B0aW9ucyIsInRocm91Z2hJbnN0YW5jZXMiLCJ0cnVuY2F0ZSIsImRlc3Ryb3kiLCJjYXNjYWRlIiwicmVzdGFydElkZW50aXR5IiwiQlVMS0RFTEVURSIsIl9pbnN0YW5jZXMiLCJCVUxLVVBEQVRFIiwiYXR0clZhbHVlSGFzaCIsImJ1bGtVcGRhdGUiLCJidWxrRGVsZXRlIiwiUkFXIiwiX29wdGlvbnNNdXN0Q29udGFpbldoZXJlIiwidmFsdWVzVXNlIiwiY2hhbmdlZFZhbHVlcyIsImRpZmZlcmVudCIsImZvckluIiwidGhpc0NoYW5nZWRWYWx1ZXMiLCJoYXNUcmlnZ2VyIiwiYWZmZWN0ZWRSb3dzIiwiZXhjbHVkZSIsImVsZW0iLCJfZGVmYXVsdHNPcHRpb25zIiwiU3ltYm9sIiwiZm9yIiwiYWxpYXMiLCJ1cGRhdGVkQXRBdHRyaWJ1dGUiLCJwcm9taXNlIiwiZGVjcmVtZW50IiwiYXBwbHlUbyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsTUFBTSxHQUFHQyxPQUFPLENBQUMsUUFBRCxDQUF0Qjs7QUFDQSxNQUFNQyxDQUFDLEdBQUdELE9BQU8sQ0FBQyxRQUFELENBQWpCOztBQUNBLE1BQU1FLE1BQU0sR0FBR0YsT0FBTyxDQUFDLFFBQUQsQ0FBdEI7O0FBRUEsTUFBTUcsS0FBSyxHQUFHSCxPQUFPLENBQUMsU0FBRCxDQUFyQjs7QUFDQSxNQUFNO0FBQUVJLEVBQUFBO0FBQUYsSUFBYUosT0FBTyxDQUFDLGdCQUFELENBQTFCOztBQUNBLE1BQU1LLFNBQVMsR0FBR0wsT0FBTyxDQUFDLDJCQUFELENBQXpCOztBQUNBLE1BQU1NLGFBQWEsR0FBR04sT0FBTyxDQUFDLGdDQUFELENBQTdCOztBQUNBLE1BQU1PLGlCQUFpQixHQUFHUCxPQUFPLENBQUMsc0JBQUQsQ0FBakM7O0FBQ0EsTUFBTVEsVUFBVSxHQUFHUixPQUFPLENBQUMsZUFBRCxDQUExQjs7QUFDQSxNQUFNUyxlQUFlLEdBQUdULE9BQU8sQ0FBQyxVQUFELENBQS9COztBQUNBLE1BQU1VLE9BQU8sR0FBR1YsT0FBTyxDQUFDLFdB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OzJCQUNnQjBPLE0sRUFBUTFPLE8sRUFBUyxDQUFFLEMsQ0FBQzs7QUFFbEM7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OzhCQUNtQjBPLE0sRUFBUTFPLE8sRUFBUyxDQUFFLEMsQ0FBQzs7Ozs7OztBQUd2Q0MsTUFBTSxDQUFDQyxNQUFQLENBQWNULEtBQWQsRUFBcUJOLGlCQUFyQjtBQUNBRCxLQUFLLENBQUN5aUIsT0FBTixDQUFjbGlCLEtBQWQsRUFBcUIsSUFBckI7QUFFQW1pQixNQUFNLENBQUNDLE9BQVAsR0FBaUJwaUIsS0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgRG90dGllID0gcmVxdWlyZSgnZG90dGllJyk7XG5cbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuY29uc3QgeyBsb2dnZXIgfSA9IHJlcXVpcmUoJy4vdXRpbHMvbG9nZ2VyJyk7XG5jb25zdCBCZWxvbmdzVG8gPSByZXF1aXJlKCcuL2Fzc29jaWF0aW9ucy9iZWxvbmdzLXRvJyk7XG5jb25zdCBCZWxvbmdzVG9NYW55ID0gcmVxdWlyZSgnLi9hc3NvY2lhdGlvbnMvYmVsb25ncy10by1tYW55Jyk7XG5jb25zdCBJbnN0YW5jZVZhbGlkYXRvciA9IHJlcXVpcmUoJy4vaW5zdGFuY2UtdmFsaWRhdG9yJyk7XG5jb25zdCBRdWVyeVR5cGVzID0gcmVxdWlyZSgnLi9xdWVyeS10eXBlcycpO1xuY29uc3Qgc2VxdWVsaXplRXJyb3JzID0gcmVxdWlyZSgnLi9lcnJvcnMnKTtcbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKTtcbmNvbnN0IEFzc29jaWF0aW9uID0gcmVxdWlyZSgnLi9hc3NvY2lhdGlvbnMvYmFzZScpO1xuY29uc3QgSGFzTWFueSA9IHJlcXVpcmUoJy4vYXNzb2NpYXRpb25zL2hhcy1tYW55Jyk7XG5jb25zdCBEYXRhVHlwZXMgPSByZXF1aXJlKCcuL2RhdGEtdHlwZXMnKTtcbmNvbnN0IEhvb2tzID0gcmVxdWlyZSgnLi9ob29rcycpO1xuY29uc3QgYXNzb2NpYXRpb25zTWl4aW4gPSByZXF1aXJlKCcuL2Fzc29jaWF0aW9ucy9taXhpbicpO1xuY29uc3QgT3AgPSByZXF1aXJlKCcuL29wZXJhdG9ycycpO1xuY29uc3QgeyBub0RvdWJsZU5lc3RlZEdyb3VwIH0gPSByZXF1aXJlKCcuL3V0aWxzL2RlcHJlY2F0aW9ucycpO1xuXG5cbi8vIFRoaXMgbGlzdCB3aWxsIHF1aWNrbHkgYmVjb21lIGRhdGVkLCBidXQgZmFpbGluZyB0byBtYWludGFpbiB0aGlzIGxpc3QganVzdCBtZWFuc1xuLy8gd2Ugd29uJ3QgdGhyb3cgYSB3YXJuaW5nIHdoZW4gd2Ugc2hvdWxkLiBBdCBsZWFzdCBtb3N0IGNvbW1vbiBjYXNlcyB3aWxsIGZvcmV2ZXIgYmUgY292ZXJlZFxuLy8gc28gd2Ugc3RvcCB0aHJvd2luZyBlcnJvbmVvdXMgd2FybmluZ3Mgd2hlbiB3ZSBzaG91bGRuJ3QuXG5jb25zdCB2YWxpZFF1ZXJ5S2V5d29yZHMgPSBuZXcgU2V0KFsnd2hlcmUnLCAnYXR0cmlidXRlcycsICdwYXJhbm9pZCcsICdpbmNsdWRlJywgJ29yZGVyJywgJ2xpbWl0JywgJ29mZnNldCcsXG4gICd0cmFuc2FjdGlvbicsICdsb2NrJywgJ3JhdycsICdsb2dnaW5nJywgJ2JlbmNobWFyaycsICdoYXZpbmcnLCAnc2VhcmNoUGF0aCcsICdyZWplY3RPbkVtcHR5JywgJ3BsYWluJyxcbiAgJ3Njb3BlJywgJ2dyb3VwJywgJ3Rocm91Z2gnLCAnZGVmYXVsdHMnLCAnZGlzdGluY3QnLCAncHJpbWFyeScsICdleGNlcHRpb24nLCAndHlwZScsICdob29rcycsICdmb3JjZScsXG4gICduYW1lJ10pO1xuXG4vLyBMaXN0IG9mIGF0dHJpYnV0ZXMgdGhhdCBzaG91bGQgbm90IGJlIGltcGxpY2l0bHkgcGFzc2VkIGludG8gc3VicXVlcmllcy9pbmNsdWRlcy5cbmNvbnN0IG5vbkNhc2NhZGluZ09wdGlvbnMgPSBbJ2luY2x1ZGUnLCAnYXR0cmlidXRlcycsICdvcmlnaW5hbEF0dHJpYnV0ZXMnLCAnb3JkZXInLCAnd2hlcmUnLCAnbGltaXQnLCAnb2Zmc2V0JywgJ3BsYWluJywgJ2dyb3VwJywgJ2hhdmluZyddO1xuXG4vKipcbiAqIEEgTW9kZWwgcmVwcmVzZW50cyBhIHRhYmxlIGluIHRoZSBkYXRhYmFzZS4gSW5zdGFuY2VzIG9mIHRoaXMgY2xhc3MgcmVwcmVzZW50IGEgZGF0YWJhc2Ugcm93LlxuICpcbiAqIE1vZGVsIGluc3RhbmNlcyBvcGVyYXRlIHdpdGggdGhlIGNvbmNlcHQgb2YgYSBgZGF0YVZhbHVlc2AgcHJvcGVydHksIHdoaWNoIHN0b3JlcyB0aGUgYWN0dWFsIHZhbHVlcyByZXByZXNlbnRlZCBieSB0aGUgaW5zdGFuY2UuXG4gKiBCeSBkZWZhdWx0LCB0aGUgdmFsdWVzIGZyb20gZGF0YVZhbHVlcyBjYW4gYWxzbyBiZSBhY2Nlc3NlZCBkaXJlY3RseSBmcm9tIHRoZSBJbnN0YW5jZSwgdGhhdCBpczpcbiAqIGBgYGpzXG4gKiBpbnN0YW5jZS5maWVsZFxuICogLy8gaXMgdGhlIHNhbWUgYXNcbiAqIGluc3RhbmNlLmdldCgnZmllbGQnKVxuICogLy8gaXMgdGhlIHNhbWUgYXNcbiAqIGluc3RhbmNlLmdldERhdGFWYWx1ZSgnZmllbGQnKVxuICogYGBgXG4gKiBIb3dldmVyLCBpZiBnZXR0ZXJzIGFuZC9vciBzZXR0ZXJzIGFyZSBkZWZpbmVkIGZvciBgZmllbGRgIHRoZXkgd2lsbCBiZSBpbnZva2VkLCBpbnN0ZWFkIG9mIHJldHVybmluZyB0aGUgdmFsdWUgZnJvbSBgZGF0YVZhbHVlc2AuXG4gKiBBY2Nlc3NpbmcgcHJvcGVydGllcyBkaXJlY3RseSBvciB1c2luZyBgZ2V0YCBpcyBwcmVmZXJyZWQgZm9yIHJlZ3VsYXIgdXNlLCBgZ2V0RGF0YVZhbHVlYCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjdXN0b20gZ2V0dGVycy5cbiAqXG4gKiBAc2VlXG4gICAqIHtAbGluayBTZXF1ZWxpemUjZGVmaW5lfSBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBnZXR0ZXJzIGFuZCBzZXR0ZXJzXG4gKiBAbWl4ZXMgSG9va3NcbiAqL1xuY2xhc3MgTW9kZWwge1xuICBzdGF0aWMgZ2V0IFF1ZXJ5SW50ZXJmYWNlKCkge1xuICAgIHJldHVybiB0aGlzLnNlcXVlbGl6ZS5nZXRRdWVyeUludGVyZmFjZSgpO1xuICB9XG5cbiAgc3RhdGljIGdldCBRdWVyeUdlbmVyYXRvcigpIHtcbiAgICByZXR1cm4gdGhpcy5RdWVyeUludGVyZmFjZS5RdWVyeUdlbmVyYXRvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgc2VxdWVsaXplIGluc3RhbmNlXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIFNlcXVlbGl6ZX1cbiAgICpcbiAgICogQHByb3BlcnR5IHNlcXVlbGl6ZVxuICAgKlxuICAgKiBAcmV0dXJucyB7U2VxdWVsaXplfVxuICAgKi9cbiAgZ2V0IHNlcXVlbGl6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5zZXF1ZWxpemU7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGRzIGEgbmV3IG1vZGVsIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gIFt2YWx1ZXM9e31dIGFuIG9iamVjdCBvZiBrZXkgdmFsdWUgcGFpcnNcbiAgICogQHBhcmFtIHtPYmplY3R9ICBbb3B0aW9uc10gaW5zdGFuY2UgY29uc3RydWN0aW9uIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yYXc9ZmFsc2VdIElmIHNldCB0byB0cnVlLCB2YWx1ZXMgd2lsbCBpZ25vcmUgZmllbGQgYW5kIHZpcnR1YWwgc2V0dGVycy5cbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pc05ld1JlY29yZD10cnVlXSBJcyB0aGlzIGEgbmV3IHJlY29yZFxuICAgKiBAcGFyYW0ge0FycmF5fSAgIFtvcHRpb25zLmluY2x1ZGVdIGFuIGFycmF5IG9mIGluY2x1ZGUgb3B0aW9ucyAtIFVzZWQgdG8gYnVpbGQgcHJlZmV0Y2hlZC9pbmNsdWRlZCBtb2RlbCBpbnN0YW5jZXMuIFNlZSBgc2V0YFxuICAgKi9cbiAgY29uc3RydWN0b3IodmFsdWVzID0ge30sIG9wdGlvbnMgPSB7fSkge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGlzTmV3UmVjb3JkOiB0cnVlLFxuICAgICAgX3NjaGVtYTogdGhpcy5jb25zdHJ1Y3Rvci5fc2NoZW1hLFxuICAgICAgX3NjaGVtYURlbGltaXRlcjogdGhpcy5jb25zdHJ1Y3Rvci5fc2NoZW1hRGVsaW1pdGVyXG4gICAgfSwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSB7XG4gICAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXMubWFwKGF0dHJpYnV0ZSA9PiBBcnJheS5pc0FycmF5KGF0dHJpYnV0ZSkgPyBhdHRyaWJ1dGVbMV0gOiBhdHRyaWJ1dGUpO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5pbmNsdWRlVmFsaWRhdGVkKSB7XG4gICAgICB0aGlzLmNvbnN0cnVjdG9yLl9jb25mb3JtSW5jbHVkZXMob3B0aW9ucywgdGhpcy5jb25zdHJ1Y3Rvcik7XG4gICAgICBpZiAob3B0aW9ucy5pbmNsdWRlKSB7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IuX2V4cGFuZEluY2x1ZGVBbGwob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuY29uc3RydWN0b3IuX3ZhbGlkYXRlSW5jbHVkZWRFbGVtZW50cyhvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmRhdGFWYWx1ZXMgPSB7fTtcbiAgICB0aGlzLl9wcmV2aW91c0RhdGFWYWx1ZXMgPSB7fTtcbiAgICB0aGlzLl9jaGFuZ2VkID0ge307XG4gICAgdGhpcy5fbW9kZWxPcHRpb25zID0gdGhpcy5jb25zdHJ1Y3Rvci5vcHRpb25zO1xuICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoaXMgaW5zdGFuY2UgaGFzIG5vdCB5ZXQgYmVlbiBwZXJzaXN0ZWQgdG8gdGhlIGRhdGFiYXNlXG4gICAgICogQHByb3BlcnR5IGlzTmV3UmVjb3JkXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5pc05ld1JlY29yZCA9IG9wdGlvbnMuaXNOZXdSZWNvcmQ7XG5cbiAgICB0aGlzLl9pbml0VmFsdWVzKHZhbHVlcywgb3B0aW9ucyk7XG4gIH1cblxuICBfaW5pdFZhbHVlcyh2YWx1ZXMsIG9wdGlvbnMpIHtcbiAgICBsZXQgZGVmYXVsdHM7XG4gICAgbGV0IGtleTtcblxuICAgIHZhbHVlcyA9IHZhbHVlcyAmJiBfLmNsb25lKHZhbHVlcykgfHwge307XG5cbiAgICBpZiAob3B0aW9ucy5pc05ld1JlY29yZCkge1xuICAgICAgZGVmYXVsdHMgPSB7fTtcblxuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuX2hhc0RlZmF1bHRWYWx1ZXMpIHtcbiAgICAgICAgZGVmYXVsdHMgPSBfLm1hcFZhbHVlcyh0aGlzLmNvbnN0cnVjdG9yLl9kZWZhdWx0VmFsdWVzLCB2YWx1ZUZuID0+IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlRm4oKTtcbiAgICAgICAgICByZXR1cm4gdmFsdWUgJiYgdmFsdWUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QgPyB2YWx1ZSA6IF8uY2xvbmVEZWVwKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHNldCBpZCB0byBudWxsIGlmIG5vdCBwYXNzZWQgYXMgdmFsdWUsIGEgbmV3bHkgY3JlYXRlZCBkYW8gaGFzIG5vIGlkXG4gICAgICAvLyByZW1vdmluZyB0aGlzIGJyZWFrcyBidWxrQ3JlYXRlXG4gICAgICAvLyBkbyBhZnRlciBkZWZhdWx0IHZhbHVlcyBzaW5jZSBpdCBtaWdodCBoYXZlIFVVSUQgYXMgYSBkZWZhdWx0IHZhbHVlXG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5QXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5QXR0cmlidXRlcy5mb3JFYWNoKHByaW1hcnlLZXlBdHRyaWJ1dGUgPT4ge1xuICAgICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRlZmF1bHRzLCBwcmltYXJ5S2V5QXR0cmlidXRlKSkge1xuICAgICAgICAgICAgZGVmYXVsdHNbcHJpbWFyeUtleUF0dHJpYnV0ZV0gPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdCAmJiBkZWZhdWx0c1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdF0pIHtcbiAgICAgICAgdGhpcy5kYXRhVmFsdWVzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0XSA9IFV0aWxzLnRvRGVmYXVsdFZhbHVlKGRlZmF1bHRzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0XSwgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KTtcbiAgICAgICAgZGVsZXRlIGRlZmF1bHRzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0XTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0ICYmIGRlZmF1bHRzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0XSkge1xuICAgICAgICB0aGlzLmRhdGFWYWx1ZXNbdGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXRdID0gVXRpbHMudG9EZWZhdWx0VmFsdWUoZGVmYXVsdHNbdGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXRdLCB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QpO1xuICAgICAgICBkZWxldGUgZGVmYXVsdHNbdGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXRdO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQgJiYgZGVmYXVsdHNbdGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXRdKSB7XG4gICAgICAgIHRoaXMuZGF0YVZhbHVlc1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdF0gPSBVdGlscy50b0RlZmF1bHRWYWx1ZShkZWZhdWx0c1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdF0sIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCk7XG4gICAgICAgIGRlbGV0ZSBkZWZhdWx0c1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdF07XG4gICAgICB9XG5cbiAgICAgIGlmIChPYmplY3Qua2V5cyhkZWZhdWx0cykubGVuZ3RoKSB7XG4gICAgICAgIGZvciAoa2V5IGluIGRlZmF1bHRzKSB7XG4gICAgICAgICAgaWYgKHZhbHVlc1trZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGtleSwgVXRpbHMudG9EZWZhdWx0VmFsdWUoZGVmYXVsdHNba2V5XSwgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KSwgeyByYXc6IHRydWUgfSk7XG4gICAgICAgICAgICBkZWxldGUgdmFsdWVzW2tleV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5zZXQodmFsdWVzLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8vIHZhbGlkYXRlSW5jbHVkZWRFbGVtZW50cyBzaG91bGQgaGF2ZSBiZWVuIGNhbGxlZCBiZWZvcmUgdGhpcyBtZXRob2RcbiAgc3RhdGljIF9wYXJhbm9pZENsYXVzZShtb2RlbCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gQXBwbHkgb24gZWFjaCBpbmNsdWRlXG4gICAgLy8gVGhpcyBzaG91bGQgYmUgaGFuZGxlZCBiZWZvcmUgaGFuZGxpbmcgd2hlcmUgY29uZGl0aW9ucyBiZWNhdXNlIG9mIGxvZ2ljIHdpdGggcmV0dXJuc1xuICAgIC8vIG90aGVyd2lzZSB0aGlzIGNvZGUgd2lsbCBuZXZlciBydW4gb24gaW5jbHVkZXMgb2YgYSBhbHJlYWR5IGNvbmRpdGlvbmFibGUgd2hlcmVcbiAgICBpZiAob3B0aW9ucy5pbmNsdWRlKSB7XG4gICAgICBmb3IgKGNvbnN0IGluY2x1ZGUgb2Ygb3B0aW9ucy5pbmNsdWRlKSB7XG4gICAgICAgIHRoaXMuX3BhcmFub2lkQ2xhdXNlKGluY2x1ZGUubW9kZWwsIGluY2x1ZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGFwcGx5IHBhcmFub2lkIHdoZW4gZ3JvdXBlZExpbWl0IGlzIHVzZWRcbiAgICBpZiAoXy5nZXQob3B0aW9ucywgJ2dyb3VwZWRMaW1pdC5vbi5vcHRpb25zLnBhcmFub2lkJykpIHtcbiAgICAgIGNvbnN0IHRocm91Z2hNb2RlbCA9IF8uZ2V0KG9wdGlvbnMsICdncm91cGVkTGltaXQub24udGhyb3VnaC5tb2RlbCcpO1xuICAgICAgaWYgKHRocm91Z2hNb2RlbCkge1xuICAgICAgICBvcHRpb25zLmdyb3VwZWRMaW1pdC50aHJvdWdoID0gdGhpcy5fcGFyYW5vaWRDbGF1c2UodGhyb3VnaE1vZGVsLCBvcHRpb25zLmdyb3VwZWRMaW1pdC50aHJvdWdoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW1vZGVsLm9wdGlvbnMudGltZXN0YW1wcyB8fCAhbW9kZWwub3B0aW9ucy5wYXJhbm9pZCB8fCBvcHRpb25zLnBhcmFub2lkID09PSBmYWxzZSkge1xuICAgICAgLy8gVGhpcyBtb2RlbCBpcyBub3QgcGFyYW5vaWQsIG5vdGhpbmcgdG8gZG8gaGVyZTtcbiAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH1cblxuICAgIGNvbnN0IGRlbGV0ZWRBdENvbCA9IG1vZGVsLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdDtcbiAgICBjb25zdCBkZWxldGVkQXRBdHRyaWJ1dGUgPSBtb2RlbC5yYXdBdHRyaWJ1dGVzW2RlbGV0ZWRBdENvbF07XG4gICAgY29uc3QgZGVsZXRlZEF0T2JqZWN0ID0ge307XG5cbiAgICBsZXQgZGVsZXRlZEF0RGVmYXVsdFZhbHVlID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRlbGV0ZWRBdEF0dHJpYnV0ZSwgJ2RlZmF1bHRWYWx1ZScpID8gZGVsZXRlZEF0QXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA6IG51bGw7XG5cbiAgICBkZWxldGVkQXREZWZhdWx0VmFsdWUgPSBkZWxldGVkQXREZWZhdWx0VmFsdWUgfHwge1xuICAgICAgW09wLmVxXTogbnVsbFxuICAgIH07XG5cbiAgICBkZWxldGVkQXRPYmplY3RbZGVsZXRlZEF0QXR0cmlidXRlLmZpZWxkIHx8IGRlbGV0ZWRBdENvbF0gPSBkZWxldGVkQXREZWZhdWx0VmFsdWU7XG5cbiAgICBpZiAoVXRpbHMuaXNXaGVyZUVtcHR5KG9wdGlvbnMud2hlcmUpKSB7XG4gICAgICBvcHRpb25zLndoZXJlID0gZGVsZXRlZEF0T2JqZWN0O1xuICAgIH0gZWxzZSB7XG4gICAgICBvcHRpb25zLndoZXJlID0geyBbT3AuYW5kXTogW2RlbGV0ZWRBdE9iamVjdCwgb3B0aW9ucy53aGVyZV0gfTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxuXG4gIHN0YXRpYyBfYWRkRGVmYXVsdEF0dHJpYnV0ZXMoKSB7XG4gICAgY29uc3QgdGFpbCA9IHt9O1xuICAgIGxldCBoZWFkID0ge307XG5cbiAgICAvLyBBZGQgaWQgaWYgbm8gcHJpbWFyeSBrZXkgd2FzIG1hbnVhbGx5IGFkZGVkIHRvIGRlZmluaXRpb25cbiAgICAvLyBDYW4ndCB1c2UgdGhpcy5wcmltYXJ5S2V5cyBoZXJlLCBzaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBiZWZvcmUgUEtzIGFyZSBpZGVudGlmaWVkXG4gICAgaWYgKCFfLnNvbWUodGhpcy5yYXdBdHRyaWJ1dGVzLCAncHJpbWFyeUtleScpKSB7XG4gICAgICBpZiAoJ2lkJyBpbiB0aGlzLnJhd0F0dHJpYnV0ZXMpIHtcbiAgICAgICAgLy8gU29tZXRoaW5nIGlzIGZpc2h5IGhlcmUhXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQSBjb2x1bW4gY2FsbGVkICdpZCcgd2FzIGFkZGVkIHRvIHRoZSBhdHRyaWJ1dGVzIG9mICcke3RoaXMudGFibGVOYW1lfScgYnV0IG5vdCBtYXJrZWQgd2l0aCAncHJpbWFyeUtleTogdHJ1ZSdgKTtcbiAgICAgIH1cblxuICAgICAgaGVhZCA9IHtcbiAgICAgICAgaWQ6IHtcbiAgICAgICAgICB0eXBlOiBuZXcgRGF0YVR5cGVzLklOVEVHRVIoKSxcbiAgICAgICAgICBhbGxvd051bGw6IGZhbHNlLFxuICAgICAgICAgIHByaW1hcnlLZXk6IHRydWUsXG4gICAgICAgICAgYXV0b0luY3JlbWVudDogdHJ1ZSxcbiAgICAgICAgICBfYXV0b0dlbmVyYXRlZDogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdCkge1xuICAgICAgdGFpbFt0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdF0gPSB7XG4gICAgICAgIHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuICAgICAgICBhbGxvd051bGw6IGZhbHNlLFxuICAgICAgICBfYXV0b0dlbmVyYXRlZDogdHJ1ZVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXQpIHtcbiAgICAgIHRhaWxbdGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXRdID0ge1xuICAgICAgICB0eXBlOiBEYXRhVHlwZXMuREFURSxcbiAgICAgICAgYWxsb3dOdWxsOiBmYWxzZSxcbiAgICAgICAgX2F1dG9HZW5lcmF0ZWQ6IHRydWVcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0KSB7XG4gICAgICB0YWlsW3RoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0XSA9IHtcbiAgICAgICAgdHlwZTogRGF0YVR5cGVzLkRBVEUsXG4gICAgICAgIF9hdXRvR2VuZXJhdGVkOiB0cnVlXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl92ZXJzaW9uQXR0cmlidXRlKSB7XG4gICAgICB0YWlsW3RoaXMuX3ZlcnNpb25BdHRyaWJ1dGVdID0ge1xuICAgICAgICB0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcbiAgICAgICAgYWxsb3dOdWxsOiBmYWxzZSxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiAwLFxuICAgICAgICBfYXV0b0dlbmVyYXRlZDogdHJ1ZVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBleGlzdGluZ0F0dHJpYnV0ZXMgPSBfLmNsb25lKHRoaXMucmF3QXR0cmlidXRlcyk7XG4gICAgdGhpcy5yYXdBdHRyaWJ1dGVzID0ge307XG5cbiAgICBfLmVhY2goaGVhZCwgKHZhbHVlLCBhdHRyKSA9PiB7XG4gICAgICB0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0gPSB2YWx1ZTtcbiAgICB9KTtcblxuICAgIF8uZWFjaChleGlzdGluZ0F0dHJpYnV0ZXMsICh2YWx1ZSwgYXR0cikgPT4ge1xuICAgICAgdGhpcy5yYXdBdHRyaWJ1dGVzW2F0dHJdID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICBfLmVhY2godGFpbCwgKHZhbHVlLCBhdHRyKSA9PiB7XG4gICAgICBpZiAodGhpcy5yYXdBdHRyaWJ1dGVzW2F0dHJdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5yYXdBdHRyaWJ1dGVzW2F0dHJdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoIU9iamVjdC5rZXlzKHRoaXMucHJpbWFyeUtleXMpLmxlbmd0aCkge1xuICAgICAgdGhpcy5wcmltYXJ5S2V5cy5pZCA9IHRoaXMucmF3QXR0cmlidXRlcy5pZDtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgX2ZpbmRBdXRvSW5jcmVtZW50QXR0cmlidXRlKCkge1xuICAgIHRoaXMuYXV0b0luY3JlbWVudEF0dHJpYnV0ZSA9IG51bGw7XG5cbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gdGhpcy5yYXdBdHRyaWJ1dGVzKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMucmF3QXR0cmlidXRlcywgbmFtZSkpIHtcbiAgICAgICAgY29uc3QgZGVmaW5pdGlvbiA9IHRoaXMucmF3QXR0cmlidXRlc1tuYW1lXTtcbiAgICAgICAgaWYgKGRlZmluaXRpb24gJiYgZGVmaW5pdGlvbi5hdXRvSW5jcmVtZW50KSB7XG4gICAgICAgICAgaWYgKHRoaXMuYXV0b0luY3JlbWVudEF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEluc3RhbmNlIGRlZmluaXRpb24uIE9ubHkgb25lIGF1dG9pbmNyZW1lbnQgZmllbGQgYWxsb3dlZC4nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5hdXRvSW5jcmVtZW50QXR0cmlidXRlID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBfY29uZm9ybUluY2x1ZGVzKG9wdGlvbnMsIHNlbGYpIHtcbiAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZSkgcmV0dXJuO1xuXG4gICAgLy8gaWYgaW5jbHVkZSBpcyBub3QgYW4gYXJyYXksIHdyYXAgaW4gYW4gYXJyYXlcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkob3B0aW9ucy5pbmNsdWRlKSkge1xuICAgICAgb3B0aW9ucy5pbmNsdWRlID0gW29wdGlvbnMuaW5jbHVkZV07XG4gICAgfSBlbHNlIGlmICghb3B0aW9ucy5pbmNsdWRlLmxlbmd0aCkge1xuICAgICAgZGVsZXRlIG9wdGlvbnMuaW5jbHVkZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBjb252ZXJ0IGFsbCBpbmNsdWRlZCBlbGVtZW50cyB0byB7IG1vZGVsOiBNb2RlbCB9IGZvcm1cbiAgICBvcHRpb25zLmluY2x1ZGUgPSBvcHRpb25zLmluY2x1ZGUubWFwKGluY2x1ZGUgPT4gdGhpcy5fY29uZm9ybUluY2x1ZGUoaW5jbHVkZSwgc2VsZikpO1xuICB9XG5cbiAgc3RhdGljIF90cmFuc2Zvcm1TdHJpbmdBc3NvY2lhdGlvbihpbmNsdWRlLCBzZWxmKSB7XG4gICAgaWYgKHNlbGYgJiYgdHlwZW9mIGluY2x1ZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzZWxmLmFzc29jaWF0aW9ucywgaW5jbHVkZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NvY2lhdGlvbiB3aXRoIGFsaWFzIFwiJHtpbmNsdWRlfVwiIGRvZXMgbm90IGV4aXN0IG9uICR7c2VsZi5uYW1lfWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNlbGYuYXNzb2NpYXRpb25zW2luY2x1ZGVdO1xuICAgIH1cbiAgICByZXR1cm4gaW5jbHVkZTtcbiAgfVxuXG4gIHN0YXRpYyBfY29uZm9ybUluY2x1ZGUoaW5jbHVkZSwgc2VsZikge1xuICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICBsZXQgbW9kZWw7XG5cbiAgICAgIGlmIChpbmNsdWRlLl9wc2V1ZG8pIHJldHVybiBpbmNsdWRlO1xuXG4gICAgICBpbmNsdWRlID0gdGhpcy5fdHJhbnNmb3JtU3RyaW5nQXNzb2NpYXRpb24oaW5jbHVkZSwgc2VsZik7XG5cbiAgICAgIGlmIChpbmNsdWRlIGluc3RhbmNlb2YgQXNzb2NpYXRpb24pIHtcbiAgICAgICAgaWYgKHNlbGYgJiYgaW5jbHVkZS50YXJnZXQubmFtZSA9PT0gc2VsZi5uYW1lKSB7XG4gICAgICAgICAgbW9kZWwgPSBpbmNsdWRlLnNvdXJjZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtb2RlbCA9IGluY2x1ZGUudGFyZ2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgbW9kZWwsIGFzc29jaWF0aW9uOiBpbmNsdWRlLCBhczogaW5jbHVkZS5hcyB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5jbHVkZS5wcm90b3R5cGUgJiYgaW5jbHVkZS5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCkge1xuICAgICAgICByZXR1cm4geyBtb2RlbDogaW5jbHVkZSB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGluY2x1ZGUpKSB7XG4gICAgICAgIGlmIChpbmNsdWRlLmFzc29jaWF0aW9uKSB7XG4gICAgICAgICAgaW5jbHVkZS5hc3NvY2lhdGlvbiA9IHRoaXMuX3RyYW5zZm9ybVN0cmluZ0Fzc29jaWF0aW9uKGluY2x1ZGUuYXNzb2NpYXRpb24sIHNlbGYpO1xuXG4gICAgICAgICAgaWYgKHNlbGYgJiYgaW5jbHVkZS5hc3NvY2lhdGlvbi50YXJnZXQubmFtZSA9PT0gc2VsZi5uYW1lKSB7XG4gICAgICAgICAgICBtb2RlbCA9IGluY2x1ZGUuYXNzb2NpYXRpb24uc291cmNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2RlbCA9IGluY2x1ZGUuYXNzb2NpYXRpb24udGFyZ2V0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaW5jbHVkZS5tb2RlbCkgaW5jbHVkZS5tb2RlbCA9IG1vZGVsO1xuICAgICAgICAgIGlmICghaW5jbHVkZS5hcykgaW5jbHVkZS5hcyA9IGluY2x1ZGUuYXNzb2NpYXRpb24uYXM7XG5cbiAgICAgICAgICB0aGlzLl9jb25mb3JtSW5jbHVkZXMoaW5jbHVkZSwgbW9kZWwpO1xuICAgICAgICAgIHJldHVybiBpbmNsdWRlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluY2x1ZGUubW9kZWwpIHtcbiAgICAgICAgICB0aGlzLl9jb25mb3JtSW5jbHVkZXMoaW5jbHVkZSwgaW5jbHVkZS5tb2RlbCk7XG4gICAgICAgICAgcmV0dXJuIGluY2x1ZGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5jbHVkZS5hbGwpIHtcbiAgICAgICAgICB0aGlzLl9jb25mb3JtSW5jbHVkZXMoaW5jbHVkZSk7XG4gICAgICAgICAgcmV0dXJuIGluY2x1ZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY2x1ZGUgdW5leHBlY3RlZC4gRWxlbWVudCBoYXMgdG8gYmUgZWl0aGVyIGEgTW9kZWwsIGFuIEFzc29jaWF0aW9uIG9yIGFuIG9iamVjdC4nKTtcbiAgfVxuXG4gIHN0YXRpYyBfZXhwYW5kSW5jbHVkZUFsbEVsZW1lbnQoaW5jbHVkZXMsIGluY2x1ZGUpIHtcbiAgICAvLyBjaGVjayAnYWxsJyBhdHRyaWJ1dGUgcHJvdmlkZWQgaXMgdmFsaWRcbiAgICBsZXQgYWxsID0gaW5jbHVkZS5hbGw7XG4gICAgZGVsZXRlIGluY2x1ZGUuYWxsO1xuXG4gICAgaWYgKGFsbCAhPT0gdHJ1ZSkge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFsbCkpIHtcbiAgICAgICAgYWxsID0gW2FsbF07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZhbGlkVHlwZXMgPSB7XG4gICAgICAgIEJlbG9uZ3NUbzogdHJ1ZSxcbiAgICAgICAgSGFzT25lOiB0cnVlLFxuICAgICAgICBIYXNNYW55OiB0cnVlLFxuICAgICAgICBPbmU6IFsnQmVsb25nc1RvJywgJ0hhc09uZSddLFxuICAgICAgICBIYXM6IFsnSGFzT25lJywgJ0hhc01hbnknXSxcbiAgICAgICAgTWFueTogWydIYXNNYW55J11cbiAgICAgIH07XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBhbGxbaV07XG4gICAgICAgIGlmICh0eXBlID09PSAnQWxsJykge1xuICAgICAgICAgIGFsbCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0eXBlcyA9IHZhbGlkVHlwZXNbdHlwZV07XG4gICAgICAgIGlmICghdHlwZXMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLkVhZ2VyTG9hZGluZ0Vycm9yKGBpbmNsdWRlIGFsbCAnJHt0eXBlfScgaXMgbm90IHZhbGlkIC0gbXVzdCBiZSBCZWxvbmdzVG8sIEhhc09uZSwgSGFzTWFueSwgT25lLCBIYXMsIE1hbnkgb3IgQWxsYCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZXMgIT09IHRydWUpIHtcbiAgICAgICAgICAvLyByZXBsYWNlIHR5cGUgcGxhY2Vob2xkZXIgZS5nLiAnT25lJyB3aXRoIGl0cyBjb25zdGl0dWVudCB0eXBlcyBlLmcuICdIYXNPbmUnLCAnQmVsb25nc1RvJ1xuICAgICAgICAgIGFsbC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgaS0tO1xuICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdHlwZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmICghYWxsLmluY2x1ZGVzKHR5cGVzW2pdKSkge1xuICAgICAgICAgICAgICBhbGwudW5zaGlmdCh0eXBlc1tqXSk7XG4gICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhZGQgYWxsIGFzc29jaWF0aW9ucyBvZiB0eXBlcyBzcGVjaWZpZWQgdG8gaW5jbHVkZXNcbiAgICBjb25zdCBuZXN0ZWQgPSBpbmNsdWRlLm5lc3RlZDtcbiAgICBpZiAobmVzdGVkKSB7XG4gICAgICBkZWxldGUgaW5jbHVkZS5uZXN0ZWQ7XG5cbiAgICAgIGlmICghaW5jbHVkZS5pbmNsdWRlKSB7XG4gICAgICAgIGluY2x1ZGUuaW5jbHVkZSA9IFtdO1xuICAgICAgfSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShpbmNsdWRlLmluY2x1ZGUpKSB7XG4gICAgICAgIGluY2x1ZGUuaW5jbHVkZSA9IFtpbmNsdWRlLmluY2x1ZGVdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHVzZWQgPSBbXTtcbiAgICAoZnVuY3Rpb24gYWRkQWxsSW5jbHVkZXMocGFyZW50LCBpbmNsdWRlcykge1xuICAgICAgXy5mb3JFYWNoKHBhcmVudC5hc3NvY2lhdGlvbnMsIGFzc29jaWF0aW9uID0+IHtcbiAgICAgICAgaWYgKGFsbCAhPT0gdHJ1ZSAmJiAhYWxsLmluY2x1ZGVzKGFzc29jaWF0aW9uLmFzc29jaWF0aW9uVHlwZSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjaGVjayBpZiBtb2RlbCBhbHJlYWR5IGluY2x1ZGVkLCBhbmQgc2tpcCBpZiBzb1xuICAgICAgICBjb25zdCBtb2RlbCA9IGFzc29jaWF0aW9uLnRhcmdldDtcbiAgICAgICAgY29uc3QgYXMgPSBhc3NvY2lhdGlvbi5vcHRpb25zLmFzO1xuXG4gICAgICAgIGNvbnN0IHByZWRpY2F0ZSA9IHsgbW9kZWwgfTtcbiAgICAgICAgaWYgKGFzKSB7XG4gICAgICAgICAgLy8gV2Ugb25seSBhZGQgJ2FzJyB0byB0aGUgcHJlZGljYXRlIGlmIGl0IGFjdHVhbGx5IGV4aXN0c1xuICAgICAgICAgIHByZWRpY2F0ZS5hcyA9IGFzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8uc29tZShpbmNsdWRlcywgcHJlZGljYXRlKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNraXAgaWYgcmVjdXJzaW5nIG92ZXIgYSBtb2RlbCBhbHJlYWR5IG5lc3RlZFxuICAgICAgICBpZiAobmVzdGVkICYmIHVzZWQuaW5jbHVkZXMobW9kZWwpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHVzZWQucHVzaChwYXJlbnQpO1xuXG4gICAgICAgIC8vIGluY2x1ZGUgdGhpcyBtb2RlbFxuICAgICAgICBjb25zdCB0aGlzSW5jbHVkZSA9IFV0aWxzLmNsb25lRGVlcChpbmNsdWRlKTtcbiAgICAgICAgdGhpc0luY2x1ZGUubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgaWYgKGFzKSB7XG4gICAgICAgICAgdGhpc0luY2x1ZGUuYXMgPSBhcztcbiAgICAgICAgfVxuICAgICAgICBpbmNsdWRlcy5wdXNoKHRoaXNJbmNsdWRlKTtcblxuICAgICAgICAvLyBydW4gcmVjdXJzaXZlbHkgaWYgbmVzdGVkXG4gICAgICAgIGlmIChuZXN0ZWQpIHtcbiAgICAgICAgICBhZGRBbGxJbmNsdWRlcyhtb2RlbCwgdGhpc0luY2x1ZGUuaW5jbHVkZSk7XG4gICAgICAgICAgaWYgKHRoaXNJbmNsdWRlLmluY2x1ZGUubGVuZ3RoID09PSAwKSBkZWxldGUgdGhpc0luY2x1ZGUuaW5jbHVkZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB1c2VkLnBvcCgpO1xuICAgIH0pKHRoaXMsIGluY2x1ZGVzKTtcbiAgfVxuXG4gIHN0YXRpYyBfdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzKG9wdGlvbnMsIHRhYmxlTmFtZXMpIHtcbiAgICBpZiAoIW9wdGlvbnMubW9kZWwpIG9wdGlvbnMubW9kZWwgPSB0aGlzO1xuXG4gICAgdGFibGVOYW1lcyA9IHRhYmxlTmFtZXMgfHwge307XG4gICAgb3B0aW9ucy5pbmNsdWRlTmFtZXMgPSBbXTtcbiAgICBvcHRpb25zLmluY2x1ZGVNYXAgPSB7fTtcblxuICAgIC8qIExlZ2FjeSAqL1xuICAgIG9wdGlvbnMuaGFzU2luZ2xlQXNzb2NpYXRpb24gPSBmYWxzZTtcbiAgICBvcHRpb25zLmhhc011bHRpQXNzb2NpYXRpb24gPSBmYWxzZTtcblxuICAgIGlmICghb3B0aW9ucy5wYXJlbnQpIHtcbiAgICAgIG9wdGlvbnMudG9wTW9kZWwgPSBvcHRpb25zLm1vZGVsO1xuICAgICAgb3B0aW9ucy50b3BMaW1pdCA9IG9wdGlvbnMubGltaXQ7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5pbmNsdWRlID0gb3B0aW9ucy5pbmNsdWRlLm1hcChpbmNsdWRlID0+IHtcbiAgICAgIGluY2x1ZGUgPSB0aGlzLl9jb25mb3JtSW5jbHVkZShpbmNsdWRlKTtcbiAgICAgIGluY2x1ZGUucGFyZW50ID0gb3B0aW9ucztcbiAgICAgIGluY2x1ZGUudG9wTGltaXQgPSBvcHRpb25zLnRvcExpbWl0O1xuXG4gICAgICB0aGlzLl92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudC5jYWxsKG9wdGlvbnMubW9kZWwsIGluY2x1ZGUsIHRhYmxlTmFtZXMsIG9wdGlvbnMpO1xuXG4gICAgICBpZiAoaW5jbHVkZS5kdXBsaWNhdGluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGluY2x1ZGUuZHVwbGljYXRpbmcgPSBpbmNsdWRlLmFzc29jaWF0aW9uLmlzTXVsdGlBc3NvY2lhdGlvbjtcbiAgICAgIH1cblxuICAgICAgaW5jbHVkZS5oYXNEdXBsaWNhdGluZyA9IGluY2x1ZGUuaGFzRHVwbGljYXRpbmcgfHwgaW5jbHVkZS5kdXBsaWNhdGluZztcbiAgICAgIGluY2x1ZGUuaGFzUmVxdWlyZWQgPSBpbmNsdWRlLmhhc1JlcXVpcmVkIHx8IGluY2x1ZGUucmVxdWlyZWQ7XG5cbiAgICAgIG9wdGlvbnMuaGFzRHVwbGljYXRpbmcgPSBvcHRpb25zLmhhc0R1cGxpY2F0aW5nIHx8IGluY2x1ZGUuaGFzRHVwbGljYXRpbmc7XG4gICAgICBvcHRpb25zLmhhc1JlcXVpcmVkID0gb3B0aW9ucy5oYXNSZXF1aXJlZCB8fCBpbmNsdWRlLnJlcXVpcmVkO1xuXG4gICAgICBvcHRpb25zLmhhc1doZXJlID0gb3B0aW9ucy5oYXNXaGVyZSB8fCBpbmNsdWRlLmhhc1doZXJlIHx8ICEhaW5jbHVkZS53aGVyZTtcbiAgICAgIHJldHVybiBpbmNsdWRlO1xuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBpbmNsdWRlIG9mIG9wdGlvbnMuaW5jbHVkZSkge1xuICAgICAgaW5jbHVkZS5oYXNQYXJlbnRXaGVyZSA9IG9wdGlvbnMuaGFzUGFyZW50V2hlcmUgfHwgISFvcHRpb25zLndoZXJlO1xuICAgICAgaW5jbHVkZS5oYXNQYXJlbnRSZXF1aXJlZCA9IG9wdGlvbnMuaGFzUGFyZW50UmVxdWlyZWQgfHwgISFvcHRpb25zLnJlcXVpcmVkO1xuXG4gICAgICBpZiAoaW5jbHVkZS5zdWJRdWVyeSAhPT0gZmFsc2UgJiYgb3B0aW9ucy5oYXNEdXBsaWNhdGluZyAmJiBvcHRpb25zLnRvcExpbWl0KSB7XG4gICAgICAgIGlmIChpbmNsdWRlLmR1cGxpY2F0aW5nKSB7XG4gICAgICAgICAgaW5jbHVkZS5zdWJRdWVyeSA9IGZhbHNlO1xuICAgICAgICAgIGluY2x1ZGUuc3ViUXVlcnlGaWx0ZXIgPSBpbmNsdWRlLmhhc1JlcXVpcmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluY2x1ZGUuc3ViUXVlcnkgPSBpbmNsdWRlLmhhc1JlcXVpcmVkO1xuICAgICAgICAgIGluY2x1ZGUuc3ViUXVlcnlGaWx0ZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5jbHVkZS5zdWJRdWVyeSA9IGluY2x1ZGUuc3ViUXVlcnkgfHwgZmFsc2U7XG4gICAgICAgIGlmIChpbmNsdWRlLmR1cGxpY2F0aW5nKSB7XG4gICAgICAgICAgaW5jbHVkZS5zdWJRdWVyeUZpbHRlciA9IGluY2x1ZGUuc3ViUXVlcnk7XG4gICAgICAgICAgaW5jbHVkZS5zdWJRdWVyeSA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluY2x1ZGUuc3ViUXVlcnlGaWx0ZXIgPSBmYWxzZTtcbiAgICAgICAgICBpbmNsdWRlLnN1YlF1ZXJ5ID0gaW5jbHVkZS5zdWJRdWVyeSB8fCBpbmNsdWRlLmhhc1BhcmVudFJlcXVpcmVkICYmIGluY2x1ZGUuaGFzUmVxdWlyZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgb3B0aW9ucy5pbmNsdWRlTWFwW2luY2x1ZGUuYXNdID0gaW5jbHVkZTtcbiAgICAgIG9wdGlvbnMuaW5jbHVkZU5hbWVzLnB1c2goaW5jbHVkZS5hcyk7XG5cbiAgICAgIC8vIFNldCB0b3AgbGV2ZWwgb3B0aW9uc1xuICAgICAgaWYgKG9wdGlvbnMudG9wTW9kZWwgPT09IG9wdGlvbnMubW9kZWwgJiYgb3B0aW9ucy5zdWJRdWVyeSA9PT0gdW5kZWZpbmVkICYmIG9wdGlvbnMudG9wTGltaXQpIHtcbiAgICAgICAgaWYgKGluY2x1ZGUuc3ViUXVlcnkpIHtcbiAgICAgICAgICBvcHRpb25zLnN1YlF1ZXJ5ID0gaW5jbHVkZS5zdWJRdWVyeTtcbiAgICAgICAgfSBlbHNlIGlmIChpbmNsdWRlLmhhc0R1cGxpY2F0aW5nKSB7XG4gICAgICAgICAgb3B0aW9ucy5zdWJRdWVyeSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLyogTGVnYWN5ICovXG4gICAgICBvcHRpb25zLmhhc0luY2x1ZGVXaGVyZSA9IG9wdGlvbnMuaGFzSW5jbHVkZVdoZXJlIHx8IGluY2x1ZGUuaGFzSW5jbHVkZVdoZXJlIHx8ICEhaW5jbHVkZS53aGVyZTtcbiAgICAgIG9wdGlvbnMuaGFzSW5jbHVkZVJlcXVpcmVkID0gb3B0aW9ucy5oYXNJbmNsdWRlUmVxdWlyZWQgfHwgaW5jbHVkZS5oYXNJbmNsdWRlUmVxdWlyZWQgfHwgISFpbmNsdWRlLnJlcXVpcmVkO1xuXG4gICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbi5pc011bHRpQXNzb2NpYXRpb24gfHwgaW5jbHVkZS5oYXNNdWx0aUFzc29jaWF0aW9uKSB7XG4gICAgICAgIG9wdGlvbnMuaGFzTXVsdGlBc3NvY2lhdGlvbiA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbi5pc1NpbmdsZUFzc29jaWF0aW9uIHx8IGluY2x1ZGUuaGFzU2luZ2xlQXNzb2NpYXRpb24pIHtcbiAgICAgICAgb3B0aW9ucy5oYXNTaW5nbGVBc3NvY2lhdGlvbiA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMudG9wTW9kZWwgPT09IG9wdGlvbnMubW9kZWwgJiYgb3B0aW9ucy5zdWJRdWVyeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBvcHRpb25zLnN1YlF1ZXJ5ID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zO1xuICB9XG5cbiAgc3RhdGljIF92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudChpbmNsdWRlLCB0YWJsZU5hbWVzLCBvcHRpb25zKSB7XG4gICAgdGFibGVOYW1lc1tpbmNsdWRlLm1vZGVsLmdldFRhYmxlTmFtZSgpXSA9IHRydWU7XG5cbiAgICBpZiAoaW5jbHVkZS5hdHRyaWJ1dGVzICYmICFvcHRpb25zLnJhdykge1xuICAgICAgaW5jbHVkZS5tb2RlbC5fZXhwYW5kQXR0cmlidXRlcyhpbmNsdWRlKTtcblxuICAgICAgaW5jbHVkZS5vcmlnaW5hbEF0dHJpYnV0ZXMgPSB0aGlzLl9pbmplY3REZXBlbmRlbnRWaXJ0dWFsQXR0cmlidXRlcyhpbmNsdWRlLmF0dHJpYnV0ZXMpO1xuXG4gICAgICBpbmNsdWRlID0gVXRpbHMubWFwRmluZGVyT3B0aW9ucyhpbmNsdWRlLCBpbmNsdWRlLm1vZGVsKTtcblxuICAgICAgaWYgKGluY2x1ZGUuYXR0cmlidXRlcy5sZW5ndGgpIHtcbiAgICAgICAgXy5lYWNoKGluY2x1ZGUubW9kZWwucHJpbWFyeUtleXMsIChhdHRyLCBrZXkpID0+IHtcbiAgICAgICAgICAvLyBJbmNsdWRlIHRoZSBwcmltYXJ5IGtleSBpZiBpdCdzIG5vdCBhbHJlYWR5IGluY2x1ZGVkIC0gdGFrZSBpbnRvIGFjY291bnQgdGhhdCB0aGUgcGsgbWlnaHQgYmUgYWxpYXNlZCAoZHVlIHRvIGEgLmZpZWxkIHByb3ApXG4gICAgICAgICAgaWYgKCFpbmNsdWRlLmF0dHJpYnV0ZXMuc29tZShpbmNsdWRlQXR0ciA9PiB7XG4gICAgICAgICAgICBpZiAoYXR0ci5maWVsZCAhPT0ga2V5KSB7XG4gICAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGluY2x1ZGVBdHRyKSAmJiBpbmNsdWRlQXR0clswXSA9PT0gYXR0ci5maWVsZCAmJiBpbmNsdWRlQXR0clsxXSA9PT0ga2V5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluY2x1ZGVBdHRyID09PSBrZXk7XG4gICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgIGluY2x1ZGUuYXR0cmlidXRlcy51bnNoaWZ0KGtleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaW5jbHVkZSA9IFV0aWxzLm1hcEZpbmRlck9wdGlvbnMoaW5jbHVkZSwgaW5jbHVkZS5tb2RlbCk7XG4gICAgfVxuXG4gICAgLy8gcHNldWRvIGluY2x1ZGUganVzdCBuZWVkZWQgdGhlIGF0dHJpYnV0ZSBsb2dpYywgcmV0dXJuXG4gICAgaWYgKGluY2x1ZGUuX3BzZXVkbykge1xuICAgICAgaW5jbHVkZS5hdHRyaWJ1dGVzID0gT2JqZWN0LmtleXMoaW5jbHVkZS5tb2RlbC50YWJsZUF0dHJpYnV0ZXMpO1xuICAgICAgcmV0dXJuIFV0aWxzLm1hcEZpbmRlck9wdGlvbnMoaW5jbHVkZSwgaW5jbHVkZS5tb2RlbCk7XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgaWYgdGhlIGN1cnJlbnQgTW9kZWwgaXMgYWN0dWFsbHkgYXNzb2NpYXRlZCB3aXRoIHRoZSBwYXNzZWQgTW9kZWwgLSBvciBpdCdzIGEgcHNldWRvIGluY2x1ZGVcbiAgICBjb25zdCBhc3NvY2lhdGlvbiA9IGluY2x1ZGUuYXNzb2NpYXRpb24gfHwgdGhpcy5fZ2V0SW5jbHVkZWRBc3NvY2lhdGlvbihpbmNsdWRlLm1vZGVsLCBpbmNsdWRlLmFzKTtcblxuICAgIGluY2x1ZGUuYXNzb2NpYXRpb24gPSBhc3NvY2lhdGlvbjtcbiAgICBpbmNsdWRlLmFzID0gYXNzb2NpYXRpb24uYXM7XG5cbiAgICAvLyBJZiB0aHJvdWdoLCB3ZSBjcmVhdGUgYSBwc2V1ZG8gY2hpbGQgaW5jbHVkZSwgdG8gZWFzZSBvdXIgcGFyc2luZyBsYXRlciBvblxuICAgIGlmIChpbmNsdWRlLmFzc29jaWF0aW9uLnRocm91Z2ggJiYgT2JqZWN0KGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbCkgPT09IGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbCkge1xuICAgICAgaWYgKCFpbmNsdWRlLmluY2x1ZGUpIGluY2x1ZGUuaW5jbHVkZSA9IFtdO1xuICAgICAgY29uc3QgdGhyb3VnaCA9IGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaDtcblxuICAgICAgaW5jbHVkZS50aHJvdWdoID0gXy5kZWZhdWx0cyhpbmNsdWRlLnRocm91Z2ggfHwge30sIHtcbiAgICAgICAgbW9kZWw6IHRocm91Z2gubW9kZWwsXG4gICAgICAgIGFzOiB0aHJvdWdoLm1vZGVsLm5hbWUsXG4gICAgICAgIGFzc29jaWF0aW9uOiB7XG4gICAgICAgICAgaXNTaW5nbGVBc3NvY2lhdGlvbjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBfcHNldWRvOiB0cnVlLFxuICAgICAgICBwYXJlbnQ6IGluY2x1ZGVcbiAgICAgIH0pO1xuXG5cbiAgICAgIGlmICh0aHJvdWdoLnNjb3BlKSB7XG4gICAgICAgIGluY2x1ZGUudGhyb3VnaC53aGVyZSA9IGluY2x1ZGUudGhyb3VnaC53aGVyZSA/IHsgW09wLmFuZF06IFtpbmNsdWRlLnRocm91Z2gud2hlcmUsIHRocm91Z2guc2NvcGVdIH0gOiB0aHJvdWdoLnNjb3BlO1xuICAgICAgfVxuXG4gICAgICBpbmNsdWRlLmluY2x1ZGUucHVzaChpbmNsdWRlLnRocm91Z2gpO1xuICAgICAgdGFibGVOYW1lc1t0aHJvdWdoLnRhYmxlTmFtZV0gPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIGluY2x1ZGUubW9kZWwgbWF5IGJlIHRoZSBtYWluIG1vZGVsLCB3aGlsZSB0aGUgYXNzb2NpYXRpb24gdGFyZ2V0IG1heSBiZSBzY29wZWQgLSB0aHVzIHdlIG5lZWQgdG8gbG9vayBhdCBhc3NvY2lhdGlvbi50YXJnZXQvc291cmNlXG4gICAgbGV0IG1vZGVsO1xuICAgIGlmIChpbmNsdWRlLm1vZGVsLnNjb3BlZCA9PT0gdHJ1ZSkge1xuICAgICAgLy8gSWYgdGhlIHBhc3NlZCBtb2RlbCBpcyBhbHJlYWR5IHNjb3BlZCwga2VlcCB0aGF0XG4gICAgICBtb2RlbCA9IGluY2x1ZGUubW9kZWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSB1c2UgdGhlIG1vZGVsIHRoYXQgd2FzIG9yaWdpbmFsbHkgcGFzc2VkIHRvIHRoZSBhc3NvY2lhdGlvblxuICAgICAgbW9kZWwgPSBpbmNsdWRlLmFzc29jaWF0aW9uLnRhcmdldC5uYW1lID09PSBpbmNsdWRlLm1vZGVsLm5hbWUgPyBpbmNsdWRlLmFzc29jaWF0aW9uLnRhcmdldCA6IGluY2x1ZGUuYXNzb2NpYXRpb24uc291cmNlO1xuICAgIH1cblxuICAgIG1vZGVsLl9pbmplY3RTY29wZShpbmNsdWRlKTtcblxuICAgIC8vIFRoaXMgY2hlY2sgc2hvdWxkIGhhcHBlbiBhZnRlciBpbmplY3RpbmcgdGhlIHNjb3BlLCBzaW5jZSB0aGUgc2NvcGUgbWF5IGNvbnRhaW4gYSAuYXR0cmlidXRlc1xuICAgIGlmICghaW5jbHVkZS5hdHRyaWJ1dGVzKSB7XG4gICAgICBpbmNsdWRlLmF0dHJpYnV0ZXMgPSBPYmplY3Qua2V5cyhpbmNsdWRlLm1vZGVsLnRhYmxlQXR0cmlidXRlcyk7XG4gICAgfVxuXG4gICAgaW5jbHVkZSA9IFV0aWxzLm1hcEZpbmRlck9wdGlvbnMoaW5jbHVkZSwgaW5jbHVkZS5tb2RlbCk7XG5cbiAgICBpZiAoaW5jbHVkZS5yZXF1aXJlZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpbmNsdWRlLnJlcXVpcmVkID0gISFpbmNsdWRlLndoZXJlO1xuICAgIH1cblxuICAgIGlmIChpbmNsdWRlLmFzc29jaWF0aW9uLnNjb3BlKSB7XG4gICAgICBpbmNsdWRlLndoZXJlID0gaW5jbHVkZS53aGVyZSA/IHsgW09wLmFuZF06IFtpbmNsdWRlLndoZXJlLCBpbmNsdWRlLmFzc29jaWF0aW9uLnNjb3BlXSB9IDogaW5jbHVkZS5hc3NvY2lhdGlvbi5zY29wZTtcbiAgICB9XG5cbiAgICBpZiAoaW5jbHVkZS5saW1pdCAmJiBpbmNsdWRlLnNlcGFyYXRlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGluY2x1ZGUuc2VwYXJhdGUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChpbmNsdWRlLnNlcGFyYXRlID09PSB0cnVlKSB7XG4gICAgICBpZiAoIShpbmNsdWRlLmFzc29jaWF0aW9uIGluc3RhbmNlb2YgSGFzTWFueSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IEhhc01hbnkgYXNzb2NpYXRpb25zIHN1cHBvcnQgaW5jbHVkZS5zZXBhcmF0ZScpO1xuICAgICAgfVxuXG4gICAgICBpbmNsdWRlLmR1cGxpY2F0aW5nID0gZmFsc2U7XG5cbiAgICAgIGlmIChcbiAgICAgICAgb3B0aW9ucy5hdHRyaWJ1dGVzXG4gICAgICAgICYmIG9wdGlvbnMuYXR0cmlidXRlcy5sZW5ndGhcbiAgICAgICAgJiYgIV8uZmxhdHRlbkRlcHRoKG9wdGlvbnMuYXR0cmlidXRlcywgMikuaW5jbHVkZXMoYXNzb2NpYXRpb24uc291cmNlS2V5KVxuICAgICAgKSB7XG4gICAgICAgIG9wdGlvbnMuYXR0cmlidXRlcy5wdXNoKGFzc29jaWF0aW9uLnNvdXJjZUtleSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgaW5jbHVkZS5hdHRyaWJ1dGVzXG4gICAgICAgICYmIGluY2x1ZGUuYXR0cmlidXRlcy5sZW5ndGhcbiAgICAgICAgJiYgIV8uZmxhdHRlbkRlcHRoKGluY2x1ZGUuYXR0cmlidXRlcywgMikuaW5jbHVkZXMoYXNzb2NpYXRpb24uZm9yZWlnbktleSlcbiAgICAgICkge1xuICAgICAgICBpbmNsdWRlLmF0dHJpYnV0ZXMucHVzaChhc3NvY2lhdGlvbi5mb3JlaWduS2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBjaGlsZCBpbmNsdWRlc1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5jbHVkZSwgJ2luY2x1ZGUnKSkge1xuICAgICAgdGhpcy5fdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzLmNhbGwoaW5jbHVkZS5tb2RlbCwgaW5jbHVkZSwgdGFibGVOYW1lcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGluY2x1ZGU7XG4gIH1cblxuICBzdGF0aWMgX2dldEluY2x1ZGVkQXNzb2NpYXRpb24odGFyZ2V0TW9kZWwsIHRhcmdldEFsaWFzKSB7XG4gICAgY29uc3QgYXNzb2NpYXRpb25zID0gdGhpcy5nZXRBc3NvY2lhdGlvbnModGFyZ2V0TW9kZWwpO1xuICAgIGxldCBhc3NvY2lhdGlvbiA9IG51bGw7XG4gICAgaWYgKGFzc29jaWF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuRWFnZXJMb2FkaW5nRXJyb3IoYCR7dGFyZ2V0TW9kZWwubmFtZX0gaXMgbm90IGFzc29jaWF0ZWQgdG8gJHt0aGlzLm5hbWV9IWApO1xuICAgIH1cbiAgICBpZiAoYXNzb2NpYXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgYXNzb2NpYXRpb24gPSB0aGlzLmdldEFzc29jaWF0aW9uRm9yQWxpYXModGFyZ2V0TW9kZWwsIHRhcmdldEFsaWFzKTtcbiAgICAgIGlmIChhc3NvY2lhdGlvbikge1xuICAgICAgICByZXR1cm4gYXNzb2NpYXRpb247XG4gICAgICB9XG4gICAgICBpZiAodGFyZ2V0QWxpYXMpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdBbGlhc2VzID0gdGhpcy5nZXRBc3NvY2lhdGlvbnModGFyZ2V0TW9kZWwpLm1hcChhc3NvY2lhdGlvbiA9PiBhc3NvY2lhdGlvbi5hcyk7XG4gICAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuRWFnZXJMb2FkaW5nRXJyb3IoYCR7dGFyZ2V0TW9kZWwubmFtZX0gaXMgYXNzb2NpYXRlZCB0byAke3RoaXMubmFtZX0gdXNpbmcgYW4gYWxpYXMuIGAgK1xuICAgICAgICAgIGBZb3UndmUgaW5jbHVkZWQgYW4gYWxpYXMgKCR7dGFyZ2V0QWxpYXN9KSwgYnV0IGl0IGRvZXMgbm90IG1hdGNoIHRoZSBhbGlhcyhlcykgZGVmaW5lZCBpbiB5b3VyIGFzc29jaWF0aW9uICgke2V4aXN0aW5nQWxpYXNlcy5qb2luKCcsICcpfSkuYCk7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLkVhZ2VyTG9hZGluZ0Vycm9yKGAke3RhcmdldE1vZGVsLm5hbWV9IGlzIGFzc29jaWF0ZWQgdG8gJHt0aGlzLm5hbWV9IHVzaW5nIGFuIGFsaWFzLiBgICtcbiAgICAgICAgJ1lvdSBtdXN0IHVzZSB0aGUgXFwnYXNcXCcga2V5d29yZCB0byBzcGVjaWZ5IHRoZSBhbGlhcyB3aXRoaW4geW91ciBpbmNsdWRlIHN0YXRlbWVudC4nKTtcbiAgICB9XG4gICAgYXNzb2NpYXRpb24gPSB0aGlzLmdldEFzc29jaWF0aW9uRm9yQWxpYXModGFyZ2V0TW9kZWwsIHRhcmdldEFsaWFzKTtcbiAgICBpZiAoIWFzc29jaWF0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLkVhZ2VyTG9hZGluZ0Vycm9yKGAke3RhcmdldE1vZGVsLm5hbWV9IGlzIGFzc29jaWF0ZWQgdG8gJHt0aGlzLm5hbWV9IG11bHRpcGxlIHRpbWVzLiBgICtcbiAgICAgICAgJ1RvIGlkZW50aWZ5IHRoZSBjb3JyZWN0IGFzc29jaWF0aW9uLCB5b3UgbXVzdCB1c2UgdGhlIFxcJ2FzXFwnIGtleXdvcmQgdG8gc3BlY2lmeSB0aGUgYWxpYXMgb2YgdGhlIGFzc29jaWF0aW9uIHlvdSB3YW50IHRvIGluY2x1ZGUuJyk7XG4gICAgfVxuICAgIHJldHVybiBhc3NvY2lhdGlvbjtcbiAgfVxuXG5cbiAgc3RhdGljIF9leHBhbmRJbmNsdWRlQWxsKG9wdGlvbnMpIHtcbiAgICBjb25zdCBpbmNsdWRlcyA9IG9wdGlvbnMuaW5jbHVkZTtcbiAgICBpZiAoIWluY2x1ZGVzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGluY2x1ZGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgaW5jbHVkZSA9IGluY2x1ZGVzW2luZGV4XTtcblxuICAgICAgaWYgKGluY2x1ZGUuYWxsKSB7XG4gICAgICAgIGluY2x1ZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG5cbiAgICAgICAgdGhpcy5fZXhwYW5kSW5jbHVkZUFsbEVsZW1lbnQoaW5jbHVkZXMsIGluY2x1ZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGluY2x1ZGVzLmZvckVhY2goaW5jbHVkZSA9PiB7XG4gICAgICB0aGlzLl9leHBhbmRJbmNsdWRlQWxsLmNhbGwoaW5jbHVkZS5tb2RlbCwgaW5jbHVkZSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgX2NvbmZvcm1JbmRleChpbmRleCkge1xuICAgIGlmICghaW5kZXguZmllbGRzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgXCJmaWVsZHNcIiBwcm9wZXJ0eSBmb3IgaW5kZXggZGVmaW5pdGlvbicpO1xuICAgIH1cblxuICAgIGluZGV4ID0gXy5kZWZhdWx0cyhpbmRleCwge1xuICAgICAgdHlwZTogJycsXG4gICAgICBwYXJzZXI6IG51bGxcbiAgICB9KTtcblxuICAgIGlmIChpbmRleC50eXBlICYmIGluZGV4LnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3VuaXF1ZScpIHtcbiAgICAgIGluZGV4LnVuaXF1ZSA9IHRydWU7XG4gICAgICBkZWxldGUgaW5kZXgudHlwZTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuXG4gIHN0YXRpYyBfdW5pcUluY2x1ZGVzKG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZSkgcmV0dXJuO1xuXG4gICAgb3B0aW9ucy5pbmNsdWRlID0gXyhvcHRpb25zLmluY2x1ZGUpXG4gICAgICAuZ3JvdXBCeShpbmNsdWRlID0+IGAke2luY2x1ZGUubW9kZWwgJiYgaW5jbHVkZS5tb2RlbC5uYW1lfS0ke2luY2x1ZGUuYXN9YClcbiAgICAgIC5tYXAoaW5jbHVkZXMgPT4gdGhpcy5fYXNzaWduT3B0aW9ucyguLi5pbmNsdWRlcykpXG4gICAgICAudmFsdWUoKTtcbiAgfVxuXG4gIHN0YXRpYyBfYmFzZU1lcmdlKC4uLmFyZ3MpIHtcbiAgICBfLmFzc2lnbldpdGgoLi4uYXJncyk7XG4gICAgdGhpcy5fY29uZm9ybUluY2x1ZGVzKGFyZ3NbMF0sIHRoaXMpO1xuICAgIHRoaXMuX3VuaXFJbmNsdWRlcyhhcmdzWzBdKTtcbiAgICByZXR1cm4gYXJnc1swXTtcbiAgfVxuXG4gIHN0YXRpYyBfbWVyZ2VGdW5jdGlvbihvYmpWYWx1ZSwgc3JjVmFsdWUsIGtleSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9ialZhbHVlKSAmJiBBcnJheS5pc0FycmF5KHNyY1ZhbHVlKSkge1xuICAgICAgcmV0dXJuIF8udW5pb24ob2JqVmFsdWUsIHNyY1ZhbHVlKTtcbiAgICB9XG4gICAgaWYgKGtleSA9PT0gJ3doZXJlJyB8fCBrZXkgPT09ICdoYXZpbmcnKSB7XG4gICAgICBpZiAoc3JjVmFsdWUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcbiAgICAgICAgc3JjVmFsdWUgPSB7IFtPcC5hbmRdOiBzcmNWYWx1ZSB9O1xuICAgICAgfVxuICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdChvYmpWYWx1ZSkgJiYgXy5pc1BsYWluT2JqZWN0KHNyY1ZhbHVlKSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihvYmpWYWx1ZSwgc3JjVmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnYXR0cmlidXRlcycgJiYgXy5pc1BsYWluT2JqZWN0KG9ialZhbHVlKSAmJiBfLmlzUGxhaW5PYmplY3Qoc3JjVmFsdWUpKSB7XG4gICAgICByZXR1cm4gXy5hc3NpZ25XaXRoKG9ialZhbHVlLCBzcmNWYWx1ZSwgKG9ialZhbHVlLCBzcmNWYWx1ZSkgPT4ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpWYWx1ZSkgJiYgQXJyYXkuaXNBcnJheShzcmNWYWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gXy51bmlvbihvYmpWYWx1ZSwgc3JjVmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gSWYgd2UgaGF2ZSBhIHBvc3NpYmxlIG9iamVjdC9hcnJheSB0byBjbG9uZSwgd2UgdHJ5IGl0LlxuICAgIC8vIE90aGVyd2lzZSwgd2UgcmV0dXJuIHRoZSBvcmlnaW5hbCB2YWx1ZSB3aGVuIGl0J3Mgbm90IHVuZGVmaW5lZCxcbiAgICAvLyBvciB0aGUgcmVzdWx0aW5nIG9iamVjdCBpbiB0aGF0IGNhc2UuXG4gICAgaWYgKHNyY1ZhbHVlKSB7XG4gICAgICByZXR1cm4gVXRpbHMuY2xvbmVEZWVwKHNyY1ZhbHVlLCB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHNyY1ZhbHVlID09PSB1bmRlZmluZWQgPyBvYmpWYWx1ZSA6IHNyY1ZhbHVlO1xuICB9XG5cbiAgc3RhdGljIF9hc3NpZ25PcHRpb25zKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5fYmFzZU1lcmdlKC4uLmFyZ3MsIHRoaXMuX21lcmdlRnVuY3Rpb24pO1xuICB9XG5cbiAgc3RhdGljIF9kZWZhdWx0c09wdGlvbnModGFyZ2V0LCBvcHRzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Jhc2VNZXJnZSh0YXJnZXQsIG9wdHMsIChzcmNWYWx1ZSwgb2JqVmFsdWUsIGtleSkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX21lcmdlRnVuY3Rpb24ob2JqVmFsdWUsIHNyY1ZhbHVlLCBrZXkpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBtb2RlbCwgcmVwcmVzZW50aW5nIGEgdGFibGUgaW4gdGhlIERCLCB3aXRoIGF0dHJpYnV0ZXMgYW5kIG9wdGlvbnMuXG4gICAqXG4gICAqIFRoZSB0YWJsZSBjb2x1bW5zIGFyZSBkZWZpbmVkIGJ5IHRoZSBoYXNoIHRoYXQgaXMgZ2l2ZW4gYXMgdGhlIGZpcnN0IGFyZ3VtZW50LlxuICAgKiBFYWNoIGF0dHJpYnV0ZSBvZiB0aGUgaGFzaCByZXByZXNlbnRzIGEgY29sdW1uLlxuICAgKlxuICAgKiBGb3IgbW9yZSBhYm91dCA8YSBocmVmPVwiL21hbnVhbC90dXRvcmlhbC9tb2RlbHMtZGVmaW5pdGlvbi5odG1sI3ZhbGlkYXRpb25zXCIvPlZhbGlkYXRpb25zPC9hPlxuICAgKlxuICAgKiBNb3JlIGV4YW1wbGVzLCA8YSBocmVmPVwiL21hbnVhbC90dXRvcmlhbC9tb2RlbHMtZGVmaW5pdGlvbi5odG1sXCIvPk1vZGVsIERlZmluaXRpb248L2E+XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIFByb2plY3QuaW5pdCh7XG4gICAqICAgY29sdW1uQToge1xuICAgKiAgICAgdHlwZTogU2VxdWVsaXplLkJPT0xFQU4sXG4gICAqICAgICB2YWxpZGF0ZToge1xuICAgKiAgICAgICBpczogWydbYS16XScsJ2knXSwgICAgICAgIC8vIHdpbGwgb25seSBhbGxvdyBsZXR0ZXJzXG4gICAqICAgICAgIG1heDogMjMsICAgICAgICAgICAgICAgICAgLy8gb25seSBhbGxvdyB2YWx1ZXMgPD0gMjNcbiAgICogICAgICAgaXNJbjoge1xuICAgKiAgICAgICAgIGFyZ3M6IFtbJ2VuJywgJ3poJ11dLFxuICAgKiAgICAgICAgIG1zZzogXCJNdXN0IGJlIEVuZ2xpc2ggb3IgQ2hpbmVzZVwiXG4gICAqICAgICAgIH1cbiAgICogICAgIH0sXG4gICAqICAgICBmaWVsZDogJ2NvbHVtbl9hJ1xuICAgKiAgICAgLy8gT3RoZXIgYXR0cmlidXRlcyBoZXJlXG4gICAqICAgfSxcbiAgICogICBjb2x1bW5COiBTZXF1ZWxpemUuU1RSSU5HLFxuICAgKiAgIGNvbHVtbkM6ICdNWSBWRVJZIE9XTiBDT0xVTU4gVFlQRSdcbiAgICogfSwge3NlcXVlbGl6ZX0pXG4gICAqXG4gICAqIHNlcXVlbGl6ZS5tb2RlbHMubW9kZWxOYW1lIC8vIFRoZSBtb2RlbCB3aWxsIG5vdyBiZSBhdmFpbGFibGUgaW4gbW9kZWxzIHVuZGVyIHRoZSBjbGFzcyBuYW1lXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIERhdGFUeXBlc31cbiAgICogQHNlZVxuICAgKiB7QGxpbmsgSG9va3N9XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMgQW4gb2JqZWN0LCB3aGVyZSBlYWNoIGF0dHJpYnV0ZSBpcyBhIGNvbHVtbiBvZiB0aGUgdGFibGUuIEVhY2ggY29sdW1uIGNhbiBiZSBlaXRoZXIgYSBEYXRhVHlwZSwgYSBzdHJpbmcgb3IgYSB0eXBlLWRlc2NyaXB0aW9uIG9iamVjdCwgd2l0aCB0aGUgcHJvcGVydGllcyBkZXNjcmliZWQgYmVsb3c6XG4gICAqIEBwYXJhbSB7c3RyaW5nfERhdGFUeXBlc3xPYmplY3R9IGF0dHJpYnV0ZXMuY29sdW1uIFRoZSBkZXNjcmlwdGlvbiBvZiBhIGRhdGFiYXNlIGNvbHVtblxuICAgKiBAcGFyYW0ge3N0cmluZ3xEYXRhVHlwZXN9ICAgICAgICBhdHRyaWJ1dGVzLmNvbHVtbi50eXBlIEEgc3RyaW5nIG9yIGEgZGF0YSB0eXBlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi5hbGxvd051bGw9dHJ1ZV0gSWYgZmFsc2UsIHRoZSBjb2x1bW4gd2lsbCBoYXZlIGEgTk9UIE5VTEwgY29uc3RyYWludCwgYW5kIGEgbm90IG51bGwgdmFsaWRhdGlvbiB3aWxsIGJlIHJ1biBiZWZvcmUgYW4gaW5zdGFuY2UgaXMgc2F2ZWQuXG4gICAqIEBwYXJhbSB7YW55fSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi5kZWZhdWx0VmFsdWU9bnVsbF0gQSBsaXRlcmFsIGRlZmF1bHQgdmFsdWUsIGEgSmF2YVNjcmlwdCBmdW5jdGlvbiwgb3IgYW4gU1FMIGZ1bmN0aW9uIChzZWUgYHNlcXVlbGl6ZS5mbmApXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59ICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi51bmlxdWU9ZmFsc2VdIElmIHRydWUsIHRoZSBjb2x1bW4gd2lsbCBnZXQgYSB1bmlxdWUgY29uc3RyYWludC4gSWYgYSBzdHJpbmcgaXMgcHJvdmlkZWQsIHRoZSBjb2x1bW4gd2lsbCBiZSBwYXJ0IG9mIGEgY29tcG9zaXRlIHVuaXF1ZSBpbmRleC4gSWYgbXVsdGlwbGUgY29sdW1ucyBoYXZlIHRoZSBzYW1lIHN0cmluZywgdGhleSB3aWxsIGJlIHBhcnQgb2YgdGhlIHNhbWUgdW5pcXVlIGluZGV4XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi5wcmltYXJ5S2V5PWZhbHNlXSBJZiB0cnVlLCB0aGlzIGF0dHJpYnV0ZSB3aWxsIGJlIG1hcmtlZCBhcyBwcmltYXJ5IGtleVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4uZmllbGQ9bnVsbF0gSWYgc2V0LCBzZXF1ZWxpemUgd2lsbCBtYXAgdGhlIGF0dHJpYnV0ZSBuYW1lIHRvIGEgZGlmZmVyZW50IG5hbWUgaW4gdGhlIGRhdGFiYXNlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi5hdXRvSW5jcmVtZW50PWZhbHNlXSBJZiB0cnVlLCB0aGlzIGNvbHVtbiB3aWxsIGJlIHNldCB0byBhdXRvIGluY3JlbWVudFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4uYXV0b0luY3JlbWVudElkZW50aXR5PWZhbHNlXSBJZiB0cnVlLCBjb21iaW5lZCB3aXRoIGF1dG9JbmNyZW1lbnQ9dHJ1ZSwgd2lsbCB1c2UgUG9zdGdyZXMgYEdFTkVSQVRFRCBCWSBERUZBVUxUIEFTIElERU5USVRZYCBpbnN0ZWFkIG9mIGBTRVJJQUxgLiBQb3N0Z3JlcyAxMCsgb25seS5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29sdW1uLmNvbW1lbnQ9bnVsbF0gQ29tbWVudCBmb3IgdGhpcyBjb2x1bW5cbiAgICogQHBhcmFtIHtzdHJpbmd8TW9kZWx9ICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29sdW1uLnJlZmVyZW5jZXM9bnVsbF0gQW4gb2JqZWN0IHdpdGggcmVmZXJlbmNlIGNvbmZpZ3VyYXRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vZGVsfSAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi5yZWZlcmVuY2VzLm1vZGVsXSBJZiB0aGlzIGNvbHVtbiByZWZlcmVuY2VzIGFub3RoZXIgdGFibGUsIHByb3ZpZGUgaXQgaGVyZSBhcyBhIE1vZGVsLCBvciBhIHN0cmluZ1xuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4ucmVmZXJlbmNlcy5rZXk9J2lkJ10gVGhlIGNvbHVtbiBvZiB0aGUgZm9yZWlnbiB0YWJsZSB0aGF0IHRoaXMgY29sdW1uIHJlZmVyZW5jZXNcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29sdW1uLm9uVXBkYXRlXSBXaGF0IHNob3VsZCBoYXBwZW4gd2hlbiB0aGUgcmVmZXJlbmNlZCBrZXkgaXMgdXBkYXRlZC4gT25lIG9mIENBU0NBREUsIFJFU1RSSUNULCBTRVQgREVGQVVMVCwgU0VUIE5VTEwgb3IgTk8gQUNUSU9OXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi5vbkRlbGV0ZV0gV2hhdCBzaG91bGQgaGFwcGVuIHdoZW4gdGhlIHJlZmVyZW5jZWQga2V5IGlzIGRlbGV0ZWQuIE9uZSBvZiBDQVNDQURFLCBSRVNUUklDVCwgU0VUIERFRkFVTFQsIFNFVCBOVUxMIG9yIE5PIEFDVElPTlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4uZ2V0XSBQcm92aWRlIGEgY3VzdG9tIGdldHRlciBmb3IgdGhpcyBjb2x1bW4uIFVzZSBgdGhpcy5nZXREYXRhVmFsdWUoU3RyaW5nKWAgdG8gbWFuaXB1bGF0ZSB0aGUgdW5kZXJseWluZyB2YWx1ZXMuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259ICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi5zZXRdIFByb3ZpZGUgYSBjdXN0b20gc2V0dGVyIGZvciB0aGlzIGNvbHVtbi4gVXNlIGB0aGlzLnNldERhdGFWYWx1ZShTdHJpbmcsIFZhbHVlKWAgdG8gbWFuaXB1bGF0ZSB0aGUgdW5kZXJseWluZyB2YWx1ZXMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi52YWxpZGF0ZV0gQW4gb2JqZWN0IG9mIHZhbGlkYXRpb25zIHRvIGV4ZWN1dGUgZm9yIHRoaXMgY29sdW1uIGV2ZXJ5IHRpbWUgdGhlIG1vZGVsIGlzIHNhdmVkLiBDYW4gYmUgZWl0aGVyIHRoZSBuYW1lIG9mIGEgdmFsaWRhdGlvbiBwcm92aWRlZCBieSB2YWxpZGF0b3IuanMsIGEgdmFsaWRhdGlvbiBmdW5jdGlvbiBwcm92aWRlZCBieSBleHRlbmRpbmcgdmFsaWRhdG9yLmpzIChzZWUgdGhlIGBEQU9WYWxpZGF0b3JgIHByb3BlcnR5IGZvciBtb3JlIGRldGFpbHMpLCBvciBhIGN1c3RvbSB2YWxpZGF0aW9uIGZ1bmN0aW9uLiBDdXN0b20gdmFsaWRhdGlvbiBmdW5jdGlvbnMgYXJlIGNhbGxlZCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgZmllbGQgYW5kIHRoZSBpbnN0YW5jZSBpdHNlbGYgYXMgdGhlIGB0aGlzYCBiaW5kaW5nLCBhbmQgY2FuIHBvc3NpYmx5IHRha2UgYSBzZWNvbmQgY2FsbGJhY2sgYXJndW1lbnQsIHRvIHNpZ25hbCB0aGF0IHRoZXkgYXJlIGFzeW5jaHJvbm91cy4gSWYgdGhlIHZhbGlkYXRvciBpcyBzeW5jLCBpdCBzaG91bGQgdGhyb3cgaW4gdGhlIGNhc2Ugb2YgYSBmYWlsZWQgdmFsaWRhdGlvbjsgaWYgaXQgaXMgYXN5bmMsIHRoZSBjYWxsYmFjayBzaG91bGQgYmUgY2FsbGVkIHdpdGggdGhlIGVycm9yIHRleHQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIG9wdGlvbnMgVGhlc2Ugb3B0aW9ucyBhcmUgbWVyZ2VkIHdpdGggdGhlIGRlZmF1bHQgZGVmaW5lIG9wdGlvbnMgcHJvdmlkZWQgdG8gdGhlIFNlcXVlbGl6ZSBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgICAgICAgICBvcHRpb25zLnNlcXVlbGl6ZSBEZWZpbmUgdGhlIHNlcXVlbGl6ZSBpbnN0YW5jZSB0byBhdHRhY2ggdG8gdGhlIG5ldyBNb2RlbC4gVGhyb3cgZXJyb3IgaWYgbm9uZSBpcyBwcm92aWRlZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMubW9kZWxOYW1lXSBTZXQgbmFtZSBvZiB0aGUgbW9kZWwuIEJ5IGRlZmF1bHQgaXRzIHNhbWUgYXMgQ2xhc3MgbmFtZS5cbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuZGVmYXVsdFNjb3BlPXt9XSBEZWZpbmUgdGhlIGRlZmF1bHQgc2VhcmNoIHNjb3BlIHRvIHVzZSBmb3IgdGhpcyBtb2RlbC4gU2NvcGVzIGhhdmUgdGhlIHNhbWUgZm9ybSBhcyB0aGUgb3B0aW9ucyBwYXNzZWQgdG8gZmluZCAvIGZpbmRBbGxcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuc2NvcGVzXSBNb3JlIHNjb3BlcywgZGVmaW5lZCBpbiB0aGUgc2FtZSB3YXkgYXMgZGVmYXVsdFNjb3BlIGFib3ZlLiBTZWUgYE1vZGVsLnNjb3BlYCBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBob3cgc2NvcGVzIGFyZSBkZWZpbmVkLCBhbmQgd2hhdCB5b3UgY2FuIGRvIHdpdGggdGhlbVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICBbb3B0aW9ucy5vbWl0TnVsbF0gRG9uJ3QgcGVyc2lzdCBudWxsIHZhbHVlcy4gVGhpcyBtZWFucyB0aGF0IGFsbCBjb2x1bW5zIHdpdGggbnVsbCB2YWx1ZXMgd2lsbCBub3QgYmUgc2F2ZWRcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgW29wdGlvbnMudGltZXN0YW1wcz10cnVlXSBBZGRzIGNyZWF0ZWRBdCBhbmQgdXBkYXRlZEF0IHRpbWVzdGFtcHMgdG8gdGhlIG1vZGVsLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICBbb3B0aW9ucy5wYXJhbm9pZD1mYWxzZV0gQ2FsbGluZyBgZGVzdHJveWAgd2lsbCBub3QgZGVsZXRlIHRoZSBtb2RlbCwgYnV0IGluc3RlYWQgc2V0IGEgYGRlbGV0ZWRBdGAgdGltZXN0YW1wIGlmIHRoaXMgaXMgdHJ1ZS4gTmVlZHMgYHRpbWVzdGFtcHM9dHJ1ZWAgdG8gd29ya1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICBbb3B0aW9ucy51bmRlcnNjb3JlZD1mYWxzZV0gQWRkIHVuZGVyc2NvcmVkIGZpZWxkIHRvIGFsbCBhdHRyaWJ1dGVzLCB0aGlzIGNvdmVycyB1c2VyIGRlZmluZWQgYXR0cmlidXRlcywgdGltZXN0YW1wcyBhbmQgZm9yZWlnbiBrZXlzLiBXaWxsIG5vdCBhZmZlY3QgYXR0cmlidXRlcyB3aXRoIGV4cGxpY2l0bHkgc2V0IGBmaWVsZGAgb3B0aW9uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIFtvcHRpb25zLmZyZWV6ZVRhYmxlTmFtZT1mYWxzZV0gSWYgZnJlZXplVGFibGVOYW1lIGlzIHRydWUsIHNlcXVlbGl6ZSB3aWxsIG5vdCB0cnkgdG8gYWx0ZXIgdGhlIG1vZGVsIG5hbWUgdG8gZ2V0IHRoZSB0YWJsZSBuYW1lLiBPdGhlcndpc2UsIHRoZSBtb2RlbCBuYW1lIHdpbGwgYmUgcGx1cmFsaXplZFxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgICAgICAgICBbb3B0aW9ucy5uYW1lXSBBbiBvYmplY3Qgd2l0aCB0d28gYXR0cmlidXRlcywgYHNpbmd1bGFyYCBhbmQgYHBsdXJhbGAsIHdoaWNoIGFyZSB1c2VkIHdoZW4gdGhpcyBtb2RlbCBpcyBhc3NvY2lhdGVkIHRvIG90aGVycy5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMubmFtZS5zaW5ndWxhcj1VdGlscy5zaW5ndWxhcml6ZShtb2RlbE5hbWUpXSBTaW5ndWxhciBuYW1lIGZvciBtb2RlbFxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbb3B0aW9ucy5uYW1lLnBsdXJhbD1VdGlscy5wbHVyYWxpemUobW9kZWxOYW1lKV0gUGx1cmFsIG5hbWUgZm9yIG1vZGVsXG4gICAqIEBwYXJhbSB7QXJyYXk8T2JqZWN0Pn0gICAgICAgICAgIFtvcHRpb25zLmluZGV4ZXNdIGluZGV4ZXMgZGVmaW5pdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5kZXhlc1tdLm5hbWVdIFRoZSBuYW1lIG9mIHRoZSBpbmRleC4gRGVmYXVsdHMgdG8gbW9kZWwgbmFtZSArIF8gKyBmaWVsZHMgY29uY2F0ZW5hdGVkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluZGV4ZXNbXS50eXBlXSBJbmRleCB0eXBlLiBPbmx5IHVzZWQgYnkgbXlzcWwuIE9uZSBvZiBgVU5JUVVFYCwgYEZVTExURVhUYCBhbmQgYFNQQVRJQUxgXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluZGV4ZXNbXS51c2luZ10gVGhlIG1ldGhvZCB0byBjcmVhdGUgdGhlIGluZGV4IGJ5IChgVVNJTkdgIHN0YXRlbWVudCBpbiBTUUwpLiBCVFJFRSBhbmQgSEFTSCBhcmUgc3VwcG9ydGVkIGJ5IG15c3FsIGFuZCBwb3N0Z3JlcywgYW5kIHBvc3RncmVzIGFkZGl0aW9uYWxseSBzdXBwb3J0cyBHSVNUIGFuZCBHSU4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluZGV4ZXNbXS5vcGVyYXRvcl0gU3BlY2lmeSBpbmRleCBvcGVyYXRvci5cbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5kZXhlc1tdLnVuaXF1ZT1mYWxzZV0gU2hvdWxkIHRoZSBpbmRleCBieSB1bmlxdWU/IENhbiBhbHNvIGJlIHRyaWdnZXJlZCBieSBzZXR0aW5nIHR5cGUgdG8gYFVOSVFVRWBcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5kZXhlc1tdLmNvbmN1cnJlbnRseT1mYWxzZV0gUG9zdGdyZXNTUUwgd2lsbCBidWlsZCB0aGUgaW5kZXggd2l0aG91dCB0YWtpbmcgYW55IHdyaXRlIGxvY2tzLiBQb3N0Z3JlcyBvbmx5XG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfE9iamVjdD59ICAgIFtvcHRpb25zLmluZGV4ZXNbXS5maWVsZHNdIEFuIGFycmF5IG9mIHRoZSBmaWVsZHMgdG8gaW5kZXguIEVhY2ggZmllbGQgY2FuIGVpdGhlciBiZSBhIHN0cmluZyBjb250YWluaW5nIHRoZSBuYW1lIG9mIHRoZSBmaWVsZCwgYSBzZXF1ZWxpemUgb2JqZWN0IChlLmcgYHNlcXVlbGl6ZS5mbmApLCBvciBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZXM6IGBhdHRyaWJ1dGVgIChmaWVsZCBuYW1lKSwgYGxlbmd0aGAgKGNyZWF0ZSBhIHByZWZpeCBpbmRleCBvZiBsZW5ndGggY2hhcnMpLCBgb3JkZXJgICh0aGUgZGlyZWN0aW9uIHRoZSBjb2x1bW4gc2hvdWxkIGJlIHNvcnRlZCBpbiksIGBjb2xsYXRlYCAodGhlIGNvbGxhdGlvbiAoc29ydCBvcmRlcikgZm9yIHRoZSBjb2x1bW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59ICAgICAgICAgIFtvcHRpb25zLmNyZWF0ZWRBdF0gT3ZlcnJpZGUgdGhlIG5hbWUgb2YgdGhlIGNyZWF0ZWRBdCBhdHRyaWJ1dGUgaWYgYSBzdHJpbmcgaXMgcHJvdmlkZWQsIG9yIGRpc2FibGUgaXQgaWYgZmFsc2UuIFRpbWVzdGFtcHMgbXVzdCBiZSB0cnVlLiBVbmRlcnNjb3JlZCBmaWVsZCB3aWxsIGJlIHNldCB3aXRoIHVuZGVyc2NvcmVkIHNldHRpbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59ICAgICAgICAgIFtvcHRpb25zLnVwZGF0ZWRBdF0gT3ZlcnJpZGUgdGhlIG5hbWUgb2YgdGhlIHVwZGF0ZWRBdCBhdHRyaWJ1dGUgaWYgYSBzdHJpbmcgaXMgcHJvdmlkZWQsIG9yIGRpc2FibGUgaXQgaWYgZmFsc2UuIFRpbWVzdGFtcHMgbXVzdCBiZSB0cnVlLiBVbmRlcnNjb3JlZCBmaWVsZCB3aWxsIGJlIHNldCB3aXRoIHVuZGVyc2NvcmVkIHNldHRpbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59ICAgICAgICAgIFtvcHRpb25zLmRlbGV0ZWRBdF0gT3ZlcnJpZGUgdGhlIG5hbWUgb2YgdGhlIGRlbGV0ZWRBdCBhdHRyaWJ1dGUgaWYgYSBzdHJpbmcgaXMgcHJvdmlkZWQsIG9yIGRpc2FibGUgaXQgaWYgZmFsc2UuIFRpbWVzdGFtcHMgbXVzdCBiZSB0cnVlLiBVbmRlcnNjb3JlZCBmaWVsZCB3aWxsIGJlIHNldCB3aXRoIHVuZGVyc2NvcmVkIHNldHRpbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLnRhYmxlTmFtZV0gRGVmYXVsdHMgdG8gcGx1cmFsaXplZCBtb2RlbCBuYW1lLCB1bmxlc3MgZnJlZXplVGFibGVOYW1lIGlzIHRydWUsIGluIHdoaWNoIGNhc2UgaXQgdXNlcyBtb2RlbCBuYW1lIHZlcmJhdGltXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLnNjaGVtYT0ncHVibGljJ10gc2NoZW1hXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmVuZ2luZV0gU3BlY2lmeSBlbmdpbmUgZm9yIG1vZGVsJ3MgdGFibGVcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuY2hhcnNldF0gU3BlY2lmeSBjaGFyc2V0IGZvciBtb2RlbCdzIHRhYmxlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmNvbW1lbnRdIFNwZWNpZnkgY29tbWVudCBmb3IgbW9kZWwncyB0YWJsZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbb3B0aW9ucy5jb2xsYXRlXSBTcGVjaWZ5IGNvbGxhdGlvbiBmb3IgbW9kZWwncyB0YWJsZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbml0aWFsQXV0b0luY3JlbWVudF0gU2V0IHRoZSBpbml0aWFsIEFVVE9fSU5DUkVNRU5UIHZhbHVlIGZvciB0aGUgdGFibGUgaW4gTXlTUUwuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmhvb2tzXSBBbiBvYmplY3Qgb2YgaG9vayBmdW5jdGlvbiB0aGF0IGFyZSBjYWxsZWQgYmVmb3JlIGFuZCBhZnRlciBjZXJ0YWluIGxpZmVjeWNsZSBldmVudHMuIFRoZSBwb3NzaWJsZSBob29rcyBhcmU6IGJlZm9yZVZhbGlkYXRlLCBhZnRlclZhbGlkYXRlLCB2YWxpZGF0aW9uRmFpbGVkLCBiZWZvcmVCdWxrQ3JlYXRlLCBiZWZvcmVCdWxrRGVzdHJveSwgYmVmb3JlQnVsa1VwZGF0ZSwgYmVmb3JlQ3JlYXRlLCBiZWZvcmVEZXN0cm95LCBiZWZvcmVVcGRhdGUsIGFmdGVyQ3JlYXRlLCBiZWZvcmVTYXZlLCBhZnRlckRlc3Ryb3ksIGFmdGVyVXBkYXRlLCBhZnRlckJ1bGtDcmVhdGUsIGFmdGVyU2F2ZSwgYWZ0ZXJCdWxrRGVzdHJveSBhbmQgYWZ0ZXJCdWxrVXBkYXRlLiBTZWUgSG9va3MgZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgaG9vayBmdW5jdGlvbnMgYW5kIHRoZWlyIHNpZ25hdHVyZXMuIEVhY2ggcHJvcGVydHkgY2FuIGVpdGhlciBiZSBhIGZ1bmN0aW9uLCBvciBhbiBhcnJheSBvZiBmdW5jdGlvbnMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLnZhbGlkYXRlXSBBbiBvYmplY3Qgb2YgbW9kZWwgd2lkZSB2YWxpZGF0aW9ucy4gVmFsaWRhdGlvbnMgaGF2ZSBhY2Nlc3MgdG8gYWxsIG1vZGVsIHZhbHVlcyB2aWEgYHRoaXNgLiBJZiB0aGUgdmFsaWRhdG9yIGZ1bmN0aW9uIHRha2VzIGFuIGFyZ3VtZW50LCBpdCBpcyBhc3N1bWVkIHRvIGJlIGFzeW5jLCBhbmQgaXMgY2FsbGVkIHdpdGggYSBjYWxsYmFjayB0aGF0IGFjY2VwdHMgYW4gb3B0aW9uYWwgZXJyb3IuXG4gICAqXG4gICAqIEByZXR1cm5zIHtNb2RlbH1cbiAgICovXG4gIHN0YXRpYyBpbml0KGF0dHJpYnV0ZXMsIG9wdGlvbnMgPSB7fSkge1xuICAgIGlmICghb3B0aW9ucy5zZXF1ZWxpemUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gU2VxdWVsaXplIGluc3RhbmNlIHBhc3NlZCcpO1xuICAgIH1cblxuICAgIHRoaXMuc2VxdWVsaXplID0gb3B0aW9ucy5zZXF1ZWxpemU7XG5cbiAgICBjb25zdCBnbG9iYWxPcHRpb25zID0gdGhpcy5zZXF1ZWxpemUub3B0aW9ucztcblxuICAgIG9wdGlvbnMgPSBVdGlscy5tZXJnZShfLmNsb25lRGVlcChnbG9iYWxPcHRpb25zLmRlZmluZSksIG9wdGlvbnMpO1xuXG4gICAgaWYgKCFvcHRpb25zLm1vZGVsTmFtZSkge1xuICAgICAgb3B0aW9ucy5tb2RlbE5hbWUgPSB0aGlzLm5hbWU7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IFV0aWxzLm1lcmdlKHtcbiAgICAgIG5hbWU6IHtcbiAgICAgICAgcGx1cmFsOiBVdGlscy5wbHVyYWxpemUob3B0aW9ucy5tb2RlbE5hbWUpLFxuICAgICAgICBzaW5ndWxhcjogVXRpbHMuc2luZ3VsYXJpemUob3B0aW9ucy5tb2RlbE5hbWUpXG4gICAgICB9LFxuICAgICAgaW5kZXhlczogW10sXG4gICAgICBvbWl0TnVsbDogZ2xvYmFsT3B0aW9ucy5vbWl0TnVsbCxcbiAgICAgIHNjaGVtYTogZ2xvYmFsT3B0aW9ucy5zY2hlbWFcbiAgICB9LCBvcHRpb25zKTtcblxuICAgIHRoaXMuc2VxdWVsaXplLnJ1bkhvb2tzKCdiZWZvcmVEZWZpbmUnLCBhdHRyaWJ1dGVzLCBvcHRpb25zKTtcblxuICAgIGlmIChvcHRpb25zLm1vZGVsTmFtZSAhPT0gdGhpcy5uYW1lKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ25hbWUnLCB7IHZhbHVlOiBvcHRpb25zLm1vZGVsTmFtZSB9KTtcbiAgICB9XG4gICAgZGVsZXRlIG9wdGlvbnMubW9kZWxOYW1lO1xuXG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICB0aW1lc3RhbXBzOiB0cnVlLFxuICAgICAgdmFsaWRhdGU6IHt9LFxuICAgICAgZnJlZXplVGFibGVOYW1lOiBmYWxzZSxcbiAgICAgIHVuZGVyc2NvcmVkOiBmYWxzZSxcbiAgICAgIHBhcmFub2lkOiBmYWxzZSxcbiAgICAgIHJlamVjdE9uRW1wdHk6IGZhbHNlLFxuICAgICAgd2hlcmVDb2xsZWN0aW9uOiBudWxsLFxuICAgICAgc2NoZW1hOiBudWxsLFxuICAgICAgc2NoZW1hRGVsaW1pdGVyOiAnJyxcbiAgICAgIGRlZmF1bHRTY29wZToge30sXG4gICAgICBzY29wZXM6IHt9LFxuICAgICAgaW5kZXhlczogW11cbiAgICB9LCBvcHRpb25zKTtcblxuICAgIC8vIGlmIHlvdSBjYWxsIFwiZGVmaW5lXCIgbXVsdGlwbGUgdGltZXMgZm9yIHRoZSBzYW1lIG1vZGVsTmFtZSwgZG8gbm90IGNsdXR0ZXIgdGhlIGZhY3RvcnlcbiAgICBpZiAodGhpcy5zZXF1ZWxpemUuaXNEZWZpbmVkKHRoaXMubmFtZSkpIHtcbiAgICAgIHRoaXMuc2VxdWVsaXplLm1vZGVsTWFuYWdlci5yZW1vdmVNb2RlbCh0aGlzLnNlcXVlbGl6ZS5tb2RlbE1hbmFnZXIuZ2V0TW9kZWwodGhpcy5uYW1lKSk7XG4gICAgfVxuXG4gICAgdGhpcy5hc3NvY2lhdGlvbnMgPSB7fTtcbiAgICB0aGlzLl9zZXR1cEhvb2tzKG9wdGlvbnMuaG9va3MpO1xuXG4gICAgdGhpcy51bmRlcnNjb3JlZCA9IHRoaXMub3B0aW9ucy51bmRlcnNjb3JlZDtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLnRhYmxlTmFtZSkge1xuICAgICAgdGhpcy50YWJsZU5hbWUgPSB0aGlzLm9wdGlvbnMuZnJlZXplVGFibGVOYW1lID8gdGhpcy5uYW1lIDogVXRpbHMudW5kZXJzY29yZWRJZihVdGlscy5wbHVyYWxpemUodGhpcy5uYW1lKSwgdGhpcy51bmRlcnNjb3JlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudGFibGVOYW1lID0gdGhpcy5vcHRpb25zLnRhYmxlTmFtZTtcbiAgICB9XG5cbiAgICB0aGlzLl9zY2hlbWEgPSB0aGlzLm9wdGlvbnMuc2NoZW1hO1xuICAgIHRoaXMuX3NjaGVtYURlbGltaXRlciA9IHRoaXMub3B0aW9ucy5zY2hlbWFEZWxpbWl0ZXI7XG5cbiAgICAvLyBlcnJvciBjaGVjayBvcHRpb25zXG4gICAgXy5lYWNoKG9wdGlvbnMudmFsaWRhdGUsICh2YWxpZGF0b3IsIHZhbGlkYXRvclR5cGUpID0+IHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXR0cmlidXRlcywgdmFsaWRhdG9yVHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBIG1vZGVsIHZhbGlkYXRvciBmdW5jdGlvbiBtdXN0IG5vdCBoYXZlIHRoZSBzYW1lIG5hbWUgYXMgYSBmaWVsZC4gTW9kZWw6ICR7dGhpcy5uYW1lfSwgZmllbGQvdmFsaWRhdGlvbiBuYW1lOiAke3ZhbGlkYXRvclR5cGV9YCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdmFsaWRhdG9yICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTWVtYmVycyBvZiB0aGUgdmFsaWRhdGUgb3B0aW9uIG11c3QgYmUgZnVuY3Rpb25zLiBNb2RlbDogJHt0aGlzLm5hbWV9LCBlcnJvciB3aXRoIHZhbGlkYXRlIG1lbWJlciAke3ZhbGlkYXRvclR5cGV9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLnJhd0F0dHJpYnV0ZXMgPSBfLm1hcFZhbHVlcyhhdHRyaWJ1dGVzLCAoYXR0cmlidXRlLCBuYW1lKSA9PiB7XG4gICAgICBhdHRyaWJ1dGUgPSB0aGlzLnNlcXVlbGl6ZS5ub3JtYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcblxuICAgICAgaWYgKGF0dHJpYnV0ZS50eXBlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlY29nbml6ZWQgZGF0YXR5cGUgZm9yIGF0dHJpYnV0ZSBcIiR7dGhpcy5uYW1lfS4ke25hbWV9XCJgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGF0dHJpYnV0ZS5hbGxvd051bGwgIT09IGZhbHNlICYmIF8uZ2V0KGF0dHJpYnV0ZSwgJ3ZhbGlkYXRlLm5vdE51bGwnKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZGVmaW5pdGlvbiBmb3IgXCIke3RoaXMubmFtZX0uJHtuYW1lfVwiLCBcIm5vdE51bGxcIiB2YWxpZGF0b3IgaXMgb25seSBhbGxvd2VkIHdpdGggXCJhbGxvd051bGw6ZmFsc2VcImApO1xuICAgICAgfVxuXG4gICAgICBpZiAoXy5nZXQoYXR0cmlidXRlLCAncmVmZXJlbmNlcy5tb2RlbC5wcm90b3R5cGUnKSBpbnN0YW5jZW9mIE1vZGVsKSB7XG4gICAgICAgIGF0dHJpYnV0ZS5yZWZlcmVuY2VzLm1vZGVsID0gYXR0cmlidXRlLnJlZmVyZW5jZXMubW9kZWwuZ2V0VGFibGVOYW1lKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhdHRyaWJ1dGU7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWJsZU5hbWUgPSB0aGlzLmdldFRhYmxlTmFtZSgpO1xuICAgIHRoaXMuX2luZGV4ZXMgPSB0aGlzLm9wdGlvbnMuaW5kZXhlc1xuICAgICAgLm1hcChpbmRleCA9PiBVdGlscy5uYW1lSW5kZXgodGhpcy5fY29uZm9ybUluZGV4KGluZGV4KSwgdGFibGVOYW1lKSk7XG5cbiAgICB0aGlzLnByaW1hcnlLZXlzID0ge307XG4gICAgdGhpcy5fcmVhZE9ubHlBdHRyaWJ1dGVzID0gbmV3IFNldCgpO1xuICAgIHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMgPSB7fTtcblxuICAgIC8vIHNldHVwIG5hbWVzIG9mIHRpbWVzdGFtcCBhdHRyaWJ1dGVzXG4gICAgaWYgKHRoaXMub3B0aW9ucy50aW1lc3RhbXBzKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmNyZWF0ZWRBdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy5jcmVhdGVkQXQgPSB0aGlzLm9wdGlvbnMuY3JlYXRlZEF0IHx8ICdjcmVhdGVkQXQnO1xuICAgICAgICB0aGlzLl9yZWFkT25seUF0dHJpYnV0ZXMuYWRkKHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0KTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudXBkYXRlZEF0ICE9PSBmYWxzZSkge1xuICAgICAgICB0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdCA9IHRoaXMub3B0aW9ucy51cGRhdGVkQXQgfHwgJ3VwZGF0ZWRBdCc7XG4gICAgICAgIHRoaXMuX3JlYWRPbmx5QXR0cmlidXRlcy5hZGQodGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXQpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXJhbm9pZCAmJiB0aGlzLm9wdGlvbnMuZGVsZXRlZEF0ICE9PSBmYWxzZSkge1xuICAgICAgICB0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdCA9IHRoaXMub3B0aW9ucy5kZWxldGVkQXQgfHwgJ2RlbGV0ZWRBdCc7XG4gICAgICAgIHRoaXMuX3JlYWRPbmx5QXR0cmlidXRlcy5hZGQodGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldHVwIG5hbWUgZm9yIHZlcnNpb24gYXR0cmlidXRlXG4gICAgaWYgKHRoaXMub3B0aW9ucy52ZXJzaW9uKSB7XG4gICAgICB0aGlzLl92ZXJzaW9uQXR0cmlidXRlID0gdHlwZW9mIHRoaXMub3B0aW9ucy52ZXJzaW9uID09PSAnc3RyaW5nJyA/IHRoaXMub3B0aW9ucy52ZXJzaW9uIDogJ3ZlcnNpb24nO1xuICAgICAgdGhpcy5fcmVhZE9ubHlBdHRyaWJ1dGVzLmFkZCh0aGlzLl92ZXJzaW9uQXR0cmlidXRlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9oYXNSZWFkT25seUF0dHJpYnV0ZXMgPSB0aGlzLl9yZWFkT25seUF0dHJpYnV0ZXMuc2l6ZSA+IDA7XG5cbiAgICAvLyBBZGQgaGVhZCBhbmQgdGFpbCBkZWZhdWx0IGF0dHJpYnV0ZXMgKGlkLCB0aW1lc3RhbXBzKVxuICAgIHRoaXMuX2FkZERlZmF1bHRBdHRyaWJ1dGVzKCk7XG4gICAgdGhpcy5yZWZyZXNoQXR0cmlidXRlcygpO1xuICAgIHRoaXMuX2ZpbmRBdXRvSW5jcmVtZW50QXR0cmlidXRlKCk7XG5cbiAgICB0aGlzLl9zY29wZSA9IHRoaXMub3B0aW9ucy5kZWZhdWx0U2NvcGU7XG4gICAgdGhpcy5fc2NvcGVOYW1lcyA9IFsnZGVmYXVsdFNjb3BlJ107XG5cbiAgICB0aGlzLnNlcXVlbGl6ZS5tb2RlbE1hbmFnZXIuYWRkTW9kZWwodGhpcyk7XG4gICAgdGhpcy5zZXF1ZWxpemUucnVuSG9va3MoJ2FmdGVyRGVmaW5lJywgdGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHN0YXRpYyByZWZyZXNoQXR0cmlidXRlcygpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVNYW5pcHVsYXRpb24gPSB7fTtcblxuICAgIHRoaXMucHJvdG90eXBlLl9jdXN0b21HZXR0ZXJzID0ge307XG4gICAgdGhpcy5wcm90b3R5cGUuX2N1c3RvbVNldHRlcnMgPSB7fTtcblxuICAgIFsnZ2V0JywgJ3NldCddLmZvckVhY2godHlwZSA9PiB7XG4gICAgICBjb25zdCBvcHQgPSBgJHt0eXBlfXRlck1ldGhvZHNgO1xuICAgICAgY29uc3QgZnVuY3MgPSBfLmNsb25lKF8uaXNPYmplY3QodGhpcy5vcHRpb25zW29wdF0pID8gdGhpcy5vcHRpb25zW29wdF0gOiB7fSk7XG4gICAgICBjb25zdCBfY3VzdG9tID0gdHlwZSA9PT0gJ2dldCcgPyB0aGlzLnByb3RvdHlwZS5fY3VzdG9tR2V0dGVycyA6IHRoaXMucHJvdG90eXBlLl9jdXN0b21TZXR0ZXJzO1xuXG4gICAgICBfLmVhY2goZnVuY3MsIChtZXRob2QsIGF0dHJpYnV0ZSkgPT4ge1xuICAgICAgICBfY3VzdG9tW2F0dHJpYnV0ZV0gPSBtZXRob2Q7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09ICdnZXQnKSB7XG4gICAgICAgICAgZnVuY3NbYXR0cmlidXRlXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KGF0dHJpYnV0ZSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ3NldCcpIHtcbiAgICAgICAgICBmdW5jc1thdHRyaWJ1dGVdID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldChhdHRyaWJ1dGUsIHZhbHVlKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgXy5lYWNoKHRoaXMucmF3QXR0cmlidXRlcywgKG9wdGlvbnMsIGF0dHJpYnV0ZSkgPT4ge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsIHR5cGUpKSB7XG4gICAgICAgICAgX2N1c3RvbVthdHRyaWJ1dGVdID0gb3B0aW9uc1t0eXBlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSAnZ2V0Jykge1xuICAgICAgICAgIGZ1bmNzW2F0dHJpYnV0ZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldChhdHRyaWJ1dGUpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdzZXQnKSB7XG4gICAgICAgICAgZnVuY3NbYXR0cmlidXRlXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXQoYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIF8uZWFjaChmdW5jcywgKGZjdCwgbmFtZSkgPT4ge1xuICAgICAgICBpZiAoIWF0dHJpYnV0ZU1hbmlwdWxhdGlvbltuYW1lXSkge1xuICAgICAgICAgIGF0dHJpYnV0ZU1hbmlwdWxhdGlvbltuYW1lXSA9IHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlidXRlTWFuaXB1bGF0aW9uW25hbWVdW3R5cGVdID0gZmN0O1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9kYXRhVHlwZUNoYW5nZXMgPSB7fTtcbiAgICB0aGlzLl9kYXRhVHlwZVNhbml0aXplcnMgPSB7fTtcblxuICAgIHRoaXMuX2hhc0Jvb2xlYW5BdHRyaWJ1dGVzID0gZmFsc2U7XG4gICAgdGhpcy5faGFzRGF0ZUF0dHJpYnV0ZXMgPSBmYWxzZTtcbiAgICB0aGlzLl9qc29uQXR0cmlidXRlcyA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLl92aXJ0dWFsQXR0cmlidXRlcyA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLl9kZWZhdWx0VmFsdWVzID0ge307XG4gICAgdGhpcy5wcm90b3R5cGUudmFsaWRhdG9ycyA9IHt9O1xuXG4gICAgdGhpcy5maWVsZFJhd0F0dHJpYnV0ZXNNYXAgPSB7fTtcblxuICAgIHRoaXMucHJpbWFyeUtleXMgPSB7fTtcbiAgICB0aGlzLnVuaXF1ZUtleXMgPSB7fTtcblxuICAgIF8uZWFjaCh0aGlzLnJhd0F0dHJpYnV0ZXMsIChkZWZpbml0aW9uLCBuYW1lKSA9PiB7XG4gICAgICBkZWZpbml0aW9uLnR5cGUgPSB0aGlzLnNlcXVlbGl6ZS5ub3JtYWxpemVEYXRhVHlwZShkZWZpbml0aW9uLnR5cGUpO1xuXG4gICAgICBkZWZpbml0aW9uLk1vZGVsID0gdGhpcztcbiAgICAgIGRlZmluaXRpb24uZmllbGROYW1lID0gbmFtZTtcbiAgICAgIGRlZmluaXRpb24uX21vZGVsQXR0cmlidXRlID0gdHJ1ZTtcblxuICAgICAgaWYgKGRlZmluaXRpb24uZmllbGQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkZWZpbml0aW9uLmZpZWxkID0gVXRpbHMudW5kZXJzY29yZWRJZihuYW1lLCB0aGlzLnVuZGVyc2NvcmVkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRlZmluaXRpb24ucHJpbWFyeUtleSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLnByaW1hcnlLZXlzW25hbWVdID0gZGVmaW5pdGlvbjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5maWVsZFJhd0F0dHJpYnV0ZXNNYXBbZGVmaW5pdGlvbi5maWVsZF0gPSBkZWZpbml0aW9uO1xuXG4gICAgICBpZiAoZGVmaW5pdGlvbi50eXBlLl9zYW5pdGl6ZSkge1xuICAgICAgICB0aGlzLl9kYXRhVHlwZVNhbml0aXplcnNbbmFtZV0gPSBkZWZpbml0aW9uLnR5cGUuX3Nhbml0aXplO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGVmaW5pdGlvbi50eXBlLl9pc0NoYW5nZWQpIHtcbiAgICAgICAgdGhpcy5fZGF0YVR5cGVDaGFuZ2VzW25hbWVdID0gZGVmaW5pdGlvbi50eXBlLl9pc0NoYW5nZWQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChkZWZpbml0aW9uLnR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuQk9PTEVBTikge1xuICAgICAgICB0aGlzLl9oYXNCb29sZWFuQXR0cmlidXRlcyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGRlZmluaXRpb24udHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5EQVRFIHx8IGRlZmluaXRpb24udHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5EQVRFT05MWSkge1xuICAgICAgICB0aGlzLl9oYXNEYXRlQXR0cmlidXRlcyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGRlZmluaXRpb24udHlwZSBpbnN0YW5jZW9mIERhdGFUeXBlcy5KU09OKSB7XG4gICAgICAgIHRoaXMuX2pzb25BdHRyaWJ1dGVzLmFkZChuYW1lKTtcbiAgICAgIH0gZWxzZSBpZiAoZGVmaW5pdGlvbi50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLlZJUlRVQUwpIHtcbiAgICAgICAgdGhpcy5fdmlydHVhbEF0dHJpYnV0ZXMuYWRkKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRlZmluaXRpb24sICdkZWZhdWx0VmFsdWUnKSkge1xuICAgICAgICB0aGlzLl9kZWZhdWx0VmFsdWVzW25hbWVdID0gKCkgPT4gVXRpbHMudG9EZWZhdWx0VmFsdWUoZGVmaW5pdGlvbi5kZWZhdWx0VmFsdWUsIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGVmaW5pdGlvbiwgJ3VuaXF1ZScpICYmIGRlZmluaXRpb24udW5pcXVlKSB7XG4gICAgICAgIGxldCBpZHhOYW1lO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdHlwZW9mIGRlZmluaXRpb24udW5pcXVlID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkZWZpbml0aW9uLnVuaXF1ZSwgJ25hbWUnKVxuICAgICAgICApIHtcbiAgICAgICAgICBpZHhOYW1lID0gZGVmaW5pdGlvbi51bmlxdWUubmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5pdGlvbi51bmlxdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaWR4TmFtZSA9IGRlZmluaXRpb24udW5pcXVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlkeE5hbWUgPSBgJHt0aGlzLnRhYmxlTmFtZX1fJHtuYW1lfV91bmlxdWVgO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy51bmlxdWVLZXlzW2lkeE5hbWVdIHx8IHsgZmllbGRzOiBbXSB9O1xuXG4gICAgICAgIGlkeC5maWVsZHMucHVzaChkZWZpbml0aW9uLmZpZWxkKTtcbiAgICAgICAgaWR4Lm1zZyA9IGlkeC5tc2cgfHwgZGVmaW5pdGlvbi51bmlxdWUubXNnIHx8IG51bGw7XG4gICAgICAgIGlkeC5uYW1lID0gaWR4TmFtZSB8fCBmYWxzZTtcbiAgICAgICAgaWR4LmNvbHVtbiA9IG5hbWU7XG4gICAgICAgIGlkeC5jdXN0b21JbmRleCA9IGRlZmluaXRpb24udW5pcXVlICE9PSB0cnVlO1xuXG4gICAgICAgIHRoaXMudW5pcXVlS2V5c1tpZHhOYW1lXSA9IGlkeDtcbiAgICAgIH1cblxuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkZWZpbml0aW9uLCAndmFsaWRhdGUnKSkge1xuICAgICAgICB0aGlzLnByb3RvdHlwZS52YWxpZGF0b3JzW25hbWVdID0gZGVmaW5pdGlvbi52YWxpZGF0ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRlZmluaXRpb24uaW5kZXggPT09IHRydWUgJiYgZGVmaW5pdGlvbi50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkpTT05CKSB7XG4gICAgICAgIHRoaXMuX2luZGV4ZXMucHVzaChcbiAgICAgICAgICBVdGlscy5uYW1lSW5kZXgoXG4gICAgICAgICAgICB0aGlzLl9jb25mb3JtSW5kZXgoe1xuICAgICAgICAgICAgICBmaWVsZHM6IFtkZWZpbml0aW9uLmZpZWxkIHx8IG5hbWVdLFxuICAgICAgICAgICAgICB1c2luZzogJ2dpbidcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdGhpcy5nZXRUYWJsZU5hbWUoKVxuICAgICAgICAgIClcbiAgICAgICAgKTtcblxuICAgICAgICBkZWxldGUgZGVmaW5pdGlvbi5pbmRleDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhIG1hcCBvZiBmaWVsZCB0byBhdHRyaWJ1dGUgbmFtZXNcbiAgICB0aGlzLmZpZWxkQXR0cmlidXRlTWFwID0gXy5yZWR1Y2UodGhpcy5maWVsZFJhd0F0dHJpYnV0ZXNNYXAsIChtYXAsIHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGlmIChrZXkgIT09IHZhbHVlLmZpZWxkTmFtZSkge1xuICAgICAgICBtYXBba2V5XSA9IHZhbHVlLmZpZWxkTmFtZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXA7XG4gICAgfSwge30pO1xuXG4gICAgdGhpcy5faGFzSnNvbkF0dHJpYnV0ZXMgPSAhIXRoaXMuX2pzb25BdHRyaWJ1dGVzLnNpemU7XG5cbiAgICB0aGlzLl9oYXNWaXJ0dWFsQXR0cmlidXRlcyA9ICEhdGhpcy5fdmlydHVhbEF0dHJpYnV0ZXMuc2l6ZTtcblxuICAgIHRoaXMuX2hhc0RlZmF1bHRWYWx1ZXMgPSAhXy5pc0VtcHR5KHRoaXMuX2RlZmF1bHRWYWx1ZXMpO1xuXG4gICAgdGhpcy50YWJsZUF0dHJpYnV0ZXMgPSBfLm9taXRCeSh0aGlzLnJhd0F0dHJpYnV0ZXMsIChfYSwga2V5KSA9PiB0aGlzLl92aXJ0dWFsQXR0cmlidXRlcy5oYXMoa2V5KSk7XG5cbiAgICB0aGlzLnByb3RvdHlwZS5faGFzQ3VzdG9tR2V0dGVycyA9IE9iamVjdC5rZXlzKHRoaXMucHJvdG90eXBlLl9jdXN0b21HZXR0ZXJzKS5sZW5ndGg7XG4gICAgdGhpcy5wcm90b3R5cGUuX2hhc0N1c3RvbVNldHRlcnMgPSBPYmplY3Qua2V5cyh0aGlzLnByb3RvdHlwZS5fY3VzdG9tU2V0dGVycykubGVuZ3RoO1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoYXR0cmlidXRlTWFuaXB1bGF0aW9uKSkge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChNb2RlbC5wcm90b3R5cGUsIGtleSkpIHtcbiAgICAgICAgdGhpcy5zZXF1ZWxpemUubG9nKGBOb3Qgb3ZlcnJpZGluZyBidWlsdC1pbiBtZXRob2QgZnJvbSBtb2RlbCBhdHRyaWJ1dGU6ICR7a2V5fWApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnByb3RvdHlwZSwga2V5LCBhdHRyaWJ1dGVNYW5pcHVsYXRpb25ba2V5XSk7XG4gICAgfVxuXG4gICAgdGhpcy5wcm90b3R5cGUucmF3QXR0cmlidXRlcyA9IHRoaXMucmF3QXR0cmlidXRlcztcbiAgICB0aGlzLnByb3RvdHlwZS5faXNBdHRyaWJ1dGUgPSBrZXkgPT4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMucHJvdG90eXBlLnJhd0F0dHJpYnV0ZXMsIGtleSk7XG5cbiAgICAvLyBQcmltYXJ5IGtleSBjb252ZW5pZW5jZSBjb25zdGlhYmxlc1xuICAgIHRoaXMucHJpbWFyeUtleUF0dHJpYnV0ZXMgPSBPYmplY3Qua2V5cyh0aGlzLnByaW1hcnlLZXlzKTtcbiAgICB0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGUgPSB0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGVzWzBdO1xuICAgIGlmICh0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGUpIHtcbiAgICAgIHRoaXMucHJpbWFyeUtleUZpZWxkID0gdGhpcy5yYXdBdHRyaWJ1dGVzW3RoaXMucHJpbWFyeUtleUF0dHJpYnV0ZV0uZmllbGQgfHwgdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlO1xuICAgIH1cblxuICAgIHRoaXMuX2hhc1ByaW1hcnlLZXlzID0gdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlcy5sZW5ndGggPiAwO1xuICAgIHRoaXMuX2lzUHJpbWFyeUtleSA9IGtleSA9PiB0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGVzLmluY2x1ZGVzKGtleSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGF0dHJpYnV0ZSBmcm9tIG1vZGVsIGRlZmluaXRpb25cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGF0dHJpYnV0ZSBuYW1lIG9mIGF0dHJpYnV0ZSB0byByZW1vdmVcbiAgICovXG4gIHN0YXRpYyByZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKSB7XG4gICAgZGVsZXRlIHRoaXMucmF3QXR0cmlidXRlc1thdHRyaWJ1dGVdO1xuICAgIHRoaXMucmVmcmVzaEF0dHJpYnV0ZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTeW5jIHRoaXMgTW9kZWwgdG8gdGhlIERCLCB0aGF0IGlzIGNyZWF0ZSB0aGUgdGFibGUuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gc3luYyBvcHRpb25zXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIFNlcXVlbGl6ZSNzeW5jfSBmb3Igb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbD59XG4gICAqL1xuICBzdGF0aWMgc3luYyhvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgb3B0aW9ucy5ob29rcyA9IG9wdGlvbnMuaG9va3MgPT09IHVuZGVmaW5lZCA/IHRydWUgOiAhIW9wdGlvbnMuaG9va3M7XG5cbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gdGhpcy50YWJsZUF0dHJpYnV0ZXM7XG4gICAgY29uc3QgcmF3QXR0cmlidXRlcyA9IHRoaXMuZmllbGRSYXdBdHRyaWJ1dGVzTWFwO1xuXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdiZWZvcmVTeW5jJywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBpZiAob3B0aW9ucy5mb3JjZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kcm9wKG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmNyZWF0ZVRhYmxlKHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBhdHRyaWJ1dGVzLCBvcHRpb25zLCB0aGlzKSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKCFvcHRpb25zLmFsdGVyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgdGhpcy5RdWVyeUludGVyZmFjZS5kZXNjcmliZVRhYmxlKHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpKSxcbiAgICAgICAgICB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmdldEZvcmVpZ25LZXlSZWZlcmVuY2VzRm9yVGFibGUodGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucykpXG4gICAgICAgIF0pXG4gICAgICAgICAgLnRoZW4odGFibGVJbmZvcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb2x1bW5zID0gdGFibGVJbmZvc1swXTtcbiAgICAgICAgICAgIC8vIFVzZSBmb3IgYWx0ZXIgZm9yZWlnbiBrZXlzXG4gICAgICAgICAgICBjb25zdCBmb3JlaWduS2V5UmVmZXJlbmNlcyA9IHRhYmxlSW5mb3NbMV07XG5cbiAgICAgICAgICAgIGNvbnN0IGNoYW5nZXMgPSBbXTsgLy8gYXJyYXkgb2YgcHJvbWlzZXMgdG8gcnVuXG4gICAgICAgICAgICBjb25zdCByZW1vdmVkQ29uc3RyYWludHMgPSB7fTtcblxuICAgICAgICAgICAgXy5lYWNoKGF0dHJpYnV0ZXMsIChjb2x1bW5EZXNjLCBjb2x1bW5OYW1lKSA9PiB7XG4gICAgICAgICAgICAgIGlmICghY29sdW1uc1tjb2x1bW5OYW1lXSAmJiAhY29sdW1uc1thdHRyaWJ1dGVzW2NvbHVtbk5hbWVdLmZpZWxkXSkge1xuICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCgoKSA9PiB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmFkZENvbHVtbih0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSwgYXR0cmlidXRlc1tjb2x1bW5OYW1lXS5maWVsZCB8fCBjb2x1bW5OYW1lLCBhdHRyaWJ1dGVzW2NvbHVtbk5hbWVdKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXy5lYWNoKGNvbHVtbnMsIChjb2x1bW5EZXNjLCBjb2x1bW5OYW1lKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRBdHRyaWJ1dGUgPSByYXdBdHRyaWJ1dGVzW2NvbHVtbk5hbWVdO1xuICAgICAgICAgICAgICBpZiAoIWN1cnJlbnRBdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2goKCkgPT4gdGhpcy5RdWVyeUludGVyZmFjZS5yZW1vdmVDb2x1bW4odGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucyksIGNvbHVtbk5hbWUsIG9wdGlvbnMpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICghY3VycmVudEF0dHJpYnV0ZS5wcmltYXJ5S2V5KSB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yZWlnbiBrZXlzLiBJZiBpdCdzIGEgZm9yZWlnbiBrZXksIGl0IHNob3VsZCByZW1vdmUgY29uc3RyYWludCBmaXJzdC5cbiAgICAgICAgICAgICAgICBjb25zdCByZWZlcmVuY2VzID0gY3VycmVudEF0dHJpYnV0ZS5yZWZlcmVuY2VzO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50QXR0cmlidXRlLnJlZmVyZW5jZXMpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gdGhpcy5zZXF1ZWxpemUuY29uZmlnLmRhdGFiYXNlO1xuICAgICAgICAgICAgICAgICAgY29uc3Qgc2NoZW1hID0gdGhpcy5zZXF1ZWxpemUuY29uZmlnLnNjaGVtYTtcbiAgICAgICAgICAgICAgICAgIC8vIEZpbmQgZXhpc3RlZCBmb3JlaWduIGtleXNcbiAgICAgICAgICAgICAgICAgIF8uZWFjaChmb3JlaWduS2V5UmVmZXJlbmNlcywgZm9yZWlnbktleVJlZmVyZW5jZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnN0cmFpbnROYW1lID0gZm9yZWlnbktleVJlZmVyZW5jZS5jb25zdHJhaW50TmFtZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEhY29uc3RyYWludE5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAmJiBmb3JlaWduS2V5UmVmZXJlbmNlLnRhYmxlQ2F0YWxvZyA9PT0gZGF0YWJhc2VcbiAgICAgICAgICAgICAgICAgICAgICAmJiAoc2NoZW1hID8gZm9yZWlnbktleVJlZmVyZW5jZS50YWJsZVNjaGVtYSA9PT0gc2NoZW1hIDogdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAmJiBmb3JlaWduS2V5UmVmZXJlbmNlLnJlZmVyZW5jZWRUYWJsZU5hbWUgPT09IHJlZmVyZW5jZXMubW9kZWxcbiAgICAgICAgICAgICAgICAgICAgICAmJiBmb3JlaWduS2V5UmVmZXJlbmNlLnJlZmVyZW5jZWRDb2x1bW5OYW1lID09PSByZWZlcmVuY2VzLmtleVxuICAgICAgICAgICAgICAgICAgICAgICYmIChzY2hlbWEgPyBmb3JlaWduS2V5UmVmZXJlbmNlLnJlZmVyZW5jZWRUYWJsZVNjaGVtYSA9PT0gc2NoZW1hIDogdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAmJiAhcmVtb3ZlZENvbnN0cmFpbnRzW2NvbnN0cmFpbnROYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBjb25zdHJhaW50IG9uIGZvcmVpZ24ga2V5cy5cbiAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2goKCkgPT4gdGhpcy5RdWVyeUludGVyZmFjZS5yZW1vdmVDb25zdHJhaW50KHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBjb25zdHJhaW50TmFtZSwgb3B0aW9ucykpO1xuICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWRDb25zdHJhaW50c1tjb25zdHJhaW50TmFtZV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoKCgpID0+IHRoaXMuUXVlcnlJbnRlcmZhY2UuY2hhbmdlQ29sdW1uKHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBjb2x1bW5OYW1lLCBjdXJyZW50QXR0cmlidXRlKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuZWFjaChjaGFuZ2VzLCBmID0+IGYoKSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5RdWVyeUludGVyZmFjZS5zaG93SW5kZXgodGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucyksIG9wdGlvbnMpKVxuICAgICAgLnRoZW4oaW5kZXhlcyA9PiB7XG4gICAgICAgIGluZGV4ZXMgPSB0aGlzLl9pbmRleGVzLmZpbHRlcihpdGVtMSA9PlxuICAgICAgICAgICFpbmRleGVzLnNvbWUoaXRlbTIgPT4gaXRlbTEubmFtZSA9PT0gaXRlbTIubmFtZSlcbiAgICAgICAgKS5zb3J0KChpbmRleDEsIGluZGV4MikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QgPT09ICdwb3N0Z3JlcycpIHtcbiAgICAgICAgICAvLyBtb3ZlIGNvbmN1cnJlbnQgaW5kZXhlcyB0byB0aGUgYm90dG9tIHRvIGF2b2lkIHdlaXJkIGRlYWRsb2Nrc1xuICAgICAgICAgICAgaWYgKGluZGV4MS5jb25jdXJyZW50bHkgPT09IHRydWUpIHJldHVybiAxO1xuICAgICAgICAgICAgaWYgKGluZGV4Mi5jb25jdXJyZW50bHkgPT09IHRydWUpIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuZWFjaChpbmRleGVzLCBpbmRleCA9PiB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmFkZEluZGV4KFxuICAgICAgICAgIHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLFxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgbG9nZ2luZzogb3B0aW9ucy5sb2dnaW5nLFxuICAgICAgICAgICAgYmVuY2htYXJrOiBvcHRpb25zLmJlbmNobWFyayxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uOiBvcHRpb25zLnRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgc2NoZW1hOiBvcHRpb25zLnNjaGVtYVxuICAgICAgICAgIH0sIGluZGV4KSxcbiAgICAgICAgICB0aGlzLnRhYmxlTmFtZVxuICAgICAgICApKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdhZnRlclN5bmMnLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgfSkucmV0dXJuKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyb3AgdGhlIHRhYmxlIHJlcHJlc2VudGVkIGJ5IHRoaXMgTW9kZWxcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgW29wdGlvbnNdIGRyb3Agb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5jYXNjYWRlPWZhbHNlXSAgIEFsc28gZHJvcCBhbGwgb2JqZWN0cyBkZXBlbmRpbmcgb24gdGhpcyB0YWJsZSwgc3VjaCBhcyB2aWV3cy4gT25seSB3b3JrcyBpbiBwb3N0Z3Jlc1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSAgIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHN0YXRpYyBkcm9wKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5RdWVyeUludGVyZmFjZS5kcm9wVGFibGUodGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucyksIG9wdGlvbnMpO1xuICB9XG5cbiAgc3RhdGljIGRyb3BTY2hlbWEoc2NoZW1hKSB7XG4gICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UuZHJvcFNjaGVtYShzY2hlbWEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IGEgc2NoZW1hIHRvIHRoaXMgbW9kZWwuIEZvciBwb3N0Z3JlcywgdGhpcyB3aWxsIGFjdHVhbGx5IHBsYWNlIHRoZSBzY2hlbWEgaW4gZnJvbnQgb2YgdGhlIHRhYmxlIG5hbWUgLSBgXCJzY2hlbWFcIi5cInRhYmxlTmFtZVwiYCxcbiAgICogd2hpbGUgdGhlIHNjaGVtYSB3aWxsIGJlIHByZXBlbmRlZCB0byB0aGUgdGFibGUgbmFtZSBmb3IgbXlzcWwgYW5kIHNxbGl0ZSAtIGAnc2NoZW1hLnRhYmxlbmFtZSdgLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnRlbmRlZCBmb3IgdXNlIGNhc2VzIHdoZXJlIHRoZSBzYW1lIG1vZGVsIGlzIG5lZWRlZCBpbiBtdWx0aXBsZSBzY2hlbWFzLiBJbiBzdWNoIGEgdXNlIGNhc2UgaXQgaXMgaW1wb3J0YW50XG4gICAqIHRvIGNhbGwgYG1vZGVsLnNjaGVtYShzY2hlbWEsIFtvcHRpb25zXSkuc3luYygpYCBmb3IgZWFjaCBtb2RlbCB0byBlbnN1cmUgdGhlIG1vZGVscyBhcmUgY3JlYXRlZCBpbiB0aGUgY29ycmVjdCBzY2hlbWEuXG4gICAqXG4gICAqIElmIGEgc2luZ2xlIGRlZmF1bHQgc2NoZW1hIHBlciBtb2RlbCBpcyBuZWVkZWQsIHNldCB0aGUgYG9wdGlvbnMuc2NoZW1hPSdzY2hlbWEnYCBwYXJhbWV0ZXIgZHVyaW5nIHRoZSBgZGVmaW5lKClgIGNhbGxcbiAgICogZm9yIHRoZSBtb2RlbC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgc2NoZW1hIFRoZSBuYW1lIG9mIHRoZSBzY2hlbWFcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgW29wdGlvbnNdIHNjaGVtYSBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLnNjaGVtYURlbGltaXRlcj0nLiddIFRoZSBjaGFyYWN0ZXIocykgdGhhdCBzZXBhcmF0ZXMgdGhlIHNjaGVtYSBuYW1lIGZyb20gdGhlIHRhYmxlIG5hbWVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gIFtvcHRpb25zLmJlbmNobWFyaz1mYWxzZV0gUGFzcyBxdWVyeSBleGVjdXRpb24gdGltZSBpbiBtaWxsaXNlY29uZHMgYXMgc2Vjb25kIGFyZ3VtZW50IHRvIGxvZ2dpbmcgZnVuY3Rpb24gKG9wdGlvbnMubG9nZ2luZykuXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIFNlcXVlbGl6ZSNkZWZpbmV9IGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHNldHRpbmcgYSBkZWZhdWx0IHNjaGVtYS5cbiAgICpcbiAgICogQHJldHVybnMge01vZGVsfVxuICAgKi9cbiAgc3RhdGljIHNjaGVtYShzY2hlbWEsIG9wdGlvbnMpIHtcblxuICAgIGNvbnN0IGNsb25lID0gY2xhc3MgZXh0ZW5kcyB0aGlzIHt9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbG9uZSwgJ25hbWUnLCB7IHZhbHVlOiB0aGlzLm5hbWUgfSk7XG5cbiAgICBjbG9uZS5fc2NoZW1hID0gc2NoZW1hO1xuXG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY2xvbmUuX3NjaGVtYURlbGltaXRlciA9IG9wdGlvbnM7XG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuc2NoZW1hRGVsaW1pdGVyKSB7XG4gICAgICAgIGNsb25lLl9zY2hlbWFEZWxpbWl0ZXIgPSBvcHRpb25zLnNjaGVtYURlbGltaXRlcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB0YWJsZSBuYW1lIG9mIHRoZSBtb2RlbCwgdGFraW5nIHNjaGVtYSBpbnRvIGFjY291bnQuIFRoZSBtZXRob2Qgd2lsbCByZXR1cm4gVGhlIG5hbWUgYXMgYSBzdHJpbmcgaWYgdGhlIG1vZGVsIGhhcyBubyBzY2hlbWEsXG4gICAqIG9yIGFuIG9iamVjdCB3aXRoIGB0YWJsZU5hbWVgLCBgc2NoZW1hYCBhbmQgYGRlbGltaXRlcmAgcHJvcGVydGllcy5cbiAgICpcbiAgICogQHJldHVybnMge3N0cmluZ3xPYmplY3R9XG4gICAqL1xuICBzdGF0aWMgZ2V0VGFibGVOYW1lKCkge1xuICAgIHJldHVybiB0aGlzLlF1ZXJ5R2VuZXJhdG9yLmFkZFNjaGVtYSh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdW4tc2NvcGVkIG1vZGVsXG4gICAqXG4gICAqIEByZXR1cm5zIHtNb2RlbH1cbiAgICovXG4gIHN0YXRpYyB1bnNjb3BlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5zY29wZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBzY29wZSB0byB0aGUgbW9kZWwuIFRoaXMgaXMgZXNwZWNpYWxseSB1c2VmdWwgZm9yIGFkZGluZyBzY29wZXMgd2l0aCBpbmNsdWRlcywgd2hlbiB0aGUgbW9kZWwgeW91IHdhbnQgdG8gaW5jbHVkZSBpcyBub3QgYXZhaWxhYmxlIGF0IHRoZSB0aW1lIHRoaXMgbW9kZWwgaXMgZGVmaW5lZC5cbiAgICpcbiAgICogQnkgZGVmYXVsdCB0aGlzIHdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgYSBzY29wZSB3aXRoIHRoYXQgbmFtZSBhbHJlYWR5IGV4aXN0cy4gUGFzcyBgb3ZlcnJpZGU6IHRydWVgIGluIHRoZSBvcHRpb25zIG9iamVjdCB0byBzaWxlbmNlIHRoaXMgZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICBuYW1lIFRoZSBuYW1lIG9mIHRoZSBzY29wZS4gVXNlIGBkZWZhdWx0U2NvcGVgIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IHNjb3BlXG4gICAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBzY29wZSBzY29wZSBvciBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICBbb3B0aW9uc10gc2NvcGUgb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMub3ZlcnJpZGU9ZmFsc2VdIG92ZXJyaWRlIG9sZCBzY29wZSBpZiBhbHJlYWR5IGRlZmluZWRcbiAgICovXG4gIHN0YXRpYyBhZGRTY29wZShuYW1lLCBzY29wZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIG92ZXJyaWRlOiBmYWxzZVxuICAgIH0sIG9wdGlvbnMpO1xuXG4gICAgaWYgKChuYW1lID09PSAnZGVmYXVsdFNjb3BlJyAmJiBPYmplY3Qua2V5cyh0aGlzLm9wdGlvbnMuZGVmYXVsdFNjb3BlKS5sZW5ndGggPiAwIHx8IG5hbWUgaW4gdGhpcy5vcHRpb25zLnNjb3BlcykgJiYgb3B0aW9ucy5vdmVycmlkZSA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHNjb3BlICR7bmFtZX0gYWxyZWFkeSBleGlzdHMuIFBhc3MgeyBvdmVycmlkZTogdHJ1ZSB9IGFzIG9wdGlvbnMgdG8gc2lsZW5jZSB0aGlzIGVycm9yYCk7XG4gICAgfVxuXG4gICAgaWYgKG5hbWUgPT09ICdkZWZhdWx0U2NvcGUnKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZGVmYXVsdFNjb3BlID0gdGhpcy5fc2NvcGUgPSBzY29wZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcHRpb25zLnNjb3Blc1tuYW1lXSA9IHNjb3BlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBseSBhIHNjb3BlIGNyZWF0ZWQgaW4gYGRlZmluZWAgdG8gdGhlIG1vZGVsLlxuICAgKlxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5ob3cgdG8gY3JlYXRlIHNjb3BlczwvY2FwdGlvbj5cbiAgICogY29uc3QgTW9kZWwgPSBzZXF1ZWxpemUuZGVmaW5lKCdtb2RlbCcsIGF0dHJpYnV0ZXMsIHtcbiAgICogICBkZWZhdWx0U2NvcGU6IHtcbiAgICogICAgIHdoZXJlOiB7XG4gICAqICAgICAgIHVzZXJuYW1lOiAnZGFuJ1xuICAgKiAgICAgfSxcbiAgICogICAgIGxpbWl0OiAxMlxuICAgKiAgIH0sXG4gICAqICAgc2NvcGVzOiB7XG4gICAqICAgICBpc0FMaWU6IHtcbiAgICogICAgICAgd2hlcmU6IHtcbiAgICogICAgICAgICBzdHVmZjogJ2Nha2UnXG4gICAqICAgICAgIH1cbiAgICogICAgIH0sXG4gICAqICAgICBjb21wbGV4RnVuY3Rpb246IGZ1bmN0aW9uKGVtYWlsLCBhY2Nlc3NMZXZlbCkge1xuICAgKiAgICAgICByZXR1cm4ge1xuICAgKiAgICAgICAgIHdoZXJlOiB7XG4gICAqICAgICAgICAgICBlbWFpbDoge1xuICAgKiAgICAgICAgICAgICBbT3AubGlrZV06IGVtYWlsXG4gICAqICAgICAgICAgICB9LFxuICAgKiAgICAgICAgICAgYWNjZXNzX2xldmVsIHtcbiAgICogICAgICAgICAgICAgW09wLmd0ZV06IGFjY2Vzc0xldmVsXG4gICAqICAgICAgICAgICB9XG4gICAqICAgICAgICAgfVxuICAgKiAgICAgICB9XG4gICAqICAgICB9XG4gICAqICAgfVxuICAgKiB9KVxuICAgKlxuICAgKiAjIEFzIHlvdSBoYXZlIGRlZmluZWQgYSBkZWZhdWx0IHNjb3BlLCBldmVyeSB0aW1lIHlvdSBkbyBNb2RlbC5maW5kLCB0aGUgZGVmYXVsdCBzY29wZSBpcyBhcHBlbmRlZCB0byB5b3VyIHF1ZXJ5LiBIZXJlJ3MgYSBjb3VwbGUgb2YgZXhhbXBsZXM6XG4gICAqXG4gICAqIE1vZGVsLmZpbmRBbGwoKSAvLyBXSEVSRSB1c2VybmFtZSA9ICdkYW4nXG4gICAqIE1vZGVsLmZpbmRBbGwoeyB3aGVyZTogeyBhZ2U6IHsgW09wLmd0XTogMTIgfSB9IH0pIC8vIFdIRVJFIGFnZSA+IDEyIEFORCB1c2VybmFtZSA9ICdkYW4nXG4gICAqXG4gICAqIEBleGFtcGxlIDxjYXB0aW9uPlRvIGludm9rZSBzY29wZSBmdW5jdGlvbnMgeW91IGNhbiBkbzwvY2FwdGlvbj5cbiAgICogTW9kZWwuc2NvcGUoeyBtZXRob2Q6IFsnY29tcGxleEZ1bmN0aW9uJywgJ2RhbkBzZXF1ZWxpemUuY29tJywgNDJdfSkuZmluZEFsbCgpXG4gICAqIC8vIFdIRVJFIGVtYWlsIGxpa2UgJ2RhbkBzZXF1ZWxpemUuY29tJScgQU5EIGFjY2Vzc19sZXZlbCA+PSA0MlxuICAgKlxuICAgKiBAcGFyYW0gez9BcnJheXxPYmplY3R8c3RyaW5nfSBbb3B0aW9uXSBUaGUgc2NvcGUocykgdG8gYXBwbHkuIFNjb3BlcyBjYW4gZWl0aGVyIGJlIHBhc3NlZCBhcyBjb25zZWN1dGl2ZSBhcmd1bWVudHMsIG9yIGFzIGFuIGFycmF5IG9mIGFyZ3VtZW50cy4gVG8gYXBwbHkgc2ltcGxlIHNjb3BlcyBhbmQgc2NvcGUgZnVuY3Rpb25zIHdpdGggbm8gYXJndW1lbnRzLCBwYXNzIHRoZW0gYXMgc3RyaW5ncy4gRm9yIHNjb3BlIGZ1bmN0aW9uLCBwYXNzIGFuIG9iamVjdCwgd2l0aCBhIGBtZXRob2RgIHByb3BlcnR5LiBUaGUgdmFsdWUgY2FuIGVpdGhlciBiZSBhIHN0cmluZywgaWYgdGhlIG1ldGhvZCBkb2VzIG5vdCB0YWtlIGFueSBhcmd1bWVudHMsIG9yIGFuIGFycmF5LCB3aGVyZSB0aGUgZmlyc3QgZWxlbWVudCBpcyB0aGUgbmFtZSBvZiB0aGUgbWV0aG9kLCBhbmQgY29uc2VjdXRpdmUgZWxlbWVudHMgYXJlIGFyZ3VtZW50cyB0byB0aGF0IG1ldGhvZC4gUGFzcyBudWxsIHRvIHJlbW92ZSBhbGwgc2NvcGVzLCBpbmNsdWRpbmcgdGhlIGRlZmF1bHQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtNb2RlbH0gQSByZWZlcmVuY2UgdG8gdGhlIG1vZGVsLCB3aXRoIHRoZSBzY29wZShzKSBhcHBsaWVkLiBDYWxsaW5nIHNjb3BlIGFnYWluIG9uIHRoZSByZXR1cm5lZCBtb2RlbCB3aWxsIGNsZWFyIHRoZSBwcmV2aW91cyBzY29wZS5cbiAgICovXG4gIHN0YXRpYyBzY29wZShvcHRpb24pIHtcbiAgICBjb25zdCBzZWxmID0gY2xhc3MgZXh0ZW5kcyB0aGlzIHt9O1xuICAgIGxldCBzY29wZTtcbiAgICBsZXQgc2NvcGVOYW1lO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNlbGYsICduYW1lJywgeyB2YWx1ZTogdGhpcy5uYW1lIH0pO1xuXG4gICAgc2VsZi5fc2NvcGUgPSB7fTtcbiAgICBzZWxmLl9zY29wZU5hbWVzID0gW107XG4gICAgc2VsZi5zY29wZWQgPSB0cnVlO1xuXG4gICAgaWYgKCFvcHRpb24pIHtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIGNvbnN0IG9wdGlvbnMgPSBfLmZsYXR0ZW4oYXJndW1lbnRzKTtcblxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICAgIHNjb3BlID0gbnVsbDtcbiAgICAgIHNjb3BlTmFtZSA9IG51bGw7XG5cbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3Qob3B0aW9uKSkge1xuICAgICAgICBpZiAob3B0aW9uLm1ldGhvZCkge1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbi5tZXRob2QpICYmICEhc2VsZi5vcHRpb25zLnNjb3Blc1tvcHRpb24ubWV0aG9kWzBdXSkge1xuICAgICAgICAgICAgc2NvcGVOYW1lID0gb3B0aW9uLm1ldGhvZFswXTtcbiAgICAgICAgICAgIHNjb3BlID0gc2VsZi5vcHRpb25zLnNjb3Blc1tzY29wZU5hbWVdLmFwcGx5KHNlbGYsIG9wdGlvbi5tZXRob2Quc2xpY2UoMSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzZWxmLm9wdGlvbnMuc2NvcGVzW29wdGlvbi5tZXRob2RdKSB7XG4gICAgICAgICAgICBzY29wZU5hbWUgPSBvcHRpb24ubWV0aG9kO1xuICAgICAgICAgICAgc2NvcGUgPSBzZWxmLm9wdGlvbnMuc2NvcGVzW3Njb3BlTmFtZV0uYXBwbHkoc2VsZik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNjb3BlID0gb3B0aW9uO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbiA9PT0gJ2RlZmF1bHRTY29wZScgJiYgXy5pc1BsYWluT2JqZWN0KHNlbGYub3B0aW9ucy5kZWZhdWx0U2NvcGUpKSB7XG4gICAgICAgIHNjb3BlID0gc2VsZi5vcHRpb25zLmRlZmF1bHRTY29wZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjb3BlTmFtZSA9IG9wdGlvbjtcbiAgICAgICAgc2NvcGUgPSBzZWxmLm9wdGlvbnMuc2NvcGVzW3Njb3BlTmFtZV07XG4gICAgICAgIGlmICh0eXBlb2Ygc2NvcGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzY29wZSA9IHNjb3BlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNjb3BlKSB7XG4gICAgICAgIHRoaXMuX2NvbmZvcm1JbmNsdWRlcyhzY29wZSwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2Fzc2lnbk9wdGlvbnMoc2VsZi5fc2NvcGUsIHNjb3BlKTtcbiAgICAgICAgc2VsZi5fc2NvcGVOYW1lcy5wdXNoKHNjb3BlTmFtZSA/IHNjb3BlTmFtZSA6ICdkZWZhdWx0U2NvcGUnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuU2VxdWVsaXplU2NvcGVFcnJvcihgSW52YWxpZCBzY29wZSAke3Njb3BlTmFtZX0gY2FsbGVkLmApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaCBmb3IgbXVsdGlwbGUgaW5zdGFuY2VzLlxuICAgKlxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5TaW1wbGUgc2VhcmNoIHVzaW5nIEFORCBhbmQgPTwvY2FwdGlvbj5cbiAgICogTW9kZWwuZmluZEFsbCh7XG4gICAqICAgd2hlcmU6IHtcbiAgICogICAgIGF0dHIxOiA0MixcbiAgICogICAgIGF0dHIyOiAnY2FrZSdcbiAgICogICB9XG4gICAqIH0pXG4gICAqXG4gICAqICMgV0hFUkUgYXR0cjEgPSA0MiBBTkQgYXR0cjIgPSAnY2FrZSdcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+VXNpbmcgZ3JlYXRlciB0aGFuLCBsZXNzIHRoYW4gZXRjLjwvY2FwdGlvbj5cbiAgICogY29uc3Qge2d0LCBsdGUsIG5lLCBpbjogb3BJbn0gPSBTZXF1ZWxpemUuT3A7XG4gICAqXG4gICAqIE1vZGVsLmZpbmRBbGwoe1xuICAgKiAgIHdoZXJlOiB7XG4gICAqICAgICBhdHRyMToge1xuICAgKiAgICAgICBbZ3RdOiA1MFxuICAgKiAgICAgfSxcbiAgICogICAgIGF0dHIyOiB7XG4gICAqICAgICAgIFtsdGVdOiA0NVxuICAgKiAgICAgfSxcbiAgICogICAgIGF0dHIzOiB7XG4gICAqICAgICAgIFtvcEluXTogWzEsMiwzXVxuICAgKiAgICAgfSxcbiAgICogICAgIGF0dHI0OiB7XG4gICAqICAgICAgIFtuZV06IDVcbiAgICogICAgIH1cbiAgICogICB9XG4gICAqIH0pXG4gICAqXG4gICAqICMgV0hFUkUgYXR0cjEgPiA1MCBBTkQgYXR0cjIgPD0gNDUgQU5EIGF0dHIzIElOICgxLDIsMykgQU5EIGF0dHI0ICE9IDVcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+UXVlcmllcyB1c2luZyBPUjwvY2FwdGlvbj5cbiAgICogY29uc3Qge29yLCBhbmQsIGd0LCBsdH0gPSBTZXF1ZWxpemUuT3A7XG4gICAqXG4gICAqIE1vZGVsLmZpbmRBbGwoe1xuICAgKiAgIHdoZXJlOiB7XG4gICAqICAgICBuYW1lOiAnYSBwcm9qZWN0JyxcbiAgICogICAgIFtvcl06IFtcbiAgICogICAgICAge2lkOiBbMSwgMiwgM119LFxuICAgKiAgICAgICB7XG4gICAqICAgICAgICAgW2FuZF06IFtcbiAgICogICAgICAgICAgIHtpZDoge1tndF06IDEwfX0sXG4gICAqICAgICAgICAgICB7aWQ6IHtbbHRdOiAxMDB9fVxuICAgKiAgICAgICAgIF1cbiAgICogICAgICAgfVxuICAgKiAgICAgXVxuICAgKiAgIH1cbiAgICogfSk7XG4gICAqXG4gICAqICMgV0hFUkUgYE1vZGVsYC5gbmFtZWAgPSAnYSBwcm9qZWN0JyBBTkQgKGBNb2RlbGAuYGlkYCBJTiAoMSwgMiwgMykgT1IgKGBNb2RlbGAuYGlkYCA+IDEwIEFORCBgTW9kZWxgLmBpZGAgPCAxMDApKTtcbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgT3BlcmF0b3JzfSBmb3IgcG9zc2libGUgb3BlcmF0b3JzXG4gICAqIF9fQWxpYXNfXzogX2FsbF9cbiAgICpcbiAgICogVGhlIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aCBhbiBhcnJheSBvZiBNb2RlbCBpbnN0YW5jZXMgaWYgdGhlIHF1ZXJ5IHN1Y2NlZWRzLl9cbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9uc10gQSBoYXNoIG9mIG9wdGlvbnMgdG8gZGVzY3JpYmUgdGhlIHNjb3BlIG9mIHRoZSBzZWFyY2hcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy53aGVyZV0gQSBoYXNoIG9mIGF0dHJpYnV0ZXMgdG8gZGVzY3JpYmUgeW91ciBzZWFyY2guIFNlZSBhYm92ZSBmb3IgZXhhbXBsZXMuXG4gICAqIEBwYXJhbSAge0FycmF5PHN0cmluZz58T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuYXR0cmlidXRlc10gQSBsaXN0IG9mIHRoZSBhdHRyaWJ1dGVzIHRoYXQgeW91IHdhbnQgdG8gc2VsZWN0LCBvciBhbiBvYmplY3Qgd2l0aCBgaW5jbHVkZWAgYW5kIGBleGNsdWRlYCBrZXlzLiBUbyByZW5hbWUgYW4gYXR0cmlidXRlLCB5b3UgY2FuIHBhc3MgYW4gYXJyYXksIHdpdGggdHdvIGVsZW1lbnRzIC0gdGhlIGZpcnN0IGlzIHRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgaW4gdGhlIERCIChvciBzb21lIGtpbmQgb2YgZXhwcmVzc2lvbiBzdWNoIGFzIGBTZXF1ZWxpemUubGl0ZXJhbGAsIGBTZXF1ZWxpemUuZm5gIGFuZCBzbyBvbiksIGFuZCB0aGUgc2Vjb25kIGlzIHRoZSBuYW1lIHlvdSB3YW50IHRoZSBhdHRyaWJ1dGUgdG8gaGF2ZSBpbiB0aGUgcmV0dXJuZWQgaW5zdGFuY2VcbiAgICogQHBhcmFtICB7QXJyYXk8c3RyaW5nPn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5hdHRyaWJ1dGVzLmluY2x1ZGVdIFNlbGVjdCBhbGwgdGhlIGF0dHJpYnV0ZXMgb2YgdGhlIG1vZGVsLCBwbHVzIHNvbWUgYWRkaXRpb25hbCBvbmVzLiBVc2VmdWwgZm9yIGFnZ3JlZ2F0aW9ucywgZS5nLiBgeyBhdHRyaWJ1dGVzOiB7IGluY2x1ZGU6IFtbc2VxdWVsaXplLmZuKCdDT1VOVCcsIHNlcXVlbGl6ZS5jb2woJ2lkJykpLCAndG90YWwnXV0gfWBcbiAgICogQHBhcmFtICB7QXJyYXk8c3RyaW5nPn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5hdHRyaWJ1dGVzLmV4Y2x1ZGVdIFNlbGVjdCBhbGwgdGhlIGF0dHJpYnV0ZXMgb2YgdGhlIG1vZGVsLCBleGNlcHQgc29tZSBmZXcuIFVzZWZ1bCBmb3Igc2VjdXJpdHkgcHVycG9zZXMgZS5nLiBgeyBhdHRyaWJ1dGVzOiB7IGV4Y2x1ZGU6IFsncGFzc3dvcmQnXSB9IH1gXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMucGFyYW5vaWQ9dHJ1ZV0gSWYgdHJ1ZSwgb25seSBub24tZGVsZXRlZCByZWNvcmRzIHdpbGwgYmUgcmV0dXJuZWQuIElmIGZhbHNlLCBib3RoIGRlbGV0ZWQgYW5kIG5vbi1kZWxldGVkIHJlY29yZHMgd2lsbCBiZSByZXR1cm5lZC4gT25seSBhcHBsaWVzIGlmIGBvcHRpb25zLnBhcmFub2lkYCBpcyB0cnVlIGZvciB0aGUgbW9kZWwuXG4gICAqIEBwYXJhbSAge0FycmF5PE9iamVjdHxNb2RlbHxzdHJpbmc+fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZV0gQSBsaXN0IG9mIGFzc29jaWF0aW9ucyB0byBlYWdlcmx5IGxvYWQgdXNpbmcgYSBsZWZ0IGpvaW4uIFN1cHBvcnRlZCBpcyBlaXRoZXIgYHsgaW5jbHVkZTogWyBNb2RlbDEsIE1vZGVsMiwgLi4uXX1gIG9yIGB7IGluY2x1ZGU6IFt7IG1vZGVsOiBNb2RlbDEsIGFzOiAnQWxpYXMnIH1dfWAgb3IgYHsgaW5jbHVkZTogWydBbGlhcyddfWAuIElmIHlvdXIgYXNzb2NpYXRpb24gYXJlIHNldCB1cCB3aXRoIGFuIGBhc2AgKGVnLiBgWC5oYXNNYW55KFksIHsgYXM6ICdaIH1gLCB5b3UgbmVlZCB0byBzcGVjaWZ5IFogaW4gdGhlIGFzIGF0dHJpYnV0ZSB3aGVuIGVhZ2VyIGxvYWRpbmcgWSkuXG4gICAqIEBwYXJhbSAge01vZGVsfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLm1vZGVsXSBUaGUgbW9kZWwgeW91IHdhbnQgdG8gZWFnZXJseSBsb2FkXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLmFzXSBUaGUgYWxpYXMgb2YgdGhlIHJlbGF0aW9uLCBpbiBjYXNlIHRoZSBtb2RlbCB5b3Ugd2FudCB0byBlYWdlcmx5IGxvYWQgaXMgYWxpYXNlZC4gRm9yIGBoYXNPbmVgIC8gYGJlbG9uZ3NUb2AsIHRoaXMgc2hvdWxkIGJlIHRoZSBzaW5ndWxhciBuYW1lLCBhbmQgZm9yIGBoYXNNYW55YCwgaXQgc2hvdWxkIGJlIHRoZSBwbHVyYWxcbiAgICogQHBhcmFtICB7QXNzb2NpYXRpb259ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmNsdWRlW10uYXNzb2NpYXRpb25dIFRoZSBhc3NvY2lhdGlvbiB5b3Ugd2FudCB0byBlYWdlcmx5IGxvYWQuIChUaGlzIGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgcHJvdmlkaW5nIGEgbW9kZWwvYXMgcGFpcilcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmNsdWRlW10ud2hlcmVdIFdoZXJlIGNsYXVzZXMgdG8gYXBwbHkgdG8gdGhlIGNoaWxkIG1vZGVscy4gTm90ZSB0aGF0IHRoaXMgY29udmVydHMgdGhlIGVhZ2VyIGxvYWQgdG8gYW4gaW5uZXIgam9pbiwgdW5sZXNzIHlvdSBleHBsaWNpdGx5IHNldCBgcmVxdWlyZWQ6IGZhbHNlYFxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS5vcj1mYWxzZV0gV2hldGhlciB0byBiaW5kIHRoZSBPTiBhbmQgV0hFUkUgY2xhdXNlIHRvZ2V0aGVyIGJ5IE9SIGluc3RlYWQgb2YgQU5ELlxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS5vbl0gU3VwcGx5IHlvdXIgb3duIE9OIGNvbmRpdGlvbiBmb3IgdGhlIGpvaW4uXG4gICAqIEBwYXJhbSAge0FycmF5PHN0cmluZz59ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLmF0dHJpYnV0ZXNdIEEgbGlzdCBvZiBhdHRyaWJ1dGVzIHRvIHNlbGVjdCBmcm9tIHRoZSBjaGlsZCBtb2RlbFxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS5yZXF1aXJlZF0gSWYgdHJ1ZSwgY29udmVydHMgdG8gYW4gaW5uZXIgam9pbiwgd2hpY2ggbWVhbnMgdGhhdCB0aGUgcGFyZW50IG1vZGVsIHdpbGwgb25seSBiZSBsb2FkZWQgaWYgaXQgaGFzIGFueSBtYXRjaGluZyBjaGlsZHJlbi4gVHJ1ZSBpZiBgaW5jbHVkZS53aGVyZWAgaXMgc2V0LCBmYWxzZSBvdGhlcndpc2UuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLnJpZ2h0XSBJZiB0cnVlLCBjb252ZXJ0cyB0byBhIHJpZ2h0IGpvaW4gaWYgZGlhbGVjdCBzdXBwb3J0IGl0LiBJZ25vcmVkIGlmIGBpbmNsdWRlLnJlcXVpcmVkYCBpcyB0cnVlLlxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS5zZXBhcmF0ZV0gSWYgdHJ1ZSwgcnVucyBhIHNlcGFyYXRlIHF1ZXJ5IHRvIGZldGNoIHRoZSBhc3NvY2lhdGVkIGluc3RhbmNlcywgb25seSBzdXBwb3J0ZWQgZm9yIGhhc01hbnkgYXNzb2NpYXRpb25zXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLmxpbWl0XSBMaW1pdCB0aGUgam9pbmVkIHJvd3MsIG9ubHkgc3VwcG9ydGVkIHdpdGggaW5jbHVkZS5zZXBhcmF0ZT10cnVlXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLnRocm91Z2gud2hlcmVdIEZpbHRlciBvbiB0aGUgam9pbiBtb2RlbCBmb3IgYmVsb25nc1RvTWFueSByZWxhdGlvbnNcbiAgICogQHBhcmFtICB7QXJyYXl9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmNsdWRlW10udGhyb3VnaC5hdHRyaWJ1dGVzXSBBIGxpc3Qgb2YgYXR0cmlidXRlcyB0byBzZWxlY3QgZnJvbSB0aGUgam9pbiBtb2RlbCBmb3IgYmVsb25nc1RvTWFueSByZWxhdGlvbnNcbiAgICogQHBhcmFtICB7QXJyYXk8T2JqZWN0fE1vZGVsfHN0cmluZz59ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmNsdWRlW10uaW5jbHVkZV0gTG9hZCBmdXJ0aGVyIG5lc3RlZCByZWxhdGVkIG1vZGVsc1xuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS5kdXBsaWNhdGluZ10gTWFyayB0aGUgaW5jbHVkZSBhcyBkdXBsaWNhdGluZywgd2lsbCBwcmV2ZW50IGEgc3VicXVlcnkgZnJvbSBiZWluZyB1c2VkLlxuICAgKiBAcGFyYW0gIHtBcnJheXxTZXF1ZWxpemUuZm58U2VxdWVsaXplLmNvbHxTZXF1ZWxpemUubGl0ZXJhbH0gICAgICAgIFtvcHRpb25zLm9yZGVyXSBTcGVjaWZpZXMgYW4gb3JkZXJpbmcuIFVzaW5nIGFuIGFycmF5LCB5b3UgY2FuIHByb3ZpZGUgc2V2ZXJhbCBjb2x1bW5zIC8gZnVuY3Rpb25zIHRvIG9yZGVyIGJ5LiBFYWNoIGVsZW1lbnQgY2FuIGJlIGZ1cnRoZXIgd3JhcHBlZCBpbiBhIHR3by1lbGVtZW50IGFycmF5LiBUaGUgZmlyc3QgZWxlbWVudCBpcyB0aGUgY29sdW1uIC8gZnVuY3Rpb24gdG8gb3JkZXIgYnksIHRoZSBzZWNvbmQgaXMgdGhlIGRpcmVjdGlvbi4gRm9yIGV4YW1wbGU6IGBvcmRlcjogW1snbmFtZScsICdERVNDJ11dYC4gSW4gdGhpcyB3YXkgdGhlIGNvbHVtbiB3aWxsIGJlIGVzY2FwZWQsIGJ1dCB0aGUgZGlyZWN0aW9uIHdpbGwgbm90LlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmxpbWl0XSBMaW1pdCBmb3IgcmVzdWx0XG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMub2Zmc2V0XSBPZmZzZXQgZm9yIHJlc3VsdFxuICAgKiBAcGFyYW0gIHtUcmFuc2FjdGlvbn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcbiAgICogQHBhcmFtICB7c3RyaW5nfE9iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5sb2NrXSBMb2NrIHRoZSBzZWxlY3RlZCByb3dzLiBQb3NzaWJsZSBvcHRpb25zIGFyZSB0cmFuc2FjdGlvbi5MT0NLLlVQREFURSBhbmQgdHJhbnNhY3Rpb24uTE9DSy5TSEFSRS4gUG9zdGdyZXMgYWxzbyBzdXBwb3J0cyB0cmFuc2FjdGlvbi5MT0NLLktFWV9TSEFSRSwgdHJhbnNhY3Rpb24uTE9DSy5OT19LRVlfVVBEQVRFIGFuZCBzcGVjaWZpYyBtb2RlbCBsb2NrcyB3aXRoIGpvaW5zLiBTZWUgW3RyYW5zYWN0aW9uLkxPQ0sgZm9yIGFuIGV4YW1wbGVdKHRyYW5zYWN0aW9uI2xvY2spXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuc2tpcExvY2tlZF0gU2tpcCBsb2NrZWQgcm93cy4gT25seSBzdXBwb3J0ZWQgaW4gUG9zdGdyZXMuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMucmF3XSBSZXR1cm4gcmF3IHJlc3VsdC4gU2VlIHNlcXVlbGl6ZS5xdWVyeSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGlsZSBydW5uaW5nIHRoZSBxdWVyeSB0byBsb2cgdGhlIHNxbC5cbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmhhdmluZ10gSGF2aW5nIG9wdGlvbnNcbiAgICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5zZWFyY2hQYXRoPURFRkFVTFRdIEFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byBzcGVjaWZ5IHRoZSBzY2hlbWEgc2VhcmNoX3BhdGggKFBvc3RncmVzIG9ubHkpXG4gICAqIEBwYXJhbSAge2Jvb2xlYW58RXJyb3J9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMucmVqZWN0T25FbXB0eT1mYWxzZV0gVGhyb3dzIGFuIGVycm9yIHdoZW4gbm8gcmVjb3JkcyBmb3VuZFxuICAgKlxuICAgKiBAc2VlXG4gICAqIHtAbGluayBTZXF1ZWxpemUjcXVlcnl9XG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5PE1vZGVsPj59XG4gICAqL1xuICBzdGF0aWMgZmluZEFsbChvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCAmJiAhXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlF1ZXJ5RXJyb3IoJ1RoZSBhcmd1bWVudCBwYXNzZWQgdG8gZmluZEFsbCBtdXN0IGJlIGFuIG9wdGlvbnMgb2JqZWN0LCB1c2UgZmluZEJ5UGsgaWYgeW91IHdpc2ggdG8gcGFzcyBhIHNpbmdsZSBwcmltYXJ5IGtleSB2YWx1ZScpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5hdHRyaWJ1dGVzKSB7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkob3B0aW9ucy5hdHRyaWJ1dGVzKSAmJiAhXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMuYXR0cmlidXRlcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5RdWVyeUVycm9yKCdUaGUgYXR0cmlidXRlcyBvcHRpb24gbXVzdCBiZSBhbiBhcnJheSBvZiBjb2x1bW4gbmFtZXMgb3IgYW4gb2JqZWN0Jyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy53YXJuT25JbnZhbGlkT3B0aW9ucyhvcHRpb25zLCBPYmplY3Qua2V5cyh0aGlzLnJhd0F0dHJpYnV0ZXMpKTtcblxuICAgIGNvbnN0IHRhYmxlTmFtZXMgPSB7fTtcblxuICAgIHRhYmxlTmFtZXNbdGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucyldID0gdHJ1ZTtcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xuXG4gICAgXy5kZWZhdWx0cyhvcHRpb25zLCB7IGhvb2tzOiB0cnVlIH0pO1xuXG4gICAgLy8gc2V0IHJlamVjdE9uRW1wdHkgb3B0aW9uLCBkZWZhdWx0cyB0byBtb2RlbCBvcHRpb25zXG4gICAgb3B0aW9ucy5yZWplY3RPbkVtcHR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsICdyZWplY3RPbkVtcHR5JylcbiAgICAgID8gb3B0aW9ucy5yZWplY3RPbkVtcHR5XG4gICAgICA6IHRoaXMub3B0aW9ucy5yZWplY3RPbkVtcHR5O1xuXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcbiAgICAgIHRoaXMuX2luamVjdFNjb3BlKG9wdGlvbnMpO1xuXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYmVmb3JlRmluZCcsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fY29uZm9ybUluY2x1ZGVzKG9wdGlvbnMsIHRoaXMpO1xuICAgICAgdGhpcy5fZXhwYW5kQXR0cmlidXRlcyhvcHRpb25zKTtcbiAgICAgIHRoaXMuX2V4cGFuZEluY2x1ZGVBbGwob3B0aW9ucyk7XG5cbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdiZWZvcmVGaW5kQWZ0ZXJFeHBhbmRJbmNsdWRlQWxsJywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBvcHRpb25zLm9yaWdpbmFsQXR0cmlidXRlcyA9IHRoaXMuX2luamVjdERlcGVuZGVudFZpcnR1YWxBdHRyaWJ1dGVzKG9wdGlvbnMuYXR0cmlidXRlcyk7XG5cbiAgICAgIGlmIChvcHRpb25zLmluY2x1ZGUpIHtcbiAgICAgICAgb3B0aW9ucy5oYXNKb2luID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLl92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudHMob3B0aW9ucywgdGFibGVOYW1lcyk7XG5cbiAgICAgICAgLy8gSWYgd2UncmUgbm90IHJhdywgd2UgaGF2ZSB0byBtYWtlIHN1cmUgd2UgaW5jbHVkZSB0aGUgcHJpbWFyeSBrZXkgZm9yIGRlLWR1cGxpY2F0aW9uXG4gICAgICAgIGlmIChcbiAgICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZXNcbiAgICAgICAgICAmJiAhb3B0aW9ucy5yYXdcbiAgICAgICAgICAmJiB0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGVcbiAgICAgICAgICAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzLmluY2x1ZGVzKHRoaXMucHJpbWFyeUtleUF0dHJpYnV0ZSlcbiAgICAgICAgICAmJiAoIW9wdGlvbnMuZ3JvdXAgfHwgIW9wdGlvbnMuaGFzU2luZ2xlQXNzb2NpYXRpb24gfHwgb3B0aW9ucy5oYXNNdWx0aUFzc29jaWF0aW9uKVxuICAgICAgICApIHtcbiAgICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBbdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlXS5jb25jYXQob3B0aW9ucy5hdHRyaWJ1dGVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIW9wdGlvbnMuYXR0cmlidXRlcykge1xuICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBPYmplY3Qua2V5cyh0aGlzLnJhd0F0dHJpYnV0ZXMpO1xuICAgICAgICBvcHRpb25zLm9yaWdpbmFsQXR0cmlidXRlcyA9IHRoaXMuX2luamVjdERlcGVuZGVudFZpcnR1YWxBdHRyaWJ1dGVzKG9wdGlvbnMuYXR0cmlidXRlcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHdoZXJlQ29sbGVjdGlvbiBpcyB1c2VkIGZvciBub24tcHJpbWFyeSBrZXkgdXBkYXRlc1xuICAgICAgdGhpcy5vcHRpb25zLndoZXJlQ29sbGVjdGlvbiA9IG9wdGlvbnMud2hlcmUgfHwgbnVsbDtcblxuICAgICAgVXRpbHMubWFwRmluZGVyT3B0aW9ucyhvcHRpb25zLCB0aGlzKTtcblxuICAgICAgb3B0aW9ucyA9IHRoaXMuX3BhcmFub2lkQ2xhdXNlKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYmVmb3JlRmluZEFmdGVyT3B0aW9ucycsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHsgdGFibGVOYW1lczogT2JqZWN0LmtleXModGFibGVOYW1lcykgfSk7XG4gICAgICByZXR1cm4gdGhpcy5RdWVyeUludGVyZmFjZS5zZWxlY3QodGhpcywgdGhpcy5nZXRUYWJsZU5hbWUoc2VsZWN0T3B0aW9ucyksIHNlbGVjdE9wdGlvbnMpO1xuICAgIH0pLnRhcChyZXN1bHRzID0+IHtcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdhZnRlckZpbmQnLCByZXN1bHRzLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKHJlc3VsdHMgPT4ge1xuXG4gICAgICAvL3JlamVjdE9uRW1wdHkgbW9kZVxuICAgICAgaWYgKF8uaXNFbXB0eShyZXN1bHRzKSAmJiBvcHRpb25zLnJlamVjdE9uRW1wdHkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlamVjdE9uRW1wdHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgb3B0aW9ucy5yZWplY3RPbkVtcHR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJlamVjdE9uRW1wdHkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhyb3cgb3B0aW9ucy5yZWplY3RPbkVtcHR5O1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuRW1wdHlSZXN1bHRFcnJvcigpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gTW9kZWwuX2ZpbmRTZXBhcmF0ZShyZXN1bHRzLCBvcHRpb25zKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyB3YXJuT25JbnZhbGlkT3B0aW9ucyhvcHRpb25zLCB2YWxpZENvbHVtbk5hbWVzKSB7XG4gICAgaWYgKCFfLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB1bnJlY29nbml6ZWRPcHRpb25zID0gT2JqZWN0LmtleXMob3B0aW9ucykuZmlsdGVyKGsgPT4gIXZhbGlkUXVlcnlLZXl3b3Jkcy5oYXMoaykpO1xuICAgIGNvbnN0IHVuZXhwZWN0ZWRNb2RlbEF0dHJpYnV0ZXMgPSBfLmludGVyc2VjdGlvbih1bnJlY29nbml6ZWRPcHRpb25zLCB2YWxpZENvbHVtbk5hbWVzKTtcbiAgICBpZiAoIW9wdGlvbnMud2hlcmUgJiYgdW5leHBlY3RlZE1vZGVsQXR0cmlidXRlcy5sZW5ndGggPiAwKSB7XG4gICAgICBsb2dnZXIud2FybihgTW9kZWwgYXR0cmlidXRlcyAoJHt1bmV4cGVjdGVkTW9kZWxBdHRyaWJ1dGVzLmpvaW4oJywgJyl9KSBwYXNzZWQgaW50byBmaW5kZXIgbWV0aG9kIG9wdGlvbnMgb2YgbW9kZWwgJHt0aGlzLm5hbWV9LCBidXQgdGhlIG9wdGlvbnMud2hlcmUgb2JqZWN0IGlzIGVtcHR5LiBEaWQgeW91IGZvcmdldCB0byB1c2Ugb3B0aW9ucy53aGVyZT9gKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgX2luamVjdERlcGVuZGVudFZpcnR1YWxBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAoIXRoaXMuX2hhc1ZpcnR1YWxBdHRyaWJ1dGVzKSByZXR1cm4gYXR0cmlidXRlcztcbiAgICBpZiAoIWF0dHJpYnV0ZXMgfHwgIUFycmF5LmlzQXJyYXkoYXR0cmlidXRlcykpIHJldHVybiBhdHRyaWJ1dGVzO1xuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgYXR0cmlidXRlcykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLl92aXJ0dWFsQXR0cmlidXRlcy5oYXMoYXR0cmlidXRlKVxuICAgICAgICAmJiB0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cmlidXRlXS50eXBlLmZpZWxkc1xuICAgICAgKSB7XG4gICAgICAgIGF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzLmNvbmNhdCh0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cmlidXRlXS50eXBlLmZpZWxkcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgYXR0cmlidXRlcyA9IF8udW5pcShhdHRyaWJ1dGVzKTtcblxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICB9XG5cbiAgc3RhdGljIF9maW5kU2VwYXJhdGUocmVzdWx0cywgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucy5pbmNsdWRlIHx8IG9wdGlvbnMucmF3IHx8ICFyZXN1bHRzKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdHMpO1xuXG4gICAgY29uc3Qgb3JpZ2luYWwgPSByZXN1bHRzO1xuICAgIGlmIChvcHRpb25zLnBsYWluKSByZXN1bHRzID0gW3Jlc3VsdHNdO1xuXG4gICAgaWYgKCFyZXN1bHRzLmxlbmd0aCkgcmV0dXJuIG9yaWdpbmFsO1xuXG4gICAgcmV0dXJuIFByb21pc2UubWFwKG9wdGlvbnMuaW5jbHVkZSwgaW5jbHVkZSA9PiB7XG4gICAgICBpZiAoIWluY2x1ZGUuc2VwYXJhdGUpIHtcbiAgICAgICAgcmV0dXJuIE1vZGVsLl9maW5kU2VwYXJhdGUoXG4gICAgICAgICAgcmVzdWx0cy5yZWR1Y2UoKG1lbW8sIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgbGV0IGFzc29jaWF0aW9ucyA9IHJlc3VsdC5nZXQoaW5jbHVkZS5hc3NvY2lhdGlvbi5hcyk7XG5cbiAgICAgICAgICAgIC8vIE1pZ2h0IGJlIGFuIGVtcHR5IGJlbG9uZ3NUbyByZWxhdGlvblxuICAgICAgICAgICAgaWYgKCFhc3NvY2lhdGlvbnMpIHJldHVybiBtZW1vO1xuXG4gICAgICAgICAgICAvLyBGb3JjZSBhcnJheSBzbyB3ZSBjYW4gY29uY2F0IG5vIG1hdHRlciBpZiBpdCdzIDE6MSBvciA6TVxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFzc29jaWF0aW9ucykpIGFzc29jaWF0aW9ucyA9IFthc3NvY2lhdGlvbnNdO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gYXNzb2NpYXRpb25zLmxlbmd0aDsgaSAhPT0gbGVuOyArK2kpIHtcbiAgICAgICAgICAgICAgbWVtby5wdXNoKGFzc29jaWF0aW9uc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgICB9LCBbXSksXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgXy5vbWl0KG9wdGlvbnMsICdpbmNsdWRlJywgJ2F0dHJpYnV0ZXMnLCAnb3JkZXInLCAnd2hlcmUnLCAnbGltaXQnLCAnb2Zmc2V0JywgJ3BsYWluJywgJ3Njb3BlJyksXG4gICAgICAgICAgICB7IGluY2x1ZGU6IGluY2x1ZGUuaW5jbHVkZSB8fCBbXSB9XG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaW5jbHVkZS5hc3NvY2lhdGlvbi5nZXQocmVzdWx0cywgT2JqZWN0LmFzc2lnbihcbiAgICAgICAge30sXG4gICAgICAgIF8ub21pdChvcHRpb25zLCBub25DYXNjYWRpbmdPcHRpb25zKSxcbiAgICAgICAgXy5vbWl0KGluY2x1ZGUsIFsncGFyZW50JywgJ2Fzc29jaWF0aW9uJywgJ2FzJywgJ29yaWdpbmFsQXR0cmlidXRlcyddKVxuICAgICAgKSkudGhlbihtYXAgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgcmVzdWx0LnNldChcbiAgICAgICAgICAgIGluY2x1ZGUuYXNzb2NpYXRpb24uYXMsXG4gICAgICAgICAgICBtYXBbcmVzdWx0LmdldChpbmNsdWRlLmFzc29jaWF0aW9uLnNvdXJjZUtleSldLFxuICAgICAgICAgICAgeyByYXc6IHRydWUgfVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pLnJldHVybihvcmlnaW5hbCk7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoIGZvciBhIHNpbmdsZSBpbnN0YW5jZSBieSBpdHMgcHJpbWFyeSBrZXkuX1xuICAgKlxuICAgKiBAcGFyYW0gIHtudW1iZXJ8c3RyaW5nfEJ1ZmZlcn0gICAgICBwYXJhbSBUaGUgdmFsdWUgb2YgdGhlIGRlc2lyZWQgaW5zdGFuY2UncyBwcmltYXJ5IGtleS5cbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgW29wdGlvbnNdIGZpbmQgb3B0aW9uc1xuICAgKiBAcGFyYW0gIHtUcmFuc2FjdGlvbn0gICAgICAgICAgICAgICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLnNlYXJjaFBhdGg9REVGQVVMVF0gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuZmluZEFsbH0gICAgICAgICAgIGZvciBhIGZ1bGwgZXhwbGFuYXRpb24gb2Ygb3B0aW9ucywgTm90ZSB0aGF0IG9wdGlvbnMud2hlcmUgaXMgbm90IHN1cHBvcnRlZC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWw+fVxuICAgKi9cbiAgc3RhdGljIGZpbmRCeVBrKHBhcmFtLCBvcHRpb25zKSB7XG4gICAgLy8gcmV0dXJuIFByb21pc2UgcmVzb2x2ZWQgd2l0aCBudWxsIGlmIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkXG4gICAgaWYgKFtudWxsLCB1bmRlZmluZWRdLmluY2x1ZGVzKHBhcmFtKSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpIHx8IHt9O1xuXG4gICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHBhcmFtID09PSAnc3RyaW5nJyB8fCBCdWZmZXIuaXNCdWZmZXIocGFyYW0pKSB7XG4gICAgICBvcHRpb25zLndoZXJlID0ge1xuICAgICAgICBbdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlXTogcGFyYW1cbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXJndW1lbnQgcGFzc2VkIHRvIGZpbmRCeVBrIGlzIGludmFsaWQ6ICR7cGFyYW19YCk7XG4gICAgfVxuXG4gICAgLy8gQnlwYXNzIGEgcG9zc2libGUgb3ZlcmxvYWRlZCBmaW5kT25lXG4gICAgcmV0dXJuIHRoaXMuZmluZE9uZShvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWFyY2ggZm9yIGEgc2luZ2xlIGluc3RhbmNlLiBUaGlzIGFwcGxpZXMgTElNSVQgMSwgc28gdGhlIGxpc3RlbmVyIHdpbGwgYWx3YXlzIGJlIGNhbGxlZCB3aXRoIGEgc2luZ2xlIGluc3RhbmNlLlxuICAgKlxuICAgKiBfX0FsaWFzX186IF9maW5kX1xuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgIFtvcHRpb25zXSBBIGhhc2ggb2Ygb3B0aW9ucyB0byBkZXNjcmliZSB0aGUgc2NvcGUgb2YgdGhlIHNlYXJjaFxuICAgKiBAcGFyYW0gIHtUcmFuc2FjdGlvbn0gIFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcbiAgICogQHBhcmFtICB7c3RyaW5nfSAgICAgICBbb3B0aW9ucy5zZWFyY2hQYXRoPURFRkFVTFRdIEFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byBzcGVjaWZ5IHRoZSBzY2hlbWEgc2VhcmNoX3BhdGggKFBvc3RncmVzIG9ubHkpXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9IGZvciBhbiBleHBsYW5hdGlvbiBvZiBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsPn1cbiAgICovXG4gIHN0YXRpYyBmaW5kT25lKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmICFfLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGFyZ3VtZW50IHBhc3NlZCB0byBmaW5kT25lIG11c3QgYmUgYW4gb3B0aW9ucyBvYmplY3QsIHVzZSBmaW5kQnlQayBpZiB5b3Ugd2lzaCB0byBwYXNzIGEgc2luZ2xlIHByaW1hcnkga2V5IHZhbHVlJyk7XG4gICAgfVxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XG5cbiAgICBpZiAob3B0aW9ucy5saW1pdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCB1bmlxdWVTaW5nbGVDb2x1bW5zID0gXy5jaGFpbih0aGlzLnVuaXF1ZUtleXMpLnZhbHVlcygpLmZpbHRlcihjID0+IGMuZmllbGRzLmxlbmd0aCA9PT0gMSkubWFwKCdjb2x1bW4nKS52YWx1ZSgpO1xuXG4gICAgICAvLyBEb24ndCBhZGQgbGltaXQgaWYgcXVlcnlpbmcgZGlyZWN0bHkgb24gdGhlIHBrIG9yIGEgdW5pcXVlIGNvbHVtblxuICAgICAgaWYgKCFvcHRpb25zLndoZXJlIHx8ICFfLnNvbWUob3B0aW9ucy53aGVyZSwgKHZhbHVlLCBrZXkpID0+XG4gICAgICAgIChrZXkgPT09IHRoaXMucHJpbWFyeUtleUF0dHJpYnV0ZSB8fCB1bmlxdWVTaW5nbGVDb2x1bW5zLmluY2x1ZGVzKGtleSkpICYmXG4gICAgICAgICAgKFV0aWxzLmlzUHJpbWl0aXZlKHZhbHVlKSB8fCBCdWZmZXIuaXNCdWZmZXIodmFsdWUpKVxuICAgICAgKSkge1xuICAgICAgICBvcHRpb25zLmxpbWl0ID0gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBCeXBhc3MgYSBwb3NzaWJsZSBvdmVybG9hZGVkIGZpbmRBbGwuXG4gICAgcmV0dXJuIHRoaXMuZmluZEFsbChfLmRlZmF1bHRzKG9wdGlvbnMsIHtcbiAgICAgIHBsYWluOiB0cnVlXG4gICAgfSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhbiBhZ2dyZWdhdGlvbiBtZXRob2Qgb24gdGhlIHNwZWNpZmllZCBmaWVsZFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgdG8gYWdncmVnYXRlIG92ZXIuIENhbiBiZSBhIGZpZWxkIG5hbWUgb3IgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgYWdncmVnYXRlRnVuY3Rpb24gVGhlIGZ1bmN0aW9uIHRvIHVzZSBmb3IgYWdncmVnYXRpb24sIGUuZy4gc3VtLCBtYXggZXRjLlxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgW29wdGlvbnNdIFF1ZXJ5IG9wdGlvbnMuIFNlZSBzZXF1ZWxpemUucXVlcnkgZm9yIGZ1bGwgb3B0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgW29wdGlvbnMud2hlcmVdIEEgaGFzaCBvZiBzZWFyY2ggYXR0cmlidXRlcy5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMuYmVuY2htYXJrPWZhbHNlXSBQYXNzIHF1ZXJ5IGV4ZWN1dGlvbiB0aW1lIGluIG1pbGxpc2Vjb25kcyBhcyBzZWNvbmQgYXJndW1lbnQgdG8gbG9nZ2luZyBmdW5jdGlvbiAob3B0aW9ucy5sb2dnaW5nKS5cbiAgICogQHBhcmFtIHtEYXRhVHlwZXN8c3RyaW5nfSBbb3B0aW9ucy5kYXRhVHlwZV0gVGhlIHR5cGUgb2YgdGhlIHJlc3VsdC4gSWYgYGZpZWxkYCBpcyBhIGZpZWxkIGluIHRoaXMgTW9kZWwsIHRoZSBkZWZhdWx0IHdpbGwgYmUgdGhlIHR5cGUgb2YgdGhhdCBmaWVsZCwgb3RoZXJ3aXNlIGRlZmF1bHRzIHRvIGZsb2F0LlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMuZGlzdGluY3RdIEFwcGxpZXMgRElTVElOQ1QgdG8gdGhlIGZpZWxkIGJlaW5nIGFnZ3JlZ2F0ZWQgb3ZlclxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSAgICAgW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMucGxhaW5dIFdoZW4gYHRydWVgLCB0aGUgZmlyc3QgcmV0dXJuZWQgdmFsdWUgb2YgYGFnZ3JlZ2F0ZUZ1bmN0aW9uYCBpcyBjYXN0IHRvIGBkYXRhVHlwZWAgYW5kIHJldHVybmVkLiBJZiBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMgYXJlIHNwZWNpZmllZCwgYWxvbmcgd2l0aCBgZ3JvdXBgIGNsYXVzZXMsIHNldCBgcGxhaW5gIHRvIGBmYWxzZWAgdG8gcmV0dXJuIGFsbCB2YWx1ZXMgb2YgYWxsIHJldHVybmVkIHJvd3MuICBEZWZhdWx0cyB0byBgdHJ1ZWBcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8RGF0YVR5cGVzfE9iamVjdD59IFJldHVybnMgdGhlIGFnZ3JlZ2F0ZSByZXN1bHQgY2FzdCB0byBgb3B0aW9ucy5kYXRhVHlwZWAsIHVubGVzcyBgb3B0aW9ucy5wbGFpbmAgaXMgZmFsc2UsIGluIHdoaWNoIGNhc2UgdGhlIGNvbXBsZXRlIGRhdGEgcmVzdWx0IGlzIHJldHVybmVkLlxuICAgKi9cbiAgc3RhdGljIGFnZ3JlZ2F0ZShhdHRyaWJ1dGUsIGFnZ3JlZ2F0ZUZ1bmN0aW9uLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcblxuICAgIC8vIFdlIG5lZWQgdG8gcHJlc2VydmUgYXR0cmlidXRlcyBoZXJlIGFzIHRoZSBgaW5qZWN0U2NvcGVgIGNhbGwgd291bGQgaW5qZWN0IG5vbiBhZ2dyZWdhdGUgY29sdW1ucy5cbiAgICBjb25zdCBwcmV2QXR0cmlidXRlcyA9IG9wdGlvbnMuYXR0cmlidXRlcztcbiAgICB0aGlzLl9pbmplY3RTY29wZShvcHRpb25zKTtcbiAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBwcmV2QXR0cmlidXRlcztcbiAgICB0aGlzLl9jb25mb3JtSW5jbHVkZXMob3B0aW9ucywgdGhpcyk7XG5cbiAgICBpZiAob3B0aW9ucy5pbmNsdWRlKSB7XG4gICAgICB0aGlzLl9leHBhbmRJbmNsdWRlQWxsKG9wdGlvbnMpO1xuICAgICAgdGhpcy5fdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGNvbnN0IGF0dHJPcHRpb25zID0gdGhpcy5yYXdBdHRyaWJ1dGVzW2F0dHJpYnV0ZV07XG4gICAgY29uc3QgZmllbGQgPSBhdHRyT3B0aW9ucyAmJiBhdHRyT3B0aW9ucy5maWVsZCB8fCBhdHRyaWJ1dGU7XG4gICAgbGV0IGFnZ3JlZ2F0ZUNvbHVtbiA9IHRoaXMuc2VxdWVsaXplLmNvbChmaWVsZCk7XG5cbiAgICBpZiAob3B0aW9ucy5kaXN0aW5jdCkge1xuICAgICAgYWdncmVnYXRlQ29sdW1uID0gdGhpcy5zZXF1ZWxpemUuZm4oJ0RJU1RJTkNUJywgYWdncmVnYXRlQ29sdW1uKTtcbiAgICB9XG5cbiAgICBsZXQgeyBncm91cCB9ID0gb3B0aW9ucztcbiAgICBpZiAoQXJyYXkuaXNBcnJheShncm91cCkgJiYgQXJyYXkuaXNBcnJheShncm91cFswXSkpIHtcbiAgICAgIG5vRG91YmxlTmVzdGVkR3JvdXAoKTtcbiAgICAgIGdyb3VwID0gXy5mbGF0dGVuKGdyb3VwKTtcbiAgICB9XG4gICAgb3B0aW9ucy5hdHRyaWJ1dGVzID0gXy51bmlvbkJ5KFxuICAgICAgb3B0aW9ucy5hdHRyaWJ1dGVzLFxuICAgICAgZ3JvdXAsXG4gICAgICBbW3RoaXMuc2VxdWVsaXplLmZuKGFnZ3JlZ2F0ZUZ1bmN0aW9uLCBhZ2dyZWdhdGVDb2x1bW4pLCBhZ2dyZWdhdGVGdW5jdGlvbl1dLFxuICAgICAgYSA9PiBBcnJheS5pc0FycmF5KGEpID8gYVsxXSA6IGFcbiAgICApO1xuXG4gICAgaWYgKCFvcHRpb25zLmRhdGFUeXBlKSB7XG4gICAgICBpZiAoYXR0ck9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucy5kYXRhVHlwZSA9IGF0dHJPcHRpb25zLnR5cGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBVc2UgRkxPQVQgYXMgZmFsbGJhY2tcbiAgICAgICAgb3B0aW9ucy5kYXRhVHlwZSA9IG5ldyBEYXRhVHlwZXMuRkxPQVQoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucy5kYXRhVHlwZSA9IHRoaXMuc2VxdWVsaXplLm5vcm1hbGl6ZURhdGFUeXBlKG9wdGlvbnMuZGF0YVR5cGUpO1xuICAgIH1cblxuICAgIFV0aWxzLm1hcE9wdGlvbkZpZWxkTmFtZXMob3B0aW9ucywgdGhpcyk7XG4gICAgb3B0aW9ucyA9IHRoaXMuX3BhcmFub2lkQ2xhdXNlKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UucmF3U2VsZWN0KHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBvcHRpb25zLCBhZ2dyZWdhdGVGdW5jdGlvbiwgdGhpcykudGhlbiggdmFsdWUgPT4ge1xuICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvdW50IHRoZSBudW1iZXIgb2YgcmVjb3JkcyBtYXRjaGluZyB0aGUgcHJvdmlkZWQgd2hlcmUgY2xhdXNlLlxuICAgKlxuICAgKiBJZiB5b3UgcHJvdmlkZSBhbiBgaW5jbHVkZWAgb3B0aW9uLCB0aGUgbnVtYmVyIG9mIG1hdGNoaW5nIGFzc29jaWF0aW9ucyB3aWxsIGJlIGNvdW50ZWQgaW5zdGVhZC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICBbb3B0aW9uc10gb3B0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgIFtvcHRpb25zLndoZXJlXSBBIGhhc2ggb2Ygc2VhcmNoIGF0dHJpYnV0ZXMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgW29wdGlvbnMuaW5jbHVkZV0gSW5jbHVkZSBvcHRpb25zLiBTZWUgYGZpbmRgIGZvciBkZXRhaWxzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgW29wdGlvbnMucGFyYW5vaWQ9dHJ1ZV0gU2V0IGB0cnVlYCB0byBjb3VudCBvbmx5IG5vbi1kZWxldGVkIHJlY29yZHMuIENhbiBiZSB1c2VkIG9uIG1vZGVscyB3aXRoIGBwYXJhbm9pZGAgZW5hYmxlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgIFtvcHRpb25zLmRpc3RpbmN0XSBBcHBseSBDT1VOVChESVNUSU5DVChjb2wpKSBvbiBwcmltYXJ5IGtleSBvciBvbiBvcHRpb25zLmNvbC5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICBbb3B0aW9ucy5jb2xdIENvbHVtbiBvbiB3aGljaCBDT1VOVCgpIHNob3VsZCBiZSBhcHBsaWVkXG4gICAqIEBwYXJhbSB7QXJyYXl9ICAgICAgICAgW29wdGlvbnMuYXR0cmlidXRlc10gVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIGBncm91cGBcbiAgICogQHBhcmFtIHtBcnJheX0gICAgICAgICBbb3B0aW9ucy5ncm91cF0gRm9yIGNyZWF0aW5nIGNvbXBsZXggY291bnRzLiBXaWxsIHJldHVybiBtdWx0aXBsZSByb3dzIGFzIG5lZWRlZC5cbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259ICAgICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgW29wdGlvbnMuYmVuY2htYXJrPWZhbHNlXSBQYXNzIHF1ZXJ5IGV4ZWN1dGlvbiB0aW1lIGluIG1pbGxpc2Vjb25kcyBhcyBzZWNvbmQgYXJndW1lbnQgdG8gbG9nZ2luZyBmdW5jdGlvbiAob3B0aW9ucy5sb2dnaW5nKS5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICBbb3B0aW9ucy5zZWFyY2hQYXRoPURFRkFVTFRdIEFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byBzcGVjaWZ5IHRoZSBzY2hlbWEgc2VhcmNoX3BhdGggKFBvc3RncmVzIG9ubHkpXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPG51bWJlcj59XG4gICAqL1xuICBzdGF0aWMgY291bnQob3B0aW9ucykge1xuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XG4gICAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xuICAgICAgb3B0aW9ucyA9IF8uZGVmYXVsdHMob3B0aW9ucywgeyBob29rczogdHJ1ZSB9KTtcbiAgICAgIG9wdGlvbnMucmF3ID0gdHJ1ZTtcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdiZWZvcmVDb3VudCcsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgbGV0IGNvbCA9IG9wdGlvbnMuY29sIHx8ICcqJztcbiAgICAgIGlmIChvcHRpb25zLmluY2x1ZGUpIHtcbiAgICAgICAgY29sID0gYCR7dGhpcy5uYW1lfS4ke29wdGlvbnMuY29sIHx8IHRoaXMucHJpbWFyeUtleUZpZWxkfWA7XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMucGxhaW4gPSAhb3B0aW9ucy5ncm91cDtcbiAgICAgIG9wdGlvbnMuZGF0YVR5cGUgPSBuZXcgRGF0YVR5cGVzLklOVEVHRVIoKTtcbiAgICAgIG9wdGlvbnMuaW5jbHVkZUlnbm9yZUF0dHJpYnV0ZXMgPSBmYWxzZTtcblxuICAgICAgLy8gTm8gbGltaXQsIG9mZnNldCBvciBvcmRlciBmb3IgdGhlIG9wdGlvbnMgbWF4IGJlIGdpdmVuIHRvIGNvdW50KClcbiAgICAgIC8vIFNldCB0aGVtIHRvIG51bGwgdG8gcHJldmVudCBzY29wZXMgc2V0dGluZyB0aG9zZSB2YWx1ZXNcbiAgICAgIG9wdGlvbnMubGltaXQgPSBudWxsO1xuICAgICAgb3B0aW9ucy5vZmZzZXQgPSBudWxsO1xuICAgICAgb3B0aW9ucy5vcmRlciA9IG51bGw7XG5cbiAgICAgIHJldHVybiB0aGlzLmFnZ3JlZ2F0ZShjb2wsICdjb3VudCcsIG9wdGlvbnMpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgYWxsIHRoZSByb3dzIG1hdGNoaW5nIHlvdXIgcXVlcnksIHdpdGhpbiBhIHNwZWNpZmllZCBvZmZzZXQgLyBsaW1pdCwgYW5kIGdldCB0aGUgdG90YWwgbnVtYmVyIG9mIHJvd3MgbWF0Y2hpbmcgeW91ciBxdWVyeS4gVGhpcyBpcyB2ZXJ5IHVzZWZ1bCBmb3IgcGFnaW5nXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIE1vZGVsLmZpbmRBbmRDb3VudEFsbCh7XG4gICAqICAgd2hlcmU6IC4uLixcbiAgICogICBsaW1pdDogMTIsXG4gICAqICAgb2Zmc2V0OiAxMlxuICAgKiB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAqICAgLi4uXG4gICAqIH0pXG4gICAqXG4gICAqICMgSW4gdGhlIGFib3ZlIGV4YW1wbGUsIGByZXN1bHQucm93c2Agd2lsbCBjb250YWluIHJvd3MgMTMgdGhyb3VnaCAyNCwgd2hpbGUgYHJlc3VsdC5jb3VudGAgd2lsbCByZXR1cm4gdGhlIHRvdGFsIG51bWJlciBvZiByb3dzIHRoYXQgbWF0Y2hlZCB5b3VyIHF1ZXJ5LlxuICAgKlxuICAgKiAjIFdoZW4geW91IGFkZCBpbmNsdWRlcywgb25seSB0aG9zZSB3aGljaCBhcmUgcmVxdWlyZWQgKGVpdGhlciBiZWNhdXNlIHRoZXkgaGF2ZSBhIHdoZXJlIGNsYXVzZSwgb3IgYmVjYXVzZSBgcmVxdWlyZWRgIGlzIGV4cGxpY2l0bHkgc2V0IHRvIHRydWUgb24gdGhlIGluY2x1ZGUpIHdpbGwgYmUgYWRkZWQgdG8gdGhlIGNvdW50IHBhcnQuXG4gICAqXG4gICAqICMgU3VwcG9zZSB5b3Ugd2FudCB0byBmaW5kIGFsbCB1c2VycyB3aG8gaGF2ZSBhIHByb2ZpbGUgYXR0YWNoZWQ6XG4gICAqXG4gICAqIFVzZXIuZmluZEFuZENvdW50QWxsKHtcbiAgICogICBpbmNsdWRlOiBbXG4gICAqICAgICAgeyBtb2RlbDogUHJvZmlsZSwgcmVxdWlyZWQ6IHRydWV9XG4gICAqICAgXSxcbiAgICogICBsaW1pdCAzXG4gICAqIH0pO1xuICAgKlxuICAgKiAjIEJlY2F1c2UgdGhlIGluY2x1ZGUgZm9yIGBQcm9maWxlYCBoYXMgYHJlcXVpcmVkYCBzZXQgaXQgd2lsbCByZXN1bHQgaW4gYW4gaW5uZXIgam9pbiwgYW5kIG9ubHkgdGhlIHVzZXJzIHdobyBoYXZlIGEgcHJvZmlsZSB3aWxsIGJlIGNvdW50ZWQuIElmIHdlIHJlbW92ZSBgcmVxdWlyZWRgIGZyb20gdGhlIGluY2x1ZGUsIGJvdGggdXNlcnMgd2l0aCBhbmQgd2l0aG91dCBwcm9maWxlcyB3aWxsIGJlIGNvdW50ZWRcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBTZWUgZmluZEFsbCBvcHRpb25zXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9IGZvciBhIHNwZWNpZmljYXRpb24gb2YgZmluZCBhbmQgcXVlcnkgb3B0aW9uc1xuICAgKiBAc2VlXG4gICAqIHtAbGluayBNb2RlbC5jb3VudH0gZm9yIGEgc3BlY2lmaWNhdGlvbiBvZiBjb3VudCBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHtjb3VudDogbnVtYmVyLCByb3dzOiBNb2RlbFtdfT59XG4gICAqL1xuICBzdGF0aWMgZmluZEFuZENvdW50QWxsKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkICYmICFfLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGFyZ3VtZW50IHBhc3NlZCB0byBmaW5kQW5kQ291bnRBbGwgbXVzdCBiZSBhbiBvcHRpb25zIG9iamVjdCwgdXNlIGZpbmRCeVBrIGlmIHlvdSB3aXNoIHRvIHBhc3MgYSBzaW5nbGUgcHJpbWFyeSBrZXkgdmFsdWUnKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudE9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XG5cbiAgICBpZiAoY291bnRPcHRpb25zLmF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvdW50T3B0aW9ucy5hdHRyaWJ1dGVzID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLmNvdW50KGNvdW50T3B0aW9ucyksXG4gICAgICB0aGlzLmZpbmRBbGwob3B0aW9ucylcbiAgICBdKVxuICAgICAgLnRoZW4oKFtjb3VudCwgcm93c10pID0+ICh7XG4gICAgICAgIGNvdW50LFxuICAgICAgICByb3dzOiBjb3VudCA9PT0gMCA/IFtdIDogcm93c1xuICAgICAgfSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgdGhlIG1heGltdW0gdmFsdWUgb2YgZmllbGRcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGF0dHJpYnV0ZSAvIGZpZWxkIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBTZWUgYWdncmVnYXRlXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLmFnZ3JlZ2F0ZX0gZm9yIG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8Kj59XG4gICAqL1xuICBzdGF0aWMgbWF4KGZpZWxkLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuYWdncmVnYXRlKGZpZWxkLCAnbWF4Jywgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogRmluZCB0aGUgbWluaW11bSB2YWx1ZSBvZiBmaWVsZFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgYXR0cmlidXRlIC8gZmllbGQgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFNlZSBhZ2dyZWdhdGVcbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuYWdncmVnYXRlfSBmb3Igb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTwqPn1cbiAgICovXG4gIHN0YXRpYyBtaW4oZmllbGQsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5hZ2dyZWdhdGUoZmllbGQsICdtaW4nLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kIHRoZSBzdW0gb2YgZmllbGRcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGF0dHJpYnV0ZSAvIGZpZWxkIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBTZWUgYWdncmVnYXRlXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLmFnZ3JlZ2F0ZX0gZm9yIG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8bnVtYmVyPn1cbiAgICovXG4gIHN0YXRpYyBzdW0oZmllbGQsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5hZ2dyZWdhdGUoZmllbGQsICdzdW0nLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZHMgYSBuZXcgbW9kZWwgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSB2YWx1ZXMgQW4gb2JqZWN0IG9mIGtleSB2YWx1ZSBwYWlycyBvciBhbiBhcnJheSBvZiBzdWNoLiBJZiBhbiBhcnJheSwgdGhlIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIGFuIGFycmF5IG9mIGluc3RhbmNlcy5cbiAgICogQHBhcmFtIHtPYmplY3R9ICBbb3B0aW9uc10gSW5zdGFuY2UgYnVpbGQgb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJhdz1mYWxzZV0gSWYgc2V0IHRvIHRydWUsIHZhbHVlcyB3aWxsIGlnbm9yZSBmaWVsZCBhbmQgdmlydHVhbCBzZXR0ZXJzLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmlzTmV3UmVjb3JkPXRydWVdIElzIHRoaXMgbmV3IHJlY29yZFxuICAgKiBAcGFyYW0ge0FycmF5fSAgIFtvcHRpb25zLmluY2x1ZGVdIGFuIGFycmF5IG9mIGluY2x1ZGUgb3B0aW9ucyAtIFVzZWQgdG8gYnVpbGQgcHJlZmV0Y2hlZC9pbmNsdWRlZCBtb2RlbCBpbnN0YW5jZXMuIFNlZSBgc2V0YFxuICAgKlxuICAgKiBAcmV0dXJucyB7TW9kZWx8QXJyYXk8TW9kZWw+fVxuICAgKi9cbiAgc3RhdGljIGJ1aWxkKHZhbHVlcywgb3B0aW9ucykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlcykpIHtcbiAgICAgIHJldHVybiB0aGlzLmJ1bGtCdWlsZCh2YWx1ZXMsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IHRoaXModmFsdWVzLCBvcHRpb25zKTtcbiAgfVxuXG4gIHN0YXRpYyBidWxrQnVpbGQodmFsdWVTZXRzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgaXNOZXdSZWNvcmQ6IHRydWVcbiAgICB9LCBvcHRpb25zIHx8IHt9KTtcblxuICAgIGlmICghb3B0aW9ucy5pbmNsdWRlVmFsaWRhdGVkKSB7XG4gICAgICB0aGlzLl9jb25mb3JtSW5jbHVkZXMob3B0aW9ucywgdGhpcyk7XG4gICAgICBpZiAob3B0aW9ucy5pbmNsdWRlKSB7XG4gICAgICAgIHRoaXMuX2V4cGFuZEluY2x1ZGVBbGwob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlSW5jbHVkZWRFbGVtZW50cyhvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSB7XG4gICAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXMubWFwKGF0dHJpYnV0ZSA9PiBBcnJheS5pc0FycmF5KGF0dHJpYnV0ZSkgPyBhdHRyaWJ1dGVbMV0gOiBhdHRyaWJ1dGUpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZVNldHMubWFwKHZhbHVlcyA9PiB0aGlzLmJ1aWxkKHZhbHVlcywgb3B0aW9ucykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkcyBhIG5ldyBtb2RlbCBpbnN0YW5jZSBhbmQgY2FsbHMgc2F2ZSBvbiBpdC5cblxuICAgKiBAc2VlXG4gICAqIHtAbGluayBNb2RlbC5idWlsZH1cbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuc2F2ZX1cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICB2YWx1ZXMgaGFzaCBvZiBkYXRhIHZhbHVlcyB0byBjcmVhdGUgbmV3IHJlY29yZCB3aXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgW29wdGlvbnNdIGJ1aWxkIGFuZCBxdWVyeSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgW29wdGlvbnMucmF3PWZhbHNlXSBJZiBzZXQgdG8gdHJ1ZSwgdmFsdWVzIHdpbGwgaWdub3JlIGZpZWxkIGFuZCB2aXJ0dWFsIHNldHRlcnMuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgW29wdGlvbnMuaXNOZXdSZWNvcmQ9dHJ1ZV0gSXMgdGhpcyBuZXcgcmVjb3JkXG4gICAqIEBwYXJhbSB7QXJyYXl9ICAgICAgICAgW29wdGlvbnMuaW5jbHVkZV0gYW4gYXJyYXkgb2YgaW5jbHVkZSBvcHRpb25zIC0gVXNlZCB0byBidWlsZCBwcmVmZXRjaGVkL2luY2x1ZGVkIG1vZGVsIGluc3RhbmNlcy4gU2VlIGBzZXRgXG4gICAqIEBwYXJhbSB7QXJyYXl9ICAgICAgICAgW29wdGlvbnMuZmllbGRzXSBJZiBzZXQsIG9ubHkgY29sdW1ucyBtYXRjaGluZyB0aG9zZSBpbiBmaWVsZHMgd2lsbCBiZSBzYXZlZFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSAgICAgIFtvcHRpb25zLmZpZWxkc10gQW4gb3B0aW9uYWwgYXJyYXkgb2Ygc3RyaW5ncywgcmVwcmVzZW50aW5nIGRhdGFiYXNlIGNvbHVtbnMuIElmIGZpZWxkcyBpcyBwcm92aWRlZCwgb25seSB0aG9zZSBjb2x1bW5zIHdpbGwgYmUgdmFsaWRhdGVkIGFuZCBzYXZlZC5cbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICBbb3B0aW9ucy5zaWxlbnQ9ZmFsc2VdIElmIHRydWUsIHRoZSB1cGRhdGVkQXQgdGltZXN0YW1wIHdpbGwgbm90IGJlIHVwZGF0ZWQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgW29wdGlvbnMudmFsaWRhdGU9dHJ1ZV0gSWYgZmFsc2UsIHZhbGlkYXRpb25zIHdvbid0IGJlIHJ1bi5cbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICBbb3B0aW9ucy5ob29rcz10cnVlXSBSdW4gYmVmb3JlIGFuZCBhZnRlciBjcmVhdGUgLyB1cGRhdGUgKyB2YWxpZGF0ZSBob29rc1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgIFtvcHRpb25zLmJlbmNobWFyaz1mYWxzZV0gUGFzcyBxdWVyeSBleGVjdXRpb24gdGltZSBpbiBtaWxsaXNlY29uZHMgYXMgc2Vjb25kIGFyZ3VtZW50IHRvIGxvZ2dpbmcgZnVuY3Rpb24gKG9wdGlvbnMubG9nZ2luZykuXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259ICAgW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgIFtvcHRpb25zLnNlYXJjaFBhdGg9REVGQVVMVF0gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICBbb3B0aW9ucy5yZXR1cm5pbmc9dHJ1ZV0gUmV0dXJuIHRoZSBhZmZlY3RlZCByb3dzIChvbmx5IGZvciBwb3N0Z3JlcylcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWw+fVxuICAgKlxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZSh2YWx1ZXMsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMgfHwge30pO1xuXG4gICAgcmV0dXJuIHRoaXMuYnVpbGQodmFsdWVzLCB7XG4gICAgICBpc05ld1JlY29yZDogdHJ1ZSxcbiAgICAgIGF0dHJpYnV0ZXM6IG9wdGlvbnMuZmllbGRzLFxuICAgICAgaW5jbHVkZTogb3B0aW9ucy5pbmNsdWRlLFxuICAgICAgcmF3OiBvcHRpb25zLnJhdyxcbiAgICAgIHNpbGVudDogb3B0aW9ucy5zaWxlbnRcbiAgICB9KS5zYXZlKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgYSByb3cgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeSwgb3IgYnVpbGQgKGJ1dCBkb24ndCBzYXZlKSB0aGUgcm93IGlmIG5vbmUgaXMgZm91bmQuXG4gICAqIFRoZSBzdWNjZXNzZnVsIHJlc3VsdCBvZiB0aGUgcHJvbWlzZSB3aWxsIGJlIChpbnN0YW5jZSwgYnVpbHQpXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIG9wdGlvbnMgZmluZCBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIG9wdGlvbnMud2hlcmUgQSBoYXNoIG9mIHNlYXJjaCBhdHRyaWJ1dGVzLiBJZiBgd2hlcmVgIGlzIGEgcGxhaW4gb2JqZWN0IGl0IHdpbGwgYmUgYXBwZW5kZWQgd2l0aCBkZWZhdWx0cyB0byBidWlsZCBhIG5ldyBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtPYmplY3R9ICAgW29wdGlvbnMuZGVmYXVsdHNdIERlZmF1bHQgdmFsdWVzIHRvIHVzZSBpZiBidWlsZGluZyBhIG5ldyBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsLGJvb2xlYW4+fVxuICAgKi9cbiAgc3RhdGljIGZpbmRPckJ1aWxkKG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMud2hlcmUgfHwgYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ01pc3Npbmcgd2hlcmUgYXR0cmlidXRlIGluIHRoZSBvcHRpb25zIHBhcmFtZXRlciBwYXNzZWQgdG8gZmluZE9yQnVpbGQuICcgK1xuICAgICAgICAnUGxlYXNlIG5vdGUgdGhhdCB0aGUgQVBJIGhhcyBjaGFuZ2VkLCBhbmQgaXMgbm93IG9wdGlvbnMgb25seSAoYW4gb2JqZWN0IHdpdGggd2hlcmUsIGRlZmF1bHRzIGtleXMsIHRyYW5zYWN0aW9uIGV0Yy4pJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBsZXQgdmFsdWVzO1xuXG4gICAgcmV0dXJuIHRoaXMuZmluZE9uZShvcHRpb25zKS50aGVuKGluc3RhbmNlID0+IHtcbiAgICAgIGlmIChpbnN0YW5jZSA9PT0gbnVsbCkge1xuICAgICAgICB2YWx1ZXMgPSBfLmNsb25lKG9wdGlvbnMuZGVmYXVsdHMpIHx8IHt9O1xuICAgICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMud2hlcmUpKSB7XG4gICAgICAgICAgdmFsdWVzID0gVXRpbHMuZGVmYXVsdHModmFsdWVzLCBvcHRpb25zLndoZXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluc3RhbmNlID0gdGhpcy5idWlsZCh2YWx1ZXMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW2luc3RhbmNlLCB0cnVlXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW2luc3RhbmNlLCBmYWxzZV0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgYSByb3cgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeSwgb3IgYnVpbGQgYW5kIHNhdmUgdGhlIHJvdyBpZiBub25lIGlzIGZvdW5kXG4gICAqIFRoZSBzdWNjZXNzZnVsIHJlc3VsdCBvZiB0aGUgcHJvbWlzZSB3aWxsIGJlIChpbnN0YW5jZSwgY3JlYXRlZClcbiAgICpcbiAgICogSWYgbm8gdHJhbnNhY3Rpb24gaXMgcGFzc2VkIGluIHRoZSBgb3B0aW9uc2Agb2JqZWN0LCBhIG5ldyB0cmFuc2FjdGlvbiB3aWxsIGJlIGNyZWF0ZWQgaW50ZXJuYWxseSwgdG8gcHJldmVudCB0aGUgcmFjZSBjb25kaXRpb24gd2hlcmUgYSBtYXRjaGluZyByb3cgaXMgY3JlYXRlZCBieSBhbm90aGVyIGNvbm5lY3Rpb24gYWZ0ZXIgdGhlIGZpbmQgYnV0IGJlZm9yZSB0aGUgaW5zZXJ0IGNhbGwuXG4gICAqIEhvd2V2ZXIsIGl0IGlzIG5vdCBhbHdheXMgcG9zc2libGUgdG8gaGFuZGxlIHRoaXMgY2FzZSBpbiBTUUxpdGUsIHNwZWNpZmljYWxseSBpZiBvbmUgdHJhbnNhY3Rpb24gaW5zZXJ0cyBhbmQgYW5vdGhlciB0cmllcyB0byBzZWxlY3QgYmVmb3JlIHRoZSBmaXJzdCBvbmUgaGFzIGNvbW1pdHRlZC4gSW4gdGhpcyBjYXNlLCBhbiBpbnN0YW5jZSBvZiBzZXF1ZWxpemUuIFRpbWVvdXRFcnJvciB3aWxsIGJlIHRocm93biBpbnN0ZWFkLlxuICAgKiBJZiBhIHRyYW5zYWN0aW9uIGlzIGNyZWF0ZWQsIGEgc2F2ZXBvaW50IHdpbGwgYmUgY3JlYXRlZCBpbnN0ZWFkLCBhbmQgYW55IHVuaXF1ZSBjb25zdHJhaW50IHZpb2xhdGlvbiB3aWxsIGJlIGhhbmRsZWQgaW50ZXJuYWxseS5cbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuZmluZEFsbH0gZm9yIGEgZnVsbCBzcGVjaWZpY2F0aW9uIG9mIGZpbmQgYW5kIG9wdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgb3B0aW9ucyBmaW5kIGFuZCBjcmVhdGUgb3B0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICBvcHRpb25zLndoZXJlIHdoZXJlIEEgaGFzaCBvZiBzZWFyY2ggYXR0cmlidXRlcy4gSWYgYHdoZXJlYCBpcyBhIHBsYWluIG9iamVjdCBpdCB3aWxsIGJlIGFwcGVuZGVkIHdpdGggZGVmYXVsdHMgdG8gYnVpbGQgYSBuZXcgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIFtvcHRpb25zLmRlZmF1bHRzXSBEZWZhdWx0IHZhbHVlcyB0byB1c2UgaWYgY3JlYXRpbmcgYSBuZXcgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbCxib29sZWFuPn1cbiAgICovXG4gIHN0YXRpYyBmaW5kT3JDcmVhdGUob3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy53aGVyZSB8fCBhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnTWlzc2luZyB3aGVyZSBhdHRyaWJ1dGUgaW4gdGhlIG9wdGlvbnMgcGFyYW1ldGVyIHBhc3NlZCB0byBmaW5kT3JDcmVhdGUuICcgK1xuICAgICAgICAnUGxlYXNlIG5vdGUgdGhhdCB0aGUgQVBJIGhhcyBjaGFuZ2VkLCBhbmQgaXMgbm93IG9wdGlvbnMgb25seSAoYW4gb2JqZWN0IHdpdGggd2hlcmUsIGRlZmF1bHRzIGtleXMsIHRyYW5zYWN0aW9uIGV0Yy4pJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG5cbiAgICBpZiAob3B0aW9ucy5kZWZhdWx0cykge1xuICAgICAgY29uc3QgZGVmYXVsdHMgPSBPYmplY3Qua2V5cyhvcHRpb25zLmRlZmF1bHRzKTtcbiAgICAgIGNvbnN0IHVua25vd25EZWZhdWx0cyA9IGRlZmF1bHRzLmZpbHRlcihuYW1lID0+ICF0aGlzLnJhd0F0dHJpYnV0ZXNbbmFtZV0pO1xuXG4gICAgICBpZiAodW5rbm93bkRlZmF1bHRzLmxlbmd0aCkge1xuICAgICAgICBsb2dnZXIud2FybihgVW5rbm93biBhdHRyaWJ1dGVzICgke3Vua25vd25EZWZhdWx0c30pIHBhc3NlZCB0byBkZWZhdWx0cyBvcHRpb24gb2YgZmluZE9yQ3JlYXRlYCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMudHJhbnNhY3Rpb24gPT09IHVuZGVmaW5lZCAmJiB0aGlzLnNlcXVlbGl6ZS5jb25zdHJ1Y3Rvci5fY2xzKSB7XG4gICAgICBjb25zdCB0ID0gdGhpcy5zZXF1ZWxpemUuY29uc3RydWN0b3IuX2Nscy5nZXQoJ3RyYW5zYWN0aW9uJyk7XG4gICAgICBpZiAodCkge1xuICAgICAgICBvcHRpb25zLnRyYW5zYWN0aW9uID0gdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBpbnRlcm5hbFRyYW5zYWN0aW9uID0gIW9wdGlvbnMudHJhbnNhY3Rpb247XG4gICAgbGV0IHZhbHVlcztcbiAgICBsZXQgdHJhbnNhY3Rpb247XG5cbiAgICAvLyBDcmVhdGUgYSB0cmFuc2FjdGlvbiBvciBhIHNhdmVwb2ludCwgZGVwZW5kaW5nIG9uIHdoZXRoZXIgYSB0cmFuc2FjdGlvbiB3YXMgcGFzc2VkIGluXG4gICAgcmV0dXJuIHRoaXMuc2VxdWVsaXplLnRyYW5zYWN0aW9uKG9wdGlvbnMpLnRoZW4odCA9PiB7XG4gICAgICB0cmFuc2FjdGlvbiA9IHQ7XG4gICAgICBvcHRpb25zLnRyYW5zYWN0aW9uID0gdDtcblxuICAgICAgcmV0dXJuIHRoaXMuZmluZE9uZShVdGlscy5kZWZhdWx0cyh7IHRyYW5zYWN0aW9uIH0sIG9wdGlvbnMpKTtcbiAgICB9KS50aGVuKGluc3RhbmNlID0+IHtcbiAgICAgIGlmIChpbnN0YW5jZSAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gW2luc3RhbmNlLCBmYWxzZV07XG4gICAgICB9XG5cbiAgICAgIHZhbHVlcyA9IF8uY2xvbmUob3B0aW9ucy5kZWZhdWx0cykgfHwge307XG4gICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMud2hlcmUpKSB7XG4gICAgICAgIHZhbHVlcyA9IFV0aWxzLmRlZmF1bHRzKHZhbHVlcywgb3B0aW9ucy53aGVyZSk7XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMuZXhjZXB0aW9uID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKHZhbHVlcywgb3B0aW9ucykudGhlbihpbnN0YW5jZSA9PiB7XG4gICAgICAgIGlmIChpbnN0YW5jZS5nZXQodGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlLCB7IHJhdzogdHJ1ZSB9KSA9PT0gbnVsbCkge1xuICAgICAgICAgIC8vIElmIHRoZSBxdWVyeSByZXR1cm5lZCBhbiBlbXB0eSByZXN1bHQgZm9yIHRoZSBwcmltYXJ5IGtleSwgd2Uga25vdyB0aGF0IHRoaXMgd2FzIGFjdHVhbGx5IGEgdW5pcXVlIGNvbnN0cmFpbnQgdmlvbGF0aW9uXG4gICAgICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5VbmlxdWVDb25zdHJhaW50RXJyb3IoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbaW5zdGFuY2UsIHRydWVdO1xuICAgICAgfSkuY2F0Y2goc2VxdWVsaXplRXJyb3JzLlVuaXF1ZUNvbnN0cmFpbnRFcnJvciwgZXJyID0+IHtcbiAgICAgICAgY29uc3QgZmxhdHRlbmVkV2hlcmUgPSBVdGlscy5mbGF0dGVuT2JqZWN0RGVlcChvcHRpb25zLndoZXJlKTtcbiAgICAgICAgY29uc3QgZmxhdHRlbmVkV2hlcmVLZXlzID0gT2JqZWN0LmtleXMoZmxhdHRlbmVkV2hlcmUpLm1hcChuYW1lID0+IF8ubGFzdChuYW1lLnNwbGl0KCcuJykpKTtcbiAgICAgICAgY29uc3Qgd2hlcmVGaWVsZHMgPSBmbGF0dGVuZWRXaGVyZUtleXMubWFwKG5hbWUgPT4gXy5nZXQodGhpcy5yYXdBdHRyaWJ1dGVzLCBgJHtuYW1lfS5maWVsZGAsIG5hbWUpKTtcbiAgICAgICAgY29uc3QgZGVmYXVsdEZpZWxkcyA9IG9wdGlvbnMuZGVmYXVsdHMgJiYgT2JqZWN0LmtleXMob3B0aW9ucy5kZWZhdWx0cylcbiAgICAgICAgICAuZmlsdGVyKG5hbWUgPT4gdGhpcy5yYXdBdHRyaWJ1dGVzW25hbWVdKVxuICAgICAgICAgIC5tYXAobmFtZSA9PiB0aGlzLnJhd0F0dHJpYnV0ZXNbbmFtZV0uZmllbGQgfHwgbmFtZSk7XG5cbiAgICAgICAgY29uc3QgZXJyRmllbGRLZXlzID0gT2JqZWN0LmtleXMoZXJyLmZpZWxkcyk7XG4gICAgICAgIGNvbnN0IGVyckZpZWxkc1doZXJlSW50ZXJzZWN0cyA9IFV0aWxzLmludGVyc2VjdHMoZXJyRmllbGRLZXlzLCB3aGVyZUZpZWxkcyk7XG4gICAgICAgIGlmIChkZWZhdWx0RmllbGRzICYmICFlcnJGaWVsZHNXaGVyZUludGVyc2VjdHMgJiYgVXRpbHMuaW50ZXJzZWN0cyhlcnJGaWVsZEtleXMsIGRlZmF1bHRGaWVsZHMpKSB7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVyckZpZWxkc1doZXJlSW50ZXJzZWN0cykge1xuICAgICAgICAgIF8uZWFjaChlcnIuZmllbGRzLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMuZmllbGRSYXdBdHRyaWJ1dGVzTWFwW2tleV0uZmllbGROYW1lO1xuICAgICAgICAgICAgaWYgKHZhbHVlLnRvU3RyaW5nKCkgIT09IG9wdGlvbnMud2hlcmVbbmFtZV0udG9TdHJpbmcoKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5uYW1lfSNmaW5kT3JDcmVhdGU6IHZhbHVlIHVzZWQgZm9yICR7bmFtZX0gd2FzIG5vdCBlcXVhbCBmb3IgYm90aCB0aGUgZmluZCBhbmQgdGhlIGNyZWF0ZSBjYWxscywgJyR7b3B0aW9ucy53aGVyZVtuYW1lXX0nIHZzICcke3ZhbHVlfSdgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNvbWVvbmUgbXVzdCBoYXZlIGNyZWF0ZWQgYSBtYXRjaGluZyBpbnN0YW5jZSBpbnNpZGUgdGhlIHNhbWUgdHJhbnNhY3Rpb24gc2luY2Ugd2UgbGFzdCBkaWQgYSBmaW5kLiBMZXQncyBmaW5kIGl0IVxuICAgICAgICByZXR1cm4gdGhpcy5maW5kT25lKFV0aWxzLmRlZmF1bHRzKHtcbiAgICAgICAgICB0cmFuc2FjdGlvbjogaW50ZXJuYWxUcmFuc2FjdGlvbiA/IG51bGwgOiB0cmFuc2FjdGlvblxuICAgICAgICB9LCBvcHRpb25zKSkudGhlbihpbnN0YW5jZSA9PiB7XG4gICAgICAgICAgLy8gU2FuaXR5IGNoZWNrLCBpZGVhbGx5IHdlIGNhdWdodCB0aGlzIGF0IHRoZSBkZWZhdWx0RmVpbGRzL2Vyci5maWVsZHMgY2hlY2tcbiAgICAgICAgICAvLyBCdXQgaWYgd2UgZGlkbid0IGFuZCBpbnN0YW5jZSBpcyBudWxsLCB3ZSB3aWxsIHRocm93XG4gICAgICAgICAgaWYgKGluc3RhbmNlID09PSBudWxsKSB0aHJvdyBlcnI7XG4gICAgICAgICAgcmV0dXJuIFtpbnN0YW5jZSwgZmFsc2VdO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgaWYgKGludGVybmFsVHJhbnNhY3Rpb24gJiYgdHJhbnNhY3Rpb24pIHtcbiAgICAgICAgLy8gSWYgd2UgY3JlYXRlZCBhIHRyYW5zYWN0aW9uIGludGVybmFsbHkgKGFuZCBub3QganVzdCBhIHNhdmVwb2ludCksIHdlIHNob3VsZCBjbGVhbiBpdCB1cFxuICAgICAgICByZXR1cm4gdHJhbnNhY3Rpb24uY29tbWl0KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQSBtb3JlIHBlcmZvcm1hbnQgZmluZE9yQ3JlYXRlIHRoYXQgd2lsbCBub3Qgd29yayB1bmRlciBhIHRyYW5zYWN0aW9uIChhdCBsZWFzdCBub3QgaW4gcG9zdGdyZXMpXG4gICAqIFdpbGwgZXhlY3V0ZSBhIGZpbmQgY2FsbCwgaWYgZW1wdHkgdGhlbiBhdHRlbXB0IHRvIGNyZWF0ZSwgaWYgdW5pcXVlIGNvbnN0cmFpbnQgdGhlbiBhdHRlbXB0IHRvIGZpbmQgYWdhaW5cbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuZmluZEFsbH0gZm9yIGEgZnVsbCBzcGVjaWZpY2F0aW9uIG9mIGZpbmQgYW5kIG9wdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgZmluZCBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLndoZXJlIEEgaGFzaCBvZiBzZWFyY2ggYXR0cmlidXRlcy4gSWYgYHdoZXJlYCBpcyBhIHBsYWluIG9iamVjdCBpdCB3aWxsIGJlIGFwcGVuZGVkIHdpdGggZGVmYXVsdHMgdG8gYnVpbGQgYSBuZXcgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5kZWZhdWx0c10gRGVmYXVsdCB2YWx1ZXMgdG8gdXNlIGlmIGNyZWF0aW5nIGEgbmV3IGluc3RhbmNlXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsLGJvb2xlYW4+fVxuICAgKi9cbiAgc3RhdGljIGZpbmRDcmVhdGVGaW5kKG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMud2hlcmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ01pc3Npbmcgd2hlcmUgYXR0cmlidXRlIGluIHRoZSBvcHRpb25zIHBhcmFtZXRlciBwYXNzZWQgdG8gZmluZENyZWF0ZUZpbmQuJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBsZXQgdmFsdWVzID0gXy5jbG9uZShvcHRpb25zLmRlZmF1bHRzKSB8fCB7fTtcbiAgICBpZiAoXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMud2hlcmUpKSB7XG4gICAgICB2YWx1ZXMgPSBVdGlscy5kZWZhdWx0cyh2YWx1ZXMsIG9wdGlvbnMud2hlcmUpO1xuICAgIH1cblxuXG4gICAgcmV0dXJuIHRoaXMuZmluZE9uZShvcHRpb25zKS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICBpZiAocmVzdWx0KSByZXR1cm4gW3Jlc3VsdCwgZmFsc2VdO1xuXG4gICAgICByZXR1cm4gdGhpcy5jcmVhdGUodmFsdWVzLCBvcHRpb25zKVxuICAgICAgICAudGhlbihyZXN1bHQgPT4gW3Jlc3VsdCwgdHJ1ZV0pXG4gICAgICAgIC5jYXRjaChzZXF1ZWxpemVFcnJvcnMuVW5pcXVlQ29uc3RyYWludEVycm9yLCAoKSA9PiB0aGlzLmZpbmRPbmUob3B0aW9ucykudGhlbihyZXN1bHQgPT4gW3Jlc3VsdCwgZmFsc2VdKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0IG9yIHVwZGF0ZSBhIHNpbmdsZSByb3cuIEFuIHVwZGF0ZSB3aWxsIGJlIGV4ZWN1dGVkIGlmIGEgcm93IHdoaWNoIG1hdGNoZXMgdGhlIHN1cHBsaWVkIHZhbHVlcyBvbiBlaXRoZXIgdGhlIHByaW1hcnkga2V5IG9yIGEgdW5pcXVlIGtleSBpcyBmb3VuZC4gTm90ZSB0aGF0IHRoZSB1bmlxdWUgaW5kZXggbXVzdCBiZSBkZWZpbmVkIGluIHlvdXIgc2VxdWVsaXplIG1vZGVsIGFuZCBub3QganVzdCBpbiB0aGUgdGFibGUuIE90aGVyd2lzZSB5b3UgbWF5IGV4cGVyaWVuY2UgYSB1bmlxdWUgY29uc3RyYWludCB2aW9sYXRpb24sIGJlY2F1c2Ugc2VxdWVsaXplIGZhaWxzIHRvIGlkZW50aWZ5IHRoZSByb3cgdGhhdCBzaG91bGQgYmUgdXBkYXRlZC5cbiAgICpcbiAgICogKipJbXBsZW1lbnRhdGlvbiBkZXRhaWxzOioqXG4gICAqXG4gICAqICogTXlTUUwgLSBJbXBsZW1lbnRlZCBhcyBhIHNpbmdsZSBxdWVyeSBgSU5TRVJUIHZhbHVlcyBPTiBEVVBMSUNBVEUgS0VZIFVQREFURSB2YWx1ZXNgXG4gICAqICogUG9zdGdyZVNRTCAtIEltcGxlbWVudGVkIGFzIGEgdGVtcG9yYXJ5IGZ1bmN0aW9uIHdpdGggZXhjZXB0aW9uIGhhbmRsaW5nOiBJTlNFUlQgRVhDRVBUSU9OIFdIRU4gdW5pcXVlX2NvbnN0cmFpbnQgVVBEQVRFXG4gICAqICogU1FMaXRlIC0gSW1wbGVtZW50ZWQgYXMgdHdvIHF1ZXJpZXMgYElOU0VSVDsgVVBEQVRFYC4gVGhpcyBtZWFucyB0aGF0IHRoZSB1cGRhdGUgaXMgZXhlY3V0ZWQgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZSByb3cgYWxyZWFkeSBleGlzdGVkIG9yIG5vdFxuICAgKiAqIE1TU1FMIC0gSW1wbGVtZW50ZWQgYXMgYSBzaW5nbGUgcXVlcnkgdXNpbmcgYE1FUkdFYCBhbmQgYFdIRU4gKE5PVCkgTUFUQ0hFRCBUSEVOYFxuICAgKiAqKk5vdGUqKiB0aGF0IFNRTGl0ZSByZXR1cm5zIHVuZGVmaW5lZCBmb3IgY3JlYXRlZCwgbm8gbWF0dGVyIGlmIHRoZSByb3cgd2FzIGNyZWF0ZWQgb3IgdXBkYXRlZC4gVGhpcyBpcyBiZWNhdXNlIFNRTGl0ZSBhbHdheXMgcnVucyBJTlNFUlQgT1IgSUdOT1JFICsgVVBEQVRFLCBpbiBhIHNpbmdsZSBxdWVyeSwgc28gdGhlcmUgaXMgbm8gd2F5IHRvIGtub3cgd2hldGhlciB0aGUgcm93IHdhcyBpbnNlcnRlZCBvciBub3QuXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgdmFsdWVzIGhhc2ggb2YgdmFsdWVzIHRvIHVwc2VydFxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgIFtvcHRpb25zXSB1cHNlcnQgb3B0aW9uc1xuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLnZhbGlkYXRlPXRydWVdIFJ1biB2YWxpZGF0aW9ucyBiZWZvcmUgdGhlIHJvdyBpcyBpbnNlcnRlZFxuICAgKiBAcGFyYW0gIHtBcnJheX0gICAgICAgIFtvcHRpb25zLmZpZWxkcz1PYmplY3Qua2V5cyh0aGlzLmF0dHJpYnV0ZXMpXSBUaGUgZmllbGRzIHRvIGluc2VydCAvIHVwZGF0ZS4gRGVmYXVsdHMgdG8gYWxsIGNoYW5nZWQgZmllbGRzXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaG9va3M9dHJ1ZV0gIFJ1biBiZWZvcmUgLyBhZnRlciB1cHNlcnQgaG9va3M/XG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMucmV0dXJuaW5nPWZhbHNlXSBBcHBlbmQgUkVUVVJOSU5HICogdG8gZ2V0IGJhY2sgYXV0byBnZW5lcmF0ZWQgdmFsdWVzIChQb3N0Z3JlcyBvbmx5KVxuICAgKiBAcGFyYW0gIHtUcmFuc2FjdGlvbn0gIFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcbiAgICogQHBhcmFtICB7RnVuY3Rpb259ICAgICBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGlsZSBydW5uaW5nIHRoZSBxdWVyeSB0byBsb2cgdGhlIHNxbC5cbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgIFtvcHRpb25zLnNlYXJjaFBhdGg9REVGQVVMVF0gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59IFJldHVybnMgYSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGUgcm93IHdhcyBjcmVhdGVkIG9yIHVwZGF0ZWQuIEZvciBNeVNRTC9NYXJpYURCLCBpdCByZXR1cm5zIGB0cnVlYCB3aGVuIGluc2VydGVkIGFuZCBgZmFsc2VgIHdoZW4gdXBkYXRlZC4gRm9yIFBvc3RncmVzL01TU1FMIHdpdGggKG9wdGlvbnMucmV0dXJuaW5nPXRydWUpLCBpdCByZXR1cm5zIHJlY29yZCBhbmQgY3JlYXRlZCBib29sZWFuIHdpdGggc2lnbmF0dXJlIGA8TW9kZWwsIGNyZWF0ZWQ+YC5cbiAgICovXG4gIHN0YXRpYyB1cHNlcnQodmFsdWVzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgaG9va3M6IHRydWUsXG4gICAgICByZXR1cm5pbmc6IGZhbHNlLFxuICAgICAgdmFsaWRhdGU6IHRydWVcbiAgICB9LCBVdGlscy5jbG9uZURlZXAob3B0aW9ucyB8fCB7fSkpO1xuXG4gICAgb3B0aW9ucy5tb2RlbCA9IHRoaXM7XG5cbiAgICBjb25zdCBjcmVhdGVkQXRBdHRyID0gdGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy5jcmVhdGVkQXQ7XG4gICAgY29uc3QgdXBkYXRlZEF0QXR0ciA9IHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0O1xuICAgIGNvbnN0IGhhc1ByaW1hcnkgPSB0aGlzLnByaW1hcnlLZXlGaWVsZCBpbiB2YWx1ZXMgfHwgdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlIGluIHZhbHVlcztcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuYnVpbGQodmFsdWVzKTtcblxuICAgIGlmICghb3B0aW9ucy5maWVsZHMpIHtcbiAgICAgIG9wdGlvbnMuZmllbGRzID0gT2JqZWN0LmtleXMoaW5zdGFuY2UuX2NoYW5nZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XG4gICAgICBpZiAob3B0aW9ucy52YWxpZGF0ZSkge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2UudmFsaWRhdGUob3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBNYXAgZmllbGQgbmFtZXNcbiAgICAgIGNvbnN0IHVwZGF0ZWREYXRhVmFsdWVzID0gXy5waWNrKGluc3RhbmNlLmRhdGFWYWx1ZXMsIE9iamVjdC5rZXlzKGluc3RhbmNlLl9jaGFuZ2VkKSk7XG4gICAgICBjb25zdCBpbnNlcnRWYWx1ZXMgPSBVdGlscy5tYXBWYWx1ZUZpZWxkTmFtZXMoaW5zdGFuY2UuZGF0YVZhbHVlcywgT2JqZWN0LmtleXMoaW5zdGFuY2UucmF3QXR0cmlidXRlcyksIHRoaXMpO1xuICAgICAgY29uc3QgdXBkYXRlVmFsdWVzID0gVXRpbHMubWFwVmFsdWVGaWVsZE5hbWVzKHVwZGF0ZWREYXRhVmFsdWVzLCBvcHRpb25zLmZpZWxkcywgdGhpcyk7XG4gICAgICBjb25zdCBub3cgPSBVdGlscy5ub3codGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KTtcblxuICAgICAgLy8gQXR0YWNoIGNyZWF0ZWRBdFxuICAgICAgaWYgKGNyZWF0ZWRBdEF0dHIgJiYgIXVwZGF0ZVZhbHVlc1tjcmVhdGVkQXRBdHRyXSkge1xuICAgICAgICBjb25zdCBmaWVsZCA9IHRoaXMucmF3QXR0cmlidXRlc1tjcmVhdGVkQXRBdHRyXS5maWVsZCB8fCBjcmVhdGVkQXRBdHRyO1xuICAgICAgICBpbnNlcnRWYWx1ZXNbZmllbGRdID0gdGhpcy5fZ2V0RGVmYXVsdFRpbWVzdGFtcChjcmVhdGVkQXRBdHRyKSB8fCBub3c7XG4gICAgICB9XG4gICAgICBpZiAodXBkYXRlZEF0QXR0ciAmJiAhaW5zZXJ0VmFsdWVzW3VwZGF0ZWRBdEF0dHJdKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5yYXdBdHRyaWJ1dGVzW3VwZGF0ZWRBdEF0dHJdLmZpZWxkIHx8IHVwZGF0ZWRBdEF0dHI7XG4gICAgICAgIGluc2VydFZhbHVlc1tmaWVsZF0gPSB1cGRhdGVWYWx1ZXNbZmllbGRdID0gdGhpcy5fZ2V0RGVmYXVsdFRpbWVzdGFtcCh1cGRhdGVkQXRBdHRyKSB8fCBub3c7XG4gICAgICB9XG5cbiAgICAgIC8vIEJ1aWxkIGFkZHMgYSBudWxsIHZhbHVlIGZvciB0aGUgcHJpbWFyeSBrZXksIGlmIG5vbmUgd2FzIGdpdmVuIGJ5IHRoZSB1c2VyLlxuICAgICAgLy8gV2UgbmVlZCB0byByZW1vdmUgdGhhdCBiZWNhdXNlIG9mIHNvbWUgUG9zdGdyZXMgdGVjaG5pY2FsaXRpZXMuXG4gICAgICBpZiAoIWhhc1ByaW1hcnkgJiYgdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlICYmICF0aGlzLnJhd0F0dHJpYnV0ZXNbdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlXS5kZWZhdWx0VmFsdWUpIHtcbiAgICAgICAgZGVsZXRlIGluc2VydFZhbHVlc1t0aGlzLnByaW1hcnlLZXlGaWVsZF07XG4gICAgICAgIGRlbGV0ZSB1cGRhdGVWYWx1ZXNbdGhpcy5wcmltYXJ5S2V5RmllbGRdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xuICAgICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdiZWZvcmVVcHNlcnQnLCB2YWx1ZXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UudXBzZXJ0KHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBpbnNlcnRWYWx1ZXMsIHVwZGF0ZVZhbHVlcywgaW5zdGFuY2Uud2hlcmUoKSwgdGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChbY3JlYXRlZCwgcHJpbWFyeUtleV0pID0+IHtcbiAgICAgICAgICBpZiAob3B0aW9ucy5yZXR1cm5pbmcgPT09IHRydWUgJiYgcHJpbWFyeUtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluZEJ5UGsocHJpbWFyeUtleSwgb3B0aW9ucykudGhlbihyZWNvcmQgPT4gW3JlY29yZCwgY3JlYXRlZF0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBjcmVhdGVkO1xuICAgICAgICB9KVxuICAgICAgICAudGFwKHJlc3VsdCA9PiB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdhZnRlclVwc2VydCcsIHJlc3VsdCwgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW5kIGluc2VydCBtdWx0aXBsZSBpbnN0YW5jZXMgaW4gYnVsay5cbiAgICpcbiAgICogVGhlIHN1Y2Nlc3MgaGFuZGxlciBpcyBwYXNzZWQgYW4gYXJyYXkgb2YgaW5zdGFuY2VzLCBidXQgcGxlYXNlIG5vdGljZSB0aGF0IHRoZXNlIG1heSBub3QgY29tcGxldGVseSByZXByZXNlbnQgdGhlIHN0YXRlIG9mIHRoZSByb3dzIGluIHRoZSBEQi4gVGhpcyBpcyBiZWNhdXNlIE15U1FMXG4gICAqIGFuZCBTUUxpdGUgZG8gbm90IG1ha2UgaXQgZWFzeSB0byBvYnRhaW4gYmFjayBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBJRHMgYW5kIG90aGVyIGRlZmF1bHQgdmFsdWVzIGluIGEgd2F5IHRoYXQgY2FuIGJlIG1hcHBlZCB0byBtdWx0aXBsZSByZWNvcmRzLlxuICAgKiBUbyBvYnRhaW4gSW5zdGFuY2VzIGZvciB0aGUgbmV3bHkgY3JlYXRlZCB2YWx1ZXMsIHlvdSB3aWxsIG5lZWQgdG8gcXVlcnkgZm9yIHRoZW0gYWdhaW4uXG4gICAqXG4gICAqIElmIHZhbGlkYXRpb24gZmFpbHMsIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIHdpdGggYW4gYXJyYXktbGlrZSBbQWdncmVnYXRlRXJyb3JdKGh0dHA6Ly9ibHVlYmlyZGpzLmNvbS9kb2NzL2FwaS9hZ2dyZWdhdGVlcnJvci5odG1sKVxuICAgKlxuICAgKiBAcGFyYW0gIHtBcnJheX0gICAgICAgIHJlY29yZHMgICAgICAgICAgICAgICAgICAgICAgICAgIExpc3Qgb2Ygb2JqZWN0cyAoa2V5L3ZhbHVlIHBhaXJzKSB0byBjcmVhdGUgaW5zdGFuY2VzIGZyb21cbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICBbb3B0aW9uc10gICAgICAgICAgICAgICAgICAgICAgICBCdWxrIGNyZWF0ZSBvcHRpb25zXG4gICAqIEBwYXJhbSAge0FycmF5fSAgICAgICAgW29wdGlvbnMuZmllbGRzXSAgICAgICAgICAgICAgICAgRmllbGRzIHRvIGluc2VydCAoZGVmYXVsdHMgdG8gYWxsIGZpZWxkcylcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy52YWxpZGF0ZT1mYWxzZV0gICAgICAgICBTaG91bGQgZWFjaCByb3cgYmUgc3ViamVjdCB0byB2YWxpZGF0aW9uIGJlZm9yZSBpdCBpcyBpbnNlcnRlZC4gVGhlIHdob2xlIGluc2VydCB3aWxsIGZhaWwgaWYgb25lIHJvdyBmYWlscyB2YWxpZGF0aW9uXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaG9va3M9dHJ1ZV0gICAgICAgICAgICAgUnVuIGJlZm9yZSAvIGFmdGVyIGJ1bGsgY3JlYXRlIGhvb2tzP1xuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLmluZGl2aWR1YWxIb29rcz1mYWxzZV0gIFJ1biBiZWZvcmUgLyBhZnRlciBjcmVhdGUgaG9va3MgZm9yIGVhY2ggaW5kaXZpZHVhbCBJbnN0YW5jZT8gQnVsa0NyZWF0ZSBob29rcyB3aWxsIHN0aWxsIGJlIHJ1biBpZiBvcHRpb25zLmhvb2tzIGlzIHRydWUuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaWdub3JlRHVwbGljYXRlcz1mYWxzZV0gSWdub3JlIGR1cGxpY2F0ZSB2YWx1ZXMgZm9yIHByaW1hcnkga2V5cz8gKG5vdCBzdXBwb3J0ZWQgYnkgTVNTUUwgb3IgUG9zdGdyZXMgPCA5LjUpXG4gICAqIEBwYXJhbSAge0FycmF5fSAgICAgICAgW29wdGlvbnMudXBkYXRlT25EdXBsaWNhdGVdICAgICAgRmllbGRzIHRvIHVwZGF0ZSBpZiByb3cga2V5IGFscmVhZHkgZXhpc3RzIChvbiBkdXBsaWNhdGUga2V5IHVwZGF0ZSk/IChvbmx5IHN1cHBvcnRlZCBieSBNeVNRTCwgTWFyaWFEQiwgU1FMaXRlID49IDMuMjQuMCAmIFBvc3RncmVzID49IDkuNSkuIEJ5IGRlZmF1bHQsIGFsbCBmaWVsZHMgYXJlIHVwZGF0ZWQuXG4gICAqIEBwYXJhbSAge1RyYW5zYWN0aW9ufSAgW29wdGlvbnMudHJhbnNhY3Rpb25dICAgICAgICAgICAgVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gICAgICAgICAgQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuYmVuY2htYXJrPWZhbHNlXSAgICAgICAgUGFzcyBxdWVyeSBleGVjdXRpb24gdGltZSBpbiBtaWxsaXNlY29uZHMgYXMgc2Vjb25kIGFyZ3VtZW50IHRvIGxvZ2dpbmcgZnVuY3Rpb24gKG9wdGlvbnMubG9nZ2luZykuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW58QXJyYXl9IFtvcHRpb25zLnJldHVybmluZz1mYWxzZV0gICAgICAgSWYgdHJ1ZSwgYXBwZW5kIFJFVFVSTklORyAqIHRvIGdldCBiYWNrIGFsbCB2YWx1ZXM7IGlmIGFuIGFycmF5IG9mIGNvbHVtbiBuYW1lcywgYXBwZW5kIFJFVFVSTklORyA8Y29sdW1ucz4gdG8gZ2V0IGJhY2sgc3BlY2lmaWMgY29sdW1ucyAoUG9zdGdyZXMgb25seSlcbiAgICogQHBhcmFtICB7c3RyaW5nfSAgICAgICBbb3B0aW9ucy5zZWFyY2hQYXRoPURFRkFVTFRdICAgICBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBcnJheTxNb2RlbD4+fVxuICAgKi9cbiAgc3RhdGljIGJ1bGtDcmVhdGUocmVjb3Jkcywgb3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKCFyZWNvcmRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgfVxuXG4gICAgY29uc3QgZGlhbGVjdCA9IHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdDtcbiAgICBjb25zdCBub3cgPSBVdGlscy5ub3codGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KTtcblxuICAgIG9wdGlvbnMubW9kZWwgPSB0aGlzO1xuXG4gICAgaWYgKCFvcHRpb25zLmluY2x1ZGVWYWxpZGF0ZWQpIHtcbiAgICAgIHRoaXMuX2NvbmZvcm1JbmNsdWRlcyhvcHRpb25zLCB0aGlzKTtcbiAgICAgIGlmIChvcHRpb25zLmluY2x1ZGUpIHtcbiAgICAgICAgdGhpcy5fZXhwYW5kSW5jbHVkZUFsbChvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzKG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGluc3RhbmNlcyA9IHJlY29yZHMubWFwKHZhbHVlcyA9PiB0aGlzLmJ1aWxkKHZhbHVlcywgeyBpc05ld1JlY29yZDogdHJ1ZSwgaW5jbHVkZTogb3B0aW9ucy5pbmNsdWRlIH0pKTtcblxuICAgIGNvbnN0IHJlY3Vyc2l2ZUJ1bGtDcmVhdGUgPSAoaW5zdGFuY2VzLCBvcHRpb25zKSA9PiB7XG4gICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIHZhbGlkYXRlOiBmYWxzZSxcbiAgICAgICAgaG9va3M6IHRydWUsXG4gICAgICAgIGluZGl2aWR1YWxIb29rczogZmFsc2UsXG4gICAgICAgIGlnbm9yZUR1cGxpY2F0ZXM6IGZhbHNlXG4gICAgICB9LCBvcHRpb25zKTtcblxuICAgICAgaWYgKG9wdGlvbnMucmV0dXJuaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuYXNzb2NpYXRpb24pIHtcbiAgICAgICAgICBvcHRpb25zLnJldHVybmluZyA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9wdGlvbnMucmV0dXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5pZ25vcmVEdXBsaWNhdGVzICYmIFsnbXNzcWwnXS5pbmNsdWRlcyhkaWFsZWN0KSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGAke2RpYWxlY3R9IGRvZXMgbm90IHN1cHBvcnQgdGhlIGlnbm9yZUR1cGxpY2F0ZXMgb3B0aW9uLmApKTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLnVwZGF0ZU9uRHVwbGljYXRlICYmIChkaWFsZWN0ICE9PSAnbXlzcWwnICYmIGRpYWxlY3QgIT09ICdtYXJpYWRiJyAmJiBkaWFsZWN0ICE9PSAnc3FsaXRlJyAmJiBkaWFsZWN0ICE9PSAncG9zdGdyZXMnKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGAke2RpYWxlY3R9IGRvZXMgbm90IHN1cHBvcnQgdGhlIHVwZGF0ZU9uRHVwbGljYXRlIG9wdGlvbi5gKSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1vZGVsID0gb3B0aW9ucy5tb2RlbDtcblxuICAgICAgb3B0aW9ucy5maWVsZHMgPSBvcHRpb25zLmZpZWxkcyB8fCBPYmplY3Qua2V5cyhtb2RlbC5yYXdBdHRyaWJ1dGVzKTtcbiAgICAgIGNvbnN0IGNyZWF0ZWRBdEF0dHIgPSBtb2RlbC5fdGltZXN0YW1wQXR0cmlidXRlcy5jcmVhdGVkQXQ7XG4gICAgICBjb25zdCB1cGRhdGVkQXRBdHRyID0gbW9kZWwuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0O1xuXG4gICAgICBpZiAob3B0aW9ucy51cGRhdGVPbkR1cGxpY2F0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMudXBkYXRlT25EdXBsaWNhdGUpICYmIG9wdGlvbnMudXBkYXRlT25EdXBsaWNhdGUubGVuZ3RoKSB7XG4gICAgICAgICAgb3B0aW9ucy51cGRhdGVPbkR1cGxpY2F0ZSA9IF8uaW50ZXJzZWN0aW9uKFxuICAgICAgICAgICAgXy53aXRob3V0KE9iamVjdC5rZXlzKG1vZGVsLnRhYmxlQXR0cmlidXRlcyksIGNyZWF0ZWRBdEF0dHIpLFxuICAgICAgICAgICAgb3B0aW9ucy51cGRhdGVPbkR1cGxpY2F0ZVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcigndXBkYXRlT25EdXBsaWNhdGUgb3B0aW9uIG9ubHkgc3VwcG9ydHMgbm9uLWVtcHR5IGFycmF5LicpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xuICAgICAgICAvLyBSdW4gYmVmb3JlIGhvb2tcbiAgICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcbiAgICAgICAgICByZXR1cm4gbW9kZWwucnVuSG9va3MoJ2JlZm9yZUJ1bGtDcmVhdGUnLCBpbnN0YW5jZXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy8gVmFsaWRhdGVcbiAgICAgICAgaWYgKG9wdGlvbnMudmFsaWRhdGUpIHtcbiAgICAgICAgICBjb25zdCBlcnJvcnMgPSBuZXcgUHJvbWlzZS5BZ2dyZWdhdGVFcnJvcigpO1xuICAgICAgICAgIGNvbnN0IHZhbGlkYXRlT3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucyk7XG4gICAgICAgICAgdmFsaWRhdGVPcHRpb25zLmhvb2tzID0gb3B0aW9ucy5pbmRpdmlkdWFsSG9va3M7XG5cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5tYXAoaW5zdGFuY2VzLCBpbnN0YW5jZSA9PlxuICAgICAgICAgICAgaW5zdGFuY2UudmFsaWRhdGUodmFsaWRhdGVPcHRpb25zKS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBlcnJvcnMucHVzaChuZXcgc2VxdWVsaXplRXJyb3JzLkJ1bGtSZWNvcmRFcnJvcihlcnIsIGluc3RhbmNlKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBkZWxldGUgb3B0aW9ucy5za2lwO1xuICAgICAgICAgICAgaWYgKGVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgdGhyb3cgZXJyb3JzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaW5kaXZpZHVhbEhvb2tzKSB7XG4gICAgICAgICAgLy8gQ3JlYXRlIGVhY2ggaW5zdGFuY2UgaW5kaXZpZHVhbGx5XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UubWFwKGluc3RhbmNlcywgaW5zdGFuY2UgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kaXZpZHVhbE9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpO1xuICAgICAgICAgICAgZGVsZXRlIGluZGl2aWR1YWxPcHRpb25zLmZpZWxkcztcbiAgICAgICAgICAgIGRlbGV0ZSBpbmRpdmlkdWFsT3B0aW9ucy5pbmRpdmlkdWFsSG9va3M7XG4gICAgICAgICAgICBkZWxldGUgaW5kaXZpZHVhbE9wdGlvbnMuaWdub3JlRHVwbGljYXRlcztcbiAgICAgICAgICAgIGluZGl2aWR1YWxPcHRpb25zLnZhbGlkYXRlID0gZmFsc2U7XG4gICAgICAgICAgICBpbmRpdmlkdWFsT3B0aW9ucy5ob29rcyA9IHRydWU7XG5cbiAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZS5zYXZlKGluZGl2aWR1YWxPcHRpb25zKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZSB8fCAhb3B0aW9ucy5pbmNsdWRlLmxlbmd0aCkgcmV0dXJuO1xuXG4gICAgICAgICAgLy8gTmVzdGVkIGNyZWF0aW9uIGZvciBCZWxvbmdzVG8gcmVsYXRpb25zXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UubWFwKG9wdGlvbnMuaW5jbHVkZS5maWx0ZXIoaW5jbHVkZSA9PiBpbmNsdWRlLmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvKSwgaW5jbHVkZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NvY2lhdGlvbkluc3RhbmNlcyA9IFtdO1xuICAgICAgICAgICAgY29uc3QgYXNzb2NpYXRpb25JbnN0YW5jZUluZGV4VG9JbnN0YW5jZU1hcCA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGluc3RhbmNlIG9mIGluc3RhbmNlcykge1xuICAgICAgICAgICAgICBjb25zdCBhc3NvY2lhdGlvbkluc3RhbmNlID0gaW5zdGFuY2UuZ2V0KGluY2x1ZGUuYXMpO1xuICAgICAgICAgICAgICBpZiAoYXNzb2NpYXRpb25JbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIGFzc29jaWF0aW9uSW5zdGFuY2VzLnB1c2goYXNzb2NpYXRpb25JbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgYXNzb2NpYXRpb25JbnN0YW5jZUluZGV4VG9JbnN0YW5jZU1hcC5wdXNoKGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWFzc29jaWF0aW9uSW5zdGFuY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGluY2x1ZGVPcHRpb25zID0gXyhVdGlscy5jbG9uZURlZXAoaW5jbHVkZSkpXG4gICAgICAgICAgICAgIC5vbWl0KFsnYXNzb2NpYXRpb24nXSlcbiAgICAgICAgICAgICAgLmRlZmF1bHRzKHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbjogb3B0aW9ucy50cmFuc2FjdGlvbixcbiAgICAgICAgICAgICAgICBsb2dnaW5nOiBvcHRpb25zLmxvZ2dpbmdcbiAgICAgICAgICAgICAgfSkudmFsdWUoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlY3Vyc2l2ZUJ1bGtDcmVhdGUoYXNzb2NpYXRpb25JbnN0YW5jZXMsIGluY2x1ZGVPcHRpb25zKS50aGVuKGFzc29jaWF0aW9uSW5zdGFuY2VzID0+IHtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBpZHggaW4gYXNzb2NpYXRpb25JbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NvY2lhdGlvbkluc3RhbmNlID0gYXNzb2NpYXRpb25JbnN0YW5jZXNbaWR4XTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGFzc29jaWF0aW9uSW5zdGFuY2VJbmRleFRvSW5zdGFuY2VNYXBbaWR4XTtcblxuICAgICAgICAgICAgICAgIGluc3RhbmNlW2luY2x1ZGUuYXNzb2NpYXRpb24uYWNjZXNzb3JzLnNldF0oYXNzb2NpYXRpb25JbnN0YW5jZSwgeyBzYXZlOiBmYWxzZSwgbG9nZ2luZzogb3B0aW9ucy5sb2dnaW5nIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgLy8gQ3JlYXRlIGFsbCBpbiBvbmUgcXVlcnlcbiAgICAgICAgICAvLyBSZWNyZWF0ZSByZWNvcmRzIGZyb20gaW5zdGFuY2VzIHRvIHJlcHJlc2VudCBhbnkgY2hhbmdlcyBtYWRlIGluIGhvb2tzIG9yIHZhbGlkYXRpb25cbiAgICAgICAgICByZWNvcmRzID0gaW5zdGFuY2VzLm1hcChpbnN0YW5jZSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBpbnN0YW5jZS5kYXRhVmFsdWVzO1xuXG4gICAgICAgICAgICAvLyBzZXQgY3JlYXRlZEF0L3VwZGF0ZWRBdCBhdHRyaWJ1dGVzXG4gICAgICAgICAgICBpZiAoY3JlYXRlZEF0QXR0ciAmJiAhdmFsdWVzW2NyZWF0ZWRBdEF0dHJdKSB7XG4gICAgICAgICAgICAgIHZhbHVlc1tjcmVhdGVkQXRBdHRyXSA9IG5vdztcbiAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmZpZWxkcy5pbmNsdWRlcyhjcmVhdGVkQXRBdHRyKSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2goY3JlYXRlZEF0QXR0cik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1cGRhdGVkQXRBdHRyICYmICF2YWx1ZXNbdXBkYXRlZEF0QXR0cl0pIHtcbiAgICAgICAgICAgICAgdmFsdWVzW3VwZGF0ZWRBdEF0dHJdID0gbm93O1xuICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuZmllbGRzLmluY2x1ZGVzKHVwZGF0ZWRBdEF0dHIpKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5maWVsZHMucHVzaCh1cGRhdGVkQXRBdHRyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBvdXQgPSBPYmplY3QuYXNzaWduKHt9LCBVdGlscy5tYXBWYWx1ZUZpZWxkTmFtZXModmFsdWVzLCBvcHRpb25zLmZpZWxkcywgbW9kZWwpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIG1vZGVsLl92aXJ0dWFsQXR0cmlidXRlcykge1xuICAgICAgICAgICAgICBkZWxldGUgb3V0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gTWFwIGF0dHJpYnV0ZXMgdG8gZmllbGRzIGZvciBzZXJpYWwgaWRlbnRpZmljYXRpb25cbiAgICAgICAgICBjb25zdCBmaWVsZE1hcHBlZEF0dHJpYnV0ZXMgPSB7fTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGF0dHIgaW4gbW9kZWwudGFibGVBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBmaWVsZE1hcHBlZEF0dHJpYnV0ZXNbbW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCB8fCBhdHRyXSA9IG1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTWFwIHVwZGF0ZU9uRHVwbGljYXRlIGF0dHJpYnV0ZXMgdG8gZmllbGRzXG4gICAgICAgICAgaWYgKG9wdGlvbnMudXBkYXRlT25EdXBsaWNhdGUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMudXBkYXRlT25EdXBsaWNhdGUgPSBvcHRpb25zLnVwZGF0ZU9uRHVwbGljYXRlLm1hcChhdHRyID0+IG1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGQgfHwgYXR0cik7XG4gICAgICAgICAgICAvLyBHZXQgcHJpbWFyeSBrZXlzIGZvciBwb3N0Z3JlcyB0byBlbmFibGUgdXBkYXRlT25EdXBsaWNhdGVcbiAgICAgICAgICAgIG9wdGlvbnMudXBzZXJ0S2V5cyA9IF8uY2hhaW4obW9kZWwucHJpbWFyeUtleXMpLnZhbHVlcygpLm1hcCgnZmllbGQnKS52YWx1ZSgpO1xuICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKG1vZGVsLnVuaXF1ZUtleXMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgb3B0aW9ucy51cHNlcnRLZXlzID0gXy5jaGFpbihtb2RlbC51bmlxdWVLZXlzKS52YWx1ZXMoKS5maWx0ZXIoYyA9PiBjLmZpZWxkcy5sZW5ndGggPT09IDEpLm1hcCgnY29sdW1uJykudmFsdWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBNYXAgcmV0dXJuaW5nIGF0dHJpYnV0ZXMgdG8gZmllbGRzXG4gICAgICAgICAgaWYgKG9wdGlvbnMucmV0dXJuaW5nICYmIEFycmF5LmlzQXJyYXkob3B0aW9ucy5yZXR1cm5pbmcpKSB7XG4gICAgICAgICAgICBvcHRpb25zLnJldHVybmluZyA9IG9wdGlvbnMucmV0dXJuaW5nLm1hcChhdHRyID0+IG1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGQgfHwgYXR0cik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG1vZGVsLlF1ZXJ5SW50ZXJmYWNlLmJ1bGtJbnNlcnQobW9kZWwuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCByZWNvcmRzLCBvcHRpb25zLCBmaWVsZE1hcHBlZEF0dHJpYnV0ZXMpLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHRzKSkge1xuICAgICAgICAgICAgICByZXN1bHRzLmZvckVhY2goKHJlc3VsdCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gaW5zdGFuY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIWluc3RhbmNlIHx8IGtleSA9PT0gbW9kZWwucHJpbWFyeUtleUF0dHJpYnV0ZSAmJlxuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZS5nZXQobW9kZWwucHJpbWFyeUtleUF0dHJpYnV0ZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgWydteXNxbCcsICdtYXJpYWRiJywgJ3NxbGl0ZSddLmluY2x1ZGVzKGRpYWxlY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBxdWVyeS5qcyBmb3IgdGhlc2UgREJzIGlzIGJsaW5kLCBpdCBhdXRvaW5jcmVtZW50cyB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJpbWFyeWtleSB2YWx1ZSwgZXZlbiBpZiBpdCB3YXMgc2V0IG1hbnVhbGx5LiBBbHNvLCBpdCBjYW5cbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIG1vcmUgcmVzdWx0cyB0aGFuIGluc3RhbmNlcywgYnVnPy5cbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3VsdCwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWNvcmQgPSByZXN1bHRba2V5XTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdHRyID0gXy5maW5kKG1vZGVsLnJhd0F0dHJpYnV0ZXMsIGF0dHJpYnV0ZSA9PiBhdHRyaWJ1dGUuZmllbGROYW1lID09PSBrZXkgfHwgYXR0cmlidXRlLmZpZWxkID09PSBrZXkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlLmRhdGFWYWx1ZXNbYXR0ciAmJiBhdHRyLmZpZWxkTmFtZSB8fCBrZXldID0gcmVjb3JkO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKCFvcHRpb25zLmluY2x1ZGUgfHwgIW9wdGlvbnMuaW5jbHVkZS5sZW5ndGgpIHJldHVybjtcblxuICAgICAgICAvLyBOZXN0ZWQgY3JlYXRpb24gZm9yIEhhc09uZS9IYXNNYW55L0JlbG9uZ3NUb01hbnkgcmVsYXRpb25zXG4gICAgICAgIHJldHVybiBQcm9taXNlLm1hcChvcHRpb25zLmluY2x1ZGUuZmlsdGVyKGluY2x1ZGUgPT4gIShpbmNsdWRlLmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvIHx8XG4gICAgICAgICAgaW5jbHVkZS5wYXJlbnQgJiYgaW5jbHVkZS5wYXJlbnQuYXNzb2NpYXRpb24gaW5zdGFuY2VvZiBCZWxvbmdzVG9NYW55KSksIGluY2x1ZGUgPT4ge1xuICAgICAgICAgIGNvbnN0IGFzc29jaWF0aW9uSW5zdGFuY2VzID0gW107XG4gICAgICAgICAgY29uc3QgYXNzb2NpYXRpb25JbnN0YW5jZUluZGV4VG9JbnN0YW5jZU1hcCA9IFtdO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBpbnN0YW5jZSBvZiBpbnN0YW5jZXMpIHtcbiAgICAgICAgICAgIGxldCBhc3NvY2lhdGVkID0gaW5zdGFuY2UuZ2V0KGluY2x1ZGUuYXMpO1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFzc29jaWF0ZWQpKSBhc3NvY2lhdGVkID0gW2Fzc29jaWF0ZWRdO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGFzc29jaWF0aW9uSW5zdGFuY2Ugb2YgYXNzb2NpYXRlZCkge1xuICAgICAgICAgICAgICBpZiAoYXNzb2NpYXRpb25JbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIGlmICghKGluY2x1ZGUuYXNzb2NpYXRpb24gaW5zdGFuY2VvZiBCZWxvbmdzVG9NYW55KSkge1xuICAgICAgICAgICAgICAgICAgYXNzb2NpYXRpb25JbnN0YW5jZS5zZXQoaW5jbHVkZS5hc3NvY2lhdGlvbi5mb3JlaWduS2V5LCBpbnN0YW5jZS5nZXQoaW5jbHVkZS5hc3NvY2lhdGlvbi5zb3VyY2VLZXkgfHwgaW5zdGFuY2UuY29uc3RydWN0b3IucHJpbWFyeUtleUF0dHJpYnV0ZSwgeyByYXc6IHRydWUgfSksIHsgcmF3OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihhc3NvY2lhdGlvbkluc3RhbmNlLCBpbmNsdWRlLmFzc29jaWF0aW9uLnNjb3BlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXNzb2NpYXRpb25JbnN0YW5jZXMucHVzaChhc3NvY2lhdGlvbkluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICBhc3NvY2lhdGlvbkluc3RhbmNlSW5kZXhUb0luc3RhbmNlTWFwLnB1c2goaW5zdGFuY2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFhc3NvY2lhdGlvbkluc3RhbmNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBpbmNsdWRlT3B0aW9ucyA9IF8oVXRpbHMuY2xvbmVEZWVwKGluY2x1ZGUpKVxuICAgICAgICAgICAgLm9taXQoWydhc3NvY2lhdGlvbiddKVxuICAgICAgICAgICAgLmRlZmF1bHRzKHtcbiAgICAgICAgICAgICAgdHJhbnNhY3Rpb246IG9wdGlvbnMudHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgIGxvZ2dpbmc6IG9wdGlvbnMubG9nZ2luZ1xuICAgICAgICAgICAgfSkudmFsdWUoKTtcblxuICAgICAgICAgIHJldHVybiByZWN1cnNpdmVCdWxrQ3JlYXRlKGFzc29jaWF0aW9uSW5zdGFuY2VzLCBpbmNsdWRlT3B0aW9ucykudGhlbihhc3NvY2lhdGlvbkluc3RhbmNlcyA9PiB7XG4gICAgICAgICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbiBpbnN0YW5jZW9mIEJlbG9uZ3NUb01hbnkpIHtcbiAgICAgICAgICAgICAgY29uc3QgdmFsdWVTZXRzID0gW107XG5cbiAgICAgICAgICAgICAgZm9yIChjb25zdCBpZHggaW4gYXNzb2NpYXRpb25JbnN0YW5jZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NvY2lhdGlvbkluc3RhbmNlID0gYXNzb2NpYXRpb25JbnN0YW5jZXNbaWR4XTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGFzc29jaWF0aW9uSW5zdGFuY2VJbmRleFRvSW5zdGFuY2VNYXBbaWR4XTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IHt9O1xuICAgICAgICAgICAgICAgIHZhbHVlc1tpbmNsdWRlLmFzc29jaWF0aW9uLmZvcmVpZ25LZXldID0gaW5zdGFuY2UuZ2V0KGluc3RhbmNlLmNvbnN0cnVjdG9yLnByaW1hcnlLZXlBdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIHZhbHVlc1tpbmNsdWRlLmFzc29jaWF0aW9uLm90aGVyS2V5XSA9IGFzc29jaWF0aW9uSW5zdGFuY2UuZ2V0KGFzc29jaWF0aW9uSW5zdGFuY2UuY29uc3RydWN0b3IucHJpbWFyeUtleUF0dHJpYnV0ZSwgeyByYXc6IHRydWUgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBJbmNsdWRlIHZhbHVlcyBkZWZpbmVkIGluIHRoZSBhc3NvY2lhdGlvblxuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24odmFsdWVzLCBpbmNsdWRlLmFzc29jaWF0aW9uLnRocm91Z2guc2NvcGUpO1xuICAgICAgICAgICAgICAgIGlmIChhc3NvY2lhdGlvbkluc3RhbmNlW2luY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5uYW1lXSkge1xuICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBhdHRyIG9mIE9iamVjdC5rZXlzKGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uX2F1dG9HZW5lcmF0ZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyID09PSBpbmNsdWRlLmFzc29jaWF0aW9uLmZvcmVpZ25LZXkgfHxcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyID09PSBpbmNsdWRlLmFzc29jaWF0aW9uLm90aGVyS2V5IHx8XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGFzc29jaWF0aW9uSW5zdGFuY2VbaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLm5hbWVdW2F0dHJdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbYXR0cl0gPSBhc3NvY2lhdGlvbkluc3RhbmNlW2luY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5uYW1lXVthdHRyXTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YWx1ZVNldHMucHVzaCh2YWx1ZXMpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgdGhyb3VnaE9wdGlvbnMgPSBfKFV0aWxzLmNsb25lRGVlcChpbmNsdWRlKSlcbiAgICAgICAgICAgICAgICAub21pdChbJ2Fzc29jaWF0aW9uJywgJ2F0dHJpYnV0ZXMnXSlcbiAgICAgICAgICAgICAgICAuZGVmYXVsdHMoe1xuICAgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb246IG9wdGlvbnMudHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgICBsb2dnaW5nOiBvcHRpb25zLmxvZ2dpbmdcbiAgICAgICAgICAgICAgICB9KS52YWx1ZSgpO1xuICAgICAgICAgICAgICB0aHJvdWdoT3B0aW9ucy5tb2RlbCA9IGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaE1vZGVsO1xuICAgICAgICAgICAgICBjb25zdCB0aHJvdWdoSW5zdGFuY2VzID0gaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoTW9kZWwuYnVsa0J1aWxkKHZhbHVlU2V0cywgdGhyb3VnaE9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgIHJldHVybiByZWN1cnNpdmVCdWxrQ3JlYXRlKHRocm91Z2hJbnN0YW5jZXMsIHRocm91Z2hPcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy8gbWFwIGZpZWxkcyBiYWNrIHRvIGF0dHJpYnV0ZXNcbiAgICAgICAgaW5zdGFuY2VzLmZvckVhY2goaW5zdGFuY2UgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3QgYXR0ciBpbiBtb2RlbC5yYXdBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBpZiAobW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCAmJlxuICAgICAgICAgICAgICAgIGluc3RhbmNlLmRhdGFWYWx1ZXNbbW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZF0gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgIG1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGQgIT09IGF0dHJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBpbnN0YW5jZS5kYXRhVmFsdWVzW2F0dHJdID0gaW5zdGFuY2UuZGF0YVZhbHVlc1ttb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkXTtcbiAgICAgICAgICAgICAgZGVsZXRlIGluc3RhbmNlLmRhdGFWYWx1ZXNbbW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnN0YW5jZS5fcHJldmlvdXNEYXRhVmFsdWVzW2F0dHJdID0gaW5zdGFuY2UuZGF0YVZhbHVlc1thdHRyXTtcbiAgICAgICAgICAgIGluc3RhbmNlLmNoYW5nZWQoYXR0ciwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpbnN0YW5jZS5pc05ld1JlY29yZCA9IGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBSdW4gYWZ0ZXIgaG9va1xuICAgICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICAgIHJldHVybiBtb2RlbC5ydW5Ib29rcygnYWZ0ZXJCdWxrQ3JlYXRlJywgaW5zdGFuY2VzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigoKSA9PiBpbnN0YW5jZXMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVjdXJzaXZlQnVsa0NyZWF0ZShpbnN0YW5jZXMsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRydW5jYXRlIGFsbCBpbnN0YW5jZXMgb2YgdGhlIG1vZGVsLiBUaGlzIGlzIGEgY29udmVuaWVudCBtZXRob2QgZm9yIE1vZGVsLmRlc3Ryb3koeyB0cnVuY2F0ZTogdHJ1ZSB9KS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgICBbb3B0aW9uc10gVGhlIG9wdGlvbnMgcGFzc2VkIHRvIE1vZGVsLmRlc3Ryb3kgaW4gYWRkaXRpb24gdG8gdHJ1bmNhdGVcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5jYXNjYWRlID0gZmFsc2VdIFRydW5jYXRlcyBhbGwgdGFibGVzIHRoYXQgaGF2ZSBmb3JlaWduLWtleSByZWZlcmVuY2VzIHRvIHRoZSBuYW1lZCB0YWJsZSwgb3IgdG8gYW55IHRhYmxlcyBhZGRlZCB0byB0aGUgZ3JvdXAgZHVlIHRvIENBU0NBREUuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgW29wdGlvbnMucmVzdGFydElkZW50aXR5PWZhbHNlXSBBdXRvbWF0aWNhbGx5IHJlc3RhcnQgc2VxdWVuY2VzIG93bmVkIGJ5IGNvbHVtbnMgb2YgdGhlIHRydW5jYXRlZCB0YWJsZS5cbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gICAgICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbnxGdW5jdGlvbn0gW29wdGlvbnMubG9nZ2luZ10gQSBmdW5jdGlvbiB0aGF0IGxvZ3Mgc3FsIHF1ZXJpZXMsIG9yIGZhbHNlIGZvciBubyBsb2dnaW5nXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgW29wdGlvbnMuYmVuY2htYXJrPWZhbHNlXSBQYXNzIHF1ZXJ5IGV4ZWN1dGlvbiB0aW1lIGluIG1pbGxpc2Vjb25kcyBhcyBzZWNvbmQgYXJndW1lbnQgdG8gbG9nZ2luZyBmdW5jdGlvbiAob3B0aW9ucy5sb2dnaW5nKS5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICBbb3B0aW9ucy5zZWFyY2hQYXRoPURFRkFVTFRdIEFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byBzcGVjaWZ5IHRoZSBzY2hlbWEgc2VhcmNoX3BhdGggKFBvc3RncmVzIG9ubHkpXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKlxuICAgKiBAc2VlXG4gICAqIHtAbGluayBNb2RlbC5kZXN0cm95fSBmb3IgbW9yZSBpbmZvcm1hdGlvblxuICAgKi9cbiAgc3RhdGljIHRydW5jYXRlKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpIHx8IHt9O1xuICAgIG9wdGlvbnMudHJ1bmNhdGUgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzLmRlc3Ryb3kob3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIG11bHRpcGxlIGluc3RhbmNlcywgb3Igc2V0IHRoZWlyIGRlbGV0ZWRBdCB0aW1lc3RhbXAgdG8gdGhlIGN1cnJlbnQgdGltZSBpZiBgcGFyYW5vaWRgIGlzIGVuYWJsZWQuXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgb3B0aW9ucyAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0cm95IG9wdGlvbnNcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICBbb3B0aW9ucy53aGVyZV0gICAgICAgICAgICAgICAgIEZpbHRlciB0aGUgZGVzdHJveVxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLmhvb2tzPXRydWVdICAgICAgICAgICAgUnVuIGJlZm9yZSAvIGFmdGVyIGJ1bGsgZGVzdHJveSBob29rcz9cbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5pbmRpdmlkdWFsSG9va3M9ZmFsc2VdIElmIHNldCB0byB0cnVlLCBkZXN0cm95IHdpbGwgU0VMRUNUIGFsbCByZWNvcmRzIG1hdGNoaW5nIHRoZSB3aGVyZSBwYXJhbWV0ZXIgYW5kIHdpbGwgZXhlY3V0ZSBiZWZvcmUgLyBhZnRlciBkZXN0cm95IGhvb2tzIG9uIGVhY2ggcm93XG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgW29wdGlvbnMubGltaXRdICAgICAgICAgICAgICAgICBIb3cgbWFueSByb3dzIHRvIGRlbGV0ZVxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLmZvcmNlPWZhbHNlXSAgICAgICAgICAgRGVsZXRlIGluc3RlYWQgb2Ygc2V0dGluZyBkZWxldGVkQXQgdG8gY3VycmVudCB0aW1lc3RhbXAgKG9ubHkgYXBwbGljYWJsZSBpZiBgcGFyYW5vaWRgIGlzIGVuYWJsZWQpXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMudHJ1bmNhdGU9ZmFsc2VdICAgICAgICBJZiBzZXQgdG8gdHJ1ZSwgZGlhbGVjdHMgdGhhdCBzdXBwb3J0IGl0IHdpbGwgdXNlIFRSVU5DQVRFIGluc3RlYWQgb2YgREVMRVRFIEZST00uIElmIGEgdGFibGUgaXMgdHJ1bmNhdGVkIHRoZSB3aGVyZSBhbmQgbGltaXQgb3B0aW9ucyBhcmUgaWdub3JlZFxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLmNhc2NhZGU9ZmFsc2VdICAgICAgICAgT25seSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggVFJVTkNBVEUuIFRydW5jYXRlcyAgYWxsIHRhYmxlcyB0aGF0IGhhdmUgZm9yZWlnbi1rZXkgcmVmZXJlbmNlcyB0byB0aGUgbmFtZWQgdGFibGUsIG9yIHRvIGFueSB0YWJsZXMgYWRkZWQgdG8gdGhlIGdyb3VwIGR1ZSB0byBDQVNDQURFLlxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLnJlc3RhcnRJZGVudGl0eT1mYWxzZV0gT25seSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggVFJVTkNBVEUuIEF1dG9tYXRpY2FsbHkgcmVzdGFydCBzZXF1ZW5jZXMgb3duZWQgYnkgY29sdW1ucyBvZiB0aGUgdHJ1bmNhdGVkIHRhYmxlLlxuICAgKiBAcGFyYW0gIHtUcmFuc2FjdGlvbn0gIFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcbiAgICogQHBhcmFtICB7RnVuY3Rpb259ICAgICBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSAgICAgICAgIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLmJlbmNobWFyaz1mYWxzZV0gICAgICAgUGFzcyBxdWVyeSBleGVjdXRpb24gdGltZSBpbiBtaWxsaXNlY29uZHMgYXMgc2Vjb25kIGFyZ3VtZW50IHRvIGxvZ2dpbmcgZnVuY3Rpb24gKG9wdGlvbnMubG9nZ2luZykuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPG51bWJlcj59IFRoZSBudW1iZXIgb2YgZGVzdHJveWVkIHJvd3NcbiAgICovXG4gIHN0YXRpYyBkZXN0cm95KG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5qZWN0U2NvcGUob3B0aW9ucyk7XG5cbiAgICBpZiAoIW9wdGlvbnMgfHwgIShvcHRpb25zLndoZXJlIHx8IG9wdGlvbnMudHJ1bmNhdGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3Npbmcgd2hlcmUgb3IgdHJ1bmNhdGUgYXR0cmlidXRlIGluIHRoZSBvcHRpb25zIHBhcmFtZXRlciBvZiBtb2RlbC5kZXN0cm95LicpO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy50cnVuY2F0ZSAmJiAhXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMud2hlcmUpICYmICFBcnJheS5pc0FycmF5KG9wdGlvbnMud2hlcmUpICYmICEob3B0aW9ucy53aGVyZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgcGxhaW4gb2JqZWN0LCBhcnJheSBvciBzZXF1ZWxpemUgbWV0aG9kIGluIHRoZSBvcHRpb25zLndoZXJlIHBhcmFtZXRlciBvZiBtb2RlbC5kZXN0cm95LicpO1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKG9wdGlvbnMsIHtcbiAgICAgIGhvb2tzOiB0cnVlLFxuICAgICAgaW5kaXZpZHVhbEhvb2tzOiBmYWxzZSxcbiAgICAgIGZvcmNlOiBmYWxzZSxcbiAgICAgIGNhc2NhZGU6IGZhbHNlLFxuICAgICAgcmVzdGFydElkZW50aXR5OiBmYWxzZVxuICAgIH0pO1xuXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5CVUxLREVMRVRFO1xuXG4gICAgVXRpbHMubWFwT3B0aW9uRmllbGROYW1lcyhvcHRpb25zLCB0aGlzKTtcbiAgICBvcHRpb25zLm1vZGVsID0gdGhpcztcblxuICAgIGxldCBpbnN0YW5jZXM7XG5cbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xuICAgICAgLy8gUnVuIGJlZm9yZSBob29rXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYmVmb3JlQnVsa0Rlc3Ryb3knLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIC8vIEdldCBkYW9zIGFuZCBydW4gYmVmb3JlRGVzdHJveSBob29rIG9uIGVhY2ggcmVjb3JkIGluZGl2aWR1YWxseVxuICAgICAgaWYgKG9wdGlvbnMuaW5kaXZpZHVhbEhvb2tzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRBbGwoeyB3aGVyZTogb3B0aW9ucy53aGVyZSwgdHJhbnNhY3Rpb246IG9wdGlvbnMudHJhbnNhY3Rpb24sIGxvZ2dpbmc6IG9wdGlvbnMubG9nZ2luZywgYmVuY2htYXJrOiBvcHRpb25zLmJlbmNobWFyayB9KVxuICAgICAgICAgIC5tYXAoaW5zdGFuY2UgPT4gdGhpcy5ydW5Ib29rcygnYmVmb3JlRGVzdHJveScsIGluc3RhbmNlLCBvcHRpb25zKS50aGVuKCgpID0+IGluc3RhbmNlKSlcbiAgICAgICAgICAudGhlbihfaW5zdGFuY2VzID0+IHtcbiAgICAgICAgICAgIGluc3RhbmNlcyA9IF9pbnN0YW5jZXM7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBSdW4gZGVsZXRlIHF1ZXJ5IChvciB1cGRhdGUgaWYgcGFyYW5vaWQpXG4gICAgICBpZiAodGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQgJiYgIW9wdGlvbnMuZm9yY2UpIHtcbiAgICAgICAgLy8gU2V0IHF1ZXJ5IHR5cGUgYXBwcm9wcmlhdGVseSB3aGVuIHJ1bm5pbmcgc29mdCBkZWxldGVcbiAgICAgICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5CVUxLVVBEQVRFO1xuXG4gICAgICAgIGNvbnN0IGF0dHJWYWx1ZUhhc2ggPSB7fTtcbiAgICAgICAgY29uc3QgZGVsZXRlZEF0QXR0cmlidXRlID0gdGhpcy5yYXdBdHRyaWJ1dGVzW3RoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0XTtcbiAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLnJhd0F0dHJpYnV0ZXNbdGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXRdLmZpZWxkO1xuICAgICAgICBjb25zdCB3aGVyZSA9IHtcbiAgICAgICAgICBbZmllbGRdOiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGVsZXRlZEF0QXR0cmlidXRlLCAnZGVmYXVsdFZhbHVlJykgPyBkZWxldGVkQXRBdHRyaWJ1dGUuZGVmYXVsdFZhbHVlIDogbnVsbFxuICAgICAgICB9O1xuXG5cbiAgICAgICAgYXR0clZhbHVlSGFzaFtmaWVsZF0gPSBVdGlscy5ub3codGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UuYnVsa1VwZGF0ZSh0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSwgYXR0clZhbHVlSGFzaCwgT2JqZWN0LmFzc2lnbih3aGVyZSwgb3B0aW9ucy53aGVyZSksIG9wdGlvbnMsIHRoaXMucmF3QXR0cmlidXRlcyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5RdWVyeUludGVyZmFjZS5idWxrRGVsZXRlKHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBvcHRpb25zLndoZXJlLCBvcHRpb25zLCB0aGlzKTtcbiAgICB9KS50YXAoKCkgPT4ge1xuICAgICAgLy8gUnVuIGFmdGVyRGVzdHJveSBob29rIG9uIGVhY2ggcmVjb3JkIGluZGl2aWR1YWxseVxuICAgICAgaWYgKG9wdGlvbnMuaW5kaXZpZHVhbEhvb2tzKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLm1hcChpbnN0YW5jZXMsIGluc3RhbmNlID0+IHRoaXMucnVuSG9va3MoJ2FmdGVyRGVzdHJveScsIGluc3RhbmNlLCBvcHRpb25zKSk7XG4gICAgICB9XG4gICAgfSkudGFwKCgpID0+IHtcbiAgICAgIC8vIFJ1biBhZnRlciBob29rXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYWZ0ZXJCdWxrRGVzdHJveScsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RvcmUgbXVsdGlwbGUgaW5zdGFuY2VzIGlmIGBwYXJhbm9pZGAgaXMgZW5hYmxlZC5cbiAgICpcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICBvcHRpb25zICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmUgb3B0aW9uc1xuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgIFtvcHRpb25zLndoZXJlXSAgICAgICAgICAgICAgICAgRmlsdGVyIHRoZSByZXN0b3JlXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaG9va3M9dHJ1ZV0gICAgICAgICAgICBSdW4gYmVmb3JlIC8gYWZ0ZXIgYnVsayByZXN0b3JlIGhvb2tzP1xuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLmluZGl2aWR1YWxIb29rcz1mYWxzZV0gSWYgc2V0IHRvIHRydWUsIHJlc3RvcmUgd2lsbCBmaW5kIGFsbCByZWNvcmRzIHdpdGhpbiB0aGUgd2hlcmUgcGFyYW1ldGVyIGFuZCB3aWxsIGV4ZWN1dGUgYmVmb3JlIC8gYWZ0ZXIgYnVsa1Jlc3RvcmUgaG9va3Mgb24gZWFjaCByb3dcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICBbb3B0aW9ucy5saW1pdF0gICAgICAgICAgICAgICAgIEhvdyBtYW55IHJvd3MgdG8gdW5kZWxldGUgKG9ubHkgZm9yIG15c3FsKVxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdICAgICAgICAgQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuYmVuY2htYXJrPWZhbHNlXSAgICAgICBQYXNzIHF1ZXJ5IGV4ZWN1dGlvbiB0aW1lIGluIG1pbGxpc2Vjb25kcyBhcyBzZWNvbmQgYXJndW1lbnQgdG8gbG9nZ2luZyBmdW5jdGlvbiAob3B0aW9ucy5sb2dnaW5nKS5cbiAgICogQHBhcmFtICB7VHJhbnNhY3Rpb259ICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gICAgICAgICAgIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHN0YXRpYyByZXN0b3JlKG9wdGlvbnMpIHtcbiAgICBpZiAoIXRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0KSB0aHJvdyBuZXcgRXJyb3IoJ01vZGVsIGlzIG5vdCBwYXJhbm9pZCcpO1xuXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgaG9va3M6IHRydWUsXG4gICAgICBpbmRpdmlkdWFsSG9va3M6IGZhbHNlXG4gICAgfSwgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLlJBVztcbiAgICBvcHRpb25zLm1vZGVsID0gdGhpcztcblxuICAgIGxldCBpbnN0YW5jZXM7XG5cbiAgICBVdGlscy5tYXBPcHRpb25GaWVsZE5hbWVzKG9wdGlvbnMsIHRoaXMpO1xuXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcbiAgICAgIC8vIFJ1biBiZWZvcmUgaG9va1xuICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoJ2JlZm9yZUJ1bGtSZXN0b3JlJywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBHZXQgZGFvcyBhbmQgcnVuIGJlZm9yZVJlc3RvcmUgaG9vayBvbiBlYWNoIHJlY29yZCBpbmRpdmlkdWFsbHlcbiAgICAgIGlmIChvcHRpb25zLmluZGl2aWR1YWxIb29rcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kQWxsKHsgd2hlcmU6IG9wdGlvbnMud2hlcmUsIHRyYW5zYWN0aW9uOiBvcHRpb25zLnRyYW5zYWN0aW9uLCBsb2dnaW5nOiBvcHRpb25zLmxvZ2dpbmcsIGJlbmNobWFyazogb3B0aW9ucy5iZW5jaG1hcmssIHBhcmFub2lkOiBmYWxzZSB9KVxuICAgICAgICAgIC5tYXAoaW5zdGFuY2UgPT4gdGhpcy5ydW5Ib29rcygnYmVmb3JlUmVzdG9yZScsIGluc3RhbmNlLCBvcHRpb25zKS50aGVuKCgpID0+IGluc3RhbmNlKSlcbiAgICAgICAgICAudGhlbihfaW5zdGFuY2VzID0+IHtcbiAgICAgICAgICAgIGluc3RhbmNlcyA9IF9pbnN0YW5jZXM7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBSdW4gdW5kZWxldGUgcXVlcnlcbiAgICAgIGNvbnN0IGF0dHJWYWx1ZUhhc2ggPSB7fTtcbiAgICAgIGNvbnN0IGRlbGV0ZWRBdENvbCA9IHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0O1xuICAgICAgY29uc3QgZGVsZXRlZEF0QXR0cmlidXRlID0gdGhpcy5yYXdBdHRyaWJ1dGVzW2RlbGV0ZWRBdENvbF07XG4gICAgICBjb25zdCBkZWxldGVkQXREZWZhdWx0VmFsdWUgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGVsZXRlZEF0QXR0cmlidXRlLCAnZGVmYXVsdFZhbHVlJykgPyBkZWxldGVkQXRBdHRyaWJ1dGUuZGVmYXVsdFZhbHVlIDogbnVsbDtcblxuICAgICAgYXR0clZhbHVlSGFzaFtkZWxldGVkQXRBdHRyaWJ1dGUuZmllbGQgfHwgZGVsZXRlZEF0Q29sXSA9IGRlbGV0ZWRBdERlZmF1bHRWYWx1ZTtcbiAgICAgIG9wdGlvbnMub21pdE51bGwgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmJ1bGtVcGRhdGUodGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucyksIGF0dHJWYWx1ZUhhc2gsIG9wdGlvbnMud2hlcmUsIG9wdGlvbnMsIHRoaXMucmF3QXR0cmlidXRlcyk7XG4gICAgfSkudGFwKCgpID0+IHtcbiAgICAgIC8vIFJ1biBhZnRlckRlc3Ryb3kgaG9vayBvbiBlYWNoIHJlY29yZCBpbmRpdmlkdWFsbHlcbiAgICAgIGlmIChvcHRpb25zLmluZGl2aWR1YWxIb29rcykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5tYXAoaW5zdGFuY2VzLCBpbnN0YW5jZSA9PiB0aGlzLnJ1bkhvb2tzKCdhZnRlclJlc3RvcmUnLCBpbnN0YW5jZSwgb3B0aW9ucykpO1xuICAgICAgfVxuICAgIH0pLnRhcCgoKSA9PiB7XG4gICAgICAvLyBSdW4gYWZ0ZXIgaG9va1xuICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoJ2FmdGVyQnVsa1Jlc3RvcmUnLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgbXVsdGlwbGUgaW5zdGFuY2VzIHRoYXQgbWF0Y2ggdGhlIHdoZXJlIG9wdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgdmFsdWVzICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNoIG9mIHZhbHVlcyB0byB1cGRhdGVcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICBvcHRpb25zICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZSBvcHRpb25zXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgb3B0aW9ucy53aGVyZSAgICAgICAgICAgICAgICAgICBPcHRpb25zIHRvIGRlc2NyaWJlIHRoZSBzY29wZSBvZiB0aGUgc2VhcmNoLlxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLnBhcmFub2lkPXRydWVdICAgICAgICAgSWYgdHJ1ZSwgb25seSBub24tZGVsZXRlZCByZWNvcmRzIHdpbGwgYmUgdXBkYXRlZC4gSWYgZmFsc2UsIGJvdGggZGVsZXRlZCBhbmQgbm9uLWRlbGV0ZWQgcmVjb3JkcyB3aWxsIGJlIHVwZGF0ZWQuIE9ubHkgYXBwbGllcyBpZiBgb3B0aW9ucy5wYXJhbm9pZGAgaXMgdHJ1ZSBmb3IgdGhlIG1vZGVsLlxuICAgKiBAcGFyYW0gIHtBcnJheX0gICAgICAgIFtvcHRpb25zLmZpZWxkc10gICAgICAgICAgICAgICAgRmllbGRzIHRvIHVwZGF0ZSAoZGVmYXVsdHMgdG8gYWxsIGZpZWxkcylcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy52YWxpZGF0ZT10cnVlXSAgICAgICAgIFNob3VsZCBlYWNoIHJvdyBiZSBzdWJqZWN0IHRvIHZhbGlkYXRpb24gYmVmb3JlIGl0IGlzIGluc2VydGVkLiBUaGUgd2hvbGUgaW5zZXJ0IHdpbGwgZmFpbCBpZiBvbmUgcm93IGZhaWxzIHZhbGlkYXRpb25cbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5ob29rcz10cnVlXSAgICAgICAgICAgIFJ1biBiZWZvcmUgLyBhZnRlciBidWxrIHVwZGF0ZSBob29rcz9cbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5zaWRlRWZmZWN0cz10cnVlXSAgICAgIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc2lkZSBlZmZlY3RzIG9mIGFueSB2aXJ0dWFsIHNldHRlcnMuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaW5kaXZpZHVhbEhvb2tzPWZhbHNlXSBSdW4gYmVmb3JlIC8gYWZ0ZXIgdXBkYXRlIGhvb2tzPy4gSWYgdHJ1ZSwgdGhpcyB3aWxsIGV4ZWN1dGUgYSBTRUxFQ1QgZm9sbG93ZWQgYnkgaW5kaXZpZHVhbCBVUERBVEVzLiBBIHNlbGVjdCBpcyBuZWVkZWQsIGJlY2F1c2UgdGhlIHJvdyBkYXRhIG5lZWRzIHRvIGJlIHBhc3NlZCB0byB0aGUgaG9va3NcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5yZXR1cm5pbmc9ZmFsc2VdICAgICAgIFJldHVybiB0aGUgYWZmZWN0ZWQgcm93cyAob25seSBmb3IgcG9zdGdyZXMpXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgW29wdGlvbnMubGltaXRdICAgICAgICAgICAgICAgICBIb3cgbWFueSByb3dzIHRvIHVwZGF0ZSAob25seSBmb3IgbXlzcWwgYW5kIG1hcmlhZGIsIGltcGxlbWVudGVkIGFzIFRPUChuKSBmb3IgTVNTUUw7IGZvciBzcWxpdGUgaXQgaXMgc3VwcG9ydGVkIG9ubHkgd2hlbiByb3dpZCBpcyBwcmVzZW50KVxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdICAgICAgICAgQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuYmVuY2htYXJrPWZhbHNlXSAgICAgICBQYXNzIHF1ZXJ5IGV4ZWN1dGlvbiB0aW1lIGluIG1pbGxpc2Vjb25kcyBhcyBzZWNvbmQgYXJndW1lbnQgdG8gbG9nZ2luZyBmdW5jdGlvbiAob3B0aW9ucy5sb2dnaW5nKS5cbiAgICogQHBhcmFtICB7VHJhbnNhY3Rpb259ICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gICAgICAgICAgIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLnNpbGVudD1mYWxzZV0gICAgICAgICAgSWYgdHJ1ZSwgdGhlIHVwZGF0ZWRBdCB0aW1lc3RhbXAgd2lsbCBub3QgYmUgdXBkYXRlZC5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8QXJyYXk8bnVtYmVyLG51bWJlcj4+fSAgVGhlIHByb21pc2UgcmV0dXJucyBhbiBhcnJheSB3aXRoIG9uZSBvciB0d28gZWxlbWVudHMuIFRoZSBmaXJzdCBlbGVtZW50IGlzIGFsd2F5cyB0aGUgbnVtYmVyXG4gICAqIG9mIGFmZmVjdGVkIHJvd3MsIHdoaWxlIHRoZSBzZWNvbmQgZWxlbWVudCBpcyB0aGUgYWN0dWFsIGFmZmVjdGVkIHJvd3MgKG9ubHkgc3VwcG9ydGVkIGluIHBvc3RncmVzIHdpdGggYG9wdGlvbnMucmV0dXJuaW5nYCB0cnVlLilcbiAgICpcbiAgICovXG4gIHN0YXRpYyB1cGRhdGUodmFsdWVzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcblxuICAgIHRoaXMuX2luamVjdFNjb3BlKG9wdGlvbnMpO1xuICAgIHRoaXMuX29wdGlvbnNNdXN0Q29udGFpbldoZXJlKG9wdGlvbnMpO1xuXG4gICAgb3B0aW9ucyA9IHRoaXMuX3BhcmFub2lkQ2xhdXNlKHRoaXMsIF8uZGVmYXVsdHMob3B0aW9ucywge1xuICAgICAgdmFsaWRhdGU6IHRydWUsXG4gICAgICBob29rczogdHJ1ZSxcbiAgICAgIGluZGl2aWR1YWxIb29rczogZmFsc2UsXG4gICAgICByZXR1cm5pbmc6IGZhbHNlLFxuICAgICAgZm9yY2U6IGZhbHNlLFxuICAgICAgc2lkZUVmZmVjdHM6IHRydWVcbiAgICB9KSk7XG5cbiAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLkJVTEtVUERBVEU7XG5cbiAgICAvLyBDbG9uZSB2YWx1ZXMgc28gaXQgZG9lc24ndCBnZXQgbW9kaWZpZWQgZm9yIGNhbGxlciBzY29wZSBhbmQgaWdub3JlIHVuZGVmaW5lZCB2YWx1ZXNcbiAgICB2YWx1ZXMgPSBfLm9taXRCeSh2YWx1ZXMsIHZhbHVlID0+IHZhbHVlID09PSB1bmRlZmluZWQpO1xuXG4gICAgLy8gUmVtb3ZlIHZhbHVlcyB0aGF0IGFyZSBub3QgaW4gdGhlIG9wdGlvbnMuZmllbGRzXG4gICAgaWYgKG9wdGlvbnMuZmllbGRzICYmIG9wdGlvbnMuZmllbGRzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHZhbHVlcykpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLmZpZWxkcy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgICAgZGVsZXRlIHZhbHVlc1trZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRBdEF0dHIgPSB0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdDtcbiAgICAgIG9wdGlvbnMuZmllbGRzID0gXy5pbnRlcnNlY3Rpb24oT2JqZWN0LmtleXModmFsdWVzKSwgT2JqZWN0LmtleXModGhpcy50YWJsZUF0dHJpYnV0ZXMpKTtcbiAgICAgIGlmICh1cGRhdGVkQXRBdHRyICYmICFvcHRpb25zLmZpZWxkcy5pbmNsdWRlcyh1cGRhdGVkQXRBdHRyKSkge1xuICAgICAgICBvcHRpb25zLmZpZWxkcy5wdXNoKHVwZGF0ZWRBdEF0dHIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdCAmJiAhb3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgIHZhbHVlc1t0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdF0gPSB0aGlzLl9nZXREZWZhdWx0VGltZXN0YW1wKHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0KSB8fCBVdGlscy5ub3codGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KTtcbiAgICB9XG5cbiAgICBvcHRpb25zLm1vZGVsID0gdGhpcztcblxuICAgIGxldCBpbnN0YW5jZXM7XG4gICAgbGV0IHZhbHVlc1VzZTtcblxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XG4gICAgICAvLyBWYWxpZGF0ZVxuICAgICAgaWYgKG9wdGlvbnMudmFsaWRhdGUpIHtcbiAgICAgICAgY29uc3QgYnVpbGQgPSB0aGlzLmJ1aWxkKHZhbHVlcyk7XG4gICAgICAgIGJ1aWxkLnNldCh0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdCwgdmFsdWVzW3RoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0XSwgeyByYXc6IHRydWUgfSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuc2lkZUVmZmVjdHMpIHtcbiAgICAgICAgICB2YWx1ZXMgPSBPYmplY3QuYXNzaWduKHZhbHVlcywgXy5waWNrKGJ1aWxkLmdldCgpLCBidWlsZC5jaGFuZ2VkKCkpKTtcbiAgICAgICAgICBvcHRpb25zLmZpZWxkcyA9IF8udW5pb24ob3B0aW9ucy5maWVsZHMsIE9iamVjdC5rZXlzKHZhbHVlcykpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2Ugd2FudCB0byBza2lwIHZhbGlkYXRpb25zIGZvciBhbGwgb3RoZXIgZmllbGRzXG4gICAgICAgIG9wdGlvbnMuc2tpcCA9IF8uZGlmZmVyZW5jZShPYmplY3Qua2V5cyh0aGlzLnJhd0F0dHJpYnV0ZXMpLCBPYmplY3Qua2V5cyh2YWx1ZXMpKTtcbiAgICAgICAgcmV0dXJuIGJ1aWxkLnZhbGlkYXRlKG9wdGlvbnMpLnRoZW4oYXR0cmlidXRlcyA9PiB7XG4gICAgICAgICAgb3B0aW9ucy5za2lwID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChhdHRyaWJ1dGVzICYmIGF0dHJpYnV0ZXMuZGF0YVZhbHVlcykge1xuICAgICAgICAgICAgdmFsdWVzID0gXy5waWNrKGF0dHJpYnV0ZXMuZGF0YVZhbHVlcywgT2JqZWN0LmtleXModmFsdWVzKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgLy8gUnVuIGJlZm9yZSBob29rXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSB2YWx1ZXM7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdiZWZvcmVCdWxrVXBkYXRlJywgb3B0aW9ucykudGhlbigoKSA9PiB7XG4gICAgICAgICAgdmFsdWVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzO1xuICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLmF0dHJpYnV0ZXM7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICB2YWx1ZXNVc2UgPSB2YWx1ZXM7XG5cbiAgICAgIC8vIEdldCBpbnN0YW5jZXMgYW5kIHJ1biBiZWZvcmVVcGRhdGUgaG9vayBvbiBlYWNoIHJlY29yZCBpbmRpdmlkdWFsbHlcbiAgICAgIGlmIChvcHRpb25zLmluZGl2aWR1YWxIb29rcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kQWxsKHtcbiAgICAgICAgICB3aGVyZTogb3B0aW9ucy53aGVyZSxcbiAgICAgICAgICB0cmFuc2FjdGlvbjogb3B0aW9ucy50cmFuc2FjdGlvbixcbiAgICAgICAgICBsb2dnaW5nOiBvcHRpb25zLmxvZ2dpbmcsXG4gICAgICAgICAgYmVuY2htYXJrOiBvcHRpb25zLmJlbmNobWFyayxcbiAgICAgICAgICBwYXJhbm9pZDogb3B0aW9ucy5wYXJhbm9pZFxuICAgICAgICB9KS50aGVuKF9pbnN0YW5jZXMgPT4ge1xuICAgICAgICAgIGluc3RhbmNlcyA9IF9pbnN0YW5jZXM7XG4gICAgICAgICAgaWYgKCFpbnN0YW5jZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUnVuIGJlZm9yZVVwZGF0ZSBob29rcyBvbiBlYWNoIHJlY29yZCBhbmQgY2hlY2sgd2hldGhlciBiZWZvcmVVcGRhdGUgaG9vayBjaGFuZ2VzIHZhbHVlcyB1bmlmb3JtbHlcbiAgICAgICAgICAvLyBpLmUuIHdoZXRoZXIgdGhleSBjaGFuZ2UgdmFsdWVzIGZvciBlYWNoIHJlY29yZCBpbiB0aGUgc2FtZSB3YXlcbiAgICAgICAgICBsZXQgY2hhbmdlZFZhbHVlcztcbiAgICAgICAgICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG5cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5tYXAoaW5zdGFuY2VzLCBpbnN0YW5jZSA9PiB7XG4gICAgICAgICAgICAvLyBSZWNvcmQgdXBkYXRlcyBpbiBpbnN0YW5jZXMgZGF0YVZhbHVlc1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihpbnN0YW5jZS5kYXRhVmFsdWVzLCB2YWx1ZXMpO1xuICAgICAgICAgICAgLy8gU2V0IHRoZSBjaGFuZ2VkIGZpZWxkcyBvbiB0aGUgaW5zdGFuY2VcbiAgICAgICAgICAgIF8uZm9ySW4odmFsdWVzVXNlLCAobmV3VmFsdWUsIGF0dHIpID0+IHtcbiAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBpbnN0YW5jZS5fcHJldmlvdXNEYXRhVmFsdWVzW2F0dHJdKSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2Uuc2V0RGF0YVZhbHVlKGF0dHIsIG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFJ1biBiZWZvcmVVcGRhdGUgaG9va1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoJ2JlZm9yZVVwZGF0ZScsIGluc3RhbmNlLCBvcHRpb25zKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0aGlzQ2hhbmdlZFZhbHVlcyA9IHt9O1xuICAgICAgICAgICAgICAgIF8uZm9ySW4oaW5zdGFuY2UuZGF0YVZhbHVlcywgKG5ld1ZhbHVlLCBhdHRyKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IGluc3RhbmNlLl9wcmV2aW91c0RhdGFWYWx1ZXNbYXR0cl0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc0NoYW5nZWRWYWx1ZXNbYXR0cl0gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmICghY2hhbmdlZFZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgY2hhbmdlZFZhbHVlcyA9IHRoaXNDaGFuZ2VkVmFsdWVzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBkaWZmZXJlbnQgPSAhXy5pc0VxdWFsKGNoYW5nZWRWYWx1ZXMsIHRoaXNDaGFuZ2VkVmFsdWVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KS50aGVuKF9pbnN0YW5jZXMgPT4ge1xuICAgICAgICAgICAgaW5zdGFuY2VzID0gX2luc3RhbmNlcztcblxuICAgICAgICAgICAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGNoYW5nZWRWYWx1ZXMpO1xuICAgICAgICAgICAgICAvLyBIb29rcyBkbyBub3QgY2hhbmdlIHZhbHVlcyBvciBjaGFuZ2UgdGhlbSB1bmlmb3JtbHlcbiAgICAgICAgICAgICAgaWYgKGtleXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gSG9va3MgY2hhbmdlIHZhbHVlcyAtIHJlY29yZCBjaGFuZ2VzIGluIHZhbHVlc1VzZSBzbyB0aGV5IGFyZSBleGVjdXRlZFxuICAgICAgICAgICAgICAgIHZhbHVlc1VzZSA9IGNoYW5nZWRWYWx1ZXM7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5maWVsZHMgPSBfLnVuaW9uKG9wdGlvbnMuZmllbGRzLCBrZXlzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBIb29rcyBjaGFuZ2UgdmFsdWVzIGluIGEgZGlmZmVyZW50IHdheSBmb3IgZWFjaCByZWNvcmRcbiAgICAgICAgICAgIC8vIERvIG5vdCBydW4gb3JpZ2luYWwgcXVlcnkgYnV0IHNhdmUgZWFjaCByZWNvcmQgaW5kaXZpZHVhbGx5XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5tYXAoaW5zdGFuY2VzLCBpbnN0YW5jZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGluZGl2aWR1YWxPcHRpb25zID0gXy5jbG9uZShvcHRpb25zKTtcbiAgICAgICAgICAgICAgZGVsZXRlIGluZGl2aWR1YWxPcHRpb25zLmluZGl2aWR1YWxIb29rcztcbiAgICAgICAgICAgICAgaW5kaXZpZHVhbE9wdGlvbnMuaG9va3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgaW5kaXZpZHVhbE9wdGlvbnMudmFsaWRhdGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2Uuc2F2ZShpbmRpdmlkdWFsT3B0aW9ucyk7XG4gICAgICAgICAgICB9KS50YXAoX2luc3RhbmNlcyA9PiB7XG4gICAgICAgICAgICAgIGluc3RhbmNlcyA9IF9pbnN0YW5jZXM7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkudGhlbihyZXN1bHRzID0+IHtcbiAgICAgIC8vIFVwZGF0ZSBhbHJlYWR5IGRvbmUgcm93LWJ5LXJvdyAtIGV4aXRcbiAgICAgIGlmIChyZXN1bHRzKSB7XG4gICAgICAgIHJldHVybiBbcmVzdWx0cy5sZW5ndGgsIHJlc3VsdHNdO1xuICAgICAgfVxuXG4gICAgICAvLyBvbmx5IHVwZGF0ZWRBdCBpcyBiZWluZyBwYXNzZWQsIHRoZW4gc2tpcCB1cGRhdGVcbiAgICAgIGlmIChcbiAgICAgICAgXy5pc0VtcHR5KHZhbHVlc1VzZSlcbiAgICAgICAgIHx8IE9iamVjdC5rZXlzKHZhbHVlc1VzZSkubGVuZ3RoID09PSAxICYmIHZhbHVlc1VzZVt0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdF1cbiAgICAgICkge1xuICAgICAgICByZXR1cm4gWzBdO1xuICAgICAgfVxuXG4gICAgICB2YWx1ZXNVc2UgPSBVdGlscy5tYXBWYWx1ZUZpZWxkTmFtZXModmFsdWVzVXNlLCBvcHRpb25zLmZpZWxkcywgdGhpcyk7XG4gICAgICBvcHRpb25zID0gVXRpbHMubWFwT3B0aW9uRmllbGROYW1lcyhvcHRpb25zLCB0aGlzKTtcbiAgICAgIG9wdGlvbnMuaGFzVHJpZ2dlciA9IHRoaXMub3B0aW9ucyA/IHRoaXMub3B0aW9ucy5oYXNUcmlnZ2VyIDogZmFsc2U7XG5cbiAgICAgIC8vIFJ1biBxdWVyeSB0byB1cGRhdGUgYWxsIHJvd3NcbiAgICAgIHJldHVybiB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmJ1bGtVcGRhdGUodGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucyksIHZhbHVlc1VzZSwgb3B0aW9ucy53aGVyZSwgb3B0aW9ucywgdGhpcy50YWJsZUF0dHJpYnV0ZXMpLnRoZW4oYWZmZWN0ZWRSb3dzID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbnMucmV0dXJuaW5nKSB7XG4gICAgICAgICAgaW5zdGFuY2VzID0gYWZmZWN0ZWRSb3dzO1xuICAgICAgICAgIHJldHVybiBbYWZmZWN0ZWRSb3dzLmxlbmd0aCwgYWZmZWN0ZWRSb3dzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbYWZmZWN0ZWRSb3dzXTtcbiAgICAgIH0pO1xuICAgIH0pLnRhcChyZXN1bHQgPT4ge1xuICAgICAgaWYgKG9wdGlvbnMuaW5kaXZpZHVhbEhvb2tzKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLm1hcChpbnN0YW5jZXMsIGluc3RhbmNlID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYWZ0ZXJVcGRhdGUnLCBpbnN0YW5jZSwgb3B0aW9ucyk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJlc3VsdFsxXSA9IGluc3RhbmNlcztcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkudGFwKCgpID0+IHtcbiAgICAgIC8vIFJ1biBhZnRlciBob29rXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSB2YWx1ZXM7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdhZnRlckJ1bGtVcGRhdGUnLCBvcHRpb25zKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBkZWxldGUgb3B0aW9ucy5hdHRyaWJ1dGVzO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYSBkZXNjcmliZSBxdWVyeSBvbiB0aGUgdGFibGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbc2NoZW1hXSBzY2hlbWEgbmFtZSB0byBzZWFyY2ggdGFibGUgaW5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBxdWVyeSBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBoYXNoIG9mIGF0dHJpYnV0ZXMgYW5kIHRoZWlyIHR5cGVzXG4gICAqL1xuICBzdGF0aWMgZGVzY3JpYmUoc2NoZW1hLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UuZGVzY3JpYmVUYWJsZSh0aGlzLnRhYmxlTmFtZSwgT2JqZWN0LmFzc2lnbih7IHNjaGVtYTogc2NoZW1hIHx8IHRoaXMuX3NjaGVtYSB8fCB1bmRlZmluZWQgfSwgb3B0aW9ucykpO1xuICB9XG5cbiAgc3RhdGljIF9nZXREZWZhdWx0VGltZXN0YW1wKGF0dHIpIHtcbiAgICBpZiAoISF0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0gJiYgISF0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZGVmYXVsdFZhbHVlKSB7XG4gICAgICByZXR1cm4gVXRpbHMudG9EZWZhdWx0VmFsdWUodGhpcy5yYXdBdHRyaWJ1dGVzW2F0dHJdLmRlZmF1bHRWYWx1ZSwgdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHN0YXRpYyBfZXhwYW5kQXR0cmlidXRlcyhvcHRpb25zKSB7XG4gICAgaWYgKCFfLmlzUGxhaW5PYmplY3Qob3B0aW9ucy5hdHRyaWJ1dGVzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgYXR0cmlidXRlcyA9IE9iamVjdC5rZXlzKHRoaXMucmF3QXR0cmlidXRlcyk7XG5cbiAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzLmV4Y2x1ZGUpIHtcbiAgICAgIGF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzLmZpbHRlcihlbGVtID0+ICFvcHRpb25zLmF0dHJpYnV0ZXMuZXhjbHVkZS5pbmNsdWRlcyhlbGVtKSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcy5pbmNsdWRlKSB7XG4gICAgICBhdHRyaWJ1dGVzID0gYXR0cmlidXRlcy5jb25jYXQob3B0aW9ucy5hdHRyaWJ1dGVzLmluY2x1ZGUpO1xuICAgIH1cblxuICAgIG9wdGlvbnMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG4gIH1cblxuICAvLyBJbmplY3QgX3Njb3BlIGludG8gb3B0aW9ucy5cbiAgc3RhdGljIF9pbmplY3RTY29wZShvcHRpb25zKSB7XG4gICAgY29uc3Qgc2NvcGUgPSBVdGlscy5jbG9uZURlZXAodGhpcy5fc2NvcGUpO1xuICAgIHRoaXMuX2RlZmF1bHRzT3B0aW9ucyhvcHRpb25zLCBzY29wZSk7XG4gIH1cblxuICBzdGF0aWMgW1N5bWJvbC5mb3IoJ25vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tJyldKCkge1xuICAgIHJldHVybiB0aGlzLm5hbWU7XG4gIH1cblxuICBzdGF0aWMgaW5zcGVjdCgpIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lO1xuICB9XG5cbiAgc3RhdGljIGhhc0FsaWFzKGFsaWFzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmFzc29jaWF0aW9ucywgYWxpYXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluY3JlbWVudCB0aGUgdmFsdWUgb2Ygb25lIG9yIG1vcmUgY29sdW1ucy4gVGhpcyBpcyBkb25lIGluIHRoZSBkYXRhYmFzZSwgd2hpY2ggbWVhbnMgaXQgZG9lcyBub3QgdXNlIHRoZSB2YWx1ZXMgY3VycmVudGx5IHN0b3JlZCBvbiB0aGUgSW5zdGFuY2UuIFRoZSBpbmNyZW1lbnQgaXMgZG9uZSB1c2luZyBhXG4gICAqIGBgYCBTRVQgY29sdW1uID0gY29sdW1uICsgWCBXSEVSRSBmb28gPSAnYmFyJyBgYGAgcXVlcnkuIFRvIGdldCB0aGUgY29ycmVjdCB2YWx1ZSBhZnRlciBhbiBpbmNyZW1lbnQgaW50byB0aGUgSW5zdGFuY2UgeW91IHNob3VsZCBkbyBhIHJlbG9hZC5cbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+aW5jcmVtZW50IG51bWJlciBieSAxPC9jYXB0aW9uPlxuICAgKiBNb2RlbC5pbmNyZW1lbnQoJ251bWJlcicsIHsgd2hlcmU6IHsgZm9vOiAnYmFyJyB9KTtcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+aW5jcmVtZW50IG51bWJlciBhbmQgY291bnQgYnkgMjwvY2FwdGlvbj5cbiAgICogTW9kZWwuaW5jcmVtZW50KFsnbnVtYmVyJywgJ2NvdW50J10sIHsgYnk6IDIsIHdoZXJlOiB7IGZvbzogJ2JhcicgfSB9KTtcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+aW5jcmVtZW50IGFuc3dlciBieSA0MiwgYW5kIGRlY3JlbWVudCB0cmllcyBieSAxPC9jYXB0aW9uPlxuICAgKiAvLyBgYnlgIGlzIGlnbm9yZWQsIGFzIGVhY2ggY29sdW1uIGhhcyBpdHMgb3duIHZhbHVlXG4gICAqIE1vZGVsLmluY3JlbWVudCh7IGFuc3dlcjogNDIsIHRyaWVzOiAtMX0sIHsgYnk6IDIsIHdoZXJlOiB7IGZvbzogJ2JhcicgfSB9KTtcbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwjcmVsb2FkfVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheXxPYmplY3R9IGZpZWxkcyBJZiBhIHN0cmluZyBpcyBwcm92aWRlZCwgdGhhdCBjb2x1bW4gaXMgaW5jcmVtZW50ZWQgYnkgdGhlIHZhbHVlIG9mIGBieWAgZ2l2ZW4gaW4gb3B0aW9ucy4gSWYgYW4gYXJyYXkgaXMgcHJvdmlkZWQsIHRoZSBzYW1lIGlzIHRydWUgZm9yIGVhY2ggY29sdW1uLiBJZiBhbmQgb2JqZWN0IGlzIHByb3ZpZGVkLCBlYWNoIGNvbHVtbiBpcyBpbmNyZW1lbnRlZCBieSB0aGUgdmFsdWUgZ2l2ZW4uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIGluY3JlbWVudCBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLndoZXJlIGNvbmRpdGlvbnMgaGFzaFxuICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuYnk9MV0gVGhlIG51bWJlciB0byBpbmNyZW1lbnQgYnlcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zaWxlbnQ9ZmFsc2VdIElmIHRydWUsIHRoZSB1cGRhdGVkQXQgdGltZXN0YW1wIHdpbGwgbm90IGJlIHVwZGF0ZWQuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zZWFyY2hQYXRoPURFRkFVTFRdIEFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byBzcGVjaWZ5IHRoZSBzY2hlbWEgc2VhcmNoX3BhdGggKFBvc3RncmVzIG9ubHkpXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsW10sP251bWJlcj59IHJldHVybnMgYW4gYXJyYXkgb2YgYWZmZWN0ZWQgcm93cyBhbmQgYWZmZWN0ZWQgY291bnQgd2l0aCBgb3B0aW9ucy5yZXR1cm5pbmc6IHRydWVgLCB3aGVuZXZlciBzdXBwb3J0ZWQgYnkgZGlhbGVjdFxuICAgKi9cbiAgc3RhdGljIGluY3JlbWVudChmaWVsZHMsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHRoaXMuX2luamVjdFNjb3BlKG9wdGlvbnMpO1xuICAgIHRoaXMuX29wdGlvbnNNdXN0Q29udGFpbldoZXJlKG9wdGlvbnMpO1xuXG4gICAgY29uc3QgdXBkYXRlZEF0QXR0ciA9IHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0O1xuICAgIGNvbnN0IHZlcnNpb25BdHRyID0gdGhpcy5fdmVyc2lvbkF0dHJpYnV0ZTtcbiAgICBjb25zdCB1cGRhdGVkQXRBdHRyaWJ1dGUgPSB0aGlzLnJhd0F0dHJpYnV0ZXNbdXBkYXRlZEF0QXR0cl07XG4gICAgb3B0aW9ucyA9IFV0aWxzLmRlZmF1bHRzKHt9LCBvcHRpb25zLCB7XG4gICAgICBieTogMSxcbiAgICAgIGF0dHJpYnV0ZXM6IHt9LFxuICAgICAgd2hlcmU6IHt9LFxuICAgICAgaW5jcmVtZW50OiB0cnVlXG4gICAgfSk7XG5cbiAgICBVdGlscy5tYXBPcHRpb25GaWVsZE5hbWVzKG9wdGlvbnMsIHRoaXMpO1xuXG4gICAgY29uc3Qgd2hlcmUgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLndoZXJlKTtcbiAgICBsZXQgdmFsdWVzID0ge307XG5cbiAgICBpZiAodHlwZW9mIGZpZWxkcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlc1tmaWVsZHNdID0gb3B0aW9ucy5ieTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZmllbGRzKSkge1xuICAgICAgZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICB2YWx1ZXNbZmllbGRdID0gb3B0aW9ucy5ieTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7IC8vIEFzc3VtZSBmaWVsZHMgaXMga2V5LXZhbHVlIHBhaXJzXG4gICAgICB2YWx1ZXMgPSBmaWVsZHM7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCAmJiB1cGRhdGVkQXRBdHRyICYmICF2YWx1ZXNbdXBkYXRlZEF0QXR0cl0pIHtcbiAgICAgIG9wdGlvbnMuYXR0cmlidXRlc1t1cGRhdGVkQXRBdHRyaWJ1dGUuZmllbGQgfHwgdXBkYXRlZEF0QXR0cl0gPSB0aGlzLl9nZXREZWZhdWx0VGltZXN0YW1wKHVwZGF0ZWRBdEF0dHIpIHx8IFV0aWxzLm5vdyh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QpO1xuICAgIH1cbiAgICBpZiAodmVyc2lvbkF0dHIpIHtcbiAgICAgIHZhbHVlc1t2ZXJzaW9uQXR0cl0gPSBvcHRpb25zLmluY3JlbWVudCA/IDEgOiAtMTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGF0dHIgb2YgT2JqZWN0LmtleXModmFsdWVzKSkge1xuICAgICAgLy8gRmllbGQgbmFtZSBtYXBwaW5nXG4gICAgICBpZiAodGhpcy5yYXdBdHRyaWJ1dGVzW2F0dHJdICYmIHRoaXMucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCAmJiB0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGQgIT09IGF0dHIpIHtcbiAgICAgICAgdmFsdWVzW3RoaXMucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZF0gPSB2YWx1ZXNbYXR0cl07XG4gICAgICAgIGRlbGV0ZSB2YWx1ZXNbYXR0cl07XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHByb21pc2U7XG4gICAgaWYgKCFvcHRpb25zLmluY3JlbWVudCkge1xuICAgICAgcHJvbWlzZSA9IHRoaXMuUXVlcnlJbnRlcmZhY2UuZGVjcmVtZW50KHRoaXMsIHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCB2YWx1ZXMsIHdoZXJlLCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvbWlzZSA9IHRoaXMuUXVlcnlJbnRlcmZhY2UuaW5jcmVtZW50KHRoaXMsIHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCB2YWx1ZXMsIHdoZXJlLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZS50aGVuKGFmZmVjdGVkUm93cyA9PiB7XG4gICAgICBpZiAob3B0aW9ucy5yZXR1cm5pbmcpIHtcbiAgICAgICAgcmV0dXJuIFthZmZlY3RlZFJvd3MsIGFmZmVjdGVkUm93cy5sZW5ndGhdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gW2FmZmVjdGVkUm93c107XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVjcmVtZW50IHRoZSB2YWx1ZSBvZiBvbmUgb3IgbW9yZSBjb2x1bW5zLiBUaGlzIGlzIGRvbmUgaW4gdGhlIGRhdGFiYXNlLCB3aGljaCBtZWFucyBpdCBkb2VzIG5vdCB1c2UgdGhlIHZhbHVlcyBjdXJyZW50bHkgc3RvcmVkIG9uIHRoZSBJbnN0YW5jZS4gVGhlIGRlY3JlbWVudCBpcyBkb25lIHVzaW5nIGFcbiAgICogYGBgc3FsIFNFVCBjb2x1bW4gPSBjb2x1bW4gLSBYIFdIRVJFIGZvbyA9ICdiYXInYGBgIHF1ZXJ5LiBUbyBnZXQgdGhlIGNvcnJlY3QgdmFsdWUgYWZ0ZXIgYSBkZWNyZW1lbnQgaW50byB0aGUgSW5zdGFuY2UgeW91IHNob3VsZCBkbyBhIHJlbG9hZC5cbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+ZGVjcmVtZW50IG51bWJlciBieSAxPC9jYXB0aW9uPlxuICAgKiBNb2RlbC5kZWNyZW1lbnQoJ251bWJlcicsIHsgd2hlcmU6IHsgZm9vOiAnYmFyJyB9KTtcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+ZGVjcmVtZW50IG51bWJlciBhbmQgY291bnQgYnkgMjwvY2FwdGlvbj5cbiAgICogTW9kZWwuZGVjcmVtZW50KFsnbnVtYmVyJywgJ2NvdW50J10sIHsgYnk6IDIsIHdoZXJlOiB7IGZvbzogJ2JhcicgfSB9KTtcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+ZGVjcmVtZW50IGFuc3dlciBieSA0MiwgYW5kIGRlY3JlbWVudCB0cmllcyBieSAtMTwvY2FwdGlvbj5cbiAgICogLy8gYGJ5YCBpcyBpZ25vcmVkLCBzaW5jZSBlYWNoIGNvbHVtbiBoYXMgaXRzIG93biB2YWx1ZVxuICAgKiBNb2RlbC5kZWNyZW1lbnQoeyBhbnN3ZXI6IDQyLCB0cmllczogLTF9LCB7IGJ5OiAyLCB3aGVyZTogeyBmb286ICdiYXInIH0gfSk7XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fE9iamVjdH0gZmllbGRzIElmIGEgc3RyaW5nIGlzIHByb3ZpZGVkLCB0aGF0IGNvbHVtbiBpcyBpbmNyZW1lbnRlZCBieSB0aGUgdmFsdWUgb2YgYGJ5YCBnaXZlbiBpbiBvcHRpb25zLiBJZiBhbiBhcnJheSBpcyBwcm92aWRlZCwgdGhlIHNhbWUgaXMgdHJ1ZSBmb3IgZWFjaCBjb2x1bW4uIElmIGFuZCBvYmplY3QgaXMgcHJvdmlkZWQsIGVhY2ggY29sdW1uIGlzIGluY3JlbWVudGVkIGJ5IHRoZSB2YWx1ZSBnaXZlbi5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgZGVjcmVtZW50IG9wdGlvbnMsIHNpbWlsYXIgdG8gaW5jcmVtZW50XG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLmluY3JlbWVudH1cbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwjcmVsb2FkfVxuICAgKiBAc2luY2UgNC4zNi4wXG5cbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWxbXSw/bnVtYmVyPn0gcmV0dXJucyBhbiBhcnJheSBvZiBhZmZlY3RlZCByb3dzIGFuZCBhZmZlY3RlZCBjb3VudCB3aXRoIGBvcHRpb25zLnJldHVybmluZzogdHJ1ZWAsIHdoZW5ldmVyIHN1cHBvcnRlZCBieSBkaWFsZWN0XG4gICAqL1xuICBzdGF0aWMgZGVjcmVtZW50KGZpZWxkcywgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKHsgaW5jcmVtZW50OiBmYWxzZSB9LCBvcHRpb25zLCB7XG4gICAgICBieTogMVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMuaW5jcmVtZW50KGZpZWxkcywgb3B0aW9ucyk7XG4gIH1cblxuICBzdGF0aWMgX29wdGlvbnNNdXN0Q29udGFpbldoZXJlKG9wdGlvbnMpIHtcbiAgICBhc3NlcnQob3B0aW9ucyAmJiBvcHRpb25zLndoZXJlLCAnTWlzc2luZyB3aGVyZSBhdHRyaWJ1dGUgaW4gdGhlIG9wdGlvbnMgcGFyYW1ldGVyJyk7XG4gICAgYXNzZXJ0KF8uaXNQbGFpbk9iamVjdChvcHRpb25zLndoZXJlKSB8fCBBcnJheS5pc0FycmF5KG9wdGlvbnMud2hlcmUpIHx8IG9wdGlvbnMud2hlcmUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QsXG4gICAgICAnRXhwZWN0ZWQgcGxhaW4gb2JqZWN0LCBhcnJheSBvciBzZXF1ZWxpemUgbWV0aG9kIGluIHRoZSBvcHRpb25zLndoZXJlIHBhcmFtZXRlcicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBxdWVyeSBmb3IgdGhpcyBpbnN0YW5jZSwgdXNlIHdpdGggYG9wdGlvbnMud2hlcmVgXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NoZWNrVmVyc2lvbj1mYWxzZV0gaW5jbHVkZSB2ZXJzaW9uIGF0dHJpYnV0ZSBpbiB3aGVyZSBoYXNoXG4gICAqXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICB3aGVyZShjaGVja1ZlcnNpb24pIHtcbiAgICBjb25zdCB3aGVyZSA9IHRoaXMuY29uc3RydWN0b3IucHJpbWFyeUtleUF0dHJpYnV0ZXMucmVkdWNlKChyZXN1bHQsIGF0dHJpYnV0ZSkgPT4ge1xuICAgICAgcmVzdWx0W2F0dHJpYnV0ZV0gPSB0aGlzLmdldChhdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LCB7fSk7XG5cbiAgICBpZiAoXy5zaXplKHdoZXJlKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX21vZGVsT3B0aW9ucy53aGVyZUNvbGxlY3Rpb247XG4gICAgfVxuICAgIGNvbnN0IHZlcnNpb25BdHRyID0gdGhpcy5jb25zdHJ1Y3Rvci5fdmVyc2lvbkF0dHJpYnV0ZTtcbiAgICBpZiAoY2hlY2tWZXJzaW9uICYmIHZlcnNpb25BdHRyKSB7XG4gICAgICB3aGVyZVt2ZXJzaW9uQXR0cl0gPSB0aGlzLmdldCh2ZXJzaW9uQXR0ciwgeyByYXc6IHRydWUgfSk7XG4gICAgfVxuICAgIHJldHVybiBVdGlscy5tYXBXaGVyZUZpZWxkTmFtZXMod2hlcmUsIHRoaXMuY29uc3RydWN0b3IpO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIGBbb2JqZWN0IFNlcXVlbGl6ZUluc3RhbmNlOiR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfV1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIHVuZGVybHlpbmcgZGF0YSB2YWx1ZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IGtleSB0byBsb29rIGluIGluc3RhbmNlIGRhdGEgc3RvcmVcbiAgICpcbiAgICogQHJldHVybnMge2FueX1cbiAgICovXG4gIGdldERhdGFWYWx1ZShrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhVmFsdWVzW2tleV07XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSB1bmRlcmx5aW5nIGRhdGEgdmFsdWVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBrZXkgdG8gc2V0IGluIGluc3RhbmNlIGRhdGEgc3RvcmVcbiAgICogQHBhcmFtIHthbnl9IHZhbHVlIG5ldyB2YWx1ZSBmb3IgZ2l2ZW4ga2V5XG4gICAqXG4gICAqL1xuICBzZXREYXRhVmFsdWUoa2V5LCB2YWx1ZSkge1xuICAgIGNvbnN0IG9yaWdpbmFsVmFsdWUgPSB0aGlzLl9wcmV2aW91c0RhdGFWYWx1ZXNba2V5XTtcblxuICAgIGlmICghVXRpbHMuaXNQcmltaXRpdmUodmFsdWUpICYmIHZhbHVlICE9PSBudWxsIHx8IHZhbHVlICE9PSBvcmlnaW5hbFZhbHVlKSB7XG4gICAgICB0aGlzLmNoYW5nZWQoa2V5LCB0cnVlKTtcbiAgICB9XG5cbiAgICB0aGlzLmRhdGFWYWx1ZXNba2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIG5vIGtleSBpcyBnaXZlbiwgcmV0dXJucyBhbGwgdmFsdWVzIG9mIHRoZSBpbnN0YW5jZSwgYWxzbyBpbnZva2luZyB2aXJ0dWFsIGdldHRlcnMuXG4gICAqXG4gICAqIElmIGtleSBpcyBnaXZlbiBhbmQgYSBmaWVsZCBvciB2aXJ0dWFsIGdldHRlciBpcyBwcmVzZW50IGZvciB0aGUga2V5IGl0IHdpbGwgY2FsbCB0aGF0IGdldHRlciAtIGVsc2UgaXQgd2lsbCByZXR1cm4gdGhlIHZhbHVlIGZvciBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgW2tleV0ga2V5IHRvIGdldCB2YWx1ZSBvZlxuICAgKiBAcGFyYW0ge09iamVjdH0gIFtvcHRpb25zXSBnZXQgb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnBsYWluPWZhbHNlXSBJZiBzZXQgdG8gdHJ1ZSwgaW5jbHVkZWQgaW5zdGFuY2VzIHdpbGwgYmUgcmV0dXJuZWQgYXMgcGxhaW4gb2JqZWN0c1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJhdz1mYWxzZV0gSWYgc2V0IHRvIHRydWUsIGZpZWxkIGFuZCB2aXJ0dWFsIHNldHRlcnMgd2lsbCBiZSBpZ25vcmVkXG4gICAqXG4gICAqIEByZXR1cm5zIHtPYmplY3R8YW55fVxuICAgKi9cbiAgZ2V0KGtleSwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG9wdGlvbnMgPSBrZXk7XG4gICAgICBrZXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAoa2V5KSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuX2N1c3RvbUdldHRlcnMsIGtleSkgJiYgIW9wdGlvbnMucmF3KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jdXN0b21HZXR0ZXJzW2tleV0uY2FsbCh0aGlzLCBrZXksIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5wbGFpbiAmJiB0aGlzLl9vcHRpb25zLmluY2x1ZGUgJiYgdGhpcy5fb3B0aW9ucy5pbmNsdWRlTmFtZXMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFWYWx1ZXNba2V5XSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhVmFsdWVzW2tleV0ubWFwKGluc3RhbmNlID0+IGluc3RhbmNlLmdldChvcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZGF0YVZhbHVlc1trZXldIGluc3RhbmNlb2YgTW9kZWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhVmFsdWVzW2tleV0uZ2V0KG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFWYWx1ZXNba2V5XTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuZGF0YVZhbHVlc1trZXldO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMuX2hhc0N1c3RvbUdldHRlcnNcbiAgICAgIHx8IG9wdGlvbnMucGxhaW4gJiYgdGhpcy5fb3B0aW9ucy5pbmNsdWRlXG4gICAgICB8fCBvcHRpb25zLmNsb25lXG4gICAgKSB7XG4gICAgICBjb25zdCB2YWx1ZXMgPSB7fTtcbiAgICAgIGxldCBfa2V5O1xuXG4gICAgICBpZiAodGhpcy5faGFzQ3VzdG9tR2V0dGVycykge1xuICAgICAgICBmb3IgKF9rZXkgaW4gdGhpcy5fY3VzdG9tR2V0dGVycykge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMuX29wdGlvbnMuYXR0cmlidXRlc1xuICAgICAgICAgICAgJiYgIXRoaXMuX29wdGlvbnMuYXR0cmlidXRlcy5pbmNsdWRlcyhfa2V5KVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLl9jdXN0b21HZXR0ZXJzLCBfa2V5KSkge1xuICAgICAgICAgICAgdmFsdWVzW19rZXldID0gdGhpcy5nZXQoX2tleSwgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvciAoX2tleSBpbiB0aGlzLmRhdGFWYWx1ZXMpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWVzLCBfa2V5KVxuICAgICAgICAgICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmRhdGFWYWx1ZXMsIF9rZXkpXG4gICAgICAgICkge1xuICAgICAgICAgIHZhbHVlc1tfa2V5XSA9IHRoaXMuZ2V0KF9rZXksIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGF0YVZhbHVlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgaXMgdXNlZCB0byB1cGRhdGUgdmFsdWVzIG9uIHRoZSBpbnN0YW5jZSAodGhlIHNlcXVlbGl6ZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgaW5zdGFuY2UgdGhhdCBpcywgcmVtZW1iZXIgdGhhdCBub3RoaW5nIHdpbGwgYmUgcGVyc2lzdGVkIGJlZm9yZSB5b3UgYWN0dWFsbHkgY2FsbCBgc2F2ZWApLlxuICAgKiBJbiBpdHMgbW9zdCBiYXNpYyBmb3JtIGBzZXRgIHdpbGwgdXBkYXRlIGEgdmFsdWUgc3RvcmVkIGluIHRoZSB1bmRlcmx5aW5nIGBkYXRhVmFsdWVzYCBvYmplY3QuIEhvd2V2ZXIsIGlmIGEgY3VzdG9tIHNldHRlciBmdW5jdGlvbiBpcyBkZWZpbmVkIGZvciB0aGUga2V5LCB0aGF0IGZ1bmN0aW9uXG4gICAqIHdpbGwgYmUgY2FsbGVkIGluc3RlYWQuIFRvIGJ5cGFzcyB0aGUgc2V0dGVyLCB5b3UgY2FuIHBhc3MgYHJhdzogdHJ1ZWAgaW4gdGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgKlxuICAgKiBJZiBzZXQgaXMgY2FsbGVkIHdpdGggYW4gb2JqZWN0LCBpdCB3aWxsIGxvb3Agb3ZlciB0aGUgb2JqZWN0LCBhbmQgY2FsbCBzZXQgcmVjdXJzaXZlbHkgZm9yIGVhY2gga2V5LCB2YWx1ZSBwYWlyLiBJZiB5b3Ugc2V0IHJhdyB0byB0cnVlLCB0aGUgdW5kZXJseWluZyBkYXRhVmFsdWVzIHdpbGwgZWl0aGVyIGJlXG4gICAqIHNldCBkaXJlY3RseSB0byB0aGUgb2JqZWN0IHBhc3NlZCwgb3IgdXNlZCB0byBleHRlbmQgZGF0YVZhbHVlcywgaWYgZGF0YVZhbHVlcyBhbHJlYWR5IGNvbnRhaW4gdmFsdWVzLlxuICAgKlxuICAgKiBXaGVuIHNldCBpcyBjYWxsZWQsIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgZmllbGQgaXMgc3RvcmVkIGFuZCBzZXRzIGEgY2hhbmdlZCBmbGFnKHNlZSBgY2hhbmdlZGApLlxuICAgKlxuICAgKiBTZXQgY2FuIGFsc28gYmUgdXNlZCB0byBidWlsZCBpbnN0YW5jZXMgZm9yIGFzc29jaWF0aW9ucywgaWYgeW91IGhhdmUgdmFsdWVzIGZvciB0aG9zZS5cbiAgICogV2hlbiB1c2luZyBzZXQgd2l0aCBhc3NvY2lhdGlvbnMgeW91IG5lZWQgdG8gbWFrZSBzdXJlIHRoZSBwcm9wZXJ0eSBrZXkgbWF0Y2hlcyB0aGUgYWxpYXMgb2YgdGhlIGFzc29jaWF0aW9uXG4gICAqIHdoaWxlIGFsc28gbWFraW5nIHN1cmUgdGhhdCB0aGUgcHJvcGVyIGluY2x1ZGUgb3B0aW9ucyBoYXZlIGJlZW4gc2V0IChmcm9tIC5idWlsZCgpIG9yIC5maW5kT25lKCkpXG4gICAqXG4gICAqIElmIGNhbGxlZCB3aXRoIGEgZG90LnNlcGFyYXRlZCBrZXkgb24gYSBKU09OL0pTT05CIGF0dHJpYnV0ZSBpdCB3aWxsIHNldCB0aGUgdmFsdWUgbmVzdGVkIGFuZCBmbGFnIHRoZSBlbnRpcmUgb2JqZWN0IGFzIGNoYW5nZWQuXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9IGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IGluY2x1ZGVzXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0ga2V5IGtleSB0byBzZXQsIGl0IGNhbiBiZSBzdHJpbmcgb3Igb2JqZWN0LiBXaGVuIHN0cmluZyBpdCB3aWxsIHNldCB0aGF0IGtleSwgZm9yIG9iamVjdCBpdCB3aWxsIGxvb3Agb3ZlciBhbGwgb2JqZWN0IHByb3BlcnRpZXMgbmQgc2V0IHRoZW0uXG4gICAqIEBwYXJhbSB7YW55fSB2YWx1ZSB2YWx1ZSB0byBzZXRcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBzZXQgb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJhdz1mYWxzZV0gSWYgc2V0IHRvIHRydWUsIGZpZWxkIGFuZCB2aXJ0dWFsIHNldHRlcnMgd2lsbCBiZSBpZ25vcmVkXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmVzZXQ9ZmFsc2VdIENsZWFyIGFsbCBwcmV2aW91c2x5IHNldCBkYXRhIHZhbHVlc1xuICAgKlxuICAgKiBAcmV0dXJucyB7TW9kZWx9XG4gICAqL1xuICBzZXQoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgIGxldCB2YWx1ZXM7XG4gICAgbGV0IG9yaWdpbmFsVmFsdWU7XG5cbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcgJiYga2V5ICE9PSBudWxsKSB7XG4gICAgICB2YWx1ZXMgPSBrZXk7XG4gICAgICBvcHRpb25zID0gdmFsdWUgfHwge307XG5cbiAgICAgIGlmIChvcHRpb25zLnJlc2V0KSB7XG4gICAgICAgIHRoaXMuZGF0YVZhbHVlcyA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICB0aGlzLmNoYW5nZWQoa2V5LCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgcmF3LCBhbmQgd2UncmUgbm90IGRlYWxpbmcgd2l0aCBpbmNsdWRlcyBvciBzcGVjaWFsIGF0dHJpYnV0ZXMsIGp1c3Qgc2V0IGl0IHN0cmFpZ2h0IG9uIHRoZSBkYXRhVmFsdWVzIG9iamVjdFxuICAgICAgaWYgKG9wdGlvbnMucmF3ICYmICEodGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLmluY2x1ZGUpICYmICEob3B0aW9ucyAmJiBvcHRpb25zLmF0dHJpYnV0ZXMpICYmICF0aGlzLmNvbnN0cnVjdG9yLl9oYXNEYXRlQXR0cmlidXRlcyAmJiAhdGhpcy5jb25zdHJ1Y3Rvci5faGFzQm9vbGVhbkF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuZGF0YVZhbHVlcykubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5kYXRhVmFsdWVzID0gT2JqZWN0LmFzc2lnbih0aGlzLmRhdGFWYWx1ZXMsIHZhbHVlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5kYXRhVmFsdWVzID0gdmFsdWVzO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIHJhdywgLmNoYW5nZWQoKSBzaG91bGRuJ3QgYmUgdHJ1ZVxuICAgICAgICB0aGlzLl9wcmV2aW91c0RhdGFWYWx1ZXMgPSBfLmNsb25lKHRoaXMuZGF0YVZhbHVlcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBMb29wIGFuZCBjYWxsIHNldFxuICAgICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgY29uc3Qgc2V0S2V5cyA9IGRhdGEgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrIG9mIGRhdGEpIHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlc1trXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5zZXQoaywgdmFsdWVzW2tdLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIHNldEtleXMob3B0aW9ucy5hdHRyaWJ1dGVzKTtcbiAgICAgICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci5faGFzVmlydHVhbEF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIHNldEtleXModGhpcy5jb25zdHJ1Y3Rvci5fdmlydHVhbEF0dHJpYnV0ZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5fb3B0aW9ucy5pbmNsdWRlTmFtZXMpIHtcbiAgICAgICAgICAgIHNldEtleXModGhpcy5fb3B0aW9ucy5pbmNsdWRlTmFtZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGtleSwgdmFsdWVzW2tleV0sIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnJhdykge1xuICAgICAgICAgIC8vIElmIHJhdywgLmNoYW5nZWQoKSBzaG91bGRuJ3QgYmUgdHJ1ZVxuICAgICAgICAgIHRoaXMuX3ByZXZpb3VzRGF0YVZhbHVlcyA9IF8uY2xvbmUodGhpcy5kYXRhVmFsdWVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmICghb3B0aW9ucylcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICBpZiAoIW9wdGlvbnMucmF3KSB7XG4gICAgICBvcmlnaW5hbFZhbHVlID0gdGhpcy5kYXRhVmFsdWVzW2tleV07XG4gICAgfVxuXG4gICAgLy8gSWYgbm90IHJhdywgYW5kIHRoZXJlJ3MgYSBjdXN0b20gc2V0dGVyXG4gICAgaWYgKCFvcHRpb25zLnJhdyAmJiB0aGlzLl9jdXN0b21TZXR0ZXJzW2tleV0pIHtcbiAgICAgIHRoaXMuX2N1c3RvbVNldHRlcnNba2V5XS5jYWxsKHRoaXMsIHZhbHVlLCBrZXkpO1xuICAgICAgLy8gY3VzdG9tIHNldHRlciBzaG91bGQgaGF2ZSBjaGFuZ2VkIHZhbHVlLCBnZXQgdGhhdCBjaGFuZ2VkIHZhbHVlXG4gICAgICAvLyBUT0RPOiB2NSBtYWtlIHNldHRlcnMgcmV0dXJuIG5ldyB2YWx1ZSBpbnN0ZWFkIG9mIGNoYW5naW5nIGludGVybmFsIHN0b3JlXG4gICAgICBjb25zdCBuZXdWYWx1ZSA9IHRoaXMuZGF0YVZhbHVlc1trZXldO1xuICAgICAgaWYgKCFVdGlscy5pc1ByaW1pdGl2ZShuZXdWYWx1ZSkgJiYgbmV3VmFsdWUgIT09IG51bGwgfHwgbmV3VmFsdWUgIT09IG9yaWdpbmFsVmFsdWUpIHtcbiAgICAgICAgdGhpcy5fcHJldmlvdXNEYXRhVmFsdWVzW2tleV0gPSBvcmlnaW5hbFZhbHVlO1xuICAgICAgICB0aGlzLmNoYW5nZWQoa2V5LCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ2hlY2sgaWYgd2UgaGF2ZSBpbmNsdWRlZCBtb2RlbHMsIGFuZCBpZiB0aGlzIGtleSBtYXRjaGVzIHRoZSBpbmNsdWRlIG1vZGVsIG5hbWVzL2FsaWFzZXNcbiAgICAgIGlmICh0aGlzLl9vcHRpb25zICYmIHRoaXMuX29wdGlvbnMuaW5jbHVkZSAmJiB0aGlzLl9vcHRpb25zLmluY2x1ZGVOYW1lcy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIC8vIFBhc3MgaXQgb24gdG8gdGhlIGluY2x1ZGUgaGFuZGxlclxuICAgICAgICB0aGlzLl9zZXRJbmNsdWRlKGtleSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIC8vIEJ1bmNoIG9mIHN0dWZmIHdlIHdvbid0IGRvIHdoZW4gaXQncyByYXdcbiAgICAgIGlmICghb3B0aW9ucy5yYXcpIHtcbiAgICAgICAgLy8gSWYgYXR0cmlidXRlIGlzIG5vdCBpbiBtb2RlbCBkZWZpbml0aW9uLCByZXR1cm5cbiAgICAgICAgaWYgKCF0aGlzLl9pc0F0dHJpYnV0ZShrZXkpKSB7XG4gICAgICAgICAgaWYgKGtleS5pbmNsdWRlcygnLicpICYmIHRoaXMuY29uc3RydWN0b3IuX2pzb25BdHRyaWJ1dGVzLmhhcyhrZXkuc3BsaXQoJy4nKVswXSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzTmVzdGVkVmFsdWUgPSBEb3R0aWUuZ2V0KHRoaXMuZGF0YVZhbHVlcywga2V5KTtcbiAgICAgICAgICAgIGlmICghXy5pc0VxdWFsKHByZXZpb3VzTmVzdGVkVmFsdWUsIHZhbHVlKSkge1xuICAgICAgICAgICAgICBEb3R0aWUuc2V0KHRoaXMuZGF0YVZhbHVlcywga2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICAgIHRoaXMuY2hhbmdlZChrZXkuc3BsaXQoJy4nKVswXSwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYXR0ZW1wdGluZyB0byBzZXQgcHJpbWFyeSBrZXkgYW5kIHByaW1hcnkga2V5IGlzIGFscmVhZHkgZGVmaW5lZCwgcmV0dXJuXG4gICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLl9oYXNQcmltYXJ5S2V5cyAmJiBvcmlnaW5hbFZhbHVlICYmIHRoaXMuY29uc3RydWN0b3IuX2lzUHJpbWFyeUtleShrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhdHRlbXB0aW5nIHRvIHNldCByZWFkIG9ubHkgYXR0cmlidXRlcywgcmV0dXJuXG4gICAgICAgIGlmICghdGhpcy5pc05ld1JlY29yZCAmJiB0aGlzLmNvbnN0cnVjdG9yLl9oYXNSZWFkT25seUF0dHJpYnV0ZXMgJiYgdGhpcy5jb25zdHJ1Y3Rvci5fcmVhZE9ubHlBdHRyaWJ1dGVzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlcmUncyBhIGRhdGEgdHlwZSBzYW5pdGl6ZXJcbiAgICAgIGlmIChcbiAgICAgICAgISh2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZClcbiAgICAgICAgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuY29uc3RydWN0b3IuX2RhdGFUeXBlU2FuaXRpemVycywga2V5KVxuICAgICAgKSB7XG4gICAgICAgIHZhbHVlID0gdGhpcy5jb25zdHJ1Y3Rvci5fZGF0YVR5cGVTYW5pdGl6ZXJzW2tleV0uY2FsbCh0aGlzLCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldCB3aGVuIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZCBhbmQgbm90IHJhd1xuICAgICAgaWYgKFxuICAgICAgICAhb3B0aW9ucy5yYXcgJiZcbiAgICAgICAgKFxuICAgICAgICAgIC8vIFRydWUgd2hlbiBzZXF1ZWxpemUgbWV0aG9kXG4gICAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QgfHxcbiAgICAgICAgICAvLyBDaGVjayBmb3IgZGF0YSB0eXBlIHR5cGUgY29tcGFyYXRvcnNcbiAgICAgICAgICAhKHZhbHVlIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKSAmJiB0aGlzLmNvbnN0cnVjdG9yLl9kYXRhVHlwZUNoYW5nZXNba2V5XSAmJiB0aGlzLmNvbnN0cnVjdG9yLl9kYXRhVHlwZUNoYW5nZXNba2V5XS5jYWxsKHRoaXMsIHZhbHVlLCBvcmlnaW5hbFZhbHVlLCBvcHRpb25zKSB8fFxuICAgICAgICAgIC8vIENoZWNrIGRlZmF1bHRcbiAgICAgICAgICAhdGhpcy5jb25zdHJ1Y3Rvci5fZGF0YVR5cGVDaGFuZ2VzW2tleV0gJiYgKCFVdGlscy5pc1ByaW1pdGl2ZSh2YWx1ZSkgJiYgdmFsdWUgIT09IG51bGwgfHwgdmFsdWUgIT09IG9yaWdpbmFsVmFsdWUpXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICB0aGlzLl9wcmV2aW91c0RhdGFWYWx1ZXNba2V5XSA9IG9yaWdpbmFsVmFsdWU7XG4gICAgICAgIHRoaXMuY2hhbmdlZChrZXksIHRydWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBzZXQgZGF0YSB2YWx1ZVxuICAgICAgdGhpcy5kYXRhVmFsdWVzW2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRBdHRyaWJ1dGVzKHVwZGF0ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQodXBkYXRlcyk7XG4gIH1cblxuICAvKipcbiAgICogSWYgY2hhbmdlZCBpcyBjYWxsZWQgd2l0aCBhIHN0cmluZyBpdCB3aWxsIHJldHVybiBhIGJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSB2YWx1ZSBvZiB0aGF0IGtleSBpbiBgZGF0YVZhbHVlc2AgaXMgZGlmZmVyZW50IGZyb20gdGhlIHZhbHVlIGluIGBfcHJldmlvdXNEYXRhVmFsdWVzYC5cbiAgICpcbiAgICogSWYgY2hhbmdlZCBpcyBjYWxsZWQgd2l0aG91dCBhbiBhcmd1bWVudCwgaXQgd2lsbCByZXR1cm4gYW4gYXJyYXkgb2Yga2V5cyB0aGF0IGhhdmUgY2hhbmdlZC5cbiAgICpcbiAgICogSWYgY2hhbmdlZCBpcyBjYWxsZWQgd2l0aG91dCBhbiBhcmd1bWVudCBhbmQgbm8ga2V5cyBoYXZlIGNoYW5nZWQsIGl0IHdpbGwgcmV0dXJuIGBmYWxzZWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBba2V5XSBrZXkgdG8gY2hlY2sgb3IgY2hhbmdlIHN0YXR1cyBvZlxuICAgKiBAcGFyYW0ge2FueX0gW3ZhbHVlXSB2YWx1ZSB0byBzZXRcbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW58QXJyYXl9XG4gICAqL1xuICBjaGFuZ2VkKGtleSwgdmFsdWUpIHtcbiAgICBpZiAoa2V5KSB7XG4gICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9jaGFuZ2VkW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fY2hhbmdlZFtrZXldIHx8IGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGNoYW5nZWQgPSBPYmplY3Qua2V5cyh0aGlzLmRhdGFWYWx1ZXMpLmZpbHRlcihrZXkgPT4gdGhpcy5jaGFuZ2VkKGtleSkpO1xuXG4gICAgcmV0dXJuIGNoYW5nZWQubGVuZ3RoID8gY2hhbmdlZCA6IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHByZXZpb3VzIHZhbHVlIGZvciBrZXkgZnJvbSBgX3ByZXZpb3VzRGF0YVZhbHVlc2AuXG4gICAqXG4gICAqIElmIGNhbGxlZCB3aXRob3V0IGEga2V5LCByZXR1cm5zIHRoZSBwcmV2aW91cyB2YWx1ZXMgZm9yIGFsbCB2YWx1ZXMgd2hpY2ggaGF2ZSBjaGFuZ2VkXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBba2V5XSBrZXkgdG8gZ2V0IHByZXZpb3VzIHZhbHVlIG9mXG4gICAqXG4gICAqIEByZXR1cm5zIHthbnl8QXJyYXk8YW55Pn1cbiAgICovXG4gIHByZXZpb3VzKGtleSkge1xuICAgIGlmIChrZXkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wcmV2aW91c0RhdGFWYWx1ZXNba2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gXy5waWNrQnkodGhpcy5fcHJldmlvdXNEYXRhVmFsdWVzLCAodmFsdWUsIGtleSkgPT4gdGhpcy5jaGFuZ2VkKGtleSkpO1xuICB9XG5cbiAgX3NldEluY2x1ZGUoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHZhbHVlID0gW3ZhbHVlXTtcbiAgICBpZiAodmFsdWVbMF0gaW5zdGFuY2VvZiBNb2RlbCkge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5tYXAoaW5zdGFuY2UgPT4gaW5zdGFuY2UuZGF0YVZhbHVlcyk7XG4gICAgfVxuXG4gICAgY29uc3QgaW5jbHVkZSA9IHRoaXMuX29wdGlvbnMuaW5jbHVkZU1hcFtrZXldO1xuICAgIGNvbnN0IGFzc29jaWF0aW9uID0gaW5jbHVkZS5hc3NvY2lhdGlvbjtcbiAgICBjb25zdCBhY2Nlc3NvciA9IGtleTtcbiAgICBjb25zdCBwcmltYXJ5S2V5QXR0cmlidXRlID0gaW5jbHVkZS5tb2RlbC5wcmltYXJ5S2V5QXR0cmlidXRlO1xuICAgIGNvbnN0IGNoaWxkT3B0aW9ucyA9IHtcbiAgICAgIGlzTmV3UmVjb3JkOiB0aGlzLmlzTmV3UmVjb3JkLFxuICAgICAgaW5jbHVkZTogaW5jbHVkZS5pbmNsdWRlLFxuICAgICAgaW5jbHVkZU5hbWVzOiBpbmNsdWRlLmluY2x1ZGVOYW1lcyxcbiAgICAgIGluY2x1ZGVNYXA6IGluY2x1ZGUuaW5jbHVkZU1hcCxcbiAgICAgIGluY2x1ZGVWYWxpZGF0ZWQ6IHRydWUsXG4gICAgICByYXc6IG9wdGlvbnMucmF3LFxuICAgICAgYXR0cmlidXRlczogaW5jbHVkZS5vcmlnaW5hbEF0dHJpYnV0ZXNcbiAgICB9O1xuICAgIGxldCBpc0VtcHR5O1xuXG4gICAgaWYgKGluY2x1ZGUub3JpZ2luYWxBdHRyaWJ1dGVzID09PSB1bmRlZmluZWQgfHwgaW5jbHVkZS5vcmlnaW5hbEF0dHJpYnV0ZXMubGVuZ3RoKSB7XG4gICAgICBpZiAoYXNzb2NpYXRpb24uaXNTaW5nbGVBc3NvY2lhdGlvbikge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlWzBdO1xuICAgICAgICB9XG4gICAgICAgIGlzRW1wdHkgPSB2YWx1ZSAmJiB2YWx1ZVtwcmltYXJ5S2V5QXR0cmlidXRlXSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gbnVsbDtcbiAgICAgICAgdGhpc1thY2Nlc3Nvcl0gPSB0aGlzLmRhdGFWYWx1ZXNbYWNjZXNzb3JdID0gaXNFbXB0eSA/IG51bGwgOiBpbmNsdWRlLm1vZGVsLmJ1aWxkKHZhbHVlLCBjaGlsZE9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXNFbXB0eSA9IHZhbHVlWzBdICYmIHZhbHVlWzBdW3ByaW1hcnlLZXlBdHRyaWJ1dGVdID09PSBudWxsO1xuICAgICAgICB0aGlzW2FjY2Vzc29yXSA9IHRoaXMuZGF0YVZhbHVlc1thY2Nlc3Nvcl0gPSBpc0VtcHR5ID8gW10gOiBpbmNsdWRlLm1vZGVsLmJ1bGtCdWlsZCh2YWx1ZSwgY2hpbGRPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgdGhpcyBpbnN0YW5jZSwgYW5kIGlmIHRoZSB2YWxpZGF0aW9uIHBhc3NlcywgcGVyc2lzdCBpdCB0byB0aGUgZGF0YWJhc2UuIEl0IHdpbGwgb25seSBzYXZlIGNoYW5nZWQgZmllbGRzLCBhbmQgZG8gbm90aGluZyBpZiBubyBmaWVsZHMgaGF2ZSBjaGFuZ2VkLlxuICAgKlxuICAgKiBPbiBzdWNjZXNzLCB0aGUgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgd2l0aCB0aGlzIGluc3RhbmNlLiBPbiB2YWxpZGF0aW9uIGVycm9yLCB0aGUgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgd2l0aCBhbiBpbnN0YW5jZSBvZiBgU2VxdWVsaXplLlZhbGlkYXRpb25FcnJvcmAuXG4gICAqIFRoaXMgZXJyb3Igd2lsbCBoYXZlIGEgcHJvcGVydHkgZm9yIGVhY2ggb2YgdGhlIGZpZWxkcyBmb3Igd2hpY2ggdmFsaWRhdGlvbiBmYWlsZWQsIHdpdGggdGhlIGVycm9yIG1lc3NhZ2UgZm9yIHRoYXQgZmllbGQuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIFtvcHRpb25zXSBzYXZlIG9wdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gICAgW29wdGlvbnMuZmllbGRzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBzdHJpbmdzLCByZXByZXNlbnRpbmcgZGF0YWJhc2UgY29sdW1ucy4gSWYgZmllbGRzIGlzIHByb3ZpZGVkLCBvbmx5IHRob3NlIGNvbHVtbnMgd2lsbCBiZSB2YWxpZGF0ZWQgYW5kIHNhdmVkLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICBbb3B0aW9ucy5zaWxlbnQ9ZmFsc2VdIElmIHRydWUsIHRoZSB1cGRhdGVkQXQgdGltZXN0YW1wIHdpbGwgbm90IGJlIHVwZGF0ZWQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgIFtvcHRpb25zLnZhbGlkYXRlPXRydWVdIElmIGZhbHNlLCB2YWxpZGF0aW9ucyB3b24ndCBiZSBydW4uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgIFtvcHRpb25zLmhvb2tzPXRydWVdIFJ1biBiZWZvcmUgYW5kIGFmdGVyIGNyZWF0ZSAvIHVwZGF0ZSArIHZhbGlkYXRlIGhvb2tzXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259ICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgIFtvcHRpb25zLnNlYXJjaFBhdGg9REVGQVVMVF0gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgW29wdGlvbnMucmV0dXJuaW5nXSBBcHBlbmQgUkVUVVJOSU5HICogdG8gZ2V0IGJhY2sgYXV0byBnZW5lcmF0ZWQgdmFsdWVzIChQb3N0Z3JlcyBvbmx5KVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbD59XG4gICAqL1xuICBzYXZlKG9wdGlvbnMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHNlY29uZCBhcmd1bWVudCB3YXMgcmVtb3ZlZCBpbiBmYXZvciBvZiB0aGUgb3B0aW9ucyBvYmplY3QuJyk7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcbiAgICBvcHRpb25zID0gXy5kZWZhdWx0cyhvcHRpb25zLCB7XG4gICAgICBob29rczogdHJ1ZSxcbiAgICAgIHZhbGlkYXRlOiB0cnVlXG4gICAgfSk7XG5cbiAgICBpZiAoIW9wdGlvbnMuZmllbGRzKSB7XG4gICAgICBpZiAodGhpcy5pc05ld1JlY29yZCkge1xuICAgICAgICBvcHRpb25zLmZpZWxkcyA9IE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IucmF3QXR0cmlidXRlcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zLmZpZWxkcyA9IF8uaW50ZXJzZWN0aW9uKHRoaXMuY2hhbmdlZCgpLCBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXMpKTtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucy5kZWZhdWx0RmllbGRzID0gb3B0aW9ucy5maWVsZHM7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMucmV0dXJuaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChvcHRpb25zLmFzc29jaWF0aW9uKSB7XG4gICAgICAgIG9wdGlvbnMucmV0dXJuaW5nID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNOZXdSZWNvcmQpIHtcbiAgICAgICAgb3B0aW9ucy5yZXR1cm5pbmcgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHByaW1hcnlLZXlOYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5QXR0cmlidXRlO1xuICAgIGNvbnN0IHByaW1hcnlLZXlBdHRyaWJ1dGUgPSBwcmltYXJ5S2V5TmFtZSAmJiB0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXNbcHJpbWFyeUtleU5hbWVdO1xuICAgIGNvbnN0IGNyZWF0ZWRBdEF0dHIgPSB0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdDtcbiAgICBjb25zdCB2ZXJzaW9uQXR0ciA9IHRoaXMuY29uc3RydWN0b3IuX3ZlcnNpb25BdHRyaWJ1dGU7XG4gICAgY29uc3QgaG9vayA9IHRoaXMuaXNOZXdSZWNvcmQgPyAnQ3JlYXRlJyA6ICdVcGRhdGUnO1xuICAgIGNvbnN0IHdhc05ld1JlY29yZCA9IHRoaXMuaXNOZXdSZWNvcmQ7XG4gICAgY29uc3Qgbm93ID0gVXRpbHMubm93KHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCk7XG4gICAgbGV0IHVwZGF0ZWRBdEF0dHIgPSB0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdDtcblxuICAgIGlmICh1cGRhdGVkQXRBdHRyICYmIG9wdGlvbnMuZmllbGRzLmxlbmd0aCA+PSAxICYmICFvcHRpb25zLmZpZWxkcy5pbmNsdWRlcyh1cGRhdGVkQXRBdHRyKSkge1xuICAgICAgb3B0aW9ucy5maWVsZHMucHVzaCh1cGRhdGVkQXRBdHRyKTtcbiAgICB9XG4gICAgaWYgKHZlcnNpb25BdHRyICYmIG9wdGlvbnMuZmllbGRzLmxlbmd0aCA+PSAxICYmICFvcHRpb25zLmZpZWxkcy5pbmNsdWRlcyh2ZXJzaW9uQXR0cikpIHtcbiAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2godmVyc2lvbkF0dHIpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNpbGVudCA9PT0gdHJ1ZSAmJiAhKHRoaXMuaXNOZXdSZWNvcmQgJiYgdGhpcy5nZXQodXBkYXRlZEF0QXR0ciwgeyByYXc6IHRydWUgfSkpKSB7XG4gICAgICAvLyBVcGRhdGVBdEF0dHIgbWlnaHQgaGF2ZSBiZWVuIGFkZGVkIGFzIGEgcmVzdWx0IG9mIE9iamVjdC5rZXlzKE1vZGVsLnJhd0F0dHJpYnV0ZXMpLiBJbiB0aGF0IGNhc2Ugd2UgaGF2ZSB0byByZW1vdmUgaXQgYWdhaW5cbiAgICAgIF8ucmVtb3ZlKG9wdGlvbnMuZmllbGRzLCB2YWwgPT4gdmFsID09PSB1cGRhdGVkQXRBdHRyKTtcbiAgICAgIHVwZGF0ZWRBdEF0dHIgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc05ld1JlY29yZCA9PT0gdHJ1ZSkge1xuICAgICAgaWYgKGNyZWF0ZWRBdEF0dHIgJiYgIW9wdGlvbnMuZmllbGRzLmluY2x1ZGVzKGNyZWF0ZWRBdEF0dHIpKSB7XG4gICAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2goY3JlYXRlZEF0QXR0cik7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcmltYXJ5S2V5QXR0cmlidXRlICYmIHByaW1hcnlLZXlBdHRyaWJ1dGUuZGVmYXVsdFZhbHVlICYmICFvcHRpb25zLmZpZWxkcy5pbmNsdWRlcyhwcmltYXJ5S2V5TmFtZSkpIHtcbiAgICAgICAgb3B0aW9ucy5maWVsZHMudW5zaGlmdChwcmltYXJ5S2V5TmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNOZXdSZWNvcmQgPT09IGZhbHNlKSB7XG4gICAgICBpZiAocHJpbWFyeUtleU5hbWUgJiYgdGhpcy5nZXQocHJpbWFyeUtleU5hbWUsIHsgcmF3OiB0cnVlIH0pID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgYXR0ZW1wdGVkIHRvIHNhdmUgYW4gaW5zdGFuY2Ugd2l0aCBubyBwcmltYXJ5IGtleSwgdGhpcyBpcyBub3QgYWxsb3dlZCBzaW5jZSBpdCB3b3VsZCByZXN1bHQgaW4gYSBnbG9iYWwgdXBkYXRlJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHVwZGF0ZWRBdEF0dHIgJiYgIW9wdGlvbnMuc2lsZW50ICYmIG9wdGlvbnMuZmllbGRzLmluY2x1ZGVzKHVwZGF0ZWRBdEF0dHIpKSB7XG4gICAgICB0aGlzLmRhdGFWYWx1ZXNbdXBkYXRlZEF0QXR0cl0gPSB0aGlzLmNvbnN0cnVjdG9yLl9nZXREZWZhdWx0VGltZXN0YW1wKHVwZGF0ZWRBdEF0dHIpIHx8IG5vdztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc05ld1JlY29yZCAmJiBjcmVhdGVkQXRBdHRyICYmICF0aGlzLmRhdGFWYWx1ZXNbY3JlYXRlZEF0QXR0cl0pIHtcbiAgICAgIHRoaXMuZGF0YVZhbHVlc1tjcmVhdGVkQXRBdHRyXSA9IHRoaXMuY29uc3RydWN0b3IuX2dldERlZmF1bHRUaW1lc3RhbXAoY3JlYXRlZEF0QXR0cikgfHwgbm93O1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XG4gICAgICAvLyBWYWxpZGF0ZVxuICAgICAgaWYgKG9wdGlvbnMudmFsaWRhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGUob3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBSdW4gYmVmb3JlIGhvb2tcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XG4gICAgICAgIGNvbnN0IGJlZm9yZUhvb2tWYWx1ZXMgPSBfLnBpY2sodGhpcy5kYXRhVmFsdWVzLCBvcHRpb25zLmZpZWxkcyk7XG4gICAgICAgIGxldCBpZ25vcmVDaGFuZ2VkID0gXy5kaWZmZXJlbmNlKHRoaXMuY2hhbmdlZCgpLCBvcHRpb25zLmZpZWxkcyk7IC8vIEluIGNhc2Ugb2YgdXBkYXRlIHdoZXJlIGl0J3Mgb25seSBzdXBwb3NlZCB0byB1cGRhdGUgdGhlIHBhc3NlZCB2YWx1ZXMgYW5kIHRoZSBob29rIHZhbHVlc1xuICAgICAgICBsZXQgaG9va0NoYW5nZWQ7XG4gICAgICAgIGxldCBhZnRlckhvb2tWYWx1ZXM7XG5cbiAgICAgICAgaWYgKHVwZGF0ZWRBdEF0dHIgJiYgb3B0aW9ucy5maWVsZHMuaW5jbHVkZXModXBkYXRlZEF0QXR0cikpIHtcbiAgICAgICAgICBpZ25vcmVDaGFuZ2VkID0gXy53aXRob3V0KGlnbm9yZUNoYW5nZWQsIHVwZGF0ZWRBdEF0dHIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IucnVuSG9va3MoYGJlZm9yZSR7aG9va31gLCB0aGlzLCBvcHRpb25zKVxuICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmRlZmF1bHRGaWVsZHMgJiYgIXRoaXMuaXNOZXdSZWNvcmQpIHtcbiAgICAgICAgICAgICAgYWZ0ZXJIb29rVmFsdWVzID0gXy5waWNrKHRoaXMuZGF0YVZhbHVlcywgXy5kaWZmZXJlbmNlKHRoaXMuY2hhbmdlZCgpLCBpZ25vcmVDaGFuZ2VkKSk7XG5cbiAgICAgICAgICAgICAgaG9va0NoYW5nZWQgPSBbXTtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoYWZ0ZXJIb29rVmFsdWVzKSkge1xuICAgICAgICAgICAgICAgIGlmIChhZnRlckhvb2tWYWx1ZXNba2V5XSAhPT0gYmVmb3JlSG9va1ZhbHVlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICBob29rQ2hhbmdlZC5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgb3B0aW9ucy5maWVsZHMgPSBfLnVuaXEob3B0aW9ucy5maWVsZHMuY29uY2F0KGhvb2tDaGFuZ2VkKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChob29rQ2hhbmdlZCkge1xuICAgICAgICAgICAgICBpZiAob3B0aW9ucy52YWxpZGF0ZSkge1xuICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSBhZ2FpblxuXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5za2lwID0gXy5kaWZmZXJlbmNlKE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IucmF3QXR0cmlidXRlcyksIGhvb2tDaGFuZ2VkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZShvcHRpb25zKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvcHRpb25zLnNraXA7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgIGlmICghb3B0aW9ucy5maWVsZHMubGVuZ3RoKSByZXR1cm4gdGhpcztcbiAgICAgIGlmICghdGhpcy5pc05ld1JlY29yZCkgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoIXRoaXMuX29wdGlvbnMuaW5jbHVkZSB8fCAhdGhpcy5fb3B0aW9ucy5pbmNsdWRlLmxlbmd0aCkgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIE5lc3RlZCBjcmVhdGlvbiBmb3IgQmVsb25nc1RvIHJlbGF0aW9uc1xuICAgICAgcmV0dXJuIFByb21pc2UubWFwKHRoaXMuX29wdGlvbnMuaW5jbHVkZS5maWx0ZXIoaW5jbHVkZSA9PiBpbmNsdWRlLmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvKSwgaW5jbHVkZSA9PiB7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5nZXQoaW5jbHVkZS5hcyk7XG4gICAgICAgIGlmICghaW5zdGFuY2UpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICBjb25zdCBpbmNsdWRlT3B0aW9ucyA9IF8oVXRpbHMuY2xvbmVEZWVwKGluY2x1ZGUpKVxuICAgICAgICAgIC5vbWl0KFsnYXNzb2NpYXRpb24nXSlcbiAgICAgICAgICAuZGVmYXVsdHMoe1xuICAgICAgICAgICAgdHJhbnNhY3Rpb246IG9wdGlvbnMudHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBsb2dnaW5nOiBvcHRpb25zLmxvZ2dpbmcsXG4gICAgICAgICAgICBwYXJlbnRSZWNvcmQ6IHRoaXNcbiAgICAgICAgICB9KS52YWx1ZSgpO1xuXG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5zYXZlKGluY2x1ZGVPcHRpb25zKS50aGVuKCgpID0+IHRoaXNbaW5jbHVkZS5hc3NvY2lhdGlvbi5hY2Nlc3NvcnMuc2V0XShpbnN0YW5jZSwgeyBzYXZlOiBmYWxzZSwgbG9nZ2luZzogb3B0aW9ucy5sb2dnaW5nIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgcmVhbEZpZWxkcyA9IG9wdGlvbnMuZmllbGRzLmZpbHRlcihmaWVsZCA9PiAhdGhpcy5jb25zdHJ1Y3Rvci5fdmlydHVhbEF0dHJpYnV0ZXMuaGFzKGZpZWxkKSk7XG4gICAgICBpZiAoIXJlYWxGaWVsZHMubGVuZ3RoKSByZXR1cm4gdGhpcztcbiAgICAgIGlmICghdGhpcy5jaGFuZ2VkKCkgJiYgIXRoaXMuaXNOZXdSZWNvcmQpIHJldHVybiB0aGlzO1xuXG4gICAgICBjb25zdCB2ZXJzaW9uRmllbGROYW1lID0gXy5nZXQodGhpcy5jb25zdHJ1Y3Rvci5yYXdBdHRyaWJ1dGVzW3ZlcnNpb25BdHRyXSwgJ2ZpZWxkJykgfHwgdmVyc2lvbkF0dHI7XG4gICAgICBsZXQgdmFsdWVzID0gVXRpbHMubWFwVmFsdWVGaWVsZE5hbWVzKHRoaXMuZGF0YVZhbHVlcywgb3B0aW9ucy5maWVsZHMsIHRoaXMuY29uc3RydWN0b3IpO1xuICAgICAgbGV0IHF1ZXJ5ID0gbnVsbDtcbiAgICAgIGxldCBhcmdzID0gW107XG4gICAgICBsZXQgd2hlcmU7XG5cbiAgICAgIGlmICh0aGlzLmlzTmV3UmVjb3JkKSB7XG4gICAgICAgIHF1ZXJ5ID0gJ2luc2VydCc7XG4gICAgICAgIGFyZ3MgPSBbdGhpcywgdGhpcy5jb25zdHJ1Y3Rvci5nZXRUYWJsZU5hbWUob3B0aW9ucyksIHZhbHVlcywgb3B0aW9uc107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3aGVyZSA9IHRoaXMud2hlcmUodHJ1ZSk7XG4gICAgICAgIGlmICh2ZXJzaW9uQXR0cikge1xuICAgICAgICAgIHZhbHVlc1t2ZXJzaW9uRmllbGROYW1lXSA9IHBhcnNlSW50KHZhbHVlc1t2ZXJzaW9uRmllbGROYW1lXSwgMTApICsgMTtcbiAgICAgICAgfVxuICAgICAgICBxdWVyeSA9ICd1cGRhdGUnO1xuICAgICAgICBhcmdzID0gW3RoaXMsIHRoaXMuY29uc3RydWN0b3IuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCB2YWx1ZXMsIHdoZXJlLCBvcHRpb25zXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuUXVlcnlJbnRlcmZhY2VbcXVlcnldKC4uLmFyZ3MpXG4gICAgICAgIC50aGVuKChbcmVzdWx0LCByb3dzVXBkYXRlZF0pPT4ge1xuICAgICAgICAgIGlmICh2ZXJzaW9uQXR0cikge1xuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIHRoYXQgYSByb3cgd2FzIHVwZGF0ZWQsIG90aGVyd2lzZSBpdCdzIGFuIG9wdGltaXN0aWMgbG9ja2luZyBlcnJvci5cbiAgICAgICAgICAgIGlmIChyb3dzVXBkYXRlZCA8IDEpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5PcHRpbWlzdGljTG9ja0Vycm9yKHtcbiAgICAgICAgICAgICAgICBtb2RlbE5hbWU6IHRoaXMuY29uc3RydWN0b3IubmFtZSxcbiAgICAgICAgICAgICAgICB2YWx1ZXMsXG4gICAgICAgICAgICAgICAgd2hlcmVcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXN1bHQuZGF0YVZhbHVlc1t2ZXJzaW9uQXR0cl0gPSB2YWx1ZXNbdmVyc2lvbkZpZWxkTmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVHJhbnNmZXIgZGF0YWJhc2UgZ2VuZXJhdGVkIHZhbHVlcyAoZGVmYXVsdHMsIGF1dG9pbmNyZW1lbnQsIGV0YylcbiAgICAgICAgICBmb3IgKGNvbnN0IGF0dHIgb2YgT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci5yYXdBdHRyaWJ1dGVzKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCAmJlxuICAgICAgICAgICAgICAgIHZhbHVlc1t0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGRdICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGQgIT09IGF0dHJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB2YWx1ZXNbYXR0cl0gPSB2YWx1ZXNbdGhpcy5jb25zdHJ1Y3Rvci5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkXTtcbiAgICAgICAgICAgICAgZGVsZXRlIHZhbHVlc1t0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGRdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YWx1ZXMgPSBPYmplY3QuYXNzaWduKHZhbHVlcywgcmVzdWx0LmRhdGFWYWx1ZXMpO1xuXG4gICAgICAgICAgcmVzdWx0LmRhdGFWYWx1ZXMgPSBPYmplY3QuYXNzaWduKHJlc3VsdC5kYXRhVmFsdWVzLCB2YWx1ZXMpO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pXG4gICAgICAgIC50YXAoKCkgPT4ge1xuICAgICAgICAgIGlmICghd2FzTmV3UmVjb3JkKSByZXR1cm4gdGhpcztcbiAgICAgICAgICBpZiAoIXRoaXMuX29wdGlvbnMuaW5jbHVkZSB8fCAhdGhpcy5fb3B0aW9ucy5pbmNsdWRlLmxlbmd0aCkgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgICAvLyBOZXN0ZWQgY3JlYXRpb24gZm9yIEhhc09uZS9IYXNNYW55L0JlbG9uZ3NUb01hbnkgcmVsYXRpb25zXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UubWFwKHRoaXMuX29wdGlvbnMuaW5jbHVkZS5maWx0ZXIoaW5jbHVkZSA9PiAhKGluY2x1ZGUuYXNzb2NpYXRpb24gaW5zdGFuY2VvZiBCZWxvbmdzVG8gfHxcbiAgICAgICAgICAgIGluY2x1ZGUucGFyZW50ICYmIGluY2x1ZGUucGFyZW50LmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvTWFueSkpLCBpbmNsdWRlID0+IHtcbiAgICAgICAgICAgIGxldCBpbnN0YW5jZXMgPSB0aGlzLmdldChpbmNsdWRlLmFzKTtcblxuICAgICAgICAgICAgaWYgKCFpbnN0YW5jZXMpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShpbnN0YW5jZXMpKSBpbnN0YW5jZXMgPSBbaW5zdGFuY2VzXTtcbiAgICAgICAgICAgIGlmICghaW5zdGFuY2VzLmxlbmd0aCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgICAgICBjb25zdCBpbmNsdWRlT3B0aW9ucyA9IF8oVXRpbHMuY2xvbmVEZWVwKGluY2x1ZGUpKVxuICAgICAgICAgICAgICAub21pdChbJ2Fzc29jaWF0aW9uJ10pXG4gICAgICAgICAgICAgIC5kZWZhdWx0cyh7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb246IG9wdGlvbnMudHJhbnNhY3Rpb24sXG4gICAgICAgICAgICAgICAgbG9nZ2luZzogb3B0aW9ucy5sb2dnaW5nLFxuICAgICAgICAgICAgICAgIHBhcmVudFJlY29yZDogdGhpc1xuICAgICAgICAgICAgICB9KS52YWx1ZSgpO1xuXG4gICAgICAgICAgICAvLyBJbnN0YW5jZXMgd2lsbCBiZSB1cGRhdGVkIGluIHBsYWNlIHNvIHdlIGNhbiBzYWZlbHkgdHJlYXQgSGFzT25lIGxpa2UgYSBIYXNNYW55XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5tYXAoaW5zdGFuY2VzLCBpbnN0YW5jZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChpbmNsdWRlLmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvTWFueSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZS5zYXZlKGluY2x1ZGVPcHRpb25zKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgdmFsdWVzW2luY2x1ZGUuYXNzb2NpYXRpb24uZm9yZWlnbktleV0gPSB0aGlzLmdldCh0aGlzLmNvbnN0cnVjdG9yLnByaW1hcnlLZXlBdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgdmFsdWVzW2luY2x1ZGUuYXNzb2NpYXRpb24ub3RoZXJLZXldID0gaW5zdGFuY2UuZ2V0KGluc3RhbmNlLmNvbnN0cnVjdG9yLnByaW1hcnlLZXlBdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pO1xuXG4gICAgICAgICAgICAgICAgICAvLyBJbmNsdWRlIHZhbHVlcyBkZWZpbmVkIGluIHRoZSBhc3NvY2lhdGlvblxuICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih2YWx1ZXMsIGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5zY29wZSk7XG4gICAgICAgICAgICAgICAgICBpZiAoaW5zdGFuY2VbaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYXR0ciBvZiBPYmplY3Qua2V5cyhpbmNsdWRlLmFzc29jaWF0aW9uLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uX2F1dG9HZW5lcmF0ZWQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHIgPT09IGluY2x1ZGUuYXNzb2NpYXRpb24uZm9yZWlnbktleSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0ciA9PT0gaW5jbHVkZS5hc3NvY2lhdGlvbi5vdGhlcktleSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGluc3RhbmNlW2luY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5uYW1lXVthdHRyXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW2F0dHJdID0gaW5zdGFuY2VbaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLm5hbWVdW2F0dHJdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIHJldHVybiBpbmNsdWRlLmFzc29jaWF0aW9uLnRocm91Z2hNb2RlbC5jcmVhdGUodmFsdWVzLCBpbmNsdWRlT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaW5zdGFuY2Uuc2V0KGluY2x1ZGUuYXNzb2NpYXRpb24uZm9yZWlnbktleSwgdGhpcy5nZXQoaW5jbHVkZS5hc3NvY2lhdGlvbi5zb3VyY2VLZXkgfHwgdGhpcy5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5QXR0cmlidXRlLCB7IHJhdzogdHJ1ZSB9KSwgeyByYXc6IHRydWUgfSk7XG4gICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oaW5zdGFuY2UsIGluY2x1ZGUuYXNzb2NpYXRpb24uc2NvcGUpO1xuICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2Uuc2F2ZShpbmNsdWRlT3B0aW9ucyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRhcChyZXN1bHQgPT4ge1xuICAgICAgICAgIC8vIFJ1biBhZnRlciBob29rXG4gICAgICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnJ1bkhvb2tzKGBhZnRlciR7aG9va31gLCByZXN1bHQsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGZpZWxkIG9mIG9wdGlvbnMuZmllbGRzKSB7XG4gICAgICAgICAgICByZXN1bHQuX3ByZXZpb3VzRGF0YVZhbHVlc1tmaWVsZF0gPSByZXN1bHQuZGF0YVZhbHVlc1tmaWVsZF07XG4gICAgICAgICAgICB0aGlzLmNoYW5nZWQoZmllbGQsIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5pc05ld1JlY29yZCA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggdGhlIGN1cnJlbnQgaW5zdGFuY2UgaW4tcGxhY2UsIGkuZS4gdXBkYXRlIHRoZSBvYmplY3Qgd2l0aCBjdXJyZW50IGRhdGEgZnJvbSB0aGUgREIgYW5kIHJldHVybiB0aGUgc2FtZSBvYmplY3QuXG4gICAqIFRoaXMgaXMgZGlmZmVyZW50IGZyb20gZG9pbmcgYSBgZmluZChJbnN0YW5jZS5pZClgLCBiZWNhdXNlIHRoYXQgd291bGQgY3JlYXRlIGFuZCByZXR1cm4gYSBuZXcgaW5zdGFuY2UuIFdpdGggdGhpcyBtZXRob2QsXG4gICAqIGFsbCByZWZlcmVuY2VzIHRvIHRoZSBJbnN0YW5jZSBhcmUgdXBkYXRlZCB3aXRoIHRoZSBuZXcgZGF0YSBhbmQgbm8gbmV3IG9iamVjdHMgYXJlIGNyZWF0ZWQuXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9ucyB0aGF0IGFyZSBwYXNzZWQgb24gdG8gYE1vZGVsLmZpbmRgXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbD59XG4gICAqL1xuICByZWxvYWQob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBVdGlscy5kZWZhdWx0cyh7fSwgb3B0aW9ucywge1xuICAgICAgd2hlcmU6IHRoaXMud2hlcmUoKSxcbiAgICAgIGluY2x1ZGU6IHRoaXMuX29wdGlvbnMuaW5jbHVkZSB8fCBudWxsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5maW5kT25lKG9wdGlvbnMpXG4gICAgICAudGFwKHJlbG9hZCA9PiB7XG4gICAgICAgIGlmICghcmVsb2FkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5JbnN0YW5jZUVycm9yKFxuICAgICAgICAgICAgJ0luc3RhbmNlIGNvdWxkIG5vdCBiZSByZWxvYWRlZCBiZWNhdXNlIGl0IGRvZXMgbm90IGV4aXN0IGFueW1vcmUgKGZpbmQgY2FsbCByZXR1cm5lZCBudWxsKSdcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4ocmVsb2FkID0+IHtcbiAgICAgIC8vIHVwZGF0ZSB0aGUgaW50ZXJuYWwgb3B0aW9ucyBvZiB0aGUgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IHJlbG9hZC5fb3B0aW9ucztcbiAgICAgICAgLy8gcmUtc2V0IGluc3RhbmNlIHZhbHVlc1xuICAgICAgICB0aGlzLnNldChyZWxvYWQuZGF0YVZhbHVlcywge1xuICAgICAgICAgIHJhdzogdHJ1ZSxcbiAgICAgICAgICByZXNldDogdHJ1ZSAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICogVmFsaWRhdGUgdGhlIGF0dHJpYnV0ZXMgb2YgdGhpcyBpbnN0YW5jZSBhY2NvcmRpbmcgdG8gdmFsaWRhdGlvbiBydWxlcyBzZXQgaW4gdGhlIG1vZGVsIGRlZmluaXRpb24uXG4gICpcbiAgKiBUaGUgcHJvbWlzZSBmdWxmaWxscyBpZiBhbmQgb25seSBpZiB2YWxpZGF0aW9uIHN1Y2Nlc3NmdWw7IG90aGVyd2lzZSBpdCByZWplY3RzIGFuIEVycm9yIGluc3RhbmNlIGNvbnRhaW5pbmcgeyBmaWVsZCBuYW1lIDogW2Vycm9yIG1zZ3NdIH0gZW50cmllcy5cbiAgKlxuICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9ucyB0aGF0IGFyZSBwYXNzZWQgdG8gdGhlIHZhbGlkYXRvclxuICAqIEBwYXJhbSB7QXJyYXl9IFtvcHRpb25zLnNraXBdIEFuIGFycmF5IG9mIHN0cmluZ3MuIEFsbCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGluIHRoaXMgYXJyYXkgd2lsbCBub3QgYmUgdmFsaWRhdGVkXG4gICogQHBhcmFtIHtBcnJheX0gW29wdGlvbnMuZmllbGRzXSBBbiBhcnJheSBvZiBzdHJpbmdzLiBPbmx5IHRoZSBwcm9wZXJ0aWVzIHRoYXQgYXJlIGluIHRoaXMgYXJyYXkgd2lsbCBiZSB2YWxpZGF0ZWRcbiAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmhvb2tzPXRydWVdIFJ1biBiZWZvcmUgYW5kIGFmdGVyIHZhbGlkYXRlIGhvb2tzXG4gICpcbiAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgKi9cbiAgdmFsaWRhdGUob3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgSW5zdGFuY2VWYWxpZGF0b3IodGhpcywgb3B0aW9ucykudmFsaWRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGlzIHRoZSBzYW1lIGFzIGNhbGxpbmcgYHNldGAgYW5kIHRoZW4gY2FsbGluZyBgc2F2ZWAgYnV0IGl0IG9ubHkgc2F2ZXMgdGhlXG4gICAqIGV4YWN0IHZhbHVlcyBwYXNzZWQgdG8gaXQsIG1ha2luZyBpdCBtb3JlIGF0b21pYyBhbmQgc2FmZXIuXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsI3NldH1cbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwjc2F2ZX1cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlcyBTZWUgYHNldGBcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgU2VlIGBzYXZlYFxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbD59XG4gICAqL1xuICB1cGRhdGUodmFsdWVzLCBvcHRpb25zKSB7XG4gICAgLy8gQ2xvbmUgdmFsdWVzIHNvIGl0IGRvZXNuJ3QgZ2V0IG1vZGlmaWVkIGZvciBjYWxsZXIgc2NvcGUgYW5kIGlnbm9yZSB1bmRlZmluZWQgdmFsdWVzXG4gICAgdmFsdWVzID0gXy5vbWl0QnkodmFsdWVzLCB2YWx1ZSA9PiB2YWx1ZSA9PT0gdW5kZWZpbmVkKTtcblxuICAgIGNvbnN0IGNoYW5nZWRCZWZvcmUgPSB0aGlzLmNoYW5nZWQoKSB8fCBbXTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSBvcHRpb25zID0geyBmaWVsZHM6IG9wdGlvbnMgfTtcblxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XG4gICAgY29uc3Qgc2V0T3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcbiAgICBzZXRPcHRpb25zLmF0dHJpYnV0ZXMgPSBvcHRpb25zLmZpZWxkcztcbiAgICB0aGlzLnNldCh2YWx1ZXMsIHNldE9wdGlvbnMpO1xuXG4gICAgLy8gTm93IHdlIG5lZWQgdG8gZmlndXJlIG91dCB3aGljaCBmaWVsZHMgd2VyZSBhY3R1YWxseSBhZmZlY3RlZCBieSB0aGUgc2V0dGVyLlxuICAgIGNvbnN0IHNpZGVFZmZlY3RzID0gXy53aXRob3V0KHRoaXMuY2hhbmdlZCgpLCAuLi5jaGFuZ2VkQmVmb3JlKTtcbiAgICBjb25zdCBmaWVsZHMgPSBfLnVuaW9uKE9iamVjdC5rZXlzKHZhbHVlcyksIHNpZGVFZmZlY3RzKTtcblxuICAgIGlmICghb3B0aW9ucy5maWVsZHMpIHtcbiAgICAgIG9wdGlvbnMuZmllbGRzID0gXy5pbnRlcnNlY3Rpb24oZmllbGRzLCB0aGlzLmNoYW5nZWQoKSk7XG4gICAgICBvcHRpb25zLmRlZmF1bHRGaWVsZHMgPSBvcHRpb25zLmZpZWxkcztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zYXZlKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3kgdGhlIHJvdyBjb3JyZXNwb25kaW5nIHRvIHRoaXMgaW5zdGFuY2UuIERlcGVuZGluZyBvbiB5b3VyIHNldHRpbmcgZm9yIHBhcmFub2lkLCB0aGUgcm93IHdpbGwgZWl0aGVyIGJlIGNvbXBsZXRlbHkgZGVsZXRlZCwgb3IgaGF2ZSBpdHMgZGVsZXRlZEF0IHRpbWVzdGFtcCBzZXQgdG8gdGhlIGN1cnJlbnQgdGltZS5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgW29wdGlvbnM9e31dIGRlc3Ryb3kgb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICBbb3B0aW9ucy5mb3JjZT1mYWxzZV0gSWYgc2V0IHRvIHRydWUsIHBhcmFub2lkIG1vZGVscyB3aWxsIGFjdHVhbGx5IGJlIGRlbGV0ZWRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGRlc3Ryb3kob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGhvb2tzOiB0cnVlLFxuICAgICAgZm9yY2U6IGZhbHNlXG4gICAgfSwgb3B0aW9ucyk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xuICAgICAgLy8gUnVuIGJlZm9yZSBob29rXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5ydW5Ib29rcygnYmVmb3JlRGVzdHJveScsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3Qgd2hlcmUgPSB0aGlzLndoZXJlKHRydWUpO1xuXG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQgJiYgb3B0aW9ucy5mb3JjZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IHRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0O1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhdHRyaWJ1dGUsICdkZWZhdWx0VmFsdWUnKVxuICAgICAgICAgID8gYXR0cmlidXRlLmRlZmF1bHRWYWx1ZVxuICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gdGhpcy5nZXREYXRhVmFsdWUoYXR0cmlidXRlTmFtZSk7XG4gICAgICAgIGNvbnN0IHVuZGVmaW5lZE9yTnVsbCA9IGN1cnJlbnRWYWx1ZSA9PSBudWxsICYmIGRlZmF1bHRWYWx1ZSA9PSBudWxsO1xuICAgICAgICBpZiAodW5kZWZpbmVkT3JOdWxsIHx8IF8uaXNFcXVhbChjdXJyZW50VmFsdWUsIGRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgICAgICAvLyBvbmx5IHVwZGF0ZSB0aW1lc3RhbXAgaWYgaXQgd2Fzbid0IGFscmVhZHkgc2V0XG4gICAgICAgICAgdGhpcy5zZXREYXRhVmFsdWUoYXR0cmlidXRlTmFtZSwgbmV3IERhdGUoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5zYXZlKF8uZGVmYXVsdHMoeyBob29rczogZmFsc2UgfSwgb3B0aW9ucykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuUXVlcnlJbnRlcmZhY2UuZGVsZXRlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCB3aGVyZSwgT2JqZWN0LmFzc2lnbih7IHR5cGU6IFF1ZXJ5VHlwZXMuREVMRVRFLCBsaW1pdDogbnVsbCB9LCBvcHRpb25zKSk7XG4gICAgfSkudGFwKCgpID0+IHtcbiAgICAgIC8vIFJ1biBhZnRlciBob29rXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5ydW5Ib29rcygnYWZ0ZXJEZXN0cm95JywgdGhpcywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIG1ldGhvZCB0byBkZXRlcm1pbmUgaWYgYSBpbnN0YW5jZSBpcyBcInNvZnQgZGVsZXRlZFwiLiAgVGhpcyBpc1xuICAgKiBwYXJ0aWN1bGFybHkgdXNlZnVsIGlmIHRoZSBpbXBsZW1lbnRlciByZW5hbWVkIHRoZSBgZGVsZXRlZEF0YCBhdHRyaWJ1dGVcbiAgICogdG8gc29tZXRoaW5nIGRpZmZlcmVudC4gIFRoaXMgbWV0aG9kIHJlcXVpcmVzIGBwYXJhbm9pZGAgdG8gYmUgZW5hYmxlZC5cbiAgICpcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBpc1NvZnREZWxldGVkKCkge1xuICAgIGlmICghdGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTW9kZWwgaXMgbm90IHBhcmFub2lkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgZGVsZXRlZEF0QXR0cmlidXRlID0gdGhpcy5jb25zdHJ1Y3Rvci5yYXdBdHRyaWJ1dGVzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0XTtcbiAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGVsZXRlZEF0QXR0cmlidXRlLCAnZGVmYXVsdFZhbHVlJykgPyBkZWxldGVkQXRBdHRyaWJ1dGUuZGVmYXVsdFZhbHVlIDogbnVsbDtcbiAgICBjb25zdCBkZWxldGVkQXQgPSB0aGlzLmdldCh0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdCkgfHwgbnVsbDtcbiAgICBjb25zdCBpc1NldCA9IGRlbGV0ZWRBdCAhPT0gZGVmYXVsdFZhbHVlO1xuXG4gICAgcmV0dXJuIGlzU2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RvcmUgdGhlIHJvdyBjb3JyZXNwb25kaW5nIHRvIHRoaXMgaW5zdGFuY2UuIE9ubHkgYXZhaWxhYmxlIGZvciBwYXJhbm9pZCBtb2RlbHMuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIFtvcHRpb25zPXt9XSByZXN0b3JlIG9wdGlvbnNcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICByZXN0b3JlKG9wdGlvbnMpIHtcbiAgICBpZiAoIXRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0KSB0aHJvdyBuZXcgRXJyb3IoJ01vZGVsIGlzIG5vdCBwYXJhbm9pZCcpO1xuXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgaG9va3M6IHRydWUsXG4gICAgICBmb3JjZTogZmFsc2VcbiAgICB9LCBvcHRpb25zKTtcblxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XG4gICAgICAvLyBSdW4gYmVmb3JlIGhvb2tcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnJ1bkhvb2tzKCdiZWZvcmVSZXN0b3JlJywgdGhpcywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBkZWxldGVkQXRDb2wgPSB0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdDtcbiAgICAgIGNvbnN0IGRlbGV0ZWRBdEF0dHJpYnV0ZSA9IHRoaXMuY29uc3RydWN0b3IucmF3QXR0cmlidXRlc1tkZWxldGVkQXRDb2xdO1xuICAgICAgY29uc3QgZGVsZXRlZEF0RGVmYXVsdFZhbHVlID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRlbGV0ZWRBdEF0dHJpYnV0ZSwgJ2RlZmF1bHRWYWx1ZScpID8gZGVsZXRlZEF0QXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA6IG51bGw7XG5cbiAgICAgIHRoaXMuc2V0RGF0YVZhbHVlKGRlbGV0ZWRBdENvbCwgZGVsZXRlZEF0RGVmYXVsdFZhbHVlKTtcbiAgICAgIHJldHVybiB0aGlzLnNhdmUoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyBob29rczogZmFsc2UsIG9taXROdWxsOiBmYWxzZSB9KSk7XG4gICAgfSkudGFwKCgpID0+IHtcbiAgICAgIC8vIFJ1biBhZnRlciBob29rXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5ydW5Ib29rcygnYWZ0ZXJSZXN0b3JlJywgdGhpcywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5jcmVtZW50IHRoZSB2YWx1ZSBvZiBvbmUgb3IgbW9yZSBjb2x1bW5zLiBUaGlzIGlzIGRvbmUgaW4gdGhlIGRhdGFiYXNlLCB3aGljaCBtZWFucyBpdCBkb2VzIG5vdCB1c2UgdGhlIHZhbHVlcyBjdXJyZW50bHkgc3RvcmVkIG9uIHRoZSBJbnN0YW5jZS4gVGhlIGluY3JlbWVudCBpcyBkb25lIHVzaW5nIGFcbiAgICogYGBgc3FsXG4gICAqIFNFVCBjb2x1bW4gPSBjb2x1bW4gKyBYXG4gICAqIGBgYFxuICAgKiBxdWVyeS4gVGhlIHVwZGF0ZWQgaW5zdGFuY2Ugd2lsbCBiZSByZXR1cm5lZCBieSBkZWZhdWx0IGluIFBvc3RncmVzLiBIb3dldmVyLCBpbiBvdGhlciBkaWFsZWN0cywgeW91IHdpbGwgbmVlZCB0byBkbyBhIHJlbG9hZCB0byBnZXQgdGhlIG5ldyB2YWx1ZXMuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGluc3RhbmNlLmluY3JlbWVudCgnbnVtYmVyJykgLy8gaW5jcmVtZW50IG51bWJlciBieSAxXG4gICAqXG4gICAqIGluc3RhbmNlLmluY3JlbWVudChbJ251bWJlcicsICdjb3VudCddLCB7IGJ5OiAyIH0pIC8vIGluY3JlbWVudCBudW1iZXIgYW5kIGNvdW50IGJ5IDJcbiAgICpcbiAgICogLy8gaW5jcmVtZW50IGFuc3dlciBieSA0MiwgYW5kIHRyaWVzIGJ5IDEuXG4gICAqIC8vIGBieWAgaXMgaWdub3JlZCwgc2luY2UgZWFjaCBjb2x1bW4gaGFzIGl0cyBvd24gdmFsdWVcbiAgICogaW5zdGFuY2UuaW5jcmVtZW50KHsgYW5zd2VyOiA0MiwgdHJpZXM6IDF9LCB7IGJ5OiAyIH0pXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsI3JlbG9hZH1cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl8T2JqZWN0fSBmaWVsZHMgSWYgYSBzdHJpbmcgaXMgcHJvdmlkZWQsIHRoYXQgY29sdW1uIGlzIGluY3JlbWVudGVkIGJ5IHRoZSB2YWx1ZSBvZiBgYnlgIGdpdmVuIGluIG9wdGlvbnMuIElmIGFuIGFycmF5IGlzIHByb3ZpZGVkLCB0aGUgc2FtZSBpcyB0cnVlIGZvciBlYWNoIGNvbHVtbi4gSWYgYW5kIG9iamVjdCBpcyBwcm92aWRlZCwgZWFjaCBjb2x1bW4gaXMgaW5jcmVtZW50ZWQgYnkgdGhlIHZhbHVlIGdpdmVuLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIG9wdGlvbnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmJ5PTFdIFRoZSBudW1iZXIgdG8gaW5jcmVtZW50IGJ5XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc2lsZW50PWZhbHNlXSBJZiB0cnVlLCB0aGUgdXBkYXRlZEF0IHRpbWVzdGFtcCB3aWxsIG5vdCBiZSB1cGRhdGVkLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGlsZSBydW5uaW5nIHRoZSBxdWVyeSB0byBsb2cgdGhlIHNxbC5cbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJldHVybmluZz10cnVlXSBBcHBlbmQgUkVUVVJOSU5HICogdG8gZ2V0IGJhY2sgYXV0byBnZW5lcmF0ZWQgdmFsdWVzIChQb3N0Z3JlcyBvbmx5KVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbD59XG4gICAqIEBzaW5jZSA0LjAuMFxuICAgKi9cbiAgaW5jcmVtZW50KGZpZWxkcywgb3B0aW9ucykge1xuICAgIGNvbnN0IGlkZW50aWZpZXIgPSB0aGlzLndoZXJlKCk7XG5cbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xuICAgIG9wdGlvbnMud2hlcmUgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLndoZXJlLCBpZGVudGlmaWVyKTtcbiAgICBvcHRpb25zLmluc3RhbmNlID0gdGhpcztcblxuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmluY3JlbWVudChmaWVsZHMsIG9wdGlvbnMpLnJldHVybih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNyZW1lbnQgdGhlIHZhbHVlIG9mIG9uZSBvciBtb3JlIGNvbHVtbnMuIFRoaXMgaXMgZG9uZSBpbiB0aGUgZGF0YWJhc2UsIHdoaWNoIG1lYW5zIGl0IGRvZXMgbm90IHVzZSB0aGUgdmFsdWVzIGN1cnJlbnRseSBzdG9yZWQgb24gdGhlIEluc3RhbmNlLiBUaGUgZGVjcmVtZW50IGlzIGRvbmUgdXNpbmcgYVxuICAgKiBgYGBzcWxcbiAgICogU0VUIGNvbHVtbiA9IGNvbHVtbiAtIFhcbiAgICogYGBgXG4gICAqIHF1ZXJ5LiBUaGUgdXBkYXRlZCBpbnN0YW5jZSB3aWxsIGJlIHJldHVybmVkIGJ5IGRlZmF1bHQgaW4gUG9zdGdyZXMuIEhvd2V2ZXIsIGluIG90aGVyIGRpYWxlY3RzLCB5b3Ugd2lsbCBuZWVkIHRvIGRvIGEgcmVsb2FkIHRvIGdldCB0aGUgbmV3IHZhbHVlcy5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogaW5zdGFuY2UuZGVjcmVtZW50KCdudW1iZXInKSAvLyBkZWNyZW1lbnQgbnVtYmVyIGJ5IDFcbiAgICpcbiAgICogaW5zdGFuY2UuZGVjcmVtZW50KFsnbnVtYmVyJywgJ2NvdW50J10sIHsgYnk6IDIgfSkgLy8gZGVjcmVtZW50IG51bWJlciBhbmQgY291bnQgYnkgMlxuICAgKlxuICAgKiAvLyBkZWNyZW1lbnQgYW5zd2VyIGJ5IDQyLCBhbmQgdHJpZXMgYnkgMS5cbiAgICogLy8gYGJ5YCBpcyBpZ25vcmVkLCBzaW5jZSBlYWNoIGNvbHVtbiBoYXMgaXRzIG93biB2YWx1ZVxuICAgKiBpbnN0YW5jZS5kZWNyZW1lbnQoeyBhbnN3ZXI6IDQyLCB0cmllczogMX0sIHsgYnk6IDIgfSlcbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwjcmVsb2FkfVxuICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheXxPYmplY3R9IGZpZWxkcyBJZiBhIHN0cmluZyBpcyBwcm92aWRlZCwgdGhhdCBjb2x1bW4gaXMgZGVjcmVtZW50ZWQgYnkgdGhlIHZhbHVlIG9mIGBieWAgZ2l2ZW4gaW4gb3B0aW9ucy4gSWYgYW4gYXJyYXkgaXMgcHJvdmlkZWQsIHRoZSBzYW1lIGlzIHRydWUgZm9yIGVhY2ggY29sdW1uLiBJZiBhbmQgb2JqZWN0IGlzIHByb3ZpZGVkLCBlYWNoIGNvbHVtbiBpcyBkZWNyZW1lbnRlZCBieSB0aGUgdmFsdWUgZ2l2ZW5cbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgW29wdGlvbnNdIGRlY3JlbWVudCBvcHRpb25zXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICAgIFtvcHRpb25zLmJ5PTFdIFRoZSBudW1iZXIgdG8gZGVjcmVtZW50IGJ5XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgIFtvcHRpb25zLnNpbGVudD1mYWxzZV0gSWYgdHJ1ZSwgdGhlIHVwZGF0ZWRBdCB0aW1lc3RhbXAgd2lsbCBub3QgYmUgdXBkYXRlZC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICBbb3B0aW9ucy5yZXR1cm5pbmc9dHJ1ZV0gQXBwZW5kIFJFVFVSTklORyAqIHRvIGdldCBiYWNrIGF1dG8gZ2VuZXJhdGVkIHZhbHVlcyAoUG9zdGdyZXMgb25seSlcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBkZWNyZW1lbnQoZmllbGRzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IF8uZGVmYXVsdHMoeyBpbmNyZW1lbnQ6IGZhbHNlIH0sIG9wdGlvbnMsIHtcbiAgICAgIGJ5OiAxXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5pbmNyZW1lbnQoZmllbGRzLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoaXMgYW5kIGBvdGhlcmAgSW5zdGFuY2UgcmVmZXIgdG8gdGhlIHNhbWUgcm93XG4gICAqXG4gICAqIEBwYXJhbSB7TW9kZWx9IG90aGVyIE90aGVyIGluc3RhbmNlIHRvIGNvbXBhcmUgYWdhaW5zdFxuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGVxdWFscyhvdGhlcikge1xuICAgIGlmICghb3RoZXIgfHwgIW90aGVyLmNvbnN0cnVjdG9yKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiB0aGlzLmNvbnN0cnVjdG9yKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnByaW1hcnlLZXlBdHRyaWJ1dGVzLmV2ZXJ5KGF0dHJpYnV0ZSA9PiB0aGlzLmdldChhdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pID09PSBvdGhlci5nZXQoYXR0cmlidXRlLCB7IHJhdzogdHJ1ZSB9KSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhpcyBpcyBlcXVhbCB0byBvbmUgb2YgYG90aGVyc2AgYnkgY2FsbGluZyBlcXVhbHNcbiAgICpcbiAgICogQHBhcmFtIHtBcnJheTxNb2RlbD59IG90aGVycyBBbiBhcnJheSBvZiBpbnN0YW5jZXMgdG8gY2hlY2sgYWdhaW5zdFxuICAgKlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICovXG4gIGVxdWFsc09uZU9mKG90aGVycykge1xuICAgIHJldHVybiBvdGhlcnMuc29tZShvdGhlciA9PiB0aGlzLmVxdWFscyhvdGhlcikpO1xuICB9XG5cbiAgc2V0VmFsaWRhdG9ycyhhdHRyaWJ1dGUsIHZhbGlkYXRvcnMpIHtcbiAgICB0aGlzLnZhbGlkYXRvcnNbYXR0cmlidXRlXSA9IHZhbGlkYXRvcnM7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCB0aGUgaW5zdGFuY2UgdG8gYSBKU09OIHJlcHJlc2VudGF0aW9uLlxuICAgKiBQcm94aWVzIHRvIGNhbGxpbmcgYGdldGAgd2l0aCBubyBrZXlzLlxuICAgKiBUaGlzIG1lYW5zIGdldCBhbGwgdmFsdWVzIGdvdHRlbiBmcm9tIHRoZSBEQiwgYW5kIGFwcGx5IGFsbCBjdXN0b20gZ2V0dGVycy5cbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwjZ2V0fVxuICAgKlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiBfLmNsb25lRGVlcChcbiAgICAgIHRoaXMuZ2V0KHtcbiAgICAgICAgcGxhaW46IHRydWVcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgMTptIGFzc29jaWF0aW9uIGJldHdlZW4gdGhpcyAodGhlIHNvdXJjZSkgYW5kIHRoZSBwcm92aWRlZCB0YXJnZXQuXG4gICAqIFRoZSBmb3JlaWduIGtleSBpcyBhZGRlZCBvbiB0aGUgdGFyZ2V0LlxuICAgKlxuICAgKiBAcGFyYW0ge01vZGVsfSAgICAgICAgICAgICAgIHRhcmdldCBUYXJnZXQgbW9kZWxcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgICAgICBbb3B0aW9uc10gaGFzTWFueSBhc3NvY2lhdGlvbiBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgW29wdGlvbnMuaG9va3M9ZmFsc2VdIFNldCB0byB0cnVlIHRvIHJ1biBiZWZvcmUtL2FmdGVyRGVzdHJveSBob29rcyB3aGVuIGFuIGFzc29jaWF0ZWQgbW9kZWwgaXMgZGVsZXRlZCBiZWNhdXNlIG9mIGEgY2FzY2FkZS4gRm9yIGV4YW1wbGUgaWYgYFVzZXIuaGFzT25lKFByb2ZpbGUsIHtvbkRlbGV0ZTogJ2Nhc2NhZGUnLCBob29rczp0cnVlfSlgLCB0aGUgYmVmb3JlLS9hZnRlckRlc3Ryb3kgaG9va3MgZm9yIHByb2ZpbGUgd2lsbCBiZSBjYWxsZWQgd2hlbiBhIHVzZXIgaXMgZGVsZXRlZC4gT3RoZXJ3aXNlIHRoZSBwcm9maWxlIHdpbGwgYmUgZGVsZXRlZCB3aXRob3V0IGludm9raW5nIGFueSBob29rc1xuICAgKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9ICAgICAgIFtvcHRpb25zLmFzXSBUaGUgYWxpYXMgb2YgdGhpcyBtb2RlbC4gSWYgeW91IHByb3ZpZGUgYSBzdHJpbmcsIGl0IHNob3VsZCBiZSBwbHVyYWwsIGFuZCB3aWxsIGJlIHNpbmd1bGFyaXplZCB1c2luZyBub2RlLmluZmxlY3Rpb24uIElmIHlvdSB3YW50IHRvIGNvbnRyb2wgdGhlIHNpbmd1bGFyIHZlcnNpb24geW91cnNlbGYsIHByb3ZpZGUgYW4gb2JqZWN0IHdpdGggYHBsdXJhbGAgYW5kIGBzaW5ndWxhcmAga2V5cy4gU2VlIGFsc28gdGhlIGBuYW1lYCBvcHRpb24gcGFzc2VkIHRvIGBzZXF1ZWxpemUuZGVmaW5lYC4gSWYgeW91IGNyZWF0ZSBtdWx0aXBsZSBhc3NvY2lhdGlvbnMgYmV0d2VlbiB0aGUgc2FtZSB0YWJsZXMsIHlvdSBzaG91bGQgcHJvdmlkZSBhbiBhbGlhcyB0byBiZSBhYmxlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gdGhlbS4gSWYgeW91IHByb3ZpZGUgYW4gYWxpYXMgd2hlbiBjcmVhdGluZyB0aGUgYXNzb2NpYXRpb24sIHlvdSBzaG91bGQgcHJvdmlkZSB0aGUgc2FtZSBhbGlhcyB3aGVuIGVhZ2VyIGxvYWRpbmcgYW5kIHdoZW4gZ2V0dGluZyBhc3NvY2lhdGVkIG1vZGVscy4gRGVmYXVsdHMgdG8gdGhlIHBsdXJhbGl6ZWQgbmFtZSBvZiB0YXJnZXRcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSAgICAgICBbb3B0aW9ucy5mb3JlaWduS2V5XSBUaGUgbmFtZSBvZiB0aGUgZm9yZWlnbiBrZXkgaW4gdGhlIHRhcmdldCB0YWJsZSBvciBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSB0eXBlIGRlZmluaXRpb24gZm9yIHRoZSBmb3JlaWduIGNvbHVtbiAoc2VlIGBTZXF1ZWxpemUuZGVmaW5lYCBmb3Igc3ludGF4KS4gV2hlbiB1c2luZyBhbiBvYmplY3QsIHlvdSBjYW4gYWRkIGEgYG5hbWVgIHByb3BlcnR5IHRvIHNldCB0aGUgbmFtZSBvZiB0aGUgY29sdW1uLiBEZWZhdWx0cyB0byB0aGUgbmFtZSBvZiBzb3VyY2UgKyBwcmltYXJ5IGtleSBvZiBzb3VyY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICBbb3B0aW9ucy5zb3VyY2VLZXldIFRoZSBuYW1lIG9mIHRoZSBmaWVsZCB0byB1c2UgYXMgdGhlIGtleSBmb3IgdGhlIGFzc29jaWF0aW9uIGluIHRoZSBzb3VyY2UgdGFibGUuIERlZmF1bHRzIHRvIHRoZSBwcmltYXJ5IGtleSBvZiB0aGUgc291cmNlIHRhYmxlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgW29wdGlvbnMuc2NvcGVdIEEga2V5L3ZhbHVlIHNldCB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgYXNzb2NpYXRpb24gY3JlYXRlIGFuZCBmaW5kIGRlZmF1bHRzIG9uIHRoZSB0YXJnZXQuIChzcWxpdGUgbm90IHN1cHBvcnRlZCBmb3IgTjpNKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgIFtvcHRpb25zLm9uRGVsZXRlPSdTRVQmbmJzcDtOVUxMfENBU0NBREUnXSBTRVQgTlVMTCBpZiBmb3JlaWduS2V5IGFsbG93cyBudWxscywgQ0FTQ0FERSBpZiBvdGhlcndpc2VcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICBbb3B0aW9ucy5vblVwZGF0ZT0nQ0FTQ0FERSddIFNldCBgT04gVVBEQVRFYFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgIFtvcHRpb25zLmNvbnN0cmFpbnRzPXRydWVdIFNob3VsZCBvbiB1cGRhdGUgYW5kIG9uIGRlbGV0ZSBjb25zdHJhaW50cyBiZSBlbmFibGVkIG9uIHRoZSBmb3JlaWduIGtleS5cbiAgICpcbiAgICogQHJldHVybnMge0hhc01hbnl9XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIFVzZXIuaGFzTWFueShQcm9maWxlKSAvLyBUaGlzIHdpbGwgYWRkIHVzZXJJZCB0byB0aGUgcHJvZmlsZSB0YWJsZVxuICAgKi9cbiAgc3RhdGljIGhhc01hbnkodGFyZ2V0LCBvcHRpb25zKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiBOOk0gYXNzb2NpYXRpb24gd2l0aCBhIGpvaW4gdGFibGUuIERlZmluaW5nIGB0aHJvdWdoYCBpcyByZXF1aXJlZC5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gICAgICAgICAgICAgICB0YXJnZXQgVGFyZ2V0IG1vZGVsXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgb3B0aW9ucyBiZWxvbmdzVG9NYW55IGFzc29jaWF0aW9uIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICBbb3B0aW9ucy5ob29rcz1mYWxzZV0gU2V0IHRvIHRydWUgdG8gcnVuIGJlZm9yZS0vYWZ0ZXJEZXN0cm95IGhvb2tzIHdoZW4gYW4gYXNzb2NpYXRlZCBtb2RlbCBpcyBkZWxldGVkIGJlY2F1c2Ugb2YgYSBjYXNjYWRlLiBGb3IgZXhhbXBsZSBpZiBgVXNlci5oYXNPbmUoUHJvZmlsZSwge29uRGVsZXRlOiAnY2FzY2FkZScsIGhvb2tzOnRydWV9KWAsIHRoZSBiZWZvcmUtL2FmdGVyRGVzdHJveSBob29rcyBmb3IgcHJvZmlsZSB3aWxsIGJlIGNhbGxlZCB3aGVuIGEgdXNlciBpcyBkZWxldGVkLiBPdGhlcndpc2UgdGhlIHByb2ZpbGUgd2lsbCBiZSBkZWxldGVkIHdpdGhvdXQgaW52b2tpbmcgYW55IGhvb2tzXG4gICAqIEBwYXJhbSB7TW9kZWx8c3RyaW5nfE9iamVjdH0gb3B0aW9ucy50aHJvdWdoIFRoZSBuYW1lIG9mIHRoZSB0YWJsZSB0aGF0IGlzIHVzZWQgdG8gam9pbiBzb3VyY2UgYW5kIHRhcmdldCBpbiBuOm0gYXNzb2NpYXRpb25zLiBDYW4gYWxzbyBiZSBhIHNlcXVlbGl6ZSBtb2RlbCBpZiB5b3Ugd2FudCB0byBkZWZpbmUgdGhlIGp1bmN0aW9uIHRhYmxlIHlvdXJzZWxmIGFuZCBhZGQgZXh0cmEgYXR0cmlidXRlcyB0byBpdC5cbiAgICogQHBhcmFtIHtNb2RlbH0gICAgICAgICAgICAgICBbb3B0aW9ucy50aHJvdWdoLm1vZGVsXSBUaGUgbW9kZWwgdXNlZCB0byBqb2luIGJvdGggc2lkZXMgb2YgdGhlIE46TSBhc3NvY2lhdGlvbi5cbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgICAgICBbb3B0aW9ucy50aHJvdWdoLnNjb3BlXSBBIGtleS92YWx1ZSBzZXQgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIGFzc29jaWF0aW9uIGNyZWF0ZSBhbmQgZmluZCBkZWZhdWx0cyBvbiB0aGUgdGhyb3VnaCBtb2RlbC4gKFJlbWVtYmVyIHRvIGFkZCB0aGUgYXR0cmlidXRlcyB0byB0aGUgdGhyb3VnaCBtb2RlbClcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICBbb3B0aW9ucy50aHJvdWdoLnVuaXF1ZT10cnVlXSBJZiB0cnVlIGEgdW5pcXVlIGtleSB3aWxsIGJlIGdlbmVyYXRlZCBmcm9tIHRoZSBmb3JlaWduIGtleXMgdXNlZCAobWlnaHQgd2FudCB0byB0dXJuIHRoaXMgb2ZmIGFuZCBjcmVhdGUgc3BlY2lmaWMgdW5pcXVlIGtleXMgd2hlbiB1c2luZyBzY29wZXMpXG4gICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gICAgICAgW29wdGlvbnMuYXNdIFRoZSBhbGlhcyBvZiB0aGlzIGFzc29jaWF0aW9uLiBJZiB5b3UgcHJvdmlkZSBhIHN0cmluZywgaXQgc2hvdWxkIGJlIHBsdXJhbCwgYW5kIHdpbGwgYmUgc2luZ3VsYXJpemVkIHVzaW5nIG5vZGUuaW5mbGVjdGlvbi4gSWYgeW91IHdhbnQgdG8gY29udHJvbCB0aGUgc2luZ3VsYXIgdmVyc2lvbiB5b3Vyc2VsZiwgcHJvdmlkZSBhbiBvYmplY3Qgd2l0aCBgcGx1cmFsYCBhbmQgYHNpbmd1bGFyYCBrZXlzLiBTZWUgYWxzbyB0aGUgYG5hbWVgIG9wdGlvbiBwYXNzZWQgdG8gYHNlcXVlbGl6ZS5kZWZpbmVgLiBJZiB5b3UgY3JlYXRlIG11bHRpcGxlIGFzc29jaWF0aW9ucyBiZXR3ZWVuIHRoZSBzYW1lIHRhYmxlcywgeW91IHNob3VsZCBwcm92aWRlIGFuIGFsaWFzIHRvIGJlIGFibGUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiB0aGVtLiBJZiB5b3UgcHJvdmlkZSBhbiBhbGlhcyB3aGVuIGNyZWF0aW5nIHRoZSBhc3NvY2lhdGlvbiwgeW91IHNob3VsZCBwcm92aWRlIHRoZSBzYW1lIGFsaWFzIHdoZW4gZWFnZXIgbG9hZGluZyBhbmQgd2hlbiBnZXR0aW5nIGFzc29jaWF0ZWQgbW9kZWxzLiBEZWZhdWx0cyB0byB0aGUgcGx1cmFsaXplZCBuYW1lIG9mIHRhcmdldFxuICAgKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9ICAgICAgIFtvcHRpb25zLmZvcmVpZ25LZXldIFRoZSBuYW1lIG9mIHRoZSBmb3JlaWduIGtleSBpbiB0aGUgam9pbiB0YWJsZSAocmVwcmVzZW50aW5nIHRoZSBzb3VyY2UgbW9kZWwpIG9yIGFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHR5cGUgZGVmaW5pdGlvbiBmb3IgdGhlIGZvcmVpZ24gY29sdW1uIChzZWUgYFNlcXVlbGl6ZS5kZWZpbmVgIGZvciBzeW50YXgpLiBXaGVuIHVzaW5nIGFuIG9iamVjdCwgeW91IGNhbiBhZGQgYSBgbmFtZWAgcHJvcGVydHkgdG8gc2V0IHRoZSBuYW1lIG9mIHRoZSBjb2x1bW4uIERlZmF1bHRzIHRvIHRoZSBuYW1lIG9mIHNvdXJjZSArIHByaW1hcnkga2V5IG9mIHNvdXJjZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9ICAgICAgIFtvcHRpb25zLm90aGVyS2V5XSBUaGUgbmFtZSBvZiB0aGUgZm9yZWlnbiBrZXkgaW4gdGhlIGpvaW4gdGFibGUgKHJlcHJlc2VudGluZyB0aGUgdGFyZ2V0IG1vZGVsKSBvciBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSB0eXBlIGRlZmluaXRpb24gZm9yIHRoZSBvdGhlciBjb2x1bW4gKHNlZSBgU2VxdWVsaXplLmRlZmluZWAgZm9yIHN5bnRheCkuIFdoZW4gdXNpbmcgYW4gb2JqZWN0LCB5b3UgY2FuIGFkZCBhIGBuYW1lYCBwcm9wZXJ0eSB0byBzZXQgdGhlIG5hbWUgb2YgdGhlIGNvbHVtbi4gRGVmYXVsdHMgdG8gdGhlIG5hbWUgb2YgdGFyZ2V0ICsgcHJpbWFyeSBrZXkgb2YgdGFyZ2V0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgW29wdGlvbnMuc2NvcGVdIEEga2V5L3ZhbHVlIHNldCB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgYXNzb2NpYXRpb24gY3JlYXRlIGFuZCBmaW5kIGRlZmF1bHRzIG9uIHRoZSB0YXJnZXQuIChzcWxpdGUgbm90IHN1cHBvcnRlZCBmb3IgTjpNKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgIFtvcHRpb25zLnRpbWVzdGFtcHM9c2VxdWVsaXplLm9wdGlvbnMudGltZXN0YW1wc10gU2hvdWxkIHRoZSBqb2luIG1vZGVsIGhhdmUgdGltZXN0YW1wc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgIFtvcHRpb25zLm9uRGVsZXRlPSdTRVQmbmJzcDtOVUxMfENBU0NBREUnXSBDYXNjYWRlIGlmIHRoaXMgaXMgYSBuOm0sIGFuZCBzZXQgbnVsbCBpZiBpdCBpcyBhIDE6bVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgIFtvcHRpb25zLm9uVXBkYXRlPSdDQVNDQURFJ10gU2V0cyBgT04gVVBEQVRFYFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgIFtvcHRpb25zLmNvbnN0cmFpbnRzPXRydWVdIFNob3VsZCBvbiB1cGRhdGUgYW5kIG9uIGRlbGV0ZSBjb25zdHJhaW50cyBiZSBlbmFibGVkIG9uIHRoZSBmb3JlaWduIGtleS5cbiAgICpcbiAgICogQHJldHVybnMge0JlbG9uZ3NUb01hbnl9XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIEF1dG9tYWdpY2FsbHkgZ2VuZXJhdGVkIGpvaW4gbW9kZWxcbiAgICogVXNlci5iZWxvbmdzVG9NYW55KFByb2plY3QsIHsgdGhyb3VnaDogJ1VzZXJQcm9qZWN0cycgfSlcbiAgICogUHJvamVjdC5iZWxvbmdzVG9NYW55KFVzZXIsIHsgdGhyb3VnaDogJ1VzZXJQcm9qZWN0cycgfSlcbiAgICpcbiAgICogLy8gSm9pbiBtb2RlbCB3aXRoIGFkZGl0aW9uYWwgYXR0cmlidXRlc1xuICAgKiBjb25zdCBVc2VyUHJvamVjdHMgPSBzZXF1ZWxpemUuZGVmaW5lKCdVc2VyUHJvamVjdHMnLCB7XG4gICAqICAgc3RhcnRlZDogU2VxdWVsaXplLkJPT0xFQU5cbiAgICogfSlcbiAgICogVXNlci5iZWxvbmdzVG9NYW55KFByb2plY3QsIHsgdGhyb3VnaDogVXNlclByb2plY3RzIH0pXG4gICAqIFByb2plY3QuYmVsb25nc1RvTWFueShVc2VyLCB7IHRocm91Z2g6IFVzZXJQcm9qZWN0cyB9KVxuICAgKi9cbiAgc3RhdGljIGJlbG9uZ3NUb01hbnkodGFyZ2V0LCBvcHRpb25zKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYXNzb2NpYXRpb24gYmV0d2VlbiB0aGlzICh0aGUgc291cmNlKSBhbmQgdGhlIHByb3ZpZGVkIHRhcmdldC4gVGhlIGZvcmVpZ24ga2V5IGlzIGFkZGVkIG9uIHRoZSB0YXJnZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9kZWx9ICAgICAgICAgICB0YXJnZXQgVGFyZ2V0IG1vZGVsXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICBbb3B0aW9uc10gaGFzT25lIGFzc29jaWF0aW9uIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgIFtvcHRpb25zLmhvb2tzPWZhbHNlXSBTZXQgdG8gdHJ1ZSB0byBydW4gYmVmb3JlLS9hZnRlckRlc3Ryb3kgaG9va3Mgd2hlbiBhbiBhc3NvY2lhdGVkIG1vZGVsIGlzIGRlbGV0ZWQgYmVjYXVzZSBvZiBhIGNhc2NhZGUuIEZvciBleGFtcGxlIGlmIGBVc2VyLmhhc09uZShQcm9maWxlLCB7b25EZWxldGU6ICdjYXNjYWRlJywgaG9va3M6dHJ1ZX0pYCwgdGhlIGJlZm9yZS0vYWZ0ZXJEZXN0cm95IGhvb2tzIGZvciBwcm9maWxlIHdpbGwgYmUgY2FsbGVkIHdoZW4gYSB1c2VyIGlzIGRlbGV0ZWQuIE90aGVyd2lzZSB0aGUgcHJvZmlsZSB3aWxsIGJlIGRlbGV0ZWQgd2l0aG91dCBpbnZva2luZyBhbnkgaG9va3NcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIFtvcHRpb25zLmFzXSBUaGUgYWxpYXMgb2YgdGhpcyBtb2RlbCwgaW4gc2luZ3VsYXIgZm9ybS4gU2VlIGFsc28gdGhlIGBuYW1lYCBvcHRpb24gcGFzc2VkIHRvIGBzZXF1ZWxpemUuZGVmaW5lYC4gSWYgeW91IGNyZWF0ZSBtdWx0aXBsZSBhc3NvY2lhdGlvbnMgYmV0d2VlbiB0aGUgc2FtZSB0YWJsZXMsIHlvdSBzaG91bGQgcHJvdmlkZSBhbiBhbGlhcyB0byBiZSBhYmxlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gdGhlbS4gSWYgeW91IHByb3ZpZGUgYW4gYWxpYXMgd2hlbiBjcmVhdGluZyB0aGUgYXNzb2NpYXRpb24sIHlvdSBzaG91bGQgcHJvdmlkZSB0aGUgc2FtZSBhbGlhcyB3aGVuIGVhZ2VyIGxvYWRpbmcgYW5kIHdoZW4gZ2V0dGluZyBhc3NvY2lhdGVkIG1vZGVscy4gRGVmYXVsdHMgdG8gdGhlIHNpbmd1bGFyaXplZCBuYW1lIG9mIHRhcmdldFxuICAgKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9ICAgW29wdGlvbnMuZm9yZWlnbktleV0gVGhlIG5hbWUgb2YgdGhlIGZvcmVpZ24ga2V5IGF0dHJpYnV0ZSBpbiB0aGUgdGFyZ2V0IG1vZGVsIG9yIGFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHR5cGUgZGVmaW5pdGlvbiBmb3IgdGhlIGZvcmVpZ24gY29sdW1uIChzZWUgYFNlcXVlbGl6ZS5kZWZpbmVgIGZvciBzeW50YXgpLiBXaGVuIHVzaW5nIGFuIG9iamVjdCwgeW91IGNhbiBhZGQgYSBgbmFtZWAgcHJvcGVydHkgdG8gc2V0IHRoZSBuYW1lIG9mIHRoZSBjb2x1bW4uIERlZmF1bHRzIHRvIHRoZSBuYW1lIG9mIHNvdXJjZSArIHByaW1hcnkga2V5IG9mIHNvdXJjZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMuc291cmNlS2V5XSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIHVzZSBhcyB0aGUga2V5IGZvciB0aGUgYXNzb2NpYXRpb24gaW4gdGhlIHNvdXJjZSB0YWJsZS4gRGVmYXVsdHMgdG8gdGhlIHByaW1hcnkga2V5IG9mIHRoZSBzb3VyY2UgdGFibGVcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIFtvcHRpb25zLm9uRGVsZXRlPSdTRVQmbmJzcDtOVUxMfENBU0NBREUnXSBTRVQgTlVMTCBpZiBmb3JlaWduS2V5IGFsbG93cyBudWxscywgQ0FTQ0FERSBpZiBvdGhlcndpc2VcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIFtvcHRpb25zLm9uVXBkYXRlPSdDQVNDQURFJ10gU2V0cyAnT04gVVBEQVRFJ1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMuY29uc3RyYWludHM9dHJ1ZV0gU2hvdWxkIG9uIHVwZGF0ZSBhbmQgb24gZGVsZXRlIGNvbnN0cmFpbnRzIGJlIGVuYWJsZWQgb24gdGhlIGZvcmVpZ24ga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMudW5pcXVlS2V5XSBUaGUgY3VzdG9tIG5hbWUgZm9yIHVuaXF1ZSBjb25zdHJhaW50LlxuICAgKlxuICAgKiBAcmV0dXJucyB7SGFzT25lfVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBVc2VyLmhhc09uZShQcm9maWxlKSAvLyBUaGlzIHdpbGwgYWRkIHVzZXJJZCB0byB0aGUgcHJvZmlsZSB0YWJsZVxuICAgKi9cbiAgc3RhdGljIGhhc09uZSh0YXJnZXQsIG9wdGlvbnMpIHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBhc3NvY2lhdGlvbiBiZXR3ZWVuIHRoaXMgKHRoZSBzb3VyY2UpIGFuZCB0aGUgcHJvdmlkZWQgdGFyZ2V0LiBUaGUgZm9yZWlnbiBrZXkgaXMgYWRkZWQgb24gdGhlIHNvdXJjZS5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gICAgICAgICAgIHRhcmdldCBUaGUgdGFyZ2V0IG1vZGVsXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICBbb3B0aW9uc10gYmVsb25nc1RvIGFzc29jaWF0aW9uIG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgIFtvcHRpb25zLmhvb2tzPWZhbHNlXSBTZXQgdG8gdHJ1ZSB0byBydW4gYmVmb3JlLS9hZnRlckRlc3Ryb3kgaG9va3Mgd2hlbiBhbiBhc3NvY2lhdGVkIG1vZGVsIGlzIGRlbGV0ZWQgYmVjYXVzZSBvZiBhIGNhc2NhZGUuIEZvciBleGFtcGxlIGlmIGBVc2VyLmhhc09uZShQcm9maWxlLCB7b25EZWxldGU6ICdjYXNjYWRlJywgaG9va3M6dHJ1ZX0pYCwgdGhlIGJlZm9yZS0vYWZ0ZXJEZXN0cm95IGhvb2tzIGZvciBwcm9maWxlIHdpbGwgYmUgY2FsbGVkIHdoZW4gYSB1c2VyIGlzIGRlbGV0ZWQuIE90aGVyd2lzZSB0aGUgcHJvZmlsZSB3aWxsIGJlIGRlbGV0ZWQgd2l0aG91dCBpbnZva2luZyBhbnkgaG9va3NcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIFtvcHRpb25zLmFzXSBUaGUgYWxpYXMgb2YgdGhpcyBtb2RlbCwgaW4gc2luZ3VsYXIgZm9ybS4gU2VlIGFsc28gdGhlIGBuYW1lYCBvcHRpb24gcGFzc2VkIHRvIGBzZXF1ZWxpemUuZGVmaW5lYC4gSWYgeW91IGNyZWF0ZSBtdWx0aXBsZSBhc3NvY2lhdGlvbnMgYmV0d2VlbiB0aGUgc2FtZSB0YWJsZXMsIHlvdSBzaG91bGQgcHJvdmlkZSBhbiBhbGlhcyB0byBiZSBhYmxlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gdGhlbS4gSWYgeW91IHByb3ZpZGUgYW4gYWxpYXMgd2hlbiBjcmVhdGluZyB0aGUgYXNzb2NpYXRpb24sIHlvdSBzaG91bGQgcHJvdmlkZSB0aGUgc2FtZSBhbGlhcyB3aGVuIGVhZ2VyIGxvYWRpbmcgYW5kIHdoZW4gZ2V0dGluZyBhc3NvY2lhdGVkIG1vZGVscy4gRGVmYXVsdHMgdG8gdGhlIHNpbmd1bGFyaXplZCBuYW1lIG9mIHRhcmdldFxuICAgKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9ICAgW29wdGlvbnMuZm9yZWlnbktleV0gVGhlIG5hbWUgb2YgdGhlIGZvcmVpZ24ga2V5IGF0dHJpYnV0ZSBpbiB0aGUgc291cmNlIHRhYmxlIG9yIGFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHR5cGUgZGVmaW5pdGlvbiBmb3IgdGhlIGZvcmVpZ24gY29sdW1uIChzZWUgYFNlcXVlbGl6ZS5kZWZpbmVgIGZvciBzeW50YXgpLiBXaGVuIHVzaW5nIGFuIG9iamVjdCwgeW91IGNhbiBhZGQgYSBgbmFtZWAgcHJvcGVydHkgdG8gc2V0IHRoZSBuYW1lIG9mIHRoZSBjb2x1bW4uIERlZmF1bHRzIHRvIHRoZSBuYW1lIG9mIHRhcmdldCArIHByaW1hcnkga2V5IG9mIHRhcmdldFxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMudGFyZ2V0S2V5XSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIHVzZSBhcyB0aGUga2V5IGZvciB0aGUgYXNzb2NpYXRpb24gaW4gdGhlIHRhcmdldCB0YWJsZS4gRGVmYXVsdHMgdG8gdGhlIHByaW1hcnkga2V5IG9mIHRoZSB0YXJnZXQgdGFibGVcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIFtvcHRpb25zLm9uRGVsZXRlPSdTRVQmbmJzcDtOVUxMfE5PJm5ic3A7QUNUSU9OJ10gU0VUIE5VTEwgaWYgZm9yZWlnbktleSBhbGxvd3MgbnVsbHMsIE5PIEFDVElPTiBpZiBvdGhlcndpc2VcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIFtvcHRpb25zLm9uVXBkYXRlPSdDQVNDQURFJ10gU2V0cyAnT04gVVBEQVRFJ1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMuY29uc3RyYWludHM9dHJ1ZV0gU2hvdWxkIG9uIHVwZGF0ZSBhbmQgb24gZGVsZXRlIGNvbnN0cmFpbnRzIGJlIGVuYWJsZWQgb24gdGhlIGZvcmVpZ24ga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyB7QmVsb25nc1RvfVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBQcm9maWxlLmJlbG9uZ3NUbyhVc2VyKSAvLyBUaGlzIHdpbGwgYWRkIHVzZXJJZCB0byB0aGUgcHJvZmlsZSB0YWJsZVxuICAgKi9cbiAgc3RhdGljIGJlbG9uZ3NUbyh0YXJnZXQsIG9wdGlvbnMpIHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbn1cblxuT2JqZWN0LmFzc2lnbihNb2RlbCwgYXNzb2NpYXRpb25zTWl4aW4pO1xuSG9va3MuYXBwbHlUbyhNb2RlbCwgdHJ1ZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XG4iXX0=