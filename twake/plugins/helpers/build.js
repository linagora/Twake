var fs = require("fs");
var child_process = require("child_process");

const plugin_name = process.argv[2];

fs.readFile("/usr/src/app/plugins.json", function (err, data) {
  if (err) throw err;

  var json = JSON.parse(data).plugins;

  json.forEach((plugin) => {
    if (plugin.name === plugin_name) {
      existing = true;
      child_process.exec(
        `cd /usr/src/app/plugins/${plugin_name} && docker build -t ${plugin_name} . && cd ../..`,
        (err) => {
          if (err) throw err;
        }
      );
    }
  });
});
