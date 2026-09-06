import { BedrockAgentRuntimeClient } from "@aws-sdk/client-bedrock-agent-runtime";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SESClient } from "@aws-sdk/client-ses";
import { SFNClient } from "@aws-sdk/client-sfn";
import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  type AwilixContainer,
  asClass,
  asFunction,
  asValue,
  createContainer,
  InjectionMode,
  type Resolver,
} from "awilix";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import AuthenticationMiddlewareProvider from "../auth/AuthenticationMiddlewareProvider.ts";
import AuthorizationMiddleware from "../auth/AuthorizationMiddleware.ts";
import JwtValidationService from "../auth/JwtValidationService.ts";
import AiController from "../components/ai/AiController.ts";
import AiService from "../components/ai/AiService.ts";
import ChatController from "../components/chat/ChatController.ts";
import ChatService from "../components/chat/ChatService.ts";
import ImageController from "../components/image/ImageController.ts";
import ImageMetadataRepository from "../components/image/ImageMetadataRepository.ts";
import ImageMetadataService from "../components/image/ImageMetadataService.ts";
import StatusController from "../components/status/StatusController.ts";
import StorybookController from "../components/storybook/StorybookController.ts";
import StorybookService from "../components/storybook/StorybookService.ts";
import { getConfigOptions } from "../config/index.ts";
import ExpressLoader from "../loaders/ExpressLoader.ts";
import LoggerInstance from "../loaders/logger.ts";
import RouteService from "../routes/RouteService.ts";
import EmailService from "../services/EmailService.ts";
import LoggerProvider from "../utils/LoggerProvider.ts";
import type { ApiCradle } from "./Cradle.ts";
import { requestScopedOnly } from "./requestScopedOnly.ts";

/** Every key in ApiCradle must appear below, or this fails to compile. */
type ApiRegistrations = { [K in keyof ApiCradle]: Resolver<ApiCradle[K]> };

/**
 * Builds the root container for the HTTP API.
 *
 * Lifetimes are the point of this table. `singleton` is app-lifetime, built
 * once at boot; `scoped` is per request, built against the child scope created
 * by dependencyInjectionMiddleware. With `strict: true`, awilix refuses to let
 * a singleton capture a scoped dependency, which is what previously let the
 * auth middleware freeze a NIL request id into its logger for the life of the
 * process.
 */
export const buildApiContainer = (): AwilixContainer<ApiCradle> => {
  const container = createContainer<ApiCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  const registrations: ApiRegistrations = {
    config: asValue(getConfigOptions()),
    logger: asValue(LoggerInstance),

    // Supplied by the request scope, never by the root container.
    requestId: asFunction(requestScopedOnly("requestId")).scoped(),
    user: asFunction(requestScopedOnly("user")).scoped(),

    jwtVerifier: asFunction(({ config }: ApiCradle) =>
      CognitoJwtVerifier.create({
        userPoolId: config.cognito.userPoolId,
        tokenUse: "id",
        clientId: config.cognito.userPoolClientId,
      }),
    ).singleton(),

    bedrockAgentClient: asFunction(
      () => new BedrockAgentRuntimeClient(),
    ).singleton(),
    bedrockRuntimeClient: asFunction(
      () => new BedrockRuntimeClient(),
    ).singleton(),
    dynamoDBDocumentClient: asFunction(() =>
      DynamoDBDocumentClient.from(new DynamoDBClient()),
    ).singleton(),
    sesClient: asFunction(() => new SESClient()).singleton(),
    sfnClient: asFunction(() => new SFNClient()).singleton(),
    sqsClient: asFunction(() => new SQSClient()).singleton(),

    // Request-scoped: everything below either reads the request id or the user,
    // directly or through LoggerProvider.
    loggerProvider: asClass(LoggerProvider).scoped(),
    emailService: asClass(EmailService).scoped(),
    imageMetadataRepository: asClass(ImageMetadataRepository).scoped(),
    imageMetadataService: asClass(ImageMetadataService).scoped(),
    jwtValidationService: asClass(JwtValidationService).scoped(),
    aiService: asClass(AiService).scoped(),
    chatService: asClass(ChatService).scoped(),
    storybookService: asClass(StorybookService).scoped(),

    // App-lifetime: these register Express routes once at boot and must pull
    // request-scoped dependencies from res.locals.scope inside their handlers.
    authenticationMiddlewareProvider: asClass(
      AuthenticationMiddlewareProvider,
    ).singleton(),
    authorizationMiddleware: asClass(AuthorizationMiddleware).singleton(),
    aiController: asClass(AiController).singleton(),
    chatController: asClass(ChatController).singleton(),
    imageController: asClass(ImageController).singleton(),
    statusController: asClass(StatusController).singleton(),
    storybookController: asClass(StorybookController).singleton(),
    routeService: asClass(RouteService).singleton(),
    expressLoader: asClass(ExpressLoader).singleton(),
  };

  container.register(registrations);
  return container;
};

export default buildApiContainer;
