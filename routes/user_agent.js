module.exports = (endpoints, shared_data) => {
	const fs = require('fs');
	console.log('Setting global User-Agent');
	shared_data.user_agent = 'web:www.pawsr.us:v0.9.9 (by /u/wolfwings)';
}
