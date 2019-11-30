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