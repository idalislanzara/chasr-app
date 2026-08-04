import { Link } from 'react-router-dom';
import { Heart, MapPin, ShieldCheck, Zap, Flag, ChevronRight } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="page welcome-page">
      <header className="welcome-hero">
        <div className="welcome-logo">chasr</div>
        <p className="welcome-tag">Dating for the trans community</p>
      </header>

      <section className="welcome-content">
        <h1 className="welcome-headline">
          Find your people —<br />nearby, not just online.
        </h1>
        <p className="welcome-sub">
          Chasr Dating is a safe space to meet, match, and chat with trans women, trans men,
          non-binary folks, and the people who love them.
        </p>

        <Link to="/register" className="welcome-cta">
          Create your free profile
          <ChevronRight size={18} />
        </Link>
        <Link to="/login" className="welcome-login">Already have an account? Log in</Link>

        <div className="welcome-features">
          <div className="welcome-feature">
            <MapPin size={20} />
            <div><strong>See who's nearby</strong><span>Browse people around you, or anywhere in the world.</span></div>
          </div>
          <div className="welcome-feature">
            <Zap size={20} />
            <div><strong>Right Now</strong><span>Connect with people available in the moment.</span></div>
          </div>
          <div className="welcome-feature">
            <ShieldCheck size={20} />
            <div><strong>Safety first</strong><span>Report and block anyone, anytime. Your exact location is never shared.</span></div>
          </div>
          <div className="welcome-feature">
            <Heart size={20} />
            <div><strong>Built for us</strong><span>Inclusive identities and pronouns on every profile.</span></div>
          </div>
        </div>

        <p className="welcome-18">
          <Flag size={14} />
          18+ only. No fake profiles. No exceptions.
        </p>
      </section>

      <footer className="welcome-footer">
        <Link to="/privacy">Privacy Policy</Link>
        <span>·</span>
        <Link to="/terms">Terms</Link>
      </footer>
    </div>
  );
}
