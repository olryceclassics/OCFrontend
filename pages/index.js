import Head from 'next/head';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json();
});

const features = [
  {
    title: 'Bold modern fashion',
    description: 'Fresh collections designed for urban elegance and statement-making style.',
    tone: 'lightblue',
  },
  {
    title: 'Vibrant trend visuals',
    description: 'Luminous orange accents pair with warm pink for a playful premium palette.',
    tone: 'orange',
  },
  {
    title: 'Seamless backend flow',
    description: 'React + Next.js frontend talking to the Django API with fast client-side loading.',
    tone: 'pink',
  },
];

export default function Home() {
  const { data: health, error: healthError } = useSWR('/health', fetcher, { refreshInterval: 10000 });
  const { data: config, error: configError } = useSWR('/api/config', fetcher);

  return (
    <>
      <Head>
        <title>OlryceClassics</title>
        <meta name="description" content="Modern ecommerce frontend for OlryceClassics." />
      </Head>

      <main className="page-shell">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">OlryceClassics</span>
            <h1>Modern fashion for the trend-forward.</h1>
            <p>
              A polished React + Next.js storefront using luminous blue, orange, and pink tones to create a modern
              ecommerce experience.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#catalog">Shop the aesthetic</a>
              <a className="button button-secondary" href="#status">Check backend</a>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-badge">TREND</div>
            <h2>Signature looks for every wardrobe.</h2>
            <p>Discover premium pieces styled for cosmopolitan energy, runway influence, and everyday confidence.</p>
            <div className="stats-grid">
              <div>
                <strong>40+</strong>
                <span>New arrivals</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Live API</span>
              </div>
            </div>
          </div>
        </section>

        <section id="catalog" className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className={`feature-card ${feature.tone}`}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </section>

        <section id="status" className="status-section">
          <div className="status-card">
            <h3>Backend health</h3>
            <p className={health ? 'health-ok' : healthError ? 'health-fail' : 'health-pending'}>
              {healthError ? 'Error connecting to backend' : health ? health.status : 'Checking…'}
            </p>
          </div>
          <div className="status-card">
            <h3>API config</h3>
            <pre>{configError ? configError.message : config ? JSON.stringify(config, null, 2) : 'Loading…'}</pre>
          </div>
        </section>
      </main>
    </>
  );
}
