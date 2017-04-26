/**
 * work in progress - TO-DO: add redirect functionality and test
 */
var express = require("express");
var mongo = require("mongodb").MongoClient;
var shortid = require("shortid");
var app = express();
var port = "8000";
var mongoUrl = "mongodb://localhost:27017/url_shortener";
var baseUrl = "http://localhost:" + port;
var collection = "urlData";


var queryDocument = function (db, urlToShorten, resultSet) {

    db.collection(collection).find({ url: urlToShorten }).toArray(function (err, result) {
        if (err) throw err;

        return resultSet(result);

    });
}

var insertDocument = function (db, shortUrl, urlToShorten, resultSet) {

    db.collection(collection).insertOne({
        "shortUrl": shortUrl,
        "url": urlToShorten,
        "createdAt": new Date()
    },
        function (err, result) {
            if (err) throw err

            return resultSet(result);
        })
}

var connectToDatabase = function (databaseConnection) {
    mongo.connect(mongoUrl, function (err, db) {

        if (err) throw err;

        return databaseConnection(db);
    })
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
    console.log("the url to shorten:" + urlToShorten);
    if (isURLValid) {

        var shortUrl = baseUrl + "/" + shortid.generate();
        connectToDatabase(function (db) {
            /**
             * check if the url to shorten exists in the db, 
             * if it does, fetch the shortened url and return response.
             */
            queryDocument(db, urlToShorten, function (result) {

                if (result.length !== 0) {
                    db.close();
                    response.send(JSON.stringify({
                        original_url: result[0].url,
                        short_url: result[0].shortUrl
                    }));

                } else {
                    /**
                       * if the url does not exist, then insert it into the database, 
                       * get result-set and return response.
                       */
                    insertDocument(db, shortUrl, urlToShorten, function (result) {

                        db.close();
                        response.send(JSON.stringify({
                            original_url: result.ops[0].url,
                            short_url: result.ops[0].shortUrl
                        }));
                    });

                }

            });
        });
    } else {

        //return error response
        response.send(JSON.stringify({
            error: "Wrong url format,"
            + " make sure you have a valid protocol and real site."
        }));
    }
});

app.listen(port, function () {

    console.log("server is listening on port:" + port);

});