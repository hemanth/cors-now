'use strict';
const { parse } = require('url');
const pipe = require('promisepipe');
const fetch = require('node-fetch');
const marked = require('marked-promise');
const { readFile } = require('fs-promise');

module.exports = async (req, res) => {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = true;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-reqed-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Authorization, Accept";

    // landing page
    if (req.url === '/' || req.url === '/favicon.ico') {
        try {
            const markdownString = await readFile('./readme.md', {encoding: 'utf8'});
            const content = await marked(markdownString);

            // send homepage
            res.setHeader('Content-Type', 'text/html; charset=utf8');
            res.end(content);
        } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return { error: 'Yikes! Report to @gnumanth' }
        }
    } else {
        // fetch and respond
        const endpoint = req.url.substring(1);
        const parsed = parse(endpoint);
        const response = await fetch(endpoint, {
          headers: Object.assign({}, req.headers, {
            'host': parsed.hostname
          })
        });

        // send headers
        res.statusCode = response.status;
        res.setHeader('Content-Type', response.headers.get("content-type"));
        await pipe(response.body, res);
    }
}
