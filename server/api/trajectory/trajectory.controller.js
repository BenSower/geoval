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

    var query = 'SELECT VideoId, PLat, Plng, TimeCode FROM MediaQ_V2.VIDEO_METADATA;'

    queryMediaQ(query, function(rows) {
        var results = {};
        for (var i = 0; i < rows.length; i++) {
            var videoSlice = rows[i];
            if (results[videoSlice.VideoId] === undefined) {
                results[videoSlice.VideoId] = {
                    videoId: videoSlice.VideoId,
                    timestamp: videoSlice.TimeCode,
                    location: [
                        [videoSlice.Plng, videoSlice.PLat]
                    ]
                }
            } else {
                results[videoSlice.VideoId].location.push(
                    [videoSlice.Plng, videoSlice.PLat]
                );
            }
        }
        var fs = require('fs');
        fs.writeFile('/tmp/test', JSON.stringify(results), function(err) {
            if (err) {
                return console.log(err);
            }

            console.log('The file was saved!');
            return res.send(200);
        });
    });

};

function queryMediaQ(query, fn) {

    db.query(query, function(rows, fields) {
        fn(rows, fields);
    }, 10);
}


function handleError(res, err) {
    return res.send(500, err);
}
