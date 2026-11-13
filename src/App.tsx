/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import { Play, Pause, ChevronRight, Menu, X, Check, ArrowUp } from 'lucide-react';
import Globe from './components/Globe.tsx';

/**
 * Willow MUN - Apple-Style Redesign
 * 
 * Design Standards:
 * - Full-screen background video filling 100vw x 100dvh without any parent clipping
 * - Fonts: SF Pro Display / -apple-system / Inter fallback
 * - Bold, tightly tracked, sentence-case headlines (Apple feel)
 * - Bento grid layout: rounded 28px cards (rgba(29,33,16,0.86), no border, no shadow) with 16px gaps
 * - Single-page sections in exact specified order
 * - Lightweight 2D canvas D3-geo interactive dotted globe (drag with inertia, pan-y touch)
 * - Apple-style scroll reveal: each section fades in and rises 24px once via IntersectionObserver
 * - 40px round icon-only Pause button in bottom-right corner
 */

// Reusable scroll reveal section component
function RevealSection({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`apple-reveal ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </section>
  );
}

// 12 Departments data
const DEPARTMENTS = [
  { name: 'Human Resources', role: 'Head of Department', staff: 'Staff Officer' },
  { name: 'Security', role: 'Head of Security', staff: 'Safety Coordinator' },
  { name: 'Media & Press', role: 'Editor-in-Chief', staff: 'Press Attaché' },
  { name: 'Volunteers', role: 'Director of Volunteers', staff: 'Logistics Liaison' },
  { name: 'DCC', role: 'Crisis Director', staff: 'Crisis Coordinator' },
  { name: 'Marketing', role: 'Head of Marketing', staff: 'Communications Lead' },
  { name: 'Design', role: 'Creative Director', staff: 'Visual Designer' },
  { name: 'Public Relations', role: 'Head of PR', staff: 'Outreach Delegate' },
  { name: 'Logistics', role: 'Head of Logistics', staff: 'Facilities Manager' },
  { name: 'Information Technology', role: 'Chief Technology Officer', staff: 'Systems Lead' },
  { name: 'Finance', role: 'Treasurer', staff: 'Finance Officer' },
  { name: 'Ceremony', role: 'Master of Ceremonies', staff: 'Protocol Lead' },
];

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [userHasPaused, setUserHasPaused] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Suggestions form state
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'Suggestion',
    message: '',
  });

  const nameInputId = useId();
  const emailInputId = useId();
  const typeSelectId = useId();
  const messageInputId = useId();

  // 1. Video Autoplay & prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsPlaying(false);
      setUserHasPaused(true);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    } else {
      const playPromise = videoRef.current?.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }

    const handleFirstInteraction = () => {
      if (!userHasPaused && videoRef.current && videoRef.current.paused) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    };

    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('scroll', handleFirstInteraction, { passive: true });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      } else if (!userHasPaused && videoRef.current) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userHasPaused]);

  // Video pause/play toggle
  const togglePlayState = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setUserHasPaused(true);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setUserHasPaused(false);
        })
        .catch(() => {});
    }
  }, [isPlaying]);

  const handleSubmitSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) return;
    setFormSubmitted(true);
  };

  const handleResetForm = () => {
    setFormData({ name: '', email: '', type: 'Suggestion', message: '' });
    setFormSubmitted(false);
  };

  return (
    <>
      {/* =========================================================================
          BACKGROUND VIDEO
          Strictly fills 100vw x 100dvh on all screen sizes with no clipping or gaps.
          No parent transform, no overflow: hidden, html/body are background transparent.
         ========================================================================= */}
      <video
        ref={videoRef}
        src="/assets/aistudio/Trees_swaying_and_birds_flying_afb28949_d2f42073.mp4"
        poster="/video-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* Flat static semi-transparent scrim so text is readable & video logo stays clear */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          backgroundColor: 'rgba(29, 33, 16, 0.28)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* =========================================================================
          SLIM 48px APPLE-STYLE TOP NAVIGATION BAR
          Logo and 'Willow' on left, small centered links, small pill 'Apply' button.
          Flat rgba(29,33,16,0.82), no blur.
         ========================================================================= */}
      <nav
        aria-label="Main Navigation"
        className="fixed top-0 left-0 right-0 z-40 h-12 bg-[rgba(29,33,16,0.85)] border-b border-[#ede6ca]/10 transition-colors"
      >
        <div className="max-w-[1040px] mx-auto h-full px-5 flex items-center justify-between">
          {/* Left: Logo + Willow */}
          <a
            href="#"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#ede6ca] hover:text-white transition-colors"
          >
            <img src="/logo-transparent.png" alt="Willow" className="w-5 h-5 object-contain" />
            <span>Willow</span>
          </a>

          {/* Centered Desktop Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-normal text-[#b9b296]">
            <a href="#overview" className="hover:text-[#ede6ca] transition-colors">
              Overview
            </a>
            <a href="#globe" className="hover:text-[#ede6ca] transition-colors">
              Global Stage
            </a>
            <a href="#committees" className="hover:text-[#ede6ca] transition-colors">
              Committees
            </a>
            <a href="#team" className="hover:text-[#ede6ca] transition-colors">
              Team
            </a>
            <a href="#updates" className="hover:text-[#ede6ca] transition-colors">
              Updates
            </a>
            <a href="#contact" className="hover:text-[#ede6ca] transition-colors">
              Contact
            </a>
          </div>

          {/* Right Action & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <a
              href="#apply"
              className="rounded-full bg-[#ede6ca] text-[#1d2110] px-3.5 py-1 text-xs font-semibold hover:bg-[#b9b296] transition-colors"
            >
              Apply
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden text-[#ede6ca] p-1 rounded hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Full-Screen Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#1d2110] p-6 flex flex-col justify-between md:hidden">
          <div className="flex items-center justify-between border-b border-[#ede6ca]/10 pb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#ede6ca]">
              <img src="/logo-transparent.png" alt="Willow" className="w-6 h-6 object-contain" />
              <span>Willow MUN</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="p-1 text-[#ede6ca]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-6 text-2xl font-semibold tracking-tight text-[#ede6ca]">
            <a href="#overview" onClick={() => setMobileMenuOpen(false)}>
              Overview
            </a>
            <a href="#globe" onClick={() => setMobileMenuOpen(false)}>
              Global Stage
            </a>
            <a href="#committees" onClick={() => setMobileMenuOpen(false)}>
              Committees
            </a>
            <a href="#team" onClick={() => setMobileMenuOpen(false)}>
              Team
            </a>
            <a href="#updates" onClick={() => setMobileMenuOpen(false)}>
              Updates
            </a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </a>
            <a href="#suggestions" onClick={() => setMobileMenuOpen(false)}>
              Suggestions
            </a>
          </div>

          <div className="border-t border-[#ede6ca]/10 pt-4">
            <a
              href="#apply"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 rounded-full bg-[#ede6ca] text-[#1d2110] font-semibold text-sm"
            >
              Apply to Willow MUN
            </a>
          </div>
        </div>
      )}

      {/* Main Content Container (relative, transparent, sits above video scrim) */}
      <main className="relative z-10 w-full">

        {/* =========================================================================
            HERO SECTION (Apple-Style, Full Screen, Centered)
            Center keeps video logo visible; typography is huge, bold, tightly tracked.
           ========================================================================= */}
        <section
          id="hero"
          className="min-h-screen w-full flex flex-col items-center justify-center text-center px-6 pt-16 pb-20 select-none"
        >
          <div className="max-w-4xl mx-auto flex flex-col items-center animate-hero-fade">
            {/* Small label */}
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#b9b296] mb-4">
              Model United Nations
            </span>

            {/* Gigantic Apple-Style Headline */}
            <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[132px] font-bold tracking-[-0.035em] text-[#ede6ca] leading-[1.02]">
              Willow.
            </h1>

            {/* Confident one-line subheading */}
            <p className="text-lg sm:text-2xl text-[#b9b296] font-normal tracking-tight mt-4 sm:mt-5 max-w-xl">
              Dates TBA · Venue TBA
            </p>

            {/* Two pill buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 sm:mt-10">
              <a
                href="#apply"
                className="rounded-full bg-[#ede6ca] text-[#1d2110] px-7 py-2.5 text-sm font-semibold hover:bg-[#b9b296] transition-colors"
              >
                Apply
              </a>
              <a
                href="#overview"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#ede6ca] hover:text-[#b9b296] transition-colors py-2.5 px-3"
              >
                <span>Learn more</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            1. OVERVIEW SECTION (Apple Bento Layout)
           ========================================================================= */}
        <RevealSection id="overview" className="py-28 sm:py-36 px-5 sm:px-8">
          <div className="max-w-[1040px] mx-auto">
            {/* Centered headline & subheading */}
            <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#ede6ca] leading-[1.05]">
                A conference built for diplomacy.
              </h2>
              <p className="text-base sm:text-lg text-[#b9b296] font-normal mt-4">
                Empowering delegates to debate, negotiate, and shape global treaties.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Wide primary card */}
              <div className="md:col-span-2 rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 sm:p-12 flex flex-col justify-between min-h-[300px]">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                    Conference
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ede6ca] mt-3 max-w-lg">
                    Youth-led multilateralism.
                  </h3>
                  <p className="text-sm sm:text-base text-[#b9b296] mt-3 max-w-md leading-relaxed">
                    Bringing delegates together to debate, negotiate, and build meaningful international coalitions.
                  </p>
                </div>
                <div className="mt-8 flex items-end justify-between">
                  <span className="text-5xl sm:text-6xl font-bold tracking-tight text-[#ede6ca]/80">
                    2026
                  </span>
                  <span className="text-xs text-[#b9b296] uppercase tracking-wider">
                    Inaugural Session
                  </span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 sm:p-10 flex flex-col justify-between min-h-[300px]">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                    Theme & Narrative
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight text-[#ede6ca] mt-3">
                    Official theme.
                  </h3>
                  <p className="text-sm text-[#b9b296] mt-3 leading-relaxed">
                    Conference theme and mission statement are forthcoming.
                  </p>
                </div>
                <div className="mt-8">
                  <span className="text-4xl sm:text-5xl font-bold text-[#b9b296]">
                    TBA
                  </span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 sm:p-10 flex flex-col justify-between min-h-[260px]">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                    Academic Rigor
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight text-[#ede6ca] mt-3">
                    Substantive debate.
                  </h3>
                  <p className="text-sm text-[#b9b296] mt-3 leading-relaxed">
                    Anchored in parliamentary procedure and crisis diplomacy.
                  </p>
                </div>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-[#ede6ca]/80">
                    6 Chambers
                  </span>
                </div>
              </div>

              {/* Card 4 (Span 2) */}
              <div className="md:col-span-2 rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 sm:p-10 flex flex-col justify-between min-h-[260px]">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                    Delegations
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight text-[#ede6ca] mt-3">
                    Global representation.
                  </h3>
                  <p className="text-sm sm:text-base text-[#b9b296] mt-3 leading-relaxed max-w-lg">
                    Open to secondary school and university delegates, independent delegations, and faculty advisors.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#ede6ca]">
                    Registration criteria TBA
                  </span>
                  <span className="text-4xl font-bold text-[#b9b296]">
                    TBA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* =========================================================================
            2. GLOBE SECTION (Dedicated full-width section with 2D Canvas Globe)
           ========================================================================= */}
        <RevealSection id="globe" className="py-28 sm:py-36 px-5 sm:px-8">
          <div className="max-w-[1040px] mx-auto text-center">
            {/* Centered headline */}
            <div className="max-w-2xl mx-auto mb-10 sm:mb-14">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#ede6ca] leading-[1.05]">
                A world of diplomacy.
              </h2>
              <p className="text-base sm:text-lg text-[#b9b296] font-normal mt-4">
                Multilateral representation spanning every continent.
              </p>
            </div>

            {/* Interactive D3 Canvas Globe */}
            <div className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-6 sm:p-12 flex flex-col items-center justify-center">
              <Globe />
            </div>
          </div>
        </RevealSection>

        {/* =========================================================================
            3. COMMITTEES SECTION (6 Bento Cards, "Committee TBA")
           ========================================================================= */}
        <RevealSection id="committees" className="py-28 sm:py-36 px-5 sm:px-8">
          <div className="max-w-[1040px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#ede6ca] leading-[1.05]">
                Committees.
              </h2>
              <p className="text-base sm:text-lg text-[#b9b296] font-normal mt-4">
                Six distinct chambers designed for deep geopolitical debate.
              </p>
            </div>

            {/* 6 Bento Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div
                  key={num}
                  className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-7 sm:p-8 flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                      Chamber 0{num}
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight text-[#ede6ca] mt-2">
                      Committee TBA
                    </h3>
                    <p className="text-sm text-[#b9b296] mt-2 leading-relaxed">
                      Agenda TBA · Chairs TBA
                    </p>
                  </div>
                  <div className="mt-8 flex items-baseline justify-between border-t border-[#ede6ca]/10 pt-4">
                    <span className="text-xs text-[#b9b296] uppercase tracking-wider">
                      Status
                    </span>
                    <span className="text-xl font-bold text-[#b9b296]">
                      TBA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* =========================================================================
            4. TEAM SECTION (Secretariat + 12 Department Compact Cards)
           ========================================================================= */}
        <RevealSection id="team" className="py-28 sm:py-36 px-5 sm:px-8">
          <div className="max-w-[1040px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#ede6ca] leading-[1.05]">
                Team.
              </h2>
              <p className="text-base sm:text-lg text-[#b9b296] font-normal mt-4">
                The secretariat and departments organizing Willow MUN.
              </p>
            </div>

            {/* Secretariat Cards */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[#b9b296] mb-4 text-center sm:text-left">
                Secretariat
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: 'Secretary-General', focus: 'Executive Dais Leadership' },
                  { title: 'Deputy Secretary-General', focus: 'Academic & Committee Affairs' },
                  { title: 'General Advisor', focus: 'Governance & Operations' },
                ].map((exec, idx) => (
                  <div
                    key={idx}
                    className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-7 sm:p-8 flex flex-col justify-between min-h-[190px]"
                  >
                    <div>
                      <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                        {exec.title}
                      </span>
                      <p className="text-xs text-[#b9b296] mt-1">{exec.focus}</p>
                    </div>
                    <div className="mt-6">
                      <span className="text-3xl font-bold text-[#ede6ca]">
                        TBA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Compact Cards */}
            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[#b9b296] mb-4 mt-10 text-center sm:text-left">
                Departments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEPARTMENTS.map((dept, index) => (
                  <div
                    key={index}
                    className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-6 flex flex-col justify-between min-h-[150px]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-[#ede6ca] tracking-tight">
                          {dept.name}
                        </h4>
                        <span className="text-[10px] font-semibold tracking-wider text-[#b9b296] uppercase">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="text-xs text-[#b9b296] mt-1">
                        {dept.role} · {dept.staff}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#ede6ca]/10 pt-3">
                      <span className="text-xs text-[#b9b296]">Personnel</span>
                      <span className="text-sm font-semibold text-[#ede6ca]">TBA</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>

        {/* =========================================================================
            5. UPDATES SECTION (Two Bento Cards)
           ========================================================================= */}
        <RevealSection id="updates" className="py-28 sm:py-36 px-5 sm:px-8">
          <div className="max-w-[1040px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#ede6ca] leading-[1.05]">
                Updates.
              </h2>
              <p className="text-base sm:text-lg text-[#b9b296] font-normal mt-4">
                Timeline announcements and registration milestones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 sm:p-12 flex flex-col justify-between min-h-[280px]">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                    Registration
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ede6ca] mt-3">
                    Delegate and chair applications.
                  </h3>
                  <p className="text-sm sm:text-base text-[#b9b296] mt-3 leading-relaxed">
                    Opening date and eligibility criteria to be announced.
                  </p>
                </div>
                <div className="mt-8 flex items-baseline justify-between border-t border-[#ede6ca]/10 pt-4">
                  <span className="text-xs uppercase tracking-wider text-[#b9b296]">Opening Date</span>
                  <span className="text-3xl font-bold text-[#ede6ca]">TBA</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 sm:p-12 flex flex-col justify-between min-h-[280px]">
                <div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                    Venue & Host
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#ede6ca] mt-3">
                    Dates and venue.
                  </h3>
                  <p className="text-sm sm:text-base text-[#b9b296] mt-3 leading-relaxed">
                    Host institution, conference halls, and schedule to be announced.
                  </p>
                </div>
                <div className="mt-8 flex items-baseline justify-between border-t border-[#ede6ca]/10 pt-4">
                  <span className="text-xs uppercase tracking-wider text-[#b9b296]">Location</span>
                  <span className="text-3xl font-bold text-[#ede6ca]">TBA</span>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* =========================================================================
            6. CONTACT SECTION (Instagram TBA, Email TBA, Location TBA)
           ========================================================================= */}
        <RevealSection id="contact" className="py-28 sm:py-36 px-5 sm:px-8">
          <div className="max-w-[1040px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#ede6ca] leading-[1.05]">
                Contact.
              </h2>
              <p className="text-base sm:text-lg text-[#b9b296] font-normal mt-4">
                Connect with the Willow MUN Secretariat.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 text-center flex flex-col items-center justify-between min-h-[190px]">
                <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                  Instagram
                </span>
                <span className="text-3xl font-bold text-[#ede6ca] my-3">TBA</span>
                <span className="text-xs text-[#b9b296]">Official channel forthcoming</span>
              </div>

              <div className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 text-center flex flex-col items-center justify-between min-h-[190px]">
                <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                  Email
                </span>
                <span className="text-3xl font-bold text-[#ede6ca] my-3">TBA</span>
                <span className="text-xs text-[#b9b296]">Secretariat contact address</span>
              </div>

              <div className="rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 text-center flex flex-col items-center justify-between min-h-[190px]">
                <span className="text-xs font-semibold tracking-wider uppercase text-[#b9b296]">
                  Location
                </span>
                <span className="text-3xl font-bold text-[#ede6ca] my-3">TBA</span>
                <span className="text-xs text-[#b9b296]">Host city & venue</span>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* =========================================================================
            7. SUGGESTIONS FORM SECTION (Clean, rounded inputs, pill submit button)
           ========================================================================= */}
        <RevealSection id="suggestions" className="py-28 sm:py-36 px-5 sm:px-8">
          <div className="max-w-[1040px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#ede6ca] leading-[1.05]">
                Have something to say?
              </h2>
              <p className="text-base sm:text-lg text-[#b9b296] font-normal mt-4">
                Share your suggestions, delegate requirements, or thoughts.
              </p>
            </div>

            {/* Bento Form Card */}
            <div className="max-w-2xl mx-auto rounded-[28px] bg-[rgba(29,33,16,0.86)] p-8 sm:p-12">
              {formSubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#ede6ca] text-[#1d2110] flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#ede6ca]">
                    Thank you for your message.
                  </h3>
                  <p className="text-sm text-[#b9b296] max-w-md mx-auto leading-relaxed">
                    Your suggestion has been noted. Our team is actively shaping the inaugural session of Willow MUN.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="rounded-full bg-[#ede6ca] text-[#1d2110] px-6 py-2.5 text-xs font-semibold hover:bg-[#b9b296] transition-colors"
                    >
                      Send another note
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitSuggestion} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label htmlFor={nameInputId} className="block text-xs font-semibold uppercase tracking-wider text-[#b9b296] mb-2">
                        Name <span className="text-[#ede6ca]">*</span>
                      </label>
                      <input
                        id={nameInputId}
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Delegate or Advisor name"
                        className="w-full rounded-full bg-[#363c20]/40 border-0 px-5 py-3 text-sm text-[#ede6ca] placeholder:text-[#b9b296]/50 focus:outline-none focus:ring-2 focus:ring-[#ede6ca]"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor={emailInputId} className="block text-xs font-semibold uppercase tracking-wider text-[#b9b296] mb-2">
                        Email <span className="text-xs text-[#b9b296]/60 font-normal">(Optional)</span>
                      </label>
                      <input
                        id={emailInputId}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="address@example.com"
                        className="w-full rounded-full bg-[#363c20]/40 border-0 px-5 py-3 text-sm text-[#ede6ca] placeholder:text-[#b9b296]/50 focus:outline-none focus:ring-2 focus:ring-[#ede6ca]"
                      />
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label htmlFor={typeSelectId} className="block text-xs font-semibold uppercase tracking-wider text-[#b9b296] mb-2">
                      Type
                    </label>
                    <select
                      id={typeSelectId}
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full rounded-full bg-[#363c20]/60 border-0 px-5 py-3 text-sm text-[#ede6ca] focus:outline-none focus:ring-2 focus:ring-[#ede6ca]"
                    >
                      <option value="Suggestion">Conference Suggestion</option>
                      <option value="Requirement">Special Requirement / Accommodation</option>
                      <option value="General">General Inquiry</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor={messageInputId} className="block text-xs font-semibold uppercase tracking-wider text-[#b9b296] mb-2">
                      Message <span className="text-[#ede6ca]">*</span>
                    </label>
                    <textarea
                      id={messageInputId}
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="What should Willow MUN know or consider?"
                      className="w-full rounded-[20px] bg-[#363c20]/40 border-0 px-5 py-3.5 text-sm text-[#ede6ca] placeholder:text-[#b9b296]/50 focus:outline-none focus:ring-2 focus:ring-[#ede6ca] resize-y"
                    />
                  </div>

                  {/* Pill submit button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="rounded-full bg-[#ede6ca] text-[#1d2110] px-8 py-3 text-sm font-semibold hover:bg-[#b9b296] transition-colors cursor-pointer"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </RevealSection>

        {/* =========================================================================
            8. MINIMAL FOOTER
            No full-width opaque background! Video remains visible behind it.
           ========================================================================= */}
        <footer className="relative z-10 py-16 sm:py-24 px-6 text-center select-none">
          <div className="max-w-[1040px] mx-auto flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo-transparent.png" alt="Willow MUN" className="w-6 h-6 object-contain" />
              <span className="text-sm font-semibold text-[#ede6ca] tracking-tight">
                Willow Model United Nations
              </span>
            </div>

            <p className="text-xs text-[#b9b296] tracking-wide">
              WILLOW MUN · 2026 · All details TBA
            </p>

            <div className="pt-2">
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-xs text-[#b9b296] hover:text-[#ede6ca] transition-colors py-1.5 px-3 rounded-full bg-[rgba(29,33,16,0.65)]"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Back to top</span>
              </a>
            </div>
          </div>
        </footer>

      </main>

      {/* =========================================================================
          ROUND ICON-ONLY PAUSE BUTTON (40px, Bottom-Right Corner)
          Never covers content, fixed at bottom-6 right-6, round pill.
         ========================================================================= */}
      <button
        type="button"
        onClick={togglePlayState}
        aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-[rgba(29,33,16,0.85)] hover:bg-[#363c20] text-[#ede6ca] border border-[#ede6ca]/20 flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ede6ca]"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>
    </>
  );
}
