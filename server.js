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

    folderNames.forEach(async folder => {
        const singer = folder.indexOf('.') >= 0 ? 'null' : folder;
        const node = await singers.findOne({ folder });

        const dir = `${PARENT_DIR}/${folder}`;
        const songs = fs.readdirSync(dir).filter(f => f !== '.DS_Store');
        const songNames = getSongNames(songs);

        if (!node) {
            await singers.insertOne({ singer, songs: songNames });  
        } else {
            await singers.updateOne(
                { singer }, 
                { $set: { songs: songNames }}
            )
        }

        songNames.forEach(async song => {
            const existSong = await songsCollection.findOne({ song, folder })

            if(!existSong) {
                await songsCollection.insertOne({ singer, song, folder, videoId: '' })
            }
        })

        songsCollection.deleteMany({ 
            $and: [
                { folder: { $eq: folder }}, 
                { song: { $nin: songNames }}
            ] 
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

app.get('/songs/:folder', async(req, res) => {
    // const dir = `${PARENT_DIR}/${req.params.folder}`;
    // const files = fs.readdirSync(dir).filter(f => f !== '.DS_Store');
    // const songNames = getSongNames(files);
    // TODO: Get favorite from DB

    client
        .connect()
        .then(async() => {
            const musicDB = client.db("Music");
            const songs = await musicDB.collection("Songs").find({ folder: req.params.folder }).toArray();
            res.json({ songs: songs.sort((a, b) => a.song.charCodeAt(0)- b.song.charCodeAt(0)) })
        })
        .catch(e => console.log("-- Not Connected Error is :", e));
})

app.get('/songs/:folder/:song', async(req, res) => {
    const singerDir = `${PARENT_DIR}/${req.params.folder}`;
    const songs = fs.readdirSync(singerDir);
    const images = songs.filter(song => song.indexOf(req.params.song) >= 0);
    const imageSources = [];

    images.forEach(image => {
        const imageDir = `${PARENT_DIR}/${req.params.folder}/${image}`;
        const contents = fs.readFileSync(imageDir);
        const b64 = contents.toString('base64')
        const type = imageType(contents);
        const src = `data:${type.mime};base64,${b64}`;
        imageSources.push(src);
    })

    res.send({ imageSources })
})

const uri2 = "mongodb+srv://heryoyo1989:3325NovaTrail@music.xtdnqmc.mongodb.net/?retryWrites=true&w=majority"

const mongoose = require('mongoose');

async function connectMongo() {
    const result = await mongoose.connect(uri2, {
        serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
        }
    })

    const connection = mongoose.connection;
    const musicDB = connection.useDb('Music');
    const post = await musicDB.collection('Songs').findOne({});
    console.log(post)
}

connectMongo();


app.get('/youtube/:folder/:song', async(req, res) => {
    const folder = req.params.folder;
    const singer = folder.indexOf('.') >= 0 ? 'null' : folder;
    const song = req.params.song;

    // TODO: Try to use mongoose
    // await client.connect();
    // const musicDB = client.db("Music");
    // const songs = musicDB.collection("Songs");
    // const songObject = await songs.findOne({ folder, song });
    
    // use mongoose
    const songs = mongoose.connection.useDb('Music').collection('Songs');
    const songObject = await songs.findOne({ folder, song });
    // console.log("Song Found", songObject);

    if(songObject && songObject.videoId) {
        const videoId = songObject.videoId;
        const embedLink = `https://www.youtube.com/embed/${videoId}`;
        client.close();
        res.send({ embedLink, singer, videoId })
    } else {
        const search_query =`${songObject && songObject.singer === 'null'? '歌曲 ' : singer + ' '}${song}`;

        const response = await youtube.search.list({
            part: "snippet",
            q: search_query,
        });

        const videos = response.data.items;
            
        if(videos.length > 0) {
            const videoId = videos[0].id.videoId;

            if(songObject) {
                await songs.updateOne({ singer, song, folder }, { $set: { videoId }});
            } else {
                await songs.insertOne({ singer, song, folder, videoId });
            }
            const embedLink = `https://www.youtube.com/embed/${videoId}`;
            client.close();
            res.send({ embedLink, singer, videoId })
        }
    }
})

app.get('/favourite/:folder/:song', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    await songs.updateOne(
        { folder: req.params.folder, song: req.params.song },
        { $set: { favourite: true }}
    )
})

app.get('/unfavourite/:folder/:song', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    await songs.updateOne(
        { folder: req.params.folder, song: req.params.song },
        { $set: { favourite: false }}
    )

})

app.get('/favourites', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    const favourites = await songs.find({ favourite: true }).toArray();
    res.json({ favourites });
})

app.get('/update/:folder/:song/:singer', async(req, res) => {
    // update singer
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    const folder = req.params.folder;
    const song = req.params.song;
    const singer = req.params.singer;

    console.log(req.params);
    await songs.updateOne({ folder, song }, { $set: { singer }});
    // get new videoId

    const search_query =`${singer} ${song}`;

    const response = await youtube.search.list({
        part: "snippet",
        q: search_query,
    });

    const videos = response.data.items;
        
    if(videos.length > 0) {
        console.log(videos[0]);
        const videoId = videos[0].id.videoId;
        const embedLink = `https://www.youtube.com/embed/${videoId}`;

        await songs.updateOne({ folder, song }, { $set: { videoId }});

        res.json({ singer, videoId, embedLink })
    }
})

app.get('/random', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    const randomSongs = await songs.aggregate([{ $sample: { size: 1}}]).toArray();

    res.json({ randomSongs })
})