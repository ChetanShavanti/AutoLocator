import { describe, expect, it } from 'vitest';
import { shouldShowRatingPrompt } from '../src/storage/ratingPromptStorage';
import { RATING_PROMPT_MIN_ANALYSES } from '../src/shared/constants';

describe('ratingPromptStorage', () => {
  it('does not show prompt before minimum analyses', () => {
    expect(
      shouldShowRatingPrompt({
        successfulAnalysisCount: RATING_PROMPT_MIN_ANALYSES - 1,
        dismissedPermanently: false,
        markedAsRated: false,
        snoozedUntil: null,
      }),
    ).toBe(false);
  });

  it('shows prompt after enough successful analyses', () => {
    expect(
      shouldShowRatingPrompt({
        successfulAnalysisCount: RATING_PROMPT_MIN_ANALYSES,
        dismissedPermanently: false,
        markedAsRated: false,
        snoozedUntil: null,
      }),
    ).toBe(true);
  });

  it('hides prompt after user marks as rated', () => {
    expect(
      shouldShowRatingPrompt({
        successfulAnalysisCount: 10,
        dismissedPermanently: false,
        markedAsRated: true,
        snoozedUntil: null,
      }),
    ).toBe(false);
  });

  it('hides prompt after permanent dismiss', () => {
    expect(
      shouldShowRatingPrompt({
        successfulAnalysisCount: 10,
        dismissedPermanently: true,
        markedAsRated: false,
        snoozedUntil: null,
      }),
    ).toBe(false);
  });

  it('snoozes prompt until later', () => {
    expect(
      shouldShowRatingPrompt({
        successfulAnalysisCount: 10,
        dismissedPermanently: false,
        markedAsRated: false,
        snoozedUntil: Date.now() + 60_000,
      }),
    ).toBe(false);
  });
});
