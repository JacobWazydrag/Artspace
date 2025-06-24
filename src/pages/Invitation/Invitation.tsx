import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { sendMail } from "../../features/mailSlice";
import { fetchUsers } from "../../features/usersSlice";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-hot-toast";

type TabType = "invitation" | "custom-message";

const Invitation = () => {
  const dispatch = useAppDispatch();
  const { data: users } = useAppSelector((state) => state.users);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("invitation");

  // Invitation tab state
  const [emails, setEmails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Custom message tab state
  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [htmlMessage, setHtmlMessage] = useState("");
  const [isCustomSubmitting, setIsCustomSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleInvitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Parse emails (support both single email and comma-separated)
      const emailList = emails
        .split(/[,\n]/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (emailList.length === 0) {
        toast.error("Please enter valid email addresses");
        return;
      }

      // Validate emails format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emailList.filter(
        (email) => !emailRegex.test(email)
      );

      if (invalidEmails.length > 0) {
        setValidationErrors(
          invalidEmails.map((email) => `Invalid email format: ${email}`)
        );
        toast.error("Some email addresses are invalid");
        return;
      }

      // Check if any emails already exist in users collection
      const existingEmails: string[] = [];
      for (const email of emailList) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          existingEmails.push(email);
        }
      }

      if (existingEmails.length > 0) {
        setValidationErrors(
          existingEmails.map((email) => `Email already registered: ${email}`)
        );
        toast.error("Some emails are already registered");
        return;
      }

      // Send invitation emails
      const mailData = {
        replyTo: "artspacechicago@gmail.com",
        cc: ["artspacechicago@gmail.com", "jgw.jakegeorge@gmail.com"],
        bcc: emailList,
        message: {
          subject: "🎨 You're Invited to Join ArtSpace Chicago!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6b46c1; margin: 0; font-size: 28px;">🎨 ArtSpace Chicago</h1>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Artist Invitation</p>
              </div>
              
              <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">You're Invited! 🎉</h2>
                
                <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                  We're excited to invite you to join <strong>ArtSpace Chicago</strong>, a vibrant community dedicated to supporting emerging artists and showcasing incredible artwork.
                </p>
                
                <div style="background-color: #f0f4ff; padding: 20px; border-radius: 6px; border-left: 4px solid #6b46c1; margin-bottom: 25px;">
                  <h3 style="color: #6b46c1; margin: 0 0 15px 0; font-size: 18px;">What You Can Do:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #333;">
                    <li style="margin-bottom: 8px;">Showcase your artwork in our curated exhibitions</li>
                    <li style="margin-bottom: 8px;">Connect with fellow artists and art enthusiasts</li>
                    <li style="margin-bottom: 8px;">Access exclusive opportunities and resources</li>
                    <li style="margin-bottom: 8px;">Participate in our vibrant art community</li>
                  </ul>
                </div>
                
                <div style="background-color: #e8f5e8; padding: 20px; border-radius: 6px; border-left: 4px solid #48bb78; margin-bottom: 25px;">
                  <h3 style="color: #2f855a; margin: 0 0 15px 0; font-size: 18px;">🚀 Ready to Get Started?</h3>
                  <p style="margin: 0 0 15px 0; color: #2f855a;">
                    Click the button below to create your account and start your artistic journey with us!
                  </p>
                  <a 
                    href="https://artspace-3d76f.web.app/" 
                    style="display: inline-block; background-color: #6b46c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;"
                  >
                    Join ArtSpace Chicago
                  </a>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                  <p style="margin: 0; color: #856404; font-size: 14px;">
                    <strong>Next Steps:</strong> After creating your account, you'll be guided through a simple onboarding process to set up your artist profile and start showcasing your work.
                  </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #666; font-size: 14px; margin: 0;">
                    This invitation was sent by the ArtSpace Chicago team. If you have any questions, please don't hesitate to reach out to us.
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>ArtSpace Chicago - Supporting Emerging Artists</p>
                <p>📍 Chicago, Illinois</p>
              </div>
            </div>
          `,
        },
      };

      await dispatch(sendMail(mailData)).unwrap();

      toast.success(
        `Invitation sent successfully to ${emailList.length} recipient${
          emailList.length > 1 ? "s" : ""
        }`
      );
      setEmails("");
      setValidationErrors([]);
    } catch (error) {
      console.error("Error sending invitations:", error);
      toast.error("Failed to send invitations. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserEmails.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!htmlMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsCustomSubmitting(true);

    try {
      const mailData = {
        replyTo: "artspacechicago@gmail.com",
        cc: ["artspacechicago@gmail.com", "jgw.jakegeorge@gmail.com"],
        bcc: selectedUserEmails,
        message: {
          subject: subject,
          html: htmlMessage,
        },
      };

      await dispatch(sendMail(mailData)).unwrap();

      toast.success(
        `Message sent successfully to ${selectedUserEmails.length} recipient${
          selectedUserEmails.length > 1 ? "s" : ""
        }`
      );
      setSelectedUserEmails([]);
      setSubject("");
      setHtmlMessage("");
    } catch (error) {
      console.error("Error sending custom message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsCustomSubmitting(false);
    }
  };

  const handleUserEmailToggle = (email: string) => {
    setSelectedUserEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSelectAllUsers = () => {
    const allEmails = users.map((user) => user.email);
    setSelectedUserEmails(allEmails);
  };

  const handleClearAllUsers = () => {
    setSelectedUserEmails([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Send Messages</h1>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("invitation")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "invitation"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Send Invitations
            </button>
            <button
              onClick={() => setActiveTab("custom-message")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "custom-message"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Custom Message
            </button>
          </nav>
        </div>

        {/* Invitation Tab */}
        {activeTab === "invitation" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleInvitationSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="emails"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Addresses
                </label>
                <textarea
                  id="emails"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Enter email addresses (one per line or comma-separated)&#10;example@email.com&#10;another@email.com"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  You can enter multiple email addresses separated by commas or
                  new lines.
                </p>
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Validation Errors:
                  </h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  What happens next?
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • Recipients will receive a professional invitation email
                  </li>
                  <li>• They can click the link to create their account</li>
                  <li>
                    • New users will be guided through the onboarding process
                  </li>
                  <li>
                    • Only emails not already registered will receive
                    invitations
                  </li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !emails.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    "Send Invitations"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Custom Message Tab */}
        {activeTab === "custom-message" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleCustomMessageSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients
                </label>
                <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto">
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={handleSelectAllUsers}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllUsers}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserEmails.includes(user.email)}
                          onChange={() => handleUserEmailToggle(user.email)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {user.name} ({user.email})
                        </span>
                      </label>
                    ))}
                  </div>
                  {users.length === 0 && (
                    <p className="text-gray-500 text-sm">No users found</p>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {selectedUserEmails.length} recipient
                  {selectedUserEmails.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email subject"
                  disabled={isCustomSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="htmlMessage"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message (HTML)
                </label>
                <textarea
                  id="htmlMessage"
                  value={htmlMessage}
                  onChange={(e) => setHtmlMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  rows={12}
                  placeholder="Enter your HTML message here...&#10;&#10;Example:&#10;&lt;h1&gt;Hello!&lt;/h1&gt;&#10;&lt;p&gt;This is a custom message.&lt;/p&gt;"
                  disabled={isCustomSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  You can use HTML tags to format your message. The message will
                  be sent as HTML email.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  Custom Message Info:
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• This will send a custom message to existing users</li>
                  <li>• You can use HTML formatting in your message</li>
                  <li>• All selected users will receive the same message</li>
                  <li>
                    • Messages are sent as BCC to protect recipient privacy
                  </li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    isCustomSubmitting ||
                    selectedUserEmails.length === 0 ||
                    !subject.trim() ||
                    !htmlMessage.trim()
                  }
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCustomSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    "Send Custom Message"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invitation;
