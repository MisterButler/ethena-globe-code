export const observeElementInViewport = (
  element: HTMLElement,
  callback: (intersecting: boolean, entry: IntersectionObserverEntry) => void,
) => {
  if (!element) return
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        callback(entry.isIntersecting, entry)
      })
    },
    { threshold: 0.1 },
  )
  observer.observe(element)
  return observer
}

export const observeElementResize = (element: HTMLElement, callback: (entry: ResizeObserverEntry) => void) => {
  if (!element) return
  const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
      callback(entry)
    })
  })
  resizeObserver.observe(element)
  return resizeObserver
}
