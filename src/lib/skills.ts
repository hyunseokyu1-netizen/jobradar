// 스킬 자동완성 후보 카탈로그.
// 온보딩·프로필의 스킬 입력에서 자동완성 제안으로 사용한다.
// 호주/NZ IT 채용공고에서 흔히 요구되는 기술 위주로 구성 (자유 입력도 항상 허용).

export const SKILL_SUGGESTIONS: string[] = [
  // 언어
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'C', 'Go', 'Rust',
  'Kotlin', 'Swift', 'PHP', 'Ruby', 'Scala', 'Dart', 'R', 'MATLAB', 'Perl',
  'Objective-C', 'Elixir', 'Haskell', 'Solidity', 'SQL', 'GraphQL', 'Bash', 'PowerShell',

  // 프론트엔드
  'React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'Svelte', 'SvelteKit',
  'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'styled-components', 'Redux', 'Zustand',
  'React Query', 'Webpack', 'Vite', 'Storybook', 'Three.js', 'D3.js', 'WebGL',
  'Web Components', 'Micro Frontends', 'PWA', 'WebSocket', 'WebRTC',

  // 모바일
  'React Native', 'Flutter', 'SwiftUI', 'UIKit', 'Jetpack Compose',
  'Android', 'iOS', 'Expo', 'Ionic', 'Xamarin',

  // 백엔드
  'Node.js', 'Express', 'NestJS', 'Fastify', 'Django', 'Flask', 'FastAPI',
  'Spring Boot', 'Spring', 'ASP.NET Core', '.NET', 'Laravel', 'Ruby on Rails',
  'Gin', 'Echo', 'Ktor', 'Phoenix', 'gRPC', 'REST API', 'Microservices',
  'Serverless', 'Event-Driven Architecture', 'Domain-Driven Design',

  // 데이터베이스
  'PostgreSQL', 'MySQL', 'SQLite', 'SQL Server', 'Oracle', 'MongoDB',
  'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra', 'Neo4j', 'Supabase',
  'Firebase', 'Prisma', 'TypeORM', 'Sequelize', 'Hibernate',

  // 클라우드 / DevOps
  'AWS', 'Azure', 'Google Cloud', 'Vercel', 'Cloudflare', 'Heroku',
  'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Pulumi', 'Helm',
  'CI/CD', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI', 'ArgoCD',
  'Linux', 'Nginx', 'Apache', 'Prometheus', 'Grafana', 'Datadog', 'New Relic',
  'CloudFormation', 'Lambda', 'EC2', 'S3', 'ECS', 'EKS', 'RDS',

  // 데이터 / AI
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'LLM',
  'TensorFlow', 'PyTorch', 'scikit-learn', 'Keras', 'Hugging Face', 'LangChain',
  'RAG', 'Prompt Engineering', 'OpenAI API', 'Claude API',
  'Pandas', 'NumPy', 'Jupyter', 'Spark', 'Hadoop', 'Kafka', 'Airflow', 'dbt',
  'Snowflake', 'BigQuery', 'Redshift', 'Databricks', 'ETL', 'Data Engineering',
  'Data Analysis', 'Data Visualization', 'Power BI', 'Tableau', 'Looker',

  // 테스트 / 품질
  'Jest', 'Vitest', 'Cypress', 'Playwright', 'Selenium', 'Testing Library',
  'JUnit', 'pytest', 'TDD', 'Unit Testing', 'E2E Testing', 'QA Automation',

  // 협업 / 방법론
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Agile',
  'Scrum', 'Kanban', 'Code Review', 'Pair Programming', 'Technical Writing',

  // 보안 / 기타
  'OAuth', 'JWT', 'SSO', 'Penetration Testing', 'OWASP', 'Cybersecurity',
  'Blockchain', 'Web3', 'IoT', 'Embedded Systems', 'Unity', 'Unreal Engine',
  'Figma', 'UI/UX Design', 'Accessibility', 'SEO', 'Performance Optimization',
  'System Design', 'Distributed Systems', 'Message Queue', 'RabbitMQ',
  'Salesforce', 'SAP', 'ServiceNow', 'Stripe', 'Twilio',
]
