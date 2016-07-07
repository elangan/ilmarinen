var express = require('express');

var router = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'Then began old Wainamoinen,' +
      'Ancient bard and famous singer,' +
      'To renew his incantations;' });
});

router.route('inventory')
  .get(function(req, res) {

  })
  .post(function(req, res) {
  
  });

router.route('jobs')
  .get(function(req, res) {
  
  })
  .post(function(req, res) {
  
  });

module.exports = router;

