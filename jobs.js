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

// TODO simplify this - post item to be built, and attempt to allocate a blueprint via FIFO just like materials
// separate calculations and persistence into helper functions
jobs.prototype.addJobs = function(new_jobs, cb) {
  var db = this.db_;
  var now = new Date(Date.now()).toISOString()  // TODO learn how to calculate build time
  // Validate blueprint ID
  var blueprints = [];
  for (var i = 0; i < new_jobs.length; i++) {
    var blueprint = this.inventory_.getItem(new_jobs[i].blueprint_id);
    if (!blueprint) {
      cb('Blueprint not found for id: ' + new_jobs[i].blueprint_id);
      return;
    }
    if (new_jobs[i].runs > blueprint.runs) {
      cb('Too many runs requested, blueprint for ' + blueprint.item_name + 
        ' only has ' + blueprint.runs + ' available.');
      return;
    }
    blueprints.push(blueprint);
  }

  // Validate output_type and materials
  var blueprint_data = [];
  var output_items = [];
  var job_materials = [];
  for (var i = 0; i < new_jobs.length; i++) {
    blueprint_data.push(sde.getBlueprintData(new_jobs[i].blueprint_name));
    var activity;
    if (blueprint_data[i].blueprint_group.indexOf('Relic') > -1) {
      activity = 'invention';
    } else {
      activity = 'manufacturing';
    }
    
    var found_output = false;
    for (var output in blueprint_data[i][activity].products) {
      if (output.hasOwnProperty('name') && output[name] == new_jobs[i].output_type) {
        found_output = true;
      }
    }
    if (!found_output) {
      cb('Incorrect output type for job: ' + new_jobs[i].blueprint_id);
    }

    var missing_materials = [];
    var materials = [{
      'material': blueprints[i].name,
      'amount': 1,
      'unit_price': blueprints[i].unit_price
    }];
    for (var material in blueprint_data[activity].materials) {
      var needed_amount = calcMaterials(blueprint_data.group,
                                        new_jobs[i].material_efficiency,
                                        new_jobs[i].runs,
                                        material.quantity);
      var available_amount = this.inventory_.getAvailableQuantity(material.name);
      if (needed_amount > available_amount) {
        missing_materials.push({name: material.name, needed_quantity: needed_amount - available_amount});
      } else {
        materials.push({
          'material': material.name,
          'amount': needed_amount,
          'unit_price': this.inventory_.getUnitPrice(material.name, needed_amount)
        });
      }
    }
    if (missing_materials.length > 0) {
      cb('Missing materials to build ' + new_jobs[i].name + ' ' + missing_materials);
      return;
    }
    job_materials.push(materials);

    // TODO learn how to calculate building fee
    // - find algorithm using base prices from typeIDs.yaml
    // - find system cost index for J+
    var built_price = 0;
    for (var j = 0; j < materials.length; j++) {
      built_price += materials.amount * materials.unit_price;
    }

    output_items.push({
      'item_name': new_jobs[i].output_type,
      'quantity': new_jobs[i].runs * blueprint_data[activity].products.quantity,
      'unit_price': built_price / (new_job[i].runs * blueprint_data[i][activity].products[0].quantity),
      'date_acquired': now
    });
  }
  cb(undefined, blueprints);

  // TODO figure out transaction nesting
  this.inventory_.addItems(output_items);
  for (var i = 0; i < new_jobs.length; i++) {
    new_jobs[i].output_lot = output_items[i].id;
    new_jobs[i].id = wait.forMethod(db, 'insert',
      'INSERT OR ROLLBACK INTO jobs (blueprint_id, start_time, end_time, job_fee, output_lot) VALUES (?, ?, ?, ?, ?)',
      [new_jobs[i].blueprint_id, now, now, 0, new_jobs[i].output_lot]);
    this.inventory_.allocate(job_materials[i], new_jobs[i].id);
  }

  // TODO new_jobs should only have the following fields at the end, accumulate other data in parallel arrays
  // db.all('SELECT inv.item_name, blueprint_id, start_time, end_time, job_fee, output_lot ' +
  //        'FROM jobs JOIN inventory AS inv ON blueprint_id = inv.id',  
  this.jobs_.push.apply(this.jobs_, new_jobs);
  cb(undefined, new_jobs);
};

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

module.exports = jobs;