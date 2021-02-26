const { exec } = require("child_process");

const phpScriptPath = "migration/decrypt.php";
export default (encryptedStrings: string[], key: string, defaultIv: any) => {
  return new Promise((resolve, reject) => {
    exec(
      `php ${phpScriptPath} '${JSON.stringify(
        encryptedStrings
      )}' '${JSON.stringify(key)}' '${JSON.stringify(defaultIv)}'`,
      (err: any, res: string) => {
        if (err) reject(err);
        resolve(JSON.parse(res));
      }
    );
  });
};
