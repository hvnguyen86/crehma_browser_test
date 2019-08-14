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

var base64Key = "fJW7ebII2E4RU3fD4BjixIDnV++0mq8LUY5TMx2C/g5nRDDies4AFLZ939sU1uoMH+uey1xUMKVSFCd+VNXg+4yOS1M/DtM+9ObW108iNmlXZQsKgXLkRLrBkZ78y2r8Mml3WXe14ktXjCjhRXTx5lBsTKMEcBTxepe1aQ+0hLNOUDhsUKr31t9fS5/9nAQC7s9sPln54Oic1pnDOIfnBEku/vPl3zQCMtU2eRk9v+AfschSUGOvLV6Ctg0cGuSi/h8oKZuUYXrjoehUo1gBvZLVBpcCxZt1/ySGTInLic3QbfZwlT5sJKrYvfHXjANOEIM7JZMaSnfMdK2R9OJJpw=="

const signButton = document.querySelector("#signButton");




async function importKey(base64key){
    var promise_key = await crypto.subtle.importKey("raw",base64StringToArrayBuffer(base64Key),{name: "HMAC", hash: {name: "SHA-256"}}, false, ["sign", "verify"]);

    return promise_key;
}


importKey(base64Key).then(function(key){
    private_key_object = key
})


async function start(){
    var sv = await sign_tbs(private_key_object,data)
    console.log(sv)
}


function encrypt_data()
{
    encrypt_promise = crypto.subtle.sign({name: "HMAC"}, private_key_object, convertStringToArrayBufferView(data));

    encrypt_promise.then(
        function(result_signature){
            signature = result_signature; //signature generated
            console.log(arrayBufferToBase64(signature))
            decrypt_data();
            //console.log(signature);
        }, 
        function(e){
            console.log(e);
        }
    );
}

async function sign_tbs(key,tbs)
{
    var sv = await crypto.subtle.sign({name: "HMAC"}, key, convertStringToArrayBufferView(tbs));

    return sv
}

async function verify_tbs(key,tbs,sv){
    var valid = await crypto.subtle.verify({name: "HMAC"}, key, sv, convertStringToArrayBufferView(tbs));
    return valid;
}

async function hash(body){
    var hash = await crypto.subtle.digest({name: "SHA-256"}, convertStringToArrayBufferView(body));
    return hash 
}

function decrypt_data()
{
    decrypt_promise = crypto.subtle.verify({name: "HMAC"}, private_key_object, signature, convertStringToArrayBufferView(data));

    decrypt_promise.then(
        function(result){
            console.log(result);//true or false
        },
        function(e){
            console.log(e.message);
        }
    );
}

function hash_data(){
    var promise = crypto.subtle.digest({name: "SHA-256"}, convertStringToArrayBufferView(data));   
    
    promise.then(function(result){
        var hash_value = arrayBufferToBase64(result);
    });
}