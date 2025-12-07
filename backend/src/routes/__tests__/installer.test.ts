import request from 'supertest';
import express from 'express';
import installerRoutes from '../installer';

describe('Installer Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use('/api/installer', installerRoutes);
  });

  describe('GET /api/installer/:os', () => {
    it('should generate Windows installer', async () => {
      const response = await request(app)
        .get('/api/installer/windows')
        .query({ backend: 'http://localhost:3001' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/x-bat');
      expect(response.headers['content-disposition']).toContain('qubix-worker-installer.bat');
      expect(response.text).toContain('@echo off');
      expect(response.text).toContain('QUBIX WORKER');
      expect(response.text).toContain('python');
    });

    it('should generate Linux installer', async () => {
      const response = await request(app)
        .get('/api/installer/linux')
        .query({ backend: 'http://localhost:3001' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/x-sh');
      expect(response.headers['content-disposition']).toContain('qubix-worker-installer.sh');
      expect(response.text).toContain('#!/bin/bash');
      expect(response.text).toContain('QUBIX Worker');
      expect(response.text).toContain('python3');
    });

    it('should generate macOS installer', async () => {
      const response = await request(app)
        .get('/api/installer/macos')
        .query({ backend: 'http://localhost:3001' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/x-sh');
      expect(response.headers['content-disposition']).toContain('qubix-worker-installer.sh');
      expect(response.text).toContain('#!/bin/bash');
      expect(response.text).toContain('QUBIX Worker');
      expect(response.text).toContain('python3');
    });

    it('should return 400 for invalid OS', async () => {
      const response = await request(app)
        .get('/api/installer/invalid-os');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid OS');
    });

    it('should embed Python worker code in installer', async () => {
      const response = await request(app)
        .get('/api/installer/windows');

      expect(response.status).toBe(200);
      // Check that worker code is embedded
      expect(response.text).toContain('QubixWorkerSimple');
      expect(response.text).toContain('def get_hardware_specs');
    });
  });

  describe('GET /api/installer/worker.py', () => {
    it('should download raw worker Python file', async () => {
      const response = await request(app)
        .get('/api/installer/worker.py');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/x-python');
      expect(response.headers['content-disposition']).toContain('qubix_worker.py');
      expect(response.text).toContain('#!/usr/bin/env python3');
      expect(response.text).toContain('class QubixWorkerSimple');
    });
  });
});
