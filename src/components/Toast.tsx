import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  icon?: ReactNode
  onClick?: () => void
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration (default 6 seconds)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 6000)
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[], onClose: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast, onClose: (id: string) => void }) {
  const getBgColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-success-500/95'
      case 'warning': return 'bg-warning-500/95'
      case 'error': return 'bg-error-500/95'
      default: return 'bg-accent-500/95'
    }
  }

  const handleClick = () => {
    if (toast.onClick) {
      toast.onClick()
      onClose(toast.id)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        ${getBgColor()}
        ${toast.onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
        pointer-events-auto
        backdrop-blur-sm
        text-white
        px-4 py-3
        rounded-xl
        shadow-xl
        flex items-start gap-3
        animate-slide-in-right
        transition-transform duration-200
      `}
    >
      {toast.icon && (
        <div className="flex-shrink-0 mt-0.5">
          {toast.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.message}</p>
        {toast.onClick && (
          <p className="text-xs opacity-80 mt-0.5">Click to view</p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(toast.id) }}
        className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Hook for ticket notification toasts
export function useTicketToast() {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const showNewReplyToast = useCallback((ticketId: number, message: string, isAdmin: boolean) => {
    showToast({
      type: 'info',
      message: message || `New reply in ticket #${ticketId}`,
      icon: <span className="text-lg">💬</span>,
      onClick: () => {
        navigate(isAdmin ? `/admin/tickets?ticket=${ticketId}` : `/support?ticket=${ticketId}`)
      },
      duration: 8000,
    })
  }, [showToast, navigate])

  const showNewTicketToast = useCallback((ticketId: number, title: string) => {
    showToast({
      type: 'info',
      message: `New ticket: ${title}`,
      icon: <span className="text-lg">🎫</span>,
      onClick: () => {
        navigate(`/admin/tickets?ticket=${ticketId}`)
      },
      duration: 8000,
    })
  }, [showToast, navigate])

  return { showNewReplyToast, showNewTicketToast }
}
