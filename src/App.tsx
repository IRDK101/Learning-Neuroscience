import { createHashRouter, Navigate, RouterProvider, useSearchParams } from 'react-router';
import { Layout } from './ui/Layout';
import { HomePage } from './features/home/HomePage';
import { LearnPage } from './features/learn/LearnPage';
import { TopicPage } from './features/learn/TopicPage';
import { LessonPage } from './features/learn/LessonPage';
import { MapIndex, MapPage } from './features/map/MapPage';
import { EntityPage } from './features/entity/EntityPage';
import { CardsPage } from './features/cards/CardsPage';
import { QuizPage } from './features/quiz/QuizPage';
import { PlayPage } from './features/play/PlayPage';
import { FindGame } from './features/play/FindGame';
import { PathwayGame } from './features/play/PathwayGame';
import { ProgressPage } from './features/progress/ProgressPage';
import { AboutPage } from './features/about/AboutPage';
import { content } from './content';

/** #/map?region=amygdala → the first diagram that has that region. */
function MapRedirect() {
  const [params] = useSearchParams();
  const region = params.get('region');
  if (region) {
    const d = content.diagramsFor[region]?.[0];
    if (d) return <Navigate to={`/map/${d}?focus=${region}`} replace />;
    return <Navigate to={`/entity/${region}`} replace />;
  }
  return <MapIndex />;
}

function NotFound() {
  return (
    <div className="panel">
      <h1>Page not found</h1>
      <p>That link doesn't point to anything (yet). Content may have moved.</p>
      <a href="#/">Go home</a>
    </div>
  );
}

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/learn', element: <LearnPage /> },
      { path: '/learn/:topic', element: <TopicPage /> },
      { path: '/learn/:topic/:lesson', element: <LessonPage /> },
      { path: '/map', element: <MapRedirect /> },
      { path: '/map/:diagram', element: <MapPage /> },
      { path: '/entity/:id', element: <EntityPage /> },
      { path: '/cards', element: <CardsPage /> },
      { path: '/quiz', element: <QuizPage /> },
      { path: '/play', element: <PlayPage /> },
      { path: '/play/find', element: <FindGame /> },
      { path: '/play/pathway', element: <PathwayGame /> },
      { path: '/progress', element: <ProgressPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/corrections', element: <Navigate to="/about" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
