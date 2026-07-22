import { NavLink } from 'react-router-dom';
import { Grid3X3, Zap, MessageCircle, User, MapPin } from 'lucide-react';
import { useApp } from '../store';
import { useState, useEffect } from 'react';
import { api } from '../api';
import profiles from '../data';

export default function BottomNav() {
  const { state } = useApp();
  const [unread, setUnread] = useState(0);
  const onlineCount = profiles.filter((p) => p.online).length;

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await api.getChats();
        const total = (data.chats || []).reduce((sum: number, chat: any) => sum + (chat.unread_count || 0), 0);
        setUnread(total);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Grid3X3 size={20} />
        <span>Browse</span>
      </NavLink>
      <NavLink to="/nearby" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-wrap">
          <MapPin size={20} />
          {state.locationSharing && <span className="online-badge" />}
        </div>
        <span>Nearby</span>
      </NavLink>
      <NavLink to="/right-now" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-wrap">
          <Zap size={20} />
          {onlineCount > 0 && <span className="online-badge" />}
        </div>
        <span>Right Now</span>
      </NavLink>
      <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon-wrap">
          <MessageCircle size={20} />
          {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
        </div>
        <span>Inbox</span>
      </NavLink>
      <NavLink to="/me" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User size={20} />
        <span>Me</span>
      </NavLink>
    </nav>
  );
}
