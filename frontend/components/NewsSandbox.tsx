'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Zap,
  HelpCircle,
  Search,
  Sliders,
  Volume2,
  VolumeX,
  Clock,
  Tag,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Table,
  CheckCircle,
  Eye,
  Activity,
  Layers,
  Terminal,
  CornerDownRight,
  Filter,
} from 'lucide-react';
import { useAdaptationStore } from '../store/adaptationStore';
import { useTelemetryStore } from '../store/telemetryStore';
import { trackDwell, trackViewSwitch, computeRollingFeatures } from '../lib/telemetry';

export interface Article {
  id: string;
  title: string;
  category: 'Artificial Intelligence' | 'Hardware' | 'Web Architecture' | 'Security';
  readTime: string;
  date: string;
  lead: string;
  tldrBullets: string[];
  fullParagraphs: string[];
  benchmarks: {
    metric: string;
    baseline: string;
    optimized: string;
    delta: string;
  }[];
  glossary: { term: string; definition: string }[];
}

const ARTICLES: Article[] = [
  {
    id: 'art-moe-scale',
    title: 'Sparse Mixture-of-Experts (MoE) at Scale: Inference Latency and KV Cache Bottlenecks',
    category: 'Artificial Intelligence',
    readTime: '4 min read',
    date: 'March 2026',
    lead: 'Sparse gating enables trillion-parameter capacity with sub-100B compute, but memory bandwidth constraints and unbalanced expert dispatch still throttle real-world token throughput.',
    tldrBullets: [
      'Top-2 router gating activates only 12.5% of total model parameters per forward token pass.',
      'KV cache memory consumption scales linearly with sequence length, causing GPU memory bandwidth thrashing.',
      'Speculative expert pre-fetching reduces inter-layer dispatch stalls by 34% on 8xH100 clusters.',
    ],
    fullParagraphs: [
      'Mixture-of-Experts architectures replace monolithic feed-forward layers with multiple parallel experts coordinated by a parametric router. While training compute scales efficiently because each token only interacts with top-k experts, inference latency presents unique memory-bandwidth bottlenecks.',
      'Under heavy multi-tenant serving workloads, dynamic dispatch produces token load imbalances across physical GPU nodes. Expert capacity factors force either token dropping or auxiliary routing latency when one expert exceeds its allocation threshold.',
      'Modern optimization techniques leverage quantized FP8 weight staging combined with speculative routing predictors. This allows secondary GPU clusters to pre-warm expert cache layers 2 layers in advance, yielding steady token generation speeds even at 32k context windows.',
    ],
    benchmarks: [
      { metric: 'First Token Latency (TTFT)', baseline: '420 ms', optimized: '165 ms', delta: '-60.7%' },
      { metric: 'Decode Throughput', baseline: '28 tok/s', optimized: '64 tok/s', delta: '+128.5%' },
      { metric: 'Peak KV Cache VRAM', baseline: '48 GB', optimized: '22 GB', delta: '-54.1%' },
    ],
    glossary: [
      { term: 'Router Top-k', definition: 'The gating function selecting the k highest-scoring expert subnetworks per token.' },
      { term: 'KV Cache', definition: 'Stored key-value activation states preserved across autoregressive generation steps.' },
    ],
  },
  {
    id: 'art-neuromorphic-vision',
    title: 'Neuromorphic Event Cameras vs. High-Framerate CMOS for High-Speed Robotic Vision',
    category: 'Hardware',
    readTime: '3 min read',
    date: 'February 2026',
    lead: 'Bio-inspired asynchronous vision sensors transmit microsecond pixel changes instead of full frames, radically shrinking power and bandwidth in edge robotics.',
    tldrBullets: [
      'Asynchronous pixels fire events only when logarithmic illumination changes exceed threshold.',
      'Temporal resolution reaches sub-10 microseconds with 120 dB dynamic range under direct sunlight.',
      'Data payload drops from 400 MB/s to 12 MB/s in low-clutter robotic stabilization tasks.',
    ],
    fullParagraphs: [
      'Traditional frame-based cameras sample the entire pixel matrix at fixed temporal intervals (30-240 FPS), generating massive amounts of redundant spatial data when scenes remain static.',
      'Neuromorphic silicon retina sensors mimic biological photoreceptors. Each pixel operates autonomously, emitting an asynchronous event stream consisting of (x, y, timestamp, polarity) only when illumination shifts.',
      'Because no global shutter exists, motion blur is virtually eliminated, enabling autonomous micro-drones and surgical robotic arms to react to microsecond disturbances while drawing less than 50 milliwatts.',
    ],
    benchmarks: [
      { metric: 'Motion Blur Latency', baseline: '16.6 ms', optimized: '0.04 ms', delta: '-99.7%' },
      { metric: 'Sensor Power Draw', baseline: '2.4 W', optimized: '45 mW', delta: '-98.1%' },
      { metric: 'Dynamic Range', baseline: '72 dB', optimized: '125 dB', delta: '+73.6%' },
    ],
    glossary: [
      { term: 'Temporal Resolution', definition: 'The smallest detectable time interval between successive sensor events.' },
      { term: 'Dynamic Range', definition: 'The ratio between the highest and lowest luminance values a sensor can capture without saturation.' },
    ],
  },
  {
    id: 'art-edge-streaming',
    title: 'Edge-First Web Frameworks and Zero-Bundle Client Streaming Architectures',
    category: 'Web Architecture',
    readTime: '5 min read',
    date: 'March 2026',
    lead: 'Replacing monolithic client hydration with fine-grained resumability and edge server components eliminates JavaScript parse bottlenecks on constrained mobile devices.',
    tldrBullets: [
      'Zero-JS initial render: Server emits raw HTML with inline resumability metadata serialized into DOM attributes.',
      'Partial hydration executes solely upon user interaction (click, focus, hover) rather than DOMContentLoaded.',
      'Total Blocking Time (TBT) on mid-tier mobile hardware plummets from 820ms to 12ms.',
    ],
    fullParagraphs: [
      'Modern web applications have historically suffered from the hydration tax: the browser receives server-rendered HTML, then downloads megabytes of JavaScript to re-execute component trees and attach event listeners.',
      'Resumable streaming architectures eliminate duplicate component execution. The server serializes reactive state directly into the HTML payload. Event listeners are proxied through a single ultra-lightweight global dispatcher (under 1.5 KB).',
      'When a user clicks an interactive element, the browser fetches only the micro-chunk required for that specific event handler. Non-interacted elements download zero client code, achieving sub-second Time to Interactive on budget smartphones.',
    ],
    benchmarks: [
      { metric: 'Client JS Bundle Size', baseline: '380 KB', optimized: '14 KB', delta: '-96.3%' },
      { metric: 'Total Blocking Time (TBT)', baseline: '640 ms', optimized: '18 ms', delta: '-97.2%' },
      { metric: 'Largest Contentful Paint', baseline: '1.9 s', optimized: '0.6 s', delta: '-68.4%' },
    ],
    glossary: [
      { term: 'Resumability', definition: 'Ability to pause execution on the server and resume seamlessly on the client without rebuilding the component tree.' },
      { term: 'Islands Architecture', definition: 'Rendering interactive dynamic islands of components within an otherwise static HTML ocean.' },
    ],
  },
  {
    id: 'art-pqc-protocols',
    title: 'Post-Quantum Cryptography in Web Protocols: Kyber vs Classic McEliece Overhead',
    category: 'Security',
    readTime: '4 min read',
    date: 'January 2026',
    lead: 'Integrating NIST-standardized lattice-based key encapsulation mechanisms into TLS 1.3 increases handshake packet sizes and TCP fragmentation risks.',
    tldrBullets: [
      'ML-KEM (Kyber-768) public keys are 1,184 bytes, fitting within standard 1,500-byte Ethernet MTU frames.',
      'Classic McEliece public keys exceed 250 KB, triggering severe IP packet fragmentation and 4x handshake latency.',
      'Hybrid post-quantum TLS 1.3 handshakes preserve backwards compatibility with classical X25519 curves.',
    ],
    fullParagraphs: [
      'With the advancement of fault-tolerant quantum computing, classical discrete logarithm and integer factorization cryptosystems (RSA and ECDHE) face obsolescence from Shor’s algorithm.',
      'NIST finalized post-quantum standards including ML-KEM (based on module lattices). While computationally faster than classical RSA, quantum-resistant public keys and ciphertexts are significantly larger.',
      'Network engineering evaluations show that ML-KEM-768 handshakes complete in under 1.2 round trips over transatlantic fiber, introducing less than 5ms overhead. Conversely, code-based mechanisms like McEliece create head-of-line TCP blocking.',
    ],
    benchmarks: [
      { metric: 'Public Key Size', baseline: '32 B (X25519)', optimized: '1,184 B (Kyber)', delta: '+36x' },
      { metric: 'Handshake Duration (WAN)', baseline: '38 ms', optimized: '44 ms', delta: '+15.7%' },
      { metric: 'Crypto CPU Encapsulation', baseline: '0.04 ms', optimized: '0.07 ms', delta: '+75.0%' },
    ],
    glossary: [
      { term: 'Lattice Cryptography', definition: 'Cryptographic primitives built on the computational hardness of high-dimensional geometric lattice problems.' },
      { term: 'Key Encapsulation (KEM)', definition: 'An encryption scheme designed to securely exchange symmetric cipher keys over untrusted channels.' },
    ],
  },
  {
    id: 'art-context-compression',
    title: 'Context-Aware Agentic Loops: Multi-Modal Context Compression Benchmarks',
    category: 'Artificial Intelligence',
    readTime: '4 min read',
    date: 'March 2026',
    lead: 'Long-running autonomous agents accumulate redundant token history. Dynamic semantic pruning reduces prompt costs by 70% while improving reasoning accuracy.',
    tldrBullets: [
      'Attention sinks and sliding context windows preserve critical system instructions without buffer overflow.',
      'Vectorized token importance scoring drops conversational filler and repeated system status messages.',
      'Benchmark results demonstrate a 24% reduction in decision hallucination on multi-step coding benchmarks.',
    ],
    fullParagraphs: [
      'Autonomous coding agents executing multi-turn tool loops inevitably encounter context saturation. As prompt windows expand beyond 64k tokens, inference costs scale quadratically and models exhibit "lost in the middle" retrieval degradation.',
      'Context compaction algorithms parse tool outputs, removing verbose intermediate traces once unit test verification succeeds. Key architecture state changes are synthesized into dense semantic summaries.',
      'By maintaining attention sink anchors at sequence start combined with localized sliding windows, the agent maintains continuous reasoning coherence over hours of automated execution without context eviction.',
    ],
    benchmarks: [
      { metric: 'Effective Prompt Cost', baseline: '$0.042/turn', optimized: '$0.011/turn', delta: '-73.8%' },
      { metric: 'Tool Call Accuracy', baseline: '81.4%', optimized: '93.2%', delta: '+14.5%' },
      { metric: 'Context Degradation Rate', baseline: '18.2%', optimized: '3.1%', delta: '-82.9%' },
    ],
    glossary: [
      { term: 'Attention Sink', definition: 'Initial tokens in a transformer sequence that absorb excessive attention weight, stabilizing long-context generation.' },
      { term: 'Context Compaction', definition: 'Algorithmic summarization of historical agent action-observation pairs into dense representations.' },
    ],
  },
  {
    id: 'art-zero-copy-rpc',
    title: 'Memory-Mapped Zero-Copy RPC Systems in Distributed Deep Learning Clusters',
    category: 'Hardware',
    readTime: '3 min read',
    date: 'February 2026',
    lead: 'Bypassing OS kernel network stacks with RDMA and unified virtual memory enables line-rate parameter synchronization across 10,000-node training fabrics.',
    tldrBullets: [
      'Kernel bypass protocols allow PCIe and NVLink devices to write directly to remote host DRAM.',
      'CPU context switching and buffer copying overheads drop to near zero during gradient all-reduce passes.',
      'Achieves 780 Gbps sustained bidirectional throughput on 800G InfiniBand quantum switches.',
    ],
    fullParagraphs: [
      'Distributed training of foundation models requires continuous all-to-all parameter exchange between accelerator nodes. Traditional socket-based RPC implementations incur substantial CPU overhead copying data between user space, kernel socket buffers, and network interfaces.',
      'Remote Direct Memory Access (RDMA) over Converged Ethernet (RoCEv2) establishes direct hardware memory conduits. Accelerator memory controllers transfer gradient tensors straight from GPU HBM to the network fabric.',
      'Eliminating CPU page-table interrupts unlocks near-linear cluster scaling efficiency, preventing communication phases from bottlenecking high-utilization tensor core execution pipelines.',
    ],
    benchmarks: [
      { metric: 'Kernel Copy CPU Overhead', baseline: '34.5%', optimized: '1.2%', delta: '-96.5%' },
      { metric: 'All-Reduce Sync Latency', baseline: '14.8 ms', optimized: '2.4 ms', delta: '-83.7%' },
      { metric: 'Effective Fabric Utilization', baseline: '62%', optimized: '94%', delta: '+51.6%' },
    ],
    glossary: [
      { term: 'RDMA', definition: 'Direct memory access from the memory of one computer into that of another without operating system involvement.' },
      { term: 'Kernel Bypass', definition: 'Direct user-space access to hardware network interfaces to circumvent kernel protocol stack latency.' },
    ],
  },
];

export default function NewsSandbox() {
  const {
    state: activeState,
    confidence,
    contentMode,
    layoutShell,
    typographyScale,
    navMode,
    theme: activeTheme,
    motionLevel,
    explainBanner,
    toggleXaiModal,
    simulateState,
  } = useAdaptationStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(ARTICLES[0].id);
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({ [ARTICLES[0].id]: true });
  const [showHud, setShowHud] = useState(true);
  const [hudCountdown, setHudCountdown] = useState(5);
  const [liveFeatures, setLiveFeatures] = useState(computeRollingFeatures());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const dwellStartRef = useRef<{ id: string; time: number } | null>(null);

  // 5-second countdown timer for ML evaluation flush
  useEffect(() => {
    const timer = setInterval(() => {
      setHudCountdown((prev) => {
        if (prev <= 1) {
          setLiveFeatures(computeRollingFeatures());
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Top reading progress bar listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100));
        setReadingProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut listener for Analyst Terminal mode ([j], [k], [/])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const filtered = selectedCategory === 'All'
        ? ARTICLES
        : ARTICLES.filter((a) => a.category === selectedCategory);

      const currentIndex = filtered.findIndex((a) => a.id === selectedArticleId);

      if (e.key === 'j' || e.key === 'J') {
        // Next article
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % filtered.length;
        setSelectedArticleId(filtered[nextIndex].id);
      } else if (e.key === 'k' || e.key === 'K') {
        // Previous article
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + filtered.length) % filtered.length;
        setSelectedArticleId(filtered[prevIndex].id);
      } else if (e.key === '/') {
        // Cycle categories
        e.preventDefault();
        const categories = ['All', 'Artificial Intelligence', 'Hardware', 'Web Architecture', 'Security'];
        const catIndex = categories.indexOf(selectedCategory);
        const nextCat = categories[(catIndex + 1) % categories.length];
        setSelectedCategory(nextCat);
        trackViewSwitch(`category_${nextCat}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArticleId, selectedCategory]);

  // Article dwell time tracker
  const handleMouseEnterArticle = (id: string) => {
    dwellStartRef.current = { id, time: Date.now() };
  };

  const handleMouseLeaveArticle = (id: string) => {
    if (dwellStartRef.current && dwellStartRef.current.id === id) {
      const dwellMs = Date.now() - dwellStartRef.current.time;
      trackDwell(id, dwellMs);
      dwellStartRef.current = null;
    }
  };

  const toggleExpandArticle = (id: string) => {
    setExpandedArticles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Text-To-Speech for Assistive Mode
  const handleToggleSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Filtered articles
  const filteredArticles = selectedCategory === 'All'
    ? ARTICLES
    : ARTICLES.filter((a) => a.category === selectedCategory);

  const activeArticle = ARTICLES.find((a) => a.id === selectedArticleId) || ARTICLES[0];

  // Visual Styling Classes derived from 7 tokens
  const themeClasses: Record<string, string> = {
    dark: 'bg-[#090D16] text-zinc-100 border-zinc-800',
    light: 'bg-[#F8FAFC] text-zinc-900 border-zinc-200',
    sepia: 'bg-[#FBF8F1] dark:bg-[#1E1C18] text-[#332F28] dark:text-[#E8E2D5] border-[#EADFCB] dark:border-[#38332A]',
    high_contrast: 'bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white font-semibold',
  };

  const typographyClasses: Record<string, string> = {
    compact_13: 'text-[13.5px] leading-relaxed',
    standard_15: 'text-[15px] leading-normal',
    editorial_19: 'text-[18.5px] leading-[1.85] font-serif',
    accessible_20: 'text-[20px] leading-[1.9] tracking-wide font-sans font-medium',
  };

  const motionClasses: Record<string, string> = {
    snappy_150: 'transition-all duration-150 ease-out',
    smooth_350: 'transition-all duration-350 ease-in-out',
    gentle_fade: 'transition-opacity duration-500 ease-in-out',
    reduced: 'transition-none transform-none',
  };

  return (
    <div className={`w-full rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border ${themeClasses[activeTheme] || themeClasses.light} ${motionClasses[motionLevel] || motionClasses.smooth_350} relative overflow-hidden`}>
      {/* ════════════════════ TOP READING PROGRESS BAR (FOCUS READER) ════════════════════ */}
      {layoutShell === 'centered_editorial' && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-amber-200/40">
          <div
            className="h-full bg-amber-600 transition-all duration-150"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* ════════════════════ ADAPTATION EXPLAIN BANNER ════════════════════ */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {activeState ? activeState.replace('_', ' ') : 'Balanced'} Mode
          </span>
          <span className="hidden sm:inline-block text-zinc-400">|</span>
          <span className="text-zinc-600 dark:text-zinc-300 font-medium">
            {explainBanner}
          </span>
        </div>

        <button
          onClick={() => toggleXaiModal(true)}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Explain Adaptation
        </button>
      </div>

      {/* ════════════════════ STICKY CATEGORY FILTER PILLS ════════════════════ */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-zinc-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['All', 'Artificial Intelligence', 'Hardware', 'Web Architecture', 'Security'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                trackViewSwitch(`cat_${cat}`);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hotkey Indicator in Analyst Terminal Mode */}
        {navMode === 'command_hotkeys' && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-800">
            <span>Terminal Hotkeys:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-blue-400 font-bold">[J]</kbd> Next
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-blue-400 font-bold">[K]</kbd> Prev
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-blue-400 font-bold">[/]</kbd> Filter
          </div>
        )}

        {/* Read-Aloud Button in Assistive Mode */}
        {navMode === 'large_speech_toggle' && (
          <button
            onClick={() => handleToggleSpeech(activeArticle.title + '. ' + activeArticle.lead)}
            className={`min-h-[48px] px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${
              isSpeaking
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            {isSpeaking ? 'Stop Reading Aloud' : '🔊 Read Article Aloud'}
          </button>
        )}
      </div>

      {/* ════════════════════ ADAPTIVE LAYOUT VARIATIONS ════════════════════ */}

      {/* ── VARIANT 1: ANALYST TERMINAL (SPLIT 3-COLUMN) ── */}
      {layoutShell === 'split_terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Col 1: Feed List (3 cols) */}
          <div className="lg:col-span-4 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            <div className="text-[11px] font-mono font-bold uppercase text-blue-400 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Stream Queue ({filteredArticles.length})
            </div>
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArticleId(art.id)}
                onMouseEnter={() => handleMouseEnterArticle(art.id)}
                onMouseLeave={() => handleMouseLeaveArticle(art.id)}
                className={`p-3 rounded-xl border font-mono cursor-pointer transition-all ${
                  selectedArticleId === art.id
                    ? 'bg-blue-950/40 border-blue-500/80 shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                  <span>{art.category}</span>
                  <span>{art.readTime}</span>
                </div>
                <h5 className="text-xs font-bold text-zinc-100 line-clamp-2">
                  {art.title}
                </h5>
              </div>
            ))}
          </div>

          {/* Col 2: Active Reader (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                {activeArticle.category}
              </span>
              <span>{activeArticle.date} &bull; {activeArticle.readTime}</span>
            </div>

            <h3 className="text-lg font-black text-white">
              {activeArticle.title}
            </h3>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans border-l-2 border-blue-500 pl-3">
              {activeArticle.lead}
            </p>

            <div className="space-y-3 font-sans text-xs text-zinc-300 leading-relaxed">
              {activeArticle.fullParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Col 3: Live Benchmarks & Telemetry (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" /> Hardware Benchmarks
              </div>

              <div className="space-y-2 font-mono text-xs">
                {activeArticle.benchmarks.map((b, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <div className="text-[10px] text-zinc-400">{b.metric}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-zinc-500">{b.baseline}</span>
                      <span className="text-white font-bold">{b.optimized}</span>
                      <span className="text-emerald-400 font-bold">{b.delta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-2">
                Glossary Terms
              </div>
              <div className="space-y-2 text-xs">
                {activeArticle.glossary.map((g, idx) => (
                  <div key={idx} className="text-zinc-400">
                    <strong className="text-zinc-200">{g.term}:</strong> {g.definition}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VARIANT 2: SKIMMER FEED (3-COLUMN MASONRY WITH AUTO-COLLAPSED TL;DR) ── */}
      {layoutShell === 'masonry_grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((art) => {
            const isExpanded = expandedArticles[art.id];
            return (
              <div
                key={art.id}
                onMouseEnter={() => handleMouseEnterArticle(art.id)}
                onMouseLeave={() => handleMouseLeaveArticle(art.id)}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-500 mb-2.5">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      {art.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {art.readTime}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mb-2 leading-snug">
                    {art.title}
                  </h4>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                    <strong className="text-zinc-900 dark:text-zinc-100">{art.lead.split('.')[0]}.</strong>
                  </p>

                  {/* 3-Bullet AI TL;DR Card */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 mb-3 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AI 3-Bullet Key Findings
                    </div>
                    {art.tldrBullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                      {art.fullParagraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleExpandArticle(art.id)}
                  className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between w-full hover:underline"
                >
                  <span>{isExpanded ? 'Collapse Full Article' : 'Read Full Research & Benchmarks'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VARIANT 3: FOCUS READER (CENTERED 68ch EDITORIAL) ── */}
      {layoutShell === 'centered_editorial' && (
        <div className="max-w-[68ch] mx-auto py-6 space-y-8 font-serif">
          {/* Article Selector Navigation */}
          <div className="flex items-center justify-between pb-4 border-b border-[#EADFCB] dark:border-[#38332A] text-xs font-sans">
            <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">
              Focus Reader &bull; Distraction-Free
            </span>
            <div className="flex items-center gap-2">
              {filteredArticles.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedArticleId(a.id)}
                  className={`w-7 h-7 rounded-full font-bold text-xs transition-colors ${
                    selectedArticleId === a.id
                      ? 'bg-amber-800 text-white dark:bg-amber-600'
                      : 'bg-amber-100 dark:bg-zinc-800 text-amber-900 dark:text-zinc-300'
                  }`}
                  title={a.title}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <header className="space-y-3">
            <div className="text-xs font-sans uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
              {activeArticle.category} &bull; {activeArticle.readTime}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              {activeArticle.title}
            </h1>
            <p className="text-lg font-sans text-amber-900/80 dark:text-amber-200/80 leading-relaxed pt-2 border-l-4 border-amber-600 pl-4">
              {activeArticle.lead}
            </p>
          </header>

          <article className="space-y-6 text-[18.5px] leading-[1.85]">
            {activeArticle.fullParagraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </article>

          {/* Unfolded Takeaways */}
          <div className="p-6 rounded-3xl bg-[#F4EFE6] dark:bg-[#25221C] border border-[#E0D4BE] dark:border-[#423C30] space-y-3 font-sans text-sm">
            <h5 className="font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider text-xs flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Editorial Key Takeaways
            </h5>
            {activeArticle.tldrBullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2 text-zinc-800 dark:text-zinc-200">
                <span className="text-amber-700 font-bold">&bull;</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VARIANT 4: COGNITIVE ASSIST (HIGH CLEARANCE, 48PX BUTTONS, GLOSSARY TOOLTIPS) ── */}
      {layoutShell === 'accessible_single' && (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="p-5 rounded-3xl bg-amber-500/10 border-4 border-amber-500 text-amber-900 dark:text-amber-200 text-sm font-bold flex items-center gap-3">
            <HelpCircle className="w-7 h-7 text-amber-600 shrink-0" />
            <span>
              Cognitive Assist Active: Simplified paragraphs, 2px borders, large hit targets, and audio reader enabled.
            </span>
          </div>

          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="p-6 sm:p-8 rounded-3xl border-4 border-black dark:border-white space-y-5 bg-white dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-black">
                  {art.category}
                </span>
                <span>{art.readTime}</span>
              </div>

              <h3 className="text-2xl font-black leading-snug">
                {art.title}
              </h3>

              <div className="space-y-4 text-lg font-medium leading-relaxed">
                {art.fullParagraphs.map((para, i) => (
                  <p key={i} className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700">
                    {para}
                  </p>
                ))}
              </div>

              {/* Step-by-Step Glossary */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-400 space-y-2">
                <h5 className="font-bold text-blue-900 dark:text-blue-300 text-sm">
                  📚 Key Term Definitions:
                </h5>
                {art.glossary.map((g, idx) => (
                  <div key={idx} className="text-sm">
                    <strong>{g.term}:</strong> {g.definition}
                  </div>
                ))}
              </div>

              {/* Large 48px Speech Button */}
              <button
                onClick={() => handleToggleSpeech(art.title + '. ' + art.lead)}
                className="w-full min-h-[48px] py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base flex items-center justify-center gap-3 shadow-md"
              >
                <Volume2 className="w-5 h-5" />
                Listen to This Article
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── VARIANT 5: BALANCED STANDARD GRID (DEFAULT) ── */}
      {layoutShell === 'standard_grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              onMouseEnter={() => handleMouseEnterArticle(art.id)}
              onMouseLeave={() => handleMouseLeaveArticle(art.id)}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {art.category}
                  </span>
                  <span>{art.readTime}</span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                  {art.title}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                  {art.lead}
                </p>
              </div>

              <button
                onClick={() => setSelectedArticleId(art.id)}
                className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-bold text-blue-600 hover:underline flex items-center justify-between"
              >
                <span>Read Full Article</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════ COLLAPSIBLE LIVE TELEMETRY & ML BRAIN HUD ════════════════════ */}
      <div className="mt-8 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Live Telemetry & ML Brain HUD
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              Next ML Flush in {hudCountdown}s
            </span>
          </div>

          <button
            onClick={() => setShowHud(!showHud)}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1"
          >
            {showHud ? 'Collapse HUD' : 'Expand HUD'}
            {showHud ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showHud && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Click Rate</div>
                <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {liveFeatures.clicks_per_min} <span className="text-[10px] font-normal text-zinc-400">/min</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Scroll Speed</div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {Math.round(liveFeatures.scroll_speed * 1000)} <span className="text-[10px] font-normal text-zinc-400">px/s</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Text Selections</div>
                <div className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  {liveFeatures.text_selections_count || 0} <span className="text-[10px] font-normal text-zinc-400">events</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Rage Clicks</div>
                <div className="text-base font-black text-red-500 mt-0.5">
                  {liveFeatures.rage_click_count || 0} <span className="text-[10px] font-normal text-zinc-400">bursts</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Mean Dwell Time</div>
                <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {liveFeatures.mean_dwell_seconds || 0} <span className="text-[10px] font-normal text-zinc-400">s</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">View Switches</div>
                <div className="text-base font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
                  {liveFeatures.view_switches_per_min} <span className="text-[10px] font-normal text-zinc-400">/min</span>
                </div>
              </div>
            </div>

            {/* Simulation Shortcuts Bar */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-zinc-600 dark:text-zinc-400">
                ⚡ Instant Behavioral State Simulation (For Evaluator Testing):
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => simulateState('fast_scanner')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs"
                >
                  Skimmer Feed (Fast Scanner)
                </button>
                <button
                  onClick={() => simulateState('deep_reader')}
                  className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold transition-all shadow-xs"
                >
                  Focus Reader (Deep Reader)
                </button>
                <button
                  onClick={() => simulateState('power_user')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs"
                >
                  Analyst Terminal (Power User)
                </button>
                <button
                  onClick={() => simulateState('assistive_mode')}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-xs"
                >
                  Cognitive Assist (Assistive Mode)
                </button>
                <button
                  onClick={() => simulateState('balanced')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-600 hover:bg-zinc-500 text-white font-bold transition-all shadow-xs"
                >
                  Reset Balanced
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
