const { src, dest, parallel, series, watch } = require('gulp'),
  nunjucks = require('gulp-nunjucks'),
  data = require('gulp-data'),
  browserSync = require('browser-sync'),
  fs = require('fs'),
  path = require('path'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  del = require('del'),
  sourcemaps = require('gulp-sourcemaps'),
  changed = require('gulp-changed'),
  groupMediaQueries = require('gulp-group-css-media-queries'),
  webpcss = require('gulp-webpcss'),
  cleancss = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify-es').default,
  include = require('gulp-include'),
  newer = require('gulp-newer'),
  webp = require('gulp-webp'),
  imagemin = require('gulp-imagemin');

const paths = {
  build: {
    nunjucks: 'build/',
    js: 'build/js/',
    css: 'build/css/',
    img: 'build/img/',
    fonts: 'build/fonts/',
  },
  src: {
    nunjucks: 'templates/*.njk',
    css: 'static/scss/*.scss',
    data: 'static/data/',
    js: 'static/js/*.js',
    img: 'static/img/**/*.*',
    fonts: 'static/fonts/**/*.*',
  },
  watch: {
    nunjucks: 'templates/**/*.njk',
    data: 'static/data/*.njk.json',
    js: 'static/js/**/*.js',
    css: 'static/scss/**/*.scss',
    img: 'static/img/**/*.*',
    fonts: 'static/fonts/**/*.*',
  },
  clean: './build',
};

const nunjucksTask = () => {
  return src(paths.src.nunjucks)
    .pipe(changed(paths.src.nunjucks))
    .pipe(
      data((file) => {
        return JSON.parse(
          fs.readFileSync(`${paths.src.data}${path.basename(file.path)}.json`)
        );
      })
    )
    .pipe(nunjucks.compile())
    .pipe(dest(paths.build.nunjucks));
};

const css = () => {
  return src(paths.src.css)
    .pipe(changed(paths.build.css))
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 4 versions'],
        grid: true,
      })
    )
    .pipe(groupMediaQueries())
    .pipe(webpcss())
    .pipe(dest(paths.build.css))
    .pipe(cleancss({ level: { 1: { specialComments: 0 } } }))
    .pipe(sourcemaps.write())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(dest(paths.build.css))
    .pipe(browserSync.stream());
};

const js = () => {
  return src(paths.src.js)
    .pipe(changed(paths.src.js))
    .pipe(sourcemaps.init())
    .pipe(include())
    .pipe(dest(paths.build.js))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest(paths.build.js))
    .pipe(browserSync.stream());
};

const img = () => {
  return src(paths.src.img)
    .pipe(changed(paths.build.img))
    .pipe(newer(paths.src.img))
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(dest(paths.build.img))
    .pipe(src(paths.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3,
      })
    )
    .pipe(dest(paths.build.img))
    .pipe(browserSync.stream());
};

const dataTask = () => {
  return nunjucksTask();
};

const cleandist = () => {
  return del(paths.clean);
};

function browsersync() {
  browserSync.init({
    server: {
      baseDir: 'build/',
    },
    startPath: 'index.html',
    notify: false,
  });
}

function startwatch() {
  watch(paths.watch.nunjucks, nunjucksTask).on('change', browserSync.reload);
  watch(paths.watch.css, css).on('change', browserSync.reload);
  watch(paths.watch.js, js).on('change', browserSync.reload);
  watch(paths.watch.data, dataTask).on('change', browserSync.reload);
  watch(paths.watch.img, img).on('change', browserSync.reload)
  // watch('src/**/fonts/**/*', fonts)
}

exports.default = series(
  cleandist,
  parallel(
    browsersync,
    nunjucksTask,
    img,
    // fonts,
    css,
    js,
    startwatch
  )
);
