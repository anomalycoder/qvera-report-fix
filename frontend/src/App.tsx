import React, { useState, useEffect } from "react"
import { AppLayout, type NavTab } from "@/layouts/AppLayout"
import { OverviewPage } from "@/pages/OverviewPage"
import { ReviewQueuePage } from "@/pages/ReviewQueuePage"
import { QuestionsPage } from "@/pages/QuestionsPage"
import { ActivityPage } from "@/pages/ActivityPage"
import { ReviewWorkspacePage } from "@/pages/ReviewWorkspacePage"
import { Toaster } from "sonner"

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("overview")
  const [activeReportId, setActiveReportId] = useState<string>("R001")
  const [pendingCount, setPendingCount] = useState<number>(10)
  const [globalSearch, setGlobalSearch] = useState<string>("")

  // Fetch live overview statistics to populate notifications and badge counter
  const refreshPendingCount = () => {
    fetch("/api/v1/faculty/overview")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.pending_faculty_reviews === "number") {
          setPendingCount(data.pending_faculty_reviews)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    refreshPendingCount()
  }, [currentTab])

  const handleSelectReport = (reportId: string) => {
    setActiveReportId(reportId)
    setCurrentTab("workspace")
  }

  return (
    <>
      <AppLayout
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingCount={pendingCount}
        activeReportId={activeReportId}
        onSearchChange={setGlobalSearch}
        searchValue={globalSearch}
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

        {currentTab === "activity" && <ActivityPage />}

        {currentTab === "workspace" && (
          <ReviewWorkspacePage
            reportId={activeReportId}
            onBackToQueue={() => setCurrentTab("queue")}
          />
        )}
      </AppLayout>

      {/* Modern, restrained toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          },
        }}
      />
    </>
  )
}
