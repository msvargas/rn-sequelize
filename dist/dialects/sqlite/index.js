'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

const _ = require('lodash');

const AbstractDialect = require('../abstract');

const ConnectionManager = require('./connection-manager');

const Query = require('./query');

const QueryGenerator = require('./query-generator');

const DataTypes = require('../../data-types').sqlite;

let SqliteDialect =
/*#__PURE__*/
function (_AbstractDialect) {
  _inherits(SqliteDialect, _AbstractDialect);

  function SqliteDialect(sequelize) {
    var _this;

    _classCallCheck(this, SqliteDialect);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SqliteDialect).call(this));
    _this.sequelize = sequelize;
    _this.connectionManager = new ConnectionManager(_assertThisInitialized(_this), sequelize);
    _this.QueryGenerator = new QueryGenerator({
      _dialect: _assertThisInitialized(_this),
      sequelize
    });
    return _this;
  }

  return SqliteDialect;
}(AbstractDialect);

SqliteDialect.prototype.supports = _.merge(_.cloneDeep(AbstractDialect.prototype.supports), {
  'DEFAULT': false,
  'DEFAULT VALUES': true,
  'UNION ALL': false,
  'RIGHT JOIN': false,
  inserts: {
    ignoreDuplicates: ' OR IGNORE',
    updateOnDuplicate: ' ON CONFLICT DO UPDATE SET'
  },
  index: {
    using: false,
    where: true,
    functionBased: true
  },
  transactionOptions: {
    type: true
  },
  constraints: {
    addConstraint: false,
    dropConstraint: false
  },
  joinTableDependent: false,
  groupedLimit: false,
  JSON: true
});
ConnectionManager.prototype.defaultVersion = '3.8.0';
SqliteDialect.prototype.Query = Query;
SqliteDialect.prototype.DataTypes = DataTypes;
SqliteDialect.prototype.name = 'sqlite';
SqliteDialect.prototype.TICK_CHAR = '`';
SqliteDialect.prototype.TICK_CHAR_LEFT = SqliteDialect.prototype.TICK_CHAR;
SqliteDialect.prototype.TICK_CHAR_RIGHT = SqliteDialect.prototype.TICK_CHAR;
module.exports = SqliteDialect;
module.exports.SqliteDialect = SqliteDialect;
module.exports.default = SqliteDialect;