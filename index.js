'use strict';

var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var spawn = require('win-spawn');

var ERROR_HTML_TEMPLATE = '<!DOCTYPE html><html lang="en"><body><%- message %></body></html>';

function getDataFilePath(dataPath, filePath) {
  return path.join(dataPath, filePath.slice(0, -path.extname(filePath).length)) + '.json';
}

module.exports = function (options) {
  options = options || {};
  options.data = options.data || null;
  options.include = options.include || null;
  options.base = options.base || null;
  options.html = options.html || false;

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
        args.push('-d');
        args.push(dataPath);
      }
      if (options.include) {
        args.push('-i');
        args.push(options.include);
      }
      if (options.base) {
        args.push('-b');
        args.push(options.base);
      }
      if (options.html) {
        args.push('-html');
      }
      args.push(file.path);

      var gorender = spawn('gorender', args);

      gorender.stdout.setEncoding('utf8');
      gorender.stderr.setEncoding('utf8');

      var result = [];
      var error = [];

      gorender.stdout.on('data', function (data) {
        result.push(data);
      });

      gorender.stderr.on('data', function (data) {
        error.push(data);
      });

      gorender.on('error', function (err) {
        this.emit('error', new gutil.PluginError('gulp-gorender', err, {
          fileName: file.path
        }));
        cb();
      }.bind(this));

      gorender.on('close', function (code) {
        if (code === 0) {
          file.contents = new Buffer(result.join(''));
          this.push(file);
        } else if (code === 65) {
          if (options.html) {
            file.contents = new Buffer(_.template(ERROR_HTML_TEMPLATE,
                                                  {message: error.join('')}));
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
