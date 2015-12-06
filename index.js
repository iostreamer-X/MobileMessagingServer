var express = require('express');
var app = express();
var dburl="oosechat"
var collections=["users","inbox","buffer"]
var db = require('mongojs')(dburl,collections)

app.get('/signup', function(req, res) {
  console.log(req.query);
  var name = req.param('name')
  var pass = req.param('pass')
  var phone = req.param('phone')
  var c=0
  db.users.find({phone:phone}).forEach(function (err, docs) {
    if (docs!=null) {
      c++
    }
  })
  setTimeout(function(){
    if(c > 0)
    res.status(404).send("User already exists")
    else{
      db.users.insert({'name':name,'pass':pass,'phone':phone})
      db.inbox.insert({'name':name, 'phone':phone})
      db.buffer.insert({'name':name, 'phone':phone})
      res.send('Signed up')
    }

  },300)
});

app.get('/message', function(req, res) {
  var receiver = req.param('receiver')
  var sender = req.param('sender')
  var data = req.param('data')
  var query={}
  query[receiver]={'sender':sender,'data':data}
  var query2={}
  query2[sender]={'sender':sender,'data':data}

  db.inbox.update({'phone':sender},{$push:query})
  db.inbox.update({'phone':receiver},{$push:query2})
  db.buffer.update({'phone':receiver},{$push:query2})
  res.status(200).send('sent')
});

app.get('/getchat',function(req,res){
  var chathead = req.param('chathead')
  var inb = req.param('inb')

  db.inbox.find({phone:inb}).forEach(function(err,docs){
    if(docs!=null){
      var field={}
      field[chathead]=[];
      db.buffer.update(
        { phone: inb },
        { $unset: field }
      )
      res.send(docs[chathead])
    }
  })
});

app.get('/buffergetchat',function(req,res){
  var chathead = req.param('chathead')
  var inb = req.param('inb')

  db.buffer.find({phone:inb}).forEach(function(err,docs){
    if(docs!=null){
      var field={}
      field[chathead]=[];
      db.buffer.update(
        { phone: inb },
        { $unset: field }
      )
      res.send(docs[chathead])
    }
  })
});

app.get('/login', function(req, res) {
  var name = req.param('name')
  var pass = req.param('pass')
  var phone = req.param('phone')
  db.users.find({name:name,pass:pass,phone:phone},function (err, docs) {
    if (docs!=null)
    if(docs.length>0) {
      res.send('Successfully logged in')
      return;
    }
    else {
      res.status(404).send('Incorrect credentials')
      return;
    }
  })
});

app.get('/getcontacts', function(req,res){
  console.log(req.param('contacts'));
  var list = JSON.parse(req.param('contacts'))
  var c=[]
  for(var num in list ){
    db.users.find({phone: list[num].toString()}).forEach(function (err, docs) {
      if (docs!=null) {
        var userObj=docs
        delete userObj.pass
        c.push(userObj)
      }
    })
  }
  setTimeout(function(){
    res.send(c)
  },300)
});

app.get('/', function(req,res){
  console.log(req.query);
  res.send('ok')
});

app.listen(8080);
console.log('Server has started');
