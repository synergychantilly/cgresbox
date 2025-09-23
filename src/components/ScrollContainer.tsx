import React, { useState, useEffect, useRef } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  showScrollbar?: boolean;
  showIndicators?: boolean;
}

export default function ScrollContainer({ 
  children, 
  className = '', 
  showScrollbar = false,
  showIndicators = true 
}: ScrollContainerProps) {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setCanScrollUp(scrollTop > 5); // Small threshold to avoid flicker
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 5);
  };

  const scrollToTop = () => {
    if (!scrollRef.current) return;
    
    // Add visual feedback
    setIsScrolling(true);
    
    scrollRef.current.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Reset scrolling state after animation
    setTimeout(() => {
      setIsScrolling(false);
    }, 600);
  };

  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    
    // Add visual feedback
    setIsScrolling(true);
    
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
    
    // Reset scrolling state after animation
    setTimeout(() => {
      setIsScrolling(false);
    }, 600);
  };

  const handleScroll = () => {
    checkScrollability();
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Hide scrolling state after 1 second of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    // Initial check with a small delay to ensure content is rendered
    const initialCheck = () => {
      setTimeout(checkScrollability, 100);
    };
    initialCheck();

    // Add scroll listener
    scrollElement.addEventListener('scroll', handleScroll);
    
    // Check on resize and content changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkScrollability, 50);
    });
    resizeObserver.observe(scrollElement);

    // Also observe children changes
    const mutationObserver = new MutationObserver(() => {
      setTimeout(checkScrollability, 50);
    });
    mutationObserver.observe(scrollElement, { 
      childList: true, 
      subtree: true,
      attributes: true 
    });

    // Cleanup
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollbarClass = showScrollbar ? 'custom-scrollbar' : 'scrollbar-hidden';

  return (
    <div className="relative h-full">
      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={`h-full overflow-y-auto ${scrollbarClass} ${className}`}
      >
        {children}
      </div>

      {/* Top scroll indicator */}
      {showIndicators && canScrollUp && (
        <div className="absolute top-2 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <button
            onClick={scrollToTop}
            className="scroll-indicator bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 group pointer-events-auto"
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ChevronUpIcon className="h-4 w-4 group-hover:animate-bounce" />
          </button>
        </div>
      )}

      {/* Bottom scroll indicator */}
      {showIndicators && canScrollDown && (
        <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <button
            onClick={scrollToBottom}
            className="scroll-indicator bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 group pointer-events-auto"
            title="Scroll to bottom"
            aria-label="Scroll to bottom"
          >
            <ChevronDownIcon className="h-4 w-4 group-hover:animate-bounce" />
          </button>
        </div>
      )}

      {/* Temporary scrollbar during scrolling */}
      {!showScrollbar && isScrolling && (
        <div className="absolute right-1 top-2 bottom-2 w-1 bg-gray-300 opacity-60 rounded-full transition-opacity duration-300 z-10" />
      )}
    </div>
  );
}
