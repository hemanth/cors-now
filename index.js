'use strict';
const http = require('http');
const https = require('https');
const { parse, format } = require('url');
const pipe = require('promisepipe');
const marked = require('marked-promise');
const access = require('access-control');
const { readFile } = require('fs-promise');

const cors = access();

const hopByHopHeaders = new Set([
    'connection',
    'keep-alive',
    'public',
    'proxy-authenticate',
    'transfer-encoding',
    'upgrade'
]);

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
        // proxy and respond
        const endpoint = req.url.substring(1);
        const parsed = parse(endpoint);
        let mod;
        if ('http:' === parsed.protocol) {
            mod = http;
        } else if ('https:' === parsed.protocol) {
            mod = https;
        } else {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return { error: 'Only absolute URLs are supported' };
        }
        parsed.headers = Object.assign({}, req.headers, {
            host: parsed.hostname
        });
        const response = await get(mod, parsed);

        // proxy response
        res.statusCode = response.statusCode;
        for (const name of Object.keys(response.headers)) {
            if (hopByHopHeaders.has(name)) continue;

            let value = res.getHeader(name);
            if (value) {
                // Append to existing values, like "Vary" from the CORS module
                value += `, ${response.headers[name]}`;
            } else {
                value = response.headers[name];
            }

            res.setHeader(name, value);
        }

        // if a 3xx response happened with a redirect, then absolutize
        // it and re-proxy to this CORS proxy
        let location = res.getHeader('location');
        if (location) {
            const locationParsed = parse(location);
            if (
                !('http:' === locationParsed.protocol ||
                    'https:' === locationParsed.protocol)
            ) {
                location = format(
                    Object.assign({}, parsed, {
                        path: null,
                        pathname: location
                    })
                );
            }
            res.setHeader('location', '/' + location);
        }

        await pipe(response, res);
    }
};

function get(mod, parsed) {
    return new Promise((resolve, reject) => {
        mod.get(parsed, resolve).once('error', reject);
    });
}
