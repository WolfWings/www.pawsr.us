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
	switch (typeof value) {
		case 'number':
			return ((value < 0) ? '-' : '+') + ('000000000000000' + Math.abs(value).toString(10)).slice(-15);
		case 'string':
			return '_'+ value;
		default:
			return value;
	}
};

exports.JSONreviver = (key, value) => {
	if (typeof value !== 'string') {
		return value;
	}
	switch (value.slice(0, 1)) {
		case '-':
		case '+':
			return parseInt(value);
			break;
		default:
			return value.slice(1);
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

exports.complete_login = (user_id, service, uuid, unique_id, screen_name) => {
	global.database.getConnection((err, conn) => {
		function database_error() {
			console.log(err);
			keyvalue.set(uuid, 'error:Database error!');
			conn.release();
		}

		function create_service_info_record() {
			conn.query(
				'INSERT INTO service_info SET'
			 +	' _services=(SELECT _services FROM services WHERE title = ?)'
			 +	',_users = ?'
			 +	',identifier = ?'
			 +	',screen_name = ?'
			,	[	service
				,	user_id
				,	unique_id
				,	screen_name
				]
			,	(err, result) => {
				if (err) {
					database_error();
					return;
				}

				keyvalue.set(uuid, 'ready:' + user_id);
				conn.release();
			});
		}

		function create_user_id() {
			conn.query(
				'INSERT INTO users'
			 +	' VALUES ()'
			,	(err, result) => {
				if (err) {
					database_error();
					return;
				}

				user_id = result.insertId;

				create_service_info_record();
			});
		}

		function service_info_not_found() {
			if (typeof user_id === 'undefined') {
				create_user_id();
				return;
			}
			create_service_info_record();
		}

		function update_service_info() {
			conn.query(
				'UPDATE service_info SET'
			 +	' screen_name = ?'
			 +	' WHERE identifier = ?'
			 +	' AND _users = ?'
			 +	' AND _services = (SELECT _services FROM services WHERE title = ?)'
			,	[	screen_name
				,	unique_id
				,	user_id
				,	service
				]
			,	(err, result) => {
				if (err) {
					database_error();
					return;
				}

				keyvalue.set(uuid, 'ready:' + user_id);
				conn.release();
			});
		}

		function merge_users(old_user_id) {
			conn.beginTransaction((err) => {
				if (err) {
					database_error();
					return;
				}

				conn.query(
					'UPDATE service_info SET'
				 +	' _users = ?'
				 +	' WHERE _users = ?'
				,	[	user_id
					,	old_user_id
					]
				,	(err, result) => {
					if (err) {
						database_error();
						return;
					}

					conn.query(
						'UPDATE contact_pages SET'
					 +	' _users = ?'
					 +	' WHERE _users = ?'
					,	[	user_id
						,	old_user_id
						]
					,	(err, result) => {
						if (err) {
							database_error();
							return;
						}

						conn.query(
							'DELETE FROM users'
						 +	' WHERE _users = ?'
						,	[	old_user_id
							]
						,	(err, result) => {
							if (err) {
								database_error();
								return;
							}

							conn.commit((err) => {
								if (err) {
									database_error();
									return;
								}

								update_service_info();
							});
						});
					});
				});
			});
		}

		if (err) {
			database_error();
			return;
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
				database_error();
				return;
			}

			if (rows.length === 0) {
				service_info_not_found();
				return;
			}

			if (typeof user_id === 'undefined') {
				user_id = rows[0]['_users'];
			}

			if (user_id !== rows[0]['_users']) {
				merge_users(rows[0]['_users']);
				return;
			}

			update_service_info();
		});
	});
};
