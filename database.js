const create_blank = [
	'CREATE TABLE versioning ('
 +	'id INT UNSIGNED PRIMARY KEY'
 +	',record VARCHAR(60) UNIQUE'
 +	') CHARACTER SET "ascii"'
,	'INSERT INTO versioning SET record = "0.0.0"'
,	'CREATE TABLE users ('
 +	'uid BIGINT UNSIGNED PRIMARY KEY'
 +	')'
,	'CREATE TABLE contact_types ('
 +	'type BIGINT UNSIGNED PRIMARY KEY'
 +	',title VARCHAR(255) UNIQUE NOT NULL'
 +	',url_format VARCHAR(255) NOT NULL'
 +	',class VARCHAR(255) UNIQUE NOT NULL'
 +	',login enum("yes") NOT NULL'
 +	',internaldisplay enum("yes") NOT NULL'
 +	') CHARACTER SET "ascii"'
,	'CREATE TABLE contact_info ('
 +	'id BIGINT UNSIGNED PRIMARY KEY'
 +	',uid BIGINT UNSIGNED'
 +	',type BIGINT UNSIGNED'
 +	',contact VARCHAR(255) DEFAULT NULL'
 +	',identifier TINYBLOB'
 +	',UNIQUE INDEX `record` (uid, type, identifier(255))'
 +	',FOREIGN KEY (`type`) REFERENCES `contact_types`(`type`) ON DELETE CASCADE ON UPDATE CASCADE'
 +	',FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE'
 +	')'
];

// Build the connection pool itself
var database = require('mysql').createPool(require('./secrets.js').database);

// Verify database format/version
database.getConnection((err, conn) => {
	var sendqueries = (queries, index) => {
		if (index >= queries.length) {
			conn.release();
			return;
		}
		console.log(queries[index]);
		var query = conn.query(queries[index]);
		query.on('error', (err) => { throw err; });
		query.on('fields', (_) => { return; });
		query.on('result', (_) => { return; });
		query.on('end', (_) => {
			setImmediate(sendqueries, queries, index + 1);
		});
	};

	if (err) {
		throw err;
	}

	conn.query('SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE()', (err, rows, fields) => {
		// Database doesn't exist, create whole cloth
		if (rows[0].count === 0) {
			setImmediate(sendqueries, create_blank, 0);
		}
	});
});

exports = database;
