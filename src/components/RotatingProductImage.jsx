import { useEffect, useMemo, useState } from 'react'

const ROTATION_INTERVAL = 5000

function normalizeImages(imageUrl, additionalImages) {
  const sources = []

  if (imageUrl) {
    sources.push(imageUrl)
  }

  if (Array.isArray(additionalImages)) {
    additionalImages.forEach((entry) => {
      if (typeof entry === 'string' && entry.trim()) {
        sources.push(entry.trim())
      }
    })
  } else if (typeof additionalImages === 'string') {
    additionalImages
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => sources.push(entry))
  }

  return sources.filter((source, index, all) => source && all.indexOf(source) === index)
}

export default function RotatingProductImage({ imageUrl, additionalImages, className = 'product-image', alt = 'Product image' }) {
  const images = useMemo(() => normalizeImages(imageUrl, additionalImages), [imageUrl, additionalImages])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) {
      setCurrentIndex(0)
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setCurrentIndex((previousIndex) => (previousIndex + 1) % images.length)
    }, ROTATION_INTERVAL)

    return () => window.clearInterval(intervalId)
  }, [images])

  const activeImage = images[currentIndex] || images[0] || ''

  if (!activeImage) {
    return <div className={className} aria-label={alt} />
  }

  return (
    <div
      className={className}
      style={{ backgroundImage: `url(${activeImage})` }}
      aria-label={alt}
      role="img"
    />
  )
}
