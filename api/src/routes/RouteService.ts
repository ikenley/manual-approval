import { Router } from "express";
import type AiController from "../components/ai/AiController.ts";
import type ChatController from "../components/chat/ChatController.ts";
import type ImageController from "../components/image/ImageController.ts";
import type StatusController from "../components/status/StatusController.ts";
import type StorybookController from "../components/storybook/StorybookController.ts";
import type { ApiCradle } from "../container/Cradle.ts";

export default class RouteService {
  protected aiController: AiController;
  protected chatController: ChatController;
  protected imageController: ImageController;
  protected statusController: StatusController;
  protected storybookController: StorybookController;

  constructor({
    aiController,
    chatController,
    imageController,
    statusController,
    storybookController,
  }: ApiCradle) {
    this.aiController = aiController;
    this.chatController = chatController;
    this.imageController = imageController;
    this.statusController = statusController;
    this.storybookController = storybookController;
  }

  public registerRoutes() {
    const app = Router();

    this.aiController.registerRoutes(app);
    this.chatController.registerRoutes(app);
    this.imageController.registerRoutes(app);
    this.statusController.registerRoutes(app);
    this.storybookController.registerRoutes(app);

    return app;
  }
}
