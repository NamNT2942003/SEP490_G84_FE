/**
 * Children Age Policy — Hard-coded constants for age group classification
 * and adult-equivalent conversion.
 *
 * Age groups:
 *   INFANT  (0–5)  → Free, does NOT count toward room capacity
 *   CHILD   (6–11) → Counts as 0.5 adult equivalent
 *   TEEN    (12+)  → Counts as 1 adult equivalent (treated as full adult)
 */

export const AGE_GROUPS = [
    { key: "INFANT", label: "Infant (0–5)",     minAge: 0,  maxAge: 5,  adultEquivalent: 0   },
    { key: "CHILD",  label: "Child (6–11)",      minAge: 6,  maxAge: 11, adultEquivalent: 0.5 },
    { key: "TEEN",   label: "Teen/Adult (12+)",  minAge: 12, maxAge: 17, adultEquivalent: 1   },
];

/** Default age group when a new child is added (safest assumption). */
export const DEFAULT_AGE_GROUP = "CHILD";

/**
 * Calculate effective adult count by converting children age groups.
 * @param {number} adults   — Number of adults (13+)
 * @param {string[]} childrenAgeGroups — Array of age-group keys, e.g. ["INFANT","CHILD"]
 * @returns {number} Total effective adults (may be fractional, e.g. 2.5)
 */
export const calculateEffectiveAdults = (adults, childrenAgeGroups = []) => {
    const childEquiv = childrenAgeGroups.reduce((sum, groupKey) => {
        const group = AGE_GROUPS.find((g) => g.key === groupKey);
        return sum + (group?.adultEquivalent ?? 0);
    }, 0);
    return adults + childEquiv;
};

/**
 * Divide a total value evenly across rooms (ceiling).
 * @param {number} totalValue — e.g. effectiveAdults = 3.5
 * @param {number} roomCount  — e.g. 2
 * @returns {number} Per-room value rounded UP, e.g. ceil(3.5/2) = 2
 */
export const calculatePerRoom = (totalValue, roomCount) =>
    Math.ceil(totalValue / Math.max(1, roomCount));

/**
 * Count children that are NOT infants (i.e. actually consume room capacity).
 * @param {string[]} childrenAgeGroups
 * @returns {number}
 */
export const countNonInfantChildren = (childrenAgeGroups = []) =>
    childrenAgeGroups.filter((key) => key !== "INFANT").length;
