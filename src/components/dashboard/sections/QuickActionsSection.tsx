'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import styles from '../DashboardContent.module.css';
import { QuickAction } from '@/constants/dashboard';

interface QuickActionsSectionProps {
    actions: QuickAction[];
}

export default function QuickActionsSection({ actions }: QuickActionsSectionProps) {
    return (
        <section className={styles.quickActions}>
            <h3>Quick Actions</h3>
            <Droppable droppableId="quickActions">
                {(provided) => (
                    <div
                        className={styles.actionButtons}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {actions.map((action, index) => (
                            <Draggable key={action.id} draggableId={action.id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{ ...provided.draggableProps.style }}
                                        className={`${snapshot.isDragging ? styles.isDraggingItem : ''}`}
                                    >
                                        <a
                                            href={action.href}
                                            className={`neo-btn ${action.variant === 'primary' ? 'neo-btn-primary' : 'neo-btn-secondary'} w-full`}
                                            onClick={(e) => {
                                                if (snapshot.isDragging) e.preventDefault();
                                            }}
                                        >
                                            {action.label}
                                        </a>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </section>
    );
}
