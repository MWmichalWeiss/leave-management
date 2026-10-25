using LeaveManagement.Api.Models;
using LeaveManagement.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LeaveManagement.Api.Controllers;

[ApiController]
[Route("api/leave-requests")]
public class LeaveRequestsController : ControllerBase
{
    private readonly ILeaveRequestService _service;

    public LeaveRequestsController(ILeaveRequestService service)
    {
        _service = service;
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_service.GetAll());
    }

    [HttpGet("search")]
    public IActionResult Search([FromQuery] string name)
    {
        return Ok(_service.Search(name));
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateLeaveRequestDto dto)
    {
        var (request, error) = _service.Create(dto);

        if (error == "Employee not found")
            return NotFound(error);
        if (error != null)
            return BadRequest(error);

        return Ok(request);
    }

    [HttpPost("{id}/approve")]
    public IActionResult Approve(int id)
    {
        var (request, error, notFound) = _service.Approve(id);

        if (notFound)
            return NotFound(error);
        if (error != null)
            return BadRequest(error);

        return Ok(request);
    }
}
