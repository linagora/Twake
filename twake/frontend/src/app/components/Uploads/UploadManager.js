import React, { Component } from 'react';

import Observable from 'services/observable.js';
import Number from 'services/utils/Numbers.js';
import DriveService from 'services/Apps/Drive/Drive.js';
import Collections from 'services/Collections/Collections.js';
import Resumable from 'services/uploadManager/resumable.js';
import Globals from 'services/Globals.js';
import Api from 'services/api.js';

class UploadManager extends Observable {
  constructor() {
    super();
    this.setObservableName('upload_manager');
    this.reinit();

    window.uploadManager = this;
  }

  reinit() {
    if (this.reinitTimeout) clearTimeout(this.reinitTimeout);
    if (this.reinitTimeoutBefore) clearTimeout(this.reinitTimeoutBefore);
    this.currentUploadTotalSize = 0;
    this.currentUploadTotalNumber = 0;
    this.currentUploadedTotalSize = 0;
    this.currentUploadedFilesNumber = 0;
    this.currentUploadingFilesNumber = 0;
    this.currentCancelledFilesNumber = 0;
    this.currentWaitingFilesNumber = 0;
    this.currentErrorFilesNumber = 0;
    this.currentUploadFiles = [];
    this.currentUploadStartTime = new Date();
    this.will_close = false;
    this.notify();
  }

  reinitAfterDelay() {
    if (this.reinitTimeout) clearTimeout(this.reinitTimeout);
    if (this.reinitTimeoutBefore) clearTimeout(this.reinitTimeoutBefore);
    this.reinitTimeoutBefore = setTimeout(() => {
      this.will_close = true;
      this.notify();
      this.reinitTimeout = setTimeout(() => {
        this.reinit();
      }, 500);
    }, 800);
  }

  startUpload(
    elements,
    total_number,
    total_size,
    drive_parent,
    upload_options,
    driveCollectionKey,
    callback,
  ) {
    if (this.addElementsRecursive(elements, '')) {
      this.uploadRecursive(elements, drive_parent, upload_options, driveCollectionKey, callback);
    } else {
      this.currentUploadFiles = [];
      this.currentUploadTotalNumber = 0;
      this.currentUploadTotalSize = 0;
      this.currentWaitingFilesNumber = 0;
      this.currentUploadStartTime = new Date();
      this.reinit();
    }
  }

  addElementsRecursive(elements, path) {
    return Object.keys(elements).every(name => {
      var element = elements[name];
      if (element.size) {
        //File
        this.currentUploadTotalSize += element.size;
        this.currentUploadTotalNumber++;
        this.currentUploadFiles.push({
          unid: Number.unid(),
          progress: 0,
          cancelled: false,
          error: false,
          name: name,
          path: path,
          xhr: null,
          file: element,
        });
      } else {
        //Directory
        if (!this.addElementsRecursive(element, path + '/' + name)) {
          return false;
        }
      }
      return true;
    });
  }

  uploadRecursive(elements, drive_parent, upload_options, driveCollectionKey, callback) {
    Object.keys(elements).forEach(name => {
      var element = elements[name];
      if (element.size) {
        //File
        this.uploadFile(element, drive_parent, upload_options, driveCollectionKey, callback);
      } else {
        //Directory
        this.createDirectory(name, drive_parent, upload_options, driveCollectionKey, directory => {
          if (callback) callback(directory);
          if (directory) {
            this.uploadRecursive(element, directory, upload_options, driveCollectionKey);
          }
        });
      }
    });
  }

  createDirectory(name, parent, upload_options, driveCollectionKey, callback) {
    if (this.currentUploadingFilesNumber > 4) {
      setTimeout(() => {
        this.createDirectory(name, parent, upload_options, driveCollectionKey, callback);
      }, 500);
      return;
    }

    this.currentUploadingFilesNumber++;

    DriveService.createDirectory(
      upload_options.workspace_id,
      name,
      parent,
      driveCollectionKey,
      dir => {
        this.currentUploadingFilesNumber--;
        if (callback) callback(dir);
      },
    );
  }

  abort(elements) {
    var that = this;

    if (elements.length == undefined) {
      elements = [elements];
    }

    elements.forEach(element => {
      if (element.resumable) element.resumable.cancel();
      element.xhr_cancelled = true;
      element.cancelled = true;
      that.currentCancelledFilesNumber++;
      that.currentUploadingFilesNumber--;

      if (
        that.currentUploadedFilesNumber +
          that.currentCancelledFilesNumber +
          that.currentErrorFilesNumber >=
        that.currentUploadTotalNumber
      ) {
        that.reinitAfterDelay();
      }
    });

    that.notify();
  }

  getFilesTree(event, fcb) {
    function newDirectoryApi(input, cb) {
      var fd = [],
        files = [];
      var iterate = function (entries, path, resolve) {
        var promises = [];
        entries.forEach(function (entry) {
          promises.push(
            new Promise(function (resolve) {
              if ('getFilesAndDirectories' in entry) {
                entry.getFilesAndDirectories().then(function (entries) {
                  iterate(entries, entry.path + '/', resolve);
                });
              } else {
                if (entry.name) {
                  var p = (path + entry.name).replace(/^[/\\]/, '');
                  fd.push(entry);
                  files.push(p);

                  if (files.length > 1000000) {
                    return false;
                  }
                }
                resolve();
              }
            }),
          );
        });

        if (files.length > 1000000) {
          return false;
        }

        Promise.all(promises).then(resolve);
      };
      input.getFilesAndDirectories().then(function (entries) {
        new Promise(function (resolve) {
          iterate(entries, '/', resolve);
        }).then(cb.bind(null, fd, files));
      });
    }

    // old prefixed API implemented in Chrome 11+ as well as array fallback
    function arrayApi(input, cb) {
      var fd = [],
        files = [];
      [].slice.call(input.files).forEach(function (file) {
        fd.push(file);
        files.push(file.webkitRelativePath || file.name);

        if (files.length > 1000000) {
          return false;
        }
      });

      if (files.length > 1000000) {
        return false;
      }

      cb(fd, files);
    }

    // old drag and drop API implemented in Chrome 11+
    function entriesApi(items, cb) {
      var fd = [],
        files = [],
        rootPromises = [];

      function readEntries(entry, reader, oldEntries, cb) {
        var dirReader = reader || entry.createReader();
        dirReader.readEntries(function (entries) {
          var newEntries = oldEntries ? oldEntries.concat(entries) : entries;
          if (entries.length) {
            setTimeout(readEntries.bind(null, entry, dirReader, newEntries, cb), 0);
          } else {
            cb(newEntries);
          }
        });
      }

      function readDirectory(entry, path, resolve) {
        if (!path) path = entry.name;
        readEntries(entry, 0, 0, function (entries) {
          var promises = [];
          entries.forEach(function (entry) {
            promises.push(
              new Promise(function (resolve) {
                if (entry.isFile) {
                  entry.file(function (file) {
                    var p = path + '/' + file.name;
                    fd.push(file);
                    files.push(p);
                    if (files.length > 1000000) {
                      return false;
                    }
                    resolve();
                  }, resolve.bind());
                } else readDirectory(entry, path + '/' + entry.name, resolve);
              }),
            );
          });
          Promise.all(promises).then(resolve.bind());
        });
      }

      [].slice.call(items).forEach(function (entry) {
        entry = entry.webkitGetAsEntry();
        if (entry) {
          rootPromises.push(
            new Promise(function (resolve) {
              if (entry.isFile) {
                entry.file(function (file) {
                  fd.push(file);
                  files.push(file.name);
                  if (files.length > 1000000) {
                    return false;
                  }
                  resolve();
                }, resolve.bind());
              } else if (entry.isDirectory) {
                readDirectory(entry, null, resolve);
              }
            }),
          );
        }
      });

      if (files.length > 1000000) {
        return false;
      }

      Promise.all(rootPromises).then(cb.bind(null, fd, files));
    }

    var cb = function (event, files, paths) {
      var documents_number = paths ? paths.length : 0;
      var total_size = 0;
      var tree = {};
      (paths || []).forEach(function (path, file_index) {
        var dirs = tree;
        var real_file = files[file_index];

        total_size += real_file.size;

        path.split('/').forEach(function (dir, dir_index) {
          if (dir.indexOf('.') == 0) {
            return;
          }
          if (dir_index == path.split('/').length - 1) {
            dirs[dir] = real_file;
          } else {
            if (!dirs[dir]) {
              dirs[dir] = {};
            }
            dirs = dirs[dir];
          }
        });
      });

      fcb(tree, documents_number, total_size);
    };

    if (event.dataTransfer) {
      var dt = event.dataTransfer;
      if (dt.items && dt.items.length && 'webkitGetAsEntry' in dt.items[0]) {
        entriesApi(dt.items, cb.bind(null, event));
      } else if ('getFilesAndDirectories' in dt) {
        newDirectoryApi(dt, cb.bind(null, event));
      } else if (dt.files) {
        arrayApi(dt, cb.bind(null, event));
      } else cb();
    } else if (event.target) {
      var t = event.target;
      if (t.files && t.files.length) {
        arrayApi(t, cb.bind(null, event));
      } else if ('getFilesAndDirectories' in t) {
        newDirectoryApi(t, cb.bind(null, event));
      } else {
        cb(event);
      }
    } else {
      fcb(event, 1);
    }
  }

  uploadFile(element, drive_parent, upload_options, driveCollectionKey, callback, timeout_count) {
    console.log('try to upload', element);

    this.currentWaitingFilesNumber++;

    if (!timeout_count) {
      timeout_count = 0;
    }

    if (this.currentUploadingFilesNumber > 4) {
      setTimeout(() => {
        this.currentWaitingFilesNumber--;
        this.uploadFile(
          element,
          drive_parent,
          upload_options,
          driveCollectionKey,
          callback,
          timeout_count + 1,
        );
      }, Math.max(30000, 500 * (this.currentWaitingFilesNumber + 1) + Math.random() * 1000));
      return;
    }

    this.currentWaitingFilesNumber--;
    this.currentUploadingFilesNumber++;

    var listIndex = 0;
    var current_item = 0;
    this.currentUploadFiles.forEach((item, i) => {
      if (item.file == element) {
        listIndex = i;
        current_item = item;
      }
    });

    var that = this;

    if (current_item.xhr_cancelled == true) {
      return;
    }

    var extension = element.name.split('.');
    var r_data = {
      workspace_id: upload_options.workspace_id,
      name: element.name,
      extension: extension[extension.length - 1],
    };

    Globals.getAllCookies(cookies => {
      //Use Resumable.js for upload by chunk
      var r = new Resumable({
        target: Globals.window.api_root_url + '/ajax/' + 'driveupload/upload',
        chunkSize: 50000000,
        testChunks: false,
        simultaneousUploads: 5,
        withCredentials: true,
        maxChunkRetries: 2,
        headers: {
          'All-Cookies': JSON.stringify(cookies),
        },
        query: {
          object: JSON.stringify({
            id: upload_options.new_version ? upload_options.file_id : null,
            _once_new_version: upload_options.new_version,
            front_id: Number.unid(),
            is_directory: false,
            name: element.name,
            parent_id: drive_parent ? drive_parent.id : null,
            workspace_id: upload_options.workspace_id,
            detached: upload_options.detached,
          }),
        },
        generateUniqueIdentifier: (file, event) => {
          return 'no_id';
        },
      });

      current_item.resumable = r;

      current_item.timeout = setTimeout(() => {
        this.currentUploadingFilesNumber--;
      }, 60000);

      r.on('fileSuccess', function (file, message) {
        clearTimeout(current_item.timeout);

        that.currentUploadedFilesNumber++;
        that.currentUploadingFilesNumber--;
        current_item.progress = 1;

        if (
          that.currentUploadedFilesNumber +
            that.currentCancelledFilesNumber +
            that.currentErrorFilesNumber >=
          that.currentUploadTotalNumber
        ) {
          that.reinitAfterDelay();
        }

        var resp = JSON.parse(message);

        if (resp.data && resp.data.object) {
          Collections.get('drive').updateObject(resp.data.object);
          Collections.get('drive').share(resp.data.object);

          if (callback) callback(Collections.get('drive').find(resp.data.object.id));

          var parent = Collections.get('drive').find(resp.data.object.parent_id);
          if (parent) {
            parent.size = parseInt(parent.size) + parseInt(resp.data.object.size || 0);
            Collections.get('drive').updateObject(parent);
          }
        } else {
          current_item.error = 1;
        }

        that.notify();
      });
      r.on('progress', function (file, message) {
        current_item.progress = Math.min(r.progress(), 0.99);
        that.notify();

        clearTimeout(current_item.timeout);
        current_item.timeout = setTimeout(() => {
          this.currentUploadingFilesNumber--;
        }, 60000);
      });
      r.on('fileError', function (file, message) {
        clearTimeout(current_item.timeout);

        that.currentErrorFilesNumber++;
        that.currentUploadingFilesNumber--;
        current_item.error = true;

        if (
          that.currentUploadedFilesNumber +
            that.currentCancelledFilesNumber +
            that.currentErrorFilesNumber >=
          that.currentUploadTotalNumber
        ) {
          that.reinitAfterDelay();
        }

        that.notify();
      });

      r.addFile(element);

      Api.post(
        'driveupload/preprocess',
        {
          workspace_id: r_data.workspace_id,
          name: r_data.name,
          identifier: r_data.identifier,
          extension: r_data.extension,
        },
        res => {
          var identifier = res.identifier;
          var file = r.getFromUniqueIdentifier('no_id');
          file.uniqueIdentifier = identifier;
          r.upload();
        },
      );
    });
  }
}

const service = new UploadManager();
export default service;
