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