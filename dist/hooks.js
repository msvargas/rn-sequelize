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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9ob29rcy5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsImxvZ2dlciIsIlByb21pc2UiLCJkZWJ1ZyIsImRlYnVnQ29udGV4dCIsImhvb2tUeXBlcyIsImJlZm9yZVZhbGlkYXRlIiwicGFyYW1zIiwiYWZ0ZXJWYWxpZGF0ZSIsInZhbGlkYXRpb25GYWlsZWQiLCJiZWZvcmVDcmVhdGUiLCJhZnRlckNyZWF0ZSIsImJlZm9yZURlc3Ryb3kiLCJhZnRlckRlc3Ryb3kiLCJiZWZvcmVSZXN0b3JlIiwiYWZ0ZXJSZXN0b3JlIiwiYmVmb3JlVXBkYXRlIiwiYWZ0ZXJVcGRhdGUiLCJiZWZvcmVTYXZlIiwicHJveGllcyIsImFmdGVyU2F2ZSIsImJlZm9yZVVwc2VydCIsImFmdGVyVXBzZXJ0IiwiYmVmb3JlQnVsa0NyZWF0ZSIsImFmdGVyQnVsa0NyZWF0ZSIsImJlZm9yZUJ1bGtEZXN0cm95IiwiYWZ0ZXJCdWxrRGVzdHJveSIsImJlZm9yZUJ1bGtSZXN0b3JlIiwiYWZ0ZXJCdWxrUmVzdG9yZSIsImJlZm9yZUJ1bGtVcGRhdGUiLCJhZnRlckJ1bGtVcGRhdGUiLCJiZWZvcmVGaW5kIiwiYmVmb3JlRmluZEFmdGVyRXhwYW5kSW5jbHVkZUFsbCIsImJlZm9yZUZpbmRBZnRlck9wdGlvbnMiLCJhZnRlckZpbmQiLCJiZWZvcmVDb3VudCIsImJlZm9yZURlZmluZSIsInN5bmMiLCJub01vZGVsIiwiYWZ0ZXJEZWZpbmUiLCJiZWZvcmVJbml0IiwiYWZ0ZXJJbml0IiwiYmVmb3JlQXNzb2NpYXRlIiwiYWZ0ZXJBc3NvY2lhdGUiLCJiZWZvcmVDb25uZWN0IiwiYWZ0ZXJDb25uZWN0IiwiYmVmb3JlRGlzY29ubmVjdCIsImFmdGVyRGlzY29ubmVjdCIsImJlZm9yZVN5bmMiLCJhZnRlclN5bmMiLCJiZWZvcmVCdWxrU3luYyIsImFmdGVyQnVsa1N5bmMiLCJiZWZvcmVRdWVyeSIsImFmdGVyUXVlcnkiLCJleHBvcnRzIiwiaG9va3MiLCJnZXRQcm94aWVkSG9va3MiLCJob29rVHlwZSIsImNvbmNhdCIsImdldEhvb2tzIiwiaG9va2VkIiwib3B0aW9ucyIsIkhvb2tzIiwiX3NldHVwSG9va3MiLCJtYXAiLCJob29rc0FycmF5IiwiaG9va05hbWUiLCJBcnJheSIsImlzQXJyYXkiLCJmb3JFYWNoIiwiaG9va0ZuIiwiYWRkSG9vayIsInJ1bkhvb2tzIiwiaG9va0FyZ3MiLCJFcnJvciIsInNlcXVlbGl6ZSIsImhvb2siLCJmbiIsImFwcGx5IiwiZWFjaCIsInJldHVybiIsIm5hbWUiLCJ0eXBlIiwicHVzaCIsInJlbW92ZUhvb2siLCJpc1JlZmVyZW5jZSIsImhhc0hvb2siLCJmaWx0ZXIiLCJsZW5ndGgiLCJoYXNIb29rcyIsImFwcGx5VG8iLCJ0YXJnZXQiLCJpc01vZGVsIiwibWl4aW4iLCJPYmplY3QiLCJrZXlzIiwiY2FsbGJhY2siXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBLE1BQU1BLENBQUMsR0FBR0MsT0FBTyxDQUFDLFFBQUQsQ0FBakI7O0FBQ0EsTUFBTTtBQUFFQyxFQUFBQTtBQUFGLElBQWFELE9BQU8sQ0FBQyxnQkFBRCxDQUExQjs7QUFDQSxNQUFNRSxPQUFPLEdBQUdGLE9BQU8sQ0FBQyxXQUFELENBQXZCOztBQUNBLE1BQU1HLEtBQUssR0FBR0YsTUFBTSxDQUFDRyxZQUFQLENBQW9CLE9BQXBCLENBQWQ7QUFFQSxNQUFNQyxTQUFTLEdBQUc7QUFDaEJDLEVBQUFBLGNBQWMsRUFBRTtBQUFFQyxJQUFBQSxNQUFNLEVBQUU7QUFBVixHQURBO0FBRWhCQyxFQUFBQSxhQUFhLEVBQUU7QUFBRUQsSUFBQUEsTUFBTSxFQUFFO0FBQVYsR0FGQztBQUdoQkUsRUFBQUEsZ0JBQWdCLEVBQUU7QUFBRUYsSUFBQUEsTUFBTSxFQUFFO0FBQVYsR0FIRjtBQUloQkcsRUFBQUEsWUFBWSxFQUFFO0FBQUVILElBQUFBLE1BQU0sRUFBRTtBQUFWLEdBSkU7QUFLaEJJLEVBQUFBLFdBQVcsRUFBRTtBQUFFSixJQUFBQSxNQUFNLEVBQUU7QUFBVixH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Q0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IHsgbG9nZ2VyIH0gPSByZXF1aXJlKCcuL3V0aWxzL2xvZ2dlcicpO1xuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpO1xuY29uc3QgZGVidWcgPSBsb2dnZXIuZGVidWdDb250ZXh0KCdob29rcycpO1xuXG5jb25zdCBob29rVHlwZXMgPSB7XG4gIGJlZm9yZVZhbGlkYXRlOiB7IHBhcmFtczogMiB9LFxuICBhZnRlclZhbGlkYXRlOiB7IHBhcmFtczogMiB9LFxuICB2YWxpZGF0aW9uRmFpbGVkOiB7IHBhcmFtczogMyB9LFxuICBiZWZvcmVDcmVhdGU6IHsgcGFyYW1zOiAyIH0sXG4gIGFmdGVyQ3JlYXRlOiB7IHBhcmFtczogMiB9LFxuICBiZWZvcmVEZXN0cm95OiB7IHBhcmFtczogMiB9LFxuICBhZnRlckRlc3Ryb3k6IHsgcGFyYW1zOiAyIH0sXG4gIGJlZm9yZVJlc3RvcmU6IHsgcGFyYW1zOiAyIH0sXG4gIGFmdGVyUmVzdG9yZTogeyBwYXJhbXM6IDIgfSxcbiAgYmVmb3JlVXBkYXRlOiB7IHBhcmFtczogMiB9LFxuICBhZnRlclVwZGF0ZTogeyBwYXJhbXM6IDIgfSxcbiAgYmVmb3JlU2F2ZTogeyBwYXJhbXM6IDIsIHByb3hpZXM6IFsnYmVmb3JlVXBkYXRlJywgJ2JlZm9yZUNyZWF0ZSddIH0sXG4gIGFmdGVyU2F2ZTogeyBwYXJhbXM6IDIsIHByb3hpZXM6IFsnYWZ0ZXJVcGRhdGUnLCAnYWZ0ZXJDcmVhdGUnXSB9LFxuICBiZWZvcmVVcHNlcnQ6IHsgcGFyYW1zOiAyIH0sXG4gIGFmdGVyVXBzZXJ0OiB7IHBhcmFtczogMiB9LFxuICBiZWZvcmVCdWxrQ3JlYXRlOiB7IHBhcmFtczogMiB9LFxuICBhZnRlckJ1bGtDcmVhdGU6IHsgcGFyYW1zOiAyIH0sXG4gIGJlZm9yZUJ1bGtEZXN0cm95OiB7IHBhcmFtczogMSB9LFxuICBhZnRlckJ1bGtEZXN0cm95OiB7IHBhcmFtczogMSB9LFxuICBiZWZvcmVCdWxrUmVzdG9yZTogeyBwYXJhbXM6IDEgfSxcbiAgYWZ0ZXJCdWxrUmVzdG9yZTogeyBwYXJhbXM6IDEgfSxcbiAgYmVmb3JlQnVsa1VwZGF0ZTogeyBwYXJhbXM6IDEgfSxcbiAgYWZ0ZXJCdWxrVXBkYXRlOiB7IHBhcmFtczogMSB9LFxuICBiZWZvcmVGaW5kOiB7IHBhcmFtczogMSB9LFxuICBiZWZvcmVGaW5kQWZ0ZXJFeHBhbmRJbmNsdWRlQWxsOiB7IHBhcmFtczogMSB9LFxuICBiZWZvcmVGaW5kQWZ0ZXJPcHRpb25zOiB7IHBhcmFtczogMSB9LFxuICBhZnRlckZpbmQ6IHsgcGFyYW1zOiAyIH0sXG4gIGJlZm9yZUNvdW50OiB7IHBhcmFtczogMSB9LFxuICBiZWZvcmVEZWZpbmU6IHsgcGFyYW1zOiAyLCBzeW5jOiB0cnVlLCBub01vZGVsOiB0cnVlIH0sXG4gIGFmdGVyRGVmaW5lOiB7IHBhcmFtczogMSwgc3luYzogdHJ1ZSwgbm9Nb2RlbDogdHJ1ZSB9LFxuICBiZWZvcmVJbml0OiB7IHBhcmFtczogMiwgc3luYzogdHJ1ZSwgbm9Nb2RlbDogdHJ1ZSB9LFxuICBhZnRlckluaXQ6IHsgcGFyYW1zOiAxLCBzeW5jOiB0cnVlLCBub01vZGVsOiB0cnVlIH0sXG4gIGJlZm9yZUFzc29jaWF0ZTogeyBwYXJhbXM6IDIsIHN5bmM6IHRydWUgfSxcbiAgYWZ0ZXJBc3NvY2lhdGU6IHsgcGFyYW1zOiAyLCBzeW5jOiB0cnVlIH0sXG4gIGJlZm9yZUNvbm5lY3Q6IHsgcGFyYW1zOiAxLCBub01vZGVsOiB0cnVlIH0sXG4gIGFmdGVyQ29ubmVjdDogeyBwYXJhbXM6IDIsIG5vTW9kZWw6IHRydWUgfSxcbiAgYmVmb3JlRGlzY29ubmVjdDogeyBwYXJhbXM6IDEsIG5vTW9kZWw6IHRydWUgfSxcbiAgYWZ0ZXJEaXNjb25uZWN0OiB7IHBhcmFtczogMSwgbm9Nb2RlbDogdHJ1ZSB9LFxuICBiZWZvcmVTeW5jOiB7IHBhcmFtczogMSB9LFxuICBhZnRlclN5bmM6IHsgcGFyYW1zOiAxIH0sXG4gIGJlZm9yZUJ1bGtTeW5jOiB7IHBhcmFtczogMSB9LFxuICBhZnRlckJ1bGtTeW5jOiB7IHBhcmFtczogMSB9LFxuICBiZWZvcmVRdWVyeTogeyBwYXJhbXM6IDIgfSxcbiAgYWZ0ZXJRdWVyeTogeyBwYXJhbXM6IDIgfVxufTtcbmV4cG9ydHMuaG9va3MgPSBob29rVHlwZXM7XG5cblxuLyoqXG4gKiBnZXQgYXJyYXkgb2YgY3VycmVudCBob29rIGFuZCBpdHMgcHJveGllcyBjb21iaW5lZFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBob29rVHlwZSBhbnkgaG9vayB0eXBlIEBzZWUge0BsaW5rIGhvb2tUeXBlc31cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCBnZXRQcm94aWVkSG9va3MgPSBob29rVHlwZSA9PlxuICBob29rVHlwZXNbaG9va1R5cGVdLnByb3hpZXNcbiAgICA/IGhvb2tUeXBlc1tob29rVHlwZV0ucHJveGllcy5jb25jYXQoaG9va1R5cGUpXG4gICAgOiBbaG9va1R5cGVdXG47XG5cbmZ1bmN0aW9uIGdldEhvb2tzKGhvb2tlZCwgaG9va1R5cGUpIHtcbiAgcmV0dXJuIChob29rZWQub3B0aW9ucy5ob29rcyB8fCB7fSlbaG9va1R5cGVdIHx8IFtdO1xufVxuXG5jb25zdCBIb29rcyA9IHtcbiAgLyoqXG4gICAqIFByb2Nlc3MgdXNlciBzdXBwbGllZCBob29rcyBkZWZpbml0aW9uXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBob29rcyBob29rcyBkZWZpbml0aW9uXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxuICAgKi9cbiAgX3NldHVwSG9va3MoaG9va3MpIHtcbiAgICB0aGlzLm9wdGlvbnMuaG9va3MgPSB7fTtcbiAgICBfLm1hcChob29rcyB8fCB7fSwgKGhvb2tzQXJyYXksIGhvb2tOYW1lKSA9PiB7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaG9va3NBcnJheSkpIGhvb2tzQXJyYXkgPSBbaG9va3NBcnJheV07XG4gICAgICBob29rc0FycmF5LmZvckVhY2goaG9va0ZuID0+IHRoaXMuYWRkSG9vayhob29rTmFtZSwgaG9va0ZuKSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgcnVuSG9va3MoaG9va3MsIC4uLmhvb2tBcmdzKSB7XG4gICAgaWYgKCFob29rcykgdGhyb3cgbmV3IEVycm9yKCdydW5Ib29rcyByZXF1aXJlcyBhdCBsZWFzdCAxIGFyZ3VtZW50Jyk7XG5cbiAgICBsZXQgaG9va1R5cGU7XG5cbiAgICBpZiAodHlwZW9mIGhvb2tzID09PSAnc3RyaW5nJykge1xuICAgICAgaG9va1R5cGUgPSBob29rcztcbiAgICAgIGhvb2tzID0gZ2V0SG9va3ModGhpcywgaG9va1R5cGUpO1xuXG4gICAgICBpZiAodGhpcy5zZXF1ZWxpemUpIHtcbiAgICAgICAgaG9va3MgPSBob29rcy5jb25jYXQoZ2V0SG9va3ModGhpcy5zZXF1ZWxpemUsIGhvb2tUeXBlKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGhvb2tzKSkge1xuICAgICAgaG9va3MgPSBbaG9va3NdO1xuICAgIH1cblxuICAgIC8vIHN5bmNocm9ub3VzIGhvb2tzXG4gICAgaWYgKGhvb2tUeXBlc1tob29rVHlwZV0gJiYgaG9va1R5cGVzW2hvb2tUeXBlXS5zeW5jKSB7XG4gICAgICBmb3IgKGxldCBob29rIG9mIGhvb2tzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaG9vayA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBob29rID0gaG9vay5mbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnKGBydW5uaW5nIGhvb2soc3luYykgJHtob29rVHlwZX1gKTtcbiAgICAgICAgaG9vay5hcHBseSh0aGlzLCBob29rQXJncyk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gYXN5bmNocm9ub3VzIGhvb2tzIChkZWZhdWx0KVxuICAgIHJldHVybiBQcm9taXNlLmVhY2goaG9va3MsIGhvb2sgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBob29rID09PSAnb2JqZWN0Jykge1xuICAgICAgICBob29rID0gaG9vay5mbjtcbiAgICAgIH1cblxuICAgICAgZGVidWcoYHJ1bm5pbmcgaG9vayAke2hvb2tUeXBlfWApO1xuICAgICAgcmV0dXJuIGhvb2suYXBwbHkodGhpcywgaG9va0FyZ3MpO1xuICAgIH0pLnJldHVybigpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgYSBob29rIHRvIHRoZSBtb2RlbFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICAgICAgaG9va1R5cGUgaG9vayBuYW1lIEBzZWUge0BsaW5rIGhvb2tUeXBlc31cbiAgICogQHBhcmFtIHtzdHJpbmd8RnVuY3Rpb259IFtuYW1lXSBQcm92aWRlIGEgbmFtZSBmb3IgdGhlIGhvb2sgZnVuY3Rpb24uIEl0IGNhbiBiZSB1c2VkIHRvIHJlbW92ZSB0aGUgaG9vayBsYXRlciBvciB0byBvcmRlciBob29rcyBiYXNlZCBvbiBzb21lIHNvcnQgb2YgcHJpb3JpdHkgc3lzdGVtIGluIHRoZSBmdXR1cmUuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259ICAgICAgICBmbiBUaGUgaG9vayBmdW5jdGlvblxuICAgKlxuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAgICovXG4gIGFkZEhvb2soaG9va1R5cGUsIG5hbWUsIGZuKSB7XG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmbiA9IG5hbWU7XG4gICAgICBuYW1lID0gbnVsbDtcbiAgICB9XG5cbiAgICBkZWJ1ZyhgYWRkaW5nIGhvb2sgJHtob29rVHlwZX1gKTtcbiAgICAvLyBjaGVjayBmb3IgcHJveGllcywgYWRkIHRoZW0gdG9vXG4gICAgaG9va1R5cGUgPSBnZXRQcm94aWVkSG9va3MoaG9va1R5cGUpO1xuXG4gICAgaG9va1R5cGUuZm9yRWFjaCh0eXBlID0+IHtcbiAgICAgIGNvbnN0IGhvb2tzID0gZ2V0SG9va3ModGhpcywgdHlwZSk7XG4gICAgICBob29rcy5wdXNoKG5hbWUgPyB7IG5hbWUsIGZuIH0gOiBmbik7XG4gICAgICB0aGlzLm9wdGlvbnMuaG9va3NbdHlwZV0gPSBob29rcztcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgaG9vayBmcm9tIHRoZSBtb2RlbFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaG9va1R5cGUgQHNlZSB7QGxpbmsgaG9va1R5cGVzfVxuICAgKiBAcGFyYW0ge3N0cmluZ3xGdW5jdGlvbn0gbmFtZSBuYW1lIG9mIGhvb2sgb3IgZnVuY3Rpb24gcmVmZXJlbmNlIHdoaWNoIHdhcyBhdHRhY2hlZFxuICAgKlxuICAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAgICovXG4gIHJlbW92ZUhvb2soaG9va1R5cGUsIG5hbWUpIHtcbiAgICBjb25zdCBpc1JlZmVyZW5jZSA9IHR5cGVvZiBuYW1lID09PSAnZnVuY3Rpb24nID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgaWYgKCF0aGlzLmhhc0hvb2soaG9va1R5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBkZWJ1ZyhgcmVtb3ZpbmcgaG9vayAke2hvb2tUeXBlfWApO1xuXG4gICAgLy8gY2hlY2sgZm9yIHByb3hpZXMsIGFkZCB0aGVtIHRvb1xuICAgIGhvb2tUeXBlID0gZ2V0UHJveGllZEhvb2tzKGhvb2tUeXBlKTtcblxuICAgIGZvciAoY29uc3QgdHlwZSBvZiBob29rVHlwZSkge1xuICAgICAgdGhpcy5vcHRpb25zLmhvb2tzW3R5cGVdID0gdGhpcy5vcHRpb25zLmhvb2tzW3R5cGVdLmZpbHRlcihob29rID0+IHtcbiAgICAgICAgaWYgKGlzUmVmZXJlbmNlICYmIHR5cGVvZiBob29rID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgcmV0dXJuIGhvb2sgIT09IG5hbWU7IC8vIGNoZWNrIGlmIHNhbWUgbWV0aG9kXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc1JlZmVyZW5jZSAmJiB0eXBlb2YgaG9vayA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICByZXR1cm4gaG9vay5uYW1lICE9PSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG1vZGUgaGFzIGFueSBob29rcyBvZiB0aGlzIHR5cGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhvb2tUeXBlIEBzZWUge0BsaW5rIGhvb2tUeXBlc31cbiAgICpcbiAgICogQGFsaWFzIGhhc0hvb2tzXG4gICAqXG4gICAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxuICAgKi9cbiAgaGFzSG9vayhob29rVHlwZSkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuaG9va3NbaG9va1R5cGVdICYmICEhdGhpcy5vcHRpb25zLmhvb2tzW2hvb2tUeXBlXS5sZW5ndGg7XG4gIH1cbn07XG5Ib29rcy5oYXNIb29rcyA9IEhvb2tzLmhhc0hvb2s7XG5cblxuZnVuY3Rpb24gYXBwbHlUbyh0YXJnZXQsIGlzTW9kZWwgPSBmYWxzZSkge1xuICBfLm1peGluKHRhcmdldCwgSG9va3MpO1xuXG4gIGZvciAoY29uc3QgaG9vayBvZiBPYmplY3Qua2V5cyhob29rVHlwZXMpKSB7XG4gICAgaWYgKGlzTW9kZWwgJiYgaG9va1R5cGVzW2hvb2tdLm5vTW9kZWwpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICB0YXJnZXRbaG9va10gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIHRoaXMuYWRkSG9vayhob29rLCBuYW1lLCBjYWxsYmFjayk7XG4gICAgfTtcbiAgfVxufVxuZXhwb3J0cy5hcHBseVRvID0gYXBwbHlUbztcblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIHZhbGlkYXRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlLCBvcHRpb25zXG4gKiBAbmFtZSBiZWZvcmVWYWxpZGF0ZVxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxuICovXG5cbi8qKlxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIHZhbGlkYXRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlLCBvcHRpb25zXG4gKiBAbmFtZSBhZnRlclZhbGlkYXRlXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gd2hlbiB2YWxpZGF0aW9uIGZhaWxzXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBpbnN0YW5jZSwgb3B0aW9ucywgZXJyb3IuIEVycm9yIGlzIHRoZVxuICogU2VxdWVsaXplVmFsaWRhdGlvbkVycm9yLiBJZiB0aGUgY2FsbGJhY2sgdGhyb3dzIGFuIGVycm9yLCBpdCB3aWxsIHJlcGxhY2UgdGhlIG9yaWdpbmFsIHZhbGlkYXRpb24gZXJyb3IuXG4gKiBAbmFtZSB2YWxpZGF0aW9uRmFpbGVkXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIGNyZWF0aW5nIGEgc2luZ2xlIGluc3RhbmNlXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBhdHRyaWJ1dGVzLCBvcHRpb25zXG4gKiBAbmFtZSBiZWZvcmVDcmVhdGVcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBjcmVhdGluZyBhIHNpbmdsZSBpbnN0YW5jZVxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggYXR0cmlidXRlcywgb3B0aW9uc1xuICogQG5hbWUgYWZ0ZXJDcmVhdGVcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgY3JlYXRpbmcgb3IgdXBkYXRpbmcgYSBzaW5nbGUgaW5zdGFuY2UsIEl0IHByb3hpZXMgYGJlZm9yZUNyZWF0ZWAgYW5kIGBiZWZvcmVVcGRhdGVgXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBhdHRyaWJ1dGVzLCBvcHRpb25zXG4gKiBAbmFtZSBiZWZvcmVTYXZlXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIHVwc2VydGluZ1xuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggYXR0cmlidXRlcywgb3B0aW9uc1xuICogQG5hbWUgYmVmb3JlVXBzZXJ0XG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgdXBzZXJ0aW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCB0aGUgcmVzdWx0IG9mIHVwc2VydCgpLCBvcHRpb25zXG4gKiBAbmFtZSBhZnRlclVwc2VydFxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxuICovXG5cbi8qKlxuICAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBjcmVhdGluZyBvciB1cGRhdGluZyBhIHNpbmdsZSBpbnN0YW5jZSwgSXQgcHJveGllcyBgYWZ0ZXJDcmVhdGVgIGFuZCBgYWZ0ZXJVcGRhdGVgXG4gICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGF0dHJpYnV0ZXMsIG9wdGlvbnNcbiAgKiBAbmFtZSBhZnRlclNhdmVcbiAgKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXG4gICovXG5cbi8qKlxuICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSBkZXN0cm95aW5nIGEgc2luZ2xlIGluc3RhbmNlXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBpbnN0YW5jZSwgb3B0aW9uc1xuICpcbiAqIEBuYW1lIGJlZm9yZURlc3Ryb3lcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBkZXN0cm95aW5nIGEgc2luZ2xlIGluc3RhbmNlXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBpbnN0YW5jZSwgb3B0aW9uc1xuICpcbiAqIEBuYW1lIGFmdGVyRGVzdHJveVxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxuICovXG5cbi8qKlxuICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSByZXN0b3JpbmcgYSBzaW5nbGUgaW5zdGFuY2VcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlLCBvcHRpb25zXG4gKlxuICogQG5hbWUgYmVmb3JlUmVzdG9yZVxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxuICovXG5cbi8qKlxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIHJlc3RvcmluZyBhIHNpbmdsZSBpbnN0YW5jZVxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggaW5zdGFuY2UsIG9wdGlvbnNcbiAqXG4gKiBAbmFtZSBhZnRlclJlc3RvcmVcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgdXBkYXRpbmcgYSBzaW5nbGUgaW5zdGFuY2VcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlLCBvcHRpb25zXG4gKiBAbmFtZSBiZWZvcmVVcGRhdGVcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciB1cGRhdGluZyBhIHNpbmdsZSBpbnN0YW5jZVxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggaW5zdGFuY2UsIG9wdGlvbnNcbiAqIEBuYW1lIGFmdGVyVXBkYXRlXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIGNyZWF0aW5nIGluc3RhbmNlcyBpbiBidWxrXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBpbnN0YW5jZXMsIG9wdGlvbnNcbiAqIEBuYW1lIGJlZm9yZUJ1bGtDcmVhdGVcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBjcmVhdGluZyBpbnN0YW5jZXMgaW4gYnVsa1xuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggaW5zdGFuY2VzLCBvcHRpb25zXG4gKiBAbmFtZSBhZnRlckJ1bGtDcmVhdGVcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgZGVzdHJveWluZyBpbnN0YW5jZXMgaW4gYnVsa1xuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggb3B0aW9uc1xuICpcbiAqIEBuYW1lIGJlZm9yZUJ1bGtEZXN0cm95XG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgZGVzdHJveWluZyBpbnN0YW5jZXMgaW4gYnVsa1xuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggb3B0aW9uc1xuICpcbiAqIEBuYW1lIGFmdGVyQnVsa0Rlc3Ryb3lcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgcmVzdG9yaW5nIGluc3RhbmNlcyBpbiBidWxrXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBvcHRpb25zXG4gKlxuICogQG5hbWUgYmVmb3JlQnVsa1Jlc3RvcmVcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciByZXN0b3JpbmcgaW5zdGFuY2VzIGluIGJ1bGtcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnNcbiAqXG4gKiBAbmFtZSBhZnRlckJ1bGtSZXN0b3JlXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYmVmb3JlIHVwZGF0aW5nIGluc3RhbmNlcyBpbiBidWxrXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBvcHRpb25zXG4gKiBAbmFtZSBiZWZvcmVCdWxrVXBkYXRlXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplLk1vZGVsXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgdXBkYXRpbmcgaW5zdGFuY2VzIGluIGJ1bGtcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnNcbiAqIEBuYW1lIGFmdGVyQnVsa1VwZGF0ZVxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5Nb2RlbFxuICovXG5cbi8qKlxuICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSBhIGZpbmQgKHNlbGVjdCkgcXVlcnlcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnNcbiAqIEBuYW1lIGJlZm9yZUZpbmRcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgYSBmaW5kIChzZWxlY3QpIHF1ZXJ5LCBhZnRlciBhbnkgeyBpbmNsdWRlOiB7YWxsOiAuLi59IH0gb3B0aW9ucyBhcmUgZXhwYW5kZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnNcbiAqIEBuYW1lIGJlZm9yZUZpbmRBZnRlckV4cGFuZEluY2x1ZGVBbGxcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgYSBmaW5kIChzZWxlY3QpIHF1ZXJ5LCBhZnRlciBhbGwgb3B0aW9uIHBhcnNpbmcgaXMgY29tcGxldGVcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnNcbiAqIEBuYW1lIGJlZm9yZUZpbmRBZnRlck9wdGlvbnNcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBhIGZpbmQgKHNlbGVjdCkgcXVlcnlcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGluc3RhbmNlKHMpLCBvcHRpb25zXG4gKiBAbmFtZSBhZnRlckZpbmRcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgYSBjb3VudCBxdWVyeVxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggb3B0aW9uc1xuICogQG5hbWUgYmVmb3JlQ291bnRcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemUuTW9kZWxcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgYSBkZWZpbmUgY2FsbFxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggYXR0cmlidXRlcywgb3B0aW9uc1xuICogQG5hbWUgYmVmb3JlRGVmaW5lXG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgYSBkZWZpbmUgY2FsbFxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggZmFjdG9yeVxuICogQG5hbWUgYWZ0ZXJEZWZpbmVcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgU2VxdWVsaXplKCkgY2FsbFxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggY29uZmlnLCBvcHRpb25zXG4gKiBAbmFtZSBiZWZvcmVJbml0XG4gKiBAbWVtYmVyb2YgU2VxdWVsaXplXG4gKi9cblxuLyoqXG4gKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgU2VxdWVsaXplKCkgY2FsbFxuICogQHBhcmFtIHtzdHJpbmd9ICAgbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggc2VxdWVsaXplXG4gKiBAbmFtZSBhZnRlckluaXRcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgYSBjb25uZWN0aW9uIGlzIGNyZWF0ZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIGNvbmZpZyBwYXNzZWQgdG8gY29ubmVjdGlvblxuICogQG5hbWUgYmVmb3JlQ29ubmVjdFxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxuICovXG5cbi8qKlxuICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIGEgY29ubmVjdGlvbiBpcyBjcmVhdGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCB0aGUgY29ubmVjdGlvbiBvYmplY3QgYW5kIHRoZSBjb25maWcgcGFzc2VkIHRvIGNvbm5lY3Rpb25cbiAqIEBuYW1lIGFmdGVyQ29ubmVjdFxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxuICovXG5cbi8qKlxuICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSBhIGNvbm5lY3Rpb24gaXMgZGlzY29ubmVjdGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCB0aGUgY29ubmVjdGlvbiBvYmplY3RcbiAqIEBuYW1lIGJlZm9yZURpc2Nvbm5lY3RcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBhIGNvbm5lY3Rpb24gaXMgZGlzY29ubmVjdGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gICBuYW1lXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCB0aGUgY29ubmVjdGlvbiBvYmplY3RcbiAqIEBuYW1lIGFmdGVyRGlzY29ubmVjdFxuICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxuICovXG5cbi8qKlxuICogQSBob29rIHRoYXQgaXMgcnVuIGJlZm9yZSBNb2RlbC5zeW5jIGNhbGxcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnMgcGFzc2VkIHRvIE1vZGVsLnN5bmNcbiAqIEBuYW1lIGJlZm9yZVN5bmNcbiAqIEBtZW1iZXJvZiBTZXF1ZWxpemVcbiAqL1xuXG4vKipcbiAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBNb2RlbC5zeW5jIGNhbGxcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIG9wdGlvbnMgcGFzc2VkIHRvIE1vZGVsLnN5bmNcbiAqIEBuYW1lIGFmdGVyU3luY1xuICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxuICovXG5cbi8qKlxuICAqIEEgaG9vayB0aGF0IGlzIHJ1biBiZWZvcmUgc2VxdWVsaXplLnN5bmMgY2FsbFxuICAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBvcHRpb25zIHBhc3NlZCB0byBzZXF1ZWxpemUuc3luY1xuICAqIEBuYW1lIGJlZm9yZUJ1bGtTeW5jXG4gICogQG1lbWJlcm9mIFNlcXVlbGl6ZVxuICAqL1xuXG4vKipcbiAgKiBBIGhvb2sgdGhhdCBpcyBydW4gYWZ0ZXIgc2VxdWVsaXplLnN5bmMgY2FsbFxuICAqIEBwYXJhbSB7c3RyaW5nfSAgIG5hbWVcbiAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAgIEEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBvcHRpb25zIHBhc3NlZCB0byBzZXF1ZWxpemUuc3luY1xuICAqIEBuYW1lIGFmdGVyQnVsa1N5bmNcbiAgKiBAbWVtYmVyb2YgU2VxdWVsaXplXG4gICovXG4iXX0=