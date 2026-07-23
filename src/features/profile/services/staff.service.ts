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
      .eq("client_role", "staff");

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

  /**
   * Invites a new staff member
   */
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

    // Check if an invite already exists
    // Since we are moving to array overlap, checking if ANY of the assignedVenueIds exist for this email
    // This query checks if the array overlaps with the new assignedVenueIds
    const { data: existing } = await supabase
      .from("staff_invites")
      .select("id")
      .eq("email", email)
      .overlaps("assigned_venue_ids", assignedVenueIds)
      .single();

    if (existing) {
      throw new Error("An invite for this email already exists for this venue.");
    }

    const { data, error } = await supabase
      .from("staff_invites")
      .insert([
        {
          owner_id,
          email,
          phone,
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
   * Deletes a pending invite or soft-deletes a staff profile
   */
  async deleteStaff(id: string, isInvite: boolean) {
    if (isInvite) {
      const { error } = await supabase.from("staff_invites").delete().eq("id", id);
      if (error) throw error;
    } else {
      // Soft delete for client_profiles
      const { error } = await supabase
        .from("client_profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
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
