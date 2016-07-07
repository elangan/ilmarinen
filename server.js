var api = require('./api');
var bodyParser = require('body-parser');
var express = require('express');

var app = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

app.get('/', function(req, res) {
  res.send('May the wolves devour the dreamer,'+
    'Eat the Laplander for dinner,' +
    'May disease destroy the braggart,' +
    'Him who said that I should never' +
    'See again my much-loved home-land,');
})

app.use('/api', api);

app.listen(port);
console.log('Magic happens on port ' + port);

