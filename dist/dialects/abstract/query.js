'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const _ = require('lodash');

const SqlString = require('../../sql-string');

const QueryTypes = require('../../query-types');

const Dot = require('dottie');

const deprecations = require('../../utils/deprecations');

const uuid = require('uuid/v4');

let AbstractQuery =
/*#__PURE__*/
function () {
  function AbstractQuery(connection, sequelize, options) {
    _classCallCheck(this, AbstractQuery);

    this.uuid = uuid();
    this.connection = connection;
    this.instance = options.instance;
    this.model = options.model;
    this.sequelize = sequelize;
    this.options = Object.assign({
      plain: false,
      raw: false,
      // eslint-disable-next-line no-console
      logging: console.log
    }, options || {});
    this.checkLoggingOption();
  }
  /**
   * rewrite query with parameters
   *
   * Examples:
   *
   *   query.formatBindParameters('select $1 as foo', ['fooval']);
   *
   *   query.formatBindParameters('select $foo as foo', { foo: 'fooval' });
   *
   * Options
   *   skipUnescape: bool, skip unescaping $$
   *   skipValueReplace: bool, do not replace (but do unescape $$). Check correct syntax and if all values are available
   *
   * @param {string} sql
   * @param {Object|Array} values
   * @param {string} dialect
   * @param {Function} [replacementFunc]
   * @param {Object} [options]
   * @private
   */


  _createClass(AbstractQuery, [{
    key: "run",

    /**
     * Execute the passed sql query.
     *
     * Examples:
     *
     *     query.run('SELECT 1')
     *
     * @private
     */
    value: function run() {
      throw new Error('The run method wasn\'t overwritten!');
    }
    /**
     * Check the logging option of the instance and print deprecation warnings.
     *
     * @private
     */

  }, {
    key: "checkLoggingOption",
    value: function checkLoggingOption() {
      if (this.options.logging === true) {
        deprecations.noTrueLogging(); // eslint-disable-next-line no-console

        this.options.logging = console.log;
      }
    }
    /**
     * Get the attributes of an insert query, which contains the just inserted id.
     *
     * @returns {string} The field name.
     * @private
     */

  }, {
    key: "getInsertIdField",
    value: function getInsertIdField() {
      return 'insertId';
    }
  }, {
    key: "getUniqueConstraintErrorMessage",
    value: function getUniqueConstraintErrorMessage(field) {
      let message = field ? `${field} must be unique` : 'Must be unique';

      if (field && this.model) {
        for (const key of Object.keys(this.model.uniqueKeys)) {
          if (this.model.uniqueKeys[key].fields.includes(field.replace(/"/g, ''))) {
            if (this.model.uniqueKeys[key].msg) {
              message = this.model.uniqueKeys[key].msg;
            }
          }
        }
      }

      return message;
    }
  }, {
    key: "isRawQuery",
    value: function isRawQuery() {
      return this.options.type === QueryTypes.RAW;
    }
  }, {
    key: "isVersionQuery",
    value: function isVersionQuery() {
      return this.options.type === QueryTypes.VERSION;
    }
  }, {
    key: "isUpsertQuery",
    value: function isUpsertQuery() {
      return this.options.type === QueryTypes.UPSERT;
    }
  }, {
    key: "isInsertQuery",
    value: function isInsertQuery(results, metaData) {
      let result = true;

      if (this.options.type === QueryTypes.INSERT) {
        return true;
      } // is insert query if sql contains insert into


      result = result && this.sql.toLowerCase().startsWith('insert into'); // is insert query if no results are passed or if the result has the inserted id

      result = result && (!results || Object.prototype.hasOwnProperty.call(results, this.getInsertIdField())); // is insert query if no metadata are passed or if the metadata has the inserted id

      result = result && (!metaData || Object.prototype.hasOwnProperty.call(metaData, this.getInsertIdField()));
      return result;
    }
  }, {
    key: "handleInsertQuery",
    value: function handleInsertQuery(results, metaData) {
      if (this.instance) {
        // add the inserted row id to the instance
        const autoIncrementAttribute = this.model.autoIncrementAttribute;
        let id = null;
        id = id || results && results[this.getInsertIdField()];
        id = id || metaData && metaData[this.getInsertIdField()];
        this.instance[autoIncrementAttribute] = id;
      }
    }
  }, {
    key: "isShowTablesQuery",
    value: function isShowTablesQuery() {
      return this.options.type === QueryTypes.SHOWTABLES;
    }
  }, {
    key: "handleShowTablesQuery",
    value: function handleShowTablesQuery(results) {
      return _.flatten(results.map(resultSet => _.values(resultSet)));
    }
  }, {
    key: "isShowIndexesQuery",
    value: function isShowIndexesQuery() {
      return this.options.type === QueryTypes.SHOWINDEXES;
    }
  }, {
    key: "isShowConstraintsQuery",
    value: function isShowConstraintsQuery() {
      return this.options.type === QueryTypes.SHOWCONSTRAINTS;
    }
  }, {
    key: "isDescribeQuery",
    value: function isDescribeQuery() {
      return this.options.type === QueryTypes.DESCRIBE;
    }
  }, {
    key: "isSelectQuery",
    value: function isSelectQuery() {
      return this.options.type === QueryTypes.SELECT;
    }
  }, {
    key: "isBulkUpdateQuery",
    value: function isBulkUpdateQuery() {
      return this.options.type === QueryTypes.BULKUPDATE;
    }
  }, {
    key: "isBulkDeleteQuery",
    value: function isBulkDeleteQuery() {
      return this.options.type === QueryTypes.BULKDELETE;
    }
  }, {
    key: "isForeignKeysQuery",
    value: function isForeignKeysQuery() {
      return this.options.type === QueryTypes.FOREIGNKEYS;
    }
  }, {
    key: "isUpdateQuery",
    value: function isUpdateQuery() {
      return this.options.type === QueryTypes.UPDATE;
    }
  }, {
    key: "handleSelectQuery",
    value: function handleSelectQuery(results) {
      let result = null; // Map raw fields to names if a mapping is provided

      if (this.options.fieldMap) {
        const fieldMap = this.options.fieldMap;
        results = results.map(result => _.reduce(fieldMap, (result, name, field) => {
          if (result[field] !== undefined && name !== field) {
            result[name] = result[field];
            delete result[field];
          }

          return result;
        }, result));
      } // Raw queries


      if (this.options.raw) {
        result = results.map(result => {
          let o = {};

          for (const key in result) {
            if (Object.prototype.hasOwnProperty.call(result, key)) {
              o[key] = result[key];
            }
          }

          if (this.options.nest) {
            o = Dot.transform(o);
          }

          return o;
        }); // Queries with include
      } else if (this.options.hasJoin === true) {
        results = AbstractQuery._groupJoinData(results, {
          model: this.model,
          includeMap: this.options.includeMap,
          includeNames: this.options.includeNames
        }, {
          checkExisting: this.options.hasMultiAssociation
        });
        result = this.model.bulkBuild(results, {
          isNewRecord: false,
          include: this.options.include,
          includeNames: this.options.includeNames,
          includeMap: this.options.includeMap,
          includeValidated: true,
          attributes: this.options.originalAttributes || this.options.attributes,
          raw: true
        }); // Regular queries
      } else {
        result = this.model.bulkBuild(results, {
          isNewRecord: false,
          raw: true,
          attributes: this.options.originalAttributes || this.options.attributes
        });
      } // return the first real model instance if options.plain is set (e.g. Model.find)


      if (this.options.plain) {
        result = result.length === 0 ? null : result[0];
      }

      return result;
    }
  }, {
    key: "isShowOrDescribeQuery",
    value: function isShowOrDescribeQuery() {
      let result = false;
      result = result || this.sql.toLowerCase().startsWith('show');
      result = result || this.sql.toLowerCase().startsWith('describe');
      return result;
    }
  }, {
    key: "isCallQuery",
    value: function isCallQuery() {
      return this.sql.toLowerCase().startsWith('call');
    }
    /**
     * @param {string} sql
     * @param {Function} debugContext
     * @param {Array|Object} parameters
     * @protected
     * @returns {Function} A function to call after the query was completed.
     */

  }, {
    key: "_logQuery",
    value: function _logQuery(sql, debugContext, parameters) {
      const {
        connection,
        options
      } = this;
      const benchmark = this.sequelize.options.benchmark || options.benchmark;
      const logQueryParameters = this.sequelize.options.logQueryParameters || options.logQueryParameters;
      const startTime = Date.now();
      let logParameter = '';

      if (logQueryParameters && parameters) {
        const delimiter = sql.endsWith(';') ? '' : ';';
        let paramStr;

        if (Array.isArray(parameters)) {
          paramStr = parameters.map(p => JSON.stringify(p)).join(', ');
        } else {
          paramStr = JSON.stringify(parameters);
        }

        logParameter = `${delimiter} ${paramStr}`;
      }

      const fmt = `(${connection.uuid || 'default'}): ${sql}${logParameter}`;
      const msg = `Executing ${fmt}`;
      debugContext(msg);

      if (!benchmark) {
        this.sequelize.log(`Executing ${fmt}`, options);
      }

      return () => {
        const afterMsg = `Executed ${fmt}`;
        debugContext(afterMsg);

        if (benchmark) {
          this.sequelize.log(afterMsg, Date.now() - startTime, options);
        }
      };
    }
    /**
     * The function takes the result of the query execution and groups
     * the associated data by the callee.
     *
     * Example:
     *   groupJoinData([
     *     {
     *       some: 'data',
     *       id: 1,
     *       association: { foo: 'bar', id: 1 }
     *     }, {
     *       some: 'data',
     *       id: 1,
     *       association: { foo: 'bar', id: 2 }
     *     }, {
     *       some: 'data',
     *       id: 1,
     *       association: { foo: 'bar', id: 3 }
     *     }
     *   ])
     *
     * Result:
     *   Something like this:
     *
     *   [
     *     {
     *       some: 'data',
     *       id: 1,
     *       association: [
     *         { foo: 'bar', id: 1 },
     *         { foo: 'bar', id: 2 },
     *         { foo: 'bar', id: 3 }
     *       ]
     *     }
     *   ]
     *
     * @param {Array} rows
     * @param {Object} includeOptions
     * @param {Object} options
     * @private
     */

  }], [{
    key: "formatBindParameters",
    value: function formatBindParameters(sql, values, dialect, replacementFunc, options) {
      if (!values) {
        return [sql, []];
      }

      options = options || {};

      if (typeof replacementFunc !== 'function') {
        options = replacementFunc || {};
        replacementFunc = undefined;
      }

      if (!replacementFunc) {
        if (options.skipValueReplace) {
          replacementFunc = (match, key, values) => {
            if (values[key] !== undefined) {
              return match;
            }

            return undefined;
          };
        } else {
          replacementFunc = (match, key, values, timeZone, dialect) => {
            if (values[key] !== undefined) {
              return SqlString.escape(values[key], timeZone, dialect);
            }

            return undefined;
          };
        }
      } else if (options.skipValueReplace) {
        const origReplacementFunc = replacementFunc;

        replacementFunc = (match, key, values, timeZone, dialect, options) => {
          if (origReplacementFunc(match, key, values, timeZone, dialect, options) !== undefined) {
            return match;
          }

          return undefined;
        };
      }

      const timeZone = null;
      const list = Array.isArray(values);
      sql = sql.replace(/\$(\$|\w+)/g, (match, key) => {
        if ('$' === key) {
          return options.skipUnescape ? match : key;
        }

        let replVal;

        if (list) {
          if (key.match(/^[1-9]\d*$/)) {
            key = key - 1;
            replVal = replacementFunc(match, key, values, timeZone, dialect, options);
          }
        } else if (!key.match(/^\d*$/)) {
          replVal = replacementFunc(match, key, values, timeZone, dialect, options);
        }

        if (replVal === undefined) {
          throw new Error(`Named bind parameter "${match}" has no value in the given object.`);
        }

        return replVal;
      });
      return [sql, []];
    }
  }, {
    key: "_groupJoinData",
    value: function _groupJoinData(rows, includeOptions, options) {
      /*
       * Assumptions
       * ID is not necessarily the first field
       * All fields for a level is grouped in the same set (i.e. Panel.id, Task.id, Panel.title is not possible)
       * Parent keys will be seen before any include/child keys
       * Previous set won't necessarily be parent set (one parent could have two children, one child would then be previous set for the other)
       */

      /*
       * Author (MH) comment: This code is an unreadable mess, but it's performant.
       * groupJoinData is a performance critical function so we prioritize perf over readability.
       */
      if (!rows.length) {
        return [];
      } // Generic looping


      let i;
      let length;
      let $i;
      let $length; // Row specific looping

      let rowsI;
      let row;
      const rowsLength = rows.length; // Key specific looping

      let keys;
      let key;
      let keyI;
      let keyLength;
      let prevKey;
      let values;
      let topValues;
      let topExists;
      const checkExisting = options.checkExisting; // If we don't have to deduplicate we can pre-allocate the resulting array

      let itemHash;
      let parentHash;
      let topHash;
      const results = checkExisting ? [] : new Array(rowsLength);
      const resultMap = {};
      const includeMap = {}; // Result variables for the respective functions

      let $keyPrefix;
      let $keyPrefixString;
      let $prevKeyPrefixString; // eslint-disable-line

      let $prevKeyPrefix;
      let $lastKeyPrefix;
      let $current;
      let $parent; // Map each key to an include option

      let previousPiece;

      const buildIncludeMap = piece => {
        if (Object.prototype.hasOwnProperty.call($current.includeMap, piece)) {
          includeMap[key] = $current = $current.includeMap[piece];

          if (previousPiece) {
            previousPiece = `${previousPiece}.${piece}`;
          } else {
            previousPiece = piece;
          }

          includeMap[previousPiece] = $current;
        }
      }; // Calculate the string prefix of a key ('User.Results' for 'User.Results.id')


      const keyPrefixStringMemo = {};

      const keyPrefixString = (key, memo) => {
        if (!Object.prototype.hasOwnProperty.call(memo, key)) {
          memo[key] = key.substr(0, key.lastIndexOf('.'));
        }

        return memo[key];
      }; // Removes the prefix from a key ('id' for 'User.Results.id')


      const removeKeyPrefixMemo = {};

      const removeKeyPrefix = key => {
        if (!Object.prototype.hasOwnProperty.call(removeKeyPrefixMemo, key)) {
          const index = key.lastIndexOf('.');
          removeKeyPrefixMemo[key] = key.substr(index === -1 ? 0 : index + 1);
        }

        return removeKeyPrefixMemo[key];
      }; // Calculates the array prefix of a key (['User', 'Results'] for 'User.Results.id')


      const keyPrefixMemo = {};

      const keyPrefix = key => {
        // We use a double memo and keyPrefixString so that different keys with the same prefix will receive the same array instead of differnet arrays with equal values
        if (!Object.prototype.hasOwnProperty.call(keyPrefixMemo, key)) {
          const prefixString = keyPrefixString(key, keyPrefixStringMemo);

          if (!Object.prototype.hasOwnProperty.call(keyPrefixMemo, prefixString)) {
            keyPrefixMemo[prefixString] = prefixString ? prefixString.split('.') : [];
          }

          keyPrefixMemo[key] = keyPrefixMemo[prefixString];
        }

        return keyPrefixMemo[key];
      }; // Calcuate the last item in the array prefix ('Results' for 'User.Results.id')


      const lastKeyPrefixMemo = {};

      const lastKeyPrefix = key => {
        if (!Object.prototype.hasOwnProperty.call(lastKeyPrefixMemo, key)) {
          const prefix = keyPrefix(key);
          const length = prefix.length;
          lastKeyPrefixMemo[key] = !length ? '' : prefix[length - 1];
        }

        return lastKeyPrefixMemo[key];
      };

      const getUniqueKeyAttributes = model => {
        let uniqueKeyAttributes = _.chain(model.uniqueKeys);

        uniqueKeyAttributes = uniqueKeyAttributes.result(`${uniqueKeyAttributes.findKey()}.fields`).map(field => _.findKey(model.attributes, chr => chr.field === field)).value();
        return uniqueKeyAttributes;
      };

      const stringify = obj => obj instanceof Buffer ? obj.toString('hex') : obj;

      let primaryKeyAttributes;
      let uniqueKeyAttributes;
      let prefix;

      for (rowsI = 0; rowsI < rowsLength; rowsI++) {
        row = rows[rowsI]; // Keys are the same for all rows, so only need to compute them on the first row

        if (rowsI === 0) {
          keys = Object.keys(row);
          keyLength = keys.length;
        }

        if (checkExisting) {
          topExists = false; // Compute top level hash key (this is usually just the primary key values)

          $length = includeOptions.model.primaryKeyAttributes.length;
          topHash = '';

          if ($length === 1) {
            topHash = stringify(row[includeOptions.model.primaryKeyAttributes[0]]);
          } else if ($length > 1) {
            for ($i = 0; $i < $length; $i++) {
              topHash += stringify(row[includeOptions.model.primaryKeyAttributes[$i]]);
            }
          } else if (!_.isEmpty(includeOptions.model.uniqueKeys)) {
            uniqueKeyAttributes = getUniqueKeyAttributes(includeOptions.model);

            for ($i = 0; $i < uniqueKeyAttributes.length; $i++) {
              topHash += row[uniqueKeyAttributes[$i]];
            }
          }
        }

        topValues = values = {};
        $prevKeyPrefix = undefined;

        for (keyI = 0; keyI < keyLength; keyI++) {
          key = keys[keyI]; // The string prefix isn't actualy needed
          // We use it so keyPrefix for different keys will resolve to the same array if they have the same prefix
          // TODO: Find a better way?

          $keyPrefixString = keyPrefixString(key, keyPrefixStringMemo);
          $keyPrefix = keyPrefix(key); // On the first row we compute the includeMap

          if (rowsI === 0 && !Object.prototype.hasOwnProperty.call(includeMap, key)) {
            if (!$keyPrefix.length) {
              includeMap[key] = includeMap[''] = includeOptions;
            } else {
              $current = includeOptions;
              previousPiece = undefined;
              $keyPrefix.forEach(buildIncludeMap);
            }
          } // End of key set


          if ($prevKeyPrefix !== undefined && $prevKeyPrefix !== $keyPrefix) {
            if (checkExisting) {
              // Compute hash key for this set instance
              // TODO: Optimize
              length = $prevKeyPrefix.length;
              $parent = null;
              parentHash = null;

              if (length) {
                for (i = 0; i < length; i++) {
                  prefix = $parent ? `${$parent}.${$prevKeyPrefix[i]}` : $prevKeyPrefix[i];
                  primaryKeyAttributes = includeMap[prefix].model.primaryKeyAttributes;
                  $length = primaryKeyAttributes.length;
                  itemHash = prefix;

                  if ($length === 1) {
                    itemHash += stringify(row[`${prefix}.${primaryKeyAttributes[0]}`]);
                  } else if ($length > 1) {
                    for ($i = 0; $i < $length; $i++) {
                      itemHash += stringify(row[`${prefix}.${primaryKeyAttributes[$i]}`]);
                    }
                  } else if (!_.isEmpty(includeMap[prefix].model.uniqueKeys)) {
                    uniqueKeyAttributes = getUniqueKeyAttributes(includeMap[prefix].model);

                    for ($i = 0; $i < uniqueKeyAttributes.length; $i++) {
                      itemHash += row[`${prefix}.${uniqueKeyAttributes[$i]}`];
                    }
                  }

                  if (!parentHash) {
                    parentHash = topHash;
                  }

                  itemHash = parentHash + itemHash;
                  $parent = prefix;

                  if (i < length - 1) {
                    parentHash = itemHash;
                  }
                }
              } else {
                itemHash = topHash;
              }

              if (itemHash === topHash) {
                if (!resultMap[itemHash]) {
                  resultMap[itemHash] = values;
                } else {
                  topExists = true;
                }
              } else if (!resultMap[itemHash]) {
                $parent = resultMap[parentHash];
                $lastKeyPrefix = lastKeyPrefix(prevKey);

                if (includeMap[prevKey].association.isSingleAssociation) {
                  if ($parent) {
                    $parent[$lastKeyPrefix] = resultMap[itemHash] = values;
                  }
                } else {
                  if (!$parent[$lastKeyPrefix]) {
                    $parent[$lastKeyPrefix] = [];
                  }

                  $parent[$lastKeyPrefix].push(resultMap[itemHash] = values);
                }
              } // Reset values


              values = {};
            } else {
              // If checkExisting is false it's because there's only 1:1 associations in this query
              // However we still need to map onto the appropriate parent
              // For 1:1 we map forward, initializing the value object on the parent to be filled in the next iterations of the loop
              $current = topValues;
              length = $keyPrefix.length;

              if (length) {
                for (i = 0; i < length; i++) {
                  if (i === length - 1) {
                    values = $current[$keyPrefix[i]] = {};
                  }

                  $current = $current[$keyPrefix[i]] || {};
                }
              }
            }
          } // End of iteration, set value and set prev values (for next iteration)


          values[removeKeyPrefix(key)] = row[key];
          prevKey = key;
          $prevKeyPrefix = $keyPrefix;
          $prevKeyPrefixString = $keyPrefixString;
        }

        if (checkExisting) {
          length = $prevKeyPrefix.length;
          $parent = null;
          parentHash = null;

          if (length) {
            for (i = 0; i < length; i++) {
              prefix = $parent ? `${$parent}.${$prevKeyPrefix[i]}` : $prevKeyPrefix[i];
              primaryKeyAttributes = includeMap[prefix].model.primaryKeyAttributes;
              $length = primaryKeyAttributes.length;
              itemHash = prefix;

              if ($length === 1) {
                itemHash += stringify(row[`${prefix}.${primaryKeyAttributes[0]}`]);
              } else if ($length > 0) {
                for ($i = 0; $i < $length; $i++) {
                  itemHash += stringify(row[`${prefix}.${primaryKeyAttributes[$i]}`]);
                }
              } else if (!_.isEmpty(includeMap[prefix].model.uniqueKeys)) {
                uniqueKeyAttributes = getUniqueKeyAttributes(includeMap[prefix].model);

                for ($i = 0; $i < uniqueKeyAttributes.length; $i++) {
                  itemHash += row[`${prefix}.${uniqueKeyAttributes[$i]}`];
                }
              }

              if (!parentHash) {
                parentHash = topHash;
              }

              itemHash = parentHash + itemHash;
              $parent = prefix;

              if (i < length - 1) {
                parentHash = itemHash;
              }
            }
          } else {
            itemHash = topHash;
          }

          if (itemHash === topHash) {
            if (!resultMap[itemHash]) {
              resultMap[itemHash] = values;
            } else {
              topExists = true;
            }
          } else if (!resultMap[itemHash]) {
            $parent = resultMap[parentHash];
            $lastKeyPrefix = lastKeyPrefix(prevKey);

            if (includeMap[prevKey].association.isSingleAssociation) {
              if ($parent) {
                $parent[$lastKeyPrefix] = resultMap[itemHash] = values;
              }
            } else {
              if (!$parent[$lastKeyPrefix]) {
                $parent[$lastKeyPrefix] = [];
              }

              $parent[$lastKeyPrefix].push(resultMap[itemHash] = values);
            }
          }

          if (!topExists) {
            results.push(topValues);
          }
        } else {
          results[rowsI] = topValues;
        }
      }

      return results;
    }
  }]);

  return AbstractQuery;
}();

module.exports = AbstractQuery;
module.exports.AbstractQuery = AbstractQuery;
module.exports.default = AbstractQuery;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9hYnN0cmFjdC9xdWVyeS5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsIlNxbFN0cmluZyIsIlF1ZXJ5VHlwZXMiLCJEb3QiLCJkZXByZWNhdGlvbnMiLCJ1dWlkIiwiQWJzdHJhY3RRdWVyeSIsImNvbm5lY3Rpb24iLCJzZXF1ZWxpemUiLCJvcHRpb25zIiwiaW5zdGFuY2UiLCJtb2RlbCIsIk9iamVjdCIsImFzc2lnbiIsInBsYWluIiwicmF3IiwibG9nZ2luZyIsImNvbnNvbGUiLCJsb2ciLCJjaGVja0xvZ2dpbmdPcHRpb24iLCJFcnJvciIsIm5vVHJ1ZUxvZ2dpbmciLCJmaWVsZCIsIm1lc3NhZ2UiLCJrZXkiLCJrZXlzIiwidW5pcXVlS2V5cyIsImZpZWxkcyIsImluY2x1ZGVzIiwicmVwbGFjZSIsIm1zZyIsInR5cGUiLCJSQVciLCJWRVJTSU9OIiwiVVBTRVJUIiwicmVzdWx0cyIsIm1ldGFEYXRhIiwicmVzdWx0IiwiSU5TRVJUIiwic3FsIiwidG9Mb3dlckNhc2UiLCJzdGFydHNXaXRoIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiZ2V0SW5zZXJ0SWRGaWVsZCIsImF1dG9JbmNyZW1lbnRBdHRyaWJ1dGUiLCJpZCIsIlNIT1dUQUJMRVMiLCJmbGF0dGVuIiwibWFwIiwicmVzdWx0U2V0IiwidmFsdWVzIiwiU0hPV0lOREVYRVMiLCJTSE9XQ09OU1RSQUlOVFMiLCJERVNDUklCRSIsIlNFTEVDVCIsIkJVTEtVUERBVEUiLCJCVUxLREVMRVRFIiwiRk9SRUlHTktFWVMiLCJVUERBVEUiLCJmaWVsZE1hcCIsInJlZHVjZSIsIm5hbWUiLCJ1bmRlZmluZWQiLCJvIiwibmVzdCIsInRyYW5zZm9ybSIsImhhc0pvaW4iLCJfZ3JvdXBKb2luRGF0YSIsImluY2x1ZGVNYXAiLCJpbmNsdWRlTmFtZXMiLCJjaGVja0V4aXN0aW5nIiwiaGFzTXVsdGlBc3NvY2lhdGlvbiIsImJ1bGtCdWlsZCIsImlzTmV3UmVjb3JkIiwiaW5jbHVkZSIsImluY2x1ZGVWYWxpZGF0ZWQiLCJhdHRyaWJ1dGVzIiwib3JpZ2luYWxBdHRyaWJ1dGVzIiwibGVuZ3RoIiwiZGVidWdDb250ZXh0IiwicGFyYW1ldGVycyIsImJlbmNobWFyayIsImxvZ1F1ZXJ5UGFyYW1ldGVycyIsInN0YXJ0VGltZSIsIkRhdGUiLCJub3ciLCJsb2dQYXJhbWV0ZXIiLCJkZWxpbWl0ZXIiLCJlbmRzV2l0aCIsInBhcmFtU3RyIiwiQXJyYXkiLCJpc0FycmF5IiwicCIsIkpTT04iLCJzdHJpbmdpZnkiLCJqb2luIiwiZm10IiwiYWZ0ZXJNc2ciLCJkaWFsZWN0IiwicmVwbGFjZW1lbnRGdW5jIiwic2tpcFZhbHVlUmVwbGFjZSIsIm1hdGNoIiwidGltZVpvbmUiLCJlc2NhcGUiLCJvcmlnUmVwbGFjZW1lbnRGdW5jIiwibGlzdCIsInNraXBVbmVzY2FwZSIsInJlcGxWYWwiLCJyb3dzIiwiaW5jbHVkZU9wdGlvbnMiLCJpIiwiJGkiLCIkbGVuZ3RoIiwicm93c0kiLCJyb3ciLCJyb3dzTGVuZ3RoIiwia2V5SSIsImtleUxlbmd0aCIsInByZXZLZXkiLCJ0b3BWYWx1ZXMiLCJ0b3BFeGlzdHMiLCJpdGVtSGFzaCIsInBhcmVudEhhc2giLCJ0b3BIYXNoIiwicmVzdWx0TWFwIiwiJGtleVByZWZpeCIsIiRrZXlQcmVmaXhTdHJpbmciLCIkcHJldktleVByZWZpeFN0cmluZyIsIiRwcmV2S2V5UHJlZml4IiwiJGxhc3RLZXlQcmVmaXgiLCIkY3VycmVudCIsIiRwYXJlbnQiLCJwcmV2aW91c1BpZWNlIiwiYnVpbGRJbmNsdWRlTWFwIiwicGllY2UiLCJrZXlQcmVmaXhTdHJpbmdNZW1vIiwia2V5UHJlZml4U3RyaW5nIiwibWVtbyIsInN1YnN0ciIsImxhc3RJbmRleE9mIiwicmVtb3ZlS2V5UHJlZml4TWVtbyIsInJlbW92ZUtleVByZWZpeCIsImluZGV4Iiwia2V5UHJlZml4TWVtbyIsImtleVByZWZpeCIsInByZWZpeFN0cmluZyIsInNwbGl0IiwibGFzdEtleVByZWZpeE1lbW8iLCJsYXN0S2V5UHJlZml4IiwicHJlZml4IiwiZ2V0VW5pcXVlS2V5QXR0cmlidXRlcyIsInVuaXF1ZUtleUF0dHJpYnV0ZXMiLCJjaGFpbiIsImZpbmRLZXkiLCJjaHIiLCJ2YWx1ZSIsIm9iaiIsIkJ1ZmZlciIsInRvU3RyaW5nIiwicHJpbWFyeUtleUF0dHJpYnV0ZXMiLCJpc0VtcHR5IiwiZm9yRWFjaCIsImFzc29jaWF0aW9uIiwiaXNTaW5nbGVBc3NvY2lhdGlvbiIsInB1c2giLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBRUEsTUFBTUEsQ0FBQyxHQUFHQyxPQUFPLENBQUMsUUFBRCxDQUFqQjs7QUFDQSxNQUFNQyxTQUFTLEdBQUdELE9BQU8sQ0FBQyxrQkFBRCxDQUF6Qjs7QUFDQSxNQUFNRSxVQUFVLEdBQUdGLE9BQU8sQ0FBQyxtQkFBRCxDQUExQjs7QUFDQSxNQUFNRyxHQUFHLEdBQUdILE9BQU8sQ0FBQyxRQUFELENBQW5COztBQUNBLE1BQU1JLFlBQVksR0FBR0osT0FBTyxDQUFDLDBCQUFELENBQTVCOztBQUNBLE1BQU1LLElBQUksR0FBR0wsT0FBTyxDQUFDLFNBQUQsQ0FBcEI7O0lBRU1NLGE7OztBQUVKLHlCQUFZQyxVQUFaLEVBQXdCQyxTQUF4QixFQUFtQ0MsT0FBbkMsRUFBNEM7QUFBQTs7QUFDMUMsU0FBS0osSUFBTCxHQUFZQSxJQUFJLEVBQWhCO0FBQ0EsU0FBS0UsVUFBTCxHQUFrQkEsVUFBbEI7QUFDQSxTQUFLRyxRQUFMLEdBQWdCRCxPQUFPLENBQUNDLFFBQXhCO0FBQ0EsU0FBS0MsS0FBTCxHQUFhRixPQUFPLENBQUNFLEtBQXJCO0FBQ0EsU0FBS0gsU0FBTCxHQUFpQkEsU0FBakI7QUFDQSxTQUFLQyxPQUFMLEdBQWVHLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQzNCQyxNQUFBQSxLQUFLLEVBQUUsS0FEb0I7QUFFM0JDLE1BQUFBLEdBQUcsRUFBRSxLQUZz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QixhQUFhLENBQUM5QixPQUFELENBQTlCOztBQUVBLGdCQUFJbEQsVUFBVSxDQUFDa0QsT0FBRCxDQUFWLENBQW9CNEMsV0FBcEIsQ0FBZ0NDLG1CQUFwQyxFQUF5RDtBQUN2RCxrQkFBSWhDLE9BQUosRUFBYTtBQUNYQSxnQkFBQUEsT0FBTyxDQUFDRixjQUFELENBQVAsR0FBMEJMLFNBQVMsQ0FBQ0gsUUFBRCxDQUFULEdBQXNCdkUsTUFBaEQ7QUFDRDtBQUNGLGFBSkQsTUFJTztBQUNMLGtCQUFJLENBQUNpRixPQUFPLENBQUNGLGNBQUQsQ0FBWixFQUE4QjtBQUM1QkUsZ0JBQUFBLE9BQU8sQ0FBQ0YsY0FBRCxDQUFQLEdBQTBCLEVBQTFCO0FBQ0Q7O0FBQ0RFLGNBQUFBLE9BQU8sQ0FBQ0YsY0FBRCxDQUFQLENBQXdCbUMsSUFBeEIsQ0FBNkJ4QyxTQUFTLENBQUNILFFBQUQsQ0FBVCxHQUFzQnZFLE1BQW5EO0FBQ0Q7QUFDRjs7QUFDRCxjQUFJLENBQUNzRSxTQUFMLEVBQWdCO0FBQ2R2RixZQUFBQSxPQUFPLENBQUNtSSxJQUFSLENBQWE3QyxTQUFiO0FBQ0Q7QUFDRixTQS9ERCxNQStETztBQUNMdEYsVUFBQUEsT0FBTyxDQUFDZ0YsS0FBRCxDQUFQLEdBQWlCTSxTQUFqQjtBQUNEO0FBQ0Y7O0FBRUQsYUFBT3RGLE9BQVA7QUFDRDs7Ozs7O0FBR0hvSSxNQUFNLENBQUNDLE9BQVAsR0FBaUJsSyxhQUFqQjtBQUNBaUssTUFBTSxDQUFDQyxPQUFQLENBQWVsSyxhQUFmLEdBQStCQSxhQUEvQjtBQUNBaUssTUFBTSxDQUFDQyxPQUFQLENBQWVDLE9BQWYsR0FBeUJuSyxhQUF6QiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuY29uc3QgU3FsU3RyaW5nID0gcmVxdWlyZSgnLi4vLi4vc3FsLXN0cmluZycpO1xyXG5jb25zdCBRdWVyeVR5cGVzID0gcmVxdWlyZSgnLi4vLi4vcXVlcnktdHlwZXMnKTtcclxuY29uc3QgRG90ID0gcmVxdWlyZSgnZG90dGllJyk7XHJcbmNvbnN0IGRlcHJlY2F0aW9ucyA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzL2RlcHJlY2F0aW9ucycpO1xyXG5jb25zdCB1dWlkID0gcmVxdWlyZSgndXVpZC92NCcpO1xyXG5cclxuY2xhc3MgQWJzdHJhY3RRdWVyeSB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb24sIHNlcXVlbGl6ZSwgb3B0aW9ucykge1xyXG4gICAgdGhpcy51dWlkID0gdXVpZCgpO1xyXG4gICAgdGhpcy5jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcclxuICAgIHRoaXMuaW5zdGFuY2UgPSBvcHRpb25zLmluc3RhbmNlO1xyXG4gICAgdGhpcy5tb2RlbCA9IG9wdGlvbnMubW9kZWw7XHJcbiAgICB0aGlzLnNlcXVlbGl6ZSA9IHNlcXVlbGl6ZTtcclxuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xyXG4gICAgICBwbGFpbjogZmFsc2UsXHJcbiAgICAgIHJhdzogZmFsc2UsXHJcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgIGxvZ2dpbmc6IGNvbnNvbGUubG9nXHJcbiAgICB9LCBvcHRpb25zIHx8IHt9KTtcclxuICAgIHRoaXMuY2hlY2tMb2dnaW5nT3B0aW9uKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiByZXdyaXRlIHF1ZXJ5IHdpdGggcGFyYW1ldGVyc1xyXG4gICAqXHJcbiAgICogRXhhbXBsZXM6XHJcbiAgICpcclxuICAgKiAgIHF1ZXJ5LmZvcm1hdEJpbmRQYXJhbWV0ZXJzKCdzZWxlY3QgJDEgYXMgZm9vJywgWydmb292YWwnXSk7XHJcbiAgICpcclxuICAgKiAgIHF1ZXJ5LmZvcm1hdEJpbmRQYXJhbWV0ZXJzKCdzZWxlY3QgJGZvbyBhcyBmb28nLCB7IGZvbzogJ2Zvb3ZhbCcgfSk7XHJcbiAgICpcclxuICAgKiBPcHRpb25zXHJcbiAgICogICBza2lwVW5lc2NhcGU6IGJvb2wsIHNraXAgdW5lc2NhcGluZyAkJFxyXG4gICAqICAgc2tpcFZhbHVlUmVwbGFjZTogYm9vbCwgZG8gbm90IHJlcGxhY2UgKGJ1dCBkbyB1bmVzY2FwZSAkJCkuIENoZWNrIGNvcnJlY3Qgc3ludGF4IGFuZCBpZiBhbGwgdmFsdWVzIGFyZSBhdmFpbGFibGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcclxuICAgKiBAcGFyYW0ge09iamVjdHxBcnJheX0gdmFsdWVzXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGRpYWxlY3RcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbcmVwbGFjZW1lbnRGdW5jXVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIHN0YXRpYyBmb3JtYXRCaW5kUGFyYW1ldGVycyhzcWwsIHZhbHVlcywgZGlhbGVjdCwgcmVwbGFjZW1lbnRGdW5jLCBvcHRpb25zKSB7XHJcbiAgICBpZiAoIXZhbHVlcykge1xyXG4gICAgICByZXR1cm4gW3NxbCwgW11dO1xyXG4gICAgfVxyXG5cclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgaWYgKHR5cGVvZiByZXBsYWNlbWVudEZ1bmMgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgb3B0aW9ucyA9IHJlcGxhY2VtZW50RnVuYyB8fCB7fTtcclxuICAgICAgcmVwbGFjZW1lbnRGdW5jID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcmVwbGFjZW1lbnRGdW5jKSB7XHJcbiAgICAgIGlmIChvcHRpb25zLnNraXBWYWx1ZVJlcGxhY2UpIHtcclxuICAgICAgICByZXBsYWNlbWVudEZ1bmMgPSAobWF0Y2gsIGtleSwgdmFsdWVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAodmFsdWVzW2tleV0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVwbGFjZW1lbnRGdW5jID0gKG1hdGNoLCBrZXksIHZhbHVlcywgdGltZVpvbmUsIGRpYWxlY3QpID0+IHtcclxuICAgICAgICAgIGlmICh2YWx1ZXNba2V5XSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBTcWxTdHJpbmcuZXNjYXBlKHZhbHVlc1trZXldLCB0aW1lWm9uZSwgZGlhbGVjdCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5za2lwVmFsdWVSZXBsYWNlKSB7XHJcbiAgICAgIGNvbnN0IG9yaWdSZXBsYWNlbWVudEZ1bmMgPSByZXBsYWNlbWVudEZ1bmM7XHJcbiAgICAgIHJlcGxhY2VtZW50RnVuYyA9IChtYXRjaCwga2V5LCB2YWx1ZXMsIHRpbWVab25lLCBkaWFsZWN0LCBvcHRpb25zKSA9PiB7XHJcbiAgICAgICAgaWYgKG9yaWdSZXBsYWNlbWVudEZ1bmMobWF0Y2gsIGtleSwgdmFsdWVzLCB0aW1lWm9uZSwgZGlhbGVjdCwgb3B0aW9ucykgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgcmV0dXJuIG1hdGNoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRpbWVab25lID0gbnVsbDtcclxuICAgIGNvbnN0IGxpc3QgPSBBcnJheS5pc0FycmF5KHZhbHVlcyk7XHJcblxyXG4gICAgc3FsID0gc3FsLnJlcGxhY2UoL1xcJChcXCR8XFx3KykvZywgKG1hdGNoLCBrZXkpID0+IHtcclxuICAgICAgaWYgKCckJyA9PT0ga2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuc2tpcFVuZXNjYXBlID8gbWF0Y2ggOiBrZXk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCByZXBsVmFsO1xyXG4gICAgICBpZiAobGlzdCkge1xyXG4gICAgICAgIGlmIChrZXkubWF0Y2goL15bMS05XVxcZCokLykpIHtcclxuICAgICAgICAgIGtleSA9IGtleSAtIDE7XHJcbiAgICAgICAgICByZXBsVmFsID0gcmVwbGFjZW1lbnRGdW5jKG1hdGNoLCBrZXksIHZhbHVlcywgdGltZVpvbmUsIGRpYWxlY3QsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmICgha2V5Lm1hdGNoKC9eXFxkKiQvKSkge1xyXG4gICAgICAgIHJlcGxWYWwgPSByZXBsYWNlbWVudEZ1bmMobWF0Y2gsIGtleSwgdmFsdWVzLCB0aW1lWm9uZSwgZGlhbGVjdCwgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHJlcGxWYWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTmFtZWQgYmluZCBwYXJhbWV0ZXIgXCIke21hdGNofVwiIGhhcyBubyB2YWx1ZSBpbiB0aGUgZ2l2ZW4gb2JqZWN0LmApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXBsVmFsO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gW3NxbCwgW11dO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXhlY3V0ZSB0aGUgcGFzc2VkIHNxbCBxdWVyeS5cclxuICAgKlxyXG4gICAqIEV4YW1wbGVzOlxyXG4gICAqXHJcbiAgICogICAgIHF1ZXJ5LnJ1bignU0VMRUNUIDEnKVxyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBydW4oKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBydW4gbWV0aG9kIHdhc25cXCd0IG92ZXJ3cml0dGVuIScpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2sgdGhlIGxvZ2dpbmcgb3B0aW9uIG9mIHRoZSBpbnN0YW5jZSBhbmQgcHJpbnQgZGVwcmVjYXRpb24gd2FybmluZ3MuXHJcbiAgICpcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGNoZWNrTG9nZ2luZ09wdGlvbigpIHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMubG9nZ2luZyA9PT0gdHJ1ZSkge1xyXG4gICAgICBkZXByZWNhdGlvbnMubm9UcnVlTG9nZ2luZygpO1xyXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgICB0aGlzLm9wdGlvbnMubG9nZ2luZyA9IGNvbnNvbGUubG9nO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBhdHRyaWJ1dGVzIG9mIGFuIGluc2VydCBxdWVyeSwgd2hpY2ggY29udGFpbnMgdGhlIGp1c3QgaW5zZXJ0ZWQgaWQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgZmllbGQgbmFtZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGdldEluc2VydElkRmllbGQoKSB7XHJcbiAgICByZXR1cm4gJ2luc2VydElkJztcclxuICB9XHJcblxyXG4gIGdldFVuaXF1ZUNvbnN0cmFpbnRFcnJvck1lc3NhZ2UoZmllbGQpIHtcclxuICAgIGxldCBtZXNzYWdlID0gZmllbGQgPyBgJHtmaWVsZH0gbXVzdCBiZSB1bmlxdWVgIDogJ011c3QgYmUgdW5pcXVlJztcclxuXHJcbiAgICBpZiAoZmllbGQgJiYgdGhpcy5tb2RlbCkge1xyXG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm1vZGVsLnVuaXF1ZUtleXMpKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubW9kZWwudW5pcXVlS2V5c1trZXldLmZpZWxkcy5pbmNsdWRlcyhmaWVsZC5yZXBsYWNlKC9cIi9nLCAnJykpKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5tb2RlbC51bmlxdWVLZXlzW2tleV0ubXNnKSB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2UgPSB0aGlzLm1vZGVsLnVuaXF1ZUtleXNba2V5XS5tc2c7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWVzc2FnZTtcclxuICB9XHJcblxyXG4gIGlzUmF3UXVlcnkoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuUkFXO1xyXG4gIH1cclxuXHJcbiAgaXNWZXJzaW9uUXVlcnkoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuVkVSU0lPTjtcclxuICB9XHJcblxyXG4gIGlzVXBzZXJ0UXVlcnkoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuVVBTRVJUO1xyXG4gIH1cclxuXHJcbiAgaXNJbnNlcnRRdWVyeShyZXN1bHRzLCBtZXRhRGF0YSkge1xyXG4gICAgbGV0IHJlc3VsdCA9IHRydWU7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy50eXBlID09PSBRdWVyeVR5cGVzLklOU0VSVCkge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpcyBpbnNlcnQgcXVlcnkgaWYgc3FsIGNvbnRhaW5zIGluc2VydCBpbnRvXHJcbiAgICByZXN1bHQgPSByZXN1bHQgJiYgdGhpcy5zcWwudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdpbnNlcnQgaW50bycpO1xyXG5cclxuICAgIC8vIGlzIGluc2VydCBxdWVyeSBpZiBubyByZXN1bHRzIGFyZSBwYXNzZWQgb3IgaWYgdGhlIHJlc3VsdCBoYXMgdGhlIGluc2VydGVkIGlkXHJcbiAgICByZXN1bHQgPSByZXN1bHQgJiYgKCFyZXN1bHRzIHx8IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChyZXN1bHRzLCB0aGlzLmdldEluc2VydElkRmllbGQoKSkpO1xyXG5cclxuICAgIC8vIGlzIGluc2VydCBxdWVyeSBpZiBubyBtZXRhZGF0YSBhcmUgcGFzc2VkIG9yIGlmIHRoZSBtZXRhZGF0YSBoYXMgdGhlIGluc2VydGVkIGlkXHJcbiAgICByZXN1bHQgPSByZXN1bHQgJiYgKCFtZXRhRGF0YSB8fCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWV0YURhdGEsIHRoaXMuZ2V0SW5zZXJ0SWRGaWVsZCgpKSk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIGhhbmRsZUluc2VydFF1ZXJ5KHJlc3VsdHMsIG1ldGFEYXRhKSB7XHJcbiAgICBpZiAodGhpcy5pbnN0YW5jZSkge1xyXG4gICAgICAvLyBhZGQgdGhlIGluc2VydGVkIHJvdyBpZCB0byB0aGUgaW5zdGFuY2VcclxuICAgICAgY29uc3QgYXV0b0luY3JlbWVudEF0dHJpYnV0ZSA9IHRoaXMubW9kZWwuYXV0b0luY3JlbWVudEF0dHJpYnV0ZTtcclxuICAgICAgbGV0IGlkID0gbnVsbDtcclxuXHJcbiAgICAgIGlkID0gaWQgfHwgcmVzdWx0cyAmJiByZXN1bHRzW3RoaXMuZ2V0SW5zZXJ0SWRGaWVsZCgpXTtcclxuICAgICAgaWQgPSBpZCB8fCBtZXRhRGF0YSAmJiBtZXRhRGF0YVt0aGlzLmdldEluc2VydElkRmllbGQoKV07XHJcblxyXG4gICAgICB0aGlzLmluc3RhbmNlW2F1dG9JbmNyZW1lbnRBdHRyaWJ1dGVdID0gaWQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc1Nob3dUYWJsZXNRdWVyeSgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5TSE9XVEFCTEVTO1xyXG4gIH1cclxuXHJcbiAgaGFuZGxlU2hvd1RhYmxlc1F1ZXJ5KHJlc3VsdHMpIHtcclxuICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0cy5tYXAocmVzdWx0U2V0ID0+IF8udmFsdWVzKHJlc3VsdFNldCkpKTtcclxuICB9XHJcblxyXG4gIGlzU2hvd0luZGV4ZXNRdWVyeSgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5TSE9XSU5ERVhFUztcclxuICB9XHJcblxyXG4gIGlzU2hvd0NvbnN0cmFpbnRzUXVlcnkoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuU0hPV0NPTlNUUkFJTlRTO1xyXG4gIH1cclxuXHJcbiAgaXNEZXNjcmliZVF1ZXJ5KCkge1xyXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy50eXBlID09PSBRdWVyeVR5cGVzLkRFU0NSSUJFO1xyXG4gIH1cclxuXHJcbiAgaXNTZWxlY3RRdWVyeSgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5TRUxFQ1Q7XHJcbiAgfVxyXG5cclxuICBpc0J1bGtVcGRhdGVRdWVyeSgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5CVUxLVVBEQVRFO1xyXG4gIH1cclxuXHJcbiAgaXNCdWxrRGVsZXRlUXVlcnkoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuQlVMS0RFTEVURTtcclxuICB9XHJcblxyXG4gIGlzRm9yZWlnbktleXNRdWVyeSgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5GT1JFSUdOS0VZUztcclxuICB9XHJcblxyXG4gIGlzVXBkYXRlUXVlcnkoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuVVBEQVRFO1xyXG4gIH1cclxuXHJcbiAgaGFuZGxlU2VsZWN0UXVlcnkocmVzdWx0cykge1xyXG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XHJcblxyXG4gICAgLy8gTWFwIHJhdyBmaWVsZHMgdG8gbmFtZXMgaWYgYSBtYXBwaW5nIGlzIHByb3ZpZGVkXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmZpZWxkTWFwKSB7XHJcbiAgICAgIGNvbnN0IGZpZWxkTWFwID0gdGhpcy5vcHRpb25zLmZpZWxkTWFwO1xyXG4gICAgICByZXN1bHRzID0gcmVzdWx0cy5tYXAocmVzdWx0ID0+IF8ucmVkdWNlKGZpZWxkTWFwLCAocmVzdWx0LCBuYW1lLCBmaWVsZCkgPT4ge1xyXG4gICAgICAgIGlmIChyZXN1bHRbZmllbGRdICE9PSB1bmRlZmluZWQgJiYgbmFtZSAhPT0gZmllbGQpIHtcclxuICAgICAgICAgIHJlc3VsdFtuYW1lXSA9IHJlc3VsdFtmaWVsZF07XHJcbiAgICAgICAgICBkZWxldGUgcmVzdWx0W2ZpZWxkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgfSwgcmVzdWx0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmF3IHF1ZXJpZXNcclxuICAgIGlmICh0aGlzLm9wdGlvbnMucmF3KSB7XHJcbiAgICAgIHJlc3VsdCA9IHJlc3VsdHMubWFwKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgbGV0IG8gPSB7fTtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcmVzdWx0KSB7XHJcbiAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3VsdCwga2V5KSkge1xyXG4gICAgICAgICAgICBvW2tleV0gPSByZXN1bHRba2V5XTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubmVzdCkge1xyXG4gICAgICAgICAgbyA9IERvdC50cmFuc2Zvcm0obyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbztcclxuICAgICAgfSk7XHJcbiAgICAvLyBRdWVyaWVzIHdpdGggaW5jbHVkZVxyXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuaGFzSm9pbiA9PT0gdHJ1ZSkge1xyXG4gICAgICByZXN1bHRzID0gQWJzdHJhY3RRdWVyeS5fZ3JvdXBKb2luRGF0YShyZXN1bHRzLCB7XHJcbiAgICAgICAgbW9kZWw6IHRoaXMubW9kZWwsXHJcbiAgICAgICAgaW5jbHVkZU1hcDogdGhpcy5vcHRpb25zLmluY2x1ZGVNYXAsXHJcbiAgICAgICAgaW5jbHVkZU5hbWVzOiB0aGlzLm9wdGlvbnMuaW5jbHVkZU5hbWVzXHJcbiAgICAgIH0sIHtcclxuICAgICAgICBjaGVja0V4aXN0aW5nOiB0aGlzLm9wdGlvbnMuaGFzTXVsdGlBc3NvY2lhdGlvblxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJlc3VsdCA9IHRoaXMubW9kZWwuYnVsa0J1aWxkKHJlc3VsdHMsIHtcclxuICAgICAgICBpc05ld1JlY29yZDogZmFsc2UsXHJcbiAgICAgICAgaW5jbHVkZTogdGhpcy5vcHRpb25zLmluY2x1ZGUsXHJcbiAgICAgICAgaW5jbHVkZU5hbWVzOiB0aGlzLm9wdGlvbnMuaW5jbHVkZU5hbWVzLFxyXG4gICAgICAgIGluY2x1ZGVNYXA6IHRoaXMub3B0aW9ucy5pbmNsdWRlTWFwLFxyXG4gICAgICAgIGluY2x1ZGVWYWxpZGF0ZWQ6IHRydWUsXHJcbiAgICAgICAgYXR0cmlidXRlczogdGhpcy5vcHRpb25zLm9yaWdpbmFsQXR0cmlidXRlcyB8fCB0aGlzLm9wdGlvbnMuYXR0cmlidXRlcyxcclxuICAgICAgICByYXc6IHRydWVcclxuICAgICAgfSk7XHJcbiAgICAvLyBSZWd1bGFyIHF1ZXJpZXNcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlc3VsdCA9IHRoaXMubW9kZWwuYnVsa0J1aWxkKHJlc3VsdHMsIHtcclxuICAgICAgICBpc05ld1JlY29yZDogZmFsc2UsXHJcbiAgICAgICAgcmF3OiB0cnVlLFxyXG4gICAgICAgIGF0dHJpYnV0ZXM6IHRoaXMub3B0aW9ucy5vcmlnaW5hbEF0dHJpYnV0ZXMgfHwgdGhpcy5vcHRpb25zLmF0dHJpYnV0ZXNcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmV0dXJuIHRoZSBmaXJzdCByZWFsIG1vZGVsIGluc3RhbmNlIGlmIG9wdGlvbnMucGxhaW4gaXMgc2V0IChlLmcuIE1vZGVsLmZpbmQpXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnBsYWluKSB7XHJcbiAgICAgIHJlc3VsdCA9IHJlc3VsdC5sZW5ndGggPT09IDAgPyBudWxsIDogcmVzdWx0WzBdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIGlzU2hvd09yRGVzY3JpYmVRdWVyeSgpIHtcclxuICAgIGxldCByZXN1bHQgPSBmYWxzZTtcclxuXHJcbiAgICByZXN1bHQgPSByZXN1bHQgfHwgdGhpcy5zcWwudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdzaG93Jyk7XHJcbiAgICByZXN1bHQgPSByZXN1bHQgfHwgdGhpcy5zcWwudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdkZXNjcmliZScpO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICBpc0NhbGxRdWVyeSgpIHtcclxuICAgIHJldHVybiB0aGlzLnNxbC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2NhbGwnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBkZWJ1Z0NvbnRleHRcclxuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gcGFyYW1ldGVyc1xyXG4gICAqIEBwcm90ZWN0ZWRcclxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgZnVuY3Rpb24gdG8gY2FsbCBhZnRlciB0aGUgcXVlcnkgd2FzIGNvbXBsZXRlZC5cclxuICAgKi9cclxuICBfbG9nUXVlcnkoc3FsLCBkZWJ1Z0NvbnRleHQsIHBhcmFtZXRlcnMpIHtcclxuICAgIGNvbnN0IHsgY29ubmVjdGlvbiwgb3B0aW9ucyB9ID0gdGhpcztcclxuICAgIGNvbnN0IGJlbmNobWFyayA9IHRoaXMuc2VxdWVsaXplLm9wdGlvbnMuYmVuY2htYXJrIHx8IG9wdGlvbnMuYmVuY2htYXJrO1xyXG4gICAgY29uc3QgbG9nUXVlcnlQYXJhbWV0ZXJzID0gdGhpcy5zZXF1ZWxpemUub3B0aW9ucy5sb2dRdWVyeVBhcmFtZXRlcnMgfHwgb3B0aW9ucy5sb2dRdWVyeVBhcmFtZXRlcnM7XHJcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgbGV0IGxvZ1BhcmFtZXRlciA9ICcnO1xyXG4gICAgXHJcbiAgICBpZiAobG9nUXVlcnlQYXJhbWV0ZXJzICYmIHBhcmFtZXRlcnMpIHtcclxuICAgICAgY29uc3QgZGVsaW1pdGVyID0gc3FsLmVuZHNXaXRoKCc7JykgPyAnJyA6ICc7JztcclxuICAgICAgbGV0IHBhcmFtU3RyO1xyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJhbWV0ZXJzKSkge1xyXG4gICAgICAgIHBhcmFtU3RyID0gcGFyYW1ldGVycy5tYXAocD0+SlNPTi5zdHJpbmdpZnkocCkpLmpvaW4oJywgJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGFyYW1TdHIgPSBKU09OLnN0cmluZ2lmeShwYXJhbWV0ZXJzKTtcclxuICAgICAgfVxyXG4gICAgICBsb2dQYXJhbWV0ZXIgPSBgJHtkZWxpbWl0ZXJ9ICR7cGFyYW1TdHJ9YDtcclxuICAgIH1cclxuICAgIGNvbnN0IGZtdCA9IGAoJHtjb25uZWN0aW9uLnV1aWQgfHwgJ2RlZmF1bHQnfSk6ICR7c3FsfSR7bG9nUGFyYW1ldGVyfWA7XHJcbiAgICBjb25zdCBtc2cgPSBgRXhlY3V0aW5nICR7Zm10fWA7XHJcbiAgICBkZWJ1Z0NvbnRleHQobXNnKTtcclxuICAgIGlmICghYmVuY2htYXJrKSB7XHJcbiAgICAgIHRoaXMuc2VxdWVsaXplLmxvZyhgRXhlY3V0aW5nICR7Zm10fWAsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgY29uc3QgYWZ0ZXJNc2cgPSBgRXhlY3V0ZWQgJHtmbXR9YDtcclxuICAgICAgZGVidWdDb250ZXh0KGFmdGVyTXNnKTtcclxuICAgICAgaWYgKGJlbmNobWFyaykge1xyXG4gICAgICAgIHRoaXMuc2VxdWVsaXplLmxvZyhhZnRlck1zZywgRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSwgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGUgZnVuY3Rpb24gdGFrZXMgdGhlIHJlc3VsdCBvZiB0aGUgcXVlcnkgZXhlY3V0aW9uIGFuZCBncm91cHNcclxuICAgKiB0aGUgYXNzb2NpYXRlZCBkYXRhIGJ5IHRoZSBjYWxsZWUuXHJcbiAgICpcclxuICAgKiBFeGFtcGxlOlxyXG4gICAqICAgZ3JvdXBKb2luRGF0YShbXHJcbiAgICogICAgIHtcclxuICAgKiAgICAgICBzb21lOiAnZGF0YScsXHJcbiAgICogICAgICAgaWQ6IDEsXHJcbiAgICogICAgICAgYXNzb2NpYXRpb246IHsgZm9vOiAnYmFyJywgaWQ6IDEgfVxyXG4gICAqICAgICB9LCB7XHJcbiAgICogICAgICAgc29tZTogJ2RhdGEnLFxyXG4gICAqICAgICAgIGlkOiAxLFxyXG4gICAqICAgICAgIGFzc29jaWF0aW9uOiB7IGZvbzogJ2JhcicsIGlkOiAyIH1cclxuICAgKiAgICAgfSwge1xyXG4gICAqICAgICAgIHNvbWU6ICdkYXRhJyxcclxuICAgKiAgICAgICBpZDogMSxcclxuICAgKiAgICAgICBhc3NvY2lhdGlvbjogeyBmb286ICdiYXInLCBpZDogMyB9XHJcbiAgICogICAgIH1cclxuICAgKiAgIF0pXHJcbiAgICpcclxuICAgKiBSZXN1bHQ6XHJcbiAgICogICBTb21ldGhpbmcgbGlrZSB0aGlzOlxyXG4gICAqXHJcbiAgICogICBbXHJcbiAgICogICAgIHtcclxuICAgKiAgICAgICBzb21lOiAnZGF0YScsXHJcbiAgICogICAgICAgaWQ6IDEsXHJcbiAgICogICAgICAgYXNzb2NpYXRpb246IFtcclxuICAgKiAgICAgICAgIHsgZm9vOiAnYmFyJywgaWQ6IDEgfSxcclxuICAgKiAgICAgICAgIHsgZm9vOiAnYmFyJywgaWQ6IDIgfSxcclxuICAgKiAgICAgICAgIHsgZm9vOiAnYmFyJywgaWQ6IDMgfVxyXG4gICAqICAgICAgIF1cclxuICAgKiAgICAgfVxyXG4gICAqICAgXVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtBcnJheX0gcm93c1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBpbmNsdWRlT3B0aW9uc1xyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBzdGF0aWMgX2dyb3VwSm9pbkRhdGEocm93cywgaW5jbHVkZU9wdGlvbnMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAvKlxyXG4gICAgICogQXNzdW1wdGlvbnNcclxuICAgICAqIElEIGlzIG5vdCBuZWNlc3NhcmlseSB0aGUgZmlyc3QgZmllbGRcclxuICAgICAqIEFsbCBmaWVsZHMgZm9yIGEgbGV2ZWwgaXMgZ3JvdXBlZCBpbiB0aGUgc2FtZSBzZXQgKGkuZS4gUGFuZWwuaWQsIFRhc2suaWQsIFBhbmVsLnRpdGxlIGlzIG5vdCBwb3NzaWJsZSlcclxuICAgICAqIFBhcmVudCBrZXlzIHdpbGwgYmUgc2VlbiBiZWZvcmUgYW55IGluY2x1ZGUvY2hpbGQga2V5c1xyXG4gICAgICogUHJldmlvdXMgc2V0IHdvbid0IG5lY2Vzc2FyaWx5IGJlIHBhcmVudCBzZXQgKG9uZSBwYXJlbnQgY291bGQgaGF2ZSB0d28gY2hpbGRyZW4sIG9uZSBjaGlsZCB3b3VsZCB0aGVuIGJlIHByZXZpb3VzIHNldCBmb3IgdGhlIG90aGVyKVxyXG4gICAgICovXHJcblxyXG4gICAgLypcclxuICAgICAqIEF1dGhvciAoTUgpIGNvbW1lbnQ6IFRoaXMgY29kZSBpcyBhbiB1bnJlYWRhYmxlIG1lc3MsIGJ1dCBpdCdzIHBlcmZvcm1hbnQuXHJcbiAgICAgKiBncm91cEpvaW5EYXRhIGlzIGEgcGVyZm9ybWFuY2UgY3JpdGljYWwgZnVuY3Rpb24gc28gd2UgcHJpb3JpdGl6ZSBwZXJmIG92ZXIgcmVhZGFiaWxpdHkuXHJcbiAgICAgKi9cclxuICAgIGlmICghcm93cy5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdlbmVyaWMgbG9vcGluZ1xyXG4gICAgbGV0IGk7XHJcbiAgICBsZXQgbGVuZ3RoO1xyXG4gICAgbGV0ICRpO1xyXG4gICAgbGV0ICRsZW5ndGg7XHJcbiAgICAvLyBSb3cgc3BlY2lmaWMgbG9vcGluZ1xyXG4gICAgbGV0IHJvd3NJO1xyXG4gICAgbGV0IHJvdztcclxuICAgIGNvbnN0IHJvd3NMZW5ndGggPSByb3dzLmxlbmd0aDtcclxuICAgIC8vIEtleSBzcGVjaWZpYyBsb29waW5nXHJcbiAgICBsZXQga2V5cztcclxuICAgIGxldCBrZXk7XHJcbiAgICBsZXQga2V5STtcclxuICAgIGxldCBrZXlMZW5ndGg7XHJcbiAgICBsZXQgcHJldktleTtcclxuICAgIGxldCB2YWx1ZXM7XHJcbiAgICBsZXQgdG9wVmFsdWVzO1xyXG4gICAgbGV0IHRvcEV4aXN0cztcclxuICAgIGNvbnN0IGNoZWNrRXhpc3RpbmcgPSBvcHRpb25zLmNoZWNrRXhpc3Rpbmc7XHJcbiAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIHRvIGRlZHVwbGljYXRlIHdlIGNhbiBwcmUtYWxsb2NhdGUgdGhlIHJlc3VsdGluZyBhcnJheVxyXG4gICAgbGV0IGl0ZW1IYXNoO1xyXG4gICAgbGV0IHBhcmVudEhhc2g7XHJcbiAgICBsZXQgdG9wSGFzaDtcclxuICAgIGNvbnN0IHJlc3VsdHMgPSBjaGVja0V4aXN0aW5nID8gW10gOiBuZXcgQXJyYXkocm93c0xlbmd0aCk7XHJcbiAgICBjb25zdCByZXN1bHRNYXAgPSB7fTtcclxuICAgIGNvbnN0IGluY2x1ZGVNYXAgPSB7fTtcclxuICAgIC8vIFJlc3VsdCB2YXJpYWJsZXMgZm9yIHRoZSByZXNwZWN0aXZlIGZ1bmN0aW9uc1xyXG4gICAgbGV0ICRrZXlQcmVmaXg7XHJcbiAgICBsZXQgJGtleVByZWZpeFN0cmluZztcclxuICAgIGxldCAkcHJldktleVByZWZpeFN0cmluZzsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG4gICAgbGV0ICRwcmV2S2V5UHJlZml4O1xyXG4gICAgbGV0ICRsYXN0S2V5UHJlZml4O1xyXG4gICAgbGV0ICRjdXJyZW50O1xyXG4gICAgbGV0ICRwYXJlbnQ7XHJcbiAgICAvLyBNYXAgZWFjaCBrZXkgdG8gYW4gaW5jbHVkZSBvcHRpb25cclxuICAgIGxldCBwcmV2aW91c1BpZWNlO1xyXG4gICAgY29uc3QgYnVpbGRJbmNsdWRlTWFwID0gcGllY2UgPT4ge1xyXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCRjdXJyZW50LmluY2x1ZGVNYXAsIHBpZWNlKSkge1xyXG4gICAgICAgIGluY2x1ZGVNYXBba2V5XSA9ICRjdXJyZW50ID0gJGN1cnJlbnQuaW5jbHVkZU1hcFtwaWVjZV07XHJcbiAgICAgICAgaWYgKHByZXZpb3VzUGllY2UpIHtcclxuICAgICAgICAgIHByZXZpb3VzUGllY2UgPSBgJHtwcmV2aW91c1BpZWNlfS4ke3BpZWNlfWA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHByZXZpb3VzUGllY2UgPSBwaWVjZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5jbHVkZU1hcFtwcmV2aW91c1BpZWNlXSA9ICRjdXJyZW50O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBzdHJpbmcgcHJlZml4IG9mIGEga2V5ICgnVXNlci5SZXN1bHRzJyBmb3IgJ1VzZXIuUmVzdWx0cy5pZCcpXHJcbiAgICBjb25zdCBrZXlQcmVmaXhTdHJpbmdNZW1vID0ge307XHJcbiAgICBjb25zdCBrZXlQcmVmaXhTdHJpbmcgPSAoa2V5LCBtZW1vKSA9PiB7XHJcbiAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1lbW8sIGtleSkpIHtcclxuICAgICAgICBtZW1vW2tleV0gPSBrZXkuc3Vic3RyKDAsIGtleS5sYXN0SW5kZXhPZignLicpKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbWVtb1trZXldO1xyXG4gICAgfTtcclxuICAgIC8vIFJlbW92ZXMgdGhlIHByZWZpeCBmcm9tIGEga2V5ICgnaWQnIGZvciAnVXNlci5SZXN1bHRzLmlkJylcclxuICAgIGNvbnN0IHJlbW92ZUtleVByZWZpeE1lbW8gPSB7fTtcclxuICAgIGNvbnN0IHJlbW92ZUtleVByZWZpeCA9IGtleSA9PiB7XHJcbiAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlbW92ZUtleVByZWZpeE1lbW8sIGtleSkpIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IGtleS5sYXN0SW5kZXhPZignLicpO1xyXG4gICAgICAgIHJlbW92ZUtleVByZWZpeE1lbW9ba2V5XSA9IGtleS5zdWJzdHIoaW5kZXggPT09IC0xID8gMCA6IGluZGV4ICsgMSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlbW92ZUtleVByZWZpeE1lbW9ba2V5XTtcclxuICAgIH07XHJcbiAgICAvLyBDYWxjdWxhdGVzIHRoZSBhcnJheSBwcmVmaXggb2YgYSBrZXkgKFsnVXNlcicsICdSZXN1bHRzJ10gZm9yICdVc2VyLlJlc3VsdHMuaWQnKVxyXG4gICAgY29uc3Qga2V5UHJlZml4TWVtbyA9IHt9O1xyXG4gICAgY29uc3Qga2V5UHJlZml4ID0ga2V5ID0+IHtcclxuICAgICAgLy8gV2UgdXNlIGEgZG91YmxlIG1lbW8gYW5kIGtleVByZWZpeFN0cmluZyBzbyB0aGF0IGRpZmZlcmVudCBrZXlzIHdpdGggdGhlIHNhbWUgcHJlZml4IHdpbGwgcmVjZWl2ZSB0aGUgc2FtZSBhcnJheSBpbnN0ZWFkIG9mIGRpZmZlcm5ldCBhcnJheXMgd2l0aCBlcXVhbCB2YWx1ZXNcclxuICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoa2V5UHJlZml4TWVtbywga2V5KSkge1xyXG4gICAgICAgIGNvbnN0IHByZWZpeFN0cmluZyA9IGtleVByZWZpeFN0cmluZyhrZXksIGtleVByZWZpeFN0cmluZ01lbW8pO1xyXG4gICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGtleVByZWZpeE1lbW8sIHByZWZpeFN0cmluZykpIHtcclxuICAgICAgICAgIGtleVByZWZpeE1lbW9bcHJlZml4U3RyaW5nXSA9IHByZWZpeFN0cmluZyA/IHByZWZpeFN0cmluZy5zcGxpdCgnLicpIDogW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGtleVByZWZpeE1lbW9ba2V5XSA9IGtleVByZWZpeE1lbW9bcHJlZml4U3RyaW5nXTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ga2V5UHJlZml4TWVtb1trZXldO1xyXG4gICAgfTtcclxuICAgIC8vIENhbGN1YXRlIHRoZSBsYXN0IGl0ZW0gaW4gdGhlIGFycmF5IHByZWZpeCAoJ1Jlc3VsdHMnIGZvciAnVXNlci5SZXN1bHRzLmlkJylcclxuICAgIGNvbnN0IGxhc3RLZXlQcmVmaXhNZW1vID0ge307XHJcbiAgICBjb25zdCBsYXN0S2V5UHJlZml4ID0ga2V5ID0+IHtcclxuICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobGFzdEtleVByZWZpeE1lbW8sIGtleSkpIHtcclxuICAgICAgICBjb25zdCBwcmVmaXggPSBrZXlQcmVmaXgoa2V5KTtcclxuICAgICAgICBjb25zdCBsZW5ndGggPSBwcmVmaXgubGVuZ3RoO1xyXG5cclxuICAgICAgICBsYXN0S2V5UHJlZml4TWVtb1trZXldID0gIWxlbmd0aCA/ICcnIDogcHJlZml4W2xlbmd0aCAtIDFdO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBsYXN0S2V5UHJlZml4TWVtb1trZXldO1xyXG4gICAgfTtcclxuICAgIGNvbnN0IGdldFVuaXF1ZUtleUF0dHJpYnV0ZXMgPSBtb2RlbCA9PiB7XHJcbiAgICAgIGxldCB1bmlxdWVLZXlBdHRyaWJ1dGVzID0gXy5jaGFpbihtb2RlbC51bmlxdWVLZXlzKTtcclxuICAgICAgdW5pcXVlS2V5QXR0cmlidXRlcyA9IHVuaXF1ZUtleUF0dHJpYnV0ZXNcclxuICAgICAgICAucmVzdWx0KGAke3VuaXF1ZUtleUF0dHJpYnV0ZXMuZmluZEtleSgpfS5maWVsZHNgKVxyXG4gICAgICAgIC5tYXAoZmllbGQgPT4gXy5maW5kS2V5KG1vZGVsLmF0dHJpYnV0ZXMsIGNociA9PiBjaHIuZmllbGQgPT09IGZpZWxkKSlcclxuICAgICAgICAudmFsdWUoKTtcclxuXHJcbiAgICAgIHJldHVybiB1bmlxdWVLZXlBdHRyaWJ1dGVzO1xyXG4gICAgfTtcclxuICAgIGNvbnN0IHN0cmluZ2lmeSA9IG9iaiA9PiBvYmogaW5zdGFuY2VvZiBCdWZmZXIgPyBvYmoudG9TdHJpbmcoJ2hleCcpIDogb2JqO1xyXG4gICAgbGV0IHByaW1hcnlLZXlBdHRyaWJ1dGVzO1xyXG4gICAgbGV0IHVuaXF1ZUtleUF0dHJpYnV0ZXM7XHJcbiAgICBsZXQgcHJlZml4O1xyXG5cclxuICAgIGZvciAocm93c0kgPSAwOyByb3dzSSA8IHJvd3NMZW5ndGg7IHJvd3NJKyspIHtcclxuICAgICAgcm93ID0gcm93c1tyb3dzSV07XHJcblxyXG4gICAgICAvLyBLZXlzIGFyZSB0aGUgc2FtZSBmb3IgYWxsIHJvd3MsIHNvIG9ubHkgbmVlZCB0byBjb21wdXRlIHRoZW0gb24gdGhlIGZpcnN0IHJvd1xyXG4gICAgICBpZiAocm93c0kgPT09IDApIHtcclxuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMocm93KTtcclxuICAgICAgICBrZXlMZW5ndGggPSBrZXlzLmxlbmd0aDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNoZWNrRXhpc3RpbmcpIHtcclxuICAgICAgICB0b3BFeGlzdHMgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZSB0b3AgbGV2ZWwgaGFzaCBrZXkgKHRoaXMgaXMgdXN1YWxseSBqdXN0IHRoZSBwcmltYXJ5IGtleSB2YWx1ZXMpXHJcbiAgICAgICAgJGxlbmd0aCA9IGluY2x1ZGVPcHRpb25zLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGVzLmxlbmd0aDtcclxuICAgICAgICB0b3BIYXNoID0gJyc7XHJcbiAgICAgICAgaWYgKCRsZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgIHRvcEhhc2ggPSBzdHJpbmdpZnkocm93W2luY2x1ZGVPcHRpb25zLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGVzWzBdXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCRsZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICBmb3IgKCRpID0gMDsgJGkgPCAkbGVuZ3RoOyAkaSsrKSB7XHJcbiAgICAgICAgICAgIHRvcEhhc2ggKz0gc3RyaW5naWZ5KHJvd1tpbmNsdWRlT3B0aW9ucy5tb2RlbC5wcmltYXJ5S2V5QXR0cmlidXRlc1skaV1dKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIV8uaXNFbXB0eShpbmNsdWRlT3B0aW9ucy5tb2RlbC51bmlxdWVLZXlzKSkge1xyXG4gICAgICAgICAgdW5pcXVlS2V5QXR0cmlidXRlcyA9IGdldFVuaXF1ZUtleUF0dHJpYnV0ZXMoaW5jbHVkZU9wdGlvbnMubW9kZWwpO1xyXG4gICAgICAgICAgZm9yICgkaSA9IDA7ICRpIDwgdW5pcXVlS2V5QXR0cmlidXRlcy5sZW5ndGg7ICRpKyspIHtcclxuICAgICAgICAgICAgdG9wSGFzaCArPSByb3dbdW5pcXVlS2V5QXR0cmlidXRlc1skaV1dO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgdG9wVmFsdWVzID0gdmFsdWVzID0ge307XHJcbiAgICAgICRwcmV2S2V5UHJlZml4ID0gdW5kZWZpbmVkO1xyXG4gICAgICBmb3IgKGtleUkgPSAwOyBrZXlJIDwga2V5TGVuZ3RoOyBrZXlJKyspIHtcclxuICAgICAgICBrZXkgPSBrZXlzW2tleUldO1xyXG5cclxuICAgICAgICAvLyBUaGUgc3RyaW5nIHByZWZpeCBpc24ndCBhY3R1YWx5IG5lZWRlZFxyXG4gICAgICAgIC8vIFdlIHVzZSBpdCBzbyBrZXlQcmVmaXggZm9yIGRpZmZlcmVudCBrZXlzIHdpbGwgcmVzb2x2ZSB0byB0aGUgc2FtZSBhcnJheSBpZiB0aGV5IGhhdmUgdGhlIHNhbWUgcHJlZml4XHJcbiAgICAgICAgLy8gVE9ETzogRmluZCBhIGJldHRlciB3YXk/XHJcbiAgICAgICAgJGtleVByZWZpeFN0cmluZyA9IGtleVByZWZpeFN0cmluZyhrZXksIGtleVByZWZpeFN0cmluZ01lbW8pO1xyXG4gICAgICAgICRrZXlQcmVmaXggPSBrZXlQcmVmaXgoa2V5KTtcclxuXHJcbiAgICAgICAgLy8gT24gdGhlIGZpcnN0IHJvdyB3ZSBjb21wdXRlIHRoZSBpbmNsdWRlTWFwXHJcbiAgICAgICAgaWYgKHJvd3NJID09PSAwICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5jbHVkZU1hcCwga2V5KSkge1xyXG4gICAgICAgICAgaWYgKCEka2V5UHJlZml4Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpbmNsdWRlTWFwW2tleV0gPSBpbmNsdWRlTWFwWycnXSA9IGluY2x1ZGVPcHRpb25zO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJGN1cnJlbnQgPSBpbmNsdWRlT3B0aW9ucztcclxuICAgICAgICAgICAgcHJldmlvdXNQaWVjZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgJGtleVByZWZpeC5mb3JFYWNoKGJ1aWxkSW5jbHVkZU1hcCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEVuZCBvZiBrZXkgc2V0XHJcbiAgICAgICAgaWYgKCRwcmV2S2V5UHJlZml4ICE9PSB1bmRlZmluZWQgJiYgJHByZXZLZXlQcmVmaXggIT09ICRrZXlQcmVmaXgpIHtcclxuICAgICAgICAgIGlmIChjaGVja0V4aXN0aW5nKSB7XHJcbiAgICAgICAgICAgIC8vIENvbXB1dGUgaGFzaCBrZXkgZm9yIHRoaXMgc2V0IGluc3RhbmNlXHJcbiAgICAgICAgICAgIC8vIFRPRE86IE9wdGltaXplXHJcbiAgICAgICAgICAgIGxlbmd0aCA9ICRwcmV2S2V5UHJlZml4Lmxlbmd0aDtcclxuICAgICAgICAgICAgJHBhcmVudCA9IG51bGw7XHJcbiAgICAgICAgICAgIHBhcmVudEhhc2ggPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJHBhcmVudCA/IGAkeyRwYXJlbnR9LiR7JHByZXZLZXlQcmVmaXhbaV19YCA6ICRwcmV2S2V5UHJlZml4W2ldO1xyXG4gICAgICAgICAgICAgICAgcHJpbWFyeUtleUF0dHJpYnV0ZXMgPSBpbmNsdWRlTWFwW3ByZWZpeF0ubW9kZWwucHJpbWFyeUtleUF0dHJpYnV0ZXM7XHJcbiAgICAgICAgICAgICAgICAkbGVuZ3RoID0gcHJpbWFyeUtleUF0dHJpYnV0ZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgaXRlbUhhc2ggPSBwcmVmaXg7XHJcbiAgICAgICAgICAgICAgICBpZiAoJGxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICBpdGVtSGFzaCArPSBzdHJpbmdpZnkocm93W2Ake3ByZWZpeH0uJHtwcmltYXJ5S2V5QXR0cmlidXRlc1swXX1gXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICgkbGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICBmb3IgKCRpID0gMDsgJGkgPCAkbGVuZ3RoOyAkaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbUhhc2ggKz0gc3RyaW5naWZ5KHJvd1tgJHtwcmVmaXh9LiR7cHJpbWFyeUtleUF0dHJpYnV0ZXNbJGldfWBdKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIV8uaXNFbXB0eShpbmNsdWRlTWFwW3ByZWZpeF0ubW9kZWwudW5pcXVlS2V5cykpIHtcclxuICAgICAgICAgICAgICAgICAgdW5pcXVlS2V5QXR0cmlidXRlcyA9IGdldFVuaXF1ZUtleUF0dHJpYnV0ZXMoaW5jbHVkZU1hcFtwcmVmaXhdLm1vZGVsKTtcclxuICAgICAgICAgICAgICAgICAgZm9yICgkaSA9IDA7ICRpIDwgdW5pcXVlS2V5QXR0cmlidXRlcy5sZW5ndGg7ICRpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtSGFzaCArPSByb3dbYCR7cHJlZml4fS4ke3VuaXF1ZUtleUF0dHJpYnV0ZXNbJGldfWBdO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhcmVudEhhc2gpIHtcclxuICAgICAgICAgICAgICAgICAgcGFyZW50SGFzaCA9IHRvcEhhc2g7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaXRlbUhhc2ggPSBwYXJlbnRIYXNoICsgaXRlbUhhc2g7XHJcbiAgICAgICAgICAgICAgICAkcGFyZW50ID0gcHJlZml4O1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPCBsZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIHBhcmVudEhhc2ggPSBpdGVtSGFzaDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgaXRlbUhhc2ggPSB0b3BIYXNoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXRlbUhhc2ggPT09IHRvcEhhc2gpIHtcclxuICAgICAgICAgICAgICBpZiAoIXJlc3VsdE1hcFtpdGVtSGFzaF0pIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdE1hcFtpdGVtSGFzaF0gPSB2YWx1ZXM7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRvcEV4aXN0cyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFyZXN1bHRNYXBbaXRlbUhhc2hdKSB7XHJcbiAgICAgICAgICAgICAgJHBhcmVudCA9IHJlc3VsdE1hcFtwYXJlbnRIYXNoXTtcclxuICAgICAgICAgICAgICAkbGFzdEtleVByZWZpeCA9IGxhc3RLZXlQcmVmaXgocHJldktleSk7XHJcblxyXG4gICAgICAgICAgICAgIGlmIChpbmNsdWRlTWFwW3ByZXZLZXldLmFzc29jaWF0aW9uLmlzU2luZ2xlQXNzb2NpYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGlmICgkcGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICRwYXJlbnRbJGxhc3RLZXlQcmVmaXhdID0gcmVzdWx0TWFwW2l0ZW1IYXNoXSA9IHZhbHVlcztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkcGFyZW50WyRsYXN0S2V5UHJlZml4XSkge1xyXG4gICAgICAgICAgICAgICAgICAkcGFyZW50WyRsYXN0S2V5UHJlZml4XSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJHBhcmVudFskbGFzdEtleVByZWZpeF0ucHVzaChyZXN1bHRNYXBbaXRlbUhhc2hdID0gdmFsdWVzKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlc2V0IHZhbHVlc1xyXG4gICAgICAgICAgICB2YWx1ZXMgPSB7fTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIElmIGNoZWNrRXhpc3RpbmcgaXMgZmFsc2UgaXQncyBiZWNhdXNlIHRoZXJlJ3Mgb25seSAxOjEgYXNzb2NpYXRpb25zIGluIHRoaXMgcXVlcnlcclxuICAgICAgICAgICAgLy8gSG93ZXZlciB3ZSBzdGlsbCBuZWVkIHRvIG1hcCBvbnRvIHRoZSBhcHByb3ByaWF0ZSBwYXJlbnRcclxuICAgICAgICAgICAgLy8gRm9yIDE6MSB3ZSBtYXAgZm9yd2FyZCwgaW5pdGlhbGl6aW5nIHRoZSB2YWx1ZSBvYmplY3Qgb24gdGhlIHBhcmVudCB0byBiZSBmaWxsZWQgaW4gdGhlIG5leHQgaXRlcmF0aW9ucyBvZiB0aGUgbG9vcFxyXG4gICAgICAgICAgICAkY3VycmVudCA9IHRvcFZhbHVlcztcclxuICAgICAgICAgICAgbGVuZ3RoID0gJGtleVByZWZpeC5sZW5ndGg7XHJcbiAgICAgICAgICAgIGlmIChsZW5ndGgpIHtcclxuICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpID09PSBsZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIHZhbHVlcyA9ICRjdXJyZW50WyRrZXlQcmVmaXhbaV1dID0ge307XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkY3VycmVudCA9ICRjdXJyZW50WyRrZXlQcmVmaXhbaV1dIHx8IHt9O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRW5kIG9mIGl0ZXJhdGlvbiwgc2V0IHZhbHVlIGFuZCBzZXQgcHJldiB2YWx1ZXMgKGZvciBuZXh0IGl0ZXJhdGlvbilcclxuICAgICAgICB2YWx1ZXNbcmVtb3ZlS2V5UHJlZml4KGtleSldID0gcm93W2tleV07XHJcbiAgICAgICAgcHJldktleSA9IGtleTtcclxuICAgICAgICAkcHJldktleVByZWZpeCA9ICRrZXlQcmVmaXg7XHJcbiAgICAgICAgJHByZXZLZXlQcmVmaXhTdHJpbmcgPSAka2V5UHJlZml4U3RyaW5nO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoY2hlY2tFeGlzdGluZykge1xyXG4gICAgICAgIGxlbmd0aCA9ICRwcmV2S2V5UHJlZml4Lmxlbmd0aDtcclxuICAgICAgICAkcGFyZW50ID0gbnVsbDtcclxuICAgICAgICBwYXJlbnRIYXNoID0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKGxlbmd0aCkge1xyXG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHByZWZpeCA9ICRwYXJlbnQgPyBgJHskcGFyZW50fS4keyRwcmV2S2V5UHJlZml4W2ldfWAgOiAkcHJldktleVByZWZpeFtpXTtcclxuICAgICAgICAgICAgcHJpbWFyeUtleUF0dHJpYnV0ZXMgPSBpbmNsdWRlTWFwW3ByZWZpeF0ubW9kZWwucHJpbWFyeUtleUF0dHJpYnV0ZXM7XHJcbiAgICAgICAgICAgICRsZW5ndGggPSBwcmltYXJ5S2V5QXR0cmlidXRlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGl0ZW1IYXNoID0gcHJlZml4O1xyXG4gICAgICAgICAgICBpZiAoJGxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgIGl0ZW1IYXNoICs9IHN0cmluZ2lmeShyb3dbYCR7cHJlZml4fS4ke3ByaW1hcnlLZXlBdHRyaWJ1dGVzWzBdfWBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICgkbGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgIGZvciAoJGkgPSAwOyAkaSA8ICRsZW5ndGg7ICRpKyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZW1IYXNoICs9IHN0cmluZ2lmeShyb3dbYCR7cHJlZml4fS4ke3ByaW1hcnlLZXlBdHRyaWJ1dGVzWyRpXX1gXSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCFfLmlzRW1wdHkoaW5jbHVkZU1hcFtwcmVmaXhdLm1vZGVsLnVuaXF1ZUtleXMpKSB7XHJcbiAgICAgICAgICAgICAgdW5pcXVlS2V5QXR0cmlidXRlcyA9IGdldFVuaXF1ZUtleUF0dHJpYnV0ZXMoaW5jbHVkZU1hcFtwcmVmaXhdLm1vZGVsKTtcclxuICAgICAgICAgICAgICBmb3IgKCRpID0gMDsgJGkgPCB1bmlxdWVLZXlBdHRyaWJ1dGVzLmxlbmd0aDsgJGkrKykge1xyXG4gICAgICAgICAgICAgICAgaXRlbUhhc2ggKz0gcm93W2Ake3ByZWZpeH0uJHt1bmlxdWVLZXlBdHRyaWJ1dGVzWyRpXX1gXTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFwYXJlbnRIYXNoKSB7XHJcbiAgICAgICAgICAgICAgcGFyZW50SGFzaCA9IHRvcEhhc2g7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGl0ZW1IYXNoID0gcGFyZW50SGFzaCArIGl0ZW1IYXNoO1xyXG4gICAgICAgICAgICAkcGFyZW50ID0gcHJlZml4O1xyXG4gICAgICAgICAgICBpZiAoaSA8IGxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICBwYXJlbnRIYXNoID0gaXRlbUhhc2g7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaXRlbUhhc2ggPSB0b3BIYXNoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGl0ZW1IYXNoID09PSB0b3BIYXNoKSB7XHJcbiAgICAgICAgICBpZiAoIXJlc3VsdE1hcFtpdGVtSGFzaF0pIHtcclxuICAgICAgICAgICAgcmVzdWx0TWFwW2l0ZW1IYXNoXSA9IHZhbHVlcztcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRvcEV4aXN0cyA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICghcmVzdWx0TWFwW2l0ZW1IYXNoXSkge1xyXG4gICAgICAgICAgJHBhcmVudCA9IHJlc3VsdE1hcFtwYXJlbnRIYXNoXTtcclxuICAgICAgICAgICRsYXN0S2V5UHJlZml4ID0gbGFzdEtleVByZWZpeChwcmV2S2V5KTtcclxuXHJcbiAgICAgICAgICBpZiAoaW5jbHVkZU1hcFtwcmV2S2V5XS5hc3NvY2lhdGlvbi5pc1NpbmdsZUFzc29jaWF0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICgkcGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgJHBhcmVudFskbGFzdEtleVByZWZpeF0gPSByZXN1bHRNYXBbaXRlbUhhc2hdID0gdmFsdWVzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoISRwYXJlbnRbJGxhc3RLZXlQcmVmaXhdKSB7XHJcbiAgICAgICAgICAgICAgJHBhcmVudFskbGFzdEtleVByZWZpeF0gPSBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkcGFyZW50WyRsYXN0S2V5UHJlZml4XS5wdXNoKHJlc3VsdE1hcFtpdGVtSGFzaF0gPSB2YWx1ZXMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRvcEV4aXN0cykge1xyXG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHRvcFZhbHVlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdHNbcm93c0ldID0gdG9wVmFsdWVzO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0UXVlcnk7XHJcbm1vZHVsZS5leHBvcnRzLkFic3RyYWN0UXVlcnkgPSBBYnN0cmFjdFF1ZXJ5O1xyXG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gQWJzdHJhY3RRdWVyeTtcclxuIl19