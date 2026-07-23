'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useMockData } from '@/data/provider';
import { SUPPORT_CATEGORY_LABELS } from '@/lib/format';
import type { PlayerPhoneNumber, SupportRequestCategory } from '@/types';

const CATEGORIES = Object.keys(SUPPORT_CATEGORY_LABELS) as SupportRequestCategory[];

function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.trim());
}

/** Prefer primary mobile, then any primary, then any registered number. */
function registeredPhoneFor(userId: string, phones: PlayerPhoneNumber[]): string {
  const mine = phones.filter((p) => p.userId === userId);
  const primaryMobile = mine.find((p) => p.isPrimary && p.label === 'mobile');
  if (primaryMobile) return primaryMobile.phoneNumber;
  const primary = mine.find((p) => p.isPrimary);
  if (primary) return primary.phoneNumber;
  const mobile = mine.find((p) => p.label === 'mobile');
  if (mobile) return mobile.phoneNumber;
  return mine[0]?.phoneNumber ?? '';
}

export function SupportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { phones, currentUser, submitSupportRequest } = useMockData();
  const registeredPhone = registeredPhoneFor(currentUser.id, phones);

  const [category, setCategory] = React.useState<SupportRequestCategory>('other');
  const [issue, setIssue] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState(registeredPhone);
  const [formKey, setFormKey] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    setCategory('other');
    setIssue('');
    setContactPhone(registeredPhone);
    setFormKey((k) => k + 1);
  }, [open, registeredPhone, currentUser.id]);

  const canSubmit = issue.trim().length >= 8 && isValidE164(contactPhone);

  const submit = () => {
    if (!canSubmit) return;
    submitSupportRequest({ issue, contactPhone, category });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact support</DialogTitle>
          <DialogDescription>
            Tell us what you need help with. An admin will contact you soon — we don’t have live chat yet.
          </DialogDescription>
        </DialogHeader>

        <div key={formKey} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-category">Topic</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                if (v) setCategory(v as SupportRequestCategory);
              }}
            >
              <SelectTrigger id="support-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{SUPPORT_CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-issue">What’s the issue?</Label>
            <Textarea
              id="support-issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Briefly describe what went wrong and what you need…"
              className="min-h-24"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-phone">Contact number</Label>
            <Input
              id="support-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder={registeredPhone || '+9715…'}
              className="h-11 font-mono"
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">
              {registeredPhone
                ? 'Prefilled with your registered phone number. Change it only if we should reach you elsewhere.'
                : 'Enter the number we should use to reach you (E.164, e.g. +9715…).'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>Send to admin</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
