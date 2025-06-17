import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../hooks/storeHook";
import ArtworkUpload from "../Onboarding/steps/ArtworkUpload";
import { formClasses } from "../../classes/tailwindClasses";

const OnboardArt = () => {
  const { formCard } = formClasses;
  const navigate = useNavigate();
  const { data: profile } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Redirect if not an artist
    if (profile?.role !== "artist") {
      navigate("/dashboard");
    }
  }, [profile?.role, navigate]);

  const handleComplete = () => {
    // No navigation or reload needed; artwork list will refresh automatically
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className={formCard}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Add New Artwork
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Upload your artwork to showcase it in your portfolio
            </p>
          </div>
          <ArtworkUpload onComplete={handleComplete} isComplete={false} />
        </div>
      </div>
    </div>
  );
};

export default OnboardArt;
