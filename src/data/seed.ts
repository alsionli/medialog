import type { LogEntry, MediaCategory, MediaSuggestion } from '../types/media'

export const categoryMeta: Record<
  MediaCategory,
  {
    label: string
    cardLabel: string
    actionLabel: string
    angle: string
    sourceHint: string
    sourceHeadline: string
    panelTitle: string
  }
> = {
  screen: {
    label: 'Movies',
    cardLabel: 'Movies',
    actionLabel: 'Watched',
    angle: '32',
    sourceHint: 'Trending on TMDB',
    sourceHeadline: 'Weekly trending picks',
    panelTitle: 'Movies',
  },
  album: {
    label: 'Albums',
    cardLabel: 'Albums',
    actionLabel: 'Listened',
    angle: '21',
    sourceHint: 'Most played on Apple Music',
    sourceHeadline: 'Most played this week',
    panelTitle: 'Albums',
  },
  book: {
    label: 'Books',
    cardLabel: 'Books',
    actionLabel: 'Read',
    angle: '18',
    sourceHint: 'Trending on Open Library',
    sourceHeadline: 'Current reading momentum',
    panelTitle: 'Books',
  },
}

export const categoryDetailMeta: Record<
  MediaCategory,
  {
    title: string
    topMetricLabel: string
    topMetricValue: string
    listTitle: string
    listWindowLabel: string
    genreTitle: string
    genreLegend: string
    tickerStatus: string
    tickerText: string
    rowMetricLabel: string
  }
> = {
  album: {
    title: 'Albums',
    topMetricLabel: 'Avg. Daily Hours',
    topMetricValue: '4.2h',
    listTitle: 'Recent Rotations',
    listWindowLabel: 'Last 30 Days',
    genreTitle: 'Top Genres',
    genreLegend: 'Electronic (42%)',
    tickerStatus: 'Now Playing',
    tickerText: "Texas Hold 'Em — Beyonce",
    rowMetricLabel: 'Play time',
  },
  screen: {
    title: 'Movies',
    topMetricLabel: 'Avg. Daily Hours',
    topMetricValue: '2.7h',
    listTitle: 'Recent Watches',
    listWindowLabel: 'Last 30 Days',
    genreTitle: 'Top Genres',
    genreLegend: 'Drama (38%)',
    tickerStatus: 'Now Watching',
    tickerText: 'Shogun — Episode 07',
    rowMetricLabel: 'Runtime',
  },
  book: {
    title: 'Books',
    topMetricLabel: 'Avg. Daily Pages',
    topMetricValue: '84p',
    listTitle: 'Recent Reads',
    listWindowLabel: 'Last 30 Days',
    genreTitle: 'Top Genres',
    genreLegend: 'Literary Fiction (47%)',
    tickerStatus: 'Now Reading',
    tickerText: 'North Woods — Daniel Mason',
    rowMetricLabel: 'Session',
  },
}

export const fallbackSuggestions: Record<MediaCategory, MediaSuggestion[]> = {
  screen: [
    {
      id: 'screen-dune-2',
      category: 'screen',
      title: 'Dune: Part Two',
      creator: 'Denis Villeneuve',
      releaseDate: '2024-03-01',
      coverUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      source: 'manual',
      sourceLabel: 'Curated fallback',
      subtitle: 'Sci-fi epic',
    },
    {
      id: 'screen-past-lives',
      category: 'screen',
      title: 'Past Lives',
      creator: 'Celine Song',
      releaseDate: '2023-06-02',
      coverUrl: 'https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
      source: 'manual',
      sourceLabel: 'Curated fallback',
      subtitle: 'Romantic drama',
    },
    {
      id: 'screen-shogun',
      category: 'screen',
      title: 'Shogun',
      creator: 'Rachel Kondo, Justin Marks',
      releaseDate: '2024-02-27',
      coverUrl: 'https://image.tmdb.org/t/p/w500/8T39W6oVSeiLKnkWKlz4dGCdR4H.jpg',
      source: 'manual',
      sourceLabel: 'Curated fallback',
      subtitle: 'Historical series',
    },
  ],
  book: [
    {
      id: 'book-bee-sting',
      category: 'book',
      title: 'The Bee Sting',
      creator: 'Paul Murray',
      releaseDate: '2023-06-08',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780241353936-L.jpg',
      source: 'manual',
      sourceLabel: 'Curated fallback',
      subtitle: 'Literary fiction',
    },
    {
      id: 'book-yellowface',
      category: 'book',
      title: 'Yellowface',
      creator: 'R. F. Kuang',
      releaseDate: '2023-05-16',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780063250833-L.jpg',
      source: 'manual',
      sourceLabel: 'Curated fallback',
      subtitle: 'Satire',
    },
    {
      id: 'book-north-woods',
      category: 'book',
      title: 'North Woods',
      creator: 'Daniel Mason',
      releaseDate: '2023-09-19',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593597033-L.jpg',
      source: 'manual',
      sourceLabel: 'Curated fallback',
      subtitle: 'Multi-generational novel',
    },
  ],
  album: [
    {
      id: 'album-cowboy-carter',
      category: 'album',
      title: 'Cowboy Carter',
      creator: 'Beyonce',
      releaseDate: '2024-03-29',
      coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/50/a5/ed/50a5ed91-1af2-5ec5-a00b-fd88eb39d93c/196871104003.jpg/600x600bb.jpg',
      source: 'manual',
      sourceLabel: 'Curated fallback',
      subtitle: 'Country pop',
    },
    {
      id: 'album-wall-of-eyes',
      category: 'album',
      title: 'Wall of Eyes',
      creator: 'The Smile',
      releaseDate: '2024-01-26',
      coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ef/1d/26/ef1d264d-f498-c6c2-0faa-cbc0aee78f20/191404139195.png/600x600bb.jpg',
      source: 'manual',
      sourceLabel: 'Curated fallback',
      subtitle: 'Alternative',
    },
    {
      id: 'album-blue-lips',
      category: 'album',
      title: 'Blue Lips',
      creator: 'Schoolboy Q',
      releaseDate: '2024-03-01',
      coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/f5/79/0e/f5790eb8-2f31-ed34-3f0f-88689b6c6fe0/24UM1IM06988.rgb.jpg/600x600bb.jpg',
      source: 'manual',
      sourceLabel: 'Curated fallback',
      subtitle: 'Hip-hop',
    },
  ],
}

export const initialEntries: LogEntry[] = [
  {
    id: 'entry-1',
    category: 'screen',
    title: 'Past Lives',
    creator: 'Celine Song',
    rating: 4.5,
    notes: 'A precise, quiet romantic drama that lingers for days.',
    loggedAt: '2026-01-18',
    releaseDate: '2023-06-02',
    coverUrl: fallbackSuggestions.screen[1].coverUrl,
    source: 'manual',
    sourceLabel: 'Curated fallback',
  },
  {
    id: 'entry-2',
    category: 'album',
    title: 'Wall of Eyes',
    creator: 'The Smile',
    rating: 4,
    notes: 'Dense arrangements, but still strangely airy on repeat.',
    loggedAt: '2026-02-02',
    releaseDate: '2024-01-26',
    coverUrl: fallbackSuggestions.album[1].coverUrl,
    source: 'manual',
    sourceLabel: 'Curated fallback',
  },
  {
    id: 'entry-3',
    category: 'book',
    title: 'The Bee Sting',
    creator: 'Paul Murray',
    rating: 5,
    notes: 'Huge emotional range and a very controlled sense of dread.',
    loggedAt: '2026-02-21',
    releaseDate: '2023-06-08',
    coverUrl: fallbackSuggestions.book[0].coverUrl,
    source: 'manual',
    sourceLabel: 'Curated fallback',
  },
  {
    id: 'entry-4',
    category: 'screen',
    title: 'Dune: Part Two',
    creator: 'Denis Villeneuve',
    rating: 4.5,
    notes: 'Scale, sound, and world-building all hit exactly right.',
    loggedAt: '2026-03-06',
    releaseDate: '2024-03-01',
    coverUrl: fallbackSuggestions.screen[0].coverUrl,
    source: 'manual',
    sourceLabel: 'Curated fallback',
  },
]
