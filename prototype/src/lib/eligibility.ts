import { LEVELS, type Game, type Gender, type Level, type User } from '@/types';

/** Higher index = stronger level. */
export function levelRank(level: Level): number {
  return LEVELS.indexOf(level);
}

/**
 * Player may join if the game is mixed-level, or their level is ≥ the game level
 * (higher-rated players can play down; they cannot join a higher required level).
 */
export function canJoinByLevel(player: User, game: Game): boolean {
  if (game.level === 'mixed') return true;
  return levelRank(player.level) >= levelRank(game.level);
}

/**
 * Men-only / ladies-only games block the opposite gender.
 * Mixed (open) and unset are open. Mixed-pairs (man+woman teams) still needs
 * a binary gender on the player so they can form a valid pair.
 * Players without a gender can only join open mixed.
 */
export function canJoinByGender(player: User, game: Game): boolean {
  const restriction = game.genderRestriction;
  if (!restriction || restriction === 'mixed') return true;
  if (restriction === 'mixed_pairs') {
    return isBinaryGender(player.gender);
  }
  if (!player.gender || player.gender === 'prefer_not_to_say' || player.gender === 'non_binary') {
    return false;
  }
  return player.gender === restriction;
}

/**
 * Mixed-only formats need one man + one woman per team.
 * Driven by the game's genderRestriction (or legacy King & Queen default).
 */
export function requiresMixedGenderPair(game: Game): boolean {
  if (game.genderRestriction === 'mixed_pairs') return true;
  // Legacy: King & Queen without an explicit restriction is mixed-pairs.
  if (game.format === 'king_queen_of_the_court' && (!game.genderRestriction || game.genderRestriction === 'mixed')) {
    return true;
  }
  return false;
}

export function isBinaryGender(g?: Gender): g is 'male' | 'female' {
  return g === 'male' || g === 'female';
}

/** True when the two players form a valid man+woman pair. */
export function isValidMixedGenderPair(a?: Gender, b?: Gender): boolean {
  if (!isBinaryGender(a) || !isBinaryGender(b)) return false;
  return a !== b;
}

export type EligibilityBlock =
  | { ok: true }
  | { ok: false; reason: string };

export function gameJoinEligibility(player: User, game: Game): EligibilityBlock {
  if (!canJoinByLevel(player, game)) {
    return {
      ok: false,
      reason: `This game is ${game.level} — your level (${player.level}) is too low to join.`,
    };
  }
  if (!canJoinByGender(player, game)) {
    if (game.genderRestriction === 'male') {
      return { ok: false, reason: 'This game is men only.' };
    }
    if (game.genderRestriction === 'female') {
      return { ok: false, reason: 'This game is ladies only.' };
    }
    return { ok: false, reason: 'Gender restriction blocks registration for this game.' };
  }
  if (requiresMixedGenderPair(game) && !isBinaryGender(player.gender)) {
    return {
      ok: false,
      reason: 'This game needs a binary gender on your profile (male or female) to form mixed teams.',
    };
  }
  return { ok: true };
}

/** Partner / join-request eligibility for fixed mixed-gender formats. */
export function partnerPairEligibility(
  player: User,
  partner: User,
  game: Game,
): EligibilityBlock {
  const self = gameJoinEligibility(player, game);
  if (!self.ok) return self;
  const other = gameJoinEligibility(partner, game);
  if (!other.ok) {
    return { ok: false, reason: `${partner.name.split(' ')[0]} can't join this game (${other.reason})` };
  }
  if (requiresMixedGenderPair(game) && !isValidMixedGenderPair(player.gender, partner.gender)) {
    return {
      ok: false,
      reason: 'Teams must be one man and one woman for this game.',
    };
  }
  return { ok: true };
}

export function timeSlotOf(startTime: string): 'morning' | 'afternoon' | 'evening' {
  const hour = Number(startTime.slice(0, 2));
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
