import { NextResponse } from 'next/server';

const mockData = [
  {
    id: 1,
    host: "Christine Brooks",
    eventTitle: "Dough & Design Night",
    location: "123 Green Hall 28",
    date: "04 Sep 2025",
    rsvps: 100,
    status: "pending",
    eventType: "social",
  },
  {
    id: 2,
    host: "Wellness Collective",
    eventTitle: "Run & Refuel",
    location: "123 Green Hall 28",
    date: "05 Sep 2025",
    rsvps: 50,
    status: "pending",
    eventType: "athletic",
  },
  {
    id: 3,
    host: "Caribbean Students As...",
    eventTitle: "Taste of the Tropics",
    location: "123 Green Hall 28",
    date: "23 Nov 2025",
    rsvps: 200,
    status: "pending",
    eventType: "social",
  },
  {
    id: 4,
    host: "UX Collective",
    eventTitle: "Design Your Resume",
    location: "123 Green Hall 28",
    date: "05 Feb 2025",
    rsvps: 20,
    status: "pending",
    eventType: "career",
  },
  {
    id: 5,
    host: "Women in Business",
    eventTitle: "LinkedIn & Lemonade",
    location: "123 Green Hall 28",
    date: "29 Jul 2025",
    rsvps: 1000,
    status: "pending",
    eventType: "career",
  },
  {
    id: 6,
    host: "Fine Arts Society",
    eventTitle: "Ceramics & Chill",
    location: "123 Green Hall 28",
    date: "15 Aug 2025",
    rsvps: 300,
    status: "pending",
    eventType: "academic",
  },
  {
    id: 7,
    host: "Computer Science Club",
    eventTitle: "Byte & Brew",
    location: "123 Green Hall 28",
    date: "21 Dec 2025",
    rsvps: 30,
    status: "pending",
    eventType: "academic",
  },
  {
    id: 8,
    host: "Roots & Rhythms",
    eventTitle: "Midnight Munchies Mixer",
    location: "123 Green Hall 28",
    date: "30 Apr 2015",
    rsvps: 80,
    status: "pending",
    eventType: "social",
  },
  {
    id: 9,
    host: "Women in STEM",
    eventTitle: "Coffee & Connections",
    location: "123 Green Hall 28",
    date: "09 Jan 2025",
    rsvps: 30,
    status: "pending",
    eventType: "leadership",
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim() || '';

    if (!query) {
      return NextResponse.json({ results: [], query: '' });
    }

    // Ensure mockData is an array
    const dataArray = Array.isArray(mockData) ? mockData : [];

    if (dataArray.length === 0) {
      console.error('mockData is empty or not an array');
      return NextResponse.json({ 
        results: [], 
        query,
        total: 0 
      });
    }

    // Search across all fields
    const results = dataArray.filter((item: any) => {
      const searchableText = [
        item.host || '',
        item.eventTitle || '',
        item.location || '',
        item.date || '',
        item.status || '',
        item.eventType || '',
        item.rsvps?.toString() || '',
      ].join(' ').toLowerCase();

      const queryWords = query.split(' ').filter(word => word.length > 0);
      return queryWords.every(word => searchableText.includes(word));
    });

    // Sort by relevance
    results.sort((a: any, b: any) => {
      const aTitle = (a.eventTitle || '').toLowerCase();
      const bTitle = (b.eventTitle || '').toLowerCase();
      const aStartsWith = aTitle.startsWith(query);
      const bStartsWith = bTitle.startsWith(query);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return 0;
    });

    return NextResponse.json({ 
      results: results.slice(0, 10), 
      query,
      total: results.length 
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Search failed',
        results: [] 
      }, 
      { status: 500 }
    );
  }
}