import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PropertyImage({
  src,
  alt,
  className,
  iconSize = 28,
}: {
  src?: string;
  alt: string;
  className?: string;
  iconSize?: number;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-slate-200 via-indigo-50 to-indigo-100 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950/60',
        className,
      )}
    >
      {!failed && src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
          <Building2 size={iconSize} />
        </div>
      )}
    </div>
  );
}
