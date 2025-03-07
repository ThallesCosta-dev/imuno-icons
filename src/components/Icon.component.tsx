import React from "react";

interface IconProps {
  src: string;
  backgroundColor?: string;
  size?: string;
  borderRadius?: string;
}

const Icon: React.FC<IconProps> = ({
  src,
  backgroundColor = "#f3f4f6",
  size = "40px",
  borderRadius = "8px",
}) => {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        backgroundColor,
        width: size,
        height: size,
        borderRadius,
        padding: "8px",
      }}
    >
      <img
        src={src}
        alt="icon"
        className="w-full h-full object-contain"
        draggable="false"
      />
    </div>
  );
};

export default Icon;