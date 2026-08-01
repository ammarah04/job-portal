import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// ─────────────────────────────────────────────────────────────
// MOCK DATA — replace with a real API call once the backend
// endpoint for "get applicants for a specific job" exists.
// Expected real endpoint: GET /api/jobs/{jobId}/applications (or similar)
//
// Accept/Reject already has a real backend endpoint ready:
// PUT /api/applications/{id}/status  [Authorize(Roles = "Recruiter")]
// body: { status: "Accepted" | "Rejected" }
// ─────────────────────────────────────────────────────────────
const MOCK_APPLICANTS = [
  {
    id: "app-1",
    candidateName: "Muhammad Uzair Ali",
    candidateEmail: "m.uzairalics@gmail.com",
    status: "Pending",
    appliedAt: "2026-07-28T09:00:00Z",
    matchPercentage: 72.1,
    cvFilePath: "cvs/abc123_resumeAlpha.pdf",
  },
  {
    id: "app-2",
    candidateName: "Ayesha Khan",
    candidateEmail: "ayesha.khan@example.com",
    status: "Pending",
    appliedAt: "2026-07-29T14:30:00Z",
    matchPercentage: 65.4,
    cvFilePath: "cvs/def456_ayesha_resume.pdf",
  },
  {
    id: "app-3",
    candidateName: "Bilal Ahmed",
    candidateEmail: "bilal.ahmed@example.com",
    status: "Accepted",
    appliedAt: "2026-07-26T11:15:00Z",
    matchPercentage: 88.0,
    cvFilePath: "cvs/ghi789_bilal_cv.pdf",
  },
];

function statusStyle(status) {
  const normalized = status?.toLowerCase();
  if (normalized === "accepted") {
    return "bg-green-50 text-green-700 border border-green-200";
  }
  if (normalized === "rejected") {
    return "bg-red-50 text-red-600 border border-red-200";
  }
  return "bg-sand/50 text-gold border border-sand";
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ApplicantCard({ applicant, index, onAccept, onReject, actionState }) {
  const isPending = applicant.status === "Pending";
  const isBusy = actionState === "accepting" || actionState === "rejecting";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      className="bg-white border border-sand rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-ink">{applicant.candidateName}</p>
          <p className="text-xs text-stone">{applicant.candidateEmail}</p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle(
            applicant.status
          )}`}
        >
          {applicant.status}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <p className="text-xs text-stone">
          Applied {formatDate(applicant.appliedAt)}
        </p>
        {applicant.matchPercentage != null && (
          <p className="text-xs text-gold font-medium">
            {applicant.matchPercentage}% match
          </p>
        )}
      </div>

      {isPending && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAccept(applicant)}
            disabled={isBusy}
            className="flex-1 bg-gold hover:bg-gold/90 disabled:opacity-60 text-ink text-xs font-medium py-2 rounded-lg transition-colors duration-150"
          >
            {actionState === "accepting" ? "Accepting..." : "Accept"}
          </button>
          <button
            onClick={() => onReject(applicant)}
            disabled={isBusy}
            className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 text-xs font-medium py-2 rounded-lg transition-colors duration-150"
          >
            {actionState === "rejecting" ? "Rejecting..." : "Reject"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function JobApplicants() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const jobTitle = location.state?.jobTitle;

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStates, setActionStates] = useState({}); // { [applicantId]: "accepting" | "rejecting" }

  useEffect(() => {
    // MOCK: simulate a fetch delay. Replace this block with:
    // const res = await axios.get(`${API_BASE}/jobs/${jobId}/applications`, { headers: {...} });
    // setApplicants(res.data);
    const timer = setTimeout(() => {
      setApplicants(MOCK_APPLICANTS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [jobId]);

  const updateStatus = async (applicant, newStatus, actionLabel) => {
    setActionStates((prev) => ({ ...prev, [applicant.id]: actionLabel }));

    // MOCK: this is where the real call goes once wired up:
    //
    // const token = localStorage.getItem("token");
    // await axios.put(
    //   `${API_BASE}/applications/${applicant.id}/status`,
    //   { status: newStatus },
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );

    await new Promise((r) => setTimeout(r, 500)); // simulate network delay

    setApplicants((prev) =>
      prev.map((a) => (a.id === applicant.id ? { ...a, status: newStatus } : a))
    );
    setActionStates((prev) => {
      const next = { ...prev };
      delete next[applicant.id];
      return next;
    });
  };

  const handleAccept = (applicant) => updateStatus(applicant, "Accepted", "accepting");
  const handleReject = (applicant) => updateStatus(applicant, "Rejected", "rejecting");

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-stone text-sm">Loading applicants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-8 md:px-12">
      <Navbar />

      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/my-jobs")}
          className="text-xs text-stone hover:text-ink transition-colors duration-150 mb-4"
        >
          ← Back to My Posted Jobs
        </button>

        <p className="text-sm font-medium text-ink mb-1">
          Applicants{jobTitle ? ` — ${jobTitle}` : ""}
        </p>
        <p className="text-xs text-stone mb-6">
          {applicants.length} candidate{applicants.length !== 1 ? "s" : ""} applied
        </p>

        {applicants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-stone bg-white border border-sand rounded-xl p-6 text-center"
          >
            No applicants yet for this job.
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {applicants.map((applicant, i) => (
              <ApplicantCard
                key={applicant.id}
                applicant={applicant}
                index={i}
                onAccept={handleAccept}
                onReject={handleReject}
                actionState={actionStates[applicant.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}