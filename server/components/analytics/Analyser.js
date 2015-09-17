var rekuire = require('rekuire'),
	FeatureVector = require('./FeatureVector'),
	SpoofDetector = require('./SpoofDetector');

var Trajectory = rekuire('trajectory.model');

function Analyser() {}

Analyser.prototype.analyse = function(cb) {
    
    Trajectory.find(function(err, trajectories) {
        if (err) {
            cb(err);
        }
        var featureVectors = FeatureVector.extractFeatures(trajectories);
        var spoofResults = SpoofDetector.detectSpoofs(featureVectors);
        cb(null, {message : 'everything ok', results : spoofResults});
    });
}


module.exports = new Analyser();
