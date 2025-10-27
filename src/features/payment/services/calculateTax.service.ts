export const calculateTax = (n: number, tax: number) => {
    return {
        tax: n * (tax / 100),
        total: n + (n * (tax / 100))
    }
}