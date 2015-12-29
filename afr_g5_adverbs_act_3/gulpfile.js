'use strict';

/*******************************************************************************
* Required & Variables                                                         *
*******************************************************************************/

  var gulp        = require('gulp');

  var browserSync = require('browser-sync');
  var del         = require('del');
  var stylish     = require('jshint-stylish');
  var mkdirp      = require('mkdirp');

  var compass     = require('gulp-compass');
  var concat      = require('gulp-concat');
  var eslint      = require('gulp-eslint');
  var gulpif      = require('gulp-if');
  var ignore      = require('gulp-ignore');
  var imagemin    = require('gulp-imagemin');
  var jshint      = require('gulp-jshint');
  var minifyCSS   = require('gulp-minify-css');
  var minifyHTML  = require('gulp-minify-html');
  var uglify      = require('gulp-uglify');

  var build       = { 'intent': 'serve', 'to': 'serve' };

  var messages    = {
    buildCss:    '<span style="color: grey;">Building</span> CSS...',
    buildHtml:   '<span style="color: grey;">Building</span> HTML...',
    buildImages: '<span style="color: grey;">Building</span> Images...',
    buildJs:     '<span style="color: grey;">Building</span> JS...',
    errCompass:  '<span style="color: red; ">Error</span> in Compass.',
    lintJs:      '<span style="color: grey;">Linting</span> JS...'
  };

/*******************************************************************************
* Tasks: Clean Assets                                                          *
*******************************************************************************/

  /**
   * Task cleanCss
   */
  gulp.task('cleanCss', function (cb) {
    del([build.to + '/css'], cb);
  });

  /**
   * Task cleanHtml
   */
  gulp.task('cleanHtml', function (cb) {
    del([build.to + '/*.html'], cb);
  });

  /**
   * Task cleanImages
   */
  gulp.task('cleanImages', function (cb) {
    del([build.to + '/images'], cb);
  });

  /**
   * Task cleanInclude
   */
  gulp.task('cleanInclude', function (cb) {
    del([build.to + '/include'], cb);
  });

  /**
   * Task cleanJs
   */
  gulp.task('cleanJs', function (cb) {
    del([build.to + '/js'], cb);
  });

  /**
   * Task cleanJs
   */
  gulp.task('cleanPrint', function (cb) {
    del([build.to + '/print'], cb);
  });

/*******************************************************************************
* Tasks: Linting                                                               *
*******************************************************************************/

  /**
   * Task: lintJs
   */
  gulp.task('lintJs', function() {
    browserSync.notify(messages.lintJs);
    gulp.src('app/scripts/**/*.js')
      .pipe(eslint('.eslintrc'))
      .pipe(eslint.format());
  });

/*******************************************************************************
* Tasks: Building                                                              *
*******************************************************************************/

  /**
   * Task: buildCss (Compass Sass)
   */
  gulp.task('buildCss', ['cleanCss'], function () {
    browserSync.notify(messages.buildCss);
    var stream = gulp.src('source/scss/**/*.scss')
      .pipe(compass({
        css:           build.to + '/css',
        sass:          'source/scss',
        image:         'source/images',
        line_comments: (build.intent == 'serve'),
        debug:         (build.intent == 'serve'),
      }))
      .on('error', function(err) {
        console.log(err.toString());
        browserSync.notify(messages.errCompass, 5000);
      })
      .pipe(gulpif(build.intent == 'deploy', minifyCSS({
        keepSpecialComments: 0
      })))
      .pipe(gulp.dest(build.to + '/css'))
      .pipe(browserSync.reload({ stream: true }));
    return stream;
  });

  /**
   * Task: buildHtml
   */
  gulp.task('buildHtml', ['cleanHtml'], function() {
    var opts = { comments: true };
    gulp.src('source/index.html')
      .pipe(gulpif(build.intent == 'deploy', minifyHTML(opts)))
      .pipe(gulp.dest(build.to))
      .pipe(browserSync.reload({ stream: true, once: true }));
  });

  /**
   * Task: buildImages
   */
  gulp.task('buildImages', ['cleanImages'], function() {
    browserSync.notify(messages.buildImages);
    return gulp.src('source/images/**/*')
      .pipe(imagemin())
      .pipe(gulp.dest(build.to + '/images'));
  });

  /**
   * Task: buildInclude
   */
  gulp.task('buildInclude', ['cleanInclude'], function() {
    return gulp.src('./include/**/*')
      .pipe(gulp.dest(build.to + '/include'));
  });

  /**
   * Task: buildJs
   */
  gulp.task('buildJs', ['cleanJs', 'lintJs'], function() {
    browserSync.notify(messages.buildJs);
    gulp.src('source/js/*.json')
      .pipe(gulp.dest('./' +  build.to + '/js'));
    return gulp.src('source/js/**/*.js')
      .pipe(concat('script.js'))
      .pipe(gulpif(build.intent == 'deploy', uglify()))
      .pipe(gulp.dest('./' + build.to + '/js'))
      .pipe(browserSync.reload({ stream: true, once: true }));
  });

  /**
   * Task: buildPrint
   */
  gulp.task('buildPrint', ['cleanPrint'], function() {
    return gulp.src('source/print/**/*')
      .pipe(gulp.dest(build.to + '/print'));
  });

  /**
   * Task: buildAll
   */
  gulp.task('buildAll', [
    'buildCss',
    'buildHtml',
    'buildImages',
    'buildInclude',
    'buildJs',
    'buildPrint'
  ], function (cb) {
    cb();
  });

/*******************************************************************************
* Tasks: Browser-Sync                                                          *
*******************************************************************************/

  /**
   * Task borwserSync
   */
  gulp.task('browserSync', ['buildAll'], function() {
    browserSync({
      server: {
        baseDir: build.to
      }
    });
  });

/*******************************************************************************
* Tasks: Watch                                                                 *
*******************************************************************************/

  /**
   * Task: watch
   */
  gulp.task('watch', function() {

    // *.html:
    gulp.watch('source/*.html', ['buildHtml']);

    // Images:
    gulp.watch('source/images/**/*', ['buildImages']);

    // Includes:
    gulp.watch('include/**/*', ['buildInclude']);

    // Compass Sass files:
    gulp.watch('source/scss/**/*.scss', ['buildCss']);

    // JS files:
    gulp.watch(['source/js/**/*.js', 'source/js/**/*.json'], ['buildJs']);

  });

/*******************************************************************************
* Tasks: setVariables                                                          *
*******************************************************************************/

  /**
   * setServe
   */
  gulp.task('setServe', function () {
    build.intent = 'serve';
    build.to     = 'serve';
    return;
  });

  /**
   * setDeploy
   */
  gulp.task('setDeploy', function () {
    build.intent = 'deploy';
    build.to     = 'content';
    return;
  });

/*******************************************************************************
* Command-line aggregate tasks.                                                *
*******************************************************************************/

  gulp.task('build', ['setDeploy', 'buildAll']);
  gulp.task('serve', ['setServe',  'browserSync', 'watch']);

  gulp.task('default', function() {
    console.log('Run either:');
    console.log('  gulp serve');
    console.log('    To serve the activity for you to work on.');
    console.log('  gulp build');
    console.log('    To build the activity once you are done.');
  });

/******************************************************************************/
