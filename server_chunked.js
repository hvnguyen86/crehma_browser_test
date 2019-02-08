var http = require('http');
const url = require('url');

http.createServer(function (request, response) {
    response.setHeader('Content-Type', 'text/html; charset=UTF-8');
    response.setHeader('Transfer-Encoding', 'chunked');
    var urlObject = url.parse(request.url, true);
    var query = urlObject.query;
    var malcontent = query["res"];

    var html =
        '<!DOCTYPE html>' +
        '<html lang="en">' +
            '<head>' +
                '<meta charset="utf-8">' +
                '<title>Chunked transfer encoding test</title>' +
                malcontent +
            '</head>' +
            '<body>';

    response.write(html);
    response.end("");

}).listen(process.env.VMC_APP_PORT || 3000, null);