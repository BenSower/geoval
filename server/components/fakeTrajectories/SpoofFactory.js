var rekuire = require('rekuire'),
	TrajUtils = rekuire('TrajUtils');

function SpoofFactory() {}

//Base is center of munich
var baseCoordinates = {
    "lat": 48.13891266483958,
    "lon": 11.573041815506889
};

SpoofFactory.prototype.createLvL1Spoofs = function(number) {

    console.log('creating spoofed trajectories ' + number);
    var spoofs = [];

    for (var i = 0; i < number; i++) {
        spoofs.push(createLvl1Spoof());
    }

    //return spoofs;
    return {};
}


function createLvl1Spoof() {

	var maxLength = 200,
		minLength = 10,
		trajLength = getRandInt(minLength, maxLength),
		coordinates = createCoordinates(trajLength),
		times = createTimes(trajLength);

    var spoof = {
        properties: {
            coordTimes: times,
            spoofLvL: 1
        },
        geometry: {
            coordinates: coordinates
        }
    };

    var spoof = TrajUtils.preprocess(spoof);
    return spoof;
}


function getRandInt(min, max){
	return Math.floor(Math.random()*(max-min+1)+min);
}

function createCoordinates(amount){

	//9007199254740991 is the max int value of js :-)
	var range = 400000000000000;
	var coordinates = [];
	for (var i = 0; i < amount; i ++){
		//offset points based on baseCoordinate in munich
		var lon = baseCoordinates.lon + getRandInt(-range, range)/10000000000000000;
		var lat = baseCoordinates.lat + getRandInt(-range, range)/10000000000000000;
		coordinates.push([lon,lat]);
	}
	console.log(coordinates);
	return coordinates;
}

function createTimes(amount){
	var times = [];
	for (var i = 0; i < amount; i ++){
		
	}
	return times;
}

module.exports = SpoofFactory;


