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
 * In the API reference below, add the name of the association to the method, e.g. for `User.belongsTo(Project)` the getter will be `user.getProject()`.
 *
 * @see {@link Model.belongsTo}
 */


let BelongsTo =
/*#__PURE__*/
function (_Association) {
  _inherits(BelongsTo, _Association);

  function BelongsTo(source, target, options) {
    var _this;

    _classCallCheck(this, BelongsTo);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BelongsTo).call(this, source, target, options));
    _this.associationType = 'BelongsTo';
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
      _this.foreignKey = Utils.camelize([_this.as, _this.target.primaryKeyAttribute].join('_'));
    }

    _this.identifier = _this.foreignKey;

    if (_this.source.rawAttributes[_this.identifier]) {
      _this.identifierField = _this.source.rawAttributes[_this.identifier].field || _this.identifier;
    }

    if (_this.options.targetKey && !_this.target.rawAttributes[_this.options.targetKey]) {
      throw new Error(`Unknown attribute "${_this.options.targetKey}" passed as targetKey, define this attribute on model "${_this.target.name}" first`);
    }

    _this.targetKey = _this.options.targetKey || _this.target.primaryKeyAttribute;
    _this.targetKeyField = _this.target.rawAttributes[_this.targetKey].field || _this.targetKey;
    _this.targetKeyIsPrimary = _this.targetKey === _this.target.primaryKeyAttribute;
    _this.targetIdentifier = _this.targetKey;
    _this.associationAccessor = _this.as;
    _this.options.useHooks = options.useHooks; // Get singular name, trying to uppercase the first letter, unless the model forbids it

    const singular = _.upperFirst(_this.options.name.singular);

    _this.accessors = {
      get: `get${singular}`,
      set: `set${singular}`,
      create: `create${singular}`
    };
    return _this;
  } // the id is in the source table


  _createClass(BelongsTo, [{
    key: "_injectAttributes",
    value: function _injectAttributes() {
      const newAttributes = {};
      newAttributes[this.foreignKey] = _.defaults({}, this.foreignKeyAttribute, {
        type: this.options.keyType || this.target.rawAttributes[this.targetKey].type,
        allowNull: true
      });

      if (this.options.constraints !== false) {
        const source = this.source.rawAttributes[this.foreignKey] || newAttributes[this.foreignKey];
        this.options.onDelete = this.options.onDelete || (source.allowNull ? 'SET NULL' : 'NO ACTION');
        this.options.onUpdate = this.options.onUpdate || 'CASCADE';
      }

      Helpers.addForeignKeyConstraints(newAttributes[this.foreignKey], this.target, this.source, this.options, this.targetKeyField);
      Utils.mergeDefaults(this.source.rawAttributes, newAttributes);
      this.source.refreshAttributes();
      this.identifierField = this.source.rawAttributes[this.foreignKey].field || this.foreignKey;
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
     * @param {string|boolean} [options.scope]  Apply a scope on the related model, or remove its default scope by passing false.
     * @param {string}         [options.schema] Apply a schema on the related model
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
        where[this.targetKey] = {
          [Op.in]: instances.map(instance => instance.get(this.foreignKey))
        };
      } else {
        if (this.targetKeyIsPrimary && !options.where) {
          return Target.findByPk(instance.get(this.foreignKey), options);
        }

        where[this.targetKey] = instance.get(this.foreignKey);
        options.limit = null;
      }

      options.where = options.where ? {
        [Op.and]: [where, options.where]
      } : where;

      if (instances) {
        return Target.findAll(options).then(results => {
          const result = {};

          for (const instance of instances) {
            result[instance.get(this.foreignKey, {
              raw: true
            })] = null;
          }

          for (const instance of results) {
            result[instance.get(this.targetKey, {
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
     * @param {Object} [options={}] options passed to `this.save`
     * @param {boolean} [options.save=true] Skip saving this after setting the foreign key if false.
     *
     *  @returns {Promise}
     */

  }, {
    key: "set",
    value: function set(sourceInstance, associatedInstance, options = {}) {
      let value = associatedInstance;

      if (associatedInstance instanceof this.target) {
        value = associatedInstance[this.targetKey];
      }

      sourceInstance.set(this.foreignKey, value);
      if (options.save === false) return;
      options = Object.assign({
        fields: [this.foreignKey],
        allowNull: [this.foreignKey],
        association: true
      }, options); // passes the changed field to save, so only that field get updated.

      return sourceInstance.save(options);
    }
    /**
     * Create a new instance of the associated model and associate it with this.
     *
     * @param {Model} sourceInstance the source instance
     * @param {Object} [values={}] values to create associated model instance with
     * @param {Object} [options={}] Options passed to `target.create` and setAssociation.
     *
     * @see
     * {@link Model#create}  for a full explanation of options
     *
     * @returns {Promise<Model>} The created target model
     */

  }, {
    key: "create",
    value: function create(sourceInstance, values, options) {
      values = values || {};
      options = options || {};
      return this.target.create(values, options).then(newAssociatedObject => sourceInstance[this.accessors.set](newAssociatedObject, options).then(() => newAssociatedObject));
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

  return BelongsTo;
}(Association);

module.exports = BelongsTo;
module.exports.BelongsTo = BelongsTo;
module.exports.default = BelongsTo;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvYmVsb25ncy10by5qcyJdLCJuYW1lcyI6WyJVdGlscyIsInJlcXVpcmUiLCJIZWxwZXJzIiwiXyIsIkFzc29jaWF0aW9uIiwiT3AiLCJCZWxvbmdzVG8iLCJzb3VyY2UiLCJ0YXJnZXQiLCJvcHRpb25zIiwiYXNzb2NpYXRpb25UeXBlIiwiaXNTaW5nbGVBc3NvY2lhdGlvbiIsImZvcmVpZ25LZXlBdHRyaWJ1dGUiLCJhcyIsImlzQWxpYXNlZCIsIm5hbWUiLCJzaW5ndWxhciIsImlzT2JqZWN0IiwiZm9yZWlnbktleSIsImZpZWxkTmFtZSIsImNhbWVsaXplIiwicHJpbWFyeUtleUF0dHJpYnV0ZSIsImpvaW4iLCJpZGVudGlmaWVyIiwicmF3QXR0cmlidXRlcyIsImlkZW50aWZpZXJGaWVsZCIsImZpZWxkIiwidGFyZ2V0S2V5IiwiRXJyb3IiLCJ0YXJnZXRLZXlGaWVsZCIsInRhcmdldEtleUlzUHJpbWFyeSIsInRhcmdldElkZW50aWZpZXIiLCJhc3NvY2lhdGlvbkFjY2Vzc29yIiwidXNlSG9va3MiLCJ1cHBlckZpcnN0IiwiYWNjZXNzb3JzIiwiZ2V0Iiwic2V0IiwiY3JlYXRlIiwibmV3QXR0cmlidXRlcyIsImRlZmF1bHRzIiwidHlwZSIsImtleVR5cGUiLCJhbGxvd051bGwiLCJjb25zdHJhaW50cyIsIm9uRGVsZXRlIiwib25VcGRhdGUiLCJhZGRGb3JlaWduS2V5Q29uc3RyYWludHMiLCJtZXJnZURlZmF1bHRzIiwicmVmcmVzaEF0dHJpYnV0ZXMiLCJjaGVja05hbWluZ0NvbGxpc2lvbiIsIm9iaiIsIm1ldGhvZHMiLCJtaXhpbk1ldGhvZHMiLCJpbnN0YW5jZXMiLCJ3aGVyZSIsIlRhcmdldCIsImluc3RhbmNlIiwiY2xvbmVEZWVwIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwic2NvcGUiLCJ1bnNjb3BlZCIsInNjaGVtYSIsInNjaGVtYURlbGltaXRlciIsIkFycmF5IiwiaXNBcnJheSIsInVuZGVmaW5lZCIsImluIiwibWFwIiwiZmluZEJ5UGsiLCJsaW1pdCIsImFuZCIsImZpbmRBbGwiLCJ0aGVuIiwicmVzdWx0cyIsInJlc3VsdCIsInJhdyIsImZpbmRPbmUiLCJzb3VyY2VJbnN0YW5jZSIsImFzc29jaWF0ZWRJbnN0YW5jZSIsInZhbHVlIiwic2F2ZSIsImFzc2lnbiIsImZpZWxkcyIsImFzc29jaWF0aW9uIiwidmFsdWVzIiwibmV3QXNzb2NpYXRlZE9iamVjdCIsImFsaWFzIiwibW9kdWxlIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxZQUFELENBQXJCOztBQUNBLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFDLFdBQUQsQ0FBdkI7O0FBQ0EsTUFBTUUsQ0FBQyxHQUFHRixPQUFPLENBQUMsUUFBRCxDQUFqQjs7QUFDQSxNQUFNRyxXQUFXLEdBQUdILE9BQU8sQ0FBQyxRQUFELENBQTNCOztBQUNBLE1BQU1JLEVBQUUsR0FBR0osT0FBTyxDQUFDLGNBQUQsQ0FBbEI7QUFFQTs7Ozs7Ozs7O0lBT01LLFM7Ozs7O0FBQ0oscUJBQVlDLE1BQVosRUFBb0JDLE1BQXBCLEVBQTRCQyxPQUE1QixFQUFxQztBQUFBOztBQUFBOztBQUNuQyxtRkFBTUYsTUFBTixFQUFjQyxNQUFkLEVBQXNCQyxPQUF0QjtBQUVBLFVBQUtDLGVBQUwsR0FBdUIsV0FBdkI7QUFDQSxVQUFLQyxtQkFBTCxHQUEyQixJQUEzQjtBQUNBLFVBQUtDLG1CQUFMLEdBQTJCLEVBQTNCOztBQUVBLFFBQUksTUFBS0MsRUFBVCxFQUFhO0FBQ1gsWUFBS0MsU0FBTCxHQUFpQixJQUFqQjtBQUNBLFlBQUtMLE9BQUwsQ0FBYU0sSUFBYixHQUFvQjtBQUNsQkMsUUFBQUEsUUFBUSxFQUFFLE1BQUtIO0FBREcsT0FBcEI7QUFHRCxLQUxELE1BS087QUFDTCxZQUFLQSxFQUFMLEdB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TUFBTSxHQUFHQSxNQUFNLElBQUksRUFBbkI7QUFDQS9FLE1BQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCO0FBRUEsYUFBTyxLQUFLRCxNQUFMLENBQVk4QixNQUFaLENBQW1Ca0QsTUFBbkIsRUFBMkIvRSxPQUEzQixFQUNKbUUsSUFESSxDQUNDYSxtQkFBbUIsSUFBSVIsY0FBYyxDQUFDLEtBQUs5QyxTQUFMLENBQWVFLEdBQWhCLENBQWQsQ0FBbUNvRCxtQkFBbkMsRUFBd0RoRixPQUF4RCxFQUMxQm1FLElBRDBCLENBQ3JCLE1BQU1hLG1CQURlLENBRHhCLENBQVA7QUFJRDs7OzJDQUVzQkMsSyxFQUFPO0FBQzVCLFVBQUksT0FBT0EsS0FBUCxLQUFpQixRQUFyQixFQUErQjtBQUM3QixlQUFPLEtBQUs3RSxFQUFMLEtBQVk2RSxLQUFuQjtBQUNEOztBQUVELFVBQUlBLEtBQUssSUFBSUEsS0FBSyxDQUFDMUUsUUFBbkIsRUFBNkI7QUFDM0IsZUFBTyxLQUFLSCxFQUFMLEtBQVk2RSxLQUFLLENBQUMxRSxRQUF6QjtBQUNEOztBQUVELGFBQU8sQ0FBQyxLQUFLRixTQUFiO0FBQ0Q7Ozs7RUF2T3FCVixXOztBQTBPeEJ1RixNQUFNLENBQUNDLE9BQVAsR0FBaUJ0RixTQUFqQjtBQUNBcUYsTUFBTSxDQUFDQyxPQUFQLENBQWV0RixTQUFmLEdBQTJCQSxTQUEzQjtBQUNBcUYsTUFBTSxDQUFDQyxPQUFQLENBQWVDLE9BQWYsR0FBeUJ2RixTQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xyXG5jb25zdCBIZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuY29uc3QgQXNzb2NpYXRpb24gPSByZXF1aXJlKCcuL2Jhc2UnKTtcclxuY29uc3QgT3AgPSByZXF1aXJlKCcuLi9vcGVyYXRvcnMnKTtcclxuXHJcbi8qKlxyXG4gKiBPbmUtdG8tb25lIGFzc29jaWF0aW9uXHJcbiAqXHJcbiAqIEluIHRoZSBBUEkgcmVmZXJlbmNlIGJlbG93LCBhZGQgdGhlIG5hbWUgb2YgdGhlIGFzc29jaWF0aW9uIHRvIHRoZSBtZXRob2QsIGUuZy4gZm9yIGBVc2VyLmJlbG9uZ3NUbyhQcm9qZWN0KWAgdGhlIGdldHRlciB3aWxsIGJlIGB1c2VyLmdldFByb2plY3QoKWAuXHJcbiAqXHJcbiAqIEBzZWUge0BsaW5rIE1vZGVsLmJlbG9uZ3NUb31cclxuICovXHJcbmNsYXNzIEJlbG9uZ3NUbyBleHRlbmRzIEFzc29jaWF0aW9uIHtcclxuICBjb25zdHJ1Y3Rvcihzb3VyY2UsIHRhcmdldCwgb3B0aW9ucykge1xyXG4gICAgc3VwZXIoc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuYXNzb2NpYXRpb25UeXBlID0gJ0JlbG9uZ3NUbyc7XHJcbiAgICB0aGlzLmlzU2luZ2xlQXNzb2NpYXRpb24gPSB0cnVlO1xyXG4gICAgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlID0ge307XHJcblxyXG4gICAgaWYgKHRoaXMuYXMpIHtcclxuICAgICAgdGhpcy5pc0FsaWFzZWQgPSB0cnVlO1xyXG4gICAgICB0aGlzLm9wdGlvbnMubmFtZSA9IHtcclxuICAgICAgICBzaW5ndWxhcjogdGhpcy5hc1xyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5hcyA9IHRoaXMudGFyZ2V0Lm9wdGlvbnMubmFtZS5zaW5ndWxhcjtcclxuICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB0aGlzLnRhcmdldC5vcHRpb25zLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKF8uaXNPYmplY3QodGhpcy5vcHRpb25zLmZvcmVpZ25LZXkpKSB7XHJcbiAgICAgIHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZSA9IHRoaXMub3B0aW9ucy5mb3JlaWduS2V5O1xyXG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUubmFtZSB8fCB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUuZmllbGROYW1lO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZm9yZWlnbktleSkge1xyXG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSB0aGlzLm9wdGlvbnMuZm9yZWlnbktleTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuZm9yZWlnbktleSkge1xyXG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSBVdGlscy5jYW1lbGl6ZShcclxuICAgICAgICBbXHJcbiAgICAgICAgICB0aGlzLmFzLFxyXG4gICAgICAgICAgdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZVxyXG4gICAgICAgIF0uam9pbignXycpXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5pZGVudGlmaWVyID0gdGhpcy5mb3JlaWduS2V5O1xyXG4gICAgaWYgKHRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5pZGVudGlmaWVyXSkge1xyXG4gICAgICB0aGlzLmlkZW50aWZpZXJGaWVsZCA9IHRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5pZGVudGlmaWVyXS5maWVsZCB8fCB0aGlzLmlkZW50aWZpZXI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICB0aGlzLm9wdGlvbnMudGFyZ2V0S2V5XHJcbiAgICAgICYmICF0aGlzLnRhcmdldC5yYXdBdHRyaWJ1dGVzW3RoaXMub3B0aW9ucy50YXJnZXRLZXldXHJcbiAgICApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGF0dHJpYnV0ZSBcIiR7dGhpcy5vcHRpb25zLnRhcmdldEtleX1cIiBwYXNzZWQgYXMgdGFyZ2V0S2V5LCBkZWZpbmUgdGhpcyBhdHRyaWJ1dGUgb24gbW9kZWwgXCIke3RoaXMudGFyZ2V0Lm5hbWV9XCIgZmlyc3RgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRhcmdldEtleSA9IHRoaXMub3B0aW9ucy50YXJnZXRLZXkgfHwgdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZTtcclxuICAgIHRoaXMudGFyZ2V0S2V5RmllbGQgPSB0aGlzLnRhcmdldC5yYXdBdHRyaWJ1dGVzW3RoaXMudGFyZ2V0S2V5XS5maWVsZCB8fCB0aGlzLnRhcmdldEtleTtcclxuICAgIHRoaXMudGFyZ2V0S2V5SXNQcmltYXJ5ID0gdGhpcy50YXJnZXRLZXkgPT09IHRoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGU7XHJcbiAgICB0aGlzLnRhcmdldElkZW50aWZpZXIgPSB0aGlzLnRhcmdldEtleTtcclxuXHJcbiAgICB0aGlzLmFzc29jaWF0aW9uQWNjZXNzb3IgPSB0aGlzLmFzO1xyXG4gICAgdGhpcy5vcHRpb25zLnVzZUhvb2tzID0gb3B0aW9ucy51c2VIb29rcztcclxuXHJcbiAgICAvLyBHZXQgc2luZ3VsYXIgbmFtZSwgdHJ5aW5nIHRvIHVwcGVyY2FzZSB0aGUgZmlyc3QgbGV0dGVyLCB1bmxlc3MgdGhlIG1vZGVsIGZvcmJpZHMgaXRcclxuICAgIGNvbnN0IHNpbmd1bGFyID0gXy51cHBlckZpcnN0KHRoaXMub3B0aW9ucy5uYW1lLnNpbmd1bGFyKTtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc29ycyA9IHtcclxuICAgICAgZ2V0OiBgZ2V0JHtzaW5ndWxhcn1gLFxyXG4gICAgICBzZXQ6IGBzZXQke3Npbmd1bGFyfWAsXHJcbiAgICAgIGNyZWF0ZTogYGNyZWF0ZSR7c2luZ3VsYXJ9YFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIHRoZSBpZCBpcyBpbiB0aGUgc291cmNlIHRhYmxlXHJcbiAgX2luamVjdEF0dHJpYnV0ZXMoKSB7XHJcbiAgICBjb25zdCBuZXdBdHRyaWJ1dGVzID0ge307XHJcblxyXG4gICAgbmV3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldID0gXy5kZWZhdWx0cyh7fSwgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlLCB7XHJcbiAgICAgIHR5cGU6IHRoaXMub3B0aW9ucy5rZXlUeXBlIHx8IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy50YXJnZXRLZXldLnR5cGUsXHJcbiAgICAgIGFsbG93TnVsbDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb25zdHJhaW50cyAhPT0gZmFsc2UpIHtcclxuICAgICAgY29uc3Qgc291cmNlID0gdGhpcy5zb3VyY2UucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldIHx8IG5ld0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XTtcclxuICAgICAgdGhpcy5vcHRpb25zLm9uRGVsZXRlID0gdGhpcy5vcHRpb25zLm9uRGVsZXRlIHx8IChzb3VyY2UuYWxsb3dOdWxsID8gJ1NFVCBOVUxMJyA6ICdOTyBBQ1RJT04nKTtcclxuICAgICAgdGhpcy5vcHRpb25zLm9uVXBkYXRlID0gdGhpcy5vcHRpb25zLm9uVXBkYXRlIHx8ICdDQVNDQURFJztcclxuICAgIH1cclxuXHJcbiAgICBIZWxwZXJzLmFkZEZvcmVpZ25LZXlDb25zdHJhaW50cyhuZXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0sIHRoaXMudGFyZ2V0LCB0aGlzLnNvdXJjZSwgdGhpcy5vcHRpb25zLCB0aGlzLnRhcmdldEtleUZpZWxkKTtcclxuICAgIFV0aWxzLm1lcmdlRGVmYXVsdHModGhpcy5zb3VyY2UucmF3QXR0cmlidXRlcywgbmV3QXR0cmlidXRlcyk7XHJcblxyXG4gICAgdGhpcy5zb3VyY2UucmVmcmVzaEF0dHJpYnV0ZXMoKTtcclxuXHJcbiAgICB0aGlzLmlkZW50aWZpZXJGaWVsZCA9IHRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5maWVsZCB8fCB0aGlzLmZvcmVpZ25LZXk7XHJcblxyXG4gICAgSGVscGVycy5jaGVja05hbWluZ0NvbGxpc2lvbih0aGlzKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIG1peGluKG9iaikge1xyXG4gICAgY29uc3QgbWV0aG9kcyA9IFsnZ2V0JywgJ3NldCcsICdjcmVhdGUnXTtcclxuXHJcbiAgICBIZWxwZXJzLm1peGluTWV0aG9kcyh0aGlzLCBvYmosIG1ldGhvZHMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBhc3NvY2lhdGVkIGluc3RhbmNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtNb2RlbHxBcnJheTxNb2RlbD59IGluc3RhbmNlcyBzb3VyY2UgaW5zdGFuY2VzXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgW29wdGlvbnNdIGZpbmQgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLnNjb3BlXSAgQXBwbHkgYSBzY29wZSBvbiB0aGUgcmVsYXRlZCBtb2RlbCwgb3IgcmVtb3ZlIGl0cyBkZWZhdWx0IHNjb3BlIGJ5IHBhc3NpbmcgZmFsc2UuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgW29wdGlvbnMuc2NoZW1hXSBBcHBseSBhIHNjaGVtYSBvbiB0aGUgcmVsYXRlZCBtb2RlbFxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbC5maW5kT25lfSBmb3IgYSBmdWxsIGV4cGxhbmF0aW9uIG9mIG9wdGlvbnNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsPn1cclxuICAgKi9cclxuICBnZXQoaW5zdGFuY2VzLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCB3aGVyZSA9IHt9O1xyXG4gICAgbGV0IFRhcmdldCA9IHRoaXMudGFyZ2V0O1xyXG4gICAgbGV0IGluc3RhbmNlO1xyXG5cclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcblxyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAnc2NvcGUnKSkge1xyXG4gICAgICBpZiAoIW9wdGlvbnMuc2NvcGUpIHtcclxuICAgICAgICBUYXJnZXQgPSBUYXJnZXQudW5zY29wZWQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBUYXJnZXQgPSBUYXJnZXQuc2NvcGUob3B0aW9ucy5zY29wZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsICdzY2hlbWEnKSkge1xyXG4gICAgICBUYXJnZXQgPSBUYXJnZXQuc2NoZW1hKG9wdGlvbnMuc2NoZW1hLCBvcHRpb25zLnNjaGVtYURlbGltaXRlcik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGluc3RhbmNlcykpIHtcclxuICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZXM7XHJcbiAgICAgIGluc3RhbmNlcyA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaW5zdGFuY2VzKSB7XHJcbiAgICAgIHdoZXJlW3RoaXMudGFyZ2V0S2V5XSA9IHtcclxuICAgICAgICBbT3AuaW5dOiBpbnN0YW5jZXMubWFwKGluc3RhbmNlID0+IGluc3RhbmNlLmdldCh0aGlzLmZvcmVpZ25LZXkpKVxyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHRoaXMudGFyZ2V0S2V5SXNQcmltYXJ5ICYmICFvcHRpb25zLndoZXJlKSB7XHJcbiAgICAgICAgcmV0dXJuIFRhcmdldC5maW5kQnlQayhpbnN0YW5jZS5nZXQodGhpcy5mb3JlaWduS2V5KSwgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgICAgd2hlcmVbdGhpcy50YXJnZXRLZXldID0gaW5zdGFuY2UuZ2V0KHRoaXMuZm9yZWlnbktleSk7XHJcbiAgICAgIG9wdGlvbnMubGltaXQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMud2hlcmUgPSBvcHRpb25zLndoZXJlID9cclxuICAgICAgeyBbT3AuYW5kXTogW3doZXJlLCBvcHRpb25zLndoZXJlXSB9IDpcclxuICAgICAgd2hlcmU7XHJcblxyXG4gICAgaWYgKGluc3RhbmNlcykge1xyXG4gICAgICByZXR1cm4gVGFyZ2V0LmZpbmRBbGwob3B0aW9ucykudGhlbihyZXN1bHRzID0+IHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcclxuICAgICAgICBmb3IgKGNvbnN0IGluc3RhbmNlIG9mIGluc3RhbmNlcykge1xyXG4gICAgICAgICAgcmVzdWx0W2luc3RhbmNlLmdldCh0aGlzLmZvcmVpZ25LZXksIHsgcmF3OiB0cnVlIH0pXSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IGluc3RhbmNlIG9mIHJlc3VsdHMpIHtcclxuICAgICAgICAgIHJlc3VsdFtpbnN0YW5jZS5nZXQodGhpcy50YXJnZXRLZXksIHsgcmF3OiB0cnVlIH0pXSA9IGluc3RhbmNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFRhcmdldC5maW5kT25lKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBhc3NvY2lhdGVkIG1vZGVsLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2UgdGhlIHNvdXJjZSBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7PzxNb2RlbD58c3RyaW5nfG51bWJlcn0gW2Fzc29jaWF0ZWRJbnN0YW5jZV0gQW4gcGVyc2lzdGVkIGluc3RhbmNlIG9yIHRoZSBwcmltYXJ5IGtleSBvZiBhbiBpbnN0YW5jZSB0byBhc3NvY2lhdGUgd2l0aCB0aGlzLiBQYXNzIGBudWxsYCBvciBgdW5kZWZpbmVkYCB0byByZW1vdmUgdGhlIGFzc29jaWF0aW9uLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gb3B0aW9ucyBwYXNzZWQgdG8gYHRoaXMuc2F2ZWBcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnNhdmU9dHJ1ZV0gU2tpcCBzYXZpbmcgdGhpcyBhZnRlciBzZXR0aW5nIHRoZSBmb3JlaWduIGtleSBpZiBmYWxzZS5cclxuICAgKlxyXG4gICAqICBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBzZXQoc291cmNlSW5zdGFuY2UsIGFzc29jaWF0ZWRJbnN0YW5jZSwgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICBsZXQgdmFsdWUgPSBhc3NvY2lhdGVkSW5zdGFuY2U7XHJcblxyXG4gICAgaWYgKGFzc29jaWF0ZWRJbnN0YW5jZSBpbnN0YW5jZW9mIHRoaXMudGFyZ2V0KSB7XHJcbiAgICAgIHZhbHVlID0gYXNzb2NpYXRlZEluc3RhbmNlW3RoaXMudGFyZ2V0S2V5XTtcclxuICAgIH1cclxuXHJcbiAgICBzb3VyY2VJbnN0YW5jZS5zZXQodGhpcy5mb3JlaWduS2V5LCB2YWx1ZSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuc2F2ZSA9PT0gZmFsc2UpIHJldHVybjtcclxuXHJcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgIGZpZWxkczogW3RoaXMuZm9yZWlnbktleV0sXHJcbiAgICAgIGFsbG93TnVsbDogW3RoaXMuZm9yZWlnbktleV0sXHJcbiAgICAgIGFzc29jaWF0aW9uOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBwYXNzZXMgdGhlIGNoYW5nZWQgZmllbGQgdG8gc2F2ZSwgc28gb25seSB0aGF0IGZpZWxkIGdldCB1cGRhdGVkLlxyXG4gICAgcmV0dXJuIHNvdXJjZUluc3RhbmNlLnNhdmUob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGFzc29jaWF0ZWQgbW9kZWwgYW5kIGFzc29jaWF0ZSBpdCB3aXRoIHRoaXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSB0aGUgc291cmNlIGluc3RhbmNlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFt2YWx1ZXM9e31dIHZhbHVlcyB0byBjcmVhdGUgYXNzb2NpYXRlZCBtb2RlbCBpbnN0YW5jZSB3aXRoXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBPcHRpb25zIHBhc3NlZCB0byBgdGFyZ2V0LmNyZWF0ZWAgYW5kIHNldEFzc29jaWF0aW9uLlxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbCNjcmVhdGV9ICBmb3IgYSBmdWxsIGV4cGxhbmF0aW9uIG9mIG9wdGlvbnNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsPn0gVGhlIGNyZWF0ZWQgdGFyZ2V0IG1vZGVsXHJcbiAgICovXHJcbiAgY3JlYXRlKHNvdXJjZUluc3RhbmNlLCB2YWx1ZXMsIG9wdGlvbnMpIHtcclxuICAgIHZhbHVlcyA9IHZhbHVlcyB8fCB7fTtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRhcmdldC5jcmVhdGUodmFsdWVzLCBvcHRpb25zKVxyXG4gICAgICAudGhlbihuZXdBc3NvY2lhdGVkT2JqZWN0ID0+IHNvdXJjZUluc3RhbmNlW3RoaXMuYWNjZXNzb3JzLnNldF0obmV3QXNzb2NpYXRlZE9iamVjdCwgb3B0aW9ucylcclxuICAgICAgICAudGhlbigoKSA9PiBuZXdBc3NvY2lhdGVkT2JqZWN0KVxyXG4gICAgICApO1xyXG4gIH1cclxuXHJcbiAgdmVyaWZ5QXNzb2NpYXRpb25BbGlhcyhhbGlhcykge1xyXG4gICAgaWYgKHR5cGVvZiBhbGlhcyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXMgPT09IGFsaWFzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhbGlhcyAmJiBhbGlhcy5zaW5ndWxhcikge1xyXG4gICAgICByZXR1cm4gdGhpcy5hcyA9PT0gYWxpYXMuc2luZ3VsYXI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICF0aGlzLmlzQWxpYXNlZDtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQmVsb25nc1RvO1xyXG5tb2R1bGUuZXhwb3J0cy5CZWxvbmdzVG8gPSBCZWxvbmdzVG87XHJcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBCZWxvbmdzVG87XHJcbiJdfQ==