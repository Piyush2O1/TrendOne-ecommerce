// PulseIQ Analytics — React / Vite
// Project: 69c2c2b93b6f59647eb3c014

const CONFIG = {
  apiKey:    "pk_b70c28a2539d4a8e813337409d068eb3",
  projectId: "69c2c2b93b6f59647eb3c014",
  endpoint:  "https://pulseiq-ffio.onrender.com/api/ingest/event",
};

function getAnonId() {
  let id = localStorage.getItem("_piq_anon");
  if (!id) { id = "anon_" + Math.random().toString(36).slice(2, 11); localStorage.setItem("_piq_anon", id); }
  return id;
}

export function track(eventName: string, properties: Record<string, any> = {}): void {
  fetch(CONFIG.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": CONFIG.apiKey },
    body: JSON.stringify({
      projectId:   CONFIG.projectId,
      eventName,
      userId:      localStorage.getItem("_piq_user") || undefined,
      anonymousId: getAnonId(),
      properties:  { page: window.location.pathname, ...properties },
    }),
  }).catch(() => {});
}

export function identify(userId: string | number): void {
  localStorage.setItem("_piq_user", String(userId));
  track("identify", { userId });
}

// ── Usage ──────────────────────────────────────────────
// import { track, identify } from "../lib/pulseiq";
//
// // In App.jsx — track every route change:
// const location = useLocation();
// useEffect(() => { track("page_view", { path: location.pathname }); }, [location]);
//
// // Button click:
// <button onClick={() => track("signup_click", { plan: "pro" })}>Sign Up</button>
//
// // After login:
// identify(user._id);
// ──────────────────────────────────────────────────────