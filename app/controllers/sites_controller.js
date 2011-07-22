var SitesController = exports.SitesController = new Controller({
	'name' : 'Site',
	'helpers' : [
		'Html',
		'Form'
	]
});

// Not doing anything here... yet!
exports.beforeFilter = function(request, response, callback) {
	callback(request, response);
}

exports.index = function(request, response) {
	// Find all posts
	SitesController.Site.find('all', {}, function(results) {
		// Send the results to render the view
		SitesController.set(request, response, results);
	});
}

exports.view = function(request, response) {
	var id = request.namedParams.id;

	// Find the first post that matches the passed id
	SitesController.Site.find('first', {
		'conditions' : {
			'id' : id
		},
		'contain' : {
			'Check': {
			    'limit': 100,
			    'order': 'id DESC'
			}
		}
	}, function(results) {
		// Send the results to render the view
//		console.log(results);
		SitesController.set(request, response, results);
	});
}

exports.add = function(request, response) {
	var data = request.data;

	if (typeof data === 'undefined') {
		SitesController.set(request, response);
	} else {
	    pie.dns.resolve4(data.Site.host, function(err, adresses){
	        data.Site.adress = adresses[0];
    		SitesController.Site.save(data, function(info) {
			    if (info !== false) {
				    request.flash('info', 'Site has been added.');
				    exports.addInterval(info.insertId, data.Site);
			    } else {
				    request.flash('info', 'Failed to add the site.');
			    }
			    SitesController.redirect(response, { 'controller' : 'sites' });
		    });

	    });
	}
}

exports.edit = function(request, response) {
	var data = request.data;

	// Find the site data since nothing has been POSTed
	if (typeof data === 'undefined' && !data) {
		var id = request.namedParams.id;

		SitesController.Site.find('first', {
			'conditions' : {
				'id' : id
			}
		}, function(results) {
			// Send the results to render the view
			SitesController.set(request, response, results);
		});
	} else {
		SitesController.Site.save(data, function(info) {
			if (info !== false) {
			    exports.addInterval(data.Site.id, data.Site);
				request.flash('info', 'Site has been edited.');
			} else {
				request.flash('info', 'Failed to edit the post.');
			}

			SitesController.redirect(response, { 'action' : 'view', 'id' : data.Site.id });
		});
	}
}

exports.remove = function(request, response) {
	var id = request.namedParams.id;

	SitesController.Site.remove({
		'id' : id
	}, function(results) {
		var	success;

		if (results) {
		    exports.removeInterval(id);
			success = 'Site deleted.';
		} else {
			success = 'Failed to delete site.';
		}

		request.flash('info', success);
		SitesController.redirect(response, { 'controller' : 'sites' });
	});
}

exports.saveCheck = function(site_id, startTime, status){
    latency = new Date().getTime() - startTime;
    data = {Check: {site_id: site_id, date: startTime, status: status, latency: latency}};
    pie.app.models.Check.save(data,function(){});
}

exports.removeInterval = function(site_id){
    if(typeof pie.intervals[site_id] !== 'undefined'){
        clearInterval(pie.intervals[site_id]);
    }
}

exports.addInterval = function(site_id, site){
    
    exports.removeInterval(site_id);
    
    var options = {
        host: site.adress,
        port: site.port,
        path: site.path,
        headers: {'host': site.host}
    };
    
    if(site.protocol === 'http'){
        var protocol = 'http'; 
    }else if(site.protocol === 'https'){
        var protocol = 'https';
    }else{
        throw new Error('protocol must be http or https');
    }
    
    pie.intervals[site_id] = setInterval(function(){

        var startTime = new Date().getTime();
        
        var req = pie[protocol].get(options, function(res) {
            res.on('error', function(err){
                exports.saveCheck(site_id, startTime, err.message);
            });
            res.on('end', function(){
                exports.saveCheck(site_id, startTime, res.statusCode);
            });
        });
        
        req.on('end', function(err){
            exports.saveCheck(site_id, startTime, err.message);
        });
        req.on('error',function(err){
            exports.saveCheck(site_id, startTime, err.message);
        });
	}, site.frequency*1000);
};
