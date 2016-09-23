/* istanbul ignore next */
const keyvalue = require('../utils/keyvalue.js');

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

module.exports = (user_id, service, uuid, unique_id, screen_name) => {
	if (typeof unique_id === 'undefined') {
		console.log('No unique ID!');
		keyvalue.set(uuid, 'error:No unique ID returned from ' + service);
		return;
	}

	if (typeof screen_name === 'undefined') {
		console.log('No screen name!');
		keyvalue.set(uuid, 'error:No screen name returned from ' + service);
		return;
	}

	global.database.getConnection((err, conn) => {
		/* istanbul ignore next */
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
				/* istanbul ignore if */
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
				/* istanbul ignore if */
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
			} else {
				create_service_info_record();
			}
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
				/* istanbul ignore if */
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
				/* istanbul ignore if */
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
					/* istanbul ignore if */
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
						/* istanbul ignore if */
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
							/* istanbul ignore if */
							if (err) {
								database_error();
								return;
							}

							conn.commit((err) => {
								/* istanbul ignore if */
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

		/* istanbul ignore if */
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
			/* istanbul ignore if */
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
