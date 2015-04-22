'use strict';

var express = require('express');
var controller = require('./trajectory.controller');

var router = express.Router();

router.get('/importMediaQ', controller.importMediaQ);

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.delete('/', controller.dropAll);
router.post('/gpx', controller.parseGPXandImportData);
module.exports = router;