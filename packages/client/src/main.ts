import "./app.css";
import "./connection"; // koppelt de socket-events aan de store (side-effect)
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
