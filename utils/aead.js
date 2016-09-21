const crypto = require('crypto');

// Transmission structure is a series of .-seperated UNPADDED base64-encoded fields
//	[0] is always the encrypted data
//	[1] is always the algorithm tag, to allow for expansion/changes
//		An empty field specifies the aes-256-gcm cipher
//			This requires a 32-byte/256-bit password
//	[2] and beyond are algorithm-specific data
//	For aes-256-gcm:
//		[2] is the IV/Nonce
//		[3] is the GCM Authentication Tag

exports.encrypt = (text, password) => {
	// Using a nonce longer than 96 bits to force a full GHASH-width IV
	var nonce = crypto.randomBytes(16);

	// Empty field = default of aes-256-gcm
	var method = Buffer.alloc(0);

	// Build the cipher using the nonce and provided password
	// The crypto package validates the password length, just
	// let the error happen if it throws one, no try here.
	var engine = crypto.createCipheriv('aes-256-gcm', password, nonce);

	// Feel the encrypted text in all at once, and finalize it.
	var encrypted = Buffer.concat([engine.update(Buffer.from(text, 'utf8')), engine.final()]);

	// And store the MAC/AuthTag component for validation.
	var mac = engine.getAuthTag();

	// Finally assemble the string to return in the proper format,
	// with tidy base64 encoding WITHOUT padding everywhere.
	return [encrypted, method, nonce, mac].map((x) => {
		return x.toString('base64');
	}).join('.').replace(/=/g, '');
};

exports.decrypt = (encrypted, password) => {
	// Can't use elegant named splits, since we can't guarantee future constructs will only
	// use 4 fields. Future-proofing at the expense of some readability.
	var engine
	,   components = encrypted.split('.').map(x => Buffer.from(x, 'base64') )
	,   text;

	switch (components[1].toString('utf8')) {
		case '':
			engine = crypto.createDecipheriv('aes-256-gcm', password, components[2]);
			engine.setAuthTag(components[3]);
			break;
		/* istanbul ignore next: Failsafe to future-proof */
		default:
			throw new TypeError('Unknown Algorithm parameter!');
	}
	text = Buffer.concat([engine.update(components[0]), engine.final()]).toString('utf8');
	return text;
}
