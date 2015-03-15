'use strict';

var _ = require('lodash');
var rekuire = require('rekuire');
var Trajectory = require('./trajectory.model');
var MysqlConnector = rekuire('mysqlTunnelModule'),
    db = new MysqlConnector();

// Get list of trajectorys
exports.index = function(req, res) {
    Trajectory.find(function(err, trajectorys) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, trajectorys);
    });
};

// Get a single trajectory
exports.show = function(req, res) {
    Trajectory.findById(req.params.id, function(err, trajectory) {
        if (err) {
            return handleError(res, err);
        }
        if (!trajectory) {
            return res.send(404);
        }
        return res.json(trajectory);
    });
};

// Creates a new trajectory in the DB.
exports.create = function(req, res) {
    Trajectory.create(req.body, function(err, trajectory) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(201, trajectory);
    });
};

// Updates an existing trajectory in the DB.
exports.update = function(req, res) {
    if (req.body._id) {
        delete req.body._id;
    }
    Trajectory.findById(req.params.id, function(err, trajectory) {
        if (err) {
            return handleError(res, err);
        }
        if (!trajectory) {
            return res.send(404);
        }
        var updated = _.merge(trajectory, req.body);
        updated.save(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.json(200, trajectory);
        });
    });
};

// Deletes a trajectory from the DB.
exports.destroy = function(req, res) {
    Trajectory.findById(req.params.id, function(err, trajectory) {
        if (err) {
            return handleError(res, err);
        }
        if (!trajectory) {
            return res.send(404);
        }
        trajectory.remove(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.send(204);
        });
    });
};

// Deletes a trajectory from the DB.
exports.importMediaQ = function(req, res) {
    console.log('importing trajectories from mediaQ');
    
    var query = 'SELECT UserName,' +
        ' DeviceOs, LastActivityDate, count(VideoId) AS \'Uploaded Videos\'' +
        ' FROM MediaQ_V2.VIDEO_INFO' +
        ' INNER JOIN MediaQ_V2.VIDEO_USER USING(VideoId)' +
        ' INNER JOIN MediaQ_V2.USERS_PROFILES USING(UserId);';
    
    queryMediaQ(query, function(rows) {
        console.log(rows[0]);
    });
    return res.send(200);

};

function queryMediaQ(query, fn) {

    db.query(query, function(rows, fields) {
        fn(rows, fields);
    }, 10);
}


function handleError(res, err) {
    return res.send(500, err);
}
