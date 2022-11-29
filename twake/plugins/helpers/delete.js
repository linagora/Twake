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
        `cd /usr/src/app/plugins/ &&  rm -fr ${plugin_name} && docker stop ${plugin_name} && docker system prune -f -a --volumes `,
        (err) => {
          const new_json = json.filter((plugin) => plugin.name !== plugin_name);
          fs.writeFile(
            "/usr/src/app/plugins.json",
            JSON.stringify({ plugins: new_json }),
            (err) => {
              if (err) throw err;
              child_process.exec(`start_nginx`, () => {
                console.log(`nginx restarted`);
              });
              console.log(`${plugin_name.toUpperCase()} deleted`);
            }
          );
        }
      );
    }
  });
  if (!existing) {
    console.log(`${plugin_name.toUpperCase()} is not yet installed`);
  }
});
