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

const BelongsTo = require('./belongs-to');

const HasMany = require('./has-many');

const HasOne = require('./has-one');

const AssociationError = require('../errors').AssociationError;

const EmptyResultError = require('../errors').EmptyResultError;

const Op = require('../operators');
/**
 * Many-to-many association with a join table.
 *
 * When the join table has additional attributes, these can be passed in the options object:
 *
 * ```js
 * UserProject = sequelize.define('user_project', {
 *   role: Sequelize.STRING
 * });
 * User.belongsToMany(Project, { through: UserProject });
 * Project.belongsToMany(User, { through: UserProject });
 * // through is required!
 *
 * user.addProject(project, { through: { role: 'manager' }});
 * ```
 *
 * All methods allow you to pass either a persisted instance, its primary key, or a mixture:
 *
 * ```js
 * Project.create({ id: 11 }).then(project => {
 *   user.addProjects([project, 12]);
 * });
 * ```
 *
 * If you want to set several target instances, but with different attributes you have to set the attributes on the instance, using a property with the name of the through model:
 *
 * ```js
 * p1.UserProjects = {
 *   started: true
 * }
 * user.setProjects([p1, p2], { through: { started: false }}) // The default value is false, but p1 overrides that.
 * ```
 *
 * Similarly, when fetching through a join table with custom attributes, these attributes will be available as an object with the name of the through model.
 * ```js
 * user.getProjects().then(projects => {
   *   let p1 = projects[0]
   *   p1.UserProjects.started // Is this project started yet?
   * })
 * ```
 *
 * In the API reference below, add the name of the association to the method, e.g. for `User.belongsToMany(Project)` the getter will be `user.getProjects()`.
 *
 * @see {@link Model.belongsToMany}
 */


let BelongsToMany =
/*#__PURE__*/
function (_Association) {
  _inherits(BelongsToMany, _Association);

  function BelongsToMany(source, target, options) {
    var _this;

    _classCallCheck(this, BelongsToMany);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BelongsToMany).call(this, source, target, options));

    if (_this.options.through === undefined || _this.options.through === true || _this.options.through === null) {
      throw new AssociationError(`${source.name}.belongsToMany(${target.name}) requires through option, pass either a string or a model`);
    }

    if (!_this.options.through.model) {
      _this.options.through = {
        model: options.through
      };
    }

    _this.associationType = 'BelongsToMany';
    _this.targetAssociation = null;
    _this.sequelize = source.sequelize;
    _this.through = Object.assign({}, _this.options.through);
    _this.isMultiAssociation = true;
    _this.doubleLinked = false;

    if (!_this.as && _this.isSelfAssociation) {
      throw new AssociationError('\'as\' must be defined for many-to-many self-associations');
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

    _this.combinedTableName = Utils.combineTableNames(_this.source.tableName, _this.isSelfAssociation ? _this.as || _this.target.tableName : _this.target.tableName);
    /*
    * If self association, this is the target association - Unless we find a pairing association
    */

    if (_this.isSelfAssociation) {
      _this.targetAssociation = _assertThisInitialized(_this);
    }
    /*
    * Find paired association (if exists)
    */


    _.each(_this.target.associations, association => {
      if (association.associationType !== 'BelongsToMany') return;
      if (association.target !== _this.source) return;

      if (_this.options.through.model === association.options.through.model) {
        _this.paired = association;
        association.paired = _assertThisInitialized(_this);
      }
    });
    /*
    * Default/generated source/target keys
    */


    _this.sourceKey = _this.options.sourceKey || _this.source.primaryKeyAttribute;
    _this.sourceKeyField = _this.source.rawAttributes[_this.sourceKey].field || _this.sourceKey;

    if (_this.options.targetKey) {
      _this.targetKey = _this.options.targetKey;
      _this.targetKeyField = _this.target.rawAttributes[_this.targetKey].field || _this.targetKey;
    } else {
      _this.targetKeyDefault = true;
      _this.targetKey = _this.target.primaryKeyAttribute;
      _this.targetKeyField = _this.target.rawAttributes[_this.targetKey].field || _this.targetKey;
    }

    _this._createForeignAndOtherKeys();

    if (typeof _this.through.model === 'string') {
      if (!_this.sequelize.isDefined(_this.through.model)) {
        _this.through.model = _this.sequelize.define(_this.through.model, {}, Object.assign(_this.options, {
          tableName: _this.through.model,
          indexes: [],
          //we don't want indexes here (as referenced in #2416)
          paranoid: false,
          // A paranoid join table does not make sense
          validate: {} // Don't propagate model-level validations

        }));
      } else {
        _this.through.model = _this.sequelize.model(_this.through.model);
      }
    }

    _this.options = Object.assign(_this.options, _.pick(_this.through.model.options, ['timestamps', 'createdAt', 'updatedAt', 'deletedAt', 'paranoid']));

    if (_this.paired) {
      let needInjectPaired = false;

      if (_this.targetKeyDefault) {
        _this.targetKey = _this.paired.sourceKey;
        _this.targetKeyField = _this.paired.sourceKeyField;

        _this._createForeignAndOtherKeys();
      }

      if (_this.paired.targetKeyDefault) {
        // in this case paired.otherKey depends on paired.targetKey,
        // so cleanup previously wrong generated otherKey
        if (_this.paired.targetKey !== _this.sourceKey) {
          delete _this.through.model.rawAttributes[_this.paired.otherKey];
          _this.paired.targetKey = _this.sourceKey;
          _this.paired.targetKeyField = _this.sourceKeyField;

          _this.paired._createForeignAndOtherKeys();

          needInjectPaired = true;
        }
      }

      if (_this.otherKeyDefault) {
        _this.otherKey = _this.paired.foreignKey;
      }

      if (_this.paired.otherKeyDefault) {
        // If paired otherKey was inferred we should make sure to clean it up
        // before adding a new one that matches the foreignKey
        if (_this.paired.otherKey !== _this.foreignKey) {
          delete _this.through.model.rawAttributes[_this.paired.otherKey];
          _this.paired.otherKey = _this.foreignKey;
          needInjectPaired = true;
        }
      }

      if (needInjectPaired) {
        _this.paired._injectAttributes();
      }
    }

    if (_this.through) {
      _this.throughModel = _this.through.model;
    }

    _this.options.tableName = _this.combinedName = _this.through.model === Object(_this.through.model) ? _this.through.model.tableName : _this.through.model;
    _this.associationAccessor = _this.as; // Get singular and plural names, trying to uppercase the first letter, unless the model forbids it

    const plural = _.upperFirst(_this.options.name.plural);

    const singular = _.upperFirst(_this.options.name.singular);

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
  }

  _createClass(BelongsToMany, [{
    key: "_createForeignAndOtherKeys",
    value: function _createForeignAndOtherKeys() {
      /*
      * Default/generated foreign/other keys
      */
      if (_.isObject(this.options.foreignKey)) {
        this.foreignKeyAttribute = this.options.foreignKey;
        this.foreignKey = this.foreignKeyAttribute.name || this.foreignKeyAttribute.fieldName;
      } else {
        this.foreignKeyAttribute = {};
        this.foreignKey = this.options.foreignKey || Utils.camelize([this.source.options.name.singular, this.sourceKey].join('_'));
      }

      if (_.isObject(this.options.otherKey)) {
        this.otherKeyAttribute = this.options.otherKey;
        this.otherKey = this.otherKeyAttribute.name || this.otherKeyAttribute.fieldName;
      } else {
        if (!this.options.otherKey) {
          this.otherKeyDefault = true;
        }

        this.otherKeyAttribute = {};
        this.otherKey = this.options.otherKey || Utils.camelize([this.isSelfAssociation ? Utils.singularize(this.as) : this.target.options.name.singular, this.targetKey].join('_'));
      }
    } // the id is in the target table
    // or in an extra table which connects two tables

  }, {
    key: "_injectAttributes",
    value: function _injectAttributes() {
      this.identifier = this.foreignKey;
      this.foreignIdentifier = this.otherKey; // remove any PKs previously defined by sequelize
      // but ignore any keys that are part of this association (#5865)

      _.each(this.through.model.rawAttributes, (attribute, attributeName) => {
        if (attribute.primaryKey === true && attribute._autoGenerated === true) {
          if (attributeName === this.foreignKey || attributeName === this.otherKey) {
            // this key is still needed as it's part of the association
            // so just set primaryKey to false
            attribute.primaryKey = false;
          } else {
            delete this.through.model.rawAttributes[attributeName];
          }

          this.primaryKeyDeleted = true;
        }
      });

      const sourceKey = this.source.rawAttributes[this.sourceKey];
      const sourceKeyType = sourceKey.type;
      const sourceKeyField = this.sourceKeyField;
      const targetKey = this.target.rawAttributes[this.targetKey];
      const targetKeyType = targetKey.type;
      const targetKeyField = this.targetKeyField;

      const sourceAttribute = _.defaults({}, this.foreignKeyAttribute, {
        type: sourceKeyType
      });

      const targetAttribute = _.defaults({}, this.otherKeyAttribute, {
        type: targetKeyType
      });

      if (this.primaryKeyDeleted === true) {
        targetAttribute.primaryKey = sourceAttribute.primaryKey = true;
      } else if (this.through.unique !== false) {
        let uniqueKey;

        if (typeof this.options.uniqueKey === 'string' && this.options.uniqueKey !== '') {
          uniqueKey = this.options.uniqueKey;
        } else {
          uniqueKey = [this.through.model.tableName, this.foreignKey, this.otherKey, 'unique'].join('_');
        }

        targetAttribute.unique = sourceAttribute.unique = uniqueKey;
      }

      if (!this.through.model.rawAttributes[this.foreignKey]) {
        this.through.model.rawAttributes[this.foreignKey] = {
          _autoGenerated: true
        };
      }

      if (!this.through.model.rawAttributes[this.otherKey]) {
        this.through.model.rawAttributes[this.otherKey] = {
          _autoGenerated: true
        };
      }

      if (this.options.constraints !== false) {
        sourceAttribute.references = {
          model: this.source.getTableName(),
          key: sourceKeyField
        }; // For the source attribute the passed option is the priority

        sourceAttribute.onDelete = this.options.onDelete || this.through.model.rawAttributes[this.foreignKey].onDelete;
        sourceAttribute.onUpdate = this.options.onUpdate || this.through.model.rawAttributes[this.foreignKey].onUpdate;
        if (!sourceAttribute.onDelete) sourceAttribute.onDelete = 'CASCADE';
        if (!sourceAttribute.onUpdate) sourceAttribute.onUpdate = 'CASCADE';
        targetAttribute.references = {
          model: this.target.getTableName(),
          key: targetKeyField
        }; // But the for target attribute the previously defined option is the priority (since it could've been set by another belongsToMany call)

        targetAttribute.onDelete = this.through.model.rawAttributes[this.otherKey].onDelete || this.options.onDelete;
        targetAttribute.onUpdate = this.through.model.rawAttributes[this.otherKey].onUpdate || this.options.onUpdate;
        if (!targetAttribute.onDelete) targetAttribute.onDelete = 'CASCADE';
        if (!targetAttribute.onUpdate) targetAttribute.onUpdate = 'CASCADE';
      }

      this.through.model.rawAttributes[this.foreignKey] = Object.assign(this.through.model.rawAttributes[this.foreignKey], sourceAttribute);
      this.through.model.rawAttributes[this.otherKey] = Object.assign(this.through.model.rawAttributes[this.otherKey], targetAttribute);
      this.through.model.refreshAttributes();
      this.identifierField = this.through.model.rawAttributes[this.foreignKey].field || this.foreignKey;
      this.foreignIdentifierField = this.through.model.rawAttributes[this.otherKey].field || this.otherKey;

      if (this.paired && !this.paired.foreignIdentifierField) {
        this.paired.foreignIdentifierField = this.through.model.rawAttributes[this.paired.otherKey].field || this.paired.otherKey;
      }

      this.toSource = new BelongsTo(this.through.model, this.source, {
        foreignKey: this.foreignKey
      });
      this.manyFromSource = new HasMany(this.source, this.through.model, {
        foreignKey: this.foreignKey
      });
      this.oneFromSource = new HasOne(this.source, this.through.model, {
        foreignKey: this.foreignKey,
        as: this.through.model.name
      });
      this.toTarget = new BelongsTo(this.through.model, this.target, {
        foreignKey: this.otherKey
      });
      this.manyFromTarget = new HasMany(this.target, this.through.model, {
        foreignKey: this.otherKey
      });
      this.oneFromTarget = new HasOne(this.target, this.through.model, {
        foreignKey: this.otherKey,
        as: this.through.model.name
      });

      if (this.paired && this.paired.otherKeyDefault) {
        this.paired.toTarget = new BelongsTo(this.paired.through.model, this.paired.target, {
          foreignKey: this.paired.otherKey
        });
        this.paired.oneFromTarget = new HasOne(this.paired.target, this.paired.through.model, {
          foreignKey: this.paired.otherKey,
          as: this.paired.through.model.name
        });
      }

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
     * @see
     * {@link Model} for a full explanation of options
     *
     * @param {Model} instance instance
     * @param {Object} [options] find options
     * @param {Object} [options.where] An optional where clause to limit the associated models
     * @param {string|boolean} [options.scope] Apply a scope on the related model, or remove its default scope by passing false
     * @param {string} [options.schema] Apply a schema on the related model
     *
     * @returns {Promise<Array<Model>>}
     */

  }, {
    key: "get",
    value: function get(instance, options) {
      options = Utils.cloneDeep(options) || {};
      const through = this.through;
      let scopeWhere;
      let throughWhere;

      if (this.scope) {
        scopeWhere = _.clone(this.scope);
      }

      options.where = {
        [Op.and]: [scopeWhere, options.where]
      };

      if (Object(through.model) === through.model) {
        throughWhere = {};
        throughWhere[this.foreignKey] = instance.get(this.sourceKey);

        if (through.scope) {
          Object.assign(throughWhere, through.scope);
        } //If a user pass a where on the options through options, make an "and" with the current throughWhere


        if (options.through && options.through.where) {
          throughWhere = {
            [Op.and]: [throughWhere, options.through.where]
          };
        }

        options.include = options.include || [];
        options.include.push({
          association: this.oneFromTarget,
          attributes: options.joinTableAttributes,
          required: true,
          where: throughWhere
        });
      }

      let model = this.target;

      if (Object.prototype.hasOwnProperty.call(options, 'scope')) {
        if (!options.scope) {
          model = model.unscoped();
        } else {
          model = model.scope(options.scope);
        }
      }

      if (Object.prototype.hasOwnProperty.call(options, 'schema')) {
        model = model.schema(options.schema, options.schemaDelimiter);
      }

      return model.findAll(options);
    }
    /**
     * Count everything currently associated with this, using an optional where clause.
     *
     * @param {Model} instance instance
     * @param {Object} [options] find options
     * @param {Object} [options.where] An optional where clause to limit the associated models
     * @param {string|boolean} [options.scope] Apply a scope on the related model, or remove its default scope by passing false
     *
     * @returns {Promise<number>}
     */

  }, {
    key: "count",
    value: function count(instance, options) {
      const sequelize = this.target.sequelize;
      options = Utils.cloneDeep(options);
      options.attributes = [[sequelize.fn('COUNT', sequelize.col([this.target.name, this.targetKeyField].join('.'))), 'count']];
      options.joinTableAttributes = [];
      options.raw = true;
      options.plain = true;
      return this.get(instance, options).then(result => parseInt(result.count, 10));
    }
    /**
     * Check if one or more instance(s) are associated with this. If a list of instances is passed, the function returns true if _all_ instances are associated
     *
     * @param {Model} sourceInstance source instance to check for an association with
     * @param {Model|Model[]|string[]|string|number[]|number} [instances] Can be an array of instances or their primary keys
     * @param {Object} [options] Options passed to getAssociations
     *
     * @returns {Promise<boolean>}
     */

  }, {
    key: "has",
    value: function has(sourceInstance, instances, options) {
      if (!Array.isArray(instances)) {
        instances = [instances];
      }

      options = Object.assign({
        raw: true
      }, options, {
        scope: false,
        attributes: [this.targetKey],
        joinTableAttributes: []
      });
      const instancePrimaryKeys = instances.map(instance => {
        if (instance instanceof this.target) {
          return instance.where();
        }

        return {
          [this.targetKey]: instance
        };
      });
      options.where = {
        [Op.and]: [{
          [Op.or]: instancePrimaryKeys
        }, options.where]
      };
      return this.get(sourceInstance, options).then(associatedObjects => _.differenceWith(instancePrimaryKeys, associatedObjects, (a, b) => _.isEqual(a[this.targetKey], b[this.targetKey])).length === 0);
    }
    /**
     * Set the associated models by passing an array of instances or their primary keys.
     * Everything that it not in the passed array will be un-associated.
     *
     * @param {Model} sourceInstance source instance to associate new instances with
     * @param {Model|Model[]|string[]|string|number[]|number} [newAssociatedObjects] A single instance or primary key, or a mixed array of persisted instances or primary keys
     * @param {Object} [options] Options passed to `through.findAll`, `bulkCreate`, `update` and `destroy`
     * @param {Object} [options.validate] Run validation for the join model
     * @param {Object} [options.through] Additional attributes for the join table.
     *
     * @returns {Promise}
     */

  }, {
    key: "set",
    value: function set(sourceInstance, newAssociatedObjects, options) {
      options = options || {};
      const sourceKey = this.sourceKey;
      const targetKey = this.targetKey;
      const identifier = this.identifier;
      const foreignIdentifier = this.foreignIdentifier;
      let where = {};

      if (newAssociatedObjects === null) {
        newAssociatedObjects = [];
      } else {
        newAssociatedObjects = this.toInstanceArray(newAssociatedObjects);
      }

      where[identifier] = sourceInstance.get(sourceKey);
      where = Object.assign(where, this.through.scope);

      const updateAssociations = currentRows => {
        const obsoleteAssociations = [];
        const promises = [];
        const defaultAttributes = options.through || {};
        const unassociatedObjects = newAssociatedObjects.filter(obj => !currentRows.some(currentRow => currentRow[foreignIdentifier] === obj.get(targetKey)));

        for (const currentRow of currentRows) {
          const newObj = newAssociatedObjects.find(obj => currentRow[foreignIdentifier] === obj.get(targetKey));

          if (!newObj) {
            obsoleteAssociations.push(currentRow);
          } else {
            let throughAttributes = newObj[this.through.model.name]; // Quick-fix for subtle bug when using existing objects that might have the through model attached (not as an attribute object)

            if (throughAttributes instanceof this.through.model) {
              throughAttributes = {};
            }

            const attributes = _.defaults({}, throughAttributes, defaultAttributes);

            if (Object.keys(attributes).length) {
              promises.push(this.through.model.update(attributes, Object.assign(options, {
                where: {
                  [identifier]: sourceInstance.get(sourceKey),
                  [foreignIdentifier]: newObj.get(targetKey)
                }
              })));
            }
          }
        }

        if (obsoleteAssociations.length > 0) {
          const where = Object.assign({
            [identifier]: sourceInstance.get(sourceKey),
            [foreignIdentifier]: obsoleteAssociations.map(obsoleteAssociation => obsoleteAssociation[foreignIdentifier])
          }, this.through.scope);
          promises.push(this.through.model.destroy(_.defaults({
            where
          }, options)));
        }

        if (unassociatedObjects.length > 0) {
          const bulk = unassociatedObjects.map(unassociatedObject => {
            let attributes = {};
            attributes[identifier] = sourceInstance.get(sourceKey);
            attributes[foreignIdentifier] = unassociatedObject.get(targetKey);
            attributes = _.defaults(attributes, unassociatedObject[this.through.model.name], defaultAttributes);
            Object.assign(attributes, this.through.scope);
            attributes = Object.assign(attributes, this.through.scope);
            return attributes;
          });
          promises.push(this.through.model.bulkCreate(bulk, Object.assign({
            validate: true
          }, options)));
        }

        return Utils.Promise.all(promises);
      };

      return this.through.model.findAll(_.defaults({
        where,
        raw: true
      }, options)).then(currentRows => updateAssociations(currentRows)).catch(error => {
        if (error instanceof EmptyResultError) return updateAssociations([]);
        throw error;
      });
    }
    /**
     * Associate one or several rows with source instance. It will not un-associate any already associated instance
     * that may be missing from `newInstances`.
     *
     * @param {Model} sourceInstance source instance to associate new instances with
     * @param {Model|Model[]|string[]|string|number[]|number} [newInstances] A single instance or primary key, or a mixed array of persisted instances or primary keys
     * @param {Object} [options] Options passed to `through.findAll`, `bulkCreate` and `update`
     * @param {Object} [options.validate] Run validation for the join model.
     * @param {Object} [options.through] Additional attributes for the join table.
     *
     * @returns {Promise}
     */

  }, {
    key: "add",
    value: function add(sourceInstance, newInstances, options) {
      // If newInstances is null or undefined, no-op
      if (!newInstances) return Utils.Promise.resolve();
      options = _.clone(options) || {};
      const association = this;
      const sourceKey = association.sourceKey;
      const targetKey = association.targetKey;
      const identifier = association.identifier;
      const foreignIdentifier = association.foreignIdentifier;
      const defaultAttributes = options.through || {};
      newInstances = association.toInstanceArray(newInstances);
      const where = {
        [identifier]: sourceInstance.get(sourceKey),
        [foreignIdentifier]: newInstances.map(newInstance => newInstance.get(targetKey))
      };
      Object.assign(where, association.through.scope);

      const updateAssociations = currentRows => {
        const promises = [];
        const unassociatedObjects = [];
        const changedAssociations = [];

        for (const obj of newInstances) {
          const existingAssociation = currentRows && currentRows.find(current => current[foreignIdentifier] === obj.get(targetKey));

          if (!existingAssociation) {
            unassociatedObjects.push(obj);
          } else {
            const throughAttributes = obj[association.through.model.name];

            const attributes = _.defaults({}, throughAttributes, defaultAttributes);

            if (Object.keys(attributes).some(attribute => attributes[attribute] !== existingAssociation[attribute])) {
              changedAssociations.push(obj);
            }
          }
        }

        if (unassociatedObjects.length > 0) {
          const bulk = unassociatedObjects.map(unassociatedObject => {
            const throughAttributes = unassociatedObject[association.through.model.name];

            const attributes = _.defaults({}, throughAttributes, defaultAttributes);

            attributes[identifier] = sourceInstance.get(sourceKey);
            attributes[foreignIdentifier] = unassociatedObject.get(targetKey);
            Object.assign(attributes, association.through.scope);
            return attributes;
          });
          promises.push(association.through.model.bulkCreate(bulk, Object.assign({
            validate: true
          }, options)));
        }

        for (const assoc of changedAssociations) {
          let throughAttributes = assoc[association.through.model.name];

          const attributes = _.defaults({}, throughAttributes, defaultAttributes); // Quick-fix for subtle bug when using existing objects that might have the through model attached (not as an attribute object)


          if (throughAttributes instanceof association.through.model) {
            throughAttributes = {};
          }

          const where = {
            [identifier]: sourceInstance.get(sourceKey),
            [foreignIdentifier]: assoc.get(targetKey)
          };
          promises.push(association.through.model.update(attributes, Object.assign(options, {
            where
          })));
        }

        return Utils.Promise.all(promises);
      };

      return association.through.model.findAll(_.defaults({
        where,
        raw: true
      }, options)).then(currentRows => updateAssociations(currentRows)).then(([associations]) => associations).catch(error => {
        if (error instanceof EmptyResultError) return updateAssociations();
        throw error;
      });
    }
    /**
     * Un-associate one or more instance(s).
     *
     * @param {Model} sourceInstance instance to un associate instances with
     * @param {Model|Model[]|string|string[]|number|number[]} [oldAssociatedObjects] Can be an Instance or its primary key, or a mixed array of instances and primary keys
     * @param {Object} [options] Options passed to `through.destroy`
     *
     * @returns {Promise}
     */

  }, {
    key: "remove",
    value: function remove(sourceInstance, oldAssociatedObjects, options) {
      const association = this;
      options = options || {};
      oldAssociatedObjects = association.toInstanceArray(oldAssociatedObjects);
      const where = {
        [association.identifier]: sourceInstance.get(association.sourceKey),
        [association.foreignIdentifier]: oldAssociatedObjects.map(newInstance => newInstance.get(association.targetKey))
      };
      return association.through.model.destroy(_.defaults({
        where
      }, options));
    }
    /**
     * Create a new instance of the associated model and associate it with this.
     *
     * @param {Model} sourceInstance source instance
     * @param {Object} [values] values for target model
     * @param {Object} [options] Options passed to create and add
     * @param {Object} [options.through] Additional attributes for the join table
     *
     * @returns {Promise}
     */

  }, {
    key: "create",
    value: function create(sourceInstance, values, options) {
      const association = this;
      options = options || {};
      values = values || {};

      if (Array.isArray(options)) {
        options = {
          fields: options
        };
      }

      if (association.scope) {
        Object.assign(values, association.scope);

        if (options.fields) {
          options.fields = options.fields.concat(Object.keys(association.scope));
        }
      } // Create the related model instance


      return association.target.create(values, options).then(newAssociatedObject => sourceInstance[association.accessors.add](newAssociatedObject, _.omit(options, ['fields'])).return(newAssociatedObject));
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

  return BelongsToMany;
}(Association);

module.exports = BelongsToMany;
module.exports.BelongsToMany = BelongsToMany;
module.exports.default = BelongsToMany;