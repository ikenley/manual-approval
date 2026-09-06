import type { BedrockAgentRuntimeClient } from "@aws-sdk/client-bedrock-agent-runtime";
import type { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import type { S3Client } from "@aws-sdk/client-s3";
import type { SESClient } from "@aws-sdk/client-ses";
import type { SFNClient } from "@aws-sdk/client-sfn";
import type { SQSClient } from "@aws-sdk/client-sqs";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { GoogleGenAI } from "@google/genai";
import type { CognitoJwtVerifier } from "aws-jwt-verify";
import type winston from "winston";
import type AuthenticationMiddlewareProvider from "../auth/AuthenticationMiddlewareProvider.ts";
import type AuthorizationMiddleware from "../auth/AuthorizationMiddleware.ts";
import type JwtValidationService from "../auth/JwtValidationService.ts";
import type User from "../auth/User.ts";
import type AiController from "../components/ai/AiController.ts";
import type AiService from "../components/ai/AiService.ts";
import type ChatController from "../components/chat/ChatController.ts";
import type ChatService from "../components/chat/ChatService.ts";
import type ImageController from "../components/image/ImageController.ts";
import type ImageGeneratorService from "../components/image/ImageGeneratorService.ts";
import type ImageMetadataRepository from "../components/image/ImageMetadataRepository.ts";
import type ImageMetadataService from "../components/image/ImageMetadataService.ts";
import type JobRunnerService from "../components/image/JobRunnerService.ts";
import type StatusController from "../components/status/StatusController.ts";
import type StorybookController from "../components/storybook/StorybookController.ts";
import type StorybookService from "../components/storybook/StorybookService.ts";
import type { ConfigOptions } from "../config/index.ts";
import type ExpressLoader from "../loaders/ExpressLoader.ts";
import type RouteService from "../routes/RouteService.ts";
import type EmailService from "../services/EmailService.ts";
import type LoggerProvider from "../utils/LoggerProvider.ts";

/**
 * The dependency injection cradle.
 *
 * With `InjectionMode.PROXY`, awilix hands each constructor a single object
 * whose properties are the registered dependencies, resolved lazily on access.
 * These interfaces are the contract for that object: a class declares the keys
 * it needs by destructuring, and the container's registration table is typed
 * against the same interface, so a missing registration is a compile error
 * rather than a runtime one.
 *
 * The split into three reflects the two entrypoints. The API lambda and the job
 * runner lambda build different graphs, and a class shared by both should depend
 * only on `CoreCradle` so it can be constructed by either.
 */

/** Available in every container. Classes used by both entrypoints take this. */
export interface CoreCradle {
  config: ConfigOptions;
  logger: winston.Logger;

  /** Request-scoped. Only a scope can supply this — see buildApiContainer. */
  requestId: string;
  /** Request-scoped. Registered by the authentication middleware. */
  user: User;

  dynamoDBDocumentClient: DynamoDBDocumentClient;
  sesClient: SESClient;
  sqsClient: SQSClient;

  loggerProvider: LoggerProvider;
  emailService: EmailService;
  imageMetadataRepository: ImageMetadataRepository;
  imageMetadataService: ImageMetadataService;
}

/** The HTTP API graph: auth, controllers, and the Express wiring. */
export interface ApiCradle extends CoreCradle {
  jwtVerifier: CognitoJwtVerifier<any, any, any>;
  bedrockAgentClient: BedrockAgentRuntimeClient;
  bedrockRuntimeClient: BedrockRuntimeClient;
  sfnClient: SFNClient;

  jwtValidationService: JwtValidationService;
  authenticationMiddlewareProvider: AuthenticationMiddlewareProvider;
  authorizationMiddleware: AuthorizationMiddleware;

  aiService: AiService;
  chatService: ChatService;
  storybookService: StorybookService;

  aiController: AiController;
  chatController: ChatController;
  imageController: ImageController;
  statusController: StatusController;
  storybookController: StorybookController;

  routeService: RouteService;
  expressLoader: ExpressLoader;
}

/** The SQS-driven image generation graph. No HTTP request, so no request scope. */
export interface JobRunnerCradle extends CoreCradle {
  genAI: GoogleGenAI;
  s3Client: S3Client;

  imageGeneratorService: ImageGeneratorService;
  jobRunnerService: JobRunnerService;
}
