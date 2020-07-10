const window = {};

window.setTimeout = (f, t) => setTimeout(f, t);

window.define ||
<<<<<<< HEAD
  ((window.define = function (c) {
=======
  ((window.define = function(c) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    try {
      delete window.define;
    } catch (g) {
      window.define = void 0;
    }
    window.when = c();
  }),
  (window.define.amd = {}));

const define = window.define;

/*
 * MIT Licensed
 * http://www.23developer.com/opensource
 * http://github.com/23/resumable.js
 * Steffen Tiedemann Christensen, steffen@23company.com
 */

<<<<<<< HEAD
(function () {
  'use strict';

  var Resumable = function (opts) {
=======
(function() {
  'use strict';

  var Resumable = function(opts) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    if (!(this instanceof Resumable)) {
      return new Resumable(opts);
    }
    this.version = 1.0;
    // SUPPORTED BY BROWSER?
    // Check if these features are support by the browser:
    // - File object type
    // - Blob object type
    // - FileList object type
    // - slicing files
    this.support =
      typeof File !== 'undefined' &&
      typeof Blob !== 'undefined' &&
      typeof FileList !== 'undefined' &&
      (!!Blob.prototype.webkitSlice ||
        !!Blob.prototype.mozSlice ||
        !!Blob.prototype.slice ||
        false);
    if (!this.support) return false;

    // PROPERTIES
    var $ = this;
    $.files = [];
    $.defaults = {
      chunkSize: 1 * 1024 * 1024,
      forceChunkSize: false,
      simultaneousUploads: 3,
      fileParameterName: 'file',
      chunkNumberParameterName: 'resumableChunkNumber',
      chunkSizeParameterName: 'resumableChunkSize',
      currentChunkSizeParameterName: 'resumableCurrentChunkSize',
      totalSizeParameterName: 'resumableTotalSize',
      typeParameterName: 'resumableType',
      identifierParameterName: 'resumableIdentifier',
      fileNameParameterName: 'resumableFilename',
      relativePathParameterName: 'resumableRelativePath',
      totalChunksParameterName: 'resumableTotalChunks',
      throttleProgressCallbacks: 0.5,
      query: {},
      headers: {},
      preprocess: null,
      method: 'multipart',
      uploadMethod: 'POST',
      testMethod: 'GET',
      prioritizeFirstAndLastChunk: false,
      target: '/',
      testTarget: null,
      parameterNamespace: '',
      testChunks: true,
      generateUniqueIdentifier: null,
      getTarget: null,
      maxChunkRetries: 100,
      chunkRetryInterval: undefined,
      permanentErrors: [400, 404, 415, 500, 501],
      maxFiles: undefined,
      withCredentials: false,
      xhrTimeout: 0,
      clearInput: true,
      chunkFormat: 'blob',
      setChunkTypeFromFile: false,
<<<<<<< HEAD
      maxFilesErrorCallback: function (files, errorCount) {
=======
      maxFilesErrorCallback: function(files, errorCount) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        var maxFiles = $.getOpt('maxFiles');
        alert(
          'Please upload no more than ' +
            maxFiles +
            ' file' +
            (maxFiles === 1 ? '' : 's') +
            ' at a time.',
        );
      },
      minFileSize: 1,
<<<<<<< HEAD
      minFileSizeErrorCallback: function (file, errorCount) {
=======
      minFileSizeErrorCallback: function(file, errorCount) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        alert(
          file.fileName ||
            file.name +
              ' is too small, please upload files larger than ' +
              $h.formatSize($.getOpt('minFileSize')) +
              '.',
        );
      },
      maxFileSize: undefined,
<<<<<<< HEAD
      maxFileSizeErrorCallback: function (file, errorCount) {
=======
      maxFileSizeErrorCallback: function(file, errorCount) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        alert(
          file.fileName ||
            file.name +
              ' is too large, please upload files less than ' +
              $h.formatSize($.getOpt('maxFileSize')) +
              '.',
        );
      },
      fileType: [],
<<<<<<< HEAD
      fileTypeErrorCallback: function (file, errorCount) {
=======
      fileTypeErrorCallback: function(file, errorCount) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        alert(
          file.fileName ||
            file.name +
              ' has type not allowed, please upload files of type ' +
              $.getOpt('fileType') +
              '.',
        );
      },
    };
    $.opts = opts || {};
<<<<<<< HEAD
    $.getOpt = function (o) {
=======
    $.getOpt = function(o) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      var $opt = this;
      // Get multiple option if passed an array
      if (o instanceof Array) {
        var options = {};
<<<<<<< HEAD
        $h.each(o, function (option) {
=======
        $h.each(o, function(option) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          options[option] = $opt.getOpt(option);
        });
        return options;
      }
      // Otherwise, just return a simple option
      if ($opt instanceof ResumableChunk) {
        if (typeof $opt.opts[o] !== 'undefined') {
          return $opt.opts[o];
        } else {
          $opt = $opt.fileObj;
        }
      }
      if ($opt instanceof ResumableFile) {
        if (typeof $opt.opts[o] !== 'undefined') {
          return $opt.opts[o];
        } else {
          $opt = $opt.resumableObj;
        }
      }
      if ($opt instanceof Resumable) {
        if (typeof $opt.opts[o] !== 'undefined') {
          return $opt.opts[o];
        } else {
          return $opt.defaults[o];
        }
      }
    };

    // EVENTS
    // catchAll(event, ...)
    // fileSuccess(file), fileProgress(file), fileAdded(file, event), filesAdded(files, filesSkipped), fileRetry(file),
    // fileError(file, message), complete(), progress(), error(message, file), pause()
    $.events = [];
<<<<<<< HEAD
    $.on = function (event, callback) {
      $.events.push(event.toLowerCase(), callback);
    };
    $.fire = function () {
=======
    $.on = function(event, callback) {
      $.events.push(event.toLowerCase(), callback);
    };
    $.fire = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      // `arguments` is an object, not array, in FF, so:
      var args = [];
      for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
      // Find event listeners, and support pseudo-event `catchAll`
      var event = args[0].toLowerCase();
      for (var i = 0; i <= $.events.length; i += 2) {
        if ($.events[i] == event) $.events[i + 1].apply($, args.slice(1));
        if ($.events[i] == 'catchall') $.events[i + 1].apply(null, args);
      }
      if (event == 'fileerror') $.fire('error', args[2], args[1]);
      if (event == 'fileprogress') $.fire('progress');
    };

    // INTERNAL HELPER METHODS (handy, but ultimately not part of uploading)
    var $h = {
<<<<<<< HEAD
      stopEvent: function (e) {
        e.stopPropagation();
        e.preventDefault();
      },
      each: function (o, callback) {
=======
      stopEvent: function(e) {
        e.stopPropagation();
        e.preventDefault();
      },
      each: function(o, callback) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (typeof o.length !== 'undefined') {
          for (var i = 0; i < o.length; i++) {
            // Array or FileList
            if (callback(o[i]) === false) return;
          }
        } else {
          for (i in o) {
            // Object
            if (callback(i, o[i]) === false) return;
          }
        }
      },
<<<<<<< HEAD
      generateUniqueIdentifier: function (file, event) {
=======
      generateUniqueIdentifier: function(file, event) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        var custom = $.getOpt('generateUniqueIdentifier');
        if (typeof custom === 'function') {
          return custom(file, event);
        }
        var relativePath = file.webkitRelativePath || file.fileName || file.name; // Some confusion in different versions of Firefox
        var size = file.size;
        return size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/gim, '');
      },
<<<<<<< HEAD
      contains: function (array, test) {
        var result = false;

        $h.each(array, function (value) {
=======
      contains: function(array, test) {
        var result = false;

        $h.each(array, function(value) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          if (value == test) {
            result = true;
            return false;
          }
          return true;
        });

        return result;
      },
<<<<<<< HEAD
      formatSize: function (size) {
=======
      formatSize: function(size) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (size < 1024) {
          return size + ' bytes';
        } else if (size < 1024 * 1024) {
          return (size / 1024.0).toFixed(0) + ' KB';
        } else if (size < 1024 * 1024 * 1024) {
          return (size / 1024.0 / 1024.0).toFixed(1) + ' MB';
        } else {
          return (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + ' GB';
        }
      },
<<<<<<< HEAD
      getTarget: function (request, params) {
=======
      getTarget: function(request, params) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        var target = $.getOpt('target');

        if (request === 'test' && $.getOpt('testTarget')) {
          target = $.getOpt('testTarget') === '/' ? $.getOpt('target') : $.getOpt('testTarget');
        }

        if (typeof target === 'function') {
          return target(params);
        }

        var separator = target.indexOf('?') < 0 ? '?' : '&';
        var joinedParams = params.join('&');

        return target + separator + joinedParams;
      },
    };

<<<<<<< HEAD
    var onDrop = function (event) {
=======
    var onDrop = function(event) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      $h.stopEvent(event);

      //handle dropped things as items if we can (this lets us deal with folders nicer in some cases)
      if (event.dataTransfer && event.dataTransfer.items) {
        loadFiles(event.dataTransfer.items, event);
      }
      //else handle them as files
      else if (event.dataTransfer && event.dataTransfer.files) {
        loadFiles(event.dataTransfer.files, event);
      }
    };
<<<<<<< HEAD
    var preventDefault = function (e) {
=======
    var preventDefault = function(e) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      e.preventDefault();
    };

    /**
     * processes a single upload item (file or directory)
     * @param {Object} item item to upload, may be file or directory entry
     * @param {string} path current file path
     * @param {File[]} items list of files to append new items to
     * @param {Function} cb callback invoked when item is processed
     */
    function processItem(item, path, items, cb) {
      var entry;
      if (item.isFile) {
        // file provided
<<<<<<< HEAD
        return item.file(function (file) {
=======
        return item.file(function(file) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          file.relativePath = path + file.name;
          items.push(file);
          cb();
        });
      } else if (item.isDirectory) {
        // item is already a directory entry, just assign
        entry = item;
      } else if (item instanceof File) {
        items.push(item);
      }
      if ('function' === typeof item.webkitGetAsEntry) {
        // get entry from file object
        entry = item.webkitGetAsEntry();
      }
      if (entry && entry.isDirectory) {
        // directory provided, process it
        return processDirectory(entry, path + entry.name + '/', items, cb);
      }
      if ('function' === typeof item.getAsFile) {
        // item represents a File object, convert it
        item = item.getAsFile();
        if (item instanceof File) {
          item.relativePath = path + item.name;
          items.push(item);
        }
      }
      cb(); // indicate processing is done
    }

    /**
     * cps-style list iteration.
     * invokes all functions in list and waits for their callback to be
     * triggered.
     * @param  {Function[]}   items list of functions expecting callback parameter
     * @param  {Function} cb    callback to trigger after the last callback has been invoked
     */
    function processCallbacks(items, cb) {
      if (!items || items.length === 0) {
        // empty or no list, invoke callback
        return cb();
      }
      // invoke current function, pass the next part as continuation
<<<<<<< HEAD
      items[0](function () {
=======
      items[0](function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        processCallbacks(items.slice(1), cb);
      });
    }

    /**
     * recursively traverse directory and collect files to upload
     * @param  {Object}   directory directory to process
     * @param  {string}   path      current path
     * @param  {File[]}   items     target list of items
     * @param  {Function} cb        callback invoked after traversing directory
     */
    function processDirectory(directory, path, items, cb) {
      var dirReader = directory.createReader();
<<<<<<< HEAD
      dirReader.readEntries(function (entries) {
=======
      dirReader.readEntries(function(entries) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (!entries.length) {
          // empty directory, skip
          return cb();
        }
        // process all conversion callbacks, finally invoke own one
        processCallbacks(
<<<<<<< HEAD
          entries.map(function (entry) {
=======
          entries.map(function(entry) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            // bind all properties except for callback
            return processItem.bind(null, entry, path, items);
          }),
          cb,
        );
      });
    }

    /**
     * process items to extract files to be uploaded
     * @param  {File[]} items items to process
     * @param  {Event} event event that led to upload
     */
    function loadFiles(items, event) {
      if (!items.length) {
        return; // nothing to do
      }
      $.fire('beforeAdd');
      var files = [];
      processCallbacks(
<<<<<<< HEAD
        Array.prototype.map.call(items, function (item) {
          // bind all properties except for callback
          return processItem.bind(null, item, '', files);
        }),
        function () {
=======
        Array.prototype.map.call(items, function(item) {
          // bind all properties except for callback
          return processItem.bind(null, item, '', files);
        }),
        function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          if (files.length) {
            // at least one file found
            appendFilesFromFileList(files, event);
          }
        },
      );
    }

<<<<<<< HEAD
    var appendFilesFromFileList = function (fileList, event) {
=======
    var appendFilesFromFileList = function(fileList, event) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      // check for uploading too many files
      var errorCount = 0;
      var o = $.getOpt([
        'maxFiles',
        'minFileSize',
        'maxFileSize',
        'maxFilesErrorCallback',
        'minFileSizeErrorCallback',
        'maxFileSizeErrorCallback',
        'fileType',
        'fileTypeErrorCallback',
      ]);
      if (typeof o.maxFiles !== 'undefined' && o.maxFiles < fileList.length + $.files.length) {
        // if single-file upload, file is already added, and trying to add 1 new file, simply replace the already-added file
        if (o.maxFiles === 1 && $.files.length === 1 && fileList.length === 1) {
          $.removeFile($.files[0]);
        } else {
          o.maxFilesErrorCallback(fileList, errorCount++);
          return false;
        }
      }
      var files = [],
        filesSkipped = [],
        remaining = fileList.length;
<<<<<<< HEAD
      var decreaseReamining = function () {
=======
      var decreaseReamining = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (!--remaining) {
          // all files processed, trigger event
          if (!files.length && !filesSkipped.length) {
            // no succeeded files, just skip
            return;
          }
<<<<<<< HEAD
          window.setTimeout(function () {
=======
          window.setTimeout(function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            $.fire('filesAdded', files, filesSkipped);
          }, 0);
        }
      };
<<<<<<< HEAD
      $h.each(fileList, function (file) {
=======
      $h.each(fileList, function(file) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        var fileName = file.name;
        if (o.fileType.length > 0) {
          var fileTypeFound = false;
          for (var index in o.fileType) {
            var extension = '.' + o.fileType[index];
            if (
              fileName
                .toLowerCase()
                .indexOf(extension.toLowerCase(), fileName.length - extension.length) !== -1
            ) {
              fileTypeFound = true;
              break;
            }
          }
          if (!fileTypeFound) {
            o.fileTypeErrorCallback(file, errorCount++);
            return false;
          }
        }

        if (typeof o.minFileSize !== 'undefined' && file.size < o.minFileSize) {
          o.minFileSizeErrorCallback(file, errorCount++);
          return false;
        }
        if (typeof o.maxFileSize !== 'undefined' && file.size > o.maxFileSize) {
          o.maxFileSizeErrorCallback(file, errorCount++);
          return false;
        }

        function addFile(uniqueIdentifier) {
          if (!$.getFromUniqueIdentifier(uniqueIdentifier)) {
<<<<<<< HEAD
            (function () {
=======
            (function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              file.uniqueIdentifier = uniqueIdentifier;
              var f = new ResumableFile($, file, uniqueIdentifier);
              $.files.push(f);
              files.push(f);
              f.container = typeof event != 'undefined' ? event.srcElement : null;
<<<<<<< HEAD
              window.setTimeout(function () {
=======
              window.setTimeout(function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                $.fire('fileAdded', f, event);
              }, 0);
            })();
          } else {
            filesSkipped.push(file);
          }
          decreaseReamining();
        }
        // directories have size == 0
        var uniqueIdentifier = $h.generateUniqueIdentifier(file, event);
        if (uniqueIdentifier && typeof uniqueIdentifier.then === 'function') {
          // Promise or Promise-like object provided as unique identifier
          uniqueIdentifier.then(
<<<<<<< HEAD
            function (uniqueIdentifier) {
              // unique identifier generation succeeded
              addFile(uniqueIdentifier);
            },
            function () {
=======
            function(uniqueIdentifier) {
              // unique identifier generation succeeded
              addFile(uniqueIdentifier);
            },
            function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              // unique identifier generation failed
              // skip further processing, only decrease file count
              decreaseReamining();
            },
          );
        } else {
          // non-Promise provided as unique identifier, process synchronously
          addFile(uniqueIdentifier);
        }
      });
    };

    // INTERNAL OBJECT TYPES
    function ResumableFile(resumableObj, file, uniqueIdentifier) {
      var $ = this;
      $.opts = {};
      $.getOpt = resumableObj.getOpt;
      $._prevProgress = 0;
      $.resumableObj = resumableObj;
      $.file = file;
      $.fileName = file.fileName || file.name; // Some confusion in different versions of Firefox
      $.size = file.size;
      $.relativePath = file.relativePath || file.webkitRelativePath || $.fileName;
      $.uniqueIdentifier = uniqueIdentifier;
      $._pause = false;
      $.container = '';
      var _error = uniqueIdentifier !== undefined;

      // Callback when something happens within the chunk
<<<<<<< HEAD
      var chunkEvent = function (event, message) {
=======
      var chunkEvent = function(event, message) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        // event can be 'progress', 'success', 'error' or 'retry'
        switch (event) {
          case 'progress':
            $.resumableObj.fire('fileProgress', $, message);
            break;
          case 'error':
            $.abort();
            _error = true;
            $.chunks = [];
            $.resumableObj.fire('fileError', $, message);
            break;
          case 'success':
            if (_error) return;
            $.resumableObj.fire('fileProgress', $); // it's at least progress
            if ($.isComplete()) {
              $.resumableObj.fire('fileSuccess', $, message);
            }
            break;
          case 'retry':
            $.resumableObj.fire('fileRetry', $);
            break;
        }
      };

      // Main code to set up a file object with chunks,
      // packaged to be able to handle retries if needed.
      $.chunks = [];
<<<<<<< HEAD
      $.abort = function () {
        // Stop current uploads
        var abortCount = 0;
        $h.each($.chunks, function (c) {
=======
      $.abort = function() {
        // Stop current uploads
        var abortCount = 0;
        $h.each($.chunks, function(c) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          if (c.status() == 'uploading') {
            c.abort();
            abortCount++;
          }
        });
        if (abortCount > 0) $.resumableObj.fire('fileProgress', $);
      };
<<<<<<< HEAD
      $.cancel = function () {
=======
      $.cancel = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        // Reset this file to be void
        var _chunks = $.chunks;
        $.chunks = [];
        // Stop current uploads
<<<<<<< HEAD
        $h.each(_chunks, function (c) {
=======
        $h.each(_chunks, function(c) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          if (c.status() == 'uploading') {
            c.abort();
            $.resumableObj.uploadNextChunk();
          }
        });
        $.resumableObj.removeFile($);
        $.resumableObj.fire('fileProgress', $);
      };
<<<<<<< HEAD
      $.retry = function () {
        $.bootstrap();
        var firedRetry = false;
        $.resumableObj.on('chunkingComplete', function () {
=======
      $.retry = function() {
        $.bootstrap();
        var firedRetry = false;
        $.resumableObj.on('chunkingComplete', function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          if (!firedRetry) $.resumableObj.upload();
          firedRetry = true;
        });
      };
<<<<<<< HEAD
      $.bootstrap = function () {
=======
      $.bootstrap = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        $.abort();
        _error = false;
        // Rebuild stack of chunks from file
        $.chunks = [];
        $._prevProgress = 0;
        var round = $.getOpt('forceChunkSize') ? Math.ceil : Math.floor;
        var maxOffset = Math.max(round($.file.size / $.getOpt('chunkSize')), 1);
        for (var offset = 0; offset < maxOffset; offset++) {
<<<<<<< HEAD
          (function (offset) {
            window.setTimeout(function () {
=======
          (function(offset) {
            window.setTimeout(function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              $.chunks.push(new ResumableChunk($.resumableObj, $, offset, chunkEvent));
              $.resumableObj.fire('chunkingProgress', $, offset / maxOffset);
            }, 0);
          })(offset);
        }
<<<<<<< HEAD
        window.setTimeout(function () {
          $.resumableObj.fire('chunkingComplete', $);
        }, 0);
      };
      $.progress = function () {
=======
        window.setTimeout(function() {
          $.resumableObj.fire('chunkingComplete', $);
        }, 0);
      };
      $.progress = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (_error) return 1;
        // Sum up progress across everything
        var ret = 0;
        var error = false;
<<<<<<< HEAD
        $h.each($.chunks, function (c) {
=======
        $h.each($.chunks, function(c) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          if (c.status() == 'error') error = true;
          ret += c.progress(true); // get chunk progress relative to entire file
        });
        ret = error ? 1 : ret > 0.99999 ? 1 : ret;
        ret = Math.max($._prevProgress, ret); // We don't want to lose percentages when an upload is paused
        $._prevProgress = ret;
        return ret;
      };
<<<<<<< HEAD
      $.isUploading = function () {
        var uploading = false;
        $h.each($.chunks, function (chunk) {
=======
      $.isUploading = function() {
        var uploading = false;
        $h.each($.chunks, function(chunk) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          if (chunk.status() == 'uploading') {
            uploading = true;
            return false;
          }
        });
        return uploading;
      };
<<<<<<< HEAD
      $.isComplete = function () {
        var outstanding = false;
        $h.each($.chunks, function (chunk) {
=======
      $.isComplete = function() {
        var outstanding = false;
        $h.each($.chunks, function(chunk) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          var status = chunk.status();
          if (status == 'pending' || status == 'uploading' || chunk.preprocessState === 1) {
            outstanding = true;
            return false;
          }
        });
        return !outstanding;
      };
<<<<<<< HEAD
      $.pause = function (pause) {
=======
      $.pause = function(pause) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (typeof pause === 'undefined') {
          $._pause = $._pause ? false : true;
        } else {
          $._pause = pause;
        }
      };
<<<<<<< HEAD
      $.isPaused = function () {
=======
      $.isPaused = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        return $._pause;
      };

      // Bootstrap and return
      $.resumableObj.fire('chunkingStart', $);
      $.bootstrap();
      return this;
    }

    function ResumableChunk(resumableObj, fileObj, offset, callback) {
      var $ = this;
      $.opts = {};
      $.getOpt = resumableObj.getOpt;
      $.resumableObj = resumableObj;
      $.fileObj = fileObj;
      $.fileObjSize = fileObj.size;
      $.fileObjType = fileObj.file.type;
      $.offset = offset;
      $.callback = callback;
      $.lastProgressCallback = new Date();
      $.tested = false;
      $.retries = 0;
      $.pendingRetry = false;
      $.preprocessState = 0; // 0 = unprocessed, 1 = processing, 2 = finished

      // Computed properties
      var chunkSize = $.getOpt('chunkSize');
      $.loaded = 0;
      $.startByte = $.offset * chunkSize;
      $.endByte = Math.min($.fileObjSize, ($.offset + 1) * chunkSize);
      if ($.fileObjSize - $.endByte < chunkSize && !$.getOpt('forceChunkSize')) {
        // The last chunk will be bigger than the chunk size, but less than 2*chunkSize
        $.endByte = $.fileObjSize;
      }
      $.xhr = null;

      // test() makes a GET request without any data to see if the chunk has already been uploaded in a previous session
<<<<<<< HEAD
      $.test = function () {
        // Set up request and listen for event
        $.xhr = new XMLHttpRequest();

        var testHandler = function (e) {
=======
      $.test = function() {
        // Set up request and listen for event
        $.xhr = new XMLHttpRequest();

        var testHandler = function(e) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          $.tested = true;
          var status = $.status();
          if (status == 'success') {
            $.callback(status, $.message());
            $.resumableObj.uploadNextChunk();
          } else {
            $.send();
          }
        };
        $.xhr.addEventListener('load', testHandler, false);
        $.xhr.addEventListener('error', testHandler, false);
        $.xhr.addEventListener('timeout', testHandler, false);

        // Add data from the query options
        var params = [];
        var parameterNamespace = $.getOpt('parameterNamespace');
        var customQuery = $.getOpt('query');
        if (typeof customQuery == 'function') customQuery = customQuery($.fileObj, $);
<<<<<<< HEAD
        $h.each(customQuery, function (k, v) {
=======
        $h.each(customQuery, function(k, v) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          params.push(
            [encodeURIComponent(parameterNamespace + k), encodeURIComponent(v)].join('='),
          );
        });
        // Add extra data to identify chunk
        params = params.concat(
          [
            // define key/value pairs for additional parameters
            ['chunkNumberParameterName', $.offset + 1],
            ['chunkSizeParameterName', $.getOpt('chunkSize')],
            ['currentChunkSizeParameterName', $.endByte - $.startByte],
            ['totalSizeParameterName', $.fileObjSize],
            ['typeParameterName', $.fileObjType],
            ['identifierParameterName', $.fileObj.uniqueIdentifier],
            ['fileNameParameterName', $.fileObj.fileName],
            ['relativePathParameterName', $.fileObj.relativePath],
            ['totalChunksParameterName', $.fileObj.chunks.length],
          ]
<<<<<<< HEAD
            .filter(function (pair) {
=======
            .filter(function(pair) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              // include items that resolve to truthy values
              // i.e. exclude false, null, undefined and empty strings
              return $.getOpt(pair[0]);
            })
<<<<<<< HEAD
            .map(function (pair) {
=======
            .map(function(pair) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              // map each key/value pair to its final form
              return [parameterNamespace + $.getOpt(pair[0]), encodeURIComponent(pair[1])].join(
                '=',
              );
            }),
        );
        // Append the relevant chunk and send it
        $.xhr.open($.getOpt('testMethod'), $h.getTarget('test', params));
        $.xhr.timeout = $.getOpt('xhrTimeout');
        $.xhr.withCredentials = $.getOpt('withCredentials');
        // Add data from header options
        var customHeaders = $.getOpt('headers');
        if (typeof customHeaders === 'function') {
          customHeaders = customHeaders($.fileObj, $);
        }
<<<<<<< HEAD
        $h.each(customHeaders, function (k, v) {
=======
        $h.each(customHeaders, function(k, v) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          $.xhr.setRequestHeader(k, v);
        });
        $.xhr.send(null);
      };

<<<<<<< HEAD
      $.preprocessFinished = function () {
=======
      $.preprocessFinished = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        $.preprocessState = 2;
        $.send();
      };

      // send() uploads the actual data in a POST call
<<<<<<< HEAD
      $.send = function () {
=======
      $.send = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        var preprocess = $.getOpt('preprocess');
        if (typeof preprocess === 'function') {
          switch ($.preprocessState) {
            case 0:
              $.preprocessState = 1;
              preprocess($);
              return;
            case 1:
              return;
            case 2:
              break;
          }
        }
        if ($.getOpt('testChunks') && !$.tested) {
          $.test();
          return;
        }

        // Set up request and listen for event
        $.xhr = new XMLHttpRequest();

        // Progress
        $.xhr.upload.addEventListener(
          'progress',
<<<<<<< HEAD
          function (e) {
=======
          function(e) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            if (
              new Date() - $.lastProgressCallback >
              $.getOpt('throttleProgressCallbacks') * 1000
            ) {
              $.callback('progress');
              $.lastProgressCallback = new Date();
            }
            $.loaded = e.loaded || 0;
          },
          false,
        );
        $.loaded = 0;
        $.pendingRetry = false;
        $.callback('progress');

        // Done (either done, failed or retry)
<<<<<<< HEAD
        var doneHandler = function (e) {
=======
        var doneHandler = function(e) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          var status = $.status();
          if (status == 'success' || status == 'error') {
            $.callback(status, $.message());
            $.resumableObj.uploadNextChunk();
          } else {
            $.callback('retry', $.message());
            $.abort();
            $.retries++;
            var retryInterval = $.getOpt('chunkRetryInterval');
            if (retryInterval !== undefined) {
              $.pendingRetry = true;
              setTimeout($.send, retryInterval);
            } else {
              $.send();
            }
          }
        };
        $.xhr.addEventListener('load', doneHandler, false);
        $.xhr.addEventListener('error', doneHandler, false);
        $.xhr.addEventListener('timeout', doneHandler, false);

        // Set up the basic query data from Resumable
        var query = [
          ['chunkNumberParameterName', $.offset + 1],
          ['chunkSizeParameterName', $.getOpt('chunkSize')],
          ['currentChunkSizeParameterName', $.endByte - $.startByte],
          ['totalSizeParameterName', $.fileObjSize],
          ['typeParameterName', $.fileObjType],
          ['identifierParameterName', $.fileObj.uniqueIdentifier],
          ['fileNameParameterName', $.fileObj.fileName],
          ['relativePathParameterName', $.fileObj.relativePath],
          ['totalChunksParameterName', $.fileObj.chunks.length],
        ]
<<<<<<< HEAD
          .filter(function (pair) {
=======
          .filter(function(pair) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            // include items that resolve to truthy values
            // i.e. exclude false, null, undefined and empty strings
            return $.getOpt(pair[0]);
          })
<<<<<<< HEAD
          .reduce(function (query, pair) {
=======
          .reduce(function(query, pair) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            // assign query key/value
            query[$.getOpt(pair[0])] = pair[1];
            return query;
          }, {});
        // Mix in custom data
        var customQuery = $.getOpt('query');
        if (typeof customQuery == 'function') customQuery = customQuery($.fileObj, $);
<<<<<<< HEAD
        $h.each(customQuery, function (k, v) {
=======
        $h.each(customQuery, function(k, v) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          query[k] = v;
        });

        var func = $.fileObj.file.slice
          ? 'slice'
          : $.fileObj.file.mozSlice
          ? 'mozSlice'
          : $.fileObj.file.webkitSlice
          ? 'webkitSlice'
          : 'slice';
        var bytes = $.fileObj.file[func](
          $.startByte,
          $.endByte,
          $.getOpt('setChunkTypeFromFile') ? $.fileObj.file.type : '',
        );
        var data = null;
        var params = [];

        var parameterNamespace = $.getOpt('parameterNamespace');
        if ($.getOpt('method') === 'octet') {
          // Add data from the query options
          data = bytes;
<<<<<<< HEAD
          $h.each(query, function (k, v) {
=======
          $h.each(query, function(k, v) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            params.push(
              [encodeURIComponent(parameterNamespace + k), encodeURIComponent(v)].join('='),
            );
          });
        } else {
          // Add data from the query options
          data = new FormData();
<<<<<<< HEAD
          $h.each(query, function (k, v) {
=======
          $h.each(query, function(k, v) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            data.append(parameterNamespace + k, v);
            params.push(
              [encodeURIComponent(parameterNamespace + k), encodeURIComponent(v)].join('='),
            );
          });
          if ($.getOpt('chunkFormat') == 'blob') {
            data.append(
              parameterNamespace + $.getOpt('fileParameterName'),
              bytes,
              $.fileObj.fileName,
            );
          } else if ($.getOpt('chunkFormat') == 'base64') {
            var fr = new FileReader();
<<<<<<< HEAD
            fr.onload = function (e) {
=======
            fr.onload = function(e) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              data.append(parameterNamespace + $.getOpt('fileParameterName'), fr.result);
              $.xhr.send(data);
            };
            fr.readAsDataURL(bytes);
          }
        }

        var target = $h.getTarget('upload', params);
        var method = $.getOpt('uploadMethod');

        $.xhr.open(method, target);
        if ($.getOpt('method') === 'octet') {
          $.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        }
        $.xhr.timeout = $.getOpt('xhrTimeout');
        $.xhr.withCredentials = $.getOpt('withCredentials');
        // Add data from header options
        var customHeaders = $.getOpt('headers');
        if (typeof customHeaders === 'function') {
          customHeaders = customHeaders($.fileObj, $);
        }

<<<<<<< HEAD
        $h.each(customHeaders, function (k, v) {
=======
        $h.each(customHeaders, function(k, v) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          $.xhr.setRequestHeader(k, v);
        });

        if ($.getOpt('chunkFormat') == 'blob') {
          $.xhr.send(data);
        }
      };
<<<<<<< HEAD
      $.abort = function () {
=======
      $.abort = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        // Abort and reset
        if ($.xhr) $.xhr.abort();
        $.xhr = null;
      };
<<<<<<< HEAD
      $.status = function () {
=======
      $.status = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        // Returns: 'pending', 'uploading', 'success', 'error'
        if ($.pendingRetry) {
          // if pending retry then that's effectively the same as actively uploading,
          // there might just be a slight delay before the retry starts
          return 'uploading';
        } else if (!$.xhr) {
          return 'pending';
        } else if ($.xhr.readyState < 4) {
          // Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
          return 'uploading';
        } else {
          if ($.xhr.status == 200 || $.xhr.status == 201) {
            // HTTP 200, 201 (created)
            return 'success';
          } else if (
            $h.contains($.getOpt('permanentErrors'), $.xhr.status) ||
            $.retries >= $.getOpt('maxChunkRetries')
          ) {
            // HTTP 415/500/501, permanent error
            return 'error';
          } else {
            // this should never happen, but we'll reset and queue a retry
            // a likely case for this would be 503 service unavailable
            $.abort();
            return 'pending';
          }
        }
      };
<<<<<<< HEAD
      $.message = function () {
        return $.xhr ? $.xhr.responseText : '';
      };
      $.progress = function (relative) {
=======
      $.message = function() {
        return $.xhr ? $.xhr.responseText : '';
      };
      $.progress = function(relative) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (typeof relative === 'undefined') relative = false;
        var factor = relative ? ($.endByte - $.startByte) / $.fileObjSize : 1;
        if ($.pendingRetry) return 0;
        if (!$.xhr || !$.xhr.status) factor *= 0.95;
        var s = $.status();
        switch (s) {
          case 'success':
          case 'error':
            return 1 * factor;
          case 'pending':
            return 0 * factor;
          default:
            return ($.loaded / ($.endByte - $.startByte)) * factor;
        }
      };
      return this;
    }

    // QUEUE
<<<<<<< HEAD
    $.uploadNextChunk = function () {
=======
    $.uploadNextChunk = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      var found = false;

      // In some cases (such as videos) it's really handy to upload the first
      // and last chunk of a file quickly; this let's the server check the file's
      // metadata and determine if there's even a point in continuing.
      if ($.getOpt('prioritizeFirstAndLastChunk')) {
<<<<<<< HEAD
        $h.each($.files, function (file) {
=======
        $h.each($.files, function(file) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          if (
            file.chunks.length &&
            file.chunks[0].status() == 'pending' &&
            file.chunks[0].preprocessState === 0
          ) {
            file.chunks[0].send();
            found = true;
            return false;
          }
          if (
            file.chunks.length > 1 &&
            file.chunks[file.chunks.length - 1].status() == 'pending' &&
            file.chunks[file.chunks.length - 1].preprocessState === 0
          ) {
            file.chunks[file.chunks.length - 1].send();
            found = true;
            return false;
          }
        });
        if (found) return true;
      }

      // Now, simply look for the next, best thing to upload
<<<<<<< HEAD
      $h.each($.files, function (file) {
        if (file.isPaused() === false) {
          $h.each(file.chunks, function (chunk) {
=======
      $h.each($.files, function(file) {
        if (file.isPaused() === false) {
          $h.each(file.chunks, function(chunk) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            if (chunk.status() == 'pending' && chunk.preprocessState === 0) {
              chunk.send();
              found = true;
              return false;
            }
          });
        }
        if (found) return false;
      });
      if (found) return true;

      // The are no more outstanding chunks to upload, check is everything is done
      var outstanding = false;
<<<<<<< HEAD
      $h.each($.files, function (file) {
=======
      $h.each($.files, function(file) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (!file.isComplete()) {
          outstanding = true;
          return false;
        }
      });
      if (!outstanding) {
        // All chunks have been uploaded, complete
        $.fire('complete');
      }
      return false;
    };

    // PUBLIC METHODS FOR RESUMABLE.JS
<<<<<<< HEAD
    $.assignBrowse = function (domNodes, isDirectory) {
      if (typeof domNodes.length == 'undefined') domNodes = [domNodes];

      $h.each(domNodes, function (domNode) {
=======
    $.assignBrowse = function(domNodes, isDirectory) {
      if (typeof domNodes.length == 'undefined') domNodes = [domNodes];

      $h.each(domNodes, function(domNode) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        var input;
        if (domNode.tagName === 'INPUT' && domNode.type === 'file') {
          input = domNode;
        } else {
          input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.style.display = 'none';
          domNode.addEventListener(
            'click',
<<<<<<< HEAD
            function () {
=======
            function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              input.style.opacity = 0;
              input.style.display = 'block';
              input.focus();
              input.click();
              input.style.display = 'none';
            },
            false,
          );
          domNode.appendChild(input);
        }
        var maxFiles = $.getOpt('maxFiles');
        if (typeof maxFiles === 'undefined' || maxFiles != 1) {
          input.setAttribute('multiple', 'multiple');
        } else {
          input.removeAttribute('multiple');
        }
        if (isDirectory) {
          input.setAttribute('webkitdirectory', 'webkitdirectory');
        } else {
          input.removeAttribute('webkitdirectory');
        }
        var fileTypes = $.getOpt('fileType');
        if (typeof fileTypes !== 'undefined' && fileTypes.length >= 1) {
          input.setAttribute(
            'accept',
            fileTypes
<<<<<<< HEAD
              .map(function (e) {
=======
              .map(function(e) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                return '.' + e;
              })
              .join(','),
          );
        } else {
          input.removeAttribute('accept');
        }
        // When new files are added, simply append them to the overall list
        input.addEventListener(
          'change',
<<<<<<< HEAD
          function (e) {
=======
          function(e) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            appendFilesFromFileList(e.target.files, e);
            var clearInput = $.getOpt('clearInput');
            if (clearInput) {
              e.target.value = '';
            }
          },
          false,
        );
      });
    };
<<<<<<< HEAD
    $.assignDrop = function (domNodes) {
      if (typeof domNodes.length == 'undefined') domNodes = [domNodes];

      $h.each(domNodes, function (domNode) {
=======
    $.assignDrop = function(domNodes) {
      if (typeof domNodes.length == 'undefined') domNodes = [domNodes];

      $h.each(domNodes, function(domNode) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        domNode.addEventListener('dragover', preventDefault, false);
        domNode.addEventListener('dragenter', preventDefault, false);
        domNode.addEventListener('drop', onDrop, false);
      });
    };
<<<<<<< HEAD
    $.unAssignDrop = function (domNodes) {
      if (typeof domNodes.length == 'undefined') domNodes = [domNodes];

      $h.each(domNodes, function (domNode) {
=======
    $.unAssignDrop = function(domNodes) {
      if (typeof domNodes.length == 'undefined') domNodes = [domNodes];

      $h.each(domNodes, function(domNode) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        domNode.removeEventListener('dragover', preventDefault);
        domNode.removeEventListener('dragenter', preventDefault);
        domNode.removeEventListener('drop', onDrop);
      });
    };
<<<<<<< HEAD
    $.isUploading = function () {
      var uploading = false;
      $h.each($.files, function (file) {
=======
    $.isUploading = function() {
      var uploading = false;
      $h.each($.files, function(file) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (file.isUploading()) {
          uploading = true;
          return false;
        }
      });
      return uploading;
    };
<<<<<<< HEAD
    $.upload = function () {
=======
    $.upload = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      // Make sure we don't start too many uploads at once
      if ($.isUploading()) return;
      // Kick off the queue
      $.fire('uploadStart');
      for (var num = 1; num <= $.getOpt('simultaneousUploads'); num++) {
        $.uploadNextChunk();
      }
    };
<<<<<<< HEAD
    $.pause = function () {
      // Resume all chunks currently being uploaded
      $h.each($.files, function (file) {
=======
    $.pause = function() {
      // Resume all chunks currently being uploaded
      $h.each($.files, function(file) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        file.abort();
      });
      $.fire('pause');
    };
<<<<<<< HEAD
    $.cancel = function () {
=======
    $.cancel = function() {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      $.fire('beforeCancel');
      for (var i = $.files.length - 1; i >= 0; i--) {
        $.files[i].cancel();
      }
      $.fire('cancel');
    };
<<<<<<< HEAD
    $.progress = function () {
      var totalDone = 0;
      var totalSize = 0;
      // Resume all chunks currently being uploaded
      $h.each($.files, function (file) {
=======
    $.progress = function() {
      var totalDone = 0;
      var totalSize = 0;
      // Resume all chunks currently being uploaded
      $h.each($.files, function(file) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        totalDone += file.progress() * file.size;
        totalSize += file.size;
      });
      return totalSize > 0 ? totalDone / totalSize : 0;
    };
<<<<<<< HEAD
    $.addFile = function (file, event) {
      appendFilesFromFileList([file], event);
    };
    $.addFiles = function (files, event) {
      appendFilesFromFileList(files, event);
    };
    $.removeFile = function (file) {
=======
    $.addFile = function(file, event) {
      appendFilesFromFileList([file], event);
    };
    $.addFiles = function(files, event) {
      appendFilesFromFileList(files, event);
    };
    $.removeFile = function(file) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      for (var i = $.files.length - 1; i >= 0; i--) {
        if ($.files[i] === file) {
          $.files.splice(i, 1);
        }
      }
    };
<<<<<<< HEAD
    $.getFromUniqueIdentifier = function (uniqueIdentifier) {
      var ret = false;
      $h.each($.files, function (f) {
=======
    $.getFromUniqueIdentifier = function(uniqueIdentifier) {
      var ret = false;
      $h.each($.files, function(f) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (f.uniqueIdentifier == uniqueIdentifier) ret = f;
      });
      return ret;
    };
<<<<<<< HEAD
    $.getSize = function () {
      var totalSize = 0;
      $h.each($.files, function (file) {
=======
    $.getSize = function() {
      var totalSize = 0;
      $h.each($.files, function(file) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        totalSize += file.size;
      });
      return totalSize;
    };
<<<<<<< HEAD
    $.handleDropEvent = function (e) {
      onDrop(e);
    };
    $.handleChangeEvent = function (e) {
      appendFilesFromFileList(e.target.files, e);
      e.target.value = '';
    };
    $.updateQuery = function (query) {
=======
    $.handleDropEvent = function(e) {
      onDrop(e);
    };
    $.handleChangeEvent = function(e) {
      appendFilesFromFileList(e.target.files, e);
      e.target.value = '';
    };
    $.updateQuery = function(query) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      $.opts.query = query;
    };

    return this;
  };

<<<<<<< HEAD
  // Browser: Expose to window
  window.Resumable = Resumable;
=======
  // Node.js-style export for Node and Component
  if (typeof module != 'undefined') {
    module.exports = Resumable;
  } else if (typeof define === 'function' && define.amd) {
    // AMD/requirejs: Define the module
    define(function() {
      return Resumable;
    });
  } else {
    // Browser: Expose to window
    window.Resumable = Resumable;
  }
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
})();

export default window.Resumable;
