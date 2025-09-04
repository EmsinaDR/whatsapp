const { exec } = require("child_process");

// Jalankan schedule:work
const process = exec(
  '"C:\\laragon\\bin\\php\\php-8.3.10-Win32-vs16-x64\\php.exe" "C:\\laragon\\www\\siakad\\whatsapp" schedule:work',
  { cwd: 'C:\\laragon\\www\\siakad' }
);

process.stdout.on('data', (data) => console.log(data));
process.stderr.on('data', (data) => console.error(data));
process.on('exit', (code) => console.log(`Scheduler exited with code ${code}`));
