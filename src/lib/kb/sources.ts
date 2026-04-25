import type { StateCode } from "@/lib/compliance/types";

export interface KbSource {
  url: string;
  state: StateCode | "ALL";
  section: string;
}

export const KB_SOURCES: KbSource[] = [
  {
    url: "https://resimpli.com/blog/wholesaling-laws-and-regulations/",
    state: "ALL",
    section: "overview",
  },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-ohio/", state: "OH", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-florida/", state: "FL", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-texas/", state: "TX", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-georgia/", state: "GA", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-north-carolina/", state: "NC", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-south-carolina/", state: "SC", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-tennessee/", state: "TN", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-virginia/", state: "VA", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-alabama/", state: "AL", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-michigan/", state: "MI", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-missouri/", state: "MO", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-kansas/", state: "KS", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-wisconsin/", state: "WI", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-west-virginia/", state: "WV", section: "state-laws" },
  { url: "https://resimpli.com/blog/is-wholesaling-real-estate-legal-in-colorado/", state: "CO", section: "state-laws" },
];
