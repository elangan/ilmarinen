var express = require('express');
var fs = require('fs');
var request = require('request');
var sqlite = require('sqlite3').verbose();

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

db.on('trace', function(query) {
  console.log('Executing query: ' + query);
});

var router = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'Then began old Wainamoinen, ' +
      'Ancient bard and famous singer, ' +
      'To renew his incantations;' });
});

router.route('/inventory')
  .get(function(req, res) {
    db.all('SELECT * FROM inventory;', function(err, rows) {
      if(err) {
        res.json({"error": err});
        res.status(502);
        return;
      }

      res.json(rows);
      res.status(200);
    });
  })
  .post(function(req, res) {
    var items_to_insert = [];
    if (req.body.items_list) {
      for (var i = 0; i < req.body.items_list.length; i++) {
        var item = req.body.items_list[i];
        items_to_insert.push([item.item_name, item.quantity,
                              item.unit_price, item.date_acquired]);
      }
    } else {
      items_to_insert.push([req.body.item_name, req.body.quantity,
                            req.body.unit_price, req.body.date_acquired]);
    }
    var error = null;
    db.serialize(function() {
      db.run('BEGIN TRANSACTION');
      for (var i = 0; i < items_to_insert.length; i++) {
        db.run('INSERT OR ROLLBACK INTO inventory VALUES(?, ?, ?, ?)', items_to_insert[i],
               function(err) {
                 if(err) { error = err; return; }
                 new_ids.push(this.lastID);
               }
        );
        if (error) break;
      }
    });
    if (error) {
      res.json({'error': error});
      res.status(502);
    } else {
      res.json({'new_ids': new_ids});
      res.status(201);
    }
  });

router.get('/inventory/available', function(req, res) {
  db.all('SELECT inv.id, inv.item_name, inv.unit_price, (inv.quantity - SUM(COALESCE(alloc.quantity, 0))) AS avail_qty ' +
          'FROM inventory AS inv ' +
          'LEFT JOIN job_allocation AS alloc ON inv.id = alloc.inventory_id ' +
          'GROUP BY inv.id ' +
          'HAVING (inv.quantity - SUM(COALESCE(alloc.quantity, 0))) > 0;',
          function(err, rows) {
            if (err) {
              res.json({"error": err});
              res.status(502);
              return;
            }
            res.json({'results': rows});
          });
});

router.route('/jobs')
  .get(function(req, res) {
    db.all('SELECT inv.item_name, blueprint_id, start_time, end_time, job_fee, output_lot ' +
           'FROM jobs JOIN inventory AS inv ON blueprint_id = inv.id;',
      function(err, rows) {
        if(err) {
          res.json({"error": err});
          res.status(502);
          return;
        }

        res.json(rows);
        res.status(200);
      });
  })
  .post(function(req, res) {
    jobs = [];
    if (req.body.jobs_list) {
      for (var i = 0; i < req.body.jobs_list.length; i++) {
        var job = req.body.jobs_list[i];
        jobs.push({'blueprint_id': job.blueprint_id, 'runs': job.runs});
      }
    } else {
      jobs.push({'blueprint_id': req.body.blueprint_id, 'runs': req.body.runs});
    }
    db.all('SELECT * FROM inventory LEFT JOIN blueprint_copies ON inventory.id = blueprint_copies.inventory_id ' +
           'WHERE id in (' + jobs.map(function(j) { return j.blueprint_id }).join(',') +');', function(err, rows) {
      if(err) { res.json(err); res.status(502); return; }
      for (var i = 0; i < jobs.length; i++) {
        for (var j = 0; j < rows.length; j++) {
          if (jobs[i].blueprint_id == rows[j].id) {
            // TODO import blueprint data
            /*if (rows[j].item_name.match('Blueprint')) {
              if (jobs[i].runs > rows[j].runs) {
                jobs[i].error = 'Too many runs requested, blueprint only has ' + rows[j].runs + ' available.';
                res.status(502); res.json(jobs); return;
              }
            }*/
            jobs[i].blueprint_name = rows[j].item_name;
            jobs[i].material_efficiency = rows[j].material_efficiency;
            jobs[i].blueprint_cost = rows[j].unit_price;
          }
        }
      }
      request('https://www.fuzzwork.co.uk/api/typeid2.php?typename=' + jobs.map(function(j) { return j.blueprint_name; }).join('|'),
        function(err, resp, body) {
          if(err || resp.statusCode != 200) {
            res.json({'upstream_status': resp.statusCode, 'error': err}); res.status(502); return;
          }
          var typeids = JSON.parse(body);
          for (var i = 0; i < jobs.length; i++) {
            for (var j = 0; j < typeids.length; j++) {
              if (jobs[i].blueprint_name == typeids[j].typeName) {
                jobs[i].typeid = typeids[j].typeID;
              }
            }
          }
          var jobs_processed = 0;
          for (var i = 0; i < jobs.length; i++) {
            (function(job) {
              request('https://www.fuzzwork.co.uk/blueprint/api/blueprint.php?typeid=' + job.typeid, function(err, resp, body) {
                if (err || resp.statusCode != 200) {
                  res.json({'upstream_status': resp.statusCode, 'error': err}); res.status(502); return;     
                }
                var blueprint_info = JSON.parse(body);
                if (job.blueprint_name.match('Relic')) {
                  var one_run_materials = blueprint_info.activityMaterials[8];  // Invention
                } else {
                  one_run_materials = blueprint_info.activityMaterials[1];  // Manufacturing
                }
                job.materials = []
                for (var i = 0; i < one_run_materials.length; i++) {
                  job.materials.push({
                    name: one_run_materials[i].name,
                    qty: calcMaterials(job.group, job.material_efficiency, one_run_materials[i].quantity, job.runs);
                  });
                }
                jobs_processed++;
                if (jobs_processed == jobs.length) {
                  checkInventory();
                }
              });
            })(jobs[i]);
          }
          var checkInventory = function() {
            res.status(200);
            res.json(jobs);
          }
        }
      );
    });
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

