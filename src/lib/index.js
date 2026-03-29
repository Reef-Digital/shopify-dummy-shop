import React from "react";
import { createRoot } from "react-dom/client";
import SearchForm from "../components/SearchForm.jsx";

// CSS injection function
const injectCSS = () => {
  if (document.getElementById("search-widget-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "search-widget-styles";
  style.textContent = `
    .search-widget-container * { box-sizing: border-box; }
    .search-widget-container {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
    }

    /* Layout */
    .search-widget-container .w-full { width: 100%; }
    .search-widget-container .relative { position: relative; }
    .search-widget-container .absolute { position: absolute; }
    .search-widget-container .top-14 { top: 3.5rem; }
    .search-widget-container .right-0 { right: 0; }
    .search-widget-container .left-0 { left: 0; }
    .search-widget-container .z-10 { z-index: 10; }
    .search-widget-container .flex { display: flex; }
    .search-widget-container .inline-flex { display: inline-flex; }
    .search-widget-container .flex-row { flex-direction: row; }
    .search-widget-container .flex-col { flex-direction: column; }
    .search-widget-container .flex-1 { flex: 1 1 0%; }
    .search-widget-container .flex-shrink-0 { flex-shrink: 0; }
    .search-widget-container .items-center { align-items: center; }
    .search-widget-container .justify-center { justify-content: center; }
    .search-widget-container .justify-between { justify-content: space-between; }

    /* Spacing */
    .search-widget-container .p-4 { padding: 1rem; }
    .search-widget-container .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .search-widget-container .py-3\\.5 { padding-top: 0.875rem; padding-bottom: 0.875rem; }
    .search-widget-container .gap-2\\.5 { gap: 0.625rem; }
    .search-widget-container .gap-8 { gap: 2rem; }
    .search-widget-container .mt-1 { margin-top: 0.25rem; }
    .search-widget-container .mt-4 { margin-top: 1rem; }

    /* Typography */
    .search-widget-container .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .search-widget-container .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .search-widget-container .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .search-widget-container .font-semibold { font-weight: 600; }
    .search-widget-container .font-medium { font-weight: 500; }

    /* Colors */
    .search-widget-container .text-gray-400 { color: rgb(156 163 175); }
    .search-widget-container .text-sky-600 { color: rgb(2 132 199); }
    .search-widget-container .text-sky-500 { color: rgb(14 165 233); }
    .search-widget-container .text-blue-600 { color: rgb(37 99 235); }
    .search-widget-container .hover\\:text-blue-800:hover { color: rgb(30 64 175); }
    .search-widget-container .bg-white { background-color: rgb(255 255 255); }
    .search-widget-container .hover\\:bg-gray-50:hover { background-color: rgb(249 250 251); }

    /* Borders */
    .search-widget-container .border-2 { border-width: 2px; }
    .search-widget-container .border-\\[\\#6BD7FF\\] { border-color: #6BD7FF; }
    .search-widget-container .border-b { border-bottom-width: 1px; }
    .search-widget-container .border-gray-200 { border-color: rgb(229 231 235); }
    .search-widget-container .border-none { border: none; }
    .search-widget-container .rounded-lg { border-radius: 0.5rem; }
    .search-widget-container .rounded { border-radius: 0.25rem; }

    /* Shadows */
    .search-widget-container .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
    .search-widget-container .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }

    /* Sizing */
    .search-widget-container .h-6 { height: 1.5rem; }
    .search-widget-container .h-96 { height: 24rem; }
    .search-widget-container .w-\\[60px\\] { width: 60px; }
    .search-widget-container .h-\\[60px\\] { height: 60px; }

    /* Misc */
    .search-widget-container .outline-none { outline: 2px solid transparent; outline-offset: 2px; }
    .search-widget-container .transition-all { transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1); }
    .search-widget-container .overflow-y-auto { overflow-y: auto; }
    .search-widget-container .object-cover { object-fit: cover; }

    /* Spinner */
    .search-widget-container .spinner {
      width: 20px; height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #3498db;
      border-radius: 50%;
      animation: search-widget-spin 1s linear infinite;
    }
    @keyframes search-widget-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  document.head.appendChild(style);
};

// Main library class — React 19 createRoot API
class SearchWidget {
  constructor() {
    this.container = null;
    this._root = null;
  }

  mount(selector, options = {}) {
    const targetElement =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;

    if (!targetElement) {
      throw new Error(`Element not found: ${selector}`);
    }

    injectCSS();

    this.container = document.createElement("div");
    this.container.className = "search-widget-container";

    if (options.className) {
      this.container.className += ` ${options.className}`;
    }
    if (options.style) {
      Object.assign(this.container.style, options.style);
    }

    targetElement.innerHTML = "";
    targetElement.appendChild(this.container);

    const componentProps = {
      searchKey: options.searchKey || "",
      apiUrl: options.apiUrl || "",
      placeholder: options.placeholder || "Search",
      maxWidth: options.maxWidth || "500px",
    };

    this._root = createRoot(this.container);
    this._root.render(React.createElement(SearchForm, componentProps));

    return this;
  }

  unmount() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    return this;
  }

  update(props = {}) {
    if (this._root) {
      this._root.render(React.createElement(SearchForm, props));
    }
    return this;
  }
}

// Factory function
const createSearchWidget = () => new SearchWidget();

// Auto-mount for data-widget="search" elements
const autoMount = () => {
  const embedElements = document.querySelectorAll('[data-widget="search"]');

  embedElements.forEach((element) => {
    const widget = createSearchWidget();
    const options = {};

    const widgetId = element.getAttribute("data-id");
    if (widgetId) options.widgetId = widgetId;

    const searchKey = element.getAttribute("data-search-key");
    if (searchKey) {
      options.searchKey = searchKey;
    } else {
      console.warn("SearchWidget: data-search-key attribute is missing on", element);
    }

    const apiUrl = element.getAttribute("data-api-url");
    if (apiUrl) options.apiUrl = apiUrl;

    if (element.dataset.widgetClass) options.className = element.dataset.widgetClass;
    if (element.dataset.widgetMaxWidth) options.maxWidth = element.dataset.widgetMaxWidth;

    widget.mount(element, options);
    element.searchWidget = widget;
  });
};

// Auto-mount when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoMount);
} else {
  autoMount();
}

// ES module exports
export { SearchWidget, createSearchWidget, SearchForm };

// UMD export for script tag usage
if (typeof window !== "undefined") {
  window.SearchWidget = {
    SearchWidget,
    createSearchWidget,
    SearchForm,
    mount: (selector, options) => createSearchWidget().mount(selector, options),
  };
}
