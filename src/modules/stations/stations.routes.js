import express from 'express';
import { createStation, getAllStations } from './stations.controller.js';

const stationsRouter = express.Router();

stationsRouter.get('/', getAllStations);
stationsRouter.post('/', createStation);


export default stationsRouter;