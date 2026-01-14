import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { MonitorService } from '../../services/monitor.service';
import { MonitorSnapshotResponse, MonitorStaffItem, MonitorServingItem } from '../../models/monitor.model';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonitorComponent implements OnInit, OnDestroy {
  private sub = new Subscription();
  private clockTimerId?: number;

  isLightMode = signal<boolean>(false);

  snapshot = signal<MonitorSnapshotResponse | null>(null);
  isLoading = signal(true);
  lastError = signal<string | null>(null);
  lastUpdatedAt = signal<Date | null>(null);

  now = signal<Date>(new Date());

  // Derived
  nextQueue = computed<MonitorStaffItem | null>(() => this.snapshot()?.nextQueue ?? null);
  waitingList = computed<MonitorStaffItem[]>(() => this.snapshot()?.waitingList ?? []);
  servingNow = computed<MonitorServingItem[]>(() => this.snapshot()?.servingNow ?? []);
  waitingTotal = computed(() => this.snapshot()?.counts?.waitingTotal ?? 0);
  servingTotal = computed(() => this.snapshot()?.counts?.servingTotal ?? 0);

  constructor(private monitorService: MonitorService) {}

  ngOnInit(): void {
    // Theme (persist)
    const stored = this.safeGetLocalStorage('monitor.lightMode');
    if (stored === '1') this.isLightMode.set(true);
    if (stored === '0') this.isLightMode.set(false);

    // Clock
    this.clockTimerId = window.setInterval(() => this.now.set(new Date()), 1000);

    // Poll snapshot every 5s (public page cannot use SignalR)
    this.sub.add(
      interval(5000)
        .pipe(
          startWith(0),
          switchMap(() =>
            this.monitorService.getSnapshot(new Date()).pipe(
              catchError(err => {
                console.error('Monitor snapshot error', err);
                this.lastError.set('เชื่อมต่อระบบไม่ได้');
                this.isLoading.set(false);
                return [];
              })
            )
          )
        )
        .subscribe((response: any) => {
          // catchError returns [] => ignore
          if (!response) return;
          if (Array.isArray(response)) return;

          this.snapshot.set(response as MonitorSnapshotResponse);
          this.isLoading.set(false);
          this.lastError.set(null);
          this.lastUpdatedAt.set(new Date());
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.clockTimerId) {
      window.clearInterval(this.clockTimerId);
      this.clockTimerId = undefined;
    }
  }

  toggleTheme(): void {
    this.isLightMode.update(v => !v);
    this.safeSetLocalStorage('monitor.lightMode', this.isLightMode() ? '1' : '0');
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  avatarUrl(name: string, size = 256): string {
    const safe = encodeURIComponent(name || 'User');
    const background = this.isLightMode() ? 'ffffff' : '0f172a';
    const color = this.isLightMode() ? '1e293b' : 'ffffff';
    return `https://ui-avatars.com/api/?name=${safe}&background=${background}&color=${color}&size=${size}`;
  }

  avatarSrc(name: string, avatar?: string | null, size = 256): string {
    if (avatar && avatar.trim().length > 0) return avatar;
    return this.avatarUrl(name, size);
  }

  jobBadge(jobNumber?: string | null): string {
    if (!jobNumber) return '-';
    return jobNumber.startsWith('#') ? jobNumber : `#${jobNumber}`;
  }

  private safeGetLocalStorage(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeSetLocalStorage(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
}

