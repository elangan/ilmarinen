var express = require('express');
var fs = require('fs');
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
    var new_ids = [];
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
  
  })
  .post(function(req, res) {
  
  });

module.exports = router;

