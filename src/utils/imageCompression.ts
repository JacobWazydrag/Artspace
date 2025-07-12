import imageCompression from "browser-image-compression";

/**
 * Compresses an image file to approximately 250KB
 * @param file - The image file to compress
 * @returns Promise<File> - The compressed image file
 */
export const compressImageTo250KB = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1.5, // 1.5MB = 1500KB
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: file.type,
    initialQuality: 1, // 100% quality
  };

  try {
    console.log(`Original file size: ${(file.size / 1024).toFixed(2)} KB`);

    const compressedFile = await imageCompression(file, options);

    console.log(
      `Compressed file size: ${(compressedFile.size / 1024).toFixed(2)} KB`
    );

    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw new Error("Failed to compress image");
  }
};

/**
 * Compresses an image file with custom options
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum size in MB (default: 0.25 for 250KB)
 * @param maxWidthOrHeight - Maximum width or height (default: 2048)
 * @returns Promise<File> - The compressed image file
 */
export const compressImage = async (
  file: File,
  maxSizeMB: number = 0.25,
  maxWidthOrHeight: number = 2048
): Promise<File> => {
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: file.type,
    initialQuality: 0.9,
  };

  try {
    console.log(`Original file size: ${(file.size / 1024).toFixed(2)} KB`);

    const compressedFile = await imageCompression(file, options);

    console.log(
      `Compressed file size: ${(compressedFile.size / 1024).toFixed(2)} KB`
    );

    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw new Error("Failed to compress image");
  }
};
