const fs = require('fs');
const Path = require('path');
const _ = require('lodash');

const appUrl = '../src/app';
const componentsUrl = `${appUrl}/components`;
const modelsUrl = `${appUrl}/models`;
const scenesUrl = `${appUrl}/scenes`;
const servicesUrl = `${appUrl}/services`;

const routes = new Map();

const isDirectory = path => fs.lstatSync(path).isDirectory();

// pwd must start with 'src/...'
const getAbsolutePath = (path, pwd = appUrl) => {
  if (path[0] === '.') {
    console.log({ pwd, path, resolve: Path.resolve(pwd + '/' + path) });
    return Path.resolve(pwd + '/' + path);
  }

  path = path.replace(/^app\//, appUrl + '/');
  path = path.replace(/^environment\//, appUrl + '/environment/');
  path = path.replace(/^common\//, appUrl + '/common/');
  path = path.replace(/^components\//, appUrl + '/components/');
  path = path.replace(/^services\//, appUrl + '/services/');
  path = path.replace(/^scenes\//, appUrl + '/scenes/');
  path = path.replace(/^apps\//, appUrl + '/apps/');
  return Path.resolve(path);
};

const renameItem = item => {
  const oldNameArr = item.split('');

  oldNameArr.forEach((letter, index) => {
    if (index === 0 && isUpperCase(letter)) {
      oldNameArr[index] = letter.toLowerCase();
    }

    if (index !== 0 && isUpperCase(letter)) {
      const separator = '-';

      // TODO FIX rename
      if (['UI', 'APIClient', 'README'].includes(item) === false) {
        oldNameArr[index] = letter.toLowerCase();
        oldNameArr.splice(index, 0, separator);
      }
    }
  });

  return oldNameArr.join('');
};

const isUpperCase = str => !/[a-z]/.test(str) && /[A-Z]/.test(str);

const updateMap = (rootUrl, fileOrFolderPath = false) => {
  let newFileOrFolderPath = rootUrl;
  if (fileOrFolderPath) {
    const oldFileOrFolderPath = `${rootUrl}/${fileOrFolderPath}`;
    newFileOrFolderPath = `${rootUrl}/${fileOrFolderPath}`;
    routes.set(getAbsolutePath(oldFileOrFolderPath, '.'), true);
  }

  if (isDirectory(newFileOrFolderPath)) {
    const files = fs.readdirSync(newFileOrFolderPath);
    files.forEach(fileOrFolderPath => {
      updateMap(newFileOrFolderPath, fileOrFolderPath);
    });
  }
};

const processRename = (rootUrl, fileOrFolderPath = false) => {
  let newFileOrFolderPath = rootUrl;

  if (fileOrFolderPath) {
    const newFileOrFolderName = renameItem(fileOrFolderPath);
    const oldFileOrFolderPath = `${rootUrl}/${fileOrFolderPath}`;
    newFileOrFolderPath = `${rootUrl}/${newFileOrFolderName}`;

    fs.renameSync(oldFileOrFolderPath, newFileOrFolderPath);
    //fs.rmdir(componentsUrl);
  }

  if (isDirectory(newFileOrFolderPath)) {
    const files = fs.readdirSync(newFileOrFolderPath);
    files.forEach(fileOrFolderPath => {
      processRename(newFileOrFolderPath, fileOrFolderPath);
    });
  }
};

const recursiveWatchingImports = (rootPath, fileOrFolderPath = false) => {
  const nextPath = fileOrFolderPath ? `${rootPath}/${fileOrFolderPath}` : rootPath;
  if (!isDirectory(nextPath)) {
    let content = fs.readFileSync(nextPath, { encoding: 'utf-8' });

    if (nextPath.includes('/environment/')) {
      return;
    }

    const importedPaths = Array.from(content.matchAll(/^import .*? ('|")(.*?)('|").*?$/gm)).map(
      s => s[2],
    );

    importedPaths.forEach(path => {
      const absolutePath = getAbsolutePath(path, rootPath);

      //Test if absolutePath is in map
      if (
        routes.has(absolutePath) ||
        routes.has(absolutePath + '.js') ||
        routes.has(absolutePath + '.ts') ||
        routes.has(absolutePath + '.tsx') ||
        routes.has(absolutePath + '.jsx')
      ) {
        //console.log('recursiveWatchingImports', { routes, absolutePath });
        const newPath = path.split('/').map(renameItem).join('/');
        //TODO: update import
        content = content.replace(path, newPath);
      }
    });

    //console.log({ nextPath });
    fs.writeFileSync(nextPath, content);

    // const keys = [...routes.keys()];

    // keys.forEach(k => {
    //   const value = routes.get(k);

    //   const reg1 = new RegExp("import s*([^}]+) from 's*([^}]+)" + `/${value.split('.tsx')[0]}`);
    //   const reg2 = new RegExp("import {s*([^}]+)} from 's*([^}]+)" + `/${value.split('.tsx')[0]}`);
    //   const reg3 = new RegExp("import 's*([^}]+)" + `/${value}`);

    //   /**
    //    * import { Azazaeza } from 'blahh'
    //    * import Azazaeza from 'blahh'
    //    * import "blah.scss"
    //    */

    //   console.log('/////////////////////////////////');
    //   console.log('current file =>', nextPath);
    //   console.log(reg1, ' => ', reg1.test(content));
    //   console.log(reg2, ' => ', reg2.test(content));
    //   console.log(reg3, ' => ', reg3.test(content));
    // });
  } else {
    const files = fs.readdirSync(nextPath);
    files.forEach(fileOrFolderPath => {
      recursiveWatchingImports(nextPath, fileOrFolderPath);
    });
  }
};

const cleanFiles = async () => {
  //Fill up map with all the files we gonna rename
  updateMap(componentsUrl);

  //Rename files and folders recursivelly
  processRename(componentsUrl);

  // Now we should look at each files to see if there is a match with the previous changes and modify the related imports
  recursiveWatchingImports(appUrl);

  //console.log('filesOrFoldersInComponents', filesOrFoldersInComponents);
  //console.log('filesOrFoldersInApp', filesOrFoldersInApp);
};

cleanFiles();
