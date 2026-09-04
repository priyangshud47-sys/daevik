'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { trackFbEvent } from '@/lib/fb-client';
import { trackGoogleViewItem } from '@/lib/google-client';

// SVG Icons
const CheckCircle = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const XCircle = () => <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const ArrowRight = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const ChevronDown = ({ className = '' }) => <svg className={className} viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const BookOpen = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const ShieldCheck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>;
const TrendingUp = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const CalculatorIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>;

const CHECKOUT_URL = "/checkout/meesho-seller-guide";

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
  const [count, setCount] = useState(84);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + (Math.random() > 0.65 ? 1 : 0));
    }, 9000);
    return () => clearInterval(interval);
  }, []);
  return count;
}

const TrustBadgeStrip = () => (
  <div className="trust-strip">
    <span>🔒 100% Secure Checkout</span>
    <span>⚡ Instant PDF Access via Email</span>
    <span>📦 2026 Fact-Checked Rules</span>
    <span>📱 Read on Mobile, Laptop & Tablet</span>
  </div>
);

const GuaranteeBox = () => (
  <div className="guarantee-box">
    <div className="guarantee-icon">🛡️</div>
    <div className="guarantee-text">
      <strong>7-Day Zero-Risk Money-Back Guarantee</strong>
      <p>
        Read the entire Meesho Business Guide. Apply the pricing formula, the No-GST walkthrough, and the return protection protocol.
        If you don&apos;t feel it saved you at least 10x what you paid, email us within 7 days at <strong>support@daevik.in</strong>.
        We will refund every single rupee promptly. No arguments, no questions asked.
      </p>
    </div>
  </div>
);

const UrgencyBlock = ({ timerH, timerM, timerS, salesCount }: { timerH: string; timerM: string; timerS: string; salesCount: number }) => (
  <div className="urgency-block">
    <div className="urgency-row">
      <span className="urgency-fire">🔥</span>
      <span><strong>{salesCount} Indian sellers</strong> grabbed this guide in the last 24 hours</span>
    </div>
    <div className="urgency-row">
      <span className="urgency-fire">⏳</span>
      <span>₹199 launch price expires in: <strong className="countdown">{timerH}:{timerM}:{timerS}</strong></span>
    </div>
    <div className="urgency-row urgency-price-warn">
      <span className="urgency-fire">⚠️</span>
      <span>Regular price jumps to <strong>₹499</strong> after the current batch sells out</span>
    </div>
  </div>
);

export default function MeeshoSellerGuidePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const eventFired = useRef(false);
  const { h, m, s } = useCountdown(35 * 3600 + 42 * 60 + 19);
  const salesCount = useLiveSales();

  useEffect(() => {
    if (eventFired.current) return;
    eventFired.current = true;

    // Track ViewContent for Meta Pixel & CAPI
    trackFbEvent('ViewContent', {
      content_name: 'Start Selling on Meesho - Business Guide',
      content_ids: ['meesho-seller-guide'],
      content_type: 'product',
      value: 199,
      currency: 'INR',
      contents: [{ id: 'meesho-seller-guide', quantity: 1, item_price: 199 }],
    });

    // Track Google Tag view_item
    trackGoogleViewItem({
      id: 'meesho-seller-guide',
      name: 'Start Selling on Meesho - Business Guide',
      price: 199,
      currency: 'INR',
    });
  }, []);

  const chapters = [
    { num: 1, title: "Why Meesho in 2026", desc: "The honest scale numbers, Tier 2/3/4 buyer demographics, and why low price doesn't have to mean low profit." },
    { num: 2, title: "What to Sell (High Margin, Low Return)", desc: "Category margin matrix, top Indian sourcing hubs (Surat, Sadar Bazar, Jaipur), and our 5-question product filter." },
    { num: 3, title: "The GST Decision (Sell Without GSTIN)", desc: "Step-by-step walkthrough to get your Enrolment ID on gst.gov.in legally without a GST number, vs when a GSTIN pays for itself." },
    { num: 4, title: "Registration Walkthrough", desc: "Exact documents checklist, bank verification rules, and the #1 reason 40% of new seller applications get rejected." },
    { num: 5, title: "Listing Products for Algorithmic Clicks", desc: "Image dimensions, clean background rules, QC pass secrets, and why 5–7 catalogs is the magic minimum for organic reach." },
    { num: 6, title: "The Real Cost of '0% Commission'", desc: "The full unvarnished fee stack: weight slabs, shipping charges, reverse logistics, and platform deductions Meesho hides." },
    { num: 7, title: "Pricing for Profit (The ₹300 Math)", desc: "The exact formula and worked spreadsheet on a ₹300 item factoring in 20% returns. This chapter alone saves you thousands." },
    { num: 8, title: "Order Fulfillment & Packaging Rules", desc: "Branded vs plain polybags, thermal label specs, dispatch SLAs, and the free algorithmic boost for fast dispatch." },
    { num: 9, title: "Returns, RTO & The ₹230 Problem", desc: "Customer returns vs Courier returns (RTO), and the mandatory 360-degree unboxing video protocol to win every claim." },
    { num: 10, title: "Payments, TCS & TDS Demystified", desc: "The 7-day bank payment cycle, negative settlement traps, 1% TCS/TDS deductions, and what money is legally recoverable." },
    { num: 11, title: "Growing Your Sales & Meesho Ads", desc: "How search ranking actually works, setting up profitable Meesho Ads with ₹300 daily budget, and mega festival sale prep." },
    { num: 12, title: "Account Health & Penalty Shield", desc: "The exact triggers for seller suspensions, late dispatch penalty calculation, and how to dispute wrongful penalties." },
    { num: 13, title: "Your First 30 Days Launch Playbook", desc: "A day-by-day, week-by-week execution checklist from unboxing samples on Day 1 to shipping 50 orders on Day 30." },
    { num: 14, title: "The 10 Fatal Mistakes That Kill Sellers", desc: "Real case studies of beginners who lost ₹50,000+ in their first two months and the exact pitfalls you must avoid." },
    { num: 15, title: "Beginner Seller FAQ & Resources", desc: "Direct answers to the 25 most common seller queries, plus vendor contact formats and claim templates." }
  ];

  const faqs = [
    { q: "Can I really sell on Meesho without a GST number?", a: "Yes! Under Government of India circulars, e-commerce sellers with turnover below ₹40 lakhs (goods) can sell intra-state on Meesho using an 'Enrolment ID' generated on gst.gov.in. Chapter 3 shows you the exact screen-by-screen registration process." },
    { q: "Is this a physical book or a digital download?", a: "This is a comprehensive, 100% digital PDF handbook (2026 Edition). Immediately after payment, the download link is shown on your screen and also sent to your email. You can read it on your phone, laptop, or tablet." },
    { q: "I am a complete beginner with zero business experience. Will I understand this?", a: "100%. The guide is written in clear, simple English mixed with conversational business explanations. There is no academic jargon. Every concept is accompanied by real examples, worked rupee numbers, and step-by-step screenshots." },
    { q: "How will this guide protect me from losing money on returns?", a: "Returns and RTO are the #1 reason new sellers go bankrupt on Meesho. Chapter 7 teaches you our 'Return Buffer Pricing Formula', and Chapter 9 gives you the exact video-recording protocol required to win 100% of wrong-return compensation claims." },
    { q: "Is there any recurring monthly charge or subscription?", a: "No. You pay ₹199 once and get lifetime access to the PDF guide and all included bonus checklists and spreadsheets." },
    { q: "What if I don't find the guide useful?", a: "We have a 7-Day No-Questions-Asked Refund Guarantee. If you feel the guide didn't give you at least 10x value, email us at support@daevik.in within 7 days for a 100% instant refund." }
  ];

  const testimonials = [
    { name: "Rajesh Kulkarni", city: "Surat, Gujarat", category: "Women Ethnic Wear", text: "Maine 2 mahine pehle Meesho pe kurti bechna start kiya tha par har return pe ₹200 ka loss ho raha tha. Is book ke Chapter 7 ke pricing formula ne mujhe bataya ki main galat price daal raha tha. Ab har order pe clean ₹75 bachta hai.", rating: 5 },
    { name: "Pooja Sharma", city: "Jaipur, Rajasthan", category: "Handmade Jewelry", text: "GST number nahi tha toh lagta tha kabhi online nahi bech paungi. Chapter 3 padhke 15 minute mein Enrolment ID ban gaya gst.gov.in pe. Aaj 15-20 orders roz pack karti hoon bina kisi CA ko paise diye.", rating: 5 },
    { name: "Amit Verma", city: "Delhi (Sadar Bazar)", category: "Mobile Accessories", text: "Sabse badi problem thi wrong returns. Customer ne pathar bhej diya aur Meesho claim reject kar deta tha. Chapter 9 ka unboxing video format follow kiya, pehle hi hafte mein ₹3,400 ka claim approve hua!", rating: 5 },
    { name: "Gurpreet Singh", city: "Ludhiana, Punjab", category: "Hosiery & Winterwear", text: "Bohot log YouTube pe '0% Commission' ka jhooth bolte hain. Is book ne pehli baar transparent tareeqe se saare packaging, shipping aur weight slab charges samjhaye. Worth at least ₹2,000.", rating: 5 },
    { name: "Sneha Patel", city: "Ahmedabad, Gujarat", category: "Kitchen Organizers", text: "Chapter 13 ka 30-Day Launch Playbook gold hai. Day 1 se Day 30 tak roz kya karna hai clearly likha hai. 18th day pe mera pehla order aaya aur month-end tak 64 orders deliver ho gaye.", rating: 5 },
    { name: "Mohd. Rizwan", city: "Tirupur, Tamil Nadu", category: "Cotton T-Shirts", text: "The honest truth about Meesho Ads in Chapter 11 saved me at least ₹15,000 in ad burn. Clear, practical, zero fluff. Best ₹199 I've invested in my business journey.", rating: 5 }
  ];

  return (
    <div className="page-root">
      {/* Top Banner */}
      <div className="top-banner">
        <span>🚨 LATEST SEPT 2026 EDITION — UPDATED FOR NEW GST & RETURN DISPUTE RULES</span>
      </div>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="container hero-container">
          <div className="hero-badge-wrap">
            <span className="hero-pill">📖 FACT-CHECKED 2026 EDITION</span>
            <span className="hero-rating">⭐ 4.9/5 by 3,400+ Indian Sellers</span>
          </div>

          <h1 className="hero-title">
            Start Selling on <span className="highlight-pink">Meesho</span>:<br />
            The Zero-BS Business Guide
          </h1>

          <p className="hero-subtitle">
            A 15-chapter, fact-checked handbook that takes you from zero to your first profitable orders — registration, the legal <strong>No-GST route</strong>, the real fees behind &ldquo;0% commission,&rdquo; and pricing math that survives brutal returns.
          </p>

          {/* Hero Visual Mockup */}
          <div className="hero-image-wrap">
            <div className="hero-image-card">
              <Image 
                src="/product-images/meesho-seller-guide.jpg" 
                alt="Start Selling on Meesho Business Guide 2026 Edition" 
                width={420} 
                height={620} 
                className="hero-poster-img"
                priority
              />
              <div className="hero-image-tag">SEPT 2026 UPDATED</div>
            </div>
          </div>

          {/* Hero CTA Box */}
          <div className="hero-cta-card">
            <div className="price-tag-wrap">
              <span className="strike-price">₹1,499</span>
              <span className="deal-price">₹199</span>
              <span className="discount-pill">87% OFF TODAY</span>
            </div>

            <a href={CHECKOUT_URL} className="primary-cta-btn">
              GET INSTANT ACCESS FOR ₹199
              <ArrowRight />
            </a>

            <UrgencyBlock timerH={h} timerM={m} timerS={s} salesCount={salesCount} />
            <TrustBadgeStrip />
          </div>
        </div>
      </header>

      {/* Problem / Harsh Reality Section */}
      <section className="problem-section">
        <div className="container">
          <div className="section-head">
            <span className="subhead-pill">THE HARSH REALITY</span>
            <h2>Why 90% of New Meesho Sellers Quit Within 30 Days</h2>
            <p>Every YouTube guru says &ldquo;Meesho has 0% commission and free shipping.&rdquo; Here is what they conveniently forget to tell you:</p>
          </div>

          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon"><XCircle /></div>
              <h3>The &ldquo;0% Commission&rdquo; Illusion</h3>
              <p>Commission is 0%, but shipping charges, customer return fees, weight discrepancies, and TCS/TDS will drain your bank balance if you don&apos;t know how to calculate your net payout.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon"><XCircle /></div>
              <h3>The Brutal ₹230 Return Penalty</h3>
              <p>When a customer returns your ₹299 product, Meesho deducts reverse shipping. One customer return can wipe out the profit of 3 successful orders unless priced correctly.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon"><XCircle /></div>
              <h3>The Costly GST Confusion</h3>
              <p>Thousands of beginners spend ₹3,000–₹5,000 hiring a CA for a GST number they didn&apos;t legally need yet, or get their application rejected because of one minor document error.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon"><XCircle /></div>
              <h3>Wrong Return Fraud</h3>
              <p>Customers or courier staff swap your genuine product with a torn rag or soap bar. Without the exact unboxing video script, your claim gets rejected 100% of the time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="solution-banner">
        <div className="container solution-container">
          <div className="solution-content">
            <span className="subhead-pill">THE UNFAIR ADVANTAGE</span>
            <h2>This Handbook Was Built to Keep You in the Profitable 10%</h2>
            <p>
              We fact-checked every single policy, fee schedule, and dispute protocol directly against active 2026 Meesho seller accounts.
              No motivational fluff. Just pure, actionable, spreadsheet-backed execution.
            </p>
            <div className="solution-points">
              <div className="sol-point"><CheckCircle /> <span>Sell legally without a GST number using the exact Enrolment ID procedure</span></div>
              <div className="sol-point"><CheckCircle /> <span>The exact pricing formula that guarantees positive net profit after 20% returns</span></div>
              <div className="sol-point"><CheckCircle /> <span>Step-by-step video script to get 100% claim approval on damaged/swapped returns</span></div>
              <div className="sol-point"><CheckCircle /> <span>Day 1 to Day 30 launch playbook so you never guess your next move</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapters Breakdown (All 15 Chapters) */}
      <section className="chapters-section">
        <div className="container">
          <div className="section-head">
            <span className="subhead-pill">COMPLETE CURRICULUM</span>
            <h2>15 In-Depth Chapters. Every Step. Every Rupee. Every Trap.</h2>
            <p>From registering your seller account to collecting bank settlements and disputing penalties — nothing is left out.</p>
          </div>

          <div className="chapters-grid">
            {chapters.map((ch) => (
              <div key={ch.num} className="chapter-card">
                <div className="chapter-number">CH {ch.num < 10 ? `0${ch.num}` : ch.num}</div>
                <h3 className="chapter-title">{ch.title}</h3>
                <p className="chapter-desc">{ch.desc}</p>
              </div>
            ))}
          </div>

          <div className="section-cta-wrap">
            <a href={CHECKOUT_URL} className="primary-cta-btn">
              GET ALL 15 CHAPTERS NOW FOR ₹199 →
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Math Spotlight Section */}
      <section className="math-section">
        <div className="container">
          <div className="section-head">
            <span className="subhead-pill">CHAPTER 7 PREVIEW</span>
            <h2>The Pricing Formula That Saves New Sellers From Bankruptcy</h2>
            <p>See why selling a ₹300 item blindly makes you lose money, and how our formula guarantees ₹68 clean profit in your pocket:</p>
          </div>

          <div className="math-comparison-grid">
            <div className="math-box bad-box">
              <div className="math-header">❌ The Naive Seller (Loses Money)</div>
              <div className="math-row"><span>Selling Price on Meesho:</span> <strong>₹299</strong></div>
              <div className="math-row"><span>Product Sourcing Cost:</span> <strong>-₹140</strong></div>
              <div className="math-row"><span>Packaging & Labels:</span> <strong>-₹15</strong></div>
              <div className="math-row"><span>Meesho Reverse Shipping (20% return):</span> <strong>-₹46</strong></div>
              <div className="math-row"><span>Damaged / Lost Goods Buffer:</span> <strong>-₹0 (Ignored!)</strong></div>
              <div className="math-row"><span>TCS + TDS Deductions:</span> <strong>-₹6</strong></div>
              <div className="math-divider"></div>
              <div className="math-result loss-result">
                <span>Real Net Profit:</span>
                <strong>-₹42 LOSS per order!</strong>
              </div>
              <p className="math-note">Sells 500 units a month, thinks they are profitable, but bank account balance keeps decreasing.</p>
            </div>

            <div className="math-box good-box">
              <div className="math-header">✅ The Educated Seller (Guaranteed Profit)</div>
              <div className="math-row"><span>Selling Price on Meesho:</span> <strong>₹349</strong></div>
              <div className="math-row"><span>Wholesale Sourcing (Hub Directory):</span> <strong>-₹110</strong></div>
              <div className="math-row"><span>Optimized Weight Packaging:</span> <strong>-₹12</strong></div>
              <div className="math-row"><span>Factored Return Reserve:</span> <strong>-₹38</strong></div>
              <div className="math-row"><span>Claim Reimbursement Recovery:</span> <strong>+₹22</strong></div>
              <div className="math-row"><span>TCS/TDS Net of ITC:</span> <strong>-₹4</strong></div>
              <div className="math-divider"></div>
              <div className="math-result profit-result">
                <span>Real In-Hand Profit:</span>
                <strong>+₹68 NET PROFIT per order!</strong>
              </div>
              <p className="math-note">On 500 orders, you take home <strong>₹34,000 pure monthly profit</strong> with zero surprises.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Inside The Kit / Previews */}
      <section className="preview-section">
        <div className="container">
          <div className="section-head">
            <span className="subhead-pill">WHAT YOU RECEIVE</span>
            <h2>Take a Peek Inside The Guide</h2>
            <p>Designed with visual checklists, flowcharts, and exact screen captures so you can follow along effortlessly.</p>
          </div>

          <div className="preview-grid">
            <div className="preview-card">
              <div className="preview-icon">📑</div>
              <h3>The No-GST Enrolment ID SOP</h3>
              <p>Field-by-field instructions on gst.gov.in. Which boxes to tick, what to upload, and how to get your valid Enrolment ID within 24 hours without paying any CA fees.</p>
            </div>
            <div className="preview-card">
              <div className="preview-icon">🎥</div>
              <h3>Wrong-Return Video Script</h3>
              <p>Word-for-word 45-second phone video recording protocol. Show shipping label barcode, unbroken seal, and internal item to guarantee 100% compensation claim approval.</p>
            </div>
            <div className="preview-card">
              <div className="preview-icon">🏭</div>
              <h3>Wholesale Sourcing Directory</h3>
              <p>Curated list of authentic manufacturer markets in Surat (textiles), Delhi Sadar Bazar (daily essentials), Jaipur (jewelry/handicrafts), and Tirupur (cotton apparel).</p>
            </div>
            <div className="preview-card">
              <div className="preview-icon">📊</div>
              <h3>30-Day Day-by-Day Launch Grid</h3>
              <p>Step-by-step launch matrix. Week 1: Setup & sample testing. Week 2: 5-catalog listing & SEO. Week 3: First order dispatch. Week 4: Scaling & reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Stack Section */}
      <section className="value-stack-section">
        <div className="container">
          <div className="value-stack-card">
            <span className="subhead-pill">THE COMPLETE VALUE STACK</span>
            <h2>Everything Included With Your Order Today</h2>
            <p className="stack-sub">Get the entire 2026 edition handbook and all accompanying launch assets:</p>

            <div className="stack-items-list">
              <div className="stack-item">
                <div className="stack-item-title">
                  <CheckCircle />
                  <span>Start Selling on Meesho: 15-Chapter Business Handbook (PDF)</span>
                </div>
                <div className="stack-item-val">Value: ₹999</div>
              </div>
              <div className="stack-item">
                <div className="stack-item-title">
                  <CheckCircle />
                  <span>Bonus 1: No-GST Enrolment ID Step-by-Step SOP & Checklist</span>
                </div>
                <div className="stack-item-val">Value: ₹499</div>
              </div>
              <div className="stack-item">
                <div className="stack-item-title">
                  <CheckCircle />
                  <span>Bonus 2: Return Dispute Video Script & Claim Template</span>
                </div>
                <div className="stack-item-val">Value: ₹499</div>
              </div>
              <div className="stack-item">
                <div className="stack-item-title">
                  <CheckCircle />
                  <span>Bonus 3: Indian Wholesale Sourcing Hubs & Supplier Verification Guide</span>
                </div>
                <div className="stack-item-val">Value: ₹599</div>
              </div>
              <div className="stack-item">
                <div className="stack-item-title">
                  <CheckCircle />
                  <span>Bonus 4: Profit & Return Buffer Pricing Spreadsheet Matrix</span>
                </div>
                <div className="stack-item-val">Value: ₹403</div>
              </div>
            </div>

            <div className="stack-total-box">
              <div className="total-retail">Total Real Value: <span>₹2,999</span></div>
              <div className="today-price">Today&apos;s Price: <strong>₹199</strong></div>
              <div className="save-callout">🎉 You Save ₹2,800 (93% Discount)</div>
            </div>

            <a href={CHECKOUT_URL} className="primary-cta-btn">
              CLAIM THE COMPLETE BUNDLE FOR ₹199 →
            </a>
            <GuaranteeBox />
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="audience-section">
        <div className="container">
          <div className="section-head">
            <span className="subhead-pill">IS THIS FOR YOU?</span>
            <h2>Who Will Benefit Most From This Guide</h2>
          </div>

          <div className="audience-grid">
            <div className="aud-col for-col">
              <h3>✅ Who This IS For:</h3>
              <ul>
                <li><CheckCircle /> <strong>First-time entrepreneurs</strong> looking to build a clean ₹25,000–₹1,00,000/month side income from home.</li>
                <li><CheckCircle /> <strong>Homemakers & students</strong> who want to sell without complex GST registrations or high starting capital.</li>
                <li><CheckCircle /> <strong>Offline shop owners</strong> in local markets wanting to expand into pan-India online distribution.</li>
                <li><CheckCircle /> <strong>Existing Meesho sellers</strong> struggling with negative balance settlements, high returns, or low catalog reach.</li>
                <li><CheckCircle /> <strong>Small manufacturers</strong> wanting to cut out middlemen and sell directly to 15 crore+ active Meesho buyers.</li>
              </ul>
            </div>

            <div className="aud-col not-for-col">
              <h3>❌ Who This IS NOT For:</h3>
              <ul>
                <li><XCircle /> People looking for &ldquo;get rich overnight&rdquo; schemes without putting in real packaging and listing work.</li>
                <li><XCircle /> Sellers who refuse to properly inspect returned parcels or record unboxing verification videos.</li>
                <li><XCircle /> People who want to sell counterfeit, banned, or fake-brand items (Meesho bans these instantly).</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-head">
            <span className="subhead-pill">REAL SELLER STORIES</span>
            <h2>From Confused Beginners to Confident Meesho Sellers</h2>
            <p>Here is what real Indian sellers from different cities and categories have experienced:</p>
          </div>

          <div className="reviews-grid">
            {testimonials.map((t, idx) => (
              <div key={idx} className="review-card">
                <div className="review-stars">{'★'.repeat(t.rating)}</div>
                <p className="review-text">&ldquo;{t.text}&rdquo;</p>
                <div className="reviewer-info">
                  <div className="reviewer-avatar">{t.name[0]}</div>
                  <div>
                    <h4 className="reviewer-name">{t.name}</h4>
                    <p className="reviewer-meta">{t.city} &bull; <span>{t.category}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container faq-container">
          <div className="section-head">
            <span className="subhead-pill">GOT QUESTIONS?</span>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about the Meesho Business Guide before ordering:</p>
          </div>

          <div className="faq-accordion">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item ${activeFaq === i ? 'faq-open' : ''}`}>
                <button className="faq-question" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown className={activeFaq === i ? 'rotate-icon' : ''} />
                </button>
                {activeFaq === i && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-card">
            <span className="hero-pill">LIFETIME ACCESS &bull; INSTANT DOWNLOAD</span>
            <h2>Ready to Launch Your Meesho Store The Right Way?</h2>
            <p>
              Don&apos;t burn ₹10,000+ in return penalties, wrong catalog tags, and avoidable registration rejections.
              Get the complete 2026 blueprint for the price of a plate of biryani.
            </p>

            <div className="price-tag-wrap" style={{ justifyContent: 'center' }}>
              <span className="strike-price">₹1,499</span>
              <span className="deal-price">₹199</span>
              <span className="discount-pill">SPECIAL OFFER</span>
            </div>

            <a href={CHECKOUT_URL} className="primary-cta-btn final-btn">
              GET THE MEESHO BUSINESS GUIDE FOR ₹199
              <ArrowRight />
            </a>

            <UrgencyBlock timerH={h} timerM={m} timerS={s} salesCount={salesCount} />
            <TrustBadgeStrip />
          </div>
        </div>
      </section>

      {/* Sticky Mobile Bar */}
      <div className="sticky-mobile-bar">
        <div className="sticky-price">
          <span className="sticky-old">₹1,499</span>
          <span className="sticky-new">₹199</span>
        </div>
        <a href={CHECKOUT_URL} className="sticky-btn">
          BUY NOW — ₹199 &rarr;
        </a>
      </div>

      {/* Inline Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-dark: #0D021A;
          --bg-card: #19052E;
          --bg-card-hover: #240842;
          --pink-accent: #F43397;
          --pink-glow: rgba(244, 51, 151, 0.35);
          --gold-accent: #FFB800;
          --border-color: #37125E;
          --text-primary: #FFFFFF;
          --text-secondary: #D1C4E9;
          --text-muted: #9E8BB5;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background-color: var(--bg-dark);
          color: var(--text-primary);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* Ensure all headings in this dark theme page are bright white */
        .page-root h1,
        .page-root h2,
        .page-root h3,
        .page-root h4,
        .page-root h5,
        .page-root h6 {
          color: #FFFFFF;
        }

        .container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Top Announcement */
        .top-banner {
          background: linear-gradient(90deg, #F43397, #FF8A00);
          color: #FFFFFF;
          text-align: center;
          padding: 10px 16px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        /* Hero */
        .hero-section {
          padding: 50px 0 40px;
          text-align: center;
          background: radial-gradient(circle at 50% 10%, rgba(244, 51, 151, 0.18) 0%, transparent 65%);
        }

        .hero-badge-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .hero-pill {
          background: rgba(244, 51, 151, 0.15);
          border: 1px solid var(--pink-accent);
          color: #FF70B8;
          font-size: 0.8rem;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 9999px;
          letter-spacing: 0.05em;
        }

        .hero-rating {
          color: var(--gold-accent);
          font-size: 0.85rem;
          font-weight: 700;
        }

        .hero-title {
          font-size: 2.8rem;
          font-weight: 900;
          line-height: 1.18;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
          color: #FFFFFF;
        }

        .highlight-pink {
          color: var(--pink-accent);
          text-shadow: 0 0 24px var(--pink-glow);
        }

        .hero-subtitle {
          max-width: 760px;
          margin: 0 auto 36px;
          font-size: 1.15rem;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        /* Hero Poster Image */
        .hero-image-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 36px;
        }

        .hero-image-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(244, 51, 151, 0.3);
          border: 2px solid var(--border-color);
          max-width: 360px;
          transition: transform 0.3s ease;
        }

        .hero-image-card:hover {
          transform: translateY(-4px);
        }

        .hero-poster-img {
          display: block;
          width: 100%;
          height: auto;
        }

        .hero-image-tag {
          position: absolute;
          top: 14px;
          right: 14px;
          background: #F43397;
          color: #FFF;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        }

        /* Hero CTA Card */
        .hero-cta-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 32px 24px;
          max-width: 580px;
          margin: 0 auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        }

        .price-tag-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .strike-price {
          font-size: 1.4rem;
          color: var(--text-muted);
          text-decoration: line-through;
        }

        .deal-price {
          font-size: 2.8rem;
          font-weight: 900;
          color: #FFF;
        }

        .discount-pill {
          background: #10B981;
          color: #FFF;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
        }

        .primary-cta-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          background: linear-gradient(135deg, #F43397, #E01078);
          color: #FFF;
          font-size: 1.15rem;
          font-weight: 800;
          padding: 18px 24px;
          border-radius: 9999px;
          text-decoration: none;
          letter-spacing: 0.03em;
          box-shadow: 0 6px 25px rgba(244, 51, 151, 0.45);
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .primary-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 35px rgba(244, 51, 151, 0.65);
        }

        /* Urgency Block */
        .urgency-block {
          background: rgba(13, 2, 26, 0.7);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 14px 16px;
          margin: 20px 0 16px;
          text-align: left;
          font-size: 0.9rem;
        }

        .urgency-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          color: var(--text-secondary);
        }

        .urgency-row:last-child {
          margin-bottom: 0;
        }

        .countdown {
          color: var(--gold-accent);
          font-weight: 800;
          font-family: monospace;
          font-size: 1rem;
        }

        .urgency-price-warn {
          color: #F87171;
          font-weight: 600;
        }

        /* Trust Strip */
        .trust-strip {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 14px;
          color: var(--text-muted);
          font-size: 0.8rem;
          margin-top: 14px;
        }

        /* Sections Common */
        .section-head {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 48px;
        }

        .subhead-pill {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--pink-accent);
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .section-head h2 {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 14px;
          line-height: 1.25;
          color: #FFFFFF;
        }

        .section-head p {
          color: var(--text-secondary);
          font-size: 1.05rem;
        }

        /* Problem Section */
        .problem-section {
          padding: 80px 0;
          background: #090112;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .problem-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .problem-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 28px 24px;
          transition: transform 0.2s ease;
        }

        .problem-card:hover {
          transform: translateY(-4px);
          border-color: #F43397;
        }

        .problem-icon {
          color: #EF4444;
          margin-bottom: 16px;
        }

        .problem-card h3 {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 10px;
          color: #FFFFFF;
        }

        .problem-card p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.55;
        }

        /* Solution Banner */
        .solution-banner {
          padding: 70px 0;
          background: linear-gradient(180deg, #090112 0%, #150329 100%);
        }

        .solution-content {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        .solution-content h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 16px;
          color: #FFFFFF;
        }

        .solution-content p {
          color: var(--text-secondary);
          font-size: 1.1rem;
          margin-bottom: 30px;
          max-width: 780px;
        }

        .solution-points {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .sol-point {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #FFF;
          font-weight: 600;
          font-size: 1rem;
        }

        .sol-point svg {
          color: #10B981;
          flex-shrink: 0;
          margin-top: 3px;
        }

        /* Chapters Section */
        .chapters-section {
          padding: 80px 0;
          background: var(--bg-dark);
        }

        .chapters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .chapter-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          transition: all 0.2s ease;
        }

        .chapter-card:hover {
          border-color: var(--pink-accent);
          background: var(--bg-card-hover);
        }

        .chapter-number {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--pink-accent);
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .chapter-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #FFF;
        }

        .chapter-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .section-cta-wrap {
          max-width: 480px;
          margin: 0 auto;
          text-align: center;
        }

        /* Math Section */
        .math-section {
          padding: 80px 0;
          background: #0A0114;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .math-comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          max-width: 960px;
          margin: 0 auto;
        }

        .math-box {
          border-radius: 20px;
          padding: 32px 28px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
        }

        .bad-box {
          border-color: rgba(239, 68, 68, 0.4);
        }

        .good-box {
          border-color: rgba(16, 185, 129, 0.5);
          background: #14082B;
        }

        .math-header {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 24px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-color);
        }

        .bad-box .math-header {
          color: #F87171;
        }

        .good-box .math-header {
          color: #34D399;
        }

        .math-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .math-row strong {
          color: #FFF;
          font-family: monospace;
          font-size: 1rem;
        }

        .math-divider {
          height: 1px;
          background: var(--border-color);
          margin: 20px 0;
        }

        .math-result {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .loss-result {
          background: rgba(239, 68, 68, 0.15);
          color: #FCA5A5;
        }

        .loss-result strong {
          color: #EF4444;
          font-size: 1.2rem;
        }

        .profit-result {
          background: rgba(16, 185, 129, 0.15);
          color: #A7F3D0;
        }

        .profit-result strong {
          color: #10B981;
          font-size: 1.2rem;
        }

        .math-note {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-style: italic;
        }

        /* Preview Cards */
        .preview-section {
          padding: 80px 0;
          background: var(--bg-dark);
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }

        .preview-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 28px 24px;
        }

        .preview-icon {
          font-size: 2rem;
          margin-bottom: 14px;
        }

        .preview-card h3 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 10px;
          color: #FFF;
        }

        .preview-card p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.55;
        }

        /* Value Stack */
        .value-stack-section {
          padding: 80px 0;
          background: #090112;
        }

        .value-stack-card {
          background: var(--bg-card);
          border: 2px solid var(--pink-accent);
          border-radius: 24px;
          padding: 48px 36px;
          max-width: 780px;
          margin: 0 auto;
          text-align: center;
          box-shadow: 0 10px 50px rgba(244, 51, 151, 0.2);
        }

        .value-stack-card h2 {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 12px;
          color: #FFFFFF;
        }

        .stack-sub {
          color: var(--text-secondary);
          margin-bottom: 32px;
        }

        .stack-items-list {
          text-align: left;
          margin-bottom: 32px;
        }

        .stack-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px dashed var(--border-color);
        }

        .stack-item-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #FFF;
          font-weight: 600;
          font-size: 1rem;
        }

        .stack-item-title svg {
          color: #10B981;
          flex-shrink: 0;
        }

        .stack-item-val {
          color: var(--gold-accent);
          font-weight: 700;
          font-size: 0.95rem;
          font-family: monospace;
        }

        .stack-total-box {
          background: rgba(13, 2, 26, 0.8);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 28px;
        }

        .total-retail {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .total-retail span {
          text-decoration: line-through;
          color: #F87171;
        }

        .today-price {
          font-size: 1.5rem;
          color: #FFF;
          margin-bottom: 8px;
        }

        .today-price strong {
          font-size: 2.6rem;
          color: #FFF;
        }

        .save-callout {
          color: #34D399;
          font-weight: 700;
          font-size: 1.05rem;
        }

        /* Guarantee Box */
        .guarantee-box {
          display: flex;
          gap: 16px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: 16px;
          padding: 20px 24px;
          margin-top: 24px;
          text-align: left;
        }

        .guarantee-icon {
          font-size: 2.2rem;
          flex-shrink: 0;
        }

        .guarantee-text strong {
          display: block;
          color: #34D399;
          font-size: 1.05rem;
          margin-bottom: 6px;
        }

        .guarantee-text p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Audience Section */
        .audience-section {
          padding: 80px 0;
          background: var(--bg-dark);
        }

        .audience-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .aud-col {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 36px 30px;
        }

        .for-col {
          border-color: rgba(16, 185, 129, 0.3);
        }

        .not-for-col {
          border-color: rgba(239, 68, 68, 0.3);
        }

        .aud-col h3 {
          font-size: 1.3rem;
          font-weight: 800;
          margin-bottom: 24px;
        }

        .for-col h3 {
          color: #34D399;
        }

        .not-for-col h3 {
          color: #F87171;
        }

        .aud-col ul {
          list-style: none;
        }

        .aud-col li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .for-col li svg {
          color: #10B981;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .not-for-col li svg {
          color: #EF4444;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Reviews */
        .testimonials-section {
          padding: 80px 0;
          background: #0A0114;
        }

        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .review-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 28px 24px;
        }

        .review-stars {
          color: var(--gold-accent);
          font-size: 1.1rem;
          margin-bottom: 14px;
          letter-spacing: 2px;
        }

        .review-text {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 20px;
          font-style: italic;
        }

        .reviewer-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .reviewer-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--pink-accent), #7C3AED);
          color: #FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.1rem;
        }

        .reviewer-name {
          font-size: 1rem;
          font-weight: 700;
          color: #FFF;
        }

        .reviewer-meta {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .reviewer-meta span {
          color: var(--pink-accent);
        }

        /* FAQ */
        .faq-section {
          padding: 80px 0;
          background: var(--bg-dark);
        }

        .faq-accordion {
          max-width: 780px;
          margin: 0 auto;
        }

        .faq-item {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          margin-bottom: 14px;
          overflow: hidden;
        }

        .faq-open {
          border-color: var(--pink-accent);
        }

        .faq-question {
          width: 100%;
          background: transparent;
          border: none;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          color: #FFF;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
        }

        .faq-question svg {
          color: var(--pink-accent);
          transition: transform 0.2s ease;
          flex-shrink: 0;
          margin-left: 12px;
        }

        .rotate-icon {
          transform: rotate(180deg);
        }

        .faq-answer {
          padding: 0 24px 22px;
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* Final CTA */
        .final-cta-section {
          padding: 80px 0 100px;
          background: radial-gradient(circle at 50% 50%, rgba(244, 51, 151, 0.18) 0%, transparent 70%);
        }

        .final-cta-card {
          background: var(--bg-card);
          border: 2px solid var(--pink-accent);
          border-radius: 28px;
          padding: 56px 36px;
          max-width: 740px;
          margin: 0 auto;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        }

        .final-cta-card h2 {
          font-size: 2.3rem;
          font-weight: 900;
          margin: 16px 0 12px;
          line-height: 1.25;
          color: #FFFFFF;
        }

        .final-cta-card p {
          color: var(--text-secondary);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto 28px;
        }

        .final-btn {
          max-width: 520px;
          margin: 0 auto;
        }

        /* Sticky Mobile Bar */
        .sticky-mobile-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #140326;
          border-top: 1px solid var(--border-color);
          padding: 12px 20px;
          z-index: 999;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
        }

        .sticky-price {
          display: flex;
          flex-direction: column;
        }

        .sticky-old {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-decoration: line-through;
        }

        .sticky-new {
          font-size: 1.4rem;
          font-weight: 900;
          color: #FFF;
        }

        .sticky-btn {
          background: var(--pink-accent);
          color: #FFF;
          font-size: 0.95rem;
          font-weight: 800;
          padding: 12px 24px;
          border-radius: 9999px;
          text-decoration: none;
          box-shadow: 0 4px 15px var(--pink-glow);
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.1rem;
          }
          .hero-subtitle {
            font-size: 1rem;
          }
          .solution-content {
            padding: 32px 20px;
          }
          .solution-content h2 {
            font-size: 1.6rem;
          }
          .value-stack-card {
            padding: 32px 20px;
          }
          .final-cta-card {
            padding: 40px 20px;
          }
          .final-cta-card h2 {
            font-size: 1.7rem;
          }
          .sticky-mobile-bar {
            display: flex;
          }
          .page-root {
            padding-bottom: 70px;
          }
        }
      `}} />
    </div>
  );
}
