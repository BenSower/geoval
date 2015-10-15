'use strict';
var Table = require('cli-table');


SpoofDetector.prototype.model = {
    buckets: {
        avrgMinBucket: -1,
        avrgMaxBucket: -1,
        avrgBucketCount: -1
    },
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
        "Correctly classified spoofs",
        "Falsely classified spoofs",
        "Correctly classified trajectories",
        "Falsely classified trajectories",
        "Spoof classification rate",
        "Trajectory classification rate"
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
        row[algorithm] = [spoofCount, falseTrajCount, realTrajCount, falseSpoofCount, spoofDetectionRate + '%', trajDetectionRate.toFixed(2) + '%'];
        table.push(row);
    }

    console.log(table.toString());

}



/**
######################################################################################################################
                                            Training Algos
######################################################################################################################
*/
function bucketTraining(model, trajectories) {
    var bucketCount = 0;
    var minBucketSum = 0;
    var maxBucketSum = 0;

    var minRed = function(a, b) {
        if (b === 'biggestDistance')
            return a;
        else
            return Math.min(a, b);
    };

    for (var i = 0; i < trajectories.length; i++) {
        var trajectory = trajectories[i];
        var distribution = trajectory.featureVector.distribution;
        bucketCount += Object.keys(distribution).length;
        maxBucketSum += distribution.biggestDistance;
        //console.log(distribution.biggestDistance);
        var buckets = Object.keys(distribution);
        var smallesBucket = buckets.reduce(minRed);

        minBucketSum += smallesBucket;
    }
    model.buckets.avrgBucketCount = bucketCount / trajectories.length;
    model.buckets.avrgMinBucket = Math.min(0, minBucketSum / trajectories.length);
    model.buckets.avrgMaxBucket = maxBucketSum / trajectories.length;
    //console.log(model);
    return model;
}

/*
    Counts and averages the amount of samples in a trajectory
*/
function timeTraining(model, trajectories) {
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
function timeDetection(model, trajectories) {
    return {
        isSpoof: 1,
        p: 0
    };

}



/*
    Returns false, if number of buckets > model number of buckets
*/
function bucketDetection(model, trajectory) {
    var bucketCount = Object.keys(trajectory.featureVector.distribution).length;

    var isInAvrgRange = (bucketCount > model.buckets.avrgMinBucket && bucketCount < model.buckets.avrgMaxBucket);
    var maxDistToMedian = Math.max(model.buckets.avrgBucketCount - model.buckets.avrgMinBucket, model.buckets.avrgMaxBucket - model.buckets.avrgBucketCount);
    //probability in percent, that the trajectory is real
    var p = 0;
    if (isInAvrgRange) {
        //p = (maxDistToMedian - bucketCount) / maxDistToMedian * 100;
        p = Math.pow((maxDistToMedian - bucketCount) / maxDistToMedian, 2) * 100;
    }
    /*
    console.log('bucketcount', bucketCount);
    console.log('minbucket', model.buckets.avrgMinBucket);
    console.log('maxbucket', model.avrgMaxBucket);
    console.log('model.buckets.avrgBucketCount', model.buckets.avrgBucketCount);
    console.log('maxDistToMedian', maxDistToMedian);
    console.log('Probability', p);
    */


    //just to make sure the result is interpreted right by the coder...
    return {
        isSpoof: p < 1,
        p: p
    };
}

module.exports = new SpoofDetector();
