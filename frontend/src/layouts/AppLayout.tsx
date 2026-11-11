import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import {
  Home,
  FolderKanban,
  FileText,
  LayoutGrid,
  Users,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Menu,
  X,
  ExternalLink,
  LogOut,
  SlidersHorizontal,
  User as UserIcon,
  CheckCheck,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

export type NavTab = "overview" | "queue" | "workspace" | "analytics" | "audit" | "settings"

interface LiveNotification {
  id: number
  report_id?: string | null
  question_id?: string | null
  title: string
  message: string
  category: string
  urgency?: string | null
  target_tab: NavTab
  is_read: boolean
  created_at?: string | null
}

interface SearchReportHit {
  report_id: string
  question_id: string
  subject: string
  chapter: string
  question_type: string
  verdict: string
  repair_type?: string | null
  urgency_level: string
  urgency_label: string
  review_status: string
  comment_preview: string
  stem_preview: string
  confidence: number
}

interface SearchAuditHit {
  id: number
  report_id: string
  question_id: string
  action: string
  faculty_name: string
  notes: string
  created_at?: string | null
}

interface AppLayoutProps {
  children: React.ReactNode
  currentTab: NavTab
  onTabChange: (tab: NavTab) => void
  pendingCount?: number
  onPendingCountChange?: (count: number) => void
  activeReportId?: string | null
  onSelectReport?: (reportId: string) => void
  onSearchChange?: (val: string) => void
  searchValue?: string
  onRefresh?: () => void
  isRefreshing?: boolean
  userName?: string
  userEmail?: string
  userRole?: string
  onUpdateProfile?: (name: string) => Promise<{ success: boolean; error?: string }>
  onLogout?: () => void
  onNavigateHome?: () => void
}

function formatRelativeTime(isoOrSqlTs?: string | null): string {
  if (!isoOrSqlTs) return "Just now"
  const normalized = isoOrSqlTs.includes("T") ? isoOrSqlTs : `${isoOrSqlTs.replace(" ", "T")}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return "Just now"
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (diffSec < 15) return "Just now"
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  pendingCount = 10,
  onPendingCountChange,
  onSelectReport,
  onSearchChange,
  searchValue = "",
  userName = "Dr. A. Sharma",
  userEmail = "demo@qvera.local",
  userRole = "faculty",
  onUpdateProfile,
  onLogout,
  onNavigateHome,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Top-right interactive popovers & modals
  const [headerProfileOpen, setHeaderProfileOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileNameInput, setProfileNameInput] = useState(userName)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Real-time notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<LiveNotification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [sseConnected, setSseConnected] = useState<boolean>(false)
  const [scanningQueue, setScanningQueue] = useState<boolean>(false)
  const [bellPulse, setBellPulse] = useState<boolean>(false)

  // Expandable Command Search ("it will become big with command keys")
  const [searchOpen, setSearchOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState(searchValue)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchReports, setSearchReports] = useState<SearchReportHit[]>([])
  const [searchAudits, setSearchAudits] = useState<SearchAuditHit[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultListRef = useRef<HTMLDivElement>(null)

  const isMac = useMemo(() => {
    if (typeof navigator === "undefined") return false
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
  }, [])

  useEffect(() => {
    setProfileNameInput(userName)
  }, [userName])

  // Navigation Items matching QVERA workspace structure
  const navItems = useMemo(
    () => [
      { id: "overview" as NavTab, label: "Overview", icon: Home, shortcut: "G O" },
      { id: "queue" as NavTab, label: "Review Queue", icon: FolderKanban, badge: pendingCount, shortcut: "G Q" },
      { id: "workspace" as NavTab, label: "Investigation", icon: FileText, shortcut: "G I" },
      { id: "analytics" as NavTab, label: "Analytics", icon: LayoutGrid, shortcut: "G N" },
      { id: "audit" as NavTab, label: "Audit Ledger", icon: Users, shortcut: "G L" },
      { id: "settings" as NavTab, label: "Settings", icon: Settings, shortcut: "G S" },
    ],
    [pendingCount]
  )

  const getPageTitle = () => {
    switch (currentTab) {
      case "overview":
        return "Overview"
      case "queue":
        return "Review Queue"
      case "workspace":
        return "Investigation Workspace"
      case "analytics":
        return "Analytics & Defect Intelligence"
      case "audit":
        return "Audit Ledger"
      case "settings":
        return "Taxonomy Settings"
      default:
        return "Overview"
    }
  }

  const getInitials = (nameStr: string) => {
    const cleaned = nameStr.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, "").trim()
    const parts = cleaned.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return (cleaned.slice(0, 2) || "AS").toUpperCase()
  }

  const userInitials = getInitials(userName)

  // ============================================================================
  // REAL-TIME NOTIFICATIONS (REST + Server-Sent Events Stream)
  // ============================================================================
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/faculty/notifications?limit=25")
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.items)) {
        setNotifications(data.items)
      }
      if (typeof data.unread_count === "number") {
        setUnreadCount(data.unread_count)
      }
      if (typeof data.pending_count === "number") {
        onPendingCountChange?.(data.pending_count)
      }
    } catch {
      // network silent retry
    }
  }, [onPendingCountChange])

  useEffect(() => {
    fetchNotifications()

    let eventSource: EventSource | null = null
    if (typeof EventSource !== "undefined") {
      eventSource = new EventSource("/api/v1/faculty/notifications/stream")

      eventSource.onopen = () => {
        setSseConnected(true)
      }

      eventSource.addEventListener("state", (ev: MessageEvent) => {
        setSseConnected(true)
        try {
          const payload = JSON.parse(ev.data)
          if (typeof payload.unread_count === "number") {
            setUnreadCount(payload.unread_count)
          }
          if (typeof payload.pending_count === "number") {
            onPendingCountChange?.(payload.pending_count)
          }
          if (payload.type === "read_all") {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
          } else if (typeof payload.read_id === "number") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.read_id ? { ...n, is_read: true } : n))
            )
          }
        } catch {
          // ignore malformed heartbeat
        }
      })

      eventSource.addEventListener("notification", (ev: MessageEvent) => {
        setSseConnected(true)
        try {
          const payload = JSON.parse(ev.data)
          if (payload.notification) {
            const incoming: LiveNotification = payload.notification
            setNotifications((prev) => {
              const filtered = prev.filter((item) => item.id !== incoming.id)
              return [incoming, ...filtered].slice(0, 30)
            })
            setBellPulse(true)
            setTimeout(() => setBellPulse(false), 1800)
          }
          if (typeof payload.unread_count === "number") {
            setUnreadCount(payload.unread_count)
          }
          if (typeof payload.pending_count === "number") {
            onPendingCountChange?.(payload.pending_count)
          }
        } catch {
          // ignore parse error
        }
      })

      eventSource.onerror = () => {
        setSseConnected(false)
      }
    }

    const handleLocalAction = () => {
      fetchNotifications()
    }
    window.addEventListener("qvera:faculty-action", handleLocalAction)

    // Resilient fallback sync interval
    const fallbackTimer = window.setInterval(fetchNotifications, 20000)

    return () => {
      if (eventSource) eventSource.close()
      window.removeEventListener("qvera:faculty-action", handleLocalAction)
      window.clearInterval(fallbackTimer)
    }
  }, [fetchNotifications, onPendingCountChange])

  const handleMarkNotificationRead = async (item: LiveNotification) => {
    if (!item.is_read) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
      try {
        await fetch(`/api/v1/faculty/notifications/${item.id}/read`, { method: "POST" })
      } catch {
        // ignore network hiccup
      }
    }
    setNotificationsOpen(false)
    if (item.report_id && item.target_tab === "workspace" && onSelectReport) {
      onSelectReport(item.report_id)
    } else if (item.target_tab) {
      onTabChange(item.target_tab)
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    try {
      await fetch("/api/v1/faculty/notifications/read-all", { method: "POST" })
    } catch {
      // ignore
    }
  }

  const handleRunLiveScan = async () => {
    setScanningQueue(true)
    try {
      const res = await fetch("/api/v1/faculty/notifications/scan", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        if (data?.notification) {
          toast.info(data.notification.title)
        }
      }
    } catch {
      toast.error("Unable to run live queue scan.")
    } finally {
      setScanningQueue(false)
    }
  }

  // ============================================================================
  // GLOBAL KEYBOARD SHORTCUTS (Cmd/Ctrl+K or '/' -> Expand Big Search, Esc)
  // ============================================================================
  const openBigSearch = useCallback(() => {
    setHeaderProfileOpen(false)
    setNotificationsOpen(false)
    setSearchOpen(true)
    setSelectedIndex(0)
    requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((prev) => {
          const next = !prev
          if (next) {
            setHeaderProfileOpen(false)
            setNotificationsOpen(false)
            setSelectedIndex(0)
            requestAnimationFrame(() => searchInputRef.current?.focus())
          }
          return next
        })
        return
      }

      if (e.key === "/" && !searchOpen && !profileModalOpen) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        const isEditable =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          (e.target as HTMLElement)?.isContentEditable
        if (!isEditable) {
          e.preventDefault()
          openBigSearch()
        }
        return
      }

      if (e.key === "Escape") {
        setHeaderProfileOpen(false)
        setNotificationsOpen(false)
        setSearchOpen(false)
        setProfileModalOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchOpen, profileModalOpen, openBigSearch])

  // Close popovers cleanly on outside click
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (!target.closest("[data-popover-notifications]")) {
        setNotificationsOpen(false)
      }
      if (!target.closest("[data-popover-profile]")) {
        setHeaderProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  // ============================================================================
  // LIVE SEARCH FETCHING (Debounced query against /api/v1/faculty/search)
  // ============================================================================
  useEffect(() => {
    if (!searchOpen) return
    let active = true
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(
          `/api/v1/faculty/search?q=${encodeURIComponent(commandQuery.trim())}&limit=8`
        )
        if (!res.ok || !active) return
        const data = await res.json()
        if (!active) return
        setSearchReports(Array.isArray(data.reports) ? data.reports : [])
        setSearchAudits(Array.isArray(data.audits) ? data.audits : [])
        setSelectedIndex(0)
      } catch {
        // silent fallback
      } finally {
        if (active) setSearchLoading(false)
      }
    }, 110)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [commandQuery, searchOpen])

  // Unified selectable actions list for arrow keys + Enter inside Command Search
  type CommandActionItem = {
    key: string
    group: "queue_action" | "report" | "audit" | "nav"
    label: string
    sublabel?: string
    badge?: string
    run: () => void
  }

  const commandActions = useMemo<CommandActionItem[]>(() => {
    const items: CommandActionItem[] = []
    const q = commandQuery.trim()

    if (q) {
      items.push({
        key: "filter-queue",
        group: "queue_action",
        label: `Filter Review Queue for "${q}"`,
        sublabel: "Open matching rows in Review Queue table",
        badge: "Queue",
        run: () => {
          onSearchChange?.(q)
          onTabChange("queue")
          setSearchOpen(false)
        },
      })
    }

    searchReports.forEach((r) => {
      items.push({
        key: `report-${r.report_id}`,
        group: "report",
        label: `${r.report_id} · ${r.subject} — ${r.chapter}`,
        sublabel: r.comment_preview || r.stem_preview || r.question_id,
        badge: `${r.urgency_level} ${r.urgency_label}`,
        run: () => {
          setSearchOpen(false)
          if (onSelectReport) onSelectReport(r.report_id)
          else onTabChange("workspace")
        },
      })
    })

    searchAudits.forEach((a) => {
      items.push({
        key: `audit-${a.id}`,
        group: "audit",
        label: `${a.action.toUpperCase()} · ${a.report_id} (${a.question_id})`,
        sublabel: `${a.faculty_name} — ${a.notes || "Audit ledger record"}`,
        badge: "Audit",
        run: () => {
          setSearchOpen(false)
          onTabChange("audit")
        },
      })
    })

    const qLower = q.toLowerCase()
    const quickNavs: Array<{ id: string; label: string; sublabel: string; run: () => void }> = [
      ...navItems.map((n) => ({
        id: `nav-${n.id}`,
        label: n.label,
        sublabel: `Jump to ${n.label}`,
        run: () => {
          onTabChange(n.id)
          setSearchOpen(false)
        },
      })),
      {
        id: "nav-profile",
        label: "Faculty Profile & Account",
        sublabel: `Edit display name or manage session (${userEmail})`,
        run: () => {
          setSearchOpen(false)
          setProfileError(null)
          setProfileNameInput(userName)
          setProfileModalOpen(true)
        },
      },
      {
        id: "nav-notifications",
        label: "Live Notification Feed",
        sublabel: "View real-time triage alerts and recent actions",
        run: () => {
          setSearchOpen(false)
          setNotificationsOpen(true)
        },
      },
    ]

    quickNavs.forEach((nv) => {
      if (!qLower || nv.label.toLowerCase().includes(qLower) || nv.sublabel.toLowerCase().includes(qLower)) {
        items.push({
          key: nv.id,
          group: "nav",
          label: nv.label,
          sublabel: nv.sublabel,
          badge: "Jump",
          run: nv.run,
        })
      }
    })

    return items
  }, [commandQuery, searchReports, searchAudits, navItems, userEmail, userName, onSearchChange, onTabChange, onSelectReport])

  const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (commandActions.length > 0 ? (prev + 1) % commandActions.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        commandActions.length > 0 ? (prev - 1 + commandActions.length) % commandActions.length : 0
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      const chosen = commandActions[selectedIndex]
      if (chosen) {
        chosen.run()
      } else if (commandQuery.trim()) {
        onSearchChange?.(commandQuery.trim())
        onTabChange("queue")
        setSearchOpen(false)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setSearchOpen(false)
    }
  }

  useEffect(() => {
    if (!searchOpen || !resultListRef.current) return
    const activeEl = resultListRef.current.querySelector(`[data-search-index="${selectedIndex}"]`)
    if (activeEl instanceof HTMLElement) {
      activeEl.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex, searchOpen])

  // ============================================================================
  // PROFILE MODAL SUBMIT HANDLER
  // ============================================================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onUpdateProfile) {
      setProfileModalOpen(false)
      return
    }
    setProfileSaving(true)
    setProfileError(null)
    const res = await onUpdateProfile(profileNameInput)
    setProfileSaving(false)
    if (!res.success) {
      setProfileError(res.error || "Unable to update profile.")
      return
    }
    toast.success("Profile updated.")
    setProfileModalOpen(false)
  }

  // Reusable notifications popover card
  const renderNotificationsPopover = (alignClass = "right-0 mt-2") => (
    <div
      className={`absolute ${alignClass} w-[330px] sm:w-[375px] bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] shadow-xl p-3.5 z-50 text-xs`}
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E2D9] gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[13px] text-[#111111] font-sans">Notifications</span>
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
              sseConnected
                ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]"
                : "bg-[#EFECE6] text-[#666666] border-[#DFDBD0]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sseConnected ? "bg-[#16A34A] animate-pulse" : "bg-[#888888]"
              }`}
            />
            {sseConnected ? "Live" : "Sync"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRunLiveScan}
            disabled={scanningQueue}
            title="Scan queue & push real-time alert"
            className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#111111] bg-[#EFECE6] hover:bg-[#EAE7DC] border border-[#DFDBD0] px-2 py-1 rounded-[7px] cursor-pointer transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${scanningQueue ? "animate-spin" : ""}`} />
            <span>Scan</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#555555] hover:text-[#111111] px-2 py-1 rounded-[7px] hover:bg-[#F9F8F3] cursor-pointer transition-colors"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Mark read</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-[#666666] space-y-1">
            <Bell className="w-5 h-5 mx-auto text-[#888888]" />
            <p className="text-[12px] font-medium text-[#111111]">All caught up</p>
            <p className="text-[11px] text-[#777777]">Real-time defect alerts and actions appear here.</p>
          </div>
        ) : (
          notifications.map((item) => {
            const isCritical = item.urgency === "L1"
            const isAction = item.category === "faculty_action"
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMarkNotificationRead(item)}
                className={`w-full text-left p-2.5 rounded-[12px] border transition-colors cursor-pointer flex items-start gap-2.5 ${
                  item.is_read
                    ? "bg-white hover:bg-[#F9F8F3] border-transparent hover:border-[#E5E2D9]"
                    : "bg-[#F9F8F3] hover:bg-[#EFECE6] border-[#E5E2D9]"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                    isCritical
                      ? "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
                      : isAction
                      ? "bg-[#ECFDF3] text-[#15803D] border-[#D1FADF]"
                      : "bg-[#EFECE6] text-[#111111] border-[#DFDBD0]"
                  }`}
                >
                  {isCritical ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : isAction ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : item.category === "escalation" ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[12px] text-[#111111] truncate font-sans">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[#888888] font-mono shrink-0">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#666666] leading-snug line-clamp-2 font-sans">
                    {item.message}
                  </p>
                </div>

                {!item.is_read && (
                  <span className="w-2 h-2 rounded-full bg-[#111111] shrink-0 mt-1.5" />
                )}
              </button>
            )
          })
        )}
      </div>

      <div className="pt-2.5 mt-2 border-t border-[#E5E2D9] flex items-center justify-between text-[11px] text-[#666666]">
        <span>{pendingCount} pending in review queue</span>
        <button
          type="button"
          onClick={() => {
            setNotificationsOpen(false)
            onTabChange("queue")
          }}
          className="font-medium text-[#111111] hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Open Queue</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )

  // Reusable profile popover menu
  const renderProfilePopover = (alignClass = "right-0 mt-2") => (
    <div
      className={`absolute ${alignClass} w-64 bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] shadow-xl p-2 z-50 text-xs space-y-1`}
    >
      <div className="p-2.5 rounded-[10px] bg-[#F9F8F3] border border-[#E5E2D9] flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-[#0B0F12] text-[#F9F8F3] flex items-center justify-center text-[11px] font-semibold shrink-0 font-sans">
          {userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[12.5px] text-[#111111] truncate font-sans">
              {userName}
            </span>
          </div>
          <div className="text-[11px] text-[#666666] font-mono truncate">{userEmail}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#EFECE6] text-[#222222] border border-[#DFDBD0]">
            <ShieldCheck className="w-2.5 h-2.5 text-[#16A34A]" />
            <span>{userRole}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setHeaderProfileOpen(false)
          setProfileError(null)
          setProfileNameInput(userName)
          setProfileModalOpen(true)
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] hover:bg-[#F9F8F3] text-[#333333] hover:text-[#111111] transition-colors text-left cursor-pointer font-sans font-medium"
      >
        <UserIcon className="w-3.5 h-3.5 text-[#555555]" />
        <span>My Profile & Account</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setHeaderProfileOpen(false)
          onTabChange("settings")
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] hover:bg-[#F9F8F3] text-[#333333] hover:text-[#111111] transition-colors text-left cursor-pointer font-sans font-medium"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#555555]" />
        <span>Taxonomy Settings</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setHeaderProfileOpen(false)
          onNavigateHome?.()
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] hover:bg-[#F9F8F3] text-[#333333] hover:text-[#111111] transition-colors text-left cursor-pointer font-sans font-medium"
      >
        <ExternalLink className="w-3.5 h-3.5 text-[#555555]" />
        <span>Public Landing Page</span>
      </button>

      <div className="pt-1 border-t border-[#E5E2D9]">
        <button
          type="button"
          onClick={() => {
            setHeaderProfileOpen(false)
            onLogout?.()
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] hover:bg-[#FEF2F2] text-[#B91C1C] transition-colors text-left font-medium cursor-pointer font-sans"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F9F8F3] text-[#111111] flex flex-col md:flex-row antialiased selection:bg-[#30343B]/15 selection:text-[#111111] font-sans">
      {/* =========================================================================
          DESKTOP SIDEBAR: CLEAN NAVIGATION ONLY (PROFILE REMOVED FROM LEFT PANEL)
      ========================================================================= */}
      <aside className="hidden md:flex flex-col w-[230px] lg:w-[245px] bg-[#F9F8F3] border-r border-[#E2DFD6] select-none shrink-0 h-screen sticky top-0">
        {/* Logo Header */}
        <div className="px-7 pt-7 pb-6">
          <button
            type="button"
            onClick={() => onTabChange("overview")}
            className="cursor-pointer inline-block text-left"
          >
            <span className="font-display font-semibold text-[23px] sm:text-[25px] tracking-tight text-[#111111]">
              QVERA
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-4 space-y-1 flex-1 overflow-y-auto pb-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[13.5px] transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#EAE7DC] text-[#111111] font-semibold border border-[#D5D0C5]/70 shadow-2xs"
                    : "text-[#555555] hover:text-[#111111] hover:bg-[#EFECE6]/70 border border-transparent font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#111111]" : "text-[#666666]"}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full border ${
                      isActive
                        ? "bg-white text-[#111111] border-[#DFDBD0]"
                        : "bg-[#EFECE6] text-[#555555] border-[#E2DFD6]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* =========================================================================
          MOBILE TOP NAVBAR (INCLUDES SEARCH, REAL-TIME BELL, WORKING PROFILE)
      ========================================================================= */}
      <div className="md:hidden sticky top-0 z-40 bg-[#F9F8F3] border-b border-[#E2DFD6] px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-[8px] border border-[#DFDBD0] bg-white text-[#111111] cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <span className="font-display font-semibold text-[21px] tracking-tight text-[#111111]">
            QVERA
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openBigSearch}
            className="w-9 h-9 rounded-full bg-white border border-[#DFDBD0] flex items-center justify-center text-[#555555] hover:text-[#111111] cursor-pointer"
            title="Search (⌘K)"
            aria-label="Open command search"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="relative" data-popover-notifications>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((o) => !o)
                setHeaderProfileOpen(false)
              }}
              className="w-9 h-9 rounded-full bg-white border border-[#DFDBD0] flex items-center justify-center text-[#555555] hover:text-[#111111] cursor-pointer relative"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className={`w-4 h-4 ${bellPulse ? "animate-bounce" : ""}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#0B0F12] text-[#F9F8F3] text-[9.5px] font-mono font-semibold flex items-center justify-center border border-[#F9F8F3]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && renderNotificationsPopover("right-0 mt-2")}
          </div>

          <div className="relative" data-popover-profile>
            <button
              type="button"
              onClick={() => {
                setHeaderProfileOpen((o) => !o)
                setNotificationsOpen(false)
              }}
              className="w-9 h-9 rounded-full bg-[#EFECE6] border border-[#DFDBD0] flex items-center justify-center text-[11px] font-semibold text-[#111111] cursor-pointer"
              title={userName}
              aria-label="Profile menu"
            >
              {userInitials}
            </button>
            {headerProfileOpen && renderProfilePopover("right-0 mt-2")}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE DRAWER (CLEAN NAVIGATION WITHOUT PROFILE BLOCK)
      ========================================================================= */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0B0F12]/30 backdrop-blur-xs flex">
          <div className="w-64 bg-[#F9F8F3] h-full p-5 flex flex-col justify-between shadow-xl border-r border-[#E2DFD6]">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DFD6]">
                <span className="font-display font-semibold text-[21px] text-[#111111]">QVERA</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-[8px] text-[#666666] hover:text-[#111111]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onTabChange(item.id)
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[13.5px] font-medium ${
                        isActive
                          ? "bg-[#EAE7DC] text-[#111111] font-semibold border border-[#D5D0C5]/70"
                          : "text-[#555555] hover:bg-[#EFECE6]/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EFECE6] border border-[#E2DFD6] text-[#111111] font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* =========================================================================
          MAIN WORKSPACE CANVAS (RIGHT OF SIDEBAR)
      ========================================================================= */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F9F8F3]">
        {/* Top Header Area: Hero Header Weight (425) + Top Right Expandable Search, Real-Time Bell, Profile */}
        <header className="px-6 sm:px-8 lg:px-10 pt-6 sm:pt-7 pb-4 flex flex-wrap items-center justify-between gap-4 select-none">
          <div>
            <h1 className="font-display text-[26px] sm:text-[32px] font-[425] text-[#111111] tracking-[-0.02em] leading-none">
              {getPageTitle()}
            </h1>
          </div>

          {/* Desktop Controls Cluster: Expandable Command Search + Real-Time Notification Bell + Working Profile */}
          <div className="hidden md:flex items-center gap-2.5 sm:gap-3">
            {/* Search Pill Trigger (Expands Big on Click or Cmd/Ctrl+K) */}
            <button
              type="button"
              onClick={openBigSearch}
              className="h-9 pl-3.5 pr-2.5 rounded-full bg-white hover:bg-[#FAF9F5] border border-[#DFDBD0] hover:border-[#C5C1B4] flex items-center gap-3 text-[12px] text-[#666666] hover:text-[#111111] shadow-2xs cursor-pointer transition-all group"
              title="Search questions, reports, or jump to view (⌘K / Ctrl+K)"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#111111] transition-colors" />
                <span className="font-sans">Search workspace...</span>
              </span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[#F9F8F3] text-[#555555] border border-[#DFDBD0] rounded-[6px]">
                {isMac ? "⌘K" : "Ctrl K"}
              </kbd>
            </button>

            {/* Real-Time Notification Bell */}
            <div className="relative" data-popover-notifications>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((o) => !o)
                  setHeaderProfileOpen(false)
                }}
                className={`w-9 h-9 rounded-full bg-white hover:bg-[#FAF9F5] border flex items-center justify-center shadow-2xs cursor-pointer transition-colors relative ${
                  notificationsOpen
                    ? "border-[#111111] text-[#111111]"
                    : "border-[#DFDBD0] text-[#555555] hover:text-[#111111]"
                }`}
                title={sseConnected ? "Real-time notifications (Live)" : "Notifications"}
                aria-label="Open notifications"
              >
                <Bell className={`w-4 h-4 ${bellPulse ? "animate-bounce" : ""}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0B0F12] text-[#F9F8F3] text-[10px] font-mono font-semibold flex items-center justify-center border-[1.5px] border-[#F9F8F3]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && renderNotificationsPopover("right-0 mt-2")}
            </div>

            {/* Working Top Right Profile Menu */}
            <div className="relative" data-popover-profile>
              <button
                type="button"
                onClick={() => {
                  setHeaderProfileOpen((o) => !o)
                  setNotificationsOpen(false)
                }}
                className={`h-9 pl-1.5 pr-2.5 rounded-full border flex items-center gap-2 shadow-2xs cursor-pointer transition-colors ${
                  headerProfileOpen
                    ? "bg-[#EAE7DC] border-[#C5C1B4]"
                    : "bg-[#EFECE6] hover:bg-[#EAE7DC] border-[#DFDBD0]"
                }`}
                title={`${userName} · Profile & Account`}
                aria-label="Open profile menu"
              >
                <span className="w-6.5 h-6.5 rounded-full bg-[#0B0F12] text-[#F9F8F3] font-semibold text-[10.5px] flex items-center justify-center font-sans">
                  {userInitials}
                </span>
                <span className="text-[12px] font-medium text-[#111111] hidden lg:inline max-w-[130px] truncate">
                  {userName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#555555]" />
              </button>

              {headerProfileOpen && renderProfilePopover("right-0 mt-2")}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="px-6 sm:px-8 lg:px-10 pb-12 flex-1">
          {children}
        </main>
      </div>

      {/* =========================================================================
          EXPANDABLE BIG COMMAND SEARCH OVERLAY (⌘K / Ctrl+K / Click)
      ========================================================================= */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0F12]/25 backdrop-blur-[2px] flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white border-[1.5px] border-[#C5C1B4] rounded-[18px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Large Search Input Header */}
            <div className="flex items-center gap-3 px-4 sm:px-5 h-14 border-b border-[#E5E2D9] bg-[#F9F8F3]/60">
              {searchLoading ? (
                <Loader2 className="w-4.5 h-4.5 text-[#555555] animate-spin shrink-0" />
              ) : (
                <Search className="w-4.5 h-4.5 text-[#111111] shrink-0" />
              )}

              <input
                ref={searchInputRef}
                type="text"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                onKeyDown={handleCommandKeyDown}
                placeholder="Search questions (R001, Q001), physics/math defects, chapters, or jump..."
                className="flex-1 bg-transparent text-[14.5px] text-[#111111] placeholder:text-[#888888] focus:outline-none font-sans"
                autoFocus
              />

              {commandQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCommandQuery("")
                    onSearchChange?.("")
                    searchInputRef.current?.focus()
                  }}
                  className="p-1 rounded-[6px] text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] cursor-pointer transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="px-2 py-1 text-[10.5px] font-mono font-medium text-[#555555] bg-white border border-[#DFDBD0] rounded-[6px] hover:text-[#111111] cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Live Search Results Body */}
            <div ref={resultListRef} className="max-h-[55vh] overflow-y-auto p-2.5 space-y-1">
              {commandActions.length === 0 ? (
                <div className="py-12 text-center text-[#666666] space-y-1.5">
                  <Search className="w-5 h-5 mx-auto text-[#888888]" />
                  <p className="text-[13px] font-medium text-[#111111]">
                    No matches for "{commandQuery}"
                  </p>
                  <p className="text-[11.5px] text-[#777777]">
                    Try searching a report ID (R001), subject (Physics), or defect term.
                  </p>
                </div>
              ) : (
                commandActions.map((item, idx) => {
                  const prevGroup = idx > 0 ? commandActions[idx - 1].group : null
                  const showGroupLabel = item.group !== prevGroup
                  const groupTitle =
                    item.group === "report"
                      ? commandQuery.trim()
                        ? "Disputed Questions & Reports"
                        : "Priority Pending Defects"
                      : item.group === "audit"
                      ? "Audit Ledger"
                      : item.group === "nav"
                      ? "Workspace Navigation"
                      : "Quick Filter"

                  const isHighlighted = idx === selectedIndex

                  return (
                    <React.Fragment key={item.key}>
                      {showGroupLabel && (
                        <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#777777]">
                          {groupTitle}
                        </div>
                      )}
                      <button
                        type="button"
                        data-search-index={idx}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={item.run}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px] text-left cursor-pointer transition-colors ${
                          isHighlighted
                            ? "bg-[#EAE7DC] text-[#111111]"
                            : "hover:bg-[#F9F8F3] text-[#111111]"
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="text-[13px] font-semibold text-[#111111] truncate font-sans">
                            {item.label}
                          </div>
                          {item.sublabel && (
                            <div className="text-[11.5px] text-[#666666] truncate font-sans">
                              {item.sublabel}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#DFDBD0] text-[#444444]">
                              {item.badge}
                            </span>
                          )}
                          {isHighlighted && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-[#555555]" />
                          )}
                        </div>
                      </button>
                    </React.Fragment>
                  )
                })
              )}
            </div>

            {/* Keyboard Legend Footer */}
            <div className="px-4 py-2.5 border-t border-[#E5E2D9] bg-[#F9F8F3] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#666666] font-mono">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-[#DFDBD0] rounded text-[10px]">↑↓</kbd>
                  <span>Select</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-[#DFDBD0] rounded text-[10px]">↵</kbd>
                  <span>Open</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-[#DFDBD0] rounded text-[10px]">/</kbd>
                  <span>or</span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-[#DFDBD0] rounded text-[10px]">
                    {isMac ? "⌘K" : "Ctrl K"}
                  </kbd>
                  <span>Toggle</span>
                </span>
              </div>
              <span>{searchReports.length} question matches</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          WORKING PROFILE & ACCOUNT MODAL (SAVES TO SQLITE VIA PATCH /api/v1/auth/me)
      ========================================================================= */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0F12]/25 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border-[1.5px] border-[#C5C1B4] rounded-[18px] shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 bg-[#F9F8F3] border-b border-[#E5E2D9] flex items-center justify-between">
              <div>
                <h2 className="font-display text-[19px] font-[425] text-[#111111] tracking-[-0.015em]">
                  Faculty Profile
                </h2>
                <p className="text-[11.5px] text-[#666666] font-sans">
                  Manage your reviewing identity in QVERA.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-[8px] text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] cursor-pointer transition-colors"
                aria-label="Close profile dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-[12px] bg-[#F9F8F3] border border-[#E5E2D9]">
                <div className="w-11 h-11 rounded-full bg-[#0B0F12] text-[#F9F8F3] flex items-center justify-center text-[13px] font-semibold font-sans shrink-0">
                  {getInitials(profileNameInput || userName)}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-[#111111] truncate">
                    {profileNameInput.trim() || userName}
                  </div>
                  <div className="text-[11px] font-mono text-[#666666] truncate">{userEmail}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-[#111111]">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileNameInput}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full h-10 px-3.5 rounded-[8px] bg-white border border-[#C5C1B4] text-[13.5px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                  placeholder="Dr. A. Sharma"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-[#666666]">
                    Email
                  </label>
                  <input
                    type="text"
                    value={userEmail}
                    readOnly
                    className="w-full h-9 px-3 rounded-[8px] bg-[#F9F8F3] border border-[#DFDBD0] text-[12px] font-mono text-[#666666]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-[#666666]">
                    Role
                  </label>
                  <input
                    type="text"
                    value={userRole}
                    readOnly
                    className="w-full h-9 px-3 rounded-[8px] bg-[#F9F8F3] border border-[#DFDBD0] text-[12px] font-mono uppercase text-[#666666]"
                  />
                </div>
              </div>

              {profileError && (
                <div className="text-[12px] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 rounded-[8px]">
                  {profileError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="h-10 px-4 rounded-[8px] bg-white hover:bg-[#F9F8F3] border border-[#C5C1B4] text-[13px] font-medium text-[#111111] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="h-10 px-5 rounded-[8px] bg-[#0B0F12] hover:bg-[#1f2328] text-white text-[13px] font-medium cursor-pointer transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
