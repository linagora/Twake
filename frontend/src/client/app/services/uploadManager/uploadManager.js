import Observable from 'services/observable.js';
import Api from 'services/api.js';
import Number from 'services/utils/Numbers.js';

import $ from 'jquery';

import Globals from 'services/Globals.js';

class UploadManager extends Observable {
  constructor() {
    super();
    this.observableName = 'uploadService';

    this.globalStatus = 0;
    this.uploads = [];
    this.sessionUploaded = 0;
    this.uploaded_entities = [];
    this.uploading = 0;

    Globals.window.uploads = this;
  }

  updateData() {
    var totalSize = 0;
    var totalUp = 0;
    for (var i = 0; i < this.uploads.length; i++) {
      totalSize += this.uploads[i].size;
      totalUp += this.uploads[i].uploaded;
      this.uploads[i].status = (100 * this.uploads[i].uploaded) / (this.uploads[i].size + 1);
    }

    if (this.sessionUploaded + this.uploads.length == 0) {
      this.globalStatus = 0;
    } else if (totalSize == 0) {
      this.globalStatus =
        (100 * this.sessionUploaded) / (this.sessionUploaded + this.uploads.length);
    } else {
      this.globalStatus =
        (100 * (totalUp / totalSize + this.sessionUploaded)) /
        (this.sessionUploaded + this.uploads.length);
    }

    if (this.uploads.length == 0) {
      this.globalStatus = 0;
      this.sessionUploaded = 0;

      if (this.callback) {
        var uploaded = [];
        for (var i = 0; i < this.uploaded_entities.length; i++) {
          uploaded.push(this.uploaded_entities[i]);
        }

        this.callback(uploaded);
        this.uploaded_entities = [];
      }
    }

    this.notify();
  }

  getFilesTree(event, fcb) {
    function newDirectoryApi(input, cb) {
      var fd = [],
        files = [];
      var iterate = function(entries, path, resolve) {
        var promises = [];
        entries.forEach(function(entry) {
          promises.push(
            new Promise(function(resolve) {
              if ('getFilesAndDirectories' in entry) {
                entry.getFilesAndDirectories().then(function(entries) {
                  iterate(entries, entry.path + '/', resolve);
                });
              } else {
                if (entry.name) {
                  var p = (path + entry.name).replace(/^[/\\]/, '');
                  fd.push(entry);
                  files.push(p);
                }
                resolve();
              }
            }),
          );
        });
        Promise.all(promises).then(resolve);
      };
      input.getFilesAndDirectories().then(function(entries) {
        new Promise(function(resolve) {
          iterate(entries, '/', resolve);
        }).then(cb.bind(null, fd, files));
      });
    }

    // old prefixed API implemented in Chrome 11+ as well as array fallback
    function arrayApi(input, cb) {
      var fd = [],
        files = [];
      [].slice.call(input.files).forEach(function(file) {
        fd.push(file);
        files.push(file.webkitRelativePath || file.name);
      });
      cb(fd, files);
    }

    // old drag and drop API implemented in Chrome 11+
    function entriesApi(items, cb) {
      var fd = [],
        files = [],
        rootPromises = [];

      function readEntries(entry, reader, oldEntries, cb) {
        var dirReader = reader || entry.createReader();
        dirReader.readEntries(function(entries) {
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
        readEntries(entry, 0, 0, function(entries) {
          var promises = [];
          entries.forEach(function(entry) {
            promises.push(
              new Promise(function(resolve) {
                if (entry.isFile) {
                  entry.file(function(file) {
                    var p = path + '/' + file.name;
                    fd.push(file);
                    files.push(p);
                    resolve();
                  }, resolve.bind());
                } else readDirectory(entry, path + '/' + entry.name, resolve);
              }),
            );
          });
          Promise.all(promises).then(resolve.bind());
        });
      }

      [].slice.call(items).forEach(function(entry) {
        entry = entry.webkitGetAsEntry();
        if (entry) {
          rootPromises.push(
            new Promise(function(resolve) {
              if (entry.isFile) {
                entry.file(function(file) {
                  fd.push(file);
                  files.push(file.name);
                  resolve();
                }, resolve.bind());
              } else if (entry.isDirectory) {
                readDirectory(entry, null, resolve);
              }
            }),
          );
        }
      });
      Promise.all(rootPromises).then(cb.bind(null, fd, files));
    }

    var cb = function(event, files, paths) {
      var tree = {};
      paths.forEach(function(path, file_index) {
        var dirs = tree;
        var real_file = files[file_index];
        path.split('/').forEach(function(dir, dir_index) {
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

      fcb(tree);
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
      fcb(event);
    }
  }
  /*
  upload(files, destination, workspace_id, detached, callback, newVersion) {
    this.callback = callback;

    for (var i = 0; i < files.length; i++) {
      var id = Number.unid();
      var data = {
        name: files[i].name,
        size: files[i].size,
        uploaded: 0,
        isDetached: detached,
        id: id
      };
      this.uploads.push(data);
      var data = {
        destination: destination,
        workspace_id: workspace_id,
        detached: detached,
        new_version : newVersion
      };
      this.waitForUpload(files[i], data, id);
    }

    this.updateData();
  }

  waitForUpload(file, complementary_data, id){
    if(this.uploading < 0){
      this.uploading = 0;
    }

    if(this.uploading < 5){
      this.startUpload(file, complementary_data, id);
    }else{
      setTimeout(()=>{
        this.waitForUpload(file, complementary_data, id);
      }, 500+Math.random()*2000);
    }
  }

  startUpload(file, complementary_data, id) {
    this.uploading++;
    var fileId = id;
    var that = this;
    var data = new FormData();
    data.append("file", file);
    data.append("parentId", complementary_data.destination);
    data.append("groupId", complementary_data.workspace_id);
    data.append("isDetached", complementary_data.detached);
    data.append("newVersion", complementary_data.new_version);
    $.ajax({
      url: Globals.window.API_ROOT_URL + "/ajax/" + "drive / upload",
      type: "POST",
      data: data,
      cache: false,
      contentType: false,
      processData: false,
      xhrFields: {
        withCredentials: true
      },
      xhr: function() {
        var myXhr = $.ajaxSettings.xhr();
        if (myXhr.upload) {
          myXhr.addEventListener(
            "load",
            function(e) {
              for (var i = 0; i < that.uploads.length; i++) {
                if (that.uploads[i].id == fileId) {
                  that.uploads.splice(i, 1);
                  that.sessionUploaded++;
                  that.uploading+=-1;
                }
              }
              var resp = JSON.parse(myXhr.responseText);
              that.uploaded_entities.push(resp);
              that.updateData();
            },
            false
          );
          myXhr.upload.addEventListener(
            "progress",
            function(e) {
              if (e.lengthComputable) {
                for (var i = 0; i < that.uploads.length; i++) {
                  if (that.uploads[i].id == fileId) {
                    that.uploads[i].uploaded = e.loaded;
                    that.uploads[i].size = e.total;
                  }
                }
                that.updateData();
              }
            },
            false
          );

          myXhr.upload.addEventListener(
            "error",
            function(e) {
              for (var i = 0; i < that.uploads.length; i++) {
                if (that.uploads[i].id == fileId) {
                  that.uploads.splice(i, 1);
                  that.sessionUploaded++;
                  that.uploading+=-1;
                }
              }
              that.updateData();
            },
            false
          );

          myXhr.upload.addEventListener(
            "abort",
            function(e) {
              for (var i = 0; i < that.uploads.length; i++) {
                if (that.uploads[i].id == fileId) {
                  that.uploads.splice(i, 1);
                  that.sessionUploaded++;
                  that.uploading+=-1;
                }
              }
              that.updateData();
            },
            false
          );
        }
        return myXhr;
      }
    });
  }*/
}

const upload = new UploadManager();
export default upload;
