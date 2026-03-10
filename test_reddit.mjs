import { getRedditTrends } from './server/lib/trends/redditFetcher.js';

const result = await getRedditTrends('instagram', 'fitness');
console.log('Reddit trends:', result);
