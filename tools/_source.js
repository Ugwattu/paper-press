/* Reads the ordered classic-script modules as one source string for static regression checks. */
const fs = require('fs');
const path = require('path');
const { scripts } = require('../bank-loader.js');
const root = path.join(__dirname, '..');
const readAppSource = () => scripts.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
module.exports = { readAppSource, scripts };
