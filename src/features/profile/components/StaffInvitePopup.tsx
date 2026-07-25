import React, { useEffect, useState } from "react";
import { View, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Text } from "@/components/ui";
import { COLORS } from "@/constants/theme";
import { ms, vs, hs } from "@/utils/responsive.utils";
import { StaffService } from "../services/staff.service";
import { useAuthStore } from "@/store";

interface StaffInvitePopupProps {
  onRefresh: () => void;
}

export const StaffInvitePopup: React.FC<StaffInvitePopupProps> = ({ onRefresh }) => {
  const { user } = useAuthStore();
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const fetchInvites = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        const pending = await StaffService.getPendingInvitesForEmail(user.email);
        setInvites(pending);
      } catch (error) {
        console.error("Error fetching invites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvites();
  }, [user?.email]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      for (const invite of invites) {
        if (invite.invite_token) {
          await StaffService.acceptStaffInvite(invite.invite_token);
        }
      }
      Alert.alert("Success", "Staff invitation accepted!");
      setInvites([]);
      onRefresh();
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      Alert.alert("Error", error?.message || "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    // We can just hide the modal for now, or optionally we could delete the invite from the database.
    // To keep it simple and safe, we'll just clear the local state so the modal hides.
    setInvites([]);
  };

  if (loading || invites.length === 0) return null;

  return (
    <Modal visible={invites.length > 0} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text variant="h3" weight="bold" style={styles.title}>
            Staff Invitation
          </Text>
          <Text variant="body2" color={COLORS.text.muted} style={styles.message}>
            You have {invites.length} pending staff invitation{invites.length > 1 ? "s" : ""}.
            Accept to access business services.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={handleDecline}
              disabled={accepting}>
              <Text variant="body1" weight="bold" color={COLORS.text.primary}>
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={accepting}>
              {accepting ? (
                <ActivityIndicator color={COLORS.text.inverse} size="small" />
              ) : (
                <Text variant="body1" weight="bold" color={COLORS.text.inverse}>
                  Accept Invite
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: hs(20),
  },
  modalContainer: {
    width: "100%",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(12),
    padding: ms(20),
    alignItems: "center",
  },
  title: {
    marginBottom: vs(10),
  },
  message: {
    textAlign: "center",
    marginBottom: vs(20),
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: hs(12),
  },
  declineBtn: {
    flex: 1,
    backgroundColor: COLORS.surface.secondary,
    paddingVertical: vs(12),
    borderRadius: ms(8),
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border.pillActive,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: vs(12),
    borderRadius: ms(8),
    alignItems: "center",
  },
});
