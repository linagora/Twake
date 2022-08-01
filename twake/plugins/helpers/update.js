var fs = require("fs");
var child_process = require("child_process");

const plugin_name = process.argv[2];

fs.readFile("/usr/src/app/plugins.json", function (err, data) {
  if (err) throw err;

  var json = JSON.parse(data).plugins;
  var existing = false;

  json.forEach((plugin) => {
    if (plugin.name === plugin_name) {
      existing = true;
      child_process.exec(
        `delete ${plugin_name} && add https://github.com/linagora/Twake-plugins-${plugin_name} ${plugin.id} ${plugin.secret} ${plugin.venv}`,
        (err) => {
          if (err) throw err;

          console.log(
            `${plugin_name.toUpperCase()} is now updated, built, running and reachable from host on http://localhost:8080/plugins/${plugin_name}`
          );
        }
      );
    }
  });

  if (!existing) {
    console.log(`${plugin_name.toUpperCase()} is not yet installed`);
  }
});
