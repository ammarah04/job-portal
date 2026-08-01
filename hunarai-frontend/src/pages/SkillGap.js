import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import * as signalR from "@microsoft/signalr";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE = "https://localhost:7259/api";
const HUB_URL = "https://localhost:7259/hubs/skillgap";

function CircularGauge({ percent }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#2A2622" strokeWidth="8" />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#C9973A"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold text-cream"
        >
          {Math.round(percent)}%
        </motion.span>
      </div>
    </div>
  );
}

function matchLabel(percent) {
  if (percent >= 85) return "Strong match";
  if (percent >= 60) return "Moderate match";
  return "Needs development";
}

function learnLink(skill) {
  return `https://www.youtube.com/results?search_query=learn+${encodeURIComponent(skill)}`;
}

export default function SkillGap() {
  const location = useLocation();
  const passedJob = location.state;

  const [file, setFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(passedJob?.jobId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);

  // keep the active SignalR connection across renders
  const connectionRef = useRef(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/jobs?page=1&pageSize=50`);
        setJobs(res.data.items);
        if (res.data.items.length > 0 && !passedJob) {
          setJobId(res.data.items[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch jobs", err);
      }
    };
    fetchJobs();

    // make sure we don't leave a dangling connection if the user navigates away mid-analysis
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a resume PDF first.");
      return;
    }
    if (!jobId) {
      setError("Please select a job to compare against.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    setProgress(null);

    const token = localStorage.getItem("token");
    let connection;

    try {
      // 1. Open the real SignalR connection before kicking off analysis
      connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .build();

      connectionRef.current = connection;

      // 2. Listen for live progress pushed from SkillGapController
      connection.on("AnalysisProgress", (data) => {
        setProgress(data);
      });

      await connection.start();
      const connectionId = connection.connectionId;
      await connection.invoke("JoinAnalysis", connectionId);

      // 3. Upload the CV
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axios.post(`${API_BASE}/files/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      const cvFilePath = uploadRes.data.filePath;

      // 4. Kick off analysis, passing the connectionId so the backend
      //    knows which SignalR client to push progress updates to
      const skillGapRes = await axios.post(
        `${API_BASE}/skillgap`,
        { jobId, cVFilePath: cvFilePath, connectionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProgress({ message: "Analysis complete!", percent: 100 });
      setResult(skillGapRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please log in as a Candidate first.");
      } else if (err.response?.status === 403) {
        setError("Only Candidates can analyze skill gaps. Please login as a Candidate.");
      } else {
        setError("Something went wrong analyzing your resume. Please try again.");
      }
    } finally {
      setLoading(false);
      if (connection) {
        await connection.stop();
      }
      connectionRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-cream px-6 py-8 md:px-12">
      <Navbar />

      <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <label className="block text-xs font-medium text-ink mb-2">
              Compare against
            </label>

            {passedJob && (
              <p className="text-xs text-stone mb-2">
                Pre-selected from Jobs page:{" "}
                <span className="text-ink">{passedJob.jobTitle}</span>
              </p>
            )}

            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full border border-sand rounded-lg px-3 py-2.5 text-sm mb-4 bg-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            >
              {jobs.length === 0 && <option value="">Loading jobs...</option>}
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} @ {job.recruiterName}
                </option>
              ))}
            </select>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-sand rounded-2xl p-8 text-center bg-white transition-colors duration-200 hover:border-gold/60 mb-4"
            >
              <input
                type="file"
                accept="application/pdf"
                id="resume-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                {file ? (
                  <>
                    <p className="text-sm font-medium text-ink mb-1">{file.name}</p>
                    <p className="text-xs text-stone">Click to choose a different file</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-ink mb-1">Drop your resume here</p>
                    <p className="text-xs text-stone">or click to browse (PDF only)</p>
                  </>
                )}
              </label>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4"
              >
                {error}
              </motion.p>
            )}

            {progress && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-white border border-sand rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-ink">{progress.message}</p>
                  <p className="text-xs text-gold font-medium">{progress.percent}%</p>
                </div>
                <div className="w-full bg-sand rounded-full h-1.5">
                  <motion.div
                    className="bg-gold h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gold hover:bg-gold/90 disabled:opacity-60 text-ink text-sm font-medium py-3 rounded-lg transition-colors duration-200 mb-10"
            >
              {loading ? "Analyzing..." : "Analyze skill gap"}
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-6 bg-ink rounded-2xl p-6 mb-6">
                  <CircularGauge percent={result.match_percentage} />
                  <div>
                    <p className="text-sm font-medium text-cream mb-1">
                      {matchLabel(result.match_percentage)}
                    </p>
                    <p className="text-xs text-stone leading-relaxed">{result.feedback}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-ink mb-3">Matched skills</p>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-sand/50 text-gold text-xs font-medium px-3 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink mb-3">Missing skills</p>
                    <div className="flex flex-col gap-2">
                      {result.missing_skills.map((skill) => (
                        <a
                          key={skill}
                          href={learnLink(skill)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between border border-sand rounded-lg px-3 py-2 text-sm text-ink hover:border-gold transition-colors duration-150"
                        >
                          <span>{skill}</span>
                          <span className="text-gold text-xs">Learn →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}