import React, { useEffect, useRef, useState } from 'react';

const TermCenterPanels = ({
  activeMenu,
  content,
  phaseRows,
  onContentMouseEnter,
  onContentMouseLeave
}) => {
  const [noteGridColumns, setNoteGridColumns] = useState(null);
  const [poemTranslationWidth, setPoemTranslationWidth] = useState(null);
  const [poemMetaHeight, setPoemMetaHeight] = useState(null);
  const [poemTitleHeight, setPoemTitleHeight] = useState(null);
  const [poemTitleEnWidth, setPoemTitleEnWidth] = useState(null);
  const notePanelRef = useRef(null);
  const noteZhRef = useRef(null);
  const noteEnTextRef = useRef(null);
  const poemZhMetaRef = useRef(null);
  const poemZhTitleRef = useRef(null);
  const poemZhVerseRef = useRef(null);
  const poemEnNoteRef = useRef(null);
  const poemEnTitleRef = useRef(null);
  const poemEnTranslationRef = useRef(null);

  const preventWidow = (text = '') => {
    const normalized = String(text).trim().replace(/\s+/g, ' ');
    return normalized.replace(/\s+([^\s]+)\s*$/, '\u00A0$1');
  };

  const splitPoemZhLines = (text = '') => {
    const normalized = String(text).replace(/\s+/g, '').trim();
    if (!normalized) return [];
    const chunks = normalized.match(/[^，。！？；]+[，。！？；]?/gu);
    return (chunks || [normalized]).map((line) => line.trim()).filter(Boolean);
  };

  const renderZhNoWidow = (text = '') => {
    const chars = Array.from(String(text).trim());
    if (chars.length <= 2) return chars.join('');
    const head = chars.slice(0, -2).join('');
    const tail = chars.slice(-2).join('');
    return (
      <>
        {head}
        <span className="term-poem-title-no-widow">{tail}</span>
      </>
    );
  };

  const renderZhNoWidowText = (text = '') => {
    const chars = Array.from(String(text).trim());
    if (chars.length <= 2) return chars.join('');
    const normalized = chars.join('');
    const trailingPunctuation = normalized.match(/[，。！？；：、,.!?;:）】》」』”’]+$/u)?.[0] || '';
    const punctuationCount = Array.from(trailingPunctuation).length;
    const keepCount = Math.min(chars.length, 2 + punctuationCount);
    if (chars.length <= keepCount) return chars.join('');
    const head = chars.slice(0, -keepCount).join('');
    const tail = chars.slice(-keepCount).join('');
    return (
      <>
        {head}
        <span className="term-no-widow">{tail}</span>
      </>
    );
  };

  const renderLines = (lines = [], keyPrefix) => (
    lines.map((line, idx) => (
      <React.Fragment key={`${keyPrefix}-${idx}`}>
        {line}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    ))
  );

  const noteZhLines = Array.isArray(content.noteZh) ? content.noteZh : [];
  const noteEnLines = Array.isArray(content.noteEn) ? content.noteEn : [];
  const noteZhText = noteZhLines.join('');
  const noteEnText = noteEnLines.join(' ');
  const ritualNotesEn = Array.isArray(content.ritualNotes) ? content.ritualNotes : [];
  const ritualNotesZh = Array.isArray(content.ritualNotesZh) ? content.ritualNotesZh : ritualNotesEn;
  const poemZhLines = splitPoemZhLines(content.poemVerse);
  const poemTitleZh = String(content.poemTitle || '').replace(/[《》]/g, '').trim();
  const poemAuthorEn = String(content.poemAuthorEn || '').trim();
  const poemTitleEn = preventWidow(String(content.poemTitleEn || '').trim());
  const poemNoteEn = preventWidow(content.poemNote || '');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let frameId = 0;
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const panelEl = notePanelRef.current;
        const zhEl = noteZhRef.current;
        const enEl = noteEnTextRef.current;
        if (!panelEl || !zhEl || !enEl) return;

        if (window.matchMedia('(max-width: 760px)').matches) {
          setNoteGridColumns((prev) => (prev === null ? prev : null));
          return;
        }

        const style = window.getComputedStyle(panelEl);
        const gap = parseFloat(style.columnGap || style.gap || '14') || 14;
        const availableWidth = Math.floor(panelEl.clientWidth - gap);
        if (availableWidth <= 240) return;

        const hasEnglishWidow = () => {
          const textNode = Array.from(enEl.childNodes)
            .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
          if (!textNode) return false;

          const text = textNode.textContent || '';
          const wordRegex = /\S+/g;
          const lineTops = [];
          let match;

          while ((match = wordRegex.exec(text))) {
            const range = document.createRange();
            range.setStart(textNode, match.index);
            range.setEnd(textNode, match.index + match[0].length);
            const rect = range.getBoundingClientRect();
            if (rect.height > 0) lineTops.push(Math.round(rect.top));
            range.detach?.();
          }

          if (lineTops.length < 2) return false;
          const lastTop = lineTops[lineTops.length - 1];
          let wordsOnLastLine = 0;
          for (let i = lineTops.length - 1; i >= 0; i -= 1) {
            if (lineTops[i] !== lastTop) break;
            wordsOnLastLine += 1;
          }
          return wordsOnLastLine <= 1;
        };

        const hasChineseWidow = () => {
          const textNode = Array.from(zhEl.childNodes)
            .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
          if (!textNode) return false;

          const text = textNode.textContent || '';
          const tokenRegex = /[^\s]/gu;
          const lineTokens = [];
          let match;

          while ((match = tokenRegex.exec(text))) {
            const token = match[0];
            const range = document.createRange();
            range.setStart(textNode, match.index);
            range.setEnd(textNode, match.index + token.length);
            const rect = range.getBoundingClientRect();
            if (rect.height > 0) {
              lineTokens.push({
                top: Math.round(rect.top),
                token
              });
            }
            range.detach?.();
          }

          if (lineTokens.length < 2) return false;
          const lastTop = lineTokens[lineTokens.length - 1].top;
          const lastLineTokens = lineTokens.filter((item) => item.top === lastTop);
          const countableChars = lastLineTokens.filter((item) => /[A-Za-z0-9\u3400-\u9FFF]/u.test(item.token)).length;
          return countableChars <= 1;
        };

        const minZhWidth = Math.max(160, Math.floor(availableWidth * 0.45));
        const maxZhWidth = Math.min(Math.floor(availableWidth * 0.78), availableWidth - 120);
        const prevGridTemplateColumns = panelEl.style.gridTemplateColumns;

        let bestZhWidth = Math.floor(availableWidth * 0.56);
        let bestEnWidth = availableWidth - bestZhWidth;
        let bestScore = Number.POSITIVE_INFINITY;

        for (let zhWidth = maxZhWidth; zhWidth >= minZhWidth; zhWidth -= 2) {
          const enWidth = availableWidth - zhWidth;
          if (enWidth < 120) continue;

          panelEl.style.gridTemplateColumns = `${zhWidth}px ${enWidth}px`;
          const zhWidowPenalty = hasChineseWidow() ? 10000 : 0;
          const enWidowPenalty = hasEnglishWidow() ? 10000 : 0;
          const zhHeight = Math.ceil(zhEl.getBoundingClientRect().height);
          const enHeight = Math.ceil(enEl.getBoundingClientRect().height);
          const heightDelta = Math.abs(zhHeight - enHeight);
          const score = zhWidowPenalty + enWidowPenalty + heightDelta;

          if (score < bestScore || (score === bestScore && zhWidth > bestZhWidth)) {
            bestScore = score;
            bestZhWidth = zhWidth;
            bestEnWidth = enWidth;
          }
        }

        panelEl.style.gridTemplateColumns = prevGridTemplateColumns;
        setNoteGridColumns((prev) => (
          prev && prev.zh === bestZhWidth && prev.en === bestEnWidth
            ? prev
            : { zh: bestZhWidth, en: bestEnWidth }
        ));
      });
    };

    scheduleMeasure();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      if (notePanelRef.current) resizeObserver.observe(notePanelRef.current);
      if (noteZhRef.current) resizeObserver.observe(noteZhRef.current);
      if (noteEnTextRef.current) resizeObserver.observe(noteEnTextRef.current);
    }

    window.addEventListener('resize', scheduleMeasure);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver?.disconnect();
    };
  }, [activeMenu, noteZhText, noteEnText]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let frameId = 0;
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const zhMetaEl = poemZhMetaRef.current;
        const zhTitleEl = poemZhTitleRef.current;
        const zhVerseEl = poemZhVerseRef.current;
        const enNoteEl = poemEnNoteRef.current;
        const enTitleEl = poemEnTitleRef.current;
        const enTranslationEl = poemEnTranslationRef.current;
        if (!zhMetaEl || !zhTitleEl || !zhVerseEl || !enNoteEl || !enTranslationEl) return;

        const zhMetaHeight = Math.ceil(zhMetaEl.getBoundingClientRect().height);
        if (zhMetaHeight) {
          setPoemMetaHeight((prev) => (prev === zhMetaHeight ? prev : zhMetaHeight));
        }

        const zhTitleHeight = Math.ceil(zhTitleEl.getBoundingClientRect().height);
        if (zhTitleHeight) {
          setPoemTitleHeight((prev) => (prev === zhTitleHeight ? prev : zhTitleHeight));
        }

        if (enTitleEl) {
          const parentWidth = Math.floor(enTitleEl.parentElement?.clientWidth || enNoteEl.clientWidth);
          const maxWidth = Math.max(0, parentWidth);
          if (maxWidth > 0) {
            const zhLineHeight = parseFloat(window.getComputedStyle(zhTitleEl).lineHeight) || 1;
            const zhLineCount = Math.max(1, Math.round(zhTitleHeight / zhLineHeight));
            const panelMaxWidth = Math.min(840, window.innerWidth - 220);
            const titleMinWidth = Math.max(160, Math.floor(maxWidth * 0.45));
            const titleCapWidth = Math.max(
              maxWidth,
              Math.floor(panelMaxWidth - 220)
            );
            const prevTitleWidth = enTitleEl.style.width;
            const prevTitleMaxWidth = enTitleEl.style.maxWidth;
            let chosenWidth = maxWidth;
            let bestWidth = null;
            let bestLineCount = 0;
            let fallbackWidth = maxWidth;
            let fallbackLineCount = Number.POSITIVE_INFINITY;

            for (let w = titleMinWidth; w <= titleCapWidth; w += 2) {
              enTitleEl.style.width = `${w}px`;
              enTitleEl.style.maxWidth = `${w}px`;
              const measuredHeight = Math.ceil(enTitleEl.getBoundingClientRect().height);
              const enLineHeight = parseFloat(window.getComputedStyle(enTitleEl).lineHeight) || 1;
              const enLineCount = Math.max(1, Math.round(measuredHeight / enLineHeight));

              if (
                enLineCount < fallbackLineCount ||
                (enLineCount === fallbackLineCount && w > fallbackWidth)
              ) {
                fallbackLineCount = enLineCount;
                fallbackWidth = w;
              }

              if (enLineCount <= zhLineCount) {
                if (
                  enLineCount > bestLineCount ||
                  (enLineCount === bestLineCount && (bestWidth === null || w < bestWidth))
                ) {
                  bestLineCount = enLineCount;
                  bestWidth = w;
                }
              }
            }
            chosenWidth = bestWidth ?? fallbackWidth;
            enTitleEl.style.width = prevTitleWidth;
            enTitleEl.style.maxWidth = prevTitleMaxWidth;
            setPoemTitleEnWidth((prev) => (prev === chosenWidth ? prev : chosenWidth));
          }
        }

        const hasWidowLine = () => {
          const textNode = Array.from(enTranslationEl.childNodes)
            .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
          if (!textNode) return false;

          const text = textNode.textContent || '';
          const wordRegex = /\S+/g;
          const lineTops = [];
          let match;

          while ((match = wordRegex.exec(text))) {
            const range = document.createRange();
            range.setStart(textNode, match.index);
            range.setEnd(textNode, match.index + match[0].length);
            const rect = range.getBoundingClientRect();
            if (rect.height > 0) lineTops.push(Math.round(rect.top));
            range.detach?.();
          }

          if (lineTops.length < 2) return false;
          const lastTop = lineTops[lineTops.length - 1];
          let wordsOnLastLine = 0;
          for (let i = lineTops.length - 1; i >= 0; i -= 1) {
            if (lineTops[i] !== lastTop) break;
            wordsOnLastLine += 1;
          }
          return wordsOnLastLine <= 1;
        };

        const targetHeight = zhVerseEl.getBoundingClientRect().height;
        const currentWidth = Math.floor(enNoteEl.clientWidth);
        if (!targetHeight || !currentWidth) return;

        const poemPanelEl = enTranslationEl.closest('.term-poem');
        const panelWidth = Math.floor(poemPanelEl?.getBoundingClientRect().width || 0);
        const panelMaxWidth = Math.min(840, window.innerWidth - 220);
        const nonTranslationWidth = Math.max(0, panelWidth - currentWidth);
        const maxWidth = Math.max(
          currentWidth,
          Math.floor(panelMaxWidth - nonTranslationWidth)
        );
        const minWidth = Math.min(300, maxWidth);
        const prevInlineWidth = enTranslationEl.style.width;
        let bestWidth = maxWidth;
        let bestScore = Number.POSITIVE_INFINITY;

        for (let w = maxWidth; w >= minWidth; w -= 2) {
          enTranslationEl.style.width = `${w}px`;
          const measuredHeight = Math.ceil(enTranslationEl.getBoundingClientRect().height);
          const widowPenalty = hasWidowLine() ? 1000 : 0;
          const overflow = Math.max(0, measuredHeight - targetHeight);
          const delta = Math.abs(measuredHeight - targetHeight);
          const score = overflow * 10000 + delta + widowPenalty;
          if (score < bestScore || (score === bestScore && w < bestWidth)) {
            bestScore = score;
            bestWidth = w;
          }
        }

        enTranslationEl.style.width = prevInlineWidth;
        setPoemTranslationWidth((prev) => (prev === bestWidth ? prev : bestWidth));
      });
    };

    scheduleMeasure();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      if (poemZhMetaRef.current) resizeObserver.observe(poemZhMetaRef.current);
      if (poemZhTitleRef.current) resizeObserver.observe(poemZhTitleRef.current);
      if (poemZhVerseRef.current) resizeObserver.observe(poemZhVerseRef.current);
      if (poemEnNoteRef.current) resizeObserver.observe(poemEnNoteRef.current);
      if (poemEnTitleRef.current) resizeObserver.observe(poemEnTitleRef.current);
    }

    window.addEventListener('resize', scheduleMeasure);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver?.disconnect();
    };
  }, [activeMenu, poemNoteEn, content.poemVerse, poemAuthorEn, poemTitleEn, poemTitleZh]);

  const panelHoverProps = {
    onMouseEnter: onContentMouseEnter,
    onMouseLeave: onContentMouseLeave
  };

  return (
    <div className="term-center-content">
      <div
        className={`term-note ${activeMenu === 'note' ? 'is-visible' : ''}`}
        id="termNoteContent"
        aria-hidden={activeMenu !== 'note'}
        ref={notePanelRef}
        style={noteGridColumns ? { gridTemplateColumns: `${noteGridColumns.zh}px ${noteGridColumns.en}px` } : undefined}
        {...panelHoverProps}
      >
        <div className="term-note-zh term-cn-content-typestyle" ref={noteZhRef}>{noteZhText}</div>
        <div className="term-note-en">
          <span className="term-note-en-text term-en-content-typestyle" ref={noteEnTextRef}>
            {noteEnText}
          </span>
        </div>
      </div>

      <div
        className={`term-phases ${activeMenu === 'phases' ? 'is-visible' : ''}`}
        id="termPhasesContent"
        aria-hidden={activeMenu !== 'phases'}
        {...panelHoverProps}
      >
        {phaseRows.slice(0, 3).map((phase, index) => (
          <div
            key={`phase-row-${index}`}
            className={`term-phases-row term-phases-row-${index + 1}`}
            tabIndex={0}
          >
            <div className="term-phases-row-inner">
              <div className="term-phases-cell term-phases-cell-zh">
                <div className="term-phases-zh term-cn-content-typestyle">{String(phase.zh || '').trim()}</div>
              </div>
              <div className="term-phases-cell term-phases-cell-en">
                <div className="term-phases-en term-en-content-typestyle">{preventWidow(phase.en || '')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`term-poem ${activeMenu === 'poem' ? 'is-visible' : ''}`}
        id="termPoemContent"
        aria-hidden={activeMenu !== 'poem'}
        {...panelHoverProps}
      >
        <div className="term-poem-zh">
          <div className="term-poem-zh-meta" ref={poemZhMetaRef}>
            <div className="term-poem-title term-cn-content-typestyle" ref={poemZhTitleRef}>{renderZhNoWidow(poemTitleZh)}</div>
            <div className="term-poem-author term-cn-content-typestyle">{content.poemAuthor}</div>
          </div>
          <div className="term-poem-verse term-cn-content-typestyle" ref={poemZhVerseRef}>{renderLines(poemZhLines, 'poem-zh')}</div>
        </div>
        <div className="term-poem-note" ref={poemEnNoteRef}>
          <div className="term-poem-note-meta-en" style={poemMetaHeight ? { minHeight: `${poemMetaHeight}px` } : undefined}>
            {poemTitleEn && (
              <div
                className="term-poem-note-title-en term-en-content-typestyle"
                ref={poemEnTitleRef}
                style={{
                  ...(poemTitleEnWidth ? { width: `${poemTitleEnWidth}px`, maxWidth: `${poemTitleEnWidth}px` } : {}),
                  ...(poemTitleHeight ? { minHeight: `${poemTitleHeight}px` } : {})
                }}
              >
                {poemTitleEn}
              </div>
            )}
            {poemAuthorEn && <div className="term-poem-note-author-en term-en-content-typestyle">{poemAuthorEn}</div>}
          </div>
          <div
            className="term-poem-note-translation term-en-content-typestyle"
            ref={poemEnTranslationRef}
            style={poemTranslationWidth ? { width: `${poemTranslationWidth}px` } : undefined}
          >
            {poemNoteEn}
          </div>
        </div>
      </div>

      <div
        className={`term-ritual ${activeMenu === 'ritual' ? 'is-visible' : ''}`}
        id="termRitualContent"
        aria-hidden={activeMenu !== 'ritual'}
        {...panelHoverProps}
      >
        {[0, 1].map((idx) => (
          <div className="term-ritual-col" key={`ritual-col-${idx}`}>
            <div
              className="term-ritual-artboard"
              style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/artboard-${idx + 1}-2.svg)` }}
              aria-hidden="true"
            ></div>
            <div className="term-ritual-copy">
              <div className="term-ritual-note term-ritual-note-combined">
                <div className="term-ritual-note-line term-ritual-note-line-zh term-cn-content-typestyle">
                  {renderZhNoWidowText(ritualNotesZh[idx] || '')}
                </div>
                <div className="term-ritual-note-line term-ritual-note-line-en term-en-content-typestyle">
                  {preventWidow(ritualNotesEn[idx] || '')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermCenterPanels;
