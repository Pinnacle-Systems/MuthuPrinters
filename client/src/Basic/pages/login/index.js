import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { PRODUCT_ADMIN_HOME_PATH } from "../../../Route/urlPaths";
import { LOGIN_API } from "../../../Api";
import Loader from "../../components/Loader";
import { generateSessionId } from "../../../Utils/helper";
import Modal from "../../../UiComponents/Modal";
import { BranchAndFinyearForm } from "../../components";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import pinnacleLogo from "../../../assets/pinnacle.png";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isGlobalOpen, setIsGlobalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [planExpirationDate, setPlanExpirationDate] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!username) errors.username = "Username is required";
    if (!password) errors.password = "Password is required";
    return errors;
  };

  const data = { username, password };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validateErrors = validate();
    setErrors(validateErrors);
    if (Object.keys(validateErrors).length === 0) {
      // setLoading(true);
      axios({
        method: "post",
        url: BASE_URL + LOGIN_API,
        data: data,
      }).then(
        (result) => {
          if (result.status === 200) {
            if (result.data.statusCode === 0) {
              sessionStorage.setItem("sessionId", generateSessionId());
              if (!result.data.userInfo.roleId) {
                secureLocalStorage.setItem(
                  sessionStorage.getItem("sessionId") + "userId",
                  result.data.userInfo.id,
                );
                secureLocalStorage.setItem(
                  sessionStorage.getItem("sessionId") + "username",
                  result.data.userInfo.username,
                );
                secureLocalStorage.setItem(
                  sessionStorage.getItem("sessionId") + "userType",
                  result.data.userInfo.userType,
                );
                secureLocalStorage.setItem(
                  sessionStorage.getItem("sessionId") + "partyId",
                  result.data.userInfo.partyType,
                );
                secureLocalStorage.setItem(
                  sessionStorage.getItem("sessionId") + "superAdmin",
                  true,
                );
                navigate(PRODUCT_ADMIN_HOME_PATH);
              } else {
                const subscriptions =
                  result.data.userInfo.role?.company?.Subscription ?? [];
                const latestSubscription = subscriptions[0] ?? null;
                const currentPlanActive =
                  subscriptions.some((sub) => sub.planStatus);

                if (!latestSubscription?.expireAt) {
                  toast.error("No subscription is configured for this company.");
                  setLoading(false);
                  return;
                }

                if (currentPlanActive) {
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") + "employeeId",
                    result.data.userInfo.employeeId,
                  );
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") + "userId",
                    result.data.userInfo.id,
                  );
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") + "username",
                    result.data.userInfo.username,
                  );
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") + "userEmail",
                    result.data.userInfo.email,
                  );
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") + "userCompanyId",
                    result.data.userInfo.role.companyId,
                  );
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") + "defaultAdmin",
                    JSON.stringify(result.data.userInfo.role.defaultRole),
                  );
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") + "userRoleId",
                    result.data.userInfo.roleId,
                  );
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") + "partyId",
                    result.data.userInfo.partyType,
                  );
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") +
                      "latestActivePlanExpireDate",
                    new Date(latestSubscription.expireAt).toDateString(),
                  );
                  secureLocalStorage.setItem(
                    sessionStorage.getItem("sessionId") + "userRole",
                    result.data.userInfo.role.name,
                  );
                  setIsGlobalOpen(true);
                } else {
                  const expireDate = new Date(latestSubscription.expireAt);
                  setPlanExpirationDate(expireDate.toDateString());
                }
              }
            } else {
              toast.error(result.data.message);
              setLoading(false);
            }
          }
        },
        (error) => {
          toast.error("Server Down", { autoClose: 5000 });
          setLoading(false);
        },
      );
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Modal
        isOpen={isGlobalOpen}
        onClose={() => setIsGlobalOpen(false)}
        widthClass=""
      >
        <BranchAndFinyearForm setIsGlobalOpen={setIsGlobalOpen} />
      </Modal>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 relative overflow-hidden">
        {/* BACKGROUND GLOW BLOBS */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[420px] h-[420px] bg-orange-400/40 rounded-full blur-[120px] animate-blob"></div>
          <div className="absolute -bottom-40 -right-40 w-[420px] h-[420px] bg-amber-300/40 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        </div>

        {/* GRID */}
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center px-6">
          {/* LEFT SIDE */}
          <div className="hidden md:block space-y-7">
            <img src={pinnacleLogo} className="h-14 mb-2" />

            <h1 className="text-5xl font-bold text-slate-900 leading-tight">
              Smart ERP for
              <span className="block bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Modern Business
              </span>
            </h1>

            <p className="text-slate-600 text-lg max-w-md">
              Powerful ERP platform designed for textile industries, POS
              systems, and real-time analytics.
            </p>

            {/* FEATURES */}
            <div className="space-y-4 mt-6">
              {[
                "Real-time analytics dashboard",
                "Inventory + POS integration",
                "Multi-branch management",
                "Cloud-based secure system",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-md"></div>
                  <span className="text-slate-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/40 backdrop-blur-2xl border border-orange-200/40 rounded-3xl p-8 shadow-[0_25px_80px_rgba(255,115,0,0.25)]">
              {/* LOGO */}
              <div className="flex justify-center mb-6">
                <img src={pinnacleLogo} className="h-12" />
              </div>

              {/* HEADER */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-semibold text-slate-900 mb-1">
                  Welcome Back
                </h2>
                <p className="text-slate-600 text-sm">
                  Login to continue your dashboard
                </p>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* USERNAME */}
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-orange-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full pl-12 pr-4 py-3 bg-white/60 border border-orange-100 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-orange-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-12 pr-12 py-3 bg-white/60 border border-orange-100 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3 text-slate-400 hover:text-orange-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white font-semibold shadow-lg hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.97] transition-all"
                >
                  Login
                </button>
              </form>

              {/* FOOTER */}
              <div className="mt-6 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} Pinnacle Systems
              </div>
            </div>
          </div>
        </div>

        {/* ANIMATION */}
        <style jsx>{`
          @keyframes blob {
            0% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(40px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-30px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0, 0) scale(1);
            }
          }
          .animate-blob {
            animation: blob 10s infinite ease-in-out;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    </>
  );
};

export default Login;
