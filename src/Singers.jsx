import React, { useState } from "react";
import './Singers.css';

const Singers = () => {
    const [names, setNames] = useState([]);
    const [singer, setSinger] = useState('');
    const [songs, setSongs] = useState([]);
    const [image, SetImage] = useState('');

    fetch('/singers')
        .then(res => res.json())
        .then(data => {
            setNames(data.singers);
        })


    const handleGetSongs = async (name) => {
        setSinger(name);
        const data = await fetch(`/songs/${name}`).then(res => res.json());
        console.log(data);
        setSongs(data.songs);
        // .then(res => res.json())
    }

    const handleGetImage = async (song) => {
        const data = await fetch(`/songs/${singer}/${song}`).then(res => res.json());
        // const src = 'data:image/jpeg;base64,' + data.data.data.toString('base64');
        // SetImage(data.data);
        // SetImage(data.imageDir);
        // SetImage('file://Music/吉他谱/周杰伦/七里香1.png')
        console.log('dir', data);
        SetImage(data.src);
    }

    return (
        <div className="Singers">
            <div>
                {
                    names.map(name => <div onClick={() => handleGetSongs(name)}>{name}</div>)
                }
            </div>
            <div>
                {
                    songs.map(song => <div onClick={() =>  handleGetImage(song)}>{song}</div>)
                }
            </div>
            <div>
                {
                    image && <img src ={image} width={800} height={1200}/>
                }
            </div>
        </div>
    )
}

export default Singers;