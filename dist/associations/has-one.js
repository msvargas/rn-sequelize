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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvaGFzLW9uZS5qcyJdLCJuYW1lcyI6WyJVdGlscyIsInJlcXVpcmUiLCJIZWxwZXJzIiwiXyIsIkFzc29jaWF0aW9uIiwiT3AiLCJIYXNPbmUiLCJzb3VyY2UiLCJ0YXJnZXQiLCJvcHRpb25zIiwiYXNzb2NpYXRpb25UeXBlIiwiaXNTaW5nbGVBc3NvY2lhdGlvbiIsImZvcmVpZ25LZXlBdHRyaWJ1dGUiLCJhcyIsImlzQWxpYXNlZCIsIm5hbWUiLCJzaW5ndWxhciIsImlzT2JqZWN0IiwiZm9yZWlnbktleSIsImZpZWxkTmFtZSIsImNhbWVsaXplIiwic2luZ3VsYXJpemUiLCJwcmltYXJ5S2V5QXR0cmlidXRlIiwiam9pbiIsInNvdXJjZUtleSIsInJhd0F0dHJpYnV0ZXMiLCJFcnJvciIsInNvdXJjZUtleUF0dHJpYnV0ZSIsInNvdXJjZUtleUZpZWxkIiwiZmllbGQiLCJzb3VyY2VLZXlJc1ByaW1hcnkiLCJhc3NvY2lhdGlvbkFjY2Vzc29yIiwidXNlSG9va3MiLCJpZGVudGlmaWVyRmllbGQiLCJ1cHBlckZpcnN0IiwiYWNjZXNzb3JzIiwiZ2V0Iiwic2V0IiwiY3JlYXRlIiwibmV3QXR0cmlidXRlcyIsImRlZmF1bHRzIiwidHlwZSIsImtleVR5cGUiLCJhbGxvd051bGwiLCJjb25zdHJhaW50cyIsIm9uRGVsZXRlIiwib25VcGRhdGUiLCJhZGRGb3JlaWduS2V5Q29uc3RyYWludHMiLCJtZXJnZURlZmF1bHRzIiwicmVmcmVzaEF0dHJpYnV0ZXMiLCJjaGVja05hbWluZ0NvbGxpc2lvbiIsIm9iaiIsIm1ldGhvZHMiLCJtaXhpbk1ldGhvZHMiLCJpbnN0YW5jZXMiLCJ3aGVyZSIsIlRhcmdldCIsImluc3RhbmNlIiwiY2xvbmVEZWVwIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwic2NvcGUiLCJ1bnNjb3BlZCIsInNjaGVtYSIsInNjaGVtYURlbGltaXRlciIsIkFycmF5IiwiaXNBcnJheSIsInVuZGVmaW5lZCIsImluIiwibWFwIiwiYXNzaWduIiwiYW5kIiwiZmluZEFsbCIsInRoZW4iLCJyZXN1bHRzIiwicmVzdWx0IiwicmF3IiwiZmluZE9uZSIsInNvdXJjZUluc3RhbmNlIiwiYXNzb2NpYXRlZEluc3RhbmNlIiwiYWxyZWFkeUFzc29jaWF0ZWQiLCJvbGRJbnN0YW5jZSIsInByaW1hcnlLZXlBdHRyaWJ1dGVzIiwiZXZlcnkiLCJhdHRyaWJ1dGUiLCJzYXZlIiwiZmllbGRzIiwiYXNzb2NpYXRpb24iLCJ0bXBJbnN0YW5jZSIsImJ1aWxkIiwiaXNOZXdSZWNvcmQiLCJ2YWx1ZXMiLCJrZXlzIiwicHVzaCIsImFsaWFzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLEtBQUssR0FBR0MsT0FBTyxDQUFDLFlBQUQsQ0FBckI7O0FBQ0EsTUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUMsV0FBRCxDQUF2Qjs7QUFDQSxNQUFNRSxDQUFDLEdBQUdGLE9BQU8sQ0FBQyxRQUFELENBQWpCOztBQUNBLE1BQU1HLFdBQVcsR0FBR0gsT0FBTyxDQUFDLFFBQUQsQ0FBM0I7O0FBQ0EsTUFBTUksRUFBRSxHQUFHSixPQUFPLENBQUMsY0FBRCxDQUFsQjtBQUVBOzs7Ozs7Ozs7O0lBUU1LLE07Ozs7O0FBQ0osa0JBQVlDLE1BQVosRUFBb0JDLE1BQXBCLEVBQTRCQyxPQUE1QixFQUFxQztBQUFBOztBQUFBOztBQUNuQyxnRkFBTUYsTUFBTixFQUFjQyxNQUFkLEVBQXNCQyxPQUF0QjtBQUVBLFVBQUtDLGVBQUwsR0FBdUIsUUFBdkI7QUFDQSxVQUFLQyxtQkFBTCxHQUEyQixJQUEzQjtBQUNBLFVBQUtDLG1CQUFMLEdBQTJCLEVBQTNCOztBQUVBLFFBQUksTUFBS0MsRUFBVCxFQUFhO0FBQ1gsWUFBS0MsU0FBTCxHQUFpQixJQUFqQjtBQUNBLFlBQUtMLE9BQUwsQ0FBYU0sSUFBYixHQUFvQjtBQUNsQkMs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QUFQLEdBQWlCNUYsTUFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4vLi4vdXRpbHMnKTtcclxuY29uc3QgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xyXG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XHJcbmNvbnN0IEFzc29jaWF0aW9uID0gcmVxdWlyZSgnLi9iYXNlJyk7XHJcbmNvbnN0IE9wID0gcmVxdWlyZSgnLi4vb3BlcmF0b3JzJyk7XHJcblxyXG4vKipcclxuICogT25lLXRvLW9uZSBhc3NvY2lhdGlvblxyXG4gKlxyXG4gKiBJbiB0aGUgQVBJIHJlZmVyZW5jZSBiZWxvdywgYWRkIHRoZSBuYW1lIG9mIHRoZSBhc3NvY2lhdGlvbiB0byB0aGUgbWV0aG9kLCBlLmcuIGZvciBgVXNlci5oYXNPbmUoUHJvamVjdClgIHRoZSBnZXR0ZXIgd2lsbCBiZSBgdXNlci5nZXRQcm9qZWN0KClgLlxyXG4gKiBUaGlzIGlzIGFsbW9zdCB0aGUgc2FtZSBhcyBgYmVsb25nc1RvYCB3aXRoIG9uZSBleGNlcHRpb24gLSBUaGUgZm9yZWlnbiBrZXkgd2lsbCBiZSBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgbW9kZWwuXHJcbiAqXHJcbiAqIEBzZWUge0BsaW5rIE1vZGVsLmhhc09uZX1cclxuICovXHJcbmNsYXNzIEhhc09uZSBleHRlbmRzIEFzc29jaWF0aW9uIHtcclxuICBjb25zdHJ1Y3Rvcihzb3VyY2UsIHRhcmdldCwgb3B0aW9ucykge1xyXG4gICAgc3VwZXIoc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuYXNzb2NpYXRpb25UeXBlID0gJ0hhc09uZSc7XHJcbiAgICB0aGlzLmlzU2luZ2xlQXNzb2NpYXRpb24gPSB0cnVlO1xyXG4gICAgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlID0ge307XHJcblxyXG4gICAgaWYgKHRoaXMuYXMpIHtcclxuICAgICAgdGhpcy5pc0FsaWFzZWQgPSB0cnVlO1xyXG4gICAgICB0aGlzLm9wdGlvbnMubmFtZSA9IHtcclxuICAgICAgICBzaW5ndWxhcjogdGhpcy5hc1xyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5hcyA9IHRoaXMudGFyZ2V0Lm9wdGlvbnMubmFtZS5zaW5ndWxhcjtcclxuICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB0aGlzLnRhcmdldC5vcHRpb25zLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKF8uaXNPYmplY3QodGhpcy5vcHRpb25zLmZvcmVpZ25LZXkpKSB7XHJcbiAgICAgIHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZSA9IHRoaXMub3B0aW9ucy5mb3JlaWduS2V5O1xyXG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUubmFtZSB8fCB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUuZmllbGROYW1lO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZm9yZWlnbktleSkge1xyXG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSB0aGlzLm9wdGlvbnMuZm9yZWlnbktleTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuZm9yZWlnbktleSkge1xyXG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSBVdGlscy5jYW1lbGl6ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICBVdGlscy5zaW5ndWxhcml6ZSh0aGlzLm9wdGlvbnMuYXMgfHwgdGhpcy5zb3VyY2UubmFtZSksXHJcbiAgICAgICAgICB0aGlzLnNvdXJjZS5wcmltYXJ5S2V5QXR0cmlidXRlXHJcbiAgICAgICAgXS5qb2luKCdfJylcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgIHRoaXMub3B0aW9ucy5zb3VyY2VLZXlcclxuICAgICAgJiYgIXRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5vcHRpb25zLnNvdXJjZUtleV1cclxuICAgICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXR0cmlidXRlIFwiJHt0aGlzLm9wdGlvbnMuc291cmNlS2V5fVwiIHBhc3NlZCBhcyBzb3VyY2VLZXksIGRlZmluZSB0aGlzIGF0dHJpYnV0ZSBvbiBtb2RlbCBcIiR7dGhpcy5zb3VyY2UubmFtZX1cIiBmaXJzdGApO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc291cmNlS2V5ID0gdGhpcy5zb3VyY2VLZXlBdHRyaWJ1dGUgPSB0aGlzLm9wdGlvbnMuc291cmNlS2V5IHx8IHRoaXMuc291cmNlLnByaW1hcnlLZXlBdHRyaWJ1dGU7XHJcbiAgICB0aGlzLnNvdXJjZUtleUZpZWxkID0gdGhpcy5zb3VyY2UucmF3QXR0cmlidXRlc1t0aGlzLnNvdXJjZUtleV0uZmllbGQgfHwgdGhpcy5zb3VyY2VLZXk7XHJcbiAgICB0aGlzLnNvdXJjZUtleUlzUHJpbWFyeSA9IHRoaXMuc291cmNlS2V5ID09PSB0aGlzLnNvdXJjZS5wcmltYXJ5S2V5QXR0cmlidXRlO1xyXG5cclxuICAgIHRoaXMuYXNzb2NpYXRpb25BY2Nlc3NvciA9IHRoaXMuYXM7XHJcbiAgICB0aGlzLm9wdGlvbnMudXNlSG9va3MgPSBvcHRpb25zLnVzZUhvb2tzO1xyXG5cclxuICAgIGlmICh0aGlzLnRhcmdldC5yYXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0pIHtcclxuICAgICAgdGhpcy5pZGVudGlmaWVyRmllbGQgPSB0aGlzLnRhcmdldC5yYXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0uZmllbGQgfHwgdGhpcy5mb3JlaWduS2V5O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCBzaW5ndWxhciBuYW1lLCB0cnlpbmcgdG8gdXBwZXJjYXNlIHRoZSBmaXJzdCBsZXR0ZXIsIHVubGVzcyB0aGUgbW9kZWwgZm9yYmlkcyBpdFxyXG4gICAgY29uc3Qgc2luZ3VsYXIgPSBfLnVwcGVyRmlyc3QodGhpcy5vcHRpb25zLm5hbWUuc2luZ3VsYXIpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzb3JzID0ge1xyXG4gICAgICBnZXQ6IGBnZXQke3Npbmd1bGFyfWAsXHJcbiAgICAgIHNldDogYHNldCR7c2luZ3VsYXJ9YCxcclxuICAgICAgY3JlYXRlOiBgY3JlYXRlJHtzaW5ndWxhcn1gXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gdGhlIGlkIGlzIGluIHRoZSB0YXJnZXQgdGFibGVcclxuICBfaW5qZWN0QXR0cmlidXRlcygpIHtcclxuICAgIGNvbnN0IG5ld0F0dHJpYnV0ZXMgPSB7fTtcclxuXHJcbiAgICBuZXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0gPSBfLmRlZmF1bHRzKHt9LCB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUsIHtcclxuICAgICAgdHlwZTogdGhpcy5vcHRpb25zLmtleVR5cGUgfHwgdGhpcy5zb3VyY2UucmF3QXR0cmlidXRlc1t0aGlzLnNvdXJjZUtleV0udHlwZSxcclxuICAgICAgYWxsb3dOdWxsOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzICE9PSBmYWxzZSkge1xyXG4gICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLnRhcmdldC5yYXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0gfHwgbmV3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldO1xyXG4gICAgICB0aGlzLm9wdGlvbnMub25EZWxldGUgPSB0aGlzLm9wdGlvbnMub25EZWxldGUgfHwgKHRhcmdldC5hbGxvd051bGwgPyAnU0VUIE5VTEwnIDogJ0NBU0NBREUnKTtcclxuICAgICAgdGhpcy5vcHRpb25zLm9uVXBkYXRlID0gdGhpcy5vcHRpb25zLm9uVXBkYXRlIHx8ICdDQVNDQURFJztcclxuICAgIH1cclxuXHJcbiAgICBIZWxwZXJzLmFkZEZvcmVpZ25LZXlDb25zdHJhaW50cyhuZXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0sIHRoaXMuc291cmNlLCB0aGlzLnRhcmdldCwgdGhpcy5vcHRpb25zLCB0aGlzLnNvdXJjZUtleUZpZWxkKTtcclxuICAgIFV0aWxzLm1lcmdlRGVmYXVsdHModGhpcy50YXJnZXQucmF3QXR0cmlidXRlcywgbmV3QXR0cmlidXRlcyk7XHJcblxyXG4gICAgdGhpcy50YXJnZXQucmVmcmVzaEF0dHJpYnV0ZXMoKTtcclxuXHJcbiAgICB0aGlzLmlkZW50aWZpZXJGaWVsZCA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5maWVsZCB8fCB0aGlzLmZvcmVpZ25LZXk7XHJcblxyXG4gICAgSGVscGVycy5jaGVja05hbWluZ0NvbGxpc2lvbih0aGlzKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIG1peGluKG9iaikge1xyXG4gICAgY29uc3QgbWV0aG9kcyA9IFsnZ2V0JywgJ3NldCcsICdjcmVhdGUnXTtcclxuXHJcbiAgICBIZWxwZXJzLm1peGluTWV0aG9kcyh0aGlzLCBvYmosIG1ldGhvZHMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBhc3NvY2lhdGVkIGluc3RhbmNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtNb2RlbHxBcnJheTxNb2RlbD59IGluc3RhbmNlcyBzb3VyY2UgaW5zdGFuY2VzXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgW29wdGlvbnNdIGZpbmQgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLnNjb3BlXSBBcHBseSBhIHNjb3BlIG9uIHRoZSByZWxhdGVkIG1vZGVsLCBvciByZW1vdmUgaXRzIGRlZmF1bHQgc2NvcGUgYnkgcGFzc2luZyBmYWxzZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2hlbWFdIEFwcGx5IGEgc2NoZW1hIG9uIHRoZSByZWxhdGVkIG1vZGVsXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRPbmV9IGZvciBhIGZ1bGwgZXhwbGFuYXRpb24gb2Ygb3B0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWw+fVxyXG4gICAqL1xyXG4gIGdldChpbnN0YW5jZXMsIG9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHdoZXJlID0ge307XHJcblxyXG4gICAgbGV0IFRhcmdldCA9IHRoaXMudGFyZ2V0O1xyXG4gICAgbGV0IGluc3RhbmNlO1xyXG5cclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcblxyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAnc2NvcGUnKSkge1xyXG4gICAgICBpZiAoIW9wdGlvbnMuc2NvcGUpIHtcclxuICAgICAgICBUYXJnZXQgPSBUYXJnZXQudW5zY29wZWQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBUYXJnZXQgPSBUYXJnZXQuc2NvcGUob3B0aW9ucy5zY29wZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsICdzY2hlbWEnKSkge1xyXG4gICAgICBUYXJnZXQgPSBUYXJnZXQuc2NoZW1hKG9wdGlvbnMuc2NoZW1hLCBvcHRpb25zLnNjaGVtYURlbGltaXRlcik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGluc3RhbmNlcykpIHtcclxuICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZXM7XHJcbiAgICAgIGluc3RhbmNlcyA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaW5zdGFuY2VzKSB7XHJcbiAgICAgIHdoZXJlW3RoaXMuZm9yZWlnbktleV0gPSB7XHJcbiAgICAgICAgW09wLmluXTogaW5zdGFuY2VzLm1hcChpbnN0YW5jZSA9PiBpbnN0YW5jZS5nZXQodGhpcy5zb3VyY2VLZXkpKVxyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2hlcmVbdGhpcy5mb3JlaWduS2V5XSA9IGluc3RhbmNlLmdldCh0aGlzLnNvdXJjZUtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuc2NvcGUpIHtcclxuICAgICAgT2JqZWN0LmFzc2lnbih3aGVyZSwgdGhpcy5zY29wZSk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucy53aGVyZSA9IG9wdGlvbnMud2hlcmUgP1xyXG4gICAgICB7IFtPcC5hbmRdOiBbd2hlcmUsIG9wdGlvbnMud2hlcmVdIH0gOlxyXG4gICAgICB3aGVyZTtcclxuXHJcbiAgICBpZiAoaW5zdGFuY2VzKSB7XHJcbiAgICAgIHJldHVybiBUYXJnZXQuZmluZEFsbChvcHRpb25zKS50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xyXG4gICAgICAgIGZvciAoY29uc3QgaW5zdGFuY2Ugb2YgaW5zdGFuY2VzKSB7XHJcbiAgICAgICAgICByZXN1bHRbaW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5LCB7IHJhdzogdHJ1ZSB9KV0gPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBpbnN0YW5jZSBvZiByZXN1bHRzKSB7XHJcbiAgICAgICAgICByZXN1bHRbaW5zdGFuY2UuZ2V0KHRoaXMuZm9yZWlnbktleSwgeyByYXc6IHRydWUgfSldID0gaW5zdGFuY2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gVGFyZ2V0LmZpbmRPbmUob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGFzc29jaWF0ZWQgbW9kZWwuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSB0aGUgc291cmNlIGluc3RhbmNlXHJcbiAgICogQHBhcmFtIHs/PE1vZGVsPnxzdHJpbmd8bnVtYmVyfSBbYXNzb2NpYXRlZEluc3RhbmNlXSBBbiBwZXJzaXN0ZWQgaW5zdGFuY2Ugb3IgdGhlIHByaW1hcnkga2V5IG9mIGFuIGluc3RhbmNlIHRvIGFzc29jaWF0ZSB3aXRoIHRoaXMuIFBhc3MgYG51bGxgIG9yIGB1bmRlZmluZWRgIHRvIHJlbW92ZSB0aGUgYXNzb2NpYXRpb24uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBnZXRBc3NvY2lhdGlvbiBhbmQgYHRhcmdldC5zYXZlYFxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgc2V0KHNvdXJjZUluc3RhbmNlLCBhc3NvY2lhdGVkSW5zdGFuY2UsIG9wdGlvbnMpIHtcclxuICAgIGxldCBhbHJlYWR5QXNzb2NpYXRlZDtcclxuXHJcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xyXG4gICAgICBzY29wZTogZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBzb3VyY2VJbnN0YW5jZVt0aGlzLmFjY2Vzc29ycy5nZXRdKG9wdGlvbnMpLnRoZW4ob2xkSW5zdGFuY2UgPT4ge1xyXG4gICAgICAvLyBUT0RPIFVzZSBlcXVhbHMgbWV0aG9kIG9uY2UgIzU2MDUgaXMgcmVzb2x2ZWRcclxuICAgICAgYWxyZWFkeUFzc29jaWF0ZWQgPSBvbGRJbnN0YW5jZSAmJiBhc3NvY2lhdGVkSW5zdGFuY2UgJiYgdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZXMuZXZlcnkoYXR0cmlidXRlID0+XHJcbiAgICAgICAgb2xkSW5zdGFuY2UuZ2V0KGF0dHJpYnV0ZSwgeyByYXc6IHRydWUgfSkgPT09IChhc3NvY2lhdGVkSW5zdGFuY2UuZ2V0ID8gYXNzb2NpYXRlZEluc3RhbmNlLmdldChhdHRyaWJ1dGUsIHsgcmF3OiB0cnVlIH0pIDogYXNzb2NpYXRlZEluc3RhbmNlKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKG9sZEluc3RhbmNlICYmICFhbHJlYWR5QXNzb2NpYXRlZCkge1xyXG4gICAgICAgIG9sZEluc3RhbmNlW3RoaXMuZm9yZWlnbktleV0gPSBudWxsO1xyXG4gICAgICAgIHJldHVybiBvbGRJbnN0YW5jZS5zYXZlKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcclxuICAgICAgICAgIGZpZWxkczogW3RoaXMuZm9yZWlnbktleV0sXHJcbiAgICAgICAgICBhbGxvd051bGw6IFt0aGlzLmZvcmVpZ25LZXldLFxyXG4gICAgICAgICAgYXNzb2NpYXRpb246IHRydWVcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH1cclxuICAgIH0pLnRoZW4oKCkgPT4ge1xyXG4gICAgICBpZiAoYXNzb2NpYXRlZEluc3RhbmNlICYmICFhbHJlYWR5QXNzb2NpYXRlZCkge1xyXG4gICAgICAgIGlmICghKGFzc29jaWF0ZWRJbnN0YW5jZSBpbnN0YW5jZW9mIHRoaXMudGFyZ2V0KSkge1xyXG4gICAgICAgICAgY29uc3QgdG1wSW5zdGFuY2UgPSB7fTtcclxuICAgICAgICAgIHRtcEluc3RhbmNlW3RoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGVdID0gYXNzb2NpYXRlZEluc3RhbmNlO1xyXG4gICAgICAgICAgYXNzb2NpYXRlZEluc3RhbmNlID0gdGhpcy50YXJnZXQuYnVpbGQodG1wSW5zdGFuY2UsIHtcclxuICAgICAgICAgICAgaXNOZXdSZWNvcmQ6IGZhbHNlXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIE9iamVjdC5hc3NpZ24oYXNzb2NpYXRlZEluc3RhbmNlLCB0aGlzLnNjb3BlKTtcclxuICAgICAgICBhc3NvY2lhdGVkSW5zdGFuY2Uuc2V0KHRoaXMuZm9yZWlnbktleSwgc291cmNlSW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5QXR0cmlidXRlKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBhc3NvY2lhdGVkSW5zdGFuY2Uuc2F2ZShvcHRpb25zKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYXNzb2NpYXRlZCBtb2RlbCBhbmQgYXNzb2NpYXRlIGl0IHdpdGggdGhpcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TW9kZWx9IHNvdXJjZUluc3RhbmNlIHRoZSBzb3VyY2UgaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW3ZhbHVlcz17fV0gdmFsdWVzIHRvIGNyZWF0ZSBhc3NvY2lhdGVkIG1vZGVsIGluc3RhbmNlIHdpdGhcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGB0YXJnZXQuY3JlYXRlYCBhbmQgc2V0QXNzb2NpYXRpb24uXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsI2NyZWF0ZX0gZm9yIGEgZnVsbCBleHBsYW5hdGlvbiBvZiBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNb2RlbD59IFRoZSBjcmVhdGVkIHRhcmdldCBtb2RlbFxyXG4gICAqL1xyXG4gIGNyZWF0ZShzb3VyY2VJbnN0YW5jZSwgdmFsdWVzLCBvcHRpb25zKSB7XHJcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgfHwge307XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICBpZiAodGhpcy5zY29wZSkge1xyXG4gICAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBPYmplY3Qua2V5cyh0aGlzLnNjb3BlKSkge1xyXG4gICAgICAgIHZhbHVlc1thdHRyaWJ1dGVdID0gdGhpcy5zY29wZVthdHRyaWJ1dGVdO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmZpZWxkcykge1xyXG4gICAgICAgICAgb3B0aW9ucy5maWVsZHMucHVzaChhdHRyaWJ1dGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhbHVlc1t0aGlzLmZvcmVpZ25LZXldID0gc291cmNlSW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5QXR0cmlidXRlKTtcclxuICAgIGlmIChvcHRpb25zLmZpZWxkcykge1xyXG4gICAgICBvcHRpb25zLmZpZWxkcy5wdXNoKHRoaXMuZm9yZWlnbktleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMudGFyZ2V0LmNyZWF0ZSh2YWx1ZXMsIG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgdmVyaWZ5QXNzb2NpYXRpb25BbGlhcyhhbGlhcykge1xyXG4gICAgaWYgKHR5cGVvZiBhbGlhcyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXMgPT09IGFsaWFzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhbGlhcyAmJiBhbGlhcy5zaW5ndWxhcikge1xyXG4gICAgICByZXR1cm4gdGhpcy5hcyA9PT0gYWxpYXMuc2luZ3VsYXI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICF0aGlzLmlzQWxpYXNlZDtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSGFzT25lO1xyXG4iXX0=