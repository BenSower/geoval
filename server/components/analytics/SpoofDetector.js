'use strict';

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

SpoofDetector.prototype.trainingAlgorithms = [bucketTraining, sampleCountTraining];
SpoofDetector.prototype.detectionAlgorithms = [bucketDetection];

function SpoofDetector() {}

SpoofDetector.prototype.detectSpoofs = function(trajectories, spoofs) {

    console.log("detecting Spoofs");

    SpoofDetector.prototype.rawTrajectories = trajectories;
    SpoofDetector.prototype.rawSpoofs = spoofs;

    this.resetResults();
    this.trainModel(trajectories);
    this.analyseTrajectories(spoofs);
    this.analyseTrajectories(trajectories);
    this.presentResults(this.results);
    return this.results;
}

SpoofDetector.prototype.resetResults = function() {
    this.results = {
        falseSpoofs: [], //trajectories which are classified as spoofs
        falseTrajectories: [], //spoofs which are classified as trajectories
        spoofs: [],
        realTrajectories: []
    };
}

/*
    Trains the model by analysing real trajectories
*/
SpoofDetector.prototype.trainModel = function(trajectories) {
    console.log('Training the model with real trajectories');
    for (var i = 0; i < this.trainingAlgorithms.length; i++) {
        this.model = this.trainingAlgorithms[i](this.model, trajectories);
    }
}

/**
 * Applies detectionAlgorithms to the trajectories
 */
SpoofDetector.prototype.analyseTrajectories = function(trajectories) {

    for (var i = 0; i < this.detectionAlgorithms.length; i++) {
        for (var h = 0; h < trajectories.length; h++) {
            var trajectory = trajectories[h];
            if (this.detectionAlgorithms[i](this.model, trajectory).isSpoof) {
                var tmp = (trajectory.properties.spoofLvL === 0) ? this.results.falseSpoofs.push(trajectory) : this.results.spoofs.push(trajectory);
            } else {
                var tmp2 = (trajectory.properties.spoofLvL === 0) ? this.results.realTrajectories.push(trajectory) : this.results.falseTrajectories.push(trajectory);
            }
        }
    }
}

SpoofDetector.prototype.presentResults = function() {
    var spoofCount = this.results.spoofs.length;
    var realTrajCount = this.results.realTrajectories.length;
    var falseSpoofCount = this.results.falseSpoofs.length;
    var falseTrajCount = this.results.falseTrajectories.length;

    console.log('\n#########################################');
    console.log('Results: \n');
    console.log('Correctly classified spoofs:', spoofCount);
    console.log('Falsely classified spoofs:', falseTrajCount);
    console.log('Correctly classified trajectories:', realTrajCount);
    console.log('Falsely classified trajectories:', falseSpoofCount);

    var spoofDetectionRate = (spoofCount / this.rawSpoofs.length) * 100;
    console.log('Spoof classification rate: ' + spoofDetectionRate + '%');

    var trajDetectionRate = (realTrajCount / this.rawTrajectories.length) * 100;
    console.log('Trajectory classification rate: ' + trajDetectionRate.toFixed(2) + '%');

    console.log('\n#########################################');

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
function sampleCountTraining(model, trajectories) {

    var sampleAmountSum = trajectories.reduce(function(a, b) {
        return a + b.geometry.coordinates.length;
    }, 0);

    var minLength = trajectories.reduce(function(a, b) {
        return Math.min(a, b.geometry.coordinates.length);
    }, trajectories[0].geometry.coordinates.length);

    var maxLength = trajectories.reduce(function(a, b) {
        return Math.max(a, b.geometry.coordinates.length);
    }, trajectories[0].geometry.coordinates.length);

    model.sampleCount.minSampleCount = minLength;
    model.sampleCount.maxSampleCount = maxLength;
    model.sampleCount.avrgSampleCount = Math.round(sampleAmountSum / trajectories.length);
    return model;
}

/**
######################################################################################################################
                                            Detection Algos
                                    An algo needs to return and object like {isSpoof : true}
######################################################################################################################
*/

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
