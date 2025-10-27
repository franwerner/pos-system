import { Category } from "../types/category.type";

const categoriesData: Category[] = [
    {
        id: 1, name: "Bebidas", created_at: "2025-10-24T12:00:00Z", subCategories: [{
            id: 1,
            name: "Agua",
            created_at: "2025-10-24T12:10:00Z",
            parent_id: 1
        },
        {
            id: 2,
            name: "Jugo",
            created_at: "2025-10-24T12:10:00Z",
            parent_id: 1
        }]
    },
    {
        id: 2, name: "Comidas", created_at: "2025-10-24T12:05:00Z", subCategories: [{
            id: 1,
            name: "Arroz con pollo",
            created_at: "2025-10-24T12:10:00Z",
            parent_id: 2
        },
        {
            id: 2,
            name: "Pastel de cumpleaños",
            created_at: "2025-10-24T12:10:00Z",
            parent_id: 2
        }]
    },
    {
        id: 3, name: "Postres", created_at: "2025-10-24T12:10:00Z", subCategories: [{
            id: 1,
            name: "Budines",
            created_at: "2025-10-24T12:10:00Z",
            parent_id: 3
        },
        {
            id: 2,
            name: "Pastel de cumpleaños",
            created_at: "2025-10-24T12:10:00Z",
            parent_id: 3
        }]
    }
];

export default categoriesData;