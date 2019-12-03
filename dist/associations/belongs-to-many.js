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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvYmVsb25ncy10by1tYW55LmpzIl0sIm5hbWVzIjpbIlV0aWxzIiwicmVxdWlyZSIsIkhlbHBlcnMiLCJfIiwiQXNzb2NpYXRpb24iLCJCZWxvbmdzVG8iLCJIYXNNYW55IiwiSGFzT25lIiwiQXNzb2NpYXRpb25FcnJvciIsIkVtcHR5UmVzdWx0RXJyb3IiLCJPcCIsIkJlbG9uZ3NUb01hbnkiLCJzb3VyY2UiLCJ0YXJnZXQiLCJvcHRpb25zIiwidGhyb3VnaCIsInVuZGVmaW5lZCIsIm5hbWUiLCJtb2RlbCIsImFzc29jaWF0aW9uVHlwZSIsInRhcmdldEFzc29jaWF0aW9uIiwic2VxdWVsaXplIiwiT2JqZWN0IiwiYXNzaWduIiwiaXNNdWx0aUFzc29jaWF0aW9uIiwiZG91YmxlTGlua2VkIiwiYXMiLCJpc1NlbGZBc3NvY2lhdGlvbiIsImlzQWxpYXNlZCIsImlzUGxhaW5PYmplY3QiLCJwbHVyYWwiLCJzaW5ndWxhciIsInNpbmd1bGFyaXplIiwiY29tYmluZWRUYWJsZU5hbWUiLCJjb21iaW5lVGFibGVOYW1lcyIsInRhYmxlTmFtZSIsImVhY2giLCJhc3NvY2lhdGlvbnMiLCJhc3NvY2lhdGlvbiIsInBhaXJlZCIsInNvdXJjZUtleSIsInByaW1hcnlLZXlBdHRyaWJ1dGUiLCJzb3VyY2VLZXlGaWVsZCIsInJhd0F0dHJpYnV0ZXMiLCJmaWVsZCIsInRhcmdldEtleSIsInRhcmdldEtleUZpZWxkIiwidGFyZ2V0S2V5RGVmYXVsdCIsIl9jcmVhdGVGb3JlaWduQW5kT3RoZXJLZXlzIiwiaXNEZWZpbmVkIiwiZGVmaW5lIiwiaW5kZXhlcyIsInBhcmFub2lkIiwidmFsaWRhdGUiLCJwaWNrIiwibmVlZEluamVjdFBhaXJlZCIsIm90aGVyS2V5Iiwib3RoZXJLZXlEZWZhdWx0IiwiZm9yZWlnbktleSIsIl9pbmplY3RBdHRyaWJ1dGVzIiwidGhyb3VnaE1vZGVsIiwiY29tYmluZWROYW1lIiwiYXNzb2NpYXRpb25BY2Nlc3NvciIsInVwcGVyRmlyc3QiLCJhY2Nlc3NvcnMiLCJnZXQiLCJzZXQiLCJhZGRNdWx0aXBsZSIsImFkZCIsImNyZWF0ZSIsInJlbW92ZSIsInJlbW92ZU11bHRpcGxlIiwiaGFzU2luZ2xlIiwiaGFzQWxsIiwiY291bnQiLCJpc09iamVjdCIsImZvcmVpZ25LZXlBdHRyaWJ1dGUiLCJmaWVsZE5hbWUiLCJjYW1lbGl6ZSIsImpvaW4iLCJvdGhlcktleUF0dHJpYnV0ZSIsImlkZW50aWZpZXIiLCJmb3JlaWduSWRlbnRpZmllciIsImF0dHJpYnV0ZSIsImF0dHJpYnV0ZU5hbWUiLCJwcmltYXJ5S2V5IiwiX2F1dG9HZW5lcmF0ZWQiLCJwcmltYXJ5S2V5RGVsZXRlZCIsInNvdXJjZUtleVR5cGUiLCJ0eXBlIiwidGFyZ2V0S2V5VHlwZSIsInNvdXJjZUF0dHJpYnV0ZSIsImRlZmF1bHRzIiwidGFyZ2V0QXR0cmlidXRlIiwidW5pcXVlIiwidW5pcXVlS2V5IiwiY29uc3RyYWludHMiLCJyZWZlcmVuY2VzIiwiZ2V0VGFibGVOYW1lIiwia2V5Iiwib25EZWxldGUiLCJvblVwZGF0ZSIsInJlZnJlc2hBdHRyaWJ1dGVzIiwiaWRlbnRpZmllckZpZWxkIiwiZm9yZWlnbklkZW50aWZpZXJGaWVsZCIsInRvU291cmNlIiwibWFueUZyb21Tb3VyY2UiLCJvbmVGcm9tU291cmNlIiwidG9UYXJnZXQiLCJtYW55RnJvbVRhcmdldCIsIm9uZUZyb21UYXJnZXQiLCJjaGVja05hbWluZ0NvbGxpc2lvbiIsIm9iaiIsIm1ldGhvZHMiLCJhbGlhc2VzIiwibWl4aW5NZXRob2RzIiwiaW5zdGFuY2UiLCJjbG9uZURlZXAiLCJzY29wZVdoZXJlIiwidGhyb3VnaFdoZXJlIiwic2NvcGUiLCJjbG9uZSIsIndoZXJlIiwiYW5kIiwiaW5jbHVkZSIsInB1c2giLCJhdHRyaWJ1dGVzIiwiam9pblRhYmxlQXR0cmlidXRlcyIsInJlcXVpcmVkIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwidW5zY29wZWQiLCJzY2hlbWEiLCJzY2hlbWFEZWxpbWl0ZXIiLCJmaW5kQWxsIiwiZm4iLCJjb2wiLCJyYXciLCJwbGFpbiIsInRoZW4iLCJyZXN1bHQiLCJwYXJzZUludCIsInNvdXJjZUluc3RhbmNlIiwiaW5zdGFuY2VzIiwiQXJyYXkiLCJpc0FycmF5IiwiaW5zdGFuY2VQcmltYXJ5S2V5cyIsIm1hcCIsIm9yIiwiYXNzb2NpYXRlZE9iamVjdHMiLCJkaWZmZXJlbmNlV2l0aCIsImEiLCJiIiwiaXNFcXVhbCIsImxlbmd0aCIsIm5ld0Fzc29jaWF0ZWRPYmplY3RzIiwidG9JbnN0YW5jZUFycmF5IiwidXBkYXRlQXNzb2NpYXRpb25zIiwiY3VycmVudFJvd3MiLCJvYnNvbGV0ZUFzc29jaWF0aW9ucyIsInByb21pc2VzIiwiZGVmYXVsdEF0dHJpYnV0ZXMiLCJ1bmFzc29jaWF0ZWRPYmplY3RzIiwiZmlsdGVyIiwic29tZSIsImN1cnJlbnRSb3ciLCJuZXdPYmoiLCJmaW5kIiwidGhyb3VnaEF0dHJpYnV0ZXMiLCJrZXlzIiwidXBkYXRlIiwib2Jzb2xldGVBc3NvY2lhdGlvbiIsImRlc3Ryb3kiLCJidWxrIiwidW5hc3NvY2lhdGVkT2JqZWN0IiwiYnVsa0NyZWF0ZSIsIlByb21pc2UiLCJhbGwiLCJjYXRjaCIsImVycm9yIiwibmV3SW5zdGFuY2VzIiwicmVzb2x2ZSIsIm5ld0luc3RhbmNlIiwiY2hhbmdlZEFzc29jaWF0aW9ucyIsImV4aXN0aW5nQXNzb2NpYXRpb24iLCJjdXJyZW50IiwiYXNzb2MiLCJvbGRBc3NvY2lhdGVkT2JqZWN0cyIsInZhbHVlcyIsImZpZWxkcyIsImNvbmNhdCIsIm5ld0Fzc29jaWF0ZWRPYmplY3QiLCJvbWl0IiwicmV0dXJuIiwiYWxpYXMiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLEtBQUssR0FBR0MsT0FBTyxDQUFDLFlBQUQsQ0FBckI7O0FBQ0EsTUFBTUMsT0FB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QSxLQUFQLEtBQWlCLFFBQXJCLEVBQStCO0FBQzdCLGVBQU8sS0FBS3pLLEVBQUwsS0FBWXlLLEtBQW5CO0FBQ0Q7O0FBRUQsVUFBSUEsS0FBSyxJQUFJQSxLQUFLLENBQUNySyxNQUFuQixFQUEyQjtBQUN6QixlQUFPLEtBQUtKLEVBQUwsS0FBWXlLLEtBQUssQ0FBQ3JLLE1BQXpCO0FBQ0Q7O0FBRUQsYUFBTyxDQUFDLEtBQUtGLFNBQWI7QUFDRDs7OztFQW52QnlCeEIsVzs7QUFzdkI1QmdNLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjFMLGFBQWpCO0FBQ0F5TCxNQUFNLENBQUNDLE9BQVAsQ0FBZTFMLGFBQWYsR0FBK0JBLGFBQS9CO0FBQ0F5TCxNQUFNLENBQUNDLE9BQVAsQ0FBZUMsT0FBZixHQUF5QjNMLGFBQXpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuLy4uL3V0aWxzJyk7XHJcbmNvbnN0IEhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcclxuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5jb25zdCBBc3NvY2lhdGlvbiA9IHJlcXVpcmUoJy4vYmFzZScpO1xyXG5jb25zdCBCZWxvbmdzVG8gPSByZXF1aXJlKCcuL2JlbG9uZ3MtdG8nKTtcclxuY29uc3QgSGFzTWFueSA9IHJlcXVpcmUoJy4vaGFzLW1hbnknKTtcclxuY29uc3QgSGFzT25lID0gcmVxdWlyZSgnLi9oYXMtb25lJyk7XHJcbmNvbnN0IEFzc29jaWF0aW9uRXJyb3IgPSByZXF1aXJlKCcuLi9lcnJvcnMnKS5Bc3NvY2lhdGlvbkVycm9yO1xyXG5jb25zdCBFbXB0eVJlc3VsdEVycm9yID0gcmVxdWlyZSgnLi4vZXJyb3JzJykuRW1wdHlSZXN1bHRFcnJvcjtcclxuY29uc3QgT3AgPSByZXF1aXJlKCcuLi9vcGVyYXRvcnMnKTtcclxuXHJcbi8qKlxyXG4gKiBNYW55LXRvLW1hbnkgYXNzb2NpYXRpb24gd2l0aCBhIGpvaW4gdGFibGUuXHJcbiAqXHJcbiAqIFdoZW4gdGhlIGpvaW4gdGFibGUgaGFzIGFkZGl0aW9uYWwgYXR0cmlidXRlcywgdGhlc2UgY2FuIGJlIHBhc3NlZCBpbiB0aGUgb3B0aW9ucyBvYmplY3Q6XHJcbiAqXHJcbiAqIGBgYGpzXHJcbiAqIFVzZXJQcm9qZWN0ID0gc2VxdWVsaXplLmRlZmluZSgndXNlcl9wcm9qZWN0Jywge1xyXG4gKiAgIHJvbGU6IFNlcXVlbGl6ZS5TVFJJTkdcclxuICogfSk7XHJcbiAqIFVzZXIuYmVsb25nc1RvTWFueShQcm9qZWN0LCB7IHRocm91Z2g6IFVzZXJQcm9qZWN0IH0pO1xyXG4gKiBQcm9qZWN0LmJlbG9uZ3NUb01hbnkoVXNlciwgeyB0aHJvdWdoOiBVc2VyUHJvamVjdCB9KTtcclxuICogLy8gdGhyb3VnaCBpcyByZXF1aXJlZCFcclxuICpcclxuICogdXNlci5hZGRQcm9qZWN0KHByb2plY3QsIHsgdGhyb3VnaDogeyByb2xlOiAnbWFuYWdlcicgfX0pO1xyXG4gKiBgYGBcclxuICpcclxuICogQWxsIG1ldGhvZHMgYWxsb3cgeW91IHRvIHBhc3MgZWl0aGVyIGEgcGVyc2lzdGVkIGluc3RhbmNlLCBpdHMgcHJpbWFyeSBrZXksIG9yIGEgbWl4dHVyZTpcclxuICpcclxuICogYGBganNcclxuICogUHJvamVjdC5jcmVhdGUoeyBpZDogMTEgfSkudGhlbihwcm9qZWN0ID0+IHtcclxuICogICB1c2VyLmFkZFByb2plY3RzKFtwcm9qZWN0LCAxMl0pO1xyXG4gKiB9KTtcclxuICogYGBgXHJcbiAqXHJcbiAqIElmIHlvdSB3YW50IHRvIHNldCBzZXZlcmFsIHRhcmdldCBpbnN0YW5jZXMsIGJ1dCB3aXRoIGRpZmZlcmVudCBhdHRyaWJ1dGVzIHlvdSBoYXZlIHRvIHNldCB0aGUgYXR0cmlidXRlcyBvbiB0aGUgaW5zdGFuY2UsIHVzaW5nIGEgcHJvcGVydHkgd2l0aCB0aGUgbmFtZSBvZiB0aGUgdGhyb3VnaCBtb2RlbDpcclxuICpcclxuICogYGBganNcclxuICogcDEuVXNlclByb2plY3RzID0ge1xyXG4gKiAgIHN0YXJ0ZWQ6IHRydWVcclxuICogfVxyXG4gKiB1c2VyLnNldFByb2plY3RzKFtwMSwgcDJdLCB7IHRocm91Z2g6IHsgc3RhcnRlZDogZmFsc2UgfX0pIC8vIFRoZSBkZWZhdWx0IHZhbHVlIGlzIGZhbHNlLCBidXQgcDEgb3ZlcnJpZGVzIHRoYXQuXHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBTaW1pbGFybHksIHdoZW4gZmV0Y2hpbmcgdGhyb3VnaCBhIGpvaW4gdGFibGUgd2l0aCBjdXN0b20gYXR0cmlidXRlcywgdGhlc2UgYXR0cmlidXRlcyB3aWxsIGJlIGF2YWlsYWJsZSBhcyBhbiBvYmplY3Qgd2l0aCB0aGUgbmFtZSBvZiB0aGUgdGhyb3VnaCBtb2RlbC5cclxuICogYGBganNcclxuICogdXNlci5nZXRQcm9qZWN0cygpLnRoZW4ocHJvamVjdHMgPT4ge1xyXG4gICAqICAgbGV0IHAxID0gcHJvamVjdHNbMF1cclxuICAgKiAgIHAxLlVzZXJQcm9qZWN0cy5zdGFydGVkIC8vIElzIHRoaXMgcHJvamVjdCBzdGFydGVkIHlldD9cclxuICAgKiB9KVxyXG4gKiBgYGBcclxuICpcclxuICogSW4gdGhlIEFQSSByZWZlcmVuY2UgYmVsb3csIGFkZCB0aGUgbmFtZSBvZiB0aGUgYXNzb2NpYXRpb24gdG8gdGhlIG1ldGhvZCwgZS5nLiBmb3IgYFVzZXIuYmVsb25nc1RvTWFueShQcm9qZWN0KWAgdGhlIGdldHRlciB3aWxsIGJlIGB1c2VyLmdldFByb2plY3RzKClgLlxyXG4gKlxyXG4gKiBAc2VlIHtAbGluayBNb2RlbC5iZWxvbmdzVG9NYW55fVxyXG4gKi9cclxuY2xhc3MgQmVsb25nc1RvTWFueSBleHRlbmRzIEFzc29jaWF0aW9uIHtcclxuICBjb25zdHJ1Y3Rvcihzb3VyY2UsIHRhcmdldCwgb3B0aW9ucykge1xyXG4gICAgc3VwZXIoc291cmNlLCB0YXJnZXQsIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudGhyb3VnaCA9PT0gdW5kZWZpbmVkIHx8IHRoaXMub3B0aW9ucy50aHJvdWdoID09PSB0cnVlIHx8IHRoaXMub3B0aW9ucy50aHJvdWdoID09PSBudWxsKSB7XHJcbiAgICAgIHRocm93IG5ldyBBc3NvY2lhdGlvbkVycm9yKGAke3NvdXJjZS5uYW1lfS5iZWxvbmdzVG9NYW55KCR7dGFyZ2V0Lm5hbWV9KSByZXF1aXJlcyB0aHJvdWdoIG9wdGlvbiwgcGFzcyBlaXRoZXIgYSBzdHJpbmcgb3IgYSBtb2RlbGApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5vcHRpb25zLnRocm91Z2gubW9kZWwpIHtcclxuICAgICAgdGhpcy5vcHRpb25zLnRocm91Z2ggPSB7XHJcbiAgICAgICAgbW9kZWw6IG9wdGlvbnMudGhyb3VnaFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYXNzb2NpYXRpb25UeXBlID0gJ0JlbG9uZ3NUb01hbnknO1xyXG4gICAgdGhpcy50YXJnZXRBc3NvY2lhdGlvbiA9IG51bGw7XHJcbiAgICB0aGlzLnNlcXVlbGl6ZSA9IHNvdXJjZS5zZXF1ZWxpemU7XHJcbiAgICB0aGlzLnRocm91Z2ggPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdGlvbnMudGhyb3VnaCk7XHJcbiAgICB0aGlzLmlzTXVsdGlBc3NvY2lhdGlvbiA9IHRydWU7XHJcbiAgICB0aGlzLmRvdWJsZUxpbmtlZCA9IGZhbHNlO1xyXG5cclxuICAgIGlmICghdGhpcy5hcyAmJiB0aGlzLmlzU2VsZkFzc29jaWF0aW9uKSB7XHJcbiAgICAgIHRocm93IG5ldyBBc3NvY2lhdGlvbkVycm9yKCdcXCdhc1xcJyBtdXN0IGJlIGRlZmluZWQgZm9yIG1hbnktdG8tbWFueSBzZWxmLWFzc29jaWF0aW9ucycpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmFzKSB7XHJcbiAgICAgIHRoaXMuaXNBbGlhc2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QodGhpcy5hcykpIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMubmFtZSA9IHRoaXMuYXM7XHJcbiAgICAgICAgdGhpcy5hcyA9IHRoaXMuYXMucGx1cmFsO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5uYW1lID0ge1xyXG4gICAgICAgICAgcGx1cmFsOiB0aGlzLmFzLFxyXG4gICAgICAgICAgc2luZ3VsYXI6IFV0aWxzLnNpbmd1bGFyaXplKHRoaXMuYXMpXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5hcyA9IHRoaXMudGFyZ2V0Lm9wdGlvbnMubmFtZS5wbHVyYWw7XHJcbiAgICAgIHRoaXMub3B0aW9ucy5uYW1lID0gdGhpcy50YXJnZXQub3B0aW9ucy5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY29tYmluZWRUYWJsZU5hbWUgPSBVdGlscy5jb21iaW5lVGFibGVOYW1lcyhcclxuICAgICAgdGhpcy5zb3VyY2UudGFibGVOYW1lLFxyXG4gICAgICB0aGlzLmlzU2VsZkFzc29jaWF0aW9uID8gdGhpcy5hcyB8fCB0aGlzLnRhcmdldC50YWJsZU5hbWUgOiB0aGlzLnRhcmdldC50YWJsZU5hbWVcclxuICAgICk7XHJcblxyXG4gICAgLypcclxuICAgICogSWYgc2VsZiBhc3NvY2lhdGlvbiwgdGhpcyBpcyB0aGUgdGFyZ2V0IGFzc29jaWF0aW9uIC0gVW5sZXNzIHdlIGZpbmQgYSBwYWlyaW5nIGFzc29jaWF0aW9uXHJcbiAgICAqL1xyXG4gICAgaWYgKHRoaXMuaXNTZWxmQXNzb2NpYXRpb24pIHtcclxuICAgICAgdGhpcy50YXJnZXRBc3NvY2lhdGlvbiA9IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICogRmluZCBwYWlyZWQgYXNzb2NpYXRpb24gKGlmIGV4aXN0cylcclxuICAgICovXHJcbiAgICBfLmVhY2godGhpcy50YXJnZXQuYXNzb2NpYXRpb25zLCBhc3NvY2lhdGlvbiA9PiB7XHJcbiAgICAgIGlmIChhc3NvY2lhdGlvbi5hc3NvY2lhdGlvblR5cGUgIT09ICdCZWxvbmdzVG9NYW55JykgcmV0dXJuO1xyXG4gICAgICBpZiAoYXNzb2NpYXRpb24udGFyZ2V0ICE9PSB0aGlzLnNvdXJjZSkgcmV0dXJuO1xyXG5cclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy50aHJvdWdoLm1vZGVsID09PSBhc3NvY2lhdGlvbi5vcHRpb25zLnRocm91Z2gubW9kZWwpIHtcclxuICAgICAgICB0aGlzLnBhaXJlZCA9IGFzc29jaWF0aW9uO1xyXG4gICAgICAgIGFzc29jaWF0aW9uLnBhaXJlZCA9IHRoaXM7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8qXHJcbiAgICAqIERlZmF1bHQvZ2VuZXJhdGVkIHNvdXJjZS90YXJnZXQga2V5c1xyXG4gICAgKi9cclxuICAgIHRoaXMuc291cmNlS2V5ID0gdGhpcy5vcHRpb25zLnNvdXJjZUtleSB8fCB0aGlzLnNvdXJjZS5wcmltYXJ5S2V5QXR0cmlidXRlO1xyXG4gICAgdGhpcy5zb3VyY2VLZXlGaWVsZCA9IHRoaXMuc291cmNlLnJhd0F0dHJpYnV0ZXNbdGhpcy5zb3VyY2VLZXldLmZpZWxkIHx8IHRoaXMuc291cmNlS2V5O1xyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMudGFyZ2V0S2V5KSB7XHJcbiAgICAgIHRoaXMudGFyZ2V0S2V5ID0gdGhpcy5vcHRpb25zLnRhcmdldEtleTtcclxuICAgICAgdGhpcy50YXJnZXRLZXlGaWVsZCA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy50YXJnZXRLZXldLmZpZWxkIHx8IHRoaXMudGFyZ2V0S2V5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy50YXJnZXRLZXlEZWZhdWx0ID0gdHJ1ZTtcclxuICAgICAgdGhpcy50YXJnZXRLZXkgPSB0aGlzLnRhcmdldC5wcmltYXJ5S2V5QXR0cmlidXRlO1xyXG4gICAgICB0aGlzLnRhcmdldEtleUZpZWxkID0gdGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLnRhcmdldEtleV0uZmllbGQgfHwgdGhpcy50YXJnZXRLZXk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fY3JlYXRlRm9yZWlnbkFuZE90aGVyS2V5cygpO1xyXG5cclxuICAgIGlmICh0eXBlb2YgdGhpcy50aHJvdWdoLm1vZGVsID09PSAnc3RyaW5nJykge1xyXG4gICAgICBpZiAoIXRoaXMuc2VxdWVsaXplLmlzRGVmaW5lZCh0aGlzLnRocm91Z2gubW9kZWwpKSB7XHJcbiAgICAgICAgdGhpcy50aHJvdWdoLm1vZGVsID0gdGhpcy5zZXF1ZWxpemUuZGVmaW5lKHRoaXMudGhyb3VnaC5tb2RlbCwge30sIE9iamVjdC5hc3NpZ24odGhpcy5vcHRpb25zLCB7XHJcbiAgICAgICAgICB0YWJsZU5hbWU6IHRoaXMudGhyb3VnaC5tb2RlbCxcclxuICAgICAgICAgIGluZGV4ZXM6IFtdLCAvL3dlIGRvbid0IHdhbnQgaW5kZXhlcyBoZXJlIChhcyByZWZlcmVuY2VkIGluICMyNDE2KVxyXG4gICAgICAgICAgcGFyYW5vaWQ6IGZhbHNlLCAvLyBBIHBhcmFub2lkIGpvaW4gdGFibGUgZG9lcyBub3QgbWFrZSBzZW5zZVxyXG4gICAgICAgICAgdmFsaWRhdGU6IHt9IC8vIERvbid0IHByb3BhZ2F0ZSBtb2RlbC1sZXZlbCB2YWxpZGF0aW9uc1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnRocm91Z2gubW9kZWwgPSB0aGlzLnNlcXVlbGl6ZS5tb2RlbCh0aGlzLnRocm91Z2gubW9kZWwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih0aGlzLm9wdGlvbnMsIF8ucGljayh0aGlzLnRocm91Z2gubW9kZWwub3B0aW9ucywgW1xyXG4gICAgICAndGltZXN0YW1wcycsICdjcmVhdGVkQXQnLCAndXBkYXRlZEF0JywgJ2RlbGV0ZWRBdCcsICdwYXJhbm9pZCdcclxuICAgIF0pKTtcclxuXHJcbiAgICBpZiAodGhpcy5wYWlyZWQpIHtcclxuICAgICAgbGV0IG5lZWRJbmplY3RQYWlyZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgIGlmICh0aGlzLnRhcmdldEtleURlZmF1bHQpIHtcclxuICAgICAgICB0aGlzLnRhcmdldEtleSA9IHRoaXMucGFpcmVkLnNvdXJjZUtleTtcclxuICAgICAgICB0aGlzLnRhcmdldEtleUZpZWxkID0gdGhpcy5wYWlyZWQuc291cmNlS2V5RmllbGQ7XHJcbiAgICAgICAgdGhpcy5fY3JlYXRlRm9yZWlnbkFuZE90aGVyS2V5cygpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLnBhaXJlZC50YXJnZXRLZXlEZWZhdWx0KSB7XHJcbiAgICAgICAgLy8gaW4gdGhpcyBjYXNlIHBhaXJlZC5vdGhlcktleSBkZXBlbmRzIG9uIHBhaXJlZC50YXJnZXRLZXksXHJcbiAgICAgICAgLy8gc28gY2xlYW51cCBwcmV2aW91c2x5IHdyb25nIGdlbmVyYXRlZCBvdGhlcktleVxyXG4gICAgICAgIGlmICh0aGlzLnBhaXJlZC50YXJnZXRLZXkgIT09IHRoaXMuc291cmNlS2V5KSB7XHJcbiAgICAgICAgICBkZWxldGUgdGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5wYWlyZWQub3RoZXJLZXldO1xyXG4gICAgICAgICAgdGhpcy5wYWlyZWQudGFyZ2V0S2V5ID0gdGhpcy5zb3VyY2VLZXk7XHJcbiAgICAgICAgICB0aGlzLnBhaXJlZC50YXJnZXRLZXlGaWVsZCA9IHRoaXMuc291cmNlS2V5RmllbGQ7XHJcbiAgICAgICAgICB0aGlzLnBhaXJlZC5fY3JlYXRlRm9yZWlnbkFuZE90aGVyS2V5cygpO1xyXG4gICAgICAgICAgbmVlZEluamVjdFBhaXJlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5vdGhlcktleURlZmF1bHQpIHtcclxuICAgICAgICB0aGlzLm90aGVyS2V5ID0gdGhpcy5wYWlyZWQuZm9yZWlnbktleTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5wYWlyZWQub3RoZXJLZXlEZWZhdWx0KSB7XHJcbiAgICAgICAgLy8gSWYgcGFpcmVkIG90aGVyS2V5IHdhcyBpbmZlcnJlZCB3ZSBzaG91bGQgbWFrZSBzdXJlIHRvIGNsZWFuIGl0IHVwXHJcbiAgICAgICAgLy8gYmVmb3JlIGFkZGluZyBhIG5ldyBvbmUgdGhhdCBtYXRjaGVzIHRoZSBmb3JlaWduS2V5XHJcbiAgICAgICAgaWYgKHRoaXMucGFpcmVkLm90aGVyS2V5ICE9PSB0aGlzLmZvcmVpZ25LZXkpIHtcclxuICAgICAgICAgIGRlbGV0ZSB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLnBhaXJlZC5vdGhlcktleV07XHJcbiAgICAgICAgICB0aGlzLnBhaXJlZC5vdGhlcktleSA9IHRoaXMuZm9yZWlnbktleTtcclxuICAgICAgICAgIG5lZWRJbmplY3RQYWlyZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG5lZWRJbmplY3RQYWlyZWQpIHtcclxuICAgICAgICB0aGlzLnBhaXJlZC5faW5qZWN0QXR0cmlidXRlcygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMudGhyb3VnaCkge1xyXG4gICAgICB0aGlzLnRocm91Z2hNb2RlbCA9IHRoaXMudGhyb3VnaC5tb2RlbDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm9wdGlvbnMudGFibGVOYW1lID0gdGhpcy5jb21iaW5lZE5hbWUgPSB0aGlzLnRocm91Z2gubW9kZWwgPT09IE9iamVjdCh0aGlzLnRocm91Z2gubW9kZWwpID8gdGhpcy50aHJvdWdoLm1vZGVsLnRhYmxlTmFtZSA6IHRoaXMudGhyb3VnaC5tb2RlbDtcclxuXHJcbiAgICB0aGlzLmFzc29jaWF0aW9uQWNjZXNzb3IgPSB0aGlzLmFzO1xyXG5cclxuICAgIC8vIEdldCBzaW5ndWxhciBhbmQgcGx1cmFsIG5hbWVzLCB0cnlpbmcgdG8gdXBwZXJjYXNlIHRoZSBmaXJzdCBsZXR0ZXIsIHVubGVzcyB0aGUgbW9kZWwgZm9yYmlkcyBpdFxyXG4gICAgY29uc3QgcGx1cmFsID0gXy51cHBlckZpcnN0KHRoaXMub3B0aW9ucy5uYW1lLnBsdXJhbCk7XHJcbiAgICBjb25zdCBzaW5ndWxhciA9IF8udXBwZXJGaXJzdCh0aGlzLm9wdGlvbnMubmFtZS5zaW5ndWxhcik7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NvcnMgPSB7XHJcbiAgICAgIGdldDogYGdldCR7cGx1cmFsfWAsXHJcbiAgICAgIHNldDogYHNldCR7cGx1cmFsfWAsXHJcbiAgICAgIGFkZE11bHRpcGxlOiBgYWRkJHtwbHVyYWx9YCxcclxuICAgICAgYWRkOiBgYWRkJHtzaW5ndWxhcn1gLFxyXG4gICAgICBjcmVhdGU6IGBjcmVhdGUke3Npbmd1bGFyfWAsXHJcbiAgICAgIHJlbW92ZTogYHJlbW92ZSR7c2luZ3VsYXJ9YCxcclxuICAgICAgcmVtb3ZlTXVsdGlwbGU6IGByZW1vdmUke3BsdXJhbH1gLFxyXG4gICAgICBoYXNTaW5nbGU6IGBoYXMke3Npbmd1bGFyfWAsXHJcbiAgICAgIGhhc0FsbDogYGhhcyR7cGx1cmFsfWAsXHJcbiAgICAgIGNvdW50OiBgY291bnQke3BsdXJhbH1gXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgX2NyZWF0ZUZvcmVpZ25BbmRPdGhlcktleXMoKSB7XHJcbiAgICAvKlxyXG4gICAgKiBEZWZhdWx0L2dlbmVyYXRlZCBmb3JlaWduL290aGVyIGtleXNcclxuICAgICovXHJcbiAgICBpZiAoXy5pc09iamVjdCh0aGlzLm9wdGlvbnMuZm9yZWlnbktleSkpIHtcclxuICAgICAgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlID0gdGhpcy5vcHRpb25zLmZvcmVpZ25LZXk7XHJcbiAgICAgIHRoaXMuZm9yZWlnbktleSA9IHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZS5uYW1lIHx8IHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZS5maWVsZE5hbWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmZvcmVpZ25LZXlBdHRyaWJ1dGUgPSB7fTtcclxuICAgICAgdGhpcy5mb3JlaWduS2V5ID0gdGhpcy5vcHRpb25zLmZvcmVpZ25LZXkgfHwgVXRpbHMuY2FtZWxpemUoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgdGhpcy5zb3VyY2Uub3B0aW9ucy5uYW1lLnNpbmd1bGFyLFxyXG4gICAgICAgICAgdGhpcy5zb3VyY2VLZXlcclxuICAgICAgICBdLmpvaW4oJ18nKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChfLmlzT2JqZWN0KHRoaXMub3B0aW9ucy5vdGhlcktleSkpIHtcclxuICAgICAgdGhpcy5vdGhlcktleUF0dHJpYnV0ZSA9IHRoaXMub3B0aW9ucy5vdGhlcktleTtcclxuICAgICAgdGhpcy5vdGhlcktleSA9IHRoaXMub3RoZXJLZXlBdHRyaWJ1dGUubmFtZSB8fCB0aGlzLm90aGVyS2V5QXR0cmlidXRlLmZpZWxkTmFtZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLm90aGVyS2V5KSB7XHJcbiAgICAgICAgdGhpcy5vdGhlcktleURlZmF1bHQgPSB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLm90aGVyS2V5QXR0cmlidXRlID0ge307XHJcbiAgICAgIHRoaXMub3RoZXJLZXkgPSB0aGlzLm9wdGlvbnMub3RoZXJLZXkgfHwgVXRpbHMuY2FtZWxpemUoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgdGhpcy5pc1NlbGZBc3NvY2lhdGlvbiA/IFV0aWxzLnNpbmd1bGFyaXplKHRoaXMuYXMpIDogdGhpcy50YXJnZXQub3B0aW9ucy5uYW1lLnNpbmd1bGFyLFxyXG4gICAgICAgICAgdGhpcy50YXJnZXRLZXlcclxuICAgICAgICBdLmpvaW4oJ18nKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gdGhlIGlkIGlzIGluIHRoZSB0YXJnZXQgdGFibGVcclxuICAvLyBvciBpbiBhbiBleHRyYSB0YWJsZSB3aGljaCBjb25uZWN0cyB0d28gdGFibGVzXHJcbiAgX2luamVjdEF0dHJpYnV0ZXMoKSB7XHJcbiAgICB0aGlzLmlkZW50aWZpZXIgPSB0aGlzLmZvcmVpZ25LZXk7XHJcbiAgICB0aGlzLmZvcmVpZ25JZGVudGlmaWVyID0gdGhpcy5vdGhlcktleTtcclxuXHJcbiAgICAvLyByZW1vdmUgYW55IFBLcyBwcmV2aW91c2x5IGRlZmluZWQgYnkgc2VxdWVsaXplXHJcbiAgICAvLyBidXQgaWdub3JlIGFueSBrZXlzIHRoYXQgYXJlIHBhcnQgb2YgdGhpcyBhc3NvY2lhdGlvbiAoIzU4NjUpXHJcbiAgICBfLmVhY2godGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXMsIChhdHRyaWJ1dGUsIGF0dHJpYnV0ZU5hbWUpID0+IHtcclxuICAgICAgaWYgKGF0dHJpYnV0ZS5wcmltYXJ5S2V5ID09PSB0cnVlICYmIGF0dHJpYnV0ZS5fYXV0b0dlbmVyYXRlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGlmIChhdHRyaWJ1dGVOYW1lID09PSB0aGlzLmZvcmVpZ25LZXkgfHwgYXR0cmlidXRlTmFtZSA9PT0gdGhpcy5vdGhlcktleSkge1xyXG4gICAgICAgICAgLy8gdGhpcyBrZXkgaXMgc3RpbGwgbmVlZGVkIGFzIGl0J3MgcGFydCBvZiB0aGUgYXNzb2NpYXRpb25cclxuICAgICAgICAgIC8vIHNvIGp1c3Qgc2V0IHByaW1hcnlLZXkgdG8gZmFsc2VcclxuICAgICAgICAgIGF0dHJpYnV0ZS5wcmltYXJ5S2V5ID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgZGVsZXRlIHRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnByaW1hcnlLZXlEZWxldGVkID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc291cmNlS2V5ID0gdGhpcy5zb3VyY2UucmF3QXR0cmlidXRlc1t0aGlzLnNvdXJjZUtleV07XHJcbiAgICBjb25zdCBzb3VyY2VLZXlUeXBlID0gc291cmNlS2V5LnR5cGU7XHJcbiAgICBjb25zdCBzb3VyY2VLZXlGaWVsZCA9IHRoaXMuc291cmNlS2V5RmllbGQ7XHJcbiAgICBjb25zdCB0YXJnZXRLZXkgPSB0aGlzLnRhcmdldC5yYXdBdHRyaWJ1dGVzW3RoaXMudGFyZ2V0S2V5XTtcclxuICAgIGNvbnN0IHRhcmdldEtleVR5cGUgPSB0YXJnZXRLZXkudHlwZTtcclxuICAgIGNvbnN0IHRhcmdldEtleUZpZWxkID0gdGhpcy50YXJnZXRLZXlGaWVsZDtcclxuICAgIGNvbnN0IHNvdXJjZUF0dHJpYnV0ZSA9IF8uZGVmYXVsdHMoe30sIHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZSwgeyB0eXBlOiBzb3VyY2VLZXlUeXBlIH0pO1xyXG4gICAgY29uc3QgdGFyZ2V0QXR0cmlidXRlID0gXy5kZWZhdWx0cyh7fSwgdGhpcy5vdGhlcktleUF0dHJpYnV0ZSwgeyB0eXBlOiB0YXJnZXRLZXlUeXBlIH0pO1xyXG5cclxuICAgIGlmICh0aGlzLnByaW1hcnlLZXlEZWxldGVkID09PSB0cnVlKSB7XHJcbiAgICAgIHRhcmdldEF0dHJpYnV0ZS5wcmltYXJ5S2V5ID0gc291cmNlQXR0cmlidXRlLnByaW1hcnlLZXkgPSB0cnVlO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLnRocm91Z2gudW5pcXVlICE9PSBmYWxzZSkge1xyXG4gICAgICBsZXQgdW5pcXVlS2V5O1xyXG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy51bmlxdWVLZXkgPT09ICdzdHJpbmcnICYmIHRoaXMub3B0aW9ucy51bmlxdWVLZXkgIT09ICcnKSB7XHJcbiAgICAgICAgdW5pcXVlS2V5ID0gdGhpcy5vcHRpb25zLnVuaXF1ZUtleTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB1bmlxdWVLZXkgPSBbdGhpcy50aHJvdWdoLm1vZGVsLnRhYmxlTmFtZSwgdGhpcy5mb3JlaWduS2V5LCB0aGlzLm90aGVyS2V5LCAndW5pcXVlJ10uam9pbignXycpO1xyXG4gICAgICB9XHJcbiAgICAgIHRhcmdldEF0dHJpYnV0ZS51bmlxdWUgPSBzb3VyY2VBdHRyaWJ1dGUudW5pcXVlID0gdW5pcXVlS2V5O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XSkge1xyXG4gICAgICB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldID0ge1xyXG4gICAgICAgIF9hdXRvR2VuZXJhdGVkOiB0cnVlXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLm90aGVyS2V5XSkge1xyXG4gICAgICB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLm90aGVyS2V5XSA9IHtcclxuICAgICAgICBfYXV0b0dlbmVyYXRlZDogdHJ1ZVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29uc3RyYWludHMgIT09IGZhbHNlKSB7XHJcbiAgICAgIHNvdXJjZUF0dHJpYnV0ZS5yZWZlcmVuY2VzID0ge1xyXG4gICAgICAgIG1vZGVsOiB0aGlzLnNvdXJjZS5nZXRUYWJsZU5hbWUoKSxcclxuICAgICAgICBrZXk6IHNvdXJjZUtleUZpZWxkXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEZvciB0aGUgc291cmNlIGF0dHJpYnV0ZSB0aGUgcGFzc2VkIG9wdGlvbiBpcyB0aGUgcHJpb3JpdHlcclxuICAgICAgc291cmNlQXR0cmlidXRlLm9uRGVsZXRlID0gdGhpcy5vcHRpb25zLm9uRGVsZXRlIHx8IHRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0ub25EZWxldGU7XHJcbiAgICAgIHNvdXJjZUF0dHJpYnV0ZS5vblVwZGF0ZSA9IHRoaXMub3B0aW9ucy5vblVwZGF0ZSB8fCB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldLm9uVXBkYXRlO1xyXG5cclxuICAgICAgaWYgKCFzb3VyY2VBdHRyaWJ1dGUub25EZWxldGUpIHNvdXJjZUF0dHJpYnV0ZS5vbkRlbGV0ZSA9ICdDQVNDQURFJztcclxuICAgICAgaWYgKCFzb3VyY2VBdHRyaWJ1dGUub25VcGRhdGUpIHNvdXJjZUF0dHJpYnV0ZS5vblVwZGF0ZSA9ICdDQVNDQURFJztcclxuXHJcbiAgICAgIHRhcmdldEF0dHJpYnV0ZS5yZWZlcmVuY2VzID0ge1xyXG4gICAgICAgIG1vZGVsOiB0aGlzLnRhcmdldC5nZXRUYWJsZU5hbWUoKSxcclxuICAgICAgICBrZXk6IHRhcmdldEtleUZpZWxkXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEJ1dCB0aGUgZm9yIHRhcmdldCBhdHRyaWJ1dGUgdGhlIHByZXZpb3VzbHkgZGVmaW5lZCBvcHRpb24gaXMgdGhlIHByaW9yaXR5IChzaW5jZSBpdCBjb3VsZCd2ZSBiZWVuIHNldCBieSBhbm90aGVyIGJlbG9uZ3NUb01hbnkgY2FsbClcclxuICAgICAgdGFyZ2V0QXR0cmlidXRlLm9uRGVsZXRlID0gdGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5vdGhlcktleV0ub25EZWxldGUgfHwgdGhpcy5vcHRpb25zLm9uRGVsZXRlO1xyXG4gICAgICB0YXJnZXRBdHRyaWJ1dGUub25VcGRhdGUgPSB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLm90aGVyS2V5XS5vblVwZGF0ZSB8fCB0aGlzLm9wdGlvbnMub25VcGRhdGU7XHJcblxyXG4gICAgICBpZiAoIXRhcmdldEF0dHJpYnV0ZS5vbkRlbGV0ZSkgdGFyZ2V0QXR0cmlidXRlLm9uRGVsZXRlID0gJ0NBU0NBREUnO1xyXG4gICAgICBpZiAoIXRhcmdldEF0dHJpYnV0ZS5vblVwZGF0ZSkgdGFyZ2V0QXR0cmlidXRlLm9uVXBkYXRlID0gJ0NBU0NBREUnO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0gPSBPYmplY3QuYXNzaWduKHRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW3RoaXMuZm9yZWlnbktleV0sIHNvdXJjZUF0dHJpYnV0ZSk7XHJcbiAgICB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLm90aGVyS2V5XSA9IE9iamVjdC5hc3NpZ24odGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5vdGhlcktleV0sIHRhcmdldEF0dHJpYnV0ZSk7XHJcblxyXG4gICAgdGhpcy50aHJvdWdoLm1vZGVsLnJlZnJlc2hBdHRyaWJ1dGVzKCk7XHJcblxyXG4gICAgdGhpcy5pZGVudGlmaWVyRmllbGQgPSB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldLmZpZWxkIHx8IHRoaXMuZm9yZWlnbktleTtcclxuICAgIHRoaXMuZm9yZWlnbklkZW50aWZpZXJGaWVsZCA9IHRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW3RoaXMub3RoZXJLZXldLmZpZWxkIHx8IHRoaXMub3RoZXJLZXk7XHJcblxyXG4gICAgaWYgKHRoaXMucGFpcmVkICYmICF0aGlzLnBhaXJlZC5mb3JlaWduSWRlbnRpZmllckZpZWxkKSB7XHJcbiAgICAgIHRoaXMucGFpcmVkLmZvcmVpZ25JZGVudGlmaWVyRmllbGQgPSB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLnBhaXJlZC5vdGhlcktleV0uZmllbGQgfHwgdGhpcy5wYWlyZWQub3RoZXJLZXk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50b1NvdXJjZSA9IG5ldyBCZWxvbmdzVG8odGhpcy50aHJvdWdoLm1vZGVsLCB0aGlzLnNvdXJjZSwge1xyXG4gICAgICBmb3JlaWduS2V5OiB0aGlzLmZvcmVpZ25LZXlcclxuICAgIH0pO1xyXG4gICAgdGhpcy5tYW55RnJvbVNvdXJjZSA9IG5ldyBIYXNNYW55KHRoaXMuc291cmNlLCB0aGlzLnRocm91Z2gubW9kZWwsIHtcclxuICAgICAgZm9yZWlnbktleTogdGhpcy5mb3JlaWduS2V5XHJcbiAgICB9KTtcclxuICAgIHRoaXMub25lRnJvbVNvdXJjZSA9IG5ldyBIYXNPbmUodGhpcy5zb3VyY2UsIHRoaXMudGhyb3VnaC5tb2RlbCwge1xyXG4gICAgICBmb3JlaWduS2V5OiB0aGlzLmZvcmVpZ25LZXksXHJcbiAgICAgIGFzOiB0aGlzLnRocm91Z2gubW9kZWwubmFtZVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy50b1RhcmdldCA9IG5ldyBCZWxvbmdzVG8odGhpcy50aHJvdWdoLm1vZGVsLCB0aGlzLnRhcmdldCwge1xyXG4gICAgICBmb3JlaWduS2V5OiB0aGlzLm90aGVyS2V5XHJcbiAgICB9KTtcclxuICAgIHRoaXMubWFueUZyb21UYXJnZXQgPSBuZXcgSGFzTWFueSh0aGlzLnRhcmdldCwgdGhpcy50aHJvdWdoLm1vZGVsLCB7XHJcbiAgICAgIGZvcmVpZ25LZXk6IHRoaXMub3RoZXJLZXlcclxuICAgIH0pO1xyXG4gICAgdGhpcy5vbmVGcm9tVGFyZ2V0ID0gbmV3IEhhc09uZSh0aGlzLnRhcmdldCwgdGhpcy50aHJvdWdoLm1vZGVsLCB7XHJcbiAgICAgIGZvcmVpZ25LZXk6IHRoaXMub3RoZXJLZXksXHJcbiAgICAgIGFzOiB0aGlzLnRocm91Z2gubW9kZWwubmFtZVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHRoaXMucGFpcmVkICYmIHRoaXMucGFpcmVkLm90aGVyS2V5RGVmYXVsdCkge1xyXG4gICAgICB0aGlzLnBhaXJlZC50b1RhcmdldCA9IG5ldyBCZWxvbmdzVG8odGhpcy5wYWlyZWQudGhyb3VnaC5tb2RlbCwgdGhpcy5wYWlyZWQudGFyZ2V0LCB7XHJcbiAgICAgICAgZm9yZWlnbktleTogdGhpcy5wYWlyZWQub3RoZXJLZXlcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0aGlzLnBhaXJlZC5vbmVGcm9tVGFyZ2V0ID0gbmV3IEhhc09uZSh0aGlzLnBhaXJlZC50YXJnZXQsIHRoaXMucGFpcmVkLnRocm91Z2gubW9kZWwsIHtcclxuICAgICAgICBmb3JlaWduS2V5OiB0aGlzLnBhaXJlZC5vdGhlcktleSxcclxuICAgICAgICBhczogdGhpcy5wYWlyZWQudGhyb3VnaC5tb2RlbC5uYW1lXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIEhlbHBlcnMuY2hlY2tOYW1pbmdDb2xsaXNpb24odGhpcyk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBtaXhpbihvYmopIHtcclxuICAgIGNvbnN0IG1ldGhvZHMgPSBbJ2dldCcsICdjb3VudCcsICdoYXNTaW5nbGUnLCAnaGFzQWxsJywgJ3NldCcsICdhZGQnLCAnYWRkTXVsdGlwbGUnLCAncmVtb3ZlJywgJ3JlbW92ZU11bHRpcGxlJywgJ2NyZWF0ZSddO1xyXG4gICAgY29uc3QgYWxpYXNlcyA9IHtcclxuICAgICAgaGFzU2luZ2xlOiAnaGFzJyxcclxuICAgICAgaGFzQWxsOiAnaGFzJyxcclxuICAgICAgYWRkTXVsdGlwbGU6ICdhZGQnLFxyXG4gICAgICByZW1vdmVNdWx0aXBsZTogJ3JlbW92ZSdcclxuICAgIH07XHJcblxyXG4gICAgSGVscGVycy5taXhpbk1ldGhvZHModGhpcywgb2JqLCBtZXRob2RzLCBhbGlhc2VzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBldmVyeXRoaW5nIGN1cnJlbnRseSBhc3NvY2lhdGVkIHdpdGggdGhpcywgdXNpbmcgYW4gb3B0aW9uYWwgd2hlcmUgY2xhdXNlLlxyXG4gICAqXHJcbiAgICogQHNlZVxyXG4gICAqIHtAbGluayBNb2RlbH0gZm9yIGEgZnVsbCBleHBsYW5hdGlvbiBvZiBvcHRpb25zXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSBpbnN0YW5jZSBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gZmluZCBvcHRpb25zXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLndoZXJlXSBBbiBvcHRpb25hbCB3aGVyZSBjbGF1c2UgdG8gbGltaXQgdGhlIGFzc29jaWF0ZWQgbW9kZWxzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8Ym9vbGVhbn0gW29wdGlvbnMuc2NvcGVdIEFwcGx5IGEgc2NvcGUgb24gdGhlIHJlbGF0ZWQgbW9kZWwsIG9yIHJlbW92ZSBpdHMgZGVmYXVsdCBzY29wZSBieSBwYXNzaW5nIGZhbHNlXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNjaGVtYV0gQXBwbHkgYSBzY2hlbWEgb24gdGhlIHJlbGF0ZWQgbW9kZWxcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5PE1vZGVsPj59XHJcbiAgICovXHJcbiAgZ2V0KGluc3RhbmNlLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gVXRpbHMuY2xvbmVEZWVwKG9wdGlvbnMpIHx8IHt9O1xyXG5cclxuICAgIGNvbnN0IHRocm91Z2ggPSB0aGlzLnRocm91Z2g7XHJcbiAgICBsZXQgc2NvcGVXaGVyZTtcclxuICAgIGxldCB0aHJvdWdoV2hlcmU7XHJcblxyXG4gICAgaWYgKHRoaXMuc2NvcGUpIHtcclxuICAgICAgc2NvcGVXaGVyZSA9IF8uY2xvbmUodGhpcy5zY29wZSk7XHJcbiAgICB9XHJcblxyXG4gICAgb3B0aW9ucy53aGVyZSA9IHtcclxuICAgICAgW09wLmFuZF06IFtcclxuICAgICAgICBzY29wZVdoZXJlLFxyXG4gICAgICAgIG9wdGlvbnMud2hlcmVcclxuICAgICAgXVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoT2JqZWN0KHRocm91Z2gubW9kZWwpID09PSB0aHJvdWdoLm1vZGVsKSB7XHJcbiAgICAgIHRocm91Z2hXaGVyZSA9IHt9O1xyXG4gICAgICB0aHJvdWdoV2hlcmVbdGhpcy5mb3JlaWduS2V5XSA9IGluc3RhbmNlLmdldCh0aGlzLnNvdXJjZUtleSk7XHJcblxyXG4gICAgICBpZiAodGhyb3VnaC5zY29wZSkge1xyXG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhyb3VnaFdoZXJlLCB0aHJvdWdoLnNjb3BlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9JZiBhIHVzZXIgcGFzcyBhIHdoZXJlIG9uIHRoZSBvcHRpb25zIHRocm91Z2ggb3B0aW9ucywgbWFrZSBhbiBcImFuZFwiIHdpdGggdGhlIGN1cnJlbnQgdGhyb3VnaFdoZXJlXHJcbiAgICAgIGlmIChvcHRpb25zLnRocm91Z2ggJiYgb3B0aW9ucy50aHJvdWdoLndoZXJlKSB7XHJcbiAgICAgICAgdGhyb3VnaFdoZXJlID0ge1xyXG4gICAgICAgICAgW09wLmFuZF06IFt0aHJvdWdoV2hlcmUsIG9wdGlvbnMudGhyb3VnaC53aGVyZV1cclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBvcHRpb25zLmluY2x1ZGUgPSBvcHRpb25zLmluY2x1ZGUgfHwgW107XHJcbiAgICAgIG9wdGlvbnMuaW5jbHVkZS5wdXNoKHtcclxuICAgICAgICBhc3NvY2lhdGlvbjogdGhpcy5vbmVGcm9tVGFyZ2V0LFxyXG4gICAgICAgIGF0dHJpYnV0ZXM6IG9wdGlvbnMuam9pblRhYmxlQXR0cmlidXRlcyxcclxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICB3aGVyZTogdGhyb3VnaFdoZXJlXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBtb2RlbCA9IHRoaXMudGFyZ2V0O1xyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCAnc2NvcGUnKSkge1xyXG4gICAgICBpZiAoIW9wdGlvbnMuc2NvcGUpIHtcclxuICAgICAgICBtb2RlbCA9IG1vZGVsLnVuc2NvcGVkKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbW9kZWwgPSBtb2RlbC5zY29wZShvcHRpb25zLnNjb3BlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgJ3NjaGVtYScpKSB7XHJcbiAgICAgIG1vZGVsID0gbW9kZWwuc2NoZW1hKG9wdGlvbnMuc2NoZW1hLCBvcHRpb25zLnNjaGVtYURlbGltaXRlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1vZGVsLmZpbmRBbGwob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb3VudCBldmVyeXRoaW5nIGN1cnJlbnRseSBhc3NvY2lhdGVkIHdpdGggdGhpcywgdXNpbmcgYW4gb3B0aW9uYWwgd2hlcmUgY2xhdXNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtNb2RlbH0gaW5zdGFuY2UgaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIGZpbmQgb3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy53aGVyZV0gQW4gb3B0aW9uYWwgd2hlcmUgY2xhdXNlIHRvIGxpbWl0IHRoZSBhc3NvY2lhdGVkIG1vZGVsc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLnNjb3BlXSBBcHBseSBhIHNjb3BlIG9uIHRoZSByZWxhdGVkIG1vZGVsLCBvciByZW1vdmUgaXRzIGRlZmF1bHQgc2NvcGUgYnkgcGFzc2luZyBmYWxzZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8bnVtYmVyPn1cclxuICAgKi9cclxuICBjb3VudChpbnN0YW5jZSwgb3B0aW9ucykge1xyXG4gICAgY29uc3Qgc2VxdWVsaXplID0gdGhpcy50YXJnZXQuc2VxdWVsaXplO1xyXG5cclxuICAgIG9wdGlvbnMgPSBVdGlscy5jbG9uZURlZXAob3B0aW9ucyk7XHJcbiAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBbXHJcbiAgICAgIFtzZXF1ZWxpemUuZm4oJ0NPVU5UJywgc2VxdWVsaXplLmNvbChbdGhpcy50YXJnZXQubmFtZSwgdGhpcy50YXJnZXRLZXlGaWVsZF0uam9pbignLicpKSksICdjb3VudCddXHJcbiAgICBdO1xyXG4gICAgb3B0aW9ucy5qb2luVGFibGVBdHRyaWJ1dGVzID0gW107XHJcbiAgICBvcHRpb25zLnJhdyA9IHRydWU7XHJcbiAgICBvcHRpb25zLnBsYWluID0gdHJ1ZTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5nZXQoaW5zdGFuY2UsIG9wdGlvbnMpLnRoZW4ocmVzdWx0ID0+IHBhcnNlSW50KHJlc3VsdC5jb3VudCwgMTApKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrIGlmIG9uZSBvciBtb3JlIGluc3RhbmNlKHMpIGFyZSBhc3NvY2lhdGVkIHdpdGggdGhpcy4gSWYgYSBsaXN0IG9mIGluc3RhbmNlcyBpcyBwYXNzZWQsIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgaWYgX2FsbF8gaW5zdGFuY2VzIGFyZSBhc3NvY2lhdGVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSBzb3VyY2UgaW5zdGFuY2UgdG8gY2hlY2sgZm9yIGFuIGFzc29jaWF0aW9uIHdpdGhcclxuICAgKiBAcGFyYW0ge01vZGVsfE1vZGVsW118c3RyaW5nW118c3RyaW5nfG51bWJlcltdfG51bWJlcn0gW2luc3RhbmNlc10gQ2FuIGJlIGFuIGFycmF5IG9mIGluc3RhbmNlcyBvciB0aGVpciBwcmltYXJ5IGtleXNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGdldEFzc29jaWF0aW9uc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59XHJcbiAgICovXHJcbiAgaGFzKHNvdXJjZUluc3RhbmNlLCBpbnN0YW5jZXMsIG9wdGlvbnMpIHtcclxuICAgIGlmICghQXJyYXkuaXNBcnJheShpbnN0YW5jZXMpKSB7XHJcbiAgICAgIGluc3RhbmNlcyA9IFtpbnN0YW5jZXNdO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcclxuICAgICAgcmF3OiB0cnVlXHJcbiAgICB9LCBvcHRpb25zLCB7XHJcbiAgICAgIHNjb3BlOiBmYWxzZSxcclxuICAgICAgYXR0cmlidXRlczogW3RoaXMudGFyZ2V0S2V5XSxcclxuICAgICAgam9pblRhYmxlQXR0cmlidXRlczogW11cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGluc3RhbmNlUHJpbWFyeUtleXMgPSBpbnN0YW5jZXMubWFwKGluc3RhbmNlID0+IHtcclxuICAgICAgaWYgKGluc3RhbmNlIGluc3RhbmNlb2YgdGhpcy50YXJnZXQpIHtcclxuICAgICAgICByZXR1cm4gaW5zdGFuY2Uud2hlcmUoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIFt0aGlzLnRhcmdldEtleV06IGluc3RhbmNlXHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuXHJcbiAgICBvcHRpb25zLndoZXJlID0ge1xyXG4gICAgICBbT3AuYW5kXTogW1xyXG4gICAgICAgIHsgW09wLm9yXTogaW5zdGFuY2VQcmltYXJ5S2V5cyB9LFxyXG4gICAgICAgIG9wdGlvbnMud2hlcmVcclxuICAgICAgXVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5nZXQoc291cmNlSW5zdGFuY2UsIG9wdGlvbnMpLnRoZW4oYXNzb2NpYXRlZE9iamVjdHMgPT5cclxuICAgICAgXy5kaWZmZXJlbmNlV2l0aChpbnN0YW5jZVByaW1hcnlLZXlzLCBhc3NvY2lhdGVkT2JqZWN0cyxcclxuICAgICAgICAoYSwgYikgPT4gXy5pc0VxdWFsKGFbdGhpcy50YXJnZXRLZXldLCBiW3RoaXMudGFyZ2V0S2V5XSkpLmxlbmd0aCA9PT0gMFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgYXNzb2NpYXRlZCBtb2RlbHMgYnkgcGFzc2luZyBhbiBhcnJheSBvZiBpbnN0YW5jZXMgb3IgdGhlaXIgcHJpbWFyeSBrZXlzLlxyXG4gICAqIEV2ZXJ5dGhpbmcgdGhhdCBpdCBub3QgaW4gdGhlIHBhc3NlZCBhcnJheSB3aWxsIGJlIHVuLWFzc29jaWF0ZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSBzb3VyY2UgaW5zdGFuY2UgdG8gYXNzb2NpYXRlIG5ldyBpbnN0YW5jZXMgd2l0aFxyXG4gICAqIEBwYXJhbSB7TW9kZWx8TW9kZWxbXXxzdHJpbmdbXXxzdHJpbmd8bnVtYmVyW118bnVtYmVyfSBbbmV3QXNzb2NpYXRlZE9iamVjdHNdIEEgc2luZ2xlIGluc3RhbmNlIG9yIHByaW1hcnkga2V5LCBvciBhIG1peGVkIGFycmF5IG9mIHBlcnNpc3RlZCBpbnN0YW5jZXMgb3IgcHJpbWFyeSBrZXlzXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGhyb3VnaC5maW5kQWxsYCwgYGJ1bGtDcmVhdGVgLCBgdXBkYXRlYCBhbmQgYGRlc3Ryb3lgXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnZhbGlkYXRlXSBSdW4gdmFsaWRhdGlvbiBmb3IgdGhlIGpvaW4gbW9kZWxcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMudGhyb3VnaF0gQWRkaXRpb25hbCBhdHRyaWJ1dGVzIGZvciB0aGUgam9pbiB0YWJsZS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIHNldChzb3VyY2VJbnN0YW5jZSwgbmV3QXNzb2NpYXRlZE9iamVjdHMsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIGNvbnN0IHNvdXJjZUtleSA9IHRoaXMuc291cmNlS2V5O1xyXG4gICAgY29uc3QgdGFyZ2V0S2V5ID0gdGhpcy50YXJnZXRLZXk7XHJcbiAgICBjb25zdCBpZGVudGlmaWVyID0gdGhpcy5pZGVudGlmaWVyO1xyXG4gICAgY29uc3QgZm9yZWlnbklkZW50aWZpZXIgPSB0aGlzLmZvcmVpZ25JZGVudGlmaWVyO1xyXG4gICAgbGV0IHdoZXJlID0ge307XHJcblxyXG4gICAgaWYgKG5ld0Fzc29jaWF0ZWRPYmplY3RzID09PSBudWxsKSB7XHJcbiAgICAgIG5ld0Fzc29jaWF0ZWRPYmplY3RzID0gW107XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBuZXdBc3NvY2lhdGVkT2JqZWN0cyA9IHRoaXMudG9JbnN0YW5jZUFycmF5KG5ld0Fzc29jaWF0ZWRPYmplY3RzKTtcclxuICAgIH1cclxuXHJcbiAgICB3aGVyZVtpZGVudGlmaWVyXSA9IHNvdXJjZUluc3RhbmNlLmdldChzb3VyY2VLZXkpO1xyXG4gICAgd2hlcmUgPSBPYmplY3QuYXNzaWduKHdoZXJlLCB0aGlzLnRocm91Z2guc2NvcGUpO1xyXG5cclxuICAgIGNvbnN0IHVwZGF0ZUFzc29jaWF0aW9ucyA9IGN1cnJlbnRSb3dzID0+IHtcclxuICAgICAgY29uc3Qgb2Jzb2xldGVBc3NvY2lhdGlvbnMgPSBbXTtcclxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcclxuICAgICAgY29uc3QgZGVmYXVsdEF0dHJpYnV0ZXMgPSBvcHRpb25zLnRocm91Z2ggfHwge307XHJcblxyXG4gICAgICBjb25zdCB1bmFzc29jaWF0ZWRPYmplY3RzID0gbmV3QXNzb2NpYXRlZE9iamVjdHMuZmlsdGVyKG9iaiA9PlxyXG4gICAgICAgICFjdXJyZW50Um93cy5zb21lKGN1cnJlbnRSb3cgPT4gY3VycmVudFJvd1tmb3JlaWduSWRlbnRpZmllcl0gPT09IG9iai5nZXQodGFyZ2V0S2V5KSlcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGZvciAoY29uc3QgY3VycmVudFJvdyBvZiBjdXJyZW50Um93cykge1xyXG4gICAgICAgIGNvbnN0IG5ld09iaiA9IG5ld0Fzc29jaWF0ZWRPYmplY3RzLmZpbmQob2JqID0+IGN1cnJlbnRSb3dbZm9yZWlnbklkZW50aWZpZXJdID09PSBvYmouZ2V0KHRhcmdldEtleSkpO1xyXG5cclxuICAgICAgICBpZiAoIW5ld09iaikge1xyXG4gICAgICAgICAgb2Jzb2xldGVBc3NvY2lhdGlvbnMucHVzaChjdXJyZW50Um93KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbGV0IHRocm91Z2hBdHRyaWJ1dGVzID0gbmV3T2JqW3RoaXMudGhyb3VnaC5tb2RlbC5uYW1lXTtcclxuICAgICAgICAgIC8vIFF1aWNrLWZpeCBmb3Igc3VidGxlIGJ1ZyB3aGVuIHVzaW5nIGV4aXN0aW5nIG9iamVjdHMgdGhhdCBtaWdodCBoYXZlIHRoZSB0aHJvdWdoIG1vZGVsIGF0dGFjaGVkIChub3QgYXMgYW4gYXR0cmlidXRlIG9iamVjdClcclxuICAgICAgICAgIGlmICh0aHJvdWdoQXR0cmlidXRlcyBpbnN0YW5jZW9mIHRoaXMudGhyb3VnaC5tb2RlbCkge1xyXG4gICAgICAgICAgICB0aHJvdWdoQXR0cmlidXRlcyA9IHt9O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBfLmRlZmF1bHRzKHt9LCB0aHJvdWdoQXR0cmlidXRlcywgZGVmYXVsdEF0dHJpYnV0ZXMpO1xyXG5cclxuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChcclxuICAgICAgICAgICAgICB0aGlzLnRocm91Z2gubW9kZWwudXBkYXRlKGF0dHJpYnV0ZXMsIE9iamVjdC5hc3NpZ24ob3B0aW9ucywge1xyXG4gICAgICAgICAgICAgICAgd2hlcmU6IHtcclxuICAgICAgICAgICAgICAgICAgW2lkZW50aWZpZXJdOiBzb3VyY2VJbnN0YW5jZS5nZXQoc291cmNlS2V5KSxcclxuICAgICAgICAgICAgICAgICAgW2ZvcmVpZ25JZGVudGlmaWVyXTogbmV3T2JqLmdldCh0YXJnZXRLZXkpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob2Jzb2xldGVBc3NvY2lhdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IHdoZXJlID0gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgICAgICBbaWRlbnRpZmllcl06IHNvdXJjZUluc3RhbmNlLmdldChzb3VyY2VLZXkpLFxyXG4gICAgICAgICAgW2ZvcmVpZ25JZGVudGlmaWVyXTogb2Jzb2xldGVBc3NvY2lhdGlvbnMubWFwKG9ic29sZXRlQXNzb2NpYXRpb24gPT4gb2Jzb2xldGVBc3NvY2lhdGlvbltmb3JlaWduSWRlbnRpZmllcl0pXHJcbiAgICAgICAgfSwgdGhpcy50aHJvdWdoLnNjb3BlKTtcclxuICAgICAgICBwcm9taXNlcy5wdXNoKFxyXG4gICAgICAgICAgdGhpcy50aHJvdWdoLm1vZGVsLmRlc3Ryb3koXy5kZWZhdWx0cyh7XHJcbiAgICAgICAgICAgIHdoZXJlXHJcbiAgICAgICAgICB9LCBvcHRpb25zKSlcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodW5hc3NvY2lhdGVkT2JqZWN0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29uc3QgYnVsayA9IHVuYXNzb2NpYXRlZE9iamVjdHMubWFwKHVuYXNzb2NpYXRlZE9iamVjdCA9PiB7XHJcbiAgICAgICAgICBsZXQgYXR0cmlidXRlcyA9IHt9O1xyXG5cclxuICAgICAgICAgIGF0dHJpYnV0ZXNbaWRlbnRpZmllcl0gPSBzb3VyY2VJbnN0YW5jZS5nZXQoc291cmNlS2V5KTtcclxuICAgICAgICAgIGF0dHJpYnV0ZXNbZm9yZWlnbklkZW50aWZpZXJdID0gdW5hc3NvY2lhdGVkT2JqZWN0LmdldCh0YXJnZXRLZXkpO1xyXG5cclxuICAgICAgICAgIGF0dHJpYnV0ZXMgPSBfLmRlZmF1bHRzKGF0dHJpYnV0ZXMsIHVuYXNzb2NpYXRlZE9iamVjdFt0aGlzLnRocm91Z2gubW9kZWwubmFtZV0sIGRlZmF1bHRBdHRyaWJ1dGVzKTtcclxuXHJcbiAgICAgICAgICBPYmplY3QuYXNzaWduKGF0dHJpYnV0ZXMsIHRoaXMudGhyb3VnaC5zY29wZSk7XHJcbiAgICAgICAgICBhdHRyaWJ1dGVzID0gT2JqZWN0LmFzc2lnbihhdHRyaWJ1dGVzLCB0aGlzLnRocm91Z2guc2NvcGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMudGhyb3VnaC5tb2RlbC5idWxrQ3JlYXRlKGJ1bGssIE9iamVjdC5hc3NpZ24oeyB2YWxpZGF0ZTogdHJ1ZSB9LCBvcHRpb25zKSkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gVXRpbHMuUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy50aHJvdWdoLm1vZGVsLmZpbmRBbGwoXy5kZWZhdWx0cyh7IHdoZXJlLCByYXc6IHRydWUgfSwgb3B0aW9ucykpXHJcbiAgICAgIC50aGVuKGN1cnJlbnRSb3dzID0+IHVwZGF0ZUFzc29jaWF0aW9ucyhjdXJyZW50Um93cykpXHJcbiAgICAgIC5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRW1wdHlSZXN1bHRFcnJvcikgcmV0dXJuIHVwZGF0ZUFzc29jaWF0aW9ucyhbXSk7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXNzb2NpYXRlIG9uZSBvciBzZXZlcmFsIHJvd3Mgd2l0aCBzb3VyY2UgaW5zdGFuY2UuIEl0IHdpbGwgbm90IHVuLWFzc29jaWF0ZSBhbnkgYWxyZWFkeSBhc3NvY2lhdGVkIGluc3RhbmNlXHJcbiAgICogdGhhdCBtYXkgYmUgbWlzc2luZyBmcm9tIGBuZXdJbnN0YW5jZXNgLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2Ugc291cmNlIGluc3RhbmNlIHRvIGFzc29jaWF0ZSBuZXcgaW5zdGFuY2VzIHdpdGhcclxuICAgKiBAcGFyYW0ge01vZGVsfE1vZGVsW118c3RyaW5nW118c3RyaW5nfG51bWJlcltdfG51bWJlcn0gW25ld0luc3RhbmNlc10gQSBzaW5nbGUgaW5zdGFuY2Ugb3IgcHJpbWFyeSBrZXksIG9yIGEgbWl4ZWQgYXJyYXkgb2YgcGVyc2lzdGVkIGluc3RhbmNlcyBvciBwcmltYXJ5IGtleXNcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGB0aHJvdWdoLmZpbmRBbGxgLCBgYnVsa0NyZWF0ZWAgYW5kIGB1cGRhdGVgXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnZhbGlkYXRlXSBSdW4gdmFsaWRhdGlvbiBmb3IgdGhlIGpvaW4gbW9kZWwuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnRocm91Z2hdIEFkZGl0aW9uYWwgYXR0cmlidXRlcyBmb3IgdGhlIGpvaW4gdGFibGUuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBhZGQoc291cmNlSW5zdGFuY2UsIG5ld0luc3RhbmNlcywgb3B0aW9ucykge1xyXG4gICAgLy8gSWYgbmV3SW5zdGFuY2VzIGlzIG51bGwgb3IgdW5kZWZpbmVkLCBuby1vcFxyXG4gICAgaWYgKCFuZXdJbnN0YW5jZXMpIHJldHVybiBVdGlscy5Qcm9taXNlLnJlc29sdmUoKTtcclxuXHJcbiAgICBvcHRpb25zID0gXy5jbG9uZShvcHRpb25zKSB8fCB7fTtcclxuXHJcbiAgICBjb25zdCBhc3NvY2lhdGlvbiA9IHRoaXM7XHJcbiAgICBjb25zdCBzb3VyY2VLZXkgPSBhc3NvY2lhdGlvbi5zb3VyY2VLZXk7XHJcbiAgICBjb25zdCB0YXJnZXRLZXkgPSBhc3NvY2lhdGlvbi50YXJnZXRLZXk7XHJcbiAgICBjb25zdCBpZGVudGlmaWVyID0gYXNzb2NpYXRpb24uaWRlbnRpZmllcjtcclxuICAgIGNvbnN0IGZvcmVpZ25JZGVudGlmaWVyID0gYXNzb2NpYXRpb24uZm9yZWlnbklkZW50aWZpZXI7XHJcbiAgICBjb25zdCBkZWZhdWx0QXR0cmlidXRlcyA9IG9wdGlvbnMudGhyb3VnaCB8fCB7fTtcclxuXHJcbiAgICBuZXdJbnN0YW5jZXMgPSBhc3NvY2lhdGlvbi50b0luc3RhbmNlQXJyYXkobmV3SW5zdGFuY2VzKTtcclxuXHJcbiAgICBjb25zdCB3aGVyZSA9IHtcclxuICAgICAgW2lkZW50aWZpZXJdOiBzb3VyY2VJbnN0YW5jZS5nZXQoc291cmNlS2V5KSxcclxuICAgICAgW2ZvcmVpZ25JZGVudGlmaWVyXTogbmV3SW5zdGFuY2VzLm1hcChuZXdJbnN0YW5jZSA9PiBuZXdJbnN0YW5jZS5nZXQodGFyZ2V0S2V5KSlcclxuICAgIH07XHJcblxyXG4gICAgT2JqZWN0LmFzc2lnbih3aGVyZSwgYXNzb2NpYXRpb24udGhyb3VnaC5zY29wZSk7XHJcblxyXG4gICAgY29uc3QgdXBkYXRlQXNzb2NpYXRpb25zID0gY3VycmVudFJvd3MgPT4ge1xyXG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xyXG4gICAgICBjb25zdCB1bmFzc29jaWF0ZWRPYmplY3RzID0gW107XHJcbiAgICAgIGNvbnN0IGNoYW5nZWRBc3NvY2lhdGlvbnMgPSBbXTtcclxuICAgICAgZm9yIChjb25zdCBvYmogb2YgbmV3SW5zdGFuY2VzKSB7XHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmdBc3NvY2lhdGlvbiA9IGN1cnJlbnRSb3dzICYmIGN1cnJlbnRSb3dzLmZpbmQoY3VycmVudCA9PiBjdXJyZW50W2ZvcmVpZ25JZGVudGlmaWVyXSA9PT0gb2JqLmdldCh0YXJnZXRLZXkpKTtcclxuXHJcbiAgICAgICAgaWYgKCFleGlzdGluZ0Fzc29jaWF0aW9uKSB7XHJcbiAgICAgICAgICB1bmFzc29jaWF0ZWRPYmplY3RzLnB1c2gob2JqKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgdGhyb3VnaEF0dHJpYnV0ZXMgPSBvYmpbYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5uYW1lXTtcclxuICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBfLmRlZmF1bHRzKHt9LCB0aHJvdWdoQXR0cmlidXRlcywgZGVmYXVsdEF0dHJpYnV0ZXMpO1xyXG5cclxuICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5zb21lKGF0dHJpYnV0ZSA9PiBhdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gIT09IGV4aXN0aW5nQXNzb2NpYXRpb25bYXR0cmlidXRlXSkpIHtcclxuICAgICAgICAgICAgY2hhbmdlZEFzc29jaWF0aW9ucy5wdXNoKG9iaik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodW5hc3NvY2lhdGVkT2JqZWN0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29uc3QgYnVsayA9IHVuYXNzb2NpYXRlZE9iamVjdHMubWFwKHVuYXNzb2NpYXRlZE9iamVjdCA9PiB7XHJcbiAgICAgICAgICBjb25zdCB0aHJvdWdoQXR0cmlidXRlcyA9IHVuYXNzb2NpYXRlZE9iamVjdFthc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLm5hbWVdO1xyXG4gICAgICAgICAgY29uc3QgYXR0cmlidXRlcyA9IF8uZGVmYXVsdHMoe30sIHRocm91Z2hBdHRyaWJ1dGVzLCBkZWZhdWx0QXR0cmlidXRlcyk7XHJcblxyXG4gICAgICAgICAgYXR0cmlidXRlc1tpZGVudGlmaWVyXSA9IHNvdXJjZUluc3RhbmNlLmdldChzb3VyY2VLZXkpO1xyXG4gICAgICAgICAgYXR0cmlidXRlc1tmb3JlaWduSWRlbnRpZmllcl0gPSB1bmFzc29jaWF0ZWRPYmplY3QuZ2V0KHRhcmdldEtleSk7XHJcblxyXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbihhdHRyaWJ1dGVzLCBhc3NvY2lhdGlvbi50aHJvdWdoLnNjb3BlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gYXR0cmlidXRlcztcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChhc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLmJ1bGtDcmVhdGUoYnVsaywgT2JqZWN0LmFzc2lnbih7IHZhbGlkYXRlOiB0cnVlIH0sIG9wdGlvbnMpKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAoY29uc3QgYXNzb2Mgb2YgY2hhbmdlZEFzc29jaWF0aW9ucykge1xyXG4gICAgICAgIGxldCB0aHJvdWdoQXR0cmlidXRlcyA9IGFzc29jW2Fzc29jaWF0aW9uLnRocm91Z2gubW9kZWwubmFtZV07XHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlcyA9IF8uZGVmYXVsdHMoe30sIHRocm91Z2hBdHRyaWJ1dGVzLCBkZWZhdWx0QXR0cmlidXRlcyk7XHJcbiAgICAgICAgLy8gUXVpY2stZml4IGZvciBzdWJ0bGUgYnVnIHdoZW4gdXNpbmcgZXhpc3Rpbmcgb2JqZWN0cyB0aGF0IG1pZ2h0IGhhdmUgdGhlIHRocm91Z2ggbW9kZWwgYXR0YWNoZWQgKG5vdCBhcyBhbiBhdHRyaWJ1dGUgb2JqZWN0KVxyXG4gICAgICAgIGlmICh0aHJvdWdoQXR0cmlidXRlcyBpbnN0YW5jZW9mIGFzc29jaWF0aW9uLnRocm91Z2gubW9kZWwpIHtcclxuICAgICAgICAgIHRocm91Z2hBdHRyaWJ1dGVzID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHdoZXJlID0ge1xyXG4gICAgICAgICAgW2lkZW50aWZpZXJdOiBzb3VyY2VJbnN0YW5jZS5nZXQoc291cmNlS2V5KSxcclxuICAgICAgICAgIFtmb3JlaWduSWRlbnRpZmllcl06IGFzc29jLmdldCh0YXJnZXRLZXkpXHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIHByb21pc2VzLnB1c2goYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC51cGRhdGUoYXR0cmlidXRlcywgT2JqZWN0LmFzc2lnbihvcHRpb25zLCB7IHdoZXJlIH0pKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBVdGlscy5Qcm9taXNlLmFsbChwcm9taXNlcyk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBhc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLmZpbmRBbGwoXy5kZWZhdWx0cyh7IHdoZXJlLCByYXc6IHRydWUgfSwgb3B0aW9ucykpXHJcbiAgICAgIC50aGVuKGN1cnJlbnRSb3dzID0+IHVwZGF0ZUFzc29jaWF0aW9ucyhjdXJyZW50Um93cykpXHJcbiAgICAgIC50aGVuKChbYXNzb2NpYXRpb25zXSkgPT4gYXNzb2NpYXRpb25zKVxyXG4gICAgICAuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVtcHR5UmVzdWx0RXJyb3IpIHJldHVybiB1cGRhdGVBc3NvY2lhdGlvbnMoKTtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVbi1hc3NvY2lhdGUgb25lIG9yIG1vcmUgaW5zdGFuY2UocykuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSBpbnN0YW5jZSB0byB1biBhc3NvY2lhdGUgaW5zdGFuY2VzIHdpdGhcclxuICAgKiBAcGFyYW0ge01vZGVsfE1vZGVsW118c3RyaW5nfHN0cmluZ1tdfG51bWJlcnxudW1iZXJbXX0gW29sZEFzc29jaWF0ZWRPYmplY3RzXSBDYW4gYmUgYW4gSW5zdGFuY2Ugb3IgaXRzIHByaW1hcnkga2V5LCBvciBhIG1peGVkIGFycmF5IG9mIGluc3RhbmNlcyBhbmQgcHJpbWFyeSBrZXlzXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGhyb3VnaC5kZXN0cm95YFxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgcmVtb3ZlKHNvdXJjZUluc3RhbmNlLCBvbGRBc3NvY2lhdGVkT2JqZWN0cywgb3B0aW9ucykge1xyXG4gICAgY29uc3QgYXNzb2NpYXRpb24gPSB0aGlzO1xyXG5cclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIG9sZEFzc29jaWF0ZWRPYmplY3RzID0gYXNzb2NpYXRpb24udG9JbnN0YW5jZUFycmF5KG9sZEFzc29jaWF0ZWRPYmplY3RzKTtcclxuXHJcbiAgICBjb25zdCB3aGVyZSA9IHtcclxuICAgICAgW2Fzc29jaWF0aW9uLmlkZW50aWZpZXJdOiBzb3VyY2VJbnN0YW5jZS5nZXQoYXNzb2NpYXRpb24uc291cmNlS2V5KSxcclxuICAgICAgW2Fzc29jaWF0aW9uLmZvcmVpZ25JZGVudGlmaWVyXTogb2xkQXNzb2NpYXRlZE9iamVjdHMubWFwKG5ld0luc3RhbmNlID0+IG5ld0luc3RhbmNlLmdldChhc3NvY2lhdGlvbi50YXJnZXRLZXkpKVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5kZXN0cm95KF8uZGVmYXVsdHMoeyB3aGVyZSB9LCBvcHRpb25zKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGFzc29jaWF0ZWQgbW9kZWwgYW5kIGFzc29jaWF0ZSBpdCB3aXRoIHRoaXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge01vZGVsfSBzb3VyY2VJbnN0YW5jZSBzb3VyY2UgaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW3ZhbHVlc10gdmFsdWVzIGZvciB0YXJnZXQgbW9kZWxcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGNyZWF0ZSBhbmQgYWRkXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnRocm91Z2hdIEFkZGl0aW9uYWwgYXR0cmlidXRlcyBmb3IgdGhlIGpvaW4gdGFibGVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAqL1xyXG4gIGNyZWF0ZShzb3VyY2VJbnN0YW5jZSwgdmFsdWVzLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCBhc3NvY2lhdGlvbiA9IHRoaXM7XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgfHwge307XHJcblxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcclxuICAgICAgb3B0aW9ucyA9IHtcclxuICAgICAgICBmaWVsZHM6IG9wdGlvbnNcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXNzb2NpYXRpb24uc2NvcGUpIHtcclxuICAgICAgT2JqZWN0LmFzc2lnbih2YWx1ZXMsIGFzc29jaWF0aW9uLnNjb3BlKTtcclxuICAgICAgaWYgKG9wdGlvbnMuZmllbGRzKSB7XHJcbiAgICAgICAgb3B0aW9ucy5maWVsZHMgPSBvcHRpb25zLmZpZWxkcy5jb25jYXQoT2JqZWN0LmtleXMoYXNzb2NpYXRpb24uc2NvcGUpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgcmVsYXRlZCBtb2RlbCBpbnN0YW5jZVxyXG4gICAgcmV0dXJuIGFzc29jaWF0aW9uLnRhcmdldC5jcmVhdGUodmFsdWVzLCBvcHRpb25zKS50aGVuKG5ld0Fzc29jaWF0ZWRPYmplY3QgPT5cclxuICAgICAgc291cmNlSW5zdGFuY2VbYXNzb2NpYXRpb24uYWNjZXNzb3JzLmFkZF0obmV3QXNzb2NpYXRlZE9iamVjdCwgXy5vbWl0KG9wdGlvbnMsIFsnZmllbGRzJ10pKS5yZXR1cm4obmV3QXNzb2NpYXRlZE9iamVjdClcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICB2ZXJpZnlBc3NvY2lhdGlvbkFsaWFzKGFsaWFzKSB7XHJcbiAgICBpZiAodHlwZW9mIGFsaWFzID09PSAnc3RyaW5nJykge1xyXG4gICAgICByZXR1cm4gdGhpcy5hcyA9PT0gYWxpYXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFsaWFzICYmIGFsaWFzLnBsdXJhbCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hcyA9PT0gYWxpYXMucGx1cmFsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAhdGhpcy5pc0FsaWFzZWQ7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJlbG9uZ3NUb01hbnk7XHJcbm1vZHVsZS5leHBvcnRzLkJlbG9uZ3NUb01hbnkgPSBCZWxvbmdzVG9NYW55O1xyXG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gQmVsb25nc1RvTWFueTtcclxuIl19