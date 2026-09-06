# Deploy to ECR

TAG=$1
echo "TAG=$TAG"

docker build -t ik-dev-manual-approval-lambda-test:$TAG -f Dockerfile-lambda --build-arg APP_VERSION=$TAG .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 924586450630.dkr.ecr.us-east-1.amazonaws.com
docker tag ik-dev-manual-approval-lambda-test:$TAG 924586450630.dkr.ecr.us-east-1.amazonaws.com/ik-dev-manual-approval-lambda-test:$TAG
docker push 924586450630.dkr.ecr.us-east-1.amazonaws.com/ik-dev-manual-approval-lambda-test:$TAG