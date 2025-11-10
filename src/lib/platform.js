/**
 * Platform.js - TextAtlas-style widget loader
 * This script loads the search widget library and automatically mounts widgets
 * on elements with data-widget="search" attribute.
 *
 * Usage:
 * <div class="textatlas-embed"
 *      data-widget="search"
 *      data-id="your-widget-id"></div>
 * <script src="https://your-domain.com/widget/platform.js" async></script>
 */

(function () {
  "use strict";

  // Get the current script element to extract configuration
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="platform.js"]');

  // Extract widget ID from the script path if present
  // e.g., /widget/172f8164-23a3-4463-aed6-e2e1eb61b765/platform.js
  let globalWidgetId = null;
  if (currentScript) {
    const scriptSrc = currentScript.src;
    const widgetIdMatch = scriptSrc.match(/\/widget\/([^\/]+)\/platform\.js/);
    if (widgetIdMatch) {
      globalWidgetId = widgetIdMatch[1];
    }
  }

  // Configuration
  const config = {
    // You can inject these during build time using the tenant scripts
    widgetLibraryUrl:
      "TENANT_INJECT_WIDGET_LIBRARY_URL" ||
      "./dist/lib/search-widget.standalone.umd.js",
    apiEndpoint: "TENANT_INJECT_API_ENDPOINT" || "",
    version: "1.0.0",
  };

  // Check if library URL needs to be replaced (not injected yet)
  if (config.widgetLibraryUrl.startsWith("TENANT_INJECT_")) {
    // Fallback to relative path for local development
    const scriptPath = currentScript ? new URL(currentScript.src).pathname : "";
    const basePath = scriptPath.replace(/\/platform\.js$/, "");
    config.widgetLibraryUrl = basePath + "/search-widget.standalone.umd.js";
  }

  // Logger
  const log = {
    info: (...args) => console.log("[SearchWidget Platform]", ...args),
    warn: (...args) => console.warn("[SearchWidget Platform]", ...args),
    error: (...args) => console.error("[SearchWidget Platform]", ...args),
  };

  // Load the widget library
  function loadWidgetLibrary() {
    return new Promise((resolve, reject) => {
      // Check if library is already loaded
      if (window.SearchWidget) {
        log.info("Widget library already loaded");
        resolve(window.SearchWidget);
        return;
      }

      log.info("Loading widget library from:", config.widgetLibraryUrl);

      const script = document.createElement("script");
      script.src = config.widgetLibraryUrl;
      script.async = false; // Load synchronously after this point
      script.onload = () => {
        if (window.SearchWidget) {
          log.info("Widget library loaded successfully");
          resolve(window.SearchWidget);
        } else {
          reject(new Error("SearchWidget not found after loading library"));
        }
      };
      script.onerror = () => {
        reject(
          new Error(
            `Failed to load widget library from ${config.widgetLibraryUrl}`
          )
        );
      };

      document.head.appendChild(script);
    });
  }

  // Initialize and mount widgets
  function initializeWidgets() {
    // Find all embed elements
    const embedElements = document.querySelectorAll(
      '[data-widget="search"], .textatlas-embed[data-widget="search"]'
    );

    if (embedElements.length === 0) {
      log.info("No widget embed elements found");
      return;
    }

    log.info(`Found ${embedElements.length} widget embed element(s)`);

    embedElements.forEach((element, index) => {
      try {
        // Get widget configuration from data attributes
        const widgetId = element.dataset.id || globalWidgetId;
        const widgetClass = element.dataset.widgetClass || "";
        const maxWidth = element.dataset.widgetMaxWidth || "";
        const searchKey = element.dataset.searchKey || "";

        log.info(`Mounting widget ${index + 1}:`, { widgetId, element });

        // Create widget instance
        const widget = window.SearchWidget.createSearchWidget();

        // Prepare mount options
        const options = { searchKey };
        log.info(options);
        if (widgetClass) options.className = widgetClass;
        if (maxWidth) options.maxWidth = maxWidth;
        if (widgetId) options.widgetId = widgetId;

        // Mount the widget
        widget.mount(element, options);

        // Store widget instance on element for later access
        element.searchWidget = widget;
        element.searchWidgetId = widgetId;

        log.info(`Widget ${index + 1} mounted successfully`);
      } catch (error) {
        log.error(`Failed to mount widget ${index + 1}:`, error);
      }
    });
  }

  // Main initialization
  async function init() {
    try {
      log.info("Initializing Search Widget Platform v" + config.version);

      // Load the widget library
      await loadWidgetLibrary();

      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeWidgets);
      } else {
        initializeWidgets();
      }

      // Expose platform API
      window.SearchWidgetPlatform = {
        version: config.version,
        config,
        reload: initializeWidgets,
        mount: (selector, options) => {
          const element =
            typeof selector === "string"
              ? document.querySelector(selector)
              : selector;
          if (element) {
            const widget = window.SearchWidget.createSearchWidget();
            widget.mount(element, options);
            return widget;
          }
          throw new Error(`Element not found: ${selector}`);
        },
      };

      log.info("Platform initialized successfully");
    } catch (error) {
      log.error("Failed to initialize platform:", error);
    }
  }

  // Start initialization
  init();
})();
