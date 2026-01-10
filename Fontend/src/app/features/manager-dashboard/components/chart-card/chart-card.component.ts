import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export type ChartType = 'line' | 'bar' | 'doughnut' | 'pie' | 'funnel';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-card.component.html',
  styleUrls: ['./chart-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartCardComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() title: string = '';
  @Input() chartType: ChartType = 'line';
  @Input() data: any = null;
  @Input() isLoading: boolean = false;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private isViewInitialized = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    if (this.data && !this.isLoading) {
      setTimeout(() => this.renderChart(), 100);
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isViewInitialized) return;
    
    if (changes['data'] && !changes['data'].firstChange && this.data && !this.isLoading) {
      if (this.chart && this.chartCanvas) {
        setTimeout(() => this.updateChart(), 100);
      } else {
        setTimeout(() => this.renderChart(), 100);
      }
    }
    
    if (changes['isLoading'] && !changes['isLoading'].currentValue && this.data) {
      setTimeout(() => {
        if (!this.chart) {
          this.renderChart();
        }
      }, 100);
    }
  }

  private renderChart(): void {
    if (!this.chartCanvas || !this.data) return;

    const config = this.getChartConfig();
    if (config) {
      // Destroy existing chart if any
      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(this.chartCanvas.nativeElement, config);
      this.cdr.detectChanges();
    }
  }

  private updateChart(): void {
    if (!this.chart || !this.data) return;

    const config = this.getChartConfig();
    if (config && config.data) {
      this.chart.data = config.data;
      this.chart.update('none'); // Update without animation for real-time updates
    }
  }

  private getChartConfig(): ChartConfiguration | null {
    if (!this.data) return null;

    switch (this.chartType) {
      case 'line':
        return this.getLineChartConfig();
      case 'bar':
        return this.getBarChartConfig();
      case 'doughnut':
      case 'pie':
        return this.getDoughnutChartConfig();
      case 'funnel':
        return this.getFunnelChartConfig();
      default:
        return null;
    }
  }

  private getLineChartConfig(): ChartConfiguration {
    // For QueueTrendData
    const points = this.data.points || [];
    return {
      type: 'line',
      data: {
        labels: points.map((p: any) => {
          const date = new Date(p.date);
          return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        }),
        datasets: [
          {
            label: 'Created',
            data: points.map((p: any) => p.created || 0),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Closed',
            data: points.map((p: any) => p.closed || 0),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  }

  private getBarChartConfig(): ChartConfiguration {
    // For Staff Leaderboard
    const items = this.data.bySales || this.data.byConversion || [];
    const isSales = this.data.bySales !== undefined;
    
    return {
      type: 'bar',
      data: {
        labels: items.map((item: any) => item.staffName || ''),
        datasets: [{
          label: isSales ? 'Sales (฿)' : 'Conversion (%)',
          data: items.map((item: any) => isSales ? item.salesAmount : item.conversionRate),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    };
  }

  private getDoughnutChartConfig(): ChartConfiguration {
    // For CategoryMixData
    const items = this.data.items || [];
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(34, 197, 94, 0.8)',    // green
      'rgba(249, 115, 22, 0.8)',   // orange
      'rgba(168, 85, 247, 0.8)',   // purple
      'rgba(236, 72, 153, 0.8)',   // pink
      'rgba(251, 191, 36, 0.8)',   // yellow
      'rgba(20, 184, 166, 0.8)',   // teal
      'rgba(239, 68, 68, 0.8)',    // red
      'rgba(139, 92, 246, 0.8)',   // indigo
      'rgba(245, 158, 11, 0.8)',   // amber
    ];

    // Calculate total for percentage
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

    return {
      type: this.chartType as 'doughnut',
      data: {
        labels: items.map((item: any) => item.category || ''),
        datasets: [{
          data: items.map((item: any) => item.amount || 0),
          backgroundColor: items.map((_: any, index: number) => colors[index % colors.length]),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              generateLabels: (chart: any) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label: string, index: number) => {
                    const item = items[index];
                    const value = item?.amount || 0;
                    const count = item?.count || 0;
                    const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : '0.0';
                    return {
                      text: `${label}: ฿${value.toLocaleString()} (${count} งาน, ${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[index],
                      strokeStyle: data.datasets[0].borderColor || '#fff',
                      lineWidth: data.datasets[0].borderWidth || 0,
                      hidden: false,
                      index: index
                    };
                  });
                }
                return [];
              },
              padding: 12,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              title: (context: any) => {
                return context[0].label || '';
              },
              label: (context: any) => {
                const index = context.dataIndex;
                const item = items[index];
                const value = item?.amount || 0;
                const count = item?.count || 0;
                const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : '0.0';
                return [
                  `ยอดขาย: ฿${value.toLocaleString()}`,
                  `จำนวนงาน: ${count} งาน`,
                  `สัดส่วน: ${percentage}%`
                ];
              }
            },
            padding: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        }
      }
    };
  }

  private getFunnelChartConfig(): ChartConfiguration {
    // For ConversionFunnelData
    const stages = ['Waiting', 'Assigned', 'InProgress', 'ClosedWon', 'ClosedLost'];
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // blue - waiting
      'rgba(147, 197, 253, 0.8)',  // light blue - assigned
      'rgba(251, 191, 36, 0.8)',   // yellow - in progress
      'rgba(34, 197, 94, 0.8)',    // green - won
      'rgba(239, 68, 68, 0.8)',    // red - lost
    ];

    return {
      type: 'bar',
      data: {
        labels: stages,
        datasets: [{
          label: 'Count',
          data: [
            this.data.waiting || 0,
            this.data.assigned || 0,
            this.data.inProgress || 0,
            this.data.closedWon || 0,
            this.data.closedLost || 0
          ],
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.8', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  }
}
