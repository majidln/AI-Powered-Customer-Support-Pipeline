# AI-Powered Customer Support Pipeline

A serverless AWS application that processes customer support tickets using AI to automatically analyze urgency and generate responses.

## Overview

This pipeline receives customer support requests via API Gateway, stores them in DynamoDB, processes them asynchronously using AWS Bedrock (Amazon Nova Lite), and notifies the support team via SNS.

### Architecture

1. **Support Request Receiver** (`support-request-receiver.ts`)
   - Receives POST requests at `/support-request`
   - Creates ticket records in DynamoDB
   - Queues tickets for processing via SQS

2. **Support Request Processor** (`support-request-processor.ts`)
   - Processes tickets from SQS queue
   - Uses AWS Bedrock to analyze ticket urgency and generate responses
   - Updates tickets in DynamoDB with analytics
   - Sends notifications to support team via SNS

### AWS Resources

- **API Gateway**: REST API endpoint for receiving support requests
- **Lambda Functions**: Two functions for receiving and processing tickets
- **DynamoDB**: Ticket storage with server-side encryption
- **SQS**: Queue with dead-letter queue for reliable processing
- **SNS**: Topics for success and failure notifications

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
sam local invoke SupportRequestProcessorFunction --event events/sqs-event.json
```

## Project Structure

```
.
├── lambdas/
│   ├── handlers/
│   │   ├── support-request-receiver.ts  # API Gateway handler
│   │   └── support-request-processor.ts # SQS handler
│   └── shared/
│       └── types.ts                     # TypeScript types
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
  "content": "I'm having trouble logging into my account",
  "customerId": "customer-123"
}
```

**Response:**
```json
{
  "message": "new ticket has been created for this request",
  "ticketId": "uuid-here"
}
```

## Cleanup

Delete the deployed stack:

```bash
sam delete --stack-name AI-Powered-Customer-Support-Pipeline
```

## Future Work

This section outlines planned improvements and enhancements for the AI-Powered Customer Support Pipeline.

### 1. Enhanced Error Handling and Observability

**Current Issues:**
- Bedrock failures silently fall back to default values without proper error tracking
- No CloudWatch alarms or custom metrics for monitoring
- Partial batch failures in SQS processing are not handled gracefully
- Failed SNS topic is configured but never utilized

**Planned Improvements:**
- **Structured Error Handling**: Implement proper error types and error handling patterns
  - Create custom error classes for different failure scenarios
  - Add retry logic for transient failures (Bedrock API, DynamoDB throttling)
  - Implement exponential backoff for retries
  
- **Failed Notification System**: Utilize the `SupportFailedSnsTopic` for error notifications
  - Publish to failed topic when ticket processing fails after retries
  - Include error details and ticket information in failure notifications
  
- **CloudWatch Metrics**: Add custom metrics for better observability
  - Track success/failure counts for ticket processing
  - Monitor processing time and latency
  - Track Bedrock API call success rates
  - Monitor queue depth and processing rates
  
- **CloudWatch Alarms**: Set up proactive monitoring
  - Alarm on DLQ message count (indicates processing failures)
  - Alarm on error rate thresholds
  - Alarm on Lambda function errors
  - Alarm on Bedrock API failures
  
- **Partial Batch Failure Handling**: Implement proper SQS batch processing
  - Use `reportBatchItemFailures` to handle partial batch failures
  - Only retry failed messages, not entire batches
  
- **Distributed Tracing**: Enable AWS X-Ray for end-to-end tracing
  - Track requests across all services (API Gateway → Lambda → SQS → Lambda → DynamoDB → SNS)
  - Identify performance bottlenecks and errors

### 2. Security and Validation Enhancements

**Current Issues:**
- No authentication/authorization on API endpoint
- Hardcoded email address in template.yaml
- Customer ID is a placeholder value
- No input sanitization or validation
- No CORS configuration
- No request size limits

**Planned Improvements:**
- **API Authentication & Authorization**:
  - Add API Gateway authorizer (AWS Cognito, API Key, or Lambda authorizer)
  - Implement role-based access control (RBAC)
  - Extract customer ID from authenticated user context (Cognito claims or custom headers)
  - Add API key management for service-to-service communication
  
- **Configuration Management**:
  - Move email addresses to AWS Systems Manager Parameter Store or Secrets Manager
  - Use SAM template parameters for environment-specific configuration
  - Remove hardcoded values from infrastructure code
  
- **Input Validation**:
  - Add JSON Schema validation using API Gateway request validation
  - Implement input sanitization to prevent injection attacks
  - Add content length limits and validation
  - Validate urgency levels and ticket content format
  
- **CORS Configuration**:
  - Configure proper CORS headers for API Gateway
  - Support preflight requests
  - Restrict allowed origins based on environment
  
- **Rate Limiting & Throttling**:
  - Implement API Gateway throttling (per-key or per-account)
  - Add usage plans and API keys
  - Configure burst and steady-state rate limits
  
- **Security Best Practices**:
  - Enable AWS WAF (Web Application Firewall) for API Gateway
  - Implement request signing validation
  - Add security headers (X-Content-Type-Options, X-Frame-Options, etc.)
  - Enable VPC endpoints for AWS service communication (if using VPC)

### 3. Testing and Documentation

**Current Issues:**
- No unit tests (Jest is configured but no test files exist)
- No integration tests
- README contains outdated information (references hello-world)
- No API documentation
- Missing deployment and development guides

**Planned Improvements:**
- **Unit Testing**:
  - Create comprehensive unit tests for `SupportRequestReceiverFunction`
    - Test request validation
    - Test DynamoDB operations
    - Test SQS message sending
    - Test error handling scenarios
  
  - Create comprehensive unit tests for `SupportRequestProcessorFunction`
    - Test Bedrock API integration (with mocks)
    - Test analytics generation logic
    - Test DynamoDB update operations
    - Test SNS notification publishing
    - Test error handling and fallback scenarios
  
  - Add test coverage reporting
  - Set up CI/CD pipeline with automated testing
  
- **Integration Testing**:
  - Create end-to-end integration tests
  - Test full flow: API → Lambda → SQS → Lambda → DynamoDB → SNS
  - Use AWS SAM local for local integration testing
  - Test with real AWS services in a test environment
  
- **Documentation Updates**:
  - Update README with current architecture and flow
  - Document all environment variables and configuration options
  - Add API documentation with request/response examples
  - Create deployment guide with step-by-step instructions
  - Add troubleshooting guide for common issues
  - Document development setup and local testing procedures
  
- **API Documentation**:
  - Create OpenAPI/Swagger specification for the API
  - Document all endpoints, request/response schemas
  - Add example requests and responses
  - Document error codes and error responses
  - Include authentication requirements
  
- **Additional Documentation**:
  - Architecture diagram (using AWS Architecture Icons)
  - Data flow diagrams
  - Security documentation
  - Operational runbooks
  - Cost optimization guide

### Additional Improvements

- **Performance Optimization**:
  - Implement connection pooling for AWS SDK clients
  - Add caching layer (ElastiCache) for frequently accessed data
  - Optimize DynamoDB queries and indexes
  - Consider using provisioned concurrency for Lambda functions
  
- **Cost Optimization**:
  - Review and optimize Lambda memory allocation
  - Implement DynamoDB on-demand to provisioned capacity transition for predictable workloads
  - Add cost monitoring and alerts
  - Optimize Bedrock model selection based on use case
  
- **Feature Enhancements**:
  - Add support for ticket attachments
  - Implement ticket status updates and webhooks
  - Add support for multiple languages in ticket processing
  - Implement ticket categorization and tagging
  - Add support for ticket escalation workflows
  - Implement customer feedback collection
