'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const Utils = require('./../utils');

const Helpers = require('./helpers');

const _ = require('lodash');

const Association = require('./base');

const Op = require('../operators');
/**
 * One-to-one association
 *
 * In the API reference below, add the name of the association to the method, e.g. for `User.hasOne(Project)` the getter will be `user.getProject()`.
 * This is almost the same as `belongsTo` with one exception - The foreign key will be defined on the target model.
 *
 * @see {@link Model.hasOne}
 */


let HasOne =
/*#__PURE__*/
function (_Association) {
  _inherits(HasOne, _Association);

  function HasOne(source, target, options) {
    var _this;

    _classCallCheck(this, HasOne);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(HasOne).call(this, source, target, options));
    _this.associationType = 'HasOne';
    _this.isSingleAssociation = true;
    _this.foreignKeyAttribute = {};

    if (_this.as) {
      _this.isAliased = true;
      _this.options.name = {
        singular: _this.as
      };
    } else {
      _this.as = _this.target.options.name.singular;
      _this.options.name = _this.target.options.name;
    }

    if (_.isObject(_this.options.foreignKey)) {
      _this.foreignKeyAttribute = _this.options.foreignKey;
      _this.foreignKey = _this.foreignKeyAttribute.name || _this.foreignKeyAttribute.fieldName;
    } else if (_this.options.foreignKey) {
      _this.foreignKey = _this.options.foreignKey;
    }

    if (!_this.foreignKey) {
      _this.foreignKey = Utils.camelize([Utils.singularize(_this.options.as || _this.source.name), _this.source.primaryKeyAttribute].join('_'));
    }

    if (_this.options.sourceKey && !_this.source.rawAttributes[_this.options.sourceKey]) {
      throw new Error(`Unknown attribute "${_this.options.sourceKey}" passed as sourceKey, define this attribute on model "${_this.source.name}" first`);
    }

    _this.sourceKey = _this.sourceKeyAttribute = _this.options.sourceKey || _this.source.primaryKeyAttribute;
    _this.sourceKeyField = _this.source.rawAttributes[_this.sourceKey].field || _this.sourceKey;
    _this.sourceKeyIsPrimary = _this.sourceKey === _this.source.primaryKeyAttribute;
    _this.associationAccessor = _this.as;
    _this.options.useHooks = options.useHooks;

    if (_this.target.rawAttributes[_this.foreignKey]) {
      _this.identifierField = _this.target.rawAttributes[_this.foreignKey].field || _this.foreignKey;
    } // Get singular name, trying to uppercase the first letter, unless the model forbids it


    const singular = _.upperFirst(_this.options.name.singular);

    _this.accessors = {
      get: `get${singular}`,
      set: `set${singular}`,
      create: `create${singular}`
    };
    return _this;
  } // the id is in the target table


  _createClass(HasOne, [{
    key: "_injectAttributes",
    value: function _injectAttributes() {
      const newAttributes = {};
      newAttributes[this.foreignKey] = _.defaults({}, this.foreignKeyAttribute, {
        type: this.options.keyType || this.source.rawAttributes[this.sourceKey].type,
        allowNull: true
      });

      if (this.options.constraints !== false) {
        const target = this.target.rawAttributes[this.foreignKey] || newAttributes[this.foreignKey];
        this.options.onDelete = this.options.onDelete || (target.allowNull ? 'SET NULL' : 'CASCADE');
        this.options.onUpdate = this.options.onUpdate || 'CASCADE';
      }

      Helpers.addForeignKeyConstraints(newAttributes[this.foreignKey], this.source, this.target, this.options, this.sourceKeyField);
      Utils.mergeDefaults(this.target.rawAttributes, newAttributes);
      this.target.refreshAttributes();
      this.identifierField = this.target.rawAttributes[this.foreignKey].field || this.foreignKey;
      Helpers.checkNamingCollision(this);
      return this;
    }
  }, {
    key: "mixin",
    value: function mixin(obj) {
      const methods = ['get', 'set', 'create'];
      Helpers.mixinMethods(this, obj, methods);
    }
    /**
     * Get the associated instance.
     *
     * @param {Model|Array<Model>} instances source instances
     * @param {Object}         [options] find options
     * @param {string|boolean} [options.scope] Apply a scope on the related model, or remove its default scope by passing false
     * @param {string} [options.schema] Apply a schema on the related model
     *
     * @see
     * {@link Model.findOne} for a full explanation of options
     *
     * @returns {Promise<Model>}
     */

  }, {
    key: "get",
    value: function get(instances, options) {
      const where = {};
      let Target = this.target;
      let instance;
      options = Utils.cloneDeep(options);

      if (Object.prototype.hasOwnProperty.call(options, 'scope')) {
        if (!options.scope) {
          Target = Target.unscoped();
        } else {
          Target = Target.scope(options.scope);
        }
      }

      if (Object.prototype.hasOwnProperty.call(options, 'schema')) {
        Target = Target.schema(options.schema, options.schemaDelimiter);
      }

      if (!Array.isArray(instances)) {
        instance = instances;
        instances = undefined;
      }

      if (instances) {
        where[this.foreignKey] = {
          [Op.in]: instances.map(instance => instance.get(this.sourceKey))
        };
      } else {
        where[this.foreignKey] = instance.get(this.sourceKey);
      }

      if (this.scope) {
        Object.assign(where, this.scope);
      }

      options.where = options.where ? {
        [Op.and]: [where, options.where]
      } : where;

      if (instances) {
        return Target.findAll(options).then(results => {
          const result = {};

          for (const instance of instances) {
            result[instance.get(this.sourceKey, {
              raw: true
            })] = null;
          }

          for (const instance of results) {
            result[instance.get(this.foreignKey, {
              raw: true
            })] = instance;
          }

          return result;
        });
      }

      return Target.findOne(options);
    }
    /**
     * Set the associated model.
     *
     * @param {Model} sourceInstance the source instance
     * @param {?<Model>|string|number} [associatedInstance] An persisted instance or the primary key of an instance to associate with this. Pass `null` or `undefined` to remove the association.
     * @param {Object} [options] Options passed to getAssociation and `target.save`
     *
     * @returns {Promise}
     */

  }, {
    key: "set",
    value: function set(sourceInstance, associatedInstance, options) {
      let alreadyAssociated;
      options = Object.assign({}, options, {
        scope: false
      });
      return sourceInstance[this.accessors.get](options).then(oldInstance => {
        // TODO Use equals method once #5605 is resolved
        alreadyAssociated = oldInstance && associatedInstance && this.target.primaryKeyAttributes.every(attribute => oldInstance.get(attribute, {
          raw: true
        }) === (associatedInstance.get ? associatedInstance.get(attribute, {
          raw: true
        }) : associatedInstance));

        if (oldInstance && !alreadyAssociated) {
          oldInstance[this.foreignKey] = null;
          return oldInstance.save(Object.assign({}, options, {
            fields: [this.foreignKey],
            allowNull: [this.foreignKey],
            association: true
          }));
        }
      }).then(() => {
        if (associatedInstance && !alreadyAssociated) {
          if (!(associatedInstance instanceof this.target)) {
            const tmpInstance = {};
            tmpInstance[this.target.primaryKeyAttribute] = associatedInstance;
            associatedInstance = this.target.build(tmpInstance, {
              isNewRecord: false
            });
          }

          Object.assign(associatedInstance, this.scope);
          associatedInstance.set(this.foreignKey, sourceInstance.get(this.sourceKeyAttribute));
          return associatedInstance.save(options);
        }

        return null;
      });
    }
    /**
     * Create a new instance of the associated model and associate it with this.
     *
     * @param {Model} sourceInstance the source instance
     * @param {Object} [values={}] values to create associated model instance with
     * @param {Object} [options] Options passed to `target.create` and setAssociation.
     *
     * @see
     * {@link Model#create} for a full explanation of options
     *
     * @returns {Promise<Model>} The created target model
     */

  }, {
    key: "create",
    value: function create(sourceInstance, values, options) {
      values = values || {};
      options = options || {};

      if (this.scope) {
        for (const attribute of Object.keys(this.scope)) {
          values[attribute] = this.scope[attribute];

          if (options.fields) {
            options.fields.push(attribute);
          }
        }
      }

      values[this.foreignKey] = sourceInstance.get(this.sourceKeyAttribute);

      if (options.fields) {
        options.fields.push(this.foreignKey);
      }

      return this.target.create(values, options);
    }
  }, {
    key: "verifyAssociationAlias",
    value: function verifyAssociationAlias(alias) {
      if (typeof alias === 'string') {
        return this.as === alias;
      }

      if (alias && alias.singular) {
        return this.as === alias.singular;
      }

      return !this.isAliased;
    }
  }]);

  return HasOne;
}(Association);

module.exports = HasOne;