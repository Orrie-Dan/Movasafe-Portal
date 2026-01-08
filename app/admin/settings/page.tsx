'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Shield, Mail, Plug, Flag } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-background">
      <PageHeader
        title="System Settings"
        description="Configure system-wide settings and preferences"
      />

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-100 dark:bg-slate-900">
              <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Settings className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="integrations" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Plug className="h-4 w-4 mr-2" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Flag className="h-4 w-4 mr-2" />
                Features
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure basic system settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Escrow Commission Percentage</label>
                      <p className="text-xs text-muted-foreground">Default commission rate charged on escrow transactions (e.g., 5.0 for 5%)</p>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        defaultValue="5.0"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="5.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Central Account ID</label>
                      <p className="text-xs text-muted-foreground">Wallet ID where commission payments are deposited</p>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Enter wallet ID"
                      />
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security policies and authentication</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Security settings configuration coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="mt-6">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>Configure email server and templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Email configuration coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Third-party Integrations</CardTitle>
                  <CardDescription>Manage external service integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Integration management coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="mt-6">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>Enable or disable system features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Feature flag management coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
