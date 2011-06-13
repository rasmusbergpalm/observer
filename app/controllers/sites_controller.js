var SitesController = exports.SitesController = new Controller({
	'name' : 'Site',
	'helpers' : [
		'Html',
		'Form',
		'ShowCode'
	]
});

// Not doing anything here... yet!
exports.beforeFilter = function(request, response, callback) {
	callback(request, response);
}

exports.index = function(request, response) {
	// Find all posts
	SitesController.Site.find('all', {
		'contain' : {
			'User' : null
		}
	}, function(results) {
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
		'fields' : [
			'id',
			'user_id',
			'url',
			'frequency',
			'pattern'
		],
		'contain' : {
			'Check': null
		}
	}, function(results) {
		// Send the results to render the view
//		console.log(results);
		SitesController.set(request, response, results);
	});
}

addInterval = function(site_id, site){
    var url = pie.url.parse(site.url);
    var data = {Check:{}};
    var options = {
        host: url.host,
        port: (url.port || 80),
        path: url.pathname
    };  

    pie.intervals[site_id] = setInterval(function(){
        
        var startTime = new Date().getTime();
        var req = pie.http.get(options, function(res) {
            res.on('error', function(err){
                latency = new Date().getTime() - startTime;
                data.Check = {site_id: site_id, date: startTime, status: err.message, latency: latency};
                pie.app.models.Check.save(data,function(){});
                console.log('res:'+err.message);
            });
            res.on('end', function(){
                latency = new Date().getTime() - startTime;
                data.Check = {site_id: site_id, date: startTime, status: res.statusCode, latency: latency};
                pie.app.models.Check.save(data,function(){});
            });
        });
        req.on('error',function(err){
            latency = new Date().getTime() - startTime;
            data.Check = {site_id: site_id, date: startTime, status: err.message, latency: latency};
            pie.app.models.Check.save(data,function(){});
        });
	}, site.frequency*1000);
};

exports.add = function(request, response) {
	var data = request.data;

	if (typeof data === 'undefined') {
		SitesController.set(request, response);
	} else {
		SitesController.Site.save(data, function(info) {
//		console.log(info);
			if (info !== false) {
				request.flash('info', 'Site has been added.');
				addInterval(info.insertId, data.Site);
				
			} else {
				request.flash('info', 'Failed to add the post.');
			}

			SitesController.redirect(response, { 'controller' : 'sites' });
		});
	}
}

exports.edit = function(request, response) {
	var data = request.data;

	// Find the post data since nothing has been POSTed
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
				request.flash('info', 'Post has been edited.');
			} else {
				request.flash('info', 'Failed to edit the post.');
			}

			SitesController.redirect(response, { 'action' : 'view', 'id' : data.Post.id });
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
			success = 'Post deleted.';
		} else {
			success = 'Failed to delete post.';
		}

		request.flash('info', success);
		SitesController.redirect(response, { 'controller' : 'sites' });
	});
}
