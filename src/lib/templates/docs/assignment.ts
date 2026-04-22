import type { Clause } from "../clauses";
import type { DocumentVariables } from "../types";
import { formatMoney } from "../render";

export function assignmentBody(v: DocumentVariables, clauses: Clause[]): string {
  const assignor = v.buyer.entity
    ? `${v.buyer.name} (${v.buyer.entity})`
    : v.buyer.name;
  const assignee = v.assignee
    ? v.assignee.entity
      ? `${v.assignee.name} (${v.assignee.entity})`
      : v.assignee.name
    : "[Assignee]";

  const clauseSection = clauses
    .filter((c) => c.id.includes("assignment") || c.id.includes("principal"))
    .map((c, i) => `**${6 + i}. ${c.heading}.** ${c.body}`)
    .join("\n\n");

  return `
**ASSIGNMENT OF CONTRACT**

This Assignment of Contract (this "Assignment") is entered into as of ${v.meta.executionDate} by and between:

**ASSIGNOR:** ${assignor}

**ASSIGNEE:** ${assignee}

**RECITALS**

A. Assignor entered into a Purchase and Sale Agreement dated [original PSA date] (the "Original Agreement") with ${v.seller.name} ("Seller") for the purchase of the real property commonly known as ${v.property.address}, ${v.property.city}, ${v.stateName} ${v.property.zip} (the "Property").

B. Assignor desires to assign all of Assignor's right, title, and interest in and to the Original Agreement to Assignee, and Assignee desires to accept such assignment on the terms set forth herein.

**NOW, THEREFORE**, for good and valuable consideration, the parties agree as follows:

**1. Assignment.** Assignor hereby assigns to Assignee all of Assignor's right, title, and interest in and to the Original Agreement.

**2. Assignment Fee.** Assignee shall pay Assignor an assignment fee of ${formatMoney(v.terms.assignmentFeeCents ?? 0)} (the "Assignment Fee"), payable at Closing of the Original Agreement from the proceeds of sale.

**3. Assumption.** Assignee hereby assumes all obligations of the Buyer under the Original Agreement arising from and after the date of this Assignment.

**4. Representations.** Assignor represents that (i) the Original Agreement is in full force and effect, (ii) the Original Agreement has not been modified, and (iii) Assignor has full right and authority to execute this Assignment.

**5. No Guarantee of Closing.** Assignor makes no guarantee that Seller will perform under the Original Agreement. Assignee acknowledges and accepts the risk that the Original Agreement may not close for reasons outside Assignor's control.

${clauseSection}

---

**ASSIGNOR**

Signed: _____________________________  Date: ______________

${assignor}

**ASSIGNEE**

Signed: _____________________________  Date: ______________

${assignee}
`.trim();
}
