import { Participant } from '@app/models/group-orders/participant.model';
import {
  getSubmittedGuestPreOrderItems,
  getSubmittedGuestPreOrderParticipants,
} from './submitted-guest-pre-orders';

describe('getSubmittedGuestPreOrderItems', () => {
  it('returns only submitted guest dishes, excluding the owner and pending carts', () => {
    const participants: Participant[] = [
      {
        id: 'owner',
        type: 'Owner',
        name: 'Owner',
        isSubmitted: true,
        total: 10,
        items: [{ dish: { id: 'owner-dish', name: 'Owner dish', price: 10 }, quantity: 1 }],
      },
      {
        id: 'submitted-guest',
        type: 'Guest',
        name: 'Guest',
        isSubmitted: true,
        total: 20,
        items: [{ dish: { id: 'guest-dish', name: 'Guest dish', price: 10 }, quantity: 2 }],
      },
      {
        id: 'pending-guest',
        type: 'Guest',
        name: 'Pending guest',
        isSubmitted: false,
        total: 30,
        items: [{ dish: { id: 'pending-dish', name: 'Pending dish', price: 10 }, quantity: 3 }],
      },
    ];

    expect(getSubmittedGuestPreOrderItems(participants)).toEqual([
      { dish: { id: 'guest-dish', name: 'Guest dish', price: 10 }, quantity: 2 },
    ]);
    expect(getSubmittedGuestPreOrderParticipants(participants)).toEqual([
      participants[1],
    ]);
  });
});
