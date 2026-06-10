export const cn = (...classes: (string | false | null | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
};

export const daysBetween = (date1: string | Date, date2: string | Date): number => {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
};

export const isOverdue = (deadline: string | Date): boolean => {
  return new Date(deadline).getTime() < new Date().getTime();
};

export const getStatusColor = (status: string, variant: 'bg' | 'text' | 'border' = 'bg'): string => {
  const colorMap: Record<string, Record<string, string>> = {
    normal: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    pending: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300' },
    in_progress: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    closed: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
    overdue: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    fault: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    maintenance: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    expired: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    major: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    general: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    minor: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    medium: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    low: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    registered: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    assigned: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300' },
    rectifying: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    pending_review: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  };
  return colorMap[status]?.[variant] || colorMap.normal[variant];
};

export const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-fire-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-violet-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  if (name.length <= 2) return name;
  return name.slice(-2);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const downloadFile = (content: string, filename: string, mimeType: string = 'text/csv'): void => {
  const blob = new Blob(['\ufeff' + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: Record<string, any>[], filename: string): void => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  downloadFile(csvContent, filename, 'text/csv');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
