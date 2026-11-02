'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Zap,
  HelpCircle,
  Search,
  Volume2,
  VolumeX,
  Clock,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Table,
  CheckCircle,
  Activity,
  Terminal,
  Filter,
  Eye,
  Sliders,
  Lock,
  Unlock,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';
import { useAdaptationStore } from '../store/adaptationStore';
import { useTelemetryStore, TelemetryFeatures } from '../store/telemetryStore';
import { trackDwell, trackViewSwitch, computeRollingFeatures } from '../lib/telemetry';
import TiltCard from './TiltCard';
import NeuralLattice3D from './NeuralLattice3D';

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
    title: 'Sparse Mixture-of-Experts (MoE) at Scale: Latency & KV Cache Bottlenecks',
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

const INITIAL_FEATURES: TelemetryFeatures = {
  clicks_per_min: 0,
  unique_click_ratio: 1,
  repeat_click_ratio: 0,
  scroll_speed: 0,
  max_scroll_depth: 0,
  key_presses_per_min: 0,
  idle_ratio: 1,
  view_switches_per_min: 0,
  text_selections_count: 0,
  rage_click_count: 0,
  mean_dwell_seconds: 0,
};

export default function NewsSandbox() {
  const [mounted, setMounted] = useState(false);
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
    unlockAutoMode,
    userOverrides,
  } = useAdaptationStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(ARTICLES[0].id);
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({ [ARTICLES[0].id]: true });
  const [showHud, setShowHud] = useState(true);
  const [hudCountdown, setHudCountdown] = useState(5);
  const [liveFeatures, setLiveFeatures] = useState<TelemetryFeatures>(INITIAL_FEATURES);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const dwellStartRef = useRef<{ id: string; time: number } | null>(null);
  const isSimulationLocked = 'state' in userOverrides;

  // Mount effect & client feature initialization
  useEffect(() => {
    setMounted(true);
    setLiveFeatures(computeRollingFeatures());
  }, []);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

  // Top reading progress bar listener with requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (scrollHeight > 0) {
            setReadingProgress(Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut listener for Analyst Terminal mode ([j], [k], [/])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const filtered = selectedCategory === 'All'
        ? ARTICLES
        : ARTICLES.filter((a) => a.category === selectedCategory);

      const currentIndex = filtered.findIndex((a) => a.id === selectedArticleId);

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % filtered.length;
        setSelectedArticleId(filtered[nextIndex].id);
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + filtered.length) % filtered.length;
        setSelectedArticleId(filtered[prevIndex].id);
      } else if (e.key === '/') {
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

  const filteredArticles = selectedCategory === 'All'
    ? ARTICLES
    : ARTICLES.filter((a) => a.category === selectedCategory);

  const activeArticle = ARTICLES.find((a) => a.id === selectedArticleId) || ARTICLES[0];

  // Visual Theme Containers derived directly from active theme mode
  const themeContainerStyles: Record<string, string> = {
    dark: 'bg-[#040711] text-emerald-400 border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.12)]',
    light: 'bg-[#FFFFFF] text-zinc-900 border border-zinc-200/90 shadow-2xl',
    sepia: 'bg-[#FDF9F0] dark:bg-[#1A1612] text-[#2C241C] dark:text-[#EAE0D2] border-2 border-[#E3D3BE] dark:border-[#382F24] shadow-2xl',
    high_contrast: 'bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white shadow-[0_0_0_4px_rgba(0,0,0,0.2)]',
  };

  const motionClasses: Record<string, string> = {
    snappy_150: 'transition-all duration-150 ease-out',
    smooth_350: 'transition-all duration-350 ease-in-out',
    gentle_fade: 'transition-opacity duration-500 ease-in-out',
    reduced: 'transition-none transform-none',
  };

  return (
    <div suppressHydrationWarning className={`w-full rounded-3xl p-5 sm:p-7 lg:p-9 border ${themeContainerStyles[activeTheme] || themeContainerStyles.light} ${motionClasses[motionLevel] || motionClasses.smooth_350} relative overflow-hidden`}>
      {/* Pinned Top Reading Progress Bar for Focus Reader */}
      {layoutShell === 'centered_editorial' && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-[#E4D5C2]/40">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-150 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* ════════════════════ HIGH-VISIBILITY PERSONA CONTROLLER BAR ════════════════════ */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-zinc-900/95 dark:bg-zinc-950/95 border border-zinc-700/80 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulationLocked ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSimulationLocked ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </span>
              <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                Interactive Persona Morphing Sandbox
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Switch between 5 distinct visual & cognitive states below. Every element re-renders in real time.
            </p>
          </div>

          {/* Mode Lock / Auto ML Status Badge & Toggle */}
          <div className="flex items-center gap-3">
            {isSimulationLocked ? (
              <div className="flex items-center gap-2">
                <span suppressHydrationWarning className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Simulation Locked ({activeState.replace('_', ' ')})</span>
                </span>
                <button
                  onClick={unlockAutoMode}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-98"
                  title="Unlock to observe real user scrolling, clicks, and dwell time"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Switch to Live Auto ML</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span suppressHydrationWarning className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>Auto ML Active (Flush: {hudCountdown}s)</span>
                </span>
                <button
                  onClick={() => simulateState('power_user')}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold flex items-center gap-1 transition-all"
                  title="Lock to manual simulation mode"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock Persona</span>
                </button>
              </div>
            )}

            <button
              onClick={() => toggleXaiModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>XAI Audit</span>
            </button>
          </div>
        </div>

        {/* 5 Distinct Persona Simulation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={() => simulateState('power_user')}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeState === 'power_user' || activeState === 'fast_navigator'
                ? 'bg-emerald-950/70 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/60'
                : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" /> Analyst Terminal
              </span>
              <kbd className="text-[9px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-300">[J/K]</kbd>
            </div>
            <div className="text-[11px] text-zinc-300 font-sans leading-tight">
              3-Col Split &bull; Dark Matrix &bull; Live Benchmarks
            </div>
          </button>

          <button
            onClick={() => simulateState('fast_scanner')}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeState === 'fast_scanner' || activeState === 'explorer'
                ? 'bg-sky-950/70 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.35)] ring-2 ring-sky-500/60'
                : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Skimmer Feed
              </span>
              <span className="text-[9px] font-mono bg-sky-900/50 text-sky-300 px-1.5 py-0.5 rounded">TL;DR</span>
            </div>
            <div className="text-[11px] text-zinc-300 font-sans leading-tight">
              3-Col Masonry &bull; AI Digest &bull; Stopwatch Badges
            </div>
          </button>

          <button
            onClick={() => simulateState('deep_reader')}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeState === 'deep_reader' || activeState === 'reader'
                ? 'bg-amber-950/70 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-2 ring-amber-500/60'
                : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Focus Reader
              </span>
              <span className="text-[9px] font-mono bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded">Sepia</span>
            </div>
            <div className="text-[11px] text-zinc-300 font-sans leading-tight">
              Warm Paper &bull; 68ch Editorial &bull; Scroll Progress
            </div>
          </button>

          <button
            onClick={() => simulateState('assistive_mode')}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeState === 'assistive_mode' || activeState === 'struggling'
                ? 'bg-rose-950/70 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)] ring-2 ring-rose-500/60'
                : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Cognitive Assist
              </span>
              <span className="text-[9px] font-mono bg-rose-900/50 text-rose-300 px-1.5 py-0.5 rounded">AAA</span>
            </div>
            <div className="text-[11px] text-zinc-300 font-sans leading-tight">
              3px Borders &bull; 48px Buttons &bull; Speech Audio
            </div>
          </button>

          <button
            onClick={() => simulateState('balanced')}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeState === 'balanced'
                ? 'bg-zinc-800 border-zinc-400 text-white shadow-md ring-2 ring-zinc-400/40'
                : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" /> Balanced Baseline
              </span>
              <span className="text-[9px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Default</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-sans leading-tight">
              Standard Grid &bull; 1.0x Scale &bull; Minimal Baseline
            </div>
          </button>
        </div>
      </div>

      {/* ════════════════════ BESPOKE ADAPTATION EXPLAIN BANNER ════════════════════ */}
      <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl text-xs ${
        activeTheme === 'dark'
          ? 'bg-zinc-900/80 border border-emerald-500/30 text-emerald-300'
          : activeTheme === 'sepia'
          ? 'bg-[#F4ECE1] dark:bg-[#25201A] border border-[#DECFBD] dark:border-[#3D3325] text-[#3A3025] dark:text-[#EAE0D2]'
          : activeTheme === 'high_contrast'
          ? 'bg-zinc-100 dark:bg-zinc-900 border-2 border-black dark:border-white font-bold'
          : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
      }`}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span suppressHydrationWarning className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            {activeState ? activeState.replace('_', ' ') : 'Balanced'}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span suppressHydrationWarning className="font-sans font-medium">
            {explainBanner}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span suppressHydrationWarning className="font-mono text-[10px] text-zinc-400">Confidence: {Math.round((confidence || 0.85) * 100)}%</span>
          <button
            onClick={() => toggleXaiModal(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Sparkles className="w-3 h-3 text-emerald-400 dark:text-emerald-600" />
            <span>Why it changed</span>
          </button>
        </div>
      </div>

      {/* ════════════════════ MINIMALIST FILTER BAR ════════════════════ */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-mono font-bold tracking-[0.18em] text-zinc-400 mr-2">
            Domain:
          </span>
          {['All', 'Artificial Intelligence', 'Hardware', 'Web Architecture', 'Security'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                trackViewSwitch(`cat_${cat}`);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {navMode === 'command_hotkeys' && (
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-xl border border-emerald-500/40">
            <span className="text-emerald-500 uppercase tracking-widest font-bold">Terminal Hotkeys</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-bold">[J]</kbd> Next
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-bold">[K]</kbd> Prev
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-bold">[/]</kbd> Domain
          </div>
        )}

        {navMode === 'large_speech_toggle' && (
          <button
            onClick={() => handleToggleSpeech(activeArticle.title + '. ' + activeArticle.lead)}
            className={`min-h-[48px] px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-lg ${
              isSpeaking
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-black'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            {isSpeaking ? 'Halt Audio Synthesis' : 'Read Article Aloud (TTS)'}
          </button>
        )}
      </div>

      {/* ════════════════════ ADAPTIVE LAYOUT MODES ════════════════════ */}

      {/* ── VARIANT 1: ANALYST TERMINAL (3-COLUMN SPLIT) ── */}
      {layoutShell === 'split_terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono">
          {/* Feed List */}
          <div className="lg:col-span-4 space-y-2 max-h-[700px] overflow-y-auto pr-1">
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Telemetry Feed ({filteredArticles.length})
            </div>
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArticleId(art.id)}
                onMouseEnter={() => handleMouseEnterArticle(art.id)}
                onMouseLeave={() => handleMouseLeaveArticle(art.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedArticleId === art.id
                    ? 'bg-emerald-950/40 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                  <span className="text-emerald-400">{art.category}</span>
                  <span>{art.readTime}</span>
                </div>
                <h5 className="text-xs font-bold text-zinc-200 line-clamp-2">
                  {art.title}
                </h5>
              </div>
            ))}
          </div>

          {/* Reader */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-zinc-950/80 border border-emerald-500/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[10px] uppercase tracking-wider">
                {activeArticle.category}
              </span>
              <span className="text-[11px] text-zinc-500">{activeArticle.date} &bull; {activeArticle.readTime}</span>
            </div>

            <div className="text-[11px] text-emerald-400 font-mono">
              user@context-terminal:~$ cat {activeArticle.id}.md
            </div>

            <h3 className="text-lg font-display font-bold text-white tracking-tight">
              {activeArticle.title}
            </h3>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans border-l-2 border-emerald-400 pl-3.5 bg-emerald-950/20 py-2 rounded-r-lg">
              {activeArticle.lead}
            </p>

            <div className="space-y-3 font-sans text-xs text-zinc-300 leading-relaxed">
              {activeArticle.fullParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Metrics & Benchmarks */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-4 rounded-3xl bg-zinc-950/90 border border-emerald-500/40 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-[0.2em] mb-3 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" /> Benchmarks
              </div>

              <div className="space-y-2 text-xs">
                {activeArticle.benchmarks.map((b, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">{b.metric}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-zinc-500 text-[11px]">{b.baseline}</span>
                      <span className="text-zinc-200 font-bold">{b.optimized}</span>
                      <span className="text-emerald-400 font-bold">{b.delta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-zinc-950/90 border border-zinc-800">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-[0.2em] mb-2">
                Nomenclature
              </div>
              <div className="space-y-2 text-xs">
                {activeArticle.glossary.map((g, idx) => (
                  <div key={idx} className="text-zinc-400 text-[11px] leading-relaxed">
                    <strong className="text-emerald-400">{g.term}:</strong> {g.definition}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VARIANT 2: SKIMMER FEED (3D TILT MASONRY GRID) ── */}
      {layoutShell === 'masonry_grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => {
            const isExpanded = expandedArticles[art.id];
            return (
              <TiltCard
                key={art.id}
                depth={8}
                onMouseEnter={() => handleMouseEnterArticle(art.id)}
                onMouseLeave={() => handleMouseLeaveArticle(art.id)}
                className="p-6 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      {art.category}
                    </span>
                    <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-500" /> {art.readTime}
                    </span>
                  </div>

                  <h4 className="text-base font-display font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-snug tracking-tight">
                    {art.title}
                  </h4>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 font-sans">
                    {art.lead}
                  </p>

                  {/* 3-Bullet AI TL;DR Card */}
                  <div className="p-4 rounded-2xl bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/30 mb-3 space-y-2.5">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-500" /> AI Core Digest (TL;DR)
                    </div>
                    {art.tldrBullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed">
                        <span className="text-sky-500 font-bold shrink-0">&rsaquo;</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                      {art.fullParagraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleExpandArticle(art.id)}
                  className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 text-xs font-mono font-bold text-sky-600 dark:text-sky-400 flex items-center justify-between w-full hover:underline"
                >
                  <span>{isExpanded ? 'Collapse' : 'Expand Full Paper'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </TiltCard>
            );
          })}
        </div>
      )}

      {/* ── VARIANT 3: FOCUS READER (MINIMALIST 68ch EDITORIAL SEPIA) ── */}
      {layoutShell === 'centered_editorial' && (
        <div className="max-w-[68ch] mx-auto py-6 space-y-8 font-sans">
          <div className="flex items-center justify-between pb-4 border-b border-[#E3D3BE] dark:border-[#382F24] text-xs font-mono">
            <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Editorial Reading Room
            </span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-[11px] mr-1">Jump:</span>
              {filteredArticles.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedArticleId(a.id)}
                  className={`w-7 h-7 rounded-full font-bold text-xs transition-all ${
                    selectedArticleId === a.id
                      ? 'bg-amber-600 text-white font-mono shadow-md scale-110'
                      : 'bg-[#ECE0D0] dark:bg-[#25201A] text-zinc-700 dark:text-zinc-300 hover:bg-amber-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <header className="space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold">
              {activeArticle.category} &bull; {activeArticle.readTime} &bull; {activeArticle.date}
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-snug">
              {activeArticle.title}
            </h1>
            <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed pt-2 border-l-4 border-amber-500 pl-4 italic">
              {activeArticle.lead}
            </p>
          </header>

          <article className="space-y-6 text-[19px] sm:text-[20px] leading-[1.9] text-zinc-800 dark:text-zinc-200 font-serif">
            {activeArticle.fullParagraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </article>

          <div className="p-6 rounded-3xl bg-[#F4ECE1] dark:bg-[#25201A] border border-[#DECFBD] dark:border-[#3D3325] space-y-3 font-sans text-sm shadow-sm">
            <h5 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Core Synthesis
            </h5>
            {activeArticle.tldrBullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed">
                <span className="text-amber-500 font-bold text-lg leading-none">&bull;</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VARIANT 4: ACCESSIBLE HIGH-CONTRAST (AAA) ── */}
      {layoutShell === 'accessible_single' && (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="p-5 rounded-2xl border-4 border-black dark:border-white bg-zinc-100 dark:bg-zinc-900 font-mono text-sm font-bold flex items-center gap-3 shadow-md">
            <HelpCircle className="w-6 h-6 text-rose-500 shrink-0" />
            <span>High-Contrast Accessibility Mode: Enlarged targets (48px+), 20px accessible font, text-to-speech audio synthesis.</span>
          </div>

          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="p-8 rounded-3xl border-4 border-black dark:border-white space-y-6 bg-white dark:bg-black shadow-2xl"
            >
              <div className="flex items-center justify-between text-base font-mono font-bold">
                <span className="px-4 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-sm">
                  {art.category}
                </span>
                <span className="text-zinc-800 dark:text-zinc-200">{art.readTime}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
                {art.title}
              </h3>

              <div className="space-y-4 text-xl font-sans leading-relaxed font-medium">
                {art.fullParagraphs.map((para, i) => (
                  <p key={i} className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-400 dark:border-zinc-600">
                    {para}
                  </p>
                ))}
              </div>

              <button
                onClick={() => handleToggleSpeech(art.title + '. ' + art.lead)}
                className="w-full min-h-[52px] py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-extrabold text-base flex items-center justify-center gap-3 shadow-lg active:scale-98 transition-all"
              >
                <Volume2 className="w-5 h-5" />
                <span>{isSpeaking ? 'Halt Audio Synthesis' : 'Read Aloud with Audio Synthesis'}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── VARIANT 5: BALANCED STANDARD (DEFAULT) ── */}
      {layoutShell === 'standard_grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <TiltCard
              key={art.id}
              depth={6}
              onMouseEnter={() => handleMouseEnterArticle(art.id)}
              onMouseLeave={() => handleMouseLeaveArticle(art.id)}
              className="p-6 flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] uppercase font-bold tracking-wider text-zinc-600 dark:text-zinc-300">
                    {art.category}
                  </span>
                  <span className="text-[11px]">{art.readTime}</span>
                </div>
                <h4 className="text-base font-display font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
                  {art.title}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 font-sans">
                  {art.lead}
                </p>
              </div>

              <button
                onClick={() => setSelectedArticleId(art.id)}
                className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-between"
              >
                <span>Read Full Article</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </TiltCard>
          ))}
        </div>
      )}

      {/* ════════════════════ 3D NEURAL BRAIN & LIVE TELEMETRY HUD ════════════════════ */}
      <div className="mt-10 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h4 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
              Live Behavioral Micro-Telemetry & ML Weights
            </h4>
            <span suppressHydrationWarning className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
              {isSimulationLocked ? 'Simulation Mode' : `Next Flush: ${hudCountdown}s`}
            </span>
          </div>

          <button
            onClick={() => setShowHud(!showHud)}
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
          >
            {showHud ? 'Minimize HUD' : 'Expand HUD'}
            {showHud ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showHud && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center animate-in fade-in duration-300">
            {/* 3D Neural Lattice Sphere Visualization */}
            <div className="lg:col-span-4 h-48 rounded-3xl bg-zinc-900/60 border border-zinc-800 relative flex items-center justify-center p-2 shadow-inner">
              <NeuralLattice3D className="w-full h-full" />
              <div className="absolute bottom-2 left-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest pointer-events-none">
                3D Behavioral Lattice
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="lg:col-span-8 space-y-3 font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Tempo</div>
                  <div suppressHydrationWarning className="text-sm font-bold text-zinc-100 mt-0.5">
                    {mounted ? liveFeatures.clicks_per_min : 0} <span className="text-[9px] text-zinc-500">c/m</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Velocity</div>
                  <div suppressHydrationWarning className="text-sm font-bold text-emerald-400 mt-0.5">
                    {mounted ? Math.round(liveFeatures.scroll_speed * 1000) : 0} <span className="text-[9px] text-zinc-500">px/s</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Selections</div>
                  <div suppressHydrationWarning className="text-sm font-bold text-zinc-100 mt-0.5">
                    {mounted ? (liveFeatures.text_selections_count || 0) : 0}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Friction</div>
                  <div suppressHydrationWarning className="text-sm font-bold text-rose-400 mt-0.5">
                    {mounted ? (liveFeatures.rage_click_count || 0) : 0}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Dwell</div>
                  <div suppressHydrationWarning className="text-sm font-bold text-amber-400 mt-0.5">
                    {mounted ? (liveFeatures.mean_dwell_seconds || 0) : 0} <span className="text-[9px] text-zinc-500">s</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Switches</div>
                  <div suppressHydrationWarning className="text-sm font-bold text-zinc-100 mt-0.5">
                    {mounted ? liveFeatures.view_switches_per_min : 0}
                  </div>
                </div>
              </div>

              {/* Status and Diagnostics */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                  ML State: <strong suppressHydrationWarning className="text-white">{activeState}</strong>
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Layout Shell: <code suppressHydrationWarning className="text-emerald-400">{layoutShell}</code>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Theme: <code suppressHydrationWarning className="text-amber-400">{activeTheme}</code>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
