import express from 'express';
import { registerSchema, loginSchema } from './auth.schema.js';
import validBodyRequest from '../../shared/middlewares/validBodyRequest.js';
import {register,login} from './auth.controller.js'

const authRouter = express.Router();

authRouter.post('/register', validBodyRequest(registerSchema), register);
authRouter.post('/login', validBodyRequest(loginSchema), login);

export default authRouter;