'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const Toposort = require('toposort-class');

const _ = require('lodash');

let ModelManager =
/*#__PURE__*/
function () {
  function ModelManager(sequelize) {
    _classCallCheck(this, ModelManager);

    this.models = [];
    this.sequelize = sequelize;
  }

  _createClass(ModelManager, [{
    key: "addModel",
    value: function addModel(model) {
      this.models.push(model);
      this.sequelize.models[model.name] = model;
      return model;
    }
  }, {
    key: "removeModel",
    value: function removeModel(modelToRemove) {
      this.models = this.models.filter(model => model.name !== modelToRemove.name);
      delete this.sequelize.models[modelToRemove.name];
    }
  }, {
    key: "getModel",
    value: function getModel(against, options) {
      options = _.defaults(options || {}, {
        attribute: 'name'
      });
      return this.models.find(model => model[options.attribute] === against);
    }
  }, {
    key: "forEachModel",

    /**
     * Iterate over Models in an order suitable for e.g. creating tables.
     * Will take foreign key constraints into account so that dependencies are visited before dependents.
     *
     * @param {Function} iterator method to execute on each model
     * @param {Object} [options] iterator options
     * @private
     */
    value: function forEachModel(iterator, options) {
      const models = {};
      const sorter = new Toposort();
      let sorted;
      let dep;
      options = _.defaults(options || {}, {
        reverse: true
      });

      for (const model of this.models) {
        let deps = [];
        let tableName = model.getTableName();

        if (_.isObject(tableName)) {
          tableName = `${tableName.schema}.${tableName.tableName}`;
        }

        models[tableName] = model;

        for (const attrName in model.rawAttributes) {
          if (Object.prototype.hasOwnProperty.call(model.rawAttributes, attrName)) {
            const attribute = model.rawAttributes[attrName];

            if (attribute.references) {
              dep = attribute.references.model;

              if (_.isObject(dep)) {
                dep = `${dep.schema}.${dep.tableName}`;
              }

              deps.push(dep);
            }
          }
        }

        deps = deps.filter(dep => tableName !== dep);
        sorter.add(tableName, deps);
      }

      sorted = sorter.sort();

      if (options.reverse) {
        sorted = sorted.reverse();
      }

      for (const name of sorted) {
        iterator(models[name], name);
      }
    }
  }, {
    key: "all",
    get: function () {
      return this.models;
    }
  }]);

  return ModelManager;
}();

module.exports = ModelManager;
module.exports.ModelManager = ModelManager;
module.exports.default = ModelManager;