'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
var bodyParser = require('body-parser');
var autoIncrement = require('mongoose-auto-increment');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 


function done (error, data) {
  if (error) { 
    console.log(error); 
  } else { 
    console.log(data); 
  }
}

var Schema = mongoose.Schema;

var WebsiteSchema = new Schema ({
  _id: {
    type: Number,
    required: true,
    unique: true
  },
  original_url: {
    type: String,
    required: true,
    unique: true
  },
  ip_address: {
    type: String,
    required: true
  }
});

autoIncrement.initialize(mongoose.connection);
WebsiteSchema.plugin(autoIncrement.plugin, {
                                             model: 'Website',
                                             field: '_id',
                                             startAt: 1
                                           });
var Website = mongoose.model('Website', WebsiteSchema);


app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", (req, res) => {
  var url = String(req.body.url).replace(/(https?:\/\/|(\s)|(&nbsp;))/gi, '');
  dns.lookup(url, (err, address, family) => {
    (err === null ? 
     (() => {
      let website = new Website({ original_url: req.body.url, ip_address: address });
      website.save(( error, data ) => {
        if (error) {
          done(error);
        } else {
          res.json({ "original_url": req.body.url, "short_url": data._id }) 
          done(null, data);
        }
      });
     })()
     : res.json({"error":"invalid URL"}));
    // console.log(`error: ${ err } address: ${ address } family: IPv${ family }`);
  });  
});

app.get("/api/shorturl/:shortUrl", (req, res) => {
  var shortUrl = req.params.shortUrl;
  Website.findById(shortUrl, (error, data) => {
    if (error) {
      res.json({"error":"invalid URL"});
      done(error);
    } else {
      res.redirect(data.original_url);
      done(null, data);
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});