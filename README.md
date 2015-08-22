# gulp-gorender

[Gulp](http://gulpjs.com) plugin to render files with
[Go](http://golang.org)
[text.Template](http://golang.org/pkg/text/template/) template engine.

## Install

```sh
$ npm install --save-dev gulp-gorender
```

You also need to have [gorender](http://github.com/localvoid/gorender)
installed.

## Usage

```js
var gulp = require('gulp');
var gorender = require('gulp-gorender');

gulp.task('default', function () {
	return gulp.src('src/*.html', {html: true})
		.pipe(gorender({data: 'data'}))
		.pipe(gulp.dest('dist'));
});
```

## API

### gorender(options)

#### options

##### data

Type: `String`  
Default: `data`

The data directory.

Data files should be in JSON format.

##### include

Type: `String`

Include templates.

##### base

Type: `String`

Base template name.

##### html

Type: `Boolean`  
Default: `false`

Use [html.Template](http://golang.org/pkg/text/template/) template
package.
