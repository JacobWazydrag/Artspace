import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchChatMessages, sendMessage } from "../../features/chatSlice";
import { format } from "date-fns";

const ChatWindow = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentChat, messages, loading, sendingMessage, error } =
    useAppSelector((state) => state.chat);
  const { data: users } = useAppSelector((state) => state.users);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentChat?.id) {
      dispatch(fetchChatMessages(currentChat.id));
    }

    // Cleanup function to unsubscribe from Firestore listeners
    return () => {
      if ((window as any).unsubscribeMessages) {
        (window as any).unsubscribeMessages();
      }
    };
  }, [dispatch, currentChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherParticipant = (participants: string[]) => {
    return participants.find((id) => id !== user?.id);
  };

  const getOtherParticipantName = (participants: string[]) => {
    const otherParticipantId = getOtherParticipant(participants);
    const otherUser = users.find((u) => u.id === otherParticipantId);
    return otherUser?.name || otherUser?.email || "Unknown User";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat?.id || !user?.id || sendingMessage)
      return;

    const otherParticipantId = getOtherParticipant(currentChat.participants);
    if (!otherParticipantId) return;

    try {
      await dispatch(
        sendMessage({
          chatId: currentChat.id,
          message: {
            content: newMessage,
            senderId: user.id,
            receiverId: otherParticipantId,
            read: false,
          },
        })
      ).unwrap();
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">
          {getOtherParticipantName(currentChat.participants)}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No messages yet
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderId === user?.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.senderId === user?.id
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {format(new Date(message.createdAt), "h:mm a")}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 p-4 border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage(e)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sendingMessage}
        />
        <button
          onClick={handleSendMessage}
          disabled={sendingMessage}
          className="p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingMessage ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
