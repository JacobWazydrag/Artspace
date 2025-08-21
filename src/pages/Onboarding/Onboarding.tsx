import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { completeOnboarding } from "../../features/profileSlice";
import BasicInfo from "./steps/BasicInfo";
import ContactInfo from "./steps/ContactInfo";
import SocialLinks from "./steps/SocialLinks";
import ArtworkUpload from "./steps/ArtworkUpload";
import { formClasses } from "../../classes/tailwindClasses";

const Onboarding = () => {
  const { formCard } = formClasses;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem("onboardingStep");
    return saved ? Number(saved) : 0;
  });
  const currentStepRef = useRef(currentStep);

  useEffect(() => {
    return () => {};
  }, []);

  useEffect(() => {
    if (profile?.onboardingCompleted) {
      navigate("/dashboard");
    }
  }, [profile?.onboardingCompleted, navigate]);

  useEffect(() => {
    localStorage.setItem("onboardingStep", String(currentStep));
  }, [currentStep]);

  const handleStepComplete = () => {
    // Just save the current step's data without advancing
    // The step will only advance when the user clicks Next
  };

  const handlePreviousStep = () => {
    if (currentStepRef.current > 0) {
      setCurrentStep((prev) => {
        const prevStep = prev - 1;
        currentStepRef.current = prevStep;

        return prevStep;
      });
    }
  };

  const handleNextStep = () => {
    if (currentStepRef.current < steps.length - 1) {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;
        currentStepRef.current = nextStep;

        return nextStep;
      });
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep((prev) => {
      currentStepRef.current = index;

      return index;
    });
  };

  const steps = [
    {
      title: "Basic Information",
      shortTitle: "Basic",
      component: (
        <BasicInfo
          onComplete={handleStepComplete}
          isComplete={Boolean(
            profile?.name?.trim() &&
              profile?.email?.trim() &&
              profile?.bio?.trim()
          )}
        />
      ),
    },
    {
      title: "Contact Information",
      shortTitle: "Contact",
      component: (
        <ContactInfo
          onComplete={handleStepComplete}
          isComplete={Boolean(
            profile?.contactInfo?.phone?.trim() ||
              profile?.contactInfo?.address?.trim()
          )}
        />
      ),
    },
    {
      title: "Links",
      shortTitle: "Links",
      component: (
        <SocialLinks
          onComplete={handleStepComplete}
          isComplete={Boolean(
            profile?.socialLinks?.instagram?.trim() &&
              profile?.paymentInformation?.venmo?.trim() &&
              profile?.paymentInformation?.zelle?.trim()
          )}
        />
      ),
    },
    {
      title: "Artwork Upload",
      shortTitle: "Artworks",
      component: (
        <ArtworkUpload
          onComplete={handleStepComplete}
          isComplete={Boolean(
            profile?.artworks && profile.artworks.length >= 3
          )}
        />
      ),
    },
  ];

  // Safety check for currentStep
  const safeCurrentStep = Math.min(
    Math.max(0, currentStepRef.current),
    steps.length - 1
  );
  const currentStepData = steps[safeCurrentStep];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`text-sm font-medium ${
                  index <= safeCurrentStep ? "text-blue-600" : "text-gray-400"
                } cursor-pointer`}
                onClick={() => handleStepClick(index)}
              >
                <span className="sm:hidden">
                  {(step as any).shortTitle || step.title}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((safeCurrentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Current step */}
        <div className={formCard}>
          {/* <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentStepData.title}
              </h1>
              <span className="text-sm text-gray-500">
                Step {safeCurrentStep + 1} of {steps.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((safeCurrentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div> */}

          {currentStepData.component}

          {/* Navigation arrows */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <button
              onClick={handlePreviousStep}
              disabled={safeCurrentStep === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            <button
              onClick={handleNextStep}
              disabled={safeCurrentStep === steps.length - 1}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
