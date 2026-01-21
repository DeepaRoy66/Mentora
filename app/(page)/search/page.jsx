import { Suspense } from "react";
import SearchResultsClient from "./search";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="pt-20 text-center">Loading search...</div>}>
      <SearchResultsClient />
    </Suspense>
  );
}
