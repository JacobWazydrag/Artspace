// Simple test to verify email configuration logic
import { getEmailConfig, mergeEmailConfig } from "./emailConfig";

// Mock environment variables for testing
const originalEnv = process.env.REACT_APP_ENVIRONMENT;

describe("Email Configuration", () => {
  afterEach(() => {
    // Restore original environment
    process.env.REACT_APP_ENVIRONMENT = originalEnv;
  });

  test("DEV environment should return specific config", () => {
    process.env.REACT_APP_ENVIRONMENT = "DEV";

    const config = getEmailConfig();
    expect(config.toUids).toEqual(["7vwsK29oPrViRdDgBP6ouy7iSS12"]);
    expect(config.cc).toEqual(["jgw.jakegeorge@gmail.com"]);
    expect(config.bcc).toEqual(["jgw.jakegeorge@gmail.com"]);
  });

  test("PROD environment should return empty arrays", () => {
    process.env.REACT_APP_ENVIRONMENT = "PROD";

    const config = getEmailConfig();
    expect(config.toUids).toEqual([]);
    expect(config.cc).toEqual([]);
    expect(config.bcc).toEqual([]);
  });

  test("mergeEmailConfig should override in DEV environment", () => {
    process.env.REACT_APP_ENVIRONMENT = "DEV";

    const originalConfig = {
      replyTo: "test@example.com",
      toUids: ["original-uid"],
      cc: ["original@example.com"],
      bcc: ["original@example.com"],
      message: { subject: "Test" },
    };

    const merged = mergeEmailConfig(originalConfig);
    expect(merged.toUids).toEqual(["7vwsK29oPrViRdDgBP6ouy7iSS12"]);
    expect(merged.cc).toEqual(["jgw.jakegeorge@gmail.com"]);
    expect(merged.bcc).toEqual(["jgw.jakegeorge@gmail.com"]);
    expect(merged.replyTo).toBe("test@example.com");
    expect(merged.message).toEqual({ subject: "Test" });
  });

  test("mergeEmailConfig should not override in PROD environment", () => {
    process.env.REACT_APP_ENVIRONMENT = "PROD";

    const originalConfig = {
      replyTo: "test@example.com",
      toUids: ["original-uid"],
      cc: ["original@example.com"],
      bcc: ["original@example.com"],
      message: { subject: "Test" },
    };

    const merged = mergeEmailConfig(originalConfig);
    expect(merged).toEqual(originalConfig);
  });
});
