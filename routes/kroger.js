import express from 'express';
import { searchLocations } from '../controllers/krogerLocationsController.js';

const router = express.Router();

router.get('/locations', searchLocations);

export default router;