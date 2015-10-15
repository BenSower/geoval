'use strict';
var Table = require('cli-table');


SpoofDetector.prototype.model = {
    sampleCount: {
        avrgSampleCount: -1,
        minSampleCount: -1,
        maxSampleCount: -1
    }
};

SpoofDetector.prototype.results = {};

SpoofDetector.prototype.trainingAlgorithms = {
    bucketTraining: bucketTraining,
    timeTraining: timeTraining
};


SpoofDetector.prototype.detectionAlgorithms = {
    bucketDetection: bucketDetection,
    timeDetection: timeDetection
};

function SpoofDetector() {}

SpoofDetector.prototype.detectSpoofs = function(trajectories, spoofs) {

    SpoofDetector.prototype.rawTrajectories = trajectories;
    SpoofDetector.prototype.rawSpoofs = spoofs;

    this.resetResults();
    this.trainModel(trajectories);
    this.analyseTrajectories(spoofs);
    this.analyseTrajectories(trajectories);
    this.presentResults(this.results, spoofs[0].properties.spoofLvL);

    return this.results;
}

/*
    Reset/Initialize all results
*/
SpoofDetector.prototype.resetResults = function() {

    for (var algorithmKey in this.detectionAlgorithms) {
        if (this.detectionAlgorithms.hasOwnProperty(algorithmKey)) {
            this.results[algorithmKey] = {
                falseSpoofs: [], //trajectories which are classified as spoofs
                falseTrajectories: [], //spoofs which are classified as trajectories
                spoofs: [],
                realTrajectories: []
            };

        }
    }
}

/*
    Trains the model by analysing real trajectories
*/
SpoofDetector.prototype.trainModel = function(trajectories) {

    for (var algorithmKey in this.trainingAlgorithms) {
        if (this.trainingAlgorithms.hasOwnProperty(algorithmKey)) {
            this.model = this.trainingAlgorithms[algorithmKey](this.model, trajectories);
        }
    }
}

/**
 * Applies detectionAlgorithms to the trajectories
 */
SpoofDetector.prototype.analyseTrajectories = function(trajectories) {

    for (var algorithmKey in this.detectionAlgorithms) {
        for (var h = 0; h < trajectories.length; h++) {
            var trajectory = trajectories[h];
            if (this.detectionAlgorithms[algorithmKey](this.model, trajectory).isSpoof) {
                var tmp = (trajectory.properties.spoofLvL === 0) ? this.results[algorithmKey].falseSpoofs.push(trajectory) : this.results[algorithmKey].spoofs.push(trajectory);
            } else {
                var tmp2 = (trajectory.properties.spoofLvL === 0) ? this.results[algorithmKey].realTrajectories.push(trajectory) : this.results[algorithmKey].falseTrajectories.push(trajectory);
            }
        }
    }
}
SpoofDetector.prototype.presentResults = function(results, spoofLvL) {

    var columns = ['SpoofLvl' + spoofLvL,
        'Correct spoofs',
        'Wrong spoofs',
        'Correct trajs',
        'Wrong trajs',
        'Spoof rate',
        'Traj rate'
    ];
    var table = new Table({
        head: columns
    });


    for (var algorithm in results) {
        if (!results.hasOwnProperty(algorithm)) {
            continue;
        }

        var result = results[algorithm];

        var spoofCount = result.spoofs.length;
        var realTrajCount = result.realTrajectories.length;
        var falseSpoofCount = result.falseSpoofs.length;
        var falseTrajCount = result.falseTrajectories.length;
        var spoofDetectionRate = (spoofCount / this.rawSpoofs.length) * 100;
        var trajDetectionRate = (realTrajCount / this.rawTrajectories.length) * 100;

        var row = {};
        row[algorithm] = [spoofCount, falseTrajCount, realTrajCount, falseSpoofCount, spoofDetectionRate.toFixed(2) + '%', trajDetectionRate.toFixed(2) + '%'];
        table.push(row);
    }

    console.log(table.toString());

}

function compareIntMaps(vectorA, vectorB) {

    var misses = 0;
    var diffs = []

    for (var key in vectorA) {
        if (!vectorA.hasOwnProperty(key)) {
            continue;
        }
        var diff;
        if (vectorB[key] !== undefined) {
            var localVal = vectorA[key];
            var modelVal = vectorB[key];
            var diff = (localVal > modelVal) ? modelVal / localVal : localVal / modelVal;
            //perceńtage of how close the values are to each other in this bucket
            diffs.push(diff * 100);
        } else {
            misses++;
        }
    }

    var sum = diffs.reduce(function(a, b) {
        return a + b;
    }, 0);

    var possibleKeys = Object.keys(vectorA).length;
    var p = (sum / possibleKeys);

    return {
        p: p,
        misses: misses
    };
}

function setTimeDistribution(model, trajectories) {

    model.timeDifference = (typeof model.timeDifference === 'undefined') ? {} : model.timeDifference;
    model.timeDifference.absoluteDistribution = (typeof model.timeDifference.absoluteDistribution === 'undefined') ? {} : model.timeDifference.absoluteDistribution;
    model.timeDifference.normalizedDistribution = (typeof model.timeDifference.normalizedDistribution === 'undefined') ? {} : model.timeDifference.normalizedDistribution;

    for (var i = 0; i < trajectories.length; i++) {
        var trajectory = trajectories[i];
        for (var j = 0; j < trajectory.geometry.coordinates.length - 1; j++) {
            var coordinateA = new Date(trajectory.properties.coordTimes[j]);
            var coordinateB = new Date(trajectory.properties.coordTimes[j + 1]);
            var diff = coordinateB.getTime() - coordinateA.getTime();
            //initialize or increment
            model.timeDifference.absoluteDistribution[diff] = model.timeDifference.absoluteDistribution[diff] + 1 || 1;
        }
    }
    model.timeDifference.normalizedDistribution = getNormalizedDistribution(model.timeDifference.absoluteDistribution, trajectories);
    return model;
}

function getNormalizedDistribution(absoluteDistribution, trajectories) {
    var normalizedDistribution = absoluteDistribution;
    if (trajectories.length > 1) {
        //normalizing/averaging every bucket value
        for (var bucket in normalizedDistribution) {
            if (normalizedDistribution.hasOwnProperty(bucket)) {
                normalizedDistribution[bucket] = normalizedDistribution[bucket] / trajectories.length;
            }
        }
    }
    return normalizedDistribution;
}
/**
######################################################################################################################
                                            Training Algos
######################################################################################################################
*/
function bucketTraining(model, trajectories) {

    model.buckets = (typeof model.buckets === 'undefined') ? {} : model.buckets;
    model.buckets.absoluteDistribution = (typeof model.buckets.absoluteDistribution === 'undefined') ? {} : model.buckets.absoluteDistribution;
    model.buckets.normalizedDistribution = (typeof model.buckets.normalizedDistribution === 'undefined') ? {} : model.buckets.normalizedDistribution;

    for (var i = 0; i < trajectories.length; i++) {
        var trajectory = trajectories[i];
        for (var key in trajectory.featureVector.distribution) {
            //initialize or increment
            if (key !== 'biggestDistance') {
                model.buckets.absoluteDistribution[key] = model.buckets.absoluteDistribution[key] + 1 || 1;
            }
        }
    }
    model.buckets.normalizedDistribution = getNormalizedDistribution(model.buckets.absoluteDistribution, trajectories);

    return model;
}

/*
    Counts and averages the amount of samples in a trajectory
*/
function timeTraining(model, trajectories) {
    model = setTimeDistribution(model, trajectories);
    return model;
}

/**
######################################################################################################################
                                            Detection Algos
                            An algo needs to return and object like {isSpoof : true}
######################################################################################################################
*/

/*
    Counts and averages the amount of samples in a trajectory
*/
function timeDetection(model, trajectory) {

    var localModel = setTimeDistribution({}, [trajectory]);
    //console.log(localModel.timeDifference.absoluteDistribution);
    var comparisonResult = compareIntMaps(localModel.timeDifference.absoluteDistribution, model.timeDifference.normalizedDistribution);
    return {
        isSpoof: comparisonResult.p < 1.5,
        p: comparisonResult.p
    };
}

/*
    Returns false, if number of buckets > model number of buckets
*/
function bucketDetection(model, trajectory) {

    var comparisonResult = compareIntMaps(trajectory.featureVector.distribution, model.buckets.normalizedDistribution);

    return {
        isSpoof: comparisonResult.p < 7,
        p: comparisonResult.p
    };
}

module.exports = new SpoofDetector();
