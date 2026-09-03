'use client';

import React, { useEffect, useState, useRef } from 'react';
import { trackFbEvent } from '@/lib/fb-client';
import { trackGoogleViewItem } from '@/lib/google-client';

// SVG Icons
const CheckCircle = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const XCircle = () => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const ArrowRight = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const ChevronDown = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const ListIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const CodeIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>;
const TargetIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const BrainIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path></svg>;

const CHECKOUT_URL = "/checkout/placementcrack-kit";

function useCountdown(initialSeconds: number) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const h = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
  const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
  const s = String(timeLeft % 60).padStart(2, '0');
  return { h, m, s };
}

function useLiveSales() {
  const [count, setCount] = useState(47);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + (Math.random() > 0.7 ? 1 : 0));
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  return count;
}

const TrustBadgeStrip = () => (
  <div className="trust-strip">
    🔒 Secure Checkout via Razorpay &nbsp;|&nbsp; ⚡ Instant Email Delivery &nbsp;|&nbsp; ✅ 10,000+ Students Trusted Us &nbsp;|&nbsp; 📱 Works on Mobile, Laptop & Tablet
  </div>
);

const GuaranteeBox = () => (
  <div className="guarantee-box">
    <div className="guarantee-icon">🛡️</div>
    <div className="guarantee-text">
      <strong>7-Day No-Questions-Asked Refund Guarantee</strong>
      <p>
        If you download the PlacementCrack Kit and feel it didn&apos;t help you — for <em>any reason</em> — just email us within 7 days.
        We&apos;ll refund every rupee. No forms, no drama. <strong>Zero risk to you.</strong>
      </p>
    </div>
  </div>
);

const UrgencyBlock = ({ timerH, timerM, timerS, salesCount }: { timerH: string; timerM: string; timerS: string; salesCount: number }) => (
  <div className="urgency-block">
    <div className="urgency-row">
      <span className="urgency-fire">🔥</span>
      <span><strong>{salesCount} students</strong> bought this in the last 24 hours</span>
    </div>
    <div className="urgency-row">
      <span className="urgency-fire">⏳</span>
      <span>₹199 offer expires in: <strong className="countdown">{timerH}:{timerM}:{timerS}</strong></span>
    </div>
    <div className="urgency-row urgency-price-warn">
      <span className="urgency-fire">⚠️</span>
      <span>Price going up to <strong>₹499</strong> after the next 10 sales</span>
    </div>
  </div>
);

export default function PlacementCrackKitPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const eventFired = useRef(false);
  const { h, m, s } = useCountdown(47 * 3600 + 59 * 60 + 23);
  const salesCount = useLiveSales();

  useEffect(() => {
    if (eventFired.current) return;
    eventFired.current = true;
    trackFbEvent('ViewContent', {
      content_name: 'PlacementCrack Kit',
      content_ids: ['placementcrack-kit'],
      content_type: 'product',
      value: 199,
      currency: 'INR',
      contents: [{ id: 'placementcrack-kit', quantity: 1, item_price: 199 }],
    });
    trackGoogleViewItem({
      id: 'placementcrack-kit',
      name: 'PlacementCrack Kit',
      price: 199,
      currency: 'INR',
    });
  }, []);

  const faqs = [
    { q: "Is this a physical book delivery?", a: "Nahi! PlacementCrack Kit is 100% digital — PDFs, templates, and guides. After payment, you get an instant download link on your email. No waiting, no courier charges." },
    { q: "Which companies are covered in the PYQs?", a: "We cover TCS Ninja, TCS Digital, Infosys (DSE & SP), Wipro, Cognizant (GenC & GenC Next), Accenture, Capgemini, IBM, Tech Mahindra, and common patterns for product-based startups. 30+ companies in total." },
    { q: "Is it suitable for non-CS/IT branches (Mechanical, Civil, EE)?", a: "Absolutely! The aptitude and HR sections are 100% universal. The coding section starts from scratch — perfect for non-CS students trying to enter IT. Bahut saare non-CS students ne TCS aur Infosys crack kiye hain is kit se." },
    { q: "Is this a one-time payment or a subscription?", a: "Strictly one-time payment. ₹199 once, lifetime access to the downloaded files. Koi hidden charge nahi." },
    { q: "What programming languages are used in the coding section?", a: "The logic and pseudocode are language-independent. The Top 100 coding solutions are in C++, Java, and Python — so you can follow in whichever language you know." },
    { q: "Is there a refund policy?", a: "Yes! We offer a 7-Day No-Questions-Asked Refund Guarantee. If you feel the kit didn't help — for any reason — email us at support@daevik.in within 7 days of purchase. Full refund, zero drama." }
  ];

  const testimonials = [
    { name: "Rahul K.", college: "VIT Bhopal University", company: "TCS Digital", text: "Bhai sach mein bahut helpful tha. Maine sirf PYQ vault padha for 2 weeks and cleared TCS Digital with good score. Worth hai every rupee. ₹199 mein ye sab milna toh ekdum solid deal hai 🔥", stars: "★★★★★" },
    { name: "Priya S.", college: "SRM Institute of Science and Technology", company: "Infosys", text: "Aptitude section ne game change kar diya. I was failing every mock test before this. 50+ shortcut formulas — seriously useful, not vague gyan. Got placed in Infosys SP after using this for 3 weeks!!", stars: "★★★★★" },
    { name: "Arjun M.", college: "Amity University Noida", company: "Cognizant", text: "HR playbook is gold. 'Tell me about yourself' ka template use kiya, interviewer literally impressed ho gaya. Cognizant GenC Next crack kiya. Recommend karunga sab ko 🙌", stars: "★★★★★" },
    { name: "Sneha P.", college: "Lovely Professional University", company: "Wipro", text: "Maine pehle sochha tha ki ₹199 mein kya milega, but honestly? This is crazy value. Pseudocode section ne mera coding round ekdum easy kar diya. Wipro offer mila 2nd attempt mein only.", stars: "★★★★★" },
    { name: "Karthik R.", college: "Kalasalingam Academy of Research and Education", company: "Capgemini", text: "Resume ATS template use kiya aur shortlist rate double ho gayi. Pehle 10 apply karta tha, 0 response aata tha. Is template ke baad 4 out of 6 called me. Capgemini join kar raha hun next month 🎉", stars: "★★★★★" },
    { name: "Divya T.", college: "Chandigarh University", company: "Accenture", text: "30+ companies ka PYQ ek jagah milna is actually unbelievable. Maine 4-5 different websites se collect karne ki koshi ki thi, took me days. Ye kit mein 2 hours mein sab ready tha. Accenture cleared! ✅", stars: "★★★★★" }
  ];

  return (
    <>
      <div className="landing-page">

        {/* SECTION 1: STICKY URGENCY TOP BAR */}
        <div className="top-bar" id="top-bar">
          <div className="container top-bar-content">
            <span className="top-bar-text">⏳ <strong>Limited Offer:</strong> PlacementCrack Kit at <strong className="highlight-gold">₹199</strong> — Price goes to ₹499 after 10 more sales</span>
            <a href={CHECKOUT_URL} className="top-bar-cta" id="top-bar-cta">GET IT NOW <ArrowRight /></a>
          </div>
        </div>

        {/* SECTION 2: HERO */}
        <section className="hero" id="hero">
          <div className="container hero-container">
            <div className="hero-content animate-fade-in-up">
              <div className="hero-badge">🎓 USED BY 10,000+ ENGINEERING STUDENTS ACROSS INDIA</div>
              <h1 className="hero-headline">Placement season aa gaya —<br />Kya aap <span className="highlight-emerald">ready</span> hain?</h1>
              <h2 className="hero-subheadline">The <strong>all-in-one digital kit</strong> that gets you from &quot;I don&apos;t know where to start&quot; to <strong>offer letter in hand</strong> — covering TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini &amp; more.</h2>
              <p className="hero-support">Stop wasting time on random YouTube videos and scattered notes. Get <strong>everything organized, battle-tested, and ready to use</strong> — right now.</p>
              <div className="hero-cta-wrapper">
                <a href={CHECKOUT_URL} className="btn-buy-large pulse-animation" id="hero-cta">🎓 YES, Crack My Placements — ₹199</a>
                <p className="microcopy">⚡ Instant Download • One-Time Payment • No Subscription</p>
                <div className="price-tag">
                  <span className="price">₹199</span>
                  <span className="price-strikethrough">₹9,999</span>
                  <span className="price-note">One-time. Yours forever.</span>
                </div>
              </div>
              <UrgencyBlock timerH={h} timerM={m} timerS={s} salesCount={salesCount} />
              <div className="reviews-badge">
                <div className="stars">★★★★★</div>
                <span>&quot;Cleared TCS Digital + Infosys in 30 days using just this kit!&quot; — Rahul K., VIT Bhopal</span>
              </div>
            </div>
            <div className="hero-mockup animate-fade-in">
              <div className="mockup-container">
                <div className="mockup-edition-badge">LATEST EDITION</div>
                <img src="/product-images/placementcrack-kit.jpg" alt="PlacementCrack Kit Bundle — PDF study material for TCS, Infosys, Wipro placements" className="ebook-mockup" />
                <div className="float-element float-1">{'</>'}</div>
                <div className="float-element float-2">💼</div>
                <div className="float-element float-3">🚀</div>
                <div className="float-element float-4">🎓</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: SOCIAL PROOF BAR */}
        <section className="social-proof-bar" id="social-proof">
          <div className="container">
            <div className="proof-strip">
              <div className="proof-item"><span className="proof-num">10,000+</span><span className="proof-label">Students Trust Us</span></div>
              <div className="proof-divider" />
              <div className="proof-item"><span className="proof-num">30+</span><span className="proof-label">Companies Covered</span></div>
              <div className="proof-divider" />
              <div className="proof-item"><span className="proof-num">4 PDFs</span><span className="proof-label">in One Bundle</span></div>
              <div className="proof-divider" />
              <div className="proof-item"><span className="proof-num">₹199</span><span className="proof-label">One-Time Only</span></div>
            </div>
          </div>
        </section>

        {/* SECTION 4: PAIN POINTS */}
        <section className="problems section-light" id="pain-points">
          <div className="container">
            <h2 className="section-title text-center">Yeh problems familiar lagti hain? 😓</h2>
            <p className="section-subtitle text-center">If you said yes to even 2 of these — this kit was made for you.</p>
            <div className="problem-cards">
              <div className="problem-card"><div className="problem-icon"><XCircle /></div><p>&quot;<strong>Aptitude mein bahut weak hun</strong> — quants, logical, verbal — don&apos;t even know where to start.&quot;</p></div>
              <div className="problem-card"><div className="problem-icon"><XCircle /></div><p>&quot;<strong>Coding round mein always stuck</strong> — patterns nahi pata, pseudocode samajh nahi aata.&quot;</p></div>
              <div className="problem-card"><div className="problem-icon"><XCircle /></div><p>&quot;<strong>PYQs collect karne mein hi time waste</strong> — 10 sites check karo, fir bhi incomplete material milta hai.&quot;</p></div>
              <div className="problem-card"><div className="problem-icon"><XCircle /></div><p>&quot;<strong>HR interview mein blank ho jaata hun</strong> — &apos;Tell me about yourself&apos; bhi rehearsed nahi lagta.&quot;</p></div>
              <div className="problem-card"><div className="problem-icon"><XCircle /></div><p>&quot;<strong>Resume bhejta hun, koi response nahi</strong> — don&apos;t know if it&apos;s even ATS-friendly.&quot;</p></div>
              <div className="problem-card"><div className="problem-icon"><XCircle /></div><p>&quot;<strong>Placement drive 3 weeks baad hai</strong> — aur mujhe samajh nahi aa raha kya pehle padhun.&quot;</p></div>
            </div>
            <div className="problem-transition">
              <h3>Hum ise fix karne ke liye banaya hai yeh kit. 👇</h3>
              <p>One bundle. Everything organized. Zero confusion about what to study next.</p>
            </div>
          </div>
        </section>

        {/* SECTION 5: PRODUCT INTRO */}
        <section className="product-intro" id="product-intro">
          <div className="container">
            <div className="intro-box">
              <div className="intro-tag">INTRODUCING</div>
              <h2 className="intro-headline">The <span className="highlight-emerald">PlacementCrack Kit</span></h2>
              <p className="intro-desc">A <strong>4-in-1 digital bundle</strong> built by students who cracked TCS, Infosys, Wipro, and more — so you don&apos;t have to start from scratch. Everything is organized, verified, and ready to use. <strong>Just download and start.</strong></p>
              <p className="intro-desc">At <strong>₹199</strong> — less than a meal at Domino&apos;s — this is the smartest ₹199 you&apos;ll spend this semester.</p>
            </div>
          </div>
        </section>

        {/* SECTION 6: WHAT'S INSIDE */}
        <section className="what-you-get section-light" id="whats-inside">
          <div className="container">
            <h2 className="section-title text-center">What&apos;s Inside The Kit?</h2>
            <p className="section-subtitle text-center">4 focused PDFs. Everything you need. Nothing you don&apos;t.</p>
            <div className="product-grid">
              <div className="product-card">
                <div className="card-number">01</div>
                <div className="card-header">COMPANY SPECIFIC</div>
                <h3>30+ Companies PYQ Vault</h3>
                <p className="card-desc">Real questions sourced from students who <strong>recently gave these exact exams</strong> at TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini &amp; product-based startups.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> Company-wise exam patterns &amp; difficulty levels</li>
                  <li><CheckCircle /> Role-specific technical questions (Ninja vs Digital)</li>
                  <li><CheckCircle /> Most-repeated coding problems per company</li>
                  <li><CheckCircle /> HR interview experiences from real students</li>
                </ul>
              </div>
              <div className="product-card">
                <div className="card-number">02</div>
                <div className="card-header">APTITUDE &amp; LOGIC</div>
                <h3>Aptitude &amp; Reasoning Mastery Guide</h3>
                <p className="card-desc">Clear the aptitude round in <strong>less time</strong> using 50+ shortcut formulas for Quants, Logical Reasoning, and Verbal Ability.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> 50+ shortcut formulas — no mugging, just logic</li>
                  <li><CheckCircle /> Topic-wise practice sets with answers</li>
                  <li><CheckCircle /> Speed math tricks for time-pressured rounds</li>
                  <li><CheckCircle /> Verbal ability rules for non-English speakers</li>
                </ul>
              </div>
              <div className="product-card">
                <div className="card-number">03</div>
                <div className="card-header">TECHNICAL SKILLS</div>
                <h3>Top 100 Coding &amp; Pseudocode Book</h3>
                <p className="card-desc">Master the most-asked coding patterns and pseudocode outputs — even if you&apos;re not a <strong>strong coder</strong>.</p>
                <ul className="feature-list">
                  <li><CheckCircle /> Top 100 coding questions with step-by-step solutions</li>
                  <li><CheckCircle /> Pseudocode output tracing (asked in almost every MNC)</li>
                  <li><CheckCircle /> DBMS &amp; SQL cheat sheet</li>
                  <li><CheckCircle /> OOPS concepts made simple (no fluff)</li>
                </ul>
              </div>
              <div className="product-card">
                <div className="card-number">04</div>
                <div className="card-header">INTERVIEW PREP</div>
                <h3>HR &amp; Tech Interview Playbook + ATS Resume Templates</h3>
                <p className="card-desc">Word-for-word scripts to answer tricky HR questions, explain your projects, and get your resume <strong>shortlisted by ATS systems.</strong></p>
                <ul className="feature-list">
                  <li><CheckCircle /> &quot;Tell me about yourself&quot; templates (multiple variants)</li>
                  <li><CheckCircle /> How to explain any college project confidently</li>
                  <li><CheckCircle /> Salary negotiation scripts for freshers</li>
                  <li><CheckCircle /> 3 ATS-optimized resume templates (edit in Word/Docs)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: VALUE STACK (FIXED) */}
        <section className="value-stack" id="value-stack">
          <div className="container">
            <div className="value-box">
              <h2 className="section-title text-center">The Complete Value Stack</h2>
              <p className="text-center section-subtitle" style={{ marginTop: '-1rem' }}>If you were to get all of this separately — here&apos;s what it would cost:</p>
              <div className="value-lines">
                <div className="value-line"><span className="value-item">📁 30+ Companies PYQ Vault</span><span className="value-price">₹3,499</span></div>
                <div className="value-line"><span className="value-item">🧠 Aptitude &amp; Reasoning Mastery Guide</span><span className="value-price">₹1,999</span></div>
                <div className="value-line"><span className="value-item">💻 Top 100 Coding &amp; Pseudocode Book</span><span className="value-price">₹2,999</span></div>
                <div className="value-line"><span className="value-item">🎤 HR &amp; Tech Playbook + Resume Templates</span><span className="value-price">₹1,502</span></div>
              </div>
              <div className="value-subtotal"><span>Total if bought separately:</span><span className="strikethrough-price">₹9,999</span></div>
              <div className="value-total-highlight">
                <div className="value-total-label">YOUR PRICE TODAY</div>
                <div className="today-price">₹199</div>
                <div className="value-savings">You save ₹9,800 — that&apos;s a 98% discount</div>
              </div>
              <div className="value-cta-area">
                <a href={CHECKOUT_URL} className="btn-buy-large mx-auto pulse-animation" id="value-stack-cta">🎓 YES, I Want The Full Bundle — ₹199</a>
                <UrgencyBlock timerH={h} timerM={m} timerS={s} salesCount={salesCount} />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: CTA BLOCK #1 + TRUST + GUARANTEE */}
        <section className="cta-block-1 section-light" id="cta-block-1">
          <div className="container text-center">
            <h2 className="section-title">Still thinking? Yeh lo — Zero Risk Guarantee 🛡️</h2>
            <p className="section-subtitle">We know you might be nervous about buying online for the first time. So here&apos;s our promise:</p>
            <GuaranteeBox />
            <div style={{ marginTop: '2rem' }}>
              <a href={CHECKOUT_URL} className="btn-buy-large mx-auto" id="cta1-btn">🚀 Get PlacementCrack Kit — Only ₹199</a>
              <TrustBadgeStrip />
            </div>
          </div>
        </section>

        {/* SECTION 9: WHO IS THIS FOR */}
        <section className="who-for" id="who-for">
          <div className="container">
            <h2 className="section-title text-center">Who Will Benefit Most From This Kit?</h2>
            <p className="section-subtitle text-center">Agar aap in mein se kisi bhi category mein hain — yeh kit aapke liye bani hai.</p>
            <div className="who-grid">
              <div className="who-card"><span className="emoji">🎓</span><h3>Final Year B.Tech / BE Students</h3></div>
              <div className="who-card"><span className="emoji">💻</span><h3>BCA / MCA / BSc IT Students</h3></div>
              <div className="who-card"><span className="emoji">🏢</span><h3>Students targeting TCS, Infosys, Wipro &amp; other MNCs</h3></div>
              <div className="who-card"><span className="emoji">🚀</span><h3>Students targeting Product-Based Startups</h3></div>
              <div className="who-card"><span className="emoji">⏰</span><h3>Anyone with 2–4 weeks left before placement drive</h3></div>
              <div className="who-card"><span className="emoji">🧠</span><h3>Students struggling with aptitude &amp; coding rounds</h3></div>
              <div className="who-card"><span className="emoji">📄</span><h3>Students who keep applying but never get shortlisted</h3></div>
              <div className="who-card"><span className="emoji">🗣️</span><h3>Students who panic during HR interviews</h3></div>
            </div>
          </div>
        </section>

        {/* SECTION 10: PEEK INSIDE THE KIT */}
        <section className="peek-inside section-light" id="peek-inside">
          <div className="container">
            <h2 className="section-title text-center">👀 Peek Inside The Kit</h2>
            <p className="section-subtitle text-center">Don&apos;t just take our word for it. Here&apos;s exactly what you&apos;ll <em>see</em> when you open each PDF.</p>
            <div className="peek-grid">
              <div className="peek-card">
                <div className="peek-icon gradient-1"><ListIcon /></div>
                <div className="peek-content">
                  <h3>📁 30+ Companies PYQ Vault</h3>
                  <ul className="peek-list">
                    <li>🔹 A <strong>company-by-company breakdown</strong> — TCS Ninja section, then Digital, then Infosys DSE, etc.</li>
                    <li>🔹 Real MCQs with <strong>answer keys and explanations</strong> — not just the questions</li>
                    <li>🔹 A &quot;Frequently Repeated&quot; questions callout box for each company</li>
                    <li>🔹 Difficulty level marked per question (Easy / Medium / Hard)</li>
                  </ul>
                </div>
              </div>
              <div className="peek-card">
                <div className="peek-icon gradient-2"><BrainIcon /></div>
                <div className="peek-content">
                  <h3>🧠 Aptitude &amp; Reasoning Mastery Guide</h3>
                  <ul className="peek-list">
                    <li>🔹 Page 1 opens with a <strong>&quot;Quick Formula Sheet&quot;</strong> — 50+ formulas on 2 pages, ready to screenshot and save</li>
                    <li>🔹 Each topic has a <strong>&quot;Trick Box&quot;</strong> explaining the shortcut in plain English</li>
                    <li>🔹 Practice sets at end of each chapter (with answers on the next page)</li>
                    <li>🔹 A timed &quot;Mock Round&quot; section to simulate real exam pressure</li>
                  </ul>
                </div>
              </div>
              <div className="peek-card">
                <div className="peek-icon gradient-3"><CodeIcon /></div>
                <div className="peek-content">
                  <h3>💻 Top 100 Coding &amp; Pseudocode Book</h3>
                  <ul className="peek-list">
                    <li>🔹 Each question has <strong>3 parts</strong>: Problem → Thought Process → Code Solution (in 3 languages)</li>
                    <li>🔹 Pseudocode section has <strong>output tracing tables</strong> — trace step-by-step like the exam expects</li>
                    <li>🔹 A dedicated &quot;Most Asked by MNCs&quot; tag on specific problems</li>
                    <li>🔹 DBMS cheat sheet: 1-pager with all <strong>SQL queries</strong> freshers need to know</li>
                  </ul>
                </div>
              </div>
              <div className="peek-card">
                <div className="peek-icon gradient-5"><TargetIcon /></div>
                <div className="peek-content">
                  <h3>🎤 HR Playbook + ATS Resume Templates</h3>
                  <ul className="peek-list">
                    <li>🔹 Starts with a <strong>fill-in-the-blank &quot;Tell me about yourself&quot;</strong> template — just plug in your name and college</li>
                    <li>🔹 A &quot;Difficult Questions Bank&quot; with scripted answers to 30+ tricky HR questions</li>
                    <li>🔹 Resume templates are <strong>editable Word files</strong> — not locked PDFs</li>
                    <li>🔹 An ATS scoring guide explaining <strong>why most resumes get rejected</strong> before a human reads them</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="peek-tease">
              <p>🔒 The full content is <strong>only visible after purchase.</strong> Students who have seen it say it feels like getting a senior&apos;s personal notes — not a generic textbook.</p>
              <p>Kya aap miss karna chahoge? 👇</p>
              <a href={CHECKOUT_URL} className="btn-buy-large mx-auto" id="peek-cta">📖 Show Me The Full Kit — ₹199</a>
            </div>
          </div>
        </section>

        {/* SECTION 11: TESTIMONIALS (6 NEW) */}
        <section className="testimonials" id="testimonials">
          <div className="container">
            <h2 className="section-title text-center">What Students Are Saying 💬</h2>
            <p className="section-subtitle text-center">Real students. Real colleges. Real placements.</p>
            <div className="testimonials-grid">
              {testimonials.map((t, i) => (
                <div className="testimonial-card" key={i}>
                  <div className="t-stars">{t.stars}</div>
                  <p className="t-text">&ldquo;{t.text}&rdquo;</p>
                  <div className="t-meta">
                    <div className="t-avatar">{t.name.charAt(0)}</div>
                    <div className="t-info">
                      <strong>{t.name}</strong>
                      <span>{t.college}</span>
                      <span className="t-placed">✅ Placed at <strong>{t.company}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 12: ROADMAP */}
        <section className="how-it-works section-light" id="roadmap">
          <div className="container">
            <h2 className="section-title text-center">Your 4-Step Roadmap to an Offer Letter</h2>
            <p className="section-subtitle text-center">Simple. Structured. Proven by 10,000+ students.</p>
            <div className="steps-container">
              <div className="step"><div className="step-num">01</div><div className="step-content"><h3>GET THE KIT (5 Minutes)</h3><p>Pay ₹199. Get the download link in your email instantly. Open on your phone or laptop — no special software needed.</p></div></div>
              <div className="step-arrow">↓</div>
              <div className="step"><div className="step-num">02</div><div className="step-content"><h3>MASTER THE BASICS (Week 1)</h3><p>Start with the Aptitude Guide and Coding Book. Use the formula cheat sheets. Cover 2–3 topics per day — don&apos;t rush it.</p></div></div>
              <div className="step-arrow">↓</div>
              <div className="step"><div className="step-num">03</div><div className="step-content"><h3>PRACTICE PYQs (Week 2)</h3><p>Open the company you&apos;re targeting and solve their previous year questions. Pattern recognition aane lagega automatically.</p></div></div>
              <div className="step-arrow">↓</div>
              <div className="step"><div className="step-num">04</div><div className="step-content"><h3>NAIL THE INTERVIEW (Drive Day)</h3><p>Use the HR Playbook scripts. Fix your resume with the ATS template. Walk in with confidence — you know exactly what&apos;s coming.</p></div></div>
            </div>
            <div className="text-center mt-12">
              <a href={CHECKOUT_URL} className="btn-buy-large mx-auto" id="roadmap-cta">🗺️ Start My Preparation — ₹199</a>
            </div>
          </div>
        </section>

        {/* SECTION 13: WHY CHOOSE US */}
        <section className="different" id="why-us">
          <div className="container">
            <h2 className="section-title text-center">Why 10,000+ Students Chose Us</h2>
            <h3 className="large-statement text-center">No fluff. No 2018 syllabus. Just <span className="highlight-emerald">high-impact prep material</span> built for right now.</h3>
            <div className="credibility-grid">
              <div className="cred-card"><div className="cred-icon">🔄</div><h4>REGULARLY UPDATED PYQs</h4><p>We source questions from students who gave these exams recently. Not from some 2020 forum post.</p></div>
              <div className="cred-card"><div className="cred-icon">📦</div><h4>ALL-IN-ONE BUNDLE</h4><p>Aptitude + Coding + HR + Resume in one download. No need to buy 4 separate courses for ₹2,000 each.</p></div>
              <div className="cred-card"><div className="cred-icon">⚡</div><h4>BUILT FOR SPEED</h4><p>Designed for quick revision. Even if your placement drive is next week, this is enough to make a difference.</p></div>
              <div className="cred-card"><div className="cred-icon">🏆</div><h4>PROVEN RESULTS</h4><p>Thousands of students from Tier 2 &amp; Tier 3 colleges have used this exact kit to land their first IT job.</p></div>
            </div>
          </div>
        </section>

        {/* SECTION 14: NOT FOR YOU */}
        <section className="not-for section-darker" id="not-for">
          <div className="container">
            <div className="honesty-box">
              <h2 className="text-center mb-6">This kit is <span style={{ color: '#EF4444' }}>NOT</span> for you if… 🙅</h2>
              <ul className="not-for-list">
                <li><span className="x">❌</span> You expect to crack placements without doing any practice</li>
                <li><span className="x">❌</span> You&apos;re looking for a magical &quot;shortcut&quot; that requires zero effort</li>
                <li><span className="x">❌</span> You already have a job and don&apos;t need placement help</li>
                <li><span className="x">❌</span> You just want to download it and forget about it</li>
              </ul>
              <p className="text-center mt-6 honesty-positive"><strong>But if you&apos;re serious about your career and just need the right material to direct your efforts</strong> — this kit is your unfair advantage. Baaki sab ek alag hi duniya mein prepare kar rahe hain. You&apos;ll have the actual PYQs.</p>
            </div>
          </div>
        </section>

        {/* SECTION 15: FAQ */}
        <section className="faq section-light" id="faq">
          <div className="container max-w-3xl mx-auto">
            <h2 className="section-title text-center">Frequently Asked Questions</h2>
            <div className="faq-container">
              {faqs.map((faq, idx) => (
                <div key={idx} className={`faq-item ${activeFaq === idx ? 'active' : ''}`} onClick={() => setActiveFaq(activeFaq === idx ? null : idx)} id={`faq-${idx}`}>
                  <div className="faq-question">{faq.q}<ChevronDown className={`faq-icon ${activeFaq === idx ? 'rotated' : ''}`} /></div>
                  <div className="faq-answer">{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 16: FINAL CTA */}
        <section className="final-sales" id="final-cta">
          <div className="container text-center">
            <h2 className="final-headline mb-4">Ek decision. Ek offer letter. 🎓</h2>
            <p className="final-subheadline mb-8">Aapki placement drive aa rahi hai. Aapke competitors pehle se prepare kar rahe hain.<br /><strong>Kya aap wait karoge?</strong></p>
            <div className="final-price-box">
              <div className="final-includes-top">
                <span>✓ PYQ Vault</span>
                <span>✓ Aptitude Guide</span>
                <span>✓ Coding Book</span>
                <span>✓ HR Playbook</span>
                <span>✓ ATS Resume Templates</span>
              </div>
              <div className="final-pricing">
                <div className="final-strike">Regular: <s>₹9,999</s></div>
                <div className="final-price-big">₹199</div>
                <div className="final-price-note">ONE-TIME PAYMENT • NO SUBSCRIPTION</div>
              </div>
              <UrgencyBlock timerH={h} timerM={m} timerS={s} salesCount={salesCount} />
              <a href={CHECKOUT_URL} className="btn-buy-large pulse-animation mx-auto mt-8" id="final-cta-btn">🎓 YES, Crack My Placements — Get It For ₹199</a>
              <TrustBadgeStrip />
              <GuaranteeBox />
            </div>
          </div>
        </section>

        {/* SECTION 17: FOOTER */}
        <footer className="footer" id="footer">
          <div className="container text-center">
            <p className="mb-4" style={{ color: 'var(--text-main)', fontWeight: 600 }}>PlacementCrack Kit — Digital Product • Instant Access</p>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>© 2026 Daevik. All rights reserved. &nbsp;|&nbsp; Questions? Email us at <a href="mailto:support@daevik.in" style={{ color: 'var(--blue)' }}>support@daevik.in</a></p>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms &amp; Conditions</a>
              <a href="#">Refund Policy</a>
              <a href="mailto:support@daevik.in">Contact</a>
            </div>
          </div>
        </footer>

        {/* STICKY MOBILE CTA */}
        <div className="sticky-mobile-cta" id="sticky-mobile-cta">
          <a href={CHECKOUT_URL} className="btn-buy-mobile" id="sticky-cta-btn">🎓 Get PlacementCrack Kit — ₹199 →</a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --primary-bg: #FFFFFF; --secondary-bg: #F8FAFC; --tertiary-bg: #F1F5F9;
          --blue: #4F46E5; --emerald: #10B981; --gold: #F59E0B; --red: #EF4444;
          --text-main: #0F172A; --text-muted: #64748B; --border: #E2E8F0;
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: var(--primary-bg); color: var(--text-main); }
        .landing-page { overflow-x: hidden; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .text-center { text-align: center; } .mx-auto { margin-left: auto; margin-right: auto; }
        .mb-4{margin-bottom:1rem}.mb-6{margin-bottom:1.5rem}.mb-8{margin-bottom:2rem}.mt-4{margin-top:1rem}.mt-6{margin-top:1.5rem}.mt-8{margin-top:2rem}.mt-12{margin-top:3rem}
        .highlight-emerald { color: var(--emerald); } .highlight-gold { color: var(--gold); }
        .section-title { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; line-height: 1.2; letter-spacing: -0.02em; color: var(--text-main); }
        .section-subtitle { font-size: 1.125rem; color: var(--text-muted); margin-bottom: 2.5rem; line-height: 1.6; }
        @media (max-width: 768px) { .section-title { font-size: 1.875rem; } }
        section { padding: 5rem 0; }
        .section-light { background-color: var(--secondary-bg); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .section-darker { background-color: var(--tertiary-bg); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(79,70,229,0.7); } 70% { box-shadow: 0 0 0 15px rgba(79,70,229,0); } 100% { box-shadow: 0 0 0 0 rgba(79,70,229,0); } }
        .animate-fade-in-up { animation: fadeInUp 0.7s ease both; }
        .animate-fade-in { animation: fadeIn 0.7s ease 0.3s both; }
        .btn-buy-large { display: flex; align-items: center; justify-content: center; text-align: center; background: linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%); color: white; padding: 18px 32px; font-size: 1.125rem; font-weight: 700; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 20px 0 rgba(79,70,229,0.45); transition: all 0.25s ease; width: fit-content; letter-spacing: 0.01em; }
        .btn-buy-large:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(79,70,229,0.6); color: white; }
        .pulse-animation { animation: pulse 2s infinite; }

        /* TOP BAR */
        .top-bar { background: linear-gradient(90deg, #1e1b4b, #312e81); color: white; padding: 10px 0; font-size: 0.875rem; position: sticky; top: 0; z-index: 50; }
        .top-bar-content { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .top-bar-text { flex: 1; }
        .top-bar-cta { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; color: var(--gold); text-decoration: none; border-bottom: 2px solid var(--gold); white-space: nowrap; padding: 4px 0; }
        @media (max-width: 768px) { .top-bar-content { flex-direction: column; gap: 6px; text-align: center; } }

        /* URGENCY */
        .urgency-block { background: #FFF7ED; border: 1.5px solid #FED7AA; border-radius: 10px; padding: 14px 16px; margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
        .urgency-row { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #92400E; font-weight: 500; }
        .urgency-fire { font-size: 1.125rem; flex-shrink: 0; }
        .urgency-price-warn { background: #FEF2F2; padding: 6px 8px; border-radius: 6px; color: #991B1B; font-weight: 600; }
        .countdown { font-family: 'Courier New', monospace; color: #DC2626; font-size: 1.05rem; font-weight: 800; background: #FEE2E2; padding: 2px 6px; border-radius: 4px; }

        /* TRUST STRIP */
        .trust-strip { font-size: 0.8rem; color: var(--text-muted); text-align: center; margin-top: 14px; padding: 10px 16px; background: var(--secondary-bg); border-radius: 8px; border: 1px solid var(--border); font-weight: 500; line-height: 1.6; }

        /* GUARANTEE */
        .guarantee-box { display: flex; align-items: flex-start; gap: 16px; background: #F0FDF4; border: 2px solid #6EE7B7; border-radius: 14px; padding: 1.5rem; max-width: 600px; margin: 1.5rem auto 0; text-align: left; }
        .guarantee-icon { font-size: 2.5rem; flex-shrink: 0; }
        .guarantee-text strong { display: block; font-size: 1.1rem; color: #065F46; margin-bottom: 0.5rem; }
        .guarantee-text p { margin: 0; font-size: 0.9rem; color: #047857; line-height: 1.6; }

        /* HERO */
        .hero { background: var(--primary-bg); padding-top: 4rem; overflow: hidden; }
        .hero-container { display: grid; grid-template-columns: 1.2fr 1fr; gap: 4rem; align-items: center; }
        .hero-badge { display: inline-block; background: #EEF2FF; color: var(--blue); padding: 6px 14px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 1.5rem; border: 1px solid #C7D2FE; }
        .hero-headline { font-size: 3.25rem; font-weight: 800; line-height: 1.1; margin: 0 0 1.25rem; letter-spacing: -0.03em; color: var(--text-main); }
        .hero-subheadline { font-size: 1.2rem; font-weight: 500; color: var(--text-muted); line-height: 1.6; margin: 0 0 1.25rem; }
        .hero-support { font-size: 1rem; color: #475569; margin-bottom: 2rem; line-height: 1.6; }
        .hero-cta-wrapper { display: flex; flex-direction: column; align-items: flex-start; }
        .microcopy { font-size: 0.8rem; color: var(--text-muted); margin-top: 10px; font-weight: 500; }
        .price-tag { display: flex; align-items: baseline; gap: 10px; margin-top: 16px; }
        .price { font-size: 2.5rem; font-weight: 800; color: var(--text-main); }
        .price-strikethrough { font-size: 1.25rem; font-weight: 600; color: #94A3B8; text-decoration: line-through; }
        .price-note { font-size: 0.8rem; color: var(--text-muted); }
        .reviews-badge { display: inline-flex; flex-direction: column; background: var(--secondary-bg); padding: 12px 16px; border-radius: 10px; margin-top: 1.5rem; border: 1px solid var(--border); max-width: 420px; }
        .stars { color: var(--gold); font-size: 1.125rem; letter-spacing: 2px; margin-bottom: 4px; }
        .reviews-badge span { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; line-height: 1.5; }
        .hero-mockup { position: relative; }
        .mockup-container { position: relative; perspective: 1000px; padding: 20px; }
        .ebook-mockup { width: 100%; max-width: 450px; height: auto; border-radius: 12px; box-shadow: -10px 10px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05); transform: rotateY(-10deg) rotateX(2deg); transition: transform 0.3s; }
        .mockup-edition-badge { position: absolute; top: -10px; right: 20px; background: var(--emerald); color: white; font-weight: 800; padding: 8px 12px; border-radius: 6px; transform: rotate(10deg); box-shadow: 0 4px 10px rgba(0,0,0,0.1); z-index: 10; font-size: 0.75rem; letter-spacing: 0.05em; }
        .float-element { position: absolute; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid var(--border); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); animation: float 6s infinite ease-in-out; }
        .float-1 { top: 10%; left: 0; width: 60px; height: 60px; color: var(--blue); animation-delay: 0s; font-weight: bold; font-size: 1.2rem; }
        .float-2 { bottom: 20%; right: -10px; width: 50px; height: 50px; animation-delay: 1s; }
        .float-3 { top: 40%; right: 10%; width: 40px; height: 40px; animation-delay: 2s; }
        .float-4 { bottom: 10%; left: 10%; width: 50px; height: 50px; animation-delay: 3s; }
        @media (max-width: 992px) {
          .hero-container { grid-template-columns: 1fr; text-align: center; gap: 2rem; }
          .hero-headline { font-size: 2.25rem; }
          .hero-cta-wrapper { align-items: center; }
          .price-tag { justify-content: center; }
          .reviews-badge { align-items: center; margin-left: auto; margin-right: auto; }
          .ebook-mockup { transform: none; max-width: 320px; margin: 0 auto; display: block; }
        }

        /* SOCIAL PROOF BAR */
        .social-proof-bar { background: var(--text-main); padding: 2rem 0; }
        .proof-strip { display: flex; justify-content: center; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .proof-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .proof-num { font-size: 2rem; font-weight: 800; color: var(--gold); line-height: 1; }
        .proof-label { font-size: 0.8rem; color: #94A3B8; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
        .proof-divider { width: 1px; height: 50px; background: #334155; }
        @media (max-width: 640px) { .proof-divider { display: none; } }

        /* PROBLEMS */
        .problem-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin: 2rem 0; }
        .problem-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); display: flex; align-items: flex-start; gap: 12px; }
        .problem-icon { color: #EF4444; flex-shrink: 0; }
        .problem-card p { margin: 0; font-size: 0.95rem; color: var(--text-main); line-height: 1.5; }
        .problem-transition { text-align: center; max-width: 600px; margin: 3rem auto 0; }
        .problem-transition h3 { font-size: 1.5rem; font-weight: 700; color: var(--blue); margin-bottom: 0.5rem; }
        .problem-transition p { font-size: 1.125rem; color: var(--text-muted); }

        /* PRODUCT INTRO */
        .product-intro { background: linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 100%); }
        .intro-box { max-width: 750px; margin: 0 auto; text-align: center; }
        .intro-tag { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; color: var(--blue); margin-bottom: 1rem; text-transform: uppercase; }
        .intro-headline { font-size: 3rem; font-weight: 800; margin: 0 0 1.5rem; letter-spacing: -0.03em; line-height: 1.1; }
        .intro-desc { font-size: 1.125rem; color: #475569; line-height: 1.7; margin-bottom: 1rem; }
        @media (max-width: 768px) { .intro-headline { font-size: 2rem; } }

        /* WHAT YOU GET */
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .product-card { background: white; padding: 2rem; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); transition: transform 0.3s, box-shadow 0.3s; position: relative; overflow: hidden; }
        .product-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--blue), var(--emerald)); }
        .product-card:hover { transform: translateY(-6px); box-shadow: 0 20px 30px -5px rgba(0,0,0,0.1); }
        .card-number { font-size: 3rem; font-weight: 900; color: #E2E8F0; line-height: 1; margin-bottom: 0.5rem; }
        .card-header { font-size: 0.7rem; font-weight: 700; color: var(--blue); letter-spacing: 0.12em; margin-bottom: 0.75rem; text-transform: uppercase; }
        .product-card h3 { font-size: 1.375rem; margin: 0 0 0.75rem; color: var(--text-main); font-weight: 700; line-height: 1.3; }
        .card-desc { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.6; }
        .feature-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .feature-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; color: #334155; line-height: 1.4; }
        .feature-list svg { color: var(--emerald); flex-shrink: 0; margin-top: 2px; }

        /* VALUE STACK */
        .value-stack { background: var(--primary-bg); }
        .value-box { background: white; border-radius: 20px; padding: 3.5rem 2.5rem; max-width: 700px; margin: 0 auto; box-shadow: 0 25px 50px -15px rgba(0,0,0,0.12); border: 1px solid var(--border); }
        .value-lines { margin: 2rem 0; }
        .value-line { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px dashed #CBD5E1; }
        .value-line:last-child { border-bottom: none; }
        .value-item { color: var(--text-main); font-size: 1rem; font-weight: 600; flex: 1; padding-right: 1rem; }
        .value-price { color: #64748B; font-weight: 700; white-space: nowrap; }
        .value-subtotal { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-top: 2px solid var(--border); border-bottom: 2px solid var(--border); margin: 1rem 0; font-weight: 600; color: var(--text-muted); }
        .strikethrough-price { text-decoration: line-through; font-size: 1.25rem; color: #94A3B8; }
        .value-total-highlight { background: linear-gradient(135deg, #F0FDF4, #ECFDF5); border-radius: 12px; padding: 2rem; text-align: center; margin: 1.5rem 0; border: 2px solid #6EE7B7; }
        .value-total-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; color: #059669; text-transform: uppercase; margin-bottom: 0.5rem; }
        .today-price { font-size: 4rem; font-weight: 900; color: var(--emerald); line-height: 1; }
        .value-savings { font-size: 0.9rem; color: #059669; font-weight: 600; margin-top: 0.5rem; }
        .value-cta-area { margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }

        /* CTA BLOCK 1 */
        .cta-block-1 { text-align: center; }

        /* WHO FOR */
        .who-for { background: var(--primary-bg); }
        .who-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-top: 2rem; }
        .who-card { background: var(--secondary-bg); padding: 1.25rem 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; border: 1px solid var(--border); transition: border-color 0.2s, box-shadow 0.2s; }
        .who-card:hover { border-color: #C7D2FE; box-shadow: 0 4px 12px rgba(79,70,229,0.08); }
        .who-card .emoji { font-size: 1.75rem; flex-shrink: 0; }
        .who-card h3 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-main); line-height: 1.4; }

        /* PEEK INSIDE */
        .peek-inside { }
        .peek-grid { display: flex; flex-direction: column; gap: 2rem; max-width: 900px; margin: 0 auto; }
        .peek-card { display: flex; gap: 1.5rem; align-items: flex-start; background: white; border-radius: 16px; padding: 2rem; border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s; }
        .peek-card:hover { transform: translateY(-4px); }
        .peek-icon { width: 72px; height: 72px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #1e293b; }
        .peek-content h3 { font-size: 1.2rem; font-weight: 700; color: var(--text-main); margin: 0 0 1rem; }
        .peek-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .peek-list li { font-size: 0.9rem; color: #334155; line-height: 1.5; padding-left: 4px; }
        .peek-tease { text-align: center; background: #EEF2FF; border-radius: 14px; padding: 2rem; margin-top: 2rem; border: 1px solid #C7D2FE; }
        .peek-tease p { color: #3730A3; font-size: 1rem; margin-bottom: 0.5rem; line-height: 1.6; }
        .peek-tease p:last-of-type { margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 600; }
        @media (max-width: 640px) { .peek-card { flex-direction: column; } .peek-icon { width: 56px; height: 56px; } }

        /* GRADIENTS */
        .gradient-1 { background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); }
        .gradient-2 { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); }
        .gradient-3 { background: linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%); }
        .gradient-5 { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }

        /* TESTIMONIALS */
        .testimonials { background: var(--text-main); }
        .testimonials .section-title { color: white; }
        .testimonials .section-subtitle { color: #94A3B8; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
        .testimonial-card { background: #1E293B; border: 1px solid #334155; border-radius: 16px; padding: 1.75rem; display: flex; flex-direction: column; gap: 1rem; transition: transform 0.3s, border-color 0.3s; }
        .testimonial-card:hover { transform: translateY(-5px); border-color: #4F46E5; }
        .t-stars { color: var(--gold); font-size: 1.125rem; letter-spacing: 2px; }
        .t-text { color: #CBD5E1; font-size: 0.95rem; line-height: 1.7; margin: 0; flex: 1; font-style: italic; }
        .t-meta { display: flex; align-items: center; gap: 12px; border-top: 1px solid #334155; padding-top: 1rem; }
        .t-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, var(--blue), var(--emerald)); display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 1.125rem; flex-shrink: 0; }
        .t-info { display: flex; flex-direction: column; gap: 2px; }
        .t-info strong { color: white; font-size: 0.95rem; }
        .t-info span { color: #64748B; font-size: 0.8rem; }
        .t-placed { color: var(--emerald) !important; font-size: 0.8rem !important; }

        /* ROADMAP */
        .steps-container { max-width: 620px; margin: 2rem auto 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .step { background: white; border-radius: 12px; padding: 1.5rem; display: flex; gap: 1.25rem; align-items: flex-start; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); }
        .step-num { font-size: 1.25rem; font-weight: 800; color: var(--blue); background: #EEF2FF; width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-content h3 { margin: 0 0 0.25rem; font-size: 1.1rem; color: var(--text-main); font-weight: 700; }
        .step-content p { margin: 0; color: var(--text-muted); line-height: 1.6; font-size: 0.95rem; }
        .step-arrow { text-align: center; font-size: 1.5rem; color: #CBD5E1; font-weight: bold; }

        /* WHY US */
        .different { background: var(--primary-bg); }
        .large-statement { font-size: 1.875rem; font-weight: 700; max-width: 800px; margin: 0 auto 3rem; line-height: 1.4; color: var(--text-main); }
        .credibility-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
        .cred-card { background: var(--secondary-bg); padding: 2rem 1.5rem; border-radius: 14px; text-align: center; border: 1px solid var(--border); transition: transform 0.3s; }
        .cred-card:hover { transform: translateY(-4px); }
        .cred-icon { font-size: 2rem; margin-bottom: 1rem; display: block; }
        .cred-card h4 { color: var(--text-main); margin: 0 0 0.75rem; font-size: 0.9rem; letter-spacing: 0.06em; font-weight: 700; }
        .cred-card p { color: var(--text-muted); margin: 0; font-size: 0.9rem; line-height: 1.6; }
        @media (max-width: 768px) { .large-statement { font-size: 1.5rem; } }

        /* NOT FOR */
        .not-for { }
        .honesty-box { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 3rem 2rem; max-width: 700px; margin: 0 auto; }
        .honesty-box h2 { font-size: 1.875rem; font-weight: 800; color: var(--text-main); margin-bottom: 2rem; }
        .not-for-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
        .not-for-list li { display: flex; gap: 1rem; align-items: center; font-size: 1rem; color: var(--text-main); font-weight: 500; }
        .not-for-list .x { font-size: 1.25rem; flex-shrink: 0; }
        .honesty-positive { color: var(--blue); font-size: 1rem; font-weight: 600; line-height: 1.6; }

        /* FAQ */
        .faq-container { display: flex; flex-direction: column; gap: 0.75rem; }
        .faq-item { background: white; border-radius: 10px; border: 1px solid var(--border); overflow: hidden; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05); }
        .faq-item:hover { border-color: #C7D2FE; }
        .faq-item.active { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
        .faq-question { padding: 1.25rem; font-weight: 600; color: var(--text-main); display: flex; justify-content: space-between; align-items: center; gap: 1rem; font-size: 0.95rem; line-height: 1.4; }
        .faq-icon { transition: transform 0.3s ease; color: var(--text-muted); flex-shrink: 0; }
        .faq-icon.rotated { transform: rotate(180deg); }
        .faq-answer { padding: 0 1.25rem; max-height: 0; overflow: hidden; color: #475569; line-height: 1.7; font-size: 0.95rem; transition: max-height 0.4s ease, padding 0.3s ease; }
        .faq-item.active .faq-answer { max-height: 300px; padding: 0 1.25rem 1.25rem; }

        /* FINAL SALES */
        .final-sales { background: linear-gradient(180deg, var(--tertiary-bg) 0%, white 100%); padding: 6rem 0; border-top: 1px solid var(--border); }
        .final-headline { font-size: 3rem; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; color: var(--text-main); }
        .final-subheadline { font-size: 1.25rem; font-weight: 500; color: var(--text-muted); line-height: 1.6; }
        .final-price-box { background: white; padding: 3rem 2.5rem; border-radius: 20px; max-width: 640px; margin: 0 auto; border: 1px solid var(--border); box-shadow: 0 25px 50px rgba(0,0,0,0.08); }
        .final-includes-top { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem 1.25rem; margin-bottom: 2rem; }
        .final-includes-top span { background: #F0FDF4; color: #065F46; font-size: 0.85rem; font-weight: 600; padding: 5px 12px; border-radius: 99px; border: 1px solid #6EE7B7; }
        .final-pricing { text-align: center; margin-bottom: 1.5rem; }
        .final-strike { font-size: 0.9rem; color: #94A3B8; margin-bottom: 0.25rem; }
        .final-price-big { font-size: 5rem; font-weight: 900; color: var(--emerald); line-height: 1; }
        .final-price-note { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; color: var(--text-muted); text-transform: uppercase; margin-top: 0.25rem; }

        /* FOOTER */
        .footer { background: var(--secondary-bg); padding: 3rem 0 6rem; border-top: 1px solid var(--border); }
        .footer-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 1.5rem; }
        .footer-links a { color: var(--text-muted); text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
        .footer-links a:hover { color: var(--blue); }

        /* STICKY MOBILE CTA */
        .sticky-mobile-cta { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 12px 20px; box-shadow: 0 -4px 20px rgba(0,0,0,0.12); z-index: 100; border-top: 1px solid var(--border); }
        .btn-buy-mobile { display: block; width: 100%; background: linear-gradient(135deg, #4F46E5, #6D28D9); color: white; text-align: center; padding: 16px; border-radius: 10px; font-weight: 700; font-size: 1.1rem; text-decoration: none; box-shadow: 0 4px 15px rgba(79,70,229,0.4); }
        @media (max-width: 768px) {
          .sticky-mobile-cta { display: block; }
          .footer { padding-bottom: 100px; }
          .final-price-big { font-size: 4rem; }
          .final-headline { font-size: 2.25rem; }
        }
        @media (max-width: 480px) {
          section { padding: 3.5rem 0; }
          .value-box { padding: 2rem 1.25rem; }
          .final-price-box { padding: 2rem 1.25rem; }
          .guarantee-box { flex-direction: column; align-items: center; text-align: center; }
          .product-grid { grid-template-columns: 1fr; }
          .who-grid { grid-template-columns: 1fr; }
        }
      `}} />
    </>
  );
}
