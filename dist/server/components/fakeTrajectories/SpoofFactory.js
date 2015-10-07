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
    return spoofs;
}


function createLvl1Spoof() {

	var maxLength = 200,
		minLength = 10,
		trajLength = getRandInt(minLength, maxLength),
		coordinates = createCoordinates(trajLength),
		times = createRandomTimes(trajLength);

    var spoof = {
    	id : getName(),
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
	var range = 40000000000000;
	var coordinates = [];
	for (var i = 0; i < amount; i ++){
		//offset points based on baseCoordinate in munich
		var lon = baseCoordinates.lon + getRandInt(-range, range)/1000000000000000;
		var lat = baseCoordinates.lat + getRandInt(-range, range)/1000000000000000;
		coordinates.push([lon,lat]);
	}
	return coordinates;
}

function createRandomTimes(amount){
	var times = [];
	var d = new Date();
	var time = d.getTime();

	for (var i = 0; i < amount; i ++){
		//random time between timestamps 1-60 seconds
		time = time + randomIntFromInterval(1,60000);
		times.push(time);
	}	
	return times;
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function getName() {
	return new Date().getTime();
}

module.exports = SpoofFactory;


