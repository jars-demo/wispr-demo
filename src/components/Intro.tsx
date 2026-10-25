import { LogoMark } from './Logo'

// The intro: the B breaks apart, "Break it down." lands, and the curtain lifts on the site.
// Server-rendered and hidden by default; the inline script below runs before the first paint and
// switches it on, so it never flashes and never waits for JavaScript bundles. It plays once per
// browser session, `?intro=1` forces it (for recording the demo) and `?intro=0` skips it. It
// never plays for reduced motion or automated browsers. A click or any key skips it.

const SCRIPT = `(function () {
  var el = document.getElementById('intro')
  if (!el) return
  var force = null
  try { force = new URLSearchParams(location.search).get('intro') } catch (e) {}
  var seen = false
  try { seen = sessionStorage.getItem('breakdown:intro') === '1' } catch (e) {}
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
  var show = force === '1' || (force !== '0' && !seen && !calm && !navigator.webdriver)
  if (!show) return
  try { sessionStorage.setItem('breakdown:intro', '1') } catch (e) {}
  el.setAttribute('data-state', 'on')
  var done = false
  function finish() {
    if (done) return
    done = true
    el.setAttribute('data-state', 'off')
    if (force) {
      var url = new URL(location.href)
      url.searchParams.delete('intro')
      history.replaceState(history.state, '', url.pathname + url.search + url.hash)
    }
  }
  function skip() {
    if (done) return
    el.setAttribute('data-state', 'leaving')
    setTimeout(finish, 450)
  }
  setTimeout(finish, 2700)
  el.addEventListener('click', skip)
  window.addEventListener('keydown', skip, { once: true })
})()`

export function Intro() {
  return (
    <>
      <div id="intro" className="intro" aria-hidden="true" suppressHydrationWarning>
        <div className="intro-stage">
          <LogoMark size={88} className="intro-mark" />
          <p className="intro-words font-display">
            <span>Break</span> <span>it</span> <span className="text-accent-text">down.</span>
          </p>
          <p className="intro-tag">SHIPPED IT? Now understand it.</p>
        </div>
      </div>
      <script
        type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: SCRIPT }}
      />
    </>
  )
}
