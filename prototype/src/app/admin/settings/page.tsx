'use client';

import * as React from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ALLOW_SELF_REGISTER } from '@/data/provider';

export default function SettingsPage() {
  const [selfRegister, setSelfRegister] = React.useState(ALLOW_SELF_REGISTER);
  const [waitlist, setWaitlist] = React.useState(true);
  const [quietFrom, setQuietFrom] = React.useState('21:30');
  const [quietTo, setQuietTo] = React.useState('09:00');

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Platform configuration. Editable but non-binding in this prototype.</p>
      </div>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="font-heading text-base">Games</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Player self-registration</p>
              <p className="text-xs text-muted-foreground">Open PRD question — prototype default: enabled (flag ALLOW_SELF_REGISTER).</p>
            </div>
            <Switch checked={selfRegister} onCheckedChange={(c) => setSelfRegister(c === true)} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Waitlist</p>
              <p className="text-xs text-muted-foreground">Show waitlist when full. Auto-promotion is future scope.</p>
            </div>
            <Switch checked={waitlist} onCheckedChange={(c) => setWaitlist(c === true)} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="font-heading text-base">WhatsApp</CardTitle>
          <CardDescription>Cloud API configuration (server-side secrets, not shown in client).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>WABA ID</Label>
              <Input defaultValue="waba_10422••••" className="font-mono" disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Phone number ID</Label>
              <Input defaultValue="pn_88410••••" className="font-mono" disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Quiet hours from</Label>
              <Input type="time" value={quietFrom} onChange={(e) => setQuietFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Quiet hours until</Label>
              <Input type="time" value={quietTo} onChange={(e) => setQuietTo(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Webhook: <Badge className="border-none bg-primary/15 text-primary">verified</Badge>
            Default reminders: <Badge variant="outline">24h + 2h</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl py-0 shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="font-heading text-base">Admin access</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Single admin level in MVP (no sub-roles) — per PRD open question default. Admins: <strong>Dima Organizer</strong>.
          </p>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={() => toast.success('Settings saved (simulated)')}>
        <Save className="size-4" /> Save settings
      </Button>
    </div>
  );
}
