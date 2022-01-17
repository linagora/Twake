const fs = require('fs');
const _ = require('lodash');

const appUrl = '../src/app';
const componentsUrl = `${appUrl}/components`;
const modelsUrl = `${appUrl}/models`;
const scenesUrl = `${appUrl}/scenes`;
const servicesUrl = `${appUrl}/services`;

const isUpperCase = str => !/[a-z]/.test(str) && /[A-Z]/.test(str);

const processFilter = (fileOrFolderPath, rootUrl) => {
  const oldNameArr = fileOrFolderPath.split('');
  const isFile = /\.[0-9a-z]+$/i.test(fileOrFolderPath);
  let extension = undefined;

  oldNameArr.forEach((letter, index) => {
    if (index === 0 && isUpperCase(letter)) {
      oldNameArr[index] = letter.toLowerCase();
    }

    if (fileOrFolderPath.match(/\.[0-9a-z]+$/i)) {
      extension = fileOrFolderPath.match(/\.[0-9a-z]+$/i)[0];
    }

    if (index !== 0 && isUpperCase(letter)) {
      const separator = '-';

      oldNameArr[index] = letter.toLowerCase();
      oldNameArr.splice(index, 0, separator);
    }
  });

  const newName = oldNameArr.join('');

  try {
    if (!isFile) {
      fs.renameSync(`${rootUrl}/${fileOrFolderPath}`, `${rootUrl}/${newName}`);

      console.log(`Updated ${rootUrl}/${fileOrFolderPath} to ${rootUrl}/${newName}`);
    }
  } catch (err) {
    console.log(err);
  }
};

// Components Process
fs.readdir(componentsUrl, (err, files) => {
  if (err) {
    throw new Error(err);
  }

  files.forEach(fileOrFolderPath => processFilter(fileOrFolderPath, componentsUrl));
});

// Models Process
// fs.readdir(modelsUrl, (err, files) => {
//   if (err) {
//     throw new Error(err);
//   }

//   files.forEach(fileOrFolderPath => processFilter(fileOrFolderPath, modelsUrl));
// });

// Services Process
// fs.readdir(servicesUrl, (err, files) => {
//   if (err) {
//     throw new Error(err);
//   }

//   files.forEach(fileOrFolderPath => processFilter(fileOrFolderPath, servicesUrl));
// });

// Scenes Process
// fs.readdir(scenesUrl, (err, files) => {
//   if (err) {
//     throw new Error(err);
//   }

//   files.forEach(fileOrFolderPath => processFilter(fileOrFolderPath, scenesUrl));
// });
