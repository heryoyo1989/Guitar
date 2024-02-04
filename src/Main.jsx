import React, { useEffect, useRef, useState } from "react";
import { 
    Button, 
    IconButton, 
    TextField, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel 
} from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import './Main.css';
import HeroLogo from "./Logo";
import DraggableList from "./DraggableList";
import DL from "./DragList";

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
    const [displaySinger, setDisplaySinger] = useState('');
    const [currentSong, setCurrentSong] = useState('');
    const [imageSources, SetImageSources] = useState([]);
    const [videoLink, setVideoLink] = useState('');
    const [songStyle, setSongStyle] = useState('');
    const [singerStyle, setSingerStyle] = useState('');
    const [showFavs, setShowFavs] = useState(false);

    const imageListRef = useRef();
    const timerRef = useRef(null);

    const fetchFolders = () => {
        console.log("Start fetching....")
        fetch('/folders')
            .then(res => res.json())
            .then(data => {
                console.log('data fetched', data)
                setFolderNames(
                    data.folders
                )
            }) 
    }

    useEffect(() => {
        if(folderNames.length === 0) {
           fetchFolders();
        }
    }, [folderNames])

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

    const handleRandomPick = async () => {
        const folderIndex = Math.floor(Math.random() * folderNames.length);
        setSelectedFolder(folderIndex);
        const randomFolder = folderNames[folderIndex];
        const data = await fetch(`/songs/${randomFolder}`).then(res => res.json());

        const songIndex = Math.floor(Math.random() * data.songs.length);
        setSongs(data.songs);
        const song = data.songs[songIndex];

        handleGetImage(song.song, randomFolder, songIndex);
    }

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
        setSongs(data.songs);
    }

    const handleToggleFolder = async (folder) => {
        const result = await fetch(`/put_folder_to_top/${folder}`);
        fetchFolders();
    }

    const handleGetImage = async (song, folder, index) => {
        setSelectedSong(index);

        if(timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        imageListRef.current.scrollTo(0, 0);

        const data = await fetch(`/songs/${folder}/${song}`).then(res => res.json());
       
        SetImageSources(data.imageSources);
        setCurrentSong(song);

        const videoData = await fetch(`/youtube/${folder}/${song}`).then(res => res.json());

        setVideoLink(videoData.embedLink);
        setCurrentSinger(videoData.singer);
        setDisplaySinger(videoData.singer === 'null' ? '': videoData.singer);
        setSingerStyle(videoData.singer_style);
        setSongStyle(videoData.song_style);
    }

    const handleFavourite = async (index) => {
        const song = songs[index];

        if(song.favourite && song.favourite === true) {
            song.favourite = false;
            await fetch(`/unfavourite/${song.folder}/${song.song}`)

            setSongs(songs.map(s => s));
        } else {
            song.favourite = true;
            await fetch(`/favourite/${song.folder}/${song.song}`)
            setSongs(songs.map(s => s));
        }
    }

    const handleSingerChange = e => {
        setDisplaySinger(e.target.value);
    }

    const handleEnterInput = async e => {
        if(e.key === "Enter") {
            const singer = e.target.value;
            const folder = folderNames[selectedFolder]
            const song = songs[selectedSong];
            const info = await fetch(`/update/${folder.name}/${song.song}/${singer}`).then(res => res.json());
            setCurrentSinger(info.singer);
            setDisplaySinger(info.singer);
            setVideoLink(info.embedLink);
        }
    }

    const handleSongStyleChange = async (e) => {
        const info = await fetch(`/update_style/${currentSinger}/${currentSong}/${e.target.value}`);
        setSingerStyle(e.target.value);
        setSongStyle(e.target.value);
    }

    const getColor = (rank) => {
        const colors = [
            '#FFDFDF', 
            '#D9EDBF', 
            '#CAEDFF',
            '#d8d9da', 
            '#ede4ff',
            '#ffeecc', 
            '#fff0f5'
        ]

        return colors[rank];
    }
    
    return (
        <ThemeProvider theme={theme}>
            <div className="Navi_Bar"> 
                <div className="LogoContainer">
                   <HeroLogo /> 
                </div>
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
                    <div 
                        className="Song_Button" 
                        style={{
                            backgroundColor: `#fdfd96`
                        }}
                    >
                        <Button
                            variant={showFavs ? 'contained' : 'text'}
                            onClick={handleGetFavs}
                        >
                            {"Favourites"}
                        </Button> 
                    </div>                    
                    {
                        folderNames.map((folder, index) => 
                            <div 
                                className="Song_Button" 
                                style={{
                                    backgroundColor: `${getColor(folder.type)}`
                                }}
                            >
                                <Button
                                    variant={index === selectedFolder ? 'contained' : 'text'}
                                    onClick={() => handleGetSongs(folder.name, index)}
                                    size={folder.name.indexOf('-') >= 0 ? 'large' : 'medium'}
                                    style={{ 
                                        fontWeight: folder.name.indexOf('-') >= 0 ? '1200' : '400',
                                        fontSize: folder.name.indexOf('-') >= 0 ? '18px' : '16px'
                                    }}
                                >
                                    {folder.name}
                                </Button>
                                <IconButton 
                                    color={folder.atTop ? "primary" : "disabled"}
                                    onClick={() => handleToggleFolder(folder.name)}
                                >   
                                    {
                                        folder.atTop ?
                                            <VerticalAlignBottomIcon /> :
                                            <VerticalAlignTopIcon/> 
                                    }
                                    
                                </IconButton>
                                
                            </div>
                        )
                    }
                </div>
                <div className="Songs_List">
                    {
                        songs.map((song, index) => 
                            <div className="Song_Button">
                                <Button
                                    variant={index === selectedSong ? 'contained' : 'text'}
                                    color='song'
                                    onClick={() => handleGetImage(song.song, song.folder, index)}
                                    sx={{
                                        display: 'block',
                                        justifyContent: 'left',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        maxWidth: '100%'
                                    }}
                                >
                                    {song.song}
                                </Button>
                                <IconButton
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
                                </IconButton>
                            </div>
                        )
                    }
                </div>
                <div className="Image_List" ref={imageListRef}>
                    {
                        imageSources.map(src => 
                            <img className="Image" src ={src}/>
                        )
                    }
                </div>
                <div className="Youtube_Container">
                    <iframe 
                        width="560" 
                        height="315" 
                        src={videoLink}
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen
                        sx={{ marginBottom: '10px' }}
                    />
                    {
                        currentSong && 
                        <div className="Song_Info">
                            <div className="Form_Item">
                                <TextField
                                    id="outlined-basic" 
                                    label="歌手" 
                                    variant="outlined"
                                    value={displaySinger}
                                    onChange={handleSingerChange}
                                    onKeyDown={handleEnterInput}
                                />
                            </div>
                            <div className="Form_Item"> 
                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">风格</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        label="Style"
                                        value={songStyle}
                                        onChange={handleSongStyleChange}
                                    >
                                        <MenuItem value={'Rock'}>摇滚</MenuItem>
                                        <MenuItem value={'Ballad'}>民谣</MenuItem>
                                        <MenuItem value={'Pop'}>流行</MenuItem>
                                    </Select>
                                </FormControl> 
                            </div>
                        </div>
                    }
                    {/*
                        currentSinger && currentSinger !== 'null' &&
                        <div className="Singer_Info">
                            <div>Singer Info</div>
                            <div className="Form_Item"> 
                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">地域</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        label="地域"
                                    >
                                        <MenuItem value={10}>内地</MenuItem>
                                        <MenuItem value={20}>台湾</MenuItem>
                                        <MenuItem value={30}>香港</MenuItem>
                                        <MenuItem value={30}>海外</MenuItem>
                                    </Select>
                                </FormControl>
                            </div> 
                        </div>
                    */}
                </div>
            </div>
        </ThemeProvider>
    )
}

export default ChordsChart;
