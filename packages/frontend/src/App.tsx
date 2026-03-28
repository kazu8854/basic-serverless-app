import { useState } from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { User } from '@basic-serverless-app/shared';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const isMock = import.meta.env.VITE_MOCK_AWS === 'true';

  const login = () => {
    if (isMock) {
      // Mock Login
      setUser({
        id: 'mock-uuid-123',
        name: 'Mock User',
        email: 'mock@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // AWS Cognito Login Placeholder
      window.location.href = '/auth/login';
    }
  };

  const logout = () => setUser(null);

  return (
    <AppLayout
      navigationHide
      toolsHide
      content={
        <Container
          header={
            <Header variant="h1" description="A simple scalable serverless architecture test.">
              Serverless App Boilerplate
            </Header>
          }
        >
          <SpaceBetween direction="vertical" size="m">
            <div>
              <h3>Environment: {isMock ? 'Mocking (Local)' : 'AWS (Real)'}</h3>
            </div>
            
            {!user ? (
              <Button onClick={login} variant="primary">
                Login
              </Button>
            ) : (
              <SpaceBetween direction="vertical" size="s">
                <p>Hello, {user.name}!</p>
                <Button onClick={logout}>Logout</Button>
              </SpaceBetween>
            )}
          </SpaceBetween>
        </Container>
      }
    />
  );
}

export default App;
