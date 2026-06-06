// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ChevronDown, ChevronUp, ChevronLeft } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = {
  sports: [
    {
      question: "How do I create a bulk booking for a regular client?",
      answer:
        "You can create bulk bookings through the 'Bulk Booking' option in the Essentials tab. Select the venue, ground, and the dates/times to block multiple slots at once.",
    },
    {
      question: "Can I block a ground for maintenance?",
      answer:
        "Yes, use the 'Block / Unblock' feature in the Essentials tab to select specific slots or full days and mark them as unavailable for maintenance.",
    },
    {
      question: "When do I receive my payouts for sports bookings?",
      answer:
        "Payouts are typically processed based on your agreement (e.g., weekly or monthly). You can view the details and download reports in the 'Payouts' section.",
    },
    {
      question: "How do I handle offline payments from walk-in customers?",
      answer:
        "When a customer pays at the venue, you can record the booking as 'Offline' in the app to ensure your inventory is updated and the slot is blocked.",
    },
  ],
  staycation: [
    {
      question: "How do I manage check-ins and check-outs?",
      answer:
        "The 'Home' screen shows all upcoming bookings and check-outs for today. You can tap on any booking to view details or update its status.",
    },
    {
      question: "Can I offer seasonal discounts for my farmhouse or resort?",
      answer:
        "Yes, go to 'Offers' in the Essentials tab to create coupons or flat discounts for specific date ranges.",
    },
    {
      question: "What should I do if I need to close my property for a few days?",
      answer:
        "Use the 'Close date' feature in the Essentials tab to select the start and end dates when your property will be unavailable for booking.",
    },
    {
      question: "How are extra guest charges calculated?",
      answer:
        "Extra guest charges are added automatically based on the 'Extra Guest Charge' you've set in your venue configuration when a booking exceeds the base capacity.",
    },
  ],
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.questionContainer} onPress={toggleExpand} activeOpacity={0.7}>
        <Text variant="body2" weight="semiBold" style={styles.questionText}>
          {question}
        </Text>
        {expanded ? (
          <ChevronUp size={ms(18)} color={COLORS.primary} />
        ) : (
          <ChevronDown size={ms(18)} color={COLORS.text.muted} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.answerContainer}>
          <Text variant="body2" color={COLORS.text.muted} style={styles.answerText}>
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
};

export const FAQScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, "FAQ">>();
  const vertical = route.params?.vertical || "sports";
  const data = FAQ_DATA[vertical as keyof typeof FAQ_DATA] || FAQ_DATA.sports;

  return (
    <ScreenContainer backgroundColor={COLORS.background}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold">
          FAQ's
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="body1" weight="semiBold" style={styles.sectionTitle}>
          Frequently Asked Questions
        </Text>
        <Text variant="caption" color={COLORS.text.muted} style={styles.subtitle}>
          Find answers to common questions about managing your {vertical} service.
        </Text>

        <View style={styles.listContainer}>
          {data.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: hs(16),
    paddingVertical: vs(12),
    gap: hs(12),
  },
  backBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: COLORS.surface.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: hs(16),
    paddingBottom: vs(40),
  },
  sectionTitle: {
    marginTop: vs(20),
    fontSize: fs(18),
  },
  subtitle: {
    marginTop: vs(4),
    marginBottom: vs(24),
  },
  listContainer: {
    gap: vs(12),
  },
  faqItem: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(12),
    overflow: "hidden",
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hs(16),
    paddingVertical: vs(16),
  },
  questionText: {
    flex: 1,
    paddingRight: hs(12),
    color: COLORS.text.primary,
  },
  answerContainer: {
    paddingHorizontal: hs(16),
    paddingBottom: vs(16),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.navBar,
    paddingTop: vs(12),
  },
  answerText: {
    lineHeight: fs(20),
  },
});
