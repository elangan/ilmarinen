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
    res.status(502);
    res.json({'error': err});
  } else {
    res.status(201);
    res.json(new_stuff);
  }
}

router.route('/inventory')
  .get(function(req, res) {
    res.status(200);
    res.json(inv.getAll());
  })
  .post(function(req, res) {
    wait.launchFiber(inv.addItems.bind(inv), req.body.items_list || [req.body], newStuffOrError.bind(this, res));
  });

router.get('/inventory/available', function(req, res) {
  res.status(200);
  res.json(inv.getAvailable());
});

router.route('/jobs')
  .get(function(req, res) {
    res.status(200);
    res.json(j.getAll());
  })
  .post(function(req, res) {
    wait.launchFiber(j.addJobs.bind(j), req.body.items_list || [req.body],  newStuffOrError.bind(this, res));
  });

module.exports = router;

