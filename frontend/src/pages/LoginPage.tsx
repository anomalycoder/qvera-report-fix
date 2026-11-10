import React, { useState } from "react"
import {
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Atom,
  Calculator,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

interface LoginPageProps {
  onLoginSuccess: () => void
  onNavigateHome: () => void
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const { login } = useAuth()

  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [rememberMe, setRememberMe] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFillDemo = () => {
    setEmail("demo@acadza.local")
    setPassword("AcadzaDemo2026!")
    setErrorMsg(null)
    toast.info("Demo credentials populated: Dr. A. Sharma (Faculty Reviewer)")
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg(null)

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email address and password.")
      return
    }

    setIsLoading(true)
    const result = await login(email.trim(), password, rememberMe)
    setIsLoading(false)

    if (result.success) {
      toast.success("Welcome back, Dr. A. Sharma. Faculty workspace unlocked.")
      onLoginSuccess()
    } else {
      setErrorMsg(result.error || "Invalid email or password.")
      toast.error(result.error || "Authentication failed.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0F19]">
      {/* LEFT COLUMN: Premium Enterprise Navy Panel (Hidden on mobile) */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E293B] border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo & Back to Home */}
        <div className="relative z-10 flex items-center justify-between">
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-blue-600/30">
              A
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Acadza
              </span>
              <span className="text-[11px] font-mono text-blue-400 font-semibold bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded-full">
                Report → Fix
              </span>
            </div>
          </div>

          <button
            onClick={onNavigateHome}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to website</span>
          </button>
        </div>

        {/* Center: Hero copy & Miniature Verification Preview */}
        <div className="relative z-10 my-10 space-y-6 max-w-lg">
          <div className="space-y-2">
            <Badge variant="primary" className="text-xs font-mono">
              Faculty Authentication Portal
            </Badge>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back to better academic quality.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Review flagged question defects, inspect SymPy mathematical verification proofs, and authorize surgical patches with full audit compliance.
            </p>
          </div>

          {/* Miniature proof card */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/70 p-4.5 space-y-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <Calculator className="w-4 h-4" />
                <span>SymPy Physics Solver</span>
              </div>
              <span className="text-emerald-400 font-mono text-[11px]">✓ Verified</span>
            </div>
            <div className="bg-slate-900/80 rounded p-2.5 font-mono text-xs text-slate-300 space-y-1">
              <div className="text-slate-400">Question Q001 // Series LCR Circuit</div>
              <div className="text-emerald-400 font-bold">Z = sqrt(50² + 0) = 50 Ω</div>
              <div className="text-slate-400 text-[11px]">Answer key updated from Option B to Option A</div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Immutable SQLite WAL audit logging active</span>
            </div>
          </div>
        </div>

        {/* Bottom: Security Assurance */}
        <div className="relative z-10 flex items-center gap-4 text-xs text-slate-500 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-bit PBKDF2 Session Security</span>
          </div>
          <span>•</span>
          <span>Role-Based Access</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean White Form Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#F7F8FA]">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Sign in to Acadza QA
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your credentials to access the faculty review console.
            </p>
          </div>

          {/* Quick Demo Account Selector (Requested by Prompt 10) */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Demo Environment Available</span>
              </div>
              <Badge variant="primary" className="text-[10px] uppercase font-mono tracking-wider">
                Pre-configured
              </Badge>
            </div>
            <p className="text-xs text-blue-800/80 leading-relaxed">
              For evaluation testing, use the pre-configured faculty account for <strong>Dr. A. Sharma</strong> (Physics QA Lead).
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillDemo}
              className="w-full bg-white hover:bg-blue-100 text-blue-700 border-blue-300 font-semibold text-xs py-2 cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Fill Demo Credentials (demo@acadza.local)
            </Button>
          </div>

          {/* Error Message banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@acadza.local"
                  className="pl-9 h-10 text-sm bg-white border-[#E5E7EB] text-[#111827] focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Secured with PBKDF2
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-9 pr-9 h-10 text-sm bg-white border-[#E5E7EB] text-[#111827] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Remember me for 30 days</span>
              </label>

              <span className="text-xs text-slate-400">
                Contact Admin for Reset
              </span>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm h-10 rounded-lg shadow-sm transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                "Sign In to Console →"
              )}
            </Button>
          </form>

          {/* Footer of card */}
          <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
            <span>Acadza Academic QA Engine v1.0.0</span>
            <div className="mt-1 text-[11px] text-slate-400">
              Only authorized academic faculty and reviewers may access internal question sets.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
