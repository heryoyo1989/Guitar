const express = require('express');
const webpack = require('webpack');
const fs = require('fs');
const imageType = require('image-type')
// const imageType = require('image-type');
const webpackDevMiddleware = require('webpack-dev-middleware');

const app = express();
const config = require('./webpack.config.js');
const compiler = webpack(config);

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
);

// Serve the files on port 3000.
app.listen(3000, function () {
  console.log('Example app listening on port 3000!\n');
});

app.get('/singers', async(req, res) => {
    const parentDir = '../../../Music/吉他谱';
    const folderNames = fs.readdirSync('../../../Music/吉他谱');
    res.json({ 
        singers: folderNames.filter(f => f !== '.DS_Store'),
        dir: parentDir 
    })
})

app.get('/songs/:name', async(req, res) => {
    const dir = `../../../Music/吉他谱/${req.params.name}`;
    const songs = fs.readdirSync(dir);
    res.json({ songs })
})

app.get('/songs/:name/:image', async(req, res) => {
    const imageDir = `../../../Music/吉他谱/${req.params.name}/${req.params.image}`;
    const contents = fs.readFileSync(imageDir);
    const b64 = contents.toString('base64')
    const type = imageType(contents);
    const src = `data:${type.mime};base64,${b64}`;
    res.send({ src })
})