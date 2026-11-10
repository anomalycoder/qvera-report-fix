import React, { useState } from 'react'
import { DashboardLayout, type NavTab } from '@/layouts/DashboardLayout'
import { FacultyConsolePage } from '@/pages/FacultyConsolePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AuditLedgerPage } from '@/pages/AuditLedgerPage'

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('faculty')

  return (
    <DashboardLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'faculty' && <FacultyConsolePage />}
      {currentTab === 'analytics' && <DashboardPage />}
      {currentTab === 'audit' && <AuditLedgerPage />}
    </DashboardLayout>
  )
}
