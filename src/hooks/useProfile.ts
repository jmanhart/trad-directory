import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      // If profile doesn't exist, create it
      if (error.code === "PGRST116") {
        await createProfile();
      }
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const createProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || "",
      })
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const updateProfile = async (updates: {
    name?: string;
    avatar_url?: string;
  }) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  const updateEmail = async (newEmail: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    // Update email in auth (Supabase will send verification email)
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (!error) {
      // Update profile email after auth update
      await supabase
        .from("profiles")
        .update({ email: newEmail })
        .eq("id", user.id);
      
      // Refresh profile
      fetchProfile();
    }

    return { error };
  };

  return {
    profile,
    loading,
    updateProfile,
    updateEmail,
    refreshProfile: fetchProfile,
  };
}

