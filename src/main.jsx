import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


function autoRender() {
  let el = document.getElementById("root");
  if (!el) {
    el = document.createElement("div");
    el.id = "my-react-widget";
    document.body.appendChild(el);
  };

  const props = {
    text: el.dataset.text || "Default text",
  };

  console.log('autorender')
  const root = createRoot(el);
  console.log('======================', el)
  root.render(
      <App />
  );
}

console.log('???????????????????????????????????????')

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoRender);
  console.log('DOMContentLoaded event added')
} else {
  autoRender();
}