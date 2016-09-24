var aead = require('../utils/aead.js');
var crypto = require('crypto');

console.log('Performing 100 unique and random encryption tests');

console.time('aead');
for (var loop = 0; loop < 100; loop++) {
	var text = crypto.randomBytes(1000).toString('base64');
	var password = crypto.randomBytes(32);
	var encrypted = aead.encrypt(text, password);
	var decrypted = aead.decrypt(encrypted, password);
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
