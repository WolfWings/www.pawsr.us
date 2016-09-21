const assert = require('assert');
const keyvalue = require('../utils/keyvalue.js');

keyvalue.set('_', '=');
assert(keyvalue.get('_') === '=');

keyvalue.delete('_');
assert(keyvalue.get('_') === null);

keyvalue.delete('_');
assert(keyvalue.get('_') === null);
