'use strict';

var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var child = require('child_process');

function getDataFilePath(dataPath, filePath) {
  return path.join(dataPath, filePath.slice(0, -path.extname(filePath).length)) + '.json';
}

module.exports = function(options) {
  options = options || {};
  options.data = options.data || null;
  options.include = options.include || null;
  options.base = options.base || null;
  options.html = options.html || false;
  options.executable = options.executable || 'gorender';

  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-gorender', 'Streaming not supported'));
      return cb();
    }

    var filePath = file.relative;

    var compile = function(data) {
      var args = [];

      if (data) {
        args.push('-d', dataPath);
      }
      if (options.include) {
        args.push('-i', options.include);
      }
      if (options.base) {
        args.push('-b', options.base);
      }
      if (options.html) {
        args.push('-html');
      }
      args.push(file.path);

      var process = child.spawn(options.executable, args);

      process.stdout.setEncoding('utf8');
      process.stderr.setEncoding('utf8');

      var result = [];
      var error = [];

      process.stdout.on('data', function(data) { result.push(data); });
      process.stderr.on('data', function(data) { error.push(data); });

      process.on('error', function(err) {
        this.emit('error', new gutil.PluginError('gulp-gorender', err, {
          fileName: file.path
        }));
        cb();
      }.bind(this));

      process.on('close', function(code) {
        if (code === 0) {
          file.contents = new Buffer(result.join(''));
          this.push(file);
        } else if (code === 65) {
          if (options.html) {
            file.contents = new Buffer('<!DOCTYPE html><html lang="en"><body>' +
                                       error.join('') +
                                       '</body></html>');
          } else {
            file.contents = new Buffer(error.join(''));
          }
          this.push(file);
        } else if (code !== 0) {
          this.emit('error', new gutil.PluginError('gulp-gorender',
                                                   'gorender failed: ' + error, {
                                                     fileName: file.path
                                                   }));
        }
        cb();
      }.bind(this));
    }.bind(this);

    if (options.data) {
      var dataPath = getDataFilePath(options.data, filePath);
      fs.stat(dataPath, function(err, dataStat) {
        compile(err ? null: dataPath);
      }.bind(this));
    } else {
      compile(null);
    }
  });
};
