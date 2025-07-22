const { supabase } = require('../models/supabaseModel');

const BUCKET_NAME = 'product-images';

// Upload multiple files buffer from multer
async function uploadFiles(productId, files) {
  if (!files || files.length === 0) return [];

  const uploadedUrls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.originalname.split('.').pop();
    const filename = `${productId}-${Date.now()}-${i}.${ext}`;
    const filePath = `${productId}/${filename}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.mimetype,
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}

// Delete files by URL array
async function deleteFiles(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) return;

  const { data: { publicUrl: baseUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl('');

  // Strip baseUrl from full URL to get path
  const paths = imageUrls.map(url => url.replace(`${baseUrl}/`, ''));

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(paths);

  if (error) {
    throw error;
  }
}

module.exports = {
  uploadFiles,
  deleteFiles
};
