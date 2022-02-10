/** This too will clean up the languages keys if they are not used anywhere in the code */

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

function exec(command, args, debug = false) {
  return new Promise(done => {
    const cmd = cp.spawn(command, args, {
      shell: true,
    });

    let data = "";
    let error = "";

    cmd.stdout.on("data", function (data) {
      if (debug) console.log(data.toString());
      data += data.toString() + "\n";
    });

    cmd.stderr.on("data", function (data) {
      if (debug) console.log(data.toString());
      error += data.toString() + "\n";
    });

    cmd.on("exit", function (code) {
      cmd.kill(9);

      //The delay is to make sure we get all the missing logs
      setTimeout(() => done({ code, data, error }), code === 0 ? 1 : 5000);
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
  let failed = 0;
  let passed = 0;

  for (const path of srcFiles) {
    const testName = `test/e2e/${path.split("test/e2e/")[1]}`;
    const args = `${testName} --forceExit --coverage --detectOpenHandles --runInBand --testTimeout=60000 --verbose=true`;

    try {
      const out = await exec(
        "jest",
        args.split(" "),
        [
          "test/e2e/workspaces/workspace-users.spec.ts",
          "test/e2e/workspaces/workspaces.invite-tokens.spec.ts",
        ].indexOf(path) >= 0,
      );
      if (out.code !== 0) {
        //To get all the logs, we run it again
        console.log(`FAIL ${testName}`);
        console.log(out.data);
        console.log(out.error);
        await exec("jest", args.split(" "), true);
        failed++;
      } else {
        passed++;
        console.log(`PASS ${testName}`);
      }
    } catch (err) {
      console.log(`ERROR ${testName}`);
      console.log(`-- Error\n ${err}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed, total ${failed + passed}`);

  process.exit(failed > 0 ? 1 : 0);
})();
