import type { DocumentVariables } from "../types";
import { formatMoney } from "../render";

export function offerLetterBody(v: DocumentVariables): string {
  const sellerBlock = v.seller.name;
  const buyerBlock = v.buyer.entity
    ? `${v.buyer.name} (${v.buyer.entity})`
    : v.buyer.name;

  return `
**LETTER OF INTENT TO PURCHASE**

Date: ${v.meta.executionDate}

To: ${sellerBlock}
From: ${buyerBlock}
Re: ${v.property.address}, ${v.property.city}, ${v.state} ${v.property.zip}

The undersigned ("Buyer") submits this non-binding Letter of Intent outlining the principal terms under which Buyer proposes to acquire the real property located at **${v.property.address}** (the "Property") from ${v.seller.name} ("Seller"):

**1. Purchase Price.** ${formatMoney(v.terms.purchasePriceCents)}, all cash at closing.

**2. Earnest Money.** ${v.terms.earnestMoneyCents ? formatMoney(v.terms.earnestMoneyCents) : "$1,000.00"}, deposited with ${v.terms.earnestMoneyHolder ?? "a mutually agreed escrow agent"} within three (3) business days of mutual execution of a binding Purchase and Sale Agreement.

**3. Inspection Period.** ${v.terms.inspectionPeriodDays ?? 10} days from binding execution, during which Buyer may inspect the Property and terminate for any reason with full refund of Earnest Money.

**4. Closing.** On or before ${v.terms.closingDate ?? "[date to be agreed]"}, at a title company or attorney's office mutually selected.

**5. Assignment.** Buyer reserves the right to assign this Letter of Intent and any subsequent Purchase and Sale Agreement to a third-party assignee, subject to applicable state law and the disclosures set forth in the final Purchase and Sale Agreement.

**6. Non-Binding.** Except for the obligations of confidentiality, this Letter of Intent is non-binding and creates no obligation to purchase or sell. A binding obligation will arise only upon mutual execution of a definitive Purchase and Sale Agreement.

**7. Expiration.** This offer expires at 5:00 PM local time on ${v.terms.offerExpirationDate ?? "[date]"} unless sooner accepted.

---

**BUYER**

Signed: _____________________________  Date: ______________

${buyerBlock}
`.trim();
}
