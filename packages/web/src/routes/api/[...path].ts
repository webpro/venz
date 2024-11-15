import type { APIEvent } from '@solidjs/start/server';

const WORKER_HOST = import.meta.env.VITE_WORKER_HOST;

export async function GET({ params, request }: APIEvent) {
  const path = params.path;
  const url = new URL(path, WORKER_HOST);
  const headers = Object.fromEntries(request.headers.entries());
  return fetch(url, { headers });
}

export async function POST({ params, request }: APIEvent) {
  const path = params.path;
  const url = new URL(path, WORKER_HOST);
  const headers = Object.fromEntries(request.headers.entries());
  const body = await request.text();
  return fetch(url, { method: 'POST', headers, body });
}
