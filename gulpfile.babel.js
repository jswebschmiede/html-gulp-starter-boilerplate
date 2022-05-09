// imports
import { dest, lastRun, parallel, series, src, watch } from "gulp";
import del from "del";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import autoprefixer from "autoprefixer";
import sourcemaps from "gulp-sourcemaps";
import postcss from "gulp-postcss";
import concat from "gulp-concat";
import terser from "gulp-terser";
import babel from "gulp-babel";
import server from "gulp-webserver";
import cssnano from "cssnano";
import tailwindcss from "tailwindcss";
import browserSync from "browser-sync";
import squoosh from "gulp-libsquoosh";
import fileinclude from "gulp-file-include";
// import rev from "gulp-rev";

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
  imgPath: {
    src: "src/img/**/*.{jpg,jpeg,png,svg}",
    dest: "dist/img",
  },
};

// Browsersync to spin up a local server
const browserSyncServe = (cb) => {
  // initializes browsersync server
  browserSync.init({
    server: {
      baseDir: "./dist",
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
    .pipe(postcss([autoprefixer(), cssnano(), tailwindcss()]))
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

// moveHtmlToDist Task
const moveHtmlToDist = () => {
//   return src(["src/*.html"]).pipe(dest("dist"));
  return src(["src/*.html"])
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(dest("dist"));
};

// moveWebfontsToDist Task
const moveWebfontsToDist = () => {
  return src(["src/webfonts/**"]).pipe(dest("dist/webfonts"));
};

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS files for changes, run scss and js tasks simultaneously and update browsersync
const bsWatchTask = () => {
  watch("src/*.html", browserSyncReload);
  watch(
    [files.scssPath.src, files.jsPath.src],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(
      parallel(scssTask, jsTask),
      moveHtmlToDist,
      moveWebfontsToDist,
      browserSyncReload
    )
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

// Images Task
const imagesTask = () => {
  return src(files.imgPath.src, { since: lastRun(imagesTask) })
    .pipe(squoosh())
    .pipe(dest(files.imgPath.dest));
};

// Clean dist task
const cleanDist = () => {
  return del(["dist/**/*"]);
};

// Watch Task
const watchTask = () => {
  watch([files.scssPath.src, files.jsPath.src], parallel(scssTask, jsTask));
};

// Default Task
exports.default = series(
  cleanDist,
  parallel(scssTask, jsTask),
  moveHtmlToDist,
  moveWebfontsToDist,
  imagesTask,
  webserverTask,
  watchTask
);

// Browsersync Task
exports.bs = series(
  cleanDist,
  parallel(scssTask, jsTask),
  moveHtmlToDist,
  moveWebfontsToDist,
  imagesTask,
  browserSyncServe,
  bsWatchTask
);

exports.clean = series(cleanDist);
