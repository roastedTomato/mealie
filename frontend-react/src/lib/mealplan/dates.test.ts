import { describe, expect, it } from "vitest";
import { dayLabel, offsetDate, weekDates } from "./dates";
describe("planner calendar boundaries", () => {
  it("keeps a contiguous seven-day range across a year boundary", () => {
    expect(weekDates("2026-12-29")).toEqual([
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
      "2027-01-04",
    ]);
  });
  it("handles leap days and backwards navigation", () => {
    expect(offsetDate("2024-02-28", 1)).toBe("2024-02-29");
    expect(offsetDate("2024-03-01", -1)).toBe("2024-02-29");
  });
  it("formats the same UTC date irrespective of the browser local timezone", () => {
    expect(dayLabel("2026-10-10")).toBe("Saturday, Oct 10");
  });
});
