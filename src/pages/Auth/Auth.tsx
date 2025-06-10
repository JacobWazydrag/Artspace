import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  setDoc,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { formClasses } from "../../classes/tailwindClasses";
import { auth, db } from "../../firebase";
import { authFormSchema } from "../../models/Form";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { login } from "../../features/authSlice";
import { fetchUserProfile } from "../../features/profileSlice";
import ResetPassword from "../../components/ResetPassword/ResetPassword";
import { toast } from "react-hot-toast";

interface FormValues {
  email: string;
  password: string;
  confirmPassword?: string;
}

const Auth = () => {
  const [authType, setAuthType] = useState<"login" | "sign-up">("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const [resetPassword, setResetPassword] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<
    string | null
  >(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(
    null
  );

  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (Boolean(user)) {
      navigate("/");
    }
  }, [user, navigate]);

  const {
    container,
    form,
    buttonHoverPurple,
    authInput,
    text,
    link,
    hrReverseDark,
    forgotPasswordButton,
  } = formClasses;

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

  const checkUserExistsByEmail = async (email: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // First, get the email from Google without creating a Firebase user
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email) {
        toast.error("No email provided by Google");
        await signOut(auth);
        return;
      }

      // Check if user exists in our database
      const userExists = await checkUserExistsByEmail(email);

      if (!userExists) {
        // If user doesn't exist, show message to sign up instead
        toast.error("No account found. Please sign up instead.");
        await signOut(auth);
        return;
      }

      // User exists, proceed with login
      dispatch(
        login({
          email: result.user.email!,
          id: result.user.uid,
          photoURL: result.user.photoURL || null,
        })
      );

      // Fetch the existing profile
      dispatch(fetchUserProfile(result.user.uid));
      toast.success("Signed in successfully");
    } catch (error) {
      toast.error("Error signing in with Google");
      await signOut(auth);
    }
  };

  const signUpWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // First, get the email from Google without creating a Firebase user
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email) {
        toast.error("No email provided by Google");
        await signOut(auth);
        return;
      }

      // Check if user exists in our database
      const userExists = await checkUserExistsByEmail(email);

      if (userExists) {
        // If user exists, show message to sign in instead
        toast.error("Account already exists. Please sign in instead.");
        await signOut(auth);
        return;
      }

      // Create new user document in Firestore with all required fields
      await setDoc(doc(db, "users", result.user.uid), {
        email,
        photoURL: result.user.photoURL || null,
        name: result.user.displayName || "",
        contactInfo: {
          address: "",
          phone: "",
        },
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: "on-boarding",
        socialLinks: {
          facebook: "",
          instagram: "",
          twitter: "",
          linkedin: "",
        },
        bio: "",
        assignedLocations: [],
        interestInShow: "",
      });

      dispatch(
        login({
          email: result.user.email!,
          id: result.user.uid,
          photoURL: result.user.photoURL || null,
        })
      );

      // Fetch the newly created profile
      dispatch(fetchUserProfile(result.user.uid));
      toast.success("Account created successfully");
    } catch (error) {
      toast.error("Error signing up with Google");
      await signOut(auth);
    }
  };

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    setErrorMessage(null);
    setLoading(true);
    const { email, password } = data;
    if (authType === "sign-up") {
      try {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          email,
          photoURL: null,
          name: "",
          contactInfo: {
            address: "",
            phone: "",
          },
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: "on-boarding",
          socialLinks: {
            facebook: "",
            instagram: "",
            twitter: "",
            linkedin: "",
          },
          bio: "",
          assignedLocations: [],
          interestInShow: "",
        });

        setLoading(false);

        if (user && user.email) {
          dispatch(
            login({
              email: user.email,
              id: user.uid,
              photoURL: user.photoURL || null,
            })
          );

          // Fetch the newly created profile
          dispatch(fetchUserProfile(user.uid));
          toast.success("Account created successfully");
        }
      } catch (error: any) {
        setLoading(false);
        const errorCode = error.code;
        setErrorMessage(errorCode);
        toast.error("Error creating account");
      }
    } else {
      try {
        const { user } = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        setLoading(false);

        if (user && user.email) {
          dispatch(
            login({
              email: user.email,
              id: user.uid,
              photoURL: user.photoURL || null,
            })
          );

          // Fetch existing profile
          dispatch(fetchUserProfile(user.uid));
          toast.success("Signed in successfully");
        }
      } catch (error: any) {
        setLoading(false);
        const errorCode = error.code;
        setErrorMessage(errorCode);
        toast.error("Error signing in");
      }
    }
  };

  const handleAuthType = () => {
    setAuthType((prevAuthType) =>
      prevAuthType === "login" ? "sign-up" : "login"
    );
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(authFormSchema) as any,
    context: { isSignUp: authType === "sign-up" },
  });

  return (
    <>
      <ResetPassword
        resetPasswordEmail={resetPasswordEmail}
        resetPasswordSuccess={resetPasswordSuccess}
        resetPasswordError={resetPasswordError}
        setResetPasswordEmail={setResetPasswordEmail}
        isOpen={resetPassword}
        onClose={() => setResetPassword(false)}
        handlePasswordReset={handlePasswordReset}
      />
      <div className={container}>
        <div className="w-full max-w-sm rounded-lg bg-slate-700/30 shadow">
          {errorMessage && (
            <p className="bg-red-400 px-3 py-2 text-center rounded-md text-white">
              {errorMessage}
            </p>
          )}
          <form onSubmit={handleSubmit(handleFormSubmit)} className={form}>
            {/* <div className="grid gap-y-3">
              <button
                onClick={
                  authType === "login" ? signInWithGoogle : signUpWithGoogle
                }
                className={button}
                type="button"
              >
                {authType === "login"
                  ? "Sign in with Google"
                  : "Sign up with Google"}
              </button>
            </div> */}

            {/* <div className="my-3 flex items-center px-3">
              <hr className={hrReverseDark} />
              <span className={text}>or</span>
              <hr className={hrReverseDark} />
            </div> */}

            <div className="grid gap-y-3">
              <div>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className={authInput}
                  {...register("email")}
                />
                {errors.email ? (
                  <span className="text-red-700">{errors.email.message}</span>
                ) : (
                  <></>
                )}
              </div>
              <div>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="******"
                  className={authInput}
                  autoComplete={
                    authType === "login" ? "current-password" : "new-password"
                  }
                />
                {errors.password ? (
                  <span className="text-red-700">
                    {errors.password.message}
                  </span>
                ) : (
                  <></>
                )}
              </div>
              {authType === "sign-up" && (
                <div>
                  <input
                    type="password"
                    placeholder="confirm password"
                    className={authInput}
                    {...register("confirmPassword")}
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword ? (
                    <span className="text-red-700">
                      {errors.confirmPassword.message}
                    </span>
                  ) : (
                    <></>
                  )}
                </div>
              )}

              <button disabled={loading} className={buttonHoverPurple}>
                Sign {authType === "login" ? "in" : "up"} with Email
              </button>
            </div>

            <div className="text-sm font-light py-4">
              {authType === "login" ? (
                <span>
                  Don&apos;t have an account yet?{" "}
                  <span onClick={handleAuthType} className={link}>
                    Sign up
                  </span>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <span
                    onClick={handleAuthType}
                    className="font-medium cursor-pointer text-primary-600 hover:underline dark:text-primary-500"
                  >
                    Sign in
                  </span>
                </span>
              )}
            </div>

            <div className="my-3 flex items-center px-3">
              <hr className={hrReverseDark} />
              <button
                onClick={() => setResetPassword(true)}
                type="button"
                className={forgotPasswordButton}
              >
                forgot password
              </button>
              <hr className={hrReverseDark} />
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Auth;
