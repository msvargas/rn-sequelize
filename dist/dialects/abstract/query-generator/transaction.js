'use strict';

const uuidv4 = require('uuid/v4');

const TransactionQueries = {
  /**
   * Returns a query that sets the transaction isolation level.
   *
   * @param  {string} value   The isolation level.
   * @param  {Object} options An object with options.
   * @returns {string}         The generated sql query.
   * @private
   */
  setIsolationLevelQuery(value, options) {
    if (options.parent) {
      return;
    }

    return `SET TRANSACTION ISOLATION LEVEL ${value};`;
  },

  generateTransactionId() {
    return uuidv4();
  },

  /**
   * Returns a query that starts a transaction.
   *
   * @param  {Transaction} transaction
   * @returns {string}         The generated sql query.
   * @private
   */
  startTransactionQuery(transaction) {
    if (transaction.parent) {
      // force quoting of savepoint identifiers for postgres
      return `SAVEPOINT ${this.quoteIdentifier(transaction.name, true)};`;
    }

    return 'START TRANSACTION;';
  },

  deferConstraintsQuery() {},

  setConstraintQuery() {},

  setDeferredQuery() {},

  setImmediateQuery() {},

  /**
   * Returns a query that commits a transaction.
   *
   * @param  {Transaction} transaction An object with options.
   * @returns {string}         The generated sql query.
   * @private
   */
  commitTransactionQuery(transaction) {
    if (transaction.parent) {
      return;
    }

    return 'COMMIT;';
  },

  /**
   * Returns a query that rollbacks a transaction.
   *
   * @param  {Transaction} transaction
   * @returns {string}         The generated sql query.
   * @private
   */
  rollbackTransactionQuery(transaction) {
    if (transaction.parent) {
      // force quoting of savepoint identifiers for postgres
      return `ROLLBACK TO SAVEPOINT ${this.quoteIdentifier(transaction.name, true)};`;
    }

    return 'ROLLBACK;';
  }

};
module.exports = TransactionQueries;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9kaWFsZWN0cy9hYnN0cmFjdC9xdWVyeS1nZW5lcmF0b3IvdHJhbnNhY3Rpb24uanMiXSwibmFtZXMiOlsidXVpZHY0IiwicmVxdWlyZSIsIlRyYW5zYWN0aW9uUXVlcmllcyIsInNldElzb2xhdGlvbkxldmVsUXVlcnkiLCJ2YWx1ZSIsIm9wdGlvbnMiLCJwYXJlbnQiLCJnZW5lcmF0ZVRyYW5zYWN0aW9uSWQiLCJzdGFydFRyYW5zYWN0aW9uUXVlcnkiLCJ0cmFuc2FjdGlvbiIsInF1b3RlSWRlbnRpZmllciIsIm5hbWUiLCJkZWZlckNvbnN0cmFpbnRzUXVlcnkiLCJzZXRDb25zdHJhaW50UXVlcnkiLCJzZXREZWZlcnJlZFF1ZXJ5Iiwic2V0SW1tZWRpYXRlUXVlcnkiLCJjb21taXRUcmFuc2FjdGlvblF1ZXJ5Iiwicm9sbGJhY2tUcmFuc2FjdGlvblF1ZXJ5IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUEsTUFBTUEsTUFBTSxHQUFHQyxPQUFPLENBQUMsU0FBRCxDQUF0Qjs7QUFFQSxNQUFNQyxrQkFBa0IsR0FBRztBQUN6Qjs7Ozs7Ozs7QUFRQUMsRUFBQUEsc0JBQXNCLENBQUNDLEtBQUQsRUFBUUMsT0FBUixFQUFpQjtBQUNyQyxRQUFJQSxPQUFPLENBQUNDLE1BQVosRUFBb0I7QUFDbEI7QUFDRDs7QUFFRCxXQUFRLG1DQUFrQ0YsS0FBTSxHQUFoRDtBQUNELEdBZndCOztBQWlCekJHLEVBQUFBLHFCQUFxQixHQUFHO0FBQ3RCLFdBQU9QLE1BQU0sRUFBYjtBQUNELEdBbkJ3Qjs7QUFxQnpCOzs7Ozs7O0FBT0FRLEVBQUFBLHFCQUFxQixDQUFDQyxXQUFELEVBQWM7QUFDakMsUUFBSUEsV0FBVyxDQUFDSCxNQUFoQixFQUF3QjtBQUN0QjtBQUNBLGFBQVEsYUFBWSxLQUFLSSxlQUFMLENBQXFCRCxXQUFXLENBQUNFLElBQWpDLEVBQXVDLElBQXZDLENBQTZDLEdBQWpFO0FBQ0Q7O0FBRUQsV0FBTyxvQkFBUDtBQUNELEdBbkN3Qjs7QUFxQ3pCQyxFQUFBQSxxQkFBcUIsR0FBRyxDQUFFLENBckNEOztBQXVDekJDLEVBQUFBLGtCQUFrQixHQUFHLENBQUUsQ0F2Q0U7O0FBd0N6QkMsRUFBQUEsZ0JBQWdCLEdBQUcsQ0FBRSxDQXhDSTs7QUF5Q3pCQyxFQUFBQSxpQkFBaUIsR0FBRyxDQUFFLENBekNHOztBQTJDekI7Ozs7Ozs7QUFPQUMsRUFBQUEsc0JBQXNCLENBQUNQLFdBQUQsRUFBYztBQUNsQyxRQUFJQSxXQUFXLENBQUNILE1BQWhCLEVBQXdCO0FBQ3RCO0FBQ0Q7O0FBRUQsV0FBTyxTQUFQO0FBQ0QsR0F4RHdCOztBQTBEekI7Ozs7Ozs7QUFPQVcsRUFBQUEsd0JBQXdCLENBQUNSLFdBQUQsRUFBYztBQUNwQyxRQUFJQSxXQUFXLENBQUNILE1BQWhCLEVBQXdCO0FBQ3RCO0FBQ0EsYUFBUSx5QkFBd0IsS0FBS0ksZUFBTCxDQUFxQkQsV0FBVyxDQUFDRSxJQUFqQyxFQUF1QyxJQUF2QyxDQUE2QyxHQUE3RTtBQUNEOztBQUVELFdBQU8sV0FBUDtBQUNEOztBQXhFd0IsQ0FBM0I7QUEyRUFPLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQmpCLGtCQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IHV1aWR2NCA9IHJlcXVpcmUoJ3V1aWQvdjQnKTtcclxuXHJcbmNvbnN0IFRyYW5zYWN0aW9uUXVlcmllcyA9IHtcclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEgcXVlcnkgdGhhdCBzZXRzIHRoZSB0cmFuc2FjdGlvbiBpc29sYXRpb24gbGV2ZWwuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHZhbHVlICAgVGhlIGlzb2xhdGlvbiBsZXZlbC5cclxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgQW4gb2JqZWN0IHdpdGggb3B0aW9ucy5cclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAgICAgICAgIFRoZSBnZW5lcmF0ZWQgc3FsIHF1ZXJ5LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgc2V0SXNvbGF0aW9uTGV2ZWxRdWVyeSh2YWx1ZSwgb3B0aW9ucykge1xyXG4gICAgaWYgKG9wdGlvbnMucGFyZW50KSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYFNFVCBUUkFOU0FDVElPTiBJU09MQVRJT04gTEVWRUwgJHt2YWx1ZX07YDtcclxuICB9LFxyXG5cclxuICBnZW5lcmF0ZVRyYW5zYWN0aW9uSWQoKSB7XHJcbiAgICByZXR1cm4gdXVpZHY0KCk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhIHF1ZXJ5IHRoYXQgc3RhcnRzIGEgdHJhbnNhY3Rpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gIHtUcmFuc2FjdGlvbn0gdHJhbnNhY3Rpb25cclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAgICAgICAgIFRoZSBnZW5lcmF0ZWQgc3FsIHF1ZXJ5LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgc3RhcnRUcmFuc2FjdGlvblF1ZXJ5KHRyYW5zYWN0aW9uKSB7XHJcbiAgICBpZiAodHJhbnNhY3Rpb24ucGFyZW50KSB7XHJcbiAgICAgIC8vIGZvcmNlIHF1b3Rpbmcgb2Ygc2F2ZXBvaW50IGlkZW50aWZpZXJzIGZvciBwb3N0Z3Jlc1xyXG4gICAgICByZXR1cm4gYFNBVkVQT0lOVCAke3RoaXMucXVvdGVJZGVudGlmaWVyKHRyYW5zYWN0aW9uLm5hbWUsIHRydWUpfTtgO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAnU1RBUlQgVFJBTlNBQ1RJT047JztcclxuICB9LFxyXG5cclxuICBkZWZlckNvbnN0cmFpbnRzUXVlcnkoKSB7fSxcclxuXHJcbiAgc2V0Q29uc3RyYWludFF1ZXJ5KCkge30sXHJcbiAgc2V0RGVmZXJyZWRRdWVyeSgpIHt9LFxyXG4gIHNldEltbWVkaWF0ZVF1ZXJ5KCkge30sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBxdWVyeSB0aGF0IGNvbW1pdHMgYSB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSAge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvbiBBbiBvYmplY3Qgd2l0aCBvcHRpb25zLlxyXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9ICAgICAgICAgVGhlIGdlbmVyYXRlZCBzcWwgcXVlcnkuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBjb21taXRUcmFuc2FjdGlvblF1ZXJ5KHRyYW5zYWN0aW9uKSB7XHJcbiAgICBpZiAodHJhbnNhY3Rpb24ucGFyZW50KSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gJ0NPTU1JVDsnO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBxdWVyeSB0aGF0IHJvbGxiYWNrcyBhIHRyYW5zYWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtICB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXHJcbiAgICogQHJldHVybnMge3N0cmluZ30gICAgICAgICBUaGUgZ2VuZXJhdGVkIHNxbCBxdWVyeS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIHJvbGxiYWNrVHJhbnNhY3Rpb25RdWVyeSh0cmFuc2FjdGlvbikge1xyXG4gICAgaWYgKHRyYW5zYWN0aW9uLnBhcmVudCkge1xyXG4gICAgICAvLyBmb3JjZSBxdW90aW5nIG9mIHNhdmVwb2ludCBpZGVudGlmaWVycyBmb3IgcG9zdGdyZXNcclxuICAgICAgcmV0dXJuIGBST0xMQkFDSyBUTyBTQVZFUE9JTlQgJHt0aGlzLnF1b3RlSWRlbnRpZmllcih0cmFuc2FjdGlvbi5uYW1lLCB0cnVlKX07YDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gJ1JPTExCQUNLOyc7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2FjdGlvblF1ZXJpZXM7XHJcbiJdfQ==