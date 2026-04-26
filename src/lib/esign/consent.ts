// UETA / ESIGN Act electronic-signature consent disclosure.
// Shown to every signer; their explicit checkbox is recorded as `consent`.

export const ESIGN_CONSENT_VERSION = "2026-04-25";

export const ESIGN_CONSENT_TEXT = `
By checking the box and drawing or typing your signature below, you agree
that:

1. You consent to use electronic records and signatures in connection with
   this transaction, as permitted by the federal ESIGN Act (15 U.S.C.
   § 7001 et seq.) and the Uniform Electronic Transactions Act (UETA) as
   adopted by your state.

2. Your electronic signature has the same legal effect as a handwritten
   signature.

3. You may withdraw consent before signing by closing this window. After
   you sign, this transaction will be considered complete.

4. You can request a paper copy of any signed document at any time by
   contacting the party that sent you this signing link.

5. Wholesail captures the date, time, IP address, and browser of your
   signing event for the audit trail. This page is not a substitute for
   legal advice — retain a licensed attorney to close the transaction.
`.trim();
