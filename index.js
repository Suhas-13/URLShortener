var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    http = require('http').Server(app),
    mongoose = require('mongoose'),
    btoa = require('btoa'),
    atob = require('atob'),
    promise,
    connectionString = "mongodb://127.0.0.1:27017",
    port = process.env.PORT || 80;
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
    res.sendFile('views/index.html', {
        root: __dirname
    });
});

// Counter Collection Schema
var countersSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    count: { type: Number, default: 0 }
});

var Counter = mongoose.model('Counter', countersSchema);

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

// Reset the app to default values when starting the server
//
// WARNING: Do this only when you want a fresh instance of the application else
// comment the code.
/*
promise.then(function(db) {
    console.log('APP: Connected to MongoDB');
    URL.remove({}, function() {
        console.log('APP: URL collection emptied');
    })
    Counter.remove({}, function() {
        console.log('APP: Counter collection emptied');
        console.log('APP: Initializing Counter collection with a default value');
        var counter = new Counter({_id: 'url_count', count: 10000});
        counter.save(function(err) {
            if(err) {
                console.error('APP: Error while initializing counter');
                return console.error(err);
            }
            console.log('APP: Counter has been initialized');
        });
    });
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