using JobPortalAPI.Domain.Entities;
using JobPortalAPI.Application.DTOs.Job;

namespace JobPortalAPI.Application.Interfaces;

public interface IJobRepository
{
    Task<Job> CreateAsync(Job job);
    Task<Job?> GetByIdAsync(Guid id);
    Task<List<Job>> GetByRecruiterIdAsync(Guid recruiterId);
    Task<(List<Job> Jobs, int TotalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? location,
        string? jobType,
        decimal? minSalary,
        decimal? maxSalary);
    Task<Job> UpdateAsync(Job job);
    Task DeleteAsync(Job job);
}