import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import styles from './ScrollPicker.module.css';

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const CENTER_OFFSET = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

/**
 * Mobile-style scroll picker. User scrolls to select a value; the centered row is the selection.
 * @param {number[]} options - Array of numeric options (e.g. [5, 10, 15, ...] or [1, 2, 3, ...])
 * @param {number} value - Currently selected value (must be in options)
 * @param {function} onChange - (value: number) => void
 * @param {string} [unit] - Optional unit label shown after value (e.g. 'sec')
 * @param {boolean} [narrow] - If true, compact styling so text fits in ~80px width
 */
export default function ScrollPicker({ options, value, onChange, unit = '', narrow = false }) {
  const scrollRef = useRef(null);
  const isUserScroll = useRef(false);
  const scrollEndTimerRef = useRef(null);

  const valueToIndex = useCallback(
    (v) => {
      const i = options.indexOf(Number(v));
      return i >= 0 ? i : 0;
    },
    [options]
  );

  const indexToScrollTop = useCallback((index) => index * ITEM_HEIGHT, []);

  const scrollTopToIndex = useCallback((scrollTop) => Math.round(scrollTop / ITEM_HEIGHT), []);

  // Initial scroll position on mount
  useLayoutEffect(() => {
    if (!scrollRef.current || options.length === 0) return;
    const index = valueToIndex(value);
    scrollRef.current.scrollTop = indexToScrollTop(index);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync scroll position when value prop changes from parent
  useEffect(() => {
    if (!scrollRef.current || isUserScroll.current) {
      isUserScroll.current = false;
      return;
    }
    const index = valueToIndex(value);
    scrollRef.current.scrollTop = indexToScrollTop(index);
  }, [value, valueToIndex, indexToScrollTop]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const index = scrollTopToIndex(scrollRef.current.scrollTop);
    const clamped = Math.max(0, Math.min(index, options.length - 1));
    const newValue = options[clamped];
    if (Number(newValue) !== Number(value)) {
      onChange(newValue);
    }
  }, [value, options, onChange, scrollTopToIndex]);

  const handleScrollEnd = useCallback(() => {
    if (!scrollRef.current) return;
    const index = scrollTopToIndex(scrollRef.current.scrollTop);
    const clamped = Math.max(0, Math.min(index, options.length - 1));
    const targetScroll = indexToScrollTop(clamped);
    scrollRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    const newValue = options[clamped];
    if (Number(newValue) !== Number(value)) {
      onChange(newValue);
    }
  }, [value, options, onChange, scrollTopToIndex, indexToScrollTop]);

  const scheduleScrollEnd = useCallback(() => {
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = setTimeout(() => {
      handleScrollEnd();
      scrollEndTimerRef.current = null;
    }, 150);
  }, [handleScrollEnd]);

  const currentIndex = valueToIndex(value);

  return (
    <div className={narrow ? `${styles.wrapper} ${styles.wrapperNarrow}` : styles.wrapper}>
      <div className={styles.mask} aria-hidden="true" />
      <div
        ref={scrollRef}
        className={styles.scroll}
        role="listbox"
        aria-label={unit ? `Select ${unit}` : 'Select value'}
        tabIndex={0}
        style={{
          height: CONTAINER_HEIGHT,
          paddingTop: CENTER_OFFSET,
          paddingBottom: CENTER_OFFSET,
        }}
        onScroll={() => {
          isUserScroll.current = true;
          handleScroll();
          scheduleScrollEnd();
        }}
        onBlur={handleScrollEnd}
      >
        {options.map((opt, i) => (
          <div
            key={opt}
            className={styles.item}
            role="option"
            aria-selected={i === currentIndex}
            style={{ height: ITEM_HEIGHT }}
          >
            {opt}
            {unit ? <span className={styles.unit}>{unit}</span> : null}
          </div>
        ))}
      </div>
      <div className={styles.maskBottom} aria-hidden="true" />
    </div>
  );
}
