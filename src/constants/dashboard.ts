export interface QuickAction {
    id: string;
    label: string;
    href: string;
    icon: string; // emoji or icon name
    variant: 'primary' | 'secondary';
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
    { id: 'action-todo', label: '📋 Tambah To-Do', href: '/dashboard/todos', icon: '', variant: 'primary' },
    { id: 'action-dream', label: '✨ Tambah Dream', href: '/dashboard/dreams', icon: '', variant: 'secondary' },
    { id: 'action-goal', label: '🎯 Tambah Goal', href: '/dashboard/goals', icon: '', variant: 'secondary' },
    { id: 'action-habit', label: '✅ Tambah Habit', href: '/dashboard/habits', icon: '', variant: 'secondary' },
];
