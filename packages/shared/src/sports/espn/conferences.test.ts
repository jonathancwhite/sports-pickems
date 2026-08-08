import { describe, expect, it } from "vitest";
import {
  CONFERENCE_SLUGS,
  DEFAULT_CONFERENCE_SLUG,
  FBS_CONFERENCES,
  conferenceShortName,
  conferenceSlugFromEspnId,
  getConferenceBySlug,
  isConferenceSlug,
} from "./conferences.js";

describe("FBS_CONFERENCES", () => {
  it("covers all 11 FBS conferences", () => {
    expect(FBS_CONFERENCES).toHaveLength(11);
  });

  it("has unique slugs", () => {
    const slugs = FBS_CONFERENCES.map((conf) => conf.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique ESPN ids", () => {
    const ids = FBS_CONFERENCES.map((conf) => conf.espnId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lists SEC first, matching the default selection", () => {
    expect(FBS_CONFERENCES[0]?.slug).toBe(DEFAULT_CONFERENCE_SLUG);
  });

  it("exposes the default slug as a real conference", () => {
    expect(getConferenceBySlug(DEFAULT_CONFERENCE_SLUG)).not.toBeNull();
  });

  it("keeps CONFERENCE_SLUGS in sync with the table", () => {
    expect([...CONFERENCE_SLUGS]).toEqual(FBS_CONFERENCES.map((conf) => conf.slug));
  });
});

describe("conferenceSlugFromEspnId", () => {
  it("maps known ESPN conference ids", () => {
    expect(conferenceSlugFromEspnId("8")).toBe("sec");
    expect(conferenceSlugFromEspnId("5")).toBe("big-ten");
    expect(conferenceSlugFromEspnId("1")).toBe("acc");
    expect(conferenceSlugFromEspnId("151")).toBe("american");
  });

  it("accepts a numeric id", () => {
    expect(conferenceSlugFromEspnId(8)).toBe("sec");
  });

  it("returns null for a non-FBS or unknown id", () => {
    // FCS opponents carry conference ids outside the FBS set.
    expect(conferenceSlugFromEspnId("999")).toBeNull();
  });

  it("returns null for missing values", () => {
    expect(conferenceSlugFromEspnId(null)).toBeNull();
    expect(conferenceSlugFromEspnId(undefined)).toBeNull();
  });
});

describe("isConferenceSlug", () => {
  it("accepts known slugs and rejects everything else", () => {
    expect(isConferenceSlug("sec")).toBe(true);
    expect(isConferenceSlug("SEC")).toBe(false);
    expect(isConferenceSlug("pac-10")).toBe(false);
    expect(isConferenceSlug("")).toBe(false);
  });
});

describe("conferenceShortName", () => {
  it("returns the display label for a known slug", () => {
    expect(conferenceShortName("sec")).toBe("SEC");
    expect(conferenceShortName("conference-usa")).toBe("C-USA");
  });

  it("labels a null conference as non-FBS", () => {
    expect(conferenceShortName(null)).toBe("Non-FBS");
  });

  it("falls back to the raw value for an unrecognised slug", () => {
    // Guards the UI against a slug persisted before a rename.
    expect(conferenceShortName("old-conference")).toBe("old-conference");
  });
});
