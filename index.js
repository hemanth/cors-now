'use strict';
var http = require('http');
var url = require('url');
var fetch = require('isomorphic-fetch');

var server = http.createServer(function (request, resp) {
    var headers = {};
    headers['Content-Type'] = 'application/json';
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = true;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Authorization, Accept";
    
    // send headers
    resp.writeHead(200, headers);

    //fetch and respond
    fetch(request.url.replace('/',''))
    .then(response => {
      // The below shall be a module later ;)
      var contentType = response.headers.get("content-type");
      if (!!~contentType.indexOf('json')) {
        return response.json();
      }
      if (!!~contentType.indexOf('text')) {
        return response.text();
      }
      if (!!~contentType.indexOf('blob')) {
        return response.blob();
      }
      if (!!~contentType.indexOf('buffer')) {
        return response.arrayBuffer();
      }
    })
    .then(data => resp.end(JSON.stringify(data)))
    .catch(error => {
      resp.end(JSON.stringify({ error: error.toString()}));
    });
});

var port = process.env.PORT || 3000;
server.listen(port, function() {
    console.log("Server running at http://127.0.0.1/ on port " + port);
});


