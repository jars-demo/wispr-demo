import {
  Brain,
  Crown,
  Crosshair,
  Flame,
  GitPullRequest,
  Layers,
  Mic,
  Radio,
  ScanSearch,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { BadgeIcon } from '@/domain/game'

// The one line icon set (Lucide). The domain names badge icons; this maps names to drawings.

export const BADGE_ICONS: Record<BadgeIcon, LucideIcon> = {
  scan: ScanSearch,
  target: Crosshair,
  mic: Mic,
  'pull-request': GitPullRequest,
  wrench: Wrench,
  layers: Layers,
  radio: Radio,
  brain: Brain,
  flame: Flame,
  crown: Crown,
}
