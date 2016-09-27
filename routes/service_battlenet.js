const serviceTitle = 'BattleNetUS';
const service = serviceTitle.toLowerCase();

const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth2.js');

// istanbul ignore next: Pure wrapper, no functional code here
module.exports = (endpoints, shared_data) => {
	console.log('Adding ' + serviceTitle + ' service');

	shared_data.services.push({
		name:		serviceTitle
	,	login_url:	'/initlogin/' + service
	,	logout_url:	'about:blank'
	});

	endpoints.push({
		uri: '/initlogin/' + service
	,	routine: (data, res) => {
			oauth.oauth2_initlogin(
				data
			,	res
			,	service
			,	secrets.clientID
			,	'https:\x2F/us.battle.net/oauth/authorize'
			,	''
			);
		}
	});

	endpoints.push({
		uri: '/login/' + service
	,	routine: (data, res) => {
			oauth.oauth2_login(
				data
			,	res
			,	serviceTitle
			,	secrets
			,	'https:\x2F/us.battle.net/oauth/token'
			,	secrets
			,	'https:\x2F/us.api.battle.net/account/user'
			,	'id'
			,	'battletag'
			);
		}
	});
}
