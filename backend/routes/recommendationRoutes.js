import express from 'express';
import { GetPersonalizedUserRecommendations } from '../controllers/recommendationController.js';
import { validateUuidParam } from '../validations/recommendationValidations.js';
import { validate } from '../validations/validateMiddleware.js';

const router = express.Router();

router.get('/:uuid', validate(validateUuidParam), GetPersonalizedUserRecommendations); 

export default router;