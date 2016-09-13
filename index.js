'use strict';
const http = require('http');
const url = require('url');
const fetch = require('isomorphic-fetch');
const marked = require('marked');
const readFile = require('fs').readFile;

var server = http.createServer(function (request, resp) {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = true;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Authorization, Accept";

    // landing page
    if (request.url === '/' || request.url === '/favicon.ico') {
      readFile('./readme.md', {encoding: 'utf-8'}, (err, markdownString) => {
        marked(markdownString, (err, content) => {
          if (err) {
            resp.end(JSON.stringify({ error: 'Yikes! Report to @gnumanth'}));
          }
          // send headers
          headers['Content-Type'] = 'text/html';
          resp.writeHead(200, headers);
          resp.end(content);
        });
      });
    } else {
      //fetch and respond
      fetch(request.url.replace('/',''))
      .then(response => {
        let contentType = response.headers.get("content-type");
        // send headers
        headers['Content-Type'] = contentType;
        resp.writeHead(200, headers);

        // The below shall be a module later ;)
        if (!!~contentType.indexOf('json')) {
          return response.json();
        }
        else if (!!~contentType.indexOf('text')) {
          type = 'text'
          return response.text();
        }
        else if (!!~contentType.indexOf('blob')) {
          type = 'blob'
          return response.blob();
        }
        else if (!!~contentType.indexOf('buffer')) {
          type = 'buffer'
          return response.arrayBuffer();
        } 
      })
      .then(data => resp.end(JSON.stringify(data)))
      .catch(error => {
        resp.end(JSON.stringify({ error: error.toString()}));
      });
    }
});

var port = process.env.PORT || 3000;
server.listen(port, function() {
    console.log("Server running at http://127.0.0.1/ on port " + port);
});


