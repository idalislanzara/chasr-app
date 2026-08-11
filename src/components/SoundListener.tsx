import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, getSocket } from '../api';
import { useAuth } from '../authStore';
import { useToast } from './Toast';
import { playMessageSound, playMatchSound } from '../audio';

interface MessagePayload {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  read: number;
  created_at: number;
}

interface MatchPayload {
  from: string;
  chatId?: string;
}

export default function SoundListener() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    if (!user) return;
    const myId = user.id;
    let disposed = false;
    let interval: number | undefined;

    const onMessage = (msg: MessagePayload) => {
      if (!msg || msg.sender_id === myId) return;
      // The Chasr Ping — plays for every incoming message, anywhere in the app.
      playMessageSound();
      if (pathRef.current !== '/chat') {
        api.getChats().then((d: { chats?: Array<{ id: string; other_user?: { name?: string; photos?: string[] } }> }) => {
          if (disposed) return;
          const chat = (d.chats || []).find(c => c.id === msg.chat_id);
          showToast({
            type: 'message',
            title: chat?.other_user?.name || 'New message',
            body: msg.text,
            photo: chat?.other_user?.photos?.[0],
            onClick: () => navigate('/chat', { state: { chatId: msg.chat_id } }),
          });
        }).catch(() => {
          if (!disposed) showToast({ type: 'message', title: 'New message', body: msg.text });
        });
      }
    };

    const onMatch = (data: MatchPayload) => {
      if (!data || data.from === myId) return;
      playMatchSound();
      showToast({
        type: 'match',
        title: "It's a match!",
        body: 'You two liked each other. Say hi!',
        onClick: () => navigate('/chat', { state: { chatId: data.chatId } }),
      });
    };

    const attach = () => {
      const socket = getSocket();
      if (!socket) return false;
      socket.on('message', onMessage);
      socket.on('match', onMatch);
      return true;
    };

    if (!attach()) {
      interval = window.setInterval(() => {
        if (disposed) {
          window.clearInterval(interval);
          return;
        }
        if (attach()) window.clearInterval(interval);
      }, 1000);
    }

    return () => {
      disposed = true;
      if (interval) window.clearInterval(interval);
      const socket = getSocket();
      if (socket) {
        socket.off('message', onMessage);
        socket.off('match', onMatch);
      }
    };
  }, [user?.id]);

  return null;
}
