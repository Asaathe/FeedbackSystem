import { useState, useEffect, useRef, ReactNode } from 'react';

/**
 * TransitionContainer - A reusable component for smooth animations in dashboard components
 *
 * Usage Examples:
 *
 * // For expanding content (like accordions, dropdowns)
 * <ExpandableContent isExpanded={isOpen}>
 *   <div>Content that expands smoothly</div>
 * </ExpandableContent>
 *
 * // For fading notifications or messages
 * <FadeContent isVisible={showMessage}>
 *   <div>Message that fades in/out</div>
 * </FadeContent>
 *
 * // For sliding panels or sidebars
 * <SlideContent isVisible={isPanelOpen} direction="right">
 *   <div>Panel content</div>
 * </SlideContent>
 *
 * // Custom transition
 * <TransitionContainer isOpen={isVisible} type="slide" direction="up" duration={500}>
 *   <div>Custom animated content</div>
 * </TransitionContainer>
 */

interface TransitionContainerProps {
  isOpen: boolean;
  children: ReactNode;
  duration?: number;
  className?: string;
  type?: 'fade' | 'slide' | 'expand';
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function TransitionContainer({
  isOpen,
  children,
  duration = 300,
  className = '',
  type = 'expand',
  direction = 'down'
}: TransitionContainerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      // Opening animation
      setShouldRender(true);
      setIsAnimating(true);

      // For expand type, measure content height
      if (type === 'expand' && contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        setHeight(contentHeight);
      }

      // End animation after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        if (type === 'expand') {
          setHeight(undefined); // Remove fixed height after animation
        }
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Closing animation
      setIsAnimating(true);

      // For expand type, set current height before collapsing
      if (type === 'expand' && contentRef.current) {
        const currentHeight = contentRef.current.scrollHeight;
        setHeight(currentHeight);
        // Force reflow
        contentRef.current.offsetHeight;
        setHeight(0);
      }

      // Hide content after animation
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimating(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, type]);

  if (!shouldRender && !isOpen) {
    return null;
  }

  const getTransitionClasses = () => {
    const baseClasses = `transition-all ease-in-out`;
    const durationClass = `duration-${duration}`;

    switch (type) {
      case 'fade':
        return `${baseClasses} ${durationClass} ${isOpen ? 'opacity-100' : 'opacity-0'}`;

      case 'slide':
        const slideDirection = direction === 'up' ? 'translate-y-4' :
                              direction === 'down' ? '-translate-y-4' :
                              direction === 'left' ? 'translate-x-4' :
                              'translate-x-4';
        return `${baseClasses} ${durationClass} ${isOpen ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${slideDirection}`}`;

      case 'expand':
        return `${baseClasses} ${durationClass} overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`;

      default:
        return `${baseClasses} ${durationClass}`;
    }
  };

  const getContainerStyles = () => {
    if (type === 'expand' && height !== undefined) {
      return {
        height: `${height}px`,
        transition: `height ${duration}ms ease-in-out, opacity ${duration}ms ease-in-out`
      };
    }
    return {};
  };

  return (
    <div
      ref={contentRef}
      className={`${getTransitionClasses()} ${className || ''}`}
      style={getContainerStyles()}
    >
      {children}
    </div>
  );
}

// Specialized component for expanding content (like accordions)
interface ExpandableContentProps {
  isExpanded: boolean;
  children: ReactNode;
  duration?: number;
  className?: string;
}

export function ExpandableContent({
  isExpanded,
  children,
  duration = 300,
  className = ''
}: ExpandableContentProps) {
  return (
    <TransitionContainer
      isOpen={isExpanded}
      type="expand"
      duration={duration}
      className={className}
    >
      {children}
    </TransitionContainer>
  );
}

// Specialized component for fading content
interface FadeContentProps {
  isVisible: boolean;
  children: ReactNode;
  duration?: number;
  className?: string;
}

export function FadeContent({
  isVisible,
  children,
  duration = 200,
  className = ''
}: FadeContentProps) {
  return (
    <TransitionContainer
      isOpen={isVisible}
      type="fade"
      duration={duration}
      className={className}
    >
      {children}
    </TransitionContainer>
  );
}

// Specialized component for sliding content
interface SlideContentProps {
  isVisible: boolean;
  children: ReactNode;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function SlideContent({
  isVisible,
  children,
  duration = 300,
  direction = 'down',
  className = ''
}: SlideContentProps) {
  return (
    <TransitionContainer
      isOpen={isVisible}
      type="slide"
      direction={direction}
      duration={duration}
      className={className}
    >
      {children}
    </TransitionContainer>
  );
}