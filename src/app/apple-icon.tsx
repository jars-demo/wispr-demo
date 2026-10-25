import { ImageResponse } from 'next/og'

// iOS home-screen icon. iOS rounds the corners itself, so the mark fills a square here.

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#141412"/><path d="M15 15h19l-4 14-15 4Z" fill="#FBF8F1"/><path d="M37 15h12v20l-15-4Z" fill="#FBF8F1"/><path d="M15 36l15-4 4 17H15Z" fill="#FBF8F1"/><path d="M38 37l14 3v12H40Z" fill="#FF5A1F"/></svg>`

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
