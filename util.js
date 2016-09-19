const crypto = require('crypto');
const escape = require('querystring').escape;
const keyvalue = require('./keyvalue.js');

exports.refresh = (timeout, url) => {
	return	'<meta http-equiv=\x22Refresh\x22 content=\x22' + timeout + ';URL=' + url + '\x22 />';
};

exports.noscriptrefresh = (timeout, url) => {
	return	'<script>document.write(\x22\\x3Cscript>\x2F*\x22);</script>'
	+	exports.refresh(timeout, url)
	+	'<script>\x2F**\x2F</script>';
};

exports.nonce = () => {
	return crypto.randomBytes(24).toString('base64').replace(/\x2f/g, '_').replace(/\x2b/g, '-');
};

exports.oauth1_signature = (method, url, params, key, token, hash) => {
	var ordered = '';
	var keys = Object.keys(params).sort().forEach((key) => {
		ordered = ordered + '&' + escape(key) + '=' + escape(params[key]);
	});
	var hmac = crypto.createHmac(hash, key + '&' + token);
	hmac.update(method + '&' + escape(url) + '&' + escape(ordered.slice(1)));
	return '\x22' + escape(hmac.digest('base64')) + '\x22';
};

exports.JSONreplacer = (key, value) => {
	switch (typeof v) {
		case 'number':
			return ((v < 0) ? '-' : '+') + ('000000000000000' + Math.abs(v).toString(10)).slice(-15);
		case 'string':
			return '_'+ v;
		default:
			return v;
	}
};

exports.JSONreviver = (key, value) => {
	if (typeof v !== 'string') {
		return v;
	}
	switch (v.slice(0, 1)) {
		case '-':
		case '+':
			return parseInt(v);
			break;
		default:
			return v.slice(1);
	}
};

// This is a successful 'login' here
// Goal: If user_id is set, that is where everything will be 'merged to'
//
// Lookup service-specific identifier:
// If NOT found:
//   If user_id is undefined:
//     Generate unique user_id
//   Create new record
//   Return user_id
// If found:
//   If user_id is undefined:
//     Set user_id to found record's user_id
//   If user_id does not match found record's user_id:
//     Begin Transaction
//     Alter service_info records to point to new user_id
//     Alter contact_pages records to point to new user_id
//     Commit Transaction
//   Update screen_name
// Return user_id

exports.complete_login = (database, user_id, service, uuid, unique_id, screen_name) => {
	console.log(`Complete Login:\n\tLogin ID: ${login_id}\n\tService: ${service}\n\tUUID: ${uuid}\n\tUser ID: ${user_id}\n\tScreen Name: ${screen_name}\n\tCustom URL: ${custom_url}`);
	database.getConnection((err, conn) => {
		if (err) {
			throw err;
		}
		conn.query(
			'SELECT _users'
		 +	' FROM service_info'
		 +	' INNER JOIN services'
		 +	' USING (_services)'
		 +	' WHERE services.title = ?'
		 +	' AND identifier = ?'
		,	[service, unique_id]
		,	(err, rows, fields) => {
			if (err) {
				keyvalue.set(uuid, 'error:Database error!');
				conn.release();
				return;
			}

			if (rows.length < 1) {
				if (typeof user_id === 'undefined') {
					conn.query(
						'INSERT INTO _users'
					 +	' VALUES()'
					,	(err, result) => {
						if (err) {
							keyvalue.set(uuid, 'error:Database error!');
							conn.release();
							return;
						}

						user_id = result.insertID;
						console.log('TODO: Create new service_info record.');
						keyvalue.set(uuid, 'error:Code path unimplemented for ' + service + '!');
						conn.release();
					});
					return;
				}
				console.log('TODO: Create new service_info record.');
				keyvalue.set(uuid, 'error:Code path unimplemented for ' + service + '!');
				conn.release();
				return;
			}

			if (typeof user_id === 'undefined') {
				user_id = rows[0]['_users'];
			}

			if (user_id !== rows[0]['_users']) {
				console.log('TODO: Merge users');
				keyvalue.set(uuid, 'error:Code path unimplemented for ' + service + '!');
				conn.release();
				return;
			}

			console.log('TODO: Create new service_info record.');
			keyvalue.set(uuid, 'error:Code path unimplemented for ' + service + '!');
			conn.release();
			return;
		});
		conn.release();
	});
};
