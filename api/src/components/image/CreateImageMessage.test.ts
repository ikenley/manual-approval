import { describe, expect, test } from "vitest";
import CreateImageMessage from "./CreateImageMessage";

describe("CreateImageMessage", () => {
  test("should create a CreateImageMessage instance from ImageMetadataEntity", () => {
    const imageMetadataEntity = {
      imageId: "123",
      prompt: "A beautiful sunset",
      userId: "user-456",
      email: "user@example.net",
      requestedAt: new Date(),
      completedAt: null,
    };

    const createImageMessage = new CreateImageMessage(imageMetadataEntity);

    expect(createImageMessage).toBeInstanceOf(CreateImageMessage);
    expect(createImageMessage.imageId).toBe("123");
    expect(createImageMessage.prompt).toBe("A beautiful sunset");
    expect(createImageMessage.userId).toBe("user-456");
    expect(createImageMessage.email).toBe("user@example.net");
  });
});
