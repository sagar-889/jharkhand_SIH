import { createBrowserRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DestinationsPage from './pages/DestinationsPage';
import DestinationDetailPage from './pages/DestinationDetailPage';
import ItineraryPlannerPage from './pages/ItineraryPlannerPage';
import ItineraryResultPage from './pages/ItineraryResultPage';
import MapsTransportPage from './pages/MapsTransportPage';
import MarketplacePage from './pages/MarketplacePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import ProviderPortalPage from './pages/ProviderPortalPage';
import ProviderDashboardPage from './pages/ProviderDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import App from './App';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: 'destinations',
          element: <DestinationsPage />,
        },
        {
          path: 'destinations/:id',
          element: <DestinationDetailPage />,
        },
        {
          path: 'itinerary',
          element: <ItineraryPlannerPage />,
        },
        {
          path: 'itinerary/result',
          element: <ItineraryResultPage />,
        },
        {
          path: 'maps-transport',
          element: <MapsTransportPage />,
        },
        {
          path: 'marketplace',
          element: <MarketplacePage />,
        },
        {
          path: 'marketplace/:id',
          element: <ProductDetailPage />,
        },
        {
          path: 'checkout',
          element: <CheckoutPage />,
        },
        {
          path: 'provider',
          element: <ProviderPortalPage />,
        },
        {
          path: 'provider/dashboard',
          element: <ProviderDashboardPage />,
        },
        {
          path: 'admin/dashboard',
          element: <AdminDashboardPage />,
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);