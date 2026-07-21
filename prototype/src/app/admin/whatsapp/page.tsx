'use client';

import * as React from 'react';
import { Send, MessageCircle, Inbox as InboxIcon, CheckCheck, Reply } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useMockData } from '@/data/provider';
import { formatDateTime, timeAgo } from '@/lib/format';

const STATUS_TONE: Record<string, string> = {
  queued: 'bg-white/10 text-white/60',
  sent: 'bg-blue-500/15 text-blue-300',
  delivered: 'bg-teal-100 text-teal-700',
  read: 'bg-primary/15 text-primary',
  failed: 'bg-red-500/15 text-red-300',
  dropped: 'bg-orange-100 text-orange-700',
};

const APPROVAL_TONE: Record<string, string> = {
  approved: 'bg-primary/15 text-primary',
  pending: 'bg-amber-500/15 text-amber-300',
  rejected: 'bg-red-500/15 text-red-300',
  draft: 'bg-white/10 text-white/60',
};

export default function WhatsAppPage() {
  const { templates, outbound, inbound, users } = useMockData();
  const [audience, setAudience] = React.useState<string | null>('All opted-in players');
  const [templateId, setTemplateId] = React.useState<string | null>('t1');
  const [preview, setPreview] = React.useState('');

  const userName = (id?: string) => (id ? users.find((u) => u.id === id)?.name : undefined);
  const counts = ['queued', 'sent', 'delivered', 'read', 'failed', 'dropped'].map((s) => ({
    status: s, count: outbound.filter((m) => m.status === s).length,
  }));
  const optedIn = users.filter((u) => u.role === 'player' && u.status === 'approved' && u.whatsappOptIn).length;
  const optedOut = users.filter((u) => u.role === 'player' && u.whatsappOptOutAt).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold">WhatsApp / Communications</h1>
          <p className="text-sm text-muted-foreground">
            Templates, broadcasts, delivery and inbound replies. Stub console — nothing is really sent.
          </p>
        </div>
        <Badge variant="outline">Cloud API · +971 4X XXX XXXX</Badge>
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="flex-wrap">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="inbound">Inbound ({inbound.filter((m) => !m.handled).length})</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
        </TabsList>

        {/* Template registry */}
        <TabsContent value="templates" className="pt-3">
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Template</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Body</TableHead>
                    <TableHead className="pr-4">Meta approval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">{t.metaTemplateName}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{t.category}</Badge></TableCell>
                      <TableCell className="max-w-72">
                        <p className="truncate text-xs text-muted-foreground">{t.bodyText}</p>
                        {t.buttons && <p className="text-[10px] text-muted-foreground/70">Buttons: {t.buttons.join(' · ')}</p>}
                      </TableCell>
                      <TableCell className="pr-4">
                        <Badge className={`border-none capitalize ${APPROVAL_TONE[t.approvalStatus]}`}>{t.approvalStatus}</Badge>
                        {t.rejectionReason && <p className="mt-0.5 max-w-52 text-[10px] text-red-600">{t.rejectionReason}</p>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broadcast composer */}
        <TabsContent value="broadcast" className="pt-3">
          <Card className="max-w-xl rounded-2xl py-0 shadow-sm">
            <CardHeader className="p-4 pb-0"><CardTitle className="font-heading text-base">Compose broadcast</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as string)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All opted-in players">All opted-in players ({optedIn})</SelectItem>
                    <SelectItem value="B+ and A players">Segment: B+ and A players</SelectItem>
                    <SelectItem value="Active last 30 days">Segment: Active last 30 days</SelectItem>
                    <SelectItem value="Tuesday Americano roster">Game roster: Tuesday Americano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Template</Label>
                <Select value={templateId} onValueChange={(v) => setTemplateId(v as string)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {templates.filter((t) => t.approvalStatus === 'approved').map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.metaTemplateName} ({t.category})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Variable preview</Label>
                <Textarea
                  value={preview || templates.find((t) => t.id === templateId)?.bodyText.replace('{{1}}', 'Maria').replace('{{2}}', 'Tuesday Americano').replace('{{3}}', 'tomorrow').replace('{{4}}', '19:00').replace('{{5}}', 'Padel Point') || ''}
                  onChange={(e) => setPreview(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => toast.success('Broadcast queued (simulated)', { description: `${audience} · template ${templates.find((t) => t.id === templateId)?.metaTemplateName}` })}>
                  <Send className="size-4" /> Send now
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => toast('Broadcast scheduled (simulated)', { description: 'Tomorrow 10:00 — respects quiet hours.' })}>
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery dashboard */}
        <TabsContent value="delivery" className="space-y-3 pt-3">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {counts.map((c) => (
              <Card key={c.status} className="rounded-xl py-0">
                <CardContent className="p-3 text-center">
                  <p className="font-heading text-xl font-bold">{c.count}</p>
                  <Badge className={`border-none capitalize ${STATUS_TONE[c.status]}`}>{c.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4">Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outbound.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="pl-4">
                        <p className="text-sm font-medium">{userName(m.userId) ?? m.userId}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{m.phoneNumberUsed}</p>
                      </TableCell>
                      <TableCell className="max-w-72"><p className="truncate text-xs text-muted-foreground">{m.payload}</p></TableCell>
                      <TableCell>
                        <Badge className={`border-none capitalize ${STATUS_TONE[m.status]}`}>{m.status}</Badge>
                        {m.errorDetail && <p className="mt-0.5 max-w-48 text-[10px] text-red-600">{m.errorCode}: {m.errorDetail}</p>}
                      </TableCell>
                      <TableCell className="pr-4 text-xs whitespace-nowrap text-muted-foreground">
                        {m.sentAt ? formatDateTime(m.sentAt) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inbound inbox */}
        <TabsContent value="inbound" className="pt-3">
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardContent className="divide-y p-0">
              {inbound.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${m.handled ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    {m.type === 'button_reply' ? <CheckCheck className="size-4" /> : <InboxIcon className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {userName(m.userId) ?? m.fromPhone}
                      {m.type === 'button_reply' && <Badge variant="secondary" className="ml-2">button: {m.body}</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.type === 'button_reply' ? m.buttonPayload : m.body}</p>
                    <p className="text-[10px] text-muted-foreground/70">{timeAgo(m.receivedAt)}</p>
                  </div>
                  {m.handled ? (
                    <Badge variant="outline">Handled</Badge>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => toast('Reply sent (simulated)', { description: 'Free-form service message inside the 24h window.' })}>
                        <Reply className="size-3.5" /> Reply
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toast('Marked handled')}>Dismiss</Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consent manager */}
        <TabsContent value="consent" className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: 'Service opted-in', value: optedIn },
              { label: 'Marketing opted-in', value: users.filter((u) => u.role === 'player' && u.whatsappMarketingOptIn).length },
              { label: 'Opted out (STOP)', value: optedOut },
            ].map((s) => (
              <Card key={s.label} className="rounded-xl py-0">
                <CardContent className="p-3 text-center">
                  <p className="font-heading text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="rounded-2xl py-0 shadow-sm">
            <CardContent className="divide-y p-0">
              {users.filter((u) => u.role === 'player').slice(0, 12).map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2 p-3.5 text-sm">
                  <span className="font-medium">{u.name}</span>
                  <span className="flex gap-1.5">
                    <Badge className={`border-none ${u.whatsappOptIn ? 'bg-primary/15 text-primary' : 'bg-red-500/15 text-red-300'}`}>
                      <MessageCircle className="size-3" /> service {u.whatsappOptIn ? 'on' : 'off'}
                    </Badge>
                    <Badge className={`border-none ${u.whatsappMarketingOptIn ? 'bg-primary/15 text-primary' : 'bg-white/10 text-white/60'}`}>
                      marketing {u.whatsappMarketingOptIn ? 'on' : 'off'}
                    </Badge>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
