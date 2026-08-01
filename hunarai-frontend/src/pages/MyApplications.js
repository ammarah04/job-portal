import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_BASE = "https://localhost:7259/api";

function statusStyle(status) {
  const normalized = status?.toLowerCase();
  if (normalized === "accepted") {
    return "bg-green-50 text-green-700 border border-green-200";
  }
  if (normalized === "rejected") {
    return "bg-red-50 text-red-600 border border-red-200";
  }
  // pending, or any other/unknown status
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

function ApplicationCard({ application, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      className="bg-white border border-sand rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-ink">{application.jobTitle}</p>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle(
            application.status
          )}`}
        >
          {application.status}
        </span>
      </div>
      <p className="text-xs text-stone">
        Applied on {formatDate(application.appliedAt)}
      </p>
    </motion.div>
  );
}

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${API_BASE}/applications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Please log in as a Candidate first.");
        } else if (err.response?.status === 403) {
          setError("Only Candidates can view applications.");
        } else {
          setError("Something went wrong loading your applications.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-stone text-sm">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-8 md:px-12">
      <Navbar />

      <div className="max-w-3xl mx-auto">
        <p className="text-sm font-medium text-ink mb-6">My Applications</p>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4"
          >
            {error}
          </motion.p>
        )}

        {!error && applications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-stone bg-white border border-sand rounded-xl p-6 text-center"
          >
            You haven't applied to any jobs yet. Head to the Jobs page to get started.
          </motion.div>
        )}

        {!error && applications.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {applications.map((application, i) => (
              <ApplicationCard
                key={application.id}
                application={application}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}