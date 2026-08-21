import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getProducts, getCategories, searchProducts, getCarouselItems } from '../api'
import { formatCurrency, useCurrency } from '../currency'
import { shouldShowShippedTag } from '../countryConfig'
import RotatingProductImage from '../components/RotatingProductImage'
import '../styles/pages/shop.css'

const categoryIcons = {
  Fashion: '👗',
  Fabric: '🧵',
  Footwear: '👟',
  'Event Decor': '🎉',
  'House Decor': '🏡',
  'Hotel Decor': '🛎️',
  Office: '🏢',
  Art: '🎨',
  Theatre: '🎭',
  'Workwear & Uniforms': '🧑‍🏭',
  'School Wear': '🎒',
  'Industrial Wear': '⚙️',
  'Agricultural Wear': '🌾',
  'Hospital Wear': '🩺',
}

const defaultCarouselSlides = [
  {
    id: 'default-hero',
    title: 'Fast supplier sourcing',
    subtitle: 'Discover top categories and bulk-ready products',
    description: 'Browse verified suppliers, trusted product categories and smart pricing right from the home screen.',
    video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    cta_text: 'Browse shop',
    cta_url: '/shop',
  },
]

export default function ShopPage({ onAddToCart }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [carouselItems, setCarouselItems] = useState([])
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const categoryRowRef = useRef(null)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: 0,
    maxPrice: 5000,
    inStock: false,
    oemOnly: searchParams.get('oemOnly') === 'true',
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
    sort: '-created_at',
    randomCategory: false,
  })
  const { currency, rate, country: selectedCountry } = useCurrency()

  const buildProductBadges = (product) => {
    const badges = []
    if (product.stock > 0) {
      badges.push(product.is_low_stock ? t('shop.badges.lowStock', 'Low stock') : t('shop.badges.readyStock', 'Ready stock'))
    } else {
      badges.push(t('shop.badges.outOfStock', 'Out of stock'))
    }

    if (product.moq) {
      badges.push(t('shop.badges.moq', 'MOQ {{quantity}}', { quantity: product.moq }))
    }

    if (product.is_verified) {
      badges.push(t('shop.badges.oemQuote', 'OEM quote available'))
      badges.push(t('shop.badges.verifiedSupplier', 'Verified supplier'))
    }

    if (shouldShowShippedTag(product, selectedCountry)) {
      badges.push(t('shop.badges.shipped', 'Shipped'))
    }

    return badges.slice(0, 3)
  }
  const rootCategories = categories.filter((cat) => !cat.parent_slug)
  const [pagination, setPagination] = useState({ page: 1, total: 0 })

  useEffect(() => {
    const initialFilters = {
      ...filters,
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      oemOnly: searchParams.get('oemOnly') === 'true',
      verifiedOnly: searchParams.get('verifiedOnly') === 'true',
    }
    setFilters(initialFilters)
  }, [searchParams])

  useEffect(() => {
    loadProducts()
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page])

  const shuffleArray = (array) => {
    const copy = [...array]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        page_size: 20,
        ordering: filters.sort,
        price_min: filters.minPrice,
        price_max: filters.maxPrice,
      }
      if (filters.category) params.category = filters.category
      if (filters.inStock) params.in_stock = true

      const data = filters.search
        ? await searchProducts(filters.search, params)
        : await getProducts(params)

      const allProducts = data.results || data
      const filteredProducts = allProducts
        .filter((product) => (filters.verifiedOnly ? product.is_verified : true))
        .filter((product) => (filters.oemOnly ? product.is_verified : true))

      const shouldShowRandomProducts = !filters.category && !filters.search && !filters.inStock && !filters.oemOnly && !filters.verifiedOnly
      const productsToShow = filters.randomCategory || shouldShowRandomProducts
        ? shuffleArray(filteredProducts).slice(0, 20)
        : filteredProducts

      setProducts(productsToShow)
      setPagination((prev) => ({
        ...prev,
        total: data.count || productsToShow.length,
      }))
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const loadCarouselItems = async () => {
    try {
      const data = await getCarouselItems()
      setCarouselItems(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      console.error('Failed to load carousel items:', err)
    }
  }

  useEffect(() => {
    loadCarouselItems()
  }, [])

  const slideItems = carouselItems.length ? carouselItems : defaultCarouselSlides

  useEffect(() => {
    if (!slideItems.length) return

    const rotateInterval = setInterval(() => {
      setActiveCarouselIndex((current) => (current + 1) % slideItems.length)
    }, 7000)

    return () => clearInterval(rotateInterval)
  }, [slideItems])

  const updateSearchParams = (nextFilters) => {
    const params = new URLSearchParams()
    if (nextFilters.search) params.set('search', nextFilters.search)
    if (nextFilters.category) params.set('category', nextFilters.category)
    if (nextFilters.oemOnly) params.set('oemOnly', 'true')
    if (nextFilters.verifiedOnly) params.set('verifiedOnly', 'true')
    setSearchParams(params)
  }

  const handleFilterChange = (key, value) => {
    const nextFilters = { ...filters, [key]: value }
    setFilters(nextFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
    if (['search', 'category', 'oemOnly', 'verifiedOnly'].includes(key)) {
      updateSearchParams(nextFilters)
    }
  }

  const handleCategoryChip = (categoryValue) => {
    const nextFilters = { ...filters, category: categoryValue, randomCategory: false }
    setFilters(nextFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
    updateSearchParams(nextFilters)
    navigate(`/shop?category=${encodeURIComponent(categoryValue)}`)
  }

  const handleRandomCategory = (categoryValue) => {
    const nextFilters = { ...filters, category: categoryValue, randomCategory: true }
    setFilters(nextFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
    updateSearchParams(nextFilters)
    navigate(`/shop?category=${encodeURIComponent(categoryValue)}`)
  }

  const scrollCategoryRow = (direction) => {
    const row = categoryRowRef.current
    if (!row) return
    const offset = Math.round(row.clientWidth * 0.7)
    row.scrollBy({ left: direction === 'left' ? -offset : offset, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!categoryRowRef.current || rootCategories.length === 0) return undefined

    const interval = setInterval(() => {
      scrollCategoryRow('right')
    }, 5000)

    return () => clearInterval(interval)
  }, [rootCategories.length])

  const { t } = useTranslation()
  const localize = (value, fallback = value) => {
    if (value == null || value === '') return fallback ?? ''
    return t(String(value), String(fallback ?? value))
  }

  const selectedCategoryLabel = localize(categories.find((cat) => cat.slug === filters.category || cat.name === filters.category)?.name || filters.category)

  return (
    <div className="shop-page">
      <section className="shop-carousel-wrapper">
        {slideItems.length ? (
          <div className="shop-carousel">
            {slideItems.map((item, index) => (
              <div
                key={item.id || index}
                className={`carousel-slide ${index === activeCarouselIndex ? 'active' : ''}`}
              >
                <div className="carousel-copy">
                  {item.title && <span className="carousel-eyebrow">{item.title}</span>}
                  {item.subtitle && <h2>{item.subtitle}</h2>}
                  {item.description && <p>{item.description}</p>}
                  {item.cta_text && item.cta_url && (
                    <Link className="carousel-cta button button-primary" to={item.cta_url}>
                      {item.cta_text}
                    </Link>
                  )}
                </div>
                <div className="carousel-media">
                  {item.video_url ? (
                    <video
                      src={item.video_url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls={false}
                    />
                  ) : item.image_url ? (
                    <img src={item.image_url} alt={item.title || item.subtitle || 'Carousel slide'} />
                  ) : (
                    <div className="carousel-fallback">
                      <h3>{t('shop.carouselFallbackTitle', 'Discover new supplier channels')}</h3>
                      <p>{t('shop.carouselFallbackBody', 'Explore fresh product drops, featured categories and trusted sourcing partners.')}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="carousel-controls">
              {slideItems.map((item, index) => (
                <button
                  key={item.id || index}
                  type="button"
                  className={index === activeCarouselIndex ? 'active' : ''}
                  onClick={() => setActiveCarouselIndex(index)}
                  aria-label={`Go to carousel slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="shop-hero-video">
            <div className="shop-hero-copy">
              <span className="eyebrow">{t('shop.heroEyebrow', 'Shop the best sourcing channels')}</span>
              <h2>{t('shop.heroTitle', 'Fast, trusted marketplace sourcing for importers and buyers')}</h2>
              <p>{t('shop.heroBody', 'Learn about our product categories, verified suppliers and direct bulk ordering with one clean dashboard.')}</p>
            </div>
            <div className="shop-hero-video-wrapper">
              <video
                src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          </div>
        )}
      </section>

      <header className="shop-header">
        <div>
          <h1>{t('shop.headerTitle', 'Find the right supplier directory and product category fast')}</h1>
          <p>{t('shop.headerBody', 'Browse curated sourcing channels, verified supply categories and bulk product listings tailored for buyers and importers.')}</p>
        </div>
        <div className="shop-search">
          <input
            type="search"
            placeholder={t('shop.searchPlaceholder', 'Search products, categories, suppliers...')}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </header>

      <div className="shop-results-row">
        <div className="shop-results">
          <p>{t('shop.resultsCount', '{{count}} products found', { count: products.length })}{filters.category ? t('shop.resultsInCategory', ' in {{category}}', { category: selectedCategoryLabel }) : t('shop.resultsAllCategories', ' across all categories')}</p>
          <p>{filters.verifiedOnly ? t('shop.verifiedOnly', 'Verified supplier listings only') : filters.oemOnly ? t('shop.oemOnly', 'OEM quote listings only') : t('shop.allOffers', 'All sourcing offers')}</p>
        </div>
      </div>

      <div className="category-chip-row">
        {rootCategories.slice(0, 6).map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`pill ${filters.category === cat.slug || filters.category === cat.name ? 'pill-active' : ''}`}
            onClick={() => handleCategoryChip(cat.slug || cat.name)}
          >
            {localize(cat.name)}
          </button>
        ))}
      </div>

      <div className="shop-category-showcase">
        <div className="section-header">
          <div>
            <h2>{t('shop.categoriesTitle', 'Top sourcing categories')}</h2>
            <p className="section-copy">{t('shop.categoriesBody', 'Browse key product directories and find sourcing options for apparel, workwear, home decor, and industrial supplies.')}</p>
          </div>
          <Link to="/shop">{t('shop.seeAllCategories', 'See all categories')}</Link>
        </div>
        <div className="shop-category-row-wrapper">
          <button className="shop-category-scroll-button left" type="button" onClick={() => scrollCategoryRow('left')} aria-label="Scroll categories left">←</button>
          <div className="shop-category-grid" ref={categoryRowRef}>
            {rootCategories.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`shop-category-card ${filters.category === cat.slug || filters.category === cat.name ? 'shop-category-card-active' : ''}`}
                onClick={() => handleRandomCategory(cat.slug || cat.name)}
                title={t('shop.categoryRandomPick', 'Show random picks from {{category}}', { category: localize(cat.name) })}
              >
              <div className="shop-category-card-icon">{categoryIcons[cat.name] || '📦'}</div>
              <div className="shop-category-card-copy">
                <strong>{localize(cat.name)}</strong>
                <p>{t('shop.categoryCardBody', 'Verified suppliers, bulk offers and fast quotes for {{category}}.', { category: localize(cat.name).toLowerCase() })}</p>
              </div>
              <span>{(cat.children || []).slice(0, 3).map((child) => localize(child.name)).join(' · ')}</span>
            </button>
          ))}
          </div>
          <button className="shop-category-scroll-button right" type="button" onClick={() => scrollCategoryRow('right')} aria-label="Scroll categories right">→</button>
        </div>

      <div className="shop-container">
        <aside className="filters-sidebar">
          <div className="filter-group">
            <label>{t('shop.categoryLabel', 'Category')}</label>
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
              <option value="">{t('shop.allCategories', 'All categories')}</option>
              {categories.map((cat) => {
                const indent = cat.parent_slug ? (cat.parent_id ? '   ' : '  ') : ''
                return (
                  <option key={cat.id} value={cat.slug || cat.name}>
                    {indent}{localize(cat.name)}
                  </option>
                )
              })}
            </select>
          </div>
          
          {filters.category && categories.length > 0 && (
            <div className="filter-group">
              <label>{t('shop.subcategoriesLabel', 'Subcategories')}</label>
              <div className="category-tree">
                {(() => {
                  const selectedCat = categories.find(c => c.slug === filters.category || c.name === filters.category)
                  if (!selectedCat) {
                    return <p style={{fontSize: '0.9em', color: '#666'}}>{t('shop.categoryNotFound', 'Category not found')}</p>
                  }
                  if (!selectedCat.children || selectedCat.children.length === 0) {
                    return <p style={{fontSize: '0.9em', color: '#666'}}>{t('shop.noSubcategories', 'No subcategories')}</p>
                  }
                  return (
                    <div className="category-hierarchy">
                      {selectedCat.children.map((subCat) => (
                        <div key={subCat.id} className="sub-category-item">
                          <button
                            type="button"
                            className={`sub-category-button ${filters.category === subCat.slug || filters.category === subCat.name ? 'sub-category-button-active' : ''}`}
                            onClick={() => handleCategoryChip(subCat.slug || subCat.name)}
                          >
                            <strong>{localize(subCat.name)}</strong>
                          </button>
                          {subCat.children && subCat.children.length > 0 && (
                            <div className="sub-sub-category-list">
                              {subCat.children.map((subSubCat) => (
                                <button
                                  key={subSubCat.id}
                                  type="button"
                                  className={`sub-sub-category-item ${filters.category === subSubCat.slug || filters.category === subSubCat.name ? 'sub-sub-category-item-active' : ''}`}
                                  onClick={() => handleCategoryChip(subSubCat.slug || subSubCat.name)}
                                >
                                  <span className="sub-sub-category-name">{localize(subSubCat.name)}</span>
                                  {subSubCat.description && subSubCat.description.includes(':') && (
                                    <span className="sub-sub-category-types">
                                      {subSubCat.description.split(': ')[1]}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
          <div className="filter-group">
            <label>{t('shop.sortLabel', 'Sort')}</label>
            <select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)}>
              <option value="-created_at">{t('shop.sortNewest', 'Newest arrivals')}</option>
              <option value="price">{t('shop.sortPriceAsc', 'Price: Low to high')}</option>
              <option value="-price">{t('shop.sortPriceDesc', 'Price: High to low')}</option>
              <option value="rating">{t('shop.sortTopRated', 'Top rated')}</option>
              <option value="-stock">{t('shop.sortReadyStock', 'Ready stock first')}</option>
            </select>
          </div>
          <div className="filter-group filter-group-small">
            <label>{t('shop.quickPicks', 'Quick picks')}</label>
            <div className="category-sidebar-list">
              {rootCategories.slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`sidebar-category-pill ${filters.category === cat.slug || filters.category === cat.name ? 'pill-active' : ''}`}
                  onClick={() => handleCategoryChip(cat.slug || cat.name)}
                >
                  {localize(cat.name)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>{t('shop.priceRange', 'Price range')}</label>
            <input
              type="range"
              min="0"
              max="5000"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value, 10))}
            />
            <p>{formatCurrency(filters.minPrice, currency, rate)} - {formatCurrency(filters.maxPrice, currency, rate)}</p>
          </div>

          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              />
              {t('shop.inStockOnly', 'In stock only')}
            </label>
          </div>

          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.oemOnly}
                onChange={(e) => handleFilterChange('oemOnly', e.target.checked)}
              />
              {t('shop.oemAvailable', 'OEM quote available')}
            </label>
            <p className="filter-note">{t('shop.oemNote', 'Show products from verified suppliers that can provide OEM quotes.')}</p>
          </div>

          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
              />
              {t('shop.verifiedOnlyLabel', 'Verified suppliers only')}
            </label>
            <p className="filter-note">{t('shop.verifiedNote', 'Filter to suppliers with trust badges and fast response profiles.')}</p>
          </div>

          <div className="filter-group">
            <label>{t('shop.sortBy', 'Sort by')}</label>
            <select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)}>
              <option value="-created_at">{t('shop.sortNewest', 'Newest arrivals')}</option>
              <option value="price">{t('shop.sortPriceAsc', 'Price: Low to high')}</option>
              <option value="-price">{t('shop.sortPriceDesc', 'Price: High to low')}</option>
              <option value="-rating">{t('shop.sortTopRated', 'Top rated')}</option>
            </select>
          </div>
        </aside>

        <div className="products-section">
          {loading ? (
            <div className="loading">{t('shop.loadingProducts', 'Loading products…')}</div>
          ) : products.length > 0 ? (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <Link to={`/product/${product.slug || product.id}`} className="product-link">
                      <RotatingProductImage imageUrl={product.image_url} additionalImages={product.additional_images} alt={localize(product.name)} className="product-image" />
                    </Link>
                    <div className="product-info">
                      <Link to={`/product/${product.slug || product.id}`}>
                        <h3>{localize(product.name)}</h3>
                      </Link>
                      <p className="category">{localize(product.category_name || 'Category')}</p>
                      <div className="product-badges">
                        {buildProductBadges(product).map((badge) => {
                          const normalized = badge.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                          return (
                            <span key={badge} className={`product-badge product-badge-${normalized}`}>
                              {badge}
                            </span>
                          )
                        })}
                      </div>
                      <div className="rating">
                        <span>{'★'.repeat(Math.floor(product.rating || 4))}{'☆'.repeat(5 - Math.floor(product.rating || 4))}</span>
                        {product.review_count != null && <span>({product.review_count})</span>}
                      </div>
                      <div className="product-footer">
                        <p className="price">{formatCurrency(product.price, currency, rate)}</p>
                        <button
                          className="button button-small"
                          onClick={() => onAddToCart(product, 1)}
                          disabled={!product.stock}
                        >
                          {t('product.addToCart','Add to cart')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pagination">
                {pagination.page > 1 && (
                  <button onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}>{t('shop.paginationPrevious','← Previous')}</button>
                )}
                <span>{t('shop.paginationPage','Page {{page}}',{ page: pagination.page })}</span>
                {pagination.total > pagination.page * 20 && (
                  <button onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}>{t('shop.paginationNext','Next →')}</button>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>{t('shop.noProductsFound', 'No products found')}</h2>
              <p>{t('shop.adjustFilters', 'Try adjusting your filters or search term.')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  )
}
