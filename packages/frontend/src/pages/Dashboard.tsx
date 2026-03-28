import React from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import { useAuth } from '../contexts/AuthContext';

import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, isMock } = useAuth();
  const navigate = useNavigate();

  return (
    <ContentLayout
      header={
        <Header variant="h1" description="Welcome to your new enterprise architecture.">
          Dashboard
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Container header={<Header variant="h2">Environment Status</Header>}>
          <SpaceBetween direction="vertical" size="m">
            <div>
              <strong>Mode: </strong>
              {isMock ? (
                <span style={{ color: 'orange' }}>Mocking (Local)</span>
              ) : (
                <span style={{ color: 'green' }}>AWS (Real)</span>
              )}
            </div>
            {!user ? (
              <p>Please use the top navigation to sign in and unlock features.</p>
            ) : (
              <p>Hello, {user.name}! You are logged in.</p>
            )}
          </SpaceBetween>
        </Container>

        <Container
          header={
            <Header
              variant="h2"
              actions={
                <Button 
                  variant="primary" 
                  href="/users"
                  onFollow={(e) => {
                    e.preventDefault();
                    navigate('/users');
                  }}
                >
                  Test Users API
                </Button>
              }
            >
              Test Hono RPC
            </Header>
          }
        >
          <p>
            This boilerplate demonstrates End-to-End Type Safety using Hono RPC. 
            Click the button above to test the actual backend API connection.
          </p>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}
