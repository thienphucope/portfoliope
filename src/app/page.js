import { redirect } from 'next/navigation';

// Root and /casearchive render the same feed. Send / to the canonical archive
// path so the site has one home. Temporary (307) — swap to permanentRedirect
// for SEO consolidation once the layout's settled.
export default function HomePage() {
  redirect('/casearchive');
}
