const gulp = require('gulp');
const concat = require('gulp-concat');
const babel = require('gulp-babel');

gulp.task('scripts', () =>
  gulp.src('src/auth.js')
    .pipe(babel({
      presets: ['env'],
      plugins: ['']
    }))
    .pipe(gulp.dest('dist'))
);

gulp.task('build', ['scripts'], () => {
  
});