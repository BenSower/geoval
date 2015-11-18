'use strict';

var path = require('path'),
  fs = require('fs');

var tools = require('./SpoofTools'),
  rekuire = require('rekuire'),
  TrajUtils = rekuire('TrajUtils');

SpoofFactory.prototype.minLength = 10;
SpoofFactory.prototype.maxLength = 100;
SpoofFactory.prototype.retries = 0;

function SpoofFactory() {
  var self = this;

  //Load all Generators
  self.coordinateGenerators = {};
  var normalizedGeneratorPath = path.join(__dirname, 'generators');
  fs.readdirSync(normalizedGeneratorPath).forEach(function (file) {
    var generator = require(path.join(normalizedGeneratorPath, file));
    var generatorName = path.basename(file, '.js');
    self.coordinateGenerators[generatorName] = generator;
  });
}

SpoofFactory.prototype.createSpoofSet = function (lvl, amount) {

  console.log('creating ' + amount + ' lvl' + lvl + ' spoofed trajectories ');
  var spoofs = [];

  var pushFunction = function (element) {
    if (element !== null) {
      spoofs.push(element);
    } else {
      console.log('Error creating spoof, will try again later');
    }
  }

  for (var i = 0; i < amount; i++) {
    this.createSpoof(lvl, this.coordinateGenerators['level' + lvl].generateSpoof, pushFunction);
  }

  if (spoofs.length < amount && this.retries < 30) {
    var difference = amount - spoofs.length;
    console.log('Not all spoofs satisfied the constraints, trying again for ' + difference + ' spoofs');
    this.retries++;
    spoofs.concat(this.createSpoofSet(lvl, difference));
  } else {
    this.retries = 0;
  }
  return spoofs;
}

SpoofFactory.prototype.createSpoof = function (lvl, coordinateGenerator, cb) {
  var trajLength = tools.getRandInt(this.minLength, this.maxLength),
    times = tools.createRandomTimes(trajLength),
    coordinates = coordinateGenerator(trajLength, this);

  var spoof = {
    id: tools.getName(lvl),
    properties: {
      coordTimes: times,
      spoofLvL: lvl
    },
    geometry: {
      coordinates: coordinates
    }
  };
  TrajUtils.preprocess(spoof, function (err, preprocessedSpoof) {
    if (err) throw err;
    if (preprocessedSpoof !== null && preprocessedSpoof !== undefined) {
      return cb(preprocessedSpoof);
    } else {
      console.log('error creating spoof');
      return cb(null);
    }
  });

}

module.exports = SpoofFactory;