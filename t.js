const express = require('express');
const bodyParser = require('body-parser');
const libxml = require('libxmljs');
const vm = require('vm');
const _ = require('lodash');
const yaml = require('js-yaml');

const app = express();
app.use(bodyParser.text());
app.use(bodyParser.json());

// VULNERABLE: XML External Entity (XXE) processing
function parseXml(xmlString) {
  try {
    // VULNERABLE: libxmljs with XXE enabled
    return libxml.parseXmlString(xmlString, { 
      noent: true,    // Enable entity substitution (XXE vulnerability)
      noblanks: false,
      nocdata: false 
    });
  } catch (error) {
    throw new Error('XML parsing failed: ' + error.message);
  }
}

// VULNERABLE: VM code execution
function executeCode(code, context = {}) {
  // VULNERABLE: vm.runInNewContext can be exploited
  return vm.runInNewContext(code, context, {
    timeout: 1000,
    displayErrors: true
  });
}

// Vulnerable endpoint 1: XXE via XML upload
app.post('/upload', (req, res) => {
  try {
    const xmlData = req.body;
    const xmlDoc = parseXml(xmlData);
    res.json({ 
      success: true, 
      root: xmlDoc.root() ? xmlDoc.root().name() : null,
      content: xmlDoc.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vulnerable endpoint 2: Code injection via VM
app.post('/execute', (req, res) => {
  try {
    const code = req.body.code || 'Math.random()';
    const context = req.body.context || {};
    
    // VULNERABLE: executing user-provided code
    const result = executeCode(code, context);
    res.json({ result, code, context });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vulnerable endpoint 3: Combined XML + YAML + lodash
app.post('/process', (req, res) => {
  try {
    const xmlString = req.body.xml || '<root><item>test</item></root>';
    const yamlString = req.body.yaml || 'key: value';
    
    // Multiple vulnerabilities
    const xmlDoc = parseXml(xmlString);
    const yamlData = yaml.load(yamlString); // VULNERABLE: yaml.load
    const merged = _.merge({ xml: xmlDoc.toString() }, yamlData); // VULNERABLE: lodash merge
    
    res.json({
      xml: xmlDoc.root() ? xmlDoc.root().name() : null,
      yaml: yamlData,
      merged: merged,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vulnerable endpoint 4: Dynamic code execution with XML parsing
app.post('/dynamic', (req, res) => {
  try {
    const xmlData = req.body.xml || '<code>console.log("Hello from XML")</code>';
    const xmlDoc = parseXml(xmlData);
    
    // Extract code from XML and execute it
    const codeNodes = xmlDoc.find('//code');
    const results = [];
    
    codeNodes.forEach(node => {
      try {
        const code = node.text();
        const result = executeCode(code, { 
          console: { log: (msg) => results.push(msg) },
          _: _,
          yaml: yaml
        });
        results.push(result);
      } catch (err) {
        results.push('Error: ' + err.message);
      }
    });
    
    res.json({
      xml: xmlDoc.toString(),
      executionResults: results,
      nodeCount: codeNodes.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Secondary vulnerable server listening on port 3001');
  console.log('Available vulnerable endpoints:');
  console.log('  POST /upload - XXE via libxmljs');
  console.log('  POST /execute - Code injection via vm');
  console.log('  POST /process - Combined XML/YAML/lodash vulnerabilities');
  console.log('  POST /dynamic - Dynamic code execution from XML');
});
