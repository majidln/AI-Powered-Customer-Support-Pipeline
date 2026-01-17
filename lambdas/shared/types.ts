export enum TicketStatus {
    RECEIVED = 'RECEIVED',
    PROCESSED = 'PROCESSED',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export interface SupportTicketMessage {
    ticketId: string;
    content: string;
}

export enum Urgency {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export interface TicketAnalytics {
    urgency: Urgency;
    response: string;
}

export interface SupportTicket {
    id: string;
    content: string;
    status: TicketStatus;
    createdAt: string;
    updatedAt: string;
    customerId: string;
    urgency?: Urgency;
    response?: string;
    analyticsGeneratedAt?: string;
}

export interface CreateTicketRequest {
    content: string;
    customerId?: string;
}

export interface CreateTicketResponse {
    message: string;
    ticketId: string;
}
