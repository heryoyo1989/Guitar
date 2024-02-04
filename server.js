const express = require('express');
const webpack = require('webpack');
const fs = require('fs');
const webpackDevMiddleware = require('webpack-dev-middleware');
const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose');
const { google } = require("googleapis");
const imageType = require('image-type')
const config = require('./webpack.config.js');
const compiler = webpack(config);
const { getRank } = require('./singer_compare.js');

// CONSTS
const PARENT_DIR = '../../../Music/吉他谱';
const uri = "mongodb+srv://heryoyo1989:3325NovaTrail@music.xtdnqmc.mongodb.net/?retryWrites=true&w=majority"
const uri2 = "mongodb+srv://heryoyo1989:3325NovaTrail@music.xtdnqmc.mongodb.net/?retryWrites=true&w=majority"
const google_storage_url="https://firebasestorage.googleapis.com/v0/b/guitar-397101.appspot.com/o";
const google_storage_url2 = "https://storage.googleapis.com/storage/v1/b/guitar-397101.appspot.com/o"
// 4/0AfJohXkbCUWEfY95FuYd62rP95JA3nmdx9iIuyl3sSwSJddAXmx7S2JZSkY1aoX4PLyy9A

// Manogo
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

// Youtube Search
const youtube = google.youtube({
  version: "v3",
  auth: "AIzaSyDLD_y8manfmNf7bvQO4wAjzg5eWUZCj3k",
  //auth: "AIzaSyAXxCWSOi1NYnlAO59Wn34OE9BFhm-5yqc",
});

async function connectMongo() {
    const result = await mongoose.connect(uri2, {
        serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
        }
    })
}

connectMongo();

// Express
const app = express();

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

app.get('/scan', async(req, res) => {
    await client.connect();

    const musicDB = client.db("Music");
    const folders = musicDB.collection("Folders");
    const singers = musicDB.collection('Singers');
    const songsCollection = musicDB.collection("Songs");
    const folderNames = fs.readdirSync(PARENT_DIR).filter(f => f !== '.DS_Store');

    folderNames.forEach(async folder => {
        const singer = folder.indexOf('- ') >= 0 ? 'null' : folder;
        const node = await folders.findOne({ folder });
        const singer_node = await singers.findOne({ singer });        
       
        const dir = `${PARENT_DIR}/${folder}`;
        const songs = fs.readdirSync(dir).filter(f => f !== '.DS_Store');
        const songNames = getSongNames(songs);

        if(singer !== 'null' && !singer_node) {
            await singers.insertOne({ singer, style: '', songs: songNames})
        }

        if (!node) {
            await folders.insertOne({ folder, singer, songs: songNames });  
        } else {
            await folders.updateOne(
                { folder, singer }, 
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

    async function listFiles() {
        // Lists files in the bucket
        const [files] = await storage.bucket("guitar-397101.appspot.com").getFiles();

        console.log('Files:');
        files.forEach(file => {
            console.log(file.name);
        });
    }

    listFiles().catch(console.error);
})

app.get('/folders', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const foldersDB = musicDB.collection('Folders');
    const folders = await foldersDB.find({}).toArray();    
    const topSet = new Set(folders.filter(f => f.atTop).map(f => f.folder)); 
    const folderNames = fs.readdirSync(PARENT_DIR);

    const result = folderNames
        .filter(f => f !== '.DS_Store')
        .sort((a, b) => getRank(a, topSet) - getRank(b, topSet))
        .map(name => {
            return {
                name,
                atTop: topSet.has(name),
                type: getRank(name, topSet)
            }
        });
    
    res.json({ 
        folders: result,
        dir: PARENT_DIR 
    })
})

app.get('/put_folder_to_top/:folder', async(req, res) => {
    const folder = req.params.folder;

    await client.connect();
    const musicDB = client.db('Music');
    const foldersDB = musicDB.collection('Folders');

    const folderInfo = await foldersDB.findOne({ folder });
    const isAtTop = folderInfo.atTop;
    await foldersDB.updateOne(
        { folder }, 
        { $set: { atTop: isAtTop ? false : true }}
    )

    res.json({
        folder,
        atTop: isAtTop ? false : true
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

app.get('/youtube/:folder/:song', async(req, res) => {
    const folder = req.params.folder;
    const singerFolder = folder.indexOf('-') >= 0 ? 'null' : folder;
    const song = req.params.song;

    // TODO: Try to use mongoose
    // await client.connect();
    // const musicDB = client.db("Music");
    // const songs = musicDB.collection("Songs");
    // const songObject = await songs.findOne({ folder, song });
    
    // use mongoose
    const songs = mongoose.connection.useDb('Music').collection('Songs');
    const singers = mongoose.connection.useDb('Music').collection('Singers');
    const songObject = await songs.findOne({ folder, song });
    const singer = songObject.singer;
    const song_style = songObject.style || '';
    
    let singer_style = '';

    if(singer) {
        const singerObject = await singers.findOne({ singer });
        singer_style = (singerObject && singerObject.style) || '';
    }

    if(songObject && songObject.videoId) {
        const videoId = songObject.videoId;
        const embedLink = `https://www.youtube.com/embed/${videoId}`;
        client.close();
        res.send({ embedLink, singer, videoId, song_style, singer_style })
    } else {
        const search_query =`${songObject && singer === 'null'? '歌曲 ' : singer + ' '}${song}`;

        // TODO: error check?
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
            res.send({ embedLink, singer, videoId, song_style, singer_style })
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

    res.json({ 
        song: req.params.song, 
        folder: req.params.folder
    })
})

app.get('/unfavourite/:folder/:song', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    await songs.updateOne(
        { folder: req.params.folder, song: req.params.song },
        { $set: { favourite: false }}
    )

    res.json({ 
        song: req.params.song, 
        folder: req.params.folder
    })
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

    await songs.updateOne({ folder, song }, { $set: { singer }});

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

app.get('/update_style/:singer/:song/:style', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');
    const singers = musicDB.collection('Singers');

    const song = req.params.song;
    const singer = req.params.singer;
    const style = req.params.style;

    await songs.updateOne({ singer, song }, { $set: { style }});
    await singers.updateOne({ singer }, { $set: { style }});

    res.json({ singer, song, style })
})

app.get('/update_song_style/:song/:style', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    const song = req.params.song;
    const style = req.params.style;

    await songs.updateOne({ song }, { $set: { style }});

    res.json({ song, style})
})

app.get('/random', async(req, res) => {
    await client.connect();
    const musicDB = client.db('Music');
    const songs = musicDB.collection('Songs');

    const randomSongs = await songs.aggregate([{ $sample: { size: 1}}]).toArray();

    res.json({ randomSongs })
})