import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#101318",
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: 9999,
            background: "#d1361f",
            boxShadow: "0 0 0 44px rgba(209,54,31,0.22)",
          }}
        />
      </div>
    ),
    size,
  );
}
