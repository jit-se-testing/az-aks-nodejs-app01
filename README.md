# GH-NODEJS-APP

## Overview

This Node.js application is intentionally vulnerable and designed for security testing, SCA (Software Composition Analysis), and SAST (Static Application Security Testing) demonstrations. It contains multiple endpoints with common web vulnerabilities, as well as infrastructure and dependency misconfigurations.

**Warning:** Do NOT deploy this app in production. It is for educational and testing purposes only.

---

## How to Run

1. Install dependencies:
   ```sh
   cd app
   npm install
   ```
2. Start the server:
   ```sh
   node server.js
   ```
3. The app will be available at [http://localhost:3000](http://localhost:3000)

---

## Vulnerable Endpoints & How to Breach Them

### 1. Handlebars Template Injection (GET)
- **Endpoint:** `GET /`
- **OWASP Top Ten:** A1:2021 - Broken Access Control, A4:2021 - Insecure Design
- **NPM Package:** [`handlebars`](https://www.npmjs.com/package/handlebars) is a logic-less templating engine for JavaScript.
- **How Attackers Could Use This:** If user input is used as a template, attackers can inject template expressions to manipulate output, leak data, or, in less restrictive configurations, execute code. In this app, only simple variable injection is possible, but in other setups, logic or code execution could occur.
- **Exploit Example:**
  - [http://localhost:3000/?tpl=Hello,%20{{name}}!&name=Attacker](http://localhost:3000/?tpl=Hello,%20{{name}}!&name=Attacker)
  - **Result:** `Hello, Attacker!`
- **Risks:** Data leakage, content manipulation, and, in other configurations, remote code execution.
- **Note:** Only simple variable injection works due to Handlebars restrictions.

### 2. Lodash Prototype Pollution (POST)
- **Endpoint:** `POST /merge`
- **OWASP Top Ten:** A8:2021 - Software and Data Integrity Failures
- **NPM Package:** [`lodash`](https://www.npmjs.com/package/lodash) is a utility library offering deep object manipulation functions.
- **How Attackers Could Use This:** By sending specially crafted JSON, attackers can pollute the prototype of JavaScript objects, potentially affecting application logic or security controls globally.
- **Exploit Example:**
  ```sh
  curl -X POST -H "Content-Type: application/json" -d '{"__proto__":{"polluted":"yes"}}' http://localhost:3000/merge
  ```
- **Risks:** Application logic manipulation, privilege escalation, denial of service, or bypassing security checks.

### 3. js-yaml Code Injection (POST)
- **Endpoint:** `POST /yaml`
- **OWASP Top Ten:** A8:2021 - Software and Data Integrity Failures, A1:2021 - Broken Access Control
- **NPM Package:** [`js-yaml`](https://www.npmjs.com/package/js-yaml) parses YAML files and strings in JavaScript.
- **How Attackers Could Use This:** If unsafe YAML types are enabled, attackers could inject code or objects that are executed or deserialized unsafely.
- **Exploit Example:**
  ```sh
  curl -X POST -H "Content-Type: application/json" -d '{"yaml":"foo: bar"}' http://localhost:3000/yaml
  ```
- **Risks:** Remote code execution, data tampering, or denial of service (in unsafe configurations).

### 4. minimist Prototype Pollution (GET)
- **Endpoint:** `GET /args`
- **OWASP Top Ten:** A8:2021 - Software and Data Integrity Failures
- **NPM Package:** [`minimist`](https://www.npmjs.com/package/minimist) parses argument strings into objects.
- **How Attackers Could Use This:** By passing arguments like `--__proto__.polluted=yes`, attackers can pollute the prototype of all objects, potentially altering application behavior.
- **Exploit Example:**
  ```sh
  curl "http://localhost:3000/args?args=--__proto__.polluted=yes"
  ```
- **Risks:** Application logic manipulation, privilege escalation, or bypassing security controls.

### 5. Handlebars Template Injection (POST)
- **Endpoint:** `POST /template`
- **OWASP Top Ten:** A1:2021 - Broken Access Control, A4:2021 - Insecure Design
- **NPM Package:** [`handlebars`](https://www.npmjs.com/package/handlebars)
- **How Attackers Could Use This:** Same as the GET variant, attackers can control the template logic and output, potentially leaking data or manipulating content.
- **Exploit Example:**
  ```sh
  curl -X POST -H "Content-Type: application/json" -d '{"tpl":"Hello, {{name}}!", "name":"Attacker"}' http://localhost:3000/template
  ```
- **Risks:** Data leakage, content manipulation, and, in other configurations, remote code execution.

### 6. Axios SSRF (POST)
- **Endpoint:** `POST /fetch`
- **OWASP Top Ten:** A10:2021 - Server-Side Request Forgery (SSRF)
- **NPM Package:** [`axios`](https://www.npmjs.com/package/axios) is a promise-based HTTP client for Node.js.
- **How Attackers Could Use This:** Attackers can make the server request internal or protected resources by supplying arbitrary URLs, potentially accessing sensitive data or internal services.
- **Exploit Example:**
  ```sh
  curl -X POST -H "Content-Type: application/json" -d '{"url":"http://example.com"}' http://localhost:3000/fetch
  ```
- **Risks:** Access to internal services, data exfiltration, or pivoting to further attacks.

### 7. Multiple Vulnerabilities Combined (POST)
- **Endpoint:** `POST /complex`
- **OWASP Top Ten:** Multiple (A8:2021, A10:2021, A1:2021, A4:2021)
- **NPM Packages:** [`lodash`, `js-yaml`, `axios`, `handlebars`]
- **How Attackers Could Use This:** Attackers can combine prototype pollution, SSRF, YAML injection, and template injection for chained or more severe attacks.
- **Exploit Example:**
  ```sh
  curl -X POST -H "Content-Type: application/json" -d '{"pollute":{"__proto__":{"polluted":"yes"}}, "yaml":"foo: bar", "url":"http://example.com", "tpl":"Hello, {{name}}!", "name":"Attacker"}' http://localhost:3000/complex
  ```
- **Risks:** Chained attacks, privilege escalation, data leakage, and remote code execution (in unsafe configurations).

### 8. XSS and Eval (for SAST)
- **Endpoint:** `GET /xss` and `POST /eval`
- **OWASP Top Ten:**
  - `/xss`: A3:2021 - Injection (Cross-Site Scripting)
  - `/eval`: A1:2021 - Broken Access Control, A3:2021 - Injection
- **NPM Packages:**
  - `/xss`: No package, just unsafe string rendering
  - `/eval`: Native JavaScript `eval()`
- **How Attackers Could Use This:**
  - `/xss`: Inject JavaScript into the page, leading to session hijacking, defacement, or phishing.
  - `/eval`: Execute arbitrary code on the server, leading to full server compromise.
- **Exploit Example:**
  - `/xss`: `http://localhost:3000/xss?name=<img src=x onerror=alert(1)>`
  - `/eval`: `curl -X POST -H "Content-Type: application/json" -d '{"code":"2+2"}' http://localhost:3000/eval`
- **Risks:**
  - `/xss`: Session theft, user impersonation, or malware delivery.
  - `/eval`: Remote code execution, data theft, or server takeover.

### 9. Original Homepage
- **Endpoint:** `GET /home`
- **Description:** Serves the original static homepage with images. Not vulnerable.

---

## How to Demo

1. **Start the app** as described above.
2. **Show the vulnerable endpoints** using the provided curl commands or by visiting the URLs in your browser.
3. **Explain the risk:**
   - User input is used unsafely, leading to vulnerabilities like prototype pollution, SSRF, XSS, and template injection.
   - Some vulnerabilities (like Handlebars template injection) are limited by the library’s restrictions, but still demonstrate the risk of using user input as templates.
4. **Show the `/home` endpoint** to demonstrate the original, non-vulnerable homepage.

---

## Disclaimer
This project is for educational and demonstration purposes only. Do not use in production environments.
