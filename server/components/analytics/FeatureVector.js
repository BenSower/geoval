var path = require('path'),
  fs = require('fs'),
  log_info = require('debug')('info'),
  log_debug = require('debug')('debug'),
  rekuire = require('rekuire'),
  TrajUtils = rekuire('TrajUtils');

FeatureVector.prototype.sampleAmount = -1;
FeatureVector.prototype.featureExtractors = {}

function FeatureVector() {
  var self = this;
  var normalizedAlgorithmPath = path.join(__dirname, 'algorithms');

  fs.readdirSync(normalizedAlgorithmPath).forEach(function (file) {
    var algorithm = require('./algorithms/' + file);
    var algorithmName = path.basename(file, '.js');
    self.featureExtractors[algorithmName] = algorithm.extractFeatures;
  });
}

FeatureVector.prototype.extractFeatures = function (trajectory, cb) {
  console.log('extracting Features of', trajectory.id);
  this.sampleAmount = trajectory.geometry.coordinates.length;
  for (var algorithm in this.featureExtractors) {
    this[algorithm] = this.featureExtractors[algorithm](trajectory);
  }
  cb(null, this);
}

module.exports = FeatureVector;