import { useState } from 'react';
import {
  Zap, Eye, Ghost, Star, Check, ChevronRight, Shield, Sparkles,
  Globe, MessageCircle, Lock, Crown, X,
} from 'lucide-react';

interface StoreItem {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  price: string;
  tag?: string;
  tagColor?: string;
  features: string[];
  color: string;
  popular?: boolean;
}

const storeItems: StoreItem[] = [
  {
    id: 'boost',
    icon: <Zap size={24} />,
    name: 'Boost',
    description: 'Get 30 minutes of top profile visibility — up to 10x more views.',
    price: '$3.99',
    features: ['30 min of top visibility', 'Up to 10x profile views', 'Works in your area'],
    color: '#f59e0b',
    popular: true,
  },
  {
    id: 'unlimited-views',
    icon: <Eye size={24} />,
    name: 'Unlimited Views',
    description: 'See who has viewed your profile in the last 7 days.',
    price: '$2.99/wk',
    features: ['See all profile visitors', 'Last 7 days of activity', 'Anonymous viewers revealed'],
    color: '#8b5cf6',
  },
  {
    id: 'incognito',
    icon: <Ghost size={24} />,
    name: 'Incognito',
    description: 'Browse profiles without showing up in anyone\'s grid.',
    price: '$4.99/wk',
    features: ['Hidden from all grids', 'Only visible when you message', 'Browse privately'],
    color: '#6366f1',
  },
  {
    id: 'unlimited-chat',
    icon: <MessageCircle size={24} />,
    name: 'Unlimited Chat',
    description: 'Send messages to anyone, even without a match.',
    price: '$6.99/wk',
    features: ['Message without matching', 'Priority message delivery', 'Read receipts'],
    color: '#ec4899',
  },
  {
    id: 'global',
    icon: <Globe size={24} />,
    name: 'Global Access',
    description: 'Browse profiles anywhere in the world before you travel.',
    price: '$9.99/wk',
    features: ['Any city worldwide', 'Plan trips ahead', 'Travel mode'],
    color: '#06b6d4',
  },
  {
    id: 'discreet',
    icon: <Lock size={24} />,
    name: 'Discreet Mode',
    description: 'Hide your distance and last active status.',
    price: '$1.99/wk',
    features: ['Hide distance', 'Hide last active', 'Appear offline'],
    color: '#64748b',
  },
];

const premiumPlans = [
  {
    name: 'Chasr Plus',
    price: '$9.99/mo',
    period: 'per month',
    icon: <Star size={20} />,
    features: [
      'Unlimited likes',
      'See who liked you',
      'Advanced filters',
      'No ads',
      'Rewind (undo passes)',
    ],
    color: '#d946ef',
  },
  {
    name: 'Chasr Premium',
    price: '$19.99/mo',
    period: 'per month',
    icon: <Crown size={20} />,
    popular: true,
    features: [
      'Everything in Chasr Plus',
      'Unlimited Boosts (1/week)',
      'Incognito mode included',
      'Profile verification badge',
      'Priority support',
      'Read receipts',
    ],
    color: '#f59e0b',
  },
];

export default function Store() {
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="page store-page">
      <header className="page-header store-header">
        <h1>Store</h1>
        <Shield size={20} className="store-secure-icon" />
      </header>

      {/* Premium Plans */}
      <section className="store-section">
        <div className="store-section-header">
          <Sparkles size={16} />
          <h2>Go Premium</h2>
        </div>
        <div className="store-plans">
          {premiumPlans.map((plan) => (
            <div
              key={plan.name}
              className={`store-plan ${plan.popular ? 'popular' : ''} ${selectedPlan === plan.name ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(selectedPlan === plan.name ? null : plan.name)}
            >
              {plan.popular && <span className="popular-badge">Best Value</span>}
              <div className="plan-header" style={{ color: plan.color }}>
                {plan.icon}
                <div>
                  <h3>{plan.name}</h3>
                  <span className="plan-price">{plan.price}</span>
                  <span className="plan-period">{plan.period}</span>
                </div>
              </div>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={14} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className="btn-primary store-buy-btn"
                style={{ background: plan.color }}
              >
                Subscribe
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* À la carte items */}
      <section className="store-section">
        <div className="store-section-header">
          <Zap size={16} />
          <h2>Power-Ups</h2>
        </div>
        <div className="store-grid">
          {storeItems.map((item) => (
            <div
              key={item.id}
              className="store-item"
              onClick={() => setSelectedItem(item)}
            >
              {item.tag && (
                <span className="store-item-tag" style={{ background: item.tagColor }}>
                  {item.tag}
                </span>
              )}
              <div className="store-item-icon" style={{ color: item.color, background: `${item.color}15` }}>
                {item.icon}
              </div>
              <div className="store-item-info">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              <div className="store-item-price">
                <span>{item.price}</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Purchase detail modal */}
      {selectedItem && (
        <div className="store-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="store-modal" onClick={(e) => e.stopPropagation()}>
            <button className="store-modal-close" onClick={() => setSelectedItem(null)}>
              <X size={20} />
            </button>
            <div className="store-modal-icon" style={{ color: selectedItem.color, background: `${selectedItem.color}15` }}>
              {selectedItem.icon}
            </div>
            <h2>{selectedItem.name}</h2>
            <p className="store-modal-desc">{selectedItem.description}</p>
            <ul className="store-modal-features">
              {selectedItem.features.map((f) => (
                <li key={f}>
                  <Check size={16} style={{ color: selectedItem.color }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="btn-primary store-modal-buy"
              style={{ background: selectedItem.color }}
            >
              Buy for {selectedItem.price}
            </button>
            <p className="store-modal-note">One-time purchase. Cancel anytime.</p>
          </div>
        </div>
      )}

      <footer className="store-footer">
        <p>Secure payments via Apple Pay / Google Pay</p>
        <p>Prices may vary by region. Subscriptions auto-renew.</p>
      </footer>
    </div>
  );
}
