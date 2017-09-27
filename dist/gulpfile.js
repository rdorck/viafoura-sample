'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat');
var babel = require('gulp-babel');

gulp.task('scripts', function () {
  return gulp.src('src/auth.js').pipe(babel({
    presets: ['env'],
    plugins: ['']
  })).pipe(gulp.dest('dist'));
});

gulp.task('build', ['scripts'], function () {});
//# sourceMappingURL=gulpfile.js.map