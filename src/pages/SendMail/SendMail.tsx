import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { sendMail } from "../../features/mailSlice";
import { fetchUsers } from "../../features/usersSlice";
import { toast } from "react-hot-toast";
import { mergeEmailConfig } from "../../utils/emailConfig";

const SendMail = () => {
  const dispatch = useAppDispatch();
  const { data: users } = useAppSelector((state) => state.users);

  // State for custom message functionality
  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [htmlMessage, setHtmlMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);

    try {
      const mailData = mergeEmailConfig({
        replyTo: "artspacechicago@gmail.com",
        cc: ["artspacechicago@gmail.com", "jgw.jakegeorge@gmail.com"],
        bcc: selectedUserEmails,
        message: {
          subject: subject,
          html: htmlMessage,
        },
      });

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
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-3xl font-bold mb-8">Send Mail</h1>
        <p className="text-gray-600 mb-6">
          Send custom messages to registered users
        </p>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                You can use HTML tags to format your message. The message will
                be sent as HTML email.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Send Mail Info:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• This will send a custom message to existing users</li>
                <li>• You can use HTML formatting in your message</li>
                <li>• All selected users will receive the same message</li>
                <li>• Messages are sent as BCC to protect recipient privacy</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  selectedUserEmails.length === 0 ||
                  !subject.trim() ||
                  !htmlMessage.trim()
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendMail;
