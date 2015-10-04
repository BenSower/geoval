'use strict';

var _ = require('lodash');
var rekuire = require('rekuire');
var Trajectory = require('./trajectory.model');
var Analyser = rekuire('Analyser');
var MysqlConnector = rekuire('mysqlTunnelModule'),
    db = new MysqlConnector(),
    Busboy = require('busboy'),
    log_info = require('debug')('info'),
    log_debug = require('debug')('debug'),
    fs = require('fs'),
    os = require('os'),
    path = require('path'),
    TrajUtils = rekuire('TrajUtils'),
    TrajectorySpoofFactory = rekuire('SpoofFactory'),
    SpoofFactory = new TrajectorySpoofFactory();

// Get list of trajectories
exports.index = function(req, res) {
    Trajectory.find(function(err, trajectories) {
        if (err) {
            return handleError(err,res);
        }
        return res.json(200, trajectories);
    });
};

// Get a single trajectory
exports.show = function(req, res) {
    Trajectory.findById(req.params.id, function(err, trajectory) {
        if (err) {
            return handleError(err,res);
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
            console.log(err);
            return handleError(err,res);
        }
        if (res !== null && res !== undefined) {
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
            return handleError(err,res);
        }
        if (!trajectory) {
            return res.send(404);
        }
        var updated = _.merge(trajectory, req.body);
        updated.save(function(err) {
            if (err) {
                return handleError(err,res);
            }
            return res.json(200, trajectory);
        });
    });
};


// Deletes a trajectory from the DB.
exports.destroy = function(req, res) {
    Trajectory.findById(req.params.id, function(err, trajectory) {
        if (err) {
            return handleError(err,res);
        }
        if (!trajectory) {
            return res.send(404);
        }
        trajectory.remove(function(err) {
            if (err) {
                return handleError(err,res);
            }
            return res.send(204);
        });
    });
};

// Deletes all trajectories from the DB.
exports.dropAll = function(req, res) {
    Trajectory.remove({}, function(err) {
        if (err) {
            return handleError(err,res);
        }
        return res.send(204);
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


// Updates an existing trajectory in the DB.
exports.parseGPXandImportData = function(req, res) {

    var busboy = new Busboy({
        headers: req.headers
    });


    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        log_info('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

        //create filename
        var timestamp = new Date().toISOString();
        var gpxFilePath = path.join(os.tmpDir(), timestamp + '_' + path.basename(filename));

        //create writestream
        var writeStream = fs.createWriteStream(gpxFilePath);

        //attach writestream to file
        file.pipe(writeStream);

        //parse json file when file is written
        writeStream.on('finish', function() {

            log_info('File was written, starting gpx to geoJson conversion.');
            var geoJson = TrajUtils.convertGpxToGeoJson(gpxFilePath)
            log_info('file converted to geoJson, number of timestamps:', geoJson.geometry.coordinates.length);

            //upsert data into db
            log_info('Upserting trajectory into db');
            upsert(geoJson);
        });


        file.on('end', function() {
            log_info('File [' + filename + '] Finished uploading');
            log_debug('uploaded file:', file);
        });
    });

    busboy.on('finish', function() {
        log_info('Done parsing form!');
        res.json(200, {
            'msg': 'File uploaded successfully'
        });
    });

    //adding busboy parser to request
    req.pipe(busboy);
};



// Deletes a trajectory from the DB.
exports.importMediaQ = function(req, res) {
    log_info('Importing trajectories from mediaQ');

    var query = 'SELECT VideoId, PLat, Plng, TimeCode FROM MediaQ_V2.VIDEO_METADATA ORDER BY VideoId ASC, TimeCode ASC;';

    queryMediaQ(query, function(rows) {
        var trajectoryCounter = 0,
            trajectory = null;

        for (var i = 0; i < rows.length; i++) {
            var videoSlice = rows[i];

            //create initial tmp trajectory
            if (trajectory === null) {
                trajectory = TrajUtils.createNewTmpTrajectory(videoSlice);
            }
            //save trajectory and create new trajectory
            if (videoSlice.VideoId !== trajectory.id || i === rows.length - 1) {

                var trajectory = TrajUtils.preprocess(trajectory);
                
                if (trajectory.geometry.coordinates.length !== 0) {
                    //upsert tmp trajectory
                    upsert(trajectory);
                    trajectoryCounter++;
                }

                //create new tmp trajectory
                trajectory = TrajUtils.createNewTmpTrajectory(videoSlice);
            } else {
                trajectory.geometry.coordinates.push(
                    [videoSlice.Plng, videoSlice.PLat]
                );
                trajectory.properties.coordTimes.push(videoSlice.TimeCode);
            }
        }
        log_info('imported ' + trajectoryCounter + ' videos from MediaQ');

        return res.json({
            importedVideos: trajectoryCounter
        });
    });
};

exports.createLvL1Spoofs = function(req, res) {

    var amount = parseInt(req.body.amount);
    var spoofs = SpoofFactory.createLvL1Spoofs(amount);

    for (var i = 0; i < spoofs.length; i++) {
        //hijacking the crud api
        var spoof = {body : spoofs[i]};
        createTrajectory(spoof, null);
    }

    return res.json({
        message: 'OK',
        amount: amount
    });
}

exports.analyse = function(req, res) {
    Analyser.analyse(function(err, result) {
        if (err) {
            return handleError(err,res);
        }
        return res.json(200, result);
    });
};

function queryMediaQ(query, fn) {
    db.query(query, function(rows, fields) {
        fn(rows, fields);
    }, 10);
}


function handleError(err,res) {
    return res.send(500, err);
}
