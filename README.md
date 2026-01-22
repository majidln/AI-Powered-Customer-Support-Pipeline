# AI-Powered Customer Support Pipeline

A serverless AWS application that processes customer support tickets using AI to automatically analyze urgency and generate responses.

## Overview

This pipeline receives customer support requests via API Gateway, stores them in DynamoDB, processes them asynchronously using AWS Bedrock (Amazon Nova Lite), and notifies the support team via SNS.

### Architecture

1. **Support Request Receiver** (`support-request-receiver.ts`)
   - Receives POST requests at `/support-request`
   - Creates ticket records in DynamoDB
   - Queues tickets for processing via SQS

2. **Fetch Support Ticket** (`fetch-support-ticket.ts`)
   - Receives GET requests at `/support-request?ticketId=<id>`
   - Retrieves ticket information from DynamoDB
   - Returns the AI-generated response for the ticket

3. **Support Request Processor** (`support-request-processor.ts`)
   - Processes tickets from SQS queue
   - Uses AWS Bedrock (Amazon Nova Lite) to analyze ticket urgency and generate responses
   - Updates tickets in DynamoDB with analytics
   - Sends notifications to support team via SNS
   - Logs errors to a dedicated CloudWatch log group for monitoring

### AWS Resources

- **API Gateway**: HTTP API with endpoints for creating and fetching support tickets
- **Lambda Functions**: Three functions for receiving, fetching, and processing tickets
- **DynamoDB**: Ticket storage with server-side encryption
- **SQS**: Queue with dead-letter queue for reliable processing
- **SNS**: Topics for ticket notifications and error alerts
- **CloudWatch**: Log groups, metric filters, and alarms for monitoring and alerting

## Prerequisites

- AWS CLI configured
- SAM CLI installed
- Node.js 22+
- Docker (for local testing)

## Deployment

Build and deploy the application:

```bash
sam build
sam deploy --guided
```

The API Gateway endpoint URL will be displayed in the deployment output.

**Important:** After deployment, subscribe to the SNS topics for notifications:
- **Support Ticket Notifications**: Subscribe to receive notifications when tickets are processed
- **Bedrock Error Alerts**: Subscribe to receive alerts when Bedrock processing errors occur

Use the SNS Topic ARNs from the deployment outputs to subscribe via AWS Console, CLI, or SDK.

## Local Development

Build the application:

```bash
sam build
```

Start the API locally:

```bash
sam local start-api
```

Test individual functions:

```bash
sam local invoke SupportRequestReceiverFunction --event events/new-ticket.json
sam local invoke FetchSupportRequestFunction --event events/fetch-ticket.json
sam local invoke SupportRequestProcessorFunction --event events/sqs-event.json
```

## Project Structure

```
.
├── lambdas/
│   ├── handlers/
│   │   ├── support-request-receiver.ts  # POST endpoint handler
│   │   ├── fetch-support-ticket.ts      # GET endpoint handler
│   │   └── support-request-processor.ts # SQS handler
│   └── shared/
│       ├── types.ts                     # TypeScript types
│       └── errors-handler.ts            # Error logging utilities
├── events/
│   └── new-ticket.json                  # Test event
├── template.yaml                        # SAM infrastructure template
└── samconfig.toml                       # SAM configuration
```

## API Usage

### Create Support Ticket

**Endpoint:** `POST /support-request`

**Request:**
```json
{
  "content": "I'm having trouble logging into my account"
}
```

**Response:**
```json
{
  "message": "new ticket has been created for this request",
  "ticketId": "uuid-here"
}
```

### Fetch Support Ticket

**Endpoint:** `GET /support-request?ticketId=<ticket-id>`

**Response:**
```json
{
  "response": "Thank you for contacting support. We have received your request and will get back to you soon."
}
```

**Note:** The response field will be `undefined` if the ticket hasn't been processed yet by the AI processor.

## Monitoring and Observability

### CloudWatch Logs

The application uses CloudWatch Logs for centralized logging:

- **Lambda Function Logs**: Each Lambda function automatically logs to CloudWatch Logs
  - Log format: JSON (configured in `template.yaml`)
  - Log retention: Default (never expire) for Lambda logs

- **Bedrock Error Log Group**: Dedicated log group for Bedrock processing errors
  - Log Group Name: `{StackName}-BedrockTicketProcessorErrorLogGroup`
  - Retention: 30 days
  - Contains structured error logs with:
    - Error details (name, message, stack trace)
    - Ticket ID and context
    - Bedrock model ID and request metadata
    - Timestamp and environment information


### CloudWatch Metrics

The application includes custom CloudWatch metrics:

- **BedrockTicketProcessorErrors**: Tracks errors from the Bedrock ticket processor
  - Namespace: `SupportPipeline`
  - Metric Name: `BedrockTicketProcessorErrors`
  - Filter Pattern: `{ $.level = "ERROR" && $.service = "BedrockTicketProcessor" }`
  - Increments by 1 for each error logged

**Viewing Metrics:**
- AWS Console: CloudWatch → Metrics → Custom Namespaces → SupportPipeline
- AWS CLI: `aws cloudwatch get-metric-statistics --namespace SupportPipeline --metric-name BedrockTicketProcessorErrors`

### CloudWatch Alarms

**Bedrock Ticket Processor Error Alarm:**
- **Alarm Name**: `{StackName}-BedrockTicketProcessorErrors`
- **Metric**: `BedrockTicketProcessorErrors` (Sum)
- **Threshold**: > 5 errors in 5 minutes
- **Action**: Sends notification to `BedrockTicketProcessorErrorAlertTopic` SNS topic
- **Missing Data**: Treated as not breaching (no alarm when no data)


## Cleanup

Delete the deployed stack:

```bash
sam delete --stack-name AI-Powered-Customer-Support-Pipeline
```

## Future Work

**API Authentication & Authorization**
- Add API Gateway authorizer (AWS Cognito or Lambda authorizer) to secure endpoints
- Extract customer ID from authenticated user context instead of placeholder values
- Implement API key management for service-to-service communication

**Enhanced Testing & Quality Assurance**
- Create comprehensive unit tests for all Lambda functions with Jest
- Add integration tests for end-to-end flow validation
- Set up CI/CD pipeline with automated testing and deployment

**Advanced Error Handling & Retry Logic**
- Implement retry logic with exponential backoff for transient failures (Bedrock API, DynamoDB throttling)
- Add partial batch failure handling for SQS processing using `reportBatchItemFailures`
- Create custom error classes for better error categorization and handling

**Additional Monitoring & Observability**
- Add custom CloudWatch metrics for ticket processing success rates and latency
- Set up alarms for DLQ message count and Lambda function errors
- Enable AWS X-Ray for distributed tracing across all services

**Feature Enhancements**
- Add support for ticket attachments and file uploads
- Implement ticket status updates and webhook notifications
- Add support for multiple languages in ticket processing
