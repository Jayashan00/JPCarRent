import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './lib/auth';
import { useCurrency } from './lib/currency';
import { ToastProvider, ConfirmProvider } from './components/ui';
import SiteLayout from './components/SiteLayout';

import Home from './pages/site/Home';
import Fleet from './pages/site/Fleet';
import VehicleDetail from './pages/site/VehicleDetail';
import Checkout from './pages/site/Checkout';
import BookingDone from './pages/site/BookingDone';
import RoutesPage from './pages/site/RoutesPage';
import Services from './pages/site/Services';
import About from './pages/site/About';
import Contact from './pages/site/Contact';
import Faq from './pages/site/Faq';
import CmsPage from './pages/site/CmsPage';
import { Login, Register, Forgot } from './pages/site/Auth';
import NotFound from './pages/site/NotFound';
import Invoice from './pages/site/Invoice';
import Agreement from './pages/site/Agreement';
import Compare from './pages/site/Compare';
import ManageBooking from './pages/site/ManageBooking';
import Credits from './pages/site/Credits';

import AccountLayout from './pages/account/AccountLayout';
import AccOverview from './pages/account/Overview';
import AccBookings from './pages/account/Bookings';
import AccFavorites from './pages/account/Favorites';
import AccReviews from './pages/account/Reviews';
import AccDocuments from './pages/account/Documents';
import AccNotifications from './pages/account/Notifications';
import AccProfile from './pages/account/Profile';

import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminBookings from './pages/admin/Bookings';
import AdminCalendar from './pages/admin/Calendar';
import AdminVehicles from './pages/admin/Vehicles';
import AdminMessages from './pages/admin/Messages';
import AdminReviews from './pages/admin/Reviews';
import AdminCustomers from './pages/admin/Customers';
import AdminHomepage from './pages/admin/Homepage';
import AdminSettings from './pages/admin/Settings';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';
import * as R from './pages/admin/resources';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  useCurrency(); // re-render prices when the visitor switches currency
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <ScrollTop />
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="fleet" element={<Fleet />} />
              <Route path="fleet/:id" element={<VehicleDetail />} />
              <Route path="book/:id" element={<Checkout />} />
              <Route path="booking/:ref" element={<BookingDone />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="services" element={<Services />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="faq" element={<Faq />} />
              <Route path="compare" element={<Compare />} />
              <Route path="credits" element={<Credits />} />
              <Route path="manage-booking" element={<ManageBooking />} />
              <Route path="terms" element={<CmsPage id="terms" />} />
              <Route path="privacy" element={<CmsPage id="privacy" />} />
              <Route path="cancellation" element={<CmsPage id="cancellation" />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<Forgot />} />
              <Route path="account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
                <Route index element={<AccOverview />} />
                <Route path="bookings" element={<AccBookings />} />
                <Route path="saved" element={<AccFavorites />} />
                <Route path="reviews" element={<AccReviews />} />
                <Route path="documents" element={<AccDocuments />} />
                <Route path="notifications" element={<AccNotifications />} />
                <Route path="profile" element={<AccProfile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="invoice/:id" element={<RequireAuth><Invoice /></RequireAuth>} />
            <Route path="agreement/:id" element={<RequireAuth admin><Agreement /></RequireAuth>} />
            <Route path="admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
              <Route index element={<Dashboard />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="vehicles" element={<AdminVehicles />} />
              <Route path="categories" element={<R.Categories />} />
              <Route path="extras" element={<R.Extras />} />
              <Route path="locations" element={<R.Locations />} />
              <Route path="promos" element={<R.Promos />} />
              <Route path="maintenance" element={<R.Maintenance />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="drivers" element={<R.Drivers />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="homepage" element={<AdminHomepage />} />
              <Route path="services" element={<R.ServicesAdmin />} />
              <Route path="tours" element={<R.Tours />} />
              <Route path="why-us" element={<R.WhyUs />} />
              <Route path="steps" element={<R.Steps />} />
              <Route path="destinations" element={<R.Destinations />} />
              <Route path="faqs" element={<R.Faqs />} />
              <Route path="pages" element={<R.Pages />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="seasons" element={<R.Seasons />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
