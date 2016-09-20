global.debugging = true;
var keyvalue = require('../keyvalue.js');
global.database = require('../database.js');
var login_complete = require('../utils/login_complete.js');
global.database.getConnection((err, conn) => {
	if (err) {
		throw err;
	}

	console.log('Purging remnants of any prior test.');

	conn.query('DELETE FROM users WHERE _users IN (SELECT _users FROM service_info WHERE identifier LIKE "_test_%_test_")', (err, results) => {
		if (err) {
			throw err;
		}

		conn.release();

		console.log('Remnants purged.');

		console.log('Beginning actual tests...');

		do_tests(0);
	});
});

var users = {};

function waitHelper(uuid, next_step) {
	console.log('Waiting 1/4 second for ' + uuid + ' - ' + next_step);
	setTimeout(waitForKeyValue, 250, uuid, next_step);
}

function waitForKeyValue(uuid, next_step) {
	var value = keyvalue.get(uuid);
	if (value === null) {
		throw Error('Error: KeyValue missing... ' + uuid);
	}
	if (!value.startsWith('ready:')) {
		console.log('UUID ' + uuid + ' complete.');
		waitHelper(uuid, next_step);
		return;
	}

	users[uuid] = parseInt(value.slice(6));
	keyvalue.delete(uuid);
	do_tests(next_step);
}

function do_tests(step) {
	var uuid = step.toString(10);
	console.log('Testing step ' + step);
	switch (step) {
		case 0:
			console.log('Creating user #0...');
			keyvalue.set(uuid, 'wip');
			login_complete(undefined, 'Twitter', uuid, '_test_0_test_', 'TestAccount0');
			waitHelper(uuid, step + 1);
			break;
		case 1:
			console.log('Creating user #1...');
			keyvalue.set(uuid, 'wip');
			login_complete(undefined, 'Twitter', uuid, '_test_1_test_', 'TestAccount1');
			waitHelper(uuid, step + 1);
			break;
		case 2:
			console.log('Triggering merge of users #0 and #1...');
			keyvalue.set(uuid, 'wip');
			login_complete(users['0'], 'Twitter', uuid, '_test_1_test_', 'TestAccount2');
			waitHelper(uuid, step + 1);
			break;
		case 3:
			console.log('Finding existing user #0...');
			keyvalue.set(uuid, 'wip');
			login_complete(undefined, 'Twitter', uuid, '_test_0_test_', 'TestAccount3');
			waitHelper(uuid, step + 1);
			break;
		case 4:
			console.log('Creating user #2 while logged into user #0...');
			keyvalue.set(uuid, 'wip');
			login_complete(users['3'], 'Twitter', uuid, '_test_2_test_', 'TestAccount4');
			waitHelper(uuid, step + 1);
			break;
		default:
			console.log('Tests complete.');
			console.log(users);
			process.exit();
	}
}
