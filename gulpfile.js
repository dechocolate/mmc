/*
 * gulp setting
 *
 */
var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var minify = require('gulp-minify');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var htmlmin = require('gulp-htmlmin');
var htmlreplace = require('gulp-html-replace');



gulp.task('clean', function() {
	return gulp.src('./client').pipe(clean({force: true}));
});

/*
 * web setting
 */
gulp.task('web-css', function() {
	return gulp.src('./client-dev/web/css/*.css')
		.pipe(sourcemaps.init())  // Process the original sources
		.pipe(sass())
		.pipe(minify())
		.pipe(sourcemaps.write()) // Add the map to modified source.
		.pipe(gulp.dest('./client/web/css'));
});


gulp.task('web-jshint', function () {
		
	return gulp.src('./client-dev/web/js/**/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(concat('bundle.js'))
		.pipe(minify({
	        ext:{
	            src:'-debug.js',
	            min:'.js'
	        }
	    }))
		//only uglify if gulp is ran with '--type production'
		.pipe(gutil.env.type === 'production' ? uglify() : gutil.noop()) 
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./client/web/js'));
});
 

gulp.task('web-html', function() {
	return gulp.src('./client-dev/web/*.html')
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('./client/web'));
});


gulp.task('web-htmlreplace', function() {
	// return gulp.src('./client/web/*.html')
	return gulp.src('./client-dev/web/index.html')
		.pipe(htmlreplace({
			'css': 'css/style.css',
			'js': 'js/bundle.js'
		}))
		.pipe(gulp.dest('./client/web'));
});


gulp.task('web-font', function() {	

	return gulp.src(['./client-dev/web/fonts/**/*'])
		.pipe(gulp.dest('./client/web/fonts'));
});

gulp.task('web-bower', function() {	

	return gulp.src(['./client-dev/web/bower_components/**/*'])
		.pipe(gulp.dest('./client/web/bower_components'));
});

gulp.task('web-vendor', function() {	

	return gulp.src(['./client-dev/web/vendor/**/*'])
		.pipe(gulp.dest('./client/web/vendor'));
});

gulp.task('web-views', function() {	

	return gulp.src(['./client-dev/web/views/**/*'])
		.pipe(gulp.dest('./client/web/views'));
});




/*
 * admin setting
 */
gulp.task('admin-css', function() {
	return gulp.src('./client-dev/admin/css/*.css')
		.pipe(sourcemaps.init())  // Process the original sources
		.pipe(sass())
		.pipe(minify())
		.pipe(sourcemaps.write()) // Add the map to modified source.
		.pipe(gulp.dest('./client/admin/css'));
});


gulp.task('admin-jshint', function () {
		
	return gulp.src('./client-dev/admin/js/**/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(concat('bundle.js'))
		.pipe(minify({
	        ext:{
	            src:'-debug.js',
	            min:'.js'
	        }
	    }))
		//only uglify if gulp is ran with '--type production'
		.pipe(gutil.env.type === 'production' ? uglify() : gutil.noop()) 
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./client/admin/js'));
});
 
gulp.task('admin-htmlreplace', function() {
	// return gulp.src('./client/web/*.html')
	return gulp.src('./client-dev/admin/index.html')
		.pipe(htmlreplace({
			'css': 'css/style.css',
			'js': 'js/bundle.js'
		}))
		.pipe(gulp.dest('./client/admin'));
});

gulp.task('admin-html', function() {
	return gulp.src('./client/admin/index.html')
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('./client/admin'));
});

gulp.task('admin-img', function() {	

	return gulp.src(['./client-dev/admin/images/**/*'])
		.pipe(gulp.dest('./client/admin/images'));
});

gulp.task('admin-font', function() {	

	return gulp.src(['./client-dev/admin/fonts/**/*'])
		.pipe(gulp.dest('./client/admin/fonts'));
});

gulp.task('admin-bower', function() {	

	return gulp.src(['./client-dev/admin/bower_components/**/*'])
		.pipe(gulp.dest('./client/admin/bower_components'));
});

gulp.task('admin-vendor', function() {	

	return gulp.src(['./client-dev/admin/vendor/**/*'])
		.pipe(gulp.dest('./client/admin/vendor'));
});

gulp.task('admin-views', function() {	

	return gulp.src(['./client-dev/admin/views/**/*'])
		.pipe(gulp.dest('./client/admin/views'));
});


 
gulp.task('builddist', [		
		'web-css', 'web-jshint', 'web-htmlreplace', 'web-font', 'web-bower', 'web-vendor', 'web-views',
		'admin-css', 'admin-jshint', 'admin-htmlreplace', 'admin-img', 'admin-font', 'admin-bower', 'admin-vendor', 'admin-views',
	],
	function() {
		gulp.src('./client/web/index.html')
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('./client/web'));

		gulp.src('./client/admin/index.html')
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('./client/admin'));
});

gulp.task('build', ['clean'], function() {	
	gulp.start('builddist');
});
