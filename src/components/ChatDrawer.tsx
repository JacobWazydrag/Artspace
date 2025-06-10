import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/storeHook";
import {
  fetchConversations,
  sendMessage,
  setCurrentConversation,
  clearCurrentConversation,
  startConversation,
  Message,
  Conversation,
  fetchMessages,
  markMessageAsRead,
} from "../features/chatSlice";
import { fetchUsersForChat } from "../features/usersSlice";
import { useAuth } from "../hooks/useAuth";
import { format } from "date-fns";
import { RootState } from "../store/store";
import { UserIcon } from "@heroicons/react/24/outline";

const ChatDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationsUnsubscribeRef = useRef<(() => void) | null>(null);
  const messagesUnsubscribeRef = useRef<(() => void) | null>(null);
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const {
    conversations,
    currentConversation: rawCurrentConversation,
    messages: chatMessages,
    loading,
  } = useAppSelector((state: RootState) => state.chat);
  const currentConversation = rawCurrentConversation as Conversation | null;
  const messages: Message[] = chatMessages;
  const { data: users, loading: usersLoading } = useAppSelector(
    (state: RootState) => state.users
  );
  const { data: profile } = useAppSelector((state: RootState) => state.profile);
  const [showUserList, setShowUserList] = useState(true);
  const [userSearch, setUserSearch] = useState("");

  const currentUserRole = profile?.role;

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchConversations(user.id)).then((result) => {
        if (result.payload) {
          // Store the unsubscribe function in the ref
          conversationsUnsubscribeRef.current = result.payload as () => void;
        }
      });
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(fetchUsersForChat(user?.id!));
    }
  }, [dispatch, users]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentConversation) {
      // Clean up previous messages listener if it exists
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
        messagesUnsubscribeRef.current = null;
      }

      dispatch(fetchMessages(currentConversation.id)).then((result) => {
        if (result.payload) {
          // Store the unsubscribe function in the ref
          messagesUnsubscribeRef.current = result.payload as () => void;
        }
      });
    }
  }, [dispatch, currentConversation]);

  useEffect(() => {
    if (isOpen && currentConversation && messages.length > 0 && user?.id) {
      const unreadMessages = messages.filter(
        (msg) => !msg.readBy.includes(user.id)
      );
      if (unreadMessages.length > 0) {
        Promise.all(
          unreadMessages.map((msg) =>
            dispatch(
              markMessageAsRead({
                conversationId: currentConversation.id,
                messageId: msg.id,
                userId: user.id,
              })
            )
          )
        );
      }
    }
  }, [dispatch, isOpen, currentConversation, messages, user?.id]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      if (conversationsUnsubscribeRef.current) {
        conversationsUnsubscribeRef.current();
      }
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentConversation || !user?.id) return;

    try {
      await dispatch(
        sendMessage({
          conversationId: currentConversation.id,
          senderId: user.id,
          text: message.trim(),
        })
      ).unwrap();
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleStartConversation = async (otherUser: any) => {
    if (!user?.id || !otherUser.id) return;
    // Check if conversation already exists
    const existing = conversations.find((c) =>
      c.participants.includes(otherUser.id)
    );
    if (existing) {
      dispatch(setCurrentConversation(existing));
      return;
    }
    // Determine who should send the welcome message
    let senderId = user.id;
    const isAdmin = profile?.role === "admin";
    if (!isAdmin) {
      // Find a admin user
      const admin = users.find((u: any) => u.role === "admin");
      if (admin && admin.id) {
        senderId = admin.id;
      }
    }
    try {
      const conversationId = await dispatch(
        startConversation({
          currentUserId: user.id,
          otherUserId: otherUser.id,
          initialMessage:
            "Welcome to the chat! An Artspace team member will be in touch shortly.",
          initialSenderId: senderId,
        })
      ).unwrap();
      // Refetch conversations and set current
      await dispatch(fetchConversations(user.id));
      const newConv = conversations.find((c) => c.id === conversationId);
      if (newConv) {
        dispatch(setCurrentConversation(newConv));
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";
    // Firestore Timestamp object
    if (typeof timestamp.toDate === "function") {
      return format(timestamp.toDate(), "h:mm a");
    }
    // If it's a JS Date
    if (timestamp instanceof Date) {
      return format(timestamp, "h:mm a");
    }
    // If it's a string (ISO)
    if (typeof timestamp === "string") {
      return format(new Date(timestamp), "h:mm a");
    }
    // If it's a Firestore serverTimestamp sentinel or null
    return "";
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderId === user?.id;
    return (
      <div
        key={message.id}
        className={`flex ${
          isOwnMessage ? "justify-end" : "justify-start"
        } mb-4`}
      >
        <div
          className={`max-w-[70%] rounded-lg px-4 py-2 ${
            isOwnMessage
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          <p>{message.text}</p>
          <p className="text-xs mt-1 opacity-70">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  // Exclude users with whom a conversation already exists
  const usersWithConversation = new Set(
    conversations.flatMap((c) => c.participants).filter((id) => id !== user?.id)
  );

  const filteredUsers = users
    .filter((u: any) => u.id !== user?.id)
    .filter((u: any) => {
      if (currentUserRole === "admin") {
        return true;
      }
      return u.role === "admin";
    })
    .filter((u: any) => !usersWithConversation.has(u.id));

  const searchedUsers = filteredUsers.filter((u: any) =>
    (u.name || u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const hasUnreadMessages = (conversationId: string): boolean => {
    if (!user?.id) return false;
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return false;
    return conversation.lastMessageReadBy
      ? !conversation.lastMessageReadBy.includes(user.id)
      : false;
  };

  // Calculate unread conversations count
  const unreadConversationsCount = conversations.reduce(
    (count, conversation) => {
      if (!user?.id) return count;
      if (
        conversation.lastMessageReadBy &&
        !conversation.lastMessageReadBy.includes(user.id)
      ) {
        return count + 1;
      }
      return count;
    },
    0
  );

  const truncateWithEllipsis = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <>
      {/* Overlay for click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className="fixed bottom-0 right-0 z-50">
        {/* Chat Toggle Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              dispatch(clearCurrentConversation());
            }
          }}
          className="bg-indigo-600 text-white p-3 rounded-t-lg shadow-lg hover:bg-indigo-700 transition-colors relative"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          {unreadConversationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center">
              {unreadConversationsCount}
            </span>
          )}
        </button>

        {/* Chat Drawer */}
        <div
          className={`fixed bottom-0 right-0 w-96 bg-white shadow-lg transition-transform duration-300 ease-in-out z-50 ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              {currentConversation ? (
                <>
                  <button
                    onClick={() => dispatch(clearCurrentConversation())}
                    className="text-gray-500 hover:text-gray-700 mr-2"
                    title="Back"
                  >
                    <svg
                      className="w-5 h-5"
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
                  </button>
                  <h3 className="font-semibold flex-1 text-center">Messages</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <h3 className="font-semibold">Messages</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* User List for New Chat */}
            {!currentConversation && (
              <div className="border-b p-2">
                <button
                  className="flex items-center w-full text-left font-semibold mb-2 text-sm text-gray-700"
                  onClick={() => setShowUserList((prev) => !prev)}
                  aria-expanded={showUserList}
                >
                  Start a new chat
                  <svg
                    className={`ml-2 w-4 h-4 transition-transform ${
                      showUserList ? "" : "rotate-180"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showUserList && (
                  <>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full mb-2 px-2 py-1 border rounded text-sm"
                    />
                    {usersLoading ? (
                      <div className="text-xs text-gray-400">
                        Loading users...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                        {searchedUsers.map((u: any) => (
                          <button
                            key={u.id}
                            onClick={() => handleStartConversation(u)}
                            className="text-left px-2 py-1 rounded hover:bg-gray-100 text-sm text-gray-800"
                          >
                            <span className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                              {u.name + ` - ` + u.email}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Conversations List */}
            {!currentConversation && (
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation: Conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() =>
                      dispatch(setCurrentConversation(conversation))
                    }
                    className="w-full p-4 border-b hover:bg-gray-50 text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium flex items-center">
                          {conversation.participants
                            .filter((id: string) => id !== user?.id)
                            .map((id: string) => {
                              const u = users.find((u: any) => u.id === id);
                              return u ? u.name || u.email : "New User";
                            })
                            .join(", ")}
                          {/* Unread indicator */}
                          {hasUnreadMessages(conversation.id) && (
                            <span
                              className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"
                              title="Unread"
                            ></span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {truncateWithEllipsis(
                            conversation.lastMessage || "",
                            30
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatTimestamp(conversation.lastUpdated)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            {currentConversation && (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || loading}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatDrawer;
