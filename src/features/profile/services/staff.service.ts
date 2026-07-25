import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  permissions: string[];
  isInvite: boolean;
  status: "active" | "blocked" | "pending";
}

export const StaffService = {
  /**
   * Fetches the merged list of pending invites and active staff for a given venue.
   */
  async getStaffList(venueId: string): Promise<StaffMember[]> {
    // 1. Fetch pending invites. The schema uses an array `assigned_venue_ids`
    const { data: invites, error: inviteError } = await supabase
      .from("staff_invites")
      .select("*")
      .contains("assigned_venue_ids", [venueId])
      .eq("status", "pending");

    if (inviteError) {
      console.error("Error fetching staff invites:", inviteError);
      throw inviteError;
    }

    // 2. Fetch accepted staff from client_profiles
    const { data: activeStaff, error: staffError } = await supabase
      .from("client_profiles")
      .select("*")
      .contains("assigned_venue_ids", [venueId])
      .eq("client_role", "staff")
      .is("deleted_at", null);

    if (staffError) {
      console.error("Error fetching active staff:", staffError);
      throw staffError;
    }

    // 3. Fetch corresponding profiles for active staff
    let profilesMap: Record<string, any> = {};
    if (activeStaff && activeStaff.length > 0) {
      const userIds = activeStaff.map(s => s.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("*").in("id", userIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
          }, {} as Record<string, any>);
        }
      }
    }

    const formattedInvites: StaffMember[] = (invites || []).map(invite => ({
      id: invite.id,
      name: invite.name || invite.email.split("@")[0], // Fallback if name is missing
      email: invite.email,
      phone: invite.phone,
      permissions: invite.permissions || [],
      isInvite: true,
      status: "pending",
    }));

    const formattedActiveStaff: StaffMember[] = (activeStaff || []).map(staff => {
      const profile = profilesMap[staff.user_id];
      return {
        id: staff.id,
        name: profile?.full_name || staff.business_name || "Unknown Staff",
        email: profile?.email || "No Email",
        phone: profile?.phone || staff.phone || "",
        permissions: staff.permissions || [],
        isInvite: false,
        status: staff.account_status,
      };
    });

    return [...formattedInvites, ...formattedActiveStaff];
  },

  /**
   * Fetches all pending invites for a given email address
   */
  async getPendingInvitesForEmail(email: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("staff_invites")
      .select("*")
      .eq("email", email)
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching pending invites by email:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetches a single staff member or invite by ID
   */
  async getStaffMember(id: string, isInvite: boolean): Promise<any> {
    const table = isInvite ? "staff_invites" : "client_profiles";
    const { data, error } = await supabase.from(table).select("*").eq("id", id).single();

    if (error) {
      console.error("Error fetching staff member:", error);
      throw error;
    }

    if (!isInvite && data.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user_id)
        .single();

      if (profile) {
        data.name = profile.full_name;
        data.email = profile.email;
        data.phone = profile.phone || data.phone;
      }
    }

    return data;
  },

  async inviteStaff({
    assignedVenueIds,
    email,
    name: _name, // In the schema, name doesn't exist, we just have email, phone. But we can ignore name.
    phone,
    address: _address,
    joiningDate: _joiningDate,
    permissions,
  }: {
    assignedVenueIds: string[];
    email: string;
    name: string;
    phone?: string;
    address?: string;
    joiningDate?: string;
    permissions: string[];
  }) {
    const owner_id = useAuthStore.getState().clientProfile?.id;

    if (!owner_id) {
      throw new Error("You must be logged in as an owner to invite staff.");
    }

    // 1. Check if an invite already exists for this exact owner + email
    const { data: existingInvite } = await supabase
      .from("staff_invites")
      .select("*")
      .eq("owner_id", owner_id)
      .eq("email", email)
      .maybeSingle();

    if (existingInvite) {
      // Check if they are already assigned to this specific venue
      const alreadyAssigned = existingInvite.assigned_venue_ids?.includes(assignedVenueIds[0]);

      if (alreadyAssigned) {
        throw new Error("This staff member is already assigned to this venue.");
      }

      // Merge new venues and permissions
      const mergedVenues = Array.from(
        new Set([...(existingInvite.assigned_venue_ids || []), ...assignedVenueIds]),
      );
      const mergedPerms = Array.from(
        new Set([...(existingInvite.permissions || []), ...permissions]),
      );

      if (existingInvite.status === "pending") {
        // Just update the pending invite
        const { data, error } = await supabase
          .from("staff_invites")
          .update({
            assigned_venue_ids: mergedVenues,
            permissions: mergedPerms,
          })
          .eq("id", existingInvite.id)
          .select()
          .single();

        if (error) throw error;
        return data; // Successfully merged pending invite
      } else if (existingInvite.status === "accepted") {
        // They are an active staff member! We must update their client_profile.
        // First, we need to find their user_id. We can do this by searching the 'profiles' table by email.
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (!userProfile) {
          throw new Error("Could not find the user profile for this active staff member.");
        }

        // Find their client_profile ID
        const { data: clientProfile } = await supabase
          .from("client_profiles")
          .select("id, assigned_venue_ids, permissions")
          .eq("user_id", userProfile.id)
          .eq("owner_id", owner_id)
          .eq("client_role", "staff")
          .maybeSingle();

        if (!clientProfile) {
          throw new Error("Could not find the active staff profile to update.");
        }

        const mergedActiveVenues = Array.from(
          new Set([...(clientProfile.assigned_venue_ids || []), ...assignedVenueIds]),
        );
        const mergedActivePerms = Array.from(
          new Set([...(clientProfile.permissions || []), ...permissions]),
        );

        // Update their permissions using the existing RPC
        const { error } = await supabase.rpc("update_staff_permissions", {
          p_staff_id: clientProfile.id,
          p_permissions: mergedActivePerms,
          p_assigned_venue_ids: mergedActiveVenues,
        });

        if (error) throw error;

        // Also update the original invite record to keep them in sync
        await supabase
          .from("staff_invites")
          .update({
            assigned_venue_ids: mergedActiveVenues,
            permissions: mergedActivePerms,
          })
          .eq("id", existingInvite.id);

        // Return a dummy data object so the UI knows it succeeded
        return {
          ...existingInvite,
          assigned_venue_ids: mergedActiveVenues,
          permissions: mergedActivePerms,
        };
      }
    }

    // 2. If no invite exists, create a new one
    const { data, error } = await supabase
      .from("staff_invites")
      .insert([
        {
          owner_id,
          email,
          phone,
          name: _name,
          address: _address,
          joining_date: _joiningDate,
          assigned_venue_ids: assignedVenueIds,
          permissions,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating invite:", error);
      throw error;
    }

    // Call the Edge Function to send the email
    try {
      const clientProfile = useAuthStore.getState().clientProfile;
      await supabase.functions.invoke("send-staff-invite", {
        body: {
          email: data.email,
          inviteToken: data.invite_token,
          businessName: clientProfile?.business_name,
        },
      });
    } catch (funcError) {
      console.warn("Failed to invoke send-staff-invite function:", funcError);
      // We don't throw here because the invite was successfully created in the DB
    }

    return data;
  },

  /**
   * Accepts a staff invite using a token and the RPC function
   */
  async acceptStaffInvite(token: string) {
    const { data, error } = await supabase.rpc("accept_staff_invite", {
      p_invite_token: token,
    });

    if (error) {
      console.error("Error accepting staff invite:", error);
      throw error;
    }
    return data;
  },

  /**
   * Updates an existing invite or staff profile
   */
  async updateStaffPermissions(
    id: string,
    isInvite: boolean,
    permissions: string[],
    assignedVenueIds?: string[],
  ) {
    if (isInvite) {
      const updateData: any = { permissions };
      if (assignedVenueIds) {
        updateData.assigned_venue_ids = assignedVenueIds;
      }
      const { data, error } = await supabase
        .from("staff_invites")
        .update(updateData)
        .eq("id", id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Failed to update invite.");
      }
    } else {
      // Use the RPC to bypass RLS for active staff members
      const { error } = await supabase.rpc("update_staff_permissions", {
        p_staff_id: id,
        p_permissions: permissions,
        p_assigned_venue_ids: assignedVenueIds || null,
      });

      if (error) {
        console.error("RPC Error:", error);
        throw new Error("Failed to update active staff member permissions.");
      }
    }
  },

  /**
   * Deletes a pending invite or a staff profile along with their invite
   */
  async deleteStaff(id: string, isInvite: boolean) {
    if (isInvite) {
      const { error } = await supabase.from("staff_invites").delete().eq("id", id);
      if (error) throw error;
    } else {
      // 1. Get the client_profile to find the user_id
      const { data: clientProfile, error: profileErr } = await supabase
        .from("client_profiles")
        .select("user_id, owner_id")
        .eq("id", id)
        .single();

      if (profileErr) throw profileErr;

      if (clientProfile && clientProfile.user_id) {
        // 2. Get the user's email from the profiles table
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", clientProfile.user_id)
          .single();

        if (userProfile && userProfile.email) {
          // 3. Delete the corresponding staff_invite
          await supabase
            .from("staff_invites")
            .delete()
            .eq("email", userProfile.email)
            .eq("owner_id", clientProfile.owner_id);
        }
      }

      // 4. Hard delete from client_profiles (This is currently blocked by Supabase RLS)
      const { error: deleteErr } = await supabase.from("client_profiles").delete().eq("id", id);

      // 5. Fallback: If RLS blocked the hard delete, we remove their venue assignments using the RPC
      // so they no longer show up in the app.
      await supabase.rpc("update_staff_permissions", {
        p_staff_id: id,
        p_permissions: [],
        p_assigned_venue_ids: [],
      });

      if (deleteErr) {
        console.error("Error deleting client_profile (RLS likely blocked it):", deleteErr);
      }
    }
  },

  /**
   * Blocks an active staff member
   */
  async blockStaff(id: string) {
    const { error } = await supabase
      .from("client_profiles")
      .update({ account_status: "blocked" })
      .eq("id", id);
    if (error) throw error;
  },
};
