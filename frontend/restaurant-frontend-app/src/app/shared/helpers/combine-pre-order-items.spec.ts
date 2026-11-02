import { combinePreOrderItems } from './combine-pre-order-items';

describe('combinePreOrderItems', () => {
  it('combines quantities for the same dish and preserves separate dishes', () => {
    expect(
      combinePreOrderItems([
        { dish: { id: 'salad', name: 'Green Salad', price: 9.99 }, quantity: 1 },
        { dish: { id: 'salad', name: 'Green Salad', price: 9.99 }, quantity: 2 },
        { dish: { id: 'pizza', name: 'Margherita Pizza', price: 14.99 }, quantity: 1 },
      ]),
    ).toEqual([
      { dish: { id: 'salad', name: 'Green Salad', price: 9.99 }, quantity: 3 },
      { dish: { id: 'pizza', name: 'Margherita Pizza', price: 14.99 }, quantity: 1 },
    ]);
  });
});
