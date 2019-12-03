'use strict';

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const {
  classToInvokable
} = require('./utils');

let ABSTRACT =
/*#__PURE__*/
function () {
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

let INITIALLY_DEFERRED =
/*#__PURE__*/
function (_ABSTRACT) {
  _inherits(INITIALLY_DEFERRED, _ABSTRACT);

  function INITIALLY_DEFERRED() {
    _classCallCheck(this, INITIALLY_DEFERRED);

    return _possibleConstructorReturn(this, _getPrototypeOf(INITIALLY_DEFERRED).apply(this, arguments));
  }

  _createClass(INITIALLY_DEFERRED, [{
    key: "toSql",
    value: function toSql() {
      return 'DEFERRABLE INITIALLY DEFERRED';
    }
  }]);

  return INITIALLY_DEFERRED;
}(ABSTRACT);

let INITIALLY_IMMEDIATE =
/*#__PURE__*/
function (_ABSTRACT2) {
  _inherits(INITIALLY_IMMEDIATE, _ABSTRACT2);

  function INITIALLY_IMMEDIATE() {
    _classCallCheck(this, INITIALLY_IMMEDIATE);

    return _possibleConstructorReturn(this, _getPrototypeOf(INITIALLY_IMMEDIATE).apply(this, arguments));
  }

  _createClass(INITIALLY_IMMEDIATE, [{
    key: "toSql",
    value: function toSql() {
      return 'DEFERRABLE INITIALLY IMMEDIATE';
    }
  }]);

  return INITIALLY_IMMEDIATE;
}(ABSTRACT);

let NOT =
/*#__PURE__*/
function (_ABSTRACT3) {
  _inherits(NOT, _ABSTRACT3);

  function NOT() {
    _classCallCheck(this, NOT);

    return _possibleConstructorReturn(this, _getPrototypeOf(NOT).apply(this, arguments));
  }

  _createClass(NOT, [{
    key: "toSql",
    value: function toSql() {
      return 'NOT DEFERRABLE';
    }
  }]);

  return NOT;
}(ABSTRACT);

let SET_DEFERRED =
/*#__PURE__*/
function (_ABSTRACT4) {
  _inherits(SET_DEFERRED, _ABSTRACT4);

  function SET_DEFERRED(constraints) {
    var _this;

    _classCallCheck(this, SET_DEFERRED);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SET_DEFERRED).call(this));
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

let SET_IMMEDIATE =
/*#__PURE__*/
function (_ABSTRACT5) {
  _inherits(SET_IMMEDIATE, _ABSTRACT5);

  function SET_IMMEDIATE(constraints) {
    var _this2;

    _classCallCheck(this, SET_IMMEDIATE);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(SET_IMMEDIATE).call(this));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9kZWZlcnJhYmxlLmpzIl0sIm5hbWVzIjpbImNsYXNzVG9JbnZva2FibGUiLCJyZXF1aXJlIiwiQUJTVFJBQ1QiLCJhcmdzIiwidG9TcWwiLCJFcnJvciIsInRvU3RyaW5nIiwiSU5JVElBTExZX0RFRkVSUkVEIiwiSU5JVElBTExZX0lNTUVESUFURSIsIk5PVCIsIlNFVF9ERUZFUlJFRCIsImNvbnN0cmFpbnRzIiwicXVlcnlHZW5lcmF0b3IiLCJzZXREZWZlcnJlZFF1ZXJ5IiwiU0VUX0lNTUVESUFURSIsInNldEltbWVkaWF0ZVF1ZXJ5IiwiRGVmZXJyYWJsZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNO0FBQUVBLEVBQUFBO0FBQUYsSUFBdUJDLE9BQU8sQ0FBQyxTQUFELENBQXBDOztJQUVNQyxROzs7Ozs7Ozs7NkJBS0ssR0FBR0MsSSxFQUFNO0FBQ2hCLGFBQU8sS0FBS0MsS0FBTCxDQUFXLEdBQUdELElBQWQsQ0FBUDtBQUNEOzs7NEJBRU87QUFDTixZQUFNLElBQUlFLEtBQUosQ0FBVSw4QkFBVixDQUFOO0FBQ0Q7Ozs2QkFWZSxHQUFHRixJLEVBQU07QUFDdkIsYUFBTyxJQUFJLElBQUosR0FBV0csUUFBWCxDQUFvQixHQUFHSCxJQUF2QixDQUFQO0FBQ0Q7Ozs7OztJQVdHSSxrQjs7Ozs7Ozs7Ozs7Ozs0QkFDSTtBQUNOLGFBQU8sK0JBQVA7QUFDRDs7OztFQUg4QkwsUTs7SUFNM0JNLG1COzs7Ozs7Ozs7Ozs7OzRCQUNJO0FBQ04sYUFBTyxnQ0FBUDtBQUNEOzs7O0VBSCtCTixROztJQU01Qk8sRzs7Ozs7Ozs7Ozs7Ozs0QkFDSTtBQUNOLGFBQU8sZ0JBQVA7QUFDRDs7OztFQUhlUCxROztJQU1aUSxZOzs7OztBQUNKLHdCQUFZQyxXQUFaLEVBQXlCO0FBQUE7O0FBQUE7O0FBQ3ZCO0FBQ0EsVUFBS0EsV0FBTCxHQUFtQkEsV0FBbkI7QUFGdUI7QUFHeEI7Ozs7MEJBRUtDLGMsRUFBZ0I7QUFDcEIsYUFBT0EsY0FBYyxDQUFDQyxnQkFBZixDQUFnQyxLQUFLRixXQUFyQyxDQUFQO0FBQ0Q7Ozs7RUFSd0JULFE7O0lBV3JCWSxhOzs7OztBQUNKLHlCQUFZSCxXQUFaLEVBQXlCO0FBQUE7O0FBQUE7O0FBQ3ZCO0FBQ0EsV0FBS0EsV0FBTCxHQUFtQkEsV0FBbkI7QUFGdUI7QUFHeEI7Ozs7MEJBRUtDLGMsRUFBZ0I7QUFDcEIsYUFBT0EsY0FBYyxDQUFDRyxpQkFBZixDQUFpQyxLQUFLSixXQUF0QyxDQUFQO0FBQ0Q7Ozs7RUFSeUJULFE7QUFXNUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNDQSxNQUFNYyxVQUFVLEdBQUdDLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUFFO0FBQ3BDWCxFQUFBQSxrQkFBa0IsRUFBRVAsZ0JBQWdCLENBQUNPLGtCQUFELENBREY7QUFFbENDLEVBQUFBLG1CQUFtQixFQUFFUixnQkFBZ0IsQ0FBQ1EsbUJBQUQsQ0FGSDtBQUdsQ0MsRUFBQUEsR0FBRyxFQUFFVCxnQkFBZ0IsQ0FBQ1MsR0FBRCxDQUhhO0FBSWxDQyxFQUFBQSxZQUFZLEVBQUVWLGdCQUFnQixDQUFDVSxZQUFELENBSkk7QUFLbENJLEVBQUFBLGFBQWEsRUFBRWQsZ0JBQWdCLENBQUNjLGFBQUQ7QUFMRyxDQUFwQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IHsgY2xhc3NUb0ludm9rYWJsZSB9ID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG5cclxuY2xhc3MgQUJTVFJBQ1Qge1xyXG4gIHN0YXRpYyB0b1N0cmluZyguLi5hcmdzKSB7XHJcbiAgICByZXR1cm4gbmV3IHRoaXMoKS50b1N0cmluZyguLi5hcmdzKTtcclxuICB9XHJcblxyXG4gIHRvU3RyaW5nKC4uLmFyZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLnRvU3FsKC4uLmFyZ3MpO1xyXG4gIH1cclxuXHJcbiAgdG9TcWwoKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3RvU3FsIGltcGxlbWVudGF0aW9uIG1pc3NpbmcnKTtcclxuICB9XHJcbn1cclxuXHJcbmNsYXNzIElOSVRJQUxMWV9ERUZFUlJFRCBleHRlbmRzIEFCU1RSQUNUIHtcclxuICB0b1NxbCgpIHtcclxuICAgIHJldHVybiAnREVGRVJSQUJMRSBJTklUSUFMTFkgREVGRVJSRUQnO1xyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgSU5JVElBTExZX0lNTUVESUFURSBleHRlbmRzIEFCU1RSQUNUIHtcclxuICB0b1NxbCgpIHtcclxuICAgIHJldHVybiAnREVGRVJSQUJMRSBJTklUSUFMTFkgSU1NRURJQVRFJztcclxuICB9XHJcbn1cclxuXHJcbmNsYXNzIE5PVCBleHRlbmRzIEFCU1RSQUNUIHtcclxuICB0b1NxbCgpIHtcclxuICAgIHJldHVybiAnTk9UIERFRkVSUkFCTEUnO1xyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgU0VUX0RFRkVSUkVEIGV4dGVuZHMgQUJTVFJBQ1Qge1xyXG4gIGNvbnN0cnVjdG9yKGNvbnN0cmFpbnRzKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgdGhpcy5jb25zdHJhaW50cyA9IGNvbnN0cmFpbnRzO1xyXG4gIH1cclxuXHJcbiAgdG9TcWwocXVlcnlHZW5lcmF0b3IpIHtcclxuICAgIHJldHVybiBxdWVyeUdlbmVyYXRvci5zZXREZWZlcnJlZFF1ZXJ5KHRoaXMuY29uc3RyYWludHMpO1xyXG4gIH1cclxufVxyXG5cclxuY2xhc3MgU0VUX0lNTUVESUFURSBleHRlbmRzIEFCU1RSQUNUIHtcclxuICBjb25zdHJ1Y3Rvcihjb25zdHJhaW50cykge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMuY29uc3RyYWludHMgPSBjb25zdHJhaW50cztcclxuICB9XHJcblxyXG4gIHRvU3FsKHF1ZXJ5R2VuZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gcXVlcnlHZW5lcmF0b3Iuc2V0SW1tZWRpYXRlUXVlcnkodGhpcy5jb25zdHJhaW50cyk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogQSBjb2xsZWN0aW9uIG9mIHByb3BlcnRpZXMgcmVsYXRlZCB0byBkZWZlcnJhYmxlIGNvbnN0cmFpbnRzLiBJdCBjYW4gYmUgdXNlZCB0b1xyXG4gKiBtYWtlIGZvcmVpZ24ga2V5IGNvbnN0cmFpbnRzIGRlZmVycmFibGUgYW5kIHRvIHNldCB0aGUgY29uc3RyYWludHMgd2l0aGluIGFcclxuICogdHJhbnNhY3Rpb24uIFRoaXMgaXMgb25seSBzdXBwb3J0ZWQgaW4gUG9zdGdyZVNRTC5cclxuICpcclxuICogVGhlIGZvcmVpZ24ga2V5cyBjYW4gYmUgY29uZmlndXJlZCBsaWtlIHRoaXMuIEl0IHdpbGwgY3JlYXRlIGEgZm9yZWlnbiBrZXlcclxuICogdGhhdCB3aWxsIGNoZWNrIHRoZSBjb25zdHJhaW50cyBpbW1lZGlhdGVseSB3aGVuIHRoZSBkYXRhIHdhcyBpbnNlcnRlZC5cclxuICpcclxuICogYGBganNcclxuICogc2VxdWVsaXplLmRlZmluZSgnTW9kZWwnLCB7XHJcbiAqICAgZm9yZWlnbl9pZDoge1xyXG4gKiAgICAgdHlwZTogU2VxdWVsaXplLklOVEVHRVIsXHJcbiAqICAgICByZWZlcmVuY2VzOiB7XHJcbiAqICAgICAgIG1vZGVsOiBPdGhlck1vZGVsLFxyXG4gKiAgICAgICBrZXk6ICdpZCcsXHJcbiAqICAgICAgIGRlZmVycmFibGU6IFNlcXVlbGl6ZS5EZWZlcnJhYmxlLklOSVRJQUxMWV9JTU1FRElBVEVcclxuICogICAgIH1cclxuICogICB9XHJcbiAqIH0pO1xyXG4gKiBgYGBcclxuICpcclxuICogVGhlIGNvbnN0cmFpbnRzIGNhbiBiZSBjb25maWd1cmVkIGluIGEgdHJhbnNhY3Rpb24gbGlrZSB0aGlzLiBJdCB3aWxsXHJcbiAqIHRyaWdnZXIgYSBxdWVyeSBvbmNlIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBzdGFydGVkIGFuZCBzZXQgdGhlIGNvbnN0cmFpbnRzXHJcbiAqIHRvIGJlIGNoZWNrZWQgYXQgdGhlIHZlcnkgZW5kIG9mIHRoZSB0cmFuc2FjdGlvbi5cclxuICpcclxuICogYGBganNcclxuICogc2VxdWVsaXplLnRyYW5zYWN0aW9uKHtcclxuICogICBkZWZlcnJhYmxlOiBTZXF1ZWxpemUuRGVmZXJyYWJsZS5TRVRfREVGRVJSRURcclxuICogfSk7XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAcHJvcGVydHkgSU5JVElBTExZX0RFRkVSUkVEIERlZmVyIGNvbnN0cmFpbnRzIGNoZWNrcyB0byB0aGUgZW5kIG9mIHRyYW5zYWN0aW9ucy5cclxuICogQHByb3BlcnR5IElOSVRJQUxMWV9JTU1FRElBVEUgVHJpZ2dlciB0aGUgY29uc3RyYWludCBjaGVja3MgaW1tZWRpYXRlbHlcclxuICogQHByb3BlcnR5IE5PVCBTZXQgdGhlIGNvbnN0cmFpbnRzIHRvIG5vdCBkZWZlcnJlZC4gVGhpcyBpcyB0aGUgZGVmYXVsdCBpbiBQb3N0Z3JlU1FMIGFuZCBpdCBtYWtlIGl0IGltcG9zc2libGUgdG8gZHluYW1pY2FsbHkgZGVmZXIgdGhlIGNvbnN0cmFpbnRzIHdpdGhpbiBhIHRyYW5zYWN0aW9uLlxyXG4gKiBAcHJvcGVydHkgU0VUX0RFRkVSUkVEXHJcbiAqIEBwcm9wZXJ0eSBTRVRfSU1NRURJQVRFXHJcbiAqL1xyXG5cclxuY29uc3QgRGVmZXJyYWJsZSA9IG1vZHVsZS5leHBvcnRzID0geyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXHJcbiAgSU5JVElBTExZX0RFRkVSUkVEOiBjbGFzc1RvSW52b2thYmxlKElOSVRJQUxMWV9ERUZFUlJFRCksXHJcbiAgSU5JVElBTExZX0lNTUVESUFURTogY2xhc3NUb0ludm9rYWJsZShJTklUSUFMTFlfSU1NRURJQVRFKSxcclxuICBOT1Q6IGNsYXNzVG9JbnZva2FibGUoTk9UKSxcclxuICBTRVRfREVGRVJSRUQ6IGNsYXNzVG9JbnZva2FibGUoU0VUX0RFRkVSUkVEKSxcclxuICBTRVRfSU1NRURJQVRFOiBjbGFzc1RvSW52b2thYmxlKFNFVF9JTU1FRElBVEUpXHJcbn07XHJcbiJdfQ==