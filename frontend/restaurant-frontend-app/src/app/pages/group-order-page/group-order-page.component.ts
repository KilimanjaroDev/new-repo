import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Subscription, catchError, exhaustMap, finalize, forkJoin, map, switchMap, tap, timer } from 'rxjs';
import { ParticipantCardComponent } from '@app/components/group-orders/participant-card/participant-card.component';
import { GroupReservationStatus, GroupStatusResponse } from '@app/models/group-orders/group-status.model';
import { consolidatePreOrder } from '@app/shared/helpers/consolidate-pre-order';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { ToastService } from '@app/services/toast/toast.service';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { Participant } from '@app/models/group-orders/participant.model';
import { ModalComponent } from '@app/shared/custom-components/modal/modal.component';

@Component({
  selector: 'app-group-order-page',
  imports: [CurrencyPipe, DatePipe, ParticipantCardComponent, ModalComponent],
  templateUrl: './group-order-page.component.html',
  styleUrl: './group-order-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class GroupOrderPageComponent {
  private static readonly SYNC_INTERVAL_MS = 15_000;

  private readonly route = inject(ActivatedRoute);
  private readonly groupOrdersService = inject(GroupOrdersService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private syncSubscription?: Subscription;
  private syncStarted = false;

  readonly invite = signal<GuestInvite | null>(null);
  readonly participants = signal<Participant[]>([]);
  readonly ownerSessionId = signal<string | null>(null);
  readonly groupStatus = signal<GroupStatusResponse | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly showConfirmation = signal(false);
  readonly submitting = signal(false);
  readonly refreshing = signal(false);
  readonly updatedAt = signal<Date | null>(null);
  readonly refreshError = signal(false);

  readonly consolidatedOrder = computed(() => consolidatePreOrder(this.participants()));
  readonly unsubmittedCount = computed(() => this.participants().filter((participant) => !participant.isSubmitted).length);
  readonly hasDishes = computed(() => this.participants().some((participant) => participant.items.length > 0));
  readonly canSubmit = computed(
    () =>
      this.groupStatus()?.status === 'Open' &&
      this.consolidatedOrder().items.length > 0 &&
      !this.submitting(),
  );
  readonly displayStatus = computed<GroupReservationStatus | null>(() => this.groupStatus()?.status ?? null);

  constructor() {
    this.loadGroup();
  }

  loadGroup(): void {
    const reservationId = this.route.snapshot.paramMap.get('reservationId');
    if (!reservationId) {
      this.loading.set(false);
      this.errorMessage.set('Group reservation not found');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.groupOrdersService
      .getGroupInvite$(reservationId)
      .pipe(
        switchMap((invite) =>
          forkJoin({
            sessions: this.groupOrdersService.getSessions$(invite.GroupReservationId),
            ownerSessionId: this.groupOrdersService.getOwnerSessionId$(reservationId),
            status: this.groupOrdersService.getStatus$(invite.GroupReservationId),
          }).pipe(map((data) => ({ invite, ...data }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ invite, sessions, ownerSessionId, status }) => {
          this.invite.set(invite);
          this.participants.set(sessions.participants);
          this.ownerSessionId.set(ownerSessionId);
          this.groupStatus.set(status);
          this.updatedAt.set(new Date());
          this.loading.set(false);
          this.startSync();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.status === 404 ? 'Group reservation not found' : 'Could not load group reservation. Please try again.',
          );
          this.loading.set(false);
        },
      });
  }

  refreshNow(): void {
    this.refreshSnapshot$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  openConfirmation(): void {
    if (this.canSubmit()) this.showConfirmation.set(true);
  }

  closeConfirmation(): void {
    if (!this.submitting()) this.showConfirmation.set(false);
  }

  submitPreOrder(): void {
    const invite = this.invite();
    const reservationId = this.route.snapshot.paramMap.get('reservationId');
    if (!invite || !reservationId || !this.canSubmit()) return;

    this.submitting.set(true);
    this.groupOrdersService
      .submit$(invite.GroupReservationId, reservationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const currentStatus = this.groupStatus();
          if (currentStatus) this.groupStatus.set({ ...currentStatus, status: 'Submitted' });
          this.stopSync();
          this.submitting.set(false);
          this.showConfirmation.set(false);
          this.toastService.success('Pre-order sent to the restaurant');
        },
        error: () => {
          this.submitting.set(false);
          this.showConfirmation.set(false);
        },
      });
  }

  private startSync(): void {
    if (this.syncStarted || this.groupStatus()?.status !== 'Open') return;

    this.syncStarted = true;
    this.syncSubscription = timer(
      GroupOrderPageComponent.SYNC_INTERVAL_MS,
      GroupOrderPageComponent.SYNC_INTERVAL_MS,
    )
      .pipe(
        exhaustMap(() => this.refreshSnapshot$()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private stopSync(): void {
    this.syncSubscription?.unsubscribe();
    this.syncSubscription = undefined;
  }

  private refreshSnapshot$() {
    const invite = this.invite();
    if (!invite || this.groupStatus()?.status !== 'Open' || this.refreshing()) return EMPTY;

    this.refreshing.set(true);
    this.refreshError.set(false);

    return forkJoin({
      sessions: this.groupOrdersService.getSessions$(invite.GroupReservationId, { silent: true }),
      status: this.groupOrdersService.getStatus$(invite.GroupReservationId, { silent: true }),
    }).pipe(
      tap(({ sessions, status }) => {
        this.participants.set(sessions.participants);
        this.groupStatus.set(status);
        this.updatedAt.set(new Date());
        if (status.status !== 'Open') this.stopSync();
      }),
      catchError(() => {
        this.refreshError.set(true);
        return EMPTY;
      }),
      finalize(() => this.refreshing.set(false)),
    );
  }
}
