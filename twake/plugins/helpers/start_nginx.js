var fs = require("fs");
var child_process = require("child_process");

fs.readFile("/usr/src/app/plugins.json", function (err, data) {
  if (err) throw err;

  var json = JSON.parse(data).plugins;

  const conf = generate_config(json);

  fs.writeFile("/usr/src/app/nginx/nginx.conf", conf, (err) => {
    if (err) throw err;
    console.log("Plugins reverse proxy ready for building");
  });

  child_process.exec(
    `docker stop nginx_host && docker system prune -f -a --volumes`,
    (err) => {
      console.log(`Clean nginx container and rebuild`);
      child_process.exec(
        `cd nginx && docker build -t nginx_host . && docker run --name nginx_host --network=test-net --restart unless-stopped -dp 8080:80  nginx_host && cd ..`,
        (err) => {
          if (err) throw err;
          console.log(
            `Plugins container reverse proxy built and running on port 8080`
          );
        }
      );
    }
  );
});

const generate_config = (json) => {
  var conf = `
    events {}
    http {
        server {

        listen 80 default_server;
        listen [::]:80 default_server;

        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
        types_hash_max_size 2048;

        location / {
            # First attempt to serve request as file, then
            # as directory, then fall back to displaying a 404.
            try_files $uri $uri/ =408;
        }

        location /api {
            #proxy_set_header X-Forwarded-Host $host
            proxy_pass http://172.21.0.1:3000;
        }
 
    `;

  json.forEach((plugin) => {
    conf += `
            location /plugins/${plugin.name} {
                proxy_pass http://172.64.0.1:${plugin.port};
            }
        `;
  });
  conf += `}}`;
  return conf;
};
