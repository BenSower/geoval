var rekuire = require('rekuire'),
    SpoofDetector = require('./SpoofDetector'),
    async = require('async');

var Trajectory = rekuire('trajectory.model');

function Analyser() {}

Analyser.prototype.analyse = function(cb) {

    async.parallel({
            trajectories: function(callback) {
                Trajectory.find({
                    'properties.spoofLvL': 0
                }, function(err, trajectories) {
                    callback(err, trajectories);
                });
            },
            spoofs: function(callback) {
                Trajectory.find({
                    'properties.spoofLvL': 1
                }, function(err, trajectories) {
                    callback(err, trajectories);
                });
            }
        },
        function(err, results) {
            // results is now equals to: {one: 1, two: 2}
            var result = SpoofDetector.detectSpoofs(results.trajectories, results.spoofs);
            cb(null, {
                message: 'everything ok'
            });
        });
}

module.exports = new Analyser();
