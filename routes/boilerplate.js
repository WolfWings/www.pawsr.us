const fs = require('fs');

module.exports = (endpoints, shared_data) => {
	console.log('Loading HTML page boilerplate components');
	shared_data.boilerplate = {
		pretitle: fs.readFileSync('./static/boilerplate/pretitle.html').toString('utf8')
	,	prebody:  fs.readFileSync('./static/boilerplate/prebody.html').toString('utf8')
	,	postbody: fs.readFileSync('./static/boilerplate/postbody.html').toString('utf8')
	};
};
