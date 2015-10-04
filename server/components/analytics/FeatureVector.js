var geolib = require('geolib'),
    rekuire = require('rekuire'),
    TrajUtils = rekuire('TrajUtils');

function FeatureVector() {}

FeatureVector.prototype.sampleAmount = -1;
FeatureVector.prototype.outliers = -1;
FeatureVector.prototype.distribution = {};

FeatureVector.prototype.extractFeatures = function(trajectory, cb) {
    console.log("extracting Features");
    this.sampleAmount = trajectory.geometry.coordinates.length;
    this.distribution = this.getLocDiffDistribution(trajectory);
    cb(null, this);
}

/**
    Calculates the amount of times a certain spatial difference between
    two points appears in a trajectory. E.g. {5 [meters] : 2 [times], 6[meters]: 5 [times]}
*/
FeatureVector.prototype.getLocDiffDistribution = function(trajectory) {

    //calculate distances between every coordinate and the next one
    var buckets = {
        'biggestDistance': 0
    };
    for (var i = 0; i < trajectory.geometry.coordinates.length - 1; i++) {
        var firstCoordinate = trajectory.geometry.coordinates[i];
        var secondCoordinate = trajectory.geometry.coordinates[i + 1];
        var distance = geolib.getDistance({
            latitude: firstCoordinate[1],
            longitude: firstCoordinate[0]
        }, {
            latitude: secondCoordinate[1],
            longitude: secondCoordinate[0]
        });

        if (distance > buckets.biggestDistance) {
            buckets.biggestDistance = distance;
        }

        //var bucketedDistance = Math.round(distance / 10) * 10
        var bucketedDistance = Math.round(distance);
        if (buckets[bucketedDistance] === undefined) {
            buckets[bucketedDistance] = 1;
        } else {
            buckets[bucketedDistance]++;
        }
    }

    if (buckets == undefined) {
        log_info('Error creating getOutlierProperties!');
        return null;
    }

    return buckets;
}

function FeatureVector() {}

module.exports = new FeatureVector();
