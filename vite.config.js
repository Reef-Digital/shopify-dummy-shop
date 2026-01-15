import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

/// <reference types="vite/client" />

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isLibraryBuild = mode === "library";
  const isLibraryExternal = mode === "library-external";
  const isPlatformBuild = mode === "platform";

  // Regular web app build configuration (for shopify-dummy-shop)
  if (!isLibraryBuild && !isLibraryExternal && !isPlatformBuild) {
    return {
      plugins: [react(), tailwindcss()],
      base: '/',
      server: {
        port: 5177,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('dev'),
      },
      build: {
        minify: false
      },
    };
  }

  if (isLibraryBuild) {
    // Library build configuration - React bundled (standalone version)
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, "src/lib/index.js"),
          name: "SearchWidget",
          fileName: () => "search-widget.standalone.umd.js",
          formats: ["umd"],
        },
        rollupOptions: {
          // Bundle React inside the library
          output: {
            // No globals needed since we're bundling everything
          },
        },
        outDir: "dist/lib",
        emptyOutDir: false, // Don't clear the dist folder
        sourcemap: true,
        minify: "terser",
        terserOptions: {
          compress: {
            drop_console: false, // Keep console logs for debugging
            drop_debugger: true,
          },
        },
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    };
  }

  if (isPlatformBuild) {
    // Platform loader build configuration
    return {
      plugins: [],
      build: {
        lib: {
          entry: resolve(__dirname, "src/lib/platform.js"),
          name: "SearchWidgetPlatform",
          fileName: () => "platform.js",
          formats: ["umd"],
        },
        outDir: "dist/lib",
        emptyOutDir: false, // Don't clear the dist folder
        sourcemap: true,
        minify: "terser",
        terserOptions: {
          compress: {
            drop_console: false, // Keep console logs for debugging
            drop_debugger: true,
          },
        },
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    };
  }

  if (isLibraryExternal) {
    // Library build configuration - React external (for React apps)
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, "src/lib/index.js"),
          name: "SearchWidget",
          fileName: (format) => `search-widget.external.${format}.js`,
          formats: ["es", "umd", "cjs"],
        },
        rollupOptions: {
          external: ["react", "react-dom"],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
            },
          },
        },
        outDir: "dist/lib",
        emptyOutDir: false, // Don't clear the dist folder
        sourcemap: true,
        minify: "terser",
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    };
  }

  // Regular web app build configuration
  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "dist",
    },
  };
});
