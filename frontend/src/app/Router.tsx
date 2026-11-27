import { useRoutes, type RouteObject } from 'react-router-dom';
import { routeConfig } from './routeConfig';

export function AppRouter() {
  return useRoutes([...routeConfig] as RouteObject[]);
}
