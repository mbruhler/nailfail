import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BlockOverlay } from "./components/BlockOverlay";
import "./styles.css";

const isBlockWindow =
  new URLSearchParams(window.location.search).get("view") === "block" ||
  window.location.hash.includes("view=block");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  isBlockWindow ? <BlockOverlay /> : <App />,
);
