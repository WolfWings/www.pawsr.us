// Nodejs encryption with GCM
// Does not work with nodejs v0.10.31
// Part of https://github.com/chris-rock/node-crypto-examples


var proc = require('process');
var aead = require('../utils/aead.js');
var crypto = require('crypto');

var loop, password, encrypted, decrypted;

console.log('Generating random data to use for testing');

var fullpassword = crypto.randomBytes(100 * 32);
var fulltext = crypto.randomBytes(100 * 1000);

console.log('Performing 100 unique encryption tests');

console.time('aead');
for (loop = 0; loop < 100; loop++) {
	var text = fulltext.slice(loop * 1000, (loop + 1) * 1000).toString('base64');
	password = fullpassword.slice(loop * 32, (loop + 1) * 32);
	encrypted = aead.encrypt(text, password);
	decrypted = aead.decrypt(encrypted, password);
	if (decrypted !== text) {
		console.log('<' + password.toString('hex') + '>');
		console.log('[' + text + ']');
		console.log('{' + encrypted + '}');
		console.log('[' + decrypted + ']');
	}
}
console.timeEnd('aead');

console.log('Attempting invalid AEAD decryption.');
try {
	aead.decrypt('wolf.wolf.wolf.wolf', '');
} catch (err) {
	console.log('Invalid AEAD decryption confirmed.');
}

console.log('Encryption tests complete');
