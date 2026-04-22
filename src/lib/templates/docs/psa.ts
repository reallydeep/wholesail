import type { Clause } from "../clauses";
import type { DocumentVariables } from "../types";
import { formatMoney, moneyInWords } from "../render";

export function psaBody(v: DocumentVariables, clauses: Clause[]): string {
  const buyerBlock = v.buyer.entity
    ? `${v.buyer.name} (${v.buyer.entity})`
    : v.buyer.name;

  const clauseSection = clauses
    .map(
      (c, i) =>
        `**${13 + i}. ${c.heading}.** ${c.body}`,
    )
    .join("\n\n");

  return `
**PURCHASE AND SALE AGREEMENT**

This Purchase and Sale Agreement (this "Agreement") is made and entered into as of ${v.meta.executionDate} by and between:

**SELLER:** ${v.seller.name}${v.seller.address ? `, of ${v.seller.address}` : ""}

**BUYER:** ${buyerBlock}${v.buyer.address ? `, of ${v.buyer.address}` : ""}, and/or its assigns.

**1. Property.** Seller agrees to sell and Buyer agrees to purchase the real property commonly known as ${v.property.address}, ${v.property.city}${v.property.county ? `, ${v.property.county} County` : ""}, State of ${v.stateName} (the "Property"), more particularly described as follows:

> ${v.property.legalDescription ?? "[Legal description to be attached as Exhibit A]"}

${v.property.parcelId ? `Parcel ID: ${v.property.parcelId}` : ""}

**2. Purchase Price.** ${moneyInWords(v.terms.purchasePriceCents)} (${formatMoney(v.terms.purchasePriceCents)}), payable as follows:

(a) Earnest Money Deposit of ${formatMoney(v.terms.earnestMoneyCents ?? 100000)} within three (3) business days of the Effective Date, to be held by ${v.terms.earnestMoneyHolder ?? "the escrow agent agreed by the parties"}.

(b) Balance due at Closing in immediately available funds.

**3. Closing.** Closing shall occur on or before ${v.terms.closingDate ?? "[closing date]"}, at a location mutually agreed by the parties.

**4. Title.** Seller shall convey marketable title by general warranty deed, free of liens and encumbrances other than those expressly accepted by Buyer in writing.

**5. Inspection Period.** Buyer shall have ${v.terms.inspectionPeriodDays ?? 10} days from the Effective Date (the "Inspection Period") to inspect the Property. During the Inspection Period, Buyer may terminate this Agreement for any reason by written notice to Seller, and Earnest Money shall be returned in full.

**6. Seller Representations.** Seller represents that: (i) Seller has full authority to sell the Property; (ii) there are no pending lawsuits or claims affecting title; (iii) there are no undisclosed tenants; (iv) Seller knows of no environmental hazards or open building permits.

**7. Default.** If Buyer defaults, Seller's sole remedy shall be retention of Earnest Money as liquidated damages. If Seller defaults, Buyer may elect (i) to terminate and recover Earnest Money or (ii) to seek specific performance.

**8. Assignment.** Buyer may assign this Agreement. All obligations of Buyer shall be assumed by the assignee upon written assignment.

**9. Notices.** All notices shall be in writing and delivered by email to the addresses listed below, with a courtesy copy by US mail.

**10. Governing Law.** This Agreement is governed by the laws of the State of ${v.stateName}.

**11. Entire Agreement.** This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations and understandings.

**12. Counterparts; Electronic Signatures.** This Agreement may be executed in counterparts and by electronic signature, each of which shall be deemed an original.

${clauseSection}

---

**BUYER**

Signed: _____________________________  Date: ______________

${buyerBlock}

**SELLER**

Signed: _____________________________  Date: ______________

${v.seller.name}
`.trim();
}
