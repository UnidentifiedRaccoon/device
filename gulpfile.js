"use strict";

var gulp = require("gulp");
var plumber = require("gulp-plumber");
var notify = require("gulp-notify");
var beep = require('beepbeep');
var sourcemap = require("gulp-sourcemaps");
var rename = require("gulp-rename");
var sass = require("gulp-sass");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var htmlmin = require("gulp-htmlmin");
var csso = require("gulp-csso");
var uglify = require("gulp-uglify");
var server = require("browser-sync").create();
var imagemin = require("gulp-imagemin");
var svgstore = require("gulp-svgstore");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var del = require("del");

var onError = function(err) {
	notify.onError({
		title:    "Error in " + err.plugin,
		message: err.message
	})(err);
	beep(2);
	this.emit('end');
};

// для css


gulp.task("css", function () {
	return gulp.src("source/sass/style.scss")
		.pipe(plumber())
		.pipe(sourcemap.init())
		.pipe(sass())
		.pipe(postcss([
			autoprefixer()
		]))
		.pipe(sourcemap.write("."))
		.pipe(gulp.dest("build/css"))
		.pipe(server.stream());
});

gulp.task("css-min", function () {
	return gulp.src("source/sass/style.scss")
		.pipe(plumber())
		.pipe(sourcemap.init())
		.pipe(sass())
		.pipe(postcss([
			autoprefixer()
		]))
		.pipe(csso())
		.pipe(rename(function (path) {
			path.basename += "-min";
			path.extname = ".css";
		}))
		.pipe(sourcemap.write("."))
		.pipe(gulp.dest("build/css"))
		.pipe(server.stream());
});

// для html
gulp.task("html", function () {
	return gulp.src("source/*.html")
		.pipe(posthtml([
			include()
		]))
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(gulp.dest("build"));
});

// для js
gulp.task("js", function () {
	return gulp.src("source/js/*.js")
		.pipe(uglify())
		.pipe(rename(function (path) {
			path.basename += "-min";
		}))
		.pipe(gulp.dest("build/js"));
});

// для запуска локального сервера
gulp.task("server", function () {
	server.init({
		server: "build/",
		notify: false,
		open: true,
		cors: true,
		ui: false,
		index: "index.html"
	});

	gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("css", "css-min"));
	gulp.watch("source/img/*.svg", gulp.series("sprite", "html", "refresh"));
	gulp.watch("source/*.html", gulp.series("html", "refresh"));
	gulp.watch("source/js/*.js", gulp.series("js", "refresh"));

});

// для перезагрузки локального сервера
gulp.task("refresh", function(done) {
	server.reload();
	done();
});

// для копирования файлов в продакшн папку
gulp.task("copy", function() {
	return gulp.src([
		"source/fonts/**/*.{woff,woff2}",
		"source/img/**",
		"source/js/**",
		"source/*.ico"
	], {
		base: "source"
	})
		.pipe(gulp.dest("build"));
});

// для оптимизации изображений
gulp.task("images", function() {
	return gulp.src("source/img/**/*.{png,jpg,svg}")
		.pipe(imagemin([
			imagemin.optipng({optimizationLevel: 3}),
			imagemin.mozjpeg({progressive: true}),
			imagemin.svgo()
		]))
	pipe(gulp.dest("source/img"));
});

// для перевода картинок в webp
gulp.task("webp", function() {
	return gulp.src("source/img/**/*.{png,jpg}")
		.pipe(webp({quality: 90}))
		.pipe(gulp.dest("source/img"));
});

// для создания svg спрайта
gulp.task("sprite", function() {
	return gulp.src("source/img/**/icon-s-*.svg")
		.pipe(svgstore({
			inlineSvg: true
		}))
		.pipe(rename("sprite.svg"))
		.pipe(gulp.dest("build/img"));
});

gulp.task("clean", function() {return del("build");});
gulp.task("build", gulp.series("clean", "copy", "css", "css-min", "sprite",  "html", "js"));
gulp.task("start", gulp.series("build", "server"));
