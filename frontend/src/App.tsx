import React, { useState, useEffect } from 'react'
import { FacultyLayout, type FacultyNavTab } from '@/layouts/FacultyLayout'
import { FacultyOverviewPage } from '@/pages/FacultyOverviewPage'
import { FacultyQueuePage } from '@/pages/FacultyQueuePage'
import { FacultyWorkspacePage } from '@/pages/FacultyWorkspacePage'
import { FacultyAnalyticsPage } from '@/pages/FacultyAnalyticsPage'
import { FacultySettingsPage } from '@/pages/FacultySettingsPage'
import { AuditLedgerPage } from '@/pages/AuditLedgerPage'
import { DashboardPage } from '@/pages/DashboardPage'

export default function App() {
  const [currentTab, setCurrentTab] = useState<FacultyNavTab>('overview')
  const [selectedReportId, setSelectedReportId] = useState<string>('R001')
  const [pendingCount, setPendingCount] = useState<number>(10)

  // Fetch live overview statistics to populate notifications and badge counter
  useEffect(() => {
    fetch('/api/v1/faculty/overview')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.pending_faculty_reviews === 'number') {
          setPendingCount(data.pending_faculty_reviews)
        }
      })
      .catch(() => {})
  }, [currentTab])

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId)
    setCurrentTab('workspace')
  }

  return (
    <FacultyLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      pendingReviewsCount={pendingCount}
    >
      {currentTab === 'overview' && (
        <FacultyOverviewPage
          onNavigateToWorkspace={handleSelectReport}
          onNavigateToQueue={() => setCurrentTab('queue')}
        />
      )}

      {currentTab === 'queue' && (
        <FacultyQueuePage onSelectReport={handleSelectReport} />
      )}

      {currentTab === 'workspace' && (
        <FacultyWorkspacePage
          reportId={selectedReportId}
          onBackToQueue={() => setCurrentTab('queue')}
        />
      )}

      {currentTab === 'auto_applied' && (
        <FacultyQueuePage onSelectReport={handleSelectReport} />
      )}

      {currentTab === 'reports' && (
        <FacultyQueuePage onSelectReport={handleSelectReport} />
      )}

      {currentTab === 'questions' && <DashboardPage />}

      {currentTab === 'audit' && <AuditLedgerPage />}

      {currentTab === 'analytics' && <FacultyAnalyticsPage />}

      {currentTab === 'settings' && <FacultySettingsPage />}
    </FacultyLayout>
  )
}
