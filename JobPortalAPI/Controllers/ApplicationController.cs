using System.Security.Claims;
using JobPortalAPI.Application.DTOs;
using JobPortalAPI.Application.DTOs.Application;
using JobPortalAPI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace JobPortalAPI.Controllers;

[ApiController]
[Route("api/applications")]
[Produces("application/json")]
public class ApplicationController : ControllerBase
{
    private readonly IApplicationService _applicationService;

    public ApplicationController(IApplicationService applicationService)
    {
        _applicationService = applicationService;
    }

    // POST api/applications
    [HttpPost]
    [Authorize(Roles = "Candidate")]
    public async Task<IActionResult> Apply([FromBody] ApplyJobDto dto)
    {
        var candidateId = GetCurrentUserId();
        try
        {
            var result = await _applicationService.ApplyAsync(dto, candidateId);
            return CreatedAtAction(nameof(GetMyApplications), result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    // GET api/applications/my
    [HttpGet("my")]
    [Authorize(Roles = "Candidate")]
    public async Task<IActionResult> GetMyApplications()
    {
        var candidateId = GetCurrentUserId();
        var result = await _applicationService.GetMyApplicationsAsync(candidateId);
        return Ok(result);
    }

    // PUT api/applications/{id}/status
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateApplicationStatusDto dto)
    {
        var recruiterId = GetCurrentUserId();
        try
        {
            await _applicationService.UpdateStatusAsync(id, dto.Status, recruiterId);
            return NoContent();
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpGet("job/{jobId:guid}")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> GetApplicantsForJob(Guid jobId)
    {
        var recruiterId = GetCurrentUserId();
        try
        {
            var result = await _applicationService.GetApplicantsForJobAsync(jobId, recruiterId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }


    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("Invalid token: user ID claim missing.");
        return id;
    }
}