export type CreatePunParams = {
  prompt: string;
};

export type CreatePunResponse = {
  content: string;
};

export const CognitoJwtVerifierToken = "CognitoJwtVerifier";

export type RequestImageParams = {
  prompt: string;
};

export type CreateStoryParams = {
  title: string;
  description: string;
  artNote: string;
};

export type SendChatParams = {
  sessionId: string;
  prompt: string;
};

export type SendChatResponse = {
  sessionId: string;
  agentReply: string;
};
