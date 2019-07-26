var express = require('express');
var router = express.Router();
var fs = require('fs');
var multer = require('multer');
var upload = multer();
var mysql = require('mysql');


const AWS = require('aws-sdk');
const path = require('path');

var redis = require('redis');
//var client = redis.createClient('redis://h:pe9fa47579bf8d3dbb7d077f0c0c174a6df831a86214be1a46acc7072ac0deb4c@ec2-3-221-250-213.compute-1.amazonaws.com:25689', {no_ready_check: true});
var client = redis.createClient(process.env.REDIS_URL, {no_ready_check: true});
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});


var s3 = new AWS.S3();

var con = mysql.createPool({
  host: "us-cdbr-iron-east-02.cleardb.net",
  user: "b062127b2d7096",
  password: "933cd167d970cb1",
  database: "heroku_2fbd37a89f39bd3",
  connectionLimit: 100
});

var ipList = {};
var uploadblocker = {};
// con.connect(function(err) {
//   if (err) throw err;
//   console.log('MysqL Connected *****');
// });
// con.on('error', function(error) {
//   console.log('error occured in db response ', error);
// });

router.get('/', function(req, res){
   console.log('Request recieved ping');
   console.log('redis server cloud ');
   con.query("SELECT * FROM testtable", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  }).on('error', function(error){
    console.log('error occured in ping ', error);
  });
   res.send('success');
// res.send("Hello world!!!!");
});

router.post('/photoUpload',upload.single('fileData'), (req, res,next) => {
  console.log('photo api invoked req.myobj', req.myobj);//this will be automatically set by multer
  var ip = req.headers['x-forwarded-for'] || 
  req.connection.remoteAddress || 
  req.socket.remoteAddress ||
  (req.connection.socket ? req.connection.socket.remoteAddress : null);
  try {
    if (uploadBlocker(ip)) {
       return res.status(200).json({ errorCode: 1 }).end();
    }
    var fileName =__dirname +  '/upload/' +req.file.filename;
    console.log('name in api', req.body);
    var params = {
      Bucket: 'picnic-book-bucket',
      Body : fs.createReadStream(fileName),
      Key : "folder/"+Date.now()+"_"+path.basename(fileName)
    };
    var start = new Date();
    s3.upload(params, function (err, data) {
      //handle error
      var timeTaken = (new Date() - start)/1000;
      console.info('Execution time of upload a photo in S3 '+ timeTaken + ' seconds');
      if (err) {
        console.log("Error", err);
        res.status(500).json({success: false}).end();
      }
    
      //success
      if (data) {
        console.log("Uploaded in:", data.Location);
        console.log("req.myobj.rotateDegHidden :", req.myobj );
        let slide = req.myobj.slide ? Number(req.myobj.slide) : 0;
        let rotate = req.myobj.rotateDegHidden ? Number(req.myobj.rotateDegHidden) : 0;
        var sql = "INSERT INTO post (file_name, email, postcomment, greyscale, rotate) VALUES ( '"+ data.Location +"','"+ req.myobj.myemail +"','"+ req.myobj.mycomment+"','"+ slide +"','" + rotate + "');"
         var sqlResult  = '';
        con.query(sql, function (err, result, fields) {
         if (err) throw res.status(500).json({'msg': err }).end();
            sqlResult = result;
             console.log(result);
             res.status(200).json({success: true}).end();
         }).on('error', function(error){
          console.log('error occured in upload ', error);
        });

      }
    });
  } catch(e) {
    
  }
  
});

router.get('/getAllPosts', function(req, res){
  console.log('Request recieved get all products');
  var start = new Date();
  var sql = "select * from post;"
   var resultArray  = [];
   con.query(sql, function (err, result, fields) {
    var timeTaken = (new Date() - start)/1000;
    console.info('Execution time of getAllPosts query is '+ timeTaken + ' seconds');
     if (err) throw err;
       resultArray = Object.values(JSON.parse(JSON.stringify(result)))
         res.send(resultArray);
     }).on('error', function(error){
      console.log('error occured in getAllPosts ', error);
    });

});

router.post('/liked', function(req, res){
  var ip = req.headers['x-forwarded-for'] || 
  req.connection.remoteAddress || 
  req.socket.remoteAddress ||
  (req.connection.socket ? req.connection.socket.remoteAddress : null);
  console.log('ip address calling from ', ip);
  
  var postId = req.body && req.body.postId ? req.body.postId : '';
  console.log('Request recieved to like postid ', postId);
  if (ipblocker(postId, ip)){
    res.status(200).json({success: false, errorCode: 1, text: 'Please dont cheat'}).end();
  }
   else if(postId == null && postId != '') {
    res.status(200).json({success: false, errorCode: 2, text : 'no postid found'}).end();
  } else {
    
    var  sql = "UPDATE post SET likes = likes + 1 WHERE id =" +  req.body.postId + ";";
     con.query(sql, function (err, result, fields) {
       console.log('result from update like', result);
       if (err) throw err;
           res.send({'success': true, 'text': 'like updated in db of '});
       }).on('error', function(error){
        console.log('error occured in getAllPosts ', error);
      });
  }
  

});

function ipblocker(postId, ip) {
  return false;
  if(ipblocker[ip]) {
    if(ipblocker[ip].includes(postId)){
      console.log("***** ALERT ***** IP BLOCKED ******** ", ip);
      return true;
    } else {
      ipblocker[ip].push(postId);
      return false;
    }
  } else {

    var newList = [];
    newList.push(postId)
    ipblocker[ip] = newList;
    return false;
  }
}
function uploadBlocker(ip) {
  return false;
  console.log('upload object state is ',  uploadblocker);
  if(uploadblocker[ip] && uploadblocker[ip] > 2) {
    console.log("***** ALERT ***** More than 2 upload ******** ", ip);
    return true;
  } else if(uploadblocker[ip] == null || uploadblocker[ip] == undefined || uploadblocker[ip] == 0) {
    uploadblocker[ip] = 1;
    return false;
  } else {
    uploadblocker[ip] = uploadblocker[ip] + 1;
    return false;
  } 
}
router.all("*", function(req, res) {
    res.status(404).json({success: false}).end();
});

module.exports = router;
