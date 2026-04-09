import { v4 as uuidv4 } from 'uuid';

const CART_KEY = 'hotel_booking_cart';
const CART_ID_KEY = 'hotel_booking_cart_id';

/**
 * Ensures a persistent Cart UUID exists for the anonymous user.
 */
export const getOrCreateCartId = () => {
    let cartId = localStorage.getItem(CART_ID_KEY);
    if (!cartId) {
        cartId = uuidv4();
        localStorage.setItem(CART_ID_KEY, cartId);
    }
    return cartId;
};

/**
 * Saves cart items to LocalStorage.
 */
export const saveCart = (cartItems) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
};

/**
 * Retrieves cart items from LocalStorage.
 */
export const getCart = () => {
    const saved = localStorage.getItem(CART_KEY);
    if (!saved) return [];
    try {
        return JSON.parse(saved);
    } catch (e) {
        console.error("Cart parsing error:", e);
        return [];
    }
};

/**
 * Clears the cart.
 */
export const clearCart = () => {
    localStorage.removeItem(CART_KEY);
};
