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
        `cd /usr/src/app/plugins/${plugin_name} && docker run --name ${plugin_name} --network=dind-net --restart unless-stopped -dp ${plugin.port}:${plugin.port} -e SERVER_PORT=${plugin.port} -e SERVER_PREFIX='/plugins/${plugin_name}' -e CREDENTIALS_ENDPOINT='http://172.64.0.1:8080' -e CREDENTIALS_SECRET=${plugin.secret} -e CREDENTIALS_ID=${plugin.id} -e SERVER_ORIGIN='http://localhost:8080' ${plugin.venv} ${plugin_name}  && cd ../..`,
        (err) => {
          if (err) throw err;
        }
      );
    }
  });
});
