var express = require('express');
var router = express.Router();
var fs = require('fs');
var multer = require('multer');
var upload = multer();
var mysql = require('mysql');


const AWS = require('aws-sdk');
const path = require('path');

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
// con.connect(function(err) {
//   if (err) throw err;
//   console.log('MysqL Connected *****');
// });
// con.on('error', function(error) {
//   console.log('error occured in db response ', error);
// });

router.get('/', function(req, res){
   console.log('Request recieved ping');
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
  try {
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
        var sql = "INSERT INTO post2 (file_name, fullname, email, postcomment) VALUES ( '"+ data.Location +"','"+ req.myobj.myname + "','"+ req.myobj.myemail +"','"+ req.myobj.mycomment+"');"
         var sqlResult  = '';
        con.query(sql, function (err, result, fields) {
         if (err) throw res.status(500).json({'msg': err }).end();;
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
  var sql = "select * from post2;"
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
    
    var  sql = "UPDATE post2 SET likes = likes + 1 WHERE id =" +  req.body.postId + ";";
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
router.all("*", function(req, res) {
    res.status(404).json({success: false}).end();
});


module.exports = router;
