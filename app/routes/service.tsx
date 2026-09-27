import { data } from 'react-router';
import type { Route } from './+types/service';
import { getService } from '~/data/services';

export function loader({ params }: Route.LoaderArgs) {
  const service = getService(params.slug);
  if (!service) throw data(null, { status: 404 });
  return { service };
}

export default function Service({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.service.title}</h1>;
}
