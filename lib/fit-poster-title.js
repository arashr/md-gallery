/**
 * Poster title fitting: binary search on pixel font-size using live DOM layout.
 * Titles wrap at word boundaries only (no broken words); size is the largest px
 * that fits the card width and the bounds max-height budget.
 */

function blockHeight(el) {
  return Math.max(el.scrollHeight, el.offsetHeight);
}

function cardInnerWidth(card) {
  const s = getComputedStyle(card);
  const padX = parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
  return Math.max(0, card.clientWidth - padX);
}

/**
 * @param {HTMLElement} link
 */
export function titleHasHorizontalOverflow(link) {
  return link.scrollWidth > link.clientWidth + 1;
}

/**
 * @param {HTMLElement} bounds
 * @param {number} maxHeight
 */
export function titleHasVerticalOverflow(bounds, maxHeight) {
  return blockHeight(bounds) > maxHeight + 1;
}

/**
 * @param {HTMLElement} card
 * @param {HTMLElement} bounds
 * @param {HTMLElement} link
 * @param {number} maxHeight
 * @param {{ minPx: number, maxPx: number }} limits
 */
export function largestTitleFontSizePx(card, bounds, link, maxHeight, limits) {
  const { minPx, maxPx } = limits;
  if (maxPx <= minPx) return minPx;

  const apply = (px) => {
    card.style.setProperty('--poster-title-size', `${px}px`);
    void bounds.offsetHeight;
  };

  const fits = (px) => {
    apply(px);
    return !titleHasHorizontalOverflow(link) && !titleHasVerticalOverflow(bounds, maxHeight);
  };

  apply(minPx);
  if (!fits(minPx)) {
    apply(minPx);
    return minPx;
  }

  if (fits(maxPx)) return maxPx;

  let lo = minPx;
  let hi = maxPx;
  let best = minPx;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  apply(best);
  return best;
}

/**
 * @param {HTMLElement[]} posterEls
 * @param {object} titleScale
 */
export function fitPosterTitles(posterEls, titleScale) {
  const SLACK_MIN_PX = titleScale.slackMinPx ?? 56;
  const B_ASPECT = titleScale.bAspect ?? 353 / 250;
  const TARGET_SLACK_MIN = titleScale.targetSlackMinPx ?? 48;
  const TARGET_SLACK_RATIO = titleScale.targetSlackRatio ?? 0.12;
  const MIN_PX = titleScale.minPx ?? 14;
  const MAX_PX_CAP = titleScale.maxPx ?? 280;
  const MAX_WIDTH_RATIO = titleScale.maxWidthRatio ?? 0.45;
  const TALL_TITLE_HEIGHT_RATIO = titleScale.tallTitleHeightRatio ?? 0.42;

  for (const card of posterEls) {
    card.classList.remove('post-card--roomy');
    card.style.removeProperty('--poster-title-size');
    card.style.removeProperty('--poster-title-max-h');
    card.style.removeProperty('--poster-min-height');
  }

  if (!posterEls.length) return;

  void posterEls[0].offsetHeight;

  for (const card of posterEls) {
    if (card.classList.contains('is-filtered-out')) continue;
    if (!card.className.includes('title-face-')) continue;

    const header = card.querySelector('.post-header');
    const bounds = header?.querySelector('.post-title-bounds');
    const titleEl = header?.querySelector('.post-title');
    const link = titleEl?.querySelector('a');
    const body = card.querySelector('.post-body');
    if (!header || !bounds || !titleEl || !link || !body) continue;

    const innerW = cardInnerWidth(card);
    if (innerW < 48) continue;

    const cardStyle = getComputedStyle(card);
    const padY =
      parseFloat(cardStyle.paddingTop) + parseFloat(cardStyle.paddingBottom);
    const cardW = card.clientWidth;
    if (cardW < 48) continue;

    card.style.setProperty('--poster-title-size', `${MIN_PX}px`);
    void bounds.offsetHeight;

    const headerH = blockHeight(bounds);
    const bodyH = blockHeight(body);
    const bMinInnerH = cardW * B_ASPECT - padY;
    const naturalInnerH = headerH + bodyH;
    const slack = bMinInnerH - naturalInnerH;

    let maxHeight;
    if (slack >= SLACK_MIN_PX) {
      const targetSlack = Math.max(TARGET_SLACK_MIN, bMinInnerH * TARGET_SLACK_RATIO);
      maxHeight = Math.max(64, bMinInnerH - bodyH - targetSlack);
      card.classList.add('post-card--roomy');
      card.style.setProperty(
        '--poster-min-height',
        `${Math.round(bMinInnerH + padY)}px`
      );
    } else {
      maxHeight = Math.max(
        120,
        Math.min(titleScale.tallTitleMaxPx ?? 400, innerW * TALL_TITLE_HEIGHT_RATIO)
      );
    }

    card.style.setProperty('--poster-title-max-h', `${Math.round(maxHeight)}px`);
    void bounds.offsetHeight;

    const maxPx = Math.max(
      MIN_PX + 1,
      Math.min(MAX_PX_CAP, Math.floor(innerW * MAX_WIDTH_RATIO))
    );

    largestTitleFontSizePx(card, bounds, link, maxHeight, {
      minPx: MIN_PX,
      maxPx
    });
  }
}
