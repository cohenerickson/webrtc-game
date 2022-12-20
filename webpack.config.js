const path = require("path");

module.exports = {
  entry: "./src/client/index.ts",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle.js",
    clean: true
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "public")
    },
    compress: true,
    port: 3000,
    proxy: {
      "/peerjs/peerjs/id": {
        target: "http://localhost:8080",
        changeOrigin: true
      },
      "/peerjs": {
        target: "ws://localhost:8080",
        changeOrigin: true,
        ws: true
      }
    }
  }
};
