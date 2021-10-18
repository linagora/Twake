/** This too will clean up the languages keys if they are not used anywhere in the code */

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

function exec(command, options = { log: false, cwd: process.cwd() }) {
  if (options.log) console.log(command);

  return new Promise((done, failed) => {
    cp.exec(command, { ...options }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        failed(err);
        return;
      }

      done({ stdout, stderr });
    });
  });
}

let srcFiles = [];
let srcPath = __dirname;
function throughDirectory(directory) {
  fs.readdirSync(directory).forEach(file => {
    const abs = path.join(directory, file);
    if (fs.statSync(abs).isDirectory()) return throughDirectory(abs);
    else return srcFiles.push(abs);
  });
}
throughDirectory(srcPath);

srcFiles = srcFiles.filter(p => p.indexOf(".spec.ts") >= 0 || p.indexOf(".test.ts") >= 0);

for (const path of srcFiles) {
  const cmd = `jest test/e2e/${
    path.split("test/e2e/")[1]
  } --forceExit --coverage --detectOpenHandles --runInBand --testTimeout=60000 --verbose false`;
  exec(cmd);
}
