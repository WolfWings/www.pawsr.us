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
	function insert_update_service_info_record() {
		console.log('Updating service info record');
		console.log('\x1b[1;31m' + [service, user_id, unique_id, screen_name] + '\x1b[0m');

		return global.database.query(
			'INSERT INTO service_info SET'
		 +	' _services=(SELECT _services FROM services WHERE title = ?)'
		 +	',_users = ?'
		 +	',identifier = ?'
		 +	',screen_name = ?'
		 +	' ON DUPLICATE KEY UPDATE'
		 +	' screen_name = VALUES(screen_name)'
		,	[	service
			,	user_id
			,	unique_id
			,	screen_name
			]
		).then(() => {
			keyvalue.set(uuid, 'ready:' + user_id);
			return undefined;
		});

	}

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

	global.database.query(
		'SELECT _users'
	 +	' FROM service_info'
	 +	' INNER JOIN services'
	 +	' USING (_services)'
	 +	' WHERE services.title = ?'
	 +	' AND identifier = ?'
	,	[	service
		,	unique_id
		]
	).then(([rows, fields]) => {
		if ((rows.length === 0)
		 || (rows[0]['_users'] === null)) {
			console.log('Service info not found');
			if (typeof user_id === 'undefined') {
				console.log('Creating new user_id');
				return global.database.query(
					'INSERT INTO users'
				 +	' VALUES ()'
				).then(([result, _]) => {
					user_id = result.insertId;

					return insert_update_service_info_record();
				});
			} else {
				return insert_update_service_info_record();
			}
		}

		if (typeof user_id === 'undefined') {
			console.log('Setting user_id that was undefined');
			user_id = rows[0]['_users'];
		}

		if (user_id !== rows[0]['_users']) {
			console.log('Merging ' + rows[0]['_users'] + ' into ' + user_id);
			// Need to nest here to keep the 'conn' variable available
			return global.database.getConnection().then(conn => {
				conn.query('START TRANSACTION')
				  .then(() => {
					return conn.query(
						'UPDATE service_info SET'
					 +	' _users = ?'
					 +	' WHERE _users = ?'
					,	[	user_id
						,	rows[0]['_users']
						]
					);
				}).then(() => {
					return conn.query(
						'UPDATE contact_pages SET'
					 +	' _users = ?'
					 +	' WHERE _users = ?'
					,	[	user_id
						,	rows[0]['_users']
						]
					);
				}).then(() => {
					return conn.query(
						'DELETE FROM users'
					 +	' WHERE _users = ?'
					,	[	rows[0]['_users']
						]
					);
				}).then(() => {
					return conn.query('COMMIT');
				}).then(() => {
					conn.release(); // Done with the connection, let it go!
					return insert_update_service_info_record();
				}).catch(err => { // Re-reject after closing the connection
					conn.release();
					return Promise.reject(err);
				});
			});
		}

		return insert_update_service_info_record();
	}).catch(err => {
		console.log('Database error!');
		console.log(err);
		keyvalue.set(uuid, 'error:Database error!');
	});
};
