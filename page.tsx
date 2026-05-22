"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Math-precise design tokens matching Stitch Cyber-Goth Editorial identity
const EASE_CUBIC = [0.16, 1, 0.3, 1]; // Premium enterprise velocity curve

interface Product {
  id: number;
  title: string;
  price: string;
  category: string;
  image: string;
  inStock: boolean;
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    title: "Venom Spider Ring",
    price: "Rs. 3,499",
    category: "rings",
    image: "assets/venom_spider_ring.png",
    inStock: true,
  },
  {
    id: 2,
    title: "Crimson Cross",
    price: "Rs. 4,499",
    category: "chains",
    image: "assets/crimson_cross_choker.png",
    inStock: true,
  },
  {
    id: 3,
    title: "Obsidian Helix",
    price: "Rs. 5,999",
    category: "chains",
    image: "assets/obsidian_helix_chain.png",
    inStock: true,
  },
  {
    id: 4,
    title: "Shadow Claw",
    price: "Rs. 3,899",
    category: "rings",
    image: "assets/shadow_claw_ring.png",
    inStock: true,
  },
  {
    id: 5,
    title: "Spine Bracelet",
    price: "Rs. 6,899",
    category: "chains",
    image: "assets/spine_bracelet.png",
    inStock: true,
  },
  {
    id: 6,
    title: "Reaper Pendant",
    price: "Rs. 7,499",
    category: "pendants",
    image: "assets/reaper_pendant.png",
    inStock: true,
  },
];

export default function GothicNovaLanding() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [syncedIds, setSyncedIds] = useState<number[]>([]);
  const [syncStatusText, setSyncStatusText] = useState<string>(
    "[Pitch Presentation: Trigger Inventory Sync]"
  );

  // Filter products based on active category tab
  const filteredProducts = products.filter(
    (p) => activeFilter === "all" || p.category === activeFilter
  );

  // Shopify Sync Cascade Simulation
  const handleSyncToggle = () => {
    if (!isSynced) {
      setSyncStatusText("Syncing with Shopify API...");
      setIsSynced(true);

      // Randomly select 3 items to sell out in staggered cascade
      setTimeout(() => {
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const selectedIds = shuffled.slice(0, 3).map((p) => p.id);
        setSyncedIds(selectedIds);

        setProducts((prev) =>
          prev.map((p) =>
            selectedIds.includes(p.id) ? { ...p, inStock: false } : p
          )
        );
        setSyncStatusText("[Sync Active: 3 Items Sold Out]");
      }, 1200);
    } else {
      setSyncStatusText("Restoring inventory...");
      setTimeout(() => {
        setProducts(INITIAL_PRODUCTS);
        setSyncedIds([]);
        setIsSynced(false);
        setSyncStatusText("[Pitch Presentation: Trigger Inventory Sync]");
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white selection:bg-[#d21f1f] selection:text-white font-sans relative overflow-x-hidden">
      {/* 2.5% Premium Noise Grain Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Atmospheric Top Crimson Blood-Glow Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(210,31,31,0.08)_0%,transparent_60%)] pointer-events-none z-0"></div>

      {/* FIXED GLASSMORPHIC HEADER */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#0e0e10]/60 backdrop-blur-md border-b border-white/10 px-8 py-5 flex items-center justify-between">
        {/* Logo slide-in from left */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ ease: EASE_CUBIC, duration: 1.2 }}
          className="flex items-center gap-4"
        >
          <a
            href="#"
            className="w-10 h-10 rounded-full bg-[#131315] border border-white/15 flex items-center justify-center font-serif text-lg font-bold text-white tracking-tighter hover:border-[#d21f1f] transition-colors"
          >
            G
          </a>
          <a
            href="#"
            className="font-serif text-xl font-bold tracking-tight text-white hover:text-[#d21f1f] transition-colors hidden sm:block"
          >
            GOTHIC NOVA
          </a>
        </motion.div>

        {/* Right Nav buttons slide-in from right */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ ease: EASE_CUBIC, duration: 1.2 }}
          className="flex items-center gap-6"
        >
          <a
            href="#"
            className="text-xs font-semibold uppercase tracking-[0.15em] text-[#d21f1f] border border-[#d21f1f]/40 px-4 py-2.5 rounded-[4px] bg-transparent hover:bg-[#d21f1f] hover:text-white transition-all duration-300 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#d21f1f] animate-pulse"></span>
            FORGE HUB
          </a>
          <a
            href="#active-drop"
            className="text-xs font-semibold uppercase tracking-[0.15em] text-white hover:text-[#d21f1f] transition-colors"
          >
            LATEST DROP
          </a>
          <a
            href="#cart"
            className="relative p-1 text-white hover:text-[#d21f1f] transition-colors flex items-center gap-2"
            aria-label="Shopping Cart"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span className="font-mono text-xs text-[#d21f1f] font-bold">00</span>
          </a>
        </motion.div>
      </nav>

      {/* KINETIC HERO SECTION */}
      <header className="relative w-full h-screen flex flex-col items-center justify-center text-center px-4 z-20">
        <div className="max-w-4xl flex flex-col items-center">
          {/* Gothic Nova H1 slides directly from left */}
          <div className="overflow-hidden mb-6">
            <motion.h1
              initial={{ x: -150, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ ease: EASE_CUBIC, duration: 1.5 }}
              className="font-serif text-6xl md:text-8xl lg:text-[7.5rem] font-bold tracking-tight text-white leading-[0.95]"
            >
              GOTHIC NOVA
            </motion.h1>
          </div>

          {/* Subtext description counter-slides from right with delayed stagger */}
          <div className="overflow-hidden mb-12 max-w-xl">
            <motion.p
              initial={{ x: 150, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ ease: EASE_CUBIC, duration: 1.5, delay: 0.2 }}
              className="font-sans text-neutral-400 text-sm md:text-base tracking-wide leading-relaxed"
            >
              Gothic × Japanese Jewelry. Limited. Dark. Eternal. Wear the
              darkness you feel. Crafted with uncompromising precision.
            </motion.p>
          </div>

          {/* Primary Explore button slides up from bottom */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ease: EASE_CUBIC, duration: 1.5, delay: 0.4 }}
          >
            <a
              href="#active-drop"
              className="px-10 py-4 border border-[#d21f1f]/45 hover:border-[#d21f1f] rounded-[4px] text-xs font-semibold uppercase tracking-[0.2em] text-white bg-transparent hover:bg-[#d21f1f] transition-all duration-500 shadow-[0_0_15px_rgba(210,31,31,0)] hover:shadow-[0_0_25px_rgba(210,31,31,0.3)]"
            >
              Explore Drop
            </a>
          </motion.div>
        </div>

        {/* Floating animated scroll prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="absolute bottom-8 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500">
            Scroll to Forging
          </span>
          <svg
            className="w-4 h-4 text-neutral-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </header>

      {/* THE ACTIVE DROP GRID SECTION */}
      <section
        id="active-drop"
        className="w-full max-w-7xl mx-auto px-8 md:px-16 py-32 z-20 relative"
      >
        {/* Header Title Grid */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ ease: EASE_CUBIC, duration: 1.0 }}
          className="border-left-gradient border-l-2 border-[#d21f1f] pl-8 mb-20 max-w-2xl text-left"
        >
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#d21f1f] block mb-3">
            NOW ONLINE
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            ACTIVE DROP / 001
          </h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed font-sans">
            Sourced and forged from high-grade silver, titanium alloys, and
            obsidian gems. Exquisite custom geometry.
          </p>
        </motion.header>

        {/* CATEGORY FILTER TABS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ ease: EASE_CUBIC, duration: 1.0, delay: 0.1 }}
          className="flex flex-wrap gap-4 border-b border-white/5 pb-8 mb-16 text-left"
        >
          {["all", "chains", "rings", "pendants"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-6 py-2.5 rounded-[4px] text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 border ${
                activeFilter === cat
                  ? "border-[#d21f1f] bg-[#d21f1f]/10 text-white"
                  : "border-white/5 bg-[#131315]/40 text-neutral-400 hover:text-white hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* THE MASTER GRID (Pure CSS 3-column Desktop layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((p, index) => (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{
                  ease: EASE_CUBIC,
                  duration: 0.9,
                  delay: (index % 3) * 0.1, // Stagger rows
                }}
                whileHover={{ scale: 1.03, y: -8 }}
                className="group relative flex flex-col justify-between h-full bg-[#131315] border border-white/5 p-6 rounded-[4px] transition-all duration-500 overflow-hidden hover:border-[#d21f1f]/35 hover:shadow-[0_20px_40px_rgba(0,0,0,0.95)]"
              >
                {/* Sold Out Glassmorphic overlay */}
                <div
                  className={`absolute inset-0 bg-black/65 backdrop-blur-sm z-30 flex items-center justify-center transition-all duration-500 pointer-events-none ${
                    p.inStock ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  <span className="px-6 py-3 border border-[#d21f1f]/60 text-white bg-[#d21f1f]/15 rounded-[4px] font-mono text-xs font-bold tracking-[0.2em] transform -rotate-[5deg] shadow-[0_0_20px_rgba(210,31,31,0.3)]">
                    SOLD OUT
                  </span>
                </div>

                {/* Subtle Card Accent Flares */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 group-hover:border-[#d21f1f]/60 transition-colors"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 group-hover:border-[#d21f1f]/60 transition-colors"></div>

                <div>
                  {/* Aspect Ratio 3:4 Luxury Portrait Wrapper */}
                  <div className="w-full aspect-[3/4] bg-[#0b0b0c] overflow-hidden relative border border-white/5 rounded-[2px] mb-6">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 filter brightness-[0.82] contrast-[1.05] group-hover:brightness-[0.95]"
                    />
                  </div>

                  {/* Card metadata pixel-perfect alignment */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-serif text-lg font-bold uppercase tracking-tight text-white group-hover:text-[#d21f1f] transition-colors">
                      {p.title}
                    </h3>
                    <span className="font-mono text-sm font-semibold text-[#d21f1f] whitespace-nowrap pl-4">
                      {p.price}
                    </span>
                  </div>
                </div>

                <div>
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 mb-6">
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        p.inStock
                          ? "bg-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.5)] animate-pulse"
                          : "bg-[#d21f1f] shadow-[0_0_8px_rgba(210,31,31,0.5)]"
                      }`}
                    ></span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest ${
                        p.inStock ? "text-[#00ff66]" : "text-neutral-500"
                      }`}
                    >
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  {/* Ghost-styled primary button */}
                  <button
                    disabled={!p.inStock}
                    className={`w-full py-4 border rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all duration-300 ${
                      p.inStock
                        ? "border-[#d21f1f]/45 text-white bg-transparent hover:bg-[#d21f1f] hover:border-[#d21f1f] hover:shadow-[0_0_15px_rgba(210,31,31,0.4)]"
                        : "border-neutral-800 text-neutral-600 bg-transparent cursor-not-allowed"
                    }`}
                  >
                    {p.inStock ? (
                      <>
                        <svg
                          className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        ADD TO CART
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        OUT OF STOCK
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* AUTOMATION PRESENTATION SYNC TOGGLE */}
      <div className="w-full flex justify-center py-12 z-20 relative">
        <button
          onClick={handleSyncToggle}
          className="px-6 py-3 border border-white/10 hover:border-white/35 text-xs text-neutral-400 hover:text-white rounded-[4px] bg-[#0e0e10]/60 backdrop-blur-sm transition-all duration-300 flex items-center gap-3 active:scale-95"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSynced ? "bg-[#d21f1f]" : "bg-neutral-500"
            } animate-pulse`}
          ></span>
          {syncStatusText}
        </button>
      </div>

      {/* DARK, INDUSTRIAL 4-COLUMN FOOTER */}
      <footer className="w-full bg-[#040405] border-t border-white/5 py-24 px-8 md:px-16 z-20 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          {/* Column 1: Brand Info */}
          <div>
            <h4 className="font-serif text-lg font-bold tracking-tight text-white mb-6">
              GOTHIC NOVA
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-[200px]">
              Cyber-Goth Editorial Jewelry Engine. Crafted under absolute
              darkness for the unapologetic and eternal.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h5 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">
              NAVIGATE
            </h5>
            <ul className="space-y-4 text-xs">
              {["Latest Drop", "Archive Collection", "Forge Hub Control", "Studio Journal"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-neutral-600 hover:text-white transition-colors duration-300"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Policy Specs */}
          <div>
            <h5 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">
              POLICIES
            </h5>
            <ul className="space-y-4 text-xs font-mono">
              <li className="text-neutral-600 hover:text-white transition-colors duration-300">
                Advance Payment Only Basis
              </li>
              <li className="text-neutral-600 hover:text-white transition-colors duration-300">
                Secure Tracking Provided
              </li>
              <li className="text-neutral-600 hover:text-white transition-colors duration-300">
                14-Day Exchange Policy
              </li>
            </ul>
          </div>

          {/* Column 4: Secure Ledger / Newsletter */}
          <div>
            <h5 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">
              SECURE LEDGER
            </h5>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              Register your public key to receive drop notifications in under 5
              milliseconds.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter public key..."
                className="w-full bg-[#131315]/60 border border-white/5 text-xs text-white px-4 py-3 rounded-l-[4px] focus:outline-none focus:border-[#d21f1f] transition-all duration-300 placeholder:text-neutral-700"
              />
              <button className="bg-[#131315] hover:bg-[#d21f1f] text-white border-y border-r border-white/5 hover:border-[#d21f1f] px-4 rounded-r-[4px] transition-all duration-300 flex items-center justify-center active:scale-[0.97]">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Sub-Info */}
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-left">
          <span className="text-[10px] text-neutral-700 font-mono">
            © 2026 GOTHIC NOVA. All Rights Forged.
          </span>
          <div className="flex gap-6 text-[10px] font-mono text-neutral-700">
            <a href="#" className="hover:text-white transition-colors">
              SECURITY_KEY
            </a>
            <a href="#" className="hover:text-white transition-colors">
              P2P_TERMS
            </a>
            <a href="#" className="hover:text-white transition-colors">
              SYSTEM_STATUS
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
