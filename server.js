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

app.get('/addFolder', async(req, res) => {
    await client.connect();

    const musicDB = client.db("Music");
    const songsCollection = musicDB.collection("Songs");

    const items = await songsCollection.find({ folder: 'null' }).toArray();
    // console.log(items);

    // await songsCollection.deleteMany({ folder: 'null'})

    /* items.forEach(async item => {
        const videoId = item.videoId;

        await songsCollection.updateOne(
            { song: item.song, folder: { $ne: 'null' } },
            { $set: { videoId }}
        )
    }) */
    
    /* items.forEach(async item => {
        if(item.folder[1] === '.') {
            await songsCollection.updateOne(
                { 
                    song: item.song, 
                    folder: item.folder
                }, 
                { $set: { singer: "" }}
            )
        }
    }) */

    // await songsCollection.updateMany({ singer: ''}, { $set: { singer: 'null' }});
})

app.get('/scan', async(req, res) => {
    await client.connect();

    const musicDB = client.db("Music");
    const singers = musicDB.collection("Singers");
    const songsCollection = musicDB.collection("Songs");
    const folderNames = fs.readdirSync(PARENT_DIR).filter(f => f !== '.DS_Store');

    // TODO: Delete the node that is not in folderNames

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

app.get('/songs/:folder', async(req, res) => {
    // const dir = `${PARENT_DIR}/${req.params.folder}`;
    // const files = fs.readdirSync(dir).filter(f => f !== '.DS_Store');
    // const songNames = getSongNames(files);

    // TODO: Get favorite from DB
    await client.connect();
    const musicDB = client.db("Music");
    const songs = await musicDB.collection("Songs").find({ folder: req.params.folder }).toArray();
    // console.log("songs", songs);

    res.json({ songs })
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

app.get('/youtube/:folder/:song', async(req, res) => {
    const folder = req.params.folder;
    const singer = folder.indexOf('.') >= 0 ? 'null' : folder;
    const song = req.params.song;

    await client.connect();
    const musicDB = client.db("Music");
    const songs = musicDB.collection("Songs");
    const songObject = await songs.findOne({ folder, song });

    if(songObject && songObject.videoId) {
        const videoId = songObject.videoId;
        const embedLink = `https://www.youtube.com/embed/${videoId}`;
        res.send({ embedLink, singer, videoId })
    } else {
        const search_query =`${songObject.singer === 'null'? '歌曲 ' : singer + ' '}${song}`;

        const response = await youtube.search.list({
            part: "snippet",
            q: search_query,
        });

        // console.log(response);
        // console.log(response.data.items);

        const videos = response.data.items;
            
        if(videos.length > 0) {
            const videoId = videos[0].id.videoId;

            if(songObject) {
                await songs.updateOne({ singer, song, folder }, { $set: { videoId }});
            } else {
                await songs.insertOne({ singer, song, folder, videoId });

                // TODO: insert to the singer list
            }
            const embedLink = `https://www.youtube.com/embed/${videoId}`;
            res.send({ embedLink, singer, videoId })
        }
    }
})

app.get('/mongo', async(req, res) => {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const musicDB = client.db("Music");
    const singers = musicDB.collection("Singers");
    await singers.insertOne({
        name: '孙燕姿' + Math.random()
    });
})

app.get('/favourite/:folder/:song', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    // console.log(req.params.folder + " : " + req.params.song);

    await songs.updateOne(
        { folder: req.params.folder, song: req.params.song },
        { $set: { favourite: true }}
    )
})

app.get('/unfavourite/:folder/:song', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    // console.log("unfavourite", req.params.folder + " : " + req.params.song);

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
    // console.log("Favs", favourites);

    res.json({ favourites })
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