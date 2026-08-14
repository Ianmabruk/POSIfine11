import { useEffect } from 'react';

const DEFAULT_TITLE = 'POSIFY - Modern POS Platform for African Businesses';
const DEFAULT_DESCRIPTION = 'Posify is a modern POS platform for African businesses. Manage sales, inventory, staff, and analytics in one system. 15-day free trial.';

export default function SEO({
  title,
  description,
  canonical,
  openGraph,
  jsonLd,
  noindex = false,
  nofollow = false,
}) {
  useEffect(() => {
    const robots = `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;

    document.title = title || DEFAULT_TITLE;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.name = 'description';
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.content = description || DEFAULT_DESCRIPTION;

    let robotsTag = document.querySelector('meta[name="robots"]');
    if (!robotsTag) {
      robotsTag = document.createElement('meta');
      robotsTag.name = 'robots';
      document.head.appendChild(robotsTag);
    }
    robotsTag.content = robots;

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonical || window.location.origin + window.location.pathname;

    const existingOg = {};
    document.head.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach((tag) => {
      const key = tag.getAttribute('property') || tag.getAttribute('name');
      existingOg[key] = tag;
    });

    const ogData = {
      'og:title': title || DEFAULT_TITLE,
      'og:description': description || DEFAULT_DESCRIPTION,
      'og:url': canonical || window.location.href,
      'og:type': 'website',
      ...openGraph,
    };

    Object.entries(ogData).forEach(([key, value]) => {
      if (!value) return;
      let tag = existingOg[key];
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(key.startsWith('og:') ? 'property' : 'name', key);
        document.head.appendChild(tag);
      }
      tag.content = value;
    });

    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.name = 'twitter:card';
      document.head.appendChild(twitterCard);
    }
    twitterCard.content = 'summary_large_image';

    const existingJsonLd = document.getElementById('json-ld');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'json-ld';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const cleanup = document.getElementById('json-ld');
      if (cleanup) cleanup.remove();
    };
  }, [title, description, canonical, openGraph, jsonLd, noindex, nofollow]);

  return null;
}
