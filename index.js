'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var gutil = require('gulp-util');
var through = require('through2');
var spawn = require('win-spawn');


var ERROR_HTML_TEMPLATE = '<!DOCTYPE html><html lang="en"><body><%- message %></body></html>';


function getDataFilePath(dataPath, filePath) {
  return path.join(dataPath, filePath.slice(0, -path.extname(filePath).length)) + '.json';
}

function compareLastModifiedTime(options) {
  options = _.assign({
    data: 'data'
  }, options);

  return function(stream, cb, sourceFile, targetPath) {
    fs.stat(targetPath, function (err, targetStat) {
      if (err) {
        if (err.code !== 'ENOENT') {
          stream.emit('error', new gutil.PluginError('gulp-gorender', err, {
            fileName: sourceFile.path
          }));
        } else {
          stream.push(sourceFile);
        }

        cb();
        return;
      }
      if (sourceFile.stat.mtime > targetStat.mtime) {
        stream.push(sourceFile);
        cb();
        return;
      }

      var dataPath = getDataFilePath(options.data, sourceFile.relative);

      fs.stat(dataPath, function (err, dataStat) {
        if (err) {
          if (err.code !== 'ENOENT') {
            stream.emit('error', new gutil.PluginError('gulp-gorender', err, {
              fileName: dataPath
            }));

            stream.push(sourceFile);
          }
          cb();
          return;
        }
        if (dataStat.mtime > targetStat.mtime) {
          stream.push(sourceFile);
        }
        cb();
      });
    });
  };
}

module.exports = function (options) {
  options = _.assign({
    data: 'data',
    html: false
  }, options);

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-gorender', 'Streaming not supported'));
      return cb();
    }

    var filePath = file.relative;
    var dataPath = getDataFilePath(options.data, filePath);

    fs.stat(dataPath, function(err, dataStat) {
      if (err) {
        if (err.code !== 'ENOENT') {
          this.emit('error', new gutil.PluginError('gulp-gorender', err, {
            fileName: dataPath
          }));
        }
        cb();
        return;
      }

      var gorender;

      if (options.html) {
        gorender = spawn('gorender', ['-html', '-d', dataPath, file.path]);
      } else {
        gorender = spawn('gorender', ['-d', dataPath, file.path]);
      }
      gorender.stdout.setEncoding('utf8');
      gorender.stderr.setEncoding('utf8');

      var result = '';
      var error = '';

      gorender.stdout.on('data', function (data) {
        result += data;
      });

      gorender.stderr.on('data', function (data) {
        error += data;
      });

      gorender.on('error', function (err) {
        this.emit('error', new gutil.PluginError('gulp-gorender', err, {
          fileName: file.path
        }));
        cb();
      }.bind(this));

      gorender.on('close', function (code) {
        gutil.log('exit code: ' + code);
        if (code === 0) {
          file.contents = new Buffer(result);
          this.push(file);
        } else if (code === 65) {
          if (options.html) {
            file.contents = new Buffer(_.template(ERROR_HTML_TEMPLATE, {message: error}));
          } else {
            file.contents = new Buffer(error);
          }
          this.push(file);
        } else if (code !== 0) {
          this.emit('error', new gutil.PluginError('gulp-gorender', 'gorender failed: ' + error, {
            fileName: file.path
          }));
        }
        cb();
      }.bind(this));
    }.bind(this));
  });
};

module.exports.compareLastModifiedTime = compareLastModifiedTime;
