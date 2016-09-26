var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');

gulp.task('default', ['watch']);

gulp.task('build', function() {
    return browserify('./src/Global.js')
        .bundle()
        .pipe(source('index.js'))
        .pipe(gulp.dest('./1.0.0/'));
});
gulp.task('watch', function(){
    gulp.watch('./src/*.js', ['build']);
});
