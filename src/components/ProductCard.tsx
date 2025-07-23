import React from "react";

interface ProductCardProps {
  image: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  discountPercent: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  name,
  oldPrice,
  newPrice,
  discountPercent,
}) => {
  const amountSaved = (oldPrice - newPrice).toFixed(2);

  return (
    <div className="text-center text-sm">
      <img src={image} alt={name} className="mx-auto mb-4 w-full max-w-xs" />

      <p className="font-semibold">{name}</p>

      <div className="mt-1">
        <span className="line-through text-gray-500 mr-2">
          £{oldPrice.toFixed(2)}
        </span>
        <span className="font-semibold text-black">£{newPrice.toFixed(2)}</span>
      </div>

      <p className="text-red-600 text-sm mt-1 font-medium">
        You save: £{amountSaved} ({discountPercent}%)
      </p>
    </div>
  );
};

export default React.memo(ProductCard);
