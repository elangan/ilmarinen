var sqlite = require('sqlite3').verbose();
var wait = require('wait.for');

function inventory(db) {
	this.db_ = db;
	this.items_ = null;
	db.all('SELECT inv.id, inv.item_name, inv.unit_price, inv.quantity, ' +
		          'SUM(COALESCE(alloc.quantity, 0)) AS allocated ' +
           'FROM inventory AS inv ' +
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
	var available = [];
	for (var i = 0; i < this.items_.length; i++) {
		var item = this.items_[i];
		if (item.quantity - item.allocated > 0) {
			available.push(item);
		}
	}
	return available;
};

inventory.prototype.addItems = function(items, cb) {
  var db = this.db_;
  wait.forMethod(db, 'run', 'BEGIN TRANSACTION');
  try {
    for (var i = 0; i < items.length; i++) {
      items[i].allocated = 0;
      items[i].id = wait.forMethod(this.db_, 'insert',
          'INSERT OR ROLLBACK INTO inventory (item_name, quantity, unit_price, date_acquired) VALUES(?, ?, ?, ?)',
          [items[i].item_name, items[i].quantity, items[i].unit_price, items[i].date_acquired]);
    }
  } catch(err) {
    this.db_.run('ROLLBACK');
    cb(err);
  }

  this.db_.run('COMMIT');
  this.items_.push.apply(this.items_, items);
  cb(undefined, items);
};

module.exports = inventory;