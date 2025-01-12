import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL; // Backend URL from .env

const App = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get(`${API_URL}/api/message`) // Corrected string interpolation
            .then(response => {
                setMessage(response.data.message); // Set the message from the API
            })
            .catch(error => {
                console.error('Error fetching the message:', error);
            });
    }, []);

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>My Simple Website</h1>
            <p>{message}</p>
        </div>
    );
};

export default App;
