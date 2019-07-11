var http = require('http');
//var whmcs = require('whmcs');
/*
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World!');

}).listen(8080);
*/

var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser')
var app = express();

var multer = require('multer');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(multer({dest:'upload/'}).single('fileData'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(__dirname + '/upload'));
app.use(function (req, res, next) {
 console.log('body recieved');
  console.log(req.body) // populated!
  next()
})

var router = require('./routes.js');

// All routes to node server will start with /api/
app.use('/api/', router);

const PORT = process.env.PORT || 8081;
app.listen(PORT);
console.log('server started');
/*
var wclient = new whmcs(config);
//console.log('whmcs obj ', wclient);
wclient.domains.getDomainNameservers('abdullahabbasi.pw', function(err, output) {
});
*/