import React from 'react';
import './Logo.css';

const HeroLogo = () => {
    return (
        <div className='Logo'>
            <div className='BigRing'>
                <div className='SmallRing' id="ring_1"></div>
                <div className='SmallRing' id="ring_2"></div>
                <div className='SmallRing' id="ring_3"></div>
            </div>
        </div>
    )
}

export default HeroLogo;