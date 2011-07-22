__piedirname = __dirname;

pie = {
	'paths'  : require('./pie/paths').paths,
	'pie'    : {
		'dataSources' : {},
		'helpers'     : {}
	},
	'app'    : {
		'controllers' : {},
		'helpers'     : {},
		'models'      : {}
	},
	'config' : {}
};

pie.config.app = {
	'core'     : require(pie.paths.app.config.core).core,
	'database' : require(pie.paths.app.config.database).database
};
pie.app.routes = require(pie.paths.app.config.routes).routes;

Inflector  = require(pie.paths.pie.inflector);
Model      = require(pie.paths.pie.model).Model;
Controller = require(pie.paths.pie.controller.controller).Controller;
Sanitize   = require(pie.paths.pie.sanitize);

pie.fs   = require('fs');
pie.sys  = require('sys');
pie.mime = require(pie.paths.pie.modules.mime);

pie.util = require('util');
pie.url  = require('url');
pie.dns  = require('dns');
pie.http = require('http');
pie.https = require('https');
pie.intervals = new Array();


express = require(pie.paths.pie.modules.express);
connect = require('connect');
server  = express.createServer(
	express.favicon(),
	express.bodyParser(),
	express.cookieParser(),
	express.session({
		secret: pie.config.app.core.secret
	}),
	connect.basicAuth('admin', 'a32')
);

require(pie.paths.pie.boot).boot(function() {
	pie.app.models.Site.find('all',{},function(result){
        result.Site.forEach(function(site){
            pie.app.controllers.SitesController.addInterval(site.id, site);
        });
    });
    
	require(pie.paths.pie.dispatcher).dispatch();

});
