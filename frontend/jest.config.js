var path = require('path');
module.exports = {
    "bail": true,
    "verbose": true,
    "moduleDirectories": [
      "node_modules",
      "src"
    ],
    "moduleFileExtensions": [
      "js"
  ],
  "moduleNameMapper": {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
      "\\.(css|less|scss)$": "identity-obj-proxy",
        "^models/(.*)" :  path.resolve(__dirname, 'src/client/app/models/$1'),
        "^scenes/(.*)" :  path.resolve(__dirname, 'src/client/app/scenes/$1'),
        "^apps/(.*)" :  path.resolve(__dirname, 'src/client/app/scenes/Apps/$1'),
        "^components/(.*)" :  path.resolve(__dirname, 'src/client/app/components/$1'),
        "^lib/(.*)" :  path.resolve(__dirname, 'src/client/app/lib/$1'),
        "^services/(.*)" :  path.resolve(__dirname, 'src/client/app/services/$1'),
        "^constants/(.*)" :  path.resolve(__dirname, 'src/client/app/constants/$1'),
    },
    "transformIgnorePatterns" :[
        "/node_modules/(?!MODULE_NAME_HERE).+\\.js$"
    ],

}
