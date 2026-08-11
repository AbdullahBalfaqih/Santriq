"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { initOfficialReownAppKit, openOfficialReownModal, getAppKit } from "./ReownSDKProvider";
import { Manrope, Marhey } from "next/font/google";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const marhey = Marhey({ subsets: ["latin"], variable: "--font-marhey" });

const navLinks = ["Home", "About us", "AI Features", "Platform", "FAQ"];

const partnerLogos = [
  { name: "Flare Network", logo: "/FLR-icon200x200.png" },
  { name: "Ethereum", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg", invert: true },
  { name: "Tether", logo: "https://cryptologos.cc/logos/tether-usdt-logo.svg" },
  { name: "USD Coin", logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg" },
  { name: "BNB Chain", logo: "https://cryptologos.cc/logos/bnb-bnb-logo.svg" },
  { name: "Chainlink", logo: "https://cryptologos.cc/logos/chainlink-link-logo.svg" },
];

const stats = [
  { value: "+500K", label: "Scams Blocked" },
  { value: "$10B+", label: "Assets Guarded" },
  { value: "100%", label: "TEE Confidentiality" },
];

const paymentFeatures = [
  {
    title: "Real-Time Fraud Detection",
    description:
      "Monitor incoming and outgoing crypto transactions instantly using confidential AI models.",
  },
  {
    title: "On-Chain Threat Monitoring",
    description:
      "Scan smart contract interactions and trace malicious addresses across multiple blockchains.",
  },
  {
    title: "Confidential TEE Shield",
    description:
      "Execute security checks inside Trusted Execution Environments for 100% data privacy.",
  },
];

const platformFeatures = [
  {
    title: "Premium Threat Analytics",
    description: "Unlock deep fraud intelligence, wallet risk profiling, and advanced AI alerts.",
    imageUrl: "/platform_premium_glass.png"
  },
  {
    title: "Public Registry Audits",
    description: "Verify community-reported threat flags and help audit the decentralized scam registry.",
    imageUrl: "/platform_security_glass.png"
  },
  {
    title: "TEE Enclave Shield",
    description: "Run safety simulations inside secure enclaves to keep smart contract transactions private.",
    imageUrl: "/platform_protection_glass.png"
  },
  {
    title: "DAO Risk Consensus",
    description: "Participate in flagging malicious wallets and shape scam registry rules through governance.",
    imageUrl: "/platform_governance_glass.png"
  },
  {
    title: "Cross-Chain Enforcer",
    description: "Real-time threat monitoring operating continuously across Flare and Ethereum ecosystem.",
    imageUrl: "/platform_availability_glass.png"
  }
];

const marketTickers = [
  { symbol: "BTC", name: "Bitcoin", price: "$64,200.00", change: "+1.20%", iconUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg" },
  { symbol: "ETH", name: "Ethereum", price: "$3,450.00", change: "+2.50%", iconUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.svg", invert: true },
  { symbol: "USDT", name: "Tether", price: "$1.00", change: "+0.01%", iconUrl: "https://cryptologos.cc/logos/tether-usdt-logo.svg" },
  { symbol: "BNB", name: "BNB", price: "$580.00", change: "+1.50%", iconUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.svg" },
  { symbol: "XRP", name: "XRP", price: "$0.62", change: "-0.50%", iconUrl: "https://cryptologos.cc/logos/xrp-xrp-logo.svg", invert: true },
  { symbol: "USDC", name: "USD Coin", price: "$1.00", change: "0.00%", iconUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg" },
  { symbol: "FLR", name: "Flare", price: "$0.03", change: "+4.20%", iconUrl: "/FLR-icon200x200.png" },
  { symbol: "DOGE", name: "Dogecoin", price: "$0.16", change: "+5.40%", iconUrl: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg" },
];

const infrastructureFeatures = [
  {
    title: "AI Threat Detection",
    description: "Real-time AI analysis of transactions and smart contracts to instantly identify and block malicious activities.",
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  },
  {
    title: "Confidential Compute",
    description: "Secure enclaves protect sensitive user data and proprietary fraud-detection models from exposure.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    title: "Decentralized Reputation",
    description: "A community-driven risk registry that tracks known scammers and suspicious addresses across multiple chains.",
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
];

const productLinks = [
  "Threat Detection",
  "TEE Workers",
  "Scam Registry",
  "Smart Contracts",
  "AI Models",
];

const companyLinks = [
  "Documentation",
  "API Reference",
  "Report Scam",
  "Audit Reports",
  "Privacy Policy",
];

const faqs = [
  { question: "How does Sentriq work?", answer: "Sentriq utilizes AI and Confidential Computing to analyze transactions across multiple blockchains in real-time, detecting and preventing fraudulent activities before they affect you." },
  { question: "How does Sentriq track malicious assets?", answer: "We maintain a decentralized Scam Registry and use on-chain analytics to trace funds, ensuring scammers are identified and blacklisted continuously." },
  { question: "Does Sentriq support multiple cryptocurrencies?", answer: "Yes, our cross-chain infrastructure supports a wide variety of standard tokens and major ecosystems like Ethereum, BSC, and Flare." },
  { question: "Are my funds and data secure?", answer: "Absolutely. We run our proprietary fraud-detection models inside TEEs (Trusted Execution Environments), ensuring your sensitive data is never exposed." },
];

function LogoIcon() {
  return (
    <svg width="26" height="32" viewBox="0 0 26 32" fill="none">
      <path
        d="M19 3H7C3.13401 3 0 6.13401 0 10V22C0 25.866 3.13401 29 7 29H19C22.866 29 26 25.866 26 22V10C26 6.13401 22.866 3 19 3Z"
        fill="#FC6D01"
      />
      <path
        d="M7 12.375V23H8.436V21.324C8.43637 20.2642 8.8214 19.2406 9.51956 18.4433C10.2177 17.646 11.1816 17.1293 12.232 16.989C12.3723 15.9384 12.8892 14.9744 13.6867 14.2762C14.4842 13.578 15.5081 13.1931 16.568 13.193H19.188V8H11.375C10.2147 8 9.10188 8.46094 8.28141 9.28141C7.46094 10.1019 7 11.2147 7 12.375Z"
        fill="white"
      />
      <path
        d="M11.8204 22.6555H15.1424C15.6247 22.6557 16.1023 22.5609 16.5479 22.3765C16.9935 22.192 17.3984 21.9216 17.7395 21.5806C18.0805 21.2395 18.351 20.8346 18.5354 20.389C18.7199 19.9434 18.8147 19.4658 18.8144 18.9835V16.6055H12.4384C12.2417 16.6055 12.0484 16.6185 11.8584 16.6445C11.8314 16.8363 11.8184 17.0298 11.8194 17.2235L11.8204 22.6555Z"
        fill="white"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M8.22981 3.33603C8.41181 3.16403 8.70581 3.16403 8.88781 3.33603L12.6148 6.85903C12.7958 7.03103 12.7958 7.30903 12.6148 7.48103L8.88781 11.004C8.70581 11.176 8.41181 11.176 8.22981 11.004C8.04781 10.832 8.04781 10.553 8.22981 10.381L11.1608 7.61003H2.34881C2.09181 7.61003 1.88281 7.41303 1.88281 7.17003C1.88281 6.92703 2.09181 6.73003 2.34881 6.73003H11.1608L8.22981 3.95903C8.04781 3.78703 8.04781 3.50803 8.22981 3.33603Z"
        fill="white"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M6.45325 1.71325C6.82825 0.76225 8.17225 0.76225 8.54725 1.71325L9.70925 4.65725C9.82325 4.94725 10.0533 5.17725 10.3433 5.29125L13.2872 6.45325C14.2382 6.82825 14.2382 8.17225 13.2872 8.54725L10.3433 9.70925C10.0533 9.82325 9.82325 10.0533 9.70925 10.3433L8.54725 13.2872C8.17225 14.2382 6.82825 14.2382 6.45325 13.2872L5.29125 10.3433C5.17725 10.0533 4.94725 9.82325 4.65725 9.70925L1.71325 8.54725C0.76225 6.82825 0.76225 6.82825 1.71325 6.45325L4.65725 5.29125C4.94725 5.17725 5.17725 4.94725 5.29125 4.65725L6.45325 1.71325Z"
        fill="#FC6D01"
      />
      <path
        d="M13.5 12.2C13.7 11.6 14.4 11.6 14.6 12.2L15.1 13.5C15.2 13.7 15.3 13.8 15.5 13.9L16.8 14.4C17.4 14.6 17.4 15.3 16.8 15.5L15.5 16.0C15.3 16.1 15.2 16.2 15.1 16.4L14.6 17.7C14.4 18.3 13.7 18.3 13.5 17.7L13.0 16.4C12.9 16.2 12.8 16.1 12.6 16.0L11.3 15.5C10.7 15.3 10.7 14.6 11.3 14.4L12.6 13.9C12.8 13.8 12.9 13.7 13.0 13.5L13.5 12.2Z"
        fill="#FC6D01"
      />
    </svg>
  );
}

import "./BuilderLanding.css";

export default function BuilderLanding() {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState<'card1' | 'card2'>('card1');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    initOfficialReownAppKit();
  }, []);

  // Auto-redirect to /SantriqAI when wallet connects via Reown
  useEffect(() => {
    const kit = getAppKit();
    if (!kit) return;

    const unsub = kit.subscribeEvents((event: any) => {
      if (event?.data?.event === 'CONNECT_SUCCESS') {
        // Save wallet address if available
        const addr = kit.getAddress();
        if (addr) localStorage.setItem('sentriq_wallet', addr);
        router.push('/SantriqAI');
      }
    });

    return () => { if (typeof unsub === 'function') unsub(); };
  }, [router]);

  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openOfficialReownModal();
  };

  const [phoneState, setPhoneState] = useState<'home' | 'listening' | 'chat'>('home');

  const ecgPath1 = [
    "L 15 30 L 25 60 L 35 20 L 45 45 L 55 25 L 65 50 L 75 35 L 85 70 L 95 30 L 105 85",
    "L 115 45 L 125 65 L 135 25 L 145 55 L 155 30 L 165 70 L 175 40 L 185 60 L 195 20 L 205 75",
    "L 215 35 L 225 50 L 235 15 L 245 65 L 255 30 L 265 80 L 275 40 L 285 60 L 295 25 L 300 45"
  ].join(" ");

  const ecgPath2 = [
    "L 15 45 L 25 35 L 35 65 L 45 20 L 55 50 L 65 30 L 75 75 L 85 40 L 95 60 L 105 25",
    "L 115 80 L 125 35 L 135 55 L 145 15 L 155 65 L 165 30 L 175 70 L 185 45 L 195 60 L 205 20",
    "L 215 75 L 225 35 L 235 50 L 245 15 L 255 65 L 265 30 L 275 80 L 285 40 L 295 60 L 300 45"
  ].join(" ");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCard(prev => (prev === 'card1' ? 'card2' : 'card1'));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          heroVisual.classList.add('visible');
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(heroVisual);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Entry Stagger Reveal Animation for Features Section Cards
    gsap.fromTo(
      ".feature-main-card, .feature-sub-card",
      { opacity: 0, y: 50, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".features-container",
          start: "top 85%",
          toggleActions: "play none none none",
        }
      }
    );

    // Entry Stagger Reveal Animation for Platform Section Cards
    gsap.fromTo(
      ".platform-card",
      { opacity: 0, y: 50, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".platform-container",
          start: "top 85%",
          toggleActions: "play none none none",
        }
      }
    );

    // Entry Stagger Reveal Animation for Market Section Tickers
    gsap.fromTo(
      ".ticker-card",
      { opacity: 0, y: 40, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".ticker-grid",
          start: "top 85%",
          toggleActions: "play none none none",
        }
      }
    );

    // Entry Stagger Reveal Animation for Infrastructure Section
    gsap.fromTo(
      ".feature-card",
      { opacity: 0, y: 50, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".feature-card-grid",
          start: "top 85%",
          toggleActions: "play none none none",
        }
      }
    );

    // Entry Stagger Reveal Animation for Security Section Dash-cards
    gsap.fromTo(
      ".dash-card",
      { opacity: 0, y: 50, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".security-content",
          start: "top 85%",
          toggleActions: "play none none none",
        }
      }
    );

    // Mouse tilt & spotlight glow follower for all interactive cards
    const cards = document.querySelectorAll(
      ".feature-main-card, .feature-sub-card, .platform-card, .ticker-card, .feature-card, .dash-card"
    );

    cards.forEach((card) => {
      const handleMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;

        // 3D Tilt calculation
        const tiltX = ((y / rect.height) - 0.5) * -10;
        const tiltY = ((x / rect.width) - 0.5) * 10;

        gsap.to(card, {
          rotateX: tiltX,
          rotateY: tiltY,
          transformPerspective: 1000,
          duration: 0.3,
          ease: "power2.out",
        });

        // Glow spotlight positioning
        const glow = (card as HTMLElement).querySelector(
          ".card-glow, .feature-sub-glow, .ticker-card-glow, .feature-card-glow"
        );
        if (glow) {
          gsap.to(glow, {
            left: `${x}px`,
            top: `${y}px`,
            xPercent: -50,
            yPercent: -50,
            opacity: 0.45,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.6,
          ease: "power2.out",
        });

        const glow = (card as HTMLElement).querySelector(
          ".card-glow, .feature-sub-glow, .ticker-card-glow, .feature-card-glow"
        );
        if (glow) {
          gsap.to(glow, {
            opacity: 0.2,
            duration: 0.6,
            ease: "power2.out",
          });
        }
      };

      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className={`${manrope.variable} ${marhey.variable} landing-root`}>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="brand-link" style={{ marginLeft: '20px' }}>
            <img src="/logo.png" alt="Sentriq" style={{ height: '30px', width: 'auto' }} />
            <span className="brand">Sentriq</span>
          </Link>
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link}>
                <Link href="#">{link}</Link>
              </li>
            ))}
          </ul>
          <div className="cta-wrapper">
            <button type="button" onClick={handleGetStartedClick} className="cta-button" style={{ border: 'none', cursor: 'pointer' }}>
              Get Started
              <ArrowIcon />
            </button>
            <div className="cta-glow" />
          </div>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-bg-image">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/0662cf9b22842f581888a66d061dc81f936ffd4a?width=5124"
            alt=""
          />
        </div>
        <div className="glow-blob hero-glow-1" />
        <div className="glow-blob hero-glow-2" />

        <div className="hero-copy">
          <div className="badge-pill with-icon">
            <SparkleIcon />
            <span>AI-Powered Fraud Detection</span>
          </div>
          <h1 className="hero-title">Real-Time Protection For Your Digital Assets</h1>
          <p className="hero-subtitle">
            Sentriq is an AI-driven security platform that detects scams, monitors smart contracts, and safeguards your crypto transactions with confidential TEE workers.
          </p>
          <div className="cta-wrapper">
            <button type="button" onClick={handleGetStartedClick} className="cta-button" style={{ border: 'none', cursor: 'pointer' }}>
              Get Started
              <ArrowIcon />
            </button>
            <div className="cta-glow" />
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-col">
            {/* Live Chart Card */}
            <div className="hero-chart-card">
              <div className="chart-header">
                <div className="chart-info">
                  <span className="chart-date">Scams Detected</span>
                  <span className="chart-value">12,847 <span className="chart-percentage">+8.4%</span></span>
                </div>
              </div>
              <div className="chart-visual-wrapper">
                <svg className="hero-svg-chart" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    className="animated-chart-path"
                    d={`M 0 50 ${ecgPath1}`}
                    stroke="url(#chartGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      // @ts-ignore
                      "--ecg-path-1": `path("M 0 50 ${ecgPath1}")`,
                      // @ts-ignore
                      "--ecg-path-2": `path("M 0 50 ${ecgPath2}")`,
                    }}
                  />
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ea580c" />
                      <stop offset="100%" stopColor="#d32800" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="chart-timeline">
                <span>Aug 01</span>
                <span>Aug 02</span>
                <span className="active">Aug 03</span>
                <span>Aug 04</span>
                <span>Aug 05</span>
                <span>Aug 06</span>
              </div>
            </div>

            {/* FLR Swap/Balance Card */}
            <div className="hero-coin-swap-card">
              <div className="coin-header">
                <div className="coin-select">
                  <img src="/FLR-icon200x200.png" alt="FLR" className="coin-icon" />
                  <span className="coin-symbol">FLR</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#fff" strokeWidth="1.5" /></svg>
                </div>
                <button className="coin-action-btn">Send</button>
              </div>
              <div className="coin-amount-row">
                <button className="amount-helper-btn">Half</button>
                <span className="coin-amount">1,040</span>
                <button className="amount-helper-btn">Max</button>
              </div>
              <span className="coin-balance-lbl">Balance: 5,698 FLR</span>
            </div>

            {/* USDC Mini Card */}
            <div className="hero-mini-coin-card">
              <div className="mini-coin-left">
                <div className="mini-coin-icon-wrapper usdc">
                  <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg" alt="USDC" style={{ width: "100%", height: "100%" }} />
                </div>
                <div className="mini-coin-info">
                  <span className="mini-coin-name">USDC</span>
                  <span className="mini-coin-fullname">USD Coin</span>
                </div>
              </div>
              <div className="mini-coin-right">
                <span className="mini-coin-price">$1.00</span>
                <span className="mini-coin-change green">0.00%</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-phone interactive-phone-wrapper">
            <img
              src="/Second.png"
              alt="Scam Guardian Mobile Interface"
              style={{
                width: '370px',
                height: 'auto',
                display: 'block',
                borderRadius: '0'
              }}
            />
          </div>

          <div className="hero-visual-col">
            {/* Card Balance Glass Card */}
            <div className="hero-card-slider-wrapper">
              <div
                className="hero-balance-glass-card interactive-debit-card"
                onClick={() => setActiveCard(activeCard === 'card1' ? 'card2' : 'card1')}
                style={{ cursor: 'pointer' }}
              >
                {/* SVG Background Layer */}
                <div className="card-svg-bg-wrapper">
                  {/* SVG 1: Linear Gradient */}
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 337 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="card-bg-gradient-svg"
                    preserveAspectRatio="none"
                  >
                    <rect
                      width="337"
                      height="100"
                      fill="url(#paint0_linear_417_9252)"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_417_9252"
                        x1="0"
                        y1="50"
                        x2="337"
                        y2="50"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#D32800" />
                        <stop offset="1" stopColor="#DF792C" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* SVG 2: Glowing Blob */}
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 280 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="card-bg-blob-svg"
                    preserveAspectRatio="none"
                  >
                    <g filter="url(#filter0_f_417_9253)">
                      <circle cx="133" cy="50" r="76" fill="url(#paint0_linear_417_9253)" />
                    </g>
                    <defs>
                      <filter
                        id="filter0_f_417_9253"
                        x="-13"
                        y="-40"
                        width="292"
                        height="292"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                      >
                        <feGaussianBlur stdDeviation="25" />
                      </filter>
                      <linearGradient
                        id="paint0_linear_417_9253"
                        x1="209"
                        y1="50"
                        x2="57"
                        y2="50"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#EC957C" />
                        <stop offset="1" stopColor="#EC957C" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Card Contents */}
                <div className="card-inner-content">
                  <div className="glass-card-header">
                    <span className="glass-card-lbl">Card balance</span>
                    <span className="glass-card-number">
                      {activeCard === 'card1' ? '*** 8562' : '*** 4210'}
                    </span>
                  </div>
                  <h3 className="glass-card-value">
                    {activeCard === 'card1' ? '$23,662.12' : '$18,652.11'}
                  </h3>
                  <div className="glass-card-footer">
                    <div className="mastercard-logo">
                      <span className="mc-red-circle" />
                      <span className="mc-orange-circle" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dots Pagination */}
              <div className="card-slider-dots">
                <span
                  className={`slider-dot ${activeCard === 'card1' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCard('card1');
                  }}
                />
                <span
                  className={`slider-dot ${activeCard === 'card2' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCard('card2');
                  }}
                />
              </div>
            </div>

            {/* FLR Price Mini Card */}
            <div className="hero-mini-coin-card">
              <div className="mini-coin-left">
                <div className="mini-coin-icon-wrapper flr">
                  <img src="/FLR-icon200x200.png" alt="FLR" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                </div>
                <div className="mini-coin-info">
                  <span className="mini-coin-name">Flare</span>
                  <span className="mini-coin-fullname">FLR</span>
                </div>
              </div>
              <div className="mini-coin-right">
                <span className="mini-coin-price">$0.032</span>
                <span className="mini-coin-change green">+4.20%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="trusted-section">
        <div className="section-heading centered">
          <div className="badge-pill small">Partners</div>
          <h2 className="heading-lg">Trusted by Web3 & Security Leaders</h2>
        </div>
        <div className="logo-strip">
          {partnerLogos.map((partner) => (
            <div className="logo-card" key={partner.name} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "12px 20px" }}>
              <img src={partner.logo} alt={partner.name} style={{ width: "24px", height: "24px", objectFit: "contain", filter: partner.invert ? "invert(1)" : "none" }} />
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>{partner.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <div className="about-content">
          <div className="about-left">
            <div className="badge-pill small">About us</div>
            <h2 className="heading-lg">Next-Gen Fraud Prevention Starts Here</h2>
            <p className="body-text muted">
              Sentriq is built on confidential TEE computing & real-time AI threat intelligence to safeguard every wallet.
            </p>
          </div>
          <div className="about-right">
            {stats.map((stat) => (
              <div className="stat-row" key={stat.label}>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading split">
          <div>
            <div className="badge-pill small">Features</div>
            <h2 className="heading-lg">
              Next-Gen Anti-Scam Infrastructure
            </h2>
          </div>
          <p className="body-text muted intro-paragraph">
            Detect threats, audit smart contracts, and protect your digital assets instantly from one unified platform.
          </p>
        </div>

        <div className="features-container">
          <div className="feature-main-card">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/5b0c2c84caf97ac9cc515bc3f1fc2f332c3f34bd?width=2326"
              className="card-silk-overlay"
              alt=""
            />
            <div className="feature-main-glow" />
            <div className="feature-main-text">
              <h3 className="feature-card-title">Real-Time Fraud Detection</h3>
              <p className="body-text muted feature-card-desc">
                Monitor incoming and outgoing crypto transactions instantly using confidential AI models.
              </p>
            </div>
            <div className="feature-main-visual">
              <div className="sentriq-mockup-card">
                <div className="mockup-header">
                  <div className="mockup-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot white" />
                  </div>
                  <div className="mockup-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FC6D01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Sentriq TEE Enclave v2.4 • Active
                  </div>
                </div>

                <div className="mockup-body">
                  <div className="mockup-row">
                    <span className="row-label">Live Threat Scanning</span>
                    <span className="row-pill">● 0 Threats Detected</span>
                  </div>

                  <div className="mockup-grid-two">
                    <div className="clean-stat-item">
                      <span className="clean-label">SECURITY RATING</span>
                      <span className="clean-val text-white">99.9% Protected</span>
                    </div>
                    <div className="clean-stat-item">
                      <span className="clean-label">TEE ENVIRONMENT</span>
                      <span className="clean-val text-orange">Intel SGX Worker</span>
                    </div>
                  </div>

                  <div className="mockup-progress-bar">
                    <div className="progress-info">
                      <span>Confidential AI Processing Speed</span>
                      <span className="progress-percentage">0.42 ms</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: '92%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="features-bottom-grid">
            <div className="feature-sub-card">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/5b0c2c84caf97ac9cc515bc3f1fc2f332c3f34bd?width=2326"
                className="card-silk-overlay"
                alt=""
              />
              <div className="feature-sub-glow" />
              <div className="feature-sub-visual">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/1692aeb8e28d713470d5899323efa299ed566e4a?width=868"
                  alt="On-Chain Threat Monitoring"
                />
              </div>
              <div className="feature-sub-text">
                <h3 className="feature-card-title">On-Chain Threat Monitoring</h3>
                <p className="body-text muted feature-card-desc">
                  Scan smart contract interactions and trace malicious addresses across multiple blockchains.
                </p>
              </div>
            </div>

            <div className="feature-sub-card">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/5b0c2c84caf97ac9cc515bc3f1fc2f332c3f34bd?width=2326"
                className="card-silk-overlay"
                alt=""
              />
              <div className="feature-sub-glow" />
              <div className="feature-sub-visual">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/eed1a59bf5ddf37b64cc0fa4d173f306328980e2?width=1179"
                  alt="Confidential TEE Shield"
                />
              </div>
              <div className="feature-sub-text">
                <h3 className="feature-card-title">Confidential TEE Shield</h3>
                <p className="body-text muted feature-card-desc">
                  Execute security checks inside Trusted Execution Environments for 100% data privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="platform-section">
        <div className="section-heading centered">
          <div className="badge-pill small">Platform</div>
          <h2 className="heading-lg">
            Built for Security, Speed, and Reliability
          </h2>
          <p className="body-text muted intro-paragraph">
            A powerful infrastructure designed to protect assets and deliver
            consistent performance.
          </p>
        </div>
        <div className="platform-container">
          <div className="platform-top-grid">
            {platformFeatures.slice(0, 2).map((feature) => (
              <div className="platform-card" key={feature.title}>
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/5b0c2c84caf97ac9cc515bc3f1fc2f332c3f34bd?width=2326"
                  className="card-silk-overlay"
                  alt=""
                />
                <div className="glow-blob card-glow" />
                <div className="platform-card-visual">
                  <img src={feature.imageUrl} alt={feature.title} />
                </div>
                <div className="platform-card-text">
                  <h3 className="heading-sm">{feature.title}</h3>
                  <p className="body-text muted">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="platform-bottom-grid">
            {platformFeatures.slice(2).map((feature) => (
              <div className="platform-card" key={feature.title}>
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/5b0c2c84caf97ac9cc515bc3f1fc2f332c3f34bd?width=2326"
                  className="card-silk-overlay"
                  alt=""
                />
                <div className="glow-blob card-glow" />
                <div className="platform-card-visual small">
                  <img src={feature.imageUrl} alt={feature.title} />
                </div>
                <div className="platform-card-text">
                  <h3 className="heading-sm">{feature.title}</h3>
                  <p className="body-text muted">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="market-section">
        <div className="section-heading">
          <div className="badge-pill small">Threat Intelligence</div>
          <h2 className="heading-lg">
            Real-Time Scam Detection Across All Major Assets
          </h2>
          <p className="body-text muted intro-paragraph">
            Sentriq monitors live threats across top cryptocurrencies, instantly flagging suspicious activity and protecting your portfolio.
          </p>
        </div>
        <div className="ticker-grid">
          {marketTickers.map((ticker) => (
            <div className="ticker-card" key={ticker.symbol}>
              <div className="ticker-card-glow" />
              <div className="ticker-card-content">
                <div className="ticker-top">
                  <div className="ticker-icon" style={{ padding: 0, overflow: "hidden" }}>
                    {ticker.iconUrl ? (
                      <img
                        src={ticker.iconUrl}
                        alt={ticker.symbol}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          filter: ticker.invert ? "invert(1) brightness(2)" : "none"
                        }}
                      />
                    ) : (
                      <div className="icon-placeholder" />
                    )}
                  </div>
                  <div className="ticker-title">
                    <h3 className="heading-sm" style={{ marginBottom: "0px" }}>{ticker.symbol}</h3>
                    <p className="body-text muted" style={{ fontSize: "16px" }}>{ticker.name}</p>
                  </div>
                </div>
                <div className="ticker-bottom">
                  <span className="ticker-change" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.00001 14.667C11.6821 14.667 14.667 11.6821 14.667 8.00001C14.667 4.31793 11.6821 1.33301 8.00001 1.33301C4.31793 1.33301 1.33301 4.31793 1.33301 8.00001C1.33301 11.6821 4.31793 14.667 8.00001 14.667Z" stroke="#0CBE4D" />
                      <path d="M6 10L10 6M10 9V6H7" stroke="#0CBE4D" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {ticker.change}
                  </span>
                  <span className="ticker-price">{ticker.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="infrastructure-section">
        <div className="section-heading centered">
          <div className="badge-pill small">Infrastructure</div>
          <h2 className="heading-lg">Built for a Decentralized Future</h2>
          <p className="body-text muted intro-paragraph">
            A scalable foundation designed for secure and seamless digital
            asset operations.
          </p>
        </div>
        <div className="feature-card-grid">
          {infrastructureFeatures.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className="feature-card-glow" />
              <div className="feature-card-content">
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3 className="heading-sm" style={{ marginBottom: "16px" }}>{feature.title}</h3>
                <p className="body-text muted">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="security-section">
        <div className="security-content">
          <div className="security-left">
            <div className="badge-pill small" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.45325 1.71301C6.82825 0.762006 8.17225 0.762006 8.54725 1.71301L9.70925 4.65701C9.82325 4.94701 10.0533 5.17701 10.3433 5.29101L13.2872 6.45301C14.2382 6.82801 14.2382 8.17201 13.2872 8.54701L10.3433 9.70901C10.0533 9.82301 9.82325 10.053 9.70925 10.343L8.54725 13.287C8.17225 14.238 6.82825 14.238 6.45325 13.287L5.29125 10.343C5.17725 10.053 4.94725 9.82301 4.65725 9.70901L1.71325 8.54701C0.76225 8.17201 0.76225 6.82801 1.71325 6.45301L4.65725 5.29101C4.94725 5.17701 5.17725 4.94701 5.29125 4.65701L6.45325 1.71301Z" fill="#FC6D01" />
              </svg>
              <span>Security</span>
            </div>
            <h2 className="heading-lg">
              Confidential AI<br />Fraud Detection
            </h2>
            <p className="body-text muted" style={{ maxWidth: "440px" }}>
              Your transactions are analyzed inside secure Trusted Execution Environments (TEEs), ensuring absolute privacy and uncompromised protection against scams.
            </p>
            <Link href="/SantriqAI" className="cta-button" style={{ marginTop: "12px" }}>
              Get Started
              <ArrowIcon />
            </Link>
          </div>
          <div className="security-right">
            <div className="dash-grid">

              <div className="dash-card main-card">
                <div className="d-flex-between">
                  <span className="d-label">Network Status <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg></span>
                  <button className="d-icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>
                </div>
                <div className="d-value-row">
                  <span className="d-val">$1,750.82</span>
                  <span className="d-badge red-badge">Last 15 days</span>
                </div>
                <div className="d-divider" />
                <div className="d-actions">
                  <button className="d-action-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> View Audit Logs</button>
                  <button className="d-action-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> Block Threats</button>
                </div>
              </div>

              <div className="dash-card side-card" style={{ overflow: "hidden" }}>
                <div className="d-flex-between">
                  <span className="d-label" style={{ color: "#fff", fontSize: "16px" }}>Active Nodes</span>
                  <button className="d-icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></button>
                </div>
                <span className="d-badge red-badge" style={{ marginTop: "12px", display: "inline-block", background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>Premium TEE</span>
                <div className="d-card-stack">
                  <div className="d-inner-card">
                    <div className="d-flex-between">
                      <span className="d-inner-val">2,981</span>
                      <span className="d-inner-brand">FLR</span>
                    </div>
                    <div className="d-flex-between d-inner-foot">
                      <span>**** 1777</span>
                      <span>20/26</span>
                    </div>
                  </div>
                  <div className="d-inner-card secondary-card">
                    <div className="d-flex-between">
                      <span className="d-inner-val">$52...</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dash-card small-card">
                <div className="d-flex-between">
                  <div className="d-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9.5h6a1.5 1.5 0 0 0 0-3H9M9 17.5h6a1.5 1.5 0 0 0 0-3H9" /><path d="m14 10 3-3M7 17l3-3" /></svg>
                  </div>
                  <button className="d-icon-btn-small"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>
                </div>
                <div className="d-trend red-trend"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg> -1.78%</div>
                <div className="d-small-val">43,000</div>
                <div className="d-small-lbl">Threats Blocked</div>
              </div>

              <div className="dash-card small-card">
                <div className="d-flex-between">
                  <div className="d-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>
                  </div>
                  <button className="d-icon-btn-small"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>
                </div>
                <div className="d-trend green-trend"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg> +1.24%</div>
                <div className="d-small-val">$56M+</div>
                <div className="d-small-lbl">Funds Secured</div>
              </div>

              <div className="dash-card small-card">
                <div className="d-flex-between">
                  <div className="d-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9.5h6a1.5 1.5 0 0 0 0-3H9M9 17.5h6a1.5 1.5 0 0 0 0-3H9" /><path d="m10 14-3 3M17 7l-3 3" /></svg>
                  </div>
                  <button className="d-icon-btn-small"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>
                </div>
                <div className="d-trend green-trend"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg> +1.78%</div>
                <div className="d-small-val">78,000</div>
                <div className="d-small-lbl">Contracts Audited</div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-header">
          <div className="faq-header-left">
            <div className="badge-pill small" style={{ borderColor: "rgba(234, 88, 12, 0.5)", gap: "8px" }}>
              <SparkleIcon />
              FAQ
            </div>
            <h2 className="heading-lg" style={{ marginTop: "24px" }}>
              Frequently Asked<br />Questions Section
            </h2>
          </div>
          <div className="faq-header-right">
            <p className="body-text muted">
              Learn how Sentriq leverages AI and decentralized security to protect your digital assets instantly.
            </p>
          </div>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => {
            const num = (index + 1).toString().padStart(2, "0");
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? 'open' : ''}`}
              >
                <div
                  className="faq-item-header"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "32px 0" }}
                >
                  <div className="faq-item-title" style={{ fontSize: "20px", color: isOpen ? "#fff" : "rgba(255,255,255,0.7)", display: "flex", gap: "16px", fontWeight: "500" }}>
                    <span className="faq-num" style={{ color: "rgba(255,255,255,0.4)" }}>({num})</span> {faq.question}
                  </div>
                  <div className="faq-toggle" style={{
                    color: "rgba(255,255,255,0.7)",
                    transition: "transform 0.3s ease",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)"
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div
                  className="faq-item-body-container"
                  style={{
                    maxHeight: isOpen ? "200px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.3s ease-in-out, opacity 0.3s ease-in-out"
                  }}
                >
                  <div className="faq-item-body" style={{ paddingBottom: "32px", paddingLeft: "42px", maxWidth: "800px" }}>
                    <p className="body-text muted">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bottom-cta-section">
        <div className="bottom-cta-card">
          <div className="bottom-cta-glow-1" />
          <div className="bottom-cta-glow-2" />
          <h2 className="heading-lg" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
            Join The Sentriq Community And Secure Your Crypto Today
          </h2>
          <p className="body-text muted" style={{ maxWidth: "600px", margin: "24px auto 40px", textAlign: "center", position: "relative", zIndex: 2 }}>
            Manage, track, and secure your digital assets with an easy and reliable platform built for everyone.
          </p>
          <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
            <button type="button" onClick={handleGetStartedClick} className="cta-button" style={{ padding: "14px 28px", fontSize: "16px", border: 'none', cursor: 'pointer' }}>
              Get Started
              <ArrowIcon />
            </button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-columns">
          <div className="footer-column brand-column">
            <div className="brand" style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "24px", fontWeight: "600" }}>
              <img src="/logo.png" alt="Sentriq" style={{ height: '40px', width: 'auto' }} />
              <span>Sentriq</span>
            </div>
            <p className="body-text muted">
              Smarter control of your digital assets.
            </p>
          </div>
          <div className="footer-column">
            <h4 className="heading-xs" style={{ marginBottom: "20px" }}>Product</h4>
            <ul className="footer-link-list">
              {productLinks.map((link) => (
                <li key={link}>
                  <Link href="#">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-column">
            <h4 className="heading-xs" style={{ marginBottom: "20px" }}>Resources</h4>
            <ul className="footer-link-list">
              {companyLinks.map((link) => (
                <li key={link}>
                  <Link href="#">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-column">
            <h4 className="heading-xs" style={{ marginBottom: "20px" }}>Subscribe Form</h4>
            <form className="subscribe-form">
              <input
                type="email"
                placeholder="Enter your email...."
                className="subscribe-input"
              />
              <button type="submit" className="subscribe-button">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bottom" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px", textAlign: "center" }}>
          <p className="copyright" style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>© 2026 Sentriq. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
