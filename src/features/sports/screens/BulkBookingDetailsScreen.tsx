// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, TextInput } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import {
  Plus,
  Minus,
  ChevronDown,
  Phone,
  User,
  Calendar,
  Clock,
  MapPin,
  X,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useBulkBooking } from "../hooks/useBulkBooking";
import { CustomDatePickerModal } from "@/components/ui";
import { useServiceStore } from "@/store/serviceStore";
import { supabase } from "@/lib/supabase";
import perf from "@react-native-firebase/perf";
import { useDebounce } from "@/hooks/useDebounce";

// IMPORT THE NEW VIEW COMPONENT
import { ViewBulkBooking } from "../components/ViewBulkBooking";
import { TimePickerModal } from "../components/TimePickerModal";
import { generateTimeSlots } from "../utils/time.utils";
import { calculateSlotPrice } from "../utils/pricing.utils";
import { SportsService } from "../services/sports.service";

const icCash = require("@/assets/icons/pay-50.png");
const icGpay = require("@/assets/icons/google-pay.png");
const icPhonepe = require("@/assets/icons/icons8-phone-pe-48.png");
const icPaytm = require("@/assets/icons/paytm.png");

// ==========================================
// CREATE MODE (Internal Component)
// ==========================================
const CreateBulkBooking = ({
  type,
  venueId,
  groundId: initialGroundId,
}: {
  type: "multi" | "single";
  venueId: string;
  groundId: string;
}) => {
  const navigation = useNavigation();

  const { selectedCategories, setServiceCategory } = useServiceStore();
  const selectedCategory = selectedCategories[venueId] || "Football";
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [ownerId, setOwnerId] = useState<string | undefined>();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setOwnerId(data.user?.id));
  }, []);

  // Guest Autocomplete Search State
  const [searchResults, setSearchResults] = useState<{ name: string; phone: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const isSelectingFromResults = React.useRef(false);

  // NEW: State for Grounds inside the form
  const [grounds, setGrounds] = useState<
    {
      id: string;
      name: string;
      sports_type?: string;
      slot_duration_minutes?: number;
      custom_pricing?: any;
      price_per_slot?: number;
      night_price_per_slot?: number;
      parent_ground_id?: string;
    }[]
  >([]);
  const [selectedGroundId, setSelectedGroundId] = useState<string>(initialGroundId || "");
  const [showGroundPicker, setShowGroundPicker] = useState(false);

  useEffect(() => {
    const fetchGrounds = async () => {
      const { data } = await supabase
        .from("sports_grounds")
        .select(
          "id, name, sports_type, slot_duration_minutes, custom_pricing, price_per_slot, night_price_per_slot, parent_ground_id",
        )
        .eq("venue_id", venueId)
        .order("display_order", { ascending: true });

      if (data && data.length > 0) {
        setGrounds(data);
      }
    };
    fetchGrounds();
  }, [venueId]);

  const categories = Array.from(
    new Set(grounds.map(g => g.sports_type).filter(Boolean)),
  ) as string[];
  const filteredGrounds = grounds.filter(g => g.sports_type === selectedCategory);

  useEffect(() => {
    if (
      filteredGrounds.length > 0 &&
      (!selectedGroundId || !filteredGrounds.some(g => g.id === selectedGroundId))
    ) {
      setSelectedGroundId(filteredGrounds[0].id);
    }
  }, [selectedCategory, filteredGrounds, selectedGroundId]);

  const [bookingType, setBookingType] = useState<"multi" | "single">(type);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [fromTime, setFromTime] = useState("7 AM");
  const [toTime, setToTime] = useState("8 AM");
  const [pricePerHour, setPricePerHour] = useState(1000);
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "gpay" | "phonepe" | "paytm">(
    "cash",
  );
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<"from" | "to" | null>(null);
  const [showHourPicker, setShowHourPicker] = useState<"from" | "to" | null>(null);
  const selectedGround = filteredGrounds.find(g => g.id === selectedGroundId);
  const slotDurationMinutes = selectedGround?.slot_duration_minutes || 60;

  const HOURS = React.useMemo(
    () => generateTimeSlots(6, 27, slotDurationMinutes),
    [slotDurationMinutes],
  );

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      setBookedSlots([]);
      if (!selectedGroundId || !fromDate) return;

      const year = fromDate.getFullYear();
      const month = String(fromDate.getMonth() + 1).padStart(2, "0");
      const day = String(fromDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const { data, error } = await supabase
        .from("sports_slots")
        .select("start_time, status")
        .eq("ground_id", selectedGroundId)
        .eq("slot_date", formattedDate);

      if (error) {
        console.error("[DEBUG] Error fetching slots:", error);
        return;
      }

      if (data) {
        const unavailable = data
          .filter(slot => slot.status === "booked")
          .map(slot => slot.start_time);
        setBookedSlots(unavailable);
      }
    };
    fetchBookedSlots();
  }, [selectedGroundId, fromDate]);

  const { confirmBulkBooking, isSubmitting } = useBulkBooking();

  const totalDays =
    bookingType === "single"
      ? 1
      : toDate
      ? Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1;

  const startIndex = HOURS.indexOf(fromTime);
  const endIndex = HOURS.indexOf(toTime);
  const numSlotsPerDay = Math.max(0, endIndex - startIndex);
  const totalSlots = totalDays * numSlotsPerDay;
  const slotMultiplier = slotDurationMinutes / 60;

  // Calculate total payment dynamically using custom pricing
  const totalPayment = React.useMemo(() => {
    if (!selectedGround || numSlotsPerDay <= 0) return 0;
    let singleDayTotal = 0;
    const selectedSlots = HOURS.slice(startIndex, endIndex);
    selectedSlots.forEach(slot => {
      singleDayTotal += calculateSlotPrice(selectedGround, slot, -1, -1, grounds) * slotMultiplier;
    });
    return singleDayTotal * totalDays;
  }, [
    selectedGround,
    numSlotsPerDay,
    HOURS,
    startIndex,
    endIndex,
    totalDays,
    grounds,
    slotMultiplier,
  ]);

  // Update pricePerHour state implicitly if totalPayment changes
  React.useEffect(() => {
    if (totalSlots > 0 && slotMultiplier > 0) {
      setPricePerHour(totalPayment / (totalSlots * slotMultiplier));
    } else {
      setPricePerHour(0);
    }
  }, [totalPayment, totalSlots, slotMultiplier]);
  const amountPaid = parseFloat(amountPaidInput || "0");
  const remainingAmount = totalPayment - amountPaid;

  const { activeVenueName } = useServiceStore();

  const handleNameChange = (text: string) => {
    isSelectingFromResults.current = false;
    setName(text);
  };

  const debouncedName = useDebounce(name, 500);

  useEffect(() => {
    const fetchGuests = async () => {
      if (isSelectingFromResults.current) {
        return;
      }

      if (debouncedName.trim().length >= 1) {
        const results = await SportsService.lookupGuestsByName(venueId, debouncedName);
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };
    fetchGuests();
  }, [debouncedName, venueId]);

  useEffect(() => {
    const lookupGuest = async () => {
      const cleanMobile = mobile.replace(/[^\d]/g, "");
      if (cleanMobile.length < 10) return;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("phone", cleanMobile)
          .maybeSingle();
        let foundName = profile?.full_name || "";
        if (!foundName) {
          const { data: lastBooking } = await supabase
            .from("sports_bookings")
            .select("guest_name")
            .eq("guest_phone", cleanMobile)
            .not("guest_name", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (lastBooking?.guest_name) foundName = lastBooking.guest_name;
        }
        if (foundName) setName(foundName);
      } catch (err) {
        console.error("Lookup error:", err);
      }
    };
    lookupGuest();
  }, [mobile]);

  const onConfirm = async () => {
    if (!mobile || !name || totalSlots <= 0 || !selectedGroundId) {
      Alert.alert("Missing Info", "Please ensure dates, times, ground, and guest info are valid.");
      return;
    }
    const amount = parseFloat(amountPaidInput || "0");
    const initialPayments = amount > 0 ? [{ mode: selectedMethod, amount }] : [];

    const trace = await perf().startTrace("bulk_booking_confirm");
    try {
      const success = await confirmBulkBooking({
        ownerId,
        venueId,
        groundId: selectedGroundId,
        category: selectedCategory,
        mobile,
        name,
        fromDate,
        toDate: bookingType === "single" ? fromDate : toDate,
        fromTime,
        toTime,
        totalAmountPerSlot: pricePerHour * slotMultiplier,
        initialPayments,
        slotDurationMinutes,
      });
      if (success) navigation.goBack();
    } finally {
      await trace.stop();
    }
  };

  // Helper to display current ground name
  const currentGroundName = grounds.find(g => g.id === selectedGroundId)?.name || "Select Ground";

  return (
    <View style={styles.flex1}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <ServiceHeader title={activeVenueName} subtitle="Bulk Booking" />

        <View style={styles.tabBar}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabPill,
                bookingType === "multi" ? styles.tabActive : styles.tabInactive,
              ]}
              onPress={() => setBookingType("multi")}>
              <Text
                style={[
                  styles.tabText,
                  bookingType === "multi" ? styles.tabTextActive : styles.tabTextInactive,
                ]}>
                Multiple days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabPill,
                bookingType === "single" ? styles.tabActive : styles.tabInactive,
              ]}
              onPress={() => setBookingType("single")}>
              <Text
                style={[
                  styles.tabText,
                  bookingType === "single" ? styles.tabTextActive : styles.tabTextInactive,
                ]}>
                Single days
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.bookingTypeTitle}>
          {bookingType === "multi" ? "MULTIPLE DAYS BULK BOOKING" : "SINGLE DAY BOOKING"}
        </Text>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Phone size={ms(18)} color="#63A1FD" fill="#63A1FD" />
            <Text style={styles.label}>Mobile No</Text>
          </View>
          <TextInput
            variant="filled"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="+91 ..."
            style={styles.inputFill}
          />
        </View>

        <View style={styles.autocompleteContainer}>
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <User size={ms(18)} color="#63A1FD" />
              <Text style={styles.label}>Name</Text>
            </View>
            <TextInput
              variant="filled"
              value={name}
              onChangeText={handleNameChange}
              placeholder="Guest Name"
              style={styles.inputFill}
              onFocus={() => {
                if (name.trim().length >= 1 && searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSearchResults(false), 300);
              }}
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
            />
          </View>

          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownHeaderText}>Select Customer</Text>
                <TouchableOpacity onPress={() => setShowSearchResults(false)}>
                  <X size={ms(20)} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="always" style={styles.dropdownScroll}>
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.name}_${item.phone}_${index}`}
                    style={styles.dropdownItemSearch}
                    onPress={() => {
                      isSelectingFromResults.current = true;
                      setName(item.name);
                      const cleanPhone = item.phone.replace(/[^\d]/g, "").slice(-10);
                      setMobile(cleanPhone);
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}>
                    <Text style={styles.dropdownItemTextLeft}>{item.name}</Text>
                    <Text style={styles.dropdownItemTextRight}>{item.phone}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* --- CATEGORY AND GROUND SELECTION --- */}
        {(categories.length > 1 || filteredGrounds.length > 0) && (
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <MapPin size={ms(18)} color="#63A1FD" />
              <Text style={styles.labelBold}>Category & Ground</Text>
            </View>
            <View style={styles.splitRow}>
              {categories.length > 1 && (
                <View style={[styles.flex1, isCategoryOpen ? { zIndex: 1000 } : { zIndex: 1 }]}>
                  <Text style={styles.subLabel}>Category</Text>
                  <TouchableOpacity
                    style={styles.inputBoxSmallRow}
                    onPress={() => setIsCategoryOpen(true)}>
                    <Text style={[styles.inputText, styles.flex1]} numberOfLines={1}>
                      {selectedCategory
                        ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
                        : "Select"}
                    </Text>
                    <ChevronDown size={ms(16)} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
              {filteredGrounds.length > 0 && (
                <View style={[styles.flex1, showGroundPicker ? { zIndex: 1000 } : { zIndex: 1 }]}>
                  <Text style={styles.subLabel}>Ground</Text>
                  <TouchableOpacity
                    style={styles.inputBoxSmallRow}
                    onPress={() => setShowGroundPicker(true)}>
                    <Text style={[styles.inputText, styles.flex1]} numberOfLines={1}>
                      {currentGroundName}
                    </Text>
                    <ChevronDown size={ms(16)} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Calendar size={ms(18)} color="#63A1FD" />
            <Text style={styles.labelBold}>Select Dates</Text>
          </View>
          <View style={styles.splitRow}>
            <View style={styles.flex1}>
              <Text style={styles.subLabel}>From</Text>
              <TouchableOpacity
                style={styles.inputBoxSmall}
                onPress={() => setShowDatePicker("from")}>
                <Text style={styles.inputText}>
                  {fromDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            </View>
            {bookingType === "multi" && (
              <View style={styles.flex1}>
                <Text style={styles.subLabel}>To</Text>
                <TouchableOpacity
                  style={styles.inputBoxSmall}
                  onPress={() => setShowDatePicker("to")}>
                  <Text style={styles.inputText}>
                    {toDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Clock size={ms(18)} color="#63A1FD" />
            <Text style={styles.labelBold}>Select Time Slots</Text>
          </View>
          <View style={styles.splitRow}>
            <View style={styles.flex1}>
              <Text style={styles.subLabel}>From</Text>
              <TouchableOpacity
                style={styles.inputBoxSmallRow}
                onPress={() => setShowHourPicker("from")}>
                <Text style={styles.inputText}>{fromTime}</Text>
                <ChevronDown size={ms(16)} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.subLabel}>To</Text>
              <TouchableOpacity
                style={styles.inputBoxSmallRow}
                onPress={() => setShowHourPicker("to")}>
                <Text style={styles.inputText}>{toTime}</Text>
                <ChevronDown size={ms(16)} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.labelBold}>Total Payment</Text>
          <TextInput
            variant="filled"
            value={totalPayment.toString()}
            onChangeText={text => {
              const newTotalPayment = parseFloat(text || "0");
              if (!isNaN(newTotalPayment) && totalSlots > 0 && slotMultiplier > 0) {
                setPricePerHour(newTotalPayment / (totalSlots * slotMultiplier)); // Calculate pricePerHour
              } else if (isNaN(newTotalPayment) && text === "") {
                setPricePerHour(0);
              }
            }}
            keyboardType="numeric"
            placeholder="₹0"
            style={styles.inputFill}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.labelBold}>Remaining Amount</Text>
          <View style={styles.inputBoxFill}>
            <Text style={[styles.inputText, styles.textDanger]}>₹ {remainingAmount}</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.labelBold}>Amount Paid</Text>
            {amountPaid > 0 && (
              <Text style={styles.labelSecondary}>(Remaining: ₹ {remainingAmount})</Text>
            )}
          </View>
          <TextInput
            variant="filled"
            value={amountPaidInput}
            onChangeText={setAmountPaidInput}
            keyboardType="numeric"
            placeholder="₹ 0"
            style={styles.inputFill}
            rightIcon={
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setIsAddingPayment(!isAddingPayment)}>
                <Text style={styles.addText}>{isAddingPayment ? "Cancel" : "Add"}</Text>
                {isAddingPayment ? (
                  <Minus size={ms(18)} color="#E55959" />
                ) : (
                  <Plus size={ms(18)} color="#00B562" />
                )}
              </TouchableOpacity>
            }
          />

          {isAddingPayment && (
            <View style={{ marginTop: vs(10), marginBottom: vs(-10) }}>
              <Text variant="body2" weight="bold" style={styles.inputLabel}>
                Payment Method
              </Text>
              <View style={styles.methodsRow}>
                {/* Cash */}
                <TouchableOpacity
                  style={[
                    styles.methodBox,
                    selectedMethod === "cash" && styles.methodBoxSelectedBlue,
                  ]}
                  onPress={() => setSelectedMethod("cash")}>
                  <Image
                    source={icCash}
                    style={[
                      styles.methodIcon,
                      selectedMethod === "cash" && styles.methodIconSelected,
                    ]}
                  />
                  <Text
                    variant="body2"
                    weight="bold"
                    style={[
                      styles.methodText,
                      selectedMethod === "cash" && styles.methodTextSelected,
                    ]}>
                    Cash
                  </Text>
                </TouchableOpacity>

                {/* GPay */}
                <TouchableOpacity
                  style={[
                    styles.methodBox,
                    selectedMethod === "gpay" && styles.methodBoxSelectedBlue,
                  ]}
                  onPress={() => setSelectedMethod("gpay")}>
                  <Image
                    source={icGpay}
                    style={[
                      styles.methodIcon,
                      selectedMethod === "gpay" && styles.methodIconSelected,
                    ]}
                  />
                  <Text
                    variant="body2"
                    weight="bold"
                    style={[
                      styles.methodText,
                      selectedMethod === "gpay" && styles.methodTextSelected,
                    ]}>
                    GPay
                  </Text>
                </TouchableOpacity>

                {/* PhonePe */}
                <TouchableOpacity
                  style={[
                    styles.methodBox,
                    selectedMethod === "phonepe" && styles.methodBoxSelectedBlue,
                  ]}
                  onPress={() => setSelectedMethod("phonepe")}>
                  <Image
                    source={icPhonepe}
                    style={[
                      styles.methodIcon,
                      selectedMethod === "phonepe" && styles.methodIconSelected,
                    ]}
                  />
                  <Text
                    variant="body2"
                    weight="bold"
                    style={[
                      styles.methodText,
                      selectedMethod === "phonepe" && styles.methodTextSelected,
                    ]}>
                    PhonePe
                  </Text>
                </TouchableOpacity>

                {/* Paytm */}
                <TouchableOpacity
                  style={[
                    styles.methodBox,
                    selectedMethod === "paytm" && styles.methodBoxSelectedBlue,
                  ]}
                  onPress={() => setSelectedMethod("paytm")}>
                  <Image
                    source={icPaytm}
                    style={[
                      styles.methodIcon,
                      selectedMethod === "paytm" && styles.methodIconSelected,
                    ]}
                  />
                  <Text
                    variant="body2"
                    weight="bold"
                    style={[
                      styles.methodText,
                      selectedMethod === "paytm" && styles.methodTextSelected,
                    ]}>
                    Paytm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.bisonText}>CONFIRM BULK BOOKING</Text>
          )}
        </TouchableOpacity>
        <View style={{ height: vs(40) }} />
      </ScrollView>

      {/* --- CUSTOM DATE PICKER --- */}
      <CustomDatePickerModal
        isVisible={!!showDatePicker}
        onClose={() => setShowDatePicker(null)}
        selectedDate={showDatePicker === "from" ? fromDate : toDate}
        minDate={showDatePicker === "to" ? fromDate : new Date()}
        onSelectDate={date => {
          if (showDatePicker === "from") {
            setFromDate(date);
            if (date > toDate) setToDate(date);
          } else {
            setToDate(date);
          }
        }}
      />

      <TimePickerModal
        visible={!!showHourPicker}
        onClose={() => setShowHourPicker(null)}
        title={`Select ${showHourPicker === "from" ? "Start" : "End"} Time`}
        hours={HOURS}
        selectedTime={showHourPicker === "from" ? fromTime : toTime}
        onSelectTime={hour => {
          if (showHourPicker === "from") {
            setFromTime(hour);
            const newFromIndex = HOURS.indexOf(hour);
            const currentToIndex = HOURS.indexOf(toTime);
            if (newFromIndex >= currentToIndex) {
              setToTime(HOURS[Math.min(newFromIndex + 1, HOURS.length - 1)]);
            }
          } else {
            setToTime(hour);
          }
          setShowHourPicker(null);
        }}
        isHourDisabled={(hour, _index) => {
          if (showHourPicker === "to") {
            const fromIndex = HOURS.indexOf(fromTime);
            if (_index <= fromIndex) return true;
          }

          const hour12h = hour;
          let [h, ampm] = hour12h.split(" ");
          let parsedHour = parseInt(h, 10);
          if (ampm === "PM" && parsedHour !== 12) parsedHour += 12;
          if (ampm === "AM" && parsedHour === 12) parsedHour = 0;

          const parsedMin = hour12h.includes(":") ? parseInt(hour12h.split(":")[1], 10) : 0;

          const slotDate = new Date(fromDate);
          slotDate.setHours(parsedHour, parsedMin, 0, 0);
          // Slots from 12 AM to 5 AM belong to the next calendar day
          if (parsedHour < 6) {
            slotDate.setDate(slotDate.getDate() + 1);
          }
          const isPast = slotDate <= new Date();

          const isBooked = bookedSlots.some(bookedTime => {
            const [bookedHourStr] = bookedTime.split(":");
            let bookedHour = parseInt(bookedHourStr, 10);
            return bookedHour === parsedHour;
          });

          return isPast || isBooked;
        }}
      />

      {/* --- NEW GROUND PICKER MODAL --- */}
      <Modal visible={showGroundPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowGroundPicker(false)}>
          <View style={styles.pickerContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredGrounds.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedGroundId(g.id);
                    setShowGroundPicker(false);
                  }}>
                  <Text style={[styles.inputText, selectedGroundId === g.id && styles.textPrimary]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- FIXED OVERLAY DROPDOWN --- */}
      {isCategoryOpen && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setIsCategoryOpen(false)}
          />
          <View style={styles.dropdownMenu}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                activeOpacity={0.7}
                onPress={() => {
                  setServiceCategory(venueId, cat);
                  setIsCategoryOpen(false);
                }}>
                <Text variant="body2" weight="semiBold" style={styles.dropdownItemText}>
                  {cat}
                </Text>
                <View style={styles.radioOuter}>
                  {selectedCategory === cat && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// ==========================================
// MAIN SCREEN EXPORT (The Smart Switch)
// ==========================================
export const BulkBookingDetailsScreen = () => {
  const route = useRoute<RouteProp<MainStackParamList, "BulkBookingDetails">>();
  const { bookingId, type, venueId, groundId } = route.params;

  return (
    <ScreenContainer backgroundColor="#FFFFFF" paddingHorizontal={hs(12)}>
      {bookingId === "new" ? (
        <CreateBulkBooking type={type || "multi"} venueId={venueId} groundId={groundId} />
      ) : (
        <ViewBulkBooking bookingId={bookingId} type={type || "multi"} />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: vs(10) },
  flex1: { flex: 1 },

  /* --- FONTS --- */
  bisonText: {
    fontFamily: "Bison-Bold",
    fontSize: fs(22),
    color: "#FFF",
    letterSpacing: 1,
    lineHeight: fs(28),
    paddingTop: vs(4),
  },
  tabText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(16) },
  bookingTypeTitle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: "#000",
    textTransform: "uppercase",
    marginBottom: vs(15),
  },
  label: { fontFamily: "Gilroy-Medium", fontSize: fs(16), color: "#000" },
  labelBold: { fontFamily: "Gilroy-Bold", fontSize: fs(16), color: "#000" },
  labelSecondary: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(12),
    color: "#666",
    marginLeft: hs(6),
  },
  inputLabel: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: "#666", marginBottom: vs(4) },
  subLabel: { fontFamily: "Gilroy-Medium", fontSize: fs(16), color: "#000", marginBottom: vs(4) },
  inputText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(16), color: "#000" },
  addText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#4A5568" },
  textDanger: { color: "#E55959" },
  textSuccessFlex: { color: "#00B562", flex: 1 },
  textPrimary: { color: "#63A1FD" },

  /* --- CREATE LAYOUT --- */
  tabBar: { flexDirection: "row", alignItems: "center", marginBottom: vs(15), gap: hs(10) },
  tabContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(4),
  },
  tabPill: {
    flex: 1,
    height: vs(32),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: ms(8),
  },
  tabActive: { backgroundColor: "#282828" },
  tabInactive: { backgroundColor: "transparent" },
  headerBadgeText: { color: "#000", fontSize: fs(18) },
  tabTextActive: { color: "#FFF" },
  tabTextInactive: { color: "#8C8C8C" },
  fieldGroup: { marginBottom: vs(15) },
  labelRow: { flexDirection: "row", alignItems: "center", gap: hs(6), marginBottom: vs(4) },
  inputFill: { backgroundColor: "#F4F7FC", borderRadius: ms(10), borderWidth: 0 },
  inputBoxSmall: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    height: vs(48),
    justifyContent: "center",
  },
  inputBoxSmallRow: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    height: vs(48),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputBoxFill: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    height: vs(48),
    justifyContent: "center",
  },
  inputBoxFillRow: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    height: vs(48),
    flexDirection: "row",
    alignItems: "center",
  },
  splitRow: { flexDirection: "row", gap: hs(10) },
  addBtn: { flexDirection: "row", alignItems: "center", gap: hs(4) },

  methodsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: vs(8),
    marginBottom: vs(12),
  },
  methodBox: {
    alignItems: "center",
    justifyContent: "center",
    width: "23%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "#D1E0FB",
  },
  methodBoxSelectedBlue: {
    backgroundColor: "#63A1FD",
    borderColor: "#63A1FD",
  },
  methodIcon: {
    width: ms(36),
    height: ms(36),
    resizeMode: "contain",
  },
  methodIconSelected: {
    tintColor: undefined,
  },
  methodText: {
    fontSize: fs(12),
    marginTop: vs(4),
    color: "#000",
  },
  methodTextSelected: {
    color: "#fff",
  },
  confirmPaymentBtn: {
    backgroundColor: "#000",
    height: vs(48),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(10),
  },
  confirmBtn: {
    backgroundColor: "#000",
    height: vs(48),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(10),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: ms(10),
    maxHeight: "50%",
    padding: ms(10),
  },
  pickerItem: {
    padding: ms(15),
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    alignItems: "center",
  },
  textDisabled: {
    color: "#A0A0A0",
  },

  /* --- FIXED OVERLAY DROPDOWN STYLES --- */
  dropdownOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000 },
  dropdownMenu: {
    position: "absolute",
    top: vs(55),
    right: hs(12),
    backgroundColor: "#FFF",
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "#EEE",
    width: hs(180),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: hs(6),
    gap: vs(6),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hs(10),
    paddingVertical: vs(8),
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: ms(8),
  },
  dropdownItemText: {
    color: "#000",
  },
  radioOuter: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: "#CBDFFE",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: "#0A4BC2",
  },
  autocompleteContainer: {
    position: "relative",
    zIndex: 1000,
  },
  dropdownContainer: {
    position: "absolute",
    top: vs(80),
    left: 0,
    right: 0,
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    maxHeight: vs(280),
    zIndex: 1001,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#cbdffe",
  },
  dropdownHeaderText: {
    fontFamily: "Gilroy-Bold",
    color: "#000",
    fontSize: fs(14),
  },
  dropdownItemSearch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(12),
    paddingHorizontal: hs(16),
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  dropdownItemTextLeft: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Medium",
    color: "#000",
  },
  dropdownItemTextRight: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Medium",
    color: "#666",
  },
  dropdownScroll: {
    maxHeight: vs(200),
  },
});
