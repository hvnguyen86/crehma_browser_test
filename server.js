const http = require('http');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const querystring = require('querystring');
const path = require('path');
const crehma = require('./crehma.js')

var headerFields = {
    "cc": "Cache-Control",
    "et": "ETag",
    "lm": "Last-Modified",
    "ex": "Expires",
    "va": "Vary"
};



var unsafeMethods = ["POST","DELETE","PATCH","PUT"];
var host = "139.6.102.29";
host = "cachetest.hoaiviet.de";
host = "ec2-34-252-120-148.eu-west-1.compute.amazonaws.com";
host = "ec2-34-241-245-90.eu-west-1.compute.amazonaws.com";
//host = "ec2-52-59-249-33.eu-central-1.compute.amazonaws.com:3000";
//host = "139.6.102.38:3000";
var httpServer = http.createServer(requestHandler);
var lastModified;
var timeStamps = {};

function requestHandler(req, res) {
    // Uncomment to enable logging
    console.log(req.method);
    console.log(req.url);
    console.log(req.headers);
    console.log("-----")
    var requestBody = "";
    req.on('data', function(chunk) {
        requestBody += chunk;
    });

    req.on('end', function() {
        console.log("Body:");
        console.log(requestBody);
        console.log("Body-Length:", requestBody.length);
        console.log("-----")
    });

    req.headers["host"] = host;

    if(req.headers["signature"]){
        if(!crehma.verifyRequest(req)){
            res.statusCode = 403;
            var body = "Invalid Signature";
            res.setHeader("Content-Type","text/plain");
            res.setHeader("Content-Length",body.length)
            res.setHeader("Cache-Control","no-store");
            res.setHeader("Signature",crehma.signResponse(res, body, req.method, host+req.url));
            return res.end(body);
        }
    }
    

    var responseString = req.headers["x-response"] ? req.headers["x-response"] : "";

    var urlObject = url.parse(req.url, true);
    var query = urlObject.query;
    var queryParamsResponse = parseResponseString(responseString);

    // Specifiying the response with url query
    if (query.rs) {
        queryParamsResponse = parseResponseString(query.rs);
    }

    var urlPath = urlObject.pathname;

    var id = "";

    var accept = req.headers["accept"] ? req.headers["accept"] : req.headers["x-accept"];

    var tag = "";

    if (query.ac) {
        accept = query.ac;
    }

    if(query.tag){
        tag = query.tag;
    }

    var timeStamp = query["ts"];

    if (query["res"]){
            res.setHeader("X-Response-Splitting-Url",decodeURI(query["res"]));
    }

    //res.setHeader("X-Client-IP", req.connection.remoteAddress)

    if (req.headers["x-id"]) {
        id = req.headers["x-id"];
        res.setHeader("X-Id", id);
    } else if (req.headers["id"]) {
        id = req.headers["id"];
        res.setHeader("Id", id);
    }

    if(id == ""){
        id = crypto.randomBytes(8).toString('hex');
        res.setHeader("X-Id", id);
        res.setHeader("Id", id);
    }


    // For XHR
    res.setHeader("Access-Control-Allow-Origin", "*");
    //res.setHeader("Access-Control-Allow-Headers", "X-Id, X-Response, Cache-Control, Set-Cookie");
    res.setHeader("Access-Control-Expose-Headers", "X-Id, Id, Warning, ETag, Tranfer-Encoding")
    // res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, PUT");

    res.setHeader("Date", new Date(Date.now()).toUTCString());

    res.setHeader("Content-Type", "text/html");

    var additionalBodyLength = 500;


    if (urlPath == "/rsc" || urlPath == "/rsc.css" || urlPath == "/rsc.png" || urlPath.startsWith("/rsc/")) {

        //res.setHeader("X-Forwarded-Header", JSON.stringify(req.headers))



        if (queryParamsResponse["st"]) {

            if (queryParamsResponse["st"] == 300 || queryParamsResponse["st"] == 301 || queryParamsResponse["st"] == 302 || queryParamsResponse["st"] == 303 || queryParamsResponse["st"] == 305 || queryParamsResponse["st"] == 307 || queryParamsResponse["st"] == 306) {
                res.statusCode = queryParamsResponse["st"];
                res.setHeader("Location", "http://" + req.headers["host"]);
            } else if (queryParamsResponse["st"] == 500 || queryParamsResponse["st"] == 400) {
                res.statusCode = queryParamsResponse["st"];
                return res.end("");
            } else {
                res.statusCode = queryParamsResponse["st"];
            }
        }


        if (req.method == "PUT" || req.method == "DELETE" || req.method == "PATCH") {
            res.statusCode = 204;
            return res.end("");
        } else if (req.method == "POST") {
            res.statusCode = 201;
            return res.end("");
        }

        if (req.headers["if-none-match"] && req.headers["if-none-match"].replace(/\"/g, "") == "123") {
            res.statusCode = 304;
            
            return res.end("");
        } else if(req.headers["if-none-match"]) {
            var etag = req.headers["if-none-match"].replace(/\"/g, "");
            var tvpWithoutTvp = crehma.getTbsWithoutTvp(etag);
            if(tvpWithoutTvp){
                res.setHeader("Signature", crehma.signTbsWithoutTvp(tvpWithoutTvp));
                res.setHeader("ETag",etag);
                res.statusCode = 304;
                res.setHeader("Validation-Signature",crehma.signResponse(res, "", req.method, host+req.url));
                return res.end("");
            }
            
        }

        if (req.headers["if-modified-since"]) {
            if (req.headers["if-modified-since"]) {
                res.statusCode = 304;
                res.setHeader("Signature",crehma.signResponse(res, "", req.method, host+req.url));
                return res.end("");
            }
        }

        if (req.headers["x-response-splitting"]) {
            res.setHeader("X-Response-Splitting", req.headers["x-response-splitting"]);
        }



        // Set header fields specified by the client
        for (var key in queryParamsResponse) {
            if (key == "exp") {
                var expires = new Date(Date.now() + parseInt(queryParamsResponse[key]) * 1000).toUTCString();
                res.setHeader("Expires", expires);
            } else if (key == "lm") {
                lastModified = new Date(Date.now() + parseInt(queryParamsResponse[key]) * 1000).toUTCString();

                res.setHeader("Last-Modified", lastModified);
            } else if (key == "t") {
                continue;
            } else if (key == "sc") {
                res.setHeader("Set-Cookie", "sid=" + rand_string(16));
            } else if (key == "xsf") {
                res.setHeader("X-Store-Forbidden", "This header field is forbidden to store");
            } else if (key == "abl"){
                additionalBodyLength = queryParamsResponse[key];
            } else if (headerFields[key]) {
                res.setHeader(headerFields[key], queryParamsResponse[key]);
            } 
        }

        

        var body = "Id:" + id;

        if(req.headers["x-http-method-override"] && unsafeMethods.includes(req.headers["x-http-method-override"].toUpperCase())){
            res.setHeader("Content-Type", "text/plain");
            return res.end(body + "Cache poisoning attack with x-http-method-override successful");
        }

        // Set desired resource represenation data format
        if (accept == "application/json") {
            res.setHeader("Content-Type", accept);
            var bodyJson = {};
            bodyJson["Id"] = id;
            bodyJson["BigValue"] = crypto.randomBytes(parseInt(additionalBodyLength)).toString('hex');
            body = JSON.stringify(bodyJson);
        } else if (accept == "application/xml") {
            res.setHeader("Content-Type", accept);
            body = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><id>' + id + '</id>';
        } else if (accept == "text/css" || tag == "style") {
            res.setHeader("Content-Type", accept);
            body = 'p{font-family: ' + id + '}';
        } else if (accept == "image/png" || tag == "img") {
            res.setHeader("Content-Type", accept);
            body = fs.readFileSync("./das_logo.png");
        } else if (accept == "text/plain") {
            res.setHeader("Content-Type", "text/plain");
        } else if (accept == "application/javascript" || tag == "script"){
            res.setHeader("Content-Type", accept);
            body = "var id = '" + id +"';";
        } 

        else {
            res.setHeader("Content-Type", "text/plain");
        }

        //Set language
        if (req.headers["accept-language"]) {
            res.setHeader("Content-Language", req.headers["accept-language"]);
        }
        if(req.headers["create-signature"] == "true"){
            res.setHeader("Content-Length",body.length);
            res.setHeader("Signature",crehma.signResponse(res, body, req.method, host+req.url));
        }
        
        //var etag = crypto.createHash('sha256').update(body).digest('base64').str.substring(0, 5);
        //res.setHeader("ETag",etag);

        return res.end(body);
    }

    // test page for pilot test
    else if(urlPath == "/"){
        var body  = fs.readFileSync("index.html");
        res.setHeader("Cache-Control","no-store");
        if(req.headers["no-signature"] == "0"){
            res.setHeader("Content-Length",body.length);
            res.setHeader("Content-Type","text/html");
            
            var signatureHeader = crehma.signResponse(res,body,req.method,host+req.url);
            res.setHeader("Signature",signatureHeader);
        }
        return res.end(body);
    } else if(urlPath == "/testpage"){
        var body  = fs.readFileSync("testPage.html");

        return res.end(body);
    } else if(urlPath == "/crehma") {
        var body  = fs.readFileSync("crehma.html");

        return res.end(body);
    } else {
      // parse URL
      const parsedUrl = url.parse(req.url);
      // extract URL path
      var pathname = `.${parsedUrl.pathname}`;
      // maps file extention to MIME types
      const mimeType = {
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.eot': 'appliaction/vnd.ms-fontobject',
        '.ttf': 'aplication/font-sfnt'
      };
      fs.exists(pathname, function (exist) {
        if(!exist) {
          // if the file is not found, return 404
          res.statusCode = 404;
          return;
        }
        // if is a directory, then look for index.html
        if (fs.statSync(pathname).isDirectory()) {
          pathname += '/index.html';
        }
        // read file from file system
        fs.readFile(pathname, function(err, data){
          if(err){
            res.statusCode = 500;
            res.end("Error getting the file: ${err}.");
          } else {
            // based on the URL path, extract the file extention. e.g. .js, .doc, ...
            const ext = path.parse(pathname).ext;
            // if the file is found, set Content-type and send data
            res.setHeader('Content-type', mimeType[ext] || 'text/plain' );
            res.end(data);
          }
        });
      });
    }

}

function parseResponseString(responseString) {

    var responseStringArray = responseString.split(";");
    var responseHeaderFields = {};
    for (var i = 0; i < responseStringArray.length; i++) {
        var headerFieldArray = responseStringArray[i].split(":");
        if (headerFieldArray.length == 2) {
            responseHeaderFields[headerFieldArray[0]] = headerFieldArray[1];
        }
    }

    return responseHeaderFields;
}

function rand_string(n) {
    if (n <= 0) {
        return '';
    }
    var rs = '';
    try {
        rs = crypto.randomBytes(Math.ceil(n / 2)).toString('hex').slice(0, n);
    } catch (ex) {
        /* known exception cause: depletion of entropy info for randomBytes */
        console.error('Exception generating random string: ' + ex);
        /* weaker random fallback */
        rs = '';
        var r = n % 8,
            q = (n - r) / 8,
            i;
        for (i = 0; i < q; i++) {
            rs += Math.random().toString(16).slice(2);
        }
        if (r > 0) {
            rs += Math.random().toString(16).slice(2, i);
        }
    }
    return rs;
}

httpServer.listen(3000, function() {
    console.log('App listening on port 3000!');
});