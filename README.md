# [gulp](http://gulpjs.com)-gorender

> [Gulp](http://gulpjs.com) plugin to render files with [Go](http://golang.org) [text.template](http://golang.org/pkg/text/template/) template engine.

## Install

```sh
$ npm install --save-dev gulp-gorender
```

You also need to have [gorender](http://github.com/localvoid/gorender) installed.


## Usage

```js
var gulp = require('gulp');
var gorender = require('gulp-gorender');

var SRC = 'src/*.js';
var DEST = 'dist';

gulp.task('default', function () {
	return gulp.src(SRC)
		.pipe(gorender({data: 'data'}))
		.pipe(gulp.dest(DEST));
});
```

## API

### gorender(options)

#### options

##### data

Type: `String`

The data directory.

Data files should be in JSON format.


## [gulp-changed](https://www.npmjs.org/package/gulp-changed) comparator

`gorender.compareLastModifiedTime` checks for data dependencies.
