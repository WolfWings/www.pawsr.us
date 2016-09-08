const crypto = require('crypto');

// Transmission structure is a series of .-seperated UNPADDED base64-encoded fields
//	[0] is always the encrypted data
//	[1] is always the algorithm tag, to allow for expansion/changes
//		An empty field specifies the aes-256-gcm cipher
//			This requires a 32-byte/256-bit password
//	[2] and beyond are algorithm-specific data
//	For aes-256-gcm:
//		[2] is the IV
//		[3] is the GCM Authentication Tag

exports.encrypt = (text, password) => {
	var components = [null, Buffer.alloc(0), crypto.randomBytes(24), null];
	var engine = crypto.createCipheriv('aes-256-gcm', password, components[2]);
	components[0] = Buffer.concat([engine.update(Buffer.from(text, 'utf8')), engine.final()]);
	components[3] = engine.getAuthTag();
	return components.map(x => x.toString('base64').replace(/=+$/, '')).join('.');
};

exports.decrypt = (encrypted, password) => {
	var engine, components = encrypted.split('.').map(x => Buffer.from(x, 'base64') );
	switch (components[1].toString('utf8')) {
		case '':
			engine = crypto.createDecipheriv('aes-256-gcm', password, components[2]);
			engine.setAuthTag(components[3]);
			break;
		default:
			throw new TypeError('Invalid Algorithm!');
	}
	return Buffer.concat([engine.update(components[0]), engine.final()]).toString('utf8');
}
