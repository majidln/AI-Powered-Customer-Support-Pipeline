import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

const logsClient = new CloudWatchLogsClient({});
const LOG_GROUP_NAME = process.env.ERROR_LOG_GROUP_NAME || '';

export async function logBedrockTicketProcessorError(ticketId: String, error: any, context: Record<string, any> = {}): Promise<void> {
    const errorLog = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        service: 'BedrockTicketProcessor',
        ticketId,
        error: {
            name: error?.name || 'UnknownError',
            message: error?.message || String(error),
            stack: error?.stack,
            ...(error?.$metadata && { 
                requestId: error.$metadata.requestId,
                httpStatusCode: error.$metadata.httpStatusCode 
            })
        },
        context: {
            ...context,
            bedrockModelId: process.env.BEDROCK_MODEL_ID
        },
        environment: process.env.STAGE_NAME || 'dev'
    };

    try {
        // Write to custom log group
        if (LOG_GROUP_NAME) {
            await writeToCustomLogGroup(LOG_GROUP_NAME, errorLog);
        }
        
        // Also log to default log group for visibility
        console.error(JSON.stringify(errorLog));
    } catch (logError) {
        // Fallback to default logging if custom log group write fails
        console.error('Failed to write to custom log group:', logError);
        console.error(JSON.stringify(errorLog));
    }
}

async function writeToCustomLogGroup(logGroupName: string, logEntry: any): Promise<void> {
    const logStreamName = `errors-${new Date().toISOString().split('T')[0]}`; // Daily log stream
    
    try {
        // Ensure log group exists
        try {
            await logsClient.send(new CreateLogGroupCommand({
                logGroupName
            }));
        } catch (err: any) {
            // Log group might already exist, which is fine
            if (err.name !== 'ResourceAlreadyExistsException') {
                throw err;
            }
        }

        // Try to get or create log stream
        try {
            await logsClient.send(new CreateLogStreamCommand({
                logGroupName,
                logStreamName
            }));
        } catch (err: any) {
            // Log stream might already exist, which is fine
            if (err.name !== 'ResourceAlreadyExistsException') {
                throw err;
            }
        }

        // Put log event
        await logsClient.send(new PutLogEventsCommand({
            logGroupName,
            logStreamName,
            logEvents: [{
                timestamp: Date.now(),
                message: JSON.stringify(logEntry)
            }]
        }));
    } catch (err) {
        // If writing fails, we'll fall back to console.error in the caller
        throw err;
    }
}
