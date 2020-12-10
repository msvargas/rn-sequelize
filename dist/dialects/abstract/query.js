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

let AbstractQuery = /*#__PURE__*/function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9hYnN0cmFjdC9xdWVyeS5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsIlNxbFN0cmluZyIsIlF1ZXJ5VHlwZXMiLCJEb3QiLCJkZXByZWNhdGlvbnMiLCJ1dWlkIiwiQWJzdHJhY3RRdWVyeSIsImNvbm5lY3Rpb24iLCJzZXF1ZWxpemUiLCJvcHRpb25zIiwiaW5zdGFuY2UiLCJtb2RlbCIsIk9iamVjdCIsImFzc2lnbiIsInBsYWluIiwicmF3IiwibG9nZ2luZyIsImNvbnNvbGUiLCJsb2ciLCJjaGVja0xvZ2dpbmdPcHRpb24iLCJFcnJvciIsIm5vVHJ1ZUxvZ2dpbmciLCJmaWVsZCIsIm1lc3NhZ2UiLCJrZXkiLCJrZXlzIiwidW5pcXVlS2V5cyIsImZpZWxkcyIsImluY2x1ZGVzIiwicmVwbGFjZSIsIm1zZyIsInR5cGUiLCJSQVciLCJWRVJTSU9OIiwiVVBTRVJUIiwicmVzdWx0cyIsIm1ldGFEYXRhIiwicmVzdWx0IiwiSU5TRVJUIiwic3FsIiwidG9Mb3dlckNhc2UiLCJzdGFydHNXaXRoIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiZ2V0SW5zZXJ0SWRGaWVsZCIsImF1dG9JbmNyZW1lbnRBdHRyaWJ1dGUiLCJpZCIsIlNIT1dUQUJMRVMiLCJmbGF0dGVuIiwibWFwIiwicmVzdWx0U2V0IiwidmFsdWVzIiwiU0hPV0lOREVYRVMiLCJTSE9XQ09OU1RSQUlOVFMiLCJERVNDUklCRSIsIlNFTEVDVCIsIkJVTEtVUERBVEUiLCJCVUxLREVMRVRFIiwiRk9SRUlHTktFWVMiLCJVUERBVEUiLCJmaWVsZE1hcCIsInJlZHVjZSIsIm5hbWUiLCJ1bmRlZmluZWQiLCJvIiwibmVzdCIsInRyYW5zZm9ybSIsImhhc0pvaW4iLCJfZ3JvdXBKb2luRGF0YSIsImluY2x1ZGVNYXAiLCJpbmNsdWRlTmFtZXMiLCJjaGVja0V4aXN0aW5nIiwiaGFzTXVsdGlBc3NvY2lhdGlvbiIsImJ1bGtCdWlsZCIsImlzTmV3UmVjb3JkIiwiaW5jbHVkZSIsImluY2x1ZGVWYWxpZGF0ZWQiLCJhdHRyaWJ1dGVzIiwib3JpZ2luYWxBdHRyaWJ1dGVzIiwibGVuZ3RoIiwiZGVidWdDb250ZXh0IiwicGFyYW1ldGVycyIsImJlbmNobWFyayIsImxvZ1F1ZXJ5UGFyYW1ldGVycyIsInN0YXJ0VGltZSIsIkRhdGUiLCJub3ciLCJsb2dQYXJhbWV0ZXIiLCJkZWxpbWl0ZXIiLCJlbmRzV2l0aCIsInBhcmFtU3RyIiwiQXJyYXkiLCJpc0FycmF5IiwicCIsIkpTT04iLCJzdHJpbmdpZnkiLCJqb2luIiwiZm10IiwiYWZ0ZXJNc2ciLCJkaWFsZWN0IiwicmVwbGFjZW1lbnRGdW5jIiwic2tpcFZhbHVlUmVwbGFjZSIsIm1hdGNoIiwidGltZVpvbmUiLCJlc2NhcGUiLCJvcmlnUmVwbGFjZW1lbnRGdW5jIiwibGlzdCIsInNraXBVbmVzY2FwZSIsInJlcGxWYWwiLCJyb3dzIiwiaW5jbHVkZU9wdGlvbnMiLCJpIiwiJGkiLCIkbGVuZ3RoIiwicm93c0kiLCJyb3ciLCJyb3dzTGVuZ3RoIiwia2V5SSIsImtleUxlbmd0aCIsInByZXZLZXkiLCJ0b3BWYWx1ZXMiLCJ0b3BFeGlzdHMiLCJpdGVtSGFzaCIsInBhcmVudEhhc2giLCJ0b3BIYXNoIiwicmVzdWx0TWFwIiwiJGtleVByZWZpeCIsIiRrZXlQcmVmaXhTdHJpbmciLCIkcHJldktleVByZWZpeFN0cmluZyIsIiRwcmV2S2V5UHJlZml4IiwiJGxhc3RLZXlQcmVmaXgiLCIkY3VycmVudCIsIiRwYXJlbnQiLCJwcmV2aW91c1BpZWNlIiwiYnVpbGRJbmNsdWRlTWFwIiwicGllY2UiLCJrZXlQcmVmaXhTdHJpbmdNZW1vIiwia2V5UHJlZml4U3RyaW5nIiwibWVtbyIsInN1YnN0ciIsImxhc3RJbmRleE9mIiwicmVtb3ZlS2V5UHJlZml4TWVtbyIsInJlbW92ZUtleVByZWZpeCIsImluZGV4Iiwia2V5UHJlZml4TWVtbyIsImtleVByZWZpeCIsInByZWZpeFN0cmluZyIsInNwbGl0IiwibGFzdEtleVByZWZpeE1lbW8iLCJsYXN0S2V5UHJlZml4IiwicHJlZml4IiwiZ2V0VW5pcXVlS2V5QXR0cmlidXRlcyIsInVuaXF1ZUtleUF0dHJpYnV0ZXMiLCJjaGFpbiIsImZpbmRLZXkiLCJjaHIiLCJ2YWx1ZSIsIm9iaiIsIkJ1ZmZlciIsInRvU3RyaW5nIiwicHJpbWFyeUtleUF0dHJpYnV0ZXMiLCJpc0VtcHR5IiwiZm9yRWFjaCIsImFzc29jaWF0aW9uIiwiaXNTaW5nbGVBc3NvY2lhdGlvbiIsInB1c2giLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBRUEsTUFBTUEsQ0FBQyxHQUFHQyxPQUFPLENBQUMsUUFBRCxDQUFqQjs7QUFDQSxNQUFNQyxTQUFTLEdBQUdELE9BQU8sQ0FBQyxrQkFBRCxDQUF6Qjs7QUFDQSxNQUFNRSxVQUFVLEdBQUdGLE9BQU8sQ0FBQyxtQkFBRCxDQUExQjs7QUFDQSxNQUFNRyxHQUFHLEdBQUdILE9BQU8sQ0FBQyxRQUFELENBQW5COztBQUNBLE1BQU1JLFlBQVksR0FBR0osT0FBTyxDQUFDLDBCQUFELENBQTVCOztBQUNBLE1BQU1LLElBQUksR0FBR0wsT0FBTyxDQUFDLFNBQUQsQ0FBcEI7O0lBRU1NLGE7QUFFSix5QkFBWUMsVUFBWixFQUF3QkMsU0FBeEIsRUFBbUNDLE9BQW5DLEVBQTRDO0FBQUE7O0FBQzFDLFNBQUtKLElBQUwsR0FBWUEsSUFBSSxFQUFoQjtBQUNBLFNBQUtFLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0EsU0FBS0csUUFBTCxHQUFnQkQsT0FBTyxDQUFDQyxRQUF4QjtBQUNBLFNBQUtDLEtBQUwsR0FBYUYsT0FBTyxDQUFDRSxLQUFyQjtBQUNBLFNBQUtILFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0EsU0FBS0MsT0FBTCxHQUFlRyxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUMzQkMsTUFBQUEsS0FBSyxFQUFFLEtBRG9CO0FBRTNCQyxNQUFBQSxHQUFHLEVBQUUsS0FGc0I7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QVAsR0FBaUJNLFNBQWpCO0FBQ0Q7QUFDRjs7QUFFRCxhQUFPdEYsT0FBUDtBQUNEOzs7Ozs7QUFHSG9JLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQmxLLGFBQWpCO0FBQ0FpSyxNQUFNLENBQUNDLE9BQVAsQ0FBZWxLLGFBQWYsR0FBK0JBLGFBQS9CO0FBQ0FpSyxNQUFNLENBQUNDLE9BQVAsQ0FBZUMsT0FBZixHQUF5Qm5LLGFBQXpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBTcWxTdHJpbmcgPSByZXF1aXJlKCcuLi8uLi9zcWwtc3RyaW5nJyk7XG5jb25zdCBRdWVyeVR5cGVzID0gcmVxdWlyZSgnLi4vLi4vcXVlcnktdHlwZXMnKTtcbmNvbnN0IERvdCA9IHJlcXVpcmUoJ2RvdHRpZScpO1xuY29uc3QgZGVwcmVjYXRpb25zID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvZGVwcmVjYXRpb25zJyk7XG5jb25zdCB1dWlkID0gcmVxdWlyZSgndXVpZC92NCcpO1xuXG5jbGFzcyBBYnN0cmFjdFF1ZXJ5IHtcblxuICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uLCBzZXF1ZWxpemUsIG9wdGlvbnMpIHtcbiAgICB0aGlzLnV1aWQgPSB1dWlkKCk7XG4gICAgdGhpcy5jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgICB0aGlzLmluc3RhbmNlID0gb3B0aW9ucy5pbnN0YW5jZTtcbiAgICB0aGlzLm1vZGVsID0gb3B0aW9ucy5tb2RlbDtcbiAgICB0aGlzLnNlcXVlbGl6ZSA9IHNlcXVlbGl6ZTtcbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHBsYWluOiBmYWxzZSxcbiAgICAgIHJhdzogZmFsc2UsXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgbG9nZ2luZzogY29uc29sZS5sb2dcbiAgICB9LCBvcHRpb25zIHx8IHt9KTtcbiAgICB0aGlzLmNoZWNrTG9nZ2luZ09wdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIHJld3JpdGUgcXVlcnkgd2l0aCBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEV4YW1wbGVzOlxuICAgKlxuICAgKiAgIHF1ZXJ5LmZvcm1hdEJpbmRQYXJhbWV0ZXJzKCdzZWxlY3QgJDEgYXMgZm9vJywgWydmb292YWwnXSk7XG4gICAqXG4gICAqICAgcXVlcnkuZm9ybWF0QmluZFBhcmFtZXRlcnMoJ3NlbGVjdCAkZm9vIGFzIGZvbycsIHsgZm9vOiAnZm9vdmFsJyB9KTtcbiAgICpcbiAgICogT3B0aW9uc1xuICAgKiAgIHNraXBVbmVzY2FwZTogYm9vbCwgc2tpcCB1bmVzY2FwaW5nICQkXG4gICAqICAgc2tpcFZhbHVlUmVwbGFjZTogYm9vbCwgZG8gbm90IHJlcGxhY2UgKGJ1dCBkbyB1bmVzY2FwZSAkJCkuIENoZWNrIGNvcnJlY3Qgc3ludGF4IGFuZCBpZiBhbGwgdmFsdWVzIGFyZSBhdmFpbGFibGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNxbFxuICAgKiBAcGFyYW0ge09iamVjdHxBcnJheX0gdmFsdWVzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkaWFsZWN0XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtyZXBsYWNlbWVudEZ1bmNdXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHN0YXRpYyBmb3JtYXRCaW5kUGFyYW1ldGVycyhzcWwsIHZhbHVlcywgZGlhbGVjdCwgcmVwbGFjZW1lbnRGdW5jLCBvcHRpb25zKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHtcbiAgICAgIHJldHVybiBbc3FsLCBbXV07XG4gICAgfVxuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKHR5cGVvZiByZXBsYWNlbWVudEZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9wdGlvbnMgPSByZXBsYWNlbWVudEZ1bmMgfHwge307XG4gICAgICByZXBsYWNlbWVudEZ1bmMgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKCFyZXBsYWNlbWVudEZ1bmMpIHtcbiAgICAgIGlmIChvcHRpb25zLnNraXBWYWx1ZVJlcGxhY2UpIHtcbiAgICAgICAgcmVwbGFjZW1lbnRGdW5jID0gKG1hdGNoLCBrZXksIHZhbHVlcykgPT4ge1xuICAgICAgICAgIGlmICh2YWx1ZXNba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXBsYWNlbWVudEZ1bmMgPSAobWF0Y2gsIGtleSwgdmFsdWVzLCB0aW1lWm9uZSwgZGlhbGVjdCkgPT4ge1xuICAgICAgICAgIGlmICh2YWx1ZXNba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gU3FsU3RyaW5nLmVzY2FwZSh2YWx1ZXNba2V5XSwgdGltZVpvbmUsIGRpYWxlY3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5za2lwVmFsdWVSZXBsYWNlKSB7XG4gICAgICBjb25zdCBvcmlnUmVwbGFjZW1lbnRGdW5jID0gcmVwbGFjZW1lbnRGdW5jO1xuICAgICAgcmVwbGFjZW1lbnRGdW5jID0gKG1hdGNoLCBrZXksIHZhbHVlcywgdGltZVpvbmUsIGRpYWxlY3QsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgaWYgKG9yaWdSZXBsYWNlbWVudEZ1bmMobWF0Y2gsIGtleSwgdmFsdWVzLCB0aW1lWm9uZSwgZGlhbGVjdCwgb3B0aW9ucykgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB0aW1lWm9uZSA9IG51bGw7XG4gICAgY29uc3QgbGlzdCA9IEFycmF5LmlzQXJyYXkodmFsdWVzKTtcblxuICAgIHNxbCA9IHNxbC5yZXBsYWNlKC9cXCQoXFwkfFxcdyspL2csIChtYXRjaCwga2V5KSA9PiB7XG4gICAgICBpZiAoJyQnID09PSBrZXkpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuc2tpcFVuZXNjYXBlID8gbWF0Y2ggOiBrZXk7XG4gICAgICB9XG5cbiAgICAgIGxldCByZXBsVmFsO1xuICAgICAgaWYgKGxpc3QpIHtcbiAgICAgICAgaWYgKGtleS5tYXRjaCgvXlsxLTldXFxkKiQvKSkge1xuICAgICAgICAgIGtleSA9IGtleSAtIDE7XG4gICAgICAgICAgcmVwbFZhbCA9IHJlcGxhY2VtZW50RnVuYyhtYXRjaCwga2V5LCB2YWx1ZXMsIHRpbWVab25lLCBkaWFsZWN0LCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICgha2V5Lm1hdGNoKC9eXFxkKiQvKSkge1xuICAgICAgICByZXBsVmFsID0gcmVwbGFjZW1lbnRGdW5jKG1hdGNoLCBrZXksIHZhbHVlcywgdGltZVpvbmUsIGRpYWxlY3QsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgaWYgKHJlcGxWYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5hbWVkIGJpbmQgcGFyYW1ldGVyIFwiJHttYXRjaH1cIiBoYXMgbm8gdmFsdWUgaW4gdGhlIGdpdmVuIG9iamVjdC5gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXBsVmFsO1xuICAgIH0pO1xuICAgIHJldHVybiBbc3FsLCBbXV07XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSB0aGUgcGFzc2VkIHNxbCBxdWVyeS5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqICAgICBxdWVyeS5ydW4oJ1NFTEVDVCAxJylcbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHJ1bigpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBydW4gbWV0aG9kIHdhc25cXCd0IG92ZXJ3cml0dGVuIScpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRoZSBsb2dnaW5nIG9wdGlvbiBvZiB0aGUgaW5zdGFuY2UgYW5kIHByaW50IGRlcHJlY2F0aW9uIHdhcm5pbmdzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY2hlY2tMb2dnaW5nT3B0aW9uKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMubG9nZ2luZyA9PT0gdHJ1ZSkge1xuICAgICAgZGVwcmVjYXRpb25zLm5vVHJ1ZUxvZ2dpbmcoKTtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICB0aGlzLm9wdGlvbnMubG9nZ2luZyA9IGNvbnNvbGUubG9nO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGF0dHJpYnV0ZXMgb2YgYW4gaW5zZXJ0IHF1ZXJ5LCB3aGljaCBjb250YWlucyB0aGUganVzdCBpbnNlcnRlZCBpZC5cbiAgICpcbiAgICogQHJldHVybnMge3N0cmluZ30gVGhlIGZpZWxkIG5hbWUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBnZXRJbnNlcnRJZEZpZWxkKCkge1xuICAgIHJldHVybiAnaW5zZXJ0SWQnO1xuICB9XG5cbiAgZ2V0VW5pcXVlQ29uc3RyYWludEVycm9yTWVzc2FnZShmaWVsZCkge1xuICAgIGxldCBtZXNzYWdlID0gZmllbGQgPyBgJHtmaWVsZH0gbXVzdCBiZSB1bmlxdWVgIDogJ011c3QgYmUgdW5pcXVlJztcblxuICAgIGlmIChmaWVsZCAmJiB0aGlzLm1vZGVsKSB7XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm1vZGVsLnVuaXF1ZUtleXMpKSB7XG4gICAgICAgIGlmICh0aGlzLm1vZGVsLnVuaXF1ZUtleXNba2V5XS5maWVsZHMuaW5jbHVkZXMoZmllbGQucmVwbGFjZSgvXCIvZywgJycpKSkge1xuICAgICAgICAgIGlmICh0aGlzLm1vZGVsLnVuaXF1ZUtleXNba2V5XS5tc2cpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSB0aGlzLm1vZGVsLnVuaXF1ZUtleXNba2V5XS5tc2c7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG5cbiAgaXNSYXdRdWVyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuUkFXO1xuICB9XG5cbiAgaXNWZXJzaW9uUXVlcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy50eXBlID09PSBRdWVyeVR5cGVzLlZFUlNJT047XG4gIH1cblxuICBpc1Vwc2VydFF1ZXJ5KCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5VUFNFUlQ7XG4gIH1cblxuICBpc0luc2VydFF1ZXJ5KHJlc3VsdHMsIG1ldGFEYXRhKSB7XG4gICAgbGV0IHJlc3VsdCA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuSU5TRVJUKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBpcyBpbnNlcnQgcXVlcnkgaWYgc3FsIGNvbnRhaW5zIGluc2VydCBpbnRvXG4gICAgcmVzdWx0ID0gcmVzdWx0ICYmIHRoaXMuc3FsLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnaW5zZXJ0IGludG8nKTtcblxuICAgIC8vIGlzIGluc2VydCBxdWVyeSBpZiBubyByZXN1bHRzIGFyZSBwYXNzZWQgb3IgaWYgdGhlIHJlc3VsdCBoYXMgdGhlIGluc2VydGVkIGlkXG4gICAgcmVzdWx0ID0gcmVzdWx0ICYmICghcmVzdWx0cyB8fCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzdWx0cywgdGhpcy5nZXRJbnNlcnRJZEZpZWxkKCkpKTtcblxuICAgIC8vIGlzIGluc2VydCBxdWVyeSBpZiBubyBtZXRhZGF0YSBhcmUgcGFzc2VkIG9yIGlmIHRoZSBtZXRhZGF0YSBoYXMgdGhlIGluc2VydGVkIGlkXG4gICAgcmVzdWx0ID0gcmVzdWx0ICYmICghbWV0YURhdGEgfHwgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1ldGFEYXRhLCB0aGlzLmdldEluc2VydElkRmllbGQoKSkpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGhhbmRsZUluc2VydFF1ZXJ5KHJlc3VsdHMsIG1ldGFEYXRhKSB7XG4gICAgaWYgKHRoaXMuaW5zdGFuY2UpIHtcbiAgICAgIC8vIGFkZCB0aGUgaW5zZXJ0ZWQgcm93IGlkIHRvIHRoZSBpbnN0YW5jZVxuICAgICAgY29uc3QgYXV0b0luY3JlbWVudEF0dHJpYnV0ZSA9IHRoaXMubW9kZWwuYXV0b0luY3JlbWVudEF0dHJpYnV0ZTtcbiAgICAgIGxldCBpZCA9IG51bGw7XG5cbiAgICAgIGlkID0gaWQgfHwgcmVzdWx0cyAmJiByZXN1bHRzW3RoaXMuZ2V0SW5zZXJ0SWRGaWVsZCgpXTtcbiAgICAgIGlkID0gaWQgfHwgbWV0YURhdGEgJiYgbWV0YURhdGFbdGhpcy5nZXRJbnNlcnRJZEZpZWxkKCldO1xuXG4gICAgICB0aGlzLmluc3RhbmNlW2F1dG9JbmNyZW1lbnRBdHRyaWJ1dGVdID0gaWQ7XG4gICAgfVxuICB9XG5cbiAgaXNTaG93VGFibGVzUXVlcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy50eXBlID09PSBRdWVyeVR5cGVzLlNIT1dUQUJMRVM7XG4gIH1cblxuICBoYW5kbGVTaG93VGFibGVzUXVlcnkocmVzdWx0cykge1xuICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0cy5tYXAocmVzdWx0U2V0ID0+IF8udmFsdWVzKHJlc3VsdFNldCkpKTtcbiAgfVxuXG4gIGlzU2hvd0luZGV4ZXNRdWVyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuU0hPV0lOREVYRVM7XG4gIH1cblxuICBpc1Nob3dDb25zdHJhaW50c1F1ZXJ5KCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5TSE9XQ09OU1RSQUlOVFM7XG4gIH1cblxuICBpc0Rlc2NyaWJlUXVlcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy50eXBlID09PSBRdWVyeVR5cGVzLkRFU0NSSUJFO1xuICB9XG5cbiAgaXNTZWxlY3RRdWVyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuU0VMRUNUO1xuICB9XG5cbiAgaXNCdWxrVXBkYXRlUXVlcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy50eXBlID09PSBRdWVyeVR5cGVzLkJVTEtVUERBVEU7XG4gIH1cblxuICBpc0J1bGtEZWxldGVRdWVyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuQlVMS0RFTEVURTtcbiAgfVxuXG4gIGlzRm9yZWlnbktleXNRdWVyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnR5cGUgPT09IFF1ZXJ5VHlwZXMuRk9SRUlHTktFWVM7XG4gIH1cblxuICBpc1VwZGF0ZVF1ZXJ5KCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMudHlwZSA9PT0gUXVlcnlUeXBlcy5VUERBVEU7XG4gIH1cblxuICBoYW5kbGVTZWxlY3RRdWVyeShyZXN1bHRzKSB7XG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgICAvLyBNYXAgcmF3IGZpZWxkcyB0byBuYW1lcyBpZiBhIG1hcHBpbmcgaXMgcHJvdmlkZWRcbiAgICBpZiAodGhpcy5vcHRpb25zLmZpZWxkTWFwKSB7XG4gICAgICBjb25zdCBmaWVsZE1hcCA9IHRoaXMub3B0aW9ucy5maWVsZE1hcDtcbiAgICAgIHJlc3VsdHMgPSByZXN1bHRzLm1hcChyZXN1bHQgPT4gXy5yZWR1Y2UoZmllbGRNYXAsIChyZXN1bHQsIG5hbWUsIGZpZWxkKSA9PiB7XG4gICAgICAgIGlmIChyZXN1bHRbZmllbGRdICE9PSB1bmRlZmluZWQgJiYgbmFtZSAhPT0gZmllbGQpIHtcbiAgICAgICAgICByZXN1bHRbbmFtZV0gPSByZXN1bHRbZmllbGRdO1xuICAgICAgICAgIGRlbGV0ZSByZXN1bHRbZmllbGRdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LCByZXN1bHQpKTtcbiAgICB9XG5cbiAgICAvLyBSYXcgcXVlcmllc1xuICAgIGlmICh0aGlzLm9wdGlvbnMucmF3KSB7XG4gICAgICByZXN1bHQgPSByZXN1bHRzLm1hcChyZXN1bHQgPT4ge1xuICAgICAgICBsZXQgbyA9IHt9O1xuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHJlc3VsdCkge1xuICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVzdWx0LCBrZXkpKSB7XG4gICAgICAgICAgICBvW2tleV0gPSByZXN1bHRba2V5XTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm5lc3QpIHtcbiAgICAgICAgICBvID0gRG90LnRyYW5zZm9ybShvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvO1xuICAgICAgfSk7XG4gICAgLy8gUXVlcmllcyB3aXRoIGluY2x1ZGVcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5oYXNKb2luID09PSB0cnVlKSB7XG4gICAgICByZXN1bHRzID0gQWJzdHJhY3RRdWVyeS5fZ3JvdXBKb2luRGF0YShyZXN1bHRzLCB7XG4gICAgICAgIG1vZGVsOiB0aGlzLm1vZGVsLFxuICAgICAgICBpbmNsdWRlTWFwOiB0aGlzLm9wdGlvbnMuaW5jbHVkZU1hcCxcbiAgICAgICAgaW5jbHVkZU5hbWVzOiB0aGlzLm9wdGlvbnMuaW5jbHVkZU5hbWVzXG4gICAgICB9LCB7XG4gICAgICAgIGNoZWNrRXhpc3Rpbmc6IHRoaXMub3B0aW9ucy5oYXNNdWx0aUFzc29jaWF0aW9uXG4gICAgICB9KTtcblxuICAgICAgcmVzdWx0ID0gdGhpcy5tb2RlbC5idWxrQnVpbGQocmVzdWx0cywge1xuICAgICAgICBpc05ld1JlY29yZDogZmFsc2UsXG4gICAgICAgIGluY2x1ZGU6IHRoaXMub3B0aW9ucy5pbmNsdWRlLFxuICAgICAgICBpbmNsdWRlTmFtZXM6IHRoaXMub3B0aW9ucy5pbmNsdWRlTmFtZXMsXG4gICAgICAgIGluY2x1ZGVNYXA6IHRoaXMub3B0aW9ucy5pbmNsdWRlTWFwLFxuICAgICAgICBpbmNsdWRlVmFsaWRhdGVkOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0aGlzLm9wdGlvbnMub3JpZ2luYWxBdHRyaWJ1dGVzIHx8IHRoaXMub3B0aW9ucy5hdHRyaWJ1dGVzLFxuICAgICAgICByYXc6IHRydWVcbiAgICAgIH0pO1xuICAgIC8vIFJlZ3VsYXIgcXVlcmllc1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSB0aGlzLm1vZGVsLmJ1bGtCdWlsZChyZXN1bHRzLCB7XG4gICAgICAgIGlzTmV3UmVjb3JkOiBmYWxzZSxcbiAgICAgICAgcmF3OiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0aGlzLm9wdGlvbnMub3JpZ2luYWxBdHRyaWJ1dGVzIHx8IHRoaXMub3B0aW9ucy5hdHRyaWJ1dGVzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyByZXR1cm4gdGhlIGZpcnN0IHJlYWwgbW9kZWwgaW5zdGFuY2UgaWYgb3B0aW9ucy5wbGFpbiBpcyBzZXQgKGUuZy4gTW9kZWwuZmluZClcbiAgICBpZiAodGhpcy5vcHRpb25zLnBsYWluKSB7XG4gICAgICByZXN1bHQgPSByZXN1bHQubGVuZ3RoID09PSAwID8gbnVsbCA6IHJlc3VsdFswXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGlzU2hvd09yRGVzY3JpYmVRdWVyeSgpIHtcbiAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICByZXN1bHQgPSByZXN1bHQgfHwgdGhpcy5zcWwudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdzaG93Jyk7XG4gICAgcmVzdWx0ID0gcmVzdWx0IHx8IHRoaXMuc3FsLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZGVzY3JpYmUnKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpc0NhbGxRdWVyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5zcWwudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdjYWxsJyk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNxbFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBkZWJ1Z0NvbnRleHRcbiAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHBhcmFtZXRlcnNcbiAgICogQHByb3RlY3RlZFxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgZnVuY3Rpb24gdG8gY2FsbCBhZnRlciB0aGUgcXVlcnkgd2FzIGNvbXBsZXRlZC5cbiAgICovXG4gIF9sb2dRdWVyeShzcWwsIGRlYnVnQ29udGV4dCwgcGFyYW1ldGVycykge1xuICAgIGNvbnN0IHsgY29ubmVjdGlvbiwgb3B0aW9ucyB9ID0gdGhpcztcbiAgICBjb25zdCBiZW5jaG1hcmsgPSB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmJlbmNobWFyayB8fCBvcHRpb25zLmJlbmNobWFyaztcbiAgICBjb25zdCBsb2dRdWVyeVBhcmFtZXRlcnMgPSB0aGlzLnNlcXVlbGl6ZS5vcHRpb25zLmxvZ1F1ZXJ5UGFyYW1ldGVycyB8fCBvcHRpb25zLmxvZ1F1ZXJ5UGFyYW1ldGVycztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGxldCBsb2dQYXJhbWV0ZXIgPSAnJztcbiAgICBcbiAgICBpZiAobG9nUXVlcnlQYXJhbWV0ZXJzICYmIHBhcmFtZXRlcnMpIHtcbiAgICAgIGNvbnN0IGRlbGltaXRlciA9IHNxbC5lbmRzV2l0aCgnOycpID8gJycgOiAnOyc7XG4gICAgICBsZXQgcGFyYW1TdHI7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJhbWV0ZXJzKSkge1xuICAgICAgICBwYXJhbVN0ciA9IHBhcmFtZXRlcnMubWFwKHA9PkpTT04uc3RyaW5naWZ5KHApKS5qb2luKCcsICcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyYW1TdHIgPSBKU09OLnN0cmluZ2lmeShwYXJhbWV0ZXJzKTtcbiAgICAgIH1cbiAgICAgIGxvZ1BhcmFtZXRlciA9IGAke2RlbGltaXRlcn0gJHtwYXJhbVN0cn1gO1xuICAgIH1cbiAgICBjb25zdCBmbXQgPSBgKCR7Y29ubmVjdGlvbi51dWlkIHx8ICdkZWZhdWx0J30pOiAke3NxbH0ke2xvZ1BhcmFtZXRlcn1gO1xuICAgIGNvbnN0IG1zZyA9IGBFeGVjdXRpbmcgJHtmbXR9YDtcbiAgICBkZWJ1Z0NvbnRleHQobXNnKTtcbiAgICBpZiAoIWJlbmNobWFyaykge1xuICAgICAgdGhpcy5zZXF1ZWxpemUubG9nKGBFeGVjdXRpbmcgJHtmbXR9YCwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjb25zdCBhZnRlck1zZyA9IGBFeGVjdXRlZCAke2ZtdH1gO1xuICAgICAgZGVidWdDb250ZXh0KGFmdGVyTXNnKTtcbiAgICAgIGlmIChiZW5jaG1hcmspIHtcbiAgICAgICAgdGhpcy5zZXF1ZWxpemUubG9nKGFmdGVyTXNnLCBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBmdW5jdGlvbiB0YWtlcyB0aGUgcmVzdWx0IG9mIHRoZSBxdWVyeSBleGVjdXRpb24gYW5kIGdyb3Vwc1xuICAgKiB0aGUgYXNzb2NpYXRlZCBkYXRhIGJ5IHRoZSBjYWxsZWUuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqICAgZ3JvdXBKb2luRGF0YShbXG4gICAqICAgICB7XG4gICAqICAgICAgIHNvbWU6ICdkYXRhJyxcbiAgICogICAgICAgaWQ6IDEsXG4gICAqICAgICAgIGFzc29jaWF0aW9uOiB7IGZvbzogJ2JhcicsIGlkOiAxIH1cbiAgICogICAgIH0sIHtcbiAgICogICAgICAgc29tZTogJ2RhdGEnLFxuICAgKiAgICAgICBpZDogMSxcbiAgICogICAgICAgYXNzb2NpYXRpb246IHsgZm9vOiAnYmFyJywgaWQ6IDIgfVxuICAgKiAgICAgfSwge1xuICAgKiAgICAgICBzb21lOiAnZGF0YScsXG4gICAqICAgICAgIGlkOiAxLFxuICAgKiAgICAgICBhc3NvY2lhdGlvbjogeyBmb286ICdiYXInLCBpZDogMyB9XG4gICAqICAgICB9XG4gICAqICAgXSlcbiAgICpcbiAgICogUmVzdWx0OlxuICAgKiAgIFNvbWV0aGluZyBsaWtlIHRoaXM6XG4gICAqXG4gICAqICAgW1xuICAgKiAgICAge1xuICAgKiAgICAgICBzb21lOiAnZGF0YScsXG4gICAqICAgICAgIGlkOiAxLFxuICAgKiAgICAgICBhc3NvY2lhdGlvbjogW1xuICAgKiAgICAgICAgIHsgZm9vOiAnYmFyJywgaWQ6IDEgfSxcbiAgICogICAgICAgICB7IGZvbzogJ2JhcicsIGlkOiAyIH0sXG4gICAqICAgICAgICAgeyBmb286ICdiYXInLCBpZDogMyB9XG4gICAqICAgICAgIF1cbiAgICogICAgIH1cbiAgICogICBdXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl9IHJvd3NcbiAgICogQHBhcmFtIHtPYmplY3R9IGluY2x1ZGVPcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBzdGF0aWMgX2dyb3VwSm9pbkRhdGEocm93cywgaW5jbHVkZU9wdGlvbnMsIG9wdGlvbnMpIHtcblxuICAgIC8qXG4gICAgICogQXNzdW1wdGlvbnNcbiAgICAgKiBJRCBpcyBub3QgbmVjZXNzYXJpbHkgdGhlIGZpcnN0IGZpZWxkXG4gICAgICogQWxsIGZpZWxkcyBmb3IgYSBsZXZlbCBpcyBncm91cGVkIGluIHRoZSBzYW1lIHNldCAoaS5lLiBQYW5lbC5pZCwgVGFzay5pZCwgUGFuZWwudGl0bGUgaXMgbm90IHBvc3NpYmxlKVxuICAgICAqIFBhcmVudCBrZXlzIHdpbGwgYmUgc2VlbiBiZWZvcmUgYW55IGluY2x1ZGUvY2hpbGQga2V5c1xuICAgICAqIFByZXZpb3VzIHNldCB3b24ndCBuZWNlc3NhcmlseSBiZSBwYXJlbnQgc2V0IChvbmUgcGFyZW50IGNvdWxkIGhhdmUgdHdvIGNoaWxkcmVuLCBvbmUgY2hpbGQgd291bGQgdGhlbiBiZSBwcmV2aW91cyBzZXQgZm9yIHRoZSBvdGhlcilcbiAgICAgKi9cblxuICAgIC8qXG4gICAgICogQXV0aG9yIChNSCkgY29tbWVudDogVGhpcyBjb2RlIGlzIGFuIHVucmVhZGFibGUgbWVzcywgYnV0IGl0J3MgcGVyZm9ybWFudC5cbiAgICAgKiBncm91cEpvaW5EYXRhIGlzIGEgcGVyZm9ybWFuY2UgY3JpdGljYWwgZnVuY3Rpb24gc28gd2UgcHJpb3JpdGl6ZSBwZXJmIG92ZXIgcmVhZGFiaWxpdHkuXG4gICAgICovXG4gICAgaWYgKCFyb3dzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIC8vIEdlbmVyaWMgbG9vcGluZ1xuICAgIGxldCBpO1xuICAgIGxldCBsZW5ndGg7XG4gICAgbGV0ICRpO1xuICAgIGxldCAkbGVuZ3RoO1xuICAgIC8vIFJvdyBzcGVjaWZpYyBsb29waW5nXG4gICAgbGV0IHJvd3NJO1xuICAgIGxldCByb3c7XG4gICAgY29uc3Qgcm93c0xlbmd0aCA9IHJvd3MubGVuZ3RoO1xuICAgIC8vIEtleSBzcGVjaWZpYyBsb29waW5nXG4gICAgbGV0IGtleXM7XG4gICAgbGV0IGtleTtcbiAgICBsZXQga2V5STtcbiAgICBsZXQga2V5TGVuZ3RoO1xuICAgIGxldCBwcmV2S2V5O1xuICAgIGxldCB2YWx1ZXM7XG4gICAgbGV0IHRvcFZhbHVlcztcbiAgICBsZXQgdG9wRXhpc3RzO1xuICAgIGNvbnN0IGNoZWNrRXhpc3RpbmcgPSBvcHRpb25zLmNoZWNrRXhpc3Rpbmc7XG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSB0byBkZWR1cGxpY2F0ZSB3ZSBjYW4gcHJlLWFsbG9jYXRlIHRoZSByZXN1bHRpbmcgYXJyYXlcbiAgICBsZXQgaXRlbUhhc2g7XG4gICAgbGV0IHBhcmVudEhhc2g7XG4gICAgbGV0IHRvcEhhc2g7XG4gICAgY29uc3QgcmVzdWx0cyA9IGNoZWNrRXhpc3RpbmcgPyBbXSA6IG5ldyBBcnJheShyb3dzTGVuZ3RoKTtcbiAgICBjb25zdCByZXN1bHRNYXAgPSB7fTtcbiAgICBjb25zdCBpbmNsdWRlTWFwID0ge307XG4gICAgLy8gUmVzdWx0IHZhcmlhYmxlcyBmb3IgdGhlIHJlc3BlY3RpdmUgZnVuY3Rpb25zXG4gICAgbGV0ICRrZXlQcmVmaXg7XG4gICAgbGV0ICRrZXlQcmVmaXhTdHJpbmc7XG4gICAgbGV0ICRwcmV2S2V5UHJlZml4U3RyaW5nOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgbGV0ICRwcmV2S2V5UHJlZml4O1xuICAgIGxldCAkbGFzdEtleVByZWZpeDtcbiAgICBsZXQgJGN1cnJlbnQ7XG4gICAgbGV0ICRwYXJlbnQ7XG4gICAgLy8gTWFwIGVhY2gga2V5IHRvIGFuIGluY2x1ZGUgb3B0aW9uXG4gICAgbGV0IHByZXZpb3VzUGllY2U7XG4gICAgY29uc3QgYnVpbGRJbmNsdWRlTWFwID0gcGllY2UgPT4ge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCgkY3VycmVudC5pbmNsdWRlTWFwLCBwaWVjZSkpIHtcbiAgICAgICAgaW5jbHVkZU1hcFtrZXldID0gJGN1cnJlbnQgPSAkY3VycmVudC5pbmNsdWRlTWFwW3BpZWNlXTtcbiAgICAgICAgaWYgKHByZXZpb3VzUGllY2UpIHtcbiAgICAgICAgICBwcmV2aW91c1BpZWNlID0gYCR7cHJldmlvdXNQaWVjZX0uJHtwaWVjZX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByZXZpb3VzUGllY2UgPSBwaWVjZTtcbiAgICAgICAgfVxuICAgICAgICBpbmNsdWRlTWFwW3ByZXZpb3VzUGllY2VdID0gJGN1cnJlbnQ7XG4gICAgICB9XG4gICAgfTtcbiAgICAvLyBDYWxjdWxhdGUgdGhlIHN0cmluZyBwcmVmaXggb2YgYSBrZXkgKCdVc2VyLlJlc3VsdHMnIGZvciAnVXNlci5SZXN1bHRzLmlkJylcbiAgICBjb25zdCBrZXlQcmVmaXhTdHJpbmdNZW1vID0ge307XG4gICAgY29uc3Qga2V5UHJlZml4U3RyaW5nID0gKGtleSwgbWVtbykgPT4ge1xuICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWVtbywga2V5KSkge1xuICAgICAgICBtZW1vW2tleV0gPSBrZXkuc3Vic3RyKDAsIGtleS5sYXN0SW5kZXhPZignLicpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZW1vW2tleV07XG4gICAgfTtcbiAgICAvLyBSZW1vdmVzIHRoZSBwcmVmaXggZnJvbSBhIGtleSAoJ2lkJyBmb3IgJ1VzZXIuUmVzdWx0cy5pZCcpXG4gICAgY29uc3QgcmVtb3ZlS2V5UHJlZml4TWVtbyA9IHt9O1xuICAgIGNvbnN0IHJlbW92ZUtleVByZWZpeCA9IGtleSA9PiB7XG4gICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChyZW1vdmVLZXlQcmVmaXhNZW1vLCBrZXkpKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0ga2V5Lmxhc3RJbmRleE9mKCcuJyk7XG4gICAgICAgIHJlbW92ZUtleVByZWZpeE1lbW9ba2V5XSA9IGtleS5zdWJzdHIoaW5kZXggPT09IC0xID8gMCA6IGluZGV4ICsgMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVtb3ZlS2V5UHJlZml4TWVtb1trZXldO1xuICAgIH07XG4gICAgLy8gQ2FsY3VsYXRlcyB0aGUgYXJyYXkgcHJlZml4IG9mIGEga2V5IChbJ1VzZXInLCAnUmVzdWx0cyddIGZvciAnVXNlci5SZXN1bHRzLmlkJylcbiAgICBjb25zdCBrZXlQcmVmaXhNZW1vID0ge307XG4gICAgY29uc3Qga2V5UHJlZml4ID0ga2V5ID0+IHtcbiAgICAgIC8vIFdlIHVzZSBhIGRvdWJsZSBtZW1vIGFuZCBrZXlQcmVmaXhTdHJpbmcgc28gdGhhdCBkaWZmZXJlbnQga2V5cyB3aXRoIHRoZSBzYW1lIHByZWZpeCB3aWxsIHJlY2VpdmUgdGhlIHNhbWUgYXJyYXkgaW5zdGVhZCBvZiBkaWZmZXJuZXQgYXJyYXlzIHdpdGggZXF1YWwgdmFsdWVzXG4gICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChrZXlQcmVmaXhNZW1vLCBrZXkpKSB7XG4gICAgICAgIGNvbnN0IHByZWZpeFN0cmluZyA9IGtleVByZWZpeFN0cmluZyhrZXksIGtleVByZWZpeFN0cmluZ01lbW8pO1xuICAgICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChrZXlQcmVmaXhNZW1vLCBwcmVmaXhTdHJpbmcpKSB7XG4gICAgICAgICAga2V5UHJlZml4TWVtb1twcmVmaXhTdHJpbmddID0gcHJlZml4U3RyaW5nID8gcHJlZml4U3RyaW5nLnNwbGl0KCcuJykgOiBbXTtcbiAgICAgICAgfVxuICAgICAgICBrZXlQcmVmaXhNZW1vW2tleV0gPSBrZXlQcmVmaXhNZW1vW3ByZWZpeFN0cmluZ107XG4gICAgICB9XG4gICAgICByZXR1cm4ga2V5UHJlZml4TWVtb1trZXldO1xuICAgIH07XG4gICAgLy8gQ2FsY3VhdGUgdGhlIGxhc3QgaXRlbSBpbiB0aGUgYXJyYXkgcHJlZml4ICgnUmVzdWx0cycgZm9yICdVc2VyLlJlc3VsdHMuaWQnKVxuICAgIGNvbnN0IGxhc3RLZXlQcmVmaXhNZW1vID0ge307XG4gICAgY29uc3QgbGFzdEtleVByZWZpeCA9IGtleSA9PiB7XG4gICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChsYXN0S2V5UHJlZml4TWVtbywga2V5KSkge1xuICAgICAgICBjb25zdCBwcmVmaXggPSBrZXlQcmVmaXgoa2V5KTtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcHJlZml4Lmxlbmd0aDtcblxuICAgICAgICBsYXN0S2V5UHJlZml4TWVtb1trZXldID0gIWxlbmd0aCA/ICcnIDogcHJlZml4W2xlbmd0aCAtIDFdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxhc3RLZXlQcmVmaXhNZW1vW2tleV07XG4gICAgfTtcbiAgICBjb25zdCBnZXRVbmlxdWVLZXlBdHRyaWJ1dGVzID0gbW9kZWwgPT4ge1xuICAgICAgbGV0IHVuaXF1ZUtleUF0dHJpYnV0ZXMgPSBfLmNoYWluKG1vZGVsLnVuaXF1ZUtleXMpO1xuICAgICAgdW5pcXVlS2V5QXR0cmlidXRlcyA9IHVuaXF1ZUtleUF0dHJpYnV0ZXNcbiAgICAgICAgLnJlc3VsdChgJHt1bmlxdWVLZXlBdHRyaWJ1dGVzLmZpbmRLZXkoKX0uZmllbGRzYClcbiAgICAgICAgLm1hcChmaWVsZCA9PiBfLmZpbmRLZXkobW9kZWwuYXR0cmlidXRlcywgY2hyID0+IGNoci5maWVsZCA9PT0gZmllbGQpKVxuICAgICAgICAudmFsdWUoKTtcblxuICAgICAgcmV0dXJuIHVuaXF1ZUtleUF0dHJpYnV0ZXM7XG4gICAgfTtcbiAgICBjb25zdCBzdHJpbmdpZnkgPSBvYmogPT4gb2JqIGluc3RhbmNlb2YgQnVmZmVyID8gb2JqLnRvU3RyaW5nKCdoZXgnKSA6IG9iajtcbiAgICBsZXQgcHJpbWFyeUtleUF0dHJpYnV0ZXM7XG4gICAgbGV0IHVuaXF1ZUtleUF0dHJpYnV0ZXM7XG4gICAgbGV0IHByZWZpeDtcblxuICAgIGZvciAocm93c0kgPSAwOyByb3dzSSA8IHJvd3NMZW5ndGg7IHJvd3NJKyspIHtcbiAgICAgIHJvdyA9IHJvd3Nbcm93c0ldO1xuXG4gICAgICAvLyBLZXlzIGFyZSB0aGUgc2FtZSBmb3IgYWxsIHJvd3MsIHNvIG9ubHkgbmVlZCB0byBjb21wdXRlIHRoZW0gb24gdGhlIGZpcnN0IHJvd1xuICAgICAgaWYgKHJvd3NJID09PSAwKSB7XG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhyb3cpO1xuICAgICAgICBrZXlMZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKGNoZWNrRXhpc3RpbmcpIHtcbiAgICAgICAgdG9wRXhpc3RzID0gZmFsc2U7XG5cbiAgICAgICAgLy8gQ29tcHV0ZSB0b3AgbGV2ZWwgaGFzaCBrZXkgKHRoaXMgaXMgdXN1YWxseSBqdXN0IHRoZSBwcmltYXJ5IGtleSB2YWx1ZXMpXG4gICAgICAgICRsZW5ndGggPSBpbmNsdWRlT3B0aW9ucy5tb2RlbC5wcmltYXJ5S2V5QXR0cmlidXRlcy5sZW5ndGg7XG4gICAgICAgIHRvcEhhc2ggPSAnJztcbiAgICAgICAgaWYgKCRsZW5ndGggPT09IDEpIHtcbiAgICAgICAgICB0b3BIYXNoID0gc3RyaW5naWZ5KHJvd1tpbmNsdWRlT3B0aW9ucy5tb2RlbC5wcmltYXJ5S2V5QXR0cmlidXRlc1swXV0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCRsZW5ndGggPiAxKSB7XG4gICAgICAgICAgZm9yICgkaSA9IDA7ICRpIDwgJGxlbmd0aDsgJGkrKykge1xuICAgICAgICAgICAgdG9wSGFzaCArPSBzdHJpbmdpZnkocm93W2luY2x1ZGVPcHRpb25zLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGVzWyRpXV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghXy5pc0VtcHR5KGluY2x1ZGVPcHRpb25zLm1vZGVsLnVuaXF1ZUtleXMpKSB7XG4gICAgICAgICAgdW5pcXVlS2V5QXR0cmlidXRlcyA9IGdldFVuaXF1ZUtleUF0dHJpYnV0ZXMoaW5jbHVkZU9wdGlvbnMubW9kZWwpO1xuICAgICAgICAgIGZvciAoJGkgPSAwOyAkaSA8IHVuaXF1ZUtleUF0dHJpYnV0ZXMubGVuZ3RoOyAkaSsrKSB7XG4gICAgICAgICAgICB0b3BIYXNoICs9IHJvd1t1bmlxdWVLZXlBdHRyaWJ1dGVzWyRpXV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRvcFZhbHVlcyA9IHZhbHVlcyA9IHt9O1xuICAgICAgJHByZXZLZXlQcmVmaXggPSB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGtleUkgPSAwOyBrZXlJIDwga2V5TGVuZ3RoOyBrZXlJKyspIHtcbiAgICAgICAga2V5ID0ga2V5c1trZXlJXTtcblxuICAgICAgICAvLyBUaGUgc3RyaW5nIHByZWZpeCBpc24ndCBhY3R1YWx5IG5lZWRlZFxuICAgICAgICAvLyBXZSB1c2UgaXQgc28ga2V5UHJlZml4IGZvciBkaWZmZXJlbnQga2V5cyB3aWxsIHJlc29sdmUgdG8gdGhlIHNhbWUgYXJyYXkgaWYgdGhleSBoYXZlIHRoZSBzYW1lIHByZWZpeFxuICAgICAgICAvLyBUT0RPOiBGaW5kIGEgYmV0dGVyIHdheT9cbiAgICAgICAgJGtleVByZWZpeFN0cmluZyA9IGtleVByZWZpeFN0cmluZyhrZXksIGtleVByZWZpeFN0cmluZ01lbW8pO1xuICAgICAgICAka2V5UHJlZml4ID0ga2V5UHJlZml4KGtleSk7XG5cbiAgICAgICAgLy8gT24gdGhlIGZpcnN0IHJvdyB3ZSBjb21wdXRlIHRoZSBpbmNsdWRlTWFwXG4gICAgICAgIGlmIChyb3dzSSA9PT0gMCAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGluY2x1ZGVNYXAsIGtleSkpIHtcbiAgICAgICAgICBpZiAoISRrZXlQcmVmaXgubGVuZ3RoKSB7XG4gICAgICAgICAgICBpbmNsdWRlTWFwW2tleV0gPSBpbmNsdWRlTWFwWycnXSA9IGluY2x1ZGVPcHRpb25zO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkY3VycmVudCA9IGluY2x1ZGVPcHRpb25zO1xuICAgICAgICAgICAgcHJldmlvdXNQaWVjZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICRrZXlQcmVmaXguZm9yRWFjaChidWlsZEluY2x1ZGVNYXApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBFbmQgb2Yga2V5IHNldFxuICAgICAgICBpZiAoJHByZXZLZXlQcmVmaXggIT09IHVuZGVmaW5lZCAmJiAkcHJldktleVByZWZpeCAhPT0gJGtleVByZWZpeCkge1xuICAgICAgICAgIGlmIChjaGVja0V4aXN0aW5nKSB7XG4gICAgICAgICAgICAvLyBDb21wdXRlIGhhc2gga2V5IGZvciB0aGlzIHNldCBpbnN0YW5jZVxuICAgICAgICAgICAgLy8gVE9ETzogT3B0aW1pemVcbiAgICAgICAgICAgIGxlbmd0aCA9ICRwcmV2S2V5UHJlZml4Lmxlbmd0aDtcbiAgICAgICAgICAgICRwYXJlbnQgPSBudWxsO1xuICAgICAgICAgICAgcGFyZW50SGFzaCA9IG51bGw7XG5cbiAgICAgICAgICAgIGlmIChsZW5ndGgpIHtcbiAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJHBhcmVudCA/IGAkeyRwYXJlbnR9LiR7JHByZXZLZXlQcmVmaXhbaV19YCA6ICRwcmV2S2V5UHJlZml4W2ldO1xuICAgICAgICAgICAgICAgIHByaW1hcnlLZXlBdHRyaWJ1dGVzID0gaW5jbHVkZU1hcFtwcmVmaXhdLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGVzO1xuICAgICAgICAgICAgICAgICRsZW5ndGggPSBwcmltYXJ5S2V5QXR0cmlidXRlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgaXRlbUhhc2ggPSBwcmVmaXg7XG4gICAgICAgICAgICAgICAgaWYgKCRsZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgIGl0ZW1IYXNoICs9IHN0cmluZ2lmeShyb3dbYCR7cHJlZml4fS4ke3ByaW1hcnlLZXlBdHRyaWJ1dGVzWzBdfWBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoJGxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgIGZvciAoJGkgPSAwOyAkaSA8ICRsZW5ndGg7ICRpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbUhhc2ggKz0gc3RyaW5naWZ5KHJvd1tgJHtwcmVmaXh9LiR7cHJpbWFyeUtleUF0dHJpYnV0ZXNbJGldfWBdKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIV8uaXNFbXB0eShpbmNsdWRlTWFwW3ByZWZpeF0ubW9kZWwudW5pcXVlS2V5cykpIHtcbiAgICAgICAgICAgICAgICAgIHVuaXF1ZUtleUF0dHJpYnV0ZXMgPSBnZXRVbmlxdWVLZXlBdHRyaWJ1dGVzKGluY2x1ZGVNYXBbcHJlZml4XS5tb2RlbCk7XG4gICAgICAgICAgICAgICAgICBmb3IgKCRpID0gMDsgJGkgPCB1bmlxdWVLZXlBdHRyaWJ1dGVzLmxlbmd0aDsgJGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpdGVtSGFzaCArPSByb3dbYCR7cHJlZml4fS4ke3VuaXF1ZUtleUF0dHJpYnV0ZXNbJGldfWBdO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXBhcmVudEhhc2gpIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudEhhc2ggPSB0b3BIYXNoO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGl0ZW1IYXNoID0gcGFyZW50SGFzaCArIGl0ZW1IYXNoO1xuICAgICAgICAgICAgICAgICRwYXJlbnQgPSBwcmVmaXg7XG4gICAgICAgICAgICAgICAgaWYgKGkgPCBsZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICBwYXJlbnRIYXNoID0gaXRlbUhhc2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpdGVtSGFzaCA9IHRvcEhhc2g7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpdGVtSGFzaCA9PT0gdG9wSGFzaCkge1xuICAgICAgICAgICAgICBpZiAoIXJlc3VsdE1hcFtpdGVtSGFzaF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHRNYXBbaXRlbUhhc2hdID0gdmFsdWVzO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRvcEV4aXN0cyA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXJlc3VsdE1hcFtpdGVtSGFzaF0pIHtcbiAgICAgICAgICAgICAgJHBhcmVudCA9IHJlc3VsdE1hcFtwYXJlbnRIYXNoXTtcbiAgICAgICAgICAgICAgJGxhc3RLZXlQcmVmaXggPSBsYXN0S2V5UHJlZml4KHByZXZLZXkpO1xuXG4gICAgICAgICAgICAgIGlmIChpbmNsdWRlTWFwW3ByZXZLZXldLmFzc29jaWF0aW9uLmlzU2luZ2xlQXNzb2NpYXRpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoJHBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgJHBhcmVudFskbGFzdEtleVByZWZpeF0gPSByZXN1bHRNYXBbaXRlbUhhc2hdID0gdmFsdWVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoISRwYXJlbnRbJGxhc3RLZXlQcmVmaXhdKSB7XG4gICAgICAgICAgICAgICAgICAkcGFyZW50WyRsYXN0S2V5UHJlZml4XSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkcGFyZW50WyRsYXN0S2V5UHJlZml4XS5wdXNoKHJlc3VsdE1hcFtpdGVtSGFzaF0gPSB2YWx1ZXMpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlc2V0IHZhbHVlc1xuICAgICAgICAgICAgdmFsdWVzID0ge307XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIElmIGNoZWNrRXhpc3RpbmcgaXMgZmFsc2UgaXQncyBiZWNhdXNlIHRoZXJlJ3Mgb25seSAxOjEgYXNzb2NpYXRpb25zIGluIHRoaXMgcXVlcnlcbiAgICAgICAgICAgIC8vIEhvd2V2ZXIgd2Ugc3RpbGwgbmVlZCB0byBtYXAgb250byB0aGUgYXBwcm9wcmlhdGUgcGFyZW50XG4gICAgICAgICAgICAvLyBGb3IgMToxIHdlIG1hcCBmb3J3YXJkLCBpbml0aWFsaXppbmcgdGhlIHZhbHVlIG9iamVjdCBvbiB0aGUgcGFyZW50IHRvIGJlIGZpbGxlZCBpbiB0aGUgbmV4dCBpdGVyYXRpb25zIG9mIHRoZSBsb29wXG4gICAgICAgICAgICAkY3VycmVudCA9IHRvcFZhbHVlcztcbiAgICAgICAgICAgIGxlbmd0aCA9ICRrZXlQcmVmaXgubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGxlbmd0aCkge1xuICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gbGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgdmFsdWVzID0gJGN1cnJlbnRbJGtleVByZWZpeFtpXV0gPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJGN1cnJlbnQgPSAkY3VycmVudFska2V5UHJlZml4W2ldXSB8fCB7fTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVuZCBvZiBpdGVyYXRpb24sIHNldCB2YWx1ZSBhbmQgc2V0IHByZXYgdmFsdWVzIChmb3IgbmV4dCBpdGVyYXRpb24pXG4gICAgICAgIHZhbHVlc1tyZW1vdmVLZXlQcmVmaXgoa2V5KV0gPSByb3dba2V5XTtcbiAgICAgICAgcHJldktleSA9IGtleTtcbiAgICAgICAgJHByZXZLZXlQcmVmaXggPSAka2V5UHJlZml4O1xuICAgICAgICAkcHJldktleVByZWZpeFN0cmluZyA9ICRrZXlQcmVmaXhTdHJpbmc7XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGVja0V4aXN0aW5nKSB7XG4gICAgICAgIGxlbmd0aCA9ICRwcmV2S2V5UHJlZml4Lmxlbmd0aDtcbiAgICAgICAgJHBhcmVudCA9IG51bGw7XG4gICAgICAgIHBhcmVudEhhc2ggPSBudWxsO1xuXG4gICAgICAgIGlmIChsZW5ndGgpIHtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHByZWZpeCA9ICRwYXJlbnQgPyBgJHskcGFyZW50fS4keyRwcmV2S2V5UHJlZml4W2ldfWAgOiAkcHJldktleVByZWZpeFtpXTtcbiAgICAgICAgICAgIHByaW1hcnlLZXlBdHRyaWJ1dGVzID0gaW5jbHVkZU1hcFtwcmVmaXhdLm1vZGVsLnByaW1hcnlLZXlBdHRyaWJ1dGVzO1xuICAgICAgICAgICAgJGxlbmd0aCA9IHByaW1hcnlLZXlBdHRyaWJ1dGVzLmxlbmd0aDtcbiAgICAgICAgICAgIGl0ZW1IYXNoID0gcHJlZml4O1xuICAgICAgICAgICAgaWYgKCRsZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgaXRlbUhhc2ggKz0gc3RyaW5naWZ5KHJvd1tgJHtwcmVmaXh9LiR7cHJpbWFyeUtleUF0dHJpYnV0ZXNbMF19YF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoJGxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgZm9yICgkaSA9IDA7ICRpIDwgJGxlbmd0aDsgJGkrKykge1xuICAgICAgICAgICAgICAgIGl0ZW1IYXNoICs9IHN0cmluZ2lmeShyb3dbYCR7cHJlZml4fS4ke3ByaW1hcnlLZXlBdHRyaWJ1dGVzWyRpXX1gXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCFfLmlzRW1wdHkoaW5jbHVkZU1hcFtwcmVmaXhdLm1vZGVsLnVuaXF1ZUtleXMpKSB7XG4gICAgICAgICAgICAgIHVuaXF1ZUtleUF0dHJpYnV0ZXMgPSBnZXRVbmlxdWVLZXlBdHRyaWJ1dGVzKGluY2x1ZGVNYXBbcHJlZml4XS5tb2RlbCk7XG4gICAgICAgICAgICAgIGZvciAoJGkgPSAwOyAkaSA8IHVuaXF1ZUtleUF0dHJpYnV0ZXMubGVuZ3RoOyAkaSsrKSB7XG4gICAgICAgICAgICAgICAgaXRlbUhhc2ggKz0gcm93W2Ake3ByZWZpeH0uJHt1bmlxdWVLZXlBdHRyaWJ1dGVzWyRpXX1gXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwYXJlbnRIYXNoKSB7XG4gICAgICAgICAgICAgIHBhcmVudEhhc2ggPSB0b3BIYXNoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpdGVtSGFzaCA9IHBhcmVudEhhc2ggKyBpdGVtSGFzaDtcbiAgICAgICAgICAgICRwYXJlbnQgPSBwcmVmaXg7XG4gICAgICAgICAgICBpZiAoaSA8IGxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgcGFyZW50SGFzaCA9IGl0ZW1IYXNoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtSGFzaCA9IHRvcEhhc2g7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXRlbUhhc2ggPT09IHRvcEhhc2gpIHtcbiAgICAgICAgICBpZiAoIXJlc3VsdE1hcFtpdGVtSGFzaF0pIHtcbiAgICAgICAgICAgIHJlc3VsdE1hcFtpdGVtSGFzaF0gPSB2YWx1ZXM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvcEV4aXN0cyA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFyZXN1bHRNYXBbaXRlbUhhc2hdKSB7XG4gICAgICAgICAgJHBhcmVudCA9IHJlc3VsdE1hcFtwYXJlbnRIYXNoXTtcbiAgICAgICAgICAkbGFzdEtleVByZWZpeCA9IGxhc3RLZXlQcmVmaXgocHJldktleSk7XG5cbiAgICAgICAgICBpZiAoaW5jbHVkZU1hcFtwcmV2S2V5XS5hc3NvY2lhdGlvbi5pc1NpbmdsZUFzc29jaWF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoJHBhcmVudCkge1xuICAgICAgICAgICAgICAkcGFyZW50WyRsYXN0S2V5UHJlZml4XSA9IHJlc3VsdE1hcFtpdGVtSGFzaF0gPSB2YWx1ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghJHBhcmVudFskbGFzdEtleVByZWZpeF0pIHtcbiAgICAgICAgICAgICAgJHBhcmVudFskbGFzdEtleVByZWZpeF0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRwYXJlbnRbJGxhc3RLZXlQcmVmaXhdLnB1c2gocmVzdWx0TWFwW2l0ZW1IYXNoXSA9IHZhbHVlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghdG9wRXhpc3RzKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHRvcFZhbHVlcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdHNbcm93c0ldID0gdG9wVmFsdWVzO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQWJzdHJhY3RRdWVyeTtcbm1vZHVsZS5leHBvcnRzLkFic3RyYWN0UXVlcnkgPSBBYnN0cmFjdFF1ZXJ5O1xubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IEFic3RyYWN0UXVlcnk7XG4iXX0=