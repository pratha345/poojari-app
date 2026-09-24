// Run on the server from the backend folder: loads each given module (paths relative
// to the backend folder) so a broken upload is caught before PM2 restarts.
// Usage: node deploy_require_check.js src/services/a.js src/controllers/b.js
const path = require('path');
for (const f of process.argv.slice(2)) {
  require(path.join(process.cwd(), f));
  console.log('loaded', f);
}
setTimeout(() => process.exit(0), 500);   // modules may open DB/redis handles
