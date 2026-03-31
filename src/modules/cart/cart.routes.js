import express from 'express';
import { addToCart, getCartByTable, removeFromCart } from './cart.controller.js';

const cartRouter = express.Router();

cartRouter.post('/', addToCart);

cartRouter.get('/table/:tableId', getCartByTable);

cartRouter.delete('/:cartId/item/:itemId', removeFromCart);

export default cartRouter;