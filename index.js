'use strict';
const { parse } = require('url');
const pipe = require('promisepipe');
const fetch = require('node-fetch');
const marked = require('marked-promise');
const access = require('access-control');
const { readFile } = require('fs-promise');

const cors = access();

module.exports = async (req, res) => {
    if (cors(req, res)) return;

    if (req.url === '/' || req.url === '/favicon.ico') {
        // landing page
        try {
            const markdownString = await readFile('./readme.md', {
                encoding: 'utf8'
            });
            const content = await marked(markdownString);

            // send homepage
            res.setHeader('Content-Type', 'text/html; charset=utf8');
            res.end(content);
        } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return { error: 'Yikes! Report to @gnumanth' };
        }
    } else {
        // fetch and respond
        const endpoint = req.url.substring(1);
        const { protocol, hostname } = parse(endpoint);
        if (!('http:' === protocol || 'https:' === protocol)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return { error: 'Only absolute URLs are supported' };
        }
        const proxyHeaders = Object.assign({}, req.headers, {
            host: hostname
        });
        const response = await fetch(endpoint, {
            headers: proxyHeaders
        });

        // proxy response
        res.statusCode = response.status;
        res.setHeader('Content-Type', response.headers.get('content-type'));
        await pipe(response.body, res);
    }
};
