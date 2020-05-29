// A small helper that will list all files using `glob` lib
// Usage: `node bin/glob-ls.js 'src/**/*.js'`
const glob = require("glob");
const patterns = process.argv.slice(2);
patterns.forEach(pattern => {
  glob(pattern, {}, function(err, files) {
    if (err) throw err;
    process.stdout.write(files.join("\n") + "\n");
  });
});
