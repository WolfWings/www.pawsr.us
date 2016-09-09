// Nodejs encryption with GCM
// Does not work with nodejs v0.10.31
// Part of https://github.com/chris-rock/node-crypto-examples


var proc = require('process');
var aead = require('../aead.js');
var crypto = require('crypto');

var loop, password, encrypted, decrypted;

var fullpassword = crypto.randomBytes(1000000 + 32);
var fulltext = crypto.randomBytes(48000000);

console.time('test');
for (loop = 0; loop < 1000000; loop++) {
	var text = proc.argv[2] || fulltext.slice(loop * 48, (loop + 1) * 48).toString('base64');
	password = fullpassword.slice(loop, loop + 32);
	encrypted = aead.encrypt(text, password);
	decrypted = aead.decrypt(encrypted, password);
	if (decrypted !== text) {
		console.log('<' + password.toString('hex') + '>');
		console.log('[' + text + ']');
		console.log('{' + encrypted + '}');
		console.log('[' + decrypted + ']');
	}
	if ((loop % 10000) === 0) {
		process.stdout.write('\r' + ((1000000 - loop) / 10000) + '% remaining \b');
	}
}
process.stdout.write('\r            \r');
console.timeEnd('test');
