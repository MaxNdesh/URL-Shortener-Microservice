/**
 * work in progress - got lot's of cleaning up, testing and debugging to do :-)
 */

var express = require("express");
var mongo = require("mongodb").MongoClient;
var shortid = require("shortid");
var app = express();
var port = "8000";
var url = "mongodb://localhost:27017/url_shortener";
var baseUrl = "http://localhost:" + port;

function insertIntoDatabase(shortUrl, urlToShorten) {

    mongo.connect(url, function (err, db) {

        if (err) throw err;
        var collection = db.collection("urlData");
        collection.insert({ "shortUrl": shortUrl, "url": urlToShorten, "createdAt": new Date() }, function (err, data) {

            if (err) return err;
     //   {"original_url":"https://www.google.co","short_url":"https://little-url.herokuapp.com/5274"}
            console.log(JSON.stringify({"original_url":data.ops[0].url, "short_url":data.ops[0].shortUrl}));
        });
    });

}
function validateURL(urlToShorten) {

    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(urlToShorten);

}

app.get("/new/*", function (request, response) {

    var url = request.url;
    var index = url.split("/", 2).join("/").length;
    var urlToShorten = url.substring(index + 1);
    var isURLValid = validateURL(urlToShorten);

    if (isURLValid) {

        //insert the data into the db
        //  var insertData = insertIntoDatabase(urlToShorten);
        var shortUrl = baseUrl + "/" + shortid.generate();
        var insertData = insertIntoDatabase(shortUrl, urlToShorten);
        console.log(insertData);
    

        


    } else {

        //return error response
        response.send(JSON.stringify({
            error: "Wrong url format,"
            + " make sure you have a valid protocol and real site."
        }));
    }

});

app.listen(8000, function () {

    console.log("server is listening on port:" + port);

});