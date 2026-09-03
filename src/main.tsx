import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { registrarServiceWorker } from "./lib/pwa";
import "./index.css";

// Só tem efeito no /admin, e só em produção — ver lib/pwa.ts.
registrarServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
