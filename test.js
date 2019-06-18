var base64url = require("base64url");
var crypto = require('crypto');
console.log(base64url.fromBase64(crypto.createHash('sha256').update("Hello World").digest('base64')));
