'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const Promise = require('./promise');
/**
 * The transaction object is used to identify a running transaction.
 * It is created by calling `Sequelize.transaction()`.
 * To run a query under a transaction, you should pass the transaction in the options object.
 *
 * @class Transaction
 * @see {@link Sequelize.transaction}
 */


let Transaction =
/*#__PURE__*/
function () {
  /**
   * Creates a new transaction instance
   *
   * @param {Sequelize} sequelize A configured sequelize Instance
   * @param {Object} options An object with options
   * @param {string} [options.type] Sets the type of the transaction. Sqlite only
   * @param {string} [options.isolationLevel] Sets the isolation level of the transaction.
   * @param {string} [options.deferrable] Sets the constraints to be deferred or immediately checked. PostgreSQL only
   */
  function Transaction(sequelize, options) {
    _classCallCheck(this, Transaction);

    this.sequelize = sequelize;
    this.savepoints = [];
    this._afterCommitHooks = []; // get dialect specific transaction options

    const generateTransactionId = this.sequelize.dialect.QueryGenerator.generateTransactionId;
    this.options = Object.assign({
      type: sequelize.options.transactionType,
      isolationLevel: sequelize.options.isolationLevel,
      readOnly: false
    }, options || {});
    this.parent = this.options.transaction;

    if (this.parent) {
      this.id = this.parent.id;
      this.parent.savepoints.push(this);
      this.name = `${this.id}-sp-${this.parent.savepoints.length}`;
    } else {
      this.id = this.name = generateTransactionId();
    }

    delete this.options.transaction;
  }
  /**
   * Commit the transaction
   *
   * @returns {Promise}
   */


  _createClass(Transaction, [{
    key: "commit",
    value: function commit() {
      if (this.finished) {
        return Promise.reject(new Error(`Transaction cannot be committed because it has been finished with state: ${this.finished}`));
      }

      this._clearCls();

      return this.sequelize.getQueryInterface().commitTransaction(this, this.options).finally(() => {
        this.finished = 'commit';

        if (!this.parent) {
          return this.cleanup();
        }

        return null;
      }).tap(() => Promise.each(this._afterCommitHooks, hook => Promise.resolve(hook.apply(this, [this]))));
    }
    /**
     * Rollback (abort) the transaction
     *
     * @returns {Promise}
     */

  }, {
    key: "rollback",
    value: function rollback() {
      if (this.finished) {
        return Promise.reject(new Error(`Transaction cannot be rolled back because it has been finished with state: ${this.finished}`));
      }

      if (!this.connection) {
        return Promise.reject(new Error('Transaction cannot be rolled back because it never started'));
      }

      this._clearCls();

      return this.sequelize.getQueryInterface().rollbackTransaction(this, this.options).finally(() => {
        if (!this.parent) {
          return this.cleanup();
        }

        return this;
      });
    }
  }, {
    key: "prepareEnvironment",
    value: function prepareEnvironment(useCLS) {
      let connectionPromise;

      if (useCLS === undefined) {
        useCLS = true;
      }

      if (this.parent) {
        connectionPromise = Promise.resolve(this.parent.connection);
      } else {
        const acquireOptions = {
          uuid: this.id
        };

        if (this.options.readOnly) {
          acquireOptions.type = 'SELECT';
        }

        connectionPromise = this.sequelize.connectionManager.getConnection(acquireOptions);
      }

      return connectionPromise.then(connection => {
        this.connection = connection;
        this.connection.uuid = this.id;
      }).then(() => {
        return this.begin().then(() => this.setDeferrable()).catch(setupErr => this.rollback().finally(() => {
          throw setupErr;
        }));
      }).tap(() => {
        if (useCLS && this.sequelize.constructor._cls) {
          this.sequelize.constructor._cls.set('transaction', this);
        }

        return null;
      });
    }
  }, {
    key: "setDeferrable",
    value: function setDeferrable() {
      if (this.options.deferrable) {
        return this.sequelize.getQueryInterface().deferConstraints(this, this.options);
      }
    }
  }, {
    key: "begin",
    value: function begin() {
      const queryInterface = this.sequelize.getQueryInterface();

      if (this.sequelize.dialect.supports.settingIsolationLevelDuringTransaction) {
        return queryInterface.startTransaction(this, this.options).then(() => {
          return queryInterface.setIsolationLevel(this, this.options.isolationLevel, this.options);
        });
      }

      return queryInterface.setIsolationLevel(this, this.options.isolationLevel, this.options).then(() => {
        return queryInterface.startTransaction(this, this.options);
      });
    }
  }, {
    key: "cleanup",
    value: function cleanup() {
      const res = this.sequelize.connectionManager.releaseConnection(this.connection);
      this.connection.uuid = undefined;
      return res;
    }
  }, {
    key: "_clearCls",
    value: function _clearCls() {
      const cls = this.sequelize.constructor._cls;

      if (cls) {
        if (cls.get('transaction') === this) {
          cls.set('transaction', null);
        }
      }
    }
    /**
     * A hook that is run after a transaction is committed
     *
     * @param {Function} fn   A callback function that is called with the committed transaction
     * @name afterCommit
     * @memberof Sequelize.Transaction
     */

  }, {
    key: "afterCommit",
    value: function afterCommit(fn) {
      if (!fn || typeof fn !== 'function') {
        throw new Error('"fn" must be a function');
      }

      this._afterCommitHooks.push(fn);
    }
    /**
     * Types can be set per-transaction by passing `options.type` to `sequelize.transaction`.
     * Default to `DEFERRED` but you can override the default type by passing `options.transactionType` in `new Sequelize`.
     * Sqlite only.
     *
     * Pass in the desired level as the first argument:
     *
     * @example
     * return sequelize.transaction({type: Sequelize.Transaction.TYPES.EXCLUSIVE}, transaction => {
     *   // your transactions
     * }).then(result => {
     *   // transaction has been committed. Do something after the commit if required.
     * }).catch(err => {
     *   // do something with the err.
     * });
     *
     * @property DEFERRED
     * @property IMMEDIATE
     * @property EXCLUSIVE
     */

  }, {
    key: "LOCK",

    /**
     * Please see {@link Transaction.LOCK}
     */
    get: function () {
      return Transaction.LOCK;
    }
  }], [{
    key: "TYPES",
    get: function () {
      return {
        DEFERRED: 'DEFERRED',
        IMMEDIATE: 'IMMEDIATE',
        EXCLUSIVE: 'EXCLUSIVE'
      };
    }
    /**
     * Isolation levels can be set per-transaction by passing `options.isolationLevel` to `sequelize.transaction`.
     * Sequelize uses the default isolation level of the database, you can override this by passing `options.isolationLevel` in Sequelize constructor options.
     *
     * Pass in the desired level as the first argument:
     *
     * @example
     * return sequelize.transaction({isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE}, transaction => {
     *   // your transactions
     * }).then(result => {
     *   // transaction has been committed. Do something after the commit if required.
     * }).catch(err => {
     *   // do something with the err.
     * });
     *
     * @property READ_UNCOMMITTED
     * @property READ_COMMITTED
     * @property REPEATABLE_READ
     * @property SERIALIZABLE
     */

  }, {
    key: "ISOLATION_LEVELS",
    get: function () {
      return {
        READ_UNCOMMITTED: 'READ UNCOMMITTED',
        READ_COMMITTED: 'READ COMMITTED',
        REPEATABLE_READ: 'REPEATABLE READ',
        SERIALIZABLE: 'SERIALIZABLE'
      };
    }
    /**
     * Possible options for row locking. Used in conjunction with `find` calls:
     *
     * @example
     * // t1 is a transaction
     * Model.findAll({
     *   where: ...,
     *   transaction: t1,
     *   lock: t1.LOCK...
     * });
     *
     * @example <caption>Postgres also supports specific locks while eager loading by using OF:</caption>
     * UserModel.findAll({
     *   where: ...,
     *   include: [TaskModel, ...],
     *   transaction: t1,
     *   lock: {
     *     level: t1.LOCK...,
     *     of: UserModel
     *   }
     * });
     *
     * # UserModel will be locked but TaskModel won't!
     *
     * @example <caption>You can also skip locked rows:</caption>
     * // t1 is a transaction
     * Model.findAll({
     *   where: ...,
     *   transaction: t1,
     *   lock: true,
     *   skipLocked: true
     * });
     * # The query will now return any rows that aren't locked by another transaction
     *
     * @returns {Object}
     * @property UPDATE
     * @property SHARE
     * @property KEY_SHARE Postgres 9.3+ only
     * @property NO_KEY_UPDATE Postgres 9.3+ only
     */

  }, {
    key: "LOCK",
    get: function () {
      return {
        UPDATE: 'UPDATE',
        SHARE: 'SHARE',
        KEY_SHARE: 'KEY SHARE',
        NO_KEY_UPDATE: 'NO KEY UPDATE'
      };
    }
  }]);

  return Transaction;
}();

module.exports = Transaction;
module.exports.Transaction = Transaction;
module.exports.default = Transaction;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi90cmFuc2FjdGlvbi5qcyJdLCJuYW1lcyI6WyJQcm9taXNlIiwicmVxdWlyZSIsIlRyYW5zYWN0aW9uIiwic2VxdWVsaXplIiwib3B0aW9ucyIsInNhdmVwb2ludHMiLCJfYWZ0ZXJDb21taXRIb29rcyIsImdlbmVyYXRlVHJhbnNhY3Rpb25JZCIsImRpYWxlY3QiLCJRdWVyeUdlbmVyYXRvciIsIk9iamVjdCIsImFzc2lnbiIsInR5cGUiLCJ0cmFuc2FjdGlvblR5cGUiLCJpc29sYXRpb25MZXZlbCIsInJlYWRPbmx5IiwicGFyZW50IiwidHJhbnNhY3Rpb24iLCJpZCIsInB1c2giLCJuYW1lIiwibGVuZ3RoIiwiZmluaXNoZWQiLCJyZWplY3QiLCJFcnJvciIsIl9jbGVhckNscyIsImdldFF1ZXJ5SW50ZXJmYWNlIiwiY29tbWl0VHJhbnNhY3Rpb24iLCJmaW5hbGx5IiwiY2xlYW51cCIsInRhcCIsImVhY2giLCJob29rIiwicmVzb2x2ZSIsImFwcGx5IiwiY29ubmVjdGlvbiIsInJvbGxiYWNrVHJhbnNhY3Rpb24iLCJ1c2VDTFMiLCJjb25uZWN0aW9uUHJvbWlzZSIsInVuZGVmaW5lZCIsImFjcXVpcmVPcHRpb25zIiwidXVpZCIsImNvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0Q29ubmVjdGlvbiIsInRoZW4iLCJiZWdpbiIsInNldERlZmVycmFibGUiLCJjYXRjaCIsInNldHVwRXJyIiwicm9sbGJhY2siLCJjb25zdHJ1Y3RvciIsIl9jbHMiLCJzZXQiLCJkZWZlcnJhYmxlIiwiZGVmZXJDb25zdHJhaW50cyIsInF1ZXJ5SW50ZXJmYWNlIiwic3VwcG9ydHMiLCJzZXR0aW5nSXNvbGF0aW9uTGV2ZWxEdXJpbmdUcmFuc2FjdGlvbiIsInN0YXJ0VHJhbnNhY3Rpb24iLCJzZXRJc29sYXRpb25MZXZlbCIsInJlcyIsInJlbGVhc2VDb25uZWN0aW9uIiwiY2xzIiwiZ2V0IiwiZm4iLCJMT0NLIiwiREVGRVJSRUQiLCJJTU1FRElBVEUiLCJFWENMVVNJVkUiLCJSRUFEX1VOQ09NTUlUVEVEIiwiUkVBRF9DT01NSVRURUQiLCJSRVBFQVRBQkxFX1JFQUQiLCJTRVJJQUxJWkFCTEUiLCJVUERBVEUiLCJTSEFSRSIsIktFWV9TSEFSRSIsIk5PX0tFWV9VUERBVEUiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUMsV0FBRCxDQUF2QjtBQUVBOzs7Ozs7Ozs7O0lBUU1DLFc7OztBQUNKOzs7Ozs7Ozs7QUFTQSx1QkFBWUMsU0FBWixFQUF1QkMsT0FBdkIsRUFBZ0M7QUFBQTs7QUFDOUIsU0FBS0QsU0FBTCxHQUFpQkEsU0FBakI7QUFDQSxTQUFLRSxVQUFMLEdBQWtCLEVBQWxCO0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUIsRUFBekIsQ0FIOEIsQ0FLOUI7O0FBQ0EsVUFBTUMscUJBQXFCLEdBQUcsS0FBS0osU0FBTCxDQUFlSyxPQUFmLENBQXVCQyxjQUF2QixDQUFzQ0YscUJBQXBFO0FBRUEsU0FBS0gsT0FBTCxHQUFlTSxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUMzQkMsTUFBQUEsSUFBSSxFQUFFVCxTQUFTLENBQUNDLE9BQVYsQ0FBa0JTLGVBREc7QUFFM0JDLE1BQUFBLGNBQWMsRUFBRVgsU0FBUyxDQUFDQyxPQUFWLENBQWtCVSxjQUZQO0FBRzNCQyxNQUFBQSxRQUFRLEVBQUU7QUFIaUIsS0FBZCxFQUlaWCxPQUFPLElBQUksRUFKQyxDQUFmO0FBTUEsU0FBS1ksTUFBTCxHQUFjLEtBQUtaLE9BQUwsQ0FBYWEsV0FBM0I7O0FBRUEsUUFBSSxLQUFLRCxNQUFULEVBQWlCO0FBQ2YsV0FBS0UsRUFBTCxHQUFVLEtBQUtGLE1BQUwsQ0FBWUUsRUFBdEI7QUFDQSxXQUFLRixNQUFMLENBQVlYLFVBQVosQ0FBdUJjLElBQXZCLENBQTRCLElBQTVCO0FBQ0EsV0FBS0MsSUFBTCxHQUFhLEdBQUUsS0FBS0YsRUFBRyxPQUFNLEtBQUtGLE1BQUwsQ0FB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UUFBQUEsZ0JBQWdCLEVBQUUsa0JBRGI7QUFFTEMsUUFBQUEsY0FBYyxFQUFFLGdCQUZYO0FBR0xDLFFBQUFBLGVBQWUsRUFBRSxpQkFIWjtBQUlMQyxRQUFBQSxZQUFZLEVBQUU7QUFKVCxPQUFQO0FBTUQ7QUFHRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQkF3Q2tCO0FBQ2hCLGFBQU87QUFDTEMsUUFBQUEsTUFBTSxFQUFFLFFBREg7QUFFTEMsUUFBQUEsS0FBSyxFQUFFLE9BRkY7QUFHTEMsUUFBQUEsU0FBUyxFQUFFLFdBSE47QUFJTEMsUUFBQUEsYUFBYSxFQUFFO0FBSlYsT0FBUDtBQU1EOzs7Ozs7QUFVSEMsTUFBTSxDQUFDQyxPQUFQLEdBQWlCNUUsV0FBakI7QUFDQTJFLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlNUUsV0FBZixHQUE2QkEsV0FBN0I7QUFDQTJFLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxPQUFmLEdBQXlCN0UsV0FBekIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJyk7XHJcblxyXG4vKipcclxuICogVGhlIHRyYW5zYWN0aW9uIG9iamVjdCBpcyB1c2VkIHRvIGlkZW50aWZ5IGEgcnVubmluZyB0cmFuc2FjdGlvbi5cclxuICogSXQgaXMgY3JlYXRlZCBieSBjYWxsaW5nIGBTZXF1ZWxpemUudHJhbnNhY3Rpb24oKWAuXHJcbiAqIFRvIHJ1biBhIHF1ZXJ5IHVuZGVyIGEgdHJhbnNhY3Rpb24sIHlvdSBzaG91bGQgcGFzcyB0aGUgdHJhbnNhY3Rpb24gaW4gdGhlIG9wdGlvbnMgb2JqZWN0LlxyXG4gKlxyXG4gKiBAY2xhc3MgVHJhbnNhY3Rpb25cclxuICogQHNlZSB7QGxpbmsgU2VxdWVsaXplLnRyYW5zYWN0aW9ufVxyXG4gKi9cclxuY2xhc3MgVHJhbnNhY3Rpb24ge1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgdHJhbnNhY3Rpb24gaW5zdGFuY2VcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U2VxdWVsaXplfSBzZXF1ZWxpemUgQSBjb25maWd1cmVkIHNlcXVlbGl6ZSBJbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIEFuIG9iamVjdCB3aXRoIG9wdGlvbnNcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudHlwZV0gU2V0cyB0aGUgdHlwZSBvZiB0aGUgdHJhbnNhY3Rpb24uIFNxbGl0ZSBvbmx5XHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmlzb2xhdGlvbkxldmVsXSBTZXRzIHRoZSBpc29sYXRpb24gbGV2ZWwgb2YgdGhlIHRyYW5zYWN0aW9uLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kZWZlcnJhYmxlXSBTZXRzIHRoZSBjb25zdHJhaW50cyB0byBiZSBkZWZlcnJlZCBvciBpbW1lZGlhdGVseSBjaGVja2VkLiBQb3N0Z3JlU1FMIG9ubHlcclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihzZXF1ZWxpemUsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuc2VxdWVsaXplID0gc2VxdWVsaXplO1xyXG4gICAgdGhpcy5zYXZlcG9pbnRzID0gW107XHJcbiAgICB0aGlzLl9hZnRlckNvbW1pdEhvb2tzID0gW107XHJcblxyXG4gICAgLy8gZ2V0IGRpYWxlY3Qgc3BlY2lmaWMgdHJhbnNhY3Rpb24gb3B0aW9uc1xyXG4gICAgY29uc3QgZ2VuZXJhdGVUcmFuc2FjdGlvbklkID0gdGhpcy5zZXF1ZWxpemUuZGlhbGVjdC5RdWVyeUdlbmVyYXRvci5nZW5lcmF0ZVRyYW5zYWN0aW9uSWQ7XHJcblxyXG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgIHR5cGU6IHNlcXVlbGl6ZS5vcHRpb25zLnRyYW5zYWN0aW9uVHlwZSxcclxuICAgICAgaXNvbGF0aW9uTGV2ZWw6IHNlcXVlbGl6ZS5vcHRpb25zLmlzb2xhdGlvbkxldmVsLFxyXG4gICAgICByZWFkT25seTogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMgfHwge30pO1xyXG5cclxuICAgIHRoaXMucGFyZW50ID0gdGhpcy5vcHRpb25zLnRyYW5zYWN0aW9uO1xyXG5cclxuICAgIGlmICh0aGlzLnBhcmVudCkge1xyXG4gICAgICB0aGlzLmlkID0gdGhpcy5wYXJlbnQuaWQ7XHJcbiAgICAgIHRoaXMucGFyZW50LnNhdmVwb2ludHMucHVzaCh0aGlzKTtcclxuICAgICAgdGhpcy5uYW1lID0gYCR7dGhpcy5pZH0tc3AtJHt0aGlzLnBhcmVudC5zYXZlcG9pbnRzLmxlbmd0aH1gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5pZCA9IHRoaXMubmFtZSA9IGdlbmVyYXRlVHJhbnNhY3Rpb25JZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMudHJhbnNhY3Rpb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21taXQgdGhlIHRyYW5zYWN0aW9uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgKi9cclxuICBjb21taXQoKSB7XHJcbiAgICBpZiAodGhpcy5maW5pc2hlZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBUcmFuc2FjdGlvbiBjYW5ub3QgYmUgY29tbWl0dGVkIGJlY2F1c2UgaXQgaGFzIGJlZW4gZmluaXNoZWQgd2l0aCBzdGF0ZTogJHt0aGlzLmZpbmlzaGVkfWApKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9jbGVhckNscygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgICAgIC5zZXF1ZWxpemVcclxuICAgICAgLmdldFF1ZXJ5SW50ZXJmYWNlKClcclxuICAgICAgLmNvbW1pdFRyYW5zYWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucylcclxuICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZmluaXNoZWQgPSAnY29tbWl0JztcclxuICAgICAgICBpZiAoIXRoaXMucGFyZW50KSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5jbGVhbnVwKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9KS50YXAoXHJcbiAgICAgICAgKCkgPT4gUHJvbWlzZS5lYWNoKFxyXG4gICAgICAgICAgdGhpcy5fYWZ0ZXJDb21taXRIb29rcyxcclxuICAgICAgICAgIGhvb2sgPT4gUHJvbWlzZS5yZXNvbHZlKGhvb2suYXBwbHkodGhpcywgW3RoaXNdKSkpXHJcbiAgICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSb2xsYmFjayAoYWJvcnQpIHRoZSB0cmFuc2FjdGlvblxyXG4gICAqXHJcbiAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICovXHJcbiAgcm9sbGJhY2soKSB7XHJcbiAgICBpZiAodGhpcy5maW5pc2hlZCkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBUcmFuc2FjdGlvbiBjYW5ub3QgYmUgcm9sbGVkIGJhY2sgYmVjYXVzZSBpdCBoYXMgYmVlbiBmaW5pc2hlZCB3aXRoIHN0YXRlOiAke3RoaXMuZmluaXNoZWR9YCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5jb25uZWN0aW9uKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ1RyYW5zYWN0aW9uIGNhbm5vdCBiZSByb2xsZWQgYmFjayBiZWNhdXNlIGl0IG5ldmVyIHN0YXJ0ZWQnKSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fY2xlYXJDbHMoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gICAgICAuc2VxdWVsaXplXHJcbiAgICAgIC5nZXRRdWVyeUludGVyZmFjZSgpXHJcbiAgICAgIC5yb2xsYmFja1RyYW5zYWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucylcclxuICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgIGlmICghdGhpcy5wYXJlbnQpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmNsZWFudXAoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJlcGFyZUVudmlyb25tZW50KHVzZUNMUykge1xyXG4gICAgbGV0IGNvbm5lY3Rpb25Qcm9taXNlO1xyXG5cclxuICAgIGlmICh1c2VDTFMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB1c2VDTFMgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLnBhcmVudCkge1xyXG4gICAgICBjb25uZWN0aW9uUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSh0aGlzLnBhcmVudC5jb25uZWN0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGFjcXVpcmVPcHRpb25zID0geyB1dWlkOiB0aGlzLmlkIH07XHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVhZE9ubHkpIHtcclxuICAgICAgICBhY3F1aXJlT3B0aW9ucy50eXBlID0gJ1NFTEVDVCc7XHJcbiAgICAgIH1cclxuICAgICAgY29ubmVjdGlvblByb21pc2UgPSB0aGlzLnNlcXVlbGl6ZS5jb25uZWN0aW9uTWFuYWdlci5nZXRDb25uZWN0aW9uKGFjcXVpcmVPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY29ubmVjdGlvblByb21pc2VcclxuICAgICAgLnRoZW4oY29ubmVjdGlvbiA9PiB7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24udXVpZCA9IHRoaXMuaWQ7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5iZWdpbigpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNldERlZmVycmFibGUoKSlcclxuICAgICAgICAgIC5jYXRjaChzZXR1cEVyciA9PiB0aGlzLnJvbGxiYWNrKCkuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRocm93IHNldHVwRXJyO1xyXG4gICAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgICAudGFwKCgpID0+IHtcclxuICAgICAgICBpZiAodXNlQ0xTICYmIHRoaXMuc2VxdWVsaXplLmNvbnN0cnVjdG9yLl9jbHMpIHtcclxuICAgICAgICAgIHRoaXMuc2VxdWVsaXplLmNvbnN0cnVjdG9yLl9jbHMuc2V0KCd0cmFuc2FjdGlvbicsIHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICBzZXREZWZlcnJhYmxlKCkge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWZlcnJhYmxlKSB7XHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICAgICAgLnNlcXVlbGl6ZVxyXG4gICAgICAgIC5nZXRRdWVyeUludGVyZmFjZSgpXHJcbiAgICAgICAgLmRlZmVyQ29uc3RyYWludHModGhpcywgdGhpcy5vcHRpb25zKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGJlZ2luKCkge1xyXG4gICAgY29uc3QgcXVlcnlJbnRlcmZhY2UgPSB0aGlzLnNlcXVlbGl6ZS5nZXRRdWVyeUludGVyZmFjZSgpO1xyXG5cclxuICAgIGlmICggdGhpcy5zZXF1ZWxpemUuZGlhbGVjdC5zdXBwb3J0cy5zZXR0aW5nSXNvbGF0aW9uTGV2ZWxEdXJpbmdUcmFuc2FjdGlvbiApIHtcclxuICAgICAgcmV0dXJuIHF1ZXJ5SW50ZXJmYWNlLnN0YXJ0VHJhbnNhY3Rpb24odGhpcywgdGhpcy5vcHRpb25zKS50aGVuKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gcXVlcnlJbnRlcmZhY2Uuc2V0SXNvbGF0aW9uTGV2ZWwodGhpcywgdGhpcy5vcHRpb25zLmlzb2xhdGlvbkxldmVsLCB0aGlzLm9wdGlvbnMpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcXVlcnlJbnRlcmZhY2Uuc2V0SXNvbGF0aW9uTGV2ZWwodGhpcywgdGhpcy5vcHRpb25zLmlzb2xhdGlvbkxldmVsLCB0aGlzLm9wdGlvbnMpLnRoZW4oKCkgPT4ge1xyXG4gICAgICByZXR1cm4gcXVlcnlJbnRlcmZhY2Uuc3RhcnRUcmFuc2FjdGlvbih0aGlzLCB0aGlzLm9wdGlvbnMpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBjbGVhbnVwKCkge1xyXG4gICAgY29uc3QgcmVzID0gdGhpcy5zZXF1ZWxpemUuY29ubmVjdGlvbk1hbmFnZXIucmVsZWFzZUNvbm5lY3Rpb24odGhpcy5jb25uZWN0aW9uKTtcclxuICAgIHRoaXMuY29ubmVjdGlvbi51dWlkID0gdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcblxyXG4gIF9jbGVhckNscygpIHtcclxuICAgIGNvbnN0IGNscyA9IHRoaXMuc2VxdWVsaXplLmNvbnN0cnVjdG9yLl9jbHM7XHJcblxyXG4gICAgaWYgKGNscykge1xyXG4gICAgICBpZiAoY2xzLmdldCgndHJhbnNhY3Rpb24nKSA9PT0gdGhpcykge1xyXG4gICAgICAgIGNscy5zZXQoJ3RyYW5zYWN0aW9uJywgbnVsbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgaG9vayB0aGF0IGlzIHJ1biBhZnRlciBhIHRyYW5zYWN0aW9uIGlzIGNvbW1pdHRlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdpdGggdGhlIGNvbW1pdHRlZCB0cmFuc2FjdGlvblxyXG4gICAqIEBuYW1lIGFmdGVyQ29tbWl0XHJcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5UcmFuc2FjdGlvblxyXG4gICAqL1xyXG4gIGFmdGVyQ29tbWl0KGZuKSB7XHJcbiAgICBpZiAoIWZuIHx8IHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiZm5cIiBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcclxuICAgIH1cclxuICAgIHRoaXMuX2FmdGVyQ29tbWl0SG9va3MucHVzaChmbik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUeXBlcyBjYW4gYmUgc2V0IHBlci10cmFuc2FjdGlvbiBieSBwYXNzaW5nIGBvcHRpb25zLnR5cGVgIHRvIGBzZXF1ZWxpemUudHJhbnNhY3Rpb25gLlxyXG4gICAqIERlZmF1bHQgdG8gYERFRkVSUkVEYCBidXQgeW91IGNhbiBvdmVycmlkZSB0aGUgZGVmYXVsdCB0eXBlIGJ5IHBhc3NpbmcgYG9wdGlvbnMudHJhbnNhY3Rpb25UeXBlYCBpbiBgbmV3IFNlcXVlbGl6ZWAuXHJcbiAgICogU3FsaXRlIG9ubHkuXHJcbiAgICpcclxuICAgKiBQYXNzIGluIHRoZSBkZXNpcmVkIGxldmVsIGFzIHRoZSBmaXJzdCBhcmd1bWVudDpcclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogcmV0dXJuIHNlcXVlbGl6ZS50cmFuc2FjdGlvbih7dHlwZTogU2VxdWVsaXplLlRyYW5zYWN0aW9uLlRZUEVTLkVYQ0xVU0lWRX0sIHRyYW5zYWN0aW9uID0+IHtcclxuICAgKiAgIC8vIHlvdXIgdHJhbnNhY3Rpb25zXHJcbiAgICogfSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAqICAgLy8gdHJhbnNhY3Rpb24gaGFzIGJlZW4gY29tbWl0dGVkLiBEbyBzb21ldGhpbmcgYWZ0ZXIgdGhlIGNvbW1pdCBpZiByZXF1aXJlZC5cclxuICAgKiB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAqICAgLy8gZG8gc29tZXRoaW5nIHdpdGggdGhlIGVyci5cclxuICAgKiB9KTtcclxuICAgKlxyXG4gICAqIEBwcm9wZXJ0eSBERUZFUlJFRFxyXG4gICAqIEBwcm9wZXJ0eSBJTU1FRElBVEVcclxuICAgKiBAcHJvcGVydHkgRVhDTFVTSVZFXHJcbiAgICovXHJcbiAgc3RhdGljIGdldCBUWVBFUygpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIERFRkVSUkVEOiAnREVGRVJSRUQnLFxyXG4gICAgICBJTU1FRElBVEU6ICdJTU1FRElBVEUnLFxyXG4gICAgICBFWENMVVNJVkU6ICdFWENMVVNJVkUnXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSXNvbGF0aW9uIGxldmVscyBjYW4gYmUgc2V0IHBlci10cmFuc2FjdGlvbiBieSBwYXNzaW5nIGBvcHRpb25zLmlzb2xhdGlvbkxldmVsYCB0byBgc2VxdWVsaXplLnRyYW5zYWN0aW9uYC5cclxuICAgKiBTZXF1ZWxpemUgdXNlcyB0aGUgZGVmYXVsdCBpc29sYXRpb24gbGV2ZWwgb2YgdGhlIGRhdGFiYXNlLCB5b3UgY2FuIG92ZXJyaWRlIHRoaXMgYnkgcGFzc2luZyBgb3B0aW9ucy5pc29sYXRpb25MZXZlbGAgaW4gU2VxdWVsaXplIGNvbnN0cnVjdG9yIG9wdGlvbnMuXHJcbiAgICpcclxuICAgKiBQYXNzIGluIHRoZSBkZXNpcmVkIGxldmVsIGFzIHRoZSBmaXJzdCBhcmd1bWVudDpcclxuICAgKlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICogcmV0dXJuIHNlcXVlbGl6ZS50cmFuc2FjdGlvbih7aXNvbGF0aW9uTGV2ZWw6IFNlcXVlbGl6ZS5UcmFuc2FjdGlvbi5JU09MQVRJT05fTEVWRUxTLlNFUklBTElaQUJMRX0sIHRyYW5zYWN0aW9uID0+IHtcclxuICAgKiAgIC8vIHlvdXIgdHJhbnNhY3Rpb25zXHJcbiAgICogfSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAqICAgLy8gdHJhbnNhY3Rpb24gaGFzIGJlZW4gY29tbWl0dGVkLiBEbyBzb21ldGhpbmcgYWZ0ZXIgdGhlIGNvbW1pdCBpZiByZXF1aXJlZC5cclxuICAgKiB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAqICAgLy8gZG8gc29tZXRoaW5nIHdpdGggdGhlIGVyci5cclxuICAgKiB9KTtcclxuICAgKlxyXG4gICAqIEBwcm9wZXJ0eSBSRUFEX1VOQ09NTUlUVEVEXHJcbiAgICogQHByb3BlcnR5IFJFQURfQ09NTUlUVEVEXHJcbiAgICogQHByb3BlcnR5IFJFUEVBVEFCTEVfUkVBRFxyXG4gICAqIEBwcm9wZXJ0eSBTRVJJQUxJWkFCTEVcclxuICAgKi9cclxuICBzdGF0aWMgZ2V0IElTT0xBVElPTl9MRVZFTFMoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBSRUFEX1VOQ09NTUlUVEVEOiAnUkVBRCBVTkNPTU1JVFRFRCcsXHJcbiAgICAgIFJFQURfQ09NTUlUVEVEOiAnUkVBRCBDT01NSVRURUQnLFxyXG4gICAgICBSRVBFQVRBQkxFX1JFQUQ6ICdSRVBFQVRBQkxFIFJFQUQnLFxyXG4gICAgICBTRVJJQUxJWkFCTEU6ICdTRVJJQUxJWkFCTEUnXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFBvc3NpYmxlIG9wdGlvbnMgZm9yIHJvdyBsb2NraW5nLiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggYGZpbmRgIGNhbGxzOlxyXG4gICAqXHJcbiAgICogQGV4YW1wbGVcclxuICAgKiAvLyB0MSBpcyBhIHRyYW5zYWN0aW9uXHJcbiAgICogTW9kZWwuZmluZEFsbCh7XHJcbiAgICogICB3aGVyZTogLi4uLFxyXG4gICAqICAgdHJhbnNhY3Rpb246IHQxLFxyXG4gICAqICAgbG9jazogdDEuTE9DSy4uLlxyXG4gICAqIH0pO1xyXG4gICAqXHJcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+UG9zdGdyZXMgYWxzbyBzdXBwb3J0cyBzcGVjaWZpYyBsb2NrcyB3aGlsZSBlYWdlciBsb2FkaW5nIGJ5IHVzaW5nIE9GOjwvY2FwdGlvbj5cclxuICAgKiBVc2VyTW9kZWwuZmluZEFsbCh7XHJcbiAgICogICB3aGVyZTogLi4uLFxyXG4gICAqICAgaW5jbHVkZTogW1Rhc2tNb2RlbCwgLi4uXSxcclxuICAgKiAgIHRyYW5zYWN0aW9uOiB0MSxcclxuICAgKiAgIGxvY2s6IHtcclxuICAgKiAgICAgbGV2ZWw6IHQxLkxPQ0suLi4sXHJcbiAgICogICAgIG9mOiBVc2VyTW9kZWxcclxuICAgKiAgIH1cclxuICAgKiB9KTtcclxuICAgKlxyXG4gICAqICMgVXNlck1vZGVsIHdpbGwgYmUgbG9ja2VkIGJ1dCBUYXNrTW9kZWwgd29uJ3QhXHJcbiAgICpcclxuICAgKiBAZXhhbXBsZSA8Y2FwdGlvbj5Zb3UgY2FuIGFsc28gc2tpcCBsb2NrZWQgcm93czo8L2NhcHRpb24+XHJcbiAgICogLy8gdDEgaXMgYSB0cmFuc2FjdGlvblxyXG4gICAqIE1vZGVsLmZpbmRBbGwoe1xyXG4gICAqICAgd2hlcmU6IC4uLixcclxuICAgKiAgIHRyYW5zYWN0aW9uOiB0MSxcclxuICAgKiAgIGxvY2s6IHRydWUsXHJcbiAgICogICBza2lwTG9ja2VkOiB0cnVlXHJcbiAgICogfSk7XHJcbiAgICogIyBUaGUgcXVlcnkgd2lsbCBub3cgcmV0dXJuIGFueSByb3dzIHRoYXQgYXJlbid0IGxvY2tlZCBieSBhbm90aGVyIHRyYW5zYWN0aW9uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gICAqIEBwcm9wZXJ0eSBVUERBVEVcclxuICAgKiBAcHJvcGVydHkgU0hBUkVcclxuICAgKiBAcHJvcGVydHkgS0VZX1NIQVJFIFBvc3RncmVzIDkuMysgb25seVxyXG4gICAqIEBwcm9wZXJ0eSBOT19LRVlfVVBEQVRFIFBvc3RncmVzIDkuMysgb25seVxyXG4gICAqL1xyXG4gIHN0YXRpYyBnZXQgTE9DSygpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIFVQREFURTogJ1VQREFURScsXHJcbiAgICAgIFNIQVJFOiAnU0hBUkUnLFxyXG4gICAgICBLRVlfU0hBUkU6ICdLRVkgU0hBUkUnLFxyXG4gICAgICBOT19LRVlfVVBEQVRFOiAnTk8gS0VZIFVQREFURSdcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQbGVhc2Ugc2VlIHtAbGluayBUcmFuc2FjdGlvbi5MT0NLfVxyXG4gICAqL1xyXG4gIGdldCBMT0NLKCkge1xyXG4gICAgcmV0dXJuIFRyYW5zYWN0aW9uLkxPQ0s7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zYWN0aW9uO1xyXG5tb2R1bGUuZXhwb3J0cy5UcmFuc2FjdGlvbiA9IFRyYW5zYWN0aW9uO1xyXG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gVHJhbnNhY3Rpb247XHJcbiJdfQ==