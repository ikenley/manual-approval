import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import * as path from "node:path";
import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import type { GoogleGenAI } from "@google/genai";
import type winston from "winston";
import type { ConfigOptions } from "../../config/index.ts";
import type { JobRunnerCradle } from "../../container/Cradle.ts";
import type EmailService from "../../services/EmailService.ts";
import type CreateImageMessage from "./CreateImageMessage.ts";
import type ImageMetadataService from "./ImageMetadataService.ts";

export default class ImageGeneratorService {
  private logger: winston.Logger;
  protected config: ConfigOptions;
  protected genAI: GoogleGenAI;
  protected s3Client: S3Client;
  protected emailService: EmailService;
  protected imageMetadataService: ImageMetadataService;

  constructor({
    loggerProvider,
    config,
    genAI,
    s3Client,
    emailService,
    imageMetadataService,
  }: JobRunnerCradle) {
    this.config = config;
    this.genAI = genAI;
    this.s3Client = s3Client;
    this.emailService = emailService;
    this.imageMetadataService = imageMetadataService;
    this.logger = loggerProvider.provide("ImageGeneratorService");
  }

  /** Generate an image based on a prompt, save it to S3, and send image link. */
  public async generate(message: CreateImageMessage) {
    const { imageId, prompt, email } = message;

    const filePath = await this.createImage(imageId, prompt);

    const s3Key = await this.uploadToS3(imageId, filePath);

    await this.sendEmail(email, s3Key, prompt);

    await this.imageMetadataService.markCompleted(imageId);
  }

  /** Generate an image based on a prompt */
  private async createImage(imageId: string, prompt: string) {
    this.logger.info("createImage", { imageId, prompt });

    const response = await this.genAI.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData,
    );
    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in Gemini response");
    }

    const filePath = path.join("/tmp", `${imageId}.png`);
    await writeFile(filePath, imagePart.inlineData.data, {
      encoding: "base64",
    });
    return filePath;
  }

  private async uploadToS3(imageId: string, filePath: string) {
    const fileContent = readFileSync(filePath); // This is inefficient, but works for small images
    const s3Key = `img/${imageId}.png`;
    const input = {
      Body: fileContent,
      Bucket: this.config.imageS3BucketName,
      Key: s3Key,
    };
    this.logger.info("uploadToS3", { s3Key });
    const command = new PutObjectCommand(input);
    await this.s3Client.send(command);

    return s3Key;
  }

  private async sendEmail(
    destinationEmail: string,
    s3Key: string,
    prompt: string,
  ) {
    this.logger.info("sendEmail", { destinationEmail });

    const subject = "Your AI-generated image is ready";
    const textMessage = `Your AI-generated image is ready.
            Prompt: "${prompt}"
            Result https://${this.config.imageS3BucketName}/${s3Key}
            To create more images, visit https://ai.ikenley.com/ai/image`;
    const htmlMessage = `<p>Your AI-generated image is ready.</p>
            <p>Prompt: "${prompt}"</p>
            <p>Result: <br />
            <img src="https://${this.config.imageS3BucketName}/${s3Key}" /></p>
            <p>To create more images, visit <a href="https://ai.ikenley.com/ai/image">ai.ikenley.com/image</a></p>`;

    await this.emailService.sendEmail(
      destinationEmail,
      subject,
      textMessage,
      htmlMessage,
    );
  }
}
