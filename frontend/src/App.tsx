import React, { useState, useEffect, useMemo } from "react"
import { AppLayout, type NavTab } from "@/layouts/AppLayout"
import { OverviewPage } from "@/pages/OverviewPage"
import { ReviewQueuePage } from "@/pages/ReviewQueuePage"
import { QuestionsPage } from "@/pages/QuestionsPage"
import { ActivityPage } from "@/pages/ActivityPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { ReviewWorkspacePage } from "@/pages/ReviewWorkspacePage"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { Toaster, toast } from "sonner"

function MainRouter() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  // Track browser pathname
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || "/"
  })

  // Synchronize history state
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/")
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, "", path)
      setCurrentPath(path)
      window.scrollTo(0, 0)
    }
  }

  // Active workspace state
  const [activeReportId, setActiveReportId] = useState<string>("R001")
  const [pendingCount, setPendingCount] = useState<number>(10)
  const [globalSearch, setGlobalSearch] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Derive active tab from URL path
  const currentTab: NavTab = useMemo(() => {
    if (currentPath.startsWith("/dashboard/workspace")) return "workspace"
    if (currentPath.startsWith("/dashboard/queue") || currentPath.startsWith("/dashboard/review")) return "queue"
    if (currentPath.startsWith("/dashboard/questions")) return "questions"
    if (currentPath.startsWith("/dashboard/activity")) return "activity"
    if (currentPath.startsWith("/dashboard/settings")) return "settings"
    return "overview"
  }, [currentPath])

  // Extract report ID from URL if workspace path (e.g. /dashboard/workspace/R004)
  useEffect(() => {
    if (currentPath.startsWith("/dashboard/workspace/")) {
      const parts = currentPath.split("/dashboard/workspace/")
      if (parts[1] && parts[1].trim()) {
        setActiveReportId(parts[1].trim())
      }
    }
  }, [currentPath])

  // Fetch live overview statistics for notifications and queue count
  const refreshPendingCount = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/v1/faculty/overview")
      if (res.ok) {
        const data = await res.json()
        if (data && typeof data.pending_faculty_reviews === "number") {
          setPendingCount(data.pending_faculty_reviews)
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && currentPath.startsWith("/dashboard")) {
      refreshPendingCount()
    }
  }, [currentPath, isAuthenticated])

  const handleSelectReport = (reportId: string) => {
    setActiveReportId(reportId)
    navigate(`/dashboard/workspace/${reportId}`)
  }

  const handleTabChange = (tab: NavTab) => {
    if (tab === "workspace") {
      navigate(`/dashboard/workspace/${activeReportId}`)
    } else if (tab === "overview") {
      navigate("/dashboard")
    } else {
      navigate(`/dashboard/${tab}`)
    }
  }

  const handleGlobalSearch = (val: string) => {
    setGlobalSearch(val)
    if (val && currentTab !== "queue" && currentTab !== "questions") {
      navigate("/dashboard/queue")
    }
  }

  const handleRefresh = async () => {
    await refreshPendingCount()
    toast.success("Live operational data refreshed.")
  }

  const handleLogout = async () => {
    await logout()
    toast.info("Signed out from faculty console.")
    navigate("/login")
  }

  // Route 1: Public Landing Page
  if (currentPath === "/" || currentPath === "/home") {
    return (
      <LandingPage
        onNavigateToLogin={() => navigate("/login")}
        onNavigateToDashboard={() => navigate("/dashboard")}
        isAuthenticated={isAuthenticated}
      />
    )
  }

  // Route 2: Login Page
  if (currentPath === "/login") {
    // If already authenticated, redirect straight to dashboard
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard")
      return null
    }
    return (
      <LoginPage
        onLoginSuccess={() => navigate("/dashboard")}
        onNavigateHome={() => navigate("/")}
      />
    )
  }

  // Route 3: Protected Faculty Dashboard (/dashboard/*)
  if (currentPath.startsWith("/dashboard")) {
    // Loading splash screen while checking session
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-600/30 animate-pulse">
              A
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Verifying faculty session...</span>
            </div>
          </div>
        </div>
      )
    }

    // Protection Guard: If unauthenticated, redirect to /login
    if (!isAuthenticated) {
      navigate("/login")
      return null
    }

    // Authenticated Dashboard Layout
    return (
      <AppLayout
        currentTab={currentTab}
        onTabChange={handleTabChange}
        pendingCount={pendingCount}
        activeReportId={activeReportId}
        onSearchChange={handleGlobalSearch}
        searchValue={globalSearch}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        userName={user?.name || "Dr. A. Sharma"}
        userEmail={user?.email || "demo@acadza.local"}
        onLogout={handleLogout}
        onNavigateHome={() => navigate("/")}
      >
        {currentTab === "overview" && (
          <OverviewPage
            onNavigateToWorkspace={handleSelectReport}
            onNavigateToQueue={() => navigate("/dashboard/queue")}
          />
        )}

        {currentTab === "queue" && (
          <ReviewQueuePage
            onSelectReport={handleSelectReport}
            initialSearch={globalSearch}
          />
        )}

        {currentTab === "questions" && (
          <QuestionsPage
            onInspectQuestionReports={handleSelectReport}
          />
        )}

        {currentTab === "activity" && (
          <ActivityPage onSelectReport={handleSelectReport} />
        )}

        {currentTab === "settings" && <SettingsPage />}

        {currentTab === "workspace" && (
          <ReviewWorkspacePage
            reportId={activeReportId}
            onBackToQueue={() => navigate("/dashboard/queue")}
          />
        )}
      </AppLayout>
    )
  }

  // Fallback: If unknown path, route to home or dashboard
  if (isAuthenticated) {
    navigate("/dashboard")
  } else {
    navigate("/")
  }
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#111827",
            border: "1px solid #E5E7EB",
            fontSize: "13px",
            fontWeight: "500",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08)",
          },
        }}
      />
    </AuthProvider>
  )
}
