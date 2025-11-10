import React from "react";
import ReactDOM from "react-dom";
import SearchForm from "../components/SearchForm.jsx";
import SearchInput from "../components/SearchInput.tsx";

// CSS injection function
const injectCSS = () => {
  if (document.getElementById("search-widget-styles")) {
    return; // Styles already injected
  }

  const style = document.createElement("style");
  style.id = "search-widget-styles";
  style.textContent = `
    /* Tailwind CSS Reset and Base Styles for Search Widget */
    .search-widget-container * {
      box-sizing: border-box;
    }
    
    .search-widget-container {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      line-height: 1.5;
      -webkit-text-size-adjust: 100%;
      -moz-tab-size: 4;
      tab-size: 4;
      -webkit-font-feature-settings: normal;
      font-feature-settings: normal;
      font-variation-settings: normal;
    }

    /* Tailwind utility classes needed for SearchForm */
    .search-widget-container .min-h-screen { min-height: 100vh; }
    .search-widget-container .bg-gray-50 { background-color: rgb(249 250 251); }
    .search-widget-container .bg-white { background-color: rgb(255 255 255); }
    .search-widget-container .bg-blue-50 { background-color: rgb(239 246 255); }
    .search-widget-container .bg-blue-100 { background-color: rgb(219 234 254); }
    .search-widget-container .bg-gray-100 { background-color: rgb(243 244 246); }
    .search-widget-container .bg-red-100 { background-color: rgb(254 226 226); }
    
    .search-widget-container .p-6 { padding: 1.5rem; }
    .search-widget-container .p-4 { padding: 1rem; }
    .search-widget-container .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .search-widget-container .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .search-widget-container .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .search-widget-container .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .search-widget-container .pl-12 { padding-left: 3rem; }
    .search-widget-container .pt-4 { padding-top: 1rem; }
    .search-widget-container .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
    .search-widget-container .px-20 { padding-left: 5rem; padding-right: 5rem; }
    .search-widget-container .pt-24 { padding-top: 6rem; }
    .search-widget-container .ml-3 { margin-left: 0.75rem; }
    .search-widget-container .ml-1 { margin-left: 0.25rem; }
    .search-widget-container .ml-6 { margin-left: 1.5rem; }
    .search-widget-container .mb-8 { margin-bottom: 2rem; }
    .search-widget-container .mb-2 { margin-bottom: 0.5rem; }
    .search-widget-container .mb-6 { margin-bottom: 1.5rem; }
    .search-widget-container .mb-4 { margin-bottom: 1rem; }
    .search-widget-container .mb-3 { margin-bottom: 0.75rem; }
    .search-widget-container .mb-1 { margin-bottom: 0.25rem; }
    .search-widget-container .mt-4 { margin-top: 1rem; }
    .search-widget-container .mt-2 { margin-top: 0.5rem; }
    .search-widget-container .mt-6 { margin-top: 1.5rem; }
    .search-widget-container .my-6 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
    .search-widget-container .mx-auto { margin-left: auto; margin-right: auto; }
    
    .search-widget-container .max-w-4xl { max-width: 56rem; }
    .search-widget-container .w-full { width: 100%; }
    .search-widget-container .w-6 { width: 1.5rem; }
    .search-widget-container .w-4 { width: 1rem; }
    .search-widget-container .w-16 { width: 4rem; }
    .search-widget-container .h-6 { height: 1.5rem; }
    .search-widget-container .h-4 { height: 1rem; }
    .search-widget-container .h-16 { height: 4rem; }
    .search-widget-container .h-\\[700px\\] { height: 700px; }
    
    .search-widget-container .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
    .search-widget-container .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .search-widget-container .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .search-widget-container .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .search-widget-container .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    
    .search-widget-container .font-bold { font-weight: 700; }
    .search-widget-container .font-semibold { font-weight: 600; }
    .search-widget-container .font-medium { font-weight: 500; }
    .search-widget-container .font-extrabold { font-weight: 800; }
    .search-widget-container .font-normal { font-weight: 400; }
    
    .search-widget-container .text-gray-900 { color: rgb(17 24 39); }
    .search-widget-container .text-gray-600 { color: rgb(75 85 99); }
    .search-widget-container .text-gray-500 { color: rgb(107 114 128); }
    .search-widget-container .text-gray-400 { color: rgb(156 163 175); }
    .search-widget-container .text-gray-300 { color: rgb(209 213 219); }
    .search-widget-container .text-blue-600 { color: rgb(37 99 235); }
    .search-widget-container .text-blue-800 { color: rgb(30 64 175); }
    .search-widget-container .text-blue-700 { color: rgb(29 78 216); }
    .search-widget-container .text-red-600 { color: rgb(220 38 38); }
    .search-widget-container .text-\\[\\#1D4C73\\] { color: #1D4C73; }
    .search-widget-container .text-\\[\\#1B5A8E\\] { color: #1B5A8E; }
    
    .search-widget-container .border { border-width: 1px; }
    .search-widget-container .border-none { border: none; }
    .search-widget-container .border-gray-300 { border-color: rgb(209 213 219); }
    .search-widget-container .border-gray-200 { border-color: rgb(229 231 235); }
    .search-widget-container .border-gray-100 { border-color: rgb(243 244 246); }
    .search-widget-container .border-blue-200 { border-color: rgb(191 219 254); }
    .search-widget-container .border-t { border-top-width: 1px; }
    
    .search-widget-container .rounded-xl { border-radius: 0.75rem; }
    .search-widget-container .rounded-lg { border-radius: 0.5rem; }
    .search-widget-container .rounded-full { border-radius: 9999px; }
    
    .search-widget-container .shadow-lg { 
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); 
    }
    
    .search-widget-container .relative { position: relative; }
    .search-widget-container .absolute { position: absolute; }
    .search-widget-container .left-4 { left: 1rem; }
    .search-widget-container .right-4 { right: 1rem; }
    .search-widget-container .top-1\\/2 { top: 50%; }
    .search-widget-container .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .search-widget-container .z-0 { z-index: 0; }
    .search-widget-container .transform { transform: var(--tw-transform); }
    .search-widget-container .-translate-y-1\\/2 { --tw-translate-y: -50%; transform: translateY(-50%); }
    
    .search-widget-container .flex { display: flex; }
    .search-widget-container .inline-flex { display: inline-flex; }
    .search-widget-container .flex-1 { flex: 1 1 0%; }
    .search-widget-container .flex-shrink-0 { flex-shrink: 0; }
    .search-widget-container .items-center { align-items: center; }
    .search-widget-container .items-start { align-items: flex-start; }
    .search-widget-container .justify-center { justify-content: center; }
    .search-widget-container .justify-between { justify-content: space-between; }
    .search-widget-container .gap-4 { gap: 1rem; }
    .search-widget-container .flex-col { flex-direction: column; }
    .search-widget-container .flex-row { flex-direction: row; }
    
    .search-widget-container .space-y-4 > :not([hidden]) ~ :not([hidden]) { 
      margin-top: 1rem; 
    }
    
    .search-widget-container .text-center { text-align: center; }
    .search-widget-container .leading-relaxed { line-height: 1.625; }
    .search-widget-container .bg-cover { background-size: cover; }
    .search-widget-container .bg-center { background-position: center; }
    
    .search-widget-container .outline-none { outline: 2px solid transparent; outline-offset: 2px; }
    .search-widget-container .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .search-widget-container .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    
    .search-widget-container .cursor-pointer { cursor: pointer; }
    .search-widget-container .cursor-not-allowed { cursor: not-allowed; }
    
    .search-widget-container .opacity-50 { opacity: 0.5; }
    
    .search-widget-container .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .search-widget-container .border-b-2 { border-bottom-width: 2px; }
    .search-widget-container .border-blue-600 { border-color: rgb(37 99 235); }
    
    /* Focus styles */
    .search-widget-container .focus\\:ring-2:focus { 
      --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
      --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
      box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
      --tw-ring-color: rgb(59 130 246 / 0.5);
    }
    .search-widget-container .focus\\:ring-blue-500:focus { --tw-ring-color: rgb(59 130 246 / 0.5); }
    .search-widget-container .focus\\:border-transparent:focus { border-color: transparent; }
    
    /* Hover styles */
    .search-widget-container .hover\\:bg-gray-50:hover { background-color: rgb(249 250 251); }
    .search-widget-container .hover\\:text-blue-800:hover { color: rgb(30 64 175); }
    
    /* SearchInput specific styles */
    .search-widget-container .border-2 { border-width: 2px; }
    .search-widget-container .border-\\[\\#6BD7FF\\] { border-color: #6BD7FF; }
    .search-widget-container .py-3\\.5 { padding-top: 0.875rem; padding-bottom: 0.875rem; }
    .search-widget-container .gap-2\\.5 { gap: 0.625rem; }
    .search-widget-container .top-14 { top: 3.5rem; }
    .search-widget-container .right-0 { right: 0; }
    .search-widget-container .left-0 { left: 0; }
    .search-widget-container .h-96 { height: 24rem; }
    .search-widget-container .z-10 { z-index: 10; }
    .search-widget-container .shadow-2xl { 
      box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); 
    }
    .search-widget-container .overflow-y-auto { overflow-y: auto; }
    .search-widget-container .gap-8 { gap: 2rem; }
    .search-widget-container .text-sky-600 { color: rgb(2 132 199); }
    .search-widget-container .text-sky-500 { color: rgb(14 165 233); }
    .search-widget-container .mt-1 { margin-top: 0.25rem; }
    .search-widget-container .rounded { border-radius: 0.25rem; }
    
    /* Spinner animation */
    .search-widget-container .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  `;

  document.head.appendChild(style);
};

// Main library class
class SearchWidget {
  constructor() {
    this.container = null;
  }

  mount(selector, options = {}) {
    // Find the target element
    const targetElement =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;

    if (!targetElement) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Inject CSS styles
    injectCSS();

    // Create container with widget-specific class
    this.container = document.createElement("div");
    this.container.className = "search-widget-container";

    // Apply any custom styles from options
    if (options.className) {
      this.container.className += ` ${options.className}`;
    }

    if (options.style) {
      Object.assign(this.container.style, options.style);
    }

    // Clear target element and append our container
    targetElement.innerHTML = "";
    targetElement.appendChild(this.container);

    // Prepare props for SearchForm
    const componentProps = {
      searchKey: options.searchKey || "",
      apiUrl: options.apiUrl || "",
      placeholder: options.placeholder || "Search",
      maxWidth: options.maxWidth || "500px",
    };

    console.log(
      "SearchWidget.mount: Rendering SearchForm with props:",
      JSON.stringify(componentProps, null, 2)
    );
    console.log(
      "SearchWidget.mount: searchKey value:",
      componentProps.searchKey
        ? `"${componentProps.searchKey}"`
        : "EMPTY STRING"
    );

    // Render SearchForm using React 18 compatible API with props
    ReactDOM.render(
      React.createElement(SearchForm, componentProps),
      this.container
    );

    return this;
  }

  unmount() {
    if (this.container) {
      ReactDOM.unmountComponentAtNode(this.container);

      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
    }

    return this;
  }

  update(props = {}) {
    if (this.container) {
      ReactDOM.render(React.createElement(SearchForm, props), this.container);
    }
    return this;
  }
}

// Factory function for easy instantiation
const createSearchWidget = () => new SearchWidget();

// Generic component mounting function
const mountComponent = (componentName, selector, props = {}) => {
  // Find the target element
  const targetElement =
    typeof selector === "string" ? document.querySelector(selector) : selector;

  if (!targetElement) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Inject CSS styles
  injectCSS();

  // Create container with widget-specific class
  const container = document.createElement("div");
  container.className = "search-widget-container";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";

  // Clear target element and append our container
  targetElement.innerHTML = "";
  targetElement.appendChild(container);

  // Get the component from SearchWidget
  const Component = window.SearchWidget
    ? window.SearchWidget[componentName]
    : null;
  if (!Component) {
    throw new Error(`Component '${componentName}' not found in SearchWidget`);
  }

  // Render the component using React 18 compatible API
  ReactDOM.render(React.createElement(Component, props), container);

  return {
    container,
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    },
    update: (newProps) => {
      ReactDOM.render(React.createElement(Component, newProps), container);
    },
  };
};

// Auto-mount functionality for script tag usage
const autoMount = () => {
  // Look for elements with data-widget="search" attribute
  const embedElements = document.querySelectorAll('[data-widget="search"]');

  embedElements.forEach((element) => {
    const widget = createSearchWidget();
    const options = {};

    // Debug: Log all data attributes
    console.log("SearchWidget: Element:", element);
    console.log("SearchWidget: All data attributes:", element.dataset);

    // Parse data-id attribute
    const widgetId = element.getAttribute("data-id");
    if (widgetId) {
      options.widgetId = widgetId;
    }

    // Parse data-search-key attribute (required for API authentication)
    // Use getAttribute to be explicit
    const searchKey = element.getAttribute("data-search-key");
    console.log("SearchWidget: getAttribute('data-search-key'):", searchKey);
    console.log(
      "SearchWidget: element.dataset.searchKey:",
      element.dataset.searchKey
    );

    if (searchKey) {
      options.searchKey = searchKey;
      console.log("SearchWidget: searchKey added to options:", searchKey);
    } else {
      console.error(
        "SearchWidget: data-search-key attribute is MISSING or EMPTY!"
      );
      console.error("SearchWidget: Element outerHTML:", element.outerHTML);
    }

    // Parse data-api-url attribute (optional, for custom API endpoints)
    const apiUrl = element.getAttribute("data-api-url");
    if (apiUrl) {
      options.apiUrl = apiUrl;
    }

    // Parse other data attributes for configuration
    if (element.dataset.widgetClass) {
      options.className = element.dataset.widgetClass;
    }

    if (element.dataset.widgetMaxWidth) {
      options.maxWidth = element.dataset.widgetMaxWidth;
    }

    console.log(
      "SearchWidget: Final options object:",
      JSON.stringify(options, null, 2)
    );
    console.log(
      "SearchWidget: Calling mount with searchKey:",
      options.searchKey ? "EXISTS" : "MISSING"
    );
    widget.mount(element, options);

    // Store widget instance on element for later access
    element.searchWidget = widget;
  });
};

// Auto-mount when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoMount);
} else {
  autoMount();
}

// Export for different module systems
export {
  SearchWidget,
  createSearchWidget,
  SearchForm,
  SearchInput,
  mountComponent,
};

// UMD export for script tag usage
if (typeof window !== "undefined") {
  window.SearchWidget = {
    SearchWidget,
    createSearchWidget,
    SearchForm,
    SearchInput,
    mount: (selector, options) => createSearchWidget().mount(selector, options),
    mountComponent,
    _React: React,
    _ReactDOM: ReactDOM,
    _injectCSS: injectCSS,
  };
}
