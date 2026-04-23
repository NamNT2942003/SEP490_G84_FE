import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import roomTypeManagementApi from "@/features/room-type-management/api/roomTypeManagementApi";
import { roomService } from "@/features/booking/api/roomService";
import { cancellationPolicyService } from "@/features/booking/api/cancellationPolicyService";
import { useMyBranches } from "@/hooks/useMyBranches";
import "./CreateBookingByStaffModal.css";

const STEPS = ["Guest & Stay", "Rooms & Pricing", "Review & Submit"];

const makeEmptyRoom = () => ({
    roomTypeId: "",
    quantity: 1,
    price: "",
    priceModifierIds: [],
    selectedOptionCode: "",
});

const initialFormState = {
    branchId: "",
    arrivalDate: "",
    departureDate: "",
    customer: {
        fullName: "",
        email: "",
        phone: "",
    },
    specialRequests: "",
    staffNote: "",
    isPaidInitially: false,
    paymentMethod: "CASH",
    customPrepaidAmount: "",
    customRefundRate: "",
    customFreeCancelDays: "",
    rooms: [makeEmptyRoom()],
};

const PAYMENT_METHODS = [
    { value: "CASH", icon: "bi-cash-coin", label: "Cash", description: "Collect immediately at the desk" },
    { value: "TRANSFER", icon: "bi-bank", label: "Bank transfer", description: "Record a bank transfer payment" },
    { value: "CARD", icon: "bi-credit-card-2-front", label: "Card", description: "Collect payment by card" },
];

const DETAIL_LEVEL_TYPES = new Set(["DAY_OF_WEEK", "DATE_RANGE", "ADVANCE_BOOKING", "AVAILABILITY", "POLICY"]);
const BOOKING_LEVEL_TYPES = new Set(["LENGTH_OF_STAY", "OCCUPANCY", "USER_HISTORY_DISCOUNT"]);

const normalizePricingOption = (option = {}) => ({
    optionCode: option?.optionCode || option?.combinationKey || option?.mode || "UNKNOWN",
    mode: option?.mode || "UNKNOWN",
    basePrice: Number(option?.basePrice ?? 0),
    finalPrice: Number(option?.finalPrice ?? 0),
    delta: Number(option?.delta ?? 0),
    cancellationPolicyId: option?.cancellationPolicyId ?? option?.policyId ?? null,
    prepaidRate: Number(option?.prepaidRate ?? option?.prepaidPercent ?? 0),
    paymentType: option?.paymentType || option?.policyPaymentType || option?.roomPaymentType || "",
    reasons: Array.isArray(option?.reasons) ? option.reasons : [],
    modifiers: Array.isArray(option?.modifiers)
        ? option.modifiers.map((m) => ({
            priceModifierId: m?.priceModifierId,
            name: m?.name,
            type: m?.type,
            adjustmentType: m?.adjustmentType,
            adjustmentValue: Number(m?.adjustmentValue ?? 0),
            reason: m?.reason,
        }))
        : [],
});

const uniqueIds = (values = []) => [...new Set(values.filter(Boolean))];

const toMoney = (value) => Number(value || 0);

const normalizePaymentType = (value) => String(value || "").trim().toUpperCase();

const normalizePolicy = (policy = {}) => ({
    id: policy?.id ?? policy?.policyId ?? null,
    name: policy?.name || "",
    type: String(policy?.type || "").trim().toUpperCase(),
    prepaidRate: Number(policy?.prepaidRate ?? 0),
    refunRate: Number(policy?.refunRate ?? 0),
    dateRange: policy?.dateRange ?? null,
    activeTimeStart: policy?.activeTimeStart ?? null,
    activeTimeEnd: policy?.activeTimeEnd ?? null,
});

const paymentTypeLabel = (value) => {
    switch (normalizePaymentType(value)) {
        case "PAY_AT_HOTEL":
            return "Pay at hotel";
        case "PREPAID_REFUNDABLE":
            return "Prepaid (refundable)";
        case "PREPAID_NON_REFUNDABLE":
            return "Prepaid (non-refundable)";
        default:
            return value || "Not available";
    }
};

const formatVnd = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

/**
 * Tính ngày hạn huỷ miễn phí: arrivalDate - dateRange (ngày).
 */
const computeFreeCancelDeadline = (arrivalDate, dateRange) => {
    if (!arrivalDate || !dateRange) return null;
    const days = parseInt(dateRange, 10);
    if (!Number.isFinite(days) || days <= 0) return null;
    const dt = new Date(arrivalDate);
    if (isNaN(dt.getTime())) return null;
    dt.setDate(dt.getDate() - days);
    return dt;
};

const formatDeadline = (dt) => {
    if (!dt) return null;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const resolvePayableRate = (option) => {
    if (!option) return 100;
    const policyRate = Number(option.prepaidRate);
    if (Number.isFinite(policyRate) && policyRate >= 0) {
        return Math.min(100, policyRate);
    }
    return normalizePaymentType(option.paymentType) === "PAY_AT_HOTEL" ? 0 : 100;
};

export default function CreateBookingByStaffModal({ show, onClose, onSubmit, onSuccess }) {
    const { branches, isLoading: isLoadingBranches } = useMyBranches();

    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
    const [roomTypes, setRoomTypes] = useState([]);
    const [roomPricingMap, setRoomPricingMap] = useState({});
    const [expandedOptionRows, setExpandedOptionRows] = useState({});
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [availablePolicies, setAvailablePolicies] = useState([]);
    const [loadingPolicies, setLoadingPolicies] = useState(false);
    // manualPolicyId: staff chủ động chọn policy (override auto-resolve từ pricing option)
    const [manualPolicyId, setManualPolicyId] = useState(null);
    const [form, setForm] = useState(initialFormState);
    const [error, setError] = useState("");
    // policyFetchKey tăng mỗi khi cần force-refetch policy (tránh race condition khi modal mở)
    const [policyFetchKey, setPolicyFetchKey] = useState(0);

    useEffect(() => {
        if (!show) return;
        setCurrentStep(0);
        setSubmitting(false);
        setError("");
        setRoomTypes([]);
        setRoomPricingMap({});
        setExpandedOptionRows({});
        setSelectedPolicy(null);
        setAvailablePolicies([]);
        setLoadingPolicies(false);
        setManualPolicyId(null);
        setForm((prev) => ({
            ...initialFormState,
            branchId:
                prev.branchId ||
                (Array.isArray(branches) && branches.length === 1
                    ? String(branches[0].branchId)
                    : ""),
        }));
        // Tăng key để policy effect chạy lại sau khi form đã được reset
        setPolicyFetchKey((k) => k + 1);
    }, [show, branches]);

    useEffect(() => {
        if (!show || !form.branchId) {
            setRoomTypes([]);
            return;
        }

        let isMounted = true;
        const fetchRoomTypes = async () => {
            try {
                setLoadingRoomTypes(true);
                const data = await roomTypeManagementApi.listRoomTypesByBranch(form.branchId);
                if (isMounted) setRoomTypes(data || []);
            } catch (e) {
                if (isMounted) {
                    setRoomTypes([]);
                    setError(e?.response?.data?.message || "Failed to load room types for this branch.");
                }
            } finally {
                if (isMounted) setLoadingRoomTypes(false);
            }
        };

        fetchRoomTypes();
        return () => {
            isMounted = false;
        };
    }, [show, form.branchId]);

    // Tổng số phòng hiện tại trong form — dùng để:
    // 1) Truyền đúng totalRooms vào API để OCCUPANCY modifier được đánh giá đúng.
    // 2) Là dependency của useEffect pricing — fetch lại khi số phòng thay đổi.
    const totalRoomsForPricing = Math.max(
        1,
        form.rooms.reduce((sum, r) => sum + Number(r.quantity || 0), 0),
    );

    useEffect(() => {
        if (!show || !form.branchId || !form.arrivalDate || !form.departureDate) {
            setRoomPricingMap({});
            return;
        }

        let isMounted = true;
        const fetchPricing = async () => {
            try {
                const params = {
                    branchId: Number(form.branchId),
                    checkIn: form.arrivalDate,
                    checkOut: form.departureDate,
                    adults: 1,
                    children: 0,
                    // Truyền totalRooms đúng để backend đánh giá OCCUPANCY modifier.
                    totalRooms: totalRoomsForPricing,
                    page: 0,
                    size: 200,
                    sortPrice: "priceAsc",
                };

                // Thêm policy nếu staff đã chọn — để có được pricingOptions với L3-POLICY modifier.
                if (manualPolicyId) {
                    params.policy = manualPolicyId;
                }

                const data = await roomService.searchRooms(params);

                if (!isMounted) return;
                const map = {};
                (data?.content || []).forEach((room) => {
                    map[String(room.roomTypeId)] = {
                        roomTypeId: room.roomTypeId,
                        name: room.name,
                        availableCount: Number(room.availableCount ?? 0),
                        paymentType: room.paymentType || room?.pricingCombinationPolicy?.paymentType || "",
                        pricingOptions: (Array.isArray(room.pricingOptions) ? room.pricingOptions : [])
                            .map(normalizePricingOption)
                            .sort((a, b) => a.finalPrice - b.finalPrice),
                    };
                });
                setRoomPricingMap(map);
            } catch {
                if (isMounted) setRoomPricingMap({});
            }
        };

        fetchPricing();
        return () => {
            isMounted = false;
        };
        // totalRoomsForPricing: re-fetch khi số phòng thay đổi — OCCUPANCY cần được re-evaluate.
        // manualPolicyId: re-fetch khi staff chọn policy — để có L3-POLICY modifier trong options.
    }, [show, form.branchId, form.arrivalDate, form.departureDate, totalRoomsForPricing, manualPolicyId]);

    // Fetch danh sách policy khả dĩ theo seasonal window của ngày check-in.
    // Dùng policyFetchKey để force re-run sau khi modal reset form (tránh race condition).
    useEffect(() => {
        const branchIdNum = Number(form.branchId);
        const isValidBranch = Number.isFinite(branchIdNum) && branchIdNum > 0;

        if (!show || !isValidBranch) {
            setAvailablePolicies([]);
            return;
        }

        let isMounted = true;
        const fetchActivePolicies = async () => {
            setLoadingPolicies(true);
            try {
                const checkIn = form.arrivalDate || null;
                console.log("[CBSM] Fetching policies:", { branchId: branchIdNum, checkIn });
                const data = await cancellationPolicyService.getActivePoliciesForDate(
                    branchIdNum,
                    checkIn,
                );
                console.log("[CBSM] Policies received:", data);
                if (isMounted) setAvailablePolicies(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("[CBSM] Failed to fetch policies:", err?.response?.status, err?.message);
                if (isMounted) setAvailablePolicies([]);
            } finally {
                if (isMounted) setLoadingPolicies(false);
            }
        };
        fetchActivePolicies();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, form.branchId, form.arrivalDate, policyFetchKey]);


    useEffect(() => {
        if (!show) return;
        setForm((prev) => ({
            ...prev,
            rooms: prev.rooms.map((room) => {
                const roomTypeId = String(room.roomTypeId || "");
                if (!roomTypeId) return room;
                const options = roomPricingMap[roomTypeId]?.pricingOptions || [];
                if (!options.length) {
                    return { ...room, selectedOptionCode: "", priceModifierIds: [] };
                }
                const selected = options.find((opt) => opt.optionCode === room.selectedOptionCode) || options[0];
                const detailIds = uniqueIds(
                    (selected.modifiers || [])
                        .filter((m) => DETAIL_LEVEL_TYPES.has(m?.type))
                        .map((m) => m?.priceModifierId),
                );
                return {
                    ...room,
                    selectedOptionCode: selected.optionCode,
                    priceModifierIds: detailIds,
                    price: selected.finalPrice,
                };
            }),
        }));
    }, [roomPricingMap, show]);


    const roomTypeById = useMemo(() => {
        const map = {};
        roomTypes.forEach((rt) => {
            map[String(rt.roomTypeId)] = rt;
        });
        return map;
    }, [roomTypes]);

    const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

    const updatePaymentMethod = (paymentMethod) => {
        updateForm({ paymentMethod });
    };

    const updateCustomer = (key, value) => {
        setForm((prev) => ({
            ...prev,
            customer: { ...prev.customer, [key]: value },
        }));
    };

    const updateRoom = async (index, patch) => {
        setForm((prev) => {
            const nextRooms = [...prev.rooms];
            const next = { ...nextRooms[index], ...patch };
            nextRooms[index] = next;
            return { ...prev, rooms: nextRooms };
        });

        if (patch.roomTypeId) {
            const id = String(patch.roomTypeId);
            const options = roomPricingMap[id]?.pricingOptions || [];
            const selected = options[0] || null;
            if (selected) {
                const detailIds = uniqueIds(
                    (selected.modifiers || [])
                        .filter((m) => DETAIL_LEVEL_TYPES.has(m?.type))
                        .map((m) => m?.priceModifierId),
                );
                setForm((prev) => {
                    const nextRooms = [...prev.rooms];
                    nextRooms[index] = {
                        ...nextRooms[index],
                        selectedOptionCode: selected.optionCode,
                        priceModifierIds: detailIds,
                        price: selected.finalPrice,
                    };
                    return { ...prev, rooms: nextRooms };
                });
            }
        }
    };

    const addRoom = () => {
        setForm((prev) => ({
            ...prev,
            rooms: [...prev.rooms, makeEmptyRoom()],
        }));
    };

    const removeRoom = (index) => {
        setForm((prev) => {
            const nextRooms = prev.rooms.filter((_, i) => i !== index);
            return {
                ...prev,
                rooms: nextRooms.length > 0 ? nextRooms : [makeEmptyRoom()],
            };
        });
    };

    const choosePricingOption = (roomIndex, option) => {
        setForm((prev) => {
            const nextRooms = [...prev.rooms];
            const room = nextRooms[roomIndex];
            const detailIds = uniqueIds(
                (option?.modifiers || [])
                    .filter((m) => DETAIL_LEVEL_TYPES.has(m?.type))
                    .map((m) => m?.priceModifierId),
            );
            nextRooms[roomIndex] = {
                ...room,
                selectedOptionCode: option?.optionCode || "",
                priceModifierIds: detailIds,
                price: option?.finalPrice ?? room.price,
            };
            return { ...prev, rooms: nextRooms };
        });
    };

    const validateStep = (step) => {
        if (step === 0) {
            if (!form.branchId) return "Please select a branch.";
            if (!form.arrivalDate || !form.departureDate) return "Arrival and departure dates are required.";
            if (form.arrivalDate >= form.departureDate) return "Departure date must be after arrival date.";
            if (!form.customer.fullName?.trim()) return "Guest full name is required.";
            if (!form.customer.email?.trim() && !form.customer.phone?.trim()) {
                return "At least email or phone is required.";
            }
        }

        if (step === 1) {
            if (!Array.isArray(form.rooms) || form.rooms.length === 0) {
                return "Please add at least one room line.";
            }
            for (let i = 0; i < form.rooms.length; i += 1) {
                const room = form.rooms[i];
                if (!room.roomTypeId) return `Room line ${i + 1}: please choose a room type.`;
                if (!room.quantity || Number(room.quantity) <= 0) return `Room line ${i + 1}: quantity must be greater than 0.`;
                const options = roomPricingMap[String(room.roomTypeId)]?.pricingOptions || [];
                if (options.length > 0 && !room.selectedOptionCode) {
                    return `Room line ${i + 1}: please select a pricing package.`;
                }
            }
            if (duplicateRoomTypeNames.length > 0) {
                return `Duplicate room type detected (${duplicateRoomTypeNames.join(", ")}). Please merge duplicates or keep only one line per room type.`;
            }
            if (selectedPaymentType === "MIXED") {
                return "Selected pricing packages use different payment policies. Please keep all room lines under the same policy.";
            }
            if (selectedPolicyIds.length > 1) {
                return "Selected pricing packages are using different cancellation policies. Please use one consistent policy for all room lines.";
            }

            if (form.customPrepaidAmount !== "" && form.customPrepaidAmount != null) {
                const amt = Number(form.customPrepaidAmount);
                if (!Number.isFinite(amt) || amt < 0) {
                    return "Prepaid Amount override must be a valid number >= 0.";
                }
                if (amt > estimatedGrandTotal) {
                    const formattedMax = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(estimatedGrandTotal);
                    return `Prepaid Amount override cannot exceed the total booking price (${formattedMax}).`;
                }
            }
            if (form.customRefundRate !== "" && form.customRefundRate != null) {
                const rate = Number(form.customRefundRate);
                if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
                    return "Refund Rate override must be a number between 0 and 100.";
                }
            }
            if (form.customFreeCancelDays !== "" && form.customFreeCancelDays != null) {
                const days = Number(form.customFreeCancelDays);
                if (!Number.isInteger(days) || days < 0) {
                    return "Free Cancel Days override must be an integer >= 0.";
                }
            }
        }

        return "";
    };

    const nextStep = () => {
        const err = validateStep(currentStep);
        if (err) {
            setError(err);
            Swal.fire({
                icon: "warning",
                title: "Please complete the required information",
                text: err,
                confirmButtonColor: "#465c47",
                confirmButtonText: "Understood",
            });
            return;
        }
        setError("");
        setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const prevStep = () => {
        setError("");
        setCurrentStep((s) => Math.max(s - 1, 0));
    };

    const mergeDuplicateRoomTypes = () => {
        setForm((prev) => {
            const map = new Map();

            prev.rooms.forEach((room) => {
                const roomTypeId = String(room.roomTypeId || "").trim();
                if (!roomTypeId) {
                    const key = `EMPTY_${Math.random()}`;
                    map.set(key, { ...room });
                    return;
                }

                const key = `${roomTypeId}`;
                if (!map.has(key)) {
                    map.set(key, {
                        ...room,
                        quantity: Number(room.quantity || 0),
                        priceModifierIds: uniqueIds(room.priceModifierIds || []),
                    });
                    return;
                }

                const current = map.get(key);
                map.set(key, {
                    ...current,
                    quantity: Number(current.quantity || 0) + Number(room.quantity || 0),
                    priceModifierIds: uniqueIds([...(current.priceModifierIds || []), ...(room.priceModifierIds || [])]),
                });
            });

            return {
                ...prev,
                rooms: Array.from(map.values()),
            };
        });
    };

    const duplicateRoomTypeNames = useMemo(() => {
        const roomTypeCount = new Map();
        form.rooms.forEach((room) => {
            const id = String(room.roomTypeId || "").trim();
            if (!id) return;
            roomTypeCount.set(id, (roomTypeCount.get(id) || 0) + 1);
        });

        return Array.from(roomTypeCount.entries())
            .filter(([, count]) => count > 1)
            .map(([id]) => roomTypeById[id]?.name || `RoomType #${id}`);
    }, [form.rooms, roomTypeById]);

    const roomSubtotal = useMemo(() => {
        return form.rooms.reduce((sum, room) => {
            const unit = Number(room.price || roomTypeById[String(room.roomTypeId)]?.basePrice || 0);
            const qty = Number(room.quantity || 0);
            return sum + unit * qty;
        }, 0);
    }, [form.rooms, roomTypeById]);

    const roomSummaryRows = useMemo(() => {
        return form.rooms.map((room, index) => {
            const roomTypeName = roomTypeById[String(room.roomTypeId)]?.name || `Line ${index + 1}`;
            const option = (roomPricingMap[String(room.roomTypeId)]?.pricingOptions || [])
                .find((opt) => opt.optionCode === room.selectedOptionCode);
            const baseUnit = toMoney(option?.basePrice || roomTypeById[String(room.roomTypeId)]?.basePrice || 0);
            const finalUnit = toMoney(option?.finalPrice || baseUnit);
            const qty = Number(room.quantity || 0);
            const baseLine = baseUnit * qty;
            const unitDelta = finalUnit - baseUnit;
            const lineDelta = unitDelta * qty;

            return {
                roomTypeName,
                qty,
                baseLine,
                lineDelta,
                lineTotal: Math.max(0, finalUnit * qty),
                payableNow: Math.max(0, finalUnit * qty * resolvePayableRate(option) / 100),
            };
        });
    }, [form.rooms, roomTypeById, roomPricingMap]);

    const roomDeltaTotal = useMemo(() => {
        return roomSummaryRows.reduce((sum, row) => sum + row.lineDelta, 0);
    }, [roomSummaryRows]);

    const roomTotalAfterRoomModifiers = useMemo(() => Math.max(0, roomSubtotal + roomDeltaTotal), [roomSubtotal, roomDeltaTotal]);
    const bookingModifierDeltaTotal = 0;

    const selectedPaymentTypes = useMemo(() => {
        const types = form.rooms.map((room) => {
            const option = (roomPricingMap[String(room.roomTypeId)]?.pricingOptions || [])
                .find((opt) => opt.optionCode === room.selectedOptionCode);
            return normalizePaymentType(option?.paymentType || roomPricingMap[String(room.roomTypeId)]?.paymentType);
        }).filter(Boolean);

        return uniqueIds(types);
    }, [form.rooms, roomPricingMap]);

    const selectedPaymentType = selectedPaymentTypes.length === 1
        ? selectedPaymentTypes[0]
        : selectedPaymentTypes.length > 1
            ? "MIXED"
            : "";

    const selectedPolicyIds = useMemo(() => {
        const policyIds = form.rooms
            .map((room) => {
                const option = (roomPricingMap[String(room.roomTypeId)]?.pricingOptions || [])
                    .find((opt) => opt.optionCode === room.selectedOptionCode);
                return option?.cancellationPolicyId;
            })
            .filter((id) => Number.isFinite(Number(id)));

        return uniqueIds(policyIds.map((id) => Number(id)));
    }, [form.rooms, roomPricingMap]);

    // Auto-resolve policy từ pricing option (chỉ khi không có manual selection)
    const autoPolicyId = selectedPolicyIds.length === 1 ? selectedPolicyIds[0] : null;

    // effectivePolicyId: ưu tiên manual selection của staff, fallback về auto từ pricing
    const effectivePolicyId = manualPolicyId ?? autoPolicyId;

    useEffect(() => {
        if (!show || !effectivePolicyId) {
            setSelectedPolicy(null);
            return;
        }

        let isMounted = true;

        const fetchSelectedPolicy = async () => {
            try {
                const data = await cancellationPolicyService.getById(effectivePolicyId);
                if (isMounted) {
                    setSelectedPolicy(normalizePolicy(data));
                }
            } catch {
                if (isMounted) {
                    setSelectedPolicy(null);
                }
            }
        };

        fetchSelectedPolicy();

        return () => {
            isMounted = false;
        };
    }, [show, effectivePolicyId]);

    const selectedPolicyType = String(selectedPolicy?.type || "").trim().toUpperCase();
    const selectedPaymentLabel = selectedPolicy?.name
        ? selectedPolicy.name
        : selectedPaymentType === "MIXED"
            ? "Mixed payment policies"
            : paymentTypeLabel(selectedPaymentType);

    const estimatedGrandTotal = useMemo(() => {
        return Math.max(0, roomTotalAfterRoomModifiers + bookingModifierDeltaTotal);
    }, [roomTotalAfterRoomModifiers, bookingModifierDeltaTotal]);

    const prepaidAmtBase = selectedPolicy ? Math.round(estimatedGrandTotal * (selectedPolicy.prepaidRate || 0) / 100) : estimatedGrandTotal;

    const payableNowAmount = useMemo(() => {
        if (form.customPrepaidAmount !== "") return Number(form.customPrepaidAmount);
        return prepaidAmtBase;
    }, [form.customPrepaidAmount, prepaidAmtBase]);

    const selectedIsPaidInitially = payableNowAmount > 0;
    const selectedPaymentMethod = form.paymentMethod || "CASH";

    if (!show) return null;

    const submit = async () => {
        const err = validateStep(0) || validateStep(1);
        if (err) {
            setError(err);
            return;
        }

        // ── Build payload ───────────────────────────────────────────────
        const mergedBookingModifierIds = uniqueIds(
            form.rooms.flatMap((room) => {
                const option = (roomPricingMap[String(room.roomTypeId)]?.pricingOptions || [])
                    .find((opt) => opt.optionCode === room.selectedOptionCode);
                return (option?.modifiers || [])
                    .filter((m) => BOOKING_LEVEL_TYPES.has(m?.type))
                    .map((m) => m?.priceModifierId);
            }),
        );

        const payload = {
            branchId: Number(form.branchId),
            arrivalDate: form.arrivalDate,
            departureDate: form.departureDate,
            customer: {
                fullName: form.customer.fullName?.trim() || "",
                email: form.customer.email?.trim() || "",
                phone: form.customer.phone?.trim() || "",
            },
            rooms: form.rooms.map((room) => {
                const option = (roomPricingMap[String(room.roomTypeId)]?.pricingOptions || [])
                    .find((opt) => opt.optionCode === room.selectedOptionCode);
                const modifierIds = uniqueIds(
                    (option?.modifiers || [])
                        .filter((m) => DETAIL_LEVEL_TYPES.has(m?.type))
                        .map((m) => m?.priceModifierId),
                );
                return {
                    roomTypeId: String(room.roomTypeId),
                    quantity: Number(room.quantity),
                    price: Number(room.price ?? option?.finalPrice ?? option?.basePrice ?? 0),
                    priceModifierIds: modifierIds,
                };
            }),
            bookingPriceModifierIds: mergedBookingModifierIds,
            appliedPolicyId: effectivePolicyId,
            specialRequests: form.specialRequests?.trim() || "",
            staffNote: form.staffNote?.trim() || "",
            prepaidAmount: form.customPrepaidAmount !== "" ? Number(form.customPrepaidAmount) : null,
            snapshotRefundRate: form.customRefundRate !== "" ? Number(form.customRefundRate) : null,
            snapshotFreeCancelDays: form.customFreeCancelDays !== "" ? Number(form.customFreeCancelDays) : null,
            isPaidInitially: selectedIsPaidInitially,
            paymentMethod: selectedPaymentMethod,
        };

        // ── Confirmation dialog ─────────────────────────────────────────
        const branchLabel = branches?.find((b) => String(b.id || b.branchId) === String(form.branchId))?.branchName || `Branch #${form.branchId}`;
        const prepaidAmt = form.customPrepaidAmount !== "" ? Number(form.customPrepaidAmount) : prepaidAmtBase;
        const refundRateToDisplay = form.customRefundRate !== "" ? form.customRefundRate : (selectedPolicy?.refunRate || 0);
        const roomSummaryRows = form.rooms.map((room) => {
            const rtName = roomTypes?.find((rt) => String(rt.id || rt.roomTypeId) === String(room.roomTypeId))?.name || `Room #${room.roomTypeId}`;
            return `<tr>
                <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0">${rtName}</td>
                <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;text-align:center">${room.quantity}</td>
                <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">${formatVnd(Number(room.price) * Number(room.quantity))}</td>
            </tr>`;
        }).join("");

        const policyRow = selectedPolicy
            ? `<tr>
                <td colspan="3" style="padding:8px;background:#f0fdf4;border-radius:6px;text-align:center;color:#15803d;font-size:12px">
                    🛡 <strong>${selectedPolicy.name}</strong> — Prepaid: <strong>${formatVnd(prepaidAmt)}</strong> ${form.customPrepaidAmount !== "" ? "(Adjusted)" : `(${selectedPolicy.prepaidRate}%)`} • Refund if cancelled: ${refundRateToDisplay}% ${form.customRefundRate !== "" ? "(Adjusted)" : ""}
                </td>
            </tr>`
            : `<tr><td colspan="3" style="padding:6px 8px;color:#9ca3af;font-size:12px">No cancellation policy applied — 100% deposit required</td></tr>`;

        const confirmHtml = `
            <div style="text-align:left;font-family:system-ui,sans-serif">
                <!-- Cảnh báo -->
                <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:flex-start;gap:10px">
                    <span style="font-size:20px;flex-shrink:0">⚠️</span>
                    <div>
                        <div style="font-weight:800;color:#b91c1c;font-size:13px;margin-bottom:2px">This action cannot be undone!</div>
                        <div style="color:#7f1d1d;font-size:12px">Please carefully review the booking details below before confirming. Once created, the data will be saved to the system and cannot be automatically deleted.</div>
                    </div>
                </div>

                <!-- Thông tin khách -->
                <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;margin-bottom:10px">
                    <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:6px">👤 Guest</div>
                    <div style="font-weight:700;font-size:14px;color:#111827">${form.customer.fullName || "—"}</div>
                    <div style="font-size:12px;color:#6b7280">${form.customer.email || "—"} • ${form.customer.phone || "—"}</div>
                </div>

                <!-- Chi nhánh & ngày -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
                    <div style="background:#f8fafc;border-radius:8px;padding:10px 12px">
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:4px">🏨 Branch</div>
                        <div style="font-weight:700;font-size:13px;color:#1f2937">${branchLabel}</div>
                    </div>
                    <div style="background:#f8fafc;border-radius:8px;padding:10px 12px">
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:4px">📅 Stay period</div>
                        <div style="font-weight:700;font-size:13px;color:#1f2937">${form.arrivalDate} → ${form.departureDate}</div>
                    </div>
                </div>

                <!-- Phòng -->
                <div style="margin-bottom:10px">
                    <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9ca3af;margin-bottom:6px">🛏 Rooms booked</div>
                    <table style="width:100%;border-collapse:collapse;font-size:12px">
                        <thead>
                            <tr style="background:#f0f0f0">
                                <th style="padding:4px 8px;text-align:left;font-weight:700;color:#374151">Room type</th>
                                <th style="padding:4px 8px;text-align:center;font-weight:700;color:#374151">Qty</th>
                                <th style="padding:4px 8px;text-align:right;font-weight:700;color:#374151">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${roomSummaryRows}</tbody>
                        ${policyRow}
                    </table>
                </div>

                <!-- Tổng tiền -->
                <div style="background:#465c47;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="color:#c8d9c0;font-size:11px;font-weight:700;text-transform:uppercase">Grand total</div>
                        <div style="color:#fff;font-size:18px;font-weight:800">${formatVnd(estimatedGrandTotal)}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="color:#c8d9c0;font-size:11px;font-weight:700;text-transform:uppercase">Pay now (${selectedPaymentMethod})</div>
                        <div style="color:#f9d71c;font-size:16px;font-weight:800">${formatVnd(prepaidAmt)}</div>
                    </div>
                </div>
            </div>
        `;

        const { isConfirmed } = await Swal.fire({
            title: "Confirm Booking Creation",
            html: confirmHtml,
            icon: undefined,
            showCancelButton: true,
            confirmButtonText: "✓ Confirm and create booking",
            cancelButtonText: "Review again",
            confirmButtonColor: "#465c47",
            cancelButtonColor: "#6b7280",
            reverseButtons: true,
            width: 560,
            customClass: {
                confirmButton: "swal-confirm-booking",
                cancelButton: "swal-cancel-booking",
            },
        });

        if (!isConfirmed) return; // Nhân viên bấm "Kiểm tra lại"

        // ── Thực hiện tạo booking ───────────────────────────────────────
        try {
            setSubmitting(true);
            setError("");

            const result = await onSubmit(payload);

            if (onSuccess) {
                onSuccess(result);
            }

            onClose();
        } catch (e) {
            const message = e?.response?.data?.message || "Failed to create booking. Please try again.";
            setError(message);
            Swal.fire({
                icon: "error",
                title: "Create booking failed",
                text: message,
                confirmButtonColor: "#465c47",
            });
        } finally {
            setSubmitting(false);
        }
    };


    const renderStep1 = () => (
        <div className="cbsm-step-content">
            <div className="cbsm-card">
                <div className="cbsm-card-title">Guest Information</div>
                <div className="cbsm-grid cbsm-grid-3">
                    <div className="cbsm-field">
                        <label>Full name *</label>
                        <input
                            value={form.customer.fullName}
                            onChange={(e) => updateCustomer("fullName", e.target.value)}
                            placeholder="Guest full name"
                        />
                    </div>
                    <div className="cbsm-field">
                        <label>Email</label>
                        <input
                            type="email"
                            value={form.customer.email}
                            onChange={(e) => updateCustomer("email", e.target.value)}
                            placeholder="guest@email.com"
                        />
                    </div>
                    <div className="cbsm-field">
                        <label>Phone</label>
                        <input
                            value={form.customer.phone}
                            onChange={(e) => updateCustomer("phone", e.target.value)}
                            placeholder="Phone number"
                        />
                    </div>
                </div>
            </div>

            <div className="cbsm-card">
                <div className="cbsm-card-title">Stay Details</div>
                <div className="cbsm-grid cbsm-grid-3">
                    <div className="cbsm-field">
                        <label>Branch *</label>
                        <select
                            value={form.branchId}
                            onChange={(e) => updateForm({ branchId: e.target.value, rooms: [makeEmptyRoom()] })}
                            disabled={isLoadingBranches}
                        >
                            <option value="">Select branch</option>
                            {(branches || []).map((branch) => (
                                <option key={branch.branchId} value={branch.branchId}>
                                    {branch.branchName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="cbsm-field">
                        <label>Arrival date *</label>
                        <input
                            type="date"
                            value={form.arrivalDate}
                            onChange={(e) => updateForm({ arrivalDate: e.target.value })}
                        />
                    </div>
                    <div className="cbsm-field">
                        <label>Departure date *</label>
                        <input
                            type="date"
                            value={form.departureDate}
                            onChange={(e) => updateForm({ departureDate: e.target.value })}
                        />
                    </div>
                </div>
                <div className="cbsm-grid cbsm-grid-2">
                    <div className="cbsm-field">
                        <label>Special requests</label>
                        <textarea
                            value={form.specialRequests}
                            onChange={(e) => updateForm({ specialRequests: e.target.value })}
                            placeholder="Guest requests"
                            rows={2}
                        />
                    </div>
                    <div className="cbsm-field">
                        <label>Staff note</label>
                        <textarea
                            value={form.staffNote}
                            onChange={(e) => updateForm({ staffNote: e.target.value })}
                            placeholder="Internal note"
                            rows={2}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => {
        const policyBadgeClass = () => {
            switch (selectedPolicyType) {
                case "FREE_CANCEL": return "cbsm-policy-badge-free";
                case "PARTIAL_REFUND": return "cbsm-policy-badge-partial";
                case "NON_REFUND": return "cbsm-policy-badge-nonrefund";
                case "PAY_AT_HOTEL": return "cbsm-policy-badge-hotel";
                default: return "cbsm-policy-badge-partial";
            }
        };

        const cartItems = form.rooms.filter(r => r.roomTypeId);
        const totalRooms = cartItems.reduce((s, r) => s + Number(r.quantity || 0), 0);

        return (
            <div className="cbsm-s2-layout">
                {/* ── LEFT: Room Type Catalog ── */}
                <div className="cbsm-s2-left">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#2f3f30" }}>
                            <i className="bi bi-grid-3x2-gap-fill me-2" style={{ color: "#465c47" }} />
                            Room Types
                            {form.arrivalDate && form.departureDate && (
                                <span style={{ fontWeight: 400, color: "#7a8a7b", fontSize: 12, marginLeft: 8 }}>
                                    — pricing for {form.arrivalDate} → {form.departureDate}
                                </span>
                            )}
                        </div>
                        {loadingRoomTypes && (
                            <span className="cbsm-muted" style={{ fontSize: 12 }}>
                                <span className="spinner-border spinner-border-sm me-1" />Loading…
                            </span>
                        )}
                    </div>

                    {!form.branchId && (
                        <div className="cbsm-muted" style={{ marginTop: 20, textAlign: "center", padding: "32px 0" }}>
                            <i className="bi bi-building" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.4 }} />
                            Select a branch in Step 1 to see available rooms.
                        </div>
                    )}

                    {duplicateRoomTypeNames.length > 0 && (
                        <div className="cbsm-warn-box" style={{ marginBottom: 12 }}>
                            <div>Duplicate: <strong>{duplicateRoomTypeNames.join(", ")}</strong></div>
                            <button type="button" className="cbsm-btn-outline btn-sm" onClick={mergeDuplicateRoomTypes}>Merge</button>
                        </div>
                    )}

                    <div className="cbsm-rt-grid">
                        {roomTypes.map((rt) => {
                            const rtId = String(rt.roomTypeId);
                            const roomPricing = roomPricingMap[rtId] || null;
                            const pricingOptions = roomPricing?.pricingOptions || [];
                            const bestOption = pricingOptions[0] || null;
                            const roomLine = form.rooms.find(r => String(r.roomTypeId) === rtId);
                            const qty = roomLine ? Number(roomLine.quantity) : 0;
                            const selectedOption = pricingOptions.find(o => o.optionCode === roomLine?.selectedOptionCode) || bestOption;
                            const isSelected = qty > 0;
                            const hasDiscount = bestOption && bestOption.basePrice > 0 && bestOption.finalPrice < bestOption.basePrice;
                            const discountPct = hasDiscount
                                ? Math.round((1 - bestOption.finalPrice / bestOption.basePrice) * 100)
                                : 0;

                            return (
                                <div
                                    key={rtId}
                                    className={`cbsm-rt-card${isSelected ? " selected" : ""}`}
                                    onClick={() => {
                                        if (qty === 0) {
                                            if (!roomLine) {
                                                const newRoom = makeEmptyRoom();
                                                newRoom.roomTypeId = rt.roomTypeId;
                                                newRoom.quantity = 1;
                                                if (bestOption) {
                                                    newRoom.price = bestOption.finalPrice;
                                                    newRoom.selectedOptionCode = bestOption.optionCode;
                                                    newRoom.priceModifierIds = (bestOption.modifiers || [])
                                                        .filter(m => DETAIL_LEVEL_TYPES.has(m?.type))
                                                        .map(m => m.priceModifierId);
                                                }
                                                setForm(prev => ({ ...prev, rooms: [...prev.rooms.filter(r => r.roomTypeId), newRoom] }));
                                            } else {
                                                updateRoom(form.rooms.findIndex(r => String(r.roomTypeId) === rtId), { quantity: 1 });
                                            }
                                        }
                                    }}
                                >
                                    {/* Image / placeholder */}
                                    <div className="cbsm-rt-card-img">
                                        {rt.image ? (
                                            <img src={rt.image} alt={rt.name} />
                                        ) : (
                                            <i className="bi bi-building" />
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div className="cbsm-rt-sel-badge">
                                            <i className="bi bi-check-lg" />×{qty}
                                        </div>
                                    )}

                                    <div className="cbsm-rt-card-body">
                                        <div className="cbsm-rt-card-name">{rt.name}</div>
                                        <div className="cbsm-rt-card-capacity">
                                            {rt.maxAdults > 0 && <span><i className="bi bi-person me-1" />{rt.maxAdults} adults</span>}
                                            {rt.maxChildren > 0 && <span><i className="bi bi-person-arms-up me-1" />{rt.maxChildren} children</span>}
                                            {rt.area > 0 && <span><i className="bi bi-grid me-1" />{rt.area} m²</span>}
                                        </div>

                                        {/* Price row */}
                                        <div className="cbsm-rt-card-price-row">
                                            <span className="cbsm-rt-card-price">
                                                {bestOption ? formatVnd(bestOption.finalPrice) : "—"}
                                                <span style={{ fontSize: 11, fontWeight: 400, color: "#7a8a7b", marginLeft: 4 }}>/night</span>
                                            </span>
                                            {hasDiscount && (
                                                <>
                                                    <span className="cbsm-rt-card-base">{formatVnd(bestOption.basePrice)}</span>
                                                    <span className="cbsm-rt-card-discount">-{discountPct}%</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Tags: modifiers */}
                                        {bestOption && bestOption.modifiers?.length > 0 && (
                                            <div className="cbsm-rt-card-tags">
                                                {bestOption.modifiers.slice(0, 3).map((m, i) => (
                                                    <span key={i} className="cbsm-rt-tag cbsm-rt-tag-blue">
                                                        {m.name || m.type}
                                                    </span>
                                                ))}
                                                {bestOption.modifiers.length > 3 && (
                                                    <span className="cbsm-rt-tag cbsm-rt-tag-gray">+{bestOption.modifiers.length - 3} more</span>
                                                )}
                                            </div>
                                        )}

                                        {!form.arrivalDate || !form.departureDate ? (
                                            <div className="cbsm-muted" style={{ fontSize: 11 }}>
                                                <i className="bi bi-info-circle me-1" />Enter dates to see live pricing
                                            </div>
                                        ) : pricingOptions.length === 0 && !loadingRoomTypes ? (
                                            <div className="cbsm-muted" style={{ fontSize: 11 }}>
                                                <i className="bi bi-x-circle me-1" />No packages for selected dates
                                            </div>
                                        ) : null}

                                        {/* Package options (shown when selected) */}
                                        {isSelected && pricingOptions.length > 1 && (
                                            <div className="cbsm-pkg-list" onClick={e => e.stopPropagation()}>
                                                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#7a8a7b", marginBottom: 4 }}>
                                                    Pricing packages
                                                </div>
                                                {pricingOptions.map(option => {
                                                    const active = selectedOption?.optionCode === option.optionCode;
                                                    const modSum = (option.modifiers || []).map(m =>
                                                        m.adjustmentType === "PERCENT"
                                                            ? `${m.adjustmentValue > 0 ? "+" : ""}${m.adjustmentValue}%`
                                                            : `${m.adjustmentValue > 0 ? "+" : ""}${formatVnd(m.adjustmentValue)}`
                                                    ).join(", ");
                                                    return (
                                                        <div
                                                            key={option.optionCode}
                                                            className={`cbsm-pkg-option${active ? " active" : ""}`}
                                                            onClick={() => choosePricingOption(form.rooms.findIndex(r => String(r.roomTypeId) === rtId), option)}
                                                        >
                                                            <input readOnly type="radio" className="cbsm-pkg-radio" checked={active} onChange={() => { }} />
                                                            <div className="cbsm-pkg-info">
                                                                <div className="cbsm-pkg-name">{option.mode || "STANDARD"}</div>
                                                                {modSum && <div className="cbsm-pkg-sub">{modSum}</div>}
                                                                {option.modifiers?.slice(0, 2).map((m, i) => (
                                                                    <div key={i} className="cbsm-pkg-sub">{m.name || m.type}{m.reason ? ` — ${m.reason}` : ""}</div>
                                                                ))}
                                                            </div>
                                                            <div className="cbsm-pkg-price">{formatVnd(option.finalPrice)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Footer: qty controls */}
                                        <div className="cbsm-rt-card-footer" onClick={e => e.stopPropagation()}>
                                            {isSelected ? (
                                                <div className="cbsm-rt-card-qty">
                                                    <button
                                                        type="button"
                                                        className="cbsm-rt-qty-btn"
                                                        onClick={() => {
                                                            const idx = form.rooms.findIndex(r => String(r.roomTypeId) === rtId);
                                                            if (qty <= 1) removeRoom(idx);
                                                            else updateRoom(idx, { quantity: qty - 1 });
                                                        }}
                                                    >−</button>
                                                    <span className="cbsm-rt-qty-num">{qty}</span>
                                                    <button
                                                        type="button"
                                                        className="cbsm-rt-qty-btn"
                                                        onClick={() => updateRoom(form.rooms.findIndex(r => String(r.roomTypeId) === rtId), { quantity: qty + 1 })}
                                                    >+</button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="cbsm-btn-outline"
                                                    style={{ fontSize: 12, padding: "5px 14px" }}
                                                    disabled={!bestOption}
                                                    onClick={() => {
                                                        const newRoom = makeEmptyRoom();
                                                        newRoom.roomTypeId = rt.roomTypeId;
                                                        newRoom.quantity = 1;
                                                        if (bestOption) {
                                                            newRoom.price = bestOption.finalPrice;
                                                            newRoom.selectedOptionCode = bestOption.optionCode;
                                                            newRoom.priceModifierIds = (bestOption.modifiers || [])
                                                                .filter(m => DETAIL_LEVEL_TYPES.has(m?.type))
                                                                .map(m => m.priceModifierId);
                                                        }
                                                        setForm(prev => ({
                                                            ...prev,
                                                            rooms: [...prev.rooms.filter(r => r.roomTypeId), newRoom],
                                                        }));
                                                    }}
                                                >
                                                    <i className="bi bi-plus me-1" />Add
                                                </button>
                                            )}
                                            <span className="cbsm-muted" style={{ fontSize: 11 }}>
                                                {pricingOptions.length > 0
                                                    ? `${pricingOptions.length} pkg${pricingOptions.length > 1 ? "s" : ""}`
                                                    : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── RIGHT: Sidebar ── */}
                <div className="cbsm-s2-right">
                    {/* Cart */}
                    <div className="cbsm-sidebar-section">
                        <div className="cbsm-sidebar-title">
                            <i className="bi bi-cart3" />
                            Booking cart
                            {totalRooms > 0 && (
                                <span style={{ marginLeft: "auto", background: "#465c47", color: "#fff", borderRadius: 20, fontSize: 10, padding: "1px 8px", fontWeight: 700 }}>
                                    {totalRooms} room{totalRooms > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        {cartItems.length === 0 ? (
                            <div className="cbsm-cart-empty">
                                <i className="bi bi-inbox" style={{ fontSize: 24, display: "block", marginBottom: 6 }} />
                                No rooms selected yet.<br />Click a room card to add.
                            </div>
                        ) : (
                            <>
                                {roomSummaryRows.map((row, i) => (
                                    <div key={i} className="cbsm-cart-item">
                                        <div>
                                            <div className="cbsm-cart-name">{row.roomTypeName}</div>
                                            <div className="cbsm-cart-meta">
                                                ×{row.qty}
                                                {row.lineDelta !== 0 && (
                                                    <span className={row.lineDelta < 0 ? "cbsm-money-minus" : "cbsm-money-plus"} style={{ marginLeft: 6 }}>
                                                        {row.lineDelta < 0 ? "−" : "+"}{formatVnd(Math.abs(row.lineDelta))}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="cbsm-cart-amount">{formatVnd(row.lineTotal)}</div>
                                    </div>
                                ))}
                                <div className="cbsm-cart-total">
                                    <span>Total</span>
                                    <span style={{ color: "#465c47" }}>{formatVnd(estimatedGrandTotal)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Cancellation Policy */}
                    <div className="cbsm-sidebar-section">
                        <div className="cbsm-sidebar-title">
                            <i className="bi bi-shield-check" />Cancellation policy
                            {form.arrivalDate && (
                                <span style={{ marginLeft: "auto", fontSize: 10, color: "#9aaa9b", fontWeight: 400 }}>
                                    for {form.arrivalDate}
                                </span>
                            )}
                        </div>

                        {/* Applied policy summary badge */}
                        {selectedPolicy ? (() => {
                            const appliedPrepaid = Math.round(estimatedGrandTotal * (selectedPolicy.prepaidRate || 0) / 100);
                            const appliedRefund = Math.round(estimatedGrandTotal * (selectedPolicy.prepaidRate || 0) / 100);
                            const appliedDeadlineDate = computeFreeCancelDeadline(form.arrivalDate, selectedPolicy.dateRange);
                            const appliedDeadline = formatDeadline(appliedDeadlineDate);
                            const todayApplied = new Date(); todayApplied.setHours(0, 0, 0, 0);
                            const appliedDeadlineDay = appliedDeadlineDate ? new Date(appliedDeadlineDate) : null;
                            if (appliedDeadlineDay) appliedDeadlineDay.setHours(0, 0, 0, 0);
                            const isAppliedDeadlineToday = appliedDeadlineDay && appliedDeadlineDay.getTime() === todayApplied.getTime();
                            const isAppliedDeadlinePast = appliedDeadlineDate && !isAppliedDeadlineToday && appliedDeadlineDate < todayApplied;
                            return (
                                <div className={`cbsm-policy-badge ${policyBadgeClass()}`} style={{ marginBottom: 10 }}>
                                    <div className="cbsm-policy-name">
                                        {selectedPolicyType === "FREE_CANCEL" && <i className="bi bi-check-circle-fill me-1 text-success" />}
                                        {selectedPolicyType === "NON_REFUND" && <i className="bi bi-x-circle-fill me-1 text-danger" />}
                                        {selectedPolicyType === "PAY_AT_HOTEL" && <i className="bi bi-building-check me-1" />}
                                        {selectedPolicyType === "PARTIAL_REFUND" && <i className="bi bi-arrow-left-right me-1" />}
                                        {selectedPolicy.name}
                                        {manualPolicyId ? (
                                            <span style={{ fontSize: 10, fontWeight: 600, color: "#7c3aed", marginLeft: 6 }}>
                                                <i className="bi bi-person-check me-1" />Staff selected
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: 10, fontWeight: 400, color: "#6b7280", marginLeft: 6 }}>(auto)</span>
                                        )}
                                    </div>
                                    {/* 2-column amounts */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, margin: "8px 0" }}>
                                        <div style={{ background: "#f8faf8", borderRadius: 6, padding: "5px 8px", borderLeft: "3px solid #465c47" }}>
                                            <div style={{ fontSize: 9, color: "#9aaa9b", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Prepaid</div>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: "#2f3f30" }}>{formatVnd(appliedPrepaid)}</div>
                                            <div style={{ fontSize: 9, color: "#9aaa9b" }}>{selectedPolicy.prepaidRate}%</div>
                                        </div>
                                        <div style={{ background: "#f8faf8", borderRadius: 6, padding: "5px 8px", borderLeft: `3px solid ${appliedRefund > 0 ? "#16a34a" : "#e5e7eb"}` }}>
                                            <div style={{ fontSize: 9, color: "#9aaa9b", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>Refund if cancelled</div>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: appliedRefund > 0 ? "#16a34a" : "#dc2626" }}>{formatVnd(appliedRefund)}</div>
                                            <div style={{ fontSize: 9, color: "#9aaa9b" }}>{selectedPolicy.prepaidRate}%</div>
                                        </div>
                                    </div>
                                    {appliedDeadlineDate && (
                                        isAppliedDeadlineToday ? (
                                            <div style={{ fontSize: 10.5, color: "#92400e", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 8px", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                                <i className="bi bi-clock-fill" />
                                                <strong>Refund of {formatVnd(appliedRefund)}</strong> applies per policy until <strong>today</strong>
                                                <span style={{ color: "#b45309", fontWeight: 400 }}>— no refund after today</span>
                                            </div>
                                        ) : isAppliedDeadlinePast ? (
                                            <div style={{ fontSize: 10.5, color: "#c2410c", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, padding: "4px 8px", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                                <i className="bi bi-exclamation-triangle-fill" />
                                                <strong>Refund period expired</strong> on <strong style={{ marginLeft: 3 }}>{appliedDeadline}</strong>
                                                <span style={{ color: "#9a3412", fontWeight: 400 }}>— no refund will be given</span>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 10.5, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 8px", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                                                <i className="bi bi-clock-history" />
                                                <strong>Refund of {formatVnd(appliedRefund)}</strong> applies per policy until <strong style={{ marginLeft: 3 }}>{appliedDeadline}</strong>
                                                <span style={{ color: "#15803d", fontWeight: 400 }}>— no refund after this date</span>
                                            </div>
                                        )
                                    )}
                                    {manualPolicyId && (
                                        <button
                                            type="button"
                                            onClick={() => setManualPolicyId(null)}
                                            style={{ marginTop: 4, fontSize: 11, color: "#6b7280", background: "none", border: "1px solid #d1d5db", borderRadius: 6, padding: "3px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                        >
                                            <i className="bi bi-arrow-counterclockwise" />Reset to auto
                                        </button>
                                    )}
                                </div>
                            );
                        })() : cartItems.length > 0 ? (
                            <div className="cbsm-muted" style={{ fontSize: 12, marginBottom: 10 }}>
                                <i className="bi bi-info-circle me-1" />No policy linked to selected pricing. Select one below.
                            </div>
                        ) : null}

                        {/* All active policies for this date — selectable */}
                        {loadingPolicies ? (
                            <div className="cbsm-muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                <span className="spinner-border spinner-border-sm" />
                                Loading policies…
                            </div>
                        ) : availablePolicies.length > 0 ? (
                            <>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9aaa9b", marginBottom: 8 }}>
                                    <i className="bi bi-calendar-check me-1" />Applicable policies
                                </div>
                                {availablePolicies.map(p => {
                                    const pId = p.id ?? p.policyId;
                                    const pType = String(p.type || "").trim().toUpperCase();
                                    const isSelected = Number(effectivePolicyId) === Number(pId);
                                    const isManuallySelected = Number(manualPolicyId) === Number(pId);

                                    // Số tiền cụ thể
                                    const cardPrepaid = Math.round(estimatedGrandTotal * (p.prepaidRate || 0) / 100);
                                    const cardRefund = Math.round(estimatedGrandTotal * (p.prepaidRate || 0) / 100);
                                    const cardRetain = Math.max(0, estimatedGrandTotal - cardRefund);
                                    const deadlineDate = computeFreeCancelDeadline(form.arrivalDate, p.dateRange);
                                    const deadlineStr = formatDeadline(deadlineDate);
                                    const todayCard = new Date(); todayCard.setHours(0, 0, 0, 0);
                                    const deadlineDay = deadlineDate ? new Date(deadlineDate) : null;
                                    if (deadlineDay) deadlineDay.setHours(0, 0, 0, 0);
                                    const isDeadlineToday = deadlineDay && deadlineDay.getTime() === todayCard.getTime();
                                    const isDeadlinePast = deadlineDate && !isDeadlineToday && deadlineDate < todayCard;

                                    const typeLabel = {
                                        FREE_CANCEL: { text: "Free cancellation", cls: "cbsm-rt-tag-green", icon: "bi-check-circle-fill text-success" },
                                        PARTIAL_REFUND: { text: "Partial refund", cls: "cbsm-rt-tag-amber", icon: "bi-arrow-left-right" },
                                        NON_REFUND: { text: "Non-refundable", cls: "cbsm-rt-tag-red", icon: "bi-x-circle-fill text-danger" },
                                        PAY_AT_HOTEL: { text: "Pay at hotel", cls: "cbsm-rt-tag-blue", icon: "bi-building-check" },
                                    }[pType] || { text: pType, cls: "cbsm-rt-tag-gray", icon: "bi-shield" };

                                    const formatMonthDay = (md) => {
                                        if (!md) return "";
                                        const [mm, dd] = md.split("-").map(Number);
                                        return new Date(2000, mm - 1, dd).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                    };

                                    const seasonLabel = p.activeTimeStart && p.activeTimeEnd
                                        ? `${formatMonthDay(p.activeTimeStart)} – ${formatMonthDay(p.activeTimeEnd)}`
                                        : null;

                                    const freeCancelDays = p.dateRange ? parseInt(p.dateRange, 10) : null;

                                    return (
                                        <div
                                            key={pId}
                                            style={{
                                                border: isSelected ? "2px solid #465c47" : "1px solid #e0e8e0",
                                                borderRadius: 10,
                                                padding: "10px 12px",
                                                marginBottom: 8,
                                                background: isSelected ? "#f0f6f0" : "#fff",
                                                cursor: "pointer",
                                                transition: "border-color 0.15s, background 0.15s",
                                            }}
                                            onClick={() => {
                                                if (isManuallySelected) {
                                                    setManualPolicyId(null); // deselect nếu bấm lại
                                                } else {
                                                    setManualPolicyId(Number(pId));
                                                    setForm(prev => ({
                                                        ...prev,
                                                        customPrepaidAmount: "",
                                                        customRefundRate: "",
                                                        customFreeCancelDays: ""
                                                    }));
                                                }
                                            }}
                                        >
                                            {/* Header: type badge + name + select button */}
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                                                <span className={`cbsm-rt-tag ${typeLabel.cls}`} style={{ fontSize: 10, whiteSpace: "nowrap", marginTop: 1 }}>
                                                    <i className={`bi ${typeLabel.icon} me-1`} />{typeLabel.text}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 12.5, color: "#1f2937", lineHeight: 1.3 }}>{p.name}</div>
                                                    {isSelected && (
                                                        <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, marginTop: 1 }}>
                                                            <i className="bi bi-check-circle-fill me-1" />
                                                            {isManuallySelected ? "Staff selected" : "Applied (auto)"}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Select / Selected toggle button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isManuallySelected) {
                                                            setManualPolicyId(null);
                                                        } else {
                                                            setManualPolicyId(Number(pId));
                                                            setForm(prev => ({
                                                                ...prev,
                                                                customPrepaidAmount: "",
                                                                customRefundRate: "",
                                                                customFreeCancelDays: ""
                                                            }));
                                                        }
                                                    }}
                                                    style={{
                                                        flexShrink: 0,
                                                        fontSize: 10.5,
                                                        fontWeight: 600,
                                                        padding: "3px 10px",
                                                        borderRadius: 20,
                                                        border: isManuallySelected ? "1.5px solid #465c47" : "1.5px solid #d1d5db",
                                                        background: isManuallySelected ? "#465c47" : "#fff",
                                                        color: isManuallySelected ? "#fff" : "#374151",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        transition: "all 0.15s",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {isManuallySelected
                                                        ? <><i className="bi bi-check-lg" />Selected</>
                                                        : <><i className="bi bi-circle" />Select</>}
                                                </button>
                                            </div>

                                            {/* 2-column amounts */}
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: (deadlineStr || seasonLabel) ? 8 : 0 }}>
                                                <div style={{ background: "#f8faf8", borderRadius: 6, padding: "5px 8px", borderLeft: "3px solid #465c47" }}>
                                                    <div style={{ fontSize: 9, color: "#9aaa9b", fontWeight: 700, textTransform: "uppercase" }}>Prepaid</div>
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: "#2f3f30" }}>{formatVnd(cardPrepaid)}</div>
                                                    <div style={{ fontSize: 9, color: "#9aaa9b" }}>{p.prepaidRate}%</div>
                                                </div>
                                                <div style={{ background: "#f8faf8", borderRadius: 6, padding: "5px 8px", borderLeft: `3px solid ${cardRefund > 0 ? "#16a34a" : "#e5e7eb"}` }}>
                                                    <div style={{ fontSize: 9, color: "#9aaa9b", fontWeight: 700, textTransform: "uppercase" }}>Refund if cancelled</div>
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: cardRefund > 0 ? "#16a34a" : "#dc2626" }}>{formatVnd(cardRefund)}</div>
                                                    <div style={{ fontSize: 9, color: "#9aaa9b" }}>{p.prepaidRate}%</div>
                                                </div>
                                            </div>

                                            {deadlineDate && (
                                                isDeadlineToday ? (
                                                    <div style={{ fontSize: 11, color: "#92400e", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 6, padding: "4px 8px", marginBottom: seasonLabel ? 6 : 0, display: "flex", alignItems: "center", gap: 4 }}>
                                                        <i className="bi bi-clock-fill" />
                                                        <strong>Refund of {formatVnd(cardRefund)}</strong> applies per policy until <strong>today</strong>
                                                        <span style={{ color: "#b45309", fontWeight: 400 }}>— no refund after today</span>
                                                    </div>
                                                ) : isDeadlinePast ? (
                                                    <div style={{ fontSize: 11, color: "#c2410c", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, padding: "4px 8px", marginBottom: seasonLabel ? 6 : 0, display: "flex", alignItems: "center", gap: 4 }}>
                                                        <i className="bi bi-exclamation-triangle-fill" />
                                                        <strong>Refund period expired</strong> on <strong style={{ marginLeft: 3 }}>{deadlineStr}</strong>
                                                        <span style={{ color: "#9a3412", fontWeight: 400 }}>— no refund will be given</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: 11, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 8px", marginBottom: seasonLabel ? 6 : 0, display: "flex", alignItems: "center", gap: 4 }}>
                                                        <i className="bi bi-clock-history me-1 text-success" />
                                                        <strong>Refund of {formatVnd(cardRefund)}</strong> applies per policy until <strong>{deadlineStr}</strong>
                                                        <span style={{ color: "#15803d", fontWeight: 400 }}>— no refund after this date</span>
                                                    </div>
                                                )
                                            )}

                                            {/* Season indicator */}
                                            {seasonLabel && (
                                                <div style={{ fontSize: 10.5, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                                                    <i className="bi bi-sun me-1" />
                                                    Applies: <strong style={{ color: "#374151" }}>{seasonLabel}</strong>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        ) : form.branchId ? (
                            <div className="cbsm-muted" style={{ fontSize: 12 }}>
                                <i className="bi bi-calendar-x me-1" />
                                {form.arrivalDate
                                    ? `No active policy for ${form.arrivalDate}.`
                                    : "No active policy for this branch."}
                            </div>
                        ) : null}

                        {!form.branchId && (
                            <div className="cbsm-muted" style={{ fontSize: 12 }}>Select a branch to see applicable policies.</div>
                        )}
                    </div>

                    {/* Policy Overrides */}
                    <div className="cbsm-sidebar-section">
                        <div className="cbsm-sidebar-title">
                            <i className="bi bi-sliders me-1" />Policy Overrides (Staff)
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10, lineHeight: 1.4 }}>
                            Leave blank to use default policy values.
                        </div>

                        <div className="cbsm-field" style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 11, color: "#4b5563", marginBottom: 2 }}>Prepaid Amount (VND)</label>
                            <input
                                type="number"
                                min={0}
                                value={form.customPrepaidAmount}
                                onChange={(e) => setForm((prev) => ({ ...prev, customPrepaidAmount: e.target.value }))}
                                placeholder="e.g. 500000"
                                style={{ padding: "4px 8px", fontSize: 12 }}
                            />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div className="cbsm-field">
                                <label style={{ fontSize: 11, color: "#4b5563", marginBottom: 2 }}>Refund Rate (%)</label>
                                <input
                                    type="number"
                                    min={0} max={100}
                                    value={form.customRefundRate}
                                    onChange={(e) => setForm((prev) => ({ ...prev, customRefundRate: e.target.value }))}
                                    placeholder="0 - 100"
                                    style={{ padding: "4px 8px", fontSize: 12 }}
                                />
                            </div>
                            <div className="cbsm-field">
                                <label style={{ fontSize: 11, color: "#4b5563", marginBottom: 2 }}>Free Cancel Days</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.customFreeCancelDays}
                                    onChange={(e) => setForm((prev) => ({ ...prev, customFreeCancelDays: e.target.value }))}
                                    placeholder="e.g. 7"
                                    style={{ padding: "4px 8px", fontSize: 12 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment type */}
                    {cartItems.length > 0 && (
                        <div className="cbsm-sidebar-section">
                            <div className="cbsm-sidebar-title"><i className="bi bi-credit-card me-1" />Payment type</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#2f3f30" }}>
                                {selectedPaymentLabel || "—"}
                            </div>
                            {payableNowAmount > 0 && (
                                <div className="cbsm-policy-row" style={{ marginTop: 8 }}>
                                    <span>Due now</span>
                                    <strong style={{ color: "#465c47" }}>{formatVnd(payableNowAmount)}</strong>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };



    const renderStep3 = () => {
        const selectedBranch = (branches || []).find((b) => String(b.branchId) === String(form.branchId));

        return (
            <div className="cbsm-step-content">
                {/* Warning block added at the top of the final step */}
                <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
                    <div>
                        <div style={{ fontWeight: 800, color: "#b91c1c", fontSize: 13, marginBottom: 2 }}>This action cannot be undone!</div>
                        <div style={{ color: "#7f1d1d", fontSize: 12 }}>Please carefully review the details below before creating the booking. Once created, the data will be saved to the system and cannot be automatically deleted.</div>
                    </div>
                </div>

                <div className="cbsm-card">
                    <div className="cbsm-card-title">Booking Summary</div>
                    <div className="cbsm-summary-grid">
                        <div>
                            <div className="cbsm-summary-label">Guest</div>
                            <div className="cbsm-summary-value">{form.customer.fullName || "-"}</div>
                        </div>
                        <div>
                            <div className="cbsm-summary-label">Contact</div>
                            <div className="cbsm-summary-value">
                                {form.customer.phone || form.customer.email || "-"}
                            </div>
                        </div>
                        <div>
                            <div className="cbsm-summary-label">Branch</div>
                            <div className="cbsm-summary-value">{selectedBranch?.branchName || "-"}</div>
                        </div>
                        <div>
                            <div className="cbsm-summary-label">Dates</div>
                            <div className="cbsm-summary-value">
                                {form.arrivalDate || "-"} to {form.departureDate || "-"}
                            </div>
                        </div>
                        <div>
                            <div className="cbsm-summary-label">Room lines</div>
                            <div className="cbsm-summary-value">{form.rooms.length}</div>
                        </div>
                        <div>
                            <div className="cbsm-summary-label">Subtotal</div>
                            <div className="cbsm-summary-value">
                                {formatVnd(roomSubtotal)}
                            </div>
                        </div>
                    </div>
                </div>



                <div className="cbsm-card">
                    <div className="cbsm-card-title">Estimated Price (with modifiers)</div>
                    <div className="cbsm-estimate-lines">
                        {roomSummaryRows.map((row, index) => (
                            <div key={`sum-${index}`} className="cbsm-estimate-row">
                                <span>{row.roomTypeName} x{row.qty}</span>
                                <span>{formatVnd(row.lineTotal)}</span>
                            </div>
                        ))}
                        <div className="cbsm-estimate-row">
                            <span>Room modifier delta</span>
                            <span className={roomDeltaTotal >= 0 ? "cbsm-money-plus" : "cbsm-money-minus"}>
                                {roomDeltaTotal >= 0 ? "+" : ""}{formatVnd(roomDeltaTotal)}
                            </span>
                        </div>
                        <div className="cbsm-estimate-row">
                            <span>Booking modifier delta</span>
                            <span className={bookingModifierDeltaTotal >= 0 ? "cbsm-money-plus" : "cbsm-money-minus"}>
                                {bookingModifierDeltaTotal >= 0 ? "+" : ""}{formatVnd(bookingModifierDeltaTotal)}
                            </span>
                        </div>
                        <div className="cbsm-estimate-total">
                            <span>Estimated Grand Total</span>
                            <span>{formatVnd(estimatedGrandTotal)}</span>
                        </div>
                        <div className="cbsm-estimate-total">
                            <span>Amount customer pays now</span>
                            <span>{formatVnd(payableNowAmount)}</span>
                        </div>
                    </div>
                </div>

                <div className="cbsm-card">
                    <div className="cbsm-card-title">Payment Option</div>
                    <div className="cbsm-pay-summary">
                        <div>
                            <div className="cbsm-summary-label">Amount to collect now</div>
                            <div className="cbsm-summary-value cbsm-summary-value-amount">{formatVnd(payableNowAmount)}</div>
                        </div>
                        <div>
                            <div className="cbsm-summary-label">Collection policy</div>
                            <div className="cbsm-summary-value">{selectedPaymentLabel}</div>
                        </div>
                    </div>

                    {selectedIsPaidInitially ? (
                        <>
                            <div className="cbsm-pay-hint">
                                Choose how the customer pays now. This payment will be recorded immediately and the booking will be confirmed.
                            </div>
                            <div className="cbsm-pay-choice">
                                {PAYMENT_METHODS.map((method) => {
                                    const active = selectedPaymentMethod === method.value;
                                    return (
                                        <button
                                            key={method.value}
                                            type="button"
                                            className={`cbsm-pay-item ${active ? "active" : ""}`}
                                            onClick={() => updatePaymentMethod(method.value)}
                                        >
                                            <i className={`bi ${method.icon}`} />
                                            <div className="cbsm-pay-item-body">
                                                <span>{method.label}</span>
                                                <span className="cbsm-pay-item-meta">{method.description}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="cbsm-pay-note">
                            This booking has no payment due at creation time. It will remain unpaid until collected later.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="cbsm-overlay" onClick={onClose}>
            <div className="cbsm-shell" onClick={(e) => e.stopPropagation()}>
                <div className="cbsm-header">
                    <div>
                        <h5>Create Booking By Staff</h5>
                        <p>Use the same 3-step flow style as front-desk operations.</p>
                    </div>
                    <button type="button" className="cbsm-close" onClick={onClose} aria-label="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="cbsm-steps">
                    {STEPS.map((label, index) => {
                        const active = index === currentStep;
                        const done = index < currentStep;
                        return (
                            <button
                                type="button"
                                key={label}
                                className={`cbsm-step ${active ? "active" : ""}`}
                                onClick={() => {
                                    if (index <= currentStep) setCurrentStep(index);
                                }}
                            >
                                <span className={`cbsm-step-num ${done || active ? "done" : ""}`}>{index + 1}</span>
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="cbsm-body">
                    {error && <div className="cbsm-error">{error}</div>}
                    {currentStep === 0 && renderStep1()}
                    {currentStep === 1 && renderStep2()}
                    {currentStep === 2 && renderStep3()}
                </div>

                <div className="cbsm-footer">
                    <button type="button" className="cbsm-btn-ghost" onClick={onClose} disabled={submitting}>
                        Close
                    </button>
                    <div className="cbsm-footer-right">
                        {currentStep > 0 && (
                            <button type="button" className="cbsm-btn-outline" onClick={prevStep} disabled={submitting}>
                                Back
                            </button>
                        )}
                        {currentStep < STEPS.length - 1 ? (
                            <button type="button" className="cbsm-btn-primary" onClick={nextStep}>
                                Next
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="cbsm-btn-primary"
                                onClick={submit}
                                disabled={submitting}
                            >
                                {submitting ? "Creating..." : "Create Booking"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
