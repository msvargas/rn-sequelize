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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9tb2RlbC1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbIlRvcG9zb3J0IiwicmVxdWlyZSIsIl8iLCJNb2RlbE1hbmFnZXIiLCJzZXF1ZWxpemUiLCJtb2RlbHMiLCJtb2RlbCIsInB1c2giLCJuYW1lIiwibW9kZWxUb1JlbW92ZSIsImZpbHRlciIsImFnYWluc3QiLCJvcHRpb25zIiwiZGVmYXVsdHMiLCJhdHRyaWJ1dGUiLCJmaW5kIiwiaXRlcmF0b3IiLCJzb3J0ZXIiLCJzb3J0ZWQiLCJkZXAiLCJyZXZlcnNlIiwiZGVwcyIsInRhYmxlTmFtZSIsImdldFRhYmxlTmFtZSIsImlzT2JqZWN0Iiwic2NoZW1hIiwiYXR0ck5hbWUiLCJyYXdBdHRyaWJ1dGVzIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwicmVmZXJlbmNlcyIsImFkZCIsInNvcnQiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBRUEsTUFBTUEsUUFBUSxHQUFHQyxPQUFPLENBQUMsZ0JBQUQsQ0FBeEI7O0FBQ0EsTUFBTUMsQ0FBQyxHQUFHRCxPQUFPLENBQUMsUUFBRCxDQUFqQjs7SUFFTUUsWTs7O0FBQ0osd0JBQVlDLFNBQVosRUFBdUI7QUFBQTs7QUFDckIsU0FBS0MsTUFBTCxHQUFjLEVBQWQ7QUFDQSxTQUFLRCxTQUFMLEdBQWlCQSxTQUFqQjtBQUNEOzs7OzZCQUVRRSxLLEVBQU87QUFDZCxXQUFLRCxNQUFMLENBQVlFLElBQVosQ0FBaUJELEtBQWpCO0FBQ0EsV0FBS0YsU0FBTCxDQUFlQyxNQUFmLENBQXNCQyxLQUFLLENBQUNFLElBQTVCLElBQW9DRixLQUFwQztBQUVBLGFBQU9BLEtBQVA7QUFDRDs7O2dDQUVXRyxhLEVBQWU7QUFDekIsV0FBS0osTUFBTCxHQUFjLEtBQUtBLE1BQUwsQ0FBWUssTUFBWixDQUFtQkosS0FBSyxJQUFJQSxLQUFLLENBQUNFLElBQU4sS0FBZUMs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QyxPQUFQLEdBQWlCakMsWUFBakI7QUFDQWdDLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlakMsWUFBZixHQUE4QkEsWUFBOUI7QUFDQWdDLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxPQUFmLEdBQXlCbEMsWUFBekIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBUb3Bvc29ydCA9IHJlcXVpcmUoJ3RvcG9zb3J0LWNsYXNzJyk7XHJcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuXHJcbmNsYXNzIE1vZGVsTWFuYWdlciB7XHJcbiAgY29uc3RydWN0b3Ioc2VxdWVsaXplKSB7XHJcbiAgICB0aGlzLm1vZGVscyA9IFtdO1xyXG4gICAgdGhpcy5zZXF1ZWxpemUgPSBzZXF1ZWxpemU7XHJcbiAgfVxyXG5cclxuICBhZGRNb2RlbChtb2RlbCkge1xyXG4gICAgdGhpcy5tb2RlbHMucHVzaChtb2RlbCk7XHJcbiAgICB0aGlzLnNlcXVlbGl6ZS5tb2RlbHNbbW9kZWwubmFtZV0gPSBtb2RlbDtcclxuXHJcbiAgICByZXR1cm4gbW9kZWw7XHJcbiAgfVxyXG5cclxuICByZW1vdmVNb2RlbChtb2RlbFRvUmVtb3ZlKSB7XHJcbiAgICB0aGlzLm1vZGVscyA9IHRoaXMubW9kZWxzLmZpbHRlcihtb2RlbCA9PiBtb2RlbC5uYW1lICE9PSBtb2RlbFRvUmVtb3ZlLm5hbWUpO1xyXG5cclxuICAgIGRlbGV0ZSB0aGlzLnNlcXVlbGl6ZS5tb2RlbHNbbW9kZWxUb1JlbW92ZS5uYW1lXTtcclxuICB9XHJcblxyXG4gIGdldE1vZGVsKGFnYWluc3QsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKG9wdGlvbnMgfHwge30sIHtcclxuICAgICAgYXR0cmlidXRlOiAnbmFtZSdcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0aGlzLm1vZGVscy5maW5kKG1vZGVsID0+IG1vZGVsW29wdGlvbnMuYXR0cmlidXRlXSA9PT0gYWdhaW5zdCk7XHJcbiAgfVxyXG5cclxuICBnZXQgYWxsKCkge1xyXG4gICAgcmV0dXJuIHRoaXMubW9kZWxzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSXRlcmF0ZSBvdmVyIE1vZGVscyBpbiBhbiBvcmRlciBzdWl0YWJsZSBmb3IgZS5nLiBjcmVhdGluZyB0YWJsZXMuXHJcbiAgICogV2lsbCB0YWtlIGZvcmVpZ24ga2V5IGNvbnN0cmFpbnRzIGludG8gYWNjb3VudCBzbyB0aGF0IGRlcGVuZGVuY2llcyBhcmUgdmlzaXRlZCBiZWZvcmUgZGVwZW5kZW50cy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdG9yIG1ldGhvZCB0byBleGVjdXRlIG9uIGVhY2ggbW9kZWxcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIGl0ZXJhdG9yIG9wdGlvbnNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGZvckVhY2hNb2RlbChpdGVyYXRvciwgb3B0aW9ucykge1xyXG4gICAgY29uc3QgbW9kZWxzID0ge307XHJcbiAgICBjb25zdCBzb3J0ZXIgPSBuZXcgVG9wb3NvcnQoKTtcclxuICAgIGxldCBzb3J0ZWQ7XHJcbiAgICBsZXQgZGVwO1xyXG5cclxuICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKG9wdGlvbnMgfHwge30sIHtcclxuICAgICAgcmV2ZXJzZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiB0aGlzLm1vZGVscykge1xyXG4gICAgICBsZXQgZGVwcyA9IFtdO1xyXG4gICAgICBsZXQgdGFibGVOYW1lID0gbW9kZWwuZ2V0VGFibGVOYW1lKCk7XHJcblxyXG4gICAgICBpZiAoXy5pc09iamVjdCh0YWJsZU5hbWUpKSB7XHJcbiAgICAgICAgdGFibGVOYW1lID0gYCR7dGFibGVOYW1lLnNjaGVtYX0uJHt0YWJsZU5hbWUudGFibGVOYW1lfWA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG1vZGVsc1t0YWJsZU5hbWVdID0gbW9kZWw7XHJcblxyXG4gICAgICBmb3IgKGNvbnN0IGF0dHJOYW1lIGluIG1vZGVsLnJhd0F0dHJpYnV0ZXMpIHtcclxuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZGVsLnJhd0F0dHJpYnV0ZXMsIGF0dHJOYW1lKSkge1xyXG4gICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbW9kZWwucmF3QXR0cmlidXRlc1thdHRyTmFtZV07XHJcblxyXG4gICAgICAgICAgaWYgKGF0dHJpYnV0ZS5yZWZlcmVuY2VzKSB7XHJcbiAgICAgICAgICAgIGRlcCA9IGF0dHJpYnV0ZS5yZWZlcmVuY2VzLm1vZGVsO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNPYmplY3QoZGVwKSkge1xyXG4gICAgICAgICAgICAgIGRlcCA9IGAke2RlcC5zY2hlbWF9LiR7ZGVwLnRhYmxlTmFtZX1gO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkZXBzLnB1c2goZGVwKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRlcHMgPSBkZXBzLmZpbHRlcihkZXAgPT4gdGFibGVOYW1lICE9PSBkZXApO1xyXG5cclxuICAgICAgc29ydGVyLmFkZCh0YWJsZU5hbWUsIGRlcHMpO1xyXG4gICAgfVxyXG5cclxuICAgIHNvcnRlZCA9IHNvcnRlci5zb3J0KCk7XHJcbiAgICBpZiAob3B0aW9ucy5yZXZlcnNlKSB7XHJcbiAgICAgIHNvcnRlZCA9IHNvcnRlZC5yZXZlcnNlKCk7XHJcbiAgICB9XHJcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2Ygc29ydGVkKSB7XHJcbiAgICAgIGl0ZXJhdG9yKG1vZGVsc1tuYW1lXSwgbmFtZSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsTWFuYWdlcjtcclxubW9kdWxlLmV4cG9ydHMuTW9kZWxNYW5hZ2VyID0gTW9kZWxNYW5hZ2VyO1xyXG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gTW9kZWxNYW5hZ2VyO1xyXG4iXX0=