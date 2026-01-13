import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from 'uuid';

const ddClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

const queueUrl = process.env.SUPPORT_REQUEST_QUEUE || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        console.log(body);
        const docClient = DynamoDBDocumentClient.from(ddClient);

        const command = new PutCommand({
            TableName: "SupportTickets",
            Item: {
                id: uuidv4(),
                content: body.content,
                status: "RECEIVED",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                customerId: "customer-id-from-api-gateway",  // TODO: get customer id from api gateway
            },
        });
        await docClient.send(command);
        
        const sendMessageCommand = new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify({
                ticketId: command.input.Item?.id,
                content: command.input.Item?.content,
            }),
        });
        await sqsClient.send(sendMessageCommand);

        return {
            statusCode: 202,
            body: JSON.stringify({
                message: 'new ticket has been created for this request',
                ticketId: command.input.Item?.id,
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
