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


let BelongsToMany = /*#__PURE__*/function (_Association) {
  _inherits(BelongsToMany, _Association);

  var _super = _createSuper(BelongsToMany);

  function BelongsToMany(source, target, options) {
    var _this;

    _classCallCheck(this, BelongsToMany);

    _this = _super.call(this, source, target, options);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvYmVsb25ncy10by1tYW55LmpzIl0sIm5hbWVzIjpbIlV0aWxzIiwicmVxdWlyZSIsIkhlbHBlcnMiLCJfIiwiQXNzb2NpYXRpb24iLCJCZWxvbmdzVG8iLCJIYXNNYW55IiwiSGFzT25lIiwiQXNzb2NpYXRpb25FcnJvciIsIkVtcHR5UmVzdWx0RXJyb3IiLCJPcCIsIkJlbG9uZ3NUb01hbnkiLCJzb3VyY2UiLCJ0YXJnZXQiLCJvcHRpb25zIiwidGhyb3VnaCIsInVuZGVmaW5lZCIsIm5hbWUiLCJtb2RlbCIsImFzc29jaWF0aW9uVHlwZSIsInRhcmdldEFzc29jaWF0aW9uIiwic2VxdWVsaXplIiwiT2JqZWN0IiwiYXNzaWduIiwiaXNNdWx0aUFzc29jaWF0aW9uIiwiZG91YmxlTGlua2VkIiwiYXMiLCJpc1NlbGZBc3NvY2lhdGlvbiIsImlzQWxpYXNlZCIsImlzUGxhaW5PYmplY3QiLCJwbHVyYWwiLCJzaW5ndWxhciIsInNpbmd1bGFyaXplIiwiY29tYmluZWRUYWJsZU5hbWUiLCJjb21iaW5lVGFibGVOYW1lcyIsInRhYmxlTmFtZSIsImVhY2giLCJhc3NvY2lhdGlvbnMiLCJhc3NvY2lhdGlvbiIsInBhaXJlZCIsInNvdXJjZUtleSIsInByaW1hcnlLZXlBdHRyaWJ1dGUiLCJzb3VyY2VLZXlGaWVsZCIsInJhd0F0dHJpYnV0ZXMiLCJmaWVsZCIsInRhcmdldEtleSIsInRhcmdldEtleUZpZWxkIiwidGFyZ2V0S2V5RGVmYXVsdCIsIl9jcmVhdGVGb3JlaWduQW5kT3RoZXJLZXlzIiwiaXNEZWZpbmVkIiwiZGVmaW5lIiwiaW5kZXhlcyIsInBhcmFub2lkIiwidmFsaWRhdGUiLCJwaWNrIiwibmVlZEluamVjdFBhaXJlZCIsIm90aGVyS2V5Iiwib3RoZXJLZXlEZWZhdWx0IiwiZm9yZWlnbktleSIsIl9pbmplY3RBdHRyaWJ1dGVzIiwidGhyb3VnaE1vZGVsIiwiY29tYmluZWROYW1lIiwiYXNzb2NpYXRpb25BY2Nlc3NvciIsInVwcGVyRmlyc3QiLCJhY2Nlc3NvcnMiLCJnZXQiLCJzZXQiLCJhZGRNdWx0aXBsZSIsImFkZCIsImNyZWF0ZSIsInJlbW92ZSIsInJlbW92ZU11bHRpcGxlIiwiaGFzU2luZ2xlIiwiaGFzQWxsIiwiY291bnQiLCJpc09iamVjdCIsImZvcmVpZ25LZXlBdHRyaWJ1dGUiLCJmaWVsZE5hbWUiLCJjYW1lbGl6ZSIsImpvaW4iLCJvdGhlcktleUF0dHJpYnV0ZSIsImlkZW50aWZpZXIiLCJmb3JlaWduSWRlbnRpZmllciIsImF0dHJpYnV0ZSIsImF0dHJpYnV0ZU5hbWUiLCJwcmltYXJ5S2V5IiwiX2F1dG9HZW5lcmF0ZWQiLCJwcmltYXJ5S2V5RGVsZXRlZCIsInNvdXJjZUtleVR5cGUiLCJ0eXBlIiwidGFyZ2V0S2V5VHlwZSIsInNvdXJjZUF0dHJpYnV0ZSIsImRlZmF1bHRzIiwidGFyZ2V0QXR0cmlidXRlIiwidW5pcXVlIiwidW5pcXVlS2V5IiwiY29uc3RyYWludHMiLCJyZWZlcmVuY2VzIiwiZ2V0VGFibGVOYW1lIiwia2V5Iiwib25EZWxldGUiLCJvblVwZGF0ZSIsInJlZnJlc2hBdHRyaWJ1dGVzIiwiaWRlbnRpZmllckZpZWxkIiwiZm9yZWlnbklkZW50aWZpZXJGaWVsZCIsInRvU291cmNlIiwibWFueUZyb21Tb3VyY2UiLCJvbmVGcm9tU291cmNlIiwidG9UYXJnZXQiLCJtYW55RnJvbVRhcmdldCIsIm9uZUZyb21UYXJnZXQiLCJjaGVja05hbWluZ0NvbGxpc2lvbiIsIm9iaiIsIm1ldGhvZHMiLCJhbGlhc2VzIiwibWl4aW5NZXRob2RzIiwiaW5zdGFuY2UiLCJjbG9uZURlZXAiLCJzY29wZVdoZXJlIiwidGhyb3VnaFdoZXJlIiwic2NvcGUiLCJjbG9uZSIsIndoZXJlIiwiYW5kIiwiaW5jbHVkZSIsInB1c2giLCJhdHRyaWJ1dGVzIiwiam9pblRhYmxlQXR0cmlidXRlcyIsInJlcXVpcmVkIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwidW5zY29wZWQiLCJzY2hlbWEiLCJzY2hlbWFEZWxpbWl0ZXIiLCJmaW5kQWxsIiwiZm4iLCJjb2wiLCJyYXciLCJwbGFpbiIsInRoZW4iLCJyZXN1bHQiLCJwYXJzZUludCIsInNvdXJjZUluc3RhbmNlIiwiaW5zdGFuY2VzIiwiQXJyYXkiLCJpc0FycmF5IiwiaW5zdGFuY2VQcmltYXJ5S2V5cyIsIm1hcCIsIm9yIiwiYXNzb2NpYXRlZE9iamVjdHMiLCJkaWZmZXJlbmNlV2l0aCIsImEiLCJiIiwiaXNFcXVhbCIsImxlbmd0aCIsIm5ld0Fzc29jaWF0ZWRPYmplY3RzIiwidG9JbnN0YW5jZUFycmF5IiwidXBkYXRlQXNzb2NpYXRpb25zIiwiY3VycmVudFJvd3MiLCJvYnNvbGV0ZUFzc29jaWF0aW9ucyIsInByb21pc2VzIiwiZGVmYXVsdEF0dHJpYnV0ZXMiLCJ1bmFzc29jaWF0ZWRPYmplY3RzIiwiZmlsdGVyIiwic29tZSIsImN1cnJlbnRSb3ciLCJuZXdPYmoiLCJmaW5kIiwidGhyb3VnaEF0dHJpYnV0ZXMiLCJrZXlzIiwidXBkYXRlIiwib2Jzb2xldGVBc3NvY2lhdGlvbiIsImRlc3Ryb3kiLCJidWxrIiwidW5hc3NvY2lhdGVkT2JqZWN0IiwiYnVsa0NyZWF0ZSIsIlByb21pc2UiLCJhbGwiLCJjYXRjaCIsImVycm9yIiwibmV3SW5zdGFuY2VzIiwicmVzb2x2ZSIsIm5ld0luc3RhbmNlIiwiY2hhbmdlZEFzc29jaWF0aW9ucyIsImV4aXN0aW5nQXNzb2NpYXRpb24iLCJjdXJyZW50IiwiYXNzb2MiLCJvbGRBc3NvY2lhdGVkT2JqZWN0cyIsInZhbHVlcyIsImZpZWxkcyIsImNvbmNhdCIsIm5ld0Fzc29jaWF0ZWRPYmplY3QiLCJvbWl0IiwicmV0dXJuIiwiYWxpYXMiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxZQUFELENBQXJCOztBQUNBLE1BQU1D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L3V0aWxzJyk7XG5jb25zdCBIZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBBc3NvY2lhdGlvbiA9IHJlcXVpcmUoJy4vYmFzZScpO1xuY29uc3QgQmVsb25nc1RvID0gcmVxdWlyZSgnLi9iZWxvbmdzLXRvJyk7XG5jb25zdCBIYXNNYW55ID0gcmVxdWlyZSgnLi9oYXMtbWFueScpO1xuY29uc3QgSGFzT25lID0gcmVxdWlyZSgnLi9oYXMtb25lJyk7XG5jb25zdCBBc3NvY2lhdGlvbkVycm9yID0gcmVxdWlyZSgnLi4vZXJyb3JzJykuQXNzb2NpYXRpb25FcnJvcjtcbmNvbnN0IEVtcHR5UmVzdWx0RXJyb3IgPSByZXF1aXJlKCcuLi9lcnJvcnMnKS5FbXB0eVJlc3VsdEVycm9yO1xuY29uc3QgT3AgPSByZXF1aXJlKCcuLi9vcGVyYXRvcnMnKTtcblxuLyoqXG4gKiBNYW55LXRvLW1hbnkgYXNzb2NpYXRpb24gd2l0aCBhIGpvaW4gdGFibGUuXG4gKlxuICogV2hlbiB0aGUgam9pbiB0YWJsZSBoYXMgYWRkaXRpb25hbCBhdHRyaWJ1dGVzLCB0aGVzZSBjYW4gYmUgcGFzc2VkIGluIHRoZSBvcHRpb25zIG9iamVjdDpcbiAqXG4gKiBgYGBqc1xuICogVXNlclByb2plY3QgPSBzZXF1ZWxpemUuZGVmaW5lKCd1c2VyX3Byb2plY3QnLCB7XG4gKiAgIHJvbGU6IFNlcXVlbGl6ZS5TVFJJTkdcbiAqIH0pO1xuICogVXNlci5iZWxvbmdzVG9NYW55KFByb2plY3QsIHsgdGhyb3VnaDogVXNlclByb2plY3QgfSk7XG4gKiBQcm9qZWN0LmJlbG9uZ3NUb01hbnkoVXNlciwgeyB0aHJvdWdoOiBVc2VyUHJvamVjdCB9KTtcbiAqIC8vIHRocm91Z2ggaXMgcmVxdWlyZWQhXG4gKlxuICogdXNlci5hZGRQcm9qZWN0KHByb2plY3QsIHsgdGhyb3VnaDogeyByb2xlOiAnbWFuYWdlcicgfX0pO1xuICogYGBgXG4gKlxuICogQWxsIG1ldGhvZHMgYWxsb3cgeW91IHRvIHBhc3MgZWl0aGVyIGEgcGVyc2lzdGVkIGluc3RhbmNlLCBpdHMgcHJpbWFyeSBrZXksIG9yIGEgbWl4dHVyZTpcbiAqXG4gKiBgYGBqc1xuICogUHJvamVjdC5jcmVhdGUoeyBpZDogMTEgfSkudGhlbihwcm9qZWN0ID0+IHtcbiAqICAgdXNlci5hZGRQcm9qZWN0cyhbcHJvamVjdCwgMTJdKTtcbiAqIH0pO1xuICogYGBgXG4gKlxuICogSWYgeW91IHdhbnQgdG8gc2V0IHNldmVyYWwgdGFyZ2V0IGluc3RhbmNlcywgYnV0IHdpdGggZGlmZmVyZW50IGF0dHJpYnV0ZXMgeW91IGhhdmUgdG8gc2V0IHRoZSBhdHRyaWJ1dGVzIG9uIHRoZSBpbnN0YW5jZSwgdXNpbmcgYSBwcm9wZXJ0eSB3aXRoIHRoZSBuYW1lIG9mIHRoZSB0aHJvdWdoIG1vZGVsOlxuICpcbiAqIGBgYGpzXG4gKiBwMS5Vc2VyUHJvamVjdHMgPSB7XG4gKiAgIHN0YXJ0ZWQ6IHRydWVcbiAqIH1cbiAqIHVzZXIuc2V0UHJvamVjdHMoW3AxLCBwMl0sIHsgdGhyb3VnaDogeyBzdGFydGVkOiBmYWxzZSB9fSkgLy8gVGhlIGRlZmF1bHQgdmFsdWUgaXMgZmFsc2UsIGJ1dCBwMSBvdmVycmlkZXMgdGhhdC5cbiAqIGBgYFxuICpcbiAqIFNpbWlsYXJseSwgd2hlbiBmZXRjaGluZyB0aHJvdWdoIGEgam9pbiB0YWJsZSB3aXRoIGN1c3RvbSBhdHRyaWJ1dGVzLCB0aGVzZSBhdHRyaWJ1dGVzIHdpbGwgYmUgYXZhaWxhYmxlIGFzIGFuIG9iamVjdCB3aXRoIHRoZSBuYW1lIG9mIHRoZSB0aHJvdWdoIG1vZGVsLlxuICogYGBganNcbiAqIHVzZXIuZ2V0UHJvamVjdHMoKS50aGVuKHByb2plY3RzID0+IHtcbiAgICogICBsZXQgcDEgPSBwcm9qZWN0c1swXVxuICAgKiAgIHAxLlVzZXJQcm9qZWN0cy5zdGFydGVkIC8vIElzIHRoaXMgcHJvamVjdCBzdGFydGVkIHlldD9cbiAgICogfSlcbiAqIGBgYFxuICpcbiAqIEluIHRoZSBBUEkgcmVmZXJlbmNlIGJlbG93LCBhZGQgdGhlIG5hbWUgb2YgdGhlIGFzc29jaWF0aW9uIHRvIHRoZSBtZXRob2QsIGUuZy4gZm9yIGBVc2VyLmJlbG9uZ3NUb01hbnkoUHJvamVjdClgIHRoZSBnZXR0ZXIgd2lsbCBiZSBgdXNlci5nZXRQcm9qZWN0cygpYC5cbiAqXG4gKiBAc2VlIHtAbGluayBNb2RlbC5iZWxvbmdzVG9NYW55fVxuICovXG5jbGFzcyBCZWxvbmdzVG9NYW55IGV4dGVuZHMgQXNzb2NpYXRpb24ge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UsIHRhcmdldCwgb3B0aW9ucykge1xuICAgIHN1cGVyKHNvdXJjZSwgdGFyZ2V0LCBvcHRpb25zKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMudGhyb3VnaCA9PT0gdW5kZWZpbmVkIHx8IHRoaXMub3B0aW9ucy50aHJvdWdoID09PSB0cnVlIHx8IHRoaXMub3B0aW9ucy50aHJvdWdoID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgQXNzb2NpYXRpb25FcnJvcihgJHtzb3VyY2UubmFtZX0uYmVsb25nc1RvTWFueSgke3RhcmdldC5uYW1lfSkgcmVxdWlyZXMgdGhyb3VnaCBvcHRpb24sIHBhc3MgZWl0aGVyIGEgc3RyaW5nIG9yIGEgbW9kZWxgKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy50aHJvdWdoLm1vZGVsKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudGhyb3VnaCA9IHtcbiAgICAgICAgbW9kZWw6IG9wdGlvbnMudGhyb3VnaFxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLmFzc29jaWF0aW9uVHlwZSA9ICdCZWxvbmdzVG9NYW55JztcbiAgICB0aGlzLnRhcmdldEFzc29jaWF0aW9uID0gbnVsbDtcbiAgICB0aGlzLnNlcXVlbGl6ZSA9IHNvdXJjZS5zZXF1ZWxpemU7XG4gICAgdGhpcy50aHJvdWdoID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5vcHRpb25zLnRocm91Z2gpO1xuICAgIHRoaXMuaXNNdWx0aUFzc29jaWF0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLmRvdWJsZUxpbmtlZCA9IGZhbHNlO1xuXG4gICAgaWYgKCF0aGlzLmFzICYmIHRoaXMuaXNTZWxmQXNzb2NpYXRpb24pIHtcbiAgICAgIHRocm93IG5ldyBBc3NvY2lhdGlvbkVycm9yKCdcXCdhc1xcJyBtdXN0IGJlIGRlZmluZWQgZm9yIG1hbnktdG8tbWFueSBzZWxmLWFzc29jaWF0aW9ucycpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmFzKSB7XG4gICAgICB0aGlzLmlzQWxpYXNlZCA9IHRydWU7XG5cbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QodGhpcy5hcykpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB0aGlzLmFzO1xuICAgICAgICB0aGlzLmFzID0gdGhpcy5hcy5wbHVyYWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9wdGlvbnMubmFtZSA9IHtcbiAgICAgICAgICBwbHVyYWw6IHRoaXMuYXMsXG4gICAgICAgICAgc2luZ3VsYXI6IFV0aWxzLnNpbmd1bGFyaXplKHRoaXMuYXMpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXMgPSB0aGlzLnRhcmdldC5vcHRpb25zLm5hbWUucGx1cmFsO1xuICAgICAgdGhpcy5vcHRpb25zLm5hbWUgPSB0aGlzLnRhcmdldC5vcHRpb25zLm5hbWU7XG4gICAgfVxuXG4gICAgdGhpcy5jb21iaW5lZFRhYmxlTmFtZSA9IFV0aWxzLmNvbWJpbmVUYWJsZU5hbWVzKFxuICAgICAgdGhpcy5zb3VyY2UudGFibGVOYW1lLFxuICAgICAgdGhpcy5pc1NlbGZBc3NvY2lhdGlvbiA/IHRoaXMuYXMgfHwgdGhpcy50YXJnZXQudGFibGVOYW1lIDogdGhpcy50YXJnZXQudGFibGVOYW1lXG4gICAgKTtcblxuICAgIC8qXG4gICAgKiBJZiBzZWxmIGFzc29jaWF0aW9uLCB0aGlzIGlzIHRoZSB0YXJnZXQgYXNzb2NpYXRpb24gLSBVbmxlc3Mgd2UgZmluZCBhIHBhaXJpbmcgYXNzb2NpYXRpb25cbiAgICAqL1xuICAgIGlmICh0aGlzLmlzU2VsZkFzc29jaWF0aW9uKSB7XG4gICAgICB0aGlzLnRhcmdldEFzc29jaWF0aW9uID0gdGhpcztcbiAgICB9XG5cbiAgICAvKlxuICAgICogRmluZCBwYWlyZWQgYXNzb2NpYXRpb24gKGlmIGV4aXN0cylcbiAgICAqL1xuICAgIF8uZWFjaCh0aGlzLnRhcmdldC5hc3NvY2lhdGlvbnMsIGFzc29jaWF0aW9uID0+IHtcbiAgICAgIGlmIChhc3NvY2lhdGlvbi5hc3NvY2lhdGlvblR5cGUgIT09ICdCZWxvbmdzVG9NYW55JykgcmV0dXJuO1xuICAgICAgaWYgKGFzc29jaWF0aW9uLnRhcmdldCAhPT0gdGhpcy5zb3VyY2UpIHJldHVybjtcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy50aHJvdWdoLm1vZGVsID09PSBhc3NvY2lhdGlvbi5vcHRpb25zLnRocm91Z2gubW9kZWwpIHtcbiAgICAgICAgdGhpcy5wYWlyZWQgPSBhc3NvY2lhdGlvbjtcbiAgICAgICAgYXNzb2NpYXRpb24ucGFpcmVkID0gdGhpcztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qXG4gICAgKiBEZWZhdWx0L2dlbmVyYXRlZCBzb3VyY2UvdGFyZ2V0IGtleXNcbiAgICAqL1xuICAgIHRoaXMuc291cmNlS2V5ID0gdGhpcy5vcHRpb25zLnNvdXJjZUtleSB8fCB0aGlzLnNvdXJjZS5wcmltYXJ5S2V5QXR0cmlidXRlO1xuICAgIHRoaXMuc291cmNlS2V5RmllbGQgPSB0aGlzLnNvdXJjZS5yYXdBdHRyaWJ1dGVzW3RoaXMuc291cmNlS2V5XS5maWVsZCB8fCB0aGlzLnNvdXJjZUtleTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMudGFyZ2V0S2V5KSB7XG4gICAgICB0aGlzLnRhcmdldEtleSA9IHRoaXMub3B0aW9ucy50YXJnZXRLZXk7XG4gICAgICB0aGlzLnRhcmdldEtleUZpZWxkID0gdGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLnRhcmdldEtleV0uZmllbGQgfHwgdGhpcy50YXJnZXRLZXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudGFyZ2V0S2V5RGVmYXVsdCA9IHRydWU7XG4gICAgICB0aGlzLnRhcmdldEtleSA9IHRoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGU7XG4gICAgICB0aGlzLnRhcmdldEtleUZpZWxkID0gdGhpcy50YXJnZXQucmF3QXR0cmlidXRlc1t0aGlzLnRhcmdldEtleV0uZmllbGQgfHwgdGhpcy50YXJnZXRLZXk7XG4gICAgfVxuXG4gICAgdGhpcy5fY3JlYXRlRm9yZWlnbkFuZE90aGVyS2V5cygpO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnRocm91Z2gubW9kZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoIXRoaXMuc2VxdWVsaXplLmlzRGVmaW5lZCh0aGlzLnRocm91Z2gubW9kZWwpKSB7XG4gICAgICAgIHRoaXMudGhyb3VnaC5tb2RlbCA9IHRoaXMuc2VxdWVsaXplLmRlZmluZSh0aGlzLnRocm91Z2gubW9kZWwsIHt9LCBPYmplY3QuYXNzaWduKHRoaXMub3B0aW9ucywge1xuICAgICAgICAgIHRhYmxlTmFtZTogdGhpcy50aHJvdWdoLm1vZGVsLFxuICAgICAgICAgIGluZGV4ZXM6IFtdLCAvL3dlIGRvbid0IHdhbnQgaW5kZXhlcyBoZXJlIChhcyByZWZlcmVuY2VkIGluICMyNDE2KVxuICAgICAgICAgIHBhcmFub2lkOiBmYWxzZSwgLy8gQSBwYXJhbm9pZCBqb2luIHRhYmxlIGRvZXMgbm90IG1ha2Ugc2Vuc2VcbiAgICAgICAgICB2YWxpZGF0ZToge30gLy8gRG9uJ3QgcHJvcGFnYXRlIG1vZGVsLWxldmVsIHZhbGlkYXRpb25zXG4gICAgICAgIH0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudGhyb3VnaC5tb2RlbCA9IHRoaXMuc2VxdWVsaXplLm1vZGVsKHRoaXMudGhyb3VnaC5tb2RlbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih0aGlzLm9wdGlvbnMsIF8ucGljayh0aGlzLnRocm91Z2gubW9kZWwub3B0aW9ucywgW1xuICAgICAgJ3RpbWVzdGFtcHMnLCAnY3JlYXRlZEF0JywgJ3VwZGF0ZWRBdCcsICdkZWxldGVkQXQnLCAncGFyYW5vaWQnXG4gICAgXSkpO1xuXG4gICAgaWYgKHRoaXMucGFpcmVkKSB7XG4gICAgICBsZXQgbmVlZEluamVjdFBhaXJlZCA9IGZhbHNlO1xuXG4gICAgICBpZiAodGhpcy50YXJnZXRLZXlEZWZhdWx0KSB7XG4gICAgICAgIHRoaXMudGFyZ2V0S2V5ID0gdGhpcy5wYWlyZWQuc291cmNlS2V5O1xuICAgICAgICB0aGlzLnRhcmdldEtleUZpZWxkID0gdGhpcy5wYWlyZWQuc291cmNlS2V5RmllbGQ7XG4gICAgICAgIHRoaXMuX2NyZWF0ZUZvcmVpZ25BbmRPdGhlcktleXMoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnBhaXJlZC50YXJnZXRLZXlEZWZhdWx0KSB7XG4gICAgICAgIC8vIGluIHRoaXMgY2FzZSBwYWlyZWQub3RoZXJLZXkgZGVwZW5kcyBvbiBwYWlyZWQudGFyZ2V0S2V5LFxuICAgICAgICAvLyBzbyBjbGVhbnVwIHByZXZpb3VzbHkgd3JvbmcgZ2VuZXJhdGVkIG90aGVyS2V5XG4gICAgICAgIGlmICh0aGlzLnBhaXJlZC50YXJnZXRLZXkgIT09IHRoaXMuc291cmNlS2V5KSB7XG4gICAgICAgICAgZGVsZXRlIHRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW3RoaXMucGFpcmVkLm90aGVyS2V5XTtcbiAgICAgICAgICB0aGlzLnBhaXJlZC50YXJnZXRLZXkgPSB0aGlzLnNvdXJjZUtleTtcbiAgICAgICAgICB0aGlzLnBhaXJlZC50YXJnZXRLZXlGaWVsZCA9IHRoaXMuc291cmNlS2V5RmllbGQ7XG4gICAgICAgICAgdGhpcy5wYWlyZWQuX2NyZWF0ZUZvcmVpZ25BbmRPdGhlcktleXMoKTtcbiAgICAgICAgICBuZWVkSW5qZWN0UGFpcmVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5vdGhlcktleURlZmF1bHQpIHtcbiAgICAgICAgdGhpcy5vdGhlcktleSA9IHRoaXMucGFpcmVkLmZvcmVpZ25LZXk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5wYWlyZWQub3RoZXJLZXlEZWZhdWx0KSB7XG4gICAgICAgIC8vIElmIHBhaXJlZCBvdGhlcktleSB3YXMgaW5mZXJyZWQgd2Ugc2hvdWxkIG1ha2Ugc3VyZSB0byBjbGVhbiBpdCB1cFxuICAgICAgICAvLyBiZWZvcmUgYWRkaW5nIGEgbmV3IG9uZSB0aGF0IG1hdGNoZXMgdGhlIGZvcmVpZ25LZXlcbiAgICAgICAgaWYgKHRoaXMucGFpcmVkLm90aGVyS2V5ICE9PSB0aGlzLmZvcmVpZ25LZXkpIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5wYWlyZWQub3RoZXJLZXldO1xuICAgICAgICAgIHRoaXMucGFpcmVkLm90aGVyS2V5ID0gdGhpcy5mb3JlaWduS2V5O1xuICAgICAgICAgIG5lZWRJbmplY3RQYWlyZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChuZWVkSW5qZWN0UGFpcmVkKSB7XG4gICAgICAgIHRoaXMucGFpcmVkLl9pbmplY3RBdHRyaWJ1dGVzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudGhyb3VnaCkge1xuICAgICAgdGhpcy50aHJvdWdoTW9kZWwgPSB0aGlzLnRocm91Z2gubW9kZWw7XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLnRhYmxlTmFtZSA9IHRoaXMuY29tYmluZWROYW1lID0gdGhpcy50aHJvdWdoLm1vZGVsID09PSBPYmplY3QodGhpcy50aHJvdWdoLm1vZGVsKSA/IHRoaXMudGhyb3VnaC5tb2RlbC50YWJsZU5hbWUgOiB0aGlzLnRocm91Z2gubW9kZWw7XG5cbiAgICB0aGlzLmFzc29jaWF0aW9uQWNjZXNzb3IgPSB0aGlzLmFzO1xuXG4gICAgLy8gR2V0IHNpbmd1bGFyIGFuZCBwbHVyYWwgbmFtZXMsIHRyeWluZyB0byB1cHBlcmNhc2UgdGhlIGZpcnN0IGxldHRlciwgdW5sZXNzIHRoZSBtb2RlbCBmb3JiaWRzIGl0XG4gICAgY29uc3QgcGx1cmFsID0gXy51cHBlckZpcnN0KHRoaXMub3B0aW9ucy5uYW1lLnBsdXJhbCk7XG4gICAgY29uc3Qgc2luZ3VsYXIgPSBfLnVwcGVyRmlyc3QodGhpcy5vcHRpb25zLm5hbWUuc2luZ3VsYXIpO1xuXG4gICAgdGhpcy5hY2Nlc3NvcnMgPSB7XG4gICAgICBnZXQ6IGBnZXQke3BsdXJhbH1gLFxuICAgICAgc2V0OiBgc2V0JHtwbHVyYWx9YCxcbiAgICAgIGFkZE11bHRpcGxlOiBgYWRkJHtwbHVyYWx9YCxcbiAgICAgIGFkZDogYGFkZCR7c2luZ3VsYXJ9YCxcbiAgICAgIGNyZWF0ZTogYGNyZWF0ZSR7c2luZ3VsYXJ9YCxcbiAgICAgIHJlbW92ZTogYHJlbW92ZSR7c2luZ3VsYXJ9YCxcbiAgICAgIHJlbW92ZU11bHRpcGxlOiBgcmVtb3ZlJHtwbHVyYWx9YCxcbiAgICAgIGhhc1NpbmdsZTogYGhhcyR7c2luZ3VsYXJ9YCxcbiAgICAgIGhhc0FsbDogYGhhcyR7cGx1cmFsfWAsXG4gICAgICBjb3VudDogYGNvdW50JHtwbHVyYWx9YFxuICAgIH07XG4gIH1cblxuICBfY3JlYXRlRm9yZWlnbkFuZE90aGVyS2V5cygpIHtcbiAgICAvKlxuICAgICogRGVmYXVsdC9nZW5lcmF0ZWQgZm9yZWlnbi9vdGhlciBrZXlzXG4gICAgKi9cbiAgICBpZiAoXy5pc09iamVjdCh0aGlzLm9wdGlvbnMuZm9yZWlnbktleSkpIHtcbiAgICAgIHRoaXMuZm9yZWlnbktleUF0dHJpYnV0ZSA9IHRoaXMub3B0aW9ucy5mb3JlaWduS2V5O1xuICAgICAgdGhpcy5mb3JlaWduS2V5ID0gdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlLm5hbWUgfHwgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlLmZpZWxkTmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlID0ge307XG4gICAgICB0aGlzLmZvcmVpZ25LZXkgPSB0aGlzLm9wdGlvbnMuZm9yZWlnbktleSB8fCBVdGlscy5jYW1lbGl6ZShcbiAgICAgICAgW1xuICAgICAgICAgIHRoaXMuc291cmNlLm9wdGlvbnMubmFtZS5zaW5ndWxhcixcbiAgICAgICAgICB0aGlzLnNvdXJjZUtleVxuICAgICAgICBdLmpvaW4oJ18nKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoXy5pc09iamVjdCh0aGlzLm9wdGlvbnMub3RoZXJLZXkpKSB7XG4gICAgICB0aGlzLm90aGVyS2V5QXR0cmlidXRlID0gdGhpcy5vcHRpb25zLm90aGVyS2V5O1xuICAgICAgdGhpcy5vdGhlcktleSA9IHRoaXMub3RoZXJLZXlBdHRyaWJ1dGUubmFtZSB8fCB0aGlzLm90aGVyS2V5QXR0cmlidXRlLmZpZWxkTmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMub3RoZXJLZXkpIHtcbiAgICAgICAgdGhpcy5vdGhlcktleURlZmF1bHQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm90aGVyS2V5QXR0cmlidXRlID0ge307XG4gICAgICB0aGlzLm90aGVyS2V5ID0gdGhpcy5vcHRpb25zLm90aGVyS2V5IHx8IFV0aWxzLmNhbWVsaXplKFxuICAgICAgICBbXG4gICAgICAgICAgdGhpcy5pc1NlbGZBc3NvY2lhdGlvbiA/IFV0aWxzLnNpbmd1bGFyaXplKHRoaXMuYXMpIDogdGhpcy50YXJnZXQub3B0aW9ucy5uYW1lLnNpbmd1bGFyLFxuICAgICAgICAgIHRoaXMudGFyZ2V0S2V5XG4gICAgICAgIF0uam9pbignXycpXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIHRoZSBpZCBpcyBpbiB0aGUgdGFyZ2V0IHRhYmxlXG4gIC8vIG9yIGluIGFuIGV4dHJhIHRhYmxlIHdoaWNoIGNvbm5lY3RzIHR3byB0YWJsZXNcbiAgX2luamVjdEF0dHJpYnV0ZXMoKSB7XG4gICAgdGhpcy5pZGVudGlmaWVyID0gdGhpcy5mb3JlaWduS2V5O1xuICAgIHRoaXMuZm9yZWlnbklkZW50aWZpZXIgPSB0aGlzLm90aGVyS2V5O1xuXG4gICAgLy8gcmVtb3ZlIGFueSBQS3MgcHJldmlvdXNseSBkZWZpbmVkIGJ5IHNlcXVlbGl6ZVxuICAgIC8vIGJ1dCBpZ25vcmUgYW55IGtleXMgdGhhdCBhcmUgcGFydCBvZiB0aGlzIGFzc29jaWF0aW9uICgjNTg2NSlcbiAgICBfLmVhY2godGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXMsIChhdHRyaWJ1dGUsIGF0dHJpYnV0ZU5hbWUpID0+IHtcbiAgICAgIGlmIChhdHRyaWJ1dGUucHJpbWFyeUtleSA9PT0gdHJ1ZSAmJiBhdHRyaWJ1dGUuX2F1dG9HZW5lcmF0ZWQgPT09IHRydWUpIHtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09IHRoaXMuZm9yZWlnbktleSB8fCBhdHRyaWJ1dGVOYW1lID09PSB0aGlzLm90aGVyS2V5KSB7XG4gICAgICAgICAgLy8gdGhpcyBrZXkgaXMgc3RpbGwgbmVlZGVkIGFzIGl0J3MgcGFydCBvZiB0aGUgYXNzb2NpYXRpb25cbiAgICAgICAgICAvLyBzbyBqdXN0IHNldCBwcmltYXJ5S2V5IHRvIGZhbHNlXG4gICAgICAgICAgYXR0cmlidXRlLnByaW1hcnlLZXkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wcmltYXJ5S2V5RGVsZXRlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3VyY2VLZXkgPSB0aGlzLnNvdXJjZS5yYXdBdHRyaWJ1dGVzW3RoaXMuc291cmNlS2V5XTtcbiAgICBjb25zdCBzb3VyY2VLZXlUeXBlID0gc291cmNlS2V5LnR5cGU7XG4gICAgY29uc3Qgc291cmNlS2V5RmllbGQgPSB0aGlzLnNvdXJjZUtleUZpZWxkO1xuICAgIGNvbnN0IHRhcmdldEtleSA9IHRoaXMudGFyZ2V0LnJhd0F0dHJpYnV0ZXNbdGhpcy50YXJnZXRLZXldO1xuICAgIGNvbnN0IHRhcmdldEtleVR5cGUgPSB0YXJnZXRLZXkudHlwZTtcbiAgICBjb25zdCB0YXJnZXRLZXlGaWVsZCA9IHRoaXMudGFyZ2V0S2V5RmllbGQ7XG4gICAgY29uc3Qgc291cmNlQXR0cmlidXRlID0gXy5kZWZhdWx0cyh7fSwgdGhpcy5mb3JlaWduS2V5QXR0cmlidXRlLCB7IHR5cGU6IHNvdXJjZUtleVR5cGUgfSk7XG4gICAgY29uc3QgdGFyZ2V0QXR0cmlidXRlID0gXy5kZWZhdWx0cyh7fSwgdGhpcy5vdGhlcktleUF0dHJpYnV0ZSwgeyB0eXBlOiB0YXJnZXRLZXlUeXBlIH0pO1xuXG4gICAgaWYgKHRoaXMucHJpbWFyeUtleURlbGV0ZWQgPT09IHRydWUpIHtcbiAgICAgIHRhcmdldEF0dHJpYnV0ZS5wcmltYXJ5S2V5ID0gc291cmNlQXR0cmlidXRlLnByaW1hcnlLZXkgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAodGhpcy50aHJvdWdoLnVuaXF1ZSAhPT0gZmFsc2UpIHtcbiAgICAgIGxldCB1bmlxdWVLZXk7XG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy51bmlxdWVLZXkgPT09ICdzdHJpbmcnICYmIHRoaXMub3B0aW9ucy51bmlxdWVLZXkgIT09ICcnKSB7XG4gICAgICAgIHVuaXF1ZUtleSA9IHRoaXMub3B0aW9ucy51bmlxdWVLZXk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmlxdWVLZXkgPSBbdGhpcy50aHJvdWdoLm1vZGVsLnRhYmxlTmFtZSwgdGhpcy5mb3JlaWduS2V5LCB0aGlzLm90aGVyS2V5LCAndW5pcXVlJ10uam9pbignXycpO1xuICAgICAgfVxuICAgICAgdGFyZ2V0QXR0cmlidXRlLnVuaXF1ZSA9IHNvdXJjZUF0dHJpYnV0ZS51bmlxdWUgPSB1bmlxdWVLZXk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldKSB7XG4gICAgICB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldID0ge1xuICAgICAgICBfYXV0b0dlbmVyYXRlZDogdHJ1ZVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW3RoaXMub3RoZXJLZXldKSB7XG4gICAgICB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLm90aGVyS2V5XSA9IHtcbiAgICAgICAgX2F1dG9HZW5lcmF0ZWQ6IHRydWVcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb25zdHJhaW50cyAhPT0gZmFsc2UpIHtcbiAgICAgIHNvdXJjZUF0dHJpYnV0ZS5yZWZlcmVuY2VzID0ge1xuICAgICAgICBtb2RlbDogdGhpcy5zb3VyY2UuZ2V0VGFibGVOYW1lKCksXG4gICAgICAgIGtleTogc291cmNlS2V5RmllbGRcbiAgICAgIH07XG4gICAgICAvLyBGb3IgdGhlIHNvdXJjZSBhdHRyaWJ1dGUgdGhlIHBhc3NlZCBvcHRpb24gaXMgdGhlIHByaW9yaXR5XG4gICAgICBzb3VyY2VBdHRyaWJ1dGUub25EZWxldGUgPSB0aGlzLm9wdGlvbnMub25EZWxldGUgfHwgdGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5vbkRlbGV0ZTtcbiAgICAgIHNvdXJjZUF0dHJpYnV0ZS5vblVwZGF0ZSA9IHRoaXMub3B0aW9ucy5vblVwZGF0ZSB8fCB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLmZvcmVpZ25LZXldLm9uVXBkYXRlO1xuXG4gICAgICBpZiAoIXNvdXJjZUF0dHJpYnV0ZS5vbkRlbGV0ZSkgc291cmNlQXR0cmlidXRlLm9uRGVsZXRlID0gJ0NBU0NBREUnO1xuICAgICAgaWYgKCFzb3VyY2VBdHRyaWJ1dGUub25VcGRhdGUpIHNvdXJjZUF0dHJpYnV0ZS5vblVwZGF0ZSA9ICdDQVNDQURFJztcblxuICAgICAgdGFyZ2V0QXR0cmlidXRlLnJlZmVyZW5jZXMgPSB7XG4gICAgICAgIG1vZGVsOiB0aGlzLnRhcmdldC5nZXRUYWJsZU5hbWUoKSxcbiAgICAgICAga2V5OiB0YXJnZXRLZXlGaWVsZFxuICAgICAgfTtcbiAgICAgIC8vIEJ1dCB0aGUgZm9yIHRhcmdldCBhdHRyaWJ1dGUgdGhlIHByZXZpb3VzbHkgZGVmaW5lZCBvcHRpb24gaXMgdGhlIHByaW9yaXR5IChzaW5jZSBpdCBjb3VsZCd2ZSBiZWVuIHNldCBieSBhbm90aGVyIGJlbG9uZ3NUb01hbnkgY2FsbClcbiAgICAgIHRhcmdldEF0dHJpYnV0ZS5vbkRlbGV0ZSA9IHRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW3RoaXMub3RoZXJLZXldLm9uRGVsZXRlIHx8IHRoaXMub3B0aW9ucy5vbkRlbGV0ZTtcbiAgICAgIHRhcmdldEF0dHJpYnV0ZS5vblVwZGF0ZSA9IHRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW3RoaXMub3RoZXJLZXldLm9uVXBkYXRlIHx8IHRoaXMub3B0aW9ucy5vblVwZGF0ZTtcblxuICAgICAgaWYgKCF0YXJnZXRBdHRyaWJ1dGUub25EZWxldGUpIHRhcmdldEF0dHJpYnV0ZS5vbkRlbGV0ZSA9ICdDQVNDQURFJztcbiAgICAgIGlmICghdGFyZ2V0QXR0cmlidXRlLm9uVXBkYXRlKSB0YXJnZXRBdHRyaWJ1dGUub25VcGRhdGUgPSAnQ0FTQ0FERSc7XG4gICAgfVxuXG4gICAgdGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XSA9IE9iamVjdC5hc3NpZ24odGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XSwgc291cmNlQXR0cmlidXRlKTtcbiAgICB0aGlzLnRocm91Z2gubW9kZWwucmF3QXR0cmlidXRlc1t0aGlzLm90aGVyS2V5XSA9IE9iamVjdC5hc3NpZ24odGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5vdGhlcktleV0sIHRhcmdldEF0dHJpYnV0ZSk7XG5cbiAgICB0aGlzLnRocm91Z2gubW9kZWwucmVmcmVzaEF0dHJpYnV0ZXMoKTtcblxuICAgIHRoaXMuaWRlbnRpZmllckZpZWxkID0gdGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5mb3JlaWduS2V5XS5maWVsZCB8fCB0aGlzLmZvcmVpZ25LZXk7XG4gICAgdGhpcy5mb3JlaWduSWRlbnRpZmllckZpZWxkID0gdGhpcy50aHJvdWdoLm1vZGVsLnJhd0F0dHJpYnV0ZXNbdGhpcy5vdGhlcktleV0uZmllbGQgfHwgdGhpcy5vdGhlcktleTtcblxuICAgIGlmICh0aGlzLnBhaXJlZCAmJiAhdGhpcy5wYWlyZWQuZm9yZWlnbklkZW50aWZpZXJGaWVsZCkge1xuICAgICAgdGhpcy5wYWlyZWQuZm9yZWlnbklkZW50aWZpZXJGaWVsZCA9IHRoaXMudGhyb3VnaC5tb2RlbC5yYXdBdHRyaWJ1dGVzW3RoaXMucGFpcmVkLm90aGVyS2V5XS5maWVsZCB8fCB0aGlzLnBhaXJlZC5vdGhlcktleTtcbiAgICB9XG5cbiAgICB0aGlzLnRvU291cmNlID0gbmV3IEJlbG9uZ3NUbyh0aGlzLnRocm91Z2gubW9kZWwsIHRoaXMuc291cmNlLCB7XG4gICAgICBmb3JlaWduS2V5OiB0aGlzLmZvcmVpZ25LZXlcbiAgICB9KTtcbiAgICB0aGlzLm1hbnlGcm9tU291cmNlID0gbmV3IEhhc01hbnkodGhpcy5zb3VyY2UsIHRoaXMudGhyb3VnaC5tb2RlbCwge1xuICAgICAgZm9yZWlnbktleTogdGhpcy5mb3JlaWduS2V5XG4gICAgfSk7XG4gICAgdGhpcy5vbmVGcm9tU291cmNlID0gbmV3IEhhc09uZSh0aGlzLnNvdXJjZSwgdGhpcy50aHJvdWdoLm1vZGVsLCB7XG4gICAgICBmb3JlaWduS2V5OiB0aGlzLmZvcmVpZ25LZXksXG4gICAgICBhczogdGhpcy50aHJvdWdoLm1vZGVsLm5hbWVcbiAgICB9KTtcblxuICAgIHRoaXMudG9UYXJnZXQgPSBuZXcgQmVsb25nc1RvKHRoaXMudGhyb3VnaC5tb2RlbCwgdGhpcy50YXJnZXQsIHtcbiAgICAgIGZvcmVpZ25LZXk6IHRoaXMub3RoZXJLZXlcbiAgICB9KTtcbiAgICB0aGlzLm1hbnlGcm9tVGFyZ2V0ID0gbmV3IEhhc01hbnkodGhpcy50YXJnZXQsIHRoaXMudGhyb3VnaC5tb2RlbCwge1xuICAgICAgZm9yZWlnbktleTogdGhpcy5vdGhlcktleVxuICAgIH0pO1xuICAgIHRoaXMub25lRnJvbVRhcmdldCA9IG5ldyBIYXNPbmUodGhpcy50YXJnZXQsIHRoaXMudGhyb3VnaC5tb2RlbCwge1xuICAgICAgZm9yZWlnbktleTogdGhpcy5vdGhlcktleSxcbiAgICAgIGFzOiB0aGlzLnRocm91Z2gubW9kZWwubmFtZVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMucGFpcmVkICYmIHRoaXMucGFpcmVkLm90aGVyS2V5RGVmYXVsdCkge1xuICAgICAgdGhpcy5wYWlyZWQudG9UYXJnZXQgPSBuZXcgQmVsb25nc1RvKHRoaXMucGFpcmVkLnRocm91Z2gubW9kZWwsIHRoaXMucGFpcmVkLnRhcmdldCwge1xuICAgICAgICBmb3JlaWduS2V5OiB0aGlzLnBhaXJlZC5vdGhlcktleVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMucGFpcmVkLm9uZUZyb21UYXJnZXQgPSBuZXcgSGFzT25lKHRoaXMucGFpcmVkLnRhcmdldCwgdGhpcy5wYWlyZWQudGhyb3VnaC5tb2RlbCwge1xuICAgICAgICBmb3JlaWduS2V5OiB0aGlzLnBhaXJlZC5vdGhlcktleSxcbiAgICAgICAgYXM6IHRoaXMucGFpcmVkLnRocm91Z2gubW9kZWwubmFtZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgSGVscGVycy5jaGVja05hbWluZ0NvbGxpc2lvbih0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbWl4aW4ob2JqKSB7XG4gICAgY29uc3QgbWV0aG9kcyA9IFsnZ2V0JywgJ2NvdW50JywgJ2hhc1NpbmdsZScsICdoYXNBbGwnLCAnc2V0JywgJ2FkZCcsICdhZGRNdWx0aXBsZScsICdyZW1vdmUnLCAncmVtb3ZlTXVsdGlwbGUnLCAnY3JlYXRlJ107XG4gICAgY29uc3QgYWxpYXNlcyA9IHtcbiAgICAgIGhhc1NpbmdsZTogJ2hhcycsXG4gICAgICBoYXNBbGw6ICdoYXMnLFxuICAgICAgYWRkTXVsdGlwbGU6ICdhZGQnLFxuICAgICAgcmVtb3ZlTXVsdGlwbGU6ICdyZW1vdmUnXG4gICAgfTtcblxuICAgIEhlbHBlcnMubWl4aW5NZXRob2RzKHRoaXMsIG9iaiwgbWV0aG9kcywgYWxpYXNlcyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGV2ZXJ5dGhpbmcgY3VycmVudGx5IGFzc29jaWF0ZWQgd2l0aCB0aGlzLCB1c2luZyBhbiBvcHRpb25hbCB3aGVyZSBjbGF1c2UuXG4gICAqXG4gICAqIEBzZWVcbiAgICoge0BsaW5rIE1vZGVsfSBmb3IgYSBmdWxsIGV4cGxhbmF0aW9uIG9mIG9wdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gaW5zdGFuY2UgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBmaW5kIG9wdGlvbnNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLndoZXJlXSBBbiBvcHRpb25hbCB3aGVyZSBjbGF1c2UgdG8gbGltaXQgdGhlIGFzc29jaWF0ZWQgbW9kZWxzXG4gICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLnNjb3BlXSBBcHBseSBhIHNjb3BlIG9uIHRoZSByZWxhdGVkIG1vZGVsLCBvciByZW1vdmUgaXRzIGRlZmF1bHQgc2NvcGUgYnkgcGFzc2luZyBmYWxzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2NoZW1hXSBBcHBseSBhIHNjaGVtYSBvbiB0aGUgcmVsYXRlZCBtb2RlbFxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBcnJheTxNb2RlbD4+fVxuICAgKi9cbiAgZ2V0KGluc3RhbmNlLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKSB8fCB7fTtcblxuICAgIGNvbnN0IHRocm91Z2ggPSB0aGlzLnRocm91Z2g7XG4gICAgbGV0IHNjb3BlV2hlcmU7XG4gICAgbGV0IHRocm91Z2hXaGVyZTtcblxuICAgIGlmICh0aGlzLnNjb3BlKSB7XG4gICAgICBzY29wZVdoZXJlID0gXy5jbG9uZSh0aGlzLnNjb3BlKTtcbiAgICB9XG5cbiAgICBvcHRpb25zLndoZXJlID0ge1xuICAgICAgW09wLmFuZF06IFtcbiAgICAgICAgc2NvcGVXaGVyZSxcbiAgICAgICAgb3B0aW9ucy53aGVyZVxuICAgICAgXVxuICAgIH07XG5cbiAgICBpZiAoT2JqZWN0KHRocm91Z2gubW9kZWwpID09PSB0aHJvdWdoLm1vZGVsKSB7XG4gICAgICB0aHJvdWdoV2hlcmUgPSB7fTtcbiAgICAgIHRocm91Z2hXaGVyZVt0aGlzLmZvcmVpZ25LZXldID0gaW5zdGFuY2UuZ2V0KHRoaXMuc291cmNlS2V5KTtcblxuICAgICAgaWYgKHRocm91Z2guc2NvcGUpIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aHJvdWdoV2hlcmUsIHRocm91Z2guc2NvcGUpO1xuICAgICAgfVxuXG4gICAgICAvL0lmIGEgdXNlciBwYXNzIGEgd2hlcmUgb24gdGhlIG9wdGlvbnMgdGhyb3VnaCBvcHRpb25zLCBtYWtlIGFuIFwiYW5kXCIgd2l0aCB0aGUgY3VycmVudCB0aHJvdWdoV2hlcmVcbiAgICAgIGlmIChvcHRpb25zLnRocm91Z2ggJiYgb3B0aW9ucy50aHJvdWdoLndoZXJlKSB7XG4gICAgICAgIHRocm91Z2hXaGVyZSA9IHtcbiAgICAgICAgICBbT3AuYW5kXTogW3Rocm91Z2hXaGVyZSwgb3B0aW9ucy50aHJvdWdoLndoZXJlXVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zLmluY2x1ZGUgPSBvcHRpb25zLmluY2x1ZGUgfHwgW107XG4gICAgICBvcHRpb25zLmluY2x1ZGUucHVzaCh7XG4gICAgICAgIGFzc29jaWF0aW9uOiB0aGlzLm9uZUZyb21UYXJnZXQsXG4gICAgICAgIGF0dHJpYnV0ZXM6IG9wdGlvbnMuam9pblRhYmxlQXR0cmlidXRlcyxcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIHdoZXJlOiB0aHJvdWdoV2hlcmVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGxldCBtb2RlbCA9IHRoaXMudGFyZ2V0O1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgJ3Njb3BlJykpIHtcbiAgICAgIGlmICghb3B0aW9ucy5zY29wZSkge1xuICAgICAgICBtb2RlbCA9IG1vZGVsLnVuc2NvcGVkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtb2RlbCA9IG1vZGVsLnNjb3BlKG9wdGlvbnMuc2NvcGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgJ3NjaGVtYScpKSB7XG4gICAgICBtb2RlbCA9IG1vZGVsLnNjaGVtYShvcHRpb25zLnNjaGVtYSwgb3B0aW9ucy5zY2hlbWFEZWxpbWl0ZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBtb2RlbC5maW5kQWxsKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvdW50IGV2ZXJ5dGhpbmcgY3VycmVudGx5IGFzc29jaWF0ZWQgd2l0aCB0aGlzLCB1c2luZyBhbiBvcHRpb25hbCB3aGVyZSBjbGF1c2UuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9kZWx9IGluc3RhbmNlIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gZmluZCBvcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy53aGVyZV0gQW4gb3B0aW9uYWwgd2hlcmUgY2xhdXNlIHRvIGxpbWl0IHRoZSBhc3NvY2lhdGVkIG1vZGVsc1xuICAgKiBAcGFyYW0ge3N0cmluZ3xib29sZWFufSBbb3B0aW9ucy5zY29wZV0gQXBwbHkgYSBzY29wZSBvbiB0aGUgcmVsYXRlZCBtb2RlbCwgb3IgcmVtb3ZlIGl0cyBkZWZhdWx0IHNjb3BlIGJ5IHBhc3NpbmcgZmFsc2VcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2U8bnVtYmVyPn1cbiAgICovXG4gIGNvdW50KGluc3RhbmNlLCBvcHRpb25zKSB7XG4gICAgY29uc3Qgc2VxdWVsaXplID0gdGhpcy50YXJnZXQuc2VxdWVsaXplO1xuXG4gICAgb3B0aW9ucyA9IFV0aWxzLmNsb25lRGVlcChvcHRpb25zKTtcbiAgICBvcHRpb25zLmF0dHJpYnV0ZXMgPSBbXG4gICAgICBbc2VxdWVsaXplLmZuKCdDT1VOVCcsIHNlcXVlbGl6ZS5jb2woW3RoaXMudGFyZ2V0Lm5hbWUsIHRoaXMudGFyZ2V0S2V5RmllbGRdLmpvaW4oJy4nKSkpLCAnY291bnQnXVxuICAgIF07XG4gICAgb3B0aW9ucy5qb2luVGFibGVBdHRyaWJ1dGVzID0gW107XG4gICAgb3B0aW9ucy5yYXcgPSB0cnVlO1xuICAgIG9wdGlvbnMucGxhaW4gPSB0cnVlO1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0KGluc3RhbmNlLCBvcHRpb25zKS50aGVuKHJlc3VsdCA9PiBwYXJzZUludChyZXN1bHQuY291bnQsIDEwKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgb25lIG9yIG1vcmUgaW5zdGFuY2UocykgYXJlIGFzc29jaWF0ZWQgd2l0aCB0aGlzLiBJZiBhIGxpc3Qgb2YgaW5zdGFuY2VzIGlzIHBhc3NlZCwgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSBpZiBfYWxsXyBpbnN0YW5jZXMgYXJlIGFzc29jaWF0ZWRcbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2Ugc291cmNlIGluc3RhbmNlIHRvIGNoZWNrIGZvciBhbiBhc3NvY2lhdGlvbiB3aXRoXG4gICAqIEBwYXJhbSB7TW9kZWx8TW9kZWxbXXxzdHJpbmdbXXxzdHJpbmd8bnVtYmVyW118bnVtYmVyfSBbaW5zdGFuY2VzXSBDYW4gYmUgYW4gYXJyYXkgb2YgaW5zdGFuY2VzIG9yIHRoZWlyIHByaW1hcnkga2V5c1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGdldEFzc29jaWF0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn1cbiAgICovXG4gIGhhcyhzb3VyY2VJbnN0YW5jZSwgaW5zdGFuY2VzLCBvcHRpb25zKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGluc3RhbmNlcykpIHtcbiAgICAgIGluc3RhbmNlcyA9IFtpbnN0YW5jZXNdO1xuICAgIH1cblxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHJhdzogdHJ1ZVxuICAgIH0sIG9wdGlvbnMsIHtcbiAgICAgIHNjb3BlOiBmYWxzZSxcbiAgICAgIGF0dHJpYnV0ZXM6IFt0aGlzLnRhcmdldEtleV0sXG4gICAgICBqb2luVGFibGVBdHRyaWJ1dGVzOiBbXVxuICAgIH0pO1xuXG4gICAgY29uc3QgaW5zdGFuY2VQcmltYXJ5S2V5cyA9IGluc3RhbmNlcy5tYXAoaW5zdGFuY2UgPT4ge1xuICAgICAgaWYgKGluc3RhbmNlIGluc3RhbmNlb2YgdGhpcy50YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLndoZXJlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBbdGhpcy50YXJnZXRLZXldOiBpbnN0YW5jZVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIG9wdGlvbnMud2hlcmUgPSB7XG4gICAgICBbT3AuYW5kXTogW1xuICAgICAgICB7IFtPcC5vcl06IGluc3RhbmNlUHJpbWFyeUtleXMgfSxcbiAgICAgICAgb3B0aW9ucy53aGVyZVxuICAgICAgXVxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5nZXQoc291cmNlSW5zdGFuY2UsIG9wdGlvbnMpLnRoZW4oYXNzb2NpYXRlZE9iamVjdHMgPT5cbiAgICAgIF8uZGlmZmVyZW5jZVdpdGgoaW5zdGFuY2VQcmltYXJ5S2V5cywgYXNzb2NpYXRlZE9iamVjdHMsXG4gICAgICAgIChhLCBiKSA9PiBfLmlzRXF1YWwoYVt0aGlzLnRhcmdldEtleV0sIGJbdGhpcy50YXJnZXRLZXldKSkubGVuZ3RoID09PSAwXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGFzc29jaWF0ZWQgbW9kZWxzIGJ5IHBhc3NpbmcgYW4gYXJyYXkgb2YgaW5zdGFuY2VzIG9yIHRoZWlyIHByaW1hcnkga2V5cy5cbiAgICogRXZlcnl0aGluZyB0aGF0IGl0IG5vdCBpbiB0aGUgcGFzc2VkIGFycmF5IHdpbGwgYmUgdW4tYXNzb2NpYXRlZC5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2Ugc291cmNlIGluc3RhbmNlIHRvIGFzc29jaWF0ZSBuZXcgaW5zdGFuY2VzIHdpdGhcbiAgICogQHBhcmFtIHtNb2RlbHxNb2RlbFtdfHN0cmluZ1tdfHN0cmluZ3xudW1iZXJbXXxudW1iZXJ9IFtuZXdBc3NvY2lhdGVkT2JqZWN0c10gQSBzaW5nbGUgaW5zdGFuY2Ugb3IgcHJpbWFyeSBrZXksIG9yIGEgbWl4ZWQgYXJyYXkgb2YgcGVyc2lzdGVkIGluc3RhbmNlcyBvciBwcmltYXJ5IGtleXNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGhyb3VnaC5maW5kQWxsYCwgYGJ1bGtDcmVhdGVgLCBgdXBkYXRlYCBhbmQgYGRlc3Ryb3lgXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy52YWxpZGF0ZV0gUnVuIHZhbGlkYXRpb24gZm9yIHRoZSBqb2luIG1vZGVsXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy50aHJvdWdoXSBBZGRpdGlvbmFsIGF0dHJpYnV0ZXMgZm9yIHRoZSBqb2luIHRhYmxlLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHNldChzb3VyY2VJbnN0YW5jZSwgbmV3QXNzb2NpYXRlZE9iamVjdHMsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIGNvbnN0IHNvdXJjZUtleSA9IHRoaXMuc291cmNlS2V5O1xuICAgIGNvbnN0IHRhcmdldEtleSA9IHRoaXMudGFyZ2V0S2V5O1xuICAgIGNvbnN0IGlkZW50aWZpZXIgPSB0aGlzLmlkZW50aWZpZXI7XG4gICAgY29uc3QgZm9yZWlnbklkZW50aWZpZXIgPSB0aGlzLmZvcmVpZ25JZGVudGlmaWVyO1xuICAgIGxldCB3aGVyZSA9IHt9O1xuXG4gICAgaWYgKG5ld0Fzc29jaWF0ZWRPYmplY3RzID09PSBudWxsKSB7XG4gICAgICBuZXdBc3NvY2lhdGVkT2JqZWN0cyA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdBc3NvY2lhdGVkT2JqZWN0cyA9IHRoaXMudG9JbnN0YW5jZUFycmF5KG5ld0Fzc29jaWF0ZWRPYmplY3RzKTtcbiAgICB9XG5cbiAgICB3aGVyZVtpZGVudGlmaWVyXSA9IHNvdXJjZUluc3RhbmNlLmdldChzb3VyY2VLZXkpO1xuICAgIHdoZXJlID0gT2JqZWN0LmFzc2lnbih3aGVyZSwgdGhpcy50aHJvdWdoLnNjb3BlKTtcblxuICAgIGNvbnN0IHVwZGF0ZUFzc29jaWF0aW9ucyA9IGN1cnJlbnRSb3dzID0+IHtcbiAgICAgIGNvbnN0IG9ic29sZXRlQXNzb2NpYXRpb25zID0gW107XG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuICAgICAgY29uc3QgZGVmYXVsdEF0dHJpYnV0ZXMgPSBvcHRpb25zLnRocm91Z2ggfHwge307XG5cbiAgICAgIGNvbnN0IHVuYXNzb2NpYXRlZE9iamVjdHMgPSBuZXdBc3NvY2lhdGVkT2JqZWN0cy5maWx0ZXIob2JqID0+XG4gICAgICAgICFjdXJyZW50Um93cy5zb21lKGN1cnJlbnRSb3cgPT4gY3VycmVudFJvd1tmb3JlaWduSWRlbnRpZmllcl0gPT09IG9iai5nZXQodGFyZ2V0S2V5KSlcbiAgICAgICk7XG5cbiAgICAgIGZvciAoY29uc3QgY3VycmVudFJvdyBvZiBjdXJyZW50Um93cykge1xuICAgICAgICBjb25zdCBuZXdPYmogPSBuZXdBc3NvY2lhdGVkT2JqZWN0cy5maW5kKG9iaiA9PiBjdXJyZW50Um93W2ZvcmVpZ25JZGVudGlmaWVyXSA9PT0gb2JqLmdldCh0YXJnZXRLZXkpKTtcblxuICAgICAgICBpZiAoIW5ld09iaikge1xuICAgICAgICAgIG9ic29sZXRlQXNzb2NpYXRpb25zLnB1c2goY3VycmVudFJvdyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IHRocm91Z2hBdHRyaWJ1dGVzID0gbmV3T2JqW3RoaXMudGhyb3VnaC5tb2RlbC5uYW1lXTtcbiAgICAgICAgICAvLyBRdWljay1maXggZm9yIHN1YnRsZSBidWcgd2hlbiB1c2luZyBleGlzdGluZyBvYmplY3RzIHRoYXQgbWlnaHQgaGF2ZSB0aGUgdGhyb3VnaCBtb2RlbCBhdHRhY2hlZCAobm90IGFzIGFuIGF0dHJpYnV0ZSBvYmplY3QpXG4gICAgICAgICAgaWYgKHRocm91Z2hBdHRyaWJ1dGVzIGluc3RhbmNlb2YgdGhpcy50aHJvdWdoLm1vZGVsKSB7XG4gICAgICAgICAgICB0aHJvdWdoQXR0cmlidXRlcyA9IHt9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBfLmRlZmF1bHRzKHt9LCB0aHJvdWdoQXR0cmlidXRlcywgZGVmYXVsdEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmxlbmd0aCkge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgICAgdGhpcy50aHJvdWdoLm1vZGVsLnVwZGF0ZShhdHRyaWJ1dGVzLCBPYmplY3QuYXNzaWduKG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB3aGVyZToge1xuICAgICAgICAgICAgICAgICAgW2lkZW50aWZpZXJdOiBzb3VyY2VJbnN0YW5jZS5nZXQoc291cmNlS2V5KSxcbiAgICAgICAgICAgICAgICAgIFtmb3JlaWduSWRlbnRpZmllcl06IG5ld09iai5nZXQodGFyZ2V0S2V5KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG9ic29sZXRlQXNzb2NpYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3Qgd2hlcmUgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICBbaWRlbnRpZmllcl06IHNvdXJjZUluc3RhbmNlLmdldChzb3VyY2VLZXkpLFxuICAgICAgICAgIFtmb3JlaWduSWRlbnRpZmllcl06IG9ic29sZXRlQXNzb2NpYXRpb25zLm1hcChvYnNvbGV0ZUFzc29jaWF0aW9uID0+IG9ic29sZXRlQXNzb2NpYXRpb25bZm9yZWlnbklkZW50aWZpZXJdKVxuICAgICAgICB9LCB0aGlzLnRocm91Z2guc2NvcGUpO1xuICAgICAgICBwcm9taXNlcy5wdXNoKFxuICAgICAgICAgIHRoaXMudGhyb3VnaC5tb2RlbC5kZXN0cm95KF8uZGVmYXVsdHMoe1xuICAgICAgICAgICAgd2hlcmVcbiAgICAgICAgICB9LCBvcHRpb25zKSlcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHVuYXNzb2NpYXRlZE9iamVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBidWxrID0gdW5hc3NvY2lhdGVkT2JqZWN0cy5tYXAodW5hc3NvY2lhdGVkT2JqZWN0ID0+IHtcbiAgICAgICAgICBsZXQgYXR0cmlidXRlcyA9IHt9O1xuXG4gICAgICAgICAgYXR0cmlidXRlc1tpZGVudGlmaWVyXSA9IHNvdXJjZUluc3RhbmNlLmdldChzb3VyY2VLZXkpO1xuICAgICAgICAgIGF0dHJpYnV0ZXNbZm9yZWlnbklkZW50aWZpZXJdID0gdW5hc3NvY2lhdGVkT2JqZWN0LmdldCh0YXJnZXRLZXkpO1xuXG4gICAgICAgICAgYXR0cmlidXRlcyA9IF8uZGVmYXVsdHMoYXR0cmlidXRlcywgdW5hc3NvY2lhdGVkT2JqZWN0W3RoaXMudGhyb3VnaC5tb2RlbC5uYW1lXSwgZGVmYXVsdEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbihhdHRyaWJ1dGVzLCB0aGlzLnRocm91Z2guc2NvcGUpO1xuICAgICAgICAgIGF0dHJpYnV0ZXMgPSBPYmplY3QuYXNzaWduKGF0dHJpYnV0ZXMsIHRoaXMudGhyb3VnaC5zY29wZSk7XG5cbiAgICAgICAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLnRocm91Z2gubW9kZWwuYnVsa0NyZWF0ZShidWxrLCBPYmplY3QuYXNzaWduKHsgdmFsaWRhdGU6IHRydWUgfSwgb3B0aW9ucykpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFV0aWxzLlByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudGhyb3VnaC5tb2RlbC5maW5kQWxsKF8uZGVmYXVsdHMoeyB3aGVyZSwgcmF3OiB0cnVlIH0sIG9wdGlvbnMpKVxuICAgICAgLnRoZW4oY3VycmVudFJvd3MgPT4gdXBkYXRlQXNzb2NpYXRpb25zKGN1cnJlbnRSb3dzKSlcbiAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVtcHR5UmVzdWx0RXJyb3IpIHJldHVybiB1cGRhdGVBc3NvY2lhdGlvbnMoW10pO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc29jaWF0ZSBvbmUgb3Igc2V2ZXJhbCByb3dzIHdpdGggc291cmNlIGluc3RhbmNlLiBJdCB3aWxsIG5vdCB1bi1hc3NvY2lhdGUgYW55IGFscmVhZHkgYXNzb2NpYXRlZCBpbnN0YW5jZVxuICAgKiB0aGF0IG1heSBiZSBtaXNzaW5nIGZyb20gYG5ld0luc3RhbmNlc2AuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9kZWx9IHNvdXJjZUluc3RhbmNlIHNvdXJjZSBpbnN0YW5jZSB0byBhc3NvY2lhdGUgbmV3IGluc3RhbmNlcyB3aXRoXG4gICAqIEBwYXJhbSB7TW9kZWx8TW9kZWxbXXxzdHJpbmdbXXxzdHJpbmd8bnVtYmVyW118bnVtYmVyfSBbbmV3SW5zdGFuY2VzXSBBIHNpbmdsZSBpbnN0YW5jZSBvciBwcmltYXJ5IGtleSwgb3IgYSBtaXhlZCBhcnJheSBvZiBwZXJzaXN0ZWQgaW5zdGFuY2VzIG9yIHByaW1hcnkga2V5c1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGB0aHJvdWdoLmZpbmRBbGxgLCBgYnVsa0NyZWF0ZWAgYW5kIGB1cGRhdGVgXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy52YWxpZGF0ZV0gUnVuIHZhbGlkYXRpb24gZm9yIHRoZSBqb2luIG1vZGVsLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMudGhyb3VnaF0gQWRkaXRpb25hbCBhdHRyaWJ1dGVzIGZvciB0aGUgam9pbiB0YWJsZS5cbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBhZGQoc291cmNlSW5zdGFuY2UsIG5ld0luc3RhbmNlcywgb3B0aW9ucykge1xuICAgIC8vIElmIG5ld0luc3RhbmNlcyBpcyBudWxsIG9yIHVuZGVmaW5lZCwgbm8tb3BcbiAgICBpZiAoIW5ld0luc3RhbmNlcykgcmV0dXJuIFV0aWxzLlByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgb3B0aW9ucyA9IF8uY2xvbmUob3B0aW9ucykgfHwge307XG5cbiAgICBjb25zdCBhc3NvY2lhdGlvbiA9IHRoaXM7XG4gICAgY29uc3Qgc291cmNlS2V5ID0gYXNzb2NpYXRpb24uc291cmNlS2V5O1xuICAgIGNvbnN0IHRhcmdldEtleSA9IGFzc29jaWF0aW9uLnRhcmdldEtleTtcbiAgICBjb25zdCBpZGVudGlmaWVyID0gYXNzb2NpYXRpb24uaWRlbnRpZmllcjtcbiAgICBjb25zdCBmb3JlaWduSWRlbnRpZmllciA9IGFzc29jaWF0aW9uLmZvcmVpZ25JZGVudGlmaWVyO1xuICAgIGNvbnN0IGRlZmF1bHRBdHRyaWJ1dGVzID0gb3B0aW9ucy50aHJvdWdoIHx8IHt9O1xuXG4gICAgbmV3SW5zdGFuY2VzID0gYXNzb2NpYXRpb24udG9JbnN0YW5jZUFycmF5KG5ld0luc3RhbmNlcyk7XG5cbiAgICBjb25zdCB3aGVyZSA9IHtcbiAgICAgIFtpZGVudGlmaWVyXTogc291cmNlSW5zdGFuY2UuZ2V0KHNvdXJjZUtleSksXG4gICAgICBbZm9yZWlnbklkZW50aWZpZXJdOiBuZXdJbnN0YW5jZXMubWFwKG5ld0luc3RhbmNlID0+IG5ld0luc3RhbmNlLmdldCh0YXJnZXRLZXkpKVxuICAgIH07XG5cbiAgICBPYmplY3QuYXNzaWduKHdoZXJlLCBhc3NvY2lhdGlvbi50aHJvdWdoLnNjb3BlKTtcblxuICAgIGNvbnN0IHVwZGF0ZUFzc29jaWF0aW9ucyA9IGN1cnJlbnRSb3dzID0+IHtcbiAgICAgIGNvbnN0IHByb21pc2VzID0gW107XG4gICAgICBjb25zdCB1bmFzc29jaWF0ZWRPYmplY3RzID0gW107XG4gICAgICBjb25zdCBjaGFuZ2VkQXNzb2NpYXRpb25zID0gW107XG4gICAgICBmb3IgKGNvbnN0IG9iaiBvZiBuZXdJbnN0YW5jZXMpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdBc3NvY2lhdGlvbiA9IGN1cnJlbnRSb3dzICYmIGN1cnJlbnRSb3dzLmZpbmQoY3VycmVudCA9PiBjdXJyZW50W2ZvcmVpZ25JZGVudGlmaWVyXSA9PT0gb2JqLmdldCh0YXJnZXRLZXkpKTtcblxuICAgICAgICBpZiAoIWV4aXN0aW5nQXNzb2NpYXRpb24pIHtcbiAgICAgICAgICB1bmFzc29jaWF0ZWRPYmplY3RzLnB1c2gob2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCB0aHJvdWdoQXR0cmlidXRlcyA9IG9ialthc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLm5hbWVdO1xuICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBfLmRlZmF1bHRzKHt9LCB0aHJvdWdoQXR0cmlidXRlcywgZGVmYXVsdEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLnNvbWUoYXR0cmlidXRlID0+IGF0dHJpYnV0ZXNbYXR0cmlidXRlXSAhPT0gZXhpc3RpbmdBc3NvY2lhdGlvblthdHRyaWJ1dGVdKSkge1xuICAgICAgICAgICAgY2hhbmdlZEFzc29jaWF0aW9ucy5wdXNoKG9iaik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh1bmFzc29jaWF0ZWRPYmplY3RzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgYnVsayA9IHVuYXNzb2NpYXRlZE9iamVjdHMubWFwKHVuYXNzb2NpYXRlZE9iamVjdCA9PiB7XG4gICAgICAgICAgY29uc3QgdGhyb3VnaEF0dHJpYnV0ZXMgPSB1bmFzc29jaWF0ZWRPYmplY3RbYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5uYW1lXTtcbiAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0gXy5kZWZhdWx0cyh7fSwgdGhyb3VnaEF0dHJpYnV0ZXMsIGRlZmF1bHRBdHRyaWJ1dGVzKTtcblxuICAgICAgICAgIGF0dHJpYnV0ZXNbaWRlbnRpZmllcl0gPSBzb3VyY2VJbnN0YW5jZS5nZXQoc291cmNlS2V5KTtcbiAgICAgICAgICBhdHRyaWJ1dGVzW2ZvcmVpZ25JZGVudGlmaWVyXSA9IHVuYXNzb2NpYXRlZE9iamVjdC5nZXQodGFyZ2V0S2V5KTtcblxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oYXR0cmlidXRlcywgYXNzb2NpYXRpb24udGhyb3VnaC5zY29wZSk7XG5cbiAgICAgICAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvbWlzZXMucHVzaChhc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLmJ1bGtDcmVhdGUoYnVsaywgT2JqZWN0LmFzc2lnbih7IHZhbGlkYXRlOiB0cnVlIH0sIG9wdGlvbnMpKSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgYXNzb2Mgb2YgY2hhbmdlZEFzc29jaWF0aW9ucykge1xuICAgICAgICBsZXQgdGhyb3VnaEF0dHJpYnV0ZXMgPSBhc3NvY1thc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsLm5hbWVdO1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGVzID0gXy5kZWZhdWx0cyh7fSwgdGhyb3VnaEF0dHJpYnV0ZXMsIGRlZmF1bHRBdHRyaWJ1dGVzKTtcbiAgICAgICAgLy8gUXVpY2stZml4IGZvciBzdWJ0bGUgYnVnIHdoZW4gdXNpbmcgZXhpc3Rpbmcgb2JqZWN0cyB0aGF0IG1pZ2h0IGhhdmUgdGhlIHRocm91Z2ggbW9kZWwgYXR0YWNoZWQgKG5vdCBhcyBhbiBhdHRyaWJ1dGUgb2JqZWN0KVxuICAgICAgICBpZiAodGhyb3VnaEF0dHJpYnV0ZXMgaW5zdGFuY2VvZiBhc3NvY2lhdGlvbi50aHJvdWdoLm1vZGVsKSB7XG4gICAgICAgICAgdGhyb3VnaEF0dHJpYnV0ZXMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3aGVyZSA9IHtcbiAgICAgICAgICBbaWRlbnRpZmllcl06IHNvdXJjZUluc3RhbmNlLmdldChzb3VyY2VLZXkpLFxuICAgICAgICAgIFtmb3JlaWduSWRlbnRpZmllcl06IGFzc29jLmdldCh0YXJnZXRLZXkpXG4gICAgICAgIH07XG5cblxuICAgICAgICBwcm9taXNlcy5wdXNoKGFzc29jaWF0aW9uLnRocm91Z2gubW9kZWwudXBkYXRlKGF0dHJpYnV0ZXMsIE9iamVjdC5hc3NpZ24ob3B0aW9ucywgeyB3aGVyZSB9KSkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gVXRpbHMuUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXNzb2NpYXRpb24udGhyb3VnaC5tb2RlbC5maW5kQWxsKF8uZGVmYXVsdHMoeyB3aGVyZSwgcmF3OiB0cnVlIH0sIG9wdGlvbnMpKVxuICAgICAgLnRoZW4oY3VycmVudFJvd3MgPT4gdXBkYXRlQXNzb2NpYXRpb25zKGN1cnJlbnRSb3dzKSlcbiAgICAgIC50aGVuKChbYXNzb2NpYXRpb25zXSkgPT4gYXNzb2NpYXRpb25zKVxuICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRW1wdHlSZXN1bHRFcnJvcikgcmV0dXJuIHVwZGF0ZUFzc29jaWF0aW9ucygpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuLWFzc29jaWF0ZSBvbmUgb3IgbW9yZSBpbnN0YW5jZShzKS5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2UgaW5zdGFuY2UgdG8gdW4gYXNzb2NpYXRlIGluc3RhbmNlcyB3aXRoXG4gICAqIEBwYXJhbSB7TW9kZWx8TW9kZWxbXXxzdHJpbmd8c3RyaW5nW118bnVtYmVyfG51bWJlcltdfSBbb2xkQXNzb2NpYXRlZE9iamVjdHNdIENhbiBiZSBhbiBJbnN0YW5jZSBvciBpdHMgcHJpbWFyeSBrZXksIG9yIGEgbWl4ZWQgYXJyYXkgb2YgaW5zdGFuY2VzIGFuZCBwcmltYXJ5IGtleXNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zIHBhc3NlZCB0byBgdGhyb3VnaC5kZXN0cm95YFxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHJlbW92ZShzb3VyY2VJbnN0YW5jZSwgb2xkQXNzb2NpYXRlZE9iamVjdHMsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBhc3NvY2lhdGlvbiA9IHRoaXM7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIG9sZEFzc29jaWF0ZWRPYmplY3RzID0gYXNzb2NpYXRpb24udG9JbnN0YW5jZUFycmF5KG9sZEFzc29jaWF0ZWRPYmplY3RzKTtcblxuICAgIGNvbnN0IHdoZXJlID0ge1xuICAgICAgW2Fzc29jaWF0aW9uLmlkZW50aWZpZXJdOiBzb3VyY2VJbnN0YW5jZS5nZXQoYXNzb2NpYXRpb24uc291cmNlS2V5KSxcbiAgICAgIFthc3NvY2lhdGlvbi5mb3JlaWduSWRlbnRpZmllcl06IG9sZEFzc29jaWF0ZWRPYmplY3RzLm1hcChuZXdJbnN0YW5jZSA9PiBuZXdJbnN0YW5jZS5nZXQoYXNzb2NpYXRpb24udGFyZ2V0S2V5KSlcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFzc29jaWF0aW9uLnRocm91Z2gubW9kZWwuZGVzdHJveShfLmRlZmF1bHRzKHsgd2hlcmUgfSwgb3B0aW9ucykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYXNzb2NpYXRlZCBtb2RlbCBhbmQgYXNzb2NpYXRlIGl0IHdpdGggdGhpcy5cbiAgICpcbiAgICogQHBhcmFtIHtNb2RlbH0gc291cmNlSW5zdGFuY2Ugc291cmNlIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbdmFsdWVzXSB2YWx1ZXMgZm9yIHRhcmdldCBtb2RlbFxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnMgcGFzc2VkIHRvIGNyZWF0ZSBhbmQgYWRkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy50aHJvdWdoXSBBZGRpdGlvbmFsIGF0dHJpYnV0ZXMgZm9yIHRoZSBqb2luIHRhYmxlXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgY3JlYXRlKHNvdXJjZUluc3RhbmNlLCB2YWx1ZXMsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBhc3NvY2lhdGlvbiA9IHRoaXM7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgfHwge307XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgZmllbGRzOiBvcHRpb25zXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChhc3NvY2lhdGlvbi5zY29wZSkge1xuICAgICAgT2JqZWN0LmFzc2lnbih2YWx1ZXMsIGFzc29jaWF0aW9uLnNjb3BlKTtcbiAgICAgIGlmIChvcHRpb25zLmZpZWxkcykge1xuICAgICAgICBvcHRpb25zLmZpZWxkcyA9IG9wdGlvbnMuZmllbGRzLmNvbmNhdChPYmplY3Qua2V5cyhhc3NvY2lhdGlvbi5zY29wZSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgcmVsYXRlZCBtb2RlbCBpbnN0YW5jZVxuICAgIHJldHVybiBhc3NvY2lhdGlvbi50YXJnZXQuY3JlYXRlKHZhbHVlcywgb3B0aW9ucykudGhlbihuZXdBc3NvY2lhdGVkT2JqZWN0ID0+XG4gICAgICBzb3VyY2VJbnN0YW5jZVthc3NvY2lhdGlvbi5hY2Nlc3NvcnMuYWRkXShuZXdBc3NvY2lhdGVkT2JqZWN0LCBfLm9taXQob3B0aW9ucywgWydmaWVsZHMnXSkpLnJldHVybihuZXdBc3NvY2lhdGVkT2JqZWN0KVxuICAgICk7XG4gIH1cblxuICB2ZXJpZnlBc3NvY2lhdGlvbkFsaWFzKGFsaWFzKSB7XG4gICAgaWYgKHR5cGVvZiBhbGlhcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLmFzID09PSBhbGlhcztcbiAgICB9XG5cbiAgICBpZiAoYWxpYXMgJiYgYWxpYXMucGx1cmFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5hcyA9PT0gYWxpYXMucGx1cmFsO1xuICAgIH1cblxuICAgIHJldHVybiAhdGhpcy5pc0FsaWFzZWQ7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCZWxvbmdzVG9NYW55O1xubW9kdWxlLmV4cG9ydHMuQmVsb25nc1RvTWFueSA9IEJlbG9uZ3NUb01hbnk7XG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gQmVsb25nc1RvTWFueTtcbiJdfQ==