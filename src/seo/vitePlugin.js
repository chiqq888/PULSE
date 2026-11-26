import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { renderHtmlMetadata } from './head.js';
import { EXPLORE_METADATA, getEventMetadata, HOME_METADATA, NOINDEX_METADATA } from './metadata.js';

async function getPublicEvents(url, key) {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const events = [];
  let lastId;

  while (true) {
    let query = client.from('events')
      .select('id,title,description,posterUrl')
      .in('status', ['published', 'closed'])
      .order('id')
      .limit(500);
    if (lastId !== undefined) query = query.gt('id', lastId);

    const { data, error } = await query.abortSignal(AbortSignal.timeout(10_000));
    if (error) throw new Error(`Could not load public events for SEO: ${error.message}`);
    if (data.length === 0) return events;

    events.push(...data);
    lastId = data.at(-1).id;
  }
}

function renderSitemap(urls) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

export function seoPlugin() {
  let config;

  return {
    name: 'pulse-seo',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    transformIndexHtml(html) {
      return renderHtmlMetadata(html, HOME_METADATA);
    },
    generateBundle: {
      order: 'post',
      async handler(_options, bundle) {
        const html = bundle['index.html']?.source;
        if (typeof html !== 'string') {
          this.error('The built index.html is required to generate SEO pages.');
        }

        const { env, publicDir } = config;
        const url = env.VITE_SUPABASE_URL?.trim();
        const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || env.VITE_SUPABASE_ANON_KEY?.trim();
        let events = [];
        if (url && key) {
          events = await getPublicEvents(url, key);
        } else {
          this.warn('Supabase URL or publishable key is missing. Event previews were skipped.');
        }

        const staticEvents = events.filter(({ id }) => /^[A-Za-z0-9_-]{1,200}$/.test(id));
        if (staticEvents.length !== events.length) {
          this.warn(`${events.length - staticEvents.length} event IDs could not be used as static filenames.`);
        }

        // A new event list gets a new directory so old ZIP extracts cannot serve removed event pages.
        const ids = staticEvents.map(({ id }) => id);
        const revision = createHash('sha256').update(JSON.stringify(ids)).digest('hex').slice(0, 16);
        const eventDirectory = `_seo/events-${revision}`;
        const apacheConfig = await readFile(join(publicDir, '.htaccess'), 'utf8');
        const emit = (fileName, source) => this.emitFile({ type: 'asset', fileName, source });

        emit('.htaccess', apacheConfig.replaceAll('__PULSE_EVENT_DIRECTORY__', eventDirectory));
        emit('explore.html', renderHtmlMetadata(html, EXPLORE_METADATA));
        emit('noindex.html', renderHtmlMetadata(html, NOINDEX_METADATA));

        const urls = [HOME_METADATA.url, EXPLORE_METADATA.url];
        for (const event of staticEvents) {
          const metadata = getEventMetadata(event);
          emit(`${eventDirectory}/event-${event.id}.html`, renderHtmlMetadata(html, metadata));
          urls.push(metadata.url);
        }
        emit('sitemap.xml', renderSitemap(urls));
      },
    },
  };
}
