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
// Longer-term we need to change the setup to handle
// to/from matching instead of missing-tag matching.
const schema_updates = {
	'0.0.0': [
		'CREATE TABLE IF NOT EXISTS versioning ('
	 +	'_ INT UNSIGNED PRIMARY KEY AUTO_INCREMENT'
	 +	',record VARCHAR(60) UNIQUE'
	 +	',complete ENUM("yes") NOT NULL'
	 +	')'
	,	'INSERT INTO versioning'
	 +	' SET record = "0.0.0", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete = ""'
	,	'CREATE TABLE IF NOT EXISTS users ('
	 +	'_users BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT'
	 +	')'
	,	'CREATE TABLE IF NOT EXISTS services ('
	 +	'_services BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT'
	 +	',title VARCHAR(255) UNIQUE NOT NULL'
	 +	',url_format VARCHAR(255) NOT NULL'
	 +	',class VARCHAR(255) UNIQUE NOT NULL'
	 +	',login ENUM("yes") NOT NULL'
	 +	',internaldisplay ENUM("yes") NOT NULL'
	 +	')'
	,	'CREATE TABLE IF NOT EXISTS service_info ('
	 +	'_service_info BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT'
	 +	',_users BIGINT UNSIGNED'
	 +	',_services BIGINT UNSIGNED'
	 +	',screen_name VARCHAR(255) CHARACTER SET "utf8mb4" DEFAULT NULL'
	 +	',identifier TINYBLOB'
	 +	',UNIQUE INDEX `record` (_services, identifier(255))'
	 +	',FOREIGN KEY (`_services`) REFERENCES `services`(`_services`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	',FOREIGN KEY (`_users`) REFERENCES `users`(`_users`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	')'
	,	'CREATE TABLE IF NOT EXISTS contact_pages ('
	 +	'_contact_pages BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT'
	 +	',_users BIGINT UNSIGNED'
	 +	',username VARCHAR(255) NOT NULL'
	 +	',public ENUM("yes")'
	 +	',UNIQUE INDEX `usernames` (username)'
	 +	',FOREIGN KEY (`_users`) REFERENCES `users`(`_users`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	')'
	,	'CREATE TABLE IF NOT EXISTS contact_entry ('
	 +	'_contact_pages BIGINT UNSIGNED'
	 +	',_service_info BIGINT UNSIGNED'
	 +	',PRIMARY KEY (_contact_pages, _service_info)'
	 +	',FOREIGN KEY (`_contact_pages`) REFERENCES `contact_pages`(`_contact_pages`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	',FOREIGN KEY (`_service_info`) REFERENCES `service_info`(`_service_info`) ON DELETE CASCADE ON UPDATE CASCADE'
	 +	')'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.0.0"'
	]

,	'0.0.twitter': [
		'INSERT INTO versioning'
	 +	' SET record = "0.0.twitter", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete = ""'
	,	'INSERT INTO services'
	 +	' SET title="Twitter", url_format="https:\x2F/twitter.com/%s", class="twitter", login="yes", internaldisplay=""'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.0.twitter"'
	]

,	'0.0.reddit': [
		'INSERT INTO versioning'
	 +	' SET record = "0.0.reddit", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete = ""'
	,	'INSERT INTO services'
	 +	' SET title="Reddit", url_format="https:\x2F/www.reddit.com/u/%s", class="reddit", login="yes", internaldisplay=""'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.0.reddit"'
	]
,	'0.0.github': [
		'INSERT INTO versioning'
	 +	' SET record = "0.0.github", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete = ""'
	,	'INSERT INTO services'
	 +	' SET title="GitHub", url_format="https:\x2F/github.com/%s", class="github", login="yes", internaldisplay=""'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.0.github"'
	]
,	'0.1.0': [
		'INSERT INTO versioning'
	 +	' SET record = "0.1.0", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete = ""'
	,	'ALTER TABLE services'
	 +	' MODIFY COLUMN url_format VARCHAR(255)'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.1.0"'
	]
,	'0.1.amazon': [
		'INSERT INTO versioning'
	 +	' SET record = "0.1.amazon", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete = ""'
	,	'INSERT INTO services'
	 +	' SET title="Amazon", url_format=NULL, class="amazon", login="yes", internaldisplay=""'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.1.amazon"'
	]
,	'0.1.instagram': [
		'INSERT INTO versioning'
	 +	' SET record = "0.1.instagram", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete = ""'
	,	'INSERT INTO services'
	 +	' SET title="Instagram", url_format="https:\x2F/www.instagram.com/%s", class="instagram", login="yes", internaldisplay=""'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.1.instagram"'
	]
,	'0.2.0': [
		'INSERT INTO versioning'
	 +	' SET record = "0.2.0", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete = ""'
	,	'ALTER TABLE service_info'
	 +	' DROP FOREIGN KEY `service_info_ibfk_1`'
	,	'ALTER TABLE service_info'
	 +	' MODIFY COLUMN _services BIGINT UNSIGNED NOT NULL'
	,	'ALTER TABLE service_info'
	 +	' ADD FOREIGN KEY `_services`'
	 +	' (`_services`) REFERENCES'
	 +	' `services` (`_services`)'
	 +	' ON DELETE CASCADE'
	 +	' ON UPDATE CASCADE'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.2.0"'
	]
,	'0.2.battlenetus': [
		'INSERT INTO versioning'
	 +	' SET record = "0.2.battlenetus", complete = ""'
	 +	' ON DUPLICATE KEY UPDATE complete = ""'
	,	'INSERT INTO services'
	 +	' SET title="BattleNetUS", url_format="https:\x2F/display-contact.pawsr.us/battlenet-us/%s", class="battlenet", login="yes", internaldisplay="yes"'
	,	'UPDATE versioning SET complete = "yes" WHERE record = "0.2.battlenetus"'
	]
};

// Build the connection pool itself
var database = require('mysql2/promise').createPool(require('../secrets.js').database);

// This function sends all updates required to the database
// The 'setImmediate' tail-recusion avoids using up the stack
// entirely, as there's no actual loopback calls at all.
var send_updates = (records, index) => {
	if (records.length < 1) {
		console.log('Finished updating database schema.');
		return Promise.resolve('Finished updating database schema');
	}

	if (index >= schema_updates[records[0]].length) {
		return send_updates(records.slice(1), 0);
	}

	console.log('Processing schema update ' + records[0] + ', step ' + (index + 1) + ' of ' + schema_updates[records[0]].length);
	return database.query(schema_updates[records[0]][index])
	.then(() => {
		return send_updates(records, index + 1);
	});
};

// Verify database format/version
console.log('Verifying database has any tables in it.');

database.query(
	'SELECT COUNT(*) AS count'
 +	' FROM information_schema.tables'
 +	' WHERE table_schema = DATABASE()')
.then(([rows, fields]) => {
	// Database doesn't exist, create whole cloth
	// This is a special-case short-circuit to just send the ENTIRE
	// database schema update list upstream to build from scratch.
	if (rows[0].count === 0) {
		return send_updates(Object.keys(schema_updates), 0)
		.then(() => {
			return Promise.reject('Empty database populated.');
		});
	}

	console.log('Checking for incomplete schema updates.');

	return database.query('SELECT record FROM versioning WHERE complete != "yes"');
}).then(([rows, fields]) => {
	if (rows.length > 0) {
		[...rows].forEach(incomplete => {
			console.log('Incomplete database update: ' + incomplete.record);
		});

		return Promise.reject(new Error('Database in inconsistent state! Incomplete schema update recorded.'));
	}

	console.log('Checking for completed schema updates.');

	return database.query('SELECT record FROM versioning WHERE complete = "yes"');
}).then(([rows, fields]) => {
	var processed = [...rows].map(x => x.record);

	console.log('Updating schema...');

	return send_updates(Object.keys(schema_updates).filter(x => (processed.indexOf(x) === -1)), 0);
}).catch(reason => {
	if (reason instanceof Error) {
		throw Error;
	} else {
		console.log(reason);
	}
});

module.exports = database;
