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


let HasOne = /*#__PURE__*/function (_Association) {
  _inherits(HasOne, _Association);

  var _super = _createSuper(HasOne);

  function HasOne(source, target, options) {
    var _this;

    _classCallCheck(this, HasOne);

    _this = _super.call(this, source, target, options);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvaGFzLW9uZS5qcyJdLCJuYW1lcyI6WyJVdGlscyIsInJlcXVpcmUiLCJIZWxwZXJzIiwiXyIsIkFzc29jaWF0aW9uIiwiT3AiLCJIYXNPbmUiLCJzb3VyY2UiLCJ0YXJnZXQiLCJvcHRpb25zIiwiYXNzb2NpYXRpb25UeXBlIiwiaXNTaW5nbGVBc3NvY2lhdGlvbiIsImZvcmVpZ25LZXlBdHRyaWJ1dGUiLCJhcyIsImlzQWxpYXNlZCIsIm5hbWUiLCJzaW5ndWxhciIsImlzT2JqZWN0IiwiZm9yZWlnbktleSIsImZpZWxkTmFtZSIsImNhbWVsaXplIiwic2luZ3VsYXJpemUiLCJwcmltYXJ5S2V5QXR0cmlidXRlIiwiam9pbiIsInNvdXJjZUtleSIsInJhd0F0dHJpYnV0ZXMiLCJFcnJvciIsInNvdXJjZUtleUF0dHJpYnV0ZSIsInNvdXJjZUtleUZpZWxkIiwiZmllbGQiLCJzb3VyY2VLZXlJc1ByaW1hcnkiLCJhc3NvY2lhdGlvbkFjY2Vzc29yIiwidXNlSG9va3MiLCJpZGVudGlmaWVyRmllbGQiLCJ1cHBlckZpcnN0IiwiYWNjZXNzb3JzIiwiZ2V0Iiwic2V0IiwiY3JlYXRlIiwibmV3QXR0cmlidXRlcyIsImRlZmF1bHRzIiwidHlwZSIsImtleVR5cGUiLCJhbGxvd051bGwiLCJjb25zdHJhaW50cyIsIm9uRGVsZXRlIiwib25VcGRhdGUiLCJhZGRGb3JlaWduS2V5Q29uc3RyYWludHMiLCJtZXJnZURlZmF1bHRzIiwicmVmcmVzaEF0dHJpYnV0ZXMiLCJjaGVja05hbWluZ0NvbGxpc2lvbiIsIm9iaiIsIm1ldGhvZHMiLCJtaXhpbk1ldGhvZHMiLCJpbnN0YW5jZXMiLCJ3aGVyZSIsIlRhcmdldCIsImluc3RhbmNlIiwiY2xvbmVEZWVwIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwic2NvcGUiLCJ1bnNjb3BlZCIsInNjaGVtYSIsInNjaGVtYURlbGltaXRlciIsIkFycmF5IiwiaXNBcnJheSIsInVuZGVmaW5lZCIsImluIiwibWFwIiwiYXNzaWduIiwiYW5kIiwiZmluZEFsbCIsInRoZW4iLCJyZXN1bHRzIiwicmVzdWx0IiwicmF3IiwiZmluZE9uZSIsInNvdXJjZUluc3RhbmNlIiwiYXNzb2NpYXRlZEluc3RhbmNlIiwiYWxyZWFkeUFzc29jaWF0ZWQiLCJvbGRJbnN0YW5jZSIsInByaW1hcnlLZXlBdHRyaWJ1dGVzIiwiZXZlcnkiLCJhdHRyaWJ1dGUiLCJzYXZlIiwiZmllbGRzIiwiYXNzb2NpYXRpb24iLCJ0bXBJbnN0YW5jZSIsImJ1aWxkIiwiaXNOZXdSZWNvcmQiLCJ2YWx1ZXMiLCJrZXlzIiwicHVzaCIsImFsaWFzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxZQUFELENBQXJCOztBQUNBLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFDLFdBQUQsQ0FBdkI7O0FBQ0EsTUFBTUUsQ0FBQyxHQUFHRixPQUFPLENBQUMsUUFBRCxDQUFqQjs7QUFDQSxNQUFNRyxXQUFXLEdBQUdILE9BQU8sQ0FBQyxRQUFELENBQTNCOztBQUNBLE1BQU1JLEVBQUUsR0FBR0osT0FBTyxDQUFDLGNBQUQsQ0FBbEI7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7SUFDTUssTTs7Ozs7QUFDSixrQkFBWUMsTUFBWixFQUFvQkMsTUFBcEIsRUFBNEJDLE9BQTVCLEVBQXFDO0FBQUE7O0FBQUE7O0FBQ25DLDhCQUFNRixNQUFOLEVBQWNDLE1BQWQsRUFBc0JDLE9BQXRCO0FBRUEsVUFBS0MsZUFBTCxHQUF1QixRQUF2QjtBQUNBLFVBQUtDLG1CQUFMLEdBQTJCLElBQTNCO0FBQ0EsVUFBS0MsbUJBQUwsR0FBMkIsRUFBM0I7O0FBRUEsUUFBSSxNQUFLQyxFQUFULEVBQWE7QUFDWCxZQUFLQyxTQUFMLEdBQWlCLElBQWpCO0FBQ0EsWUFB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QSxLQUFLLElBQUlBLEtBQUssQ0FBQ2hGLFFBQW5CLEVBQTZCO0FBQzNCLGVBQU8sS0FBS0gsRUFBTCxLQUFZbUYsS0FBSyxDQUFDaEYsUUFBekI7QUFDRDs7QUFFRCxhQUFPLENBQUMsS0FBS0YsU0FBYjtBQUNEOzs7O0VBcFFrQlYsVzs7QUF1UXJCNkYsTUFBTSxDQUFDQyxPQUFQLEdBQWlCNUYsTUFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xuY29uc3QgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgQXNzb2NpYXRpb24gPSByZXF1aXJlKCcuL2Jhc2UnKTtcbmNvbnN0IE9wID0gcmVxdWlyZSgnLi4vb3BlcmF0b3JzJyk7XG5cbi8qKlxuICogT25lLXRvLW9uZSBhc3NvY2lhdGlvblxuICpcbiAqIEluIHRoZSBBUEkgcmVmZXJlbmNlIGJlbG93LCBhZGQgdGhlIG5hbWUgb2YgdGhlIGFzc29jaWF0aW9uIHRvIHRoZSBtZXRob2QsIGUuZy4gZm9yIGBVc2VyLmhhc09uZShQcm9qZWN0KWAgdGhlIGdldHRlciB3aWxsIGJlIGB1c2VyLmdldFByb2plY3QoKWAuXG4gKiBUaGlzIGlzIGFsbW9zdCB0aGUgc2FtZSBhcyBgYmVsb25nc1RvYCB3aXRoIG9uZSBleGNlcHRpb24gLSBUaGUgZm9yZWlnbiBrZXkgd2lsbCBiZSBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgbW9kZWwuXG4gKlxuICogQHNlZSB7QGxpbmsgTW9kZWwuaGFzT25lfVxuICovXG5jbGFzcyBIYXNPbmUgZXh0ZW5kcyBBc3NvY2lhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHNvdXJjZSwgdGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgc3VwZXIoc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5hc3NvY2lhdGlvblR5cGUgPSAnSGFzT25lJztcbiAgICB0aGlzLmlzU2luZ2xlQXNzb2NpYXRpb24gPSB0cnVlO1xuICAgIHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZSA9IHt9O1xuXG4gICAgaWYgKHRoaXMuYXMpIHtcbiAgICAgIHRoaXMuaXNBbGlhc2VkID0gdHJ1ZTtcbiAgICAgIHRoaXMub3B0aW9ucy5uYW1lID0ge1xuICAgICAgICBzaW5ndWxhcjogdGhpcy5hc1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hcyA9IHRoaXMudGFyZ2V0Lm9wdGlvbnMubmFtZS5zaW5ndWxhcjtcbiAgICAgIHRoaXMub3B0aW9ucy5uYW1lID0gdGhpcy50YXJnZXQub3B0aW9ucy5uYW1lO1xuICAgIH1cblxuICAgIGlmIChfLmlzT2JqZWN0KHRoaXMub3B0aW9ucy5mb3JlaWduS2V5KSkge1xuICAgICAgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlID0gdGhpcy5vcHRpb25zLmZvcmVpZ25LZXk7XG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUubmFtZSB8fCB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUuZmllbGROYW1lO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmZvcmVpZ25LZXkpIHtcbiAgICAgIHRoaXMuZm9yZWlnbktleSA9IHRoaXMub3B0aW9ucy5mb3JlaWduS2V5O1xuICAgIH1cblxuICAgIGlmICghdGhpcy5mb3JlaWduS2V5KSB7XG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSBVdGlscy5jYW1lbGl6ZShcbiAgICAgICAgW1xuICAgICAgICAgIFV0aWxzLnNpbmd1bGFyaXplKHRoaXMub3B0aW9ucy5hcyB8fCB0aGlzLnNvdXJjZS5uYW1lKSxcbiAgICAgICAgICB0aGlzLnNvdXJjZS5wcmltYXJ5S2V5QXR0cmlidXRlXG4gICAgICAgIF0uam9pbignXycpXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMub3B0aW9ucy5zb3VyY2VLZXlcbiAgICAgICYmICF0aGlzLnNvdXJjZS5yYXdBdHRyaWJ1dGVzW3RoaXMub3B0aW9ucy5zb3VyY2VLZXldXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXR0cmlidXRlIFwiJHt0aGlzLm9wdGlvbnMuc291cmNlS2V5fVwiIHBhc3NlZCBhcyBzb3VyY2VLZXksIGRlZmluZSB0aGlzIGF0dHJpYnV0ZSBvbiBtb2RlbCBcIiR7dGhpcy5zb3VyY2UubmFtZX1cIiBmaXJzdGApO1xuICAgIH1cblxuICAgIHRoaXMuc291cmNlS2V5ID0gdGhpcy5zb3VyY2VLZXlBdHRyaWJ1dGUgPSB0aGlzLm9wdGlvbnMuc291cmNlS2V5IHx8IHRoaXMuc291cmNlLnByaW1hcnlLZXlBdHRyaWJ1dGU7XG4gICAgdGhpcy5zb3VyY2VLZXlGaWVsZCA9IHRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5zb3VyY2VLZXldLmZpZWxkIHx8IHRoaXMuc291cmNlS2V5O1xuICAgIHRoaXMuc291cmNlS2V5SXNQcmltYXJ5ID0gdGhpcy5zb3VyY2VLZXkgPT09IHRoaXMuc291cmNlLnByaW1hcnlLZXlBdHRyaWJ1dGU7XG5cbiAgICB0aGlzLmFzc29jaWF0aW9uQWNjZXNzb3IgPSB0aGlzLmFzO1xuICAgIHRoaXMub3B0aW9ucy51c2VIb29rcyA9IG9wdGlvbnMudXNlSG9va3M7XG5cbiAgICBpZiAodGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldKSB7XG4gICAgICB0aGlzLmlkZW50aWZpZXJGaWVsZCA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5maWVsZCB8fCB0aGlzLmZvcmVpZ25LZXk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHNpbmd1bGFyIG5hbWUsIHRyeWluZyB0byB1cHBlcmNhc2UgdGhlIGZpcnN0IGxldHRlciwgdW5sZXNzIHRoZSBtb2RlbCBmb3JiaWRzIGl0XG4gICAgY29uc3Qgc2luZ3VsYXIgPSBfLnVwcGVyRmlyc3QodGhpcy5vcHRpb25zLm5hbWUuc2luZ3VsYXIpO1xuXG4gICAgdGhpcy5hY2Nlc3NvcnMgPSB7XG4gICAgICBnZXQ6IGBnZXQke3Npbmd1bGFyfWAsXG4gICAgICBzZXQ6IGBzZXQke3Npbmd1bGFyfWAsXG4gICAgICBjcmVhdGU6IGBjcmVhdGUke3Npbmd1bGFyfWBcbiAgICB9O1xuICB9XG5cbiAgLy8gdGhlIGlkIGlzIGluIHRoZSB0YXJnZXQgdGFibGVcbiAgX2luamVjdEF0dHJpYnV0ZXMoKSB7XG4gICAgY29uc3QgbmV3QXR0cmlidXRlcyA9IHt9O1xuXG4gICAgbmV3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldID0gXy5kZWZhdWx0cyh7fSwgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlLCB7XG4gICAgICB0eXBlOiB0aGlzLm9wdGlvbnMua2V5VHlwZSB8fCB0aGlzLnNvdXJjZS5yYXdBdHRyaWJ1dGVzW3RoaXMuc291cmNlS2V5XS50eXBlLFxuICAgICAgYWxsb3dOdWxsOiB0cnVlXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzICE9PSBmYWxzZSkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldIHx8IG5ld0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XTtcbiAgICAgIHRoaXMub3B0aW9ucy5vbkRlbGV0ZSA9IHRoaXMub3B0aW9ucy5vbkRlbGV0ZSB8fCAodGFyZ2V0LmFsbG93TnVsbCA/ICdTRVQgTlVMTCcgOiAnQ0FTQ0FERScpO1xuICAgICAgdGhpcy5vcHRpb25zLm9uVXBkYXRlID0gdGhpcy5vcHRpb25zLm9uVXBkYXRlIHx8ICdDQVNDQURFJztcbiAgICB9XG5cbiAgICBIZWxwZXJzLmFkZEZvcmVpZ25LZXlDb25zdHJhaW50cyhuZXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0sIHRoaXMuc291cmNlLCB0aGlzLnRhcmdldCwgdGhpcy5vcHRpb25zLCB0aGlzLnNvdXJjZUtleUZpZWxkKTtcbiAgICBVdGlscy5tZXJnZURlZmF1bHRzKHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXMsIG5ld0F0dHJpYnV0ZXMpO1xuXG4gICAgdGhpcy50YXJnZXQucmVmcmVzaEF0dHJpYnV0ZXMoKTtcblxuICAgIHRoaXMuaWRlbnRpZmllckZpZWxkID0gdGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldLmZpZWxkIHx8IHRoaXMuZm9yZWlnbktleTtcblxuICAgIEhlbHBlcnMuY2hlY2tOYW1pbmdDb2xsaXNpb24odGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG1peGluKG9iaikge1xuICAgIGNvbnN0IG1ldGhvZHMgPSBbJ2dldCcsICdzZXQnLCAnY3JlYXRlJ107XG5cbiAgICBIZWxwZXJzLm1peGluTWV0aG9kcyh0aGlzLCBvYmosIG1ldGhvZHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYXNzb2NpYXRlZCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbHxBcnJheTxNb2RlbD59IGluc3RhbmNlcyBzb3VyY2UgaW5zdGFuY2VzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgIFtvcHRpb25zXSBmaW5kIG9wdGlvbnNcbiAgICogQHBhcmFtIHtzdHJpbmd8Ym9vbGVhbn0gW29wdGlvbnMuc2NvcGVdIEFwcGx5IGEgc2NvcGUgb24gdGhlIHJlbGF0ZWQgbW9kZWwsIG9yIHJlbW92ZSBpdHMgZGVmYXVsdCBzY29wZSBieSBwYXNzaW5nIGZhbHNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2hlbWFdIEFwcGx5IGEgc2NoZW1hIG9uIHRoZSByZWxhdGVkIG1vZGVsXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRPbmV9IGZvciBhIGZ1bGwgZXhwbGFuYXRpb24gb2Ygb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbD59XG4gICAqL1xuICBnZXQoaW5zdGFuY2VzLCBvcHRpb25zKSB7XG4gICAgY29uc3Qgd2hlcmUgPSB7fTtcblxuICAgIGxldCBUYXJnZXQgPSB0aGlzLnRhcmdldDtcbiAgICBsZXQgaW5zdGFuY2U7XG5cbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xuXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAnc2NvcGUnKSkge1xuICAgICAgaWYgKCFvcHRpb25zLnNjb3BlKSB7XG4gICAgICAgIFRhcmdldCA9IFRhcmdldC51bnNjb3BlZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgVGFyZ2V0ID0gVGFyZ2V0LnNjb3BlKG9wdGlvbnMuc2NvcGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgJ3NjaGVtYScpKSB7XG4gICAgICBUYXJnZXQgPSBUYXJnZXQuc2NoZW1hKG9wdGlvbnMuc2NoZW1hLCBvcHRpb25zLnNjaGVtYURlbGltaXRlcik7XG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGluc3RhbmNlcykpIHtcbiAgICAgIGluc3RhbmNlID0gaW5zdGFuY2VzO1xuICAgICAgaW5zdGFuY2VzID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmIChpbnN0YW5jZXMpIHtcbiAgICAgIHdoZXJlW3RoaXMuZm9yZWlnbktleV0gPSB7XG4gICAgICAgIFtPcC5pbl06IGluc3RhbmNlcy5tYXAoaW5zdGFuY2UgPT4gaW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5KSlcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoZXJlW3RoaXMuZm9yZWlnbktleV0gPSBpbnN0YW5jZS5nZXQodGhpcy5zb3VyY2VLZXkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNjb3BlKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHdoZXJlLCB0aGlzLnNjb3BlKTtcbiAgICB9XG5cbiAgICBvcHRpb25zLndoZXJlID0gb3B0aW9ucy53aGVyZSA/XG4gICAgICB7IFtPcC5hbmRdOiBbd2hlcmUsIG9wdGlvbnMud2hlcmVdIH0gOlxuICAgICAgd2hlcmU7XG5cbiAgICBpZiAoaW5zdGFuY2VzKSB7XG4gICAgICByZXR1cm4gVGFyZ2V0LmZpbmRBbGwob3B0aW9ucykudGhlbihyZXN1bHRzID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAoY29uc3QgaW5zdGFuY2Ugb2YgaW5zdGFuY2VzKSB7XG4gICAgICAgICAgcmVzdWx0W2luc3RhbmNlLmdldCh0aGlzLnNvdXJjZUtleSwgeyByYXc6IHRydWUgfSldID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgaW5zdGFuY2Ugb2YgcmVzdWx0cykge1xuICAgICAgICAgIHJlc3VsdFtpbnN0YW5jZS5nZXQodGhpcy5mb3JlaWduS2V5LCB7IHJhdzogdHJ1ZSB9KV0gPSBpbnN0YW5jZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gVGFyZ2V0LmZpbmRPbmUob3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBhc3NvY2lhdGVkIG1vZGVsLlxuICAgKlxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSB0aGUgc291cmNlIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7PzxNb2RlbD58c3RyaW5nfG51bWJlcn0gW2Fzc29jaWF0ZWRJbnN0YW5jZV0gQW4gcGVyc2lzdGVkIGluc3RhbmNlIG9yIHRoZSBwcmltYXJ5IGtleSBvZiBhbiBpbnN0YW5jZSB0byBhc3NvY2lhdGUgd2l0aCB0aGlzLiBQYXNzIGBudWxsYCBvciBgdW5kZWZpbmVkYCB0byByZW1vdmUgdGhlIGFzc29jaWF0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGdldEFzc29jaWF0aW9uIGFuZCBgdGFyZ2V0LnNhdmVgXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgc2V0KHNvdXJjZUluc3RhbmNlLCBhc3NvY2lhdGVkSW5zdGFuY2UsIG9wdGlvbnMpIHtcbiAgICBsZXQgYWxyZWFkeUFzc29jaWF0ZWQ7XG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgc2NvcGU6IGZhbHNlXG4gICAgfSk7XG5cbiAgICByZXR1cm4gc291cmNlSW5zdGFuY2VbdGhpcy5hY2Nlc3NvcnMuZ2V0XShvcHRpb25zKS50aGVuKG9sZEluc3RhbmNlID0+IHtcbiAgICAgIC8vIFRPRE8gVXNlIGVxdWFscyBtZXRob2Qgb25jZSAjNTYwNSBpcyByZXNvbHZlZFxuICAgICAgYWxyZWFkeUFzc29jaWF0ZWQgPSBvbGRJbnN0YW5jZSAmJiBhc3NvY2lhdGVkSW5zdGFuY2UgJiYgdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZXMuZXZlcnkoYXR0cmlidXRlID0+XG4gICAgICAgIG9sZEluc3RhbmNlLmdldChhdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pID09PSAoYXNzb2NpYXRlZEluc3RhbmNlLmdldCA/IGFzc29jaWF0ZWRJbnN0YW5jZS5nZXQoYXR0cmlidXRlLCB7IHJhdzogdHJ1ZSB9KSA6IGFzc29jaWF0ZWRJbnN0YW5jZSlcbiAgICAgICk7XG5cbiAgICAgIGlmIChvbGRJbnN0YW5jZSAmJiAhYWxyZWFkeUFzc29jaWF0ZWQpIHtcbiAgICAgICAgb2xkSW5zdGFuY2VbdGhpcy5mb3JlaWduS2V5XSA9IG51bGw7XG4gICAgICAgIHJldHVybiBvbGRJbnN0YW5jZS5zYXZlKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICBmaWVsZHM6IFt0aGlzLmZvcmVpZ25LZXldLFxuICAgICAgICAgIGFsbG93TnVsbDogW3RoaXMuZm9yZWlnbktleV0sXG4gICAgICAgICAgYXNzb2NpYXRpb246IHRydWVcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKGFzc29jaWF0ZWRJbnN0YW5jZSAmJiAhYWxyZWFkeUFzc29jaWF0ZWQpIHtcbiAgICAgICAgaWYgKCEoYXNzb2NpYXRlZEluc3RhbmNlIGluc3RhbmNlb2YgdGhpcy50YXJnZXQpKSB7XG4gICAgICAgICAgY29uc3QgdG1wSW5zdGFuY2UgPSB7fTtcbiAgICAgICAgICB0bXBJbnN0YW5jZVt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXSA9IGFzc29jaWF0ZWRJbnN0YW5jZTtcbiAgICAgICAgICBhc3NvY2lhdGVkSW5zdGFuY2UgPSB0aGlzLnRhcmdldC5idWlsZCh0bXBJbnN0YW5jZSwge1xuICAgICAgICAgICAgaXNOZXdSZWNvcmQ6IGZhbHNlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBPYmplY3QuYXNzaWduKGFzc29jaWF0ZWRJbnN0YW5jZSwgdGhpcy5zY29wZSk7XG4gICAgICAgIGFzc29jaWF0ZWRJbnN0YW5jZS5zZXQodGhpcy5mb3JlaWduS2V5LCBzb3VyY2VJbnN0YW5jZS5nZXQodGhpcy5zb3VyY2VLZXlBdHRyaWJ1dGUpKTtcblxuICAgICAgICByZXR1cm4gYXNzb2NpYXRlZEluc3RhbmNlLnNhdmUob3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYXNzb2NpYXRlZCBtb2RlbCBhbmQgYXNzb2NpYXRlIGl0IHdpdGggdGhpcy5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2UgdGhlIHNvdXJjZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW3ZhbHVlcz17fV0gdmFsdWVzIHRvIGNyZWF0ZSBhc3NvY2lhdGVkIG1vZGVsIGluc3RhbmNlIHdpdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGFyZ2V0LmNyZWF0ZWAgYW5kIHNldEFzc29jaWF0aW9uLlxuICAgKlxuICAgKiBAc2VlXG4gICAqIHtAbGluayBNb2RlbCNjcmVhdGV9IGZvciBhIGZ1bGwgZXhwbGFuYXRpb24gb2Ygb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbD59IFRoZSBjcmVhdGVkIHRhcmdldCBtb2RlbFxuICAgKi9cbiAgY3JlYXRlKHNvdXJjZUluc3RhbmNlLCB2YWx1ZXMsIG9wdGlvbnMpIHtcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgfHwge307XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAodGhpcy5zY29wZSkge1xuICAgICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgT2JqZWN0LmtleXModGhpcy5zY29wZSkpIHtcbiAgICAgICAgdmFsdWVzW2F0dHJpYnV0ZV0gPSB0aGlzLnNjb3BlW2F0dHJpYnV0ZV07XG4gICAgICAgIGlmIChvcHRpb25zLmZpZWxkcykge1xuICAgICAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2goYXR0cmlidXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhbHVlc1t0aGlzLmZvcmVpZ25LZXldID0gc291cmNlSW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5QXR0cmlidXRlKTtcbiAgICBpZiAob3B0aW9ucy5maWVsZHMpIHtcbiAgICAgIG9wdGlvbnMuZmllbGRzLnB1c2godGhpcy5mb3JlaWduS2V5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50YXJnZXQuY3JlYXRlKHZhbHVlcywgb3B0aW9ucyk7XG4gIH1cblxuICB2ZXJpZnlBc3NvY2lhdGlvbkFsaWFzKGFsaWFzKSB7XG4gICAgaWYgKHR5cGVvZiBhbGlhcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLmFzID09PSBhbGlhcztcbiAgICB9XG5cbiAgICBpZiAoYWxpYXMgJiYgYWxpYXMuc2luZ3VsYXIpIHtcbiAgICAgIHJldHVybiB0aGlzLmFzID09PSBhbGlhcy5zaW5ndWxhcjtcbiAgICB9XG5cbiAgICByZXR1cm4gIXRoaXMuaXNBbGlhc2VkO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSGFzT25lO1xuIl19