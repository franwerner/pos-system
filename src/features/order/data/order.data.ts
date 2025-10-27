import { Order } from "../types/order.type";


const orderData: Order = {
    id: 1,
    created_at: "2025-10-26T12:00:00.000Z",
    employed_id: "1",
    payment_id: 1,
    payment_name: "Efectivo",
    tax: 10,
    sub_total: 500,
    products: [{
        id: 1,
        order_id: 1,
        product_id: 1,
        quantity: 1,
        price: 300,
        name: "Producto 1",
        img_url: "https://example.com/product1.jpg",
        description: "Descripción del producto 1",
        unit_type: "u"
    }]
}

export default orderData