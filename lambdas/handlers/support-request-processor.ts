import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SQSEvent } from "aws-lambda";

const ddClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddClient);

// sqs event handler
export const handler = async (event: SQSEvent): Promise<void> => {
    try {
        console.log(`Start Processing ${event.Records.length} tickets`);
        
        for (const record of event.Records) {
            const message: SupportTicketMessage = JSON.parse(record.body);
            await processTicket(message);
            console.log(`Processing ticket ${message.ticketId}`);
        }

        console.log('END PROCESSING TICKETS');
    } catch (err) {
        console.log(err);
    }
};

async function processTicket(message: SupportTicketMessage): Promise<void> {
    try {
        const updateCommand = new UpdateCommand({
            TableName: process.env.SUPPORT_TICKETS_TABLE,
            Key: {
                id: message.ticketId,
            },
            UpdateExpression: 'SET #status = :status, updateAt = :updateAt',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'PROCESSED',
                ':updateAt': new Date().toISOString(),
            }
        })
        ddClient.send(updateCommand);
    } catch (err) {
        console.log(`Error processing ticket ${message.ticketId}: ${err}`);
        throw err;
    }
}