import { type RouteConfig, index, layout, prefix, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'),
  route('post/:postId', 'routes/post.tsx'),
  // 两种不同的nested
    layout('routes/dashboard.tsx', [route('finances', 'routes/finance.tsx'), route('personal-info', 'routes/personal-info.tsx')]),
  //   route('dashboard', 'routes/dashboard.tsx', [route('finance', 'routes/finance.tsx'), route('personalInfo', 'routes/personal-info.tsx')]),

  // 加前缀
//   layout('routes/dashboard.tsx', [...prefix('pedro', [route('finance', 'routes/finance.tsx'), route('personalInfo', 'routes/personal-info.tsx')])]),
] satisfies RouteConfig;
