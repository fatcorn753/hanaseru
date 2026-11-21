import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
// fatcorn753-design: tokens → base → components の順。src/design/ は skill からの写しなので編集しない
import "./design/tokens.css";
import "./design/base.css";
import "./design/components.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
