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