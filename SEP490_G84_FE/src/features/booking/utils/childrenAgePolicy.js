/**
 * Children Age Policy — Hard-coded constants for age group classification.
 *
 * Age groups & room capacity rules:
 *   INFANT  (0–5)  → Free — does NOT count toward any room capacity
 *   CHILD   (6–11) → Counts as 1 CHILD — compared against RoomType.maxChildren
 *   TEEN    (12+)  → Counts as 1 ADULT — compared against RoomType.maxAdult
 */

export const AGE_GROUPS = [
    { key: "INFANT", label: "Infant (0–5)",     minAge: 0,  maxAge: 5,  countsAs: "FREE"  },
    { key: "CHILD",  label: "Child (6–11)",      minAge: 6,  maxAge: 11, countsAs: "CHILD" },
    { key: "TEEN",   label: "Teen/Adult (12+)",  minAge: 12, maxAge: 17, countsAs: "ADULT" },
];

/** Default age group when a new child is added. */
export const DEFAULT_AGE_GROUP = "CHILD";

/**
 * Count children classified as TEEN (12+) — these count as adults for room capacity.
 * @param {string[]} childrenAgeGroups — e.g. ["INFANT","CHILD","TEEN"]
 * @returns {number} Number of teens (added to adult count)
 */
export const countTeenAsAdults = (childrenAgeGroups = []) =>
    childrenAgeGroups.filter((key) => key === "TEEN").length;

/**
 * Count children classified as CHILD (6–11) — compared against MaxChildren.
 * @param {string[]} childrenAgeGroups
 * @returns {number} Number of children that occupy child capacity
 */
export const countEffectiveChildren = (childrenAgeGroups = []) =>
    childrenAgeGroups.filter((key) => key === "CHILD").length;

/**
 * Count infants (0–5) — free, no capacity impact.
 * @param {string[]} childrenAgeGroups
 * @returns {number}
 */
export const countInfants = (childrenAgeGroups = []) =>
    childrenAgeGroups.filter((key) => key === "INFANT").length;

/**
 * Calculate effective adults = base adults + teens (12+ count as adults).
 * @param {number} adults — Number of adults (13+)
 * @param {string[]} childrenAgeGroups
 * @returns {number} Total adults for capacity check
 */
export const calculateEffectiveAdults = (adults, childrenAgeGroups = []) =>
    adults + countTeenAsAdults(childrenAgeGroups);

/**
 * Divide a total value evenly across rooms (ceiling).
 * @param {number} totalValue
 * @param {number} roomCount
 * @returns {number} Per-room value rounded UP
 */
export const calculatePerRoom = (totalValue, roomCount) =>
    Math.ceil(totalValue / Math.max(1, roomCount));
