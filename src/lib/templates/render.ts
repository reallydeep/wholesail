import { resolveRules } from "../compliance";
import { getClauses } from "./clauses";
import type { DocType, DocumentVariables, RenderedDocument } from "./types";
import { offerLetterBody } from "./docs/offer-letter";
import { psaBody } from "./docs/psa";
import { assignmentBody } from "./docs/assignment";

export const DISCLAIMER = `ATTORNEY REVIEW NOTICE: This document was generated from a software template. It has not been drafted or reviewed for your specific transaction. Wholesail is not a law firm and does not provide legal advice. Retain a licensed attorney in ${"{{state}}"} to review and close this transaction.`;

export function renderDocument(
  docType: DocType,
  vars: DocumentVariables,
): RenderedDocument {
  const rules = resolveRules(vars.state);
  if (!rules) {
    throw new Error(`No active rule set for state ${vars.state}`);
  }

  const clauseBodies = getClauses(rules.requiredClauses);

  let title = "";
  let body = "";

  switch (docType) {
    case "offer-letter":
      title = "Letter of Intent to Purchase";
      body = offerLetterBody(vars);
      break;
    case "psa":
      title = "Purchase and Sale Agreement";
      body = psaBody(vars, clauseBodies);
      break;
    case "assignment":
      title = "Assignment of Contract";
      body = assignmentBody(vars, clauseBodies);
      break;
    case "deal-summary":
      title = "Deal Summary";
      body = `# Deal Summary\n\nGenerated ${vars.meta.executionDate} for ${vars.property.address}.`;
      break;
    case "repair-summary":
      title = "Repair Summary";
      body = `# Repair Summary\n\nGenerated ${vars.meta.executionDate} for ${vars.property.address}.`;
      break;
  }

  return {
    docType,
    title,
    bodyMarkdown: body,
    disclaimer: DISCLAIMER.replace("{{state}}", vars.stateName),
    variables: vars,
  };
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function moneyInWords(cents: number): string {
  // Simple dollar-amount-to-words for contracts (whole dollars)
  const dollars = Math.round(cents / 100);
  return `${dollars.toLocaleString("en-US")} US Dollars`;
}
