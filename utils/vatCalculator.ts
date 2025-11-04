import { CartItem } from '../types';

// Helper for rounding to 2 decimal places to avoid floating point issues
export const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

// Both CartItem and QuotationItem satisfy this interface.
interface CalculableItem {
    price: number;
    pricingType: 'inclusive' | 'exclusive';
    quantity: number;
    discount?: {
        type: 'percentage' | 'fixed';
        value: number;
    };
}

/**
 * Calculates the base price and VAT amount for a given total price and pricing type.
 * @param price - The total price of the line item (unit price * quantity).
 * @param pricingType - Whether the price is 'inclusive' or 'exclusive' of VAT.
 * @param vatRate - The VAT rate as a decimal (e.g., 0.16 for 16%).
 * @returns An object with basePrice and vatAmount.
 */
export const getPriceBreakdown = (price: number, pricingType: 'inclusive' | 'exclusive', vatRate: number) => {
    if (pricingType === 'inclusive') {
        const basePrice = price / (1 + vatRate);
        const vatAmount = price - basePrice;
        return { basePrice, vatAmount };
    } else { // 'exclusive'
        const basePrice = price;
        const vatAmount = basePrice * vatRate;
        return { basePrice, vatAmount };
    }
};

/**
 * Calculates all cart totals, correctly handling line-item and cart-level discounts with VAT.
 * @param cartItems - Array of items in the cart, which may have discounts.
 * @param cartDiscount - A final discount applied to the whole cart.
 * @param vatRate - The VAT rate as a decimal (e.g., 0.16 for 16%).
 * @returns A detailed breakdown of all financial values for the cart.
 */
export const calculateCartTotals = (
    cartItems: CalculableItem[], 
    cartDiscount: { type: 'percentage' | 'fixed', value: number },
    vatRate: number
) => {
    let grossSubtotal = 0;
    let totalLineItemsDiscount = 0;

    // 1. Process each item to apply line-level discounts
    const itemsAfterLineDiscounts = cartItems.map(item => {
        const itemGrossTotal = item.price * item.quantity;
        grossSubtotal += itemGrossTotal;

        let itemDiscountAmount = 0;
        if (item.discount) {
            if (item.discount.type === 'percentage') {
                itemDiscountAmount = itemGrossTotal * (item.discount.value / 100);
            } else { // fixed
                itemDiscountAmount = item.discount.value;
            }
            // Ensure discount doesn't exceed item total
            itemDiscountAmount = Math.min(itemGrossTotal, itemDiscountAmount);
        }
        
        totalLineItemsDiscount += itemDiscountAmount;
        const itemNetTotal = itemGrossTotal - itemDiscountAmount;

        return { ...item, itemGrossTotal, itemDiscountAmount, itemNetTotal };
    });

    // 2. Calculate and apply the cart-level discount
    const subtotalAfterLineDiscounts = grossSubtotal - totalLineItemsDiscount;

    let cartDiscountAmount = 0;
    if (cartDiscount.value > 0) {
        if (cartDiscount.type === 'percentage') {
            cartDiscountAmount = subtotalAfterLineDiscounts * (cartDiscount.value / 100);
        } else { // fixed
            cartDiscountAmount = cartDiscount.value;
        }
    }
    // Ensure cart discount doesn't exceed subtotal
    cartDiscountAmount = Math.min(subtotalAfterLineDiscounts, cartDiscountAmount);
    
    // 3. Calculate final VAT by proportionally distributing the cart discount
    let totalTaxableAmount = 0;
    let totalTax = 0;

    itemsAfterLineDiscounts.forEach(item => {
        if (item.itemNetTotal > 0 && subtotalAfterLineDiscounts > 0) {
            const proportionOfTotal = item.itemNetTotal / subtotalAfterLineDiscounts;
            const itemShareOfCartDiscount = cartDiscountAmount * proportionOfTotal;
            const finalItemPrice = item.itemNetTotal - itemShareOfCartDiscount;
            
            // Calculate VAT on the final, fully discounted price of this item line
            const { basePrice, vatAmount } = getPriceBreakdown(finalItemPrice, item.pricingType, vatRate);
            totalTaxableAmount += basePrice;
            totalTax += vatAmount;
        } else {
            // If item has no value after line discounts, its share of cart discount is 0
            const { basePrice, vatAmount } = getPriceBreakdown(item.itemNetTotal, item.pricingType, vatRate);
            totalTaxableAmount += basePrice;
            totalTax += vatAmount;
        }
    });

    const totalDiscountAmount = totalLineItemsDiscount + cartDiscountAmount;
    const finalTotal = totalTaxableAmount + totalTax;

    return { 
        subtotal: round(grossSubtotal), // Gross total before any discounts
        lineItemsDiscountAmount: round(totalLineItemsDiscount),
        cartDiscountAmount: round(cartDiscountAmount),
        totalDiscountAmount: round(totalDiscountAmount),
        taxableAmount: round(totalTaxableAmount), // Final base price total
        tax: round(totalTax),
        total: round(finalTotal) 
    };
};