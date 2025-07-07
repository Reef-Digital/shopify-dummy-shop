import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import SearchAutocomplete from "./Search";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div
        className="d-none"
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          zIndex: "100",
          top: "0",
          lef: "0",
        }}
      >
        <div class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <img
            class="size-12 shrink-0"
            src="/img/logo.svg"
            alt="ChitChat Logo"
          />
          <div>
            <div class="text-xl font-medium text-black dark:text-white">
              ChitChat
            </div>
            <p class="text-gray-500 dark:text-gray-400">
              You have a new message!
            </p>
          </div>
        </div>
        <SearchAutocomplete apiEndpoint={"123123"}></SearchAutocomplete>
      </div>
    </>
  );
}

export default App;
