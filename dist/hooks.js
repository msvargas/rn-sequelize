'use strict';

const _ = require('lodash');

const {
  logger
} = require('./utils/logger');

const Promise = require('./promise');

const debug = logger.debugContext('hooks');
const hookTypes = {
  beforeValidate: {
    params: 2
  },
  afterValidate: {
    params: 2
  },
  validationFailed: {
    params: 3
  },
  beforeCreate: {
    params: 2
  },
  afterCreate: {
    params: 2
  },
  beforeDestroy: {
    params: 2
  },
  afterDestroy: {
    params: 2
  },
  beforeRestore: {
    params: 2
  },
  afterRestore: {
    params: 2
  },
  beforeUpdate: {
    params: 2
  },
  afterUpdate: {
    params: 2
  },
  beforeSave: {
    params: 2,
    proxies: ['beforeUpdate', 'beforeCreate']
  },
  afterSave: {
    params: 2,
    proxies: ['afterUpdate', 'afterCreate']
  },
  beforeUpsert: {
    params: 2
  },
  afterUpsert: {
    params: 2
  },
  beforeBulkCreate: {
    params: 2
  },
  afterBulkCreate: {
    params: 2
  },
  beforeBulkDestroy: {
    params: 1
  },
  afterBulkDestroy: {
    params: 1
  },
  beforeBulkRestore: {
    params: 1
  },
  afterBulkRestore: {
    params: 1
  },
  beforeBulkUpdate: {
    params: 1
  },
  afterBulkUpdate: {
    params: 1
  },
  beforeFind: {
    params: 1
  },
  beforeFindAfterExpandIncludeAll: {
    params: 1
  },
  beforeFindAfterOptions: {
    params: 1
  },
  afterFind: {
    params: 2
  },
  beforeCount: {
    params: 1
  },
  beforeDefine: {
    params: 2,
    sync: true,
    noModel: true
  },
  afterDefine: {
    params: 1,
    sync: true,
    noModel: true
  },
  beforeInit: {
    params: 2,
    sync: true,
    noModel: true
  },
  afterInit: {
    params: 1,
    sync: true,
    noModel: true
  },
  beforeAssociate: {
    params: 2,
    sync: true
  },
  afterAssociate: {
    params: 2,
    sync: true
  },
  beforeConnect: {
    params: 1,
    noModel: true
  },
  afterConnect: {
    params: 2,
    noModel: true
  },
  beforeDisconnect: {
    params: 1,
    noModel: true
  },
  afterDisconnect: {
    params: 1,
    noModel: true
  },
  beforeSync: {
    params: 1
  },
  afterSync: {
    params: 1
  },
  beforeBulkSync: {
    params: 1
  },
  afterBulkSync: {
    params: 1
  },
  beforeQuery: {
    params: 2
  },
  afterQuery: {
    params: 2
  }
};
exports.hooks = hookTypes;
/**
 * get array of current hook and its proxies combined
 *
 * @param {string} hookType any hook type @see {@link hookTypes}
 *
 * @private
 */

const getProxiedHooks = hookType => hookTypes[hookType].proxies ? hookTypes[hookType].proxies.concat(hookType) : [hookType];

function getHooks(hooked, hookType) {
  return (hooked.options.hooks || {})[hookType] || [];
}

const Hooks = {
  /**
   * Process user supplied hooks definition
   *
   * @param {Object} hooks hooks definition
   *
   * @private
   * @memberof Sequelize
   * @memberof Sequelize.Model
   */
  _setupHooks(hooks) {
    this.options.hooks = {};

    _.map(hooks || {}, (hooksArray, hookName) => {
      if (!Array.isArray(hooksArray)) hooksArray = [hooksArray];
      hooksArray.forEach(hookFn => this.addHook(hookName, hookFn));
    });
  },

  runHooks(hooks, ...hookArgs) {
    if (!hooks) throw new Error('runHooks requires at least 1 argument');
    let hookType;

    if (typeof hooks === 'string') {
      hookType = hooks;
      hooks = getHooks(this, hookType);

      if (this.sequelize) {
        hooks = hooks.concat(getHooks(this.sequelize, hookType));
      }
    }

    if (!Array.isArray(hooks)) {
      hooks = [hooks];
    } // synchronous hooks


    if (hookTypes[hookType] && hookTypes[hookType].sync) {
      for (let hook of hooks) {
        if (typeof hook === 'object') {
          hook = hook.fn;
        }

        debug(`running hook(sync) ${hookType}`);
        hook.apply(this, hookArgs);
      }

      return;
    } // asynchronous hooks (default)


    return Promise.each(hooks, hook => {
      if (typeof hook === 'object') {
        hook = hook.fn;
      }

      debug(`running hook ${hookType}`);
      return hook.apply(this, hookArgs);
    }).return();
  },

  /**
   * Add a hook to the model
   *
   * @param {string}          hookType hook name @see {@link hookTypes}
   * @param {string|Function} [name] Provide a name for the hook function. It can be used to remove the hook later or to order hooks based on some sort of priority system in the future.
   * @param {Function}        fn The hook function
   *
   * @memberof Sequelize
   * @memberof Sequelize.Model
   */
  addHook(hookType, name, fn) {
    if (typeof name === 'function') {
      fn = name;
      name = null;
    }

    debug(`adding hook ${hookType}`); // check for proxies, add them too

    hookType = getProxiedHooks(hookType);
    hookType.forEach(type => {
      const hooks = getHooks(this, type);
      hooks.push(name ? {
        name,
        fn
      } : fn);
      this.options.hooks[type] = hooks;
    });
    return this;
  },

  /**
   * Remove hook from the model
   *
   * @param {string} hookType @see {@link hookTypes}
   * @param {string|Function} name name of hook or function reference which was attached
   *
   * @memberof Sequelize
   * @memberof Sequelize.Model
   */
  removeHook(hookType, name) {
    const isReference = typeof name === 'function' ? true : false;

    if (!this.hasHook(hookType)) {
      return this;
    }

    debug(`removing hook ${hookType}`); // check for proxies, add them too

    hookType = getProxiedHooks(hookType);

    for (const type of hookType) {
      this.options.hooks[type] = this.options.hooks[type].filter(hook => {
        if (isReference && typeof hook === 'function') {
          return hook !== name; // check if same method
        }

        if (!isReference && typeof hook === 'object') {
          return hook.name !== name;
        }

        return true;
      });
    }

    return this;
  },

  /**
   * Check whether the mode has any hooks of this type
   *
   * @param {string} hookType @see {@link hookTypes}
   *
   * @alias hasHooks
   *
   * @memberof Sequelize
   * @memberof Sequelize.Model
   */
  hasHook(hookType) {
    return this.options.hooks[hookType] && !!this.options.hooks[hookType].length;
  }

};
Hooks.hasHooks = Hooks.hasHook;

function applyTo(target, isModel = false) {
  _.mixin(target, Hooks);

  for (const hook of Object.keys(hookTypes)) {
    if (isModel && hookTypes[hook].noModel) {
      continue;
    }

    target[hook] = function (name, callback) {
      return this.addHook(hook, name, callback);
    };
  }
}

exports.applyTo = applyTo;
/**
 * A hook that is run before validation
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance, options
 * @name beforeValidate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after validation
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance, options
 * @name afterValidate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run when validation fails
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance, options, error. Error is the
 * SequelizeValidationError. If the callback throws an error, it will replace the original validation error.
 * @name validationFailed
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before creating a single instance
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with attributes, options
 * @name beforeCreate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after creating a single instance
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with attributes, options
 * @name afterCreate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before creating or updating a single instance, It proxies `beforeCreate` and `beforeUpdate`
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with attributes, options
 * @name beforeSave
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before upserting
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with attributes, options
 * @name beforeUpsert
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after upserting
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with the result of upsert(), options
 * @name afterUpsert
 * @memberof Sequelize.Model
 */

/**
  * A hook that is run after creating or updating a single instance, It proxies `afterCreate` and `afterUpdate`
  * @param {string}   name
  * @param {Function} fn   A callback function that is called with attributes, options
  * @name afterSave
  * @memberof Sequelize.Model
  */

/**
 * A hook that is run before destroying a single instance
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance, options
 *
 * @name beforeDestroy
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after destroying a single instance
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance, options
 *
 * @name afterDestroy
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before restoring a single instance
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance, options
 *
 * @name beforeRestore
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after restoring a single instance
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance, options
 *
 * @name afterRestore
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before updating a single instance
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance, options
 * @name beforeUpdate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after updating a single instance
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance, options
 * @name afterUpdate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before creating instances in bulk
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instances, options
 * @name beforeBulkCreate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after creating instances in bulk
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instances, options
 * @name afterBulkCreate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before destroying instances in bulk
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 *
 * @name beforeBulkDestroy
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after destroying instances in bulk
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 *
 * @name afterBulkDestroy
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before restoring instances in bulk
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 *
 * @name beforeBulkRestore
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after restoring instances in bulk
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 *
 * @name afterBulkRestore
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before updating instances in bulk
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 * @name beforeBulkUpdate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after updating instances in bulk
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 * @name afterBulkUpdate
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before a find (select) query
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 * @name beforeFind
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before a find (select) query, after any { include: {all: ...} } options are expanded
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 * @name beforeFindAfterExpandIncludeAll
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before a find (select) query, after all option parsing is complete
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 * @name beforeFindAfterOptions
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run after a find (select) query
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with instance(s), options
 * @name afterFind
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before a count query
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options
 * @name beforeCount
 * @memberof Sequelize.Model
 */

/**
 * A hook that is run before a define call
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with attributes, options
 * @name beforeDefine
 * @memberof Sequelize
 */

/**
 * A hook that is run after a define call
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with factory
 * @name afterDefine
 * @memberof Sequelize
 */

/**
 * A hook that is run before Sequelize() call
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with config, options
 * @name beforeInit
 * @memberof Sequelize
 */

/**
 * A hook that is run after Sequelize() call
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with sequelize
 * @name afterInit
 * @memberof Sequelize
 */

/**
 * A hook that is run before a connection is created
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with config passed to connection
 * @name beforeConnect
 * @memberof Sequelize
 */

/**
 * A hook that is run after a connection is created
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with the connection object and the config passed to connection
 * @name afterConnect
 * @memberof Sequelize
 */

/**
 * A hook that is run before a connection is disconnected
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with the connection object
 * @name beforeDisconnect
 * @memberof Sequelize
 */

/**
 * A hook that is run after a connection is disconnected
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with the connection object
 * @name afterDisconnect
 * @memberof Sequelize
 */

/**
 * A hook that is run before Model.sync call
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options passed to Model.sync
 * @name beforeSync
 * @memberof Sequelize
 */

/**
 * A hook that is run after Model.sync call
 * @param {string}   name
 * @param {Function} fn   A callback function that is called with options passed to Model.sync
 * @name afterSync
 * @memberof Sequelize
 */

/**
  * A hook that is run before sequelize.sync call
  * @param {string}   name
  * @param {Function} fn   A callback function that is called with options passed to sequelize.sync
  * @name beforeBulkSync
  * @memberof Sequelize
  */

/**
  * A hook that is run after sequelize.sync call
  * @param {string}   name
  * @param {Function} fn   A callback function that is called with options passed to sequelize.sync
  * @name afterBulkSync
  * @memberof Sequelize
  */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9ob29rcy5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImxvZ2dlciIsIlByb21pc2UiLCJkZWJ1ZyIsImRlYnVnQ29udGV4dCIsImhvb2tUeXBlcyIsImJlZm9yZVZhbGlkYXRlIiwicGFyYW1zIiwiYWZ0ZXJWYWxpZGF0ZSIsInZhbGlkYXRpb25GYWlsZWQiLCJiZWZvcmVDcmVhdGUiLCJhZnRlckNyZWF0ZSIsImJlZm9yZURlc3Ryb3kiLCJhZnRlckRlc3Ryb3kiLCJiZWZvcmVSZXN0b3JlIiwiYWZ0ZXJSZXN0b3JlIiwiYmVmb3JlVXBkYXRlIiwiYWZ0ZXJVcGRhdGUiLCJiZWZvcmVTYXZlIiwicHJveGllcyIsImFmdGVyU2F2ZSIsImJlZm9yZVVwc2VydCIsImFmdGVyVXBzZXJ0IiwiYmVmb3JlQnVsa0NyZWF0ZSIsImFmdGVyQnVsa0NyZWF0ZSIsImJlZm9yZUJ1bGtEZXN0cm95IiwiYWZ0ZXJCdWxrRGVzdHJveSIsImJlZm9yZUJ1bGtSZXN0b3JlIiwiYWZ0ZXJCdWxrUmVzdG9yZSIsImJlZm9yZUJ1bGtVcGRhdGUiLCJhZnRlckJ1bGtVcGRhdGUiLCJiZWZvcmVGaW5kIiwiYmVmb3JlRmluZEFmdGVyRXhwYW5kSW5jbHVkZUFsbCIsImJlZm9yZUZpbmRBZnRlck9wdGlvbnMiLCJhZnRlckZpbmQiLCJiZWZvcmVDb3VudCIsImJlZm9yZURlZmluZSIsInN5bmMiLCJub01vZGVsIiwiYWZ0ZXJEZWZpbmUiLCJiZWZvcmVJbml0IiwiYWZ0ZXJJbml0IiwiYmVmb3JlQXNzb2NpYXRlIiwiYWZ0ZXJBc3NvY2lhdGUiLCJiZWZvcmVDb25uZWN0IiwiYWZ0ZXJDb25uZWN0IiwiYmVmb3JlRGlzY29ubmVjdCIsImFmdGVyRGlzY29ubmVjdCIsImJlZm9yZVN5bmMiLCJhZnRlclN5bmMiLCJiZWZvcmVCdWxrU3luYyIsImFmdGVyQnVsa1N5bmMiLCJiZWZvcmVRdWVyeSIsImFmdGVyUXVlcnkiLCJleHBvcnRzIiwiaG9va3MiLCJnZXRQcm94aWVkSG9va3MiLCJob29rVHlwZSIsImNvbmNhdCIsImdldEhvb2tzIiwiaG9va2VkIiwib3B0aW9ucyIsIkhvb2tzIiwiX3NldHVwSG9va3MiLCJtYXAiLCJob29rc0FycmF5IiwiaG9va05hbWUiLCJBcnJheSIsImlzQXJyYXkiLCJmb3JFYWNoIiwiaG9va0ZuIiwiYWRkSG9vayIsInJ1bkhvb2tzIiwiaG9va0FyZ3MiLCJFcnJvciIsInNlcXVlbGl6ZSIsImhvb2siLCJmbiIsImFwcGx5IiwiZWFjaCIsInJldHVybiIsIm5hbWUiLCJ0eXBlIiwicHVzaCIsInJlbW92ZUhvb2siLCJpc1JlZmVyZW5jZSIsImhhc0hvb2siLCJmaWx0ZXIiLCJsZW5ndGgiLCJoYXNIb29rcyIsImFwcGx5VG8iLCJ0YXJnZXQiLCJpc01vZGVsIiwibWl4aW4iLCJPYmplY3QiLCJrZXlzIiwiY2FsbGJhY2siXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBLE1BQU1BLENBQUMsR0FBR0MsT0FBTyxDQUFDLFFBQUQsQ0FBakI7O0FBQ0EsTUFBTTtBQUFFQyxFQUFBQTtBQUFGLElBQWFELE9BQU8sQ0FBQyxnQkFBRCxDQUExQjs7QUFDQSxNQUFNRSxPQUFPLEdBQUdGLE9BQU8sQ0FBQyxXQUFELENBQXZCOztBQUNBLE1BQU1HLEtBQUssR0FBR0YsTUFBTSxDQUFDRyxZQUFQLENBQW9CLE9BQXBCLENBQWQ7QUFFQSxNQUFNQyxTQUFTLEdBQUc7QUFDaEJDLEVBQUFBLGNBQWMsRUFBRTtBQUFFQyxJQUFBQSxNQUFNLEVBQUU7QUFBVixHQURBO0FBRWhCQyxFQUFBQSxhQUFhLEVBQUU7QUFBRUQsSUFBQUEsTUFBTSxFQUFFO0FBQVYsR0FGQztBQUdoQkUsRUFBQUEsZ0JBQWdCLEVBQUU7QUFBRUYsSUFBQUEsTUFBTSxFQUFFO0FBQVYsR0FIRjtBQUloQkcsRUFBQUEsWUFBWSxFQUFFO0FBQUVILElBQUFBLE1BQU0sRUFBRTtBQUFWLEdBSkU7QUFLaEJJLEVBQUFBLFdBQVcsRUFBRTtBQUFFSixJQUFBQSxNQUFNLEVBQUU7QUFBVixH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N0IsS0FBaEI7O0FBRUEsT0FBSyxNQUFNYyxJQUFYLElBQW1Ca0IsTUFBTSxDQUFDQyxJQUFQLENBQVkxRixTQUFaLENBQW5CLEVBQTJDO0FBQ3pDLFFBQUl1RixPQUFPLElBQUl2RixTQUFTLENBQUN1RSxJQUFELENBQVQsQ0FBZ0J0QyxPQUEvQixFQUF3QztBQUN0QztBQUNEOztBQUNEcUQsSUFBQUEsTUFBTSxDQUFDZixJQUFELENBQU4sR0FBZSxVQUFTSyxJQUFULEVBQWVlLFFBQWYsRUFBeUI7QUFDdEMsYUFBTyxLQUFLekIsT0FBTCxDQUFhSyxJQUFiLEVBQW1CSyxJQUFuQixFQUF5QmUsUUFBekIsQ0FBUDtBQUNELEtBRkQ7QUFHRDtBQUNGOztBQUNEMUMsT0FBTyxDQUFDb0MsT0FBUixHQUFrQkEsT0FBbEI7QUFFQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7O0FBU0E7Ozs7Ozs7O0FBUUE7Ozs7Ozs7O0FBUUE7Ozs7Ozs7O0FBUUE7Ozs7Ozs7O0FBUUE7Ozs7Ozs7O0FBUUE7Ozs7Ozs7O0FBUUE7Ozs7Ozs7OztBQVNBOzs7Ozs7Ozs7QUFTQTs7Ozs7Ozs7O0FBU0E7Ozs7Ozs7OztBQVNBOzs7Ozs7OztBQVFBOzs7Ozs7OztBQVFBOzs7Ozs7OztBQVFBOzs7Ozs7OztBQVFBOzs7Ozs7Ozs7QUFTQTs7Ozs7Ozs7O0FBU0E7Ozs7Ozs7OztBQVNBOzs7Ozs7Ozs7QUFTQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuY29uc3QgeyBsb2dnZXIgfSA9IHJlcXVpcmUoJy4vdXRpbHMvbG9nZ2VyJyk7XHJcbmNvbnN0IFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKTtcclxuY29uc3QgZGVidWcgPSBsb2dnZXIuZGVidWdDb250ZXh0KCdob29rcycpO1xyXG5cclxuY29uc3QgaG9va1R5cGVzID0ge1xyXG4gIGJlZm9yZVZhbGlkYXRlOiB7IHBhcmFtczogMiB9LFxyXG4gIGFmdGVyVmFsaWRhdGU6IHsgcGFyYW1zOiAyIH0sXHJcbiAgdmFsaWRhdGlvbkZhaWxlZDogeyBwYXJhbXM6IDMgfSxcclxuICBiZWZvcmVDcmVhdGU6IHsgcGFyYW1zOiAyIH0sXHJcbiAgYWZ0ZXJDcmVhdGU6IHsgcGFyYW1zOiAyIH0sXHJcbiAgYmVmb3JlRGVzdHJveTogeyBwYXJhbXM6IDIgfSxcclxuICBhZnRlckRlc3Ryb3k6IHsgcGFyYW1zOiAyIH0sXHJcbiAgYmVmb3JlUmVzdG9yZTogeyBwYXJhbXM6IDIgfSxcclxuICBhZnRlclJlc3RvcmU6IHsgcGFyYW1zOiAyIH0sXHJcbiAgYmVmb3JlVXBkYXRlOiB7IHBhcmFtczogMiB9LFxyXG4gIGFmdGVyVXBkYXRlOiB7IHBhcmFtczogMiB9LFxyXG4gIGJlZm9yZVNhdmU6IHsgcGFyYW1zOiAyLCBwcm94aWVzOiBbJ2JlZm9yZVVwZGF0ZScsICdiZWZvcmVDcmVhdGUnXSB9LFxyXG4gIGFmdGVyU2F2ZTogeyBwYXJhbXM6IDIsIHByb3hpZXM6IFsnYWZ0ZXJVcGRhdGUnLCAnYWZ0ZXJDcmVhdGUnXSB9LFxyXG4gIGJlZm9yZVVwc2VydDogeyBwYXJhbXM6IDIgfSxcclxuICBhZnRlclVwc2VydDogeyBwYXJhbXM6IDIgfSxcclxuICBiZWZvcmVCdWxrQ3JlYXRlOiB7IHBhcmFtczogMiB9LFxyXG4gIGFmdGVyQnVsa0NyZWF0ZTogeyBwYXJhbXM6IDIgfSxcclxuICBiZWZvcmVCdWxrRGVzdHJveTogeyBwYXJhbXM6IDEgfSxcclxuICBhZnRlckJ1bGtEZXN0cm95OiB7IHBhcmFtczogMSB9LFxyXG4gIGJlZm9yZUJ1bGtSZXN0b3JlOiB7IHBhcmFtczogMSB9LFxyXG4gIGFmdGVyQnVsa1Jlc3RvcmU6IHsgcGFyYW1zOiAxIH0sXHJcbiAgYmVmb3JlQnVsa1VwZGF0ZTogeyBwYXJhbXM6IDEgfSxcclxuICBhZnRlckJ1bGtVcGRhdGU6IHsgcGFyYW1zOiAxIH0sXHJcbiAgYmVmb3JlRmluZDogeyBwYXJhbXM6IDEgfSxcclxuICBiZWZvcmVGaW5kQWZ0ZXJFeHBhbmRJbmNsdWRlQWxsOiB7IHBhcmFtczogMSB9LFxyXG4gIGJlZm9yZUZpbmRBZnRlck9wdGlvbnM6IHsgcGFyYW1zOiAxIH0sXHJcbiAgYWZ0ZXJGaW5kOiB7IHBhcmFtczogMiB9LFxyXG4gIGJlZm9yZUNvdW50OiB7IHBhcmFtczogMSB9LFxyXG4gIGJlZm9yZURlZmluZTogeyBwYXJhbXM6IDIsIHN5bmM6IHRydWUsIG5vTW9kZWw6IHRydWUgfSxcclxuICBhZnRlckRlZmluZTogeyBwYXJhbXM6IDEsIHN5bmM6IHRydWUsIG5vTW9kZWw6IHRydWUgfSxcclxuICBiZWZvcmVJbml0OiB7IHBhcmFtczogMiwgc3luYzogdHJ1ZSwgbm9Nb2RlbDogdHJ1ZSB9LFxyXG4gIGFmdGVySW5pdDogeyBwYXJhbXM6IDEsIHN5bmM6IHRydWUsIG5vTW9kZWw6IHRydWUgfSxcclxuICBiZWZvcmVBc3NvY2lhdGU6IHsgcGFyYW1zOiAyLCBzeW5jOiB0cnVlIH0sXHJcbiAgYWZ0ZXJBc3NvY2lhdGU6IHsgcGFyYW1zOiAyLCBzeW5jOiB0cnVlIH0sXHJcbiAgYmVmb3JlQ29ubmVjdDogeyBwYXJhbXM6IDEsIG5vTW9kZWw6IHRydWUgfSxcclxuICBhZnRlckNvbm5lY3Q6IHsgcGFyYW1zOiAyLCBub01vZGVsOiB0cnVlIH0sXHJcbiAgYmVmb3JlRGlzY29ubmVjdDogeyBwYXJhbXM6IDEsIG5vTW9kZWw6IHRydWUgfSxcclxuICBhZnRlckRpc2Nvbm5lY3Q6IHsgcGFyYW1zOiAxLCBub01vZGVsOiB0cnVlIH0sXHJcbiAgYmVmb3JlU3luYzogeyBwYXJhbXM6IDEgfSxcclxuICBhZnRlclN5bmM6IHsgcGFyYW1zOiAxIH0sXHJcbiAgYmVmb3JlQnVsa1N5bmM6IHsgcGFyYW1zOiAxIH0sXHJcbiAgYWZ0ZXJCdWxrU3luYzogeyBwYXJhbXM6IDEgfSxcclxuICBiZWZvcmVRdWVyeTogeyBwYXJhbXM6IDIgfSxcclxuICBhZnRlclF1ZXJ5OiB7IHBhcmFtczogMiB9XHJcbn07XHJcbmV4cG9ydHMuaG9va3MgPSBob29rVHlwZXM7XHJcblxyXG5cclxuLyoqXHJcbiAqIGdldCBhcnJheSBvZiBjdXJyZW50IGhvb2sgYW5kIGl0cyBwcm94aWVzIGNvbWJpbmVkXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBob29rVHlwZSBhbnkgaG9vayB0eXBlIEBzZWUge0BsaW5rIGhvb2tUeXBlc31cclxuICpcclxuICogQHByaXZhdGVcclxuICovXHJcbmNvbnN0IGdldFByb3hpZWRIb29rcyA9IGhvb2tUeXBlID0+XHJcbiAgaG9va1R5cGVzW2hvb2tUeXBlXS5wcm94aWVzXHJcbiAgICA/IGhvb2tUeXBlc1tob29rVHlwZV0ucHJveGllcy5jb25jYXQoaG9va1R5cGUpXHJcbiAgICA6IFtob29rVHlwZV1cclxuO1xyXG5cclxuZnVuY3Rpb24gZ2V0SG9va3MoaG9va2VkLCBob29rVHlwZSkge1xyXG4gIHJldHVybiAoaG9va2VkLm9wdGlvbnMuaG9va3MgfHwge30pW2hvb2tUeXBlXSB8fCBbXTtcclxufVxyXG5cclxuY29uc3QgSG9va3MgPSB7XHJcbiAgLyoqXHJcbiAgICogUHJvY2VzcyB1c2VyIHN1cHBsaWVkIGhvb2tzIGRlZmluaXRpb25cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBob29rcyBob29rcyBkZWZpbml0aW9uXHJcbiAgICpcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAgICovXHJcbiAgX3NldHVwSG9va3MoaG9va3MpIHtcclxuICAgIHRoaXMub3B0aW9ucy5ob29rcyA9IHt9O1xyXG4gICAgXy5tYXAoaG9va3MgfHwge30sIChob29rc0FycmF5LCBob29rTmFtZSkgPT4ge1xyXG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaG9va3NBcnJheSkpIGhvb2tzQXJyYXkgPSBbaG9va3NBcnJheV07XHJcbiAgICAgIGhvb2tzQXJyYXkuZm9yRWFjaChob29rRm4gPT4gdGhpcy5hZGRIb29rKGhvb2tOYW1lLCBob29rRm4pKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIHJ1bkhvb2tzKGhvb2tzLCAuLi5ob29rQXJncykge1xyXG4gICAgaWYgKCFob29rcykgdGhyb3cgbmV3IEVycm9yKCdydW5Ib29rcyByZXF1aXJlcyBhdCBsZWFzdCAxIGFyZ3VtZW50Jyk7XHJcblxyXG4gICAgbGV0IGhvb2tUeXBlO1xyXG5cclxuICAgIGlmICh0eXBlb2YgaG9va3MgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGhvb2tUeXBlID0gaG9va3M7XHJcbiAgICAgIGhvb2tzID0gZ2V0SG9va3ModGhpcywgaG9va1R5cGUpO1xyXG5cclxuICAgICAgaWYgKHRoaXMuc2VxdWVsaXplKSB7XHJcbiAgICAgICAgaG9va3MgPSBob29rcy5jb25jYXQoZ2V0SG9va3ModGhpcy5zZXF1ZWxpemUsIGhvb2tUeXBlKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoaG9va3MpKSB7XHJcbiAgICAgIGhvb2tzID0gW2hvb2tzXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzeW5jaHJvbm91cyBob29rc1xyXG4gICAgaWYgKGhvb2tUeXBlc1tob29rVHlwZV0gJiYgaG9va1R5cGVzW2hvb2tUeXBlXS5zeW5jKSB7XHJcbiAgICAgIGZvciAobGV0IGhvb2sgb2YgaG9va3MpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGhvb2sgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICBob29rID0gaG9vay5mbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRlYnVnKGBydW5uaW5nIGhvb2soc3luYykgJHtob29rVHlwZX1gKTtcclxuICAgICAgICBob29rLmFwcGx5KHRoaXMsIGhvb2tBcmdzKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYXN5bmNocm9ub3VzIGhvb2tzIChkZWZhdWx0KVxyXG4gICAgcmV0dXJuIFByb21pc2UuZWFjaChob29rcywgaG9vayA9PiB7XHJcbiAgICAgIGlmICh0eXBlb2YgaG9vayA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBob29rID0gaG9vay5mbjtcclxuICAgICAgfVxyXG5cclxuICAgICAgZGVidWcoYHJ1bm5pbmcgaG9vayAke2hvb2tUeXBlfWApO1xyXG4gICAgICByZXR1cm4gaG9vay5hcHBseSh0aGlzLCBob29rQXJncyk7XHJcbiAgICB9KS5yZXR1cm4oKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYSBob29rIHRvIHRoZSBtb2RlbFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIGhvb2tUeXBlIGhvb2sgbmFtZSBAc2VlIHtAbGluayBob29rVHlwZXN9XHJcbiAgICogQHBhcmFtIHtzdHJpbmd8RnVuY3Rpb259IFtuYW1lXSBQcm92aWRlIGEgbmFtZSBmb3IgdGhlIGhvb2sgZnVuY3Rpb24uIEl0IGNhbiBiZSB1c2VkIHRvIHJlbW92ZSB0aGUgaG9vayBsYXRlciBvciB0byBvcmRlciBob29rcyBiYXNlZCBvbiBzb21lIHNvcnQgb2YgcHJpb3JpdHkgc3lzdGVtIGluIHRoZSBmdXR1cmUuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgICAgIGZuIFRoZSBob29rIGZ1bmN0aW9uXHJcbiAgICpcclxuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXHJcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gICAqL1xyXG4gIGFkZEhvb2soaG9va1R5cGUsIG5hbWUsIGZuKSB7XHJcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgZm4gPSBuYW1lO1xyXG4gICAgICBuYW1lID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBkZWJ1ZyhgYWRkaW5nIGhvb2sgJHtob29rVHlwZX1gKTtcclxuICAgIC8vIGNoZWNrIGZvciBwcm94aWVzLCBhZGQgdGhlbSB0b29cclxuICAgIGhvb2tUeXBlID0gZ2V0UHJveGllZEhvb2tzKGhvb2tUeXBlKTtcclxuXHJcbiAgICBob29rVHlwZS5mb3JFYWNoKHR5cGUgPT4ge1xyXG4gICAgICBjb25zdCBob29rcyA9IGdldEhvb2tzKHRoaXMsIHR5cGUpO1xyXG4gICAgICBob29rcy5wdXNoKG5hbWUgPyB7IG5hbWUsIGZuIH0gOiBmbik7XHJcbiAgICAgIHRoaXMub3B0aW9ucy5ob29rc1t0eXBlXSA9IGhvb2tzO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGhvb2sgZnJvbSB0aGUgbW9kZWxcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBob29rVHlwZSBAc2VlIHtAbGluayBob29rVHlwZXN9XHJcbiAgICogQHBhcmFtIHtzdHJpbmd8RnVuY3Rpb259IG5hbWUgbmFtZSBvZiBob29rIG9yIGZ1bmN0aW9uIHJlZmVyZW5jZSB3aGljaCB3YXMgYXR0YWNoZWRcclxuICAgKlxyXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAgICovXHJcbiAgcmVtb3ZlSG9vayhob29rVHlwZSwgbmFtZSkge1xyXG4gICAgY29uc3QgaXNSZWZlcmVuY2UgPSB0eXBlb2YgbmFtZSA9PT0gJ2Z1bmN0aW9uJyA/IHRydWUgOiBmYWxzZTtcclxuXHJcbiAgICBpZiAoIXRoaXMuaGFzSG9vayhob29rVHlwZSkpIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgZGVidWcoYHJlbW92aW5nIGhvb2sgJHtob29rVHlwZX1gKTtcclxuXHJcbiAgICAvLyBjaGVjayBmb3IgcHJveGllcywgYWRkIHRoZW0gdG9vXHJcbiAgICBob29rVHlwZSA9IGdldFByb3hpZWRIb29rcyhob29rVHlwZSk7XHJcblxyXG4gICAgZm9yIChjb25zdCB0eXBlIG9mIGhvb2tUeXBlKSB7XHJcbiAgICAgIHRoaXMub3B0aW9ucy5ob29rc1t0eXBlXSA9IHRoaXMub3B0aW9ucy5ob29rc1t0eXBlXS5maWx0ZXIoaG9vayA9PiB7XHJcbiAgICAgICAgaWYgKGlzUmVmZXJlbmNlICYmIHR5cGVvZiBob29rID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICByZXR1cm4gaG9vayAhPT0gbmFtZTsgLy8gY2hlY2sgaWYgc2FtZSBtZXRob2RcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFpc1JlZmVyZW5jZSAmJiB0eXBlb2YgaG9vayA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgIHJldHVybiBob29rLm5hbWUgIT09IG5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBtb2RlIGhhcyBhbnkgaG9va3Mgb2YgdGhpcyB0eXBlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaG9va1R5cGUgQHNlZSB7QGxpbmsgaG9va1R5cGVzfVxyXG4gICAqXHJcbiAgICogQGFsaWFzIGhhc0hvb2tzXHJcbiAgICpcclxuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXHJcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gICAqL1xyXG4gIGhhc0hvb2soaG9va1R5cGUpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuaG9va3NbaG9va1R5cGVdICYmICEhdGhpcy5vcHRpb25zLmhvb2tzW2hvb2tUeXBlXS5sZW5ndGg7XHJcbiAgfVxyXG59O1xyXG5Ib29rcy5oYXNIb29rcyA9IEhvb2tzLmhhc0hvb2s7XHJcblxyXG5cclxuZnVuY3Rpb24gYXBwbHlUbyh0YXJnZXQsIGlzTW9kZWwgPSBmYWxzZSkge1xyXG4gIF8ubWl4aW4odGFyZ2V0LCBIb29rcyk7XHJcblxyXG4gIGZvciAoY29uc3QgaG9vayBvZiBPYmplY3Qua2V5cyhob29rVHlwZXMpKSB7XHJcbiAgICBpZiAoaXNNb2RlbCAmJiBob29rVHlwZXNbaG9va10ubm9Nb2RlbCkge1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuICAgIHRhcmdldFtob29rXSA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmFkZEhvb2soaG9vaywgbmFtZSwgY2FsbGJhY2spO1xyXG4gICAgfTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy5hcHBseVRvID0gYXBwbHlUbztcclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIHZhbGlkYXRpb25cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBpbnN0YW5jZSwgb3B0aW9uc1xyXG4gKiBAbmFtZSBiZWZvcmVWYWxpZGF0ZVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciB2YWxpZGF0aW9uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggaW5zdGFuY2UsIG9wdGlvbnNcclxuICogQG5hbWUgYWZ0ZXJWYWxpZGF0ZVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biB3aGVuIHZhbGlkYXRpb24gZmFpbHNcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBpbnN0YW5jZSwgb3B0aW9ucywgZXJyb3IuIEVycm9yIGlzIHRoZVxyXG4gKiBTZXF1ZWxpemVWYWxpZGF0aW9uRXJyb3IuIElmIHRoZSBjYWxsYmFjayB0aHJvd3MgYW4gZXJyb3IsIGl0IHdpbGwgcmVwbGFjZSB0aGUgb3JpZ2luYWwgdmFsaWRhdGlvbiBlcnJvci5cclxuICogQG5hbWUgdmFsaWRhdGlvbkZhaWxlZFxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgY3JlYXRpbmcgYSBzaW5nbGUgaW5zdGFuY2VcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBhdHRyaWJ1dGVzLCBvcHRpb25zXHJcbiAqIEBuYW1lIGJlZm9yZUNyZWF0ZVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBjcmVhdGluZyBhIHNpbmdsZSBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGF0dHJpYnV0ZXMsIG9wdGlvbnNcclxuICogQG5hbWUgYWZ0ZXJDcmVhdGVcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIGNyZWF0aW5nIG9yIHVwZGF0aW5nIGEgc2luZ2xlIGluc3RhbmNlLCBJdCBwcm94aWVzIGBiZWZvcmVDcmVhdGVgIGFuZCBgYmVmb3JlVXBkYXRlYFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGF0dHJpYnV0ZXMsIG9wdGlvbnNcclxuICogQG5hbWUgYmVmb3JlU2F2ZVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgdXBzZXJ0aW5nXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggYXR0cmlidXRlcywgb3B0aW9uc1xyXG4gKiBAbmFtZSBiZWZvcmVVcHNlcnRcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgdXBzZXJ0aW5nXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggdGhlIHJlc3VsdCBvZiB1cHNlcnQoKSwgb3B0aW9uc1xyXG4gKiBAbmFtZSBhZnRlclVwc2VydFxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAgKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgY3JlYXRpbmcgb3IgdXBkYXRpbmcgYSBzaW5nbGUgaW5zdGFuY2UsIEl0IHByb3hpZXMgYGFmdGVyQ3JlYXRlYCBhbmQgYGFmdGVyVXBkYXRlYFxyXG4gICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggYXR0cmlidXRlcywgb3B0aW9uc1xyXG4gICogQG5hbWUgYWZ0ZXJTYXZlXHJcbiAgKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAgKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIGRlc3Ryb3lpbmcgYSBzaW5nbGUgaW5zdGFuY2VcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBpbnN0YW5jZSwgb3B0aW9uc1xyXG4gKlxyXG4gKiBAbmFtZSBiZWZvcmVEZXN0cm95XHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIGRlc3Ryb3lpbmcgYSBzaW5nbGUgaW5zdGFuY2VcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBpbnN0YW5jZSwgb3B0aW9uc1xyXG4gKlxyXG4gKiBAbmFtZSBhZnRlckRlc3Ryb3lcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIHJlc3RvcmluZyBhIHNpbmdsZSBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlLCBvcHRpb25zXHJcbiAqXHJcbiAqIEBuYW1lIGJlZm9yZVJlc3RvcmVcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgcmVzdG9yaW5nIGEgc2luZ2xlIGluc3RhbmNlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggaW5zdGFuY2UsIG9wdGlvbnNcclxuICpcclxuICogQG5hbWUgYWZ0ZXJSZXN0b3JlXHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSB1cGRhdGluZyBhIHNpbmdsZSBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlLCBvcHRpb25zXHJcbiAqIEBuYW1lIGJlZm9yZVVwZGF0ZVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciB1cGRhdGluZyBhIHNpbmdsZSBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlLCBvcHRpb25zXHJcbiAqIEBuYW1lIGFmdGVyVXBkYXRlXHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSBjcmVhdGluZyBpbnN0YW5jZXMgaW4gYnVsa1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlcywgb3B0aW9uc1xyXG4gKiBAbmFtZSBiZWZvcmVCdWxrQ3JlYXRlXHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIGNyZWF0aW5nIGluc3RhbmNlcyBpbiBidWxrXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggaW5zdGFuY2VzLCBvcHRpb25zXHJcbiAqIEBuYW1lIGFmdGVyQnVsa0NyZWF0ZVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgZGVzdHJveWluZyBpbnN0YW5jZXMgaW4gYnVsa1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnNcclxuICpcclxuICogQG5hbWUgYmVmb3JlQnVsa0Rlc3Ryb3lcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgZGVzdHJveWluZyBpbnN0YW5jZXMgaW4gYnVsa1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnNcclxuICpcclxuICogQG5hbWUgYWZ0ZXJCdWxrRGVzdHJveVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgcmVzdG9yaW5nIGluc3RhbmNlcyBpbiBidWxrXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggb3B0aW9uc1xyXG4gKlxyXG4gKiBAbmFtZSBiZWZvcmVCdWxrUmVzdG9yZVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciByZXN0b3JpbmcgaW5zdGFuY2VzIGluIGJ1bGtcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBvcHRpb25zXHJcbiAqXHJcbiAqIEBuYW1lIGFmdGVyQnVsa1Jlc3RvcmVcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIHVwZGF0aW5nIGluc3RhbmNlcyBpbiBidWxrXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggb3B0aW9uc1xyXG4gKiBAbmFtZSBiZWZvcmVCdWxrVXBkYXRlXHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIHVwZGF0aW5nIGluc3RhbmNlcyBpbiBidWxrXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggb3B0aW9uc1xyXG4gKiBAbmFtZSBhZnRlckJ1bGtVcGRhdGVcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIGEgZmluZCAoc2VsZWN0KSBxdWVyeVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnNcclxuICogQG5hbWUgYmVmb3JlRmluZFxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgYSBmaW5kIChzZWxlY3QpIHF1ZXJ5LCBhZnRlciBhbnkgeyBpbmNsdWRlOiB7YWxsOiAuLi59IH0gb3B0aW9ucyBhcmUgZXhwYW5kZWRcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBvcHRpb25zXHJcbiAqIEBuYW1lIGJlZm9yZUZpbmRBZnRlckV4cGFuZEluY2x1ZGVBbGxcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIGEgZmluZCAoc2VsZWN0KSBxdWVyeSwgYWZ0ZXIgYWxsIG9wdGlvbiBwYXJzaW5nIGlzIGNvbXBsZXRlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggb3B0aW9uc1xyXG4gKiBAbmFtZSBiZWZvcmVGaW5kQWZ0ZXJPcHRpb25zXHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIGEgZmluZCAoc2VsZWN0KSBxdWVyeVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlKHMpLCBvcHRpb25zXHJcbiAqIEBuYW1lIGFmdGVyRmluZFxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgYSBjb3VudCBxdWVyeVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnNcclxuICogQG5hbWUgYmVmb3JlQ291bnRcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIGEgZGVmaW5lIGNhbGxcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBhdHRyaWJ1dGVzLCBvcHRpb25zXHJcbiAqIEBuYW1lIGJlZm9yZURlZmluZVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBhIGRlZmluZSBjYWxsXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggZmFjdG9yeVxyXG4gKiBAbmFtZSBhZnRlckRlZmluZVxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgU2VxdWVsaXplKCkgY2FsbFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGNvbmZpZywgb3B0aW9uc1xyXG4gKiBAbmFtZSBiZWZvcmVJbml0XHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIFNlcXVlbGl6ZSgpIGNhbGxcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBzZXF1ZWxpemVcclxuICogQG5hbWUgYWZ0ZXJJbml0XHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSBhIGNvbm5lY3Rpb24gaXMgY3JlYXRlZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGNvbmZpZyBwYXNzZWQgdG8gY29ubmVjdGlvblxyXG4gKiBAbmFtZSBiZWZvcmVDb25uZWN0XHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIGEgY29ubmVjdGlvbiBpcyBjcmVhdGVkXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggdGhlIGNvbm5lY3Rpb24gb2JqZWN0IGFuZCB0aGUgY29uZmlnIHBhc3NlZCB0byBjb25uZWN0aW9uXHJcbiAqIEBuYW1lIGFmdGVyQ29ubmVjdFxyXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgYSBjb25uZWN0aW9uIGlzIGRpc2Nvbm5lY3RlZFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIHRoZSBjb25uZWN0aW9uIG9iamVjdFxyXG4gKiBAbmFtZSBiZWZvcmVEaXNjb25uZWN0XHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIGEgY29ubmVjdGlvbiBpcyBkaXNjb25uZWN0ZWRcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCB0aGUgY29ubmVjdGlvbiBvYmplY3RcclxuICogQG5hbWUgYWZ0ZXJEaXNjb25uZWN0XHJcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICovXHJcblxyXG4vKipcclxuICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSBNb2RlbC5zeW5jIGNhbGxcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBvcHRpb25zIHBhc3NlZCB0byBNb2RlbC5zeW5jXHJcbiAqIEBuYW1lIGJlZm9yZVN5bmNcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgTW9kZWwuc3luYyBjYWxsXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggb3B0aW9ucyBwYXNzZWQgdG8gTW9kZWwuc3luY1xyXG4gKiBAbmFtZSBhZnRlclN5bmNcclxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSBzZXF1ZWxpemUuc3luYyBjYWxsXHJcbiAgKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXHJcbiAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBvcHRpb25zIHBhc3NlZCB0byBzZXF1ZWxpemUuc3luY1xyXG4gICogQG5hbWUgYmVmb3JlQnVsa1N5bmNcclxuICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICAqL1xyXG5cclxuLyoqXHJcbiAgKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgc2VxdWVsaXplLnN5bmMgY2FsbFxyXG4gICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxyXG4gICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggb3B0aW9ucyBwYXNzZWQgdG8gc2VxdWVsaXplLnN5bmNcclxuICAqIEBuYW1lIGFmdGVyQnVsa1N5bmNcclxuICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcclxuICAqL1xyXG4iXX0=