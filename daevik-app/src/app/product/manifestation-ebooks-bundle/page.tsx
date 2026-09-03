'use client';

import Head from 'next/head';
import React, { useEffect, useState, useRef } from 'react';
import { trackFbEvent } from '@/lib/fb-client';
import { trackGoogleViewItem } from '@/lib/google-client';

// SVG Icons
const CheckCircle = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const XCircle = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const ArrowRight = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const ChevronDown = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;

// Premium Section Icons
const BookIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;
const SparkleIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path></svg>;

const CHECKOUT_URL = "/checkout/manifestation-ebooks-bundle";

export default function ManifestationBundlePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const eventFired = useRef(false);

  // Track Facebook Events on load
  useEffect(() => {
    if (eventFired.current) return;
    eventFired.current = true;
    
    // Client-side ViewContent
    trackFbEvent('ViewContent', {
      content_name: '5 Powerful Manifestation Ebooks Bundle',
      content_ids: ['manifestation-ebooks-bundle'],
      content_type: 'product',
      value: 149,
      currency: 'INR'
    });

    // Google Ads & GA4 view_item event
    trackGoogleViewItem({
      id: 'manifestation-ebooks-bundle',
      name: '5 Powerful Manifestation Ebooks Bundle',
      price: 149,
      currency: 'INR',
    });
  }, []);
  
  return (
    <>
      <Head>
        <title>5 Powerful Manifestation Ebooks Bundle | Daevik</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="landing-page">
        {/* --- SECTION 1: STICKY TOP BAR --- */}
        <div className="top-bar">
          <div className="container top-bar-content">
            <span className="top-bar-text">✨ <strong>Unlock Your True Potential</strong> • Attract Abundance → Manifest Your Dream Life</span>
            <a href={CHECKOUT_URL} className="top-bar-cta">GET THE BUNDLE <ArrowRight /></a>
          </div>
        </div>

        {/* --- SECTION 2: HERO SECTION --- */}
        <section className="hero">
          <div className="container hero-container">
            <div className="hero-content animate-fade-in-up">
              <div className="hero-badge">THE ULTIMATE MANIFESTATION COLLECTION</div>
              <h1 className="hero-headline">
                Rewire Your Mind For <span className="highlight-gold">Success, Wealth & Abundance.</span>
              </h1>
              <h2 className="hero-subheadline">
                5 Powerful Ebooks to help you master the Law of Attraction, manifest your deepest desires, and transform your reality.
              </h2>
              <p className="hero-support">
                Stop wishing. Start manifesting. Get the exact frameworks to align your energy and attract the life you deserve.
              </p>
              
              <div className="hero-cta-wrapper">
                <a href={CHECKOUT_URL} className="btn-buy-large pulse-animation">
                  🚀 BUY NOW — GET INSTANT ACCESS
                </a>
                <p className="microcopy">Instant PDF Access • Life-time Updates • One-Time Payment</p>
                
                <div className="price-tag">
                  <span className="price">₹149</span>
                  <span className="price-note">A small investment for a massive transformation.</span>
                </div>
              </div>

              <div className="reviews-badge">
                <div className="stars">★★★★★</div>
                <span>Trusted by 10,000+ Action Takers.</span>
              </div>
            </div>
            
            <div className="hero-mockup animate-fade-in">
              <div className="mockup-container">
                <div className="mockup-edition-badge">5-IN-1 BUNDLE</div>
                <img 
                  src="/product-images/manifestation-ebooks-bundle.jpg" 
                  alt="Manifestation Ebooks Bundle" 
                  className="ebook-mockup"
                />
                
                {/* Subtle floating elements */}
                <div className="float-element float-1">✨</div>
                <div className="float-element float-2">🌟</div>
                <div className="float-element float-3">💫</div>
                <div className="float-element float-4">🧘‍♀️</div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: PROBLEM / AGITATION --- */}
        <section className="problems section-light">
          <div className="container">
            <h2 className="section-title text-center">Are You Working Hard But Still Feeling Stuck?</h2>
            
            <div className="problem-cards">
              <div className="problem-card">
                <div className="problem-icon"><XCircle /></div>
                <p>“I have big dreams, but no clear path to achieve them.”</p>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><XCircle /></div>
                <p>“Negative thoughts constantly hold me back.”</p>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><XCircle /></div>
                <p>“I feel like I'm repelling success instead of attracting it.”</p>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><XCircle /></div>
                <p>“I've tried manifestation, but it never works for me.”</p>
              </div>
            </div>
            
            <div className="problem-transition">
              <h3>The problem isn't your capability. It's your alignment.</h3>
              <p>When your subconscious mind is aligned with your desires, manifesting becomes effortless.</p>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: WHAT YOU GET --- */}
        <section className="what-you-get">
          <div className="container">
            <h2 className="section-title text-center">What's Inside This Life-Changing Bundle?</h2>
            
            <div className="product-grid">
              {/* Card 1 */}
              <div className="product-card">
                <div className="card-header">BOOK 1</div>
                <h3>Power of Visualization</h3>
                <p className="card-desc">How to manifest with crystal clear clarity and paint your future in your mind.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> See your future clearly</li>
                  <li><CheckCircle /> Focus energy intentionally</li>
                  <li><CheckCircle /> Believe in infinite potential</li>
                </ul>
              </div>

              {/* Card 2 */}
              <div className="product-card">
                <div className="card-header">BOOK 2</div>
                <h3>Attraction Mantra Secrets</h3>
                <p className="card-desc">Transform your mind and magnetize your dreams into reality with powerful mantras.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> Attract what you desire</li>
                  <li><CheckCircle /> Align thoughts & energy</li>
                  <li><CheckCircle /> Focus on what matters</li>
                </ul>
              </div>

              {/* Card 3 */}
              <div className="product-card">
                <div className="card-header">BOOK 3</div>
                <h3>365 Manifestation Power</h3>
                <p className="card-desc">One day. One intention. Infinite possibilities for your daily manifestation practice.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> Daily intention setting</li>
                  <li><CheckCircle /> Step-by-step daily alignment</li>
                  <li><CheckCircle /> Build unshakeable belief</li>
                </ul>
              </div>

              {/* Card 4 */}
              <div className="product-card">
                <div className="card-header">BOOK 4 & 5</div>
                <h3>Mastering Manifestation & Maestro</h3>
                <p className="card-desc">Advanced techniques to achieve your ideal lifestyle and network your way to success.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> Advanced manifestation techniques</li>
                  <li><CheckCircle /> Build stronger connections</li>
                  <li><CheckCircle /> Inspire and lead with confidence</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: SHOW THE VALUE --- */}
        <section className="value-stack section-light">
          <div className="container">
            <div className="value-box">
              <h2 className="section-title text-center">The Complete Value Stack</h2>
              
              <div className="value-line">
                <span className="value-item">Power of Visualization</span>
                <span className="value-price">Value: ₹1,999</span>
              </div>
              <div className="value-line">
                <span className="value-item">Attraction Mantra Secrets</span>
                <span className="value-price">Value: ₹1,999</span>
              </div>
              <div className="value-line">
                <span className="value-item">365 Manifestation Power</span>
                <span className="value-price">Value: ₹1,999</span>
              </div>
              <div className="value-line">
                <span className="value-item">Mastering Manifestation</span>
                <span className="value-price">Value: ₹1,999</span>
              </div>
              <div className="value-line">
                <span className="value-item">Manifesting Maestro</span>
                <span className="value-price">Value: ₹2,003</span>
              </div>
              
              <div className="value-total">
                <span>TOTAL SUGGESTED VALUE: <s>₹9,999</s></span>
                <div className="today-price">TODAY: ₹149</div>
              </div>
              
              <h3 className="text-center" style={{ margin: '30px 0 20px', color: 'var(--text-main)' }}>GET ALL 5 BOOKS FOR JUST ₹149</h3>
              <a href={CHECKOUT_URL} className="btn-buy-large mx-auto">
                🚀 BUY NOW — GET INSTANT ACCESS
              </a>
            </div>
          </div>
        </section>

        {/* --- SECTION 6: WHO THIS IS FOR --- */}
        <section className="who-for">
          <div className="container">
            <h2 className="section-title text-center">Who Will Benefit From This Bundle?</h2>
            
            <div className="who-grid">
              <div className="who-card">
                <span className="emoji">🧘‍♀️</span>
                <h3>Action Takers Ready for Change</h3>
              </div>
              <div className="who-card">
                <span className="emoji">🧠</span>
                <h3>Those Battling Negative Thoughts</h3>
              </div>
              <div className="who-card">
                <span className="emoji">💼</span>
                <h3>Entrepreneurs & Creators</h3>
              </div>
              <div className="who-card">
                <span className="emoji">✨</span>
                <h3>Anyone Seeking Financial Abundance</h3>
              </div>
              <div className="who-card">
                <span className="emoji">❤️</span>
                <h3>Individuals Desiring Better Relationships</h3>
              </div>
              <div className="who-card">
                <span className="emoji">🎯</span>
                <h3>People Wanting Clarity in Life</h3>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 7: INSIDE THE BUNDLE --- */}
        <section className="preview section-light">
          <div className="container">
            <h2 className="section-title text-center">Inside The Bundle</h2>
            <p className="text-center mb-10 text-lg" style={{ color: 'var(--text-muted)' }}>Get instant access to all 5 high-quality guides.</p>
            
            <div className="preview-grid" style={{ gap: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="preview-page group" style={{ maxWidth: '200px' }}>
                  <div className="page-img-v2" style={{ background: 'transparent', padding: '0', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                    <img src={`/product-images/manifestation-${num}.jpg`} alt={`Manifestation Book ${num}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                  </div>
                  <p>Guide {num}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <a href={CHECKOUT_URL} className="btn-buy-large mx-auto">
                🚀 GET ALL 5 BOOKS TODAY
              </a>
            </div>
          </div>
        </section>

        {/* --- SECTION 8: WHO IS THIS NOT FOR --- */}
        <section className="not-for section-darker">
          <div className="container">
            <div className="honesty-box">
              <h2 className="text-center mb-6 text-2xl font-bold">This bundle is NOT for you if…</h2>
              <ul className="not-for-list">
                <li><span className="x">❌</span> You expect magic without taking aligned action.</li>
                <li><span className="x">❌</span> You refuse to change your daily habits and mindset.</li>
                <li><span className="x">❌</span> You prefer to stay in a victim mentality.</li>
              </ul>
              <p className="text-center mt-6 text-lg font-medium highlight-gold">
                But if you're ready to reprogram your mind and attract true abundance, this is for you.
              </p>
            </div>
          </div>
        </section>

        {/* --- SECTION 9: FAQ --- */}
        <section className="faq section-light">
          <div className="container max-w-3xl mx-auto">
            <h2 className="section-title text-center">Frequently Asked Questions</h2>
            
            <div className="faq-container">
              {[
                {
                  q: "Is this a physical product?",
                  a: "No. This is a 100% digital product bundle. You will receive instant access to download the PDF ebooks immediately after purchase."
                },
                {
                  q: "How soon can I see results?",
                  a: "Manifestation is a personal journey. Some experience mindset shifts on day one, while major life changes follow consistent practice. These books provide the frameworks; your dedication drives the results."
                },
                {
                  q: "Are these books suitable for beginners?",
                  a: "Absolutely! The bundle is designed to take you from the very basics of the Law of Attraction to advanced manifestation techniques."
                },
                {
                  q: "How do I access my books after payment?",
                  a: "Once your payment is successful, you will instantly be redirected to a secure download page. You will also receive an email with the download link."
                }
              ].map((faq, idx) => (
                <div 
                  key={idx} 
                  className={`faq-item ${activeFaq === idx ? 'active' : ''}`}
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                >
                  <div className="faq-question">
                    {faq.q}
                    <ChevronDown className={`faq-icon ${activeFaq === idx ? 'rotated' : ''}`} />
                  </div>
                  <div className="faq-answer">
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 10: FINAL SALES SECTION --- */}
        <section className="final-sales">
          <div className="container text-center">
            <h2 className="hero-headline mb-4">Your Dream Reality Is Waiting.</h2>
            <p className="hero-subheadline mb-8">Take the first step towards a life of limitless abundance.</p>
            
            <div className="final-price-box">
              <div className="price text-6xl font-bold highlight-gold">₹149</div>
              <div className="text-sm font-semibold tracking-widest mt-2 mb-6" style={{color: "var(--text-muted)"}}>ONE-TIME PAYMENT</div>
              
              <div className="final-includes">
                <span>✓ 5 Premium Ebooks</span>
                <span>✓ Lifetime Access</span>
                <span>✓ Instant Download</span>
              </div>
              
              <a href={CHECKOUT_URL} className="btn-buy-large pulse-animation mx-auto mt-8">
                🚀 BUY NOW — GET INSTANT ACCESS
              </a>
              <p className="microcopy mt-4">Secure Payment • Instant Digital Delivery</p>
            </div>
          </div>
        </section>

        {/* --- SECTION 11: FOOTER --- */}
        <footer className="footer">
          <div className="container text-center">
            <p className="mb-4" style={{color: "var(--text-main)", fontWeight: 600}}>Digital Product • Instant Access</p>
            <p className="mb-6 text-sm" style={{color: "var(--text-muted)"}}>© 2026 Daevik. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms & Conditions</a>
              <a href="#">Refund Policy</a>
              <a href="mailto:support@daevik.in">Contact</a>
            </div>
          </div>
        </footer>

        {/* STICKY MOBILE CTA */}
        <div className="sticky-mobile-cta">
          <a href={CHECKOUT_URL} className="btn-buy-mobile">
            GET THE BUNDLE — ₹149 →
          </a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --primary-bg: #F4F1FA;
          --secondary-bg: #FFFFFF;
          --tertiary-bg: #EAE3F2;
          --blue: #4A148C;
          --emerald: #7B1FA2;
          --gold: #D4AF37;
          --text-main: #2D1B4E;
          --text-muted: #6B5B95;
          --border: #D1C4E9;
        }
        
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: var(--primary-bg); color: var(--text-main); }
        
        .landing-page { overflow-x: hidden; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .text-center { text-align: center; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-10 { margin-bottom: 2.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-12 { margin-top: 3rem; }
        
        .highlight-gold { color: var(--gold); }
        
        /* Typography */
        .section-title { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; line-height: 1.2; letter-spacing: -0.02em; color: var(--text-main); }
        @media (max-width: 768px) { .section-title { font-size: 2rem; } }
        
        /* Sections */
        section { padding: 5rem 0; }
        .section-light { background-color: var(--secondary-bg); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .section-darker { background-color: var(--tertiary-bg); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        
        /* Buttons */
        .btn-buy-large {
          display: flex; align-items: center; justify-content: center; text-align: center;
          background: linear-gradient(135deg, #FFD700 0%, #D4AF37 100%); color: #111;
          padding: 18px 32px; font-size: 1.125rem; font-weight: 800;
          border-radius: 8px; text-decoration: none;
          box-shadow: 0 4px 14px 0 rgba(212, 175, 55, 0.4);
          transition: all 0.2s ease; width: fit-content; text-transform: uppercase;
        }
        .btn-buy-large:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6); }
        
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(212, 175, 55, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
        }
        
        /* Top Bar */
        .top-bar { background-color: #2D1B4E; color: white; padding: 10px 0; font-size: 0.875rem; position: sticky; top: 0; z-index: 50; }
        .top-bar-content { display: flex; justify-content: space-between; align-items: center; }
        .top-bar-cta { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: var(--gold); text-decoration: none; border-bottom: 1px solid var(--gold); }
        @media (max-width: 768px) { .top-bar-content { flex-direction: column; gap: 8px; text-align: center; } }
        
        /* Hero */
        .hero { background: var(--primary-bg); padding-top: 4rem; overflow: hidden; }
        .hero-container { display: grid; grid-template-columns: 1.2fr 1fr; gap: 4rem; align-items: center; }
        .hero-badge { display: inline-block; background-color: rgba(212, 175, 55, 0.2); color: #B8860B; padding: 6px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 1.5rem; border: 1px solid #D4AF37; }
        .hero-headline { font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin: 0 0 1.5rem; letter-spacing: -0.03em; color: var(--text-main); }
        .hero-subheadline { font-size: 1.25rem; font-weight: 500; color: var(--text-muted); line-height: 1.5; margin: 0 0 1.5rem; }
        .hero-support { font-size: 1rem; color: #4B3C6A; margin-bottom: 2.5rem; }
        
        .microcopy { font-size: 0.75rem; color: var(--text-muted); margin-top: 12px; font-weight: 500; }
        .price-tag { display: flex; align-items: center; gap: 12px; margin-top: 24px; }
        .price { font-size: 2.5rem; font-weight: 800; color: var(--text-main); }
        .price-note { font-size: 0.875rem; color: var(--text-muted); max-width: 150px; line-height: 1.3; }
        
        .reviews-badge { display: inline-flex; flex-direction: column; background: var(--secondary-bg); padding: 12px 16px; border-radius: 8px; margin-top: 2rem; border: 1px solid var(--border); box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .stars { color: var(--gold); font-size: 1.25rem; letter-spacing: 2px; margin-bottom: 4px; }
        .reviews-badge span { font-size: 0.875rem; color: var(--text-muted); font-weight: 600; }
        
        .hero-mockup { position: relative; }
        .mockup-container { position: relative; perspective: 1000px; padding: 20px; }
        .ebook-mockup { width: 100%; max-width: 450px; height: auto; border-radius: 12px; box-shadow: -10px 10px 30px rgba(74, 20, 140, 0.2), 0 0 0 1px rgba(0,0,0,0.05); transform: rotateY(-10deg) rotateX(2deg); transition: transform 0.3s; }
        .mockup-edition-badge { position: absolute; top: -10px; right: 20px; background: var(--blue); color: white; font-weight: 800; padding: 8px 12px; border-radius: 6px; transform: rotate(10deg); box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 10; }
        
        .float-element { position: absolute; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid var(--border); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); animation: float 6s infinite ease-in-out; }
        .float-1 { top: 10%; left: 0; width: 50px; height: 50px; animation-delay: 0s; }
        .float-2 { bottom: 20%; right: -10px; width: 40px; height: 40px; animation-delay: 1s; }
        .float-3 { top: 40%; right: 10%; width: 50px; height: 50px; animation-delay: 2s; }
        .float-4 { bottom: 10%; left: 10%; width: 60px; height: 60px; animation-delay: 3s; }
        
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        
        @media (max-width: 992px) {
          .hero-container { grid-template-columns: 1fr; text-align: center; gap: 2rem; }
          .hero-headline { font-size: 2.5rem; }
          .btn-buy-large { margin: 0 auto; }
          .price-tag { justify-content: center; text-align: left; }
          .reviews-badge { align-items: center; }
          .ebook-mockup { transform: none; max-width: 350px; margin: 0 auto; display: block; }
        }
        
        /* Problems */
        .problem-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin: 3rem 0; }
        .problem-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); display: flex; align-items: flex-start; gap: 12px; }
        .problem-icon { color: #EF4444; flex-shrink: 0; }
        .problem-card p { margin: 0; font-weight: 600; color: var(--text-main); }
        .problem-transition { text-align: center; max-width: 600px; margin: 4rem auto 0; }
        .problem-transition h3 { font-size: 1.5rem; font-weight: 700; color: var(--blue); margin-bottom: 0.5rem; }
        .problem-transition p { font-size: 1.125rem; color: var(--text-muted); }
        
        /* What you get */
        .what-you-get { background-color: var(--primary-bg); }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 3rem; }
        .product-card { background: white; padding: 2rem; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); transition: transform 0.3s; }
        .product-card:hover { transform: translateY(-5px); border-color: var(--gold); box-shadow: 0 20px 25px -5px rgba(212, 175, 55, 0.15); }
        .card-header { font-size: 0.75rem; font-weight: 800; color: var(--blue); letter-spacing: 0.1em; margin-bottom: 1rem; }
        .product-card h3 { font-size: 1.5rem; margin: 0 0 0.5rem; color: var(--text-main); }
        .card-desc { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; min-height: 45px; }
        .feature-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .feature-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.95rem; color: #4A4A4A; font-weight: 500; }
        .feature-list svg { color: var(--gold); flex-shrink: 0; width: 20px; height: 20px; }
        
        /* Value Stack */
        .value-box { background: white; border-radius: 20px; padding: 4rem 2rem; max-width: 700px; margin: 0 auto; box-shadow: 0 20px 40px -15px rgba(74, 20, 140, 0.1); border: 2px solid var(--gold); }
        .value-line { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px dashed var(--border); font-weight: 600; }
        .value-item { color: var(--text-main); font-size: 1.125rem; }
        .value-price { color: var(--text-muted); }
        .value-total { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 0 0; margin-top: 1rem; font-weight: 800; text-align: center; }
        .value-total span { color: var(--text-muted); font-size: 1rem; margin-bottom: 0.5rem; text-align: center; }
        .today-price { font-size: 3.5rem; color: var(--gold); line-height: 1; text-align: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.05); }
        
        /* Who For */
        .who-for { background: var(--primary-bg); }
        .who-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
        .who-card { background: var(--secondary-bg); padding: 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; border: 1px solid var(--border); box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
        .who-card .emoji { font-size: 2.5rem; }
        .who-card h3 { margin: 0; font-size: 1.125rem; font-weight: 700; color: var(--text-main); }
        
        /* Not For */
        .honesty-box { background: var(--secondary-bg); border: 1px solid var(--border); border-radius: 16px; padding: 3rem 2rem; max-width: 700px; margin: 0 auto; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02); }
        .not-for-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; font-size: 1.125rem; }
        .not-for-list li { display: flex; gap: 1rem; align-items: center; color: var(--text-main); font-weight: 500;}
        .not-for-list .x { font-size: 1.25rem; }
        
        /* FAQ */
        .faq-container { display: flex; flex-direction: column; gap: 1rem; }
        .faq-item { background: white; border-radius: 8px; border: 1px solid var(--border); overflow: hidden; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
        .faq-item:hover { border-color: var(--blue); }
        .faq-question { padding: 1.25rem; font-weight: 700; color: var(--text-main); display: flex; justify-content: space-between; align-items: center; font-size: 1.05rem; }
        .faq-icon { transition: transform 0.3s ease; color: var(--blue); }
        .faq-icon.rotated { transform: rotate(180deg); }
        .faq-answer { padding: 0 1.25rem; max-height: 0; overflow: hidden; color: #4B3C6A; line-height: 1.6; transition: max-height 0.3s ease, padding 0.3s ease; font-weight: 500; }
        .faq-item.active .faq-answer { max-height: 200px; padding: 0 1.25rem 1.25rem; }
        
        /* Final Sales */
        .final-sales { background: var(--tertiary-bg); padding: 6rem 0; border-top: 1px solid var(--border); }
        .final-price-box { background: white; padding: 3rem 2rem; border-radius: 20px; max-width: 600px; margin: 0 auto; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
        .final-includes { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem; color: var(--text-main); font-weight: 700; font-size: 1.125rem; margin-top: 1.5rem; }
        .final-includes span { display: flex; align-items: center; gap: 0.5rem; color: var(--blue); }
        
        /* Footer */
        .footer { background: var(--primary-bg); padding: 3rem 0 6rem; border-top: 1px solid var(--border); }
        .footer-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 1.5rem; }
        .footer-links a { color: var(--text-muted); text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: color 0.2s; }
        .footer-links a:hover { color: var(--blue); }
        
        /* Sticky Mobile CTA */
        .sticky-mobile-cta { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 12px 20px; box-shadow: 0 -4px 10px rgba(0,0,0,0.1); z-index: 100; border-top: 1px solid var(--border); }
        .btn-buy-mobile { display: block; width: 100%; text-align: center; background: linear-gradient(135deg, #FFD700 0%, #D4AF37 100%); color: #111; padding: 14px 20px; font-weight: 800; border-radius: 8px; text-decoration: none; font-size: 1.125rem; box-shadow: 0 4px 10px rgba(212, 175, 55, 0.4); text-transform: uppercase; }
        
        @media (max-width: 768px) {
          .sticky-mobile-cta { display: block; }
          .final-price-box { padding: 2rem 1.5rem; }
        }
      `}} />
    </>
  );
}
