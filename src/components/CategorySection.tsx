import React from "react";

import imgSurfboards from "../assets/images/surfboards.jpg";
import imgWetsuits from "../assets/images/wetsuits.jpg";
import imgSurfAccessories from "../assets/images/surf-accessories.jpg";

interface CategoryCardProps {
  image: string;
  title: string;
  subtitle: string;
  links: { label: string; href: string }[];
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  image,
  title,
  subtitle,
  links,
}) => {
  return (
    <div className="flex flex-col items-center text-center gap-3 px-4">
      <img src={image} alt={title} className="w-full h-auto object-cover" />
      <p className="text-sm text-gray-600">{subtitle}</p>
      <h3 className="text-lg font-bold">{title}</h3>
      <button className="bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800">
        Shop now
      </button>
      <div className="flex flex-wrap justify-center gap-4 text-sm mt-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-black underline font-semibold"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
};

const CategorySection: React.FC = () => {
  return (
    <section className="py-10 bg-white border-t">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <CategoryCard
          image={imgSurfboards}
          title="Surfboards"
          subtitle="Unbeatable range of premium surfboards"
          links={[
            { label: "Shortboards", href: "#" },
            { label: "Mid-Length", href: "#" },
            { label: "Longboards", href: "#" },
          ]}
        />
        <CategoryCard
          image={imgWetsuits}
          title="Wetsuits"
          subtitle="UK’s largest online wetsuit retailer"
          links={[
            { label: "Mens", href: "#" },
            { label: "Womens", href: "#" },
            { label: "Wetsuit accessories", href: "#" },
          ]}
        />
        <CategoryCard
          image={imgSurfAccessories}
          title="Surf Accessories"
          subtitle="All your surf essentials"
          links={[
            { label: "Fins", href: "#" },
            { label: "Leashes", href: "#" },
            { label: "Surfboard Bags", href: "#" },
          ]}
        />
      </div>
    </section>
  );
};

export default CategorySection;
