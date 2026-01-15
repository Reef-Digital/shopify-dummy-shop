import { INOPS_CONFIG } from "../config/api";

export default function Footer() {
    const homepageUrl = INOPS_CONFIG.homepageUrl;
    const shopName = INOPS_CONFIG.shopName;
    return (
      <footer className="bg-white border-t py-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} {shopName}. Demo storefront powered by{" "}
        <a className="underline" href={homepageUrl} target="_blank" rel="noopener noreferrer">
          Inops
        </a>{" "}
        (Reef Digital).
      </footer>
    );
  }