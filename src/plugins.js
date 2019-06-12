const ov = require('./ov');
const outputs = [];
const auths = [];
const caches = [];
const plugins = [{
  instance: ov
}];
module.exports = [...outputs, ...auths, ...caches, ...plugins];