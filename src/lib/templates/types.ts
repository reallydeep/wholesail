import type { StateCode } from "../compliance/types";

export type DocType =
  | "offer-letter"
  | "psa"
  | "assignment"
  | "deal-summary"
  | "repair-summary";

export interface Party {
  name: string;
  entity?: string; // "XYZ Investments, LLC"
  address?: string;
  email?: string;
  phone?: string;
}

export interface DocumentVariables {
  state: StateCode;
  stateName: string;
  strategy: "wholesale" | "flip" | "hold";

  buyer: Party;
  seller: Party;
  assignee?: Party;

  property: {
    address: string;
    city: string;
    county?: string;
    zip: string;
    legalDescription?: string;
    parcelId?: string;
    sqft?: number;
    beds?: number;
    baths?: number;
    yearBuilt?: number;
  };

  terms: {
    purchasePriceCents: number;
    earnestMoneyCents?: number;
    earnestMoneyHolder?: string;
    closingDate?: string;
    offerExpirationDate?: string;
    inspectionPeriodDays?: number;
    assignmentFeeCents?: number;
    possessionDate?: string;
  };

  meta: {
    documentId: string; // WS-00412
    executionDate: string;
    templateVersion: string;
    ruleSnapshotId: string;
  };
}

export interface RenderedDocument {
  docType: DocType;
  title: string;
  bodyMarkdown: string;
  disclaimer: string;
  variables: DocumentVariables;
}
