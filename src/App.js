import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/api/message')
            .then((response) => setMessage(response.data.message))
            .catch((error) => console.error('Error fetching the message:', error));
    }, []);

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>My Simple Website</h1>
            <p>{message}</p>
        </div>
    );
};

export default App;
