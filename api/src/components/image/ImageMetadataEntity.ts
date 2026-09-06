export default class ImageMetadataEntity {
  imageId: string;
  prompt: string;
  userId: string;
  email: string;
  requestedAt: Date;
  completedAt: Date | null;
}
