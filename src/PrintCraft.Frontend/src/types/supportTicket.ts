export type SupportTicketCategory =
  | "OrderIssue"
  | "Bug"
  | "Payment"
  | "General";

export type SupportTicketStatus = "Open" | "InProgress" | "Resolved";

export interface SupportTicket {
  id: string;
  userId?: string | null;
  userEmail: string;
  orderId?: string | null;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  attachmentUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketPayload {
  userEmail?: string;
  orderId?: string | null;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  attachmentUrls?: string[];
}

