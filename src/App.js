import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const App = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get('`${API_URL}/api/message`')
    .then(response => console.log(response.data))
    .catch(error => console.error(error));

    }, []);

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>My Simple Website</h1>
            <p>{message}</p>
        </div>
    );
};

export default App;
