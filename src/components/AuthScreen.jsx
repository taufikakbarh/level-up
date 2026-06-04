import { useState } from "react";
import { Mail, ArrowLeft, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MODES = {
  CHOICE:   "choice",   // pick magic link or google
  EMAIL:    "email",    // enter email
  SENT:     "sent",     // "check your inbox"
  ERROR:    "error",    // something went wrong
};

export default function AuthScreen({ playerName, onBack, onAuthSuccess }) {
  const { signInWithMagicLink, signInWithGoogle, session } = useAuth();

  // When session arrives (magic link redirect or Google), fire callback
  // useEffect-equivalent: watch session changes
  if (session && onAuthSuccess) {
    onAuthSuccess();
    return null;
  }
  const [mode, setMode]       = useState(MODES.CHOICE);
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // ── Magic link submit ──────────────────────────────────────
  async function handleMagicLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await signInWithMagicLink(email.trim());
    setLoading(false);
    if (error) {
      setError(error.message);
      setMode(MODES.ERROR);
    } else {
      setMode(MODES.SENT);
    }
  }

  // ── Google OAuth ───────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true);
    const { error } = await signInWithGoogle();
    // If error, Google popup was blocked or something failed
    if (error) {
      setLoading(false);
      setError(error.message);
      setMode(MODES.ERROR);
    }
    // On success Supabase redirects — component unmounts
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#0a0c14" }}
    >
      <div className="w-full max-w-sm px-6">

        {/* ── Back button ──────────────────────────────────── */}
        {mode !== MODES.SENT && onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 text-sm mb-8 hover:text-gray-400 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        )}

        {/* ── Choice screen ────────────────────────────────── */}
        {mode === MODES.CHOICE && (
          <div className="animate-fadeIn">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🔐</div>
              <h1 className="text-white font-black text-2xl mb-2">
                Save your progress
              </h1>
              <p className="text-gray-500 text-sm">
                {playerName
                  ? `Link an account to keep ${playerName}'s journey safe.`
                  : "Link an account so your streak is never lost."}
              </p>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm tracking-wide mb-3 transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: "#fff",
                color: "#1a1a1a",
                boxShadow: "0 0 20px rgba(255,255,255,0.05)",
              }}
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "#1f2335" }} />
              <span className="text-xs text-gray-600 uppercase tracking-widest font-bold">or</span>
              <div className="flex-1 h-px" style={{ background: "#1f2335" }} />
            </div>

            {/* Magic link */}
            <button
              onClick={() => setMode(MODES.EMAIL)}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-95"
              style={{
                background: "#12151f",
                color: "#e2e8f0",
                border: "1px solid #1f2335",
              }}
            >
              <Mail size={18} className="text-gold" />
              Continue with Email
            </button>

            <p className="text-center text-xs text-gray-600 mt-6 leading-relaxed">
              No password needed. We'll send a magic link to your inbox.
            </p>
          </div>
        )}

        {/* ── Email form ───────────────────────────────────── */}
        {mode === MODES.EMAIL && (
          <form onSubmit={handleMagicLink} className="animate-fadeIn">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">✉️</div>
              <h1 className="text-white font-black text-2xl mb-2">
                Enter your email
              </h1>
              <p className="text-gray-500 text-sm">
                We'll send a magic link — no password ever.
              </p>
            </div>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
              className="w-full px-5 py-4 rounded-xl text-white text-base mb-4 outline-none"
              style={{
                background: "#12151f",
                border: "2px solid rgba(245,200,66,0.25)",
                caretColor: "#f5c842",
              }}
            />

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-4 rounded-2xl font-black text-base tracking-widest uppercase transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #f5c842, #d97706)",
                color: "#0a0c14",
              }}
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                "Send magic link"
              )}
            </button>
          </form>
        )}

        {/* ── Sent screen ──────────────────────────────────── */}
        {mode === MODES.SENT && (
          <div className="text-center animate-fadeIn">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
              style={{
                background: "rgba(13,148,136,0.1)",
                border: "2px solid rgba(13,148,136,0.3)",
                boxShadow: "0 0 30px rgba(13,148,136,0.15)",
              }}
            >
              📬
            </div>
            <h1 className="text-white font-black text-2xl mb-3">
              Check your inbox
            </h1>
            <p className="text-gray-400 text-sm mb-2 leading-relaxed">
              We sent a magic link to
            </p>
            <p className="font-bold text-sm mb-6" style={{ color: "#f5c842" }}>
              {email}
            </p>
            <p className="text-gray-600 text-xs leading-relaxed mb-8">
              Click the link in the email to sign in. You can close this tab.
              The link expires in 1 hour.
            </p>
            <button
              onClick={() => { setMode(MODES.EMAIL); setEmail(""); }}
              className="text-sm text-gray-500 hover:text-gray-400 transition-colors underline underline-offset-4"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* ── Error screen ─────────────────────────────────── */}
        {mode === MODES.ERROR && (
          <div className="text-center animate-fadeIn">
            <div className="text-5xl mb-6">⚠️</div>
            <h1 className="text-white font-black text-xl mb-3">
              Something went wrong
            </h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {error || "An unexpected error occurred. Please try again."}
            </p>
            <button
              onClick={() => { setMode(MODES.CHOICE); setError(""); }}
              className="w-full py-4 rounded-2xl font-black text-base tracking-widest uppercase transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #f5c842, #d97706)",
                color: "#0a0c14",
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline Google icon (no extra dep) ──────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
