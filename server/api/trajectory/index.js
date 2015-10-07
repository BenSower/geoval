'use strict';

var express = require('express');
var controller = require('./trajectory.controller');

var router = express.Router();

//order of routes important because of bad naming...
router.get('/importMediaQ', controller.importMediaQ);
router.post('/gpx', controller.parseGPXandImportData);
router.post('/createLvL1Spoofs', controller.createLvL1Spoofs);
router.get('/analyse', controller.analyse);

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.delete('/', controller.dropAll);



module.exports = router;