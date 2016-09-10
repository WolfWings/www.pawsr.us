exports.register = (endpoints, shared_data) => {
	console.log('Registering /login/twitter');
	endpoints.push({
		uri: '/login/twitter'
	,	routine: (data, res) => {



const keyvalue = require('../keyvalue.js');
const secrets = require('../secrets.js').services.twitter;
const util = require('../util.js');

console.log(data.query);
console.log(data.session);
// { state: 'NJ7lOxiJ8G9tTGz6u3jLHl76fm2y362x',
//   oauth_token: 'z9oWdAAAAAAAuUkVAAABVxAfgwE',
//   oauth_verifier: 'jVrIQaDGTxQrwgFZpQAeMoy8TmmwS2He' }
// { twitter_uuid: 'NJ7lOxiJ8G9tTGz6u3jLHl76fm2y362x',
//   twitter_token_secret: 'GFVJg6p7g0rr1lPzFjIgUGnYGiGNMeze',
//   twitter_token: 'z9oWdAAAAAAAuUkVAAABVxAfgwE' }

try {
	if (data.query.state !== data.session.twitter_uuid) {
		throw Error('Nonce/State Mismatch - CSRF attack?');
	}
	if (data.query.oauth_token !== data.session.twitter_token) {
		throw Error('OAuth Token Mismatch - Replay attack?');
	}
	if (typeof data.query.oauth_verifier === 'undefined') {
		throw Error('OAuth Verifier missing!');
	}
} catch (err) {
	console.log('Twitter: ' + err.message);
	console.log(err.stacktrack);
	delete(data.session.twitter_uuid);
	delete(data.session.twitter_token);
	delete(data.session.twitter_token_secret);
	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Login Callback - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Error:</b> Twitter did not successfully login.</p>');
	res.write('<p><a href="/">Click here to go back to the homepage, and try again later.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

var params = {
	oauth_consumer_key:     secrets.oauthConsumerKey
,	oauth_nonce:            util.nonce()
,	oauth_signature_method: 'HMAC-SHA1'
,	oauth_timestamp:        Math.floor(Date.now() / 1000).toString()
,	oauth_token:            data.session.twitter_token
,	oauth_version:          '1.0'
,	oauth_verifier:         data.query.oauth_verifier
};

var authorization = 'OAuth oauth_signature=' + util.oauth1_signature(
	'POST'
,	'https:\x2F/api.twitter.com/oauth/access_token'
,	params
,	secrets.secretKey
,	data.session.twitter_token_secret
,	'sha1');

keyvalue.set('twitter_login_' + data.session.twitter_uuid, 'wip');

res.write(data.boilerplate.pretitle);
res.write('<title>Twitter Login Callback - www.pawsr.us</title>');
res.write(data.boilerplate.prebody);
res.write('<p>Process callback from Twitter for login...</p>');
res.write(data.boilerplate.postbody);



		}
	});
}
