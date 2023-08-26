import React, { useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
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
    const [names, setNames] = useState([]);
    const [selectedSinger, setSelectedSinger] = useState(-1);
    const [singer, setSinger] = useState('');
    const [selectedSong, setSelectedSong] = useState(-1);
    const [songs, setSongs] = useState([]);
    const [imageSources, SetImageSources] = useState([]);
    const imageListRef = useRef();
    const [videoLink, setVideoLink] = useState('');

    useEffect(() => {
        fetch('/singers')
            .then(res => res.json())
            .then(data => {
                setNames(data.singers);
            })
    })
    

    const handleGetSongs = async (name, index) => {
        setSinger(name);
        if(index !== selectedSinger) {
            setSelectedSinger(index);
            setSelectedSong(-1);
        }
        const data = await fetch(`/songs/${name}`).then(res => res.json());
        console.log(data);
        setSongs(data.songs);
    }

    const handleGetImage = async (song, index) => {
        setSelectedSong(index); 
        if(timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        imageListRef.current.scrollTo(0, 0);
        const data = await fetch(`/songs/${singer}/${song}`).then(res => res.json());
        SetImageSources(data.imageSources);

        const videoData = await fetch(`/youtube/${singer.indexOf('.') >= 0 ? 'null' : singer}/${song}`).then(res => res.json());
        console.log('video data', videoData);
        setVideoLink(videoData.embedLink);
    }

    const handleScan = () => {
        fetch('/scan').then(res => res.json()).then(data => console.log(data))
    }

    const timerRef = useRef(null);

    const handleAutoScroll = () => {
        const imageList = imageListRef.current;

        if(imageList) {
            let y = 0; // TODO: get current scroll location
            timerRef.current = setInterval(() => imageList.scrollTo(0, y++), 100);
        }
    }

    const handleStopScroll = () => {
        if(timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
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
            </div>
            <div className="Container">
                <div className="Singers_List">
                    {
                        names.map(
                            (name, index) => 
                                <Button
                                    variant={index === selectedSinger ? 'contained' : 'text'}
                                    onClick={() => handleGetSongs(name, index)}
                                >
                                    {name}
                                </Button>
                        )
                    }
                </div>
                <div className="Songs_List">
                    {
                        songs.map(
                            (song, index) => 
                                <Button
                                    variant={index === selectedSong ? 'contained' : 'text'}
                                    color='song'
                                    onClick={() => handleGetImage(song, index)}
                                    sx={{
                                        justifyContent: 'left',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '100%'
                                    }}
                                >
                                    {song}
                                </Button>
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
                        >
                        </iframe>
                    }
                </div>
            </div>
        </ThemeProvider>
    )
}

export default ChordsChart;

// ?si=D8fDAN9sKzuENma7