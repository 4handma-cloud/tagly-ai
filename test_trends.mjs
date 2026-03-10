import { getGoogleTrends } from './server/lib/trends/googleTrendsFetcher.js';

const result = await getGoogleTrends('fitness', 'IN');
console.log('Google trends:', result);
