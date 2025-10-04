"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Message = {
  id: string;
  username: string;
  content: string;
  created_at: string;
};

export default function Home() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!joined) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [joined]);

  const sendMessage = async () => {
    if (!content.trim()) return;
    await supabase.from("messages").insert({
      username,
      content,
    });
    setContent("");
  };

  if (!joined)
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-3xl font-bold">Join the Chat</h1>
        <input
          type="text"
          placeholder="Enter username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        />
        <button
          onClick={() => username.trim() && setJoined(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Join
        </button>
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">XolveTech Live Chat 💬</h1>
      <div className="w-full max-w-xl border rounded-lg bg-white shadow-lg p-4 flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 ${
                msg.username === username ? "text-blue-600" : "text-gray-800"
              }`}
            >
              <strong>{msg.username}: </strong> {msg.content}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="border flex-1 px-3 py-2 rounded-lg"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
