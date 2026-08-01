import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_BASE = "https://localhost:7259/api";

// One of: "idle" | "uploading" | "applying" | "applied" | "already-applied" | "error"
function ApplyButton({ job, status, onApply }) {
  const fileInputRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation(); // don't trigger the card's onClick (goToSkillGap)
    if (status === "applied" || status === "already-applied") return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onApply(job, file);
    e.target.value = ""; // allow re-selecting the same file later if it errors
  };

  const labels = {
    idle: "Apply to job",
    uploading: "Uploading resume...",
    applying: "Submitting application...",
    applied: "Applied ✓",
    "already-applied": "Already applied",
    error: "Failed — try again",
  };

  const isDisabled = status === "uploading" || status === "applying" || status === "applied" || status === "already-applied";

  return (
    <>
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`w-full text-xs font-medium py-2 rounded-lg transition-colors duration-150 mt-3 ${
          status === "applied" || status === "already-applied"
            ? "bg-sand/50 text-stone cursor-default"
            : status === "error"
            ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            : "bg-gold hover:bg-gold/90 text-ink disabled:opacity-60"
        }`}
      >
        {labels[status] || labels.idle}
      </button>
    </>
  );
}

function JobCard({ job, index, onClick, applyStatus, onApply }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="bg-white border border-sand rounded-xl p-4 cursor-pointer transition-shadow duration-200 hover:shadow-md"
    >
      <p className="text-sm font-medium text-ink mb-1">{job.title}</p>
      <p className="text-xs text-stone mb-3">
        {job.recruiterName} · {job.location}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone">{job.jobType}</span>
        <span className="bg-sand/50 text-gold text-xs font-medium px-2.5 py-1 rounded-full">
          PKR {job.salary?.toLocaleString()}
        </span>
      </div>
      <ApplyButton job={job} status={applyStatus} onApply={onApply} />
    </motion.div>
  );
}

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minSalary, setMinSalary] = useState(0);

  // tracks apply status per job id, e.g. { "job-guid-1": "applied" }
  const [applyStatuses, setApplyStatuses] = useState({});

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/jobs?page=1&pageSize=50`);
        setJobs(res.data.items);
      } catch (err) {
        console.error("Failed to fetch jobs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const goToSkillGap = (job) => {
    navigate("/skill-gap", {
      state: { jobId: job.id, jobTitle: `${job.title} @ ${job.recruiterName}` },
    });
  };

  const handleApply = async (job, file) => {
    const token = localStorage.getItem("token");
    const setStatus = (status) =>
      setApplyStatuses((prev) => ({ ...prev, [job.id]: status }));

    setStatus("uploading");

    try {
      // 1. Upload the resume, same pattern as Skill Gap
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axios.post(`${API_BASE}/files/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      const cvFilePath = uploadRes.data.filePath;

      // 2. Submit the application
      setStatus("applying");

      await axios.post(
        `${API_BASE}/applications`,
        { jobId: job.id, cvFilePath },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStatus("applied");
    } catch (err) {
      if (err.response?.status === 409) {
        setStatus("already-applied");
      } else if (err.response?.status === 401) {
        alert("Please log in as a Candidate first.");
        setStatus("idle");
      } else if (err.response?.status === 403) {
        alert("Only Candidates can apply to jobs.");
        setStatus("idle");
      } else {
        setStatus("error");
      }
    }
  };

  const filteredJobs = useMemo(
    () => jobs.filter((job) => job.salary >= minSalary),
    [jobs, minSalary]
  );

  const stats = useMemo(() => {
    if (jobs.length === 0) return { count: 0, maxSalary: 0 };
    const maxSalary = Math.max(...jobs.map((j) => j.salary || 0));
    return { count: jobs.length, maxSalary };
  }, [jobs]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-stone text-sm">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-8 md:px-12">
      <Navbar />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-ink rounded-xl p-4"
        >
          <p className="text-xs text-stone mb-1">Total jobs</p>
          <p className="text-2xl font-medium text-gold">{stats.count}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-sand/40 rounded-xl p-4"
        >
          <p className="text-xs text-stone mb-1">Top salary</p>
          <p className="text-2xl font-medium text-ink">
            PKR {stats.maxSalary?.toLocaleString()}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-sand/40 rounded-xl p-4"
        >
          <p className="text-xs text-stone mb-1">Analyze your fit</p>
          <p className="text-2xl font-medium text-ink">Skill Gap →</p>
        </motion.div>
      </div>

      {jobs.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink">Latest jobs</p>
            <div className="flex gap-2">
              <button
                onClick={scrollPrev}
                className="w-7 h-7 rounded-full border border-sand flex items-center justify-center text-stone hover:bg-white transition-colors duration-150"
              >
                ‹
              </button>
              <button
                onClick={scrollNext}
                className="w-7 h-7 rounded-full border border-sand flex items-center justify-center text-stone hover:bg-white transition-colors duration-150"
              >
                ›
              </button>
            </div>
          </div>
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {jobs.map((job, i) => (
                <div key={job.id} className="min-w-[220px] flex-shrink-0">
                  <JobCard
                    job={job}
                    index={i}
                    onClick={() => goToSkillGap(job)}
                    applyStatus={applyStatuses[job.id] || "idle"}
                    onApply={handleApply}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        <div>
          <p className="text-sm font-medium text-ink mb-4">Filters</p>
          <label className="block text-xs font-medium text-ink mb-2">
            Min salary (PKR)
          </label>
          <input
            type="range"
            min="0"
            max="500000"
            step="10000"
            value={minSalary}
            onChange={(e) => setMinSalary(Number(e.target.value))}
            className="w-full accent-gold mb-1"
          />
          <p className="text-xs text-stone">{minSalary.toLocaleString()}+</p>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-4">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
          </p>

          {filteredJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-stone bg-white border border-sand rounded-xl p-6 text-center"
            >
              No jobs match these filters. Try lowering the threshold.
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredJobs.map((job, i) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={i}
                  onClick={() => goToSkillGap(job)}
                  applyStatus={applyStatuses[job.id] || "idle"}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}