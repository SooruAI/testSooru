import { useState, useEffect, useRef } from 'react';

export function useSimpleUndoHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const hasUndoState = currentIndex > 0;
  const isUndoing = useRef(false);
  const isCapturingState = useRef(false);

  const saveState = (state: any) => {
    if (!isUndoing.current && !isCapturingState.current) {
      isCapturingState.current = true;

      const stateCopy = JSON.parse(JSON.stringify(state));
      
      if (currentIndex >= 0 && currentIndex < history.length - 1) {
        setHistory(prev => prev.slice(0, currentIndex + 1));
      }
      
      setHistory(prev => [...prev, stateCopy]);
      setCurrentIndex(prev => prev + 1);
      
      setTimeout(() => {
        isCapturingState.current = false;
      }, 0);
    }
  };
  
  const undo = (applyState: (state: any) => void) => {
    if (currentIndex > 0) {
      isUndoing.current = true;
      
      const newIndex = currentIndex - 1;
      const previousState = history[newIndex];
      
      applyState(previousState);
      
      setCurrentIndex(newIndex);
      
      isUndoing.current = false;
      return true;
    }
    return false;
  };
  
  const clearHistory = () => {
    setHistory([]);
    setCurrentIndex(-1);
  };
  
  return {
    saveState,
    undo,
    clearHistory,
    hasUndoState
  };
}

export function useUndoShortcut(
  undo: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);
}