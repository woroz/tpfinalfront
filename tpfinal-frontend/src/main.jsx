import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import mentorArIcon from "./assets/mentorar-icon.png";
import "./index.css";
import App from "./App.jsx";

document.title = "MentorAr";
const favicon = document.querySelector('link[rel="icon"]');
if (favicon) {
  favicon.href = mentorArIcon;
  favicon.type = "image/png";
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
