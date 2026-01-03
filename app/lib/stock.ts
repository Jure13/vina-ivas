// app/lib/stock.ts

const stock: Record<string, number> = {
  wine1: 100,
  wine2: 100,
  wine3: 100,
  wine4: 100,
  wine5: 100,
  wine6: 100,
};

export function getStock() {
  return stock;
}

export function updateStock(updates: Record<string, number>) {
  Object.keys(updates).forEach((key) => {
    if (stock[key] !== undefined) {
      stock[key] = updates[key];
    }
  });
  return stock;
}