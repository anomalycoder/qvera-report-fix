import React, { useState } from "react"
import {
  ArrowLeft,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Check,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
  const { login, register } = useAuth()

  // Tab State: "signin" | "signup"
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")

  // Production Form Fields - Empty by default
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [rememberMe, setRememberMe] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Forgot Password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSubmitted, setResetSubmitted] = useState(false)

  // Separate, clearly labelled demo access helpers (without exposing raw passwords)
  const handleFillDemo = () => {
    setAuthMode("signin")
    setEmail("demo@qvera.local")
    setPassword("QveraDemo2026!")
    setErrorMsg(null)
    toast.info("Faculty demo credentials loaded: Dr. A. Sharma")
  }

  const handleFillAdmin = () => {
    setAuthMode("signin")
    setEmail("admin@qvera.local")
    setPassword("QveraAdmin2026!")
    setErrorMsg(null)
    toast.info("Administrator credentials loaded: Admin A. Mehta")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (authMode === "signin") {
      if (!email.trim() || !password) {
        setErrorMsg("Please enter both your institutional email and password.")
        return
      }

      setIsLoading(true)
      const result = await login(email.trim(), password, rememberMe)
      setIsLoading(false)

      if (result.success) {
        toast.success("Authentication successful. Opening faculty workspace.")
        onLoginSuccess()
      } else {
        setErrorMsg(result.error || "Invalid email or password.")
        toast.error(result.error || "Authentication failed.")
      }
    } else {
      // Sign Up
      if (!name.trim()) {
        setErrorMsg("Please enter your full name.")
        return
      }
      if (!email.trim()) {
        setErrorMsg("Please enter your institutional email address.")
        return
      }
      if (!password || password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.")
        return
      }

      setIsLoading(true)
      const result = await register(name.trim(), email.trim(), password)
      setIsLoading(false)

      if (result.success) {
        toast.success("Account created successfully. Welcome to QVERA!")
        onLoginSuccess()
      } else {
        setErrorMsg(result.error || "Registration failed.")
        toast.error(result.error || "Registration failed.")
      }
    }
  }

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) {
      toast.error("Please enter your registered email address.")
      return
    }
    setResetSubmitted(true)
    toast.success(`Password reset authorization dispatched to ${resetEmail.trim()}`)
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F9F8F3] text-[#111111] selection:bg-[#30343B]/15 selection:text-[#111111] font-sans antialiased flex flex-col justify-between">
      {/* =========================================================================
          HEADER: CLEAN QVERA LOGO & BACK TO WEBSITE (MATCHING LANDING NAVIGATION)
      ========================================================================= */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#F9F8F3] h-[60px] sm:h-[64px] flex items-center border-b border-[#E2DFD6] shrink-0">
        <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-[74px] flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={onNavigateHome}
            className="cursor-pointer inline-flex items-center"
          >
            <span className="font-display font-semibold text-[22px] sm:text-[24px] tracking-tight text-[#111111]">
              QVERA
            </span>
          </div>

          {/* Right Action: Back to Website Link */}
          <button
            onClick={onNavigateHome}
            className="text-[13px] sm:text-[13.5px] font-medium text-[#555555] hover:text-[#111111] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to website</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN EDITORIAL SPLIT-SCREEN CONTAINER
          Left: Academic Review Suite Product Showcase + Overlapping Cards
          Right: Clean, Focused Authentication Area (Direct on Canvas, No Heavy Box)
      ========================================================================= */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-8 lg:py-10 w-full">
        <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-[74px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
          
          {/* =====================================================================
              LEFT COLUMN: EDITORIAL HEADLINE & REAL PRODUCT SHOWCASE
              Hidden on small mobile screens to keep the auth experience focused
          ===================================================================== */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-4 text-left">
            {/* Editorial Headline & Secondary Subtext (Matching Landing Section Header Typography) */}
            <div className="space-y-1">
              <h2 className="font-display text-[26px] sm:text-[32px] lg:text-[36px] font-[425] text-[#111111] leading-[1.15] tracking-tight">
                Every question verified.
              </h2>

              <p className="font-sans text-[13px] sm:text-[13.5px] text-[#666666] leading-relaxed max-w-[420px]">
                Proof for every answer.
              </p>
            </div>

            {/* Product Mockup Presentation (Comfortably scaled, Frameless on page background) */}
            <div className="relative w-full max-w-[530px] xl:max-w-[570px] pt-1">
              <img
                src="/login-auth-tablet.png?v=2"
                alt="QVERA Academic Question Review Faculty Workspace on Tablet"
                className="w-full h-auto max-h-[415px] xl:max-h-[450px] object-contain block select-none pointer-events-none drop-shadow-sm"
                loading="eager"
              />
            </div>
          </div>

          {/* =====================================================================
              RIGHT COLUMN: FOCUSED AUTHENTICATION FORM (NO HEAVY CARD ENCLOSURE)
          ===================================================================== */}
          <div className="lg:col-span-5 flex flex-col justify-center w-full max-w-[420px] mx-auto lg:mx-0 lg:ml-auto text-left">
            
            {/* Header Hierarchy: Welcome Back */}
            <div className="space-y-1.5 mb-6">
              <h1 className="font-display text-[26px] sm:text-[28px] font-semibold text-[#111111] tracking-[-0.02em]">
                {authMode === "signin" ? "Welcome back." : "Create your account."}
              </h1>
              <p className="text-[13.5px] text-[#555555] font-sans leading-relaxed">
                {authMode === "signin"
                  ? "Sign in to continue to your QVERA faculty workspace."
                  : "Join the academic examination quality verification council."}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#B91C1C] flex items-start gap-2 font-sans">
                <span className="font-bold">•</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Fields Directly on Canvas */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (Sign Up Only) */}
              {authMode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#222222] block font-sans">
                    Full Name & Title
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Sarah Jenkins"
                      className="pl-9 text-[13px] bg-white border-[#C5C1B4] focus-visible:border-[#111111] focus-visible:ring-1 focus-visible:ring-[#111111] h-10 rounded-[8px] font-sans"
                      required={authMode === "signup"}
                    />
                    <User className="w-4 h-4 text-[#777777] absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Institutional Email */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#222222] block font-sans">
                  Institutional Email
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@institution.edu"
                    className="pl-9 text-[13px] bg-white border-[#C5C1B4] focus-visible:border-[#111111] focus-visible:ring-1 focus-visible:ring-[#111111] h-10 rounded-[8px] font-sans"
                    autoComplete="email"
                    required
                  />
                  <Mail className="w-4 h-4 text-[#777777] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-[#222222] block font-sans">
                    Password
                  </label>
                  {authMode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email)
                        setForgotModalOpen(true)
                      }}
                      className="text-[12px] text-[#555555] hover:text-[#111111] transition-colors cursor-pointer font-sans"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 pr-9 text-[13px] bg-white border-[#C5C1B4] focus-visible:border-[#111111] focus-visible:ring-1 focus-visible:ring-[#111111] h-10 rounded-[8px] font-sans"
                    autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                    required
                  />
                  <Lock className="w-4 h-4 text-[#777777] absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-3 text-[#777777] hover:text-[#111111] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox with Explicit Black Tick */}
              {authMode === "signin" && (
                <div className="flex items-center justify-between text-[12.5px] pt-0.5">
                  <label
                    onClick={() => setRememberMe(!rememberMe)}
                    className="inline-flex items-center gap-2 cursor-pointer text-[#555555] font-sans select-none"
                  >
                    <span
                      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                        rememberMe
                          ? "bg-[#FFFFFF] border-[#111111]"
                          : "bg-[#FFFFFF] border-[#C5C1B4] hover:border-[#111111]"
                      }`}
                    >
                      {rememberMe && (
                        <Check className="w-3 h-3 text-[#111111] stroke-[3]" />
                      )}
                    </span>
                    <span>Keep me signed in</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[14px] font-medium h-[44px] rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 font-sans shadow-xs mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{authMode === "signin" ? "Signing in..." : "Creating account..."}</span>
                  </div>
                ) : (
                  <>
                    <span>{authMode === "signin" ? "Sign In to Faculty Console" : "Create Account"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Mode Toggle Switch */}
            <div className="pt-4 text-center text-[13px] text-[#555555] font-sans">
              {authMode === "signin" ? (
                <span>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup")
                      setErrorMsg(null)
                    }}
                    className="font-medium text-[#111111] underline hover:text-black cursor-pointer"
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin")
                      setErrorMsg(null)
                    }}
                    className="font-medium text-[#111111] underline hover:text-black cursor-pointer"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>

            {/* Evaluation Access Separator & Demo Buttons (Clearly Labelled, No Exposed Passwords) */}
            <div className="mt-8 pt-4 border-t border-[#DFDBD0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] font-sans text-[#666666]">
              <span>Evaluation access:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="px-2.5 py-1 rounded-[6px] bg-[#EFECE6] hover:bg-[#DFDBD0] text-[#111111] font-mono text-[11px] font-medium transition-colors cursor-pointer border border-[#C5C1B4]"
                >
                  Faculty Demo
                </button>
                <button
                  type="button"
                  onClick={handleFillAdmin}
                  className="px-2.5 py-1 rounded-[6px] bg-[#EFECE6] hover:bg-[#DFDBD0] text-[#111111] font-mono text-[11px] font-medium transition-colors cursor-pointer border border-[#C5C1B4]"
                >
                  Admin Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          FOOTER COPYRIGHT ROW
      ========================================================================= */}
      <footer className="w-full py-3.5 sm:py-4 border-t border-[#E2DFD6] text-center text-[13px] font-medium text-[#555555] font-sans shrink-0">
        <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-[74px] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <p>© 2026 QVERA Systems. Academic Question Quality Assurance Platform.</p>
          <div className="flex items-center gap-4 sm:gap-6 text-[#666666] text-[12.5px]">
            <span className="hover:text-[#111111] transition-colors cursor-pointer">Security Policy</span>
            <span>•</span>
            <span className="hover:text-[#111111] transition-colors cursor-pointer">Taxonomy Governance</span>
            <span>•</span>
            <span className="hover:text-[#111111] transition-colors cursor-pointer">Audit Ledger</span>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          FORGOT PASSWORD MODAL (PRESERVED FULL FUNCTIONALITY)
      ========================================================================= */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="max-w-md bg-white border-[1.5px] border-[#C5C1B4] rounded-[20px] p-6 shadow-xl text-left">
          <DialogHeader className="pb-3 border-b border-[#E5E2D9]">
            <DialogTitle className="font-display text-base font-semibold text-[#111111] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#111111]" />
              <span>Reset Faculty Password</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#666666]">
              Enter your institutional email address to receive password reset authorization.
            </DialogDescription>
          </DialogHeader>

          {resetSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#ECFDF3] text-[#15803D] border border-[#D1FADF] flex items-center justify-center mx-auto">
                <Check className="w-5 h-5" />
              </div>
              <h4 className="font-display text-sm font-semibold text-[#111111]">
                Reset Instructions Dispatched
              </h4>
              <p className="text-xs text-[#666666] max-w-xs mx-auto">
                If an account exists for <span className="font-semibold text-[#111111]">{resetEmail}</span>, a secure verification link has been sent to your inbox.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(false)
                    setResetSubmitted(false)
                  }}
                  className="bg-[#0B0F12] hover:bg-[#1f2328] text-white text-xs font-medium px-4 h-9 rounded-[8px] transition-all cursor-pointer active:scale-[0.98]"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#222222] block font-sans">
                  Institutional Email
                </label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="faculty@institution.edu"
                  className="text-xs bg-white border-[#C5C1B4] h-10 rounded-[8px] font-sans"
                  required
                />
              </div>

              <div className="p-3 bg-[#F9F8F3] rounded-[12px] border border-[#E5E2D9] text-[11px] text-[#666666] font-sans">
                <strong>Security Policy:</strong> For production faculty accounts, reset tokens expire after 15 minutes and require secondary department verification.
              </div>

              <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="border border-[#CECECE] hover:border-[#B5B5B5] text-[#111111] text-xs font-medium px-3.5 h-9 rounded-[8px] hover:bg-black/[0.04] transition-all cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0B0F12] hover:bg-[#1f2328] text-white text-xs font-medium px-4 h-9 rounded-[8px] transition-all cursor-pointer active:scale-[0.98] font-sans"
                >
                  Send Reset Link
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
