const fs = require('fs');
const path = require('path');
const http = require('http');

// a map from extname to content type - extend if necessary
const extnameToContentType = {
    'js'   : 'text/javascript',
    'css'  : 'text/css',
    'html' : 'text/html',
    'json' : 'text/json',
    'png'  : 'image/png',
    'jpg'  : 'image/jpeg',
    'jpeg' : 'image/jpeg',
};

const server = http.createServer(async (req, res) => {
    // ensure that request path does not jump out of the project root
    const requestPath = path.normalize(req.url);
    if (requestPath.startsWith('..')) {
        res.writeHead(403);
        res.end();
        console.log(`403 ${req.method} ${req.url}`);
    }

    // get a file path from the project root
    const rootPath = path.join(__dirname, '..');
    let filePath = path.join(rootPath, requestPath);
    if (filePath.endsWith(path.sep)) {
        filePath = path.join(filePath, 'index.html');
    }

    // get an appropriate Content-Type
    const extname = path.extname(filePath).substring(1);
    const contentType = extnameToContentType[extname.toLowerCase()] || 'application/octet-stream';

    try {
        // if the file can be read, respond with 200 and data
        const data = fs.readFileSync(filePath);
        res.setHeader('Content-Type', contentType);
        res.writeHead(200);
        res.end(data);
        console.log(`200 ${req.method} ${req.url}`);
    } catch (e) {
        // if the file cannot be read, respond with an empty 404
        res.writeHead(404);
        res.end();
        console.log(`404 ${req.method} ${req.url}`);
    }
});

// read the port from the environment variable PORT, defaulting to 3000
const port = process.env.PORT || 3000;
server.listen(port, e => {
    console.log(`Listening on port ${port}`);
});
