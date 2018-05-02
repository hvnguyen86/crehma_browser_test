
$(".testcases").each(function(){
	var testCases = $(this).val();
    var testCaseLines = testCases.split("\n");

    var html = "";

    for (var i = 0; i < testCaseLines.length; i++) {
    	if(testCaseLines[i].startsWith("##")){
    		html += "<h4 class='testCaseTitle'>" + testCaseLines[i].replace("##","") + "</h4>";
    	}
        if (testCaseLines[i].startsWith("GET") || testCaseLines[i].startsWith("POST") || testCaseLines[i].startsWith("PUT") || testCaseLines[i].startsWith("DELETE") || testCaseLines[i].startsWith("PATCH")) {
            var requestResponseDefinition = parseStep(testCaseLines[i]);
            var url = `http://${location.host}/rsc?`;
            //var responseString = `rs=${requestResponseDefinition.params.s}`
            var responseString = {};

            if(requestResponseDefinition.params.s){
            	responseString.rs = requestResponseDefinition.params.s;
            }
            
            var accept = parseAccept(requestResponseDefinition.params.c);

            if(accept != null){
            	responseString.ac = accept;
            }
            console.log(responseString);
            url += createQuery(responseString);

            html += `<a href="${url}" class='rrl' target="_blank">${url}</a> `;
            html += `<button url="${url}" class='createTag btn btn-sm btn-secondary' tag="img">Image Tag</button> `
            html += `<button url="${url}" class='createTag btn btn-sm btn-secondary' tag="script">Script Tag</button> `
            html += `<button url="${url}" class='createTag btn btn-sm btn-secondary' tag="style">Style Tag</button> `
            html += `<button url="${url}" class='createAjax btn btn-sm btn-secondary' method="${requestResponseDefinition.method}">Ajax</button> `
            html += "<br>";
        }

    }

    $(this).parent().parent().find(".requestArea").html(html);
});

$("body").on("click","button.createTag",function(){
	var url = $(this).attr("url");
	var allowedTags = ["img","script","style"];
	var tagName = $(this).attr("tag");
	var tag = "";
	if(allowedTags.includes(tagName)){
		if(tagName == "img" || tagName == "script")
		tag = `<${tagName} src=${url}></${tagName}>`;
		else if(tagName == "style")
			tag =`<link href=${url} rel="stylesheet" />`;
		$("body").append(tag);
	}
});

$("body").on("click","button.createAjax",function(){
	
	var url = $(this).attr("url");
	var method = $(this).attr("method");
	var xhr = new XMLHttpRequest();
	xhr.open(method,url,false);
	xhr.send();
	
});

function parseAccept(accept){
	if(accept != null && accept != "" && accept.startsWith("ac:")){
		return accept.split(":")[1];
	}

	else{
		return null;
	}
}


function parseStep(step) {
    // extract params from url
    var [tmp, method, url, params_string] = step.match(/([A-Z]+)\s*([^ ]+)(.*)/);

    var params = {};
    // split by receiver
    var matches = params_string.split(/ (-\w{1,2})/);

    for(let i = 0; i < matches.length; i++) {
        let key = matches[i].trim();
        let name = key.substr(1);
        if((name.length == 1 || name.length == 2) && key.substr(0, 1) == "-" && (i + 1) < matches.length) {
            let value = matches[i + 1].trim();
            if (value != "") {
                if(name === "e" || name === "ep") {
                    params[name] = (params[name]) ? params[name] : [];

                    params[name].push(value.replace(/['"](.*)['"]/, "$1"));
                } else {
                    if(!params[name]) {
                        params[name] = "";
                    } else {
                        params[name] += ";";
                    }
                    params[name] += value.replace(/['"](.*)['"]/, "$1");
                }
            }
            i++;
        }
    }

    // expection for private caches
    if(params['ep']) {
        params['e'] = params['ep'];
    }
    return {
        url : url,
        method : method,
        params : params,
    };
};

function getAllUrlParams(url) {

  // get query string from url (optional) or window
  var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

  // we'll store the parameters here
  var obj = {};

  // if query string exists
  if (queryString) {

    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i=0; i<arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=');

      // in case params look like: list[]=thing1&list[]=thing2
      var paramNum = undefined;
      var paramName = a[0].replace(/\[\d*\]/, function(v) {
        paramNum = v.slice(1,-1);
        return '';
      });

      // set parameter value (use 'true' if empty)
      var paramValue = typeof(a[1])==='undefined' ? true : a[1];

      // (optional) keep case consistent
      paramName = paramName.toLowerCase();
      paramValue = paramValue.toLowerCase();

      // if parameter name already exists
      if (obj[paramName]) {
        // convert value to array (if still string)
        if (typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]];
        }
        // if no array index number specified...
        if (typeof paramNum === 'undefined') {
          // put the value on the end of the array
          obj[paramName].push(paramValue);
        }
        // if array index number specified...
        else {
          // put the value at that index number
          obj[paramName][paramNum] = paramValue;
        }
      }
      // if param name doesn't exist yet, set it
      else {
        obj[paramName] = paramValue;
      }
    }
  }

  return obj;
}

function createQuery(params){
	var esc = encodeURIComponent;
	var query = Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');

    return query;
}
