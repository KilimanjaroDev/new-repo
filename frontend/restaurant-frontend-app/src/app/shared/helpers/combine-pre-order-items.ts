export interface PreOrderSummaryItem {
  dish: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

export function combinePreOrderItems(items: PreOrderSummaryItem[]): PreOrderSummaryItem[] {
  const combined = new Map<string, PreOrderSummaryItem>();

  for (const item of items) {
    const existing = combined.get(item.dish.id);
    combined.set(item.dish.id, {
      dish: {
        ...item.dish,
        price: existing?.dish.price ?? item.dish.price,
      },
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }

  return [...combined.values()];
}
