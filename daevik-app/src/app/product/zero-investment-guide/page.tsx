'use client';

import Head from 'next/head';
import React, { useEffect, useState } from 'react';

// SVG Icons
const CheckCircle = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const XCircle = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const ArrowRight = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const ChevronDown = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;

// Premium Section Icons
const ListIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const RupeeIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/><path d="M9 13l8.5 8"/></svg>;
const SparkleIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"></path></svg>;
const FileIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const UsersIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const CalendarIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;

const CHECKOUT_URL = "/checkout/zero-investment-guide";

export default function ZeroInvestmentGuidePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Track Facebook CAPI PageView on load
  useEffect(() => {
    fetch('/api/track/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'PageView',
        url: window.location.href,
      }),
    }).catch(() => {});
  }, []);
  
  return (
    <>
      <Head>
        <title>Zero Investment Side Income Guide for Indian Students</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="landing-page">
        {/* --- SECTION 1: STICKY TOP BAR --- */}
        <div className="top-bar">
          <div className="container top-bar-content">
            <span className="top-bar-text">🎓 <strong>Built for Indian Students</strong> • Learn a Skill → Find a Customer → Earn Your First ₹10,000</span>
            <a href={CHECKOUT_URL} className="top-bar-cta">GET THE GUIDE <ArrowRight /></a>
          </div>
        </div>

        {/* --- SECTION 2: HERO SECTION --- */}
        <section className="hero">
          <div className="container hero-container">
            <div className="hero-content animate-fade-in-up">
              <div className="hero-badge">THE ZERO-COST STUDENT INCOME PLAYBOOK</div>
              <h1 className="hero-headline">
                Your First <span className="highlight-emerald">₹10,000</span> Can Start With <span className="highlight-gold">₹0.</span>
              </h1>
              <h2 className="hero-subheadline">
                10 practical ways for Indian students to start earning without coding, expensive courses, or upfront investment.
              </h2>
              <p className="hero-support">
                Learn a simple skill. Use free tools. Find your first customer. Build your first ₹10,000.
              </p>
              
              <div className="hero-cta-wrapper">
                <a href={CHECKOUT_URL} className="btn-buy-large pulse-animation">
                  🚀 BUY NOW — GET INSTANT ACCESS
                </a>
                <p className="microcopy">Instant PDF Access • Student-Friendly • One-Time Payment</p>
                
                <div className="price-tag">
                  <span className="price">₹149</span>
                  <span className="price-note">Less than the cost of a typical college lunch.</span>
                </div>
              </div>

              <div className="reviews-badge">
                <div className="stars">★★★★★</div>
                <span>Built for students who want practical, realistic ways to start.</span>
              </div>
            </div>
            
            <div className="hero-mockup animate-fade-in">
              <div className="mockup-container">
                <div className="mockup-edition-badge">2026 EDITION</div>
                <img 
                  src="/product-images/zero-investment-guide.jpg" 
                  alt="Zero Investment Side Income Guide for Indian Students" 
                  className="ebook-mockup"
                  onError={(e) => {
                    // Fallback to a placeholder if the exact image isn't available yet
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x800/101A35/FFFFFF?text=Zero+Investment+Guide\\n\\nFor+Indian+Students';
                  }}
                />
                
                {/* Subtle floating elements */}
                <div className="float-element float-1">₹</div>
                <div className="float-element float-2">💻</div>
                <div className="float-element float-3">✨</div>
                <div className="float-element float-4">📈</div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: PROBLEM / AGITATION --- */}
        <section className="problems section-light">
          <div className="container">
            <h2 className="section-title text-center">Still Thinking You Need Money, Coding Skills or a Big Following to Start?</h2>
            
            <div className="problem-cards">
              <div className="problem-card">
                <div className="problem-icon"><XCircle /></div>
                <p>“I don't have money to invest.”</p>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><XCircle /></div>
                <p>“I don't know how to code.”</p>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><XCircle /></div>
                <p>“I don't know what skill to sell.”</p>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><XCircle /></div>
                <p>“I don't know how to find my first customer.”</p>
              </div>
            </div>
            
            <div className="problem-transition">
              <h3>You don't need to solve everything at once.</h3>
              <p>Start with one useful skill, one simple offer, and one real customer.</p>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: WHAT YOU GET --- */}
        <section className="what-you-get">
          <div className="container">
            <h2 className="section-title text-center">Everything You Need to Go From ₹0 → Your First ₹10,000</h2>
            
            <div className="product-grid">
              {/* Card 1 */}
              <div className="product-card">
                <div className="card-header">MAIN EBOOK</div>
                <h3>Zero Investment Side Income Guide</h3>
                <p className="card-desc">10 practical ways to earn your first ₹10,000 without coding or investment.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> Step-by-step explanations</li>
                  <li><CheckCircle /> Beginner-friendly methods</li>
                  <li><CheckCircle /> Free/low-cost tools</li>
                  <li><CheckCircle /> Customer acquisition strategies</li>
                  <li><CheckCircle /> Pricing guidance</li>
                  <li><CheckCircle /> Practical examples</li>
                </ul>
              </div>

              {/* Card 2 */}
              <div className="product-card">
                <div className="card-header">WORKBOOK</div>
                <h3>Student Side-Income Workbook</h3>
                <p className="card-desc">Turn theory into execution with ready-to-use worksheets.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> Skills inventory</li>
                  <li><CheckCircle /> Time planning</li>
                  <li><CheckCircle /> Offer builder</li>
                  <li><CheckCircle /> First 25 prospects worksheet</li>
                  <li><CheckCircle /> Outreach tracker</li>
                  <li><CheckCircle /> Income tracker</li>
                  <li><CheckCircle /> Client project brief</li>
                  <li><CheckCircle /> 30-day action plan</li>
                </ul>
              </div>

              {/* Card 3 */}
              <div className="product-card">
                <div className="card-header">AI TOOLKIT</div>
                <h3>AI Tools & Prompt Toolkit</h3>
                <p className="card-desc">Include useful AI-assisted workflows for maximum efficiency.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> Research</li>
                  <li><CheckCircle /> Content creation</li>
                  <li><CheckCircle /> Design</li>
                  <li><CheckCircle /> Writing</li>
                  <li><CheckCircle /> Productivity</li>
                  <li><CheckCircle /> Client work</li>
                </ul>
              </div>

              {/* Card 4 */}
              <div className="product-card">
                <div className="card-header">30-DAY CHALLENGE</div>
                <h3>Your First ₹10,000 Action Plan</h3>
                <p className="card-desc">A day-by-day roadmap to hit your first major milestone.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> Weekly goals</li>
                  <li><CheckCircle /> Daily actions</li>
                  <li><CheckCircle /> Prospecting targets</li>
                  <li><CheckCircle /> Progress tracking</li>
                  <li><CheckCircle /> Weekly review</li>
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
                <span className="value-item">MAIN GUIDE</span>
                <span className="value-price">Suggested Value: ₹299</span>
              </div>
              <div className="value-line">
                <span className="value-item">WORKBOOK</span>
                <span className="value-price">Suggested Value: ₹149</span>
              </div>
              <div className="value-line">
                <span className="value-item">AI TOOLKIT</span>
                <span className="value-price">Suggested Value: ₹199</span>
              </div>
              <div className="value-line">
                <span className="value-item">30-DAY CHALLENGE</span>
                <span className="value-price">Suggested Value: ₹99</span>
              </div>
              
              <div className="value-total">
                <span>TOTAL SUGGESTED VALUE: <s>₹746</s></span>
                <div className="today-price">TODAY: ₹149</div>
              </div>
              
              <h3 className="text-center" style={{ margin: '30px 0 20px' }}>GET EVERYTHING FOR JUST ₹149</h3>
              <a href={CHECKOUT_URL} className="btn-buy-large mx-auto">
                🚀 BUY NOW — GET INSTANT ACCESS
              </a>
            </div>
          </div>
        </section>

        {/* --- SECTION 6: WHO THIS IS FOR --- */}
        <section className="who-for">
          <div className="container">
            <h2 className="section-title text-center">Made For Students Who Want to Start — Not Just Watch Motivation Videos.</h2>
            
            <div className="who-grid">
              <div className="who-card">
                <span className="emoji">🎓</span>
                <h3>College Students</h3>
              </div>
              <div className="who-card">
                <span className="emoji">💻</span>
                <h3>Beginners With No Coding Skills</h3>
              </div>
              <div className="who-card">
                <span className="emoji">📱</span>
                <h3>Students Comfortable With Social Media</h3>
              </div>
              <div className="who-card">
                <span className="emoji">🚀</span>
                <h3>Students Interested in Freelancing</h3>
              </div>
              <div className="who-card">
                <span className="emoji">💰</span>
                <h3>Students Looking for Side Income</h3>
              </div>
              <div className="who-card">
                <span className="emoji">🧠</span>
                <h3>Students Who Want Practical AI Workflows</h3>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 7: HOW IT WORKS --- */}
        <section className="how-it-works section-light">
          <div className="container">
            <h2 className="section-title text-center">How It Works</h2>
            
            <div className="steps-container">
              <div className="step">
                <div className="step-num">01</div>
                <div className="step-content">
                  <h3>CHOOSE</h3>
                  <p>Choose a side-income method that matches your skills and available time.</p>
                </div>
              </div>
              
              <div className="step-arrow">↓</div>
              
              <div className="step">
                <div className="step-num">02</div>
                <div className="step-content">
                  <h3>LEARN</h3>
                  <p>Use the guide and free tools to prepare your service.</p>
                </div>
              </div>
              
              <div className="step-arrow">↓</div>
              
              <div className="step">
                <div className="step-num">03</div>
                <div className="step-content">
                  <h3>FIND</h3>
                  <p>Use the prospecting and outreach system to find potential customers.</p>
                </div>
              </div>
              
              <div className="step-arrow">↓</div>
              
              <div className="step">
                <div className="step-num">04</div>
                <div className="step-content">
                  <h3>EARN</h3>
                  <p>Deliver useful work, collect payment, and build toward your first ₹10,000.</p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <a href={CHECKOUT_URL} className="btn-buy-large mx-auto">
                START MY ₹10,000 JOURNEY
              </a>
            </div>
          </div>
        </section>

        {/* --- SECTION 8: WHAT MAKES THIS DIFFERENT --- */}
        <section className="different">
          <div className="container">
            <h2 className="section-title text-center">Not Another ‘Get Rich Quick’ Ebook.</h2>
            <h3 className="large-statement text-center">
              No overnight-income promises. No fake screenshots. No guaranteed earnings. No expensive investment required.
            </h3>
            <p className="different-sub text-center">
              This is a practical beginner's roadmap for learning a useful skill, creating a simple offer, finding potential customers, and taking consistent action.
            </p>
            
            <div className="credibility-grid">
              <div className="cred-card">
                <h4>PRACTICAL</h4>
                <p>Focus on actions you can actually take.</p>
              </div>
              <div className="cred-card">
                <h4>BEGINNER FRIENDLY</h4>
                <p>No advanced technical knowledge required.</p>
              </div>
              <div className="cred-card">
                <h4>LOW-COST</h4>
                <p>Built around free or accessible tools.</p>
              </div>
              <div className="cred-card">
                <h4>ACTION-FOCUSED</h4>
                <p>Worksheets turn information into execution.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 9: INSIDE THE BOOK --- */}
        <section className="preview section-light">
          <div className="container">
            <h2 className="section-title text-center">Inside The Book</h2>
            <p className="text-center mb-10 text-lg">See exactly what you're getting before you buy.</p>
            
            <div className="preview-grid">
              <div className="preview-page group">
                <div className="page-img-v2 gradient-1">
                  <div className="page-icon"><ListIcon /></div>
                  <div className="page-glass-badge text-center">Table of Contents</div>
                </div>
                <p>Table of Contents</p>
              </div>
              <div className="preview-page group">
                <div className="page-img-v2 gradient-2">
                  <div className="page-icon"><RupeeIcon /></div>
                  <div className="page-glass-badge text-center">10 Income Methods</div>
                </div>
                <p>10 Income Methods</p>
              </div>
              <div className="preview-page group">
                <div className="page-img-v2 gradient-3">
                  <div className="page-icon"><SparkleIcon /></div>
                  <div className="page-glass-badge text-center">AI Toolkit</div>
                </div>
                <p>AI Tools List</p>
              </div>
              <div className="preview-page group">
                <div className="page-img-v2 gradient-4">
                  <div className="page-icon"><FileIcon /></div>
                  <div className="page-glass-badge text-center">Worksheet</div>
                </div>
                <p>Prospects Worksheet</p>
              </div>
              <div className="preview-page group">
                <div className="page-img-v2 gradient-5">
                  <div className="page-icon"><UsersIcon /></div>
                  <div className="page-glass-badge text-center">Tracker</div>
                </div>
                <p>Outreach Tracker</p>
              </div>
              <div className="preview-page group">
                <div className="page-img-v2 gradient-6">
                  <div className="page-icon"><CalendarIcon /></div>
                  <div className="page-glass-badge text-center">Action Plan</div>
                </div>
                <p>30-Day Action Plan</p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <a href={CHECKOUT_URL} className="btn-buy-large mx-auto">
                🚀 BUY NOW — GET INSTANT ACCESS
              </a>
            </div>
          </div>
        </section>

        {/* --- SECTION 10: WHO IS THIS NOT FOR --- */}
        <section className="not-for section-darker">
          <div className="container">
            <div className="honesty-box">
              <h2 className="text-center mb-6 text-2xl font-bold">This guide is NOT for you if…</h2>
              <ul className="not-for-list">
                <li><span className="x">❌</span> You want guaranteed money overnight.</li>
                <li><span className="x">❌</span> You refuse to learn or practice a skill.</li>
                <li><span className="x">❌</span> You expect AI to do everything for you.</li>
                <li><span className="x">❌</span> You don't want to contact potential customers.</li>
              </ul>
              <p className="text-center mt-6 text-lg font-medium highlight-emerald">
                But if you're willing to learn, test, improve and take action — this guide was built for you.
              </p>
            </div>
          </div>
        </section>

        {/* --- SECTION 11: FAQ --- */}
        <section className="faq section-light">
          <div className="container max-w-3xl mx-auto">
            <h2 className="section-title text-center">Frequently Asked Questions</h2>
            
            <div className="faq-container">
              {[
                {
                  q: "Is this a physical book?",
                  a: "No. This is a digital product. You receive the ebook/workbook digitally after completing your purchase."
                },
                {
                  q: "Do I need coding skills?",
                  a: "No. The guide focuses on beginner-friendly side-income methods that do not require coding."
                },
                {
                  q: "Do I need money to start?",
                  a: "The methods are designed around zero or very low upfront investment, using free or accessible tools wherever possible."
                },
                {
                  q: "Is ₹10,000 guaranteed?",
                  a: "No. ₹10,000 is the target used in the guide, not a guaranteed income result. Your results depend on your skills, effort, offer, market, and execution."
                },
                {
                  q: "How do I receive the ebook?",
                  a: "After successful payment, you'll receive access according to the delivery process configured for the checkout (typically instant email delivery)."
                },
                {
                  q: "Is this suitable for beginners?",
                  a: "Yes. The content is designed specifically for Indian students starting from the basics."
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

        {/* --- SECTION 12: FINAL SALES SECTION --- */}
        <section className="final-sales">
          <div className="container text-center">
            <h2 className="hero-headline mb-4">Your First ₹10,000 Starts With Your First Action.</h2>
            <p className="hero-subheadline mb-8">You don't need to know everything today. You just need a practical starting point.</p>
            
            <div className="final-price-box">
              <div className="price text-6xl font-bold highlight-gold">₹149</div>
              <div className="text-sm font-semibold tracking-widest mt-2 mb-6" style={{color: "var(--text-muted)"}}>ONE-TIME PAYMENT</div>
              
              <div className="final-includes">
                <span>✓ Ebook</span>
                <span>✓ Workbook</span>
                <span>✓ AI Toolkit</span>
                <span>✓ 30-Day Challenge</span>
              </div>
              
              <a href={CHECKOUT_URL} className="btn-buy-large pulse-animation mx-auto mt-8">
                🚀 BUY NOW — GET INSTANT ACCESS
              </a>
              <p className="microcopy mt-4">Instant Digital Access • One-Time Payment</p>
            </div>
          </div>
        </section>

        {/* --- SECTION 13: FOOTER --- */}
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
            GET THE GUIDE — ₹149 →
          </a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --primary-bg: #FFFFFF;
          --secondary-bg: #F8FAFC;
          --tertiary-bg: #F1F5F9;
          --blue: #2563EB;
          --emerald: #16A34A;
          --gold: #D4A843;
          --text-main: #0F172A;
          --text-muted: #64748B;
          --border: #E2E8F0;
        }
        
        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: var(--primary-bg); color: var(--text-main); }
        
        .landing-page { overflow-x: hidden; }
        
        .container { max-w: 1200px; margin: 0 auto; padding: 0 20px; }
        .text-center { text-align: center; }
        .text-white { color: #fff; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-10 { margin-bottom: 2.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-12 { margin-top: 3rem; }
        
        .highlight-emerald { color: var(--emerald); }
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
          background-color: var(--emerald); color: white;
          padding: 18px 32px; font-size: 1.125rem; font-weight: 700;
          border-radius: 8px; text-decoration: none;
          box-shadow: 0 4px 14px 0 rgba(22, 163, 74, 0.39);
          transition: all 0.2s ease; width: fit-content;
        }
        .btn-buy-large:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(22, 163, 74, 0.5); color: white; }
        
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(22, 163, 74, 0); }
          100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }
        
        /* Top Bar */
        .top-bar { background-color: var(--gold); color: white; padding: 10px 0; font-size: 0.875rem; position: sticky; top: 0; z-index: 50; }
        .top-bar-content { display: flex; justify-content: space-between; align-items: center; }
        .top-bar-cta { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: white; text-decoration: none; border-bottom: 1px solid white; }
        @media (max-width: 768px) { .top-bar-content { flex-direction: column; gap: 8px; text-align: center; } }
        
        /* Hero */
        .hero { background: var(--primary-bg); padding-top: 4rem; overflow: hidden; }
        .hero-container { display: grid; grid-template-columns: 1.2fr 1fr; gap: 4rem; align-items: center; }
        .hero-badge { display: inline-block; background-color: #EFF6FF; color: var(--blue); padding: 6px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 1.5rem; border: 1px solid #BFDBFE; }
        .hero-headline { font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin: 0 0 1.5rem; letter-spacing: -0.03em; color: var(--text-main); }
        .hero-subheadline { font-size: 1.25rem; font-weight: 500; color: var(--text-muted); line-height: 1.5; margin: 0 0 1.5rem; }
        .hero-support { font-size: 1rem; color: #475569; margin-bottom: 2.5rem; }
        
        .microcopy { font-size: 0.75rem; color: var(--text-muted); margin-top: 12px; font-weight: 500; }
        .price-tag { display: flex; align-items: center; gap: 12px; margin-top: 24px; }
        .price { font-size: 2.5rem; font-weight: 800; color: var(--text-main); }
        .price-note { font-size: 0.875rem; color: var(--text-muted); max-width: 150px; line-height: 1.3; }
        
        .reviews-badge { display: inline-flex; flex-direction: column; background: var(--secondary-bg); padding: 12px 16px; border-radius: 8px; margin-top: 2rem; border: 1px solid var(--border); }
        .stars { color: var(--gold); font-size: 1.25rem; letter-spacing: 2px; margin-bottom: 4px; }
        .reviews-badge span { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; }
        
        .hero-mockup { position: relative; }
        .mockup-container { position: relative; perspective: 1000px; padding: 20px; }
        .ebook-mockup { width: 100%; max-width: 450px; height: auto; border-radius: 12px; box-shadow: -10px 10px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05); transform: rotateY(-15deg) rotateX(5deg); transition: transform 0.3s; }
        .mockup-edition-badge { position: absolute; top: -10px; right: 20px; background: var(--gold); color: white; font-weight: 800; padding: 8px 12px; border-radius: 6px; transform: rotate(10deg); box-shadow: 0 4px 10px rgba(0,0,0,0.1); z-index: 10; }
        
        .float-element { position: absolute; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid var(--border); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); animation: float 6s infinite ease-in-out; }
        .float-1 { top: 10%; left: 0; width: 60px; height: 60px; color: var(--emerald); animation-delay: 0s; font-weight: bold; }
        .float-2 { bottom: 20%; right: -10px; width: 50px; height: 50px; animation-delay: 1s; }
        .float-3 { top: 40%; right: 10%; width: 40px; height: 40px; animation-delay: 2s; }
        .float-4 { bottom: 10%; left: 10%; width: 50px; height: 50px; animation-delay: 3s; }
        
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
        .product-card:hover { transform: translateY(-5px); border-color: #CBD5E1; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .card-header { font-size: 0.75rem; font-weight: 700; color: var(--blue); letter-spacing: 0.1em; margin-bottom: 1rem; }
        .product-card h3 { font-size: 1.5rem; margin: 0 0 0.5rem; color: var(--text-main); }
        .card-desc { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; min-height: 45px; }
        .feature-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .feature-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.95rem; color: #334155; }
        .feature-list svg { color: var(--emerald); flex-shrink: 0; width: 20px; height: 20px; }
        
        /* Value Stack */
        .value-box { background: white; border-radius: 20px; padding: 4rem 2rem; max-width: 700px; margin: 0 auto; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1); border: 1px solid var(--border); }
        .value-line { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px dashed #CBD5E1; font-weight: 600; }
        .value-item { color: var(--text-main); font-size: 1.125rem; }
        .value-price { color: var(--text-muted); }
        .value-total { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 0 0; margin-top: 1rem; font-weight: 700; text-align: center; }
        .value-total span { color: var(--text-muted); font-size: 1rem; margin-bottom: 0.5rem; text-align: center; }
        .today-price { font-size: 3rem; color: var(--emerald); line-height: 1; text-align: center; }
        
        /* Who For */
        .who-for { background: var(--primary-bg); }
        .who-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
        .who-card { background: var(--secondary-bg); padding: 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; border: 1px solid var(--border); }
        .who-card .emoji { font-size: 2rem; }
        .who-card h3 { margin: 0; font-size: 1.125rem; font-weight: 600; color: var(--text-main); }
        
        /* How it works */
        .steps-container { max-width: 600px; margin: 3rem auto 0; display: flex; flex-direction: column; gap: 1rem; }
        .step { background: white; border-radius: 12px; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: flex-start; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); }
        .step-num { font-size: 1.5rem; font-weight: 800; color: var(--blue); background: #EFF6FF; width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-content h3 { margin: 0 0 0.25rem; font-size: 1.25rem; color: var(--text-main); }
        .step-content p { margin: 0; color: var(--text-muted); line-height: 1.5; }
        .step-arrow { text-align: center; font-size: 2rem; color: #CBD5E1; font-weight: bold; }
        
        /* Different */
        .different { background: var(--primary-bg); }
        .large-statement { font-size: 2rem; font-weight: 700; max-width: 800px; margin: 0 auto 1.5rem; line-height: 1.3; color: var(--blue); }
        .different-sub { font-size: 1.25rem; max-width: 700px; margin: 0 auto 4rem; color: var(--text-muted); line-height: 1.6; }
        .credibility-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .cred-card { background: var(--secondary-bg); padding: 2rem 1.5rem; border-radius: 12px; text-align: center; border: 1px solid var(--border); }
        .cred-card h4 { color: var(--text-main); margin: 0 0 0.5rem; font-size: 1rem; letter-spacing: 0.05em; font-weight: 700; }
        .cred-card p { color: var(--text-muted); margin: 0; font-size: 0.95rem; }
        @media (max-width: 768px) { .large-statement { font-size: 1.5rem; } }
        
        /* Premium Preview Section */
        .preview-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 2.5rem; max-width: 1000px; margin: 0 auto; perspective: 1000px; }
        .preview-page { text-align: center; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; width: 100%; max-width: 180px; }
        .preview-page:hover { transform: translateY(-10px) scale(1.03); }
        
        .page-img-v2 { 
          position: relative; width: 100%; aspect-ratio: 1/1.3; border-radius: 12px; 
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.6); 
          margin-bottom: 1.5rem; overflow: hidden; display: flex; flex-direction: column; 
          align-items: center; justify-content: center; transition: all 0.4s ease;
        }
        
        .preview-page:hover .page-img-v2 {
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2), inset 0 0 0 2px rgba(255,255,255,1);
        }
        
        /* Vibrant Modern Gradients */
        .gradient-1 { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
        .gradient-2 { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); }
        .gradient-3 { background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); }
        .gradient-4 { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }
        .gradient-5 { background: linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%); }
        .gradient-6 { background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%); }
        
        /* Subtle Overlay Pattern */
        .page-img-v2::before {
          content: ''; position: absolute; inset: 0; opacity: 0.15;
          background-image: radial-gradient(#000 1px, transparent 1px);
          background-size: 14px 14px; z-index: 0; pointer-events: none;
        }
        
        .page-icon { 
          position: relative; z-index: 10; color: #1e293b; background: rgba(255,255,255,0.8); 
          padding: 18px; border-radius: 50%; box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .preview-page:hover .page-icon { transform: scale(1.2) rotate(8deg); background: #ffffff; color: var(--blue); }
        
        .page-glass-badge {
          position: absolute; bottom: 20px; left: 12px; right: 12px; z-index: 10;
          background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px); padding: 10px 4px; border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.9); font-size: 0.7rem; font-weight: 800;
          color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08); transition: all 0.3s ease;
          display: flex; align-items: center; justify-content: center;
        }
        
        .preview-page:hover .page-glass-badge {
          background: rgba(255, 255, 255, 0.95); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
        
        .preview-page p { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; transition: color 0.3s; }
        .preview-page:hover p { color: var(--blue); }
        .preview-page-sub { font-size: 0.8rem; color: #64748b; margin-top: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        
        /* Not For */
        .honesty-box { background: var(--secondary-bg); border: 1px solid var(--border); border-radius: 16px; padding: 3rem 2rem; max-width: 700px; margin: 0 auto; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.02); }
        .not-for-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; font-size: 1.125rem; }
        .not-for-list li { display: flex; gap: 1rem; align-items: center; color: var(--text-main); }
        .not-for-list .x { font-size: 1.25rem; }
        
        /* FAQ */
        .faq-container { display: flex; flex-direction: column; gap: 1rem; }
        .faq-item { background: white; border-radius: 8px; border: 1px solid var(--border); overflow: hidden; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05); }
        .faq-item:hover { border-color: #CBD5E1; }
        .faq-question { padding: 1.25rem; font-weight: 600; color: var(--text-main); display: flex; justify-content: space-between; align-items: center; }
        .faq-icon { transition: transform 0.3s ease; color: var(--text-muted); }
        .faq-icon.rotated { transform: rotate(180deg); }
        .faq-answer { padding: 0 1.25rem; max-height: 0; overflow: hidden; color: #475569; line-height: 1.6; transition: max-height 0.3s ease, padding 0.3s ease; }
        .faq-item.active .faq-answer { max-height: 200px; padding: 0 1.25rem 1.25rem; }
        
        /* Final Sales */
        .final-sales { background: var(--tertiary-bg); padding: 6rem 0; border-top: 1px solid var(--border); }
        .final-price-box { background: white; padding: 3rem 2rem; border-radius: 20px; max-width: 600px; margin: 0 auto; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        .final-includes { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; color: var(--text-main); font-weight: 500; font-size: 1.125rem; margin-top: 1.5rem; }
        
        /* Footer */
        .footer { background: var(--secondary-bg); padding: 3rem 0 6rem; border-top: 1px solid var(--border); }
        .footer-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 1.5rem; }
        .footer-links a { color: var(--text-muted); text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
        .footer-links a:hover { color: var(--text-main); }
        
        /* Mobile Sticky CTA */
        .sticky-mobile-cta { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 1rem; border-top: 1px solid var(--border); z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); }
        .btn-buy-mobile { display: block; background: var(--emerald); color: white; text-align: center; padding: 16px; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 1.125rem; }
        @media (max-width: 768px) { .sticky-mobile-cta { display: block; } }
        
        /* Animations */
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease forwards; }
        .animate-fade-in { animation: fadeInUp 0.8s ease forwards; animation-delay: 0.2s; opacity: 0; }
      `}} />
    </>
  );
}
