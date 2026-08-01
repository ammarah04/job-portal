using JobPortalAPI.Application.DTOs.Job;
using JobPortalAPI.Application.Common;

namespace JobPortalAPI.Application.Interfaces;

public interface IJobService
{
    Task<JobResponseDto> CreateJobAsync(CreateJobDto dto, Guid recruiterId);
    Task<PagedResult<JobResponseDto>> GetJobsAsync(int page, int pageSize, string? location, string? jobType, decimal? minSalary, decimal? maxSalary);
    Task<JobResponseDto> GetJobByIdAsync(Guid id);
    Task<JobResponseDto> UpdateJobAsync(Guid id, CreateJobDto dto, Guid recruiterId);
    Task DeleteJobAsync(Guid id, Guid recruiterId);
    Task<List<JobResponseDto>> GetMyJobsAsync(Guid recruiterId);
}