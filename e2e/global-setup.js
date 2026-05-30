// global-setup.js — warms up the backend before any test runs
// Prevents cold-start DB connection failures on first few requests

const http = require('http');

async function httpGet(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      res.resume();
      res.on('end', resolve);
    }).on('error', resolve);
  });
}

module.exports = async function globalSetup() {
  // Warm up backend with a few lightweight requests
  for (let i = 0; i < 3; i++) {
    await httpGet('http://localhost:5000/api/health');
    await httpGet('http://localhost:5000/api/poojas/categories');
  }
};
