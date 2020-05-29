var exec = require('child_process').exec;
const fs = require('fs');
exec("cat ./src/app/environment/environment.js | sed 's/export default //g'", (err, stdout, stderr) => {
  var env = JSON.parse(stdout);
  let str = "";
  for(key of Object.keys(env)){
    if(typeof env[key] === "string"){
      str += 'windows.'+key+' = "'+env[key]+'"\n';
    }else{
      str += 'windows.'+key+' = '+env[key]+"\n";
    }
  }
   fs.writeFileSync('./public/public/dist/env.js', str);
})
