import { LocationProvider, Route, Router } from 'preact-iso';
import { BASE } from './routes';
import { Home } from './pages/home';
import { Library } from './pages/library';
import { NotFound } from './pages/not-found';
import { ModePage } from './pages/mode';
import { Scales } from './pages/scales';
import { Start } from './pages/start';

/** Routes below the base path. Add new pages here. */
function Pages() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/scales" component={Scales} />
      <Route path="/scales/:id" component={ModePage} />
      <Route path="/library" component={Library} />
      <Route path="/start" component={Start} />
      <Route default component={NotFound} />
    </Router>
  );
}

export function App() {
  return (
    <LocationProvider scope={BASE || undefined}>
      <Router>
        {/* `/psaltis` and `/psaltis/anything` both hand the remainder to <Pages>. */}
        <Route path={BASE || '/'} component={Pages} />
        <Route path={`${BASE}/*`} component={Pages} />
        <Route default component={NotFound} />
      </Router>
    </LocationProvider>
  );
}
