import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthenticationService } from '@app/auth/services/authentication.service';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { PreOrdersService } from '@app/services/pre-orders/pre-orders.service';
import { ReservationService } from '@app/services/reservation/reservation.service';
import { Reservation, ReservationStatus } from '@app/models/reservations/reservation.model';
import { Order } from '@app/models/orders/order.model';
import { ReservationDashboardComponent } from './reservation-dashboard.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';

describe('ReservationDashboardComponent', () => {
  let component: ReservationDashboardComponent;
  let fixture: ComponentFixture<ReservationDashboardComponent>;
  let reservationService: jasmine.SpyObj<ReservationService>;
  let groupOrdersService: jasmine.SpyObj<GroupOrdersService>;
  let preOrdersService: jasmine.SpyObj<PreOrdersService>;

  beforeEach(async () => {
    reservationService = jasmine.createSpyObj<ReservationService>(
      'ReservationService',
      ['getReservationsForUser$', 'getReservationFeedback'],
    );
    groupOrdersService = jasmine.createSpyObj<GroupOrdersService>(
      'GroupOrdersService',
      ['getGroupInvite$', 'getSessions$'],
    );
    preOrdersService = jasmine.createSpyObj<PreOrdersService>(
      'PreOrdersService',
      ['getPreOrders'],
    );
    reservationService.getReservationsForUser$.and.returnValue(of([]));
    reservationService.getReservationFeedback.and.returnValue(of(null));
    preOrdersService.getPreOrders.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: 'https://test.api' },
        {
          provide: AuthenticationService,
          useValue: {
            user$: of({
              id: 'owner-1',
              firstName: 'Owner',
              lastName: 'Test',
              email: 'owner@example.test',
              role: 'Customer',
            }),
            getToken: () => 'test-token',
            getUser: () => ({
              id: 'owner-1',
              firstName: 'Owner',
              lastName: 'Test',
              email: 'owner@example.test',
              role: 'Customer',
            }),
          },
        },
        { provide: ReservationService, useValue: reservationService },
        { provide: PreOrdersService, useValue: preOrdersService },
        { provide: GroupOrdersService, useValue: groupOrdersService },
        provideRouter([]),
      ],
      imports: [ReservationDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads submitted guest items for group-enabled reservations', () => {
    const reservation: Reservation = {
      id: 'reservation-1',
      tableId: 'table-1',
      customerId: 'owner-1',
      startTime: new Date('2026-11-10T09:00:00Z'),
      endTime: new Date('2026-11-10T10:30:00Z'),
      guestCount: 2,
      status: ReservationStatus.Reserved,
      locationAddress: '14 Baratashvili Street',
      tableCapacity: 2,
      waiterId: 'waiter-1',
      hasSubmittedPreOrder: true,
      groupPreOrderAvailable: true,
    };
    const order = {
      orderId: 'owner-order',
      reservationId: reservation.id,
      reservationAddress: reservation.locationAddress,
      reservationTime: '',
      status: 3,
      orderItems: [],
    } as Order;
    preOrdersService.getPreOrders.and.returnValue(of([order]));
    reservationService.getReservationsForUser$.and.returnValue(of([reservation]));
    groupOrdersService.getGroupInvite$.and.returnValue(
      of({
        GroupReservationId: 'group-1',
        LocationId: 'location-1',
        RestaurantName: 'Green & Tasty',
        LocationAddress: reservation.locationAddress,
        StartTime: reservation.startTime.toISOString(),
        EndTime: reservation.endTime.toISOString(),
        MaxGuestCount: 2,
        TableNumber: 1,
        InviterName: 'Owner',
      }),
    );
    groupOrdersService.getSessions$.and.returnValue(
      of({
        participants: [
          {
            id: 'guest-1',
            type: 'Guest',
            name: 'Guest',
            isSubmitted: true,
            total: 9.99,
            items: [
              {
                dish: { id: 'salad', name: 'Green Salad', price: 9.99 },
                quantity: 1,
              },
            ],
          },
        ],
        total: 9.99,
      }),
    );

    component.ngOnInit();

    expect(groupOrdersService.getGroupInvite$).toHaveBeenCalledWith(
      reservation.id,
      { silent: true },
    );
    expect(
      component.reservations()[0].groupPreOrderParticipants,
    ).toEqual([
      {
        id: 'guest-1',
        type: 'Guest',
        name: 'Guest',
        isSubmitted: true,
        total: 9.99,
        items: [
          {
            dish: { id: 'salad', name: 'Green Salad', price: 9.99 },
            quantity: 1,
          },
        ],
      },
    ]);
  });

  it('refreshes submitted guest participants every 15 seconds', fakeAsync(() => {
    const reservation: Reservation = {
      id: 'reservation-1',
      tableId: 'table-1',
      customerId: 'owner-1',
      startTime: new Date('2026-11-10T09:00:00Z'),
      endTime: new Date('2026-11-10T10:30:00Z'),
      guestCount: 2,
      status: ReservationStatus.Reserved,
      locationAddress: '14 Baratashvili Street',
      tableCapacity: 2,
      waiterId: 'waiter-1',
      groupPreOrderAvailable: true,
    };

    reservationService.getReservationsForUser$.and.returnValue(
      of([reservation]),
    );
    groupOrdersService.getGroupInvite$.and.returnValue(
      of({
        GroupReservationId: 'group-1',
        LocationId: 'location-1',
        RestaurantName: 'Green & Tasty',
        LocationAddress: reservation.locationAddress,
        StartTime: reservation.startTime.toISOString(),
        EndTime: reservation.endTime.toISOString(),
        MaxGuestCount: 2,
        TableNumber: 1,
        InviterName: 'Owner',
      }),
    );
    groupOrdersService.getSessions$.and.returnValue(
      of({ participants: [], total: 0 }),
    );

    fixture.detectChanges();
    expect(groupOrdersService.getGroupInvite$).toHaveBeenCalledTimes(1);

    tick(15_000);

    expect(groupOrdersService.getGroupInvite$).toHaveBeenCalledTimes(2);
  }));
});
