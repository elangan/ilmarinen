var sde = require('./sde');
var sqlite = require('sqlite3').verbose();
var wait = require('wait.for');

function jobs(db, inv) {
  this.db_ = db;
  this.inventory_ = inv;
  this.jobs_ = null;
  db.all('SELECT inv.item_name, blueprint_id, start_time, end_time, job_fee, output_lot ' +
         'FROM jobs JOIN inventory AS inv ON blueprint_id = inv.id',
         (function(err, rows) {
           this.jobs_ = rows;
         }).bind(this));
}

jobs.prototype.getAll = function() {
  return this.jobs_;
};

jobs.prototype.addJobs = function(new_jobs, cb) {
  var db = this.db_;
  
  var blueprints = this.inventory_.getItems(new_jobs.map(function(j) { return j.blueprint_id; }));

  for (var i = 0; i < new_jobs.length; i++) {
    for (var j = 0; j < blueprints.length; j++) {
      if (new_jobs[i].blueprint_id == blueprints[j].id) {
        if (blueprints[j].item_name.match('Blueprint')) {
          if (new_jobs[i].runs > blueprints[j].runs) {
            cb('Too many runs requested, blueprint for ' + blueprints[j].item_name + 
              ' only has ' + blueprints[j].runs + ' available.');
            return;
          }
        }
        new_jobs[i].blueprint_name = blueprints[j].item_name;
        new_jobs[i].material_efficiency = blueprints[j].material_efficiency;
        new_jobs[i].blueprint_cost = blueprints[j].unit_price;
      }
    }
  }

  new_jobs = new_jobs.map(function(j) {
    var typeid = sde.getItemTypeAndGroup(j.blueprint_id);
    j.typeid = typeid.typeid;
    j.group = typeid.group;
    return j;
  });
  console.log(new_jobs);

  /*var jobs_processed = 0;
  for (var i = 0; i < jobs.length; i++) {
    (function(job) {
      request('https://www.fuzzwork.co.uk/blueprint/api/blueprint.php?typeid=' + job.typeid, function(err, resp, body) {
        if (err || resp.statusCode != 200) {
          res.json({'upstream_status': resp.statusCode, 'error': err}); res.status(502); return;     
        }
        var blueprint_info = JSON.parse(body);
        if (job.blueprint_name.match('Relic') || job.blueprint_name.match('Hull Section')) {
          var one_run_materials = blueprint_info.activityMaterials[8];  // Invention
        } else {
          one_run_materials = blueprint_info.activityMaterials[1];  // Manufacturing
        }
        job.materials = []
        for (var i = 0; i < one_run_materials.length; i++) {
          job.materials.push({
            name: one_run_materials[i].name,
            qty: calcMaterials(job.group, job.material_efficiency, one_run_materials[i].quantity, job.runs),
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
    });*/
};

module.exports = jobs;