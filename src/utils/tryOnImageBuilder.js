import axios from "axios";
import sharp from "sharp";
import fs from "fs";

// convert URL → buffer
const fetchImageBuffer = async (url) => {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
};

// convert buffer → base64
const toBase64 = (buffer) => buffer.toString("base64");

export const buildTryOnPayload = async ({
  userImagePath,
  topUrl,
  bottomUrl,
}) => {
  const userBuffer = fs.readFileSync(userImagePath);

  const topBuffer = await fetchImageBuffer(topUrl);
  const bottomBuffer = await fetchImageBuffer(bottomUrl);

  // resize (fixed height, keep aspect ratio)
  const resizedTop = await sharp(topBuffer)
    .resize({ height: 400 })
    .toBuffer();

  const resizedBottom = await sharp(bottomBuffer)
    .resize({ height: 400 })
    .toBuffer();

  // 🔥 get dynamic width for centering
  const topMeta = await sharp(resizedTop).metadata();
  const bottomMeta = await sharp(resizedBottom).metadata();

  const topLeft = Math.floor((1024 - topMeta.width) / 2);
  const bottomLeft = Math.floor((1024 - bottomMeta.width) / 2);

  const mergedBuffer = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([
      {
        input: resizedTop,
        top: 50,
        left: topLeft,
      },
      {
        input: resizedBottom,
        top: 550, // correct gap: 50 + 400 + 100
        left: bottomLeft,
      },
    ])
    .png()
    .toBuffer();

  fs.unlinkSync(userImagePath);

  return {
    human_image: toBase64(userBuffer),
    cloth_image: toBase64(mergedBuffer),
  };
};