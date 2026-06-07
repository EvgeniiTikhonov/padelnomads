export type ApplicationFormValues = {
  level: string;
  preferredSide: string;
  proofOfSkillFileUrl?: string;
  gender?: string;
  referralSource?: string;
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
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'professional', label: 'Professional' },
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
  { value: 'friend', label: 'Friend or player' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'event', label: 'Event or tournament' },
  { value: 'search', label: 'Search engine' },
  { value: 'other', label: 'Other' },
] as const;

export const APPLICATION_FORM_FIELDS: ApplicationFormField[] = [
  {
    name: 'level',
    label: 'Skill level',
    type: 'select',
    required: true,
    hint: 'Select the level that best matches your current padel experience.',
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
