const path = require("path");
const webpack = require("webpack");

module.exports = {
  context: path.resolve(__dirname, "src"),
  mode: "development",
  entry: {
    main: ["./js/main.js"],
  },
  output: {
    path: path.resolve(__dirname, "dist/js"),
    filename: "[name].bundle.js",
  },
  // externals: {
  // 	jquery: 'jQuery'
  // },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    }),
  ],
  devtool: "source-map",
  watch: true,
};
