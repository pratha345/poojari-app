// Run on the server from the backend folder: prints the reference chart
// (Amravati, 2001-05-01 22:10) so a deploy can be verified. Exits non-zero on error.
const s = require(process.cwd() + '/src/services/janamPatrikaService.js');
const r = s.generateJanamPatrika({ name: 't', dob: '2001-05-01', tob: '22:10', place: 'x', lat: 20.93, lon: 77.75 });
if (!r.details) { console.error('no details: old service'); process.exit(1); }
console.log([r.details.rashi, r.details.nakshatraPad, r.details.lagna, r.details.dashaBhogya].join(' | '));
