var express = require('express');
var fs = require('fs');
var inventory = require('./inventory');
var jobs = require('./jobs');
var request = require('request');
var sqlite = require('sqlite3').verbose();
var wait = require('wait.for');

var DB_PATH = './data/ilmarinen.sqlite';
var exists = fs.existsSync(DB_PATH);
var db = new sqlite.Database(DB_PATH);
if (!exists) {
  db.serialize(function() {
    db.exec(fs.readFileSync('./data/schema.sql', 'utf8'), function(err) {
      if (err !== null) {
        throw err;
      }
    });
  });
}

// wait.for insert statement wrapper to fetch lastID
sqlite.Database.prototype.insert = function(sql, params, callback) {
  this.run(sql, params, function(err) {
    return callback(err, this.lastID);
  });
};

db.on('trace', function(query) {
  console.log('Executing query: ' + query);
});

var inv = new inventory(db);
var j = new jobs(db, inv);
var router = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
  res.json({ message: 'Then began old Wainamoinen, ' +
    'Ancient bard and famous singer, ' +
    'To renew his incantations;' });
});

function newStuffOrError(res, err, new_stuff) {
  if (err) {
    res.json({'error': err});
    res.status(502);
  } else {
    res.json(new_stuff);
    res.status(201);
  }
}

router.route('/inventory')
  .get(function(req, res) {
    res.json(inv.getAll());
    res.status(200);
  })
  .post(function(req, res) {
    wait.launchFiber(inv.addItems.bind(inv), req.body.items_list || [req.body], newStuffOrError.bind(this, res));
  });

router.get('/inventory/available', function(req, res) {
  res.json(inv.getAvailable());
  res.status(200);
});

router.route('/jobs')
  .get(function(req, res) {
    res.json(j.getAll());
    res.status(200);
  })
  .post(function(req, res) {
    wait.launchFiber(j.addJobs.bind(j), req.body.items_list || [req.body],  newStuffOrError.bind(this, res));
  });

function calcMaterials(item_group, blueprint_material_efficiency, runs, one_run_quantity) {
  if (group.match('Relic')) {
    return one_run_quantity * runs;
  }
  var facility_multiplier = 1;
  if (item_group in ['Hybrid Tech Components', 'Tactical Destroyer']) {
    facility_multiplier = 0.98;
  }
  var me = facility_multiplier * blueprint_material_efficiency;
  return Math.ceil(Math.max(one_run_quantity * me, 1) * runs);
}

module.exports = router;

