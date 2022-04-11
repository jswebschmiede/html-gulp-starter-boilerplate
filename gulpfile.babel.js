// imports
import { dest, parallel, series, src, watch } from "gulp";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import autoprefixer from "autoprefixer";
import sourcemaps from "gulp-sourcemaps";
import postcss from "gulp-postcss";
import replace from "gulp-replace";
import concat from "gulp-concat";
import terser from "gulp-terser";
import babel from "gulp-babel";
import server from "gulp-webserver";
import cssnano from "cssnano";
import browserSync from "browser-sync";

// File path variables etc.
const dev_url = "yourlocal.dev";
const sass = gulpSass(dartSass);
const files = {
  scssPath: {
    src: "src/scss/**/*.scss",
    dest: "dist/css",
  },
  jsPath: {
    src: "src/js/**/*.js",
    dest: "dist/js",
  },
};

// Browsersync to spin up a local server
const browserSyncServe = (cb) => {
  // initializes browsersync server
  browserSync.init({
    server: {
      baseDir: "./src",
      // proxy: dev_url,
    },
    notify: {
      styles: {
        top: "auto",
        bottom: "0",
      },
    },
  });
  cb();
};
const browserSyncReload = (cb) => {
  // reloads browsersync server
  browserSync.reload();
  cb();
};

// Sass Task
const scssTask = () => {
  return src(files.scssPath.src)
    .pipe(sourcemaps.init())
    .pipe(sass({ includePaths: ["./node_modules"] }).on("error", sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write("."))
    .pipe(dest(files.scssPath.dest));
};

// JS Task
const jsTask = () => {
  return src(files.jsPath.src)
    .pipe(sourcemaps.init())
    .pipe(concat("main.bundle.js"))
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(terser())
    .pipe(sourcemaps.write("."))
    .pipe(dest(files.jsPath.dest));
};

// Cashbusting Task
const cashbustTask = () => {
  const cbString = new Date().getTime();
  return src(["src/index.html"])
    .pipe(replace(/cb=\d+/g, "cb=" + cbString))
    .pipe(dest("dist"));
};

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS files for changes, run scss and js tasks simultaneously and update browsersync
const bsWatchTask = () => {
  watch("src/index.html", browserSyncReload);
  watch(
    [files.scssPath.src, files.jsPath.src],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(parallel(scssTask, jsTask), cashbustTask, browserSyncReload)
  );
};

// Webserver Task (default)
const webserverTask = () => {
  return src("dist").pipe(
    server({
      livereload: true,
      open: true,
      port: 3030,
      filter: function (fileName) {
        // exclude all source maps from livereload
        if (fileName.match(/.map$/)) {
          return false;
        } else {
          return true;
        }
      },
    })
  );
};

// Watch Task
const watchTask = () => {
  watch([files.scssPath.src, files.jsPath.src], parallel(scssTask, jsTask));
};

// Default Task
exports.default = series(
  parallel(scssTask, jsTask),
  cashbustTask,
  webserverTask,
  watchTask
);

exports.bs = series(
  parallel(scssTask, jsTask),
  cashbustTask,
  browserSyncServe,
  bsWatchTask
);
