'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const Toposort = require('toposort-class');

const _ = require('lodash');

let ModelManager = /*#__PURE__*/function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9tb2RlbC1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbIlRvcG9zb3J0IiwicmVxdWlyZSIsIl8iLCJNb2RlbE1hbmFnZXIiLCJzZXF1ZWxpemUiLCJtb2RlbHMiLCJtb2RlbCIsInB1c2giLCJuYW1lIiwibW9kZWxUb1JlbW92ZSIsImZpbHRlciIsImFnYWluc3QiLCJvcHRpb25zIiwiZGVmYXVsdHMiLCJhdHRyaWJ1dGUiLCJmaW5kIiwiaXRlcmF0b3IiLCJzb3J0ZXIiLCJzb3J0ZWQiLCJkZXAiLCJyZXZlcnNlIiwiZGVwcyIsInRhYmxlTmFtZSIsImdldFRhYmxlTmFtZSIsImlzT2JqZWN0Iiwic2NoZW1hIiwiYXR0ck5hbWUiLCJyYXdBdHRyaWJ1dGVzIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwicmVmZXJlbmNlcyIsImFkZCIsInNvcnQiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBRUEsTUFBTUEsUUFBUSxHQUFHQyxPQUFPLENBQUMsZ0JBQUQsQ0FBeEI7O0FBQ0EsTUFBTUMsQ0FBQyxHQUFHRCxPQUFPLENBQUMsUUFBRCxDQUFqQjs7SUFFTUUsWTtBQUNKLHdCQUFZQyxTQUFaLEVBQXVCO0FBQUE7O0FBQ3JCLFNBQUtDLE1BQUwsR0FBYyxFQUFkO0FBQ0EsU0FBS0QsU0FBTCxHQUFpQkEsU0FBakI7QUFDRDs7Ozs2QkFFUUUsSyxFQUFPO0FBQ2QsV0FBS0QsTUFBTCxDQUFZRSxJQUFaLENBQWlCRCxLQUFqQjtBQUNBLFdBQUtGLFNBQUwsQ0FBZUMsTUFBZixDQUFzQkMsS0FBSyxDQUFDRSxJQUE1QixJQUFvQ0YsS0FBcEM7QUFFQSxhQUFPQSxLQUFQO0FBQ0Q7OztnQ0FFV0csYSxFQUFlO0FBQ3pCLFdBQUtKLE1BQUwsR0FBYyxLQUFLQSxNQUFMLENBQVlLLE1BQVosQ0FBbUJKLEtBQUssSUFBSUEsS0FBSyxDQUFDRSxJQUFOLEtBQWVDLGFB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QUNEOzs7Ozs7QUE2REg4QixNQUFNLENBQUNDLE9BQVAsR0FBaUJqQyxZQUFqQjtBQUNBZ0MsTUFBTSxDQUFDQyxPQUFQLENBQWVqQyxZQUFmLEdBQThCQSxZQUE5QjtBQUNBZ0MsTUFBTSxDQUFDQyxPQUFQLENBQWVDLE9BQWYsR0FBeUJsQyxZQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuY29uc3QgVG9wb3NvcnQgPSByZXF1aXJlKCd0b3Bvc29ydC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5jbGFzcyBNb2RlbE1hbmFnZXIge1xuICBjb25zdHJ1Y3RvcihzZXF1ZWxpemUpIHtcbiAgICB0aGlzLm1vZGVscyA9IFtdO1xuICAgIHRoaXMuc2VxdWVsaXplID0gc2VxdWVsaXplO1xuICB9XG5cbiAgYWRkTW9kZWwobW9kZWwpIHtcbiAgICB0aGlzLm1vZGVscy5wdXNoKG1vZGVsKTtcbiAgICB0aGlzLnNlcXVlbGl6ZS5tb2RlbHNbbW9kZWwubmFtZV0gPSBtb2RlbDtcblxuICAgIHJldHVybiBtb2RlbDtcbiAgfVxuXG4gIHJlbW92ZU1vZGVsKG1vZGVsVG9SZW1vdmUpIHtcbiAgICB0aGlzLm1vZGVscyA9IHRoaXMubW9kZWxzLmZpbHRlcihtb2RlbCA9PiBtb2RlbC5uYW1lICE9PSBtb2RlbFRvUmVtb3ZlLm5hbWUpO1xuXG4gICAgZGVsZXRlIHRoaXMuc2VxdWVsaXplLm1vZGVsc1ttb2RlbFRvUmVtb3ZlLm5hbWVdO1xuICB9XG5cbiAgZ2V0TW9kZWwoYWdhaW5zdCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKG9wdGlvbnMgfHwge30sIHtcbiAgICAgIGF0dHJpYnV0ZTogJ25hbWUnXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5tb2RlbHMuZmluZChtb2RlbCA9PiBtb2RlbFtvcHRpb25zLmF0dHJpYnV0ZV0gPT09IGFnYWluc3QpO1xuICB9XG5cbiAgZ2V0IGFsbCgpIHtcbiAgICByZXR1cm4gdGhpcy5tb2RlbHM7XG4gIH1cblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIE1vZGVscyBpbiBhbiBvcmRlciBzdWl0YWJsZSBmb3IgZS5nLiBjcmVhdGluZyB0YWJsZXMuXG4gICAqIFdpbGwgdGFrZSBmb3JlaWduIGtleSBjb25zdHJhaW50cyBpbnRvIGFjY291bnQgc28gdGhhdCBkZXBlbmRlbmNpZXMgYXJlIHZpc2l0ZWQgYmVmb3JlIGRlcGVuZGVudHMuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdG9yIG1ldGhvZCB0byBleGVjdXRlIG9uIGVhY2ggbW9kZWxcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBpdGVyYXRvciBvcHRpb25zXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmb3JFYWNoTW9kZWwoaXRlcmF0b3IsIG9wdGlvbnMpIHtcbiAgICBjb25zdCBtb2RlbHMgPSB7fTtcbiAgICBjb25zdCBzb3J0ZXIgPSBuZXcgVG9wb3NvcnQoKTtcbiAgICBsZXQgc29ydGVkO1xuICAgIGxldCBkZXA7XG5cbiAgICBvcHRpb25zID0gXy5kZWZhdWx0cyhvcHRpb25zIHx8IHt9LCB7XG4gICAgICByZXZlcnNlOiB0cnVlXG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHRoaXMubW9kZWxzKSB7XG4gICAgICBsZXQgZGVwcyA9IFtdO1xuICAgICAgbGV0IHRhYmxlTmFtZSA9IG1vZGVsLmdldFRhYmxlTmFtZSgpO1xuXG4gICAgICBpZiAoXy5pc09iamVjdCh0YWJsZU5hbWUpKSB7XG4gICAgICAgIHRhYmxlTmFtZSA9IGAke3RhYmxlTmFtZS5zY2hlbWF9LiR7dGFibGVOYW1lLnRhYmxlTmFtZX1gO1xuICAgICAgfVxuXG4gICAgICBtb2RlbHNbdGFibGVOYW1lXSA9IG1vZGVsO1xuXG4gICAgICBmb3IgKGNvbnN0IGF0dHJOYW1lIGluIG1vZGVsLnJhd0F0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb2RlbC5yYXdBdHRyaWJ1dGVzLCBhdHRyTmFtZSkpIHtcbiAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBtb2RlbC5yYXdBdHRyaWJ1dGVzW2F0dHJOYW1lXTtcblxuICAgICAgICAgIGlmIChhdHRyaWJ1dGUucmVmZXJlbmNlcykge1xuICAgICAgICAgICAgZGVwID0gYXR0cmlidXRlLnJlZmVyZW5jZXMubW9kZWw7XG5cbiAgICAgICAgICAgIGlmIChfLmlzT2JqZWN0KGRlcCkpIHtcbiAgICAgICAgICAgICAgZGVwID0gYCR7ZGVwLnNjaGVtYX0uJHtkZXAudGFibGVOYW1lfWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlcHMucHVzaChkZXApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBkZXBzID0gZGVwcy5maWx0ZXIoZGVwID0+IHRhYmxlTmFtZSAhPT0gZGVwKTtcblxuICAgICAgc29ydGVyLmFkZCh0YWJsZU5hbWUsIGRlcHMpO1xuICAgIH1cblxuICAgIHNvcnRlZCA9IHNvcnRlci5zb3J0KCk7XG4gICAgaWYgKG9wdGlvbnMucmV2ZXJzZSkge1xuICAgICAgc29ydGVkID0gc29ydGVkLnJldmVyc2UoKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIHNvcnRlZCkge1xuICAgICAgaXRlcmF0b3IobW9kZWxzW25hbWVdLCBuYW1lKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbE1hbmFnZXI7XG5tb2R1bGUuZXhwb3J0cy5Nb2RlbE1hbmFnZXIgPSBNb2RlbE1hbmFnZXI7XG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gTW9kZWxNYW5hZ2VyO1xuIl19