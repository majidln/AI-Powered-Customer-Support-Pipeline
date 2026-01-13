import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const ddClient = new DynamoDBClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
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

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'new ticket has been created for this request',
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
