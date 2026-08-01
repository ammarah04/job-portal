using JobPortalAPI.Application.DTOs.Application;
using JobPortalAPI.Application.Interfaces;
using JobPortalAPI.Domain.Entities;
using JobPortalAPI.Domain.Enums;

namespace JobPortalAPI.Infrastructure.Services;

public class ApplicationService : IApplicationService
{
    private readonly IApplicationRepository _applicationRepository;
    private readonly IJobRepository _jobRepository;

    public ApplicationService(
        IApplicationRepository applicationRepository,
        IJobRepository jobRepository)
    {
        _applicationRepository = applicationRepository;
        _jobRepository = jobRepository;
    }

    public async Task<ApplicationResponseDto> ApplyAsync(ApplyJobDto dto, Guid candidateId)
    {
        var job = await _jobRepository.GetByIdAsync(dto.JobId)
            ?? throw new KeyNotFoundException("Job not found.");

        if (job.ExpiryDate < DateTime.UtcNow)
            throw new InvalidOperationException("This job listing has expired.");

        var alreadyApplied = await _applicationRepository.HasAppliedAsync(dto.JobId, candidateId);
        if (alreadyApplied)
            throw new InvalidOperationException("You have already applied for this job.");

        var application = new JobApplication
        {
            Id = Guid.NewGuid(),
            JobId = dto.JobId,
            CandidateId = candidateId,
            CVFilePath = dto.CVFilePath,
            Status = ApplicationStatus.Pending,
            AppliedAt = DateTime.UtcNow
        };

        var created = await _applicationRepository.CreateAsync(application);

        return new ApplicationResponseDto
        {
            Id = created.Id,
            JobTitle = job.Title,
            CandidateName = created.Candidate?.FullName ?? string.Empty,
            CVFilePath = created.CVFilePath,
            Status = created.Status.ToString(),
            AppliedAt = created.AppliedAt
        };
    }

    public async Task<List<ApplicationResponseDto>> GetMyApplicationsAsync(Guid candidateId)
    {
        var applications = await _applicationRepository.GetByCandidateIdAsync(candidateId);

        return applications.Select(a => new ApplicationResponseDto
        {
            Id = a.Id,
            JobTitle = a.Job?.Title ?? string.Empty,
            CandidateName = a.Candidate?.FullName ?? string.Empty,
            CVFilePath = a.CVFilePath,
            Status = a.Status.ToString(),
            AppliedAt = a.AppliedAt
        }).ToList();
    }

    public async Task UpdateStatusAsync(Guid applicationId, string status, Guid recruiterId)
    {
        if (!Enum.TryParse<ApplicationStatus>(status, ignoreCase: true, out var parsedStatus))
            throw new ArgumentException($"Invalid status '{status}'. Use: Pending, Accepted, or Rejected.");

        var application = await _applicationRepository.GetByIdAsync(applicationId)
            ?? throw new KeyNotFoundException("Application not found.");

        if (application.Job?.RecruiterId != recruiterId)
            throw new UnauthorizedAccessException("You are not authorised to update this application.");

        application.Status = parsedStatus;
        await _applicationRepository.UpdateAsync(application);
    }

    public async Task<List<ApplicantResponseDto>> GetApplicantsForJobAsync(Guid jobId, Guid recruiterId)
    {
        var job = await _jobRepository.GetByIdAsync(jobId)
            ?? throw new KeyNotFoundException("Job not found.");

        if (job.RecruiterId != recruiterId)
            throw new UnauthorizedAccessException("You are not authorised to view applicants for this job.");

        var applications = await _applicationRepository.GetByJobIdAsync(jobId);

        return applications.Select(a => new ApplicantResponseDto
        {
            Id = a.Id,
            CandidateName = a.Candidate?.FullName ?? string.Empty,
            CandidateEmail = a.Candidate?.Email ?? string.Empty,
            Status = a.Status.ToString(),
            AppliedAt = a.AppliedAt,
            CVFilePath = a.CVFilePath
        }).ToList();
    }
}