
var crypto = require('crypto');
var base64url = require("base64url");
var util = require('util');
var buffer = require('buffer');

var base64Key = "fJW7ebII2E4RU3fD4BjixIDnV++0mq8LUY5TMx2C/g5nRDDies4AFLZ939sU1uoMH+uey1xUMKVSFCd+VNXg+4yOS1M/DtM+9ObW108iNmlXZQsKgXLkRLrBkZ78y2r8Mml3WXe14ktXjCjhRXTx5lBsTKMEcBTxepe1aQ+0hLNOUDhsUKr31t9fS5/9nAQC7s9sPln54Oic1pnDOIfnBEku/vPl3zQCMtU2eRk9v+AfschSUGOvLV6Ctg0cGuSi/h8oKZuUYXrjoehUo1gBvZLVBpcCxZt1/ySGTInLic3QbfZwlT5sJKrYvfHXjANOEIM7JZMaSnfMdK2R9OJJpw=="
var key = Buffer.from(base64Key,'base64');
var kid = "jREHMAKey";
var sig = "HMAC/SHA256";
var hash = "SHA256";
var signatureHeaderTemplate = "sig=%s,hash=%s,kid=%s,tvp=%s,addHeaders=%s,sv=%s";

var exports = module.exports = {};

var tbsRequestHeaders = [
"Host",
"Accept",
"Content-Type",
"Transfer-Encoding",
"Content-Length"
].sort()

var tbsResponseHeaders = [ "Content-Type",
"Content-Length",
"Transfer-Encoding",
"Cache-Control",
"Expires",
"ETag",
"Last-Modified"
].sort()


var bodyHashTable = [];

function signResponse(response, body, method, uri){
	var bodyETag = crypto.randomBytes(8).toString('hex');
	response.setHeader("ETag",bodyETag);
	var bodyHash = base64url.fromBase64(crypto.createHash('sha256').update(body).digest('base64'));
	var tvp = new Date().toISOString();
	var tbs = tvp + "\n";
	var tbsWithoutTvp = "";
	tbsWithoutTvp += method + "\n";
	tbsWithoutTvp += uri + "\n";
	tbsWithoutTvp += "HTTP/1.1" + "\n";
	tbsWithoutTvp += response.statusCode + "\n";
	for (var i = 0; i < tbsResponseHeaders.length; i++) {
		if(response.getHeader(tbsResponseHeaders[i])){
			tbsWithoutTvp += response.getHeader(tbsResponseHeaders[i]) + "\n";
		} else {
			tbsWithoutTvp += "\n"
		}
		
	};

	tbsWithoutTvp +=bodyHash;
	tbs +=tbsWithoutTvp;
	
	console.log("****");
	console.log(tbs);
	console.log("****");

	var sv =  base64url.fromBase64(crypto.createHmac("sha256", key).update(tbs).digest("base64"));
	
	bodyHashTable[bodyETag] = tbsWithoutTvp;
	
	signatureHeaderValue = util.format(signatureHeaderTemplate,sig,hash,kid,tvp,"null",sv);
	
	return signatureHeaderValue;

}

function signTbsWithoutTvp(tbsWithoutTvp){

	var tvp = new Date().toISOString();
	var tbs = tvp + "\n";
	tbs +=tbsWithoutTvp;
	
	console.log("****");
	console.log(tbs);
	console.log("****");

	var sv =  base64url.fromBase64(crypto.createHmac("sha256", key).update(tbs).digest("base64"));
	
	signatureHeaderValue = util.format(signatureHeaderTemplate,sig,hash,kid,tvp,"null",sv);
	
	return signatureHeaderValue;

}

function verifyRequest(request){
	var signatureMetaDataArray = request.headers["signature"].split(","); 
	var tvp, sv;
	for (var i = 0; i < signatureMetaDataArray.length; i++) {
		var param = signatureMetaDataArray[i].split("=");
		if(param[0] == "tvp"){
			tvp = param[1];

		} else if(param[0] == "sv"){
			sv = param[1];
		}
	};

	// TODO updated, only with GET here
	var bodyHash = base64url.fromBase64(crypto.createHash('sha256').update("").digest('base64'));
	
	var tbs = tvp + "\n";
	tbs += request.method + "\n";
	tbs += request.url + "\n";
	tbs += "HTTP/1.1" + "\n";
	for (var i = 0; i < tbsRequestHeaders.length; i++) {
		if(request.headers[tbsRequestHeaders[i].toLowerCase()]){
			tbs += request.headers[tbsRequestHeaders[i].toLowerCase()] + "\n";
		} else {
			tbs += "\n"
		}
		
	};
	tbs +=bodyHash;


	var svOfRequest =  base64url.fromBase64(crypto.createHmac("sha256", key).update(tbs).digest("base64"));
	
	if(svOfRequest == sv){
		return true;
	} else {
		return false;
	}
}

function getTbsWithoutTvp(etag){
	return bodyHashTable[etag];
}

exports.signResponse = signResponse;
exports.verifyRequest = verifyRequest;
exports.getTbsWithoutTvp = getTbsWithoutTvp;
exports.signTbsWithoutTvp = signTbsWithoutTvp;
