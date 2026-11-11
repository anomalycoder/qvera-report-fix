import React, { Component, type ReactNode } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("UI Error caught by ErrorBoundary:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto my-8 bg-white border-[1.5px] border-[#C5C1B4] rounded-[16px] shadow-xs text-center space-y-3 font-sans">
          <div className="w-10 h-10 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-display font-semibold text-base text-[#111111]">
            {this.props.fallbackTitle || "Something went wrong in this view"}
          </h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            {this.state.error?.message || "An unexpected rendering exception occurred."}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleReset}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Retry Component</span>
            </Button>
            <Button
              size="sm"
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              <span>Reload Page</span>
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
