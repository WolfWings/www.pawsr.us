const fs = require('fs');
const services = fs.readFileSync('./static/images/services.svg');

module.exports = (endpoints, shared_data) => {
	console.log('Registering static resources');
	endpoints.push({
		uri: '/services.svg'
	,	routine: (data, res) => {



return new Promise(resolve => {
	res.setHeader('Content-Type', 'image/svg+xml');
	res.write(services);
	res.end();
	resolve();
});



		}
	});
};
