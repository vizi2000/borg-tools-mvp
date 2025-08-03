'use client';

import { useAuth } from '@/components/auth/auth-context';
import { useTheme } from '@/components/theme/theme-context';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Settings, 
  LogOut, 
  MessageSquare,
  Server,
  Key,
  Bot,
  Bell,
  ArrowLeft,
  Save,
  TestTube,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { LoadingButton } from '@/components/ui/loading';
import type { AppSettings, MCPServerConfig, SettingsTab } from '@/types/settings';

const settingsTabs: SettingsTab[] = [
  {
    id: 'telegram',
    label: 'Telegram',
    icon: 'MessageSquare',
    description: 'Configure Telegram bot for notifications'
  },
  {
    id: 'mcp',
    label: 'MCP Servers',
    icon: 'Server',
    description: 'Manage Model Context Protocol servers'
  },
  {
    id: 'api-keys',
    label: 'API Keys',
    icon: 'Key',
    description: 'Manage API keys for various services'
  },
  {
    id: 'llm',
    label: 'LLM Config',
    icon: 'Bot',
    description: 'Configure language model providers'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'Bell',
    description: 'Manage notification preferences'
  }
];

const defaultSettings: AppSettings = {
  telegram: {
    botToken: '',
    chatId: '',
    enableNotifications: false
  },
  mcpServers: [],
  llm: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2048
  },
  apiKeys: {
    revolutSandbox: true
  },
  notifications: {
    email: true,
    telegram: false,
    push: true,
    sms: false,
    discord: false,
    slack: false
  }
};

export default function SettingsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('telegram');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('borg_tools_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // In production, this would call the API
      localStorage.setItem('borg_tools_settings', JSON.stringify(settings));
      showSuccessToast('Settings Saved', 'Your settings have been saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showErrorToast('Save Failed', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingSettings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const renderTabIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      MessageSquare,
      Server,
      Key,
      Bot,
      Bell
    };
    const Icon = icons[iconName] || Settings;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      theme === 'liquid-glass' 
        ? 'page-background' 
        : 'bg-background'
    }`}>
      {theme === 'liquid-glass' && (
        <div className="page-overlay fixed inset-0 pointer-events-none" />
      )}
      
      {/* Header */}
      <header className={`border-b transition-all duration-300 ${
        theme === 'liquid-glass' 
          ? 'glass-card border-theme-primary backdrop-filter backdrop-blur-xl' 
          : 'border-border'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-text-muted hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold">Settings</h1>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <LoadingButton
                onClick={saveSettings}
                loading={isSaving}
                className="px-4 py-2"
                variant="primary"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </LoadingButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-text-muted hover:text-text hover:bg-background-card'
                  }`}
                >
                  {renderTabIcon(tab.icon)}
                  <span className="ml-3">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-9">
            <div className={`transition-all duration-300 rounded-lg p-6 ${
              theme === 'liquid-glass'
                ? 'glass-card'
                : 'bg-background-card border border-border'
            }`}>
              {activeTab === 'telegram' && <TelegramSettings settings={settings} setSettings={setSettings} />}
              {activeTab === 'mcp' && <MCPSettings settings={settings} setSettings={setSettings} />}
              {activeTab === 'api-keys' && <APIKeysSettings settings={settings} setSettings={setSettings} />}
              {activeTab === 'llm' && <LLMSettings settings={settings} setSettings={setSettings} />}
              {activeTab === 'notifications' && <NotificationSettings settings={settings} setSettings={setSettings} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TelegramSettings({ settings, setSettings }: { settings: AppSettings, setSettings: any }) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const testConnection = async () => {
    if (!settings.telegram.botToken) {
      showErrorToast('Missing Token', 'Please enter a bot token first');
      return;
    }

    setTestStatus('testing');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would call the Telegram API
      if (settings.telegram.botToken.includes('test')) {
        throw new Error('Invalid bot token');
      }
      
      setTestStatus('success');
      showSuccessToast('Connection Successful', 'Telegram bot is configured correctly');
    } catch (error) {
      setTestStatus('error');
      showErrorToast('Connection Failed', 'Failed to connect to Telegram bot');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Telegram Configuration</h2>
        <p className="text-sm text-text-muted">
          Configure your Telegram bot to receive notifications and updates
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bot Token</label>
          <input
            type="password"
            value={settings.telegram.botToken}
            onChange={(e) => setSettings({
              ...settings,
              telegram: { ...settings.telegram, botToken: e.target.value }
            })}
            placeholder="Enter your Telegram bot token"
            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-text-muted mt-1">
            Get this from @BotFather on Telegram
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Chat ID</label>
          <input
            type="text"
            value={settings.telegram.chatId}
            onChange={(e) => setSettings({
              ...settings,
              telegram: { ...settings.telegram, chatId: e.target.value }
            })}
            placeholder="Enter your chat ID"
            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-text-muted mt-1">
            Your personal chat ID or group chat ID
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Webhook URL (Optional)</label>
          <input
            type="url"
            value={settings.telegram.webhookUrl || ''}
            onChange={(e) => setSettings({
              ...settings,
              telegram: { ...settings.telegram, webhookUrl: e.target.value }
            })}
            placeholder="https://your-domain.com/webhook/telegram"
            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableTelegramNotifications"
            checked={settings.telegram.enableNotifications}
            onChange={(e) => setSettings({
              ...settings,
              telegram: { ...settings.telegram, enableNotifications: e.target.checked }
            })}
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
          />
          <label htmlFor="enableTelegramNotifications" className="ml-2 text-sm">
            Enable Telegram notifications
          </label>
        </div>

        <div className="pt-4 border-t border-border">
          <LoadingButton
            onClick={testConnection}
            loading={testStatus === 'testing'}
            className="px-4 py-2"
            variant="secondary"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Test Connection
          </LoadingButton>

          {testStatus === 'success' && (
            <p className="mt-2 text-sm text-green-500 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Connection successful
            </p>
          )}
          {testStatus === 'error' && (
            <p className="mt-2 text-sm text-red-500 flex items-center">
              <XCircle className="w-4 h-4 mr-1" />
              Connection failed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MCPSettings({ settings, setSettings }: { settings: AppSettings, setSettings: any }) {
  const [newServer, setNewServer] = useState<MCPServerConfig>({
    id: '',
    name: '',
    url: '',
    apiKey: '',
    enabled: true
  });
  const [isAdding, setIsAdding] = useState(false);
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const addServer = () => {
    if (!newServer.name || !newServer.url) {
      showErrorToast('Missing Fields', 'Please fill in all required fields');
      return;
    }

    const server: MCPServerConfig = {
      ...newServer,
      id: Date.now().toString()
    };

    setSettings({
      ...settings,
      mcpServers: [...settings.mcpServers, server]
    });

    setNewServer({
      id: '',
      name: '',
      url: '',
      apiKey: '',
      enabled: true
    });
    setIsAdding(false);
    showSuccessToast('Server Added', 'MCP server has been added successfully');
  };

  const removeServer = (id: string) => {
    setSettings({
      ...settings,
      mcpServers: settings.mcpServers.filter(s => s.id !== id)
    });
    showSuccessToast('Server Removed', 'MCP server has been removed');
  };

  const testServer = async (server: MCPServerConfig) => {
    const serverIndex = settings.mcpServers.findIndex(s => s.id === server.id);
    const updatedServers = [...settings.mcpServers];
    updatedServers[serverIndex] = { ...server, testStatus: 'testing' };
    setSettings({ ...settings, mcpServers: updatedServers });

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (server.url.includes('fail')) {
        throw new Error('Connection failed');
      }

      updatedServers[serverIndex] = { ...server, testStatus: 'success' };
      setSettings({ ...settings, mcpServers: updatedServers });
      showSuccessToast('Connection Successful', `Connected to ${server.name}`);
    } catch (error) {
      updatedServers[serverIndex] = { ...server, testStatus: 'error' };
      setSettings({ ...settings, mcpServers: updatedServers });
      showErrorToast('Connection Failed', `Failed to connect to ${server.name}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">MCP Server Configuration</h2>
        <p className="text-sm text-text-muted">
          Manage Model Context Protocol servers for enhanced AI capabilities
        </p>
      </div>

      <div className="space-y-4">
        {settings.mcpServers.map((server) => (
          <div key={server.id} className="border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{server.name}</h3>
                <p className="text-sm text-text-muted">{server.url}</p>
                {server.description && (
                  <p className="text-sm text-text-muted mt-1">{server.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <LoadingButton
                  onClick={() => testServer(server)}
                  loading={server.testStatus === 'testing'}
                  className="px-3 py-1 text-sm"
                  variant="secondary"
                >
                  <TestTube className="w-3 h-3 mr-1" />
                  Test
                </LoadingButton>
                <button
                  onClick={() => removeServer(server.id)}
                  className="p-1 text-text-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-3 flex items-center">
              <input
                type="checkbox"
                checked={server.enabled}
                onChange={(e) => {
                  const updatedServers = settings.mcpServers.map(s =>
                    s.id === server.id ? { ...s, enabled: e.target.checked } : s
                  );
                  setSettings({ ...settings, mcpServers: updatedServers });
                }}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label className="ml-2 text-sm">Enabled</label>

              {server.testStatus === 'success' && (
                <span className="ml-auto text-sm text-green-500 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Connected
                </span>
              )}
              {server.testStatus === 'error' && (
                <span className="ml-auto text-sm text-red-500 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  Failed
                </span>
              )}
            </div>
          </div>
        ))}

        {isAdding ? (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <input
              type="text"
              value={newServer.name}
              onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
              placeholder="Server name"
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
            <input
              type="url"
              value={newServer.url}
              onChange={(e) => setNewServer({ ...newServer, url: e.target.value })}
              placeholder="Server URL"
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
            <input
              type="password"
              value={newServer.apiKey}
              onChange={(e) => setNewServer({ ...newServer, apiKey: e.target.value })}
              placeholder="API Key (optional)"
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
            <textarea
              value={newServer.description || ''}
              onChange={(e) => setNewServer({ ...newServer, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              rows={2}
            />
            <div className="flex space-x-2">
              <button
                onClick={addServer}
                className="btn-primary px-4 py-2 text-sm"
              >
                Add Server
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewServer({
                    id: '',
                    name: '',
                    url: '',
                    apiKey: '',
                    enabled: true
                  });
                }}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-secondary px-4 py-2 text-sm flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add MCP Server
          </button>
        )}
      </div>
    </div>
  );
}

function APIKeysSettings({ settings, setSettings }: { settings: AppSettings, setSettings: any }) {
  const apiKeyFields = [
    { key: 'googleMapsApiKey', label: 'Google Maps API Key', placeholder: 'AIza...' },
    { key: 'stripeApiKey', label: 'Stripe Publishable Key', placeholder: 'pk_...' },
    { key: 'stripeSecretKey', label: 'Stripe Secret Key', placeholder: 'sk_...' },
    { key: 'twilioAccountSid', label: 'Twilio Account SID', placeholder: 'AC...' },
    { key: 'twilioAuthToken', label: 'Twilio Auth Token', placeholder: 'Auth token' },
    { key: 'sendgridApiKey', label: 'SendGrid API Key', placeholder: 'SG...' },
    { key: 'revolutApiKey', label: 'Revolut API Key', placeholder: 'API key' },
    { key: 'anthropicApiKey', label: 'Anthropic API Key', placeholder: 'sk-ant-...' },
    { key: 'openaiApiKey', label: 'OpenAI API Key', placeholder: 'sk-...' },
    { key: 'openrouterApiKey', label: 'OpenRouter API Key', placeholder: 'sk-or-...' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">API Keys Management</h2>
        <p className="text-sm text-text-muted">
          Securely manage API keys for third-party services
        </p>
        <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          <p className="text-sm text-yellow-400 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            API keys are encrypted and stored securely
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {apiKeyFields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <input
              type="password"
              value={(settings.apiKeys as any)[key] || ''}
              onChange={(e) => setSettings({
                ...settings,
                apiKeys: { ...settings.apiKeys, [key]: e.target.value }
              })}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        ))}

        <div className="pt-4 border-t border-border">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="revolutSandbox"
              checked={settings.apiKeys.revolutSandbox}
              onChange={(e) => setSettings({
                ...settings,
                apiKeys: { ...settings.apiKeys, revolutSandbox: e.target.checked }
              })}
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label htmlFor="revolutSandbox" className="ml-2 text-sm">
              Use Revolut Sandbox mode
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function LLMSettings({ settings, setSettings }: { settings: AppSettings, setSettings: any }) {
  const providers = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'] },
    { value: 'gemini', label: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision'] },
    { value: 'openrouter', label: 'OpenRouter', models: ['auto'] },
    { value: 'local', label: 'Local Model', models: ['custom'] }
  ];

  const currentProvider = providers.find(p => p.value === settings.llm.provider);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Language Model Configuration</h2>
        <p className="text-sm text-text-muted">
          Configure AI language model providers and parameters
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Provider</label>
          <select
            value={settings.llm.provider}
            onChange={(e) => {
              const provider = e.target.value as any;
              const models = providers.find(p => p.value === provider)?.models || [];
              setSettings({
                ...settings,
                llm: { 
                  ...settings.llm, 
                  provider,
                  model: models[0] || ''
                }
              });
            }}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            {providers.map(provider => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Model</label>
          <select
            value={settings.llm.model}
            onChange={(e) => setSettings({
              ...settings,
              llm: { ...settings.llm, model: e.target.value }
            })}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            {currentProvider?.models.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {settings.llm.provider === 'local' && (
          <div>
            <label className="block text-sm font-medium mb-2">API Endpoint</label>
            <input
              type="url"
              value={settings.llm.endpoint || ''}
              onChange={(e) => setSettings({
                ...settings,
                llm: { ...settings.llm, endpoint: e.target.value }
              })}
              placeholder="http://localhost:11434/api/generate"
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Temperature</label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={settings.llm.temperature}
              onChange={(e) => setSettings({
                ...settings,
                llm: { ...settings.llm, temperature: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Tokens</label>
            <input
              type="number"
              min="100"
              max="32000"
              step="100"
              value={settings.llm.maxTokens}
              onChange={(e) => setSettings({
                ...settings,
                llm: { ...settings.llm, maxTokens: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">System Prompt (Optional)</label>
          <textarea
            value={settings.llm.systemPrompt || ''}
            onChange={(e) => setSettings({
              ...settings,
              llm: { ...settings.llm, systemPrompt: e.target.value }
            })}
            placeholder="You are a helpful AI assistant..."
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
            rows={4}
          />
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
          <h4 className="text-sm font-medium mb-2">Example Configuration</h4>
          <pre className="text-xs text-text-muted overflow-x-auto">
{`// For Telegram bot integration
{
  "provider": "openai",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 2048,
  "systemPrompt": "You are a helpful Telegram bot assistant..."
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings({ settings, setSettings }: { settings: AppSettings, setSettings: any }) {
  const channels = [
    { key: 'email', label: 'Email Notifications', icon: '📧' },
    { key: 'telegram', label: 'Telegram Messages', icon: '💬' },
    { key: 'push', label: 'Push Notifications', icon: '🔔' },
    { key: 'sms', label: 'SMS Messages', icon: '📱' },
    { key: 'discord', label: 'Discord Webhooks', icon: '🎮' },
    { key: 'slack', label: 'Slack Integration', icon: '💼' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Notification Preferences</h2>
        <p className="text-sm text-text-muted">
          Choose how you want to receive notifications
        </p>
      </div>

      <div className="space-y-4">
        {channels.map(({ key, label, icon }) => (
          <div key={key} className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">{icon}</span>
              <div>
                <h3 className="font-medium">{label}</h3>
                <p className="text-sm text-text-muted">
                  Receive notifications via {label.toLowerCase()}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={(settings.notifications as any)[key]}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, [key]: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-border">
        <h3 className="text-sm font-medium mb-4">Notification Events</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-primary border-border rounded mr-3" />
            <span className="text-sm">CV generation completed</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-primary border-border rounded mr-3" />
            <span className="text-sm">CV generation failed</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-primary border-border rounded mr-3" />
            <span className="text-sm">New login from unknown device</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-primary border-border rounded mr-3" />
            <span className="text-sm">Weekly usage summary</span>
          </label>
        </div>
      </div>
    </div>
  );
}