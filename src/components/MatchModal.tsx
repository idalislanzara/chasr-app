import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  name: string;
  photo: string;
  onClose: () => void;
}

export default function MatchModal({ name, photo, onClose }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="match-overlay" onClick={onClose}>
      <div className="match-card" onClick={(e) => e.stopPropagation()}>
        <div className="match-sparkles">✨</div>
        <h2>It's a Match!</h2>
        <p>You and <strong>{name}</strong> liked each other</p>
        <div className="match-avatar-large">
          <img src={photo} alt={name} />
        </div>
        <div className="match-actions">
          <button
            className="btn-primary"
            onClick={() => {
              onClose();
              navigate('/chat');
            }}
          >
            Send a Message
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Keep Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
