import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ConnectStudio } from "./components/studio/ConnectStudio";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConnectStudio />
  </StrictMode>,
);
