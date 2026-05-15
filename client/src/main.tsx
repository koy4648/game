import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Inject Analytics conditionally
const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

if (analyticsEndpoint && websiteId && !analyticsEndpoint.includes('%VITE')) {
  const script = document.createElement('script');
  script.defer = true;
  script.src = `${analyticsEndpoint}/umami`;
  script.setAttribute('data-website-id', websiteId);
  document.body.appendChild(script);
}

createRoot(document.getElementById("root")!).render(<App />);
