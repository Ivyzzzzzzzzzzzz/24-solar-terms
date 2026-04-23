import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const RITUAL_IMAGE_FILE_BY_NAME = {
  春饼: '春饼 : Spring pancake copy.svg',
  雨水茶: '雨水茶 : Rain-water tea copy.svg',
  炒豆: 'fried beans copy.svg',
  风筝: 'kite copy.svg',
  青团: '青团 : Qingtuan copy.svg',
  扫墓: 'tomb-sweeping copy.svg',
  采茶: 'tea picking copy.svg',
  斗蛋: 'egg competition copy.svg',
  蚕: 'silkworm copy.svg',
  梅子: 'green plums copy.svg',
  尝新面: 'First-wheat noodles copy.svg',
  团扇: 'round fan copy.svg',
  莲子: 'loyus seeds copy.svg',
  莲叶: 'lotus leaf copy.svg',
  晒伏姜: 'sun-curing ginger copy.svg',
  送大暑船: 'sending off the Major Heat boat copy.svg',
  贴秋膘: 'putting on autumn weight copy.svg',
  鸭: 'duck copy.svg',
  渔网: 'fishing net copy.svg',
  采十样白: 'Gathering "ten whites" copy.svg',
  祭月: 'moon offering copy.svg',
  花糕: 'floral cake copy.svg',
  柿子: 'persimmon copy.svg',
  羊肉火锅: 'mutton hot pot copy.svg',
  肉火锅: 'mutton hot pot copy.svg',
  腊肉: 'cured meat copy.svg',
  红薯: 'roasted sweet potato copy.svg',
  腊八粥: 'laba porridge copy.svg',
  灯笼: 'lattern copy.svg'
};

const getRitualLabel = (text = '') => String(text).split(/[：:]/u)[0].trim();

const getRitualImageUrl = (zhText = '', idx = 0) => {
  const ritualLabel = getRitualLabel(zhText);
  const fileName = RITUAL_IMAGE_FILE_BY_NAME[ritualLabel];
  if (fileName) {
    return `${process.env.PUBLIC_URL}/assets/images/${encodeURIComponent(fileName)}`;
  }
  return `${process.env.PUBLIC_URL}/assets/images/artboard-${(idx % 2) + 1}-2.svg`;
};

const getRenderedLineCount = (element) => {
  if (!element || typeof document === 'undefined') return 1;
  const range = document.createRange();
  range.selectNodeContents(element);
  const rects = Array.from(range.getClientRects())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .sort((a, b) => a.top - b.top);
  range.detach?.();

  const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight)
    || Math.max(...rects.map((rect) => rect.height), 1);
  const lineTolerance = Math.max(3, lineHeight * 0.45);
  const lineTops = [];

  rects.forEach((rect) => {
    const top = rect.top;
    const lastTop = lineTops[lineTops.length - 1];
    if (lastTop === undefined || Math.abs(top - lastTop) > lineTolerance) {
      lineTops.push(top);
    }
  });

  return Math.max(1, lineTops.length);
};

const createMeasurementHost = () => {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
    contain: 'layout style paint',
    zIndex: '-1'
  });
  document.body.appendChild(host);
  return host;
};

const createMeasurementClone = (sourceElement, host) => {
  const clone = sourceElement.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.transition = 'none';
  clone.style.animation = 'none';
  host.appendChild(clone);
  return clone;
};

const TermCenterPanels = ({
  activeMenu,
  content,
  phaseRows,
  termId,
  onContentMouseEnter,
  onContentMouseLeave
}) => {
  const [noteGridColumns, setNoteGridColumns] = useState(null);
  const [poemTranslationWidth, setPoemTranslationWidth] = useState(null);
  const [poemMetaHeight, setPoemMetaHeight] = useState(null);
  const [poemTitleHeight, setPoemTitleHeight] = useState(null);
  const [poemTitleEnWidth, setPoemTitleEnWidth] = useState(null);
  const [poemTitleEnFontSize, setPoemTitleEnFontSize] = useState(null);
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

  const getZhNoWidowParts = (text = '') => {
    const chars = Array.from(String(text).trim());
    if (chars.length <= 2) {
      return {
        head: chars.join(''),
        tail: '',
        hasTail: false
      };
    }

    const normalized = chars.join('');
    const trailingPunctuation = normalized.match(/[，。！？；：、,.!?;:）】》」』”’]+$/u)?.[0] || '';
    const punctuationCount = Array.from(trailingPunctuation).length;
    const keepCount = Math.min(chars.length, 2 + punctuationCount);
    if (chars.length <= keepCount) {
      return {
        head: chars.join(''),
        tail: '',
        hasTail: false
      };
    }

    return {
      head: chars.slice(0, -keepCount).join(''),
      tail: chars.slice(-keepCount).join(''),
      hasTail: true
    };
  };

  const renderZhNoWidowText = (text = '') => {
    const { head, tail, hasTail } = getZhNoWidowParts(text);
    if (!hasTail) return head;
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

  const getRitualCopyWidth = (zhText = '', enText = '') => {
    const zhLen = Array.from(String(zhText)).length;
    const enLen = Array.from(String(enText)).length;
    const weightedLen = enLen + zhLen * 1.3;
    const minLen = 88;
    const maxLen = 140;
    const normalized = Math.max(0, Math.min(1, (weightedLen - minLen) / (maxLen - minLen)));
    const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth || 1280;
    const wideScreenBoost = viewportWidth >= 2560
      ? 58
      : viewportWidth >= 1920
        ? 34
        : viewportWidth >= 1440
          ? 18
          : 0;
    const minWidth = 238 + wideScreenBoost;
    const maxWidth = 288 + wideScreenBoost;
    return Math.round(minWidth + normalized * (maxWidth - minWidth));
  };

  const noteZhLines = Array.isArray(content.noteZh) ? content.noteZh : [];
  const noteEnLines = Array.isArray(content.noteEn) ? content.noteEn : [];
  const noteZhText = noteZhLines.join('');
  const noteEnText = noteEnLines.join(' ');
  const ritualNotesEn = useMemo(
    () => (Array.isArray(content.ritualNotes) ? content.ritualNotes : []),
    [content.ritualNotes]
  );
  const ritualNotesZh = useMemo(
    () => (Array.isArray(content.ritualNotesZh) ? content.ritualNotesZh : ritualNotesEn),
    [content.ritualNotesZh, ritualNotesEn]
  );
  const ritualCount = Math.max(ritualNotesEn.length, ritualNotesZh.length, 1);
  const ritualIndices = Array.from({ length: ritualCount }, (_, idx) => idx);
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

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let frameId = 0;
    const measurePoemLayout = () => {
        let measurementHost = null;

        const getMeasurementHost = () => {
          if (!measurementHost) measurementHost = createMeasurementHost();
          return measurementHost;
        };

        const zhMetaEl = poemZhMetaRef.current;
        const zhTitleEl = poemZhTitleRef.current;
        const zhVerseEl = poemZhVerseRef.current;
        const enNoteEl = poemEnNoteRef.current;
        const enTitleEl = poemEnTitleRef.current;
        const enTranslationEl = poemEnTranslationRef.current;
        if (!zhMetaEl || !zhTitleEl || !zhVerseEl || !enNoteEl || !enTranslationEl) return;

        try {
          const zhMetaHeight = Math.ceil(zhMetaEl.getBoundingClientRect().height);
          if (zhMetaHeight) {
            setPoemMetaHeight((prev) => (prev === zhMetaHeight ? prev : zhMetaHeight));
          }

          const zhTitleHeight = Math.ceil(zhTitleEl.getBoundingClientRect().height);
          if (zhTitleHeight) {
            setPoemTitleHeight((prev) => (prev === zhTitleHeight ? prev : zhTitleHeight));
          }

          if (enTitleEl) {
            const poemPanelEl = enTitleEl.closest('.term-poem');
            const poemPanelStyle = poemPanelEl ? window.getComputedStyle(poemPanelEl) : null;
            const parentWidth = Math.floor(enTitleEl.parentElement?.clientWidth || enNoteEl.clientWidth);
            const maxWidth = Math.max(0, parentWidth);
            if (maxWidth > 0) {
              const zhLineCount = getRenderedLineCount(zhTitleEl);
              const parsedPanelMaxWidth = parseFloat(poemPanelStyle?.maxWidth || '');
              const panelMaxWidth = Number.isFinite(parsedPanelMaxWidth)
                ? parsedPanelMaxWidth
                : Math.min(840, window.innerWidth - 220);
              const panelPaddingX = (parseFloat(poemPanelStyle?.paddingLeft || '0') || 0)
                + (parseFloat(poemPanelStyle?.paddingRight || '0') || 0);
              const panelColumnGap = parseFloat(poemPanelStyle?.columnGap || poemPanelStyle?.gap || '16') || 16;
              const zhColumnWidth = Math.ceil(poemPanelEl?.querySelector('.term-poem-zh')?.getBoundingClientRect().width || 0);
              const titleMinWidth = Math.max(160, Math.floor(maxWidth * 0.45));
              const titleCapWidth = Math.max(maxWidth, Math.floor(panelMaxWidth - panelPaddingX - panelColumnGap - zhColumnWidth));
              const measureTitleEl = createMeasurementClone(enTitleEl, getMeasurementHost());
              measureTitleEl.style.fontSize = '';
              measureTitleEl.style.minHeight = '0px';
              const baseFontSize = parseFloat(window.getComputedStyle(measureTitleEl).fontSize) || 14;
              const minFontSize = Math.max(9.5, baseFontSize - 4);
              let chosenWidth = maxWidth;
              let chosenFontSize = null;
              let bestMatch = null;
              let bestFallback = null;
              let fallbackWidth = maxWidth;

              for (let fontSize = baseFontSize; fontSize >= minFontSize; fontSize -= 0.25) {
                measureTitleEl.style.fontSize = `${fontSize}px`;

                for (let w = titleMinWidth; w <= titleCapWidth; w += 1) {
                  measureTitleEl.style.width = `${w}px`;
                  measureTitleEl.style.maxWidth = `${w}px`;
                  const enLineCount = getRenderedLineCount(measureTitleEl);
                  const fontLoss = baseFontSize - fontSize;
                  const lineDelta = Math.abs(enLineCount - zhLineCount);
                  const candidate = {
                    width: w,
                    fontSize,
                    enLineCount,
                    score: lineDelta * 100000 + fontLoss * 1000 + w
                  };

                  if (!bestFallback || candidate.score < bestFallback.score) {
                    bestFallback = candidate;
                    fallbackWidth = w;
                  }

                  if (enLineCount === zhLineCount) {
                    const matchScore = fontLoss * 1000 + w;
                    if (!bestMatch || matchScore < bestMatch.score) {
                      bestMatch = {
                        width: w,
                        fontSize,
                        score: matchScore
                      };
                    }
                  }
                }
              }

              const chosen = bestMatch ?? bestFallback;
              chosenWidth = chosen?.width ?? fallbackWidth;
              chosenFontSize = chosen && Math.abs(chosen.fontSize - baseFontSize) >= 0.01
                ? Number(chosen.fontSize.toFixed(2))
                : null;
              setPoemTitleEnWidth((prev) => (prev === chosenWidth ? prev : chosenWidth));
              setPoemTitleEnFontSize((prev) => (prev === chosenFontSize ? prev : chosenFontSize));
            }
          }

          const hasWidowLine = (element) => {
            const textNode = Array.from(element.childNodes)
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
          const measureTranslationEl = createMeasurementClone(enTranslationEl, getMeasurementHost());
          let bestWidth = maxWidth;
          let bestScore = Number.POSITIVE_INFINITY;

          for (let w = maxWidth; w >= minWidth; w -= 2) {
            measureTranslationEl.style.width = `${w}px`;
            const measuredHeight = Math.ceil(measureTranslationEl.getBoundingClientRect().height);
            const widowPenalty = hasWidowLine(measureTranslationEl) ? 1000 : 0;
            const overflow = Math.max(0, measuredHeight - targetHeight);
            const delta = Math.abs(measuredHeight - targetHeight);
            const score = overflow * 10000 + delta + widowPenalty;
            if (score < bestScore || (score === bestScore && w < bestWidth)) {
              bestScore = score;
              bestWidth = w;
            }
          }

          setPoemTranslationWidth((prev) => (prev === bestWidth ? prev : bestWidth));
        } finally {
          measurementHost?.remove();
        }
    };
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measurePoemLayout);
    };

    measurePoemLayout();

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
    <div className={`term-center-content${activeMenu === 'ritual' ? ' is-ritual-active' : ''}`}>
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
          <div
            className="term-poem-note-meta-en"
            style={poemMetaHeight ? { minHeight: `${poemMetaHeight}px`, height: `${poemMetaHeight}px` } : undefined}
          >
            {poemTitleEn && (
              <div
                className="term-poem-note-title-en term-en-content-typestyle"
                ref={poemEnTitleRef}
                style={{
                  ...(poemTitleEnWidth ? { width: `${poemTitleEnWidth}px`, maxWidth: `${poemTitleEnWidth}px` } : {}),
                  ...(poemTitleEnFontSize ? { fontSize: `${poemTitleEnFontSize}px` } : {}),
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
        className={`term-ritual${ritualCount === 1 ? ' is-single' : ''}${termId ? ` term-ritual-${termId}` : ''} ${activeMenu === 'ritual' ? 'is-visible' : ''}`}
        id="termRitualContent"
        aria-hidden={activeMenu !== 'ritual'}
        {...panelHoverProps}
      >
        {ritualIndices.map((idx) => {
          const zhText = ritualNotesZh[idx] || '';
          const enText = ritualNotesEn[idx] || '';
          const ritualCopyWidth = getRitualCopyWidth(zhText, enText);
          const ritualImageUrl = getRitualImageUrl(zhText, idx);

          return (
            <div className="term-ritual-col" key={`ritual-col-${idx}`}>
              <div
                className="term-ritual-artboard"
                style={{ backgroundImage: `url("${ritualImageUrl}")` }}
                aria-hidden="true"
              ></div>
              <div className="term-ritual-copy" style={{ '--ritual-copy-width': `${ritualCopyWidth}px` }}>
                <div className="term-ritual-note">
                  <div className="term-ritual-note-stack">
                    <div className="term-ritual-textbox term-ritual-textbox-zh term-cn-content-typestyle">
                      {renderZhNoWidowText(zhText)}
                    </div>
                    <div className="term-ritual-textbox term-ritual-textbox-en term-en-content-typestyle">
                      {preventWidow(enText)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TermCenterPanels;
