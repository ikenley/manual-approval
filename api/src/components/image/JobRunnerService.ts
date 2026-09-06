import type { SQSEvent } from "aws-lambda";
import type winston from "winston";
import type { JobRunnerCradle } from "../../container/Cradle.ts";
import type CreateImageMessage from "./CreateImageMessage.ts";
import type ImageGeneratorService from "./ImageGeneratorService.ts";

/** Handler for job-runner lambda function.
 * Parses event and routes to relevent business layer.
 */
export default class JobRunnerService {
  private logger: winston.Logger;
  protected imageGeneratorService: ImageGeneratorService;

  constructor({ loggerProvider, imageGeneratorService }: JobRunnerCradle) {
    this.imageGeneratorService = imageGeneratorService;
    this.logger = loggerProvider.provide("JobRunnerService");
  }

  public async handleEvent(event: SQSEvent) {
    this.logger.info("handleEvent", event);

    const message = JSON.parse(event.Records[0].body) as CreateImageMessage;
    this.logger.info("message", message);

    await this.imageGeneratorService.generate(message);
  }
}
