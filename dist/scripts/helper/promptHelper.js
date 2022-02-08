"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompt = require('prompt');
const util = require('util');
prompt.start();
exports.default = util.promisify(prompt.get);
