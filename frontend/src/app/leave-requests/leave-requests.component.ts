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
    approvingId: number | null = null;
    message: { text: string; type: 'success' | 'error' } | null = null;

    private apiUrl = 'http://localhost:5080/api/leave-requests';
    private employeesUrl = 'http://localhost:5080/api/employees';

    constructor(private http: HttpClient, private fb: FormBuilder) { }

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
        this.http.get<any[]>(this.employeesUrl).subscribe({
            next: (data) => {
                this.employees = data;
            },
            error: () => {
                this.message = { text: 'Failed to load employees', type: 'error' };
            }
        });
    }

    submit(): void {
        if (this.form.invalid) return;
        this.message = null;
        this.http.post(this.apiUrl, this.form.value).subscribe({
            next: () => {
                this.form.reset();
                this.message = { text: 'Request submitted successfully', type: 'success' };
                this.load();
            },
            error: (err) => {
                this.message = { text: err.error || 'Failed to submit request', type: 'error' };
            }
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
        this.http.get<any>(this.apiUrl).subscribe({
            next: (data) => {
                this.requests = data;
                this.loading = false;
            },
            error: () => {
                this.message = { text: 'Failed to load requests', type: 'error' };
                this.loading = false;
            }
        });
    }

    // Wired up by the candidate as part of the assignment.
    approve(id: number): void {
        this.approvingId = id;
        this.message = null;
        this.http.post<any>(this.apiUrl + '/' + id + '/approve', {}).subscribe({
            next: (updated) => {
                const index = this.requests.findIndex(r => r.id === id);
                if (index !== -1) this.requests[index] = updated;
                this.message = { text: 'Request approved successfully', type: 'success' };
                this.approvingId = null;
            },
            error: (err) => {
                this.message = { text: err.error || 'Failed to approve request', type: 'error' };
                this.approvingId = null;
            }
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
