// Database foreign key structure
//
// +----------+   +--------------+   +---------------+
// | services |<--| service_info |<--| contact_entry |
// +----------+   +--------------+   +---------------+
//                    |                  |
//                    v                  v
//                +-------+   +---------------+
//                | users |<--| contact_pages |
//                +-------+   +---------------+

// Longer term: Migrate this to individual files
// This structure works for now, but we need a better
// implementation to avoid this file exploding in size
//
// Longer-term we may need to change the setup to handle
// to/from matching instead of missing-tag matching.
const schema_updates = {
	'0.0.0': [
		'CREATE TABLE IF NOT EXISTS versioning ('
	 +	'_ INT UNSIGNED PRIMARY KEY'
	 +	',record VARCHAR(60) UNIQUE'
	 +	',complete ENUM("yes") NOT NULL'
	 +	')'
	,	'INSERT INTO versioning'
	 +	' SET record = "0.0.0", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete=""'
	,	'CREATE TABLE IF NOT EXISTS users ('
	 +	'_users BIGINT UNSIGNED PRIMARY KEY'
	 +	')'
	,	'CREATE TABLE IF NOT EXISTS services ('
	 +	'_services BIGINT UNSIGNED PRIMARY KEY'
	 +	',title VARCHAR(255) UNIQUE NOT NULL'
	 +	',url_format VARCHAR(255) NOT NULL'
	 +	',class VARCHAR(255) UNIQUE NOT NULL'
	 +	',login ENUM("yes") NOT NULL'
	 +	',internaldisplay ENUM("yes") NOT NULL'
	 +	')'
	,	'CREATE TABLE IF NOT EXISTS service_info ('
	 +	'_service_info BIGINT UNSIGNED PRIMARY KEY'
	 +	',_users BIGINT UNSIGNED'
	 +	',_services BIGINT UNSIGNED'
	 +	',contact VARCHAR(255) CHARACTER SET "utf8mb4" DEFAULT NULL'
	 +	',identifier TINYBLOB'
	 +	',UNIQUE INDEX `record` (_users, _services, identifier(255))'
	 +	',FOREIGN KEY (`_services`) REFERENCES `services`(`_services`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	',FOREIGN KEY (`_users`) REFERENCES `users`(`_users`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	')'
	,	'CREATE TABLE IF NOT EXISTS contact_pages ('
	 +	'_contact_pages BIGINT UNSIGNED PRIMARY KEY'
	 +	',_users BIGINT UNSIGNED'
	 +	',username VARCHAR(255) NOT NULL'
	 +	',public ENUM("yes")'
	 +	',UNIQUE INDEX `usernames` (username)'
	 +	',FOREIGN KEY (`_users`) REFERENCES `users`(`_users`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	')'
	,	'CREATE TABLE IF NOT EXISTS contact_entry ('
	 +	'_ BIGINT UNSIGNED PRIMARY KEY'
	 +	',_contact_pages BIGINT UNSIGNED'
	 +	',_service_info BIGINT UNSIGNED'
	 +	',UNIQUE INDEX `entries` (_contact_pages, _service_info)'
	 +	',FOREIGN KEY (`_contact_pages`) REFERENCES `contact_pages`(`_contact_pages`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	',FOREIGN KEY (`_service_info`) REFERENCES `service_info`(`_service_info`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	')'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.0.0"'
	]
,	'0.0.twitter': [
		'INSERT INTO services'
	 +	' SET title="Twitter", url_format="https:\x2F/twitter.com/%s", class="twitter", login="yes", internaldisplay=""'
	]
};

// This function sends all updates required to the database
// The 'setImmediate' tail-recusion avoids using up the stack
// entirely, as there's no actual loopback calls at all.
var send_updates = (conn, records, index) => {
	if (records.length < 1) {
		conn.release();
		return;
	}

	if (index >= schema_updates[records[0]].length) {
		send_updates(conn, records.slice(1), 0);
		return;
	}

	console.log('Processing schema update ' + records[0] + ', step ' + (index + 1) + ' of ' + schema_updates[records[0]].length);
	var query = conn.query(schema_updates[records[0]][index]);
	query.on('error', (err) => { throw err; });
	query.on('fields', (_) => { return; });
	query.on('result', (_) => { return; });
	query.on('end', (_) => {
		setImmediate(send_updates, conn, records, index + 1);
	});
};

// Build the connection pool itself
var database = require('mysql').createPool(require('./secrets.js').database);

// Verify database format/version
database.getConnection((err, conn) => {
	if (err) {
		throw err;
	}

	conn.query('SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE()', (err, rows, fields) => {
		if (err) {
			throw err;
		}

		// Database doesn't exist, create whole cloth
		// This is a special-case short-circuit to just send the ENTIRE
		// database schema update list upstream to build from scratch.
		if (rows[0].count === 0) {
			send_updates(conn, Object.keys(schema_updates), 0);
			return;
		}

		conn.query('SELECT record FROM versioning WHERE complete != "yes"', (err, rows, fields) => {
			if (err) {
				throw err;
			}

			if (rows.length > 0) {
				for (var i = 0; i < rows.length; i++) {
					console.log('Incomplete database update: ' + rows[i].record);
				}

				throw Error('Database in inconsistent state! Incomplete schema update recorded.');
			}

			conn.query('SELECT record FROM versioning WHERE complete = "yes"', (err, rows, fields) => {
				var processed = [];
				if (err) {
					throw err;
				}

				if (rows.length > 0) {
					for (var i = 0; i < rows.length; i++) {
						processed.push(rows[i].record);
					}
				}

				send_updates(conn, Object.keys(schema_updates).filter(x => (processed.indexOf(x) === -1)), 0);
			});
		});
	});
});

exports = database;
