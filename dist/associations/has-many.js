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
 * One-to-many association
 *
 * In the API reference below, add the name of the association to the method, e.g. for `User.hasMany(Project)` the getter will be `user.getProjects()`.
 * If the association is aliased, use the alias instead, e.g. `User.hasMany(Project, { as: 'jobs' })` will be `user.getJobs()`.
 *
 * @see {@link Model.hasMany}
 */


let HasMany = /*#__PURE__*/function (_Association) {
  _inherits(HasMany, _Association);

  var _super = _createSuper(HasMany);

  function HasMany(source, target, options) {
    var _this;

    _classCallCheck(this, HasMany);

    _this = _super.call(this, source, target, options);
    _this.associationType = 'HasMany';
    _this.targetAssociation = null;
    _this.sequelize = source.sequelize;
    _this.isMultiAssociation = true;
    _this.foreignKeyAttribute = {};

    if (_this.options.through) {
      throw new Error('N:M associations are not supported with hasMany. Use belongsToMany instead');
    }
    /*
    * If self association, this is the target association
    */


    if (_this.isSelfAssociation) {
      _this.targetAssociation = _assertThisInitialized(_this);
    }

    if (_this.as) {
      _this.isAliased = true;

      if (_.isPlainObject(_this.as)) {
        _this.options.name = _this.as;
        _this.as = _this.as.plural;
      } else {
        _this.options.name = {
          plural: _this.as,
          singular: Utils.singularize(_this.as)
        };
      }
    } else {
      _this.as = _this.target.options.name.plural;
      _this.options.name = _this.target.options.name;
    }
    /*
     * Foreign key setup
     */


    if (_.isObject(_this.options.foreignKey)) {
      _this.foreignKeyAttribute = _this.options.foreignKey;
      _this.foreignKey = _this.foreignKeyAttribute.name || _this.foreignKeyAttribute.fieldName;
    } else if (_this.options.foreignKey) {
      _this.foreignKey = _this.options.foreignKey;
    }

    if (!_this.foreignKey) {
      _this.foreignKey = Utils.camelize([_this.source.options.name.singular, _this.source.primaryKeyAttribute].join('_'));
    }

    if (_this.target.rawAttributes[_this.foreignKey]) {
      _this.identifierField = _this.target.rawAttributes[_this.foreignKey].field || _this.foreignKey;
      _this.foreignKeyField = _this.target.rawAttributes[_this.foreignKey].field || _this.foreignKey;
    }
    /*
     * Source key setup
     */


    _this.sourceKey = _this.options.sourceKey || _this.source.primaryKeyAttribute;

    if (_this.source.rawAttributes[_this.sourceKey]) {
      _this.sourceKeyAttribute = _this.sourceKey;
      _this.sourceKeyField = _this.source.rawAttributes[_this.sourceKey].field || _this.sourceKey;
    } else {
      _this.sourceKeyAttribute = _this.source.primaryKeyAttribute;
      _this.sourceKeyField = _this.source.primaryKeyField;
    } // Get singular and plural names
    // try to uppercase the first letter, unless the model forbids it


    const plural = _.upperFirst(_this.options.name.plural);

    const singular = _.upperFirst(_this.options.name.singular);

    _this.associationAccessor = _this.as;
    _this.accessors = {
      get: `get${plural}`,
      set: `set${plural}`,
      addMultiple: `add${plural}`,
      add: `add${singular}`,
      create: `create${singular}`,
      remove: `remove${singular}`,
      removeMultiple: `remove${plural}`,
      hasSingle: `has${singular}`,
      hasAll: `has${plural}`,
      count: `count${plural}`
    };
    return _this;
  } // the id is in the target table
  // or in an extra table which connects two tables


  _createClass(HasMany, [{
    key: "_injectAttributes",
    value: function _injectAttributes() {
      const newAttributes = {}; // Create a new options object for use with addForeignKeyConstraints, to avoid polluting this.options in case it is later used for a n:m

      const constraintOptions = _.clone(this.options);

      newAttributes[this.foreignKey] = _.defaults({}, this.foreignKeyAttribute, {
        type: this.options.keyType || this.source.rawAttributes[this.sourceKeyAttribute].type,
        allowNull: true
      });

      if (this.options.constraints !== false) {
        const target = this.target.rawAttributes[this.foreignKey] || newAttributes[this.foreignKey];
        constraintOptions.onDelete = constraintOptions.onDelete || (target.allowNull ? 'SET NULL' : 'CASCADE');
        constraintOptions.onUpdate = constraintOptions.onUpdate || 'CASCADE';
      }

      Helpers.addForeignKeyConstraints(newAttributes[this.foreignKey], this.source, this.target, constraintOptions, this.sourceKeyField);
      Utils.mergeDefaults(this.target.rawAttributes, newAttributes);
      this.target.refreshAttributes();
      this.source.refreshAttributes();
      this.identifierField = this.target.rawAttributes[this.foreignKey].field || this.foreignKey;
      this.foreignKeyField = this.target.rawAttributes[this.foreignKey].field || this.foreignKey;
      this.sourceKeyField = this.source.rawAttributes[this.sourceKey].field || this.sourceKey;
      Helpers.checkNamingCollision(this);
      return this;
    }
  }, {
    key: "mixin",
    value: function mixin(obj) {
      const methods = ['get', 'count', 'hasSingle', 'hasAll', 'set', 'add', 'addMultiple', 'remove', 'removeMultiple', 'create'];
      const aliases = {
        hasSingle: 'has',
        hasAll: 'has',
        addMultiple: 'add',
        removeMultiple: 'remove'
      };
      Helpers.mixinMethods(this, obj, methods, aliases);
    }
    /**
     * Get everything currently associated with this, using an optional where clause.
     *
     * @param {Model|Array<Model>} instances source instances
     * @param {Object} [options] find options
     * @param {Object} [options.where] An optional where clause to limit the associated models
     * @param {string|boolean} [options.scope] Apply a scope on the related model, or remove its default scope by passing false
     * @param {string} [options.schema] Apply a schema on the related model
     *
     * @see
     * {@link Model.findAll}  for a full explanation of options
     *
     * @returns {Promise<Array<Model>>}
     */

  }, {
    key: "get",
    value: function get(instances, options = {}) {
      const where = {};
      let Model = this.target;
      let instance;
      let values;

      if (!Array.isArray(instances)) {
        instance = instances;
        instances = undefined;
      }

      options = Object.assign({}, options);

      if (this.scope) {
        Object.assign(where, this.scope);
      }

      if (instances) {
        values = instances.map(instance => instance.get(this.sourceKey, {
          raw: true
        }));

        if (options.limit && instances.length > 1) {
          options.groupedLimit = {
            limit: options.limit,
            on: this,
            // association
            values
          };
          delete options.limit;
        } else {
          where[this.foreignKey] = {
            [Op.in]: values
          };
          delete options.groupedLimit;
        }
      } else {
        where[this.foreignKey] = instance.get(this.sourceKey, {
          raw: true
        });
      }

      options.where = options.where ? {
        [Op.and]: [where, options.where]
      } : where;

      if (Object.prototype.hasOwnProperty.call(options, 'scope')) {
        if (!options.scope) {
          Model = Model.unscoped();
        } else {
          Model = Model.scope(options.scope);
        }
      }

      if (Object.prototype.hasOwnProperty.call(options, 'schema')) {
        Model = Model.schema(options.schema, options.schemaDelimiter);
      }

      return Model.findAll(options).then(results => {
        if (instance) return results;
        const result = {};

        for (const instance of instances) {
          result[instance.get(this.sourceKey, {
            raw: true
          })] = [];
        }

        for (const instance of results) {
          result[instance.get(this.foreignKey, {
            raw: true
          })].push(instance);
        }

        return result;
      });
    }
    /**
     * Count everything currently associated with this, using an optional where clause.
     *
     * @param {Model}        instance the source instance
     * @param {Object}         [options] find & count options
     * @param {Object}         [options.where] An optional where clause to limit the associated models
     * @param {string|boolean} [options.scope] Apply a scope on the related model, or remove its default scope by passing false
     *
     * @returns {Promise<number>}
     */

  }, {
    key: "count",
    value: function count(instance, options) {
      options = Utils.cloneDeep(options);
      options.attributes = [[this.sequelize.fn('COUNT', this.sequelize.col(`${this.target.name}.${this.target.primaryKeyField}`)), 'count']];
      options.raw = true;
      options.plain = true;
      return this.get(instance, options).then(result => parseInt(result.count, 10));
    }
    /**
     * Check if one or more rows are associated with `this`.
     *
     * @param {Model} sourceInstance the source instance
     * @param {Model|Model[]|string[]|string|number[]|number} [targetInstances] Can be an array of instances or their primary keys
     * @param {Object} [options] Options passed to getAssociations
     *
     * @returns {Promise}
     */

  }, {
    key: "has",
    value: function has(sourceInstance, targetInstances, options) {
      const where = {};

      if (!Array.isArray(targetInstances)) {
        targetInstances = [targetInstances];
      }

      options = Object.assign({}, options, {
        scope: false,
        attributes: [this.target.primaryKeyAttribute],
        raw: true
      });
      where[Op.or] = targetInstances.map(instance => {
        if (instance instanceof this.target) {
          return instance.where();
        }

        return {
          [this.target.primaryKeyAttribute]: instance
        };
      });
      options.where = {
        [Op.and]: [where, options.where]
      };
      return this.get(sourceInstance, options).then(associatedObjects => associatedObjects.length === targetInstances.length);
    }
    /**
     * Set the associated models by passing an array of persisted instances or their primary keys. Everything that is not in the passed array will be un-associated
     *
     * @param {Model} sourceInstance source instance to associate new instances with
     * @param {Model|Model[]|string[]|string|number[]|number} [targetInstances] An array of persisted instances or primary key of instances to associate with this. Pass `null` or `undefined` to remove all associations.
     * @param {Object} [options] Options passed to `target.findAll` and `update`.
     * @param {Object} [options.validate] Run validation for the join model
     *
     * @returns {Promise}
     */

  }, {
    key: "set",
    value: function set(sourceInstance, targetInstances, options) {
      if (targetInstances === null) {
        targetInstances = [];
      } else {
        targetInstances = this.toInstanceArray(targetInstances);
      }

      return this.get(sourceInstance, _.defaults({
        scope: false,
        raw: true
      }, options)).then(oldAssociations => {
        const promises = [];
        const obsoleteAssociations = oldAssociations.filter(old => !targetInstances.find(obj => obj[this.target.primaryKeyAttribute] === old[this.target.primaryKeyAttribute]));
        const unassociatedObjects = targetInstances.filter(obj => !oldAssociations.find(old => obj[this.target.primaryKeyAttribute] === old[this.target.primaryKeyAttribute]));
        let updateWhere;
        let update;

        if (obsoleteAssociations.length > 0) {
          update = {};
          update[this.foreignKey] = null;
          updateWhere = {
            [this.target.primaryKeyAttribute]: obsoleteAssociations.map(associatedObject => associatedObject[this.target.primaryKeyAttribute])
          };
          promises.push(this.target.unscoped().update(update, _.defaults({
            where: updateWhere
          }, options)));
        }

        if (unassociatedObjects.length > 0) {
          updateWhere = {};
          update = {};
          update[this.foreignKey] = sourceInstance.get(this.sourceKey);
          Object.assign(update, this.scope);
          updateWhere[this.target.primaryKeyAttribute] = unassociatedObjects.map(unassociatedObject => unassociatedObject[this.target.primaryKeyAttribute]);
          promises.push(this.target.unscoped().update(update, _.defaults({
            where: updateWhere
          }, options)));
        }

        return Utils.Promise.all(promises).return(sourceInstance);
      });
    }
    /**
     * Associate one or more target rows with `this`. This method accepts a Model / string / number to associate a single row,
     * or a mixed array of Model / string / numbers to associate multiple rows.
     *
     * @param {Model} sourceInstance the source instance
     * @param {Model|Model[]|string[]|string|number[]|number} [targetInstances] A single instance or primary key, or a mixed array of persisted instances or primary keys
     * @param {Object} [options] Options passed to `target.update`.
     *
     * @returns {Promise}
     */

  }, {
    key: "add",
    value: function add(sourceInstance, targetInstances, options = {}) {
      if (!targetInstances) return Utils.Promise.resolve();
      const update = {};
      targetInstances = this.toInstanceArray(targetInstances);
      update[this.foreignKey] = sourceInstance.get(this.sourceKey);
      Object.assign(update, this.scope);
      const where = {
        [this.target.primaryKeyAttribute]: targetInstances.map(unassociatedObject => unassociatedObject.get(this.target.primaryKeyAttribute))
      };
      return this.target.unscoped().update(update, _.defaults({
        where
      }, options)).return(sourceInstance);
    }
    /**
     * Un-associate one or several target rows.
     *
     * @param {Model} sourceInstance instance to un associate instances with
     * @param {Model|Model[]|string|string[]|number|number[]} [targetInstances] Can be an Instance or its primary key, or a mixed array of instances and primary keys
     * @param {Object} [options] Options passed to `target.update`
     *
     * @returns {Promise}
     */

  }, {
    key: "remove",
    value: function remove(sourceInstance, targetInstances, options = {}) {
      const update = {
        [this.foreignKey]: null
      };
      targetInstances = this.toInstanceArray(targetInstances);
      const where = {
        [this.foreignKey]: sourceInstance.get(this.sourceKey),
        [this.target.primaryKeyAttribute]: targetInstances.map(targetInstance => targetInstance.get(this.target.primaryKeyAttribute))
      };
      return this.target.unscoped().update(update, _.defaults({
        where
      }, options)).return(this);
    }
    /**
     * Create a new instance of the associated model and associate it with this.
     *
     * @param {Model} sourceInstance source instance
     * @param {Object} [values] values for target model instance
     * @param {Object} [options] Options passed to `target.create`
     *
     * @returns {Promise}
     */

  }, {
    key: "create",
    value: function create(sourceInstance, values, options = {}) {
      if (Array.isArray(options)) {
        options = {
          fields: options
        };
      }

      if (values === undefined) {
        values = {};
      }

      if (this.scope) {
        for (const attribute of Object.keys(this.scope)) {
          values[attribute] = this.scope[attribute];
          if (options.fields) options.fields.push(attribute);
        }
      }

      values[this.foreignKey] = sourceInstance.get(this.sourceKey);
      if (options.fields) options.fields.push(this.foreignKey);
      return this.target.create(values, options);
    }
  }, {
    key: "verifyAssociationAlias",
    value: function verifyAssociationAlias(alias) {
      if (typeof alias === 'string') {
        return this.as === alias;
      }

      if (alias && alias.plural) {
        return this.as === alias.plural;
      }

      return !this.isAliased;
    }
  }]);

  return HasMany;
}(Association);

module.exports = HasMany;
module.exports.HasMany = HasMany;
module.exports.default = HasMany;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvaGFzLW1hbnkuanMiXSwibmFtZXMiOlsiVXRpbHMiLCJyZXF1aXJlIiwiSGVscGVycyIsIl8iLCJBc3NvY2lhdGlvbiIsIk9wIiwiSGFzTWFueSIsInNvdXJjZSIsInRhcmdldCIsIm9wdGlvbnMiLCJhc3NvY2lhdGlvblR5cGUiLCJ0YXJnZXRBc3NvY2lhdGlvbiIsInNlcXVlbGl6ZSIsImlzTXVsdGlBc3NvY2lhdGlvbiIsImZvcmVpZ25LZXlBdHRyaWJ1dGUiLCJ0aHJvdWdoIiwiRXJyb3IiLCJpc1NlbGZBc3NvY2lhdGlvbiIsImFzIiwiaXNBbGlhc2VkIiwiaXNQbGFpbk9iamVjdCIsIm5hbWUiLCJwbHVyYWwiLCJzaW5ndWxhciIsInNpbmd1bGFyaXplIiwiaXNPYmplY3QiLCJmb3JlaWduS2V5IiwiZmllbGROYW1lIiwiY2FtZWxpemUiLCJwcmltYXJ5S2V5QXR0cmlidXRlIiwiam9pbiIsInJhd0F0dHJpYnV0ZXMiLCJpZGVudGlmaWVyRmllbGQiLCJmaWVsZCIsImZvcmVpZ25LZXlGaWVsZCIsInNvdXJjZUtleSIsInNvdXJjZUtleUF0dHJpYnV0ZSIsInNvdXJjZUtleUZpZWxkIiwicHJpbWFyeUtleUZpZWxkIiwidXBwZXJGaXJzdCIsImFzc29jaWF0aW9uQWNjZXNzb3IiLCJhY2Nlc3NvcnMiLCJnZXQiLCJzZXQiLCJhZGRNdWx0aXBsZSIsImFkZCIsImNyZWF0ZSIsInJlbW92ZSIsInJlbW92ZU11bHRpcGxlIiwiaGFzU2luZ2xlIiwiaGFzQWxsIiwiY291bnQiLCJuZXdBdHRyaWJ1dGVzIiwiY29uc3RyYWludE9wdGlvbnMiLCJjbG9uZSIsImRlZmF1bHRzIiwidHlwZSIsImtleVR5cGUiLCJhbGxvd051bGwiLCJjb25zdHJhaW50cyIsIm9uRGVsZXRlIiwib25VcGRhdGUiLCJhZGRGb3JlaWduS2V5Q29uc3RyYWludHMiLCJtZXJnZURlZmF1bHRzIiwicmVmcmVzaEF0dHJpYnV0ZXMiLCJjaGVja05hbWluZ0NvbGxpc2lvbiIsIm9iaiIsIm1ldGhvZHMiLCJhbGlhc2VzIiwibWl4aW5NZXRob2RzIiwiaW5zdGFuY2VzIiwid2hlcmUiLCJNb2RlbCIsImluc3RhbmNlIiwidmFsdWVzIiwiQXJyYXkiLCJpc0FycmF5IiwidW5kZWZpbmVkIiwiT2JqZWN0IiwiYXNzaWduIiwic2NvcGUiLCJtYXAiLCJyYXciLCJsaW1pdCIsImxlbmd0aCIsImdyb3VwZWRMaW1pdCIsIm9uIiwiaW4iLCJhbmQiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJ1bnNjb3BlZCIsInNjaGVtYSIsInNjaGVtYURlbGltaXRlciIsImZpbmRBbGwiLCJ0aGVuIiwicmVzdWx0cyIsInJlc3VsdCIsInB1c2giLCJjbG9uZURlZXAiLCJhdHRyaWJ1dGVzIiwiZm4iLCJjb2wiLCJwbGFpbiIsInBhcnNlSW50Iiwic291cmNlSW5zdGFuY2UiLCJ0YXJnZXRJbnN0YW5jZXMiLCJvciIsImFzc29jaWF0ZWRPYmplY3RzIiwidG9JbnN0YW5jZUFycmF5Iiwib2xkQXNzb2NpYXRpb25zIiwicHJvbWlzZXMiLCJvYnNvbGV0ZUFzc29jaWF0aW9ucyIsImZpbHRlciIsIm9sZCIsImZpbmQiLCJ1bmFzc29jaWF0ZWRPYmplY3RzIiwidXBkYXRlV2hlcmUiLCJ1cGRhdGUiLCJhc3NvY2lhdGVkT2JqZWN0IiwidW5hc3NvY2lhdGVkT2JqZWN0IiwiUHJvbWlzZSIsImFsbCIsInJldHVybiIsInJlc29sdmUiLCJ0YXJnZXRJbnN0YW5jZSIsImZpZWxkcyIsImF0dHJpYnV0ZSIsImtleXMiLCJhbGlhcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLEtBQUssR0FBR0MsT0FBTyxDQUFDLFlBQUQsQ0FBckI7O0FBQ0EsTUFBTUMsT0FBTyxHQUFHRCxPQUFPLENBQUMsV0FBRCxDQUF2Qjs7QUFDQSxNQUFNRSxDQUFDLEdBQUdGLE9B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QVosQ0FBbUI0QixNQUFuQixFQUEyQmpFLE9BQTNCLENBQVA7QUFDRDs7OzJDQUVzQnlILEssRUFBTztBQUM1QixVQUFJLE9BQU9BLEtBQVAsS0FBaUIsUUFBckIsRUFBK0I7QUFDN0IsZUFBTyxLQUFLaEgsRUFBTCxLQUFZZ0gsS0FBbkI7QUFDRDs7QUFFRCxVQUFJQSxLQUFLLElBQUlBLEtBQUssQ0FBQzVHLE1BQW5CLEVBQTJCO0FBQ3pCLGVBQU8sS0FBS0osRUFBTCxLQUFZZ0gsS0FBSyxDQUFDNUcsTUFBekI7QUFDRDs7QUFFRCxhQUFPLENBQUMsS0FBS0gsU0FBYjtBQUNEOzs7O0VBamRtQmYsVzs7QUFvZHRCK0gsTUFBTSxDQUFDQyxPQUFQLEdBQWlCOUgsT0FBakI7QUFDQTZILE1BQU0sQ0FBQ0MsT0FBUCxDQUFlOUgsT0FBZixHQUF5QkEsT0FBekI7QUFDQTZILE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxPQUFmLEdBQXlCL0gsT0FBekIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xuY29uc3QgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgQXNzb2NpYXRpb24gPSByZXF1aXJlKCcuL2Jhc2UnKTtcbmNvbnN0IE9wID0gcmVxdWlyZSgnLi4vb3BlcmF0b3JzJyk7XG5cbi8qKlxuICogT25lLXRvLW1hbnkgYXNzb2NpYXRpb25cbiAqXG4gKiBJbiB0aGUgQVBJIHJlZmVyZW5jZSBiZWxvdywgYWRkIHRoZSBuYW1lIG9mIHRoZSBhc3NvY2lhdGlvbiB0byB0aGUgbWV0aG9kLCBlLmcuIGZvciBgVXNlci5oYXNNYW55KFByb2plY3QpYCB0aGUgZ2V0dGVyIHdpbGwgYmUgYHVzZXIuZ2V0UHJvamVjdHMoKWAuXG4gKiBJZiB0aGUgYXNzb2NpYXRpb24gaXMgYWxpYXNlZCwgdXNlIHRoZSBhbGlhcyBpbnN0ZWFkLCBlLmcuIGBVc2VyLmhhc01hbnkoUHJvamVjdCwgeyBhczogJ2pvYnMnIH0pYCB3aWxsIGJlIGB1c2VyLmdldEpvYnMoKWAuXG4gKlxuICogQHNlZSB7QGxpbmsgTW9kZWwuaGFzTWFueX1cbiAqL1xuY2xhc3MgSGFzTWFueSBleHRlbmRzIEFzc29jaWF0aW9uIHtcbiAgY29uc3RydWN0b3Ioc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpIHtcbiAgICBzdXBlcihzb3VyY2UsIHRhcmdldCwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLmFzc29jaWF0aW9uVHlwZSA9ICdIYXNNYW55JztcbiAgICB0aGlzLnRhcmdldEFzc29jaWF0aW9uID0gbnVsbDtcbiAgICB0aGlzLnNlcXVlbGl6ZSA9IHNvdXJjZS5zZXF1ZWxpemU7XG4gICAgdGhpcy5pc011bHRpQXNzb2NpYXRpb24gPSB0cnVlO1xuICAgIHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZSA9IHt9O1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50aHJvdWdoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ046TSBhc3NvY2lhdGlvbnMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCBoYXNNYW55LiBVc2UgYmVsb25nc1RvTWFueSBpbnN0ZWFkJyk7XG4gICAgfVxuXG4gICAgLypcbiAgICAqIElmIHNlbGYgYXNzb2NpYXRpb24sIHRoaXMgaXMgdGhlIHRhcmdldCBhc3NvY2lhdGlvblxuICAgICovXG4gICAgaWYgKHRoaXMuaXNTZWxmQXNzb2NpYXRpb24pIHtcbiAgICAgIHRoaXMudGFyZ2V0QXNzb2NpYXRpb24gPSB0aGlzO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmFzKSB7XG4gICAgICB0aGlzLmlzQWxpYXNlZCA9IHRydWU7XG5cbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QodGhpcy5hcykpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB0aGlzLmFzO1xuICAgICAgICB0aGlzLmFzID0gdGhpcy5hcy5wbHVyYWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9wdGlvbnMubmFtZSA9IHtcbiAgICAgICAgICBwbHVyYWw6IHRoaXMuYXMsXG4gICAgICAgICAgc2luZ3VsYXI6IFV0aWxzLnNpbmd1bGFyaXplKHRoaXMuYXMpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXMgPSB0aGlzLnRhcmdldC5vcHRpb25zLm5hbWUucGx1cmFsO1xuICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB0aGlzLnRhcmdldC5vcHRpb25zLm5hbWU7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBGb3JlaWduIGtleSBzZXR1cFxuICAgICAqL1xuICAgIGlmIChfLmlzT2JqZWN0KHRoaXMub3B0aW9ucy5mb3JlaWduS2V5KSkge1xuICAgICAgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlID0gdGhpcy5vcHRpb25zLmZvcmVpZ25LZXk7XG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUubmFtZSB8fCB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUuZmllbGROYW1lO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmZvcmVpZ25LZXkpIHtcbiAgICAgIHRoaXMuZm9yZWlnbktleSA9IHRoaXMub3B0aW9ucy5mb3JlaWduS2V5O1xuICAgIH1cblxuICAgIGlmICghdGhpcy5mb3JlaWduS2V5KSB7XG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSBVdGlscy5jYW1lbGl6ZShcbiAgICAgICAgW1xuICAgICAgICAgIHRoaXMuc291cmNlLm9wdGlvbnMubmFtZS5zaW5ndWxhcixcbiAgICAgICAgICB0aGlzLnNvdXJjZS5wcmltYXJ5S2V5QXR0cmlidXRlXG4gICAgICAgIF0uam9pbignXycpXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnRhcmdldC5yYXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0pIHtcbiAgICAgIHRoaXMuaWRlbnRpZmllckZpZWxkID0gdGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldLmZpZWxkIHx8IHRoaXMuZm9yZWlnbktleTtcbiAgICAgIHRoaXMuZm9yZWlnbktleUZpZWxkID0gdGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldLmZpZWxkIHx8IHRoaXMuZm9yZWlnbktleTtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIFNvdXJjZSBrZXkgc2V0dXBcbiAgICAgKi9cbiAgICB0aGlzLnNvdXJjZUtleSA9IHRoaXMub3B0aW9ucy5zb3VyY2VLZXkgfHwgdGhpcy5zb3VyY2UucHJpbWFyeUtleUF0dHJpYnV0ZTtcblxuICAgIGlmICh0aGlzLnNvdXJjZS5yYXdBdHRyaWJ1dGVzW3RoaXMuc291cmNlS2V5XSkge1xuICAgICAgdGhpcy5zb3VyY2VLZXlBdHRyaWJ1dGUgPSB0aGlzLnNvdXJjZUtleTtcbiAgICAgIHRoaXMuc291cmNlS2V5RmllbGQgPSB0aGlzLnNvdXJjZS5yYXdBdHRyaWJ1dGVzW3RoaXMuc291cmNlS2V5XS5maWVsZCB8fCB0aGlzLnNvdXJjZUtleTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zb3VyY2VLZXlBdHRyaWJ1dGUgPSB0aGlzLnNvdXJjZS5wcmltYXJ5S2V5QXR0cmlidXRlO1xuICAgICAgdGhpcy5zb3VyY2VLZXlGaWVsZCA9IHRoaXMuc291cmNlLnByaW1hcnlLZXlGaWVsZDtcbiAgICB9XG5cbiAgICAvLyBHZXQgc2luZ3VsYXIgYW5kIHBsdXJhbCBuYW1lc1xuICAgIC8vIHRyeSB0byB1cHBlcmNhc2UgdGhlIGZpcnN0IGxldHRlciwgdW5sZXNzIHRoZSBtb2RlbCBmb3JiaWRzIGl0XG4gICAgY29uc3QgcGx1cmFsID0gXy51cHBlckZpcnN0KHRoaXMub3B0aW9ucy5uYW1lLnBsdXJhbCk7XG4gICAgY29uc3Qgc2luZ3VsYXIgPSBfLnVwcGVyRmlyc3QodGhpcy5vcHRpb25zLm5hbWUuc2luZ3VsYXIpO1xuXG4gICAgdGhpcy5hc3NvY2lhdGlvbkFjY2Vzc29yID0gdGhpcy5hcztcbiAgICB0aGlzLmFjY2Vzc29ycyA9IHtcbiAgICAgIGdldDogYGdldCR7cGx1cmFsfWAsXG4gICAgICBzZXQ6IGBzZXQke3BsdXJhbH1gLFxuICAgICAgYWRkTXVsdGlwbGU6IGBhZGQke3BsdXJhbH1gLFxuICAgICAgYWRkOiBgYWRkJHtzaW5ndWxhcn1gLFxuICAgICAgY3JlYXRlOiBgY3JlYXRlJHtzaW5ndWxhcn1gLFxuICAgICAgcmVtb3ZlOiBgcmVtb3ZlJHtzaW5ndWxhcn1gLFxuICAgICAgcmVtb3ZlTXVsdGlwbGU6IGByZW1vdmUke3BsdXJhbH1gLFxuICAgICAgaGFzU2luZ2xlOiBgaGFzJHtzaW5ndWxhcn1gLFxuICAgICAgaGFzQWxsOiBgaGFzJHtwbHVyYWx9YCxcbiAgICAgIGNvdW50OiBgY291bnQke3BsdXJhbH1gXG4gICAgfTtcbiAgfVxuXG4gIC8vIHRoZSBpZCBpcyBpbiB0aGUgdGFyZ2V0IHRhYmxlXG4gIC8vIG9yIGluIGFuIGV4dHJhIHRhYmxlIHdoaWNoIGNvbm5lY3RzIHR3byB0YWJsZXNcbiAgX2luamVjdEF0dHJpYnV0ZXMoKSB7XG4gICAgY29uc3QgbmV3QXR0cmlidXRlcyA9IHt9O1xuICAgIC8vIENyZWF0ZSBhIG5ldyBvcHRpb25zIG9iamVjdCBmb3IgdXNlIHdpdGggYWRkRm9yZWlnbktleUNvbnN0cmFpbnRzLCB0byBhdm9pZCBwb2xsdXRpbmcgdGhpcy5vcHRpb25zIGluIGNhc2UgaXQgaXMgbGF0ZXIgdXNlZCBmb3IgYSBuOm1cbiAgICBjb25zdCBjb25zdHJhaW50T3B0aW9ucyA9IF8uY2xvbmUodGhpcy5vcHRpb25zKTtcblxuICAgIG5ld0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XSA9IF8uZGVmYXVsdHMoe30sIHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZSwge1xuICAgICAgdHlwZTogdGhpcy5vcHRpb25zLmtleVR5cGUgfHwgdGhpcy5zb3VyY2UucmF3QXR0cmlidXRlc1t0aGlzLnNvdXJjZUtleUF0dHJpYnV0ZV0udHlwZSxcbiAgICAgIGFsbG93TnVsbDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb25zdHJhaW50cyAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XSB8fCBuZXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV07XG4gICAgICBjb25zdHJhaW50T3B0aW9ucy5vbkRlbGV0ZSA9IGNvbnN0cmFpbnRPcHRpb25zLm9uRGVsZXRlIHx8ICh0YXJnZXQuYWxsb3dOdWxsID8gJ1NFVCBOVUxMJyA6ICdDQVNDQURFJyk7XG4gICAgICBjb25zdHJhaW50T3B0aW9ucy5vblVwZGF0ZSA9IGNvbnN0cmFpbnRPcHRpb25zLm9uVXBkYXRlIHx8ICdDQVNDQURFJztcbiAgICB9XG5cbiAgICBIZWxwZXJzLmFkZEZvcmVpZ25LZXlDb25zdHJhaW50cyhuZXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0sIHRoaXMuc291cmNlLCB0aGlzLnRhcmdldCwgY29uc3RyYWludE9wdGlvbnMsIHRoaXMuc291cmNlS2V5RmllbGQpO1xuICAgIFV0aWxzLm1lcmdlRGVmYXVsdHModGhpcy50YXJnZXQucmF3QXR0cmlidXRlcywgbmV3QXR0cmlidXRlcyk7XG5cbiAgICB0aGlzLnRhcmdldC5yZWZyZXNoQXR0cmlidXRlcygpO1xuICAgIHRoaXMuc291cmNlLnJlZnJlc2hBdHRyaWJ1dGVzKCk7XG5cbiAgICB0aGlzLmlkZW50aWZpZXJGaWVsZCA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5maWVsZCB8fCB0aGlzLmZvcmVpZ25LZXk7XG4gICAgdGhpcy5mb3JlaWduS2V5RmllbGQgPSB0aGlzLnRhcmdldC5yYXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0uZmllbGQgfHwgdGhpcy5mb3JlaWduS2V5O1xuICAgIHRoaXMuc291cmNlS2V5RmllbGQgPSB0aGlzLnNvdXJjZS5yYXdBdHRyaWJ1dGVzW3RoaXMuc291cmNlS2V5XS5maWVsZCB8fCB0aGlzLnNvdXJjZUtleTtcblxuICAgIEhlbHBlcnMuY2hlY2tOYW1pbmdDb2xsaXNpb24odGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG1peGluKG9iaikge1xuICAgIGNvbnN0IG1ldGhvZHMgPSBbJ2dldCcsICdjb3VudCcsICdoYXNTaW5nbGUnLCAnaGFzQWxsJywgJ3NldCcsICdhZGQnLCAnYWRkTXVsdGlwbGUnLCAncmVtb3ZlJywgJ3JlbW92ZU11bHRpcGxlJywgJ2NyZWF0ZSddO1xuICAgIGNvbnN0IGFsaWFzZXMgPSB7XG4gICAgICBoYXNTaW5nbGU6ICdoYXMnLFxuICAgICAgaGFzQWxsOiAnaGFzJyxcbiAgICAgIGFkZE11bHRpcGxlOiAnYWRkJyxcbiAgICAgIHJlbW92ZU11bHRpcGxlOiAncmVtb3ZlJ1xuICAgIH07XG5cbiAgICBIZWxwZXJzLm1peGluTWV0aG9kcyh0aGlzLCBvYmosIG1ldGhvZHMsIGFsaWFzZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBldmVyeXRoaW5nIGN1cnJlbnRseSBhc3NvY2lhdGVkIHdpdGggdGhpcywgdXNpbmcgYW4gb3B0aW9uYWwgd2hlcmUgY2xhdXNlLlxuICAgKlxuICAgKiBAcGFyYW0ge01vZGVsfEFycmF5PE1vZGVsPn0gaW5zdGFuY2VzIHNvdXJjZSBpbnN0YW5jZXNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBmaW5kIG9wdGlvbnNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLndoZXJlXSBBbiBvcHRpb25hbCB3aGVyZSBjbGF1c2UgdG8gbGltaXQgdGhlIGFzc29jaWF0ZWQgbW9kZWxzXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLnNjb3BlXSBBcHBseSBhIHNjb3BlIG9uIHRoZSByZWxhdGVkIG1vZGVsLCBvciByZW1vdmUgaXRzIGRlZmF1bHQgc2NvcGUgYnkgcGFzc2luZyBmYWxzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2NoZW1hXSBBcHBseSBhIHNjaGVtYSBvbiB0aGUgcmVsYXRlZCBtb2RlbFxuICAgKlxuICAgKiBAc2VlXG4gICAqIHtAbGluayBNb2RlbC5maW5kQWxsfSAgZm9yIGEgZnVsbCBleHBsYW5hdGlvbiBvZiBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5PE1vZGVsPj59XG4gICAqL1xuICBnZXQoaW5zdGFuY2VzLCBvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCB3aGVyZSA9IHt9O1xuXG4gICAgbGV0IE1vZGVsID0gdGhpcy50YXJnZXQ7XG4gICAgbGV0IGluc3RhbmNlO1xuICAgIGxldCB2YWx1ZXM7XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoaW5zdGFuY2VzKSkge1xuICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZXM7XG4gICAgICBpbnN0YW5jZXMgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuXG4gICAgaWYgKHRoaXMuc2NvcGUpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24od2hlcmUsIHRoaXMuc2NvcGUpO1xuICAgIH1cblxuICAgIGlmIChpbnN0YW5jZXMpIHtcbiAgICAgIHZhbHVlcyA9IGluc3RhbmNlcy5tYXAoaW5zdGFuY2UgPT4gaW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5LCB7IHJhdzogdHJ1ZSB9KSk7XG5cbiAgICAgIGlmIChvcHRpb25zLmxpbWl0ICYmIGluc3RhbmNlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIG9wdGlvbnMuZ3JvdXBlZExpbWl0ID0ge1xuICAgICAgICAgIGxpbWl0OiBvcHRpb25zLmxpbWl0LFxuICAgICAgICAgIG9uOiB0aGlzLCAvLyBhc3NvY2lhdGlvblxuICAgICAgICAgIHZhbHVlc1xuICAgICAgICB9O1xuXG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLmxpbWl0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2hlcmVbdGhpcy5mb3JlaWduS2V5XSA9IHtcbiAgICAgICAgICBbT3AuaW5dOiB2YWx1ZXNcbiAgICAgICAgfTtcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMuZ3JvdXBlZExpbWl0O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB3aGVyZVt0aGlzLmZvcmVpZ25LZXldID0gaW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5LCB7IHJhdzogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICBvcHRpb25zLndoZXJlID0gb3B0aW9ucy53aGVyZSA/XG4gICAgICB7IFtPcC5hbmRdOiBbd2hlcmUsIG9wdGlvbnMud2hlcmVdIH0gOlxuICAgICAgd2hlcmU7XG5cbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsICdzY29wZScpKSB7XG4gICAgICBpZiAoIW9wdGlvbnMuc2NvcGUpIHtcbiAgICAgICAgTW9kZWwgPSBNb2RlbC51bnNjb3BlZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgTW9kZWwgPSBNb2RlbC5zY29wZShvcHRpb25zLnNjb3BlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsICdzY2hlbWEnKSkge1xuICAgICAgTW9kZWwgPSBNb2RlbC5zY2hlbWEob3B0aW9ucy5zY2hlbWEsIG9wdGlvbnMuc2NoZW1hRGVsaW1pdGVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gTW9kZWwuZmluZEFsbChvcHRpb25zKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgaWYgKGluc3RhbmNlKSByZXR1cm4gcmVzdWx0cztcblxuICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICBmb3IgKGNvbnN0IGluc3RhbmNlIG9mIGluc3RhbmNlcykge1xuICAgICAgICByZXN1bHRbaW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5LCB7IHJhdzogdHJ1ZSB9KV0gPSBbXTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBpbnN0YW5jZSBvZiByZXN1bHRzKSB7XG4gICAgICAgIHJlc3VsdFtpbnN0YW5jZS5nZXQodGhpcy5mb3JlaWduS2V5LCB7IHJhdzogdHJ1ZSB9KV0ucHVzaChpbnN0YW5jZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ291bnQgZXZlcnl0aGluZyBjdXJyZW50bHkgYXNzb2NpYXRlZCB3aXRoIHRoaXMsIHVzaW5nIGFuIG9wdGlvbmFsIHdoZXJlIGNsYXVzZS5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gICAgICAgIGluc3RhbmNlIHRoZSBzb3VyY2UgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgW29wdGlvbnNdIGZpbmQgJiBjb3VudCBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgIFtvcHRpb25zLndoZXJlXSBBbiBvcHRpb25hbCB3aGVyZSBjbGF1c2UgdG8gbGltaXQgdGhlIGFzc29jaWF0ZWQgbW9kZWxzXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLnNjb3BlXSBBcHBseSBhIHNjb3BlIG9uIHRoZSByZWxhdGVkIG1vZGVsLCBvciByZW1vdmUgaXRzIGRlZmF1bHQgc2NvcGUgYnkgcGFzc2luZyBmYWxzZVxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxudW1iZXI+fVxuICAgKi9cbiAgY291bnQoaW5zdGFuY2UsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xuXG4gICAgb3B0aW9ucy5hdHRyaWJ1dGVzID0gW1xuICAgICAgW1xuICAgICAgICB0aGlzLnNlcXVlbGl6ZS5mbihcbiAgICAgICAgICAnQ09VTlQnLFxuICAgICAgICAgIHRoaXMuc2VxdWVsaXplLmNvbChgJHt0aGlzLnRhcmdldC5uYW1lfS4ke3RoaXMudGFyZ2V0LnByaW1hcnlLZXlGaWVsZH1gKVxuICAgICAgICApLFxuICAgICAgICAnY291bnQnXG4gICAgICBdXG4gICAgXTtcbiAgICBvcHRpb25zLnJhdyA9IHRydWU7XG4gICAgb3B0aW9ucy5wbGFpbiA9IHRydWU7XG5cbiAgICByZXR1cm4gdGhpcy5nZXQoaW5zdGFuY2UsIG9wdGlvbnMpLnRoZW4ocmVzdWx0ID0+IHBhcnNlSW50KHJlc3VsdC5jb3VudCwgMTApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBvbmUgb3IgbW9yZSByb3dzIGFyZSBhc3NvY2lhdGVkIHdpdGggYHRoaXNgLlxuICAgKlxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSB0aGUgc291cmNlIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TW9kZWx8TW9kZWxbXXxzdHJpbmdbXXxzdHJpbmd8bnVtYmVyW118bnVtYmVyfSBbdGFyZ2V0SW5zdGFuY2VzXSBDYW4gYmUgYW4gYXJyYXkgb2YgaW5zdGFuY2VzIG9yIHRoZWlyIHByaW1hcnkga2V5c1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGdldEFzc29jaWF0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGhhcyhzb3VyY2VJbnN0YW5jZSwgdGFyZ2V0SW5zdGFuY2VzLCBvcHRpb25zKSB7XG4gICAgY29uc3Qgd2hlcmUgPSB7fTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh0YXJnZXRJbnN0YW5jZXMpKSB7XG4gICAgICB0YXJnZXRJbnN0YW5jZXMgPSBbdGFyZ2V0SW5zdGFuY2VzXTtcbiAgICB9XG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgc2NvcGU6IGZhbHNlLFxuICAgICAgYXR0cmlidXRlczogW3RoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGVdLFxuICAgICAgcmF3OiB0cnVlXG4gICAgfSk7XG5cbiAgICB3aGVyZVtPcC5vcl0gPSB0YXJnZXRJbnN0YW5jZXMubWFwKGluc3RhbmNlID0+IHtcbiAgICAgIGlmIChpbnN0YW5jZSBpbnN0YW5jZW9mIHRoaXMudGFyZ2V0KSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZS53aGVyZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgW3RoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGVdOiBpbnN0YW5jZVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIG9wdGlvbnMud2hlcmUgPSB7XG4gICAgICBbT3AuYW5kXTogW1xuICAgICAgICB3aGVyZSxcbiAgICAgICAgb3B0aW9ucy53aGVyZVxuICAgICAgXVxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5nZXQoc291cmNlSW5zdGFuY2UsIG9wdGlvbnMpLnRoZW4oYXNzb2NpYXRlZE9iamVjdHMgPT4gYXNzb2NpYXRlZE9iamVjdHMubGVuZ3RoID09PSB0YXJnZXRJbnN0YW5jZXMubGVuZ3RoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGFzc29jaWF0ZWQgbW9kZWxzIGJ5IHBhc3NpbmcgYW4gYXJyYXkgb2YgcGVyc2lzdGVkIGluc3RhbmNlcyBvciB0aGVpciBwcmltYXJ5IGtleXMuIEV2ZXJ5dGhpbmcgdGhhdCBpcyBub3QgaW4gdGhlIHBhc3NlZCBhcnJheSB3aWxsIGJlIHVuLWFzc29jaWF0ZWRcbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2Ugc291cmNlIGluc3RhbmNlIHRvIGFzc29jaWF0ZSBuZXcgaW5zdGFuY2VzIHdpdGhcbiAgICogQHBhcmFtIHtNb2RlbHxNb2RlbFtdfHN0cmluZ1tdfHN0cmluZ3xudW1iZXJbXXxudW1iZXJ9IFt0YXJnZXRJbnN0YW5jZXNdIEFuIGFycmF5IG9mIHBlcnNpc3RlZCBpbnN0YW5jZXMgb3IgcHJpbWFyeSBrZXkgb2YgaW5zdGFuY2VzIHRvIGFzc29jaWF0ZSB3aXRoIHRoaXMuIFBhc3MgYG51bGxgIG9yIGB1bmRlZmluZWRgIHRvIHJlbW92ZSBhbGwgYXNzb2NpYXRpb25zLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGB0YXJnZXQuZmluZEFsbGAgYW5kIGB1cGRhdGVgLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMudmFsaWRhdGVdIFJ1biB2YWxpZGF0aW9uIGZvciB0aGUgam9pbiBtb2RlbFxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHNldChzb3VyY2VJbnN0YW5jZSwgdGFyZ2V0SW5zdGFuY2VzLCBvcHRpb25zKSB7XG4gICAgaWYgKHRhcmdldEluc3RhbmNlcyA9PT0gbnVsbCkge1xuICAgICAgdGFyZ2V0SW5zdGFuY2VzID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhcmdldEluc3RhbmNlcyA9IHRoaXMudG9JbnN0YW5jZUFycmF5KHRhcmdldEluc3RhbmNlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0KHNvdXJjZUluc3RhbmNlLCBfLmRlZmF1bHRzKHsgc2NvcGU6IGZhbHNlLCByYXc6IHRydWUgfSwgb3B0aW9ucykpLnRoZW4ob2xkQXNzb2NpYXRpb25zID0+IHtcbiAgICAgIGNvbnN0IHByb21pc2VzID0gW107XG4gICAgICBjb25zdCBvYnNvbGV0ZUFzc29jaWF0aW9ucyA9IG9sZEFzc29jaWF0aW9ucy5maWx0ZXIob2xkID0+XG4gICAgICAgICF0YXJnZXRJbnN0YW5jZXMuZmluZChvYmogPT5cbiAgICAgICAgICBvYmpbdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZV0gPT09IG9sZFt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXVxuICAgICAgICApXG4gICAgICApO1xuICAgICAgY29uc3QgdW5hc3NvY2lhdGVkT2JqZWN0cyA9IHRhcmdldEluc3RhbmNlcy5maWx0ZXIob2JqID0+XG4gICAgICAgICFvbGRBc3NvY2lhdGlvbnMuZmluZChvbGQgPT5cbiAgICAgICAgICBvYmpbdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZV0gPT09IG9sZFt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXVxuICAgICAgICApXG4gICAgICApO1xuICAgICAgbGV0IHVwZGF0ZVdoZXJlO1xuICAgICAgbGV0IHVwZGF0ZTtcblxuICAgICAgaWYgKG9ic29sZXRlQXNzb2NpYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdXBkYXRlID0ge307XG4gICAgICAgIHVwZGF0ZVt0aGlzLmZvcmVpZ25LZXldID0gbnVsbDtcblxuICAgICAgICB1cGRhdGVXaGVyZSA9IHtcbiAgICAgICAgICBbdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZV06IG9ic29sZXRlQXNzb2NpYXRpb25zLm1hcChhc3NvY2lhdGVkT2JqZWN0ID0+XG4gICAgICAgICAgICBhc3NvY2lhdGVkT2JqZWN0W3RoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGVdXG4gICAgICAgICAgKVxuICAgICAgICB9O1xuXG5cbiAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLnRhcmdldC51bnNjb3BlZCgpLnVwZGF0ZShcbiAgICAgICAgICB1cGRhdGUsXG4gICAgICAgICAgXy5kZWZhdWx0cyh7XG4gICAgICAgICAgICB3aGVyZTogdXBkYXRlV2hlcmVcbiAgICAgICAgICB9LCBvcHRpb25zKVxuICAgICAgICApKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHVuYXNzb2NpYXRlZE9iamVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICB1cGRhdGVXaGVyZSA9IHt9O1xuXG4gICAgICAgIHVwZGF0ZSA9IHt9O1xuICAgICAgICB1cGRhdGVbdGhpcy5mb3JlaWduS2V5XSA9IHNvdXJjZUluc3RhbmNlLmdldCh0aGlzLnNvdXJjZUtleSk7XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbih1cGRhdGUsIHRoaXMuc2NvcGUpO1xuICAgICAgICB1cGRhdGVXaGVyZVt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXSA9IHVuYXNzb2NpYXRlZE9iamVjdHMubWFwKHVuYXNzb2NpYXRlZE9iamVjdCA9PlxuICAgICAgICAgIHVuYXNzb2NpYXRlZE9iamVjdFt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXVxuICAgICAgICApO1xuXG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy50YXJnZXQudW5zY29wZWQoKS51cGRhdGUoXG4gICAgICAgICAgdXBkYXRlLFxuICAgICAgICAgIF8uZGVmYXVsdHMoe1xuICAgICAgICAgICAgd2hlcmU6IHVwZGF0ZVdoZXJlXG4gICAgICAgICAgfSwgb3B0aW9ucylcbiAgICAgICAgKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBVdGlscy5Qcm9taXNlLmFsbChwcm9taXNlcykucmV0dXJuKHNvdXJjZUluc3RhbmNlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NvY2lhdGUgb25lIG9yIG1vcmUgdGFyZ2V0IHJvd3Mgd2l0aCBgdGhpc2AuIFRoaXMgbWV0aG9kIGFjY2VwdHMgYSBNb2RlbCAvIHN0cmluZyAvIG51bWJlciB0byBhc3NvY2lhdGUgYSBzaW5nbGUgcm93LFxuICAgKiBvciBhIG1peGVkIGFycmF5IG9mIE1vZGVsIC8gc3RyaW5nIC8gbnVtYmVycyB0byBhc3NvY2lhdGUgbXVsdGlwbGUgcm93cy5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2UgdGhlIHNvdXJjZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge01vZGVsfE1vZGVsW118c3RyaW5nW118c3RyaW5nfG51bWJlcltdfG51bWJlcn0gW3RhcmdldEluc3RhbmNlc10gQSBzaW5nbGUgaW5zdGFuY2Ugb3IgcHJpbWFyeSBrZXksIG9yIGEgbWl4ZWQgYXJyYXkgb2YgcGVyc2lzdGVkIGluc3RhbmNlcyBvciBwcmltYXJ5IGtleXNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGFyZ2V0LnVwZGF0ZWAuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgYWRkKHNvdXJjZUluc3RhbmNlLCB0YXJnZXRJbnN0YW5jZXMsIG9wdGlvbnMgPSB7fSkge1xuICAgIGlmICghdGFyZ2V0SW5zdGFuY2VzKSByZXR1cm4gVXRpbHMuUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICBjb25zdCB1cGRhdGUgPSB7fTtcblxuICAgIHRhcmdldEluc3RhbmNlcyA9IHRoaXMudG9JbnN0YW5jZUFycmF5KHRhcmdldEluc3RhbmNlcyk7XG5cbiAgICB1cGRhdGVbdGhpcy5mb3JlaWduS2V5XSA9IHNvdXJjZUluc3RhbmNlLmdldCh0aGlzLnNvdXJjZUtleSk7XG4gICAgT2JqZWN0LmFzc2lnbih1cGRhdGUsIHRoaXMuc2NvcGUpO1xuXG4gICAgY29uc3Qgd2hlcmUgPSB7XG4gICAgICBbdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZV06IHRhcmdldEluc3RhbmNlcy5tYXAodW5hc3NvY2lhdGVkT2JqZWN0ID0+XG4gICAgICAgIHVuYXNzb2NpYXRlZE9iamVjdC5nZXQodGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZSlcbiAgICAgIClcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudGFyZ2V0LnVuc2NvcGVkKCkudXBkYXRlKHVwZGF0ZSwgXy5kZWZhdWx0cyh7IHdoZXJlIH0sIG9wdGlvbnMpKS5yZXR1cm4oc291cmNlSW5zdGFuY2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuLWFzc29jaWF0ZSBvbmUgb3Igc2V2ZXJhbCB0YXJnZXQgcm93cy5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2UgaW5zdGFuY2UgdG8gdW4gYXNzb2NpYXRlIGluc3RhbmNlcyB3aXRoXG4gICAqIEBwYXJhbSB7TW9kZWx8TW9kZWxbXXxzdHJpbmd8c3RyaW5nW118bnVtYmVyfG51bWJlcltdfSBbdGFyZ2V0SW5zdGFuY2VzXSBDYW4gYmUgYW4gSW5zdGFuY2Ugb3IgaXRzIHByaW1hcnkga2V5LCBvciBhIG1peGVkIGFycmF5IG9mIGluc3RhbmNlcyBhbmQgcHJpbWFyeSBrZXlzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9ucyBwYXNzZWQgdG8gYHRhcmdldC51cGRhdGVgXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgcmVtb3ZlKHNvdXJjZUluc3RhbmNlLCB0YXJnZXRJbnN0YW5jZXMsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHtcbiAgICAgIFt0aGlzLmZvcmVpZ25LZXldOiBudWxsXG4gICAgfTtcblxuICAgIHRhcmdldEluc3RhbmNlcyA9IHRoaXMudG9JbnN0YW5jZUFycmF5KHRhcmdldEluc3RhbmNlcyk7XG5cbiAgICBjb25zdCB3aGVyZSA9IHtcbiAgICAgIFt0aGlzLmZvcmVpZ25LZXldOiBzb3VyY2VJbnN0YW5jZS5nZXQodGhpcy5zb3VyY2VLZXkpLFxuICAgICAgW3RoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGVdOiB0YXJnZXRJbnN0YW5jZXMubWFwKHRhcmdldEluc3RhbmNlID0+XG4gICAgICAgIHRhcmdldEluc3RhbmNlLmdldCh0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlKVxuICAgICAgKVxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50YXJnZXQudW5zY29wZWQoKS51cGRhdGUodXBkYXRlLCBfLmRlZmF1bHRzKHsgd2hlcmUgfSwgb3B0aW9ucykpLnJldHVybih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGFzc29jaWF0ZWQgbW9kZWwgYW5kIGFzc29jaWF0ZSBpdCB3aXRoIHRoaXMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9kZWx9IHNvdXJjZUluc3RhbmNlIHNvdXJjZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW3ZhbHVlc10gdmFsdWVzIGZvciB0YXJnZXQgbW9kZWwgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGFyZ2V0LmNyZWF0ZWBcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBjcmVhdGUoc291cmNlSW5zdGFuY2UsIHZhbHVlcywgb3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgIGZpZWxkczogb3B0aW9uc1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodmFsdWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNjb3BlKSB7XG4gICAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBPYmplY3Qua2V5cyh0aGlzLnNjb3BlKSkge1xuICAgICAgICB2YWx1ZXNbYXR0cmlidXRlXSA9IHRoaXMuc2NvcGVbYXR0cmlidXRlXTtcbiAgICAgICAgaWYgKG9wdGlvbnMuZmllbGRzKSBvcHRpb25zLmZpZWxkcy5wdXNoKGF0dHJpYnV0ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFsdWVzW3RoaXMuZm9yZWlnbktleV0gPSBzb3VyY2VJbnN0YW5jZS5nZXQodGhpcy5zb3VyY2VLZXkpO1xuICAgIGlmIChvcHRpb25zLmZpZWxkcykgb3B0aW9ucy5maWVsZHMucHVzaCh0aGlzLmZvcmVpZ25LZXkpO1xuICAgIHJldHVybiB0aGlzLnRhcmdldC5jcmVhdGUodmFsdWVzLCBvcHRpb25zKTtcbiAgfVxuXG4gIHZlcmlmeUFzc29jaWF0aW9uQWxpYXMoYWxpYXMpIHtcbiAgICBpZiAodHlwZW9mIGFsaWFzID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHRoaXMuYXMgPT09IGFsaWFzO1xuICAgIH1cblxuICAgIGlmIChhbGlhcyAmJiBhbGlhcy5wbHVyYWwpIHtcbiAgICAgIHJldHVybiB0aGlzLmFzID09PSBhbGlhcy5wbHVyYWw7XG4gICAgfVxuXG4gICAgcmV0dXJuICF0aGlzLmlzQWxpYXNlZDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhhc01hbnk7XG5tb2R1bGUuZXhwb3J0cy5IYXNNYW55ID0gSGFzTWFueTtcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBIYXNNYW55O1xuIl19