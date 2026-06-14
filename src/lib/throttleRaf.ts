export type ThrottledRaf<A extends unknown[]> = ((...args: A) => void) & {
  cancel: () => void;
};

export function throttleRaf<A extends unknown[]>(
  fn: (...args: A) => void
): ThrottledRaf<A> {
  let rafId: number | undefined;
  let pendingArgs: A | null = null;

  const invoke = () => {
    rafId = undefined;
    if (pendingArgs === null) return;
    const args = pendingArgs;
    pendingArgs = null;
    fn(...args);
  };

  function throttled(...args: A) {
    pendingArgs = args;
    if (rafId === undefined) {
      rafId = requestAnimationFrame(invoke);
    }
  }

  throttled.cancel = () => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }
    pendingArgs = null;
  };

  return throttled as ThrottledRaf<A>;
}
