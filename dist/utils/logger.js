'use strict';
/**
 * Sequelize module for debug and deprecation messages.
 * It require a `context` for which messages will be printed.
 *
 * @module logging
 * @private
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

const debug = require('debug');

const util = require('util');

let Logger = /*#__PURE__*/function () {
  function Logger(config) {
    _classCallCheck(this, Logger);

    this.config = Object.assign({
      context: 'sequelize',
      debug: true
    }, config);
  }

  _createClass(Logger, [{
    key: "warn",
    value: function warn(message) {
      // eslint-disable-next-line no-console
      console.warn(`(${this.config.context}) Warning: ${message}`);
    }
  }, {
    key: "inspect",
    value: function inspect(value) {
      return util.inspect(value, false, 3);
    }
  }, {
    key: "debugContext",
    value: function debugContext(name) {
      return debug(`${this.config.context}:${name}`);
    }
  }]);

  return Logger;
}();

exports.logger = new Logger();
exports.Logger = Logger;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi91dGlscy9sb2dnZXIuanMiXSwibmFtZXMiOlsiZGVidWciLCJyZXF1aXJlIiwidXRpbCIsIkxvZ2dlciIsImNvbmZpZyIsIk9iamVjdCIsImFzc2lnbiIsImNvbnRleHQiLCJtZXNzYWdlIiwiY29uc29sZSIsIndhcm4iLCJ2YWx1ZSIsImluc3BlY3QiLCJuYW1lIiwiZXhwb3J0cyIsImxvZ2dlciJdLCJtYXBwaW5ncyI6IkFBQUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7QUFFQSxNQUFNQSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxPQUFELENBQXJCOztBQUNBLE1BQU1DLElBQUksR0FBR0QsT0FBTyxDQUFDLE1BQUQsQ0FBcEI7O0lBRU1FLE07QUFDSixrQkFBWUMsTUFBWixFQUFvQjtBQUFBOztBQUVsQixTQUFLQSxNQUFMLEdBQWNDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjO0FBQzFCQyxNQUFBQSxPQUFPLEVBQUUsV0FEaUI7QUFFMUJQLE1BQUFBLEtBQUssRUFBRTtBQUZtQixLQUFkLEVBR1hJLE1BSFcsQ0FBZDtBQUlEOzs7O3lCQUVJSSxPLEVBQVM7QUFDWjtBQUNBQyxNQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYyxJQUFHLEtBQUtOLE1BQUwsQ0FBWUcsT0FBUSxjQUFhQyxPQUFRLEVBQTFEO0FBQ0Q7Ozs0QkFFT0csSyxFQUFPO0FBQ2IsYUFBT1QsSUFBSSxDQUFDVSxPQUFMLENBQWFELEtBQWIsRUFBb0IsS0FBcEIsRUFBMkIsQ0FBM0IsQ0FBUDtBQUNEOzs7aUNBRVlFLEksRUFBTTtBQUNqQixhQUFPYixLQUFLLENBQUUsR0FBRSxLQUFLSSxNQUFMLENBQVlHLE9BQVEsSUFBR00sSUFBSyxFQUFoQyxDQUFaO0FBQ0Q7Ozs7OztBQUdIQyxPQUFPLENBQUNDLE1BQVIsR0FBaUIsSUFBSVosTUFBSixFQUFqQjtBQUVBVyxPQUFPLENBQUNYLE1BQVIsR0FBaUJBLE1BQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFNlcXVlbGl6ZSBtb2R1bGUgZm9yIGRlYnVnIGFuZCBkZXByZWNhdGlvbiBtZXNzYWdlcy5cbiAqIEl0IHJlcXVpcmUgYSBgY29udGV4dGAgZm9yIHdoaWNoIG1lc3NhZ2VzIHdpbGwgYmUgcHJpbnRlZC5cbiAqXG4gKiBAbW9kdWxlIGxvZ2dpbmdcbiAqIEBwcml2YXRlXG4gKi9cblxuY29uc3QgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuY2xhc3MgTG9nZ2VyIHtcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG5cbiAgICB0aGlzLmNvbmZpZyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgY29udGV4dDogJ3NlcXVlbGl6ZScsXG4gICAgICBkZWJ1ZzogdHJ1ZVxuICAgIH0sIGNvbmZpZyk7XG4gIH1cblxuICB3YXJuKG1lc3NhZ2UpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUud2FybihgKCR7dGhpcy5jb25maWcuY29udGV4dH0pIFdhcm5pbmc6ICR7bWVzc2FnZX1gKTtcbiAgfVxuXG4gIGluc3BlY3QodmFsdWUpIHtcbiAgICByZXR1cm4gdXRpbC5pbnNwZWN0KHZhbHVlLCBmYWxzZSwgMyk7XG4gIH1cblxuICBkZWJ1Z0NvbnRleHQobmFtZSkge1xuICAgIHJldHVybiBkZWJ1ZyhgJHt0aGlzLmNvbmZpZy5jb250ZXh0fToke25hbWV9YCk7XG4gIH1cbn1cblxuZXhwb3J0cy5sb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG5cbmV4cG9ydHMuTG9nZ2VyID0gTG9nZ2VyO1xuIl19