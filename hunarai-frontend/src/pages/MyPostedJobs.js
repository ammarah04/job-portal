import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// MOCK DATA — replace with a real API call once the backend
// endpoint for "get jobs posted by the logged-in recruiter"
// exists. Expected real endpoint: GET /api/jobs/mine (or similar)
const MOCK_JOBS = [
  {
    id: "job-1",
    title: "ASP.NET Core Backend Developer",
    location: "Remote",
    salary: 180000,
    jobType: "Full-time",
    applicantCount: 4,
    createdAt: "2026-07-15T10:00:00Z",
  },
  {
    id: "job-2",
    title: "React Frontend Developer",
    location: "Islamabad, Pakistan",
    salary: 150000,
    jobType: "Full-time",
    applicantCount: 2,
    createdAt: "2026-07-20T10:00:00Z",
  },
  {
    id: "job-3",
    title: "Python AI Engineer",
    location: "Remote",
    salary: 220000,
    jobType: "Contract",
    applicantCount: 7,
    createdAt: "2026-07-25T10:00:00Z",
  },
];

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function JobRow({ job, index, onViewApplicants, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      className="bg-white border border-sand rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-ink mb-1">{job.title}</p>
          <p className="text-xs text-stone">
            {job.location} · {job.jobType} · Posted {formatDate(job.createdAt)}
          </p>
        </div>
        <span className="bg-sand/50 text-gold text-xs font-medium px-2.5 py-1 rounded-full">
          PKR {job.salary?.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => onViewApplicants(job)}
          className="flex-1 bg-gold hover:bg-gold/90 text-ink text-xs font-medium py-2 rounded-lg transition-colors duration-150"
        >
          View Applicants ({job.applicantCount})
        </button>
        <button
          onClick={() => onEdit(job)}
          className="px-3 py-2 border border-sand rounded-lg text-xs text-ink hover:border-gold transition-colors duration-150"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(job)}
          className="px-3 py-2 border border-red-200 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors duration-150"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
}

export default function MyPostedJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MOCK: simulate a fetch delay. Replace this block with:
    // const res = await axios.get(`${API_BASE}/jobs/mine`, { headers: {...} });
    // setJobs(res.data);
    const timer = setTimeout(() => {
      setJobs(MOCK_JOBS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleViewApplicants = (job) => {
    navigate(`/my-jobs/${job.id}/applicants`, {
      state: { jobTitle: job.title },
    });
  };

  const handleEdit = (job) => {
    // TODO: wire to an actual edit form/page once backend supports job updates
    alert(`Edit flow not built yet for: ${job.title}`);
  };

  const handleDelete = (job) => {
    // TODO: wire to DELETE /api/jobs/{id} once confirmed
    if (window.confirm(`Delete "${job.title}"? This cannot be undone.`)) {
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-stone text-sm">Loading your posted jobs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-8 md:px-12">
      <Navbar />

      <div className="max-w-3xl mx-auto">
        <p className="text-sm font-medium text-ink mb-6">My Posted Jobs</p>

        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-stone bg-white border border-sand rounded-xl p-6 text-center"
          >
            You haven't posted any jobs yet.
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job, i) => (
              <JobRow
                key={job.id}
                job={job}
                index={i}
                onViewApplicants={handleViewApplicants}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}