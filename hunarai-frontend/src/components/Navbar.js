import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const linkClass = (path) =>
    `text-sm transition-colors duration-150 ${
      location.pathname === path
        ? "text-ink font-medium"
        : "text-stone hover:text-ink"
    }`;

    const role = localStorage.getItem("role");

  return (
    <div className="flex items-center justify-between mb-8">
      <Link to="/jobs" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-gold flex items-center justify-center">
          <span className="text-ink font-semibold text-sm">H</span>
        </div>
        <span className="text-ink font-medium">HunarAI</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/jobs" className={linkClass("/jobs")}>
          Jobs
        </Link>
        {role === "Candidate" && (
          <Link to="/skill-gap" className={linkClass("/skill-gap")}>
            Skill Gap
          </Link>
        )}
        {role === "Candidate" && (
          <Link to="/my-applications" className={linkClass("/my-applications")}>
            My Applications
          </Link>
        )}
        {role === "Recruiter" && (
          <Link to="/post-job" className={linkClass("/post-job")}>
            Post Job
          </Link>
        )}
        {role === "Recruiter" && (
          <Link to="/my-jobs" className={linkClass("/my-jobs")}>
            My Jobs
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-stone hover:text-ink transition-colors duration-150"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
