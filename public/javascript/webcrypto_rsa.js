function convertStringToArrayBufferView(str)
{
    var bytes = new Uint8Array(str.length);
    for (var iii = 0; iii < str.length; iii++) 
    {
        bytes[iii] = str.charCodeAt(iii);
    }

    return bytes;
}   

var crypto = window.crypto || window.msCrypto;

var promise_key = null;

var private_key_object = null; 
var public_key_object = null; 

var data = "QNimate";

var encrypted_hash = null;
var encrypt_promise = null;

var signature = null;

var decrypt_promise = null;


if(crypto.subtle)
{
    alert("Cryptography API Supported");

    promise_key = crypto.subtle.generateKey({name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: {name: "SHA-256"}}, false, ["sign", "verify"]);

    promise_key.then(function(key){
        private_key_object = key.privateKey;
        public_key_object = key.publicKey;
        encrypt_data();
    });

    promise_key.catch = function(e){

        console.log(e.message);
    }
    
    
}
else
{
    alert("Cryptography API not Supported");
}

function encrypt_data()
{
    encrypt_promise = crypto.subtle.sign({name: "RSASSA-PKCS1-v1_5"}, private_key_object, convertStringToArrayBufferView(data));

    encrypt_promise.then(
        function(result_signature){
            signature = result_signature; //signature generated
            decrypt_data();
        }, 
        function(e){
            console.log(e);
        }
    );
}

function decrypt_data()
{
    decrypt_promise = crypto.subtle.verify({name: "RSASSA-PKCS1-v1_5"}, public_key_object, signature, convertStringToArrayBufferView(data));

    decrypt_promise.then(
        function(result){
            console.log(result);//true or false
        },
        function(e){
            console.log(e.message);
        }
    );
}


function base64StringToArrayBuffer(b64str) {
          var byteStr = atob(b64str)
          var bytes = new Uint8Array(byteStr.length)
          for (var i = 0; i < byteStr.length; i++) {
            bytes[i] = byteStr.charCodeAt(i)
          }
          return bytes.buffer
}