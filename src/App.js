import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const socket = io(API_URL);

const App = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('authToken') || '');
    const [rememberMe, setRememberMe] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [chatRooms, setChatRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [feedback, setFeedback] = useState('');

    // Auto-login if token exists
    useEffect(() => {
        if (token) {
            axios
                .get(`${API_URL}/verify-token`, { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => {
                    setUsername(response.data.username);
                    setIsLoggedIn(true);
                    setFeedback('Welcome back!');
                })
                .catch(() => {
                    setToken('');
                    localStorage.removeItem('authToken');
                });
        }
    }, [token]);

    // Fetch chat rooms on load
    useEffect(() => {
        if (isLoggedIn) {
            axios
                .get(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => setChatRooms(response.data))
                .catch((error) => console.error(error));
        }
    }, [isLoggedIn]);

    // Listen for real-time messages
    useEffect(() => {
        if (currentRoom) {
            socket.on('receiveMessage', (newMessage) => {
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            });

            socket.on('chatHistory', (chatHistory) => {
                setMessages(chatHistory);
            });

            socket.on('error', (error) => {
                setFeedback(error.message);
            });

            return () => socket.disconnect();
        }
    }, [currentRoom]);

    const registerUser = () => {
        axios
            .post(`${API_URL}/register`, { username, password })
            .then(() => {
                setFeedback('Registration successful! Please log in.');
                setUsername('');
                setPassword('');
            })
            .catch((error) => {
                setFeedback(error.response.data.message);
            });
    };

    const loginUser = () => {
        axios
            .post(`${API_URL}/login`, { username, password, rememberMe })
            .then((response) => {
                const { token } = response.data;
                setToken(token);
                setIsLoggedIn(true);
                setFeedback('Login successful!');
                if (rememberMe) localStorage.setItem('authToken', token);
            })
            .catch((error) => {
                setFeedback(error.response.data.message);
            });
    };

    const createRoom = () => {
        axios
            .post(`${API_URL}/create-room`, { roomName }, { headers: { Authorization: `Bearer ${token}` } })
            .then((response) => {
                setChatRooms((prevRooms) => [...prevRooms, response.data.roomName]);
                setRoomName('');
                setFeedback(response.data.message);
            })
            .catch((error) => {
                setFeedback(error.response.data.message);
            });
    };

    const joinRoom = (room) => {
        setCurrentRoom(room);
        setMessages([]);
        socket.emit('joinRoom', { roomName: room, username });
    };

    const sendMessage = () => {
        if (message.trim()) {
            socket.emit('sendMessage', { roomName: currentRoom, username, text: message });
            setMessage('');
        }
    };

    const logoutUser = () => {
        setIsLoggedIn(false);
        setToken('');
        localStorage.removeItem('authToken');
        setUsername('');
        setPassword('');
        setCurrentRoom('');
        setFeedback('Logged out successfully.');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1>Chat Application</h1>

            {/* User Authentication */}
            {!isLoggedIn && (
                <div>
                    <h2>{feedback ? feedback.includes('successful') ? 'Login' : 'Register' : 'Register or Login'}</h2>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ margin: '5px' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ margin: '5px' }}
                    />
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />{' '}
                            Remember Me
                        </label>
                    </div>
                    <div>
                        <button onClick={registerUser} style={{ marginRight: '10px' }}>
                            Register
                        </button>
                        <button onClick={loginUser}>Login</button>
                    </div>
                    {feedback && <p style={{ color: feedback.includes('successful') ? 'green' : 'red' }}>{feedback}</p>}
                </div>
            )}

            {/* Chat Room Management */}
            {isLoggedIn && !currentRoom && (
                <div>
                    <h2>Available Chat Rooms</h2>
                    {chatRooms.length > 0 ? (
                        chatRooms.map((room) => (
                            <div key={room} style={{ marginBottom: '10px' }}>
                                <span>{room}</span>
                                <button onClick={() => joinRoom(room)} style={{ marginLeft: '10px' }}>
                                    Join
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No chat rooms available. Create one!</p>
                    )}

                    <h2>Create a Room</h2>
                    <input
                        type="text"
                        placeholder="Room Name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        style={{ margin: '5px' }}
                    />
                    <button onClick={createRoom}>Create Room</button>
                </div>
            )}

            {/* Chat Room */}
            {isLoggedIn && currentRoom && (
                <div>
                    <h2>Room: {currentRoom}</h2>
                    <div
                        style={{
                            border: '1px solid #ccc',
                            padding: '10px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            marginBottom: '10px',
                        }}
                    >
                        {messages.map((msg, index) => (
                            <p key={index}>
                                <strong>{msg.username}</strong>: {msg.text} <small>({msg.timestamp})</small>
                            </p>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{ margin: '5px' }}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            )}

            {isLoggedIn && (
                <button onClick={logoutUser} style={{ marginTop: '20px', backgroundColor: '#ff6464' }}>
                    Logout
                </button>
            )}
        </div>
    );
};

export default App;
