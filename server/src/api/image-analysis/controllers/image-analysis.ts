import fs from 'fs';
import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async analyze(ctx) {
    try {
      // @ts-ignore
      const files = ctx.request.files;
      
      if (!files || !files.image) {
        return ctx.badRequest('No image file provided.');
      }

      const file = Array.isArray(files.image) ? files.image[0] : files.image;

      // Read the file into memory
      const fileBuffer = await fs.promises.readFile(file.filepath);
      const mimeType = file.mimetype || 'image/jpeg';

      // Call the Gemini service
      const result = await strapi.service('api::image-analysis.gemini').analyzeImage(fileBuffer, mimeType);

      // Return standard response structure that frontend expects
      ctx.body = { data: result };
    } catch (err: any) {
      console.error("Image analysis controller error:", err);
      ctx.throw(500, err.message || 'Failed to analyze image');
    }
  }
});
