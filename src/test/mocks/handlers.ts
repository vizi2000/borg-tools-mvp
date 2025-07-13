import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock tRPC endpoints
  http.post('/api/trpc/auth.getSession', () => {
    return HttpResponse.json({
      result: {
        data: {
          user: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://avatars.githubusercontent.com/u/123456?v=4',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });
  }),

  http.post('/api/trpc/cv.generate', () => {
    return HttpResponse.json({
      result: {
        data: {
          id: 'test-cv-id',
          status: 'generating',
          githubUsername: 'testuser',
          template: 'neon-tech',
          createdAt: new Date().toISOString(),
        },
      },
    });
  }),

  // Mock GitHub API
  http.get('https://api.github.com/user', () => {
    return HttpResponse.json({
      login: 'testuser',
      id: 123456,
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
      public_repos: 50,
      followers: 100,
      following: 75,
    });
  }),

  http.get('https://api.github.com/users/testuser/repos', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        description: 'A test repository',
        language: 'TypeScript',
        stargazers_count: 25,
        forks_count: 5,
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]);
  }),
];