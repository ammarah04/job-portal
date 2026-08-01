using JobPortalAPI.Application.Interfaces;
using JobPortalAPI.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace JobPortalAPI.Controllers
{
    [ApiController]
    [Route("api/skillgap")]
    public class SkillGapController : ControllerBase
    {
        private readonly IMatchingService _matchingService;
        private readonly IJobService _jobService;
        private readonly IHubContext<SkillGapHub> _hubContext;

        public SkillGapController(
            IMatchingService matchingService,
            IJobService jobService,
            IHubContext<SkillGapHub> hubContext)
        {
            _matchingService = matchingService;
            _jobService = jobService;
            _hubContext = hubContext;
        }

        [HttpPost]
        [Authorize(Roles = "Candidate")]
        public async Task<IActionResult> AnalyzeSkillGap([FromBody] SkillGapRequest request)
        {
            // Helper to push a progress update to this specific client's group,
            // only if a connectionId was actually provided (keeps this endpoint
            // working even for callers that don't use SignalR).
            async Task SendProgress(string message, int percent)
            {
                if (!string.IsNullOrEmpty(request.ConnectionId))
                {
                    await _hubContext.Clients.Group(request.ConnectionId)
                        .SendAsync("AnalysisProgress", new { message, percent });
                }
            }

            try
            {
                await SendProgress("Fetching job details...", 20);

                var job = await _jobService.GetJobByIdAsync(request.JobId);

                await SendProgress("Analyzing resume against job requirements...", 50);

                // call Python skill gap service
                var result = await _matchingService.AnalyzeSkillGapAsync(
                    request.CVFilePath,
                    job.Description,
                    job.Title
                );

                await SendProgress("Analysis complete!", 100);

                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Skill gap analysis failed: " + ex.Message });
            }
        }
    }

    public class SkillGapRequest
    {
        public Guid JobId { get; set; }
        public string CVFilePath { get; set; } = null!;
        public string? ConnectionId { get; set; }
    }
}