/* eslint strict: 0 */
var gulp = require('gulp'),
    exec = require('child_process').exec,
    webpack = require('webpack-stream'),
    stripCode = require('gulp-strip-code'),
    eslint = require('gulp-eslint');

gulp.task('webpack', ['lint'], function() {
  return gulp.src('./src/js/main.js')
    .pipe(webpack({
      output: {
        filename: 'pebble-js-app.js'
      },
      module: {
        loaders: [{
          loader: 'babel-loader'
        }]
      }
    }))
    .pipe(gulp.dest('./src/js/'));
});

gulp.task('lint', function(){
  return gulp.src(['./src/js/*.js', '!./src/js/pebble-js-app.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('strip', ['webpack'],function(){
  return gulp.src(['./src/js/pebble-js-app.js'])
    .pipe(stripCode({
      start_comment: "test-block",
      end_comment: "end-test-block"
    }))
    .pipe(gulp.dest('./src/js'));
});

gulp.task('build', ['strip'], function(){
  exec('pebble build', function(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
});

// define tasks here
gulp.task('default', ['webpack', 'lint', 'strip', 'build']);
