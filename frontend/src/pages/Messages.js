import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getChatRooms, getChatRoom, sendMessage } from '../utils/Api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import { FaPaperPlane } from 'react-icons/fa';
import './Messages.css';

const Messages = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [newMessageError, setNewMessageError] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchChatRooms();
    }, []);

    useEffect(() => {
        if (id) {
            selectRoom(id);
        }
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChatRooms = async () => {
        try {
            const response = await getChatRooms();
            setChatRooms(response.data);
            if (response.data.length > 0 && !id) {
                selectRoom(response.data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
        }
    };

    const selectRoom = async (roomId) => {
        try {
            const response = await getChatRoom(roomId);
            setSelectedRoom(response.data);
            setMessages(response.data.messages || []);
            setNewMessageError('');
        } catch (error) {
            console.error('Error fetching chat room:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedRoom) {
            setNewMessageError('اختر محادثة لإرسال رسالة.');
            return;
        }
        if (!newMessage.trim()) {
            setNewMessageError('الرجاء كتابة رسالة قبل الإرسال.');
            return;
        }

        setNewMessageError('');

        try {
            const response = await sendMessage(selectedRoom._id, newMessage.trim());
            setMessages([...messages, response.data.chatMessage]);
            setNewMessage('');
            setNewMessageError('');
            showToast('success', 'تم إرسال الرسالة');
        } catch (error) {
            console.error('Error sending message:', error);
            const errMsg = error.response?.data?.message || 'تعذّر إرسال الرسالة';
            setNewMessageError(errMsg);
            showToast('error', errMsg);
        }
    };

    return (
        <div className="messages-layout container">
            {/* Sidebar: Chat Rooms */}
            <aside className="chat-sidebar">
                <div className="sidebar-header">
                    <h2>المحادثات</h2>
                </div>
                <div className="rooms-list">
                    {chatRooms.length > 0 ? (
                        chatRooms.map((room) => {
                            const otherParticipant = room.participants.find(p => p._id !== user?.id);
                            const isActive = selectedRoom?._id === room._id;
                            return (
                                <div
                                    key={room._id}
                                    onClick={() => selectRoom(room._id)}
                                    className={`room-item ${isActive ? 'active' : ''}`}
                                >
                                    <div className="room-avatar">
                                        {otherParticipant?.name.charAt(0)}
                                    </div>
                                    <div className="room-info">
                                        <div className="room-name">{otherParticipant?.name}</div>
                                        {room.helpRequest && (
                                            <div className="room-subject">{room.helpRequest.title}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state">لا توجد محادثات</div>
                    )}
                </div>
            </aside>

            {/* Main: Chat Content */}
            <main className="chat-main">
                {selectedRoom ? (
                    <>
                        <header className="chat-header">
                            <div className="header-info">
                                <h3>{selectedRoom.participants.find(p => p._id !== user?.id)?.name}</h3>
                                <span>{selectedRoom.helpRequest?.title}</span>
                            </div>
                        </header>

                        <div className="chat-messages">
                            {messages.map((message, index) => {
                                const isSent = message.sender._id === user?.id || message.sender === user?.id;
                                return (
                                    <div key={index} className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
                                        <div className="message-bubble">
                                            <div className="message-content">{message.content}</div>
                                            <div className="message-time">
                                                {new Date(message.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <footer className="chat-input-area">
                            <form onSubmit={handleSendMessage} className="input-form">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="اكتب رسالة..."
                                    className="chat-input"
                                />
                                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="chat-empty-view">
                        <p>اختر محادثة من القائمة الجانبية للبدء</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Messages;