# manual-approval
An abstract manual approval service for task orchestration and agentic workflows in AWS.

## Architecture

1. When an AWS Step Function needs to request a human-in-the-loop's (HITL) manual approval, it invokes the `manual-approval-lambda` function, which creates a `ManualApprovalRequest` record in a DynamoDB table and sends an email link via Simple Notification Service (SNS). 
Example `ManualApprovalRequest` record:
```
{
    id: "01a07617-2886-764a-be90-51c8880ad1c1",
    created: "2026-09-06T09:51:12.793Z", // new Date().toISOString()
    ttl: 1788774828, // Math.floor(Date.now() / 1000)
    status: "pending" | "deny" | "approve",
    confirmed: "2026-09-06T09:57:52.626Z" // Confirmation date. If pending, null.
    schema: "sfn:1", // schema allows for different payload values
    payload: {sfnArn: "arn:aws:states:us-east-1:123456789012:stateMachine:myStateMachine"}
}
```
2. The link (e.g. `example.com/review?m={uuid}`) loads a brutalist page with an `Aprove` link. When clicked, it will POST an approval request to an `/api/approve` endpoint on `manual-approval-api`.
  - The page itself is minimal static HTML. The aim is for this page to be "durable" and minmize updates. To avoid framework churn, this is be plain HTML forms and minimal JavaScript with no build steps or external dependencies. 
  - It is hosted on S3 behind CloudFront
3. The `manual-approval-api` will fetch the `ManualApprovalRequest` record, send a `SendTaskSuccess` to the Step Function, and then redirect the user to the AWS Console.
- The `manual-approval-api` is a TypeScript Express.js API service. For cost and hosting simplicity, it will be wrapped in a Lambda Function. The request path will be CloudFront > API Gateway > Lambda. This reduces cost and maintance while abstracting things like throttling. 

