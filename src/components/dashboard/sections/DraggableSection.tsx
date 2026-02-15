'use client';

import { ReactNode } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import styles from '../DashboardContent.module.css';

interface DraggableSectionProps {
    id: string;
    index: number;
    children: ReactNode;
}

export default function DraggableSection({ id, index, children }: DraggableSectionProps) {
    return (
        <Draggable draggableId={id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`${styles.draggableSection} ${snapshot.isDragging ? styles.isDragging : ''}`}
                    style={{
                        ...provided.draggableProps.style,
                        marginBottom: 'var(--space-lg)'
                    }}
                >
                    <div {...provided.dragHandleProps} className={styles.dragHandle}>
                        ⋮⋮
                    </div>
                    {children}
                </div>
            )}
        </Draggable>
    );
}
