import express from 'express';
import { createInvoice, getInvoiceDetail, markAsPaid } from './Invoice.controller.js';

const invoicesRouter = express.Router();

invoicesRouter.post('/create', createInvoice);
invoicesRouter.patch('/pay/:id', markAsPaid);
invoicesRouter.get('/:id', getInvoiceDetail);

export default invoicesRouter;