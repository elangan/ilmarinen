var sqlite = require('sqlite3').verbose();
var wait = require('wait.for');

function inventory(db) {
  this.db_ = db;
  this.items_ = null;
  db.all('SELECT inv.id, inv.item_name, inv.unit_price, inv.quantity, inv.date_acquired, ' +
         'bpc.runs, bpc.material_efficiency, ' +
         'SUM(COALESCE(alloc.quantity, 0)) AS allocated ' +
         'FROM inventory AS inv ' +
         'LEFT JOIN blueprint_copies AS bpc ON inv.id = bpc.inventory_id ' +
         'LEFT JOIN job_allocation AS alloc ON inv.id = alloc.inventory_id ' +
         'GROUP BY inv.id;',
         (function(err, rows) {
            if (err) throw err;
            this.items_ = rows;
         }).bind(this));
}

inventory.prototype.getAll = function() {
  return this.items_;
};

inventory.prototype.getAvailable = function() {
  return this.items_.filter(function(item) {
    return item.quantity > item.allocated;
  });
};

inventory.prototype.getItem = function(id) {
  return this.getItems([id])[0];
};

inventory.prototype.getItems = function(ids) {
  return this.items_.filter(function(item) {
    return ids.indexOf(item.id) > -1;
  });
};

inventory.prototype.getAvailableQuantity = function(item_name) {
  var available_quantity = 0;
  this.items_.forEach(function(item) {
    if (item.item_name == item_name) {
      var available = item.quantity - item.allocated;
      if (available > 0) {
        available_quantity += available;
      }
    }
  });
  return available_quantity;
};

inventory.prototype.getUnitPrice = function(item_name, quantity) {
  var found_price = 0;
  var found_quantity = 0;
  for (var i = 0; i < this.items_.length; i++) {
    var item = this.items_[i];
    if (item.item_name == item_name) {
      var available = item.quantity - item.allocated;
      if (available > (quantity - found_quantity)) {
        found_quantity += quantity - found_quantity;
        found_price += (quantity - found_quantity) * item.unit_price;
        break;
      } else {
        found_quantity += item.quantity;
        found_price += available * item.unit_price;
      }
    }
  }
  if (found_quantity < quantity) {
    return -1;
  }
  return found_price / found_quantity;
};

inventory.prototype.allocate = function(items, job_id) {
  var db = this.db_;
  wait.forMethod(db, 'run', 'BEGIN TRANSACTION');
  try{
    for (var i = 0; i < items.length; i++) {
      items[i].allocated = 0;
    }
    for (var j = 0; j < this.items_.length; j++) {
      var item = this.items_[j];
      var available = item.quantity - item.allocated;
      if (available == 0) continue;
      for (var i = 0; i < items.length; i++) {
        var needed = items[i].quantity - items[i].allocated;
        if (needed == 0) continue;
        if (item.item_name == items[i].item_name && items[i].allocated < items[i].quantity) {
          if (available > needed) {
            item.allocated += needed;
            items[i].allocated += needed;
            wait.forMethod(db, 'insert',
              'INSERT OR ROLLBACK INTO job_allocation (inventory_id, job_id, quantity) VALUES (?, ?, ?)',
              [item.id, job_id, needed]);
          } else {
            item.allocated += available;
            items[i].allocated += available;
            wait.forMethod(db, 'insert',
              'INSERT OR ROLLBACK INTO job_allocation (inventory_id, job_id, quantity) VALUES (?, ?, ?)',
              [item.id, job_id, available]);
          }
        }
      }
    }
  } catch(err) {
    wait.forMethod(db, 'run', 'ROLLBACK');
    return err;
  }

  wait.forMethod(db, 'run', 'COMMIT');
  return;
};

inventory.prototype.addItems = function(items, cb) {
  var db = this.db_;
  wait.forMethod(db, 'run', 'BEGIN TRANSACTION');
  try {
    for (var i = 0; i < items.length; i++) {
      items[i].allocated = 0;
      items[i].id = wait.forMethod(db, 'insert',
          'INSERT OR ROLLBACK INTO inventory (item_name, quantity, unit_price, date_acquired) VALUES(?, ?, ?, ?)',
          [items[i].item_name, items[i].quantity, items[i].unit_price, items[i].date_acquired]);
      if (items[i].hasOwnProperty('runs')) {
        wait.forMethod(db, 'insert',
          'INSERT OR ROLLBACK INTO blueprint_copies (inventory_id, runs, material_efficiency) VALUES(?, ?, ?)',
          [items[i].id, items[i].runs, items[i].material_efficiency]);
      }
    }
  } catch(err) {
    wait.forMethod(db, 'run', 'ROLLBACK');
    if (cb) { cb(err) };
    return err;
  }

  wait.forMethod(db, 'run', 'COMMIT');
  this.items_.push.apply(this.items_, items);
  if (cb) { cb(undefined, items) };
  return items;
};

module.exports = inventory;