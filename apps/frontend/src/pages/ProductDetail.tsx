import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Heart, Plus, Minus, Share2, ChevronDown, ChevronUp,
  Star, Shield, Truck, RotateCcw, Check, X, ShoppingBag,
  Copy, ArrowLeft
} from 'lucide-react';
import './ProductDetail.css';

/* ─── size options with price multipliers ─── */
const SIZE_OPTIONS = [
  { label: '10ml',  multiplier: 0.5  },
  { label: '30ml',  multiplier: 0.75 },
  { label: '50ml',  multiplier: 1    },
  { label: '100ml', multiplier: 1.6  },
];

/* ─── accordion data ─── */
interface AccordionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const products = useProductStore(state => state.products);
  const product = products.find(p => p.id === Number(id));
  const { items, addToCart, updateQuantity } = useCartStore();
  const { profile, toggleWishlist } = useAuthStore();

  const cartItem = product ? items.find(item => item.id === product.id) : null;
  const isWishlisted = product ? profile?.wishlist?.includes(product.id) : false;

  /* ─── state ─── */
  const [activeMedia, setActiveMedia] = useState(0);
  const [selectedSize, setSelectedSize] = useState(2); // default 50ml
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');
  const [showModal, setShowModal] = useState(false);
  const [modalMedia, setModalMedia] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* close share menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── media helpers ─── */
  const availableMedia = product
    ? [
        ...product.images.filter(Boolean).map((url, i) => ({ type: 'image' as const, url, idx: i })),
        ...(product.videoUrl ? [{ type: 'video' as const, url: product.videoUrl, idx: product.images.length }] : []),
      ]
    : [];

  const currentMedia = availableMedia[activeMedia] || availableMedia[0];

  const handleNext = useCallback(() => {
    setActiveMedia(prev => (prev + 1) % availableMedia.length);
  }, [availableMedia.length]);

  const handlePrev = useCallback(() => {
    setActiveMedia(prev => (prev - 1 + availableMedia.length) % availableMedia.length);
  }, [availableMedia.length]);

  /* ─── swipe handlers ─── */
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) < minSwipeDistance) return;
    if (distance > 0) handleNext();
    else handlePrev();
  };

  /* ─── computed price ─── */
  const computedPrice = product
    ? Math.round(product.price * SIZE_OPTIONS[selectedSize].multiplier)
    : 0;
  const computedOriginal = product
    ? Math.round(product.originalPrice * SIZE_OPTIONS[selectedSize].multiplier)
    : 0;
  const discountPct = product
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  /* ─── add to cart with animation ─── */
  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      title: `${product.title} — ${SIZE_OPTIONS[selectedSize].label}`,
      price: computedPrice,
      image: product.images[0],
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  /* ─── share helpers ─── */
  const shareUrl = window.location.href;
  const shareText = `Check out ${product?.title} on LUMEN!`;

  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      instagram: `https://instagram.com/`,
    };
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
    } else {
      window.open(urls[platform], '_blank');
    }
    setShowShareMenu(false);
  };

  /* ─── related products ─── */
  const relatedProducts = product
    ? products
        .filter(p => p.id !== product.id && p.category === product.category)
        .slice(0, 4)
    : [];

  /* ─── accordion items ─── */
  const accordionItems: AccordionItem[] = product
    ? [
        {
          id: 'description',
          title: 'Description',
          icon: <ShoppingBag size={18} />,
          content: <p className="accordion-text">{product.description}</p>,
        },
        {
          id: 'notes',
          title: 'Fragrance Notes',
          icon: <Star size={18} />,
          content: (
            <div className="accordion-notes">
              {product.notes.map((note, i) => (
                <span key={i} className="note-tag">{note}</span>
              ))}
            </div>
          ),
        },
        {
          id: 'shipping',
          title: 'Shipping Info',
          icon: <Truck size={18} />,
          content: (
            <div className="accordion-text">
              <p>🚚 <strong>Free shipping</strong> on orders over ₹1,000</p>
              <p>📦 Standard delivery: 3–5 business days</p>
              <p>⚡ Express delivery: 1–2 business days (₹199)</p>
              <p>🌍 We ship across India</p>
            </div>
          ),
        },
        {
          id: 'returns',
          title: 'Return Policy',
          icon: <RotateCcw size={18} />,
          content: (
            <div className="accordion-text">
              <p>↩️ <strong>7-day easy returns</strong> on all unopened products</p>
              <p>🔒 100% authentic products guaranteed</p>
              <p>💰 Full refund to original payment method</p>
              <p>📞 Contact support@lumen.com for return requests</p>
            </div>
          ),
        },
      ]
    : [];

  /* ─── not found ─── */
  if (!product) {
    return (
      <div className="pd-page">
        <div className="pd-notfound">
          <div className="pd-notfound-icon">🔍</div>
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <button className="pd-btn-primary" onClick={() => navigate('/shop')}>
            <ArrowLeft size={18} /> Back to Shop
          </button>
        </div>
      </div>
    );
  }

  /* ─── stars renderer ─── */
  const fullStars = Math.floor(product.rating || 0);
  const hasHalf = (product.rating || 0) - fullStars >= 0.3;

  return (
    <div className="pd-page">
      {/* ─── breadcrumb ─── */}
      <div className="pd-breadcrumb">
        <span onClick={() => navigate('/')}>Home</span>
        <span className="sep">/</span>
        <span onClick={() => navigate('/shop')}>Shop</span>
        <span className="sep">/</span>
        <span className="current">{product.title}</span>
      </div>

      {/* ─── main layout ─── */}
      <div className="pd-container">
        {/* ─── LEFT: image gallery ─── */}
        <div className="pd-gallery-col">
          <div
            className="pd-main-media"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {currentMedia?.type === 'video' ? (
              <video
                src={currentMedia.url}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="pd-main-video"
              />
            ) : (
              <img
                src={currentMedia?.url || product.images[0]}
                alt={product.title}
                className="pd-main-img"
                onClick={() => { setModalMedia(activeMedia); setShowModal(true); }}
              />
            )}

            {/* badge */}
            {product.badge && (
              <span className={`pd-badge pd-badge--${product.badge}`}>
                {product.badge.replace('-', ' ')}
              </span>
            )}

            {/* nav arrows */}
            {availableMedia.length > 1 && (
              <>
                <button className="pd-nav-btn pd-nav-btn--prev" onClick={handlePrev}>
                  ‹
                </button>
                <button className="pd-nav-btn pd-nav-btn--next" onClick={handleNext}>
                  ›
                </button>
              </>
            )}

            {/* click to enlarge hint */}
            {currentMedia?.type === 'image' && (
              <div className="pd-enlarge-hint" onClick={() => { setModalMedia(activeMedia); setShowModal(true); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  <path d="M11 8v6M8 11h6"/>
                </svg>
                Enlarge
              </div>
            )}
          </div>

          {/* thumbnail strip */}
          {availableMedia.length > 1 && (
            <div className="pd-thumbs">
              {availableMedia.map((m, i) => (
                <button
                  key={i}
                  className={`pd-thumb ${activeMedia === i ? 'active' : ''}`}
                  onClick={() => setActiveMedia(i)}
                >
                  {m.type === 'video' ? (
                    <div className="pd-thumb-video">
                      <span>▶</span>
                    </div>
                  ) : (
                    <img src={m.url} alt={`${product.title} view ${i + 1}`} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── RIGHT: product info ─── */}
        <div className="pd-info-col">
          {/* brand */}
          <div className="pd-brand">LUMEN</div>

          {/* title */}
          <h1 className="pd-title">{product.title}</h1>

          {/* rating */}
          <div className="pd-rating">
            <div className="pd-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={`pd-star ${i < fullStars ? 'filled' : i === fullStars && hasHalf ? 'half' : ''}`}
                />
              ))}
            </div>
            <span className="pd-rating-value">{product.rating}</span>
            <span className="pd-reviews">({product.reviewsCount} reviews)</span>
          </div>

          {/* price */}
          <div className="pd-price-block">
            <span className="pd-price">₹{computedPrice}</span>
            {computedOriginal > computedPrice && (
              <>
                <span className="pd-original-price">₹{computedOriginal}</span>
                <span className="pd-discount">-{discountPct}%</span>
              </>
            )}
          </div>

          {/* size selector */}
          <div className="pd-size-selector">
            <label className="pd-label">Choose Size</label>
            <div className="pd-size-options">
              {SIZE_OPTIONS.map((size, i) => (
                <button
                  key={size.label}
                  className={`pd-size-btn ${selectedSize === i ? 'active' : ''}`}
                  onClick={() => setSelectedSize(i)}
                >
                  <span className="pd-size-label">{size.label}</span>
                  <span className="pd-size-price">₹{Math.round(product.price * size.multiplier)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* fragrance notes */}
          <div className="pd-notes">
            <label className="pd-label">Fragrance Notes</label>
            <div className="pd-note-tags">
              {product.notes.map((note, i) => (
                <span key={i} className="pd-note-tag">{note}</span>
              ))}
            </div>
          </div>

          {/* action buttons */}
          <div className="pd-actions">
            {cartItem ? (
              <div className="pd-quantity-control">
                <button
                  className="pd-qty-btn"
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                >
                  <Minus size={20} />
                </button>
                <span className="pd-qty-value">{cartItem.quantity} in cart</span>
                <button
                  className="pd-qty-btn"
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                >
                  <Plus size={20} />
                </button>
              </div>
            ) : (
              <button
                className={`pd-btn-primary pd-add-cart ${addedToCart ? 'added' : ''}`}
                onClick={handleAddToCart}
              >
                {addedToCart ? (
                  <><Check size={20} /> Added to Cart</>
                ) : (
                  <><ShoppingBag size={20} /> Add to Cart — ₹{computedPrice}</>
                )}
              </button>
            )}

            <button
              className={`pd-btn-wishlist ${isWishlisted ? 'active' : ''}`}
              onClick={() =>
                profile
                  ? toggleWishlist(product.id)
                  : alert('Please login to use your wishlist!')
              }
            >
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
          </div>

          {/* trust badges */}
          <div className="pd-trust">
            <div className="pd-trust-item">
              <Truck size={16} />
              <span>Free Shipping ₹1000+</span>
            </div>
            <div className="pd-trust-item">
              <Shield size={16} />
              <span>100% Authentic</span>
            </div>
            <div className="pd-trust-item">
              <RotateCcw size={16} />
              <span>7-Day Returns</span>
            </div>
          </div>

          {/* share */}
          <div className="pd-share" ref={shareRef}>
            <button
              className="pd-share-btn"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              <Share2 size={16} /> Share
            </button>
            {showShareMenu && (
              <div className="pd-share-menu">
                <button onClick={() => handleShare('whatsapp')}>💬 WhatsApp</button>
                <button onClick={() => handleShare('twitter')}>🐦 Twitter</button>
                <button onClick={() => handleShare('instagram')}>📸 Instagram</button>
                <button onClick={() => handleShare('copy')}>
                  <Copy size={14} /> Copy Link
                </button>
              </div>
            )}
          </div>

          {/* accordions */}
          <div className="pd-accordions">
            {accordionItems.map(item => (
              <div key={item.id} className={`pd-accordion ${openAccordion === item.id ? 'open' : ''}`}>
                <button
                  className="pd-accordion-header"
                  onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                >
                  <span className="pd-accordion-title">
                    {item.icon} {item.title}
                  </span>
                  {openAccordion === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div className="pd-accordion-body">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── related products ─── */}
      {relatedProducts.length > 0 && (
        <div className="pd-related">
          <h2 className="pd-related-title">You May Also Like</h2>
          <div className="pd-related-grid">
            {relatedProducts.map(rp => (
              <div
                key={rp.id}
                className="pd-related-card"
                onClick={() => { navigate(`/product/${rp.id}`); window.scrollTo(0, 0); }}
              >
                <div className="pd-related-img">
                  <img src={rp.images[0]} alt={rp.title} loading="lazy" />
                  {rp.badge && (
                    <span className={`pd-badge pd-badge--${rp.badge} sm`}>
                      {rp.badge.replace('-', ' ')}
                    </span>
                  )}
                </div>
                <div className="pd-related-info">
                  <h3>{rp.title}</h3>
                  <div className="pd-related-price">
                    <span className="pd-rp-current">₹{rp.price}</span>
                    <span className="pd-rp-original">₹{rp.originalPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── mobile sticky buy bar ─── */}
      {isMobile && (
        <div className="pd-sticky-bar">
          <div className="pd-sticky-info">
            <span className="pd-sticky-title">{product.title}</span>
            <span className="pd-sticky-price">₹{computedPrice}</span>
          </div>
          {cartItem ? (
            <div className="pd-sticky-qty">
              <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}>
                <Minus size={16} />
              </button>
              <span>{cartItem.quantity}</span>
              <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}>
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button className="pd-sticky-btn" onClick={handleAddToCart}>
              <ShoppingBag size={16} /> Add
            </button>
          )}
        </div>
      )}

      {/* ─── image modal ─── */}
      {showModal && (
        <div className="pd-modal" onClick={() => setShowModal(false)}>
          <div className="pd-modal-content" onClick={e => e.stopPropagation()}>
            <button className="pd-modal-close" onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            {availableMedia.length > 1 && (
              <>
                <button
                  className="pd-modal-nav pd-modal-nav--prev"
                  onClick={() => setModalMedia(prev => (prev - 1 + availableMedia.length) % availableMedia.length)}
                >
                  ‹
                </button>
                <button
                  className="pd-modal-nav pd-modal-nav--next"
                  onClick={() => setModalMedia(prev => (prev + 1) % availableMedia.length)}
                >
                  ›
                </button>
              </>
            )}
            {availableMedia[modalMedia]?.type === 'video' ? (
              <video
                src={availableMedia[modalMedia].url}
                autoPlay
                loop
                muted
                controls
                className="pd-modal-video"
              />
            ) : (
              <img
                src={availableMedia[modalMedia]?.url || product.images[0]}
                alt={product.title}
                className="pd-modal-img"
              />
            )}
            <div className="pd-modal-counter">
              {modalMedia + 1} / {availableMedia.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
