function SpoofDetector() {}

var model = {avrgBucketCount : 0};
var results = {spoofCount : 0, spoofs : [], noSpoofs : []};

SpoofDetector.prototype.detectSpoofs = function(trajectories, spoofs) {
	
	console.log("detecting Spoofs");

	trainModel(trajectories);
	analyseSpoofs(spoofs);
	return this.results;
}

/*
	Trains the model by analysing real trajectories
*/
function trainModel(trajectories){
	console.log('Training the model with real trajectories');
	
	var bucketCount = -1;
	var biggestBucket = -1;
	var smallestBucket = -1;

	for (var i = 0; i < trajectories.length; i++){
		var trajectory = trajectories[i];
		var distribution = trajectory.featureVector.distribution;
		bucketCount += Object.keys(distribution).length;
	}
	model.avrgBucketCount = bucketCount/trajectories.length;
}


function analyseSpoofs(spoofs){
	console.log('Looking for spoofs');
	for (var i = 0; i < spoofs.length; i++){
		var spoof = spoofs[i];
		if (Object.keys(spoof.featureVector.distribution).length > model.avrgBucketCount){
			results.spoofs.push(spoof);
		} else {
			results.noSpoofs.push(spoof);
		}
	}
	console.log(results.spoofs.length, results.noSpoofs.length);
}
module.exports = new SpoofDetector();