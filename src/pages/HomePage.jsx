import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../i18n'
import { Link, useNavigate } from 'react-router-dom'
import { getCategories, getFeaturedProducts, getProducts, getCarouselItems } from '../api'
import { formatCurrency, useCurrency } from '../currency'
import { shouldShowShippedTag } from '../countryConfig'
import RotatingProductImage from '../components/RotatingProductImage'
import '../styles/pages/home.css'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [categoryProductPreviews, setCategoryProductPreviews] = useState({})
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [latestProducts, setLatestProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroSearch, setHeroSearch] = useState('')
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1)
  const [browseIndex, setBrowseIndex] = useState(0)
  const [previewIndex, setPreviewIndex] = useState(0)
  const navigate = useNavigate()
  const { currency, rate, country: selectedCountry } = useCurrency()
  const rootCategories = categories.filter((cat) => !cat.parent_slug)
  const activeCategory = activeCategoryIndex >= 0 ? rootCategories[activeCategoryIndex] : null
  const activeSubcategories = activeCategory?.children || []
  const categoryIcons = {
    Apparel: '👗',
    Accessories: '👜',
    Electronics: '🎧',
    Beauty: '💄',
    Jewelry: '💎',
    Shoes: '👟',
    Home: '🏠',
    Sports: '🏀',
    Luggage: '🧳',
  }
  const { t } = useTranslation()
  const localize = (value, fallback = value) => {
    if (value == null || value === '') return fallback ?? ''
    return t(String(value), String(fallback ?? value))
  }
  const supplierHighlights = [
    { title: t('home.supplierHighlights.verified.title', 'Verified suppliers'), subtitle: t('home.supplierHighlights.verified.subtitle', 'Connect with trusted manufacturers and wholesale partners.'), badge: t('home.supplierHighlights.verified.badge', 'Verified'), icon: '🏅' },
    { title: t('home.supplierHighlights.fast.title', 'Fast sourcing'), subtitle: t('home.supplierHighlights.fast.subtitle', 'Browse products with reliable lead times and stock updates.'), badge: t('home.supplierHighlights.fast.badge', 'Fast'), icon: '⏱️' },
    { title: t('home.supplierHighlights.secure.title', 'Secure buying'), subtitle: t('home.supplierHighlights.secure.subtitle', 'Protected checkout and order tracking for every purchase.'), badge: t('home.supplierHighlights.secure.badge', 'Secure'), icon: '🔒' },
  ]

  const marketplaceHighlights = [
    { title: t('home.marketplaceHighlights.rfq.title', 'Quick RFQ access'), subtitle: t('home.marketplaceHighlights.rfq.subtitle', 'Send requests for quotations directly to suppliers and compare quotes quickly.'), badge: t('home.marketplaceHighlights.rfq.badge', 'Quick quote'), icon: '⚡' },
    { title: t('home.marketplaceHighlights.network.title', 'Verified supplier network'), subtitle: t('home.marketplaceHighlights.network.subtitle', 'Every seller is rated and verified for reliable cross-border sourcing.'), badge: t('home.marketplaceHighlights.network.badge', 'Trusted'), icon: '🛡️' },
    { title: t('home.marketplaceHighlights.moq.title', 'Flexible MOQ options'), subtitle: t('home.marketplaceHighlights.moq.subtitle', 'Filter listings by MOQ and stock level so you can order what fits your budget.'), badge: t('home.marketplaceHighlights.moq.badge', 'Flexible MOQ'), icon: '📦' },
  ]

  const frequentlySearched = [
    {
      title: t('home.frequentlySearched.smartWatches.title', 'Smart Watches'),
      subtitle: t('home.frequentlySearched.smartWatches.subtitle', 'Trending wearable gadgets with premium design.'),
      badge: t('home.frequentlySearched.smartWatches.badge', 'Frequently searched'),
      icon: '⌚',
    },
    {
      title: t('home.frequentlySearched.cars.title', 'Cars'),
      subtitle: t('home.frequentlySearched.cars.subtitle', 'Popular EV, SUV and compact transport listings.'),
      badge: t('home.frequentlySearched.cars.badge', 'Frequently searched'),
      icon: '🚗',
    },
    {
      title: t('home.frequentlySearched.audio.title', 'Audio Gear'),
      subtitle: t('home.frequentlySearched.audio.subtitle', 'Headphones, speakers and audio accessories.'),
      badge: t('home.frequentlySearched.audio.badge', 'Hot category'),
      icon: '🎧',
    },
  ]
  const activeBrowse = frequentlySearched[browseIndex] || frequentlySearched[0]

  const randomPreviewProducts = useMemo(() => {
    const pool = [...featuredProducts, ...latestProducts]
      .filter((product, index, list) => product && list.findIndex((candidate) => candidate.id === product.id) === index)

    if (!pool.length) return []

    const shuffled = [...pool]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }

    return shuffled.slice(0, 4)
  }, [featuredProducts, latestProducts])

  useEffect(() => {
    if (!randomPreviewProducts.length || activeCategoryIndex >= 0) return undefined

    const timer = window.setInterval(() => {
      setPreviewIndex((current) => (current + 1) % randomPreviewProducts.length)
    }, 10000)

    return () => window.clearInterval(timer)
  }, [activeCategoryIndex, randomPreviewProducts.length])

  const defaultCarouselSlides = [
    {
      title: t('home.carousel.slide1.title', 'Discover verified suppliers'),
      subtitle: t('home.carousel.slide1.subtitle', 'Browse trusted manufacturers and wholesale deals.'),
      cta_label: t('home.carousel.slide1.button', 'Start sourcing'),
      cta_url: '/shop',
      image_url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&q=80',
    },
    {
      title: t('home.carousel.slide2.title', 'Curated categories & fast quotes'),
      subtitle: t('home.carousel.slide2.subtitle', 'Find bulk pricing and supplier channels tailored for your needs.'),
      cta_label: t('home.carousel.slide2.button', 'Explore categories'),
      cta_url: '/shop',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=80',
    },
  ]

  const [carouselItems, setCarouselItems] = useState([])
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0)

  useEffect(() => {
    const loadCarouselItems = async () => {
      try {
        const data = await getCarouselItems()
        setCarouselItems(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        console.error('Failed to load homepage carousel items:', err)
      }
    }
    loadCarouselItems()
  }, [])

  useEffect(() => {
    const slideItems = carouselItems.length ? carouselItems : defaultCarouselSlides
    const timer = window.setInterval(() => {
      setActiveCarouselIndex((current) => (current + 1) % slideItems.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [carouselItems])

 

  const loadCategoryProductPreviews = async (categoryData) => {
    const topCategories = (categoryData || []).filter((cat) => !cat.parent_slug).slice(0, 6)
    const previewResults = await Promise.all(topCategories.map(async (category) => {
      try {
        const response = await getProducts({ category: category.slug, page_size: 1, ordering: '-created_at' })
        return { slug: category.slug, product: response.results?.[0] || null }
      } catch (err) {
        return { slug: category.slug, product: null }
      }
    }))

    setCategoryProductPreviews(previewResults.reduce((acc, item) => {
      acc[item.slug] = item.product
      return acc
    }, {}))
  }

  useEffect(() => {
    const loadHome = async () => {
      setLoading(true)
      try {
        const [categoryData, featuredData, latestData] = await Promise.all([
          getCategories(),
          getFeaturedProducts({ page_size: 8 }),
          getProducts({ page_size: 8, ordering: '-created_at' }),
        ])
        const featuredList = Array.isArray(featuredData?.results)
          ? featuredData.results
          : Array.isArray(featuredData)
            ? featuredData
            : []
        const latestList = Array.isArray(latestData?.results)
          ? latestData.results
          : Array.isArray(latestData)
            ? latestData
            : []
        setCategories(categoryData || [])
        setFeaturedProducts(featuredList.length ? featuredList : latestList)
        setLatestProducts(latestList)
        await loadCategoryProductPreviews(categoryData || [])
      } catch (err) {
        console.error('Failed to load homepage data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadHome()
  }, [])

  const handleSearch = (event) => {
    event.preventDefault()
    const query = heroSearch.trim()
    if (!query) return
    navigate(`/shop?search=${encodeURIComponent(query)}`)
  }

  return (
    <div className="home-page">
      <section className="home-carousel-fullwidth">
        {(carouselItems.length ? carouselItems : defaultCarouselSlides).map((item, index) => (
          <div
            key={index}
            className={`home-carousel-slide ${index === activeCarouselIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${item.image_url || item.background})` }}
          >
            <div className="home-carousel-overlay" />
            <div className="home-carousel-copy">
              {item.title && <span className="eyebrow">{item.title}</span>}
              {item.subtitle && <h2>{item.subtitle}</h2>}
              {item.cta_label && (
                <Link to={item.cta_url || '#'} className="button button-primary home-carousel-button">
                  {item.cta_label}
                </Link>
              )}
            </div>
          </div>
        ))}
        <div className="home-carousel-controls">
          {(carouselItems.length ? carouselItems : defaultCarouselSlides).map((_, index) => (
            <button
              key={index}
              type="button"
              className={index === activeCarouselIndex ? 'active' : ''}
              onClick={() => setActiveCarouselIndex(index)}
              aria-label={`Go to carousel slide ${index + 1}`}
            />
          ))}
        </div>
      </section>
      
      

      

      <section className="category-browse-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">{t('home.categoriesEyebrow', 'Categories for you')}</span>
            <h2>{t('home.categoriesTitle', 'Browse curated category channels')}</h2>
            <p className="section-copy">{t('home.categoriesBody', 'Quickly navigate the categories buyers search most and discover top supplier routes in one glance.')}</p>
          </div>
          <Link to="/shop">{t('home.browseAllCategories', 'Browse all categories')}</Link>
        </div>
        <div className="category-browser-layout">
          <div className="category-list-panel">
            <div className="category-list-header">
              <strong>{t('home.categoriesPanelTitle', 'Categories for you')}</strong>
              <span>{t('home.categoriesPanelSubtitle', 'Top selections based on demand')}</span>
            </div>
            <div className="category-list">
              {rootCategories.slice(0, 8).map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`category-list-item ${index === activeCategoryIndex ? 'active' : ''}`}
                  onClick={() => setActiveCategoryIndex(index)}
                >
                  <span className="category-icon">{categoryIcons[item.name] || '▸'}</span>
                  <span>{localize(item.name)}</span>
                  <span className="category-arrow">›</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`category-cards-panel ${activeCategory ? 'panel-open' : 'panel-closed'}`}>
            <div className="category-carousel-background" aria-hidden="true">
              {randomPreviewProducts.slice(0, 3).map((product, index) => (
                <div
                  key={product.id || `bg-${index}`}
                  className={`category-carousel-slide ${index === previewIndex % Math.max(1, randomPreviewProducts.slice(0, 3).length) ? 'active' : ''}`}
                  style={{
                    backgroundImage: product.image_url ? `url(${product.image_url})` : 'linear-gradient(135deg, #dbeafe, #f8fafc)',
                  }}
                />
              ))}
            </div>
            <div className="category-cards-header">
              <div>
                <strong>{activeCategory?.name || t('home.randomPicksTitle', 'Featured picks')}</strong>
                <p>{activeCategory ? `Explore ${localize(activeCategory.name)} subcategories` : t('home.randomPicksBody', 'Discover a rotating mix of products and categories from across the marketplace.')}</p>
              </div>
              {activeCategory && (
                <Link to={`/shop?category=${encodeURIComponent(activeCategory.slug || activeCategory.name)}`} className="button button-secondary">
                  Browse {localize(activeCategory.name)}
                </Link>
              )}
            </div>
            {activeCategory ? (
              activeSubcategories.length > 0 ? (
                <div className="subcategory-grid">
                  {activeSubcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/shop?category=${encodeURIComponent(sub.slug || sub.name)}`}
                      className="subcategory-card compact"
                    >
                      <div
                        className="subcategory-thumb"
                        style={{
                          backgroundImage: sub.icon_url
                            ? `url(${sub.icon_url})`
                            : `linear-gradient(135deg, #e2e8f5, #f8fafc)`,
                        }}
                      >
                        {!sub.icon_url && <span>{sub.name?.charAt(0)}</span>}
                      </div>
                      <div className="subcategory-copy">
                        <strong>{localize(sub.name)}</strong>
                        <p>{sub.description || t('home.subcategoryBrowse', 'Browse {{subcategory}}.', { subcategory: localize(sub.name).toLowerCase() })}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="subcategory-empty">
                  <p>{t('home.noSubcategories', 'No subcategories are available for this category yet.')}</p>
                </div>
              )
            ) : (
              <div className="subcategory-grid featured-preview-grid">
                {randomPreviewProducts.slice(previewIndex, previewIndex + 2).concat(randomPreviewProducts.slice(0, Math.max(0, 2 - (randomPreviewProducts.length - previewIndex))))
                  .filter(Boolean)
                  .map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.slug || product.id}`}
                      className="subcategory-card compact featured-preview-card"
                    >
                      <div
                        className="subcategory-thumb"
                        style={{
                          backgroundImage: product.image_url
                            ? `url(${product.image_url})`
                            : 'linear-gradient(135deg, #e2e8f5, #f8fafc)',
                        }}
                      >
                        {!product.image_url && <span>{localize(product.name).charAt(0) || '•'}</span>}
                      </div>
                      <div className="subcategory-copy">
                        <strong>{localize(product.name)}</strong>
                        <p>{product.category_name ? localize(product.category_name) : t('home.randomProductPreview', 'Fresh picks from the marketplace')}</p>
                        <span className="price-pill">{formatCurrency(product.price, currency, rate)}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>

          <div className="category-promo-panel">
            <div className="promo-card">
              <div className="promo-banner">{t('home.promoBanner', 'Virtual Reality Showroom')}</div>
              <div className="promo-copy">
                <h3>{t('home.promoTitle', 'Experience our supplier showroom')}</h3>
                <p>{t('home.promoBody', 'Tour verified factories, preview product collections, and discover live sourcing opportunities in one immersive destination.')}</p>
                <ul className="promo-highlights">
                  <li>Live supplier discovery</li>
                  <li>Featured product tours</li>
                  <li>Fast quote access</li>
                </ul>
              </div>
              <Link to="/shop" className="button button-primary">{t('home.promoAction', 'View more')}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="trend-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">{t('home.trendingEyebrow', 'Trending sourcing products')}</span>
            <h2>{t('home.trendingTitle', 'Most requested products this week')}</h2>
            <p className="section-copy">{t('home.trendingBody', 'Track what buyers are sourcing now and jump into popular product listings with verified leads.')}</p>
          </div>
          <Link to="/shop">{t('home.browseTopProducts', 'Browse top products')}</Link>
        </div>
        <div className="trend-grid">
          {rootCategories.slice(0, 6).map((item) => {
            const previewProduct = categoryProductPreviews[item.slug]
            return previewProduct ? (
              <Link
                key={previewProduct.id}
                to={`/product/${previewProduct.slug || previewProduct.id}`}
                className="small-product-card"
              >
                <div
                  className="product-image compact"
                  style={{
                    backgroundImage: previewProduct.image_url
                      ? `url(${previewProduct.image_url})`
                      : `linear-gradient(135deg, #f8fafc, #e2e8f5)`,
                  }}
                />
                <div className="product-details compact">
                  <span className="category-pill">{localize(item.name)}</span>
                  <h3>{localize(previewProduct.name)}</h3>
                  <p className="price">{formatCurrency(previewProduct.price, currency, rate)}</p>
                </div>
              </Link>
            ) : (
              <Link key={item.id} to={`/shop?category=${encodeURIComponent(item.slug || item.name)}`} className="trend-card">
                <strong>{localize(item.name)}</strong>
                <p>{(item.children || []).slice(0, 4).map((child) => localize(child.name)).join(' · ') || t('home.fastQuoteListings', 'Fast quote listings')}</p>
                <span>{t('home.subcategoriesCount', '{{count}} subcategories', { count: (item.children || []).length })}</span>
              </Link>
            )
          })}
        </div>
      </section>

      

      

      

      <section className="source-channels-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">{t('home.hotSourcingEyebrow', 'Hot sourcing products')}</span>
            <h2>{t('home.hotSourcingTitle', 'Popular procurement products for fast supply')}</h2>
            <p className="section-copy">{t('home.hotSourcingBody', 'Browse curated product sourcing routes and connect with verified manufacturers for ready stock or custom production.')}</p>
          </div>
          <Link to="/shop">{t('home.seeAllSourcingProducts', 'See all sourcing products')}</Link>
        </div>
        <div className="source-channel-grid">
          {rootCategories.slice(0, 4).map((item) => {
            const previewProduct = categoryProductPreviews[item.slug]
            return previewProduct ? (
              <Link
                key={previewProduct.id}
                to={`/product/${previewProduct.slug || previewProduct.id}`}
                className="source-channel-card product-channel-card"
              >
                <div
                  className="product-image compact"
                  style={{
                    backgroundImage: previewProduct.image_url
                      ? `url(${previewProduct.image_url})`
                      : `linear-gradient(135deg, #f8fafc, #e2e8f5)`,
                  }}
                />
                <div className="source-channel-top">
                  <span className="eyebrow">{localize(item.name)}</span>
                  <strong>{localize(previewProduct.name)}</strong>
                </div>
                <p>{previewProduct.description || t('home.bulkProductSourcing', 'Bulk product sourcing in {{category}}.', { category: localize(item.name).toLowerCase() })}</p>
                <div className="source-channel-footer">
                  <span>{localize(previewProduct.category_name || item.name)}</span>
                  <span>{formatCurrency(previewProduct.price, currency, rate)}</span>
                </div>
              </Link>
            ) : (
              <Link
                key={item.id}
                to={`/shop?category=${encodeURIComponent(item.slug || item.name)}`}
                className="source-channel-card"
              >
                <div className="source-channel-top">
                  <span className="eyebrow">{localize(item.name)}</span>
                  <strong>{localize(item.name)} sourcing</strong>
                </div>
                <p>{t('home.categorySourcing', 'Find top sellers, factory direct quotes and bulk-order product listings in {{category}}.', { category: localize(item.name).toLowerCase() })}</p>
                <div className="source-channel-footer">
                  <span>{(item.children || []).slice(0, 3).map((child) => localize(child.name)).join(' · ')}</span>
                  <span>{t('home.verifiedSuppliersLabel', 'Verified suppliers')}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="featured-products-section">
        <div className="section-header">
          <h2>{t('home.featuredProducts', 'Featured products')}</h2>
          <Link to="/shop">{t('home.exploreAll', 'Explore all')}</Link>
        </div>
        {loading ? (
          <div className="loading">{t('home.loadingFeaturedProducts', 'Loading featured products…')}</div>
        ) : (
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug || product.id}`}
                className="product-card"
              >
                <RotatingProductImage imageUrl={product.image_url} additionalImages={product.additional_images} alt={localize(product.name)} className="product-image" />
                <div className="product-details">
                  <span className="category-pill">{localize(product.category_name || 'General')}</span>
                  <h3>{localize(product.name)}</h3>
                  {shouldShowShippedTag(product, selectedCountry) && <span className="product-badge shipped-badge">{t('product.shippingTag','Shipped')}</span>}
                  <p className="price">{formatCurrency(product.price, currency, rate)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="latest-section">
        <div className="section-header">
          <h2>{t('home.newArrivals', 'New arrivals')}</h2>
          <Link to="/shop">{t('home.seeNewArrivals', 'See new arrivals')}</Link>
        </div>
        {loading ? (
          <div className="loading">{t('home.loadingNewArrivals', 'Loading new arrivals…')}</div>
        ) : (
          <div className="product-grid">
            {latestProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug || product.id}`}
                className="product-card"
              >
                <RotatingProductImage imageUrl={product.image_url} additionalImages={product.additional_images} alt={localize(product.name)} className="product-image" />
                <div className="product-details">
                  <span className="category-pill">{localize(product.category_name || 'General')}</span>
                  <h3>{localize(product.name)}</h3>
                  {shouldShowShippedTag(product, selectedCountry) && <span className="product-badge shipped-badge">{t('product.shippingTag','Shipped')}</span>}
                  <p className="price">{formatCurrency(product.price, currency, rate)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      
      <section className="hero-section">
        <div className="hero-card-shell">
          <div className="hero-copy">
            <span className="eyebrow">{t('home.heroEyebrow', 'Global sourcing platform')}</span>
            <h1>{t('home.heroTitle', 'Source directly from verified manufacturers and suppliers.')}</h1>
            <p>{t('home.heroBody', 'Browse factory-direct deals, OEM/ODM services, and wholesale listings across apparel, home, industrial and workplace categories.')}</p>
            <form className="hero-search" onSubmit={handleSearch}>
              <input
                type="search"
                value={heroSearch}
                onChange={(event) => setHeroSearch(event.target.value)}
                placeholder={t('home.searchPlaceholder', 'Search products, suppliers, categories, factories...')}
                aria-label={t('home.searchPlaceholder', 'Search marketplace')}
              />
              <button type="submit" className="button button-primary">{t('nav.search', 'Search')}</button>
            </form>
            <div className="hero-facts">
              <div>
                <strong>1,200+</strong>
                <span>{t('home.stats.verifiedSuppliers', 'Verified suppliers')}</span>
              </div>
              <div>
                <strong>35k+</strong>
                <span>{t('home.stats.categoryListings', 'Category listings')}</span>
              </div>
              <div>
                <strong>{t('home.stats.fast', 'Fast')}</strong>
                <span>{t('home.stats.quotationSourcing', 'Quotation & sourcing')}</span>
              </div>
            </div>
            <div className="hero-highlights">
              <div className="highlight-pill">{t('home.highlights.factoryInventory', 'Factory-sourced inventory')}</div>
              <div className="highlight-pill">{t('home.highlights.customBulkOrders', 'Custom bulk orders')}</div>
              <div className="highlight-pill">{t('home.highlights.verifiedSupplierNetwork', 'Verified supplier network')}</div>
            </div>
          </div>

          <div className="hero-side-panel">
            <div className="hero-benefits">
              {marketplaceHighlights.map((item) => (
                <div key={item.title} className="benefit-card">
                  <div className="benefit-icon">{item.icon}</div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.subtitle}</p>
                  </div>
                  <span className="benefit-badge">{item.badge}</span>
                </div>
              ))}
            </div>
            <div className="hero-service-stack">
              {supplierHighlights.map((item) => (
                <div key={item.title} className="supplier-card compact-supplier-card">
                  <div className="supplier-icon">{item.icon}</div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                  </div>
                  <span className="supplier-badge">{item.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
