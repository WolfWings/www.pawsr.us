const serviceTitle = 'Twitter';
const service = serviceTitle.toLowerCase();

const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth.js');

// istanbul ignore next: Nothing to 'test' here, it's all in utils/oauth.js
module.exports = (endpoints, shared_data) => {
	console.log('Registering /preauth/' + service);
	endpoints.push({
		uri: '/preauth/' + service
	,	routine: (data, res) => {



oauth.oauth1_preauth(
	data
,	res
,	serviceTitle
,	'https:\x2F/api.twitter.com/oauth/authenticate'
);



		}
	});
}
