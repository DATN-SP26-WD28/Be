import { Router } from 'express';
import { uploadSingle } from '../../shared/middlewares/upload.middleware.js';
import { uploadImage } from './upload.controller.js';

const uploadRouter = Router();

uploadRouter.post('/', uploadSingle, uploadImage);

export default uploadRouter;
