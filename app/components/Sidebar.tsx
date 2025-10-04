"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

type Community = {
  id: string;
  name: string;
  display_name: string;
  icon_url: string | null;
  member_count: number;
};

export default function Sidebar({
  user,
  onCreatePost,
}: {
  user: any;
  onCreatePost: () => void;
}) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    display_name: "",
    description: "",
  });

  useEffect(() => {
    fetchTopCommunities();
  }, []);

  const fetchTopCommunities = async () => {
    const { data } = await supabase
      .from("communities")
      .select("*")
      .order("member_count", { ascending: false })
      .limit(5);
    setCommunities(data || []);
  };

  const createCommunity = async () => {
    if (!user) {
      alert("Please log in to create a community");
      return;
    }

    if (!newCommunity.name || !newCommunity.display_name) {
      alert("Please fill in community name and display name");
      return;
    }

    const { error } = await supabase.from("communities").insert({
      name: newCommunity.name.toLowerCase().replace(/\s+/g, ""),
      display_name: newCommunity.display_name,
      description: newCommunity.description,
      creator_id: user.id,
    });

    if (error) {
      alert("Error creating community: " + error.message);
      return;
    }

    setNewCommunity({ name: "", display_name: "", description: "" });
    setShowCreateCommunity(false);
    fetchTopCommunities();
  };

  return (
    <div className="w-80 space-y-4">
      {/* Home Card */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="h-12 bg-gradient-to-r from-orange-400 to-orange-600"></div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="font-semibold">Home</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Your personal Reddit frontpage. Come here to check in with your
            favorite communities.
          </p>
          {user && (
            <button
              onClick={onCreatePost}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 font-medium"
            >
              Create Post
            </button>
          )}
        </div>
      </div>

      {/* Top Communities */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold">Top Communities</h3>
        </div>
        <div className="divide-y">
          {communities.map((community, index) => (
            <Link
              key={community.id}
              href={`/r/${community.name}`}
              className="flex items-center gap-3 p-3 hover:bg-gray-50"
            >
              <span className="text-sm text-gray-500 w-4">{index + 1}</span>
              {community.icon_url ? (
                <img
                  src={community.icon_url}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {community.name[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium text-sm">
                  r/{community.display_name}
                </div>
                <div className="text-xs text-gray-500">
                  {community.member_count} members
                </div>
              </div>
            </Link>
          ))}
        </div>
        {user && (
          <div className="p-3 border-t">
            <button
              onClick={() => setShowCreateCommunity(!showCreateCommunity)}
              className="w-full px-4 py-2 border rounded-full hover:bg-gray-50 text-sm font-medium"
            >
              Create Community
            </button>
          </div>
        )}
      </div>

      {/* Create Community Form */}
      {showCreateCommunity && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Create a Community</h3>
          <input
            type="text"
            placeholder="Community name (e.g., gaming)"
            value={newCommunity.name}
            onChange={(e) =>
              setNewCommunity({ ...newCommunity, name: e.target.value })
            }
            className="w-full px-3 py-2 border rounded mb-2 text-sm"
          />
          <input
            type="text"
            placeholder="Display name"
            value={newCommunity.display_name}
            onChange={(e) =>
              setNewCommunity({ ...newCommunity, display_name: e.target.value })
            }
            className="w-full px-3 py-2 border rounded mb-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={newCommunity.description}
            onChange={(e) =>
              setNewCommunity({ ...newCommunity, description: e.target.value })
            }
            className="w-full px-3 py-2 border rounded mb-3 text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={createCommunity}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-sm font-medium"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateCommunity(false)}
              className="flex-1 px-4 py-2 border rounded-full hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white rounded-lg border p-4">
        <div className="text-xs text-gray-600 space-y-1">
          <a href="#" className="block hover:underline">
            User Agreement
          </a>
          <a href="#" className="block hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="block hover:underline">
            Content Policy
          </a>
          <div className="pt-2 border-t mt-2">
            Reddit Clone © 2025. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}