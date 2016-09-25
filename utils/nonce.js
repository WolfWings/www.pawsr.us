const crypto = require('crypto');

module.exports = () => {
	return crypto.randomBytes(24).toString('base64').replace(/\x2f/g, '_').replace(/\x2b/g, '-');
};
