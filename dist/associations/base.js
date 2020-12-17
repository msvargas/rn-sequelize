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


let Association = /*#__PURE__*/function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hc3NvY2lhdGlvbnMvYmFzZS5qcyJdLCJuYW1lcyI6WyJBc3NvY2lhdGlvbkVycm9yIiwicmVxdWlyZSIsIkFzc29jaWF0aW9uIiwic291cmNlIiwidGFyZ2V0Iiwib3B0aW9ucyIsInNjb3BlIiwiaXNTZWxmQXNzb2NpYXRpb24iLCJhcyIsImFzc29jaWF0aW9uVHlwZSIsImhhc0FsaWFzIiwiaW5wdXQiLCJBcnJheSIsImlzQXJyYXkiLCJtYXAiLCJlbGVtZW50IiwidG1wSW5zdGFuY2UiLCJwcmltYXJ5S2V5QXR0cmlidXRlIiwiYnVpbGQiLCJpc05ld1JlY29yZCIsIlN5bWJvbCIsImZvciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OztBQUVBLE1BQU07QUFBRUEsRUFBQUE7QUFBRixJQUF1QkMsT0FBTyxDQUFDLGFBQUQsQ0FBcEM7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7SUFDTUMsVztBQUNKLHVCQUFZQyxNQUFaLEVBQW9CQyxNQUFwQixFQUE0QkMsT0FBTyxHQUFHLEVBQXRDLEVBQTBDO0FBQUE7O0FBQ3hDO0FBQ0o7QUFDQTtBQUNJLFNBQUtGLE1BQUwsR0FBY0EsTUFBZDtBQUVBO0FBQ0o7QUFDQTs7QUFDSSxTQUFLQyxNQUFMLEdBQWNBLE1BQWQ7QUFFQSxTQUFLQyxPQUFMLEdBQWVBLE9BQWY7QUFDQSxTQUFLQyxLQUFMLEdBQWFELE9BQU8sQ0FBQ0MsS0FBckI7QUFDQSxTQUFLQyxpQkFBTCxHQUF5QixLQUFLSixNQUFMLEtBQWdCLEtBQUtDLE1BQTlDO0FBQ0EsU0FBS0ksRUFBTCxHQUFVSCxPQUFPLENBQUNHLEVBQWxCO0FBRUE7QUFDSjtBQUNBO0FBQ0E7O0FBQ0ksU0FBS0MsZUFBTCxHQUF1QixFQUF2Qjs7QUFFQSxRQUFJTixNQUFNLENBQUNPLFFBQVAsQ0FBZ0JMLE9BQU8sQ0FBQ0csRUFBeEIsQ0FBSixFQUFpQztBQUMvQixZQUFNLElBQUlSLGdCQUFKLENBQXNCLDJCQUEwQkssT0FBTyxDQUFDRyxFQUFHLGlDQUF0QyxHQUMzQixnREFETSxDQUFOO0FBR0Q7QUFDRjtBQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O29DQUNrQkcsSyxFQUFPO0FBQ3JCLFVBQUksQ0FBQ0MsS0FBSyxDQUFDQyxPQUFOLENBQWNGLEtBQWQsQ0FBTCxFQUEyQjtBQUN6QkEsUUFBQUEsS0FBSyxHQUFHLENBQUNBLEtBQUQsQ0FBUjtBQUNEOztBQUVELGFBQU9BLEtBQUssQ0FBQ0csR0FBTixDQUFVQyxPQUFPLElBQUk7QUFDMUIsWUFBSUEsT0FBTyxZQUFZLEtBQUtYLE1BQTVCLEVBQW9DLE9BQU9XLE9BQVA7QUFFcEMsY0FBTUMsV0FBVyxHQUFHLEVBQXBCO0FBQ0FBLFFBQUFBLFdBQVcsQ0FBQyxLQUFLWixNQUFMLENBQVlhLG1CQUFiLENBQVgsR0FBK0NGLE9BQS9DO0FBRUEsZUFBTyxLQUFLWCxNQUFMLENBQVljLEtBQVosQ0FBa0JGLFdBQWxCLEVBQStCO0FBQUVHLFVBQUFBLFdBQVcsRUFBRTtBQUFmLFNBQS9CLENBQVA7QUFDRCxPQVBNLENBQVA7QUFRRDs7U0FFQUMsTUFBTSxDQUFDQyxHQUFQLENBQVcsNEJBQVgsQzt1QkFBNEM7QUFDM0MsYUFBTyxLQUFLYixFQUFaO0FBQ0Q7Ozs4QkFFUztBQUNSLGFBQU8sS0FBS0EsRUFBWjtBQUNEOzs7Ozs7QUFHSGMsTUFBTSxDQUFDQyxPQUFQLEdBQWlCckIsV0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHsgQXNzb2NpYXRpb25FcnJvciB9ID0gcmVxdWlyZSgnLi8uLi9lcnJvcnMnKTtcblxuLyoqXG4gKiBDcmVhdGluZyBhc3NvY2lhdGlvbnMgaW4gc2VxdWVsaXplIGlzIGRvbmUgYnkgY2FsbGluZyBvbmUgb2YgdGhlIGJlbG9uZ3NUbyAvIGhhc09uZSAvIGhhc01hbnkgLyBiZWxvbmdzVG9NYW55IGZ1bmN0aW9ucyBvbiBhIG1vZGVsICh0aGUgc291cmNlKSwgYW5kIHByb3ZpZGluZyBhbm90aGVyIG1vZGVsIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgZnVuY3Rpb24gKHRoZSB0YXJnZXQpLlxuICpcbiAqICogaGFzT25lIC0gYWRkcyBhIGZvcmVpZ24ga2V5IHRvIHRoZSB0YXJnZXQgYW5kIHNpbmd1bGFyIGFzc29jaWF0aW9uIG1peGlucyB0byB0aGUgc291cmNlLlxuICogKiBiZWxvbmdzVG8gLSBhZGQgYSBmb3JlaWduIGtleSBhbmQgc2luZ3VsYXIgYXNzb2NpYXRpb24gbWl4aW5zIHRvIHRoZSBzb3VyY2UuXG4gKiAqIGhhc01hbnkgLSBhZGRzIGEgZm9yZWlnbiBrZXkgdG8gdGFyZ2V0IGFuZCBwbHVyYWwgYXNzb2NpYXRpb24gbWl4aW5zIHRvIHRoZSBzb3VyY2UuXG4gKiAqIGJlbG9uZ3NUb01hbnkgLSBjcmVhdGVzIGFuIE46TSBhc3NvY2lhdGlvbiB3aXRoIGEgam9pbiB0YWJsZSBhbmQgYWRkcyBwbHVyYWwgYXNzb2NpYXRpb24gbWl4aW5zIHRvIHRoZSBzb3VyY2UuIFRoZSBqdW5jdGlvbiB0YWJsZSBpcyBjcmVhdGVkIHdpdGggc291cmNlSWQgYW5kIHRhcmdldElkLlxuICpcbiAqIENyZWF0aW5nIGFuIGFzc29jaWF0aW9uIHdpbGwgYWRkIGEgZm9yZWlnbiBrZXkgY29uc3RyYWludCB0byB0aGUgYXR0cmlidXRlcy4gQWxsIGFzc29jaWF0aW9ucyB1c2UgYENBU0NBREVgIG9uIHVwZGF0ZSBhbmQgYFNFVCBOVUxMYCBvbiBkZWxldGUsIGV4Y2VwdCBmb3IgbjptLCB3aGljaCBhbHNvIHVzZXMgYENBU0NBREVgIG9uIGRlbGV0ZS5cbiAqXG4gKiBXaGVuIGNyZWF0aW5nIGFzc29jaWF0aW9ucywgeW91IGNhbiBwcm92aWRlIGFuIGFsaWFzLCB2aWEgdGhlIGBhc2Agb3B0aW9uLiBUaGlzIGlzIHVzZWZ1bCBpZiB0aGUgc2FtZSBtb2RlbCBpcyBhc3NvY2lhdGVkIHR3aWNlLCBvciB5b3Ugd2FudCB5b3VyIGFzc29jaWF0aW9uIHRvIGJlIGNhbGxlZCBzb21ldGhpbmcgb3RoZXIgdGhhbiB0aGUgbmFtZSBvZiB0aGUgdGFyZ2V0IG1vZGVsLlxuICpcbiAqIEFzIGFuIGV4YW1wbGUsIGNvbnNpZGVyIHRoZSBjYXNlIHdoZXJlIHVzZXJzIGhhdmUgbWFueSBwaWN0dXJlcywgb25lIG9mIHdoaWNoIGlzIHRoZWlyIHByb2ZpbGUgcGljdHVyZS4gQWxsIHBpY3R1cmVzIGhhdmUgYSBgdXNlcklkYCwgYnV0IGluIGFkZGl0aW9uIHRoZSB1c2VyIG1vZGVsIGFsc28gaGFzIGEgYHByb2ZpbGVQaWN0dXJlSWRgLCB0byBiZSBhYmxlIHRvIGVhc2lseSBsb2FkIHRoZSB1c2VyJ3MgcHJvZmlsZSBwaWN0dXJlLlxuICpcbiAqIGBgYGpzXG4gKiBVc2VyLmhhc01hbnkoUGljdHVyZSlcbiAqIFVzZXIuYmVsb25nc1RvKFBpY3R1cmUsIHsgYXM6ICdQcm9maWxlUGljdHVyZScsIGNvbnN0cmFpbnRzOiBmYWxzZSB9KVxuICpcbiAqIHVzZXIuZ2V0UGljdHVyZXMoKSAvLyBnZXRzIHlvdSBhbGwgcGljdHVyZXNcbiAqIHVzZXIuZ2V0UHJvZmlsZVBpY3R1cmUoKSAvLyBnZXRzIHlvdSBvbmx5IHRoZSBwcm9maWxlIHBpY3R1cmVcbiAqXG4gKiBVc2VyLmZpbmRBbGwoe1xuICogICB3aGVyZTogLi4uLFxuICogICBpbmNsdWRlOiBbXG4gKiAgICAgeyBtb2RlbDogUGljdHVyZSB9LCAvLyBsb2FkIGFsbCBwaWN0dXJlc1xuICogICAgIHsgbW9kZWw6IFBpY3R1cmUsIGFzOiAnUHJvZmlsZVBpY3R1cmUnIH0sIC8vIGxvYWQgdGhlIHByb2ZpbGUgcGljdHVyZS5cbiAqICAgICAvLyBOb3RpY2UgdGhhdCB0aGUgc3BlbGxpbmcgbXVzdCBiZSB0aGUgZXhhY3Qgc2FtZSBhcyB0aGUgb25lIGluIHRoZSBhc3NvY2lhdGlvblxuICogICBdXG4gKiB9KVxuICogYGBgXG4gKiBUbyBnZXQgZnVsbCBjb250cm9sIG92ZXIgdGhlIGZvcmVpZ24ga2V5IGNvbHVtbiBhZGRlZCBieSBzZXF1ZWxpemUsIHlvdSBjYW4gdXNlIHRoZSBgZm9yZWlnbktleWAgb3B0aW9uLiBJdCBjYW4gZWl0aGVyIGJlIGEgc3RyaW5nLCB0aGF0IHNwZWNpZmllcyB0aGUgbmFtZSwgb3IgYW5kIG9iamVjdCB0eXBlIGRlZmluaXRpb24sXG4gKiBlcXVpdmFsZW50IHRvIHRob3NlIHBhc3NlZCB0byBgc2VxdWVsaXplLmRlZmluZWAuXG4gKlxuICogYGBganNcbiAqIFVzZXIuaGFzTWFueShQaWN0dXJlLCB7IGZvcmVpZ25LZXk6ICd1aWQnIH0pXG4gKiBgYGBcbiAqXG4gKiBUaGUgZm9yZWlnbiBrZXkgY29sdW1uIGluIFBpY3R1cmUgd2lsbCBub3cgYmUgY2FsbGVkIGB1aWRgIGluc3RlYWQgb2YgdGhlIGRlZmF1bHQgYHVzZXJJZGAuXG4gKlxuICogYGBganNcbiAqIFVzZXIuaGFzTWFueShQaWN0dXJlLCB7XG4gKiAgIGZvcmVpZ25LZXk6IHtcbiAqICAgICBuYW1lOiAndWlkJyxcbiAqICAgICBhbGxvd051bGw6IGZhbHNlXG4gKiAgIH1cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBUaGlzIHNwZWNpZmllcyB0aGF0IHRoZSBgdWlkYCBjb2x1bW4gY2Fubm90IGJlIG51bGwuIEluIG1vc3QgY2FzZXMgdGhpcyB3aWxsIGFscmVhZHkgYmUgY292ZXJlZCBieSB0aGUgZm9yZWlnbiBrZXkgY29uc3RyYWludHMsIHdoaWNoIHNlcXVlbGl6ZSBjcmVhdGVzIGF1dG9tYXRpY2FsbHksIGJ1dCBjYW4gYmUgdXNlZnVsIGluIGNhc2Ugd2hlcmUgdGhlIGZvcmVpZ24ga2V5cyBhcmUgZGlzYWJsZWQsIGUuZy4gZHVlIHRvIGNpcmN1bGFyIHJlZmVyZW5jZXMgKHNlZSBgY29uc3RyYWludHM6IGZhbHNlYCBiZWxvdykuXG4gKlxuICogV2hlbiBmZXRjaGluZyBhc3NvY2lhdGVkIG1vZGVscywgeW91IGNhbiBsaW1pdCB5b3VyIHF1ZXJ5IHRvIG9ubHkgbG9hZCBzb21lIG1vZGVscy4gVGhlc2UgcXVlcmllcyBhcmUgd3JpdHRlbiBpbiB0aGUgc2FtZSB3YXkgYXMgcXVlcmllcyB0byBgZmluZGAvYGZpbmRBbGxgLiBUbyBvbmx5IGdldCBwaWN0dXJlcyBpbiBKUEcsIHlvdSBjYW4gZG86XG4gKlxuICogYGBganNcbiAqIHVzZXIuZ2V0UGljdHVyZXMoe1xuICogICB3aGVyZToge1xuICogICAgIGZvcm1hdDogJ2pwZydcbiAqICAgfVxuICogfSlcbiAqIGBgYFxuICpcbiAqIFRoZXJlIGFyZSBzZXZlcmFsIHdheXMgdG8gdXBkYXRlIGFuZCBhZGQgbmV3IGFzc29jaWF0aW9ucy4gQ29udGludWluZyB3aXRoIG91ciBleGFtcGxlIG9mIHVzZXJzIGFuZCBwaWN0dXJlczpcbiAqIGBgYGpzXG4gKiB1c2VyLmFkZFBpY3R1cmUocCkgLy8gQWRkIGEgc2luZ2xlIHBpY3R1cmVcbiAqIHVzZXIuc2V0UGljdHVyZXMoW3AxLCBwMl0pIC8vIEFzc29jaWF0ZSB1c2VyIHdpdGggT05MWSB0aGVzZSB0d28gcGljdHVyZSwgYWxsIG90aGVyIGFzc29jaWF0aW9ucyB3aWxsIGJlIGRlbGV0ZWRcbiAqIHVzZXIuYWRkUGljdHVyZXMoW3AxLCBwMl0pIC8vIEFzc29jaWF0ZSB1c2VyIHdpdGggdGhlc2UgdHdvIHBpY3R1cmVzLCBidXQgZG9uJ3QgdG91Y2ggYW55IGN1cnJlbnQgYXNzb2NpYXRpb25zXG4gKiBgYGBcbiAqXG4gKiBZb3UgZG9uJ3QgaGF2ZSB0byBwYXNzIGluIGEgY29tcGxldGUgb2JqZWN0IHRvIHRoZSBhc3NvY2lhdGlvbiBmdW5jdGlvbnMsIGlmIHlvdXIgYXNzb2NpYXRlZCBtb2RlbCBoYXMgYSBzaW5nbGUgcHJpbWFyeSBrZXk6XG4gKlxuICogYGBganNcbiAqIHVzZXIuYWRkUGljdHVyZShyZXEucXVlcnkucGlkKSAvLyBIZXJlIHBpZCBpcyBqdXN0IGFuIGludGVnZXIsIHJlcHJlc2VudGluZyB0aGUgcHJpbWFyeSBrZXkgb2YgdGhlIHBpY3R1cmVcbiAqIGBgYFxuICpcbiAqIEluIHRoZSBleGFtcGxlIGFib3ZlIHdlIGhhdmUgc3BlY2lmaWVkIHRoYXQgYSB1c2VyIGJlbG9uZ3MgdG8gaGlzIHByb2ZpbGUgcGljdHVyZS4gQ29uY2VwdHVhbGx5LCB0aGlzIG1pZ2h0IG5vdCBtYWtlIHNlbnNlLCBidXQgc2luY2Ugd2Ugd2FudCB0byBhZGQgdGhlIGZvcmVpZ24ga2V5IHRvIHRoZSB1c2VyIG1vZGVsIHRoaXMgaXMgdGhlIHdheSB0byBkbyBpdC5cbiAqXG4gKiBOb3RlIGhvdyB3ZSBhbHNvIHNwZWNpZmllZCBgY29uc3RyYWludHM6IGZhbHNlYCBmb3IgcHJvZmlsZSBwaWN0dXJlLiBUaGlzIGlzIGJlY2F1c2Ugd2UgYWRkIGEgZm9yZWlnbiBrZXkgZnJvbSB1c2VyIHRvIHBpY3R1cmUgKHByb2ZpbGVQaWN0dXJlSWQpLCBhbmQgZnJvbSBwaWN0dXJlIHRvIHVzZXIgKHVzZXJJZCkuIElmIHdlIHdlcmUgdG8gYWRkIGZvcmVpZ24ga2V5cyB0byBib3RoLCBpdCB3b3VsZCBjcmVhdGUgYSBjeWNsaWMgZGVwZW5kZW5jeSwgYW5kIHNlcXVlbGl6ZSB3b3VsZCBub3Qga25vdyB3aGljaCB0YWJsZSB0byBjcmVhdGUgZmlyc3QsIHNpbmNlIHVzZXIgZGVwZW5kcyBvbiBwaWN0dXJlLCBhbmQgcGljdHVyZSBkZXBlbmRzIG9uIHVzZXIuIFRoZXNlIGtpbmRzIG9mIHByb2JsZW1zIGFyZSBkZXRlY3RlZCBieSBzZXF1ZWxpemUgYmVmb3JlIHRoZSBtb2RlbHMgYXJlIHN5bmNlZCB0byB0aGUgZGF0YWJhc2UsIGFuZCB5b3Ugd2lsbCBnZXQgYW4gZXJyb3IgYWxvbmcgdGhlIGxpbmVzIG9mIGBFcnJvcjogQ3ljbGljIGRlcGVuZGVuY3kgZm91bmQuICd1c2VycycgaXMgZGVwZW5kZW50IG9mIGl0c2VsZmAuIElmIHlvdSBlbmNvdW50ZXIgdGhpcywgeW91IHNob3VsZCBlaXRoZXIgZGlzYWJsZSBzb21lIGNvbnN0cmFpbnRzLCBvciByZXRoaW5rIHlvdXIgYXNzb2NpYXRpb25zIGNvbXBsZXRlbHkuXG4gKi9cbmNsYXNzIEFzc29jaWF0aW9uIHtcbiAgY29uc3RydWN0b3Ioc291cmNlLCB0YXJnZXQsIG9wdGlvbnMgPSB7fSkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtNb2RlbH1cbiAgICAgKi9cbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtNb2RlbH1cbiAgICAgKi9cbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcblxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5zY29wZSA9IG9wdGlvbnMuc2NvcGU7XG4gICAgdGhpcy5pc1NlbGZBc3NvY2lhdGlvbiA9IHRoaXMuc291cmNlID09PSB0aGlzLnRhcmdldDtcbiAgICB0aGlzLmFzID0gb3B0aW9ucy5hcztcblxuICAgIC8qKlxuICAgICAqIFRoZSB0eXBlIG9mIHRoZSBhc3NvY2lhdGlvbi4gT25lIG9mIGBIYXNNYW55YCwgYEJlbG9uZ3NUb2AsIGBIYXNPbmVgLCBgQmVsb25nc1RvTWFueWBcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMuYXNzb2NpYXRpb25UeXBlID0gJyc7XG5cbiAgICBpZiAoc291cmNlLmhhc0FsaWFzKG9wdGlvbnMuYXMpKSB7XG4gICAgICB0aHJvdyBuZXcgQXNzb2NpYXRpb25FcnJvcihgWW91IGhhdmUgdXNlZCB0aGUgYWxpYXMgJHtvcHRpb25zLmFzfSBpbiB0d28gc2VwYXJhdGUgYXNzb2NpYXRpb25zLiBgICtcbiAgICAgICdBbGlhc2VkIGFzc29jaWF0aW9ucyBtdXN0IGhhdmUgdW5pcXVlIGFsaWFzZXMuJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplIGlucHV0XG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBpbnB1dCBpdCBtYXkgYmUgYXJyYXkgb3Igc2luZ2xlIG9iaiwgaW5zdGFuY2Ugb3IgcHJpbWFyeSBrZXlcbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge0FycmF5fSBidWlsdCBvYmplY3RzXG4gICAqL1xuICB0b0luc3RhbmNlQXJyYXkoaW5wdXQpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgICBpbnB1dCA9IFtpbnB1dF07XG4gICAgfVxuXG4gICAgcmV0dXJuIGlucHV0Lm1hcChlbGVtZW50ID0+IHtcbiAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgdGhpcy50YXJnZXQpIHJldHVybiBlbGVtZW50O1xuXG4gICAgICBjb25zdCB0bXBJbnN0YW5jZSA9IHt9O1xuICAgICAgdG1wSW5zdGFuY2VbdGhpcy50YXJnZXQucHJpbWFyeUtleUF0dHJpYnV0ZV0gPSBlbGVtZW50O1xuXG4gICAgICByZXR1cm4gdGhpcy50YXJnZXQuYnVpbGQodG1wSW5zdGFuY2UsIHsgaXNOZXdSZWNvcmQ6IGZhbHNlIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgW1N5bWJvbC5mb3IoJ25vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tJyldKCkge1xuICAgIHJldHVybiB0aGlzLmFzO1xuICB9XG5cbiAgaW5zcGVjdCgpIHtcbiAgICByZXR1cm4gdGhpcy5hcztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc29jaWF0aW9uO1xuIl19