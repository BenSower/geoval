/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Trajectory = require('./trajectory.model');

exports.register = function(socket) {
  Trajectory.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Trajectory.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('trajectory:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('trajectory:remove', doc);
}