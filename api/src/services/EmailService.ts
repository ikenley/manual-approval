import { type SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type winston from "winston";
import type { ConfigOptions } from "../config/index.ts";
import type { CoreCradle } from "../container/Cradle.ts";

/** Generalized email service.
 * Uses AWS SES.
 */
export default class EmailService {
  private logger: winston.Logger;
  protected config: ConfigOptions;
  protected sesClient: SESClient;

  constructor({ loggerProvider, config, sesClient }: CoreCradle) {
    this.config = config;
    this.sesClient = sesClient;
    this.logger = loggerProvider.provide("EmailService");
  }

  public async sendEmail(
    destinationEmail: string,
    subject: string,
    textMessage: string,
    htmlMessage: string,
  ) {
    this.logger.info("sendEmail", { destinationEmail });
    const input = {
      Source: this.config.fromEmailAddress,
      Destination: {
        ToAddresses: [destinationEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: textMessage,
            Charset: "UTF-8",
          },
          Html: {
            Data: htmlMessage,
            Charset: "UTF-8",
          },
        },
      },
    };
    const command = new SendEmailCommand(input);
    await this.sesClient.send(command);
  }
}
