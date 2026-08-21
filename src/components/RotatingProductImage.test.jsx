import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RotatingProductImage from './RotatingProductImage'

describe('RotatingProductImage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('rotates through multiple images every five seconds', () => {
    render(
      <RotatingProductImage
        imageUrl="/one.jpg"
        additionalImages={['/two.jpg', '/three.jpg']}
        className="product-image"
        alt="Product preview"
      />,
    )

    const image = screen.getByRole('img', { name: 'Product preview' })
    expect(image.style.backgroundImage).toContain('/one.jpg')

    vi.advanceTimersByTime(5000)
    expect(image.style.backgroundImage).toContain('/two.jpg')

    vi.advanceTimersByTime(5000)
    expect(image.style.backgroundImage).toContain('/three.jpg')
  })
})
