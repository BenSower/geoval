'use strict';

var _ = require('lodash');
var rekuire = require('rekuire');
var Trajectory = require('./trajectory.model');
var MysqlConnector = rekuire('mysqlTunnelModule'),
    db = new MysqlConnector(),
    Busboy = require('busboy'),
    util = require('util'),
    log_info = require('debug')('info'),
    log_debug = require('debug')('debug'),
    ToGeoJson = require('togeojson'),
    jsdom = require('jsdom').jsdom,
    fs = require('fs'),
    os = require('os'),
    path = require('path');

// Get list of trajectories
exports.index = function(req, res) {
    Trajectory.find(function(err, trajectories) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, trajectories);
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
        log_info('Upserted ' + traj.id);
    });
}

function convertGpxToGeoJson(gpxFilePath) {
    //load file
    var gpxFileObj = fs.readFileSync(gpxFilePath, 'utf8');
    //get dom tree from gpx file
    var gpx = jsdom(gpxFileObj);

    //convert from gpx to geojson
    var converted = ToGeoJson.gpx(gpx, {
        styles: true
    });
    log_info('file converted to geoJson');
    log_debug('Raw data: ', converted);

    //Selecting first/only trajectory in file
    var geoJson = converted.features[0];

    //setting the filename
    geoJson.id = path.basename(gpxFilePath);

    return geoJson;
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
            var geoJson = convertGpxToGeoJson(gpxFilePath);
            log_info('file converted to geoJson, number of timestamps:', geoJson.geometry.coordinates.length);
            
            //upsert data into db
            log_info('Upserting trajectory into db');
            upsert(geoJson);

            res.json(200, {
                'msg': 'File uploaded successfully'
            });
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
                trajectory = createNewTmpTrajectory(videoSlice);
            }
            if (videoSlice.VideoId !== trajectory.id) {
                //upsert tmp trajectory
                upsert(trajectory);
                trajectoryCounter++;

                //create new tmp trajectory
                trajectory = createNewTmpTrajectory(videoSlice);
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




/*
    Creates a new Trajectory object
*/
function createNewTmpTrajectory(videoSlice) {
    var trajectory = {
        id: videoSlice.VideoId,
        time: [videoSlice.TimeCode],
        geometry: {
            type: 'LineString',
            coordinates: [
                [videoSlice.Plng, videoSlice.PLat]
            ]
        }
    }
    return trajectory;
}


function queryMediaQ(query, fn) {
    db.query(query, function(rows, fields) {
        fn(rows, fields);
    }, 10);
}


function handleError(res, err) {
    return res.send(500, err);
}