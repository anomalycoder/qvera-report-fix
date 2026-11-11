import React, { useState, useEffect, useMemo } from "react"
import { AppLayout, type NavTab } from "@/layouts/AppLayout"
import { OverviewPage, type QueueNavigationPreset } from "@/pages/OverviewPage"
import { ReviewQueuePage } from "@/pages/ReviewQueuePage"
import { ReviewWorkspacePage } from "@/pages/ReviewWorkspacePage"
import { FacultyAnalyticsPage } from "@/pages/FacultyAnalyticsPage"
import { AuditLedgerPage } from "@/pages/AuditLedgerPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { Toaster, toast } from "sonner"

function MainRouter() {
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useAuth()

  // Track browser pathname
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || "/"
  })

  // Synchronize history state and route aliases
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/")
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  // Support /faculty/* alias routes
  useEffect(() => {
    if (currentPath === "/faculty" || currentPath === "/faculty/dashboard") {
      navigate("/dashboard")
    } else if (currentPath === "/faculty/login") {
      navigate("/login")
    } else if (currentPath === "/faculty/reviews" || currentPath === "/faculty/queue") {
      navigate("/dashboard/queue")
    } else if (currentPath.startsWith("/faculty/investigation/")) {
      const parts = currentPath.split("/faculty/investigation/")
      if (parts[1] && parts[1].trim()) {
        navigate(`/dashboard/workspace/${parts[1].trim()}`)
      }
    } else if (currentPath === "/faculty/analytics") {
      navigate("/dashboard/analytics")
    } else if (currentPath === "/faculty/audit") {
      navigate("/dashboard/audit")
    }
  }, [currentPath])

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
  const [queuePreset, setQueuePreset] = useState<QueueNavigationPreset | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Derive active tab from URL path
  const currentTab: NavTab = useMemo(() => {
    if (currentPath.startsWith("/dashboard/workspace")) return "workspace"
    if (currentPath.startsWith("/dashboard/queue") || currentPath.startsWith("/dashboard/review")) return "queue"
    if (currentPath.startsWith("/dashboard/analytics")) return "analytics"
    if (currentPath.startsWith("/dashboard/audit")) return "audit"
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

  useEffect(() => {
    if (!isAuthenticated) return
    const onFacultyAction = () => {
      refreshPendingCount()
    }
    window.addEventListener("qvera:faculty-action", onFacultyAction)
    return () => window.removeEventListener("qvera:faculty-action", onFacultyAction)
  }, [isAuthenticated])

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
    if (val && currentTab !== "queue") {
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
    navigate("/")
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
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#F9F8F3] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="font-display font-semibold text-[24px] tracking-tight text-[#111111]">
              QVERA
            </span>
            <div className="flex items-center gap-2 text-xs text-[#666666] font-mono">
              <div className="w-3.5 h-3.5 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
              <span>Verifying faculty session...</span>
            </div>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      navigate("/login")
      return null
    }

    return (
      <AppLayout
        currentTab={currentTab}
        onTabChange={handleTabChange}
        pendingCount={pendingCount}
        onPendingCountChange={setPendingCount}
        activeReportId={activeReportId}
        onSelectReport={handleSelectReport}
        onSearchChange={handleGlobalSearch}
        searchValue={globalSearch}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        userName={user?.name || "Dr. A. Sharma"}
        userEmail={user?.email || "demo@qvera.local"}
        userRole={user?.role || "faculty"}
        onUpdateProfile={updateProfile}
        onLogout={handleLogout}
        onNavigateHome={() => navigate("/")}
      >
        <ErrorBoundary fallbackTitle="Error loading dashboard view">
          {currentTab === "overview" && (
            <OverviewPage
              onNavigateToWorkspace={handleSelectReport}
              onNavigateToQueue={(preset) => {
                setQueuePreset(preset || null)
                navigate("/dashboard/queue")
              }}
              onNavigateToAudit={() => navigate("/dashboard/audit")}
              onNavigateToSettings={() => navigate("/dashboard/settings")}
            />
          )}

          {currentTab === "queue" && (
            <ReviewQueuePage
              onSelectReport={handleSelectReport}
              initialSearch={globalSearch}
              initialPreset={queuePreset}
              facultyName={user?.name || "Dr. A. Sharma"}
            />
          )}

          {currentTab === "workspace" && (
            <ReviewWorkspacePage
              reportId={activeReportId}
              onBackToQueue={() => navigate("/dashboard/queue")}
              onSelectReport={handleSelectReport}
              facultyName={user?.name || "Dr. A. Sharma"}
            />
          )}

          {currentTab === "analytics" && (
            <FacultyAnalyticsPage
              onNavigateToQueue={(preset) => {
                setQueuePreset(preset || null)
                navigate("/dashboard/queue")
              }}
              onNavigateToWorkspace={handleSelectReport}
            />
          )}

          {currentTab === "audit" && <AuditLedgerPage />}

          {currentTab === "settings" && <SettingsPage />}
        </ErrorBoundary>
      </AppLayout>
    )
  }

  // Fallback
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
            background: "#FFFFFF",
            color: "#111111",
            border: "1px solid #C5C1B4",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "500",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          },
        }}
      />
    </AuthProvider>
  )
}
