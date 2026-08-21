import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from '../i18n'

const LOCAL_FOOTER = {
  en: {
    brandTitle: 'OLRYCE CLASSICS',
    brandCopy: 'A fashion destination for timeless style. Discover curated pieces, bold silhouettes, and polished classics designed to elevate every wardrobe.',
    shoppingGuideTitle: 'Shopping Guide',
    shopHow: 'How to shop OLRYCE',
    newArrivals: 'New arrivals',
    returns: 'Returns & exchanges',
    giftCards: 'Gift cards',
    customerHelpTitle: 'Customer Help',
    orderTracking: 'Order tracking',
    privacy: 'Privacy policy',
    delivery: 'Delivery options',
    faq: 'FAQ',
    joinListTitle: 'Join the List',
    joinListBody: 'Subscribe for exclusive previews, style drops, and member-only offers.',
    newsletterPlaceholder: 'Enter E-mail Address',
    newsletterAria: 'Email address',
    newsletterSubmit: 'Subscribe',
    payVisa: 'Visa',
    payMastercard: 'Mastercard',
    payMpesa: 'M-Pesa',
    googlePlay: 'Google Play',
    appStore: 'App Store',
    rights: 'All rights reserved.'
  },
  de: {
    brandTitle: 'OLRYCE CLASSICS',
    brandCopy: 'Eine Anlaufstelle für zeitlosen Stil. Entdecken Sie kuratierte Stücke und klassische Silhouetten.',
    shoppingGuideTitle: 'Einkaufsführer',
    shopHow: 'Wie man bei OLRYCE einkauft',
    newArrivals: 'Neuheiten',
    returns: 'Rücksendungen & Umtausch',
    giftCards: 'Geschenkkarten',
    customerHelpTitle: 'Kundenhilfe',
    orderTracking: 'Bestellverfolgung',
    privacy: 'Datenschutz',
    delivery: 'Liefermöglichkeiten',
    faq: 'FAQ',
    joinListTitle: 'Zur Liste',
    joinListBody: 'Abonnieren Sie für exklusive Vorschauen und Mitgliederangebote.',
    newsletterPlaceholder: 'E-Mail-Adresse eingeben',
    newsletterAria: 'E-Mail-Adresse',
    newsletterSubmit: 'Abonnieren',
    payVisa: 'Visa',
    payMastercard: 'Mastercard',
    payMpesa: 'M-Pesa',
    googlePlay: 'Google Play',
    appStore: 'App Store',
    rights: 'Alle Rechte vorbehalten.'
  },
  fr: {
    brandTitle: 'OLRYCE CLASSICS',
    brandCopy: 'Une destination mode pour un style intemporel. Découvrez des pièces sélectionnées et des silhouettes raffinées.',
    shoppingGuideTitle: 'Guide d’achat',
    shopHow: 'Comment acheter sur OLRYCE',
    newArrivals: 'Nouveautés',
    returns: 'Retours & échanges',
    giftCards: 'Cartes-cadeaux',
    customerHelpTitle: 'Aide client',
    orderTracking: 'Suivi de commande',
    privacy: 'Politique de confidentialité',
    delivery: 'Options de livraison',
    faq: 'FAQ',
    joinListTitle: 'Rejoindre la liste',
    joinListBody: 'Inscrivez-vous pour des avant-premières exclusives et des offres réservées aux membres.',
    newsletterPlaceholder: 'Entrez l’adresse e-mail',
    newsletterAria: 'Adresse e-mail',
    newsletterSubmit: 'S’abonner',
    payVisa: 'Visa',
    payMastercard: 'Mastercard',
    payMpesa: 'M-Pesa',
    googlePlay: 'Google Play',
    appStore: 'App Store',
    rights: 'Tous droits réservés.'
  },
  es: {
    brandTitle: 'OLRYCE CLASSICS',
    brandCopy: 'Un destino de moda para un estilo atemporal. Descubre piezas seleccionadas y siluetas clásicas.',
    shoppingGuideTitle: 'Guía de compra',
    shopHow: 'Cómo comprar en OLRYCE',
    newArrivals: 'Nuevas llegadas',
    returns: 'Devoluciones y cambios',
    giftCards: 'Tarjetas de regalo',
    customerHelpTitle: 'Ayuda al cliente',
    orderTracking: 'Seguimiento de pedidos',
    privacy: 'Política de privacidad',
    delivery: 'Opciones de entrega',
    faq: 'Preguntas frecuentes',
    joinListTitle: 'Únete a la lista',
    joinListBody: 'Suscríbete para vistas previas exclusivas y ofertas para miembros.',
    newsletterPlaceholder: 'Introduce dirección de correo',
    newsletterAria: 'Dirección de correo electrónico',
    newsletterSubmit: 'Suscribirse',
    payVisa: 'Visa',
    payMastercard: 'Mastercard',
    payMpesa: 'M-Pesa',
    googlePlay: 'Google Play',
    appStore: 'App Store',
    rights: 'Todos los derechos reservados.'
  },
  zh: {
    brandTitle: 'OLRYCE CLASSICS',
    brandCopy: '一个追求永恒风格的时尚目的地。发现精选单品与经典廓形。',
    shoppingGuideTitle: '购物指南',
    shopHow: '如何在 OLRYCE 购物',
    newArrivals: '新品',
    returns: '退货与换货',
    giftCards: '礼品卡',
    customerHelpTitle: '客户帮助',
    orderTracking: '订单追踪',
    privacy: '隐私政策',
    delivery: '配送选项',
    faq: '常见问题',
    joinListTitle: '加入列表',
    joinListBody: '订阅以获取独家预览和会员专属优惠。',
    newsletterPlaceholder: '输入电子邮件地址',
    newsletterAria: '电子邮件地址',
    newsletterSubmit: '订阅',
    payVisa: 'Visa',
    payMastercard: 'Mastercard',
    payMpesa: 'M-Pesa',
    googlePlay: 'Google Play',
    appStore: 'App Store',
    rights: '版权所有。'
  },
  hi: {
    brandTitle: 'OLRYCE CLASSICS',
    brandCopy: 'टाइमलेस स्टाइल के लिए एक फैशन डेस्टिनेशन। क्यूरेटेड पीस और क्लासिक सिल्हुएट खोजें।',
    shoppingGuideTitle: 'खरीदारी गाइड',
    shopHow: 'OLRYCE पर कैसे खरीदें',
    newArrivals: 'नए आगमन',
    returns: 'वापसी और एक्सचेंज',
    giftCards: 'गिफ्ट कार्ड',
    customerHelpTitle: 'ग्राहक सहायता',
    orderTracking: 'ऑर्डर ट्रैकिंग',
    privacy: 'गोपनीयता नीति',
    delivery: 'डिलीवरी विकल्प',
    faq: 'अक्सर पूछे जाने वाले प्रश्न',
    joinListTitle: 'सूची में शामिल हों',
    joinListBody: 'विशेष प्रीव्यू और सदस्य-केवल ऑफ़र के लिए सब्सक्राइब करें।',
    newsletterPlaceholder: 'ईमेल पता दर्ज करें',
    newsletterAria: 'ईमेल पता',
    newsletterSubmit: 'सदस्यता लें',
    payVisa: 'Visa',
    payMastercard: 'Mastercard',
    payMpesa: 'M-Pesa',
    googlePlay: 'Google Play',
    appStore: 'App Store',
    rights: 'सभी अधिकार सुरक्षित।'
  }
}

export default function Footer() {
  const { t, languageCode = 'en' } = useTranslation()
  const year = new Date().getFullYear()
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const inputRef = useRef(null)
  const msgRef = useRef(null)

  // choose source: prefer i18n translations, else LOCAL_FOOTER
  const fallbacks = LOCAL_FOOTER[languageCode] || LOCAL_FOOTER.en

  useEffect(() => {
    if (msgRef.current) msgRef.current.textContent = ''
  }, [languageCode])

  async function handleSubmit(e) {
    e.preventDefault()
    const email = inputRef.current?.value?.trim()
    if (!email) {
      setMessage(t('footer.enterEmail', 'Please enter an email.'))
      setStatus('error')
      return
    }

    try {
      const res = await fetch('/api/newsletter/subscribe/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json().catch(() => null)
      if (res.ok && res.status === 201) {
        setMessage(t('footer.subscribed', 'Thanks — subscribed!'))
        setStatus('success')
        inputRef.current.value = ''
        inputRef.current.blur()
      } else if (res.ok && res.status === 200) {
        setMessage(t('footer.alreadySubscribed', 'You are already subscribed.'))
        setStatus('info')
      } else {
        setMessage((data && data.email) ? (Array.isArray(data.email) ? data.email.join(', ') : String(data.email)) : t('footer.subFailed', 'Subscription failed.'))
        setStatus('error')
      }
    } catch (err) {
      setMessage(t('footer.networkError', 'Network error.'))
      setStatus('error')
    }
    if (msgRef.current) msgRef.current.focus()
  }

  const get = (key, def) => t && typeof t === 'function' ? t(key, def) : (fallbacks[key] || def)

  return (
    <footer className="olryce-footer" role="contentinfo">
      <div className="olryce-footer__grid">
        <div>
          <div className="brand-title">{get('brandTitle', 'OLRYCE CLASSICS')}</div>
          <p className="brand-copy">{get('brandCopy', 'A fashion destination for timeless style. Discover curated pieces, bold silhouettes, and polished classics designed to elevate every wardrobe.')}</p>
          <div className="social-icons">
            <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" aria-label="TikTok"><i className="fab fa-tiktok"></i></a>
            <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
        <div>
          <h4>{get('shoppingGuideTitle','Shopping Guide')}</h4>
          <ul>
            <li>{get('shopHow','How to shop OLRYCE')}</li>
            <li>{get('newArrivals','New arrivals')}</li>
            <li>{get('returns','Returns & exchanges')}</li>
            <li>{get('giftCards','Gift cards')}</li>
          </ul>
        </div>
        <div>
          <h4>{get('customerHelpTitle','Customer Help')}</h4>
          <ul>
            <li>{get('orderTracking','Order tracking')}</li>
            <li>{get('privacy','Privacy policy')}</li>
            <li>{get('delivery','Delivery options')}</li>
            <li>{get('faq','FAQ')}</li>
          </ul>
        </div>
        <div>
          <h4>{get('joinListTitle','Join the List')}</h4>
          <p>{get('joinListBody','Subscribe for exclusive previews, style drops, and member-only offers.')}</p>
          <div className="newsletter">
            <form id="newsletter-form" onSubmit={handleSubmit} aria-labelledby="newsletter-label">
              <label id="newsletter-label" className="sr-only">{get('joinListTitle','Join the List')}</label>
              <input ref={inputRef} id="newsletter-email" type="email" name="email" placeholder={get('newsletterPlaceholder','Enter E-mail Address')} aria-label={get('newsletterAria','Email address')} aria-describedby="newsletter-msg" required />
              <button id="newsletter-submit" type="submit" aria-live="polite">{get('newsletterSubmit','Subscribe')}</button>
            </form>
          </div>
          <div id="newsletter-msg" className="newsletter-msg" role="status" aria-live="polite" tabIndex="-1" ref={msgRef}>{message}</div>
        </div>
      </div>
      <div className="payments">
        <img src="/static/payments/visa.svg" alt={get('payVisa','Visa')} />
        <img src="/static/payments/mastercard.svg" alt={get('payMastercard','Mastercard')} />
        <img src="/static/payments/mpesa.svg" alt={get('payMpesa','M-Pesa')} />
      </div>
      <div className="footer-meta">
        <small>© <span id="year">{year}</span> {get('brandTitle', 'OLRYCE CLASSICS')}. {get('rights','All rights reserved.')}</small>
        <div className="downloads">
          <a href="#" className="download-btn"><i className="fab fa-google-play"></i> {get('googlePlay','Google Play')}</a>
          <a href="#" className="download-btn"><i className="fab fa-apple"></i> {get('appStore','App Store')}</a>
        </div>
      </div>
    </footer>
  )
}
