import { useState } from "react";
import { sendPasswordResetEmail, signOut } from "firebase/auth";

import { auth } from "../../firebase";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { logout } from "../../features/authSlice";
import { clearProfile } from "../../features/profileSlice";
import Header from "../../components/Header/Header";
import ResetPassword from "../../components/ResetPassword/ResetPassword";
import ProfileCard from "../../components/ProfileCard/ProfileCard";

const Profile = () => {
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<
    string | null
  >(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(
    null
  );
  const [resetPassword, setResetPassword] = useState(false);

  const { user } = useAppSelector((state) => state.auth);
  const {
    data: profile,
    loading,
    error,
  } = useAppSelector((state) => state.profile);

  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
    dispatch(clearProfile());
  };

  const handlePasswordReset = async () => {
    if (!resetPasswordEmail.length) return;
    try {
      await sendPasswordResetEmail(auth, resetPasswordEmail);
      setResetPasswordSuccess(
        "Password reset email sent. Please check your inbox."
      );
      setResetPasswordError(null);
    } catch (error: any) {
      setResetPasswordError(error.message);
      setResetPasswordSuccess(null);
    }
  };

  // useEffect(() => {
  //   if (Boolean(!user)) {
  //     navigate("/auth");
  //   }
  // }, [navigate, user]);

  return (
    <>
      <Header />
      <ResetPassword
        handlePasswordReset={handlePasswordReset}
        isOpen={resetPassword}
        onClose={() => setResetPassword(false)}
        resetPasswordEmail={resetPasswordEmail}
        resetPasswordError={resetPasswordError}
        resetPasswordSuccess={resetPasswordSuccess}
        setResetPasswordEmail={setResetPasswordEmail}
      />
      {user && (
        <ProfileCard
          setResetPassword={() => setResetPassword(true)}
          profile={profile}
          user={user}
          handleLogout={handleLogout}
        />
      )}
    </>
  );
};

export default Profile;
