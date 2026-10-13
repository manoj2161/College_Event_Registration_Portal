import { useEffect } from "react";
import { X } from "lucide-react";
export default function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => { const handle = (event) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", handle); document.body.style.overflow = "hidden"; return () => { window.removeEventListener("keydown", handle); document.body.style.overflow = ""; }; }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className={`modal glass-panel ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}><header className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19}/></button></header>{children}</section></div>;
}