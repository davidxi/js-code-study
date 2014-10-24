var path = require('path');

var gulp = require('gulp');
var browserify = require('browserify'),
    jshint = require('gulp-jshint'),
    source = require('vinyl-source-stream'),
    runSequence = require('run-sequence');

gulp.task('browserify', [], function() {
    var options= {
        entries: path.join(__dirname, './index.js')
    };
    return browserify(options)
            .bundle()
            .pipe(source('bundle.js'))
            .pipe(gulp.dest('./build'))
});

gulp.task('lint', [], function() {
  return gulp.src('src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('default', [], function() {
    runSequence(['lint'], ['browserify']);
});