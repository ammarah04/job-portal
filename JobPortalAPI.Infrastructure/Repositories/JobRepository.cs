using JobPortalAPI.Application.Interfaces;
using JobPortalAPI.Domain.Entities;
using JobPortalAPI.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobPortalAPI.Infrastructure.Repositories;

public class JobRepository : IJobRepository
{
    private readonly AppDbContext _context;

    public JobRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Job> CreateAsync(Job job)
    {
        await _context.Jobs.AddAsync(job);
        await _context.SaveChangesAsync();
        return job;
    }

    public async Task<Job?> GetByIdAsync(Guid id)
    {
        return await _context.Jobs
            .Include(j => j.Recruiter)
            .FirstOrDefaultAsync(j => j.Id == id);
    }

    public async Task<(List<Job> Jobs, int TotalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? location,
        string? jobType,
        decimal? minSalary,
        decimal? maxSalary)
    {
        var query = _context.Jobs
            .Include(j => j.Recruiter)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(location))
            query = query.Where(j => j.Location.Contains(location));

        if (!string.IsNullOrWhiteSpace(jobType))
            query = query.Where(j => j.JobType == jobType);

        if (minSalary.HasValue)
            query = query.Where(j => j.Salary >= minSalary.Value);

        if (maxSalary.HasValue)
            query = query.Where(j => j.Salary <= maxSalary.Value);

        var totalCount = await query.CountAsync();

        var jobs = await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (jobs, totalCount);
    }

    public async Task<Job> UpdateAsync(Job job)
    {
        var existing = await _context.Jobs.FindAsync(job.Id)
            ?? throw new KeyNotFoundException($"Job with ID {job.Id} was not found.");

        existing.Title = job.Title;
        existing.Description = job.Description;
        existing.Salary = job.Salary;
        existing.Location = job.Location;
        existing.JobType = job.JobType;
        existing.ExpiryDate = job.ExpiryDate;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteAsync(Job job)
    {
        _context.Jobs.Remove(job);
        await _context.SaveChangesAsync();
    }
    public async Task<List<Job>> GetByRecruiterIdAsync(Guid recruiterId)
    {
        return await _context.Jobs
            .Include(j => j.Recruiter)
            .Where(j => j.RecruiterId == recruiterId)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();
    }
}