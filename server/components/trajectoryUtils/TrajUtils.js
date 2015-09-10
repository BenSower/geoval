var log_info = require('debug')('info'),
    log_debug = require('debug')('debug'),
    fs = require('fs'),
    jsdom = require('jsdom').jsdom,
    ToGeoJson = require('togeojson'),
    path = require('path');

function TrajUtils() {}

TrajUtils.prototype.convertGpxToGeoJson = function(gpxFilePath) {
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


TrajUtils.prototype.getOutlierProperties = function(trajectory) {

    //calculate distances between every coordinate and the next one
    var biggestDistance = 0;
    var buckets = {};
    for (var i = 0; i < trajectory.geometry.coordinates.length - 1; i++) {
        var firstCoordinate = trajectory.geometry.coordinates[i];
        var secondCoordinate = trajectory.geometry.coordinates[i + 1];
        var distance = this.getDistanceFromLonLatInM(firstCoordinate[0], firstCoordinate[1], secondCoordinate[0], secondCoordinate[1]);
        if (distance > biggestDistance) {
            biggestDistance = distance;
        }
        //var bucketedDistance = Math.round(distance / 10) * 10
        var bucketedDistance = Math.round(distance);
        if (buckets[bucketedDistance] === undefined) {
            buckets[bucketedDistance] = 1;
        } else {
            buckets[bucketedDistance]++;
        }
    }

    if (biggestDistance == undefined || buckets == undefined){
        log_info('Error creating getOutlierProperties!');
        return null;
    }

    return {
        outlierThreshold: biggestDistance,
        distribution: buckets
    }
}


TrajUtils.prototype.deg2rad = function(deg) {
    return deg * (Math.PI / 180);
}

TrajUtils.prototype.getDistanceFromLonLatInM = function(lon1, lat1, lon2, lat2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2 - lat1); // deg2rad below
    var dLon = this.deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000;
}

/*
    Creates a new Trajectory object
*/
TrajUtils.prototype.createNewTmpTrajectory = function(videoSlice) {

    var trajectory = {
        id: videoSlice.VideoId,
        properties: {
            time: videoSlice.TimeCode,
            coordTimes: [],
            outlierThreshold: 0
        },
        geometry: {
            type: 'LineString',
            coordinates: []
        }
    };
    return trajectory;
}


module.exports = new TrajUtils();
