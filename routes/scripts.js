const fs = require('fs');
const svg4e = fs.readFileSync('./static/scripts/svg4everybody.js');

module.exports = (endpoints, shared_data) => {
	console.log('Registering script resources');
	endpoints.push({
		uri: '/svg4everybody.js'
	,	routine: (data, res) => {



return new Promise(resolve => {
	res.setHeader('Content-Type', 'application/javascript');
	res.write(svg4e);
	res.end();
	resolve();
});



		}
	});
};
