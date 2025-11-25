"use client";

import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Theme</p>
              <ThemeToggle />
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">
              Customize the look and feel of the application.
            </p>
          </CardContent>
        </Card>

        {/* Add more settings cards here as needed */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Account settings will be available here in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;