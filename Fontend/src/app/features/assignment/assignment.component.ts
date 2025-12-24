import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Employee } from '../../models/employee.model';
import { Job } from '../../models/job.model';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assignment.component.html',
  styleUrls: ['./assignment.component.scss']
})
export class AssignmentComponent implements OnInit {
  employees = signal<Employee[]>([]);
  jobs = signal<Job[]>([]);

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.employees$.subscribe(emps => this.employees.set(emps));
    this.dataService.jobs$.subscribe(jobs => this.jobs.set(jobs));
  }
}

