using JobPortalAPI.Application.DTOs.Application;

namespace JobPortalAPI.Application.Interfaces;

public interface IApplicationService
{
    Task<ApplicationResponseDto> ApplyAsync(ApplyJobDto dto, Guid candidateId);
    Task<List<ApplicationResponseDto>> GetMyApplicationsAsync(Guid candidateId);
    Task UpdateStatusAsync(Guid applicationId, string status, Guid recruiterId);
    Task<List<ApplicantResponseDto>> GetApplicantsForJobAsync(Guid jobId, Guid recruiterId);
}