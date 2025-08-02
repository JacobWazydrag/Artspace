import { useAppSelector } from "../hooks/storeHook";
import ChatList from "../components/Chat/ChatList";
import ChatWindow from "../components/Chat/ChatWindow";
import { useEffect } from "react";
import { useAppDispatch } from "../hooks/storeHook";
import { fetchUsersForChat } from "../features/usersSlice";

const ChatPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchUsersForChat());
  }, [dispatch]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please log in to access chat
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Chat</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        <div className="md:col-span-1 border rounded-lg overflow-hidden">
          <ChatList />
        </div>
        <div className="md:col-span-2 border rounded-lg overflow-hidden">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
