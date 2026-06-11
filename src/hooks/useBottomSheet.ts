import { useRef, useState, useEffect, useCallback, useMemo } from "react";

type SnapPoint = "peek" | "half" | "full";

const SNAP_HEIGHTS: Record<SnapPoint, number> = {
  peek: 33,
  half: 55,
  full: 90,
};

// Minimum downward drag (in vh) past peek to trigger dismiss
const DISMISS_THRESHOLD = 10;
// Velocity threshold (vh/ms) for flick gestures
const VELOCITY_THRESHOLD = 0.3;

interface UseBottomSheetOptions {
  onDismiss: () => void;
  initialSnap?: SnapPoint;
}

export default function useBottomSheet({
  onDismiss,
  initialSnap = "peek",
}: UseBottomSheetOptions) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(initialSnap);
  const [isDragging, setIsDragging] = useState(false);

  // Track drag state without re-renders
  const dragState = useRef({
    active: false,
    startY: 0,
    startTranslateY: 0,
    currentTranslateY: 0,
    startTime: 0,
    lastY: 0,
    lastTime: 0,
  });

  // Convert snap point to translateY value
  // Sheet is 90vh tall, positioned at bottom. translateY controls how much is hidden.
  // translateY = 0 means full 90vh visible. translateY = (90-35)vh = 55vh means peek.
  const snapToTranslateVh = useCallback((snap: SnapPoint): number => {
    return SNAP_HEIGHTS.full - SNAP_HEIGHTS[snap];
  }, []);

  const translateVhForSnap = useMemo(
    () => snapToTranslateVh(currentSnap),
    [currentSnap, snapToTranslateVh]
  );

  // Apply transform without state update (during drag)
  const applyTransform = useCallback(
    (translateVh: number, transition: boolean) => {
      const el = sheetRef.current;
      if (!el) return;
      el.style.transition = transition
        ? "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        : "none";
      el.style.transform = `translateY(${translateVh}vh)`;
    },
    []
  );

  // Snap to a specific point with animation
  const snapTo = useCallback(
    (snap: SnapPoint) => {
      setCurrentSnap(snap);
      applyTransform(snapToTranslateVh(snap), true);
    },
    [applyTransform, snapToTranslateVh]
  );

  // Determine nearest snap point from a translateY value (in vh)
  const findNearestSnap = useCallback(
    (translateVh: number): SnapPoint | "dismiss" => {
      // If dragged below peek + threshold, dismiss
      const peekTranslate = snapToTranslateVh("peek");
      if (translateVh > peekTranslate + DISMISS_THRESHOLD) {
        return "dismiss";
      }

      // Find the closest snap point
      let closest: SnapPoint = "peek";
      let closestDist = Infinity;
      for (const snap of ["peek", "half", "full"] as SnapPoint[]) {
        const dist = Math.abs(translateVh - snapToTranslateVh(snap));
        if (dist < closestDist) {
          closestDist = dist;
          closest = snap;
        }
      }
      return closest;
    },
    [snapToTranslateVh]
  );

  // Touch handlers
  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentTranslate = snapToTranslateVh(currentSnap);
      dragState.current = {
        active: true,
        startY: touch.clientY,
        startTranslateY: currentTranslate,
        currentTranslateY: currentTranslate,
        startTime: Date.now(),
        lastY: touch.clientY,
        lastTime: Date.now(),
      };
      setIsDragging(true);
      applyTransform(currentTranslate, false);
    },
    [currentSnap, snapToTranslateVh, applyTransform]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragState.current.active) return;
      e.preventDefault();

      const touch = e.touches[0];
      const deltaY = touch.clientY - dragState.current.startY;
      // Convert pixel delta to vh
      const deltaVh = (deltaY / window.innerHeight) * 100;
      // New translate: positive = sheet moves down
      const newTranslate = Math.max(
        0,
        dragState.current.startTranslateY + deltaVh
      );

      dragState.current.currentTranslateY = newTranslate;
      dragState.current.lastY = touch.clientY;
      dragState.current.lastTime = Date.now();

      requestAnimationFrame(() => {
        applyTransform(newTranslate, false);
      });
    },
    [applyTransform]
  );

  const onTouchEnd = useCallback(() => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    setIsDragging(false);

    const { currentTranslateY, startTranslateY, startTime } = dragState.current;
    const elapsed = Date.now() - startTime;
    const deltaVh = currentTranslateY - startTranslateY;
    const velocity = elapsed > 0 ? deltaVh / elapsed : 0;

    // Flick gesture detection
    if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
      if (velocity > 0) {
        // Flicking down
        const peekTranslate = snapToTranslateVh("peek");
        if (currentTranslateY > peekTranslate - 5) {
          // Already near or below peek — dismiss
          applyTransform(100, true);
          setTimeout(onDismiss, 300);
          return;
        }
        // Snap to next lower point
        if (currentSnap === "full") {
          snapTo("half");
        } else {
          snapTo("peek");
        }
      } else {
        // Flicking up — snap to next higher point
        if (currentSnap === "peek") {
          snapTo("half");
        } else {
          snapTo("full");
        }
      }
      return;
    }

    // No flick — snap to nearest
    const target = findNearestSnap(currentTranslateY);
    if (target === "dismiss") {
      applyTransform(100, true);
      setTimeout(onDismiss, 300);
    } else {
      snapTo(target);
    }
  }, [
    currentSnap,
    snapToTranslateVh,
    applyTransform,
    findNearestSnap,
    snapTo,
    onDismiss,
  ]);

  // Attach touch listeners to the drag handle
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    handle.addEventListener("touchstart", onTouchStart, { passive: true });
    handle.addEventListener("touchmove", onTouchMove, { passive: false });
    handle.addEventListener("touchend", onTouchEnd);

    return () => {
      handle.removeEventListener("touchstart", onTouchStart);
      handle.removeEventListener("touchmove", onTouchMove);
      handle.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  // After the CSS entrance animation finishes, set the inline transform
  // so the hook owns positioning from this point forward.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    const onAnimationEnd = () => {
      applyTransform(snapToTranslateVh(initialSnap), false);
      setCurrentSnap(initialSnap);
    };

    el.addEventListener("animationend", onAnimationEnd, { once: true });
    return () => el.removeEventListener("animationend", onAnimationEnd);
  }, [initialSnap, applyTransform, snapToTranslateVh]);

  return {
    sheetRef,
    handleRef,
    isDragging,
    currentSnap,
    translateVhForSnap,
  };
}
