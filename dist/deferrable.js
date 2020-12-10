'use strict';

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const {
  classToInvokable
} = require('./utils');

let ABSTRACT = /*#__PURE__*/function () {
  function ABSTRACT() {
    _classCallCheck(this, ABSTRACT);
  }

  _createClass(ABSTRACT, [{
    key: "toString",
    value: function toString(...args) {
      return this.toSql(...args);
    }
  }, {
    key: "toSql",
    value: function toSql() {
      throw new Error('toSql implementation missing');
    }
  }], [{
    key: "toString",
    value: function toString(...args) {
      return new this().toString(...args);
    }
  }]);

  return ABSTRACT;
}();

let INITIALLY_DEFERRED = /*#__PURE__*/function (_ABSTRACT) {
  _inherits(INITIALLY_DEFERRED, _ABSTRACT);

  var _super = _createSuper(INITIALLY_DEFERRED);

  function INITIALLY_DEFERRED() {
    _classCallCheck(this, INITIALLY_DEFERRED);

    return _super.apply(this, arguments);
  }

  _createClass(INITIALLY_DEFERRED, [{
    key: "toSql",
    value: function toSql() {
      return 'DEFERRABLE INITIALLY DEFERRED';
    }
  }]);

  return INITIALLY_DEFERRED;
}(ABSTRACT);

let INITIALLY_IMMEDIATE = /*#__PURE__*/function (_ABSTRACT2) {
  _inherits(INITIALLY_IMMEDIATE, _ABSTRACT2);

  var _super2 = _createSuper(INITIALLY_IMMEDIATE);

  function INITIALLY_IMMEDIATE() {
    _classCallCheck(this, INITIALLY_IMMEDIATE);

    return _super2.apply(this, arguments);
  }

  _createClass(INITIALLY_IMMEDIATE, [{
    key: "toSql",
    value: function toSql() {
      return 'DEFERRABLE INITIALLY IMMEDIATE';
    }
  }]);

  return INITIALLY_IMMEDIATE;
}(ABSTRACT);

let NOT = /*#__PURE__*/function (_ABSTRACT3) {
  _inherits(NOT, _ABSTRACT3);

  var _super3 = _createSuper(NOT);

  function NOT() {
    _classCallCheck(this, NOT);

    return _super3.apply(this, arguments);
  }

  _createClass(NOT, [{
    key: "toSql",
    value: function toSql() {
      return 'NOT DEFERRABLE';
    }
  }]);

  return NOT;
}(ABSTRACT);

let SET_DEFERRED = /*#__PURE__*/function (_ABSTRACT4) {
  _inherits(SET_DEFERRED, _ABSTRACT4);

  var _super4 = _createSuper(SET_DEFERRED);

  function SET_DEFERRED(constraints) {
    var _this;

    _classCallCheck(this, SET_DEFERRED);

    _this = _super4.call(this);
    _this.constraints = constraints;
    return _this;
  }

  _createClass(SET_DEFERRED, [{
    key: "toSql",
    value: function toSql(queryGenerator) {
      return queryGenerator.setDeferredQuery(this.constraints);
    }
  }]);

  return SET_DEFERRED;
}(ABSTRACT);

let SET_IMMEDIATE = /*#__PURE__*/function (_ABSTRACT5) {
  _inherits(SET_IMMEDIATE, _ABSTRACT5);

  var _super5 = _createSuper(SET_IMMEDIATE);

  function SET_IMMEDIATE(constraints) {
    var _this2;

    _classCallCheck(this, SET_IMMEDIATE);

    _this2 = _super5.call(this);
    _this2.constraints = constraints;
    return _this2;
  }

  _createClass(SET_IMMEDIATE, [{
    key: "toSql",
    value: function toSql(queryGenerator) {
      return queryGenerator.setImmediateQuery(this.constraints);
    }
  }]);

  return SET_IMMEDIATE;
}(ABSTRACT);
/**
 * A collection of properties related to deferrable constraints. It can be used to
 * make foreign key constraints deferrable and to set the constraints within a
 * transaction. This is only supported in PostgreSQL.
 *
 * The foreign keys can be configured like this. It will create a foreign key
 * that will check the constraints immediately when the data was inserted.
 *
 * ```js
 * sequelize.define('Model', {
 *   foreign_id: {
 *     type: Sequelize.INTEGER,
 *     references: {
 *       model: OtherModel,
 *       key: 'id',
 *       deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
 *     }
 *   }
 * });
 * ```
 *
 * The constraints can be configured in a transaction like this. It will
 * trigger a query once the transaction has been started and set the constraints
 * to be checked at the very end of the transaction.
 *
 * ```js
 * sequelize.transaction({
 *   deferrable: Sequelize.Deferrable.SET_DEFERRED
 * });
 * ```
 *
 * @property INITIALLY_DEFERRED Defer constraints checks to the end of transactions.
 * @property INITIALLY_IMMEDIATE Trigger the constraint checks immediately
 * @property NOT Set the constraints to not deferred. This is the default in PostgreSQL and it make it impossible to dynamically defer the constraints within a transaction.
 * @property SET_DEFERRED
 * @property SET_IMMEDIATE
 */


const Deferrable = module.exports = {
  // eslint-disable-line
  INITIALLY_DEFERRED: classToInvokable(INITIALLY_DEFERRED),
  INITIALLY_IMMEDIATE: classToInvokable(INITIALLY_IMMEDIATE),
  NOT: classToInvokable(NOT),
  SET_DEFERRED: classToInvokable(SET_DEFERRED),
  SET_IMMEDIATE: classToInvokable(SET_IMMEDIATE)
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9kZWZlcnJhYmxlLmpzIl0sIm5hbWVzIjpbImNsYXNzVG9JbnZva2FibGUiLCJyZXF1aXJlIiwiQUJTVFJBQ1QiLCJhcmdzIiwidG9TcWwiLCJFcnJvciIsInRvU3RyaW5nIiwiSU5JVElBTExZX0RFRkVSUkVEIiwiSU5JVElBTExZX0lNTUVESUFURSIsIk5PVCIsIlNFVF9ERUZFUlJFRCIsImNvbnN0cmFpbnRzIiwicXVlcnlHZW5lcmF0b3IiLCJzZXREZWZlcnJlZFF1ZXJ5IiwiU0VUX0lNTUVESUFURSIsInNldEltbWVkaWF0ZVF1ZXJ5IiwiRGVmZXJyYWJsZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTTtBQUFFQSxFQUFBQTtBQUFGLElBQXVCQyxPQUFPLENBQUMsU0FBRCxDQUFwQzs7SUFFTUMsUTs7Ozs7Ozs2QkFLSyxHQUFHQyxJLEVBQU07QUFDaEIsYUFBTyxLQUFLQyxLQUFMLENBQVcsR0FBR0QsSUFBZCxDQUFQO0FBQ0Q7Ozs0QkFFTztBQUNOLFlBQU0sSUFBSUUsS0FBSixDQUFVLDhCQUFWLENBQU47QUFDRDs7OzZCQVZlLEdBQUdGLEksRUFBTTtBQUN2QixhQUFPLElBQUksSUFBSixHQUFXRyxRQUFYLENBQW9CLEdBQUdILElBQXZCLENBQVA7QUFDRDs7Ozs7O0lBV0dJLGtCOzs7Ozs7Ozs7Ozs7OzRCQUNJO0FBQ04sYUFBTywrQkFBUDtBQUNEOzs7O0VBSDhCTCxROztJQU0zQk0sbUI7Ozs7Ozs7Ozs7Ozs7NEJBQ0k7QUFDTixhQUFPLGdDQUFQO0FBQ0Q7Ozs7RUFIK0JOLFE7O0lBTTVCTyxHOzs7Ozs7Ozs7Ozs7OzRCQUNJO0FBQ04sYUFBTyxnQkFBUDtBQUNEOzs7O0VBSGVQLFE7O0lBTVpRLFk7Ozs7O0FBQ0osd0JBQVlDLFdBQVosRUFBeUI7QUFBQTs7QUFBQTs7QUFDdkI7QUFDQSxVQUFLQSxXQUFMLEdBQW1CQSxXQUFuQjtBQUZ1QjtBQUd4Qjs7OzswQkFFS0MsYyxFQUFnQjtBQUNwQixhQUFPQSxjQUFjLENBQUNDLGdCQUFmLENBQWdDLEtBQUtGLFdBQXJDLENBQVA7QUFDRDs7OztFQVJ3QlQsUTs7SUFXckJZLGE7Ozs7O0FBQ0oseUJBQVlILFdBQVosRUFBeUI7QUFBQTs7QUFBQTs7QUFDdkI7QUFDQSxXQUFLQSxXQUFMLEdBQW1CQSxXQUFuQjtBQUZ1QjtBQUd4Qjs7OzswQkFFS0MsYyxFQUFnQjtBQUNwQixhQUFPQSxjQUFjLENBQUNHLGlCQUFmLENBQWlDLEtBQUtKLFdBQXRDLENBQVA7QUFDRDs7OztFQVJ5QlQsUTtBQVc1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBRUEsTUFBTWMsVUFBVSxHQUFHQyxNQUFNLENBQUNDLE9BQVAsR0FBaUI7QUFBRTtBQUNwQ1gsRUFBQUEsa0JBQWtCLEVBQUVQLGdCQUFnQixDQUFDTyxrQkFBRCxDQURGO0FBRWxDQyxFQUFBQSxtQkFBbUIsRUFBRVIsZ0JBQWdCLENBQUNRLG1CQUFELENBRkg7QUFHbENDLEVBQUFBLEdBQUcsRUFBRVQsZ0JBQWdCLENBQUNTLEdBQUQsQ0FIYTtBQUlsQ0MsRUFBQUEsWUFBWSxFQUFFVixnQkFBZ0IsQ0FBQ1UsWUFBRCxDQUpJO0FBS2xDSSxFQUFBQSxhQUFhLEVBQUVkLGdCQUFnQixDQUFDYyxhQUFEO0FBTEcsQ0FBcEMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHsgY2xhc3NUb0ludm9rYWJsZSB9ID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG5jbGFzcyBBQlNUUkFDVCB7XG4gIHN0YXRpYyB0b1N0cmluZyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKCkudG9TdHJpbmcoLi4uYXJncyk7XG4gIH1cblxuICB0b1N0cmluZyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMudG9TcWwoLi4uYXJncyk7XG4gIH1cblxuICB0b1NxbCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3RvU3FsIGltcGxlbWVudGF0aW9uIG1pc3NpbmcnKTtcbiAgfVxufVxuXG5jbGFzcyBJTklUSUFMTFlfREVGRVJSRUQgZXh0ZW5kcyBBQlNUUkFDVCB7XG4gIHRvU3FsKCkge1xuICAgIHJldHVybiAnREVGRVJSQUJMRSBJTklUSUFMTFkgREVGRVJSRUQnO1xuICB9XG59XG5cbmNsYXNzIElOSVRJQUxMWV9JTU1FRElBVEUgZXh0ZW5kcyBBQlNUUkFDVCB7XG4gIHRvU3FsKCkge1xuICAgIHJldHVybiAnREVGRVJSQUJMRSBJTklUSUFMTFkgSU1NRURJQVRFJztcbiAgfVxufVxuXG5jbGFzcyBOT1QgZXh0ZW5kcyBBQlNUUkFDVCB7XG4gIHRvU3FsKCkge1xuICAgIHJldHVybiAnTk9UIERFRkVSUkFCTEUnO1xuICB9XG59XG5cbmNsYXNzIFNFVF9ERUZFUlJFRCBleHRlbmRzIEFCU1RSQUNUIHtcbiAgY29uc3RydWN0b3IoY29uc3RyYWludHMpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29uc3RyYWludHMgPSBjb25zdHJhaW50cztcbiAgfVxuXG4gIHRvU3FsKHF1ZXJ5R2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIHF1ZXJ5R2VuZXJhdG9yLnNldERlZmVycmVkUXVlcnkodGhpcy5jb25zdHJhaW50cyk7XG4gIH1cbn1cblxuY2xhc3MgU0VUX0lNTUVESUFURSBleHRlbmRzIEFCU1RSQUNUIHtcbiAgY29uc3RydWN0b3IoY29uc3RyYWludHMpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29uc3RyYWludHMgPSBjb25zdHJhaW50cztcbiAgfVxuXG4gIHRvU3FsKHF1ZXJ5R2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIHF1ZXJ5R2VuZXJhdG9yLnNldEltbWVkaWF0ZVF1ZXJ5KHRoaXMuY29uc3RyYWludHMpO1xuICB9XG59XG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIG9mIHByb3BlcnRpZXMgcmVsYXRlZCB0byBkZWZlcnJhYmxlIGNvbnN0cmFpbnRzLiBJdCBjYW4gYmUgdXNlZCB0b1xuICogbWFrZSBmb3JlaWduIGtleSBjb25zdHJhaW50cyBkZWZlcnJhYmxlIGFuZCB0byBzZXQgdGhlIGNvbnN0cmFpbnRzIHdpdGhpbiBhXG4gKiB0cmFuc2FjdGlvbi4gVGhpcyBpcyBvbmx5IHN1cHBvcnRlZCBpbiBQb3N0Z3JlU1FMLlxuICpcbiAqIFRoZSBmb3JlaWduIGtleXMgY2FuIGJlIGNvbmZpZ3VyZWQgbGlrZSB0aGlzLiBJdCB3aWxsIGNyZWF0ZSBhIGZvcmVpZ24ga2V5XG4gKiB0aGF0IHdpbGwgY2hlY2sgdGhlIGNvbnN0cmFpbnRzIGltbWVkaWF0ZWx5IHdoZW4gdGhlIGRhdGEgd2FzIGluc2VydGVkLlxuICpcbiAqIGBgYGpzXG4gKiBzZXF1ZWxpemUuZGVmaW5lKCdNb2RlbCcsIHtcbiAqICAgZm9yZWlnbl9pZDoge1xuICogICAgIHR5cGU6IFNlcXVlbGl6ZS5JTlRFR0VSLFxuICogICAgIHJlZmVyZW5jZXM6IHtcbiAqICAgICAgIG1vZGVsOiBPdGhlck1vZGVsLFxuICogICAgICAga2V5OiAnaWQnLFxuICogICAgICAgZGVmZXJyYWJsZTogU2VxdWVsaXplLkRlZmVycmFibGUuSU5JVElBTExZX0lNTUVESUFURVxuICogICAgIH1cbiAqICAgfVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgY29uc3RyYWludHMgY2FuIGJlIGNvbmZpZ3VyZWQgaW4gYSB0cmFuc2FjdGlvbiBsaWtlIHRoaXMuIEl0IHdpbGxcbiAqIHRyaWdnZXIgYSBxdWVyeSBvbmNlIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBzdGFydGVkIGFuZCBzZXQgdGhlIGNvbnN0cmFpbnRzXG4gKiB0byBiZSBjaGVja2VkIGF0IHRoZSB2ZXJ5IGVuZCBvZiB0aGUgdHJhbnNhY3Rpb24uXG4gKlxuICogYGBganNcbiAqIHNlcXVlbGl6ZS50cmFuc2FjdGlvbih7XG4gKiAgIGRlZmVycmFibGU6IFNlcXVlbGl6ZS5EZWZlcnJhYmxlLlNFVF9ERUZFUlJFRFxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBAcHJvcGVydHkgSU5JVElBTExZX0RFRkVSUkVEIERlZmVyIGNvbnN0cmFpbnRzIGNoZWNrcyB0byB0aGUgZW5kIG9mIHRyYW5zYWN0aW9ucy5cbiAqIEBwcm9wZXJ0eSBJTklUSUFMTFlfSU1NRURJQVRFIFRyaWdnZXIgdGhlIGNvbnN0cmFpbnQgY2hlY2tzIGltbWVkaWF0ZWx5XG4gKiBAcHJvcGVydHkgTk9UIFNldCB0aGUgY29uc3RyYWludHMgdG8gbm90IGRlZmVycmVkLiBUaGlzIGlzIHRoZSBkZWZhdWx0IGluIFBvc3RncmVTUUwgYW5kIGl0IG1ha2UgaXQgaW1wb3NzaWJsZSB0byBkeW5hbWljYWxseSBkZWZlciB0aGUgY29uc3RyYWludHMgd2l0aGluIGEgdHJhbnNhY3Rpb24uXG4gKiBAcHJvcGVydHkgU0VUX0RFRkVSUkVEXG4gKiBAcHJvcGVydHkgU0VUX0lNTUVESUFURVxuICovXG5cbmNvbnN0IERlZmVycmFibGUgPSBtb2R1bGUuZXhwb3J0cyA9IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICBJTklUSUFMTFlfREVGRVJSRUQ6IGNsYXNzVG9JbnZva2FibGUoSU5JVElBTExZX0RFRkVSUkVEKSxcbiAgSU5JVElBTExZX0lNTUVESUFURTogY2xhc3NUb0ludm9rYWJsZShJTklUSUFMTFlfSU1NRURJQVRFKSxcbiAgTk9UOiBjbGFzc1RvSW52b2thYmxlKE5PVCksXG4gIFNFVF9ERUZFUlJFRDogY2xhc3NUb0ludm9rYWJsZShTRVRfREVGRVJSRUQpLFxuICBTRVRfSU1NRURJQVRFOiBjbGFzc1RvSW52b2thYmxlKFNFVF9JTU1FRElBVEUpXG59O1xuIl19