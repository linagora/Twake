var fs = require("fs");
fs.readFile("/usr/src/app/plugins.json", function (err, data) {
  if (err) throw err;

  var json = JSON.parse(data).plugins;
  var counter = 1;

  if (json.length === 0) {
    console.log("No plugins saved");
  }

  json.forEach((plugin) => {
    console.log(
      `${counter} - ${plugin.name} from ${plugin.repository} on local port ${plugin.port}`
    );
    counter++;
  });
});
