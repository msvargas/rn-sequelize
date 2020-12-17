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
 * In the API reference below, add the name of the association to the method, e.g. for `User.belongsTo(Project)` the getter will be `user.getProject()`.
 *
 * @see {@link Model.belongsTo}
 */


let BelongsTo = /*#__PURE__*/function (_Association) {
  _inherits(BelongsTo, _Association);

  var _super = _createSuper(BelongsTo);

  function BelongsTo(source, target, options) {
    var _this;

    _classCallCheck(this, BelongsTo);

    _this = _super.call(this, source, target, options);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvYmVsb25ncy10by5qcyJdLCJuYW1lcyI6WyJVdGlscyIsInJlcXVpcmUiLCJIZWxwZXJzIiwiXyIsIkFzc29jaWF0aW9uIiwiT3AiLCJCZWxvbmdzVG8iLCJzb3VyY2UiLCJ0YXJnZXQiLCJvcHRpb25zIiwiYXNzb2NpYXRpb25UeXBlIiwiaXNTaW5nbGVBc3NvY2lhdGlvbiIsImZvcmVpZ25LZXlBdHRyaWJ1dGUiLCJhcyIsImlzQWxpYXNlZCIsIm5hbWUiLCJzaW5ndWxhciIsImlzT2JqZWN0IiwiZm9yZWlnbktleSIsImZpZWxkTmFtZSIsImNhbWVsaXplIiwicHJpbWFyeUtleUF0dHJpYnV0ZSIsImpvaW4iLCJpZGVudGlmaWVyIiwicmF3QXR0cmlidXRlcyIsImlkZW50aWZpZXJGaWVsZCIsImZpZWxkIiwidGFyZ2V0S2V5IiwiRXJyb3IiLCJ0YXJnZXRLZXlGaWVsZCIsInRhcmdldEtleUlzUHJpbWFyeSIsInRhcmdldElkZW50aWZpZXIiLCJhc3NvY2lhdGlvbkFjY2Vzc29yIiwidXNlSG9va3MiLCJ1cHBlckZpcnN0IiwiYWNjZXNzb3JzIiwiZ2V0Iiwic2V0IiwiY3JlYXRlIiwibmV3QXR0cmlidXRlcyIsImRlZmF1bHRzIiwidHlwZSIsImtleVR5cGUiLCJhbGxvd051bGwiLCJjb25zdHJhaW50cyIsIm9uRGVsZXRlIiwib25VcGRhdGUiLCJhZGRGb3JlaWduS2V5Q29uc3RyYWludHMiLCJtZXJnZURlZmF1bHRzIiwicmVmcmVzaEF0dHJpYnV0ZXMiLCJjaGVja05hbWluZ0NvbGxpc2lvbiIsIm9iaiIsIm1ldGhvZHMiLCJtaXhpbk1ldGhvZHMiLCJpbnN0YW5jZXMiLCJ3aGVyZSIsIlRhcmdldCIsImluc3RhbmNlIiwiY2xvbmVEZWVwIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwic2NvcGUiLCJ1bnNjb3BlZCIsInNjaGVtYSIsInNjaGVtYURlbGltaXRlciIsIkFycmF5IiwiaXNBcnJheSIsInVuZGVmaW5lZCIsImluIiwibWFwIiwiZmluZEJ5UGsiLCJsaW1pdCIsImFuZCIsImZpbmRBbGwiLCJ0aGVuIiwicmVzdWx0cyIsInJlc3VsdCIsInJhdyIsImZpbmRPbmUiLCJzb3VyY2VJbnN0YW5jZSIsImFzc29jaWF0ZWRJbnN0YW5jZSIsInZhbHVlIiwic2F2ZSIsImFzc2lnbiIsImZpZWxkcyIsImFzc29jaWF0aW9uIiwidmFsdWVzIiwibmV3QXNzb2NpYXRlZE9iamVjdCIsImFsaWFzIiwibW9kdWxlIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsS0FBSyxHQUFHQyxPQUFPLENBQUMsWUFBRCxDQUFyQjs7QUFDQSxNQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBQyxXQUFELENBQXZCOztBQUNBLE1BQU1FLENBQUMsR0FBR0YsT0FBTyxDQUFDLFFBQUQsQ0FBakI7O0FBQ0EsTUFBTUcsV0FBVyxHQUFHSCxPQUFPLENBQUMsUUFBRCxDQUEzQjs7QUFDQSxNQUFNSSxFQUFFLEdBQUdKLE9BQU8sQ0FBQyxjQUFELENBQWxCO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztJQUNNSyxTOzs7OztBQUNKLHFCQUFZQyxNQUFaLEVBQW9CQyxNQUFwQixFQUE0QkMsT0FBNUIsRUFBcUM7QUFBQTs7QUFBQTs7QUFDbkMsOEJBQU1GLE1BQU4sRUFBY0MsTUFBZCxFQUFzQkMsT0FBdEI7QUFFQSxVQUFLQyxlQUFMLEdBQXVCLFdBQXZCO0FBQ0EsVUFBS0MsbUJBQUwsR0FBMkIsSUFBM0I7QUFDQSxVQUFLQyxtQkFBTCxHQUEyQixFQUEzQjs7QUFFQSxRQUFJLE1BQUtDLEVBQVQsRUFBYTtBQUNYLFlBQUtDLFNBQUwsR0FBaUIsSUFBakI7QUFDQSxZQUFLTCxPQUFMLENBQWFNLElBQWIsR0FBb0I7QUFDbEJDLFFBQUFBLFFBQVEsRUFBRSxNQUFLSDtBQURHLE9BQXBCO0FBR0QsS0FMRCxNQUtPO0FBQ0wsWUFBS0EsRUFBTCxHQUFVLE1BQUtMLE1BQUwsQ0FBWUMsT0FBWixDQUFvQk0sSUFBcEIsQ0FBeUJDLFFBQW5DO0FBQ0EsWUFBS1AsT0FBTCxDQUFhTSxJQUFiLEdBQW9CLE1BQUtQLE1BQUwsQ0FBWUMsT0FBWixDQUFvQk0sSUFBeEM7QUFDRDs7QUFFRCxRQUFJWixDQUFDLENBQUNjLFFBQUYsQ0FBVyxNQUFLUixPQUFMLENBQWFTLFVBQXhCLENBQUosRUFBeUM7QUFDdkMsWUFBS04sbUJBQUwsR0FBMkIsTUFBS0gsT0FBTCxDQUFhUyxVQUF4QztBQUNBLFlBQUtBLFVBQUwsR0FBa0IsTUFBS04sbUJBQUwsQ0FBeUJHLElBQXpCLElBQWlDLE1BQUtILG1CQUFMLENBQXlCTyxTQUE1RTtBQUNELEtBSEQsTUFHTyxJQUFJLE1BQUtWLE9BQUwsQ0FBYVMsVUFBakIsRUFBNkI7QUFDbEMsWUFBS0EsVUFBTCxHQUFrQixNQUFLVCxPQUFMLENBQWFTLFVBQS9CO0FBQ0Q7O0FBRUQsUUFBSSxDQUFDLE1BQUtBLFVBQVYsRUFBc0I7QUFDcEIsWUFBS0EsVUFBTCxHQUFrQmxCLEtBQUssQ0FBQ29CLFFBQU4sQ0FDaEIsQ0FDRSxNQUFLUCxFQURQLEVBRUUsTUFBS0wsTUFBTCxDQUFZYSxtQkFGZCxFQUdFQyxJQUhGLENBR08sR0FIUCxDQURnQixDQUFsQjtBQU1EOztBQUVELFVBQUtDLFVBQUwsR0FBa0IsTUFBS0wsVUFBdkI7O0FBQ0EsUUFBSSxNQUFLWCxNQUFMLENBQVlpQixhQUFaLENBQTBCLE1BQUtELFVBQS9CLENBQUosRUFBZ0Q7QUFDOUMsWUFBS0UsZUFBTCxHQUF1QixNQUFLbEIsTUFBTCxDQUFZaUIsYUFBWixDQUEwQixNQUFLRCxVQUEvQixFQUEyQ0csS0FBM0MsSUFBb0QsTUFBS0gsVUFBaEY7QUFDRDs7QUFFRCxRQUNFLE1BQUtkLE9BQUwsQ0FBYWtCLFNBQWIsSUFDRyxDQUFDLE1BQUtuQixNQUFMLENBQVlnQixhQUFaLENBQTBCLE1BQUtmLE9BQUwsQ0FBYWtCLFNBQXZDLENBRk4sRUFHRTtBQUNBLFlBQU0sSUFBSUMsS0FBSixDQUFXLHNCQUFxQixNQUFLbkIsT0FBTCxDQUFha0IsU0FBVSwwREFBeUQsTUFBS25CLE1BQUwsQ0FBWU8sSUFBSyxTQUFqSSxDQUFOO0FBQ0Q7O0FBRUQsVUFBS1ksU0FBTCxHQUFpQixNQUFLbEIsT0FBTCxDQUFha0IsU0FBYixJQUEwQixNQUFLbkIsTUFBTCxDQUFZYSxtQkFBdkQ7QUFDQSxVQUFLUSxjQUFMLEdBQXNCLE1BQUtyQixNQUFMLENBQVlnQixhQUFaLENBQTBCLE1BQUtHLFNBQS9CLEVBQTBDRCxLQUExQyxJQUFtRCxNQUFLQyxTQUE5RTtBQUNBLFVBQUtHLGtCQUFMLEdBQTBCLE1BQUtILFNBQUwsS0FBbUIsTUFBS25CLE1BQUwsQ0FBWWEsbUJBQXpEO0FBQ0EsVUFBS1UsZ0JBQUwsR0FBd0IsTUFBS0osU0FBN0I7QUFFQSxVQUFLSyxtQkFBTCxHQUEyQixNQUFLbkIsRUFBaEM7QUFDQSxVQUFLSixPQUFMLENBQWF3QixRQUFiLEdBQXdCeEIsT0FBTyxDQUFDd0IsUUFBaEMsQ0FuRG1DLENBcURuQzs7QUFDQSxVQUFNakIsUUFBUSxHQUFHYixDQUFDLENBQUMrQixVQUFGLENBQWEsTUFBS3pCLE9BQUwsQ0FBYU0sSUFBYixDQUFrQkMsUUFBL0IsQ0FBakI7O0FBRUEsVUFBS21CLFNBQUwsR0FBaUI7QUFDZkMsTUFBQUEsR0FBRyxFQUFHLE1BQUtwQixRQUFTLEVBREw7QUFFZnFCLE1BQUFBLEdBQUcsRUFBRyxNQUFLckIsUUFBUyxFQUZMO0FBR2ZzQixNQUFBQSxNQUFNLEVBQUcsU0FBUXRCLFFBQVM7QUFIWCxLQUFqQjtBQXhEbUM7QUE2RHBDLEcsQ0FFRDs7Ozs7d0NBQ29CO0FBQ2xCLFlBQU11QixhQUFhLEdBQUcsRUFBdEI7QUFFQUEsTUFBQUEsYUFBYSxDQUFDLEtBQUtyQixVQUFOLENBQWIsR0FBaUNmLENBQUMsQ0FBQ3FDLFFBQUYsQ0FBVyxFQUFYLEVBQWUsS0FBSzVCLG1CQUFwQixFQUF5QztBQUN4RTZCLFFBQUFBLElBQUksRUFBRSxLQUFLaEMsT0FBTCxDQUFhaUMsT0FBYixJQUF3QixLQUFLbEMsTUFBTCxDQUFZZ0IsYUFBWixDQUEwQixLQUFLRyxTQUEvQixFQUEwQ2MsSUFEQTtBQUV4RUUsUUFBQUEsU0FBUyxFQUFFO0FBRjZELE9BQXpDLENBQWpDOztBQUtBLFVBQUksS0FBS2xDLE9BQUwsQ0FBYW1DLFdBQWIsS0FBNkIsS0FBakMsRUFBd0M7QUFDdEMsY0FBTXJDLE1BQU0sR0FBRyxLQUFLQSxNQUFMLENBQVlpQixhQUFaLENBQTBCLEtBQUtOLFVBQS9CLEtBQThDcUIsYUFBYSxDQUFDLEtBQUtyQixVQUFOLENBQTFFO0FBQ0EsYUFBS1QsT0FBTCxDQUFhb0MsUUFBYixHQUF3QixLQUFLcEMsT0FBTCxDQUFhb0MsUUFBYixLQUEwQnRDLE1BQU0sQ0FBQ29DLFNBQVAsR0FBbUIsVUFBbkIsR0FBZ0MsV0FBMUQsQ0FBeEI7QUFDQSxhQUFLbEMsT0FBTCxDQUFhcUMsUUFBYixHQUF3QixLQUFLckMsT0FBTCxDQUFhcUMsUUFBYixJQUF5QixTQUFqRDtBQUNEOztBQUVENUMsTUFBQUEsT0FBTyxDQUFDNkMsd0JBQVIsQ0FBaUNSLGFBQWEsQ0FBQyxLQUFLckIsVUFBTixDQUE5QyxFQUFpRSxLQUFLVixNQUF0RSxFQUE4RSxLQUFLRCxNQUFuRixFQUEyRixLQUFLRSxPQUFoRyxFQUF5RyxLQUFLb0IsY0FBOUc7QUFDQTdCLE1BQUFBLEtBQUssQ0FBQ2dELGFBQU4sQ0FBb0IsS0FBS3pDLE1BQUwsQ0FBWWlCLGFBQWhDLEVBQStDZSxhQUEvQztBQUVBLFdBQUtoQyxNQUFMLENBQVkwQyxpQkFBWjtBQUVBLFdBQUt4QixlQUFMLEdBQXVCLEtBQUtsQixNQUFMLENBQVlpQixhQUFaLENBQTBCLEtBQUtOLFVBQS9CLEVBQTJDUSxLQUEzQyxJQUFvRCxLQUFLUixVQUFoRjtBQUVBaEIsTUFBQUEsT0FBTyxDQUFDZ0Qsb0JBQVIsQ0FBNkIsSUFBN0I7QUFFQSxhQUFPLElBQVA7QUFDRDs7OzBCQUVLQyxHLEVBQUs7QUFDVCxZQUFNQyxPQUFPLEdBQUcsQ0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLFFBQWYsQ0FBaEI7QUFFQWxELE1BQUFBLE9BQU8sQ0FBQ21ELFlBQVIsQ0FBcUIsSUFBckIsRUFBMkJGLEdBQTNCLEVBQWdDQyxPQUFoQztBQUNEO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7d0JBQ01FLFMsRUFBVzdDLE8sRUFBUztBQUN0QixZQUFNOEMsS0FBSyxHQUFHLEVBQWQ7QUFDQSxVQUFJQyxNQUFNLEdBQUcsS0FBS2hELE1BQWxCO0FBQ0EsVUFBSWlELFFBQUo7QUFFQWhELE1BQUFBLE9BQU8sR0FBR1QsS0FBSyxDQUFDMEQsU0FBTixDQUFnQmpELE9BQWhCLENBQVY7O0FBRUEsVUFBSWtELE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsY0FBakIsQ0FBZ0NDLElBQWhDLENBQXFDckQsT0FBckMsRUFBOEMsT0FBOUMsQ0FBSixFQUE0RDtBQUMxRCxZQUFJLENBQUNBLE9BQU8sQ0FBQ3NELEtBQWIsRUFBb0I7QUFDbEJQLFVBQUFBLE1BQU0sR0FBR0EsTUFBTSxDQUFDUSxRQUFQLEVBQVQ7QUFDRCxTQUZELE1BRU87QUFDTFIsVUFBQUEsTUFBTSxHQUFHQSxNQUFNLENBQUNPLEtBQVAsQ0FBYXRELE9BQU8sQ0FBQ3NELEtBQXJCLENBQVQ7QUFDRDtBQUNGOztBQUVELFVBQUlKLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsY0FBakIsQ0FBZ0NDLElBQWhDLENBQXFDckQsT0FBckMsRUFBOEMsUUFBOUMsQ0FBSixFQUE2RDtBQUMzRCtDLFFBQUFBLE1BQU0sR0FBR0EsTUFBTSxDQUFDUyxNQUFQLENBQWN4RCxPQUFPLENBQUN3RCxNQUF0QixFQUE4QnhELE9BQU8sQ0FBQ3lELGVBQXRDLENBQVQ7QUFDRDs7QUFFRCxVQUFJLENBQUNDLEtBQUssQ0FBQ0MsT0FBTixDQUFjZCxTQUFkLENBQUwsRUFBK0I7QUFDN0JHLFFBQUFBLFFBQVEsR0FBR0gsU0FBWDtBQUNBQSxRQUFBQSxTQUFTLEdBQUdlLFNBQVo7QUFDRDs7QUFFRCxVQUFJZixTQUFKLEVBQWU7QUFDYkMsUUFBQUEsS0FBSyxDQUFDLEtBQUs1QixTQUFOLENBQUwsR0FBd0I7QUFDdEIsV0FBQ3RCLEVBQUUsQ0FBQ2lFLEVBQUosR0FBU2hCLFNBQVMsQ0FBQ2lCLEdBQVYsQ0FBY2QsUUFBUSxJQUFJQSxRQUFRLENBQUNyQixHQUFULENBQWEsS0FBS2xCLFVBQWxCLENBQTFCO0FBRGEsU0FBeEI7QUFHRCxPQUpELE1BSU87QUFDTCxZQUFJLEtBQUtZLGtCQUFMLElBQTJCLENBQUNyQixPQUFPLENBQUM4QyxLQUF4QyxFQUErQztBQUM3QyxpQkFBT0MsTUFBTSxDQUFDZ0IsUUFBUCxDQUFnQmYsUUFBUSxDQUFDckIsR0FBVCxDQUFhLEtBQUtsQixVQUFsQixDQUFoQixFQUErQ1QsT0FBL0MsQ0FBUDtBQUNEOztBQUNEOEMsUUFBQUEsS0FBSyxDQUFDLEtBQUs1QixTQUFOLENBQUwsR0FBd0I4QixRQUFRLENBQUNyQixHQUFULENBQWEsS0FBS2xCLFVBQWxCLENBQXhCO0FBQ0FULFFBQUFBLE9BQU8sQ0FBQ2dFLEtBQVIsR0FBZ0IsSUFBaEI7QUFDRDs7QUFFRGhFLE1BQUFBLE9BQU8sQ0FBQzhDLEtBQVIsR0FBZ0I5QyxPQUFPLENBQUM4QyxLQUFSLEdBQ2Q7QUFBRSxTQUFDbEQsRUFBRSxDQUFDcUUsR0FBSixHQUFVLENBQUNuQixLQUFELEVBQVE5QyxPQUFPLENBQUM4QyxLQUFoQjtBQUFaLE9BRGMsR0FFZEEsS0FGRjs7QUFJQSxVQUFJRCxTQUFKLEVBQWU7QUFDYixlQUFPRSxNQUFNLENBQUNtQixPQUFQLENBQWVsRSxPQUFmLEVBQXdCbUUsSUFBeEIsQ0FBNkJDLE9BQU8sSUFBSTtBQUM3QyxnQkFBTUMsTUFBTSxHQUFHLEVBQWY7O0FBQ0EsZUFBSyxNQUFNckIsUUFBWCxJQUF1QkgsU0FBdkIsRUFBa0M7QUFDaEN3QixZQUFBQSxNQUFNLENBQUNyQixRQUFRLENBQUNyQixHQUFULENBQWEsS0FBS2xCLFVBQWxCLEVBQThCO0FBQUU2RCxjQUFBQSxHQUFHLEVBQUU7QUFBUCxhQUE5QixDQUFELENBQU4sR0FBdUQsSUFBdkQ7QUFDRDs7QUFFRCxlQUFLLE1BQU10QixRQUFYLElBQXVCb0IsT0FBdkIsRUFBZ0M7QUFDOUJDLFlBQUFBLE1BQU0sQ0FBQ3JCLFFBQVEsQ0FBQ3JCLEdBQVQsQ0FBYSxLQUFLVCxTQUFsQixFQUE2QjtBQUFFb0QsY0FBQUEsR0FBRyxFQUFFO0FBQVAsYUFBN0IsQ0FBRCxDQUFOLEdBQXNEdEIsUUFBdEQ7QUFDRDs7QUFFRCxpQkFBT3FCLE1BQVA7QUFDRCxTQVhNLENBQVA7QUFZRDs7QUFFRCxhQUFPdEIsTUFBTSxDQUFDd0IsT0FBUCxDQUFldkUsT0FBZixDQUFQO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozt3QkFDTXdFLGMsRUFBZ0JDLGtCLEVBQW9CekUsT0FBTyxHQUFHLEUsRUFBSTtBQUNwRCxVQUFJMEUsS0FBSyxHQUFHRCxrQkFBWjs7QUFFQSxVQUFJQSxrQkFBa0IsWUFBWSxLQUFLMUUsTUFBdkMsRUFBK0M7QUFDN0MyRSxRQUFBQSxLQUFLLEdBQUdELGtCQUFrQixDQUFDLEtBQUt2RCxTQUFOLENBQTFCO0FBQ0Q7O0FBRURzRCxNQUFBQSxjQUFjLENBQUM1QyxHQUFmLENBQW1CLEtBQUtuQixVQUF4QixFQUFvQ2lFLEtBQXBDO0FBRUEsVUFBSTFFLE9BQU8sQ0FBQzJFLElBQVIsS0FBaUIsS0FBckIsRUFBNEI7QUFFNUIzRSxNQUFBQSxPQUFPLEdBQUdrRCxNQUFNLENBQUMwQixNQUFQLENBQWM7QUFDdEJDLFFBQUFBLE1BQU0sRUFBRSxDQUFDLEtBQUtwRSxVQUFOLENBRGM7QUFFdEJ5QixRQUFBQSxTQUFTLEVBQUUsQ0FBQyxLQUFLekIsVUFBTixDQUZXO0FBR3RCcUUsUUFBQUEsV0FBVyxFQUFFO0FBSFMsT0FBZCxFQUlQOUUsT0FKTyxDQUFWLENBWG9ELENBaUJwRDs7QUFDQSxhQUFPd0UsY0FBYyxDQUFDRyxJQUFmLENBQW9CM0UsT0FBcEIsQ0FBUDtBQUNEO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OzJCQUNTd0UsYyxFQUFnQk8sTSxFQUFRL0UsTyxFQUFTO0FBQ3RDK0UsTUFBQUEsTUFBTSxHQUFHQSxNQUFNLElBQUksRUFBbkI7QUFDQS9FLE1BQUFBLE9BQU8sR0FBR0EsT0FBTyxJQUFJLEVBQXJCO0FBRUEsYUFBTyxLQUFLRCxNQUFMLENBQVk4QixNQUFaLENBQW1Ca0QsTUFBbkIsRUFBMkIvRSxPQUEzQixFQUNKbUUsSUFESSxDQUNDYSxtQkFBbUIsSUFBSVIsY0FBYyxDQUFDLEtBQUs5QyxTQUFMLENBQWVFLEdBQWhCLENBQWQsQ0FBbUNvRCxtQkFBbkMsRUFBd0RoRixPQUF4RCxFQUMxQm1FLElBRDBCLENBQ3JCLE1BQU1hLG1CQURlLENBRHhCLENBQVA7QUFJRDs7OzJDQUVzQkMsSyxFQUFPO0FBQzVCLFVBQUksT0FBT0EsS0FBUCxLQUFpQixRQUFyQixFQUErQjtBQUM3QixlQUFPLEtBQUs3RSxFQUFMLEtBQVk2RSxLQUFuQjtBQUNEOztBQUVELFVBQUlBLEtBQUssSUFBSUEsS0FBSyxDQUFDMUUsUUFBbkIsRUFBNkI7QUFDM0IsZUFBTyxLQUFLSCxFQUFMLEtBQVk2RSxLQUFLLENBQUMxRSxRQUF6QjtBQUNEOztBQUVELGFBQU8sQ0FBQyxLQUFLRixTQUFiO0FBQ0Q7Ozs7RUF2T3FCVixXOztBQTBPeEJ1RixNQUFNLENBQUNDLE9BQVAsR0FBaUJ0RixTQUFqQjtBQUNBcUYsTUFBTSxDQUFDQyxPQUFQLENBQWV0RixTQUFmLEdBQTJCQSxTQUEzQjtBQUNBcUYsTUFBTSxDQUFDQyxPQUFQLENBQWVDLE9BQWYsR0FBeUJ2RixTQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuLy4uL3V0aWxzJyk7XG5jb25zdCBIZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBBc3NvY2lhdGlvbiA9IHJlcXVpcmUoJy4vYmFzZScpO1xuY29uc3QgT3AgPSByZXF1aXJlKCcuLi9vcGVyYXRvcnMnKTtcblxuLyoqXG4gKiBPbmUtdG8tb25lIGFzc29jaWF0aW9uXG4gKlxuICogSW4gdGhlIEFQSSByZWZlcmVuY2UgYmVsb3csIGFkZCB0aGUgbmFtZSBvZiB0aGUgYXNzb2NpYXRpb24gdG8gdGhlIG1ldGhvZCwgZS5nLiBmb3IgYFVzZXIuYmVsb25nc1RvKFByb2plY3QpYCB0aGUgZ2V0dGVyIHdpbGwgYmUgYHVzZXIuZ2V0UHJvamVjdCgpYC5cbiAqXG4gKiBAc2VlIHtAbGluayBNb2RlbC5iZWxvbmdzVG99XG4gKi9cbmNsYXNzIEJlbG9uZ3NUbyBleHRlbmRzIEFzc29jaWF0aW9uIHtcbiAgY29uc3RydWN0b3Ioc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICBzdXBlcihzb3VyY2UsIHRhcmdldCwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLmFzc29jaWF0aW9uVHlwZSA9ICdCZWxvbmdzVG8nO1xuICAgIHRoaXMuaXNTaW5nbGVBc3NvY2lhdGlvbiA9IHRydWU7XG4gICAgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlID0ge307XG5cbiAgICBpZiAodGhpcy5hcykge1xuICAgICAgdGhpcy5pc0FsaWFzZWQgPSB0cnVlO1xuICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB7XG4gICAgICAgIHNpbmd1bGFyOiB0aGlzLmFzXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFzID0gdGhpcy50YXJnZXQub3B0aW9ucy5uYW1lLnNpbmd1bGFyO1xuICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB0aGlzLnRhcmdldC5vcHRpb25zLm5hbWU7XG4gICAgfVxuXG4gICAgaWYgKF8uaXNPYmplY3QodGhpcy5vcHRpb25zLmZvcmVpZ25LZXkpKSB7XG4gICAgICB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUgPSB0aGlzLm9wdGlvbnMuZm9yZWlnbktleTtcbiAgICAgIHRoaXMuZm9yZWlnbktleSA9IHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZS5uYW1lIHx8IHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZS5maWVsZE5hbWU7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZm9yZWlnbktleSkge1xuICAgICAgdGhpcy5mb3JlaWduS2V5ID0gdGhpcy5vcHRpb25zLmZvcmVpZ25LZXk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmZvcmVpZ25LZXkpIHtcbiAgICAgIHRoaXMuZm9yZWlnbktleSA9IFV0aWxzLmNhbWVsaXplKFxuICAgICAgICBbXG4gICAgICAgICAgdGhpcy5hcyxcbiAgICAgICAgICB0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXG4gICAgICAgIF0uam9pbignXycpXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMuaWRlbnRpZmllciA9IHRoaXMuZm9yZWlnbktleTtcbiAgICBpZiAodGhpcy5zb3VyY2UucmF3QXR0cmlidXRlc1t0aGlzLmlkZW50aWZpZXJdKSB7XG4gICAgICB0aGlzLmlkZW50aWZpZXJGaWVsZCA9IHRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5pZGVudGlmaWVyXS5maWVsZCB8fCB0aGlzLmlkZW50aWZpZXI7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5vcHRpb25zLnRhcmdldEtleVxuICAgICAgJiYgIXRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy5vcHRpb25zLnRhcmdldEtleV1cbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhdHRyaWJ1dGUgXCIke3RoaXMub3B0aW9ucy50YXJnZXRLZXl9XCIgcGFzc2VkIGFzIHRhcmdldEtleSwgZGVmaW5lIHRoaXMgYXR0cmlidXRlIG9uIG1vZGVsIFwiJHt0aGlzLnRhcmdldC5uYW1lfVwiIGZpcnN0YCk7XG4gICAgfVxuXG4gICAgdGhpcy50YXJnZXRLZXkgPSB0aGlzLm9wdGlvbnMudGFyZ2V0S2V5IHx8IHRoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGU7XG4gICAgdGhpcy50YXJnZXRLZXlGaWVsZCA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy50YXJnZXRLZXldLmZpZWxkIHx8IHRoaXMudGFyZ2V0S2V5O1xuICAgIHRoaXMudGFyZ2V0S2V5SXNQcmltYXJ5ID0gdGhpcy50YXJnZXRLZXkgPT09IHRoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGU7XG4gICAgdGhpcy50YXJnZXRJZGVudGlmaWVyID0gdGhpcy50YXJnZXRLZXk7XG5cbiAgICB0aGlzLmFzc29jaWF0aW9uQWNjZXNzb3IgPSB0aGlzLmFzO1xuICAgIHRoaXMub3B0aW9ucy51c2VIb29rcyA9IG9wdGlvbnMudXNlSG9va3M7XG5cbiAgICAvLyBHZXQgc2luZ3VsYXIgbmFtZSwgdHJ5aW5nIHRvIHVwcGVyY2FzZSB0aGUgZmlyc3QgbGV0dGVyLCB1bmxlc3MgdGhlIG1vZGVsIGZvcmJpZHMgaXRcbiAgICBjb25zdCBzaW5ndWxhciA9IF8udXBwZXJGaXJzdCh0aGlzLm9wdGlvbnMubmFtZS5zaW5ndWxhcik7XG5cbiAgICB0aGlzLmFjY2Vzc29ycyA9IHtcbiAgICAgIGdldDogYGdldCR7c2luZ3VsYXJ9YCxcbiAgICAgIHNldDogYHNldCR7c2luZ3VsYXJ9YCxcbiAgICAgIGNyZWF0ZTogYGNyZWF0ZSR7c2luZ3VsYXJ9YFxuICAgIH07XG4gIH1cblxuICAvLyB0aGUgaWQgaXMgaW4gdGhlIHNvdXJjZSB0YWJsZVxuICBfaW5qZWN0QXR0cmlidXRlcygpIHtcbiAgICBjb25zdCBuZXdBdHRyaWJ1dGVzID0ge307XG5cbiAgICBuZXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0gPSBfLmRlZmF1bHRzKHt9LCB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUsIHtcbiAgICAgIHR5cGU6IHRoaXMub3B0aW9ucy5rZXlUeXBlIHx8IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy50YXJnZXRLZXldLnR5cGUsXG4gICAgICBhbGxvd051bGw6IHRydWVcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29uc3RyYWludHMgIT09IGZhbHNlKSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLnNvdXJjZS5yYXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0gfHwgbmV3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldO1xuICAgICAgdGhpcy5vcHRpb25zLm9uRGVsZXRlID0gdGhpcy5vcHRpb25zLm9uRGVsZXRlIHx8IChzb3VyY2UuYWxsb3dOdWxsID8gJ1NFVCBOVUxMJyA6ICdOTyBBQ1RJT04nKTtcbiAgICAgIHRoaXMub3B0aW9ucy5vblVwZGF0ZSA9IHRoaXMub3B0aW9ucy5vblVwZGF0ZSB8fCAnQ0FTQ0FERSc7XG4gICAgfVxuXG4gICAgSGVscGVycy5hZGRGb3JlaWduS2V5Q29uc3RyYWludHMobmV3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldLCB0aGlzLnRhcmdldCwgdGhpcy5zb3VyY2UsIHRoaXMub3B0aW9ucywgdGhpcy50YXJnZXRLZXlGaWVsZCk7XG4gICAgVXRpbHMubWVyZ2VEZWZhdWx0cyh0aGlzLnNvdXJjZS5yYXdBdHRyaWJ1dGVzLCBuZXdBdHRyaWJ1dGVzKTtcblxuICAgIHRoaXMuc291cmNlLnJlZnJlc2hBdHRyaWJ1dGVzKCk7XG5cbiAgICB0aGlzLmlkZW50aWZpZXJGaWVsZCA9IHRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5maWVsZCB8fCB0aGlzLmZvcmVpZ25LZXk7XG5cbiAgICBIZWxwZXJzLmNoZWNrTmFtaW5nQ29sbGlzaW9uKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBtaXhpbihvYmopIHtcbiAgICBjb25zdCBtZXRob2RzID0gWydnZXQnLCAnc2V0JywgJ2NyZWF0ZSddO1xuXG4gICAgSGVscGVycy5taXhpbk1ldGhvZHModGhpcywgb2JqLCBtZXRob2RzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFzc29jaWF0ZWQgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9kZWx8QXJyYXk8TW9kZWw+fSBpbnN0YW5jZXMgc291cmNlIGluc3RhbmNlc1xuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICBbb3B0aW9uc10gZmluZCBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLnNjb3BlXSAgQXBwbHkgYSBzY29wZSBvbiB0aGUgcmVsYXRlZCBtb2RlbCwgb3IgcmVtb3ZlIGl0cyBkZWZhdWx0IHNjb3BlIGJ5IHBhc3NpbmcgZmFsc2UuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgICAgIFtvcHRpb25zLnNjaGVtYV0gQXBwbHkgYSBzY2hlbWEgb24gdGhlIHJlbGF0ZWQgbW9kZWxcbiAgICpcbiAgICogQHNlZVxuICAgKiB7QGxpbmsgTW9kZWwuZmluZE9uZX0gZm9yIGEgZnVsbCBleHBsYW5hdGlvbiBvZiBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE1vZGVsPn1cbiAgICovXG4gIGdldChpbnN0YW5jZXMsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB3aGVyZSA9IHt9O1xuICAgIGxldCBUYXJnZXQgPSB0aGlzLnRhcmdldDtcbiAgICBsZXQgaW5zdGFuY2U7XG5cbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xuXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAnc2NvcGUnKSkge1xuICAgICAgaWYgKCFvcHRpb25zLnNjb3BlKSB7XG4gICAgICAgIFRhcmdldCA9IFRhcmdldC51bnNjb3BlZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgVGFyZ2V0ID0gVGFyZ2V0LnNjb3BlKG9wdGlvbnMuc2NvcGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgJ3NjaGVtYScpKSB7XG4gICAgICBUYXJnZXQgPSBUYXJnZXQuc2NoZW1hKG9wdGlvbnMuc2NoZW1hLCBvcHRpb25zLnNjaGVtYURlbGltaXRlcik7XG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGluc3RhbmNlcykpIHtcbiAgICAgIGluc3RhbmNlID0gaW5zdGFuY2VzO1xuICAgICAgaW5zdGFuY2VzID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmIChpbnN0YW5jZXMpIHtcbiAgICAgIHdoZXJlW3RoaXMudGFyZ2V0S2V5XSA9IHtcbiAgICAgICAgW09wLmluXTogaW5zdGFuY2VzLm1hcChpbnN0YW5jZSA9PiBpbnN0YW5jZS5nZXQodGhpcy5mb3JlaWduS2V5KSlcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnRhcmdldEtleUlzUHJpbWFyeSAmJiAhb3B0aW9ucy53aGVyZSkge1xuICAgICAgICByZXR1cm4gVGFyZ2V0LmZpbmRCeVBrKGluc3RhbmNlLmdldCh0aGlzLmZvcmVpZ25LZXkpLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHdoZXJlW3RoaXMudGFyZ2V0S2V5XSA9IGluc3RhbmNlLmdldCh0aGlzLmZvcmVpZ25LZXkpO1xuICAgICAgb3B0aW9ucy5saW1pdCA9IG51bGw7XG4gICAgfVxuXG4gICAgb3B0aW9ucy53aGVyZSA9IG9wdGlvbnMud2hlcmUgP1xuICAgICAgeyBbT3AuYW5kXTogW3doZXJlLCBvcHRpb25zLndoZXJlXSB9IDpcbiAgICAgIHdoZXJlO1xuXG4gICAgaWYgKGluc3RhbmNlcykge1xuICAgICAgcmV0dXJuIFRhcmdldC5maW5kQWxsKG9wdGlvbnMpLnRoZW4ocmVzdWx0cyA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGluc3RhbmNlIG9mIGluc3RhbmNlcykge1xuICAgICAgICAgIHJlc3VsdFtpbnN0YW5jZS5nZXQodGhpcy5mb3JlaWduS2V5LCB7IHJhdzogdHJ1ZSB9KV0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBpbnN0YW5jZSBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgcmVzdWx0W2luc3RhbmNlLmdldCh0aGlzLnRhcmdldEtleSwgeyByYXc6IHRydWUgfSldID0gaW5zdGFuY2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFRhcmdldC5maW5kT25lKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgYXNzb2NpYXRlZCBtb2RlbC5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2UgdGhlIHNvdXJjZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gez88TW9kZWw+fHN0cmluZ3xudW1iZXJ9IFthc3NvY2lhdGVkSW5zdGFuY2VdIEFuIHBlcnNpc3RlZCBpbnN0YW5jZSBvciB0aGUgcHJpbWFyeSBrZXkgb2YgYW4gaW5zdGFuY2UgdG8gYXNzb2NpYXRlIHdpdGggdGhpcy4gUGFzcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgdG8gcmVtb3ZlIHRoZSBhc3NvY2lhdGlvbi5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBvcHRpb25zIHBhc3NlZCB0byBgdGhpcy5zYXZlYFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnNhdmU9dHJ1ZV0gU2tpcCBzYXZpbmcgdGhpcyBhZnRlciBzZXR0aW5nIHRoZSBmb3JlaWduIGtleSBpZiBmYWxzZS5cbiAgICpcbiAgICogIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgc2V0KHNvdXJjZUluc3RhbmNlLCBhc3NvY2lhdGVkSW5zdGFuY2UsIG9wdGlvbnMgPSB7fSkge1xuICAgIGxldCB2YWx1ZSA9IGFzc29jaWF0ZWRJbnN0YW5jZTtcblxuICAgIGlmIChhc3NvY2lhdGVkSW5zdGFuY2UgaW5zdGFuY2VvZiB0aGlzLnRhcmdldCkge1xuICAgICAgdmFsdWUgPSBhc3NvY2lhdGVkSW5zdGFuY2VbdGhpcy50YXJnZXRLZXldO1xuICAgIH1cblxuICAgIHNvdXJjZUluc3RhbmNlLnNldCh0aGlzLmZvcmVpZ25LZXksIHZhbHVlKTtcblxuICAgIGlmIChvcHRpb25zLnNhdmUgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBmaWVsZHM6IFt0aGlzLmZvcmVpZ25LZXldLFxuICAgICAgYWxsb3dOdWxsOiBbdGhpcy5mb3JlaWduS2V5XSxcbiAgICAgIGFzc29jaWF0aW9uOiB0cnVlXG4gICAgfSwgb3B0aW9ucyk7XG5cbiAgICAvLyBwYXNzZXMgdGhlIGNoYW5nZWQgZmllbGQgdG8gc2F2ZSwgc28gb25seSB0aGF0IGZpZWxkIGdldCB1cGRhdGVkLlxuICAgIHJldHVybiBzb3VyY2VJbnN0YW5jZS5zYXZlKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYXNzb2NpYXRlZCBtb2RlbCBhbmQgYXNzb2NpYXRlIGl0IHdpdGggdGhpcy5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2UgdGhlIHNvdXJjZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW3ZhbHVlcz17fV0gdmFsdWVzIHRvIGNyZWF0ZSBhc3NvY2lhdGVkIG1vZGVsIGluc3RhbmNlIHdpdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBPcHRpb25zIHBhc3NlZCB0byBgdGFyZ2V0LmNyZWF0ZWAgYW5kIHNldEFzc29jaWF0aW9uLlxuICAgKlxuICAgKiBAc2VlXG4gICAqIHtAbGluayBNb2RlbCNjcmVhdGV9ICBmb3IgYSBmdWxsIGV4cGxhbmF0aW9uIG9mIG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8TW9kZWw+fSBUaGUgY3JlYXRlZCB0YXJnZXQgbW9kZWxcbiAgICovXG4gIGNyZWF0ZShzb3VyY2VJbnN0YW5jZSwgdmFsdWVzLCBvcHRpb25zKSB7XG4gICAgdmFsdWVzID0gdmFsdWVzIHx8IHt9O1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgcmV0dXJuIHRoaXMudGFyZ2V0LmNyZWF0ZSh2YWx1ZXMsIG9wdGlvbnMpXG4gICAgICAudGhlbihuZXdBc3NvY2lhdGVkT2JqZWN0ID0+IHNvdXJjZUluc3RhbmNlW3RoaXMuYWNjZXNzb3JzLnNldF0obmV3QXNzb2NpYXRlZE9iamVjdCwgb3B0aW9ucylcbiAgICAgICAgLnRoZW4oKCkgPT4gbmV3QXNzb2NpYXRlZE9iamVjdClcbiAgICAgICk7XG4gIH1cblxuICB2ZXJpZnlBc3NvY2lhdGlvbkFsaWFzKGFsaWFzKSB7XG4gICAgaWYgKHR5cGVvZiBhbGlhcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLmFzID09PSBhbGlhcztcbiAgICB9XG5cbiAgICBpZiAoYWxpYXMgJiYgYWxpYXMuc2luZ3VsYXIpIHtcbiAgICAgIHJldHVybiB0aGlzLmFzID09PSBhbGlhcy5zaW5ndWxhcjtcbiAgICB9XG5cbiAgICByZXR1cm4gIXRoaXMuaXNBbGlhc2VkO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQmVsb25nc1RvO1xubW9kdWxlLmV4cG9ydHMuQmVsb25nc1RvID0gQmVsb25nc1RvO1xubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IEJlbG9uZ3NUbztcbiJdfQ==