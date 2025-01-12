import React, { useEffect, useState, useRef } from 'react';
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

    // References
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);

    // Function to scroll to the bottom of the messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Adjust padding when the keyboard opens (mobile-specific)
    const handleKeyboardShow = () => {
        if (messageInputRef.current) {
            messageInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Add this function to handle the Enter key press
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };


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

    // Scroll to the bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    const leaveRoom = () => {
        setCurrentRoom('');
        setMessages([]);
        setFeedback('');
    };

    return (
        <div className="container">
            <h1>BaatChit</h1>

            {!isLoggedIn && (
                <div className="login">
                    <h2>{feedback ? (feedback.includes('successful') ? 'Login' : 'Register') : 'Register or Login'}</h2>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                    {feedback && <p className="feedback">{feedback}</p>}
                </div>
            )}

            {isLoggedIn && !currentRoom && (
                <div>
                    <h2>Available Chat Rooms</h2>
                    {chatRooms.length > 0 ? (
                        chatRooms.map((room) => (
                            <div key={room} className="chat-room-list">
                                <span>{room}</span>
                                <button onClick={() => joinRoom(room)}>Join</button>
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
                    />
                    <button onClick={createRoom}>Create Room</button>
                </div>
            )}

            {isLoggedIn && currentRoom && (
                <div className="chat-room">
                    <span className="home-icon" onClick={leaveRoom} title="Leave Room">
                        🏠
                    </span>
                    <h2>Room: {currentRoom}</h2>
                    <div className="messages-container">
                        {messages.map((msg, index) => (
                            <div className="message-box" key={index}>
                                <div className="message-text">
                                    <strong>{msg.username}</strong>: {msg.text}
                                </div>
                                <div className="timestamp">{msg.timestamp}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef}></div>
                    </div>
                    <div className="message-input-container">
                        <input
                            type="text"
                            placeholder="Type a message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onFocus={handleKeyboardShow} // Smooth scroll to input when focused
                            onKeyPress={handleKeyPress} // Trigger sendMessage on Enter key press
                            ref={messageInputRef}
                        />
                        <button className="send-btn" onClick={sendMessage}>
                            Send
                        </button>
                    </div>
                </div>
            )}

            {isLoggedIn && (
                <button onClick={logoutUser} className="logout-btn">
                    Logout
                </button>
            )}
        </div>
    );
};

export default App;
