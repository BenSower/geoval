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
    model = setTimeDistribution(model, trajectories);
    return model;
}

/**
######################################################################################################################
                                            Detection Algos
                            An algo needs to return and object like {isSpoof : true}
######################################################################################################################
*/

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
            model.timeDifference.normalizedDistribution[diff] = model.timeDifference.absoluteDistribution[diff] / trajectories.length;
        }
    }
    return model;

}
/*
    Counts and averages the amount of samples in a trajectory
*/
function timeDetection(model, trajectory) {

    var localModel = setTimeDistribution({}, [trajectory]);
    var misses = 0;
    var timeIntervalCount = Object.keys(localModel.timeDifference.absoluteDistribution).length;

    for (var key in localModel.timeDifference.absoluteDistribution) {
        if (!localModel.timeDifference.absoluteDistribution.hasOwnProperty(key)) {
            continue;
        }
        var diff;
        var diffs = []
        if (model.timeDifference.absoluteDistribution[key] !== undefined) {
            var localVal = localModel.timeDifference.absoluteDistribution[key];
            var modelVal =  model.timeDifference.absoluteDistribution[key];
            var diff = (localVal > modelVal) ? modelVal/localVal : localVal/modelVal;
            diffs.push(diff);
        }else {
            misses++;
        }
    }
    //console.log(misses + '/' + timeIntervalCount + ' missed.')

    var sum = diffs.reduce(function(a,b){
        return a+b;
    }, 0);
    var p = (sum / timeIntervalCount) * 100;

    return {
        isSpoof: p < 0.001,
        p: p
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
