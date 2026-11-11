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

  // Form Fields - Automatically pre-filled with demo credentials by default
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("demo@qvera.local")
  const [password, setPassword] = useState<string>("QveraDemo2026!")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [rememberMe, setRememberMe] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Forgot Password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSubmitted, setResetSubmitted] = useState(false)

  const handleFillDemo = () => {
    setAuthMode("signin")
    setEmail("demo@qvera.local")
    setPassword("QveraDemo2026!")
    setErrorMsg(null)
    toast.info("Demo credentials loaded: Dr. A. Sharma (Faculty Reviewer)")
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
        setErrorMsg("Please enter both email address and password.")
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
    toast.success(`Password reset link dispatched to ${resetEmail.trim()}`)
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F9F8F3] text-[#111111] selection:bg-[#30343B]/15 selection:text-[#111111] font-sans antialiased flex flex-col justify-between">
      {/* =========================================================================
          HEADER: CLEAN ACADZA LOGO & BACK TO WEBSITE (NO NAV LINKS)
      ========================================================================= */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-[#F9F8F3] h-[64px] sm:h-[68px] flex items-center border-b border-[#E2DFD6]/60 shrink-0">
        <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-[74px] flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={onNavigateHome}
            className="cursor-pointer"
          >
            <span className="font-display font-semibold text-[23px] sm:text-[25px] tracking-tight text-[#111111]">
              QVERA
            </span>
          </div>

          {/* Right Action: Back to Website Link */}
          <button
            onClick={onNavigateHome}
            className="text-[13.5px] sm:text-[14px] font-medium text-[#555555] hover:text-[#111111] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to website</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTAINER: 2-COLUMN COMPOSITION (ALIGNED TO ACADZA LOGO PADDING)
      ========================================================================= */}
      <main className="flex-1 flex items-center justify-center py-2 sm:py-3 lg:py-4 w-full">
        <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-[74px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
          
          {/* =====================================================================
              LEFT COLUMN: MAIN HEADING "LOGIN / REGISTER" (PERFECTLY ALIGNED WITH ACADZA LOGO)
          ===================================================================== */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-2.5 pt-1 sm:pt-2">
            {/* Main Heading - Left-Aligned Exactly with Acadza Logo Padding */}
            <h1 className="font-display text-[26px] sm:text-[30px] lg:text-[34px] xl:text-[38px] font-[425] text-[#111111] leading-[1.1] tracking-[-0.5px]">
              Login / Register
            </h1>

            {/* Phone & Mathematical Proof Card Image (Moved Very Little Bit Right) */}
            <div className="relative w-full max-w-[380px] sm:max-w-[420px] lg:max-w-[450px] xl:max-w-[470px] flex items-center justify-center lg:justify-start pt-1 translate-x-1 sm:translate-x-2 lg:translate-x-3 transition-transform">
              <img
                src="/login-academic-review.png"
                alt="QVERA Mathematical Proof Mobile & Verification"
                className="w-full h-auto max-h-[380px] sm:max-h-[420px] lg:max-h-[460px] xl:max-h-[480px] object-contain block select-none pointer-events-none drop-shadow-sm"
                loading="eager"
              />
            </div>
          </div>

          {/* =====================================================================
              RIGHT COLUMN: WORKING LOGIN / SIGNUP CARD (AUTO-FILLED DEMO, COMPACT)
          ===================================================================== */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-[420px] bg-white rounded-[20px] border-[1.5px] border-[#C5C1B4] p-5 sm:p-6 shadow-xs text-left space-y-4">
              
              {/* Title & Subtext - Matched with Hero / Overall Website Typography */}
              <div className="space-y-0.5">
                <h2 className="font-display text-[19px] sm:text-[21px] font-semibold text-[#111111] tracking-[-0.5px]">
                  {authMode === "signin" ? "Sign in to QVERA" : "Create account"}
                </h2>
                <p className="text-[12.5px] leading-[1.45] text-[#555555] font-sans">
                  {authMode === "signin"
                    ? "Enter your institutional credentials to access faculty console."
                    : "Join the academic examination quality verification council."}
                </p>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[11.5px] text-[#B91C1C] flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name Field (Sign Up Only) */}
                {authMode === "signup" && (
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-medium text-[#222222] block font-sans">
                      Full Name & Academic Title
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Sarah Jenkins"
                        className="pl-9 text-[12.5px] bg-white border-[#DFDBD0] focus-visible:ring-[#111111] h-9.5 rounded-[8px] font-sans"
                        required={authMode === "signup"}
                      />
                      <User className="w-4 h-4 text-[#888888] absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Institutional Email */}
                <div className="space-y-1">
                  <label className="text-[11.5px] font-medium text-[#222222] block font-sans">
                    Institutional Email
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="faculty@institution.edu"
                      className="pl-9 text-[12.5px] bg-white border-[#DFDBD0] focus-visible:ring-[#111111] h-9.5 rounded-[8px] font-sans"
                      autoComplete="email"
                      required
                    />
                    <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11.5px] font-medium text-[#222222] block font-sans">
                      Password
                    </label>
                    {authMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email)
                          setForgotModalOpen(true)
                        }}
                        className="text-[11.5px] text-[#555555] hover:text-[#111111] underline cursor-pointer font-sans"
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
                      className="pl-9 pr-9 text-[12.5px] bg-white border-[#DFDBD0] focus-visible:ring-[#111111] h-9.5 rounded-[8px] font-sans"
                      autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                      required
                    />
                    <Lock className="w-4 h-4 text-[#888888] absolute left-3 top-2.5 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#888888] hover:text-[#111111] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox (Sign In Only) */}
                {authMode === "signin" && (
                  <div className="flex items-center justify-between text-[12px]">
                    <label className="flex items-center gap-2 cursor-pointer text-[#555555] font-sans">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-[#DFDBD0] text-[#111111] focus:ring-[#111111]"
                      />
                      <span>Keep me signed in for 30 days</span>
                    </label>
                  </div>
                )}

                {/* Submit Action Button - Matched with Hero Button Style */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[13.5px] font-medium h-[42px] rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 font-sans shadow-xs"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{authMode === "signin" ? "Verifying credentials..." : "Creating account..."}</span>
                    </div>
                  ) : (
                    <>
                      <span>{authMode === "signin" ? "Sign In to Faculty Console" : "Create Account"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Note */}
              <div className="pt-0.5 text-center text-[12.5px] text-[#555555] font-sans">
                {authMode === "signin" ? (
                  <>
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
                    <span className="block mt-1.5 text-[11.5px] text-[#777777]">
                      Roles:{" "}
                      <button type="button" onClick={handleFillDemo} className="underline hover:text-[#111111] cursor-pointer">
                        Faculty Demo
                      </button>
                      {" · "}
                      <button type="button" onClick={handleFillAdmin} className="underline hover:text-[#111111] cursor-pointer">
                        Administrator
                      </button>
                    </span>
                  </>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signin")
                        setEmail("demo@qvera.local")
                        setPassword("QveraDemo2026!")
                        setErrorMsg(null)
                      }}
                      className="font-medium text-[#111111] underline hover:text-black cursor-pointer"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          FOOTER COPYRIGHT ROW (INCREASED SIZE, ALIGNED TO ACADZA LOGO PADDING)
      ========================================================================= */}
      <footer className="w-full py-3.5 sm:py-4 border-t border-[#E2DFD6] text-center text-[13px] sm:text-[13.5px] font-medium text-[#555555] font-sans shrink-0">
        <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-[74px] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <p>© 2026 QVERA Systems. All rights reserved.</p>
          <div className="flex items-center gap-4 sm:gap-6 text-[#666666]">
            <span className="hover:text-[#111111] transition-colors cursor-pointer">Security Policy</span>
            <span>•</span>
            <span className="hover:text-[#111111] transition-colors cursor-pointer">Taxonomy Governance</span>
            <span>•</span>
            <span className="hover:text-[#111111] transition-colors cursor-pointer">Referential Integrity</span>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          FORGOT PASSWORD MODAL
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
                <label className="text-xs font-medium text-[#222222] block">
                  Institutional Email
                </label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="faculty@institution.edu"
                  className="text-xs bg-white border-[#DFDBD0] h-10 rounded-[8px]"
                  required
                />
              </div>

              <div className="p-3 bg-[#F9F8F3] rounded-[12px] border border-[#E5E2D9] text-[11px] text-[#666666]">
                <strong>Security Policy:</strong> For production faculty accounts, reset tokens expire after 15 minutes and require secondary department verification.
              </div>

              <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="border border-[#CECECE] hover:border-[#B5B5B5] text-[#111111] text-xs font-medium px-3.5 h-9 rounded-[8px] hover:bg-black/[0.04] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0B0F12] hover:bg-[#1f2328] text-white text-xs font-medium px-4 h-9 rounded-[8px] transition-all cursor-pointer active:scale-[0.98]"
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
