import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for scroll-triggered animations using IntersectionObserver.
 * @param {Object} options
 * @param {number} options.threshold - Visibility threshold (0-1), default 0.15
 * @param {string} options.rootMargin - Margin around root, default "0px 0px -60px 0px"
 * @param {boolean} options.triggerOnce - Only trigger once, default true
 * @returns {{ ref: React.RefObject, isVisible: boolean }}
 */
export const useScrollAnimation = ({
  threshold = 0.15,
  rootMargin = "0px 0px -60px 0px",
  triggerOnce = true,
} = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
};

/**
 * Hook to apply staggered animations to child elements.
 * @param {number} itemCount - Number of items to animate
 * @param {number} staggerDelay - Delay between each item in ms, default 120
 */
export const useStaggerAnimation = (itemCount, staggerDelay = 120) => {
  const containerRef = useRef(null);
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const items = [];
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems((prev) => [...prev, i]);
            }, i * staggerDelay);
          }
          observer.unobserve(container);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(container);

    return () => {
      if (container) observer.unobserve(container);
    };
  }, [itemCount, staggerDelay]);

  return { containerRef, visibleItems };
};

export default useScrollAnimation;
