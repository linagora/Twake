/** This too will clean up the languages keys if they are not used anywhere in the code */

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

function exec(command, args) {
  return new Promise(done => {
    const cmd = cp.spawn(command, args);

    cmd.stdout.on("data", function (data) {
      console.log(data.toString());
    });

    cmd.stderr.on("data", function (data) {
      console.log(data.toString());
    });

    cmd.on("exit", function (code) {
      done({ code });
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

(async () => {
  let withErrors = 0;

  for (const path of srcFiles) {
    console.log(`Running ${path}...`);
    const args = `test/e2e/${
      path.split("test/e2e/")[1]
    } --forceExit --coverage --detectOpenHandles --runInBand --testTimeout=60000 --verbose false`;
    try {
      const out = await exec("jest", args.split(" "));
      if (out !== 0) {
        withErrors++;
      }
    } catch (err) {
      console.log(`Error with command: ${err}`);
    }
    console.log(`Ended ${path}\n\n\n\n`);
  }

  process.exit(withErrors ? 1 : 0);
})();
