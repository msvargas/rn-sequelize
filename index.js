"use strict";

/**
 * The entry point.
 *
 * @module Sequelize
 */
require("error-polyfill");
global.Buffer = global.Buffer || require("buffer").Buffer;
module.exports = require("./dist/sequelize");
