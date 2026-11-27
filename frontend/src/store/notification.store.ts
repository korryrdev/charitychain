export interface NotificationItem {
  id: string;
  read?: boolean;
  title?: string;
  message?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export type NotificationListener = (items: NotificationItem[]) => void;

export interface NotificationStore {
  get: () => NotificationItem[];
  subscribe: (listener: NotificationListener) => () => void;
  set: (next: NotificationItem[]) => void;
  markRead: (id: string) => void;
}

export function createNotificationStore(): NotificationStore {
  let items: NotificationItem[] = [];
  const listeners = new Set<NotificationListener>();
  const publish = () => listeners.forEach((listener) => listener(items));
  return Object.freeze({
    get: () => items,
    subscribe(listener: NotificationListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next: NotificationItem[]) {
      items = [...next];
      publish();
    },
    markRead(id: string) {
      items = items.map((item) => (item.id === id ? { ...item, read: true } : item));
      publish();
    },
  });
}

export const notificationStore: NotificationStore = createNotificationStore();
