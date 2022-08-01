var fs = require("fs");
var child_process = require("child_process");

fs.readFile("/usr/src/app/plugins.json", async function (err, data) {
  if (err) throw err;

  var json = JSON.parse(data).plugins;

  json.forEach((plugin) => {
    console.log(`Preparing plugin ${plugin.name}`);
    child_process.exec(
      `cd /usr/src/app/plugins/${plugin.name} && build ${plugin.name} && up ${plugin.name} && cd ../..`,
      (err) => {
        if (err) throw err;
        console.log(`Plugin ${plugin.name} running on port ${plugin.port}`);
        child_process.exec(`cd /usr/src/app && start_nginx`, () => {});
      }
    );
  });
});
