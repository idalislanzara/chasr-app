import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Loader2, Smile, Flag, Ban, MoreVertical, X } from 'lucide-react';
import { api, getSocket } from '../api';
import { useToast } from '../components/Toast';
import { safeGet } from '../safeStorage';

interface ChatRoom {
  id: string;
  other_id: string;
  other_user: { id: string; name: string; age: number; photos: string[]; identity: string } | null;
  last_message: string;
  last_message_at: number;
  unread_count: number;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  read: number;
  created_at: number;
}

const QUICK_REACTIONS = ['Hey! 👋', 'What\'s up? 😊', 'You\'re cute! 💕', 'Let\'s chat! 💬'];

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myId = safeGet('chasr_user_id');

  useEffect(() => {
    api.getChats().then(data => {
      setChats(data.chats || []);
      const openChatId = (location.state as { chatId?: string } | null)?.chatId;
      if (openChatId) {
        setActiveChat(openChatId);
        navigate('/chat', { replace: true, state: null });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    api.getMessages(activeChat).then(data => {
      setMessages(data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }).catch(() => {});

    const socket = getSocket();
    if (socket) {
      const handler = (msg: Message) => {
        if (msg.chat_id === activeChat) {
          setMessages(prev => [...prev, msg]);
          setOtherTyping(false);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else if (msg.sender_id !== myId) {
          // Show toast for messages in other chats
          const chatData = chats.find(c => c.id === msg.chat_id);
          showToast({
            type: 'message',
            title: chatData?.other_user?.name || 'New message',
            body: msg.text,
            photo: chatData?.other_user?.photos?.[0],
            onClick: () => { setActiveChat(msg.chat_id); },
          });
        }
        api.getChats().then(data => setChats(data.chats || [])).catch(() => {});
      };
      const typingHandler = (data: { chat_id: string }) => {
        if (data.chat_id === activeChat) {
          setOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      };
      socket.on('message', handler);
      socket.on('typing', typingHandler);
      return () => {
        socket.off('message', handler);
        socket.off('typing', typingHandler);
      };
    }
  }, [activeChat]);

  const sendMessage = async (text?: string) => {
    const msgText = text || newMessage.trim();
    if (!msgText || !activeChat || sending) return;
    setSending(true);
    setShowReactions(false);
    try {
      const data = await api.sendMessage(activeChat, msgText);
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      api.getChats().then(d => setChats(d.chats || [])).catch(() => {});
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (socket && activeChat) {
      socket.emit('typing', { chat_id: activeChat });
    }
  };

  const handleBack = () => {
    setActiveChat(null);
    setMessages([]);
    setOtherTyping(false);
  };

  // Chat list view
  if (!activeChat) {
    return (
      <div className="page chat-page">
        <header className="page-header">
          <MessageCircle size={24} style={{ color: 'var(--accent)' }} />
          <h1>Inbox</h1>
        </header>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 size={24} className="spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : chats.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">&#128172;</span>
            <h3>No conversations yet</h3>
            <p>Tap Message on a profile to start chatting!</p>
          </div>
        ) : (
          <div className="chat-list">
            {chats.map(chat => (
              <div key={chat.id} className="chat-item" onClick={() => setActiveChat(chat.id)}>
                <div className="chat-avatar">
                  <img
                    src={chat.other_user?.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.other_user?.name || '?')}&background=random&color=fff&size=100&bold=true&format=svg`}
                    alt={chat.other_user?.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.other_user?.name || '?')}&background=random&color=fff&size=100&bold=true&format=svg`;
                    }}
                  />
                  {chat.other_user && (
                    <span className={`online-indicator ${Date.now() - chat.last_message_at < 5 * 60 * 1000 ? 'online' : ''}`} />
                  )}
                </div>
                <div className="chat-info">
                  <div className="chat-name-row">
                    <span className="chat-name">{chat.other_user?.name || 'Unknown'}, {chat.other_user?.age || ''}</span>
                    <span className="chat-time">{formatTime(chat.last_message_at)}</span>
                  </div>
                  <p className="chat-preview">{chat.last_message || 'Start chatting...'}</p>
                </div>
                {chat.unread_count > 0 && <span className="chat-badge">{chat.unread_count}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Active chat view
  const activeChatData = chats.find(c => c.id === activeChat);
  const otherUser = activeChatData?.other_user || null;

  return (
    <div className="page chat-room-page" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Chat Header */}
      <div className="chat-room-header">
        <button className="btn-icon" onClick={handleBack}>
          <ArrowLeft size={22} />
        </button>
        <div className="chat-room-actions">
          {showActions && (
            <div className="chat-actions-menu">
              <button onClick={() => { setShowActions(false); setShowReport(true); }}>
                <Flag size={16} /> Report
              </button>
              <button className="danger" onClick={() => { setShowActions(false); setConfirmBlock(true); }}>
                <Ban size={16} /> Block
              </button>
            </div>
          )}
          <button className="btn-icon" onClick={() => setShowActions(v => !v)} aria-label="More actions">
            <MoreVertical size={20} />
          </button>
        </div>
        <div className="chat-room-info" onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)}>
          <img
            src={activeChatData?.other_user?.photos?.[0] || `https://ui-avatars.com/api/?name=?&background=random&color=fff&size=60&bold=true&format=svg`}
            alt=""
            className="chat-room-avatar"
          />
          <div>
            <span className="chat-room-name">{activeChatData?.other_user?.name || 'Unknown'}</span>
            <span className="chat-room-status">
              {otherTyping ? (
                <span className="typing-text">typing<span className="typing-dots"><span>.</span><span>.</span><span>.</span></span></span>
              ) : (
                activeChatData?.other_user?.identity || ''
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === 'me' || msg.sender_id === myId;
          const showAvatar = !isMine && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id);
          return (
            <div key={msg.id} className={`message ${isMine ? 'sent' : 'received'}`}>
              {!isMine && showAvatar && (
                <img
                  src={activeChatData?.other_user?.photos?.[0] || `https://ui-avatars.com/api/?name=?&background=random&color=fff&size=40&bold=true&format=svg`}
                  alt="" className="message-avatar"
                />
              )}
              {!isMine && !showAvatar && <div style={{ width: 32 }} />}
              <div className="message-bubble">
                <p>{msg.text}</p>
                <span className="message-time">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        {otherTyping && (
          <div className="message received">
            <div className="message-bubble typing-bubble">
              <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick reactions */}
      {showReactions && (
        <div className="quick-reactions">
          {QUICK_REACTIONS.map(r => (
            <button key={r} className="quick-reaction" onClick={() => sendMessage(r)}>{r}</button>
          ))}
        </div>
      )}

      {confirmBlock && otherUser && (
        <div className="match-overlay" onClick={() => setConfirmBlock(false)}>
          <div className="match-modal report-modal" onClick={e => e.stopPropagation()}>
            <h2>Block {otherUser.name}?</h2>
            <p className="report-hint">They won't be able to message you, and the conversation will be hidden.</p>
            <div className="confirm-block-actions">
              <button className="btn-secondary" onClick={() => setConfirmBlock(false)}>Cancel</button>
              <button className="btn-danger" onClick={async () => {
                try { await api.block(otherUser.id); } catch {}
                showToast({ type: 'info', title: 'Blocked', body: `${otherUser.name} can no longer message you.` });
                setConfirmBlock(false);
                handleBack();
              }}>Confirm Block</button>
            </div>
          </div>
        </div>
      )}

      {showReport && otherUser && (
        <div className="match-overlay" onClick={() => { setShowReport(false); setReportSent(false); }}>
          <div className="match-modal report-modal" onClick={e => e.stopPropagation()}>
            <button className="report-close" onClick={() => { setShowReport(false); setReportSent(false); }}>
              <X size={18} />
            </button>
            <h2>Report {otherUser.name}</h2>
            {reportSent ? (
              <div className="report-sent">
                <p>Thanks for letting us know. Our safety team reviews every report — your profile and report stay private.</p>
                <button className="btn-primary" onClick={() => { setShowReport(false); setReportSent(false); }}>Close</button>
              </div>
            ) : (
              <>
                <p className="report-hint">Reports are confidential. Choose the reason that fits best:</p>
                <div className="report-reasons">
                  {['Underage person', 'Fake profile', 'Harassment or bullying', 'Offensive or inappropriate content', 'Illegal content', 'Spam', 'Other'].map(r => (
                    <button
                      key={r}
                      className={`report-reason ${reportReason === r ? 'selected' : ''}`}
                      onClick={() => setReportReason(r)}
                    >{r}</button>
                  ))}
                </div>
                <textarea
                  className="report-details"
                  placeholder="Add details (optional) — dates, messages, anything helpful"
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  rows={3}
                />
                <button
                  className="btn-primary"
                  disabled={!reportReason}
                  onClick={async () => {
                    try {
                      await api.report(otherUser.id, reportReason, reportDetails);
                      setReportSent(true);
                    } catch (err) { console.error('Report failed:', err); }
                  }}
                >Submit Report</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-bar">
        <button className="btn-emoji" onClick={() => setShowReactions(!showReactions)}>
          <Smile size={22} />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={sending}
        />
        <button className="btn-send" onClick={() => sendMessage()} disabled={!newMessage.trim() || sending}>
          {sending ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return d.toLocaleDateString();
}
