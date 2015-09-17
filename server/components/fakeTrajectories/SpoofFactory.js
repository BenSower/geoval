'use strict';

var UUID = require('uuid-js'),
    _ = require('lodash');

var rekuire = require('rekuire'),
    TrajUtils = rekuire('TrajUtils');

function SpoofFactory() {}

//Base is center of munich
var baseCoordinates = {
    'lat': 48.13891266483958,
    'lon': 11.573041815506889
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
    var maxLength = 100,
        minLength = 10,
        trajLength = getRandInt(minLength, maxLength),
        coordinates = createCoordinates(trajLength),
        times = createRandomTimes(trajLength);

    var spoof = {
        id: getName(1),
        properties: {
            coordTimes: times,
            spoofLvL: 1
        },
        geometry: {
            coordinates: coordinates
        }
    };

    return TrajUtils.preprocess(spoof);
}


function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function createCoordinates(amount) {

    var range = 4 * Math.pow(10, 15);
    var offsetPow = Math.pow(10, 19);
    //start point gets bigger offset to diversify the start a little
    var baseCoordinate = getOffsetForCoordinate(baseCoordinates, range, Math.pow(10, 16.5));
    var coordinates = [];

    for (var i = 0; i < amount; i++) {
        //offset points based on baseCoordinate in munich
        var offsetCoord = getOffsetForCoordinate(baseCoordinate, range, offsetPow);
        baseCoordinate.lon = offsetCoord.lon;
        baseCoordinate.lat = offsetCoord.lat;
        coordinates.push([offsetCoord.lon, offsetCoord.lat]);
    }
    return coordinates;
}

function getOffsetForCoordinate(baseCoordinate, range, offsetPow) {
    var lonOffset = getRandInt(-range, range) / offsetPow;
    var latOffset = getRandInt(-range, range) / offsetPow;
    return {
        lon: baseCoordinate.lon + lonOffset,
        lat: baseCoordinate.lat + latOffset
    };

}

function createRandomTimes(amount) {
    var times = [];
    var d = new Date();
    var time = d.getTime();

    for (var i = 0; i < amount; i++) {
        //random time between timestamps 1-60 seconds
        time = time + randomIntFromInterval(1, 60000);
        times.push(time);
    }
    return times;
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getName(level) {
    var uuid4 = UUID.create();
    return uuid4.toString() + '.lvl' + level;
}

module.exports = SpoofFactory;
