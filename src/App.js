import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css'; // Add a CSS file for styling

const socket = io(process.env.REACT_APP_BACKEND_URL); // Backend URL

const App = () => {
    const [username, setUsername] = useState('');
    const [tempUsername, setTempUsername] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isUsernameSet, setIsUsernameSet] = useState(false);

    useEffect(() => {
        socket.on('receiveMessage', (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleSetUsername = () => {
        if (tempUsername.trim()) {
            setUsername(tempUsername);
            setIsUsernameSet(true);
        }
    };

    const sendMessage = () => {
        if (message.trim()) {
            socket.emit('sendMessage', { username, text: message });
            setMessage('');
        }
    };

    return (
        <div className="chat-container">
            {!isUsernameSet ? (
                <div className="username-container">
                    <h2>Welcome to the Chat Room</h2>
                    <input
                        type="text"
                        placeholder="Enter your username..."
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        className="username-input"
                    />
                    <button onClick={handleSetUsername} className="btn primary">
                        Join Chat
                    </button>
                </div>
            ) : (
                <div className="chat-room">
                    <h2>Welcome, {username}</h2>
                    <div className="messages-container">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${
                                    msg.username === username ? 'my-message' : 'other-message'
                                }`}
                            >
                                <strong>{msg.username}: </strong>
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <div className="message-input-container">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="message-input"
                        />
                        <button onClick={sendMessage} className="btn send-btn">
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
