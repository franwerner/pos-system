import { type Product } from "../types/product.type";
import categoriesData from "./categories.data";


const productsData: Product[] = [
    {
        id: 1,
        name: "Coca-Cola 500ml",
        description: "Refresco clásico",
        price: 150,
        img_url: "https://www.coca-cola.com/content/dam/onexp/ar/es/coca-cola/es_coca-cola-sabor-original_prod_orginal-bottle_750x750_v1.jpg/width1960.jpg",
        created_at: "2025-10-24T12:30:00Z",
        updated_at: "2025-10-24T12:30:00Z",
        category: categoriesData[0],
        unit_type: "u",
        is_active: true
    },
    {
        id: 2,
        name: "Agua Mineral 1L",
        description: "Agua sin gas",
        price: 100,
        img_url: "https://example.com/agua.jpg",
        created_at: "2025-10-24T12:31:00Z",
        updated_at: "2025-10-24T12:31:00Z",
        category: categoriesData[0],
        unit_type: "u",
        is_active: true
    },
    {
        id: 3,
        name: "Hamburguesa Clásica",
        description: "Con carne de res, lechuga y tomate",
        price: 500,
        img_url: "https://example.com/hamburguesa.jpg",
        created_at: "2025-10-24T12:32:00Z",
        updated_at: "2025-10-24T12:32:00Z",
        category: categoriesData[1],
        unit_type: "u",
        is_active: true
    },
    {
        id: 4,
        name: "Papas Fritas",
        description: "Porción mediana",
        price: 200,
        img_url: "https://example.com/papas.jpg",
        created_at: "2025-10-24T12:33:00Z",
        updated_at: "2025-10-24T12:33:00Z",
        category: categoriesData[1],
        unit_type: "u",
        is_active: true
    },
    {
        id: 5,
        name: "Pizza Margarita",
        description: "Con queso mozzarella y tomate",
        price: 700,
        img_url: "https://example.com/pizza.jpg",
        created_at: "2025-10-24T12:34:00Z",
        updated_at: "2025-10-24T12:34:00Z",
        category: categoriesData[1],
        unit_type: "u",
        is_active: true
    },
    {
        id: 6,
        name: "Helado de Vainilla",
        description: "Porción individual",
        price: 250,
        img_url: "https://example.com/helado.jpg",
        created_at: "2025-10-24T12:35:00Z",
        updated_at: "2025-10-24T12:35:00Z",
        category: categoriesData[2],
        unit_type: "u",
        is_active: true
    },
    {
        id: 7,
        name: "Brownie de Chocolate",
        description: "Con nueces",
        price: 300,
        img_url: "https://example.com/brownie.jpg",
        created_at: "2025-10-24T12:36:00Z",
        updated_at: "2025-10-24T12:36:00Z",
        category: categoriesData[2],
        unit_type: "u",
        is_active: true
    },
    {
        id: 8,
        name: "Té Helado",
        description: "Té negro frío con limón",
        price: 180,
        img_url: "https://example.com/te.jpg",
        created_at: "2025-10-24T12:37:00Z",
        updated_at: "2025-10-24T12:37:00Z",
        category: categoriesData[0],
        unit_type: "u",
        is_active: true
    },
    {
        id: 9,
        name: "Café Americano",
        description: "Taza de café filtrado",
        price: 120,
        img_url: "https://example.com/cafe.jpg",
        created_at: "2025-10-24T12:38:00Z",
        updated_at: "2025-10-24T12:38:00Z",
        category: categoriesData[0],
        unit_type: "u",
        is_active: true
    },
    {
        id: 10,
        name: "Cheesecake",
        description: "Porción individual de cheesecake clásico",
        price: 350,
        img_url: "https://example.com/cheesecake.jpg",
        created_at: "2025-10-24T12:39:00Z",
        updated_at: "2025-10-24T12:39:00Z",
        category: categoriesData[2],
        unit_type: "u",
        is_active: true
    },
    {
        id: 11,
        name: "Té de Camomila",
        description: "Té de camomila con leche",
        price: 150,
        img_url: "https://example.com/te.jpg",
        created_at: "2025-10-24T12:40:00Z",
        updated_at: "2025-10-24T12:40:00Z",
        category: categoriesData[0],
        unit_type: "u",
        is_active: true
    },
    {
        id: 12,
        name: "Té de Camomila",
        description: "Té de camomila con leche",
        price: 150,
        img_url: "https://example.com/te.jpg",
        created_at: "2025-10-24T12:40:00Z",
        updated_at: "2025-10-24T12:40:00Z",
        category: categoriesData[0],
        unit_type: "u",
        is_active: true
    },
    {
        id: 13,
        name: "Té de Camomila",
        description: "Té de camomila con leche",
        price: 150,
        img_url: "https://example.com/te.jpg",
        created_at: "2025-10-24T12:40:00Z",
        updated_at: "2025-10-24T12:40:00Z",
        category: categoriesData[0],
        unit_type: "u",
        is_active: true
    }
];

export default productsData;