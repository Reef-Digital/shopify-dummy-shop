import React from "react";
import imgShortboards from "../../../assets/images/shortboards.png";
import imgMidLength from "../../../assets/images/mid-length.png";
import imgLongboards from "../../../assets/images/longboards.png";
import imgWetsuitsMen from "../../../assets/images/wetsuit-men.png";
import imgWetsuitsWomen from "../../../assets/images/wetsuit-women.png";
import imgWetsuitAccessories from "../../../assets/images/wetsuit-accessories.png";
import imgFins from "../../../assets/images/fins.png";
import imgLeashes from "../../../assets/images/leashes.png";
import imgSurfboardBags from "../../../assets/images/surfboard-bags.png";

const categories = [
  {
    id: "1",
    name: "Boards",
    link: "#",
    items: [
      {
        id: "1-1",
        name: "Shortboards",
        image: imgShortboards,
      },
      {
        id: "1-2",
        name: "Mid-Length",
        image: imgMidLength,
      },
      {
        id: "1-3",
        name: "Longboards",
        image: imgLongboards,
      },
    ],
  },
  {
    id: "2",
    name: "Wetsuits",
    link: "#",
    items: [
      {
        id: "2-1",
        name: "Men",
        image: imgWetsuitsMen,
      },
      {
        id: "2-2",
        name: "Women",
        image: imgWetsuitsWomen,
      },
      {
        id: "2-3",
        name: "Wetsuit Accessories",
        image: imgWetsuitAccessories,
      },
    ],
  },
  {
    id: "3",
    name: "Leashes",
    link: "#",
    items: [
      {
        id: "3-1",
        name: "Fins",
        image: imgFins,
      },
      {
        id: "3-2",
        name: "Leashes",
        image: imgLeashes,
      },
      {
        id: "3-3",
        name: "Surfboard Bags",
        image: imgSurfboardBags,
      },
    ],
  },
];

const Categories: React.FC = () => {
  return (
    <div className="flex justify-center px-20">
      <div className="relative bg-white max-w-[1080px] w-full rounded-2xl border border-[#E5E7EB] p-10 -mt-[260px] mb-10">
        <div className="flex flex-row items-center justify-between">
          <p className="text-2xl font-semibold text-[#0F3253]">
            Featured Categories
          </p>

          <p className="font-medium underline cursor-pointer text-[#1B5A8E]">
            See all
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="border border-[#A9CEE9] rounded-lg p-4 flex flex-col"
            >
              <h3 className="font-bold mb-4">{cat.name}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                {cat.items.map((item) => (
                  <div key={item.name} className="flex flex-col items-start">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-24 object-contain rounded"
                    />
                    <p className="mt-2 text-sm">{item.name}</p>
                  </div>
                ))}
              </div>

              <a
                href={cat.link}
                className="mt-4 text-sky-600 font-medium flex items-center gap-1 hover:underline"
              >
                Shop now →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Categories);
