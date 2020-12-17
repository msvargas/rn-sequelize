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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9kaWFsZWN0cy9hYnN0cmFjdC9xdWVyeS1nZW5lcmF0b3IvdHJhbnNhY3Rpb24uanMiXSwibmFtZXMiOlsidXVpZHY0IiwicmVxdWlyZSIsIlRyYW5zYWN0aW9uUXVlcmllcyIsInNldElzb2xhdGlvbkxldmVsUXVlcnkiLCJ2YWx1ZSIsIm9wdGlvbnMiLCJwYXJlbnQiLCJnZW5lcmF0ZVRyYW5zYWN0aW9uSWQiLCJzdGFydFRyYW5zYWN0aW9uUXVlcnkiLCJ0cmFuc2FjdGlvbiIsInF1b3RlSWRlbnRpZmllciIsIm5hbWUiLCJkZWZlckNvbnN0cmFpbnRzUXVlcnkiLCJzZXRDb25zdHJhaW50UXVlcnkiLCJzZXREZWZlcnJlZFF1ZXJ5Iiwic2V0SW1tZWRpYXRlUXVlcnkiLCJjb21taXRUcmFuc2FjdGlvblF1ZXJ5Iiwicm9sbGJhY2tUcmFuc2FjdGlvblF1ZXJ5IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUEsTUFBTUEsTUFBTSxHQUFHQyxPQUFPLENBQUMsU0FBRCxDQUF0Qjs7QUFFQSxNQUFNQyxrQkFBa0IsR0FBRztBQUN6QjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0VDLEVBQUFBLHNCQUFzQixDQUFDQyxLQUFELEVBQVFDLE9BQVIsRUFBaUI7QUFDckMsUUFBSUEsT0FBTyxDQUFDQyxNQUFaLEVBQW9CO0FBQ2xCO0FBQ0Q7O0FBRUQsV0FBUSxtQ0FBa0NGLEtBQU0sR0FBaEQ7QUFDRCxHQWZ3Qjs7QUFpQnpCRyxFQUFBQSxxQkFBcUIsR0FBRztBQUN0QixXQUFPUCxNQUFNLEVBQWI7QUFDRCxHQW5Cd0I7O0FBcUJ6QjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNFUSxFQUFBQSxxQkFBcUIsQ0FBQ0MsV0FBRCxFQUFjO0FBQ2pDLFFBQUlBLFdBQVcsQ0FBQ0gsTUFBaEIsRUFBd0I7QUFDdEI7QUFDQSxhQUFRLGFBQVksS0FBS0ksZUFBTCxDQUFxQkQsV0FBVyxDQUFDRSxJQUFqQyxFQUF1QyxJQUF2QyxDQUE2QyxHQUFqRTtBQUNEOztBQUVELFdBQU8sb0JBQVA7QUFDRCxHQW5Dd0I7O0FBcUN6QkMsRUFBQUEscUJBQXFCLEdBQUcsQ0FBRSxDQXJDRDs7QUF1Q3pCQyxFQUFBQSxrQkFBa0IsR0FBRyxDQUFFLENBdkNFOztBQXdDekJDLEVBQUFBLGdCQUFnQixHQUFHLENBQUUsQ0F4Q0k7O0FBeUN6QkMsRUFBQUEsaUJBQWlCLEdBQUcsQ0FBRSxDQXpDRzs7QUEyQ3pCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0VDLEVBQUFBLHNCQUFzQixDQUFDUCxXQUFELEVBQWM7QUFDbEMsUUFBSUEsV0FBVyxDQUFDSCxNQUFoQixFQUF3QjtBQUN0QjtBQUNEOztBQUVELFdBQU8sU0FBUDtBQUNELEdBeER3Qjs7QUEwRHpCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0VXLEVBQUFBLHdCQUF3QixDQUFDUixXQUFELEVBQWM7QUFDcEMsUUFBSUEsV0FBVyxDQUFDSCxNQUFoQixFQUF3QjtBQUN0QjtBQUNBLGFBQVEseUJBQXdCLEtBQUtJLGVBQUwsQ0FBcUJELFdBQVcsQ0FBQ0UsSUFBakMsRUFBdUMsSUFBdkMsQ0FBNkMsR0FBN0U7QUFDRDs7QUFFRCxXQUFPLFdBQVA7QUFDRDs7QUF4RXdCLENBQTNCO0FBMkVBTyxNQUFNLENBQUNDLE9BQVAsR0FBaUJqQixrQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHV1aWR2NCA9IHJlcXVpcmUoJ3V1aWQvdjQnKTtcblxuY29uc3QgVHJhbnNhY3Rpb25RdWVyaWVzID0ge1xuICAvKipcbiAgICogUmV0dXJucyBhIHF1ZXJ5IHRoYXQgc2V0cyB0aGUgdHJhbnNhY3Rpb24gaXNvbGF0aW9uIGxldmVsLlxuICAgKlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHZhbHVlICAgVGhlIGlzb2xhdGlvbiBsZXZlbC5cbiAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIEFuIG9iamVjdCB3aXRoIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9ICAgICAgICAgVGhlIGdlbmVyYXRlZCBzcWwgcXVlcnkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBzZXRJc29sYXRpb25MZXZlbFF1ZXJ5KHZhbHVlLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMucGFyZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIGBTRVQgVFJBTlNBQ1RJT04gSVNPTEFUSU9OIExFVkVMICR7dmFsdWV9O2A7XG4gIH0sXG5cbiAgZ2VuZXJhdGVUcmFuc2FjdGlvbklkKCkge1xuICAgIHJldHVybiB1dWlkdjQoKTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIHF1ZXJ5IHRoYXQgc3RhcnRzIGEgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvblxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAgICAgICAgIFRoZSBnZW5lcmF0ZWQgc3FsIHF1ZXJ5LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgc3RhcnRUcmFuc2FjdGlvblF1ZXJ5KHRyYW5zYWN0aW9uKSB7XG4gICAgaWYgKHRyYW5zYWN0aW9uLnBhcmVudCkge1xuICAgICAgLy8gZm9yY2UgcXVvdGluZyBvZiBzYXZlcG9pbnQgaWRlbnRpZmllcnMgZm9yIHBvc3RncmVzXG4gICAgICByZXR1cm4gYFNBVkVQT0lOVCAke3RoaXMucXVvdGVJZGVudGlmaWVyKHRyYW5zYWN0aW9uLm5hbWUsIHRydWUpfTtgO1xuICAgIH1cblxuICAgIHJldHVybiAnU1RBUlQgVFJBTlNBQ1RJT047JztcbiAgfSxcblxuICBkZWZlckNvbnN0cmFpbnRzUXVlcnkoKSB7fSxcblxuICBzZXRDb25zdHJhaW50UXVlcnkoKSB7fSxcbiAgc2V0RGVmZXJyZWRRdWVyeSgpIHt9LFxuICBzZXRJbW1lZGlhdGVRdWVyeSgpIHt9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcXVlcnkgdGhhdCBjb21taXRzIGEgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSAge1RyYW5zYWN0aW9ufSB0cmFuc2FjdGlvbiBBbiBvYmplY3Qgd2l0aCBvcHRpb25zLlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSAgICAgICAgIFRoZSBnZW5lcmF0ZWQgc3FsIHF1ZXJ5LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29tbWl0VHJhbnNhY3Rpb25RdWVyeSh0cmFuc2FjdGlvbikge1xuICAgIGlmICh0cmFuc2FjdGlvbi5wYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gJ0NPTU1JVDsnO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcXVlcnkgdGhhdCByb2xsYmFja3MgYSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtICB7VHJhbnNhY3Rpb259IHRyYW5zYWN0aW9uXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9ICAgICAgICAgVGhlIGdlbmVyYXRlZCBzcWwgcXVlcnkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICByb2xsYmFja1RyYW5zYWN0aW9uUXVlcnkodHJhbnNhY3Rpb24pIHtcbiAgICBpZiAodHJhbnNhY3Rpb24ucGFyZW50KSB7XG4gICAgICAvLyBmb3JjZSBxdW90aW5nIG9mIHNhdmVwb2ludCBpZGVudGlmaWVycyBmb3IgcG9zdGdyZXNcbiAgICAgIHJldHVybiBgUk9MTEJBQ0sgVE8gU0FWRVBPSU5UICR7dGhpcy5xdW90ZUlkZW50aWZpZXIodHJhbnNhY3Rpb24ubmFtZSwgdHJ1ZSl9O2A7XG4gICAgfVxuXG4gICAgcmV0dXJuICdST0xMQkFDSzsnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zYWN0aW9uUXVlcmllcztcbiJdfQ==