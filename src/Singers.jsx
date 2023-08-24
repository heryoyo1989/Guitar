import React, { useState } from "react";
import { Button } from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './Singers.css';

const theme = createTheme({
    palette: {
      song: {
        main: '#cf84f0',
        contrastText: '#47008F',
      },
    },
  });

const Singers = () => {
    const [names, setNames] = useState([]);
    const [selectedSinger, setSelectedSinger] = useState(-1);
    const [singer, setSinger] = useState('');
    const [selectedSong, setSelectedSong] = useState(-1);
    const [songs, setSongs] = useState([]);
    const [imageSources, SetImageSources] = useState([]);

    fetch('/singers')
        .then(res => res.json())
        .then(data => {
            setNames(data.singers);
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
        // .then(res => res.json())
    }

    const handleGetImage = async (song, index) => {
        setSelectedSong(index);
        const data = await fetch(`/songs/${singer}/${song}`).then(res => res.json());
        // const src = 'data:image/jpeg;base64,' + data.data.data.toString('base64');
        // SetImage(data.data);
        // SetImage(data.imageDir);
        // SetImage('file://Music/吉他谱/周杰伦/七里香1.png')
        console.log('dir', data);
        SetImageSources(data.imageSources);
    }

    // <div onClick={() => handleGetSongs(name)}>{name}</div>

    return (
        <ThemeProvider theme={theme}>
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
                
                <div className="Image_List">
                    {
                        imageSources.map(
                            src => 
                                <img className="Image" src ={src}/>
                        )
                    }
                </div>
            </div>
        </ThemeProvider>
    )
}

export default Singers;