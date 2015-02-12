'use strict';

var _ = require('lodash');
var Trajectory = require('./trajectory.model');

// Get list of trajectorys
exports.index = function(req, res) {
  Trajectory.find(function (err, trajectorys) {
    if(err) { return handleError(res, err); }
    return res.json(200, trajectorys);
  });
};

// Get a single trajectory
exports.show = function(req, res) {
  Trajectory.findById(req.params.id, function (err, trajectory) {
    if(err) { return handleError(res, err); }
    if(!trajectory) { return res.send(404); }
    return res.json(trajectory);
  });
};

// Creates a new trajectory in the DB.
exports.create = function(req, res) {
  Trajectory.create(req.body, function(err, trajectory) {
    if(err) { return handleError(res, err); }
    return res.json(201, trajectory);
  });
};

// Updates an existing trajectory in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Trajectory.findById(req.params.id, function (err, trajectory) {
    if (err) { return handleError(res, err); }
    if(!trajectory) { return res.send(404); }
    var updated = _.merge(trajectory, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, trajectory);
    });
  });
};

// Deletes a trajectory from the DB.
exports.destroy = function(req, res) {
  Trajectory.findById(req.params.id, function (err, trajectory) {
    if(err) { return handleError(res, err); }
    if(!trajectory) { return res.send(404); }
    trajectory.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}