// Clause registry — each clause has an id and body text.
// State overlays reference clause ids; renderer injects the bodies.
// ALL clauses are plain English scaffolds. An attorney in the user's state
// must review before execution.

export interface Clause {
  id: string;
  heading: string;
  body: string;
}

export const CLAUSES: Record<string, Clause> = {
  // ─── STANDARD ─────────────────────────────────────────────
  "standard.as-is": {
    id: "standard.as-is",
    heading: "AS-IS Condition",
    body:
      "Property is sold in AS-IS, WHERE-IS condition, with all faults. Buyer has conducted or will conduct its own inspections and relies upon no representations of Seller other than those expressly set forth herein.",
  },
  "standard.attorney-review": {
    id: "standard.attorney-review",
    heading: "Attorney Review",
    body:
      "Both parties are strongly encouraged to retain separate legal counsel to review this Agreement prior to execution. The template from which this Agreement was produced is not legal advice and is not a substitute for counsel licensed in the state where the Property is located.",
  },

  // ─── OHIO ──────────────────────────────────────────────────
  "oh.assignment-disclosure": {
    id: "oh.assignment-disclosure",
    heading: "Assignment Disclosure (Ohio)",
    body:
      "Buyer discloses to Seller that Buyer is acquiring an equitable interest in the Property and may assign this Agreement to a third-party assignee for consideration (an \"assignment fee\"). Buyer is not acting as Seller's real estate agent.",
  },
  "oh.principal-not-agent": {
    id: "oh.principal-not-agent",
    heading: "Principal Purchaser Status",
    body:
      "Buyer represents that Buyer is acting as a principal purchaser in this transaction, is not licensed as a real estate broker or salesperson by the Ohio Division of Real Estate, and is not providing brokerage services on behalf of Seller.",
  },

  // ─── PENNSYLVANIA ─────────────────────────────────────────
  "pa.assignment-disclosure": {
    id: "pa.assignment-disclosure",
    heading: "Assignment Disclosure (Pennsylvania)",
    body:
      "Buyer discloses that Buyer may assign Buyer's rights under this Agreement to a third-party assignee for consideration. Any such assignment shall be in writing and Buyer shall provide notice to Seller upon execution.",
  },
  "pa.principal-not-agent": {
    id: "pa.principal-not-agent",
    heading: "Principal Purchaser Status",
    body:
      "Buyer represents that Buyer is acting as a principal purchaser in this transaction and is not providing real estate brokerage services to Seller within the meaning of the Pennsylvania Real Estate Licensing and Registration Act (RELRA).",
  },
  "pa.seller-acknowledgment": {
    id: "pa.seller-acknowledgment",
    heading: "Seller Acknowledgment of Assignment Rights",
    body:
      "Seller acknowledges: (i) Buyer has disclosed Buyer's intent to potentially assign this Agreement; (ii) any assignment will not relieve Buyer of liability unless Seller executes a written release; and (iii) Seller has had the opportunity to consult with counsel.",
  },

  // ─── FLORIDA ──────────────────────────────────────────────
  "fl.principal-not-agent": {
    id: "fl.principal-not-agent",
    heading: "Principal Purchaser Status",
    body:
      "Buyer is acting as a principal purchaser and not as a real estate licensee representing Seller. Buyer is not providing brokerage services under Chapter 475, Florida Statutes.",
  },
  "fl.ch-475-disclaimer": {
    id: "fl.ch-475-disclaimer",
    heading: "Chapter 475 Acknowledgment",
    body:
      "The parties acknowledge that Buyer is acquiring an equitable interest in the Property and that any assignment or resale of such interest is a transfer of Buyer's contractual rights, not a real estate brokerage activity.",
  },
};

export function getClauses(ids: string[]): Clause[] {
  return ids
    .map((id) => CLAUSES[id])
    .filter((c): c is Clause => Boolean(c));
}
