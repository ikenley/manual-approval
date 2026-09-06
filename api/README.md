# manual-approval-[api|lambda]

This houses the backend for the Manual Approval service. While it compiles to a single Docker image with mostly shared components, there are three entrypoints:
1. `./src/index-api-lambda.ts`: The entrypoint for the REST API service, which is hosted in an AWS Lambda Function
2. `api/src/index-lambda.ts`: The entrypoint for the vanilla Lambda Function, which AWS services directly invoke (e.g. Step Functions and AI Agents)
3. `api/src/index-local.ts`: The entrypoint for local REST API development.

For a general overview, see the root-level `README.md`

## Getting Started

```
cp ./.env.example .env
cd api
npm install
npm run start
```

---

## Docker (lambda entrypoint)

This project can be run as a Lambda function behind an Application Load Balancer to save money.

Example commands below taken from [Deploy Node.js Lambda functions with container images](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-image.html):
```
# Build the Docker image 
docker build -t ik-dev-ai-lambda-test:test -f Dockerfile-lambda --build-arg VERSION=TEST .

# Start the Docker image with the docker run command.
docker run -p 9000:8080 ik-dev-ai-lambda-test:test

# Test your application locally using the RIE
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'

# Deploy
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 924586450630.dkr.ecr.us-east-1.amazonaws.com
aws ecr create-repository --repository-name ik-dev-ai-lambda-test --image-scanning-configuration scanOnPush=true --image-tag-mutability MUTABLE
docker tag ik-dev-ai-lambda-test:test 924586450630.dkr.ecr.us-east-1.amazonaws.com/ik-dev-ai-lambda-test:latest
docker push 924586450630.dkr.ecr.us-east-1.amazonaws.com/ik-dev-ai-lambda-test
```
