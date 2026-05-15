"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Target, Mic, Brain, Github, Linkedin, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── FONT INJECTION ─────────────────────────────────────────────────────── */
// Add this to your global CSS or layout.tsx <head>:
// <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet"/>

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const styles = `
  /* NOISE OVERLAY */
  .rfx-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.035;
    pointer-events: none;
    z-index: 0;
  }

  /* HERO GRID LINES */
  .rfx-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 75%);
    pointer-events: none;
  }

  /* HERO GLOW BLOB */
  .rfx-hero-blob::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.22) 0%, transparent 55%),
                radial-gradient(ellipse at 70% 50%, rgba(147,51,234,0.18) 0%, transparent 55%);
    filter: blur(40px);
  }

  /* TRUST SECTION GLOW */
  .rfx-trust::before {
    content: '';
    position: absolute;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 600px; height: 200px;
    background: radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  /* FEATURE CARD RADIAL */
  .rfx-feature-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 0% 0%, rgba(99,102,241,0.08) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
    border-radius: 20px;
  }
  .rfx-feature-card:hover::before { opacity: 1; }

  /* BADGE PULSE */
  @keyframes rfx-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .rfx-badge-dot {
    animation: rfx-pulse 2s ease infinite;
  }

  /* TRUST PILL HOVER */
  .rfx-trust-pill:hover {
    border-color: rgba(99,102,241,0.3) !important;
    background: rgba(99,102,241,0.06) !important;
    color: #f4f4f5 !important;
  }

  /* FONT OVERRIDES */
  .rfx-font-display {
    font-family: 'Syne', ui-sans-serif, system-ui, sans-serif !important;
  }
  .rfx-font-body {
    font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif !important;
  }
`;

/* ─── FEATURE CARD ───────────────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
  num,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
  num: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      className="rfx-feature-card"
      style={{
        padding: "32px",
        borderRadius: "20px",
        background: "var(--rfx-surface, #0f1117)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
      whileHover={{
        y: -4,
        borderColor: "rgba(99,102,241,0.35)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(99,102,241,0.07)",
      }}
    >
      {/* Number chip */}
      <span
        className="rfx-font-display"
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          fontSize: "11px",
          fontWeight: 700,
          color: "rgba(113,113,122,0.8)",
          letterSpacing: "0.05em",
        }}
      >
        {num}
      </span>

      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.25 }}
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "14px",
          background: "rgba(99,102,241,0.10)",
          border: "1px solid rgba(99,102,241,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "22px",
        }}
      >
        <Icon style={{ width: "24px", height: "24px", color: "#818cf8" }} />
      </motion.div>

      <h3
        className="rfx-font-display"
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#f4f4f5",
          marginBottom: "10px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p
        className="rfx-font-body"
        style={{
          fontSize: "14px",
          color: "#a1a1aa",
          lineHeight: 1.7,
          fontWeight: 300,
        }}
      >
        {description}
      </p>
    </motion.div>
  );
}

/* ─── LANDING PAGE ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      {/* Inject styles */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div
        className="rfx-root rfx-font-body"
        style={{
          minHeight: "100vh",
          background: "#08090c",
          color: "#f4f4f5",
          overflowX: "hidden",
          position: "relative",
        }}
      >
        {/* ── NAVBAR ── */}
        <nav
          style={{
            position: "fixed",
            top: 0,
            width: "100%",
            zIndex: 100,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(8,9,12,0.75)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 24px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="rfx-font-display"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #6366f1, #9333ea)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "13px",
                  color: "#fff",
                  boxShadow: "0 0 20px rgba(99,102,241,0.4)",
                }}
              >
                RF
              </div>
              <span
                className="rfx-font-display"
                style={{ fontSize: "18px", fontWeight: 700, color: "#f4f4f5", letterSpacing: "-0.02em" }}
              >
                ResumeForge<span style={{ color: "#818cf8" }}>-X</span>
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link
                href="/login"
                className="rfx-font-body"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#a1a1aa",
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  transition: "color 0.2s, background 0.2s",
                }}
              >
                Sign In
              </Link>
              <Link href="/register">
                <Button
                  variant="gradient"
                  style={{
                    borderRadius: "100px",
                    padding: "0 20px",
                    height: "38px",
                    background: "linear-gradient(135deg, #6366f1, #9333ea)",
                    boxShadow: "0 0 24px rgba(99,102,241,0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Get Started <ArrowRight style={{ width: "15px", height: "15px" }} />
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section
          className="rfx-hero"
          style={{
            position: "relative",
            padding: "160px 24px 120px",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          {/* Glow blob */}
          <div
            className="rfx-hero-blob"
            style={{
              position: "absolute",
              top: "-100px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "900px",
              height: "500px",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto" }}>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 14px 5px 10px",
                borderRadius: "100px",
                border: "1px solid rgba(99,102,241,0.3)",
                background: "rgba(99,102,241,0.08)",
                color: "#818cf8",
                fontSize: "13px",
                fontWeight: 500,
                marginBottom: "36px",
              }}
            >
              <span
                className="rfx-badge-dot"
                style={{
                  width: "6px",
                  height: "6px",
                  background: "#818cf8",
                  borderRadius: "50%",
                  boxShadow: "0 0 8px #818cf8",
                  display: "inline-block",
                }}
              />
              <Sparkles style={{ width: "14px", height: "14px" }} />
              Powered by Gemini &amp; LangChain
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="rfx-font-display"
              style={{
                fontSize: "clamp(44px, 7vw, 76px)",
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#f4f4f5",
                marginBottom: "28px",
              }}
            >
              Your AI-Powered{" "}
              <br className="hidden lg:block" />
              <span
                style={{
                  background: "linear-gradient(90deg, #818cf8 0%, #a78bfa 40%, #c084fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Career Accelerator
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="rfx-font-body"
              style={{
                fontSize: "clamp(16px, 2vw, 19px)",
                color: "#a1a1aa",
                lineHeight: 1.65,
                maxWidth: "600px",
                margin: "0 auto 48px",
                fontWeight: 300,
              }}
            >
              Optimize your resume for ATS systems, practice tailored mock interviews, and generate
              personalized learning roadmaps—all driven by intelligent AI agents.
            </motion.p>

            {/* CTA Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <Link href="/register">
                <Button
                  variant="gradient"
                  size="lg"
                  style={{
                    borderRadius: "100px",
                    padding: "0 36px",
                    height: "56px",
                    fontSize: "16px",
                    background: "linear-gradient(135deg, #6366f1, #9333ea)",
                    boxShadow: "0 0 40px rgba(99,102,241,0.4), 0 8px 32px rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    transition: "all 0.25s",
                  }}
                >
                  Start For Free <ArrowRight style={{ width: "18px", height: "18px" }} />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  style={{
                    borderRadius: "100px",
                    padding: "0 36px",
                    height: "56px",
                    fontSize: "16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "#a1a1aa",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    transition: "all 0.25s",
                  }}
                >
                  View Dashboard
                </Button>
              </Link>
            </motion.div>

            {/* Stat Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "40px",
                marginTop: "72px",
                paddingTop: "56px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                flexWrap: "wrap",
              }}
            >
              {[
                { num: "3×", label: "More interview calls" },
                { num: "ATS", label: "Beat every filter" },
                { num: "∞", label: "Tailored mock sessions" },
                { num: "AI", label: "Real-time scoring" },
              ].map((s, i) => (
                <React.Fragment key={s.num}>
                  {i > 0 && (
                    <div
                      style={{
                        width: "1px",
                        height: "40px",
                        background: "rgba(255,255,255,0.07)",
                      }}
                    />
                  )}
                  <div style={{ textAlign: "center" }}>
                    <div
                      className="rfx-font-display"
                      style={{ fontSize: "30px", fontWeight: 700, color: "#f4f4f5", letterSpacing: "-0.03em" }}
                    >
                      {s.num}
                    </div>
                    <div style={{ fontSize: "13px", color: "#71717a", marginTop: "4px" }}>{s.label}</div>
                  </div>
                </React.Fragment>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "100px 24px",
            position: "relative",
            zIndex: 1,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ marginBottom: "64px" }}>
            <div
              className="rfx-font-display"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#818cf8",
                marginBottom: "14px",
              }}
            >
              What&apos;s inside
            </div>
            <h2
              className="rfx-font-display"
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "#f4f4f5",
                marginBottom: "16px",
              }}
            >
              A complete toolkit for your career.
            </h2>
            <p
              className="rfx-font-body"
              style={{ color: "#a1a1aa", maxWidth: "520px", lineHeight: 1.7, fontWeight: 300 }}
            >
              ResumeForge-X replaces multiple tools by centralizing your Master Profile and using
              context-aware AI microservices to guide you to your next job.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            <FeatureCard
              icon={Target}
              title="ATS Optimization Engine"
              description="Paste a Job Description and instantly see how well your profile matches. Generate a tailored PDF resume optimized to beat the ATS."
              delay={0.1}
              num="01"
            />
            <FeatureCard
              icon={Mic}
              title="JD-Aware Interviews"
              description="Practice mock interviews that dynamically generate questions based on the exact job you are applying for. Get real-time LLM scoring."
              delay={0.2}
              num="02"
            />
            <FeatureCard
              icon={Brain}
              title="Skill Gap Roadmaps"
              description="Identify what you're missing for a target role. Our AI generates a week-by-week learning roadmap with real resources to bridge the gap."
              delay={0.3}
              num="03"
            />
          </div>
        </section>

        {/* ── TRUST ── */}
        <div
          className="rfx-trust"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "#0f1117",
            padding: "100px 24px",
            position: "relative",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Shield */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <ShieldCheck style={{ width: "30px", height: "30px", color: "#22c55e" }} />
            </div>

            <h2
              className="rfx-font-display"
              style={{
                fontSize: "clamp(24px, 3.5vw, 36px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#f4f4f5",
                marginBottom: "40px",
              }}
            >
              Enterprise-grade architecture.
            </h2>

            {/* Pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              {[
                "Microservices (Python & Node)",
                "PostgreSQL & Redis",
                "Async Celery Workers",
                "API Gateway Rate Limiting",
              ].map((label) => (
                <div
                  key={label}
                  className="rfx-trust-pill rfx-font-body"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    borderRadius: "100px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    fontSize: "13.5px",
                    fontWeight: 500,
                    color: "#a1a1aa",
                    transition: "all 0.25s",
                    cursor: "default",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#818cf8",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <CheckCircle2 style={{ width: "14px", height: "14px", color: "#6366f1" }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "#08090c",
            padding: "40px 24px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="rfx-font-display"
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "7px",
                  background: "#0f1117",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#71717a",
                }}
              >
                RF
              </div>
              <span style={{ fontSize: "13px", color: "#71717a" }}>
                © 2026 ResumeForge-X. Phase 6 Completed.
              </span>
            </div>

            {/* Social links */}
            <div style={{ display: "flex", gap: "16px" }}>
              <a
                href="#"
                style={{ color: "#71717a", transition: "color 0.2s", display: "flex" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
              >
                <Github style={{ width: "18px", height: "18px" }} />
              </a>
              <a
                href="#"
                style={{ color: "#71717a", transition: "color 0.2s", display: "flex" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
              >
                <Linkedin style={{ width: "18px", height: "18px" }} />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}