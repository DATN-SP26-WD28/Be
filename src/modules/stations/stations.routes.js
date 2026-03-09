import express from 'express';
import { createStation, deleteStation, getAllStations, updateStation } from './stations.controller.js';

const stationsRouter = express.Router();

stationsRouter.get('/', getAllStations);
stationsRouter.post('/', createStation);
stationsRouter.put('/:id', updateStation);
stationsRouter.delete('/:id', deleteStation);

export default stationsRouter;