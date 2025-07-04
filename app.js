const express = require('express');
const _ = require('lodash');
const axios = require('axios');
const minimist = require('minimist');
const yaml = require('js-yaml');
const Handlebars = require('handlebars');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Enable body parsing for JSON and text
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true }));

// Vulnerable endpoint 1: Lodash prototype pollution
app.post('/merge', (req, res) => {
  try {
    const userInput = req.body;
    // VULNERABLE: lodash merge can be exploited for prototype pollution
    const merged = _.merge({}, userInput);
    
    // Also vulnerable: lodash template with user input
    const template = _.template(req.body.template || 'Hello <%= name %>');
    const result = template({ name: req.body.name || 'World' });
    
    res.json({ merged, rendered: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vulnerable endpoint 2: js-yaml code injection
app.post('/yaml', (req, res) => {
  try {
    // VULNERABLE: js-yaml load can execute arbitrary code
    const parsed = yaml.load(req.body);
    res.json({ parsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vulnerable endpoint 3: minimist prototype pollution
app.get('/args', (req, res) => {
  try {
    const rawArgs = req.query.args || '--help';
    // VULNERABLE: minimist is vulnerable to prototype pollution
    const parsed = minimist(rawArgs.split(' '));
    res.json({ parsed, prototype: Object.prototype });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vulnerable endpoint 4: handlebars template injection
app.post('/template', (req, res) => {
  try {
    const templateSource = req.body.template || '{{message}}';
    // VULNERABLE: handlebars template compilation with user input
    const template = Handlebars.compile(templateSource);
    const data = req.body.data || { message: 'Hello World' };
    const result = template(data);
    res.send(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vulnerable endpoint 5: axios SSRF potential
app.post('/fetch', async (req, res) => {
  try {
    const url = req.body.url;
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }
    
    // VULNERABLE: axios request to user-controlled URL (SSRF)
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5
    });
    
    res.json({ 
      status: response.status,
      headers: response.headers,
      data: response.data 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vulnerable endpoint 6: combined vulnerabilities
app.post('/complex', (req, res) => {
  try {
    // Multiple vulnerabilities in one endpoint
    const yamlConfig = yaml.load(req.body.config || 'key: value');
    const args = minimist((req.body.args || '--test').split(' '));
    const merged = _.merge(yamlConfig, args);
    
    const template = Handlebars.compile(req.body.template || 'Result: {{result}}');
    const rendered = template({ result: JSON.stringify(merged) });
    
    res.json({
      config: yamlConfig,
      args: args,
      merged: merged,
      rendered: rendered,
      lodashVersion: _.VERSION
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Original endpoint with vulnerabilities
app.get('/', (req, res) => {
  const userTemplate = req.query.template || '{{message}} - Lodash version: {{lodashVersion}}';
  
  // VULNERABLE: handlebars template from query parameter
  const template = Handlebars.compile(userTemplate);
  const data = {
    message: 'Hello World',
    lodashVersion: _.VERSION,
    timestamp: new Date().toISOString()
  };

  res.send(template(data));
});

app.listen(port, () => {
  console.log(`Vulnerable app listening at http://localhost:${port}`);
  console.log('Available vulnerable endpoints:');
  console.log('  GET  / - Handlebars template injection via query param');
  console.log('  POST /merge - Lodash prototype pollution');
  console.log('  POST /yaml - js-yaml code injection');
  console.log('  GET  /args - minimist prototype pollution');
  console.log('  POST /template - Handlebars template injection');
  console.log('  POST /fetch - axios SSRF');
  console.log('  POST /complex - Multiple vulnerabilities combined');
});
