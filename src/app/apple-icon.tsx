import { ImageResponse } from 'next/og'

// iOS home-screen icon. iOS rounds the corners itself, so the mark fills a square here.

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0A0A0A"/><path d="M19.5 11h25a3.5 3.5 0 0 1 3.5 3.5V52l-4-3-4 3-4-3-4 3-4-3-4 3-4-3-4 3V14.5a3.5 3.5 0 0 1 3.5-3.5Z" fill="#FAFAF9"/><rect x="23" y="18" width="18" height="3" rx="1.5" fill="#D6D6D3"/><path d="m23.5 33.5 6 6 11.5-12.5" fill="none" stroke="#FF5A1F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`

export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      width={180}
      height={180}
      src={`data:image/svg+xml;base64,${Buffer.from(MARK).toString('base64')}`}
    />,
    size,
  )
}
