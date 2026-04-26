export type DocType = "offer-letter" | "psa" | "assignment";
export type SignerRole = "seller" | "buyer";
export type SigningStatus =
  | "pending"
  | "viewed"
  | "signed"
  | "declined"
  | "expired";

export interface SigningRequest {
  id: string;
  token: string;
  dealId: string;
  docType: DocType;
  signerRole: SignerRole;
  signerName?: string;
  signerEmail?: string;
  status: SigningStatus;
  signaturePng?: string;
  typedName?: string;
  consent: boolean;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  viewedAt?: string;
  signedAt?: string;
  expiresAt: string;
}

export interface CreateSigningRequestInput {
  dealId: string;
  docType: DocType;
  signerRole: SignerRole;
  signerName?: string;
  signerEmail?: string;
}

export interface SubmitSignatureInput {
  signaturePng: string;
  typedName: string;
  consent: true;
}

export const DOC_LABEL: Record<DocType, string> = {
  "offer-letter": "Offer letter",
  psa: "Purchase & Sale Agreement",
  assignment: "Assignment of Contract",
};

export const ROLE_LABEL: Record<SignerRole, string> = {
  seller: "Seller",
  buyer: "Buyer",
};
