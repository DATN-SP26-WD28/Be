import createError from '../../shared/utils/createError.js';
import createResponse from '../../shared/utils/createResponse.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import Cart from './cart.model.js';


// 1. Lấy thông tin giỏ hàng hiện tại của một bàn
export const getCartByTable = handleAsync(async (req, res) => {
    const { tableId } = req.params;

    const cart = await Cart.findOne({ table_id: tableId, status: 'active' })
        .populate('items.dish_id', 'dish_name price image_url');

    if (!cart) {
        return createError(res, 404, "Bàn này hiện chưa có giỏ hàng hoạt động.");
    }

    return createResponse(res, 200, "Lấy giỏ hàng thành công", cart);
});

// 2. Thêm món vào giỏ hàng
export const addToCart = handleAsync(async (req, res) => {
    const { table_id, user_id, dish_id, quantity, note } = req.body;

    // Tìm giỏ hàng active
    let cart = await Cart.findOne({ table_id, status: 'active' });

    if (!cart) {
        // Tạo mới nếu chưa có
        cart = new Cart({
            table_id,
            user_id,
            items: [{ dish_id, quantity, note }]
        });
    } else {
        // Kiểm tra trùng món
        const itemIndex = cart.items.findIndex(item => item.dish_id.toString() === dish_id);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
            if (note) cart.items[itemIndex].note = note;
        } else {
            cart.items.push({ dish_id, quantity, note });
        }
    }

    const savedCart = await cart.save();
    return createResponse(res, 201, "Đã cập nhật giỏ hàng", savedCart);
});

// 3. Xóa một món khỏi giỏ hàng
export const removeFromCart = handleAsync(async (req, res) => {
    const { cartId, itemId } = req.params;

    const cart = await Cart.findById(cartId);
    if (!cart) return createError(res, 404, "Không tìm thấy giỏ hàng");

    // Lọc bỏ item
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    await cart.save();
    return createResponse(res, 200, "Đã xóa món khỏi giỏ hàng", cart);
});