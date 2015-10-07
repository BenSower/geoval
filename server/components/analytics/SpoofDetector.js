'use strict';


SpoofDetector.prototype.model = {
    avrgBucketCount: 0
};
SpoofDetector.prototype.results = {
    falseSpoofs: [], //trajectories which are classified as spoofs
    falseTrajectories: [], //spoofs which are classified as trajectories
    spoofs: [],
    realTrajectories: []
};

SpoofDetector.prototype.trainingAlgorithms = [bucketTraining];
SpoofDetector.prototype.detectionAlgorithms = [bucketDetection];

function SpoofDetector() {}

SpoofDetector.prototype.detectSpoofs = function(trajectories, spoofs) {

    console.log("detecting Spoofs");

    SpoofDetector.prototype.rawTrajectories = trajectories;
    SpoofDetector.prototype.rawSpoofs = spoofs;

    this.trainModel(trajectories);
    this.analyseTrajectories(spoofs);
    this.analyseTrajectories(trajectories);
    this.presentResults(this.results);
    return this.results;
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
                (trajectory.properties.spoofLvL === 0) ? this.results.falseSpoofs.push(trajectory): this.results.spoofs.push(trajectory);
            } else {
                (trajectory.properties.spoofLvL === 0) ? this.results.realTrajectories.push(trajectory): this.results.falseTrajectories.push(trajectory);
            };
        }
    }
}

SpoofDetector.prototype.presentResults = function() {
    var spoofCount = this.results.spoofs.length;
    var realTrajCount = this.results.realTrajectories.length;
    var falseSpoofCount = this.results.falseSpoofs.length;
    var falseTrajCount = this.results.falseTrajectories.length;

    console.log('Correctly classified spoofs:', spoofCount);
    console.log('Falsely classified spoofs:', falseTrajCount);
    console.log('Correctly classified trajectories:', realTrajCount);
    console.log('Falsely classified trajectories:', falseSpoofCount);

    var detectionRate = (spoofCount / this.rawSpoofs.length) * 100;
    console.log('Spoof classification rate: ' + detectionRate + '%');

    var detectionRate = (realTrajCount / this.rawTrajectories.length) * 100;
    console.log('Trajectory classification rate: ' + detectionRate.toFixed(2) + '%');
}



/**
######################################################################################################################
											Training Algos
######################################################################################################################
*/
function bucketTraining(model, trajectories) {
    var bucketCount = -1;
    var biggestBucket = -1;
    var smallestBucket = -1;

    for (var i = 0; i < trajectories.length; i++) {
        var trajectory = trajectories[i];
        var distribution = trajectory.featureVector.distribution;
        bucketCount += Object.keys(distribution).length;
    }
    model.avrgBucketCount = bucketCount / trajectories.length;
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
    var testResult = (Object.keys(trajectory.featureVector.distribution).length > model.avrgBucketCount);
    //just to make sure the result is interpreted right by the coder...
    return {
        isSpoof: testResult
    };
}

module.exports = new SpoofDetector();
