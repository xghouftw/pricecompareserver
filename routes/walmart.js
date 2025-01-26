import express from 'express';
import { searchCatalog } from '../controllers/walmartCatalogController.js';

const router = express.Router();

router.get('/catalog', searchCatalog);

export default router;