var bodyParser = require('body-parser');
var express = require('express');

var app = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var router = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
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

app.use('/api', router);

app.listen(port);
console.log('Magic happens on port ' + port);

