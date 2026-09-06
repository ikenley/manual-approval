import type ImageMetadataEntity from "./ImageMetadataEntity.ts";

export default class CreateImageMessage {
  imageId: string;
  prompt: string;
  userId: string;
  email: string;

  constructor(imageMetadataEntity: ImageMetadataEntity) {
    const { imageId, prompt, userId, email } = imageMetadataEntity;

    this.imageId = imageId;
    this.prompt = prompt;
    this.userId = userId;
    this.email = email;
  }
}
