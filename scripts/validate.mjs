// Checks every post against the rules. Exit code 1 means at least one post failed.
import { loadAndValidate, report } from './lib.mjs';

const posts = loadAndValidate();
if (!posts.length) console.log('No posts found in /posts.');
process.exit(report(posts) ? 0 : 1);
