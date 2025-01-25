import express from 'express';
import { searchLocations } from '../controllers/krogerLocationsController.js';
import { searchCatalog } from '../controllers/krogerCatalogController.js';

const router = express.Router();

router.get('/locations', searchLocations);
router.get('/catalog', searchCatalog);

export default router;