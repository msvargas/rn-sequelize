'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const {
  AssociationError
} = require('./../errors');
/**
 * Creating associations in sequelize is done by calling one of the belongsTo / hasOne / hasMany / belongsToMany functions on a model (the source), and providing another model as the first argument to the function (the target).
 *
 * * hasOne - adds a foreign key to the target and singular association mixins to the source.
 * * belongsTo - add a foreign key and singular association mixins to the source.
 * * hasMany - adds a foreign key to target and plural association mixins to the source.
 * * belongsToMany - creates an N:M association with a join table and adds plural association mixins to the source. The junction table is created with sourceId and targetId.
 *
 * Creating an association will add a foreign key constraint to the attributes. All associations use `CASCADE` on update and `SET NULL` on delete, except for n:m, which also uses `CASCADE` on delete.
 *
 * When creating associations, you can provide an alias, via the `as` option. This is useful if the same model is associated twice, or you want your association to be called something other than the name of the target model.
 *
 * As an example, consider the case where users have many pictures, one of which is their profile picture. All pictures have a `userId`, but in addition the user model also has a `profilePictureId`, to be able to easily load the user's profile picture.
 *
 * ```js
 * User.hasMany(Picture)
 * User.belongsTo(Picture, { as: 'ProfilePicture', constraints: false })
 *
 * user.getPictures() // gets you all pictures
 * user.getProfilePicture() // gets you only the profile picture
 *
 * User.findAll({
 *   where: ...,
 *   include: [
 *     { model: Picture }, // load all pictures
 *     { model: Picture, as: 'ProfilePicture' }, // load the profile picture.
 *     // Notice that the spelling must be the exact same as the one in the association
 *   ]
 * })
 * ```
 * To get full control over the foreign key column added by sequelize, you can use the `foreignKey` option. It can either be a string, that specifies the name, or and object type definition,
 * equivalent to those passed to `sequelize.define`.
 *
 * ```js
 * User.hasMany(Picture, { foreignKey: 'uid' })
 * ```
 *
 * The foreign key column in Picture will now be called `uid` instead of the default `userId`.
 *
 * ```js
 * User.hasMany(Picture, {
 *   foreignKey: {
 *     name: 'uid',
 *     allowNull: false
 *   }
 * })
 * ```
 *
 * This specifies that the `uid` column cannot be null. In most cases this will already be covered by the foreign key constraints, which sequelize creates automatically, but can be useful in case where the foreign keys are disabled, e.g. due to circular references (see `constraints: false` below).
 *
 * When fetching associated models, you can limit your query to only load some models. These queries are written in the same way as queries to `find`/`findAll`. To only get pictures in JPG, you can do:
 *
 * ```js
 * user.getPictures({
 *   where: {
 *     format: 'jpg'
 *   }
 * })
 * ```
 *
 * There are several ways to update and add new associations. Continuing with our example of users and pictures:
 * ```js
 * user.addPicture(p) // Add a single picture
 * user.setPictures([p1, p2]) // Associate user with ONLY these two picture, all other associations will be deleted
 * user.addPictures([p1, p2]) // Associate user with these two pictures, but don't touch any current associations
 * ```
 *
 * You don't have to pass in a complete object to the association functions, if your associated model has a single primary key:
 *
 * ```js
 * user.addPicture(req.query.pid) // Here pid is just an integer, representing the primary key of the picture
 * ```
 *
 * In the example above we have specified that a user belongs to his profile picture. Conceptually, this might not make sense, but since we want to add the foreign key to the user model this is the way to do it.
 *
 * Note how we also specified `constraints: false` for profile picture. This is because we add a foreign key from user to picture (profilePictureId), and from picture to user (userId). If we were to add foreign keys to both, it would create a cyclic dependency, and sequelize would not know which table to create first, since user depends on picture, and picture depends on user. These kinds of problems are detected by sequelize before the models are synced to the database, and you will get an error along the lines of `Error: Cyclic dependency found. 'users' is dependent of itself`. If you encounter this, you should either disable some constraints, or rethink your associations completely.
 */


let Association =
/*#__PURE__*/
function () {
  function Association(source, target, options = {}) {
    _classCallCheck(this, Association);

    /**
     * @type {Model}
     */
    this.source = source;
    /**
     * @type {Model}
     */

    this.target = target;
    this.options = options;
    this.scope = options.scope;
    this.isSelfAssociation = this.source === this.target;
    this.as = options.as;
    /**
     * The type of the association. One of `HasMany`, `BelongsTo`, `HasOne`, `BelongsToMany`
     * @type {string}
     */

    this.associationType = '';

    if (source.hasAlias(options.as)) {
      throw new AssociationError(`You have used the alias ${options.as} in two separate associations. ` + 'Aliased associations must have unique aliases.');
    }
  }
  /**
   * Normalize input
   *
   * @param {Array|string} input it may be array or single obj, instance or primary key
   *
   * @private
   * @returns {Array} built objects
   */


  _createClass(Association, [{
    key: "toInstanceArray",
    value: function toInstanceArray(input) {
      if (!Array.isArray(input)) {
        input = [input];
      }

      return input.map(element => {
        if (element instanceof this.target) return element;
        const tmpInstance = {};
        tmpInstance[this.target.primaryKeyAttribute] = element;
        return this.target.build(tmpInstance, {
          isNewRecord: false
        });
      });
    }
  }, {
    key: Symbol.for('nodejs.util.inspect.custom'),
    value: function () {
      return this.as;
    }
  }, {
    key: "inspect",
    value: function inspect() {
      return this.as;
    }
  }]);

  return Association;
}();

module.exports = Association;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvYmFzZS5qcyJdLCJuYW1lcyI6WyJBc3NvY2lhdGlvbkVycm9yIiwicmVxdWlyZSIsIkFzc29jaWF0aW9uIiwic291cmNlIiwidGFyZ2V0Iiwib3B0aW9ucyIsInNjb3BlIiwiaXNTZWxmQXNzb2NpYXRpb24iLCJhcyIsImFzc29jaWF0aW9uVHlwZSIsImhhc0FsaWFzIiwiaW5wdXQiLCJBcnJheSIsImlzQXJyYXkiLCJtYXAiLCJlbGVtZW50IiwidG1wSW5zdGFuY2UiLCJwcmltYXJ5S2V5QXR0cmlidXRlIiwiYnVpbGQiLCJpc05ld1JlY29yZCIsIlN5bWJvbCIsImZvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OztBQUVBLE1BQU07QUFBRUEsRUFBQUE7QUFBRixJQUF1QkMsT0FBTyxDQUFDLGFBQUQsQ0FBcEM7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQTZFTUMsVzs7O0FBQ0osdUJBQVlDLE1BQVosRUFBb0JDLE1BQXBCLEVBQTRCQyxPQUFPLEdBQUcsRUFBdEMsRUFBMEM7QUFBQTs7QUFDeEM7OztBQUdBLFNBQUtGLE1BQUwsR0FBY0EsTUFBZDtBQUVBOzs7O0FBR0EsU0FBS0MsTUFBTCxHQUFjQSxNQUFkO0FBRUEsU0FBS0MsT0FBTCxHQUFlQSxPQUFmO0FBQ0EsU0FBS0MsS0FBTCxHQUFhRCxPQUFPLENBQUNDLEtBQXJCO0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUIsS0FBS0osTUFBTCxLQUFnQixLQUFLQyxNQUE5QztBQUNBLFNBQUtJLEVBQUwsR0FBVUgsT0FBTyxDQUFDRyxFQUFsQjtBQUVBOzs7OztBQUlBLFNBQUtDLGVBQUwsR0FBdUIsRUFBdkI7O0FBRUEsUUFBSU4sTUFBTSxDQUFDTyxRQUFQLENBQWdCTCxPQUFPLENBQUNHLEVBQXhCLENBQUosRUFBaUM7QUFDL0IsWUFBTSxJQUFJUixnQkFBSixDQUFzQiwyQkFBMEJLLE9BQU8sQ0FBQ0csRUFBRyxpQ0FBdEMsR0FDM0IsZ0RBRE0sQ0FBTjtBQUdEO0FBQ0Y7QUFFRDs7Ozs7Ozs7Ozs7O29DQVFnQkcsSyxFQUFPO0FBQ3JCLFVBQUksQ0FBQ0MsS0FBSyxDQUFDQyxPQUFOLENBQWNGLEtBQWQsQ0FBTCxFQUEyQjtBQUN6QkEsUUFBQUEsS0FBSyxHQUFHLENBQUNBLEtBQUQsQ0FBUjtBQUNEOztBQUVELGFBQU9BLEtBQUssQ0FBQ0csR0FBTixDQUFVQyxPQUFPLElBQUk7QUFDMUIsWUFBSUEsT0FBTyxZQUFZLEtBQUtYLE1BQTVCLEVBQW9DLE9BQU9XLE9BQVA7QUFFcEMsY0FBTUMsV0FBVyxHQUFHLEVBQXBCO0FBQ0FBLFFBQUFBLFdBQVcsQ0FBQyxLQUFLWixNQUFMLENBQVlhLG1CQUFiLENBQVgsR0FBK0NGLE9BQS9DO0FBRUEsZUFBTyxLQUFLWCxNQUFMLENBQVljLEtBQVosQ0FBa0JGLFdBQWxCLEVBQStCO0FBQUVHLFVBQUFBLFdBQVcsRUFBRTtBQUFmLFNBQS9CLENBQVA7QUFDRCxPQVBNLENBQVA7QUFRRDs7U0FFQUMsTUFBTSxDQUFDQyxHQUFQLENBQVcsNEJBQVgsQzt1QkFBNEM7QUFDM0MsYUFBTyxLQUFLYixFQUFaO0FBQ0Q7Ozs4QkFFUztBQUNSLGFBQU8sS0FBS0EsRUFBWjtBQUNEOzs7Ozs7QUFHSGMsTUFBTSxDQUFDQyxPQUFQLEdBQWlCckIsV0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCB7IEFzc29jaWF0aW9uRXJyb3IgfSA9IHJlcXVpcmUoJy4vLi4vZXJyb3JzJyk7XHJcblxyXG4vKipcclxuICogQ3JlYXRpbmcgYXNzb2NpYXRpb25zIGluIHNlcXVlbGl6ZSBpcyBkb25lIGJ5IGNhbGxpbmcgb25lIG9mIHRoZSBiZWxvbmdzVG8gLyBoYXNPbmUgLyBoYXNNYW55IC8gYmVsb25nc1RvTWFueSBmdW5jdGlvbnMgb24gYSBtb2RlbCAodGhlIHNvdXJjZSksIGFuZCBwcm92aWRpbmcgYW5vdGhlciBtb2RlbCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIGZ1bmN0aW9uICh0aGUgdGFyZ2V0KS5cclxuICpcclxuICogKiBoYXNPbmUgLSBhZGRzIGEgZm9yZWlnbiBrZXkgdG8gdGhlIHRhcmdldCBhbmQgc2luZ3VsYXIgYXNzb2NpYXRpb24gbWl4aW5zIHRvIHRoZSBzb3VyY2UuXHJcbiAqICogYmVsb25nc1RvIC0gYWRkIGEgZm9yZWlnbiBrZXkgYW5kIHNpbmd1bGFyIGFzc29jaWF0aW9uIG1peGlucyB0byB0aGUgc291cmNlLlxyXG4gKiAqIGhhc01hbnkgLSBhZGRzIGEgZm9yZWlnbiBrZXkgdG8gdGFyZ2V0IGFuZCBwbHVyYWwgYXNzb2NpYXRpb24gbWl4aW5zIHRvIHRoZSBzb3VyY2UuXHJcbiAqICogYmVsb25nc1RvTWFueSAtIGNyZWF0ZXMgYW4gTjpNIGFzc29jaWF0aW9uIHdpdGggYSBqb2luIHRhYmxlIGFuZCBhZGRzIHBsdXJhbCBhc3NvY2lhdGlvbiBtaXhpbnMgdG8gdGhlIHNvdXJjZS4gVGhlIGp1bmN0aW9uIHRhYmxlIGlzIGNyZWF0ZWQgd2l0aCBzb3VyY2VJZCBhbmQgdGFyZ2V0SWQuXHJcbiAqXHJcbiAqIENyZWF0aW5nIGFuIGFzc29jaWF0aW9uIHdpbGwgYWRkIGEgZm9yZWlnbiBrZXkgY29uc3RyYWludCB0byB0aGUgYXR0cmlidXRlcy4gQWxsIGFzc29jaWF0aW9ucyB1c2UgYENBU0NBREVgIG9uIHVwZGF0ZSBhbmQgYFNFVCBOVUxMYCBvbiBkZWxldGUsIGV4Y2VwdCBmb3IgbjptLCB3aGljaCBhbHNvIHVzZXMgYENBU0NBREVgIG9uIGRlbGV0ZS5cclxuICpcclxuICogV2hlbiBjcmVhdGluZyBhc3NvY2lhdGlvbnMsIHlvdSBjYW4gcHJvdmlkZSBhbiBhbGlhcywgdmlhIHRoZSBgYXNgIG9wdGlvbi4gVGhpcyBpcyB1c2VmdWwgaWYgdGhlIHNhbWUgbW9kZWwgaXMgYXNzb2NpYXRlZCB0d2ljZSwgb3IgeW91IHdhbnQgeW91ciBhc3NvY2lhdGlvbiB0byBiZSBjYWxsZWQgc29tZXRoaW5nIG90aGVyIHRoYW4gdGhlIG5hbWUgb2YgdGhlIHRhcmdldCBtb2RlbC5cclxuICpcclxuICogQXMgYW4gZXhhbXBsZSwgY29uc2lkZXIgdGhlIGNhc2Ugd2hlcmUgdXNlcnMgaGF2ZSBtYW55IHBpY3R1cmVzLCBvbmUgb2Ygd2hpY2ggaXMgdGhlaXIgcHJvZmlsZSBwaWN0dXJlLiBBbGwgcGljdHVyZXMgaGF2ZSBhIGB1c2VySWRgLCBidXQgaW4gYWRkaXRpb24gdGhlIHVzZXIgbW9kZWwgYWxzbyBoYXMgYSBgcHJvZmlsZVBpY3R1cmVJZGAsIHRvIGJlIGFibGUgdG8gZWFzaWx5IGxvYWQgdGhlIHVzZXIncyBwcm9maWxlIHBpY3R1cmUuXHJcbiAqXHJcbiAqIGBgYGpzXHJcbiAqIFVzZXIuaGFzTWFueShQaWN0dXJlKVxyXG4gKiBVc2VyLmJlbG9uZ3NUbyhQaWN0dXJlLCB7IGFzOiAnUHJvZmlsZVBpY3R1cmUnLCBjb25zdHJhaW50czogZmFsc2UgfSlcclxuICpcclxuICogdXNlci5nZXRQaWN0dXJlcygpIC8vIGdldHMgeW91IGFsbCBwaWN0dXJlc1xyXG4gKiB1c2VyLmdldFByb2ZpbGVQaWN0dXJlKCkgLy8gZ2V0cyB5b3Ugb25seSB0aGUgcHJvZmlsZSBwaWN0dXJlXHJcbiAqXHJcbiAqIFVzZXIuZmluZEFsbCh7XHJcbiAqICAgd2hlcmU6IC4uLixcclxuICogICBpbmNsdWRlOiBbXHJcbiAqICAgICB7IG1vZGVsOiBQaWN0dXJlIH0sIC8vIGxvYWQgYWxsIHBpY3R1cmVzXHJcbiAqICAgICB7IG1vZGVsOiBQaWN0dXJlLCBhczogJ1Byb2ZpbGVQaWN0dXJlJyB9LCAvLyBsb2FkIHRoZSBwcm9maWxlIHBpY3R1cmUuXHJcbiAqICAgICAvLyBOb3RpY2UgdGhhdCB0aGUgc3BlbGxpbmcgbXVzdCBiZSB0aGUgZXhhY3Qgc2FtZSBhcyB0aGUgb25lIGluIHRoZSBhc3NvY2lhdGlvblxyXG4gKiAgIF1cclxuICogfSlcclxuICogYGBgXHJcbiAqIFRvIGdldCBmdWxsIGNvbnRyb2wgb3ZlciB0aGUgZm9yZWlnbiBrZXkgY29sdW1uIGFkZGVkIGJ5IHNlcXVlbGl6ZSwgeW91IGNhbiB1c2UgdGhlIGBmb3JlaWduS2V5YCBvcHRpb24uIEl0IGNhbiBlaXRoZXIgYmUgYSBzdHJpbmcsIHRoYXQgc3BlY2lmaWVzIHRoZSBuYW1lLCBvciBhbmQgb2JqZWN0IHR5cGUgZGVmaW5pdGlvbixcclxuICogZXF1aXZhbGVudCB0byB0aG9zZSBwYXNzZWQgdG8gYHNlcXVlbGl6ZS5kZWZpbmVgLlxyXG4gKlxyXG4gKiBgYGBqc1xyXG4gKiBVc2VyLmhhc01hbnkoUGljdHVyZSwgeyBmb3JlaWduS2V5OiAndWlkJyB9KVxyXG4gKiBgYGBcclxuICpcclxuICogVGhlIGZvcmVpZ24ga2V5IGNvbHVtbiBpbiBQaWN0dXJlIHdpbGwgbm93IGJlIGNhbGxlZCBgdWlkYCBpbnN0ZWFkIG9mIHRoZSBkZWZhdWx0IGB1c2VySWRgLlxyXG4gKlxyXG4gKiBgYGBqc1xyXG4gKiBVc2VyLmhhc01hbnkoUGljdHVyZSwge1xyXG4gKiAgIGZvcmVpZ25LZXk6IHtcclxuICogICAgIG5hbWU6ICd1aWQnLFxyXG4gKiAgICAgYWxsb3dOdWxsOiBmYWxzZVxyXG4gKiAgIH1cclxuICogfSlcclxuICogYGBgXHJcbiAqXHJcbiAqIFRoaXMgc3BlY2lmaWVzIHRoYXQgdGhlIGB1aWRgIGNvbHVtbiBjYW5ub3QgYmUgbnVsbC4gSW4gbW9zdCBjYXNlcyB0aGlzIHdpbGwgYWxyZWFkeSBiZSBjb3ZlcmVkIGJ5IHRoZSBmb3JlaWduIGtleSBjb25zdHJhaW50cywgd2hpY2ggc2VxdWVsaXplIGNyZWF0ZXMgYXV0b21hdGljYWxseSwgYnV0IGNhbiBiZSB1c2VmdWwgaW4gY2FzZSB3aGVyZSB0aGUgZm9yZWlnbiBrZXlzIGFyZSBkaXNhYmxlZCwgZS5nLiBkdWUgdG8gY2lyY3VsYXIgcmVmZXJlbmNlcyAoc2VlIGBjb25zdHJhaW50czogZmFsc2VgIGJlbG93KS5cclxuICpcclxuICogV2hlbiBmZXRjaGluZyBhc3NvY2lhdGVkIG1vZGVscywgeW91IGNhbiBsaW1pdCB5b3VyIHF1ZXJ5IHRvIG9ubHkgbG9hZCBzb21lIG1vZGVscy4gVGhlc2UgcXVlcmllcyBhcmUgd3JpdHRlbiBpbiB0aGUgc2FtZSB3YXkgYXMgcXVlcmllcyB0byBgZmluZGAvYGZpbmRBbGxgLiBUbyBvbmx5IGdldCBwaWN0dXJlcyBpbiBKUEcsIHlvdSBjYW4gZG86XHJcbiAqXHJcbiAqIGBgYGpzXHJcbiAqIHVzZXIuZ2V0UGljdHVyZXMoe1xyXG4gKiAgIHdoZXJlOiB7XHJcbiAqICAgICBmb3JtYXQ6ICdqcGcnXHJcbiAqICAgfVxyXG4gKiB9KVxyXG4gKiBgYGBcclxuICpcclxuICogVGhlcmUgYXJlIHNldmVyYWwgd2F5cyB0byB1cGRhdGUgYW5kIGFkZCBuZXcgYXNzb2NpYXRpb25zLiBDb250aW51aW5nIHdpdGggb3VyIGV4YW1wbGUgb2YgdXNlcnMgYW5kIHBpY3R1cmVzOlxyXG4gKiBgYGBqc1xyXG4gKiB1c2VyLmFkZFBpY3R1cmUocCkgLy8gQWRkIGEgc2luZ2xlIHBpY3R1cmVcclxuICogdXNlci5zZXRQaWN0dXJlcyhbcDEsIHAyXSkgLy8gQXNzb2NpYXRlIHVzZXIgd2l0aCBPTkxZIHRoZXNlIHR3byBwaWN0dXJlLCBhbGwgb3RoZXIgYXNzb2NpYXRpb25zIHdpbGwgYmUgZGVsZXRlZFxyXG4gKiB1c2VyLmFkZFBpY3R1cmVzKFtwMSwgcDJdKSAvLyBBc3NvY2lhdGUgdXNlciB3aXRoIHRoZXNlIHR3byBwaWN0dXJlcywgYnV0IGRvbid0IHRvdWNoIGFueSBjdXJyZW50IGFzc29jaWF0aW9uc1xyXG4gKiBgYGBcclxuICpcclxuICogWW91IGRvbid0IGhhdmUgdG8gcGFzcyBpbiBhIGNvbXBsZXRlIG9iamVjdCB0byB0aGUgYXNzb2NpYXRpb24gZnVuY3Rpb25zLCBpZiB5b3VyIGFzc29jaWF0ZWQgbW9kZWwgaGFzIGEgc2luZ2xlIHByaW1hcnkga2V5OlxyXG4gKlxyXG4gKiBgYGBqc1xyXG4gKiB1c2VyLmFkZFBpY3R1cmUocmVxLnF1ZXJ5LnBpZCkgLy8gSGVyZSBwaWQgaXMganVzdCBhbiBpbnRlZ2VyLCByZXByZXNlbnRpbmcgdGhlIHByaW1hcnkga2V5IG9mIHRoZSBwaWN0dXJlXHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBJbiB0aGUgZXhhbXBsZSBhYm92ZSB3ZSBoYXZlIHNwZWNpZmllZCB0aGF0IGEgdXNlciBiZWxvbmdzIHRvIGhpcyBwcm9maWxlIHBpY3R1cmUuIENvbmNlcHR1YWxseSwgdGhpcyBtaWdodCBub3QgbWFrZSBzZW5zZSwgYnV0IHNpbmNlIHdlIHdhbnQgdG8gYWRkIHRoZSBmb3JlaWduIGtleSB0byB0aGUgdXNlciBtb2RlbCB0aGlzIGlzIHRoZSB3YXkgdG8gZG8gaXQuXHJcbiAqXHJcbiAqIE5vdGUgaG93IHdlIGFsc28gc3BlY2lmaWVkIGBjb25zdHJhaW50czogZmFsc2VgIGZvciBwcm9maWxlIHBpY3R1cmUuIFRoaXMgaXMgYmVjYXVzZSB3ZSBhZGQgYSBmb3JlaWduIGtleSBmcm9tIHVzZXIgdG8gcGljdHVyZSAocHJvZmlsZVBpY3R1cmVJZCksIGFuZCBmcm9tIHBpY3R1cmUgdG8gdXNlciAodXNlcklkKS4gSWYgd2Ugd2VyZSB0byBhZGQgZm9yZWlnbiBrZXlzIHRvIGJvdGgsIGl0IHdvdWxkIGNyZWF0ZSBhIGN5Y2xpYyBkZXBlbmRlbmN5LCBhbmQgc2VxdWVsaXplIHdvdWxkIG5vdCBrbm93IHdoaWNoIHRhYmxlIHRvIGNyZWF0ZSBmaXJzdCwgc2luY2UgdXNlciBkZXBlbmRzIG9uIHBpY3R1cmUsIGFuZCBwaWN0dXJlIGRlcGVuZHMgb24gdXNlci4gVGhlc2Uga2luZHMgb2YgcHJvYmxlbXMgYXJlIGRldGVjdGVkIGJ5IHNlcXVlbGl6ZSBiZWZvcmUgdGhlIG1vZGVscyBhcmUgc3luY2VkIHRvIHRoZSBkYXRhYmFzZSwgYW5kIHlvdSB3aWxsIGdldCBhbiBlcnJvciBhbG9uZyB0aGUgbGluZXMgb2YgYEVycm9yOiBDeWNsaWMgZGVwZW5kZW5jeSBmb3VuZC4gJ3VzZXJzJyBpcyBkZXBlbmRlbnQgb2YgaXRzZWxmYC4gSWYgeW91IGVuY291bnRlciB0aGlzLCB5b3Ugc2hvdWxkIGVpdGhlciBkaXNhYmxlIHNvbWUgY29uc3RyYWludHMsIG9yIHJldGhpbmsgeW91ciBhc3NvY2lhdGlvbnMgY29tcGxldGVseS5cclxuICovXHJcbmNsYXNzIEFzc29jaWF0aW9uIHtcclxuICBjb25zdHJ1Y3Rvcihzb3VyY2UsIHRhcmdldCwgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtNb2RlbH1cclxuICAgICAqL1xyXG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7TW9kZWx9XHJcbiAgICAgKi9cclxuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG5cclxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICB0aGlzLnNjb3BlID0gb3B0aW9ucy5zY29wZTtcclxuICAgIHRoaXMuaXNTZWxmQXNzb2NpYXRpb24gPSB0aGlzLnNvdXJjZSA9PT0gdGhpcy50YXJnZXQ7XHJcbiAgICB0aGlzLmFzID0gb3B0aW9ucy5hcztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB0eXBlIG9mIHRoZSBhc3NvY2lhdGlvbi4gT25lIG9mIGBIYXNNYW55YCwgYEJlbG9uZ3NUb2AsIGBIYXNPbmVgLCBgQmVsb25nc1RvTWFueWBcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuYXNzb2NpYXRpb25UeXBlID0gJyc7XHJcblxyXG4gICAgaWYgKHNvdXJjZS5oYXNBbGlhcyhvcHRpb25zLmFzKSkge1xyXG4gICAgICB0aHJvdyBuZXcgQXNzb2NpYXRpb25FcnJvcihgWW91IGhhdmUgdXNlZCB0aGUgYWxpYXMgJHtvcHRpb25zLmFzfSBpbiB0d28gc2VwYXJhdGUgYXNzb2NpYXRpb25zLiBgICtcclxuICAgICAgJ0FsaWFzZWQgYXNzb2NpYXRpb25zIG11c3QgaGF2ZSB1bmlxdWUgYWxpYXNlcy4nXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOb3JtYWxpemUgaW5wdXRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBpbnB1dCBpdCBtYXkgYmUgYXJyYXkgb3Igc2luZ2xlIG9iaiwgaW5zdGFuY2Ugb3IgcHJpbWFyeSBrZXlcclxuICAgKlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHJldHVybnMge0FycmF5fSBidWlsdCBvYmplY3RzXHJcbiAgICovXHJcbiAgdG9JbnN0YW5jZUFycmF5KGlucHV0KSB7XHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpKSB7XHJcbiAgICAgIGlucHV0ID0gW2lucHV0XTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaW5wdXQubWFwKGVsZW1lbnQgPT4ge1xyXG4gICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIHRoaXMudGFyZ2V0KSByZXR1cm4gZWxlbWVudDtcclxuXHJcbiAgICAgIGNvbnN0IHRtcEluc3RhbmNlID0ge307XHJcbiAgICAgIHRtcEluc3RhbmNlW3RoaXMudGFyZ2V0LnByaW1hcnlLZXlBdHRyaWJ1dGVdID0gZWxlbWVudDtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnRhcmdldC5idWlsZCh0bXBJbnN0YW5jZSwgeyBpc05ld1JlY29yZDogZmFsc2UgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIFtTeW1ib2wuZm9yKCdub2RlanMudXRpbC5pbnNwZWN0LmN1c3RvbScpXSgpIHtcclxuICAgIHJldHVybiB0aGlzLmFzO1xyXG4gIH1cclxuXHJcbiAgaW5zcGVjdCgpIHtcclxuICAgIHJldHVybiB0aGlzLmFzO1xyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBc3NvY2lhdGlvbjtcclxuIl19