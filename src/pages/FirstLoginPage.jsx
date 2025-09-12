// src/pages/FirstLoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import { authAPI } from "../services/api";

const readUserFromStorage = () => {
  try {
    const raw =
      sessionStorage.getItem("auth_user") || localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function FirstLoginPage() {
  const { user, setUser } = useAuthStore();
  const effectiveUser = user || readUserFromStorage();
  const email = effectiveUser?.email || effectiveUser?.username || ""; // adjust if your field differs

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!email) return toast.error("No email found for this account.");
    if (!currentPwd) return toast.error("Enter your current password.");
    if (!newPwd || newPwd.length < 6) return toast.error("New password must be at least 6 characters.");
    if (newPwd !== confirm) return toast.error("Passwords do not match.");

    try {
      setLoading(true);

      // This matches your backend: email + currentPassword + newPassword
      await authAPI.firstLoginSetPassword({
        email,
        currentPassword: currentPwd,
        newPassword: newPwd,
      });

      // Backend already sets mustChangePassword = false. Update locally:
      const nextUser = { ...effectiveUser, mustChangePassword: false };
      setUser(nextUser);

      const sync = (store) => {
        const raw = store.getItem("auth_user");
        if (!raw) return;
        const obj = JSON.parse(raw);
        obj.mustChangePassword = false;
        store.setItem("auth_user", JSON.stringify(obj));
      };
      sync(sessionStorage);
      sync(localStorage);

      toast.success("Password updated");

      // role-based exit
      const r = (nextUser.role || "").toLowerCase();
      if (r === "superadmin") navigate("/superadmin", { replace: true });
      else if (r === "admin") navigate("/admin", { replace: true });
      else if (r === "instructor") navigate("/instructor", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Failed to update password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>

      <input
        className="border rounded w-full p-2 mb-3"
        type="email"
        value={email}
        readOnly
        placeholder="Email"
      />
      <input
        className="border rounded w-full p-2 mb-3"
        type="password"
        placeholder="Current password"
        value={currentPwd}
        onChange={(e) => setCurrentPwd(e.target.value)}
      />
      <input
        className="border rounded w-full p-2 mb-3"
        type="password"
        placeholder="New password"
        value={newPwd}
        onChange={(e) => setNewPwd(e.target.value)}
      />
      <input
        className="border rounded w-full p-2 mb-4"
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <button
        onClick={save}
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded p-2"
      >
        {loading ? "Saving..." : "Save and continue"}
      </button>
    </div>
  );
}
