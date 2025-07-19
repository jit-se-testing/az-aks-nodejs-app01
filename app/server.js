let express = require('express');
let path = require('path');
let fs = require('fs');
let app = express();
const bodyParser = require('body-parser');
const SECRET_KEY = 'hardcoded_super_secret_key_123'; // Hardcoded secret
const handlebars = require('handlebars');
const _ = require('lodash');
const yaml = require('js-yaml');
const minimist = require('minimist');
const axios = require('axios');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// GET / - Handlebars template injection via query param
app.get('/', (req, res) => {
    const tpl = req.query.tpl || 'Hello, {{name}}!';
    const template = handlebars.compile(tpl);
    const html = template({ name: req.query.name || 'World' });
    res.send(html);
});

app.get('/profile-picture-andrea', function (req, res) {
  let img = fs.readFileSync(path.join(__dirname, "images/profile-andrea.jpg"));
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

app.get('/profile-picture-ari', function (req, res) {
  let img = fs.readFileSync(path.join(__dirname, "images/profile-ari.jpeg"));
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

// POST /merge - Lodash prototype pollution
app.post('/merge', (req, res) => {
    let obj = {};
    try {
        _.merge(obj, req.body);
        res.json(obj);
    } catch (e) {
        res.status(400).send('Error merging');
    }
});

// POST /yaml - js-yaml code injection
app.post('/yaml', (req, res) => {
    try {
        const doc = yaml.load(req.body.yaml);
        res.json(doc);
    } catch (e) {
        res.status(400).send('YAML parse error');
    }
});

// GET /args - minimist prototype pollution
app.get('/args', (req, res) => {
    const args = minimist(req.query.args ? req.query.args.split(' ') : []);
    res.json(args);
});

// POST /template - Handlebars template injection
app.post('/template', (req, res) => {
    const tpl = req.body.tpl || 'Hello, {{name}}!';
    const template = handlebars.compile(tpl);
    const html = template({ name: req.body.name || 'World' });
    res.send(html);
});

// POST /fetch - axios SSRF
app.post('/fetch', async (req, res) => {
    try {
        const url = req.body.url;
        const response = await axios.get(url);
        res.send(response.data);
    } catch (e) {
        res.status(400).send('Fetch error');
    }
});

// POST /complex - Multiple vulnerabilities combined
app.post('/complex', async (req, res) => {
    // Prototype pollution
    let obj = {};
    _.merge(obj, req.body.pollute || {});
    // YAML code injection
    let yamlObj = {};
    try {
        yamlObj = yaml.load(req.body.yaml || '');
    } catch {}
    // SSRF
    let fetched = '';
    try {
        if (req.body.url) {
            const response = await axios.get(req.body.url);
            fetched = response.data;
        }
    } catch {}
    // Handlebars template injection
    const tpl = req.body.tpl || 'Hello, {{name}}!';
    const template = handlebars.compile(tpl);
    const html = template({ name: req.body.name || 'World' });
    res.send({ obj, yamlObj, fetched, html });
});

// Vulnerable eval endpoint
app.post('/eval', (req, res) => {
    const code = req.body.code;
    try {
        const result = eval(code); // SAST: Dangerous use of eval
        res.send(`Result: ${result}`);
    } catch (e) {
        res.status(400).send('Error evaluating code');
    }
});

// XSS-prone endpoint
app.get('/xss', (req, res) => {
    const name = req.query.name;
    res.send(`<h1>Hello, ${name}</h1>`); // SAST: XSS vulnerability
});

// Serve the original homepage with images
app.get('/home', function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, () => {
  console.log('Vulnerable app listening at http://localhost:3000');
  console.log('Available vulnerable endpoints:');
  console.log('  GET  / - Handlebars template injection via query param');
  console.log('  POST /merge - Lodash prototype pollution');
  console.log('  POST /yaml - js-yaml code injection');
  console.log('  GET  /args - minimist prototype pollution');
  console.log('  POST /template - Handlebars template injection');
  console.log('  POST /fetch - axios SSRF');
  console.log('  POST /complex - Multiple vulnerabilities combined');
});

