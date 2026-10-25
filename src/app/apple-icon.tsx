import { ImageResponse } from 'next/og'

import { markDataUri } from '@/components/logo-mark'

// iOS home-screen icon. iOS rounds the corners itself, so the mark fills a square here.

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" width={180} height={180} src={markDataUri({ rounded: false })} />,
    size,
  )
}
