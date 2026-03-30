import sharp from "sharp";

export async function convertToSticker(filePath: string) {
  const output = `${filePath}.webp`;

  await sharp(filePath)
    .resize(512, 512, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp()
    .toFile(output);

  return output;
}