'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (typeof call === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

const _ = require('lodash');

const AbstractDialect = require('../abstract');

const ConnectionManager = require('./connection-manager');

const Query = require('./query');

const QueryGenerator = require('./query-generator');

const DataTypes = require('../../data-types').sqlite;

let SqliteDialect = /*#__PURE__*/function (_AbstractDialect) {
  _inherits(SqliteDialect, _AbstractDialect);

  var _super = _createSuper(SqliteDialect);

  function SqliteDialect(sequelize) {
    var _this;

    _classCallCheck(this, SqliteDialect);

    _this = _super.call(this);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9kaWFsZWN0cy9zcWxpdGUvaW5kZXguanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJBYnN0cmFjdERpYWxlY3QiLCJDb25uZWN0aW9uTWFuYWdlciIsIlF1ZXJ5IiwiUXVlcnlHZW5lcmF0b3IiLCJEYXRhVHlwZXMiLCJzcWxpdGUiLCJTcWxpdGVEaWFsZWN0Iiwic2VxdWVsaXplIiwiY29ubmVjdGlvbk1hbmFnZXIiLCJfZGlhbGVjdCIsInByb3RvdHlwZSIsInN1cHBvcnRzIiwibWVyZ2UiLCJjbG9uZURlZXAiLCJpbnNlcnRzIiwiaWdub3JlRHVwbGljYXRlcyIsInVwZGF0ZU9uRHVwbGljYXRlIiwiaW5kZXgiLCJ1c2luZyIsIndoZXJlIiwiZnVuY3Rpb25CYXNlZCIsInRyYW5zYWN0aW9uT3B0aW9ucyIsInR5cGUiLCJjb25zdHJhaW50cyIsImFkZENvbnN0cmFpbnQiLCJkcm9wQ29uc3RyYWludCIsImpvaW5UYWJsZURlcGVuZGVudCIsImdyb3VwZWRMaW1pdCIsIkpTT04iLCJkZWZhdWx0VmVyc2lvbiIsIm5hbWUiLCJUSUNLX0NIQVIiLCJUSUNLX0NIQVJfTEVGVCIsIlRJQ0tfQ0hBUl9SSUdIVCIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsTUFBTUEsQ0FBQyxHQUFHQyxPQUFPLENBQUMsUUFBRCxDQUFqQjs7QUFDQSxNQUFNQyxlQUFlLEdBQUdELE9BQU8sQ0FBQyxhQUFELENBQS9COztBQUNBLE1BQU1FLGlCQUFpQixHQUFHRixPQUFPLENBQUMsc0JBQUQsQ0FBakM7O0FBQ0EsTUFBTUcsS0FBSyxHQUFHSCxPQUFPLENBQUMsU0FBRCxDQUFyQjs7QUFDQSxNQUFNSSxjQUFjLEdBQUdKLE9BQU8sQ0FBQyxtQkFBRCxDQUE5Qjs7QUFDQSxNQUFNSyxTQUFTLEdBQUdMLE9BQU8sQ0FBQyxrQkFBRCxDQUFQLENBQTRCTSxNQUE5Qzs7SUFFTUMsYTs7Ozs7QUFDSix5QkFBWUMsU0FBWixFQUF1QjtBQUFBOztBQUFBOztBQUNyQjtBQUNBLFVBQUtBLFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0EsVUFBS0MsaUJBQUwsR0FBeUIsSUFBSVAsaUJBQUosZ0NBQTRCTSxTQUE1QixDQUF6QjtBQUNBLFVBQUtKLGNBQUwsR0FBc0IsSUFBSUEsY0FBSixDQUFtQjtBQUN2Q00sTUFBQUEsUUFBUSwrQkFEK0I7QUFFdkNGLE1BQUFBO0FBRnVDLEtBQW5CLENBQXRCO0FBSnFCO0FBUXRCOzs7RUFUeUJQLGU7O0FBWTVCTSxhQUFhLENBQUNJLFNBQWQsQ0FBd0JDLFFBQXhCLEdBQW1DYixDQUFDLENBQUNjLEtBQUYsQ0FBUWQsQ0FBQyxDQUFDZSxTQUFGLENBQVliLGVBQWUsQ0FBQ1UsU0FBaEIsQ0FBMEJDLFFBQXRDLENBQVIsRUFBeUQ7QUFDMUYsYUFBVyxLQUQrRTtBQUUxRixvQkFBa0IsSUFGd0U7QUFHMUYsZUFBYSxLQUg2RTtBQUkxRixnQkFBYyxLQUo0RTtBQUsxRkcsRUFBQUEsT0FBTyxFQUFFO0FBQ1BDLElBQUFBLGdCQUFnQixFQUFFLFlBRFg7QUFFUEMsSUFBQUEsaUJBQWlCLEVBQUU7QUFGWixHQUxpRjtBQVMxRkMsRUFBQUEsS0FBSyxFQUFFO0FBQ0xDLElBQUFBLEtBQUssRUFBRSxLQURGO0FBRUxDLElBQUFBLEtBQUssRUFBRSxJQUZGO0FBR0xDLElBQUFBLGFBQWEsRUFBRTtBQUhWLEdBVG1GO0FBYzFGQyxFQUFBQSxrQkFBa0IsRUFBRTtBQUNsQkMsSUFBQUEsSUFBSSxFQUFFO0FBRFksR0Fkc0U7QUFpQjFGQyxFQUFBQSxXQUFXLEVBQUU7QUFDWEMsSUFBQUEsYUFBYSxFQUFFLEtBREo7QUFFWEMsSUFBQUEsY0FBYyxFQUFFO0FBRkwsR0FqQjZFO0FBcUIxRkMsRUFBQUEsa0JBQWtCLEVBQUUsS0FyQnNFO0FBc0IxRkMsRUFBQUEsWUFBWSxFQUFFLEtBdEI0RTtBQXVCMUZDLEVBQUFBLElBQUksRUFBRTtBQXZCb0YsQ0FBekQsQ0FBbkM7QUEwQkEzQixpQkFBaUIsQ0FBQ1MsU0FBbEIsQ0FBNEJtQixjQUE1QixHQUE2QyxPQUE3QztBQUNBdkIsYUFBYSxDQUFDSSxTQUFkLENBQXdCUixLQUF4QixHQUFnQ0EsS0FBaEM7QUFDQUksYUFBYSxDQUFDSSxTQUFkLENBQXdCTixTQUF4QixHQUFvQ0EsU0FBcEM7QUFDQUUsYUFBYSxDQUFDSSxTQUFkLENBQXdCb0IsSUFBeEIsR0FBK0IsUUFBL0I7QUFDQXhCLGFBQWEsQ0FBQ0ksU0FBZCxDQUF3QnFCLFNBQXhCLEdBQW9DLEdBQXBDO0FBQ0F6QixhQUFhLENBQUNJLFNBQWQsQ0FBd0JzQixjQUF4QixHQUF5QzFCLGFBQWEsQ0FBQ0ksU0FBZCxDQUF3QnFCLFNBQWpFO0FBQ0F6QixhQUFhLENBQUNJLFNBQWQsQ0FBd0J1QixlQUF4QixHQUEwQzNCLGFBQWEsQ0FBQ0ksU0FBZCxDQUF3QnFCLFNBQWxFO0FBRUFHLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjdCLGFBQWpCO0FBQ0E0QixNQUFNLENBQUNDLE9BQVAsQ0FBZTdCLGFBQWYsR0FBK0JBLGFBQS9CO0FBQ0E0QixNQUFNLENBQUNDLE9BQVAsQ0FBZUMsT0FBZixHQUF5QjlCLGFBQXpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBBYnN0cmFjdERpYWxlY3QgPSByZXF1aXJlKCcuLi9hYnN0cmFjdCcpO1xuY29uc3QgQ29ubmVjdGlvbk1hbmFnZXIgPSByZXF1aXJlKCcuL2Nvbm5lY3Rpb24tbWFuYWdlcicpO1xuY29uc3QgUXVlcnkgPSByZXF1aXJlKCcuL3F1ZXJ5Jyk7XG5jb25zdCBRdWVyeUdlbmVyYXRvciA9IHJlcXVpcmUoJy4vcXVlcnktZ2VuZXJhdG9yJyk7XG5jb25zdCBEYXRhVHlwZXMgPSByZXF1aXJlKCcuLi8uLi9kYXRhLXR5cGVzJykuc3FsaXRlO1xuXG5jbGFzcyBTcWxpdGVEaWFsZWN0IGV4dGVuZHMgQWJzdHJhY3REaWFsZWN0IHtcbiAgY29uc3RydWN0b3Ioc2VxdWVsaXplKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnNlcXVlbGl6ZSA9IHNlcXVlbGl6ZTtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyID0gbmV3IENvbm5lY3Rpb25NYW5hZ2VyKHRoaXMsIHNlcXVlbGl6ZSk7XG4gICAgdGhpcy5RdWVyeUdlbmVyYXRvciA9IG5ldyBRdWVyeUdlbmVyYXRvcih7XG4gICAgICBfZGlhbGVjdDogdGhpcyxcbiAgICAgIHNlcXVlbGl6ZVxuICAgIH0pO1xuICB9XG59XG5cblNxbGl0ZURpYWxlY3QucHJvdG90eXBlLnN1cHBvcnRzID0gXy5tZXJnZShfLmNsb25lRGVlcChBYnN0cmFjdERpYWxlY3QucHJvdG90eXBlLnN1cHBvcnRzKSwge1xuICAnREVGQVVMVCc6IGZhbHNlLFxuICAnREVGQVVMVCBWQUxVRVMnOiB0cnVlLFxuICAnVU5JT04gQUxMJzogZmFsc2UsXG4gICdSSUdIVCBKT0lOJzogZmFsc2UsXG4gIGluc2VydHM6IHtcbiAgICBpZ25vcmVEdXBsaWNhdGVzOiAnIE9SIElHTk9SRScsXG4gICAgdXBkYXRlT25EdXBsaWNhdGU6ICcgT04gQ09ORkxJQ1QgRE8gVVBEQVRFIFNFVCdcbiAgfSxcbiAgaW5kZXg6IHtcbiAgICB1c2luZzogZmFsc2UsXG4gICAgd2hlcmU6IHRydWUsXG4gICAgZnVuY3Rpb25CYXNlZDogdHJ1ZVxuICB9LFxuICB0cmFuc2FjdGlvbk9wdGlvbnM6IHtcbiAgICB0eXBlOiB0cnVlXG4gIH0sXG4gIGNvbnN0cmFpbnRzOiB7XG4gICAgYWRkQ29uc3RyYWludDogZmFsc2UsXG4gICAgZHJvcENvbnN0cmFpbnQ6IGZhbHNlXG4gIH0sXG4gIGpvaW5UYWJsZURlcGVuZGVudDogZmFsc2UsXG4gIGdyb3VwZWRMaW1pdDogZmFsc2UsXG4gIEpTT046IHRydWVcbn0pO1xuXG5Db25uZWN0aW9uTWFuYWdlci5wcm90b3R5cGUuZGVmYXVsdFZlcnNpb24gPSAnMy44LjAnO1xuU3FsaXRlRGlhbGVjdC5wcm90b3R5cGUuUXVlcnkgPSBRdWVyeTtcblNxbGl0ZURpYWxlY3QucHJvdG90eXBlLkRhdGFUeXBlcyA9IERhdGFUeXBlcztcblNxbGl0ZURpYWxlY3QucHJvdG90eXBlLm5hbWUgPSAnc3FsaXRlJztcblNxbGl0ZURpYWxlY3QucHJvdG90eXBlLlRJQ0tfQ0hBUiA9ICdgJztcblNxbGl0ZURpYWxlY3QucHJvdG90eXBlLlRJQ0tfQ0hBUl9MRUZUID0gU3FsaXRlRGlhbGVjdC5wcm90b3R5cGUuVElDS19DSEFSO1xuU3FsaXRlRGlhbGVjdC5wcm90b3R5cGUuVElDS19DSEFSX1JJR0hUID0gU3FsaXRlRGlhbGVjdC5wcm90b3R5cGUuVElDS19DSEFSO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNxbGl0ZURpYWxlY3Q7XG5tb2R1bGUuZXhwb3J0cy5TcWxpdGVEaWFsZWN0ID0gU3FsaXRlRGlhbGVjdDtcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBTcWxpdGVEaWFsZWN0O1xuIl19