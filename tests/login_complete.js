const keyvalue = require('../utils/keyvalue.js');
const login_complete = require('../utils/login_complete.js');

var users = {};

purge_test_remnants(do_tests, 0);

function purge_test_remnants(finished_func, finished_arg) {
	console.log('Purging test remnants...');

	global.database.query(
		'DELETE FROM users'
	 +	' WHERE _users IN ('
	 +		'SELECT _users'
	 +		' FROM service_info'
	 +		' WHERE identifier LIKE "_test_%_test_"'
	 +	')')
	.then(results => {
		console.log('Remnants purged.');

		finished_func(finished_arg);
	});
}

function waitHelper(uuid, next_step) {
	setTimeout(waitForKeyValue, 50, uuid, next_step);
}

function waitForKeyValue(uuid, next_step) {
	var value = keyvalue.get(uuid);
	if (value === null) {
		throw Error('Error: KeyValue missing... ' + uuid);
	}
	if (!value.startsWith('ready:')) {
		waitHelper(uuid, next_step);
		return;
	}

	users[uuid] = parseInt(value.slice(6));
	keyvalue.delete(uuid);
	do_tests(next_step);
}

function do_tests(step) {
	var uuid = '' + step;
	switch (step) {
		case 0:
			console.log('Invalid user...');
			login_complete(undefined, 'Twitter', uuid, undefined, 'TestAccount' + step);
			keyvalue.set(uuid, 'ready:-1');
			waitHelper(uuid, step + 1);
			break;
		case 1:
			console.log('Invalid ID...');
			login_complete(undefined, 'Twitter', uuid, '_test_1_test_', undefined);
			keyvalue.set(uuid, 'ready:-1');
			waitHelper(uuid, step + 1);
			break;
		case 2:
			console.log('Creating record...');
			keyvalue.set(uuid, 'wip');
			login_complete(undefined, 'Twitter', uuid, '_test_2_test_', 'TestAccount' + step);
			waitHelper(uuid, step + 1);
			break;
		case 3:
			console.log('Finding record just made...');
			keyvalue.set(uuid, 'wip');
			login_complete(undefined, 'Twitter', uuid, '_test_2_test_', 'TestAccount' + step);
			waitHelper(uuid, step + 1);
			break;
		case 4:
			console.log('Creating record tied to previous record...');
			keyvalue.set(uuid, 'wip');
			login_complete(users['2'], 'Twitter', uuid, '_test_4_test_', 'TestAccount' + step);
			waitHelper(uuid, step + 1);
			break;
		case 5:
			console.log('Creating record...');
			keyvalue.set(uuid, 'wip');
			login_complete(undefined, 'Twitter', uuid, '_test_5_test_', 'TestAccount' + step);
			waitHelper(uuid, step + 1);
			break;
		case 6:
			console.log('Triggering merge to previous record...');
			keyvalue.set(uuid, 'wip');
			login_complete(users['2'], 'Twitter', uuid, '_test_5_test_', 'TestAccount' + step);
			waitHelper(uuid, step + 1);
			break;

		default:
			console.log('Tests complete.');
			if ((users['0'] !== users['1'])
			 && (users['0'] === users['2'])
			 && (users['0'] === users['3'])
			 && (users['0'] === users['4'])) {
				console.log('Tests passed.');
			}
			purge_test_remnants((x) => { return; }, 0);
	}
}
