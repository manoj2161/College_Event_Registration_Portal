import { createContext, useContext, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
const ToastContext = createContext(() => {});
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  function notify(message, type = "success") {
    setToast({ message, type });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(null), 3200);
  }
  return <ToastContext.Provider value={notify}>{children}{toast && <div className={`toast glass-panel ${toast.type}`} role="status"><span className="toast-icon">{toast.type === "error" ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}</span><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Close notification"><X size={16}/></button></div>}</ToastContext.Provider>;
}
export function useToast() { return useContext(ToastContext); }