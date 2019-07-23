
var http = require('http');
var cors = require('cors')

//var whmcs = require('whmcs');
/*
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World!');

}).listen(8080);
*/

var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var multer = require('multer');

var app = express();
app.use(cors())


app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin: *');
  res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');
  next();
});
app.use(multer({dest:'upload/'}).single('fileData'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(__dirname + '/upload'));

app.use(function (req, res, next) {
 console.log('body recieved',req.body);
 if(req.body && req.body.myemail) {
    req.myobj = req.body;
 }
  next()
})

var router = require('./routes.js');

// All routes to node server will start with /api/
app.use('/api/', router);

const PORT = process.env.PORT || 8081;
app.listen(PORT);
console.log('server started at port ' + PORT);

/*
var wclient = new whmcs(config);
//console.log('whmcs obj ', wclient);
wclient.domains.getDomainNameservers('abdullahabbasi.pw', function(err, output) {
});
*/


