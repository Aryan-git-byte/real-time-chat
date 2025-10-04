"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

type Community = {
  id: string;
  name: string;
  display_name: string;
};

export default function CreatePostModal({
  onClose,
  onSuccess,
  userId,
}: {
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}) {
  const [postType, setPostType] = useState<"text" | "image" | "link">("text");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from("communities")
      .select("id, name, display_name")
      .order("member_count", { ascending: false });
    setCommunities(data || []);
    if (data && data.length > 0) {
      setSelectedCommunity(data[0].id);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedCommunity) {
      alert("Please fill in title and select a community");
      return;
    }

    const postData: any = {
      title,
      author_id: userId,
      community_id: selectedCommunity,
      post_type: postType,
    };

    if (postType === "text") {
      postData.content = content;
    } else if (postType === "image") {
      postData.image_url = imageUrl;
    } else if (postType === "link") {
      postData.link_url = linkUrl;
    }

    const { error } = await supabase.from("posts").insert(postData);

    if (error) {
      alert("Error creating post: " + error.message);
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b p-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Create a post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          {/* Community Selection */}
          <label htmlFor="community-select" className="block mb-1 font-medium">
            Choose a community
          </label>
          <select
            id="community-select"
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-4"
          >
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                r/{community.name}
              </option>
            ))}
          </select>

          {/* Post Type Tabs */}
          <div className="flex gap-2 mb-4 border-b">
            {[
              { type: "text", icon: "📝", label: "Text" },
              { type: "image", icon: "🖼️", label: "Image" },
              { type: "link", icon: "🔗", label: "Link" },
            ].map((tab) => (
              <button
                key={tab.type}
                onClick={() => setPostType(tab.type as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 ${
                  postType === tab.type
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-gray-600"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            className="w-full px-3 py-2 border rounded mb-4 text-lg"
          />

          {/* Content based on type */}
          {postType === "text" && (
            <textarea
              placeholder="Text (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4 min-h-[200px]"
            />
          )}

          {postType === "image" && (
            <input
              type="text"
              placeholder="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
            />
          )}

          {postType === "link" && (
            <input
              type="text"
              placeholder="URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
            />
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border rounded-full hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}