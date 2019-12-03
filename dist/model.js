'use strict';

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

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

let Model =
/*#__PURE__*/
function () {
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
      const clone =
      /*#__PURE__*/
      function (_this) {
        _inherits(clone, _this);

        function clone() {
          _classCallCheck(this, clone);

          return _possibleConstructorReturn(this, _getPrototypeOf(clone).apply(this, arguments));
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
      const self =
      /*#__PURE__*/
      function (_this2) {
        _inherits(self, _this2);

        function self() {
          _classCallCheck(this, self);

          return _possibleConstructorReturn(this, _getPrototypeOf(self).apply(this, arguments));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9tb2RlbC5qcyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiXyIsIkRvdHRpZSIsIlV0aWxzIiwibG9nZ2VyIiwiQmVsb25nc1RvIiwiQmVsb25nc1RvTWFueSIsIkluc3RhbmNlVmFsaWRhdG9yIiwiUXVlcnlUeXBlcyIsInNlcXVlbGl6ZUVycm9ycyIsIlByb21pc2UiLCJBc3NvY2lhdGlvbiIsIkhhc01hbnkiLCJEYXRhVHlwZXMiLCJIb29rcyIsImFzc29jaWF0aW9uc01peGluIiwiT3AiLCJub0RvdWJsZU5lc3RlZEdyb3VwIiwidmFsaWRRdWVyeUtleXdvcmRzIiwiU2V0Iiwibm9uQ2FzY2FkaW5nT3B0aW9ucyIsIk1vZGVsIiwiY29uc3RydWN0b3IiLCJzZXF1ZWxpemUiLCJnZXRRdWVyeUludGVyZmFjZSIsIlF1ZXJ5SW50ZXJmYWNlIiwiUXVlcnlHZW5lcmF0b3IiLCJ2YWx1ZXMiLCJvcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiaXNOZXdSZWNvcmQiLCJfc2NoZW1hIiwiX3NjaGVtYURlbGltaXRlciIsImF0dHJpYnV0ZXMiLCJtYXAiLCJhdHRyaWJ1dGUiLCJBcnJheSIsImlzQXJyYXkiLCJpbmNsdWRlVmFsaWRhdGVkIiwiX2NvbmZvcm1JbmNsdWRlcyIsImluY2x1ZGUiLCJfZXhwYW5kSW5jbHVkZUFsbCIsIl92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudHMiLCJkYXRhVmFsdWVzIiwiX3ByZXZpb3VzRGF0YVZhbHVlcyIsIl9jaGFuZ2VkIiwiX21vZGVsT3B0aW9ucyIsIl9vcHRpb25zIiwiX2luaXRWYWx1ZXMiLCJkZWZhdWx0cyIsImtleSIsImNsb25lIiwiX2hhc0RlZmF1bHRWYWx1ZXMiLCJtYXBWYWx1ZXMiLCJfZGVmYXVsdFZhbHVlcyIsInZhbHVlRm4iLCJ2YWx1ZSIsIlNlcXVlbGl6ZU1ldGhvZCIsImNsb25lRGVlcCIsInByaW1hcnlLZXlBdHRyaWJ1dGVzIiwibGVuZ3RoIiwiZm9yRWFjaCIsInByaW1hcnlLZXlBdHRyaWJ1dGUiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJfdGltZXN0YW1wQXR0cmlidXRlcyIsImNyZWF0ZWRBdCIsInRvRGVmYXVsdFZhbHVlIiwiZGlhbGVjdCIsInVwZGF0ZWRBdCIsImRlbGV0ZWRBdCIsImtleXMiLCJ1bmRlZmluZWQiLCJzZXQiLCJyYXciLCJjaGVja1ZlcnNpb24iLCJ3aGVyZSIsInJlZHVjZSIsInJlc3VsdCIsImdldCIsInNpemUiLCJ3aGVyZUNvbGxlY3Rpb24iLCJ2ZXJzaW9uQXR0ciIsIl92ZXJzaW9uQXR0cmlidXRlIiwibWFwV2hlcmVGaWVsZE5hbWVzIiwibmFtZSIsIm9yaWdpbmFsVmFsdWUiLCJpc1ByaW1pdGl2ZSIsImNoYW5nZWQiLCJfY3VzdG9tR2V0dGVycyIsInBsYWluIiwiaW5jbHVkZU5hbWVzIiwiaW5jbHVkZXMiLCJpbnN0YW5jZSIsIl9oYXNDdXN0b21HZXR0ZXJzIiwiX2tleSIsInJlc2V0IiwiX2hhc0RhdGVBdHRyaWJ1dGVzIiwiX2hhc0Jvb2xlYW5BdHRyaWJ1dGVzIiwic2V0S2V5cyIsImRhdGEiLCJrIiwiX2hhc1ZpcnR1YWxBdHRyaWJ1dGVzIiwiX3ZpcnR1YWxBdHRyaWJ1dGVzIiwiX2N1c3RvbVNldHRlcnMiLCJuZXdWYWx1ZSIsIl9zZXRJbmNsdWRlIiwiX2lzQXR0cmlidXRlIiwiX2pzb25BdHRyaWJ1dGVzIiwiaGFzIiwic3BsaXQiLCJwcmV2aW91c05lc3RlZFZhbHVlIiwiaXNFcXVhbCIsIl9oYXNQcmltYXJ5S2V5cyIsIl9pc1ByaW1hcnlLZXkiLCJfaGFzUmVhZE9ubHlBdHRyaWJ1dGVzIiwiX3JlYWRPbmx5QXR0cmlidXRlcyIsIl9kYXRhVHlwZVNhbml0aXplcnMiLCJfZGF0YVR5cGVDaGFuZ2VzIiwidXBkYXRlcyIsImZpbHRlciIsInBpY2tCeSIsImluY2x1ZGVNYXAiLCJhc3NvY2lhdGlvbiIsImFjY2Vzc29yIiwibW9kZWwiLCJjaGlsZE9wdGlvbnMiLCJvcmlnaW5hbEF0dHJpYnV0ZXMiLCJpc0VtcHR5IiwiaXNTaW5nbGVBc3NvY2lhdGlvbiIsImJ1aWxkIiwiYnVsa0J1aWxkIiwiYXJndW1lbnRzIiwiRXJyb3IiLCJob29rcyIsInZhbGlkYXRlIiwiZmllbGRzIiwicmF3QXR0cmlidXRlcyIsImludGVyc2VjdGlvbiIsImRlZmF1bHRGaWVsZHMiLCJyZXR1cm5pbmciLCJwcmltYXJ5S2V5TmFtZSIsImNyZWF0ZWRBdEF0dHIiLCJob29rIiwid2FzTmV3UmVjb3JkIiwibm93IiwidXBkYXRlZEF0QXR0ciIsInB1c2giLCJzaWxlbnQiLCJyZW1vdmUiLCJ2YWwiLCJkZWZhdWx0VmFsdWUiLCJ1bnNoaWZ0IiwiX2dldERlZmF1bHRUaW1lc3RhbXAiLCJ0cnkiLCJ0aGVuIiwiYmVmb3JlSG9va1ZhbHVlcyIsInBpY2siLCJpZ25vcmVDaGFuZ2VkIiwiZGlmZmVyZW5jZSIsImhvb2tDaGFuZ2VkIiwiYWZ0ZXJIb29rVmFsdWVzIiwid2l0aG91dCIsInJ1bkhvb2tzIiwidW5pcSIsImNvbmNhdCIsInNraXAiLCJhcyIsInJlc29sdmUiLCJpbmNsdWRlT3B0aW9ucyIsIm9taXQiLCJ0cmFuc2FjdGlvbiIsImxvZ2dpbmciLCJwYXJlbnRSZWNvcmQiLCJzYXZlIiwiYWNjZXNzb3JzIiwicmVhbEZpZWxkcyIsImZpZWxkIiwidmVyc2lvbkZpZWxkTmFtZSIsIm1hcFZhbHVlRmllbGROYW1lcyIsInF1ZXJ5IiwiYXJncyIsImdldFRhYmxlTmFtZSIsInBhcnNlSW50Iiwicm93c1VwZGF0ZWQiLCJPcHRpbWlzdGljTG9ja0Vycm9yIiwibW9kZWxOYW1lIiwiYXR0ciIsInRhcCIsInBhcmVudCIsImluc3RhbmNlcyIsImZvcmVpZ25LZXkiLCJvdGhlcktleSIsInRocm91Z2giLCJzY29wZSIsIl9hdXRvR2VuZXJhdGVkIiwidGhyb3VnaE1vZGVsIiwiY3JlYXRlIiwic291cmNlS2V5IiwiZmluZE9uZSIsInJlbG9hZCIsIkluc3RhbmNlRXJyb3IiLCJvbWl0QnkiLCJjaGFuZ2VkQmVmb3JlIiwic2V0T3B0aW9ucyIsInNpZGVFZmZlY3RzIiwidW5pb24iLCJmb3JjZSIsImF0dHJpYnV0ZU5hbWUiLCJjdXJyZW50VmFsdWUiLCJnZXREYXRhVmFsdWUiLCJ1bmRlZmluZWRPck51bGwiLCJzZXREYXRhVmFsdWUiLCJEYXRlIiwiZGVsZXRlIiwidHlwZSIsIkRFTEVURSIsImxpbWl0IiwiZGVsZXRlZEF0QXR0cmlidXRlIiwiaXNTZXQiLCJkZWxldGVkQXRDb2wiLCJkZWxldGVkQXREZWZhdWx0VmFsdWUiLCJvbWl0TnVsbCIsImlkZW50aWZpZXIiLCJpbmNyZW1lbnQiLCJyZXR1cm4iLCJieSIsIm90aGVyIiwiZXZlcnkiLCJvdGhlcnMiLCJzb21lIiwiZXF1YWxzIiwidmFsaWRhdG9ycyIsIl9wYXJhbm9pZENsYXVzZSIsImdyb3VwZWRMaW1pdCIsInRpbWVzdGFtcHMiLCJwYXJhbm9pZCIsImRlbGV0ZWRBdE9iamVjdCIsImVxIiwiaXNXaGVyZUVtcHR5IiwiYW5kIiwidGFpbCIsImhlYWQiLCJ0YWJsZU5hbWUiLCJpZCIsIklOVEVHRVIiLCJhbGxvd051bGwiLCJwcmltYXJ5S2V5IiwiYXV0b0luY3JlbWVudCIsIkRBVEUiLCJleGlzdGluZ0F0dHJpYnV0ZXMiLCJlYWNoIiwicHJpbWFyeUtleXMiLCJhdXRvSW5jcmVtZW50QXR0cmlidXRlIiwiZGVmaW5pdGlvbiIsInNlbGYiLCJfY29uZm9ybUluY2x1ZGUiLCJhc3NvY2lhdGlvbnMiLCJfcHNldWRvIiwiX3RyYW5zZm9ybVN0cmluZ0Fzc29jaWF0aW9uIiwidGFyZ2V0Iiwic291cmNlIiwiaXNQbGFpbk9iamVjdCIsImFsbCIsInZhbGlkVHlwZXMiLCJIYXNPbmUiLCJPbmUiLCJIYXMiLCJNYW55IiwiaSIsInR5cGVzIiwiRWFnZXJMb2FkaW5nRXJyb3IiLCJzcGxpY2UiLCJqIiwibmVzdGVkIiwidXNlZCIsImFkZEFsbEluY2x1ZGVzIiwiYXNzb2NpYXRpb25UeXBlIiwicHJlZGljYXRlIiwidGhpc0luY2x1ZGUiLCJwb3AiLCJ0YWJsZU5hbWVzIiwiaGFzU2luZ2xlQXNzb2NpYXRpb24iLCJoYXNNdWx0aUFzc29jaWF0aW9uIiwidG9wTW9kZWwiLCJ0b3BMaW1pdCIsIl92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudCIsImR1cGxpY2F0aW5nIiwiaXNNdWx0aUFzc29jaWF0aW9uIiwiaGFzRHVwbGljYXRpbmciLCJoYXNSZXF1aXJlZCIsInJlcXVpcmVkIiwiaGFzV2hlcmUiLCJoYXNQYXJlbnRXaGVyZSIsImhhc1BhcmVudFJlcXVpcmVkIiwic3ViUXVlcnkiLCJzdWJRdWVyeUZpbHRlciIsImhhc0luY2x1ZGVXaGVyZSIsImhhc0luY2x1ZGVSZXF1aXJlZCIsIl9leHBhbmRBdHRyaWJ1dGVzIiwiX2luamVjdERlcGVuZGVudFZpcnR1YWxBdHRyaWJ1dGVzIiwibWFwRmluZGVyT3B0aW9ucyIsImluY2x1ZGVBdHRyIiwidGFibGVBdHRyaWJ1dGVzIiwiX2dldEluY2x1ZGVkQXNzb2NpYXRpb24iLCJzY29wZWQiLCJfaW5qZWN0U2NvcGUiLCJzZXBhcmF0ZSIsImZsYXR0ZW5EZXB0aCIsInRhcmdldE1vZGVsIiwidGFyZ2V0QWxpYXMiLCJnZXRBc3NvY2lhdGlvbnMiLCJnZXRBc3NvY2lhdGlvbkZvckFsaWFzIiwiZXhpc3RpbmdBbGlhc2VzIiwiam9pbiIsImluZGV4IiwiX2V4cGFuZEluY2x1ZGVBbGxFbGVtZW50IiwicGFyc2VyIiwidG9Mb3dlckNhc2UiLCJ1bmlxdWUiLCJncm91cEJ5IiwiX2Fzc2lnbk9wdGlvbnMiLCJhc3NpZ25XaXRoIiwiX3VuaXFJbmNsdWRlcyIsIm9ialZhbHVlIiwic3JjVmFsdWUiLCJfYmFzZU1lcmdlIiwiX21lcmdlRnVuY3Rpb24iLCJvcHRzIiwiZ2xvYmFsT3B0aW9ucyIsIm1lcmdlIiwiZGVmaW5lIiwicGx1cmFsIiwicGx1cmFsaXplIiwic2luZ3VsYXIiLCJzaW5ndWxhcml6ZSIsImluZGV4ZXMiLCJzY2hlbWEiLCJkZWZpbmVQcm9wZXJ0eSIsImZyZWV6ZVRhYmxlTmFtZSIsInVuZGVyc2NvcmVkIiwicmVqZWN0T25FbXB0eSIsInNjaGVtYURlbGltaXRlciIsImRlZmF1bHRTY29wZSIsInNjb3BlcyIsImlzRGVmaW5lZCIsIm1vZGVsTWFuYWdlciIsInJlbW92ZU1vZGVsIiwiZ2V0TW9kZWwiLCJfc2V0dXBIb29rcyIsInVuZGVyc2NvcmVkSWYiLCJ2YWxpZGF0b3IiLCJ2YWxpZGF0b3JUeXBlIiwibm9ybWFsaXplQXR0cmlidXRlIiwicmVmZXJlbmNlcyIsIl9pbmRleGVzIiwibmFtZUluZGV4IiwiX2NvbmZvcm1JbmRleCIsImFkZCIsInZlcnNpb24iLCJfYWRkRGVmYXVsdEF0dHJpYnV0ZXMiLCJyZWZyZXNoQXR0cmlidXRlcyIsIl9maW5kQXV0b0luY3JlbWVudEF0dHJpYnV0ZSIsIl9zY29wZSIsIl9zY29wZU5hbWVzIiwiYWRkTW9kZWwiLCJhdHRyaWJ1dGVNYW5pcHVsYXRpb24iLCJvcHQiLCJmdW5jcyIsImlzT2JqZWN0IiwiX2N1c3RvbSIsIm1ldGhvZCIsImZjdCIsImNvbmZpZ3VyYWJsZSIsImZpZWxkUmF3QXR0cmlidXRlc01hcCIsInVuaXF1ZUtleXMiLCJub3JtYWxpemVEYXRhVHlwZSIsImZpZWxkTmFtZSIsIl9tb2RlbEF0dHJpYnV0ZSIsIl9zYW5pdGl6ZSIsIl9pc0NoYW5nZWQiLCJCT09MRUFOIiwiREFURU9OTFkiLCJKU09OIiwiVklSVFVBTCIsImlkeE5hbWUiLCJpZHgiLCJtc2ciLCJjb2x1bW4iLCJjdXN0b21JbmRleCIsIkpTT05CIiwidXNpbmciLCJmaWVsZEF0dHJpYnV0ZU1hcCIsIl9oYXNKc29uQXR0cmlidXRlcyIsIl9hIiwiX2hhc0N1c3RvbVNldHRlcnMiLCJsb2ciLCJwcmltYXJ5S2V5RmllbGQiLCJkcm9wIiwiY3JlYXRlVGFibGUiLCJhbHRlciIsImRlc2NyaWJlVGFibGUiLCJnZXRGb3JlaWduS2V5UmVmZXJlbmNlc0ZvclRhYmxlIiwidGFibGVJbmZvcyIsImNvbHVtbnMiLCJmb3JlaWduS2V5UmVmZXJlbmNlcyIsImNoYW5nZXMiLCJyZW1vdmVkQ29uc3RyYWludHMiLCJjb2x1bW5EZXNjIiwiY29sdW1uTmFtZSIsImFkZENvbHVtbiIsImN1cnJlbnRBdHRyaWJ1dGUiLCJyZW1vdmVDb2x1bW4iLCJkYXRhYmFzZSIsImNvbmZpZyIsImZvcmVpZ25LZXlSZWZlcmVuY2UiLCJjb25zdHJhaW50TmFtZSIsInRhYmxlQ2F0YWxvZyIsInRhYmxlU2NoZW1hIiwicmVmZXJlbmNlZFRhYmxlTmFtZSIsInJlZmVyZW5jZWRDb2x1bW5OYW1lIiwicmVmZXJlbmNlZFRhYmxlU2NoZW1hIiwicmVtb3ZlQ29uc3RyYWludCIsImNoYW5nZUNvbHVtbiIsImYiLCJzaG93SW5kZXgiLCJpdGVtMSIsIml0ZW0yIiwic29ydCIsImluZGV4MSIsImluZGV4MiIsImNvbmN1cnJlbnRseSIsImFkZEluZGV4IiwiYmVuY2htYXJrIiwiZHJvcFRhYmxlIiwiZHJvcFNjaGVtYSIsImFkZFNjaGVtYSIsIm92ZXJyaWRlIiwib3B0aW9uIiwic2NvcGVOYW1lIiwiZmxhdHRlbiIsImFwcGx5Iiwic2xpY2UiLCJTZXF1ZWxpemVTY29wZUVycm9yIiwiUXVlcnlFcnJvciIsIndhcm5PbkludmFsaWRPcHRpb25zIiwiaGFzSm9pbiIsImdyb3VwIiwic2VsZWN0T3B0aW9ucyIsInNlbGVjdCIsInJlc3VsdHMiLCJFbXB0eVJlc3VsdEVycm9yIiwiX2ZpbmRTZXBhcmF0ZSIsInZhbGlkQ29sdW1uTmFtZXMiLCJ1bnJlY29nbml6ZWRPcHRpb25zIiwidW5leHBlY3RlZE1vZGVsQXR0cmlidXRlcyIsIndhcm4iLCJvcmlnaW5hbCIsIm1lbW8iLCJsZW4iLCJwYXJhbSIsIkJ1ZmZlciIsImlzQnVmZmVyIiwidW5pcXVlU2luZ2xlQ29sdW1ucyIsImNoYWluIiwiYyIsImZpbmRBbGwiLCJhZ2dyZWdhdGVGdW5jdGlvbiIsInByZXZBdHRyaWJ1dGVzIiwiYXR0ck9wdGlvbnMiLCJhZ2dyZWdhdGVDb2x1bW4iLCJjb2wiLCJkaXN0aW5jdCIsImZuIiwidW5pb25CeSIsImEiLCJkYXRhVHlwZSIsIkZMT0FUIiwibWFwT3B0aW9uRmllbGROYW1lcyIsInJhd1NlbGVjdCIsImluY2x1ZGVJZ25vcmVBdHRyaWJ1dGVzIiwib2Zmc2V0Iiwib3JkZXIiLCJhZ2dyZWdhdGUiLCJjb3VudE9wdGlvbnMiLCJjb3VudCIsInJvd3MiLCJ2YWx1ZVNldHMiLCJ1bmtub3duRGVmYXVsdHMiLCJfY2xzIiwidCIsImludGVybmFsVHJhbnNhY3Rpb24iLCJleGNlcHRpb24iLCJVbmlxdWVDb25zdHJhaW50RXJyb3IiLCJjYXRjaCIsImVyciIsImZsYXR0ZW5lZFdoZXJlIiwiZmxhdHRlbk9iamVjdERlZXAiLCJmbGF0dGVuZWRXaGVyZUtleXMiLCJsYXN0Iiwid2hlcmVGaWVsZHMiLCJlcnJGaWVsZEtleXMiLCJlcnJGaWVsZHNXaGVyZUludGVyc2VjdHMiLCJpbnRlcnNlY3RzIiwidG9TdHJpbmciLCJmaW5hbGx5IiwiY29tbWl0IiwiaGFzUHJpbWFyeSIsInVwZGF0ZWREYXRhVmFsdWVzIiwiaW5zZXJ0VmFsdWVzIiwidXBkYXRlVmFsdWVzIiwidXBzZXJ0IiwiY3JlYXRlZCIsImZpbmRCeVBrIiwicmVjb3JkIiwicmVjb3JkcyIsInJlY3Vyc2l2ZUJ1bGtDcmVhdGUiLCJpbmRpdmlkdWFsSG9va3MiLCJpZ25vcmVEdXBsaWNhdGVzIiwicmVqZWN0IiwidXBkYXRlT25EdXBsaWNhdGUiLCJlcnJvcnMiLCJBZ2dyZWdhdGVFcnJvciIsInZhbGlkYXRlT3B0aW9ucyIsIkJ1bGtSZWNvcmRFcnJvciIsImluZGl2aWR1YWxPcHRpb25zIiwiYXNzb2NpYXRpb25JbnN0YW5jZXMiLCJhc3NvY2lhdGlvbkluc3RhbmNlSW5kZXhUb0luc3RhbmNlTWFwIiwiYXNzb2NpYXRpb25JbnN0YW5jZSIsIm91dCIsImZpZWxkTWFwcGVkQXR0cmlidXRlcyIsInVwc2VydEtleXMiLCJidWxrSW5zZXJ0IiwiZmluZCIsImFzc29jaWF0ZWQiLCJ0aHJvdWdoT3B0aW9ucyIsInRocm91Z2hJbnN0YW5jZXMiLCJ0cnVuY2F0ZSIsImRlc3Ryb3kiLCJjYXNjYWRlIiwicmVzdGFydElkZW50aXR5IiwiQlVMS0RFTEVURSIsIl9pbnN0YW5jZXMiLCJCVUxLVVBEQVRFIiwiYXR0clZhbHVlSGFzaCIsImJ1bGtVcGRhdGUiLCJidWxrRGVsZXRlIiwiUkFXIiwiX29wdGlvbnNNdXN0Q29udGFpbldoZXJlIiwidmFsdWVzVXNlIiwiY2hhbmdlZFZhbHVlcyIsImRpZmZlcmVudCIsImZvckluIiwidGhpc0NoYW5nZWRWYWx1ZXMiLCJoYXNUcmlnZ2VyIiwiYWZmZWN0ZWRSb3dzIiwiZXhjbHVkZSIsImVsZW0iLCJfZGVmYXVsdHNPcHRpb25zIiwiU3ltYm9sIiwiZm9yIiwiYWxpYXMiLCJ1cGRhdGVkQXRBdHRyaWJ1dGUiLCJwcm9taXNlIiwiZGVjcmVtZW50IiwiYXBwbHlUbyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxNQUFNLEdBQUdDLE9BQU8sQ0FBQyxRQUFELENBQXRCOztBQUNBLE1BQU1DLENBQUMsR0FBR0QsT0FBTyxDQUFDLFFBQUQsQ0FBakI7O0FBQ0EsTUFBTUUsTUFBTSxHQUFHRixPQUFPLENBQUMsUUFBRCxDQUF0Qjs7QUFFQSxNQUFNRyxLQUFLLEdBQUdILE9BQU8sQ0FBQyxTQUFELENBQXJCOztBQUNBLE1BQU07QUFBRUksRUFBQUE7QUFBRixJQUFhSixPQUFPLENBQUMsZ0JBQUQsQ0FBMUI7O0FBQ0EsTUFBTUssU0FBUyxHQUFHTCxPQUFPLENBQUMsMkJBQUQsQ0FBekI7O0FBQ0EsTUFBTU0sYUFBYSxHQUFHTixPQUFPLENBQUMsZ0NBQUQsQ0FBN0I7O0FBQ0EsTUFBTU8saUJBQWlCLEdBQUdQLE9BQU8sQ0FBQyxzQkFBRCxDQUFqQzs7QUFDQSxNQUFNUSxVQUFVLEdBQUdSLE9BQU8sQ0FBQyxlQUFELENBQTFCOztBQUNBLE1BQU1TLGVBQWUsR0FBR1QsT0FBTyxDQUFDLFVBQUQsQ0FBL0I7O0FBQ0EsTUFBTVUsT0FBTyxHQUFHVixPQUFPLENBQUMsV0FBRCxD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QUFTLEVBQUU7QUFBYixPQUFYLEVBQWlDdE0sT0FBakMsRUFBMEM7QUFDbER3TSxRQUFBQSxFQUFFLEVBQUU7QUFEOEMsT0FBMUMsQ0FBVjtBQUlBLGFBQU8sS0FBS0YsU0FBTCxDQUFleEYsTUFBZixFQUF1QjlHLE9BQXZCLENBQVA7QUFDRDs7OzZDQUUrQkEsTyxFQUFTO0FBQ3ZDN0IsTUFBQUEsTUFBTSxDQUFDNkIsT0FBTyxJQUFJQSxPQUFPLENBQUNrRCxLQUFwQixFQUEyQixrREFBM0IsQ0FBTjtBQUNBL0UsTUFBQUEsTUFBTSxDQUFDRSxDQUFDLENBQUN1USxhQUFGLENBQWdCNU8sT0FBTyxDQUFDa0QsS0FBeEIsS0FBa0N6QyxLQUFLLENBQUNDLE9BQU4sQ0FBY1YsT0FBTyxDQUFDa0QsS0FBdEIsQ0FBbEMsSUFBa0VsRCxPQUFPLENBQUNrRCxLQUFSLFlBQXlCM0UsS0FBSyxDQUFDdUQsZUFBbEcsRUFDSixpRkFESSxDQUFOO0FBRUQ7Ozs0QkE2K0JjNE0sTSxFQUFRMU8sTyxFQUFTLENBQUUsQyxDQUFDOztBQUVuQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tDQWlDcUIwTyxNLEVBQVExTyxPLEVBQVMsQ0FBRSxDLENBQUM7O0FBRXpDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzJCQW1CYzBPLE0sRUFBUTFPLE8sRUFBUyxDQUFFLEMsQ0FBQzs7QUFFbEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs4QkFrQmlCME8sTSxFQUFRMU8sTyxFQUFTLENBQUUsQyxDQUFDOzs7Ozs7O0FBR3ZDQyxNQUFNLENBQUNDLE1BQVAsQ0FBY1QsS0FBZCxFQUFxQk4saUJBQXJCO0FBQ0FELEtBQUssQ0FBQ3lpQixPQUFOLENBQWNsaUIsS0FBZCxFQUFxQixJQUFyQjtBQUVBbWlCLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQnBpQixLQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xyXG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XHJcbmNvbnN0IERvdHRpZSA9IHJlcXVpcmUoJ2RvdHRpZScpO1xyXG5cclxuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcbmNvbnN0IHsgbG9nZ2VyIH0gPSByZXF1aXJlKCcuL3V0aWxzL2xvZ2dlcicpO1xyXG5jb25zdCBCZWxvbmdzVG8gPSByZXF1aXJlKCcuL2Fzc29jaWF0aW9ucy9iZWxvbmdzLXRvJyk7XHJcbmNvbnN0IEJlbG9uZ3NUb01hbnkgPSByZXF1aXJlKCcuL2Fzc29jaWF0aW9ucy9iZWxvbmdzLXRvLW1hbnknKTtcclxuY29uc3QgSW5zdGFuY2VWYWxpZGF0b3IgPSByZXF1aXJlKCcuL2luc3RhbmNlLXZhbGlkYXRvcicpO1xyXG5jb25zdCBRdWVyeVR5cGVzID0gcmVxdWlyZSgnLi9xdWVyeS10eXBlcycpO1xyXG5jb25zdCBzZXF1ZWxpemVFcnJvcnMgPSByZXF1aXJlKCcuL2Vycm9ycycpO1xyXG5jb25zdCBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJyk7XHJcbmNvbnN0IEFzc29jaWF0aW9uID0gcmVxdWlyZSgnLi9hc3NvY2lhdGlvbnMvYmFzZScpO1xyXG5jb25zdCBIYXNNYW55ID0gcmVxdWlyZSgnLi9hc3NvY2lhdGlvbnMvaGFzLW1hbnknKTtcclxuY29uc3QgRGF0YVR5cGVzID0gcmVxdWlyZSgnLi9kYXRhLXR5cGVzJyk7XHJcbmNvbnN0IEhvb2tzID0gcmVxdWlyZSgnLi9ob29rcycpO1xyXG5jb25zdCBhc3NvY2lhdGlvbnNNaXhpbiA9IHJlcXVpcmUoJy4vYXNzb2NpYXRpb25zL21peGluJyk7XHJcbmNvbnN0IE9wID0gcmVxdWlyZSgnLi9vcGVyYXRvcnMnKTtcclxuY29uc3QgeyBub0RvdWJsZU5lc3RlZEdyb3VwIH0gPSByZXF1aXJlKCcuL3V0aWxzL2RlcHJlY2F0aW9ucycpO1xyXG5cclxuXHJcbi8vIFRoaXMgbGlzdCB3aWxsIHF1aWNrbHkgYmVjb21lIGRhdGVkLCBidXQgZmFpbGluZyB0byBtYWludGFpbiB0aGlzIGxpc3QganVzdCBtZWFuc1xyXG4vLyB3ZSB3b24ndCB0aHJvdyBhIHdhcm5pbmcgd2hlbiB3ZSBzaG91bGQuIEF0IGxlYXN0IG1vc3QgY29tbW9uIGNhc2VzIHdpbGwgZm9yZXZlciBiZSBjb3ZlcmVkXHJcbi8vIHNvIHdlIHN0b3AgdGhyb3dpbmcgZXJyb25lb3VzIHdhcm5pbmdzIHdoZW4gd2Ugc2hvdWxkbid0LlxyXG5jb25zdCB2YWxpZFF1ZXJ5S2V5d29yZHMgPSBuZXcgU2V0KFsnd2hlcmUnLCAnYXR0cmlidXRlcycsICdwYXJhbm9pZCcsICdpbmNsdWRlJywgJ29yZGVyJywgJ2xpbWl0JywgJ29mZnNldCcsXHJcbiAgJ3RyYW5zYWN0aW9uJywgJ2xvY2snLCAncmF3JywgJ2xvZ2dpbmcnLCAnYmVuY2htYXJrJywgJ2hhdmluZycsICdzZWFyY2hQYXRoJywgJ3JlamVjdE9uRW1wdHknLCAncGxhaW4nLFxyXG4gICdzY29wZScsICdncm91cCcsICd0aHJvdWdoJywgJ2RlZmF1bHRzJywgJ2Rpc3RpbmN0JywgJ3ByaW1hcnknLCAnZXhjZXB0aW9uJywgJ3R5cGUnLCAnaG9va3MnLCAnZm9yY2UnLFxyXG4gICduYW1lJ10pO1xyXG5cclxuLy8gTGlzdCBvZiBhdHRyaWJ1dGVzIHRoYXQgc2hvdWxkIG5vdCBiZSBpbXBsaWNpdGx5IHBhc3NlZCBpbnRvIHN1YnF1ZXJpZXMvaW5jbHVkZXMuXHJcbmNvbnN0IG5vbkNhc2NhZGluZ09wdGlvbnMgPSBbJ2luY2x1ZGUnLCAnYXR0cmlidXRlcycsICdvcmlnaW5hbEF0dHJpYnV0ZXMnLCAnb3JkZXInLCAnd2hlcmUnLCAnbGltaXQnLCAnb2Zmc2V0JywgJ3BsYWluJywgJ2dyb3VwJywgJ2hhdmluZyddO1xyXG5cclxuLyoqXHJcbiAqIEEgTW9kZWwgcmVwcmVzZW50cyBhIHRhYmxlIGluIHRoZSBkYXRhYmFzZS4gSW5zdGFuY2VzIG9mIHRoaXMgY2xhc3MgcmVwcmVzZW50IGEgZGF0YWJhc2Ugcm93LlxyXG4gKlxyXG4gKiBNb2RlbCBpbnN0YW5jZXMgb3BlcmF0ZSB3aXRoIHRoZSBjb25jZXB0IG9mIGEgYGRhdGFWYWx1ZXNgIHByb3BlcnR5LCB3aGljaCBzdG9yZXMgdGhlIGFjdHVhbCB2YWx1ZXMgcmVwcmVzZW50ZWQgYnkgdGhlIGluc3RhbmNlLlxyXG4gKiBCeSBkZWZhdWx0LCB0aGUgdmFsdWVzIGZyb20gZGF0YVZhbHVlcyBjYW4gYWxzbyBiZSBhY2Nlc3NlZCBkaXJlY3RseSBmcm9tIHRoZSBJbnN0YW5jZSwgdGhhdCBpczpcclxuICogYGBganNcclxuICogaW5zdGFuY2UuZmllbGRcclxuICogLy8gaXMgdGhlIHNhbWUgYXNcclxuICogaW5zdGFuY2UuZ2V0KCdmaWVsZCcpXHJcbiAqIC8vIGlzIHRoZSBzYW1lIGFzXHJcbiAqIGluc3RhbmNlLmdldERhdGFWYWx1ZSgnZmllbGQnKVxyXG4gKiBgYGBcclxuICogSG93ZXZlciwgaWYgZ2V0dGVycyBhbmQvb3Igc2V0dGVycyBhcmUgZGVmaW5lZCBmb3IgYGZpZWxkYCB0aGV5IHdpbGwgYmUgaW52b2tlZCwgaW5zdGVhZCBvZiByZXR1cm5pbmcgdGhlIHZhbHVlIGZyb20gYGRhdGFWYWx1ZXNgLlxyXG4gKiBBY2Nlc3NpbmcgcHJvcGVydGllcyBkaXJlY3RseSBvciB1c2luZyBgZ2V0YCBpcyBwcmVmZXJyZWQgZm9yIHJlZ3VsYXIgdXNlLCBgZ2V0RGF0YVZhbHVlYCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjdXN0b20gZ2V0dGVycy5cclxuICpcclxuICogQHNlZVxyXG4gICAqIHtAbGluayBTZXF1ZWxpemUjZGVmaW5lfSBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBnZXR0ZXJzIGFuZCBzZXR0ZXJzXHJcbiAqIEBtaXhlcyBIb29rc1xyXG4gKi9cclxuY2xhc3MgTW9kZWwge1xyXG4gIHN0YXRpYyBnZXQgUXVlcnlJbnRlcmZhY2UoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUuZ2V0UXVlcnlJbnRlcmZhY2UoKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBnZXQgUXVlcnlHZW5lcmF0b3IoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5RdWVyeUludGVyZmFjZS5RdWVyeUdlbmVyYXRvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBzZXF1ZWxpemUgaW5zdGFuY2VcclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgU2VxdWVsaXplfVxyXG4gICAqXHJcbiAgICogQHByb3BlcnR5IHNlcXVlbGl6ZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1NlcXVlbGl6ZX1cclxuICAgKi9cclxuICBnZXQgc2VxdWVsaXplKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3Iuc2VxdWVsaXplO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQnVpbGRzIGEgbmV3IG1vZGVsIGluc3RhbmNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICBbdmFsdWVzPXt9XSBhbiBvYmplY3Qgb2Yga2V5IHZhbHVlIHBhaXJzXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICBbb3B0aW9uc10gaW5zdGFuY2UgY29uc3RydWN0aW9uIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJhdz1mYWxzZV0gSWYgc2V0IHRvIHRydWUsIHZhbHVlcyB3aWxsIGlnbm9yZSBmaWVsZCBhbmQgdmlydHVhbCBzZXR0ZXJzLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaXNOZXdSZWNvcmQ9dHJ1ZV0gSXMgdGhpcyBhIG5ldyByZWNvcmRcclxuICAgKiBAcGFyYW0ge0FycmF5fSAgIFtvcHRpb25zLmluY2x1ZGVdIGFuIGFycmF5IG9mIGluY2x1ZGUgb3B0aW9ucyAtIFVzZWQgdG8gYnVpbGQgcHJlZmV0Y2hlZC9pbmNsdWRlZCBtb2RlbCBpbnN0YW5jZXMuIFNlZSBgc2V0YFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKHZhbHVlcyA9IHt9LCBvcHRpb25zID0ge30pIHtcclxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcclxuICAgICAgaXNOZXdSZWNvcmQ6IHRydWUsXHJcbiAgICAgIF9zY2hlbWE6IHRoaXMuY29uc3RydWN0b3IuX3NjaGVtYSxcclxuICAgICAgX3NjaGVtYURlbGltaXRlcjogdGhpcy5jb25zdHJ1Y3Rvci5fc2NoZW1hRGVsaW1pdGVyXHJcbiAgICB9LCBvcHRpb25zIHx8IHt9KTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgIG9wdGlvbnMuYXR0cmlidXRlcyA9IG9wdGlvbnMuYXR0cmlidXRlcy5tYXAoYXR0cmlidXRlID0+IEFycmF5LmlzQXJyYXkoYXR0cmlidXRlKSA/IGF0dHJpYnV0ZVsxXSA6IGF0dHJpYnV0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFvcHRpb25zLmluY2x1ZGVWYWxpZGF0ZWQpIHtcclxuICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5fY29uZm9ybUluY2x1ZGVzKG9wdGlvbnMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gICAgICBpZiAob3B0aW9ucy5pbmNsdWRlKSB7XHJcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5fZXhwYW5kSW5jbHVkZUFsbChvcHRpb25zKTtcclxuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yLl92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudHMob3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRhdGFWYWx1ZXMgPSB7fTtcclxuICAgIHRoaXMuX3ByZXZpb3VzRGF0YVZhbHVlcyA9IHt9O1xyXG4gICAgdGhpcy5fY2hhbmdlZCA9IHt9O1xyXG4gICAgdGhpcy5fbW9kZWxPcHRpb25zID0gdGhpcy5jb25zdHJ1Y3Rvci5vcHRpb25zO1xyXG4gICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhpcyBpbnN0YW5jZSBoYXMgbm90IHlldCBiZWVuIHBlcnNpc3RlZCB0byB0aGUgZGF0YWJhc2VcclxuICAgICAqIEBwcm9wZXJ0eSBpc05ld1JlY29yZFxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIHRoaXMuaXNOZXdSZWNvcmQgPSBvcHRpb25zLmlzTmV3UmVjb3JkO1xyXG5cclxuICAgIHRoaXMuX2luaXRWYWx1ZXModmFsdWVzLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIF9pbml0VmFsdWVzKHZhbHVlcywgb3B0aW9ucykge1xyXG4gICAgbGV0IGRlZmF1bHRzO1xyXG4gICAgbGV0IGtleTtcclxuXHJcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgJiYgXy5jbG9uZSh2YWx1ZXMpIHx8IHt9O1xyXG5cclxuICAgIGlmIChvcHRpb25zLmlzTmV3UmVjb3JkKSB7XHJcbiAgICAgIGRlZmF1bHRzID0ge307XHJcblxyXG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci5faGFzRGVmYXVsdFZhbHVlcykge1xyXG4gICAgICAgIGRlZmF1bHRzID0gXy5tYXBWYWx1ZXModGhpcy5jb25zdHJ1Y3Rvci5fZGVmYXVsdFZhbHVlcywgdmFsdWVGbiA9PiB7XHJcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlRm4oKTtcclxuICAgICAgICAgIHJldHVybiB2YWx1ZSAmJiB2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCA/IHZhbHVlIDogXy5jbG9uZURlZXAodmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzZXQgaWQgdG8gbnVsbCBpZiBub3QgcGFzc2VkIGFzIHZhbHVlLCBhIG5ld2x5IGNyZWF0ZWQgZGFvIGhhcyBubyBpZFxyXG4gICAgICAvLyByZW1vdmluZyB0aGlzIGJyZWFrcyBidWxrQ3JlYXRlXHJcbiAgICAgIC8vIGRvIGFmdGVyIGRlZmF1bHQgdmFsdWVzIHNpbmNlIGl0IG1pZ2h0IGhhdmUgVVVJRCBhcyBhIGRlZmF1bHQgdmFsdWVcclxuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IucHJpbWFyeUtleUF0dHJpYnV0ZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5QXR0cmlidXRlcy5mb3JFYWNoKHByaW1hcnlLZXlBdHRyaWJ1dGUgPT4ge1xyXG4gICAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGVmYXVsdHMsIHByaW1hcnlLZXlBdHRyaWJ1dGUpKSB7XHJcbiAgICAgICAgICAgIGRlZmF1bHRzW3ByaW1hcnlLZXlBdHRyaWJ1dGVdID0gbnVsbDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0ICYmIGRlZmF1bHRzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0XSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVZhbHVlc1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdF0gPSBVdGlscy50b0RlZmF1bHRWYWx1ZShkZWZhdWx0c1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdF0sIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCk7XHJcbiAgICAgICAgZGVsZXRlIGRlZmF1bHRzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0XTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0ICYmIGRlZmF1bHRzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0XSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVZhbHVlc1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdF0gPSBVdGlscy50b0RlZmF1bHRWYWx1ZShkZWZhdWx0c1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdF0sIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCk7XHJcbiAgICAgICAgZGVsZXRlIGRlZmF1bHRzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0XTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0ICYmIGRlZmF1bHRzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0XSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVZhbHVlc1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdF0gPSBVdGlscy50b0RlZmF1bHRWYWx1ZShkZWZhdWx0c1t0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdF0sIHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCk7XHJcbiAgICAgICAgZGVsZXRlIGRlZmF1bHRzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0XTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKE9iamVjdC5rZXlzKGRlZmF1bHRzKS5sZW5ndGgpIHtcclxuICAgICAgICBmb3IgKGtleSBpbiBkZWZhdWx0cykge1xyXG4gICAgICAgICAgaWYgKHZhbHVlc1trZXldID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXQoa2V5LCBVdGlscy50b0RlZmF1bHRWYWx1ZShkZWZhdWx0c1trZXldLCB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QpLCB7IHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgZGVsZXRlIHZhbHVlc1trZXldO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2V0KHZhbHVlcywgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvLyB2YWxpZGF0ZUluY2x1ZGVkRWxlbWVudHMgc2hvdWxkIGhhdmUgYmVlbiBjYWxsZWQgYmVmb3JlIHRoaXMgbWV0aG9kXHJcbiAgc3RhdGljIF9wYXJhbm9pZENsYXVzZShtb2RlbCwgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICAvLyBBcHBseSBvbiBlYWNoIGluY2x1ZGVcclxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIGhhbmRsZWQgYmVmb3JlIGhhbmRsaW5nIHdoZXJlIGNvbmRpdGlvbnMgYmVjYXVzZSBvZiBsb2dpYyB3aXRoIHJldHVybnNcclxuICAgIC8vIG90aGVyd2lzZSB0aGlzIGNvZGUgd2lsbCBuZXZlciBydW4gb24gaW5jbHVkZXMgb2YgYSBhbHJlYWR5IGNvbmRpdGlvbmFibGUgd2hlcmVcclxuICAgIGlmIChvcHRpb25zLmluY2x1ZGUpIHtcclxuICAgICAgZm9yIChjb25zdCBpbmNsdWRlIG9mIG9wdGlvbnMuaW5jbHVkZSkge1xyXG4gICAgICAgIHRoaXMuX3BhcmFub2lkQ2xhdXNlKGluY2x1ZGUubW9kZWwsIGluY2x1ZGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYXBwbHkgcGFyYW5vaWQgd2hlbiBncm91cGVkTGltaXQgaXMgdXNlZFxyXG4gICAgaWYgKF8uZ2V0KG9wdGlvbnMsICdncm91cGVkTGltaXQub24ub3B0aW9ucy5wYXJhbm9pZCcpKSB7XHJcbiAgICAgIGNvbnN0IHRocm91Z2hNb2RlbCA9IF8uZ2V0KG9wdGlvbnMsICdncm91cGVkTGltaXQub24udGhyb3VnaC5tb2RlbCcpO1xyXG4gICAgICBpZiAodGhyb3VnaE1vZGVsKSB7XHJcbiAgICAgICAgb3B0aW9ucy5ncm91cGVkTGltaXQudGhyb3VnaCA9IHRoaXMuX3BhcmFub2lkQ2xhdXNlKHRocm91Z2hNb2RlbCwgb3B0aW9ucy5ncm91cGVkTGltaXQudGhyb3VnaCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIW1vZGVsLm9wdGlvbnMudGltZXN0YW1wcyB8fCAhbW9kZWwub3B0aW9ucy5wYXJhbm9pZCB8fCBvcHRpb25zLnBhcmFub2lkID09PSBmYWxzZSkge1xyXG4gICAgICAvLyBUaGlzIG1vZGVsIGlzIG5vdCBwYXJhbm9pZCwgbm90aGluZyB0byBkbyBoZXJlO1xyXG4gICAgICByZXR1cm4gb3B0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZWxldGVkQXRDb2wgPSBtb2RlbC5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQ7XHJcbiAgICBjb25zdCBkZWxldGVkQXRBdHRyaWJ1dGUgPSBtb2RlbC5yYXdBdHRyaWJ1dGVzW2RlbGV0ZWRBdENvbF07XHJcbiAgICBjb25zdCBkZWxldGVkQXRPYmplY3QgPSB7fTtcclxuXHJcbiAgICBsZXQgZGVsZXRlZEF0RGVmYXVsdFZhbHVlID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRlbGV0ZWRBdEF0dHJpYnV0ZSwgJ2RlZmF1bHRWYWx1ZScpID8gZGVsZXRlZEF0QXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA6IG51bGw7XHJcblxyXG4gICAgZGVsZXRlZEF0RGVmYXVsdFZhbHVlID0gZGVsZXRlZEF0RGVmYXVsdFZhbHVlIHx8IHtcclxuICAgICAgW09wLmVxXTogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICBkZWxldGVkQXRPYmplY3RbZGVsZXRlZEF0QXR0cmlidXRlLmZpZWxkIHx8IGRlbGV0ZWRBdENvbF0gPSBkZWxldGVkQXREZWZhdWx0VmFsdWU7XHJcblxyXG4gICAgaWYgKFV0aWxzLmlzV2hlcmVFbXB0eShvcHRpb25zLndoZXJlKSkge1xyXG4gICAgICBvcHRpb25zLndoZXJlID0gZGVsZXRlZEF0T2JqZWN0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3B0aW9ucy53aGVyZSA9IHsgW09wLmFuZF06IFtkZWxldGVkQXRPYmplY3QsIG9wdGlvbnMud2hlcmVdIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9wdGlvbnM7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgX2FkZERlZmF1bHRBdHRyaWJ1dGVzKCkge1xyXG4gICAgY29uc3QgdGFpbCA9IHt9O1xyXG4gICAgbGV0IGhlYWQgPSB7fTtcclxuXHJcbiAgICAvLyBBZGQgaWQgaWYgbm8gcHJpbWFyeSBrZXkgd2FzIG1hbnVhbGx5IGFkZGVkIHRvIGRlZmluaXRpb25cclxuICAgIC8vIENhbid0IHVzZSB0aGlzLnByaW1hcnlLZXlzIGhlcmUsIHNpbmNlIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGJlZm9yZSBQS3MgYXJlIGlkZW50aWZpZWRcclxuICAgIGlmICghXy5zb21lKHRoaXMucmF3QXR0cmlidXRlcywgJ3ByaW1hcnlLZXknKSkge1xyXG4gICAgICBpZiAoJ2lkJyBpbiB0aGlzLnJhd0F0dHJpYnV0ZXMpIHtcclxuICAgICAgICAvLyBTb21ldGhpbmcgaXMgZmlzaHkgaGVyZSFcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEEgY29sdW1uIGNhbGxlZCAnaWQnIHdhcyBhZGRlZCB0byB0aGUgYXR0cmlidXRlcyBvZiAnJHt0aGlzLnRhYmxlTmFtZX0nIGJ1dCBub3QgbWFya2VkIHdpdGggJ3ByaW1hcnlLZXk6IHRydWUnYCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGhlYWQgPSB7XHJcbiAgICAgICAgaWQ6IHtcclxuICAgICAgICAgIHR5cGU6IG5ldyBEYXRhVHlwZXMuSU5URUdFUigpLFxyXG4gICAgICAgICAgYWxsb3dOdWxsOiBmYWxzZSxcclxuICAgICAgICAgIHByaW1hcnlLZXk6IHRydWUsXHJcbiAgICAgICAgICBhdXRvSW5jcmVtZW50OiB0cnVlLFxyXG4gICAgICAgICAgX2F1dG9HZW5lcmF0ZWQ6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0KSB7XHJcbiAgICAgIHRhaWxbdGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy5jcmVhdGVkQXRdID0ge1xyXG4gICAgICAgIHR5cGU6IERhdGFUeXBlcy5EQVRFLFxyXG4gICAgICAgIGFsbG93TnVsbDogZmFsc2UsXHJcbiAgICAgICAgX2F1dG9HZW5lcmF0ZWQ6IHRydWVcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXQpIHtcclxuICAgICAgdGFpbFt0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdF0gPSB7XHJcbiAgICAgICAgdHlwZTogRGF0YVR5cGVzLkRBVEUsXHJcbiAgICAgICAgYWxsb3dOdWxsOiBmYWxzZSxcclxuICAgICAgICBfYXV0b0dlbmVyYXRlZDogdHJ1ZVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdCkge1xyXG4gICAgICB0YWlsW3RoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0XSA9IHtcclxuICAgICAgICB0eXBlOiBEYXRhVHlwZXMuREFURSxcclxuICAgICAgICBfYXV0b0dlbmVyYXRlZDogdHJ1ZVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl92ZXJzaW9uQXR0cmlidXRlKSB7XHJcbiAgICAgIHRhaWxbdGhpcy5fdmVyc2lvbkF0dHJpYnV0ZV0gPSB7XHJcbiAgICAgICAgdHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXHJcbiAgICAgICAgYWxsb3dOdWxsOiBmYWxzZSxcclxuICAgICAgICBkZWZhdWx0VmFsdWU6IDAsXHJcbiAgICAgICAgX2F1dG9HZW5lcmF0ZWQ6IHRydWVcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBleGlzdGluZ0F0dHJpYnV0ZXMgPSBfLmNsb25lKHRoaXMucmF3QXR0cmlidXRlcyk7XHJcbiAgICB0aGlzLnJhd0F0dHJpYnV0ZXMgPSB7fTtcclxuXHJcbiAgICBfLmVhY2goaGVhZCwgKHZhbHVlLCBhdHRyKSA9PiB7XHJcbiAgICAgIHRoaXMucmF3QXR0cmlidXRlc1thdHRyXSA9IHZhbHVlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgXy5lYWNoKGV4aXN0aW5nQXR0cmlidXRlcywgKHZhbHVlLCBhdHRyKSA9PiB7XHJcbiAgICAgIHRoaXMucmF3QXR0cmlidXRlc1thdHRyXSA9IHZhbHVlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgXy5lYWNoKHRhaWwsICh2YWx1ZSwgYXR0cikgPT4ge1xyXG4gICAgICBpZiAodGhpcy5yYXdBdHRyaWJ1dGVzW2F0dHJdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0gPSB2YWx1ZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCFPYmplY3Qua2V5cyh0aGlzLnByaW1hcnlLZXlzKS5sZW5ndGgpIHtcclxuICAgICAgdGhpcy5wcmltYXJ5S2V5cy5pZCA9IHRoaXMucmF3QXR0cmlidXRlcy5pZDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHN0YXRpYyBfZmluZEF1dG9JbmNyZW1lbnRBdHRyaWJ1dGUoKSB7XHJcbiAgICB0aGlzLmF1dG9JbmNyZW1lbnRBdHRyaWJ1dGUgPSBudWxsO1xyXG5cclxuICAgIGZvciAoY29uc3QgbmFtZSBpbiB0aGlzLnJhd0F0dHJpYnV0ZXMpIHtcclxuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLnJhd0F0dHJpYnV0ZXMsIG5hbWUpKSB7XHJcbiAgICAgICAgY29uc3QgZGVmaW5pdGlvbiA9IHRoaXMucmF3QXR0cmlidXRlc1tuYW1lXTtcclxuICAgICAgICBpZiAoZGVmaW5pdGlvbiAmJiBkZWZpbml0aW9uLmF1dG9JbmNyZW1lbnQpIHtcclxuICAgICAgICAgIGlmICh0aGlzLmF1dG9JbmNyZW1lbnRBdHRyaWJ1dGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEluc3RhbmNlIGRlZmluaXRpb24uIE9ubHkgb25lIGF1dG9pbmNyZW1lbnQgZmllbGQgYWxsb3dlZC4nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMuYXV0b0luY3JlbWVudEF0dHJpYnV0ZSA9IG5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgX2NvbmZvcm1JbmNsdWRlcyhvcHRpb25zLCBzZWxmKSB7XHJcbiAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZSkgcmV0dXJuO1xyXG5cclxuICAgIC8vIGlmIGluY2x1ZGUgaXMgbm90IGFuIGFycmF5LCB3cmFwIGluIGFuIGFycmF5XHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkob3B0aW9ucy5pbmNsdWRlKSkge1xyXG4gICAgICBvcHRpb25zLmluY2x1ZGUgPSBbb3B0aW9ucy5pbmNsdWRlXTtcclxuICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMuaW5jbHVkZS5sZW5ndGgpIHtcclxuICAgICAgZGVsZXRlIG9wdGlvbnMuaW5jbHVkZTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbnZlcnQgYWxsIGluY2x1ZGVkIGVsZW1lbnRzIHRvIHsgbW9kZWw6IE1vZGVsIH0gZm9ybVxyXG4gICAgb3B0aW9ucy5pbmNsdWRlID0gb3B0aW9ucy5pbmNsdWRlLm1hcChpbmNsdWRlID0+IHRoaXMuX2NvbmZvcm1JbmNsdWRlKGluY2x1ZGUsIHNlbGYpKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBfdHJhbnNmb3JtU3RyaW5nQXNzb2NpYXRpb24oaW5jbHVkZSwgc2VsZikge1xyXG4gICAgaWYgKHNlbGYgJiYgdHlwZW9mIGluY2x1ZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNlbGYuYXNzb2NpYXRpb25zLCBpbmNsdWRlKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzb2NpYXRpb24gd2l0aCBhbGlhcyBcIiR7aW5jbHVkZX1cIiBkb2VzIG5vdCBleGlzdCBvbiAke3NlbGYubmFtZX1gKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc2VsZi5hc3NvY2lhdGlvbnNbaW5jbHVkZV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5jbHVkZTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBfY29uZm9ybUluY2x1ZGUoaW5jbHVkZSwgc2VsZikge1xyXG4gICAgaWYgKGluY2x1ZGUpIHtcclxuICAgICAgbGV0IG1vZGVsO1xyXG5cclxuICAgICAgaWYgKGluY2x1ZGUuX3BzZXVkbykgcmV0dXJuIGluY2x1ZGU7XHJcblxyXG4gICAgICBpbmNsdWRlID0gdGhpcy5fdHJhbnNmb3JtU3RyaW5nQXNzb2NpYXRpb24oaW5jbHVkZSwgc2VsZik7XHJcblxyXG4gICAgICBpZiAoaW5jbHVkZSBpbnN0YW5jZW9mIEFzc29jaWF0aW9uKSB7XHJcbiAgICAgICAgaWYgKHNlbGYgJiYgaW5jbHVkZS50YXJnZXQubmFtZSA9PT0gc2VsZi5uYW1lKSB7XHJcbiAgICAgICAgICBtb2RlbCA9IGluY2x1ZGUuc291cmNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBtb2RlbCA9IGluY2x1ZGUudGFyZ2V0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgbW9kZWwsIGFzc29jaWF0aW9uOiBpbmNsdWRlLCBhczogaW5jbHVkZS5hcyB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaW5jbHVkZS5wcm90b3R5cGUgJiYgaW5jbHVkZS5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgIHJldHVybiB7IG1vZGVsOiBpbmNsdWRlIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QoaW5jbHVkZSkpIHtcclxuICAgICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbikge1xyXG4gICAgICAgICAgaW5jbHVkZS5hc3NvY2lhdGlvbiA9IHRoaXMuX3RyYW5zZm9ybVN0cmluZ0Fzc29jaWF0aW9uKGluY2x1ZGUuYXNzb2NpYXRpb24sIHNlbGYpO1xyXG5cclxuICAgICAgICAgIGlmIChzZWxmICYmIGluY2x1ZGUuYXNzb2NpYXRpb24udGFyZ2V0Lm5hbWUgPT09IHNlbGYubmFtZSkge1xyXG4gICAgICAgICAgICBtb2RlbCA9IGluY2x1ZGUuYXNzb2NpYXRpb24uc291cmNlO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbW9kZWwgPSBpbmNsdWRlLmFzc29jaWF0aW9uLnRhcmdldDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoIWluY2x1ZGUubW9kZWwpIGluY2x1ZGUubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICAgIGlmICghaW5jbHVkZS5hcykgaW5jbHVkZS5hcyA9IGluY2x1ZGUuYXNzb2NpYXRpb24uYXM7XHJcblxyXG4gICAgICAgICAgdGhpcy5fY29uZm9ybUluY2x1ZGVzKGluY2x1ZGUsIG1vZGVsKTtcclxuICAgICAgICAgIHJldHVybiBpbmNsdWRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGluY2x1ZGUubW9kZWwpIHtcclxuICAgICAgICAgIHRoaXMuX2NvbmZvcm1JbmNsdWRlcyhpbmNsdWRlLCBpbmNsdWRlLm1vZGVsKTtcclxuICAgICAgICAgIHJldHVybiBpbmNsdWRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGluY2x1ZGUuYWxsKSB7XHJcbiAgICAgICAgICB0aGlzLl9jb25mb3JtSW5jbHVkZXMoaW5jbHVkZSk7XHJcbiAgICAgICAgICByZXR1cm4gaW5jbHVkZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY2x1ZGUgdW5leHBlY3RlZC4gRWxlbWVudCBoYXMgdG8gYmUgZWl0aGVyIGEgTW9kZWwsIGFuIEFzc29jaWF0aW9uIG9yIGFuIG9iamVjdC4nKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBfZXhwYW5kSW5jbHVkZUFsbEVsZW1lbnQoaW5jbHVkZXMsIGluY2x1ZGUpIHtcclxuICAgIC8vIGNoZWNrICdhbGwnIGF0dHJpYnV0ZSBwcm92aWRlZCBpcyB2YWxpZFxyXG4gICAgbGV0IGFsbCA9IGluY2x1ZGUuYWxsO1xyXG4gICAgZGVsZXRlIGluY2x1ZGUuYWxsO1xyXG5cclxuICAgIGlmIChhbGwgIT09IHRydWUpIHtcclxuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFsbCkpIHtcclxuICAgICAgICBhbGwgPSBbYWxsXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgdmFsaWRUeXBlcyA9IHtcclxuICAgICAgICBCZWxvbmdzVG86IHRydWUsXHJcbiAgICAgICAgSGFzT25lOiB0cnVlLFxyXG4gICAgICAgIEhhc01hbnk6IHRydWUsXHJcbiAgICAgICAgT25lOiBbJ0JlbG9uZ3NUbycsICdIYXNPbmUnXSxcclxuICAgICAgICBIYXM6IFsnSGFzT25lJywgJ0hhc01hbnknXSxcclxuICAgICAgICBNYW55OiBbJ0hhc01hbnknXVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbGwubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCB0eXBlID0gYWxsW2ldO1xyXG4gICAgICAgIGlmICh0eXBlID09PSAnQWxsJykge1xyXG4gICAgICAgICAgYWxsID0gdHJ1ZTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdHlwZXMgPSB2YWxpZFR5cGVzW3R5cGVdO1xyXG4gICAgICAgIGlmICghdHlwZXMpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuRWFnZXJMb2FkaW5nRXJyb3IoYGluY2x1ZGUgYWxsICcke3R5cGV9JyBpcyBub3QgdmFsaWQgLSBtdXN0IGJlIEJlbG9uZ3NUbywgSGFzT25lLCBIYXNNYW55LCBPbmUsIEhhcywgTWFueSBvciBBbGxgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlcyAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgLy8gcmVwbGFjZSB0eXBlIHBsYWNlaG9sZGVyIGUuZy4gJ09uZScgd2l0aCBpdHMgY29uc3RpdHVlbnQgdHlwZXMgZS5nLiAnSGFzT25lJywgJ0JlbG9uZ3NUbydcclxuICAgICAgICAgIGFsbC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICBpLS07XHJcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHR5cGVzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIGlmICghYWxsLmluY2x1ZGVzKHR5cGVzW2pdKSkge1xyXG4gICAgICAgICAgICAgIGFsbC51bnNoaWZ0KHR5cGVzW2pdKTtcclxuICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgYWxsIGFzc29jaWF0aW9ucyBvZiB0eXBlcyBzcGVjaWZpZWQgdG8gaW5jbHVkZXNcclxuICAgIGNvbnN0IG5lc3RlZCA9IGluY2x1ZGUubmVzdGVkO1xyXG4gICAgaWYgKG5lc3RlZCkge1xyXG4gICAgICBkZWxldGUgaW5jbHVkZS5uZXN0ZWQ7XHJcblxyXG4gICAgICBpZiAoIWluY2x1ZGUuaW5jbHVkZSkge1xyXG4gICAgICAgIGluY2x1ZGUuaW5jbHVkZSA9IFtdO1xyXG4gICAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KGluY2x1ZGUuaW5jbHVkZSkpIHtcclxuICAgICAgICBpbmNsdWRlLmluY2x1ZGUgPSBbaW5jbHVkZS5pbmNsdWRlXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHVzZWQgPSBbXTtcclxuICAgIChmdW5jdGlvbiBhZGRBbGxJbmNsdWRlcyhwYXJlbnQsIGluY2x1ZGVzKSB7XHJcbiAgICAgIF8uZm9yRWFjaChwYXJlbnQuYXNzb2NpYXRpb25zLCBhc3NvY2lhdGlvbiA9PiB7XHJcbiAgICAgICAgaWYgKGFsbCAhPT0gdHJ1ZSAmJiAhYWxsLmluY2x1ZGVzKGFzc29jaWF0aW9uLmFzc29jaWF0aW9uVHlwZSkpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNoZWNrIGlmIG1vZGVsIGFscmVhZHkgaW5jbHVkZWQsIGFuZCBza2lwIGlmIHNvXHJcbiAgICAgICAgY29uc3QgbW9kZWwgPSBhc3NvY2lhdGlvbi50YXJnZXQ7XHJcbiAgICAgICAgY29uc3QgYXMgPSBhc3NvY2lhdGlvbi5vcHRpb25zLmFzO1xyXG5cclxuICAgICAgICBjb25zdCBwcmVkaWNhdGUgPSB7IG1vZGVsIH07XHJcbiAgICAgICAgaWYgKGFzKSB7XHJcbiAgICAgICAgICAvLyBXZSBvbmx5IGFkZCAnYXMnIHRvIHRoZSBwcmVkaWNhdGUgaWYgaXQgYWN0dWFsbHkgZXhpc3RzXHJcbiAgICAgICAgICBwcmVkaWNhdGUuYXMgPSBhcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfLnNvbWUoaW5jbHVkZXMsIHByZWRpY2F0ZSkpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNraXAgaWYgcmVjdXJzaW5nIG92ZXIgYSBtb2RlbCBhbHJlYWR5IG5lc3RlZFxyXG4gICAgICAgIGlmIChuZXN0ZWQgJiYgdXNlZC5pbmNsdWRlcyhtb2RlbCkpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdXNlZC5wdXNoKHBhcmVudCk7XHJcblxyXG4gICAgICAgIC8vIGluY2x1ZGUgdGhpcyBtb2RlbFxyXG4gICAgICAgIGNvbnN0IHRoaXNJbmNsdWRlID0gVXRpbHMuY2xvbmVEZWVwKGluY2x1ZGUpO1xyXG4gICAgICAgIHRoaXNJbmNsdWRlLm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgaWYgKGFzKSB7XHJcbiAgICAgICAgICB0aGlzSW5jbHVkZS5hcyA9IGFzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbmNsdWRlcy5wdXNoKHRoaXNJbmNsdWRlKTtcclxuXHJcbiAgICAgICAgLy8gcnVuIHJlY3Vyc2l2ZWx5IGlmIG5lc3RlZFxyXG4gICAgICAgIGlmIChuZXN0ZWQpIHtcclxuICAgICAgICAgIGFkZEFsbEluY2x1ZGVzKG1vZGVsLCB0aGlzSW5jbHVkZS5pbmNsdWRlKTtcclxuICAgICAgICAgIGlmICh0aGlzSW5jbHVkZS5pbmNsdWRlLmxlbmd0aCA9PT0gMCkgZGVsZXRlIHRoaXNJbmNsdWRlLmluY2x1ZGU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgdXNlZC5wb3AoKTtcclxuICAgIH0pKHRoaXMsIGluY2x1ZGVzKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBfdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzKG9wdGlvbnMsIHRhYmxlTmFtZXMpIHtcclxuICAgIGlmICghb3B0aW9ucy5tb2RlbCkgb3B0aW9ucy5tb2RlbCA9IHRoaXM7XHJcblxyXG4gICAgdGFibGVOYW1lcyA9IHRhYmxlTmFtZXMgfHwge307XHJcbiAgICBvcHRpb25zLmluY2x1ZGVOYW1lcyA9IFtdO1xyXG4gICAgb3B0aW9ucy5pbmNsdWRlTWFwID0ge307XHJcblxyXG4gICAgLyogTGVnYWN5ICovXHJcbiAgICBvcHRpb25zLmhhc1NpbmdsZUFzc29jaWF0aW9uID0gZmFsc2U7XHJcbiAgICBvcHRpb25zLmhhc011bHRpQXNzb2NpYXRpb24gPSBmYWxzZTtcclxuXHJcbiAgICBpZiAoIW9wdGlvbnMucGFyZW50KSB7XHJcbiAgICAgIG9wdGlvbnMudG9wTW9kZWwgPSBvcHRpb25zLm1vZGVsO1xyXG4gICAgICBvcHRpb25zLnRvcExpbWl0ID0gb3B0aW9ucy5saW1pdDtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zLmluY2x1ZGUgPSBvcHRpb25zLmluY2x1ZGUubWFwKGluY2x1ZGUgPT4ge1xyXG4gICAgICBpbmNsdWRlID0gdGhpcy5fY29uZm9ybUluY2x1ZGUoaW5jbHVkZSk7XHJcbiAgICAgIGluY2x1ZGUucGFyZW50ID0gb3B0aW9ucztcclxuICAgICAgaW5jbHVkZS50b3BMaW1pdCA9IG9wdGlvbnMudG9wTGltaXQ7XHJcblxyXG4gICAgICB0aGlzLl92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudC5jYWxsKG9wdGlvbnMubW9kZWwsIGluY2x1ZGUsIHRhYmxlTmFtZXMsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgaWYgKGluY2x1ZGUuZHVwbGljYXRpbmcgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGluY2x1ZGUuZHVwbGljYXRpbmcgPSBpbmNsdWRlLmFzc29jaWF0aW9uLmlzTXVsdGlBc3NvY2lhdGlvbjtcclxuICAgICAgfVxyXG5cclxuICAgICAgaW5jbHVkZS5oYXNEdXBsaWNhdGluZyA9IGluY2x1ZGUuaGFzRHVwbGljYXRpbmcgfHwgaW5jbHVkZS5kdXBsaWNhdGluZztcclxuICAgICAgaW5jbHVkZS5oYXNSZXF1aXJlZCA9IGluY2x1ZGUuaGFzUmVxdWlyZWQgfHwgaW5jbHVkZS5yZXF1aXJlZDtcclxuXHJcbiAgICAgIG9wdGlvbnMuaGFzRHVwbGljYXRpbmcgPSBvcHRpb25zLmhhc0R1cGxpY2F0aW5nIHx8IGluY2x1ZGUuaGFzRHVwbGljYXRpbmc7XHJcbiAgICAgIG9wdGlvbnMuaGFzUmVxdWlyZWQgPSBvcHRpb25zLmhhc1JlcXVpcmVkIHx8IGluY2x1ZGUucmVxdWlyZWQ7XHJcblxyXG4gICAgICBvcHRpb25zLmhhc1doZXJlID0gb3B0aW9ucy5oYXNXaGVyZSB8fCBpbmNsdWRlLmhhc1doZXJlIHx8ICEhaW5jbHVkZS53aGVyZTtcclxuICAgICAgcmV0dXJuIGluY2x1ZGU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGluY2x1ZGUgb2Ygb3B0aW9ucy5pbmNsdWRlKSB7XHJcbiAgICAgIGluY2x1ZGUuaGFzUGFyZW50V2hlcmUgPSBvcHRpb25zLmhhc1BhcmVudFdoZXJlIHx8ICEhb3B0aW9ucy53aGVyZTtcclxuICAgICAgaW5jbHVkZS5oYXNQYXJlbnRSZXF1aXJlZCA9IG9wdGlvbnMuaGFzUGFyZW50UmVxdWlyZWQgfHwgISFvcHRpb25zLnJlcXVpcmVkO1xyXG5cclxuICAgICAgaWYgKGluY2x1ZGUuc3ViUXVlcnkgIT09IGZhbHNlICYmIG9wdGlvbnMuaGFzRHVwbGljYXRpbmcgJiYgb3B0aW9ucy50b3BMaW1pdCkge1xyXG4gICAgICAgIGlmIChpbmNsdWRlLmR1cGxpY2F0aW5nKSB7XHJcbiAgICAgICAgICBpbmNsdWRlLnN1YlF1ZXJ5ID0gZmFsc2U7XHJcbiAgICAgICAgICBpbmNsdWRlLnN1YlF1ZXJ5RmlsdGVyID0gaW5jbHVkZS5oYXNSZXF1aXJlZDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaW5jbHVkZS5zdWJRdWVyeSA9IGluY2x1ZGUuaGFzUmVxdWlyZWQ7XHJcbiAgICAgICAgICBpbmNsdWRlLnN1YlF1ZXJ5RmlsdGVyID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGluY2x1ZGUuc3ViUXVlcnkgPSBpbmNsdWRlLnN1YlF1ZXJ5IHx8IGZhbHNlO1xyXG4gICAgICAgIGlmIChpbmNsdWRlLmR1cGxpY2F0aW5nKSB7XHJcbiAgICAgICAgICBpbmNsdWRlLnN1YlF1ZXJ5RmlsdGVyID0gaW5jbHVkZS5zdWJRdWVyeTtcclxuICAgICAgICAgIGluY2x1ZGUuc3ViUXVlcnkgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaW5jbHVkZS5zdWJRdWVyeUZpbHRlciA9IGZhbHNlO1xyXG4gICAgICAgICAgaW5jbHVkZS5zdWJRdWVyeSA9IGluY2x1ZGUuc3ViUXVlcnkgfHwgaW5jbHVkZS5oYXNQYXJlbnRSZXF1aXJlZCAmJiBpbmNsdWRlLmhhc1JlcXVpcmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgb3B0aW9ucy5pbmNsdWRlTWFwW2luY2x1ZGUuYXNdID0gaW5jbHVkZTtcclxuICAgICAgb3B0aW9ucy5pbmNsdWRlTmFtZXMucHVzaChpbmNsdWRlLmFzKTtcclxuXHJcbiAgICAgIC8vIFNldCB0b3AgbGV2ZWwgb3B0aW9uc1xyXG4gICAgICBpZiAob3B0aW9ucy50b3BNb2RlbCA9PT0gb3B0aW9ucy5tb2RlbCAmJiBvcHRpb25zLnN1YlF1ZXJ5ID09PSB1bmRlZmluZWQgJiYgb3B0aW9ucy50b3BMaW1pdCkge1xyXG4gICAgICAgIGlmIChpbmNsdWRlLnN1YlF1ZXJ5KSB7XHJcbiAgICAgICAgICBvcHRpb25zLnN1YlF1ZXJ5ID0gaW5jbHVkZS5zdWJRdWVyeTtcclxuICAgICAgICB9IGVsc2UgaWYgKGluY2x1ZGUuaGFzRHVwbGljYXRpbmcpIHtcclxuICAgICAgICAgIG9wdGlvbnMuc3ViUXVlcnkgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLyogTGVnYWN5ICovXHJcbiAgICAgIG9wdGlvbnMuaGFzSW5jbHVkZVdoZXJlID0gb3B0aW9ucy5oYXNJbmNsdWRlV2hlcmUgfHwgaW5jbHVkZS5oYXNJbmNsdWRlV2hlcmUgfHwgISFpbmNsdWRlLndoZXJlO1xyXG4gICAgICBvcHRpb25zLmhhc0luY2x1ZGVSZXF1aXJlZCA9IG9wdGlvbnMuaGFzSW5jbHVkZVJlcXVpcmVkIHx8IGluY2x1ZGUuaGFzSW5jbHVkZVJlcXVpcmVkIHx8ICEhaW5jbHVkZS5yZXF1aXJlZDtcclxuXHJcbiAgICAgIGlmIChpbmNsdWRlLmFzc29jaWF0aW9uLmlzTXVsdGlBc3NvY2lhdGlvbiB8fCBpbmNsdWRlLmhhc011bHRpQXNzb2NpYXRpb24pIHtcclxuICAgICAgICBvcHRpb25zLmhhc011bHRpQXNzb2NpYXRpb24gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChpbmNsdWRlLmFzc29jaWF0aW9uLmlzU2luZ2xlQXNzb2NpYXRpb24gfHwgaW5jbHVkZS5oYXNTaW5nbGVBc3NvY2lhdGlvbikge1xyXG4gICAgICAgIG9wdGlvbnMuaGFzU2luZ2xlQXNzb2NpYXRpb24gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMudG9wTW9kZWwgPT09IG9wdGlvbnMubW9kZWwgJiYgb3B0aW9ucy5zdWJRdWVyeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIG9wdGlvbnMuc3ViUXVlcnkgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBvcHRpb25zO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIF92YWxpZGF0ZUluY2x1ZGVkRWxlbWVudChpbmNsdWRlLCB0YWJsZU5hbWVzLCBvcHRpb25zKSB7XHJcbiAgICB0YWJsZU5hbWVzW2luY2x1ZGUubW9kZWwuZ2V0VGFibGVOYW1lKCldID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoaW5jbHVkZS5hdHRyaWJ1dGVzICYmICFvcHRpb25zLnJhdykge1xyXG4gICAgICBpbmNsdWRlLm1vZGVsLl9leHBhbmRBdHRyaWJ1dGVzKGluY2x1ZGUpO1xyXG5cclxuICAgICAgaW5jbHVkZS5vcmlnaW5hbEF0dHJpYnV0ZXMgPSB0aGlzLl9pbmplY3REZXBlbmRlbnRWaXJ0dWFsQXR0cmlidXRlcyhpbmNsdWRlLmF0dHJpYnV0ZXMpO1xyXG5cclxuICAgICAgaW5jbHVkZSA9IFV0aWxzLm1hcEZpbmRlck9wdGlvbnMoaW5jbHVkZSwgaW5jbHVkZS5tb2RlbCk7XHJcblxyXG4gICAgICBpZiAoaW5jbHVkZS5hdHRyaWJ1dGVzLmxlbmd0aCkge1xyXG4gICAgICAgIF8uZWFjaChpbmNsdWRlLm1vZGVsLnByaW1hcnlLZXlzLCAoYXR0ciwga2V5KSA9PiB7XHJcbiAgICAgICAgICAvLyBJbmNsdWRlIHRoZSBwcmltYXJ5IGtleSBpZiBpdCdzIG5vdCBhbHJlYWR5IGluY2x1ZGVkIC0gdGFrZSBpbnRvIGFjY291bnQgdGhhdCB0aGUgcGsgbWlnaHQgYmUgYWxpYXNlZCAoZHVlIHRvIGEgLmZpZWxkIHByb3ApXHJcbiAgICAgICAgICBpZiAoIWluY2x1ZGUuYXR0cmlidXRlcy5zb21lKGluY2x1ZGVBdHRyID0+IHtcclxuICAgICAgICAgICAgaWYgKGF0dHIuZmllbGQgIT09IGtleSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGluY2x1ZGVBdHRyKSAmJiBpbmNsdWRlQXR0clswXSA9PT0gYXR0ci5maWVsZCAmJiBpbmNsdWRlQXR0clsxXSA9PT0ga2V5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBpbmNsdWRlQXR0ciA9PT0ga2V5O1xyXG4gICAgICAgICAgfSkpIHtcclxuICAgICAgICAgICAgaW5jbHVkZS5hdHRyaWJ1dGVzLnVuc2hpZnQoa2V5KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaW5jbHVkZSA9IFV0aWxzLm1hcEZpbmRlck9wdGlvbnMoaW5jbHVkZSwgaW5jbHVkZS5tb2RlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcHNldWRvIGluY2x1ZGUganVzdCBuZWVkZWQgdGhlIGF0dHJpYnV0ZSBsb2dpYywgcmV0dXJuXHJcbiAgICBpZiAoaW5jbHVkZS5fcHNldWRvKSB7XHJcbiAgICAgIGluY2x1ZGUuYXR0cmlidXRlcyA9IE9iamVjdC5rZXlzKGluY2x1ZGUubW9kZWwudGFibGVBdHRyaWJ1dGVzKTtcclxuICAgICAgcmV0dXJuIFV0aWxzLm1hcEZpbmRlck9wdGlvbnMoaW5jbHVkZSwgaW5jbHVkZS5tb2RlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2hlY2sgaWYgdGhlIGN1cnJlbnQgTW9kZWwgaXMgYWN0dWFsbHkgYXNzb2NpYXRlZCB3aXRoIHRoZSBwYXNzZWQgTW9kZWwgLSBvciBpdCdzIGEgcHNldWRvIGluY2x1ZGVcclxuICAgIGNvbnN0IGFzc29jaWF0aW9uID0gaW5jbHVkZS5hc3NvY2lhdGlvbiB8fCB0aGlzLl9nZXRJbmNsdWRlZEFzc29jaWF0aW9uKGluY2x1ZGUubW9kZWwsIGluY2x1ZGUuYXMpO1xyXG5cclxuICAgIGluY2x1ZGUuYXNzb2NpYXRpb24gPSBhc3NvY2lhdGlvbjtcclxuICAgIGluY2x1ZGUuYXMgPSBhc3NvY2lhdGlvbi5hcztcclxuXHJcbiAgICAvLyBJZiB0aHJvdWdoLCB3ZSBjcmVhdGUgYSBwc2V1ZG8gY2hpbGQgaW5jbHVkZSwgdG8gZWFzZSBvdXIgcGFyc2luZyBsYXRlciBvblxyXG4gICAgaWYgKGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaCAmJiBPYmplY3QoaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsKSA9PT0gaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsKSB7XHJcbiAgICAgIGlmICghaW5jbHVkZS5pbmNsdWRlKSBpbmNsdWRlLmluY2x1ZGUgPSBbXTtcclxuICAgICAgY29uc3QgdGhyb3VnaCA9IGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaDtcclxuXHJcbiAgICAgIGluY2x1ZGUudGhyb3VnaCA9IF8uZGVmYXVsdHMoaW5jbHVkZS50aHJvdWdoIHx8IHt9LCB7XHJcbiAgICAgICAgbW9kZWw6IHRocm91Z2gubW9kZWwsXHJcbiAgICAgICAgYXM6IHRocm91Z2gubW9kZWwubmFtZSxcclxuICAgICAgICBhc3NvY2lhdGlvbjoge1xyXG4gICAgICAgICAgaXNTaW5nbGVBc3NvY2lhdGlvbjogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX3BzZXVkbzogdHJ1ZSxcclxuICAgICAgICBwYXJlbnQ6IGluY2x1ZGVcclxuICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgaWYgKHRocm91Z2guc2NvcGUpIHtcclxuICAgICAgICBpbmNsdWRlLnRocm91Z2gud2hlcmUgPSBpbmNsdWRlLnRocm91Z2gud2hlcmUgPyB7IFtPcC5hbmRdOiBbaW5jbHVkZS50aHJvdWdoLndoZXJlLCB0aHJvdWdoLnNjb3BlXSB9IDogdGhyb3VnaC5zY29wZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaW5jbHVkZS5pbmNsdWRlLnB1c2goaW5jbHVkZS50aHJvdWdoKTtcclxuICAgICAgdGFibGVOYW1lc1t0aHJvdWdoLnRhYmxlTmFtZV0gPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGluY2x1ZGUubW9kZWwgbWF5IGJlIHRoZSBtYWluIG1vZGVsLCB3aGlsZSB0aGUgYXNzb2NpYXRpb24gdGFyZ2V0IG1heSBiZSBzY29wZWQgLSB0aHVzIHdlIG5lZWQgdG8gbG9vayBhdCBhc3NvY2lhdGlvbi50YXJnZXQvc291cmNlXHJcbiAgICBsZXQgbW9kZWw7XHJcbiAgICBpZiAoaW5jbHVkZS5tb2RlbC5zY29wZWQgPT09IHRydWUpIHtcclxuICAgICAgLy8gSWYgdGhlIHBhc3NlZCBtb2RlbCBpcyBhbHJlYWR5IHNjb3BlZCwga2VlcCB0aGF0XHJcbiAgICAgIG1vZGVsID0gaW5jbHVkZS5tb2RlbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIE90aGVyd2lzZSB1c2UgdGhlIG1vZGVsIHRoYXQgd2FzIG9yaWdpbmFsbHkgcGFzc2VkIHRvIHRoZSBhc3NvY2lhdGlvblxyXG4gICAgICBtb2RlbCA9IGluY2x1ZGUuYXNzb2NpYXRpb24udGFyZ2V0Lm5hbWUgPT09IGluY2x1ZGUubW9kZWwubmFtZSA/IGluY2x1ZGUuYXNzb2NpYXRpb24udGFyZ2V0IDogaW5jbHVkZS5hc3NvY2lhdGlvbi5zb3VyY2U7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kZWwuX2luamVjdFNjb3BlKGluY2x1ZGUpO1xyXG5cclxuICAgIC8vIFRoaXMgY2hlY2sgc2hvdWxkIGhhcHBlbiBhZnRlciBpbmplY3RpbmcgdGhlIHNjb3BlLCBzaW5jZSB0aGUgc2NvcGUgbWF5IGNvbnRhaW4gYSAuYXR0cmlidXRlc1xyXG4gICAgaWYgKCFpbmNsdWRlLmF0dHJpYnV0ZXMpIHtcclxuICAgICAgaW5jbHVkZS5hdHRyaWJ1dGVzID0gT2JqZWN0LmtleXMoaW5jbHVkZS5tb2RlbC50YWJsZUF0dHJpYnV0ZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGluY2x1ZGUgPSBVdGlscy5tYXBGaW5kZXJPcHRpb25zKGluY2x1ZGUsIGluY2x1ZGUubW9kZWwpO1xyXG5cclxuICAgIGlmIChpbmNsdWRlLnJlcXVpcmVkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgaW5jbHVkZS5yZXF1aXJlZCA9ICEhaW5jbHVkZS53aGVyZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbi5zY29wZSkge1xyXG4gICAgICBpbmNsdWRlLndoZXJlID0gaW5jbHVkZS53aGVyZSA/IHsgW09wLmFuZF06IFtpbmNsdWRlLndoZXJlLCBpbmNsdWRlLmFzc29jaWF0aW9uLnNjb3BlXSB9IDogaW5jbHVkZS5hc3NvY2lhdGlvbi5zY29wZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaW5jbHVkZS5saW1pdCAmJiBpbmNsdWRlLnNlcGFyYXRlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgaW5jbHVkZS5zZXBhcmF0ZSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGluY2x1ZGUuc2VwYXJhdGUgPT09IHRydWUpIHtcclxuICAgICAgaWYgKCEoaW5jbHVkZS5hc3NvY2lhdGlvbiBpbnN0YW5jZW9mIEhhc01hbnkpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IEhhc01hbnkgYXNzb2NpYXRpb25zIHN1cHBvcnQgaW5jbHVkZS5zZXBhcmF0ZScpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpbmNsdWRlLmR1cGxpY2F0aW5nID0gZmFsc2U7XHJcblxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgb3B0aW9ucy5hdHRyaWJ1dGVzXHJcbiAgICAgICAgJiYgb3B0aW9ucy5hdHRyaWJ1dGVzLmxlbmd0aFxyXG4gICAgICAgICYmICFfLmZsYXR0ZW5EZXB0aChvcHRpb25zLmF0dHJpYnV0ZXMsIDIpLmluY2x1ZGVzKGFzc29jaWF0aW9uLnNvdXJjZUtleSlcclxuICAgICAgKSB7XHJcbiAgICAgICAgb3B0aW9ucy5hdHRyaWJ1dGVzLnB1c2goYXNzb2NpYXRpb24uc291cmNlS2V5KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKFxyXG4gICAgICAgIGluY2x1ZGUuYXR0cmlidXRlc1xyXG4gICAgICAgICYmIGluY2x1ZGUuYXR0cmlidXRlcy5sZW5ndGhcclxuICAgICAgICAmJiAhXy5mbGF0dGVuRGVwdGgoaW5jbHVkZS5hdHRyaWJ1dGVzLCAyKS5pbmNsdWRlcyhhc3NvY2lhdGlvbi5mb3JlaWduS2V5KVxyXG4gICAgICApIHtcclxuICAgICAgICBpbmNsdWRlLmF0dHJpYnV0ZXMucHVzaChhc3NvY2lhdGlvbi5mb3JlaWduS2V5KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFZhbGlkYXRlIGNoaWxkIGluY2x1ZGVzXHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGluY2x1ZGUsICdpbmNsdWRlJykpIHtcclxuICAgICAgdGhpcy5fdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzLmNhbGwoaW5jbHVkZS5tb2RlbCwgaW5jbHVkZSwgdGFibGVOYW1lcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGluY2x1ZGU7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgX2dldEluY2x1ZGVkQXNzb2NpYXRpb24odGFyZ2V0TW9kZWwsIHRhcmdldEFsaWFzKSB7XHJcbiAgICBjb25zdCBhc3NvY2lhdGlvbnMgPSB0aGlzLmdldEFzc29jaWF0aW9ucyh0YXJnZXRNb2RlbCk7XHJcbiAgICBsZXQgYXNzb2NpYXRpb24gPSBudWxsO1xyXG4gICAgaWYgKGFzc29jaWF0aW9ucy5sZW5ndGggPT09IDApIHtcclxuICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5FYWdlckxvYWRpbmdFcnJvcihgJHt0YXJnZXRNb2RlbC5uYW1lfSBpcyBub3QgYXNzb2NpYXRlZCB0byAke3RoaXMubmFtZX0hYCk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXNzb2NpYXRpb25zLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICBhc3NvY2lhdGlvbiA9IHRoaXMuZ2V0QXNzb2NpYXRpb25Gb3JBbGlhcyh0YXJnZXRNb2RlbCwgdGFyZ2V0QWxpYXMpO1xyXG4gICAgICBpZiAoYXNzb2NpYXRpb24pIHtcclxuICAgICAgICByZXR1cm4gYXNzb2NpYXRpb247XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRhcmdldEFsaWFzKSB7XHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmdBbGlhc2VzID0gdGhpcy5nZXRBc3NvY2lhdGlvbnModGFyZ2V0TW9kZWwpLm1hcChhc3NvY2lhdGlvbiA9PiBhc3NvY2lhdGlvbi5hcyk7XHJcbiAgICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5FYWdlckxvYWRpbmdFcnJvcihgJHt0YXJnZXRNb2RlbC5uYW1lfSBpcyBhc3NvY2lhdGVkIHRvICR7dGhpcy5uYW1lfSB1c2luZyBhbiBhbGlhcy4gYCArXHJcbiAgICAgICAgICBgWW91J3ZlIGluY2x1ZGVkIGFuIGFsaWFzICgke3RhcmdldEFsaWFzfSksIGJ1dCBpdCBkb2VzIG5vdCBtYXRjaCB0aGUgYWxpYXMoZXMpIGRlZmluZWQgaW4geW91ciBhc3NvY2lhdGlvbiAoJHtleGlzdGluZ0FsaWFzZXMuam9pbignLCAnKX0pLmApO1xyXG4gICAgICB9XHJcbiAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuRWFnZXJMb2FkaW5nRXJyb3IoYCR7dGFyZ2V0TW9kZWwubmFtZX0gaXMgYXNzb2NpYXRlZCB0byAke3RoaXMubmFtZX0gdXNpbmcgYW4gYWxpYXMuIGAgK1xyXG4gICAgICAgICdZb3UgbXVzdCB1c2UgdGhlIFxcJ2FzXFwnIGtleXdvcmQgdG8gc3BlY2lmeSB0aGUgYWxpYXMgd2l0aGluIHlvdXIgaW5jbHVkZSBzdGF0ZW1lbnQuJyk7XHJcbiAgICB9XHJcbiAgICBhc3NvY2lhdGlvbiA9IHRoaXMuZ2V0QXNzb2NpYXRpb25Gb3JBbGlhcyh0YXJnZXRNb2RlbCwgdGFyZ2V0QWxpYXMpO1xyXG4gICAgaWYgKCFhc3NvY2lhdGlvbikge1xyXG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLkVhZ2VyTG9hZGluZ0Vycm9yKGAke3RhcmdldE1vZGVsLm5hbWV9IGlzIGFzc29jaWF0ZWQgdG8gJHt0aGlzLm5hbWV9IG11bHRpcGxlIHRpbWVzLiBgICtcclxuICAgICAgICAnVG8gaWRlbnRpZnkgdGhlIGNvcnJlY3QgYXNzb2NpYXRpb24sIHlvdSBtdXN0IHVzZSB0aGUgXFwnYXNcXCcga2V5d29yZCB0byBzcGVjaWZ5IHRoZSBhbGlhcyBvZiB0aGUgYXNzb2NpYXRpb24geW91IHdhbnQgdG8gaW5jbHVkZS4nKTtcclxuICAgIH1cclxuICAgIHJldHVybiBhc3NvY2lhdGlvbjtcclxuICB9XHJcblxyXG5cclxuICBzdGF0aWMgX2V4cGFuZEluY2x1ZGVBbGwob3B0aW9ucykge1xyXG4gICAgY29uc3QgaW5jbHVkZXMgPSBvcHRpb25zLmluY2x1ZGU7XHJcbiAgICBpZiAoIWluY2x1ZGVzKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgaW5jbHVkZXMubGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgIGNvbnN0IGluY2x1ZGUgPSBpbmNsdWRlc1tpbmRleF07XHJcblxyXG4gICAgICBpZiAoaW5jbHVkZS5hbGwpIHtcclxuICAgICAgICBpbmNsdWRlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIGluZGV4LS07XHJcblxyXG4gICAgICAgIHRoaXMuX2V4cGFuZEluY2x1ZGVBbGxFbGVtZW50KGluY2x1ZGVzLCBpbmNsdWRlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluY2x1ZGVzLmZvckVhY2goaW5jbHVkZSA9PiB7XHJcbiAgICAgIHRoaXMuX2V4cGFuZEluY2x1ZGVBbGwuY2FsbChpbmNsdWRlLm1vZGVsLCBpbmNsdWRlKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIF9jb25mb3JtSW5kZXgoaW5kZXgpIHtcclxuICAgIGlmICghaW5kZXguZmllbGRzKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBcImZpZWxkc1wiIHByb3BlcnR5IGZvciBpbmRleCBkZWZpbml0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5kZXggPSBfLmRlZmF1bHRzKGluZGV4LCB7XHJcbiAgICAgIHR5cGU6ICcnLFxyXG4gICAgICBwYXJzZXI6IG51bGxcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChpbmRleC50eXBlICYmIGluZGV4LnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3VuaXF1ZScpIHtcclxuICAgICAgaW5kZXgudW5pcXVlID0gdHJ1ZTtcclxuICAgICAgZGVsZXRlIGluZGV4LnR5cGU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGluZGV4O1xyXG4gIH1cclxuXHJcblxyXG4gIHN0YXRpYyBfdW5pcUluY2x1ZGVzKG9wdGlvbnMpIHtcclxuICAgIGlmICghb3B0aW9ucy5pbmNsdWRlKSByZXR1cm47XHJcblxyXG4gICAgb3B0aW9ucy5pbmNsdWRlID0gXyhvcHRpb25zLmluY2x1ZGUpXHJcbiAgICAgIC5ncm91cEJ5KGluY2x1ZGUgPT4gYCR7aW5jbHVkZS5tb2RlbCAmJiBpbmNsdWRlLm1vZGVsLm5hbWV9LSR7aW5jbHVkZS5hc31gKVxyXG4gICAgICAubWFwKGluY2x1ZGVzID0+IHRoaXMuX2Fzc2lnbk9wdGlvbnMoLi4uaW5jbHVkZXMpKVxyXG4gICAgICAudmFsdWUoKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBfYmFzZU1lcmdlKC4uLmFyZ3MpIHtcclxuICAgIF8uYXNzaWduV2l0aCguLi5hcmdzKTtcclxuICAgIHRoaXMuX2NvbmZvcm1JbmNsdWRlcyhhcmdzWzBdLCB0aGlzKTtcclxuICAgIHRoaXMuX3VuaXFJbmNsdWRlcyhhcmdzWzBdKTtcclxuICAgIHJldHVybiBhcmdzWzBdO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIF9tZXJnZUZ1bmN0aW9uKG9ialZhbHVlLCBzcmNWYWx1ZSwga2V5KSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpWYWx1ZSkgJiYgQXJyYXkuaXNBcnJheShzcmNWYWx1ZSkpIHtcclxuICAgICAgcmV0dXJuIF8udW5pb24ob2JqVmFsdWUsIHNyY1ZhbHVlKTtcclxuICAgIH1cclxuICAgIGlmIChrZXkgPT09ICd3aGVyZScgfHwga2V5ID09PSAnaGF2aW5nJykge1xyXG4gICAgICBpZiAoc3JjVmFsdWUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QpIHtcclxuICAgICAgICBzcmNWYWx1ZSA9IHsgW09wLmFuZF06IHNyY1ZhbHVlIH07XHJcbiAgICAgIH1cclxuICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdChvYmpWYWx1ZSkgJiYgXy5pc1BsYWluT2JqZWN0KHNyY1ZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKG9ialZhbHVlLCBzcmNWYWx1ZSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnYXR0cmlidXRlcycgJiYgXy5pc1BsYWluT2JqZWN0KG9ialZhbHVlKSAmJiBfLmlzUGxhaW5PYmplY3Qoc3JjVmFsdWUpKSB7XHJcbiAgICAgIHJldHVybiBfLmFzc2lnbldpdGgob2JqVmFsdWUsIHNyY1ZhbHVlLCAob2JqVmFsdWUsIHNyY1ZhbHVlKSA9PiB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqVmFsdWUpICYmIEFycmF5LmlzQXJyYXkoc3JjVmFsdWUpKSB7XHJcbiAgICAgICAgICByZXR1cm4gXy51bmlvbihvYmpWYWx1ZSwgc3JjVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICAvLyBJZiB3ZSBoYXZlIGEgcG9zc2libGUgb2JqZWN0L2FycmF5IHRvIGNsb25lLCB3ZSB0cnkgaXQuXHJcbiAgICAvLyBPdGhlcndpc2UsIHdlIHJldHVybiB0aGUgb3JpZ2luYWwgdmFsdWUgd2hlbiBpdCdzIG5vdCB1bmRlZmluZWQsXHJcbiAgICAvLyBvciB0aGUgcmVzdWx0aW5nIG9iamVjdCBpbiB0aGF0IGNhc2UuXHJcbiAgICBpZiAoc3JjVmFsdWUpIHtcclxuICAgICAgcmV0dXJuIFV0aWxzLmNsb25lRGVlcChzcmNWYWx1ZSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc3JjVmFsdWUgPT09IHVuZGVmaW5lZCA/IG9ialZhbHVlIDogc3JjVmFsdWU7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgX2Fzc2lnbk9wdGlvbnMoLi4uYXJncykge1xyXG4gICAgcmV0dXJuIHRoaXMuX2Jhc2VNZXJnZSguLi5hcmdzLCB0aGlzLl9tZXJnZUZ1bmN0aW9uKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBfZGVmYXVsdHNPcHRpb25zKHRhcmdldCwgb3B0cykge1xyXG4gICAgcmV0dXJuIHRoaXMuX2Jhc2VNZXJnZSh0YXJnZXQsIG9wdHMsIChzcmNWYWx1ZSwgb2JqVmFsdWUsIGtleSkgPT4ge1xyXG4gICAgICByZXR1cm4gdGhpcy5fbWVyZ2VGdW5jdGlvbihvYmpWYWx1ZSwgc3JjVmFsdWUsIGtleSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemUgYSBtb2RlbCwgcmVwcmVzZW50aW5nIGEgdGFibGUgaW4gdGhlIERCLCB3aXRoIGF0dHJpYnV0ZXMgYW5kIG9wdGlvbnMuXHJcbiAgICpcclxuICAgKiBUaGUgdGFibGUgY29sdW1ucyBhcmUgZGVmaW5lZCBieSB0aGUgaGFzaCB0aGF0IGlzIGdpdmVuIGFzIHRoZSBmaXJzdCBhcmd1bWVudC5cclxuICAgKiBFYWNoIGF0dHJpYnV0ZSBvZiB0aGUgaGFzaCByZXByZXNlbnRzIGEgY29sdW1uLlxyXG4gICAqXHJcbiAgICogRm9yIG1vcmUgYWJvdXQgPGEgaHJlZj1cIi9tYW51YWwvdHV0b3JpYWwvbW9kZWxzLWRlZmluaXRpb24uaHRtbCN2YWxpZGF0aW9uc1wiLz5WYWxpZGF0aW9uczwvYT5cclxuICAgKlxyXG4gICAqIE1vcmUgZXhhbXBsZXMsIDxhIGhyZWY9XCIvbWFudWFsL3R1dG9yaWFsL21vZGVscy1kZWZpbml0aW9uLmh0bWxcIi8+TW9kZWwgRGVmaW5pdGlvbjwvYT5cclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogUHJvamVjdC5pbml0KHtcclxuICAgKiAgIGNvbHVtbkE6IHtcclxuICAgKiAgICAgdHlwZTogU2VxdWVsaXplLkJPT0xFQU4sXHJcbiAgICogICAgIHZhbGlkYXRlOiB7XHJcbiAgICogICAgICAgaXM6IFsnW2Etel0nLCdpJ10sICAgICAgICAvLyB3aWxsIG9ubHkgYWxsb3cgbGV0dGVyc1xyXG4gICAqICAgICAgIG1heDogMjMsICAgICAgICAgICAgICAgICAgLy8gb25seSBhbGxvdyB2YWx1ZXMgPD0gMjNcclxuICAgKiAgICAgICBpc0luOiB7XHJcbiAgICogICAgICAgICBhcmdzOiBbWydlbicsICd6aCddXSxcclxuICAgKiAgICAgICAgIG1zZzogXCJNdXN0IGJlIEVuZ2xpc2ggb3IgQ2hpbmVzZVwiXHJcbiAgICogICAgICAgfVxyXG4gICAqICAgICB9LFxyXG4gICAqICAgICBmaWVsZDogJ2NvbHVtbl9hJ1xyXG4gICAqICAgICAvLyBPdGhlciBhdHRyaWJ1dGVzIGhlcmVcclxuICAgKiAgIH0sXHJcbiAgICogICBjb2x1bW5COiBTZXF1ZWxpemUuU1RSSU5HLFxyXG4gICAqICAgY29sdW1uQzogJ01ZIFZFUlkgT1dOIENPTFVNTiBUWVBFJ1xyXG4gICAqIH0sIHtzZXF1ZWxpemV9KVxyXG4gICAqXHJcbiAgICogc2VxdWVsaXplLm1vZGVscy5tb2RlbE5hbWUgLy8gVGhlIG1vZGVsIHdpbGwgbm93IGJlIGF2YWlsYWJsZSBpbiBtb2RlbHMgdW5kZXIgdGhlIGNsYXNzIG5hbWVcclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgRGF0YVR5cGVzfVxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgSG9va3N9XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzIEFuIG9iamVjdCwgd2hlcmUgZWFjaCBhdHRyaWJ1dGUgaXMgYSBjb2x1bW4gb2YgdGhlIHRhYmxlLiBFYWNoIGNvbHVtbiBjYW4gYmUgZWl0aGVyIGEgRGF0YVR5cGUsIGEgc3RyaW5nIG9yIGEgdHlwZS1kZXNjcmlwdGlvbiBvYmplY3QsIHdpdGggdGhlIHByb3BlcnRpZXMgZGVzY3JpYmVkIGJlbG93OlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfERhdGFUeXBlc3xPYmplY3R9IGF0dHJpYnV0ZXMuY29sdW1uIFRoZSBkZXNjcmlwdGlvbiBvZiBhIGRhdGFiYXNlIGNvbHVtblxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfERhdGFUeXBlc30gICAgICAgIGF0dHJpYnV0ZXMuY29sdW1uLnR5cGUgQSBzdHJpbmcgb3IgYSBkYXRhIHR5cGVcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4uYWxsb3dOdWxsPXRydWVdIElmIGZhbHNlLCB0aGUgY29sdW1uIHdpbGwgaGF2ZSBhIE5PVCBOVUxMIGNvbnN0cmFpbnQsIGFuZCBhIG5vdCBudWxsIHZhbGlkYXRpb24gd2lsbCBiZSBydW4gYmVmb3JlIGFuIGluc3RhbmNlIGlzIHNhdmVkLlxyXG4gICAqIEBwYXJhbSB7YW55fSAgICAgICAgICAgICAgICAgICAgIFthdHRyaWJ1dGVzLmNvbHVtbi5kZWZhdWx0VmFsdWU9bnVsbF0gQSBsaXRlcmFsIGRlZmF1bHQgdmFsdWUsIGEgSmF2YVNjcmlwdCBmdW5jdGlvbiwgb3IgYW4gU1FMIGZ1bmN0aW9uIChzZWUgYHNlcXVlbGl6ZS5mbmApXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8Ym9vbGVhbn0gICAgICAgICAgW2F0dHJpYnV0ZXMuY29sdW1uLnVuaXF1ZT1mYWxzZV0gSWYgdHJ1ZSwgdGhlIGNvbHVtbiB3aWxsIGdldCBhIHVuaXF1ZSBjb25zdHJhaW50LiBJZiBhIHN0cmluZyBpcyBwcm92aWRlZCwgdGhlIGNvbHVtbiB3aWxsIGJlIHBhcnQgb2YgYSBjb21wb3NpdGUgdW5pcXVlIGluZGV4LiBJZiBtdWx0aXBsZSBjb2x1bW5zIGhhdmUgdGhlIHNhbWUgc3RyaW5nLCB0aGV5IHdpbGwgYmUgcGFydCBvZiB0aGUgc2FtZSB1bmlxdWUgaW5kZXhcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4ucHJpbWFyeUtleT1mYWxzZV0gSWYgdHJ1ZSwgdGhpcyBhdHRyaWJ1dGUgd2lsbCBiZSBtYXJrZWQgYXMgcHJpbWFyeSBrZXlcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4uZmllbGQ9bnVsbF0gSWYgc2V0LCBzZXF1ZWxpemUgd2lsbCBtYXAgdGhlIGF0dHJpYnV0ZSBuYW1lIHRvIGEgZGlmZmVyZW50IG5hbWUgaW4gdGhlIGRhdGFiYXNlXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29sdW1uLmF1dG9JbmNyZW1lbnQ9ZmFsc2VdIElmIHRydWUsIHRoaXMgY29sdW1uIHdpbGwgYmUgc2V0IHRvIGF1dG8gaW5jcmVtZW50XHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29sdW1uLmF1dG9JbmNyZW1lbnRJZGVudGl0eT1mYWxzZV0gSWYgdHJ1ZSwgY29tYmluZWQgd2l0aCBhdXRvSW5jcmVtZW50PXRydWUsIHdpbGwgdXNlIFBvc3RncmVzIGBHRU5FUkFURUQgQlkgREVGQVVMVCBBUyBJREVOVElUWWAgaW5zdGVhZCBvZiBgU0VSSUFMYC4gUG9zdGdyZXMgMTArIG9ubHkuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29sdW1uLmNvbW1lbnQ9bnVsbF0gQ29tbWVudCBmb3IgdGhpcyBjb2x1bW5cclxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb2RlbH0gICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4ucmVmZXJlbmNlcz1udWxsXSBBbiBvYmplY3Qgd2l0aCByZWZlcmVuY2UgY29uZmlndXJhdGlvbnNcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb2RlbH0gICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4ucmVmZXJlbmNlcy5tb2RlbF0gSWYgdGhpcyBjb2x1bW4gcmVmZXJlbmNlcyBhbm90aGVyIHRhYmxlLCBwcm92aWRlIGl0IGhlcmUgYXMgYSBNb2RlbCwgb3IgYSBzdHJpbmdcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4ucmVmZXJlbmNlcy5rZXk9J2lkJ10gVGhlIGNvbHVtbiBvZiB0aGUgZm9yZWlnbiB0YWJsZSB0aGF0IHRoaXMgY29sdW1uIHJlZmVyZW5jZXNcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4ub25VcGRhdGVdIFdoYXQgc2hvdWxkIGhhcHBlbiB3aGVuIHRoZSByZWZlcmVuY2VkIGtleSBpcyB1cGRhdGVkLiBPbmUgb2YgQ0FTQ0FERSwgUkVTVFJJQ1QsIFNFVCBERUZBVUxULCBTRVQgTlVMTCBvciBOTyBBQ1RJT05cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4ub25EZWxldGVdIFdoYXQgc2hvdWxkIGhhcHBlbiB3aGVuIHRoZSByZWZlcmVuY2VkIGtleSBpcyBkZWxldGVkLiBPbmUgb2YgQ0FTQ0FERSwgUkVTVFJJQ1QsIFNFVCBERUZBVUxULCBTRVQgTlVMTCBvciBOTyBBQ1RJT05cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4uZ2V0XSBQcm92aWRlIGEgY3VzdG9tIGdldHRlciBmb3IgdGhpcyBjb2x1bW4uIFVzZSBgdGhpcy5nZXREYXRhVmFsdWUoU3RyaW5nKWAgdG8gbWFuaXB1bGF0ZSB0aGUgdW5kZXJseWluZyB2YWx1ZXMuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgICAgICAgICAgICAgW2F0dHJpYnV0ZXMuY29sdW1uLnNldF0gUHJvdmlkZSBhIGN1c3RvbSBzZXR0ZXIgZm9yIHRoaXMgY29sdW1uLiBVc2UgYHRoaXMuc2V0RGF0YVZhbHVlKFN0cmluZywgVmFsdWUpYCB0byBtYW5pcHVsYXRlIHRoZSB1bmRlcmx5aW5nIHZhbHVlcy5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgICAgICAgICBbYXR0cmlidXRlcy5jb2x1bW4udmFsaWRhdGVdIEFuIG9iamVjdCBvZiB2YWxpZGF0aW9ucyB0byBleGVjdXRlIGZvciB0aGlzIGNvbHVtbiBldmVyeSB0aW1lIHRoZSBtb2RlbCBpcyBzYXZlZC4gQ2FuIGJlIGVpdGhlciB0aGUgbmFtZSBvZiBhIHZhbGlkYXRpb24gcHJvdmlkZWQgYnkgdmFsaWRhdG9yLmpzLCBhIHZhbGlkYXRpb24gZnVuY3Rpb24gcHJvdmlkZWQgYnkgZXh0ZW5kaW5nIHZhbGlkYXRvci5qcyAoc2VlIHRoZSBgREFPVmFsaWRhdG9yYCBwcm9wZXJ0eSBmb3IgbW9yZSBkZXRhaWxzKSwgb3IgYSBjdXN0b20gdmFsaWRhdGlvbiBmdW5jdGlvbi4gQ3VzdG9tIHZhbGlkYXRpb24gZnVuY3Rpb25zIGFyZSBjYWxsZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGZpZWxkIGFuZCB0aGUgaW5zdGFuY2UgaXRzZWxmIGFzIHRoZSBgdGhpc2AgYmluZGluZywgYW5kIGNhbiBwb3NzaWJseSB0YWtlIGEgc2Vjb25kIGNhbGxiYWNrIGFyZ3VtZW50LCB0byBzaWduYWwgdGhhdCB0aGV5IGFyZSBhc3luY2hyb25vdXMuIElmIHRoZSB2YWxpZGF0b3IgaXMgc3luYywgaXQgc2hvdWxkIHRocm93IGluIHRoZSBjYXNlIG9mIGEgZmFpbGVkIHZhbGlkYXRpb247IGlmIGl0IGlzIGFzeW5jLCB0aGUgY2FsbGJhY2sgc2hvdWxkIGJlIGNhbGxlZCB3aXRoIHRoZSBlcnJvciB0ZXh0LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIG9wdGlvbnMgVGhlc2Ugb3B0aW9ucyBhcmUgbWVyZ2VkIHdpdGggdGhlIGRlZmF1bHQgZGVmaW5lIG9wdGlvbnMgcHJvdmlkZWQgdG8gdGhlIFNlcXVlbGl6ZSBjb25zdHJ1Y3RvclxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIG9wdGlvbnMuc2VxdWVsaXplIERlZmluZSB0aGUgc2VxdWVsaXplIGluc3RhbmNlIHRvIGF0dGFjaCB0byB0aGUgbmV3IE1vZGVsLiBUaHJvdyBlcnJvciBpZiBub25lIGlzIHByb3ZpZGVkLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLm1vZGVsTmFtZV0gU2V0IG5hbWUgb2YgdGhlIG1vZGVsLiBCeSBkZWZhdWx0IGl0cyBzYW1lIGFzIENsYXNzIG5hbWUuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuZGVmYXVsdFNjb3BlPXt9XSBEZWZpbmUgdGhlIGRlZmF1bHQgc2VhcmNoIHNjb3BlIHRvIHVzZSBmb3IgdGhpcyBtb2RlbC4gU2NvcGVzIGhhdmUgdGhlIHNhbWUgZm9ybSBhcyB0aGUgb3B0aW9ucyBwYXNzZWQgdG8gZmluZCAvIGZpbmRBbGxcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgICAgICAgICBbb3B0aW9ucy5zY29wZXNdIE1vcmUgc2NvcGVzLCBkZWZpbmVkIGluIHRoZSBzYW1lIHdheSBhcyBkZWZhdWx0U2NvcGUgYWJvdmUuIFNlZSBgTW9kZWwuc2NvcGVgIGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IGhvdyBzY29wZXMgYXJlIGRlZmluZWQsIGFuZCB3aGF0IHlvdSBjYW4gZG8gd2l0aCB0aGVtXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgW29wdGlvbnMub21pdE51bGxdIERvbid0IHBlcnNpc3QgbnVsbCB2YWx1ZXMuIFRoaXMgbWVhbnMgdGhhdCBhbGwgY29sdW1ucyB3aXRoIG51bGwgdmFsdWVzIHdpbGwgbm90IGJlIHNhdmVkXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgW29wdGlvbnMudGltZXN0YW1wcz10cnVlXSBBZGRzIGNyZWF0ZWRBdCBhbmQgdXBkYXRlZEF0IHRpbWVzdGFtcHMgdG8gdGhlIG1vZGVsLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIFtvcHRpb25zLnBhcmFub2lkPWZhbHNlXSBDYWxsaW5nIGBkZXN0cm95YCB3aWxsIG5vdCBkZWxldGUgdGhlIG1vZGVsLCBidXQgaW5zdGVhZCBzZXQgYSBgZGVsZXRlZEF0YCB0aW1lc3RhbXAgaWYgdGhpcyBpcyB0cnVlLiBOZWVkcyBgdGltZXN0YW1wcz10cnVlYCB0byB3b3JrXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgW29wdGlvbnMudW5kZXJzY29yZWQ9ZmFsc2VdIEFkZCB1bmRlcnNjb3JlZCBmaWVsZCB0byBhbGwgYXR0cmlidXRlcywgdGhpcyBjb3ZlcnMgdXNlciBkZWZpbmVkIGF0dHJpYnV0ZXMsIHRpbWVzdGFtcHMgYW5kIGZvcmVpZ24ga2V5cy4gV2lsbCBub3QgYWZmZWN0IGF0dHJpYnV0ZXMgd2l0aCBleHBsaWNpdGx5IHNldCBgZmllbGRgIG9wdGlvblxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIFtvcHRpb25zLmZyZWV6ZVRhYmxlTmFtZT1mYWxzZV0gSWYgZnJlZXplVGFibGVOYW1lIGlzIHRydWUsIHNlcXVlbGl6ZSB3aWxsIG5vdCB0cnkgdG8gYWx0ZXIgdGhlIG1vZGVsIG5hbWUgdG8gZ2V0IHRoZSB0YWJsZSBuYW1lLiBPdGhlcndpc2UsIHRoZSBtb2RlbCBuYW1lIHdpbGwgYmUgcGx1cmFsaXplZFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLm5hbWVdIEFuIG9iamVjdCB3aXRoIHR3byBhdHRyaWJ1dGVzLCBgc2luZ3VsYXJgIGFuZCBgcGx1cmFsYCwgd2hpY2ggYXJlIHVzZWQgd2hlbiB0aGlzIG1vZGVsIGlzIGFzc29jaWF0ZWQgdG8gb3RoZXJzLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLm5hbWUuc2luZ3VsYXI9VXRpbHMuc2luZ3VsYXJpemUobW9kZWxOYW1lKV0gU2luZ3VsYXIgbmFtZSBmb3IgbW9kZWxcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbb3B0aW9ucy5uYW1lLnBsdXJhbD1VdGlscy5wbHVyYWxpemUobW9kZWxOYW1lKV0gUGx1cmFsIG5hbWUgZm9yIG1vZGVsXHJcbiAgICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSAgICAgICAgICAgW29wdGlvbnMuaW5kZXhlc10gaW5kZXhlcyBkZWZpbml0aW9uc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluZGV4ZXNbXS5uYW1lXSBUaGUgbmFtZSBvZiB0aGUgaW5kZXguIERlZmF1bHRzIHRvIG1vZGVsIG5hbWUgKyBfICsgZmllbGRzIGNvbmNhdGVuYXRlZFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluZGV4ZXNbXS50eXBlXSBJbmRleCB0eXBlLiBPbmx5IHVzZWQgYnkgbXlzcWwuIE9uZSBvZiBgVU5JUVVFYCwgYEZVTExURVhUYCBhbmQgYFNQQVRJQUxgXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5kZXhlc1tdLnVzaW5nXSBUaGUgbWV0aG9kIHRvIGNyZWF0ZSB0aGUgaW5kZXggYnkgKGBVU0lOR2Agc3RhdGVtZW50IGluIFNRTCkuIEJUUkVFIGFuZCBIQVNIIGFyZSBzdXBwb3J0ZWQgYnkgbXlzcWwgYW5kIHBvc3RncmVzLCBhbmQgcG9zdGdyZXMgYWRkaXRpb25hbGx5IHN1cHBvcnRzIEdJU1QgYW5kIEdJTi5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmRleGVzW10ub3BlcmF0b3JdIFNwZWNpZnkgaW5kZXggb3BlcmF0b3IuXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5kZXhlc1tdLnVuaXF1ZT1mYWxzZV0gU2hvdWxkIHRoZSBpbmRleCBieSB1bmlxdWU/IENhbiBhbHNvIGJlIHRyaWdnZXJlZCBieSBzZXR0aW5nIHR5cGUgdG8gYFVOSVFVRWBcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmRleGVzW10uY29uY3VycmVudGx5PWZhbHNlXSBQb3N0Z3Jlc1NRTCB3aWxsIGJ1aWxkIHRoZSBpbmRleCB3aXRob3V0IHRha2luZyBhbnkgd3JpdGUgbG9ja3MuIFBvc3RncmVzIG9ubHlcclxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xPYmplY3Q+fSAgICBbb3B0aW9ucy5pbmRleGVzW10uZmllbGRzXSBBbiBhcnJheSBvZiB0aGUgZmllbGRzIHRvIGluZGV4LiBFYWNoIGZpZWxkIGNhbiBlaXRoZXIgYmUgYSBzdHJpbmcgY29udGFpbmluZyB0aGUgbmFtZSBvZiB0aGUgZmllbGQsIGEgc2VxdWVsaXplIG9iamVjdCAoZS5nIGBzZXF1ZWxpemUuZm5gKSwgb3IgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGVzOiBgYXR0cmlidXRlYCAoZmllbGQgbmFtZSksIGBsZW5ndGhgIChjcmVhdGUgYSBwcmVmaXggaW5kZXggb2YgbGVuZ3RoIGNoYXJzKSwgYG9yZGVyYCAodGhlIGRpcmVjdGlvbiB0aGUgY29sdW1uIHNob3VsZCBiZSBzb3J0ZWQgaW4pLCBgY29sbGF0ZWAgKHRoZSBjb2xsYXRpb24gKHNvcnQgb3JkZXIpIGZvciB0aGUgY29sdW1uKVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59ICAgICAgICAgIFtvcHRpb25zLmNyZWF0ZWRBdF0gT3ZlcnJpZGUgdGhlIG5hbWUgb2YgdGhlIGNyZWF0ZWRBdCBhdHRyaWJ1dGUgaWYgYSBzdHJpbmcgaXMgcHJvdmlkZWQsIG9yIGRpc2FibGUgaXQgaWYgZmFsc2UuIFRpbWVzdGFtcHMgbXVzdCBiZSB0cnVlLiBVbmRlcnNjb3JlZCBmaWVsZCB3aWxsIGJlIHNldCB3aXRoIHVuZGVyc2NvcmVkIHNldHRpbmcuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8Ym9vbGVhbn0gICAgICAgICAgW29wdGlvbnMudXBkYXRlZEF0XSBPdmVycmlkZSB0aGUgbmFtZSBvZiB0aGUgdXBkYXRlZEF0IGF0dHJpYnV0ZSBpZiBhIHN0cmluZyBpcyBwcm92aWRlZCwgb3IgZGlzYWJsZSBpdCBpZiBmYWxzZS4gVGltZXN0YW1wcyBtdXN0IGJlIHRydWUuIFVuZGVyc2NvcmVkIGZpZWxkIHdpbGwgYmUgc2V0IHdpdGggdW5kZXJzY29yZWQgc2V0dGluZy5cclxuICAgKiBAcGFyYW0ge3N0cmluZ3xib29sZWFufSAgICAgICAgICBbb3B0aW9ucy5kZWxldGVkQXRdIE92ZXJyaWRlIHRoZSBuYW1lIG9mIHRoZSBkZWxldGVkQXQgYXR0cmlidXRlIGlmIGEgc3RyaW5nIGlzIHByb3ZpZGVkLCBvciBkaXNhYmxlIGl0IGlmIGZhbHNlLiBUaW1lc3RhbXBzIG11c3QgYmUgdHJ1ZS4gVW5kZXJzY29yZWQgZmllbGQgd2lsbCBiZSBzZXQgd2l0aCB1bmRlcnNjb3JlZCBzZXR0aW5nLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIFtvcHRpb25zLnRhYmxlTmFtZV0gRGVmYXVsdHMgdG8gcGx1cmFsaXplZCBtb2RlbCBuYW1lLCB1bmxlc3MgZnJlZXplVGFibGVOYW1lIGlzIHRydWUsIGluIHdoaWNoIGNhc2UgaXQgdXNlcyBtb2RlbCBuYW1lIHZlcmJhdGltXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuc2NoZW1hPSdwdWJsaWMnXSBzY2hlbWFcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbb3B0aW9ucy5lbmdpbmVdIFNwZWNpZnkgZW5naW5lIGZvciBtb2RlbCdzIHRhYmxlXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuY2hhcnNldF0gU3BlY2lmeSBjaGFyc2V0IGZvciBtb2RlbCdzIHRhYmxlXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuY29tbWVudF0gU3BlY2lmeSBjb21tZW50IGZvciBtb2RlbCdzIHRhYmxlXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuY29sbGF0ZV0gU3BlY2lmeSBjb2xsYXRpb24gZm9yIG1vZGVsJ3MgdGFibGVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbml0aWFsQXV0b0luY3JlbWVudF0gU2V0IHRoZSBpbml0aWFsIEFVVE9fSU5DUkVNRU5UIHZhbHVlIGZvciB0aGUgdGFibGUgaW4gTXlTUUwuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaG9va3NdIEFuIG9iamVjdCBvZiBob29rIGZ1bmN0aW9uIHRoYXQgYXJlIGNhbGxlZCBiZWZvcmUgYW5kIGFmdGVyIGNlcnRhaW4gbGlmZWN5Y2xlIGV2ZW50cy4gVGhlIHBvc3NpYmxlIGhvb2tzIGFyZTogYmVmb3JlVmFsaWRhdGUsIGFmdGVyVmFsaWRhdGUsIHZhbGlkYXRpb25GYWlsZWQsIGJlZm9yZUJ1bGtDcmVhdGUsIGJlZm9yZUJ1bGtEZXN0cm95LCBiZWZvcmVCdWxrVXBkYXRlLCBiZWZvcmVDcmVhdGUsIGJlZm9yZURlc3Ryb3ksIGJlZm9yZVVwZGF0ZSwgYWZ0ZXJDcmVhdGUsIGJlZm9yZVNhdmUsIGFmdGVyRGVzdHJveSwgYWZ0ZXJVcGRhdGUsIGFmdGVyQnVsa0NyZWF0ZSwgYWZ0ZXJTYXZlLCBhZnRlckJ1bGtEZXN0cm95IGFuZCBhZnRlckJ1bGtVcGRhdGUuIFNlZSBIb29rcyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBob29rIGZ1bmN0aW9ucyBhbmQgdGhlaXIgc2lnbmF0dXJlcy4gRWFjaCBwcm9wZXJ0eSBjYW4gZWl0aGVyIGJlIGEgZnVuY3Rpb24sIG9yIGFuIGFycmF5IG9mIGZ1bmN0aW9ucy5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgICAgICAgICBbb3B0aW9ucy52YWxpZGF0ZV0gQW4gb2JqZWN0IG9mIG1vZGVsIHdpZGUgdmFsaWRhdGlvbnMuIFZhbGlkYXRpb25zIGhhdmUgYWNjZXNzIHRvIGFsbCBtb2RlbCB2YWx1ZXMgdmlhIGB0aGlzYC4gSWYgdGhlIHZhbGlkYXRvciBmdW5jdGlvbiB0YWtlcyBhbiBhcmd1bWVudCwgaXQgaXMgYXNzdW1lZCB0byBiZSBhc3luYywgYW5kIGlzIGNhbGxlZCB3aXRoIGEgY2FsbGJhY2sgdGhhdCBhY2NlcHRzIGFuIG9wdGlvbmFsIGVycm9yLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMge01vZGVsfVxyXG4gICAqL1xyXG4gIHN0YXRpYyBpbml0KGF0dHJpYnV0ZXMsIG9wdGlvbnMgPSB7fSkge1xyXG4gICAgaWYgKCFvcHRpb25zLnNlcXVlbGl6ZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIFNlcXVlbGl6ZSBpbnN0YW5jZSBwYXNzZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNlcXVlbGl6ZSA9IG9wdGlvbnMuc2VxdWVsaXplO1xyXG5cclxuICAgIGNvbnN0IGdsb2JhbE9wdGlvbnMgPSB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zO1xyXG5cclxuICAgIG9wdGlvbnMgPSBVdGlscy5tZXJnZShfLmNsb25lRGVlcChnbG9iYWxPcHRpb25zLmRlZmluZSksIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmICghb3B0aW9ucy5tb2RlbE5hbWUpIHtcclxuICAgICAgb3B0aW9ucy5tb2RlbE5hbWUgPSB0aGlzLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IFV0aWxzLm1lcmdlKHtcclxuICAgICAgbmFtZToge1xyXG4gICAgICAgIHBsdXJhbDogVXRpbHMucGx1cmFsaXplKG9wdGlvbnMubW9kZWxOYW1lKSxcclxuICAgICAgICBzaW5ndWxhcjogVXRpbHMuc2luZ3VsYXJpemUob3B0aW9ucy5tb2RlbE5hbWUpXHJcbiAgICAgIH0sXHJcbiAgICAgIGluZGV4ZXM6IFtdLFxyXG4gICAgICBvbWl0TnVsbDogZ2xvYmFsT3B0aW9ucy5vbWl0TnVsbCxcclxuICAgICAgc2NoZW1hOiBnbG9iYWxPcHRpb25zLnNjaGVtYVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5zZXF1ZWxpemUucnVuSG9va3MoJ2JlZm9yZURlZmluZScsIGF0dHJpYnV0ZXMsIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLm1vZGVsTmFtZSAhPT0gdGhpcy5uYW1lKSB7XHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnbmFtZScsIHsgdmFsdWU6IG9wdGlvbnMubW9kZWxOYW1lIH0pO1xyXG4gICAgfVxyXG4gICAgZGVsZXRlIG9wdGlvbnMubW9kZWxOYW1lO1xyXG5cclxuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICB0aW1lc3RhbXBzOiB0cnVlLFxyXG4gICAgICB2YWxpZGF0ZToge30sXHJcbiAgICAgIGZyZWV6ZVRhYmxlTmFtZTogZmFsc2UsXHJcbiAgICAgIHVuZGVyc2NvcmVkOiBmYWxzZSxcclxuICAgICAgcGFyYW5vaWQ6IGZhbHNlLFxyXG4gICAgICByZWplY3RPbkVtcHR5OiBmYWxzZSxcclxuICAgICAgd2hlcmVDb2xsZWN0aW9uOiBudWxsLFxyXG4gICAgICBzY2hlbWE6IG51bGwsXHJcbiAgICAgIHNjaGVtYURlbGltaXRlcjogJycsXHJcbiAgICAgIGRlZmF1bHRTY29wZToge30sXHJcbiAgICAgIHNjb3Blczoge30sXHJcbiAgICAgIGluZGV4ZXM6IFtdXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBpZiB5b3UgY2FsbCBcImRlZmluZVwiIG11bHRpcGxlIHRpbWVzIGZvciB0aGUgc2FtZSBtb2RlbE5hbWUsIGRvIG5vdCBjbHV0dGVyIHRoZSBmYWN0b3J5XHJcbiAgICBpZiAodGhpcy5zZXF1ZWxpemUuaXNEZWZpbmVkKHRoaXMubmFtZSkpIHtcclxuICAgICAgdGhpcy5zZXF1ZWxpemUubW9kZWxNYW5hZ2VyLnJlbW92ZU1vZGVsKHRoaXMuc2VxdWVsaXplLm1vZGVsTWFuYWdlci5nZXRNb2RlbCh0aGlzLm5hbWUpKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmFzc29jaWF0aW9ucyA9IHt9O1xyXG4gICAgdGhpcy5fc2V0dXBIb29rcyhvcHRpb25zLmhvb2tzKTtcclxuXHJcbiAgICB0aGlzLnVuZGVyc2NvcmVkID0gdGhpcy5vcHRpb25zLnVuZGVyc2NvcmVkO1xyXG5cclxuICAgIGlmICghdGhpcy5vcHRpb25zLnRhYmxlTmFtZSkge1xyXG4gICAgICB0aGlzLnRhYmxlTmFtZSA9IHRoaXMub3B0aW9ucy5mcmVlemVUYWJsZU5hbWUgPyB0aGlzLm5hbWUgOiBVdGlscy51bmRlcnNjb3JlZElmKFV0aWxzLnBsdXJhbGl6ZSh0aGlzLm5hbWUpLCB0aGlzLnVuZGVyc2NvcmVkKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMudGFibGVOYW1lID0gdGhpcy5vcHRpb25zLnRhYmxlTmFtZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9zY2hlbWEgPSB0aGlzLm9wdGlvbnMuc2NoZW1hO1xyXG4gICAgdGhpcy5fc2NoZW1hRGVsaW1pdGVyID0gdGhpcy5vcHRpb25zLnNjaGVtYURlbGltaXRlcjtcclxuXHJcbiAgICAvLyBlcnJvciBjaGVjayBvcHRpb25zXHJcbiAgICBfLmVhY2gob3B0aW9ucy52YWxpZGF0ZSwgKHZhbGlkYXRvciwgdmFsaWRhdG9yVHlwZSkgPT4ge1xyXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGF0dHJpYnV0ZXMsIHZhbGlkYXRvclR5cGUpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBIG1vZGVsIHZhbGlkYXRvciBmdW5jdGlvbiBtdXN0IG5vdCBoYXZlIHRoZSBzYW1lIG5hbWUgYXMgYSBmaWVsZC4gTW9kZWw6ICR7dGhpcy5uYW1lfSwgZmllbGQvdmFsaWRhdGlvbiBuYW1lOiAke3ZhbGlkYXRvclR5cGV9YCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0eXBlb2YgdmFsaWRhdG9yICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNZW1iZXJzIG9mIHRoZSB2YWxpZGF0ZSBvcHRpb24gbXVzdCBiZSBmdW5jdGlvbnMuIE1vZGVsOiAke3RoaXMubmFtZX0sIGVycm9yIHdpdGggdmFsaWRhdGUgbWVtYmVyICR7dmFsaWRhdG9yVHlwZX1gKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5yYXdBdHRyaWJ1dGVzID0gXy5tYXBWYWx1ZXMoYXR0cmlidXRlcywgKGF0dHJpYnV0ZSwgbmFtZSkgPT4ge1xyXG4gICAgICBhdHRyaWJ1dGUgPSB0aGlzLnNlcXVlbGl6ZS5ub3JtYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcclxuXHJcbiAgICAgIGlmIChhdHRyaWJ1dGUudHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlY29nbml6ZWQgZGF0YXR5cGUgZm9yIGF0dHJpYnV0ZSBcIiR7dGhpcy5uYW1lfS4ke25hbWV9XCJgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGF0dHJpYnV0ZS5hbGxvd051bGwgIT09IGZhbHNlICYmIF8uZ2V0KGF0dHJpYnV0ZSwgJ3ZhbGlkYXRlLm5vdE51bGwnKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBkZWZpbml0aW9uIGZvciBcIiR7dGhpcy5uYW1lfS4ke25hbWV9XCIsIFwibm90TnVsbFwiIHZhbGlkYXRvciBpcyBvbmx5IGFsbG93ZWQgd2l0aCBcImFsbG93TnVsbDpmYWxzZVwiYCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChfLmdldChhdHRyaWJ1dGUsICdyZWZlcmVuY2VzLm1vZGVsLnByb3RvdHlwZScpIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICBhdHRyaWJ1dGUucmVmZXJlbmNlcy5tb2RlbCA9IGF0dHJpYnV0ZS5yZWZlcmVuY2VzLm1vZGVsLmdldFRhYmxlTmFtZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gYXR0cmlidXRlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdGFibGVOYW1lID0gdGhpcy5nZXRUYWJsZU5hbWUoKTtcclxuICAgIHRoaXMuX2luZGV4ZXMgPSB0aGlzLm9wdGlvbnMuaW5kZXhlc1xyXG4gICAgICAubWFwKGluZGV4ID0+IFV0aWxzLm5hbWVJbmRleCh0aGlzLl9jb25mb3JtSW5kZXgoaW5kZXgpLCB0YWJsZU5hbWUpKTtcclxuXHJcbiAgICB0aGlzLnByaW1hcnlLZXlzID0ge307XHJcbiAgICB0aGlzLl9yZWFkT25seUF0dHJpYnV0ZXMgPSBuZXcgU2V0KCk7XHJcbiAgICB0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzID0ge307XHJcblxyXG4gICAgLy8gc2V0dXAgbmFtZXMgb2YgdGltZXN0YW1wIGF0dHJpYnV0ZXNcclxuICAgIGlmICh0aGlzLm9wdGlvbnMudGltZXN0YW1wcykge1xyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmNyZWF0ZWRBdCAhPT0gZmFsc2UpIHtcclxuICAgICAgICB0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdCA9IHRoaXMub3B0aW9ucy5jcmVhdGVkQXQgfHwgJ2NyZWF0ZWRBdCc7XHJcbiAgICAgICAgdGhpcy5fcmVhZE9ubHlBdHRyaWJ1dGVzLmFkZCh0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy51cGRhdGVkQXQgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgdGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXQgPSB0aGlzLm9wdGlvbnMudXBkYXRlZEF0IHx8ICd1cGRhdGVkQXQnO1xyXG4gICAgICAgIHRoaXMuX3JlYWRPbmx5QXR0cmlidXRlcy5hZGQodGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXQpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFyYW5vaWQgJiYgdGhpcy5vcHRpb25zLmRlbGV0ZWRBdCAhPT0gZmFsc2UpIHtcclxuICAgICAgICB0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdCA9IHRoaXMub3B0aW9ucy5kZWxldGVkQXQgfHwgJ2RlbGV0ZWRBdCc7XHJcbiAgICAgICAgdGhpcy5fcmVhZE9ubHlBdHRyaWJ1dGVzLmFkZCh0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXR1cCBuYW1lIGZvciB2ZXJzaW9uIGF0dHJpYnV0ZVxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy52ZXJzaW9uKSB7XHJcbiAgICAgIHRoaXMuX3ZlcnNpb25BdHRyaWJ1dGUgPSB0eXBlb2YgdGhpcy5vcHRpb25zLnZlcnNpb24gPT09ICdzdHJpbmcnID8gdGhpcy5vcHRpb25zLnZlcnNpb24gOiAndmVyc2lvbic7XHJcbiAgICAgIHRoaXMuX3JlYWRPbmx5QXR0cmlidXRlcy5hZGQodGhpcy5fdmVyc2lvbkF0dHJpYnV0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5faGFzUmVhZE9ubHlBdHRyaWJ1dGVzID0gdGhpcy5fcmVhZE9ubHlBdHRyaWJ1dGVzLnNpemUgPiAwO1xyXG5cclxuICAgIC8vIEFkZCBoZWFkIGFuZCB0YWlsIGRlZmF1bHQgYXR0cmlidXRlcyAoaWQsIHRpbWVzdGFtcHMpXHJcbiAgICB0aGlzLl9hZGREZWZhdWx0QXR0cmlidXRlcygpO1xyXG4gICAgdGhpcy5yZWZyZXNoQXR0cmlidXRlcygpO1xyXG4gICAgdGhpcy5fZmluZEF1dG9JbmNyZW1lbnRBdHRyaWJ1dGUoKTtcclxuXHJcbiAgICB0aGlzLl9zY29wZSA9IHRoaXMub3B0aW9ucy5kZWZhdWx0U2NvcGU7XHJcbiAgICB0aGlzLl9zY29wZU5hbWVzID0gWydkZWZhdWx0U2NvcGUnXTtcclxuXHJcbiAgICB0aGlzLnNlcXVlbGl6ZS5tb2RlbE1hbmFnZXIuYWRkTW9kZWwodGhpcyk7XHJcbiAgICB0aGlzLnNlcXVlbGl6ZS5ydW5Ib29rcygnYWZ0ZXJEZWZpbmUnLCB0aGlzKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHN0YXRpYyByZWZyZXNoQXR0cmlidXRlcygpIHtcclxuICAgIGNvbnN0IGF0dHJpYnV0ZU1hbmlwdWxhdGlvbiA9IHt9O1xyXG5cclxuICAgIHRoaXMucHJvdG90eXBlLl9jdXN0b21HZXR0ZXJzID0ge307XHJcbiAgICB0aGlzLnByb3RvdHlwZS5fY3VzdG9tU2V0dGVycyA9IHt9O1xyXG5cclxuICAgIFsnZ2V0JywgJ3NldCddLmZvckVhY2godHlwZSA9PiB7XHJcbiAgICAgIGNvbnN0IG9wdCA9IGAke3R5cGV9dGVyTWV0aG9kc2A7XHJcbiAgICAgIGNvbnN0IGZ1bmNzID0gXy5jbG9uZShfLmlzT2JqZWN0KHRoaXMub3B0aW9uc1tvcHRdKSA/IHRoaXMub3B0aW9uc1tvcHRdIDoge30pO1xyXG4gICAgICBjb25zdCBfY3VzdG9tID0gdHlwZSA9PT0gJ2dldCcgPyB0aGlzLnByb3RvdHlwZS5fY3VzdG9tR2V0dGVycyA6IHRoaXMucHJvdG90eXBlLl9jdXN0b21TZXR0ZXJzO1xyXG5cclxuICAgICAgXy5lYWNoKGZ1bmNzLCAobWV0aG9kLCBhdHRyaWJ1dGUpID0+IHtcclxuICAgICAgICBfY3VzdG9tW2F0dHJpYnV0ZV0gPSBtZXRob2Q7XHJcblxyXG4gICAgICAgIGlmICh0eXBlID09PSAnZ2V0Jykge1xyXG4gICAgICAgICAgZnVuY3NbYXR0cmlidXRlXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXQoYXR0cmlidXRlKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlID09PSAnc2V0Jykge1xyXG4gICAgICAgICAgZnVuY3NbYXR0cmlidXRlXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldChhdHRyaWJ1dGUsIHZhbHVlKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIF8uZWFjaCh0aGlzLnJhd0F0dHJpYnV0ZXMsIChvcHRpb25zLCBhdHRyaWJ1dGUpID0+IHtcclxuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsIHR5cGUpKSB7XHJcbiAgICAgICAgICBfY3VzdG9tW2F0dHJpYnV0ZV0gPSBvcHRpb25zW3R5cGVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGUgPT09ICdnZXQnKSB7XHJcbiAgICAgICAgICBmdW5jc1thdHRyaWJ1dGVdID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldChhdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGUgPT09ICdzZXQnKSB7XHJcbiAgICAgICAgICBmdW5jc1thdHRyaWJ1dGVdID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0KGF0dHJpYnV0ZSwgdmFsdWUpO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgXy5lYWNoKGZ1bmNzLCAoZmN0LCBuYW1lKSA9PiB7XHJcbiAgICAgICAgaWYgKCFhdHRyaWJ1dGVNYW5pcHVsYXRpb25bbmFtZV0pIHtcclxuICAgICAgICAgIGF0dHJpYnV0ZU1hbmlwdWxhdGlvbltuYW1lXSA9IHtcclxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBhdHRyaWJ1dGVNYW5pcHVsYXRpb25bbmFtZV1bdHlwZV0gPSBmY3Q7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5fZGF0YVR5cGVDaGFuZ2VzID0ge307XHJcbiAgICB0aGlzLl9kYXRhVHlwZVNhbml0aXplcnMgPSB7fTtcclxuXHJcbiAgICB0aGlzLl9oYXNCb29sZWFuQXR0cmlidXRlcyA9IGZhbHNlO1xyXG4gICAgdGhpcy5faGFzRGF0ZUF0dHJpYnV0ZXMgPSBmYWxzZTtcclxuICAgIHRoaXMuX2pzb25BdHRyaWJ1dGVzID0gbmV3IFNldCgpO1xyXG4gICAgdGhpcy5fdmlydHVhbEF0dHJpYnV0ZXMgPSBuZXcgU2V0KCk7XHJcbiAgICB0aGlzLl9kZWZhdWx0VmFsdWVzID0ge307XHJcbiAgICB0aGlzLnByb3RvdHlwZS52YWxpZGF0b3JzID0ge307XHJcblxyXG4gICAgdGhpcy5maWVsZFJhd0F0dHJpYnV0ZXNNYXAgPSB7fTtcclxuXHJcbiAgICB0aGlzLnByaW1hcnlLZXlzID0ge307XHJcbiAgICB0aGlzLnVuaXF1ZUtleXMgPSB7fTtcclxuXHJcbiAgICBfLmVhY2godGhpcy5yYXdBdHRyaWJ1dGVzLCAoZGVmaW5pdGlvbiwgbmFtZSkgPT4ge1xyXG4gICAgICBkZWZpbml0aW9uLnR5cGUgPSB0aGlzLnNlcXVlbGl6ZS5ub3JtYWxpemVEYXRhVHlwZShkZWZpbml0aW9uLnR5cGUpO1xyXG5cclxuICAgICAgZGVmaW5pdGlvbi5Nb2RlbCA9IHRoaXM7XHJcbiAgICAgIGRlZmluaXRpb24uZmllbGROYW1lID0gbmFtZTtcclxuICAgICAgZGVmaW5pdGlvbi5fbW9kZWxBdHRyaWJ1dGUgPSB0cnVlO1xyXG5cclxuICAgICAgaWYgKGRlZmluaXRpb24uZmllbGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGRlZmluaXRpb24uZmllbGQgPSBVdGlscy51bmRlcnNjb3JlZElmKG5hbWUsIHRoaXMudW5kZXJzY29yZWQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGVmaW5pdGlvbi5wcmltYXJ5S2V5ID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy5wcmltYXJ5S2V5c1tuYW1lXSA9IGRlZmluaXRpb247XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuZmllbGRSYXdBdHRyaWJ1dGVzTWFwW2RlZmluaXRpb24uZmllbGRdID0gZGVmaW5pdGlvbjtcclxuXHJcbiAgICAgIGlmIChkZWZpbml0aW9uLnR5cGUuX3Nhbml0aXplKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YVR5cGVTYW5pdGl6ZXJzW25hbWVdID0gZGVmaW5pdGlvbi50eXBlLl9zYW5pdGl6ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGRlZmluaXRpb24udHlwZS5faXNDaGFuZ2VkKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YVR5cGVDaGFuZ2VzW25hbWVdID0gZGVmaW5pdGlvbi50eXBlLl9pc0NoYW5nZWQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChkZWZpbml0aW9uLnR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuQk9PTEVBTikge1xyXG4gICAgICAgIHRoaXMuX2hhc0Jvb2xlYW5BdHRyaWJ1dGVzID0gdHJ1ZTtcclxuICAgICAgfSBlbHNlIGlmIChkZWZpbml0aW9uLnR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuREFURSB8fCBkZWZpbml0aW9uLnR5cGUgaW5zdGFuY2VvZiBEYXRhVHlwZXMuREFURU9OTFkpIHtcclxuICAgICAgICB0aGlzLl9oYXNEYXRlQXR0cmlidXRlcyA9IHRydWU7XHJcbiAgICAgIH0gZWxzZSBpZiAoZGVmaW5pdGlvbi50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkpTT04pIHtcclxuICAgICAgICB0aGlzLl9qc29uQXR0cmlidXRlcy5hZGQobmFtZSk7XHJcbiAgICAgIH0gZWxzZSBpZiAoZGVmaW5pdGlvbi50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLlZJUlRVQUwpIHtcclxuICAgICAgICB0aGlzLl92aXJ0dWFsQXR0cmlidXRlcy5hZGQobmFtZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGVmaW5pdGlvbiwgJ2RlZmF1bHRWYWx1ZScpKSB7XHJcbiAgICAgICAgdGhpcy5fZGVmYXVsdFZhbHVlc1tuYW1lXSA9ICgpID0+IFV0aWxzLnRvRGVmYXVsdFZhbHVlKGRlZmluaXRpb24uZGVmYXVsdFZhbHVlLCB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRlZmluaXRpb24sICd1bmlxdWUnKSAmJiBkZWZpbml0aW9uLnVuaXF1ZSkge1xyXG4gICAgICAgIGxldCBpZHhOYW1lO1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIHR5cGVvZiBkZWZpbml0aW9uLnVuaXF1ZSA9PT0gJ29iamVjdCcgJiZcclxuICAgICAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkZWZpbml0aW9uLnVuaXF1ZSwgJ25hbWUnKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgaWR4TmFtZSA9IGRlZmluaXRpb24udW5pcXVlLm5hbWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5pdGlvbi51bmlxdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICBpZHhOYW1lID0gZGVmaW5pdGlvbi51bmlxdWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlkeE5hbWUgPSBgJHt0aGlzLnRhYmxlTmFtZX1fJHtuYW1lfV91bmlxdWVgO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy51bmlxdWVLZXlzW2lkeE5hbWVdIHx8IHsgZmllbGRzOiBbXSB9O1xyXG5cclxuICAgICAgICBpZHguZmllbGRzLnB1c2goZGVmaW5pdGlvbi5maWVsZCk7XHJcbiAgICAgICAgaWR4Lm1zZyA9IGlkeC5tc2cgfHwgZGVmaW5pdGlvbi51bmlxdWUubXNnIHx8IG51bGw7XHJcbiAgICAgICAgaWR4Lm5hbWUgPSBpZHhOYW1lIHx8IGZhbHNlO1xyXG4gICAgICAgIGlkeC5jb2x1bW4gPSBuYW1lO1xyXG4gICAgICAgIGlkeC5jdXN0b21JbmRleCA9IGRlZmluaXRpb24udW5pcXVlICE9PSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLnVuaXF1ZUtleXNbaWR4TmFtZV0gPSBpZHg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGVmaW5pdGlvbiwgJ3ZhbGlkYXRlJykpIHtcclxuICAgICAgICB0aGlzLnByb3RvdHlwZS52YWxpZGF0b3JzW25hbWVdID0gZGVmaW5pdGlvbi52YWxpZGF0ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGRlZmluaXRpb24uaW5kZXggPT09IHRydWUgJiYgZGVmaW5pdGlvbi50eXBlIGluc3RhbmNlb2YgRGF0YVR5cGVzLkpTT05CKSB7XHJcbiAgICAgICAgdGhpcy5faW5kZXhlcy5wdXNoKFxyXG4gICAgICAgICAgVXRpbHMubmFtZUluZGV4KFxyXG4gICAgICAgICAgICB0aGlzLl9jb25mb3JtSW5kZXgoe1xyXG4gICAgICAgICAgICAgIGZpZWxkczogW2RlZmluaXRpb24uZmllbGQgfHwgbmFtZV0sXHJcbiAgICAgICAgICAgICAgdXNpbmc6ICdnaW4nXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICB0aGlzLmdldFRhYmxlTmFtZSgpXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZGVsZXRlIGRlZmluaXRpb24uaW5kZXg7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIG1hcCBvZiBmaWVsZCB0byBhdHRyaWJ1dGUgbmFtZXNcclxuICAgIHRoaXMuZmllbGRBdHRyaWJ1dGVNYXAgPSBfLnJlZHVjZSh0aGlzLmZpZWxkUmF3QXR0cmlidXRlc01hcCwgKG1hcCwgdmFsdWUsIGtleSkgPT4ge1xyXG4gICAgICBpZiAoa2V5ICE9PSB2YWx1ZS5maWVsZE5hbWUpIHtcclxuICAgICAgICBtYXBba2V5XSA9IHZhbHVlLmZpZWxkTmFtZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbWFwO1xyXG4gICAgfSwge30pO1xyXG5cclxuICAgIHRoaXMuX2hhc0pzb25BdHRyaWJ1dGVzID0gISF0aGlzLl9qc29uQXR0cmlidXRlcy5zaXplO1xyXG5cclxuICAgIHRoaXMuX2hhc1ZpcnR1YWxBdHRyaWJ1dGVzID0gISF0aGlzLl92aXJ0dWFsQXR0cmlidXRlcy5zaXplO1xyXG5cclxuICAgIHRoaXMuX2hhc0RlZmF1bHRWYWx1ZXMgPSAhXy5pc0VtcHR5KHRoaXMuX2RlZmF1bHRWYWx1ZXMpO1xyXG5cclxuICAgIHRoaXMudGFibGVBdHRyaWJ1dGVzID0gXy5vbWl0QnkodGhpcy5yYXdBdHRyaWJ1dGVzLCAoX2EsIGtleSkgPT4gdGhpcy5fdmlydHVhbEF0dHJpYnV0ZXMuaGFzKGtleSkpO1xyXG5cclxuICAgIHRoaXMucHJvdG90eXBlLl9oYXNDdXN0b21HZXR0ZXJzID0gT2JqZWN0LmtleXModGhpcy5wcm90b3R5cGUuX2N1c3RvbUdldHRlcnMpLmxlbmd0aDtcclxuICAgIHRoaXMucHJvdG90eXBlLl9oYXNDdXN0b21TZXR0ZXJzID0gT2JqZWN0LmtleXModGhpcy5wcm90b3R5cGUuX2N1c3RvbVNldHRlcnMpLmxlbmd0aDtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhhdHRyaWJ1dGVNYW5pcHVsYXRpb24pKSB7XHJcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoTW9kZWwucHJvdG90eXBlLCBrZXkpKSB7XHJcbiAgICAgICAgdGhpcy5zZXF1ZWxpemUubG9nKGBOb3Qgb3ZlcnJpZGluZyBidWlsdC1pbiBtZXRob2QgZnJvbSBtb2RlbCBhdHRyaWJ1dGU6ICR7a2V5fWApO1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnByb3RvdHlwZSwga2V5LCBhdHRyaWJ1dGVNYW5pcHVsYXRpb25ba2V5XSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wcm90b3R5cGUucmF3QXR0cmlidXRlcyA9IHRoaXMucmF3QXR0cmlidXRlcztcclxuICAgIHRoaXMucHJvdG90eXBlLl9pc0F0dHJpYnV0ZSA9IGtleSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5wcm90b3R5cGUucmF3QXR0cmlidXRlcywga2V5KTtcclxuXHJcbiAgICAvLyBQcmltYXJ5IGtleSBjb252ZW5pZW5jZSBjb25zdGlhYmxlc1xyXG4gICAgdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlcyA9IE9iamVjdC5rZXlzKHRoaXMucHJpbWFyeUtleXMpO1xyXG4gICAgdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlID0gdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlc1swXTtcclxuICAgIGlmICh0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGUpIHtcclxuICAgICAgdGhpcy5wcmltYXJ5S2V5RmllbGQgPSB0aGlzLnJhd0F0dHJpYnV0ZXNbdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlXS5maWVsZCB8fCB0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5faGFzUHJpbWFyeUtleXMgPSB0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGVzLmxlbmd0aCA+IDA7XHJcbiAgICB0aGlzLl9pc1ByaW1hcnlLZXkgPSBrZXkgPT4gdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlcy5pbmNsdWRlcyhrZXkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGF0dHJpYnV0ZSBmcm9tIG1vZGVsIGRlZmluaXRpb25cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdHRyaWJ1dGUgbmFtZSBvZiBhdHRyaWJ1dGUgdG8gcmVtb3ZlXHJcbiAgICovXHJcbiAgc3RhdGljIHJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpIHtcclxuICAgIGRlbGV0ZSB0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cmlidXRlXTtcclxuICAgIHRoaXMucmVmcmVzaEF0dHJpYnV0ZXMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN5bmMgdGhpcyBNb2RlbCB0byB0aGUgREIsIHRoYXQgaXMgY3JlYXRlIHRoZSB0YWJsZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gc3luYyBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIFNlcXVlbGl6ZSNzeW5jfSBmb3Igb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWw+fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBzeW5jKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xyXG4gICAgb3B0aW9ucy5ob29rcyA9IG9wdGlvbnMuaG9va3MgPT09IHVuZGVmaW5lZCA/IHRydWUgOiAhIW9wdGlvbnMuaG9va3M7XHJcblxyXG4gICAgY29uc3QgYXR0cmlidXRlcyA9IHRoaXMudGFibGVBdHRyaWJ1dGVzO1xyXG4gICAgY29uc3QgcmF3QXR0cmlidXRlcyA9IHRoaXMuZmllbGRSYXdBdHRyaWJ1dGVzTWFwO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XHJcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoJ2JlZm9yZVN5bmMnLCBvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgIGlmIChvcHRpb25zLmZvcmNlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZHJvcChvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5RdWVyeUludGVyZmFjZS5jcmVhdGVUYWJsZSh0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSwgYXR0cmlidXRlcywgb3B0aW9ucywgdGhpcykpXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBpZiAoIW9wdGlvbnMuYWx0ZXIpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcclxuICAgICAgICAgIHRoaXMuUXVlcnlJbnRlcmZhY2UuZGVzY3JpYmVUYWJsZSh0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSksXHJcbiAgICAgICAgICB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmdldEZvcmVpZ25LZXlSZWZlcmVuY2VzRm9yVGFibGUodGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucykpXHJcbiAgICAgICAgXSlcclxuICAgICAgICAgIC50aGVuKHRhYmxlSW5mb3MgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjb2x1bW5zID0gdGFibGVJbmZvc1swXTtcclxuICAgICAgICAgICAgLy8gVXNlIGZvciBhbHRlciBmb3JlaWduIGtleXNcclxuICAgICAgICAgICAgY29uc3QgZm9yZWlnbktleVJlZmVyZW5jZXMgPSB0YWJsZUluZm9zWzFdO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY2hhbmdlcyA9IFtdOyAvLyBhcnJheSBvZiBwcm9taXNlcyB0byBydW5cclxuICAgICAgICAgICAgY29uc3QgcmVtb3ZlZENvbnN0cmFpbnRzID0ge307XHJcblxyXG4gICAgICAgICAgICBfLmVhY2goYXR0cmlidXRlcywgKGNvbHVtbkRlc2MsIGNvbHVtbk5hbWUpID0+IHtcclxuICAgICAgICAgICAgICBpZiAoIWNvbHVtbnNbY29sdW1uTmFtZV0gJiYgIWNvbHVtbnNbYXR0cmlidXRlc1tjb2x1bW5OYW1lXS5maWVsZF0pIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCgoKSA9PiB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmFkZENvbHVtbih0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSwgYXR0cmlidXRlc1tjb2x1bW5OYW1lXS5maWVsZCB8fCBjb2x1bW5OYW1lLCBhdHRyaWJ1dGVzW2NvbHVtbk5hbWVdKSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgXy5lYWNoKGNvbHVtbnMsIChjb2x1bW5EZXNjLCBjb2x1bW5OYW1lKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgY3VycmVudEF0dHJpYnV0ZSA9IHJhd0F0dHJpYnV0ZXNbY29sdW1uTmFtZV07XHJcbiAgICAgICAgICAgICAgaWYgKCFjdXJyZW50QXR0cmlidXRlKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2goKCkgPT4gdGhpcy5RdWVyeUludGVyZmFjZS5yZW1vdmVDb2x1bW4odGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucyksIGNvbHVtbk5hbWUsIG9wdGlvbnMpKTtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFjdXJyZW50QXR0cmlidXRlLnByaW1hcnlLZXkpIHtcclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvcmVpZ24ga2V5cy4gSWYgaXQncyBhIGZvcmVpZ24ga2V5LCBpdCBzaG91bGQgcmVtb3ZlIGNvbnN0cmFpbnQgZmlyc3QuXHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWZlcmVuY2VzID0gY3VycmVudEF0dHJpYnV0ZS5yZWZlcmVuY2VzO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRBdHRyaWJ1dGUucmVmZXJlbmNlcykge1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBkYXRhYmFzZSA9IHRoaXMuc2VxdWVsaXplLmNvbmZpZy5kYXRhYmFzZTtcclxuICAgICAgICAgICAgICAgICAgY29uc3Qgc2NoZW1hID0gdGhpcy5zZXF1ZWxpemUuY29uZmlnLnNjaGVtYTtcclxuICAgICAgICAgICAgICAgICAgLy8gRmluZCBleGlzdGVkIGZvcmVpZ24ga2V5c1xyXG4gICAgICAgICAgICAgICAgICBfLmVhY2goZm9yZWlnbktleVJlZmVyZW5jZXMsIGZvcmVpZ25LZXlSZWZlcmVuY2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnN0cmFpbnROYW1lID0gZm9yZWlnbktleVJlZmVyZW5jZS5jb25zdHJhaW50TmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISFjb25zdHJhaW50TmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgJiYgZm9yZWlnbktleVJlZmVyZW5jZS50YWJsZUNhdGFsb2cgPT09IGRhdGFiYXNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAmJiAoc2NoZW1hID8gZm9yZWlnbktleVJlZmVyZW5jZS50YWJsZVNjaGVtYSA9PT0gc2NoZW1hIDogdHJ1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICYmIGZvcmVpZ25LZXlSZWZlcmVuY2UucmVmZXJlbmNlZFRhYmxlTmFtZSA9PT0gcmVmZXJlbmNlcy5tb2RlbFxyXG4gICAgICAgICAgICAgICAgICAgICAgJiYgZm9yZWlnbktleVJlZmVyZW5jZS5yZWZlcmVuY2VkQ29sdW1uTmFtZSA9PT0gcmVmZXJlbmNlcy5rZXlcclxuICAgICAgICAgICAgICAgICAgICAgICYmIChzY2hlbWEgPyBmb3JlaWduS2V5UmVmZXJlbmNlLnJlZmVyZW5jZWRUYWJsZVNjaGVtYSA9PT0gc2NoZW1hIDogdHJ1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICYmICFyZW1vdmVkQ29uc3RyYWludHNbY29uc3RyYWludE5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgY29uc3RyYWludCBvbiBmb3JlaWduIGtleXMuXHJcbiAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2goKCkgPT4gdGhpcy5RdWVyeUludGVyZmFjZS5yZW1vdmVDb25zdHJhaW50KHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBjb25zdHJhaW50TmFtZSwgb3B0aW9ucykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZENvbnN0cmFpbnRzW2NvbnN0cmFpbnROYW1lXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCgoKSA9PiB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmNoYW5nZUNvbHVtbih0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSwgY29sdW1uTmFtZSwgY3VycmVudEF0dHJpYnV0ZSkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmVhY2goY2hhbmdlcywgZiA9PiBmKCkpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuUXVlcnlJbnRlcmZhY2Uuc2hvd0luZGV4KHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBvcHRpb25zKSlcclxuICAgICAgLnRoZW4oaW5kZXhlcyA9PiB7XHJcbiAgICAgICAgaW5kZXhlcyA9IHRoaXMuX2luZGV4ZXMuZmlsdGVyKGl0ZW0xID0+XHJcbiAgICAgICAgICAhaW5kZXhlcy5zb21lKGl0ZW0yID0+IGl0ZW0xLm5hbWUgPT09IGl0ZW0yLm5hbWUpXHJcbiAgICAgICAgKS5zb3J0KChpbmRleDEsIGluZGV4MikgPT4ge1xyXG4gICAgICAgICAgaWYgKHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCA9PT0gJ3Bvc3RncmVzJykge1xyXG4gICAgICAgICAgLy8gbW92ZSBjb25jdXJyZW50IGluZGV4ZXMgdG8gdGhlIGJvdHRvbSB0byBhdm9pZCB3ZWlyZCBkZWFkbG9ja3NcclxuICAgICAgICAgICAgaWYgKGluZGV4MS5jb25jdXJyZW50bHkgPT09IHRydWUpIHJldHVybiAxO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXgyLmNvbmN1cnJlbnRseSA9PT0gdHJ1ZSkgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5lYWNoKGluZGV4ZXMsIGluZGV4ID0+IHRoaXMuUXVlcnlJbnRlcmZhY2UuYWRkSW5kZXgoXHJcbiAgICAgICAgICB0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSxcclxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICAgICAgICBsb2dnaW5nOiBvcHRpb25zLmxvZ2dpbmcsXHJcbiAgICAgICAgICAgIGJlbmNobWFyazogb3B0aW9ucy5iZW5jaG1hcmssXHJcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uOiBvcHRpb25zLnRyYW5zYWN0aW9uLFxyXG4gICAgICAgICAgICBzY2hlbWE6IG9wdGlvbnMuc2NoZW1hXHJcbiAgICAgICAgICB9LCBpbmRleCksXHJcbiAgICAgICAgICB0aGlzLnRhYmxlTmFtZVxyXG4gICAgICAgICkpO1xyXG4gICAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICBpZiAob3B0aW9ucy5ob29rcykge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoJ2FmdGVyU3luYycsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSkucmV0dXJuKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRHJvcCB0aGUgdGFibGUgcmVwcmVzZW50ZWQgYnkgdGhpcyBNb2RlbFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgW29wdGlvbnNdIGRyb3Agb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gIFtvcHRpb25zLmNhc2NhZGU9ZmFsc2VdICAgQWxzbyBkcm9wIGFsbCBvYmplY3RzIGRlcGVuZGluZyBvbiB0aGlzIHRhYmxlLCBzdWNoIGFzIHZpZXdzLiBPbmx5IHdvcmtzIGluIHBvc3RncmVzXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gICBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGlsZSBydW5uaW5nIHRoZSBxdWVyeSB0byBsb2cgdGhlIHNxbC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgc3RhdGljIGRyb3Aob3B0aW9ucykge1xyXG4gICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UuZHJvcFRhYmxlKHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBkcm9wU2NoZW1hKHNjaGVtYSkge1xyXG4gICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UuZHJvcFNjaGVtYShzY2hlbWEpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBwbHkgYSBzY2hlbWEgdG8gdGhpcyBtb2RlbC4gRm9yIHBvc3RncmVzLCB0aGlzIHdpbGwgYWN0dWFsbHkgcGxhY2UgdGhlIHNjaGVtYSBpbiBmcm9udCBvZiB0aGUgdGFibGUgbmFtZSAtIGBcInNjaGVtYVwiLlwidGFibGVOYW1lXCJgLFxyXG4gICAqIHdoaWxlIHRoZSBzY2hlbWEgd2lsbCBiZSBwcmVwZW5kZWQgdG8gdGhlIHRhYmxlIG5hbWUgZm9yIG15c3FsIGFuZCBzcWxpdGUgLSBgJ3NjaGVtYS50YWJsZW5hbWUnYC5cclxuICAgKlxyXG4gICAqIFRoaXMgbWV0aG9kIGlzIGludGVuZGVkIGZvciB1c2UgY2FzZXMgd2hlcmUgdGhlIHNhbWUgbW9kZWwgaXMgbmVlZGVkIGluIG11bHRpcGxlIHNjaGVtYXMuIEluIHN1Y2ggYSB1c2UgY2FzZSBpdCBpcyBpbXBvcnRhbnRcclxuICAgKiB0byBjYWxsIGBtb2RlbC5zY2hlbWEoc2NoZW1hLCBbb3B0aW9uc10pLnN5bmMoKWAgZm9yIGVhY2ggbW9kZWwgdG8gZW5zdXJlIHRoZSBtb2RlbHMgYXJlIGNyZWF0ZWQgaW4gdGhlIGNvcnJlY3Qgc2NoZW1hLlxyXG4gICAqXHJcbiAgICogSWYgYSBzaW5nbGUgZGVmYXVsdCBzY2hlbWEgcGVyIG1vZGVsIGlzIG5lZWRlZCwgc2V0IHRoZSBgb3B0aW9ucy5zY2hlbWE9J3NjaGVtYSdgIHBhcmFtZXRlciBkdXJpbmcgdGhlIGBkZWZpbmUoKWAgY2FsbFxyXG4gICAqIGZvciB0aGUgbW9kZWwuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICBzY2hlbWEgVGhlIG5hbWUgb2YgdGhlIHNjaGVtYVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIFtvcHRpb25zXSBzY2hlbWEgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgIFtvcHRpb25zLnNjaGVtYURlbGltaXRlcj0nLiddIFRoZSBjaGFyYWN0ZXIocykgdGhhdCBzZXBhcmF0ZXMgdGhlIHNjaGVtYSBuYW1lIGZyb20gdGhlIHRhYmxlIG5hbWVcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGlsZSBydW5uaW5nIHRoZSBxdWVyeSB0byBsb2cgdGhlIHNxbC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBTZXF1ZWxpemUjZGVmaW5lfSBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBzZXR0aW5nIGEgZGVmYXVsdCBzY2hlbWEuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7TW9kZWx9XHJcbiAgICovXHJcbiAgc3RhdGljIHNjaGVtYShzY2hlbWEsIG9wdGlvbnMpIHtcclxuXHJcbiAgICBjb25zdCBjbG9uZSA9IGNsYXNzIGV4dGVuZHMgdGhpcyB7fTtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbG9uZSwgJ25hbWUnLCB7IHZhbHVlOiB0aGlzLm5hbWUgfSk7XHJcblxyXG4gICAgY2xvbmUuX3NjaGVtYSA9IHNjaGVtYTtcclxuXHJcbiAgICBpZiAob3B0aW9ucykge1xyXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgY2xvbmUuX3NjaGVtYURlbGltaXRlciA9IG9wdGlvbnM7XHJcbiAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5zY2hlbWFEZWxpbWl0ZXIpIHtcclxuICAgICAgICBjbG9uZS5fc2NoZW1hRGVsaW1pdGVyID0gb3B0aW9ucy5zY2hlbWFEZWxpbWl0ZXI7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2xvbmU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHRhYmxlIG5hbWUgb2YgdGhlIG1vZGVsLCB0YWtpbmcgc2NoZW1hIGludG8gYWNjb3VudC4gVGhlIG1ldGhvZCB3aWxsIHJldHVybiBUaGUgbmFtZSBhcyBhIHN0cmluZyBpZiB0aGUgbW9kZWwgaGFzIG5vIHNjaGVtYSxcclxuICAgKiBvciBhbiBvYmplY3Qgd2l0aCBgdGFibGVOYW1lYCwgYHNjaGVtYWAgYW5kIGBkZWxpbWl0ZXJgIHByb3BlcnRpZXMuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfE9iamVjdH1cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0VGFibGVOYW1lKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuUXVlcnlHZW5lcmF0b3IuYWRkU2NoZW1hKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHVuLXNjb3BlZCBtb2RlbFxyXG4gICAqXHJcbiAgICogQHJldHVybnMge01vZGVsfVxyXG4gICAqL1xyXG4gIHN0YXRpYyB1bnNjb3BlZCgpIHtcclxuICAgIHJldHVybiB0aGlzLnNjb3BlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYSBuZXcgc2NvcGUgdG8gdGhlIG1vZGVsLiBUaGlzIGlzIGVzcGVjaWFsbHkgdXNlZnVsIGZvciBhZGRpbmcgc2NvcGVzIHdpdGggaW5jbHVkZXMsIHdoZW4gdGhlIG1vZGVsIHlvdSB3YW50IHRvIGluY2x1ZGUgaXMgbm90IGF2YWlsYWJsZSBhdCB0aGUgdGltZSB0aGlzIG1vZGVsIGlzIGRlZmluZWQuXHJcbiAgICpcclxuICAgKiBCeSBkZWZhdWx0IHRoaXMgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBhIHNjb3BlIHdpdGggdGhhdCBuYW1lIGFscmVhZHkgZXhpc3RzLiBQYXNzIGBvdmVycmlkZTogdHJ1ZWAgaW4gdGhlIG9wdGlvbnMgb2JqZWN0IHRvIHNpbGVuY2UgdGhpcyBlcnJvci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICBuYW1lIFRoZSBuYW1lIG9mIHRoZSBzY29wZS4gVXNlIGBkZWZhdWx0U2NvcGVgIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IHNjb3BlXHJcbiAgICogQHBhcmFtIHtPYmplY3R8RnVuY3Rpb259IHNjb3BlIHNjb3BlIG9yIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgW29wdGlvbnNdIHNjb3BlIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMub3ZlcnJpZGU9ZmFsc2VdIG92ZXJyaWRlIG9sZCBzY29wZSBpZiBhbHJlYWR5IGRlZmluZWRcclxuICAgKi9cclxuICBzdGF0aWMgYWRkU2NvcGUobmFtZSwgc2NvcGUsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcclxuICAgICAgb3ZlcnJpZGU6IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBpZiAoKG5hbWUgPT09ICdkZWZhdWx0U2NvcGUnICYmIE9iamVjdC5rZXlzKHRoaXMub3B0aW9ucy5kZWZhdWx0U2NvcGUpLmxlbmd0aCA+IDAgfHwgbmFtZSBpbiB0aGlzLm9wdGlvbnMuc2NvcGVzKSAmJiBvcHRpb25zLm92ZXJyaWRlID09PSBmYWxzZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBzY29wZSAke25hbWV9IGFscmVhZHkgZXhpc3RzLiBQYXNzIHsgb3ZlcnJpZGU6IHRydWUgfSBhcyBvcHRpb25zIHRvIHNpbGVuY2UgdGhpcyBlcnJvcmApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChuYW1lID09PSAnZGVmYXVsdFNjb3BlJykge1xyXG4gICAgICB0aGlzLm9wdGlvbnMuZGVmYXVsdFNjb3BlID0gdGhpcy5fc2NvcGUgPSBzY29wZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMub3B0aW9ucy5zY29wZXNbbmFtZV0gPSBzY29wZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFwcGx5IGEgc2NvcGUgY3JlYXRlZCBpbiBgZGVmaW5lYCB0byB0aGUgbW9kZWwuXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5ob3cgdG8gY3JlYXRlIHNjb3BlczwvY2FwdGlvbj5cclxuICAgKiBjb25zdCBNb2RlbCA9IHNlcXVlbGl6ZS5kZWZpbmUoJ21vZGVsJywgYXR0cmlidXRlcywge1xyXG4gICAqICAgZGVmYXVsdFNjb3BlOiB7XHJcbiAgICogICAgIHdoZXJlOiB7XHJcbiAgICogICAgICAgdXNlcm5hbWU6ICdkYW4nXHJcbiAgICogICAgIH0sXHJcbiAgICogICAgIGxpbWl0OiAxMlxyXG4gICAqICAgfSxcclxuICAgKiAgIHNjb3Blczoge1xyXG4gICAqICAgICBpc0FMaWU6IHtcclxuICAgKiAgICAgICB3aGVyZToge1xyXG4gICAqICAgICAgICAgc3R1ZmY6ICdjYWtlJ1xyXG4gICAqICAgICAgIH1cclxuICAgKiAgICAgfSxcclxuICAgKiAgICAgY29tcGxleEZ1bmN0aW9uOiBmdW5jdGlvbihlbWFpbCwgYWNjZXNzTGV2ZWwpIHtcclxuICAgKiAgICAgICByZXR1cm4ge1xyXG4gICAqICAgICAgICAgd2hlcmU6IHtcclxuICAgKiAgICAgICAgICAgZW1haWw6IHtcclxuICAgKiAgICAgICAgICAgICBbT3AubGlrZV06IGVtYWlsXHJcbiAgICogICAgICAgICAgIH0sXHJcbiAgICogICAgICAgICAgIGFjY2Vzc19sZXZlbCB7XHJcbiAgICogICAgICAgICAgICAgW09wLmd0ZV06IGFjY2Vzc0xldmVsXHJcbiAgICogICAgICAgICAgIH1cclxuICAgKiAgICAgICAgIH1cclxuICAgKiAgICAgICB9XHJcbiAgICogICAgIH1cclxuICAgKiAgIH1cclxuICAgKiB9KVxyXG4gICAqXHJcbiAgICogIyBBcyB5b3UgaGF2ZSBkZWZpbmVkIGEgZGVmYXVsdCBzY29wZSwgZXZlcnkgdGltZSB5b3UgZG8gTW9kZWwuZmluZCwgdGhlIGRlZmF1bHQgc2NvcGUgaXMgYXBwZW5kZWQgdG8geW91ciBxdWVyeS4gSGVyZSdzIGEgY291cGxlIG9mIGV4YW1wbGVzOlxyXG4gICAqXHJcbiAgICogTW9kZWwuZmluZEFsbCgpIC8vIFdIRVJFIHVzZXJuYW1lID0gJ2RhbidcclxuICAgKiBNb2RlbC5maW5kQWxsKHsgd2hlcmU6IHsgYWdlOiB7IFtPcC5ndF06IDEyIH0gfSB9KSAvLyBXSEVSRSBhZ2UgPiAxMiBBTkQgdXNlcm5hbWUgPSAnZGFuJ1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+VG8gaW52b2tlIHNjb3BlIGZ1bmN0aW9ucyB5b3UgY2FuIGRvPC9jYXB0aW9uPlxyXG4gICAqIE1vZGVsLnNjb3BlKHsgbWV0aG9kOiBbJ2NvbXBsZXhGdW5jdGlvbicsICdkYW5Ac2VxdWVsaXplLmNvbScsIDQyXX0pLmZpbmRBbGwoKVxyXG4gICAqIC8vIFdIRVJFIGVtYWlsIGxpa2UgJ2RhbkBzZXF1ZWxpemUuY29tJScgQU5EIGFjY2Vzc19sZXZlbCA+PSA0MlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHs/QXJyYXl8T2JqZWN0fHN0cmluZ30gW29wdGlvbl0gVGhlIHNjb3BlKHMpIHRvIGFwcGx5LiBTY29wZXMgY2FuIGVpdGhlciBiZSBwYXNzZWQgYXMgY29uc2VjdXRpdmUgYXJndW1lbnRzLCBvciBhcyBhbiBhcnJheSBvZiBhcmd1bWVudHMuIFRvIGFwcGx5IHNpbXBsZSBzY29wZXMgYW5kIHNjb3BlIGZ1bmN0aW9ucyB3aXRoIG5vIGFyZ3VtZW50cywgcGFzcyB0aGVtIGFzIHN0cmluZ3MuIEZvciBzY29wZSBmdW5jdGlvbiwgcGFzcyBhbiBvYmplY3QsIHdpdGggYSBgbWV0aG9kYCBwcm9wZXJ0eS4gVGhlIHZhbHVlIGNhbiBlaXRoZXIgYmUgYSBzdHJpbmcsIGlmIHRoZSBtZXRob2QgZG9lcyBub3QgdGFrZSBhbnkgYXJndW1lbnRzLCBvciBhbiBhcnJheSwgd2hlcmUgdGhlIGZpcnN0IGVsZW1lbnQgaXMgdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCwgYW5kIGNvbnNlY3V0aXZlIGVsZW1lbnRzIGFyZSBhcmd1bWVudHMgdG8gdGhhdCBtZXRob2QuIFBhc3MgbnVsbCB0byByZW1vdmUgYWxsIHNjb3BlcywgaW5jbHVkaW5nIHRoZSBkZWZhdWx0LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMge01vZGVsfSBBIHJlZmVyZW5jZSB0byB0aGUgbW9kZWwsIHdpdGggdGhlIHNjb3BlKHMpIGFwcGxpZWQuIENhbGxpbmcgc2NvcGUgYWdhaW4gb24gdGhlIHJldHVybmVkIG1vZGVsIHdpbGwgY2xlYXIgdGhlIHByZXZpb3VzIHNjb3BlLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBzY29wZShvcHRpb24pIHtcclxuICAgIGNvbnN0IHNlbGYgPSBjbGFzcyBleHRlbmRzIHRoaXMge307XHJcbiAgICBsZXQgc2NvcGU7XHJcbiAgICBsZXQgc2NvcGVOYW1lO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzZWxmLCAnbmFtZScsIHsgdmFsdWU6IHRoaXMubmFtZSB9KTtcclxuXHJcbiAgICBzZWxmLl9zY29wZSA9IHt9O1xyXG4gICAgc2VsZi5fc2NvcGVOYW1lcyA9IFtdO1xyXG4gICAgc2VsZi5zY29wZWQgPSB0cnVlO1xyXG5cclxuICAgIGlmICghb3B0aW9uKSB7XHJcbiAgICAgIHJldHVybiBzZWxmO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBfLmZsYXR0ZW4oYXJndW1lbnRzKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBvcHRpb25zKSB7XHJcbiAgICAgIHNjb3BlID0gbnVsbDtcclxuICAgICAgc2NvcGVOYW1lID0gbnVsbDtcclxuXHJcbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3Qob3B0aW9uKSkge1xyXG4gICAgICAgIGlmIChvcHRpb24ubWV0aG9kKSB7XHJcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb24ubWV0aG9kKSAmJiAhIXNlbGYub3B0aW9ucy5zY29wZXNbb3B0aW9uLm1ldGhvZFswXV0pIHtcclxuICAgICAgICAgICAgc2NvcGVOYW1lID0gb3B0aW9uLm1ldGhvZFswXTtcclxuICAgICAgICAgICAgc2NvcGUgPSBzZWxmLm9wdGlvbnMuc2NvcGVzW3Njb3BlTmFtZV0uYXBwbHkoc2VsZiwgb3B0aW9uLm1ldGhvZC5zbGljZSgxKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmIChzZWxmLm9wdGlvbnMuc2NvcGVzW29wdGlvbi5tZXRob2RdKSB7XHJcbiAgICAgICAgICAgIHNjb3BlTmFtZSA9IG9wdGlvbi5tZXRob2Q7XHJcbiAgICAgICAgICAgIHNjb3BlID0gc2VsZi5vcHRpb25zLnNjb3Blc1tzY29wZU5hbWVdLmFwcGx5KHNlbGYpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzY29wZSA9IG9wdGlvbjtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAob3B0aW9uID09PSAnZGVmYXVsdFNjb3BlJyAmJiBfLmlzUGxhaW5PYmplY3Qoc2VsZi5vcHRpb25zLmRlZmF1bHRTY29wZSkpIHtcclxuICAgICAgICBzY29wZSA9IHNlbGYub3B0aW9ucy5kZWZhdWx0U2NvcGU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2NvcGVOYW1lID0gb3B0aW9uO1xyXG4gICAgICAgIHNjb3BlID0gc2VsZi5vcHRpb25zLnNjb3Blc1tzY29wZU5hbWVdO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygc2NvcGUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIHNjb3BlID0gc2NvcGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzY29wZSkge1xyXG4gICAgICAgIHRoaXMuX2NvbmZvcm1JbmNsdWRlcyhzY29wZSwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy5fYXNzaWduT3B0aW9ucyhzZWxmLl9zY29wZSwgc2NvcGUpO1xyXG4gICAgICAgIHNlbGYuX3Njb3BlTmFtZXMucHVzaChzY29wZU5hbWUgPyBzY29wZU5hbWUgOiAnZGVmYXVsdFNjb3BlJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5TZXF1ZWxpemVTY29wZUVycm9yKGBJbnZhbGlkIHNjb3BlICR7c2NvcGVOYW1lfSBjYWxsZWQuYCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc2VsZjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlYXJjaCBmb3IgbXVsdGlwbGUgaW5zdGFuY2VzLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+U2ltcGxlIHNlYXJjaCB1c2luZyBBTkQgYW5kID08L2NhcHRpb24+XHJcbiAgICogTW9kZWwuZmluZEFsbCh7XHJcbiAgICogICB3aGVyZToge1xyXG4gICAqICAgICBhdHRyMTogNDIsXHJcbiAgICogICAgIGF0dHIyOiAnY2FrZSdcclxuICAgKiAgIH1cclxuICAgKiB9KVxyXG4gICAqXHJcbiAgICogIyBXSEVSRSBhdHRyMSA9IDQyIEFORCBhdHRyMiA9ICdjYWtlJ1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+VXNpbmcgZ3JlYXRlciB0aGFuLCBsZXNzIHRoYW4gZXRjLjwvY2FwdGlvbj5cclxuICAgKiBjb25zdCB7Z3QsIGx0ZSwgbmUsIGluOiBvcElufSA9IFNlcXVlbGl6ZS5PcDtcclxuICAgKlxyXG4gICAqIE1vZGVsLmZpbmRBbGwoe1xyXG4gICAqICAgd2hlcmU6IHtcclxuICAgKiAgICAgYXR0cjE6IHtcclxuICAgKiAgICAgICBbZ3RdOiA1MFxyXG4gICAqICAgICB9LFxyXG4gICAqICAgICBhdHRyMjoge1xyXG4gICAqICAgICAgIFtsdGVdOiA0NVxyXG4gICAqICAgICB9LFxyXG4gICAqICAgICBhdHRyMzoge1xyXG4gICAqICAgICAgIFtvcEluXTogWzEsMiwzXVxyXG4gICAqICAgICB9LFxyXG4gICAqICAgICBhdHRyNDoge1xyXG4gICAqICAgICAgIFtuZV06IDVcclxuICAgKiAgICAgfVxyXG4gICAqICAgfVxyXG4gICAqIH0pXHJcbiAgICpcclxuICAgKiAjIFdIRVJFIGF0dHIxID4gNTAgQU5EIGF0dHIyIDw9IDQ1IEFORCBhdHRyMyBJTiAoMSwyLDMpIEFORCBhdHRyNCAhPSA1XHJcbiAgICpcclxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5RdWVyaWVzIHVzaW5nIE9SPC9jYXB0aW9uPlxyXG4gICAqIGNvbnN0IHtvciwgYW5kLCBndCwgbHR9ID0gU2VxdWVsaXplLk9wO1xyXG4gICAqXHJcbiAgICogTW9kZWwuZmluZEFsbCh7XHJcbiAgICogICB3aGVyZToge1xyXG4gICAqICAgICBuYW1lOiAnYSBwcm9qZWN0JyxcclxuICAgKiAgICAgW29yXTogW1xyXG4gICAqICAgICAgIHtpZDogWzEsIDIsIDNdfSxcclxuICAgKiAgICAgICB7XHJcbiAgICogICAgICAgICBbYW5kXTogW1xyXG4gICAqICAgICAgICAgICB7aWQ6IHtbZ3RdOiAxMH19LFxyXG4gICAqICAgICAgICAgICB7aWQ6IHtbbHRdOiAxMDB9fVxyXG4gICAqICAgICAgICAgXVxyXG4gICAqICAgICAgIH1cclxuICAgKiAgICAgXVxyXG4gICAqICAgfVxyXG4gICAqIH0pO1xyXG4gICAqXHJcbiAgICogIyBXSEVSRSBgTW9kZWxgLmBuYW1lYCA9ICdhIHByb2plY3QnIEFORCAoYE1vZGVsYC5gaWRgIElOICgxLCAyLCAzKSBPUiAoYE1vZGVsYC5gaWRgID4gMTAgQU5EIGBNb2RlbGAuYGlkYCA8IDEwMCkpO1xyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBPcGVyYXRvcnN9IGZvciBwb3NzaWJsZSBvcGVyYXRvcnNcclxuICAgKiBfX0FsaWFzX186IF9hbGxfXHJcbiAgICpcclxuICAgKiBUaGUgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIGFuIGFycmF5IG9mIE1vZGVsIGluc3RhbmNlcyBpZiB0aGUgcXVlcnkgc3VjY2VlZHMuX1xyXG4gICAqXHJcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9uc10gQSBoYXNoIG9mIG9wdGlvbnMgdG8gZGVzY3JpYmUgdGhlIHNjb3BlIG9mIHRoZSBzZWFyY2hcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLndoZXJlXSBBIGhhc2ggb2YgYXR0cmlidXRlcyB0byBkZXNjcmliZSB5b3VyIHNlYXJjaC4gU2VlIGFib3ZlIGZvciBleGFtcGxlcy5cclxuICAgKiBAcGFyYW0gIHtBcnJheTxzdHJpbmc+fE9iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmF0dHJpYnV0ZXNdIEEgbGlzdCBvZiB0aGUgYXR0cmlidXRlcyB0aGF0IHlvdSB3YW50IHRvIHNlbGVjdCwgb3IgYW4gb2JqZWN0IHdpdGggYGluY2x1ZGVgIGFuZCBgZXhjbHVkZWAga2V5cy4gVG8gcmVuYW1lIGFuIGF0dHJpYnV0ZSwgeW91IGNhbiBwYXNzIGFuIGFycmF5LCB3aXRoIHR3byBlbGVtZW50cyAtIHRoZSBmaXJzdCBpcyB0aGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIGluIHRoZSBEQiAob3Igc29tZSBraW5kIG9mIGV4cHJlc3Npb24gc3VjaCBhcyBgU2VxdWVsaXplLmxpdGVyYWxgLCBgU2VxdWVsaXplLmZuYCBhbmQgc28gb24pLCBhbmQgdGhlIHNlY29uZCBpcyB0aGUgbmFtZSB5b3Ugd2FudCB0aGUgYXR0cmlidXRlIHRvIGhhdmUgaW4gdGhlIHJldHVybmVkIGluc3RhbmNlXHJcbiAgICogQHBhcmFtICB7QXJyYXk8c3RyaW5nPn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5hdHRyaWJ1dGVzLmluY2x1ZGVdIFNlbGVjdCBhbGwgdGhlIGF0dHJpYnV0ZXMgb2YgdGhlIG1vZGVsLCBwbHVzIHNvbWUgYWRkaXRpb25hbCBvbmVzLiBVc2VmdWwgZm9yIGFnZ3JlZ2F0aW9ucywgZS5nLiBgeyBhdHRyaWJ1dGVzOiB7IGluY2x1ZGU6IFtbc2VxdWVsaXplLmZuKCdDT1VOVCcsIHNlcXVlbGl6ZS5jb2woJ2lkJykpLCAndG90YWwnXV0gfWBcclxuICAgKiBAcGFyYW0gIHtBcnJheTxzdHJpbmc+fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmF0dHJpYnV0ZXMuZXhjbHVkZV0gU2VsZWN0IGFsbCB0aGUgYXR0cmlidXRlcyBvZiB0aGUgbW9kZWwsIGV4Y2VwdCBzb21lIGZldy4gVXNlZnVsIGZvciBzZWN1cml0eSBwdXJwb3NlcyBlLmcuIGB7IGF0dHJpYnV0ZXM6IHsgZXhjbHVkZTogWydwYXNzd29yZCddIH0gfWBcclxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLnBhcmFub2lkPXRydWVdIElmIHRydWUsIG9ubHkgbm9uLWRlbGV0ZWQgcmVjb3JkcyB3aWxsIGJlIHJldHVybmVkLiBJZiBmYWxzZSwgYm90aCBkZWxldGVkIGFuZCBub24tZGVsZXRlZCByZWNvcmRzIHdpbGwgYmUgcmV0dXJuZWQuIE9ubHkgYXBwbGllcyBpZiBgb3B0aW9ucy5wYXJhbm9pZGAgaXMgdHJ1ZSBmb3IgdGhlIG1vZGVsLlxyXG4gICAqIEBwYXJhbSAge0FycmF5PE9iamVjdHxNb2RlbHxzdHJpbmc+fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZV0gQSBsaXN0IG9mIGFzc29jaWF0aW9ucyB0byBlYWdlcmx5IGxvYWQgdXNpbmcgYSBsZWZ0IGpvaW4uIFN1cHBvcnRlZCBpcyBlaXRoZXIgYHsgaW5jbHVkZTogWyBNb2RlbDEsIE1vZGVsMiwgLi4uXX1gIG9yIGB7IGluY2x1ZGU6IFt7IG1vZGVsOiBNb2RlbDEsIGFzOiAnQWxpYXMnIH1dfWAgb3IgYHsgaW5jbHVkZTogWydBbGlhcyddfWAuIElmIHlvdXIgYXNzb2NpYXRpb24gYXJlIHNldCB1cCB3aXRoIGFuIGBhc2AgKGVnLiBgWC5oYXNNYW55KFksIHsgYXM6ICdaIH1gLCB5b3UgbmVlZCB0byBzcGVjaWZ5IFogaW4gdGhlIGFzIGF0dHJpYnV0ZSB3aGVuIGVhZ2VyIGxvYWRpbmcgWSkuXHJcbiAgICogQHBhcmFtICB7TW9kZWx9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmNsdWRlW10ubW9kZWxdIFRoZSBtb2RlbCB5b3Ugd2FudCB0byBlYWdlcmx5IGxvYWRcclxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS5hc10gVGhlIGFsaWFzIG9mIHRoZSByZWxhdGlvbiwgaW4gY2FzZSB0aGUgbW9kZWwgeW91IHdhbnQgdG8gZWFnZXJseSBsb2FkIGlzIGFsaWFzZWQuIEZvciBgaGFzT25lYCAvIGBiZWxvbmdzVG9gLCB0aGlzIHNob3VsZCBiZSB0aGUgc2luZ3VsYXIgbmFtZSwgYW5kIGZvciBgaGFzTWFueWAsIGl0IHNob3VsZCBiZSB0aGUgcGx1cmFsXHJcbiAgICogQHBhcmFtICB7QXNzb2NpYXRpb259ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmNsdWRlW10uYXNzb2NpYXRpb25dIFRoZSBhc3NvY2lhdGlvbiB5b3Ugd2FudCB0byBlYWdlcmx5IGxvYWQuIChUaGlzIGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgcHJvdmlkaW5nIGEgbW9kZWwvYXMgcGFpcilcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS53aGVyZV0gV2hlcmUgY2xhdXNlcyB0byBhcHBseSB0byB0aGUgY2hpbGQgbW9kZWxzLiBOb3RlIHRoYXQgdGhpcyBjb252ZXJ0cyB0aGUgZWFnZXIgbG9hZCB0byBhbiBpbm5lciBqb2luLCB1bmxlc3MgeW91IGV4cGxpY2l0bHkgc2V0IGByZXF1aXJlZDogZmFsc2VgXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmNsdWRlW10ub3I9ZmFsc2VdIFdoZXRoZXIgdG8gYmluZCB0aGUgT04gYW5kIFdIRVJFIGNsYXVzZSB0b2dldGhlciBieSBPUiBpbnN0ZWFkIG9mIEFORC5cclxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS5vbl0gU3VwcGx5IHlvdXIgb3duIE9OIGNvbmRpdGlvbiBmb3IgdGhlIGpvaW4uXHJcbiAgICogQHBhcmFtICB7QXJyYXk8c3RyaW5nPn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmNsdWRlW10uYXR0cmlidXRlc10gQSBsaXN0IG9mIGF0dHJpYnV0ZXMgdG8gc2VsZWN0IGZyb20gdGhlIGNoaWxkIG1vZGVsXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5pbmNsdWRlW10ucmVxdWlyZWRdIElmIHRydWUsIGNvbnZlcnRzIHRvIGFuIGlubmVyIGpvaW4sIHdoaWNoIG1lYW5zIHRoYXQgdGhlIHBhcmVudCBtb2RlbCB3aWxsIG9ubHkgYmUgbG9hZGVkIGlmIGl0IGhhcyBhbnkgbWF0Y2hpbmcgY2hpbGRyZW4uIFRydWUgaWYgYGluY2x1ZGUud2hlcmVgIGlzIHNldCwgZmFsc2Ugb3RoZXJ3aXNlLlxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLnJpZ2h0XSBJZiB0cnVlLCBjb252ZXJ0cyB0byBhIHJpZ2h0IGpvaW4gaWYgZGlhbGVjdCBzdXBwb3J0IGl0LiBJZ25vcmVkIGlmIGBpbmNsdWRlLnJlcXVpcmVkYCBpcyB0cnVlLlxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLnNlcGFyYXRlXSBJZiB0cnVlLCBydW5zIGEgc2VwYXJhdGUgcXVlcnkgdG8gZmV0Y2ggdGhlIGFzc29jaWF0ZWQgaW5zdGFuY2VzLCBvbmx5IHN1cHBvcnRlZCBmb3IgaGFzTWFueSBhc3NvY2lhdGlvbnNcclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS5saW1pdF0gTGltaXQgdGhlIGpvaW5lZCByb3dzLCBvbmx5IHN1cHBvcnRlZCB3aXRoIGluY2x1ZGUuc2VwYXJhdGU9dHJ1ZVxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLnRocm91Z2gud2hlcmVdIEZpbHRlciBvbiB0aGUgam9pbiBtb2RlbCBmb3IgYmVsb25nc1RvTWFueSByZWxhdGlvbnNcclxuICAgKiBAcGFyYW0gIHtBcnJheX0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS50aHJvdWdoLmF0dHJpYnV0ZXNdIEEgbGlzdCBvZiBhdHRyaWJ1dGVzIHRvIHNlbGVjdCBmcm9tIHRoZSBqb2luIG1vZGVsIGZvciBiZWxvbmdzVG9NYW55IHJlbGF0aW9uc1xyXG4gICAqIEBwYXJhbSAge0FycmF5PE9iamVjdHxNb2RlbHxzdHJpbmc+fSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaW5jbHVkZVtdLmluY2x1ZGVdIExvYWQgZnVydGhlciBuZXN0ZWQgcmVsYXRlZCBtb2RlbHNcclxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVbXS5kdXBsaWNhdGluZ10gTWFyayB0aGUgaW5jbHVkZSBhcyBkdXBsaWNhdGluZywgd2lsbCBwcmV2ZW50IGEgc3VicXVlcnkgZnJvbSBiZWluZyB1c2VkLlxyXG4gICAqIEBwYXJhbSAge0FycmF5fFNlcXVlbGl6ZS5mbnxTZXF1ZWxpemUuY29sfFNlcXVlbGl6ZS5saXRlcmFsfSAgICAgICAgW29wdGlvbnMub3JkZXJdIFNwZWNpZmllcyBhbiBvcmRlcmluZy4gVXNpbmcgYW4gYXJyYXksIHlvdSBjYW4gcHJvdmlkZSBzZXZlcmFsIGNvbHVtbnMgLyBmdW5jdGlvbnMgdG8gb3JkZXIgYnkuIEVhY2ggZWxlbWVudCBjYW4gYmUgZnVydGhlciB3cmFwcGVkIGluIGEgdHdvLWVsZW1lbnQgYXJyYXkuIFRoZSBmaXJzdCBlbGVtZW50IGlzIHRoZSBjb2x1bW4gLyBmdW5jdGlvbiB0byBvcmRlciBieSwgdGhlIHNlY29uZCBpcyB0aGUgZGlyZWN0aW9uLiBGb3IgZXhhbXBsZTogYG9yZGVyOiBbWyduYW1lJywgJ0RFU0MnXV1gLiBJbiB0aGlzIHdheSB0aGUgY29sdW1uIHdpbGwgYmUgZXNjYXBlZCwgYnV0IHRoZSBkaXJlY3Rpb24gd2lsbCBub3QuXHJcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5saW1pdF0gTGltaXQgZm9yIHJlc3VsdFxyXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMub2Zmc2V0XSBPZmZzZXQgZm9yIHJlc3VsdFxyXG4gICAqIEBwYXJhbSAge1RyYW5zYWN0aW9ufSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxyXG4gICAqIEBwYXJhbSAge3N0cmluZ3xPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMubG9ja10gTG9jayB0aGUgc2VsZWN0ZWQgcm93cy4gUG9zc2libGUgb3B0aW9ucyBhcmUgdHJhbnNhY3Rpb24uTE9DSy5VUERBVEUgYW5kIHRyYW5zYWN0aW9uLkxPQ0suU0hBUkUuIFBvc3RncmVzIGFsc28gc3VwcG9ydHMgdHJhbnNhY3Rpb24uTE9DSy5LRVlfU0hBUkUsIHRyYW5zYWN0aW9uLkxPQ0suTk9fS0VZX1VQREFURSBhbmQgc3BlY2lmaWMgbW9kZWwgbG9ja3Mgd2l0aCBqb2lucy4gU2VlIFt0cmFuc2FjdGlvbi5MT0NLIGZvciBhbiBleGFtcGxlXSh0cmFuc2FjdGlvbiNsb2NrKVxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuc2tpcExvY2tlZF0gU2tpcCBsb2NrZWQgcm93cy4gT25seSBzdXBwb3J0ZWQgaW4gUG9zdGdyZXMuXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5yYXddIFJldHVybiByYXcgcmVzdWx0LiBTZWUgc2VxdWVsaXplLnF1ZXJ5IGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuaGF2aW5nXSBIYXZpbmcgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW58RXJyb3J9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMucmVqZWN0T25FbXB0eT1mYWxzZV0gVGhyb3dzIGFuIGVycm9yIHdoZW4gbm8gcmVjb3JkcyBmb3VuZFxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBTZXF1ZWxpemUjcXVlcnl9XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBcnJheTxNb2RlbD4+fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBmaW5kQWxsKG9wdGlvbnMpIHtcclxuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQgJiYgIV8uaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xyXG4gICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLlF1ZXJ5RXJyb3IoJ1RoZSBhcmd1bWVudCBwYXNzZWQgdG8gZmluZEFsbCBtdXN0IGJlIGFuIG9wdGlvbnMgb2JqZWN0LCB1c2UgZmluZEJ5UGsgaWYgeW91IHdpc2ggdG8gcGFzcyBhIHNpbmdsZSBwcmltYXJ5IGtleSB2YWx1ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShvcHRpb25zLmF0dHJpYnV0ZXMpICYmICFfLmlzUGxhaW5PYmplY3Qob3B0aW9ucy5hdHRyaWJ1dGVzKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuUXVlcnlFcnJvcignVGhlIGF0dHJpYnV0ZXMgb3B0aW9uIG11c3QgYmUgYW4gYXJyYXkgb2YgY29sdW1uIG5hbWVzIG9yIGFuIG9iamVjdCcpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy53YXJuT25JbnZhbGlkT3B0aW9ucyhvcHRpb25zLCBPYmplY3Qua2V5cyh0aGlzLnJhd0F0dHJpYnV0ZXMpKTtcclxuXHJcbiAgICBjb25zdCB0YWJsZU5hbWVzID0ge307XHJcblxyXG4gICAgdGFibGVOYW1lc1t0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKV0gPSB0cnVlO1xyXG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcclxuXHJcbiAgICBfLmRlZmF1bHRzKG9wdGlvbnMsIHsgaG9va3M6IHRydWUgfSk7XHJcblxyXG4gICAgLy8gc2V0IHJlamVjdE9uRW1wdHkgb3B0aW9uLCBkZWZhdWx0cyB0byBtb2RlbCBvcHRpb25zXHJcbiAgICBvcHRpb25zLnJlamVjdE9uRW1wdHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgJ3JlamVjdE9uRW1wdHknKVxyXG4gICAgICA/IG9wdGlvbnMucmVqZWN0T25FbXB0eVxyXG4gICAgICA6IHRoaXMub3B0aW9ucy5yZWplY3RPbkVtcHR5O1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XHJcbiAgICAgIHRoaXMuX2luamVjdFNjb3BlKG9wdGlvbnMpO1xyXG5cclxuICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYmVmb3JlRmluZCcsIG9wdGlvbnMpO1xyXG4gICAgICB9XHJcbiAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgdGhpcy5fY29uZm9ybUluY2x1ZGVzKG9wdGlvbnMsIHRoaXMpO1xyXG4gICAgICB0aGlzLl9leHBhbmRBdHRyaWJ1dGVzKG9wdGlvbnMpO1xyXG4gICAgICB0aGlzLl9leHBhbmRJbmNsdWRlQWxsKG9wdGlvbnMpO1xyXG5cclxuICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYmVmb3JlRmluZEFmdGVyRXhwYW5kSW5jbHVkZUFsbCcsIG9wdGlvbnMpO1xyXG4gICAgICB9XHJcbiAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgb3B0aW9ucy5vcmlnaW5hbEF0dHJpYnV0ZXMgPSB0aGlzLl9pbmplY3REZXBlbmRlbnRWaXJ0dWFsQXR0cmlidXRlcyhvcHRpb25zLmF0dHJpYnV0ZXMpO1xyXG5cclxuICAgICAgaWYgKG9wdGlvbnMuaW5jbHVkZSkge1xyXG4gICAgICAgIG9wdGlvbnMuaGFzSm9pbiA9IHRydWU7XHJcblxyXG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlSW5jbHVkZWRFbGVtZW50cyhvcHRpb25zLCB0YWJsZU5hbWVzKTtcclxuXHJcbiAgICAgICAgLy8gSWYgd2UncmUgbm90IHJhdywgd2UgaGF2ZSB0byBtYWtlIHN1cmUgd2UgaW5jbHVkZSB0aGUgcHJpbWFyeSBrZXkgZm9yIGRlLWR1cGxpY2F0aW9uXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgb3B0aW9ucy5hdHRyaWJ1dGVzXHJcbiAgICAgICAgICAmJiAhb3B0aW9ucy5yYXdcclxuICAgICAgICAgICYmIHRoaXMucHJpbWFyeUtleUF0dHJpYnV0ZVxyXG4gICAgICAgICAgJiYgIW9wdGlvbnMuYXR0cmlidXRlcy5pbmNsdWRlcyh0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGUpXHJcbiAgICAgICAgICAmJiAoIW9wdGlvbnMuZ3JvdXAgfHwgIW9wdGlvbnMuaGFzU2luZ2xlQXNzb2NpYXRpb24gfHwgb3B0aW9ucy5oYXNNdWx0aUFzc29jaWF0aW9uKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgb3B0aW9ucy5hdHRyaWJ1dGVzID0gW3RoaXMucHJpbWFyeUtleUF0dHJpYnV0ZV0uY29uY2F0KG9wdGlvbnMuYXR0cmlidXRlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIW9wdGlvbnMuYXR0cmlidXRlcykge1xyXG4gICAgICAgIG9wdGlvbnMuYXR0cmlidXRlcyA9IE9iamVjdC5rZXlzKHRoaXMucmF3QXR0cmlidXRlcyk7XHJcbiAgICAgICAgb3B0aW9ucy5vcmlnaW5hbEF0dHJpYnV0ZXMgPSB0aGlzLl9pbmplY3REZXBlbmRlbnRWaXJ0dWFsQXR0cmlidXRlcyhvcHRpb25zLmF0dHJpYnV0ZXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB3aGVyZUNvbGxlY3Rpb24gaXMgdXNlZCBmb3Igbm9uLXByaW1hcnkga2V5IHVwZGF0ZXNcclxuICAgICAgdGhpcy5vcHRpb25zLndoZXJlQ29sbGVjdGlvbiA9IG9wdGlvbnMud2hlcmUgfHwgbnVsbDtcclxuXHJcbiAgICAgIFV0aWxzLm1hcEZpbmRlck9wdGlvbnMob3B0aW9ucywgdGhpcyk7XHJcblxyXG4gICAgICBvcHRpb25zID0gdGhpcy5fcGFyYW5vaWRDbGF1c2UodGhpcywgb3B0aW9ucyk7XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdiZWZvcmVGaW5kQWZ0ZXJPcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICBjb25zdCBzZWxlY3RPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyB0YWJsZU5hbWVzOiBPYmplY3Qua2V5cyh0YWJsZU5hbWVzKSB9KTtcclxuICAgICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2Uuc2VsZWN0KHRoaXMsIHRoaXMuZ2V0VGFibGVOYW1lKHNlbGVjdE9wdGlvbnMpLCBzZWxlY3RPcHRpb25zKTtcclxuICAgIH0pLnRhcChyZXN1bHRzID0+IHtcclxuICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYWZ0ZXJGaW5kJywgcmVzdWx0cywgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH0pLnRoZW4ocmVzdWx0cyA9PiB7XHJcblxyXG4gICAgICAvL3JlamVjdE9uRW1wdHkgbW9kZVxyXG4gICAgICBpZiAoXy5pc0VtcHR5KHJlc3VsdHMpICYmIG9wdGlvbnMucmVqZWN0T25FbXB0eSkge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZWplY3RPbkVtcHR5ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgb3B0aW9ucy5yZWplY3RPbkVtcHR5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZWplY3RPbkVtcHR5ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgdGhyb3cgb3B0aW9ucy5yZWplY3RPbkVtcHR5O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLkVtcHR5UmVzdWx0RXJyb3IoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIE1vZGVsLl9maW5kU2VwYXJhdGUocmVzdWx0cywgb3B0aW9ucyk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyB3YXJuT25JbnZhbGlkT3B0aW9ucyhvcHRpb25zLCB2YWxpZENvbHVtbk5hbWVzKSB7XHJcbiAgICBpZiAoIV8uaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdW5yZWNvZ25pemVkT3B0aW9ucyA9IE9iamVjdC5rZXlzKG9wdGlvbnMpLmZpbHRlcihrID0+ICF2YWxpZFF1ZXJ5S2V5d29yZHMuaGFzKGspKTtcclxuICAgIGNvbnN0IHVuZXhwZWN0ZWRNb2RlbEF0dHJpYnV0ZXMgPSBfLmludGVyc2VjdGlvbih1bnJlY29nbml6ZWRPcHRpb25zLCB2YWxpZENvbHVtbk5hbWVzKTtcclxuICAgIGlmICghb3B0aW9ucy53aGVyZSAmJiB1bmV4cGVjdGVkTW9kZWxBdHRyaWJ1dGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgbG9nZ2VyLndhcm4oYE1vZGVsIGF0dHJpYnV0ZXMgKCR7dW5leHBlY3RlZE1vZGVsQXR0cmlidXRlcy5qb2luKCcsICcpfSkgcGFzc2VkIGludG8gZmluZGVyIG1ldGhvZCBvcHRpb25zIG9mIG1vZGVsICR7dGhpcy5uYW1lfSwgYnV0IHRoZSBvcHRpb25zLndoZXJlIG9iamVjdCBpcyBlbXB0eS4gRGlkIHlvdSBmb3JnZXQgdG8gdXNlIG9wdGlvbnMud2hlcmU/YCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgX2luamVjdERlcGVuZGVudFZpcnR1YWxBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcclxuICAgIGlmICghdGhpcy5faGFzVmlydHVhbEF0dHJpYnV0ZXMpIHJldHVybiBhdHRyaWJ1dGVzO1xyXG4gICAgaWYgKCFhdHRyaWJ1dGVzIHx8ICFBcnJheS5pc0FycmF5KGF0dHJpYnV0ZXMpKSByZXR1cm4gYXR0cmlidXRlcztcclxuXHJcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBhdHRyaWJ1dGVzKSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICB0aGlzLl92aXJ0dWFsQXR0cmlidXRlcy5oYXMoYXR0cmlidXRlKVxyXG4gICAgICAgICYmIHRoaXMucmF3QXR0cmlidXRlc1thdHRyaWJ1dGVdLnR5cGUuZmllbGRzXHJcbiAgICAgICkge1xyXG4gICAgICAgIGF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzLmNvbmNhdCh0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cmlidXRlXS50eXBlLmZpZWxkcyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhdHRyaWJ1dGVzID0gXy51bmlxKGF0dHJpYnV0ZXMpO1xyXG5cclxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIF9maW5kU2VwYXJhdGUocmVzdWx0cywgb3B0aW9ucykge1xyXG4gICAgaWYgKCFvcHRpb25zLmluY2x1ZGUgfHwgb3B0aW9ucy5yYXcgfHwgIXJlc3VsdHMpIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0cyk7XHJcblxyXG4gICAgY29uc3Qgb3JpZ2luYWwgPSByZXN1bHRzO1xyXG4gICAgaWYgKG9wdGlvbnMucGxhaW4pIHJlc3VsdHMgPSBbcmVzdWx0c107XHJcblxyXG4gICAgaWYgKCFyZXN1bHRzLmxlbmd0aCkgcmV0dXJuIG9yaWdpbmFsO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLm1hcChvcHRpb25zLmluY2x1ZGUsIGluY2x1ZGUgPT4ge1xyXG4gICAgICBpZiAoIWluY2x1ZGUuc2VwYXJhdGUpIHtcclxuICAgICAgICByZXR1cm4gTW9kZWwuX2ZpbmRTZXBhcmF0ZShcclxuICAgICAgICAgIHJlc3VsdHMucmVkdWNlKChtZW1vLCByZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgbGV0IGFzc29jaWF0aW9ucyA9IHJlc3VsdC5nZXQoaW5jbHVkZS5hc3NvY2lhdGlvbi5hcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBNaWdodCBiZSBhbiBlbXB0eSBiZWxvbmdzVG8gcmVsYXRpb25cclxuICAgICAgICAgICAgaWYgKCFhc3NvY2lhdGlvbnMpIHJldHVybiBtZW1vO1xyXG5cclxuICAgICAgICAgICAgLy8gRm9yY2UgYXJyYXkgc28gd2UgY2FuIGNvbmNhdCBubyBtYXR0ZXIgaWYgaXQncyAxOjEgb3IgOk1cclxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFzc29jaWF0aW9ucykpIGFzc29jaWF0aW9ucyA9IFthc3NvY2lhdGlvbnNdO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGFzc29jaWF0aW9ucy5sZW5ndGg7IGkgIT09IGxlbjsgKytpKSB7XHJcbiAgICAgICAgICAgICAgbWVtby5wdXNoKGFzc29jaWF0aW9uc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG1lbW87XHJcbiAgICAgICAgICB9LCBbXSksXHJcbiAgICAgICAgICBPYmplY3QuYXNzaWduKFxyXG4gICAgICAgICAgICB7fSxcclxuICAgICAgICAgICAgXy5vbWl0KG9wdGlvbnMsICdpbmNsdWRlJywgJ2F0dHJpYnV0ZXMnLCAnb3JkZXInLCAnd2hlcmUnLCAnbGltaXQnLCAnb2Zmc2V0JywgJ3BsYWluJywgJ3Njb3BlJyksXHJcbiAgICAgICAgICAgIHsgaW5jbHVkZTogaW5jbHVkZS5pbmNsdWRlIHx8IFtdIH1cclxuICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gaW5jbHVkZS5hc3NvY2lhdGlvbi5nZXQocmVzdWx0cywgT2JqZWN0LmFzc2lnbihcclxuICAgICAgICB7fSxcclxuICAgICAgICBfLm9taXQob3B0aW9ucywgbm9uQ2FzY2FkaW5nT3B0aW9ucyksXHJcbiAgICAgICAgXy5vbWl0KGluY2x1ZGUsIFsncGFyZW50JywgJ2Fzc29jaWF0aW9uJywgJ2FzJywgJ29yaWdpbmFsQXR0cmlidXRlcyddKVxyXG4gICAgICApKS50aGVuKG1hcCA9PiB7XHJcbiAgICAgICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xyXG4gICAgICAgICAgcmVzdWx0LnNldChcclxuICAgICAgICAgICAgaW5jbHVkZS5hc3NvY2lhdGlvbi5hcyxcclxuICAgICAgICAgICAgbWFwW3Jlc3VsdC5nZXQoaW5jbHVkZS5hc3NvY2lhdGlvbi5zb3VyY2VLZXkpXSxcclxuICAgICAgICAgICAgeyByYXc6IHRydWUgfVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSkucmV0dXJuKG9yaWdpbmFsKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNlYXJjaCBmb3IgYSBzaW5nbGUgaW5zdGFuY2UgYnkgaXRzIHByaW1hcnkga2V5Ll9cclxuICAgKlxyXG4gICAqIEBwYXJhbSAge251bWJlcnxzdHJpbmd8QnVmZmVyfSAgICAgIHBhcmFtIFRoZSB2YWx1ZSBvZiB0aGUgZGVzaXJlZCBpbnN0YW5jZSdzIHByaW1hcnkga2V5LlxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICAgICAgICAgIFtvcHRpb25zXSBmaW5kIG9wdGlvbnNcclxuICAgKiBAcGFyYW0gIHtUcmFuc2FjdGlvbn0gICAgICAgICAgICAgICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXHJcbiAgICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbC5maW5kQWxsfSAgICAgICAgICAgZm9yIGEgZnVsbCBleHBsYW5hdGlvbiBvZiBvcHRpb25zLCBOb3RlIHRoYXQgb3B0aW9ucy53aGVyZSBpcyBub3Qgc3VwcG9ydGVkLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWw+fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBmaW5kQnlQayhwYXJhbSwgb3B0aW9ucykge1xyXG4gICAgLy8gcmV0dXJuIFByb21pc2UgcmVzb2x2ZWQgd2l0aCBudWxsIGlmIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkXHJcbiAgICBpZiAoW251bGwsIHVuZGVmaW5lZF0uaW5jbHVkZXMocGFyYW0pKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKSB8fCB7fTtcclxuXHJcbiAgICBpZiAodHlwZW9mIHBhcmFtID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgcGFyYW0gPT09ICdzdHJpbmcnIHx8IEJ1ZmZlci5pc0J1ZmZlcihwYXJhbSkpIHtcclxuICAgICAgb3B0aW9ucy53aGVyZSA9IHtcclxuICAgICAgICBbdGhpcy5wcmltYXJ5S2V5QXR0cmlidXRlXTogcGFyYW1cclxuICAgICAgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXJndW1lbnQgcGFzc2VkIHRvIGZpbmRCeVBrIGlzIGludmFsaWQ6ICR7cGFyYW19YCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQnlwYXNzIGEgcG9zc2libGUgb3ZlcmxvYWRlZCBmaW5kT25lXHJcbiAgICByZXR1cm4gdGhpcy5maW5kT25lKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VhcmNoIGZvciBhIHNpbmdsZSBpbnN0YW5jZS4gVGhpcyBhcHBsaWVzIExJTUlUIDEsIHNvIHRoZSBsaXN0ZW5lciB3aWxsIGFsd2F5cyBiZSBjYWxsZWQgd2l0aCBhIHNpbmdsZSBpbnN0YW5jZS5cclxuICAgKlxyXG4gICAqIF9fQWxpYXNfXzogX2ZpbmRfXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgIFtvcHRpb25zXSBBIGhhc2ggb2Ygb3B0aW9ucyB0byBkZXNjcmliZSB0aGUgc2NvcGUgb2YgdGhlIHNlYXJjaFxyXG4gICAqIEBwYXJhbSAge1RyYW5zYWN0aW9ufSAgW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbC5maW5kQWxsfSBmb3IgYW4gZXhwbGFuYXRpb24gb2Ygb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWw+fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBmaW5kT25lKG9wdGlvbnMpIHtcclxuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQgJiYgIV8uaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBhcmd1bWVudCBwYXNzZWQgdG8gZmluZE9uZSBtdXN0IGJlIGFuIG9wdGlvbnMgb2JqZWN0LCB1c2UgZmluZEJ5UGsgaWYgeW91IHdpc2ggdG8gcGFzcyBhIHNpbmdsZSBwcmltYXJ5IGtleSB2YWx1ZScpO1xyXG4gICAgfVxyXG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5saW1pdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNvbnN0IHVuaXF1ZVNpbmdsZUNvbHVtbnMgPSBfLmNoYWluKHRoaXMudW5pcXVlS2V5cykudmFsdWVzKCkuZmlsdGVyKGMgPT4gYy5maWVsZHMubGVuZ3RoID09PSAxKS5tYXAoJ2NvbHVtbicpLnZhbHVlKCk7XHJcblxyXG4gICAgICAvLyBEb24ndCBhZGQgbGltaXQgaWYgcXVlcnlpbmcgZGlyZWN0bHkgb24gdGhlIHBrIG9yIGEgdW5pcXVlIGNvbHVtblxyXG4gICAgICBpZiAoIW9wdGlvbnMud2hlcmUgfHwgIV8uc29tZShvcHRpb25zLndoZXJlLCAodmFsdWUsIGtleSkgPT5cclxuICAgICAgICAoa2V5ID09PSB0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGUgfHwgdW5pcXVlU2luZ2xlQ29sdW1ucy5pbmNsdWRlcyhrZXkpKSAmJlxyXG4gICAgICAgICAgKFV0aWxzLmlzUHJpbWl0aXZlKHZhbHVlKSB8fCBCdWZmZXIuaXNCdWZmZXIodmFsdWUpKVxyXG4gICAgICApKSB7XHJcbiAgICAgICAgb3B0aW9ucy5saW1pdCA9IDE7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBCeXBhc3MgYSBwb3NzaWJsZSBvdmVybG9hZGVkIGZpbmRBbGwuXHJcbiAgICByZXR1cm4gdGhpcy5maW5kQWxsKF8uZGVmYXVsdHMob3B0aW9ucywge1xyXG4gICAgICBwbGFpbjogdHJ1ZVxyXG4gICAgfSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUnVuIGFuIGFnZ3JlZ2F0aW9uIG1ldGhvZCBvbiB0aGUgc3BlY2lmaWVkIGZpZWxkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgdG8gYWdncmVnYXRlIG92ZXIuIENhbiBiZSBhIGZpZWxkIG5hbWUgb3IgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICBhZ2dyZWdhdGVGdW5jdGlvbiBUaGUgZnVuY3Rpb24gdG8gdXNlIGZvciBhZ2dyZWdhdGlvbiwgZS5nLiBzdW0sIG1heCBldGMuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgIFtvcHRpb25zXSBRdWVyeSBvcHRpb25zLiBTZWUgc2VxdWVsaXplLnF1ZXJ5IGZvciBmdWxsIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgW29wdGlvbnMud2hlcmVdIEEgaGFzaCBvZiBzZWFyY2ggYXR0cmlidXRlcy5cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgIFtvcHRpb25zLmJlbmNobWFyaz1mYWxzZV0gUGFzcyBxdWVyeSBleGVjdXRpb24gdGltZSBpbiBtaWxsaXNlY29uZHMgYXMgc2Vjb25kIGFyZ3VtZW50IHRvIGxvZ2dpbmcgZnVuY3Rpb24gKG9wdGlvbnMubG9nZ2luZykuXHJcbiAgICogQHBhcmFtIHtEYXRhVHlwZXN8c3RyaW5nfSBbb3B0aW9ucy5kYXRhVHlwZV0gVGhlIHR5cGUgb2YgdGhlIHJlc3VsdC4gSWYgYGZpZWxkYCBpcyBhIGZpZWxkIGluIHRoaXMgTW9kZWwsIHRoZSBkZWZhdWx0IHdpbGwgYmUgdGhlIHR5cGUgb2YgdGhhdCBmaWVsZCwgb3RoZXJ3aXNlIGRlZmF1bHRzIHRvIGZsb2F0LlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICBbb3B0aW9ucy5kaXN0aW5jdF0gQXBwbGllcyBESVNUSU5DVCB0byB0aGUgZmllbGQgYmVpbmcgYWdncmVnYXRlZCBvdmVyXHJcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gICAgIFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMucGxhaW5dIFdoZW4gYHRydWVgLCB0aGUgZmlyc3QgcmV0dXJuZWQgdmFsdWUgb2YgYGFnZ3JlZ2F0ZUZ1bmN0aW9uYCBpcyBjYXN0IHRvIGBkYXRhVHlwZWAgYW5kIHJldHVybmVkLiBJZiBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMgYXJlIHNwZWNpZmllZCwgYWxvbmcgd2l0aCBgZ3JvdXBgIGNsYXVzZXMsIHNldCBgcGxhaW5gIHRvIGBmYWxzZWAgdG8gcmV0dXJuIGFsbCB2YWx1ZXMgb2YgYWxsIHJldHVybmVkIHJvd3MuICBEZWZhdWx0cyB0byBgdHJ1ZWBcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPERhdGFUeXBlc3xPYmplY3Q+fSBSZXR1cm5zIHRoZSBhZ2dyZWdhdGUgcmVzdWx0IGNhc3QgdG8gYG9wdGlvbnMuZGF0YVR5cGVgLCB1bmxlc3MgYG9wdGlvbnMucGxhaW5gIGlzIGZhbHNlLCBpbiB3aGljaCBjYXNlIHRoZSBjb21wbGV0ZSBkYXRhIHJlc3VsdCBpcyByZXR1cm5lZC5cclxuICAgKi9cclxuICBzdGF0aWMgYWdncmVnYXRlKGF0dHJpYnV0ZSwgYWdncmVnYXRlRnVuY3Rpb24sIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcblxyXG4gICAgLy8gV2UgbmVlZCB0byBwcmVzZXJ2ZSBhdHRyaWJ1dGVzIGhlcmUgYXMgdGhlIGBpbmplY3RTY29wZWAgY2FsbCB3b3VsZCBpbmplY3Qgbm9uIGFnZ3JlZ2F0ZSBjb2x1bW5zLlxyXG4gICAgY29uc3QgcHJldkF0dHJpYnV0ZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXM7XHJcbiAgICB0aGlzLl9pbmplY3RTY29wZShvcHRpb25zKTtcclxuICAgIG9wdGlvbnMuYXR0cmlidXRlcyA9IHByZXZBdHRyaWJ1dGVzO1xyXG4gICAgdGhpcy5fY29uZm9ybUluY2x1ZGVzKG9wdGlvbnMsIHRoaXMpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmluY2x1ZGUpIHtcclxuICAgICAgdGhpcy5fZXhwYW5kSW5jbHVkZUFsbChvcHRpb25zKTtcclxuICAgICAgdGhpcy5fdmFsaWRhdGVJbmNsdWRlZEVsZW1lbnRzKG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGF0dHJPcHRpb25zID0gdGhpcy5yYXdBdHRyaWJ1dGVzW2F0dHJpYnV0ZV07XHJcbiAgICBjb25zdCBmaWVsZCA9IGF0dHJPcHRpb25zICYmIGF0dHJPcHRpb25zLmZpZWxkIHx8IGF0dHJpYnV0ZTtcclxuICAgIGxldCBhZ2dyZWdhdGVDb2x1bW4gPSB0aGlzLnNlcXVlbGl6ZS5jb2woZmllbGQpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmRpc3RpbmN0KSB7XHJcbiAgICAgIGFnZ3JlZ2F0ZUNvbHVtbiA9IHRoaXMuc2VxdWVsaXplLmZuKCdESVNUSU5DVCcsIGFnZ3JlZ2F0ZUNvbHVtbik7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHsgZ3JvdXAgfSA9IG9wdGlvbnM7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShncm91cCkgJiYgQXJyYXkuaXNBcnJheShncm91cFswXSkpIHtcclxuICAgICAgbm9Eb3VibGVOZXN0ZWRHcm91cCgpO1xyXG4gICAgICBncm91cCA9IF8uZmxhdHRlbihncm91cCk7XHJcbiAgICB9XHJcbiAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBfLnVuaW9uQnkoXHJcbiAgICAgIG9wdGlvbnMuYXR0cmlidXRlcyxcclxuICAgICAgZ3JvdXAsXHJcbiAgICAgIFtbdGhpcy5zZXF1ZWxpemUuZm4oYWdncmVnYXRlRnVuY3Rpb24sIGFnZ3JlZ2F0ZUNvbHVtbiksIGFnZ3JlZ2F0ZUZ1bmN0aW9uXV0sXHJcbiAgICAgIGEgPT4gQXJyYXkuaXNBcnJheShhKSA/IGFbMV0gOiBhXHJcbiAgICApO1xyXG5cclxuICAgIGlmICghb3B0aW9ucy5kYXRhVHlwZSkge1xyXG4gICAgICBpZiAoYXR0ck9wdGlvbnMpIHtcclxuICAgICAgICBvcHRpb25zLmRhdGFUeXBlID0gYXR0ck9wdGlvbnMudHlwZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBVc2UgRkxPQVQgYXMgZmFsbGJhY2tcclxuICAgICAgICBvcHRpb25zLmRhdGFUeXBlID0gbmV3IERhdGFUeXBlcy5GTE9BVCgpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvcHRpb25zLmRhdGFUeXBlID0gdGhpcy5zZXF1ZWxpemUubm9ybWFsaXplRGF0YVR5cGUob3B0aW9ucy5kYXRhVHlwZSk7XHJcbiAgICB9XHJcblxyXG4gICAgVXRpbHMubWFwT3B0aW9uRmllbGROYW1lcyhvcHRpb25zLCB0aGlzKTtcclxuICAgIG9wdGlvbnMgPSB0aGlzLl9wYXJhbm9pZENsYXVzZSh0aGlzLCBvcHRpb25zKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5RdWVyeUludGVyZmFjZS5yYXdTZWxlY3QodGhpcy5nZXRUYWJsZU5hbWUob3B0aW9ucyksIG9wdGlvbnMsIGFnZ3JlZ2F0ZUZ1bmN0aW9uLCB0aGlzKS50aGVuKCB2YWx1ZSA9PiB7XHJcbiAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ291bnQgdGhlIG51bWJlciBvZiByZWNvcmRzIG1hdGNoaW5nIHRoZSBwcm92aWRlZCB3aGVyZSBjbGF1c2UuXHJcbiAgICpcclxuICAgKiBJZiB5b3UgcHJvdmlkZSBhbiBgaW5jbHVkZWAgb3B0aW9uLCB0aGUgbnVtYmVyIG9mIG1hdGNoaW5nIGFzc29jaWF0aW9ucyB3aWxsIGJlIGNvdW50ZWQgaW5zdGVhZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgW29wdGlvbnNdIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgIFtvcHRpb25zLndoZXJlXSBBIGhhc2ggb2Ygc2VhcmNoIGF0dHJpYnV0ZXMuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICBbb3B0aW9ucy5pbmNsdWRlXSBJbmNsdWRlIG9wdGlvbnMuIFNlZSBgZmluZGAgZm9yIGRldGFpbHNcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgIFtvcHRpb25zLnBhcmFub2lkPXRydWVdIFNldCBgdHJ1ZWAgdG8gY291bnQgb25seSBub24tZGVsZXRlZCByZWNvcmRzLiBDYW4gYmUgdXNlZCBvbiBtb2RlbHMgd2l0aCBgcGFyYW5vaWRgIGVuYWJsZWRcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgIFtvcHRpb25zLmRpc3RpbmN0XSBBcHBseSBDT1VOVChESVNUSU5DVChjb2wpKSBvbiBwcmltYXJ5IGtleSBvciBvbiBvcHRpb25zLmNvbC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgIFtvcHRpb25zLmNvbF0gQ29sdW1uIG9uIHdoaWNoIENPVU5UKCkgc2hvdWxkIGJlIGFwcGxpZWRcclxuICAgKiBAcGFyYW0ge0FycmF5fSAgICAgICAgIFtvcHRpb25zLmF0dHJpYnV0ZXNdIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCBgZ3JvdXBgXHJcbiAgICogQHBhcmFtIHtBcnJheX0gICAgICAgICBbb3B0aW9ucy5ncm91cF0gRm9yIGNyZWF0aW5nIGNvbXBsZXggY291bnRzLiBXaWxsIHJldHVybiBtdWx0aXBsZSByb3dzIGFzIG5lZWRlZC5cclxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSAgIFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgW29wdGlvbnMuYmVuY2htYXJrPWZhbHNlXSBQYXNzIHF1ZXJ5IGV4ZWN1dGlvbiB0aW1lIGluIG1pbGxpc2Vjb25kcyBhcyBzZWNvbmQgYXJndW1lbnQgdG8gbG9nZ2luZyBmdW5jdGlvbiAob3B0aW9ucy5sb2dnaW5nKS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgIFtvcHRpb25zLnNlYXJjaFBhdGg9REVGQVVMVF0gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPG51bWJlcj59XHJcbiAgICovXHJcbiAgc3RhdGljIGNvdW50KG9wdGlvbnMpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XHJcbiAgICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcbiAgICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKG9wdGlvbnMsIHsgaG9va3M6IHRydWUgfSk7XHJcbiAgICAgIG9wdGlvbnMucmF3ID0gdHJ1ZTtcclxuICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYmVmb3JlQ291bnQnLCBvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgIGxldCBjb2wgPSBvcHRpb25zLmNvbCB8fCAnKic7XHJcbiAgICAgIGlmIChvcHRpb25zLmluY2x1ZGUpIHtcclxuICAgICAgICBjb2wgPSBgJHt0aGlzLm5hbWV9LiR7b3B0aW9ucy5jb2wgfHwgdGhpcy5wcmltYXJ5S2V5RmllbGR9YDtcclxuICAgICAgfVxyXG5cclxuICAgICAgb3B0aW9ucy5wbGFpbiA9ICFvcHRpb25zLmdyb3VwO1xyXG4gICAgICBvcHRpb25zLmRhdGFUeXBlID0gbmV3IERhdGFUeXBlcy5JTlRFR0VSKCk7XHJcbiAgICAgIG9wdGlvbnMuaW5jbHVkZUlnbm9yZUF0dHJpYnV0ZXMgPSBmYWxzZTtcclxuXHJcbiAgICAgIC8vIE5vIGxpbWl0LCBvZmZzZXQgb3Igb3JkZXIgZm9yIHRoZSBvcHRpb25zIG1heCBiZSBnaXZlbiB0byBjb3VudCgpXHJcbiAgICAgIC8vIFNldCB0aGVtIHRvIG51bGwgdG8gcHJldmVudCBzY29wZXMgc2V0dGluZyB0aG9zZSB2YWx1ZXNcclxuICAgICAgb3B0aW9ucy5saW1pdCA9IG51bGw7XHJcbiAgICAgIG9wdGlvbnMub2Zmc2V0ID0gbnVsbDtcclxuICAgICAgb3B0aW9ucy5vcmRlciA9IG51bGw7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5hZ2dyZWdhdGUoY29sLCAnY291bnQnLCBvcHRpb25zKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCBhbGwgdGhlIHJvd3MgbWF0Y2hpbmcgeW91ciBxdWVyeSwgd2l0aGluIGEgc3BlY2lmaWVkIG9mZnNldCAvIGxpbWl0LCBhbmQgZ2V0IHRoZSB0b3RhbCBudW1iZXIgb2Ygcm93cyBtYXRjaGluZyB5b3VyIHF1ZXJ5LiBUaGlzIGlzIHZlcnkgdXNlZnVsIGZvciBwYWdpbmdcclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogTW9kZWwuZmluZEFuZENvdW50QWxsKHtcclxuICAgKiAgIHdoZXJlOiAuLi4sXHJcbiAgICogICBsaW1pdDogMTIsXHJcbiAgICogICBvZmZzZXQ6IDEyXHJcbiAgICogfSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAqICAgLi4uXHJcbiAgICogfSlcclxuICAgKlxyXG4gICAqICMgSW4gdGhlIGFib3ZlIGV4YW1wbGUsIGByZXN1bHQucm93c2Agd2lsbCBjb250YWluIHJvd3MgMTMgdGhyb3VnaCAyNCwgd2hpbGUgYHJlc3VsdC5jb3VudGAgd2lsbCByZXR1cm4gdGhlIHRvdGFsIG51bWJlciBvZiByb3dzIHRoYXQgbWF0Y2hlZCB5b3VyIHF1ZXJ5LlxyXG4gICAqXHJcbiAgICogIyBXaGVuIHlvdSBhZGQgaW5jbHVkZXMsIG9ubHkgdGhvc2Ugd2hpY2ggYXJlIHJlcXVpcmVkIChlaXRoZXIgYmVjYXVzZSB0aGV5IGhhdmUgYSB3aGVyZSBjbGF1c2UsIG9yIGJlY2F1c2UgYHJlcXVpcmVkYCBpcyBleHBsaWNpdGx5IHNldCB0byB0cnVlIG9uIHRoZSBpbmNsdWRlKSB3aWxsIGJlIGFkZGVkIHRvIHRoZSBjb3VudCBwYXJ0LlxyXG4gICAqXHJcbiAgICogIyBTdXBwb3NlIHlvdSB3YW50IHRvIGZpbmQgYWxsIHVzZXJzIHdobyBoYXZlIGEgcHJvZmlsZSBhdHRhY2hlZDpcclxuICAgKlxyXG4gICAqIFVzZXIuZmluZEFuZENvdW50QWxsKHtcclxuICAgKiAgIGluY2x1ZGU6IFtcclxuICAgKiAgICAgIHsgbW9kZWw6IFByb2ZpbGUsIHJlcXVpcmVkOiB0cnVlfVxyXG4gICAqICAgXSxcclxuICAgKiAgIGxpbWl0IDNcclxuICAgKiB9KTtcclxuICAgKlxyXG4gICAqICMgQmVjYXVzZSB0aGUgaW5jbHVkZSBmb3IgYFByb2ZpbGVgIGhhcyBgcmVxdWlyZWRgIHNldCBpdCB3aWxsIHJlc3VsdCBpbiBhbiBpbm5lciBqb2luLCBhbmQgb25seSB0aGUgdXNlcnMgd2hvIGhhdmUgYSBwcm9maWxlIHdpbGwgYmUgY291bnRlZC4gSWYgd2UgcmVtb3ZlIGByZXF1aXJlZGAgZnJvbSB0aGUgaW5jbHVkZSwgYm90aCB1c2VycyB3aXRoIGFuZCB3aXRob3V0IHByb2ZpbGVzIHdpbGwgYmUgY291bnRlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBTZWUgZmluZEFsbCBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9IGZvciBhIHNwZWNpZmljYXRpb24gb2YgZmluZCBhbmQgcXVlcnkgb3B0aW9uc1xyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgTW9kZWwuY291bnR9IGZvciBhIHNwZWNpZmljYXRpb24gb2YgY291bnQgb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8e2NvdW50OiBudW1iZXIsIHJvd3M6IE1vZGVsW119Pn1cclxuICAgKi9cclxuICBzdGF0aWMgZmluZEFuZENvdW50QWxsKG9wdGlvbnMpIHtcclxuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQgJiYgIV8uaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBhcmd1bWVudCBwYXNzZWQgdG8gZmluZEFuZENvdW50QWxsIG11c3QgYmUgYW4gb3B0aW9ucyBvYmplY3QsIHVzZSBmaW5kQnlQayBpZiB5b3Ugd2lzaCB0byBwYXNzIGEgc2luZ2xlIHByaW1hcnkga2V5IHZhbHVlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY291bnRPcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xyXG5cclxuICAgIGlmIChjb3VudE9wdGlvbnMuYXR0cmlidXRlcykge1xyXG4gICAgICBjb3VudE9wdGlvbnMuYXR0cmlidXRlcyA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG4gICAgICB0aGlzLmNvdW50KGNvdW50T3B0aW9ucyksXHJcbiAgICAgIHRoaXMuZmluZEFsbChvcHRpb25zKVxyXG4gICAgXSlcclxuICAgICAgLnRoZW4oKFtjb3VudCwgcm93c10pID0+ICh7XHJcbiAgICAgICAgY291bnQsXHJcbiAgICAgICAgcm93czogY291bnQgPT09IDAgPyBbXSA6IHJvd3NcclxuICAgICAgfSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCB0aGUgbWF4aW11bSB2YWx1ZSBvZiBmaWVsZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGF0dHJpYnV0ZSAvIGZpZWxkIG5hbWVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFNlZSBhZ2dyZWdhdGVcclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgTW9kZWwuYWdncmVnYXRlfSBmb3Igb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8Kj59XHJcbiAgICovXHJcbiAgc3RhdGljIG1heChmaWVsZCwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuIHRoaXMuYWdncmVnYXRlKGZpZWxkLCAnbWF4Jywgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGaW5kIHRoZSBtaW5pbXVtIHZhbHVlIG9mIGZpZWxkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgYXR0cmlidXRlIC8gZmllbGQgbmFtZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gU2VlIGFnZ3JlZ2F0ZVxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbC5hZ2dyZWdhdGV9IGZvciBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTwqPn1cclxuICAgKi9cclxuICBzdGF0aWMgbWluKGZpZWxkLCBvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hZ2dyZWdhdGUoZmllbGQsICdtaW4nLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbmQgdGhlIHN1bSBvZiBmaWVsZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGF0dHJpYnV0ZSAvIGZpZWxkIG5hbWVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFNlZSBhZ2dyZWdhdGVcclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgTW9kZWwuYWdncmVnYXRlfSBmb3Igb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8bnVtYmVyPn1cclxuICAgKi9cclxuICBzdGF0aWMgc3VtKGZpZWxkLCBvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hZ2dyZWdhdGUoZmllbGQsICdzdW0nLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJ1aWxkcyBhIG5ldyBtb2RlbCBpbnN0YW5jZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSB2YWx1ZXMgQW4gb2JqZWN0IG9mIGtleSB2YWx1ZSBwYWlycyBvciBhbiBhcnJheSBvZiBzdWNoLiBJZiBhbiBhcnJheSwgdGhlIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIGFuIGFycmF5IG9mIGluc3RhbmNlcy5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gIFtvcHRpb25zXSBJbnN0YW5jZSBidWlsZCBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yYXc9ZmFsc2VdIElmIHNldCB0byB0cnVlLCB2YWx1ZXMgd2lsbCBpZ25vcmUgZmllbGQgYW5kIHZpcnR1YWwgc2V0dGVycy5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmlzTmV3UmVjb3JkPXRydWVdIElzIHRoaXMgbmV3IHJlY29yZFxyXG4gICAqIEBwYXJhbSB7QXJyYXl9ICAgW29wdGlvbnMuaW5jbHVkZV0gYW4gYXJyYXkgb2YgaW5jbHVkZSBvcHRpb25zIC0gVXNlZCB0byBidWlsZCBwcmVmZXRjaGVkL2luY2x1ZGVkIG1vZGVsIGluc3RhbmNlcy4gU2VlIGBzZXRgXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7TW9kZWx8QXJyYXk8TW9kZWw+fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBidWlsZCh2YWx1ZXMsIG9wdGlvbnMpIHtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlcykpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYnVsa0J1aWxkKHZhbHVlcywgb3B0aW9ucyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IHRoaXModmFsdWVzLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBidWxrQnVpbGQodmFsdWVTZXRzLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgIGlzTmV3UmVjb3JkOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zIHx8IHt9KTtcclxuXHJcbiAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZVZhbGlkYXRlZCkge1xyXG4gICAgICB0aGlzLl9jb25mb3JtSW5jbHVkZXMob3B0aW9ucywgdGhpcyk7XHJcbiAgICAgIGlmIChvcHRpb25zLmluY2x1ZGUpIHtcclxuICAgICAgICB0aGlzLl9leHBhbmRJbmNsdWRlQWxsKG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlSW5jbHVkZWRFbGVtZW50cyhvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMpIHtcclxuICAgICAgb3B0aW9ucy5hdHRyaWJ1dGVzID0gb3B0aW9ucy5hdHRyaWJ1dGVzLm1hcChhdHRyaWJ1dGUgPT4gQXJyYXkuaXNBcnJheShhdHRyaWJ1dGUpID8gYXR0cmlidXRlWzFdIDogYXR0cmlidXRlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsdWVTZXRzLm1hcCh2YWx1ZXMgPT4gdGhpcy5idWlsZCh2YWx1ZXMsIG9wdGlvbnMpKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJ1aWxkcyBhIG5ldyBtb2RlbCBpbnN0YW5jZSBhbmQgY2FsbHMgc2F2ZSBvbiBpdC5cclxuXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbC5idWlsZH1cclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLnNhdmV9XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgIHZhbHVlcyBoYXNoIG9mIGRhdGEgdmFsdWVzIHRvIGNyZWF0ZSBuZXcgcmVjb3JkIHdpdGhcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgIFtvcHRpb25zXSBidWlsZCBhbmQgcXVlcnkgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgW29wdGlvbnMucmF3PWZhbHNlXSBJZiBzZXQgdG8gdHJ1ZSwgdmFsdWVzIHdpbGwgaWdub3JlIGZpZWxkIGFuZCB2aXJ0dWFsIHNldHRlcnMuXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICBbb3B0aW9ucy5pc05ld1JlY29yZD10cnVlXSBJcyB0aGlzIG5ldyByZWNvcmRcclxuICAgKiBAcGFyYW0ge0FycmF5fSAgICAgICAgIFtvcHRpb25zLmluY2x1ZGVdIGFuIGFycmF5IG9mIGluY2x1ZGUgb3B0aW9ucyAtIFVzZWQgdG8gYnVpbGQgcHJlZmV0Y2hlZC9pbmNsdWRlZCBtb2RlbCBpbnN0YW5jZXMuIFNlZSBgc2V0YFxyXG4gICAqIEBwYXJhbSB7QXJyYXl9ICAgICAgICAgW29wdGlvbnMuZmllbGRzXSBJZiBzZXQsIG9ubHkgY29sdW1ucyBtYXRjaGluZyB0aG9zZSBpbiBmaWVsZHMgd2lsbCBiZSBzYXZlZFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nW119ICAgICAgW29wdGlvbnMuZmllbGRzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBzdHJpbmdzLCByZXByZXNlbnRpbmcgZGF0YWJhc2UgY29sdW1ucy4gSWYgZmllbGRzIGlzIHByb3ZpZGVkLCBvbmx5IHRob3NlIGNvbHVtbnMgd2lsbCBiZSB2YWxpZGF0ZWQgYW5kIHNhdmVkLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgW29wdGlvbnMuc2lsZW50PWZhbHNlXSBJZiB0cnVlLCB0aGUgdXBkYXRlZEF0IHRpbWVzdGFtcCB3aWxsIG5vdCBiZSB1cGRhdGVkLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgW29wdGlvbnMudmFsaWRhdGU9dHJ1ZV0gSWYgZmFsc2UsIHZhbGlkYXRpb25zIHdvbid0IGJlIHJ1bi5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgIFtvcHRpb25zLmhvb2tzPXRydWVdIFJ1biBiZWZvcmUgYW5kIGFmdGVyIGNyZWF0ZSAvIHVwZGF0ZSArIHZhbGlkYXRlIGhvb2tzXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgICBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGlsZSBydW5uaW5nIHRoZSBxdWVyeSB0byBsb2cgdGhlIHNxbC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgIFtvcHRpb25zLmJlbmNobWFyaz1mYWxzZV0gUGFzcyBxdWVyeSBleGVjdXRpb24gdGltZSBpbiBtaWxsaXNlY29uZHMgYXMgc2Vjb25kIGFyZ3VtZW50IHRvIGxvZ2dpbmcgZnVuY3Rpb24gKG9wdGlvbnMubG9nZ2luZykuXHJcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICBbb3B0aW9ucy5zZWFyY2hQYXRoPURFRkFVTFRdIEFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byBzcGVjaWZ5IHRoZSBzY2hlbWEgc2VhcmNoX3BhdGggKFBvc3RncmVzIG9ubHkpXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICBbb3B0aW9ucy5yZXR1cm5pbmc9dHJ1ZV0gUmV0dXJuIHRoZSBhZmZlY3RlZCByb3dzIChvbmx5IGZvciBwb3N0Z3JlcylcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsPn1cclxuICAgKlxyXG4gICAqL1xyXG4gIHN0YXRpYyBjcmVhdGUodmFsdWVzLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMgfHwge30pO1xyXG5cclxuICAgIHJldHVybiB0aGlzLmJ1aWxkKHZhbHVlcywge1xyXG4gICAgICBpc05ld1JlY29yZDogdHJ1ZSxcclxuICAgICAgYXR0cmlidXRlczogb3B0aW9ucy5maWVsZHMsXHJcbiAgICAgIGluY2x1ZGU6IG9wdGlvbnMuaW5jbHVkZSxcclxuICAgICAgcmF3OiBvcHRpb25zLnJhdyxcclxuICAgICAgc2lsZW50OiBvcHRpb25zLnNpbGVudFxyXG4gICAgfSkuc2F2ZShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZpbmQgYSByb3cgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeSwgb3IgYnVpbGQgKGJ1dCBkb24ndCBzYXZlKSB0aGUgcm93IGlmIG5vbmUgaXMgZm91bmQuXHJcbiAgICogVGhlIHN1Y2Nlc3NmdWwgcmVzdWx0IG9mIHRoZSBwcm9taXNlIHdpbGwgYmUgKGluc3RhbmNlLCBidWlsdClcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIG9wdGlvbnMgZmluZCBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgb3B0aW9ucy53aGVyZSBBIGhhc2ggb2Ygc2VhcmNoIGF0dHJpYnV0ZXMuIElmIGB3aGVyZWAgaXMgYSBwbGFpbiBvYmplY3QgaXQgd2lsbCBiZSBhcHBlbmRlZCB3aXRoIGRlZmF1bHRzIHRvIGJ1aWxkIGEgbmV3IGluc3RhbmNlLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIFtvcHRpb25zLmRlZmF1bHRzXSBEZWZhdWx0IHZhbHVlcyB0byB1c2UgaWYgYnVpbGRpbmcgYSBuZXcgaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbCxib29sZWFuPn1cclxuICAgKi9cclxuICBzdGF0aWMgZmluZE9yQnVpbGQob3B0aW9ucykge1xyXG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLndoZXJlIHx8IGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnTWlzc2luZyB3aGVyZSBhdHRyaWJ1dGUgaW4gdGhlIG9wdGlvbnMgcGFyYW1ldGVyIHBhc3NlZCB0byBmaW5kT3JCdWlsZC4gJyArXHJcbiAgICAgICAgJ1BsZWFzZSBub3RlIHRoYXQgdGhlIEFQSSBoYXMgY2hhbmdlZCwgYW5kIGlzIG5vdyBvcHRpb25zIG9ubHkgKGFuIG9iamVjdCB3aXRoIHdoZXJlLCBkZWZhdWx0cyBrZXlzLCB0cmFuc2FjdGlvbiBldGMuKSdcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgdmFsdWVzO1xyXG5cclxuICAgIHJldHVybiB0aGlzLmZpbmRPbmUob3B0aW9ucykudGhlbihpbnN0YW5jZSA9PiB7XHJcbiAgICAgIGlmIChpbnN0YW5jZSA9PT0gbnVsbCkge1xyXG4gICAgICAgIHZhbHVlcyA9IF8uY2xvbmUob3B0aW9ucy5kZWZhdWx0cykgfHwge307XHJcbiAgICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdChvcHRpb25zLndoZXJlKSkge1xyXG4gICAgICAgICAgdmFsdWVzID0gVXRpbHMuZGVmYXVsdHModmFsdWVzLCBvcHRpb25zLndoZXJlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc3RhbmNlID0gdGhpcy5idWlsZCh2YWx1ZXMsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtpbnN0YW5jZSwgdHJ1ZV0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtpbnN0YW5jZSwgZmFsc2VdKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmluZCBhIHJvdyB0aGF0IG1hdGNoZXMgdGhlIHF1ZXJ5LCBvciBidWlsZCBhbmQgc2F2ZSB0aGUgcm93IGlmIG5vbmUgaXMgZm91bmRcclxuICAgKiBUaGUgc3VjY2Vzc2Z1bCByZXN1bHQgb2YgdGhlIHByb21pc2Ugd2lsbCBiZSAoaW5zdGFuY2UsIGNyZWF0ZWQpXHJcbiAgICpcclxuICAgKiBJZiBubyB0cmFuc2FjdGlvbiBpcyBwYXNzZWQgaW4gdGhlIGBvcHRpb25zYCBvYmplY3QsIGEgbmV3IHRyYW5zYWN0aW9uIHdpbGwgYmUgY3JlYXRlZCBpbnRlcm5hbGx5LCB0byBwcmV2ZW50IHRoZSByYWNlIGNvbmRpdGlvbiB3aGVyZSBhIG1hdGNoaW5nIHJvdyBpcyBjcmVhdGVkIGJ5IGFub3RoZXIgY29ubmVjdGlvbiBhZnRlciB0aGUgZmluZCBidXQgYmVmb3JlIHRoZSBpbnNlcnQgY2FsbC5cclxuICAgKiBIb3dldmVyLCBpdCBpcyBub3QgYWx3YXlzIHBvc3NpYmxlIHRvIGhhbmRsZSB0aGlzIGNhc2UgaW4gU1FMaXRlLCBzcGVjaWZpY2FsbHkgaWYgb25lIHRyYW5zYWN0aW9uIGluc2VydHMgYW5kIGFub3RoZXIgdHJpZXMgdG8gc2VsZWN0IGJlZm9yZSB0aGUgZmlyc3Qgb25lIGhhcyBjb21taXR0ZWQuIEluIHRoaXMgY2FzZSwgYW4gaW5zdGFuY2Ugb2Ygc2VxdWVsaXplLiBUaW1lb3V0RXJyb3Igd2lsbCBiZSB0aHJvd24gaW5zdGVhZC5cclxuICAgKiBJZiBhIHRyYW5zYWN0aW9uIGlzIGNyZWF0ZWQsIGEgc2F2ZXBvaW50IHdpbGwgYmUgY3JlYXRlZCBpbnN0ZWFkLCBhbmQgYW55IHVuaXF1ZSBjb25zdHJhaW50IHZpb2xhdGlvbiB3aWxsIGJlIGhhbmRsZWQgaW50ZXJuYWxseS5cclxuICAgKlxyXG4gICAqIEBzZWVcclxuICAgKiB7QGxpbmsgTW9kZWwuZmluZEFsbH0gZm9yIGEgZnVsbCBzcGVjaWZpY2F0aW9uIG9mIGZpbmQgYW5kIG9wdGlvbnNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIG9wdGlvbnMgZmluZCBhbmQgY3JlYXRlIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICBvcHRpb25zLndoZXJlIHdoZXJlIEEgaGFzaCBvZiBzZWFyY2ggYXR0cmlidXRlcy4gSWYgYHdoZXJlYCBpcyBhIHBsYWluIG9iamVjdCBpdCB3aWxsIGJlIGFwcGVuZGVkIHdpdGggZGVmYXVsdHMgdG8gYnVpbGQgYSBuZXcgaW5zdGFuY2UuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgW29wdGlvbnMuZGVmYXVsdHNdIERlZmF1bHQgdmFsdWVzIHRvIHVzZSBpZiBjcmVhdGluZyBhIG5ldyBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsLGJvb2xlYW4+fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBmaW5kT3JDcmVhdGUob3B0aW9ucykge1xyXG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLndoZXJlIHx8IGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnTWlzc2luZyB3aGVyZSBhdHRyaWJ1dGUgaW4gdGhlIG9wdGlvbnMgcGFyYW1ldGVyIHBhc3NlZCB0byBmaW5kT3JDcmVhdGUuICcgK1xyXG4gICAgICAgICdQbGVhc2Ugbm90ZSB0aGF0IHRoZSBBUEkgaGFzIGNoYW5nZWQsIGFuZCBpcyBub3cgb3B0aW9ucyBvbmx5IChhbiBvYmplY3Qgd2l0aCB3aGVyZSwgZGVmYXVsdHMga2V5cywgdHJhbnNhY3Rpb24gZXRjLiknXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmRlZmF1bHRzKSB7XHJcbiAgICAgIGNvbnN0IGRlZmF1bHRzID0gT2JqZWN0LmtleXMob3B0aW9ucy5kZWZhdWx0cyk7XHJcbiAgICAgIGNvbnN0IHVua25vd25EZWZhdWx0cyA9IGRlZmF1bHRzLmZpbHRlcihuYW1lID0+ICF0aGlzLnJhd0F0dHJpYnV0ZXNbbmFtZV0pO1xyXG5cclxuICAgICAgaWYgKHVua25vd25EZWZhdWx0cy5sZW5ndGgpIHtcclxuICAgICAgICBsb2dnZXIud2FybihgVW5rbm93biBhdHRyaWJ1dGVzICgke3Vua25vd25EZWZhdWx0c30pIHBhc3NlZCB0byBkZWZhdWx0cyBvcHRpb24gb2YgZmluZE9yQ3JlYXRlYCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy50cmFuc2FjdGlvbiA9PT0gdW5kZWZpbmVkICYmIHRoaXMuc2VxdWVsaXplLmNvbnN0cnVjdG9yLl9jbHMpIHtcclxuICAgICAgY29uc3QgdCA9IHRoaXMuc2VxdWVsaXplLmNvbnN0cnVjdG9yLl9jbHMuZ2V0KCd0cmFuc2FjdGlvbicpO1xyXG4gICAgICBpZiAodCkge1xyXG4gICAgICAgIG9wdGlvbnMudHJhbnNhY3Rpb24gPSB0O1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaW50ZXJuYWxUcmFuc2FjdGlvbiA9ICFvcHRpb25zLnRyYW5zYWN0aW9uO1xyXG4gICAgbGV0IHZhbHVlcztcclxuICAgIGxldCB0cmFuc2FjdGlvbjtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSB0cmFuc2FjdGlvbiBvciBhIHNhdmVwb2ludCwgZGVwZW5kaW5nIG9uIHdoZXRoZXIgYSB0cmFuc2FjdGlvbiB3YXMgcGFzc2VkIGluXHJcbiAgICByZXR1cm4gdGhpcy5zZXF1ZWxpemUudHJhbnNhY3Rpb24ob3B0aW9ucykudGhlbih0ID0+IHtcclxuICAgICAgdHJhbnNhY3Rpb24gPSB0O1xyXG4gICAgICBvcHRpb25zLnRyYW5zYWN0aW9uID0gdDtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmZpbmRPbmUoVXRpbHMuZGVmYXVsdHMoeyB0cmFuc2FjdGlvbiB9LCBvcHRpb25zKSk7XHJcbiAgICB9KS50aGVuKGluc3RhbmNlID0+IHtcclxuICAgICAgaWYgKGluc3RhbmNlICE9PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIFtpbnN0YW5jZSwgZmFsc2VdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YWx1ZXMgPSBfLmNsb25lKG9wdGlvbnMuZGVmYXVsdHMpIHx8IHt9O1xyXG4gICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMud2hlcmUpKSB7XHJcbiAgICAgICAgdmFsdWVzID0gVXRpbHMuZGVmYXVsdHModmFsdWVzLCBvcHRpb25zLndoZXJlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgb3B0aW9ucy5leGNlcHRpb24gPSB0cnVlO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKHZhbHVlcywgb3B0aW9ucykudGhlbihpbnN0YW5jZSA9PiB7XHJcbiAgICAgICAgaWYgKGluc3RhbmNlLmdldCh0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pID09PSBudWxsKSB7XHJcbiAgICAgICAgICAvLyBJZiB0aGUgcXVlcnkgcmV0dXJuZWQgYW4gZW1wdHkgcmVzdWx0IGZvciB0aGUgcHJpbWFyeSBrZXksIHdlIGtub3cgdGhhdCB0aGlzIHdhcyBhY3R1YWxseSBhIHVuaXF1ZSBjb25zdHJhaW50IHZpb2xhdGlvblxyXG4gICAgICAgICAgdGhyb3cgbmV3IHNlcXVlbGl6ZUVycm9ycy5VbmlxdWVDb25zdHJhaW50RXJyb3IoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBbaW5zdGFuY2UsIHRydWVdO1xyXG4gICAgICB9KS5jYXRjaChzZXF1ZWxpemVFcnJvcnMuVW5pcXVlQ29uc3RyYWludEVycm9yLCBlcnIgPT4ge1xyXG4gICAgICAgIGNvbnN0IGZsYXR0ZW5lZFdoZXJlID0gVXRpbHMuZmxhdHRlbk9iamVjdERlZXAob3B0aW9ucy53aGVyZSk7XHJcbiAgICAgICAgY29uc3QgZmxhdHRlbmVkV2hlcmVLZXlzID0gT2JqZWN0LmtleXMoZmxhdHRlbmVkV2hlcmUpLm1hcChuYW1lID0+IF8ubGFzdChuYW1lLnNwbGl0KCcuJykpKTtcclxuICAgICAgICBjb25zdCB3aGVyZUZpZWxkcyA9IGZsYXR0ZW5lZFdoZXJlS2V5cy5tYXAobmFtZSA9PiBfLmdldCh0aGlzLnJhd0F0dHJpYnV0ZXMsIGAke25hbWV9LmZpZWxkYCwgbmFtZSkpO1xyXG4gICAgICAgIGNvbnN0IGRlZmF1bHRGaWVsZHMgPSBvcHRpb25zLmRlZmF1bHRzICYmIE9iamVjdC5rZXlzKG9wdGlvbnMuZGVmYXVsdHMpXHJcbiAgICAgICAgICAuZmlsdGVyKG5hbWUgPT4gdGhpcy5yYXdBdHRyaWJ1dGVzW25hbWVdKVxyXG4gICAgICAgICAgLm1hcChuYW1lID0+IHRoaXMucmF3QXR0cmlidXRlc1tuYW1lXS5maWVsZCB8fCBuYW1lKTtcclxuXHJcbiAgICAgICAgY29uc3QgZXJyRmllbGRLZXlzID0gT2JqZWN0LmtleXMoZXJyLmZpZWxkcyk7XHJcbiAgICAgICAgY29uc3QgZXJyRmllbGRzV2hlcmVJbnRlcnNlY3RzID0gVXRpbHMuaW50ZXJzZWN0cyhlcnJGaWVsZEtleXMsIHdoZXJlRmllbGRzKTtcclxuICAgICAgICBpZiAoZGVmYXVsdEZpZWxkcyAmJiAhZXJyRmllbGRzV2hlcmVJbnRlcnNlY3RzICYmIFV0aWxzLmludGVyc2VjdHMoZXJyRmllbGRLZXlzLCBkZWZhdWx0RmllbGRzKSkge1xyXG4gICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGVyckZpZWxkc1doZXJlSW50ZXJzZWN0cykge1xyXG4gICAgICAgICAgXy5lYWNoKGVyci5maWVsZHMsICh2YWx1ZSwga2V5KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmZpZWxkUmF3QXR0cmlidXRlc01hcFtrZXldLmZpZWxkTmFtZTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlLnRvU3RyaW5nKCkgIT09IG9wdGlvbnMud2hlcmVbbmFtZV0udG9TdHJpbmcoKSkge1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLm5hbWV9I2ZpbmRPckNyZWF0ZTogdmFsdWUgdXNlZCBmb3IgJHtuYW1lfSB3YXMgbm90IGVxdWFsIGZvciBib3RoIHRoZSBmaW5kIGFuZCB0aGUgY3JlYXRlIGNhbGxzLCAnJHtvcHRpb25zLndoZXJlW25hbWVdfScgdnMgJyR7dmFsdWV9J2ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFNvbWVvbmUgbXVzdCBoYXZlIGNyZWF0ZWQgYSBtYXRjaGluZyBpbnN0YW5jZSBpbnNpZGUgdGhlIHNhbWUgdHJhbnNhY3Rpb24gc2luY2Ugd2UgbGFzdCBkaWQgYSBmaW5kLiBMZXQncyBmaW5kIGl0IVxyXG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRPbmUoVXRpbHMuZGVmYXVsdHMoe1xyXG4gICAgICAgICAgdHJhbnNhY3Rpb246IGludGVybmFsVHJhbnNhY3Rpb24gPyBudWxsIDogdHJhbnNhY3Rpb25cclxuICAgICAgICB9LCBvcHRpb25zKSkudGhlbihpbnN0YW5jZSA9PiB7XHJcbiAgICAgICAgICAvLyBTYW5pdHkgY2hlY2ssIGlkZWFsbHkgd2UgY2F1Z2h0IHRoaXMgYXQgdGhlIGRlZmF1bHRGZWlsZHMvZXJyLmZpZWxkcyBjaGVja1xyXG4gICAgICAgICAgLy8gQnV0IGlmIHdlIGRpZG4ndCBhbmQgaW5zdGFuY2UgaXMgbnVsbCwgd2Ugd2lsbCB0aHJvd1xyXG4gICAgICAgICAgaWYgKGluc3RhbmNlID09PSBudWxsKSB0aHJvdyBlcnI7XHJcbiAgICAgICAgICByZXR1cm4gW2luc3RhbmNlLCBmYWxzZV07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSkuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgIGlmIChpbnRlcm5hbFRyYW5zYWN0aW9uICYmIHRyYW5zYWN0aW9uKSB7XHJcbiAgICAgICAgLy8gSWYgd2UgY3JlYXRlZCBhIHRyYW5zYWN0aW9uIGludGVybmFsbHkgKGFuZCBub3QganVzdCBhIHNhdmVwb2ludCksIHdlIHNob3VsZCBjbGVhbiBpdCB1cFxyXG4gICAgICAgIHJldHVybiB0cmFuc2FjdGlvbi5jb21taXQoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBIG1vcmUgcGVyZm9ybWFudCBmaW5kT3JDcmVhdGUgdGhhdCB3aWxsIG5vdCB3b3JrIHVuZGVyIGEgdHJhbnNhY3Rpb24gKGF0IGxlYXN0IG5vdCBpbiBwb3N0Z3JlcylcclxuICAgKiBXaWxsIGV4ZWN1dGUgYSBmaW5kIGNhbGwsIGlmIGVtcHR5IHRoZW4gYXR0ZW1wdCB0byBjcmVhdGUsIGlmIHVuaXF1ZSBjb25zdHJhaW50IHRoZW4gYXR0ZW1wdCB0byBmaW5kIGFnYWluXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9IGZvciBhIGZ1bGwgc3BlY2lmaWNhdGlvbiBvZiBmaW5kIGFuZCBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBmaW5kIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy53aGVyZSBBIGhhc2ggb2Ygc2VhcmNoIGF0dHJpYnV0ZXMuIElmIGB3aGVyZWAgaXMgYSBwbGFpbiBvYmplY3QgaXQgd2lsbCBiZSBhcHBlbmRlZCB3aXRoIGRlZmF1bHRzIHRvIGJ1aWxkIGEgbmV3IGluc3RhbmNlLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5kZWZhdWx0c10gRGVmYXVsdCB2YWx1ZXMgdG8gdXNlIGlmIGNyZWF0aW5nIGEgbmV3IGluc3RhbmNlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbCxib29sZWFuPn1cclxuICAgKi9cclxuICBzdGF0aWMgZmluZENyZWF0ZUZpbmQob3B0aW9ucykge1xyXG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLndoZXJlKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnTWlzc2luZyB3aGVyZSBhdHRyaWJ1dGUgaW4gdGhlIG9wdGlvbnMgcGFyYW1ldGVyIHBhc3NlZCB0byBmaW5kQ3JlYXRlRmluZC4nXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHZhbHVlcyA9IF8uY2xvbmUob3B0aW9ucy5kZWZhdWx0cykgfHwge307XHJcbiAgICBpZiAoXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMud2hlcmUpKSB7XHJcbiAgICAgIHZhbHVlcyA9IFV0aWxzLmRlZmF1bHRzKHZhbHVlcywgb3B0aW9ucy53aGVyZSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHJldHVybiB0aGlzLmZpbmRPbmUob3B0aW9ucykudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICBpZiAocmVzdWx0KSByZXR1cm4gW3Jlc3VsdCwgZmFsc2VdO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlKHZhbHVlcywgb3B0aW9ucylcclxuICAgICAgICAudGhlbihyZXN1bHQgPT4gW3Jlc3VsdCwgdHJ1ZV0pXHJcbiAgICAgICAgLmNhdGNoKHNlcXVlbGl6ZUVycm9ycy5VbmlxdWVDb25zdHJhaW50RXJyb3IsICgpID0+IHRoaXMuZmluZE9uZShvcHRpb25zKS50aGVuKHJlc3VsdCA9PiBbcmVzdWx0LCBmYWxzZV0pKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5zZXJ0IG9yIHVwZGF0ZSBhIHNpbmdsZSByb3cuIEFuIHVwZGF0ZSB3aWxsIGJlIGV4ZWN1dGVkIGlmIGEgcm93IHdoaWNoIG1hdGNoZXMgdGhlIHN1cHBsaWVkIHZhbHVlcyBvbiBlaXRoZXIgdGhlIHByaW1hcnkga2V5IG9yIGEgdW5pcXVlIGtleSBpcyBmb3VuZC4gTm90ZSB0aGF0IHRoZSB1bmlxdWUgaW5kZXggbXVzdCBiZSBkZWZpbmVkIGluIHlvdXIgc2VxdWVsaXplIG1vZGVsIGFuZCBub3QganVzdCBpbiB0aGUgdGFibGUuIE90aGVyd2lzZSB5b3UgbWF5IGV4cGVyaWVuY2UgYSB1bmlxdWUgY29uc3RyYWludCB2aW9sYXRpb24sIGJlY2F1c2Ugc2VxdWVsaXplIGZhaWxzIHRvIGlkZW50aWZ5IHRoZSByb3cgdGhhdCBzaG91bGQgYmUgdXBkYXRlZC5cclxuICAgKlxyXG4gICAqICoqSW1wbGVtZW50YXRpb24gZGV0YWlsczoqKlxyXG4gICAqXHJcbiAgICogKiBNeVNRTCAtIEltcGxlbWVudGVkIGFzIGEgc2luZ2xlIHF1ZXJ5IGBJTlNFUlQgdmFsdWVzIE9OIERVUExJQ0FURSBLRVkgVVBEQVRFIHZhbHVlc2BcclxuICAgKiAqIFBvc3RncmVTUUwgLSBJbXBsZW1lbnRlZCBhcyBhIHRlbXBvcmFyeSBmdW5jdGlvbiB3aXRoIGV4Y2VwdGlvbiBoYW5kbGluZzogSU5TRVJUIEVYQ0VQVElPTiBXSEVOIHVuaXF1ZV9jb25zdHJhaW50IFVQREFURVxyXG4gICAqICogU1FMaXRlIC0gSW1wbGVtZW50ZWQgYXMgdHdvIHF1ZXJpZXMgYElOU0VSVDsgVVBEQVRFYC4gVGhpcyBtZWFucyB0aGF0IHRoZSB1cGRhdGUgaXMgZXhlY3V0ZWQgcmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZSByb3cgYWxyZWFkeSBleGlzdGVkIG9yIG5vdFxyXG4gICAqICogTVNTUUwgLSBJbXBsZW1lbnRlZCBhcyBhIHNpbmdsZSBxdWVyeSB1c2luZyBgTUVSR0VgIGFuZCBgV0hFTiAoTk9UKSBNQVRDSEVEIFRIRU5gXHJcbiAgICogKipOb3RlKiogdGhhdCBTUUxpdGUgcmV0dXJucyB1bmRlZmluZWQgZm9yIGNyZWF0ZWQsIG5vIG1hdHRlciBpZiB0aGUgcm93IHdhcyBjcmVhdGVkIG9yIHVwZGF0ZWQuIFRoaXMgaXMgYmVjYXVzZSBTUUxpdGUgYWx3YXlzIHJ1bnMgSU5TRVJUIE9SIElHTk9SRSArIFVQREFURSwgaW4gYSBzaW5nbGUgcXVlcnksIHNvIHRoZXJlIGlzIG5vIHdheSB0byBrbm93IHdoZXRoZXIgdGhlIHJvdyB3YXMgaW5zZXJ0ZWQgb3Igbm90LlxyXG4gICAqXHJcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICB2YWx1ZXMgaGFzaCBvZiB2YWx1ZXMgdG8gdXBzZXJ0XHJcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICBbb3B0aW9uc10gdXBzZXJ0IG9wdGlvbnNcclxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLnZhbGlkYXRlPXRydWVdIFJ1biB2YWxpZGF0aW9ucyBiZWZvcmUgdGhlIHJvdyBpcyBpbnNlcnRlZFxyXG4gICAqIEBwYXJhbSAge0FycmF5fSAgICAgICAgW29wdGlvbnMuZmllbGRzPU9iamVjdC5rZXlzKHRoaXMuYXR0cmlidXRlcyldIFRoZSBmaWVsZHMgdG8gaW5zZXJ0IC8gdXBkYXRlLiBEZWZhdWx0cyB0byBhbGwgY2hhbmdlZCBmaWVsZHNcclxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLmhvb2tzPXRydWVdICBSdW4gYmVmb3JlIC8gYWZ0ZXIgdXBzZXJ0IGhvb2tzP1xyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMucmV0dXJuaW5nPWZhbHNlXSBBcHBlbmQgUkVUVVJOSU5HICogdG8gZ2V0IGJhY2sgYXV0byBnZW5lcmF0ZWQgdmFsdWVzIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqIEBwYXJhbSAge1RyYW5zYWN0aW9ufSAgW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxyXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59IFJldHVybnMgYSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGUgcm93IHdhcyBjcmVhdGVkIG9yIHVwZGF0ZWQuIEZvciBNeVNRTC9NYXJpYURCLCBpdCByZXR1cm5zIGB0cnVlYCB3aGVuIGluc2VydGVkIGFuZCBgZmFsc2VgIHdoZW4gdXBkYXRlZC4gRm9yIFBvc3RncmVzL01TU1FMIHdpdGggKG9wdGlvbnMucmV0dXJuaW5nPXRydWUpLCBpdCByZXR1cm5zIHJlY29yZCBhbmQgY3JlYXRlZCBib29sZWFuIHdpdGggc2lnbmF0dXJlIGA8TW9kZWwsIGNyZWF0ZWQ+YC5cclxuICAgKi9cclxuICBzdGF0aWMgdXBzZXJ0KHZhbHVlcywgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICBob29rczogdHJ1ZSxcclxuICAgICAgcmV0dXJuaW5nOiBmYWxzZSxcclxuICAgICAgdmFsaWRhdGU6IHRydWVcclxuICAgIH0sIFV0aWxzLmNsb25lRGVlcChvcHRpb25zIHx8IHt9KSk7XHJcblxyXG4gICAgb3B0aW9ucy5tb2RlbCA9IHRoaXM7XHJcblxyXG4gICAgY29uc3QgY3JlYXRlZEF0QXR0ciA9IHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0O1xyXG4gICAgY29uc3QgdXBkYXRlZEF0QXR0ciA9IHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0O1xyXG4gICAgY29uc3QgaGFzUHJpbWFyeSA9IHRoaXMucHJpbWFyeUtleUZpZWxkIGluIHZhbHVlcyB8fCB0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGUgaW4gdmFsdWVzO1xyXG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzLmJ1aWxkKHZhbHVlcyk7XHJcblxyXG4gICAgaWYgKCFvcHRpb25zLmZpZWxkcykge1xyXG4gICAgICBvcHRpb25zLmZpZWxkcyA9IE9iamVjdC5rZXlzKGluc3RhbmNlLl9jaGFuZ2VkKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xyXG4gICAgICBpZiAob3B0aW9ucy52YWxpZGF0ZSkge1xyXG4gICAgICAgIHJldHVybiBpbnN0YW5jZS52YWxpZGF0ZShvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgIC8vIE1hcCBmaWVsZCBuYW1lc1xyXG4gICAgICBjb25zdCB1cGRhdGVkRGF0YVZhbHVlcyA9IF8ucGljayhpbnN0YW5jZS5kYXRhVmFsdWVzLCBPYmplY3Qua2V5cyhpbnN0YW5jZS5fY2hhbmdlZCkpO1xyXG4gICAgICBjb25zdCBpbnNlcnRWYWx1ZXMgPSBVdGlscy5tYXBWYWx1ZUZpZWxkTmFtZXMoaW5zdGFuY2UuZGF0YVZhbHVlcywgT2JqZWN0LmtleXMoaW5zdGFuY2UucmF3QXR0cmlidXRlcyksIHRoaXMpO1xyXG4gICAgICBjb25zdCB1cGRhdGVWYWx1ZXMgPSBVdGlscy5tYXBWYWx1ZUZpZWxkTmFtZXModXBkYXRlZERhdGFWYWx1ZXMsIG9wdGlvbnMuZmllbGRzLCB0aGlzKTtcclxuICAgICAgY29uc3Qgbm93ID0gVXRpbHMubm93KHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCk7XHJcblxyXG4gICAgICAvLyBBdHRhY2ggY3JlYXRlZEF0XHJcbiAgICAgIGlmIChjcmVhdGVkQXRBdHRyICYmICF1cGRhdGVWYWx1ZXNbY3JlYXRlZEF0QXR0cl0pIHtcclxuICAgICAgICBjb25zdCBmaWVsZCA9IHRoaXMucmF3QXR0cmlidXRlc1tjcmVhdGVkQXRBdHRyXS5maWVsZCB8fCBjcmVhdGVkQXRBdHRyO1xyXG4gICAgICAgIGluc2VydFZhbHVlc1tmaWVsZF0gPSB0aGlzLl9nZXREZWZhdWx0VGltZXN0YW1wKGNyZWF0ZWRBdEF0dHIpIHx8IG5vdztcclxuICAgICAgfVxyXG4gICAgICBpZiAodXBkYXRlZEF0QXR0ciAmJiAhaW5zZXJ0VmFsdWVzW3VwZGF0ZWRBdEF0dHJdKSB7XHJcbiAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLnJhd0F0dHJpYnV0ZXNbdXBkYXRlZEF0QXR0cl0uZmllbGQgfHwgdXBkYXRlZEF0QXR0cjtcclxuICAgICAgICBpbnNlcnRWYWx1ZXNbZmllbGRdID0gdXBkYXRlVmFsdWVzW2ZpZWxkXSA9IHRoaXMuX2dldERlZmF1bHRUaW1lc3RhbXAodXBkYXRlZEF0QXR0cikgfHwgbm93O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBCdWlsZCBhZGRzIGEgbnVsbCB2YWx1ZSBmb3IgdGhlIHByaW1hcnkga2V5LCBpZiBub25lIHdhcyBnaXZlbiBieSB0aGUgdXNlci5cclxuICAgICAgLy8gV2UgbmVlZCB0byByZW1vdmUgdGhhdCBiZWNhdXNlIG9mIHNvbWUgUG9zdGdyZXMgdGVjaG5pY2FsaXRpZXMuXHJcbiAgICAgIGlmICghaGFzUHJpbWFyeSAmJiB0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGUgJiYgIXRoaXMucmF3QXR0cmlidXRlc1t0aGlzLnByaW1hcnlLZXlBdHRyaWJ1dGVdLmRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgIGRlbGV0ZSBpbnNlcnRWYWx1ZXNbdGhpcy5wcmltYXJ5S2V5RmllbGRdO1xyXG4gICAgICAgIGRlbGV0ZSB1cGRhdGVWYWx1ZXNbdGhpcy5wcmltYXJ5S2V5RmllbGRdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xyXG4gICAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYmVmb3JlVXBzZXJ0JywgdmFsdWVzLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UudXBzZXJ0KHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBpbnNlcnRWYWx1ZXMsIHVwZGF0ZVZhbHVlcywgaW5zdGFuY2Uud2hlcmUoKSwgdGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoW2NyZWF0ZWQsIHByaW1hcnlLZXldKSA9PiB7XHJcbiAgICAgICAgICBpZiAob3B0aW9ucy5yZXR1cm5pbmcgPT09IHRydWUgJiYgcHJpbWFyeUtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maW5kQnlQayhwcmltYXJ5S2V5LCBvcHRpb25zKS50aGVuKHJlY29yZCA9PiBbcmVjb3JkLCBjcmVhdGVkXSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZWQ7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGFwKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICBpZiAob3B0aW9ucy5ob29rcykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ydW5Ib29rcygnYWZ0ZXJVcHNlcnQnLCByZXN1bHQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYW5kIGluc2VydCBtdWx0aXBsZSBpbnN0YW5jZXMgaW4gYnVsay5cclxuICAgKlxyXG4gICAqIFRoZSBzdWNjZXNzIGhhbmRsZXIgaXMgcGFzc2VkIGFuIGFycmF5IG9mIGluc3RhbmNlcywgYnV0IHBsZWFzZSBub3RpY2UgdGhhdCB0aGVzZSBtYXkgbm90IGNvbXBsZXRlbHkgcmVwcmVzZW50IHRoZSBzdGF0ZSBvZiB0aGUgcm93cyBpbiB0aGUgREIuIFRoaXMgaXMgYmVjYXVzZSBNeVNRTFxyXG4gICAqIGFuZCBTUUxpdGUgZG8gbm90IG1ha2UgaXQgZWFzeSB0byBvYnRhaW4gYmFjayBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBJRHMgYW5kIG90aGVyIGRlZmF1bHQgdmFsdWVzIGluIGEgd2F5IHRoYXQgY2FuIGJlIG1hcHBlZCB0byBtdWx0aXBsZSByZWNvcmRzLlxyXG4gICAqIFRvIG9idGFpbiBJbnN0YW5jZXMgZm9yIHRoZSBuZXdseSBjcmVhdGVkIHZhbHVlcywgeW91IHdpbGwgbmVlZCB0byBxdWVyeSBmb3IgdGhlbSBhZ2Fpbi5cclxuICAgKlxyXG4gICAqIElmIHZhbGlkYXRpb24gZmFpbHMsIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIHdpdGggYW4gYXJyYXktbGlrZSBbQWdncmVnYXRlRXJyb3JdKGh0dHA6Ly9ibHVlYmlyZGpzLmNvbS9kb2NzL2FwaS9hZ2dyZWdhdGVlcnJvci5odG1sKVxyXG4gICAqXHJcbiAgICogQHBhcmFtICB7QXJyYXl9ICAgICAgICByZWNvcmRzICAgICAgICAgICAgICAgICAgICAgICAgICBMaXN0IG9mIG9iamVjdHMgKGtleS92YWx1ZSBwYWlycykgdG8gY3JlYXRlIGluc3RhbmNlcyBmcm9tXHJcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICBbb3B0aW9uc10gICAgICAgICAgICAgICAgICAgICAgICBCdWxrIGNyZWF0ZSBvcHRpb25zXHJcbiAgICogQHBhcmFtICB7QXJyYXl9ICAgICAgICBbb3B0aW9ucy5maWVsZHNdICAgICAgICAgICAgICAgICBGaWVsZHMgdG8gaW5zZXJ0IChkZWZhdWx0cyB0byBhbGwgZmllbGRzKVxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMudmFsaWRhdGU9ZmFsc2VdICAgICAgICAgU2hvdWxkIGVhY2ggcm93IGJlIHN1YmplY3QgdG8gdmFsaWRhdGlvbiBiZWZvcmUgaXQgaXMgaW5zZXJ0ZWQuIFRoZSB3aG9sZSBpbnNlcnQgd2lsbCBmYWlsIGlmIG9uZSByb3cgZmFpbHMgdmFsaWRhdGlvblxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaG9va3M9dHJ1ZV0gICAgICAgICAgICAgUnVuIGJlZm9yZSAvIGFmdGVyIGJ1bGsgY3JlYXRlIGhvb2tzP1xyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaW5kaXZpZHVhbEhvb2tzPWZhbHNlXSAgUnVuIGJlZm9yZSAvIGFmdGVyIGNyZWF0ZSBob29rcyBmb3IgZWFjaCBpbmRpdmlkdWFsIEluc3RhbmNlPyBCdWxrQ3JlYXRlIGhvb2tzIHdpbGwgc3RpbGwgYmUgcnVuIGlmIG9wdGlvbnMuaG9va3MgaXMgdHJ1ZS5cclxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLmlnbm9yZUR1cGxpY2F0ZXM9ZmFsc2VdIElnbm9yZSBkdXBsaWNhdGUgdmFsdWVzIGZvciBwcmltYXJ5IGtleXM/IChub3Qgc3VwcG9ydGVkIGJ5IE1TU1FMIG9yIFBvc3RncmVzIDwgOS41KVxyXG4gICAqIEBwYXJhbSAge0FycmF5fSAgICAgICAgW29wdGlvbnMudXBkYXRlT25EdXBsaWNhdGVdICAgICAgRmllbGRzIHRvIHVwZGF0ZSBpZiByb3cga2V5IGFscmVhZHkgZXhpc3RzIChvbiBkdXBsaWNhdGUga2V5IHVwZGF0ZSk/IChvbmx5IHN1cHBvcnRlZCBieSBNeVNRTCwgTWFyaWFEQiwgU1FMaXRlID49IDMuMjQuMCAmIFBvc3RncmVzID49IDkuNSkuIEJ5IGRlZmF1bHQsIGFsbCBmaWVsZHMgYXJlIHVwZGF0ZWQuXHJcbiAgICogQHBhcmFtICB7VHJhbnNhY3Rpb259ICBbb3B0aW9ucy50cmFuc2FjdGlvbl0gICAgICAgICAgICBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcclxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdICAgICAgICAgIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuYmVuY2htYXJrPWZhbHNlXSAgICAgICAgUGFzcyBxdWVyeSBleGVjdXRpb24gdGltZSBpbiBtaWxsaXNlY29uZHMgYXMgc2Vjb25kIGFyZ3VtZW50IHRvIGxvZ2dpbmcgZnVuY3Rpb24gKG9wdGlvbnMubG9nZ2luZykuXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbnxBcnJheX0gW29wdGlvbnMucmV0dXJuaW5nPWZhbHNlXSAgICAgICBJZiB0cnVlLCBhcHBlbmQgUkVUVVJOSU5HICogdG8gZ2V0IGJhY2sgYWxsIHZhbHVlczsgaWYgYW4gYXJyYXkgb2YgY29sdW1uIG5hbWVzLCBhcHBlbmQgUkVUVVJOSU5HIDxjb2x1bW5zPiB0byBnZXQgYmFjayBzcGVjaWZpYyBjb2x1bW5zIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSAgICAgQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5PE1vZGVsPj59XHJcbiAgICovXHJcbiAgc3RhdGljIGJ1bGtDcmVhdGUocmVjb3Jkcywgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICBpZiAoIXJlY29yZHMubGVuZ3RoKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRpYWxlY3QgPSB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3Q7XHJcbiAgICBjb25zdCBub3cgPSBVdGlscy5ub3codGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KTtcclxuXHJcbiAgICBvcHRpb25zLm1vZGVsID0gdGhpcztcclxuXHJcbiAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZVZhbGlkYXRlZCkge1xyXG4gICAgICB0aGlzLl9jb25mb3JtSW5jbHVkZXMob3B0aW9ucywgdGhpcyk7XHJcbiAgICAgIGlmIChvcHRpb25zLmluY2x1ZGUpIHtcclxuICAgICAgICB0aGlzLl9leHBhbmRJbmNsdWRlQWxsKG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlSW5jbHVkZWRFbGVtZW50cyhvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGluc3RhbmNlcyA9IHJlY29yZHMubWFwKHZhbHVlcyA9PiB0aGlzLmJ1aWxkKHZhbHVlcywgeyBpc05ld1JlY29yZDogdHJ1ZSwgaW5jbHVkZTogb3B0aW9ucy5pbmNsdWRlIH0pKTtcclxuXHJcbiAgICBjb25zdCByZWN1cnNpdmVCdWxrQ3JlYXRlID0gKGluc3RhbmNlcywgb3B0aW9ucykgPT4ge1xyXG4gICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgICAgdmFsaWRhdGU6IGZhbHNlLFxyXG4gICAgICAgIGhvb2tzOiB0cnVlLFxyXG4gICAgICAgIGluZGl2aWR1YWxIb29rczogZmFsc2UsXHJcbiAgICAgICAgaWdub3JlRHVwbGljYXRlczogZmFsc2VcclxuICAgICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5yZXR1cm5pbmcgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmIChvcHRpb25zLmFzc29jaWF0aW9uKSB7XHJcbiAgICAgICAgICBvcHRpb25zLnJldHVybmluZyA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBvcHRpb25zLnJldHVybmluZyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5pZ25vcmVEdXBsaWNhdGVzICYmIFsnbXNzcWwnXS5pbmNsdWRlcyhkaWFsZWN0KSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYCR7ZGlhbGVjdH0gZG9lcyBub3Qgc3VwcG9ydCB0aGUgaWdub3JlRHVwbGljYXRlcyBvcHRpb24uYCkpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChvcHRpb25zLnVwZGF0ZU9uRHVwbGljYXRlICYmIChkaWFsZWN0ICE9PSAnbXlzcWwnICYmIGRpYWxlY3QgIT09ICdtYXJpYWRiJyAmJiBkaWFsZWN0ICE9PSAnc3FsaXRlJyAmJiBkaWFsZWN0ICE9PSAncG9zdGdyZXMnKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYCR7ZGlhbGVjdH0gZG9lcyBub3Qgc3VwcG9ydCB0aGUgdXBkYXRlT25EdXBsaWNhdGUgb3B0aW9uLmApKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbW9kZWwgPSBvcHRpb25zLm1vZGVsO1xyXG5cclxuICAgICAgb3B0aW9ucy5maWVsZHMgPSBvcHRpb25zLmZpZWxkcyB8fCBPYmplY3Qua2V5cyhtb2RlbC5yYXdBdHRyaWJ1dGVzKTtcclxuICAgICAgY29uc3QgY3JlYXRlZEF0QXR0ciA9IG1vZGVsLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmNyZWF0ZWRBdDtcclxuICAgICAgY29uc3QgdXBkYXRlZEF0QXR0ciA9IG1vZGVsLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdDtcclxuXHJcbiAgICAgIGlmIChvcHRpb25zLnVwZGF0ZU9uRHVwbGljYXRlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLnVwZGF0ZU9uRHVwbGljYXRlKSAmJiBvcHRpb25zLnVwZGF0ZU9uRHVwbGljYXRlLmxlbmd0aCkge1xyXG4gICAgICAgICAgb3B0aW9ucy51cGRhdGVPbkR1cGxpY2F0ZSA9IF8uaW50ZXJzZWN0aW9uKFxyXG4gICAgICAgICAgICBfLndpdGhvdXQoT2JqZWN0LmtleXMobW9kZWwudGFibGVBdHRyaWJ1dGVzKSwgY3JlYXRlZEF0QXR0ciksXHJcbiAgICAgICAgICAgIG9wdGlvbnMudXBkYXRlT25EdXBsaWNhdGVcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ3VwZGF0ZU9uRHVwbGljYXRlIG9wdGlvbiBvbmx5IHN1cHBvcnRzIG5vbi1lbXB0eSBhcnJheS4nKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xyXG4gICAgICAgIC8vIFJ1biBiZWZvcmUgaG9va1xyXG4gICAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XHJcbiAgICAgICAgICByZXR1cm4gbW9kZWwucnVuSG9va3MoJ2JlZm9yZUJ1bGtDcmVhdGUnLCBpbnN0YW5jZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgLy8gVmFsaWRhdGVcclxuICAgICAgICBpZiAob3B0aW9ucy52YWxpZGF0ZSkge1xyXG4gICAgICAgICAgY29uc3QgZXJyb3JzID0gbmV3IFByb21pc2UuQWdncmVnYXRlRXJyb3IoKTtcclxuICAgICAgICAgIGNvbnN0IHZhbGlkYXRlT3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucyk7XHJcbiAgICAgICAgICB2YWxpZGF0ZU9wdGlvbnMuaG9va3MgPSBvcHRpb25zLmluZGl2aWR1YWxIb29rcztcclxuXHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5tYXAoaW5zdGFuY2VzLCBpbnN0YW5jZSA9PlxyXG4gICAgICAgICAgICBpbnN0YW5jZS52YWxpZGF0ZSh2YWxpZGF0ZU9wdGlvbnMpLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgICAgZXJyb3JzLnB1c2gobmV3IHNlcXVlbGl6ZUVycm9ycy5CdWxrUmVjb3JkRXJyb3IoZXJyLCBpbnN0YW5jZSkpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgZGVsZXRlIG9wdGlvbnMuc2tpcDtcclxuICAgICAgICAgICAgaWYgKGVycm9ycy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBlcnJvcnM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuaW5kaXZpZHVhbEhvb2tzKSB7XHJcbiAgICAgICAgICAvLyBDcmVhdGUgZWFjaCBpbnN0YW5jZSBpbmRpdmlkdWFsbHlcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLm1hcChpbnN0YW5jZXMsIGluc3RhbmNlID0+IHtcclxuICAgICAgICAgICAgY29uc3QgaW5kaXZpZHVhbE9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBkZWxldGUgaW5kaXZpZHVhbE9wdGlvbnMuZmllbGRzO1xyXG4gICAgICAgICAgICBkZWxldGUgaW5kaXZpZHVhbE9wdGlvbnMuaW5kaXZpZHVhbEhvb2tzO1xyXG4gICAgICAgICAgICBkZWxldGUgaW5kaXZpZHVhbE9wdGlvbnMuaWdub3JlRHVwbGljYXRlcztcclxuICAgICAgICAgICAgaW5kaXZpZHVhbE9wdGlvbnMudmFsaWRhdGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgaW5kaXZpZHVhbE9wdGlvbnMuaG9va3MgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlLnNhdmUoaW5kaXZpZHVhbE9wdGlvbnMpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZSB8fCAhb3B0aW9ucy5pbmNsdWRlLmxlbmd0aCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgIC8vIE5lc3RlZCBjcmVhdGlvbiBmb3IgQmVsb25nc1RvIHJlbGF0aW9uc1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UubWFwKG9wdGlvbnMuaW5jbHVkZS5maWx0ZXIoaW5jbHVkZSA9PiBpbmNsdWRlLmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvKSwgaW5jbHVkZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFzc29jaWF0aW9uSW5zdGFuY2VzID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IGFzc29jaWF0aW9uSW5zdGFuY2VJbmRleFRvSW5zdGFuY2VNYXAgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgaW5zdGFuY2Ugb2YgaW5zdGFuY2VzKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgYXNzb2NpYXRpb25JbnN0YW5jZSA9IGluc3RhbmNlLmdldChpbmNsdWRlLmFzKTtcclxuICAgICAgICAgICAgICBpZiAoYXNzb2NpYXRpb25JbnN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgYXNzb2NpYXRpb25JbnN0YW5jZXMucHVzaChhc3NvY2lhdGlvbkluc3RhbmNlKTtcclxuICAgICAgICAgICAgICAgIGFzc29jaWF0aW9uSW5zdGFuY2VJbmRleFRvSW5zdGFuY2VNYXAucHVzaChpbnN0YW5jZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWFzc29jaWF0aW9uSW5zdGFuY2VzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgaW5jbHVkZU9wdGlvbnMgPSBfKFV0aWxzLmNsb25lRGVlcChpbmNsdWRlKSlcclxuICAgICAgICAgICAgICAub21pdChbJ2Fzc29jaWF0aW9uJ10pXHJcbiAgICAgICAgICAgICAgLmRlZmF1bHRzKHtcclxuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uOiBvcHRpb25zLnRyYW5zYWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgbG9nZ2luZzogb3B0aW9ucy5sb2dnaW5nXHJcbiAgICAgICAgICAgICAgfSkudmFsdWUoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZWN1cnNpdmVCdWxrQ3JlYXRlKGFzc29jaWF0aW9uSW5zdGFuY2VzLCBpbmNsdWRlT3B0aW9ucykudGhlbihhc3NvY2lhdGlvbkluc3RhbmNlcyA9PiB7XHJcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBpZHggaW4gYXNzb2NpYXRpb25JbnN0YW5jZXMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFzc29jaWF0aW9uSW5zdGFuY2UgPSBhc3NvY2lhdGlvbkluc3RhbmNlc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBhc3NvY2lhdGlvbkluc3RhbmNlSW5kZXhUb0luc3RhbmNlTWFwW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VbaW5jbHVkZS5hc3NvY2lhdGlvbi5hY2Nlc3NvcnMuc2V0XShhc3NvY2lhdGlvbkluc3RhbmNlLCB7IHNhdmU6IGZhbHNlLCBsb2dnaW5nOiBvcHRpb25zLmxvZ2dpbmcgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgLy8gQ3JlYXRlIGFsbCBpbiBvbmUgcXVlcnlcclxuICAgICAgICAgIC8vIFJlY3JlYXRlIHJlY29yZHMgZnJvbSBpbnN0YW5jZXMgdG8gcmVwcmVzZW50IGFueSBjaGFuZ2VzIG1hZGUgaW4gaG9va3Mgb3IgdmFsaWRhdGlvblxyXG4gICAgICAgICAgcmVjb3JkcyA9IGluc3RhbmNlcy5tYXAoaW5zdGFuY2UgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBpbnN0YW5jZS5kYXRhVmFsdWVzO1xyXG5cclxuICAgICAgICAgICAgLy8gc2V0IGNyZWF0ZWRBdC91cGRhdGVkQXQgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICBpZiAoY3JlYXRlZEF0QXR0ciAmJiAhdmFsdWVzW2NyZWF0ZWRBdEF0dHJdKSB7XHJcbiAgICAgICAgICAgICAgdmFsdWVzW2NyZWF0ZWRBdEF0dHJdID0gbm93O1xyXG4gICAgICAgICAgICAgIGlmICghb3B0aW9ucy5maWVsZHMuaW5jbHVkZXMoY3JlYXRlZEF0QXR0cikpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2goY3JlYXRlZEF0QXR0cik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh1cGRhdGVkQXRBdHRyICYmICF2YWx1ZXNbdXBkYXRlZEF0QXR0cl0pIHtcclxuICAgICAgICAgICAgICB2YWx1ZXNbdXBkYXRlZEF0QXR0cl0gPSBub3c7XHJcbiAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmZpZWxkcy5pbmNsdWRlcyh1cGRhdGVkQXRBdHRyKSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5maWVsZHMucHVzaCh1cGRhdGVkQXRBdHRyKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG91dCA9IE9iamVjdC5hc3NpZ24oe30sIFV0aWxzLm1hcFZhbHVlRmllbGROYW1lcyh2YWx1ZXMsIG9wdGlvbnMuZmllbGRzLCBtb2RlbCkpO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBtb2RlbC5fdmlydHVhbEF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgICBkZWxldGUgb3V0W2tleV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG91dDtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIC8vIE1hcCBhdHRyaWJ1dGVzIHRvIGZpZWxkcyBmb3Igc2VyaWFsIGlkZW50aWZpY2F0aW9uXHJcbiAgICAgICAgICBjb25zdCBmaWVsZE1hcHBlZEF0dHJpYnV0ZXMgPSB7fTtcclxuICAgICAgICAgIGZvciAoY29uc3QgYXR0ciBpbiBtb2RlbC50YWJsZUF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgZmllbGRNYXBwZWRBdHRyaWJ1dGVzW21vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGQgfHwgYXR0cl0gPSBtb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIE1hcCB1cGRhdGVPbkR1cGxpY2F0ZSBhdHRyaWJ1dGVzIHRvIGZpZWxkc1xyXG4gICAgICAgICAgaWYgKG9wdGlvbnMudXBkYXRlT25EdXBsaWNhdGUpIHtcclxuICAgICAgICAgICAgb3B0aW9ucy51cGRhdGVPbkR1cGxpY2F0ZSA9IG9wdGlvbnMudXBkYXRlT25EdXBsaWNhdGUubWFwKGF0dHIgPT4gbW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCB8fCBhdHRyKTtcclxuICAgICAgICAgICAgLy8gR2V0IHByaW1hcnkga2V5cyBmb3IgcG9zdGdyZXMgdG8gZW5hYmxlIHVwZGF0ZU9uRHVwbGljYXRlXHJcbiAgICAgICAgICAgIG9wdGlvbnMudXBzZXJ0S2V5cyA9IF8uY2hhaW4obW9kZWwucHJpbWFyeUtleXMpLnZhbHVlcygpLm1hcCgnZmllbGQnKS52YWx1ZSgpO1xyXG4gICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMobW9kZWwudW5pcXVlS2V5cykubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgIG9wdGlvbnMudXBzZXJ0S2V5cyA9IF8uY2hhaW4obW9kZWwudW5pcXVlS2V5cykudmFsdWVzKCkuZmlsdGVyKGMgPT4gYy5maWVsZHMubGVuZ3RoID09PSAxKS5tYXAoJ2NvbHVtbicpLnZhbHVlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBNYXAgcmV0dXJuaW5nIGF0dHJpYnV0ZXMgdG8gZmllbGRzXHJcbiAgICAgICAgICBpZiAob3B0aW9ucy5yZXR1cm5pbmcgJiYgQXJyYXkuaXNBcnJheShvcHRpb25zLnJldHVybmluZykpIHtcclxuICAgICAgICAgICAgb3B0aW9ucy5yZXR1cm5pbmcgPSBvcHRpb25zLnJldHVybmluZy5tYXAoYXR0ciA9PiBtb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkIHx8IGF0dHIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiBtb2RlbC5RdWVyeUludGVyZmFjZS5idWxrSW5zZXJ0KG1vZGVsLmdldFRhYmxlTmFtZShvcHRpb25zKSwgcmVjb3Jkcywgb3B0aW9ucywgZmllbGRNYXBwZWRBdHRyaWJ1dGVzKS50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHRzKSkge1xyXG4gICAgICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0LCBpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGluc3RhbmNlc1tpXTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiByZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKCFpbnN0YW5jZSB8fCBrZXkgPT09IG1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGUgJiZcclxuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZS5nZXQobW9kZWwucHJpbWFyeUtleUF0dHJpYnV0ZSkgJiZcclxuICAgICAgICAgICAgICAgICAgICBbJ215c3FsJywgJ21hcmlhZGInLCAnc3FsaXRlJ10uaW5jbHVkZXMoZGlhbGVjdCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgcXVlcnkuanMgZm9yIHRoZXNlIERCcyBpcyBibGluZCwgaXQgYXV0b2luY3JlbWVudHMgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJpbWFyeWtleSB2YWx1ZSwgZXZlbiBpZiBpdCB3YXMgc2V0IG1hbnVhbGx5LiBBbHNvLCBpdCBjYW5cclxuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gbW9yZSByZXN1bHRzIHRoYW4gaW5zdGFuY2VzLCBidWc/LlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzdWx0LCBrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVjb3JkID0gcmVzdWx0W2tleV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBfLmZpbmQobW9kZWwucmF3QXR0cmlidXRlcywgYXR0cmlidXRlID0+IGF0dHJpYnV0ZS5maWVsZE5hbWUgPT09IGtleSB8fCBhdHRyaWJ1dGUuZmllbGQgPT09IGtleSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlLmRhdGFWYWx1ZXNbYXR0ciAmJiBhdHRyLmZpZWxkTmFtZSB8fCBrZXldID0gcmVjb3JkO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zLmluY2x1ZGUgfHwgIW9wdGlvbnMuaW5jbHVkZS5sZW5ndGgpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gTmVzdGVkIGNyZWF0aW9uIGZvciBIYXNPbmUvSGFzTWFueS9CZWxvbmdzVG9NYW55IHJlbGF0aW9uc1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLm1hcChvcHRpb25zLmluY2x1ZGUuZmlsdGVyKGluY2x1ZGUgPT4gIShpbmNsdWRlLmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvIHx8XHJcbiAgICAgICAgICBpbmNsdWRlLnBhcmVudCAmJiBpbmNsdWRlLnBhcmVudC5hc3NvY2lhdGlvbiBpbnN0YW5jZW9mIEJlbG9uZ3NUb01hbnkpKSwgaW5jbHVkZSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBhc3NvY2lhdGlvbkluc3RhbmNlcyA9IFtdO1xyXG4gICAgICAgICAgY29uc3QgYXNzb2NpYXRpb25JbnN0YW5jZUluZGV4VG9JbnN0YW5jZU1hcCA9IFtdO1xyXG5cclxuICAgICAgICAgIGZvciAoY29uc3QgaW5zdGFuY2Ugb2YgaW5zdGFuY2VzKSB7XHJcbiAgICAgICAgICAgIGxldCBhc3NvY2lhdGVkID0gaW5zdGFuY2UuZ2V0KGluY2x1ZGUuYXMpO1xyXG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXNzb2NpYXRlZCkpIGFzc29jaWF0ZWQgPSBbYXNzb2NpYXRlZF07XHJcblxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGFzc29jaWF0aW9uSW5zdGFuY2Ugb2YgYXNzb2NpYXRlZCkge1xyXG4gICAgICAgICAgICAgIGlmIChhc3NvY2lhdGlvbkluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpbmNsdWRlLmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvTWFueSkpIHtcclxuICAgICAgICAgICAgICAgICAgYXNzb2NpYXRpb25JbnN0YW5jZS5zZXQoaW5jbHVkZS5hc3NvY2lhdGlvbi5mb3JlaWduS2V5LCBpbnN0YW5jZS5nZXQoaW5jbHVkZS5hc3NvY2lhdGlvbi5zb3VyY2VLZXkgfHwgaW5zdGFuY2UuY29uc3RydWN0b3IucHJpbWFyeUtleUF0dHJpYnV0ZSwgeyByYXc6IHRydWUgfSksIHsgcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGFzc29jaWF0aW9uSW5zdGFuY2UsIGluY2x1ZGUuYXNzb2NpYXRpb24uc2NvcGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYXNzb2NpYXRpb25JbnN0YW5jZXMucHVzaChhc3NvY2lhdGlvbkluc3RhbmNlKTtcclxuICAgICAgICAgICAgICAgIGFzc29jaWF0aW9uSW5zdGFuY2VJbmRleFRvSW5zdGFuY2VNYXAucHVzaChpbnN0YW5jZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCFhc3NvY2lhdGlvbkluc3RhbmNlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnN0IGluY2x1ZGVPcHRpb25zID0gXyhVdGlscy5jbG9uZURlZXAoaW5jbHVkZSkpXHJcbiAgICAgICAgICAgIC5vbWl0KFsnYXNzb2NpYXRpb24nXSlcclxuICAgICAgICAgICAgLmRlZmF1bHRzKHtcclxuICAgICAgICAgICAgICB0cmFuc2FjdGlvbjogb3B0aW9ucy50cmFuc2FjdGlvbixcclxuICAgICAgICAgICAgICBsb2dnaW5nOiBvcHRpb25zLmxvZ2dpbmdcclxuICAgICAgICAgICAgfSkudmFsdWUoKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gcmVjdXJzaXZlQnVsa0NyZWF0ZShhc3NvY2lhdGlvbkluc3RhbmNlcywgaW5jbHVkZU9wdGlvbnMpLnRoZW4oYXNzb2NpYXRpb25JbnN0YW5jZXMgPT4ge1xyXG4gICAgICAgICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbiBpbnN0YW5jZW9mIEJlbG9uZ3NUb01hbnkpIHtcclxuICAgICAgICAgICAgICBjb25zdCB2YWx1ZVNldHMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBpZHggaW4gYXNzb2NpYXRpb25JbnN0YW5jZXMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFzc29jaWF0aW9uSW5zdGFuY2UgPSBhc3NvY2lhdGlvbkluc3RhbmNlc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBhc3NvY2lhdGlvbkluc3RhbmNlSW5kZXhUb0luc3RhbmNlTWFwW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVzID0ge307XHJcbiAgICAgICAgICAgICAgICB2YWx1ZXNbaW5jbHVkZS5hc3NvY2lhdGlvbi5mb3JlaWduS2V5XSA9IGluc3RhbmNlLmdldChpbnN0YW5jZS5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5QXR0cmlidXRlLCB7IHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIHZhbHVlc1tpbmNsdWRlLmFzc29jaWF0aW9uLm90aGVyS2V5XSA9IGFzc29jaWF0aW9uSW5zdGFuY2UuZ2V0KGFzc29jaWF0aW9uSW5zdGFuY2UuY29uc3RydWN0b3IucHJpbWFyeUtleUF0dHJpYnV0ZSwgeyByYXc6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSW5jbHVkZSB2YWx1ZXMgZGVmaW5lZCBpbiB0aGUgYXNzb2NpYXRpb25cclxuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24odmFsdWVzLCBpbmNsdWRlLmFzc29jaWF0aW9uLnRocm91Z2guc2NvcGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFzc29jaWF0aW9uSW5zdGFuY2VbaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLm5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYXR0ciBvZiBPYmplY3Qua2V5cyhpbmNsdWRlLmFzc29jaWF0aW9uLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlcykpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uX2F1dG9HZW5lcmF0ZWQgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIGF0dHIgPT09IGluY2x1ZGUuYXNzb2NpYXRpb24uZm9yZWlnbktleSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgYXR0ciA9PT0gaW5jbHVkZS5hc3NvY2lhdGlvbi5vdGhlcktleSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGFzc29jaWF0aW9uSW5zdGFuY2VbaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLm5hbWVdW2F0dHJdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbYXR0cl0gPSBhc3NvY2lhdGlvbkluc3RhbmNlW2luY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5uYW1lXVthdHRyXTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhbHVlU2V0cy5wdXNoKHZhbHVlcyk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb25zdCB0aHJvdWdoT3B0aW9ucyA9IF8oVXRpbHMuY2xvbmVEZWVwKGluY2x1ZGUpKVxyXG4gICAgICAgICAgICAgICAgLm9taXQoWydhc3NvY2lhdGlvbicsICdhdHRyaWJ1dGVzJ10pXHJcbiAgICAgICAgICAgICAgICAuZGVmYXVsdHMoe1xyXG4gICAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbjogb3B0aW9ucy50cmFuc2FjdGlvbixcclxuICAgICAgICAgICAgICAgICAgbG9nZ2luZzogb3B0aW9ucy5sb2dnaW5nXHJcbiAgICAgICAgICAgICAgICB9KS52YWx1ZSgpO1xyXG4gICAgICAgICAgICAgIHRocm91Z2hPcHRpb25zLm1vZGVsID0gaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoTW9kZWw7XHJcbiAgICAgICAgICAgICAgY29uc3QgdGhyb3VnaEluc3RhbmNlcyA9IGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaE1vZGVsLmJ1bGtCdWlsZCh2YWx1ZVNldHMsIHRocm91Z2hPcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlY3Vyc2l2ZUJ1bGtDcmVhdGUodGhyb3VnaEluc3RhbmNlcywgdGhyb3VnaE9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgLy8gbWFwIGZpZWxkcyBiYWNrIHRvIGF0dHJpYnV0ZXNcclxuICAgICAgICBpbnN0YW5jZXMuZm9yRWFjaChpbnN0YW5jZSA9PiB7XHJcbiAgICAgICAgICBmb3IgKGNvbnN0IGF0dHIgaW4gbW9kZWwucmF3QXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICBpZiAobW9kZWwucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCAmJlxyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2UuZGF0YVZhbHVlc1ttb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkXSAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICAgICAgICAgICAgICBtb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkICE9PSBhdHRyXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgIGluc3RhbmNlLmRhdGFWYWx1ZXNbYXR0cl0gPSBpbnN0YW5jZS5kYXRhVmFsdWVzW21vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGRdO1xyXG4gICAgICAgICAgICAgIGRlbGV0ZSBpbnN0YW5jZS5kYXRhVmFsdWVzW21vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGRdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGluc3RhbmNlLl9wcmV2aW91c0RhdGFWYWx1ZXNbYXR0cl0gPSBpbnN0YW5jZS5kYXRhVmFsdWVzW2F0dHJdO1xyXG4gICAgICAgICAgICBpbnN0YW5jZS5jaGFuZ2VkKGF0dHIsIGZhbHNlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGluc3RhbmNlLmlzTmV3UmVjb3JkID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFJ1biBhZnRlciBob29rXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcclxuICAgICAgICAgIHJldHVybiBtb2RlbC5ydW5Ib29rcygnYWZ0ZXJCdWxrQ3JlYXRlJywgaW5zdGFuY2VzLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pLnRoZW4oKCkgPT4gaW5zdGFuY2VzKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHJlY3Vyc2l2ZUJ1bGtDcmVhdGUoaW5zdGFuY2VzLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRydW5jYXRlIGFsbCBpbnN0YW5jZXMgb2YgdGhlIG1vZGVsLiBUaGlzIGlzIGEgY29udmVuaWVudCBtZXRob2QgZm9yIE1vZGVsLmRlc3Ryb3koeyB0cnVuY2F0ZTogdHJ1ZSB9KS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgW29wdGlvbnNdIFRoZSBvcHRpb25zIHBhc3NlZCB0byBNb2RlbC5kZXN0cm95IGluIGFkZGl0aW9uIHRvIHRydW5jYXRlXHJcbiAgICogQHBhcmFtIHtib29sZWFufEZ1bmN0aW9ufSBbb3B0aW9ucy5jYXNjYWRlID0gZmFsc2VdIFRydW5jYXRlcyBhbGwgdGFibGVzIHRoYXQgaGF2ZSBmb3JlaWduLWtleSByZWZlcmVuY2VzIHRvIHRoZSBuYW1lZCB0YWJsZSwgb3IgdG8gYW55IHRhYmxlcyBhZGRlZCB0byB0aGUgZ3JvdXAgZHVlIHRvIENBU0NBREUuXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICBbb3B0aW9ucy5yZXN0YXJ0SWRlbnRpdHk9ZmFsc2VdIEF1dG9tYXRpY2FsbHkgcmVzdGFydCBzZXF1ZW5jZXMgb3duZWQgYnkgY29sdW1ucyBvZiB0aGUgdHJ1bmNhdGVkIHRhYmxlLlxyXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259ICAgICAgW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbnxGdW5jdGlvbn0gW29wdGlvbnMubG9nZ2luZ10gQSBmdW5jdGlvbiB0aGF0IGxvZ3Mgc3FsIHF1ZXJpZXMsIG9yIGZhbHNlIGZvciBubyBsb2dnaW5nXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLmRlc3Ryb3l9IGZvciBtb3JlIGluZm9ybWF0aW9uXHJcbiAgICovXHJcbiAgc3RhdGljIHRydW5jYXRlKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucykgfHwge307XHJcbiAgICBvcHRpb25zLnRydW5jYXRlID0gdHJ1ZTtcclxuICAgIHJldHVybiB0aGlzLmRlc3Ryb3kob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWxldGUgbXVsdGlwbGUgaW5zdGFuY2VzLCBvciBzZXQgdGhlaXIgZGVsZXRlZEF0IHRpbWVzdGFtcCB0byB0aGUgY3VycmVudCB0aW1lIGlmIGBwYXJhbm9pZGAgaXMgZW5hYmxlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgb3B0aW9ucyAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0cm95IG9wdGlvbnNcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgIFtvcHRpb25zLndoZXJlXSAgICAgICAgICAgICAgICAgRmlsdGVyIHRoZSBkZXN0cm95XHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5ob29rcz10cnVlXSAgICAgICAgICAgIFJ1biBiZWZvcmUgLyBhZnRlciBidWxrIGRlc3Ryb3kgaG9va3M/XHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5pbmRpdmlkdWFsSG9va3M9ZmFsc2VdIElmIHNldCB0byB0cnVlLCBkZXN0cm95IHdpbGwgU0VMRUNUIGFsbCByZWNvcmRzIG1hdGNoaW5nIHRoZSB3aGVyZSBwYXJhbWV0ZXIgYW5kIHdpbGwgZXhlY3V0ZSBiZWZvcmUgLyBhZnRlciBkZXN0cm95IGhvb2tzIG9uIGVhY2ggcm93XHJcbiAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICBbb3B0aW9ucy5saW1pdF0gICAgICAgICAgICAgICAgIEhvdyBtYW55IHJvd3MgdG8gZGVsZXRlXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5mb3JjZT1mYWxzZV0gICAgICAgICAgIERlbGV0ZSBpbnN0ZWFkIG9mIHNldHRpbmcgZGVsZXRlZEF0IHRvIGN1cnJlbnQgdGltZXN0YW1wIChvbmx5IGFwcGxpY2FibGUgaWYgYHBhcmFub2lkYCBpcyBlbmFibGVkKVxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMudHJ1bmNhdGU9ZmFsc2VdICAgICAgICBJZiBzZXQgdG8gdHJ1ZSwgZGlhbGVjdHMgdGhhdCBzdXBwb3J0IGl0IHdpbGwgdXNlIFRSVU5DQVRFIGluc3RlYWQgb2YgREVMRVRFIEZST00uIElmIGEgdGFibGUgaXMgdHJ1bmNhdGVkIHRoZSB3aGVyZSBhbmQgbGltaXQgb3B0aW9ucyBhcmUgaWdub3JlZFxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuY2FzY2FkZT1mYWxzZV0gICAgICAgICBPbmx5IHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCBUUlVOQ0FURS4gVHJ1bmNhdGVzICBhbGwgdGFibGVzIHRoYXQgaGF2ZSBmb3JlaWduLWtleSByZWZlcmVuY2VzIHRvIHRoZSBuYW1lZCB0YWJsZSwgb3IgdG8gYW55IHRhYmxlcyBhZGRlZCB0byB0aGUgZ3JvdXAgZHVlIHRvIENBU0NBREUuXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5yZXN0YXJ0SWRlbnRpdHk9ZmFsc2VdIE9ubHkgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIFRSVU5DQVRFLiBBdXRvbWF0aWNhbGx5IHJlc3RhcnQgc2VxdWVuY2VzIG93bmVkIGJ5IGNvbHVtbnMgb2YgdGhlIHRydW5jYXRlZCB0YWJsZS5cclxuICAgKiBAcGFyYW0gIHtUcmFuc2FjdGlvbn0gIFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcclxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdICAgICAgICAgQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdICAgICAgIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8bnVtYmVyPn0gVGhlIG51bWJlciBvZiBkZXN0cm95ZWQgcm93c1xyXG4gICAqL1xyXG4gIHN0YXRpYyBkZXN0cm95KG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5qZWN0U2NvcGUob3B0aW9ucyk7XHJcblxyXG4gICAgaWYgKCFvcHRpb25zIHx8ICEob3B0aW9ucy53aGVyZSB8fCBvcHRpb25zLnRydW5jYXRlKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3Npbmcgd2hlcmUgb3IgdHJ1bmNhdGUgYXR0cmlidXRlIGluIHRoZSBvcHRpb25zIHBhcmFtZXRlciBvZiBtb2RlbC5kZXN0cm95LicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghb3B0aW9ucy50cnVuY2F0ZSAmJiAhXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMud2hlcmUpICYmICFBcnJheS5pc0FycmF5KG9wdGlvbnMud2hlcmUpICYmICEob3B0aW9ucy53aGVyZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBwbGFpbiBvYmplY3QsIGFycmF5IG9yIHNlcXVlbGl6ZSBtZXRob2QgaW4gdGhlIG9wdGlvbnMud2hlcmUgcGFyYW1ldGVyIG9mIG1vZGVsLmRlc3Ryb3kuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IF8uZGVmYXVsdHMob3B0aW9ucywge1xyXG4gICAgICBob29rczogdHJ1ZSxcclxuICAgICAgaW5kaXZpZHVhbEhvb2tzOiBmYWxzZSxcclxuICAgICAgZm9yY2U6IGZhbHNlLFxyXG4gICAgICBjYXNjYWRlOiBmYWxzZSxcclxuICAgICAgcmVzdGFydElkZW50aXR5OiBmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5CVUxLREVMRVRFO1xyXG5cclxuICAgIFV0aWxzLm1hcE9wdGlvbkZpZWxkTmFtZXMob3B0aW9ucywgdGhpcyk7XHJcbiAgICBvcHRpb25zLm1vZGVsID0gdGhpcztcclxuXHJcbiAgICBsZXQgaW5zdGFuY2VzO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XHJcbiAgICAgIC8vIFJ1biBiZWZvcmUgaG9va1xyXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdiZWZvcmVCdWxrRGVzdHJveScsIG9wdGlvbnMpO1xyXG4gICAgICB9XHJcbiAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgLy8gR2V0IGRhb3MgYW5kIHJ1biBiZWZvcmVEZXN0cm95IGhvb2sgb24gZWFjaCByZWNvcmQgaW5kaXZpZHVhbGx5XHJcbiAgICAgIGlmIChvcHRpb25zLmluZGl2aWR1YWxIb29rcykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRBbGwoeyB3aGVyZTogb3B0aW9ucy53aGVyZSwgdHJhbnNhY3Rpb246IG9wdGlvbnMudHJhbnNhY3Rpb24sIGxvZ2dpbmc6IG9wdGlvbnMubG9nZ2luZywgYmVuY2htYXJrOiBvcHRpb25zLmJlbmNobWFyayB9KVxyXG4gICAgICAgICAgLm1hcChpbnN0YW5jZSA9PiB0aGlzLnJ1bkhvb2tzKCdiZWZvcmVEZXN0cm95JywgaW5zdGFuY2UsIG9wdGlvbnMpLnRoZW4oKCkgPT4gaW5zdGFuY2UpKVxyXG4gICAgICAgICAgLnRoZW4oX2luc3RhbmNlcyA9PiB7XHJcbiAgICAgICAgICAgIGluc3RhbmNlcyA9IF9pbnN0YW5jZXM7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgIC8vIFJ1biBkZWxldGUgcXVlcnkgKG9yIHVwZGF0ZSBpZiBwYXJhbm9pZClcclxuICAgICAgaWYgKHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0ICYmICFvcHRpb25zLmZvcmNlKSB7XHJcbiAgICAgICAgLy8gU2V0IHF1ZXJ5IHR5cGUgYXBwcm9wcmlhdGVseSB3aGVuIHJ1bm5pbmcgc29mdCBkZWxldGVcclxuICAgICAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLkJVTEtVUERBVEU7XHJcblxyXG4gICAgICAgIGNvbnN0IGF0dHJWYWx1ZUhhc2ggPSB7fTtcclxuICAgICAgICBjb25zdCBkZWxldGVkQXRBdHRyaWJ1dGUgPSB0aGlzLnJhd0F0dHJpYnV0ZXNbdGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXRdO1xyXG4gICAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5yYXdBdHRyaWJ1dGVzW3RoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0XS5maWVsZDtcclxuICAgICAgICBjb25zdCB3aGVyZSA9IHtcclxuICAgICAgICAgIFtmaWVsZF06IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkZWxldGVkQXRBdHRyaWJ1dGUsICdkZWZhdWx0VmFsdWUnKSA/IGRlbGV0ZWRBdEF0dHJpYnV0ZS5kZWZhdWx0VmFsdWUgOiBudWxsXHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIGF0dHJWYWx1ZUhhc2hbZmllbGRdID0gVXRpbHMubm93KHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuZGlhbGVjdCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UuYnVsa1VwZGF0ZSh0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSwgYXR0clZhbHVlSGFzaCwgT2JqZWN0LmFzc2lnbih3aGVyZSwgb3B0aW9ucy53aGVyZSksIG9wdGlvbnMsIHRoaXMucmF3QXR0cmlidXRlcyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMuUXVlcnlJbnRlcmZhY2UuYnVsa0RlbGV0ZSh0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSwgb3B0aW9ucy53aGVyZSwgb3B0aW9ucywgdGhpcyk7XHJcbiAgICB9KS50YXAoKCkgPT4ge1xyXG4gICAgICAvLyBSdW4gYWZ0ZXJEZXN0cm95IGhvb2sgb24gZWFjaCByZWNvcmQgaW5kaXZpZHVhbGx5XHJcbiAgICAgIGlmIChvcHRpb25zLmluZGl2aWR1YWxIb29rcykge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLm1hcChpbnN0YW5jZXMsIGluc3RhbmNlID0+IHRoaXMucnVuSG9va3MoJ2FmdGVyRGVzdHJveScsIGluc3RhbmNlLCBvcHRpb25zKSk7XHJcbiAgICAgIH1cclxuICAgIH0pLnRhcCgoKSA9PiB7XHJcbiAgICAgIC8vIFJ1biBhZnRlciBob29rXHJcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoJ2FmdGVyQnVsa0Rlc3Ryb3knLCBvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXN0b3JlIG11bHRpcGxlIGluc3RhbmNlcyBpZiBgcGFyYW5vaWRgIGlzIGVuYWJsZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgIG9wdGlvbnMgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZSBvcHRpb25zXHJcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICBbb3B0aW9ucy53aGVyZV0gICAgICAgICAgICAgICAgIEZpbHRlciB0aGUgcmVzdG9yZVxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaG9va3M9dHJ1ZV0gICAgICAgICAgICBSdW4gYmVmb3JlIC8gYWZ0ZXIgYnVsayByZXN0b3JlIGhvb2tzP1xyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaW5kaXZpZHVhbEhvb2tzPWZhbHNlXSBJZiBzZXQgdG8gdHJ1ZSwgcmVzdG9yZSB3aWxsIGZpbmQgYWxsIHJlY29yZHMgd2l0aGluIHRoZSB3aGVyZSBwYXJhbWV0ZXIgYW5kIHdpbGwgZXhlY3V0ZSBiZWZvcmUgLyBhZnRlciBidWxrUmVzdG9yZSBob29rcyBvbiBlYWNoIHJvd1xyXG4gICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgW29wdGlvbnMubGltaXRdICAgICAgICAgICAgICAgICBIb3cgbWFueSByb3dzIHRvIHVuZGVsZXRlIChvbmx5IGZvciBteXNxbClcclxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdICAgICAgICAgQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdICAgICAgIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxyXG4gICAqIEBwYXJhbSAge1RyYW5zYWN0aW9ufSAgW29wdGlvbnMudHJhbnNhY3Rpb25dICAgICAgICAgICBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIHN0YXRpYyByZXN0b3JlKG9wdGlvbnMpIHtcclxuICAgIGlmICghdGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQpIHRocm93IG5ldyBFcnJvcignTW9kZWwgaXMgbm90IHBhcmFub2lkJyk7XHJcblxyXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICBob29rczogdHJ1ZSxcclxuICAgICAgaW5kaXZpZHVhbEhvb2tzOiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyB8fCB7fSk7XHJcblxyXG4gICAgb3B0aW9ucy50eXBlID0gUXVlcnlUeXBlcy5SQVc7XHJcbiAgICBvcHRpb25zLm1vZGVsID0gdGhpcztcclxuXHJcbiAgICBsZXQgaW5zdGFuY2VzO1xyXG5cclxuICAgIFV0aWxzLm1hcE9wdGlvbkZpZWxkTmFtZXMob3B0aW9ucywgdGhpcyk7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcclxuICAgICAgLy8gUnVuIGJlZm9yZSBob29rXHJcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoJ2JlZm9yZUJ1bGtSZXN0b3JlJywgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICAvLyBHZXQgZGFvcyBhbmQgcnVuIGJlZm9yZVJlc3RvcmUgaG9vayBvbiBlYWNoIHJlY29yZCBpbmRpdmlkdWFsbHlcclxuICAgICAgaWYgKG9wdGlvbnMuaW5kaXZpZHVhbEhvb2tzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZEFsbCh7IHdoZXJlOiBvcHRpb25zLndoZXJlLCB0cmFuc2FjdGlvbjogb3B0aW9ucy50cmFuc2FjdGlvbiwgbG9nZ2luZzogb3B0aW9ucy5sb2dnaW5nLCBiZW5jaG1hcms6IG9wdGlvbnMuYmVuY2htYXJrLCBwYXJhbm9pZDogZmFsc2UgfSlcclxuICAgICAgICAgIC5tYXAoaW5zdGFuY2UgPT4gdGhpcy5ydW5Ib29rcygnYmVmb3JlUmVzdG9yZScsIGluc3RhbmNlLCBvcHRpb25zKS50aGVuKCgpID0+IGluc3RhbmNlKSlcclxuICAgICAgICAgIC50aGVuKF9pbnN0YW5jZXMgPT4ge1xyXG4gICAgICAgICAgICBpbnN0YW5jZXMgPSBfaW5zdGFuY2VzO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICAvLyBSdW4gdW5kZWxldGUgcXVlcnlcclxuICAgICAgY29uc3QgYXR0clZhbHVlSGFzaCA9IHt9O1xyXG4gICAgICBjb25zdCBkZWxldGVkQXRDb2wgPSB0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLmRlbGV0ZWRBdDtcclxuICAgICAgY29uc3QgZGVsZXRlZEF0QXR0cmlidXRlID0gdGhpcy5yYXdBdHRyaWJ1dGVzW2RlbGV0ZWRBdENvbF07XHJcbiAgICAgIGNvbnN0IGRlbGV0ZWRBdERlZmF1bHRWYWx1ZSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkZWxldGVkQXRBdHRyaWJ1dGUsICdkZWZhdWx0VmFsdWUnKSA/IGRlbGV0ZWRBdEF0dHJpYnV0ZS5kZWZhdWx0VmFsdWUgOiBudWxsO1xyXG5cclxuICAgICAgYXR0clZhbHVlSGFzaFtkZWxldGVkQXRBdHRyaWJ1dGUuZmllbGQgfHwgZGVsZXRlZEF0Q29sXSA9IGRlbGV0ZWRBdERlZmF1bHRWYWx1ZTtcclxuICAgICAgb3B0aW9ucy5vbWl0TnVsbCA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gdGhpcy5RdWVyeUludGVyZmFjZS5idWxrVXBkYXRlKHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCBhdHRyVmFsdWVIYXNoLCBvcHRpb25zLndoZXJlLCBvcHRpb25zLCB0aGlzLnJhd0F0dHJpYnV0ZXMpO1xyXG4gICAgfSkudGFwKCgpID0+IHtcclxuICAgICAgLy8gUnVuIGFmdGVyRGVzdHJveSBob29rIG9uIGVhY2ggcmVjb3JkIGluZGl2aWR1YWxseVxyXG4gICAgICBpZiAob3B0aW9ucy5pbmRpdmlkdWFsSG9va3MpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5tYXAoaW5zdGFuY2VzLCBpbnN0YW5jZSA9PiB0aGlzLnJ1bkhvb2tzKCdhZnRlclJlc3RvcmUnLCBpbnN0YW5jZSwgb3B0aW9ucykpO1xyXG4gICAgICB9XHJcbiAgICB9KS50YXAoKCkgPT4ge1xyXG4gICAgICAvLyBSdW4gYWZ0ZXIgaG9va1xyXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdhZnRlckJ1bGtSZXN0b3JlJywgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlIG11bHRpcGxlIGluc3RhbmNlcyB0aGF0IG1hdGNoIHRoZSB3aGVyZSBvcHRpb25zLlxyXG4gICAqXHJcbiAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICB2YWx1ZXMgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc2ggb2YgdmFsdWVzIHRvIHVwZGF0ZVxyXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgb3B0aW9ucyAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGUgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgb3B0aW9ucy53aGVyZSAgICAgICAgICAgICAgICAgICBPcHRpb25zIHRvIGRlc2NyaWJlIHRoZSBzY29wZSBvZiB0aGUgc2VhcmNoLlxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMucGFyYW5vaWQ9dHJ1ZV0gICAgICAgICBJZiB0cnVlLCBvbmx5IG5vbi1kZWxldGVkIHJlY29yZHMgd2lsbCBiZSB1cGRhdGVkLiBJZiBmYWxzZSwgYm90aCBkZWxldGVkIGFuZCBub24tZGVsZXRlZCByZWNvcmRzIHdpbGwgYmUgdXBkYXRlZC4gT25seSBhcHBsaWVzIGlmIGBvcHRpb25zLnBhcmFub2lkYCBpcyB0cnVlIGZvciB0aGUgbW9kZWwuXHJcbiAgICogQHBhcmFtICB7QXJyYXl9ICAgICAgICBbb3B0aW9ucy5maWVsZHNdICAgICAgICAgICAgICAgIEZpZWxkcyB0byB1cGRhdGUgKGRlZmF1bHRzIHRvIGFsbCBmaWVsZHMpXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy52YWxpZGF0ZT10cnVlXSAgICAgICAgIFNob3VsZCBlYWNoIHJvdyBiZSBzdWJqZWN0IHRvIHZhbGlkYXRpb24gYmVmb3JlIGl0IGlzIGluc2VydGVkLiBUaGUgd2hvbGUgaW5zZXJ0IHdpbGwgZmFpbCBpZiBvbmUgcm93IGZhaWxzIHZhbGlkYXRpb25cclxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLmhvb2tzPXRydWVdICAgICAgICAgICAgUnVuIGJlZm9yZSAvIGFmdGVyIGJ1bGsgdXBkYXRlIGhvb2tzP1xyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuc2lkZUVmZmVjdHM9dHJ1ZV0gICAgICBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHNpZGUgZWZmZWN0cyBvZiBhbnkgdmlydHVhbCBzZXR0ZXJzLlxyXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59ICAgICAgW29wdGlvbnMuaW5kaXZpZHVhbEhvb2tzPWZhbHNlXSBSdW4gYmVmb3JlIC8gYWZ0ZXIgdXBkYXRlIGhvb2tzPy4gSWYgdHJ1ZSwgdGhpcyB3aWxsIGV4ZWN1dGUgYSBTRUxFQ1QgZm9sbG93ZWQgYnkgaW5kaXZpZHVhbCBVUERBVEVzLiBBIHNlbGVjdCBpcyBuZWVkZWQsIGJlY2F1c2UgdGhlIHJvdyBkYXRhIG5lZWRzIHRvIGJlIHBhc3NlZCB0byB0aGUgaG9va3NcclxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLnJldHVybmluZz1mYWxzZV0gICAgICAgUmV0dXJuIHRoZSBhZmZlY3RlZCByb3dzIChvbmx5IGZvciBwb3N0Z3JlcylcclxuICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgIFtvcHRpb25zLmxpbWl0XSAgICAgICAgICAgICAgICAgSG93IG1hbnkgcm93cyB0byB1cGRhdGUgKG9ubHkgZm9yIG15c3FsIGFuZCBtYXJpYWRiLCBpbXBsZW1lbnRlZCBhcyBUT1AobikgZm9yIE1TU1FMOyBmb3Igc3FsaXRlIGl0IGlzIHN1cHBvcnRlZCBvbmx5IHdoZW4gcm93aWQgaXMgcHJlc2VudClcclxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgIFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdICAgICAgICAgQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gICAgICBbb3B0aW9ucy5iZW5jaG1hcms9ZmFsc2VdICAgICAgIFBhc3MgcXVlcnkgZXhlY3V0aW9uIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGFzIHNlY29uZCBhcmd1bWVudCB0byBsb2dnaW5nIGZ1bmN0aW9uIChvcHRpb25zLmxvZ2dpbmcpLlxyXG4gICAqIEBwYXJhbSAge1RyYW5zYWN0aW9ufSAgW29wdGlvbnMudHJhbnNhY3Rpb25dICAgICAgICAgICBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcclxuICAgKiBAcGFyYW0gIHtib29sZWFufSAgICAgIFtvcHRpb25zLnNpbGVudD1mYWxzZV0gICAgICAgICAgSWYgdHJ1ZSwgdGhlIHVwZGF0ZWRBdCB0aW1lc3RhbXAgd2lsbCBub3QgYmUgdXBkYXRlZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5PG51bWJlcixudW1iZXI+Pn0gIFRoZSBwcm9taXNlIHJldHVybnMgYW4gYXJyYXkgd2l0aCBvbmUgb3IgdHdvIGVsZW1lbnRzLiBUaGUgZmlyc3QgZWxlbWVudCBpcyBhbHdheXMgdGhlIG51bWJlclxyXG4gICAqIG9mIGFmZmVjdGVkIHJvd3MsIHdoaWxlIHRoZSBzZWNvbmQgZWxlbWVudCBpcyB0aGUgYWN0dWFsIGFmZmVjdGVkIHJvd3MgKG9ubHkgc3VwcG9ydGVkIGluIHBvc3RncmVzIHdpdGggYG9wdGlvbnMucmV0dXJuaW5nYCB0cnVlLilcclxuICAgKlxyXG4gICAqL1xyXG4gIHN0YXRpYyB1cGRhdGUodmFsdWVzLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuX2luamVjdFNjb3BlKG9wdGlvbnMpO1xyXG4gICAgdGhpcy5fb3B0aW9uc011c3RDb250YWluV2hlcmUob3B0aW9ucyk7XHJcblxyXG4gICAgb3B0aW9ucyA9IHRoaXMuX3BhcmFub2lkQ2xhdXNlKHRoaXMsIF8uZGVmYXVsdHMob3B0aW9ucywge1xyXG4gICAgICB2YWxpZGF0ZTogdHJ1ZSxcclxuICAgICAgaG9va3M6IHRydWUsXHJcbiAgICAgIGluZGl2aWR1YWxIb29rczogZmFsc2UsXHJcbiAgICAgIHJldHVybmluZzogZmFsc2UsXHJcbiAgICAgIGZvcmNlOiBmYWxzZSxcclxuICAgICAgc2lkZUVmZmVjdHM6IHRydWVcclxuICAgIH0pKTtcclxuXHJcbiAgICBvcHRpb25zLnR5cGUgPSBRdWVyeVR5cGVzLkJVTEtVUERBVEU7XHJcblxyXG4gICAgLy8gQ2xvbmUgdmFsdWVzIHNvIGl0IGRvZXNuJ3QgZ2V0IG1vZGlmaWVkIGZvciBjYWxsZXIgc2NvcGUgYW5kIGlnbm9yZSB1bmRlZmluZWQgdmFsdWVzXHJcbiAgICB2YWx1ZXMgPSBfLm9taXRCeSh2YWx1ZXMsIHZhbHVlID0+IHZhbHVlID09PSB1bmRlZmluZWQpO1xyXG5cclxuICAgIC8vIFJlbW92ZSB2YWx1ZXMgdGhhdCBhcmUgbm90IGluIHRoZSBvcHRpb25zLmZpZWxkc1xyXG4gICAgaWYgKG9wdGlvbnMuZmllbGRzICYmIG9wdGlvbnMuZmllbGRzIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXModmFsdWVzKSkge1xyXG4gICAgICAgIGlmICghb3B0aW9ucy5maWVsZHMuaW5jbHVkZXMoa2V5KSkge1xyXG4gICAgICAgICAgZGVsZXRlIHZhbHVlc1trZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgdXBkYXRlZEF0QXR0ciA9IHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0O1xyXG4gICAgICBvcHRpb25zLmZpZWxkcyA9IF8uaW50ZXJzZWN0aW9uKE9iamVjdC5rZXlzKHZhbHVlcyksIE9iamVjdC5rZXlzKHRoaXMudGFibGVBdHRyaWJ1dGVzKSk7XHJcbiAgICAgIGlmICh1cGRhdGVkQXRBdHRyICYmICFvcHRpb25zLmZpZWxkcy5pbmNsdWRlcyh1cGRhdGVkQXRBdHRyKSkge1xyXG4gICAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2godXBkYXRlZEF0QXR0cik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5fdGltZXN0YW1wQXR0cmlidXRlcy51cGRhdGVkQXQgJiYgIW9wdGlvbnMuc2lsZW50KSB7XHJcbiAgICAgIHZhbHVlc1t0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdF0gPSB0aGlzLl9nZXREZWZhdWx0VGltZXN0YW1wKHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0KSB8fCBVdGlscy5ub3codGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zLm1vZGVsID0gdGhpcztcclxuXHJcbiAgICBsZXQgaW5zdGFuY2VzO1xyXG4gICAgbGV0IHZhbHVlc1VzZTtcclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xyXG4gICAgICAvLyBWYWxpZGF0ZVxyXG4gICAgICBpZiAob3B0aW9ucy52YWxpZGF0ZSkge1xyXG4gICAgICAgIGNvbnN0IGJ1aWxkID0gdGhpcy5idWlsZCh2YWx1ZXMpO1xyXG4gICAgICAgIGJ1aWxkLnNldCh0aGlzLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdCwgdmFsdWVzW3RoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0XSwgeyByYXc6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnNpZGVFZmZlY3RzKSB7XHJcbiAgICAgICAgICB2YWx1ZXMgPSBPYmplY3QuYXNzaWduKHZhbHVlcywgXy5waWNrKGJ1aWxkLmdldCgpLCBidWlsZC5jaGFuZ2VkKCkpKTtcclxuICAgICAgICAgIG9wdGlvbnMuZmllbGRzID0gXy51bmlvbihvcHRpb25zLmZpZWxkcywgT2JqZWN0LmtleXModmFsdWVzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBXZSB3YW50IHRvIHNraXAgdmFsaWRhdGlvbnMgZm9yIGFsbCBvdGhlciBmaWVsZHNcclxuICAgICAgICBvcHRpb25zLnNraXAgPSBfLmRpZmZlcmVuY2UoT2JqZWN0LmtleXModGhpcy5yYXdBdHRyaWJ1dGVzKSwgT2JqZWN0LmtleXModmFsdWVzKSk7XHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkLnZhbGlkYXRlKG9wdGlvbnMpLnRoZW4oYXR0cmlidXRlcyA9PiB7XHJcbiAgICAgICAgICBvcHRpb25zLnNraXAgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBpZiAoYXR0cmlidXRlcyAmJiBhdHRyaWJ1dGVzLmRhdGFWYWx1ZXMpIHtcclxuICAgICAgICAgICAgdmFsdWVzID0gXy5waWNrKGF0dHJpYnV0ZXMuZGF0YVZhbHVlcywgT2JqZWN0LmtleXModmFsdWVzKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgLy8gUnVuIGJlZm9yZSBob29rXHJcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XHJcbiAgICAgICAgb3B0aW9ucy5hdHRyaWJ1dGVzID0gdmFsdWVzO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdiZWZvcmVCdWxrVXBkYXRlJywgb3B0aW9ucykudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICB2YWx1ZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXM7XHJcbiAgICAgICAgICBkZWxldGUgb3B0aW9ucy5hdHRyaWJ1dGVzO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgIHZhbHVlc1VzZSA9IHZhbHVlcztcclxuXHJcbiAgICAgIC8vIEdldCBpbnN0YW5jZXMgYW5kIHJ1biBiZWZvcmVVcGRhdGUgaG9vayBvbiBlYWNoIHJlY29yZCBpbmRpdmlkdWFsbHlcclxuICAgICAgaWYgKG9wdGlvbnMuaW5kaXZpZHVhbEhvb2tzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZEFsbCh7XHJcbiAgICAgICAgICB3aGVyZTogb3B0aW9ucy53aGVyZSxcclxuICAgICAgICAgIHRyYW5zYWN0aW9uOiBvcHRpb25zLnRyYW5zYWN0aW9uLFxyXG4gICAgICAgICAgbG9nZ2luZzogb3B0aW9ucy5sb2dnaW5nLFxyXG4gICAgICAgICAgYmVuY2htYXJrOiBvcHRpb25zLmJlbmNobWFyayxcclxuICAgICAgICAgIHBhcmFub2lkOiBvcHRpb25zLnBhcmFub2lkXHJcbiAgICAgICAgfSkudGhlbihfaW5zdGFuY2VzID0+IHtcclxuICAgICAgICAgIGluc3RhbmNlcyA9IF9pbnN0YW5jZXM7XHJcbiAgICAgICAgICBpZiAoIWluc3RhbmNlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJ1biBiZWZvcmVVcGRhdGUgaG9va3Mgb24gZWFjaCByZWNvcmQgYW5kIGNoZWNrIHdoZXRoZXIgYmVmb3JlVXBkYXRlIGhvb2sgY2hhbmdlcyB2YWx1ZXMgdW5pZm9ybWx5XHJcbiAgICAgICAgICAvLyBpLmUuIHdoZXRoZXIgdGhleSBjaGFuZ2UgdmFsdWVzIGZvciBlYWNoIHJlY29yZCBpbiB0aGUgc2FtZSB3YXlcclxuICAgICAgICAgIGxldCBjaGFuZ2VkVmFsdWVzO1xyXG4gICAgICAgICAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLm1hcChpbnN0YW5jZXMsIGluc3RhbmNlID0+IHtcclxuICAgICAgICAgICAgLy8gUmVjb3JkIHVwZGF0ZXMgaW4gaW5zdGFuY2VzIGRhdGFWYWx1ZXNcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihpbnN0YW5jZS5kYXRhVmFsdWVzLCB2YWx1ZXMpO1xyXG4gICAgICAgICAgICAvLyBTZXQgdGhlIGNoYW5nZWQgZmllbGRzIG9uIHRoZSBpbnN0YW5jZVxyXG4gICAgICAgICAgICBfLmZvckluKHZhbHVlc1VzZSwgKG5ld1ZhbHVlLCBhdHRyKSA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBpbnN0YW5jZS5fcHJldmlvdXNEYXRhVmFsdWVzW2F0dHJdKSB7XHJcbiAgICAgICAgICAgICAgICBpbnN0YW5jZS5zZXREYXRhVmFsdWUoYXR0ciwgbmV3VmFsdWUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBSdW4gYmVmb3JlVXBkYXRlIGhvb2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoJ2JlZm9yZVVwZGF0ZScsIGluc3RhbmNlLCBvcHRpb25zKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICBpZiAoIWRpZmZlcmVudCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGhpc0NoYW5nZWRWYWx1ZXMgPSB7fTtcclxuICAgICAgICAgICAgICAgIF8uZm9ySW4oaW5zdGFuY2UuZGF0YVZhbHVlcywgKG5ld1ZhbHVlLCBhdHRyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gaW5zdGFuY2UuX3ByZXZpb3VzRGF0YVZhbHVlc1thdHRyXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNDaGFuZ2VkVmFsdWVzW2F0dHJdID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY2hhbmdlZFZhbHVlcykge1xyXG4gICAgICAgICAgICAgICAgICBjaGFuZ2VkVmFsdWVzID0gdGhpc0NoYW5nZWRWYWx1ZXM7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBkaWZmZXJlbnQgPSAhXy5pc0VxdWFsKGNoYW5nZWRWYWx1ZXMsIHRoaXNDaGFuZ2VkVmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KS50aGVuKF9pbnN0YW5jZXMgPT4ge1xyXG4gICAgICAgICAgICBpbnN0YW5jZXMgPSBfaW5zdGFuY2VzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFkaWZmZXJlbnQpIHtcclxuICAgICAgICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoY2hhbmdlZFZhbHVlcyk7XHJcbiAgICAgICAgICAgICAgLy8gSG9va3MgZG8gbm90IGNoYW5nZSB2YWx1ZXMgb3IgY2hhbmdlIHRoZW0gdW5pZm9ybWx5XHJcbiAgICAgICAgICAgICAgaWYgKGtleXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBIb29rcyBjaGFuZ2UgdmFsdWVzIC0gcmVjb3JkIGNoYW5nZXMgaW4gdmFsdWVzVXNlIHNvIHRoZXkgYXJlIGV4ZWN1dGVkXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXNVc2UgPSBjaGFuZ2VkVmFsdWVzO1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5maWVsZHMgPSBfLnVuaW9uKG9wdGlvbnMuZmllbGRzLCBrZXlzKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEhvb2tzIGNoYW5nZSB2YWx1ZXMgaW4gYSBkaWZmZXJlbnQgd2F5IGZvciBlYWNoIHJlY29yZFxyXG4gICAgICAgICAgICAvLyBEbyBub3QgcnVuIG9yaWdpbmFsIHF1ZXJ5IGJ1dCBzYXZlIGVhY2ggcmVjb3JkIGluZGl2aWR1YWxseVxyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5tYXAoaW5zdGFuY2VzLCBpbnN0YW5jZSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgaW5kaXZpZHVhbE9wdGlvbnMgPSBfLmNsb25lKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgIGRlbGV0ZSBpbmRpdmlkdWFsT3B0aW9ucy5pbmRpdmlkdWFsSG9va3M7XHJcbiAgICAgICAgICAgICAgaW5kaXZpZHVhbE9wdGlvbnMuaG9va3MgPSBmYWxzZTtcclxuICAgICAgICAgICAgICBpbmRpdmlkdWFsT3B0aW9ucy52YWxpZGF0ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2Uuc2F2ZShpbmRpdmlkdWFsT3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH0pLnRhcChfaW5zdGFuY2VzID0+IHtcclxuICAgICAgICAgICAgICBpbnN0YW5jZXMgPSBfaW5zdGFuY2VzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KS50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICAvLyBVcGRhdGUgYWxyZWFkeSBkb25lIHJvdy1ieS1yb3cgLSBleGl0XHJcbiAgICAgIGlmIChyZXN1bHRzKSB7XHJcbiAgICAgICAgcmV0dXJuIFtyZXN1bHRzLmxlbmd0aCwgcmVzdWx0c107XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIG9ubHkgdXBkYXRlZEF0IGlzIGJlaW5nIHBhc3NlZCwgdGhlbiBza2lwIHVwZGF0ZVxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgXy5pc0VtcHR5KHZhbHVlc1VzZSlcclxuICAgICAgICAgfHwgT2JqZWN0LmtleXModmFsdWVzVXNlKS5sZW5ndGggPT09IDEgJiYgdmFsdWVzVXNlW3RoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0XVxyXG4gICAgICApIHtcclxuICAgICAgICByZXR1cm4gWzBdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YWx1ZXNVc2UgPSBVdGlscy5tYXBWYWx1ZUZpZWxkTmFtZXModmFsdWVzVXNlLCBvcHRpb25zLmZpZWxkcywgdGhpcyk7XHJcbiAgICAgIG9wdGlvbnMgPSBVdGlscy5tYXBPcHRpb25GaWVsZE5hbWVzKG9wdGlvbnMsIHRoaXMpO1xyXG4gICAgICBvcHRpb25zLmhhc1RyaWdnZXIgPSB0aGlzLm9wdGlvbnMgPyB0aGlzLm9wdGlvbnMuaGFzVHJpZ2dlciA6IGZhbHNlO1xyXG5cclxuICAgICAgLy8gUnVuIHF1ZXJ5IHRvIHVwZGF0ZSBhbGwgcm93c1xyXG4gICAgICByZXR1cm4gdGhpcy5RdWVyeUludGVyZmFjZS5idWxrVXBkYXRlKHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCB2YWx1ZXNVc2UsIG9wdGlvbnMud2hlcmUsIG9wdGlvbnMsIHRoaXMudGFibGVBdHRyaWJ1dGVzKS50aGVuKGFmZmVjdGVkUm93cyA9PiB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMucmV0dXJuaW5nKSB7XHJcbiAgICAgICAgICBpbnN0YW5jZXMgPSBhZmZlY3RlZFJvd3M7XHJcbiAgICAgICAgICByZXR1cm4gW2FmZmVjdGVkUm93cy5sZW5ndGgsIGFmZmVjdGVkUm93c107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gW2FmZmVjdGVkUm93c107XHJcbiAgICAgIH0pO1xyXG4gICAgfSkudGFwKHJlc3VsdCA9PiB7XHJcbiAgICAgIGlmIChvcHRpb25zLmluZGl2aWR1YWxIb29rcykge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLm1hcChpbnN0YW5jZXMsIGluc3RhbmNlID0+IHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnJ1bkhvb2tzKCdhZnRlclVwZGF0ZScsIGluc3RhbmNlLCBvcHRpb25zKTtcclxuICAgICAgICB9KS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHJlc3VsdFsxXSA9IGluc3RhbmNlcztcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSkudGFwKCgpID0+IHtcclxuICAgICAgLy8gUnVuIGFmdGVyIGhvb2tcclxuICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcclxuICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSB2YWx1ZXM7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuSG9va3MoJ2FmdGVyQnVsa1VwZGF0ZScsIG9wdGlvbnMpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgZGVsZXRlIG9wdGlvbnMuYXR0cmlidXRlcztcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSdW4gYSBkZXNjcmliZSBxdWVyeSBvbiB0aGUgdGFibGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3NjaGVtYV0gc2NoZW1hIG5hbWUgdG8gc2VhcmNoIHRhYmxlIGluXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBxdWVyeSBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gaGFzaCBvZiBhdHRyaWJ1dGVzIGFuZCB0aGVpciB0eXBlc1xyXG4gICAqL1xyXG4gIHN0YXRpYyBkZXNjcmliZShzY2hlbWEsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmRlc2NyaWJlVGFibGUodGhpcy50YWJsZU5hbWUsIE9iamVjdC5hc3NpZ24oeyBzY2hlbWE6IHNjaGVtYSB8fCB0aGlzLl9zY2hlbWEgfHwgdW5kZWZpbmVkIH0sIG9wdGlvbnMpKTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBfZ2V0RGVmYXVsdFRpbWVzdGFtcChhdHRyKSB7XHJcbiAgICBpZiAoISF0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0gJiYgISF0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgIHJldHVybiBVdGlscy50b0RlZmF1bHRWYWx1ZSh0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZGVmYXVsdFZhbHVlLCB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBfZXhwYW5kQXR0cmlidXRlcyhvcHRpb25zKSB7XHJcbiAgICBpZiAoIV8uaXNQbGFpbk9iamVjdChvcHRpb25zLmF0dHJpYnV0ZXMpKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGxldCBhdHRyaWJ1dGVzID0gT2JqZWN0LmtleXModGhpcy5yYXdBdHRyaWJ1dGVzKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzLmV4Y2x1ZGUpIHtcclxuICAgICAgYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXMuZmlsdGVyKGVsZW0gPT4gIW9wdGlvbnMuYXR0cmlidXRlcy5leGNsdWRlLmluY2x1ZGVzKGVsZW0pKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzLmluY2x1ZGUpIHtcclxuICAgICAgYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXMuY29uY2F0KG9wdGlvbnMuYXR0cmlidXRlcy5pbmNsdWRlKTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xyXG4gIH1cclxuXHJcbiAgLy8gSW5qZWN0IF9zY29wZSBpbnRvIG9wdGlvbnMuXHJcbiAgc3RhdGljIF9pbmplY3RTY29wZShvcHRpb25zKSB7XHJcbiAgICBjb25zdCBzY29wZSA9IFV0aWxzLmNsb25lRGVlcCh0aGlzLl9zY29wZSk7XHJcbiAgICB0aGlzLl9kZWZhdWx0c09wdGlvbnMob3B0aW9ucywgc2NvcGUpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIFtTeW1ib2wuZm9yKCdub2RlanMudXRpbC5pbnNwZWN0LmN1c3RvbScpXSgpIHtcclxuICAgIHJldHVybiB0aGlzLm5hbWU7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgaW5zcGVjdCgpIHtcclxuICAgIHJldHVybiB0aGlzLm5hbWU7XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgaGFzQWxpYXMoYWxpYXMpIHtcclxuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5hc3NvY2lhdGlvbnMsIGFsaWFzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluY3JlbWVudCB0aGUgdmFsdWUgb2Ygb25lIG9yIG1vcmUgY29sdW1ucy4gVGhpcyBpcyBkb25lIGluIHRoZSBkYXRhYmFzZSwgd2hpY2ggbWVhbnMgaXQgZG9lcyBub3QgdXNlIHRoZSB2YWx1ZXMgY3VycmVudGx5IHN0b3JlZCBvbiB0aGUgSW5zdGFuY2UuIFRoZSBpbmNyZW1lbnQgaXMgZG9uZSB1c2luZyBhXHJcbiAgICogYGBgIFNFVCBjb2x1bW4gPSBjb2x1bW4gKyBYIFdIRVJFIGZvbyA9ICdiYXInIGBgYCBxdWVyeS4gVG8gZ2V0IHRoZSBjb3JyZWN0IHZhbHVlIGFmdGVyIGFuIGluY3JlbWVudCBpbnRvIHRoZSBJbnN0YW5jZSB5b3Ugc2hvdWxkIGRvIGEgcmVsb2FkLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+aW5jcmVtZW50IG51bWJlciBieSAxPC9jYXB0aW9uPlxyXG4gICAqIE1vZGVsLmluY3JlbWVudCgnbnVtYmVyJywgeyB3aGVyZTogeyBmb286ICdiYXInIH0pO1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+aW5jcmVtZW50IG51bWJlciBhbmQgY291bnQgYnkgMjwvY2FwdGlvbj5cclxuICAgKiBNb2RlbC5pbmNyZW1lbnQoWydudW1iZXInLCAnY291bnQnXSwgeyBieTogMiwgd2hlcmU6IHsgZm9vOiAnYmFyJyB9IH0pO1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+aW5jcmVtZW50IGFuc3dlciBieSA0MiwgYW5kIGRlY3JlbWVudCB0cmllcyBieSAxPC9jYXB0aW9uPlxyXG4gICAqIC8vIGBieWAgaXMgaWdub3JlZCwgYXMgZWFjaCBjb2x1bW4gaGFzIGl0cyBvd24gdmFsdWVcclxuICAgKiBNb2RlbC5pbmNyZW1lbnQoeyBhbnN3ZXI6IDQyLCB0cmllczogLTF9LCB7IGJ5OiAyLCB3aGVyZTogeyBmb286ICdiYXInIH0gfSk7XHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsI3JlbG9hZH1cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fE9iamVjdH0gZmllbGRzIElmIGEgc3RyaW5nIGlzIHByb3ZpZGVkLCB0aGF0IGNvbHVtbiBpcyBpbmNyZW1lbnRlZCBieSB0aGUgdmFsdWUgb2YgYGJ5YCBnaXZlbiBpbiBvcHRpb25zLiBJZiBhbiBhcnJheSBpcyBwcm92aWRlZCwgdGhlIHNhbWUgaXMgdHJ1ZSBmb3IgZWFjaCBjb2x1bW4uIElmIGFuZCBvYmplY3QgaXMgcHJvdmlkZWQsIGVhY2ggY29sdW1uIGlzIGluY3JlbWVudGVkIGJ5IHRoZSB2YWx1ZSBnaXZlbi5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBpbmNyZW1lbnQgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLndoZXJlIGNvbmRpdGlvbnMgaGFzaFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5ieT0xXSBUaGUgbnVtYmVyIHRvIGluY3JlbWVudCBieVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc2lsZW50PWZhbHNlXSBJZiB0cnVlLCB0aGUgdXBkYXRlZEF0IHRpbWVzdGFtcCB3aWxsIG5vdCBiZSB1cGRhdGVkLlxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxyXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb259IFtvcHRpb25zLnRyYW5zYWN0aW9uXSBUcmFuc2FjdGlvbiB0byBydW4gcXVlcnkgdW5kZXJcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWxbXSw/bnVtYmVyPn0gcmV0dXJucyBhbiBhcnJheSBvZiBhZmZlY3RlZCByb3dzIGFuZCBhZmZlY3RlZCBjb3VudCB3aXRoIGBvcHRpb25zLnJldHVybmluZzogdHJ1ZWAsIHdoZW5ldmVyIHN1cHBvcnRlZCBieSBkaWFsZWN0XHJcbiAgICovXHJcbiAgc3RhdGljIGluY3JlbWVudChmaWVsZHMsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIHRoaXMuX2luamVjdFNjb3BlKG9wdGlvbnMpO1xyXG4gICAgdGhpcy5fb3B0aW9uc011c3RDb250YWluV2hlcmUob3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3QgdXBkYXRlZEF0QXR0ciA9IHRoaXMuX3RpbWVzdGFtcEF0dHJpYnV0ZXMudXBkYXRlZEF0O1xyXG4gICAgY29uc3QgdmVyc2lvbkF0dHIgPSB0aGlzLl92ZXJzaW9uQXR0cmlidXRlO1xyXG4gICAgY29uc3QgdXBkYXRlZEF0QXR0cmlidXRlID0gdGhpcy5yYXdBdHRyaWJ1dGVzW3VwZGF0ZWRBdEF0dHJdO1xyXG4gICAgb3B0aW9ucyA9IFV0aWxzLmRlZmF1bHRzKHt9LCBvcHRpb25zLCB7XHJcbiAgICAgIGJ5OiAxLFxyXG4gICAgICBhdHRyaWJ1dGVzOiB7fSxcclxuICAgICAgd2hlcmU6IHt9LFxyXG4gICAgICBpbmNyZW1lbnQ6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIFV0aWxzLm1hcE9wdGlvbkZpZWxkTmFtZXMob3B0aW9ucywgdGhpcyk7XHJcblxyXG4gICAgY29uc3Qgd2hlcmUgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLndoZXJlKTtcclxuICAgIGxldCB2YWx1ZXMgPSB7fTtcclxuXHJcbiAgICBpZiAodHlwZW9mIGZpZWxkcyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgdmFsdWVzW2ZpZWxkc10gPSBvcHRpb25zLmJ5O1xyXG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGZpZWxkcykpIHtcclxuICAgICAgZmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xyXG4gICAgICAgIHZhbHVlc1tmaWVsZF0gPSBvcHRpb25zLmJ5O1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7IC8vIEFzc3VtZSBmaWVsZHMgaXMga2V5LXZhbHVlIHBhaXJzXHJcbiAgICAgIHZhbHVlcyA9IGZpZWxkcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIW9wdGlvbnMuc2lsZW50ICYmIHVwZGF0ZWRBdEF0dHIgJiYgIXZhbHVlc1t1cGRhdGVkQXRBdHRyXSkge1xyXG4gICAgICBvcHRpb25zLmF0dHJpYnV0ZXNbdXBkYXRlZEF0QXR0cmlidXRlLmZpZWxkIHx8IHVwZGF0ZWRBdEF0dHJdID0gdGhpcy5fZ2V0RGVmYXVsdFRpbWVzdGFtcCh1cGRhdGVkQXRBdHRyKSB8fCBVdGlscy5ub3codGhpcy5zZXF1ZWxpemUub3B0aW9ucy5kaWFsZWN0KTtcclxuICAgIH1cclxuICAgIGlmICh2ZXJzaW9uQXR0cikge1xyXG4gICAgICB2YWx1ZXNbdmVyc2lvbkF0dHJdID0gb3B0aW9ucy5pbmNyZW1lbnQgPyAxIDogLTE7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCBhdHRyIG9mIE9iamVjdC5rZXlzKHZhbHVlcykpIHtcclxuICAgICAgLy8gRmllbGQgbmFtZSBtYXBwaW5nXHJcbiAgICAgIGlmICh0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0gJiYgdGhpcy5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkICYmIHRoaXMucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCAhPT0gYXR0cikge1xyXG4gICAgICAgIHZhbHVlc1t0aGlzLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGRdID0gdmFsdWVzW2F0dHJdO1xyXG4gICAgICAgIGRlbGV0ZSB2YWx1ZXNbYXR0cl07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBsZXQgcHJvbWlzZTtcclxuICAgIGlmICghb3B0aW9ucy5pbmNyZW1lbnQpIHtcclxuICAgICAgcHJvbWlzZSA9IHRoaXMuUXVlcnlJbnRlcmZhY2UuZGVjcmVtZW50KHRoaXMsIHRoaXMuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCB2YWx1ZXMsIHdoZXJlLCBvcHRpb25zKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHByb21pc2UgPSB0aGlzLlF1ZXJ5SW50ZXJmYWNlLmluY3JlbWVudCh0aGlzLCB0aGlzLmdldFRhYmxlTmFtZShvcHRpb25zKSwgdmFsdWVzLCB3aGVyZSwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2UudGhlbihhZmZlY3RlZFJvd3MgPT4ge1xyXG4gICAgICBpZiAob3B0aW9ucy5yZXR1cm5pbmcpIHtcclxuICAgICAgICByZXR1cm4gW2FmZmVjdGVkUm93cywgYWZmZWN0ZWRSb3dzLmxlbmd0aF07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBbYWZmZWN0ZWRSb3dzXTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVjcmVtZW50IHRoZSB2YWx1ZSBvZiBvbmUgb3IgbW9yZSBjb2x1bW5zLiBUaGlzIGlzIGRvbmUgaW4gdGhlIGRhdGFiYXNlLCB3aGljaCBtZWFucyBpdCBkb2VzIG5vdCB1c2UgdGhlIHZhbHVlcyBjdXJyZW50bHkgc3RvcmVkIG9uIHRoZSBJbnN0YW5jZS4gVGhlIGRlY3JlbWVudCBpcyBkb25lIHVzaW5nIGFcclxuICAgKiBgYGBzcWwgU0VUIGNvbHVtbiA9IGNvbHVtbiAtIFggV0hFUkUgZm9vID0gJ2JhcidgYGAgcXVlcnkuIFRvIGdldCB0aGUgY29ycmVjdCB2YWx1ZSBhZnRlciBhIGRlY3JlbWVudCBpbnRvIHRoZSBJbnN0YW5jZSB5b3Ugc2hvdWxkIGRvIGEgcmVsb2FkLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+ZGVjcmVtZW50IG51bWJlciBieSAxPC9jYXB0aW9uPlxyXG4gICAqIE1vZGVsLmRlY3JlbWVudCgnbnVtYmVyJywgeyB3aGVyZTogeyBmb286ICdiYXInIH0pO1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+ZGVjcmVtZW50IG51bWJlciBhbmQgY291bnQgYnkgMjwvY2FwdGlvbj5cclxuICAgKiBNb2RlbC5kZWNyZW1lbnQoWydudW1iZXInLCAnY291bnQnXSwgeyBieTogMiwgd2hlcmU6IHsgZm9vOiAnYmFyJyB9IH0pO1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+ZGVjcmVtZW50IGFuc3dlciBieSA0MiwgYW5kIGRlY3JlbWVudCB0cmllcyBieSAtMTwvY2FwdGlvbj5cclxuICAgKiAvLyBgYnlgIGlzIGlnbm9yZWQsIHNpbmNlIGVhY2ggY29sdW1uIGhhcyBpdHMgb3duIHZhbHVlXHJcbiAgICogTW9kZWwuZGVjcmVtZW50KHsgYW5zd2VyOiA0MiwgdHJpZXM6IC0xfSwgeyBieTogMiwgd2hlcmU6IHsgZm9vOiAnYmFyJyB9IH0pO1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl8T2JqZWN0fSBmaWVsZHMgSWYgYSBzdHJpbmcgaXMgcHJvdmlkZWQsIHRoYXQgY29sdW1uIGlzIGluY3JlbWVudGVkIGJ5IHRoZSB2YWx1ZSBvZiBgYnlgIGdpdmVuIGluIG9wdGlvbnMuIElmIGFuIGFycmF5IGlzIHByb3ZpZGVkLCB0aGUgc2FtZSBpcyB0cnVlIGZvciBlYWNoIGNvbHVtbi4gSWYgYW5kIG9iamVjdCBpcyBwcm92aWRlZCwgZWFjaCBjb2x1bW4gaXMgaW5jcmVtZW50ZWQgYnkgdGhlIHZhbHVlIGdpdmVuLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIGRlY3JlbWVudCBvcHRpb25zLCBzaW1pbGFyIHRvIGluY3JlbWVudFxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbC5pbmNyZW1lbnR9XHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbCNyZWxvYWR9XHJcbiAgICogQHNpbmNlIDQuMzYuMFxyXG5cclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbFtdLD9udW1iZXI+fSByZXR1cm5zIGFuIGFycmF5IG9mIGFmZmVjdGVkIHJvd3MgYW5kIGFmZmVjdGVkIGNvdW50IHdpdGggYG9wdGlvbnMucmV0dXJuaW5nOiB0cnVlYCwgd2hlbmV2ZXIgc3VwcG9ydGVkIGJ5IGRpYWxlY3RcclxuICAgKi9cclxuICBzdGF0aWMgZGVjcmVtZW50KGZpZWxkcywgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IF8uZGVmYXVsdHMoeyBpbmNyZW1lbnQ6IGZhbHNlIH0sIG9wdGlvbnMsIHtcclxuICAgICAgYnk6IDFcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0aGlzLmluY3JlbWVudChmaWVsZHMsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIF9vcHRpb25zTXVzdENvbnRhaW5XaGVyZShvcHRpb25zKSB7XHJcbiAgICBhc3NlcnQob3B0aW9ucyAmJiBvcHRpb25zLndoZXJlLCAnTWlzc2luZyB3aGVyZSBhdHRyaWJ1dGUgaW4gdGhlIG9wdGlvbnMgcGFyYW1ldGVyJyk7XHJcbiAgICBhc3NlcnQoXy5pc1BsYWluT2JqZWN0KG9wdGlvbnMud2hlcmUpIHx8IEFycmF5LmlzQXJyYXkob3B0aW9ucy53aGVyZSkgfHwgb3B0aW9ucy53aGVyZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCxcclxuICAgICAgJ0V4cGVjdGVkIHBsYWluIG9iamVjdCwgYXJyYXkgb3Igc2VxdWVsaXplIG1ldGhvZCBpbiB0aGUgb3B0aW9ucy53aGVyZSBwYXJhbWV0ZXInKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBxdWVyeSBmb3IgdGhpcyBpbnN0YW5jZSwgdXNlIHdpdGggYG9wdGlvbnMud2hlcmVgXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjaGVja1ZlcnNpb249ZmFsc2VdIGluY2x1ZGUgdmVyc2lvbiBhdHRyaWJ1dGUgaW4gd2hlcmUgaGFzaFxyXG4gICAqXHJcbiAgICogQHJldHVybnMge09iamVjdH1cclxuICAgKi9cclxuICB3aGVyZShjaGVja1ZlcnNpb24pIHtcclxuICAgIGNvbnN0IHdoZXJlID0gdGhpcy5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5QXR0cmlidXRlcy5yZWR1Y2UoKHJlc3VsdCwgYXR0cmlidXRlKSA9PiB7XHJcbiAgICAgIHJlc3VsdFthdHRyaWJ1dGVdID0gdGhpcy5nZXQoYXR0cmlidXRlLCB7IHJhdzogdHJ1ZSB9KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sIHt9KTtcclxuXHJcbiAgICBpZiAoXy5zaXplKHdoZXJlKSA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fbW9kZWxPcHRpb25zLndoZXJlQ29sbGVjdGlvbjtcclxuICAgIH1cclxuICAgIGNvbnN0IHZlcnNpb25BdHRyID0gdGhpcy5jb25zdHJ1Y3Rvci5fdmVyc2lvbkF0dHJpYnV0ZTtcclxuICAgIGlmIChjaGVja1ZlcnNpb24gJiYgdmVyc2lvbkF0dHIpIHtcclxuICAgICAgd2hlcmVbdmVyc2lvbkF0dHJdID0gdGhpcy5nZXQodmVyc2lvbkF0dHIsIHsgcmF3OiB0cnVlIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFV0aWxzLm1hcFdoZXJlRmllbGROYW1lcyh3aGVyZSwgdGhpcy5jb25zdHJ1Y3Rvcik7XHJcbiAgfVxyXG5cclxuICB0b1N0cmluZygpIHtcclxuICAgIHJldHVybiBgW29iamVjdCBTZXF1ZWxpemVJbnN0YW5jZToke3RoaXMuY29uc3RydWN0b3IubmFtZX1dYDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIHVuZGVybHlpbmcgZGF0YSB2YWx1ZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBrZXkgdG8gbG9vayBpbiBpbnN0YW5jZSBkYXRhIHN0b3JlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7YW55fVxyXG4gICAqL1xyXG4gIGdldERhdGFWYWx1ZShrZXkpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFWYWx1ZXNba2V5XTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgdW5kZXJseWluZyBkYXRhIHZhbHVlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IGtleSB0byBzZXQgaW4gaW5zdGFuY2UgZGF0YSBzdG9yZVxyXG4gICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBuZXcgdmFsdWUgZm9yIGdpdmVuIGtleVxyXG4gICAqXHJcbiAgICovXHJcbiAgc2V0RGF0YVZhbHVlKGtleSwgdmFsdWUpIHtcclxuICAgIGNvbnN0IG9yaWdpbmFsVmFsdWUgPSB0aGlzLl9wcmV2aW91c0RhdGFWYWx1ZXNba2V5XTtcclxuXHJcbiAgICBpZiAoIVV0aWxzLmlzUHJpbWl0aXZlKHZhbHVlKSAmJiB2YWx1ZSAhPT0gbnVsbCB8fCB2YWx1ZSAhPT0gb3JpZ2luYWxWYWx1ZSkge1xyXG4gICAgICB0aGlzLmNoYW5nZWQoa2V5LCB0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmRhdGFWYWx1ZXNba2V5XSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSWYgbm8ga2V5IGlzIGdpdmVuLCByZXR1cm5zIGFsbCB2YWx1ZXMgb2YgdGhlIGluc3RhbmNlLCBhbHNvIGludm9raW5nIHZpcnR1YWwgZ2V0dGVycy5cclxuICAgKlxyXG4gICAqIElmIGtleSBpcyBnaXZlbiBhbmQgYSBmaWVsZCBvciB2aXJ0dWFsIGdldHRlciBpcyBwcmVzZW50IGZvciB0aGUga2V5IGl0IHdpbGwgY2FsbCB0aGF0IGdldHRlciAtIGVsc2UgaXQgd2lsbCByZXR1cm4gdGhlIHZhbHVlIGZvciBrZXkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gIFtrZXldIGtleSB0byBnZXQgdmFsdWUgb2ZcclxuICAgKiBAcGFyYW0ge09iamVjdH0gIFtvcHRpb25zXSBnZXQgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucGxhaW49ZmFsc2VdIElmIHNldCB0byB0cnVlLCBpbmNsdWRlZCBpbnN0YW5jZXMgd2lsbCBiZSByZXR1cm5lZCBhcyBwbGFpbiBvYmplY3RzXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yYXc9ZmFsc2VdIElmIHNldCB0byB0cnVlLCBmaWVsZCBhbmQgdmlydHVhbCBzZXR0ZXJzIHdpbGwgYmUgaWdub3JlZFxyXG4gICAqXHJcbiAgICogQHJldHVybnMge09iamVjdHxhbnl9XHJcbiAgICovXHJcbiAgZ2V0KGtleSwgb3B0aW9ucykge1xyXG4gICAgaWYgKG9wdGlvbnMgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICBvcHRpb25zID0ga2V5O1xyXG4gICAgICBrZXkgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgaWYgKGtleSkge1xyXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuX2N1c3RvbUdldHRlcnMsIGtleSkgJiYgIW9wdGlvbnMucmF3KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1c3RvbUdldHRlcnNba2V5XS5jYWxsKHRoaXMsIGtleSwgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLnBsYWluICYmIHRoaXMuX29wdGlvbnMuaW5jbHVkZSAmJiB0aGlzLl9vcHRpb25zLmluY2x1ZGVOYW1lcy5pbmNsdWRlcyhrZXkpKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhVmFsdWVzW2tleV0pKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhVmFsdWVzW2tleV0ubWFwKGluc3RhbmNlID0+IGluc3RhbmNlLmdldChvcHRpb25zKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmRhdGFWYWx1ZXNba2V5XSBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhVmFsdWVzW2tleV0uZ2V0KG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhVmFsdWVzW2tleV07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmRhdGFWYWx1ZXNba2V5XTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgIHRoaXMuX2hhc0N1c3RvbUdldHRlcnNcclxuICAgICAgfHwgb3B0aW9ucy5wbGFpbiAmJiB0aGlzLl9vcHRpb25zLmluY2x1ZGVcclxuICAgICAgfHwgb3B0aW9ucy5jbG9uZVxyXG4gICAgKSB7XHJcbiAgICAgIGNvbnN0IHZhbHVlcyA9IHt9O1xyXG4gICAgICBsZXQgX2tleTtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9oYXNDdXN0b21HZXR0ZXJzKSB7XHJcbiAgICAgICAgZm9yIChfa2V5IGluIHRoaXMuX2N1c3RvbUdldHRlcnMpIHtcclxuICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5hdHRyaWJ1dGVzXHJcbiAgICAgICAgICAgICYmICF0aGlzLl9vcHRpb25zLmF0dHJpYnV0ZXMuaW5jbHVkZXMoX2tleSlcclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuX2N1c3RvbUdldHRlcnMsIF9rZXkpKSB7XHJcbiAgICAgICAgICAgIHZhbHVlc1tfa2V5XSA9IHRoaXMuZ2V0KF9rZXksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yIChfa2V5IGluIHRoaXMuZGF0YVZhbHVlcykge1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWVzLCBfa2V5KVxyXG4gICAgICAgICAgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuZGF0YVZhbHVlcywgX2tleSlcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHZhbHVlc1tfa2V5XSA9IHRoaXMuZ2V0KF9rZXksIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5kYXRhVmFsdWVzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IGlzIHVzZWQgdG8gdXBkYXRlIHZhbHVlcyBvbiB0aGUgaW5zdGFuY2UgKHRoZSBzZXF1ZWxpemUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGluc3RhbmNlIHRoYXQgaXMsIHJlbWVtYmVyIHRoYXQgbm90aGluZyB3aWxsIGJlIHBlcnNpc3RlZCBiZWZvcmUgeW91IGFjdHVhbGx5IGNhbGwgYHNhdmVgKS5cclxuICAgKiBJbiBpdHMgbW9zdCBiYXNpYyBmb3JtIGBzZXRgIHdpbGwgdXBkYXRlIGEgdmFsdWUgc3RvcmVkIGluIHRoZSB1bmRlcmx5aW5nIGBkYXRhVmFsdWVzYCBvYmplY3QuIEhvd2V2ZXIsIGlmIGEgY3VzdG9tIHNldHRlciBmdW5jdGlvbiBpcyBkZWZpbmVkIGZvciB0aGUga2V5LCB0aGF0IGZ1bmN0aW9uXHJcbiAgICogd2lsbCBiZSBjYWxsZWQgaW5zdGVhZC4gVG8gYnlwYXNzIHRoZSBzZXR0ZXIsIHlvdSBjYW4gcGFzcyBgcmF3OiB0cnVlYCBpbiB0aGUgb3B0aW9ucyBvYmplY3QuXHJcbiAgICpcclxuICAgKiBJZiBzZXQgaXMgY2FsbGVkIHdpdGggYW4gb2JqZWN0LCBpdCB3aWxsIGxvb3Agb3ZlciB0aGUgb2JqZWN0LCBhbmQgY2FsbCBzZXQgcmVjdXJzaXZlbHkgZm9yIGVhY2gga2V5LCB2YWx1ZSBwYWlyLiBJZiB5b3Ugc2V0IHJhdyB0byB0cnVlLCB0aGUgdW5kZXJseWluZyBkYXRhVmFsdWVzIHdpbGwgZWl0aGVyIGJlXHJcbiAgICogc2V0IGRpcmVjdGx5IHRvIHRoZSBvYmplY3QgcGFzc2VkLCBvciB1c2VkIHRvIGV4dGVuZCBkYXRhVmFsdWVzLCBpZiBkYXRhVmFsdWVzIGFscmVhZHkgY29udGFpbiB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiBXaGVuIHNldCBpcyBjYWxsZWQsIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgZmllbGQgaXMgc3RvcmVkIGFuZCBzZXRzIGEgY2hhbmdlZCBmbGFnKHNlZSBgY2hhbmdlZGApLlxyXG4gICAqXHJcbiAgICogU2V0IGNhbiBhbHNvIGJlIHVzZWQgdG8gYnVpbGQgaW5zdGFuY2VzIGZvciBhc3NvY2lhdGlvbnMsIGlmIHlvdSBoYXZlIHZhbHVlcyBmb3IgdGhvc2UuXHJcbiAgICogV2hlbiB1c2luZyBzZXQgd2l0aCBhc3NvY2lhdGlvbnMgeW91IG5lZWQgdG8gbWFrZSBzdXJlIHRoZSBwcm9wZXJ0eSBrZXkgbWF0Y2hlcyB0aGUgYWxpYXMgb2YgdGhlIGFzc29jaWF0aW9uXHJcbiAgICogd2hpbGUgYWxzbyBtYWtpbmcgc3VyZSB0aGF0IHRoZSBwcm9wZXIgaW5jbHVkZSBvcHRpb25zIGhhdmUgYmVlbiBzZXQgKGZyb20gLmJ1aWxkKCkgb3IgLmZpbmRPbmUoKSlcclxuICAgKlxyXG4gICAqIElmIGNhbGxlZCB3aXRoIGEgZG90LnNlcGFyYXRlZCBrZXkgb24gYSBKU09OL0pTT05CIGF0dHJpYnV0ZSBpdCB3aWxsIHNldCB0aGUgdmFsdWUgbmVzdGVkIGFuZCBmbGFnIHRoZSBlbnRpcmUgb2JqZWN0IGFzIGNoYW5nZWQuXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9IGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IGluY2x1ZGVzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9IGtleSBrZXkgdG8gc2V0LCBpdCBjYW4gYmUgc3RyaW5nIG9yIG9iamVjdC4gV2hlbiBzdHJpbmcgaXQgd2lsbCBzZXQgdGhhdCBrZXksIGZvciBvYmplY3QgaXQgd2lsbCBsb29wIG92ZXIgYWxsIG9iamVjdCBwcm9wZXJ0aWVzIG5kIHNldCB0aGVtLlxyXG4gICAqIEBwYXJhbSB7YW55fSB2YWx1ZSB2YWx1ZSB0byBzZXRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIHNldCBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yYXc9ZmFsc2VdIElmIHNldCB0byB0cnVlLCBmaWVsZCBhbmQgdmlydHVhbCBzZXR0ZXJzIHdpbGwgYmUgaWdub3JlZFxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmVzZXQ9ZmFsc2VdIENsZWFyIGFsbCBwcmV2aW91c2x5IHNldCBkYXRhIHZhbHVlc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge01vZGVsfVxyXG4gICAqL1xyXG4gIHNldChrZXksIHZhbHVlLCBvcHRpb25zKSB7XHJcbiAgICBsZXQgdmFsdWVzO1xyXG4gICAgbGV0IG9yaWdpbmFsVmFsdWU7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmIGtleSAhPT0gbnVsbCkge1xyXG4gICAgICB2YWx1ZXMgPSBrZXk7XHJcbiAgICAgIG9wdGlvbnMgPSB2YWx1ZSB8fCB7fTtcclxuXHJcbiAgICAgIGlmIChvcHRpb25zLnJlc2V0KSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmFsdWVzID0ge307XHJcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsdWVzKSB7XHJcbiAgICAgICAgICB0aGlzLmNoYW5nZWQoa2V5LCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiByYXcsIGFuZCB3ZSdyZSBub3QgZGVhbGluZyB3aXRoIGluY2x1ZGVzIG9yIHNwZWNpYWwgYXR0cmlidXRlcywganVzdCBzZXQgaXQgc3RyYWlnaHQgb24gdGhlIGRhdGFWYWx1ZXMgb2JqZWN0XHJcbiAgICAgIGlmIChvcHRpb25zLnJhdyAmJiAhKHRoaXMuX29wdGlvbnMgJiYgdGhpcy5fb3B0aW9ucy5pbmNsdWRlKSAmJiAhKG9wdGlvbnMgJiYgb3B0aW9ucy5hdHRyaWJ1dGVzKSAmJiAhdGhpcy5jb25zdHJ1Y3Rvci5faGFzRGF0ZUF0dHJpYnV0ZXMgJiYgIXRoaXMuY29uc3RydWN0b3IuX2hhc0Jvb2xlYW5BdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuZGF0YVZhbHVlcykubGVuZ3RoKSB7XHJcbiAgICAgICAgICB0aGlzLmRhdGFWYWx1ZXMgPSBPYmplY3QuYXNzaWduKHRoaXMuZGF0YVZhbHVlcywgdmFsdWVzKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5kYXRhVmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBJZiByYXcsIC5jaGFuZ2VkKCkgc2hvdWxkbid0IGJlIHRydWVcclxuICAgICAgICB0aGlzLl9wcmV2aW91c0RhdGFWYWx1ZXMgPSBfLmNsb25lKHRoaXMuZGF0YVZhbHVlcyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTG9vcCBhbmQgY2FsbCBzZXRcclxuICAgICAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICBjb25zdCBzZXRLZXlzID0gZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgayBvZiBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgaWYgKHZhbHVlc1trXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdGhpcy5zZXQoaywgdmFsdWVzW2tdLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHNldEtleXMob3B0aW9ucy5hdHRyaWJ1dGVzKTtcclxuICAgICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLl9oYXNWaXJ0dWFsQXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICBzZXRLZXlzKHRoaXMuY29uc3RydWN0b3IuX3ZpcnR1YWxBdHRyaWJ1dGVzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zLmluY2x1ZGVOYW1lcykge1xyXG4gICAgICAgICAgICBzZXRLZXlzKHRoaXMuX29wdGlvbnMuaW5jbHVkZU5hbWVzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsdWVzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KGtleSwgdmFsdWVzW2tleV0sIG9wdGlvbnMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMucmF3KSB7XHJcbiAgICAgICAgICAvLyBJZiByYXcsIC5jaGFuZ2VkKCkgc2hvdWxkbid0IGJlIHRydWVcclxuICAgICAgICAgIHRoaXMuX3ByZXZpb3VzRGF0YVZhbHVlcyA9IF8uY2xvbmUodGhpcy5kYXRhVmFsdWVzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBpZiAoIW9wdGlvbnMpXHJcbiAgICAgIG9wdGlvbnMgPSB7fTtcclxuICAgIGlmICghb3B0aW9ucy5yYXcpIHtcclxuICAgICAgb3JpZ2luYWxWYWx1ZSA9IHRoaXMuZGF0YVZhbHVlc1trZXldO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIG5vdCByYXcsIGFuZCB0aGVyZSdzIGEgY3VzdG9tIHNldHRlclxyXG4gICAgaWYgKCFvcHRpb25zLnJhdyAmJiB0aGlzLl9jdXN0b21TZXR0ZXJzW2tleV0pIHtcclxuICAgICAgdGhpcy5fY3VzdG9tU2V0dGVyc1trZXldLmNhbGwodGhpcywgdmFsdWUsIGtleSk7XHJcbiAgICAgIC8vIGN1c3RvbSBzZXR0ZXIgc2hvdWxkIGhhdmUgY2hhbmdlZCB2YWx1ZSwgZ2V0IHRoYXQgY2hhbmdlZCB2YWx1ZVxyXG4gICAgICAvLyBUT0RPOiB2NSBtYWtlIHNldHRlcnMgcmV0dXJuIG5ldyB2YWx1ZSBpbnN0ZWFkIG9mIGNoYW5naW5nIGludGVybmFsIHN0b3JlXHJcbiAgICAgIGNvbnN0IG5ld1ZhbHVlID0gdGhpcy5kYXRhVmFsdWVzW2tleV07XHJcbiAgICAgIGlmICghVXRpbHMuaXNQcmltaXRpdmUobmV3VmFsdWUpICYmIG5ld1ZhbHVlICE9PSBudWxsIHx8IG5ld1ZhbHVlICE9PSBvcmlnaW5hbFZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fcHJldmlvdXNEYXRhVmFsdWVzW2tleV0gPSBvcmlnaW5hbFZhbHVlO1xyXG4gICAgICAgIHRoaXMuY2hhbmdlZChrZXksIHRydWUpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBDaGVjayBpZiB3ZSBoYXZlIGluY2x1ZGVkIG1vZGVscywgYW5kIGlmIHRoaXMga2V5IG1hdGNoZXMgdGhlIGluY2x1ZGUgbW9kZWwgbmFtZXMvYWxpYXNlc1xyXG4gICAgICBpZiAodGhpcy5fb3B0aW9ucyAmJiB0aGlzLl9vcHRpb25zLmluY2x1ZGUgJiYgdGhpcy5fb3B0aW9ucy5pbmNsdWRlTmFtZXMuaW5jbHVkZXMoa2V5KSkge1xyXG4gICAgICAgIC8vIFBhc3MgaXQgb24gdG8gdGhlIGluY2x1ZGUgaGFuZGxlclxyXG4gICAgICAgIHRoaXMuX3NldEluY2x1ZGUoa2V5LCB2YWx1ZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgICAgLy8gQnVuY2ggb2Ygc3R1ZmYgd2Ugd29uJ3QgZG8gd2hlbiBpdCdzIHJhd1xyXG4gICAgICBpZiAoIW9wdGlvbnMucmF3KSB7XHJcbiAgICAgICAgLy8gSWYgYXR0cmlidXRlIGlzIG5vdCBpbiBtb2RlbCBkZWZpbml0aW9uLCByZXR1cm5cclxuICAgICAgICBpZiAoIXRoaXMuX2lzQXR0cmlidXRlKGtleSkpIHtcclxuICAgICAgICAgIGlmIChrZXkuaW5jbHVkZXMoJy4nKSAmJiB0aGlzLmNvbnN0cnVjdG9yLl9qc29uQXR0cmlidXRlcy5oYXMoa2V5LnNwbGl0KCcuJylbMF0pKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzTmVzdGVkVmFsdWUgPSBEb3R0aWUuZ2V0KHRoaXMuZGF0YVZhbHVlcywga2V5KTtcclxuICAgICAgICAgICAgaWYgKCFfLmlzRXF1YWwocHJldmlvdXNOZXN0ZWRWYWx1ZSwgdmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgRG90dGllLnNldCh0aGlzLmRhdGFWYWx1ZXMsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgIHRoaXMuY2hhbmdlZChrZXkuc3BsaXQoJy4nKVswXSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgYXR0ZW1wdGluZyB0byBzZXQgcHJpbWFyeSBrZXkgYW5kIHByaW1hcnkga2V5IGlzIGFscmVhZHkgZGVmaW5lZCwgcmV0dXJuXHJcbiAgICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuX2hhc1ByaW1hcnlLZXlzICYmIG9yaWdpbmFsVmFsdWUgJiYgdGhpcy5jb25zdHJ1Y3Rvci5faXNQcmltYXJ5S2V5KGtleSkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgYXR0ZW1wdGluZyB0byBzZXQgcmVhZCBvbmx5IGF0dHJpYnV0ZXMsIHJldHVyblxyXG4gICAgICAgIGlmICghdGhpcy5pc05ld1JlY29yZCAmJiB0aGlzLmNvbnN0cnVjdG9yLl9oYXNSZWFkT25seUF0dHJpYnV0ZXMgJiYgdGhpcy5jb25zdHJ1Y3Rvci5fcmVhZE9ubHlBdHRyaWJ1dGVzLmhhcyhrZXkpKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIHRoZXJlJ3MgYSBkYXRhIHR5cGUgc2FuaXRpemVyXHJcbiAgICAgIGlmIChcclxuICAgICAgICAhKHZhbHVlIGluc3RhbmNlb2YgVXRpbHMuU2VxdWVsaXplTWV0aG9kKVxyXG4gICAgICAgICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmNvbnN0cnVjdG9yLl9kYXRhVHlwZVNhbml0aXplcnMsIGtleSlcclxuICAgICAgKSB7XHJcbiAgICAgICAgdmFsdWUgPSB0aGlzLmNvbnN0cnVjdG9yLl9kYXRhVHlwZVNhbml0aXplcnNba2V5XS5jYWxsKHRoaXMsIHZhbHVlLCBvcHRpb25zKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU2V0IHdoZW4gdGhlIHZhbHVlIGhhcyBjaGFuZ2VkIGFuZCBub3QgcmF3XHJcbiAgICAgIGlmIChcclxuICAgICAgICAhb3B0aW9ucy5yYXcgJiZcclxuICAgICAgICAoXHJcbiAgICAgICAgICAvLyBUcnVlIHdoZW4gc2VxdWVsaXplIG1ldGhvZFxyXG4gICAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiBVdGlscy5TZXF1ZWxpemVNZXRob2QgfHxcclxuICAgICAgICAgIC8vIENoZWNrIGZvciBkYXRhIHR5cGUgdHlwZSBjb21wYXJhdG9yc1xyXG4gICAgICAgICAgISh2YWx1ZSBpbnN0YW5jZW9mIFV0aWxzLlNlcXVlbGl6ZU1ldGhvZCkgJiYgdGhpcy5jb25zdHJ1Y3Rvci5fZGF0YVR5cGVDaGFuZ2VzW2tleV0gJiYgdGhpcy5jb25zdHJ1Y3Rvci5fZGF0YVR5cGVDaGFuZ2VzW2tleV0uY2FsbCh0aGlzLCB2YWx1ZSwgb3JpZ2luYWxWYWx1ZSwgb3B0aW9ucykgfHxcclxuICAgICAgICAgIC8vIENoZWNrIGRlZmF1bHRcclxuICAgICAgICAgICF0aGlzLmNvbnN0cnVjdG9yLl9kYXRhVHlwZUNoYW5nZXNba2V5XSAmJiAoIVV0aWxzLmlzUHJpbWl0aXZlKHZhbHVlKSAmJiB2YWx1ZSAhPT0gbnVsbCB8fCB2YWx1ZSAhPT0gb3JpZ2luYWxWYWx1ZSlcclxuICAgICAgICApXHJcbiAgICAgICkge1xyXG4gICAgICAgIHRoaXMuX3ByZXZpb3VzRGF0YVZhbHVlc1trZXldID0gb3JpZ2luYWxWYWx1ZTtcclxuICAgICAgICB0aGlzLmNoYW5nZWQoa2V5LCB0cnVlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc2V0IGRhdGEgdmFsdWVcclxuICAgICAgdGhpcy5kYXRhVmFsdWVzW2tleV0gPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgc2V0QXR0cmlidXRlcyh1cGRhdGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zZXQodXBkYXRlcyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJZiBjaGFuZ2VkIGlzIGNhbGxlZCB3aXRoIGEgc3RyaW5nIGl0IHdpbGwgcmV0dXJuIGEgYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHZhbHVlIG9mIHRoYXQga2V5IGluIGBkYXRhVmFsdWVzYCBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgdmFsdWUgaW4gYF9wcmV2aW91c0RhdGFWYWx1ZXNgLlxyXG4gICAqXHJcbiAgICogSWYgY2hhbmdlZCBpcyBjYWxsZWQgd2l0aG91dCBhbiBhcmd1bWVudCwgaXQgd2lsbCByZXR1cm4gYW4gYXJyYXkgb2Yga2V5cyB0aGF0IGhhdmUgY2hhbmdlZC5cclxuICAgKlxyXG4gICAqIElmIGNoYW5nZWQgaXMgY2FsbGVkIHdpdGhvdXQgYW4gYXJndW1lbnQgYW5kIG5vIGtleXMgaGF2ZSBjaGFuZ2VkLCBpdCB3aWxsIHJldHVybiBgZmFsc2VgLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtrZXldIGtleSB0byBjaGVjayBvciBjaGFuZ2Ugc3RhdHVzIG9mXHJcbiAgICogQHBhcmFtIHthbnl9IFt2YWx1ZV0gdmFsdWUgdG8gc2V0XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbnxBcnJheX1cclxuICAgKi9cclxuICBjaGFuZ2VkKGtleSwgdmFsdWUpIHtcclxuICAgIGlmIChrZXkpIHtcclxuICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aGlzLl9jaGFuZ2VkW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcy5fY2hhbmdlZFtrZXldIHx8IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNoYW5nZWQgPSBPYmplY3Qua2V5cyh0aGlzLmRhdGFWYWx1ZXMpLmZpbHRlcihrZXkgPT4gdGhpcy5jaGFuZ2VkKGtleSkpO1xyXG5cclxuICAgIHJldHVybiBjaGFuZ2VkLmxlbmd0aCA/IGNoYW5nZWQgOiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHByZXZpb3VzIHZhbHVlIGZvciBrZXkgZnJvbSBgX3ByZXZpb3VzRGF0YVZhbHVlc2AuXHJcbiAgICpcclxuICAgKiBJZiBjYWxsZWQgd2l0aG91dCBhIGtleSwgcmV0dXJucyB0aGUgcHJldmlvdXMgdmFsdWVzIGZvciBhbGwgdmFsdWVzIHdoaWNoIGhhdmUgY2hhbmdlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtrZXldIGtleSB0byBnZXQgcHJldmlvdXMgdmFsdWUgb2ZcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHthbnl8QXJyYXk8YW55Pn1cclxuICAgKi9cclxuICBwcmV2aW91cyhrZXkpIHtcclxuICAgIGlmIChrZXkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3ByZXZpb3VzRGF0YVZhbHVlc1trZXldO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBfLnBpY2tCeSh0aGlzLl9wcmV2aW91c0RhdGFWYWx1ZXMsICh2YWx1ZSwga2V5KSA9PiB0aGlzLmNoYW5nZWQoa2V5KSk7XHJcbiAgfVxyXG5cclxuICBfc2V0SW5jbHVkZShrZXksIHZhbHVlLCBvcHRpb25zKSB7XHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSB2YWx1ZSA9IFt2YWx1ZV07XHJcbiAgICBpZiAodmFsdWVbMF0gaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICB2YWx1ZSA9IHZhbHVlLm1hcChpbnN0YW5jZSA9PiBpbnN0YW5jZS5kYXRhVmFsdWVzKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbmNsdWRlID0gdGhpcy5fb3B0aW9ucy5pbmNsdWRlTWFwW2tleV07XHJcbiAgICBjb25zdCBhc3NvY2lhdGlvbiA9IGluY2x1ZGUuYXNzb2NpYXRpb247XHJcbiAgICBjb25zdCBhY2Nlc3NvciA9IGtleTtcclxuICAgIGNvbnN0IHByaW1hcnlLZXlBdHRyaWJ1dGUgPSBpbmNsdWRlLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGU7XHJcbiAgICBjb25zdCBjaGlsZE9wdGlvbnMgPSB7XHJcbiAgICAgIGlzTmV3UmVjb3JkOiB0aGlzLmlzTmV3UmVjb3JkLFxyXG4gICAgICBpbmNsdWRlOiBpbmNsdWRlLmluY2x1ZGUsXHJcbiAgICAgIGluY2x1ZGVOYW1lczogaW5jbHVkZS5pbmNsdWRlTmFtZXMsXHJcbiAgICAgIGluY2x1ZGVNYXA6IGluY2x1ZGUuaW5jbHVkZU1hcCxcclxuICAgICAgaW5jbHVkZVZhbGlkYXRlZDogdHJ1ZSxcclxuICAgICAgcmF3OiBvcHRpb25zLnJhdyxcclxuICAgICAgYXR0cmlidXRlczogaW5jbHVkZS5vcmlnaW5hbEF0dHJpYnV0ZXNcclxuICAgIH07XHJcbiAgICBsZXQgaXNFbXB0eTtcclxuXHJcbiAgICBpZiAoaW5jbHVkZS5vcmlnaW5hbEF0dHJpYnV0ZXMgPT09IHVuZGVmaW5lZCB8fCBpbmNsdWRlLm9yaWdpbmFsQXR0cmlidXRlcy5sZW5ndGgpIHtcclxuICAgICAgaWYgKGFzc29jaWF0aW9uLmlzU2luZ2xlQXNzb2NpYXRpb24pIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgIHZhbHVlID0gdmFsdWVbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlzRW1wdHkgPSB2YWx1ZSAmJiB2YWx1ZVtwcmltYXJ5S2V5QXR0cmlidXRlXSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gbnVsbDtcclxuICAgICAgICB0aGlzW2FjY2Vzc29yXSA9IHRoaXMuZGF0YVZhbHVlc1thY2Nlc3Nvcl0gPSBpc0VtcHR5ID8gbnVsbCA6IGluY2x1ZGUubW9kZWwuYnVpbGQodmFsdWUsIGNoaWxkT3B0aW9ucyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaXNFbXB0eSA9IHZhbHVlWzBdICYmIHZhbHVlWzBdW3ByaW1hcnlLZXlBdHRyaWJ1dGVdID09PSBudWxsO1xyXG4gICAgICAgIHRoaXNbYWNjZXNzb3JdID0gdGhpcy5kYXRhVmFsdWVzW2FjY2Vzc29yXSA9IGlzRW1wdHkgPyBbXSA6IGluY2x1ZGUubW9kZWwuYnVsa0J1aWxkKHZhbHVlLCBjaGlsZE9wdGlvbnMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBWYWxpZGF0ZSB0aGlzIGluc3RhbmNlLCBhbmQgaWYgdGhlIHZhbGlkYXRpb24gcGFzc2VzLCBwZXJzaXN0IGl0IHRvIHRoZSBkYXRhYmFzZS4gSXQgd2lsbCBvbmx5IHNhdmUgY2hhbmdlZCBmaWVsZHMsIGFuZCBkbyBub3RoaW5nIGlmIG5vIGZpZWxkcyBoYXZlIGNoYW5nZWQuXHJcbiAgICpcclxuICAgKiBPbiBzdWNjZXNzLCB0aGUgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgd2l0aCB0aGlzIGluc3RhbmNlLiBPbiB2YWxpZGF0aW9uIGVycm9yLCB0aGUgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgd2l0aCBhbiBpbnN0YW5jZSBvZiBgU2VxdWVsaXplLlZhbGlkYXRpb25FcnJvcmAuXHJcbiAgICogVGhpcyBlcnJvciB3aWxsIGhhdmUgYSBwcm9wZXJ0eSBmb3IgZWFjaCBvZiB0aGUgZmllbGRzIGZvciB3aGljaCB2YWxpZGF0aW9uIGZhaWxlZCwgd2l0aCB0aGUgZXJyb3IgbWVzc2FnZSBmb3IgdGhhdCBmaWVsZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIFtvcHRpb25zXSBzYXZlIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSAgICBbb3B0aW9ucy5maWVsZHNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIHN0cmluZ3MsIHJlcHJlc2VudGluZyBkYXRhYmFzZSBjb2x1bW5zLiBJZiBmaWVsZHMgaXMgcHJvdmlkZWQsIG9ubHkgdGhvc2UgY29sdW1ucyB3aWxsIGJlIHZhbGlkYXRlZCBhbmQgc2F2ZWQuXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgW29wdGlvbnMuc2lsZW50PWZhbHNlXSBJZiB0cnVlLCB0aGUgdXBkYXRlZEF0IHRpbWVzdGFtcCB3aWxsIG5vdCBiZSB1cGRhdGVkLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgIFtvcHRpb25zLnZhbGlkYXRlPXRydWVdIElmIGZhbHNlLCB2YWxpZGF0aW9ucyB3b24ndCBiZSBydW4uXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgW29wdGlvbnMuaG9va3M9dHJ1ZV0gUnVuIGJlZm9yZSBhbmQgYWZ0ZXIgY3JlYXRlIC8gdXBkYXRlICsgdmFsaWRhdGUgaG9va3NcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGlsZSBydW5uaW5nIHRoZSBxdWVyeSB0byBsb2cgdGhlIHNxbC5cclxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgIFtvcHRpb25zLnJldHVybmluZ10gQXBwZW5kIFJFVFVSTklORyAqIHRvIGdldCBiYWNrIGF1dG8gZ2VuZXJhdGVkIHZhbHVlcyAoUG9zdGdyZXMgb25seSlcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsPn1cclxuICAgKi9cclxuICBzYXZlKG9wdGlvbnMpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzZWNvbmQgYXJndW1lbnQgd2FzIHJlbW92ZWQgaW4gZmF2b3Igb2YgdGhlIG9wdGlvbnMgb2JqZWN0LicpO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcbiAgICBvcHRpb25zID0gXy5kZWZhdWx0cyhvcHRpb25zLCB7XHJcbiAgICAgIGhvb2tzOiB0cnVlLFxyXG4gICAgICB2YWxpZGF0ZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCFvcHRpb25zLmZpZWxkcykge1xyXG4gICAgICBpZiAodGhpcy5pc05ld1JlY29yZCkge1xyXG4gICAgICAgIG9wdGlvbnMuZmllbGRzID0gT2JqZWN0LmtleXModGhpcy5jb25zdHJ1Y3Rvci5yYXdBdHRyaWJ1dGVzKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBvcHRpb25zLmZpZWxkcyA9IF8uaW50ZXJzZWN0aW9uKHRoaXMuY2hhbmdlZCgpLCBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXMpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgb3B0aW9ucy5kZWZhdWx0RmllbGRzID0gb3B0aW9ucy5maWVsZHM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMucmV0dXJuaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgaWYgKG9wdGlvbnMuYXNzb2NpYXRpb24pIHtcclxuICAgICAgICBvcHRpb25zLnJldHVybmluZyA9IGZhbHNlO1xyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNOZXdSZWNvcmQpIHtcclxuICAgICAgICBvcHRpb25zLnJldHVybmluZyA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwcmltYXJ5S2V5TmFtZSA9IHRoaXMuY29uc3RydWN0b3IucHJpbWFyeUtleUF0dHJpYnV0ZTtcclxuICAgIGNvbnN0IHByaW1hcnlLZXlBdHRyaWJ1dGUgPSBwcmltYXJ5S2V5TmFtZSAmJiB0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXNbcHJpbWFyeUtleU5hbWVdO1xyXG4gICAgY29uc3QgY3JlYXRlZEF0QXR0ciA9IHRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuY3JlYXRlZEF0O1xyXG4gICAgY29uc3QgdmVyc2lvbkF0dHIgPSB0aGlzLmNvbnN0cnVjdG9yLl92ZXJzaW9uQXR0cmlidXRlO1xyXG4gICAgY29uc3QgaG9vayA9IHRoaXMuaXNOZXdSZWNvcmQgPyAnQ3JlYXRlJyA6ICdVcGRhdGUnO1xyXG4gICAgY29uc3Qgd2FzTmV3UmVjb3JkID0gdGhpcy5pc05ld1JlY29yZDtcclxuICAgIGNvbnN0IG5vdyA9IFV0aWxzLm5vdyh0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmRpYWxlY3QpO1xyXG4gICAgbGV0IHVwZGF0ZWRBdEF0dHIgPSB0aGlzLmNvbnN0cnVjdG9yLl90aW1lc3RhbXBBdHRyaWJ1dGVzLnVwZGF0ZWRBdDtcclxuXHJcbiAgICBpZiAodXBkYXRlZEF0QXR0ciAmJiBvcHRpb25zLmZpZWxkcy5sZW5ndGggPj0gMSAmJiAhb3B0aW9ucy5maWVsZHMuaW5jbHVkZXModXBkYXRlZEF0QXR0cikpIHtcclxuICAgICAgb3B0aW9ucy5maWVsZHMucHVzaCh1cGRhdGVkQXRBdHRyKTtcclxuICAgIH1cclxuICAgIGlmICh2ZXJzaW9uQXR0ciAmJiBvcHRpb25zLmZpZWxkcy5sZW5ndGggPj0gMSAmJiAhb3B0aW9ucy5maWVsZHMuaW5jbHVkZXModmVyc2lvbkF0dHIpKSB7XHJcbiAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2godmVyc2lvbkF0dHIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnNpbGVudCA9PT0gdHJ1ZSAmJiAhKHRoaXMuaXNOZXdSZWNvcmQgJiYgdGhpcy5nZXQodXBkYXRlZEF0QXR0ciwgeyByYXc6IHRydWUgfSkpKSB7XHJcbiAgICAgIC8vIFVwZGF0ZUF0QXR0ciBtaWdodCBoYXZlIGJlZW4gYWRkZWQgYXMgYSByZXN1bHQgb2YgT2JqZWN0LmtleXMoTW9kZWwucmF3QXR0cmlidXRlcykuIEluIHRoYXQgY2FzZSB3ZSBoYXZlIHRvIHJlbW92ZSBpdCBhZ2FpblxyXG4gICAgICBfLnJlbW92ZShvcHRpb25zLmZpZWxkcywgdmFsID0+IHZhbCA9PT0gdXBkYXRlZEF0QXR0cik7XHJcbiAgICAgIHVwZGF0ZWRBdEF0dHIgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5pc05ld1JlY29yZCA9PT0gdHJ1ZSkge1xyXG4gICAgICBpZiAoY3JlYXRlZEF0QXR0ciAmJiAhb3B0aW9ucy5maWVsZHMuaW5jbHVkZXMoY3JlYXRlZEF0QXR0cikpIHtcclxuICAgICAgICBvcHRpb25zLmZpZWxkcy5wdXNoKGNyZWF0ZWRBdEF0dHIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocHJpbWFyeUtleUF0dHJpYnV0ZSAmJiBwcmltYXJ5S2V5QXR0cmlidXRlLmRlZmF1bHRWYWx1ZSAmJiAhb3B0aW9ucy5maWVsZHMuaW5jbHVkZXMocHJpbWFyeUtleU5hbWUpKSB7XHJcbiAgICAgICAgb3B0aW9ucy5maWVsZHMudW5zaGlmdChwcmltYXJ5S2V5TmFtZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5pc05ld1JlY29yZCA9PT0gZmFsc2UpIHtcclxuICAgICAgaWYgKHByaW1hcnlLZXlOYW1lICYmIHRoaXMuZ2V0KHByaW1hcnlLZXlOYW1lLCB7IHJhdzogdHJ1ZSB9KSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgYXR0ZW1wdGVkIHRvIHNhdmUgYW4gaW5zdGFuY2Ugd2l0aCBubyBwcmltYXJ5IGtleSwgdGhpcyBpcyBub3QgYWxsb3dlZCBzaW5jZSBpdCB3b3VsZCByZXN1bHQgaW4gYSBnbG9iYWwgdXBkYXRlJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodXBkYXRlZEF0QXR0ciAmJiAhb3B0aW9ucy5zaWxlbnQgJiYgb3B0aW9ucy5maWVsZHMuaW5jbHVkZXModXBkYXRlZEF0QXR0cikpIHtcclxuICAgICAgdGhpcy5kYXRhVmFsdWVzW3VwZGF0ZWRBdEF0dHJdID0gdGhpcy5jb25zdHJ1Y3Rvci5fZ2V0RGVmYXVsdFRpbWVzdGFtcCh1cGRhdGVkQXRBdHRyKSB8fCBub3c7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuaXNOZXdSZWNvcmQgJiYgY3JlYXRlZEF0QXR0ciAmJiAhdGhpcy5kYXRhVmFsdWVzW2NyZWF0ZWRBdEF0dHJdKSB7XHJcbiAgICAgIHRoaXMuZGF0YVZhbHVlc1tjcmVhdGVkQXRBdHRyXSA9IHRoaXMuY29uc3RydWN0b3IuX2dldERlZmF1bHRUaW1lc3RhbXAoY3JlYXRlZEF0QXR0cikgfHwgbm93O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XHJcbiAgICAgIC8vIFZhbGlkYXRlXHJcbiAgICAgIGlmIChvcHRpb25zLnZhbGlkYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGUob3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICAvLyBSdW4gYmVmb3JlIGhvb2tcclxuICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcclxuICAgICAgICBjb25zdCBiZWZvcmVIb29rVmFsdWVzID0gXy5waWNrKHRoaXMuZGF0YVZhbHVlcywgb3B0aW9ucy5maWVsZHMpO1xyXG4gICAgICAgIGxldCBpZ25vcmVDaGFuZ2VkID0gXy5kaWZmZXJlbmNlKHRoaXMuY2hhbmdlZCgpLCBvcHRpb25zLmZpZWxkcyk7IC8vIEluIGNhc2Ugb2YgdXBkYXRlIHdoZXJlIGl0J3Mgb25seSBzdXBwb3NlZCB0byB1cGRhdGUgdGhlIHBhc3NlZCB2YWx1ZXMgYW5kIHRoZSBob29rIHZhbHVlc1xyXG4gICAgICAgIGxldCBob29rQ2hhbmdlZDtcclxuICAgICAgICBsZXQgYWZ0ZXJIb29rVmFsdWVzO1xyXG5cclxuICAgICAgICBpZiAodXBkYXRlZEF0QXR0ciAmJiBvcHRpb25zLmZpZWxkcy5pbmNsdWRlcyh1cGRhdGVkQXRBdHRyKSkge1xyXG4gICAgICAgICAgaWdub3JlQ2hhbmdlZCA9IF8ud2l0aG91dChpZ25vcmVDaGFuZ2VkLCB1cGRhdGVkQXRBdHRyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnJ1bkhvb2tzKGBiZWZvcmUke2hvb2t9YCwgdGhpcywgb3B0aW9ucylcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZGVmYXVsdEZpZWxkcyAmJiAhdGhpcy5pc05ld1JlY29yZCkge1xyXG4gICAgICAgICAgICAgIGFmdGVySG9va1ZhbHVlcyA9IF8ucGljayh0aGlzLmRhdGFWYWx1ZXMsIF8uZGlmZmVyZW5jZSh0aGlzLmNoYW5nZWQoKSwgaWdub3JlQ2hhbmdlZCkpO1xyXG5cclxuICAgICAgICAgICAgICBob29rQ2hhbmdlZCA9IFtdO1xyXG4gICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGFmdGVySG9va1ZhbHVlcykpIHtcclxuICAgICAgICAgICAgICAgIGlmIChhZnRlckhvb2tWYWx1ZXNba2V5XSAhPT0gYmVmb3JlSG9va1ZhbHVlc1trZXldKSB7XHJcbiAgICAgICAgICAgICAgICAgIGhvb2tDaGFuZ2VkLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIG9wdGlvbnMuZmllbGRzID0gXy51bmlxKG9wdGlvbnMuZmllbGRzLmNvbmNhdChob29rQ2hhbmdlZCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaG9va0NoYW5nZWQpIHtcclxuICAgICAgICAgICAgICBpZiAob3B0aW9ucy52YWxpZGF0ZSkge1xyXG4gICAgICAgICAgICAgIC8vIFZhbGlkYXRlIGFnYWluXHJcblxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5za2lwID0gXy5kaWZmZXJlbmNlKE9iamVjdC5rZXlzKHRoaXMuY29uc3RydWN0b3IucmF3QXR0cmlidXRlcyksIGhvb2tDaGFuZ2VkKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlKG9wdGlvbnMpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBkZWxldGUgb3B0aW9ucy5za2lwO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgIGlmICghb3B0aW9ucy5maWVsZHMubGVuZ3RoKSByZXR1cm4gdGhpcztcclxuICAgICAgaWYgKCF0aGlzLmlzTmV3UmVjb3JkKSByZXR1cm4gdGhpcztcclxuICAgICAgaWYgKCF0aGlzLl9vcHRpb25zLmluY2x1ZGUgfHwgIXRoaXMuX29wdGlvbnMuaW5jbHVkZS5sZW5ndGgpIHJldHVybiB0aGlzO1xyXG5cclxuICAgICAgLy8gTmVzdGVkIGNyZWF0aW9uIGZvciBCZWxvbmdzVG8gcmVsYXRpb25zXHJcbiAgICAgIHJldHVybiBQcm9taXNlLm1hcCh0aGlzLl9vcHRpb25zLmluY2x1ZGUuZmlsdGVyKGluY2x1ZGUgPT4gaW5jbHVkZS5hc3NvY2lhdGlvbiBpbnN0YW5jZW9mIEJlbG9uZ3NUbyksIGluY2x1ZGUgPT4ge1xyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5nZXQoaW5jbHVkZS5hcyk7XHJcbiAgICAgICAgaWYgKCFpbnN0YW5jZSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBpbmNsdWRlT3B0aW9ucyA9IF8oVXRpbHMuY2xvbmVEZWVwKGluY2x1ZGUpKVxyXG4gICAgICAgICAgLm9taXQoWydhc3NvY2lhdGlvbiddKVxyXG4gICAgICAgICAgLmRlZmF1bHRzKHtcclxuICAgICAgICAgICAgdHJhbnNhY3Rpb246IG9wdGlvbnMudHJhbnNhY3Rpb24sXHJcbiAgICAgICAgICAgIGxvZ2dpbmc6IG9wdGlvbnMubG9nZ2luZyxcclxuICAgICAgICAgICAgcGFyZW50UmVjb3JkOiB0aGlzXHJcbiAgICAgICAgICB9KS52YWx1ZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gaW5zdGFuY2Uuc2F2ZShpbmNsdWRlT3B0aW9ucykudGhlbigoKSA9PiB0aGlzW2luY2x1ZGUuYXNzb2NpYXRpb24uYWNjZXNzb3JzLnNldF0oaW5zdGFuY2UsIHsgc2F2ZTogZmFsc2UsIGxvZ2dpbmc6IG9wdGlvbnMubG9nZ2luZyB9KSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlYWxGaWVsZHMgPSBvcHRpb25zLmZpZWxkcy5maWx0ZXIoZmllbGQgPT4gIXRoaXMuY29uc3RydWN0b3IuX3ZpcnR1YWxBdHRyaWJ1dGVzLmhhcyhmaWVsZCkpO1xyXG4gICAgICBpZiAoIXJlYWxGaWVsZHMubGVuZ3RoKSByZXR1cm4gdGhpcztcclxuICAgICAgaWYgKCF0aGlzLmNoYW5nZWQoKSAmJiAhdGhpcy5pc05ld1JlY29yZCkgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgICBjb25zdCB2ZXJzaW9uRmllbGROYW1lID0gXy5nZXQodGhpcy5jb25zdHJ1Y3Rvci5yYXdBdHRyaWJ1dGVzW3ZlcnNpb25BdHRyXSwgJ2ZpZWxkJykgfHwgdmVyc2lvbkF0dHI7XHJcbiAgICAgIGxldCB2YWx1ZXMgPSBVdGlscy5tYXBWYWx1ZUZpZWxkTmFtZXModGhpcy5kYXRhVmFsdWVzLCBvcHRpb25zLmZpZWxkcywgdGhpcy5jb25zdHJ1Y3Rvcik7XHJcbiAgICAgIGxldCBxdWVyeSA9IG51bGw7XHJcbiAgICAgIGxldCBhcmdzID0gW107XHJcbiAgICAgIGxldCB3aGVyZTtcclxuXHJcbiAgICAgIGlmICh0aGlzLmlzTmV3UmVjb3JkKSB7XHJcbiAgICAgICAgcXVlcnkgPSAnaW5zZXJ0JztcclxuICAgICAgICBhcmdzID0gW3RoaXMsIHRoaXMuY29uc3RydWN0b3IuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCB2YWx1ZXMsIG9wdGlvbnNdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHdoZXJlID0gdGhpcy53aGVyZSh0cnVlKTtcclxuICAgICAgICBpZiAodmVyc2lvbkF0dHIpIHtcclxuICAgICAgICAgIHZhbHVlc1t2ZXJzaW9uRmllbGROYW1lXSA9IHBhcnNlSW50KHZhbHVlc1t2ZXJzaW9uRmllbGROYW1lXSwgMTApICsgMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcXVlcnkgPSAndXBkYXRlJztcclxuICAgICAgICBhcmdzID0gW3RoaXMsIHRoaXMuY29uc3RydWN0b3IuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCB2YWx1ZXMsIHdoZXJlLCBvcHRpb25zXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuUXVlcnlJbnRlcmZhY2VbcXVlcnldKC4uLmFyZ3MpXHJcbiAgICAgICAgLnRoZW4oKFtyZXN1bHQsIHJvd3NVcGRhdGVkXSk9PiB7XHJcbiAgICAgICAgICBpZiAodmVyc2lvbkF0dHIpIHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIHRoYXQgYSByb3cgd2FzIHVwZGF0ZWQsIG90aGVyd2lzZSBpdCdzIGFuIG9wdGltaXN0aWMgbG9ja2luZyBlcnJvci5cclxuICAgICAgICAgICAgaWYgKHJvd3NVcGRhdGVkIDwgMSkge1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBzZXF1ZWxpemVFcnJvcnMuT3B0aW1pc3RpY0xvY2tFcnJvcih7XHJcbiAgICAgICAgICAgICAgICBtb2RlbE5hbWU6IHRoaXMuY29uc3RydWN0b3IubmFtZSxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyxcclxuICAgICAgICAgICAgICAgIHdoZXJlXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmVzdWx0LmRhdGFWYWx1ZXNbdmVyc2lvbkF0dHJdID0gdmFsdWVzW3ZlcnNpb25GaWVsZE5hbWVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gVHJhbnNmZXIgZGF0YWJhc2UgZ2VuZXJhdGVkIHZhbHVlcyAoZGVmYXVsdHMsIGF1dG9pbmNyZW1lbnQsIGV0YylcclxuICAgICAgICAgIGZvciAoY29uc3QgYXR0ciBvZiBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXMpKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGQgJiZcclxuICAgICAgICAgICAgICAgIHZhbHVlc1t0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXNbYXR0cl0uZmllbGRdICE9PSB1bmRlZmluZWQgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuY29uc3RydWN0b3IucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZCAhPT0gYXR0clxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICB2YWx1ZXNbYXR0cl0gPSB2YWx1ZXNbdGhpcy5jb25zdHJ1Y3Rvci5yYXdBdHRyaWJ1dGVzW2F0dHJdLmZpZWxkXTtcclxuICAgICAgICAgICAgICBkZWxldGUgdmFsdWVzW3RoaXMuY29uc3RydWN0b3IucmF3QXR0cmlidXRlc1thdHRyXS5maWVsZF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHZhbHVlcyA9IE9iamVjdC5hc3NpZ24odmFsdWVzLCByZXN1bHQuZGF0YVZhbHVlcyk7XHJcblxyXG4gICAgICAgICAgcmVzdWx0LmRhdGFWYWx1ZXMgPSBPYmplY3QuYXNzaWduKHJlc3VsdC5kYXRhVmFsdWVzLCB2YWx1ZXMpO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50YXAoKCkgPT4ge1xyXG4gICAgICAgICAgaWYgKCF3YXNOZXdSZWNvcmQpIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgaWYgKCF0aGlzLl9vcHRpb25zLmluY2x1ZGUgfHwgIXRoaXMuX29wdGlvbnMuaW5jbHVkZS5sZW5ndGgpIHJldHVybiB0aGlzO1xyXG5cclxuICAgICAgICAgIC8vIE5lc3RlZCBjcmVhdGlvbiBmb3IgSGFzT25lL0hhc01hbnkvQmVsb25nc1RvTWFueSByZWxhdGlvbnNcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLm1hcCh0aGlzLl9vcHRpb25zLmluY2x1ZGUuZmlsdGVyKGluY2x1ZGUgPT4gIShpbmNsdWRlLmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvIHx8XHJcbiAgICAgICAgICAgIGluY2x1ZGUucGFyZW50ICYmIGluY2x1ZGUucGFyZW50LmFzc29jaWF0aW9uIGluc3RhbmNlb2YgQmVsb25nc1RvTWFueSkpLCBpbmNsdWRlID0+IHtcclxuICAgICAgICAgICAgbGV0IGluc3RhbmNlcyA9IHRoaXMuZ2V0KGluY2x1ZGUuYXMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFpbnN0YW5jZXMpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGluc3RhbmNlcykpIGluc3RhbmNlcyA9IFtpbnN0YW5jZXNdO1xyXG4gICAgICAgICAgICBpZiAoIWluc3RhbmNlcy5sZW5ndGgpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGluY2x1ZGVPcHRpb25zID0gXyhVdGlscy5jbG9uZURlZXAoaW5jbHVkZSkpXHJcbiAgICAgICAgICAgICAgLm9taXQoWydhc3NvY2lhdGlvbiddKVxyXG4gICAgICAgICAgICAgIC5kZWZhdWx0cyh7XHJcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbjogb3B0aW9ucy50cmFuc2FjdGlvbixcclxuICAgICAgICAgICAgICAgIGxvZ2dpbmc6IG9wdGlvbnMubG9nZ2luZyxcclxuICAgICAgICAgICAgICAgIHBhcmVudFJlY29yZDogdGhpc1xyXG4gICAgICAgICAgICAgIH0pLnZhbHVlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnN0YW5jZXMgd2lsbCBiZSB1cGRhdGVkIGluIHBsYWNlIHNvIHdlIGNhbiBzYWZlbHkgdHJlYXQgSGFzT25lIGxpa2UgYSBIYXNNYW55XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLm1hcChpbnN0YW5jZXMsIGluc3RhbmNlID0+IHtcclxuICAgICAgICAgICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbiBpbnN0YW5jZW9mIEJlbG9uZ3NUb01hbnkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZS5zYXZlKGluY2x1ZGVPcHRpb25zKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWVzID0ge307XHJcbiAgICAgICAgICAgICAgICAgIHZhbHVlc1tpbmNsdWRlLmFzc29jaWF0aW9uLmZvcmVpZ25LZXldID0gdGhpcy5nZXQodGhpcy5jb25zdHJ1Y3Rvci5wcmltYXJ5S2V5QXR0cmlidXRlLCB7IHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgdmFsdWVzW2luY2x1ZGUuYXNzb2NpYXRpb24ub3RoZXJLZXldID0gaW5zdGFuY2UuZ2V0KGluc3RhbmNlLmNvbnN0cnVjdG9yLnByaW1hcnlLZXlBdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gSW5jbHVkZSB2YWx1ZXMgZGVmaW5lZCBpbiB0aGUgYXNzb2NpYXRpb25cclxuICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih2YWx1ZXMsIGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5zY29wZSk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZVtpbmNsdWRlLmFzc29jaWF0aW9uLnRocm91Z2gubW9kZWwubmFtZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGF0dHIgb2YgT2JqZWN0LmtleXMoaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cl0uX2F1dG9HZW5lcmF0ZWQgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0ciA9PT0gaW5jbHVkZS5hc3NvY2lhdGlvbi5mb3JlaWduS2V5IHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHIgPT09IGluY2x1ZGUuYXNzb2NpYXRpb24ub3RoZXJLZXkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGluc3RhbmNlW2luY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5uYW1lXVthdHRyXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWVzW2F0dHJdID0gaW5zdGFuY2VbaW5jbHVkZS5hc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLm5hbWVdW2F0dHJdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGluY2x1ZGUuYXNzb2NpYXRpb24udGhyb3VnaE1vZGVsLmNyZWF0ZSh2YWx1ZXMsIGluY2x1ZGVPcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpbnN0YW5jZS5zZXQoaW5jbHVkZS5hc3NvY2lhdGlvbi5mb3JlaWduS2V5LCB0aGlzLmdldChpbmNsdWRlLmFzc29jaWF0aW9uLnNvdXJjZUtleSB8fCB0aGlzLmNvbnN0cnVjdG9yLnByaW1hcnlLZXlBdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pLCB7IHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGluc3RhbmNlLCBpbmNsdWRlLmFzc29jaWF0aW9uLnNjb3BlKTtcclxuICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2Uuc2F2ZShpbmNsdWRlT3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGFwKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAvLyBSdW4gYWZ0ZXIgaG9va1xyXG4gICAgICAgICAgaWYgKG9wdGlvbnMuaG9va3MpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IucnVuSG9va3MoYGFmdGVyJHtob29rfWAsIHJlc3VsdCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgZm9yIChjb25zdCBmaWVsZCBvZiBvcHRpb25zLmZpZWxkcykge1xyXG4gICAgICAgICAgICByZXN1bHQuX3ByZXZpb3VzRGF0YVZhbHVlc1tmaWVsZF0gPSByZXN1bHQuZGF0YVZhbHVlc1tmaWVsZF07XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlZChmaWVsZCwgZmFsc2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy5pc05ld1JlY29yZCA9IGZhbHNlO1xyXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVmcmVzaCB0aGUgY3VycmVudCBpbnN0YW5jZSBpbi1wbGFjZSwgaS5lLiB1cGRhdGUgdGhlIG9iamVjdCB3aXRoIGN1cnJlbnQgZGF0YSBmcm9tIHRoZSBEQiBhbmQgcmV0dXJuIHRoZSBzYW1lIG9iamVjdC5cclxuICAgKiBUaGlzIGlzIGRpZmZlcmVudCBmcm9tIGRvaW5nIGEgYGZpbmQoSW5zdGFuY2UuaWQpYCwgYmVjYXVzZSB0aGF0IHdvdWxkIGNyZWF0ZSBhbmQgcmV0dXJuIGEgbmV3IGluc3RhbmNlLiBXaXRoIHRoaXMgbWV0aG9kLFxyXG4gICAqIGFsbCByZWZlcmVuY2VzIHRvIHRoZSBJbnN0YW5jZSBhcmUgdXBkYXRlZCB3aXRoIHRoZSBuZXcgZGF0YSBhbmQgbm8gbmV3IG9iamVjdHMgYXJlIGNyZWF0ZWQuXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIG9uIHRvIGBNb2RlbC5maW5kYFxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmxvZ2dpbmc9ZmFsc2VdIEEgZnVuY3Rpb24gdGhhdCBnZXRzIGV4ZWN1dGVkIHdoaWxlIHJ1bm5pbmcgdGhlIHF1ZXJ5IHRvIGxvZyB0aGUgc3FsLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWw+fVxyXG4gICAqL1xyXG4gIHJlbG9hZChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gVXRpbHMuZGVmYXVsdHMoe30sIG9wdGlvbnMsIHtcclxuICAgICAgd2hlcmU6IHRoaXMud2hlcmUoKSxcclxuICAgICAgaW5jbHVkZTogdGhpcy5fb3B0aW9ucy5pbmNsdWRlIHx8IG51bGxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmZpbmRPbmUob3B0aW9ucylcclxuICAgICAgLnRhcChyZWxvYWQgPT4ge1xyXG4gICAgICAgIGlmICghcmVsb2FkKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgc2VxdWVsaXplRXJyb3JzLkluc3RhbmNlRXJyb3IoXHJcbiAgICAgICAgICAgICdJbnN0YW5jZSBjb3VsZCBub3QgYmUgcmVsb2FkZWQgYmVjYXVzZSBpdCBkb2VzIG5vdCBleGlzdCBhbnltb3JlIChmaW5kIGNhbGwgcmV0dXJuZWQgbnVsbCknXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLnRoZW4ocmVsb2FkID0+IHtcclxuICAgICAgLy8gdXBkYXRlIHRoZSBpbnRlcm5hbCBvcHRpb25zIG9mIHRoZSBpbnN0YW5jZVxyXG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSByZWxvYWQuX29wdGlvbnM7XHJcbiAgICAgICAgLy8gcmUtc2V0IGluc3RhbmNlIHZhbHVlc1xyXG4gICAgICAgIHRoaXMuc2V0KHJlbG9hZC5kYXRhVmFsdWVzLCB7XHJcbiAgICAgICAgICByYXc6IHRydWUsXHJcbiAgICAgICAgICByZXNldDogdHJ1ZSAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBWYWxpZGF0ZSB0aGUgYXR0cmlidXRlcyBvZiB0aGlzIGluc3RhbmNlIGFjY29yZGluZyB0byB2YWxpZGF0aW9uIHJ1bGVzIHNldCBpbiB0aGUgbW9kZWwgZGVmaW5pdGlvbi5cclxuICAqXHJcbiAgKiBUaGUgcHJvbWlzZSBmdWxmaWxscyBpZiBhbmQgb25seSBpZiB2YWxpZGF0aW9uIHN1Y2Nlc3NmdWw7IG90aGVyd2lzZSBpdCByZWplY3RzIGFuIEVycm9yIGluc3RhbmNlIGNvbnRhaW5pbmcgeyBmaWVsZCBuYW1lIDogW2Vycm9yIG1zZ3NdIH0gZW50cmllcy5cclxuICAqXHJcbiAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIHRoZSB2YWxpZGF0b3JcclxuICAqIEBwYXJhbSB7QXJyYXl9IFtvcHRpb25zLnNraXBdIEFuIGFycmF5IG9mIHN0cmluZ3MuIEFsbCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGluIHRoaXMgYXJyYXkgd2lsbCBub3QgYmUgdmFsaWRhdGVkXHJcbiAgKiBAcGFyYW0ge0FycmF5fSBbb3B0aW9ucy5maWVsZHNdIEFuIGFycmF5IG9mIHN0cmluZ3MuIE9ubHkgdGhlIHByb3BlcnRpZXMgdGhhdCBhcmUgaW4gdGhpcyBhcnJheSB3aWxsIGJlIHZhbGlkYXRlZFxyXG4gICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5ob29rcz10cnVlXSBSdW4gYmVmb3JlIGFuZCBhZnRlciB2YWxpZGF0ZSBob29rc1xyXG4gICpcclxuICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICovXHJcbiAgdmFsaWRhdGUob3B0aW9ucykge1xyXG4gICAgcmV0dXJuIG5ldyBJbnN0YW5jZVZhbGlkYXRvcih0aGlzLCBvcHRpb25zKS52YWxpZGF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGhpcyBpcyB0aGUgc2FtZSBhcyBjYWxsaW5nIGBzZXRgIGFuZCB0aGVuIGNhbGxpbmcgYHNhdmVgIGJ1dCBpdCBvbmx5IHNhdmVzIHRoZVxyXG4gICAqIGV4YWN0IHZhbHVlcyBwYXNzZWQgdG8gaXQsIG1ha2luZyBpdCBtb3JlIGF0b21pYyBhbmQgc2FmZXIuXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsI3NldH1cclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsI3NhdmV9XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzIFNlZSBgc2V0YFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFNlZSBgc2F2ZWBcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsPn1cclxuICAgKi9cclxuICB1cGRhdGUodmFsdWVzLCBvcHRpb25zKSB7XHJcbiAgICAvLyBDbG9uZSB2YWx1ZXMgc28gaXQgZG9lc24ndCBnZXQgbW9kaWZpZWQgZm9yIGNhbGxlciBzY29wZSBhbmQgaWdub3JlIHVuZGVmaW5lZCB2YWx1ZXNcclxuICAgIHZhbHVlcyA9IF8ub21pdEJ5KHZhbHVlcywgdmFsdWUgPT4gdmFsdWUgPT09IHVuZGVmaW5lZCk7XHJcblxyXG4gICAgY29uc3QgY2hhbmdlZEJlZm9yZSA9IHRoaXMuY2hhbmdlZCgpIHx8IFtdO1xyXG5cclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIG9wdGlvbnMgPSB7IGZpZWxkczogb3B0aW9ucyB9O1xyXG5cclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcbiAgICBjb25zdCBzZXRPcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xyXG4gICAgc2V0T3B0aW9ucy5hdHRyaWJ1dGVzID0gb3B0aW9ucy5maWVsZHM7XHJcbiAgICB0aGlzLnNldCh2YWx1ZXMsIHNldE9wdGlvbnMpO1xyXG5cclxuICAgIC8vIE5vdyB3ZSBuZWVkIHRvIGZpZ3VyZSBvdXQgd2hpY2ggZmllbGRzIHdlcmUgYWN0dWFsbHkgYWZmZWN0ZWQgYnkgdGhlIHNldHRlci5cclxuICAgIGNvbnN0IHNpZGVFZmZlY3RzID0gXy53aXRob3V0KHRoaXMuY2hhbmdlZCgpLCAuLi5jaGFuZ2VkQmVmb3JlKTtcclxuICAgIGNvbnN0IGZpZWxkcyA9IF8udW5pb24oT2JqZWN0LmtleXModmFsdWVzKSwgc2lkZUVmZmVjdHMpO1xyXG5cclxuICAgIGlmICghb3B0aW9ucy5maWVsZHMpIHtcclxuICAgICAgb3B0aW9ucy5maWVsZHMgPSBfLmludGVyc2VjdGlvbihmaWVsZHMsIHRoaXMuY2hhbmdlZCgpKTtcclxuICAgICAgb3B0aW9ucy5kZWZhdWx0RmllbGRzID0gb3B0aW9ucy5maWVsZHM7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuc2F2ZShvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3kgdGhlIHJvdyBjb3JyZXNwb25kaW5nIHRvIHRoaXMgaW5zdGFuY2UuIERlcGVuZGluZyBvbiB5b3VyIHNldHRpbmcgZm9yIHBhcmFub2lkLCB0aGUgcm93IHdpbGwgZWl0aGVyIGJlIGNvbXBsZXRlbHkgZGVsZXRlZCwgb3IgaGF2ZSBpdHMgZGVsZXRlZEF0IHRpbWVzdGFtcCBzZXQgdG8gdGhlIGN1cnJlbnQgdGltZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIFtvcHRpb25zPXt9XSBkZXN0cm95IG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICBbb3B0aW9ucy5mb3JjZT1mYWxzZV0gSWYgc2V0IHRvIHRydWUsIHBhcmFub2lkIG1vZGVscyB3aWxsIGFjdHVhbGx5IGJlIGRlbGV0ZWRcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICBbb3B0aW9ucy5sb2dnaW5nPWZhbHNlXSBBIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGlsZSBydW5uaW5nIHRoZSBxdWVyeSB0byBsb2cgdGhlIHNxbC5cclxuICAgKiBAcGFyYW0ge1RyYW5zYWN0aW9ufSBbb3B0aW9ucy50cmFuc2FjdGlvbl0gVHJhbnNhY3Rpb24gdG8gcnVuIHF1ZXJ5IHVuZGVyXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgW29wdGlvbnMuc2VhcmNoUGF0aD1ERUZBVUxUXSBBbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gc3BlY2lmeSB0aGUgc2NoZW1hIHNlYXJjaF9wYXRoIChQb3N0Z3JlcyBvbmx5KVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgZGVzdHJveShvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgIGhvb2tzOiB0cnVlLFxyXG4gICAgICBmb3JjZTogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnRyeSgoKSA9PiB7XHJcbiAgICAgIC8vIFJ1biBiZWZvcmUgaG9va1xyXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnJ1bkhvb2tzKCdiZWZvcmVEZXN0cm95JywgdGhpcywgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICBjb25zdCB3aGVyZSA9IHRoaXMud2hlcmUodHJ1ZSk7XHJcblxyXG4gICAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQgJiYgb3B0aW9ucy5mb3JjZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQ7XHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlID0gdGhpcy5jb25zdHJ1Y3Rvci5yYXdBdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xyXG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhdHRyaWJ1dGUsICdkZWZhdWx0VmFsdWUnKVxyXG4gICAgICAgICAgPyBhdHRyaWJ1dGUuZGVmYXVsdFZhbHVlXHJcbiAgICAgICAgICA6IG51bGw7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gdGhpcy5nZXREYXRhVmFsdWUoYXR0cmlidXRlTmFtZSk7XHJcbiAgICAgICAgY29uc3QgdW5kZWZpbmVkT3JOdWxsID0gY3VycmVudFZhbHVlID09IG51bGwgJiYgZGVmYXVsdFZhbHVlID09IG51bGw7XHJcbiAgICAgICAgaWYgKHVuZGVmaW5lZE9yTnVsbCB8fCBfLmlzRXF1YWwoY3VycmVudFZhbHVlLCBkZWZhdWx0VmFsdWUpKSB7XHJcbiAgICAgICAgICAvLyBvbmx5IHVwZGF0ZSB0aW1lc3RhbXAgaWYgaXQgd2Fzbid0IGFscmVhZHkgc2V0XHJcbiAgICAgICAgICB0aGlzLnNldERhdGFWYWx1ZShhdHRyaWJ1dGVOYW1lLCBuZXcgRGF0ZSgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnNhdmUoXy5kZWZhdWx0cyh7IGhvb2tzOiBmYWxzZSB9LCBvcHRpb25zKSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuUXVlcnlJbnRlcmZhY2UuZGVsZXRlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IuZ2V0VGFibGVOYW1lKG9wdGlvbnMpLCB3aGVyZSwgT2JqZWN0LmFzc2lnbih7IHR5cGU6IFF1ZXJ5VHlwZXMuREVMRVRFLCBsaW1pdDogbnVsbCB9LCBvcHRpb25zKSk7XHJcbiAgICB9KS50YXAoKCkgPT4ge1xyXG4gICAgICAvLyBSdW4gYWZ0ZXIgaG9va1xyXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnJ1bkhvb2tzKCdhZnRlckRlc3Ryb3knLCB0aGlzLCBvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgbWV0aG9kIHRvIGRldGVybWluZSBpZiBhIGluc3RhbmNlIGlzIFwic29mdCBkZWxldGVkXCIuICBUaGlzIGlzXHJcbiAgICogcGFydGljdWxhcmx5IHVzZWZ1bCBpZiB0aGUgaW1wbGVtZW50ZXIgcmVuYW1lZCB0aGUgYGRlbGV0ZWRBdGAgYXR0cmlidXRlXHJcbiAgICogdG8gc29tZXRoaW5nIGRpZmZlcmVudC4gIFRoaXMgbWV0aG9kIHJlcXVpcmVzIGBwYXJhbm9pZGAgdG8gYmUgZW5hYmxlZC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAqL1xyXG4gIGlzU29mdERlbGV0ZWQoKSB7XHJcbiAgICBpZiAoIXRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTW9kZWwgaXMgbm90IHBhcmFub2lkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVsZXRlZEF0QXR0cmlidXRlID0gdGhpcy5jb25zdHJ1Y3Rvci5yYXdBdHRyaWJ1dGVzW3RoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0XTtcclxuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkZWxldGVkQXRBdHRyaWJ1dGUsICdkZWZhdWx0VmFsdWUnKSA/IGRlbGV0ZWRBdEF0dHJpYnV0ZS5kZWZhdWx0VmFsdWUgOiBudWxsO1xyXG4gICAgY29uc3QgZGVsZXRlZEF0ID0gdGhpcy5nZXQodGhpcy5jb25zdHJ1Y3Rvci5fdGltZXN0YW1wQXR0cmlidXRlcy5kZWxldGVkQXQpIHx8IG51bGw7XHJcbiAgICBjb25zdCBpc1NldCA9IGRlbGV0ZWRBdCAhPT0gZGVmYXVsdFZhbHVlO1xyXG5cclxuICAgIHJldHVybiBpc1NldDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3RvcmUgdGhlIHJvdyBjb3JyZXNwb25kaW5nIHRvIHRoaXMgaW5zdGFuY2UuIE9ubHkgYXZhaWxhYmxlIGZvciBwYXJhbm9pZCBtb2RlbHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICBbb3B0aW9ucz17fV0gcmVzdG9yZSBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgcmVzdG9yZShvcHRpb25zKSB7XHJcbiAgICBpZiAoIXRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0KSB0aHJvdyBuZXcgRXJyb3IoJ01vZGVsIGlzIG5vdCBwYXJhbm9pZCcpO1xyXG5cclxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcclxuICAgICAgaG9va3M6IHRydWUsXHJcbiAgICAgIGZvcmNlOiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcclxuICAgICAgLy8gUnVuIGJlZm9yZSBob29rXHJcbiAgICAgIGlmIChvcHRpb25zLmhvb2tzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IucnVuSG9va3MoJ2JlZm9yZVJlc3RvcmUnLCB0aGlzLCBvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfSkudGhlbigoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGRlbGV0ZWRBdENvbCA9IHRoaXMuY29uc3RydWN0b3IuX3RpbWVzdGFtcEF0dHJpYnV0ZXMuZGVsZXRlZEF0O1xyXG4gICAgICBjb25zdCBkZWxldGVkQXRBdHRyaWJ1dGUgPSB0aGlzLmNvbnN0cnVjdG9yLnJhd0F0dHJpYnV0ZXNbZGVsZXRlZEF0Q29sXTtcclxuICAgICAgY29uc3QgZGVsZXRlZEF0RGVmYXVsdFZhbHVlID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRlbGV0ZWRBdEF0dHJpYnV0ZSwgJ2RlZmF1bHRWYWx1ZScpID8gZGVsZXRlZEF0QXR0cmlidXRlLmRlZmF1bHRWYWx1ZSA6IG51bGw7XHJcblxyXG4gICAgICB0aGlzLnNldERhdGFWYWx1ZShkZWxldGVkQXRDb2wsIGRlbGV0ZWRBdERlZmF1bHRWYWx1ZSk7XHJcbiAgICAgIHJldHVybiB0aGlzLnNhdmUoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgeyBob29rczogZmFsc2UsIG9taXROdWxsOiBmYWxzZSB9KSk7XHJcbiAgICB9KS50YXAoKCkgPT4ge1xyXG4gICAgICAvLyBSdW4gYWZ0ZXIgaG9va1xyXG4gICAgICBpZiAob3B0aW9ucy5ob29rcykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnJ1bkhvb2tzKCdhZnRlclJlc3RvcmUnLCB0aGlzLCBvcHRpb25zKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbmNyZW1lbnQgdGhlIHZhbHVlIG9mIG9uZSBvciBtb3JlIGNvbHVtbnMuIFRoaXMgaXMgZG9uZSBpbiB0aGUgZGF0YWJhc2UsIHdoaWNoIG1lYW5zIGl0IGRvZXMgbm90IHVzZSB0aGUgdmFsdWVzIGN1cnJlbnRseSBzdG9yZWQgb24gdGhlIEluc3RhbmNlLiBUaGUgaW5jcmVtZW50IGlzIGRvbmUgdXNpbmcgYVxyXG4gICAqIGBgYHNxbFxyXG4gICAqIFNFVCBjb2x1bW4gPSBjb2x1bW4gKyBYXHJcbiAgICogYGBgXHJcbiAgICogcXVlcnkuIFRoZSB1cGRhdGVkIGluc3RhbmNlIHdpbGwgYmUgcmV0dXJuZWQgYnkgZGVmYXVsdCBpbiBQb3N0Z3Jlcy4gSG93ZXZlciwgaW4gb3RoZXIgZGlhbGVjdHMsIHlvdSB3aWxsIG5lZWQgdG8gZG8gYSByZWxvYWQgdG8gZ2V0IHRoZSBuZXcgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiBpbnN0YW5jZS5pbmNyZW1lbnQoJ251bWJlcicpIC8vIGluY3JlbWVudCBudW1iZXIgYnkgMVxyXG4gICAqXHJcbiAgICogaW5zdGFuY2UuaW5jcmVtZW50KFsnbnVtYmVyJywgJ2NvdW50J10sIHsgYnk6IDIgfSkgLy8gaW5jcmVtZW50IG51bWJlciBhbmQgY291bnQgYnkgMlxyXG4gICAqXHJcbiAgICogLy8gaW5jcmVtZW50IGFuc3dlciBieSA0MiwgYW5kIHRyaWVzIGJ5IDEuXHJcbiAgICogLy8gYGJ5YCBpcyBpZ25vcmVkLCBzaW5jZSBlYWNoIGNvbHVtbiBoYXMgaXRzIG93biB2YWx1ZVxyXG4gICAqIGluc3RhbmNlLmluY3JlbWVudCh7IGFuc3dlcjogNDIsIHRyaWVzOiAxfSwgeyBieTogMiB9KVxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbCNyZWxvYWR9XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheXxPYmplY3R9IGZpZWxkcyBJZiBhIHN0cmluZyBpcyBwcm92aWRlZCwgdGhhdCBjb2x1bW4gaXMgaW5jcmVtZW50ZWQgYnkgdGhlIHZhbHVlIG9mIGBieWAgZ2l2ZW4gaW4gb3B0aW9ucy4gSWYgYW4gYXJyYXkgaXMgcHJvdmlkZWQsIHRoZSBzYW1lIGlzIHRydWUgZm9yIGVhY2ggY29sdW1uLiBJZiBhbmQgb2JqZWN0IGlzIHByb3ZpZGVkLCBlYWNoIGNvbHVtbiBpcyBpbmNyZW1lbnRlZCBieSB0aGUgdmFsdWUgZ2l2ZW4uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmJ5PTFdIFRoZSBudW1iZXIgdG8gaW5jcmVtZW50IGJ5XHJcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zaWxlbnQ9ZmFsc2VdIElmIHRydWUsIHRoZSB1cGRhdGVkQXQgdGltZXN0YW1wIHdpbGwgbm90IGJlIHVwZGF0ZWQuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zZWFyY2hQYXRoPURFRkFVTFRdIEFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byBzcGVjaWZ5IHRoZSBzY2hlbWEgc2VhcmNoX3BhdGggKFBvc3RncmVzIG9ubHkpXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZXR1cm5pbmc9dHJ1ZV0gQXBwZW5kIFJFVFVSTklORyAqIHRvIGdldCBiYWNrIGF1dG8gZ2VuZXJhdGVkIHZhbHVlcyAoUG9zdGdyZXMgb25seSlcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsPn1cclxuICAgKiBAc2luY2UgNC4wLjBcclxuICAgKi9cclxuICBpbmNyZW1lbnQoZmllbGRzLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCBpZGVudGlmaWVyID0gdGhpcy53aGVyZSgpO1xyXG5cclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcbiAgICBvcHRpb25zLndoZXJlID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucy53aGVyZSwgaWRlbnRpZmllcik7XHJcbiAgICBvcHRpb25zLmluc3RhbmNlID0gdGhpcztcclxuXHJcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5pbmNyZW1lbnQoZmllbGRzLCBvcHRpb25zKS5yZXR1cm4odGhpcyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWNyZW1lbnQgdGhlIHZhbHVlIG9mIG9uZSBvciBtb3JlIGNvbHVtbnMuIFRoaXMgaXMgZG9uZSBpbiB0aGUgZGF0YWJhc2UsIHdoaWNoIG1lYW5zIGl0IGRvZXMgbm90IHVzZSB0aGUgdmFsdWVzIGN1cnJlbnRseSBzdG9yZWQgb24gdGhlIEluc3RhbmNlLiBUaGUgZGVjcmVtZW50IGlzIGRvbmUgdXNpbmcgYVxyXG4gICAqIGBgYHNxbFxyXG4gICAqIFNFVCBjb2x1bW4gPSBjb2x1bW4gLSBYXHJcbiAgICogYGBgXHJcbiAgICogcXVlcnkuIFRoZSB1cGRhdGVkIGluc3RhbmNlIHdpbGwgYmUgcmV0dXJuZWQgYnkgZGVmYXVsdCBpbiBQb3N0Z3Jlcy4gSG93ZXZlciwgaW4gb3RoZXIgZGlhbGVjdHMsIHlvdSB3aWxsIG5lZWQgdG8gZG8gYSByZWxvYWQgdG8gZ2V0IHRoZSBuZXcgdmFsdWVzLlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiBpbnN0YW5jZS5kZWNyZW1lbnQoJ251bWJlcicpIC8vIGRlY3JlbWVudCBudW1iZXIgYnkgMVxyXG4gICAqXHJcbiAgICogaW5zdGFuY2UuZGVjcmVtZW50KFsnbnVtYmVyJywgJ2NvdW50J10sIHsgYnk6IDIgfSkgLy8gZGVjcmVtZW50IG51bWJlciBhbmQgY291bnQgYnkgMlxyXG4gICAqXHJcbiAgICogLy8gZGVjcmVtZW50IGFuc3dlciBieSA0MiwgYW5kIHRyaWVzIGJ5IDEuXHJcbiAgICogLy8gYGJ5YCBpcyBpZ25vcmVkLCBzaW5jZSBlYWNoIGNvbHVtbiBoYXMgaXRzIG93biB2YWx1ZVxyXG4gICAqIGluc3RhbmNlLmRlY3JlbWVudCh7IGFuc3dlcjogNDIsIHRyaWVzOiAxfSwgeyBieTogMiB9KVxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbCNyZWxvYWR9XHJcbiAgICogQHBhcmFtIHtzdHJpbmd8QXJyYXl8T2JqZWN0fSBmaWVsZHMgSWYgYSBzdHJpbmcgaXMgcHJvdmlkZWQsIHRoYXQgY29sdW1uIGlzIGRlY3JlbWVudGVkIGJ5IHRoZSB2YWx1ZSBvZiBgYnlgIGdpdmVuIGluIG9wdGlvbnMuIElmIGFuIGFycmF5IGlzIHByb3ZpZGVkLCB0aGUgc2FtZSBpcyB0cnVlIGZvciBlYWNoIGNvbHVtbi4gSWYgYW5kIG9iamVjdCBpcyBwcm92aWRlZCwgZWFjaCBjb2x1bW4gaXMgZGVjcmVtZW50ZWQgYnkgdGhlIHZhbHVlIGdpdmVuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgW29wdGlvbnNdIGRlY3JlbWVudCBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgW29wdGlvbnMuYnk9MV0gVGhlIG51bWJlciB0byBkZWNyZW1lbnQgYnlcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICBbb3B0aW9ucy5zaWxlbnQ9ZmFsc2VdIElmIHRydWUsIHRoZSB1cGRhdGVkQXQgdGltZXN0YW1wIHdpbGwgbm90IGJlIHVwZGF0ZWQuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgW29wdGlvbnMubG9nZ2luZz1mYWxzZV0gQSBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hpbGUgcnVubmluZyB0aGUgcXVlcnkgdG8gbG9nIHRoZSBzcWwuXHJcbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvbn0gW29wdGlvbnMudHJhbnNhY3Rpb25dIFRyYW5zYWN0aW9uIHRvIHJ1biBxdWVyeSB1bmRlclxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgIFtvcHRpb25zLnNlYXJjaFBhdGg9REVGQVVMVF0gQW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHNwZWNpZnkgdGhlIHNjaGVtYSBzZWFyY2hfcGF0aCAoUG9zdGdyZXMgb25seSlcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICBbb3B0aW9ucy5yZXR1cm5pbmc9dHJ1ZV0gQXBwZW5kIFJFVFVSTklORyAqIHRvIGdldCBiYWNrIGF1dG8gZ2VuZXJhdGVkIHZhbHVlcyAoUG9zdGdyZXMgb25seSlcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGRlY3JlbWVudChmaWVsZHMsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKHsgaW5jcmVtZW50OiBmYWxzZSB9LCBvcHRpb25zLCB7XHJcbiAgICAgIGJ5OiAxXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5pbmNyZW1lbnQoZmllbGRzLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrIHdoZXRoZXIgdGhpcyBhbmQgYG90aGVyYCBJbnN0YW5jZSByZWZlciB0byB0aGUgc2FtZSByb3dcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TW9kZWx9IG90aGVyIE90aGVyIGluc3RhbmNlIHRvIGNvbXBhcmUgYWdhaW5zdFxyXG4gICAqXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICovXHJcbiAgZXF1YWxzKG90aGVyKSB7XHJcbiAgICBpZiAoIW90aGVyIHx8ICFvdGhlci5jb25zdHJ1Y3Rvcikge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiB0aGlzLmNvbnN0cnVjdG9yKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IucHJpbWFyeUtleUF0dHJpYnV0ZXMuZXZlcnkoYXR0cmlidXRlID0+IHRoaXMuZ2V0KGF0dHJpYnV0ZSwgeyByYXc6IHRydWUgfSkgPT09IG90aGVyLmdldChhdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrIGlmIHRoaXMgaXMgZXF1YWwgdG8gb25lIG9mIGBvdGhlcnNgIGJ5IGNhbGxpbmcgZXF1YWxzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge0FycmF5PE1vZGVsPn0gb3RoZXJzIEFuIGFycmF5IG9mIGluc3RhbmNlcyB0byBjaGVjayBhZ2FpbnN0XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgKi9cclxuICBlcXVhbHNPbmVPZihvdGhlcnMpIHtcclxuICAgIHJldHVybiBvdGhlcnMuc29tZShvdGhlciA9PiB0aGlzLmVxdWFscyhvdGhlcikpO1xyXG4gIH1cclxuXHJcbiAgc2V0VmFsaWRhdG9ycyhhdHRyaWJ1dGUsIHZhbGlkYXRvcnMpIHtcclxuICAgIHRoaXMudmFsaWRhdG9yc1thdHRyaWJ1dGVdID0gdmFsaWRhdG9ycztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnZlcnQgdGhlIGluc3RhbmNlIHRvIGEgSlNPTiByZXByZXNlbnRhdGlvbi5cclxuICAgKiBQcm94aWVzIHRvIGNhbGxpbmcgYGdldGAgd2l0aCBubyBrZXlzLlxyXG4gICAqIFRoaXMgbWVhbnMgZ2V0IGFsbCB2YWx1ZXMgZ290dGVuIGZyb20gdGhlIERCLCBhbmQgYXBwbHkgYWxsIGN1c3RvbSBnZXR0ZXJzLlxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbCNnZXR9XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gICAqL1xyXG4gIHRvSlNPTigpIHtcclxuICAgIHJldHVybiBfLmNsb25lRGVlcChcclxuICAgICAgdGhpcy5nZXQoe1xyXG4gICAgICAgIHBsYWluOiB0cnVlXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIDE6bSBhc3NvY2lhdGlvbiBiZXR3ZWVuIHRoaXMgKHRoZSBzb3VyY2UpIGFuZCB0aGUgcHJvdmlkZWQgdGFyZ2V0LlxyXG4gICAqIFRoZSBmb3JlaWduIGtleSBpcyBhZGRlZCBvbiB0aGUgdGFyZ2V0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtNb2RlbH0gICAgICAgICAgICAgICB0YXJnZXQgVGFyZ2V0IG1vZGVsXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgICAgICBbb3B0aW9uc10gaGFzTWFueSBhc3NvY2lhdGlvbiBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICBbb3B0aW9ucy5ob29rcz1mYWxzZV0gU2V0IHRvIHRydWUgdG8gcnVuIGJlZm9yZS0vYWZ0ZXJEZXN0cm95IGhvb2tzIHdoZW4gYW4gYXNzb2NpYXRlZCBtb2RlbCBpcyBkZWxldGVkIGJlY2F1c2Ugb2YgYSBjYXNjYWRlLiBGb3IgZXhhbXBsZSBpZiBgVXNlci5oYXNPbmUoUHJvZmlsZSwge29uRGVsZXRlOiAnY2FzY2FkZScsIGhvb2tzOnRydWV9KWAsIHRoZSBiZWZvcmUtL2FmdGVyRGVzdHJveSBob29rcyBmb3IgcHJvZmlsZSB3aWxsIGJlIGNhbGxlZCB3aGVuIGEgdXNlciBpcyBkZWxldGVkLiBPdGhlcndpc2UgdGhlIHByb2ZpbGUgd2lsbCBiZSBkZWxldGVkIHdpdGhvdXQgaW52b2tpbmcgYW55IGhvb2tzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSAgICAgICBbb3B0aW9ucy5hc10gVGhlIGFsaWFzIG9mIHRoaXMgbW9kZWwuIElmIHlvdSBwcm92aWRlIGEgc3RyaW5nLCBpdCBzaG91bGQgYmUgcGx1cmFsLCBhbmQgd2lsbCBiZSBzaW5ndWxhcml6ZWQgdXNpbmcgbm9kZS5pbmZsZWN0aW9uLiBJZiB5b3Ugd2FudCB0byBjb250cm9sIHRoZSBzaW5ndWxhciB2ZXJzaW9uIHlvdXJzZWxmLCBwcm92aWRlIGFuIG9iamVjdCB3aXRoIGBwbHVyYWxgIGFuZCBgc2luZ3VsYXJgIGtleXMuIFNlZSBhbHNvIHRoZSBgbmFtZWAgb3B0aW9uIHBhc3NlZCB0byBgc2VxdWVsaXplLmRlZmluZWAuIElmIHlvdSBjcmVhdGUgbXVsdGlwbGUgYXNzb2NpYXRpb25zIGJldHdlZW4gdGhlIHNhbWUgdGFibGVzLCB5b3Ugc2hvdWxkIHByb3ZpZGUgYW4gYWxpYXMgdG8gYmUgYWJsZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIHRoZW0uIElmIHlvdSBwcm92aWRlIGFuIGFsaWFzIHdoZW4gY3JlYXRpbmcgdGhlIGFzc29jaWF0aW9uLCB5b3Ugc2hvdWxkIHByb3ZpZGUgdGhlIHNhbWUgYWxpYXMgd2hlbiBlYWdlciBsb2FkaW5nIGFuZCB3aGVuIGdldHRpbmcgYXNzb2NpYXRlZCBtb2RlbHMuIERlZmF1bHRzIHRvIHRoZSBwbHVyYWxpemVkIG5hbWUgb2YgdGFyZ2V0XHJcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSAgICAgICBbb3B0aW9ucy5mb3JlaWduS2V5XSBUaGUgbmFtZSBvZiB0aGUgZm9yZWlnbiBrZXkgaW4gdGhlIHRhcmdldCB0YWJsZSBvciBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSB0eXBlIGRlZmluaXRpb24gZm9yIHRoZSBmb3JlaWduIGNvbHVtbiAoc2VlIGBTZXF1ZWxpemUuZGVmaW5lYCBmb3Igc3ludGF4KS4gV2hlbiB1c2luZyBhbiBvYmplY3QsIHlvdSBjYW4gYWRkIGEgYG5hbWVgIHByb3BlcnR5IHRvIHNldCB0aGUgbmFtZSBvZiB0aGUgY29sdW1uLiBEZWZhdWx0cyB0byB0aGUgbmFtZSBvZiBzb3VyY2UgKyBwcmltYXJ5IGtleSBvZiBzb3VyY2VcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgIFtvcHRpb25zLnNvdXJjZUtleV0gVGhlIG5hbWUgb2YgdGhlIGZpZWxkIHRvIHVzZSBhcyB0aGUga2V5IGZvciB0aGUgYXNzb2NpYXRpb24gaW4gdGhlIHNvdXJjZSB0YWJsZS4gRGVmYXVsdHMgdG8gdGhlIHByaW1hcnkga2V5IG9mIHRoZSBzb3VyY2UgdGFibGVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgICAgIFtvcHRpb25zLnNjb3BlXSBBIGtleS92YWx1ZSBzZXQgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIGFzc29jaWF0aW9uIGNyZWF0ZSBhbmQgZmluZCBkZWZhdWx0cyBvbiB0aGUgdGFyZ2V0LiAoc3FsaXRlIG5vdCBzdXBwb3J0ZWQgZm9yIE46TSlcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgIFtvcHRpb25zLm9uRGVsZXRlPSdTRVQmbmJzcDtOVUxMfENBU0NBREUnXSBTRVQgTlVMTCBpZiBmb3JlaWduS2V5IGFsbG93cyBudWxscywgQ0FTQ0FERSBpZiBvdGhlcndpc2VcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgIFtvcHRpb25zLm9uVXBkYXRlPSdDQVNDQURFJ10gU2V0IGBPTiBVUERBVEVgXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgICAgICBbb3B0aW9ucy5jb25zdHJhaW50cz10cnVlXSBTaG91bGQgb24gdXBkYXRlIGFuZCBvbiBkZWxldGUgY29uc3RyYWludHMgYmUgZW5hYmxlZCBvbiB0aGUgZm9yZWlnbiBrZXkuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7SGFzTWFueX1cclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogVXNlci5oYXNNYW55KFByb2ZpbGUpIC8vIFRoaXMgd2lsbCBhZGQgdXNlcklkIHRvIHRoZSBwcm9maWxlIHRhYmxlXHJcbiAgICovXHJcbiAgc3RhdGljIGhhc01hbnkodGFyZ2V0LCBvcHRpb25zKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhbiBOOk0gYXNzb2NpYXRpb24gd2l0aCBhIGpvaW4gdGFibGUuIERlZmluaW5nIGB0aHJvdWdoYCBpcyByZXF1aXJlZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TW9kZWx9ICAgICAgICAgICAgICAgdGFyZ2V0IFRhcmdldCBtb2RlbFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgb3B0aW9ucyBiZWxvbmdzVG9NYW55IGFzc29jaWF0aW9uIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgICAgIFtvcHRpb25zLmhvb2tzPWZhbHNlXSBTZXQgdG8gdHJ1ZSB0byBydW4gYmVmb3JlLS9hZnRlckRlc3Ryb3kgaG9va3Mgd2hlbiBhbiBhc3NvY2lhdGVkIG1vZGVsIGlzIGRlbGV0ZWQgYmVjYXVzZSBvZiBhIGNhc2NhZGUuIEZvciBleGFtcGxlIGlmIGBVc2VyLmhhc09uZShQcm9maWxlLCB7b25EZWxldGU6ICdjYXNjYWRlJywgaG9va3M6dHJ1ZX0pYCwgdGhlIGJlZm9yZS0vYWZ0ZXJEZXN0cm95IGhvb2tzIGZvciBwcm9maWxlIHdpbGwgYmUgY2FsbGVkIHdoZW4gYSB1c2VyIGlzIGRlbGV0ZWQuIE90aGVyd2lzZSB0aGUgcHJvZmlsZSB3aWxsIGJlIGRlbGV0ZWQgd2l0aG91dCBpbnZva2luZyBhbnkgaG9va3NcclxuICAgKiBAcGFyYW0ge01vZGVsfHN0cmluZ3xPYmplY3R9IG9wdGlvbnMudGhyb3VnaCBUaGUgbmFtZSBvZiB0aGUgdGFibGUgdGhhdCBpcyB1c2VkIHRvIGpvaW4gc291cmNlIGFuZCB0YXJnZXQgaW4gbjptIGFzc29jaWF0aW9ucy4gQ2FuIGFsc28gYmUgYSBzZXF1ZWxpemUgbW9kZWwgaWYgeW91IHdhbnQgdG8gZGVmaW5lIHRoZSBqdW5jdGlvbiB0YWJsZSB5b3Vyc2VsZiBhbmQgYWRkIGV4dHJhIGF0dHJpYnV0ZXMgdG8gaXQuXHJcbiAgICogQHBhcmFtIHtNb2RlbH0gICAgICAgICAgICAgICBbb3B0aW9ucy50aHJvdWdoLm1vZGVsXSBUaGUgbW9kZWwgdXNlZCB0byBqb2luIGJvdGggc2lkZXMgb2YgdGhlIE46TSBhc3NvY2lhdGlvbi5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgICAgIFtvcHRpb25zLnRocm91Z2guc2NvcGVdIEEga2V5L3ZhbHVlIHNldCB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgYXNzb2NpYXRpb24gY3JlYXRlIGFuZCBmaW5kIGRlZmF1bHRzIG9uIHRoZSB0aHJvdWdoIG1vZGVsLiAoUmVtZW1iZXIgdG8gYWRkIHRoZSBhdHRyaWJ1dGVzIHRvIHRoZSB0aHJvdWdoIG1vZGVsKVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgW29wdGlvbnMudGhyb3VnaC51bmlxdWU9dHJ1ZV0gSWYgdHJ1ZSBhIHVuaXF1ZSBrZXkgd2lsbCBiZSBnZW5lcmF0ZWQgZnJvbSB0aGUgZm9yZWlnbiBrZXlzIHVzZWQgKG1pZ2h0IHdhbnQgdG8gdHVybiB0aGlzIG9mZiBhbmQgY3JlYXRlIHNwZWNpZmljIHVuaXF1ZSBrZXlzIHdoZW4gdXNpbmcgc2NvcGVzKVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gICAgICAgW29wdGlvbnMuYXNdIFRoZSBhbGlhcyBvZiB0aGlzIGFzc29jaWF0aW9uLiBJZiB5b3UgcHJvdmlkZSBhIHN0cmluZywgaXQgc2hvdWxkIGJlIHBsdXJhbCwgYW5kIHdpbGwgYmUgc2luZ3VsYXJpemVkIHVzaW5nIG5vZGUuaW5mbGVjdGlvbi4gSWYgeW91IHdhbnQgdG8gY29udHJvbCB0aGUgc2luZ3VsYXIgdmVyc2lvbiB5b3Vyc2VsZiwgcHJvdmlkZSBhbiBvYmplY3Qgd2l0aCBgcGx1cmFsYCBhbmQgYHNpbmd1bGFyYCBrZXlzLiBTZWUgYWxzbyB0aGUgYG5hbWVgIG9wdGlvbiBwYXNzZWQgdG8gYHNlcXVlbGl6ZS5kZWZpbmVgLiBJZiB5b3UgY3JlYXRlIG11bHRpcGxlIGFzc29jaWF0aW9ucyBiZXR3ZWVuIHRoZSBzYW1lIHRhYmxlcywgeW91IHNob3VsZCBwcm92aWRlIGFuIGFsaWFzIHRvIGJlIGFibGUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiB0aGVtLiBJZiB5b3UgcHJvdmlkZSBhbiBhbGlhcyB3aGVuIGNyZWF0aW5nIHRoZSBhc3NvY2lhdGlvbiwgeW91IHNob3VsZCBwcm92aWRlIHRoZSBzYW1lIGFsaWFzIHdoZW4gZWFnZXIgbG9hZGluZyBhbmQgd2hlbiBnZXR0aW5nIGFzc29jaWF0ZWQgbW9kZWxzLiBEZWZhdWx0cyB0byB0aGUgcGx1cmFsaXplZCBuYW1lIG9mIHRhcmdldFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gICAgICAgW29wdGlvbnMuZm9yZWlnbktleV0gVGhlIG5hbWUgb2YgdGhlIGZvcmVpZ24ga2V5IGluIHRoZSBqb2luIHRhYmxlIChyZXByZXNlbnRpbmcgdGhlIHNvdXJjZSBtb2RlbCkgb3IgYW4gb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgdHlwZSBkZWZpbml0aW9uIGZvciB0aGUgZm9yZWlnbiBjb2x1bW4gKHNlZSBgU2VxdWVsaXplLmRlZmluZWAgZm9yIHN5bnRheCkuIFdoZW4gdXNpbmcgYW4gb2JqZWN0LCB5b3UgY2FuIGFkZCBhIGBuYW1lYCBwcm9wZXJ0eSB0byBzZXQgdGhlIG5hbWUgb2YgdGhlIGNvbHVtbi4gRGVmYXVsdHMgdG8gdGhlIG5hbWUgb2Ygc291cmNlICsgcHJpbWFyeSBrZXkgb2Ygc291cmNlXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSAgICAgICBbb3B0aW9ucy5vdGhlcktleV0gVGhlIG5hbWUgb2YgdGhlIGZvcmVpZ24ga2V5IGluIHRoZSBqb2luIHRhYmxlIChyZXByZXNlbnRpbmcgdGhlIHRhcmdldCBtb2RlbCkgb3IgYW4gb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgdHlwZSBkZWZpbml0aW9uIGZvciB0aGUgb3RoZXIgY29sdW1uIChzZWUgYFNlcXVlbGl6ZS5kZWZpbmVgIGZvciBzeW50YXgpLiBXaGVuIHVzaW5nIGFuIG9iamVjdCwgeW91IGNhbiBhZGQgYSBgbmFtZWAgcHJvcGVydHkgdG8gc2V0IHRoZSBuYW1lIG9mIHRoZSBjb2x1bW4uIERlZmF1bHRzIHRvIHRoZSBuYW1lIG9mIHRhcmdldCArIHByaW1hcnkga2V5IG9mIHRhcmdldFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgICAgICAgW29wdGlvbnMuc2NvcGVdIEEga2V5L3ZhbHVlIHNldCB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgYXNzb2NpYXRpb24gY3JlYXRlIGFuZCBmaW5kIGRlZmF1bHRzIG9uIHRoZSB0YXJnZXQuIChzcWxpdGUgbm90IHN1cHBvcnRlZCBmb3IgTjpNKVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgW29wdGlvbnMudGltZXN0YW1wcz1zZXF1ZWxpemUub3B0aW9ucy50aW1lc3RhbXBzXSBTaG91bGQgdGhlIGpvaW4gbW9kZWwgaGF2ZSB0aW1lc3RhbXBzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgICAgICBbb3B0aW9ucy5vbkRlbGV0ZT0nU0VUJm5ic3A7TlVMTHxDQVNDQURFJ10gQ2FzY2FkZSBpZiB0aGlzIGlzIGEgbjptLCBhbmQgc2V0IG51bGwgaWYgaXQgaXMgYSAxOm1cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgICAgIFtvcHRpb25zLm9uVXBkYXRlPSdDQVNDQURFJ10gU2V0cyBgT04gVVBEQVRFYFxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gICAgICAgICAgICAgW29wdGlvbnMuY29uc3RyYWludHM9dHJ1ZV0gU2hvdWxkIG9uIHVwZGF0ZSBhbmQgb24gZGVsZXRlIGNvbnN0cmFpbnRzIGJlIGVuYWJsZWQgb24gdGhlIGZvcmVpZ24ga2V5LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMge0JlbG9uZ3NUb01hbnl9XHJcbiAgICpcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqIC8vIEF1dG9tYWdpY2FsbHkgZ2VuZXJhdGVkIGpvaW4gbW9kZWxcclxuICAgKiBVc2VyLmJlbG9uZ3NUb01hbnkoUHJvamVjdCwgeyB0aHJvdWdoOiAnVXNlclByb2plY3RzJyB9KVxyXG4gICAqIFByb2plY3QuYmVsb25nc1RvTWFueShVc2VyLCB7IHRocm91Z2g6ICdVc2VyUHJvamVjdHMnIH0pXHJcbiAgICpcclxuICAgKiAvLyBKb2luIG1vZGVsIHdpdGggYWRkaXRpb25hbCBhdHRyaWJ1dGVzXHJcbiAgICogY29uc3QgVXNlclByb2plY3RzID0gc2VxdWVsaXplLmRlZmluZSgnVXNlclByb2plY3RzJywge1xyXG4gICAqICAgc3RhcnRlZDogU2VxdWVsaXplLkJPT0xFQU5cclxuICAgKiB9KVxyXG4gICAqIFVzZXIuYmVsb25nc1RvTWFueShQcm9qZWN0LCB7IHRocm91Z2g6IFVzZXJQcm9qZWN0cyB9KVxyXG4gICAqIFByb2plY3QuYmVsb25nc1RvTWFueShVc2VyLCB7IHRocm91Z2g6IFVzZXJQcm9qZWN0cyB9KVxyXG4gICAqL1xyXG4gIHN0YXRpYyBiZWxvbmdzVG9NYW55KHRhcmdldCwgb3B0aW9ucykge30gLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGFuIGFzc29jaWF0aW9uIGJldHdlZW4gdGhpcyAodGhlIHNvdXJjZSkgYW5kIHRoZSBwcm92aWRlZCB0YXJnZXQuIFRoZSBmb3JlaWduIGtleSBpcyBhZGRlZCBvbiB0aGUgdGFyZ2V0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtNb2RlbH0gICAgICAgICAgIHRhcmdldCBUYXJnZXQgbW9kZWxcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgW29wdGlvbnNdIGhhc09uZSBhc3NvY2lhdGlvbiBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgIFtvcHRpb25zLmhvb2tzPWZhbHNlXSBTZXQgdG8gdHJ1ZSB0byBydW4gYmVmb3JlLS9hZnRlckRlc3Ryb3kgaG9va3Mgd2hlbiBhbiBhc3NvY2lhdGVkIG1vZGVsIGlzIGRlbGV0ZWQgYmVjYXVzZSBvZiBhIGNhc2NhZGUuIEZvciBleGFtcGxlIGlmIGBVc2VyLmhhc09uZShQcm9maWxlLCB7b25EZWxldGU6ICdjYXNjYWRlJywgaG9va3M6dHJ1ZX0pYCwgdGhlIGJlZm9yZS0vYWZ0ZXJEZXN0cm95IGhvb2tzIGZvciBwcm9maWxlIHdpbGwgYmUgY2FsbGVkIHdoZW4gYSB1c2VyIGlzIGRlbGV0ZWQuIE90aGVyd2lzZSB0aGUgcHJvZmlsZSB3aWxsIGJlIGRlbGV0ZWQgd2l0aG91dCBpbnZva2luZyBhbnkgaG9va3NcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMuYXNdIFRoZSBhbGlhcyBvZiB0aGlzIG1vZGVsLCBpbiBzaW5ndWxhciBmb3JtLiBTZWUgYWxzbyB0aGUgYG5hbWVgIG9wdGlvbiBwYXNzZWQgdG8gYHNlcXVlbGl6ZS5kZWZpbmVgLiBJZiB5b3UgY3JlYXRlIG11bHRpcGxlIGFzc29jaWF0aW9ucyBiZXR3ZWVuIHRoZSBzYW1lIHRhYmxlcywgeW91IHNob3VsZCBwcm92aWRlIGFuIGFsaWFzIHRvIGJlIGFibGUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiB0aGVtLiBJZiB5b3UgcHJvdmlkZSBhbiBhbGlhcyB3aGVuIGNyZWF0aW5nIHRoZSBhc3NvY2lhdGlvbiwgeW91IHNob3VsZCBwcm92aWRlIHRoZSBzYW1lIGFsaWFzIHdoZW4gZWFnZXIgbG9hZGluZyBhbmQgd2hlbiBnZXR0aW5nIGFzc29jaWF0ZWQgbW9kZWxzLiBEZWZhdWx0cyB0byB0aGUgc2luZ3VsYXJpemVkIG5hbWUgb2YgdGFyZ2V0XHJcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSAgIFtvcHRpb25zLmZvcmVpZ25LZXldIFRoZSBuYW1lIG9mIHRoZSBmb3JlaWduIGtleSBhdHRyaWJ1dGUgaW4gdGhlIHRhcmdldCBtb2RlbCBvciBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSB0eXBlIGRlZmluaXRpb24gZm9yIHRoZSBmb3JlaWduIGNvbHVtbiAoc2VlIGBTZXF1ZWxpemUuZGVmaW5lYCBmb3Igc3ludGF4KS4gV2hlbiB1c2luZyBhbiBvYmplY3QsIHlvdSBjYW4gYWRkIGEgYG5hbWVgIHByb3BlcnR5IHRvIHNldCB0aGUgbmFtZSBvZiB0aGUgY29sdW1uLiBEZWZhdWx0cyB0byB0aGUgbmFtZSBvZiBzb3VyY2UgKyBwcmltYXJ5IGtleSBvZiBzb3VyY2VcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMuc291cmNlS2V5XSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIHVzZSBhcyB0aGUga2V5IGZvciB0aGUgYXNzb2NpYXRpb24gaW4gdGhlIHNvdXJjZSB0YWJsZS4gRGVmYXVsdHMgdG8gdGhlIHByaW1hcnkga2V5IG9mIHRoZSBzb3VyY2UgdGFibGVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMub25EZWxldGU9J1NFVCZuYnNwO05VTEx8Q0FTQ0FERSddIFNFVCBOVUxMIGlmIGZvcmVpZ25LZXkgYWxsb3dzIG51bGxzLCBDQVNDQURFIGlmIG90aGVyd2lzZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICBbb3B0aW9ucy5vblVwZGF0ZT0nQ0FTQ0FERSddIFNldHMgJ09OIFVQREFURSdcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMuY29uc3RyYWludHM9dHJ1ZV0gU2hvdWxkIG9uIHVwZGF0ZSBhbmQgb24gZGVsZXRlIGNvbnN0cmFpbnRzIGJlIGVuYWJsZWQgb24gdGhlIGZvcmVpZ24ga2V5LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICBbb3B0aW9ucy51bmlxdWVLZXldIFRoZSBjdXN0b20gbmFtZSBmb3IgdW5pcXVlIGNvbnN0cmFpbnQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7SGFzT25lfVxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiBVc2VyLmhhc09uZShQcm9maWxlKSAvLyBUaGlzIHdpbGwgYWRkIHVzZXJJZCB0byB0aGUgcHJvZmlsZSB0YWJsZVxyXG4gICAqL1xyXG4gIHN0YXRpYyBoYXNPbmUodGFyZ2V0LCBvcHRpb25zKSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gYXNzb2NpYXRpb24gYmV0d2VlbiB0aGlzICh0aGUgc291cmNlKSBhbmQgdGhlIHByb3ZpZGVkIHRhcmdldC4gVGhlIGZvcmVpZ24ga2V5IGlzIGFkZGVkIG9uIHRoZSBzb3VyY2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSAgICAgICAgICAgdGFyZ2V0IFRoZSB0YXJnZXQgbW9kZWxcclxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICAgW29wdGlvbnNdIGJlbG9uZ3NUbyBhc3NvY2lhdGlvbiBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtib29sZWFufSAgICAgICAgIFtvcHRpb25zLmhvb2tzPWZhbHNlXSBTZXQgdG8gdHJ1ZSB0byBydW4gYmVmb3JlLS9hZnRlckRlc3Ryb3kgaG9va3Mgd2hlbiBhbiBhc3NvY2lhdGVkIG1vZGVsIGlzIGRlbGV0ZWQgYmVjYXVzZSBvZiBhIGNhc2NhZGUuIEZvciBleGFtcGxlIGlmIGBVc2VyLmhhc09uZShQcm9maWxlLCB7b25EZWxldGU6ICdjYXNjYWRlJywgaG9va3M6dHJ1ZX0pYCwgdGhlIGJlZm9yZS0vYWZ0ZXJEZXN0cm95IGhvb2tzIGZvciBwcm9maWxlIHdpbGwgYmUgY2FsbGVkIHdoZW4gYSB1c2VyIGlzIGRlbGV0ZWQuIE90aGVyd2lzZSB0aGUgcHJvZmlsZSB3aWxsIGJlIGRlbGV0ZWQgd2l0aG91dCBpbnZva2luZyBhbnkgaG9va3NcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMuYXNdIFRoZSBhbGlhcyBvZiB0aGlzIG1vZGVsLCBpbiBzaW5ndWxhciBmb3JtLiBTZWUgYWxzbyB0aGUgYG5hbWVgIG9wdGlvbiBwYXNzZWQgdG8gYHNlcXVlbGl6ZS5kZWZpbmVgLiBJZiB5b3UgY3JlYXRlIG11bHRpcGxlIGFzc29jaWF0aW9ucyBiZXR3ZWVuIHRoZSBzYW1lIHRhYmxlcywgeW91IHNob3VsZCBwcm92aWRlIGFuIGFsaWFzIHRvIGJlIGFibGUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiB0aGVtLiBJZiB5b3UgcHJvdmlkZSBhbiBhbGlhcyB3aGVuIGNyZWF0aW5nIHRoZSBhc3NvY2lhdGlvbiwgeW91IHNob3VsZCBwcm92aWRlIHRoZSBzYW1lIGFsaWFzIHdoZW4gZWFnZXIgbG9hZGluZyBhbmQgd2hlbiBnZXR0aW5nIGFzc29jaWF0ZWQgbW9kZWxzLiBEZWZhdWx0cyB0byB0aGUgc2luZ3VsYXJpemVkIG5hbWUgb2YgdGFyZ2V0XHJcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSAgIFtvcHRpb25zLmZvcmVpZ25LZXldIFRoZSBuYW1lIG9mIHRoZSBmb3JlaWduIGtleSBhdHRyaWJ1dGUgaW4gdGhlIHNvdXJjZSB0YWJsZSBvciBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSB0eXBlIGRlZmluaXRpb24gZm9yIHRoZSBmb3JlaWduIGNvbHVtbiAoc2VlIGBTZXF1ZWxpemUuZGVmaW5lYCBmb3Igc3ludGF4KS4gV2hlbiB1c2luZyBhbiBvYmplY3QsIHlvdSBjYW4gYWRkIGEgYG5hbWVgIHByb3BlcnR5IHRvIHNldCB0aGUgbmFtZSBvZiB0aGUgY29sdW1uLiBEZWZhdWx0cyB0byB0aGUgbmFtZSBvZiB0YXJnZXQgKyBwcmltYXJ5IGtleSBvZiB0YXJnZXRcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMudGFyZ2V0S2V5XSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIHVzZSBhcyB0aGUga2V5IGZvciB0aGUgYXNzb2NpYXRpb24gaW4gdGhlIHRhcmdldCB0YWJsZS4gRGVmYXVsdHMgdG8gdGhlIHByaW1hcnkga2V5IG9mIHRoZSB0YXJnZXQgdGFibGVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgW29wdGlvbnMub25EZWxldGU9J1NFVCZuYnNwO05VTEx8Tk8mbmJzcDtBQ1RJT04nXSBTRVQgTlVMTCBpZiBmb3JlaWduS2V5IGFsbG93cyBudWxscywgTk8gQUNUSU9OIGlmIG90aGVyd2lzZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgICBbb3B0aW9ucy5vblVwZGF0ZT0nQ0FTQ0FERSddIFNldHMgJ09OIFVQREFURSdcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59ICAgICAgICAgW29wdGlvbnMuY29uc3RyYWludHM9dHJ1ZV0gU2hvdWxkIG9uIHVwZGF0ZSBhbmQgb24gZGVsZXRlIGNvbnN0cmFpbnRzIGJlIGVuYWJsZWQgb24gdGhlIGZvcmVpZ24ga2V5LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMge0JlbG9uZ3NUb31cclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogUHJvZmlsZS5iZWxvbmdzVG8oVXNlcikgLy8gVGhpcyB3aWxsIGFkZCB1c2VySWQgdG8gdGhlIHByb2ZpbGUgdGFibGVcclxuICAgKi9cclxuICBzdGF0aWMgYmVsb25nc1RvKHRhcmdldCwgb3B0aW9ucykge30gLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG59XHJcblxyXG5PYmplY3QuYXNzaWduKE1vZGVsLCBhc3NvY2lhdGlvbnNNaXhpbik7XHJcbkhvb2tzLmFwcGx5VG8oTW9kZWwsIHRydWUpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbDtcclxuIl19