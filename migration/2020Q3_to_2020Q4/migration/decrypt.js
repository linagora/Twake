"use strict";

const { exec } = require("child_process");

const phpScriptPath = "migration/decrypt.php";
module.exports = (encryptedStrings, key, defaultIv) => {
  return new Promise((resolve, reject) => {
    exec(
      `php ${phpScriptPath} '${JSON.stringify(
        encryptedStrings
      )}' '${JSON.stringify(key)}' '${JSON.stringify(defaultIv)}'`,
      (err, res) => {
        if (err) reject(err);
        resolve(JSON.parse(res));
      }
    );
  });
};
