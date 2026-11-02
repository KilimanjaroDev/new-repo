import { Participant } from '@app/models/group-orders/participant.model';
import { PreOrderSummaryItem } from '@app/shared/helpers/combine-pre-order-items';

export function getSubmittedGuestPreOrderParticipants(
  participants: Participant[],
): Participant[] {
  return participants.filter(
    (participant) =>
      participant.type === 'Guest' && participant.isSubmitted,
  );
}

export function getSubmittedGuestPreOrderItems(
  participants: Participant[],
): PreOrderSummaryItem[] {
  return getSubmittedGuestPreOrderParticipants(participants)
    .flatMap((participant) =>
      participant.items.map(({ dish, quantity }) => ({
        dish: { id: dish.id, name: dish.name, price: dish.price },
        quantity,
      })),
    );
}
