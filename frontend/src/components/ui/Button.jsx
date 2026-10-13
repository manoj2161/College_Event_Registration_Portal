import { Loader } from "./Loader.jsx";
export default function Button({ children, variant = "primary", className = "", loading = false, ...props }) {
  return <button className={`button button-${variant} ${className}`} disabled={loading || props.disabled} {...props}>{loading && <Loader small />}{children}</button>;
}