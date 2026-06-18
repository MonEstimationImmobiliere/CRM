import { computed, onBeforeMount, onBeforeUnmount, readonly, ref } from 'vue';

/** Breakpoints (px) — kept as constants so CSS media queries can mirror them */
export const BP = {
  mobile: 768, // ≤ 768px  → smartphone
  tablet: 1024, // ≤ 1024px → tablet / small laptop
  sidebar: 992, // ≤ 992px  → sidebar collapses (preserves original behaviour)
} as const;

/**
 * Composable for device/breakpoint detection.
 *
 * Usage:
 *   const { isMobile, isTablet, isDesktop, isCompact, isTouchDevice, breakpoint } = useDeviceBreakpoints();
 *
 * Breakpoints:
 *   isMobile  — ≤ 768 px  (smartphone)
 *   isTablet  — 769–1024 px
 *   isDesktop — > 1024 px
 *   isCompact — ≤ 992 px  (sidebar hidden; mirrors original WIDTH = 992)
 */
export default function useDeviceBreakpoints() {
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);

  const isTouchDevice = ref(
    typeof window !== 'undefined' ? navigator.maxTouchPoints > 0 || 'ontouchstart' in window : false
  );

  const isMobile = computed(() => windowWidth.value <= BP.mobile);
  const isTablet = computed(() => windowWidth.value > BP.mobile && windowWidth.value <= BP.tablet);
  const isDesktop = computed(() => windowWidth.value > BP.tablet);
  /** ≤ 992 px — sidebar collapses on compact screens (tablet + mobile) */
  const isCompact = computed(() => windowWidth.value <= BP.sidebar);

  const breakpoint = computed<'mobile' | 'tablet' | 'desktop'>(() => {
    if (isMobile.value) return 'mobile';
    if (isTablet.value) return 'tablet';
    return 'desktop';
  });

  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  function handleResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      windowWidth.value = window.innerWidth;
    }, 100);
  }

  onBeforeMount(() => {
    windowWidth.value = window.innerWidth;
    isTouchDevice.value = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    window.addEventListener('resize', handleResize, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (resizeTimer) clearTimeout(resizeTimer);
  });

  return {
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop),
    isCompact: readonly(isCompact),
    isTouchDevice: readonly(isTouchDevice),
    breakpoint: readonly(breakpoint),
    windowWidth: readonly(windowWidth),
  };
}
