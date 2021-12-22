/**
 * This file replace version in code
 */

const versions = {
  VERSION_NAME: process.env.TWAKE_VERSION_NAME || "Albatros",
  VERSION: process.env.TWAKE_VERSION || "2021.Q4",
  VERSION_DETAIL: process.env.TWAKE_VERSION_DETAIL || "2021.Q4.860",
  MIN_VERSION_WEB: process.env.TWAKE_MIN_VERSION_WEB || "2021.Q4.860",
  MIN_VERSION_MOBILE: process.env.TWAKE_MIN_VERSION_MOBILE || "2021.Q4.860",
};

const files = [
  "frontend/src/app/environment/version.ts",
  "backend/core/src/Twake/Core/Controller/Version.php",
  "backend/node/src/version.ts",
  "../.github/workflows/saas-update-backend.yml",
  "../.github/workflows/saas-update-front.yml",
];

var fs = require("fs");

files.forEach((file) => {
  fs.readFile(file, "utf8", function (err, data) {
    if (err) {
      return console.log(err);
    }

    var result = data;

    Object.keys(versions).forEach((k) => {
      const replacement = versions[k];
      result = result.replace(
        new RegExp("( @" + k + " .*')[a-zA-Z0-9.]*(')", "g"),
        "$1" + replacement + "$2"
      );
      result = result.replace(
        new RegExp("( @" + k + ' .*")[a-zA-Z0-9.]*(")', "g"),
        "$1" + replacement + "$2"
      );
    });

    result = result.replace(
      new RegExp('(DOCKERTAGVERSION=)[a-zA-Z0-9.]*(")', "g"),
      "$1" + versions.VERSION_DETAIL + "$2"
    );

    fs.writeFile(file, result, "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
});
