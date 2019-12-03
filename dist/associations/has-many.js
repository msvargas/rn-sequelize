'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

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


let HasMany =
/*#__PURE__*/
function (_Association) {
  _inherits(HasMany, _Association);

  function HasMany(source, target, options) {
    var _this;

    _classCallCheck(this, HasMany);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(HasMany).call(this, source, target, options));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvaGFzLW1hbnkuanMiXSwibmFtZXMiOlsiVXRpbHMiLCJyZXF1aXJlIiwiSGVscGVycyIsIl8iLCJBc3NvY2lhdGlvbiIsIk9wIiwiSGFzTWFueSIsInNvdXJjZSIsInRhcmdldCIsIm9wdGlvbnMiLCJhc3NvY2lhdGlvblR5cGUiLCJ0YXJnZXRBc3NvY2lhdGlvbiIsInNlcXVlbGl6ZSIsImlzTXVsdGlBc3NvY2lhdGlvbiIsImZvcmVpZ25LZXlBdHRyaWJ1dGUiLCJ0aHJvdWdoIiwiRXJyb3IiLCJpc1NlbGZBc3NvY2lhdGlvbiIsImFzIiwiaXNBbGlhc2VkIiwiaXNQbGFpbk9iamVjdCIsIm5hbWUiLCJwbHVyYWwiLCJzaW5ndWxhciIsInNpbmd1bGFyaXplIiwiaXNPYmplY3QiLCJmb3JlaWduS2V5IiwiZmllbGROYW1lIiwiY2FtZWxpemUiLCJwcmltYXJ5S2V5QXR0cmlidXRlIiwiam9pbiIsInJhd0F0dHJpYnV0ZXMiLCJpZGVudGlmaWVyRmllbGQiLCJmaWVsZCIsImZvcmVpZ25LZXlGaWVsZCIsInNvdXJjZUtleSIsInNvdXJjZUtleUF0dHJpYnV0ZSIsInNvdXJjZUtleUZpZWxkIiwicHJpbWFyeUtleUZpZWxkIiwidXBwZXJGaXJzdCIsImFzc29jaWF0aW9uQWNjZXNzb3IiLCJhY2Nlc3NvcnMiLCJnZXQiLCJzZXQiLCJhZGRNdWx0aXBsZSIsImFkZCIsImNyZWF0ZSIsInJlbW92ZSIsInJlbW92ZU11bHRpcGxlIiwiaGFzU2luZ2xlIiwiaGFzQWxsIiwiY291bnQiLCJuZXdBdHRyaWJ1dGVzIiwiY29uc3RyYWludE9wdGlvbnMiLCJjbG9uZSIsImRlZmF1bHRzIiwidHlwZSIsImtleVR5cGUiLCJhbGxvd051bGwiLCJjb25zdHJhaW50cyIsIm9uRGVsZXRlIiwib25VcGRhdGUiLCJhZGRGb3JlaWduS2V5Q29uc3RyYWludHMiLCJtZXJnZURlZmF1bHRzIiwicmVmcmVzaEF0dHJpYnV0ZXMiLCJjaGVja05hbWluZ0NvbGxpc2lvbiIsIm9iaiIsIm1ldGhvZHMiLCJhbGlhc2VzIiwibWl4aW5NZXRob2RzIiwiaW5zdGFuY2VzIiwid2hlcmUiLCJNb2RlbCIsImluc3RhbmNlIiwidmFsdWVzIiwiQXJyYXkiLCJpc0FycmF5IiwidW5kZWZpbmVkIiwiT2JqZWN0IiwiYXNzaWduIiwic2NvcGUiLCJtYXAiLCJyYXciLCJsaW1pdCIsImxlbmd0aCIsImdyb3VwZWRMaW1pdCIsIm9uIiwiaW4iLCJhbmQiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJ1bnNjb3BlZCIsInNjaGVtYSIsInNjaGVtYURlbGltaXRlciIsImZpbmRBbGwiLCJ0aGVuIiwicmVzdWx0cyIsInJlc3VsdCIsInB1c2giLCJjbG9uZURlZXAiLCJhdHRyaWJ1dGVzIiwiZm4iLCJjb2wiLCJwbGFpbiIsInBhcnNlSW50Iiwic291cmNlSW5zdGFuY2UiLCJ0YXJnZXRJbnN0YW5jZXMiLCJvciIsImFzc29jaWF0ZWRPYmplY3RzIiwidG9JbnN0YW5jZUFycmF5Iiwib2xkQXNzb2NpYXRpb25zIiwicHJvbWlzZXMiLCJvYnNvbGV0ZUFzc29jaWF0aW9ucyIsImZpbHRlciIsIm9sZCIsImZpbmQiLCJ1bmFzc29jaWF0ZWRPYmplY3RzIiwidXBkYXRlV2hlcmUiLCJ1cGRhdGUiLCJhc3NvY2lhdGVkT2JqZWN0IiwidW5hc3NvY2lhdGVkT2JqZWN0IiwiUHJvbWlzZSIsImFsbCIsInJldHVybiIsInJlc29sdmUiLCJ0YXJnZXRJbnN0YW5jZSIsImZpZWxkcyIsImF0dHJpYnV0ZSIsImtleXMiLCJhbGlhcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsS0FBSyxHQUFHQyxPQUFPLENBQUMsWUFBRCxDQUFyQjs7QUFDQSxNQUFNQyxPQUFPLEdBQUdELE9BQU8sQ0FBQyxXQUFELENBQXZCOztBQUNBLE1BQU1FLENBQUMsR0FBR0YsT0FBTyxD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QWlCOUgsT0FBakI7QUFDQTZILE1BQU0sQ0FBQ0MsT0FBUCxDQUFlOUgsT0FBZixHQUF5QkEsT0FBekI7QUFDQTZILE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxPQUFmLEdBQXlCL0gsT0FBekIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4vLi4vdXRpbHMnKTtcclxuY29uc3QgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xyXG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XHJcbmNvbnN0IEFzc29jaWF0aW9uID0gcmVxdWlyZSgnLi9iYXNlJyk7XHJcbmNvbnN0IE9wID0gcmVxdWlyZSgnLi4vb3BlcmF0b3JzJyk7XHJcblxyXG4vKipcclxuICogT25lLXRvLW1hbnkgYXNzb2NpYXRpb25cclxuICpcclxuICogSW4gdGhlIEFQSSByZWZlcmVuY2UgYmVsb3csIGFkZCB0aGUgbmFtZSBvZiB0aGUgYXNzb2NpYXRpb24gdG8gdGhlIG1ldGhvZCwgZS5nLiBmb3IgYFVzZXIuaGFzTWFueShQcm9qZWN0KWAgdGhlIGdldHRlciB3aWxsIGJlIGB1c2VyLmdldFByb2plY3RzKClgLlxyXG4gKiBJZiB0aGUgYXNzb2NpYXRpb24gaXMgYWxpYXNlZCwgdXNlIHRoZSBhbGlhcyBpbnN0ZWFkLCBlLmcuIGBVc2VyLmhhc01hbnkoUHJvamVjdCwgeyBhczogJ2pvYnMnIH0pYCB3aWxsIGJlIGB1c2VyLmdldEpvYnMoKWAuXHJcbiAqXHJcbiAqIEBzZWUge0BsaW5rIE1vZGVsLmhhc01hbnl9XHJcbiAqL1xyXG5jbGFzcyBIYXNNYW55IGV4dGVuZHMgQXNzb2NpYXRpb24ge1xyXG4gIGNvbnN0cnVjdG9yKHNvdXJjZSwgdGFyZ2V0LCBvcHRpb25zKSB7XHJcbiAgICBzdXBlcihzb3VyY2UsIHRhcmdldCwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5hc3NvY2lhdGlvblR5cGUgPSAnSGFzTWFueSc7XHJcbiAgICB0aGlzLnRhcmdldEFzc29jaWF0aW9uID0gbnVsbDtcclxuICAgIHRoaXMuc2VxdWVsaXplID0gc291cmNlLnNlcXVlbGl6ZTtcclxuICAgIHRoaXMuaXNNdWx0aUFzc29jaWF0aW9uID0gdHJ1ZTtcclxuICAgIHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZSA9IHt9O1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudGhyb3VnaCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ046TSBhc3NvY2lhdGlvbnMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCBoYXNNYW55LiBVc2UgYmVsb25nc1RvTWFueSBpbnN0ZWFkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICogSWYgc2VsZiBhc3NvY2lhdGlvbiwgdGhpcyBpcyB0aGUgdGFyZ2V0IGFzc29jaWF0aW9uXHJcbiAgICAqL1xyXG4gICAgaWYgKHRoaXMuaXNTZWxmQXNzb2NpYXRpb24pIHtcclxuICAgICAgdGhpcy50YXJnZXRBc3NvY2lhdGlvbiA9IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuYXMpIHtcclxuICAgICAgdGhpcy5pc0FsaWFzZWQgPSB0cnVlO1xyXG5cclxuICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdCh0aGlzLmFzKSkge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5uYW1lID0gdGhpcy5hcztcclxuICAgICAgICB0aGlzLmFzID0gdGhpcy5hcy5wbHVyYWw7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB7XHJcbiAgICAgICAgICBwbHVyYWw6IHRoaXMuYXMsXHJcbiAgICAgICAgICBzaW5ndWxhcjogVXRpbHMuc2luZ3VsYXJpemUodGhpcy5hcylcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmFzID0gdGhpcy50YXJnZXQub3B0aW9ucy5uYW1lLnBsdXJhbDtcclxuICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB0aGlzLnRhcmdldC5vcHRpb25zLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIEZvcmVpZ24ga2V5IHNldHVwXHJcbiAgICAgKi9cclxuICAgIGlmIChfLmlzT2JqZWN0KHRoaXMub3B0aW9ucy5mb3JlaWduS2V5KSkge1xyXG4gICAgICB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUgPSB0aGlzLm9wdGlvbnMuZm9yZWlnbktleTtcclxuICAgICAgdGhpcy5mb3JlaWduS2V5ID0gdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlLm5hbWUgfHwgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlLmZpZWxkTmFtZTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmZvcmVpZ25LZXkpIHtcclxuICAgICAgdGhpcy5mb3JlaWduS2V5ID0gdGhpcy5vcHRpb25zLmZvcmVpZ25LZXk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLmZvcmVpZ25LZXkpIHtcclxuICAgICAgdGhpcy5mb3JlaWduS2V5ID0gVXRpbHMuY2FtZWxpemUoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgdGhpcy5zb3VyY2Uub3B0aW9ucy5uYW1lLnNpbmd1bGFyLFxyXG4gICAgICAgICAgdGhpcy5zb3VyY2UucHJpbWFyeUtleUF0dHJpYnV0ZVxyXG4gICAgICAgIF0uam9pbignXycpXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XSkge1xyXG4gICAgICB0aGlzLmlkZW50aWZpZXJGaWVsZCA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5maWVsZCB8fCB0aGlzLmZvcmVpZ25LZXk7XHJcbiAgICAgIHRoaXMuZm9yZWlnbktleUZpZWxkID0gdGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldLmZpZWxkIHx8IHRoaXMuZm9yZWlnbktleTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogU291cmNlIGtleSBzZXR1cFxyXG4gICAgICovXHJcbiAgICB0aGlzLnNvdXJjZUtleSA9IHRoaXMub3B0aW9ucy5zb3VyY2VLZXkgfHwgdGhpcy5zb3VyY2UucHJpbWFyeUtleUF0dHJpYnV0ZTtcclxuXHJcbiAgICBpZiAodGhpcy5zb3VyY2UucmF3QXR0cmlidXRlc1t0aGlzLnNvdXJjZUtleV0pIHtcclxuICAgICAgdGhpcy5zb3VyY2VLZXlBdHRyaWJ1dGUgPSB0aGlzLnNvdXJjZUtleTtcclxuICAgICAgdGhpcy5zb3VyY2VLZXlGaWVsZCA9IHRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5zb3VyY2VLZXldLmZpZWxkIHx8IHRoaXMuc291cmNlS2V5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zb3VyY2VLZXlBdHRyaWJ1dGUgPSB0aGlzLnNvdXJjZS5wcmltYXJ5S2V5QXR0cmlidXRlO1xyXG4gICAgICB0aGlzLnNvdXJjZUtleUZpZWxkID0gdGhpcy5zb3VyY2UucHJpbWFyeUtleUZpZWxkO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCBzaW5ndWxhciBhbmQgcGx1cmFsIG5hbWVzXHJcbiAgICAvLyB0cnkgdG8gdXBwZXJjYXNlIHRoZSBmaXJzdCBsZXR0ZXIsIHVubGVzcyB0aGUgbW9kZWwgZm9yYmlkcyBpdFxyXG4gICAgY29uc3QgcGx1cmFsID0gXy51cHBlckZpcnN0KHRoaXMub3B0aW9ucy5uYW1lLnBsdXJhbCk7XHJcbiAgICBjb25zdCBzaW5ndWxhciA9IF8udXBwZXJGaXJzdCh0aGlzLm9wdGlvbnMubmFtZS5zaW5ndWxhcik7XHJcblxyXG4gICAgdGhpcy5hc3NvY2lhdGlvbkFjY2Vzc29yID0gdGhpcy5hcztcclxuICAgIHRoaXMuYWNjZXNzb3JzID0ge1xyXG4gICAgICBnZXQ6IGBnZXQke3BsdXJhbH1gLFxyXG4gICAgICBzZXQ6IGBzZXQke3BsdXJhbH1gLFxyXG4gICAgICBhZGRNdWx0aXBsZTogYGFkZCR7cGx1cmFsfWAsXHJcbiAgICAgIGFkZDogYGFkZCR7c2luZ3VsYXJ9YCxcclxuICAgICAgY3JlYXRlOiBgY3JlYXRlJHtzaW5ndWxhcn1gLFxyXG4gICAgICByZW1vdmU6IGByZW1vdmUke3Npbmd1bGFyfWAsXHJcbiAgICAgIHJlbW92ZU11bHRpcGxlOiBgcmVtb3ZlJHtwbHVyYWx9YCxcclxuICAgICAgaGFzU2luZ2xlOiBgaGFzJHtzaW5ndWxhcn1gLFxyXG4gICAgICBoYXNBbGw6IGBoYXMke3BsdXJhbH1gLFxyXG4gICAgICBjb3VudDogYGNvdW50JHtwbHVyYWx9YFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIHRoZSBpZCBpcyBpbiB0aGUgdGFyZ2V0IHRhYmxlXHJcbiAgLy8gb3IgaW4gYW4gZXh0cmEgdGFibGUgd2hpY2ggY29ubmVjdHMgdHdvIHRhYmxlc1xyXG4gIF9pbmplY3RBdHRyaWJ1dGVzKCkge1xyXG4gICAgY29uc3QgbmV3QXR0cmlidXRlcyA9IHt9O1xyXG4gICAgLy8gQ3JlYXRlIGEgbmV3IG9wdGlvbnMgb2JqZWN0IGZvciB1c2Ugd2l0aCBhZGRGb3JlaWduS2V5Q29uc3RyYWludHMsIHRvIGF2b2lkIHBvbGx1dGluZyB0aGlzLm9wdGlvbnMgaW4gY2FzZSBpdCBpcyBsYXRlciB1c2VkIGZvciBhIG46bVxyXG4gICAgY29uc3QgY29uc3RyYWludE9wdGlvbnMgPSBfLmNsb25lKHRoaXMub3B0aW9ucyk7XHJcblxyXG4gICAgbmV3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldID0gXy5kZWZhdWx0cyh7fSwgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlLCB7XHJcbiAgICAgIHR5cGU6IHRoaXMub3B0aW9ucy5rZXlUeXBlIHx8IHRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5zb3VyY2VLZXlBdHRyaWJ1dGVdLnR5cGUsXHJcbiAgICAgIGFsbG93TnVsbDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb25zdHJhaW50cyAhPT0gZmFsc2UpIHtcclxuICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldIHx8IG5ld0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XTtcclxuICAgICAgY29uc3RyYWludE9wdGlvbnMub25EZWxldGUgPSBjb25zdHJhaW50T3B0aW9ucy5vbkRlbGV0ZSB8fCAodGFyZ2V0LmFsbG93TnVsbCA/ICdTRVQgTlVMTCcgOiAnQ0FTQ0FERScpO1xyXG4gICAgICBjb25zdHJhaW50T3B0aW9ucy5vblVwZGF0ZSA9IGNvbnN0cmFpbnRPcHRpb25zLm9uVXBkYXRlIHx8ICdDQVNDQURFJztcclxuICAgIH1cclxuXHJcbiAgICBIZWxwZXJzLmFkZEZvcmVpZ25LZXlDb25zdHJhaW50cyhuZXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0sIHRoaXMuc291cmNlLCB0aGlzLnRhcmdldCwgY29uc3RyYWludE9wdGlvbnMsIHRoaXMuc291cmNlS2V5RmllbGQpO1xyXG4gICAgVXRpbHMubWVyZ2VEZWZhdWx0cyh0aGlzLnRhcmdldC5yYXdBdHRyaWJ1dGVzLCBuZXdBdHRyaWJ1dGVzKTtcclxuXHJcbiAgICB0aGlzLnRhcmdldC5yZWZyZXNoQXR0cmlidXRlcygpO1xyXG4gICAgdGhpcy5zb3VyY2UucmVmcmVzaEF0dHJpYnV0ZXMoKTtcclxuXHJcbiAgICB0aGlzLmlkZW50aWZpZXJGaWVsZCA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5maWVsZCB8fCB0aGlzLmZvcmVpZ25LZXk7XHJcbiAgICB0aGlzLmZvcmVpZ25LZXlGaWVsZCA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5maWVsZCB8fCB0aGlzLmZvcmVpZ25LZXk7XHJcbiAgICB0aGlzLnNvdXJjZUtleUZpZWxkID0gdGhpcy5zb3VyY2UucmF3QXR0cmlidXRlc1t0aGlzLnNvdXJjZUtleV0uZmllbGQgfHwgdGhpcy5zb3VyY2VLZXk7XHJcblxyXG4gICAgSGVscGVycy5jaGVja05hbWluZ0NvbGxpc2lvbih0aGlzKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIG1peGluKG9iaikge1xyXG4gICAgY29uc3QgbWV0aG9kcyA9IFsnZ2V0JywgJ2NvdW50JywgJ2hhc1NpbmdsZScsICdoYXNBbGwnLCAnc2V0JywgJ2FkZCcsICdhZGRNdWx0aXBsZScsICdyZW1vdmUnLCAncmVtb3ZlTXVsdGlwbGUnLCAnY3JlYXRlJ107XHJcbiAgICBjb25zdCBhbGlhc2VzID0ge1xyXG4gICAgICBoYXNTaW5nbGU6ICdoYXMnLFxyXG4gICAgICBoYXNBbGw6ICdoYXMnLFxyXG4gICAgICBhZGRNdWx0aXBsZTogJ2FkZCcsXHJcbiAgICAgIHJlbW92ZU11bHRpcGxlOiAncmVtb3ZlJ1xyXG4gICAgfTtcclxuXHJcbiAgICBIZWxwZXJzLm1peGluTWV0aG9kcyh0aGlzLCBvYmosIG1ldGhvZHMsIGFsaWFzZXMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGV2ZXJ5dGhpbmcgY3VycmVudGx5IGFzc29jaWF0ZWQgd2l0aCB0aGlzLCB1c2luZyBhbiBvcHRpb25hbCB3aGVyZSBjbGF1c2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfEFycmF5PE1vZGVsPn0gaW5zdGFuY2VzIHNvdXJjZSBpbnN0YW5jZXNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIGZpbmQgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy53aGVyZV0gQW4gb3B0aW9uYWwgd2hlcmUgY2xhdXNlIHRvIGxpbWl0IHRoZSBhc3NvY2lhdGVkIG1vZGVsc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLnNjb3BlXSBBcHBseSBhIHNjb3BlIG9uIHRoZSByZWxhdGVkIG1vZGVsLCBvciByZW1vdmUgaXRzIGRlZmF1bHQgc2NvcGUgYnkgcGFzc2luZyBmYWxzZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY2hlbWFdIEFwcGx5IGEgc2NoZW1hIG9uIHRoZSByZWxhdGVkIG1vZGVsXHJcbiAgICpcclxuICAgKiBAc2VlXHJcbiAgICoge0BsaW5rIE1vZGVsLmZpbmRBbGx9ICBmb3IgYSBmdWxsIGV4cGxhbmF0aW9uIG9mIG9wdGlvbnNcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5PE1vZGVsPj59XHJcbiAgICovXHJcbiAgZ2V0KGluc3RhbmNlcywgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICBjb25zdCB3aGVyZSA9IHt9O1xyXG5cclxuICAgIGxldCBNb2RlbCA9IHRoaXMudGFyZ2V0O1xyXG4gICAgbGV0IGluc3RhbmNlO1xyXG4gICAgbGV0IHZhbHVlcztcclxuXHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoaW5zdGFuY2VzKSkge1xyXG4gICAgICBpbnN0YW5jZSA9IGluc3RhbmNlcztcclxuICAgICAgaW5zdGFuY2VzID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKTtcclxuXHJcbiAgICBpZiAodGhpcy5zY29wZSkge1xyXG4gICAgICBPYmplY3QuYXNzaWduKHdoZXJlLCB0aGlzLnNjb3BlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaW5zdGFuY2VzKSB7XHJcbiAgICAgIHZhbHVlcyA9IGluc3RhbmNlcy5tYXAoaW5zdGFuY2UgPT4gaW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5LCB7IHJhdzogdHJ1ZSB9KSk7XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5saW1pdCAmJiBpbnN0YW5jZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIG9wdGlvbnMuZ3JvdXBlZExpbWl0ID0ge1xyXG4gICAgICAgICAgbGltaXQ6IG9wdGlvbnMubGltaXQsXHJcbiAgICAgICAgICBvbjogdGhpcywgLy8gYXNzb2NpYXRpb25cclxuICAgICAgICAgIHZhbHVlc1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLmxpbWl0O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHdoZXJlW3RoaXMuZm9yZWlnbktleV0gPSB7XHJcbiAgICAgICAgICBbT3AuaW5dOiB2YWx1ZXNcclxuICAgICAgICB9O1xyXG4gICAgICAgIGRlbGV0ZSBvcHRpb25zLmdyb3VwZWRMaW1pdDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2hlcmVbdGhpcy5mb3JlaWduS2V5XSA9IGluc3RhbmNlLmdldCh0aGlzLnNvdXJjZUtleSwgeyByYXc6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucy53aGVyZSA9IG9wdGlvbnMud2hlcmUgP1xyXG4gICAgICB7IFtPcC5hbmRdOiBbd2hlcmUsIG9wdGlvbnMud2hlcmVdIH0gOlxyXG4gICAgICB3aGVyZTtcclxuXHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsICdzY29wZScpKSB7XHJcbiAgICAgIGlmICghb3B0aW9ucy5zY29wZSkge1xyXG4gICAgICAgIE1vZGVsID0gTW9kZWwudW5zY29wZWQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBNb2RlbCA9IE1vZGVsLnNjb3BlKG9wdGlvbnMuc2NvcGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAnc2NoZW1hJykpIHtcclxuICAgICAgTW9kZWwgPSBNb2RlbC5zY2hlbWEob3B0aW9ucy5zY2hlbWEsIG9wdGlvbnMuc2NoZW1hRGVsaW1pdGVyKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gTW9kZWwuZmluZEFsbChvcHRpb25zKS50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICBpZiAoaW5zdGFuY2UpIHJldHVybiByZXN1bHRzO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0ge307XHJcbiAgICAgIGZvciAoY29uc3QgaW5zdGFuY2Ugb2YgaW5zdGFuY2VzKSB7XHJcbiAgICAgICAgcmVzdWx0W2luc3RhbmNlLmdldCh0aGlzLnNvdXJjZUtleSwgeyByYXc6IHRydWUgfSldID0gW107XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAoY29uc3QgaW5zdGFuY2Ugb2YgcmVzdWx0cykge1xyXG4gICAgICAgIHJlc3VsdFtpbnN0YW5jZS5nZXQodGhpcy5mb3JlaWduS2V5LCB7IHJhdzogdHJ1ZSB9KV0ucHVzaChpbnN0YW5jZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvdW50IGV2ZXJ5dGhpbmcgY3VycmVudGx5IGFzc29jaWF0ZWQgd2l0aCB0aGlzLCB1c2luZyBhbiBvcHRpb25hbCB3aGVyZSBjbGF1c2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSAgICAgICAgaW5zdGFuY2UgdGhlIHNvdXJjZSBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgIFtvcHRpb25zXSBmaW5kICYgY291bnQgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgIFtvcHRpb25zLndoZXJlXSBBbiBvcHRpb25hbCB3aGVyZSBjbGF1c2UgdG8gbGltaXQgdGhlIGFzc29jaWF0ZWQgbW9kZWxzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8Ym9vbGVhbn0gW29wdGlvbnMuc2NvcGVdIEFwcGx5IGEgc2NvcGUgb24gdGhlIHJlbGF0ZWQgbW9kZWwsIG9yIHJlbW92ZSBpdHMgZGVmYXVsdCBzY29wZSBieSBwYXNzaW5nIGZhbHNlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxudW1iZXI+fVxyXG4gICAqL1xyXG4gIGNvdW50KGluc3RhbmNlLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpO1xyXG5cclxuICAgIG9wdGlvbnMuYXR0cmlidXRlcyA9IFtcclxuICAgICAgW1xyXG4gICAgICAgIHRoaXMuc2VxdWVsaXplLmZuKFxyXG4gICAgICAgICAgJ0NPVU5UJyxcclxuICAgICAgICAgIHRoaXMuc2VxdWVsaXplLmNvbChgJHt0aGlzLnRhcmdldC5uYW1lfS4ke3RoaXMudGFyZ2V0LnByaW1hcnlLZXlGaWVsZH1gKVxyXG4gICAgICAgICksXHJcbiAgICAgICAgJ2NvdW50J1xyXG4gICAgICBdXHJcbiAgICBdO1xyXG4gICAgb3B0aW9ucy5yYXcgPSB0cnVlO1xyXG4gICAgb3B0aW9ucy5wbGFpbiA9IHRydWU7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuZ2V0KGluc3RhbmNlLCBvcHRpb25zKS50aGVuKHJlc3VsdCA9PiBwYXJzZUludChyZXN1bHQuY291bnQsIDEwKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGVjayBpZiBvbmUgb3IgbW9yZSByb3dzIGFyZSBhc3NvY2lhdGVkIHdpdGggYHRoaXNgLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2UgdGhlIHNvdXJjZSBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7TW9kZWx8TW9kZWxbXXxzdHJpbmdbXXxzdHJpbmd8bnVtYmVyW118bnVtYmVyfSBbdGFyZ2V0SW5zdGFuY2VzXSBDYW4gYmUgYW4gYXJyYXkgb2YgaW5zdGFuY2VzIG9yIHRoZWlyIHByaW1hcnkga2V5c1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9ucyBwYXNzZWQgdG8gZ2V0QXNzb2NpYXRpb25zXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBoYXMoc291cmNlSW5zdGFuY2UsIHRhcmdldEluc3RhbmNlcywgb3B0aW9ucykge1xyXG4gICAgY29uc3Qgd2hlcmUgPSB7fTtcclxuXHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodGFyZ2V0SW5zdGFuY2VzKSkge1xyXG4gICAgICB0YXJnZXRJbnN0YW5jZXMgPSBbdGFyZ2V0SW5zdGFuY2VzXTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xyXG4gICAgICBzY29wZTogZmFsc2UsXHJcbiAgICAgIGF0dHJpYnV0ZXM6IFt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXSxcclxuICAgICAgcmF3OiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICB3aGVyZVtPcC5vcl0gPSB0YXJnZXRJbnN0YW5jZXMubWFwKGluc3RhbmNlID0+IHtcclxuICAgICAgaWYgKGluc3RhbmNlIGluc3RhbmNlb2YgdGhpcy50YXJnZXQpIHtcclxuICAgICAgICByZXR1cm4gaW5zdGFuY2Uud2hlcmUoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIFt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXTogaW5zdGFuY2VcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIG9wdGlvbnMud2hlcmUgPSB7XHJcbiAgICAgIFtPcC5hbmRdOiBbXHJcbiAgICAgICAgd2hlcmUsXHJcbiAgICAgICAgb3B0aW9ucy53aGVyZVxyXG4gICAgICBdXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB0aGlzLmdldChzb3VyY2VJbnN0YW5jZSwgb3B0aW9ucykudGhlbihhc3NvY2lhdGVkT2JqZWN0cyA9PiBhc3NvY2lhdGVkT2JqZWN0cy5sZW5ndGggPT09IHRhcmdldEluc3RhbmNlcy5sZW5ndGgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSBhc3NvY2lhdGVkIG1vZGVscyBieSBwYXNzaW5nIGFuIGFycmF5IG9mIHBlcnNpc3RlZCBpbnN0YW5jZXMgb3IgdGhlaXIgcHJpbWFyeSBrZXlzLiBFdmVyeXRoaW5nIHRoYXQgaXMgbm90IGluIHRoZSBwYXNzZWQgYXJyYXkgd2lsbCBiZSB1bi1hc3NvY2lhdGVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSBzb3VyY2UgaW5zdGFuY2UgdG8gYXNzb2NpYXRlIG5ldyBpbnN0YW5jZXMgd2l0aFxyXG4gICAqIEBwYXJhbSB7TW9kZWx8TW9kZWxbXXxzdHJpbmdbXXxzdHJpbmd8bnVtYmVyW118bnVtYmVyfSBbdGFyZ2V0SW5zdGFuY2VzXSBBbiBhcnJheSBvZiBwZXJzaXN0ZWQgaW5zdGFuY2VzIG9yIHByaW1hcnkga2V5IG9mIGluc3RhbmNlcyB0byBhc3NvY2lhdGUgd2l0aCB0aGlzLiBQYXNzIGBudWxsYCBvciBgdW5kZWZpbmVkYCB0byByZW1vdmUgYWxsIGFzc29jaWF0aW9ucy5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGB0YXJnZXQuZmluZEFsbGAgYW5kIGB1cGRhdGVgLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy52YWxpZGF0ZV0gUnVuIHZhbGlkYXRpb24gZm9yIHRoZSBqb2luIG1vZGVsXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBzZXQoc291cmNlSW5zdGFuY2UsIHRhcmdldEluc3RhbmNlcywgb3B0aW9ucykge1xyXG4gICAgaWYgKHRhcmdldEluc3RhbmNlcyA9PT0gbnVsbCkge1xyXG4gICAgICB0YXJnZXRJbnN0YW5jZXMgPSBbXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRhcmdldEluc3RhbmNlcyA9IHRoaXMudG9JbnN0YW5jZUFycmF5KHRhcmdldEluc3RhbmNlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuZ2V0KHNvdXJjZUluc3RhbmNlLCBfLmRlZmF1bHRzKHsgc2NvcGU6IGZhbHNlLCByYXc6IHRydWUgfSwgb3B0aW9ucykpLnRoZW4ob2xkQXNzb2NpYXRpb25zID0+IHtcclxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcclxuICAgICAgY29uc3Qgb2Jzb2xldGVBc3NvY2lhdGlvbnMgPSBvbGRBc3NvY2lhdGlvbnMuZmlsdGVyKG9sZCA9PlxyXG4gICAgICAgICF0YXJnZXRJbnN0YW5jZXMuZmluZChvYmogPT5cclxuICAgICAgICAgIG9ialt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXSA9PT0gb2xkW3RoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGVdXHJcbiAgICAgICAgKVxyXG4gICAgICApO1xyXG4gICAgICBjb25zdCB1bmFzc29jaWF0ZWRPYmplY3RzID0gdGFyZ2V0SW5zdGFuY2VzLmZpbHRlcihvYmogPT5cclxuICAgICAgICAhb2xkQXNzb2NpYXRpb25zLmZpbmQob2xkID0+XHJcbiAgICAgICAgICBvYmpbdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZV0gPT09IG9sZFt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgbGV0IHVwZGF0ZVdoZXJlO1xyXG4gICAgICBsZXQgdXBkYXRlO1xyXG5cclxuICAgICAgaWYgKG9ic29sZXRlQXNzb2NpYXRpb25zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB1cGRhdGUgPSB7fTtcclxuICAgICAgICB1cGRhdGVbdGhpcy5mb3JlaWduS2V5XSA9IG51bGw7XHJcblxyXG4gICAgICAgIHVwZGF0ZVdoZXJlID0ge1xyXG4gICAgICAgICAgW3RoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGVdOiBvYnNvbGV0ZUFzc29jaWF0aW9ucy5tYXAoYXNzb2NpYXRlZE9iamVjdCA9PlxyXG4gICAgICAgICAgICBhc3NvY2lhdGVkT2JqZWN0W3RoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGVdXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy50YXJnZXQudW5zY29wZWQoKS51cGRhdGUoXHJcbiAgICAgICAgICB1cGRhdGUsXHJcbiAgICAgICAgICBfLmRlZmF1bHRzKHtcclxuICAgICAgICAgICAgd2hlcmU6IHVwZGF0ZVdoZXJlXHJcbiAgICAgICAgICB9LCBvcHRpb25zKVxyXG4gICAgICAgICkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodW5hc3NvY2lhdGVkT2JqZWN0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdXBkYXRlV2hlcmUgPSB7fTtcclxuXHJcbiAgICAgICAgdXBkYXRlID0ge307XHJcbiAgICAgICAgdXBkYXRlW3RoaXMuZm9yZWlnbktleV0gPSBzb3VyY2VJbnN0YW5jZS5nZXQodGhpcy5zb3VyY2VLZXkpO1xyXG5cclxuICAgICAgICBPYmplY3QuYXNzaWduKHVwZGF0ZSwgdGhpcy5zY29wZSk7XHJcbiAgICAgICAgdXBkYXRlV2hlcmVbdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZV0gPSB1bmFzc29jaWF0ZWRPYmplY3RzLm1hcCh1bmFzc29jaWF0ZWRPYmplY3QgPT5cclxuICAgICAgICAgIHVuYXNzb2NpYXRlZE9iamVjdFt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy50YXJnZXQudW5zY29wZWQoKS51cGRhdGUoXHJcbiAgICAgICAgICB1cGRhdGUsXHJcbiAgICAgICAgICBfLmRlZmF1bHRzKHtcclxuICAgICAgICAgICAgd2hlcmU6IHVwZGF0ZVdoZXJlXHJcbiAgICAgICAgICB9LCBvcHRpb25zKVxyXG4gICAgICAgICkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gVXRpbHMuUHJvbWlzZS5hbGwocHJvbWlzZXMpLnJldHVybihzb3VyY2VJbnN0YW5jZSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFzc29jaWF0ZSBvbmUgb3IgbW9yZSB0YXJnZXQgcm93cyB3aXRoIGB0aGlzYC4gVGhpcyBtZXRob2QgYWNjZXB0cyBhIE1vZGVsIC8gc3RyaW5nIC8gbnVtYmVyIHRvIGFzc29jaWF0ZSBhIHNpbmdsZSByb3csXHJcbiAgICogb3IgYSBtaXhlZCBhcnJheSBvZiBNb2RlbCAvIHN0cmluZyAvIG51bWJlcnMgdG8gYXNzb2NpYXRlIG11bHRpcGxlIHJvd3MuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSB0aGUgc291cmNlIGluc3RhbmNlXHJcbiAgICogQHBhcmFtIHtNb2RlbHxNb2RlbFtdfHN0cmluZ1tdfHN0cmluZ3xudW1iZXJbXXxudW1iZXJ9IFt0YXJnZXRJbnN0YW5jZXNdIEEgc2luZ2xlIGluc3RhbmNlIG9yIHByaW1hcnkga2V5LCBvciBhIG1peGVkIGFycmF5IG9mIHBlcnNpc3RlZCBpbnN0YW5jZXMgb3IgcHJpbWFyeSBrZXlzXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGFyZ2V0LnVwZGF0ZWAuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBhZGQoc291cmNlSW5zdGFuY2UsIHRhcmdldEluc3RhbmNlcywgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICBpZiAoIXRhcmdldEluc3RhbmNlcykgcmV0dXJuIFV0aWxzLlByb21pc2UucmVzb2x2ZSgpO1xyXG5cclxuICAgIGNvbnN0IHVwZGF0ZSA9IHt9O1xyXG5cclxuICAgIHRhcmdldEluc3RhbmNlcyA9IHRoaXMudG9JbnN0YW5jZUFycmF5KHRhcmdldEluc3RhbmNlcyk7XHJcblxyXG4gICAgdXBkYXRlW3RoaXMuZm9yZWlnbktleV0gPSBzb3VyY2VJbnN0YW5jZS5nZXQodGhpcy5zb3VyY2VLZXkpO1xyXG4gICAgT2JqZWN0LmFzc2lnbih1cGRhdGUsIHRoaXMuc2NvcGUpO1xyXG5cclxuICAgIGNvbnN0IHdoZXJlID0ge1xyXG4gICAgICBbdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZV06IHRhcmdldEluc3RhbmNlcy5tYXAodW5hc3NvY2lhdGVkT2JqZWN0ID0+XHJcbiAgICAgICAgdW5hc3NvY2lhdGVkT2JqZWN0LmdldCh0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlKVxyXG4gICAgICApXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRhcmdldC51bnNjb3BlZCgpLnVwZGF0ZSh1cGRhdGUsIF8uZGVmYXVsdHMoeyB3aGVyZSB9LCBvcHRpb25zKSkucmV0dXJuKHNvdXJjZUluc3RhbmNlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVuLWFzc29jaWF0ZSBvbmUgb3Igc2V2ZXJhbCB0YXJnZXQgcm93cy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7TW9kZWx9IHNvdXJjZUluc3RhbmNlIGluc3RhbmNlIHRvIHVuIGFzc29jaWF0ZSBpbnN0YW5jZXMgd2l0aFxyXG4gICAqIEBwYXJhbSB7TW9kZWx8TW9kZWxbXXxzdHJpbmd8c3RyaW5nW118bnVtYmVyfG51bWJlcltdfSBbdGFyZ2V0SW5zdGFuY2VzXSBDYW4gYmUgYW4gSW5zdGFuY2Ugb3IgaXRzIHByaW1hcnkga2V5LCBvciBhIG1peGVkIGFycmF5IG9mIGluc3RhbmNlcyBhbmQgcHJpbWFyeSBrZXlzXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGFyZ2V0LnVwZGF0ZWBcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIHJlbW92ZShzb3VyY2VJbnN0YW5jZSwgdGFyZ2V0SW5zdGFuY2VzLCBvcHRpb25zID0ge30pIHtcclxuICAgIGNvbnN0IHVwZGF0ZSA9IHtcclxuICAgICAgW3RoaXMuZm9yZWlnbktleV06IG51bGxcclxuICAgIH07XHJcblxyXG4gICAgdGFyZ2V0SW5zdGFuY2VzID0gdGhpcy50b0luc3RhbmNlQXJyYXkodGFyZ2V0SW5zdGFuY2VzKTtcclxuXHJcbiAgICBjb25zdCB3aGVyZSA9IHtcclxuICAgICAgW3RoaXMuZm9yZWlnbktleV06IHNvdXJjZUluc3RhbmNlLmdldCh0aGlzLnNvdXJjZUtleSksXHJcbiAgICAgIFt0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlXTogdGFyZ2V0SW5zdGFuY2VzLm1hcCh0YXJnZXRJbnN0YW5jZSA9PlxyXG4gICAgICAgIHRhcmdldEluc3RhbmNlLmdldCh0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlKVxyXG4gICAgICApXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB0aGlzLnRhcmdldC51bnNjb3BlZCgpLnVwZGF0ZSh1cGRhdGUsIF8uZGVmYXVsdHMoeyB3aGVyZSB9LCBvcHRpb25zKSkucmV0dXJuKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBhc3NvY2lhdGVkIG1vZGVsIGFuZCBhc3NvY2lhdGUgaXQgd2l0aCB0aGlzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2Ugc291cmNlIGluc3RhbmNlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFt2YWx1ZXNdIHZhbHVlcyBmb3IgdGFyZ2V0IG1vZGVsIGluc3RhbmNlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGFyZ2V0LmNyZWF0ZWBcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGNyZWF0ZShzb3VyY2VJbnN0YW5jZSwgdmFsdWVzLCBvcHRpb25zID0ge30pIHtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XHJcbiAgICAgIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgZmllbGRzOiBvcHRpb25zXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHZhbHVlcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHZhbHVlcyA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLnNjb3BlKSB7XHJcbiAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIE9iamVjdC5rZXlzKHRoaXMuc2NvcGUpKSB7XHJcbiAgICAgICAgdmFsdWVzW2F0dHJpYnV0ZV0gPSB0aGlzLnNjb3BlW2F0dHJpYnV0ZV07XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZmllbGRzKSBvcHRpb25zLmZpZWxkcy5wdXNoKGF0dHJpYnV0ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YWx1ZXNbdGhpcy5mb3JlaWduS2V5XSA9IHNvdXJjZUluc3RhbmNlLmdldCh0aGlzLnNvdXJjZUtleSk7XHJcbiAgICBpZiAob3B0aW9ucy5maWVsZHMpIG9wdGlvbnMuZmllbGRzLnB1c2godGhpcy5mb3JlaWduS2V5KTtcclxuICAgIHJldHVybiB0aGlzLnRhcmdldC5jcmVhdGUodmFsdWVzLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIHZlcmlmeUFzc29jaWF0aW9uQWxpYXMoYWxpYXMpIHtcclxuICAgIGlmICh0eXBlb2YgYWxpYXMgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmFzID09PSBhbGlhcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWxpYXMgJiYgYWxpYXMucGx1cmFsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmFzID09PSBhbGlhcy5wbHVyYWw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICF0aGlzLmlzQWxpYXNlZDtcclxuICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSGFzTWFueTtcclxubW9kdWxlLmV4cG9ydHMuSGFzTWFueSA9IEhhc01hbnk7XHJcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBIYXNNYW55O1xyXG4iXX0=