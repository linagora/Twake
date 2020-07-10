var exec = require('child_process').exec;
const fs = require('fs');

var args = process.argv.slice(2);
const oldVersionDetails = args[0];
const newVersionDetails = args[1];
const newVersion = args[2];

<<<<<<< HEAD
const relativeEnvironment = './src/app/environment/environment.ts';
const relativeEnvironmentDist = './src/app/environment/environment.ts.dist';
const relativeEnvironmentDistDev = './src/app/environment/environment.ts.dist.dev';
=======
const relativeEnvironment = './src/app/environment/environment.js';
const relativeEnvironmentDist = './src/app/environment/environment.js.dist';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
const relativeIndex = './public/index.html';

exec('cat ' + relativeEnvironment, (err, stdout, stderr) => {
  stdout = stdout.replace("'" + oldVersionDetails + "'", "'" + newVersionDetails + "'");
  stdout = stdout.replace("'" + oldVersionDetails.substr(0, 3) + "'", "'" + newVersion + "'");
  fs.writeFileSync(relativeEnvironment, stdout);
});

exec('cat ' + relativeEnvironmentDist, (err, stdout, stderr) => {
  stdout = stdout.replace("'" + oldVersionDetails + "'", "'" + newVersionDetails + "'");
  stdout = stdout.replace("'" + oldVersionDetails.substr(0, 3) + "'", "'" + newVersion + "'");
  fs.writeFileSync(relativeEnvironmentDist, stdout);
});

<<<<<<< HEAD
exec('cat ' + relativeEnvironmentDistDev, (err, stdout, stderr) => {
  stdout = stdout.replace("'" + oldVersionDetails + "'", "'" + newVersionDetails + "'");
  stdout = stdout.replace("'" + oldVersionDetails.substr(0, 3) + "'", "'" + newVersion + "'");
  fs.writeFileSync(relativeEnvironmentDistDev, stdout);
});

=======
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
exec('cat ' + relativeIndex, (err, stdout, stderr) => {
  stdout = stdout.replace(oldVersionDetails, newVersionDetails);
  fs.writeFileSync(relativeIndex, stdout);
});
