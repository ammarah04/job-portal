using System.Security.Claims;
using JobPortalAPI.Application.DTOs.Job;
using JobPortalAPI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobPortalAPI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobsController : ControllerBase
{
    private readonly IJobService _jobService;

    public JobsController(IJobService jobService)
    {
        _jobService = jobService;
    }

    [HttpPost]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> CreateJob([FromBody] CreateJobDto dto)
    {
        try
        {
            var recruiterId = Guid.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var result = await _jobService.CreateJobAsync(dto, recruiterId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetJobs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? location = null,
        [FromQuery] string? jobType = null,
        [FromQuery] decimal? minSalary = null,
        [FromQuery] decimal? maxSalary = null)
    {
        try
        {
            var result = await _jobService.GetJobsAsync(
                page, pageSize, location, jobType, minSalary, maxSalary);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("mine")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> GetMyJobs()
    {
        try
        {
            var recruiterId = Guid.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var result = await _jobService.GetMyJobsAsync(recruiterId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetJobById(Guid id)
    {
        try
        {
            var result = await _jobService.GetJobByIdAsync(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> UpdateJob(Guid id, [FromBody] CreateJobDto dto)
    {
        try
        {
            var recruiterId = Guid.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var result = await _jobService.UpdateJobAsync(id, dto, recruiterId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Recruiter,Admin")]
    public async Task<IActionResult> DeleteJob(Guid id)
    {
        try
        {
            var recruiterId = Guid.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            await _jobService.DeleteJobAsync(id, recruiterId);
            return Ok(new { message = "Job deleted successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}