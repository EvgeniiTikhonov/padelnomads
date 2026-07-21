export type ApplicationFormValues = {
  level: string;
  preferredSide: string;
  proofOfSkillFileUrl?: string;
  gender?: string;
  referralSource?: string;
  referrerPhoneNumber?: string;
};

export type ApplicationFieldType = 'select' | 'text' | 'file';

export type ApplicationFormField = {
  name: keyof ApplicationFormValues;
  label: string;
  type: ApplicationFieldType;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  accept?: string;
};

export const PADEL_LEVELS = [
  { value: 'E', label: 'E — Entry' },
  { value: 'D', label: 'D' },
  { value: 'D+', label: 'D+' },
  { value: 'C', label: 'C — Intermediate' },
  { value: 'C Strong', label: 'C Strong' },
  { value: 'C+', label: 'C+' },
  { value: 'B', label: 'B — Advanced' },
  { value: 'B+', label: 'B+' },
  { value: 'A', label: 'A — Pro' },
  { value: 'A+', label: 'A+ — Elite' },
] as const;

export const PREFERRED_SIDES = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'both', label: 'Both' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
] as const;

export const REFERRAL_SOURCES = [
  { value: 'friend', label: 'Friend' },
  { value: 'instagram', label: 'Instagram' },
] as const;

export const FRIEND_REFERRAL_LABEL = REFERRAL_SOURCES[0].label;

export const APPLICATION_FORM_FIELDS: ApplicationFormField[] = [
  {
    name: 'level',
    label: 'Skill level',
    type: 'select',
    required: true,
    hint: 'Select your Viya letter level (E entry → A+ elite).',
    options: [...PADEL_LEVELS],
  },
  {
    name: 'preferredSide',
    label: 'Preferred side',
    type: 'select',
    required: true,
    hint: 'Which side of the court do you usually play on?',
    options: [...PREFERRED_SIDES],
  },
  {
    name: 'gender',
    label: 'Gender',
    type: 'select',
    required: false,
    hint: 'Optional. Helps us balance games and events.',
    options: [...GENDER_OPTIONS],
  },
  {
    name: 'referralSource',
    label: 'How did you hear about us?',
    type: 'select',
    required: false,
    options: [...REFERRAL_SOURCES],
  },
  {
    name: 'proofOfSkillFileUrl',
    label: 'Proof of skill',
    type: 'file',
    required: false,
    hint: 'Optional. Upload a screenshot, ranking, or match result (JPEG, PNG, WebP, or PDF).',
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
  },
];

export const EMPTY_APPLICATION_FORM: ApplicationFormValues = {
  level: '',
  preferredSide: '',
  gender: '',
  referralSource: '',
};
