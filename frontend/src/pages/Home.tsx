export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          Team CalTalk
        </h1>
        <p className="text-xl text-gray-600">
          프론트엔드 기반 구조가 성공적으로 구축되었습니다
        </p>
        <div className="mt-8 space-y-2 text-sm text-gray-500">
          <p>✅ React 18 + TypeScript</p>
          <p>✅ Vite 5.4</p>
          <p>✅ React Router v6</p>
          <p>✅ TanStack Query v5</p>
          <p>✅ Zustand v4</p>
          <p>✅ Tailwind CSS v3</p>
        </div>
      </div>
    </div>
  );
}
