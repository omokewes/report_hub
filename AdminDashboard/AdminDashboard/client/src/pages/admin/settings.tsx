import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Shield, 
  Bell, 
  Plug,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("organization");

  return (
    <div className="p-8">
      <Header
        title="Organization Settings"
        description="Configure your organization's preferences and security settings"
      />

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b p-1">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="organization" className="flex items-center gap-2" data-testid="tab-organization">
                <Building2 className="h-4 w-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2" data-testid="tab-security">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2" data-testid="tab-notifications">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2" data-testid="tab-integrations">
                <Plug className="h-4 w-4" />
                Integrations
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="organization" className="p-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Organization Details</h3>
              </div>
              
              <form className="space-y-6" data-testid="form-organization">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input 
                    id="org-name" 
                    defaultValue="Acme Corporation" 
                    data-testid="input-org-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select defaultValue="technology">
                    <SelectTrigger data-testid="select-industry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="size">Organization Size</Label>
                  <Select defaultValue="51-200">
                    <SelectTrigger data-testid="select-org-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-1000">201-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" data-testid="button-save-organization">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="security" className="p-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Security Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Require all users to enable 2FA</p>
                  </div>
                  <Switch defaultChecked={false} data-testid="switch-2fa" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="min-password">Minimum Password Length</Label>
                    <Input 
                      id="min-password" 
                      type="number" 
                      defaultValue="8" 
                      data-testid="input-min-password"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                    <Input 
                      id="session-timeout" 
                      type="number" 
                      defaultValue="24" 
                      data-testid="input-session-timeout"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <h4 className="font-medium">Allow Guest Access</h4>
                    <p className="text-sm text-muted-foreground">Allow viewing reports without account</p>
                  </div>
                  <Switch defaultChecked={false} data-testid="switch-guest-access" />
                </div>

                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <h4 className="font-medium">Restrict Domain Signup</h4>
                    <p className="text-sm text-muted-foreground">Only allow signups from organization domain</p>
                  </div>
                  <Switch defaultChecked={true} data-testid="switch-domain-restriction" />
                </div>

                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <h4 className="font-medium">Enable Audit Log</h4>
                    <p className="text-sm text-muted-foreground">Track all user actions and changes</p>
                  </div>
                  <Switch defaultChecked={true} data-testid="switch-audit-log" />
                </div>

                <Button data-testid="button-save-security">
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="p-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Notification Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Email Notifications</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Report Shared</p>
                        <p className="text-sm text-muted-foreground">When someone shares a report with you</p>
                      </div>
                      <Switch defaultChecked={true} data-testid="switch-notify-report-shared" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Comment Added</p>
                        <p className="text-sm text-muted-foreground">When someone comments on your reports</p>
                      </div>
                      <Switch defaultChecked={true} data-testid="switch-notify-comment" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">User Joined</p>
                        <p className="text-sm text-muted-foreground">When a new user joins the organization</p>
                      </div>
                      <Switch defaultChecked={true} data-testid="switch-notify-user-joined" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Digest</p>
                        <p className="text-sm text-muted-foreground">Summary of activity in your organization</p>
                      </div>
                      <Switch defaultChecked={true} data-testid="switch-notify-weekly-digest" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Slack Integration</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Slack Notifications</p>
                      <p className="text-sm text-muted-foreground">Send notifications to your Slack workspace</p>
                    </div>
                    <Switch defaultChecked={false} data-testid="switch-slack-notifications" />
                  </div>
                </div>

                <Button data-testid="button-save-notifications">
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="p-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Plug className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Integrations</h3>
              </div>
              
              <div className="space-y-6">
                <Card className="border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">S</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Slack</h4>
                          <p className="text-sm text-muted-foreground">Send notifications to Slack channels</p>
                        </div>
                      </div>
                      <Button data-testid="button-connect-slack">
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">M</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Microsoft Teams</h4>
                          <p className="text-sm text-muted-foreground">Send notifications to Teams channels</p>
                        </div>
                      </div>
                      <Button data-testid="button-connect-teams">
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">W</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Webhooks</h4>
                          <p className="text-sm text-muted-foreground">Send notifications to custom endpoints</p>
                        </div>
                      </div>
                      <Button data-testid="button-configure-webhooks">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
