import express from 'express';
import { getAllStations } from './stations.controller.js';

const stationsRouter = express.Router();

stationsRouter.get('/', getAllStations);


export default stationsRouter;