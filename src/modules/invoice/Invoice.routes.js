import express from 'express';
import { deleteInvoice, getAllInvoices, getInvoiceById, getInvoiceStats } from './Invoice.controller.js';

const invoicesRouter = express.Router();

invoicesRouter.get('/', getAllInvoices);
invoicesRouter.get('/stats/summary', getInvoiceStats);
invoicesRouter.get('/:id', getInvoiceById);
invoicesRouter.delete('/:id', deleteInvoice);

export default invoicesRouter;