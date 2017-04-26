/**
 *A JavaScript app that enables one to pass a URL as a parameter and receive 
 *a shortened URL in the JSON response.
 *freeCodeCamp - https://www.freecodecamp.com/challenges/url-shortener-microservice
 */
var express = require("express");
var mongo = require("mongodb").MongoClient;
var shortid = require("shortid");
var app = express();
var port = "8000";
var mongoUrl = "mongodb://localhost:27017/url_shortener";
var baseUrl = "http://localhost:" + port;
var collection = "urlData";

/**
 * query the database to check if the passed url exists
 * @param {*} db 
 * @param {*} urlToShorten 
 * @param {*} resultSet 
 */
var queryDocument = function (db, query, resultSet) {

    db.collection(collection).find(query).toArray(function (err, result) {
        if (err) throw err;
        return resultSet(result);

    });
}
/**
 * insert a document containing, the url to be shortened as well as the shortened url
 * @param {*} db 
 * @param {*} shortUrl 
 * @param {*} urlToShorten 
 * @param {*} resultSet 
 */
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
/**
 * establish a connection to the database
 * @param {*} databaseConnection 
 */
var connectToDatabase = function (databaseConnection) {
    mongo.connect(mongoUrl, function (err, db) {

        if (err) throw err;

        return databaseConnection(db);
    })
}
/**
 * check if the url is valid
 * @param {*} urlToShorten 
 */
function validateURL(urlToShorten) {

    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(urlToShorten);

}

app.get("/new/*", function (request, response) {

    var url = request.url;
    var index = url.split("/", 2).join("/").length;
    var urlToShorten = url.substring(index + 1);
    var isURLValid = validateURL(urlToShorten);
    var query = { url: urlToShorten };

    if (isURLValid) {

        var shortUrl = baseUrl + "/" + shortid.generate();
        connectToDatabase(function (db) {
            /**
             * check if the url to shorten exists in the db, 
             * if it does, fetch the shortened url and return response.
             */
            queryDocument(db, query, function (result) {

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

app.get("/:shortened_url", function (request, response) {

    var hash = request.params.shortened_url;
    var url = "http://localhost:" + port + "/" + hash;
    var query = { shortUrl: url };
    connectToDatabase(function (db) {

        queryDocument(db, query, function (result) {
            result.length === 1
                ? response.redirect(result[0].url)
                : response.send(JSON.stringify({ error: "This url is not in the database." }));
        })
        db.close();
    });
});

app.listen(port, function () {

    console.log("server is listening on port:" + port);

});