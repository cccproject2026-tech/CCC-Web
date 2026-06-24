export type DashboardFocusItem = {
  id: string;
  title: string;
  description: string;
  meta?: string;
  status?: string;
  href: string;
};

export type DashboardFocusSection = {
  id: string;
  title: string;
  emptyMessage: string;
  items: DashboardFocusItem[];
};
