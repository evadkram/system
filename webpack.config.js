module.exports = {
  entry: './js/index.js',
  output: {
    path: __dirname,
    filename: 'js/system.dist.js'
  },
  module: {
    loaders: [{ 
      test: /.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader' 
    }]
  }
};
