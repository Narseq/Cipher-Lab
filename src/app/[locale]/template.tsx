import type { ReactNode } from 'react';
import { PageTransition } from '@/components/layout/page-transition';

// A template re-mounts on every navigation, which replays the transition.
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
