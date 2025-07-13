import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    githubUsername?: string;
  }

  interface JWT {
    accessToken?: string;
    githubUsername?: string;
  }
}