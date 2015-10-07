'use strict';
var model = {
    avrgBucketCount: 0
};
var results = {
    spoofCount: 0,
    spoofs: [],
    realTrajectories: []
};

var trainingAlgorithms = [bucketTraining];
var detectionAlgorithms = [bucketDetection];

function SpoofDetector() {}

SpoofDetector.prototype.detectSpoofs = function(trajectories, spoofs) {

    console.log("detecting Spoofs");

    trainModel(trajectories);
    analyseTrajectories(spoofs);
    analyseTrajectories(trajectories);
    printResults(results);
    return this.results;
}

/*
	Trains the model by analysing real trajectories
*/
function trainModel(trajectories) {
    console.log('Training the model with real trajectories');
    for (var i = 0; i < trainingAlgorithms.length; i++) {
        trainingAlgorithms[i](trajectories);
    }
}

/**
* Applies detectionAlgorithms to the trajectories
*/
function analyseTrajectories(trajectories) {
    for (var i = 0; i < detectionAlgorithms.length; i++) {
        for (var h = 0; h < trajectories.length; h++) {
            var trajectory = trajectories[h];
            if (detectionAlgorithms[i](trajectory).isSpoof) {
                results.spoofs.push(trajectory);
            } else {
                results.realTrajectories.push(trajectory);
            };
        }
    }
}

function printResults() {
    console.log('Number of spoofs:', results.spoofs.length);
    console.log('Number of real trajectories:', results.realTrajectories.length);
}



/**
######################################################################################################################
											Training Algos
######################################################################################################################
*/
function bucketTraining(trajectories) {
    var bucketCount = -1;
    var biggestBucket = -1;
    var smallestBucket = -1;

    for (var i = 0; i < trajectories.length; i++) {
        var trajectory = trajectories[i];
        var distribution = trajectory.featureVector.distribution;
        bucketCount += Object.keys(distribution).length;
    }
    model.avrgBucketCount = bucketCount / trajectories.length;
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
function bucketDetection(trajectory) {
	//just to make sure the result is interpreted right by the coder...
    return {isSpoof : (Object.keys(trajectory.featureVector.distribution).length > model.avrgBucketCount)};
}

module.exports = new SpoofDetector();
