const express = require('express');
const webpack = require('webpack');
const imageType = require('image-type')
const webpackDevMiddleware = require('webpack-dev-middleware');

// Webpack
const config = require('./webpack.config.js');
const compiler = webpack(config);

// Express
const app = express();
const fs = require('fs');

// Manogo
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://heryoyo1989:3325NovaTrail@music.xtdnqmc.mongodb.net/?retryWrites=true&w=majority"

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

// Youtube Search
const { google } = require("googleapis");
const youtube = google.youtube({
  version: "v3",
  auth: "AIzaSyAXxCWSOi1NYnlAO59Wn34OE9BFhm-5yqc",
});

const PARENT_DIR = '../../../Music/吉他谱';

const getSongNames = (songs) => {
    const songNames = [];
    const set = new Set();

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

    return songNames;
}

// u6CtymiTOglG7jGK

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

app.get('/scan', async(req, res) => {
    await client.connect();

    const musicDB = client.db("Music");
    const singers = musicDB.collection("Singers");
    const songsCollection = musicDB.collection("Songs");
    const folderNames = fs.readdirSync(PARENT_DIR).filter(f => f !== '.DS_Store');

    folderNames.forEach(async name => {
        const node = await singers.findOne({ name });

        const dir = `${PARENT_DIR}/${name}`;
        const songs = fs.readdirSync(dir).filter(f => f !== '.DS_Store');
        const songNames = getSongNames(songs);

        if (!node) {
            await singers.insertOne({ name, songs: songNames });  
        } else {
            await singers.updateOne(
                { name }, 
                { $set: { songs: songNames }}
            )
        }

        songNames.forEach(async song => {
            const existSong = await songsCollection.findOne({ song, singer: name })

            console.log(name, song, existSong);

            if(!existSong) {
                await songsCollection.insertOne({ song, singer: name, videoId: '' })
            }
        })
    })
})

app.get('/singers', async(req, res) => {
    const folderNames = fs.readdirSync(PARENT_DIR);

    res.json({ 
        singers: folderNames.filter(f => f !== '.DS_Store'),
        dir: PARENT_DIR 
    })
})

app.get('/songs/:name', async(req, res) => {
    const dir = `${PARENT_DIR}/${req.params.name}`;
    const songs = fs.readdirSync(dir).filter(f => f !== '.DS_Store');
    const songNames = getSongNames(songs);

    res.json({ songs: songNames })
})

app.get('/songs/:name/:song', async(req, res) => {
    const singerDir = `${PARENT_DIR}/${req.params.name}`;
    const songs = fs.readdirSync(singerDir);
    const images = songs.filter(song => song.indexOf(req.params.song) >= 0);
    const imageSources = [];

    images.forEach(image => {
        const imageDir = `${PARENT_DIR}/${req.params.name}/${image}`;
        const contents = fs.readFileSync(imageDir);
        const b64 = contents.toString('base64')
        const type = imageType(contents);
        const src = `data:${type.mime};base64,${b64}`;
        imageSources.push(src);
    })

    res.send({ imageSources })
})

/*
app.get('/youtube1/:singer/:song', async(req, res) => {
    const search = new SerpApi.GoogleSearch("0409427f527b9f517012a6556b6e7f2408639958d37602042d5cbc18432c50af");

    const params = {
        engine: "youtube",
        search_query: `${req.params.singer === 'null'? '歌曲 ' : req.params.singer + ' '}${req.params.song}`,
    };

    const callback = function(data) {
        console.log(data);
        const videos = data.video_results;
        
        // inline_videos || data.organic_results.filter(video => video.link.indexOf('youtube') >= 0);

        if(videos.length > 0) {
            const link = videos[0].link;
            const videoId = link.split('?')[1].split('=')[1];
            const embedLink = `https://www.youtube.com/embed/${videoId}`;
            res.send({ embedLink })
        }
        
    };

   search.json(params, callback);
}) 
*/

app.get('/youtube/:singer/:song', async(req, res) => {
    const singer = req.params.singer;
    const song = req.params.song;

    await client.connect();
    const musicDB = client.db("Music");
    const songs = musicDB.collection("Songs");
    const songObject = await songs.findOne({ singer, song });

    if(songObject && songObject.videoId) {
        const videoId = songObject.videoId;
        const embedLink = `https://www.youtube.com/embed/${videoId}`;
        res.send({ embedLink })
    } else {
        const search_query =`${singer === 'null'? '歌曲 ' : singer + ' '}${song}`;

        const response = await youtube.search.list({
            part: "snippet",
            q: search_query,
        });

        console.log(response);
        console.log(response.data.items);

        const videos = response.data.items;
            
        if(videos.length > 0) {
            const videoId = videos[0].id.videoId;
            await songs.updateOne({ singer, song }, { $set: { videoId }});
            const embedLink = `https://www.youtube.com/embed/${videoId}`;
            res.send({ embedLink })
        }
    }
})

app.get('/mongo', async(req, res) => {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const musicDB = client.db("Music");
    const singers = musicDB.collection("Singers");
    await singers.insertOne({
        name: '孙燕姿' + Math.random()
    });
})
