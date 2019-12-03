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

let Logger =
/*#__PURE__*/
function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi91dGlscy9sb2dnZXIuanMiXSwibmFtZXMiOlsiZGVidWciLCJyZXF1aXJlIiwidXRpbCIsIkxvZ2dlciIsImNvbmZpZyIsIk9iamVjdCIsImFzc2lnbiIsImNvbnRleHQiLCJtZXNzYWdlIiwiY29uc29sZSIsIndhcm4iLCJ2YWx1ZSIsImluc3BlY3QiLCJuYW1lIiwiZXhwb3J0cyIsImxvZ2dlciJdLCJtYXBwaW5ncyI6IkFBQUE7QUFFQTs7Ozs7Ozs7Ozs7Ozs7QUFRQSxNQUFNQSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxPQUFELENBQXJCOztBQUNBLE1BQU1DLElBQUksR0FBR0QsT0FBTyxDQUFDLE1BQUQsQ0FBcEI7O0lBRU1FLE07OztBQUNKLGtCQUFZQyxNQUFaLEVBQW9CO0FBQUE7O0FBRWxCLFNBQUtBLE1BQUwsR0FBY0MsTUFBTSxDQUFDQyxNQUFQLENBQWM7QUFDMUJDLE1BQUFBLE9BQU8sRUFBRSxXQURpQjtBQUUxQlAsTUFBQUEsS0FBSyxFQUFFO0FBRm1CLEtBQWQsRUFHWEksTUFIVyxDQUFkO0FBSUQ7Ozs7eUJBRUlJLE8sRUFBUztBQUNaO0FBQ0FDLE1BQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFjLElBQUcsS0FBS04sTUFBTCxDQUFZRyxPQUFRLGNBQWFDLE9BQVEsRUFBMUQ7QUFDRDs7OzRCQUVPRyxLLEVBQU87QUFDYixhQUFPVCxJQUFJLENBQUNVLE9BQUwsQ0FBYUQsS0FBYixFQUFvQixLQUFwQixFQUEyQixDQUEzQixDQUFQO0FBQ0Q7OztpQ0FFWUUsSSxFQUFNO0FBQ2pCLGFBQU9iLEtBQUssQ0FBRSxHQUFFLEtBQUtJLE1BQUwsQ0FBWUcsT0FBUSxJQUFHTSxJQUFLLEVBQWhDLENBQVo7QUFDRDs7Ozs7O0FBR0hDLE9BQU8sQ0FBQ0MsTUFBUixHQUFpQixJQUFJWixNQUFKLEVBQWpCO0FBRUFXLE9BQU8sQ0FBQ1gsTUFBUixHQUFpQkEsTUFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogU2VxdWVsaXplIG1vZHVsZSBmb3IgZGVidWcgYW5kIGRlcHJlY2F0aW9uIG1lc3NhZ2VzLlxyXG4gKiBJdCByZXF1aXJlIGEgYGNvbnRleHRgIGZvciB3aGljaCBtZXNzYWdlcyB3aWxsIGJlIHByaW50ZWQuXHJcbiAqXHJcbiAqIEBtb2R1bGUgbG9nZ2luZ1xyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmNvbnN0IGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKTtcclxuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcclxuXHJcbmNsYXNzIExvZ2dlciB7XHJcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XHJcblxyXG4gICAgdGhpcy5jb25maWcgPSBPYmplY3QuYXNzaWduKHtcclxuICAgICAgY29udGV4dDogJ3NlcXVlbGl6ZScsXHJcbiAgICAgIGRlYnVnOiB0cnVlXHJcbiAgICB9LCBjb25maWcpO1xyXG4gIH1cclxuXHJcbiAgd2FybihtZXNzYWdlKSB7XHJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgY29uc29sZS53YXJuKGAoJHt0aGlzLmNvbmZpZy5jb250ZXh0fSkgV2FybmluZzogJHttZXNzYWdlfWApO1xyXG4gIH1cclxuXHJcbiAgaW5zcGVjdCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHV0aWwuaW5zcGVjdCh2YWx1ZSwgZmFsc2UsIDMpO1xyXG4gIH1cclxuXHJcbiAgZGVidWdDb250ZXh0KG5hbWUpIHtcclxuICAgIHJldHVybiBkZWJ1ZyhgJHt0aGlzLmNvbmZpZy5jb250ZXh0fToke25hbWV9YCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnRzLmxvZ2dlciA9IG5ldyBMb2dnZXIoKTtcclxuXHJcbmV4cG9ydHMuTG9nZ2VyID0gTG9nZ2VyO1xyXG4iXX0=