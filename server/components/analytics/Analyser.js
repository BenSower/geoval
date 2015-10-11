var rekuire = require('rekuire'),
    SpoofDetector = require('./SpoofDetector'),
    async = require('async'),
    mongoose = require('mongoose');

var Trajectory = mongoose.model('Trajectory');

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
            lvl1spoofs: function(callback) {
                Trajectory.find({
                    'properties.spoofLvL': 1
                }, function(err, lvl1spoofs) {
                    callback(err, lvl1spoofs);
                });
            },
            lvl2spoofs: function(callback) {
                Trajectory.find({
                    'properties.spoofLvL': 2
                }, function(err, lvl2spoofs) {
                    callback(err, lvl2spoofs);
                });
            }
        },
        function(err, results) {
            // results is now equals to: {one: 1, two: 2}
            //var lvl1Result = SpoofDetector.detectSpoofs(results.trajectories, results.lvl1spoofs);
            var lvl2Result = SpoofDetector.detectSpoofs(results.trajectories, results.lvl2spoofs);
            cb(null, {
                message: 'everything ok'
            });
        });
}

module.exports = new Analyser();
