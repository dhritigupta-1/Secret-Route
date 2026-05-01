export const transformImage = (url) => {
  if (!url) return null;
  // Bypassing transformations as they might be failing due to Cloudinary "Strict Transformations" tier limits,
  // causing the browser to receive a 401 Restricted or 404 Not Found error for transformed assets.
  return url;
};
