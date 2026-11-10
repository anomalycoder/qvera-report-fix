import React, { useState, useEffect } from "react"
import { AppLayout, type NavTab } from "@/layouts/AppLayout"
import { OverviewPage } from "@/pages/OverviewPage"
import { ReviewQueuePage } from "@/pages/ReviewQueuePage"
import { QuestionsPage } from "@/pages/QuestionsPage"
import { ActivityPage } from "@/pages/ActivityPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { ReviewWorkspacePage } from "@/pages/ReviewWorkspacePage"
import { Toaster, toast } from "sonner"

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("overview")
  const [activeReportId, setActiveReportId] = useState<string>("R001")
  const [pendingCount, setPendingCount] = useState<number>(10)
  const [globalSearch, setGlobalSearch] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch live overview statistics to populate notifications and badge counter
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
      // ignore
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    refreshPendingCount()
  }, [currentTab])

  const handleSelectReport = (reportId: string) => {
    setActiveReportId(reportId)
    setCurrentTab("workspace")
  }

  const handleGlobalSearch = (val: string) => {
    setGlobalSearch(val)
    if (val && currentTab !== "queue" && currentTab !== "questions") {
      setCurrentTab("queue")
    }
  }

  const handleRefresh = async () => {
    await refreshPendingCount()
    toast.success("Live operational data refreshed.")
  }

  return (
    <>
      <AppLayout
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingCount={pendingCount}
        activeReportId={activeReportId}
        onSearchChange={handleGlobalSearch}
        searchValue={globalSearch}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      >
        {currentTab === "overview" && (
          <OverviewPage
            onNavigateToWorkspace={handleSelectReport}
            onNavigateToQueue={() => setCurrentTab("queue")}
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
            onBackToQueue={() => setCurrentTab("queue")}
          />
        )}
      </AppLayout>

      {/* Vercel-style clean notifications */}
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
    </>
  )
}
