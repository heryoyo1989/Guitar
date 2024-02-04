import React, { useState } from 'react';
import { Button } from "@mui/material";

const Dora = () => {
    const [text, setText] = useState('');

    var handleText = async() => {
        const text = await fetch('/api').then(res => setText(res));
    }

    return (
        <> 
            <Button 
                variant="text"
                size="small"
                color="navi"
                onClick={handleText}
            >
                Dora
            </Button>
            <div>{text}</div>
        </>
    )
}

export default Dora;