import { type SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import type winston from "winston";
import type User from "../../auth/User.ts";
import type { ConfigOptions } from "../../config/index.ts";
import type { ApiCradle } from "../../container/Cradle.ts";
import type { CreateStoryParams } from "../../types/index.ts";

export default class StorybookService {
  private logger: winston.Logger;
  protected config: ConfigOptions;
  protected user: User;
  protected requestId: string;
  protected sfnClient: SFNClient;

  constructor({
    loggerProvider,
    config,
    user,
    requestId,
    sfnClient,
  }: ApiCradle) {
    this.config = config;
    this.user = user;
    this.requestId = requestId;
    this.sfnClient = sfnClient;
    this.logger = loggerProvider.provide("StorybookService");
  }

  /** Generate an image based on a prompt, save it to S3, and send image link. */
  public async create(params: CreateStoryParams): Promise<void> {
    const { title, description, artNote } = params;
    this.logger.info(`create`, { title, description, artNote });

    await this.startJobExecution(title, description, artNote);
  }

  /** Trigger the AWS Step Function execution */
  private async startJobExecution(
    title: string,
    description: string,
    artNote: string,
  ): Promise<void> {
    const input = {
      stateMachineArn: this.config.stateFunctionArn,
      name: this.requestId,
      input: JSON.stringify({
        Title: title,
        Description: description,
        ArtNote: artNote,
        UserEmailAddress: this.user.email,
      }),
    };
    this.logger.info(`startJobExecution`, { input });
    const command = new StartExecutionCommand(input);
    await this.sfnClient.send(command);
  }
}
