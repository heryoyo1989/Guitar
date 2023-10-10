import React, { useEffect, useRef, useState } from "react";
import { Button, ListItemButton, ListItemText, TextField } from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import './Main.css';

const theme = createTheme({
    palette: {
      song: {
        main: '#cf84f0',
        contrastText: '#47008F',
      },
      navi: {
        main: '#eeeaea',
      }
    },
  });

const ChordsChart = () => {
    const [folderNames, setFolderNames] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(-1);

    const [songs, setSongs] = useState([]);
    const [selectedSong, setSelectedSong] = useState(-1);
    
    const [currentSinger, setCurrentSinger] = useState('');
    const [currentVideoId, setCurrentVideoId] = useState('');
    const [imageSources, SetImageSources] = useState([]);
    const [videoLink, setVideoLink] = useState('');

    const imageListRef = useRef();
    const timerRef = useRef(null);

    const [showFavs, setShowFavs] = useState(false);

    useEffect(() => {
        fetch('/singers')
            .then(res => res.json())
            .then(data => {
                setFolderNames(data.singers);
            })
    })

    const handleGetFavs = async () => {
        const data = await fetch('favourites').then(res => res.json());
        setShowFavs(true);
        setSelectedFolder(-1);
        setSelectedSong(-1);
        setSongs(data.favourites);
    }
    
    const handleGetSongs = async (name, index) => {
        if(index !== selectedFolder) {
            setSelectedFolder(index);
            setShowFavs(false);
            setSelectedSong(-1);
        }
        const data = await fetch(`/songs/${name}`).then(res => res.json());
        console.log(data);
        setSongs(data.songs);
    }

    const handleGetImage = async (song, folder, index) => {
        setSelectedSong(index); 
        if(timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        imageListRef.current.scrollTo(0, 0);

        console.log("Folder is ", folder);
        const data = await fetch(`/songs/${folder}/${song}`).then(res => res.json());
        SetImageSources(data.imageSources);

        const videoData = await fetch(`/youtube/${folder}/${song}`).then(res => res.json());
        console.log('video data', videoData);
        setVideoLink(videoData.embedLink);
        setCurrentVideoId(videoData.videoId);
        setCurrentSinger(videoData.singer);
    }

    const handleScan = () => {
        fetch('/scan').then(res => res.json()).then(data => console.log(data))

    }

    const handleAutoScroll = () => {
        const imageList = imageListRef.current;

        if(imageList) {
            let y = imageList.scrollTop; // TODO: get current scroll location
            timerRef.current = setInterval(() => imageList.scrollTo(0, y++), 100);
        }
    }

    const handleStopScroll = () => {
        if(timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }

    const handleFavourite = async (index) => {
        const song = songs[index];

        if(song.favourite && song.favourite === true) {
            song.favourite = false;
            await fetch(`/unfavourite/${song.folder}/${song.song}`)
        } else {
            song.favourite = true;
            await fetch(`/favourite/${song.folder}/${song.song}`)
        }
    }

    const handleRandomPick = async () => {
        //await fetch('/random');
        const folderIndex = Math.floor(Math.random() * folderNames.length);
        setSelectedFolder(folderIndex);
        const randomFolder = folderNames[folderIndex];

        const data = await fetch(`/songs/${randomFolder}`).then(res => res.json());
        const songIndex = Math.floor(Math.random() * data.songs.length);
        // setSelectedSong(songIndex);
        setSongs(data.songs);
    
        const song = data.songs[songIndex];

        handleGetImage(song.song, randomFolder, songIndex);
    }

    const handleEnterInput = async e => {
        if(e.key === "Enter") {
            const singer = e.target.value;
            const folder = folderNames[selectedFolder]
            const song = songs[selectedSong];

            const info = await fetch(`/update/${folder}/${song.song}/${singer}`).then(res => res.json());
            console.log(info);
            setCurrentSinger(info.singer);
            setVideoLink(info.embedLink);
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <div className="Navi_Bar"> 
                <Button 
                    variant="text"
                    size="small"
                    color="navi"
                    onClick={handleScan}
                >
                    SCAN
                </Button>
                <Button 
                    variant="text"
                    size="small"
                    color="navi"
                    onClick={handleAutoScroll}
                >
                    AutoScroll
                </Button>
                <Button 
                    variant="text"
                    size="small"
                    color="navi"
                    onClick={handleStopScroll}
                >
                    StopScroll
                </Button>
                <Button 
                    variant="text"
                    size="small"
                    color="navi"
                    onClick={handleRandomPick}
                >
                    Random
                </Button>
            </div>
            <div className="Container">
                <div className="Singers_List">
                     <Button
                        variant={showFavs ? 'contained' : 'text'}
                        onClick={handleGetFavs}
                    >
                        {"Favourites"}
                    </Button>
                    {
                        folderNames.map(
                            (folder, index) => 
                                <Button
                                    variant={index === selectedFolder ? 'contained' : 'text'}
                                    onClick={() => handleGetSongs(folder, index)}
                                >
                                    {folder}
                                </Button>
                        )
                    }
                </div>
                <div className="Songs_List">
                    {
                        songs.map(
                            (song, index) => 
                                <div className="Song_Button">
                                    <Button
                                        variant={index === selectedSong ? 'contained' : 'text'}
                                        color='song'
                                        onClick={() => handleGetImage(song.song, song.folder, index)}
                                        sx={{
                                            justifyContent: 'left',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%'
                                        }}
                                    >
                                        {song.song}
                                    </Button>
                                    <div
                                        onClick={() => handleFavourite(index)}
                                    >
                                        {
                                            song.favourite === true ? 
                                                <FavoriteIcon
                                                    fontSize="small"
                                                    color="secondary"
                                                /> 
                                                : 
                                                <FavoriteBorderIcon 
                                                    fontSize="small"
                                                    color="primary"
                                                />
                                        }
                                    </div>
                                </div>
                        )
                    }
                </div>
                <div className="Image_List" ref={imageListRef}>
                    {
                        imageSources.map(
                            src => 
                                <img className="Image" src ={src}/>
                        )
                    }
                </div>
                <div className="Youtube_Container">
                    {
                        <iframe 
                            width="560" 
                            height="315" 
                            src={videoLink}
                            title="YouTube video player" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowfullscreen
                            sx={{ marginBottom: '10px' }}
                        >
                        </iframe>
                    }
                    { 
                        currentSinger && <TextField 
                            id="standard-basic" 
                            label="Change Singer" 
                            variant="standard"
                            onKeyDown={handleEnterInput}
                        />
                    }
                </div>
            </div>
        </ThemeProvider>
    )
}

export default ChordsChart;

// ?si=D8fDAN9sKzuENma7