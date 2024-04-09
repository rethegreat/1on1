"use client";
import Head from "next/head";
import { useEffect, useState } from "react";
import { addDays, startOfWeek, format, parseISO, set } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import './styles.css';

export default function DragAndDrop() {
  const [boxes, setBoxes] = useState([
    { id: 1, top: 10, left: 10 },
    { id: 2, top: 50, left: 50 },
    { id: 3, top: 90, left: 90 }
  ]);
  const [draggingBox, setDraggingBox] = useState(null);

  const handleDragStart = (event, id) => {
    event.dataTransfer.setData('boxId', id);
    setDraggingBox(id);
  };

  const handleDragOver = event => {
    event.preventDefault();
  };

  const handleDrop = event => {
    event.preventDefault();
    const boxId = event.dataTransfer.getData('boxId');
    const index = boxes.findIndex(box => box.id === Number(boxId));
    if (index !== -1) {
      const newBoxes = [...boxes];
      newBoxes[index].top = event.clientY - 25;
      newBoxes[index].left = event.clientX - 25;
      setBoxes(newBoxes);
    }
    setDraggingBox(null);
  };

  return (
    <div className="container" onDragOver={handleDragOver} onDrop={handleDrop}>
      {boxes.map(box => (
        <div
          key={box.id}
          className={`box ${draggingBox === box.id ? 'dragging' : ''}`}
          style={{ top: box.top, left: box.left }}
          draggable
          onDragStart={event => handleDragStart(event, box.id)}
        >
          Box {box.id}
        </div>
      ))}
    </div>
  );
};
