import { SQSEvent } from "aws-lambda";

// sqs event handler
export const handler = async (event: SQSEvent): Promise<void> => {
    try {
        console.log(`Start Processing ${event.Records.length} tickets`);
        
        for (const record of event.Records) {
            const message: SupportTicketMessage = JSON.parse(record.body);
            processTicket(message);
            console.log(`Processing ticket ${message.ticketId}`);
        }

        console.log('END PROCESSING TICKETS');
    } catch (err) {
        console.log(err);
    }
};

async function processTicket(message: SupportTicketMessage): Promise<void> {
    try {
        
    } catch (err) {
        console.log(`Error processing ticket ${message.ticketId}: ${err}`);
        throw err;
    }
}