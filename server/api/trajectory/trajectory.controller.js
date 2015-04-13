'use strict';

var _ = require('lodash');
var rekuire = require('rekuire');
var Trajectory = require('./trajectory.model');
var MysqlConnector = rekuire('mysqlTunnelModule'),
    db = new MysqlConnector(),
    log_info = require('debug')('info'),
    log_debug = require('debug')('debug');

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
//returns 201 and the trajectory if everything went fine
//returns the trajectory if no response header was specified.
function createTrajectory(req, res) {
    Trajectory.create(req.body, function(err, trajectory) {
        if (err) {
            return handleError(res, err);
        }
        if (res !== null) {
            return res.json(201, trajectory);
        } else {
            return trajectory
        }
    });
}

exports.create = createTrajectory;



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


function upsert(trajectory) {
    var traj = new Trajectory(trajectory),
        upsertData = traj.toObject();

    delete upsertData._id;
    Trajectory.update({
        id: traj.id
    }, upsertData, {
        upsert: true
    }, function(err) {
        if (err) {
            throw err;
        }
        log_debug('Upserted ' + traj.id);
    });

}

// Deletes a trajectory from the DB.
exports.importMediaQ = function(req, res) {
    log_info('Importing trajectories from mediaQ');

    var query = 'SELECT VideoId, PLat, Plng, TimeCode FROM MediaQ_V2.VIDEO_METADATA ORDER BY VideoId ASC, TimeCode ASC;';

    queryMediaQ(query, function(rows) {
        var trajectoryCounter = 0,
            trajectory = {};

        for (var i = 0; i < rows.length; i++) {
            var videoSlice = rows[i];
            if (videoSlice.VideoId !== trajectory.id) {
                //upsert tmp trajectory
                upsert(trajectory);
                trajectoryCounter++;

                //create new tmp trajectory
                trajectory = {
                    id: videoSlice.VideoId,
                    time: [videoSlice.TimeCode],
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [videoSlice.Plng, videoSlice.PLat]
                        ]
                    }
                }
            } else {
                trajectory.geometry.coordinates.push(
                    [videoSlice.Plng, videoSlice.PLat]
                );
                trajectory.time.push(videoSlice.TimeCode);
            }
        }
        log_info('imported ' + trajectoryCounter + ' videos from MediaQ');

        return res.json({
            importedVideos: trajectoryCounter
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
