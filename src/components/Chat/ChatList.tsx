import { useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { createChat, setCurrentChat, Chat } from "../../features/chatSlice";
import { format } from "date-fns";
import { User } from "../../models/User";

const ChatList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { chats, currentChat } = useAppSelector((state) => state.chat);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { data: users } = useAppSelector((state) => state.users);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get existing chat participants
  const existingChatParticipants = useMemo(() => {
    return chats.map((chat) => chat.participants).flat();
  }, [chats]);

  // Find the current user's full data from the users array
  const currentUserData = useMemo(() => {
    const user = users.find((u) => u.id === currentUser?.id);
    return user;
  }, [users, currentUser?.id]);

  // Check if current user is admin based on their data in users array
  const isCurrentUserAdmin = currentUserData?.role === "admin";

  // Filter users based on search query and role
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const isNotSelf = user.id !== currentUser?.id;
      const isUserAdmin = user.role === "admin";
      const hasExistingChat = existingChatParticipants.includes(user.id!);

      // Admin sees everyone except self
      // Non-admin sees only admins except self
      const isVisible = isCurrentUserAdmin
        ? isNotSelf // Admin sees everyone except self
        : isUserAdmin && isNotSelf; // Non-admin sees only admins except self

      return isVisible && !hasExistingChat;
    });
  }, [users, currentUser?.id, existingChatParticipants, isCurrentUserAdmin]);

  const handleStartChat = async () => {
    if (!selectedUser || !currentUser) return;
    setIsCreatingChat(true);
    try {
      await dispatch(
        createChat({
          participants: [currentUser.id!, selectedUser.id!],
        })
      ).unwrap();
      setIsModalOpen(false);
      setSelectedUser(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const getOtherParticipantName = (chat: Chat) => {
    const otherParticipantId = chat.participants.find(
      (id: string) => id !== currentUser?.id
    )!;
    const otherUser = users.find((u) => u.id === otherParticipantId);
    return otherUser?.name || otherUser?.email || "Unknown User";
  };

  const getOtherParticipantPhoto = (chat: Chat) => {
    const otherParticipantId = chat.participants.find(
      (id: string) => id !== currentUser?.id
    )!;
    const otherUser = users.find((u) => u.id === otherParticipantId);
    return otherUser?.photoUrl;
  };

  const getReadStatus = (chat: Chat) => {
    if (!chat.lastMessage) return null;
    const readBy = chat.lastMessage.readBy || [];
    const totalParticipants = chat.participants.length;
    const readCount = readBy.length;

    // Check if the current user has read the message
    const isReadByMe = currentUser?.id
      ? readBy.includes(currentUser.id)
      : false;

    if (!isReadByMe) return "Unread by you";
    if (readCount === totalParticipants) return "Read by all";
    return `Read by ${readCount}/${totalParticipants}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreatingChat}
        >
          {isCreatingChat ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Starting chat...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Start New Chat
            </>
          )}
        </button>
      </div>

      {chats.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No chats yet. Start a new conversation!
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => {
            const isUnreadByMe =
              chat.lastMessage &&
              currentUser?.id &&
              !chat.lastMessage.readBy?.includes(currentUser.id);

            return (
              <button
                key={chat.id}
                onClick={() => dispatch(setCurrentChat(chat))}
                className={`w-full p-4 border-b hover:bg-gray-50 transition-colors ${
                  currentChat?.id === chat.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {getOtherParticipantPhoto(chat) ? (
                        <img
                          src={getOtherParticipantPhoto(chat) || ""}
                          alt={getOtherParticipantName(chat)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {getOtherParticipantName(chat).charAt(0)}
                        </span>
                      )}
                    </div>
                    {isUnreadByMe && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getOtherParticipantName(chat)}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-sm text-gray-500">
                          {format(new Date(chat.updatedAt), "MMM d")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage
                          ? chat.lastMessage.content
                          : "No messages yet"}
                      </p>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-400 ml-2">
                          {getReadStatus(chat)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* New Chat Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Start New Chat</h2>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-4 max-h-60 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        selectedUser?.id === user.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {user.name || user.email}
                          </h3>
                          <p className="text-sm text-gray-500">{user.role}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedUser(null);
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartChat}
                disabled={!selectedUser || isCreatingChat}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingChat ? "Starting..." : "Start Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
