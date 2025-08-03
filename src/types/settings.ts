export interface TelegramConfig {
  botToken: string;
  chatId: string;
  webhookUrl?: string;
  enableNotifications: boolean;
  testConnectionStatus?: 'idle' | 'testing' | 'success' | 'error';
  testConnectionMessage?: string;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  description?: string;
  testStatus?: 'idle' | 'testing' | 'success' | 'error';
  testMessage?: string;
}

export interface LLMProvider {
  provider: 'openai' | 'anthropic' | 'gemini' | 'local' | 'openrouter';
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  endpoint?: string;
  systemPrompt?: string;
}

export interface APIKeysConfig {
  googleMapsApiKey?: string;
  stripeApiKey?: string;
  stripeSecretKey?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  sendgridApiKey?: string;
  revolutApiKey?: string;
  revolutSandbox: boolean;
  githubClientId?: string;
  githubClientSecret?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  openrouterApiKey?: string;
}

export interface NotificationSettings {
  email: boolean;
  telegram: boolean;
  push: boolean;
  sms: boolean;
  discord: boolean;
  slack: boolean;
}

export interface AppSettings {
  id?: string;
  telegram: TelegramConfig;
  mcpServers: MCPServerConfig[];
  llm: LLMProvider;
  apiKeys: APIKeysConfig;
  notifications: NotificationSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SettingsTab {
  id: string;
  label: string;
  icon: string;
  description: string;
}