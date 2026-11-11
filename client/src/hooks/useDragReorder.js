import { useState } from 'react';

// Drag-and-drop reordering for a list (HTML5 drag events — works with a mouse).
// Usage:  const { getItemProps } = useDragReorder(items, (newItems) => save(newItems));
//         <li {...getItemProps(i)}>  — returns draggable + drag handlers + a className for the visual state.
export default function useDragReorder(items, onReorder, { enabled = true, canDrag = () => true } = {}) {
  const [drag, setDrag] = useState(null); // { from, over }

  function finish() {
    if (drag && drag.from !== drag.over) {
      const next = [...items];
      const [moved] = next.splice(drag.from, 1);
      next.splice(drag.over, 0, moved);
      onReorder(next);
    }
    setDrag(null);
  }

  const getItemProps = (i) => {
    if (!enabled || !canDrag(i)) return {};
    let className = '';
    if (drag?.from === i) className = 'dragging';
    else if (drag && drag.over === i && drag.from !== i) className = drag.over < drag.from ? 'drop-above' : 'drop-below';

    return {
      draggable: true,
      className,
      onDragStart: (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(i)); // Firefox needs some data to start a drag
        setDrag({ from: i, over: i });
      },
      onDragOver: (e) => {
        if (!drag) return;
        e.preventDefault(); // allow dropping here
        e.dataTransfer.dropEffect = 'move';
        if (drag.over !== i) setDrag({ ...drag, over: i });
      },
      onDrop: (e) => { e.preventDefault(); finish(); },
      onDragEnd: () => setDrag(null),
    };
  };

  return { getItemProps, dragging: drag !== null };
}
