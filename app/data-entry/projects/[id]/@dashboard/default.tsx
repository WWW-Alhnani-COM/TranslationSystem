// src/app/data-entry/projects/[id]/@dashboard/default.tsx
import { redirect } from 'next/navigation';

export default function DefaultProjectDetailsPage() {
  redirect('/data-entry/projects/[id]');
}