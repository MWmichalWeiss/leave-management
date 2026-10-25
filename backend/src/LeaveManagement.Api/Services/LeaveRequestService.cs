using LeaveManagement.Api.Data;
using LeaveManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LeaveManagement.Api.Services;

public interface ILeaveRequestService
{
    List<LeaveRequest> GetAll();
    List<LeaveRequest> Search(string name);
    (LeaveRequest? request, string? error) Create(CreateLeaveRequestDto dto);
    (LeaveRequest? request, string? error, bool notFound) Approve(int id);
}

public class LeaveRequestService : ILeaveRequestService
{
    private readonly LeaveDbContext _db;

    public LeaveRequestService(LeaveDbContext db)
    {
        _db = db;
    }

    public List<LeaveRequest> GetAll()
    {
        return _db.LeaveRequests
            .Include(r => r.Employee)
            .OrderByDescending(r => r.StartDate)
            .ToList();
    }

    public List<LeaveRequest> Search(string name)
    {
        return _db.LeaveRequests
            .Include(r => r.Employee)
            .Where(r => r.Employee!.Name.Contains(name))
            .ToList();
    }

    public (LeaveRequest? request, string? error) Create(CreateLeaveRequestDto dto)
    {
        var employee = _db.Employees.FirstOrDefault(e => e.Id == dto.EmployeeId);
        if (employee == null)
            return (null, "Employee not found");

        var days = (dto.EndDate - dto.StartDate).Days + 1;

        var used = _db.LeaveRequests
            .Where(r => r.EmployeeId == dto.EmployeeId
                        && r.Type == LeaveType.Vacation
                        && (r.Status == LeaveStatus.Approved || r.Status == LeaveStatus.Pending))
            .Sum(r => r.Days);

        if (dto.Type == LeaveType.Vacation && (used + days) > employee.AnnualQuota)
        {
            return (null, "Not enough vacation balance");
        }

        var request = new LeaveRequest
        {
            EmployeeId = dto.EmployeeId,
            Type = dto.Type,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Days = days,
            Status = LeaveStatus.Pending
        };

        _db.LeaveRequests.Add(request);
        _db.SaveChanges();

        return (request, null);
    }

    public (LeaveRequest? request, string? error, bool notFound) Approve(int id)
    {
        using var transaction = _db.Database.BeginTransaction();

        var request = _db.LeaveRequests
            .Include(r => r.Employee)
            .FirstOrDefault(r => r.Id == id);

        if (request == null)
            return (null, "Leave request not found", true);

        if (request.Status != LeaveStatus.Pending)
            return (null, "Request already processed", false);

        if (request.Type == LeaveType.Vacation)
        {
            var used = _db.LeaveRequests
                .Where(r => r.EmployeeId == request.EmployeeId
                            && r.Type == LeaveType.Vacation
                            && r.Status == LeaveStatus.Approved)
                .Sum(r => r.Days);

            if ((used + request.Days) > request.Employee!.AnnualQuota)
            {
                transaction.Rollback();
                return (null, "Approval would exceed annual quota", false);
            }
        }

        request.Status = LeaveStatus.Approved;
        _db.SaveChanges();
        transaction.Commit();

        return (request, null, false);
    }
}
