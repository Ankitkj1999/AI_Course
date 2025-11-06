import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { serverURL } from "@/constants";

interface SettingValue {
  value: string;
  category: string;
  isSecret: boolean;
}

interface Settings {
  [key: string]: SettingValue;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${serverURL}/api/admin/settings`, {
        withCredentials: true,
      });
      setSettings(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      await axios.put(
        `${serverURL}/api/admin/settings/${key}`,
        { value },
        { withCredentials: true }
      );

      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: { ...prev[key], value: prev[key].isSecret ? '••••••••' : value }
      }));

      toast({
        title: "Success",
        description: `${key} updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${key}`,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSettingsByCategory = (category: string) => {
    return Object.entries(settings).filter(([_, setting]) => setting.category === category);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        </div>
        <div>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
      </div>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {getSettingsByCategory('ai').map(([key, setting]) => (
            <SettingField
              key={key}
              settingKey={key}
              setting={setting}
              onUpdate={updateSetting}
              saving={saving === key}
              showSecret={showSecrets[key]}
              onToggleSecret={() => toggleSecretVisibility(key)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {getSettingsByCategory('email').map(([key, setting]) => (
            <SettingField
              key={key}
              settingKey={key}
              setting={setting}
              onUpdate={updateSetting}
              saving={saving === key}
              showSecret={showSecrets[key]}
              onToggleSecret={() => toggleSecretVisibility(key)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Social Login */}
      <Card>
        <CardHeader>
          <CardTitle>Social Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Login */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="google-enabled" className="text-base font-medium">
                Google Login
              </Label>
              <Switch
                id="google-enabled"
                checked={settings.GOOGLE_LOGIN_ENABLED?.value === 'true'}
                onCheckedChange={(checked) => updateSetting('GOOGLE_LOGIN_ENABLED', checked ? 'true' : 'false')}
                disabled={saving === 'GOOGLE_LOGIN_ENABLED'}
              />
            </div>
            {settings.GOOGLE_LOGIN_ENABLED?.value === 'true' && (
              <SettingField
                settingKey="GOOGLE_CLIENT_ID"
                setting={settings.GOOGLE_CLIENT_ID}
                onUpdate={updateSetting}
                saving={saving === 'GOOGLE_CLIENT_ID'}
                showSecret={showSecrets.GOOGLE_CLIENT_ID}
                onToggleSecret={() => toggleSecretVisibility('GOOGLE_CLIENT_ID')}
              />
            )}
          </div>

          {/* Facebook Login */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="facebook-enabled" className="text-base font-medium">
                Facebook Login
              </Label>
              <Switch
                id="facebook-enabled"
                checked={settings.FACEBOOK_LOGIN_ENABLED?.value === 'true'}
                onCheckedChange={(checked) => updateSetting('FACEBOOK_LOGIN_ENABLED', checked ? 'true' : 'false')}
                disabled={saving === 'FACEBOOK_LOGIN_ENABLED'}
              />
            </div>
            {settings.FACEBOOK_LOGIN_ENABLED?.value === 'true' && (
              <SettingField
                settingKey="FACEBOOK_CLIENT_ID"
                setting={settings.FACEBOOK_CLIENT_ID}
                onUpdate={updateSetting}
                saving={saving === 'FACEBOOK_CLIENT_ID'}
                showSecret={showSecrets.FACEBOOK_CLIENT_ID}
                onToggleSecret={() => toggleSecretVisibility('FACEBOOK_CLIENT_ID')}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {getSettingsByCategory('branding').map(([key, setting]) => (
            <SettingField
              key={key}
              settingKey={key}
              setting={setting}
              onUpdate={updateSetting}
              saving={saving === key}
              showSecret={showSecrets[key]}
              onToggleSecret={() => toggleSecretVisibility(key)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

interface SettingFieldProps {
  settingKey: string;
  setting: SettingValue;
  onUpdate: (key: string, value: string) => void;
  saving: boolean;
  showSecret: boolean;
  onToggleSecret: () => void;
}

const SettingField: React.FC<SettingFieldProps> = ({
  settingKey,
  setting,
  onUpdate,
  saving,
  showSecret,
  onToggleSecret,
}) => {
  const [value, setValue] = useState(setting.value);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setValue(setting.value);
    setHasChanged(false);
  }, [setting.value]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setHasChanged(newValue !== setting.value);
  };

  const handleSave = () => {
    onUpdate(settingKey, value);
    setHasChanged(false);
  };

  const displayValue = setting.isSecret && !showSecret ? '••••••••' : value;

  return (
    <div className="space-y-2">
      <Label htmlFor={settingKey}>{settingKey.replace('_', ' ')}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={settingKey}
            type={setting.isSecret && !showSecret ? "password" : "text"}
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${settingKey.toLowerCase()}`}
          />
          {setting.isSecret && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={onToggleSecret}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanged || saving}
          size="sm"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;