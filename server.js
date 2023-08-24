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
    const songs = fs.readdirSync(dir).filter(f => f !== '.DS_Store');

    const set = new Set();
    const songNames = [];

    for(const s of songs) {
        const strs = s.split('.');
        let name = '';
        if(strs.length === 1) {
            name = strs[0];
        } else if (strs.length === 2) {
            name = strs[0];
        } else if (strs.length === 3) {
            name = strs[1];
        }

        const lastChar = name[name.length - 1];
        if(lastChar >= '0' && lastChar <= '9') {
            name = name.substring(0, name.length - 1);
        }

        if(!set.has(name)) {
            songNames.push(name);
            set.add(name);
        }
    }

    res.json({ songs: songNames })
})

app.get('/songs/:name/:song', async(req, res) => {
    const singerDir = `../../../Music/吉他谱/${req.params.name}`;
    const songs = fs.readdirSync(singerDir);
    const images = songs.filter(song => song.indexOf(req.params.song) >= 0);
    console.log('images', images);
    const imageSources = []
    images.forEach(image => {
        const imageDir = `../../../Music/吉他谱/${req.params.name}/${image}`;
        const contents = fs.readFileSync(imageDir);
        const b64 = contents.toString('base64')
        const type = imageType(contents);
        const src = `data:${type.mime};base64,${b64}`;
        imageSources.push(src);
    })

    res.send({ imageSources })

/*
    const imageDir = `../../../Music/吉他谱/${req.params.name}/${req.params.song}`;

    const contents = fs.readFileSync(imageDir);
    const b64 = contents.toString('base64')
    const type = imageType(contents);
    const src = `data:${type.mime};base64,${b64}`;

    res.send({ src })
*/
})