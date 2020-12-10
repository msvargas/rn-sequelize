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


let Transaction = /*#__PURE__*/function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi90cmFuc2FjdGlvbi5qcyJdLCJuYW1lcyI6WyJQcm9taXNlIiwicmVxdWlyZSIsIlRyYW5zYWN0aW9uIiwic2VxdWVsaXplIiwib3B0aW9ucyIsInNhdmVwb2ludHMiLCJfYWZ0ZXJDb21taXRIb29rcyIsImdlbmVyYXRlVHJhbnNhY3Rpb25JZCIsImRpYWxlY3QiLCJRdWVyeUdlbmVyYXRvciIsIk9iamVjdCIsImFzc2lnbiIsInR5cGUiLCJ0cmFuc2FjdGlvblR5cGUiLCJpc29sYXRpb25MZXZlbCIsInJlYWRPbmx5IiwicGFyZW50IiwidHJhbnNhY3Rpb24iLCJpZCIsInB1c2giLCJuYW1lIiwibGVuZ3RoIiwiZmluaXNoZWQiLCJyZWplY3QiLCJFcnJvciIsIl9jbGVhckNscyIsImdldFF1ZXJ5SW50ZXJmYWNlIiwiY29tbWl0VHJhbnNhY3Rpb24iLCJmaW5hbGx5IiwiY2xlYW51cCIsInRhcCIsImVhY2giLCJob29rIiwicmVzb2x2ZSIsImFwcGx5IiwiY29ubmVjdGlvbiIsInJvbGxiYWNrVHJhbnNhY3Rpb24iLCJ1c2VDTFMiLCJjb25uZWN0aW9uUHJvbWlzZSIsInVuZGVmaW5lZCIsImFjcXVpcmVPcHRpb25zIiwidXVpZCIsImNvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0Q29ubmVjdGlvbiIsInRoZW4iLCJiZWdpbiIsInNldERlZmVycmFibGUiLCJjYXRjaCIsInNldHVwRXJyIiwicm9sbGJhY2siLCJjb25zdHJ1Y3RvciIsIl9jbHMiLCJzZXQiLCJkZWZlcnJhYmxlIiwiZGVmZXJDb25zdHJhaW50cyIsInF1ZXJ5SW50ZXJmYWNlIiwic3VwcG9ydHMiLCJzZXR0aW5nSXNvbGF0aW9uTGV2ZWxEdXJpbmdUcmFuc2FjdGlvbiIsInN0YXJ0VHJhbnNhY3Rpb24iLCJzZXRJc29sYXRpb25MZXZlbCIsInJlcyIsInJlbGVhc2VDb25uZWN0aW9uIiwiY2xzIiwiZ2V0IiwiZm4iLCJMT0NLIiwiREVGRVJSRUQiLCJJTU1FRElBVEUiLCJFWENMVVNJVkUiLCJSRUFEX1VOQ09NTUlUVEVEIiwiUkVBRF9DT01NSVRURUQiLCJSRVBFQVRBQkxFX1JFQUQiLCJTRVJJQUxJWkFCTEUiLCJVUERBVEUiLCJTSEFSRSIsIktFWV9TSEFSRSIsIk5PX0tFWV9VUERBVEUiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUMsV0FBRCxDQUF2QjtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztJQUNNQyxXO0FBQ0o7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0UsdUJBQVlDLFNBQVosRUFBdUJDLE9BQXZCLEVBQWdDO0FBQUE7O0FBQzlCLFNBQUtELFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0EsU0FBS0UsVUFBTCxHQUFrQixFQUFsQjtBQUNBLFNBQUtDLGlCQUFMLEdBQXlCLEVBQXpCLENBSDhCLENBSzlCOztBQUNBLFVBQU1DLHFCQUFxQixHQUFHLEtBQUtKLFNBQUwsQ0FBZUssT0FBZixDQUF1QkMsY0FBdkIsQ0FBc0NGLHFCQUFwRTtBQUVBLFNBQUtILE9BQUwsR0FBZU0sTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFDM0JDLE1BQUFBLElBQUksRUFBRVQsU0FBUyxDQUFDQyxPQUFWLENBQWtCUyxlQURHO0FBRTNCQyxNQUFBQSxjQUFjLEVBQUVYLFNBQVMsQ0FBQ0MsT0FBVixDQUFrQlUsY0FGUDtBQUczQkMsTUFBQUEsUUFBUSxFQUFFO0FBSGlCLEtBQWQsRUFJWlgsT0FBTyxJQUFJLEVBSkMsQ0FBZjtBQU1BLFNBQUtZLE1BQUwsR0FBYyxLQUFLWixPQUFMLENBQWFhLFdBQTNCOztBQUVBLFFBQUksS0FBS0QsTUFBVCxFQUFpQjtBQUNmLFdBQUtFLEVBQUwsR0FBVSxLQUFLRixNQUFMLENBQVlFLEVBQXRCO0FBQ0EsV0FBS0YsTUFBTCxDQUFZWCxVQUFaLENBQXVCYyxJQUF2QixDQUE0QixJQUE1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blxuY29uc3QgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpO1xuXG4vKipcbiAqIFRoZSB0cmFuc2FjdGlvbiBvYmplY3QgaXMgdXNlZCB0byBpZGVudGlmeSBhIHJ1bm5pbmcgdHJhbnNhY3Rpb24uXG4gKiBJdCBpcyBjcmVhdGVkIGJ5IGNhbGxpbmcgYFNlcXVlbGl6ZS50cmFuc2FjdGlvbigpYC5cbiAqIFRvIHJ1biBhIHF1ZXJ5IHVuZGVyIGEgdHJhbnNhY3Rpb24sIHlvdSBzaG91bGQgcGFzcyB0aGUgdHJhbnNhY3Rpb24gaW4gdGhlIG9wdGlvbnMgb2JqZWN0LlxuICpcbiAqIEBjbGFzcyBUcmFuc2FjdGlvblxuICogQHNlZSB7QGxpbmsgU2VxdWVsaXplLnRyYW5zYWN0aW9ufVxuICovXG5jbGFzcyBUcmFuc2FjdGlvbiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHRyYW5zYWN0aW9uIGluc3RhbmNlXG4gICAqXG4gICAqIEBwYXJhbSB7U2VxdWVsaXplfSBzZXF1ZWxpemUgQSBjb25maWd1cmVkIHNlcXVlbGl6ZSBJbnN0YW5jZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBBbiBvYmplY3Qgd2l0aCBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50eXBlXSBTZXRzIHRoZSB0eXBlIG9mIHRoZSB0cmFuc2FjdGlvbi4gU3FsaXRlIG9ubHlcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmlzb2xhdGlvbkxldmVsXSBTZXRzIHRoZSBpc29sYXRpb24gbGV2ZWwgb2YgdGhlIHRyYW5zYWN0aW9uLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVmZXJyYWJsZV0gU2V0cyB0aGUgY29uc3RyYWludHMgdG8gYmUgZGVmZXJyZWQgb3IgaW1tZWRpYXRlbHkgY2hlY2tlZC4gUG9zdGdyZVNRTCBvbmx5XG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXF1ZWxpemUsIG9wdGlvbnMpIHtcbiAgICB0aGlzLnNlcXVlbGl6ZSA9IHNlcXVlbGl6ZTtcbiAgICB0aGlzLnNhdmVwb2ludHMgPSBbXTtcbiAgICB0aGlzLl9hZnRlckNvbW1pdEhvb2tzID0gW107XG5cbiAgICAvLyBnZXQgZGlhbGVjdCBzcGVjaWZpYyB0cmFuc2FjdGlvbiBvcHRpb25zXG4gICAgY29uc3QgZ2VuZXJhdGVUcmFuc2FjdGlvbklkID0gdGhpcy5zZXF1ZWxpemUuZGlhbGVjdC5RdWVyeUdlbmVyYXRvci5nZW5lcmF0ZVRyYW5zYWN0aW9uSWQ7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHR5cGU6IHNlcXVlbGl6ZS5vcHRpb25zLnRyYW5zYWN0aW9uVHlwZSxcbiAgICAgIGlzb2xhdGlvbkxldmVsOiBzZXF1ZWxpemUub3B0aW9ucy5pc29sYXRpb25MZXZlbCxcbiAgICAgIHJlYWRPbmx5OiBmYWxzZVxuICAgIH0sIG9wdGlvbnMgfHwge30pO1xuXG4gICAgdGhpcy5wYXJlbnQgPSB0aGlzLm9wdGlvbnMudHJhbnNhY3Rpb247XG5cbiAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgIHRoaXMuaWQgPSB0aGlzLnBhcmVudC5pZDtcbiAgICAgIHRoaXMucGFyZW50LnNhdmVwb2ludHMucHVzaCh0aGlzKTtcbiAgICAgIHRoaXMubmFtZSA9IGAke3RoaXMuaWR9LXNwLSR7dGhpcy5wYXJlbnQuc2F2ZXBvaW50cy5sZW5ndGh9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pZCA9IHRoaXMubmFtZSA9IGdlbmVyYXRlVHJhbnNhY3Rpb25JZCgpO1xuICAgIH1cblxuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMudHJhbnNhY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogQ29tbWl0IHRoZSB0cmFuc2FjdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGNvbW1pdCgpIHtcbiAgICBpZiAodGhpcy5maW5pc2hlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihgVHJhbnNhY3Rpb24gY2Fubm90IGJlIGNvbW1pdHRlZCBiZWNhdXNlIGl0IGhhcyBiZWVuIGZpbmlzaGVkIHdpdGggc3RhdGU6ICR7dGhpcy5maW5pc2hlZH1gKSk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2xlYXJDbHMoKTtcblxuICAgIHJldHVybiB0aGlzXG4gICAgICAuc2VxdWVsaXplXG4gICAgICAuZ2V0UXVlcnlJbnRlcmZhY2UoKVxuICAgICAgLmNvbW1pdFRyYW5zYWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucylcbiAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgdGhpcy5maW5pc2hlZCA9ICdjb21taXQnO1xuICAgICAgICBpZiAoIXRoaXMucGFyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSkudGFwKFxuICAgICAgICAoKSA9PiBQcm9taXNlLmVhY2goXG4gICAgICAgICAgdGhpcy5fYWZ0ZXJDb21taXRIb29rcyxcbiAgICAgICAgICBob29rID0+IFByb21pc2UucmVzb2x2ZShob29rLmFwcGx5KHRoaXMsIFt0aGlzXSkpKVxuICAgICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSb2xsYmFjayAoYWJvcnQpIHRoZSB0cmFuc2FjdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHJvbGxiYWNrKCkge1xuICAgIGlmICh0aGlzLmZpbmlzaGVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBUcmFuc2FjdGlvbiBjYW5ub3QgYmUgcm9sbGVkIGJhY2sgYmVjYXVzZSBpdCBoYXMgYmVlbiBmaW5pc2hlZCB3aXRoIHN0YXRlOiAke3RoaXMuZmluaXNoZWR9YCkpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb25uZWN0aW9uKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdUcmFuc2FjdGlvbiBjYW5ub3QgYmUgcm9sbGVkIGJhY2sgYmVjYXVzZSBpdCBuZXZlciBzdGFydGVkJykpO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFyQ2xzKCk7XG5cbiAgICByZXR1cm4gdGhpc1xuICAgICAgLnNlcXVlbGl6ZVxuICAgICAgLmdldFF1ZXJ5SW50ZXJmYWNlKClcbiAgICAgIC5yb2xsYmFja1RyYW5zYWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucylcbiAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLnBhcmVudCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0pO1xuICB9XG5cbiAgcHJlcGFyZUVudmlyb25tZW50KHVzZUNMUykge1xuICAgIGxldCBjb25uZWN0aW9uUHJvbWlzZTtcblxuICAgIGlmICh1c2VDTFMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdXNlQ0xTID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgIGNvbm5lY3Rpb25Qcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKHRoaXMucGFyZW50LmNvbm5lY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhY3F1aXJlT3B0aW9ucyA9IHsgdXVpZDogdGhpcy5pZCB9O1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZWFkT25seSkge1xuICAgICAgICBhY3F1aXJlT3B0aW9ucy50eXBlID0gJ1NFTEVDVCc7XG4gICAgICB9XG4gICAgICBjb25uZWN0aW9uUHJvbWlzZSA9IHRoaXMuc2VxdWVsaXplLmNvbm5lY3Rpb25NYW5hZ2VyLmdldENvbm5lY3Rpb24oYWNxdWlyZU9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiBjb25uZWN0aW9uUHJvbWlzZVxuICAgICAgLnRoZW4oY29ubmVjdGlvbiA9PiB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi51dWlkID0gdGhpcy5pZDtcbiAgICAgIH0pXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmJlZ2luKClcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNldERlZmVycmFibGUoKSlcbiAgICAgICAgICAuY2F0Y2goc2V0dXBFcnIgPT4gdGhpcy5yb2xsYmFjaygpLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgdGhyb3cgc2V0dXBFcnI7XG4gICAgICAgICAgfSkpO1xuICAgICAgfSlcbiAgICAgIC50YXAoKCkgPT4ge1xuICAgICAgICBpZiAodXNlQ0xTICYmIHRoaXMuc2VxdWVsaXplLmNvbnN0cnVjdG9yLl9jbHMpIHtcbiAgICAgICAgICB0aGlzLnNlcXVlbGl6ZS5jb25zdHJ1Y3Rvci5fY2xzLnNldCgndHJhbnNhY3Rpb24nLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0pO1xuICB9XG5cbiAgc2V0RGVmZXJyYWJsZSgpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZmVycmFibGUpIHtcbiAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIC5zZXF1ZWxpemVcbiAgICAgICAgLmdldFF1ZXJ5SW50ZXJmYWNlKClcbiAgICAgICAgLmRlZmVyQ29uc3RyYWludHModGhpcywgdGhpcy5vcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBiZWdpbigpIHtcbiAgICBjb25zdCBxdWVyeUludGVyZmFjZSA9IHRoaXMuc2VxdWVsaXplLmdldFF1ZXJ5SW50ZXJmYWNlKCk7XG5cbiAgICBpZiAoIHRoaXMuc2VxdWVsaXplLmRpYWxlY3Quc3VwcG9ydHMuc2V0dGluZ0lzb2xhdGlvbkxldmVsRHVyaW5nVHJhbnNhY3Rpb24gKSB7XG4gICAgICByZXR1cm4gcXVlcnlJbnRlcmZhY2Uuc3RhcnRUcmFuc2FjdGlvbih0aGlzLCB0aGlzLm9wdGlvbnMpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gcXVlcnlJbnRlcmZhY2Uuc2V0SXNvbGF0aW9uTGV2ZWwodGhpcywgdGhpcy5vcHRpb25zLmlzb2xhdGlvbkxldmVsLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXJ5SW50ZXJmYWNlLnNldElzb2xhdGlvbkxldmVsKHRoaXMsIHRoaXMub3B0aW9ucy5pc29sYXRpb25MZXZlbCwgdGhpcy5vcHRpb25zKS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBxdWVyeUludGVyZmFjZS5zdGFydFRyYW5zYWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucyk7XG4gICAgfSk7XG4gIH1cblxuICBjbGVhbnVwKCkge1xuICAgIGNvbnN0IHJlcyA9IHRoaXMuc2VxdWVsaXplLmNvbm5lY3Rpb25NYW5hZ2VyLnJlbGVhc2VDb25uZWN0aW9uKHRoaXMuY29ubmVjdGlvbik7XG4gICAgdGhpcy5jb25uZWN0aW9uLnV1aWQgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIF9jbGVhckNscygpIHtcbiAgICBjb25zdCBjbHMgPSB0aGlzLnNlcXVlbGl6ZS5jb25zdHJ1Y3Rvci5fY2xzO1xuXG4gICAgaWYgKGNscykge1xuICAgICAgaWYgKGNscy5nZXQoJ3RyYW5zYWN0aW9uJykgPT09IHRoaXMpIHtcbiAgICAgICAgY2xzLnNldCgndHJhbnNhY3Rpb24nLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQSBob29rIHRoYXQgaXMgcnVuIGFmdGVyIGEgdHJhbnNhY3Rpb24gaXMgY29tbWl0dGVkXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuICAgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aXRoIHRoZSBjb21taXR0ZWQgdHJhbnNhY3Rpb25cbiAgICogQG5hbWUgYWZ0ZXJDb21taXRcbiAgICogQG1lbWJlcm9mIFNlcXVlbGl6ZS5UcmFuc2FjdGlvblxuICAgKi9cbiAgYWZ0ZXJDb21taXQoZm4pIHtcbiAgICBpZiAoIWZuIHx8IHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcImZuXCIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgfVxuICAgIHRoaXMuX2FmdGVyQ29tbWl0SG9va3MucHVzaChmbik7XG4gIH1cblxuICAvKipcbiAgICogVHlwZXMgY2FuIGJlIHNldCBwZXItdHJhbnNhY3Rpb24gYnkgcGFzc2luZyBgb3B0aW9ucy50eXBlYCB0byBgc2VxdWVsaXplLnRyYW5zYWN0aW9uYC5cbiAgICogRGVmYXVsdCB0byBgREVGRVJSRURgIGJ1dCB5b3UgY2FuIG92ZXJyaWRlIHRoZSBkZWZhdWx0IHR5cGUgYnkgcGFzc2luZyBgb3B0aW9ucy50cmFuc2FjdGlvblR5cGVgIGluIGBuZXcgU2VxdWVsaXplYC5cbiAgICogU3FsaXRlIG9ubHkuXG4gICAqXG4gICAqIFBhc3MgaW4gdGhlIGRlc2lyZWQgbGV2ZWwgYXMgdGhlIGZpcnN0IGFyZ3VtZW50OlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiByZXR1cm4gc2VxdWVsaXplLnRyYW5zYWN0aW9uKHt0eXBlOiBTZXF1ZWxpemUuVHJhbnNhY3Rpb24uVFlQRVMuRVhDTFVTSVZFfSwgdHJhbnNhY3Rpb24gPT4ge1xuICAgKiAgIC8vIHlvdXIgdHJhbnNhY3Rpb25zXG4gICAqIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICogICAvLyB0cmFuc2FjdGlvbiBoYXMgYmVlbiBjb21taXR0ZWQuIERvIHNvbWV0aGluZyBhZnRlciB0aGUgY29tbWl0IGlmIHJlcXVpcmVkLlxuICAgKiB9KS5jYXRjaChlcnIgPT4ge1xuICAgKiAgIC8vIGRvIHNvbWV0aGluZyB3aXRoIHRoZSBlcnIuXG4gICAqIH0pO1xuICAgKlxuICAgKiBAcHJvcGVydHkgREVGRVJSRURcbiAgICogQHByb3BlcnR5IElNTUVESUFURVxuICAgKiBAcHJvcGVydHkgRVhDTFVTSVZFXG4gICAqL1xuICBzdGF0aWMgZ2V0IFRZUEVTKCkge1xuICAgIHJldHVybiB7XG4gICAgICBERUZFUlJFRDogJ0RFRkVSUkVEJyxcbiAgICAgIElNTUVESUFURTogJ0lNTUVESUFURScsXG4gICAgICBFWENMVVNJVkU6ICdFWENMVVNJVkUnXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJc29sYXRpb24gbGV2ZWxzIGNhbiBiZSBzZXQgcGVyLXRyYW5zYWN0aW9uIGJ5IHBhc3NpbmcgYG9wdGlvbnMuaXNvbGF0aW9uTGV2ZWxgIHRvIGBzZXF1ZWxpemUudHJhbnNhY3Rpb25gLlxuICAgKiBTZXF1ZWxpemUgdXNlcyB0aGUgZGVmYXVsdCBpc29sYXRpb24gbGV2ZWwgb2YgdGhlIGRhdGFiYXNlLCB5b3UgY2FuIG92ZXJyaWRlIHRoaXMgYnkgcGFzc2luZyBgb3B0aW9ucy5pc29sYXRpb25MZXZlbGAgaW4gU2VxdWVsaXplIGNvbnN0cnVjdG9yIG9wdGlvbnMuXG4gICAqXG4gICAqIFBhc3MgaW4gdGhlIGRlc2lyZWQgbGV2ZWwgYXMgdGhlIGZpcnN0IGFyZ3VtZW50OlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiByZXR1cm4gc2VxdWVsaXplLnRyYW5zYWN0aW9uKHtpc29sYXRpb25MZXZlbDogU2VxdWVsaXplLlRyYW5zYWN0aW9uLklTT0xBVElPTl9MRVZFTFMuU0VSSUFMSVpBQkxFfSwgdHJhbnNhY3Rpb24gPT4ge1xuICAgKiAgIC8vIHlvdXIgdHJhbnNhY3Rpb25zXG4gICAqIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICogICAvLyB0cmFuc2FjdGlvbiBoYXMgYmVlbiBjb21taXR0ZWQuIERvIHNvbWV0aGluZyBhZnRlciB0aGUgY29tbWl0IGlmIHJlcXVpcmVkLlxuICAgKiB9KS5jYXRjaChlcnIgPT4ge1xuICAgKiAgIC8vIGRvIHNvbWV0aGluZyB3aXRoIHRoZSBlcnIuXG4gICAqIH0pO1xuICAgKlxuICAgKiBAcHJvcGVydHkgUkVBRF9VTkNPTU1JVFRFRFxuICAgKiBAcHJvcGVydHkgUkVBRF9DT01NSVRURURcbiAgICogQHByb3BlcnR5IFJFUEVBVEFCTEVfUkVBRFxuICAgKiBAcHJvcGVydHkgU0VSSUFMSVpBQkxFXG4gICAqL1xuICBzdGF0aWMgZ2V0IElTT0xBVElPTl9MRVZFTFMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFJFQURfVU5DT01NSVRURUQ6ICdSRUFEIFVOQ09NTUlUVEVEJyxcbiAgICAgIFJFQURfQ09NTUlUVEVEOiAnUkVBRCBDT01NSVRURUQnLFxuICAgICAgUkVQRUFUQUJMRV9SRUFEOiAnUkVQRUFUQUJMRSBSRUFEJyxcbiAgICAgIFNFUklBTElaQUJMRTogJ1NFUklBTElaQUJMRSdcbiAgICB9O1xuICB9XG5cblxuICAvKipcbiAgICogUG9zc2libGUgb3B0aW9ucyBmb3Igcm93IGxvY2tpbmcuIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCBgZmluZGAgY2FsbHM6XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIC8vIHQxIGlzIGEgdHJhbnNhY3Rpb25cbiAgICogTW9kZWwuZmluZEFsbCh7XG4gICAqICAgd2hlcmU6IC4uLixcbiAgICogICB0cmFuc2FjdGlvbjogdDEsXG4gICAqICAgbG9jazogdDEuTE9DSy4uLlxuICAgKiB9KTtcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+UG9zdGdyZXMgYWxzbyBzdXBwb3J0cyBzcGVjaWZpYyBsb2NrcyB3aGlsZSBlYWdlciBsb2FkaW5nIGJ5IHVzaW5nIE9GOjwvY2FwdGlvbj5cbiAgICogVXNlck1vZGVsLmZpbmRBbGwoe1xuICAgKiAgIHdoZXJlOiAuLi4sXG4gICAqICAgaW5jbHVkZTogW1Rhc2tNb2RlbCwgLi4uXSxcbiAgICogICB0cmFuc2FjdGlvbjogdDEsXG4gICAqICAgbG9jazoge1xuICAgKiAgICAgbGV2ZWw6IHQxLkxPQ0suLi4sXG4gICAqICAgICBvZjogVXNlck1vZGVsXG4gICAqICAgfVxuICAgKiB9KTtcbiAgICpcbiAgICogIyBVc2VyTW9kZWwgd2lsbCBiZSBsb2NrZWQgYnV0IFRhc2tNb2RlbCB3b24ndCFcbiAgICpcbiAgICogQGV4YW1wbGUgPGNhcHRpb24+WW91IGNhbiBhbHNvIHNraXAgbG9ja2VkIHJvd3M6PC9jYXB0aW9uPlxuICAgKiAvLyB0MSBpcyBhIHRyYW5zYWN0aW9uXG4gICAqIE1vZGVsLmZpbmRBbGwoe1xuICAgKiAgIHdoZXJlOiAuLi4sXG4gICAqICAgdHJhbnNhY3Rpb246IHQxLFxuICAgKiAgIGxvY2s6IHRydWUsXG4gICAqICAgc2tpcExvY2tlZDogdHJ1ZVxuICAgKiB9KTtcbiAgICogIyBUaGUgcXVlcnkgd2lsbCBub3cgcmV0dXJuIGFueSByb3dzIHRoYXQgYXJlbid0IGxvY2tlZCBieSBhbm90aGVyIHRyYW5zYWN0aW9uXG4gICAqXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqIEBwcm9wZXJ0eSBVUERBVEVcbiAgICogQHByb3BlcnR5IFNIQVJFXG4gICAqIEBwcm9wZXJ0eSBLRVlfU0hBUkUgUG9zdGdyZXMgOS4zKyBvbmx5XG4gICAqIEBwcm9wZXJ0eSBOT19LRVlfVVBEQVRFIFBvc3RncmVzIDkuMysgb25seVxuICAgKi9cbiAgc3RhdGljIGdldCBMT0NLKCkge1xuICAgIHJldHVybiB7XG4gICAgICBVUERBVEU6ICdVUERBVEUnLFxuICAgICAgU0hBUkU6ICdTSEFSRScsXG4gICAgICBLRVlfU0hBUkU6ICdLRVkgU0hBUkUnLFxuICAgICAgTk9fS0VZX1VQREFURTogJ05PIEtFWSBVUERBVEUnXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQbGVhc2Ugc2VlIHtAbGluayBUcmFuc2FjdGlvbi5MT0NLfVxuICAgKi9cbiAgZ2V0IExPQ0soKSB7XG4gICAgcmV0dXJuIFRyYW5zYWN0aW9uLkxPQ0s7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2FjdGlvbjtcbm1vZHVsZS5leHBvcnRzLlRyYW5zYWN0aW9uID0gVHJhbnNhY3Rpb247XG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gVHJhbnNhY3Rpb247XG4iXX0=