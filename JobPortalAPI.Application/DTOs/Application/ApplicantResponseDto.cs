namespace JobPortalAPI.Application.DTOs.Application;

public class ApplicantResponseDto
{
    public Guid Id { get; set; }
    public string CandidateName { get; set; } = null!;
    public string CandidateEmail { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime AppliedAt { get; set; }
    public string CVFilePath { get; set; } = null!;
}