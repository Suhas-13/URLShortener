const hostname="192.207.255.69"
var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    http = require('http').Server(app),
    mongoose = require('mongoose'),
    promise,
    connectionString = "mongodb://127.0.0.1:27017",
    port = 5000;
var sanitize = require('mongo-sanitize');

// ExpressJS server start
http.listen(port, function() {
    console.log('Server Started. Listening on *:' + port);
});

// ExpressJS middleware for serving static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

// Base route for front-end
app.get('/', function(req, res) {
    console.log("new get");
    res.sendFile('views/index.html', {
        root: __dirname
    });
});



// URL Collection Schema
var urlSchema = new mongoose.Schema({
    _id: {type: String},
    url: ''
});

var URL = mongoose.model('URL', urlSchema);

// Connect to the MongoDB instance
promise = mongoose.connect(connectionString, {
    useMongoClient: true
});


/*
promise.then(function(db) {
    console.log('APP: Connected to MongoDB');
    URL.remove({}, function() {
        console.log('APP: URL collection emptied');
    })
});
*/

// API for redirection
app.get('/:hash', function(req, res) {
    var baseid = req.params.hash;
    if(baseid) {
        console.log('APP: Hash received: ' + baseid);
        console.log('APP: Decoding Hash: ' + baseid);
        URL.findOne({ _id: baseid }, function(err, doc) {
            if(doc) {
                console.log('APP: Found ID in DB, redirecting to URL');
                res.redirect(sanitize(doc.url));
            } else {
                console.log('APP: Could not find ID in DB, redirecting to home');
                res.redirect('/');
            }
        });
    }
});

// API for shortening
app.post('/shorten', function(req, res, next) {
    var urlData = req.body.url;
    var hash = req.body.hash;
    URL.findOne({_id: hash}, function(err, doc) {
        if(doc) {
            console.log('APP: HASH found in DB');
            res.status(400).send({
                statusTxt: 'Hash already in use.'
            });
        } 
        else {
            console.log('APP: HASH not found in DB, creating new document');
            var url = new URL({
                url: urlData,
                _id:hash
            });
            url.save(function(err) {
                if(err) {
                    return console.error(err);
                }
                res.send({
                    statusTxt: 'OK'
                });
            });
        }
    });
});
