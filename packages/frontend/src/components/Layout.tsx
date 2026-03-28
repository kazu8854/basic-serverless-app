import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@cloudscape-design/components/app-layout';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { user, login, logout, isMock } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Define Top Navigation Header
  const headerNavigation = (
    <TopNavigation
      identity={{
        href: '/',
        title: 'Serverless App Boilerplate',
      }}
      utilities={[
        {
          type: 'button',
          text: isMock ? 'Mock Mode' : 'AWS Mode',
          iconName: 'settings',
        },
        user
          ? {
              type: 'menu-dropdown',
              text: user.name,
              iconName: 'user-profile',
              items: [{ id: 'signout', text: 'Sign out' }],
              onItemClick: (e) => {
                if (e.detail.id === 'signout') logout();
              },
            }
          : {
              type: 'button',
              text: 'Sign in',
              onClick: () => login(),
            },
      ]}
    />
  );

  // Define Side Navigation Items
  const sideNavigation = (
    <SideNavigation
      activeHref={location.pathname}
      onFollow={(event) => {
        if (!event.detail.external) {
          event.preventDefault();
          navigate(event.detail.href);
        }
      }}
      header={{ text: 'Navigation', href: '/' }}
      items={[
        { type: 'link', text: 'Dashboard', href: '/' },
        { type: 'link', text: 'Users API Test', href: '/users' },
      ]}
    />
  );

  return (
    <>
      <div id="h" style={{ position: 'sticky', top: 0, zIndex: 1002 }}>
        {headerNavigation}
      </div>
      <AppLayout
        navigation={sideNavigation}
        toolsHide
        content={<Outlet />} // The children pages will be rendered here
      />
    </>
  );
}
