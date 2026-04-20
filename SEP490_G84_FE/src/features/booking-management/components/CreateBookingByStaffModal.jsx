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
    const [form, setForm] = useState(initialFormState);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!show) return;
        setCurrentStep(0);
        setSubmitting(false);
        setError("");
        setRoomTypes([]);
        setRoomPricingMap({});
        setExpandedOptionRows({});
        setSelectedPolicy(null);
        setForm((prev) => ({
            ...initialFormState,
            branchId:
                prev.branchId ||
                (Array.isArray(branches) && branches.length === 1
                    ? String(branches[0].branchId)
                    : ""),
        }));
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

    useEffect(() => {
        if (!show || !form.branchId || !form.arrivalDate || !form.departureDate) {
            setRoomPricingMap({});
            return;
        }

        let isMounted = true;
        const fetchPricing = async () => {
            try {
                const data = await roomService.searchRooms({
                    branchId: Number(form.branchId),
                    checkIn: form.arrivalDate,
                    checkOut: form.departureDate,
                    adults: 1,
                    children: 0,
                    page: 0,
                    size: 200,
                    sortPrice: "priceAsc",
                });

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
    }, [show, form.branchId, form.arrivalDate, form.departureDate]);

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
        }

        return "";
    };

    const nextStep = () => {
        const err = validateStep(currentStep);
        if (err) {
            setError(err);
            return;
        }
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

    const selectedPolicyId = selectedPolicyIds.length === 1 ? selectedPolicyIds[0] : null;

    useEffect(() => {
        if (!show || !selectedPolicyId) {
            setSelectedPolicy(null);
            return;
        }

        let isMounted = true;

        const fetchSelectedPolicy = async () => {
            try {
                const data = await cancellationPolicyService.getById(selectedPolicyId);
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
    }, [show, selectedPolicyId]);

    const selectedPolicyType = String(selectedPolicy?.type || "").trim().toUpperCase();
    const selectedPaymentLabel = selectedPolicy?.name
        ? selectedPolicy.name
        : selectedPaymentType === "MIXED"
            ? "Mixed payment policies"
            : paymentTypeLabel(selectedPaymentType);

    const estimatedGrandTotal = useMemo(() => {
        return Math.max(0, roomTotalAfterRoomModifiers + bookingModifierDeltaTotal);
    }, [roomTotalAfterRoomModifiers, bookingModifierDeltaTotal]);

    const payableNowAmount = useMemo(() => {
        return estimatedGrandTotal;
    }, [estimatedGrandTotal]);

    const selectedIsPaidInitially = payableNowAmount > 0;
    const selectedPaymentMethod = form.paymentMethod || "CASH";

    if (!show) return null;

    const submit = async () => {
        const err = validateStep(0) || validateStep(1);
        if (err) {
            setError(err);
            return;
        }

        try {
            setSubmitting(true);
            setError("");

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
                appliedPolicyId: selectedPolicyId,
                specialRequests: form.specialRequests?.trim() || "",
                staffNote: form.staffNote?.trim() || "",
                isPaidInitially: selectedIsPaidInitially,
                paymentMethod: selectedPaymentMethod,
            };

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

    const renderStep2 = () => (
        <div className="cbsm-step-content">
            <div className="cbsm-card">
                <div className="cbsm-card-title">Room Lines</div>
                {loadingRoomTypes && <div className="cbsm-muted">Loading room types...</div>}
                {duplicateRoomTypeNames.length > 0 && (
                    <div className="cbsm-warn-box">
                        <div>
                            Duplicate room type found: <strong>{duplicateRoomTypeNames.join(", ")}</strong>
                        </div>
                        <button type="button" className="cbsm-btn-outline btn-sm" onClick={mergeDuplicateRoomTypes}>
                            Merge duplicate lines
                        </button>
                    </div>
                )}
                {form.rooms.map((room, index) => {
                    const roomTypeId = String(room.roomTypeId || "");
                    const roomPricing = roomPricingMap[roomTypeId] || null;
                    const pricingOptions = roomPricing?.pricingOptions || [];
                    const selectedOption = pricingOptions.find((opt) => opt.optionCode === room.selectedOptionCode) || pricingOptions[0] || null;
                    const selectedByOthers = uniqueIds(
                        form.rooms
                            .filter((_, i) => i !== index)
                            .map((r) => String(r.roomTypeId || ""))
                            .filter(Boolean),
                    );
                    return (
                        <div key={`room-line-${index}`} className="cbsm-room-line">
                            <div className="cbsm-grid cbsm-grid-4">
                                <div className="cbsm-field">
                                    <label>Room type *</label>
                                    <select
                                        value={roomTypeId}
                                        onChange={(e) => updateRoom(index, { roomTypeId: e.target.value, priceModifierIds: [] })}
                                        disabled={!form.branchId}
                                    >
                                        <option value="">Select room type</option>
                                        {roomTypes.map((rt) => (
                                            <option
                                                key={rt.roomTypeId}
                                                value={rt.roomTypeId}
                                                disabled={selectedByOthers.includes(String(rt.roomTypeId))}
                                            >
                                                {rt.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="cbsm-field">
                                    <label>Quantity *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={room.quantity}
                                        onChange={(e) => updateRoom(index, { quantity: e.target.value })}
                                    />
                                </div>
                                <div className="cbsm-field">
                                    <label>Auto price source</label>
                                    <input
                                        value={selectedOption ? `${formatVnd(selectedOption.finalPrice)} (${selectedOption.mode})` : (roomTypeId ? "No package available for selected dates" : "Select room type first")}
                                        readOnly
                                    />
                                </div>
                                <div className="cbsm-field cbsm-end-field">
                                    <button
                                        type="button"
                                        className="cbsm-link-danger"
                                        onClick={() => removeRoom(index)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <div className="cbsm-modifiers">
                                <div className="cbsm-mod-title">Pricing Packages</div>
                                {pricingOptions.length === 0 ? (
                                    <div className="cbsm-muted">No pricing package available for this room type/date range.</div>
                                ) : (
                                    <div className="cbsm-option-list">
                                        {pricingOptions.map((option) => {
                                            const rowKey = `${index}-${option.optionCode}`;
                                            const expanded = Boolean(expandedOptionRows[rowKey]);
                                            const active = selectedOption?.optionCode === option.optionCode;
                                            return (
                                                <div key={rowKey} className={`cbsm-option-card ${active ? "active" : ""}`}>
                                                    <label className="cbsm-option-head">
                                                        <input
                                                            type="radio"
                                                            name={`room-option-${index}`}
                                                            checked={active}
                                                            onChange={() => choosePricingOption(index, option)}
                                                        />
                                                        <span className="cbsm-option-mode">{option.mode || "STANDARD"}</span>
                                                        <span className="cbsm-option-price">{formatVnd(option.basePrice)} + {formatVnd(option.delta)} = {formatVnd(option.finalPrice)}</span>
                                                    </label>
                                                    {roomPricing?.paymentType && (
                                                        <div className="cbsm-option-payment">Payment policy: {roomPricing.paymentType === "PAY_AT_HOTEL" ? "Pay at hotel" : "Prepaid"}</div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="cbsm-option-expand"
                                                        onClick={() => setExpandedOptionRows((prev) => ({ ...prev, [rowKey]: !expanded }))}
                                                    >
                                                        {expanded ? "Hide detail" : "Show detail"}
                                                    </button>
                                                    {expanded && (
                                                        <div className="cbsm-option-details">
                                                            {(option.modifiers || []).length > 0 ? (
                                                                option.modifiers.map((m, mIndex) => (
                                                                    <div key={`${rowKey}-${mIndex}`} className="cbsm-option-detail-row">
                                                                        <div>{m.name || m.type || "Modifier"}</div>
                                                                        <div className="cbsm-muted">{m.reason || (option.reasons || [])[mIndex] || "Condition-based adjustment"}</div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="cbsm-muted">Standard package without extra modifier.</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <button type="button" className="cbsm-btn-outline" onClick={addRoom}>
                    + Add room line
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => {
        const selectedBranch = (branches || []).find((b) => String(b.branchId) === String(form.branchId));

        return (
            <div className="cbsm-step-content">
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
