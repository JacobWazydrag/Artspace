import { useState, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { sendMail } from "../../features/mailSlice";
import { fetchAllUsers } from "../../features/usersSlice";
import { toast } from "react-hot-toast";
import { mergeEmailConfig } from "../../utils/emailConfig";
import { fetchArtshows } from "../../features/artshowsSlice";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { format } from "date-fns";

const SendMail = () => {
  const dispatch = useAppDispatch();
  const { data: users } = useAppSelector((state) => state.users);
  const { data: artshows } = useAppSelector((state) => state.artshows);

  // State for custom message functionality
  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [htmlMessage, setHtmlMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShowNames, setSelectedShowNames] = useState<string[]>([]);
  const [isArtShowDropdownOpen, setIsArtShowDropdownOpen] = useState(false);
  const artShowDropdownRef = useRef<HTMLDivElement>(null);

  // State for Mail History
  const [mailDocs, setMailDocs] = useState<any[]>([]);
  const [isMailLoading, setIsMailLoading] = useState<boolean>(false);
  const [mailSearch, setMailSearch] = useState<string>("");
  const [startDateStr, setStartDateStr] = useState<string>("");
  const [endDateStr, setEndDateStr] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedMailUserId, setSelectedMailUserId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchArtshows());
  }, [dispatch]);

  // Subscribe to recent mail documents
  useEffect(() => {
    setIsMailLoading(true);
    const q = query(
      collection(db, "mail"),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMailDocs(items);
        setIsMailLoading(false);
      },
      (error) => {
        console.error("Error loading mail history:", error);
        toast.error("Failed to load mail history");
        setIsMailLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        artShowDropdownRef.current &&
        !artShowDropdownRef.current.contains(event.target as Node)
      ) {
        setIsArtShowDropdownOpen(false);
      }
    }
    if (isArtShowDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isArtShowDropdownOpen]);

  const filteredUsers = useMemo(() => {
    const excludedRoles = new Set(["admin", "manager", "employee"]);
    const base = users.filter((u) => !excludedRoles.has(u.role));
    if (!selectedShowNames.length) return base;
    return base.filter((user) =>
      selectedShowNames.includes((user as any).interestInShow || "")
    );
  }, [users, selectedShowNames]);

  // Map of userId -> email for resolving toUids
  const userIdToEmail = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      if (u.id && u.email) map.set(u.id, u.email);
    });
    return map;
  }, [users]);

  const userIdToDisplay = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      if (!u.id) return;
      const display = u.name ? `${u.name}${u.email ? " - " : ""}${u.email || ""}` : u.email || u.id;
      map.set(u.id, display);
    });
    return map;
  }, [users]);

  // Artshow date windows for quick lookup
  const artshowWindows = useMemo(() => {
    return artshows
      .map((s) => {
        if (!s.startDate || !s.endDate) return null;
        const start = new Date(`${s.startDate}T00:00:00`);
        const end = new Date(`${s.endDate}T23:59:59.999`);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
        return { name: s.name, start, end } as { name: string; start: Date; end: Date };
      })
      .filter(Boolean) as { name: string; start: Date; end: Date }[];
  }, [artshows]);

  // Users for dropdown (sorted by name then email)
  const usersForDropdown = useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const aName = (a.name || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();
      if (aName !== bName) return aName.localeCompare(bName);
      return a.email.toLowerCase().localeCompare(b.email.toLowerCase());
    });
    return copy;
  }, [users]);

  const selectedMailUserEmail = useMemo(() => {
    if (!selectedMailUserId) return "";
    const u = users.find((x) => x.id === selectedMailUserId);
    return u?.email || "";
  }, [users, selectedMailUserId]);

  // Transform raw mail docs into display items
  const mailItems = useMemo(() => {
    return mailDocs.map((doc: any) => {
      const collectedRecipients: string[] = [];
      const collectedRecipientUids: string[] = [];

      const pushArrayOrString = (val: any) => {
        if (!val) return;
        if (Array.isArray(val)) {
          val.forEach((v) => {
            if (typeof v === "string" && v) collectedRecipients.push(v);
          });
        } else if (typeof val === "string") {
          // Support comma/semicolon separated string lists
          const parts = val.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
          if (parts.length > 1) {
            parts.forEach((p) => collectedRecipients.push(p));
          } else if (val) {
            collectedRecipients.push(val);
          }
        }
      };

      // Common recipient fields can be string or array
      pushArrayOrString(doc.to);
      pushArrayOrString(doc.cc);
      pushArrayOrString(doc.bcc);

      // Extension delivery arrays (varies by implementation)
      pushArrayOrString(doc.accepted);
      pushArrayOrString(doc.rejected);
      if (doc.delivery) {
        pushArrayOrString(doc.delivery.accepted);
        pushArrayOrString(doc.delivery.rejected);
      }
      if (doc.info) {
        pushArrayOrString(doc.info.accepted);
        pushArrayOrString(doc.info.rejected);
      }

      // Resolve toUids using users list
      if (Array.isArray(doc.toUids)) {
        (doc.toUids as any[]).forEach((uid) => {
          if (typeof uid === "string") collectedRecipientUids.push(uid);
          const email = userIdToEmail.get(uid);
          if (email) collectedRecipients.push(email);
        });
      }
      if (Array.isArray(doc.ccUids)) {
        (doc.ccUids as any[]).forEach((uid) => {
          if (typeof uid === "string") collectedRecipientUids.push(uid);
          const email = userIdToEmail.get(uid);
          if (email) collectedRecipients.push(email);
        });
      }
      if (Array.isArray(doc.bccUids)) {
        (doc.bccUids as any[]).forEach((uid) => {
          if (typeof uid === "string") collectedRecipientUids.push(uid);
          const email = userIdToEmail.get(uid);
          if (email) collectedRecipients.push(email);
        });
      }
      if (typeof doc.toUid === "string") {
        collectedRecipientUids.push(doc.toUid);
        const email = userIdToEmail.get(doc.toUid);
        if (email) collectedRecipients.push(email);
      }

      // Unique recipients
      let recipients = Array.from(new Set(collectedRecipients));
      const recipientUids = Array.from(new Set(collectedRecipientUids));

      // Fallback: if no email recipients were resolved but we have UIDs, show display names
      if (recipients.length === 0 && recipientUids.length > 0) {
        recipients = recipientUids.map((uid) => userIdToDisplay.get(uid) || uid);
      }

      // Subject can be on message.subject or subject
      const subjectText = doc.message?.subject || doc.subject || "(no subject)";

      // createdAt may be a Firestore Timestamp or ISO string
      let created: Date | null = null;
      const createdAt = doc.createdAt;
      if (createdAt && typeof createdAt.toDate === "function") {
        created = createdAt.toDate();
      } else if (typeof createdAt === "string") {
        const d = new Date(createdAt);
        created = isNaN(d.getTime()) ? null : d;
      }

      // Optional state/status
      const status: string | undefined = doc.state || doc.status;

      // Determine artshow name if createdAt is within any show's window
      let showName: string | undefined = undefined;
      if (created) {
        const match = artshowWindows.find(
          (w) => created && created >= w.start && created <= w.end
        );
        if (match) showName = match.name;
      }

      return {
        id: doc.id as string,
        subject: subjectText as string,
        recipients,
        recipientUids,
        createdAt: created,
        status,
        showName,
      } as {
        id: string;
        subject: string;
        recipients: string[];
        recipientUids: string[];
        createdAt: Date | null;
        status?: string;
        showName?: string;
      };
    });
  }, [mailDocs, userIdToEmail, userIdToDisplay, artshowWindows]);

  // Apply filters: text + date range
  const filteredMailItems = useMemo(() => {
    const text = mailSearch.trim().toLowerCase();
    const start = startDateStr ? new Date(startDateStr + "T00:00:00") : null;
    const end = endDateStr ? new Date(endDateStr + "T23:59:59.999") : null;
    const selectedEmailLower = selectedMailUserEmail
      ? selectedMailUserEmail.trim().toLowerCase()
      : "";

    return mailItems.filter((item) => {
      // Text filter: subject or any recipient
      const matchesText = !text
        ? true
        : item.subject.toLowerCase().includes(text) ||
          item.recipients.some((r) => r.toLowerCase().includes(text));

      // User filter by email
      const matchesUser = selectedMailUserId
        ? item.recipientUids.includes(selectedMailUserId) ||
          (selectedEmailLower
            ? item.recipients.some((r) => r.toLowerCase() === selectedEmailLower)
            : false)
        : true;

      // Date filter
      const withinDate = (() => {
        if (!item.createdAt) return false;
        if (start && item.createdAt < start) return false;
        if (end && item.createdAt > end) return false;
        return true;
      })();

      return matchesText && matchesUser && withinDate;
    });
  }, [mailItems, mailSearch, startDateStr, endDateStr, selectedMailUserId, selectedMailUserEmail]);

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
    const allEmails = filteredUsers.map((user) => user.email);
    setSelectedUserEmails(allEmails);
  };

  const handleClearAllUsers = () => {
    setSelectedUserEmails([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Send Mail</h1>
        <p className="text-gray-600 mb-6 dark:text-white">
          Send custom messages to registered users
        </p>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients
              </label>
              <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto">
                <div className="flex gap-2 mb-3 items-center flex-wrap">
                  <div className="relative" ref={artShowDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsArtShowDropdownOpen((open) => !open)}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Art Show
                      <svg
                        className="w-2.5 h-2.5 inline ml-2"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    </button>
                    {isArtShowDropdownOpen && (
                      <div className="z-10 absolute mt-2 w-56 bg-white divide-y divide-gray-100 rounded-lg shadow">
                        <ul className="py-2 text-sm text-gray-700 max-h-60 overflow-y-auto">
                          {artshows.map((show) => (
                            <li key={show.id}>
                              <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedShowNames.includes(
                                    show.name
                                  )}
                                  onChange={(e) => {
                                    setSelectedShowNames((prev) =>
                                      e.target.checked
                                        ? [...prev, show.name]
                                        : prev.filter((n) => n !== show.name)
                                    );
                                    setIsArtShowDropdownOpen(false);
                                  }}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2">{show.name}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {selectedShowNames.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedShowNames([])}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
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
                  {filteredUsers.map((user) => (
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
                {filteredUsers.length === 0 && (
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
        {/* Mail History */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Mail History</h2>
            <div className="text-sm text-gray-500">
              {isMailLoading ? "Loading..." : `${filteredMailItems.length} items`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <select
              value={selectedMailUserId}
              onChange={(e) => setSelectedMailUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All users</option>
              {usersForDropdown.map((u) => (
                <option key={u.id} value={u.id}>
                  {(u.name ? u.name + " - " : "") + u.email}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search subject or recipient"
              value={mailSearch}
              onChange={(e) => setMailSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMailSearch("");
                  setStartDateStr("");
                  setEndDateStr("");
                  setSelectedMailUserId("");
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">During Artshow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isMailLoading && (
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-500" colSpan={4}>
                      Loading...
                    </td>
                  </tr>
                )}
                {!isMailLoading && filteredMailItems.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-500" colSpan={4}>
                      No mail found
                    </td>
                  </tr>
                )}
                {!isMailLoading &&
                  filteredMailItems.map((item) => {
                    const dateStr = item.createdAt
                      ? format(item.createdAt, "PP p")
                      : "-";
                    const isExpanded = !!expandedRows[item.id];
                    const visibleRecipients = isExpanded
                      ? item.recipients
                      : item.recipients.slice(0, 3);
                    const remaining = item.recipients.length - visibleRecipients.length;
                    const recipientsText = item.recipients.join(", ");
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{dateStr}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="line-clamp-2">{item.subject}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700" title={recipientsText}>
                          <div className="flex flex-wrap gap-1">
                            {visibleRecipients.map((r) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                {r}
                              </span>
                            ))}
                            {!isExpanded && remaining > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRows((prev) => ({
                                    ...prev,
                                    [item.id]: true,
                                  }))
                                }
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                              >
                                +{remaining} more
                              </button>
                            )}
                            {isExpanded && item.recipients.length > 3 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRows((prev) => ({
                                    ...prev,
                                    [item.id]: false,
                                  }))
                                }
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {item.showName ? (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              {item.showName}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMail;
