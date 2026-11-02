import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CardReservationComponent } from './card-reservation.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { ReservationCustomer, ReservationStatusCustomer } from '@app/models/reservations/reservation.model';

const RESERVATION: ReservationCustomer = {
  id: 'res-1',
  tableId: 'table-1',
  startTime: new Date('2026-10-21T16:00:00Z'),
  endTime: new Date('2026-10-21T17:30:00Z'),
  guestCount: 2,
  status: ReservationStatusCustomer.Reserved,
  restaurantName: 'Green & Tasty',
  locationAddress: 'Rustaveli Avenue 48',
  waiterId: 'waiter-1',
};

describe('CardReservationComponent', () => {
  let component: CardReservationComponent;
  let fixture: ComponentFixture<CardReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: API_BASE_URL, useValue: 'https://test.api' }, provideRouter([])],
      imports: [CardReservationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardReservationComponent);
    component = fixture.componentInstance;
    // r — обов'язковий input: без нього компонент падає з NG0950
    fixture.componentRef.setInput('r', RESERVATION);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the combined pre-order items to the customer', () => {
    fixture.componentRef.setInput('r', {
      ...RESERVATION,
      preOrder: {
        orderId: 'order-1',
        reservationId: RESERVATION.id,
        reservationAddress: RESERVATION.locationAddress,
        reservationTime: '',
        status: 3,
        orderItems: [{
          dish: {
            id: 'dish-1',
            name: 'Green Salad',
            imageUrl: '',
            price: 9.99,
            state: 'Available',
            weight: '',
            dishType: '',
            description: '',
            calories: '',
            proteins: '',
            carbohydrates: '',
            fats: '',
            vitamins: '',
          },
          quantity: 2,
          state: 0,
        }],
      },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('My Pre-Order');
    expect(fixture.nativeElement.textContent).toContain('2 × Green Salad');
  });

  it('combines submitted guest dishes with the owner order on the reservation card', () => {
    fixture.componentRef.setInput('r', {
      ...RESERVATION,
      preOrder: {
        orderId: 'owner-order',
        reservationId: RESERVATION.id,
        reservationAddress: RESERVATION.locationAddress,
        reservationTime: '',
        status: 0,
        orderItems: [{
          dish: {
            id: 'salad',
            name: 'Green Salad',
            imageUrl: '',
            price: 9.99,
            state: 'Available',
            weight: '',
            dishType: '',
            description: '',
            calories: '',
            proteins: '',
            carbohydrates: '',
            fats: '',
            vitamins: '',
          },
          quantity: 1,
          state: 0,
        }],
      },
      groupPreOrderItems: [
        { dish: { id: 'salad', name: 'Green Salad', price: 9.99 }, quantity: 2 },
        { dish: { id: 'pizza', name: 'Margherita Pizza', price: 14.99 }, quantity: 1 },
      ],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 × Green Salad');
    expect(fixture.nativeElement.textContent).toContain('Guest pre-order');
    expect(fixture.nativeElement.textContent).toContain('2 × Green Salad');
    expect(fixture.nativeElement.textContent).toContain('1 × Margherita Pizza');
    expect(fixture.nativeElement.textContent).toContain('$44.96');
  });

  it('shows each submitted guest order separately with the group grand total', () => {
    fixture.componentRef.setInput('r', {
      ...RESERVATION,
      preOrder: {
        orderId: 'owner-order',
        reservationId: RESERVATION.id,
        reservationAddress: RESERVATION.locationAddress,
        reservationTime: '',
        status: 3,
        orderItems: [{
          dish: {
            id: 'salad',
            name: 'Green Salad',
            imageUrl: '',
            price: 9.99,
            state: 'Available',
            weight: '',
            dishType: '',
            description: '',
            calories: '',
            proteins: '',
            carbohydrates: '',
            fats: '',
            vitamins: '',
          },
          quantity: 1,
          state: 0,
        }],
      },
      groupPreOrderParticipants: [
        {
          id: 'guest-1',
          type: 'Guest',
          name: 'Maria',
          isSubmitted: true,
          total: 14.99,
          items: [{
            dish: { id: 'pizza', name: 'Margherita Pizza', price: 14.99 },
            quantity: 1,
          }],
        },
      ],
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('My Pre-Order');
    expect(text).toContain('Guest: Maria');
    expect(text).toContain('1 × Margherita Pizza');
    expect(text).toContain('$24.98');
    expect(text).not.toContain('Combined pre-order');
  });

  it('opens the group review after the customer pre-order is submitted', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture.componentRef.setInput('r', {
      ...RESERVATION,
      hasSubmittedPreOrder: true,
      groupPreOrderAvailable: true,
    });
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const groupButton = buttons.find(
      (button) => button.textContent?.trim() === 'Group Pre-Order',
    );

    expect(groupButton).toBeDefined();
    groupButton?.click();
    expect(router.navigate).toHaveBeenCalledOnceWith([
      '/reservations',
      RESERVATION.id,
      'group-order',
    ]);
  });
});
