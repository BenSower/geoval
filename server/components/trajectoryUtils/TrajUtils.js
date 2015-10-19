var log_info = require('debug')('info'),
  log_debug = require('debug')('debug'),
  fs = require('fs'),
  jsdom = require('jsdom').jsdom,
  ToGeoJson = require('togeojson'),
  path = require('path');

var rekuire = require('rekuire'),
  FeatureVector = rekuire('FeatureVector');

function TrajUtils() {}

TrajUtils.prototype.convertGpxToGeoJson = function (gpxFilePath) {
  //load file
  var gpxFileObj = fs.readFileSync(gpxFilePath, 'utf8');
  //get dom tree from gpx file
  var gpx = jsdom(gpxFileObj);

  //convert from gpx to geojson
  var converted = ToGeoJson.gpx(gpx, {
    styles: true
  });
  log_info('file converted to geoJson');
  log_debug('Raw data: ', converted);

  //Selecting first/only trajectory in file
  var trajectory = this.preprocess(converted.features[0]);
  //var trajectory = converted.features[0];
  //setting the filename
  trajectory.id = path.basename(gpxFilePath);
  log_debug('returning a trajectory with distribution:', trajectory.properties.distribution);
  return trajectory;
}

TrajUtils.prototype.preprocess = function (trajectory, cb) {

  if (!trajectoryConstraintsCheck(trajectory)) {
    console.log('trajectory did not qualify, skipping:', trajectory.geometry);
    return cb(null, null);
  }
  var rawFv = new FeatureVector();
  rawFv.extractFeatures(trajectory, function (err, fv) {
    if (!fvConstraintsCheck(fv)) {
      console.log('featureVector did not qualify, skipping:', fv);
      return cb(null, null);
    }
    trajectory.featureVector = fv;
    return cb(err, trajectory);
  });
}

function trajectoryConstraintsCheck(trajectory) {
  //skip trajectories with 1 or less points
  var containsMoreThenOnePoint = (trajectory.geometry.coordinates.length > 1);
  var hasNoBrokenCoordinates = true;
  for (var i = 0; i < trajectory.geometry.coordinates.length; i++) {
    var lon = trajectory.geometry.coordinates[i][0];
    var lat = trajectory.geometry.coordinates[i][1];
    if (isNaN(parseFloat(lon)) || isNaN(parseFloat(lat)) || lon === undefined || lat === undefined || lon === '' || lat ===
      '') {
      hasNoBrokenCoordinates = false;
      break;
    }
  }
  return containsMoreThenOnePoint && hasNoBrokenCoordinates;
}

function fvConstraintsCheck(fv) {
  //skip trajectories with too big outliers
  var maxOutlierThreshold = 100;
  var hasNoBigOutliers = fv.spatialDistance.biggestDistance < maxOutlierThreshold;
  return hasNoBigOutliers;
}

TrajUtils.prototype.deg2rad = function (deg) {
  return deg * (Math.PI / 180);
}

TrajUtils.prototype.getDistanceFromLonLatInM = function (lon1, lat1, lon2, lat2) {
  var R = 6371; // Radius of the earth in km
  var dLat = this.deg2rad(lat2 - lat1); // deg2rad below
  var dLon = this.deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000;
}

/*
    Creates a new Trajectory object
*/
TrajUtils.prototype.createNewTmpTrajectory = function (videoSlice) {

  var trajectory = {
    id: videoSlice.VideoId,
    properties: {
      time: videoSlice.TimeCode,
      coordTimes: []
    },
    geometry: {
      type: 'LineString',
      coordinates: []
    },
    featureVector: {}
  };
  return trajectory;
}

TrajUtils.prototype.parseMediaQBackup = function (pathToBackup, cb) {

  console.log('Parsing Backup File');
  var self = this;
  var rawTrajectories = [];
  var err;

  var rl = require('readline').createInterface({
    terminal: false,
    input: require('fs').createReadStream(path.join('./', pathToBackup))
  });

  rl.on('line', function (line) {
    var sanitizedLine = sanitizeImportLine(JSON.parse(line));
    self.preprocess(sanitizedLine, function (error, trajectory) {
      err = error;
      if (trajectory !== null) {
        rawTrajectories.push(trajectory);
      }
    });
  });

  rl.on('close', function () {
    log_info('end of file', pathToBackup);
    return cb(err, rawTrajectories);
  })
}

function sanitizeImportLine(line) {
  //removing old mongodb objId
  delete line._id;
  //removing mongodb $date obj
  line.properties.coordTimes = line.properties.coordTimes.map(function (date) {
    return date.$date;
  });
  return line;
}

module.exports = new TrajUtils();