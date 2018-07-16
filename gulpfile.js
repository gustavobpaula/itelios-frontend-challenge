'use strict';

var gulp = require('gulp'),
	$ = require('gulp-load-plugins')(),
	del = require('del'),
	browserSync = require('browser-sync'),
	webpack = require('webpack-stream'),
	named = require('vinyl-named'),
	preprocess = require('gulp-preprocess'),
	sassLint = require('gulp-sass-lint');

var paths = {
	scripts: 'src/scripts/**/*.js',
	webpack: 'src/scripts/*.js',
	styles: 'src/styles/**/*.scss',
	images: 'src/images/**/*.{png,jpeg,jpg,svg,gif}',
	fonts: 'src/fonts//**/*',
	html: 'src/*.html',
	extras: ['src/*.*', '!src/*.html'],
	dest: {
		scripts: 'dist/js',
		styles: 'dist/css',
		server: 'dist/server',
		images: 'dist/img',
		fonts: 'dist/fonts',
		html: 'dist/html',
		extras: 'dist'
	}
};

function getPath(source) {
	let newPath = [paths[source]],
		replaceSource;

	if ($.util.env.page) {
		if (source === 'webpack') {
			source = 'scripts';
		}

		replaceSource = source === 'pages' ? '' : '/' + source;

		newPath.push(newPath[0].replace(source, 'pages/' + $.util.env.page + replaceSource));
	}

	if (source === 'pages') {
		newPath.shift();
	}

	return newPath;
}

gulp.task('lint', () => {
	return gulp.src(['src/scripts/app/*.js', 'src/scripts/app.js'])
		.pipe($.eslint())
		.pipe($.eslint.format())
		.pipe($.eslint.failAfterError());
});

gulp.task('sassLint', () => {

	return gulp.src(paths.styles.concat('!src/styles/base/*'))
		.pipe(sassLint({
			options: {
				'config-file': '.sass-lint.yml'
			}
		}))
		.pipe(sassLint.format());
});

gulp.task('html', () => {
	return gulp.src(paths.html)
		.pipe(preprocess({
			context: { PROD: $.util.env.production }
		}))
		.pipe(gulp.dest(paths.dest.extras));
});

gulp.task('fonts', () => {
	return gulp.src(paths.fonts)
		.pipe($.newer(paths.dest.fonts))
		.pipe(gulp.dest(paths.dest.fonts));
});

gulp.task('scripts', ['lint'], () => {
	return gulp.src(
		getPath('webpack')
	)
		.pipe($.plumber())
		.pipe(named())
		.pipe(webpack({
			output: {
				filename: '[name].min.js'
			},
			externals: {
				'jquery': 'jQuery',
				'dustjs-linkedin': 'dust'
			},
			resolve: {
				modules: ['src/scripts', 'node_modules']
			},
			module: {
				loaders: [
					{
						test: /\.html$/,
						loader: 'dust-loader'
					},
					{
						test: /\.js$/,
						use: 'babel-loader',
						exclude: /node_modules/
					}
				]
			},
			plugins: [
				$.util.env.production ? new webpack.webpack.optimize.UglifyJsPlugin({
					minimize: true,
					compress: {
						warnings: false
					}
				}) : $.util.noop,
			],
			devtool: $.util.env.production ? '' : '#source-map'
		}))
		.pipe(gulp.dest(paths.dest.scripts));
});

gulp.task('styles', ['sassLint'], () => {
	return gulp.src(paths.styles)
		.pipe($.plumber())
		.pipe($.util.env.production ? $.util.noop() : $.sourcemaps.init())
		.pipe($.sass({
			outputStyle: $.util.env.production ? 'compressed' : 'nested',
			includePaths: [ 'node_modules/' ]
		}).on('error', $.sass.logError))
		.pipe($.autoprefixer())
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(paths.dest.styles));
});

gulp.task('images', () => {
	return gulp.src(paths.images)
		.pipe($.plumber())
		.pipe($.newer(paths.dest.images))
		.pipe($.util.env.production ? $.imagemin({
			optimizationLevel: 5,
			progressive: true,
			interlaced: true
		}) : $.util.noop())
		.pipe(gulp.dest(paths.dest.images));
});

gulp.task('extras', () => {
	return gulp.src(paths.extras, { base: 'src' })
		.pipe($.newer(paths.dest.extras))
		.pipe(gulp.dest(paths.dest.extras));
});

gulp.task('clean',  () => {
	return del([paths.dest.extras]);
});

gulp.task('serve', ['watch'],  () => {
	browserSync({
		files: ['dist/**', '!dist/**/*.map'],
		server: {
			baseDir: ['dist', './']
		},
		open: !$.util.env.no
	});
});

gulp.task('watch', ['html', 'scripts', 'styles', 'images', 'fonts', 'extras'], () => {
	gulp.watch(paths.html, ['html']);
	gulp.watch(paths.scripts, ['scripts']);
	gulp.watch(paths.styles, ['styles']);
	gulp.watch(paths.images, ['images']);
	gulp.watch(paths.fonts, ['fonts']);
	gulp.watch(paths.extras, ['extras']);
});

gulp.task('default', ['clean'], () => {
	gulp.start('serve');
});

gulp.task('deploy', ['clean'], () => {
	$.util.env.production = true;
	gulp.start(['html', 'scripts', 'styles', 'images', 'fonts', 'extras']);
});