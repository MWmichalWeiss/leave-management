import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// NOTE: This component was written quickly for a POC.
// It talks to the API directly, manages state by hand and uses `any` everywhere.
@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './leave-requests.component.html',
  styleUrls: ['./leave-requests.component.css']
})
export class LeaveRequestsComponent implements OnInit {
  requests: any[] = [];
  employees: any[] = [];
  loading = false;
  form!: FormGroup;

  private apiUrl = 'http://localhost:5080/api/leave-requests';
  private employeesUrl = 'http://localhost:5080/api/employees';

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      type: [null, Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    }, { validators: this.dateRangeValidator });

    this.load();
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.http.get<any[]>(this.employeesUrl).subscribe((data) => {
      this.employees = data;
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.http.post(this.apiUrl, this.form.value).subscribe(() => {
      this.form.reset();
      this.load();
    });
  }

  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (start && end && new Date(start) > new Date(end)) {
      return { dateRange: true };
    }
    return null;
  }

  load(): void {
    this.loading = true;
    this.http.get<any>(this.apiUrl).subscribe((data) => {
      this.requests = data;
      this.loading = false;
    });
  }

  // Wired up by the candidate as part of the assignment.
  approve(id: number): void {
    // TODO (candidate): call POST /api/leave-requests/{id}/approve
    // and handle loading / error / success without a generic alert.
    this.http.post<any>(this.apiUrl + '/' + id + '/approve', {}).subscribe(() => {
      this.load();
    });
  }

  typeLabel(type: number): string {
    if (type == 0) return 'Vacation';
    if (type == 1) return 'Sick';
    return 'Unpaid';
  }

  statusLabel(status: number): string {
    if (status == 0) return 'Pending';
    if (status == 1) return 'Approved';
    return 'Rejected';
  }
}
