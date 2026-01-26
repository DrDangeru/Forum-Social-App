import { useEffect } from 'react';

export function useDropdownAutoClose(
  containerRef: React.RefObject<HTMLElement>,
  isOpen: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const el = containerRef.current;
      const target = event.target as Node | null;

      if (!el || !target) return;
      if (el.contains(target)) return;

      onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [containerRef, isOpen, onClose]);
}
