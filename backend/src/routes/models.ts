import { Router } from 'express';

/**
 * Model Hub Routes (Placeholder)
 * 
 * Note: The Model table is not yet implemented in the Prisma schema.
 * These routes return mock data for the MVP demo.
 * Future implementation will add a Model table for AI model marketplace.
 */

// Mock models for demo purposes
const mockModels = [
  {
    id: 'model-1',
    name: 'Llama 2 7B',
    description: 'Meta\'s open-source LLM for text generation',
    owner: 'meta',
    modelType: 'llm',
    fileUrl: 'https://huggingface.co/meta-llama/Llama-2-7b',
    price: 0,
    royalty: 0,
    downloads: 15420,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'model-2',
    name: 'Stable Diffusion XL',
    description: 'High-quality image generation model',
    owner: 'stability-ai',
    modelType: 'image-generation',
    fileUrl: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0',
    price: 0,
    royalty: 0,
    downloads: 8930,
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'model-3',
    name: 'Whisper Large',
    description: 'Speech recognition and transcription',
    owner: 'openai',
    modelType: 'audio',
    fileUrl: 'https://huggingface.co/openai/whisper-large-v3',
    price: 0,
    royalty: 0,
    downloads: 5210,
    createdAt: new Date('2024-01-20')
  }
];

export function modelRoutes(_services: any) {
  const router = Router();

  // List models
  router.get('/', async (req, res) => {
    try {
      const { modelType, sortBy = 'downloads' } = req.query;

      let models = [...mockModels];
      
      if (modelType) {
        models = models.filter(m => m.modelType === modelType);
      }
      
      if (sortBy === 'downloads') {
        models.sort((a, b) => b.downloads - a.downloads);
      }

      res.json(models);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get model details
  router.get('/:id', async (req, res) => {
    try {
      const model = mockModels.find(m => m.id === req.params.id);

      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      res.json(model);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Publish model (placeholder - returns success with mock data)
  router.post('/publish', async (req, res) => {
    try {
      const { name, description, modelType, fileUrl, price, royalty } = req.body;
      const owner = req.headers['x-user-id'] as string || 'anonymous';

      const model = {
        id: `model-${Date.now()}`,
        name,
        description,
        owner,
        modelType,
        fileUrl,
        price: price || 0,
        royalty: royalty || 0,
        downloads: 0,
        createdAt: new Date()
      };

      res.json({ success: true, model });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Download model (placeholder)
  router.post('/:id/download', async (req, res) => {
    try {
      const model = mockModels.find(m => m.id === req.params.id);
      
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      res.json({ success: true, downloadUrl: model.fileUrl });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
