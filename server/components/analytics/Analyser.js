var rekuire = require('rekuire'),
    SpoofDetector = require('./SpoofDetector');

var Trajectory = rekuire('trajectory.model');

function Analyser() {}

Analyser.prototype.analyse = function(cb) {

    cb(null, {
        message: 'everything ok'
    });

}


module.exports = new Analyser();