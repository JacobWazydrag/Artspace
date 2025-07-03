// Environment-based email configuration
export const getEmailConfig = () => {
  const isDev = process.env.REACT_APP_ENVIRONMENT === "DEV";

  if (isDev) {
    return {
      toUids: ["7vwsK29oPrViRdDgBP6ouy7iSS12"],
      cc: ["jgw.jakegeorge@gmail.com"],
      bcc: ["jgw.jakegeorge@gmail.com"],
    };
  }

  // Production configuration - return empty arrays to use original logic
  return {
    toUids: [],
    cc: [],
    bcc: [],
  };
};

// Helper function to merge email config with existing data
export const mergeEmailConfig = (existingConfig: any) => {
  const envConfig = getEmailConfig();
  const isDev = process.env.REACT_APP_ENVIRONMENT === "DEV";

  if (isDev) {
    return {
      ...existingConfig,
      toUids: envConfig.toUids,
      cc: envConfig.cc,
      bcc: envConfig.bcc,
    };
  }

  // In production, return the original config unchanged
  return existingConfig;
};
